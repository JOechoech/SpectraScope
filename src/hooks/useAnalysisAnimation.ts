/**
 * useAnalysisAnimation - Hook to manage the animated analysis flow
 *
 * Coordinates the animation phases with actual AI analysis progress:
 * - Phase 1: Opus orchestrating (0-25%)
 * - Phase 2: Parallel agent search (25-60%)
 * - Phase 3: Sonnet synthesizing (60-85%)
 * - Phase 4: Finalizing scenarios (85-100%)
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { AnimationPhase } from '@/components/effects/AnalysisAnimation';

interface AgentProgress {
  grok: { keywords: string[]; progress: number };
  openai: { keywords: string[]; progress: number };
  gemini: { keywords: string[]; progress: number };
}

interface ScenarioProgress {
  bull: number;
  bear: number;
  base: number;
}

interface AnimationState {
  isActive: boolean;
  phase: AnimationPhase;
  keywords: string[];
  agentData: AgentProgress;
  scenarioProgress: ScenarioProgress;
  overallProgress: number;
}

interface UseAnalysisAnimationReturn {
  state: AnimationState;
  startAnimation: (keywords?: string[]) => void;
  stopAnimation: () => void;
  setPhase: (phase: AnimationPhase) => void;
  updateAgentProgress: (agent: keyof AgentProgress, progress: number, keywords?: string[]) => void;
  updateScenarioProgress: (scenario: keyof ScenarioProgress, progress: number) => void;
  setKeywords: (keywords: string[]) => void;
  completePhase: (phase: AnimationPhase) => void;
}

const INITIAL_AGENT_DATA: AgentProgress = {
  grok: { keywords: [], progress: 0 },
  openai: { keywords: [], progress: 0 },
  gemini: { keywords: [], progress: 0 },
};

const INITIAL_SCENARIO_PROGRESS: ScenarioProgress = {
  bull: 0,
  bear: 0,
  base: 0,
};

const DEFAULT_KEYWORDS = [
  'earnings', 'revenue', 'guidance', 'margins', 'growth',
  'catalyst', 'momentum', 'volatility', 'sentiment', 'insider'
];

export function useAnalysisAnimation(): UseAnalysisAnimationReturn {
  const [state, setState] = useState<AnimationState>({
    isActive: false,
    phase: 'idle',
    keywords: DEFAULT_KEYWORDS,
    agentData: INITIAL_AGENT_DATA,
    scenarioProgress: INITIAL_SCENARIO_PROGRESS,
    overallProgress: 0,
  });

  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Start the animation
  const startAnimation = useCallback((keywords?: string[]) => {
    setState({
      isActive: true,
      phase: 'orchestrating',
      keywords: keywords || DEFAULT_KEYWORDS,
      agentData: INITIAL_AGENT_DATA,
      scenarioProgress: INITIAL_SCENARIO_PROGRESS,
      overallProgress: 0,
    });
  }, []);

  // Stop and reset animation
  const stopAnimation = useCallback(() => {
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
    }
    setState((prev) => ({
      ...prev,
      isActive: false,
      phase: 'idle',
      overallProgress: 0,
    }));
  }, []);

  // Set specific phase
  const setPhase = useCallback((phase: AnimationPhase) => {
    setState((prev) => ({
      ...prev,
      phase,
    }));
  }, []);

  // Update agent progress
  const updateAgentProgress = useCallback(
    (agent: keyof AgentProgress, progress: number, keywords?: string[]) => {
      setState((prev) => ({
        ...prev,
        agentData: {
          ...prev.agentData,
          [agent]: {
            keywords: keywords || prev.agentData[agent].keywords,
            progress: Math.min(100, Math.max(0, progress)),
          },
        },
      }));
    },
    []
  );

  // Update scenario progress
  const updateScenarioProgress = useCallback(
    (scenario: keyof ScenarioProgress, progress: number) => {
      setState((prev) => ({
        ...prev,
        scenarioProgress: {
          ...prev.scenarioProgress,
          [scenario]: Math.min(100, Math.max(0, progress)),
        },
      }));
    },
    []
  );

  // Set keywords from orchestrator
  const setKeywords = useCallback((keywords: string[]) => {
    setState((prev) => ({
      ...prev,
      keywords,
    }));
  }, []);

  // Complete a phase and transition to next
  const completePhase = useCallback((phase: AnimationPhase) => {
    const phaseOrder: AnimationPhase[] = [
      'idle',
      'orchestrating',
      'searching',
      'synthesizing',
      'finalizing',
      'complete',
    ];

    const currentIndex = phaseOrder.indexOf(phase);
    const nextPhase = phaseOrder[currentIndex + 1] || 'complete';

    setState((prev) => ({
      ...prev,
      phase: nextPhase,
      overallProgress:
        nextPhase === 'searching' ? 25 :
        nextPhase === 'synthesizing' ? 60 :
        nextPhase === 'finalizing' ? 85 :
        nextPhase === 'complete' ? 100 : prev.overallProgress,
    }));
  }, []);

  // Calculate overall progress based on current state
  useEffect(() => {
    const { phase, agentData, scenarioProgress } = state;

    let progress = 0;

    switch (phase) {
      case 'orchestrating':
        // 0-25%: Opus phase
        progress = 12; // Midpoint of orchestrating
        break;
      case 'searching':
        // 25-60%: Agent search phase
        const avgAgentProgress =
          (agentData.grok.progress + agentData.openai.progress + agentData.gemini.progress) / 3;
        progress = 25 + (avgAgentProgress / 100) * 35;
        break;
      case 'synthesizing':
        // 60-85%: Sonnet synthesis
        progress = 72; // Midpoint of synthesizing
        break;
      case 'finalizing':
        // 85-100%: Scenario generation
        const avgScenarioProgress =
          (scenarioProgress.bull + scenarioProgress.bear + scenarioProgress.base) / 3;
        progress = 85 + (avgScenarioProgress / 100) * 15;
        break;
      case 'complete':
        progress = 100;
        break;
    }

    setState((prev) => ({
      ...prev,
      overallProgress: Math.round(progress),
    }));
  }, [state.phase, state.agentData, state.scenarioProgress]);

  return {
    state,
    startAnimation,
    stopAnimation,
    setPhase,
    updateAgentProgress,
    updateScenarioProgress,
    setKeywords,
    completePhase,
  };
}

export default useAnalysisAnimation;
