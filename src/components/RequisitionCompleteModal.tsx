import React, { useState, useEffect } from 'react';
import {
  SampleItem,
  VolarRequisitionForm,
  TrimsChecklist,
  SizeBreakdownItem,
  ColorBreakdownItem,
  GOLD_SEAL_SIZE_RUN_PRESETS,
  MULTI_COLOR_PACK_PRESETS,
  getSampleImage,
  getSampleTypeTone,
  getPriorityTone,
  getEffectiveSizeBreakdown,
  getEffectiveSizeName,
  getEffectiveColorBreakdown,
  getEffectiveColorName,
  getEffectiveRequisitionQuantity,
  getEffectivePerPcsConsumption,
} from '../types/sample';
import { StyleProductImage } from './StyleProductImage';
import { SampleTypeBadge } from './SampleTypeBadge';
import {
  Printer,
  X,
  CheckCircle2,
  Edit3,
  Eye,
  RotateCcw,
  Save,
  Copy,
  Check,
  Sparkles,
  Lock,
  ShieldAlert,
  Layers,
  Plus,
  FileText,
} from 'lucide-react';

interface RequisitionCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  sample: SampleItem | null;
  onSaveForm?: (sampleId: string, form: VolarRequisitionForm) => void;
  onViewInPipeline?: (sample: SampleItem) => void;
}

const DEFAULT_TRIMS: TrimsChecklist = {
  mainLabel: true,
  sizeLabel: true,
  careOrigin: false,
  button: true,
  buttonNote: '',
  buckles: false,
  velcro: false,
  rivet: false,
  stud: false,
  thread: true,
  threadNote: 'AS PER CHART',
  interlining: true,
  elastic: false,
  zipper: true,
  zipperNote: '',
  drawstring: true,
  stopperEyelet: true,
  snap: false,
  pocketing: true,
  pocketingNote: 'TC POCKETING ( WHITE )',
  customTrims: [],
};

