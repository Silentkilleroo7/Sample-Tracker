import React, { useState, useMemo } from 'react';
import {
  SampleItem,
  StyleCatalogItem,
  aggregateStylesFromSamples,
  STAGE_CONFIG,
  getSampleTypeTone,
  SampleStage,
} from '../types/sample';
import { UserRole } from '../types/auth';
import { StyleProductImage } from './StyleProductImage';
import { AppView } from './Sidebar';
import {
  Search,
  X,
  Plus,
  Filter,
  Layers,
  Printer,
  ArrowRight,
  Eye,
  Tag,
  ScrollText,
  Copy,
  Check,
  Calendar,
  Sparkles,
  Scissors,
  Waves,
  PackageCheck,
  MessageSquare,
  AlertCircle,
  Shirt,
} from 'lucide-react';

interface StylesSectionViewProps {
  samples: SampleItem[];
  userRole?: UserRole;
  onSelectSample: (sample: SampleItem) => void;
  onOpenRequisitionPrint: (sample: SampleItem) => void;
  onNewRequisitionForStyle: (sample: SampleItem) => void;
  onNewRequisition: () => void;
  onNavigateToView: (view: AppView, filter?: { stage?: SampleStage }) => void;
}

export const StylesSectionView: React.FC<StylesSectionViewProps> = ({
  samples,
  userRole = 'merchandiser',
  onSelectSample,
  onOpenRequisitionPrint,
  onNewRequisitionForStyle,
  onNewRequisition,
  onNavigateToView,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [buyerFilter, setBuyerFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'code-asc' | 'code-desc' | 'colors' | 'samples'>('recent');
  const [expandedStyleKey, setExpandedStyleKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Aggregate all samples into consolidated styles based on Style Number AND Style Description
  const allStyles: StyleCatalogItem[] = useMemo(() => {
    return aggregateStylesFromSamples(samples);
  }, [samples]);

  // Extract unique buyers for filter dropdown
  const uniqueBuyers = useMemo(() => {
    const set = new Set<string>();
    allStyles.forEach((s) => {
      if (s.buyer) set.add(s.buyer);
    });
    return Array.from(set).sort();
  }, [allStyles]);

  // Filter & Search logic
  const filteredStyles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return allStyles.filter((style) => {
      // 1. Text Search across Style Code, Description, Buyer, Colors, Washes, Fabrics, PO
      if (q) {
        const matchCode = style.styleCode.toLowerCase().includes(q);
        const matchName = style.styleName.toLowerCase().includes(q);
        const matchBuyer = style.buyer.toLowerCase().includes(q);
        const matchPo = (style.poNumber || '').toLowerCase().includes(q);
        const matchColor = style.colors.some(
          (c) =>
            c.color.toLowerCase().includes(q) ||
            (c.wash && c.wash.toLowerCase().includes(q)) ||
            (c.fabricCode && c.fabricCode.toLowerCase().includes(q))
        );
        const matchFabric = style.fabrics.some(
          (f) =>
            f.fabricCode.toLowerCase().includes(q) ||
            (f.fabricName && f.fabricName.toLowerCase().includes(q))
        );
        const matchSamples = style.samples.some(
          (s) =>
            (s.sampleType && s.sampleType.toLowerCase().includes(q)) ||
            (s.blNumber && s.blNumber.toLowerCase().includes(q))
        );

        if (!matchCode && !matchName && !matchBuyer && !matchPo && !matchColor && !matchFabric && !matchSamples) {
          return false;
        }
      }

      // 2. Buyer Filter
      if (buyerFilter !== 'all' && style.buyer.toLowerCase() !== buyerFilter.toLowerCase()) {
        return false;
      }

      // 3. Stage Filter
      if (stageFilter !== 'all') {
        if (!style.activeStages.includes(stageFilter as SampleStage)) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'code-asc') return a.styleCode.localeCompare(b.styleCode);
      if (sortBy === 'code-desc') return b.styleCode.localeCompare(a.styleCode);
      if (sortBy === 'colors') return b.colors.length - a.colors.length;
      if (sortBy === 'samples') return b.sampleCount - a.sampleCount;
      // Default: recent
      return new Date(b.lastRequisitionDate).getTime() - new Date(a.lastRequisitionDate).getTime();
    });
  }, [allStyles, searchQuery, buyerFilter, stageFilter, sortBy]);

  // Overall statistics
  const totalColorways = useMemo(() => {
    return allStyles.reduce((sum, s) => sum + s.colors.length, 0);
  }, [allStyles]);

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(code);
    setCopiedKey(code);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const isMerchandiser = userRole === 'merchandiser';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. TOP HEADER & OVERVIEW */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400">
                <Shirt className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>Styles Module</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold">
                    {allStyles.length} {allStyles.length === 1 ? 'Style' : 'Styles'} Saved
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Consolidated by <strong>Style Number &amp; Description</strong> • All colorways, washes, and fabric selections saved in one style
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isMerchandiser && (
              <button
                type="button"
                onClick={onNewRequisition}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-900/30 transition-all cursor-pointer flex items-center gap-2 shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>New Style Requisition</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. STATS PILLS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Styles</span>
            <span className="text-lg font-black text-white font-mono">{allStyles.length}</span>
          </div>
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Colorways</span>
            <span className="text-lg font-black text-cyan-400 font-mono">{totalColorways}</span>
          </div>
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Requisitions</span>
            <span className="text-lg font-black text-emerald-400 font-mono">{samples.length}</span>
          </div>
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Matching Filter</span>
            <span className="text-lg font-black text-amber-400 font-mono">{filteredStyles.length}</span>
          </div>
        </div>
      </div>

      {/* 3. PROMINENT SEARCH OPTIONS ON TOP OF STYLES LIST */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Style #, Description, Buyer, Color, Wash, Fabric Code, PO..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Buyer Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Buyer:</span>
              <select
                value={buyerFilter}
                onChange={(e) => setBuyerFilter(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-xs"
              >
                <option value="all" className="bg-slate-900">All Buyers</option>
                {uniqueBuyers.map((b) => (
                  <option key={b} value={b} className="bg-slate-900">
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Stage Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Status:</span>
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-xs"
              >
                <option value="all" className="bg-slate-900">All Stages</option>
                <option value="requisition" className="bg-slate-900">Requisition</option>
                <option value="sewing" className="bg-slate-900">Sewing</option>
                <option value="wash" className="bg-slate-900">Wash</option>
                <option value="finishing" className="bg-slate-900">Finishing</option>
                <option value="ready_for_parcel" className="bg-slate-900">Ready for Parcel</option>
                <option value="approval_comments" className="bg-slate-900">Approval Comments</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-xs"
              >
                <option value="recent" className="bg-slate-900">Recent Requisition</option>
                <option value="code-asc" className="bg-slate-900">Style # (A-Z)</option>
                <option value="code-desc" className="bg-slate-900">Style # (Z-A)</option>
                <option value="colors" className="bg-slate-900">Most Colors</option>
                <option value="samples" className="bg-slate-900">Most Samples</option>
              </select>
            </div>

            {(searchQuery || buyerFilter !== 'all' || stageFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setBuyerFilter('all');
                  setStageFilter('all');
                }}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Results helper info banner */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>
            Showing <strong>{filteredStyles.length}</strong> of <strong>{allStyles.length}</strong> saved styles
            {searchQuery && (
              <span> matching &ldquo;<span className="text-emerald-300 font-semibold">{searchQuery}</span>&rdquo;</span>
            )}
          </span>
          <span className="hidden sm:inline text-[11px] text-slate-500">
            Colors consolidated by matching Style # &amp; Description
          </span>
        </div>
      </div>

      {/* 4. STYLES LIST / CARDS */}
      {filteredStyles.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No styles found matching criteria</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try adjusting your search terms or clearing filters. You can also create a new style requisition to save a new style.
          </p>
          <div className="flex justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setBuyerFilter('all');
                setStageFilter('all');
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
            >
              Clear All Filters
            </button>
            {isMerchandiser && (
              <button
                type="button"
                onClick={onNewRequisition}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
              >
                Create New Style
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredStyles.map((style) => {
            const isExpanded = expandedStyleKey === style.styleKey;
            const latestSample = style.samples[0] || null;

            return (
              <div
                key={style.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-lg transition-all"
              >
                <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
                  {/* Left: Thumbnail & Info */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    {/* Style Thumbnail */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 relative flex items-center justify-center">
                      {style.thumbnail ? (
                        <img
                          src={style.thumbnail}
                          alt={style.styleCode}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-1">
                          <Shirt className="w-6 h-6 text-emerald-500/70 mx-auto" />
                          <span className="text-[9px] font-mono text-slate-500 block truncate">
                            {style.styleCode}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Style Code Badge */}
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 font-mono font-black text-sm">
                          <span>{style.styleCode}</span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyCode(style.styleCode, e)}
                            className="text-emerald-400 hover:text-white cursor-pointer ml-1"
                            title="Copy Style Code"
                          >
                            {copiedKey === style.styleCode ? (
                              <Check className="w-3.5 h-3.5 text-emerald-300" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>

                        {/* Buyer Badge */}
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 text-xs font-semibold">
                          {style.buyer}
                        </span>

                        {style.poNumber && (
                          <span className="text-xs font-mono text-slate-400">
                            PO: {style.poNumber}
                          </span>
                        )}

                        <span className="text-[11px] text-slate-500 ml-auto hidden sm:inline">
                          {style.sampleCount} Requisition{style.sampleCount > 1 ? 's' : ''} • {style.totalQuantity} Pcs
                        </span>
                      </div>

                      {/* Style Description */}
                      <h2 className="text-base sm:text-lg font-bold text-white mt-1.5 truncate">
                        {style.styleName}
                      </h2>

                      {/* Subtitle / Details */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1">
                        {style.perPcsConsumptionYards && style.perPcsConsumptionYards > 0 && (
                          <span className="text-emerald-400 font-medium">
                            Fabric Consumption: <strong>{style.perPcsConsumptionYards} yds/pc</strong>
                          </span>
                        )}
                        <span>
                          First: {new Date(style.firstRequisitionDate).toLocaleDateString()}
                        </span>
                        <span>
                          Updated: {new Date(style.lastRequisitionDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-center justify-end shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800 w-full lg:w-auto">
                    {latestSample && (
                      <button
                        type="button"
                        onClick={() => onOpenRequisitionPrint(latestSample)}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Print Sheet</span>
                      </button>
                    )}

                    {latestSample && (
                      <button
                        type="button"
                        onClick={() => onSelectSample(latestSample)}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        <span>View Details</span>
                      </button>
                    )}

                    {isMerchandiser && latestSample && (
                      <button
                        type="button"
                        onClick={() => onNewRequisitionForStyle(latestSample)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-950"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Add Color / Sample</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 5. CONSOLIDATED COLORS SECTION: All colors listed under one style */}
                <div className="mt-4 pt-3.5 border-t border-slate-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      <span>
                        Consolidated Colorways for this Style ({style.colors.length} {style.colors.length === 1 ? 'Color' : 'Colors'}):
                      </span>
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Based on Style # {style.styleCode} &amp; matching Description
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {style.colors.map((cw, cIdx) => {
                      const stageLabel = cw.stage ? STAGE_CONFIG[cw.stage]?.label || cw.stage : 'Requisition';
                      const stageColor = cw.stage ? STAGE_CONFIG[cw.stage]?.color || 'emerald' : 'emerald';

                      return (
                        <div
                          key={`${cw.color}-${cw.wash}-${cw.fabricCode}-${cIdx}`}
                          className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-1.5 hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0"></span>
                              <strong className="text-xs text-white truncate">{cw.color}</strong>
                            </div>
                            {cw.stage && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                                {stageLabel}
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-400 flex flex-col gap-0.5 font-mono">
                            <div className="truncate">
                              <span className="text-slate-500">Wash:</span>{' '}
                              <span className="text-cyan-200">{cw.wash || 'Standard Wash'}</span>
                            </div>
                            {cw.fabricCode && (
                              <div className="truncate">
                                <span className="text-slate-500">Fabric:</span>{' '}
                                <span className="text-emerald-300 font-bold">{cw.fabricCode}</span>
                                {cw.fabricName && <span className="text-slate-500 text-[10px]"> ({cw.fabricName})</span>}
                              </div>
                            )}
                            {cw.sizes && (
                              <div className="text-[10px] text-slate-500 truncate">
                                Sizes: {cw.sizes}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 6. FABRICS SUMMARY */}
                {style.fabrics.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                      <ScrollText className="w-3 h-3 text-emerald-400" />
                      <span>Fabrics Used:</span>
                    </span>
                    {style.fabrics.map((f, fIdx) => (
                      <span
                        key={`${f.fabricCode}-${fIdx}`}
                        className="px-2 py-0.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono"
                      >
                        <strong>{f.fabricCode}</strong>
                        {f.fabricName ? ` · ${f.fabricName}` : ''}
                        {f.usedForColors && f.usedForColors.length > 0 && (
                          <span className="text-emerald-400/80 text-[10px] ml-1">
                            (for: {f.usedForColors.join(', ')})
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
