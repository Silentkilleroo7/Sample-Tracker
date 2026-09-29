import React, { useState, useEffect } from 'react';
import {
  FabricItem,
  getPendingAwbShipments,
  getArrivedAwbShipments,
} from '../types/fabric';
import {
  X,
  PackagePlus,
  Check,
  Plane,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Truck,
} from 'lucide-react';

interface RestockFabricModalProps {
  isOpen: boolean;
  onClose: () => void;
  fabric: FabricItem | null;
  onConfirmRestock: (fabricId: string, additionalYards: number) => void;
  onRegisterFabricAwb?: (
    fabricId: string,
    awbData: {
      awbNumber: string;
      expectedYards: number;
      courier?: string;
      supplier?: string;
      expectedArrivalDate?: string;
      notes?: string;
    }
  ) => void;
  onConfirmFabricAwbArrival?: (fabricId: string, awbIdOrNumber: string) => void;
}

export const RestockFabricModal: React.FC<RestockFabricModalProps> = ({
  isOpen,
  onClose,
  fabric,
  onConfirmRestock,
  onRegisterFabricAwb,
  onConfirmFabricAwbArrival,
}) => {
  const [activeTab, setActiveTab] = useState<'awb' | 'direct'>('awb');
  const [awbNumber, setAwbNumber] = useState('');
  const [awbYards, setAwbYards] = useState<number>(30);
  const [courier, setCourier] = useState('DHL Express');
  const [expectedArrivalDate, setExpectedArrivalDate] = useState(() => {
    const d = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [yardsToAdd, setYardsToAdd] = useState(25);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (fabric && isOpen) {
      setActiveTab('awb');
      setAwbNumber('');
      setAwbYards(30);
      setFormError(null);
    }
  }, [fabric?.id, isOpen]);

  if (!isOpen || !fabric) return null;

  const currentYards = fabric.availableYards;
  const pendingAwbs = getPendingAwbShipments(fabric);
  const arrivedAwbs = getArrivedAwbShipments(fabric);

  const newProjectedYards =
    activeTab === 'awb' ? currentYards + (Number(awbYards) || 0) : currentYards + yardsToAdd;
  const willBeResolved = currentYards <= 5 && newProjectedYards > 5;

  const handleInsertAwbSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const cleanAwb = awbNumber.trim().toUpperCase();
    if (!cleanAwb) {
      setFormError('Please enter the AWB Number provided by the fabric supplier.');
      return;
    }
    if (!awbYards || awbYards <= 0) {
      setFormError('Please enter a valid yardage amount (yds) against this AWB number.');
      return;
    }
    if (onRegisterFabricAwb) {
      onRegisterFabricAwb(fabric.id, {
        awbNumber: cleanAwb,
        expectedYards: Number(Number(awbYards).toFixed(2)),
        courier: courier.trim() || 'DHL Express',
        supplier: fabric.supplier,
        expectedArrivalDate,
        notes: notes.trim(),
      });
      setAwbNumber('');
      setNotes('');
    }
  };

  const handleDirectRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (yardsToAdd === 0) return;
    onConfirmRestock(fabric.id, yardsToAdd);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative text-xs text-slate-300 my-4">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-3 mb-3 border-b border-slate-800">
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
              currentYards <= 5
                ? 'bg-rose-600/20 border-rose-500/40 text-rose-400'
                : 'bg-cyan-600/20 border-cyan-500/40 text-cyan-400'
            }`}
          >
            <Plane className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white">
                Fabric Shortage AWB &amp; Stock Control
              </h2>
              {currentYards <= 5 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-mono text-[10px] font-bold">
                  Shortage Alert (≤5 Yds)
                </span>
              )}
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              <strong className="text-indigo-300 font-mono">{fabric.code}</strong> • {fabric.name}
            </p>
          </div>
        </div>

        {/* Fabric Current Status Box */}
        <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-1.5 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Current Inventory Stock:</span>
            <span
              className={`font-mono text-sm font-black ${
                currentYards <= 5 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {currentYards.toFixed(2)} yds
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Supplier:</span>
            <span className="text-white font-semibold">{fabric.supplier}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Linked Styles:</span>
            <span className="font-mono text-indigo-300 font-bold">
              {fabric.linkedStyleCodes.join(', ') || 'All Linked Styles'}
            </span>
          </div>
        </div>

        {/* ACTIVE IN-TRANSIT AWB SHIPMENTS: 1-CLICK CONFIRM ARRIVAL & AUTO-ADD YDS */}
        {pendingAwbs.length > 0 && (
          <div className="mb-4 p-3.5 rounded-xl bg-cyan-950/35 border-2 border-cyan-500/50 space-y-2.5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="font-black text-cyan-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-cyan-400" />
                <span>
                  Active Supplier AWB In-Transit ({pendingAwbs.length}) — Confirm Arrival
                </span>
              </span>
              <span className="font-mono text-[10px] text-cyan-200 font-bold">
                Auto-Adds Yds on Confirm
              </span>
            </div>

            <div className="space-y-2">
              {pendingAwbs.map((awb) => (
                <div
                  key={awb.id}
                  className="p-2.5 rounded-xl bg-slate-900/95 border border-cyan-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/40 font-mono font-black text-xs text-cyan-200">
                        AWB: {awb.awbNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 font-mono font-black text-xs text-emerald-300">
                        +{Number(awb.expectedYards).toFixed(2)} yds
                      </span>
                      {awb.courier && (
                        <span className="text-[10px] text-slate-400 font-semibold">
                          • {awb.courier}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                      <span>Supplier: <strong className="text-slate-200">{awb.supplier || fabric.supplier}</strong></span>
                      {awb.expectedArrivalDate && (
                        <span className="font-mono text-amber-300">
                          ETA: {awb.expectedArrivalDate}
                        </span>
                      )}
                      {awb.notes && <span className="italic text-slate-300">“{awb.notes}”</span>}
                    </div>
                  </div>

                  {onConfirmFabricAwbArrival && (
                    <button
                      type="button"
                      onClick={() => {
                        onConfirmFabricAwbArrival(fabric.id, awb.id || awb.awbNumber);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 cursor-pointer shrink-0 transition-all hover:scale-105"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm AWB Arrived (+{Number(awb.expectedYards).toFixed(1)} yds)</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('awb')}
            className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'awb'
                ? 'bg-cyan-600 text-slate-950 font-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Plane className="w-3.5 h-3.5" />
            <span>1. Inform Shortage &amp; Add AWB</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('direct')}
            className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'direct'
                ? 'bg-emerald-600 text-white font-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PackagePlus className="w-3.5 h-3.5" />
            <span>2. Direct Roll Restock</span>
          </button>
        </div>

        {activeTab === 'awb' ? (
          <form onSubmit={handleInsertAwbSubmit} className="space-y-3.5">
            <div className="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-[11px] text-indigo-200 leading-relaxed">
              <strong>How AWB Shortage Tracking Works:</strong> Inform supplier{' '}
              <strong>{fabric.supplier}</strong> about the fabric shortage and insert their{' '}
              <strong>AWB Number</strong> along with the <strong>Expected Yards</strong>. When that AWB arrives, click{' '}
              <strong>Confirm AWB Arrived</strong> and the exact yardage will be automatically added to{' '}
              <strong className="font-mono">{fabric.code}</strong> inventory!
            </div>

            {formError && (
              <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-cyan-300 mb-1">
                  Supplier AWB Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DHL-88492015"
                  value={awbNumber}
                  onChange={(e) => setAwbNumber(e.target.value)}
                  className="w-full bg-slate-800 border border-cyan-500/50 rounded-xl p-2.5 text-white font-mono font-bold placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block font-bold text-emerald-300 mb-1">
                  AWB Fabric Amount (Yards) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="5000"
                  required
                  value={awbYards}
                  onChange={(e) => setAwbYards(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-emerald-500/50 rounded-xl p-2.5 text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-400">Quick AWB Yardage:</span>
              {[15, 25, 30, 50, 100].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAwbYards(preset)}
                  className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border cursor-pointer ${
                    awbYards === preset
                      ? 'bg-emerald-600 text-white border-emerald-400'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  +{preset} yds
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Courier / Carrier
                </label>
                <input
                  type="text"
                  placeholder="e.g. DHL Express / FedEx / UPS"
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Expected Arrival Date
                </label>
                <input
                  type="date"
                  value={expectedArrivalDate}
                  onChange={(e) => setExpectedArrivalDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Shortage Informed Note / Supplier Remarks (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Informed supplier via email/WhatsApp for urgent sample yardage..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white placeholder-slate-500"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">
                Stock After This AWB Arrives ({currentYards.toFixed(1)} +{' '}
                {(Number(awbYards) || 0).toFixed(1)} yds):
              </span>
              <span className="font-mono text-sm font-black text-emerald-400">
                {newProjectedYards.toFixed(2)} yds
              </span>
            </div>

            {arrivedAwbs.length > 0 && (
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Previously Arrived AWBs for {fabric.code}:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {arrivedAwbs.slice(0, 4).map((a) => (
                    <span
                      key={a.id}
                      className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-mono text-[10px]"
                    >
                      ✓ {a.awbNumber} (+{a.expectedYards} yds)
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black rounded-xl shadow-lg shadow-cyan-600/30 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plane className="w-4 h-4" />
                <span>Save Supplier AWB ({awbYards || 0} yds)</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleDirectRestockSubmit} className="space-y-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Immediate Quantity to Receive (Yards) *
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
                  This will resolve the low stock condition (&gt; 5 yds) and clear the Red Warning on the Dashboard!
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
                Confirm Direct Restock
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
