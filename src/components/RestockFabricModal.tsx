import React, { useState } from 'react';
import { FabricItem } from '../types/fabric';
import { X, PackagePlus, Check } from 'lucide-react';

interface RestockFabricModalProps {
  isOpen: boolean;
  onClose: () => void;
  fabric: FabricItem | null;
  onConfirmRestock: (fabricId: string, additionalYards: number) => void;
}

export const RestockFabricModal: React.FC<RestockFabricModalProps> = ({
  isOpen,
  onClose,
  fabric,
  onConfirmRestock,
}) => {
  if (!isOpen || !fabric) return null;

  const [yardsToAdd, setYardsToAdd] = useState(25);
  const currentYards = fabric.availableYards;
  const newProjectedYards = currentYards + yardsToAdd;
  const willBeResolved = currentYards <= 5 && newProjectedYards > 5;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (yardsToAdd === 0) return;
    onConfirmRestock(fabric.id, yardsToAdd);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-xs text-slate-300">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 pb-3 mb-3 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <PackagePlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">
              Receive Fabric Roll / Restock
            </h2>
            <p className="text-slate-400 text-xs">
              {fabric.code} • {fabric.name}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Current Stock:</span>
              <span
                className={`font-mono font-black ${
                  currentYards <= 5 ? 'text-rose-400' : 'text-slate-200'
                }`}
              >
                {currentYards.toFixed(1)} yds
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Linked Styles:</span>
              <span className="font-mono text-slate-200">
                {fabric.linkedStyleCodes.join(', ') || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Supplier:</span>
              <span className="text-slate-200">{fabric.supplier}</span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Quantity to Receive (Yards) *
            </label>
            <input
              type="number"
              step="0.5"
              min="-100"
              max="1000"
              required
              value={yardsToAdd}
              onChange={(e) => setYardsToAdd(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-base focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <div className="flex gap-2 mt-2">
              {[10, 25, 50, 100].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setYardsToAdd(preset)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] cursor-pointer"
                >
                  +{preset} yds
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex justify-between items-center">
            <span className="text-slate-400 font-medium">New Projected Stock:</span>
            <span
              className={`font-mono text-sm font-bold ${
                newProjectedYards <= 5 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {newProjectedYards.toFixed(1)} yds
            </span>
          </div>

          {willBeResolved && (
            <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Awesome! This will resolve the low stock condition (&gt; 5 yds) and clear the Red Warning on the Dashboard!
              </span>
            </div>
          )}

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              Confirm Restock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
