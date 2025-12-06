import { memo, useMemo } from 'react';
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
  theme: 'home' | 'dream' | 'scope' | 'search' | 'settings';
}

const navItems: NavItem[] = [
  { id: 'watchlist', label: 'Home', icon: Home, theme: 'home' },
  { id: 'dream', label: 'Dream', icon: Moon, theme: 'dream' },
  { id: 'spectrascope', label: 'Scope', icon: Telescope, theme: 'scope' },
  { id: 'search', label: 'Search', icon: Search, theme: 'search' },
  { id: 'settings', label: 'Settings', icon: Settings, theme: 'settings' },
];

// Theme color configurations
const themeColors: Record<NavItem['theme'], {
  active: string;
  inactive: string;
  activeBg: string;
  inactiveBg: string;
}> = {
  home: {
    active: 'text-cyan-400',
    inactive: 'text-cyan-400/60 hover:text-cyan-300',
    activeBg: 'bg-gradient-to-br from-blue-500/25 to-cyan-500/20 ring-2 ring-cyan-500/30',
    inactiveBg: 'bg-cyan-500/10',
  },
  dream: {
    active: 'text-violet-400',
    inactive: 'text-violet-400/60 hover:text-violet-300',
    activeBg: 'bg-gradient-to-br from-violet-500/30 to-purple-500/20 ring-2 ring-violet-500/30',
    inactiveBg: 'bg-violet-500/10',
  },
  scope: {
    active: 'text-orange-400',
    inactive: 'text-orange-400/60 hover:text-orange-300',
    activeBg: 'bg-gradient-to-br from-pink-500/25 to-orange-500/20 ring-2 ring-orange-500/30',
    inactiveBg: 'bg-orange-500/10',
  },
  search: {
    active: 'text-emerald-400',
    inactive: 'text-emerald-400/60 hover:text-emerald-300',
    activeBg: 'bg-gradient-to-br from-green-500/25 to-cyan-500/20 ring-2 ring-emerald-500/30',
    inactiveBg: 'bg-emerald-500/10',
  },
  settings: {
    active: 'text-slate-300',
    inactive: 'text-slate-500 hover:text-slate-400',
    activeBg: 'bg-slate-700/30 ring-2 ring-slate-600/30',
    inactiveBg: 'bg-slate-700/10',
  },
};

// Get navbar background class based on active theme
const getNavbarBgClass = (activeTheme: NavItem['theme']) => {
  switch (activeTheme) {
    case 'dream':
      return 'nav-theme-dream';
    case 'scope':
      return 'nav-theme-scope';
    case 'search':
      return 'nav-theme-search';
    case 'home':
      return 'nav-theme-home';
    case 'settings':
    default:
      return 'nav-theme-settings';
  }
};

/**
 * Bottom navigation bar - Immersive themed design with 5 tabs
 */
export const Navigation = memo(function Navigation({
  currentView,
  onNavigate,
}: NavigationProps) {
  // Don't show nav on detail view
  if (currentView === 'detail') {
    return null;
  }

  // Get the active theme based on current view
  const activeTheme = useMemo(() => {
    const activeItem = navItems.find(item => item.id === currentView);
    return activeItem?.theme || 'home';
  }, [currentView]);

  return (
    <nav className={`
      flex items-center justify-around px-1 py-1 safe-bottom
      transition-all duration-300 backdrop-blur-lg
      ${getNavbarBgClass(activeTheme)}
    `}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;
        const colors = themeColors[item.theme];

        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`
              flex flex-col items-center justify-center py-2 px-3 rounded-xl
              transition-all duration-200 relative
              ${isActive ? colors.active : colors.inactive}
            `}
          >
            <div className={`
              p-2 rounded-xl transition-all duration-200
              ${isActive ? colors.activeBg : colors.inactiveBg}
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
      })}
    </nav>
  );
});

export default Navigation;
