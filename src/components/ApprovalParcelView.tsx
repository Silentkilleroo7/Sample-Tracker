import React, { useState } from 'react';
import {
  SampleItem,
  ApprovableComponentKey,
  STAGE_CONFIG,
  ApprovalStatus,
  ApprovalDetails,
  ParcelDetails,
  getEffectiveShipmentDate,
  getDaysUntilShipment,
  getGranularApprovalStatus,
  getComponentApprovalProof,
  getPriorityTone,
} from '../types/sample';
import { ProgressBar } from './ProgressBar';
import { StyleProductImage } from './StyleProductImage';
import { SampleTypeBadge } from './SampleTypeBadge';
import {
  PackageCheck,
  MessageSquare,
  Truck,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Send,
  FileCheck,
  Search,
  ExternalLink,
  Save,
  Check,
  MessageCircle,
  Phone,
  FileCheck2,
  Paperclip,
  FileText,
  Download,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ApprovalParcelViewProps {
  samples: SampleItem[];
  stageMode?: 'ready_for_parcel' | 'approval_comments';
  onSelectSample: (sample: SampleItem) => void;
  onAdvanceStage: (sample: SampleItem) => void;
  onUpdateApprovalDetails: (sampleId: string, details: ApprovalDetails) => void;
  onUpdateParcelDetails: (sampleId: string, details: ParcelDetails) => void;
  onOpenComponentApproval?: (sample: SampleItem, component: ApprovableComponentKey) => void;
  onOpenFollowUp?: (sample: SampleItem) => void;
  onToggleWorkbookSent?: (sampleId: string) => void;
  onSendWhatsApp?: (sample: SampleItem, phone: string, customMessage?: string) => void;
}

export const ApprovalParcelView: React.FC<ApprovalParcelViewProps> = ({
  samples,
  stageMode = 'approval_comments',
  onSelectSample,
  onAdvanceStage,
  onUpdateApprovalDetails,
  onOpenComponentApproval,
  onOpenFollowUp,
  onToggleWorkbookSent,
  onSendWhatsApp,
}) => {
  const [subTab, setSubTab] = useState<'all' | 'priority_shipment'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Editing state for remarks note
  const [editingSampleId, setEditingSampleId] = useState<string | null>(null);
  const [tempApproval, setTempApproval] = useState<ApprovalDetails | null>(null);

  // Strictly filter styles by the dedicated status page (Ready for Parcel OR Approval Comments)
  const relevantSamples = samples.filter((s) => s.stage === stageMode);

  const filteredSamples = relevantSamples
    .filter((s) => {
      if (subTab === 'priority_shipment' && getGranularApprovalStatus(s).isFullyApproved) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.styleCode.toLowerCase().includes(q) ||
        s.styleName.toLowerCase().includes(q) ||
        s.poNumber.toLowerCase().includes(q) ||
        s.buyer.toLowerCase().includes(q) ||
        s.parcelDetails.courier.toLowerCase().includes(q) ||
        s.parcelDetails.trackingNumber.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const shipA = getEffectiveShipmentDate(a) || '9999-12-31';
      const shipB = getEffectiveShipmentDate(b) || '9999-12-31';
      return shipA.localeCompare(shipB);
    });

  const readyCount = samples.filter((s) => s.stage === 'ready_for_parcel').length;
  const approvalCount = samples.filter((s) => s.stage === 'approval_comments').length;
  const priorityPendingCount = relevantSamples.filter((s) => !getGranularApprovalStatus(s).isFullyApproved).length;

  const handleStartEdit = (sample: SampleItem) => {
    const gran = getGranularApprovalStatus(sample);
    setEditingSampleId(sample.id);
    setTempApproval({
      ...sample.approvalDetails,
      buttonApproved: gran.buttonApproved,
      threadApproved: gran.threadApproved,
      zipperApproved: gran.zipperApproved,
    });
  };

  const handleSaveApproval = (sampleId: string) => {
    if (!tempApproval) return;
    if (tempApproval.overallVerdict === 'approved') {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // Ignore in restricted iframe environments
      }
    }
    onUpdateApprovalDetails(sampleId, {
      ...tempApproval,
      reviewedAt: new Date().toISOString(),
    });
    setEditingSampleId(null);
    setTempApproval(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-2">
            {stageMode === 'ready_for_parcel' ? (
              <>
                <PackageCheck className="w-3.5 h-3.5" />
                Step 5 of 6 • Dedicated Ready for Parcel Status Page
              </>
            ) : (
              <>
                <MessageSquare className="w-3.5 h-3.5" />
                Step 6 of 6 • Dedicated Approval Comments Status Page
              </>
            )}
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {stageMode === 'ready_for_parcel'
              ? 'Ready for Parcel Status Styles Only (Move → Approval Comments)'
              : 'Approval Comments Status Styles Only (Buyer Verdict & Proofs)'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            {stageMode === 'ready_for_parcel'
              ? 'This page strictly displays only styles in Ready for Parcel Status. Manage courier dispatch, AWB numbers, and advance dispatched parcels to Approval Comments.'
              : 'This page strictly displays only styles in Approval Comments Status. Record Wash, Thread, Zipper, and Button approval proofs (Note + PDF/Image) and buyer remarks.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {stageMode === 'ready_for_parcel' ? (
            <div className="p-3 bg-slate-900/90 rounded-xl border border-emerald-500/30 text-center min-w-[130px]">
              <span className="text-2xl font-mono font-black text-emerald-400">
                {readyCount}
              </span>
              <div className="text-[11px] text-slate-400 uppercase font-semibold">
                In Ready Parcel
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-900/90 rounded-xl border border-emerald-500/30 text-center min-w-[130px]">
              <span className="text-2xl font-mono font-black text-emerald-400">
                {approvalCount}
              </span>
              <div className="text-[11px] text-slate-400 uppercase font-semibold">
                In Approval Status
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Subtab selection & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSubTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'all'
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {stageMode === 'ready_for_parcel'
              ? `All Ready for Parcel Styles (${relevantSamples.length})`
              : `All Approval Comments Styles (${relevantSamples.length})`}
          </button>
          <button
            onClick={() => setSubTab('priority_shipment')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'priority_shipment'
                ? 'bg-amber-500 text-slate-950 font-black shadow'
                : 'bg-slate-800 text-amber-300 hover:text-white'
            }`}
          >
            ⚡ Pending Component Approval ({priorityPendingCount})
          </button>
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Parcel, Style, AWB#..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Cards List */}
      {filteredSamples.length > 0 ? (
        <div className="space-y-4">
          {filteredSamples.map((sample) => {
            const isEditing = editingSampleId === sample.id;
            const pDetails = sample.parcelDetails;
            const aDetails = isEditing ? tempApproval! : sample.approvalDetails;
            const isReadyForParcel = sample.stage === 'ready_for_parcel';
            const isApprovalComments = sample.stage === 'approval_comments';
            const pTone = getPriorityTone(sample.priority);

            return (
              <div
                key={sample.id}
                className={`p-5 rounded-2xl border transition-all shadow-xl ${pTone.cardClass}`}
              >
                {/* Header Information */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <StyleProductImage sample={sample} size="md" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-black text-xs text-indigo-300 px-2 py-0.5 rounded bg-indigo-950/90 border border-indigo-500/40">
                          {sample.styleCode}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border ${pTone.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${pTone.dotClass}`}></span>
                          <span>{pTone.label}</span>
                        </span>
                        <SampleTypeBadge sampleType={sample.sampleType} size="xs" />
                        <span className="text-xs text-slate-300 font-medium">
                          PO: <span className="font-mono text-white">{sample.poNumber}</span> • Buyer:{' '}
                          <strong className="text-white">{sample.buyer}</strong> • Size:{' '}
                          <strong className="text-white font-mono">{sample.size}</strong> • Qty:{' '}
                          <strong className="text-emerald-300 font-mono">{sample.quantity} Pcs</strong>
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            STAGE_CONFIG[sample.stage].badgeBg
                          }`}
                        >
                          {STAGE_CONFIG[sample.stage].badgeText}
                        </span>
                      </div>
                      <h3
                        onClick={() => onSelectSample(sample)}
                        className="text-base font-bold text-white mt-1 hover:text-indigo-300 cursor-pointer transition-colors"
                      >
                        {sample.styleName}
                      </h3>
                    </div>
                  </div>

                  {/* Shipment Date & Parcel Date Capsule */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs">
                      <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        <span>Order Shipment Date:</span>
                      </div>
                      <div className="font-mono text-white font-black mt-0.5 flex items-center gap-1.5">
                        <span>{getEffectiveShipmentDate(sample) || 'Not set'}</span>
                        {getDaysUntilShipment(sample) !== null && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px]">
                            {getDaysUntilShipment(sample)! < 0
                              ? `${Math.abs(getDaysUntilShipment(sample)!)}d overdue`
                              : `${getDaysUntilShipment(sample)}d left`}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
                        <Truck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Courier &amp; Dispatch Date:</span>
                      </div>
                      <div className="font-mono text-emerald-300 font-bold mt-0.5 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        {pDetails.parcelDate || 'Scheduled date'} • {pDetails.courier || 'DHL'}
                      </div>
                    </div>

                    {isReadyForParcel && (
                      <button
                        onClick={() => onAdvanceStage(sample)}
                        className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white font-bold text-xs shadow-lg shadow-pink-600/30 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Dispatch Parcel → Open Approval Comments</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="my-3">
                  <ProgressBar currentStage={sample.stage} size="compact" />
                </div>

                {/* Parcel Courier Details Sub-bar */}
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs mb-3">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                      Courier / Service
                    </span>
                    <span className="text-slate-200 font-medium">
                      {pDetails.courier || 'DHL Express Worldwide'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                      Air Waybill (AWB) #
                    </span>
                    <span className="font-mono text-indigo-300 font-bold">
                      {pDetails.trackingNumber || 'Pending pickup'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                      Destination & Recipient
                    </span>
                    <span className="text-slate-200 truncate block">
                      {pDetails.destinationCountry} • {pDetails.recipient}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                      Parcel Status
                    </span>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                        pDetails.dispatchStatus === 'delivered'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : pDetails.dispatchStatus === 'dispatched'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {pDetails.dispatchStatus.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* 1. WORKBOOK SENT OR NOT CONFIRMATION OPTION & 2. FOLLOW-UP */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-slate-900/90 via-slate-850 to-slate-900/90 border border-slate-700/80 mb-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <FileCheck2 className="w-4 h-4 text-indigo-400" />
                      <span className="font-bold text-white text-xs sm:text-sm">
                        Workbook Sent or not confirmation option
                      </span>
                      <span className="text-[10px] text-slate-400 hidden sm:inline">
                        (Techpack, measurements & trim specs)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onToggleWorkbookSent && onToggleWorkbookSent(sample.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow ${
                          pDetails.workbookSent
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 ring-1 ring-emerald-400/40'
                            : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30 ring-1 ring-amber-400/40 animate-pulse'
                        }`}
                        title="Click to toggle Workbook Sent confirmation"
                      >
                        {pDetails.workbookSent ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Workbook Sent: YES (Confirmed)</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Workbook Sent: NO (Pending Confirmation)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Workbook details description & Follow-Up Bar */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div className="text-slate-300 text-[11px] leading-relaxed">
                      {pDetails.workbookSent ? (
                        <span className="text-emerald-300 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          Workbook confirmed sent on {pDetails.workbookSentDate || pDetails.parcelDate}. {pDetails.workbookNotes && `(${pDetails.workbookNotes})`}
                        </span>
                      ) : (
                        <span className="text-amber-300/90 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          Workbook has not been confirmed dispatched. Please send specification workbook to buyer merchandiser.
                        </span>
                      )}
                    </div>

                    {/* Follow Up & WhatsApp Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 bg-slate-800 px-2 py-1 rounded border border-slate-700">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <span className="font-mono text-emerald-300 text-[10px]">
                          {pDetails.followUp?.whatsAppNumber || '+1 (215) 555-0199'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenFollowUp && onOpenFollowUp(sample)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
                      >
                        Follow-Up Option
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onSendWhatsApp &&
                          onSendWhatsApp(
                            sample,
                            pDetails.followUp?.whatsAppNumber || '+1 (215) 555-0199'
                          )
                        }
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Send Follow-up WhatsApp notification"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Send WhatsApp</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* APPROVAL REMARKS NOTE SECTION (Wash, Trims, Accessories) */}
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80">
                  <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-700/60">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-pink-400" />
                      <h4 className="font-bold text-white text-xs sm:text-sm">
                        Buyer Approval Comments & Remarks Note
                      </h4>
                      <span className="text-[11px] text-slate-400 hidden sm:inline">
                        (Wash, Trims & Accessories Feedback)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => {
                              setEditingSampleId(null);
                              setTempApproval(null);
                            }}
                            className="px-2.5 py-1 text-slate-400 hover:text-white text-xs rounded-lg cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveApproval(sample.id)}
                            className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition-all cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Save Remarks</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(sample)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>{sample.approvalDetails.overallVerdict !== 'pending' ? 'Update Remarks' : 'Enter Buyer Remarks'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Fast Approval Checklist Bar: Wash, Thread, Zipper, Button (Mandatory Note + PDF/Image Attachment) */}
                  <div className="mb-3 p-2.5 rounded-lg bg-slate-900/80 border border-slate-700/70 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-emerald-950 text-[11px] uppercase tracking-wider">
                      Mandatory Proof Approvals (Wash, Thread, Zipper &amp; Button — Note + PDF/Image Required):
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {(
                        [
                          { comp: 'wash', label: 'Wash' },
                          { comp: 'thread', label: 'Thread' },
                          { comp: 'zipper', label: 'Zipper' },
                          { comp: 'button', label: 'Button' },
                        ] as { comp: ApprovableComponentKey; label: string }[]
                      ).map(({ comp, label }) => {
                        const proof = getComponentApprovalProof(sample, comp);
                        return (
                          <button
                            key={comp}
                            type="button"
                            onClick={() =>
                              onOpenComponentApproval && onOpenComponentApproval(sample, comp)
                            }
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition-all ${
                              proof.approved
                                ? 'bg-emerald-600 text-white border-emerald-700'
                                : 'bg-amber-500 text-white border-amber-600'
                            }`}
                            title={`Click to submit Note & PDF/Image attachment for ${label}`}
                          >
                            <span>
                              {label}: {proof.approved ? '✅ Approved' : '⏳ Submit Proof'}
                            </span>
                            {proof.attachmentUrl && <Paperclip className="w-3 h-3" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4 Mandatory Component Approval Cards: 1. Wash, 2. Thread, 3. Zipper, 4. Button */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    {(
                      [
                        { comp: 'wash', num: 1, title: 'Wash Approval' },
                        { comp: 'thread', num: 2, title: 'Thread Approval' },
                        { comp: 'zipper', num: 3, title: 'Zipper Approval' },
                        { comp: 'button', num: 4, title: 'Button Approval' },
                      ] as { comp: ApprovableComponentKey; num: number; title: string }[]
                    ).map(({ comp, num, title }) => {
                      const proof = getComponentApprovalProof(sample, comp);
                      return (
                        <div
                          key={comp}
                          className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/60 flex flex-col justify-between gap-2"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1.5 mb-1.5">
                              <span className="font-bold text-slate-900">
                                {num}. {title}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  proof.approved
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-amber-500 text-white'
                                }`}
                              >
                                {proof.approved ? 'Approved' : 'Pending'}
                              </span>
                            </div>

                            <p className="text-slate-700 text-xs mt-1 italic leading-relaxed">
                              {proof.note || `No ${comp} approval note submitted yet.`}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-slate-700/50 space-y-1.5">
                            {proof.attachmentUrl ? (
                              <a
                                href={proof.attachmentUrl}
                                download={
                                  proof.attachmentName ||
                                  `${sample.styleCode}_${comp}_approval.${
                                    proof.attachmentType === 'pdf' ? 'pdf' : 'jpg'
                                  }`
                                }
                                className="w-full inline-flex items-center justify-between gap-1 px-2 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-900 text-[10px] font-bold"
                              >
                                <span className="inline-flex items-center gap-1 truncate">
                                  {proof.attachmentType === 'pdf' ? (
                                    <FileText className="w-3 h-3 text-red-600 shrink-0" />
                                  ) : (
                                    <Paperclip className="w-3 h-3 text-emerald-600 shrink-0" />
                                  )}
                                  <span className="truncate">
                                    {proof.attachmentName || 'Attached File'}
                                  </span>
                                </span>
                                <Download className="w-3 h-3 shrink-0" />
                              </a>
                            ) : (
                              <div className="text-[10px] text-amber-700 font-medium">
                                PDF / Image required to approve
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                onOpenComponentApproval && onOpenComponentApproval(sample, comp)
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold cursor-pointer text-center"
                            >
                              {proof.approved
                                ? 'View / Update Note & Attachment'
                                : `Approve ${comp.charAt(0).toUpperCase() + comp.slice(1)} (Note + File)`}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Overall Verdict & General Remarks */}
                  <div className="mt-3.5 pt-3 border-t border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-300">
                        Overall Verdict:
                      </span>
                      {isEditing ? (
                        <select
                          value={aDetails.overallVerdict}
                          onChange={(e) =>
                            setTempApproval((prev) =>
                              prev ? { ...prev, overallVerdict: e.target.value as ApprovalStatus } : null
                            )
                          }
                          className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-semibold"
                        >
                          <option value="pending">Pending Buyer Response</option>
                          <option value="approved">✅ 100% Approved (Ready for Bulk)</option>
                          <option value="revision_requested">⚠️ Revision Requested</option>
                          <option value="rejected">❌ Rejected</option>
                        </select>
                      ) : (
                        <span
                          className={`font-bold px-2 py-0.5 rounded ${
                            aDetails.overallVerdict === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : aDetails.overallVerdict === 'revision_requested'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : aDetails.overallVerdict === 'rejected'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {aDetails.overallVerdict === 'approved' && '✅ Approved'}
                          {aDetails.overallVerdict === 'revision_requested' && '⚠️ Revision Requested'}
                          {aDetails.overallVerdict === 'rejected' && '❌ Rejected'}
                          {aDetails.overallVerdict === 'pending' && '⏳ Pending Review'}
                        </span>
                      )}
                    </div>

                    {aDetails.reviewedBy && (
                      <div className="text-[11px] text-slate-400">
                        Reviewed by: <strong className="text-slate-200">{aDetails.reviewedBy}</strong>
                      </div>
                    )}
                  </div>

                  {aDetails.generalRemarks && (
                    <div className="mt-2 text-[11px] text-slate-400 bg-slate-900/40 p-2 rounded-lg border border-slate-800">
                      <strong className="text-slate-300">General Feedback:</strong> {aDetails.generalRemarks}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
          <PackageCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-300">
            No parcel or approval styles found
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Once styles pass Finishing Status, they advance into Ready for Parcel and await Buyer Remarks.
          </p>
        </div>
      )}
    </div>
  );
};
