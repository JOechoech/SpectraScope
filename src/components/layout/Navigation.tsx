import { memo } from 'react';
import { Home, Search, Settings } from 'lucide-react';
import type { ViewName } from '@/types';

interface NavigationProps {
  currentView: ViewName;
  onNavigate: (view: ViewName) => void;
}

interface NavItem {
  id: ViewName;
  label: string;
  icon: typeof Home;
}

const navItems: NavItem[] = [
  { id: 'watchlist', label: 'Home', icon: Home },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'settings', label: 'Settings', icon: Settings },
];

/**
 * Bottom navigation bar - Sleek, minimal design
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
    <nav className="flex items-center justify-around bg-black/95 backdrop-blur-lg border-t border-slate-800/50 px-2 py-1 safe-bottom">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`
              flex flex-col items-center justify-center py-2 px-6 rounded-xl
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
