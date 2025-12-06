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
          <h3 className="text-white font-medium mb-2">How to use</h3>
          <ul className="text-slate-400 text-sm space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-purple-400">1.</span>
              Select a sector to explore
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">2.</span>
              Choose a scan mode:
              <ul className="ml-4 mt-1 space-y-1 text-xs text-slate-500">
                <li>- Full AI Scan uses all AIs for comprehensive analysis</li>
                <li>- Grok Social scans X/Twitter for trending sentiment</li>
              </ul>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">3.</span>
              Add results to watchlist or deep analyze
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
});

export default SpectraScopeView;
