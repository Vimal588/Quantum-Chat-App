import React, { useState } from 'react';
import { ShieldCheck, X, Check, Copy, AlertTriangle } from 'lucide-react';
import { formatSafetyNumber } from '../crypto/pqc';
import api from '../services/api';

export default function VerifyContactModal({ contact, onClose, onVerified }) {
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!contact) return null;

  const fingerprint = contact.mlKemFingerprint || contact.safetyNumberFingerprint || 'PENDING-REGISTRATION';
  const formatted = formatSafetyNumber(fingerprint);

  const handleCopy = () => {
    navigator.clipboard.writeText(fingerprint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async () => {
    setIsSubmitting(true);
    try {
      await api.post(`/contacts/verify/${contact.userId || contact.otherParticipantId}`, {
        fingerprint,
      });
      if (onVerified) onVerified();
      onClose();
    } catch (err) {
      console.error('Verification failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-navy-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Verify Safety Numbers</h3>
            <p className="text-xs text-slate-400">End-to-End Post-Quantum Identity</p>
          </div>
        </div>

        <p className="text-sm text-slate-300 mb-4">
          Compare this 64-character SHA-256 fingerprint with <strong className="text-white">{contact.fullName || contact.title}</strong> out-of-band to guarantee no relay or adversary has intercepted the channel.
        </p>

        {/* Fingerprint Display */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-mono tracking-wider text-slate-400">ML-KEM-768 Fingerprint</span>
            <button
              onClick={handleCopy}
              className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 font-mono"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="font-mono text-xs text-teal-300 break-all leading-relaxed select-all bg-slate-900/60 p-2.5 rounded border border-slate-800">
            {formatted}
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2.5 mb-6 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
          <span>If this fingerprint does not match the recipient's device, your session might be subject to a Man-in-the-Middle attack.</span>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          >
            Cancel
          </button>
          <button
            onClick={handleVerify}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            {isSubmitting ? 'Verifying...' : 'Mark as Verified'}
          </button>
        </div>
      </div>
    </div>
  );
}
