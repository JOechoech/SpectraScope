import { useState, useCallback } from 'react';
import { HomeView, DetailView, SettingsView, SearchView, PortfolioView, SpectraScopeView, DreamView } from '@/views';
import { Navigation } from '@/components/layout';
import { MarketStatusBar } from '@/components/ui';
import { HomeEffects, DreamEffects, ScopeEffects } from '@/components/effects';
import type { ViewName } from '@/types';

/**
 * SpectraScope - Main App Component
 *
 * All black background with subtle themed effects per tab:
 * - Home: Teal/green nebula wisps
 * - Dream: Violet rain drops
 * - Scope: Starfield with twinkling stars
 * - Search: Pure black (clean)
 * - Settings: Pure black (clean)
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

  return (
    <div className="font-sans antialiased min-h-screen bg-black">
      {/* Subtle Themed Effects Layer */}
      {view === 'watchlist' && <HomeEffects />}
      {view === 'dream' && <DreamEffects />}
      {view === 'spectrascope' && <ScopeEffects />}
      {/* Search and Settings: pure black, no effects */}

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
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-white/10">
          {view !== 'settings' && <MarketStatusBar />}
          <Navigation currentView={view} onNavigate={handleNavigate} />
        </div>
      )}
    </div>
  );
}
