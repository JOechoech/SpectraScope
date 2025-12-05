import { useState, useCallback } from 'react';
import { WatchlistView, DetailView, SettingsView } from '@/views';
import { Navigation } from '@/components/layout';
import type { Stock, ViewName } from '@/types';

/**
 * SpectraScope - Main App Component
 * Handles view navigation and global app state
 */
export default function App() {
  const [view, setView] = useState<ViewName>('watchlist');
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

  const handleSelectStock = useCallback((stock: Stock) => {
    setSelectedStock(stock);
    setView('detail');
  }, []);

  const handleBack = useCallback(() => {
    setView('watchlist');
    setSelectedStock(null);
  }, []);

  const handleOpenSettings = useCallback(() => {
    setView('settings');
  }, []);

  const handleNavigate = useCallback((newView: ViewName) => {
    if (newView !== 'detail') {
      setSelectedStock(null);
    }
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
      `}</style>

      {/* Views */}
      {view === 'watchlist' && (
        <WatchlistView
          onSelectStock={handleSelectStock}
          onOpenSettings={handleOpenSettings}
        />
      )}

      {view === 'detail' && selectedStock && (
        <DetailView stock={selectedStock} onBack={handleBack} />
      )}

      {view === 'settings' && (
        <SettingsView onBack={handleBack} />
      )}

      {/* Bottom Navigation */}
      <Navigation currentView={view} onNavigate={handleNavigate} />
    </div>
  );
}
