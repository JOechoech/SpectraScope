/**
 * AIPowerBar - Futuristic loading bar for AI analysis
 *
 * Shows:
 * - Power level as each AI completes
 * - AI status indicators (Gemini, Grok, OpenAI)
 * - Animation status messages
 * - Electric sparks/lightning effects
 */

import { memo, useMemo } from 'react';
import { Zap, Search, MessageCircle, Newspaper, Sparkles } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type AISource = 'gemini' | 'grok' | 'openai' | 'claude';

export interface AIStatus {
  source: AISource;
  status: 'pending' | 'loading' | 'complete' | 'error' | 'unavailable';
}

export interface AIPowerBarProps {
  aiStatuses: AIStatus[];
  currentPhase: 'idle' | 'gemini' | 'grok' | 'openai' | 'claude' | 'complete';
  powerLevel: number; // 0-100
  isActive: boolean;
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// AI CONFIG
// ═══════════════════════════════════════════════════════════════════════════

const AI_CONFIG: Record<AISource, { icon: typeof Search; label: string; color: string; bgColor: string }> = {
  gemini: {
    icon: Search,
    label: 'Gemini',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
  },
  grok: {
    icon: MessageCircle,
    label: 'Grok',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
  },
  openai: {
    icon: Newspaper,
    label: 'OpenAI',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
  },
  claude: {
    icon: Sparkles,
    label: 'Claude',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
  },
};

const PHASE_MESSAGES: Record<string, string> = {
  idle: 'READY TO ANALYZE',
  gemini: 'GEMINI INITIATING WEB RESEARCH...',
  grok: 'GROK ANALYZING X SOCIAL SENTIMENT...',
  openai: 'OPENAI SCANNING LATEST NEWS...',
  claude: 'CLAUDE SYNTHESIZING INTELLIGENCE...',
  complete: 'ANALYSIS COMPLETE',
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const AIPowerBar = memo(function AIPowerBar({
  aiStatuses,
  currentPhase,
  powerLevel,
  isActive,
  className = '',
}: AIPowerBarProps) {
  const message = PHASE_MESSAGES[currentPhase] || 'PROCESSING...';

  // Filter to show only the 3 main AIs (not Claude)
  const displayedAIs = useMemo(() =>
    aiStatuses.filter(s => s.source !== 'claude'),
    [aiStatuses]
  );

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Power Bar */}
      <div className="relative">
        {/* Label */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap
              size={14}
              className={`${isActive ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`}
            />
            <span className={`text-xs font-bold tracking-wider ${
              isActive ? 'text-amber-400' : 'text-slate-500'
            }`}>
              AI POWER
            </span>
          </div>
          <span className={`text-xs font-mono ${
            isActive ? 'text-white' : 'text-slate-600'
          }`}>
            {powerLevel}%
          </span>
        </div>

        {/* Bar Container */}
        <div className={`relative h-3 rounded-full overflow-hidden ${
          isActive ? 'bg-slate-800' : 'bg-slate-900'
        }`}>
          {/* Fill */}
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
              powerLevel >= 80
                ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 animate-power-surge'
                : powerLevel >= 50
                ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
                : 'bg-gradient-to-r from-blue-600 to-blue-500'
            }`}
            style={{ width: `${powerLevel}%` }}
          />

          {/* Electric Sparks at Edge (when near full) */}
          {isActive && powerLevel >= 70 && (
            <div
              className="absolute top-0 bottom-0 w-4 animate-electric-spark"
              style={{ left: `calc(${powerLevel}% - 8px)` }}
            >
              <div className="absolute inset-0 bg-white/50 blur-sm rounded-full" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full" />
            </div>
          )}

          {/* Vibration Effect at High Power */}
          {isActive && powerLevel >= 90 && (
            <div className="absolute inset-0 animate-vibrate opacity-30 bg-gradient-to-r from-transparent via-white to-transparent" />
          )}
        </div>
      </div>

      {/* Status Message */}
      <div className={`text-center ${isActive ? 'animate-pulse' : ''}`}>
        <span className={`text-xs font-mono tracking-widest ${
          isActive
            ? currentPhase === 'complete'
              ? 'text-emerald-400'
              : 'text-cyan-400'
            : 'text-slate-600'
        }`}>
          {message}
        </span>
      </div>

      {/* AI Status Indicators */}
      <div className="flex items-center justify-center gap-4">
        {displayedAIs.map((ai) => (
          <AIStatusIndicator key={ai.source} {...ai} />
        ))}
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// AI STATUS INDICATOR
// ═══════════════════════════════════════════════════════════════════════════

interface AIStatusIndicatorProps {
  source: AISource;
  status: 'pending' | 'loading' | 'complete' | 'error' | 'unavailable';
}

const AIStatusIndicator = memo(function AIStatusIndicator({
  source,
  status,
}: AIStatusIndicatorProps) {
  const config = AI_CONFIG[source];
  const Icon = config.icon;

  const statusColors = {
    pending: 'text-slate-600 bg-slate-800/50',
    loading: `${config.color} ${config.bgColor} animate-pulse`,
    complete: 'text-emerald-400 bg-emerald-500/20',
    error: 'text-rose-400 bg-rose-500/20',
    unavailable: 'text-slate-700 bg-slate-900/50',
  };

  const statusDot = {
    pending: 'bg-slate-600',
    loading: 'bg-amber-400 animate-pulse',
    complete: 'bg-emerald-400',
    error: 'bg-rose-400',
    unavailable: 'bg-slate-700',
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`p-2 rounded-xl ${statusColors[status]} transition-all duration-300`}>
        <Icon size={16} className={status === 'loading' ? 'animate-spin-slow' : ''} />
      </div>
      <div className="flex items-center gap-1">
        <div className={`w-1.5 h-1.5 rounded-full ${statusDot[status]}`} />
        <span className={`text-[10px] font-medium ${
          status === 'unavailable' ? 'text-slate-700' : 'text-slate-400'
        }`}>
          {config.label}
        </span>
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// SIMPLE VERSION (for inline use)
// ═══════════════════════════════════════════════════════════════════════════

export interface AIStatusRowProps {
  geminiAvailable: boolean;
  grokAvailable: boolean;
  openaiAvailable: boolean;
  className?: string;
}

export const AIStatusRow = memo(function AIStatusRow({
  geminiAvailable,
  grokAvailable,
  openaiAvailable,
  className = '',
}: AIStatusRowProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <StatusDot available={geminiAvailable} label="Gemini" color="purple" />
      <StatusDot available={grokAvailable} label="Grok" color="cyan" />
      <StatusDot available={openaiAvailable} label="OpenAI" color="emerald" />
    </div>
  );
});

interface StatusDotProps {
  available: boolean;
  label: string;
  color: 'purple' | 'cyan' | 'emerald';
}

const StatusDot = memo(function StatusDot({ available, label, color }: StatusDotProps) {
  const colors = {
    purple: available ? 'bg-purple-400' : 'bg-slate-700',
    cyan: available ? 'bg-cyan-400' : 'bg-slate-700',
    emerald: available ? 'bg-emerald-400' : 'bg-slate-700',
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${colors[color]}`} />
      <span className={`text-xs ${available ? 'text-slate-300' : 'text-slate-600'}`}>
        {label}
      </span>
    </div>
  );
});

export default AIPowerBar;
