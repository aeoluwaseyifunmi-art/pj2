import React from 'react';
import { Sun, Moon, Warehouse } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  variant?: 'header' | 'terminal' | 'compact' | 'pill';
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'header',
  showLabel = true
}) => {
  const { theme, toggleTheme, isLight } = useTheme();

  if (variant === 'terminal') {
    return (
      <button
        onClick={toggleTheme}
        type="button"
        title={
          isLight
            ? 'Switch to High-Contrast Dark Mode'
            : 'Switch to Warehouse Light Mode (Optimized for bright fluorescent & sunlight environments)'
        }
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-medium rounded transition-all cursor-pointer border ${
          isLight
            ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 shadow-sm'
            : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
        }`}
      >
        {isLight ? (
          <>
            <Moon className="w-3.5 h-3.5 text-slate-700" />
            {showLabel && <span className="font-sans font-medium text-slate-800">Dark Mode</span>}
          </>
        ) : (
          <>
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            {showLabel && <span className="font-sans font-medium">Warehouse Light</span>}
          </>
        )}
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={toggleTheme}
        type="button"
        title={
          isLight
            ? 'Switch to High-Contrast Dark Mode'
            : 'Switch to Warehouse Light Mode (Bright lighting / High contrast)'
        }
        className={`p-1.5 rounded transition-colors cursor-pointer border ${
          isLight
            ? 'bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300'
            : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
        }`}
        aria-label="Toggle warehouse theme"
      >
        {isLight ? (
          <Moon className="w-4 h-4 text-slate-800" />
        ) : (
          <Sun className="w-4 h-4 text-amber-400" />
        )}
      </button>
    );
  }

  // Default: Header button
  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={
        isLight
          ? 'Switch to High-Contrast Dark Mode'
          : 'Switch to Warehouse Light Mode (High visibility in brightly lit warehouses)'
      }
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
        isLight
          ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm'
          : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700'
      }`}
    >
      {isLight ? (
        <>
          <Moon className="w-3.5 h-3.5 text-indigo-600" />
          {showLabel && <span>Dark Mode</span>}
        </>
      ) : (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          {showLabel && <span>Warehouse Light</span>}
        </>
      )}
    </button>
  );
};
