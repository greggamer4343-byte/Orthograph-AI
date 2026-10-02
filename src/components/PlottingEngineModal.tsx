import React, { useState } from 'react';
import { X, Copy, Check, Code, Compass, Layers, Play } from 'lucide-react';
import { SolvedProblemBlueprint, ParsedParameters } from '../types/engineering';
import { PRESET_PROBLEMS } from '../utils/engineeringGeometry';

interface PlottingEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
  blueprint: SolvedProblemBlueprint;
  onSelectPreset: (params: Partial<ParsedParameters>) => void;
}

export const PlottingEngineModal: React.FC<PlottingEngineModalProps> = ({
  isOpen,
  onClose,
  blueprint,
  onSelectPreset,
}) => {
  const [activeTab, setActiveTab] = useState<'json' | 'rules'>('json');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const jsonContent = JSON.stringify(
    {
      plotting_engine_config: blueprint.plotting_engine_config,
    },
    null,
    2
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const quadrantRules = [
    {
      quadrant: 'First (I)',
      condition: 'Above HP, In front of VP',
      fvPos: 'Above X-Y line',
      tvPos: 'Below X-Y line',
      logic: "a'_y = +H_dist, a_y = -V_dist",
      note: 'Standard 1st Angle ISO/BIS projection. Plan is below elevation.',
      color: 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300',
    },
    {
      quadrant: 'Second (II)',
      condition: 'Above HP, Behind VP',
      fvPos: 'Above X-Y line',
      tvPos: 'Above X-Y line',
      logic: "a'_y = +H_dist, a_y = +V_dist",
      note: 'OVERLAP CONDITION: Front View and Top View both lie above the X-Y line. Distinct colors/weights used.',
      color: 'border-amber-500/40 bg-amber-950/20 text-amber-300',
    },
    {
      quadrant: 'Third (III)',
      condition: 'Below HP, Behind VP',
      fvPos: 'Below X-Y line',
      tvPos: 'Above X-Y line',
      logic: "a'_y = -H_dist, a_y = +V_dist",
      note: 'Standard 3rd Angle ASME projection. Plan is above elevation.',
      color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300',
    },
    {
      quadrant: 'Fourth (IV)',
      condition: 'Below HP, In front of VP',
      fvPos: 'Below X-Y line',
      tvPos: 'Below X-Y line',
      logic: "a'_y = -H_dist, a_y = -V_dist",
      note: 'OVERLAP CONDITION: Front View and Top View both lie below the X-Y line. Distinct colors/weights used.',
      color: 'border-rose-500/40 bg-rose-950/20 text-rose-300',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-3xl h-[88vh] max-h-[760px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-sans flex items-center gap-2">
                <span>Plotting Engine &amp; 4-Quadrant Architecture</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/50">
                  Cartesian Y = 0
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Mathematical coordinate mapping engine &amp; programmatic JSON schema
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('json')}
            className={`pb-2.5 px-3 font-semibold text-xs transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'json'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Programmatic JSON Output</span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`pb-2.5 px-3 font-semibold text-xs transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'rules'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>4-Quadrant Rendering Rules &amp; Overlap Logic</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 text-xs space-y-4">
          {activeTab === 'json' ? (
            <div className="space-y-3">
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-300 leading-relaxed flex items-start gap-2.5">
                <span className="font-mono text-cyan-400 font-bold shrink-0">Specs:</span>
                <span>
                  The backend translates physical 3D space (H_dist, V_dist) into a 2D Cartesian coordinate system where the X-Y line is at <strong>$Y = 0$</strong>, &quot;Above X-Y&quot; is positive ($+Y$), and &quot;Below X-Y&quot; is negative ($-Y$).
                </span>
              </div>

              {/* JSON Code Viewer */}
              <div className="relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden font-mono text-[11px]">
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[10px]">
                  <span>plotting_engine_config.json</span>
                  <span className="text-cyan-400">Current Problem: {blueprint.parsed_parameters.quadrant || 'First (I)'}</span>
                </div>
                <pre className="p-4 overflow-x-auto text-cyan-300 leading-relaxed max-h-[420px]">
                  {jsonContent}
                </pre>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-[11px] text-slate-300 leading-relaxed">
                When the physical planes are rotated flat onto the 2D drawing sheet (clockwise 90° rotation of the Horizontal Plane about the X-Y line), the positions of the Front View and Top View relative to the X-Y line are strictly determined by the quadrant:
              </div>

              {/* Quadrant Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {quadrantRules.map((rule, idx) => (
                  <div key={idx} className={`p-4 rounded-xl border ${rule.color} space-y-2`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs uppercase font-mono">{rule.quadrant}</span>
                      <span className="text-[10px] font-mono opacity-80">{rule.condition}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-current/20">
                      <div>
                        <span className="block opacity-70 text-[10px]">Front View (a&apos;):</span>
                        <strong className="font-mono">{rule.fvPos}</strong>
                      </div>
                      <div>
                        <span className="block opacity-70 text-[10px]">Top View (a):</span>
                        <strong className="font-mono">{rule.tvPos}</strong>
                      </div>
                    </div>

                    <div className="bg-black/30 p-2 rounded-lg font-mono text-[11px] border border-current/20">
                      <code>{rule.logic}</code>
                    </div>

                    <p className="text-[10px] opacity-90 leading-normal">{rule.note}</p>
                  </div>
                ))}
              </div>

              {/* Developer Projector Note */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-cyan-500/30 text-[11px] text-slate-300 space-y-1.5">
                <span className="font-bold text-cyan-400 block font-mono">
                  Projectors Invariant &amp; Overlap Differentiation:
                </span>
                <p className="leading-relaxed text-slate-400">
                  1. <strong>Projectors First:</strong> Vertical projector lines connecting <code>a&apos;</code> to <code>a</code> and <code>b&apos;</code> to <code>b</code> are drawn with thin, dashed lines.
                  <br />
                  2. <strong>Visual De-cluttering:</strong> In the 2nd and 4th quadrants where views overlap on the same side of the X-Y line, Front View is styled in Sky Blue with thicker strokes and Top View is styled in Amber to prevent ambiguity.
                </p>
              </div>
            </div>
          )}

          {/* Quick Quadrant Test Presets */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Load &amp; Test Specific Quadrant Configurations:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESET_PROBLEMS.slice(0, 4).map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    onSelectPreset(preset.params);
                    onClose();
                  }}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/50 text-left transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 group-hover:bg-cyan-500/20 text-cyan-400 border border-slate-700">
                      {preset.badge}
                    </span>
                    <Play className="w-2.5 h-2.5 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-[11px] font-semibold text-slate-200 group-hover:text-cyan-300 truncate">
                    {preset.title}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
