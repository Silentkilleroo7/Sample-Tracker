import React, { useState } from 'react';
import { FabricItem } from '../types/fabric';
import { X, ScrollText, Plus } from 'lucide-react';

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
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [composition, setComposition] = useState('');
  const [color, setColor] = useState('');
  const [gsm, setGsm] = useState<string>('');
  const [widthInches, setWidthInches] = useState<string>('58');
  const [availableYards, setAvailableYards] = useState<string>('');
  const [supplier, setSupplier] = useState('');
  const [location, setLocation] = useState('');
  const [styleInput, setStyleInput] = useState('');
  const [linkedStyles, setLinkedStyles] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleAddStyleCode = () => {
    const parts = styleInput
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    if (parts.length === 0) return;
    setLinkedStyles((prev) => Array.from(new Set([...prev, ...parts])));
    setStyleInput('');
  };

  const handleRemoveStyleCode = (sc: string) => {
    setLinkedStyles((prev) => prev.filter((item) => item !== sc));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    const pendingStyles = styleInput
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    const finalLinkedStyles = Array.from(new Set([...linkedStyles, ...pendingStyles]));

    const newFabric: FabricItem = {
      id: `fab-${Date.now()}`,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      composition: composition.trim(),
      color: color.trim(),
      gsm: Number(gsm) || 0,
      widthInches: Number(widthInches) || 58,
      availableYards: Number(availableYards) || 0,
      allocatedYards: 0,
      minimumThresholdYards: 5,
      supplier: supplier.trim(),
      location: location.trim(),
      linkedStyleCodes: finalLinkedStyles,
      lastReceivedDate: new Date().toISOString().split('T')[0],
    };

    // Reset form
    setCode('');
    setName('');
    setComposition('');
    setColor('');
    setGsm('');
    setWidthInches('58');
    setAvailableYards('');
    setSupplier('');
    setLocation('');
    setStyleInput('');
    setLinkedStyles([]);

    onAddFabric(newFabric);
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

        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
              e.preventDefault();
            }
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Fabric Code *
              </label>
              <input
                type="text"
                required
                placeholder="Enter Fabric Code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono placeholder-slate-500 uppercase focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Fabric Name &amp; Weave *
              </label>
              <input
                type="text"
                required
                placeholder="Enter Fabric Name"
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
                placeholder="Enter Composition"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white placeholder-slate-500"
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
                placeholder="Enter Color / Shade"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Weight (GSM) &amp; Width
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={gsm}
                  onChange={(e) => setGsm(e.target.value)}
                  placeholder="GSM"
                  className="bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-mono placeholder-slate-500"
                />
                <input
                  type="number"
                  value={widthInches}
                  onChange={(e) => setWidthInches(e.target.value)}
                  placeholder="Width (in)"
                  className="bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-mono placeholder-slate-500"
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
                placeholder="Enter Available Yards"
                value={availableYards}
                onChange={(e) => setAvailableYards(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-mono placeholder-slate-500"
              />
              {availableYards !== '' && Number(availableYards) <= 5 && (
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
                placeholder="Enter Supplier Name"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Warehouse Rack / Bin Location
              </label>
              <input
                type="text"
                placeholder="Enter Rack / Bin Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white placeholder-slate-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-300">
                Link Style Codes (Type &amp; Press Enter to List)
              </label>
              <span className="text-[10px] text-slate-400">Press Enter to list style</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Type Style Code & press Enter..."
                value={styleInput}
                onChange={(e) => setStyleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddStyleCode();
                  }
                }}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono placeholder-slate-500 uppercase"
              />
              <button
                type="button"
                onClick={handleAddStyleCode}
                className="px-3 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>List</span>
              </button>
            </div>
            {linkedStyles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {linkedStyles.map((sc) => (
                  <span
                    key={sc}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 font-mono font-bold text-xs"
                  >
                    <span>{sc}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveStyleCode(sc)}
                      className="hover:text-rose-300 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
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
