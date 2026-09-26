import React, { useState } from 'react';
import { SampleItem } from '../types/sample';
import { ProgressBar } from './ProgressBar';
import { StyleProductImage } from './StyleProductImage';
import {
  Sparkles,
  PackageCheck,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Search,
  Square,
} from 'lucide-react';

interface FinishingSectionViewProps {
  samples: SampleItem[];
  onSelectSample: (sample: SampleItem) => void;
  onAdvanceStage: (sample: SampleItem) => void;
  onToggleChecklistItem?: (sampleId: string, itemKey: 'ironingDone' | 'threadTrimmingDone' | 'taggingDone' | 'qualityPassed') => void;
}

export const FinishingSectionView: React.FC<FinishingSectionViewProps> = ({
  samples,
  onSelectSample,
  onAdvanceStage,
  onToggleChecklistItem,
}) => {
  const [finishingSearch, setFinishingSearch] = useState('');

  // All styles where wash has completed and currently in finishing
  const finishingSamples = samples.filter((s) => s.stage === 'finishing');

  const filtered = finishingSamples.filter((s) => {
    if (!finishingSearch.trim()) return true;
    const q = finishingSearch.toLowerCase();
    return (
      s.styleCode.toLowerCase().includes(q) ||
      s.styleName.toLowerCase().includes(q) ||
      s.poNumber.toLowerCase().includes(q) ||
      s.buyer.toLowerCase().includes(q) ||
      s.finishingDetails.supervisor.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-900 border border-amber-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
            Post-Wash Finishing, Trimming & Quality Audit
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Finishing Status (Post-Wash Completed)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Styles that have completed wet wash treatment and are now in final finishing: thread suction, steam form pressing, brand tagging, and 100% measurement inspection.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-900/90 rounded-xl border border-amber-500/30 text-center min-w-[120px]">
            <span className="text-2xl font-mono font-black text-amber-400">
              {finishingSamples.length}
            </span>
            <div className="text-[11px] text-slate-400 uppercase font-semibold">
              In Finishing
            </div>
          </div>
        </div>
      </div>

      {/* Search within Finishing */}
      <div className="flex items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={finishingSearch}
            onChange={(e) => setFinishingSearch(e.target.value)}
            placeholder="Search Finishing by Style, Buyer, Supervisor, Line..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <span className="text-xs text-slate-400">
          Step 4 of 6 in Pipeline
        </span>
      </div>

      {/* Grid of Styles in Finishing */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((sample) => {
            const fin = sample.finishingDetails;

            return (
              <div
                key={sample.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 transition-all shadow-xl flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
                    <div className="flex items-start gap-3 min-w-0">
                      <StyleProductImage sample={sample} size="md" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-black text-xs text-amber-300 px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/30">
                            {sample.styleCode}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            PO: {sample.poNumber} • Line: {sample.lineCode}
                          </span>
                        </div>
                        <h3
                          onClick={() => onSelectSample(sample)}
                          className="text-sm font-bold text-white mt-1.5 hover:text-amber-300 transition-colors cursor-pointer"
                        >
                          {sample.styleName}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Buyer: <strong className="text-slate-200">{sample.buyer}</strong> • Size: {sample.size} • Fabric: {sample.fabricCode}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        <Sparkles className="w-3.5 h-3.5" />
                        In Finishing
                      </span>
                    </div>
                  </div>

                  {/* Finishing Checklists */}
                  <div className="mt-4 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-slate-300">
                        Quality & Trimming Checkpoints
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Supervisor: {fin.supervisor || 'Sunil Das'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* Thread Trimming */}
                      <button
                        onClick={() => onToggleChecklistItem?.(sample.id, 'threadTrimmingDone')}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                          fin.threadTrimmingDone
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        {fin.threadTrimmingDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                        <span className="truncate">Thread Trimming</span>
                      </button>

                      {/* Ironing & Pressing */}
                      <button
                        onClick={() => onToggleChecklistItem?.(sample.id, 'ironingDone')}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                          fin.ironingDone
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        {fin.ironingDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                        <span className="truncate">Steam Pressing</span>
                      </button>

                      {/* Tagging */}
                      <button
                        onClick={() => onToggleChecklistItem?.(sample.id, 'taggingDone')}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                          fin.taggingDone
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        {fin.taggingDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                        <span className="truncate">Hangtag & Barcode</span>
                      </button>

                      {/* Final QA */}
                      <button
                        onClick={() => onToggleChecklistItem?.(sample.id, 'qualityPassed')}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                          fin.qualityPassed
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        {fin.qualityPassed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                        <span className="truncate">100% QA Audit Passed</span>
                      </button>
                    </div>

                    {fin.notes && (
                      <div className="mt-2.5 pt-2 border-t border-slate-700/60 text-[11px] text-slate-400">
                        <strong className="text-slate-300">Supervisor Remarks:</strong> {fin.notes}
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <ProgressBar currentStage={sample.stage} size="compact" />
                  </div>
                </div>

                {/* Footer with Move to Ready for Parcel */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    Target Parcel: {sample.targetParcelDate}
                  </div>

                  <button
                    onClick={() => onAdvanceStage(sample)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <PackageCheck className="w-3.5 h-3.5" />
                    <span>Complete Finishing → Ready for Parcel</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
          <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-300">
            No styles currently in Finishing
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            When a style completes wet treatment under Wash Status, it will immediately move here for ironing, trimming, and labeling!
          </p>
        </div>
      )}
    </div>
  );
};
