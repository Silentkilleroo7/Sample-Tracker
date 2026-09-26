import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  FileText,
} from 'lucide-react';
import { BVTestItem, TestFailureDetail } from '../types/test';

interface UpdateBVResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: BVTestItem | null;
  onSaveResult: (
    testId: string,
    resultData: {
      reportNumber: string;
      resultDate: string;
      overallResult: 'PASS' | 'FAIL';
      status: 'passed' | 'failed';
      failReason?: string;
      failedParameters?: TestFailureDetail[];
      reTestRequired: boolean;
      inspectorNotes?: string;
    }
  ) => void;
}

export const UpdateBVResultModal: React.FC<UpdateBVResultModalProps> = ({
  isOpen,
  onClose,
  test,
  onSaveResult,
}) => {
  const [reportNumber, setReportNumber] = useState<string>('');
  const [resultDate, setResultDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [overallResult, setOverallResult] = useState<'PASS' | 'FAIL'>('PASS');
  const [failReason, setFailReason] = useState<string>('');
  const [reTestRequired, setReTestRequired] = useState<boolean>(true);
  const [inspectorNotes, setInspectorNotes] = useState<string>('');

  useEffect(() => {
    if (test && isOpen) {
      const existingReport =
        test.reportNumber && test.reportNumber !== 'Pending BV Report'
          ? test.reportNumber.replace(' (In Testing)', '')
          : '';
      setReportNumber(existingReport);
      setResultDate(test.resultDate || new Date().toISOString().split('T')[0]);
      setOverallResult(test.overallResult === 'FAIL' ? 'FAIL' : 'PASS');
      setFailReason(test.failReason || '');
      setReTestRequired(true);
      setInspectorNotes(test.inspectorNotes || '');
    }
  }, [test, isOpen]);

  if (!isOpen || !test) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let failedParameters: TestFailureDetail[] | undefined = undefined;
    if (overallResult === 'FAIL') {
      failedParameters = [
        {
          parameter: failReason.split(':')[0] || 'Quality Parameter',
          standardValue: 'Per Buyer Quality Manual',
          actualValue: failReason.split(':')[1]?.trim() || 'Non-compliant',
          reason: failReason.trim(),
        },
      ];
    }

    onSaveResult(test.id, {
      reportNumber: reportNumber.trim() || 'BV-REPORT',
      resultDate,
      overallResult,
      status: overallResult === 'PASS' ? 'passed' : 'failed',
      failReason: overallResult === 'FAIL' ? failReason.trim() : undefined,
      failedParameters,
      reTestRequired: overallResult === 'FAIL' ? reTestRequired : false,
      inspectorNotes: inspectorNotes.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Record Bureau Veritas (BV) Test Result</h2>
              <p className="text-xs text-slate-400">
                {test.sampleType === 'garment' ? `Style: ${test.styleCode}` : `Fabric: ${test.fabricCode}`} • {test.buyer}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Result Selection Buttons */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1.5 uppercase text-[10px] tracking-wider">
              Overall Test Decision / Result
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOverallResult('PASS')}
                className={`py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  overallResult === 'PASS'
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm">PASSED (Compliant)</span>
              </button>

              <button
                type="button"
                onClick={() => setOverallResult('FAIL')}
                className={`py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  overallResult === 'FAIL'
                    ? 'bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-600/30 ring-2 ring-rose-400/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <XCircle className="w-5 h-5" />
                <span className="text-sm">FAILED (Non-Compliant)</span>
              </button>
            </div>
          </div>

          {/* BV Report Number & Result Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1 uppercase text-[10px]">
                BV Test Report Number *
              </label>
              <input
                type="text"
                value={reportNumber}
                onChange={(e) => setReportNumber(e.target.value)}
                placeholder="Enter BV Report Number"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1 uppercase text-[10px]">
                Report Passed / Failed Date
              </label>
              <input
                type="date"
                value={resultDate}
                onChange={(e) => setResultDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs"
                required
              />
            </div>
          </div>

          {/* Failure Section */}
          {overallResult === 'FAIL' && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 space-y-3">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Test Failure Reason &amp; 24-Hour Re-Test Requirement</span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
                  Failure Reason / Parameter Details *
                </label>
                <textarea
                  rows={2}
                  value={failReason}
                  onChange={(e) => setFailReason(e.target.value)}
                  placeholder="Enter exact failure reason (e.g. pH value out of range, shrinkage exceeded...)"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-2 text-xs focus:ring-1 focus:ring-rose-500"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reTestRequired}
                    onChange={(e) => setReTestRequired(e.target.checked)}
                    className="rounded border-slate-700 text-rose-600 focus:ring-0"
                  />
                  <span className="text-white font-bold text-xs">Re-Test is Required</span>
                </label>
                <span className="text-amber-400 text-[10px] font-mono font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  24-Hour Resubmit Alert will activate
                </span>
              </div>
            </div>
          )}

          {/* Inspector Remarks */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1 uppercase text-[10px]">
              BV Technician Remarks &amp; Action Plan
            </label>
            <textarea
              rows={2}
              value={inspectorNotes}
              onChange={(e) => setInspectorNotes(e.target.value)}
              placeholder="Enter technician remarks or action plan..."
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-2 text-xs"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 font-bold rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer text-white ${
                overallResult === 'PASS'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Save BV Report &amp; Decision</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
