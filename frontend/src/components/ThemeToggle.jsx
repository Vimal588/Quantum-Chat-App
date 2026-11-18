import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../store/useThemeStore';

export default function ThemeToggle({ variant = 'bar' }) {
  const { theme, toggleTheme, setTheme } = useThemeStore();
  const isDark = theme === 'dark';

  if (variant === 'card') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Dark Mode Card */}
        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
            isDark
              ? 'border-teal-500 bg-teal-500/10 shadow-sm'
              : 'border-slate-700/60 hover:border-slate-600 bg-navy-950/60'
          }`}
        >
          <div className="p-2.5 rounded-lg bg-navy-900 border border-slate-700 text-teal-400">
            <Moon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white flex items-center gap-2">
              Quantum Navy (Dark)
              {isDark && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold">
                  ACTIVE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              High-contrast cybersecurity theme with deep navy and cyan lattice highlights.
            </p>
          </div>
        </button>

        {/* Light Mode Card */}
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
            !isDark
              ? 'border-teal-500 bg-teal-500/10 shadow-sm'
              : 'border-slate-700/60 hover:border-slate-600 bg-navy-950/60'
          }`}
        >
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white flex items-center gap-2">
              Quantum Daylight (Light)
              {!isDark && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold">
                  ACTIVE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Clean, bright aesthetic with high readability for daytime workspace environments.
            </p>
          </div>
        </button>
      </div>
    );
  }

  // Default 'bar' variant: Sleek segmented toggle bar for Navbar
  return (
    <div
      role="group"
      aria-label="Theme toggle bar"
      className="relative flex items-center p-1 rounded-full bg-slate-800/80 border border-slate-700/70 backdrop-blur select-none transition-colors"
    >
      {/* Light Option */}
      <button
        type="button"
        onClick={() => setTheme('light')}
        title="Switch to Light Mode"
        className={`relative z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
          !isDark
            ? 'text-amber-500 font-semibold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Sun className="w-3.5 h-3.5" />
        <span className="hidden sm:inline text-[11px]">Light</span>
      </button>

      {/* Dark Option */}
      <button
        type="button"
        onClick={() => setTheme('dark')}
        title="Switch to Dark Mode (Quantum Navy)"
        className={`relative z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
          isDark
            ? 'text-teal-300 font-semibold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Moon className="w-3.5 h-3.5" />
        <span className="hidden sm:inline text-[11px]">Dark</span>
      </button>

      {/* Sliding Active Pill Background */}
      <div
        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full transition-transform duration-200 ease-out shadow-sm ${
          isDark
            ? 'left-1 translate-x-[100%] bg-navy-950 border border-teal-500/40 shadow-teal-500/10'
            : 'left-1 translate-x-0 bg-white border border-slate-300 shadow-slate-200'
        }`}
        style={{ width: 'calc(50% - 4px)' }}
      />
    </div>
  );
}
