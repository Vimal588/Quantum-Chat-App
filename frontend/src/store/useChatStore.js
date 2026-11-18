import { create } from 'zustand';
import api from '../services/api';
import wsService from '../services/websocket';
import {
  encapsulateSharedSecret,
  decapsulateSharedSecret,
} from '../crypto/pqc';
import {
  deriveAesKeyFromSecret,
  encryptMessage,
  decryptMessage,
  cacheSessionKey,
  getCachedSessionKey,
} from '../crypto/encryption';
import { useAuthStore } from './useAuthStore';

export const useChatStore = create((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [], // Array of decrypted messages for active conversation
  contacts: [],
  isLoadingMessages: false,
  isSending: false,
  typingStatus: {}, // { [conversationId]: { isTyping: boolean, senderName: string } }
  error: null,

  loadConversations: async () => {
    try {
      const res = await api.get('/conversations');
      set({ conversations: res.data });
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  },

  loadContacts: async () => {
    try {
      const res = await api.get('/contacts');
      set({ contacts: res.data });
    } catch (err) {
      console.error('Failed to load contacts:', err);
    }
  },

  selectConversation: async (conv) => {
    set({ activeConversation: conv, messages: [], isLoadingMessages: true });
    
    // Subscribe to STOMP conversation topic
    wsService.subscribe(`/topic/conversation.${conv.id}`, (incomingEnvelope) => {
      get().handleIncomingEnvelope(incomingEnvelope);
    });

    // Subscribe to typing topic
    wsService.subscribe(`/topic/conversation.${conv.id}.typing`, (typingNotification) => {
      const { user } = useAuthStore.getState();
      if (typingNotification.senderId !== user?.id) {
        set((state) => ({
          typingStatus: {
            ...state.typingStatus,
            [conv.id]: {
              isTyping: typingNotification.typing,
              senderName: typingNotification.senderName,
            },
          },
        }));
      }
    });

    await get().loadMessages(conv.id);
  },

  loadMessages: async (conversationId) => {
    set({ isLoadingMessages: true });
    const { localKeys, user } = useAuthStore.getState();
    const { activeConversation } = get();

    try {
      const res = await api.get(`/conversations/${conversationId}/messages`);
      const envelopes = res.data;

      const decryptedList = [];

      for (const env of envelopes) {
        try {
          let plaintext = '';
          const isSender = env.senderId === user?.id;

          if (isSender) {
            // Check if we have cached AES key for this conversation
            let aesKey = getCachedSessionKey(conversationId);
            if (!aesKey && env.kemCiphertext && activeConversation?.otherParticipantId) {
              // Can derive if we had recipient's key or saved session
              plaintext = '[Sent encrypted message]';
            }
            if (aesKey) {
              try {
                plaintext = await decryptMessage(env.ciphertext, env.nonce, aesKey);
              } catch (e) {
                plaintext = '[Encrypted payload]';
              }
            } else {
              plaintext = '[Encrypted payload]';
            }
          } else {
            // Incoming message sent to us! Decapsulate using our ML-KEM private key
            if (env.kemCiphertext && localKeys?.kemPrivateKey) {
              const sharedSecret = decapsulateSharedSecret(env.kemCiphertext, localKeys.kemPrivateKey);
              const aesKey = await deriveAesKeyFromSecret(sharedSecret);
              cacheSessionKey(conversationId, aesKey);
              plaintext = await decryptMessage(env.ciphertext, env.nonce, aesKey);
            } else {
              let aesKey = getCachedSessionKey(conversationId);
              if (aesKey) {
                plaintext = await decryptMessage(env.ciphertext, env.nonce, aesKey);
              } else {
                plaintext = '[Unable to decrypt: missing private key]';
              }
            }
          }

          decryptedList.push({
            id: env.id,
            conversationId: env.conversationId,
            senderId: env.senderId,
            senderName: env.senderName,
            isSender,
            plaintext,
            deliveryStatus: env.deliveryStatus,
            algorithmVersion: env.algorithmVersion,
            keyVersion: env.keyVersion,
            createdAt: env.createdAt,
            decryptedSuccessfully: true,
          });
        } catch (decErr) {
          console.error('Failed to decrypt envelope:', env.id, decErr);
          decryptedList.push({
            id: env.id,
            conversationId: env.conversationId,
            senderId: env.senderId,
            senderName: env.senderName,
            isSender: env.senderId === user?.id,
            plaintext: '⚠ Integrity Failure: Ciphertext could not be decrypted',
            deliveryStatus: env.deliveryStatus,
            algorithmVersion: env.algorithmVersion,
            createdAt: env.createdAt,
            decryptedSuccessfully: false,
          });
        }
      }

      set({ messages: decryptedList, isLoadingMessages: false });
    } catch (err) {
      console.error('Failed to load messages:', err);
      set({ isLoadingMessages: false, error: 'Could not load conversation history' });
    }
  },

  sendEncryptedMessage: async (text) => {
    if (!text.trim()) return;
    const { activeConversation } = get();
    const { user } = useAuthStore.getState();
    if (!activeConversation || !user) return;

    set({ isSending: true });

    try {
      const recipientId = activeConversation.otherParticipantId;

      // 1. Fetch recipient's active ML-KEM-768 public key from key directory
      const keyRes = await api.get(`/keys/${recipientId}`);
      const recipientKemPublicKey = keyRes.data.mlKemPublicKey;
      const keyVersion = keyRes.data.version || 1;

      // 2. Encapsulate a shared secret using ML-KEM-768
      const { sharedSecret, kemCiphertext } = encapsulateSharedSecret(recipientKemPublicKey);

      // 3. Derive 256-bit AES-GCM key via HKDF-SHA-256
      const aesKey = await deriveAesKeyFromSecret(sharedSecret);
      cacheSessionKey(activeConversation.id, aesKey);

      // 4. Encrypt message with AES-256-GCM using unique 96-bit CSPRNG Nonce
      const { ciphertext, nonce } = await encryptMessage(text.trim(), aesKey);

      const payload = {
        conversationId: activeConversation.id,
        recipientId,
        ciphertext,
        nonce,
        kemCiphertext,
        algorithmVersion: 'MLKEM768-AES256GCM',
        keyVersion,
        messageType: 'TEXT',
      };

      // 5. Send via WebSocket STOMP
      wsService.sendMessage('/app/chat.send', payload);

      // Optimistically add message to current chat window
      const localMsg = {
        id: 'local-' + Date.now(),
        conversationId: activeConversation.id,
        senderId: user.id,
        senderName: user.fullName,
        isSender: true,
        plaintext: text.trim(),
        deliveryStatus: 'SENT',
        algorithmVersion: 'MLKEM768-AES256GCM',
        keyVersion,
        createdAt: new Date().toISOString(),
        decryptedSuccessfully: true,
      };

      set((state) => ({
        messages: [...state.messages, localMsg],
        isSending: false,
      }));
    } catch (err) {
      console.error('Failed to send encrypted message:', err);
      set({ isSending: false, error: 'Failed to encrypt and deliver message' });
    }
  },

  handleIncomingEnvelope: async (envelope) => {
    const { user, localKeys } = useAuthStore.getState();
    const { activeConversation, messages } = get();

    if (!activeConversation || envelope.conversationId !== activeConversation.id) {
      // Reload conversation list to show new message indicator
      get().loadConversations();
      return;
    }

    // Ignore echo of our own message if already shown
    if (envelope.senderId === user?.id) {
      return;
    }

    try {
      let plaintext = '';
      if (envelope.kemCiphertext && localKeys?.kemPrivateKey) {
        const sharedSecret = decapsulateSharedSecret(envelope.kemCiphertext, localKeys.kemPrivateKey);
        const aesKey = await deriveAesKeyFromSecret(sharedSecret);
        cacheSessionKey(envelope.conversationId, aesKey);
        plaintext = await decryptMessage(envelope.ciphertext, envelope.nonce, aesKey);
      } else {
        const aesKey = getCachedSessionKey(envelope.conversationId);
        if (aesKey) {
          plaintext = await decryptMessage(envelope.ciphertext, envelope.nonce, aesKey);
        } else {
          plaintext = '[Encrypted payload]';
        }
      }

      const newMsg = {
        id: envelope.id,
        conversationId: envelope.conversationId,
        senderId: envelope.senderId,
        senderName: envelope.senderName,
        isSender: false,
        plaintext,
        deliveryStatus: envelope.deliveryStatus || 'DELIVERED',
        algorithmVersion: envelope.algorithmVersion,
        keyVersion: envelope.keyVersion,
        createdAt: envelope.createdAt,
        decryptedSuccessfully: true,
      };

      set({ messages: [...messages, newMsg] });

      // Send read receipt back
      wsService.sendMessage('/app/chat.receipt', {
        messageId: envelope.id,
        conversationId: envelope.conversationId,
        status: 'READ',
      });
    } catch (err) {
      console.error('Failed to decrypt incoming envelope:', err);
    }
  },

  sendTypingStatus: (isTyping) => {
    const { activeConversation } = get();
    if (!activeConversation) return;
    wsService.sendMessage('/app/chat.typing', {
      conversationId: activeConversation.id,
      typing: isTyping,
    });
  },

  startConversationWithUser: async (contactUserId) => {
    try {
      const res = await api.post('/conversations', { recipientId: contactUserId });
      const newConv = res.data;
      await get().loadConversations();
      get().selectConversation(newConv);
      return newConv;
    } catch (err) {
      console.error('Failed to start conversation:', err);
    }
  }
}));
