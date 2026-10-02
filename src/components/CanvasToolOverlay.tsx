import React, { useState } from 'react';
import {
  PenTool,
  RotateCw,
  Ruler,
  Tag,
  X,
  RotateCcw,
  Compass,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { DrawingTool, Point2D, UnitPreference } from '../types/engineering';

interface CanvasToolOverlayProps {
  activeTool: DrawingTool;
  setActiveTool: (tool: DrawingTool) => void;
  showAnnotations: boolean;
  setShowAnnotations: (show: boolean) => void;
  unit?: UnitPreference;
  onToolActionNotice?: (msg: string) => void;
  onInteractiveStepAction?: (actionType: 'draw_line' | 'draw_arc') => void;
}

export const CanvasToolOverlay: React.FC<CanvasToolOverlayProps> = ({
  activeTool,
  setActiveTool,
  showAnnotations,
  setShowAnnotations,
  unit = 'mm',
  onToolActionNotice,
  onInteractiveStepAction,
}) => {
  // Measurement Mode: 'ruler' or 'protractor'
  const [measureMode, setMeasureMode] = useState<'ruler' | 'protractor'>('ruler');
  const [showMeasureTool, setShowMeasureTool] = useState(false);

  // Ruler state
  const [rulerPos, setRulerPos] = useState<Point2D>({ x: 260, y: 160 });
  const [rulerAngle, setRulerAngle] = useState(0); // in degrees
  const [rulerLengthMm, setRulerLengthMm] = useState(70);

  // Protractor state
  const [protractorPos, setProtractorPos] = useState<Point2D>({ x: 220, y: 240 });
  const [measuredAngle, setMeasuredAngle] = useState(35);

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Point2D>({ x: 0, y: 0 });

  const handleToolSelect = (tool: DrawingTool) => {
    setActiveTool(tool);
    if (tool === 'Measure Distance / Angle') {
      setShowMeasureTool(true);
      onToolActionNotice?.('Digital Drafting Instruments activated. Switch between Ruler and 360° Protractor to inspect values.');
    } else if (tool === 'Annotate') {
      setShowAnnotations(!showAnnotations);
      onToolActionNotice?.(`Engineering annotations ${!showAnnotations ? 'visible (a, a\', b, b\', b₁, b₂)' : 'hidden'}.`);
    } else if (tool === 'Draw Line') {
      onToolActionNotice?.('Draw Line: Connects endpoints based on AI-generated coordinates.');
    } else if (tool === 'Draw Arc') {
      onToolActionNotice?.('Draw Arc: Swings rotation arc to establish locus intersection.');
    }
  };

  const handleMouseDown = (e: React.MouseEvent, currentPos: Point2D) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - currentPos.x,
      y: e.clientY - currentPos.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const nextX = Math.max(20, Math.min(800, e.clientX - dragOffset.x));
      const nextY = Math.max(20, Math.min(520, e.clientY - dragOffset.y));

      if (measureMode === 'ruler') {
        setRulerPos({ x: nextX, y: nextY });
      } else {
        setProtractorPos({ x: nextX, y: nextY });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <>
      {/* Floating Toolbar on Canvas */}
      <div className="absolute top-12 left-4 z-20 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/80 shadow-2xl">
        <button
          onClick={() => handleToolSelect('Draw Line')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTool === 'Draw Line'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Connects two points based on AI-generated coordinates"
        >
          <PenTool className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Draw Line</span>
        </button>

        <button
          onClick={() => handleToolSelect('Draw Arc')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTool === 'Draw Arc'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Swings rotation arc to find loci (e.g. rotating Front View to find True Length)"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Draw Arc</span>
        </button>

        <button
          onClick={() => handleToolSelect('Measure Distance / Angle')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTool === 'Measure Distance / Angle'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Virtual digital ruler and 360° protractor to verify lengths and true inclinations"
        >
          <Ruler className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Measuring Tool</span>
        </button>

        <button
          onClick={() => handleToolSelect('Annotate')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            showAnnotations
              ? 'bg-slate-800 text-cyan-400 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Auto-labels all points (a, a', b, b', b1, b2), loci, and dimensions"
        >
          <Tag className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Auto-Annotate</span>
        </button>
      </div>

      {/* Interactive Quick Trigger for Active Tool */}
      <div className="absolute top-12 right-4 z-20 hidden md:flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-lg text-xs">
        {activeTool === 'Draw Line' && (
          <button
            onClick={() => {
              onInteractiveStepAction?.('draw_line');
              onToolActionNotice?.('Plotted line segment connecting end coordinates.');
            }}
            className="flex items-center gap-1.5 text-cyan-300 hover:text-cyan-200 font-medium"
          >
            <PenTool className="w-3 h-3 text-cyan-400" />
            <span>Plot Active Segment</span>
          </button>
        )}

        {activeTool === 'Draw Arc' && (
          <button
            onClick={() => {
              onInteractiveStepAction?.('draw_arc');
              onToolActionNotice?.('Swinging compass arc to establish locus point.');
            }}
            className="flex items-center gap-1.5 text-amber-300 hover:text-amber-200 font-medium"
          >
            <RotateCw className="w-3 h-3 text-amber-400" />
            <span>Swing Rotation Arc</span>
          </button>
        )}

        {activeTool === 'Measure Distance / Angle' && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setShowMeasureTool(true);
                setMeasureMode('ruler');
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                measureMode === 'ruler' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Ruler
            </button>
            <button
              onClick={() => {
                setShowMeasureTool(true);
                setMeasureMode('protractor');
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                measureMode === 'protractor' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Protractor
            </button>
          </div>
        )}
      </div>

      {/* Draggable Digital Ruler Widget */}
      {showMeasureTool && measureMode === 'ruler' && (
        <div
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            transform: `translate(${rulerPos.x}px, ${rulerPos.y}px)`,
          }}
          className="absolute top-0 left-0 z-30 select-none cursor-move"
        >
          <div
            style={{ transform: `rotate(${rulerAngle}deg)` }}
            className="relative bg-slate-900/95 backdrop-blur-xl border border-cyan-400/90 rounded-xl shadow-2xl p-3 w-84 text-white transition-transform duration-75 ring-1 ring-cyan-500/20"
          >
            {/* Header handle */}
            <div
              onMouseDown={(e) => handleMouseDown(e, rulerPos)}
              className="flex items-center justify-between pb-2 border-b border-slate-700/60 cursor-grab active:cursor-grabbing"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 font-mono">
                <Ruler className="w-3.5 h-3.5" />
                <span>Digital Drafting Scale ({unit === 'inches' ? 'inches' : 'mm'})</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMeasureMode('protractor')}
                  className="text-[10px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                >
                  Switch to Protractor
                </button>
                <button
                  onClick={() => setShowMeasureTool(false)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Scale Ticks */}
            <div className="my-2.5 h-8 bg-slate-950 rounded border border-slate-800 flex items-end px-1 relative overflow-hidden">
              <div className="w-full flex justify-between items-end h-full py-1 text-[9px] font-mono text-cyan-300">
                {Array.from({ length: 11 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div
                      className={`w-0.5 bg-cyan-400 ${
                        i % 2 === 0 ? 'h-4' : 'h-2.5 bg-cyan-500/60'
                      }`}
                    />
                    <span className="text-[8px] mt-0.5">
                      {unit === 'inches' ? (i * 0.4).toFixed(1) : i * 10}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Readout and Orientation */}
            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-300">
              <div className="flex items-center gap-2">
                <span>Angle:</span>
                <span className="font-mono font-bold text-cyan-300">{rulerAngle}°</span>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={rulerAngle}
                  onChange={(e) => setRulerAngle(parseInt(e.target.value))}
                  className="w-24 accent-cyan-400 h-1 bg-slate-700 rounded-lg cursor-pointer"
                />

                <button
                  onClick={() => setRulerAngle(0)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                  title="Reset to horizontal (0°)"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Draggable Digital 360° Circular Protractor Widget */}
      {showMeasureTool && measureMode === 'protractor' && (
        <div
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            transform: `translate(${protractorPos.x}px, ${protractorPos.y}px)`,
          }}
          className="absolute top-0 left-0 z-30 select-none cursor-move"
        >
          <div className="relative bg-slate-900/90 backdrop-blur-xl border border-cyan-400 rounded-full shadow-2xl w-64 h-64 flex items-center justify-center text-white ring-1 ring-cyan-500/30">
            {/* Header / Grab Handle */}
            <div
              onMouseDown={(e) => handleMouseDown(e, protractorPos)}
              className="absolute top-2 w-full flex justify-between items-center px-4 cursor-grab active:cursor-grabbing text-[10px] text-cyan-300 font-mono"
            >
              <span>360° Protractor</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMeasureMode('ruler')}
                  className="px-1.5 py-0.5 bg-slate-800/80 rounded hover:bg-slate-700 text-[9px]"
                >
                  Ruler
                </button>
                <button
                  onClick={() => setShowMeasureTool(false)}
                  className="p-0.5 hover:bg-slate-800 rounded"
                >
                  <X className="w-3 h-3 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Protractor Radial Degree Ticks (Every 15 deg) */}
            <svg viewBox="0 0 200 200" className="w-full h-full pointer-events-none p-2">
              <circle cx="100" cy="100" r="90" fill="none" stroke="#334155" strokeWidth="1" />
              <circle cx="100" cy="100" r="70" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="2 2" />

              {/* Crosshairs */}
              <line x1="10" y1="100" x2="190" y2="100" stroke="#06b6d4" strokeWidth="0.8" strokeDasharray="3 2" />
              <line x1="100" y1="10" x2="100" y2="190" stroke="#06b6d4" strokeWidth="0.8" strokeDasharray="3 2" />

              {/* Degree markers */}
              {Array.from({ length: 24 }).map((_, i) => {
                const angle = i * 15;
                const rad = (angle * Math.PI) / 180;
                const x1 = 100 + 82 * Math.cos(rad);
                const y1 = 100 + 82 * Math.sin(rad);
                const x2 = 100 + 90 * Math.cos(rad);
                const y2 = 100 + 90 * Math.sin(rad);
                return (
                  <line
                    key={angle}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={angle % 45 === 0 ? '#38bdf8' : '#64748b'}
                    strokeWidth={angle % 45 === 0 ? '1.5' : '1'}
                  />
                );
              })}

              {/* Angle Indicator Needle */}
              <line
                x1="100"
                y1="100"
                x2={100 + 85 * Math.cos((measuredAngle * Math.PI) / 180)}
                y2={100 - 85 * Math.sin((measuredAngle * Math.PI) / 180)}
                stroke="#38bdf8"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="100" cy="100" r="4" fill="#38bdf8" />
            </svg>

            {/* Center Angle Readout & Slider */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-[10px] text-slate-400 uppercase font-mono">Angle</span>
              <span className="text-xl font-bold font-mono text-cyan-300 leading-none my-0.5">
                {measuredAngle}°
              </span>
              <input
                type="range"
                min="0"
                max="180"
                value={measuredAngle}
                onChange={(e) => setMeasuredAngle(parseInt(e.target.value))}
                className="w-20 accent-cyan-400 h-1 bg-slate-800 rounded-lg cursor-pointer mt-1"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
