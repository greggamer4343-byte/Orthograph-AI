import React from 'react';
import { TitleBlockInfo, SheetSize } from '../types/engineering';
import { X, FileText, Check, Trash2, User } from 'lucide-react';

interface TitleBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  titleBlock: TitleBlockInfo;
  onUpdateTitleBlock: (updated: TitleBlockInfo) => void;
  sheetSize: SheetSize;
  onUpdateSheetSize: (size: SheetSize) => void;
}

export const TitleBlockModal: React.FC<TitleBlockModalProps> = ({
  isOpen,
  onClose,
  titleBlock,
  onUpdateTitleBlock,
  sheetSize,
  onUpdateSheetSize,
}) => {
  if (!isOpen) return null;

  const handleChange = (field: keyof TitleBlockInfo, val: any) => {
    onUpdateTitleBlock({
      ...titleBlock,
      [field]: val,
    });
  };

  const handleClearPersonalFields = () => {
    onUpdateTitleBlock({
      ...titleBlock,
      studentName: '',
      rollNumber: '',
      institution: '',
      includePersonalInfo: false,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/40">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-sans">
                Drawing Sheet &amp; Title Block Settings
              </h2>
              <p className="text-[11px] text-slate-400">
                Configure technical parameters and optionally include or clear personal details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Sheet Size Selection */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Standard Sheet Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onUpdateSheetSize('A3')}
                className={`p-3 rounded-xl border flex flex-col items-start gap-1 transition-all ${
                  sheetSize === 'A3'
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300 font-semibold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-sm">ISO A3</span>
                  {sheetSize === 'A3' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <span className="text-[10px] text-slate-400">420 × 297 mm (Standard Board)</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSheetSize('A4')}
                className={`p-3 rounded-xl border flex flex-col items-start gap-1 transition-all ${
                  sheetSize === 'A4'
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300 font-semibold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-sm">ISO A4</span>
                  {sheetSize === 'A4' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <span className="text-[10px] text-slate-400">297 × 210 mm (Compact)</span>
              </button>
            </div>
          </div>

          {/* Technical Parameter: Drawing Title */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Drawing Title
            </label>
            <input
              type="text"
              value={titleBlock.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g. PROJECTIONS OF STRAIGHT LINES (LINE AB)"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 uppercase font-mono"
            />
          </div>

          {/* Technical Parameters: Scale, Projection Method & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Drawing Scale
              </label>
              <select
                value={titleBlock.scale}
                onChange={(e) => handleChange('scale', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value="1:1">1:1 (Full Size)</option>
                <option value="1:2">1:2 (Half Scale)</option>
                <option value="2:1">2:1 (Enlarged)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Projection Method
              </label>
              <select
                value={titleBlock.projectionMethod}
                onChange={(e) => handleChange('projectionMethod', e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="1st Angle">1st Angle (ISO/BIS)</option>
                <option value="3rd Angle">3rd Angle (ASME)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Date
              </label>
              <input
                type="text"
                value={titleBlock.date}
                onChange={(e) => handleChange('date', e.target.value)}
                placeholder="e.g. 2026-10-02"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          {/* Personal Fields Section with Clear Action */}
          <div className="border border-slate-800 rounded-xl p-3.5 bg-slate-950/70 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-semibold text-slate-200">
                  Personal Details (Name, Roll No, Institution)
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Clear All Personal Fields button */}
                <button
                  type="button"
                  onClick={handleClearPersonalFields}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-rose-400 hover:text-rose-300 bg-rose-950/30 hover:bg-rose-950/60 border border-rose-800/50 transition-colors flex items-center gap-1.5"
                  title="Clear all personal fields (Name, Roll Number, Institution) from the title block and drawing export"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear Personal Fields</span>
                </button>

                {/* Include Toggle */}
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(titleBlock.includePersonalInfo)}
                    onChange={(e) => handleChange('includePersonalInfo', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 w-3.5 h-3.5"
                  />
                  <span>Show in Export</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1 text-[11px]">
                  Student Name / Draftsperson
                </label>
                <input
                  type="text"
                  value={titleBlock.studentName || ''}
                  onChange={(e) => {
                    handleChange('studentName', e.target.value);
                    if (e.target.value && !titleBlock.includePersonalInfo) {
                      handleChange('includePersonalInfo', true);
                    }
                  }}
                  placeholder="Leave blank or enter name"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-sans text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1 text-[11px]">
                  Roll Number / Student ID
                </label>
                <input
                  type="text"
                  value={titleBlock.rollNumber || ''}
                  onChange={(e) => {
                    handleChange('rollNumber', e.target.value);
                    if (e.target.value && !titleBlock.includePersonalInfo) {
                      handleChange('includePersonalInfo', true);
                    }
                  }}
                  placeholder="Leave blank or enter roll no"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1 text-[11px]">
                College / Institution / Department
              </label>
              <input
                type="text"
                value={titleBlock.institution || ''}
                onChange={(e) => {
                  handleChange('institution', e.target.value);
                  if (e.target.value && !titleBlock.includePersonalInfo) {
                    handleChange('includePersonalInfo', true);
                  }
                }}
                placeholder="Leave blank or enter department"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 text-xs"
              />
            </div>

            <div className="text-[10px] text-slate-500">
              When cleared or unchecked, the drawing sheet and SVG export will strictly display technical parameters (Scale, Projection Method, etc.) without any personal identifiers.
            </div>
          </div>

          {/* Official Projection Symbol Preview */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-slate-300 font-semibold text-[11px]">
                Official Projection Symbol
              </div>
              <div className="text-[10px] text-slate-400">
                Stamped directly into title block ({titleBlock.projectionMethod})
              </div>
            </div>
            {/* SVG Frustum Symbol */}
            <svg width="60" height="24" viewBox="0 0 60 24" className="text-cyan-400 stroke-current fill-none">
              <polygon points="4,6 18,2 18,22 4,18" strokeWidth="1.2" />
              <line x1="1" y1="12" x2="58" y2="12" strokeDasharray="3,2" strokeWidth="0.8" />
              <circle cx="34" cy="12" r="5" strokeWidth="1.2" />
              <circle cx="34" cy="12" r="9" strokeWidth="1.2" />
            </svg>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-lg shadow-cyan-500/20"
          >
            Apply to Sheet
          </button>
        </div>
      </div>
    </div>
  );
};
