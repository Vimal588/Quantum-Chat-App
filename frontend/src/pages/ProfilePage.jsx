import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Check,
  X,
  Edit2,
  Shield,
  Lock,
  Mail,
  Copy,
  CheckCheck,
  Trash2,
  Sparkles,
  Maximize2,
  KeyRound,
  ArrowLeft,
  Smartphone,
  Info,
  Calendar
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import Navbar from '../components/Navbar';

// Standard WhatsApp & Quantum status presets
const ABOUT_PRESETS = [
  '⚡ Available',
  '🔒 Secured with Post-Quantum Cryptography',
  '💼 At work',
  '📅 In a meeting',
  '🔋 Battery about to die',
  '🚫 Busy / Do Not Disturb',
  '✈️ Traveling',
  '🛡️ NIST FIPS 203 Lattice Encrypted',
  '💬 Can’t talk, QuantumChat only',
  '⚡ Urgent quantum communications only'
];

// High-tech Cyber / Quantum gradient SVG avatars
const PRESET_AVATARS = [
  {
    name: 'Quantum Cyan',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2306b6d4"/><stop offset="100%" stop-color="%233b82f6"/></linearGradient></defs><rect width="200" height="200" rx="100" fill="url(%23g)"/><circle cx="100" cy="80" r="36" fill="%23ffffff" fill-opacity="0.9"/><path d="M40 170 C40 120, 160 120, 160 170 Z" fill="%23ffffff" fill-opacity="0.9"/></svg>'
  },
  {
    name: 'Emerald Shield',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2310b981"/><stop offset="100%" stop-color="%230d9488"/></linearGradient></defs><rect width="200" height="200" rx="100" fill="url(%23g)"/><polygon points="100,45 145,65 145,115 100,155 55,115 55,65" fill="%23ffffff" fill-opacity="0.9"/></svg>'
  },
  {
    name: 'Violet Matrix',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%238b5cf6"/><stop offset="100%" stop-color="%23ec4899"/></linearGradient></defs><rect width="200" height="200" rx="100" fill="url(%23g)"/><circle cx="100" cy="80" r="36" fill="%23ffffff" fill-opacity="0.9"/><path d="M40 170 C40 120, 160 120, 160 170 Z" fill="%23ffffff" fill-opacity="0.9"/></svg>'
  },
  {
    name: 'Amber Lattice',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23f59e0b"/><stop offset="100%" stop-color="%23ef4444"/></linearGradient></defs><rect width="200" height="200" rx="100" fill="url(%23g)"/><circle cx="100" cy="100" r="45" fill="none" stroke="%23ffffff" stroke-width="12" stroke-opacity="0.9"/><circle cx="100" cy="100" r="18" fill="%23ffffff"/></svg>'
  },
  {
    name: 'Cyber Sentinel',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2314b8a6"/><stop offset="100%" stop-color="%236366f1"/></linearGradient></defs><rect width="200" height="200" rx="100" fill="url(%23g)"/><circle cx="100" cy="100" r="40" fill="%23ffffff" fill-opacity="0.95"/></svg>'
  },
  {
    name: 'Deep Space',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%231e293b"/><stop offset="100%" stop-color="%230f172a"/></linearGradient></defs><rect width="200" height="200" rx="100" fill="url(%23g)"/><circle cx="100" cy="80" r="36" fill="%2338bdf8" fill-opacity="0.9"/><path d="M40 170 C40 120, 160 120, 160 170 Z" fill="%2338bdf8" fill-opacity="0.9"/></svg>'
  }
];

