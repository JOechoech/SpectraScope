/**
 * BottomLine - Claude's executive summary for the investor
 *
 * Displays a conversational 5-10 sentence summary of the analysis
 * with confidence indicator and disclaimer.
 */

import { memo } from 'react';
import { Brain, AlertTriangle } from 'lucide-react';

interface BottomLineProps {
  summary: string;
  confidence: number;
  sourcesUsed: string[];
}

export const BottomLine = memo(function BottomLine({
  summary,
  confidence,
  sourcesUsed,
}: BottomLineProps) {
  // Format sources for display
  const formatSource = (source: string): string => {
    const names: Record<string, string> = {
      'technical-analysis': 'Technical',
      'news-sentiment': 'News',
      'social-sentiment': 'Social',
      'web-research': 'Research',
      'options-flow': 'Options',
    };
    return names[source] || source;
  };

  return (
    <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-xl p-5 border border-purple-500/30">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
          <Brain className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold">Claude's Bottom Line</h3>
          <p className="text-slate-400 text-sm">
            Based on {sourcesUsed.length} intelligence source
            {sourcesUsed.length !== 1 ? 's' : ''} ({sourcesUsed.map(formatSource).join(', ')})
            {' '}&bull; {confidence}% confidence
          </p>
        </div>
      </div>

      {/* Summary */}
      <p className="text-slate-200 leading-relaxed mb-4">{summary}</p>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-amber-300/80 text-xs">
          This analysis is for informational purposes only and does not
          constitute investment advice. Always do your own research and consult
          a financial advisor before making investment decisions.
        </p>
      </div>
    </div>
  );
});

export default BottomLine;
