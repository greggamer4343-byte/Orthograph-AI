import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  SolvedProblemBlueprint,
  DrawingTool,
  UnitPreference,
  SheetSize,
  TitleBlockInfo,
  ThemeMode,
  ExportStyle,
} from '../types/engineering';
import { formatLength } from '../utils/engineeringGeometry';
import {
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Compass,
  PenTool,
  Info,
  X,
  Sparkles,
} from 'lucide-react';

interface OrthographicCanvas2DProps {
  blueprint: SolvedProblemBlueprint;
  currentStepIndex: number; // 0-based
  activeTool: DrawingTool;
  showAnnotations: boolean;
  unit?: UnitPreference;
  sheetSize?: SheetSize;
  titleBlock?: TitleBlockInfo;
  theme?: ThemeMode;
  exportStyle?: ExportStyle;
  onPointClick?: (pointName: string, x: number, y: number) => void;
  onPhysicalAnimationStateChange?: (isDrawing: boolean) => void;
}

interface ContextualInspection {
  name: string;
  type: 'line' | 'arc' | 'point' | 'locus';
  lengthMm?: number;
  angleDeg?: number;
  pencilGrade: '2H (Thin / Construction)' | 'HB (Medium / Final Object)' | '4H (Very Light / Guide)';
  formula?: string;
  x: number;
  y: number;
}

