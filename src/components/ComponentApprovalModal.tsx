import React, { useState, useEffect } from 'react';
import {
  SampleItem,
  ApprovableComponentKey,
  ApprovalDetails,
  getComponentApprovalProof,
  getGranularApprovalStatus,
} from '../types/sample';
import {
  uploadApprovalAttachment,
  upsertComponentApprovalInSupabase,
} from '../lib/supabase';
import { StyleProductImage } from './StyleProductImage';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Upload,
  FileText,
  Image as ImageIcon,
  Download,
  Eye,
  RotateCcw,
  Paperclip,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ComponentApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  sample: SampleItem | null;
  initialComponent?: ApprovableComponentKey;
  reviewerName?: string;
  onSaveApprovalDetails: (sampleId: string, updatedDetails: ApprovalDetails) => void;
}

export const COMPONENT_APPROVAL_META: Record<
  ApprovableComponentKey,
  {
    label: string;
    shortLabel: string;
    specHint: (sample: SampleItem) => string;
    placeholder: string;
  }
> = {
  wash: {
    label: 'Wash Approval',
    shortLabel: 'Wash',
    specHint: (s) => `${s.color} • ${s.washDetails?.washType || 'Standard Wash'}`,
    placeholder:
      'Enter mandatory Wash approval note (e.g., Buyer approved shade band, handfeel, and whisker contrast)...',
  },
  thread: {
    label: 'Thread Approval',
    shortLabel: 'Thread',
    specHint: (s) =>
      s.threadNote ||
      s.requisitionForm?.threadNote ||
      s.requisitionForm?.trims?.threadNote ||
      'Per Spec / Shade Card',
    placeholder:
      'Enter mandatory Thread approval note (e.g., DTM Coats Epic 40s / 60s ticket & shade approved)...',
  },
  zipper: {
    label: 'Zipper Approval',
    shortLabel: 'Zipper',
    specHint: (s) =>
      s.zipperNote ||
      s.requisitionForm?.zipperNote ||
      s.requisitionForm?.trims?.zipperNote ||
      'Per Sample Spec',
    placeholder:
      'Enter mandatory Zipper approval note (e.g., YKK #5 metal teeth & tape color approved by buyer)...',
  },
  button: {
    label: 'Button Approval',
    shortLabel: 'Button',
    specHint: (s) =>
      s.buttonNote ||
      s.requisitionForm?.buttonNote ||
      s.requisitionForm?.trims?.buttonNote ||
      'Per Sample Spec',
    placeholder:
      'Enter mandatory Button approval note (e.g., 28L antique brass shank button finish & logo approved)...',
  },
};

