import React from 'react';
import {
  PenTool,
  RotateCw,
  Ruler,
  Tag,
  ChevronLeft,
  ChevronRight,
  FileText,
  Sliders,
  Sparkles,
  Compass,
  Layers,
  Wand2,
} from 'lucide-react';
import { DrawingTool, SheetSize, TitleBlockInfo, ThemeMode, ExportStyle } from '../types/engineering';

interface SidebarLeftProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeTool: DrawingTool;
  setActiveTool: (t: DrawingTool) => void;
  showAnnotations: boolean;
  setShowAnnotations: (show: boolean) => void;
  sheetSize: SheetSize;
  onOpenTitleBlockModal: () => void;
  exportStyle: ExportStyle;
  onToggleExportStyle: () => void;
  theme: ThemeMode;
  onShowRulerTool?: () => void;
}

export const SidebarLeft: React.FC<SidebarLeftProps> = ({
  isCollapsed,
  onToggleCollapse,
  activeTool,
  setActiveTool,
  showAnnotations,
  setShowAnnotations,
  sheetSize,
  onOpenTitleBlockModal,
  exportStyle,
  onToggleExportStyle,
  theme,
  onShowRulerTool,
}) => {
  const isLight = theme === 'draftboard';

  return (
    <aside
      className={`border-r transition-all duration-300 flex flex-col z-20 shrink-0 ${
        isCollapsed ? 'w-14' : 'w-64'
      } ${
        isLight
          ? 'bg-slate-50/95 border-slate-200 text-slate-800'
          : 'bg-slate-900/95 border-slate-800 text-slate-200'
      }`}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-3 border-b border-inherit">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider font-mono">
              Drafting Tools
            </span>
          </div>
        )}
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
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Tools List */}
      <div className="flex-1 p-2 space-y-4 overflow-y-auto">
        {/* Core Drafting Tools */}
        <div>
          {!isCollapsed && (
            <div className="px-2 pb-1.5 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              Instruments
            </div>
          )}
          <div className="space-y-1">
            <button
              onClick={() => setActiveTool('Draw Line')}
              className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium transition-all ${
                activeTool === 'Draw Line'
                  ? isLight
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : isLight
                  ? 'hover:bg-slate-200 text-slate-700'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
              title="Draw Line (Straightedges & Pencils)"
            >
              <PenTool className="w-4 h-4 shrink-0" />
              {!isCollapsed && (
                <div className="text-left flex-1">
                  <div>Straightedge & Line</div>
                  <div className={`text-[10px] ${activeTool === 'Draw Line' ? 'opacity-80' : 'text-slate-400'}`}>
                    HB Outlines / 2H Projectors
                  </div>
                </div>
              )}
            </button>

            <button
              onClick={() => setActiveTool('Draw Arc')}
              className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium transition-all ${
                activeTool === 'Draw Arc'
                  ? isLight
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : isLight
                  ? 'hover:bg-slate-200 text-slate-700'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
              title="Draw Arc (Precision Compass)"
            >
              <RotateCw className="w-4 h-4 shrink-0" />
              {!isCollapsed && (
                <div className="text-left flex-1">
                  <div>Drafting Compass</div>
                  <div className={`text-[10px] ${activeTool === 'Draw Arc' ? 'opacity-80' : 'text-slate-400'}`}>
                    Rotate Views to find Loci
                  </div>
                </div>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTool('Measure Distance / Angle');
                onShowRulerTool?.();
              }}
              className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium transition-all ${
                activeTool === 'Measure Distance / Angle'
                  ? isLight
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : isLight
                  ? 'hover:bg-slate-200 text-slate-700'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
              title="Measure Distance & Angles (Ruler & Protractor)"
            >
              <Ruler className="w-4 h-4 shrink-0" />
              {!isCollapsed && (
                <div className="text-left flex-1">
                  <div>Ruler & Protractor</div>
                  <div className={`text-[10px] ${activeTool === 'Measure Distance / Angle' ? 'opacity-80' : 'text-slate-400'}`}>
                    Verify TL, FV, TV & Angles
                  </div>
                </div>
              )}
            </button>

            <button
              onClick={() => setShowAnnotations(!showAnnotations)}
              className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium transition-all ${
                showAnnotations
                  ? isLight
                    ? 'bg-blue-50 text-blue-800 border border-blue-200'
                    : 'bg-slate-800 text-cyan-300 border border-slate-700'
                  : isLight
                  ? 'hover:bg-slate-200 text-slate-400'
                  : 'hover:bg-slate-800 text-slate-500'
              }`}
              title="Toggle Point Annotations (a, a', b, b', b1, b2)"
            >
              <Tag className="w-4 h-4 shrink-0" />
              {!isCollapsed && (
                <div className="text-left flex-1">
                  <div className="flex items-center justify-between">
                    <span>Point Annotations</span>
                    <span className="text-[10px] font-mono px-1 rounded bg-black/20">
                      {showAnnotations ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Labels a, a&apos;, b, b&apos;, b₁, b₂
                  </div>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Sheet & Style Settings */}
        <div>
          {!isCollapsed && (
            <div className="px-2 pb-1.5 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              Drawing Sheet
            </div>
          )}
          <div className="space-y-1">
            <button
              onClick={onOpenTitleBlockModal}
              className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium border transition-colors ${
                isLight
                  ? 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                  : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-slate-300'
              }`}
              title="Configure Title Block & Sheet Format"
            >
              <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
              {!isCollapsed && (
                <div className="text-left flex-1">
                  <div className="flex items-center justify-between">
                    <span>Title Block</span>
                    <span className="text-[10px] font-mono font-bold text-cyan-400">
                      ISO {sheetSize}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Name, Roll No, Scale
                  </div>
                </div>
              )}
            </button>

            {/* Hand-Drawn Pencil Filter Toggle */}
            <button
              onClick={onToggleExportStyle}
              className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium border transition-colors ${
                exportStyle === 'hand_drawn'
                  ? isLight
                    ? 'border-orange-300 bg-orange-50 text-orange-800 font-semibold'
                    : 'border-amber-500/50 bg-amber-500/10 text-amber-300 font-semibold'
                  : isLight
                  ? 'border-slate-200 hover:bg-slate-100 text-slate-700'
                  : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-slate-300'
              }`}
              title="Hand-Drawn Pencil Mode (2H vs HB pencil weight variations and paper grain)"
            >
              <Wand2 className="w-4 h-4 text-amber-400 shrink-0" />
              {!isCollapsed && (
                <div className="text-left flex-1">
                  <div className="flex items-center justify-between">
                    <span>Hand-Drawn Pencil</span>
                    <span className="text-[10px] font-mono px-1 rounded bg-black/20">
                      {exportStyle === 'hand_drawn' ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    2H &amp; HB Pencil Variations
                  </div>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
