import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, MessageSquare, Users, Settings, Lock, LogOut, BarChart3 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Chats', path: '/', icon: MessageSquare },
    { name: 'Contacts', path: '/contacts', icon: Users },
    { name: 'Security', path: '/security', icon: Shield },
    { name: 'Benchmark', path: '/benchmark', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <header className="h-16 border-b border-slate-800 bg-navy-900/90 backdrop-blur px-4 flex items-center justify-between select-none z-20">
      {/* Brand & Algorithm Badge */}
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 p-0.5 shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
            <div className="w-full h-full bg-navy-950 rounded-[10px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-teal-400" />
            </div>
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
              QuantumChat
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/30">
                FIPS 203
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
              <Lock className="w-3 h-3 text-teal-400 inline" />
              ML-KEM-768 • AES-256-GCM
            </p>
          </div>
        </Link>
      </div>

      {/* Nav Navigation Links */}
      <nav className="flex items-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Actions */}
      <div className="flex items-center gap-3">
        {/* Light / Dark Mode Toggle Bar */}
        <ThemeToggle variant="bar" />

        {user ? (
          <>
            <Link
              to="/profile"
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-800/60 transition-colors group"
              title="View & Edit Profile (WhatsApp Style)"
            >
              <div className="w-9 h-9 rounded-full overflow-hidden border border-teal-500/40 bg-slate-800 flex items-center justify-center text-teal-300 font-bold text-sm shadow-sm group-hover:border-teal-400 flex-shrink-0">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                ) : (
                  <span>{user.fullName ? user.fullName.charAt(0).toUpperCase() : '?'}</span>
                )}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-sm font-semibold text-slate-200 group-hover:text-teal-300 transition-colors leading-tight">
                  {user?.fullName}
                </span>
                <span className="text-[11px] text-slate-400 font-mono truncate max-w-[130px] leading-tight">
                  {user?.email}
                </span>
              </div>
            </Link>

            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 transition-colors"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
