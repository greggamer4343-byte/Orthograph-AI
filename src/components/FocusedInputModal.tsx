import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  ClipboardPaste,
  AlertTriangle,
  Lightbulb,
  Check,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import {
  PRESET_PROBLEMS,
  parseNaturalLanguageText,
  validateProblemGeometry,
  detectAmbiguities,
} from '../utils/engineeringGeometry';
import { ImpossibilityError, AmbiguityPrompt, ThemeMode } from '../types/engineering';

interface FocusedInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSolveQuestion: (q: string) => void;
  isLoading: boolean;
  initialQuestion?: string;
  theme?: ThemeMode;
}

export const FocusedInputModal: React.FC<FocusedInputModalProps> = ({
  isOpen,
  onClose,
  onSolveQuestion,
  isLoading,
  initialQuestion = '',
  theme = 'blueprint',
}) => {
  const [questionText, setQuestionText] = useState(initialQuestion);
  const [impossibility, setImpossibility] = useState<ImpossibilityError | null>(null);
  const [ambiguity, setAmbiguity] = useState<AmbiguityPrompt | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQuestionText(initialQuestion);
      validateText(initialQuestion);
    }
  }, [isOpen, initialQuestion]);

  const validateText = (text: string) => {
    if (!text.trim()) {
      setImpossibility(null);
      setAmbiguity(null);
      return;
    }
    const params = parseNaturalLanguageText(text);
    const imp = validateProblemGeometry(params);
    setImpossibility(imp);
    if (!imp) {
      const amb = detectAmbiguities(params);
      setAmbiguity(amb);
    } else {
      setAmbiguity(null);
    }
  };

  const handleChange = (text: string) => {
    setQuestionText(text);
    validateText(text);
  };

  const handlePaste = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        handleChange(clipText);
      }
    } catch {
      // Focus textarea
      const el = document.getElementById('focused-problem-textarea');
      el?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim() || isLoading) return;
    onSolveQuestion(questionText);
    onClose();
  };

  const handleSelectPreset = (presetQuestion: string) => {
    handleChange(presetQuestion);
  };

  const handleApplyFix = (suggestedText: string) => {
    // E.g. If suggested fix or suggested value
    const params = parseNaturalLanguageText(questionText);
    if (impossibility?.type === 'FV_EXCEEDS_TL' && params.true_length_mm) {
      const newFV = Math.round(params.true_length_mm * 0.85);
      const replaced = questionText.replace(/front\s*view\s*(?:is|measures|=)?\s*\d+/i, `front view ${newFV} mm`);
      handleChange(replaced !== questionText ? replaced : `${questionText} (Front view is ${newFV} mm)`);
    } else if (impossibility?.type === 'TV_EXCEEDS_TL' && params.true_length_mm) {
      const newTV = Math.round(params.true_length_mm * 0.75);
      const replaced = questionText.replace(/top\s*view\s*(?:is|measures|=)?\s*\d+/i, `top view ${newTV} mm`);
      handleChange(replaced !== questionText ? replaced : `${questionText} (Top view is ${newTV} mm)`);
    } else if (ambiguity) {
      handleChange(`${questionText.trim()} ${ambiguity.missingVar === 'True Length (TL)' ? `The True Length of line AB is ${ambiguity.suggestedDefault} mm.` : `End A is ${ambiguity.suggestedDefault} mm above HP and 20 mm in front of VP.`}`);
    }
  };

  if (!isOpen) return null;

  const isLight = theme === 'draftboard';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
      <div className={`border rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800'
          : 'bg-slate-900 border-slate-700/80 text-slate-100'
      }`}>
        {/* Modal Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
              isLight
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
            }`}>
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight font-sans">
                Paste Engineering Graphics Problem
              </h2>
              <p className="text-[11px] text-slate-400">
                Natural language parser handles raw exam questions, student abbreviations & typos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="relative">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Question Text:
              </label>
              <button
                type="button"
                onClick={handlePaste}
                className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-colors ${
                  isLight
                    ? 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700'
                    : 'border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-cyan-300'
                }`}
                title="Paste from clipboard"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>Paste from Clipboard</span>
              </button>
            </div>

            <textarea
              id="focused-problem-textarea"
              rows={4}
              value={questionText}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Paste raw unformatted problem here (e.g. A line AB 60 mm long has end A 30 mm above HP and 20 mm in front of VP. FV is 50 mm and TV is 45 mm. Draw its projections...)"
              className={`w-full rounded-xl p-3.5 text-sm font-sans focus:outline-none focus:ring-2 transition-all resize-none ${
                isLight
                  ? 'bg-slate-50 border border-slate-300 text-slate-900 focus:ring-orange-500 focus:border-orange-500 placeholder-slate-400'
                  : 'bg-slate-950 border border-slate-700 text-slate-100 focus:ring-cyan-500 focus:border-cyan-500 placeholder-slate-500'
              }`}
            />
          </div>

          {/* Preset Chips */}
          <div>
            <div className="text-[11px] font-medium text-slate-400 mb-1.5">
              Or pick a standard exam problem:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_PROBLEMS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset.question)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all text-left truncate max-w-[240px] ${
                    questionText === preset.question
                      ? isLight
                        ? 'border-orange-500 bg-orange-50 text-orange-700 font-semibold'
                        : 'border-cyan-500 bg-cyan-500/10 text-cyan-300 font-semibold'
                      : isLight
                      ? 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-600'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                  }`}
                  title={preset.question}
                >
                  {preset.title}
                </button>
              ))}
            </div>
          </div>

          {/* Educational Geometric Impossibility Alert */}
          {impossibility && (
            <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-200 space-y-2 animate-fadeIn">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                    Geometric Impossibility Detected: {impossibility.title}
                  </div>
                  <div className="text-xs text-amber-200/90 font-medium mt-0.5">
                    {impossibility.message}
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-amber-200/80 bg-amber-950/40 p-2.5 rounded-lg border border-amber-500/20 leading-relaxed">
                <strong>Why is this impossible? </strong>
                {impossibility.educationalExplanation}
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-amber-300">
                  {impossibility.suggestedFix}
                </span>
                <button
                  type="button"
                  onClick={() => handleApplyFix(impossibility.suggestedFix)}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[11px] transition-colors"
                >
                  Fix Automatically
                </button>
              </div>
            </div>
          )}

          {/* Ambiguity Prompt */}
          {ambiguity && !impossibility && (
            <div className="p-3.5 rounded-xl border border-blue-500/40 bg-blue-500/10 text-blue-200 flex items-start justify-between gap-3 animate-fadeIn text-xs">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-blue-300">Missing Variable: </span>
                  <span className="text-blue-200/90">{ambiguity.promptText}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleApplyFix(ambiguity.promptText)}
                className="shrink-0 px-2.5 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/40 text-blue-300 rounded-lg text-[11px] font-semibold transition-colors"
              >
                Use {ambiguity.suggestedDefault} mm
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !questionText.trim() || Boolean(impossibility)}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all disabled:opacity-50 disabled:pointer-events-none ${
                isLight
                  ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/25'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-500/25'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Solve Problem</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
