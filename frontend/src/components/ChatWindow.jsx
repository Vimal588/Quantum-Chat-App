import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Send,
  Lock,
  Check,
  CheckCheck,
  Info,
  Clock,
  Sparkles
} from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import VerifyContactModal from './VerifyContactModal';
import ContactInfoDrawer from './ContactInfoDrawer';

export default function ChatWindow() {
  const {
    activeConversation,
    messages,
    sendEncryptedMessage,
    isSending,
    typingStatus,
    sendTypingStatus,
    loadConversations
  } = useChatStore();
  const { user } = useAuthStore();

  const [inputText, setInputText] = useState('');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showContactDrawer, setShowContactDrawer] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    sendTypingStatus(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(false);
    }, 1500);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;
    const textToSend = inputText;
    setInputText('');
    sendTypingStatus(false);
    await sendEncryptedMessage(textToSend);
  };

  if (!activeConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-navy-950 select-none">
        <div className="w-20 h-20 rounded-3xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-4 shadow-xl shadow-teal-500/5">
          <Lock className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Quantum-Resistant Messaging</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
          Select an active conversation or start a new encrypted dialogue protected with NIST FIPS 203 (ML-KEM-768) and AES-256-GCM.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-teal-400 font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          End-to-End Quantum Secrecy Active
        </div>
      </div>
    );
  }

  const isContactTyping = typingStatus[activeConversation.id]?.isTyping;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-navy-950">
      {/* Top Header - WhatsApp Style Clickable Info */}
      <div className="h-16 px-6 border-b border-slate-800 bg-navy-900/60 flex items-center justify-between backdrop-blur">
        <div
          onClick={() => setShowContactDrawer(true)}
          className="flex items-center gap-3 cursor-pointer group"
          title="Click to view Contact Profile & Info"
        >
          <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center font-bold text-teal-400 border border-slate-700 group-hover:border-teal-400 transition-colors flex-shrink-0">
            {activeConversation.otherParticipantAvatar ? (
              <img
                src={activeConversation.otherParticipantAvatar}
                alt={activeConversation.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{activeConversation.title ? activeConversation.title.charAt(0).toUpperCase() : '?'}</span>
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 group-hover:text-teal-300 transition-colors">
              {activeConversation.title}
              {activeConversation.otherParticipantVerified ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  <ShieldAlert className="w-3 h-3" />
                  Unverified
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              {activeConversation.isOnline ? (
                <span className="text-emerald-400">● Online</span>
              ) : (
                <span>● Encrypted Channel (Click for Info)</span>
              )}
            </p>
          </div>
        </div>

        {/* Verification Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowContactDrawer(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 transition-colors"
            title="View Contact Info"
          >
            <Info className="w-3.5 h-3.5" />
            Contact Info
          </button>
          <button
            onClick={() => setShowVerifyModal(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            Safety Numbers
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Encrypted Session Banner */}
        <div className="text-center my-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400 font-mono shadow-sm">
            <Lock className="w-3 h-3 text-teal-400" />
            Messages in this chat are end-to-end encrypted with ML-KEM-768 & AES-256-GCM.
          </div>
        </div>

        {messages.map((msg, index) => {
          const isSender = msg.isSender;
          return (
            <div
              key={msg.id || index}
              className={`flex flex-col ${isSender ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[75%] sm:max-w-[65%] rounded-2xl p-3.5 shadow-md relative ${
                  isSender
                    ? 'bg-gradient-to-br from-teal-700 to-teal-800 text-white rounded-br-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none'
                }`}
              >
                {/* Plaintext body */}
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.plaintext}</p>

                {/* Metadata & Status */}
                <div
                  className={`flex items-center justify-end gap-1.5 mt-1.5 text-[10px] font-mono select-none ${
                    isSender ? 'text-teal-200/80' : 'text-slate-500'
                  }`}
                >
                  <Lock className="w-2.5 h-2.5 text-teal-300" />
                  <span>
                    {msg.createdAt
                      ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : ''}
                  </span>

                  {isSender && (
                    <span className="ml-0.5">
                      {msg.deliveryStatus === 'READ' ? (
                        <CheckCheck className="w-3.5 h-3.5 text-cyan-300" />
                      ) : msg.deliveryStatus === 'DELIVERED' ? (
                        <CheckCheck className="w-3.5 h-3.5 text-teal-200" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-teal-300" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isContactTyping && (
          <div className="flex items-center gap-2 text-xs text-slate-400 italic font-mono">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
            {typingStatus[activeConversation.id]?.senderName || 'Contact'} is typing...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Message Form */}
      <form onSubmit={handleSend} className="p-4 border-t border-slate-800 bg-navy-900/60 backdrop-blur flex items-center gap-3">
        <input
          type="text"
          placeholder="Type an end-to-end encrypted message..."
          value={inputText}
          onChange={handleInputChange}
          className="flex-1 bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="p-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl shadow-lg shadow-teal-600/20 disabled:opacity-50 transition-all flex items-center justify-center"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      {/* Verify Safety Numbers Modal */}
      {showVerifyModal && (
        <VerifyContactModal
          contact={activeConversation}
          onClose={() => setShowVerifyModal(false)}
          onVerified={() => {
            loadConversations();
          }}
        />
      )}

      {/* WhatsApp-Style Contact Info Drawer */}
      <ContactInfoDrawer
        conversation={activeConversation}
        isOpen={showContactDrawer}
        onClose={() => setShowContactDrawer(false)}
        onVerifyToggle={() => {
          setShowContactDrawer(false);
          setShowVerifyModal(true);
        }}
      />
    </div>
  );
}
