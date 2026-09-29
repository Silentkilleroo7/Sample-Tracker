import React, { useState, useEffect } from 'react';
import {
  SampleItem,
  VolarRequisitionForm,
  TrimsChecklist,
  SizeBreakdownItem,
  ColorBreakdownItem,
  SingleRequisitionOptionItem,
  SINGLE_REQUISITION_OPTION_PRESETS,
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
  onViewInPipeline,
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [previewZoom, setPreviewZoom] = useState<number>(100);
  const [paperOrientation, setPaperOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [newColorNameInput, setNewColorNameInput] = useState<string>('');
  const [customOptionInput, setCustomOptionInput] = useState<string>('');

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

  // Populate or load form from sample (Never lock print sheet)
  useEffect(() => {
    if (!sample) return;
    setIsEditMode(false);
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
        requisitionOptions:
          sample.requisitionForm.requisitionOptions &&
          sample.requisitionForm.requisitionOptions.length > 0
            ? sample.requisitionForm.requisitionOptions
            : sample.requisitionOptions || [],
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
        isLocked: false,
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
        requisitionOptions: sample.requisitionOptions || [],
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
      };
      setForm(initialForm);
    }
  }, [sample]);

  if (!isOpen || !sample || !form) return null;

  // Print sheet is NEVER locked
  const isRequisitionLocked = false;

  const activeColorBreakdown: ColorBreakdownItem[] =
    form.colorBreakdown && form.colorBreakdown.length > 0
      ? form.colorBreakdown
      : getEffectiveColorBreakdown(sample);

  const activeSizeBreakdown: SizeBreakdownItem[] =
    form.sizeBreakdown && form.sizeBreakdown.length > 0
      ? form.sizeBreakdown
      : getEffectiveSizeBreakdown(sample);

  const activeRequisitionOptions: SingleRequisitionOptionItem[] =
    form.requisitionOptions && form.requisitionOptions.length > 0
      ? form.requisitionOptions
      : sample.requisitionOptions || [];

  const handleToggleSingleRequisitionOption = (
    label: string,
    defaultNote = 'As per instruction'
  ) => {
    const exists = activeRequisitionOptions.some(
      (o) => o.name.toLowerCase() === label.toLowerCase()
    );
    const nextOptions = exists
      ? activeRequisitionOptions.filter(
          (o) => o.name.toLowerCase() !== label.toLowerCase()
        )
      : [
          ...activeRequisitionOptions,
          {
            id: `opt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: label,
            quantity: 1,
            note: defaultNote,
          },
        ];
    const updatedForm: VolarRequisitionForm = {
      ...form,
      requisitionOptions: nextOptions,
    };
    setForm(updatedForm);
    if (onSaveForm && sample) {
      onSaveForm(sample.id, updatedForm);
    }
  };

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

  const triggerDedicatedPrint = () => {
    const sheetEl = document.getElementById('printable-requisition-sheet');
    if (!sheetEl) {
      window.focus();
      window.print();
      return;
    }

    try {
      const existingFrame = document.getElementById('volar-dedicated-print-iframe');
      if (existingFrame && existingFrame.parentNode) {
        existingFrame.parentNode.removeChild(existingFrame);
      }

      const iframe = document.createElement('iframe');
      iframe.id = 'volar-dedicated-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!doc || !iframe.contentWindow) {
        window.focus();
        window.print();
        return;
      }

      const headStyles = Array.from(
        document.querySelectorAll('style, link[rel="stylesheet"]')
      )
        .map((node) => node.outerHTML)
        .join('\n');

      const orientationRule =
        paperOrientation === 'portrait' ? 'A4 portrait' : 'A4 landscape';

      doc.open();
      doc.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Volar Sample Requisition - ${form.descriptionCode || sample.styleCode}</title>
    ${headStyles}
    <style>
      @page {
        size: ${orientationRule};
        margin: 6mm;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #000000 !important;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      #printable-requisition-sheet {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 2mm !important;
        border: none !important;
        box-shadow: none !important;
        background: #ffffff !important;
        color: #000000 !important;
      }
    </style>
  </head>
  <body>
    ${sheetEl.outerHTML}
  </body>
</html>`);
      doc.close();

      let printed = false;
      const runIframePrint = () => {
        if (printed) return;
        printed = true;
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch {
          window.focus();
          window.print();
        }
      };

      iframe.onload = () => {
        setTimeout(runIframePrint, 120);
      };
      setTimeout(runIframePrint, 350);
    } catch {
      window.focus();
      window.print();
    }
  };

  const handlePrint = () => {
    if (isEditMode) {
      setIsEditMode(false);
      setTimeout(() => {
        triggerDedicatedPrint();
      }, 80);
    } else {
      triggerDedicatedPrint();
    }
  };

  const handleAddColorRowInForm = () => {
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

  const handleSaveChanges = () => {
    if (onSaveForm && form && sample) {
      const updatedForm: VolarRequisitionForm = {
        ...form,
        isLocked: false,
      };
      setForm(updatedForm);
      onSaveForm(sample.id, updatedForm);
      setIsEditMode(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }
  };

  const handleResetDefault = () => {
    if (!sample) return;
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
    <div
      id="requisition-print-modal-backdrop"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto print:static print:inset-auto print:bg-white print:p-0 print:m-0 print:block print:overflow-visible"
    >
      <div
        id="requisition-print-modal-container"
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-6xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:rounded-none print:bg-white print:w-full print:max-w-none print:block"
      >
        {/* TOP ACTION BAR (Hidden when printing) */}
        <div className="px-4 sm:px-6 py-3.5 bg-gradient-to-r from-indigo-950/90 via-slate-900 to-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <Printer className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-white">
                Volar Sample Requisition Print Preview
              </h2>
              <SampleTypeBadge sampleType={form.sampleType} size="sm" />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Explicit Print Preview Mode Button */}
            <button
              type="button"
              onClick={() => setIsEditMode(false)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                !isEditMode
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-inner'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Print Preview
            </button>

            {/* Explicit Edit Requisition Button */}
            <button
              type="button"
              onClick={() => setIsEditMode(true)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isEditMode
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-inner'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Requisition Details
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
                onClick={handleSaveChanges}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-semibold transition-all cursor-pointer"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    Save Changes
                  </>
                )}
              </button>
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

        {/* SINGLE REQUISITION OPTIONS QUICK BAR (Thread Mokab, Leg Panel, Sleeve Panel) */}
        <div className="bg-slate-900/95 border-b border-slate-800 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs print:hidden shrink-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              Single Requisition Options:
            </span>
            {SINGLE_REQUISITION_OPTION_PRESETS.map((preset) => {
              const isSelected = activeRequisitionOptions.some(
                (o) => o.name.toLowerCase() === preset.label.toLowerCase()
              );
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() =>
                    handleToggleSingleRequisitionOption(preset.label, preset.defaultNote)
                  }
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-sm'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  {isSelected ? '✓ ' : '+ '}
                  {preset.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={customOptionInput}
              onChange={(e) => setCustomOptionInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customOptionInput.trim()) {
                  e.preventDefault();
                  handleToggleSingleRequisitionOption(customOptionInput.trim());
                  setCustomOptionInput('');
                }
              }}
              placeholder="Add option (e.g. Collar Panel)..."
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-[11px] text-white placeholder-slate-500 w-44 focus:outline-none focus:border-emerald-400"
            />
            <button
              type="button"
              onClick={() => {
                if (!customOptionInput.trim()) return;
                handleToggleSingleRequisitionOption(customOptionInput.trim());
                setCustomOptionInput('');
              }}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer"
            >
              + Add Option
            </button>
          </div>
        </div>

        {/* PRINT PREVIEW TOOLBAR (Shown when in Print Preview mode, hidden when printing) */}
        {!isEditMode && (
          <div className="bg-slate-950/90 border-b border-slate-800 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs print:hidden shrink-0">
            <div className="flex items-center gap-2 text-emerald-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                <strong>Live A4 Print Preview:</strong> Exact paper layout ready for printing.
              </span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setPaperOrientation('landscape')}
                  className={`px-2 py-1 rounded text-[11px] font-semibold cursor-pointer transition-colors ${
                    paperOrientation === 'landscape'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  A4 Landscape
                </button>
                <button
                  type="button"
                  onClick={() => setPaperOrientation('portrait')}
                  className={`px-2 py-1 rounded text-[11px] font-semibold cursor-pointer transition-colors ${
                    paperOrientation === 'portrait'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  A4 Portrait
                </button>
              </div>

              <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg p-0.5">
                {[90, 100, 110].map((zoom) => (
                  <button
                    key={zoom}
                    type="button"
                    onClick={() => setPreviewZoom(zoom)}
                    className={`px-2 py-1 rounded text-[11px] font-mono font-semibold cursor-pointer transition-colors ${
                      previewZoom === zoom
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {zoom}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

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
        <div
          id="requisition-print-scroll-wrapper"
          className="p-3 sm:p-6 overflow-y-auto bg-slate-950/70 flex-1 print:p-0 print:bg-white print:overflow-visible print:block"
        >
          {/* ===================================================================== */}
          {/* OFFICIAL VOLAR FASHION PVT LTD SPREADSHEET REQUISITION FORM           */}
          {/* Matches attached image + Top-Left BL.... Box + Focused Key Fields     */}
          {/* ===================================================================== */}
          <div
            id="requisition-print-paper-stage"
            style={
              !isEditMode && previewZoom !== 100
                ? {
                    transform: `scale(${previewZoom / 100})`,
                    transformOrigin: 'top center',
                  }
                : undefined
            }
            className="transition-transform duration-150"
          >
            <div
              id="printable-requisition-sheet"
              className={`bg-white text-black mx-auto ${
                paperOrientation === 'portrait' ? 'max-w-[820px]' : 'max-w-[1060px]'
              } p-6 sm:p-8 shadow-2xl border border-slate-300 print:shadow-none print:border-none print:p-3 print:max-w-none print:w-full font-sans text-[12px] leading-snug select-text`}
            >
              {/* =============================================================== */}
              {/* 1. HEADER: MATCHES ATTACHED IMAGE (UNDERLINED CENTER TITLES)    */}
              {/* =============================================================== */}
              <div className="relative mb-5">
                {/* Optional Top-Left BL.... Box for Admin */}
                <div className="sm:absolute sm:left-0 sm:top-0 mb-2 sm:mb-0 inline-block">
                  <div className="border border-black bg-white px-2.5 py-1 min-w-[125px] flex items-baseline gap-1">
                    <span className="font-bold text-[11px] uppercase text-black shrink-0">
                      BL....
                    </span>
                    <span className="inline-block w-full border-b border-dotted border-black h-3.5">
                      {form.blNumber || ''}
                    </span>
                  </div>
                </div>

                {/* Centered Underlined Company & Form Title (Exact match to attached image) */}
                <div className="text-center">
                  {isEditMode && !isRequisitionLocked ? (
                    <input
                      type="text"
                      value={form.companyName}
                      onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                      className="text-center font-serif font-bold text-xl sm:text-2xl tracking-wide border-b border-black bg-amber-50/50 px-2 py-0.5 w-full max-w-md mx-auto block"
                    />
                  ) : (
                    <h1 className="font-serif font-bold text-xl sm:text-[22px] tracking-wide uppercase text-black underline decoration-1 underline-offset-4">
                      {form.companyName || 'VOLAR FASHION PVT LTD'}
                    </h1>
                  )}
                  <div className="mt-1 font-bold text-[12px] uppercase tracking-wider text-black underline decoration-1 underline-offset-4">
                    SAMPLE REQUISITION FORM
                  </div>
                </div>
              </div>

              {/* =============================================================== */}
              {/* 2. TOP METADATA SECTION (EXACT MATCH TO ATTACHED IMAGE)         */}
              {/* =============================================================== */}
              <div className="grid grid-cols-12 gap-y-2 gap-x-4 text-[12px] mb-4">
                {/* Row 1 Left: Date */}
                <div className="col-span-6 flex items-baseline gap-2">
                  <span className="font-bold text-black w-[70px] shrink-0">Date:</span>
                  <div className="border-b border-black min-w-[160px] pb-0.5 font-bold text-black">
                    {isEditMode && !isRequisitionLocked ? (
                      <input
                        type="text"
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                        className="w-full bg-amber-50 border border-amber-400 px-1 py-0.5 font-bold text-xs"
                      />
                    ) : (
                      form.date
                    )}
                  </div>
                </div>

                {/* Row 1 Right: Required Date */}
                <div className="col-span-6 flex items-baseline justify-end gap-2">
                  <span className="font-bold text-black shrink-0">Required Date:</span>
                  <div className="border-b border-black min-w-[190px] pb-0.5 font-bold text-black text-left">
                    {isEditMode && !isRequisitionLocked ? (
                      <input
                        type="text"
                        value={form.requiredDate}
                        onChange={(e) => setForm({ ...form, requiredDate: e.target.value })}
                        placeholder="e.g. 29-Sep-26"
                        className="w-full bg-amber-50 border border-amber-400 px-1 py-0.5 font-bold text-xs"
                      />
                    ) : (
                      form.requiredDate || '\u00A0'
                    )}
                  </div>
                </div>

                {/* Row 2 Left: Buyer */}
                <div className="col-span-6 flex items-baseline gap-2">
                  <span className="font-bold text-black w-[70px] shrink-0">Buyer:</span>
                  <div className="border-b border-black min-w-[160px] pb-0.5 font-bold text-black">
                    {isEditMode && !isRequisitionLocked ? (
                      <input
                        type="text"
                        value={form.buyer}
                        onChange={(e) => setForm({ ...form, buyer: e.target.value })}
                        className="w-full bg-amber-50 border border-amber-400 px-1 py-0.5 font-bold text-xs"
                      />
                    ) : (
                      form.buyer || 'Select'
                    )}
                  </div>
                </div>

                {/* Row 2 Right: Requested By */}
                <div className="col-span-6 flex items-baseline justify-end gap-2">
                  <span className="font-bold text-black shrink-0">Requested By:</span>
                  <div className="border-b border-black min-w-[190px] pb-0.5 font-bold text-black text-center">
                    {isEditMode && !isRequisitionLocked ? (
                      <input
                        type="text"
                        value={form.requestedBy}
                        onChange={(e) => setForm({ ...form, requestedBy: e.target.value })}
                        className="w-full bg-amber-50 border border-amber-400 px-1 py-0.5 font-bold text-xs text-center"
                      />
                    ) : (
                      form.requestedBy || 'Zahid Anwar'
                    )}
                  </div>
                </div>

                {/* Row 3 Left: Type (Urgent / Normal Checkboxes like attached image) */}
                <div className="col-span-7 flex items-center gap-3 pt-1">
                  <span className="font-bold text-black w-[70px] shrink-0">Type:</span>
                  <div className="flex items-center gap-5 flex-wrap">
                    <button
                      type="button"
                      disabled={!isEditMode || isRequisitionLocked}
                      onClick={() =>
                        isEditMode &&
                        !isRequisitionLocked &&
                        setForm({ ...form, priorityType: 'urgent' })
                      }
                      className={`flex items-center gap-2 ${
                        isEditMode && !isRequisitionLocked ? 'cursor-pointer' : 'cursor-default'
                      }`}
                    >
                      <span className="w-7 h-4 border border-black inline-flex items-center justify-center text-[10px] font-black">
                        {form.priorityType === 'urgent' ? '✓' : ''}
                      </span>
                      <span className="font-bold text-[11px] uppercase text-black">
                        URGENT ( 1 DAY )
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={!isEditMode || isRequisitionLocked}
                      onClick={() =>
                        isEditMode &&
                        !isRequisitionLocked &&
                        setForm({ ...form, priorityType: 'normal' })
                      }
                      className={`flex items-center gap-2 ${
                        isEditMode && !isRequisitionLocked ? 'cursor-pointer' : 'cursor-default'
                      }`}
                    >
                      <span className="w-7 h-4 border border-black inline-flex items-center justify-center text-[10px] font-black">
                        {form.priorityType !== 'urgent' ? '✓' : ''}
                      </span>
                      <span className="font-bold text-[11px] uppercase text-black">
                        NORMAL ( 2 DAYS / MORE )
                      </span>
                    </button>
                  </div>
                </div>

                {/* Row 3 Right: Type of Sample */}
                <div className="col-span-5 flex items-baseline justify-end gap-2 pt-1">
                  <span className="font-bold text-black shrink-0">Type of Sample:</span>
                  <div className="border-b border-black min-w-[190px] pb-0.5 font-bold text-black text-center">
                    {isEditMode && !isRequisitionLocked ? (
                      <input
                        type="text"
                        value={form.sampleType}
                        onChange={(e) => setForm({ ...form, sampleType: e.target.value })}
                        className="w-full bg-amber-50 border border-amber-400 px-1 py-0.5 font-bold text-xs text-center"
                      />
                    ) : (
                      <span>{form.sampleType}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* =============================================================== */}
              {/* 3. MAIN 9-COLUMN SPECIFICATION TABLE (EXACT MATCH TO IMAGE)     */}
              {/* =============================================================== */}
              <table className="w-full border-collapse border border-black text-[12px]">
                <thead>
                  <tr className="border-b border-black">
                    <th className="border-r border-black py-2 px-2 w-[13%] text-center font-bold uppercase text-[11px] text-black">
                      DESCRIPTION
                    </th>
                    <th className="border-r border-black py-2 px-2 w-[13%] text-center font-bold uppercase text-[11px] text-black">
                      STYLE
                    </th>
                    <th className="border-r border-black py-2 px-2 w-[8%] text-center font-bold uppercase text-[11px] text-black">
                      BLOCK
                    </th>
                    <th className="border-r border-black py-2 px-2 w-[13%] text-center font-bold uppercase text-[11px] text-black">
                      SAMPLE SIZE
                    </th>
                    <th className="border-r border-black py-2 px-2 w-[12%] text-center font-bold uppercase text-[11px] text-black">
                      COLOR /WASH
                    </th>
                    <th className="border-r border-black py-2 px-2 w-[10%] text-center font-bold uppercase text-[11px] text-black">
                      FABRIC CODE
                    </th>
                    <th className="border-r border-black py-2 px-2 w-[12%] text-center font-bold uppercase text-[11px] text-black">
                      FITTING
                    </th>
                    <th className="border-r border-black py-2 px-2 w-[12%] text-center font-bold uppercase text-[11px] text-black">
                      THREAD
                    </th>
                    <th className="py-2 px-2 w-[7%] text-center font-bold uppercase text-[11px] text-black">
                      QTY
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {/* Main Requisition Row */}
                  <tr className="h-[130px]">
                    {/* Col 1: DESCRIPTION (Code) */}
                    <td className="border-r border-black p-2 text-center align-middle">
                      {isEditMode && !isRequisitionLocked ? (
                        <input
                          type="text"
                          value={form.descriptionCode}
                          onChange={(e) =>
                            setForm({ ...form, descriptionCode: e.target.value })
                          }
                          placeholder="Description / Code"
                          className="w-full bg-amber-50 border border-amber-400 px-1.5 py-1 text-center font-bold text-xs uppercase"
                        />
                      ) : (
                        <div className="font-bold text-[13px] text-black uppercase">
                          {form.descriptionCode || sample.styleCode}
                        </div>
                      )}
                    </td>

                    {/* Col 2: STYLE */}
                    <td className="border-r border-black p-2 text-center align-middle">
                      {isEditMode && !isRequisitionLocked ? (
                        <input
                          type="text"
                          value={form.styleName}
                          onChange={(e) => setForm({ ...form, styleName: e.target.value })}
                          placeholder="Style Name"
                          className="w-full bg-amber-50 border border-amber-400 px-1.5 py-1 text-center font-bold text-xs uppercase"
                        />
                      ) : (
                        <div className="font-bold text-[12px] uppercase text-black">
                          {form.styleName || sample.styleName}
                        </div>
                      )}
                    </td>

                    {/* Col 3: BLOCK */}
                    <td className="border-r border-black p-2 text-center font-bold text-[12px] text-black align-middle">
                      {isEditMode && !isRequisitionLocked ? (
                        <input
                          type="text"
                          value={form.block}
                          onChange={(e) => setForm({ ...form, block: e.target.value })}
                          placeholder="as spec"
                          className="w-full bg-amber-50 border border-amber-400 px-1 py-1 text-center font-bold text-xs"
                        />
                      ) : (
                        <span>{form.block || 'as spec'}</span>
                      )}
                    </td>

                    {/* Col 4: SAMPLE SIZE */}
                    <td className="border-r border-black p-2 text-center align-middle">
                      {isEditMode && !isRequisitionLocked ? (
                        <div className="space-y-1.5 text-left">
                          <textarea
                            rows={2}
                            value={form.sampleSizeLabel}
                            onChange={(e) =>
                              setForm({ ...form, sampleSizeLabel: e.target.value })
                            }
                            className="w-full bg-amber-50 border border-amber-400 p-1 text-center font-bold text-xs"
                          />
                        </div>
                      ) : (
                        <div className="space-y-0.5 font-bold text-[12px] text-black leading-snug">
                          <div>{form.sampleType}</div>
                          {activeSizeBreakdown.length > 1 ? (
                            <div className="space-y-0.5">
                              {activeSizeBreakdown.map((item, idx) => (
                                <div key={`${item.size}-${idx}`}>
                                  {item.quantity}x Size {item.size}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div>
                              {activeTotalQty}x Size {activeSizeNames}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Col 5: COLOR /WASH */}
                    <td className="border-r border-black p-2 text-center align-middle">
                      {isEditMode && !isRequisitionLocked ? (
                        <input
                          type="text"
                          value={form.colorWash}
                          onChange={(e) =>
                            setForm({ ...form, colorWash: e.target.value })
                          }
                          placeholder="e.g. Mid wash"
                          className="w-full bg-amber-50 border border-amber-400 px-1.5 py-1 text-center font-bold text-xs"
                        />
                      ) : activeColorBreakdown.length > 1 ? (
                        <div className="space-y-0.5 font-bold text-[12px] text-black">
                          {activeColorBreakdown.map((cItem, cIdx) => (
                            <div key={`${cItem.color}-${cIdx}`}>
                              {cItem.color} ({cItem.quantity} Pcs)
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="font-bold text-[12px] text-black">
                          {form.colorWash || sample.color || 'Mid wash'}
                        </div>
                      )}
                    </td>

                    {/* Col 6: FABRIC CODE */}
                    <td className="border-r border-black p-2 text-center align-middle">
                      {isEditMode && !isRequisitionLocked ? (
                        <input
                          type="text"
                          value={form.fabricCode}
                          onChange={(e) => setForm({ ...form, fabricCode: e.target.value })}
                          className="w-full bg-amber-50 border border-amber-400 px-1.5 py-1 text-center font-bold text-xs"
                        />
                      ) : (
                        <div className="font-bold text-[12px] text-black">
                          {form.fabricCode || sample.fabricCode}
                        </div>
                      )}
                    </td>

                    {/* Col 7: FITTING */}
                    <td className="border-r border-black p-2 text-center align-middle">
                      {isEditMode && !isRequisitionLocked ? (
                        <textarea
                          rows={2}
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

                    {/* Col 8: THREAD */}
                    <td className="border-r border-black p-2 text-center align-middle">
                      {isEditMode && !isRequisitionLocked ? (
                        <textarea
                          rows={2}
                          value={form.threadNote || form.threadInstruction}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              threadNote: e.target.value,
                              threadInstruction: e.target.value,
                            })
                          }
                          className="w-full bg-amber-50 border border-amber-400 p-1 text-center font-bold text-xs"
                        />
                      ) : (
                        <div className="font-bold text-[12px] text-black leading-snug">
                          {form.threadNote || form.threadInstruction || 'Same as Instructions'}
                        </div>
                      )}
                    </td>

                    {/* Col 9: QTY */}
                    <td className="p-2 text-center align-middle">
                      {isEditMode && !isRequisitionLocked ? (
                        <input
                          type="text"
                          value={form.quantityText}
                          onChange={(e) =>
                            setForm({ ...form, quantityText: e.target.value })
                          }
                          className="w-full bg-amber-50 border border-amber-400 px-1 py-1 text-center font-bold text-xs"
                        />
                      ) : (
                        <div className="font-bold text-[12px] text-black whitespace-nowrap">
                          {activeTotalQty} Pcs
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* =========================================================== */}
                  {/* OPTIONS UNDER SINGLE REQUISITION (Thread Mokab, Leg Panel,  */}
                  {/* Sleeve Panel, etc.) RENDERED AS CLEAN SUB-ROWS              */}
                  {/* =========================================================== */}
                  {activeRequisitionOptions.map((opt, idx) => (
                    <tr key={opt.id || idx} className="border-t border-black bg-neutral-50/60 print:bg-transparent">
                      <td className="border-r border-black py-1.5 px-2 text-center font-bold text-[11px] uppercase text-black">
                        Option #{idx + 1}
                      </td>
                      <td
                        colSpan={2}
                        className="border-r border-black py-1.5 px-2 text-center font-bold text-[12px] text-black"
                      >
                        {isEditMode && !isRequisitionLocked ? (
                          <input
                            type="text"
                            value={opt.name}
                            onChange={(e) => {
                              const next = activeRequisitionOptions.map((item, i) =>
                                i === idx ? { ...item, name: e.target.value } : item
                              );
                              setForm({ ...form, requisitionOptions: next });
                            }}
                            className="w-full bg-amber-50 border border-amber-400 px-1 py-0.5 text-center font-bold text-xs"
                          />
                        ) : (
                          opt.name
                        )}
                      </td>
                      <td className="border-r border-black py-1.5 px-2 text-center font-bold text-[11px] text-black">
                        Single Req. Option
                      </td>
                      <td className="border-r border-black py-1.5 px-2 text-center font-bold text-[11px] text-black">
                        {form.colorWash || sample.color || 'Mid wash'}
                      </td>
                      <td className="border-r border-black py-1.5 px-2 text-center font-bold text-[11px] text-black">
                        {form.fabricCode || sample.fabricCode}
                      </td>
                      <td
                        colSpan={2}
                        className="border-r border-black py-1.5 px-2 text-center font-semibold text-[11px] text-black"
                      >
                        {isEditMode && !isRequisitionLocked ? (
                          <input
                            type="text"
                            value={opt.note || ''}
                            onChange={(e) => {
                              const next = activeRequisitionOptions.map((item, i) =>
                                i === idx ? { ...item, note: e.target.value } : item
                              );
                              setForm({ ...form, requisitionOptions: next });
                            }}
                            placeholder="Option specification / note"
                            className="w-full bg-amber-50 border border-amber-400 px-1 py-0.5 text-center font-bold text-xs"
                          />
                        ) : (
                          opt.note || 'As per instruction'
                        )}
                      </td>
                      <td className="py-1.5 px-2 text-center font-bold text-[12px] text-black">
                        {isEditMode && !isRequisitionLocked ? (
                          <input
                            type="number"
                            min={1}
                            value={opt.quantity}
                            onChange={(e) => {
                              const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                              const next = activeRequisitionOptions.map((item, i) =>
                                i === idx ? { ...item, quantity: val } : item
                              );
                              setForm({ ...form, requisitionOptions: next });
                            }}
                            className="w-12 bg-amber-50 border border-amber-400 px-1 py-0.5 text-center font-bold text-xs"
                          />
                        ) : (
                          `${opt.quantity} Pcs`
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* =============================================================== */}
              {/* 4. BOTTOM RIGHT FABRIC COMPOSITION / SUPP / WEIGHT              */}
              {/*    (EXACT MATCH TO ATTACHED IMAGE)                              */}
              {/* =============================================================== */}
              <div className="grid grid-cols-12 mt-4 text-[11px]">
                {/* Left side: Optional Special / Trims Note */}
                <div className="col-span-6 pr-4">
                  {(form.specialInstructions || form.zipperNote || form.buttonNote || isEditMode) && (
                    <div className="space-y-1">
                      <div className="font-bold uppercase text-black">
                        Special / Trims Instructions:
                      </div>
                      {isEditMode && !isRequisitionLocked ? (
                        <textarea
                          rows={2}
                          value={form.specialInstructions}
                          onChange={(e) =>
                            setForm({ ...form, specialInstructions: e.target.value })
                          }
                          placeholder="Optional sewing / trims remarks..."
                          className="w-full bg-amber-50 border border-amber-400 p-1 text-xs font-bold"
                        />
                      ) : (
                        <div className="font-semibold text-black">
                          {[
                            form.specialInstructions,
                            form.zipperNote ? `Zipper: ${form.zipperNote}` : '',
                            form.buttonNote ? `Button: ${form.buttonNote}` : '',
                          ]
                            .filter(Boolean)
                            .join(' | ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right side: FABRIC COMPOSITION, SUPP, WEIGHT (Exact match to attached image) */}
                <div className="col-span-6 space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold uppercase text-black w-[150px] shrink-0">
                      FABRIC COMPOSITION:
                    </span>
                    <div className="border-b border-black flex-1 pb-0.5 font-bold text-black">
                      {isEditMode && !isRequisitionLocked ? (
                        <input
                          type="text"
                          value={form.fabricComposition}
                          onChange={(e) =>
                            setForm({ ...form, fabricComposition: e.target.value })
                          }
                          className="w-full bg-amber-50 border border-amber-400 px-1 py-0.5 text-xs font-bold"
                        />
                      ) : (
                        form.fabricComposition || sample.fabricName || '\u00A0'
                      )}
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="font-bold uppercase text-black w-[150px] shrink-0">
                      SUPP:
                    </span>
                    <div className="border-b border-black flex-1 pb-0.5 font-bold text-black">
                      {isEditMode && !isRequisitionLocked ? (
                        <input
                          type="text"
                          value={form.supplier}
                          onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                          className="w-full bg-amber-50 border border-amber-400 px-1 py-0.5 text-xs font-bold"
                        />
                      ) : (
                        form.supplier || '\u00A0'
                      )}
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="font-bold uppercase text-black w-[150px] shrink-0">
                      WEIGHT:
                    </span>
                    <div className="border-b border-black flex-1 pb-0.5 font-bold text-black">
                      {isEditMode && !isRequisitionLocked ? (
                        <input
                          type="text"
                          value={form.weight}
                          onChange={(e) => setForm({ ...form, weight: e.target.value })}
                          className="w-full bg-amber-50 border border-amber-400 px-1 py-0.5 text-xs font-bold"
                        />
                      ) : (
                        form.weight || '\u00A0'
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* =============================================================== */}
              {/* 5. SIGNATURES FOOTER                                            */}
              {/* =============================================================== */}
              <div className="grid grid-cols-3 gap-8 mt-10 pt-4 text-[11px] text-black">
                <div className="text-center">
                  <div className="font-bold min-h-[20px]">
                    {form.requestedBy || 'Zahid Anwar'}
                  </div>
                  <div className="border-t border-black pt-1 font-bold uppercase">
                    Merchandiser&apos;s Signature
                  </div>
                </div>

                <div className="text-center">
                  <div className="font-bold min-h-[20px]">{form.receivedBy || ''}</div>
                  <div className="border-t border-black pt-1 font-bold uppercase">
                    Received By (Sampling)
                  </div>
                </div>

                <div className="text-center">
                  <div className="font-bold min-h-[20px]"></div>
                  <div className="border-t border-black pt-1 font-bold uppercase">
                    Authorized Signature
                  </div>
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
    </div>
  );
};
