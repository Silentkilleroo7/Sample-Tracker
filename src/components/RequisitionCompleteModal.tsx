import React, { useState, useEffect } from 'react';
import {
  SampleItem,
  VolarRequisitionForm,
  TrimsChecklist,
  getEffectiveShipmentDate,
} from '../types/sample';
import { StyleProductImage } from './StyleProductImage';
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
  button: false,
  buckles: false,
  velcro: false,
  rivet: false,
  stud: false,
  thread: true,
  threadNote: 'AS PER CHART',
  interlining: true,
  elastic: false,
  zipper: true,
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
    const effectiveShipDate = getEffectiveShipmentDate(sample);
    if (sample.requisitionForm && sample.requisitionForm.companyName) {
      setForm({
        ...sample.requisitionForm,
        shipmentDate: sample.requisitionForm.shipmentDate || effectiveShipDate,
        isLocked: Boolean(sample.isRequisitionLocked || sample.requisitionForm.isLocked),
      });
    } else {
      const initialForm: VolarRequisitionForm = {
        companyName: 'VOLAR FASHION PVT LTD',
        date: formatVolarDate(sample.createdAt),
        requiredDate: formatVolarDate(sample.targetParcelDate),
        shipmentDate: effectiveShipDate,
        buyer: sample.buyer || '',
        requestedBy: '',
        priorityType: sample.priority === 'urgent' ? 'urgent' : 'normal',
        sampleType: sample.sampleType || '',
        descriptionCode: sample.styleCode || '',
        styleName: sample.styleName || '',
        sampleSizeLabel: `${sample.sampleType}\nSize: ${sample.size} (${sample.quantity} Pcs)`,
        colorWash: sample.color || '',
        fabricCode: sample.fabricCode || '',
        fitting: '',
        threadInstruction: '',
        quantityText: `${sample.quantity} Pcs`,
        block: '',
        fabricComposition: sample.fabricName || '',
        supplier: '',
        weight: '',
        trims: { ...DEFAULT_TRIMS },
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

  const handlePrint = () => {
    window.print();
  };

  const handleToggleTrim = (key: keyof Omit<TrimsChecklist, 'threadNote' | 'pocketingNote' | 'customTrims'>) => {
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
    const initialForm: VolarRequisitionForm = {
      companyName: 'VOLAR FASHION PVT LTD',
      date: formatVolarDate(sample.createdAt),
      requiredDate: formatVolarDate(sample.targetParcelDate),
      shipmentDate: getEffectiveShipmentDate(sample),
      buyer: sample.buyer || '',
      requestedBy: '',
      priorityType: sample.priority === 'urgent' ? 'urgent' : 'normal',
      sampleType: sample.sampleType || '',
      descriptionCode: sample.styleCode || '',
      styleName: sample.styleName || '',
      sampleSizeLabel: `${sample.sampleType}\nSize: ${sample.size} (${sample.quantity} Pcs)`,
      colorWash: sample.color || '',
      fabricCode: sample.fabricCode || '',
      fitting: '',
      threadInstruction: '',
      quantityText: `${sample.quantity} Pcs`,
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
    const text = `
VOLAR FASHION PVT LTD - Sample Requisition Form
Date: ${form.date} | Required Date: ${form.requiredDate}
Buyer: ${form.buyer} | Requested By: ${form.requestedBy}
Priority: ${form.priorityType.toUpperCase()} | Type of Sample: ${form.sampleType}
Description: ${form.descriptionCode} | Style: ${form.styleName}
Sample Size: ${form.sampleSizeLabel} | Color/Wash: ${form.colorWash}
Fabric Code: ${form.fabricCode} | Fitting: ${form.fitting}
Thread: ${form.threadInstruction} | Qty: ${form.quantityText}
Fabric Comp: ${form.fabricComposition} | Supp: ${form.supplier} | Weight: ${form.weight}
Special Instructions: ${form.specialInstructions}
    `.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl relative max-h-[96vh] overflow-y-auto text-xs text-slate-300 print:max-h-none print:overflow-visible print:border-none print:shadow-none print:bg-white print:text-black print:p-0 print:w-full">
        {/* Modal Top Control Bar (Hidden when Printing) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <StyleProductImage sample={sample} size="sm" />
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 hidden sm:flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Sample Requisition Form
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
                  Volar Fashion Format
                </span>
                {savedSuccess && (
                  <span className="text-[10px] text-emerald-400 font-bold animate-pulse flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Saved!
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-xs">
                Official factory requisition sheet with dynamic live editing, trims checklist, and print copy.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {isRequisitionLocked ? (
              <span className="px-3 py-1.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span>Saved &amp; Locked (Cannot Be Edited)</span>
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
                  <span>{isEditMode ? 'Preview Form' : 'Edit Requisition'}</span>
                </button>

                {onSaveForm && (
                  <button
                    type="button"
                    onClick={handleRequestSave}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow transition-colors cursor-pointer text-xs flex items-center gap-1.5"
                    title="Save & Permanently Lock Requisition (Requires 2nd Confirmation)"
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
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors cursor-pointer"
              title="Copy Summary Text"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all cursor-pointer text-xs hover:scale-105 active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print Copy</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Locked Banner or Dynamic Edit Bar Helper Notice */}
        {isRequisitionLocked ? (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between print:hidden">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                <strong>Requisition Permanently Saved &amp; Locked:</strong> This requisition was confirmed and saved. Once saved, it cannot be edited. You can print or copy the official requisition slip below.
              </span>
            </div>
            <span className="text-[11px] font-mono text-amber-300 font-bold shrink-0 ml-2">
              Shipment Date: {form.shipmentDate || getEffectiveShipmentDate(sample)}
            </span>
          </div>
        ) : (
          isEditMode && (
            <div className="mb-3 p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Edit Mode Active:</strong> You can edit fields before saving. Once you confirm and save, this requisition will be permanently locked!
                </span>
              </div>
              <button
                onClick={handleResetToSample}
                className="text-[11px] text-amber-400 underline hover:text-amber-200 flex items-center gap-1 ml-2 cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3 h-3" />
                Reset from Sample Data
              </button>
            </div>
          )
        )}

        {/* OFFICIAL VOLAR FASHION PVT LTD REQUISITION FORM */}
        <div
          id="requisition-printable-slip"
          className="bg-white text-black p-4 sm:p-7 rounded-lg border-2 border-black font-sans print:border-black print:p-2 print:shadow-none print:w-full print:text-black selection:bg-indigo-100"
          style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}
        >
          {/* Header Title: VOLAR FASHION PVT LTD */}
          <div className="text-center pb-2 mb-2">
            {isEditMode ? (
              <input
                type="text"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                className="text-center text-lg sm:text-2xl font-black underline uppercase tracking-wider text-black border-b border-indigo-400 bg-indigo-50/50 w-full focus:outline-none"
              />
            ) : (
              <h1 className="text-xl sm:text-2xl font-black underline uppercase tracking-wider text-black">
                {form.companyName}
              </h1>
            )}
            <div
              className="text-base sm:text-lg italic text-black font-serif mt-0.5"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Sample Requisition Form
            </div>
          </div>

          {/* Top Metadata Grid */}
          <div className="border border-black text-[11px] sm:text-xs">
            <div className="grid grid-cols-12 border-b border-black">
              <div className="col-span-2 p-1.5 font-bold uppercase bg-slate-100 border-r border-black flex items-center">
                DATE:
              </div>
              <div className="col-span-2 p-1.5 font-bold text-black border-r border-black flex items-center">
                {isEditMode && !isRequisitionLocked ? (
                  <input
                    type="text"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full bg-indigo-50/50 px-1 py-0.5 border border-indigo-300 font-bold"
                  />
                ) : (
                  <span className="font-bold text-black text-xs">{form.date}</span>
                )}
              </div>

              <div className="col-span-2 p-1.5 font-bold uppercase bg-slate-100 border-r border-black flex items-center">
                REQUIRED DATE:
              </div>
              <div className="col-span-2 p-1.5 font-bold text-black border-r border-black flex items-center">
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

              <div className="col-span-2 p-1.5 font-bold uppercase bg-amber-100 border-r border-black flex items-center">
                SHIPMENT DATE:
              </div>
              <div className="col-span-2 p-1.5 font-black text-black bg-amber-50/60 flex items-center">
                {isEditMode && !isRequisitionLocked ? (
                  <input
                    type="date"
                    value={form.shipmentDate || getEffectiveShipmentDate(sample)}
                    onChange={(e) => setForm({ ...form, shipmentDate: e.target.value })}
                    className="w-full bg-indigo-50/50 px-1 py-0.5 border border-indigo-300 font-bold"
                  />
                ) : (
                  <span className="font-black text-black font-mono">
                    {form.shipmentDate || getEffectiveShipmentDate(sample)}
                  </span>
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
                  <span className="font-black text-sm uppercase">{form.buyer}</span>
                )}
              </div>

              <div className="col-span-3 p-1.5 font-bold uppercase bg-slate-100 border-r border-black flex items-center">
                REQUESTED BY :
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
                  <span className="font-bold">{form.requestedBy}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-12">
              <div className="col-span-2 p-1.5 font-bold uppercase bg-slate-100 border-r border-black flex items-center">
                PRIORITY:
              </div>
              <div className="col-span-4 p-1 border-r border-black flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={isRequisitionLocked}
                  onClick={() => !isRequisitionLocked && setForm({ ...form, priorityType: 'urgent' })}
                  className={`px-2 py-1 border border-black font-bold text-[10px] flex items-center gap-1 ${
                    isRequisitionLocked ? 'cursor-default' : 'cursor-pointer'
                  } ${
                    form.priorityType === 'urgent' ? 'bg-black text-white font-black' : 'bg-white text-black'
                  }`}
                >
                  <span>{form.priorityType === 'urgent' ? '[X]' : '[  ]'}</span>
                  <span>URGENT (1 DAY)</span>
                </button>
                <button
                  type="button"
                  disabled={isRequisitionLocked}
                  onClick={() => !isRequisitionLocked && setForm({ ...form, priorityType: 'normal' })}
                  className={`px-2 py-1 border border-black font-bold text-[10px] flex items-center gap-1 ${
                    isRequisitionLocked ? 'cursor-default' : 'cursor-pointer'
                  } ${
                    form.priorityType === 'normal' ? 'bg-black text-white font-black' : 'bg-white text-black'
                  }`}
                >
                  <span>{form.priorityType === 'normal' ? '[X]' : '[  ]'}</span>
                  <span>NORMAL(2 DAYS/ MORE)</span>
                </button>
              </div>

              <div className="col-span-3 p-1.5 font-bold uppercase bg-slate-100 border-r border-black flex items-center">
                TYPE OF SAMPLE :
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
                  <span className="font-bold text-black">{form.sampleType}</span>
                )}
              </div>
            </div>
          </div>

          {/* Main Product Table Grid */}
          <div className="border-x border-b border-black mt-2 text-[11px] sm:text-xs">
            <div className="grid grid-cols-12 border-b border-black">
              <div className="col-span-2 p-2 font-bold uppercase bg-slate-100 border-r border-black flex items-center">
                DESCRIPTION:
              </div>
              <div className="col-span-10 p-2 font-black text-base sm:text-lg tracking-wider text-black flex items-center">
                {isEditMode ? (
                  <input
                    type="text"
                    value={form.descriptionCode}
                    onChange={(e) => setForm({ ...form, descriptionCode: e.target.value })}
                    className="w-full bg-indigo-50/50 px-2 py-1 border border-indigo-300 font-black text-lg"
                  />
                ) : (
                  <span>{form.descriptionCode}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-12 border-b border-black bg-slate-100 font-bold text-center">
              <div className="col-span-4 p-2 border-r border-black text-left flex items-center">
                <span className="font-bold mr-2 uppercase">STYLE:</span>
                {isEditMode ? (
                  <input
                    type="text"
                    value={form.styleName}
                    onChange={(e) => setForm({ ...form, styleName: e.target.value })}
                    className="flex-1 bg-indigo-50/50 px-1.5 py-0.5 border border-indigo-300 font-black uppercase text-sm"
                  />
                ) : (
                  <span className="font-black text-sm uppercase text-black">{form.styleName}</span>
                )}
              </div>
              <div className="col-span-2 p-2 border-r border-black uppercase flex items-center justify-center">
                SAMPLE SIZE
              </div>
              <div className="col-span-2 p-2 border-r border-black uppercase flex items-center justify-center">
                COLOR /WASH
              </div>
              <div className="col-span-1 p-2 border-r border-black uppercase flex items-center justify-center">
                FABRIC CODE
              </div>
              <div className="col-span-1 p-2 border-r border-black uppercase flex items-center justify-center">
                FITTING
              </div>
              <div className="col-span-1 p-2 border-r border-black uppercase flex items-center justify-center">
                THREAD
              </div>
              <div className="col-span-1 p-2 uppercase flex items-center justify-center">
                QTY
              </div>
            </div>

            <div className="grid grid-cols-12 border-b border-black text-center min-h-[70px]">
              <div className="col-span-4 p-3 border-r border-black text-left flex items-start">
                <span className="font-bold mr-3 uppercase shrink-0">BLOCK</span>
                <div className="flex-1">
                  {isEditMode ? (
                    <input
                      type="text"
                      value={form.block}
                      onChange={(e) => setForm({ ...form, block: e.target.value })}
                      className="w-full bg-indigo-50/50 px-1.5 py-0.5 border border-indigo-300 font-semibold"
                    />
                  ) : (
                    <span className="text-black font-semibold">{form.block}</span>
                  )}
                </div>
              </div>

              <div className="col-span-2 p-2 border-r border-black flex flex-col justify-center items-center">
                {isEditMode ? (
                  <textarea
                    rows={2}
                    value={form.sampleSizeLabel}
                    onChange={(e) => setForm({ ...form, sampleSizeLabel: e.target.value })}
                    className="w-full text-center bg-indigo-50/50 p-1 border border-indigo-300 font-bold"
                  />
                ) : (
                  <span className="font-bold text-black leading-tight whitespace-pre-line">
                    {form.sampleSizeLabel}
                  </span>
                )}
              </div>

              <div className="col-span-2 p-2 border-r border-black font-bold uppercase flex items-center justify-center">
                {isEditMode ? (
                  <input
                    type="text"
                    value={form.colorWash}
                    onChange={(e) => setForm({ ...form, colorWash: e.target.value })}
                    className="w-full text-center bg-indigo-50/50 p-1 border border-indigo-300 font-bold uppercase"
                  />
                ) : (
                  <span>{form.colorWash}</span>
                )}
              </div>

              <div className="col-span-1 p-2 border-r border-black font-mono font-bold text-[10px] break-all flex items-center justify-center">
                {isEditMode ? (
                  <input
                    type="text"
                    value={form.fabricCode}
                    onChange={(e) => setForm({ ...form, fabricCode: e.target.value })}
                    className="w-full text-center bg-indigo-50/50 p-0.5 border border-indigo-300 font-mono text-[10px]"
                  />
                ) : (
                  <span>{form.fabricCode}</span>
                )}
              </div>

              <div className="col-span-1 p-2 border-r border-black text-[10px] flex items-center justify-center leading-tight">
                {isEditMode ? (
                  <textarea
                    rows={2}
                    value={form.fitting}
                    onChange={(e) => setForm({ ...form, fitting: e.target.value })}
                    className="w-full bg-indigo-50/50 p-0.5 border border-indigo-300 text-[10px]"
                  />
                ) : (
                  <span>{form.fitting}</span>
                )}
              </div>

              <div className="col-span-1 p-2 border-r border-black text-[10px] flex items-center justify-center leading-tight">
                {isEditMode ? (
                  <textarea
                    rows={2}
                    value={form.threadInstruction}
                    onChange={(e) => setForm({ ...form, threadInstruction: e.target.value })}
                    className="w-full bg-indigo-50/50 p-0.5 border border-indigo-300 text-[10px]"
                  />
                ) : (
                  <span>{form.threadInstruction}</span>
                )}
              </div>

              <div className="col-span-1 p-2 font-bold flex items-center justify-center">
                {isEditMode ? (
                  <input
                    type="text"
                    value={form.quantityText}
                    onChange={(e) => setForm({ ...form, quantityText: e.target.value })}
                    className="w-full text-center bg-indigo-50/50 p-0.5 border border-indigo-300 font-bold"
                  />
                ) : (
                  <span className="font-black text-sm">{form.quantityText}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-12 border-b border-black text-[11px]">
              <div className="col-span-5 p-1.5 border-r border-black flex items-center">
                <span className="font-bold mr-2 uppercase">FABRIC COMPOSITION :</span>
                {isEditMode ? (
                  <input
                    type="text"
                    value={form.fabricComposition}
                    onChange={(e) => setForm({ ...form, fabricComposition: e.target.value })}
                    className="flex-1 bg-indigo-50/50 px-1 py-0.5 border border-indigo-300 font-semibold"
                  />
                ) : (
                  <span className="font-semibold text-black">{form.fabricComposition}</span>
                )}
              </div>
              <div className="col-span-4 p-1.5 border-r border-black flex items-center">
                <span className="font-bold mr-2 uppercase">SUPP:</span>
                {isEditMode ? (
                  <input
                    type="text"
                    value={form.supplier}
                    onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                    className="flex-1 bg-indigo-50/50 px-1 py-0.5 border border-indigo-300"
                  />
                ) : (
                  <span>{form.supplier}</span>
                )}
              </div>
              <div className="col-span-3 p-1.5 flex items-center">
                <span className="font-bold mr-2 uppercase">WEIGHT:</span>
                {isEditMode ? (
                  <input
                    type="text"
                    value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: e.target.value })}
                    className="flex-1 bg-indigo-50/50 px-1 py-0.5 border border-indigo-300 font-mono"
                  />
                ) : (
                  <span className="font-mono">{form.weight}</span>
                )}
              </div>
            </div>
          </div>

          {/* TRIMS REQUIRED */}
          <div className="border-x border-b border-black mt-2 text-[10px] sm:text-[11px]">
            <div className="p-1.5 bg-slate-100 font-black uppercase border-b border-black tracking-wide">
              TRIMS REQUIRD (PLEASE TICK ONE GIVEN AT THE TIME OF REQUISITION
            </div>

            <div className="grid grid-cols-2 divide-x divide-black">
              <div className="divide-y divide-black">
                <div
                  onClick={() => handleToggleTrim('mainLabel')}
                  className="flex items-center p-1.5 hover:bg-slate-50 cursor-pointer select-none"
                >
                  <span className="w-5 text-center font-bold font-mono">
                    {form.trims.mainLabel ? 'X' : ''}
                  </span>
                  <span className="w-4 h-4 border border-black inline-flex items-center justify-center mr-2 text-[9px] font-black">
                    {form.trims.mainLabel ? 'X' : ''}
                  </span>
                  <span className="font-bold">MAIN LABEL</span>
                </div>

                <div
                  onClick={() => handleToggleTrim('sizeLabel')}
                  className="flex items-center p-1.5 hover:bg-slate-50 cursor-pointer select-none"
                >
                  <span className="w-5 text-center font-bold font-mono">
                    {form.trims.sizeLabel ? 'X' : ''}
                  </span>
                  <span className="w-4 h-4 border border-black inline-flex items-center justify-center mr-2 text-[9px] font-black">
                    {form.trims.sizeLabel ? 'X' : ''}
                  </span>
                  <span className="font-bold">SIZE LABEL</span>
                </div>

                <div
                  onClick={() => handleToggleTrim('careOrigin')}
                  className="flex items-center p-1.5 hover:bg-slate-50 cursor-pointer select-none"
                >
                  <span className="w-5 text-center font-bold font-mono">
                    {form.trims.careOrigin ? 'X' : ''}
                  </span>
                  <span className="w-4 h-4 border border-black inline-flex items-center justify-center mr-2 text-[9px] font-black">
                    {form.trims.careOrigin ? 'X' : ''}
                  </span>
                  <span className="font-bold">C/O</span>
                </div>

                <div
                  onClick={() => handleToggleTrim('button')}
                  className="flex items-center p-1.5 hover:bg-slate-50 cursor-pointer select-none"
                >
                  <span className="w-5 text-center font-bold font-mono">
                    {form.trims.button ? 'X' : ''}
                  </span>
                  <span className="w-4 h-4 border border-black inline-flex items-center justify-center mr-2 text-[9px] font-black">
                    {form.trims.button ? 'X' : ''}
                  </span>
                  <span className="font-bold">BUTTON</span>
                </div>

                <div
                  onClick={() => handleToggleTrim('buckles')}
                  className="flex items-center p-1.5 hover:bg-slate-50 cursor-pointer select-none"
                >
                  <span className="w-5 text-center font-bold font-mono">
                    {form.trims.buckles ? 'X' : ''}
                  </span>
                  <span className="w-4 h-4 border border-black inline-flex items-center justify-center mr-2 text-[9px] font-black">
                    {form.trims.buckles ? 'X' : ''}
                  </span>
                  <span className="font-bold">BUCKLES</span>
                </div>

                <div
                  onClick={() => handleToggleTrim('velcro')}
                  className="flex items-center p-1.5 hover:bg-slate-50 cursor-pointer select-none"
                >
                  <span className="w-5 text-center font-bold font-mono">
                    {form.trims.velcro ? 'X' : ''}
                  </span>
                  <span className="w-4 h-4 border border-black inline-flex items-center justify-center mr-2 text-[9px] font-black">
                    {form.trims.velcro ? 'X' : ''}
                  </span>
                  <span className="font-bold">VELCRO</span>
                </div>

                <div
                  onClick={() => handleToggleTrim('rivet')}
                  className="flex items-center p-1.5 hover:bg-slate-50 cursor-pointer select-none"
                >
                  <span className="w-5 text-center font-bold font-mono">
                    {form.trims.rivet ? 'X' : ''}
                  </span>
                  <span className="w-4 h-4 border border-black inline-flex items-center justify-center mr-2 text-[9px] font-black">
                    {form.trims.rivet ? 'X' : ''}
                  </span>
                  <span className="font-bold">RIVET</span>
                </div>

                <div
                  onClick={() => handleToggleTrim('stud')}
                  className="flex items-center p-1.5 hover:bg-slate-50 cursor-pointer select-none"
                >
                  <span className="w-5 text-center font-bold font-mono">
                    {form.trims.stud ? 'X' : ''}
                  </span>
                  <span className="w-4 h-4 border border-black inline-flex items-center justify-center mr-2 text-[9px] font-black">
                    {form.trims.stud ? 'X' : ''}
                  </span>
                  <span className="font-bold">STUD</span>
                </div>
              </div>

              <div className="divide-y divide-black">
                <div
                  onClick={() => handleToggleTrim('thread')}
                  className="flex items-center p-1.5 hover:bg-slate-50 cursor-pointer select-none"
                >
                  <span className="w-5 text-center font-bold font-mono">
                    {form.trims.thread ? 'X' : ''}
                  </span>
                  <span className="w-4 h-4 border border-black inline-flex items-center justify-center mr-2 text-[9px] font-black">
                    {form.trims.thread ? 'X' : ''}
                  </span>
                  <span className="font-bold mr-2">THREAD:</span>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={form.trims.threadNote || ''}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          trims: { ...form.trims, threadNote: e.target.value },
                        })
                      }
                      className="flex-1 bg-indigo-50/50 px-1 py-0.5 border border-indigo-300 font-bold uppercase text-[10px]"
                    />
                  ) : (
                    <span className="font-bold uppercase text-black">
                      {form.trims.threadNote || 'AS PER CHART'}
                    </span>
                  )}
                </div>

                <div
                  onClick={() => handleToggleTrim('interlining')}
                  className="flex items-center p-1.5 hover:bg-slate-50 cursor-pointer select-none"
                >
                  <span className="w-5 text-center font-bold font-mono">
                    {form.trims.interlining ? 'X' : ''}
                  </span>
                  <span className="w-4 h-4 border border-black inline-flex items-center justify-center mr-2 text-[9px] font-black">
                    {form.trims.interlining ? 'X' : ''}
                  </span>
                  <span className="font-bold">INTERLINING</span>
                </div>

                <div
                  onClick={() => handleToggleTrim('elastic')}
                  className="flex items-center p-1.5 hover:bg-slate-50 cursor-pointer select-none"
                >
                  <span className="w-5 text-center font-bold font-mono">
                    {form.trims.elastic ? 'X' : ''}
                  </span>
                  <span className="w-4 h-4 border border-black inline-flex items-center justify-center mr-2 text-[9px] font-black">
                    {form.trims.elastic ? 'X' : ''}
                  </span>
                  <span className="font-bold">ELASTIC</span>
                </div>

                <div
                  onClick={() => handleToggleTrim('zipper')}
                  className="flex items-center p-1.5 hover:bg-slate-50 cursor-pointer select-none"
                >
                  <span className="w-5 text-center font-bold font-mono">
                    {form.trims.zipper ? 'X' : ''}
                  </span>
                  <span className="w-4 h-4 border border-black inline-flex items-center justify-center mr-2 text-[9px] font-black">
                    {form.trims.zipper ? 'X' : ''}
                  </span>
                  <span className="font-bold">ZIPPER</span>
                </div>

                <div
                  onClick={() => handleToggleTrim('drawstring')}
                  className="flex items-center p-1.5 hover:bg-slate-50 cursor-pointer select-none"
                >
                  <span className="w-5 text-center font-bold font-mono">
                    {form.trims.drawstring ? 'X' : ''}
                  </span>
                  <span className="w-4 h-4 border border-black inline-flex items-center justify-center mr-2 text-[9px] font-black">
                    {form.trims.drawstring ? 'X' : ''}
                  </span>
                  <span className="font-bold">DRAWSTRING</span>
                </div>

                <div
                  onClick={() => handleToggleTrim('stopperEyelet')}
                  className="flex items-center p-1.5 hover:bg-slate-50 cursor-pointer select-none"
                >
                  <span className="w-5 text-center font-bold font-mono">
                    {form.trims.stopperEyelet ? 'X' : ''}
                  </span>
                  <span className="w-4 h-4 border border-black inline-flex items-center justify-center mr-2 text-[9px] font-black">
                    {form.trims.stopperEyelet ? 'X' : ''}
                  </span>
                  <span className="font-bold">STOPER / EYELET</span>
                </div>

                <div
                  onClick={() => handleToggleTrim('snap')}
                  className="flex items-center p-1.5 hover:bg-slate-50 cursor-pointer select-none"
                >
                  <span className="w-5 text-center font-bold font-mono">
                    {form.trims.snap ? 'X' : ''}
                  </span>
                  <span className="w-4 h-4 border border-black inline-flex items-center justify-center mr-2 text-[9px] font-black">
                    {form.trims.snap ? 'X' : ''}
                  </span>
                  <span className="font-bold">SNAP</span>
                </div>

                <div
                  onClick={() => handleToggleTrim('pocketing')}
                  className="flex items-center p-1.5 hover:bg-slate-50 cursor-pointer select-none"
                >
                  <span className="w-5 text-center font-bold font-mono">
                    {form.trims.pocketing ? 'X' : ''}
                  </span>
                  <span className="w-4 h-4 border border-black inline-flex items-center justify-center mr-2 text-[9px] font-black">
                    {form.trims.pocketing ? 'X' : ''}
                  </span>
                  <span className="font-bold mr-2">POCKETING</span>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={form.trims.pocketingNote || ''}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          trims: { ...form.trims, pocketingNote: e.target.value },
                        })
                      }
                      className="flex-1 bg-indigo-50/50 px-1 py-0.5 border border-indigo-300 font-bold uppercase text-[10px]"
                    />
                  ) : (
                    <span className="font-bold uppercase text-black">
                      {form.trims.pocketingNote || 'TC POCKETING ( WHITE )'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Special Instructions / Notes Rows */}
          <div className="border-x border-b border-black mt-2 text-[10px] sm:text-[11px]">
            <div className="p-2 border-b border-black font-bold uppercase tracking-wide bg-slate-50">
              {isEditMode ? (
                <input
                  type="text"
                  value={form.specialInstructions}
                  onChange={(e) => setForm({ ...form, specialInstructions: e.target.value })}
                  className="w-full bg-indigo-50/50 px-2 py-1 border border-indigo-300 font-bold uppercase"
                />
              ) : (
                <span>{form.specialInstructions}</span>
              )}
            </div>

            <div className="p-2 min-h-[42px] flex items-start">
              <span className="font-bold uppercase mr-2 shrink-0">
                TO BE FILLED BY SAMPLING SECTION:
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
                <span className="text-black italic">
                  {form.samplingSectionNotes || 'Pattern check complete. Trims matched to spec.'}
                </span>
              )}
            </div>
          </div>

          {/* Bottom Signatures Block */}
          <div className="mt-8 pt-4 grid grid-cols-2 gap-8 text-[11px] font-bold">
            <div className="flex flex-col">
              <div className="border-b-2 border-black pb-1 mb-1 font-mono uppercase">
                RECEIVED BY: {form.receivedBy || ''}
              </div>
              <span className="text-[10px] text-slate-700 font-normal">
                Sampling Room Supervisor / In-Charge
              </span>
            </div>

            <div className="flex flex-col">
              <div className="border-b-2 border-black pb-1 mb-1 font-mono uppercase">
                MERCHANDISER SIGNATURE: {form.merchandiserSignature || ''}
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
            <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>
              Volar Requisition Form for Style{' '}
              <strong className="text-white font-mono">{sample.styleCode}</strong> •{' '}
              {isRequisitionLocked
                ? 'Permanently Saved & Locked (Editing Disabled)'
                : 'Click Save Requisition for 2nd confirmation & permanent lock'}
            </span>
          </div>

          <div className="flex items-center gap-2">
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
                    Once saved, this requisition for <strong>{sample.styleCode}</strong> (Shipment Date: <strong>{form.shipmentDate || getEffectiveShipmentDate(sample)}</strong>) will be permanently locked and <strong>cannot be edited</strong> again.
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