export const RequisitionCompleteModal: React.FC<RequisitionCompleteModalProps> = ({
  isOpen,
  onClose,
  sample,
  onSaveForm,
  onViewInPipeline,
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);

  // Print Efficiency & Layout Controls
  const [printCopyMode, setPrintCopyMode] = useState<'single' | 'dual'>('single');
  const [compactPrintMode, setCompactPrintMode] = useState<boolean>(true);
  const [showFloorRouting, setShowFloorRouting] = useState<boolean>(true);
  const [newColorNameInput, setNewColorNameInput] = useState<string>('');

  // Form State
  const [form, setForm] = useState<VolarRequisitionForm | null>(null);

  // Helper to format date like "24-Sep-26"
  const formatVolarDate = (dateStr?: string) => {
    const d = dateStr ? new Date(dateStr) : new Date();
    if (Number.isNaN(d.getTime())) return dateStr || '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = String(d.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  };

  // Populate or load form from sample
  useEffect(() => {
    if (!sample) return;
    setIsEditMode(false);
    setShowSaveConfirmModal(false);
    const effectiveThreadNote =
      sample.threadNote ||
      sample.requisitionForm?.threadNote ||
      sample.requisitionForm?.trims?.threadNote ||
      sample.requisitionForm?.threadInstruction ||
      '';
    const effectiveZipperNote =
      sample.zipperNote ||
      sample.requisitionForm?.zipperNote ||
      sample.requisitionForm?.trims?.zipperNote ||
      '';
    const effectiveButtonNote =
      sample.buttonNote ||
      sample.requisitionForm?.buttonNote ||
      sample.requisitionForm?.trims?.buttonNote ||
      '';
    const washStr = sample.washDetails?.washType || '';
    const effectiveColorStr = getEffectiveColorName(sample);
    const defaultColorWash =
      washStr &&
      washStr !== 'Standard Wash' &&
      !effectiveColorStr.toLowerCase().includes(washStr.toLowerCase())
        ? `${effectiveColorStr} / ${washStr}`
        : effectiveColorStr || '';

    const effectiveBreakdown = getEffectiveSizeBreakdown(sample);
    const effectiveColors = getEffectiveColorBreakdown(sample);
    const effectiveQty = getEffectiveRequisitionQuantity(sample);
    const effectiveSizeLabelStr = getEffectiveSizeName(sample);
    const effectivePerPcsCons = getEffectivePerPcsConsumption(sample);
    const effectiveTotalYds =
      sample.fabricRequiredYards && sample.fabricRequiredYards > 0
        ? sample.fabricRequiredYards
        : Number((effectivePerPcsCons * effectiveQty).toFixed(2));

    if (sample.requisitionForm && sample.requisitionForm.companyName) {
      setForm({
        ...sample.requisitionForm,
        sizeBreakdown:
          sample.requisitionForm.sizeBreakdown &&
          sample.requisitionForm.sizeBreakdown.length > 0
            ? sample.requisitionForm.sizeBreakdown
            : effectiveBreakdown,
        colorBreakdown:
          sample.requisitionForm.colorBreakdown &&
          sample.requisitionForm.colorBreakdown.length > 0
            ? sample.requisitionForm.colorBreakdown
            : effectiveColors,
        colorWash: sample.requisitionForm.colorWash || defaultColorWash,
        sampleSizeLabel:
          sample.requisitionForm.sampleSizeLabel ||
          `${sample.sampleType}\nSize: ${effectiveSizeLabelStr} (${effectiveQty} Pcs)`,
        perPcsConsumptionYards:
          sample.requisitionForm.perPcsConsumptionYards || effectivePerPcsCons,
        fabricRequiredYards:
          sample.requisitionForm.fabricRequiredYards || effectiveTotalYds,
        threadNote: effectiveThreadNote,
        zipperNote: effectiveZipperNote,
        buttonNote: effectiveButtonNote,
        threadInstruction:
          sample.requisitionForm.threadInstruction || effectiveThreadNote || 'AS PER CHART',
        quantityText: sample.requisitionForm.quantityText || `${effectiveQty} Pcs`,
        trims: {
          ...DEFAULT_TRIMS,
          ...(sample.requisitionForm.trims || {}),
          threadNote: effectiveThreadNote || 'AS PER CHART',
          zipperNote: effectiveZipperNote,
          buttonNote: effectiveButtonNote,
        },
        isLocked: Boolean(sample.isRequisitionLocked || sample.requisitionForm.isLocked),
      });
    } else {
      const initialForm: VolarRequisitionForm = {
        companyName: 'VOLAR FASHION PVT LTD',
        date: formatVolarDate(sample.createdAt),
        requiredDate: formatVolarDate(sample.targetParcelDate),
        buyer: sample.buyer || '',
        requestedBy: '',
        priorityType: sample.priority || 'normal',
        sampleType: sample.sampleType || '',
        descriptionCode: sample.styleCode || '',
        styleName: sample.styleName || '',
        sampleSizeLabel:
          effectiveBreakdown.length > 1
            ? `${sample.sampleType} (${effectiveBreakdown.length} Sizes)\n${effectiveBreakdown
                .map((b) => `${b.size}:${b.quantity}`)
                .join(', ')} (${effectiveQty} Pcs)`
            : `${sample.sampleType}\nSize: ${effectiveSizeLabelStr} (${effectiveQty} Pcs)`,
        sizeBreakdown: effectiveBreakdown,
        colorWash: defaultColorWash,
        colorBreakdown: effectiveColors,
        fabricCode: sample.fabricCode || '',
        perPcsConsumptionYards: effectivePerPcsCons,
        fabricRequiredYards: effectiveTotalYds,
        fitting: '',
        threadInstruction: effectiveThreadNote || 'AS PER CHART',
        threadNote: effectiveThreadNote,
        zipperNote: effectiveZipperNote,
        buttonNote: effectiveButtonNote,
        quantityText: `${effectiveQty} Pcs`,
        block: '',
        fabricComposition: sample.fabricName || '',
        supplier: '',
        weight: '',
        trims: {
          ...DEFAULT_TRIMS,
          threadNote: effectiveThreadNote || 'AS PER CHART',
          zipperNote: effectiveZipperNote,
          buttonNote: effectiveButtonNote,
        },
        specialInstructions: '',
        samplingSectionNotes: '',
        receivedBy: '',
        merchandiserSignature: '',
        isLocked: Boolean(sample.isRequisitionLocked),
      };
      setForm(initialForm);
    }
  }, [sample]);

  if (!isOpen || !sample || !form) return null;

  const isRequisitionLocked = Boolean(sample.isRequisitionLocked || form.isLocked);

  const activeColorBreakdown: ColorBreakdownItem[] =
    form.colorBreakdown && form.colorBreakdown.length > 0
      ? form.colorBreakdown
      : getEffectiveColorBreakdown(sample);

  const activeSizeBreakdown: SizeBreakdownItem[] =
    form.sizeBreakdown && form.sizeBreakdown.length > 0
      ? form.sizeBreakdown
      : getEffectiveSizeBreakdown(sample);

  const activeSizeNames =
    activeSizeBreakdown.map((s) => s.size).join(', ') || getEffectiveSizeName(sample);

  const activeTotalQty = (() => {
    const parsedFromText = parseInt(String(form.quantityText).replace(/[^0-9]/g, ''), 10);
    if (activeColorBreakdown.length > 1) {
      return activeColorBreakdown.reduce((s, c) => s + Math.max(1, c.quantity), 0);
    }
    if (Number.isFinite(parsedFromText) && parsedFromText > 0) return parsedFromText;
    return getEffectiveRequisitionQuantity(sample);
  })();

  const activePerPcsCons =
    form.perPcsConsumptionYards && form.perPcsConsumptionYards > 0
      ? form.perPcsConsumptionYards
      : getEffectivePerPcsConsumption(sample);

  const activeTotalFabricYards = Number((activePerPcsCons * activeTotalQty).toFixed(2));

  const reqRefNumber = `REQ-${(form.descriptionCode || sample.styleCode || 'STY')
    .replace(/[^A-Z0-9]/gi, '')
    .toUpperCase()}-${sample.id.slice(-4).toUpperCase()}`;

  const handlePrint = () => {
    window.print();
  };

  const handleToggleTrim = (
    key: keyof Omit<
      TrimsChecklist,
      'threadNote' | 'zipperNote' | 'buttonNote' | 'pocketingNote' | 'customTrims'
    >
  ) => {
    if (isRequisitionLocked) return;
    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        trims: {
          ...prev.trims,
          [key]: !prev.trims[key],
        },
      };
    });
  };

  const handleAddColorRowInForm = () => {
    if (isRequisitionLocked) return;
    const trimmed = newColorNameInput.trim();
    if (!trimmed) return;
    const parts = trimmed
      .split(/[,;]+/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length === 0) return;

    const currentList = [...activeColorBreakdown];
    const defaultWash = sample.washDetails?.washType || 'Standard Wash';
    parts.forEach((p) => {
      if (!currentList.some((item) => item.color.toLowerCase() === p.toLowerCase())) {
        currentList.push({
          color: p,
          wash: defaultWash,
          sizes: activeSizeNames,
          quantity: 1,
        });
      }
    });
    const nextTotal = currentList.reduce((sum, item) => sum + Math.max(1, item.quantity), 0);
    setForm({
      ...form,
      colorBreakdown: currentList,
      colorWash: currentList.map((c) => c.color).join(', '),
      quantityText: `${nextTotal} Pcs`,
      fabricRequiredYards: Number((activePerPcsCons * nextTotal).toFixed(2)),
    });
    setNewColorNameInput('');
  };

  const handleRequestSave = () => {
    if (isRequisitionLocked) return;
    setShowSaveConfirmModal(true);
  };

  const handleConfirmFinalSave = () => {
    if (onSaveForm && form && sample) {
      const lockedForm: VolarRequisitionForm = {
        ...form,
        isLocked: true,
        lockedAt: new Date().toISOString(),
      };
      setForm(lockedForm);
      setIsEditMode(false);
      setShowSaveConfirmModal(false);
      onSaveForm(sample.id, lockedForm);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }
  };

  const handleResetToSample = () => {
    if (!sample) return;
    const effectiveBreakdown = getEffectiveSizeBreakdown(sample);
    const effectiveColors = getEffectiveColorBreakdown(sample);
    const effectiveQty = getEffectiveRequisitionQuantity(sample);
    const effectivePerPcsCons = getEffectivePerPcsConsumption(sample);
    const initialForm: VolarRequisitionForm = {
      companyName: 'VOLAR FASHION PVT LTD',
      date: formatVolarDate(sample.createdAt),
      requiredDate: formatVolarDate(sample.targetParcelDate),
      buyer: sample.buyer || '',
      requestedBy: '',
      priorityType: sample.priority || 'normal',
      sampleType: sample.sampleType || '',
      descriptionCode: sample.styleCode || '',
      styleName: sample.styleName || '',
      sampleSizeLabel: `${sample.sampleType}\nSize: ${getEffectiveSizeName(sample)} (${effectiveQty} Pcs)`,
      sizeBreakdown: effectiveBreakdown,
      colorWash: getEffectiveColorName(sample),
      colorBreakdown: effectiveColors,
      fabricCode: sample.fabricCode || '',
      perPcsConsumptionYards: effectivePerPcsCons,
      fabricRequiredYards: Number((effectivePerPcsCons * effectiveQty).toFixed(2)),
      fitting: '',
      threadInstruction: sample.threadNote || 'AS PER CHART',
      threadNote: sample.threadNote || '',
      zipperNote: sample.zipperNote || '',
      buttonNote: sample.buttonNote || '',
      quantityText: `${effectiveQty} Pcs`,
      block: '',
      fabricComposition: sample.fabricName || '',
      supplier: '',
      weight: '',
      trims: { ...DEFAULT_TRIMS },
      specialInstructions: '',
      samplingSectionNotes: '',
      receivedBy: '',
      merchandiserSignature: '',
    };
    setForm(initialForm);
  };

  const handleCopyText = () => {
    const colorLines = activeColorBreakdown
      .map(
        (c, i) =>
          `  ${i + 1}. ${c.color} (${c.wash || 'Standard Wash'}) - Sizes: ${
            c.sizes || activeSizeNames
          } - Qty: ${c.quantity} Pcs`
      )
      .join('\n');
    const text = `
VOLAR FASHION PVT LTD - Sample Requisition Form (${reqRefNumber})
Date: ${form.date} | Required Date: ${form.requiredDate}
Buyer: ${form.buyer} | Requested By: ${form.requestedBy} | Line: ${sample.lineCode || 'LINE-01'}
Priority: ${form.priorityType.toUpperCase()} | Type of Sample: ${form.sampleType}
Style Code: ${form.descriptionCode} | Style Name: ${form.styleName}
Sizes: ${activeSizeNames} | Total Requisition Qty: ${activeTotalQty} Pcs
Colorways (${activeColorBreakdown.length}):
${colorLines}
Fabric Code: ${form.fabricCode} | Comp: ${form.fabricComposition} | Cons: ${activePerPcsCons.toFixed(2)} yds/pc | Total Fabric: ${activeTotalFabricYards.toFixed(2)} yds
Thread Note: ${form.trims.threadNote || form.threadNote || form.threadInstruction} | Zipper Note: ${form.trims.zipperNote || form.zipperNote || 'N/A'} | Button Note: ${form.trims.buttonNote || form.buttonNote || 'N/A'}
Special Instructions: ${form.specialInstructions || 'None'}
    `.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper function to render the Requisition Slip (can be rendered once or twice for Dual Copy mode)
  const renderRequisitionSlip = (copyLabel?: string) => (
    <div
      className={`bg-white text-black rounded-lg border-2 border-black font-sans print:border-black print:rounded-none print:shadow-none print:w-full print:text-black selection:bg-indigo-100 ${
        compactPrintMode ? 'p-2.5 sm:p-3.5 print:p-1.5' : 'p-3 sm:p-5 print:p-2'
      }`}
      style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}
    >
      {/* Top Official Header Banner */}
      <div className="border border-b-0 border-black bg-white px-2.5 py-1.5 flex items-center justify-between gap-2">
        <div className="text-left">
          <div className="text-[9px] font-mono font-black uppercase tracking-wider text-black">
            REF: {reqRefNumber}
          </div>
          <div className="text-[9px] font-mono font-bold text-black">
            PO: {sample.poNumber || 'SAMPLE-DEV'} • LINE: {sample.lineCode || 'LINE-01'}
          </div>
        </div>

        <div className="text-center flex-1">
          {isEditMode ? (
            <input
              type="text"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              className="text-center text-base sm:text-lg font-black underline uppercase tracking-wider text-black border-b border-indigo-400 bg-indigo-50/50 w-full focus:outline-none"
            />
          ) : (
            <h1 className="text-base sm:text-lg font-black underline uppercase tracking-wider text-black leading-tight">
              {form.companyName}
            </h1>
          )}
          <div className="flex items-center justify-center gap-2">
            <span
              className="text-xs sm:text-sm italic text-black font-serif font-bold"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Official Sample Requisition &amp; Production Traveler Slip
            </span>
            {copyLabel && (
              <span className="px-1.5 py-0.2 border border-black bg-slate-100 font-mono text-[9px] font-black uppercase">
                {copyLabel}
              </span>
            )}
          </div>
        </div>

        <div className="text-right">
          <div
            className={`inline-block px-2 py-0.5 border border-black font-mono text-[9px] font-black uppercase ${
              form.priorityType === 'urgent'
                ? 'bg-red-600 text-white'
                : form.priorityType === 'high'
                ? 'bg-rose-200 text-black'
                : 'bg-white text-black'
            }`}
          >
            PRIORITY: {form.priorityType.toUpperCase()}
          </div>
          <div className="text-[9px] font-mono font-bold text-black mt-0.5">
            {activeColorBreakdown.length}{' '}
            {activeColorBreakdown.length === 1 ? 'COLOR' : 'COLORS'} • {activeTotalQty} PCS
          </div>
        </div>
      </div>

      {/* Executive At-A-Glance KPI Strip */}
      <div className="grid grid-cols-12 border border-b-0 border-black bg-slate-100 text-black text-[10px]">
        <div className="col-span-3 p-1.5 border-r border-black">
          <span className="text-[8px] font-bold uppercase block text-slate-700">
            STYLE CODE &amp; NAME
          </span>
          <span className="font-mono font-black text-xs uppercase block truncate">
            {form.descriptionCode} — {form.styleName}
          </span>
        </div>
        <div className="col-span-3 p-1.5 border-r border-black">
          <span className="text-[8px] font-bold uppercase block text-slate-700">
            SAME STYLE COLORWAYS ({activeColorBreakdown.length})
          </span>
          <span className="font-black text-[11px] uppercase block truncate">
            {activeColorBreakdown.map((c) => c.color).join(', ')}
          </span>
        </div>
        <div className="col-span-2 p-1.5 border-r border-black">
          <span className="text-[8px] font-bold uppercase block text-slate-700">
            SIZE NAME(S) ({activeSizeBreakdown.length})
          </span>
          <span className="font-mono font-black text-[11px] uppercase block truncate">
            {activeSizeNames}
          </span>
        </div>
        <div className="col-span-2 p-1.5 border-r border-black bg-amber-50">
          <span className="text-[8px] font-bold uppercase block text-slate-700">
            TOTAL REQ. QUANTITY
          </span>
          <span className="font-mono font-black text-xs uppercase block">
            {activeTotalQty} PCS
          </span>
        </div>
        <div className="col-span-2 p-1.5 bg-emerald-50">
          <span className="text-[8px] font-bold uppercase block text-slate-700">
            TOTAL FABRIC TO ISSUE
          </span>
          <span className="font-mono font-black text-xs uppercase block">
            {activeTotalFabricYards.toFixed(2)} YDS ({activePerPcsCons.toFixed(2)}/pc)
          </span>
        </div>
      </div>

      {/* Top Metadata Grid */}
      <div className="border border-black text-[10px] sm:text-[11px]">
        <div className="grid grid-cols-12 border-b border-black">
          <div className="col-span-2 p-1 font-bold uppercase bg-slate-100 border-r border-black flex items-center">
            DATE:
          </div>
          <div className="col-span-2 p-1 font-bold text-black border-r border-black flex items-center">
            {isEditMode && !isRequisitionLocked ? (
              <input
                type="text"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full bg-indigo-50/50 px-1 py-0.5 border border-indigo-300 font-bold"
              />
            ) : (
              <span className="font-bold text-black">{form.date}</span>
            )}
          </div>

          <div className="col-span-2 p-1 font-bold uppercase bg-slate-100 border-r border-black flex items-center">
            REQUIRED DATE:
          </div>
          <div className="col-span-2 p-1 font-bold text-black border-r border-black flex items-center">
            {isEditMode && !isRequisitionLocked ? (
              <input
                type="text"
                value={form.requiredDate}
                onChange={(e) => setForm({ ...form, requiredDate: e.target.value })}
                className="w-full bg-indigo-50/50 px-1 py-0.5 border border-indigo-300 font-bold"
              />
            ) : (
              <span className="font-bold text-black">{form.requiredDate}</span>
            )}
          </div>

          <div className="col-span-2 p-1 font-bold uppercase bg-slate-100 border-r border-black flex items-center">
            COURIER / MODE:
          </div>
          <div className="col-span-2 p-1 font-bold text-black flex items-center uppercase">
            {sample.parcelDetails?.courier || 'BUYER SPECIFIED'}
          </div>
        </div>

        <div className="grid grid-cols-12 border-b border-black">
          <div className="col-span-2 p-1 font-bold uppercase bg-slate-100 border-r border-black flex items-center">
            BUYER:
          </div>
          <div className="col-span-4 p-1 font-black uppercase text-black border-r border-black flex items-center">
            {isEditMode ? (
              <input
                type="text"
                value={form.buyer}
                onChange={(e) => setForm({ ...form, buyer: e.target.value })}
                className="w-full bg-indigo-50/50 px-1 py-0.5 border border-indigo-300 font-black uppercase"
              />
            ) : (
              <span className="font-black text-xs uppercase">{form.buyer}</span>
            )}
          </div>

          <div className="col-span-3 p-1 font-bold uppercase bg-slate-100 border-r border-black flex items-center">
            REQUESTED BY (MERCHANDISER):
          </div>
          <div className="col-span-3 p-1 font-bold text-black flex items-center">
            {isEditMode ? (
              <input
                type="text"
                value={form.requestedBy}
                onChange={(e) => setForm({ ...form, requestedBy: e.target.value })}
                className="w-full bg-indigo-50/50 px-1 py-0.5 border border-indigo-300 font-bold"
              />
            ) : (
              <span className="font-bold">{form.requestedBy || 'Merchandiser'}</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-12">
          <div className="col-span-2 p-1 font-bold uppercase bg-slate-100 border-r border-black flex items-center">
            PRIORITY:
          </div>
          <div className="col-span-5 p-1 border-r border-black flex flex-wrap items-center gap-1">
            <button
              type="button"
              disabled={isRequisitionLocked}
              onClick={() => !isRequisitionLocked && setForm({ ...form, priorityType: 'urgent' })}
              className={`px-1.5 py-0.5 border border-black font-bold text-[9px] flex items-center gap-1 ${
                isRequisitionLocked ? 'cursor-default' : 'cursor-pointer'
              } ${
                form.priorityType === 'urgent'
                  ? 'bg-red-600 text-white font-black border-red-800'
                  : 'bg-white text-black'
              }`}
            >
              <span>{form.priorityType === 'urgent' ? '[X]' : '[ ]'}</span>
              <span>URGENT (RED)</span>
            </button>
            <button
              type="button"
              disabled={isRequisitionLocked}
              onClick={() => !isRequisitionLocked && setForm({ ...form, priorityType: 'high' })}
              className={`px-1.5 py-0.5 border border-black font-bold text-[9px] flex items-center gap-1 ${
                isRequisitionLocked ? 'cursor-default' : 'cursor-pointer'
              } ${
                form.priorityType === 'high'
                  ? 'bg-rose-200 text-rose-950 font-black border-rose-600'
                  : 'bg-white text-black'
              }`}
            >
              <span>{form.priorityType === 'high' ? '[X]' : '[ ]'}</span>
              <span>HIGH (LIGHT RED)</span>
            </button>
            <button
              type="button"
              disabled={isRequisitionLocked}
              onClick={() => !isRequisitionLocked && setForm({ ...form, priorityType: 'normal' })}
              className={`px-1.5 py-0.5 border border-black font-bold text-[9px] flex items-center gap-1 ${
                isRequisitionLocked ? 'cursor-default' : 'cursor-pointer'
              } ${
                form.priorityType === 'normal'
                  ? 'bg-white text-black font-black ring-1 ring-black'
                  : 'bg-white text-black opacity-75'
              }`}
            >
              <span>{form.priorityType === 'normal' ? '[X]' : '[ ]'}</span>
              <span>NORMAL (WHITE)</span>
            </button>
          </div>

          <div className="col-span-2 p-1 font-bold uppercase bg-slate-100 border-r border-black flex items-center">
            SAMPLE STAGE:
          </div>
          <div className="col-span-3 p-1 font-bold text-black flex items-center">
            {isEditMode ? (
              <input
                type="text"
                value={form.sampleType}
                onChange={(e) => setForm({ ...form, sampleType: e.target.value })}
                className="w-full bg-indigo-50/50 px-1 py-0.5 border border-indigo-300 font-bold"
              />
            ) : (
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border font-black uppercase text-[10px] ${
                  getSampleTypeTone(form.sampleType).printBadgeClass
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    getSampleTypeTone(form.sampleType).dotClass
                  }`}
                ></span>
                <span>{form.sampleType}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Product Table Grid */}
      <div className="border-x border-b border-black text-[10px] sm:text-[11px]">
        <div className="grid grid-cols-12 border-b border-black">
          <div className="col-span-2 p-1 font-bold uppercase bg-slate-100 border-r border-black flex items-center">
            STYLE / DESC:
          </div>
          <div
            className={`${
              getSampleImage(sample) ? 'col-span-8 border-r border-black' : 'col-span-10'
            } p-1 font-black text-xs sm:text-sm tracking-wider text-black flex items-center justify-between gap-2`}
          >
            {isEditMode ? (
              <input
                type="text"
                value={form.descriptionCode}
                onChange={(e) => setForm({ ...form, descriptionCode: e.target.value })}
                className="w-full bg-indigo-50/50 px-2 py-0.5 border border-indigo-300 font-black text-sm"
              />
            ) : (
              <span>
                {form.descriptionCode} — {form.styleName}
              </span>
            )}
            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 border border-black bg-slate-100 shrink-0">
              LINE: {sample.lineCode || 'LINE-01'}
            </span>
          </div>
          {getSampleImage(sample) && (
            <div className="col-span-2 p-1 flex items-center justify-center gap-1.5 bg-white">
              <img
                src={getSampleImage(sample)}
                alt={sample.styleCode}
                className="h-9 w-9 object-cover rounded border border-black shrink-0"
              />
              <span className="text-[8px] font-bold uppercase text-black leading-tight">
                Style Ref
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-12 border-b border-black bg-slate-100 font-bold text-center text-[10px]">
          <div className="col-span-3 p-1 border-r border-black text-left flex items-center">
            <span className="font-bold mr-1.5 uppercase">STYLE:</span>
            {isEditMode ? (
              <input
                type="text"
                value={form.styleName}
                onChange={(e) => setForm({ ...form, styleName: e.target.value })}
                className="flex-1 bg-indigo-50/50 px-1 py-0.5 border border-indigo-300 font-black uppercase text-[10px]"
              />
            ) : (
              <span className="font-black uppercase text-black truncate">{form.styleName}</span>
            )}
          </div>
          <div className="col-span-2 p-1 border-r border-black uppercase flex items-center justify-center">
            SIZE NAME(S)
          </div>
          <div className="col-span-3 p-1 border-r border-black uppercase flex items-center justify-center">
            COLORWAYS / WASH
          </div>
          <div className="col-span-1 p-1 border-r border-black uppercase flex items-center justify-center">
            FABRIC
          </div>
          <div className="col-span-1 p-1 border-r border-black uppercase flex items-center justify-center">
            FITTING
          </div>
          <div className="col-span-1 p-1 border-r border-black uppercase flex items-center justify-center">
            THREAD
          </div>
          <div className="col-span-1 p-1 uppercase flex items-center justify-center">
            TOTAL QTY
          </div>
        </div>

        <div className="grid grid-cols-12 border-b border-black text-center min-h-[44px]">
          <div className="col-span-3 p-1.5 border-r border-black text-left flex items-center">
            <span className="font-bold mr-1.5 uppercase shrink-0">BLOCK:</span>
            <div className="flex-1">
              {isEditMode ? (
                <input
                  type="text"
                  value={form.block}
                  onChange={(e) => setForm({ ...form, block: e.target.value })}
                  className="w-full bg-indigo-50/50 px-1 py-0.5 border border-indigo-300 font-semibold"
                />
              ) : (
                <span className="text-black font-semibold">{form.block || 'STANDARD'}</span>
              )}
            </div>
          </div>

          <div className="col-span-2 p-1 border-r border-black flex flex-col justify-center items-center">
            <div className="font-mono font-black text-[11px] text-black leading-tight break-words">
              {activeSizeNames}
            </div>
            <div className="text-[9px] font-bold text-slate-700">
              ({activeSizeBreakdown.length}{' '}
              {activeSizeBreakdown.length === 1 ? 'Size' : 'Sizes'})
            </div>
          </div>

          <div className="col-span-3 p-1 border-r border-black font-bold uppercase flex flex-col items-center justify-center">
            {isEditMode ? (
              <input
                type="text"
                value={form.colorWash}
                onChange={(e) => setForm({ ...form, colorWash: e.target.value })}
                className="w-full text-center bg-indigo-50/50 p-1 border border-indigo-300 font-bold uppercase"
              />
            ) : (
              <>
                <span className="text-[10px] font-black text-black leading-tight">
                  {activeColorBreakdown.map((c) => c.color).join(', ')}
                </span>
                <span className="text-[9px] font-mono text-slate-700">
                  ({activeColorBreakdown.length}{' '}
                  {activeColorBreakdown.length === 1 ? 'Colorway' : 'Colorways'})
                </span>
              </>
            )}
          </div>

          <div className="col-span-1 p-1 border-r border-black font-mono font-bold text-[10px] break-all flex items-center justify-center">
            {isEditMode ? (
              <input
                type="text"
                value={form.fabricCode}
                onChange={(e) => setForm({ ...form, fabricCode: e.target.value })}
                className="w-full text-center bg-indigo-50/50 p-0.5 border border-indigo-300 font-mono text-[10px]"
              />
            ) : (
              <span>{form.fabricCode || 'N/A'}</span>
            )}
          </div>

          <div className="col-span-1 p-1 border-r border-black text-[10px] flex items-center justify-center leading-tight">
            {isEditMode ? (
              <input
                type="text"
                value={form.fitting}
                onChange={(e) => setForm({ ...form, fitting: e.target.value })}
                className="w-full bg-indigo-50/50 p-0.5 border border-indigo-300 text-[10px]"
              />
            ) : (
              <span>{form.fitting || 'REG'}</span>
            )}
          </div>

          <div className="col-span-1 p-1 border-r border-black text-[9px] flex items-center justify-center leading-tight font-bold">
            {isEditMode ? (
              <input
                type="text"
                value={form.threadInstruction}
                onChange={(e) =>
                  setForm({
                    ...form,
                    threadInstruction: e.target.value,
                    threadNote: e.target.value,
                    trims: { ...form.trims, threadNote: e.target.value },
                  })
                }
                className="w-full bg-indigo-50/50 p-0.5 border border-indigo-300 text-[9px]"
              />
            ) : (
              <span>
                {form.threadInstruction ||
                  form.trims.threadNote ||
                  form.threadNote ||
                  'AS PER CHART'}
              </span>
            )}
          </div>

          <div className="col-span-1 p-1 font-bold flex items-center justify-center bg-amber-50">
            {isEditMode ? (
              <input
                type="text"
                value={form.quantityText}
                onChange={(e) => setForm({ ...form, quantityText: e.target.value })}
                className="w-full text-center bg-indigo-50/50 p-0.5 border border-indigo-300 font-bold"
              />
            ) : (
              <span className="font-mono font-black text-xs">{activeTotalQty} Pcs</span>
            )}
          </div>
        </div>

        {/* SAME-STYLE MULTI-COLORWAY BREAKDOWN TABLE (Supports 1 or Multiple Colors in Single Requisition) */}
        <div className="border-b border-black bg-white text-[10px]">
          <div className="px-2 py-1 bg-cyan-50 border-b border-black flex flex-wrap items-center justify-between gap-2">
            <span className="font-black uppercase text-black tracking-wide flex items-center gap-1.5">
              <span>
                SAME STYLE • COLORWAY-WISE REQUISITION SCHEDULE ({activeColorBreakdown.length}{' '}
                {activeColorBreakdown.length === 1 ? 'COLOR' : 'DIFFERENT COLORS'} IN SINGLE REQUISITION)
              </span>
            </span>

            {isEditMode && !isRequisitionLocked && (
              <div className="flex flex-wrap items-center gap-1 print:hidden">
                <input
                  type="text"
                  placeholder="Add color(s) (e.g. Black, Olive)..."
                  value={newColorNameInput}
                  onChange={(e) => setNewColorNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddColorRowInForm();
                    }
                  }}
                  className="px-1.5 py-0.5 border border-black bg-white text-black text-[10px] w-40"
                />
                <button
                  type="button"
                  onClick={handleAddColorRowInForm}
                  className="px-2 py-0.5 bg-cyan-200 hover:bg-cyan-300 text-black border border-black font-bold text-[9px] cursor-pointer"
                >
                  + Add Color
                </button>
                {MULTI_COLOR_PACK_PRESETS.slice(0, 2).map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      const nextColors: ColorBreakdownItem[] = preset.colors.map((c) => ({
                        color: c,
                        wash: sample.washDetails?.washType || 'Standard Wash',
                        sizes: activeSizeNames,
                        quantity: Math.max(1, activeSizeBreakdown.reduce((s, b) => s + b.quantity, 0)),
                      }));
                      const total = nextColors.reduce((s, c) => s + c.quantity, 0);
                      setForm({
                        ...form,
                        colorBreakdown: nextColors,
                        colorWash: nextColors.map((c) => c.color).join(', '),
                        quantityText: `${total} Pcs`,
                        fabricRequiredYards: Number((activePerPcsCons * total).toFixed(2)),
                      });
                    }}
                    className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-black border border-black font-mono font-bold text-[9px] cursor-pointer"
                  >
                    Load {preset.colors.length} Colors
                  </button>
                ))}
              </div>
            )}

            <span className="font-mono font-black text-black">
              STYLE: {form.descriptionCode} • {activeColorBreakdown.length} COLOR(S) = {activeTotalQty} PCS
            </span>
          </div>

          <div className="grid grid-cols-12 bg-slate-100 border-b border-black font-black text-[9px] uppercase text-center">
            <div className="col-span-1 p-1 border-r border-black">CLR #</div>
            <div className="col-span-3 p-1 border-r border-black text-left">
              COLOR / SHADE NAME
            </div>
            <div className="col-span-3 p-1 border-r border-black text-left">
              WASH / FINISH RECIPE
            </div>
            <div className="col-span-2 p-1 border-r border-black">SIZE NAME(S)</div>
            <div className="col-span-1 p-1 border-r border-black">REQ QTY</div>
            <div className="col-span-1 p-1 border-r border-black">FABRIC</div>
            <div className="col-span-1 p-1">CUT CHK</div>
          </div>

          {activeColorBreakdown.map((clrItem, idx) => {
            const estYds = Number((clrItem.quantity * activePerPcsCons).toFixed(2));
            return (
              <div
                key={`${clrItem.color}-${idx}`}
                className="grid grid-cols-12 border-b last:border-b-0 border-black text-[10px] items-center text-center"
              >
                <div className="col-span-1 p-1 border-r border-black font-mono font-black bg-slate-50">
                  #{idx + 1}
                </div>
                <div className="col-span-3 p-1 border-r border-black text-left font-black uppercase">
                  {isEditMode && !isRequisitionLocked ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={clrItem.color}
                        onChange={(e) => {
                          const updated = [...activeColorBreakdown];
                          updated[idx] = { ...updated[idx], color: e.target.value };
                          setForm({
                            ...form,
                            colorBreakdown: updated,
                            colorWash: updated.map((c) => c.color).join(', '),
                          });
                        }}
                        className="w-full bg-indigo-50 px-1 py-0.5 border border-indigo-300 font-bold text-[10px]"
                      />
                      {activeColorBreakdown.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = activeColorBreakdown.filter((_, i) => i !== idx);
                            const nextTotal = updated.reduce((s, c) => s + c.quantity, 0);
                            setForm({
                              ...form,
                              colorBreakdown: updated,
                              colorWash: updated.map((c) => c.color).join(', '),
                              quantityText: `${nextTotal} Pcs`,
                            });
                          }}
                          className="text-rose-600 font-black px-1 cursor-pointer"
                          title="Remove color"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ) : (
                    <span>{clrItem.color}</span>
                  )}
                </div>
                <div className="col-span-3 p-1 border-r border-black text-left font-semibold uppercase">
                  {isEditMode && !isRequisitionLocked ? (
                    <input
                      type="text"
                      value={clrItem.wash || sample.washDetails?.washType || 'Standard Wash'}
                      onChange={(e) => {
                        const updated = [...activeColorBreakdown];
                        updated[idx] = { ...updated[idx], wash: e.target.value };
                        setForm({ ...form, colorBreakdown: updated });
                      }}
                      className="w-full bg-indigo-50 px-1 py-0.5 border border-indigo-300 text-[10px]"
                    />
                  ) : (
                    <span>{clrItem.wash || sample.washDetails?.washType || 'Standard Wash'}</span>
                  )}
                </div>
                <div className="col-span-2 p-1 border-r border-black font-mono font-bold">
                  {clrItem.sizes || activeSizeNames}
                </div>
                <div className="col-span-1 p-1 border-r border-black font-mono font-black bg-amber-50/60">
                  {isEditMode && !isRequisitionLocked ? (
                    <input
                      type="number"
                      min="1"
                      value={clrItem.quantity}
                      onChange={(e) => {
                        const updated = [...activeColorBreakdown];
                        updated[idx] = {
                          ...updated[idx],
                          quantity: Math.max(1, Number(e.target.value) || 1),
                        };
                        const nextTotal = updated.reduce((s, c) => s + c.quantity, 0);
                        setForm({
                          ...form,
                          colorBreakdown: updated,
                          quantityText: `${nextTotal} Pcs`,
                          fabricRequiredYards: Number((activePerPcsCons * nextTotal).toFixed(2)),
                        });
                      }}
                      className="w-full text-center bg-indigo-50 border border-indigo-300 font-mono font-bold text-[10px]"
                    />
                  ) : (
                    <span>{clrItem.quantity} Pcs</span>
                  )}
                </div>
                <div className="col-span-1 p-1 border-r border-black font-mono font-bold">
                  {estYds.toFixed(2)}y
                </div>
                <div className="col-span-1 p-1 font-mono text-[9px]">[ &nbsp; ]</div>
              </div>
            );
          })}
        </div>

        {/* SIZE-WISE REQUISITION BREAKDOWN MATRIX (Always shown for complete clarity) */}
        <div className="border-b border-black bg-white text-[10px]">
          <div className="px-2 py-1 bg-amber-50 border-b border-black flex flex-wrap items-center justify-between gap-2">
            <span className="font-black uppercase text-black tracking-wide">
              SIZE-WISE REQUISITION BREAKDOWN ({activeSizeBreakdown.length}{' '}
              {activeSizeBreakdown.length === 1 ? 'SIZE' : 'SIZES'}): {activeSizeNames}
            </span>
            {isEditMode && !isRequisitionLocked && (
              <div className="flex flex-wrap items-center gap-1 print:hidden">
                {GOLD_SEAL_SIZE_RUN_PRESETS.slice(0, 4).map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      const nextBreakdown: SizeBreakdownItem[] = preset.sizes.map((s) => ({
                        size: s,
                        quantity: 1,
                      }));
                      const totalQty = nextBreakdown.length;
                      setForm({
                        ...form,
                        sizeBreakdown: nextBreakdown,
                        quantityText: `${totalQty} Pcs`,
                        sampleSizeLabel: `${form.sampleType} (${nextBreakdown.length} Sizes)\n${nextBreakdown
                          .map((b) => `${b.size}:${b.quantity}`)
                          .join(', ')} (${totalQty} Pcs)`,
                      });
                    }}
                    className="px-1.5 py-0.5 bg-amber-200 hover:bg-amber-300 text-black border border-black font-mono font-bold text-[9px] cursor-pointer"
                  >
                    Load {preset.count} Sizes ({preset.sizes[0]}–{preset.sizes[preset.sizes.length - 1]})
                  </button>
                ))}
              </div>
            )}
            <span className="font-mono font-black text-black">
              TOTAL REQUISITION QTY: {activeTotalQty} PCS
            </span>
          </div>

          {activeSizeBreakdown.length > 0 && (
            <div
              className="grid divide-x divide-black border-b-0"
              style={{
                gridTemplateColumns: `repeat(${Math.min(
                  12,
                  Math.max(1, activeSizeBreakdown.length)
                )}, minmax(0, 1fr))`,
              }}
            >
              {activeSizeBreakdown.map((item, idx) => (
                <div key={`${item.size}-${idx}`} className="text-center flex flex-col">
                  <div className="py-0.5 px-0.5 bg-slate-100 border-b border-black font-mono font-black text-black text-[10px]">
                    {isEditMode && !isRequisitionLocked ? (
                      <input
                        type="text"
                        value={item.size}
                        onChange={(e) => {
                          const updated = [...activeSizeBreakdown];
                          updated[idx] = { ...updated[idx], size: e.target.value.toUpperCase() };
                          setForm({ ...form, sizeBreakdown: updated });
                        }}
                        className="w-full text-center bg-white border border-indigo-300 font-mono font-bold text-[10px]"
                      />
                    ) : (
                      <span>Size {item.size}</span>
                    )}
                  </div>
                  <div className="py-0.5 px-0.5 bg-white font-mono font-bold text-black text-[10px]">
                    {isEditMode && !isRequisitionLocked ? (
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const updated = [...activeSizeBreakdown];
                          updated[idx] = {
                            ...updated[idx],
                            quantity: Math.max(1, Number(e.target.value) || 1),
                          };
                          const total = updated.reduce((s, b) => s + b.quantity, 0);
                          setForm({
                            ...form,
                            sizeBreakdown: updated,
                            quantityText: `${total} Pcs`,
                          });
                        }}
                        className="w-full text-center bg-indigo-50 border border-indigo-300 font-mono font-bold text-[10px]"
                      />
                    ) : (
                      <span>{item.quantity} Pc(s)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FABRIC STORE & CONSUMPTION ISSUANCE ROW */}
        <div className="grid grid-cols-12 border-b border-black text-[10px] bg-emerald-50/40">
          <div className="col-span-4 p-1 border-r border-black flex items-center">
            <span className="font-bold mr-1.5 uppercase">FABRIC COMP:</span>
            {isEditMode ? (
              <input
                type="text"
                value={form.fabricComposition}
                onChange={(e) => setForm({ ...form, fabricComposition: e.target.value })}
                className="flex-1 bg-indigo-50/50 px-1 py-0.5 border border-indigo-300 font-semibold"
              />
            ) : (
              <span className="font-semibold text-black truncate">
                {form.fabricComposition || sample.fabricName || 'Standard Fabric'}
              </span>
            )}
          </div>
          <div className="col-span-2 p-1 border-r border-black flex items-center">
            <span className="font-bold mr-1 uppercase">SUPP:</span>
            {isEditMode ? (
              <input
                type="text"
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                className="flex-1 bg-indigo-50/50 px-1 py-0.5 border border-indigo-300"
              />
            ) : (
              <span className="truncate">{form.supplier || 'In-House'}</span>
            )}
          </div>
          <div className="col-span-2 p-1 border-r border-black flex items-center">
            <span className="font-bold mr-1 uppercase">WEIGHT:</span>
            {isEditMode ? (
              <input
                type="text"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                className="flex-1 bg-indigo-50/50 px-1 py-0.5 border border-indigo-300 font-mono"
              />
            ) : (
              <span className="font-mono">{form.weight || 'Std GSM'}</span>
            )}
          </div>
          <div className="col-span-2 p-1 border-r border-black flex items-center font-mono">
            <span className="font-bold mr-1 uppercase">CONS/PC:</span>
            <span className="font-black text-black">{activePerPcsCons.toFixed(2)} Yds</span>
          </div>
          <div className="col-span-2 p-1 flex items-center font-mono bg-emerald-100/70">
            <span className="font-bold mr-1 uppercase">ISSUE:</span>
            <span className="font-black text-black">{activeTotalFabricYards.toFixed(2)} Yds</span>
          </div>
        </div>

        {/* DEDICATED THREAD, ZIPPER & BUTTON NOTES ROW */}
        <div className="grid grid-cols-12 bg-slate-50 text-[10px]">
          <div className="col-span-4 p-1 border-r border-black flex items-center">
            <span className="font-black mr-1 uppercase shrink-0">THREAD NOTE:</span>
            {isEditMode ? (
              <input
                type="text"
                value={form.trims.threadNote || form.threadNote || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    threadNote: e.target.value,
                    threadInstruction: e.target.value,
                    trims: { ...form.trims, threadNote: e.target.value },
                  })
                }
                className="flex-1 bg-indigo-50/50 px-1 py-0.5 border border-indigo-300 font-bold uppercase text-[10px]"
              />
            ) : (
              <span className="font-bold uppercase text-black truncate">
                {form.trims.threadNote || form.threadNote || form.threadInstruction || 'AS PER CHART'}
              </span>
            )}
          </div>
          <div className="col-span-4 p-1 border-r border-black flex items-center">
            <span className="font-black mr-1 uppercase shrink-0">ZIPPER NOTE:</span>
            {isEditMode ? (
              <input
                type="text"
                value={form.trims.zipperNote || form.zipperNote || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    zipperNote: e.target.value,
                    trims: { ...form.trims, zipperNote: e.target.value },
                  })
                }
                className="flex-1 bg-indigo-50/50 px-1 py-0.5 border border-indigo-300 font-bold uppercase text-[10px]"
              />
            ) : (
              <span className="font-bold uppercase text-black truncate">
                {form.trims.zipperNote || form.zipperNote || 'AS PER SAMPLE'}
              </span>
            )}
          </div>
          <div className="col-span-4 p-1 flex items-center">
            <span className="font-black mr-1 uppercase shrink-0">BUTTON NOTE:</span>
            {isEditMode ? (
              <input
                type="text"
                value={form.trims.buttonNote || form.buttonNote || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    buttonNote: e.target.value,
                    trims: { ...form.trims, buttonNote: e.target.value },
                  })
                }
                className="flex-1 bg-indigo-50/50 px-1 py-0.5 border border-indigo-300 font-bold uppercase text-[10px]"
              />
            ) : (
              <span className="font-bold uppercase text-black truncate">
                {form.trims.buttonNote || form.buttonNote || 'AS PER SAMPLE'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* COMPACT 4-COLUMN TRIMS & ACCESSORIES CHECKLIST (High-Efficiency Single-Page Layout) */}
      <div className="border-x border-b border-black text-[9px] sm:text-[10px]">
        <div className="px-2 py-0.5 bg-slate-100 font-black uppercase border-b border-black tracking-wide flex items-center justify-between">
          <span>TRIMS &amp; ACCESSORIES CHECKLIST (TICK ITEMS ISSUED WITH REQUISITION)</span>
          <span className="font-mono text-[9px]">
            POCKETING: {form.trims.pocketingNote || 'TC POCKETING ( WHITE )'}
          </span>
        </div>

        <div className="grid grid-cols-4 divide-x divide-black border-b border-black">
          {(
            [
              { key: 'mainLabel', label: 'MAIN LABEL' },
              { key: 'sizeLabel', label: 'SIZE LABEL' },
              { key: 'careOrigin', label: 'CARE / C.O. LABEL' },
              { key: 'button', label: 'BUTTON / SHANK' },
            ] as const
          ).map((t) => (
            <div
              key={t.key}
              onClick={() => handleToggleTrim(t.key)}
              className="flex items-center p-1 hover:bg-slate-50 cursor-pointer select-none"
            >
              <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center mr-1.5 text-[9px] font-black shrink-0">
                {form.trims[t.key] ? 'X' : ''}
              </span>
              <span className="font-bold truncate">{t.label}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-4 divide-x divide-black border-b border-black">
          {(
            [
              { key: 'thread', label: 'SEWING THREAD' },
              { key: 'zipper', label: 'ZIPPER / FLY' },
              { key: 'rivet', label: 'RIVET / BURR' },
              { key: 'interlining', label: 'INTERLINING' },
            ] as const
          ).map((t) => (
            <div
              key={t.key}
              onClick={() => handleToggleTrim(t.key)}
              className="flex items-center p-1 hover:bg-slate-50 cursor-pointer select-none"
            >
              <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center mr-1.5 text-[9px] font-black shrink-0">
                {form.trims[t.key] ? 'X' : ''}
              </span>
              <span className="font-bold truncate">{t.label}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-4 divide-x divide-black border-b border-black">
          {(
            [
              { key: 'pocketing', label: 'POCKETING FABRIC' },
              { key: 'elastic', label: 'ELASTIC / WAIST' },
              { key: 'drawstring', label: 'DRAWSTRING / CORD' },
              { key: 'stopperEyelet', label: 'STOPPER / EYELET' },
            ] as const
          ).map((t) => (
            <div
              key={t.key}
              onClick={() => handleToggleTrim(t.key)}
              className="flex items-center p-1 hover:bg-slate-50 cursor-pointer select-none"
            >
              <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center mr-1.5 text-[9px] font-black shrink-0">
                {form.trims[t.key] ? 'X' : ''}
              </span>
              <span className="font-bold truncate">{t.label}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-4 divide-x divide-black">
          {(
            [
              { key: 'buckles', label: 'BUCKLES / D-RING' },
              { key: 'velcro', label: 'VELCRO TAPE' },
              { key: 'stud', label: 'METAL STUD' },
              { key: 'snap', label: 'SNAP BUTTON' },
            ] as const
          ).map((t) => (
            <div
              key={t.key}
              onClick={() => handleToggleTrim(t.key)}
              className="flex items-center p-1 hover:bg-slate-50 cursor-pointer select-none"
            >
              <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center mr-1.5 text-[9px] font-black shrink-0">
                {form.trims[t.key] ? 'X' : ''}
              </span>
              <span className="font-bold truncate">{t.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Special Instructions & Sampling Room Notes */}
      <div className="border-x border-b border-black text-[10px]">
        <div className="p-1 border-b border-black font-bold uppercase tracking-wide bg-slate-50 flex items-center">
          <span className="font-black mr-2 shrink-0">SPECIAL INSTRUCTIONS / NOTES:</span>
          {isEditMode ? (
            <input
              type="text"
              value={form.specialInstructions}
              onChange={(e) => setForm({ ...form, specialInstructions: e.target.value })}
              className="flex-1 bg-indigo-50/50 px-2 py-0.5 border border-indigo-300 font-bold uppercase"
            />
          ) : (
            <span>{form.specialInstructions || 'FOLLOW APPROVED TECH PACK & MEASUREMENT SPEC SHEET'}</span>
          )}
        </div>

        <div className="p-1 flex items-center">
          <span className="font-bold uppercase mr-2 shrink-0">
            SAMPLING SECTION REMARKS:
          </span>
          {isEditMode ? (
            <input
              type="text"
              value={form.samplingSectionNotes}
              onChange={(e) => setForm({ ...form, samplingSectionNotes: e.target.value })}
              placeholder="Enter sample room notes / operator remarks..."
              className="flex-1 bg-indigo-50/50 px-2 py-0.5 border border-indigo-300 text-xs"
            />
          ) : (
            <span className="text-black italic">{form.samplingSectionNotes || '—'}</span>
          )}
        </div>
      </div>

      {/* DEPARTMENT HANDOVER & FLOOR TRAVELER ROUTING STRIP */}
      {showFloorRouting && (
        <div className="border-x border-b border-black text-[9px]">
          <div className="px-2 py-0.5 bg-slate-100 border-b border-black font-black uppercase tracking-wide flex items-center justify-between">
            <span>SAMPLE ROOM DEPARTMENT HANDOVER &amp; STAGE ROUTING TRACKER</span>
            <span className="font-mono">CURRENT STAGE: {sample.stage.toUpperCase()}</span>
          </div>
          <div className="grid grid-cols-5 divide-x divide-black text-center">
            {[
              { dept: '1. PATTERN & CUT', sub: 'Cut Qty / Date / Sign' },
              { dept: '2. SAMPLE SEWING', sub: `Line: ${sample.lineCode || 'L-01'} / Sign` },
              { dept: '3. WASH / DYEING', sub: 'Recipe / Tech Sign' },
              { dept: '4. FINISH & IRON', sub: 'Trim / Spec Check' },
              { dept: '5. FINAL QC & PACK', sub: 'Pass / Parcel Sign' },
            ].map((step) => (
              <div key={step.dept} className="p-1 flex flex-col justify-between min-h-[38px]">
                <div className="font-black uppercase text-black">{step.dept}</div>
                <div className="text-[8px] text-slate-600 mt-2 border-t border-dotted border-black pt-0.5">
                  {step.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom 4-Column Authorized Signatures Block */}
      <div className="border-x border-b border-black p-2 pt-5 grid grid-cols-4 gap-4 text-[9px] sm:text-[10px] font-bold bg-white">
        <div className="flex flex-col">
          <div className="border-b border-black pb-0.5 mb-0.5 font-mono uppercase truncate">
            MERCHANDISER: {form.merchandiserSignature || form.requestedBy || ''}
          </div>
          <span className="text-[8px] text-slate-700 font-normal">
            Prepared By / Merchandising
          </span>
        </div>

        <div className="flex flex-col">
          <div className="border-b border-black pb-0.5 mb-0.5 font-mono uppercase">
            FABRIC &amp; TRIMS STORE:
          </div>
          <span className="text-[8px] text-slate-700 font-normal">
            Issued ({activeTotalFabricYards.toFixed(2)} Yds) &amp; Verified
          </span>
        </div>

        <div className="flex flex-col">
          <div className="border-b border-black pb-0.5 mb-0.5 font-mono uppercase truncate">
            RECEIVED BY: {form.receivedBy || ''}
          </div>
          <span className="text-[8px] text-slate-700 font-normal">
            Sampling Room Supervisor
          </span>
        </div>

        <div className="flex flex-col">
          <div className="border-b border-black pb-0.5 mb-0.5 font-mono uppercase">
            QA / HEAD OF SAMPLING:
          </div>
          <span className="text-[8px] text-slate-700 font-normal">
            Final Approval &amp; Dispatch Sign-Off
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div
      id="requisition-print-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto print:p-0 print:m-0 print:bg-white print:backdrop-blur-none print:static print:block"
    >
      <div
        id="requisition-print-modal-container"
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl relative max-h-[96vh] overflow-y-auto text-xs text-slate-300 print:max-h-none print:overflow-visible print:border-0 print:rounded-none print:shadow-none print:bg-white print:text-black print:p-0 print:m-0 print:w-full"
      >
        {/* Modal Top Control Bar (Hidden when Printing) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <StyleProductImage sample={sample} size="sm" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Sample Requisition &amp; Print Page
                </h2>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] ${
                    getPriorityTone(form.priorityType || sample.priority).badgeClass
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      getPriorityTone(form.priorityType || sample.priority).dotClass
                    }`}
                  ></span>
                  <span>{getPriorityTone(form.priorityType || sample.priority).label}</span>
                </span>
                <SampleTypeBadge sampleType={form.sampleType || sample.sampleType} size="xs" />
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-500/30">
                  {activeColorBreakdown.length}{' '}
                  {activeColorBreakdown.length === 1 ? 'Color' : 'Colors'} • {activeTotalQty} Pcs
                </span>
                {savedSuccess && (
                  <span className="text-[10px] text-emerald-400 font-bold animate-pulse flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Saved!
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-xs">
                Single-page optimized A4 factory requisition with multi-color schedule, size breakdown, fabric store issuance, and floor routing tracker.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {isRequisitionLocked ? (
              <span className="px-3 py-1.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span>Saved &amp; Locked</span>
              </span>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer text-xs ${
                    isEditMode
                      ? 'bg-amber-600 hover:bg-amber-500 text-white shadow'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                  title="Toggle interactive form editing mode"
                >
                  {isEditMode ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                  <span>{isEditMode ? 'Preview Print Slip' : 'Edit Requisition'}</span>
                </button>

                {onSaveForm && (
                  <button
                    type="button"
                    onClick={handleRequestSave}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow transition-colors cursor-pointer text-xs flex items-center gap-1.5"
                    title="Save & Permanently Lock Requisition"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Requisition</span>
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              onClick={handleCopyText}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
              title="Copy Full Requisition Summary"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Summary</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all cursor-pointer text-xs hover:scale-105 active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print Requisition ({printCopyMode === 'dual' ? '2-Copy Slip' : '1-Page A4'})</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Print Page Efficiency & Layout Options Bar (Hidden when Printing) */}
        <div className="mb-3 p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-wrap items-center justify-between gap-2 print:hidden">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Print Efficiency Mode:</span>
            </span>
            <button
              type="button"
              onClick={() => setPrintCopyMode('single')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer transition-all ${
                printCopyMode === 'single'
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              1-Page Full Sheet (Standard A4)
            </button>
            <button
              type="button"
              onClick={() => setPrintCopyMode('dual')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer transition-all ${
                printCopyMode === 'dual'
                  ? 'bg-cyan-600 text-slate-950 border-cyan-300 shadow font-black'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              2-Copy Split Sheet (Sample Room Copy + Fabric Store Copy)
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={compactPrintMode}
                onChange={(e) => setCompactPrintMode(e.target.checked)}
                className="rounded text-indigo-600"
              />
              <span>Ultra-Compact Single-Page Fit</span>
            </label>
            <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showFloorRouting}
                onChange={(e) => setShowFloorRouting(e.target.checked)}
                className="rounded text-indigo-600"
              />
              <span>Include Dept. Floor Routing Tracker</span>
            </label>
            {!isRequisitionLocked && isEditMode && (
              <button
                onClick={handleResetToSample}
                className="text-[11px] text-amber-400 underline hover:text-amber-200 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* OFFICIAL VOLAR FASHION PVT LTD REQUISITION FORM (PRINTABLE SLIP CONTAINER) */}
        <div id="requisition-printable-slip" className="space-y-4 print:space-y-3">
          {printCopyMode === 'single' ? (
            renderRequisitionSlip('OFFICIAL REQUISITION COPY')
          ) : (
            <>
              {renderRequisitionSlip('COPY 1: SAMPLE ROOM & PRODUCTION FLOOR TRAVELER')}
              <div className="border-t-2 border-dashed border-black my-2 py-0.5 text-center font-mono text-[9px] font-bold uppercase text-black">
                ✂️ DETACH HERE — BELOW COPY FOR FABRIC &amp; TRIMS STORE ISSUANCE RECORD ✂️
              </div>
              {renderRequisitionSlip('COPY 2: FABRIC & TRIMS STORE ISSUANCE COPY')}
            </>
          )}
        </div>

        {/* Modal Bottom Action Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <div className="text-slate-400 text-xs flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>
              Style <strong className="text-white font-mono">{sample.styleCode}</strong> •{' '}
              <strong className="text-cyan-300 font-mono">
                {activeColorBreakdown.length} Colorway(s)
              </strong>{' '}
              •{' '}
              <strong className="text-indigo-300 font-mono">
                Sizes: {activeSizeNames}
              </strong>{' '}
              •{' '}
              <strong className="text-amber-300 font-mono">
                Total: {activeTotalQty} Pcs ({activeTotalFabricYards.toFixed(2)} Yds)
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow flex items-center gap-1.5 transition-all cursor-pointer text-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Now</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer text-xs font-semibold"
            >
              Done &amp; Close
            </button>
            {onViewInPipeline && (
              <button
                type="button"
                onClick={() => {
                  onViewInPipeline(sample);
                  onClose();
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all cursor-pointer text-xs"
              >
                <span>View in Pipeline</span>
              </button>
            )}
          </div>
        </div>

        {/* 2nd Confirmation Modal for Saving Requisition Slip */}
        {showSaveConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md print:hidden">
            <div className="bg-slate-900 border-2 border-amber-500/70 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs text-slate-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-[10px] font-bold uppercase">
                    2nd Confirmation Required
                  </span>
                  <h3 className="text-base font-black text-white mt-1">
                    Save &amp; Lock Requisition Form?
                  </h3>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                    Once saved, this requisition for <strong>{sample.styleCode}</strong> will be permanently locked and <strong>cannot be edited</strong> again.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowSaveConfirmModal(false);
                    setIsEditMode(true);
                  }}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Option (Continue Editing)</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirmFinalSave}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Save Option (Confirm &amp; Lock)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
