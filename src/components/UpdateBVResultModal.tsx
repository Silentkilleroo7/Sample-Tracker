import React, { useState } from 'react';
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

const COMMON_FAIL_REASONS = [
  'pH-Value fail: Measured pH outside tolerance (4.0 - 7.5). Alkaline wash residue.',
  'Dimensional Stability / Shrinkage fail: Length shrinkage exceeded ±3.5% limit.',
  'Colorfastness to Washing fail: Color staining on multi-fiber cotton strip grade < 4.0.',
  'Colorfastness to Crocking / Rubbing fail: Wet rubbing transfer grade < 3.0.',
  'Free Formaldehyde fail: Formaldehyde content exceeded 75 mg/kg skin contact threshold.',
  'Tear / Tensile Strength fail: Warp/weft strength below buyer minimum requirement.',
];

export const UpdateBVResultModal: React.FC<UpdateBVResultModalProps> = ({
  isOpen,
  onClose,
  test,
  onSaveResult,
}) => {
  if (!isOpen || !test) return null;

  const [reportNumber, setReportNumber] = useState<string>(
    test.reportNumber?.replace(' (In Testing)', '') || `BV-(8826) ${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [resultDate, setResultDate] = useState<string>(
    test.resultDate || new Date().toISOString().split('T')[0]
  );
  const [overallResult, setOverallResult] = useState<'PASS' | 'FAIL'>(
    test.overallResult === 'FAIL' ? 'FAIL' : 'PASS'
  );
  const [failReason, setFailReason] = useState<string>(
    test.failReason || COMMON_FAIL_REASONS[0]
  );
  const [reTestRequired, setReTestRequired] = useState<boolean>(true);
  const [inspectorNotes, setInspectorNotes] = useState<string>(
    test.inspectorNotes || ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let failedParameters: TestFailureDetail[] | undefined = undefined;
    if (overallResult === 'FAIL') {
      failedParameters = [
        {
          parameter: failReason.split(':')[0] || 'Quality Parameter',
          standardValue: 'Per Buyer Quality Manual',
          actualValue: failReason.split(':')[1]?.trim() || 'Non-compliant',
          reason: failReason,
        },
      ];
    }

    onSaveResult(test.id, {
      reportNumber,
      resultDate,
      overallResult,
      status: overallResult === 'PASS' ? 'passed' : 'failed',
      failReason: overallResult === 'FAIL' ? failReason : undefined,
      failedParameters,
      reTestRequired: overallResult === 'FAIL' ? reTestRequired : false,
      inspectorNotes,
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
                BV Test Report Number
              </label>
              <input
                type="text"
                value={reportNumber}
                onChange={(e) => setReportNumber(e.target.value)}
                placeholder="e.g. BV-(8826) 249-0182"
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
                <span>Test Failure Reason & 24-Hour Re-Test Requirement</span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
                  Select Failure Reason or Custom Description
                </label>
                <div className="space-y-1.5 mb-2">
                  {COMMON_FAIL_REASONS.map((r, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFailReason(r)}
                      className={`w-full text-left p-1.5 rounded text-[11px] border transition-colors ${
                        failReason === r
                          ? 'bg-rose-600/30 text-rose-200 border-rose-400 font-medium'
                          : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  value={failReason}
                  onChange={(e) => setFailReason(e.target.value)}
                  placeholder="Specify exact failure reason (e.g. PH-Value fail, shrinkage tolerance exceeded...)"
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
              BV Technician Remarks & Action Plan
            </label>
            <textarea
              rows={2}
              value={inspectorNotes}
              onChange={(e) => setInspectorNotes(e.target.value)}
              placeholder="e.g. Neutralization rinse required in wash plant to adjust pH from 8.9 back to 5.5-6.5..."
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
              <span>Save BV Report & Decision</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
