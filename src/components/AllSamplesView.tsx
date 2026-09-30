import React, { useState, useMemo, useEffect } from 'react';
import {
  SampleItem,
  SampleStage,
  STAGE_CONFIG,
  SamplePriority,
  isParcelCompleted,
  getSampleImage,
  getEffectiveShipmentDate,
  getDaysUntilShipment,
  getSampleTypeTone,
  getPriorityTone,
  getEffectiveSizeBreakdown,
  getEffectiveSizeName,
  getEffectiveRequisitionQuantity,
  getEffectivePerPcsConsumption,
  rankSamplesBySearchQuery,
} from '../types/sample';
import { UserRole, canUserAdvanceStage, ROLE_BADGE_CONFIG } from '../types/auth';
import { ProgressBar } from './ProgressBar';
import { StyleProductImage, useImageZoom } from './StyleProductImage';
import { SampleTypeBadge } from './SampleTypeBadge';
import {
  Search,
  ArrowUpDown,
  Plus,
  ArrowRight,
  Eye,
  LayoutList,
  Kanban,
  Calendar,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Phone,
  Printer,
  ZoomIn,
  Lock,
  Edit3,
  ShieldCheck,
  Ruler,
} from 'lucide-react';

interface AllSamplesViewProps {
  samples: SampleItem[];
  searchQuery: string;
  userRole?: UserRole;
  onSearchChange: (q: string) => void;
  onSelectSample: (sample: SampleItem) => void;
  onAdvanceStage: (sample: SampleItem) => void;
  onNewRequisition: () => void;
  onModifyStoredStyle?: (sample: SampleItem) => void;
  onDeleteSample?: (id: string) => void;
  initialStageFilter?: SampleStage | 'all';
  onOpenFollowUp?: (sample: SampleItem) => void;
  onToggleWorkbookSent?: (sampleId: string) => void;
  onSendWhatsApp?: (sample: SampleItem, phone: string, customMessage?: string) => void;
  onOpenRequisitionSlip?: (sample: SampleItem) => void;
}

type SortField = 'styleCode' | 'poNumber' | 'createdAt' | 'targetParcelDate' | 'shipmentDate' | 'priority' | 'stage';
type SortOrder = 'asc' | 'desc';

