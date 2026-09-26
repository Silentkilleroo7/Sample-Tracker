import React, { useState } from 'react';
import {
  SampleItem,
  STAGE_CONFIG,
  ApprovalStatus,
  ApprovalDetails,
  ParcelDetails,
} from '../types/sample';
import { ProgressBar } from './ProgressBar';
import { StyleProductImage } from './StyleProductImage';
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
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ApprovalParcelViewProps {
  samples: SampleItem[];
  onSelectSample: (sample: SampleItem) => void;
  onAdvanceStage: (sample: SampleItem) => void;
  onUpdateApprovalDetails: (sampleId: string, details: ApprovalDetails) => void;
  onUpdateParcelDetails: (sampleId: string, details: ParcelDetails) => void;
  onOpenFollowUp?: (sample: SampleItem) => void;
  onToggleWorkbookSent?: (sampleId: string) => void;
  onSendWhatsApp?: (sample: SampleItem, phone: string, customMessage?: string) => void;
}

export const ApprovalParcelView: React.FC<ApprovalParcelViewProps> = ({
  samples,
  onSelectSample,
  onAdvanceStage,
  onUpdateApprovalDetails,
  onOpenFollowUp,
  onToggleWorkbookSent,
  onSendWhatsApp,
}) => {
  const [subTab, setSubTab] = useState<'all' | 'ready_for_parcel' | 'approval_comments'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Editing state for remarks note
  const [editingSampleId, setEditingSampleId] = useState<string | null>(null);
  const [tempApproval, setTempApproval] = useState<ApprovalDetails | null>(null);

  // Filter styles in ready_for_parcel or approval_comments
  const relevantSamples = samples.filter(
    (s) => s.stage === 'ready_for_parcel' || s.stage === 'approval_comments'
  );

  const filteredSamples = relevantSamples.filter((s) => {
    if (subTab !== 'all' && s.stage !== subTab) return false;
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
  });

  const readyCount = samples.filter((s) => s.stage === 'ready_for_parcel').length;
  const approvalCount = samples.filter((s) => s.stage === 'approval_comments').length;

  const handleStartEdit = (sample: SampleItem) => {
    setEditingSampleId(sample.id);
    setTempApproval({ ...sample.approvalDetails });
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
            <PackageCheck className="w-3.5 h-3.5" />
            Parcel Dispatch & Buyer Approval Tracking
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Parcel Styles & Approval Comments
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Manage parcel delivery schedules, courier airway bills, and record comprehensive buyer remarks for Wash, Trims, and Accessories.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-900/90 rounded-xl border border-emerald-500/30 text-center min-w-[110px]">
            <span className="text-2xl font-mono font-black text-emerald-400">
              {readyCount}
            </span>
            <div className="text-[11px] text-slate-400 uppercase font-semibold">
              Ready Parcel
            </div>
          </div>
          <div className="p-3 bg-slate-900/90 rounded-xl border border-pink-500/30 text-center min-w-[110px]">
            <span className="text-2xl font-mono font-black text-pink-400">
              {approvalCount}
            </span>
            <div className="text-[11px] text-slate-400 uppercase font-semibold">
              Comments
            </div>
          </div>
        </div>
      </div>

      {/* Subtab selection & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'all'
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All Parcel & Approval ({relevantSamples.length})
          </button>
          <button
            onClick={() => setSubTab('ready_for_parcel')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'ready_for_parcel'
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Ready for Parcel ({readyCount})
          </button>
          <button
            onClick={() => setSubTab('approval_comments')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'approval_comments'
                ? 'bg-pink-600 text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Approval Comments ({approvalCount})
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

            return (
              <div
                key={sample.id}
                className={`p-5 rounded-2xl border transition-all shadow-xl ${
                  isApprovalComments
                    ? 'bg-slate-900/90 border-slate-800 hover:border-pink-500/50'
                    : 'bg-slate-900/90 border-slate-800 hover:border-emerald-500/50'
                }`}
              >
                {/* Header Information */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <StyleProductImage sample={sample} size="md" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-black text-xs text-indigo-400 px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/30">
                          {sample.styleCode}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          PO: <span className="font-mono text-slate-300">{sample.poNumber}</span> • Buyer:{' '}
                          <strong className="text-slate-200">{sample.buyer}</strong>
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

                  {/* Parcel Date & Courier Capsule */}
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
                        <Truck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Courier & Dispatch Date:</span>
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

                  {/* 3 Categories: Wash, Trims, Accessories */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
                    {/* 1. Wash Approval */}
                    <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/60 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-cyan-300 flex items-center gap-1">
                            1. Wash Approval
                          </span>
                          {isEditing ? (
                            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-300">
                              <input
                                type="checkbox"
                                checked={aDetails.washApproved}
                                onChange={(e) =>
                                  setTempApproval((prev) =>
                                    prev ? { ...prev, washApproved: e.target.checked } : null
                                  )
                                }
                                className="rounded text-indigo-600 focus:ring-0"
                              />
                              Approved
                            </label>
                          ) : (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                aDetails.washApproved
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {aDetails.washApproved ? 'Approved' : 'Pending / Review'}
                            </span>
                          )}
                        </div>
                        {isEditing ? (
                          <textarea
                            value={aDetails.washComments}
                            onChange={(e) =>
                              setTempApproval((prev) =>
                                prev ? { ...prev, washComments: e.target.value } : null
                              )
                            }
                            rows={3}
                            placeholder="Enter wash comments (e.g. shade, whisker contrast, hand feel)..."
                            className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        ) : (
                          <p className="text-slate-300 text-xs mt-1 italic leading-relaxed">
                            {aDetails.washComments || 'No wash remarks entered yet.'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* 2. Trims Approval */}
                    <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/60 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-amber-300 flex items-center gap-1">
                            2. Trims Approval
                          </span>
                          {isEditing ? (
                            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-300">
                              <input
                                type="checkbox"
                                checked={aDetails.trimsApproved}
                                onChange={(e) =>
                                  setTempApproval((prev) =>
                                    prev ? { ...prev, trimsApproved: e.target.checked } : null
                                  )
                                }
                                className="rounded text-indigo-600 focus:ring-0"
                              />
                              Approved
                            </label>
                          ) : (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                aDetails.trimsApproved
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {aDetails.trimsApproved ? 'Approved' : 'Pending / Review'}
                            </span>
                          )}
                        </div>
                        {isEditing ? (
                          <textarea
                            value={aDetails.trimsComments}
                            onChange={(e) =>
                              setTempApproval((prev) =>
                                prev ? { ...prev, trimsComments: e.target.value } : null
                              )
                            }
                            rows={3}
                            placeholder="Enter trims comments (labels, pocket bags, stitching thread)..."
                            className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        ) : (
                          <p className="text-slate-300 text-xs mt-1 italic leading-relaxed">
                            {aDetails.trimsComments || 'No trims remarks entered yet.'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* 3. Accessories Approval */}
                    <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/60 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-pink-300 flex items-center gap-1">
                            3. Accessories Approval
                          </span>
                          {isEditing ? (
                            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-300">
                              <input
                                type="checkbox"
                                checked={aDetails.accessoriesApproved}
                                onChange={(e) =>
                                  setTempApproval((prev) =>
                                    prev ? { ...prev, accessoriesApproved: e.target.checked } : null
                                  )
                                }
                                className="rounded text-indigo-600 focus:ring-0"
                              />
                              Approved
                            </label>
                          ) : (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                aDetails.accessoriesApproved
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {aDetails.accessoriesApproved ? 'Approved' : 'Pending / Review'}
                            </span>
                          )}
                        </div>
                        {isEditing ? (
                          <textarea
                            value={aDetails.accessoriesComments}
                            onChange={(e) =>
                              setTempApproval((prev) =>
                                prev ? { ...prev, accessoriesComments: e.target.value } : null
                              )
                            }
                            rows={3}
                            placeholder="Enter accessories comments (zippers, shank buttons, rivets, drawstrings)..."
                            className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        ) : (
                          <p className="text-slate-300 text-xs mt-1 italic leading-relaxed">
                            {aDetails.accessoriesComments || 'No accessories remarks entered yet.'}
                          </p>
                        )}
                      </div>
                    </div>
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
