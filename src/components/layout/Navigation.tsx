import { memo } from 'react';
import { Home, Search, Briefcase, Settings, Telescope } from 'lucide-react';
import type { ViewName } from '@/types';

interface NavigationProps {
  currentView: ViewName;
  onNavigate: (view: ViewName) => void;
}

interface NavItem {
  id: ViewName;
  label: string;
  icon: typeof Home;
  highlight?: boolean;
}

const navItems: NavItem[] = [
  { id: 'watchlist', label: 'Home', icon: Home },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'spectrascope', label: 'Scope', icon: Telescope, highlight: true },
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
  { id: 'settings', label: 'Settings', icon: Settings },
];

/**
 * Bottom navigation bar - Sleek, minimal design with 4 tabs
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

        // Special styling for SpectraScope (center highlight)
        if (item.highlight) {
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                flex flex-col items-center justify-center py-2 px-4 rounded-xl
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

        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`
              flex flex-col items-center justify-center py-2 px-4 rounded-xl
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
