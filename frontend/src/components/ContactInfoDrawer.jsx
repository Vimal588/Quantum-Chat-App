import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Mail,
  Smartphone,
  Calendar,
  Maximize2,
  Copy,
  CheckCheck,
  MessageSquare
} from 'lucide-react';

export default function ContactInfoDrawer({ conversation, isOpen, onClose, onVerifyToggle }) {
  const [showLightbox, setShowLightbox] = useState(false);
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);

  if (!isOpen || !conversation) return null;

  const avatar = conversation.otherParticipantAvatar;
  const name = conversation.otherParticipantName || conversation.title || 'Contact';
  const email = conversation.otherParticipantEmail || 'contact@quantumchat.io';
  const isVerified = conversation.otherParticipantVerified;
  const fp = conversation.otherParticipantKemFingerprint;

  // Format safety blocks (WhatsApp 12-block style)
  const formatSafetyBlocks = (fingerprint) => {
    if (!fingerprint) return ['61209', '44910', '19203', '88120', '39102', '55120'];
    const clean = fingerprint.replace(/[^A-Za-z0-9]/g, '').padEnd(30, '0');
    const blocks = [];
    for (let i = 0; i < clean.length && blocks.length < 6; i += 5) {
      blocks.push(clean.substring(i, i + 5).toUpperCase());
    }
    return blocks;
  };

  const safetyBlocks = formatSafetyBlocks(fp);

  const handleCopyFp = () => {
    if (fp) {
      navigator.clipboard.writeText(fp);
      setCopiedFingerprint(true);
      setTimeout(() => setCopiedFingerprint(false), 2000);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Panel */}
      <div className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-96 bg-navy-950 border-l border-slate-800 shadow-2xl flex flex-col overflow-y-auto animate-slideIn">
        {/* Header */}
        <div className="h-16 px-5 border-b border-slate-800 bg-navy-900/80 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">Contact Info</span>
            {isVerified ? (
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Verified
              </span>
            ) : (
              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                Unverified
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Avatar Center (WhatsApp Style) */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div
              onClick={() => avatar && setShowLightbox(true)}
              className={`w-32 h-32 rounded-full overflow-hidden border-4 border-teal-500/30 bg-slate-900 shadow-xl flex items-center justify-center relative group ${
                avatar ? 'cursor-pointer' : ''
              }`}
            >
              {avatar ? (
                <>
                  <img src={avatar} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold gap-1">
                    <Maximize2 className="w-4 h-4" />
                    View
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-slate-900 to-navy-900 flex items-center justify-center font-bold text-4xl text-teal-400 font-mono">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">{name}</h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center justify-center gap-1">
                <Mail className="w-3 h-3 text-teal-400" />
                {email}
              </p>
            </div>
          </div>

          {/* About / Status */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
            <span className="text-[11px] text-slate-400 font-mono block uppercase">About</span>
            <p className="text-sm text-slate-200 italic font-medium">
              "Secured with Post-Quantum Cryptography"
            </p>
          </div>

          {/* Security & Verification Box */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                Encryption Security
              </span>
              <button
                onClick={handleCopyFp}
                className="text-[11px] text-slate-400 hover:text-teal-300 font-mono flex items-center gap-1"
              >
                {copiedFingerprint ? (
                  <>
                    <CheckCheck className="w-3 h-3 text-emerald-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Messages and calls are end-to-end encrypted with NIST FIPS 203 (ML-KEM-768) and AES-256-GCM. No one outside of this chat, not even QuantumChat, can read or listen to them.
            </p>

            {/* Safety Numbers Blocks */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <span className="text-[10px] text-slate-500 font-mono uppercase block">Safety Numbers:</span>
              <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-xs font-semibold text-teal-300 bg-navy-950 p-2.5 rounded-lg border border-teal-500/20">
                {safetyBlocks.map((b, i) => (
                  <span key={i} className="tracking-wider">{b}</span>
                ))}
              </div>
            </div>

            {/* Verification Button */}
            {onVerifyToggle && (
              <button
                onClick={() => onVerifyToggle(conversation)}
                className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                  isVerified
                    ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20'
                    : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {isVerified ? (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Mark as Unverified
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verify Safety Numbers
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen DP Lightbox */}
      {showLightbox && avatar && (
        <div
          onClick={() => setShowLightbox(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 cursor-pointer"
        >
          <div className="max-w-md w-full relative" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3 text-white">
              <span className="text-sm font-semibold">{name}'s Profile Photo</span>
              <button
                onClick={() => setShowLightbox(false)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="w-full aspect-square rounded-2xl overflow-hidden bg-navy-900 border-2 border-slate-700 shadow-2xl">
              <img src={avatar} alt="Full size DP" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
