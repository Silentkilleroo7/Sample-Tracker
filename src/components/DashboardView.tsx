import React, { useState, useMemo } from 'react';
import {
  Scissors,
  Waves,
  Sparkles,
  PackageCheck,
  MessageSquare,
  AlertOctagon,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Layers,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Plus,
  MessageCircle,
  Phone,
  FileCheck2,
  Bell,
  AlertCircle,
  Search,
  X,
  ScrollText,
  FlaskConical,
  Lock,
  Clock,
  Tag,
  Ruler,
} from 'lucide-react';
import {
  SampleItem,
  STAGE_CONFIG,
  isParcelCompleted,
  ApprovalDetails,
  getEffectiveShipmentDate,
  getDaysUntilShipment,
  getGranularApprovalStatus,
  getEffectiveSizeBreakdown,
  getEffectiveSizeName,
  getEffectiveRequisitionQuantity,
  getEffectivePerPcsConsumption,
  getPriorityTone,
} from '../types/sample';
import { FabricItem, isFabricLowStock } from '../types/fabric';
import { BVTestItem } from '../types/test';
import { ProgressBar } from './ProgressBar';
import { StyleProductImage } from './StyleProductImage';
import { SampleTypeBadge } from './SampleTypeBadge';

interface DashboardViewProps {
  samples: SampleItem[];
  fabrics: FabricItem[];
  tests?: BVTestItem[];
  onNavigateToView: (view: 'all_samples' | 'wash' | 'finishing' | 'approvals' | 'test' | 'fabric_inventory', filter?: any) => void;
  onSelectSample: (sample: SampleItem) => void;
  onAdvanceStage: (sample: SampleItem) => void;
  onNewRequisition: () => void;
  onRestockFabric: (fabric: FabricItem) => void;
  onOpenFollowUp?: (sample: SampleItem) => void;
  onToggleWorkbookSent?: (sampleId: string) => void;
  onSendWhatsApp?: (sample: SampleItem, phone: string, customMessage?: string) => void;
  onUpdateApprovalDetails?: (sampleId: string, details: ApprovalDetails) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  samples,
  fabrics,
  tests = [],
  onNavigateToView,
  onSelectSample,
  onAdvanceStage,
  onNewRequisition,
  onRestockFabric,
  onOpenFollowUp,
  onToggleWorkbookSent,
  onSendWhatsApp,
  onUpdateApprovalDetails,
}) => {
  // Dynamic Summary Controls State
  const [summaryFilter, setSummaryFilter] = useState<
    'all' | 'sewing' | 'wash' | 'finishing' | 'parcel' | 'approvals' | 'fabric' | 'followup'
  >('all');
  const [summarySearch, setSummarySearch] = useState('');
  const [summarySort, setSummarySort] = useState<'shipmentDate' | 'parcelDate' | 'priority' | 'styleCode'>('shipmentDate');
  const [fastApprovalFilter, setFastApprovalFilter] = useState<
    'all' | 'button' | 'thread' | 'wash' | 'trims_accessories'
  >('all');

  // Counts & Filtered lists
  const inSewing = samples.filter((s) => s.stage === 'sewing');
  const inWash = samples.filter((s) => s.stage === 'wash');
  const inFinishing = samples.filter((s) => s.stage === 'finishing');
  const readyToParcel = samples.filter((s) => s.stage === 'ready_for_parcel');
  const commentsPending = samples.filter((s) => s.stage === 'approval_comments');

  // Styles with completed parcel
  const parcelCompletedSamples = samples.filter(isParcelCompleted);
  const pendingWorkbookSamples = parcelCompletedSamples.filter(
    (s) => !s.parcelDetails.workbookSent
  );
  const followUpDueSamples = parcelCompletedSamples.filter(
    (s) => s.parcelDetails.followUp?.status !== 'completed'
  );

  // Low fabric items (availableYards <= 5)
  const lowFabrics = fabrics.filter(isFabricLowStock);

  // Earlier Priority Samples Pending Approval for Trims / Accessories (Button, Thread, Wash, Trims, Accessories)
  // Sorted by earliest Shipment Date first so merchandisers know which sample needs approval fast!
  const allUnapprovedPrioritySamples = useMemo(() => {
    return samples
      .filter((s) => !getGranularApprovalStatus(s).isFullyApproved)
      .sort((a, b) => {
        const shipA = getEffectiveShipmentDate(a) || '9999-12-31';
        const shipB = getEffectiveShipmentDate(b) || '9999-12-31';
        if (shipA !== shipB) return shipA.localeCompare(shipB);
        const pMap: Record<string, number> = { urgent: 3, high: 2, normal: 1 };
        return (pMap[b.priority] || 0) - (pMap[a.priority] || 0);
      });
  }, [samples]);

  const filteredPriorityApprovalSamples = useMemo(() => {
    return allUnapprovedPrioritySamples.filter((s) => {
      const status = getGranularApprovalStatus(s);
      if (fastApprovalFilter === 'button') return !status.buttonApproved;
      if (fastApprovalFilter === 'thread') return !status.threadApproved;
      if (fastApprovalFilter === 'wash') return !status.washApproved;
      if (fastApprovalFilter === 'trims_accessories')
        return !status.trimsApproved || !status.accessoriesApproved;
      return true;
    });
  }, [allUnapprovedPrioritySamples, fastApprovalFilter]);

  const pendingButtonCount = allUnapprovedPrioritySamples.filter(
    (s) => !getGranularApprovalStatus(s).buttonApproved
  ).length;
  const pendingThreadCount = allUnapprovedPrioritySamples.filter(
    (s) => !getGranularApprovalStatus(s).threadApproved
  ).length;
  const pendingWashCount = allUnapprovedPrioritySamples.filter(
    (s) => !getGranularApprovalStatus(s).washApproved
  ).length;
  const pendingTrimsAccCount = allUnapprovedPrioritySamples.filter((s) => {
    const st = getGranularApprovalStatus(s);
    return !st.trimsApproved || !st.accessoriesApproved;
  }).length;

  const handleQuickToggleGranularApproval = (
    sample: SampleItem,
    field: 'washApproved' | 'buttonApproved' | 'threadApproved' | 'trimsApproved' | 'accessoriesApproved'
  ) => {
    if (!onUpdateApprovalDetails) return;
    const currentStatus = getGranularApprovalStatus(sample);
    const nextVal = !currentStatus[field];
    const updatedDetails: ApprovalDetails = {
      ...sample.approvalDetails,
      washApproved: field === 'washApproved' ? nextVal : currentStatus.washApproved,
      buttonApproved: field === 'buttonApproved' ? nextVal : currentStatus.buttonApproved,
      threadApproved: field === 'threadApproved' ? nextVal : currentStatus.threadApproved,
      trimsApproved: field === 'trimsApproved' ? nextVal : currentStatus.trimsApproved,
      accessoriesApproved:
        field === 'accessoriesApproved' ? nextVal : currentStatus.accessoriesApproved,
    };
    const allNowApproved =
      updatedDetails.washApproved &&
      updatedDetails.buttonApproved &&
      updatedDetails.threadApproved &&
      updatedDetails.trimsApproved &&
      updatedDetails.accessoriesApproved;
    if (allNowApproved) {
      updatedDetails.overallVerdict = 'approved';
    } else if (updatedDetails.overallVerdict === 'approved') {
      updatedDetails.overallVerdict = 'pending';
    }
    updatedDetails.reviewedAt = new Date().toISOString();
    onUpdateApprovalDetails(sample.id, updatedDetails);
  };

  // Dynamic Filtered Summary list
  const filteredSummarySamples = useMemo(() => {
    let list = samples;
    if (summaryFilter === 'sewing') list = inSewing;
    else if (summaryFilter === 'wash') list = inWash;
    else if (summaryFilter === 'finishing') list = inFinishing;
    else if (summaryFilter === 'parcel') list = readyToParcel;
    else if (summaryFilter === 'approvals') list = commentsPending;
    else if (summaryFilter === 'followup') list = followUpDueSamples;

    if (summarySearch.trim()) {
      const q = summarySearch.toLowerCase();
      list = list.filter(
        (s) =>
          s.styleCode.toLowerCase().includes(q) ||
          s.styleName.toLowerCase().includes(q) ||
          s.buyer.toLowerCase().includes(q) ||
          s.poNumber.toLowerCase().includes(q) ||
          s.lineCode.toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => {
      if (summarySort === 'shipmentDate') {
        const shipA = getEffectiveShipmentDate(a) || '9999-12-31';
        const shipB = getEffectiveShipmentDate(b) || '9999-12-31';
        return shipA.localeCompare(shipB);
      }
      if (summarySort === 'priority') {
        const pMap: Record<string, number> = { urgent: 4, high: 3, normal: 2, low: 1 };
        return (pMap[b.priority] || 0) - (pMap[a.priority] || 0);
      }
      if (summarySort === 'styleCode') {
        return a.styleCode.localeCompare(b.styleCode);
      }
      const dateA = a.parcelDetails.parcelDate || a.targetParcelDate || '';
      const dateB = b.parcelDetails.parcelDate || b.targetParcelDate || '';
      return dateA.localeCompare(dateB);
    });
  }, [samples, inSewing, inWash, inFinishing, readyToParcel, commentsPending, followUpDueSamples, summaryFilter, summarySearch, summarySort]);

  return (
    <div className="space-y-6">
      {/* Hero Welcome & Quick Stats */}
      <div className="flex flex-col gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
              Production Control Center • Dynamic Summary View
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Sample Tracking & Merchandising Dashboard
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Real-time pipeline monitoring from Sample Requisition, Sewing, Wash Plant, Finishing to Parcel Dispatch & Buyer Approvals.
            </p>
          </div>
          <div className="flex items-center gap-3 relative z-10 shrink-0">
            <button
              onClick={onNewRequisition}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              New Sample Requisition
            </button>
          </div>
        </div>

        {/* Live Summary KPI Quick-Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-3 border-t border-slate-800/80 relative z-10 text-xs">
          <div
            onClick={() => setSummaryFilter('all')}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              summaryFilter === 'all'
                ? 'bg-indigo-600/30 border border-indigo-500/60 ring-1 ring-indigo-400/40'
                : 'bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/50'
            }`}
          >
            <div className="text-[10px] text-slate-400">Total Styles</div>
            <div className="text-base font-black font-mono text-white">{samples.length}</div>
          </div>

          <div
            onClick={() => setSummaryFilter('sewing')}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              summaryFilter === 'sewing'
                ? 'bg-purple-600/30 border border-purple-500/60 ring-1 ring-purple-400/40'
                : 'bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/50'
            }`}
          >
            <div className="text-[10px] text-purple-300">In Sewing</div>
            <div className="text-base font-black font-mono text-purple-200">{inSewing.length}</div>
          </div>

          <div
            onClick={() => setSummaryFilter('wash')}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              summaryFilter === 'wash'
                ? 'bg-cyan-600/30 border border-cyan-500/60 ring-1 ring-cyan-400/40'
                : 'bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/50'
            }`}
          >
            <div className="text-[10px] text-cyan-300">In Wash</div>
            <div className="text-base font-black font-mono text-cyan-200">{inWash.length}</div>
          </div>

          <div
            onClick={() => setSummaryFilter('finishing')}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              summaryFilter === 'finishing'
                ? 'bg-amber-600/30 border border-amber-500/60 ring-1 ring-amber-400/40'
                : 'bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/50'
            }`}
          >
            <div className="text-[10px] text-amber-300">In Finishing</div>
            <div className="text-base font-black font-mono text-amber-200">{inFinishing.length}</div>
          </div>

          <div
            onClick={() => setSummaryFilter('parcel')}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              summaryFilter === 'parcel'
                ? 'bg-emerald-600/30 border border-emerald-500/60 ring-1 ring-emerald-400/40'
                : 'bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/50'
            }`}
          >
            <div className="text-[10px] text-emerald-300">Ready Parcel</div>
            <div className="text-base font-black font-mono text-emerald-200">{readyToParcel.length}</div>
          </div>

          <div
            onClick={() => setSummaryFilter('approvals')}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              summaryFilter === 'approvals'
                ? 'bg-pink-600/30 border border-pink-500/60 ring-1 ring-pink-400/40'
                : 'bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/50'
            }`}
          >
            <div className="text-[10px] text-pink-300">Comments Pending</div>
            <div className="text-base font-black font-mono text-pink-200">{commentsPending.length}</div>
          </div>

          <div
            onClick={() => setSummaryFilter('fabric')}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              summaryFilter === 'fabric'
                ? 'bg-rose-600/30 border border-rose-500/60 ring-1 ring-rose-400/40'
                : lowFabrics.length > 0
                ? 'bg-rose-950/60 border border-rose-500/50 animate-pulse'
                : 'bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/50'
            }`}
          >
            <div className="text-[10px] text-rose-300">Critical Fabric</div>
            <div className="text-base font-black font-mono text-rose-200">
              {lowFabrics.length} {lowFabrics.length > 0 ? 'Alert!' : 'OK'}
            </div>
          </div>
        </div>

        {/* Subtle decorative glow */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* ============================================================ */}
      {/* 1. EARLIER PRIORITY SAMPLE FAST APPROVAL SUMMARY (BY SHIPMENT DATE) */}
      {/*    Highlights Priority Samples Missing Approval for Button, Thread, Wash, Trims & Accessories */}
      {/* ============================================================ */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-indigo-950/60 border-2 border-amber-500/60 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-amber-500/30">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0 shadow-lg shadow-amber-950/50">
              <Clock className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-mono text-[10px] font-black uppercase tracking-wider">
                  Fast Approval Priority Queue
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono text-[10px] font-bold">
                  {allUnapprovedPrioritySamples.length} Style{allUnapprovedPrioritySamples.length === 1 ? '' : 's'} Pending Trims / Accessories / Wash Approval
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-1">
                Earlier Shipment Priority Samples — Pending Approval Summary (Button, Thread, Wash, Trims &amp; Accessories)
              </h2>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Ranked automatically by earliest <strong>Order Shipment Date</strong> so merchandising teams can fast-track approvals for <strong>Button, Thread, Wash, Trims, and Accessories</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigateToView('approvals')}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Open Approvals Workbench</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Granular Pending Approval Filter Pills (Button, Thread, Wash, Trims & Accessories) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
          <button
            type="button"
            onClick={() => setFastApprovalFilter('all')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              fastApprovalFilter === 'all'
                ? 'bg-amber-500/25 border-amber-400 text-white ring-1 ring-amber-400/40'
                : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="text-[10px] text-amber-300 uppercase font-bold">All Priority Pending</div>
            <div className="text-base font-black font-mono text-white mt-0.5">
              {allUnapprovedPrioritySamples.length} Styles
            </div>
          </button>

          <button
            type="button"
            onClick={() => setFastApprovalFilter('button')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              fastApprovalFilter === 'button'
                ? 'bg-rose-500/25 border-rose-400 text-white ring-1 ring-rose-400/40'
                : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="text-[10px] text-rose-300 uppercase font-bold">Pending Button</div>
            <div className="text-base font-black font-mono text-rose-200 mt-0.5">
              {pendingButtonCount} Unapproved
            </div>
          </button>

          <button
            type="button"
            onClick={() => setFastApprovalFilter('thread')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              fastApprovalFilter === 'thread'
                ? 'bg-purple-500/25 border-purple-400 text-white ring-1 ring-purple-400/40'
                : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="text-[10px] text-purple-300 uppercase font-bold">Pending Thread</div>
            <div className="text-base font-black font-mono text-purple-200 mt-0.5">
              {pendingThreadCount} Unapproved
            </div>
          </button>

          <button
            type="button"
            onClick={() => setFastApprovalFilter('wash')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              fastApprovalFilter === 'wash'
                ? 'bg-cyan-500/25 border-cyan-400 text-white ring-1 ring-cyan-400/40'
                : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="text-[10px] text-cyan-300 uppercase font-bold">Pending Wash</div>
            <div className="text-base font-black font-mono text-cyan-200 mt-0.5">
              {pendingWashCount} Unapproved
            </div>
          </button>

          <button
            type="button"
            onClick={() => setFastApprovalFilter('trims_accessories')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              fastApprovalFilter === 'trims_accessories'
                ? 'bg-pink-500/25 border-pink-400 text-white ring-1 ring-pink-400/40'
                : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="text-[10px] text-pink-300 uppercase font-bold">Trims &amp; Accessories</div>
            <div className="text-base font-black font-mono text-pink-200 mt-0.5">
              {pendingTrimsAccCount} Unapproved
            </div>
          </button>
        </div>

        {/* Ranked Priority Sample List */}
        {filteredPriorityApprovalSamples.length > 0 ? (
          <div className="space-y-2.5">
            {filteredPriorityApprovalSamples.map((sample, idx) => {
              const shipDate = getEffectiveShipmentDate(sample);
              const daysLeft = getDaysUntilShipment(sample);
              const status = getGranularApprovalStatus(sample);
              const isUrgentShip = daysLeft !== null && daysLeft <= 14;
              const pTone = getPriorityTone(sample.priority);
              const sizeRun = getEffectiveSizeBreakdown(sample);
              const sizeName = getEffectiveSizeName(sample);
              const totalReqQty = getEffectiveRequisitionQuantity(sample);

              return (
                <div
                  key={sample.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${
                    pTone.cardClass
                  } ${idx === 0 ? 'ring-1 ring-amber-400/50' : ''}`}
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="flex flex-col items-center justify-center px-2 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-black text-xs shrink-0">
                      <span>#{idx + 1}</span>
                      <span className="text-[8px] uppercase">Priority</span>
                    </div>
                    <StyleProductImage sample={sample} size="sm" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          onClick={() => onSelectSample(sample)}
                          className="font-mono font-black text-xs text-indigo-300 px-2 py-0.5 rounded bg-indigo-950 border border-indigo-500/40 cursor-pointer hover:bg-indigo-900"
                        >
                          {sample.styleCode}
                        </span>
                        <span
                          onClick={() => onSelectSample(sample)}
                          className="font-bold text-white text-xs sm:text-sm hover:text-amber-300 cursor-pointer truncate"
                        >
                          {sample.styleName}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] ${pTone.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${pTone.dotClass}`}></span>
                          <span>{pTone.label}</span>
                        </span>
                        <SampleTypeBadge sampleType={sample.sampleType} size="xs" />
                        {sample.isRequisitionLocked && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5 text-amber-400" />
                            Req Locked
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            STAGE_CONFIG[sample.stage].badgeBg
                          }`}
                        >
                          {STAGE_CONFIG[sample.stage].shortLabel}
                        </span>
                      </div>

                      {/* Prominent Size Name & Total Requisition Quantity Callout */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/90 border border-indigo-400/50 shadow-sm">
                          <Tag className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                          <span className="text-[10px] uppercase tracking-wider text-indigo-300 font-bold">
                            Size Name:
                          </span>
                          <span className="font-mono text-xs font-black text-white">
                            {sizeName}
                          </span>
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/90 border border-emerald-400/50 shadow-sm">
                          <span className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold">
                            Total Requisition Qty:
                          </span>
                          <span className="font-mono text-xs font-black text-emerald-200">
                            {totalReqQty} Pcs
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-slate-300">
                        <span>
                          Buyer: <strong className="text-white">{sample.buyer}</strong>
                        </span>
                        <span>•</span>
                        <span className="font-mono text-amber-300 font-bold flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-amber-400" />
                          Shipment Date: {shipDate || 'Not Set'}
                        </span>
                        {daysLeft !== null && (
                          <span
                            className={`px-2 py-0.2 rounded font-mono text-[10px] font-bold border ${
                              daysLeft < 0
                                ? 'bg-rose-600 text-white border-rose-400 animate-pulse'
                                : isUrgentShip
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {daysLeft < 0
                              ? `OVERDUE BY ${Math.abs(daysLeft)}D • FAST APPROVAL!`
                              : daysLeft === 0
                              ? 'SHIPS TODAY • FAST APPROVAL!'
                              : `${daysLeft}d to Shipment${isUrgentShip ? ' • FAST APPROVAL' : ''}`}
                          </span>
                        )}
                      </div>

                      {sizeRun.length > 1 && (
                        <div className="flex flex-wrap items-center gap-1 mt-1.5">
                          <span className="text-[10px] text-amber-300 font-mono font-bold">
                            Size Breakdown ({sizeRun.length} sizes):
                          </span>
                          {sizeRun.map((b, bIdx) => (
                            <span
                              key={`${b.size}-${bIdx}`}
                              className="px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-400/40 text-amber-200 font-mono text-[10px] font-bold"
                            >
                              {b.size}: {b.quantity}pc
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Interactive Approval Badges for Button, Thread, Wash, Trims, Accessories */}
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleQuickToggleGranularApproval(sample, 'buttonApproved')}
                      title="Click to toggle Button Approval"
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                        status.buttonApproved
                          ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40'
                          : 'bg-rose-950/80 text-rose-200 border-rose-500/60 hover:bg-rose-900/80'
                      }`}
                    >
                      <span>{status.buttonApproved ? '✅' : '⏳'} Button</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickToggleGranularApproval(sample, 'threadApproved')}
                      title="Click to toggle Thread Approval"
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                        status.threadApproved
                          ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40'
                          : 'bg-rose-950/80 text-rose-200 border-rose-500/60 hover:bg-rose-900/80'
                      }`}
                    >
                      <span>{status.threadApproved ? '✅' : '⏳'} Thread</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickToggleGranularApproval(sample, 'washApproved')}
                      title="Click to toggle Wash Approval"
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                        status.washApproved
                          ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40'
                          : 'bg-rose-950/80 text-rose-200 border-rose-500/60 hover:bg-rose-900/80'
                      }`}
                    >
                      <span>{status.washApproved ? '✅' : '⏳'} Wash</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickToggleGranularApproval(sample, 'trimsApproved')}
                      title="Click to toggle Trims Approval"
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                        status.trimsApproved
                          ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-950/80 text-amber-200 border-amber-500/60 hover:bg-amber-900/80'
                      }`}
                    >
                      <span>{status.trimsApproved ? '✅' : '⏳'} Trims</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickToggleGranularApproval(sample, 'accessoriesApproved')}
                      title="Click to toggle Accessories Approval"
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                        status.accessoriesApproved
                          ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-950/80 text-amber-200 border-amber-500/60 hover:bg-amber-900/80'
                      }`}
                    >
                      <span>{status.accessoriesApproved ? '✅' : '⏳'} Accessories</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>
                {samples.length === 0
                  ? 'No styles registered yet. Create a New Sample Requisition with a Shipment Date to track Earlier Priority Samples needing Button, Thread, Wash, Trims & Accessories approval.'
                  : 'All earlier priority samples in this filter have received approval for Button, Thread, Wash, Trims & Accessories!'}
              </span>
            </div>
            {samples.length === 0 && (
              <button
                type="button"
                onClick={onNewRequisition}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shrink-0 cursor-pointer"
              >
                + Create First Style with Shipment Date
              </button>
            )}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 1B. CRITICAL DASHBOARD REPORT OPTION: RED ALERT FOR FABRIC <= 5 YDS */}
      {/* ============================================================ */}
      {lowFabrics.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-950/90 via-red-950/70 to-rose-950/90 border-2 border-rose-500/80 shadow-2xl shadow-rose-950/60 ring-2 ring-rose-500/30 animate-pulse-slow">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-500/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-600/50 animate-bounce">
                <AlertOctagon className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-white tracking-wide uppercase flex items-center gap-2">
                    Critical Fabric Inventory Alert! (5 Yds or Less Remaining)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-mono text-xs font-bold">
                    {lowFabrics.length} Code{lowFabrics.length > 1 ? 's' : ''} Affected
                  </span>
                </div>
                <p className="text-xs text-rose-200 mt-0.5">
                  Production line stoppage risk! The following fabrics have reached the critical cutoff of 5 yds or less. Linked styles are flagged in RED.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateToView('fabric_inventory')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-rose-950 hover:bg-rose-100 font-bold text-xs shadow-md transition-all shrink-0 cursor-pointer"
            >
              Manage Inventory
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Cards for each low fabric with Code, Style, and Remaining yards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-4">
            {lowFabrics.map((fabric) => {
              // Find matching samples linked with this fabric
              const linkedSamples = samples.filter((s) => s.fabricId === fabric.id || fabric.linkedStyleCodes.includes(s.styleCode));
              return (
                <div
                  key={fabric.id}
                  className="p-3.5 rounded-xl bg-black/40 border border-rose-500/50 backdrop-blur-md flex flex-col justify-between hover:border-rose-400 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono font-black text-rose-300 text-xs px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/40">
                        {fabric.code}
                      </span>
                      <span className="text-xs font-bold font-mono text-white bg-rose-600 px-2.5 py-0.5 rounded-full shadow">
                        {fabric.availableYards.toFixed(1)} yds left!
                      </span>
                    </div>
                    <h4 className="font-bold text-white text-xs leading-snug">
                      {fabric.name}
                    </h4>
                    <div className="mt-2 text-[11px] text-rose-200/90 space-y-1">
                      <div>
                        <span className="text-rose-300/80">Linked Styles: </span>
                        <span className="font-mono font-bold text-rose-100">
                          {fabric.linkedStyleCodes.join(', ') || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-rose-300/80">Supplier / Bin: </span>
                        <span className="text-rose-100 font-medium">
                          {fabric.supplier} • {fabric.location}
                        </span>
                      </div>
                    </div>

                    {/* Associated styles in production */}
                    {linkedSamples.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-rose-500/30">
                        <span className="text-[10px] text-rose-300 uppercase tracking-wider font-semibold block mb-1">
                          Active In Pipeline:
                        </span>
                        <div className="space-y-1">
                          {linkedSamples.map((ls) => {
                            const lsSizeName = getEffectiveSizeName(ls);
                            const lsTotalQty = getEffectiveRequisitionQuantity(ls);
                            return (
                              <div
                                key={ls.id}
                                onClick={() => onSelectSample(ls)}
                                className="flex flex-col gap-1 text-[11px] p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/40 border border-rose-500/20 cursor-pointer transition-colors"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <StyleProductImage sample={ls} size="xs" showBadge={false} />
                                    <span className="font-mono font-bold text-white truncate max-w-[140px]">
                                      {ls.styleCode} - {ls.styleName}
                                    </span>
                                  </div>
                                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-rose-900/80 text-rose-200 shrink-0">
                                    {STAGE_CONFIG[ls.stage].shortLabel}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-2 text-[10px] font-mono pt-1 border-t border-rose-500/20">
                                  <span className="text-indigo-200 font-bold">
                                    Size Name: <strong className="text-white">{lsSizeName}</strong>
                                  </span>
                                  <span className="text-emerald-300 font-black">
                                    Total Qty: {lsTotalQty} Pcs
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2 flex items-center justify-end gap-2">
                    <button
                      onClick={() => onRestockFabric(fabric)}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold shadow transition-all cursor-pointer"
                    >
                      + Reorder / Receive Yards
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. SUMMARY METRIC CARDS (In Sewing, In Wash, Ready to Parcel, Comments Pending) */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: In Sewing */}
        <div
          onClick={() => setSummaryFilter(summaryFilter === 'sewing' ? 'all' : 'sewing')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
            summaryFilter === 'sewing'
              ? 'bg-purple-950/40 border-purple-500 shadow-xl shadow-purple-950/30 ring-2 ring-purple-400/40'
              : 'bg-slate-900/80 border-slate-800 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-950/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Sewing Status
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Scissors className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono">
              {inSewing.length}
            </span>
            <span className="text-xs text-purple-400 font-medium">Styles in Assembly</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 line-clamp-1">
            Lines active:{' '}
            {Array.from(new Set(inSewing.map((s) => s.lineCode))).join(', ') || 'None'}
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-purple-400 font-medium">
            <span>{summaryFilter === 'sewing' ? 'Showing In Summary' : 'Filter Sewing Summary'}</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 2: In Wash */}
        <div
          onClick={() => setSummaryFilter(summaryFilter === 'wash' ? 'all' : 'wash')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
            summaryFilter === 'wash'
              ? 'bg-cyan-950/40 border-cyan-500 shadow-xl shadow-cyan-950/30 ring-2 ring-cyan-400/40'
              : 'bg-slate-900/80 border-slate-800 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-950/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Wash Status
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Waves className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono">
              {inWash.length}
            </span>
            <span className="text-xs text-cyan-400 font-medium">Styles in Washing</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 line-clamp-1">
            Enzyme, stone, acid & bleach treatments in progress
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-cyan-400 font-medium">
            <span>{summaryFilter === 'wash' ? 'Showing In Summary' : 'Filter Wash Summary'}</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 3: Ready for Parcel */}
        <div
          onClick={() => setSummaryFilter(summaryFilter === 'parcel' ? 'all' : 'parcel')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
            summaryFilter === 'parcel'
              ? 'bg-emerald-950/40 border-emerald-500 shadow-xl shadow-emerald-950/30 ring-2 ring-emerald-400/40'
              : 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-950/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Ready to Parcel
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono">
              {readyToParcel.length}
            </span>
            <span className="text-xs text-emerald-400 font-medium">Styles Ready / Packed</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 line-clamp-1">
            Next parcel date:{' '}
            {readyToParcel[0]?.parcelDetails.parcelDate || 'Scheduled daily'}
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-emerald-400 font-medium">
            <span>{summaryFilter === 'parcel' ? 'Showing In Summary' : 'Filter Parcel Summary'}</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 4: Comments Pending & Approvals */}
        <div
          onClick={() => setSummaryFilter(summaryFilter === 'approvals' ? 'all' : 'approvals')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
            summaryFilter === 'approvals'
              ? 'bg-pink-950/40 border-pink-500 shadow-xl shadow-pink-950/30 ring-2 ring-pink-400/40'
              : 'bg-slate-900/80 border-slate-800 hover:border-pink-500/50 hover:shadow-xl hover:shadow-pink-950/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Comments Pending
            </span>
            <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono">
              {commentsPending.length}
            </span>
            <span className="text-xs text-pink-400 font-medium">Awaiting Buyer Remarks</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 line-clamp-1">
            Wash, Trims & Accessories approval reviews
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-pink-400 font-medium">
            <span>{summaryFilter === 'approvals' ? 'Showing In Summary' : 'Filter Remarks Summary'}</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2.2 DYNAMIC SUMMARY VIEW CONTROL CENTER & LIVE WORKBENCH */}
      {/* ============================================================ */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse"></span>
              <h2 className="text-base font-black text-white tracking-wide uppercase flex items-center gap-2">
                Dynamic Pipeline Summary View
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-mono font-bold">
                {filteredSummarySamples.length} Styles Shown
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Interactive summary tracking across Sewing lines, Wash recipes, Parcel dispatch schedules, and Buyer approval remarks.
            </p>
          </div>

          {/* Quick Search & Sort within Summary */}
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search style, line, PO, buyer..."
                value={summarySearch}
                onChange={(e) => setSummarySearch(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {summarySearch && (
                <button
                  onClick={() => setSummarySearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={summarySort}
              onChange={(e) => setSummarySort(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none"
            >
              <option value="parcelDate">Sort: Parcel Date</option>
              <option value="priority">Sort: Priority</option>
              <option value="styleCode">Sort: Style Code</option>
            </select>
          </div>
        </div>

        {/* Dynamic Category Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin text-xs">
          {[
            { id: 'all', label: '📋 All Summary', count: samples.length },
            { id: 'sewing', label: '✂️ In Sewing', count: inSewing.length },
            { id: 'wash', label: '🌊 In Wash', count: inWash.length },
            { id: 'finishing', label: '✨ In Finishing', count: inFinishing.length },
            { id: 'parcel', label: '📦 Ready Parcel', count: readyToParcel.length },
            { id: 'approvals', label: '💬 Comments Pending', count: commentsPending.length },
            { id: 'followup', label: '📱 WhatsApp Follow-Up', count: followUpDueSamples.length },
          ].map((tab) => {
            const isSelected = summaryFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSummaryFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40 ring-1 ring-indigo-400'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-750'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-indigo-800 text-white' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Summary Filtered Styles Live Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
          {filteredSummarySamples.map((sample) => {
            const p = sample.parcelDetails;
            const isCompleted = isParcelCompleted(sample);
            const isWbSent = p.workbookSent;
            const phone = p.followUp?.whatsAppNumber || '+1 (215) 555-0199';
            const pTone = getPriorityTone(sample.priority);
            const sizeRun = getEffectiveSizeBreakdown(sample);
            const sizeName = getEffectiveSizeName(sample);
            const totalReqQty = getEffectiveRequisitionQuantity(sample);

            return (
              <div
                key={sample.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${pTone.cardClass}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-xs font-black text-indigo-300 bg-indigo-950/90 px-2 py-0.5 rounded border border-indigo-500/40">
                        {sample.styleCode}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] ${pTone.badgeClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${pTone.dotClass}`}></span>
                        <span>{pTone.label}</span>
                      </span>
                      <SampleTypeBadge sampleType={sample.sampleType} size="xs" />
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          STAGE_CONFIG[sample.stage].badgeBg
                        }`}
                      >
                        {STAGE_CONFIG[sample.stage].badgeText}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1 shrink-0">
                      <Calendar className="w-3 h-3" />
                      {p.parcelDate || sample.targetParcelDate}
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <StyleProductImage sample={sample} size="md" />
                    <div className="min-w-0 flex-1">
                      <h4
                        onClick={() => onSelectSample(sample)}
                        className="font-bold text-white text-xs sm:text-sm cursor-pointer hover:text-indigo-300 transition-colors line-clamp-1"
                      >
                        {sample.styleName}
                      </h4>

                      <div className="text-[11px] text-slate-300 mt-1 space-y-0.5">
                        <div>Buyer: <strong className="text-white">{sample.buyer}</strong> • PO: {sample.poNumber}</div>
                        <div>Line: <span className="font-mono text-slate-200">{sample.lineCode}</span> • Fabric: <span className="font-mono text-slate-200">{sample.fabricCode}</span></div>
                        {sample.stage === 'wash' && sample.washDetails && (
                          <div className="text-cyan-300 truncate">Recipe: {sample.washDetails.washType}</div>
                        )}
                        {sample.stage === 'sewing' && sample.sewingOperator && (
                          <div className="text-purple-300 truncate">Operator: {sample.sewingOperator}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Prominent Size Name & Total Requisition Quantity Display */}
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-950/90 border border-indigo-500/40 shadow-inner space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded-lg bg-indigo-950/60 border border-indigo-500/40">
                        <div className="text-[9px] uppercase tracking-wider font-bold text-indigo-300 flex items-center gap-1">
                          <Tag className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span>Size Name</span>
                        </div>
                        <div className="font-mono text-xs sm:text-sm font-black text-white mt-0.5 break-words">
                          {sizeName}
                        </div>
                      </div>

                      <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40">
                        <div className="text-[9px] uppercase tracking-wider font-bold text-emerald-300">
                          Total Requisition Qty
                        </div>
                        <div className="font-mono text-xs sm:text-sm font-black text-emerald-300 mt-0.5">
                          {totalReqQty} Pcs
                        </div>
                      </div>
                    </div>

                    {sizeRun.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-0.5">
                        <span className="text-[9px] font-mono uppercase tracking-wider text-amber-300 font-bold">
                          Size Qty Breakdown:
                        </span>
                        {sizeRun.map((b, bIdx) => (
                          <span
                            key={`${b.size}-${bIdx}`}
                            className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-200 font-mono text-[10px] font-bold"
                          >
                            {b.size}: {b.quantity} {b.quantity === 1 ? 'pc' : 'pcs'}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1.5 border-t border-slate-800">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Ruler className="w-2.5 h-2.5" />
                        Cons: {getEffectivePerPcsConsumption(sample)} yds/pc
                      </span>
                      <span className="text-amber-300">
                        Total Ded: {sample.fabricRequiredYards} yds
                      </span>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="mt-3">
                    <ProgressBar currentStage={sample.stage} size="compact" />
                  </div>

                  {/* Workbook Sent option if parcel is completed */}
                  {isCompleted && (
                    <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1 font-semibold">
                        <FileCheck2 className="w-3.5 h-3.5 text-indigo-400" />
                        Workbook:
                      </span>
                      <button
                        type="button"
                        onClick={() => onToggleWorkbookSent && onToggleWorkbookSent(sample.id)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors ${
                          isWbSent
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                        }`}
                        title="Toggle Workbook Sent confirmation"
                      >
                        {isWbSent ? '✅ Sent: YES' : '⚠️ Sent: NO (Confirm)'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Actions: Follow-Up, WhatsApp, Advance */}
                <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => onSelectSample(sample)}
                    className="text-[11px] text-slate-300 hover:text-white px-2 py-1 bg-slate-700/60 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    Spec Details
                  </button>

                  <div className="flex items-center gap-1.5">
                    {isCompleted && (
                      <>
                        <button
                          type="button"
                          onClick={() => onOpenFollowUp && onOpenFollowUp(sample)}
                          className="p-1.5 text-slate-300 hover:text-white bg-slate-700 rounded-lg"
                          title="Follow-Up"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onSendWhatsApp && onSendWhatsApp(sample, phone)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow flex items-center gap-1 text-[11px] cursor-pointer"
                          title="WhatsApp"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </button>
                      </>
                    )}
                    {STAGE_CONFIG[sample.stage].nextStage && (
                      <button
                        type="button"
                        onClick={() => onAdvanceStage(sample)}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <span>Next</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {filteredSummarySamples.length === 0 && (
            <div className="col-span-full py-8 text-center bg-slate-800/30 rounded-xl border border-dashed border-slate-700 text-slate-400 text-xs">
              No styles currently match the selected summary filter or search query.
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2.5 DEDICATED PARCEL FOLLOW-UP & WHATSAPP NOTIFICATION CENTER */}
      {/* ============================================================ */}
      {parcelCompletedSamples.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-indigo-950/70 border border-emerald-500/40 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 mb-4 border-b border-emerald-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-white tracking-wide flex items-center gap-2">
                    Parcel Follow-Up & WhatsApp Notification Center
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-xs font-bold">
                    {parcelCompletedSamples.length} Completed Parcel{parcelCompletedSamples.length > 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Follow up on dispatched sample parcels with buyer tech teams. Send instant notifications to connected WhatsApp numbers and confirm Workbook dispatch.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {pendingWorkbookSamples.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {pendingWorkbookSamples.length} Workbook{pendingWorkbookSamples.length > 1 ? 's' : ''} Pending
                </span>
              )}
              {followUpDueSamples.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold animate-pulse">
                  <Bell className="w-3.5 h-3.5 text-emerald-400" />
                  {followUpDueSamples.length} Follow-Up{followUpDueSamples.length > 1 ? 's' : ''} Active
                </span>
              )}
            </div>
          </div>

          {/* Cards for each completed parcel style */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {parcelCompletedSamples.map((sample) => {
              const p = sample.parcelDetails;
              const f = p.followUp;
              const isWbSent = p.workbookSent;
              const phone = f?.whatsAppNumber || '+1 (215) 555-0199';
              const pTone = getPriorityTone(sample.priority);

              return (
                <div
                  key={sample.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${pTone.cardClass}`}
                >
                  <div>
                    {/* Header: Style Name & Style Code */}
                    <div className="flex items-start gap-3 mb-2.5">
                      <StyleProductImage sample={sample} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-xs font-black text-indigo-300 bg-indigo-950/90 px-2 py-0.5 rounded border border-indigo-500/40">
                            {sample.styleCode}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] ${pTone.badgeClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${pTone.dotClass}`}></span>
                            <span>{pTone.label}</span>
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              p.dispatchStatus === 'delivered'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            }`}
                          >
                            {p.dispatchStatus.toUpperCase()}
                          </span>
                        </div>
                        <h4
                          onClick={() => onSelectSample(sample)}
                          className="font-bold text-white text-xs mt-1 cursor-pointer hover:text-emerald-400 transition-colors line-clamp-1"
                        >
                          {sample.styleName}
                        </h4>
                        <div className="text-[11px] text-slate-300">
                          Buyer: <strong className="text-white">{sample.buyer}</strong> • PO: {sample.poNumber}
                        </div>
                        <div className="mt-1.5 grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                          <div className="bg-indigo-950/80 px-2 py-1 rounded border border-indigo-500/40">
                            <span className="text-[9px] uppercase text-indigo-300 font-bold block">
                              Size Name
                            </span>
                            <strong className="text-white text-xs">
                              {getEffectiveSizeName(sample)}
                            </strong>
                          </div>
                          <div className="bg-emerald-950/80 px-2 py-1 rounded border border-emerald-500/40">
                            <span className="text-[9px] uppercase text-emerald-300 font-bold block">
                              Total Req Qty
                            </span>
                            <strong className="text-emerald-300 text-xs font-black">
                              {getEffectiveRequisitionQuantity(sample)} Pcs
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Courier and AWB info */}
                    <div className="text-[11px] bg-slate-800/60 p-2 rounded-lg border border-slate-700/60 space-y-1 mb-2.5">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Courier & AWB:</span>
                        <span className="font-mono text-slate-200 truncate max-w-[170px]">
                          {p.courier} ({p.trackingNumber || 'Pending'})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Parcel Date:</span>
                        <span className="font-mono text-emerald-400 font-semibold">{p.parcelDate}</span>
                      </div>
                    </div>

                    {/* WORKBOOK SENT OR NOT CONFIRMATION OPTION */}
                    <div className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/60 mb-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-300 font-semibold flex items-center gap-1">
                          <FileCheck2 className="w-3.5 h-3.5 text-indigo-400" />
                          Workbook Sent Option:
                        </span>
                        <button
                          type="button"
                          onClick={() => onToggleWorkbookSent && onToggleWorkbookSent(sample.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            isWbSent
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 animate-pulse'
                          }`}
                          title="Click to toggle Workbook Sent confirmation"
                        >
                          {isWbSent ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Sent: YES</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3" />
                              <span>Sent: NO (Click to Confirm)</span>
                            </>
                          )}
                        </button>
                      </div>
                      {isWbSent ? (
                        <div className="text-[10px] text-slate-400 flex justify-between">
                          <span>Dispatched: {p.workbookSentDate || p.parcelDate}</span>
                          <span className="text-emerald-400">Techpack Verified</span>
                        </div>
                      ) : (
                        <div className="text-[10px] text-amber-300/80">
                          ⚠️ Techpack & trim measurement workbook pending dispatch
                        </div>
                      )}
                    </div>

                    {/* Follow-up status & connected WhatsApp */}
                    <div className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/60 text-[11px] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-indigo-400" />
                          Follow-Up:
                        </span>
                        <span
                          className={`font-semibold text-[10px] px-1.5 py-0.2 rounded ${
                            f?.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : f?.status === 'scheduled'
                              ? 'bg-indigo-500/20 text-indigo-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {f?.status ? f.status.toUpperCase() : 'PENDING'} ({f?.followUpDate || 'TBD'})
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-400" />
                          Connected WhatsApp:
                        </span>
                        <span className="font-mono text-emerald-300 text-[10px] font-semibold">
                          {phone}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Send WhatsApp & Open Follow-Up Modal */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenFollowUp && onOpenFollowUp(sample)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold border border-slate-700 transition-colors cursor-pointer"
                    >
                      Follow-Up Details
                    </button>
                    <button
                      type="button"
                      onClick={() => onSendWhatsApp && onSendWhatsApp(sample, phone)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
                      title={`Send WhatsApp Follow-up notification for style ${sample.styleName} to ${phone}`}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp Notification</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. PARCEL DELIVERY & APPROVAL COMMENTS SUMMARY WITH DATES */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Parcel & Approvals with Dates and Remarks */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-emerald-400" />
                Ready to Parcel & Approval Comments Status
              </h2>
              <p className="text-xs text-slate-400">
                Tracking courier parcel dates and buyer wash, trims, accessories remarks
              </p>
            </div>
            <button
              onClick={() => onNavigateToView('approvals')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              See all ({readyToParcel.length + commentsPending.length})
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {[...readyToParcel, ...commentsPending].map((sample) => {
              const isApprovalStage = sample.stage === 'approval_comments';
              const pDetails = sample.parcelDetails;
              const aDetails = sample.approvalDetails;
              const pTone = getPriorityTone(sample.priority);
              const sizeName = getEffectiveSizeName(sample);
              const totalReqQty = getEffectiveRequisitionQuantity(sample);

              return (
                <div
                  key={sample.id}
                  onClick={() => onSelectSample(sample)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer group ${pTone.cardClass}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <StyleProductImage sample={sample} size="xs" />
                      <span className="font-mono text-xs font-black text-indigo-300 px-2 py-0.5 rounded bg-indigo-950/90 border border-indigo-500/40 shrink-0">
                        {sample.styleCode}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] shrink-0 ${pTone.badgeClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${pTone.dotClass}`}></span>
                        <span>{pTone.label}</span>
                      </span>
                      <span className="text-xs font-bold text-white truncate max-w-xs">
                        {sample.styleName}
                      </span>
                      <span className="text-[10px] text-slate-300 font-medium shrink-0">
                        • {sample.buyer}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-indigo-950/90 border border-indigo-400/50 text-[11px] font-mono text-indigo-200 font-bold shrink-0">
                        Size Name: <strong className="text-white">{sizeName}</strong>
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-emerald-950/90 border border-emerald-400/50 text-[11px] font-mono text-emerald-300 font-black shrink-0">
                        Total Req Qty: {totalReqQty} Pcs
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          STAGE_CONFIG[sample.stage].badgeBg
                        }`}
                      >
                        {STAGE_CONFIG[sample.stage].badgeText}
                      </span>
                      <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                        <Calendar className="w-3 h-3" />
                        Parcel: {pDetails.parcelDate || 'Scheduled'}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <ProgressBar currentStage={sample.stage} size="compact" />
                  </div>

                  {/* Remarks Summary */}
                  {isApprovalStage ? (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <div>
                        <span className="text-slate-400 font-semibold block">Wash Remarks:</span>
                        <span className="text-slate-300 truncate block">
                          {aDetails.washComments || 'Pending review'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block">Trims Remarks:</span>
                        <span className="text-slate-300 truncate block">
                          {aDetails.trimsComments || 'Pending review'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block">Accessories Remarks:</span>
                        <span className="text-slate-300 truncate block">
                          {aDetails.accessoriesComments || 'Pending review'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400">
                      <span>Courier: {pDetails.courier || 'DHL Express'}</span>
                      <span className="font-mono text-slate-300">
                        AWB: {pDetails.trackingNumber || 'Pending AWB Generation'}
                      </span>
                    </div>
                  )}

                  {/* Workbook Sent & Follow Up quick actions bar */}
                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">Workbook:</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleWorkbookSent && onToggleWorkbookSent(sample.id);
                        }}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors ${
                          pDetails.workbookSent
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                        }`}
                        title="Click to toggle Workbook Sent confirmation"
                      >
                        {pDetails.workbookSent ? '✅ Workbook Sent' : '⚠️ Workbook Not Sent'}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenFollowUp && onOpenFollowUp(sample);
                        }}
                        className="text-[11px] px-2 py-1 bg-slate-700/80 hover:bg-slate-700 text-slate-200 rounded font-semibold cursor-pointer"
                      >
                        Follow-Up
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSendWhatsApp &&
                            onSendWhatsApp(
                              sample,
                              pDetails.followUp?.whatsAppNumber || '+1 (215) 555-0199'
                            );
                        }}
                        className="text-[11px] px-2 py-1 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {readyToParcel.length === 0 && commentsPending.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-xs">
                No samples currently awaiting parcel dispatch or buyer approval comments.
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Fabric Inventory Snapshot with Quick Link */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Fabric Inventory Status
              </h2>
              <button
                onClick={() => onNavigateToView('fabric_inventory')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
              >
                View all ({fabrics.length})
              </button>
            </div>

            <div className="space-y-3">
              {fabrics.slice(0, 5).map((fab) => {
                const isCritical = fab.availableYards <= 5;
                return (
                  <div
                    key={fab.id}
                    className={`p-3 rounded-xl border transition-all ${
                      isCritical
                        ? 'bg-rose-950/40 border-rose-500/60 text-rose-200'
                        : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded ${
                          isCritical
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-700 text-slate-200'
                        }`}
                      >
                        {fab.code}
                      </span>
                      <span
                        className={`font-mono text-xs font-black ${
                          isCritical ? 'text-rose-400 animate-pulse' : 'text-slate-200'
                        }`}
                      >
                        {fab.availableYards.toFixed(1)} yds
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-white mt-1.5 truncate">
                      {fab.name}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Linked Styles: {fab.linkedStyleCodes.join(', ') || 'N/A'}</span>
                      {isCritical && (
                        <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                          ≤ 5 yds Alert!
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400">
              Total Fabrics: <strong className="text-white">{fabrics.length}</strong>
            </span>
            <span className="text-rose-400 font-bold">
              Critical (≤5 yds): {lowFabrics.length}
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. ACTIVE WORKFLOW PIPELINE PROGRESS OVERVIEW */}
      {/* ============================================================ */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Active Samples Pipeline Progression
            </h2>
            <p className="text-xs text-slate-400">
              Visual tracking across: Requisition → Sewing → Wash → Finishing → Ready for Parcel → Approval Comments
            </p>
          </div>
          <button
            onClick={() => onNavigateToView('all_samples')}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
          >
            Explore Master Table & Kanban
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-4">
          {samples.map((sample) => {
            const pTone = getPriorityTone(sample.priority);
            const sizeRun = getEffectiveSizeBreakdown(sample);
            const sizeName = getEffectiveSizeName(sample);
            const totalReqQty = getEffectiveRequisitionQuantity(sample);
            return (
              <div
                key={sample.id}
                className={`p-4 rounded-xl border transition-all ${pTone.cardClass}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <StyleProductImage sample={sample} size="sm" />
                    <div
                      onClick={() => onSelectSample(sample)}
                      className="cursor-pointer hover:underline"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-black text-indigo-300 bg-indigo-950/90 px-2 py-0.5 rounded border border-indigo-500/40">
                          {sample.styleCode}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] ${pTone.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${pTone.dotClass}`}></span>
                          <span>{pTone.label}</span>
                        </span>
                        <SampleTypeBadge sampleType={sample.sampleType} size="xs" />
                        <span className="font-bold text-white text-xs sm:text-sm">
                          {sample.styleName}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1.5">
                        <span>
                          PO: <span className="font-mono text-white">{sample.poNumber}</span> • Line:{' '}
                          <span className="font-mono text-white">{sample.lineCode}</span> • Buyer:{' '}
                          <span className="text-white font-semibold">{sample.buyer}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-indigo-950/90 border border-indigo-400/50 font-mono text-[11px] text-indigo-200 font-bold">
                          <Tag className="w-3 h-3 text-indigo-300" />
                          <span>
                            Size Name: <strong className="text-white">{sizeName}</strong>
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-950/90 border border-emerald-400/50 font-mono text-[11px] text-emerald-300 font-black">
                          Total Requisition Qty: {totalReqQty} Pcs
                        </span>
                      </div>
                      {sizeRun.length > 1 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {sizeRun.map((b, bIdx) => (
                            <span
                              key={`${b.size}-${bIdx}`}
                              className="px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-400/40 text-amber-200 font-mono text-[9px] font-bold"
                            >
                              {b.size}: {b.quantity}pc
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                        STAGE_CONFIG[sample.stage].badgeBg
                      }`}
                    >
                      {STAGE_CONFIG[sample.stage].badgeText}
                    </span>

                    {STAGE_CONFIG[sample.stage].nextStage && (
                      <button
                        onClick={() => onAdvanceStage(sample)}
                        className="flex items-center gap-1 px-3 py-1 bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg shadow transition-all cursor-pointer"
                        title={`Advance to ${STAGE_CONFIG[STAGE_CONFIG[sample.stage].nextStage!].label}`}
                      >
                        <span>Move to {STAGE_CONFIG[STAGE_CONFIG[sample.stage].nextStage!].shortLabel}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar visual tracking */}
                <ProgressBar currentStage={sample.stage} size="standard" />
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. MAIN TRACKING MODULES (BOTTOM SIDE WORKBENCHES & PIPELINES) */}
      {/* ============================================================ */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-2 border-indigo-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-500/20">
          <div>
            <div className="inline-flex items-center gap-2 text-indigo-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
              Main Modules Control Hub
            </div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              Main Tracking Modules
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Direct access to dedicated workbenches across all apparel sample development phases.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>Bottom Navigation Synchronized</span>
          </div>
        </div>

        {/* Main Modules Grid (6 Modules with short names) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Module 1: Samples */}
          <div
            onClick={() => onNavigateToView('all_samples')}
            className="p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 hover:border-purple-500/60 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                  <Layers className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-black text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/30">
                  {samples.length} Total Styles
                </span>
              </div>
              <h3 className="font-bold text-white text-sm group-hover:text-purple-300 transition-colors">
                Samples
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Master pipeline from Requisition, Sewing, Wash, Finishing to Parcel Dispatch & Buyer Approvals.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs font-bold text-purple-400">
              <span>Open Samples Module</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </div>

          {/* Module 2: Wash */}
          <div
            onClick={() => onNavigateToView('wash')}
            className="p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/60 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                  <Waves className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-black text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                  {inWash.length} In Wash
                </span>
              </div>
              <h3 className="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors">
                Wash
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Active wet wash recipes: enzyme stone wash, vintage acid burnout, ozone rinse & bleach treatments.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs font-bold text-cyan-400">
              <span>Open Wash Module</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </div>

          {/* Module 3: Finishing */}
          <div
            onClick={() => onNavigateToView('finishing')}
            className="p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/60 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-black text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30">
                  {inFinishing.length} In Finishing
                </span>
              </div>
              <h3 className="font-bold text-white text-sm group-hover:text-amber-300 transition-colors">
                Finishing
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Post-wash processing: steam ironing, thread trimming, hangtag verification & QA signoff.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs font-bold text-amber-400">
              <span>Open Finishing Module</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </div>

          {/* Module 4: Parcel & Approval */}
          <div
            onClick={() => onNavigateToView('approvals')}
            className="p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/60 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-black text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                  {readyToParcel.length + commentsPending.length} Parcel Styles
                </span>
              </div>
              <h3 className="font-bold text-white text-sm group-hover:text-emerald-300 transition-colors">
                Parcel & Approval
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Courier airway bills, Workbook Sent confirmation option, WhatsApp follow-up & Buyer approval remarks.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs font-bold text-emerald-400">
              <span>Open Parcel & Approval</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </div>

          {/* Module 5: Test (Bureau Veritas) */}
          <div
            onClick={() => onNavigateToView('test')}
            className="p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 hover:border-blue-500/60 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-black text-blue-300 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-500/30">
                  {tests.length} BV Lab Tests
                </span>
              </div>
              <h3 className="font-bold text-white text-sm group-hover:text-blue-300 transition-colors">
                Test
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Bureau Veritas (BV) Fabric & Garment testing: report numbers, pH-Value results, failure reasons & 24h re-test alert.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs font-bold text-blue-400">
              <span>Open Test Module</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </div>

          {/* Module 6: Fabric */}
          <div
            onClick={() => onNavigateToView('fabric_inventory')}
            className="p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 hover:border-rose-500/60 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
                  <ScrollText className="w-5 h-5" />
                </div>
                <span className={`text-xs font-mono font-black px-2 py-0.5 rounded border ${
                  lowFabrics.length > 0
                    ? 'text-rose-300 bg-rose-950/80 border-rose-500/50 animate-pulse'
                    : 'text-slate-300 bg-slate-800 border-slate-700'
                }`}>
                  {fabrics.length} Fabrics {lowFabrics.length > 0 && `(${lowFabrics.length} ≤5 yds)`}
                </span>
              </div>
              <h3 className="font-bold text-white text-sm group-hover:text-rose-300 transition-colors">
                Fabric
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Yardage inventory linked with styles. Automatic RED alert for any fabric with 5 yds or less remaining.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs font-bold text-rose-400">
              <span>Open Fabric Module</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
