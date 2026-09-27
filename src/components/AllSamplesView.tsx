import React, { useState, useMemo } from 'react';
import {
  SampleItem,
  SampleStage,
  STAGE_CONFIG,
  SamplePriority,
  isParcelCompleted,
  getSampleImage,
  getEffectiveShipmentDate,
  getDaysUntilShipment,
} from '../types/sample';
import { ProgressBar } from './ProgressBar';
import { StyleProductImage, useImageZoom } from './StyleProductImage';
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
} from 'lucide-react';

interface AllSamplesViewProps {
  samples: SampleItem[];
  searchQuery: string;
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
  const [selectedStage, setSelectedStage] = useState<SampleStage | 'all'>(initialStageFilter);
  const [selectedBuyer, setSelectedBuyer] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<SamplePriority | 'all'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const buyersList = useMemo(() => {
    return Array.from(new Set(samples.map((s) => s.buyer))).filter(Boolean);
  }, [samples]);

  const filteredSamples = useMemo(() => {
    let result = [...samples];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.styleCode.toLowerCase().includes(q) ||
          s.styleName.toLowerCase().includes(q) ||
          s.poNumber.toLowerCase().includes(q) ||
          s.lineCode.toLowerCase().includes(q) ||
          s.buyer.toLowerCase().includes(q) ||
          s.fabricCode.toLowerCase().includes(q) ||
          s.fabricName.toLowerCase().includes(q) ||
          s.sampleType.toLowerCase().includes(q) ||
          (s.sewingOperator && s.sewingOperator.toLowerCase().includes(q))
      );
    }

    if (selectedStage !== 'all') {
      result = result.filter((s) => s.stage === selectedStage);
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
  }, [samples, searchQuery, selectedStage, selectedBuyer, selectedPriority, sortField, sortOrder]);

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

  const STAGES_LIST: SampleStage[] = [
    'requisition',
    'sewing',
    'wash',
    'finishing',
    'ready_for_parcel',
    'approval_comments',
  ];

  return (
    <div className="space-y-5">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Sample Tracking Master Pipeline
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Total {samples.length} styles in workflow • Showing {filteredSamples.length} filtered styles
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
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
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Kanban Board View"
            >
              <Kanban className="w-4 h-4" />
              <span className="hidden md:inline">Kanban</span>
            </button>
          </div>

          <button
            onClick={onNewRequisition}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Style</span>
          </button>
        </div>
      </div>

      {/* Stage Tab Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        <button
          onClick={() => {
            setSelectedStage('all');
            setCurrentPage(1);
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
            selectedStage === 'all'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/60'
          }`}
        >
          All Stages ({samples.length})
        </button>

        {STAGES_LIST.map((stage) => {
          const cfg = STAGE_CONFIG[stage];
          const count = samples.filter((s) => s.stage === stage).length;
          const isActive = selectedStage === stage;

          return (
            <button
              key={stage}
              onClick={() => {
                setSelectedStage(stage);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60'
              }`}
            >
              <span>{cfg.label}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                  isActive ? 'bg-indigo-800 text-white' : 'bg-slate-900 text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Secondary Filter & Search Toolbar */}
      <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search Style, PO, Line Code, Buyer, Fabric..."
            className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white text-xs"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedBuyer}
            onChange={(e) => {
              setSelectedBuyer(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
            className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">🔴 Urgent</option>
            <option value="high">🟠 High</option>
            <option value="normal">🔵 Normal</option>
          </select>

          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="hidden sm:inline">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content: Table or Kanban */}
      {viewMode === 'table' ? (
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
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

                  return (
                    <tr
                      key={sample.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <StyleProductImage sample={sample} size="sm" />
                          <div
                            onClick={() => onSelectSample(sample)}
                            className="cursor-pointer min-w-0 flex-1"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-indigo-400 px-1.5 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/30 text-xs">
                                {sample.styleCode}
                              </span>
                              {sample.priority === 'urgent' && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                  URGENT
                                </span>
                              )}
                              {sample.isRequisitionLocked && (
                                <span
                                  className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 border border-amber-500/30 flex items-center gap-0.5"
                                  title="Requisition permanently saved & locked"
                                >
                                  <Lock className="w-2.5 h-2.5" />
                                  Locked
                                </span>
                              )}
                            </div>
                            <div className="font-semibold text-white mt-1 group-hover:text-indigo-300 transition-colors line-clamp-1">
                              {sample.styleName}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Color: {sample.color} • Wash: {sample.washDetails?.washType || 'N/A'} • Size: {sample.size} • Qty: {sample.quantity}
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
                          {sample.sampleType === 'Red Seal Sample' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                              Red Seal Sample
                            </span>
                          ) : sample.sampleType === 'Gold Seal Sample' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                              Gold Seal Sample
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              {sample.sampleType}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-mono text-xs font-semibold text-slate-200">
                          {sample.fabricCode}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[140px] mt-0.5">
                          {sample.fabricName}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Req: {sample.fabricRequiredYards} yds
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
                        {isParcelCompleted(sample) && (
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
                          {isParcelCompleted(sample) && (
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
                          {hasNextStage && (
                            <button
                              onClick={() => onAdvanceStage(sample)}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow transition-all cursor-pointer"
                              title={`Advance to ${STAGE_CONFIG[stageConfig.nextStage!].label}`}
                            >
                              <span>Next</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onModifyStoredStyle && (
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
                            className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Open & Print Sample Requisition Form"
                          >
                            <Printer className="w-4 h-4" />
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
                  {stageSamples.map((sample) => (
                    <div
                      key={sample.id}
                      onClick={() => onSelectSample(sample)}
                      className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/50 transition-all cursor-pointer shadow-md group"
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
                          {sample.priority === 'urgent' && (
                            <div className="absolute top-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-600/90 text-white shadow">
                              URGENT
                            </div>
                          )}
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
                          {sample.priority === 'urgent' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-600/90 text-white shadow">
                              URGENT
                            </span>
                          )}
                        </div>
                      )}
                      <h4 className="font-bold text-white text-xs line-clamp-2 group-hover:text-indigo-300 transition-colors">
                        {sample.styleName}
                      </h4>
                      <div className="mt-2 text-[11px] text-slate-400 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span>Buyer: <strong className="text-slate-200">{sample.buyer}</strong></span>
                          {sample.sampleType === 'Red Seal Sample' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                              Red Seal
                            </span>
                          )}
                        </div>
                        <div>PO: <span className="font-mono text-slate-300">{sample.poNumber}</span></div>
                        <div>Line: <span className="font-mono text-slate-300">{sample.lineCode}</span></div>
                        <div>Fabric: <span className="font-mono text-slate-300">{sample.fabricCode}</span></div>
                      </div>

                      {isParcelCompleted(sample) && (
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
                        {config.nextStage && (
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
                  ))}
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