export default function ProfilePage() {
  const { user, updateProfile } = useAuthStore();
  const navigate = useNavigate();

  // Local editable states
  const [isEditingName, setIsEditingName] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bio, setBio] = useState(user?.bio || 'Secured with Quantum Cryptography');
  
  // DP states
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || null);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showPresetPicker, setShowPresetPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);

  const fileInputRef = useRef(null);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Process & compress uploaded image using HTML5 Canvas
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = async () => {
        // Crop square and resize to 360x360 for high quality & small payload
        const canvas = document.createElement('canvas');
        const size = 360;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;

        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);

        // Compress to JPEG with 0.86 quality (typically 25-45 KB)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.86);

        setAvatarUrl(compressedDataUrl);
        setIsSaving(true);
        const res = await updateProfile({ avatarUrl: compressedDataUrl });
        setIsSaving(false);

        if (res.success) {
          triggerToast('Profile photo updated successfully!');
        } else {
          alert('Failed to update photo: ' + res.error);
        }
      };
      img.src = readerEvent.target.result;
    };
    reader.readAsDataURL(file);
    // Reset file input so re-selecting same file triggers change
    e.target.value = '';
  };

  const handleSelectPreset = async (presetUrl) => {
    setAvatarUrl(presetUrl);
    setShowPresetPicker(false);
    setIsSaving(true);
    const res = await updateProfile({ avatarUrl: presetUrl });
    setIsSaving(false);
    if (res.success) {
      triggerToast('Preset avatar applied successfully!');
    } else {
      alert('Failed to update avatar: ' + res.error);
    }
  };

  const handleRemovePhoto = async () => {
    if (!confirm('Are you sure you want to remove your profile photo?')) return;
    setAvatarUrl(null);
    setIsSaving(true);
    const res = await updateProfile({ avatarUrl: '' });
    setIsSaving(false);
    if (res.success) {
      triggerToast('Profile photo removed.');
    }
  };

  const handleSaveName = async () => {
    if (!fullName.trim()) return;
    setIsSaving(true);
    const res = await updateProfile({ fullName: fullName.trim() });
    setIsSaving(false);
    if (res.success) {
      setIsEditingName(false);
      triggerToast('Display name updated!');
    } else {
      alert('Failed to save name: ' + res.error);
    }
  };

  const handleSaveBio = async (newBioText) => {
    const textToSave = newBioText !== undefined ? newBioText : bio;
    setIsSaving(true);
    const res = await updateProfile({ bio: textToSave });
    setIsSaving(false);
    if (res.success) {
      setBio(textToSave);
      setIsEditingBio(false);
      triggerToast('Status / About updated!');
    } else {
      alert('Failed to update status: ' + res.error);
    }
  };

  const handleCopyFingerprint = () => {
    const fp = user?.mlKemFingerprint || 'ML-KEM-768-ACTIVE-FINGERPRINT';
    navigator.clipboard.writeText(fp);
    setCopiedFingerprint(true);
    setTimeout(() => setCopiedFingerprint(false), 2000);
  };

  // Format safety numbers into WhatsApp/Signal 12-block safety group
  const formatSafetyNumberBlocks = (fp) => {
    if (!fp) return ['48102', '99120', '33910', '77124', '00192', '88123'];
    const clean = fp.replace(/[^A-Za-z0-9]/g, '').padEnd(30, '0');
    const blocks = [];
    for (let i = 0; i < clean.length && blocks.length < 6; i += 5) {
      blocks.push(clean.substring(i, i + 5).toUpperCase());
    }
    return blocks;
  };

  const safetyBlocks = formatSafetyNumberBlocks(user?.mlKemFingerprint);

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500/30">
      <Navbar />

      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-teal-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCheck className="w-4 h-4" />
          {toastMessage}
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                Profile & Identity
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">
                  WhatsApp Style
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Manage your display name, photo, status, and post-quantum cryptographic identity.
              </p>
            </div>
          </div>

          {isSaving && (
            <span className="text-xs text-teal-400 font-mono flex items-center gap-1.5 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              Syncing to Keystore...
            </span>
          )}
        </div>

        {/* Section 1: Profile Photo (DP) Center Stage */}
        <div className="bg-navy-900/60 border border-slate-800/80 rounded-2xl p-6 md:p-8 backdrop-blur flex flex-col items-center text-center space-y-6">
          <div className="relative group">
            {/* DP Circle */}
            <div
              onClick={() => avatarUrl && setShowLightbox(true)}
              className={`w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden border-4 border-teal-500/40 shadow-2xl shadow-teal-500/10 bg-slate-900 flex items-center justify-center relative ${
                avatarUrl ? 'cursor-pointer hover:border-teal-400' : ''
              } transition-all`}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={user?.fullName || 'Profile DP'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-slate-900 via-navy-900 to-slate-800 flex items-center justify-center font-bold text-4xl md:text-5xl text-teal-400 font-mono">
                  {user?.fullName ? user.fullName.charAt(0).toUpperCase() : '?'}
                </div>
              )}

              {/* Lightbox hint overlay */}
              {avatarUrl && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold gap-1">
                  <Maximize2 className="w-4 h-4" />
                  View
                </div>
              )}
            </div>

            {/* Camera Floating Action Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Change Profile Photo"
              className="absolute bottom-1 right-1 md:bottom-2 md:right-2 p-3 rounded-full bg-teal-500 hover:bg-teal-400 text-navy-950 font-bold shadow-lg shadow-teal-500/40 hover:scale-110 active:scale-95 transition-all border-2 border-navy-950"
            >
              <Camera className="w-5 h-5" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* DP Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Camera className="w-3.5 h-3.5" />
              Upload Photo
            </button>
            <button
              onClick={() => setShowPresetPicker(!showPresetPicker)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Choose Cyber Avatar
            </button>
            {avatarUrl && (
              <button
                onClick={handleRemovePhoto}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            )}
          </div>

          {/* Preset Picker Drawer/Popup */}
          {showPresetPicker && (
            <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 max-w-md w-full space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 font-mono">Select Cyber Preset Avatar:</span>
                <button
                  onClick={() => setShowPresetPicker(false)}
                  className="text-slate-500 hover:text-white text-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {PRESET_AVATARS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handleSelectPreset(preset.url)}
                    className="p-1 rounded-xl bg-slate-900 border border-slate-800 hover:border-teal-500 hover:scale-105 transition-all flex flex-col items-center gap-1 group"
                  >
                    <img src={preset.url} alt={preset.name} className="w-12 h-12 rounded-full" />
                    <span className="text-[10px] text-slate-400 group-hover:text-teal-300 truncate w-full text-center">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Display Name & About (WhatsApp Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Your Name Card */}
          <div className="bg-navy-900/60 border border-slate-800/80 rounded-2xl p-5 md:p-6 backdrop-blur space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400 font-mono flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Your Name
              </span>
              {!isEditingName && (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-teal-300 hover:bg-slate-800 transition-colors"
                  title="Edit Name"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {isEditingName ? (
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    maxLength={30}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-navy-950 border border-teal-500/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="Enter your name"
                    autoFocus
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-500 font-mono">
                    {30 - fullName.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveName}
                    className="px-3.5 py-1.5 rounded-xl bg-teal-500 text-navy-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-500/20"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setFullName(user?.fullName || '');
                      setIsEditingName(false);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-1">
                <div className="text-base font-semibold text-white">{user?.fullName || 'Anonymous User'}</div>
              </div>
            )}

            <p className="text-[11px] text-slate-400 leading-relaxed flex items-start gap-1.5 pt-1 border-t border-slate-800/80">
              <Info className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
              <span>
                This is not your username or PIN. This name will be visible to your QuantumChat contacts.
              </span>
            </p>
          </div>

          {/* About / Status Card */}
          <div className="bg-navy-900/60 border border-slate-800/80 rounded-2xl p-5 md:p-6 backdrop-blur space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400 font-mono flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                About / Status
              </span>
              {!isEditingBio && (
                <button
                  onClick={() => setIsEditingBio(true)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-teal-300 hover:bg-slate-800 transition-colors"
                  title="Edit Status"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {isEditingBio ? (
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    maxLength={70}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-navy-950 border border-teal-500/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="Set your status"
                    autoFocus
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-500 font-mono">
                    {70 - bio.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSaveBio(bio)}
                    className="px-3.5 py-1.5 rounded-xl bg-teal-500 text-navy-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-500/20"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setBio(user?.bio || '');
                      setIsEditingBio(false);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-1">
                <div className="text-sm text-slate-200 italic font-medium">"{user?.bio || bio}"</div>
              </div>
            )}

            {/* Quick Status Presets Chips */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <span className="text-[11px] text-slate-400 font-mono block">Select preset status:</span>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {ABOUT_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setBio(preset);
                      handleSaveBio(preset);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-teal-300 border border-slate-700/80 transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Account & Cryptographic Identity */}
        <div className="bg-navy-900/60 border border-slate-800/80 rounded-2xl p-5 md:p-6 backdrop-blur space-y-6">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-teal-400 font-mono flex items-center gap-2">
              <KeyRound className="w-4 h-4" />
              Cryptographic Safety Number & Account Identity
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Protected under NIST FIPS 203 (ML-KEM-768) and AES-256-GCM. Your private keys never leave this browser device.
            </p>
          </div>

          {/* Account Details Rows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-slate-400">
                <Mail className="w-4 h-4 text-teal-400" />
                <span>Email Address</span>
              </div>
              <span className="text-white font-semibold">{user?.email || 'user@quantumchat.io'}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-slate-400">
                <Smartphone className="w-4 h-4 text-teal-400" />
                <span>Device Keystore</span>
              </div>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                ● Browser IndexedDB (Active)
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-slate-400">
                <Calendar className="w-4 h-4 text-teal-400" />
                <span>Key Version</span>
              </div>
              <span className="text-teal-300 font-semibold">v{user?.keyVersion || 1} (FIPS 203)</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-slate-400">
                <Shield className="w-4 h-4 text-teal-400" />
                <span>Quantum Resistance</span>
              </div>
              <span className="text-emerald-400 font-semibold">Resistant to Shor’s Algo</span>
            </div>
          </div>

          {/* WhatsApp / Signal Style Safety Number 12-block display */}
          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                ML-KEM-768 Safety Number Blocks:
              </span>
              <button
                onClick={handleCopyFingerprint}
                className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 font-mono"
              >
                {copiedFingerprint ? (
                  <>
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Fingerprint
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {safetyBlocks.map((block, idx) => (
                <div
                  key={idx}
                  className="bg-navy-950/90 border border-teal-500/20 p-2.5 rounded-lg text-center font-mono text-sm font-bold text-teal-300 tracking-wider shadow-inner"
                >
                  {block}
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-500 text-center font-sans">
              Compare these safety numbers out-of-band with your contact to verify zero man-in-the-middle attacks.
            </p>
          </div>
        </div>
      </main>

      {/* Lightbox Modal for Fullscreen DP View (WhatsApp Style) */}
      {showLightbox && avatarUrl && (
        <div
          onClick={() => setShowLightbox(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 cursor-pointer animate-fadeIn"
        >
          <div className="max-w-md w-full relative" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3 text-white">
              <span className="text-sm font-semibold">{user?.fullName}'s Profile Photo</span>
              <button
                onClick={() => setShowLightbox(false)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="w-full aspect-square rounded-2xl overflow-hidden bg-navy-900 border-2 border-slate-700 shadow-2xl">
              <img src={avatarUrl} alt="Full size DP" className="w-full h-full object-cover" />
            </div>
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setShowLightbox(false);
                  fileInputRef.current?.click();
                }}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-navy-950 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Camera className="w-4 h-4" />
                Change Photo
              </button>
              <button
                onClick={() => setShowLightbox(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
