'use client';

import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('nm_admin_theme');
    const dark = stored !== null ? stored === 'dark' : true;
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('nm_admin_theme', next ? 'dark' : 'light');
  }

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg text-nm-text-muted dark:text-nm-text-dark-muted hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      aria-label="Toggle dark mode"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
