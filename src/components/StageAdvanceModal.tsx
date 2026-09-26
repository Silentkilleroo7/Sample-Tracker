import React, { useState, useEffect } from 'react';
import { SampleItem, STAGE_CONFIG, SampleStage } from '../types/sample';
import { ProgressBar } from './ProgressBar';
import { StyleProductImage } from './StyleProductImage';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Truck,
  Waves,
} from 'lucide-react';

interface StageAdvanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  sample: SampleItem | null;
  onConfirmAdvance: (
    sampleId: string,
    targetStage: SampleStage,
    note: string,
    operator: string,
    stageUpdates?: any
  ) => void;
}

export const StageAdvanceModal: React.FC<StageAdvanceModalProps> = ({
  isOpen,
  onClose,
  sample,
  onConfirmAdvance,
}) => {
  const [note, setNote] = useState('');
  const [operator, setOperator] = useState('');
  const [washRecipe, setWashRecipe] = useState('');
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [parcelDate, setParcelDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (sample && isOpen) {
      setNote('');
      setOperator('');
      setWashRecipe(sample.washDetails.washType || '');
      setCourierName(sample.parcelDetails.courier || '');
      setTrackingNumber(sample.parcelDetails.trackingNumber || '');
      setParcelDate(sample.parcelDetails.parcelDate || new Date().toISOString().split('T')[0]);
    }
  }, [sample, isOpen]);

  if (!isOpen || !sample) return null;

  const currentConfig = STAGE_CONFIG[sample.stage];
  const nextStageKey = currentConfig.nextStage;
  const prevStageKey = currentConfig.prevStage;
  const nextConfig = nextStageKey ? STAGE_CONFIG[nextStageKey] : null;

  const handleAdvance = () => {
    if (!nextStageKey) return;

    let stageUpdates: any = {};

    if (nextStageKey === 'wash') {
      stageUpdates = {
        washDetails: {
          ...sample.washDetails,
          washType: washRecipe.trim(),
          startedAt: new Date().toISOString(),
        },
      };
    } else if (nextStageKey === 'ready_for_parcel') {
      stageUpdates = {
        parcelDetails: {
          ...sample.parcelDetails,
          courier: courierName.trim(),
          trackingNumber: trackingNumber.trim(),
          parcelDate,
          dispatchStatus: 'dispatched',
        },
      };
    }

    const transitionNote =
      note.trim() ||
      `Completed ${currentConfig.label} and advanced to ${nextConfig!.label}`;

    onConfirmAdvance(
      sample.id,
      nextStageKey,
      transitionNote,
      operator.trim() || 'Operator',
      stageUpdates
    );
    onClose();
  };

  const handleRollback = () => {
    if (!prevStageKey) return;
    const prevConfig = STAGE_CONFIG[prevStageKey];
    const rollbackNote =
      note.trim() || `Returned from ${currentConfig.label} back to ${prevConfig.label} for revision/rework`;

    onConfirmAdvance(
      sample.id,
      prevStageKey,
      rollbackNote,
      operator.trim() || 'Operator'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative text-xs text-slate-300">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 pb-3 mb-3 border-b border-slate-800">
          <StyleProductImage sample={sample} size="xs" />
          <div>
            <h2 className="text-base font-black text-white">
              Advance Sample Workflow Stage
            </h2>
            <p className="text-slate-400 text-xs">
              {sample.styleCode} • {sample.styleName} ({sample.buyer})
            </p>
          </div>
        </div>

        {/* Current Visual Progress */}
        <div className="my-4 p-3 bg-slate-800/40 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-slate-300">
              Current: <strong className="text-indigo-400">{currentConfig.label}</strong>
            </span>
            {nextConfig ? (
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                Target: {nextConfig.label}
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            ) : (
              <span className="text-slate-400">Final Stage Reached</span>
            )}
          </div>
          <ProgressBar currentStage={sample.stage} size="compact" />
        </div>

        {/* Dynamic Context Fields based on next stage */}
        <div className="space-y-3.5">
          {nextStageKey === 'wash' && (
            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40 space-y-2">
              <label className="block text-cyan-300 font-semibold flex items-center gap-1.5">
                <Waves className="w-4 h-4 text-cyan-400" />
                Assign Wash Recipe for Wet Processing Plant:
              </label>
              <input
                type="text"
                value={washRecipe}
                onChange={(e) => setWashRecipe(e.target.value)}
                placeholder="Enter Wash Recipe / Formula"
                className="w-full bg-slate-800 border border-cyan-500/40 rounded-lg p-2 text-white text-xs placeholder-slate-500"
              />
            </div>
          )}

          {nextStageKey === 'ready_for_parcel' && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                <Truck className="w-4 h-4 text-emerald-400" />
                Courier &amp; Shipping Details:
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Courier Carrier</label>
                  <input
                    type="text"
                    value={courierName}
                    onChange={(e) => setCourierName(e.target.value)}
                    placeholder="Enter Courier Name"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-white font-medium placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Airway Bill (AWB) #</label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter Tracking / AWB Number"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-white font-mono placeholder-slate-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Operator and Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Station Operator / QA Inspector</label>
              <input
                type="text"
                placeholder="Enter Operator Name"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white placeholder-slate-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Transition Note / Handover Memo</label>
              <input
                type="text"
                placeholder="Enter Handover Note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white placeholder-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
          {prevStageKey ? (
            <button
              type="button"
              onClick={handleRollback}
              className="px-3 py-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-500/30 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
              title="Return to previous stage for rework"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Rollback to {STAGE_CONFIG[prevStageKey].shortLabel}</span>
            </button>
          ) : (
            <div></div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            {nextConfig ? (
              <button
                type="button"
                onClick={handleAdvance}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Advance to {nextConfig.label}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <span className="text-slate-500 text-xs italic">
                Final stage reached
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
