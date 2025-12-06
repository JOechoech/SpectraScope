import { useState, useCallback, useMemo } from 'react';
import { HomeView, DetailView, SettingsView, SearchView, PortfolioView, SpectraScopeView, DreamView } from '@/views';
import { Navigation } from '@/components/layout';
import { MarketStatusBar } from '@/components/ui';
import { DreamEffects, ScopeEffects } from '@/components/effects';
import type { ViewName } from '@/types';

// Theme type for each view
type ThemeType = 'home' | 'dream' | 'scope' | 'search' | 'settings' | 'default';

// Map views to their themes
const viewThemeMap: Record<ViewName, ThemeType> = {
  watchlist: 'home',
  dream: 'dream',
  spectrascope: 'scope',
  search: 'search',
  settings: 'settings',
  detail: 'default',
  portfolio: 'home',
};

// Get theme class for root container
const getThemeClass = (theme: ThemeType): string => {
  switch (theme) {
    case 'dream':
      return 'theme-dream';
    case 'scope':
      return 'theme-scope';
    case 'search':
      return 'theme-search';
    case 'home':
      return 'theme-home';
    case 'settings':
      return 'theme-settings';
    default:
      return '';
  }
};

/**
 * SpectraScope - Main App Component
 * Handles view navigation and global app state
 */
export default function App() {
  const [view, setView] = useState<ViewName>('watchlist');
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [previousView, setPreviousView] = useState<ViewName>('watchlist');

  const handleSelectStock = useCallback((symbol: string) => {
    setPreviousView(view);
    setSelectedSymbol(symbol);
    setView('detail');
  }, [view]);

  const handleBack = useCallback(() => {
    setView(previousView);
    setSelectedSymbol(null);
  }, [previousView]);

  const handleOpenSettings = useCallback(() => {
    setView('settings');
  }, []);

  const handleNavigate = useCallback((newView: ViewName) => {
    if (newView !== 'detail') {
      setSelectedSymbol(null);
    }
    setView(newView);
  }, []);

  // Get the current theme based on view
  const currentTheme = useMemo(() => viewThemeMap[view], [view]);
  const themeClass = useMemo(() => getThemeClass(currentTheme), [currentTheme]);

  return (
    <div className={`font-sans antialiased min-h-screen bg-black transition-all duration-300 ${themeClass}`}>
      {/* Immersive Effects Layer */}
      {currentTheme === 'dream' && <DreamEffects />}
      {currentTheme === 'scope' && <ScopeEffects />}
      {/* Global Styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }

        /* Safe area for bottom nav */
        .safe-bottom {
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
      `}</style>

      {/* Views */}
      {view === 'watchlist' && (
        <HomeView
          onSelectStock={handleSelectStock}
          onOpenSettings={handleOpenSettings}
        />
      )}

      {view === 'portfolio' && (
        <PortfolioView
          onBack={() => setView('watchlist')}
          onSelectStock={handleSelectStock}
        />
      )}

      {view === 'detail' && selectedSymbol && (
        <DetailView symbol={selectedSymbol} onBack={handleBack} />
      )}

      {view === 'settings' && (
        <SettingsView onBack={handleBack} />
      )}

      {view === 'search' && (
        <SearchView
          onSelectStock={handleSelectStock}
          onBack={handleBack}
        />
      )}

      {view === 'spectrascope' && (
        <SpectraScopeView
          onSelectStock={handleSelectStock}
          onBack={() => setView('watchlist')}
        />
      )}

      {view === 'dream' && (
        <DreamView
          onSelectStock={handleSelectStock}
          onBack={() => setView('watchlist')}
        />
      )}

      {/* Fixed Bottom - Status + Nav combined */}
      {view !== 'detail' && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-black">
          {view !== 'settings' && <MarketStatusBar />}
          <Navigation currentView={view} onNavigate={handleNavigate} />
        </div>
      )}
    </div>
  );
}
