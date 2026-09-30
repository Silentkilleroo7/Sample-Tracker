import React, { useState } from 'react';
import { SampleItem, getEffectivePerPcsConsumption, getPriorityTone } from '../types/sample';
import { UserRole } from '../types/auth';
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
  Scissors,
  Ruler,
} from 'lucide-react';

interface WashSectionViewProps {
  samples: SampleItem[];
  userRole?: UserRole;
  onSelectSample: (sample: SampleItem) => void;
  onAdvanceStage: (sample: SampleItem) => void;
  onUpdateWashDetails?: (sampleId: string, details: any) => void;
}

export const WashSectionView: React.FC<WashSectionViewProps> = ({
  samples,
  userRole = 'merchandiser',
  onSelectSample,
  onAdvanceStage,
}) => {
  const [washSearch, setWashSearch] = useState('');

  // Wash Page strictly shows ONLY styles in Wash Status (stage === 'wash')
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
            <Waves className="w-3.5 h-3.5" />
            Step 3 of 6 • Dedicated Wash Status Page
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Wash Status Styles Only (Move Wash → Finishing)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            This page displays only styles currently in <strong>Wash Status</strong>. Advance completed wash styles to the Finishing page.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="p-3 rounded-xl bg-slate-900/90 border border-cyan-400 text-center min-w-[135px]">
            <span className="text-2xl font-mono font-black text-cyan-400">
              {washSamples.length}
            </span>
            <div className="text-[10px] text-slate-300 uppercase font-bold mt-0.5">
              In Wash Status
            </div>
          </div>
        </div>
      </div>

      {/* Search within Wash */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 bg-slate-900/80 p-3 sm:p-3.5 rounded-2xl border border-slate-800">
        <div className="relative flex-1 min-w-0 sm:min-w-[240px] sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={washSearch}
            onChange={(e) => setWashSearch(e.target.value)}
            placeholder="Search Wash Status styles by Style, Recipe, Wash Tech, Buyer..."
            className="w-full min-h-[42px] bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
        <div className="text-xs font-semibold text-slate-500">
          Showing {filtered.length} of {washSamples.length} Wash Status style{washSamples.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Grid of Styles currently in Wash */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((sample) => {
            const wash = sample.washDetails;
            const pTone = getPriorityTone(sample.priority);

            return (
              <div
                key={sample.id}
                className={`p-5 rounded-2xl border transition-all shadow-xl flex flex-col justify-between ${pTone.cardClass}`}
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
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border ${pTone.badgeClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${pTone.dotClass}`}></span>
                            <span>{pTone.label}</span>
                          </span>
                          <SampleTypeBadge sampleType={sample.sampleType} size="xs" />
                          <span className="text-xs text-slate-300 font-medium">
                            PO: {sample.poNumber} • Line: {sample.lineCode}
                          </span>
                        </div>
                        <h3
                          onClick={() => onSelectSample(sample)}
                          className="text-sm font-bold text-white mt-1.5 hover:text-cyan-300 transition-colors cursor-pointer"
                        >
                          {sample.styleName}
                        </h3>
                        <p className="text-xs text-slate-300 mt-0.5">
                          Buyer: <strong className="text-white">{sample.buyer}</strong> • Color: {sample.color} • Size: <strong className="text-white font-mono">{sample.size}</strong> • Qty: <strong className="text-emerald-300 font-mono">{sample.quantity} Pcs</strong>
                        </p>
                        <div className="mt-1 inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-400">
                          <Ruler className="w-3 h-3" />
                          <span>Per-Pcs Cons: {getEffectivePerPcsConsumption(sample)} yds/pc • Deducted: {sample.fabricRequiredYards} yds ({sample.quantity} pcs)</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {sample.stage === 'sewing' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                          <Scissors className="w-3.5 h-3.5" />
                          In Sewing
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                          <Waves className="w-3.5 h-3.5 animate-bounce" />
                          In Wash
                        </span>
                      )}
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

                {/* Footer with Move to Wash or Move to Finishing button */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    Target Parcel: {sample.targetParcelDate}
                  </div>

                  {sample.stage === 'sewing' ? (
                    <button
                      onClick={() => onAdvanceStage(sample)}
                      className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
                    >
                      <Waves className="w-4 h-4 shrink-0" />
                      <span>Move Sewing → Wash Status</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onAdvanceStage(sample)}
                      className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/30 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 shrink-0" />
                      <span>Complete Wash → Move to Finishing</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>
                  )}
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