export const OrthographicCanvas2D: React.FC<OrthographicCanvas2DProps> = ({
  blueprint,
  currentStepIndex,
  activeTool,
  showAnnotations,
  unit = 'mm',
  sheetSize = 'A3',
  titleBlock = {
    title: 'PROJECTIONS OF STRAIGHT LINES (LINE AB)',
    scale: '1:1',
    projectionMethod: '1st Angle',
    date: new Date().toISOString().split('T')[0],
    sheetNo: '01',
  },
  theme = 'blueprint',
  exportStyle = 'clean_vector',
  onPointClick,
  onPhysicalAnimationStateChange,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Zoom & Pan state with boundaries
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Contextual inspection state (on element click)
  const [inspection, setInspection] = useState<ContextualInspection | null>(null);

  // Physical Tool Animation progress (0 to 1)
  const [animProgress, setAnimProgress] = useState<number>(1);
  const [isAnimatingTool, setIsAnimatingTool] = useState<boolean>(false);

  const { geometry2D, calculated_answers, parsed_parameters, step_by_step_solution } = blueprint;
  const currentStep = step_by_step_solution[currentStepIndex] || step_by_step_solution[0];
  const activeElementIds = new Set(currentStep.element_ids || []);

  const {
    canvasWidth,
    canvasHeight,
    originY,
    xyStart,
    xyEnd,
    a_prime,
    b_prime,
    b1_prime,
    b2_prime,
    a,
    b,
    b1,
    b2,
    locus_a_prime_y,
    locus_b_prime_y,
    locus_a_y,
    locus_b_y,
    fv_arc,
    tv_arc,
  } = geometry2D;

  const isLight = theme === 'draftboard';
  const isHandDrawn = exportStyle === 'hand_drawn';

  // Physical Tool Animation trigger when step changes
  useEffect(() => {
    setIsAnimatingTool(true);
    setAnimProgress(0);
    onPhysicalAnimationStateChange?.(true);

    const startTime = performance.now();
    const duration = 1200; // 1.2s realistic swing / ruler slide

    let frameId: number;
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimProgress(eased);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      } else {
        setIsAnimatingTool(false);
        onPhysicalAnimationStateChange?.(false);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frameId);
      onPhysicalAnimationStateChange?.(false);
    };
  }, [currentStepIndex]);

  // Zoom helpers with limits
  const handleZoomIn = () => setZoom((z) => Math.min(2.8, Number((z + 0.2).toFixed(1))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.5, Number((z - 0.2).toFixed(1))));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.min(2.8, Math.max(0.5, Number((prev + delta).toFixed(2)))));
  };

  // Pan via dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag on left click and not clicking directly on interactive inspectors
    if (e.button === 0 && !(e.target as HTMLElement).closest('.interactive-clickable')) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    const newX = e.clientX - startPan.x;
    const newY = e.clientY - startPan.y;
    // Bounded limits so drawing never gets lost off-screen
    const limit = 400 * zoom;
    setPan({
      x: Math.max(-limit, Math.min(limit, newX)),
      y: Math.max(-limit, Math.min(limit, newY)),
    });
  };

  const handleMouseUp = () => setIsPanning(false);

  // Dedicated function to request full-screen mode on the canvas container element to hide all sidebars and UI
  const requestFullscreenMode = useCallback(() => {
    const el = containerRef.current;
    if (el) {
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {
          // Fallback if browser/iframe blocks native fullscreen API
          setIsFullscreen(true);
        });
      } else if ((el as any).webkitRequestFullscreen) {
        (el as any).webkitRequestFullscreen();
      } else if ((el as any).msRequestFullscreen) {
        (el as any).msRequestFullscreen();
      }
    }
    setIsFullscreen(true);
  }, []);

  // Dedicated handler to exit full-screen mode
  const exitFullscreenMode = useCallback(() => {
    if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
    setIsFullscreen(false);
  }, []);

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      exitFullscreenMode();
    } else {
      requestFullscreenMode();
    }
  }, [isFullscreen, exitFullscreenMode, requestFullscreenMode]);

  // Listen to native fullscreen changes and ESC key press
  useEffect(() => {
    const handleFsChange = () => {
      const isNativeFs = Boolean(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setIsFullscreen(isNativeFs);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        exitFullscreenMode();
      }
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, exitFullscreenMode]);

  // Arc path helpers
  const fvArcPath = `M ${b2_prime.x} ${b2_prime.y} A ${fv_arc.radius} ${fv_arc.radius} 0 0 0 ${b_prime.x} ${b_prime.y}`;
  const tvArcPath = `M ${b1.x} ${b1.y} A ${tv_arc.radius} ${tv_arc.radius} 0 0 1 ${b.x} ${b.y}`;

  // Helper for angle arcs
  const describeAngleArc = (cx: number, cy: number, r: number, angleDeg: number, isAbove: boolean) => {
    const rad = (angleDeg * Math.PI) / 180;
    const endX = cx + r * Math.cos(rad);
    const endY = isAbove ? cy - r * Math.sin(rad) : cy + r * Math.sin(rad);
    const startX = cx + r;
    const startY = cy;
    const sweep = isAbove ? 0 : 1;
    return `M ${startX} ${startY} A ${r} ${r} 0 0 ${sweep} ${endX} ${endY}`;
  };

  // Helper to determine if an element is part of the newly drawn geometry of the active step
  const isCurrentActiveStepElem = (elemId: string) => {
    const prevElemIds = currentStepIndex > 0 ? step_by_step_solution[currentStepIndex - 1]?.element_ids || [] : [];
    return activeElementIds.has(elemId) && !prevElemIds.includes(elemId);
  };

  // Color & Opacity helpers based on step highlighting & themes
  const getLineStyle = (elemId: string, baseColor: string, isConstruction = false) => {
    const isNew = isCurrentActiveStepElem(elemId);
    const isActive = activeElementIds.has(elemId);

    if (!isActive) return { opacity: 0, stroke: baseColor, strokeWidth: isConstruction ? 1 : 2 };

    if (isNew) {
      // Pulsed & highlighted active geometry
      const highlightColor = isLight ? '#F97316' : '#06B6D4'; // Vibrant Orange or Neon Cyan
      return {
        opacity: 1,
        stroke: highlightColor,
        strokeWidth: isConstruction ? 2.2 : 3.5,
        filter: isLight ? 'drop-shadow(0 0 4px rgba(249,115,22,0.4))' : 'drop-shadow(0 0 6px rgba(6,182,212,0.6))',
      };
    }

    // Previously drawn geometry: slightly softened / dimmed (60% opacity)
    return {
      opacity: 0.65,
      stroke: baseColor,
      strokeWidth: isConstruction ? 1.2 : 2.2,
      filter: 'none',
    };
  };

  // Active Physical Tool Coordinates calculation
  // Compass: if step draws arc
  const showCompass = isAnimatingTool && (currentStep.element_ids?.includes('fv_arc') || currentStep.element_ids?.includes('tv_arc'));
  const compassCenter = currentStep.element_ids?.includes('fv_arc') ? fv_arc.center : tv_arc.center;
  const compassRadius = currentStep.element_ids?.includes('fv_arc') ? fv_arc.radius : tv_arc.radius;
  const compassAngle = (currentStep.element_ids?.includes('fv_arc') ? -calculated_answers.alpha_apparent_elevation_deg : calculated_answers.beta_apparent_plan_deg) * animProgress;

  // Ruler & Pencil: if step draws line
  const showRuler = isAnimatingTool && currentStep.tool_to_activate === 'Draw Line' && currentStepIndex > 0;
  // Pick active line coordinates
  let rulerStart = a_prime;
  let rulerEnd = b_prime;
  if (currentStep.element_ids?.includes('tl_fv')) {
    rulerStart = a_prime;
    rulerEnd = b1_prime;
  } else if (currentStep.element_ids?.includes('tl_tv')) {
    rulerStart = a;
    rulerEnd = b2;
  } else if (currentStep.element_ids?.includes('fv_line')) {
    rulerStart = a_prime;
    rulerEnd = b_prime;
  } else if (currentStep.element_ids?.includes('tv_line')) {
    rulerStart = a;
    rulerEnd = b;
  }
  const pencilCurrX = rulerStart.x + (rulerEnd.x - rulerStart.x) * animProgress;
  const pencilCurrY = rulerStart.y + (rulerEnd.y - rulerStart.y) * animProgress;

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={`relative w-full h-full overflow-hidden select-none flex flex-col items-center justify-center transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-50 w-screen h-screen'
          : 'rounded-2xl border'
      } ${
        isLight
          ? isFullscreen ? 'bg-[#f8fafc] text-slate-800' : 'bg-slate-100/90 border-slate-300 text-slate-800'
          : 'bg-[#090e17] border-slate-800 text-slate-200'
      }`}
      style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
    >
      {/* Hand-Drawn Pencil Filter Definition */}
      <svg className="hidden">
        <defs>
          <filter id="hand-drawn-graphite" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* Main Drawing Sheet Viewport */}
      <div
        className="w-full h-full flex items-center justify-center transition-transform duration-75"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
        }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
          className={`w-full max-w-[1020px] max-h-[660px] shadow-2xl transition-all ${
            isLight
              ? 'bg-[#f8fafc] text-slate-800'
              : 'bg-[#090e17] text-slate-200'
          }`}
          style={{
            filter: isHandDrawn ? 'url(#hand-drawn-graphite)' : 'none',
          }}
        >
          {/* Background Technical Grid */}
          <defs>
            <pattern id="grid-major" width="50" height="50" patternUnits="userSpaceOnUse">
              <path
                d="M 50 0 L 0 0 0 50"
                fill="none"
                stroke={isLight ? '#e2e8f0' : '#1e293b'}
                strokeWidth="1"
              />
            </pattern>
            <pattern id="grid-minor" width="10" height="10" patternUnits="userSpaceOnUse">
              <path
                d="M 10 0 L 0 0 0 10"
                fill="none"
                stroke={isLight ? '#f1f5f9' : '#111827'}
                strokeWidth="0.5"
              />
            </pattern>

            {/* Standard 3:1 Engineering Arrowheads */}
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 2 L 10 5 L 0 8 z" fill={isLight ? '#475569' : '#38bdf8'} />
            </marker>
          </defs>

          {/* Grid Background */}
          <rect width={canvasWidth} height={canvasHeight} fill="url(#grid-minor)" />
          <rect width={canvasWidth} height={canvasHeight} fill="url(#grid-major)" />

          {/* Traditional Engineering Sheet Outer Border & Margins */}
          {/* Left margin 20mm (binding edge), top/right/bottom 10mm */}
          <rect
            x="20"
            y="15"
            width={canvasWidth - 35}
            height={canvasHeight - 30}
            fill="none"
            stroke={isLight ? '#334155' : '#475569'}
            strokeWidth="2.5"
          />
          <rect
            x="35"
            y="25"
            width={canvasWidth - 55}
            height={canvasHeight - 50}
            fill="none"
            stroke={isLight ? '#cbd5e1' : '#334155'}
            strokeWidth="1"
          />

          {/* Engineering Title Block in Bottom Right Corner (Optionally includes personal details or pure technical parameters) */}
          {(() => {
            const showPersonal = Boolean(
              titleBlock.includePersonalInfo &&
              (titleBlock.studentName?.trim() || titleBlock.rollNumber?.trim() || titleBlock.institution?.trim())
            );

            if (showPersonal) {
              return (
                <g transform={`translate(${canvasWidth - 365}, ${canvasHeight - 130})`}>
                  {/* Title block frame */}
                  <rect
                    width="340"
                    height="100"
                    fill={isLight ? '#ffffff' : '#0f172a'}
                    stroke={isLight ? '#334155' : '#475569'}
                    strokeWidth="1.8"
                  />
                  {/* Grid dividers */}
                  <line x1="0" y1="24" x2="340" y2="24" stroke={isLight ? '#cbd5e1' : '#334155'} strokeWidth="1" />
                  <line x1="0" y1="56" x2="340" y2="56" stroke={isLight ? '#cbd5e1' : '#334155'} strokeWidth="1" />
                  <line x1="170" y1="24" x2="170" y2="56" stroke={isLight ? '#cbd5e1' : '#334155'} strokeWidth="1" />
                  <line x1="220" y1="56" x2="220" y2="100" stroke={isLight ? '#cbd5e1' : '#334155'} strokeWidth="1" />
                  <line x1="110" y1="56" x2="110" y2="100" stroke={isLight ? '#cbd5e1' : '#334155'} strokeWidth="1" />

                  {/* Institution */}
                  <text x="10" y="16" fontSize="9" fontWeight="bold" fill={isLight ? '#64748b' : '#94a3b8'}>
                    INSTITUTION: <tspan fill={isLight ? '#0f172a' : '#f8fafc'}>{titleBlock.institution || '—'}</tspan>
                  </text>

                  {/* Student Name */}
                  <text x="10" y="42" fontSize="9" fontWeight="bold" fill={isLight ? '#64748b' : '#94a3b8'}>
                    NAME: <tspan fill={isLight ? '#0f172a' : '#f8fafc'}>{titleBlock.studentName || '—'}</tspan>
                  </text>

                  {/* Roll Number */}
                  <text x="180" y="42" fontSize="9" fontWeight="bold" fill={isLight ? '#64748b' : '#94a3b8'}>
                    ROLL NO: <tspan fill={isLight ? '#0f172a' : '#f8fafc'} fontFamily="monospace">{titleBlock.rollNumber || '—'}</tspan>
                  </text>

                  {/* Drawing Title */}
                  <text x="10" y="70" fontSize="8" fontWeight="bold" fill={isLight ? '#64748b' : '#94a3b8'}>
                    TITLE:
                  </text>
                  <text x="10" y="86" fontSize="9" fontWeight="bold" fontFamily="monospace" fill={isLight ? '#0f172a' : '#f8fafc'}>
                    {titleBlock.title}
                  </text>

                  {/* Technical Parameters: Scale, Size, Date */}
                  <text x="118" y="70" fontSize="8" fontWeight="bold" fill={isLight ? '#64748b' : '#94a3b8'}>
                    SCALE: <tspan fill={isLight ? '#0f172a' : '#f8fafc'}>{titleBlock.scale}</tspan>
                  </text>
                  <text x="118" y="82" fontSize="8" fontWeight="bold" fill={isLight ? '#64748b' : '#94a3b8'}>
                    SIZE: <tspan fill={isLight ? '#0f172a' : '#f8fafc'}>ISO {sheetSize}</tspan>
                  </text>
                  <text x="118" y="94" fontSize="8" fontWeight="bold" fill={isLight ? '#64748b' : '#94a3b8'}>
                    DATE: <tspan fill={isLight ? '#0f172a' : '#f8fafc'} fontFamily="monospace">{titleBlock.date}</tspan>
                  </text>

                  {/* Projection Method with Conical Frustum Symbol */}
                  <g transform="translate(230, 60)">
                    <text x="2" y="8" fontSize="8" fontWeight="bold" fill={isLight ? '#64748b' : '#94a3b8'}>
                      {titleBlock.projectionMethod}
                    </text>
                    <g transform="translate(6, 12)">
                      <polygon points="2,5 14,2 14,18 2,15" stroke={isLight ? '#0f172a' : '#38bdf8'} strokeWidth="1" fill="none" />
                      <line x1="0" y1="10" x2="48" y2="10" strokeDasharray="3,1" stroke={isLight ? '#64748b' : '#94a3b8'} strokeWidth="0.6" />
                      <circle cx="28" cy="10" r="4" stroke={isLight ? '#0f172a' : '#38bdf8'} strokeWidth="1" fill="none" />
                      <circle cx="28" cy="10" r="7.5" stroke={isLight ? '#0f172a' : '#38bdf8'} strokeWidth="1" fill="none" />
                    </g>
                  </g>
                </g>
              );
            }

            // Clean Technical Only Mode (Personal Details Cleared)
            return (
              <g transform={`translate(${canvasWidth - 365}, ${canvasHeight - 90})`}>
                <rect
                  width="340"
                  height="60"
                  fill={isLight ? '#ffffff' : '#0f172a'}
                  stroke={isLight ? '#334155' : '#475569'}
                  strokeWidth="1.8"
                />
                <line x1="0" y1="28" x2="340" y2="28" stroke={isLight ? '#cbd5e1' : '#334155'} strokeWidth="1" />
                <line x1="220" y1="0" x2="220" y2="60" stroke={isLight ? '#cbd5e1' : '#334155'} strokeWidth="1" />
                <line x1="110" y1="28" x2="110" y2="60" stroke={isLight ? '#cbd5e1' : '#334155'} strokeWidth="1" />

                <text x="10" y="12" fontSize="8" fontWeight="bold" fill={isLight ? '#64748b' : '#94a3b8'}>
                  TITLE:
                </text>
                <text x="10" y="22" fontSize="10" fontWeight="bold" fontFamily="monospace" fill={isLight ? '#0f172a' : '#f8fafc'}>
                  {titleBlock.title}
                </text>

                <text x="10" y="40" fontSize="8" fontWeight="bold" fill={isLight ? '#64748b' : '#94a3b8'}>
                  SCALE: <tspan fill={isLight ? '#0f172a' : '#f8fafc'}>{titleBlock.scale}</tspan>
                </text>
                <text x="10" y="52" fontSize="8" fontWeight="bold" fill={isLight ? '#64748b' : '#94a3b8'}>
                  SIZE: <tspan fill={isLight ? '#0f172a' : '#f8fafc'}>ISO {sheetSize}</tspan>
                </text>

                <text x="120" y="40" fontSize="8" fontWeight="bold" fill={isLight ? '#64748b' : '#94a3b8'}>
                  DATE: <tspan fill={isLight ? '#0f172a' : '#f8fafc'} fontFamily="monospace">{titleBlock.date}</tspan>
                </text>
                <text x="120" y="52" fontSize="8" fontWeight="bold" fill={isLight ? '#64748b' : '#94a3b8'}>
                  METHOD: <tspan fill={isLight ? '#0284c7' : '#38bdf8'}>{titleBlock.projectionMethod}</tspan>
                </text>

                <g transform="translate(230, 8)">
                  <text x="2" y="9" fontSize="8" fontWeight="bold" fill={isLight ? '#64748b' : '#94a3b8'}>
                    PROJECTION SYMBOL:
                  </text>
                  <g transform="translate(6, 14)">
                    <polygon points="2,6 16,2 16,20 2,16" stroke={isLight ? '#0f172a' : '#38bdf8'} strokeWidth="1" fill="none" />
                    <line x1="0" y1="11" x2="52" y2="11" strokeDasharray="3,1" stroke={isLight ? '#64748b' : '#94a3b8'} strokeWidth="0.6" />
                    <circle cx="32" cy="11" r="4.5" stroke={isLight ? '#0f172a' : '#38bdf8'} strokeWidth="1" fill="none" />
                    <circle cx="32" cy="11" r="8" stroke={isLight ? '#0f172a' : '#38bdf8'} strokeWidth="1" fill="none" />
                  </g>
                </g>
              </g>
            );
          })()}

          {/* Reference Ground Line XY */}
          {activeElementIds.has('xy_line') && (
            <g
              className="interactive-clickable cursor-pointer"
              onClick={() =>
                setInspection({
                  name: 'Reference Ground Line XY',
                  type: 'line',
                  lengthMm: Math.round(xyEnd.x - xyStart.x),
                  pencilGrade: '2H (Thin / Construction)',
                  formula: 'Intersection of VP & HP',
                  x: (xyStart.x + xyEnd.x) / 2,
                  y: originY,
                })
              }
            >
              <line
                x1={xyStart.x}
                y1={originY}
                x2={xyEnd.x}
                y2={originY}
                {...getLineStyle('xy_line', isLight ? '#0f172a' : '#f8fafc')}
              />
              {/* XY Labels */}
              <text x={xyStart.x - 22} y={originY + 5} fontSize="14" fontWeight="bold" fill={isLight ? '#0f172a' : '#f8fafc'} fontFamily="monospace">
                X
              </text>
              <text x={xyEnd.x + 10} y={originY + 5} fontSize="14" fontWeight="bold" fill={isLight ? '#0f172a' : '#f8fafc'} fontFamily="monospace">
                Y
              </text>
              <text x={xyStart.x + 10} y={originY - 8} fontSize="10" fontWeight="bold" fill={isLight ? '#475569' : '#94a3b8'} fontFamily="monospace">
                V.P. (Elevation) · Reference XY (Y = 0) · {blueprint.parsed_parameters.quadrant || 'First (I)'}
              </text>
              <text x={xyStart.x + 10} y={originY + 18} fontSize="10" fontWeight="bold" fill={isLight ? '#64748b' : '#64748b'} fontFamily="monospace">
                H.P. (Plan / Top View)
              </text>
            </g>
          )}

          {/* Vertical Projectors for Point A (a' to a) */}
          {activeElementIds.has('a_projector') && (
            <g
              className="interactive-clickable cursor-pointer"
              onClick={() =>
                setInspection({
                  name: 'Projector of End A',
                  type: 'line',
                  pencilGrade: '2H (Thin / Construction)',
                  formula: `h_A = ${formatLength(parsed_parameters.point_a_above_hp_mm, unit)}, d_A = ${formatLength(parsed_parameters.point_a_in_front_vp_mm, unit)}`,
                  x: a_prime.x,
                  y: originY,
                })
              }
            >
              <line
                x1={a_prime.x}
                y1={a_prime.y}
                x2={a.x}
                y2={a.y}
                strokeDasharray="4,3"
                {...getLineStyle('a_projector', isLight ? '#64748b' : '#64748b', true)}
              />
            </g>
          )}

          {/* Locus Lines */}
          {activeElementIds.has('loci_a') && (
            <g>
              {/* Locus of a' */}
              <line
                x1={a_prime.x - 40}
                y1={locus_a_prime_y}
                x2={canvasWidth - 180}
                y2={locus_a_prime_y}
                strokeDasharray="5,4"
                {...getLineStyle('loci_a', isLight ? '#94a3b8' : '#475569', true)}
              />
              <text x={canvasWidth - 170} y={locus_a_prime_y + 4} fontSize="9" fill={isLight ? '#64748b' : '#94a3b8'} fontFamily="monospace">
                Locus of a&apos; ({formatLength(parsed_parameters.point_a_above_hp_mm, unit)})
              </text>

              {/* Locus of a */}
              <line
                x1={a.x - 40}
                y1={locus_a_y}
                x2={canvasWidth - 180}
                y2={locus_a_y}
                strokeDasharray="5,4"
                {...getLineStyle('loci_a', isLight ? '#94a3b8' : '#475569', true)}
              />
              <text x={canvasWidth - 170} y={locus_a_y + 4} fontSize="9" fill={isLight ? '#64748b' : '#94a3b8'} fontFamily="monospace">
                Locus of a ({formatLength(parsed_parameters.point_a_in_front_vp_mm, unit)})
              </text>
            </g>
          )}

          {activeElementIds.has('loci_b') && (
            <g>
              {/* Locus of b' */}
              <line
                x1={a_prime.x - 40}
                y1={locus_b_prime_y}
                x2={canvasWidth - 180}
                y2={locus_b_prime_y}
                strokeDasharray="5,4"
                {...getLineStyle('loci_b', isLight ? '#94a3b8' : '#475569', true)}
              />
              <text x={canvasWidth - 170} y={locus_b_prime_y + 4} fontSize="9" fill={isLight ? '#64748b' : '#94a3b8'} fontFamily="monospace">
                Locus of b&apos; ({formatLength(calculated_answers.point_b_above_hp_mm, unit)})
              </text>

              {/* Locus of b */}
              <line
                x1={a.x - 40}
                y1={locus_b_y}
                x2={canvasWidth - 180}
                y2={locus_b_y}
                strokeDasharray="5,4"
                {...getLineStyle('loci_b', isLight ? '#94a3b8' : '#475569', true)}
              />
              <text x={canvasWidth - 170} y={locus_b_y + 4} fontSize="9" fill={isLight ? '#64748b' : '#94a3b8'} fontFamily="monospace">
                Locus of b ({formatLength(calculated_answers.point_b_in_front_vp_mm, unit)})
              </text>
            </g>
          )}

          {/* True Length in Front View (a' b1') */}
          {activeElementIds.has('tl_fv') && (
            <g
              className="interactive-clickable cursor-pointer"
              onClick={() =>
                setInspection({
                  name: "True Length in Front View (a'b₁')",
                  type: 'line',
                  lengthMm: parsed_parameters.true_length_mm,
                  angleDeg: calculated_answers.theta_inclination_hp,
                  pencilGrade: '2H (Thin / Construction)',
                  formula: `TL = ${formatLength(parsed_parameters.true_length_mm, unit)}, θ = ${calculated_answers.theta_inclination_hp}° to HP`,
                  x: (a_prime.x + b1_prime.x) / 2,
                  y: (a_prime.y + b1_prime.y) / 2,
                })
              }
            >
              <line
                x1={a_prime.x}
                y1={a_prime.y}
                x2={b1_prime.x}
                y2={b1_prime.y}
                {...getLineStyle('tl_fv', isLight ? '#2563eb' : '#38bdf8')}
              />
              {/* Angle arc for theta */}
              <path
                d={describeAngleArc(a_prime.x, a_prime.y, 35, calculated_answers.theta_inclination_hp, true)}
                fill="none"
                stroke={isLight ? '#2563eb' : '#38bdf8'}
                strokeWidth="1.2"
              />
              <text x={a_prime.x + 42} y={a_prime.y - 12} fontSize="11" fontWeight="bold" fill={isLight ? '#2563eb' : '#38bdf8'} fontFamily="monospace">
                θ = {calculated_answers.theta_inclination_hp}°
              </text>
            </g>
          )}

          {/* Projector from b1' to b1 */}
          {activeElementIds.has('b1_projector') && (
            <line
              x1={b1_prime.x}
              y1={b1_prime.y}
              x2={b1.x}
              y2={b1.y}
              strokeDasharray="3,3"
              {...getLineStyle('b1_projector', isLight ? '#94a3b8' : '#64748b', true)}
            />
          )}

          {/* Apparent Plan line ab1 */}
          {activeElementIds.has('b1_point') && (
            <line
              x1={a.x}
              y1={a.y}
              x2={b1.x}
              y2={b1.y}
              {...getLineStyle('b1_point', isLight ? '#d97706' : '#fbbf24', true)}
            />
          )}

          {/* True Length in Top View (a b2) */}
          {activeElementIds.has('tl_tv') && (
            <g
              className="interactive-clickable cursor-pointer"
              onClick={() =>
                setInspection({
                  name: 'True Length in Top View (ab₂)',
                  type: 'line',
                  lengthMm: parsed_parameters.true_length_mm,
                  angleDeg: calculated_answers.phi_inclination_vp,
                  pencilGrade: '2H (Thin / Construction)',
                  formula: `TL = ${formatLength(parsed_parameters.true_length_mm, unit)}, φ = ${calculated_answers.phi_inclination_vp}° to VP`,
                  x: (a.x + b2.x) / 2,
                  y: (a.y + b2.y) / 2,
                })
              }
            >
              <line
                x1={a.x}
                y1={a.y}
                x2={b2.x}
                y2={b2.y}
                {...getLineStyle('tl_tv', isLight ? '#d97706' : '#fbbf24')}
              />
              {/* Angle arc for phi */}
              <path
                d={describeAngleArc(a.x, a.y, 35, calculated_answers.phi_inclination_vp, false)}
                fill="none"
                stroke={isLight ? '#d97706' : '#fbbf24'}
                strokeWidth="1.2"
              />
              <text x={a.x + 42} y={a.y + 20} fontSize="11" fontWeight="bold" fill={isLight ? '#d97706' : '#fbbf24'} fontFamily="monospace">
                φ = {calculated_answers.phi_inclination_vp}°
              </text>
            </g>
          )}

          {/* Projector from b2 to b2' */}
          {activeElementIds.has('b2_projector') && (
            <line
              x1={b2.x}
              y1={b2.y}
              x2={b2_prime.x}
              y2={b2_prime.y}
              strokeDasharray="3,3"
              {...getLineStyle('b2_projector', isLight ? '#94a3b8' : '#64748b', true)}
            />
          )}

          {/* Apparent Elevation line a'b2' */}
          {activeElementIds.has('b2_prime_point') && (
            <line
              x1={a_prime.x}
              y1={a_prime.y}
              x2={b2_prime.x}
              y2={b2_prime.y}
              {...getLineStyle('b2_prime_point', isLight ? '#2563eb' : '#38bdf8', true)}
            />
          )}

          {/* Front View Arc (Swinging a'b2' up to b') */}
          {activeElementIds.has('fv_arc') && (
            <g
              className="interactive-clickable cursor-pointer"
              onClick={() =>
                setInspection({
                  name: 'Front View Rotation Arc',
                  type: 'arc',
                  lengthMm: calculated_answers.front_view_length_mm,
                  pencilGrade: '2H (Thin / Construction)',
                  formula: `Arc Radius = FV = ${formatLength(calculated_answers.front_view_length_mm, unit)}`,
                  x: (b2_prime.x + b_prime.x) / 2,
                  y: (b2_prime.y + b_prime.y) / 2,
                })
              }
            >
              <path
                d={fvArcPath}
                fill="none"
                strokeDasharray="4,2"
                {...getLineStyle('fv_arc', isLight ? '#2563eb' : '#38bdf8', true)}
              />
            </g>
          )}

          {/* Top View Arc (Swinging ab1 down to b) */}
          {activeElementIds.has('tv_arc') && (
            <g
              className="interactive-clickable cursor-pointer"
              onClick={() =>
                setInspection({
                  name: 'Top View Rotation Arc',
                  type: 'arc',
                  lengthMm: calculated_answers.top_view_length_mm,
                  pencilGrade: '2H (Thin / Construction)',
                  formula: `Arc Radius = TV = ${formatLength(calculated_answers.top_view_length_mm, unit)}`,
                  x: (b1.x + b.x) / 2,
                  y: (b1.y + b.y) / 2,
                })
              }
            >
              <path
                d={tvArcPath}
                fill="none"
                strokeDasharray="4,2"
                {...getLineStyle('tv_arc', isLight ? '#d97706' : '#fbbf24', true)}
              />
            </g>
          )}

          {/* Final Front View (a' b') */}
          {activeElementIds.has('fv_line') && (
            <g
              className="interactive-clickable cursor-pointer"
              onClick={() =>
                setInspection({
                  name: "Final Front View (a'b')",
                  type: 'line',
                  lengthMm: calculated_answers.front_view_length_mm,
                  angleDeg: calculated_answers.alpha_apparent_elevation_deg,
                  pencilGrade: 'HB (Medium / Final Object)',
                  formula: `FV = ${formatLength(calculated_answers.front_view_length_mm, unit)}, α = ${calculated_answers.alpha_apparent_elevation_deg}°`,
                  x: (a_prime.x + b_prime.x) / 2,
                  y: (a_prime.y + b_prime.y) / 2,
                })
              }
            >
              <line
                x1={a_prime.x}
                y1={a_prime.y}
                x2={b_prime.x}
                y2={b_prime.y}
                {...getLineStyle('fv_line', isLight ? '#1e293b' : '#22d3ee')}
              />
              <path
                d={describeAngleArc(a_prime.x, a_prime.y, 25, calculated_answers.alpha_apparent_elevation_deg, true)}
                fill="none"
                stroke={isLight ? '#1e293b' : '#22d3ee'}
                strokeWidth="1.2"
              />
              <text x={a_prime.x + 30} y={a_prime.y - 4} fontSize="10" fontWeight="bold" fill={isLight ? '#1e293b' : '#22d3ee'} fontFamily="monospace">
                α = {calculated_answers.alpha_apparent_elevation_deg}°
              </text>
            </g>
          )}

          {/* Final Top View (a b) */}
          {activeElementIds.has('tv_line') && (
            <g
              className="interactive-clickable cursor-pointer"
              onClick={() =>
                setInspection({
                  name: 'Final Top View (ab)',
                  type: 'line',
                  lengthMm: calculated_answers.top_view_length_mm,
                  angleDeg: calculated_answers.beta_apparent_plan_deg,
                  pencilGrade: 'HB (Medium / Final Object)',
                  formula: `TV = ${formatLength(calculated_answers.top_view_length_mm, unit)}, β = ${calculated_answers.beta_apparent_plan_deg}°`,
                  x: (a.x + b.x) / 2,
                  y: (a.y + b.y) / 2,
                })
              }
            >
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                {...getLineStyle('tv_line', isLight ? '#1e293b' : '#f59e0b')}
              />
              <path
                d={describeAngleArc(a.x, a.y, 25, calculated_answers.beta_apparent_plan_deg, false)}
                fill="none"
                stroke={isLight ? '#1e293b' : '#f59e0b'}
                strokeWidth="1.2"
              />
              <text x={a.x + 30} y={a.y + 12} fontSize="10" fontWeight="bold" fill={isLight ? '#1e293b' : '#f59e0b'} fontFamily="monospace">
                β = {calculated_answers.beta_apparent_plan_deg}°
              </text>
            </g>
          )}

          {/* End Projector Line (b' to b) */}
          {activeElementIds.has('end_projector') && (
            <g
              className="interactive-clickable cursor-pointer"
              onClick={() =>
                setInspection({
                  name: "End Projector of B (b'-b)",
                  type: 'line',
                  lengthMm: calculated_answers.distance_between_projectors_mm,
                  pencilGrade: '2H (Thin / Construction)',
                  formula: `Projector Separation D = ${formatLength(calculated_answers.distance_between_projectors_mm, unit)}`,
                  x: b_prime.x,
                  y: originY,
                })
              }
            >
              <line
                x1={b_prime.x}
                y1={b_prime.y}
                x2={b.x}
                y2={b.y}
                strokeDasharray="4,3"
                {...getLineStyle('end_projector', isLight ? '#64748b' : '#64748b', true)}
              />
            </g>
          )}

          {/* Standard Engineering Annotations (a, a', b, b', b1, b2, etc.) */}
          {showAnnotations && (
            <g className="font-mono font-bold text-xs select-none">
              {/* Point a' */}
              {activeElementIds.has('a_points') && (
                <>
                  <circle cx={a_prime.x} cy={a_prime.y} r="3.5" fill={isLight ? '#2563eb' : '#38bdf8'} />
                  <text x={a_prime.x - 18} y={a_prime.y - 8} fill={isLight ? '#2563eb' : '#38bdf8'}>
                    a&apos;
                  </text>
                </>
              )}

              {/* Point a */}
              {activeElementIds.has('a_points') && (
                <>
                  <circle cx={a.x} cy={a.y} r="3.5" fill={isLight ? '#d97706' : '#fbbf24'} />
                  <text x={a.x - 16} y={a.y + 16} fill={isLight ? '#d97706' : '#fbbf24'}>
                    a
                  </text>
                </>
              )}

              {/* Point b1' */}
              {activeElementIds.has('tl_fv') && (
                <>
                  <circle cx={b1_prime.x} cy={b1_prime.y} r="3" fill={isLight ? '#2563eb' : '#38bdf8'} />
                  <text x={b1_prime.x + 8} y={b1_prime.y - 6} fill={isLight ? '#2563eb' : '#38bdf8'}>
                    b₁&apos;
                  </text>
                </>
              )}

              {/* Point b1 */}
              {activeElementIds.has('b1_point') && (
                <>
                  <circle cx={b1.x} cy={b1.y} r="3" fill={isLight ? '#d97706' : '#fbbf24'} />
                  <text x={b1.x + 8} y={b1.y + 14} fill={isLight ? '#d97706' : '#fbbf24'}>
                    b₁
                  </text>
                </>
              )}

              {/* Point b2 */}
              {activeElementIds.has('tl_tv') && (
                <>
                  <circle cx={b2.x} cy={b2.y} r="3" fill={isLight ? '#d97706' : '#fbbf24'} />
                  <text x={b2.x + 8} y={b2.y + 14} fill={isLight ? '#d97706' : '#fbbf24'}>
                    b₂
                  </text>
                </>
              )}

              {/* Point b2' */}
              {activeElementIds.has('b2_prime_point') && (
                <>
                  <circle cx={b2_prime.x} cy={b2_prime.y} r="3" fill={isLight ? '#2563eb' : '#38bdf8'} />
                  <text x={b2_prime.x + 8} y={b2_prime.y - 6} fill={isLight ? '#2563eb' : '#38bdf8'}>
                    b₂&apos;
                  </text>
                </>
              )}

              {/* Final Point b' */}
              {activeElementIds.has('b_prime_point') && (
                <>
                  <circle cx={b_prime.x} cy={b_prime.y} r="4" fill={isLight ? '#0f172a' : '#22d3ee'} />
                  <text x={b_prime.x + 8} y={b_prime.y - 8} fill={isLight ? '#0f172a' : '#22d3ee'} fontSize="13">
                    b&apos;
                  </text>
                </>
              )}

              {/* Final Point b */}
              {activeElementIds.has('b_point') && (
                <>
                  <circle cx={b.x} cy={b.y} r="4" fill={isLight ? '#0f172a' : '#f59e0b'} />
                  <text x={b.x + 8} y={b.y + 16} fill={isLight ? '#0f172a' : '#f59e0b'} fontSize="13">
                    b
                  </text>
                </>
              )}
            </g>
          )}

          {/* PHYSICAL TOOL ANIMATIONS OVERLAY */}
          {/* 1. Animated Virtual Drafting Compass */}
          {showCompass && (
            <g transform={`translate(${compassCenter.x}, ${compassCenter.y}) rotate(${compassAngle})`}>
              {/* Compass Fixed Needle Leg */}
              <line x1="0" y1="0" x2="-8" y2="-45" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
              <circle cx="0" cy="0" r="2.5" fill="#f59e0b" />
              {/* Compass Hinge Joint */}
              <circle cx="-8" cy="-45" r="5" fill="#475569" stroke="#94a3b8" strokeWidth="1.5" />
              {/* Compass Pencil Leg */}
              <line x1="-8" y1="-45" x2={compassRadius} y2="0" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
              {/* Compass Pencil Tip with Graphite Sparkle */}
              <circle cx={compassRadius} cy="0" r="3" fill="#f97316" />
              <circle cx={compassRadius} cy="0" r="6" fill="none" stroke="#f97316" strokeWidth="1" opacity="0.6" className="animate-ping" />
            </g>
          )}

          {/* 2. Animated Virtual Drafting Ruler & Pencil */}
          {showRuler && (
            <g>
              {/* Translucent Acrylic Drafting Ruler */}
              <g
                transform={`translate(${(rulerStart.x + rulerEnd.x) / 2}, ${(rulerStart.y + rulerEnd.y) / 2}) rotate(${
                  (Math.atan2(rulerEnd.y - rulerStart.y, rulerEnd.x - rulerStart.x) * 180) / Math.PI
                })`}
              >
                <rect
                  x="-120"
                  y="-14"
                  width="240"
                  height="22"
                  rx="3"
                  fill={isLight ? 'rgba(254, 240, 138, 0.45)' : 'rgba(56, 189, 248, 0.25)'}
                  stroke={isLight ? '#ca8a04' : '#38bdf8'}
                  strokeWidth="1"
                />
                {/* Millimeter Tick Marks on Ruler Edge */}
                {Array.from({ length: 24 }).map((_, i) => (
                  <line
                    key={i}
                    x1={-110 + i * 10}
                    y1="-14"
                    x2={-110 + i * 10}
                    y2={i % 5 === 0 ? '-6' : '-10'}
                    stroke={isLight ? '#854d0e' : '#e0f2fe'}
                    strokeWidth="0.8"
                  />
                ))}
              </g>

              {/* Drafting Pencil Drawing in Real-Time */}
              <g transform={`translate(${pencilCurrX}, ${pencilCurrY})`}>
                <polygon points="0,0 -4,-18 4,-18" fill="#eab308" stroke="#713f12" strokeWidth="0.8" />
                <polygon points="0,0 -1.5,-6 1.5,-6" fill="#1e293b" />
                <rect x="-4" y="-55" width="8" height="37" fill="#ca8a04" stroke="#713f12" strokeWidth="0.8" />
                {/* Graphite contact glow */}
                <circle cx="0" cy="0" r="3.5" fill="#f97316" />
              </g>
            </g>
          )}
        </svg>
      </div>

      {/* FLOATING CONTROLS & INSPECTORS */}
      {/* 1. Contextual Element Inspector Modal/Card */}
      {inspection && (
        <div className={`absolute top-4 left-4 z-30 p-3.5 rounded-xl border shadow-xl backdrop-blur-md max-w-xs space-y-2 animate-fadeIn text-xs ${
          isLight
            ? 'bg-white/95 border-slate-200 text-slate-800'
            : 'bg-slate-900/95 border-slate-700 text-slate-100'
        }`}>
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span>{inspection.name}</span>
            </span>
            <button
              onClick={() => setInspection(null)}
              className="p-0.5 rounded text-slate-400 hover:text-slate-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1 font-mono text-[11px]">
            {inspection.lengthMm !== undefined && (
              <div className="flex justify-between">
                <span className="text-slate-400">Length:</span>
                <span className="font-bold">{formatLength(inspection.lengthMm, unit)}</span>
              </div>
            )}
            {inspection.angleDeg !== undefined && (
              <div className="flex justify-between">
                <span className="text-slate-400">Inclination:</span>
                <span className="font-bold text-cyan-400">{inspection.angleDeg}°</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Pencil Grade:</span>
              <span className="font-bold text-amber-500">{inspection.pencilGrade}</span>
            </div>
            {inspection.formula && (
              <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-700/60 font-sans">
                {inspection.formula}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Floating Zoom & Reset Bar */}
      <div className={`absolute bottom-4 left-4 z-30 flex items-center gap-1 p-1 rounded-xl border shadow-lg backdrop-blur-md text-xs ${
        isLight
          ? 'bg-white/90 border-slate-200 text-slate-700'
          : 'bg-slate-900/90 border-slate-700 text-slate-200'
      }`}>
        <button
          onClick={handleZoomIn}
          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="px-1.5 font-mono text-[11px]">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={handleResetZoom}
          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          title="Reset Zoom & Pan (100%)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3. Floating Fullscreen Icon Button (Bottom-right corner of OrthographicCanvas2D container) */}
      <button
        type="button"
        onClick={isFullscreen ? exitFullscreenMode : requestFullscreenMode}
        className={`absolute bottom-4 right-4 z-40 p-3 rounded-2xl border shadow-2xl backdrop-blur-md flex items-center justify-center transition-all active:scale-95 group ${
          isLight
            ? 'bg-white/95 border-slate-300 text-slate-800 hover:bg-slate-50 hover:text-orange-600 shadow-slate-400/20'
            : 'bg-slate-900/95 border-slate-700/80 text-slate-200 hover:bg-slate-800 hover:text-cyan-300 shadow-black/50'
        }`}
        aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        title={isFullscreen ? 'Exit Fullscreen Mode (Esc)' : 'Enter Fullscreen Mode (Hide all UI & sidebars)'}
      >
        {isFullscreen ? (
          <Minimize2 className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
        ) : (
          <Maximize2 className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
        )}
      </button>

      {/* Floating Exit Hint Bar (Visible in Fullscreen Mode) */}
      {isFullscreen && (
        <div className="absolute top-4 right-4 z-40 flex items-center gap-2 animate-fadeIn pointer-events-auto">
          <span className="text-[11px] font-mono font-medium px-2.5 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/80 text-slate-300 shadow-lg hidden sm:inline">
            Press <kbd className="px-1 py-0.5 rounded bg-slate-800 text-cyan-300 font-semibold">Esc</kbd> or click to exit fullscreen
          </span>
          <button
            type="button"
            onClick={exitFullscreenMode}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors shadow-lg"
            title="Exit Fullscreen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
