import React, { useEffect, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  PenTool,
  RotateCw,
  Ruler,
  Tag,
  Gauge,
} from 'lucide-react';
import { SolutionStep, DrawingTool } from '../types/engineering';

interface PlaybackControlsProps {
  steps: SolutionStep[];
  currentStepIndex: number;
  onStepChange: (index: number) => void;
  onOpenExplainer: (step: SolutionStep) => void;
  activeTool: DrawingTool;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  steps,
  currentStepIndex,
  onStepChange,
  onOpenExplainer,
  activeTool,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 0.5x, 1x, 2x

  const totalSteps = steps.length;
  const currentStep = steps[currentStepIndex] || steps[0];

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying) return;

    const intervalTime = 3000 / playbackSpeed;
    const timer = setInterval(() => {
      if (currentStepIndex >= totalSteps - 1) {
        setIsPlaying(false);
      } else {
        onStepChange(currentStepIndex + 1);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, totalSteps, currentStepIndex, onStepChange]);

  const handlePrev = () => {
    setIsPlaying(false);
    if (currentStepIndex > 0) {
      onStepChange(currentStepIndex - 1);
    }
  };

  const handleNext = () => {
    setIsPlaying(false);
    if (currentStepIndex < totalSteps - 1) {
      onStepChange(currentStepIndex + 1);
    }
  };

  const handleFirst = () => {
    setIsPlaying(false);
    onStepChange(0);
  };

  const handleLast = () => {
    setIsPlaying(false);
    onStepChange(totalSteps - 1);
  };

  const getToolIcon = (tool: string) => {
    switch (tool) {
      case 'Draw Line':
        return <PenTool className="w-3.5 h-3.5 text-cyan-400" />;
      case 'Draw Arc':
        return <RotateCw className="w-3.5 h-3.5 text-amber-400" />;
      case 'Measure Distance / Angle':
        return <Ruler className="w-3.5 h-3.5 text-purple-400" />;
      case 'Annotate':
      default:
        return <Tag className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
      {/* Top Row: Current Step Header, Active Tool, & Conceptual Explainer */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/70 border border-cyan-800/60 px-2 py-0.5 rounded">
              Step {currentStep.step_number} of {totalSteps}
            </span>
            <h3 className="text-sm font-semibold text-white">
              {currentStep.title}
            </h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl pt-1">
            {currentStep.instruction_text}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {/* Active Tool Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300">
            {getToolIcon(currentStep.tool_to_activate)}
            <span>Tool: <strong>{currentStep.tool_to_activate}</strong></span>
          </div>

          {/* Conceptual Explainer Button */}
          <button
            onClick={() => onOpenExplainer(currentStep)}
            className="flex items-center gap-1.5 px-3 py-1 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 rounded-lg text-xs font-medium transition-all shadow-sm group"
            title="Read detailed engineering reasoning for this step"
          >
            <HelpCircle className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span>Why this step?</span>
          </button>
        </div>
      </div>

      {/* Scrub Timeline Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
          <span>Start: XY Ground Line</span>
          <span className="text-cyan-300 font-semibold">
            Progress: {Math.round(((currentStepIndex + 1) / totalSteps) * 100)}%
          </span>
          <span>Final Projections</span>
        </div>

        <div className="relative w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800 cursor-pointer">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>

        {/* Step Ticks */}
        <div className="flex justify-between pt-0.5 px-1">
          {steps.map((step, idx) => (
            <button
              key={step.step_number}
              onClick={() => {
                setIsPlaying(false);
                onStepChange(idx);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentStepIndex
                  ? 'bg-cyan-400 scale-150 ring-2 ring-cyan-500/40'
                  : idx < currentStepIndex
                  ? 'bg-cyan-600/70 hover:bg-cyan-400'
                  : 'bg-slate-700 hover:bg-slate-500'
              }`}
              title={`Step ${step.step_number}: ${step.title}`}
            />
          ))}
        </div>
      </div>

      {/* Controls Deck: Play, Pause, Step Buttons, Speed */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Playback Button Cluster */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleFirst}
            disabled={currentStepIndex === 0}
            className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-800 rounded-lg transition-colors"
            title="Go to First Step"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className="p-2 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-800 rounded-lg transition-colors"
            title="Previous Step"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
            title={isPlaying ? 'Pause Playback' : 'Auto-Play Construction'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span className="text-xs font-sans">Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span className="text-xs font-sans">Play Step-by-Step</span>
              </>
            )}
          </button>

          <button
            onClick={handleNext}
            disabled={currentStepIndex === totalSteps - 1}
            className="p-2 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-800 rounded-lg transition-colors"
            title="Next Step"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleLast}
            disabled={currentStepIndex === totalSteps - 1}
            className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-800 rounded-lg transition-colors"
            title="Go to Final Result"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Playback Speed Control */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-slate-400 text-xs">
            <Gauge className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Speed:</span>
          </div>

          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            {[0.5, 1, 2].map((speed) => (
              <button
                key={speed}
                onClick={() => setPlaybackSpeed(speed)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                  playbackSpeed === speed
                    ? 'bg-slate-800 text-cyan-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
