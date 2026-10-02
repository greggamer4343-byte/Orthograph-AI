import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  Check,
  ClipboardPaste,
  Calculator,
  Compass,
  CheckCircle2,
  X,
} from 'lucide-react';
import { PRESET_PROBLEMS, parseNaturalLanguageText, formatLength } from '../utils/engineeringGeometry';
import { ParsedParameters, CalculatedAnswers, UnitPreference } from '../types/engineering';

interface ProblemInputBarProps {
  currentQuestion: string;
  onQuestionChange: (q: string) => void;
  onSolveQuestion: (q: string) => void;
  isLoading: boolean;
  parsedParams: ParsedParameters;
  calculatedAnswers: CalculatedAnswers;
  unit: UnitPreference;
  onParamChange: (paramKey: keyof ParsedParameters, value: number) => void;
  aiPowered: boolean;
}

export const ProblemInputBar: React.FC<ProblemInputBarProps> = ({
  currentQuestion,
  onQuestionChange,
  onSolveQuestion,
  isLoading,
  parsedParams,
  calculatedAnswers,
  unit,
  onParamChange,
  aiPowered,
}) => {
  const [showPresets, setShowPresets] = useState(false);
  const [showParamAdjuster, setShowParamAdjuster] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Instant parsing as user types or pastes
  const handleInputChange = (text: string) => {
    onQuestionChange(text);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Auto-parse parameters after 350ms of idle typing or immediately on paste
    debounceTimerRef.current = setTimeout(() => {
      const extracted = parseNaturalLanguageText(text);
      if (Object.keys(extracted).length > 0) {
        // Automatically update variables
        if (extracted.true_length_mm !== undefined) {
          onParamChange('true_length_mm', extracted.true_length_mm);
        }
        if (extracted.point_a_above_hp_mm !== undefined) {
          onParamChange('point_a_above_hp_mm', extracted.point_a_above_hp_mm);
        }
        if (extracted.point_a_in_front_vp_mm !== undefined) {
          onParamChange('point_a_in_front_vp_mm', extracted.point_a_in_front_vp_mm);
        }
        if (extracted.front_view_length_mm !== undefined) {
          onParamChange('front_view_length_mm', extracted.front_view_length_mm);
        }
        if (extracted.top_view_length_mm !== undefined) {
          onParamChange('top_view_length_mm', extracted.top_view_length_mm);
        }
        if (extracted.theta_inclination_hp !== undefined) {
          onParamChange('theta_inclination_hp', extracted.theta_inclination_hp);
        }
        if (extracted.phi_inclination_vp !== undefined) {
          onParamChange('phi_inclination_vp', extracted.phi_inclination_vp);
        }
      }
    }, 350);
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        handleInputChange(text);
        onSolveQuestion(text);
      }
    } catch {
      // If clipboard access is blocked, focus textarea
      const el = document.getElementById('problem-input-field');
      el?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentQuestion.trim() && !isLoading) {
      onSolveQuestion(currentQuestion);
    }
  };

  const handleSelectPreset = (preset: typeof PRESET_PROBLEMS[0]) => {
    onQuestionChange(preset.question);
    onSolveQuestion(preset.question);
    setShowPresets(false);
  };

  return (
    <div className="bg-slate-900/80 border-b border-slate-800/80 px-4 sm:px-6 py-4">
      <div className="max-w-7xl mx-auto space-y-3.5">
        {/* Top Direct Answer Display Banner (Immediate Results Verification) */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-cyan-500/40 rounded-xl p-3 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/40">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Direct Answer Display
              </span>
              <span className="text-[11px] text-slate-400 block">
                Instant calculations for checking exam results
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            {/* True angle theta to HP */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-cyan-500/30">
              <span className="text-slate-400 font-medium">True Inclination to HP (θ):</span>
              <span className="font-mono font-bold text-cyan-300 text-sm">
                {calculatedAnswers.theta_inclination_hp}°
              </span>
            </div>

            {/* True angle phi to VP */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-cyan-500/30">
              <span className="text-slate-400 font-medium">True Inclination to VP (φ):</span>
              <span className="font-mono font-bold text-cyan-300 text-sm">
                {calculatedAnswers.phi_inclination_vp}°
              </span>
            </div>

            {/* Apparent Lengths FV and TV */}
            <div className="hidden sm:flex items-center gap-3 text-slate-300 font-mono text-[11px] bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
              <span>FV = <strong className="text-white">{formatLength(calculatedAnswers.front_view_length_mm, unit)}</strong> (α = {calculatedAnswers.alpha_apparent_elevation_deg}°)</span>
              <span aria-hidden="true" className="text-slate-700">·</span>
              <span>TV = <strong className="text-white">{formatLength(calculatedAnswers.top_view_length_mm, unit)}</strong> (β = {calculatedAnswers.beta_apparent_plan_deg}°)</span>
            </div>

            {/* End Projector Distance */}
            <div className="hidden md:flex items-center gap-1.5 text-purple-300 font-mono text-[11px] bg-purple-950/40 px-2.5 py-1.5 rounded-lg border border-purple-800/40">
              <span>Projector Dist D = <strong>{formatLength(calculatedAnswers.distance_between_projectors_mm, unit)}</strong></span>
            </div>
          </div>
        </div>

        {/* Natural Language Prompt Form with Paste Button */}
        <form onSubmit={handleSubmit} className="relative flex flex-col md:flex-row items-stretch gap-2">
          <div className="relative flex-1">
            <input
              id="problem-input-field"
              type="text"
              value={currentQuestion}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Paste raw engineering graphics question here (e.g. A line AB 60 mm long has end A 30 mm above HP...)"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-sans pr-32"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {currentQuestion.length > 0 && (
                <button
                  type="button"
                  onClick={() => onQuestionChange('')}
                  className="text-xs text-slate-400 hover:text-rose-400 p-1 rounded-md hover:bg-slate-800 transition-colors"
                  title="Clear input text"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={handlePasteClipboard}
                className="text-xs text-slate-400 hover:text-cyan-300 px-2 py-1 rounded-md bg-slate-800/60 hover:bg-slate-800 border border-slate-700/40 flex items-center gap-1 transition-colors"
                title="Paste unformatted question from clipboard"
              >
                <ClipboardPaste className="w-3 h-3" />
                <span className="hidden sm:inline">Paste</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPresets(!showPresets)}
                className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded-md bg-slate-800/60 hover:bg-slate-800 border border-slate-700/40 flex items-center gap-1 transition-colors"
              >
                <span>Presets</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowParamAdjuster(!showParamAdjuster)}
              className={`px-3 py-2.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                showParamAdjuster
                  ? 'bg-slate-800 border-cyan-500 text-cyan-400'
                  : 'bg-slate-950 border-slate-700/80 text-slate-300 hover:bg-slate-800/60'
              }`}
              title="Fine-tune extracted parameters"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Fine-Tune</span>
            </button>

            <button
              type="submit"
              disabled={isLoading || !currentQuestion.trim()}
              className="flex-1 md:flex-initial px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all disabled:pointer-events-none"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Parsing Problem...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Solve with AI</span>
                </>
              )}
            </button>
          </div>

          {/* Presets Dropdown */}
          {showPresets && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-2 space-y-1.5 backdrop-blur-xl">
              <div className="px-3 py-1.5 text-xs font-semibold text-slate-400">
                Standard Engineering Graphics Problems:
              </div>
              {PRESET_PROBLEMS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800/80 transition-colors flex flex-col gap-0.5 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors">
                      {preset.title}
                    </span>
                    <span className="text-[11px] text-slate-500">{preset.badge}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 line-clamp-1">
                    {preset.question}
                  </span>
                </button>
              ))}
            </div>
          )}
        </form>

        {/* Clean Unboxed Parameter Row */}
        <div className="flex flex-wrap items-center justify-between gap-y-2 text-xs text-slate-400 pt-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="text-slate-300 font-medium">Extracted Parameters:</span>
            <span className="font-mono text-cyan-300">TL = {formatLength(parsedParams.true_length_mm, unit)}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="font-mono text-slate-300">h_A = {formatLength(parsedParams.point_a_above_hp_mm, unit)} above HP</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="font-mono text-slate-300">d_A = {formatLength(parsedParams.point_a_in_front_vp_mm, unit)} in front VP</span>
            {parsedParams.front_view_length_mm !== undefined && (
              <>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="font-mono text-emerald-300">FV = {formatLength(parsedParams.front_view_length_mm, unit)}</span>
              </>
            )}
            {parsedParams.top_view_length_mm !== undefined && (
              <>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="font-mono text-amber-300">TV = {formatLength(parsedParams.top_view_length_mm, unit)}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            {aiPowered ? (
              <span className="text-cyan-400 flex items-center gap-1 font-mono">
                <Check className="w-3 h-3 text-cyan-400" />
                Parsed with Gemini 3.8 Flash
              </span>
            ) : (
              <span className="text-slate-400 font-mono">
                Analytical Geometric Engine
              </span>
            )}
          </div>
        </div>

        {/* Expandable Manual Fine-Tuner */}
        {showParamAdjuster && (
          <div className="mt-3 p-4 bg-slate-950/70 border border-slate-800 rounded-xl grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 animate-in fade-in duration-200">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                True Length (TL) mm
              </label>
              <input
                type="number"
                min="30"
                max="150"
                value={parsedParams.true_length_mm}
                onChange={(e) => onParamChange('true_length_mm', parseFloat(e.target.value) || 60)}
                className="w-full bg-slate-900 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                A above HP (h_A) mm
              </label>
              <input
                type="number"
                min="5"
                max="80"
                value={parsedParams.point_a_above_hp_mm}
                onChange={(e) => onParamChange('point_a_above_hp_mm', parseFloat(e.target.value) || 20)}
                className="w-full bg-slate-900 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                A in front VP (d_A) mm
              </label>
              <input
                type="number"
                min="5"
                max="80"
                value={parsedParams.point_a_in_front_vp_mm}
                onChange={(e) => onParamChange('point_a_in_front_vp_mm', parseFloat(e.target.value) || 20)}
                className="w-full bg-slate-900 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Front View (FV) mm
              </label>
              <input
                type="number"
                min="20"
                max="140"
                value={parsedParams.front_view_length_mm || ''}
                placeholder="Auto-calc"
                onChange={(e) => onParamChange('front_view_length_mm', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Top View (TV) mm
              </label>
              <input
                type="number"
                min="20"
                max="140"
                value={parsedParams.top_view_length_mm || ''}
                placeholder="Auto-calc"
                onChange={(e) => onParamChange('top_view_length_mm', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
