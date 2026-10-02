import React from 'react';
import { X, HelpCircle, Lightbulb, ArrowRight, Compass } from 'lucide-react';
import { SolutionStep } from '../types/engineering';

interface ConceptualModalProps {
  step: SolutionStep | null;
  onClose: () => void;
}

export const ConceptualModal: React.FC<ConceptualModalProps> = ({ step, onClose }) => {
  if (!step) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <Lightbulb className="w-4 h-4 text-cyan-400" />
            <span>Conceptual Explainer · Step {step.step_number}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Title & Instruction */}
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-white font-sans">
            {step.title}
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            {step.instruction_text}
          </p>
        </div>

        {/* Conceptual Reason - The "Why" */}
        <div className="space-y-1.5 bg-gradient-to-br from-cyan-950/40 to-blue-950/20 border border-cyan-500/30 p-4 rounded-xl">
          <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>Why do we execute this step?</span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed font-sans">
            {step.conceptual_hint}
          </p>
        </div>

        {/* Engineering Graphics Principle Tip */}
        <div className="text-[11px] text-slate-400 leading-normal flex items-start gap-2 pt-1 border-t border-slate-800/80">
          <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
          <span>
            <strong>Drafting Principle:</strong> Orthographic projection relies on geometric invariants. When any line is parallel to a plane of projection, its projection upon that plane is in its True Length and shows its true inclination angle.
          </span>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Got it, continue drawing
          </button>
        </div>
      </div>
    </div>
  );
};
