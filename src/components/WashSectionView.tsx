import React, { useState } from 'react';
import { SampleItem } from '../types/sample';
import { ProgressBar } from './ProgressBar';
import { StyleProductImage } from './StyleProductImage';
import { SampleTypeBadge } from './SampleTypeBadge';
import {
  Waves,
  Sparkles,
  ArrowRight,
  FlaskConical,
  UserCheck,
  Calendar,
  FileText,
  Search,
} from 'lucide-react';

interface WashSectionViewProps {
  samples: SampleItem[];
  onSelectSample: (sample: SampleItem) => void;
  onAdvanceStage: (sample: SampleItem) => void;
  onUpdateWashDetails?: (sampleId: string, details: any) => void;
}

export const WashSectionView: React.FC<WashSectionViewProps> = ({
  samples,
  onSelectSample,
  onAdvanceStage,
}) => {
  const [washSearch, setWashSearch] = useState('');

  // All styles currently in wash
  const washSamples = samples.filter((s) => s.stage === 'wash');

  const filtered = washSamples.filter((s) => {
    if (!washSearch.trim()) return true;
    const q = washSearch.toLowerCase();
    return (
      s.styleCode.toLowerCase().includes(q) ||
      s.styleName.toLowerCase().includes(q) ||
      s.poNumber.toLowerCase().includes(q) ||
      s.buyer.toLowerCase().includes(q) ||
      s.washDetails.washType.toLowerCase().includes(q) ||
      s.washDetails.washTechnician.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-slate-900 to-slate-900 border border-cyan-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-2">
            <Waves className="w-3.5 h-3.5 animate-pulse" />
            Washing Plant & Wet Processing Plant
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Wash Status Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Showing all styles currently in wet treatment. Completing wash treatment immediately advances the garment to the Finishing Section.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-900/90 rounded-xl border border-cyan-500/30 text-center min-w-[120px]">
            <span className="text-2xl font-mono font-black text-cyan-400">
              {washSamples.length}
            </span>
            <div className="text-[11px] text-slate-400 uppercase font-semibold">
              Styles in Wash
            </div>
          </div>
        </div>
      </div>

      {/* Search within Wash */}
      <div className="flex items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={washSearch}
            onChange={(e) => setWashSearch(e.target.value)}
            placeholder="Search in Wash by Style, Recipe, Wash Tech, Buyer..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
        <span className="text-xs text-slate-400">
          Step 3 of 6 in Pipeline
        </span>
      </div>

      {/* Grid of Styles currently in Wash */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((sample) => {
            const wash = sample.washDetails;

            return (
              <div
                key={sample.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 transition-all shadow-xl flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
                    <div className="flex items-start gap-3 min-w-0">
                      <StyleProductImage sample={sample} size="md" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-black text-xs text-cyan-300 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30">
                            {sample.styleCode}
                          </span>
                          <SampleTypeBadge sampleType={sample.sampleType} size="xs" />
                          <span className="text-xs text-slate-400 font-medium">
                            PO: {sample.poNumber} • Line: {sample.lineCode}
                          </span>
                          {sample.priority === 'urgent' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                              URGENT
                            </span>
                          )}
                        </div>
                        <h3
                          onClick={() => onSelectSample(sample)}
                          className="text-sm font-bold text-white mt-1.5 hover:text-cyan-300 transition-colors cursor-pointer"
                        >
                          {sample.styleName}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Buyer: <strong className="text-slate-200">{sample.buyer}</strong> • Color: {sample.color} • Fabric: {sample.fabricCode}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                        <Waves className="w-3.5 h-3.5 animate-bounce" />
                        In Wash
                      </span>
                    </div>
                  </div>

                  {/* Wash Recipe & Chemical Treatment Card */}
                  <div className="mt-4 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                        <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
                        Wash Recipe:
                      </span>
                      <span className="font-bold text-white text-right">
                        {wash.washType || 'Standard Garment Wash'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                        Wash Technician:
                      </span>
                      <span className="text-slate-200 font-medium">
                        {wash.washTechnician || 'Assigned Technicians'}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <span className="text-slate-400 flex items-center gap-1.5 font-medium shrink-0">
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                        Formula:
                      </span>
                      <span className="text-slate-300 text-right font-mono text-[11px] bg-slate-900/60 px-2 py-1 rounded border border-slate-700">
                        {wash.washFormula || 'Neutral enzyme + softening bath'}
                      </span>
                    </div>

                    {wash.washNotes && (
                      <div className="pt-2 border-t border-slate-700/60 text-[11px] text-slate-400">
                        <strong className="text-slate-300">Notes:</strong> {wash.washNotes}
                      </div>
                    )}
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="mt-4">
                    <ProgressBar currentStage={sample.stage} size="compact" />
                  </div>
                </div>

                {/* Footer with Move to Finishing button */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    Target Parcel: {sample.targetParcelDate}
                  </div>

                  <button
                    onClick={() => onAdvanceStage(sample)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs shadow-lg shadow-amber-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Complete Wash → Move to Finishing</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
          <Waves className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-300">
            No styles currently in Wash
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Styles will appear here once they complete the Sewing stage. You can advance any style from Sewing to Wash in the pipeline.
          </p>
        </div>
      )}
    </div>
  );
};
