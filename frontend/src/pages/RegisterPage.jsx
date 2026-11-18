import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, User, ArrowRight, AlertCircle, KeyRound, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isGeneratingKeys, setIsGeneratingKeys] = useState(false);
  const [serverOnline, setServerOnline] = useState(null);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  // Test backend connection on load
  useEffect(() => {
    api.get('/auth/login')
      .catch((err) => {
        if (err.response?.status === 405 || err.response?.status === 400 || err.response?.status === 401) {
          setServerOnline(true);
        } else if (err.code === 'ERR_NETWORK' || !err.response) {
          setServerOnline(false);
        } else {
          setServerOnline(true);
        }
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsGeneratingKeys(true);

    // Give UI a moment to render the animated key generation status
    setTimeout(async () => {
      const res = await register(fullName, email, password);
      setIsGeneratingKeys(false);

      if (res.success) {
        navigate('/');
      } else {
        setError(res.error);
      }
    }, 150);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-navy-950 relative overflow-hidden">
      {/* Background Quantum Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-navy-900/80 border border-slate-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl relative z-10">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-500 p-0.5 shadow-xl shadow-teal-500/20 inline-flex items-center justify-center mb-3">
            <div className="w-full h-full bg-navy-950 rounded-[14px] flex items-center justify-center">
              <KeyRound className="w-7 h-7 text-teal-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Post-Quantum Registration</h1>
          <p className="text-xs text-slate-400 font-mono mt-1">Generate FIPS 203 Keys on your device</p>

          {/* Relay Status Pill */}
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border bg-slate-950/80">
            {serverOnline === true ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400">Relay Connected</span>
              </>
            ) : serverOnline === false ? (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-rose-400">Relay Offline</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span className="text-slate-400">Checking Relay...</span>
              </>
            )}
          </div>
        </div>

        {/* Cryptographic Key Generation Notice */}
        <div className="mb-6 p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-300 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 flex-shrink-0 text-teal-400 mt-0.5" />
          <span>
            Upon registration, an <strong>ML-KEM-768</strong> keypair is generated directly inside your browser. Your private key never leaves this machine.
          </span>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. Alice Smith"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alice@quantum.io"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Master Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isGeneratingKeys}
            className="w-full mt-2 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-semibold rounded-xl shadow-lg shadow-teal-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm"
          >
            {isGeneratingKeys ? 'Generating Lattice Keys...' : 'Generate Identity & Register'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-teal-400 hover:text-teal-300 font-semibold underline underline-offset-2">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
