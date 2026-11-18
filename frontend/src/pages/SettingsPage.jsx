import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import ThemeToggle from '../components/ThemeToggle';
import { User, Shield, Smartphone, Key, Save, Check, Sun } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';

export default function SettingsPage() {
  const { user, initAuth } = useAuthStore();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [bio, setBio] = useState(user?.bio || 'Secured with Quantum Cryptography');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaved(false);
    try {
      await api.put('/users/profile', {
        fullName,
        bio,
        avatarUrl,
      });
      await initAuth();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-navy-950">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Account & Security Settings</h1>
          <p className="text-sm text-slate-400">Manage profile data and local cryptographic preferences.</p>
        </div>

        {saved && (
          <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-xs text-teal-300 flex items-center gap-2">
            <Check className="w-4 h-4 text-teal-400" />
            <span>Profile settings updated successfully!</span>
          </div>
        )}

        {/* Profile Settings */}
        <section className="bg-navy-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur shadow-xl">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-teal-400" />
            Profile Information
          </h2>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Email Address (Immutable)
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full bg-slate-900/40 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Status / Bio
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </section>

        {/* Appearance & Theme Mode */}
        <section className="bg-navy-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur shadow-xl space-y-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" />
              Interface Theme & Appearance
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select your preferred visual mode. Changes take effect across all application pages instantly.
            </p>
          </div>

          <ThemeToggle variant="card" />
        </section>

        {/* Device Information */}
        <section className="bg-navy-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur shadow-xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-teal-400" />
            Device Registration & Keystore
          </h2>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-white">This Browser Device</div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                {navigator.userAgent.substring(0, 70)}...
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Active Keystore
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