export const ComponentApprovalModal: React.FC<ComponentApprovalModalProps> = ({
  isOpen,
  onClose,
  sample,
  initialComponent = 'wash',
  reviewerName = 'Merchandiser',
  onSaveApprovalDetails,
}) => {
  const [activeComponent, setActiveComponent] =
    useState<ApprovableComponentKey>(initialComponent);
  const [note, setNote] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentType, setAttachmentType] = useState<'pdf' | 'image'>('image');
  const [isUploading, setIsUploading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [previewExpanded, setPreviewExpanded] = useState(false);

  useEffect(() => {
    if (isOpen && sample) {
      setActiveComponent(initialComponent);
    }
  }, [isOpen, sample?.id, initialComponent]);

  useEffect(() => {
    if (!sample || !isOpen) return;
    const proof = getComponentApprovalProof(sample, activeComponent);
    setNote(proof.note || '');
    setAttachmentUrl(proof.attachmentUrl || '');
    setAttachmentName(
      proof.attachmentName ||
        (proof.attachmentUrl
          ? `${sample.styleCode}_${activeComponent}_approval.${
              proof.attachmentType === 'pdf' ? 'pdf' : 'jpg'
            }`
          : '')
    );
    setAttachmentType(
      proof.attachmentType ||
        (proof.attachmentUrl?.startsWith('data:application/pdf') ||
        proof.attachmentUrl?.toLowerCase().endsWith('.pdf')
          ? 'pdf'
          : 'image')
    );
    setValidationError(null);
    setPreviewExpanded(false);
  }, [sample, activeComponent, isOpen]);

  if (!isOpen || !sample) return null;

  const currentProof = getComponentApprovalProof(sample, activeComponent);
  const meta = COMPONENT_APPROVAL_META[activeComponent];
  const granular = getGranularApprovalStatus(sample);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    const isPdf =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage =
      file.type.startsWith('image/') ||
      /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i.test(file.name);

    if (!isPdf && !isImage) {
      setValidationError('Please select a valid PDF (.pdf) or Image (.jpg, .png, .webp) file.');
      return;
    }

    setIsUploading(true);
    setValidationError(null);
    try {
      const uploaded = await uploadApprovalAttachment(file, {
        sampleId: sample.id,
        styleCode: sample.styleCode,
        component: activeComponent,
      });
      setAttachmentUrl(uploaded.url);
      setAttachmentName(uploaded.fileName);
      setAttachmentType(uploaded.fileType);
    } catch {
      setValidationError('Could not read file. Please try another PDF or Image.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleApproveComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedNote = note.trim();
    const trimmedAttachment = attachmentUrl.trim();

    if (!trimmedNote && !trimmedAttachment) {
      setValidationError(
        `Mandatory Requirement: You must enter an Approval Note AND attach a PDF or Image to mark ${meta.shortLabel} as Approved.`
      );
      return;
    }
    if (!trimmedNote) {
      setValidationError(
        `Mandatory Requirement: Please enter an Approval Note before marking ${meta.shortLabel} as Approved.`
      );
      return;
    }
    if (!trimmedAttachment) {
      setValidationError(
        `Mandatory Requirement: Please upload a PDF or Image attachment before marking ${meta.shortLabel} as Approved.`
      );
      return;
    }

    setValidationError(null);
    const nowIso = new Date().toISOString();

    const nextComponentApprovals = {
      ...(sample.approvalDetails.componentApprovals || {}),
      [activeComponent]: {
        approved: true,
        note: trimmedNote,
        attachmentUrl: trimmedAttachment,
        attachmentName: attachmentName || `${sample.styleCode}_${activeComponent}_approval`,
        attachmentType,
        approvedBy: reviewerName,
        approvedAt: nowIso,
      },
    };

    const updatedDetails: ApprovalDetails = {
      ...sample.approvalDetails,
      washApproved:
        activeComponent === 'wash' ? true : granular.washApproved,
      threadApproved:
        activeComponent === 'thread' ? true : granular.threadApproved,
      zipperApproved:
        activeComponent === 'zipper' ? true : granular.zipperApproved,
      buttonApproved:
        activeComponent === 'button' ? true : granular.buttonApproved,
      componentApprovals: nextComponentApprovals,
      reviewedBy: reviewerName,
      reviewedAt: nowIso,
    };

    if (activeComponent === 'wash') {
      updatedDetails.washComments = trimmedNote;
      updatedDetails.washApprovalNote = trimmedNote;
      updatedDetails.washApprovalAttachment = trimmedAttachment;
      updatedDetails.washApprovalAttachmentName = attachmentName;
      updatedDetails.washApprovalAttachmentType = attachmentType;
      updatedDetails.washApprovedBy = reviewerName;
      updatedDetails.washApprovedAt = nowIso;
    } else if (activeComponent === 'thread') {
      updatedDetails.threadApprovalNote = trimmedNote;
      updatedDetails.threadApprovalAttachment = trimmedAttachment;
      updatedDetails.threadApprovalAttachmentName = attachmentName;
      updatedDetails.threadApprovalAttachmentType = attachmentType;
      updatedDetails.threadApprovedBy = reviewerName;
      updatedDetails.threadApprovedAt = nowIso;
      if (!updatedDetails.trimsComments) {
        updatedDetails.trimsComments = `Thread: ${trimmedNote}`;
      }
    } else if (activeComponent === 'zipper') {
      updatedDetails.zipperApprovalNote = trimmedNote;
      updatedDetails.zipperApprovalAttachment = trimmedAttachment;
      updatedDetails.zipperApprovalAttachmentName = attachmentName;
      updatedDetails.zipperApprovalAttachmentType = attachmentType;
      updatedDetails.zipperApprovedBy = reviewerName;
      updatedDetails.zipperApprovedAt = nowIso;
      if (!updatedDetails.accessoriesComments) {
        updatedDetails.accessoriesComments = `Zipper: ${trimmedNote}`;
      }
    } else if (activeComponent === 'button') {
      updatedDetails.buttonApprovalNote = trimmedNote;
      updatedDetails.buttonApprovalAttachment = trimmedAttachment;
      updatedDetails.buttonApprovalAttachmentName = attachmentName;
      updatedDetails.buttonApprovalAttachmentType = attachmentType;
      updatedDetails.buttonApprovedBy = reviewerName;
      updatedDetails.buttonApprovedAt = nowIso;
      if (!updatedDetails.accessoriesComments) {
        updatedDetails.accessoriesComments = `Button: ${trimmedNote}`;
      }
    }

    // Auto-sync trimsApproved / accessoriesApproved & overallVerdict if all 4 are approved
    if (updatedDetails.threadApproved) {
      updatedDetails.trimsApproved = true;
    }
    if (updatedDetails.buttonApproved && updatedDetails.zipperApproved) {
      updatedDetails.accessoriesApproved = true;
    }
    if (
      updatedDetails.washApproved &&
      updatedDetails.threadApproved &&
      updatedDetails.zipperApproved &&
      updatedDetails.buttonApproved
    ) {
      updatedDetails.trimsApproved = true;
      updatedDetails.accessoriesApproved = true;
      updatedDetails.overallVerdict = 'approved';
      try {
        confetti({
          particleCount: 70,
          spread: 65,
          origin: { y: 0.6 },
        });
      } catch {
        // Ignore in restricted iframe
      }
    }

    await upsertComponentApprovalInSupabase({
      sampleId: sample.id,
      styleCode: sample.styleCode,
      component: activeComponent,
      approved: true,
      note: trimmedNote,
      attachmentUrl: trimmedAttachment,
      attachmentName,
      attachmentType,
      approvedBy: reviewerName,
      approvedAt: nowIso,
    });

    onSaveApprovalDetails(sample.id, updatedDetails);
  };

  const handleMarkPending = async () => {
    const nowIso = new Date().toISOString();
    const nextComponentApprovals = {
      ...(sample.approvalDetails.componentApprovals || {}),
      [activeComponent]: {
        approved: false,
        note: note.trim(),
        attachmentUrl,
        attachmentName,
        attachmentType,
        approvedBy: reviewerName,
        approvedAt: nowIso,
      },
    };

    const updatedDetails: ApprovalDetails = {
      ...sample.approvalDetails,
      washApproved:
        activeComponent === 'wash' ? false : granular.washApproved,
      threadApproved:
        activeComponent === 'thread' ? false : granular.threadApproved,
      zipperApproved:
        activeComponent === 'zipper' ? false : granular.zipperApproved,
      buttonApproved:
        activeComponent === 'button' ? false : granular.buttonApproved,
      componentApprovals: nextComponentApprovals,
      overallVerdict: 'pending',
      reviewedBy: reviewerName,
      reviewedAt: nowIso,
    };

    await upsertComponentApprovalInSupabase({
      sampleId: sample.id,
      styleCode: sample.styleCode,
      component: activeComponent,
      approved: false,
      note: note.trim(),
      attachmentUrl,
      attachmentName,
      attachmentType,
      approvedBy: reviewerName,
      approvedAt: nowIso,
    });

    onSaveApprovalDetails(sample.id, updatedDetails);
  };

  const componentsList: ApprovableComponentKey[] = ['wash', 'thread', 'zipper', 'button'];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border-2 border-emerald-600 rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl relative max-h-[92dvh] overflow-y-auto text-xs text-slate-800">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 pb-3.5 mb-4 border-b border-emerald-100">
          <div className="flex items-center gap-3 min-w-0">
            <StyleProductImage sample={sample} size="sm" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-300">
                  {sample.styleCode}
                </span>
                <span className="font-bold text-sm text-slate-900 truncate">
                  {sample.styleName}
                </span>
                <span className="text-[11px] text-slate-600">
                  • PO: <strong className="font-mono text-slate-900">{sample.poNumber}</strong> • Buyer:{' '}
                  <strong className="text-slate-900">{sample.buyer}</strong>
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 font-semibold mt-1">
                Mandatory Approval Verification — Submit Note &amp; PDF/Image Attachment to Mark Approved
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-emerald-50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Component Tabs: Wash, Thread, Zipper, Button */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {componentsList.map((comp) => {
            const compProof = getComponentApprovalProof(sample, comp);
            const compMeta = COMPONENT_APPROVAL_META[comp];
            const isSelected = activeComponent === comp;
            return (
              <button
                key={comp}
                type="button"
                onClick={() => setActiveComponent(comp)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-md'
                    : 'bg-emerald-50/60 text-slate-800 border-emerald-200 hover:border-emerald-400'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-xs">{compMeta.shortLabel}</span>
                  {compProof.approved ? (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-600 text-white border border-white/30">
                      Approved
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500 text-white">
                      Pending
                    </span>
                  )}
                </div>
                <div
                  className={`text-[10px] mt-1 flex items-center gap-1 truncate ${
                    isSelected ? 'text-emerald-50' : 'text-slate-600'
                  }`}
                >
                  <Paperclip className="w-3 h-3 shrink-0" />
                  <span>
                    {compProof.attachmentUrl ? 'Note + File Attached' : 'Proof Required'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Component Approval Form */}
        <form onSubmit={handleApproveComponent} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                {meta.label} ({sample.styleCode})
              </div>
              <div className="text-[11px] text-slate-700 mt-0.5">
                Current Spec: <strong className="text-slate-900">{meta.specHint(sample)}</strong>
              </div>
            </div>
            <div>
              {currentProof.approved ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 text-white text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approved
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500 text-white text-xs font-bold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Pending Approval
                </span>
              )}
            </div>
          </div>

          {validationError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-300 text-red-800 text-xs font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* 1. Mandatory Approval Note */}
          <div>
            <label className="block font-bold text-slate-900 mb-1">
              1. {meta.shortLabel} Approval Note / Buyer Remark <span className="text-red-600">* (Required)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                if (validationError) setValidationError(null);
              }}
              rows={3}
              placeholder={meta.placeholder}
              className="w-full rounded-xl border border-emerald-300 bg-white p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* 2. Mandatory PDF or Image Attachment */}
          <div>
            <label className="block font-bold text-slate-900 mb-1">
              2. {meta.shortLabel} Approval Document (PDF or Image) <span className="text-red-600">* (Required)</span>
            </label>

            <div className="p-3.5 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-slate-700">
                  <Upload className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    Upload signed buyer approval sheet, swatch card photo, or lab PDF (`.pdf`, `.jpg`, `.png`)
                  </span>
                </div>
                <label className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'Uploading...' : attachmentUrl ? 'Replace PDF / Image' : 'Choose PDF or Image'}</span>
                  <input
                    type="file"
                    accept=".pdf,application/pdf,image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Attached File Preview Card */}
              {attachmentUrl ? (
                <div className="p-3 rounded-xl bg-white border border-emerald-200 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {attachmentType === 'pdf' ? (
                        <FileText className="w-5 h-5 text-red-600 shrink-0" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-emerald-600 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">
                          {attachmentName || `${sample.styleCode}_${activeComponent}_approval`}
                        </div>
                        <div className="text-[10px] text-emerald-700 font-semibold uppercase">
                          {attachmentType === 'pdf' ? 'PDF Approval Document Attached' : 'Approval Image Attached'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPreviewExpanded((prev) => !prev)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{previewExpanded ? 'Hide Preview' : 'Preview'}</span>
                      </button>
                      <a
                        href={attachmentUrl}
                        download={
                          attachmentName ||
                          `${sample.styleCode}_${activeComponent}_approval.${
                            attachmentType === 'pdf' ? 'pdf' : 'jpg'
                          }`
                        }
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setAttachmentUrl('');
                          setAttachmentName('');
                        }}
                        className="px-2 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 font-bold text-[11px] cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {previewExpanded && (
                    <div className="pt-2 border-t border-emerald-100">
                      {attachmentType === 'pdf' ? (
                        <iframe
                          src={attachmentUrl}
                          title={`${meta.label} PDF Preview`}
                          className="w-full h-64 rounded-lg border border-emerald-200 bg-slate-50"
                        />
                      ) : (
                        <div className="max-h-64 overflow-hidden rounded-lg border border-emerald-200 bg-slate-50 flex items-center justify-center p-2">
                          <img
                            src={attachmentUrl}
                            alt={attachmentName || meta.label}
                            className="max-h-60 object-contain rounded"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-[11px] text-amber-800 font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>No PDF or Image attached yet. Attachment is required to mark as Approved.</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-emerald-100 flex flex-wrap items-center justify-between gap-2">
            <div>
              {currentProof.approved && (
                <button
                  type="button"
                  onClick={handleMarkPending}
                  className="px-3 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Revert {meta.shortLabel} to Pending</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {currentProof.approved
                    ? `Update ${meta.shortLabel} Approval Proof`
                    : `Submit Note & Attachment → Mark ${meta.shortLabel} Approved`}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
