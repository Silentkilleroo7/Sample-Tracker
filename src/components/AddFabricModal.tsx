import React, { useState } from 'react';
import { FabricItem } from '../types/fabric';
import { X, ScrollText } from 'lucide-react';

interface AddFabricModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFabric: (fabric: FabricItem) => void;
}

export const AddFabricModal: React.FC<AddFabricModalProps> = ({
  isOpen,
  onClose,
  onAddFabric,
}) => {
  if (!isOpen) return null;

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [composition, setComposition] = useState('100% Cotton');
  const [color, setColor] = useState('Navy Blue');
  const [gsm, setGsm] = useState(260);
  const [widthInches, setWidthInches] = useState(58);
  const [availableYards, setAvailableYards] = useState(40);
  const [supplier, setSupplier] = useState('Pacific Textile Mills');
  const [location, setLocation] = useState('Warehouse A - Bay 06');
  const [linkedStylesInput, setLinkedStylesInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    const linkedStyleCodes = linkedStylesInput
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    const newFabric: FabricItem = {
      id: `fab-${Date.now()}`,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      composition,
      color,
      gsm,
      widthInches,
      availableYards,
      allocatedYards: 0,
      minimumThresholdYards: 5,
      supplier,
      location,
      linkedStyleCodes,
      lastReceivedDate: new Date().toISOString().split('T')[0],
    };

    onAddFabric(newFabric);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative text-xs text-slate-300">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 pb-3 mb-3 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <ScrollText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">
              Add New Fabric Material
            </h2>
            <p className="text-slate-400 text-xs">
              Register fabric roll, link target style codes, and set starting inventory.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Fabric Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. FAB-TWL-90"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono placeholder-slate-500 uppercase focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Fabric Name & Weave *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 260 GSM Stretch Chino Twill"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Fiber Composition
              </label>
              <input
                type="text"
                value={composition}
                onChange={(e) => setComposition(e.target.value)}
                placeholder="e.g. 98% Cotton 2% Spandex"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Color / Shade
              </label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Weight (GSM) & Width
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={gsm}
                  onChange={(e) => setGsm(Number(e.target.value))}
                  placeholder="GSM"
                  className="bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-mono"
                />
                <input
                  type="number"
                  value={widthInches}
                  onChange={(e) => setWidthInches(Number(e.target.value))}
                  placeholder="Width (inches)"
                  className="bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Available Yards in Stock *
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={availableYards}
                onChange={(e) => setAvailableYards(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-mono"
              />
              {availableYards <= 5 && (
                <span className="text-[10px] text-rose-400 font-bold mt-1 block">
                  ⚠️ ≤5 yds will show Red on Dashboard Report!
                </span>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Mill / Fabric Supplier
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Warehouse Rack / Bin Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Link Style Codes (Comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. ST-8820, ST-8825"
              value={linkedStylesInput}
              onChange={(e) => setLinkedStylesInput(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono placeholder-slate-500 uppercase"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Links this fabric to specific styles. If stock drops to 5 yds or less, these style codes will be flagged in Red.
            </p>
          </div>

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
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              Register Fabric
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
