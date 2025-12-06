import { memo } from 'react';
import { Home, Search, Settings, Telescope, Moon } from 'lucide-react';
import type { ViewName } from '@/types';

interface NavigationProps {
  currentView: ViewName;
  onNavigate: (view: ViewName) => void;
}

interface NavItem {
  id: ViewName;
  label: string;
  icon: typeof Home;
  highlight?: 'scope' | 'dream';
}

const navItems: NavItem[] = [
  { id: 'watchlist', label: 'Home', icon: Home },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'spectrascope', label: 'Scope', icon: Telescope, highlight: 'scope' },
  { id: 'dream', label: 'Dream', icon: Moon, highlight: 'dream' },
  { id: 'settings', label: 'Settings', icon: Settings },
];

/**
 * Bottom navigation bar - Sleek, minimal design with 5 tabs
 */
export const Navigation = memo(function Navigation({
  currentView,
  onNavigate,
}: NavigationProps) {
  // Don't show nav on detail view
  if (currentView === 'detail') {
    return null;
  }

  return (
    <nav className="flex items-center justify-around bg-black/95 backdrop-blur-lg border-t border-slate-800/50 px-1 py-1 safe-bottom">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;

        // Special styling for Scope (purple)
        if (item.highlight === 'scope') {
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                flex flex-col items-center justify-center py-2 px-3 rounded-xl
                transition-all duration-200 relative
                ${isActive
                  ? 'text-purple-400'
                  : 'text-purple-400/70 hover:text-purple-300'
                }
              `}
            >
              <div className={`
                p-2 rounded-xl transition-all
                ${isActive
                  ? 'bg-purple-500/20 ring-2 ring-purple-500/30'
                  : 'bg-purple-500/10'
                }
              `}>
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
              </div>
              <span className={`text-[10px] mt-0.5 font-medium ${
                isActive ? 'opacity-100' : 'opacity-70'
              }`}>
                {item.label}
              </span>
            </button>
          );
        }

        // Special styling for Dream (violet gradient)
        if (item.highlight === 'dream') {
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                flex flex-col items-center justify-center py-2 px-3 rounded-xl
                transition-all duration-200 relative
                ${isActive
                  ? 'text-violet-400'
                  : 'text-violet-400/70 hover:text-violet-300'
                }
              `}
            >
              <div className={`
                p-2 rounded-xl transition-all
                ${isActive
                  ? 'bg-gradient-to-br from-violet-500/30 to-purple-500/20 ring-2 ring-violet-500/30'
                  : 'bg-violet-500/10'
                }
              `}>
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
              </div>
              <span className={`text-[10px] mt-0.5 font-medium ${
                isActive ? 'opacity-100' : 'opacity-70'
              }`}>
                {item.label}
              </span>
            </button>
          );
        }

        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`
              flex flex-col items-center justify-center py-2 px-3 rounded-xl
              transition-all duration-200
              ${isActive
                ? 'text-blue-400'
                : 'text-slate-500 hover:text-slate-300'
              }
            `}
          >
            <Icon
              size={20}
              strokeWidth={isActive ? 2.5 : 1.5}
            />
            <span className={`text-[10px] mt-0.5 font-medium ${
              isActive ? 'opacity-100' : 'opacity-70'
            }`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
});

export default Navigation;
