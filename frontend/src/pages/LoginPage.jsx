import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2, UserCheck } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [serverOnline, setServerOnline] = useState(null);
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  // Test backend connection on load
  useEffect(() => {
    api.get('/auth/login')
      .catch((err) => {
        // 405 Method Not Allowed means endpoint is alive!
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

    const res = await login(email, password);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.error);
    }
  };

  const handleQuickFill = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-navy-950 relative overflow-hidden">
      {/* Background Quantum Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-navy-900/80 border border-slate-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl relative z-10">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-500 p-0.5 shadow-xl shadow-teal-500/20 inline-flex items-center justify-center mb-4">
            <div className="w-full h-full bg-navy-950 rounded-[14px] flex items-center justify-center">
              <Shield className="w-7 h-7 text-teal-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">QuantumChat</h1>
          <p className="text-xs text-slate-400 font-mono mt-1">Post-Quantum Cryptographic Messaging</p>

          {/* Live Relay Status Pill */}
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border bg-slate-950/80">
            {serverOnline === true ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400">Relay Connected (Port 8080)</span>
              </>
            ) : serverOnline === false ? (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-rose-400">Relay Offline (Start Spring Boot)</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span className="text-slate-400">Checking Relay...</span>
              </>
            )}
          </div>
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
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-semibold rounded-xl shadow-lg shadow-teal-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm"
          >
            {isLoading ? 'Decrypting Session...' : 'Sign In Securely'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Fill Test Accounts */}
        <div className="mt-6 pt-4 border-t border-slate-800/80">
          <div className="text-[11px] text-slate-500 font-mono mb-2 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-teal-400" />
            Quick Test Accounts:
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('test.user@quantum.io', 'Password123!')}
              className="flex-1 py-1.5 px-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-mono text-teal-300 transition-colors"
            >
              Test User
            </button>
            <Link
              to="/register"
              className="flex-1 py-1.5 px-2 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 rounded-lg text-xs font-mono text-teal-300 transition-colors text-center"
            >
              + New User
            </Link>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-teal-400 hover:text-teal-300 font-semibold underline underline-offset-2">
              Create Post-Quantum Identity
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
