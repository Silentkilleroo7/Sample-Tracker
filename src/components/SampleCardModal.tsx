import React, { useState, useEffect, useMemo } from 'react';
import {
  SampleItem,
  SampleCardData,
  createDefaultSampleCardData,
  formatSampleCardDate,
} from '../types/sample';
import { SYSTEM_USERS, AppUser } from '../types/auth';
import {
  X,
  Printer,
  Save,
  Calendar as CalendarIcon,
  Tag,
  CheckCircle2,
  AlertCircle,
  Copy,
  ChevronLeft,
  ChevronRight,
  User,
  Sparkles,
  Edit3,
  Layers,
  FileText,
  Clock,
  Send,
  Package,
} from 'lucide-react';

interface SampleCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  sample: SampleItem | null;
  allSamples?: SampleItem[];
  currentUser?: AppUser;
  onSaveCard: (
    sampleId: string | null,
    cardData: SampleCardData,
    saveAsParcel: boolean,
    targetStage?: 'approval_comments' | 'ready_for_parcel'
  ) => void;
  isManualMode?: boolean;
}

export const SampleCardModal: React.FC<SampleCardModalProps> = ({
  isOpen,
  onClose,
  sample,
  allSamples = [],
  currentUser,
  onSaveCard,
  isManualMode = false,
}) => {
  // Selected sample for manual mode
  const [selectedSampleId, setSelectedSampleId] = useState<string>(sample?.id || '');
  
  // Card form state
  const [card, setCard] = useState<SampleCardData>(() => createDefaultSampleCardData(sample || undefined));

  // Layout mode: '4up' (2x2 grid, exact match to user attachment) or 'single' (1 card tag)
  const [layoutMode, setLayoutMode] = useState<'4up' | 'single'>('4up');

  // View tab: 'preview' (printable view with inline editing) or 'form' (structured inputs)
  const [activeTab, setActiveTab] = useState<'preview' | 'form'>('preview');

  // Inline editing in preview mode
  const [isInlineEditingEnabled, setIsInlineEditingEnabled] = useState(true);

  // Calendar Follow-up State
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [selectedFollowUpDate, setSelectedFollowUpDate] = useState<string>(() => {
    return (
      sample?.parcelDetails?.followUp?.followUpDate ||
      new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
    );
  });
  const [assignedUser, setAssignedUser] = useState<string>(() => {
    return (
      sample?.parcelDetails?.followUp?.assignedUser ||
      currentUser?.username ||
      'tohidul'
    );
  });
  const [followUpTime, setFollowUpTime] = useState<string>('14:00');
  const [followUpNotes, setFollowUpNotes] = useState<string>('');

  // Parcel delivery fields
  const [courier, setCourier] = useState<string>(sample?.parcelDetails?.courier || 'DHL Express');
  const [trackingNumber, setTrackingNumber] = useState<string>(sample?.parcelDetails?.trackingNumber || '');
  const [dispatchStatus, setDispatchStatus] = useState<'pending' | 'dispatched' | 'delivered'>(
    sample?.parcelDetails?.dispatchStatus || 'dispatched'
  );
  const [workbookSent, setWorkbookSent] = useState<boolean>(sample?.parcelDetails?.workbookSent ?? true);

  // Notification success state
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Synchronize card data when sample changes or user selects another sample
  useEffect(() => {
    if (isOpen) {
      const activeSample = sample || allSamples.find((s) => s.id === selectedSampleId);
      if (activeSample) {
        const initial = createDefaultSampleCardData(activeSample);
        setCard(initial);
        setSelectedFollowUpDate(
          activeSample.parcelDetails?.followUp?.followUpDate ||
            initial.followUpDate ||
            new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
        );
        setAssignedUser(
          activeSample.parcelDetails?.followUp?.assignedUser ||
            currentUser?.username ||
            'tohidul'
        );
        setCourier(activeSample.parcelDetails?.courier || 'DHL Express');
        setTrackingNumber(activeSample.parcelDetails?.trackingNumber || '');
        setDispatchStatus(activeSample.parcelDetails?.dispatchStatus || 'dispatched');
        setWorkbookSent(activeSample.parcelDetails?.workbookSent ?? true);
      } else if (isManualMode && !sample) {
        setCard(createDefaultSampleCardData(undefined));
      }
      setSaveSuccessMessage(null);
    }
  }, [isOpen, sample, selectedSampleId, isManualMode]);

  // Update card field
  const updateCardField = <K extends keyof SampleCardData>(field: K, value: SampleCardData[K]) => {
    setCard((prev) => ({ ...prev, [field]: value }));
  };

  // Calendar days generation
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: Array<{ dateStr: string; dayNum: number; isCurrentMonth: boolean }> = [];

    // Prev month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevDate = new Date(year, month - 1, d);
      days.push({
        dateStr: prevDate.toISOString().split('T')[0],
        dayNum: d,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const curDate = new Date(year, month, d);
      days.push({
        dateStr: curDate.toISOString().split('T')[0],
        dayNum: d,
        isCurrentMonth: true,
      });
    }

    // Next month padding to fill 35 or 42 cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      days.push({
        dateStr: nextDate.toISOString().split('T')[0],
        dayNum: d,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [calendarMonth]);

  const handlePrevMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
  };

  const handleQuickDateSelect = (daysFromNow: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysFromNow);
    const dateStr = target.toISOString().split('T')[0];
    setSelectedFollowUpDate(dateStr);
    setCalendarMonth(new Date(target.getFullYear(), target.getMonth(), 1));
  };

  // Save handler
  const handleSave = (saveAsParcel: boolean) => {
    const finalCard: SampleCardData = {
      ...card,
      followUpDate: selectedFollowUpDate,
      assignedUser,
      courier,
      trackingNumber,
      isDispatched: saveAsParcel,
      updatedAt: new Date().toISOString(),
    };

    const targetStage = saveAsParcel ? 'approval_comments' : 'ready_for_parcel';
    const targetSampleId = sample?.id || selectedSampleId || null;

    onSaveCard(targetSampleId, finalCard, saveAsParcel, targetStage);

    setSaveSuccessMessage(
      saveAsParcel
        ? `✅ Card saved as Parcel & advanced to Approvals & Follow-up (Assigned to ${assignedUser.toUpperCase()}).`
        : `✅ Sample Card saved successfully.`
    );

    setTimeout(() => {
      setSaveSuccessMessage(null);
    }, 3500);
  };

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  // Single Card Component (Pixel-perfect replica of image.png)
  const renderSingleCard = (keyPrefix: string = 'card') => {
    const formatSplitLines = (text: string) => {
      return text.split('\n').map((line, idx) => (
        <span key={idx} className="block leading-tight">
          {line}
        </span>
      ));
    };

    return (
      <div
        key={keyPrefix}
        className="sample-card-item bg-white text-black font-sans text-[11px] leading-tight select-text w-full max-w-[380px] sm:max-w-[420px] mx-auto border-2 border-[#0000cc] shadow-md print:shadow-none print:max-w-none print:w-full"
        style={{
          borderColor: '#0000cc',
          boxSizing: 'border-box',
        }}
      >
        <table className="w-full border-collapse text-[11px] table-fixed">
          <tbody>
            {/* Row 1: Date Send */}
            <tr className="border-b border-[#0000cc]">
              <td className="w-[43%] border-r border-[#0000cc] px-2 py-1.5 font-normal text-black align-middle">
                Date Send :
              </td>
              <td className="w-[57%] px-2 py-1.5 text-center font-bold text-black align-middle">
                {isInlineEditingEnabled ? (
                  <input
                    type="text"
                    value={card.dateSend}
                    onChange={(e) => updateCardField('dateSend', e.target.value)}
                    className="w-full text-center font-bold bg-amber-50/50 print:bg-transparent border-none focus:outline-none focus:bg-amber-100"
                  />
                ) : (
                  <span>{card.dateSend || '1-Oct-26'}</span>
                )}
              </td>
            </tr>

            {/* Row 2: Style No */}
            <tr className="border-b border-[#0000cc]">
              <td className="border-r border-[#0000cc] px-2 py-1.5 font-normal text-black align-middle">
                Style No:
              </td>
              <td className="px-2 py-1.5 text-center font-bold text-black uppercase align-middle">
                {isInlineEditingEnabled ? (
                  <input
                    type="text"
                    value={card.styleNo}
                    onChange={(e) => updateCardField('styleNo', e.target.value.toUpperCase())}
                    className="w-full text-center font-bold uppercase bg-amber-50/50 print:bg-transparent border-none focus:outline-none focus:bg-amber-100"
                  />
                ) : (
                  <span>{card.styleNo || 'JCS27DN023'}</span>
                )}
              </td>
            </tr>

            {/* Row 3: Design No */}
            <tr className="border-b border-[#0000cc]">
              <td className="border-r border-[#0000cc] px-2 py-1.5 font-normal text-black align-middle">
                Design No:
              </td>
              <td className="px-2 py-1.5 text-center font-bold text-black uppercase align-middle">
                {isInlineEditingEnabled ? (
                  <input
                    type="text"
                    value={card.designNo}
                    onChange={(e) => updateCardField('designNo', e.target.value.toUpperCase())}
                    className="w-full text-center font-bold uppercase bg-amber-50/50 print:bg-transparent border-none focus:outline-none focus:bg-amber-100"
                  />
                ) : (
                  <span>{card.designNo || 'POCKET FRONT CROP'}</span>
                )}
              </td>
            </tr>

            {/* Row 4: Line Code */}
            <tr className="border-b border-[#0000cc]">
              <td className="border-r border-[#0000cc] px-2 py-1.5 font-normal text-black align-middle">
                Line Code
              </td>
              <td className="px-2 py-1.5 text-center font-bold text-black align-middle">
                {isInlineEditingEnabled ? (
                  <div className="space-y-0.5">
                    <input
                      type="text"
                      value={card.color ? `Color-${card.color}` : 'Color-MID WASH'}
                      onChange={(e) => {
                        const val = e.target.value.replace(/^Color-/, '');
                        updateCardField('color', val);
                      }}
                      className="w-full text-center font-bold bg-amber-50/50 print:bg-transparent border-none focus:outline-none focus:bg-amber-100 text-[11px]"
                    />
                    <input
                      type="text"
                      value={card.lineCode ? `LINE CODE : ${card.lineCode}` : 'LINE CODE : F351287'}
                      onChange={(e) => {
                        const val = e.target.value.replace(/^LINE CODE\s*:\s*/, '');
                        updateCardField('lineCode', val);
                      }}
                      className="w-full text-center font-bold bg-amber-50/50 print:bg-transparent border-none focus:outline-none focus:bg-amber-100 text-[11px]"
                    />
                  </div>
                ) : (
                  <div>
                    <div className="leading-tight">Color-{card.color || 'MID WASH'}</div>
                    <div className="leading-tight">LINE CODE : {card.lineCode || 'F351287'}</div>
                  </div>
                )}
              </td>
            </tr>

            {/* Row 5: Department */}
            <tr className="border-b border-[#0000cc]">
              <td className="border-r border-[#0000cc] px-2 py-1.5 font-normal text-black align-middle">
                Department:
              </td>
              <td className="px-2 py-1.5 text-center font-bold text-black align-middle">
                {isInlineEditingEnabled ? (
                  <input
                    type="text"
                    value={card.department}
                    onChange={(e) => updateCardField('department', e.target.value)}
                    className="w-full text-center font-bold bg-amber-50/50 print:bg-transparent border-none focus:outline-none focus:bg-amber-100"
                  />
                ) : (
                  <span>{card.department || 'Ladies'}</span>
                )}
              </td>
            </tr>

            {/* Row 6: Season / Size */}
            <tr className="border-b border-[#0000cc]">
              <td className="border-r border-[#0000cc] px-2 py-1.5 font-normal text-black align-middle">
                Season:
              </td>
              <td className="px-2 py-1.5 text-center font-bold text-black align-middle">
                {isInlineEditingEnabled ? (
                  <input
                    type="text"
                    value={card.season}
                    onChange={(e) => updateCardField('season', e.target.value)}
                    className="w-full text-center font-bold bg-amber-50/50 print:bg-transparent border-none focus:outline-none focus:bg-amber-100"
                  />
                ) : (
                  <span>{card.season || 'Size -12'}</span>
                )}
              </td>
            </tr>

            {/* Row 7: Fabric Details Weight */}
            <tr className="border-b border-[#0000cc]">
              <td className="border-r border-[#0000cc] px-2 py-1.5 font-normal text-black align-middle">
                Fabric Details Weight
              </td>
              <td className="px-2 py-1.5 text-center font-bold text-black align-middle">
                {isInlineEditingEnabled ? (
                  <input
                    type="text"
                    value={card.fabricDetails}
                    onChange={(e) => updateCardField('fabricDetails', e.target.value)}
                    className="w-full text-center font-bold bg-amber-50/50 print:bg-transparent border-none focus:outline-none focus:bg-amber-100"
                  />
                ) : (
                  <span>{card.fabricDetails || '99.5% C 0.5% Sp'}</span>
                )}
              </td>
            </tr>

            {/* Row 8: AW: GSM OZ */}
            <tr className="border-b border-[#0000cc]">
              <td className="border-r border-[#0000cc] px-2 py-1.5 text-transparent select-none align-middle">
                &nbsp;
              </td>
              <td className="px-2 py-1.5 text-center font-bold text-black align-middle">
                {isInlineEditingEnabled ? (
                  <input
                    type="text"
                    value={card.fabricWeightGsm}
                    onChange={(e) => updateCardField('fabricWeightGsm', e.target.value)}
                    className="w-full text-center font-bold bg-amber-50/50 print:bg-transparent border-none focus:outline-none focus:bg-amber-100"
                  />
                ) : (
                  <span>{card.fabricWeightGsm || 'AW: 260 GSM OZ(+/-)'}</span>
                )}
              </td>
            </tr>

            {/* Row 9: Supplier */}
            <tr className="border-b border-[#0000cc]">
              <td className="border-r border-[#0000cc] px-2 py-1.5 font-normal text-black align-middle">
                Supplier:
              </td>
              <td className="px-2 py-1.5 text-center font-bold text-black align-middle">
                {isInlineEditingEnabled ? (
                  <input
                    type="text"
                    value={card.supplier}
                    onChange={(e) => updateCardField('supplier', e.target.value)}
                    className="w-full text-center font-bold bg-amber-50/50 print:bg-transparent border-none focus:outline-none focus:bg-amber-100"
                  />
                ) : (
                  <span>{card.supplier || 'Grand Apparels Designs'}</span>
                )}
              </td>
            </tr>

            {/* Row 10: Factory (HIGHLIGHTED WITH BRIGHT SOLID YELLOW AS IN IMAGE) */}
            <tr className="border-b border-[#0000cc]">
              <td className="border-r border-[#0000cc] px-2 py-1.5 font-normal text-black align-middle">
                Factory:
              </td>
              <td
                className="px-2 py-1.5 text-center font-bold text-black align-middle"
                style={{
                  backgroundColor: '#ffff00',
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact',
                }}
              >
                {isInlineEditingEnabled ? (
                  <textarea
                    rows={2}
                    value={card.sampleTypeApproval}
                    onChange={(e) => updateCardField('sampleTypeApproval', e.target.value)}
                    className="w-full text-center font-bold bg-transparent border-none focus:outline-none leading-tight resize-none text-[11px]"
                  />
                ) : (
                  <div className="font-bold leading-tight">
                    {formatSplitLines(card.sampleTypeApproval || 'Red Seal + Wash\nApproval Sample')}
                  </div>
                )}
              </td>
            </tr>

            {/* Row 11: Technologist */}
            <tr className="border-b border-[#0000cc]">
              <td className="border-r border-[#0000cc] px-2 py-1.5 font-normal text-black align-middle">
                Technologist:
              </td>
              <td className="px-2 py-1.5 text-center font-bold text-black align-middle min-h-[24px]">
                {isInlineEditingEnabled ? (
                  <input
                    type="text"
                    value={card.technologist}
                    onChange={(e) => updateCardField('technologist', e.target.value)}
                    placeholder="(Optional)"
                    className="w-full text-center font-bold bg-amber-50/50 print:bg-transparent border-none focus:outline-none focus:bg-amber-100"
                  />
                ) : (
                  <span>{card.technologist || ''}</span>
                )}
              </td>
            </tr>

            {/* Row 12: Buyer */}
            <tr className="border-b border-[#0000cc]">
              <td className="border-r border-[#0000cc] px-2 py-1.5 font-normal text-black align-middle">
                Buyer:
              </td>
              <td className="px-2 py-1.5 text-center font-bold text-black align-middle min-h-[24px]">
                {isInlineEditingEnabled ? (
                  <input
                    type="text"
                    value={card.buyer}
                    onChange={(e) => updateCardField('buyer', e.target.value)}
                    placeholder="(Buyer name)"
                    className="w-full text-center font-bold bg-amber-50/50 print:bg-transparent border-none focus:outline-none focus:bg-amber-100"
                  />
                ) : (
                  <span>{card.buyer || ''}</span>
                )}
              </td>
            </tr>

            {/* Row 13: Approval Date */}
            <tr>
              <td className="border-r border-[#0000cc] px-2 py-1.5 font-normal text-black align-middle">
                Approval Date:
              </td>
              <td className="px-2 py-1.5 text-center font-bold text-black align-middle min-h-[24px]">
                {isInlineEditingEnabled ? (
                  <input
                    type="text"
                    value={card.approvalDate}
                    onChange={(e) => updateCardField('approvalDate', e.target.value)}
                    placeholder="(DD-MMM-YY)"
                    className="w-full text-center font-bold bg-amber-50/50 print:bg-transparent border-none focus:outline-none focus:bg-amber-100"
                  />
                ) : (
                  <span>{card.approvalDate || ''}</span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[96vh] overflow-hidden text-slate-200">
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <span>Sample Parcel Card / Garment Tag</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">
                    Exact Image Copy
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                {isManualMode
                  ? 'Manual Requisition Card Maker • Build, print 4-up cards, and save as parcel for Approvals'
                  : `Sample Card for Style ${card.styleNo || 'Sample'} • Ready for print, parcel dispatch & follow-up`}
              </p>
            </div>
          </div>

          {/* Action buttons on header */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              title="Print Sample Cards"
            >
              <Printer className="w-4 h-4" />
              <span>Print Card</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              title="Save as Parcel and stay for Approval & Follow-up"
            >
              <Package className="w-4 h-4" />
              <span>Save as Parcel & Stay for Approval</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {saveSuccessMessage && (
          <div className="px-5 py-2.5 bg-emerald-500/20 border-b border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{saveSuccessMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setSaveSuccessMessage(null)}
              className="text-emerald-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* Navigation Tabs & Controls Bar */}
        <div className="px-5 py-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'preview'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Preview Mode (Editable)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'form'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Structured Form & Specs</span>
            </button>
          </div>

          {/* If in preview mode: Layout 4-Up vs Single & Inline edit toggle */}
          {activeTab === 'preview' && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
                <button
                  type="button"
                  onClick={() => setLayoutMode('4up')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    layoutMode === '4up'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="4 Cards per sheet (2x2 grid) - Exact replica of attachment"
                >
                  4-Cards Sheet (2x2)
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('single')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    layoutMode === 'single'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Single Card Tag"
                >
                  Single Card Tag
                </button>
              </div>

              <label className="flex items-center gap-1.5 text-[11px] text-slate-300 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={isInlineEditingEnabled}
                  onChange={(e) => setIsInlineEditingEnabled(e.target.checked)}
                  className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                />
                <span>Enable Inline Editing on Print Sheet</span>
              </label>
            </div>
          )}

          {/* Manual sample selector if manual mode */}
          {isManualMode && allSamples.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Load from Requisition:</span>
              <select
                value={selectedSampleId}
                onChange={(e) => setSelectedSampleId(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              >
                <option value="">-- Choose Existing Requisition Style --</option>
                {allSamples.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.styleCode} - {s.styleName} ({s.buyer})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Main Body Area: 2-column or full layout */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (or full width): The Printable Sheet */}
          <div className={activeTab === 'preview' ? 'lg:col-span-8' : 'lg:col-span-7'}>
            {activeTab === 'preview' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                  <span>
                    Printable Sheet Preview ({layoutMode === '4up' ? '4 Cards Grid - 2x2' : 'Single Card'})
                  </span>
                  <span className="text-emerald-400 font-semibold">
                    Yellow Factory cell highlight & blue borders are preserved in print.
                  </span>
                </div>

                {/* Printable container stage */}
                <div
                  id="sample-card-print-stage"
                  className="bg-slate-950 p-4 sm:p-6 rounded-2xl border border-slate-800 overflow-x-auto flex justify-center"
                >
                  <div
                    id="printable-sample-card-sheet"
                    className="bg-white p-4 sm:p-6 text-black select-text shadow-2xl relative"
                    style={{
                      width: layoutMode === '4up' ? '100%' : 'auto',
                      maxWidth: layoutMode === '4up' ? '820px' : '440px',
                      minHeight: layoutMode === '4up' ? '840px' : 'auto',
                    }}
                  >
                    {layoutMode === '4up' ? (
                      /* 4-UP 2x2 GRID MATCHING EXACT ATTACHMENT WITH CENTER CROSS & PAGE 1 WATERMARK */
                      <div className="relative border-2 border-black">
                        {/* Faint Center Watermark 'Page 1' */}
                        <div
                          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10"
                          style={{ opacity: 0.28 }}
                        >
                          <span className="text-7xl font-bold font-sans text-slate-700 tracking-wider">
                            Page 1
                          </span>
                        </div>

                        {/* 2x2 Quadrant Grid */}
                        <div className="grid grid-cols-2">
                          {/* Top-Left: Card 1 */}
                          <div className="border-r-2 border-b-2 border-black p-2">
                            {renderSingleCard('q1')}
                          </div>
                          {/* Top-Right: Card 2 */}
                          <div className="border-b-2 border-black p-2">
                            {renderSingleCard('q2')}
                          </div>
                          {/* Bottom-Left: Card 3 */}
                          <div className="border-r-2 border-black p-2">
                            {renderSingleCard('q3')}
                          </div>
                          {/* Bottom-Right: Card 4 */}
                          <div className="p-2">
                            {renderSingleCard('q4')}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Single Card */
                      <div className="p-2">{renderSingleCard('single')}</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Structured Form Edit Tab */
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Edit3 className="w-4 h-4 text-blue-400" />
                  <span>Card Specification Fields</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Date Send</label>
                    <input
                      type="text"
                      value={card.dateSend}
                      onChange={(e) => updateCardField('dateSend', e.target.value)}
                      placeholder="e.g. 1-Oct-26"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Style No</label>
                    <input
                      type="text"
                      value={card.styleNo}
                      onChange={(e) => updateCardField('styleNo', e.target.value.toUpperCase())}
                      placeholder="e.g. JCS27DN023"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Design No</label>
                    <input
                      type="text"
                      value={card.designNo}
                      onChange={(e) => updateCardField('designNo', e.target.value.toUpperCase())}
                      placeholder="e.g. POCKET FRONT CROP"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Color / Wash</label>
                    <input
                      type="text"
                      value={card.color}
                      onChange={(e) => updateCardField('color', e.target.value)}
                      placeholder="e.g. MID WASH"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Line Code</label>
                    <input
                      type="text"
                      value={card.lineCode}
                      onChange={(e) => updateCardField('lineCode', e.target.value)}
                      placeholder="e.g. F351287"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Department</label>
                    <input
                      type="text"
                      value={card.department}
                      onChange={(e) => updateCardField('department', e.target.value)}
                      placeholder="e.g. Ladies"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Season / Size</label>
                    <input
                      type="text"
                      value={card.season}
                      onChange={(e) => updateCardField('season', e.target.value)}
                      placeholder="e.g. Size -12"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Fabric Details Weight</label>
                    <input
                      type="text"
                      value={card.fabricDetails}
                      onChange={(e) => updateCardField('fabricDetails', e.target.value)}
                      placeholder="e.g. 99.5% C 0.5% Sp"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">AW GSM OZ Weight</label>
                    <input
                      type="text"
                      value={card.fabricWeightGsm}
                      onChange={(e) => updateCardField('fabricWeightGsm', e.target.value)}
                      placeholder="e.g. AW: 260 GSM OZ(+/-)"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Supplier</label>
                    <input
                      type="text"
                      value={card.supplier}
                      onChange={(e) => updateCardField('supplier', e.target.value)}
                      placeholder="e.g. Grand Apparels Designs"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-amber-400 font-semibold mb-1 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
                      <span>Factory Approval Stamp (Yellow Highlighted Cell)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={card.sampleTypeApproval}
                      onChange={(e) => updateCardField('sampleTypeApproval', e.target.value)}
                      placeholder="e.g. Red Seal + Wash&#10;Approval Sample"
                      className="w-full bg-slate-900 border border-amber-500/50 rounded-lg px-3 py-2 text-yellow-300 font-bold font-mono text-xs leading-snug"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Technologist</label>
                    <input
                      type="text"
                      value={card.technologist}
                      onChange={(e) => updateCardField('technologist', e.target.value)}
                      placeholder="e.g. Technologist name"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Buyer</label>
                    <input
                      type="text"
                      value={card.buyer}
                      onChange={(e) => updateCardField('buyer', e.target.value)}
                      placeholder="e.g. Grand Apparels"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 font-semibold mb-1">Approval Date</label>
                    <input
                      type="text"
                      value={card.approvalDate}
                      onChange={(e) => updateCardField('approvalDate', e.target.value)}
                      placeholder="e.g. 15-Oct-26"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Parcel Dispatch Details & Integrated Follow-Up Calendar */}
          <div className={activeTab === 'preview' ? 'lg:col-span-4' : 'lg:col-span-5'}>
            <div className="space-y-4">
              {/* Box 1: Save as Parcel & Courier info */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="font-bold text-xs uppercase text-white flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Parcel Dispatch & Status</span>
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                    Step 5 & 6
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Courier Partner</label>
                    <input
                      type="text"
                      value={courier}
                      onChange={(e) => setCourier(e.target.value)}
                      placeholder="DHL Express, FedEx, UPS..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Airway Bill / Tracking AWB#</label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="AWB Tracking Number..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>

                  <div className="pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-300">
                      <input
                        type="checkbox"
                        checked={workbookSent}
                        onChange={(e) => setWorkbookSent(e.target.checked)}
                        className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Workbook Sent to Buyer Merchandiser</span>
                    </label>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => handleSave(true)}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Package className="w-4 h-4" />
                    <span>Save as Parcel & Stay for Approval</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSave(false)}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Card Specs Only</span>
                  </button>
                </div>
              </div>

              {/* Box 2: Integrated Calendar & User-Specific Red Notification */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950/40 border border-rose-500/30 space-y-3">
                <div className="flex items-center justify-between border-b border-rose-500/20 pb-2">
                  <h4 className="font-bold text-xs uppercase text-rose-300 flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-rose-400" />
                    <span>Integrated Follow-up Calendar</span>
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold animate-pulse">
                    Red Alert for User
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-snug">
                  Select a specific follow-up date. The system will give a prominent{' '}
                  <strong className="text-rose-400">RED notification for this user only</strong> when the date arrives.
                </p>

                {/* Target User Selector */}
                <div>
                  <label className="block text-[11px] text-rose-300 font-semibold mb-1 flex items-center gap-1">
                    <User className="w-3 h-3 text-rose-400" />
                    <span>Follow-Up Assigned User (Receives Red Notification):</span>
                  </label>
                  <select
                    value={assignedUser}
                    onChange={(e) => setAssignedUser(e.target.value)}
                    className="w-full bg-slate-950 border border-rose-500/50 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none focus:ring-1 focus:ring-rose-500"
                  >
                    {SYSTEM_USERS.map((u) => (
                      <option key={u.id} value={u.username}>
                        {u.displayName} ({u.role.toUpperCase()}) — @{u.username}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quick Date Shortcuts */}
                <div className="flex flex-wrap items-center gap-1 text-[10px]">
                  <span className="text-slate-500 mr-1">Quick:</span>
                  <button
                    type="button"
                    onClick={() => handleQuickDateSelect(1)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDateSelect(2)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    In 2 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDateSelect(3)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    In 3 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDateSelect(7)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    In 1 Week
                  </button>
                </div>

                {/* Interactive Visual Calendar Grid */}
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between pb-2 mb-1 border-b border-slate-800 text-xs">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold text-white">
                      {calendarMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Day of Week Headers */}
                  <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-500 mb-1">
                    <span>Su</span>
                    <span>Mo</span>
                    <span>Tu</span>
                    <span>We</span>
                    <span>Th</span>
                    <span>Fr</span>
                    <span>Sa</span>
                  </div>

                  {/* Days */}
                  <div className="grid grid-cols-7 gap-1 text-[11px] text-center">
                    {calendarDays.map((d, idx) => {
                      const isSelected = d.dateStr === selectedFollowUpDate;
                      const isToday = d.dateStr === new Date().toISOString().split('T')[0];
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedFollowUpDate(d.dateStr)}
                          className={`h-7 rounded-lg font-mono flex items-center justify-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-rose-600 text-white font-black shadow-md shadow-rose-600/40 ring-1 ring-rose-400'
                              : isToday
                              ? 'bg-slate-800 text-amber-300 font-bold border border-amber-500/40'
                              : d.isCurrentMonth
                              ? 'text-slate-300 hover:bg-slate-800'
                              : 'text-slate-600 hover:bg-slate-800/50'
                          }`}
                        >
                          {d.dayNum}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Date Summary & Time */}
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Selected Follow-Up Date:</span>
                    <strong className="text-rose-400 font-mono text-sm">{selectedFollowUpDate}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Notification Time:</span>
                    <input
                      type="time"
                      value={followUpTime}
                      onChange={(e) => setFollowUpTime(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-white font-mono text-center"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
