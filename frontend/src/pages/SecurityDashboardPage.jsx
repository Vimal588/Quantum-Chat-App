import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import {
  Shield,
  Key,
  Lock,
  RotateCcw,
  CheckCircle2,
  Clock,
  Smartphone,
  Check,
  Copy,
  Activity,
  FileCode,
  AlertTriangle
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { formatSafetyNumber } from '../crypto/pqc';

export default function SecurityDashboardPage() {
  const { user, rotateKeys } = useAuthStore();
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRotating, setIsRotating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rotationMsg, setRotationMsg] = useState('');

  const loadSecurityStatus = async () => {
    try {
      const res = await api.get('/security/status');
      setDashboard(res.data);
    } catch (err) {
      console.error('Failed to load security status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSecurityStatus();
  }, []);

  const handleRotate = async () => {
    if (window.confirm('Are you sure you want to rotate your ML-KEM and ML-DSA keys? This generates a fresh lattice keypair on your device and increments your public key version.')) {
      setIsRotating(true);
      setRotationMsg('');
      const res = await rotateKeys();
      if (res.success) {
        setRotationMsg('Lattice keys successfully rotated and published to directory!');
        await loadSecurityStatus();
      } else {
        setRotationMsg('Error rotating keys: ' + res.error);
      }
      setIsRotating(false);
    }
  };

  const handleCopyFingerprint = () => {
    if (dashboard?.userMlKemFingerprint) {
      navigator.clipboard.writeText(dashboard.userMlKemFingerprint);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-navy-950">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Shield className="w-7 h-7 text-teal-400" />
              Security & Cryptographic Dashboard
            </h1>
            <p className="text-sm text-slate-400">
              Live status of Post-Quantum Key Encapsulation, Authenticated Ciphers, and Device Identity.
            </p>
          </div>

          <button
            onClick={handleRotate}
            disabled={isRotating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 text-sm font-semibold transition-all shadow-lg shadow-teal-500/5 disabled:opacity-50"
          >
            <RotateCcw className={`w-4 h-4 ${isRotating ? 'animate-spin' : ''}`} />
            {isRotating ? 'Rotating Lattice Keys...' : 'Rotate Post-Quantum Keys'}
          </button>
        </div>

        {rotationMsg && (
          <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-xs text-teal-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
            <span>{rotationMsg}</span>
          </div>
        )}

        {/* Algorithm Standards Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-5 bg-navy-900/60 border border-slate-800 rounded-2xl backdrop-blur relative overflow-hidden">
            <div className="text-xs uppercase font-mono tracking-wider text-slate-400 mb-1">Key Encapsulation</div>
            <div className="text-lg font-bold text-white">ML-KEM-768</div>
            <div className="text-xs text-teal-400 font-mono mt-1">NIST FIPS 203 Standard</div>
            <div className="mt-3 text-[11px] text-slate-500">Security Category 3 (AES-192 / AES-256 equivalent)</div>
          </div>

          <div className="p-5 bg-navy-900/60 border border-slate-800 rounded-2xl backdrop-blur relative overflow-hidden">
            <div className="text-xs uppercase font-mono tracking-wider text-slate-400 mb-1">Digital Signatures</div>
            <div className="text-lg font-bold text-white">ML-DSA-65</div>
            <div className="text-xs text-cyan-400 font-mono mt-1">NIST FIPS 204 Standard</div>
            <div className="mt-3 text-[11px] text-slate-500">Module-Lattice Identity Authentication</div>
          </div>

          <div className="p-5 bg-navy-900/60 border border-slate-800 rounded-2xl backdrop-blur relative overflow-hidden">
            <div className="text-xs uppercase font-mono tracking-wider text-slate-400 mb-1">Payload Cipher</div>
            <div className="text-lg font-bold text-white">AES-256-GCM</div>
            <div className="text-xs text-emerald-400 font-mono mt-1">NIST SP 800-38D</div>
            <div className="mt-3 text-[11px] text-slate-500">128-bit Authentication Tag + 96-bit Nonce</div>
          </div>

          <div className="p-5 bg-navy-900/60 border border-slate-800 rounded-2xl backdrop-blur relative overflow-hidden">
            <div className="text-xs uppercase font-mono tracking-wider text-slate-400 mb-1">Key Derivation</div>
            <div className="text-lg font-bold text-white">HKDF-SHA-256</div>
            <div className="text-xs text-amber-400 font-mono mt-1">RFC 5869 Standard</div>
            <div className="mt-3 text-[11px] text-slate-500">Extract-then-Expand Pseudorandom Key</div>
          </div>
        </div>

        {/* Active Identity & Safety Fingerprint Section */}
        <section className="bg-navy-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-teal-400" />
                Active Device Public Key Fingerprint
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Key Version {dashboard?.keyVersion || 1} • Created{' '}
                {dashboard?.keyCreatedAt ? new Date(dashboard.keyCreatedAt).toLocaleString() : 'Active'}
              </p>
            </div>

            <button
              onClick={handleCopyFingerprint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-teal-300 border border-slate-700 transition-colors w-fit"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Fingerprint'}
            </button>
          </div>

          <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-4">
            <div className="text-xs text-slate-500 font-mono uppercase mb-2">SHA-256 Safety Blocks</div>
            <div className="font-mono text-sm text-teal-300 break-all select-all leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              {formatSafetyNumber(dashboard?.userMlKemFingerprint) || 'No fingerprint registered yet'}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-bold text-white">{dashboard?.activeDevicesCount || 1}</div>
                <div className="text-xs text-slate-400">Registered Devices</div>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-bold text-white">{dashboard?.verifiedContactsCount || 0}</div>
                <div className="text-xs text-slate-400">Verified Contacts</div>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-teal-500/10 text-teal-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-bold text-white">Quantum Safe</div>
                <div className="text-xs text-slate-400">Harvest Now Resilient</div>
              </div>
            </div>
          </div>
        </section>

        {/* Live Security Audit Log */}
        <section className="bg-navy-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur shadow-xl">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-400" />
            Security Event Audit Log
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Event Type</th>
                  <th className="pb-3 font-semibold">Details</th>
                  <th className="pb-3 font-semibold text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {!dashboard?.recentSecurityEvents || dashboard.recentSecurityEvents.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="py-6 text-center text-slate-500">
                      No security events recorded yet.
                    </td>
                  </tr>
                ) : (
                  dashboard.recentSecurityEvents.map((evt) => (
                    <tr key={evt.id} className="hover:bg-slate-800/20">
                      <td className="py-3 font-semibold text-teal-400">
                        {evt.eventType}
                      </td>
                      <td className="py-3 max-w-md truncate text-slate-300">
                        {evt.details}
                      </td>
                      <td className="py-3 text-right text-slate-500">
                        {new Date(evt.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
