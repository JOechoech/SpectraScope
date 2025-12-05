import { memo } from 'react';
import { BarChart3, Settings, List } from 'lucide-react';
import type { ViewName } from '@/types';

interface NavigationProps {
  currentView: ViewName;
  onNavigate: (view: ViewName) => void;
  marketStatus?: 'open' | 'closed' | 'pre' | 'after';
}

interface NavItem {
  id: ViewName;
  label: string;
  icon: typeof BarChart3;
}

const navItems: NavItem[] = [
  { id: 'watchlist', label: 'Watchlist', icon: List },
  { id: 'settings', label: 'Settings', icon: Settings },
];

/**
 * Bottom navigation bar with market status indicator
 * Displays on Watchlist and Settings views only
 */
export const Navigation = memo(function Navigation({
  currentView,
  onNavigate,
  marketStatus = 'open',
}: NavigationProps) {
  // Don't show nav on detail view
  if (currentView === 'detail' || currentView === 'search') {
    return null;
  }

  const statusConfig = {
    open: { color: 'bg-emerald-500', text: 'Market Open', textColor: 'text-emerald-400' },
    closed: { color: 'bg-slate-500', text: 'Market Closed', textColor: 'text-slate-400' },
    pre: { color: 'bg-amber-500', text: 'Pre-Market', textColor: 'text-amber-400' },
    after: { color: 'bg-blue-500', text: 'After Hours', textColor: 'text-blue-400' },
  };

  const status = statusConfig[marketStatus];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800/50 safe-bottom">
      {/* Market Status Bar */}
      <div className="flex items-center justify-between px-5 py-2 border-b border-slate-800/30">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${status.color} animate-pulse`} />
          <span className={`${status.textColor} text-sm font-medium`}>
            {status.text}
          </span>
        </div>
        <span className="text-slate-500 text-sm">Last updated: just now</span>
      </div>

      {/* Navigation Items */}
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                flex flex-col items-center gap-1 px-6 py-2 rounded-xl
                transition-all duration-200
                ${isActive
                  ? 'text-blue-400'
                  : 'text-slate-500 hover:text-slate-300'
                }
              `}
            >
              <Icon
                size={22}
                className={isActive ? 'text-blue-400' : ''}
              />
              <span className={`text-xs font-medium ${isActive ? 'text-blue-400' : ''}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-blue-400" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
});

export default Navigation;
