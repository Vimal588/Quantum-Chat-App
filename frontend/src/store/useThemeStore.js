import { create } from 'zustand';

// Safely get initial theme preference from localStorage, default to 'dark'
const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem('qc_theme');
  if (saved === 'light' || saved === 'dark') {
    return saved;
  }
  // Optional: check system preference, default to dark for quantum cybersecurity feel
  return 'dark';
};

const applyThemeToDOM = (theme) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'light') {
    root.classList.remove('dark');
    root.classList.add('light');
    document.body.classList.remove('bg-navy-950');
    document.body.classList.add('bg-slate-50');
  } else {
    root.classList.remove('light');
    root.classList.add('dark');
    document.body.classList.remove('bg-slate-50');
    document.body.classList.add('bg-navy-950');
  }
};

// Apply on script evaluation to prevent flash
applyThemeToDOM(getInitialTheme());

export const useThemeStore = create((set, get) => ({
  theme: getInitialTheme(),

  setTheme: (newTheme) => {
    const theme = newTheme === 'light' ? 'light' : 'dark';
    localStorage.setItem('qc_theme', theme);
    applyThemeToDOM(theme);
    set({ theme });
  },

  toggleTheme: () => {
    const current = get().theme;
    const next = current === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },
}));
