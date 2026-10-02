import React from 'react';
import { SolutionStep, DrawingTool } from '../types/engineering';
import { PenTool, RotateCw, Ruler, Tag, Check, ArrowRight } from 'lucide-react';

interface StepWalkthroughListProps {
  steps: SolutionStep[];
  currentStepIndex: number;
  onSelectStep: (index: number) => void;
  onOpenExplainer: (step: SolutionStep) => void;
}

export const StepWalkthroughList: React.FC<StepWalkthroughListProps> = ({
  steps,
  currentStepIndex,
  onSelectStep,
  onOpenExplainer,
}) => {
  const getToolIcon = (tool: DrawingTool) => {
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
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white">
            Sequential Construction Blueprint
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any step to inspect coordinates and view its graphical state on the drawing canvas.
          </p>
        </div>

        <span className="text-xs font-mono text-cyan-400">
          {steps.length} Total Steps
        </span>
      </div>

      <div className="space-y-2.5">
        {steps.map((step, idx) => {
          const isActive = idx === currentStepIndex;
          const isCompleted = idx < currentStepIndex;

          return (
            <div
              key={step.step_number}
              onClick={() => onSelectStep(idx)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                isActive
                  ? 'bg-slate-800/90 border-cyan-500 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                  : isCompleted
                  ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-950/30 border-slate-800/60 opacity-75 hover:opacity-100 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3 flex-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5 ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950'
                      : isCompleted
                      ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.step_number}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">
                      {step.title}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono flex items-center gap-1">
                      {getToolIcon(step.tool_to_activate)}
                      <span>{step.tool_to_activate}</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {step.instruction_text}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenExplainer(step);
                  }}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 px-2.5 py-1 rounded bg-cyan-950/50 hover:bg-cyan-950 border border-cyan-800/50 transition-colors"
                >
                  Explainer
                </button>

                <button
                  type="button"
                  onClick={() => onSelectStep(idx)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isActive ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
