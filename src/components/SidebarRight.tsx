import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  HelpCircle,
  Calculator,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import {
  SolutionStep,
  SolvedProblemBlueprint,
  ChallengeQuestion,
  ThemeMode,
  UnitPreference,
} from '../types/engineering';
import { generateChallengeQuestions, formatLength } from '../utils/engineeringGeometry';

interface SidebarRightProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  blueprint: SolvedProblemBlueprint;
  currentStepIndex: number;
  onStepChange: (idx: number) => void;
  onOpenExplainer: (step: SolutionStep) => void;
  theme: ThemeMode;
  unit: UnitPreference;
  challengeModeEnabled: boolean;
  onToggleChallengeMode: () => void;
  isPhysicalDrawing: boolean;
}

export const SidebarRight: React.FC<SidebarRightProps> = ({
  isCollapsed,
  onToggleCollapse,
  blueprint,
  currentStepIndex,
  onStepChange,
  onOpenExplainer,
  theme,
  unit,
  challengeModeEnabled,
  onToggleChallengeMode,
  isPhysicalDrawing,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showCalculations, setShowCalculations] = useState(false);

  // Challenge Mode state
  const [activeChallenge, setActiveChallenge] = useState<ChallengeQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);

  const steps = blueprint.step_by_step_solution;
  const currentStep = steps[currentStepIndex] || steps[0];
  const challengeQuestions = generateChallengeQuestions(blueprint);

  // Check if current step has a challenge question
  useEffect(() => {
    if (challengeModeEnabled) {
      const q = challengeQuestions.find((item) => item.stepIndex === currentStepIndex);
      if (q) {
        setActiveChallenge(q);
        setSelectedOption(null);
        setIsAnswerSubmitted(false);
        setIsPlaying(false); // Pause playback on challenge!
      } else {
        setActiveChallenge(null);
      }
    } else {
      setActiveChallenge(null);
    }
  }, [currentStepIndex, challengeModeEnabled]);

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying) return;
    if (activeChallenge && !isAnswerSubmitted) {
      setIsPlaying(false);
      return;
    }

    const intervalTime = (3200 / playbackSpeed);
    const timer = setInterval(() => {
      if (currentStepIndex >= steps.length - 1) {
        setIsPlaying(false);
      } else {
        onStepChange(currentStepIndex + 1);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, currentStepIndex, steps.length, playbackSpeed, activeChallenge, isAnswerSubmitted, onStepChange]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      onStepChange(currentStepIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      onStepChange(currentStepIndex - 1);
    }
  };

  const handleOptionSelect = (val: string) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(val);
    setIsAnswerSubmitted(true);
  };

  const isLight = theme === 'draftboard';

  return (
    <aside
      className={`border-l transition-all duration-300 flex flex-col z-20 shrink-0 ${
        isCollapsed ? 'w-14' : 'w-80 lg:w-96'
      } ${
        isLight
          ? 'bg-slate-50/95 border-slate-200 text-slate-800'
          : 'bg-slate-900/95 border-slate-800 text-slate-200'
      }`}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-3 border-b border-inherit">
        <button
          onClick={onToggleCollapse}
          className={`p-1.5 rounded-lg border transition-colors ${
            isCollapsed ? 'mx-auto' : ''
          } ${
            isLight
              ? 'border-slate-300 hover:bg-slate-200 text-slate-600'
              : 'border-slate-800 hover:bg-slate-800 text-slate-400'
          }`}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>

        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">
              Step Playback &amp; Theory
            </span>
          </div>
        )}

        {!isCollapsed && (
          <button
            onClick={onToggleChallengeMode}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
              challengeModeEnabled
                ? 'bg-purple-500 text-white shadow-sm'
                : isLight
                ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
            title="Challenge Mode: Pauses playback to test your understanding before revealing geometry"
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Challenge</span>
          </button>
        )}
      </div>

      {/* Main Content */}
      {!isCollapsed && (
        <div className="flex-1 p-4 space-y-4 overflow-y-auto text-xs">
          {/* Active Step Highlighting Card */}
          <div className={`p-4 rounded-2xl border shadow-sm space-y-3 ${
            isLight
              ? 'bg-white border-slate-200'
              : 'bg-slate-950/80 border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                isLight ? 'bg-orange-100 text-orange-700' : 'bg-cyan-500/20 text-cyan-300'
              }`}>
                Step {currentStep.step_number} of {steps.length}
              </span>

              <button
                onClick={() => onOpenExplainer(currentStep)}
                className={`flex items-center gap-1 text-[11px] font-semibold transition-colors ${
                  isLight ? 'text-blue-600 hover:text-blue-800' : 'text-cyan-400 hover:text-cyan-300'
                }`}
                title="Open Conceptual Explainer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Why this step?</span>
              </button>
            </div>

            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {currentStep.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed text-xs">
                {currentStep.instruction_text}
              </p>
            </div>

            {isPhysicalDrawing && (
              <div className="flex items-center gap-2 text-[11px] text-amber-500 font-mono animate-pulse">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Simulating physical drafting tool action...</span>
              </div>
            )}
          </div>

          {/* Playback Controls */}
          <div className={`p-3.5 rounded-2xl border space-y-3 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-950/80 border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onStepChange(0)}
                  disabled={currentStepIndex === 0}
                  className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40"
                  title="First Step"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handlePrev}
                  disabled={currentStepIndex === 0}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 font-medium disabled:opacity-40"
                  title="Previous Step"
                >
                  Prev
                </button>

                {/* Primary Play Button */}
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`px-4 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-md ${
                    isLight
                      ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/30'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/30'
                  }`}
                  title={isPlaying ? 'Pause Playback' : 'Play Step-by-Step Animation'}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Play</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleNext}
                  disabled={currentStepIndex === steps.length - 1}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 font-medium disabled:opacity-40"
                  title="Next Step"
                >
                  Next
                </button>

                <button
                  onClick={() => onStepChange(steps.length - 1)}
                  disabled={currentStepIndex === steps.length - 1}
                  className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40"
                  title="Final Step"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Speed Selector */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-300 dark:border-slate-800 font-mono text-[10px]">
                {[0.5, 1, 2].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`px-1.5 py-0.5 rounded ${
                      playbackSpeed === spd
                        ? isLight
                          ? 'bg-orange-500 text-white font-bold'
                          : 'bg-cyan-500 text-slate-950 font-bold'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Scrubber slider */}
            <div className="space-y-1">
              <input
                type="range"
                min="0"
                max={steps.length - 1}
                value={currentStepIndex}
                onChange={(e) => onStepChange(parseInt(e.target.value, 10))}
                className="w-full accent-orange-500 dark:accent-cyan-400 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>Start</span>
                <span>Complete Projection ({steps.length} Steps)</span>
              </div>
            </div>
          </div>

          {/* Interactive Challenge Card (When Challenge Mode is active) */}
          {activeChallenge && (
            <div className={`p-4 rounded-2xl border space-y-3 animate-fadeIn ${
              isLight
                ? 'bg-purple-50 border-purple-200 text-purple-950'
                : 'bg-purple-950/40 border-purple-500/40 text-purple-100'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-purple-400" />
                  <span className="font-bold text-xs">Challenge Mode: Test Your Knowledge</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
                  Quiz
                </span>
              </div>

              <p className="text-xs font-medium leading-relaxed">
                {activeChallenge.question}
              </p>

              <div className="text-[11px] text-purple-400 italic bg-purple-950/30 p-2 rounded-lg border border-purple-800/30">
                {activeChallenge.formulaHint}
              </div>

              {/* Options */}
              <div className="space-y-1.5 pt-1">
                {activeChallenge.options.map((opt, i) => {
                  const isSelected = selectedOption === opt.value;
                  return (
                    <button
                      key={i}
                      onClick={() => handleOptionSelect(opt.value)}
                      disabled={isAnswerSubmitted}
                      className={`w-full p-2.5 rounded-xl border text-left font-mono text-xs flex items-center justify-between transition-all ${
                        isAnswerSubmitted
                          ? opt.isCorrect
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                            : isSelected
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                            : 'opacity-40 border-transparent'
                          : 'border-slate-300 dark:border-purple-800 hover:border-purple-400 hover:bg-purple-500/10'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isAnswerSubmitted && opt.isCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                      {isAnswerSubmitted && isSelected && !opt.isCorrect && (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      )}
                    </button>
                  );
                })}
              </div>

              {isAnswerSubmitted && (
                <div className="p-2.5 rounded-xl bg-purple-900/30 border border-purple-700/40 text-[11px] leading-relaxed space-y-2">
                  <p>{activeChallenge.explanation}</p>
                  <button
                    onClick={() => {
                      setActiveChallenge(null);
                      if (currentStepIndex < steps.length - 1) {
                        onStepChange(currentStepIndex + 1);
                      }
                    }}
                    className="w-full py-1.5 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-lg text-xs transition-colors"
                  >
                    Continue Construction
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Progressive Disclosure: Mathematical Calculation Steps Accordion */}
          <div className={`rounded-2xl border overflow-hidden ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-950/80 border-slate-800'
          }`}>
            <button
              onClick={() => setShowCalculations(!showCalculations)}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-xs">
                  Detailed Mathematical Working
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-mono">
                  {showCalculations ? 'Hide' : 'Show Calculations'}
                </span>
                {showCalculations ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {showCalculations && (
              <div className="p-3.5 pt-0 space-y-2.5 border-t border-inherit">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Step-by-step mathematical substitution for engineering graphics exam solutions:
                </p>

                {blueprint.formula_breakdowns.map((fb, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-1 font-mono"
                  >
                    <div className="text-[11px] font-bold text-slate-800 dark:text-cyan-300 font-sans">
                      {fb.label}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      Formula: {fb.formula}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-700 dark:text-amber-200">
                      Substitution: {fb.substitution}
                    </div>
                    <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 pt-0.5">
                      Result = {fb.result}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
