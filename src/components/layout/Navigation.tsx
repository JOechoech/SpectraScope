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
  color: string;       // Icon color
  activeColor: string; // Brighter when active
  glowColor: string;   // Glow effect when active
}

const navItems: NavItem[] = [
  {
    id: 'watchlist',
    label: 'Home',
    icon: Home,
    color: 'text-teal-500',
    activeColor: 'text-teal-400',
    glowColor: 'rgba(20, 184, 166, 0.5)',
  },
  {
    id: 'dream',
    label: 'Dream',
    icon: Moon,
    color: 'text-violet-500',
    activeColor: 'text-violet-400',
    glowColor: 'rgba(139, 92, 246, 0.5)',
  },
  {
    id: 'spectrascope',
    label: 'Scope',
    icon: Telescope,
    color: 'text-pink-500',
    activeColor: 'text-pink-400',
    glowColor: 'rgba(236, 72, 153, 0.5)',
  },
  {
    id: 'search',
    label: 'Search',
    icon: Search,
    color: 'text-emerald-500',
    activeColor: 'text-emerald-400',
    glowColor: 'rgba(16, 185, 129, 0.5)',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    color: 'text-gray-500',
    activeColor: 'text-gray-400',
    glowColor: 'rgba(107, 114, 128, 0.4)',
  },
];

/**
 * Bottom navigation bar - Black background with colored icons
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
    <nav className="flex items-center justify-around px-2 py-2 safe-bottom bg-black">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`
              flex flex-col items-center justify-center py-1.5 px-3 rounded-xl
              transition-all duration-200
              ${isActive ? item.activeColor : item.color}
            `}
            style={isActive ? {
              filter: 'brightness(1.3)',
              textShadow: `0 0 10px ${item.glowColor}`,
            } : undefined}
          >
            <Icon
              size={22}
              strokeWidth={isActive ? 2.5 : 1.5}
              style={isActive ? {
                filter: `drop-shadow(0 0 6px ${item.glowColor})`,
              } : undefined}
            />
            <span className={`text-[10px] mt-1 font-medium ${
              isActive ? 'opacity-100' : 'opacity-60'
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