export const AllSamplesView: React.FC<AllSamplesViewProps> = ({
  samples,
  searchQuery,
  userRole = 'merchandiser',
  onSearchChange,
  onSelectSample,
  onAdvanceStage,
  onNewRequisition,
  onModifyStoredStyle,
  initialStageFilter = 'all',
  onOpenFollowUp,
  onToggleWorkbookSent,
  onSendWhatsApp,
  onOpenRequisitionSlip,
}) => {
  const { openZoom } = useImageZoom();
  const isMerchandiser = userRole === 'merchandiser';
  const isSewingUser = userRole === 'sewing';
  const isWashUser = userRole === 'wash';

  // Sewing Status Page strictly shows ONLY styles in 'sewing' status
  const [selectedStage, setSelectedStage] = useState<SampleStage | 'all'>('sewing');

  useEffect(() => {
    setSelectedStage('sewing');
  }, [userRole, initialStageFilter]);

  const [selectedBuyer, setSelectedBuyer] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<SamplePriority | 'all'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const sewingOnlySamples = useMemo(
    () => samples.filter((s) => s.stage === 'sewing'),
    [samples]
  );

  const buyersList = useMemo(() => {
    return Array.from(new Set(sewingOnlySamples.map((s) => s.buyer))).filter(Boolean);
  }, [sewingOnlySamples]);

  const filteredSamples = useMemo(() => {
    // Strictly only Sewing Status styles on the Sewing Page
    let result = [...sewingOnlySamples];

    if (searchQuery.trim()) {
      const ranked = rankSamplesBySearchQuery(result, searchQuery);
      return ranked.map((r) => r.sample);
    }

    if (selectedBuyer !== 'all') {
      result = result.filter((s) => s.buyer === selectedBuyer);
    }

    if (selectedPriority !== 'all') {
      result = result.filter((s) => s.priority === selectedPriority);
    }

    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'styleCode') {
        comparison = a.styleCode.localeCompare(b.styleCode);
      } else if (sortField === 'poNumber') {
        comparison = a.poNumber.localeCompare(b.poNumber);
      } else if (sortField === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortField === 'targetParcelDate') {
        comparison = new Date(a.targetParcelDate).getTime() - new Date(b.targetParcelDate).getTime();
      } else if (sortField === 'shipmentDate') {
        const shipA = getEffectiveShipmentDate(a) || '9999-12-31';
        const shipB = getEffectiveShipmentDate(b) || '9999-12-31';
        comparison = shipA.localeCompare(shipB);
      } else if (sortField === 'priority') {
        const pOrder: Record<SamplePriority, number> = { urgent: 3, high: 2, normal: 1 };
        comparison = pOrder[a.priority] - pOrder[b.priority];
      } else if (sortField === 'stage') {
        comparison = STAGE_CONFIG[a.stage].stepNumber - STAGE_CONFIG[b.stage].stepNumber;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [sewingOnlySamples, searchQuery, selectedStage, selectedBuyer, selectedPriority, sortField, sortOrder]);

  const totalItems = filteredSamples.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedSamples = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * pageSize;
    return filteredSamples.slice(startIndex, startIndex + pageSize);
  }, [filteredSamples, validCurrentPage, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const STAGES_LIST: SampleStage[] = ['sewing'];

  return (
    <div className="space-y-5">
      {/* Top Header Controls */}
      <div className="p-6 rounded-2xl bg-white border border-emerald-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-2">
            Step 2 of 6 • Dedicated Sewing Status Page
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Sewing Status Styles Only (Move Sewing → Wash)
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            This page strictly displays only styles currently in <strong>Sewing Status</strong> ({sewingOnlySamples.length} style{sewingOnlySamples.length === 1 ? '' : 's'}). Requisition styles are shown on Dashboard, and Wash styles on the Wash page.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-emerald-50 p-1 rounded-xl border border-emerald-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-emerald-900 hover:bg-emerald-100'
              }`}
              title="Table View"
            >
              <LayoutList className="w-4 h-4" />
              <span className="hidden md:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-emerald-900 hover:bg-emerald-100'
              }`}
              title="Kanban Board View"
            >
              <Kanban className="w-4 h-4" />
              <span className="hidden md:inline">Kanban</span>
            </button>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-2">
            <span>In Sewing Status:</span>
            <span className="font-mono font-black text-sm">{sewingOnlySamples.length}</span>
          </div>
        </div>
      </div>

      {/* Secondary Filter & Search Toolbar */}
      <div className="bg-slate-900/80 p-3 sm:p-3.5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 text-xs">
        <div className="relative flex-1 min-w-0 sm:min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search Style, PO, Line Code, Buyer, Fabric..."
            className="w-full min-h-[42px] bg-slate-800/90 border border-slate-700 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs p-1"
            >
              ×
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-2">
          <select
            value={selectedBuyer}
            onChange={(e) => {
              setSelectedBuyer(e.target.value);
              setCurrentPage(1);
            }}
            className="min-h-[40px] bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 truncate"
          >
            <option value="all">All Buyers</option>
            {buyersList.map((buyer) => (
              <option key={buyer} value={buyer}>
                {buyer}
              </option>
            ))}
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => {
              setSelectedPriority(e.target.value as any);
              setCurrentPage(1);
            }}
            className="min-h-[40px] bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 truncate"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">🔴 Urgent (Fully Red)</option>
            <option value="high">🌸 High (Little Red)</option>
            <option value="normal">⚪ Normal (White)</option>
          </select>

          <div className="flex items-center justify-end sm:justify-start gap-1.5 text-slate-400">
            <span className="hidden sm:inline">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="min-h-[40px] w-full sm:w-auto bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value={5}>5 / pg</option>
              <option value={10}>10 / pg</option>
              <option value={20}>20 / pg</option>
              <option value={50}>50 / pg</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content: Table (with Mobile Card View) or Kanban */}
      {viewMode === 'table' ? (
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          {/* MOBILE CARD LIST (< md) */}
          <div className="md:hidden divide-y divide-slate-800">
            {paginatedSamples.map((sample) => {
              const stageConfig = STAGE_CONFIG[sample.stage];
              const hasNextStage = !!stageConfig.nextStage;
              const canAdvance =
                hasNextStage &&
                canUserAdvanceStage(userRole, sample.stage, stageConfig.nextStage!);
              const pTone = getPriorityTone(sample.priority);
              const sizeRun = getEffectiveSizeBreakdown(sample);

              return (
                <div
                  key={sample.id}
                  className={`p-3.5 space-y-3 transition-colors ${pTone.rowClass}`}
                >
                  {/* Top Row: Thumbnail + Style Header + Stage Badge */}
                  <div className="flex items-start gap-3">
                    <StyleProductImage sample={sample} size="sm" />
                    <div
                      onClick={() => onSelectSample(sample)}
                      className="min-w-0 flex-1 cursor-pointer"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono font-black text-indigo-300 px-1.5 py-0.5 rounded bg-indigo-950/90 border border-indigo-500/40 text-xs">
                            {sample.styleCode}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${pTone.badgeClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${pTone.dotClass}`}></span>
                            <span>{pTone.label}</span>
                          </span>
                          <SampleTypeBadge sampleType={sample.sampleType} size="xs" />
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${stageConfig.badgeBg}`}
                        >
                          {stageConfig.badgeText}
                        </span>
                      </div>

                      <h3 className="font-bold text-white text-sm mt-1 line-clamp-1">
                        {sample.styleName}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Buyer: <strong className="text-slate-200">{sample.buyer}</strong> · PO:{' '}
                        <span className="font-mono text-slate-300">{sample.poNumber}</span> · Line:{' '}
                        <span className="font-mono text-slate-300">{sample.lineCode}</span>
                      </p>
                    </div>
                  </div>

                  {/* Specs & Fabric Consumption Box */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/90 text-[11px]">
                    <div>
                      <div className="text-slate-400">
                        Color: <strong className="text-slate-200">{sample.color}</strong>
                      </div>
                      <div className="text-indigo-200 mt-0.5 font-mono">
                        Size Name:{' '}
                        <strong className="text-white font-bold">{getEffectiveSizeName(sample)}</strong>
                        {sizeRun.length > 1 && (
                          <span className="ml-1 text-amber-300 font-mono">
                            ({sizeRun.length} sizes)
                          </span>
                        )}
                      </div>
                      <div className="text-emerald-300 font-mono font-black mt-0.5">
                        Total Req Qty: {getEffectiveRequisitionQuantity(sample)} Pcs
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-semibold text-slate-200 truncate">
                        {sample.fabricCode}
                      </div>
                      <div className="text-emerald-400 font-mono font-bold text-[10px] mt-0.5">
                        {getEffectivePerPcsConsumption(sample)} yds/pc · Ded: {sample.fabricRequiredYards} yds
                      </div>
                    </div>
                  </div>

                  {/* Progress & Dates */}
                  <div className="space-y-1.5">
                    <ProgressBar currentStage={sample.stage} size="compact" />
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span className="text-amber-300 font-semibold flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-amber-400" />
                        Ship: {getEffectiveShipmentDate(sample) || 'N/A'}
                      </span>
                      <span>
                        Parcel: {sample.parcelDetails.parcelDate || sample.targetParcelDate}
                      </span>
                    </div>
                  </div>

                  {/* Mobile Touch Action Bar */}
                  <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                    {canAdvance ? (
                      <button
                        type="button"
                        onClick={() => onAdvanceStage(sample)}
                        className="flex-1 min-h-[44px] px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/25 transition-all cursor-pointer whitespace-nowrap"
                      >
                        <span>
                          {isSewingUser
                            ? 'Move Requisition → Sewing'
                            : isWashUser
                            ? sample.stage === 'sewing'
                              ? 'Move Sewing → Wash'
                              : 'Move Wash → Finishing'
                            : `Advance to ${STAGE_CONFIG[stageConfig.nextStage!].shortLabel}`}
                        </span>
                        <ArrowRight className="w-4 h-4 shrink-0" />
                      </button>
                    ) : (
                      <div className="text-[11px] text-slate-500 font-medium">
                        Stage: {stageConfig.label}
                      </div>
                    )}

                    <div className="flex items-center gap-1.5">
                      {onModifyStoredStyle && isMerchandiser && (
                        <button
                          type="button"
                          onClick={() => onModifyStoredStyle(sample)}
                          className="min-h-[42px] px-2.5 py-1.5 text-emerald-300 bg-emerald-950/60 hover:bg-emerald-600 hover:text-white border border-emerald-500/40 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Modify Color, Wash, or Sizes"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onOpenRequisitionSlip && onOpenRequisitionSlip(sample)}
                        className="min-h-[42px] min-w-[42px] flex items-center justify-center text-slate-300 hover:text-indigo-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer"
                        title="Print Requisition Slip"
                        aria-label="Print Requisition Slip"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectSample(sample)}
                        className="min-h-[42px] min-w-[42px] flex items-center justify-center text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer"
                        title="View Sample Details"
                        aria-label="View Sample Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {paginatedSamples.length === 0 && (
              <div className="py-12 px-4 text-center text-slate-400">
                <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="font-semibold text-slate-300 text-sm">
                  No samples match your search criteria.
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Try adjusting filters or clear your search query.
                </p>
              </div>
            )}
          </div>

          {/* DESKTOP TABLE VIEW (md and up) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/90 text-slate-400 uppercase text-[11px] font-bold tracking-wider border-b border-slate-700/80">
                <tr>
                  <th
                    onClick={() => handleSort('styleCode')}
                    className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Style & Item</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('poNumber')}
                    className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>PO # / Line</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Buyer / Type</th>
                  <th className="py-3 px-4">Fabric Linked</th>
                  <th
                    onClick={() => handleSort('stage')}
                    className="py-3 px-4 min-w-[200px] cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Stage & Visual Progress</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('shipmentDate')}
                    className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Shipment &amp; Parcel Date</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {paginatedSamples.map((sample) => {
                  const stageConfig = STAGE_CONFIG[sample.stage];
                  const hasNextStage = !!stageConfig.nextStage;
                  const pTone = getPriorityTone(sample.priority);

                  return (
                    <tr
                      key={sample.id}
                      className={`transition-colors group ${pTone.rowClass}`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <StyleProductImage sample={sample} size="sm" />
                          <div
                            onClick={() => onSelectSample(sample)}
                            className="cursor-pointer min-w-0 flex-1"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-indigo-300 px-1.5 py-0.5 rounded bg-indigo-950/90 border border-indigo-500/40 text-xs">
                                {sample.styleCode}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded border ${pTone.badgeClass}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${pTone.dotClass}`}></span>
                                <span>{pTone.label}</span>
                              </span>
                            </div>
                            <div className="font-semibold text-white mt-1 group-hover:text-indigo-300 transition-colors line-clamp-1">
                              {sample.styleName}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1 flex flex-wrap items-center gap-1.5">
                              <span>
                                Color: {sample.color} • Wash: {sample.washDetails?.washType || 'N/A'}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/40 font-mono text-[10px] text-indigo-200 font-bold">
                                Size Name: <strong className="text-white">{getEffectiveSizeName(sample)}</strong>
                              </span>
                              <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 font-mono text-[10px] text-emerald-300 font-black">
                                Total Req Qty: {getEffectiveRequisitionQuantity(sample)} Pcs
                              </span>
                              {getEffectiveSizeBreakdown(sample).length > 1 && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40 font-mono text-[9px] font-bold">
                                  {getEffectiveSizeBreakdown(sample).length} Sizes Run
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-mono text-slate-200 font-medium">
                          {sample.poNumber}
                        </div>
                        <div className="font-mono text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                          {sample.lineCode}
                        </div>
                        {sample.sewingOperator && (
                          <div className="text-[10px] text-slate-500 truncate max-w-[120px] mt-0.5">
                            {sample.sewingOperator}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">
                          {sample.buyer}
                        </div>
                        <div className="mt-1">
                          <SampleTypeBadge sampleType={sample.sampleType} size="xs" />
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-mono text-xs font-semibold text-slate-200">
                          {sample.fabricCode}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[140px] mt-0.5">
                          {sample.fabricName}
                        </div>
                        <div className="text-[10px] text-emerald-400 font-mono font-bold mt-0.5 flex items-center gap-1">
                          <Ruler className="w-2.5 h-2.5" />
                          <span>{getEffectivePerPcsConsumption(sample)} yds/pc</span>
                        </div>
                        <div className="text-[10px] text-amber-300 font-mono mt-0.5">
                          Deducted: {sample.fabricRequiredYards} yds ({sample.quantity} pcs)
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="mb-1 flex items-center justify-between">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${stageConfig.badgeBg}`}
                          >
                            {stageConfig.badgeText}
                          </span>
                        </div>
                        <ProgressBar currentStage={sample.stage} size="compact" />
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 font-mono text-amber-300 font-bold text-xs">
                          <Calendar className="w-3.5 h-3.5 text-amber-400" />
                          <span>Ship: {getEffectiveShipmentDate(sample) || 'N/A'}</span>
                        </div>
                        {getDaysUntilShipment(sample) !== null && (
                          <div className="text-[10px] font-mono text-amber-200/80 mt-0.5">
                            {getDaysUntilShipment(sample)! < 0
                              ? `${Math.abs(getDaysUntilShipment(sample)!)}d overdue`
                              : `${getDaysUntilShipment(sample)}d to shipment`}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 font-mono mt-1">
                          Parcel: {sample.parcelDetails.parcelDate || sample.targetParcelDate}
                        </div>
                        {isParcelCompleted(sample) && isMerchandiser && (
                          <div className="mt-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleWorkbookSent && onToggleWorkbookSent(sample.id);
                              }}
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                                sample.parcelDetails.workbookSent
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                              }`}
                              title="Toggle Workbook Sent confirmation"
                            >
                              {sample.parcelDetails.workbookSent ? '✅ Workbook: YES' : '⚠️ Workbook: NO'}
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isParcelCompleted(sample) && isMerchandiser && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenFollowUp && onOpenFollowUp(sample);
                                }}
                                className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                                title="Configure Parcel Follow-Up"
                              >
                                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSendWhatsApp &&
                                    onSendWhatsApp(
                                      sample,
                                      sample.parcelDetails.followUp?.whatsAppNumber || ''
                                    );
                                }}
                                className="p-1.5 text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow transition-colors cursor-pointer"
                                title="Send Follow-up WhatsApp Notification"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {hasNextStage && canUserAdvanceStage(userRole, sample.stage, stageConfig.nextStage!) && (
                            <button
                              onClick={() => onAdvanceStage(sample)}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow transition-all cursor-pointer"
                              title={`Advance to ${STAGE_CONFIG[stageConfig.nextStage!].label}`}
                            >
                              <span>
                                {isSewingUser
                                  ? 'Move to Sewing'
                                  : isWashUser
                                  ? sample.stage === 'sewing'
                                    ? 'Move to Wash'
                                    : 'Move to Finishing'
                                  : 'Next'}
                              </span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onModifyStoredStyle && isMerchandiser && (
                            <button
                              onClick={() => onModifyStoredStyle(sample)}
                              className="px-2 py-1 text-emerald-300 hover:text-white bg-emerald-950/60 hover:bg-emerald-600 border border-emerald-500/40 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Select this stored style to change Color, Wash, or Sizes"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span className="hidden xl:inline">Select / Change</span>
                            </button>
                          )}
                          <button
                            onClick={() => onOpenRequisitionSlip && onOpenRequisitionSlip(sample)}
                            className="px-2 py-1 text-emerald-300 hover:text-white bg-emerald-950/60 hover:bg-emerald-600 border border-emerald-500/40 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Open Print Preview & Print Sample Requisition Form"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print</span>
                          </button>
                          <button
                            onClick={() => onSelectSample(sample)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="View Full Spec & Remarks"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <span
                            className="p-1.5 text-emerald-400/70 bg-slate-800/60 rounded-lg border border-slate-700/60"
                            title="Permanent Record: Saved data cannot be deleted directly from the frontend system"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {paginatedSamples.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="w-8 h-8 text-slate-500" />
                        <span className="font-semibold text-slate-300">
                          No samples match your search criteria.
                        </span>
                        <p className="text-xs text-slate-500">
                          Try adjusting filters or clear your search query.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3.5 bg-slate-800/60 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
            <div>
              Showing{' '}
              <strong className="text-slate-200">
                {totalItems === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-slate-200">
                {Math.min(validCurrentPage * pageSize, totalItems)}
              </strong>{' '}
              of <strong className="text-slate-200">{totalItems}</strong> samples
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={validCurrentPage === 1}
                className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  Math.abs(pageNum - validCurrentPage) <= 1
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`min-w-8 h-8 rounded-lg font-mono text-xs font-semibold transition-all cursor-pointer ${
                        validCurrentPage === pageNum
                          ? 'bg-indigo-600 text-white shadow'
                          : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  (pageNum === 2 && validCurrentPage > 3) ||
                  (pageNum === totalPages - 1 && validCurrentPage < totalPages - 2)
                ) {
                  return (
                    <span key={pageNum} className="text-slate-500 px-1">
                      ...
                    </span>
                  );
                }
                return null;
              })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={validCurrentPage === totalPages || totalPages === 0}
                className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 overflow-x-auto pb-4">
          {STAGES_LIST.map((stage) => {
            const config = STAGE_CONFIG[stage];
            const stageSamples = filteredSamples.filter((s) => s.stage === stage);

            return (
              <div
                key={stage}
                className="flex flex-col bg-slate-900/60 rounded-2xl border border-slate-800 p-3 min-w-[260px] max-h-[750px] shadow-lg"
              >
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: config.color }}
                    ></span>
                    <h3 className="font-bold text-white text-xs truncate">
                      {config.label}
                    </h3>
                  </div>
                  <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-bold">
                    {stageSamples.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
                  {stageSamples.map((sample) => {
                    const pTone = getPriorityTone(sample.priority);
                    return (
                    <div
                      key={sample.id}
                      onClick={() => onSelectSample(sample)}
                      className={`p-2.5 rounded-xl border hover:border-indigo-400 transition-all cursor-pointer shadow-md group ${pTone.cardClass}`}
                    >
                      {getSampleImage(sample) ? (
                        <div
                          onDoubleClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openZoom(sample, getSampleImage(sample), true);
                          }}
                          title="Double-click product picture to zoom"
                          className="w-full h-28 rounded-lg overflow-hidden mb-2 bg-slate-900 border border-slate-700/60 hover:border-indigo-400 relative cursor-zoom-in group/kimg"
                        >
                          <img
                            src={getSampleImage(sample)}
                            alt={sample.styleName}
                            draggable={false}
                            className="w-full h-full object-cover group-hover/kimg:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute top-1.5 left-1.5 font-mono font-black text-indigo-300 text-[10px] px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-xs border border-indigo-500/30">
                            {sample.styleCode}
                          </div>
                          <div className={`absolute top-1.5 right-1.5 text-[9px] px-1.5 py-0.2 rounded border inline-flex items-center gap-1 ${pTone.badgeClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${pTone.dotClass}`}></span>
                            <span>{pTone.label}</span>
                          </div>
                          <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/75 text-indigo-200 text-[9px] font-bold flex items-center gap-1 opacity-85 group-hover/kimg:opacity-100 group-hover/kimg:bg-indigo-600 group-hover/kimg:text-white transition-all">
                            <ZoomIn className="w-2.5 h-2.5" />
                            <span>Double-click zoom</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono font-black text-indigo-300 text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-indigo-500/30">
                            {sample.styleCode}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded border inline-flex items-center gap-1 ${pTone.badgeClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${pTone.dotClass}`}></span>
                            <span>{pTone.label}</span>
                          </span>
                        </div>
                      )}
                      <h4 className="font-bold text-white text-xs line-clamp-2 group-hover:text-indigo-300 transition-colors">
                        {sample.styleName}
                      </h4>
                      <div className="mt-2 text-[11px] text-slate-400 space-y-0.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate">Buyer: <strong className="text-slate-200">{sample.buyer}</strong></span>
                          <SampleTypeBadge sampleType={sample.sampleType} size="xs" />
                        </div>
                        <div>PO: <span className="font-mono text-slate-300">{sample.poNumber}</span></div>
                        <div>Line: <span className="font-mono text-slate-300">{sample.lineCode}</span></div>
                        <div className="grid grid-cols-2 gap-1 pt-1 font-mono text-[10px]">
                          <div className="px-1.5 py-1 rounded bg-indigo-950/80 border border-indigo-500/40 text-indigo-200">
                            <span className="text-[8px] uppercase block text-indigo-300 font-bold">Size Name</span>
                            <strong className="text-white">{getEffectiveSizeName(sample)}</strong>
                          </div>
                          <div className="px-1.5 py-1 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                            <span className="text-[8px] uppercase block text-emerald-300 font-bold">Total Qty</span>
                            <strong className="text-emerald-200 font-black">{getEffectiveRequisitionQuantity(sample)} Pcs</strong>
                          </div>
                        </div>
                        <div>Fabric: <span className="font-mono text-slate-300">{sample.fabricCode}</span></div>
                        <div className="text-emerald-400 font-mono text-[10px] font-bold">
                          Cons: {getEffectivePerPcsConsumption(sample)} yds/pc • Ded: {sample.fabricRequiredYards} yds
                        </div>
                      </div>

                      {isParcelCompleted(sample) && isMerchandiser && (
                        <div className="mt-2 pt-1.5 border-t border-slate-700/60 flex items-center justify-between text-[10px]">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleWorkbookSent && onToggleWorkbookSent(sample.id);
                            }}
                            className={`px-1.5 py-0.5 rounded font-bold cursor-pointer ${
                              sample.parcelDetails.workbookSent
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {sample.parcelDetails.workbookSent ? '✅ WB Sent' : '⚠️ WB Pending'}
                          </button>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenFollowUp && onOpenFollowUp(sample);
                              }}
                              className="p-1 text-slate-300 hover:text-white bg-slate-700 rounded"
                              title="Follow-Up"
                            >
                              <Phone className="w-3 h-3 text-emerald-400" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSendWhatsApp &&
                                  onSendWhatsApp(
                                    sample,
                                    sample.parcelDetails.followUp?.whatsAppNumber || ''
                                  );
                              }}
                              className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded shadow"
                              title="WhatsApp"
                            >
                              <MessageCircle className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="mt-2 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 font-mono">
                          Parcel: {sample.parcelDetails.parcelDate || sample.targetParcelDate}
                        </span>
                        <div className="flex items-center gap-1">
                          {onOpenRequisitionSlip && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenRequisitionSlip(sample);
                              }}
                              className="px-1.5 py-0.8 rounded bg-emerald-950/80 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-300 hover:text-white font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Print Preview & Print Requisition"
                            >
                              <Printer className="w-3 h-3" />
                              <span>Print</span>
                            </button>
                          )}
                          {config.nextStage && canUserAdvanceStage(userRole, sample.stage, config.nextStage) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onAdvanceStage(sample);
                              }}
                              className="px-2 py-0.8 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1 shadow transition-colors cursor-pointer"
                              title={`Move to ${STAGE_CONFIG[config.nextStage].shortLabel}`}
                            >
                              <span>Move</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    );
                  })}
                  {stageSamples.length === 0 && (
                    <div className="py-8 text-center text-slate-600 text-[11px] border border-dashed border-slate-800 rounded-xl">
                      Empty stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
