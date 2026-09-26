import React, { useState, useEffect } from 'react';
import {
  X,
  FlaskConical,
  Layers,
  ScrollText,
  Plus,
} from 'lucide-react';
import { BVTestItem, TestSampleType } from '../types/test';
import { SampleItem } from '../types/sample';
import { FabricItem } from '../types/fabric';

interface NewBVTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  samples: SampleItem[];
  fabrics: FabricItem[];
  onCreateTest: (testData: Partial<BVTestItem>) => void;
}

const STANDARD_PARAMETERS = [
  'pH-Value of Aqueous Extract (ISO 3071 / AATCC 81)',
  'Dimensional Stability / Shrinkage (ISO 6330)',
  'Colorfastness to Washing (ISO 105-C06)',
  'Colorfastness to Rubbing / Crocking (ISO 105-X12)',
  'Free & Hydrolyzed Formaldehyde (ISO 14184-1)',
  'Tear Strength (ASTM D1424 Elmendorf)',
  'Tensile & Seam Slippage (ISO 13936-2)',
  'Fiber Composition & Purity',
];

export const NewBVTestModal: React.FC<NewBVTestModalProps> = ({
  isOpen,
  onClose,
  samples,
  fabrics,
  onCreateTest,
}) => {
  const [sampleType, setSampleType] = useState<TestSampleType>('garment');
  const [selectedSampleId, setSelectedSampleId] = useState<string>('');
  const [selectedFabricCode, setSelectedFabricCode] = useState<string>('');
  const [manualStyleCode, setManualStyleCode] = useState<string>('');
  const [manualStyleName, setManualStyleName] = useState<string>('');
  const [manualPoNumber, setManualPoNumber] = useState<string>('');
  const [manualFabricCode, setManualFabricCode] = useState<string>('');
  const [manualFabricName, setManualFabricName] = useState<string>('');
  const [buyer, setBuyer] = useState<string>('');
  const [testingAgency, setTestingAgency] = useState<string>('Bureau Veritas (BV)');
  const [testPackage, setTestPackage] = useState<string>('');
  const [reportNumber, setReportNumber] = useState<string>('');
  const [paramInput, setParamInput] = useState<string>('');
  const [selectedParams, setSelectedParams] = useState<string[]>([]);
  const [sentDate, setSentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [expectedDate, setExpectedDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    return d.toISOString().split('T')[0];
  });
  const [inspectorNotes, setInspectorNotes] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (samples.length > 0 && !selectedSampleId) {
        setSelectedSampleId(samples[0].id);
        setBuyer(samples[0].buyer || '');
      }
      if (fabrics.length > 0 && !selectedFabricCode) {
        setSelectedFabricCode(fabrics[0].code);
      }
    }
  }, [isOpen, samples, fabrics]);

  if (!isOpen) return null;

  const toggleParam = (param: string) => {
    if (selectedParams.includes(param)) {
      setSelectedParams(selectedParams.filter((p) => p !== param));
    } else {
      setSelectedParams([...selectedParams, param]);
    }
  };

  const handleAddCustomParam = () => {
    const trimmed = paramInput.trim();
    if (!trimmed) return;
    if (!selectedParams.includes(trimmed)) {
      setSelectedParams((prev) => [...prev, trimmed]);
    }
    setParamInput('');
  };

  const handleSampleChange = (id: string) => {
    setSelectedSampleId(id);
    const found = samples.find((s) => s.id === id);
    if (found) {
      setBuyer(found.buyer);
    }
  };

  const handleFabricChange = (code: string) => {
    setSelectedFabricCode(code);
    const found = fabrics.find((f) => f.code === code);
    if (found && found.linkedStyleCodes && found.linkedStyleCodes.length > 0) {
      const linked = samples.find((s) => s.styleCode === found.linkedStyleCodes[0]);
      if (linked) setBuyer(linked.buyer);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let styleCode = '';
    let styleName = '';
    let poNumber = '';
    let fabricCode = '';
    let fabricName = '';

    if (sampleType === 'garment') {
      const s = samples.find((x) => x.id === selectedSampleId);
      if (s) {
        styleCode = s.styleCode;
        styleName = s.styleName;
        poNumber = s.poNumber;
        fabricCode = s.fabricCode;
        fabricName = s.fabricName;
      } else {
        styleCode = manualStyleCode.trim().toUpperCase();
        styleName = manualStyleName.trim();
        poNumber = manualPoNumber.trim();
        fabricCode = manualFabricCode.trim().toUpperCase();
        fabricName = manualFabricName.trim();
      }
    } else {
      const f = fabrics.find((x) => x.code === selectedFabricCode);
      if (f) {
        fabricCode = f.code;
        fabricName = f.name;
        styleCode = f.linkedStyleCodes[0] || '';
        styleName = f.name;
      } else {
        fabricCode = manualFabricCode.trim().toUpperCase();
        fabricName = manualFabricName.trim();
        styleCode = manualStyleCode.trim().toUpperCase();
        styleName = fabricName;
      }
    }

    const finalParams = paramInput.trim()
      ? Array.from(new Set([...selectedParams, paramInput.trim()]))
      : selectedParams;

    const newTest: Partial<BVTestItem> = {
      sampleType,
      sampleId: sampleType === 'garment' && selectedSampleId ? selectedSampleId : undefined,
      styleCode,
      styleName,
      poNumber,
      fabricCode,
      fabricName,
      buyer: buyer.trim(),
      testingAgency: testingAgency.trim() || 'Bureau Veritas (BV)',
      testPackage: testPackage.trim() || 'Standard Test Package',
      testParameters: finalParams,
      sentDate,
      expectedDate,
      status: 'pending',
      overallResult: 'PENDING',
      reTestRequired: false,
      reportNumber: reportNumber.trim() || 'Pending BV Report',
      inspectorNotes: inspectorNotes.trim(),
    };

    onCreateTest(newTest);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Send Sample to Bureau Veritas (BV) for Test</h2>
              <p className="text-xs text-slate-400">Create new lab test order for Garment or Fabric submission</p>
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

        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
              e.preventDefault();
            }
          }}
          className="space-y-4 text-xs"
        >
          {/* 1. Category Switcher */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1.5 uppercase text-[10px] tracking-wider">
              Sample Category to Send
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSampleType('garment')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  sampleType === 'garment'
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Garment Sample</span>
              </button>

              <button
                type="button"
                onClick={() => setSampleType('fabric')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  sampleType === 'fabric'
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <ScrollText className="w-4 h-4" />
                <span>Fabric Swatch / Bulk Mill</span>
              </button>
            </div>
          </div>

          {/* 2. Select Style or Fabric */}
          {sampleType === 'garment' ? (
            samples.length > 0 ? (
              <div>
                <label className="block text-slate-400 font-semibold mb-1 uppercase text-[10px] tracking-wider">
                  Select Garment Style &amp; PO
                </label>
                <select
                  value={selectedSampleId}
                  onChange={(e) => handleSampleChange(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">-- Enter Manual Style Below --</option>
                  {samples.map((s) => (
                    <option key={s.id} value={s.id}>
                      [{s.styleCode}] {s.styleName} • Buyer: {s.buyer} • PO: {s.poNumber}
                    </option>
                  ))}
                </select>
              </div>
            ) : null
          ) : fabrics.length > 0 ? (
            <div>
              <label className="block text-slate-400 font-semibold mb-1 uppercase text-[10px] tracking-wider">
                Select Fabric Code &amp; Specification
              </label>
              <select
                value={selectedFabricCode}
                onChange={(e) => handleFabricChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">-- Enter Manual Fabric Below --</option>
                {fabrics.map((f) => (
                  <option key={f.id} value={f.code}>
                    [{f.code}] {f.name} ({f.composition}) • Avail: {f.availableYards} yds
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {sampleType === 'garment' && !selectedSampleId && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-slate-400 font-semibold mb-1 uppercase text-[10px]">
                  Style Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter Style Code"
                  value={manualStyleCode}
                  onChange={(e) => setManualStyleCode(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1 uppercase text-[10px]">
                  Style Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter Style Name"
                  value={manualStyleName}
                  onChange={(e) => setManualStyleName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1 uppercase text-[10px]">
                  PO Number
                </label>
                <input
                  type="text"
                  placeholder="Enter PO Number"
                  value={manualPoNumber}
                  onChange={(e) => setManualPoNumber(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-mono"
                />
              </div>
            </div>
          )}

          {sampleType === 'fabric' && !selectedFabricCode && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 font-semibold mb-1 uppercase text-[10px]">
                  Fabric Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter Fabric Code"
                  value={manualFabricCode}
                  onChange={(e) => setManualFabricCode(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1 uppercase text-[10px]">
                  Fabric Specification *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter Fabric Specification"
                  value={manualFabricName}
                  onChange={(e) => setManualFabricName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs"
                />
              </div>
            </div>
          )}

          {/* 3. Buyer & Testing Agency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1 uppercase text-[10px]">
                Buyer Brand / Account *
              </label>
              <input
                type="text"
                placeholder="Enter Buyer Name"
                value={buyer}
                onChange={(e) => setBuyer(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1 uppercase text-[10px]">
                Testing Agency (Lab) *
              </label>
              <input
                type="text"
                placeholder="Enter Testing Agency"
                value={testingAgency}
                onChange={(e) => setTestingAgency(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs"
                required
              />
            </div>
          </div>

          {/* 4. Test Package Name & Report / Submission Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1 uppercase text-[10px]">
                Test Package Name
              </label>
              <input
                type="text"
                placeholder="Enter Test Package Name"
                value={testPackage}
                onChange={(e) => setTestPackage(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1 uppercase text-[10px]">
                BV Submission / Report Reference #
              </label>
              <input
                type="text"
                placeholder="Optional TRF / Report #"
                value={reportNumber}
                onChange={(e) => setReportNumber(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-mono"
              />
            </div>
          </div>

          {/* 5. Parameters (Type & Press Enter to List + Quick Checkboxes) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                Test Parameters (Type &amp; Press Enter to List or Select Below)
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Type test parameter & press Enter to list..."
                value={paramInput}
                onChange={(e) => setParamInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddCustomParam();
                  }
                }}
                className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs"
              />
              <button
                type="button"
                onClick={handleAddCustomParam}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>List</span>
              </button>
            </div>

            {selectedParams.length > 0 && (
              <div className="flex flex-wrap gap-1.5 py-1">
                {selectedParams.map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 text-[11px] font-medium"
                  >
                    <span>{p}</span>
                    <button
                      type="button"
                      onClick={() => toggleParam(p)}
                      className="hover:text-rose-300 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60 max-h-36 overflow-y-auto">
              {STANDARD_PARAMETERS.map((param) => {
                const checked = selectedParams.includes(param);
                return (
                  <label
                    key={param}
                    onClick={() => toggleParam(param)}
                    className={`flex items-start gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${
                      checked ? 'bg-indigo-600/20 text-indigo-200' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <span className="text-[11px] leading-tight select-none">{param}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 6. Timeline Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1 uppercase text-[10px]">
                Test Sending Date to BV
              </label>
              <input
                type="date"
                value={sentDate}
                onChange={(e) => setSentDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1 uppercase text-[10px]">
                Expected BV Result Date
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

          {/* 7. Special Notes */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1 uppercase text-[10px]">
              Special Instructions / Wash Recipe Reference
            </label>
            <input
              type="text"
              placeholder="Enter any special instructions for BV lab..."
              value={inspectorNotes}
              onChange={(e) => setInspectorNotes(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs"
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FlaskConical className="w-4 h-4" />
              <span>Dispatch Sample to BV</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
