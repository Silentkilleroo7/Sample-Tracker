import React, { useState, useEffect } from 'react';
import {
  SampleItem,
  VolarRequisitionForm,
  TrimsChecklist,
  SizeBreakdownItem,
  ColorBreakdownItem,
  GOLD_SEAL_SIZE_RUN_PRESETS,
  MULTI_COLOR_PACK_PRESETS,
  getSampleTypeTone,
  getEffectiveSizeBreakdown,
  getEffectiveSizeName,
  getEffectiveColorBreakdown,
  getEffectiveColorName,
  getEffectiveRequisitionQuantity,
  getEffectivePerPcsConsumption,
} from '../types/sample';
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
  onUpdateBlNumber?: (sampleId: string, blNumber: string) => void;
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
  threadNote: 'Same as Instructions',
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
  onUpdateBlNumber,
  onViewInPipeline,
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [blSavedToast, setBlSavedToast] = useState(false);
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);
  const [newColorNameInput, setNewColorNameInput] = useState<string>('');

  // Form State
  const [form, setForm] = useState<VolarRequisitionForm | null>(null);

  // Helper to format date like "26-Sep-26"
  const formatVolarDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
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
    const effectiveBlNumber =
      sample.blNumber ||
      sample.requisitionForm?.blNumber ||
      '';
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
        : effectiveColorStr || washStr || 'Mid wash';

    const effectiveBreakdown = getEffectiveSizeBreakdown(sample);
    const effectiveColors = getEffectiveColorBreakdown(sample);
    const effectiveQty = getEffectiveRequisitionQuantity(sample);
    const effectiveSizeLabelStr = getEffectiveSizeName(sample);
    const effectivePerPcsCons = getEffectivePerPcsConsumption(sample);
    const effectiveTotalYds =
      sample.fabricRequiredYards && sample.fabricRequiredYards > 0
        ? sample.fabricRequiredYards
        : Number((effectivePerPcsCons * effectiveQty).toFixed(2));

    // Format sample size cell like "Red Seal Sample\n3x Size 12"
    const formattedSampleSizeCell =
      effectiveBreakdown.length > 1
        ? `${sample.sampleType}\n${effectiveBreakdown
            .map((b) => `${b.quantity}x Size ${b.size}`)
            .join(', ')}`
        : `${sample.sampleType}\n${effectiveQty}x Size ${effectiveSizeLabelStr}`;

    if (sample.requisitionForm && sample.requisitionForm.companyName) {
      setForm({
        ...sample.requisitionForm,
        blNumber: sample.requisitionForm.blNumber || effectiveBlNumber,
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
          sample.requisitionForm.sampleSizeLabel || formattedSampleSizeCell,
        perPcsConsumptionYards:
          sample.requisitionForm.perPcsConsumptionYards || effectivePerPcsCons,
        fabricRequiredYards:
          sample.requisitionForm.fabricRequiredYards || effectiveTotalYds,
        fitting: sample.requisitionForm.fitting || 'As Tech Pack & comments',
        block: sample.requisitionForm.block || 'as spec',
        threadNote: effectiveThreadNote,
        zipperNote: effectiveZipperNote,
        buttonNote: effectiveButtonNote,
        threadInstruction:
          sample.requisitionForm.threadInstruction ||
          effectiveThreadNote ||
          'Same as Instructions',
        quantityText: sample.requisitionForm.quantityText || `${effectiveQty} Pcs`,
        trims: {
          ...DEFAULT_TRIMS,
          ...(sample.requisitionForm.trims || {}),
          threadNote: effectiveThreadNote || 'Same as Instructions',
          zipperNote: effectiveZipperNote,
          buttonNote: effectiveButtonNote,
        },
        isLocked: Boolean(sample.isRequisitionLocked || sample.requisitionForm.isLocked),
      });
    } else {
      const initialForm: VolarRequisitionForm = {
        companyName: 'VOLAR FASHION PVT LTD',
        blNumber: effectiveBlNumber,
        date: formatVolarDate(sample.createdAt) || formatVolarDate(new Date().toISOString()),
        requiredDate: formatVolarDate(sample.targetParcelDate),
        buyer: sample.buyer || '',
        requestedBy: 'Zahid Anwar',
        priorityType: sample.priority || 'normal',
        sampleType: sample.sampleType || 'Red Seal Sample',
        descriptionCode: sample.styleCode || '',
        styleName: sample.styleName || '',
        sampleSizeLabel: formattedSampleSizeCell,
        sizeBreakdown: effectiveBreakdown,
        colorWash: defaultColorWash,
        colorBreakdown: effectiveColors,
        fabricCode: sample.fabricCode || '',
        perPcsConsumptionYards: effectivePerPcsCons,
        fabricRequiredYards: effectiveTotalYds,
        fitting: 'As Tech Pack & comments',
        threadInstruction: effectiveThreadNote || 'Same as Instructions',
        threadNote: effectiveThreadNote,
        zipperNote: effectiveZipperNote,
        buttonNote: effectiveButtonNote,
        quantityText: `${effectiveQty} Pcs`,
        block: 'as spec',
        fabricComposition: sample.fabricName || '',
        supplier: '',
        weight: '',
        trims: {
          ...DEFAULT_TRIMS,
          threadNote: effectiveThreadNote || 'Same as Instructions',
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

  const handlePrint = () => {
    window.print();
  };

  const handleBlNumberChange = (nextBl: string) => {
    setForm((prev) => (prev ? { ...prev, blNumber: nextBl } : prev));
    if (onUpdateBlNumber && sample) {
      onUpdateBlNumber(sample.id, nextBl);
      setBlSavedToast(true);
      setTimeout(() => setBlSavedToast(false), 1800);
    }
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
      onSaveForm(sample.id, lockedForm);
      setShowSaveConfirmModal(false);
      setIsEditMode(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }
  };

  const handleResetDefault = () => {
    if (!sample || isRequisitionLocked) return;
    const effectiveThreadNote = sample.threadNote || '';
    const effectiveZipperNote = sample.zipperNote || '';
    const effectiveButtonNote = sample.buttonNote || '';
    const washStr = sample.washDetails?.washType || '';
    const effectiveColorStr = getEffectiveColorName(sample);
    const defaultColorWash =
      washStr &&
      washStr !== 'Standard Wash' &&
      !effectiveColorStr.toLowerCase().includes(washStr.toLowerCase())
        ? `${effectiveColorStr} / ${washStr}`
        : effectiveColorStr || washStr || 'Mid wash';
    const effectiveBreakdown = getEffectiveSizeBreakdown(sample);
    const effectiveColors = getEffectiveColorBreakdown(sample);
    const effectiveQty = getEffectiveRequisitionQuantity(sample);
    const effectiveSizeLabelStr = getEffectiveSizeName(sample);
    const effectivePerPcsCons = getEffectivePerPcsConsumption(sample);
    const effectiveTotalYds = Number((effectivePerPcsCons * effectiveQty).toFixed(2));

    setForm({
      companyName: 'VOLAR FASHION PVT LTD',
      blNumber: sample.blNumber || '',
      date: formatVolarDate(sample.createdAt) || formatVolarDate(new Date().toISOString()),
      requiredDate: formatVolarDate(sample.targetParcelDate),
      buyer: sample.buyer || '',
      requestedBy: 'Zahid Anwar',
      priorityType: sample.priority || 'normal',
      sampleType: sample.sampleType || 'Red Seal Sample',
      descriptionCode: sample.styleCode || '',
      styleName: sample.styleName || '',
      sampleSizeLabel:
        effectiveBreakdown.length > 1
          ? `${sample.sampleType}\n${effectiveBreakdown
              .map((b) => `${b.quantity}x Size ${b.size}`)
              .join(', ')}`
          : `${sample.sampleType}\n${effectiveQty}x Size ${effectiveSizeLabelStr}`,
      sizeBreakdown: effectiveBreakdown,
      colorWash: defaultColorWash,
      colorBreakdown: effectiveColors,
      fabricCode: sample.fabricCode || '',
      perPcsConsumptionYards: effectivePerPcsCons,
      fabricRequiredYards: effectiveTotalYds,
      fitting: 'As Tech Pack & comments',
      threadInstruction: effectiveThreadNote || 'Same as Instructions',
      threadNote: effectiveThreadNote,
      zipperNote: effectiveZipperNote,
      buttonNote: effectiveButtonNote,
      quantityText: `${effectiveQty} Pcs`,
      block: 'as spec',
      fabricComposition: sample.fabricName || '',
      supplier: '',
      weight: '',
      trims: {
        ...DEFAULT_TRIMS,
        threadNote: effectiveThreadNote || 'Same as Instructions',
        zipperNote: effectiveZipperNote,
        buttonNote: effectiveButtonNote,
      },
      specialInstructions: '',
      samplingSectionNotes: '',
      receivedBy: '',
      merchandiserSignature: '',
      isLocked: false,
    });
  };

  const handleCopyDetails = () => {
    const colorSummary =
      activeColorBreakdown.length > 1
        ? activeColorBreakdown
            .map((c) => `${c.color} (${c.wash || 'Std'}): ${c.quantity} Pcs`)
            .join(' | ')
        : form.colorWash;
    const text = `VOLAR FASHION PVT LTD - SAMPLE REQUISITION FORM\nBL....: ${form.blNumber || '________'}\nDate: ${form.date} | Required Date: ${form.requiredDate}\nBuyer: ${form.buyer} | Requested By: ${form.requestedBy}\nSample Type: ${form.sampleType} | Priority: ${form.priorityType.toUpperCase()}\nDESCRIPTION (Code): ${form.descriptionCode}\nSTYLE: ${form.styleName}\nBLOCK: ${form.block || 'as spec'}\nSAMPLE SIZE: ${activeSizeNames}\nCOLOR / WASH: ${colorSummary}\nQTY: ${activeTotalQty} Pcs\nFABRIC CODE: ${form.fabricCode} (${activeTotalFabricYards} Yds)\nFITTING: ${form.fitting}\nTHREAD: ${form.threadInstruction || form.threadNote || 'Same as Instructions'}\nZIPPER: ${form.zipperNote || 'Standard'}\nBUTTON: ${form.buttonNote || 'Standard'}\nSEWING INSTRUCTIONS: ${form.specialInstructions || 'As Tech Pack & comments'}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto print:static print:inset-auto print:bg-white print:p-0 print:m-0 print:block print:overflow-visible">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-6xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:rounded-none print:bg-white print:w-full print:max-w-none print:block">
        {/* TOP ACTION BAR (Hidden when printing) */}
        <div className="px-4 sm:px-6 py-3.5 bg-gradient-to-r from-indigo-950/90 via-slate-900 to-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-white">
                  Volar Sample Requisition Print Sheet
                </h2>
                <SampleTypeBadge sampleType={form.sampleType} size="sm" />
                {/* Quick Admin BL.... input in top toolbar as well */}
                <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/40 rounded-lg px-2.5 py-0.5">
                  <span className="text-[11px] font-black text-amber-300 uppercase tracking-wider">
                    BL....
                  </span>
                  <input
                    type="text"
                    value={form.blNumber || ''}
                    onChange={(e) => handleBlNumberChange(e.target.value)}
                    placeholder="Admin write BL#"
                    className="w-28 bg-slate-950/80 border border-amber-500/40 rounded px-2 py-0.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                  />
                  {blSavedToast && (
                    <span className="text-[10px] font-bold text-emerald-400">Saved</span>
                  )}
                </div>
                {isRequisitionLocked ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    <Lock className="w-3 h-3" /> Locked (BL.... Editable by Admin)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Spreadsheet Print Format
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Top-left <strong className="text-amber-300">BL....</strong> box + Focused{' '}
                <strong className="text-white">
                  Style Name, Description, Color/Wash, Pcs & Sewing Instructions
                </strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {!isRequisitionLocked ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    isEditMode
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  {isEditMode ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      Preview Print Sheet
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit Requisition Details
                    </>
                  )}
                </button>

                {isEditMode && (
                  <button
                    type="button"
                    onClick={handleResetDefault}
                    title="Reset to sample defaults"
                    className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset
                  </button>
                )}

                {onSaveForm && (
                  <button
                    type="button"
                    onClick={handleRequestSave}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-semibold transition-all cursor-pointer"
                  >
                    {savedSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Locked & Saved!
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        Confirm & Lock Requisition
                      </>
                    )}
                  </button>
                )}
              </>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-300 text-xs font-medium">
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span>Requisition Locked — Admin can still write/edit BL.... box</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleCopyDetails}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy Text
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print Requisition
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* EDIT MODE BANNER (Hidden when printing) */}
        {isEditMode && !isRequisitionLocked && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-6 py-3 flex flex-col gap-2.5 print:hidden shrink-0">
            <div className="flex items-center justify-between text-xs text-amber-200">
              <span>
                <strong>Edit Mode Active:</strong> Click any field inside the spreadsheet below to
                edit Style Name, Description, Color/Wash, Pcs, or Sewing Instructions.
              </span>
              <span className="text-[11px] text-amber-300/80">
                Changes automatically reflect on the printed sheet
              </span>
            </div>

            {/* Multi-Color & Multi-Size Quick Loaders */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-500/20">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-fuchsia-300 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" /> Multi-Color Presets:
                </span>
                {MULTI_COLOR_PACK_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      const defaultWash = sample.washDetails?.washType || 'Mid wash';
                      const nextColors: ColorBreakdownItem[] = preset.colors.map((c) => ({
                        color: c,
                        wash: defaultWash,
                        sizes: activeSizeNames,
                        quantity: 2,
                      }));
                      const nextTotal = nextColors.reduce((s, item) => s + item.quantity, 0);
                      setForm({
                        ...form,
                        colorBreakdown: nextColors,
                        colorWash: nextColors.map((c) => c.color).join(', '),
                        quantityText: `${nextTotal} Pcs`,
                        fabricRequiredYards: Number((activePerPcsCons * nextTotal).toFixed(2)),
                      });
                    }}
                    className="px-2 py-0.5 rounded bg-fuchsia-500/20 hover:bg-fuchsia-500/30 border border-fuchsia-400/50 text-fuchsia-100 text-[10px] font-bold transition-all cursor-pointer"
                  >
                    + {preset.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newColorNameInput}
                  onChange={(e) => setNewColorNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddColorRowInForm();
                    }
                  }}
                  placeholder="Add Color(s) e.g. Mid wash, Dark Indigo"
                  className="bg-slate-900 border border-fuchsia-400/50 rounded px-2 py-0.5 text-[11px] text-white w-52"
                />
                <button
                  type="button"
                  onClick={handleAddColorRowInForm}
                  className="px-2.5 py-0.5 rounded bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-[10px] font-bold cursor-pointer"
                >
                  + Add Color
                </button>
              </div>
            </div>

            {/* Size Run Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-amber-500/20">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 mr-1">
                Load Size Run:
              </span>
              {GOLD_SEAL_SIZE_RUN_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    const nextBreakdown: SizeBreakdownItem[] = preset.sizes.map((sz) => ({
                      size: sz,
                      quantity: 1,
                    }));
                    const nextTotal = nextBreakdown.reduce((s, item) => s + item.quantity, 0);
                    setForm({
                      ...form,
                      sizeBreakdown: nextBreakdown,
                      sampleSizeLabel: `${form.sampleType}\n${nextBreakdown
                        .map((b) => `${b.quantity}x Size ${b.size}`)
                        .join(', ')}`,
                      quantityText: `${nextTotal} Pcs`,
                      fabricRequiredYards: Number((activePerPcsCons * nextTotal).toFixed(2)),
                    });
                  }}
                  className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-100 text-[10px] font-bold transition-all cursor-pointer"
                >
                  + {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SCROLLABLE BODY CONTAINER */}
        <div className="p-3 sm:p-6 overflow-y-auto bg-slate-950/70 flex-1 print:p-0 print:bg-white print:overflow-visible print:block">
          {/* ===================================================================== */}
          {/* OFFICIAL VOLAR FASHION PVT LTD SPREADSHEET REQUISITION FORM           */}
          {/* Matches attached image + Top-Left BL.... Box + Focused Key Fields     */}
          {/* ===================================================================== */}
          <div
            id="printable-requisition-sheet"
            className="bg-white text-black mx-auto max-w-[1040px] p-4 sm:p-6 shadow-xl border border-slate-300 print:shadow-none print:border-none print:p-2 print:max-w-none print:w-full font-sans text-[12px] leading-snug select-text"
          >
            {/* =============================================================== */}
            {/* 1. TOP HEADER ROW WITH TOP-LEFT "BL...." ADMIN BOX & TITLE      */}
            {/* =============================================================== */}
            <div className="grid grid-cols-12 items-start gap-2 mb-2">
              {/* TOP-LEFT BLANK BOX NAMED "BL...." FOR ADMIN TO WRITE BL NUMBER */}
              <div className="col-span-4 sm:col-span-3">
                <div className="border-2 border-black bg-white px-2.5 py-2 shadow-[2px_2px_0px_#000] print:shadow-none">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-black text-[14px] tracking-wide uppercase text-black shrink-0">
                      BL....
                    </span>
                    <input
                      type="text"
                      value={form.blNumber || ''}
                      onChange={(e) => handleBlNumberChange(e.target.value)}
                      placeholder=""
                      title="Admin: Write or type BL Number here"
                      className="w-full border-b border-dotted border-black/70 bg-transparent font-mono font-black text-[14px] text-black focus:outline-none focus:bg-yellow-50/80 print:border-b print:border-black px-1 py-0.5"
                    />
                  </div>
                  <div className="text-[9px] font-semibold uppercase tracking-wider text-neutral-500 mt-0.5 print:hidden">
                    Admin BL Number Box (Click to write or handwrite on print)
                  </div>
                </div>
              </div>

              {/* CENTERED VOLAR FASHION PVT LTD HEADER (Matches Attached Image) */}
              <div className="col-span-8 sm:col-span-6 text-center pt-0.5">
                {isEditMode && !isRequisitionLocked ? (
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    className="text-center font-serif font-black text-xl sm:text-2xl tracking-wide underline decoration-2 underline-offset-4 border-b border-dashed border-amber-500 bg-amber-50/50 px-2 py-0.5 w-full max-w-md mx-auto block"
                  />
                ) : (
                  <h1 className="font-serif font-black text-xl sm:text-2xl tracking-wide underline decoration-2 underline-offset-4 uppercase text-black">
                    {form.companyName || 'VOLAR FASHION PVT LTD'}
                  </h1>
                )}
                <p
                  className="text-lg sm:text-xl italic underline decoration-1 underline-offset-4 mt-1 text-black"
                  style={{ fontFamily: "'Brush Script MT', 'Segoe Script', 'Lucida Handwriting', 'Times New Roman', cursive, serif" }}
                >
                  Sample Requisition Form
                </p>
              </div>

              {/* RIGHT SIDE SPACE (Balances Top-Left BL.... Box) */}
              <div className="hidden sm:flex sm:col-span-3 justify-end items-start">
                <div className="text-right text-[10px] text-neutral-600 font-mono">
                  <div>STYLE: {form.descriptionCode || sample.styleCode}</div>
                  <div>TOTAL: {activeTotalQty} PCS</div>
                </div>
              </div>
            </div>

            {/* =============================================================== */}
            {/* 2. TOP METADATA SPREADSHEET BLOCK (Exact Match to Image)        */}
            {/* =============================================================== */}
            <table className="w-full border-collapse border-t-2 border-b-2 border-black text-[12px] mb-3">
              <tbody>
                {/* Row 1: DATE & REQUIRED DATE () */}
                <tr className="border-b border-neutral-300 print:border-neutral-400">
                  <td className="w-[11%] py-1 px-1.5 font-normal uppercase text-[11px] text-black">
                    DATE:
                  </td>
                  <td className="w-[27%] py-1 px-1.5 font-bold text-[13px] text-black">
                    {isEditMode && !isRequisitionLocked ? (
                      <input
                        type="text"
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                        className="w-full bg-amber-50 border border-amber-400 px-1.5 py-0.5 font-bold text-xs"
                      />
                    ) : (
                      form.date
                    )}
                  </td>
                  <td className="w-[16%] py-1 px-1.5 font-bold uppercase text-[12px] text-black border-l border-black">
                    REQUIRED DATE ()
                  </td>
                  <td className="w-[46%] py-1 px-1.5 font-bold text-[13px] text-black">
                    {isEditMode && !isRequisitionLocked ? (
                      <input
                        type="text"
                        value={form.requiredDate}
                        onChange={(e) => setForm({ ...form, requiredDate: e.target.value })}
                        placeholder="e.g. 29-Sep-26"
                        className="w-48 bg-amber-50 border border-amber-400 px-1.5 py-0.5 font-bold text-xs"
                      />
                    ) : (
                      form.requiredDate
                    )}
                  </td>
                </tr>

                {/* Row 2: BUYER & REQUESTED BY */}
                <tr className="border-b border-neutral-300 print:border-neutral-400">
                  <td className="py-1 px-1.5 font-normal uppercase text-[11px] text-black">
                    BUYER:
                  </td>
                  <td className="py-1 px-1.5 font-black uppercase text-[13px] text-black">
                    {isEditMode && !isRequisitionLocked ? (
                      <input
                        type="text"
                        value={form.buyer}
                        onChange={(e) => setForm({ ...form, buyer: e.target.value })}
                        className="w-full bg-amber-50 border border-amber-400 px-1.5 py-0.5 font-bold uppercase text-xs"
                      />
                    ) : (
                      form.buyer
                    )}
                  </td>
                  <td className="py-1 px-1.5 font-bold uppercase text-[12px] text-black border-l border-black">
                    REQUESTED BY :
                  </td>
                  <td className="py-1 px-1.5 font-bold text-[13px] text-black">
                    {isEditMode && !isRequisitionLocked ? (
                      <input
                        type="text"
                        value={form.requestedBy}
                        onChange={(e) => setForm({ ...form, requestedBy: e.target.value })}
                        className="w-full bg-amber-50 border border-amber-400 px-1.5 py-0.5 font-bold text-xs"
                      />
                    ) : (
                      form.requestedBy || 'Zahid Anwar'
                    )}
                  </td>
                </tr>

                {/* Row 3: PRIORITY & TYPE OF SAMPLE */}
                <tr className="border-b border-neutral-300 print:border-neutral-400">
                  <td className="py-1 px-1.5 font-normal uppercase text-[11px] text-black">
                    PRIORITY:
                  </td>
                  <td className="py-1 px-1.5"></td>
                  <td className="py-1 px-1.5 font-bold uppercase text-[12px] text-black border-l border-black">
                    TYPE OF SAMPLE :
                  </td>
                  <td className="py-1 px-1.5 font-bold text-[13px] text-black">
                    {isEditMode && !isRequisitionLocked ? (
                      <input
                        type="text"
                        value={form.sampleType}
                        onChange={(e) => setForm({ ...form, sampleType: e.target.value })}
                        className={`w-full px-1.5 py-0.5 font-bold text-xs border rounded ${
                          getSampleTypeTone(form.sampleType).printBadgeClass
                        }`}
                      />
                    ) : (
                      <span>{form.sampleType}</span>
                    )}
                  </td>
                </tr>

                {/* Row 4: URGENT (1 DAY) vs NORMAL(2 DAYS/ MORE) Box Selection */}
                <tr>
                  <td colSpan={2} className="py-1 px-1.5">
                    <div className="flex items-center gap-6">
                      <button
                        type="button"
                        disabled={!isEditMode || isRequisitionLocked}
                        onClick={() =>
                          isEditMode &&
                          !isRequisitionLocked &&
                          setForm({ ...form, priorityType: 'urgent' })
                        }
                        className={`px-2 py-0.5 text-[11px] uppercase tracking-tight transition-all ${
                          form.priorityType === 'urgent'
                            ? 'border-2 border-black font-black bg-red-50 print:bg-transparent text-black'
                            : 'font-normal text-black border border-transparent'
                        } ${isEditMode && !isRequisitionLocked ? 'cursor-pointer hover:bg-amber-50' : 'cursor-default'}`}
                      >
                        URGENT (1 DAY)
                      </button>

                      <button
                        type="button"
                        disabled={!isEditMode || isRequisitionLocked}
                        onClick={() =>
                          isEditMode &&
                          !isRequisitionLocked &&
                          setForm({ ...form, priorityType: 'normal' })
                        }
                        className={`px-2.5 py-0.5 text-[11px] uppercase tracking-tight transition-all ${
                          form.priorityType !== 'urgent'
                            ? 'border-2 border-black font-bold text-black'
                            : 'font-normal text-black border border-transparent'
                        } ${isEditMode && !isRequisitionLocked ? 'cursor-pointer hover:bg-amber-50' : 'cursor-default'}`}
                      >
                        NORMAL(2 DAYS/ MORE)
                      </button>
                    </div>
                  </td>
                  <td colSpan={2} className="py-1 px-1.5 border-l border-black"></td>
                </tr>
              </tbody>
            </table>

            {/* =============================================================== */}
            {/* 3. MAIN REQUISITION SPREADSHEET GRID (Matches Attached Image)   */}
            {/*    Focused: DESCRIPTION, STYLE NAME, COLOR/WASH, SEWING & QTY   */}
            {/* =============================================================== */}
            <table className="w-full border-collapse border border-black text-[12px]">
              <thead>
                {/* ROW 1: DESCRIPTION: | JCS27DN009 | empty cells across */}
                <tr className="border-b border-black">
                  <th className="border border-black p-2 w-[11%] text-center font-normal uppercase text-[12px] text-black align-middle">
                    DESCRIPTION:
                  </th>
                  {/* FOCUSED DESCRIPTION / STYLE CODE CELL */}
                  <th className="border-2 border-black p-2 w-[26%] text-center align-middle bg-amber-50/40 print:bg-transparent">
                    {isEditMode && !isRequisitionLocked ? (
                      <input
                        type="text"
                        value={form.descriptionCode}
                        onChange={(e) =>
                          setForm({ ...form, descriptionCode: e.target.value })
                        }
                        placeholder="Style / Description Code"
                        className="w-full bg-amber-50 border border-amber-400 px-2 py-1 text-center font-black text-lg uppercase"
                      />
                    ) : (
                      <div className="font-black text-[20px] sm:text-[22px] tracking-wide text-black uppercase leading-tight">
                        {form.descriptionCode || sample.styleCode}
                      </div>
                    )}
                  </th>
                  <th className="border border-black p-2 w-[13%]"></th>
                  <th className="border border-black p-2 w-[14%]"></th>
                  <th className="border border-black p-2 w-[11%]"></th>
                  <th className="border border-black p-2 w-[10%]"></th>
                  <th className="border border-black p-2 w-[10%]"></th>
                  <th className="border border-black p-2 w-[5%] min-w-[64px]"></th>
                </tr>

                {/* ROW 2: STYLE: | COMFORT JEAN (Focused) | SAMPLE SIZE | COLOR /WASH | FABRIC CODE | FITTING | THRAEAD | QTY */}
                <tr className="border-b border-black">
                  <th className="border border-black p-2 text-center font-bold uppercase text-[13px] text-black align-middle">
                    STYLE:
                  </th>
                  {/* FOCUSED STYLE NAME CELL */}
                  <th className="border-2 border-black p-2 text-left align-top bg-yellow-50/40 print:bg-transparent">
                    {isEditMode && !isRequisitionLocked ? (
                      <input
                        type="text"
                        value={form.styleName}
                        onChange={(e) => setForm({ ...form, styleName: e.target.value })}
                        placeholder="Style Name (e.g. COMFORT JEAN)"
                        className="w-full bg-amber-50 border border-amber-400 px-2 py-1 font-black text-sm uppercase"
                      />
                    ) : (
                      <div className="font-black text-[15px] sm:text-[16px] uppercase tracking-tight text-black leading-snug">
                        {form.styleName || sample.styleName}
                      </div>
                    )}
                  </th>
                  <th className="border border-black p-2 text-center font-bold uppercase text-[12px] text-black align-middle">
                    SAMPLE SIZE
                  </th>
                  <th className="border border-black p-2 text-center font-black uppercase text-[12px] text-black align-middle bg-emerald-50/50 print:bg-transparent">
                    COLOR /WASH
                  </th>
                  <th className="border border-black p-2 text-center font-bold uppercase text-[12px] text-black align-middle">
                    FABRIC CODE
                  </th>
                  <th className="border border-black p-2 text-center font-bold uppercase text-[12px] text-black align-middle">
                    FITTING
                  </th>
                  <th className="border border-black p-2 text-center font-bold uppercase text-[12px] text-black align-middle">
                    THRAEAD
                  </th>
                  <th className="border border-black p-2 text-center font-black uppercase text-[12px] text-black align-middle bg-amber-50/50 print:bg-transparent">
                    QTY
                  </th>
                </tr>
              </thead>

              <tbody>
                {/* ROW 3: BLOCK | as spec | Sample Size Breakdown | FOCUSED Color/Wash | Fabric Code | Fitting | Thread | FOCUSED Qty (Pcs) */}
                <tr className="min-h-[115px]">
                  {/* Col 1: BLOCK */}
                  <td className="border border-black p-3 text-center font-bold uppercase text-[13px] text-black align-middle">
                    BLOCK
                  </td>

                  {/* Col 2: Block Value ("as spec") */}
                  <td className="border border-black p-3 text-center font-bold text-[14px] text-black align-middle">
                    {isEditMode && !isRequisitionLocked ? (
                      <input
                        type="text"
                        value={form.block}
                        onChange={(e) => setForm({ ...form, block: e.target.value })}
                        placeholder="as spec"
                        className="w-full bg-amber-50 border border-amber-400 px-2 py-1 text-center font-bold text-xs"
                      />
                    ) : (
                      <span>{form.block || 'as spec'}</span>
                    )}
                  </td>

                  {/* Col 3: SAMPLE SIZE (e.g. Red Seal Sample \n 3x Size 12) */}
                  <td className="border border-black p-2.5 text-center align-top">
                    {isEditMode && !isRequisitionLocked ? (
                      <div className="space-y-1.5 text-left">
                        <textarea
                          rows={3}
                          value={form.sampleSizeLabel}
                          onChange={(e) =>
                            setForm({ ...form, sampleSizeLabel: e.target.value })
                          }
                          className="w-full bg-amber-50 border border-amber-400 p-1 text-center font-bold text-xs"
                        />
                        {activeSizeBreakdown.length > 0 && (
                          <div className="space-y-1 pt-1 border-t border-amber-300">
                            {activeSizeBreakdown.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={item.size}
                                  onChange={(e) => {
                                    const next = activeSizeBreakdown.map((row, i) =>
                                      i === idx ? { ...row, size: e.target.value } : row
                                    );
                                    setForm({ ...form, sizeBreakdown: next });
                                  }}
                                  className="w-12 bg-white border border-slate-300 px-1 py-0.5 text-[10px] font-bold text-center"
                                />
                                <input
                                  type="number"
                                  min={1}
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                                    const next = activeSizeBreakdown.map((row, i) =>
                                      i === idx ? { ...row, quantity: val } : row
                                    );
                                    const nextTotal = next.reduce((s, r) => s + r.quantity, 0);
                                    setForm({
                                      ...form,
                                      sizeBreakdown: next,
                                      quantityText: `${nextTotal} Pcs`,
                                      fabricRequiredYards: Number(
                                        (activePerPcsCons * nextTotal).toFixed(2)
                                      ),
                                    });
                                  }}
                                  className="w-12 bg-white border border-slate-300 px-1 py-0.5 text-[10px] font-bold text-center"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-1 space-y-1">
                        <div className="font-bold text-[12px] text-black leading-tight">
                          {form.sampleType}
                        </div>
                        {activeSizeBreakdown.length > 1 ? (
                          <div className="space-y-0.5 pt-0.5">
                            {activeSizeBreakdown.map((item, idx) => (
                              <div
                                key={`${item.size}-${idx}`}
                                className="font-black text-[12px] text-black leading-tight"
                              >
                                {item.quantity}x Size {item.size}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="font-black text-[13px] text-black leading-tight">
                            {activeTotalQty}x Size {activeSizeNames}
                          </div>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Col 4: FOCUSED COLOR / WASH CELL (With Green Spreadsheet Selection Border like Image) */}
                  <td className="relative border-[2.5px] border-[#15803d] p-3 text-center align-middle bg-emerald-50/20 print:bg-transparent">
                    {/* Spreadsheet active cell bottom-right square handle matching screenshot */}
                    <span className="w-1.5 h-1.5 bg-[#15803d] absolute -bottom-[4px] -right-[4px] pointer-events-none" />
                    {isEditMode && !isRequisitionLocked ? (
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          value={form.colorWash}
                          onChange={(e) =>
                            setForm({ ...form, colorWash: e.target.value })
                          }
                          placeholder="e.g. Mid wash"
                          className="w-full bg-amber-50 border border-amber-400 px-1.5 py-1 text-center font-black text-xs"
                        />
                        {activeColorBreakdown.length > 1 && (
                          <div className="space-y-1 pt-1 border-t border-emerald-300 text-left">
                            {activeColorBreakdown.map((cItem, cIdx) => (
                              <div key={cIdx} className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={cItem.color}
                                  onChange={(e) => {
                                    const next = activeColorBreakdown.map((r, i) =>
                                      i === cIdx ? { ...r, color: e.target.value } : r
                                    );
                                    setForm({
                                      ...form,
                                      colorBreakdown: next,
                                      colorWash: next.map((c) => c.color).join(', '),
                                    });
                                  }}
                                  className="flex-1 bg-white border border-slate-300 px-1 py-0.5 text-[10px] font-bold"
                                />
                                <input
                                  type="number"
                                  min={1}
                                  value={cItem.quantity}
                                  onChange={(e) => {
                                    const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                                    const next = activeColorBreakdown.map((r, i) =>
                                      i === cIdx ? { ...r, quantity: val } : r
                                    );
                                    const nextTotal = next.reduce((s, r) => s + r.quantity, 0);
                                    setForm({
                                      ...form,
                                      colorBreakdown: next,
                                      quantityText: `${nextTotal} Pcs`,
                                      fabricRequiredYards: Number(
                                        (activePerPcsCons * nextTotal).toFixed(2)
                                      ),
                                    });
                                  }}
                                  className="w-11 bg-white border border-slate-300 px-1 py-0.5 text-[10px] font-bold text-center"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : activeColorBreakdown.length > 1 ? (
                      <div className="space-y-1">
                        {activeColorBreakdown.map((cItem, cIdx) => (
                          <div
                            key={`${cItem.color}-${cIdx}`}
                            className="font-black text-[13px] text-black leading-tight"
                          >
                            {cItem.color}
                            {cItem.wash &&
                            cItem.wash !== 'Standard Wash' &&
                            !cItem.color.toLowerCase().includes(cItem.wash.toLowerCase())
                              ? ` (${cItem.wash})`
                              : ''}{' '}
                            — {cItem.quantity} Pcs
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="font-black text-[14px] text-black leading-snug">
                        {form.colorWash || sample.color || 'Mid wash'}
                      </div>
                    )}
                  </td>

                  {/* Col 5: FABRIC CODE */}
                  <td className="border border-black p-2.5 text-center align-middle">
                    {isEditMode && !isRequisitionLocked ? (
                      <input
                        type="text"
                        value={form.fabricCode}
                        onChange={(e) => setForm({ ...form, fabricCode: e.target.value })}
                        className="w-full bg-amber-50 border border-amber-400 px-1.5 py-1 text-center font-bold text-xs"
                      />
                    ) : (
                      <div>
                        <div className="font-bold text-[13px] text-black">
                          {form.fabricCode || sample.fabricCode}
                        </div>
                        <div className="text-[10px] font-semibold text-neutral-600 mt-0.5">
                          ({activeTotalFabricYards} Yds)
                        </div>
                      </div>
                    )}
                  </td>

                  {/* Col 6: FITTING */}
                  <td className="border border-black p-2.5 text-center align-middle">
                    {isEditMode && !isRequisitionLocked ? (
                      <textarea
                        rows={3}
                        value={form.fitting}
                        onChange={(e) => setForm({ ...form, fitting: e.target.value })}
                        className="w-full bg-amber-50 border border-amber-400 p-1 text-center font-bold text-xs"
                      />
                    ) : (
                      <div className="font-bold text-[12px] text-black leading-snug">
                        {form.fitting || 'As Tech Pack & comments'}
                      </div>
                    )}
                  </td>

                  {/* Col 7: THRAEAD / SEWING THREAD */}
                  <td className="border border-black p-2.5 text-center align-middle">
                    {isEditMode && !isRequisitionLocked ? (
                      <textarea
                        rows={3}
                        value={form.threadInstruction}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            threadInstruction: e.target.value,
                            threadNote: e.target.value,
                          })
                        }
                        className="w-full bg-amber-50 border border-amber-400 p-1 text-center font-bold text-xs"
                      />
                    ) : (
                      <div className="font-bold text-[12px] text-black leading-snug">
                        {form.threadInstruction || form.threadNote || 'Same as Instructions'}
                      </div>
                    )}
                  </td>

                  {/* Col 8: FOCUSED QTY (Pcs) CELL */}
                  <td className="border-2 border-black p-2.5 text-center align-middle bg-amber-50/40 print:bg-transparent">
                    {isEditMode && !isRequisitionLocked ? (
                      <input
                        type="text"
                        value={form.quantityText}
                        onChange={(e) =>
                          setForm({ ...form, quantityText: e.target.value })
                        }
                        className="w-full bg-amber-50 border border-amber-400 px-1 py-1 text-center font-black text-xs"
                      />
                    ) : (
                      <div className="font-black text-[15px] text-black whitespace-nowrap">
                        {activeTotalQty} Pcs
                      </div>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* =============================================================== */}
            {/* 4. FABRIC COMPOSITION / SUPP / WEIGHT + FOCUSED SEWING BLOCK    */}
            {/* =============================================================== */}
            <div className="grid grid-cols-12 gap-0 border-x border-b border-black">
              {/* Left Blank Spacer matching the Excel indentation under BLOCK/STYLE */}
              <div className="hidden sm:block sm:col-span-3 border-r border-black p-2.5 bg-neutral-50/30 print:bg-transparent">
                <div className="text-[10px] font-bold uppercase text-neutral-600">
                  Requisition Summary
                </div>
                <div className="mt-1 text-[11px] font-bold text-black">
                  Style: {form.styleName || sample.styleName}
                </div>
                <div className="text-[11px] font-bold text-black">
                  Code: {form.descriptionCode || sample.styleCode}
                </div>
                <div className="text-[11px] font-black text-black">
                  Total Qty: {activeTotalQty} Pcs ({activeTotalFabricYards} Yds)
                </div>
              </div>

              {/* Middle Block: FABRIC COMPOSITION, SUPP, WEIGHT (Exact Match to Image) */}
              <div className="col-span-12 sm:col-span-4 border-b sm:border-b-0 sm:border-r border-black">
                <table className="w-full border-collapse text-[11px]">
                  <tbody>
                    <tr className="border-b border-neutral-300 print:border-neutral-400">
                      <td className="py-1.5 px-2 font-bold uppercase text-black w-[48%] border-r border-neutral-300">
                        FABRIC COMPOSITION :
                      </td>
                      <td className="py-1.5 px-2 font-bold text-black">
                        {isEditMode && !isRequisitionLocked ? (
                          <input
                            type="text"
                            value={form.fabricComposition}
                            onChange={(e) =>
                              setForm({ ...form, fabricComposition: e.target.value })
                            }
                            placeholder="e.g. 98% Cotton 2% Elastane"
                            className="w-full bg-amber-50 border border-amber-400 px-1 py-0.5 text-xs"
                          />
                        ) : (
                          form.fabricComposition || sample.fabricName || 'As per Tech Pack'
                        )}
                      </td>
                    </tr>
                    <tr className="border-b border-neutral-300 print:border-neutral-400">
                      <td className="py-1.5 px-2 font-bold uppercase text-black border-r border-neutral-300">
                        SUPP:
                      </td>
                      <td className="py-1.5 px-2 font-bold text-black">
                        {isEditMode && !isRequisitionLocked ? (
                          <input
                            type="text"
                            value={form.supplier}
                            onChange={(e) =>
                              setForm({ ...form, supplier: e.target.value })
                            }
                            placeholder="Supplier Name"
                            className="w-full bg-amber-50 border border-amber-400 px-1 py-0.5 text-xs"
                          />
                        ) : (
                          form.supplier || 'Nominated Mill'
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-2 font-bold uppercase text-black border-r border-neutral-300">
                        WEIGHT
                      </td>
                      <td className="py-1.5 px-2 font-bold text-black">
                        {isEditMode && !isRequisitionLocked ? (
                          <input
                            type="text"
                            value={form.weight}
                            onChange={(e) =>
                              setForm({ ...form, weight: e.target.value })
                            }
                            placeholder="e.g. 11.5 OZ"
                            className="w-full bg-amber-50 border border-amber-400 px-1 py-0.5 text-xs"
                          />
                        ) : (
                          form.weight || 'Standard Weight'
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Right Block: FOCUSED SEWING INSTRUCTIONS (Threads, Zipper, Button & Basic Sewing) */}
              <div className="col-span-12 sm:col-span-5 bg-amber-50/25 print:bg-transparent">
                <div className="border-b border-black px-2.5 py-1 bg-neutral-100 print:bg-transparent flex items-center justify-between">
                  <span className="font-black uppercase text-[11px] tracking-wider text-black">
                    FOCUSED SEWING & TRIMS INSTRUCTIONS
                  </span>
                  <span className="text-[10px] font-bold text-neutral-700">
                    Threads • Zipper • Button • Sewing
                  </span>
                </div>
                <table className="w-full border-collapse text-[11px]">
                  <tbody>
                    <tr className="border-b border-neutral-300 print:border-neutral-400">
                      <td className="py-1 px-2 font-black uppercase text-black w-[32%] border-r border-neutral-300">
                        THREADS:
                      </td>
                      <td className="py-1 px-2 font-bold text-black">
                        {isEditMode && !isRequisitionLocked ? (
                          <input
                            type="text"
                            value={form.threadNote || form.threadInstruction}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                threadNote: e.target.value,
                                threadInstruction: e.target.value,
                              })
                            }
                            placeholder="Thread specification / contrast note"
                            className="w-full bg-amber-50 border border-amber-400 px-1 py-0.5 text-xs font-bold"
                          />
                        ) : (
                          form.threadNote || form.threadInstruction || 'Same as Instructions'
                        )}
                      </td>
                    </tr>
                    <tr className="border-b border-neutral-300 print:border-neutral-400">
                      <td className="py-1 px-2 font-black uppercase text-black border-r border-neutral-300">
                        ZIPPER:
                      </td>
                      <td className="py-1 px-2 font-bold text-black">
                        {isEditMode && !isRequisitionLocked ? (
                          <input
                            type="text"
                            value={form.zipperNote || ''}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                zipperNote: e.target.value,
                                trims: { ...form.trims, zipperNote: e.target.value },
                              })
                            }
                            placeholder="e.g. YKK #4.5 Auto-Lock Brass / DTM Tape"
                            className="w-full bg-amber-50 border border-amber-400 px-1 py-0.5 text-xs font-bold"
                          />
                        ) : (
                          form.zipperNote || form.trims?.zipperNote || 'YKK Auto-Lock as per Tech Pack'
                        )}
                      </td>
                    </tr>
                    <tr className="border-b border-neutral-300 print:border-neutral-400">
                      <td className="py-1 px-2 font-black uppercase text-black border-r border-neutral-300">
                        BUTTON / RIVET:
                      </td>
                      <td className="py-1 px-2 font-bold text-black">
                        {isEditMode && !isRequisitionLocked ? (
                          <input
                            type="text"
                            value={form.buttonNote || ''}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                buttonNote: e.target.value,
                                trims: { ...form.trims, buttonNote: e.target.value },
                              })
                            }
                            placeholder="e.g. 17mm Metal Shank Button + Rivets"
                            className="w-full bg-amber-50 border border-amber-400 px-1 py-0.5 text-xs font-bold"
                          />
                        ) : (
                          form.buttonNote || form.trims?.buttonNote || 'Metal Shank Button & Rivets as per Spec'
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-2 font-black uppercase text-black border-r border-neutral-300">
                        SEWING INSTR.:
                      </td>
                      <td className="py-1.5 px-2 font-black text-black">
                        {isEditMode && !isRequisitionLocked ? (
                          <textarea
                            rows={2}
                            value={form.specialInstructions}
                            onChange={(e) =>
                              setForm({ ...form, specialInstructions: e.target.value })
                            }
                            placeholder="Enter focused sewing instructions for sample room..."
                            className="w-full bg-amber-50 border border-amber-400 p-1 text-xs font-bold"
                          />
                        ) : (
                          form.specialInstructions ||
                          form.samplingSectionNotes ||
                          'Follow Tech Pack SPI, seam allowance, pocket bag & label placement strictly.'
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* =============================================================== */}
            {/* 5. SIGNATURES & AUTHORIZATION FOOTER                            */}
            {/* =============================================================== */}
            <div className="grid grid-cols-3 gap-6 mt-8 pt-4 text-[11px] text-black">
              <div className="text-center">
                <div className="font-bold min-h-[20px]">
                  {form.requestedBy || 'Zahid Anwar'}
                </div>
                <div className="border-t border-black pt-1 font-bold uppercase">
                  Requested By (Merchandiser)
                </div>
              </div>

              <div className="text-center">
                <div className="font-bold min-h-[20px]">{form.receivedBy || ''}</div>
                <div className="border-t border-black pt-1 font-bold uppercase">
                  Received By (Sampling / Sewing)
                </div>
              </div>

              <div className="text-center">
                <div className="font-bold min-h-[20px]">
                  {form.blNumber ? `BL.... ${form.blNumber}` : ''}
                </div>
                <div className="border-t border-black pt-1 font-bold uppercase">
                  Admin Approval & BL.... Verification
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM FOOTER BAR (Hidden when printing) */}
        <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 print:hidden shrink-0">
          <div className="text-xs text-slate-400">
            Style:{' '}
            <strong className="text-white">{form.styleName || sample.styleName}</strong> (
            <span className="font-mono text-indigo-300">
              {form.descriptionCode || sample.styleCode}
            </span>
            ) • Color/Wash: <strong className="text-emerald-300">{form.colorWash}</strong> • Qty:{' '}
            <strong className="text-amber-300">{activeTotalQty} Pcs</strong>
          </div>
          <div className="flex items-center gap-2.5">
            {onViewInPipeline && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewInPipeline(sample);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all cursor-pointer"
              >
                View Style Details
              </button>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print Requisition Sheet
            </button>
          </div>
        </div>
      </div>

      {/* 2ND CONFIRMATION MODAL BEFORE LOCKING REQUISITION */}
      {showSaveConfirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 print:hidden">
          <div className="bg-slate-900 border-2 border-amber-500/60 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Final Requisition Lock Confirmation
                </h3>
                <p className="text-xs text-amber-300/90">
                  Please verify before permanently locking this requisition
                </p>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 mb-4 space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">BL.... Number:</span>
                <span className="font-mono font-bold text-amber-300">
                  {form.blNumber || '(Blank for Admin handwriting)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Description / Code:</span>
                <span className="font-mono font-bold text-white">{form.descriptionCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Style Name:</span>
                <span className="font-bold text-white">{form.styleName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Color / Wash:</span>
                <span className="font-bold text-emerald-300">{form.colorWash}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Qty:</span>
                <span className="font-bold text-amber-300">{activeTotalQty} Pcs</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowSaveConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Back to Review
              </button>
              <button
                type="button"
                onClick={handleConfirmFinalSave}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                Yes, Confirm & Lock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
