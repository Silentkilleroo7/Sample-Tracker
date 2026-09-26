import React from 'react';
import { SampleStage, STAGE_CONFIG } from '../types/sample';
import { Check } from 'lucide-react';

interface ProgressBarProps {
  currentStage: SampleStage;
  size?: 'compact' | 'standard' | 'detailed';
  onStageClick?: (stage: SampleStage) => void;
  className?: string;
}

const STAGES: SampleStage[] = [
  'requisition',
  'sewing',
  'wash',
  'finishing',
  'ready_for_parcel',
  'approval_comments',
];

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStage,
  size = 'standard',
  onStageClick,
  className = '',
}) => {
  const currentStepNumber = STAGE_CONFIG[currentStage].stepNumber;
  const progressPercent = Math.round((currentStepNumber / STAGES.length) * 100);

  if (size === 'compact') {
    return (
      <div className={`w-full ${className}`}>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-medium text-slate-300">
            {STAGE_CONFIG[currentStage].label}
          </span>
          <span className="text-slate-400 font-mono text-[11px]">
            {currentStepNumber}/6 ({progressPercent}%)
          </span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden flex">
          {STAGES.map((st, idx) => {
            const stepNum = idx + 1;
            const isCompleted = stepNum < currentStepNumber;
            const isCurrent = stepNum === currentStepNumber;
            let bgColor = 'bg-slate-700/60';
            if (isCompleted) bgColor = 'bg-emerald-500';
            else if (isCurrent) bgColor = 'bg-indigo-500';

            return (
              <div
                key={st}
                className={`h-full flex-1 border-r border-slate-900 last:border-r-0 transition-all duration-300 ${bgColor}`}
                title={`${STAGE_CONFIG[st].label} (${idx + 1}/6)`}
              />
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Progress Track */}
      <div className="relative">
        <div className="overflow-hidden h-2.5 mb-4 text-xs flex rounded-full bg-slate-800 border border-slate-700/60">
          <div
            style={{ width: `${progressPercent}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 transition-all duration-500 ease-out"
          />
        </div>

        {/* Multi-step badges */}
        <div className="grid grid-cols-6 gap-1 md:gap-2">
          {STAGES.map((st, idx) => {
            const config = STAGE_CONFIG[st];
            const stepNum = idx + 1;
            const isCompleted = stepNum < currentStepNumber;
            const isCurrent = stepNum === currentStepNumber;

            return (
              <button
                key={st}
                type="button"
                onClick={() => onStageClick?.(st)}
                disabled={!onStageClick}
                className={`flex flex-col items-center text-center p-1 md:p-1.5 rounded-lg transition-all text-xs group ${
                  onStageClick ? 'hover:bg-slate-800/80 cursor-pointer' : 'cursor-default'
                } ${
                  isCurrent
                    ? 'bg-indigo-950/40 border border-indigo-500/40 text-indigo-300 ring-1 ring-indigo-500/20'
                    : isCompleted
                    ? 'text-emerald-400'
                    : 'text-slate-500'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold mb-1 transition-transform group-hover:scale-110 ${
                    isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : isCurrent
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 ring-2 ring-indigo-400/40'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  ) : isCurrent ? (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-300 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                    </span>
                  ) : (
                    <span>{stepNum}</span>
                  )}
                </div>
                <span className="font-medium truncate max-w-full hidden md:inline text-[11px]">
                  {config.shortLabel}
                </span>
                <span className="font-medium truncate max-w-full md:hidden text-[10px]">
                  {config.shortLabel.substring(0, 3)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
