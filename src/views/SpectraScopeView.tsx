/**
 * SpectraScopeView - Dedicated AI Stock Discovery View
 *
 * Features:
 * - Full-page SpectraScope scanner
 * - Two scan modes: Full AI Scan & Grok Social Scan
 * - Sector-based stock discovery
 */

import { memo } from 'react';
import { Header } from '@/components/layout';
import { ScopeSuggest } from '@/components/discovery/ScopeSuggest';

interface SpectraScopeViewProps {
  onSelectStock: (symbol: string) => void;
  onBack: () => void;
}

export const SpectraScopeView = memo(function SpectraScopeView({
  onSelectStock,
  onBack,
}: SpectraScopeViewProps) {
  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header */}
      <Header
        title="SpectraScope"
        subtitle="AI Stock Discovery"
        showBack
        onBack={onBack}
      />

      {/* Main Content */}
      <div className="px-5 py-4">
        <ScopeSuggest onSelectStock={onSelectStock} />
      </div>

      {/* Tips Section */}
      <div className="px-5 mt-4">
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-4">
          <h3 className="text-white font-medium mb-3">How to use</h3>
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <span className="text-purple-400 font-medium shrink-0">1.</span>
              <span className="text-slate-400">Select a sector to explore</span>
            </div>
            <div className="flex gap-3">
              <span className="text-purple-400 font-medium shrink-0">2.</span>
              <div className="text-slate-400">
                <p>Choose a scan mode:</p>
                <p className="text-xs text-slate-500 mt-1 ml-2">• Full AI Scan - All AIs (~$0.30)</p>
                <p className="text-xs text-slate-500 ml-2">• Grok Social - X/Twitter (~$0.01)</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-purple-400 font-medium shrink-0">3.</span>
              <span className="text-slate-400">Add results to watchlist or deep analyze</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default SpectraScopeView;
