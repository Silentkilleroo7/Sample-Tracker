import React, { useState } from 'react';
import {
  SampleItem,
  STAGE_CONFIG,
  getSampleImage,
  PRESET_STYLE_IMAGES,
} from '../types/sample';
import { ProgressBar } from './ProgressBar';
import { useImageZoom } from './StyleProductImage';
import { uploadStylePhoto } from '../lib/supabase';
import {
  X,
  Layers,
  Printer,
  Truck,
  Clock,
  ArrowRight,
  MessageSquare,
  MessageCircle,
  Phone,
  FileCheck2,
  ZoomIn,
  Maximize2,
  Image as ImageIcon,
  Upload,
} from 'lucide-react';

interface SampleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sample: SampleItem | null;
  onAdvanceStage: (sample: SampleItem) => void;
  onOpenFollowUp?: (sample: SampleItem) => void;
  onToggleWorkbookSent?: (sampleId: string) => void;
  onSendWhatsApp?: (sample: SampleItem, phone: string, customMessage?: string) => void;
  onOpenRequisitionSlip?: (sample: SampleItem) => void;
  onUpdateSampleThumbnail?: (sampleId: string, newThumbnail: string, additionalImages?: string[]) => void;
}

export const SampleDetailModal: React.FC<SampleDetailModalProps> = ({
  isOpen,
  onClose,
  sample,
  onAdvanceStage,
  onOpenFollowUp,
  onToggleWorkbookSent,
  onSendWhatsApp,
  onOpenRequisitionSlip,
  onUpdateSampleThumbnail,
}) => {
  const { openZoom } = useImageZoom();
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState(0);
  const [inlineZoomed, setInlineZoomed] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen || !sample) return null;

  const currentStageConfig = STAGE_CONFIG[sample.stage];
  const primaryPhoto = getSampleImage(sample);
  const galleryPhotos = Array.from(
    new Set([
      primaryPhoto,
      ...(sample.images || []),
      PRESET_STYLE_IMAGES.find((p) => p.url !== primaryPhoto)?.url || PRESET_STYLE_IMAGES[0].url,
    ].filter(Boolean))
  );
  const activePhoto = galleryPhotos[selectedPhotoIdx % galleryPhotos.length] || primaryPhoto;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto text-xs text-slate-300">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-sm text-indigo-400 px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/30">
                {sample.styleCode}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentStageConfig.badgeBg}`}
              >
                {currentStageConfig.badgeText}
              </span>
              {sample.priority === 'urgent' && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  URGENT
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-white mt-1">
              {sample.styleName}
            </h2>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-slate-400">
              <span>Buyer: <strong className="text-slate-200">{sample.buyer}</strong></span>
              <span>• PO: <span className="font-mono text-slate-300">{sample.poNumber}</span></span>
              <span>• Line: <span className="font-mono text-slate-300">{sample.lineCode}</span></span>
              <span>• Type:{' '}
                {sample.sampleType === 'Red Seal Sample' ? (
                  <span className="inline-flex items-center gap-1 font-bold text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-500/40 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                    Red Seal Sample
                  </span>
                ) : (
                  <span className="text-slate-200">{sample.sampleType}</span>
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenRequisitionSlip && (
              <button
                type="button"
                onClick={() => onOpenRequisitionSlip(sample)}
                className="px-2.5 py-1.5 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-xl border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Print Official Requisition Slip & Summary Docket"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Print Slip</span>
              </button>
            )}
            <button
              onClick={handlePrint}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Print Sample Spec Sheet / Packing Slip"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Product Picture Showcase & Double-Click Zoom Inspector */}
        <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 mb-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="font-bold text-white flex items-center gap-1.5 text-xs">
              <ImageIcon className="w-4 h-4 text-indigo-400" />
              <span>Style Product Pictures & Spec Gallery</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono">
                Double-click picture to zoom
              </span>
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              {onUpdateSampleThumbnail && (
                <label className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors">
                  <Upload className={`w-3.5 h-3.5 ${isUploading ? 'animate-bounce' : ''}`} />
                  <span>{isUploading ? 'Uploading...' : 'Upload Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (!files || files.length === 0) return;
                      setIsUploading(true);
                      try {
                        const uploadedUrls: string[] = [];
                        for (let i = 0; i < files.length; i++) {
                          const res = await uploadStylePhoto(files[i], {
                            sampleId: sample.id,
                            styleCode: sample.styleCode,
                          });
                          if (res.url) uploadedUrls.push(res.url);
                        }
                        if (uploadedUrls.length > 0) {
                          const nextGallery = Array.from(new Set([...uploadedUrls, ...galleryPhotos]));
                          onUpdateSampleThumbnail(sample.id, uploadedUrls[0], nextGallery);
                          setSelectedPhotoIdx(0);
                        }
                      } finally {
                        setIsUploading(false);
                        e.target.value = '';
                      }
                    }}
                    className="hidden"
                  />
                </label>
              )}
              <button
                type="button"
                onClick={() => setInlineZoomed((z) => !z)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ZoomIn className="w-3.5 h-3.5 text-indigo-400" />
                <span>{inlineZoomed ? 'Reset Inline Zoom' : 'Inline 2× Zoom'}</span>
              </button>
              <button
                type="button"
                onClick={() => openZoom(sample, activePhoto, true)}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 shadow cursor-pointer transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Full-Screen Zoom Inspector</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
            {/* Main Interactive Product Picture */}
            <div
              onDoubleClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openZoom(sample, activePhoto, true);
              }}
              title="Double-click product picture to open High-Resolution Zoom Inspector"
              className="md:col-span-3 relative h-64 sm:h-72 rounded-xl overflow-hidden bg-slate-950 border border-slate-700 hover:border-indigo-400 flex items-center justify-center cursor-zoom-in group/detailimg select-none"
            >
              <img
                src={activePhoto}
                alt={sample.styleName}
                draggable={false}
                className={`max-h-full max-w-full object-contain transition-transform duration-300 ${
                  inlineZoomed ? 'scale-175' : 'group-hover/detailimg:scale-105'
                }`}
              />
              <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-xs border border-indigo-500/40 text-indigo-200 text-[11px] font-semibold flex items-center gap-1.5 pointer-events-none">
                <ZoomIn className="w-3.5 h-3.5 text-indigo-400" />
                <span>Double-click picture to zoom</span>
              </div>
            </div>

            {/* Multi-Angle Thumbnails */}
            <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible">
              {galleryPhotos.map((photoUrl, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedPhotoIdx(idx);
                    setInlineZoomed(false);
                  }}
                  onDoubleClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openZoom(sample, photoUrl, true);
                  }}
                  title="Click to switch view • Double-click to zoom"
                  className={`relative h-20 md:h-22 w-20 md:w-full rounded-xl overflow-hidden border-2 cursor-pointer transition-all shrink-0 ${
                    selectedPhotoIdx % galleryPhotos.length === idx
                      ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                      : 'border-slate-700 opacity-65 hover:opacity-100'
                  }`}
                >
                  <img
                    src={photoUrl}
                    alt={`${sample.styleName} view ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded bg-black/75 text-[9px] font-mono text-white font-bold">
                    View #{idx + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Visual Progress Bar Section */}
        <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 mb-5">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-semibold text-slate-300">
              Live Stage Progression
            </span>
            <span className="text-indigo-400 font-mono font-bold">
              Step {currentStageConfig.stepNumber} of 6: {currentStageConfig.label}
            </span>
          </div>
          <ProgressBar currentStage={sample.stage} size="detailed" />
        </div>

        {/* 2-Column Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {/* Tech Pack & Fabric Specifications */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2.5">
            <h3 className="font-bold text-white flex items-center gap-1.5 text-xs">
              <Layers className="w-4 h-4 text-indigo-400" />
              Material & Garment Specifications
            </h3>
            <div className="space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Linked Fabric Code:</span>
                <span className="font-mono font-bold text-indigo-300">{sample.fabricCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Fabric Description:</span>
                <span className="text-right font-medium max-w-[200px] truncate">{sample.fabricName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Required Yards:</span>
                <span className="font-mono text-emerald-400 font-bold">{sample.fabricRequiredYards} yds</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Garment Color / Wash:</span>
                <span>{sample.color}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Size Spec & Qty:</span>
                <span>Size {sample.size} • {sample.quantity} Piece{sample.quantity > 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target Parcel Date:</span>
                <span className="font-mono text-emerald-400">{sample.targetParcelDate}</span>
              </div>
            </div>
          </div>

          {/* Parcel Courier & Destination */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2.5">
            <h3 className="font-bold text-white flex items-center gap-1.5 text-xs">
              <Truck className="w-4 h-4 text-emerald-400" />
              Courier & Shipping Logistics
            </h3>
            <div className="space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Courier Carrier:</span>
                <span className="font-medium text-slate-200">{sample.parcelDetails.courier || 'DHL Express'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Airway Bill (AWB) #:</span>
                <span className="font-mono text-indigo-300 font-bold">
                  {sample.parcelDetails.trackingNumber || 'Pending dispatch'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dispatch Status:</span>
                <span className="uppercase font-bold text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">
                  {sample.parcelDetails.dispatchStatus}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Destination:</span>
                <span className="truncate max-w-[200px]">{sample.parcelDetails.destinationCountry}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Recipient / Lab:</span>
                <span className="truncate max-w-[200px]">{sample.parcelDetails.recipient}</span>
              </div>

              {/* Workbook Sent Confirmation Option */}
              <div className="pt-2 mt-2 border-t border-slate-700/60 flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1 font-semibold text-[11px]">
                  <FileCheck2 className="w-3.5 h-3.5 text-indigo-400" />
                  Workbook Sent Option:
                </span>
                <button
                  type="button"
                  onClick={() => onToggleWorkbookSent && onToggleWorkbookSent(sample.id)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    sample.parcelDetails.workbookSent
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                  }`}
                  title="Toggle Workbook Sent confirmation"
                >
                  {sample.parcelDetails.workbookSent ? '✅ Sent: YES' : '⚠️ Sent: NO (Click to confirm)'}
                </button>
              </div>

              {/* Follow-Up and WhatsApp */}
              <div className="pt-1.5 flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  Follow-Up WhatsApp:
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onOpenFollowUp && onOpenFollowUp(sample)}
                    className="text-[10px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 cursor-pointer font-semibold"
                  >
                    Configure
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onSendWhatsApp &&
                      onSendWhatsApp(
                        sample,
                        sample.parcelDetails.followUp?.whatsAppNumber || '+1 (215) 555-0199'
                      )
                    }
                    className="text-[10px] px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Approval Remarks Note Dossier */}
        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 mb-5">
          <h3 className="font-bold text-white flex items-center gap-1.5 text-xs mb-3">
            <MessageSquare className="w-4 h-4 text-pink-400" />
            Buyer Approval Remarks (Wash, Trims & Accessories)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-3">
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-cyan-300">Wash Remarks</span>
                <span className="text-[10px] font-bold">
                  {sample.approvalDetails.washApproved ? '✅ Approved' : '⏳ Review'}
                </span>
              </div>
              <p className="text-slate-300 italic text-[11px]">
                {sample.approvalDetails.washComments || 'No wash remarks entered'}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-amber-300">Trims Remarks</span>
                <span className="text-[10px] font-bold">
                  {sample.approvalDetails.trimsApproved ? '✅ Approved' : '⏳ Review'}
                </span>
              </div>
              <p className="text-slate-300 italic text-[11px]">
                {sample.approvalDetails.trimsComments || 'No trims remarks entered'}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-pink-300">Accessories Remarks</span>
                <span className="text-[10px] font-bold">
                  {sample.approvalDetails.accessoriesApproved ? '✅ Approved' : '⏳ Review'}
                </span>
              </div>
              <p className="text-slate-300 italic text-[11px]">
                {sample.approvalDetails.accessoriesComments || 'No accessories remarks entered'}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
            <span>
              Overall Verdict: <strong className="text-white uppercase">{sample.approvalDetails.overallVerdict}</strong>
            </span>
            {sample.approvalDetails.reviewedBy && (
              <span className="text-slate-400">
                Audited by: {sample.approvalDetails.reviewedBy}
              </span>
            )}
          </div>
        </div>

        {/* Audit Trail / Stage History */}
        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 mb-5">
          <h3 className="font-bold text-white flex items-center gap-1.5 text-xs mb-3">
            <Clock className="w-4 h-4 text-indigo-400" />
            Stage Progression Audit Trail
          </h3>
          <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-800">
            {sample.stageHistory.map((hist, idx) => (
              <div key={idx} className="relative flex items-start gap-3 pl-7">
                <div className="absolute left-1.5 top-1 w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-slate-900"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white uppercase text-[11px]">
                      {STAGE_CONFIG[hist.stage].label}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(hist.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs mt-0.5">{hist.note}</p>
                  {hist.operator && (
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Handled by: {hist.operator}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Created: {new Date(sample.createdAt).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
            {currentStageConfig.nextStage && (
              <button
                onClick={() => {
                  onClose();
                  onAdvanceStage(sample);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Advance to {STAGE_CONFIG[currentStageConfig.nextStage].label}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
