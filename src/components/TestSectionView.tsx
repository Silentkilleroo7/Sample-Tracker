import React, { useState, useMemo } from 'react';
import {
  FlaskConical,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Calendar,
  AlertTriangle,
  Building2,
  FileText,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import {
  BVTestItem,
  isTestOverdueForResubmission,
  get24HCountdownText,
} from '../types/test';
import { SampleItem } from '../types/sample';
import { FabricItem } from '../types/fabric';
import { StyleProductImage } from './StyleProductImage';

interface TestSectionViewProps {
  tests: BVTestItem[];
  samples: SampleItem[];
  fabrics: FabricItem[];
  onOpenNewTestModal: () => void;
  onOpenUpdateResultModal: (test: BVTestItem) => void;
  onOpenResubmitModal: (test: BVTestItem) => void;
  onDeleteTest?: (testId: string) => void;
}

export const TestSectionView: React.FC<TestSectionViewProps> = ({
  tests,
  samples,
  onOpenNewTestModal,
  onOpenUpdateResultModal,
  onOpenResubmitModal,
}) => {
  const [filterTab, setFilterTab] = useState<
    'all' | 'pending' | 'passed' | 'failed' | 'retest_submitted' | 'garment' | 'fabric'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');

  const failedNeedingRetest = useMemo(() => {
    return tests.filter((t) => t.status === 'failed' && t.reTestRequired);
  }, [tests]);

  const overdue24hTests = useMemo(() => {
    return tests.filter((t) => isTestOverdueForResubmission(t));
  }, [tests]);

  const filteredTests = useMemo(() => {
    let list = tests;
    if (filterTab === 'pending') {
      list = list.filter((t) => t.status === 'pending');
    } else if (filterTab === 'passed') {
      list = list.filter((t) => t.status === 'passed');
    } else if (filterTab === 'failed') {
      list = list.filter((t) => t.status === 'failed');
    } else if (filterTab === 'retest_submitted') {
      list = list.filter((t) => t.status === 'retest_submitted');
    } else if (filterTab === 'garment') {
      list = list.filter((t) => t.sampleType === 'garment');
    } else if (filterTab === 'fabric') {
      list = list.filter((t) => t.sampleType === 'fabric');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.styleCode?.toLowerCase().includes(q) ||
          t.styleName?.toLowerCase().includes(q) ||
          t.fabricCode?.toLowerCase().includes(q) ||
          t.fabricName?.toLowerCase().includes(q) ||
          t.buyer?.toLowerCase().includes(q) ||
          t.reportNumber?.toLowerCase().includes(q) ||
          t.failReason?.toLowerCase().includes(q) ||
          t.testingAgency?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [tests, filterTab, searchQuery]);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 p-6 rounded-2xl border border-blue-500/30 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold mb-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            Bureau Veritas (BV) Quality Assurance Laboratory
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <FlaskConical className="w-7 h-7 text-blue-400" />
            <span>Test Module (BV Lab Testing)</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Send Fabrics or Garment Samples to Bureau Veritas (BV) for testing. Track official report numbers, pH-Value and physical/chemical test decisions, failure reasons, and automatic 24-hour re-test resubmissions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 relative z-10 shrink-0">
          <button
            onClick={onOpenNewTestModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Send Sample to BV
          </button>
        </div>
      </div>

      {/* 2. 24-Hour Re-Test Notification Alert Banner */}
      {overdue24hTests.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/80 via-rose-900/60 to-rose-950/80 border-2 border-rose-500 shadow-2xl shadow-rose-950/40 animate-pulse">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shrink-0 shadow-lg">
                <ShieldAlert className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-rose-500 text-white font-mono font-black text-[10px] uppercase">
                    24-Hour Alert
                  </span>
                  <h3 className="font-black text-white text-sm">
                    {overdue24hTests.length} Failed Sample(s) Reached 24-Hour Resubmission Window!
                  </h3>
                </div>
                <p className="text-xs text-rose-200/90 mt-0.5 leading-relaxed">
                  Per standard operating procedure, samples that failed BV quality tests (such as pH-Value or shrinkage) must be re-processed in wash/production and resubmitted to Bureau Veritas within 24 hours.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setFilterTab('failed')}
                className="px-3.5 py-1.5 bg-rose-800 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                View Failed Tests ({overdue24hTests.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Live Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3.5 text-xs">
        <div
          onClick={() => setFilterTab('all')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            filterTab === 'all'
              ? 'bg-blue-950/50 border-blue-500 ring-2 ring-blue-400/40'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="text-slate-400 text-[11px] font-semibold">Total BV Tests</div>
          <div className="text-xl font-black font-mono text-white mt-0.5">{tests.length}</div>
          <div className="text-[10px] text-slate-500 mt-1">
            {tests.filter((t) => t.sampleType === 'garment').length} Garments •{' '}
            {tests.filter((t) => t.sampleType === 'fabric').length} Fabrics
          </div>
        </div>

        <div
          onClick={() => setFilterTab('pending')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            filterTab === 'pending'
              ? 'bg-cyan-950/50 border-cyan-500 ring-2 ring-cyan-400/40'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="text-cyan-300 text-[11px] font-semibold flex items-center justify-between">
            <span>Pending BV Result</span>
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-black font-mono text-cyan-200 mt-0.5">
            {tests.filter((t) => t.status === 'pending').length}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Under laboratory incubation</div>
        </div>

        <div
          onClick={() => setFilterTab('passed')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            filterTab === 'passed'
              ? 'bg-emerald-950/50 border-emerald-500 ring-2 ring-emerald-400/40'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="text-emerald-300 text-[11px] font-semibold flex items-center justify-between">
            <span>Passed (Compliant)</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-black font-mono text-emerald-200 mt-0.5">
            {tests.filter((t) => t.status === 'passed').length}
          </div>
          <div className="text-[10px] text-emerald-400/80 mt-1">Valid BV reports issued</div>
        </div>

        <div
          onClick={() => setFilterTab('failed')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            filterTab === 'failed'
              ? 'bg-rose-950/50 border-rose-500 ring-2 ring-rose-400/40'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="text-rose-300 text-[11px] font-semibold flex items-center justify-between">
            <span>Failed / Needs Re-Test</span>
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-black font-mono text-rose-200 mt-0.5">
            {failedNeedingRetest.length}
          </div>
          <div className="text-[10px] text-rose-300 mt-1 font-mono">
            {overdue24hTests.length > 0 ? `⚠️ ${overdue24hTests.length} past 24h` : 'Fail reasons documented'}
          </div>
        </div>

        <div
          onClick={() => setFilterTab('retest_submitted')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer col-span-2 sm:col-span-1 ${
            filterTab === 'retest_submitted'
              ? 'bg-amber-950/50 border-amber-500 ring-2 ring-amber-400/40'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="text-amber-300 text-[11px] font-semibold flex items-center justify-between">
            <span>Re-Submitted to BV</span>
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-black font-mono text-amber-200 mt-0.5">
            {tests.filter((t) => t.status === 'retest_submitted').length}
          </div>
          <div className="text-[10px] text-amber-400/80 mt-1">Awaiting 2nd test certificate</div>
        </div>
      </div>

      {/* 4. Controls, Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-thin text-xs">
          {[
            { id: 'all', label: 'All BV Tests', count: tests.length },
            { id: 'pending', label: '⏳ Pending', count: tests.filter((t) => t.status === 'pending').length },
            { id: 'passed', label: '✅ Passed', count: tests.filter((t) => t.status === 'passed').length },
            { id: 'failed', label: '❌ Failed (Re-Test)', count: failedNeedingRetest.length },
            { id: 'retest_submitted', label: '🔄 Re-Submitted', count: tests.filter((t) => t.status === 'retest_submitted').length },
            { id: 'garment', label: '👕 Garment Samples', count: tests.filter((t) => t.sampleType === 'garment').length },
            { id: 'fabric', label: '🧵 Fabric Swatches', count: tests.filter((t) => t.sampleType === 'fabric').length },
          ].map((tab) => {
            const active = filterTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  active
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    active ? 'bg-blue-800 text-white' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-72 shrink-0">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search report #, style, fabric, pH..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 5. Main Test Reports Dossier Grid */}
      <div className="space-y-4">
        {filteredTests.map((test) => {
          const isOverdue = isTestOverdueForResubmission(test);
          const countdown = get24HCountdownText(test);
          const linkedSample =
            samples.find((s) => s.id === test.sampleId || s.styleCode === test.styleCode) ||
            ({
              id: test.id,
              styleCode: test.styleCode || test.fabricCode || 'BV-SPEC',
              styleName: test.styleName || test.fabricName || 'BV Test Specimen',
              buyer: test.buyer,
              poNumber: test.poNumber || 'N/A',
              color: test.fabricName || 'Standard',
              fabricCode: test.fabricCode || 'FAB-BV',
              stage: 'wash',
            } as SampleItem);

          return (
            <div
              key={test.id}
              className={`p-5 rounded-2xl border transition-all ${
                test.status === 'failed'
                  ? isOverdue
                    ? 'bg-slate-900/95 border-rose-500/80 shadow-lg shadow-rose-950/30 ring-1 ring-rose-500/40'
                    : 'bg-slate-900/90 border-rose-500/40 hover:border-rose-400'
                  : test.status === 'passed'
                  ? 'bg-slate-900/90 border-emerald-500/30 hover:border-emerald-500/50'
                  : test.status === 'retest_submitted'
                  ? 'bg-slate-900/90 border-amber-500/30 hover:border-amber-500/50'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Top Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex flex-wrap items-center gap-3">
                  <StyleProductImage sample={linkedSample} size="sm" />
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`font-mono text-xs font-black px-2.5 py-0.5 rounded-lg border ${
                        test.sampleType === 'garment'
                          ? 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40'
                          : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      {test.sampleType === 'garment' ? 'GARMENT SAMPLE' : 'FABRIC SWATCH'}
                    </span>
                    <span className="font-mono text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      {test.sampleType === 'garment' ? test.styleCode : test.fabricCode}
                    </span>
                    <span className="text-xs text-slate-300 font-semibold truncate max-w-[260px]">
                      {test.sampleType === 'garment' ? test.styleName : test.fabricName}
                    </span>
                    <span className="text-slate-500 text-xs">•</span>
                    <span className="text-xs text-slate-400 font-medium">Buyer: <strong className="text-slate-200">{test.buyer}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                      test.status === 'passed'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : test.status === 'failed'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                        : test.status === 'retest_submitted'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    }`}
                  >
                    {test.status === 'passed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {test.status === 'failed' && <XCircle className="w-3.5 h-3.5" />}
                    {test.status === 'retest_submitted' && <RotateCcw className="w-3.5 h-3.5" />}
                    {test.status === 'pending' && <Clock className="w-3.5 h-3.5" />}
                    <span>{test.status.replace('_', ' ').toUpperCase()}</span>
                  </span>
                </div>
              </div>

              {/* Middle Section: BV Report Info & Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 my-3.5 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                    Testing Agency & Lab
                  </span>
                  <span className="text-slate-200 font-bold flex items-center gap-1.5 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="truncate">{test.testingAgency}</span>
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                    Official BV Report #
                  </span>
                  <span className="font-mono text-indigo-300 font-black text-xs block mt-0.5 truncate">
                    {test.reportNumber || 'Report Generation Pending'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                    Test Sending Date to BV
                  </span>
                  <span className="text-slate-200 font-mono flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{test.sentDate}</span>
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                    {test.status === 'passed'
                      ? 'Report Passed Date'
                      : test.status === 'failed'
                      ? 'Report Failed Date'
                      : 'Expected BV Result Date'}
                  </span>
                  <span className="font-mono font-bold flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span
                      className={
                        test.status === 'passed'
                          ? 'text-emerald-300'
                          : test.status === 'failed'
                          ? 'text-rose-300'
                          : 'text-cyan-300'
                      }
                    >
                      {test.resultDate || test.expectedDate}
                    </span>
                  </span>
                </div>
              </div>

              {/* Tested Parameters List */}
              <div className="mb-3">
                <span className="text-slate-500 text-[10px] uppercase font-semibold block mb-1">
                  Tested Quality & Eco-Chemical Parameters:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {test.testParameters.map((p, i) => (
                    <span
                      key={i}
                      className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${
                        p.toLowerCase().includes('ph')
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* FAILURE REASON & 24-HOUR NOTIFICATION PANEL */}
              {test.status === 'failed' && (
                <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/50 mb-3 space-y-2 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-rose-300 font-bold">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Failure Reason (Bureau Veritas Inspection):</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                          isOverdue
                            ? 'bg-rose-600 text-white border-rose-400 animate-pulse'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>{countdown.label}</span>
                      </span>
                      {test.reTestRequired && (
                        <span className="text-[10px] bg-rose-500/30 text-rose-200 border border-rose-500/50 font-bold px-2 py-0.5 rounded">
                          Re-Test Required
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-white font-medium text-xs leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-rose-500/30">
                    {test.failReason || 'Failed specification standards.'}
                  </p>

                  {test.failedParameters && test.failedParameters.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                      {test.failedParameters.map((fp, i) => (
                        <div
                          key={i}
                          className="p-2 rounded bg-slate-900/80 border border-rose-900/60"
                        >
                          <div className="text-rose-300 font-bold truncate">{fp.parameter}</div>
                          <div className="text-slate-400 mt-0.5">
                            Allowed: <strong className="text-slate-200">{fp.standardValue}</strong> • Actual:{' '}
                            <strong className="text-rose-400">{fp.actualValue}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {test.inspectorNotes && (
                    <div className="text-[11px] text-slate-300 italic pt-1">
                      Note: {test.inspectorNotes}
                    </div>
                  )}
                </div>
              )}

              {/* RE-SUBMITTED DOSSIER STATUS */}
              {test.status === 'retest_submitted' && (
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 mb-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-300 font-bold flex items-center gap-1.5">
                      <RotateCcw className="w-4 h-4 text-amber-400" />
                      Sample Re-Submitted to BV for Re-Test
                    </span>
                    <span className="font-mono text-[10px] text-amber-200 bg-amber-900/60 px-2 py-0.5 rounded border border-amber-500/40">
                      Re-Test Date: {test.resubmittedDate}
                    </span>
                  </div>
                  <div className="text-slate-300 text-[11px]">
                    Re-Test Report Reference:{' '}
                    <strong className="font-mono text-white">{test.retestReportNumber || `${test.reportNumber}-R1`}</strong>
                  </div>
                  {test.resubmissionNotes && (
                    <div className="text-slate-400 text-[11px] italic">
                      Corrective Action: {test.resubmissionNotes}
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="text-[11px] text-slate-500 font-mono">
                  PO: {test.poNumber || 'N/A'} • Sent: {test.sentDate}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenUpdateResultModal(test)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Update BV Report & Result</span>
                  </button>

                  {test.status === 'failed' && (
                    <button
                      type="button"
                      onClick={() => onOpenResubmitModal(test)}
                      className={`px-3 py-1.5 font-bold rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer text-white ${
                        isOverdue
                          ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/40 ring-2 ring-rose-400/50 animate-pulse'
                          : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                      }`}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Resubmit for Re-Test to BV</span>
                    </button>
                  )}

                  <span
                    className="px-2.5 py-1.5 text-emerald-400/80 bg-slate-800/60 border border-slate-700/60 rounded-lg flex items-center gap-1 text-[10px] font-semibold"
                    title="Permanent Record: Saved BV test records cannot be deleted directly from the frontend system"
                  >
                    <Lock className="w-3 h-3" />
                    <span>Permanent Record</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredTests.length === 0 && (
          <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-dashed border-slate-800 text-slate-400 space-y-3">
            <FlaskConical className="w-10 h-10 text-slate-600 mx-auto" />
            <div className="font-bold text-white text-sm">No Bureau Veritas (BV) Test Records Found</div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No samples or fabrics currently match this filter. Click &ldquo;Send Sample to BV&rdquo; to dispatch a new specimen for lab analysis.
            </p>
            <button
              onClick={onOpenNewTestModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Send Sample to BV
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
