package com.quantumchat.service;

import com.quantumchat.dto.RegisterRequest;
import com.quantumchat.dto.SendMessageRequest;
import com.quantumchat.entity.Conversation;
import com.quantumchat.exception.BadRequestException;
import com.quantumchat.repository.ConversationRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev-h2")
@Transactional
public class ConversationAuthorizationTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private ConversationService conversationService;

    @Autowired
    private MessageService messageService;

    @Test
    @DisplayName("Authorization Test: Unauthorized user cannot read another conversation's messages")
    public void testUnauthorizedUserCannotAccessConversation() {
        // 1. Register Alice and Bob
        var alice = authService.register(RegisterRequest.builder()
                .fullName("Alice")
                .email("alice.crypto@test.com")
                .password("Password123!")
                .build());

        var bob = authService.register(RegisterRequest.builder()
                .fullName("Bob")
                .email("bob.crypto@test.com")
                .password("Password123!")
                .build());

        // 2. Register Eve (Adversary)
        var eve = authService.register(RegisterRequest.builder()
                .fullName("Eve")
                .email("eve.adversary@test.com")
                .password("Password123!")
                .build());

        // 3. Create conversation between Alice and Bob
        var conv = conversationService.getOrCreateDirectConversation(alice.getUserId(), bob.getUserId());

        // 4. Alice sends an encrypted envelope
        messageService.sendEncryptedMessage(alice.getUserId(), SendMessageRequest.builder()
                .conversationId(conv.getId())
                .recipientId(bob.getUserId())
                .ciphertext("EncryptedBlobBase64==")
                .nonce("NonceBase64==")
                .kemCiphertext("KemCiphertextBase64==")
                .algorithmVersion("MLKEM768-AES256GCM")
                .build());

        // 5. Bob (participant) CAN read messages
        var bobMessages = messageService.getConversationMessages(conv.getId(), bob.getUserId(), 0, 10);
        assertNotNull(bobMessages);
        assertFalse(bobMessages.isEmpty());

        // 6. Eve (non-participant) CANNOT read messages -> must throw BadRequestException
        assertThrows(BadRequestException.class, () -> {
            messageService.getConversationMessages(conv.getId(), eve.getUserId(), 0, 10);
        }, "Eve must be rejected with an authorization exception");
    }
}
