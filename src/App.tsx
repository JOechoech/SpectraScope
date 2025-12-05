import { useState, useCallback } from 'react';
import { WatchlistView, DetailView, SettingsView, SearchView, PortfolioView } from '@/views';
import { Navigation } from '@/components/layout';
import { MarketStatusBar } from '@/components/ui';
import type { ViewName } from '@/types';

/**
 * SpectraScope - Main App Component
 * Handles view navigation and global app state
 */
export default function App() {
  const [view, setView] = useState<ViewName>('watchlist');
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [showPortfolio, setShowPortfolio] = useState(false);

  const handleSelectStock = useCallback((symbol: string) => {
    setSelectedSymbol(symbol);
    setShowPortfolio(false);
    setView('detail');
  }, []);

  const handleBack = useCallback(() => {
    setShowPortfolio(false);
    setView('watchlist');
    setSelectedSymbol(null);
  }, []);

  const handleOpenSettings = useCallback(() => {
    setView('settings');
  }, []);

  const handleOpenPortfolio = useCallback(() => {
    setShowPortfolio(true);
  }, []);

  const handleNavigate = useCallback((newView: ViewName) => {
    if (newView !== 'detail') {
      setSelectedSymbol(null);
    }
    setShowPortfolio(false);
    setView(newView);
  }, []);

  return (
    <div className="font-sans antialiased min-h-screen bg-black">
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
      {showPortfolio && (
        <PortfolioView
          onBack={() => setShowPortfolio(false)}
          onSelectStock={handleSelectStock}
        />
      )}

      {!showPortfolio && view === 'watchlist' && (
        <WatchlistView
          onSelectStock={handleSelectStock}
          onOpenSettings={handleOpenSettings}
          onOpenPortfolio={handleOpenPortfolio}
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

      {/* Fixed Bottom - Status + Nav combined */}
      {view !== 'detail' && !showPortfolio && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-black">
          {view !== 'settings' && <MarketStatusBar />}
          <Navigation currentView={view} onNavigate={handleNavigate} />
        </div>
      )}
    </div>
  );
}
