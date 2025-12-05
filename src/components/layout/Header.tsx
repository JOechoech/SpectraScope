import { memo } from 'react';
import { ChevronLeft, Settings } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  showSettings?: boolean;
  onBack?: () => void;
  onSettings?: () => void;
  rightContent?: React.ReactNode;
  badge?: string;
}

/**
 * Reusable header component with optional back button and settings
 * Supports glassmorphism styling with backdrop blur
 */
export const Header = memo(function Header({
  title,
  subtitle,
  showBack = false,
  showSettings = false,
  onBack,
  onSettings,
  rightContent,
  badge,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-slate-800/50">
      <div className="px-5 py-4">
        <div className="flex items-center gap-4">
          {/* Back Button */}
          {showBack && onBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-full hover:bg-slate-800/50 transition-colors"
              aria-label="Go back"
            >
              <ChevronLeft size={24} className="text-white" />
            </button>
          )}

          {/* Title Area */}
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className={`font-bold text-white tracking-tight ${showBack ? 'text-2xl' : 'text-3xl'}`}>
                {title}
              </h1>
              {badge && (
                <span className="px-2 py-0.5 bg-slate-800 rounded-lg text-slate-400 text-xs">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-slate-500 text-sm mt-1">{subtitle}</p>
            )}
          </div>

          {/* Right Content */}
          {rightContent}

          {/* Settings Button */}
          {showSettings && onSettings && (
            <button
              onClick={onSettings}
              className="p-3 rounded-full bg-slate-900/50 hover:bg-slate-800/50 transition-colors"
              aria-label="Open settings"
            >
              <Settings size={22} className="text-slate-400" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
});

export default Header;
