import React, { useState } from 'react';
import { SampleItem } from '../types/sample';
import { StyleProductImage } from './StyleProductImage';
import {
  X,
  MessageCircle,
  Calendar,
  Clock,
  Phone,
  CheckCircle2,
  FileCheck2,
  Send,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';

interface FollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  sample: SampleItem | null;
  onSaveFollowUp: (
    sampleId: string,
    followUpData: {
      followUpDate: string;
      followUpTime?: string;
      status: 'pending' | 'completed' | 'scheduled';
      whatsAppNumber: string;
      notes?: string;
    },
    workbookSent: boolean,
    workbookSentDate?: string,
    workbookNotes?: string
  ) => void;
  onSendWhatsApp: (sample: SampleItem, phone: string, customMessage?: string) => void;
}

export const FollowUpModal: React.FC<FollowUpModalProps> = ({
  isOpen,
  onClose,
  sample,
  onSaveFollowUp,
  onSendWhatsApp,
}) => {
  if (!isOpen || !sample) return null;

  const p = sample.parcelDetails;
  const initialFollowUp = p.followUp;

  const [followUpDate, setFollowUpDate] = useState(
    initialFollowUp?.followUpDate ||
      new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [followUpTime, setFollowUpTime] = useState(initialFollowUp?.followUpTime || '14:00');
  const [status, setStatus] = useState<'pending' | 'completed' | 'scheduled'>(
    initialFollowUp?.status || 'pending'
  );
  const [whatsAppNumber, setWhatsAppNumber] = useState(
    initialFollowUp?.whatsAppNumber || '+1 (215) 555-0199'
  );
  const [notes, setNotes] = useState(
    initialFollowUp?.notes || `Follow up with ${sample.buyer} regarding sample reception & wash approval comments.`
  );

  // Workbook Sent confirmation state
  const [workbookSent, setWorkbookSent] = useState<boolean>(p.workbookSent ?? false);
  const [workbookSentDate, setWorkbookSentDate] = useState<string>(
    p.workbookSentDate || new Date().toISOString().split('T')[0]
  );
  const [workbookNotes, setWorkbookNotes] = useState<string>(
    p.workbookNotes || 'Spec measurement & accessories workbook'
  );

  // Custom WhatsApp message
  const [customMsg] = useState('');

  const handleSave = () => {
    onSaveFollowUp(
      sample.id,
      {
        followUpDate,
        followUpTime,
        status,
        whatsAppNumber,
        notes,
      },
      workbookSent,
      workbookSent ? workbookSentDate : undefined,
      workbookNotes
    );
    onClose();
  };

  const handleSendWhatsAppClick = () => {
    onSendWhatsApp(sample, whatsAppNumber, customMsg || undefined);
    onSaveFollowUp(
      sample.id,
      {
        followUpDate,
        followUpTime,
        status: 'scheduled',
        whatsAppNumber,
        notes: notes + ` [WhatsApp sent ${new Date().toLocaleTimeString()}]`,
      },
      workbookSent,
      workbookSent ? workbookSentDate : undefined,
      workbookNotes
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto text-xs text-slate-300">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 pb-3 mb-4 border-b border-slate-800">
          <StyleProductImage sample={sample} size="xs" />
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              Parcel Follow-Up & WhatsApp Notification
            </h2>
            <p className="text-slate-400 text-xs">
              Style: <strong className="text-indigo-400 font-mono">{sample.styleCode}</strong> • {sample.styleName} ({sample.buyer})
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* 1. WORKBOOK SENT OR NOT CONFIRMATION OPTION */}
          <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-white text-xs sm:text-sm">
                  Workbook Sent Confirmation Option
                </span>
              </div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                Parcel Verification
              </span>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed">
              Confirm whether the techpack specification, measurement, and trim workbook has been dispatched to the buyer alongside or prior to parcel delivery.
            </p>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setWorkbookSent(true)}
                className={`flex-1 py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  workbookSent
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400/40'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Workbook Sent: YES</span>
              </button>

              <button
                type="button"
                onClick={() => setWorkbookSent(false)}
                className={`flex-1 py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  !workbookSent
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 ring-2 ring-amber-400/40'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700'
                }`}
              >
                <AlertCircle className="w-4 h-4 text-amber-300" />
                <span>Workbook Sent: NO (Pending)</span>
              </button>
            </div>

            {workbookSent ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">
                    Workbook Sent Date
                  </label>
                  <input
                    type="date"
                    value={workbookSentDate}
                    onChange={(e) => setWorkbookSentDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">
                    Workbook Dispatch Notes / Reference
                  </label>
                  <input
                    type="text"
                    value={workbookNotes}
                    onChange={(e) => setWorkbookNotes(e.target.value)}
                    placeholder="e.g. Sent via PLM portal / Email attachment"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Reminder: Dispatch the measurement & trim workbook so buyer tech teams can review immediately upon parcel receipt!
                </span>
              </div>
            )}
          </div>

          {/* 2. PARCEL FOLLOW-UP & WHATSAPP NOTIFICATION CONFIGURATION */}
          <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white text-xs sm:text-sm">
                  Parcel Follow-Up & Connected WhatsApp
                </span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                WhatsApp Connected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 text-[11px] mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  Scheduled Follow-Up Date *
                </label>
                <input
                  type="date"
                  required
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  Preferred Follow-Up Time
                </label>
                <input
                  type="time"
                  value={followUpTime}
                  onChange={(e) => setFollowUpTime(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>
            </div>

            {/* Connected WhatsApp Number */}
            <div>
              <label className="block text-slate-400 text-[11px] mb-1 flex items-center gap-1 font-semibold">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                Connected WhatsApp Number (with Country Code) *
              </label>
              <input
                type="text"
                placeholder="e.g. +12155550199 or +8801712345678"
                value={whatsAppNumber}
                onChange={(e) => setWhatsAppNumber(e.target.value)}
                className="w-full bg-slate-800 border border-emerald-500/40 rounded-lg p-2 text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <div className="flex gap-2 mt-1.5">
                {['+1 (215) 555-0199', '+44 20 7946 0991', '+880 1711 002233'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setWhatsAppNumber(preset)}
                    className="text-[10px] text-slate-400 hover:text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700 cursor-pointer"
                  >
                    Preset: {preset.substring(0, 10)}...
                  </button>
                ))}
              </div>
            </div>

            {/* Follow-up Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">
                  Follow-Up Action Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-semibold"
                >
                  <option value="pending">⏳ Pending Follow-up</option>
                  <option value="scheduled">📅 Follow-Up Scheduled</option>
                  <option value="completed">✅ Follow-Up Completed / Received</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">
                  Follow-Up Action Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Call for wash comments"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
            </div>

            {/* WhatsApp Message Preview & Direct Trigger */}
            <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-xs space-y-2">
              <div className="flex items-center justify-between text-emerald-300 font-semibold text-[11px]">
                <span className="flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-emerald-400" />
                  Live WhatsApp Message Preview:
                </span>
                <span className="text-[10px] text-slate-400">
                  Pre-formatted with Style, AWB & Workbook status
                </span>
              </div>

              <div className="p-2.5 rounded bg-black/50 border border-emerald-500/20 text-emerald-100 font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
{`*GA SAMPLE TRACKING - PARCEL FOLLOW-UP*
Style: ${sample.styleName} (${sample.styleCode})
Buyer: ${sample.buyer} | PO: ${sample.poNumber}
Courier: ${p.courier || 'DHL'} | AWB: ${p.trackingNumber || 'Pending'}
Parcel Date: ${p.parcelDate}
Workbook Sent: ${workbookSent ? `YES (${workbookSentDate})` : 'NO (Pending)'}

Dear Team, the sample parcel for ${sample.styleName} has been dispatched. Please confirm receipt & share approval comments.`}
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-400">
                  Opens WhatsApp Web or App with prefilled message
                </span>
                <button
                  type="button"
                  onClick={handleSendWhatsAppClick}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Send WhatsApp Notification Now</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Parcel Date: {p.parcelDate} • {p.courier || 'DHL Express'}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              Save Follow-Up & Workbook Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
