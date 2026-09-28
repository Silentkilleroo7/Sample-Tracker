import React, { useState, useMemo } from 'react';
import { FabricItem, isFabricLowStock } from '../types/fabric';
import { SampleItem } from '../types/sample';
import {
  ScrollText,
  AlertOctagon,
  Search,
  Plus,
  ArrowUpDown,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Eye,
  Lock,
  Ruler,
} from 'lucide-react';

interface FabricInventoryViewProps {
  fabrics: FabricItem[];
  samples: SampleItem[];
  isViewOnly?: boolean;
  onRestockFabric: (fabric: FabricItem) => void;
  onAddNewFabric: () => void;
  onDeductFabric: (fabric: FabricItem) => void;
  onSelectSampleByCode: (styleCode: string) => void;
}

export const FabricInventoryView: React.FC<FabricInventoryViewProps> = ({
  fabrics,
  isViewOnly = false,
  onRestockFabric,
  onAddNewFabric,
  onDeductFabric,
  onSelectSampleByCode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'critical' | 'sufficient'>('all');
  const [sortField, setSortField] = useState<'code' | 'availableYards' | 'name'>('availableYards');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const filteredFabrics = useMemo(() => {
    let result = [...fabrics];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (f) =>
          f.code.toLowerCase().includes(q) ||
          f.name.toLowerCase().includes(q) ||
          f.supplier.toLowerCase().includes(q) ||
          f.composition.toLowerCase().includes(q) ||
          f.color.toLowerCase().includes(q) ||
          f.linkedStyleCodes.some((sc) => sc.toLowerCase().includes(q))
      );
    }

    if (stockFilter === 'critical') {
      result = result.filter(isFabricLowStock);
    } else if (stockFilter === 'sufficient') {
      result = result.filter((f) => !isFabricLowStock(f));
    }

    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'code') {
        comparison = a.code.localeCompare(b.code);
      } else if (sortField === 'availableYards') {
        comparison = a.availableYards - b.availableYards;
      } else if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [fabrics, searchQuery, stockFilter, sortField, sortOrder]);

  const criticalCount = fabrics.filter(isFabricLowStock).length;
  const totalItems = filteredFabrics.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedFabrics = filteredFabrics.slice(
    (validCurrentPage - 1) * pageSize,
    validCurrentPage * pageSize
  );

  return (
    <div className="space-y-6">
      {/* View-Only Banner for Sewing User */}
      {isViewOnly && (
        <div className="p-4 rounded-xl bg-amber-950/35 border border-amber-500/45 flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                  Fabric Inventory — View Mode Only (No Edit Access)
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Lock className="w-2.5 h-2.5" /> Read-Only Access
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Sewing Department users can inspect fabric stock, linked styles, and per-pcs consumption rates in view-only mode, with no modification access.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-2">
            <ScrollText className="w-3.5 h-3.5" />
            Fabric Inventory & Style Linkage Control
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Raw Material & Fabric Stock Inventory
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Fabrics are dynamically linked with style codes and per-piece consumption (yds/pc). Exact total yardage is automatically deducted when requisitions are placed.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isViewOnly ? (
            <button
              onClick={onAddNewFabric}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Fabric</span>
            </button>
          ) : (
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/90 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              View Mode (No Access)
            </div>
          )}
        </div>
      </div>

      {/* Critical Stock Warning Banner if any fabric <= 5 yds */}
      {criticalCount > 0 && (
        <div className="p-4 rounded-xl bg-rose-950/80 border-2 border-rose-500/70 text-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 animate-bounce">
              <AlertOctagon className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-wide flex items-center gap-2 text-white">
                Dashboard Report: {criticalCount} Fabric{criticalCount > 1 ? 's' : ''} with ≤ 5 Yds Stock (Critical Red)
              </h4>
              <p className="text-xs text-rose-200 mt-0.5">
                These materials need immediate mill reorder to prevent sample cutting delays for linked styles.
              </p>
            </div>
          </div>
          <button
            onClick={() => setStockFilter('critical')}
            className="px-3 py-1.5 rounded-lg bg-white text-rose-950 font-bold text-xs hover:bg-rose-100 transition-colors shadow shrink-0 cursor-pointer"
          >
            Filter Critical Only
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-slate-900/80 p-3 sm:p-3.5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 text-xs">
        <div className="relative flex-1 min-w-0 sm:min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by Fabric Code, Name, Linked Style, Supplier..."
            className="w-full min-h-[42px] bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 sm:pb-0">
          <button
            onClick={() => setStockFilter('all')}
            className={`min-h-[40px] px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
              stockFilter === 'all'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All Fabrics ({fabrics.length})
          </button>
          <button
            onClick={() => setStockFilter('critical')}
            className={`min-h-[40px] px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              stockFilter === 'critical'
                ? 'bg-rose-600 text-white shadow'
                : 'bg-slate-800 text-rose-400 hover:bg-rose-950/40 border border-rose-500/30'
            }`}
          >
            <span>≤ 5 Yds (Red Alert)</span>
            <span className="font-mono px-1.5 py-0.2 rounded bg-rose-950 text-white text-[10px]">
              {criticalCount}
            </span>
          </button>
          <button
            onClick={() => setStockFilter('sufficient')}
            className={`min-h-[40px] px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
              stockFilter === 'sufficient'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Sufficient ({fabrics.length - criticalCount})
          </button>
        </div>

        <div className="flex items-center justify-end gap-1.5 text-slate-400">
          <span>Rows:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="min-h-[40px] bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-slate-200 font-mono"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>
      </div>

      {/* Fabrics Container: Mobile Card List + Desktop Table */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        {/* MOBILE FABRIC CARDS (< md) */}
        <div className="md:hidden divide-y divide-slate-800">
          {paginatedFabrics.map((fabric) => {
            const isCritical = isFabricLowStock(fabric);

            return (
              <div
                key={fabric.id}
                className={`p-3.5 space-y-3 ${
                  isCritical
                    ? 'bg-rose-950/20 border-l-4 border-l-rose-500'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono font-black text-xs px-2 py-0.5 rounded border ${
                          isCritical
                            ? 'bg-rose-600 text-white border-rose-400'
                            : 'bg-slate-800 text-indigo-300 border-indigo-500/30'
                        }`}
                      >
                        {fabric.code}
                      </span>
                      {isCritical && (
                        <span className="text-[10px] font-bold text-rose-400 uppercase">
                          ≤5 Yds Alert
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-white text-sm mt-1">
                      {fabric.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {fabric.composition} · {fabric.gsm} GSM · {fabric.widthInches}" · {fabric.color}
                    </p>
                  </div>

                  <div className="text-right font-mono shrink-0">
                    <div
                      className={`text-sm font-black tabular-nums ${
                        isCritical ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {Number(fabric.availableYards.toFixed(2))} yds
                    </div>
                    <div className="text-[10px] text-slate-500 tabular-nums">
                      Alloc: {Number(fabric.allocatedYards.toFixed(2))} yds
                    </div>
                  </div>
                </div>

                {/* Per-Pcs Consumption & Supplier */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  {fabric.perPcsConsumptionYards && fabric.perPcsConsumptionYards > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/50 border border-emerald-500/35 text-[10px] font-mono font-bold text-emerald-300">
                      <Ruler className="w-3 h-3 text-emerald-400" />
                      {fabric.perPcsConsumptionYards} yds/pc (Locked)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950/60 border border-slate-800 text-[10px] font-mono text-slate-500">
                      <Ruler className="w-3 h-3 text-slate-500" />
                      Set on 1st requisition
                    </span>
                  )}

                  <span className="text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    {fabric.supplier} · {fabric.location}
                  </span>
                </div>

                {/* Linked Styles */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 mr-1">Styles:</span>
                  {fabric.linkedStyleCodes.map((sc) => (
                    <button
                      key={sc}
                      onClick={() => onSelectSampleByCode(sc)}
                      className="min-h-[32px] font-mono text-[11px] font-bold px-2 py-1 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                    >
                      {sc}
                    </button>
                  ))}
                  {fabric.linkedStyleCodes.length === 0 && (
                    <span className="text-slate-500 text-[11px] italic">
                      No style linked
                    </span>
                  )}
                </div>

                {/* Mobile Actions */}
                <div className="pt-1 flex items-center justify-between gap-2">
                  {!isViewOnly ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onRestockFabric(fabric)}
                        className="flex-1 min-h-[42px] px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Restock Roll</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeductFabric(fabric)}
                        className="min-h-[42px] px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        - Deduct
                      </button>
                    </>
                  ) : (
                    <div className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs font-semibold flex items-center justify-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      <span>View Mode Only (No Edit Access)</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {paginatedFabrics.length === 0 && (
            <div className="py-12 px-4 text-center text-slate-400 text-xs">
              No fabrics found matching the filter.
            </div>
          )}
        </div>

        {/* DESKTOP FABRICS TABLE (md and up) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/90 text-slate-400 uppercase text-[11px] font-bold tracking-wider border-b border-slate-700/80">
              <tr>
                <th
                  onClick={() => {
                    setSortField('code');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className="py-3 px-4 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Fabric Code</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Fabric Description & Specs</th>
                <th className="py-3 px-4">Linked Styles</th>
                <th
                  onClick={() => {
                    setSortField('availableYards');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className="py-3 px-4 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Stock Status (Yards)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Supplier & Location</th>
                <th className="py-3 px-4 text-right">Quick Stock Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {paginatedFabrics.map((fabric) => {
                const isCritical = isFabricLowStock(fabric);

                return (
                  <tr
                    key={fabric.id}
                    className={`transition-colors ${
                      isCritical
                        ? 'bg-rose-950/20 hover:bg-rose-950/35 border-l-4 border-l-rose-500'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-black text-xs px-2 py-0.5 rounded border ${
                            isCritical
                              ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-950'
                              : 'bg-slate-800 text-indigo-300 border-indigo-500/30'
                          }`}
                        >
                          {fabric.code}
                        </span>
                        {isCritical && (
                          <span className="text-[10px] font-bold text-rose-400 animate-pulse uppercase">
                            ≤5 YDS
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-xs">
                        {fabric.name}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {fabric.composition} • {fabric.gsm} GSM • {fabric.widthInches}" width • {fabric.color}
                      </div>
                      {fabric.perPcsConsumptionYards && fabric.perPcsConsumptionYards > 0 ? (
                        <div className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-md bg-emerald-950/50 border border-emerald-500/35 text-[10px] font-mono font-bold text-emerald-300">
                          <Ruler className="w-3 h-3 text-emerald-400" />
                          Per-Pcs Consumption: {fabric.perPcsConsumptionYards} yds/pc (Locked)
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-md bg-slate-950/60 border border-slate-800 text-[10px] font-mono text-slate-500">
                          <Ruler className="w-3 h-3 text-slate-500" />
                          Consumption set on 1st requisition
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {fabric.linkedStyleCodes.map((sc) => (
                          <button
                            key={sc}
                            onClick={() => onSelectSampleByCode(sc)}
                            className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                            title="Click to view sample details"
                          >
                            {sc}
                          </button>
                        ))}
                        {fabric.linkedStyleCodes.length === 0 && (
                          <span className="text-slate-500 text-[11px] italic">
                            No style linked
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <div className="flex items-baseline gap-2">
                        <span
                          className={`text-sm font-black ${
                            isCritical ? 'text-rose-400 font-bold' : 'text-emerald-400'
                          }`}
                        >
                          {Number(fabric.availableYards.toFixed(2))} yds
                        </span>
                        <span className="text-[11px] text-slate-500">
                          (Allocated: {Number(fabric.allocatedYards.toFixed(2))} yds)
                        </span>
                      </div>
                      <div className="w-28 bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          style={{
                            width: `${Math.min(100, (fabric.availableYards / 50) * 100)}%`,
                          }}
                          className={`h-full rounded-full ${
                            isCritical ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                          }`}
                        />
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-200 font-medium">
                        {fabric.supplier}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {fabric.location}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {!isViewOnly ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onRestockFabric(fabric)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1 shadow transition-all cursor-pointer"
                            title="Receive new roll or add yardage"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Restock</span>
                          </button>
                          <button
                            onClick={() => onDeductFabric(fabric)}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                            title="Deduct sample cutting consumption"
                          >
                            - Deduct
                          </button>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 text-[11px] font-semibold">
                          <Eye className="w-3 h-3 text-amber-400" /> View Mode Only
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {paginatedFabrics.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No fabrics found matching the filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3.5 bg-slate-800/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing {(validCurrentPage - 1) * pageSize + 1} to{' '}
            {Math.min(validCurrentPage * pageSize, totalItems)} of {totalItems} fabrics
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={validCurrentPage === 1}
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-slate-200 px-2">
              Page {validCurrentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={validCurrentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
