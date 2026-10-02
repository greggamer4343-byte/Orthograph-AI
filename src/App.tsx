/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { TopNav } from './components/TopNav';
import { SidebarLeft } from './components/SidebarLeft';
import { SidebarRight } from './components/SidebarRight';
import { OrthographicCanvas2D } from './components/OrthographicCanvas2D';
import { SpatialView3D } from './components/SpatialView3D';
import { FormulaReferencePanel } from './components/FormulaReferencePanel';
import { StepWalkthroughList } from './components/StepWalkthroughList';
import { ConceptualModal } from './components/ConceptualModal';
import { TitleBlockModal } from './components/TitleBlockModal';
import { FocusedInputModal } from './components/FocusedInputModal';
import { GeminiChatbotModal } from './components/GeminiChatbotModal';
import { PlottingEngineModal } from './components/PlottingEngineModal';
import {
  solveLineProjection,
  parseNaturalLanguageText,
  validateProblemGeometry,
  detectAmbiguities,
  PRESET_PROBLEMS,
} from './utils/engineeringGeometry';
import {
  SolvedProblemBlueprint,
  DrawingTool,
  SolutionStep,
  ParsedParameters,
  UnitPreference,
  SheetSize,
  TitleBlockInfo,
  ThemeMode,
  ExportStyle,
} from './types/engineering';
import { Sparkles, AlertTriangle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'2d' | '3d' | 'walkthrough' | 'formulas'>('2d');
  const [theme, setTheme] = useState<ThemeMode>('blueprint'); // 'blueprint' (Dark) or 'draftboard' (Light)
  const [unit, setUnit] = useState<UnitPreference>('mm');
  const [sheetSize, setSheetSize] = useState<SheetSize>('A3');
  const [exportStyle, setExportStyle] = useState<ExportStyle>('clean_vector');

  // Title Block info (defaults to pure technical parameters; personal fields optional)
  const [titleBlock, setTitleBlock] = useState<TitleBlockInfo>({
    studentName: '',
    rollNumber: '',
    institution: '',
    includePersonalInfo: false,
    title: 'PROJECTIONS OF STRAIGHT LINES (LINE AB)',
    scale: '1:1',
    projectionMethod: '1st Angle',
    date: new Date().toISOString().split('T')[0],
    sheetNo: '01',
  });

  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [blueprint, setBlueprint] = useState<SolvedProblemBlueprint>(() =>
    solveLineProjection(PRESET_PROBLEMS[0].params, 'mm')
  );
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [activeTool, setActiveTool] = useState<DrawingTool>('Draw Line');
  const [showAnnotations, setShowAnnotations] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [aiPowered, setAiPowered] = useState<boolean>(false);
  const [explainerStep, setExplainerStep] = useState<SolutionStep | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Modals & Panels
  const [isPasteModalOpen, setIsPasteModalOpen] = useState<boolean>(false);
  const [isTitleBlockModalOpen, setIsTitleBlockModalOpen] = useState<boolean>(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState<boolean>(false);
  const [isPlottingEngineModalOpen, setIsPlottingEngineModalOpen] = useState<boolean>(false);
  const [challengeModeEnabled, setChallengeModeEnabled] = useState<boolean>(false);
  const [isPhysicalDrawing, setIsPhysicalDrawing] = useState<boolean>(false);

  // Collapsible Three-Pane Sidebar States
  const [isLeftCollapsed, setIsLeftCollapsed] = useState<boolean>(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState<boolean>(false);

  // Sync activeTool with the step's recommended tool when step changes
  useEffect(() => {
    const step = blueprint.step_by_step_solution[currentStepIndex];
    if (step) {
      setActiveTool(step.tool_to_activate);
    }
  }, [currentStepIndex, blueprint]);

  const showNotification = (msg: string) => {
    setNotice(msg);
    setTimeout(() => {
      setNotice(null);
    }, 4000);
  };

  const handleToggleTheme = () => {
    const newTheme: ThemeMode = theme === 'blueprint' ? 'draftboard' : 'blueprint';
    setTheme(newTheme);
    showNotification(`Switched theme to ${newTheme === 'draftboard' ? 'Digital Draftboard (Light)' : 'Modern Blueprint (Dark)'}.`);
  };

  const handleUnitChange = (newUnit: UnitPreference) => {
    setUnit(newUnit);
    const reSolved = solveLineProjection(blueprint.parsed_parameters, newUnit);
    setBlueprint(reSolved);
    showNotification(`Switched global unit preference to ${newUnit === 'inches' ? 'Inches (in)' : 'Millimeters (mm)'}.`);
  };

  const handleSolveQuestion = async (question: string) => {
    setIsLoading(true);
    setCurrentQuestion(question);

    // Immediate Client-Side Geometric Impossibility check
    const localParams = parseNaturalLanguageText(question);
    const impossibility = validateProblemGeometry(localParams);
    if (impossibility) {
      setIsLoading(false);
      setIsPasteModalOpen(true); // Open modal with clear educational explanation!
      showNotification(`Geometric impossibility detected: ${impossibility.title}`);
      return;
    }

    try {
      const res = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_question: question }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      if (data.status === 'impossibility') {
        setIsPasteModalOpen(true);
        showNotification(`Geometric impossibility: ${data.impossibility.title}`);
        return;
      }

      if (data.blueprint) {
        const updated = solveLineProjection(data.blueprint.parsed_parameters, unit);
        setBlueprint(updated);
        setAiPowered(data.aiPowered || false);
        setCurrentStepIndex(0);
        showNotification(
          data.aiPowered
            ? 'Problem parsed with Gemini 3.8 Flash & solved geometrically!'
            : 'Problem solved with analytical projection engine.'
        );
      }
    } catch (err) {
      console.warn('API call failed, falling back to client-side analytical solver:', err);
      const solved = solveLineProjection(localParams, unit);
      setBlueprint(solved);
      setAiPowered(false);
      setCurrentStepIndex(0);
      showNotification('Problem solved with local geometric solver.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    const preset = PRESET_PROBLEMS[0];
    setCurrentQuestion('');
    setBlueprint(solveLineProjection(preset.params, unit));
    setCurrentStepIndex(0);
    setAiPowered(false);
    showNotification('Reset canvas to standard benchmark problem.');
  };

  const handleExportSVG = useCallback(() => {
    const svgElement = document.querySelector('svg');
    if (!svgElement) return;

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orthographic_projection_${exportStyle === 'hand_drawn' ? 'hand_drawn_' : ''}AB_${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification(`Drafting sheet exported (${exportStyle === 'hand_drawn' ? 'Hand-Drawn Pencil Mode' : 'Clean Vector CAD'}).`);
  }, [exportStyle]);

  const isLight = theme === 'draftboard';

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      isLight ? 'bg-[#f1f5f9] text-slate-800' : 'bg-[#0b0f19] text-slate-100'
    }`}>
      {/* 1. Top Navigation Bar */}
      <TopNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unit={unit}
        onUnitChange={handleUnitChange}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        sheetSize={sheetSize}
        onOpenTitleBlockModal={() => setIsTitleBlockModalOpen(true)}
        onOpenPasteModal={() => setIsPasteModalOpen(true)}
        onOpenChatbot={() => setIsChatbotOpen(true)}
        onOpenPlottingEngineModal={() => setIsPlottingEngineModalOpen(true)}
        onReset={handleReset}
        onExportSVG={handleExportSVG}
      />

      {/* Floating Status Notification */}
      {notice && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-fadeIn pointer-events-none">
          <div className="bg-slate-900/95 text-white border border-cyan-500/50 px-4 py-2 rounded-xl shadow-2xl text-xs font-medium flex items-center gap-2 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>{notice}</span>
          </div>
        </div>
      )}

      {/* 2. Main Three-Pane Application Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Collapsible Drafting Tools & Sheet Setup */}
        <SidebarLeft
          isCollapsed={isLeftCollapsed}
          onToggleCollapse={() => setIsLeftCollapsed(!isLeftCollapsed)}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          showAnnotations={showAnnotations}
          setShowAnnotations={setShowAnnotations}
          sheetSize={sheetSize}
          onOpenTitleBlockModal={() => setIsTitleBlockModalOpen(true)}
          exportStyle={exportStyle}
          onToggleExportStyle={() => {
            const next = exportStyle === 'clean_vector' ? 'hand_drawn' : 'clean_vector';
            setExportStyle(next);
            showNotification(`Export mode: ${next === 'hand_drawn' ? 'Hand-Drawn Pencil Filter' : 'Clean CAD Vector'}`);
          }}
          theme={theme}
        />

        {/* Center Pane: Main Drawing Canvas / Active View */}
        <main className="flex-1 flex flex-col min-w-0 p-3 relative overflow-hidden">
          {activeTab === '2d' && (
            <div className="w-full h-full flex-1 relative min-h-[500px]">
              <OrthographicCanvas2D
                blueprint={blueprint}
                currentStepIndex={currentStepIndex}
                activeTool={activeTool}
                showAnnotations={showAnnotations}
                unit={unit}
                sheetSize={sheetSize}
                titleBlock={titleBlock}
                theme={theme}
                exportStyle={exportStyle}
                onPhysicalAnimationStateChange={setIsPhysicalDrawing}
              />
            </div>
          )}

          {activeTab === '3d' && (
            <div className="w-full h-full flex-1 min-h-[500px] rounded-2xl border border-slate-800 overflow-hidden bg-slate-950">
              <SpatialView3D blueprint={blueprint} unit={unit} />
            </div>
          )}

          {activeTab === 'walkthrough' && (
            <div className="w-full h-full flex-1 overflow-y-auto max-w-4xl mx-auto p-4">
              <StepWalkthroughList
                steps={blueprint.step_by_step_solution}
                currentStepIndex={currentStepIndex}
                onSelectStep={setCurrentStepIndex}
                onOpenExplainer={(step) => setExplainerStep(step)}
              />
            </div>
          )}

          {activeTab === 'formulas' && (
            <div className="w-full h-full flex-1 overflow-y-auto max-w-5xl mx-auto p-4">
              <FormulaReferencePanel blueprint={blueprint} unit={unit} />
            </div>
          )}
        </main>

        {/* Right Pane: Collapsible Playback Controls, Challenge Quiz & Progressive Disclosures */}
        <SidebarRight
          isCollapsed={isRightCollapsed}
          onToggleCollapse={() => setIsRightCollapsed(!isRightCollapsed)}
          blueprint={blueprint}
          currentStepIndex={currentStepIndex}
          onStepChange={setCurrentStepIndex}
          onOpenExplainer={(step) => setExplainerStep(step)}
          theme={theme}
          unit={unit}
          challengeModeEnabled={challengeModeEnabled}
          onToggleChallengeMode={() => {
            const next = !challengeModeEnabled;
            setChallengeModeEnabled(next);
            showNotification(next ? 'Challenge Mode ON: Construction will pause at key milestones to test your knowledge!' : 'Challenge Mode OFF.');
          }}
          isPhysicalDrawing={isPhysicalDrawing}
        />
      </div>

      {/* 3. Focused Text Input Modal (Distraction-free question input & error handling) */}
      <FocusedInputModal
        isOpen={isPasteModalOpen}
        onClose={() => setIsPasteModalOpen(false)}
        onSolveQuestion={handleSolveQuestion}
        isLoading={isLoading}
        initialQuestion={currentQuestion}
        theme={theme}
      />

      {/* 4. Title Block & Sheet Customization Modal */}
      <TitleBlockModal
        isOpen={isTitleBlockModalOpen}
        onClose={() => setIsTitleBlockModalOpen(false)}
        titleBlock={titleBlock}
        onUpdateTitleBlock={(updated) => {
          setTitleBlock(updated);
          const hasPersonal = Boolean(updated.includePersonalInfo && (updated.studentName || updated.rollNumber || updated.institution));
          showNotification(
            hasPersonal
              ? 'Title block updated with student details.'
              : 'Title block set to technical parameters only (personal fields cleared).'
          );
        }}
        sheetSize={sheetSize}
        onUpdateSheetSize={(size) => {
          setSheetSize(size);
          showNotification(`Sheet size set to ISO ${size}.`);
        }}
      />

      {/* 5. Conceptual Explainer Popup */}
      <ConceptualModal
        step={explainerStep}
        onClose={() => setExplainerStep(null)}
      />

      {/* 6. Multi-turn Gemini Chatbot Modal: OrthographAI Tutor */}
      <GeminiChatbotModal
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        blueprint={blueprint}
      />

      {/* 7. Plotting Engine & 4-Quadrant JSON Modal */}
      <PlottingEngineModal
        isOpen={isPlottingEngineModalOpen}
        onClose={() => setIsPlottingEngineModalOpen(false)}
        blueprint={blueprint}
        onSelectPreset={(params) => {
          const solved = solveLineProjection(params, unit);
          setBlueprint(solved);
          setCurrentStepIndex(0);
          showNotification(`Loaded ${params.quadrant || 'First (I)'} quadrant configuration into canvas.`);
        }}
      />

      {/* Floating AI Tutor Quick Button (Bottom Left) */}
      <button
        onClick={() => setIsChatbotOpen(true)}
        className="fixed bottom-5 left-5 z-40 p-2.5 sm:px-3.5 sm:py-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-2xl shadow-purple-600/40 border border-purple-400/40 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 group"
        title="Open OrthographAI Tutor"
      >
        <Sparkles className="w-4 h-4 fill-current text-purple-200 group-hover:rotate-12 transition-transform" />
        <span className="hidden sm:inline">Ask AI Tutor</span>
      </button>

      {/* 6. Subtle Technical Footer */}
      <footer className={`py-2 px-6 border-t text-center text-[11px] transition-colors ${
        isLight ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-slate-950/80 border-slate-900 text-slate-500'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 font-mono">
          <span>OrthographAI · Interactive Engineering Graphics Problem Solver</span>
          <div className="flex items-center gap-3">
            <span>First Angle Projection</span>
            <span aria-hidden="true">·</span>
            <span>Rotation Method</span>
            <span aria-hidden="true">·</span>
            <span>True Length Invariant</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
