/**
 * AnalysisAnimation - Animated visualization of the AI analysis flow
 *
 * Shows the multi-AI orchestration process:
 * - Phase 1: Opus analyzing ticker with flying keywords
 * - Phase 2: Parallel agent search (Grok, OpenAI, Gemini)
 * - Phase 3: Data flowing to Sonnet for synthesis
 * - Phase 4: Scenario generation with progress bars
 */

import { useEffect, useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type AnimationPhase = 'idle' | 'orchestrating' | 'searching' | 'synthesizing' | 'finalizing' | 'complete';

interface AnalysisAnimationProps {
  isActive: boolean;
  phase: AnimationPhase;
  keywords?: string[];
  agentData?: {
    grok?: { keywords: string[]; progress: number };
    openai?: { keywords: string[]; progress: number };
    gemini?: { keywords: string[]; progress: number };
  };
  scenarioProgress?: {
    bull: number;
    bear: number;
    base: number;
  };
  onPhaseComplete?: (phase: AnimationPhase) => void;
}

interface FlyingKeyword {
  id: string;
  text: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  delay: number;
  color: string;
}

interface DataBubble {
  id: string;
  source: 'grok' | 'openai' | 'gemini';
  text: string;
  startX: number;
  startY: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const AGENT_COLORS = {
  opus: '#d97706',
  grok: '#1d9bf0',
  openai: '#10b981',
  gemini: '#8b5cf6',
  sonnet: '#6366f1',
};

const AGENT_ICONS = {
  opus: '🧠',
  grok: '𝕏',
  openai: '🤖',
  gemini: '✦',
  sonnet: '📊',
};

const DEFAULT_KEYWORDS = [
  'earnings', 'revenue', 'guidance', 'margins', 'growth',
  'catalyst', 'momentum', 'volatility', 'sentiment', 'insider'
];

// ═══════════════════════════════════════════════════════════════════════════
// FLYING KEYWORD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const FlyingKeywordComponent = memo(function FlyingKeywordComponent({
  keyword,
  isActive,
}: {
  keyword: FlyingKeyword;
  isActive: boolean;
}) {
  return (
    <motion.div
      key={keyword.id}
      className="absolute pointer-events-none"
      initial={{
        x: keyword.x,
        y: keyword.y,
        opacity: 0,
        scale: 0.5
      }}
      animate={isActive ? {
        x: keyword.targetX,
        y: keyword.targetY,
        opacity: [0, 1, 1, 0.8],
        scale: [0.5, 1.2, 1]
      } : {}}
      transition={{
        duration: 2,
        delay: keyword.delay,
        ease: 'easeOut'
      }}
    >
      <span
        className="text-xs font-mono px-2 py-1 rounded-full whitespace-nowrap"
        style={{
          backgroundColor: `${keyword.color}20`,
          color: keyword.color,
          border: `1px solid ${keyword.color}40`,
          textShadow: `0 0 10px ${keyword.color}`,
        }}
      >
        {keyword.text}
      </span>
    </motion.div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// OPUS ORCHESTRATOR COMPONENT (Phase 1)
// ═══════════════════════════════════════════════════════════════════════════

const OpusOrchestrator = memo(function OpusOrchestrator({
  keywords,
  isActive,
}: {
  keywords: string[];
  isActive: boolean;
}) {
  const [flyingKeywords, setFlyingKeywords] = useState<FlyingKeyword[]>([]);

  useEffect(() => {
    if (!isActive) {
      setFlyingKeywords([]);
      return;
    }

    // Generate flying keywords from center outward
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2 - 50;

    const newKeywords: FlyingKeyword[] = keywords.slice(0, 8).map((text, i) => {
      const angle = (i / 8) * Math.PI * 2;
      const radius = 120 + Math.random() * 60;
      return {
        id: `opus-${i}`,
        text,
        x: centerX,
        y: centerY,
        targetX: centerX + Math.cos(angle) * radius,
        targetY: centerY + Math.sin(angle) * radius,
        delay: i * 0.15,
        color: AGENT_COLORS.opus,
      };
    });

    setFlyingKeywords(newKeywords);
  }, [isActive, keywords]);

  return (
    <div className="absolute inset-0">
      {/* Central Opus icon */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        initial={{ scale: 0, opacity: 0 }}
        animate={isActive ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-4xl"
          style={{
            background: `radial-gradient(circle, ${AGENT_COLORS.opus}30, transparent)`,
            boxShadow: `0 0 40px ${AGENT_COLORS.opus}60`,
            border: `2px solid ${AGENT_COLORS.opus}`,
          }}
        >
          {AGENT_ICONS.opus}
        </div>
        <motion.div
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <span
            className="text-sm font-bold tracking-widest"
            style={{ color: AGENT_COLORS.opus }}
          >
            OPUS ORCHESTRATING
          </span>
        </motion.div>
      </motion.div>

      {/* Flying keywords */}
      <AnimatePresence>
        {flyingKeywords.map((keyword) => (
          <FlyingKeywordComponent
            key={keyword.id}
            keyword={keyword}
            isActive={isActive}
          />
        ))}
      </AnimatePresence>

      {/* Pulsing rings */}
      {isActive && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={`ring-${i}`}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
              style={{ borderColor: `${AGENT_COLORS.opus}40` }}
              initial={{ width: 80, height: 80, opacity: 0.8 }}
              animate={{
                width: [80, 200],
                height: [80, 200],
                opacity: [0.6, 0],
              }}
              transition={{
                duration: 2,
                delay: i * 0.6,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />
          ))}
        </>
      )}
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// AGENT SEARCH COMPONENT (Phase 2)
// ═══════════════════════════════════════════════════════════════════════════

const AgentSearch = memo(function AgentSearch({
  agentData,
  isActive,
}: {
  agentData?: AnalysisAnimationProps['agentData'];
  isActive: boolean;
}) {
  const agents = [
    { id: 'grok', name: 'GROK', icon: AGENT_ICONS.grok, color: AGENT_COLORS.grok, label: 'X/TWITTER' },
    { id: 'openai', name: 'OPENAI', icon: AGENT_ICONS.openai, color: AGENT_COLORS.openai, label: 'PRESS RELEASES' },
    { id: 'gemini', name: 'GEMINI', icon: AGENT_ICONS.gemini, color: AGENT_COLORS.gemini, label: 'NEWS' },
  ];

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="flex gap-16">
        {agents.map((agent, index) => {
          const data = agentData?.[agent.id as keyof typeof agentData];
          const keywords = data?.keywords || [];
          const progress = data?.progress || 0;

          return (
            <motion.div
              key={agent.id}
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 50 }}
              animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              {/* Floating keywords above agent */}
              <div className="relative h-24 w-32 mb-4">
                <AnimatePresence>
                  {keywords.slice(0, 3).map((keyword, ki) => (
                    <motion.div
                      key={`${agent.id}-kw-${ki}`}
                      className="absolute left-1/2 -translate-x-1/2"
                      style={{ top: ki * 24 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{
                        opacity: [0, 1, 1, 0.7],
                        y: [20, 0, -5, 0],
                      }}
                      transition={{
                        duration: 2,
                        delay: ki * 0.3,
                        repeat: Infinity,
                        repeatDelay: 1,
                      }}
                    >
                      <span
                        className="text-xs font-mono px-2 py-0.5 rounded whitespace-nowrap"
                        style={{
                          backgroundColor: `${agent.color}15`,
                          color: agent.color,
                          border: `1px solid ${agent.color}30`,
                        }}
                      >
                        {keyword}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Agent icon */}
              <motion.div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl relative"
                style={{
                  background: `radial-gradient(circle, ${agent.color}25, transparent)`,
                  border: `2px solid ${agent.color}`,
                  boxShadow: `0 0 20px ${agent.color}40`,
                }}
                animate={isActive ? {
                  boxShadow: [
                    `0 0 20px ${agent.color}40`,
                    `0 0 35px ${agent.color}60`,
                    `0 0 20px ${agent.color}40`,
                  ],
                } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {agent.icon}

                {/* Progress ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="30"
                    fill="none"
                    stroke={`${agent.color}30`}
                    strokeWidth="3"
                  />
                  <motion.circle
                    cx="32"
                    cy="32"
                    r="30"
                    fill="none"
                    stroke={agent.color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={188}
                    initial={{ strokeDashoffset: 188 }}
                    animate={{ strokeDashoffset: 188 - (progress / 100) * 188 }}
                    transition={{ duration: 0.5 }}
                  />
                </svg>
              </motion.div>

              {/* Agent label */}
              <motion.div
                className="mt-3 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div
                  className="text-sm font-bold tracking-wider"
                  style={{ color: agent.color }}
                >
                  {agent.name}
                </div>
                <div className="text-xs text-white/50 mt-0.5">
                  {agent.label}
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// SONNET SYNTHESIS COMPONENT (Phase 3)
// ═══════════════════════════════════════════════════════════════════════════

const SonnetSynthesis = memo(function SonnetSynthesis({
  isActive,
}: {
  isActive: boolean;
}) {
  const [dataBubbles, setDataBubbles] = useState<DataBubble[]>([]);

  useEffect(() => {
    if (!isActive) {
      setDataBubbles([]);
      return;
    }

    // Generate data bubbles flowing toward Sonnet
    const sources: Array<{ id: 'grok' | 'openai' | 'gemini'; x: number }> = [
      { id: 'grok', x: window.innerWidth * 0.25 },
      { id: 'openai', x: window.innerWidth * 0.5 },
      { id: 'gemini', x: window.innerWidth * 0.75 },
    ];

    const bubbleTexts = {
      grok: ['sentiment', 'trending', 'viral', 'mentions'],
      openai: ['earnings', 'guidance', 'filing', 'press'],
      gemini: ['analysis', 'forecast', 'target', 'rating'],
    };

    let bubbleId = 0;
    const interval = setInterval(() => {
      const source = sources[Math.floor(Math.random() * sources.length)];
      const texts = bubbleTexts[source.id];
      const text = texts[Math.floor(Math.random() * texts.length)];

      setDataBubbles((prev) => [
        ...prev.slice(-15), // Keep last 15 bubbles
        {
          id: `bubble-${bubbleId++}`,
          source: source.id,
          text,
          startX: source.x,
          startY: window.innerHeight * 0.35,
        },
      ]);
    }, 400);

    return () => clearInterval(interval);
  }, [isActive]);

  const centerX = typeof window !== 'undefined' ? window.innerWidth / 2 : 500;
  const centerY = typeof window !== 'undefined' ? window.innerHeight * 0.65 : 400;

  return (
    <div className="absolute inset-0">
      {/* Data bubbles */}
      <AnimatePresence>
        {dataBubbles.map((bubble) => (
          <motion.div
            key={bubble.id}
            className="absolute pointer-events-none"
            initial={{
              x: bubble.startX,
              y: bubble.startY,
              opacity: 1,
              scale: 0.8,
            }}
            animate={{
              x: centerX,
              y: centerY,
              opacity: [1, 1, 0],
              scale: [0.8, 1, 0.5],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeIn' }}
          >
            <span
              className="text-xs font-mono px-2 py-1 rounded-full"
              style={{
                backgroundColor: `${AGENT_COLORS[bubble.source]}20`,
                color: AGENT_COLORS[bubble.source],
                border: `1px solid ${AGENT_COLORS[bubble.source]}40`,
              }}
            >
              {bubble.text}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Central Sonnet icon */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2"
        style={{ top: '60%' }}
        initial={{ scale: 0, opacity: 0 }}
        animate={isActive ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="w-28 h-28 rounded-full flex items-center justify-center text-5xl relative"
          style={{
            background: `radial-gradient(circle, ${AGENT_COLORS.sonnet}35, ${AGENT_COLORS.sonnet}10)`,
            border: `3px solid ${AGENT_COLORS.sonnet}`,
          }}
          animate={{
            boxShadow: [
              `0 0 30px ${AGENT_COLORS.sonnet}50`,
              `0 0 60px ${AGENT_COLORS.sonnet}70`,
              `0 0 30px ${AGENT_COLORS.sonnet}50`,
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {AGENT_ICONS.sonnet}

          {/* Absorption ring effect */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={`absorb-${i}`}
              className="absolute inset-0 rounded-full border-2"
              style={{ borderColor: `${AGENT_COLORS.sonnet}60` }}
              animate={{
                scale: [1.5, 1],
                opacity: [0, 0.6, 0],
              }}
              transition={{
                duration: 1.5,
                delay: i * 0.5,
                repeat: Infinity,
              }}
            />
          ))}
        </motion.div>

        <motion.div
          className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div
            className="text-sm font-bold tracking-widest"
            style={{ color: AGENT_COLORS.sonnet }}
          >
            SONNET SYNTHESIZING
          </div>
          <div className="text-xs text-white/50 mt-1">
            CROSS-REFERENCING DATA
          </div>
        </motion.div>
      </motion.div>

      {/* Source indicators at top */}
      <div className="absolute top-[30%] left-0 right-0 flex justify-around px-20">
        {[
          { id: 'grok', icon: AGENT_ICONS.grok, color: AGENT_COLORS.grok },
          { id: 'openai', icon: AGENT_ICONS.openai, color: AGENT_COLORS.openai },
          { id: 'gemini', icon: AGENT_ICONS.gemini, color: AGENT_COLORS.gemini },
        ].map((source) => (
          <motion.div
            key={source.id}
            className="flex flex-col items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 0.3 }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
              style={{
                background: `${source.color}20`,
                border: `1px solid ${source.color}40`,
              }}
            >
              {source.icon}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO GENERATION COMPONENT (Phase 4)
// ═══════════════════════════════════════════════════════════════════════════

const ScenarioGeneration = memo(function ScenarioGeneration({
  progress,
  isActive,
}: {
  progress: AnalysisAnimationProps['scenarioProgress'];
  isActive: boolean;
}) {
  const scenarios = [
    { id: 'bull', name: 'BULL CASE', color: '#10b981', icon: '📈' },
    { id: 'base', name: 'BASE CASE', color: '#6366f1', icon: '📊' },
    { id: 'bear', name: 'BEAR CASE', color: '#f43f5e', icon: '📉' },
  ];

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={isActive ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full max-w-md px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-2xl mb-2">🎯</div>
          <div
            className="text-lg font-bold tracking-widest"
            style={{ color: AGENT_COLORS.sonnet }}
          >
            GENERATING SCENARIOS
          </div>
        </motion.div>

        {/* Scenario progress bars */}
        <div className="space-y-6">
          {scenarios.map((scenario, index) => {
            const value = progress?.[scenario.id as keyof typeof progress] || 0;

            return (
              <motion.div
                key={scenario.id}
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 + index * 0.15 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{scenario.icon}</span>
                    <span
                      className="text-sm font-bold tracking-wider"
                      style={{ color: scenario.color }}
                    >
                      {scenario.name}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-white/60">
                    {Math.round(value)}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="relative h-3 rounded-full overflow-hidden bg-slate-800/80">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${scenario.color}80, ${scenario.color})`,
                      boxShadow: value > 50 ? `0 0 15px ${scenario.color}60` : 'none',
                    }}
                    initial={{ width: '0%' }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />

                  {/* Shimmer effect */}
                  {value > 0 && value < 100 && (
                    <motion.div
                      className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{ x: [-32, 400] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Completion indicator */}
        {progress && progress.bull === 100 && progress.bear === 100 && progress.base === 100 && (
          <motion.div
            className="text-center mt-8"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <div className="text-3xl mb-2">✨</div>
            <div className="text-emerald-400 font-bold tracking-widest">
              ANALYSIS COMPLETE
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const AnalysisAnimation = memo(function AnalysisAnimation({
  isActive,
  phase,
  keywords = DEFAULT_KEYWORDS,
  agentData,
  scenarioProgress,
  onPhaseComplete,
}: AnalysisAnimationProps) {
  // Phase completion callback
  const handlePhaseComplete = useCallback((completedPhase: AnimationPhase) => {
    onPhaseComplete?.(completedPhase);
  }, [onPhaseComplete]);

  // Auto-advance phases for demo
  useEffect(() => {
    if (!isActive) return;

    const timers: NodeJS.Timeout[] = [];

    if (phase === 'orchestrating') {
      timers.push(setTimeout(() => handlePhaseComplete('orchestrating'), 5000));
    } else if (phase === 'searching') {
      timers.push(setTimeout(() => handlePhaseComplete('searching'), 8000));
    } else if (phase === 'synthesizing') {
      timers.push(setTimeout(() => handlePhaseComplete('synthesizing'), 6000));
    } else if (phase === 'finalizing') {
      timers.push(setTimeout(() => handlePhaseComplete('finalizing'), 4000));
    }

    return () => timers.forEach(clearTimeout);
  }, [isActive, phase, handlePhaseComplete]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 overflow-hidden">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Phase indicator */}
      <motion.div
        className="absolute top-6 left-1/2 -translate-x-1/2 z-10"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 border border-slate-700/50">
          {['orchestrating', 'searching', 'synthesizing', 'finalizing'].map((p, i) => (
            <div
              key={p}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                phase === p
                  ? 'w-6 bg-indigo-500'
                  : ['orchestrating', 'searching', 'synthesizing', 'finalizing'].indexOf(phase) > i
                  ? 'bg-emerald-500'
                  : 'bg-slate-600'
              }`}
            />
          ))}
        </div>
      </motion.div>

      {/* Phase content */}
      <AnimatePresence mode="wait">
        {phase === 'orchestrating' && (
          <motion.div
            key="orchestrating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <OpusOrchestrator keywords={keywords} isActive={true} />
          </motion.div>
        )}

        {phase === 'searching' && (
          <motion.div
            key="searching"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <AgentSearch agentData={agentData} isActive={true} />
          </motion.div>
        )}

        {phase === 'synthesizing' && (
          <motion.div
            key="synthesizing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <SonnetSynthesis isActive={true} />
          </motion.div>
        )}

        {phase === 'finalizing' && (
          <motion.div
            key="finalizing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ScenarioGeneration progress={scenarioProgress} isActive={true} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom branding */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔭</span>
          <span className="text-white/80 font-semibold tracking-wider">
            SPECTRASCOPE
          </span>
        </div>
      </motion.div>
    </div>
  );
});

export default AnalysisAnimation;
