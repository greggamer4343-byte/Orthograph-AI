import React from 'react';
import {
  Compass,
  Box,
  Layers,
  BookOpen,
  Download,
  RotateCcw,
  Sparkles,
  ClipboardPaste,
  Sun,
  Moon,
  FileText,
  Code,
} from 'lucide-react';
import { UnitPreference, ThemeMode, SheetSize } from '../types/engineering';

interface TopNavProps {
  activeTab: '2d' | '3d' | 'walkthrough' | 'formulas';
  setActiveTab: (tab: '2d' | '3d' | 'walkthrough' | 'formulas') => void;
  unit: UnitPreference;
  onUnitChange: (unit: UnitPreference) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  sheetSize: SheetSize;
  onOpenTitleBlockModal: () => void;
  onOpenPasteModal: () => void;
  onOpenChatbot: () => void;
  onOpenPlottingEngineModal: () => void;
  onReset: () => void;
  onExportSVG: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  unit,
  onUnitChange,
  theme,
  onToggleTheme,
  sheetSize,
  onOpenTitleBlockModal,
  onOpenPasteModal,
  onOpenChatbot,
  onOpenPlottingEngineModal,
  onReset,
  onExportSVG,
}) => {
  const isLight = theme === 'draftboard';

  return (
    <header className={`flex items-center justify-between px-4 sm:px-6 py-2.5 border-b backdrop-blur-md sticky top-0 z-40 transition-colors ${
      isLight
        ? 'bg-slate-50/95 border-slate-200 text-slate-800'
        : 'bg-slate-900/95 border-slate-800 text-slate-100'
    }`}>
      {/* Zone 1: Wordmark & Primary Action */}
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-sm shadow-md ${
          isLight
            ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-blue-500/20'
            : 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-cyan-500/20'
        }`}>
          EG
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight font-sans leading-none">
            OrthographAI
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 hidden sm:inline">
            Engineering Graphics Problem Solver
          </span>
        </div>

        {/* FOCUSED TEXT INPUT BUTTON (Prominent 'Paste Question' button as requested) */}
        <button
          onClick={onOpenPasteModal}
          className={`ml-2 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 ${
            isLight
              ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/25'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-500/25'
          }`}
          title="Paste natural language engineering graphics problem"
        >
          <ClipboardPaste className="w-3.5 h-3.5" />
          <span>Paste Question</span>
        </button>
      </div>

      {/* Zone 2: Navigation Links (2D, 3D, Walkthrough, Formulas) */}
      <nav className={`hidden md:flex items-center gap-1 p-1 rounded-xl border ${
        isLight ? 'bg-slate-200/70 border-slate-300' : 'bg-slate-950/60 border-slate-800/80'
      }`}>
        <button
          onClick={() => setActiveTab('2d')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === '2d'
              ? isLight
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/60'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>2D Blueprint</span>
        </button>

        <button
          onClick={() => setActiveTab('3d')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === '3d'
              ? isLight
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/60'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          <span>3D Quadrant</span>
        </button>

        <button
          onClick={() => setActiveTab('walkthrough')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'walkthrough'
              ? isLight
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/60'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Construction Steps</span>
        </button>

        <button
          onClick={() => setActiveTab('formulas')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'formulas'
              ? isLight
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/60'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Formulas &amp; Proofs</span>
        </button>
      </nav>

      {/* Zone 3: Global Unit Toggle, Theme Switcher, Reset & Export */}
      <div className="flex items-center gap-2">
        {/* Global Unit Preference Toggle: mm vs inches */}
        <div className={`flex items-center p-0.5 rounded-lg border text-xs font-mono ${
          isLight ? 'bg-slate-200 border-slate-300' : 'bg-slate-950 border-slate-800'
        }`}>
          <button
            onClick={() => onUnitChange('mm')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              unit === 'mm'
                ? isLight
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Use metric units (millimeters)"
          >
            mm
          </button>
          <button
            onClick={() => onUnitChange('inches')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              unit === 'inches'
                ? isLight
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Use imperial units (inches)"
          >
            inches
          </button>
        </div>

        {/* Theme Toggle: Digital Draftboard (Light) vs Modern Blueprint (Dark) */}
        <button
          onClick={onToggleTheme}
          className={`p-1.5 rounded-lg border transition-colors ${
            isLight
              ? 'bg-white border-slate-300 hover:bg-slate-200 text-amber-600'
              : 'bg-slate-950 border-slate-800 hover:bg-slate-800 text-cyan-400'
          }`}
          title={isLight ? 'Switch to Modern Blueprint (Dark Mode)' : 'Switch to Digital Draftboard (Light Mode)'}
        >
          {isLight ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Plotting Engine JSON & Quadrants */}
        <button
          onClick={onOpenPlottingEngineModal}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            isLight
              ? 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700 shadow-sm'
              : 'border-slate-800 bg-slate-950/80 hover:bg-slate-800 text-cyan-400'
          }`}
          title="View Programmatic Plotting Engine JSON & 4-Quadrant Rules"
        >
          <Code className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Plotting Engine</span>
        </button>

        {/* Gemini Chatbot: OrthographAI Tutor */}
        <button
          onClick={onOpenChatbot}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
            isLight
              ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20'
              : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white shadow-purple-500/20'
          }`}
          title="Ask OrthographAI Tutor (Gemini Multi-turn Chatbot)"
        >
          <Sparkles className="w-3.5 h-3.5 fill-current" />
          <span>AI Tutor</span>
        </button>

        {/* Reset Problem */}
        <button
          onClick={onReset}
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
            isLight
              ? 'border-slate-300 hover:bg-slate-200 text-slate-600'
              : 'border-slate-800 hover:bg-slate-800 text-slate-400'
          }`}
          title="Reset problem to benchmark"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Reset</span>
        </button>

        {/* Export Drawing as SVG */}
        <button
          onClick={onExportSVG}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm transition-all ${
            isLight
              ? 'bg-slate-900 hover:bg-slate-800 text-white'
              : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
          }`}
          title="Export 2D Drawing as vector SVG"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>
    </header>
  );
};
