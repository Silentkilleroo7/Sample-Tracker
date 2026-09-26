import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  AlertTriangle,
  FileCheck2,
} from 'lucide-react';
import { BVTestItem } from '../types/test';

interface ResubmitBVTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: BVTestItem | null;
  onConfirmResubmit: (
    testId: string,
    resubmitData: {
      resubmittedDate: string;
      expectedDate: string;
      resubmissionNotes: string;
      retestReportNumber: string;
    }
  ) => void;
}

export const ResubmitBVTestModal: React.FC<ResubmitBVTestModalProps> = ({
  isOpen,
  onClose,
  test,
  onConfirmResubmit,
}) => {
  if (!isOpen || !test) return null;

  const defaultExp = new Date();
  defaultExp.setDate(defaultExp.getDate() + 3);

  const [resubmittedDate, setResubmittedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [expectedDate, setExpectedDate] = useState<string>(
    defaultExp.toISOString().split('T')[0]
  );
  const [retestReportNumber, setRetestReportNumber] = useState<string>(
    test.reportNumber ? `${test.reportNumber}-R1` : `BV-(8826) ${Math.floor(100 + Math.random() * 900)}-RETEST`
  );
  const [resubmissionNotes, setResubmissionNotes] = useState<string>(
    test.failReason?.includes('pH')
      ? 'Neutralization acid rinse dosage calibrated and re-executed at wash plant. pH verified at factory lab at 6.0 prior to BV dispatch.'
      : 'Corrective process re-executed per buyer QA manual. Fresh specimen prepared for BV verification.'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmResubmit(test.id, {
      resubmittedDate,
      expectedDate,
      resubmissionNotes,
      retestReportNumber,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Resubmit Sample to BV for Re-Test</h2>
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
          {/* Previous Fail Context */}
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-rose-300 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Previous Test Failure
              </span>
              <span className="font-mono text-[11px] text-rose-200">
                Report: {test.reportNumber}
              </span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {test.failReason || 'Failed quality threshold. Re-test required.'}
            </p>
          </div>

          {/* Re-test Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1 uppercase text-[10px]">
                Re-Test Sending Date to BV
              </label>
              <input
                type="date"
                value={resubmittedDate}
                onChange={(e) => setResubmittedDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1 uppercase text-[10px]">
                Expected Re-Test Result Date
              </label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs"
                required
              />
            </div>
          </div>

          {/* Re-test Report # Reference */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1 uppercase text-[10px]">
              BV Re-Test Reference / Tracking Number
            </label>
            <input
              type="text"
              value={retestReportNumber}
              onChange={(e) => setRetestReportNumber(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-mono font-bold"
              required
            />
          </div>

          {/* Corrective Action Taken */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1 uppercase text-[10px]">
              Corrective Action Taken & Notes for BV Lab
            </label>
            <textarea
              rows={3}
              value={resubmissionNotes}
              onChange={(e) => setResubmissionNotes(e.target.value)}
              placeholder="Explain adjustments made (e.g. acid rinse neutralizing wash, relaxation stentering, etc.)"
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-amber-500"
              required
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
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Confirm BV Re-Submission</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
