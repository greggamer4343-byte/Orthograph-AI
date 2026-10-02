import React from 'react';
import { SolvedProblemBlueprint, UnitPreference } from '../types/engineering';
import { formatLength } from '../utils/engineeringGeometry';
import { Calculator, BookOpen, CheckCircle2, ChevronRight } from 'lucide-react';

interface FormulaReferencePanelProps {
  blueprint: SolvedProblemBlueprint;
  unit?: UnitPreference;
}

export const FormulaReferencePanel: React.FC<FormulaReferencePanelProps> = ({ blueprint, unit = 'mm' }) => {
  const { formulas_used, formula_breakdowns, calculated_answers, parsed_parameters } = blueprint;

  return (
    <div className="space-y-6">
      {/* Top Banner: Calculated Results Summary Grid */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              Solved Engineering Parameters
            </h3>
          </div>
          <span className="text-xs text-cyan-400 font-mono">
            Analytical Solution ({unit === 'inches' ? 'Inches' : 'Millimeters'})
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
            <div className="text-[11px] text-slate-400 font-medium">True Angle to HP (θ)</div>
            <div className="text-base font-bold font-mono text-cyan-300 mt-0.5">
              {calculated_answers.theta_inclination_hp}°
            </div>
            <div className="text-[10px] text-slate-400 mt-1">arccos(TV / TL)</div>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
            <div className="text-[11px] text-slate-400 font-medium">True Angle to VP (φ)</div>
            <div className="text-base font-bold font-mono text-cyan-300 mt-0.5">
              {calculated_answers.phi_inclination_vp}°
            </div>
            <div className="text-[10px] text-slate-400 mt-1">arccos(FV / TL)</div>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
            <div className="text-[11px] text-slate-400 font-medium">Front View (FV)</div>
            <div className="text-base font-bold font-mono text-white mt-0.5">
              {formatLength(calculated_answers.front_view_length_mm, unit)}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Elevation length</div>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
            <div className="text-[11px] text-slate-400 font-medium">Top View (TV)</div>
            <div className="text-base font-bold font-mono text-white mt-0.5">
              {formatLength(calculated_answers.top_view_length_mm, unit)}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Plan length</div>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
            <div className="text-[11px] text-slate-400 font-medium">Projector Dist (D)</div>
            <div className="text-base font-bold font-mono text-purple-300 mt-0.5">
              {formatLength(calculated_answers.distance_between_projectors_mm, unit)}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">√(FV² - Δh²)</div>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
            <div className="text-[11px] text-slate-400 font-medium">Apparent Angle (α)</div>
            <div className="text-base font-bold font-mono text-emerald-300 mt-0.5">
              {calculated_answers.alpha_apparent_elevation_deg}°
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Front View inclination</div>
          </div>
        </div>
      </div>

      {/* Step-by-Step Mathematical Substitutions */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">
            Formulas Used & Step-by-Step Substitutions
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {formula_breakdowns.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-cyan-400 font-sans">
                  {item.label}
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                  {item.result}
                </span>
              </div>

              <div className="bg-slate-900/90 px-3 py-2 rounded-lg font-mono text-xs text-slate-200 border border-slate-800/80">
                <div className="text-cyan-300">{item.formula}</div>
                <div className="text-slate-400 text-[11px] mt-1 font-sans flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-cyan-400 inline" />
                  <span>Substituted: </span>
                  <span className="font-mono text-slate-300">{item.substitution}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Fundamental Engineering Graphics Theorems Reference */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-3.5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>Core Theorems of Straight Line Projections</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <h4 className="font-semibold text-cyan-300 mb-1">1. True Length & True Inclination</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              When a straight line is parallel to a projection plane, its projection on that plane shows its True Length (TL) and its true inclination to the other plane.
            </p>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <h4 className="font-semibold text-cyan-300 mb-1">2. Rotation Method (Arc Construction)</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Rotating a line about one end until it is parallel to HP preserves its Front View elevation length while bringing its plan to True Length at angle φ.
            </p>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <h4 className="font-semibold text-cyan-300 mb-1">3. Locus Invariance</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              As a line rotates in space keeping its inclination to HP constant, its end point moves along a horizontal locus line at a constant height above HP.
            </p>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <h4 className="font-semibold text-cyan-300 mb-1">4. End Projector Invariant</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              The front view and top view of any point (e.g. b' and b) MUST always lie on the same straight line perpendicular to the reference XY line.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
