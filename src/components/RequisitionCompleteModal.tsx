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
  Edit3,
  Eye,
  RotateCcw,
  Save,
  Copy,
  Check,
  Lock,
  ShieldAlert,
  Layers,
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
  drawstring: false,
  stopperEyelet: false,
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
Thread Instruction: ${form.trims.threadNote || form.threadNote || form.threadInstruction || 'AS PER CHART'}
Zipper Instruction: ${form.trims.zipperNote || form.zipperNote || 'AS PER SAMPLE'}
Button Instruction: ${form.trims.buttonNote || form.buttonNote || 'AS PER SAMPLE'}
Basic Sewing Instructions: ${form.specialInstructions || 'Follow Approved Sample / Tech Pack'}
    `.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="requisition-print-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto print:p-0 print:m-0 print:bg-white print:backdrop-blur-none print:static print:block"
    >
      <div
        id="requisition-print-modal-container"
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl relative max-h-[96vh] overflow-y-auto text-xs text-slate-300 print:max-h-none print:overflow-visible print:border-0 print:rounded-none print:shadow-none print:bg-white print:text-black print:p-0 print:m-0 print:w-full"
      >
        {/* Modal Top Control Bar (Hidden when Printing) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <StyleProductImage sample={sample} size="sm" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Smart Sample Requisition Print Format
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
                Clean, smart requisition slip with only Threads, Zipper, Button &amp; Basic Sewing Items Instructions.
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
                  <span>{isEditMode ? 'Preview Slip' : 'Edit Requisition'}</span>
                </button>

                {isEditMode && (
                  <button
                    type="button"
                    onClick={handleResetToSample}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl border border-slate-700 transition-colors cursor-pointer text-xs flex items-center gap-1"
                    title="Reset fields from sample data"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}

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
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all cursor-pointer text-xs hover:scale-105 active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print Requisition</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* SIMPLE & SMART PRINTABLE SAMPLE REQUISITION SLIP                        */}
        {/* Only Threads, Zipper, Button & Basic Sewing Items Instructions          */}
        {/* ======================================================================= */}
        <div
          id="requisition-printable-slip"
          className="bg-white text-black p-3 sm:p-5 rounded-lg border-2 border-black font-sans print:border-black print:p-2 print:m-0 print:rounded-none print:shadow-none print:w-full print:text-black selection:bg-indigo-100"
          style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}
        >
          {/* 1. Header Banner */}
          <div className="border border-b-0 border-black bg-white px-3 py-2 flex items-center justify-between gap-2">
            <div className="text-left">
              <div className="text-[10px] font-mono font-black uppercase text-black">
                REF: {reqRefNumber}
              </div>
              <div className="text-[9px] font-mono font-bold text-black">
                LINE: {sample.lineCode || 'LINE-01'} • PO: {sample.poNumber || 'SAMPLE-DEV'}
              </div>
            </div>

            <div className="text-center flex-1">
              {isEditMode ? (
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className="text-center text-lg sm:text-xl font-black underline uppercase tracking-wider text-black border-b border-indigo-400 bg-indigo-50/50 w-full focus:outline-none"
                />
              ) : (
                <h1 className="text-lg sm:text-xl font-black underline uppercase tracking-wider text-black leading-tight">
                  {form.companyName}
                </h1>
              )}
              <div
                className="text-xs sm:text-sm italic text-black font-serif font-bold"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Sample Requisition Form
              </div>
            </div>

            <div className="text-right">
              <div
                className={`inline-block px-2 py-0.5 border border-black font-mono text-[10px] font-black uppercase ${
                  form.priorityType === 'urgent'
                    ? 'bg-red-600 text-white'
                    : form.priorityType === 'high'
                    ? 'bg-rose-200 text-black'
                    : 'bg-white text-black'
                }`}
              >
                PRIORITY: {form.priorityType.toUpperCase()}
              </div>
              <div className="text-[10px] font-mono font-black text-black mt-0.5">
                TOTAL QTY: {activeTotalQty} PCS
              </div>
            </div>
          </div>

          {/* 2. Top Metadata Grid (Date, Required Date, Buyer, Requested By, Priority, Sample Type) */}
          <div className="border border-black text-[11px]">
            <div className="grid grid-cols-12 border-b border-black">
              <div className="col-span-2 p-1.5 font-bold uppercase bg-slate-100 border-r border-black flex items-center">
                DATE:
              </div>
              <div className="col-span-4 p-1.5 font-bold text-black border-r border-black flex items-center">
                {isEditMode && !isRequisitionLocked ? (
                  <input
                    type="text"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full bg-indigo-50/50 px-1 py-0.5 border border-indigo-300 font-bold"
                  />
                ) : (
                  <span>{form.date}</span>
                )}
              </div>

              <div className="col-span-3 p-1.5 font-bold uppercase bg-slate-100 border-r border-black flex items-center">
                REQUIRED DATE:
              </div>
              <div className="col-span-3 p-1.5 font-bold text-black flex items-center">
                {isEditMode && !isRequisitionLocked ? (
                  <input
                    type="text"
                    value={form.requiredDate}
                    onChange={(e) => setForm({ ...form, requiredDate: e.target.value })}
                    className="w-full bg-indigo-50/50 px-1 py-0.5 border border-indigo-300 font-bold"
                  />
                ) : (
                  <span>{form.requiredDate}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-12 border-b border-black">
              <div className="col-span-2 p-1.5 font-bold uppercase bg-slate-100 border-r border-black flex items-center">
                BUYER:
              </div>
              <div className="col-span-4 p-1.5 font-black uppercase text-black border-r border-black flex items-center">
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

              <div className="col-span-3 p-1.5 font-bold uppercase bg-slate-100 border-r border-black flex items-center">
                REQUESTED BY:
              </div>
              <div className="col-span-3 p-1.5 font-bold text-black flex items-center">
                {isEditMode ? (
                  <input
                    type="text"
                    value={form.requestedBy}
                    onChange={(e) => setForm({ ...form, requestedBy: e.target.value })}
                    className="w-full bg-indigo-50/50 px-1 py-0.5 border border-indigo-300 font-bold"
                  />
                ) : (
                  <span>{form.requestedBy || 'Merchandiser'}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-12">
              <div className="col-span-2 p-1.5 font-bold uppercase bg-slate-100 border-r border-black flex items-center">
                PRIORITY:
              </div>
              <div className="col-span-4 p-1 border-r border-black flex flex-wrap items-center gap-1">
                {(['normal', 'high', 'urgent'] as const).map((pLevel) => (
                  <button
                    key={pLevel}
                    type="button"
                    disabled={isRequisitionLocked}
                    onClick={() => !isRequisitionLocked && setForm({ ...form, priorityType: pLevel })}
                    className={`px-1.5 py-0.5 border border-black font-bold text-[9px] uppercase ${
                      isRequisitionLocked ? 'cursor-default' : 'cursor-pointer'
                    } ${
                      form.priorityType === pLevel
                        ? pLevel === 'urgent'
                          ? 'bg-red-600 text-white font-black'
                          : pLevel === 'high'
                          ? 'bg-rose-200 text-black font-black'
                          : 'bg-white text-black font-black ring-1 ring-black'
                        : 'bg-white text-black opacity-70'
                    }`}
                  >
                    {form.priorityType === pLevel ? '[X] ' : '[ ] '}
                    {pLevel}
                  </button>
                ))}
              </div>

              <div className="col-span-3 p-1.5 font-bold uppercase bg-slate-100 border-r border-black flex items-center">
                TYPE OF SAMPLE:
              </div>
              <div className="col-span-3 p-1.5 font-bold text-black flex items-center">
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
                    <span>{form.sampleType}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 3. Smart Style, Colorway, Size & Fabric Summary Table */}
          <div className="border-x border-b border-black text-[11px]">
            {/* Style Code, Style Name & Reference Image */}
            <div className="grid grid-cols-12 border-b border-black">
              <div className="col-span-2 p-1.5 font-bold uppercase bg-slate-100 border-r border-black flex items-center">
                STYLE &amp; DESC:
              </div>
              <div
                className={`${
                  getSampleImage(sample) ? 'col-span-8 border-r border-black' : 'col-span-10'
                } p-1.5 font-black text-sm tracking-wide text-black flex items-center justify-between gap-2`}
              >
                {isEditMode ? (
                  <div className="flex items-center gap-2 w-full">
                    <input
                      type="text"
                      value={form.descriptionCode}
                      onChange={(e) => setForm({ ...form, descriptionCode: e.target.value })}
                      className="w-36 bg-indigo-50/50 px-2 py-0.5 border border-indigo-300 font-black text-sm"
                    />
                    <input
                      type="text"
                      value={form.styleName}
                      onChange={(e) => setForm({ ...form, styleName: e.target.value })}
                      className="flex-1 bg-indigo-50/50 px-2 py-0.5 border border-indigo-300 font-black text-sm"
                    />
                  </div>
                ) : (
                  <span>
                    {form.descriptionCode} — {form.styleName}
                  </span>
                )}
              </div>
              {getSampleImage(sample) && (
                <div className="col-span-2 p-1 flex items-center justify-center gap-1.5 bg-white">
                  <img
                    src={getSampleImage(sample)}
                    alt={sample.styleCode}
                    className="h-10 w-10 object-cover rounded border border-black shrink-0"
                  />
                  <span className="text-[8px] font-bold uppercase text-black leading-tight">
                    Style Photo
                  </span>
                </div>
              )}
            </div>

            {/* Key Specs Row: Size Name(s), Total Req Qty, Fabric Code & Total Fabric Yards */}
            <div className="grid grid-cols-12 border-b border-black bg-slate-50 text-center">
              <div className="col-span-3 p-1.5 border-r border-black">
                <span className="text-[9px] font-bold uppercase block text-slate-700">
                  SIZE NAME(S)
                </span>
                <span className="font-mono font-black text-xs text-black block">
                  {activeSizeNames}
                </span>
                {activeSizeBreakdown.length > 1 && (
                  <span className="text-[9px] font-mono text-black block">
                    ({activeSizeBreakdown.map((b) => `${b.size}:${b.quantity}`).join(', ')})
                  </span>
                )}
              </div>

              <div className="col-span-2 p-1.5 border-r border-black bg-amber-50">
                <span className="text-[9px] font-bold uppercase block text-slate-700">
                  TOTAL REQ. QTY
                </span>
                <span className="font-mono font-black text-sm text-black block">
                  {activeTotalQty} PCS
                </span>
              </div>

              <div className="col-span-4 p-1.5 border-r border-black">
                <span className="text-[9px] font-bold uppercase block text-slate-700">
                  FABRIC CODE &amp; COMPOSITION
                </span>
                <span className="font-mono font-black text-xs text-black block">
                  {form.fabricCode || 'N/A'} — {form.fabricComposition || sample.fabricName || 'Standard'}
                </span>
              </div>

              <div className="col-span-3 p-1.5 bg-emerald-50">
                <span className="text-[9px] font-bold uppercase block text-slate-700">
                  FABRIC ISSUE ({activePerPcsCons.toFixed(2)} YDS/PC)
                </span>
                <span className="font-mono font-black text-sm text-black block">
                  {activeTotalFabricYards.toFixed(2)} YDS
                </span>
              </div>
            </div>

            {/* Same-Style Colorway & Wash Schedule (1 or Multiple Colors in Single Requisition) */}
            <div className="border-b border-black bg-white text-[10px]">
              <div className="px-2 py-1 bg-slate-100 border-b border-black flex flex-wrap items-center justify-between gap-2">
                <span className="font-black uppercase text-black">
                  COLORWAY &amp; WASH SCHEDULE ({activeColorBreakdown.length}{' '}
                  {activeColorBreakdown.length === 1 ? 'COLOR' : 'COLORS'} FOR THIS STYLE)
                </span>
                {isEditMode && !isRequisitionLocked && (
                  <div className="flex flex-wrap items-center gap-1 print:hidden">
                    <input
                      type="text"
                      placeholder="Add color(s)..."
                      value={newColorNameInput}
                      onChange={(e) => setNewColorNameInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddColorRowInForm();
                        }
                      }}
                      className="px-1.5 py-0.5 border border-black bg-white text-black text-[10px] w-32"
                    />
                    <button
                      type="button"
                      onClick={handleAddColorRowInForm}
                      className="px-2 py-0.5 bg-cyan-200 hover:bg-cyan-300 text-black border border-black font-bold text-[9px] cursor-pointer"
                    >
                      + Add Color
                    </button>
                    {MULTI_COLOR_PACK_PRESETS.slice(0, 1).map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          const nextColors: ColorBreakdownItem[] = preset.colors.map((c) => ({
                            color: c,
                            wash: sample.washDetails?.washType || 'Standard Wash',
                            sizes: activeSizeNames,
                            quantity: Math.max(
                              1,
                              activeSizeBreakdown.reduce((s, b) => s + b.quantity, 0)
                            ),
                          }));
                          const total = nextColors.reduce((s, c) => s + c.quantity, 0);
                          setForm({
                            ...form,
                            colorBreakdown: nextColors,
                            colorWash: nextColors.map((c) => c.color).join(', '),
                            quantityText: `${total} Pcs`,
                          });
                        }}
                        className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-black border border-black font-mono font-bold text-[9px] cursor-pointer"
                      >
                        Load 3 Colors
                      </button>
                    ))}
                    {GOLD_SEAL_SIZE_RUN_PRESETS.slice(0, 2).map((preset) => (
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
                          });
                        }}
                        className="px-1.5 py-0.5 bg-amber-200 hover:bg-amber-300 text-black border border-black font-mono font-bold text-[9px] cursor-pointer"
                      >
                        Load {preset.count} Sizes
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-12 bg-slate-50 border-b border-black font-black text-[9px] uppercase text-center">
                <div className="col-span-1 p-1 border-r border-black">#</div>
                <div className="col-span-4 p-1 border-r border-black text-left">
                  COLOR / SHADE NAME
                </div>
                <div className="col-span-3 p-1 border-r border-black text-left">
                  WASH / FINISH RECIPE
                </div>
                <div className="col-span-2 p-1 border-r border-black">SIZES</div>
                <div className="col-span-2 p-1">QUANTITY (PCS)</div>
              </div>

              {activeColorBreakdown.map((clrItem, idx) => (
                <div
                  key={`${clrItem.color}-${idx}`}
                  className="grid grid-cols-12 border-b last:border-b-0 border-black text-[10px] items-center text-center"
                >
                  <div className="col-span-1 p-1 border-r border-black font-mono font-bold">
                    {idx + 1}
                  </div>
                  <div className="col-span-4 p-1 border-r border-black text-left font-black uppercase">
                    {isEditMode && !isRequisitionLocked ? (
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
                  <div className="col-span-2 p-1 font-mono font-black">
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
                          });
                        }}
                        className="w-full text-center bg-indigo-50 border border-indigo-300 font-mono font-bold text-[10px]"
                      />
                    ) : (
                      <span>{clrItem.quantity} Pcs</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================================== */}
          {/* 4. SMART & SIMPLE INSTRUCTIONS: ONLY THREAD, ZIPPER, BUTTON & BASIC SEWING */}
          {/* ========================================================================== */}
          <div className="border-x border-b border-black text-[11px]">
            <div className="px-2.5 py-1.5 bg-slate-100 border-b border-black font-black uppercase tracking-wide flex items-center justify-between">
              <span>
                SEWING &amp; BASIC TRIMS INSTRUCTIONS (THREADS • ZIPPER • BUTTON • BASIC SEWING ITEMS)
              </span>
              <span className="font-mono text-[10px]">TICK [X] ITEMS REQUIRED</span>
            </div>

            {/* 3 Core Trim Instructions Row: Thread, Zipper, Button */}
            <div className="grid grid-cols-12 border-b border-black divide-x divide-black">
              {/* 1. THREAD INSTRUCTIONS */}
              <div className="col-span-4 p-2 space-y-1">
                <div
                  onClick={() => handleToggleTrim('thread')}
                  className="flex items-center justify-between cursor-pointer select-none"
                >
                  <span className="font-black uppercase text-black flex items-center gap-1.5">
                    <span className="w-4 h-4 border border-black inline-flex items-center justify-center text-[10px] font-black">
                      {form.trims.thread ? 'X' : ''}
                    </span>
                    <span>1. THREAD INSTRUCTION</span>
                  </span>
                  <span className="text-[9px] font-mono font-bold px-1 border border-black bg-slate-50">
                    THREAD
                  </span>
                </div>
                {isEditMode ? (
                  <input
                    type="text"
                    placeholder="Enter Thread TKT / Shade / Contrast..."
                    value={form.trims.threadNote || form.threadNote || ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        threadNote: e.target.value,
                        threadInstruction: e.target.value,
                        trims: { ...form.trims, threadNote: e.target.value },
                      })
                    }
                    className="w-full bg-indigo-50/50 px-1.5 py-1 border border-indigo-300 font-bold uppercase text-xs"
                  />
                ) : (
                  <div className="font-bold uppercase text-black text-xs pt-0.5">
                    {form.trims.threadNote ||
                      form.threadNote ||
                      form.threadInstruction ||
                      'AS PER SAMPLE / CHART'}
                  </div>
                )}
              </div>

              {/* 2. ZIPPER INSTRUCTIONS */}
              <div className="col-span-4 p-2 space-y-1">
                <div
                  onClick={() => handleToggleTrim('zipper')}
                  className="flex items-center justify-between cursor-pointer select-none"
                >
                  <span className="font-black uppercase text-black flex items-center gap-1.5">
                    <span className="w-4 h-4 border border-black inline-flex items-center justify-center text-[10px] font-black">
                      {form.trims.zipper ? 'X' : ''}
                    </span>
                    <span>2. ZIPPER INSTRUCTION</span>
                  </span>
                  <span className="text-[9px] font-mono font-bold px-1 border border-black bg-slate-50">
                    ZIPPER
                  </span>
                </div>
                {isEditMode ? (
                  <input
                    type="text"
                    placeholder="Enter Zipper Type / Gauge / Finish..."
                    value={form.trims.zipperNote || form.zipperNote || ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        zipperNote: e.target.value,
                        trims: { ...form.trims, zipperNote: e.target.value },
                      })
                    }
                    className="w-full bg-indigo-50/50 px-1.5 py-1 border border-indigo-300 font-bold uppercase text-xs"
                  />
                ) : (
                  <div className="font-bold uppercase text-black text-xs pt-0.5">
                    {form.trims.zipperNote || form.zipperNote || 'AS PER SAMPLE'}
                  </div>
                )}
              </div>

              {/* 3. BUTTON INSTRUCTIONS */}
              <div className="col-span-4 p-2 space-y-1">
                <div
                  onClick={() => handleToggleTrim('button')}
                  className="flex items-center justify-between cursor-pointer select-none"
                >
                  <span className="font-black uppercase text-black flex items-center gap-1.5">
                    <span className="w-4 h-4 border border-black inline-flex items-center justify-center text-[10px] font-black">
                      {form.trims.button ? 'X' : ''}
                    </span>
                    <span>3. BUTTON INSTRUCTION</span>
                  </span>
                  <span className="text-[9px] font-mono font-bold px-1 border border-black bg-slate-50">
                    BUTTON
                  </span>
                </div>
                {isEditMode ? (
                  <input
                    type="text"
                    placeholder="Enter Button Size / Metal / Shank..."
                    value={form.trims.buttonNote || form.buttonNote || ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        buttonNote: e.target.value,
                        trims: { ...form.trims, buttonNote: e.target.value },
                      })
                    }
                    className="w-full bg-indigo-50/50 px-1.5 py-1 border border-indigo-300 font-bold uppercase text-xs"
                  />
                ) : (
                  <div className="font-bold uppercase text-black text-xs pt-0.5">
                    {form.trims.buttonNote || form.buttonNote || 'AS PER SAMPLE'}
                  </div>
                )}
              </div>
            </div>

            {/* 4. BASIC SEWING ITEMS & STITCHING INSTRUCTIONS */}
            <div className="p-2 bg-white space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dotted border-black pb-1.5">
                <span className="font-black uppercase text-black text-[10px]">
                  4. BASIC SEWING ITEMS:
                </span>
                <div className="flex flex-wrap items-center gap-3 text-[10px]">
                  {(
                    [
                      { key: 'mainLabel', label: 'MAIN LABEL' },
                      { key: 'sizeLabel', label: 'SIZE LABEL' },
                      { key: 'careOrigin', label: 'CARE LABEL' },
                      { key: 'interlining', label: 'INTERLINING' },
                      { key: 'pocketing', label: 'POCKETING' },
                    ] as const
                  ).map((item) => (
                    <div
                      key={item.key}
                      onClick={() => handleToggleTrim(item.key)}
                      className="flex items-center gap-1 cursor-pointer select-none font-bold"
                    >
                      <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center text-[9px] font-black">
                        {form.trims[item.key] ? 'X' : ''}
                      </span>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-12 gap-2 items-center text-[11px]">
                <div className="col-span-4 flex items-center">
                  <span className="font-black uppercase mr-1.5 shrink-0">FITTING / BLOCK:</span>
                  {isEditMode ? (
                    <input
                      type="text"
                      placeholder="e.g. Regular / Slim Fit"
                      value={form.fitting}
                      onChange={(e) => setForm({ ...form, fitting: e.target.value })}
                      className="flex-1 bg-indigo-50/50 px-1.5 py-0.5 border border-indigo-300 font-bold uppercase"
                    />
                  ) : (
                    <span className="font-bold uppercase">
                      {form.fitting || form.block || 'STANDARD FIT'}
                    </span>
                  )}
                </div>

                <div className="col-span-8 flex items-center">
                  <span className="font-black uppercase mr-1.5 shrink-0">
                    BASIC SEWING INSTRUCTIONS:
                  </span>
                  {isEditMode ? (
                    <input
                      type="text"
                      placeholder="Enter basic sewing / stitching instructions..."
                      value={form.specialInstructions}
                      onChange={(e) => setForm({ ...form, specialInstructions: e.target.value })}
                      className="flex-1 bg-indigo-50/50 px-1.5 py-0.5 border border-indigo-300 font-bold uppercase"
                    />
                  ) : (
                    <span className="font-bold uppercase">
                      {form.specialInstructions ||
                        'FOLLOW APPROVED SAMPLE & TECH PACK STITCHING SPECS'}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-1 border-t border-dotted border-black flex items-center text-[10px]">
                <span className="font-bold uppercase mr-2 shrink-0">
                  SAMPLING SECTION REMARKS:
                </span>
                {isEditMode ? (
                  <input
                    type="text"
                    value={form.samplingSectionNotes}
                    onChange={(e) => setForm({ ...form, samplingSectionNotes: e.target.value })}
                    placeholder="Enter sample room notes..."
                    className="flex-1 bg-indigo-50/50 px-2 py-0.5 border border-indigo-300 text-xs"
                  />
                ) : (
                  <span className="text-black italic">{form.samplingSectionNotes || '—'}</span>
                )}
              </div>
            </div>
          </div>

          {/* 5. Clean Signatures Block */}
          <div className="border-x border-b border-black p-3 pt-6 grid grid-cols-2 gap-8 text-[11px] font-bold bg-white">
            <div className="flex flex-col">
              <div className="border-b-2 border-black pb-1 mb-1 font-mono uppercase">
                RECEIVED BY (SAMPLE ROOM): {form.receivedBy || ''}
              </div>
              <span className="text-[10px] text-slate-700 font-normal">
                Sampling Section Supervisor / In-Charge
              </span>
            </div>

            <div className="flex flex-col">
              <div className="border-b-2 border-black pb-1 mb-1 font-mono uppercase">
                MERCHANDISER SIGNATURE: {form.merchandiserSignature || form.requestedBy || ''}
              </div>
              <span className="text-[10px] text-slate-700 font-normal">
                Authorized Merchandiser Sign-Off
              </span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <div className="text-slate-400 text-xs flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>
              Style <strong className="text-white font-mono">{sample.styleCode}</strong> •{' '}
              <strong className="text-cyan-300 font-mono">
                {activeColorBreakdown.length} Color(s)
              </strong>{' '}
              •{' '}
              <strong className="text-indigo-300 font-mono">Sizes: {activeSizeNames}</strong> •{' '}
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
