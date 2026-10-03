export type SampleStage = 
  | 'requisition' 
  | 'sewing' 
  | 'wash' 
  | 'finishing' 
  | 'ready_for_parcel' 
  | 'approval_comments';

export type SamplePriority = 'urgent' | 'high' | 'normal';

export type SampleType = 
  | 'Initial Sample'
  | 'Red Seal Sample' 
  | 'Gold Seal Sample'
  | 'Proto Sample' 
  | 'Fit Sample' 
  | 'Salesman Sample (SMS)' 
  | 'TOP Sample' 
  | 'Pre-Production (PP)'
  | string;

export type ApprovalStatus = 'pending' | 'approved' | 'revision_requested' | 'rejected';

export interface StageHistoryEntry {
  stage: SampleStage;
  timestamp: string;
  note: string;
  operator?: string;
}

export interface WashDetails {
  washType: string; // e.g. Enzyme Bio-Wash, Bleach Stone Wash, Tinted Rinse
  washTechnician: string;
  washFormula: string;
  startedAt?: string;
  completedAt?: string;
  targetCompletion?: string;
  washNotes?: string;
}

export interface FinishingDetails {
  finishingLine: string;
  supervisor: string;
  ironingDone: boolean;
  threadTrimmingDone: boolean;
  taggingDone: boolean;
  qualityPassed: boolean;
  completedAt?: string;
  notes?: string;
}

export interface FollowUpDetails {
  followUpDate: string; // YYYY-MM-DD
  followUpTime?: string;
  notes?: string;
  status: 'pending' | 'completed' | 'scheduled';
  whatsAppNumber: string; // e.g. "+1 (555) 234-5678" or "+8801712345678"
  assignedUser?: string; // Target username who receives the RED notification only!
  lastNotifiedAt?: string;
}

export interface SampleCardData {
  id?: string;
  sampleId?: string;
  dateSend: string; // e.g. "1-Oct-26"
  styleNo: string; // e.g. "JCS27DN023"
  designNo: string; // e.g. "POCKET FRONT CROP"
  lineCode: string; // e.g. "F351287"
  color: string; // e.g. "MID WASH"
  department: string; // e.g. "Ladies"
  season: string; // e.g. "Size -12" or "SS26"
  size: string; // e.g. "12"
  fabricDetails: string; // e.g. "99.5% C 0.5% Sp"
  fabricWeightGsm: string; // e.g. "AW: 260 GSM OZ(+/-)"
  supplier: string; // e.g. "Grand Apparels Designs"
  factory: string; // e.g. "Volar Fashion / Unit 1"
  sampleTypeApproval: string; // e.g. "Red Seal + Wash\nApproval Sample"
  technologist: string; // e.g. "Zahid Anwar" or blank
  buyer: string; // e.g. "Grand Apparels" or blank
  approvalDate: string; // e.g. "15-Oct-26" or blank
  followUpDate?: string; // Specific date for follow-up
  assignedUser?: string; // User who receives notification
  isDispatched?: boolean;
  courier?: string;
  trackingNumber?: string;
  notes?: string;
  updatedAt?: string;
}

export interface ParcelDetails {
  courier: string; // e.g. DHL Express, FedEx, UPS
  trackingNumber: string;
  parcelDate: string;
  recipient: string;
  destinationCountry: string;
  dispatchStatus: 'pending' | 'dispatched' | 'delivered';
  parcelNotes?: string;
  workbookSent: boolean; // Workbook Sent or not confirmation option
  workbookSentDate?: string;
  workbookSentBy?: string;
  workbookNotes?: string;
  followUp?: FollowUpDetails;
  sampleCard?: SampleCardData;
}

export function isParcelCompleted(sample: SampleItem): boolean {
  return (
    sample.parcelDetails.dispatchStatus === 'dispatched' ||
    sample.parcelDetails.dispatchStatus === 'delivered' ||
    sample.stage === 'ready_for_parcel' ||
    sample.stage === 'approval_comments'
  );
}

export function formatSampleCardDate(d?: Date | string): string {
  const dateObj = d ? new Date(d) : new Date();
  if (isNaN(dateObj.getTime())) return typeof d === 'string' ? d : '';
  const day = dateObj.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[dateObj.getMonth()];
  const year = String(dateObj.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

export function createDefaultSampleCardData(sample?: Partial<SampleItem>): SampleCardData {
  if (!sample) {
    return {
      dateSend: formatSampleCardDate(new Date()),
      styleNo: '',
      designNo: '',
      lineCode: '',
      color: '',
      department: 'Ladies',
      season: 'Size -12',
      size: '12',
      fabricDetails: '99.5% C 0.5% Sp',
      fabricWeightGsm: 'AW: 260 GSM OZ(+/-)',
      supplier: 'Grand Apparels Designs',
      factory: 'Volar Fashion Ltd.',
      sampleTypeApproval: 'Red Seal + Wash\nApproval Sample',
      technologist: '',
      buyer: '',
      approvalDate: '',
      followUpDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      assignedUser: '',
    };
  }

  const existingCard = sample.parcelDetails?.sampleCard;
  if (existingCard) {
    return { ...existingCard };
  }

  const primaryColor = sample.color || (sample.colorBreakdown && sample.colorBreakdown[0]?.color) || 'MID WASH';
  const primarySize = sample.size || (sample.sizeBreakdown && sample.sizeBreakdown[0]?.size) || '12';
  const sizeFormatted = primarySize.toLowerCase().startsWith('size') ? primarySize : `Size -${primarySize}`;

  const cleanSampleType = sample.sampleType || 'Red Seal';
  const factoryApprovalText = cleanSampleType.toLowerCase().includes('wash')
    ? `${cleanSampleType}\nApproval Sample`
    : `${cleanSampleType} + Wash\nApproval Sample`;

  return {
    sampleId: sample.id,
    dateSend: formatSampleCardDate(sample.parcelDetails?.parcelDate || sample.updatedAt || new Date()),
    styleNo: sample.styleCode || '',
    designNo: sample.styleName || '',
    lineCode: sample.lineCode || '',
    color: primaryColor,
    department: 'Ladies',
    season: sizeFormatted,
    size: primarySize,
    fabricDetails: sample.fabricName || sample.fabricCode || '99.5% C 0.5% Sp',
    fabricWeightGsm: 'AW: 260 GSM OZ(+/-)',
    supplier: 'Grand Apparels Designs',
    factory: 'Volar Fashion Ltd.',
    sampleTypeApproval: factoryApprovalText,
    technologist: sample.requisitionForm?.requestedBy || '',
    buyer: sample.buyer || '',
    approvalDate: sample.targetParcelDate ? formatSampleCardDate(sample.targetParcelDate) : '',
    followUpDate: sample.parcelDetails?.followUp?.followUpDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    assignedUser: sample.parcelDetails?.followUp?.assignedUser || '',
    courier: sample.parcelDetails?.courier || 'DHL Express',
    trackingNumber: sample.parcelDetails?.trackingNumber || '',
  };
}

export function generateWhatsAppFollowUpLink(sample: SampleItem, phone: string, customMessage?: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const p = sample.parcelDetails;
  const wbStatus = p.workbookSent ? `✅ Sent on ${p.workbookSentDate || 'dispatch'}` : `⚠️ Pending / Not Sent`;
  const defaultText = `*GA SAMPLE TRACKING - PARCEL FOLLOW-UP NOTIFICATION*\nStyle: *${sample.styleName}* (${sample.styleCode})\nBuyer: *${sample.buyer}* | PO: ${sample.poNumber}\nCourier: ${p.courier || 'DHL Express'}\nAirway Bill (AWB): ${p.trackingNumber || 'Pending'}\nParcel Dispatch Date: ${p.parcelDate}\nWorkbook Sent Status: ${wbStatus}\n\n*Follow-up Notice:* Dear Team, the sample parcel for style *${sample.styleName}* has been sent. Please confirm parcel delivery receipt and share your remarks for wash, trims, and accessories.`;
  const textToUse = customMessage || defaultText;
  return cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(textToUse)}` : `https://wa.me/?text=${encodeURIComponent(textToUse)}`;
}

export type ApprovableComponentKey = 'wash' | 'thread' | 'zipper' | 'button';

export interface ComponentApprovalProof {
  approved: boolean;
  note: string;
  attachmentUrl: string;
  attachmentName?: string;
  attachmentType?: 'pdf' | 'image';
  approvedBy?: string;
  approvedAt?: string;
}

export interface ApprovalDetails {
  washComments: string;
  washApproved: boolean;
  washApprovalNote?: string;
  washApprovalAttachment?: string;
  washApprovalAttachmentName?: string;
  washApprovalAttachmentType?: 'pdf' | 'image';
  washApprovedBy?: string;
  washApprovedAt?: string;

  threadApproved?: boolean;
  threadApprovalNote?: string;
  threadApprovalAttachment?: string;
  threadApprovalAttachmentName?: string;
  threadApprovalAttachmentType?: 'pdf' | 'image';
  threadApprovedBy?: string;
  threadApprovedAt?: string;

  zipperApproved?: boolean;
  zipperApprovalNote?: string;
  zipperApprovalAttachment?: string;
  zipperApprovalAttachmentName?: string;
  zipperApprovalAttachmentType?: 'pdf' | 'image';
  zipperApprovedBy?: string;
  zipperApprovedAt?: string;

  buttonApproved?: boolean;
  buttonApprovalNote?: string;
  buttonApprovalAttachment?: string;
  buttonApprovalAttachmentName?: string;
  buttonApprovalAttachmentType?: 'pdf' | 'image';
  buttonApprovedBy?: string;
  buttonApprovedAt?: string;

  trimsComments: string;
  trimsApproved: boolean;
  accessoriesComments: string;
  accessoriesApproved: boolean;
  labelApproved?: boolean;
  componentApprovals?: Partial<Record<ApprovableComponentKey, ComponentApprovalProof>>;
  overallVerdict: ApprovalStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  generalRemarks?: string;
}

export interface TrimsChecklist {
  mainLabel: boolean;
  sizeLabel: boolean;
  careOrigin: boolean;
  button: boolean;
  buttonNote?: string;
  buckles: boolean;
  velcro: boolean;
  rivet: boolean;
  stud: boolean;
  thread: boolean;
  threadNote?: string;
  interlining: boolean;
  elastic: boolean;
  zipper: boolean;
  zipperNote?: string;
  drawstring: boolean;
  stopperEyelet: boolean;
  snap: boolean;
  pocketing: boolean;
  pocketingNote?: string;
  customTrims?: { name: string; checked: boolean; note?: string }[];
}

export interface SizeBreakdownItem {
  size: string;
  quantity: number;
}

export interface ColorBreakdownItem {
  color: string;
  wash?: string;
  sizes?: string;
  quantity: number;
  fabricId?: string;
  fabricCode?: string;
  fabricName?: string;
  perPcsConsumptionYards?: number;
  fabricRequiredYards?: number;
}

export interface SingleRequisitionOptionItem {
  id: string;
  name: string; // e.g. 'Thread Mokab', 'Leg Panel', 'Sleeve Panel'
  quantity: number;
  note?: string;
}

export const SINGLE_REQUISITION_OPTION_PRESETS: {
  id: string;
  label: string;
  defaultNote: string;
}[] = [
  {
    id: 'thread-mokab',
    label: 'Thread Mokab',
    defaultNote: 'Thread shade & stitch mockup',
  },
  {
    id: 'leg-panel',
    label: 'Leg Panel',
    defaultNote: 'Leg wash & whisker panel',
  },
  {
    id: 'sleeve-panel',
    label: 'Sleeve Panel',
    defaultNote: 'Sleeve wash & seam panel',
  },
  {
    id: 'wash-panel',
    label: 'Wash Panel',
    defaultNote: 'Wash shade panel',
  },
  {
    id: 'pocket-mockup',
    label: 'Pocket Mockup',
    defaultNote: 'Pocket & bartack mockup',
  },
];

export const MULTI_COLOR_PACK_PRESETS: {
  id: string;
  label: string;
  count: number;
  colors: string[];
}[] = [
  {
    id: '2-color-denim',
    label: '2 Colors — Dark Indigo + Vintage Black',
    count: 2,
    colors: ['Dark Indigo', 'Vintage Black'],
  },
  {
    id: '3-color-denim-shades',
    label: '3 Colors — Light, Medium & Dark Indigo',
    count: 3,
    colors: ['Light Indigo', 'Medium Stone Indigo', 'Dark Rinse Indigo'],
  },
  {
    id: '4-color-core-pack',
    label: '4 Colors — Black, Navy, Olive & Khaki',
    count: 4,
    colors: ['Jet Black', 'Deep Navy', 'Olive Drab', 'Sand Khaki'],
  },
  {
    id: '5-color-tops-pack',
    label: '5 Colors — White, Black, Grey, Navy & Sage',
    count: 5,
    colors: ['Optic White', 'Jet Black', 'Heather Grey', 'Classic Navy', 'Sage Green'],
  },
];

export const GOLD_SEAL_SIZE_RUN_PRESETS: {
  id: string;
  label: string;
  count: number;
  sizes: string[];
}[] = [
  {
    id: '10-waist-denim',
    label: '10 Sizes — Denim/Pant Waist (28–40)',
    count: 10,
    sizes: ['28', '29', '30', '31', '32', '33', '34', '36', '38', '40'],
  },
  {
    id: '12-waist-denim',
    label: '12 Sizes — Full Denim/Pant Waist (28–44)',
    count: 12,
    sizes: ['28', '29', '30', '31', '32', '33', '34', '36', '38', '40', '42', '44'],
  },
  {
    id: '10-alpha-tops',
    label: '10 Sizes — Alpha Range (XXS–5XL)',
    count: 10,
    sizes: ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'],
  },
  {
    id: '12-alpha-tops',
    label: '12 Sizes — Full Alpha Range (3XS–6XL)',
    count: 12,
    sizes: ['3XS', 'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', '6XL'],
  },
  {
    id: '10-numeric-uk-eu',
    label: '10 Sizes — Numeric Dress/Trouser (6–24)',
    count: 10,
    sizes: ['6', '8', '10', '12', '14', '16', '18', '20', '22', '24'],
  },
  {
    id: '12-kids-youth',
    label: '12 Sizes — Kids/Youth Range (2Y–16Y)',
    count: 12,
    sizes: ['2Y', '3Y', '4Y', '5Y', '6Y', '7Y', '8Y', '9Y', '10Y', '12Y', '14Y', '16Y'],
  },
];

export interface VolarRequisitionForm {
  companyName: string;
  blNumber?: string; // Top-left BL.... box where the number of BL is written by Admin
  date: string;
  requiredDate: string;
  shipmentDate?: string;
  buyer: string;
  requestedBy: string;
  priorityType: SamplePriority;
  sampleType: string;
  descriptionCode: string;
  styleName: string;
  sampleSizeLabel: string;
  sizeBreakdown?: SizeBreakdownItem[];
  colorWash: string;
  colorBreakdown?: ColorBreakdownItem[];
  requisitionOptions?: SingleRequisitionOptionItem[]; // Additional options under single requisition (e.g. Thread Mokab, Leg Panel, Sleeve Panel)
  fabricCode: string;
  perPcsConsumptionYards?: number;
  fabricRequiredYards?: number;
  fitting: string;
  threadInstruction: string;
  threadNote?: string;
  zipperNote?: string;
  buttonNote?: string;
  quantityText: string;
  block: string;
  fabricComposition: string;
  supplier: string;
  weight: string;
  trims: TrimsChecklist;
  specialInstructions: string;
  samplingSectionNotes: string;
  receivedBy: string;
  merchandiserSignature: string;
  isLocked?: boolean;
  lockedAt?: string;
}

export interface SampleItem {
  id: string;
  blNumber?: string; // Top-left BL.... number assigned by Admin
  styleCode: string; // e.g. "ST-8820"
  styleName: string; // e.g. "Vintage Carpenter Denim Pant"
  buyer: string; // e.g. "Levi Strauss & Co."
  poNumber: string; // e.g. "PO-99412"
  lineCode: string; // e.g. "LINE-A04"
  sampleType: SampleType;
  color: string;
  colorBreakdown?: ColorBreakdownItem[]; // Same style with multiple different colors in a single requisition
  size: string; // e.g. "28, 29, 30, 31, 32, 33, 34, 36, 38, 40, 42, 44"
  sizeBreakdown?: SizeBreakdownItem[]; // e.g. 10 or 12 sizes with individual quantities in a single requisition
  requisitionOptions?: SingleRequisitionOptionItem[]; // Options under single requisition: Thread Mokab, Leg Panel, Sleeve Panel, etc.
  quantity: number;
  fabricId: string;
  fabricCode: string;
  fabricName: string;
  perPcsConsumptionYards?: number; // Per pcs fabric consumption in yds (mentioned on 1st requisition, never asked again)
  fabricRequiredYards: number; // Total fabric deducted in yds = perPcsConsumptionYards * quantity
  threadNote?: string;
  zipperNote?: string;
  buttonNote?: string;
  stage: SampleStage;
  stageHistory: StageHistoryEntry[];
  priority: SamplePriority;
  targetParcelDate: string;
  shipmentDate?: string; // Bulk / Order Shipment Date (YYYY-MM-DD) for Fast Approval Priority
  isRequisitionLocked?: boolean; // Once saved after 2nd confirmation, requisition cannot be edited
  createdAt: string;
  updatedAt: string;
  sewingOperator?: string;
  washDetails: WashDetails;
  finishingDetails: FinishingDetails;
  parcelDetails: ParcelDetails;
  approvalDetails: ApprovalDetails;
  thumbnail?: string;
  images?: string[];
  requisitionForm?: VolarRequisitionForm;
}

/**
 * Returns the effective per-size breakdown list for a sample (parses comma-separated sizes if sizeBreakdown is not explicitly stored)
 */
export function getEffectiveSizeBreakdown(sample: Partial<SampleItem>): SizeBreakdownItem[] {
  if (sample.sizeBreakdown && sample.sizeBreakdown.length > 0) {
    return sample.sizeBreakdown;
  }
  if (
    sample.requisitionForm?.sizeBreakdown &&
    sample.requisitionForm.sizeBreakdown.length > 0
  ) {
    return sample.requisitionForm.sizeBreakdown;
  }
  let rawSizeStr = (sample.size || '').trim();
  if (!rawSizeStr && sample.requisitionForm?.sampleSizeLabel) {
    const label = sample.requisitionForm.sampleSizeLabel;
    const sizeMatch = label.match(/Size:\s*([^\n(]+)/i);
    if (sizeMatch && sizeMatch[1]) {
      rawSizeStr = sizeMatch[1].trim();
    }
  }
  const parsedSizes = rawSizeStr
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (parsedSizes.length === 0) return [];
  const totalQty = sample.quantity || parsedSizes.length;
  const perSizeQty =
    parsedSizes.length > 0 && totalQty >= parsedSizes.length
      ? Math.max(1, Math.floor(totalQty / parsedSizes.length))
      : 1;
  const remainder =
    parsedSizes.length > 0 && totalQty > parsedSizes.length
      ? totalQty - perSizeQty * parsedSizes.length
      : 0;
  return parsedSizes.map((sz, idx) => ({
    size: sz,
    quantity: perSizeQty + (idx < remainder ? 1 : 0),
  }));
}

/**
 * Returns the clear, human-readable Size Name(s) for a sample across all stored fields
 */
export function getEffectiveSizeName(sample: Partial<SampleItem>): string {
  const breakdown =
    sample.sizeBreakdown && sample.sizeBreakdown.length > 0
      ? sample.sizeBreakdown
      : sample.requisitionForm?.sizeBreakdown &&
        sample.requisitionForm.sizeBreakdown.length > 0
      ? sample.requisitionForm.sizeBreakdown
      : [];

  if (breakdown.length > 0) {
    const fromBreakdown = breakdown
      .map((b) => (b.size || '').trim())
      .filter(Boolean)
      .join(', ');
    if (fromBreakdown) return fromBreakdown;
  }

  if (sample.size && sample.size.trim()) {
    return sample.size.trim();
  }

  if (sample.requisitionForm?.sampleSizeLabel) {
    const label = sample.requisitionForm.sampleSizeLabel;
    const sizeMatch = label.match(/Size:\s*([^\n(]+)/i);
    if (sizeMatch && sizeMatch[1] && sizeMatch[1].trim()) {
      return sizeMatch[1].trim();
    }
  }

  return 'Standard';
}

/**
 * Returns the effective per-colorway breakdown list for a sample (supports multiple colors of the same style in a single requisition)
 */
export function getEffectiveColorBreakdown(sample: Partial<SampleItem>): ColorBreakdownItem[] {
  if (sample.colorBreakdown && sample.colorBreakdown.length > 0) {
    return sample.colorBreakdown.map((c) => ({
      ...c,
      fabricId: c.fabricId || sample.fabricId || '',
      fabricCode: c.fabricCode || sample.fabricCode || '',
      fabricName: c.fabricName || sample.fabricName || '',
    }));
  }
  if (
    sample.requisitionForm?.colorBreakdown &&
    sample.requisitionForm.colorBreakdown.length > 0
  ) {
    return sample.requisitionForm.colorBreakdown.map((c) => ({
      ...c,
      fabricId: c.fabricId || sample.fabricId || '',
      fabricCode: c.fabricCode || sample.fabricCode || '',
      fabricName: c.fabricName || sample.fabricName || '',
    }));
  }
  const rawColorStr = (sample.color || '').trim();
  const parsedColors = rawColorStr
    .split(/[,;]+/)
    .map((c) => c.trim())
    .filter(Boolean);
  const washName = sample.washDetails?.washType || 'Standard Wash';
  const sizeName = getEffectiveSizeName(sample);
  const totalQty = Math.max(1, Number(sample.quantity || 1));
  const fallbackFabricId = sample.fabricId || '';
  const fallbackFabricCode = sample.fabricCode || '';
  const fallbackFabricName = sample.fabricName || '';

  if (parsedColors.length === 0) {
    return [
      {
        color: 'Standard',
        wash: washName,
        sizes: sizeName,
        quantity: totalQty,
        fabricId: fallbackFabricId,
        fabricCode: fallbackFabricCode,
        fabricName: fallbackFabricName,
      },
    ];
  }

  const perColorQty =
    parsedColors.length > 0 && totalQty >= parsedColors.length
      ? Math.max(1, Math.floor(totalQty / parsedColors.length))
      : 1;
  const remainder =
    parsedColors.length > 0 && totalQty > parsedColors.length
      ? totalQty - perColorQty * parsedColors.length
      : 0;

  return parsedColors.map((col, idx) => ({
    color: col,
    wash: washName,
    sizes: sizeName,
    quantity: perColorQty + (idx < remainder ? 1 : 0),
    fabricId: fallbackFabricId,
    fabricCode: fallbackFabricCode,
    fabricName: fallbackFabricName,
  }));
}

/**
 * Returns the clear, human-readable Color Name(s) for a sample across all stored fields
 */
export function getEffectiveColorName(sample: Partial<SampleItem>): string {
  const cBreakdown =
    sample.colorBreakdown && sample.colorBreakdown.length > 0
      ? sample.colorBreakdown
      : sample.requisitionForm?.colorBreakdown &&
        sample.requisitionForm.colorBreakdown.length > 0
      ? sample.requisitionForm.colorBreakdown
      : [];

  if (cBreakdown.length > 0) {
    const joined = cBreakdown
      .map((c) => (c.color || '').trim())
      .filter(Boolean)
      .join(', ');
    if (joined) return joined;
  }

  if (sample.color && sample.color.trim()) {
    return sample.color.trim();
  }

  return 'Standard';
}

/**
 * Returns the effective Total Requisition Quantity (in pcs) for a sample
 */
export function getEffectiveRequisitionQuantity(sample: Partial<SampleItem>): number {
  const breakdown =
    sample.sizeBreakdown && sample.sizeBreakdown.length > 0
      ? sample.sizeBreakdown
      : sample.requisitionForm?.sizeBreakdown &&
        sample.requisitionForm.sizeBreakdown.length > 0
      ? sample.requisitionForm.sizeBreakdown
      : [];

  const breakdownSum =
    breakdown.length > 0
      ? breakdown.reduce((sum, item) => sum + Math.max(1, Number(item.quantity) || 1), 0)
      : 0;

  const colorBreakdown =
    sample.colorBreakdown && sample.colorBreakdown.length > 0
      ? sample.colorBreakdown
      : sample.requisitionForm?.colorBreakdown &&
        sample.requisitionForm.colorBreakdown.length > 0
      ? sample.requisitionForm.colorBreakdown
      : [];

  const colorBreakdownSum =
    colorBreakdown.length > 0
      ? colorBreakdown.reduce((sum, item) => sum + Math.max(1, Number(item.quantity) || 1), 0)
      : 0;

  const directQty = Number(sample.quantity || 0);

  let parsedTextQty = 0;
  if (sample.requisitionForm?.quantityText) {
    const m = sample.requisitionForm.quantityText.match(/(\d+)/);
    if (m && m[1]) {
      parsedTextQty = Number(m[1]) || 0;
    }
  }

  if (colorBreakdown.length > 1 && colorBreakdownSum > 0) {
    return Math.max(colorBreakdownSum, breakdownSum, directQty, parsedTextQty, 1);
  }

  if (breakdown.length > 1 && breakdownSum > 0) {
    return Math.max(breakdownSum, colorBreakdownSum, directQty, parsedTextQty, 1);
  }

  return Math.max(directQty, colorBreakdownSum, breakdownSum, parsedTextQty, 1);
}

/**
 * Returns the effective per-piece fabric consumption in yards for a sample.
 */
export function getEffectivePerPcsConsumption(sample: Partial<SampleItem>): number {
  if (sample.perPcsConsumptionYards && sample.perPcsConsumptionYards > 0) {
    return sample.perPcsConsumptionYards;
  }
  if (
    sample.requisitionForm?.perPcsConsumptionYards &&
    sample.requisitionForm.perPcsConsumptionYards > 0
  ) {
    return sample.requisitionForm.perPcsConsumptionYards;
  }
  const qty = Math.max(1, sample.quantity || 1);
  if (sample.fabricRequiredYards && sample.fabricRequiredYards > 0) {
    return Number((sample.fabricRequiredYards / qty).toFixed(2));
  }
  return 0;
}

/**
 * Returns the effective Shipment Date for a sample (falls back to targetParcelDate if legacy record)
 */
export function getEffectiveShipmentDate(sample: SampleItem): string {
  return (
    sample.shipmentDate ||
    sample.requisitionForm?.shipmentDate ||
    sample.targetParcelDate ||
    ''
  );
}

/**
 * Returns number of days until shipment date (negative if overdue)
 */
export function getDaysUntilShipment(sample: SampleItem): number | null {
  const shipDateStr = getEffectiveShipmentDate(sample);
  if (!shipDateStr) return null;
  const shipTime = new Date(shipDateStr + 'T00:00:00').getTime();
  if (Number.isNaN(shipTime)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = shipTime - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Returns the approval proof (note + PDF/Image attachment + metadata) for Wash, Thread, Zipper, or Button
 */
export function getComponentApprovalProof(
  sample: SampleItem,
  component: ApprovableComponentKey
): ComponentApprovalProof {
  const a = sample.approvalDetails || ({} as ApprovalDetails);
  const fromMap = a.componentApprovals?.[component];

  if (component === 'wash') {
    const note = a.washApprovalNote || fromMap?.note || a.washComments || '';
    const attachmentUrl = a.washApprovalAttachment || fromMap?.attachmentUrl || '';
    const attachmentName = a.washApprovalAttachmentName || fromMap?.attachmentName;
    const attachmentType = a.washApprovalAttachmentType || fromMap?.attachmentType;
    return {
      approved: Boolean(a.washApproved),
      note,
      attachmentUrl,
      attachmentName,
      attachmentType,
      approvedBy: a.washApprovedBy || fromMap?.approvedBy || a.reviewedBy,
      approvedAt: a.washApprovedAt || fromMap?.approvedAt || a.reviewedAt,
    };
  }

  if (component === 'thread') {
    const approved =
      a.threadApproved !== undefined ? Boolean(a.threadApproved) : Boolean(a.trimsApproved);
    const note = a.threadApprovalNote || fromMap?.note || '';
    const attachmentUrl = a.threadApprovalAttachment || fromMap?.attachmentUrl || '';
    const attachmentName = a.threadApprovalAttachmentName || fromMap?.attachmentName;
    const attachmentType = a.threadApprovalAttachmentType || fromMap?.attachmentType;
    return {
      approved,
      note,
      attachmentUrl,
      attachmentName,
      attachmentType,
      approvedBy: a.threadApprovedBy || fromMap?.approvedBy || a.reviewedBy,
      approvedAt: a.threadApprovedAt || fromMap?.approvedAt || a.reviewedAt,
    };
  }

  if (component === 'zipper') {
    const approved =
      a.zipperApproved !== undefined
        ? Boolean(a.zipperApproved)
        : Boolean(a.accessoriesApproved);
    const note = a.zipperApprovalNote || fromMap?.note || '';
    const attachmentUrl = a.zipperApprovalAttachment || fromMap?.attachmentUrl || '';
    const attachmentName = a.zipperApprovalAttachmentName || fromMap?.attachmentName;
    const attachmentType = a.zipperApprovalAttachmentType || fromMap?.attachmentType;
    return {
      approved,
      note,
      attachmentUrl,
      attachmentName,
      attachmentType,
      approvedBy: a.zipperApprovedBy || fromMap?.approvedBy || a.reviewedBy,
      approvedAt: a.zipperApprovedAt || fromMap?.approvedAt || a.reviewedAt,
    };
  }

  // button
  const approved =
    a.buttonApproved !== undefined ? Boolean(a.buttonApproved) : Boolean(a.accessoriesApproved);
  const note = a.buttonApprovalNote || fromMap?.note || '';
  const attachmentUrl = a.buttonApprovalAttachment || fromMap?.attachmentUrl || '';
  const attachmentName = a.buttonApprovalAttachmentName || fromMap?.attachmentName;
  const attachmentType = a.buttonApprovalAttachmentType || fromMap?.attachmentType;
  return {
    approved,
    note,
    attachmentUrl,
    attachmentName,
    attachmentType,
    approvedBy: a.buttonApprovedBy || fromMap?.approvedBy || a.reviewedBy,
    approvedAt: a.buttonApprovedAt || fromMap?.approvedAt || a.reviewedAt,
  };
}

/**
 * Returns granular approval statuses for Wash, Thread, Zipper, Button, Trims, and Accessories
 */
export function getGranularApprovalStatus(sample: SampleItem) {
  const a = sample.approvalDetails;
  const washApproved = Boolean(a.washApproved);
  const trimsApproved = Boolean(a.trimsApproved);
  const accessoriesApproved = Boolean(a.accessoriesApproved);
  const buttonApproved =
    a.buttonApproved !== undefined ? Boolean(a.buttonApproved) : accessoriesApproved;
  const threadApproved =
    a.threadApproved !== undefined ? Boolean(a.threadApproved) : trimsApproved;
  const zipperApproved =
    a.zipperApproved !== undefined ? Boolean(a.zipperApproved) : accessoriesApproved;

  const pendingItems: string[] = [];
  if (!washApproved) pendingItems.push('Wash');
  if (!threadApproved) pendingItems.push('Thread');
  if (!zipperApproved) pendingItems.push('Zipper');
  if (!buttonApproved) pendingItems.push('Button');
  if (!trimsApproved) pendingItems.push('Trims');
  if (!accessoriesApproved) pendingItems.push('Accessories');

  const isFullyApproved =
    washApproved &&
    threadApproved &&
    zipperApproved &&
    buttonApproved &&
    trimsApproved &&
    accessoriesApproved &&
    a.overallVerdict === 'approved';

  return {
    washApproved,
    buttonApproved,
    threadApproved,
    zipperApproved,
    trimsApproved,
    accessoriesApproved,
    pendingItems,
    isFullyApproved,
  };
}

export function getSampleImage(sample: Partial<SampleItem>): string {
  if (sample.thumbnail && sample.thumbnail.trim() !== '') {
    return sample.thumbnail.trim();
  }
  if (sample.images && sample.images.length > 0 && sample.images[0]?.trim()) {
    return sample.images[0].trim();
  }
  return '';
}

export interface StylePresetImage {
  id: string;
  label: string;
  category: string;
  url: string;
}

export const PRESET_STYLE_IMAGES: StylePresetImage[] = [
  {
    id: 'oxford-shirt',
    label: 'Oxford Poplin Shirt',
    category: 'Shirts',
    url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'carpenter-jeans',
    label: 'Carpenter Denim Jeans',
    category: 'Denim',
    url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'linen-shirt',
    label: 'Resort Linen Shirt',
    category: 'Shirts',
    url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'graphic-tee',
    label: 'Heavyweight Graphic Tee',
    category: 'Knits',
    url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'boxy-hoodie',
    label: 'Boxy Heavyweight Hoodie',
    category: 'Knits',
    url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'baggy-jeans',
    label: '90s Baggy Skate Jeans',
    category: 'Denim',
    url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'pleated-trouser',
    label: 'Tailored Pleated Trousers',
    category: 'Pants',
    url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'chino-pant',
    label: 'Slim Tapered Chinos',
    category: 'Pants',
    url: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'workwear-canvas',
    label: 'Double-Knee Utility Canvas',
    category: 'Workwear',
    url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'trucker-jacket',
    label: 'Cropped Trucker Jacket',
    category: 'Jackets',
    url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'selvedge-jacket',
    label: 'Selvedge Denim Jacket',
    category: 'Jackets',
    url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'cargo-pant',
    label: 'Military Utility Cargo',
    category: 'Pants',
    url: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=600&q=80',
  },
];

export const STAGE_CONFIG: Record<SampleStage, {
  label: string;
  shortLabel: string;
  stepNumber: number;
  color: string;
  badgeBg: string;
  badgeText: string;
  description: string;
  nextStage: SampleStage | null;
  prevStage: SampleStage | null;
}> = {
  requisition: {
    label: 'Requisition',
    shortLabel: 'Req',
    stepNumber: 1,
    color: '#059669',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    badgeText: 'Requisition Raised',
    description: 'Fabric & spec approved, awaiting sewing floor input',
    nextStage: 'sewing',
    prevStage: null,
  },
  sewing: {
    label: 'Sewing Status',
    shortLabel: 'Sewing',
    stepNumber: 2,
    color: '#047857',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    badgeText: 'In Sewing',
    description: 'On assembly line for tailoring & panel assembly',
    nextStage: 'wash',
    prevStage: 'requisition',
  },
  wash: {
    label: 'Wash Status',
    shortLabel: 'Wash',
    stepNumber: 3,
    color: '#059669',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    badgeText: 'In Wash Plant',
    description: 'Undergoing chemical/enzyme treatment & drying',
    nextStage: 'finishing',
    prevStage: 'sewing',
  },
  finishing: {
    label: 'Finishing Status',
    shortLabel: 'Finishing',
    stepNumber: 4,
    color: '#047857',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    badgeText: 'In Finishing',
    description: 'Trimming, pressing, label attachment & final QA',
    nextStage: 'ready_for_parcel',
    prevStage: 'wash',
  },
  ready_for_parcel: {
    label: 'Ready for Parcel',
    shortLabel: 'Parcel',
    stepNumber: 5,
    color: '#10b981',
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-400',
    badgeText: 'Ready for Parcel',
    description: 'Packed, labeled, scheduled for courier dispatch',
    nextStage: 'approval_comments',
    prevStage: 'finishing',
  },
  approval_comments: {
    label: 'Approval Comments',
    shortLabel: 'Approval',
    stepNumber: 6,
    color: '#059669',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-300',
    badgeText: 'Awaiting / Comments',
    description: 'Buyer evaluating wash, trims & accessories remarks',
    nextStage: null,
    prevStage: 'ready_for_parcel',
  },
};

export const CORE_SEAL_SAMPLE_TYPES = [
  'Initial Sample',
  'Red Seal Sample',
  'Gold Seal Sample',
] as const;

export interface SampleTypeTone {
  category: 'gold' | 'red' | 'initial' | 'default';
  label: string;
  badgeClass: string;
  dotClass: string;
  activePillClass: string;
  idlePillClass: string;
  inputClass: string;
  rowTintClass: string;
  cardTintClass: string;
  printBadgeClass: string;
}

/**
 * Returns the visual color tone configuration for a Sample Type:
 * - Gold Seal -> Gold Color Tone
 * - Red Seal -> Red Color Tone
 * - Initial -> White Tone Color
 */
export function getSampleTypeTone(sampleType?: string): SampleTypeTone {
  const raw = (sampleType || '').trim();
  const lower = raw.toLowerCase();

  if (lower.includes('gold')) {
    return {
      category: 'gold',
      label: raw || 'Gold Seal Sample',
      badgeClass: 'bg-amber-50 text-amber-900 border-amber-300 font-bold',
      dotClass: 'bg-amber-500',
      activePillClass: 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-sm',
      idlePillClass: 'bg-white text-slate-700 border-emerald-200 hover:bg-emerald-50',
      inputClass: 'bg-white border-emerald-300 text-slate-900 focus:ring-emerald-500',
      rowTintClass: 'hover:bg-emerald-50/40',
      cardTintClass: 'border-emerald-200 bg-white',
      printBadgeClass: 'bg-white text-black border-black',
    };
  }

  if (lower.includes('red')) {
    return {
      category: 'red',
      label: raw || 'Red Seal Sample',
      badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold',
      dotClass: 'bg-emerald-600',
      activePillClass: 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-sm',
      idlePillClass: 'bg-white text-slate-700 border-emerald-200 hover:bg-emerald-50',
      inputClass: 'bg-white border-emerald-300 text-slate-900 focus:ring-emerald-500',
      rowTintClass: 'hover:bg-emerald-50/40',
      cardTintClass: 'border-emerald-200 bg-white',
      printBadgeClass: 'bg-white text-black border-black',
    };
  }

  if (lower.includes('initial') || lower === 'init') {
    return {
      category: 'initial',
      label: raw || 'Initial Sample',
      badgeClass: 'bg-emerald-50/70 text-emerald-800 border-emerald-200 font-semibold',
      dotClass: 'bg-emerald-500',
      activePillClass: 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-sm',
      idlePillClass: 'bg-white text-slate-700 border-emerald-200 hover:bg-emerald-50',
      inputClass: 'bg-white border-emerald-300 text-slate-900 focus:ring-emerald-500',
      rowTintClass: 'hover:bg-emerald-50/40',
      cardTintClass: 'border-emerald-200 bg-white',
      printBadgeClass: 'bg-white text-black border-black',
    };
  }

  return {
    category: 'default',
    label: raw || 'Standard Sample',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dotClass: 'bg-emerald-500',
    activePillClass: 'bg-emerald-600 text-white font-bold border-emerald-600',
    idlePillClass: 'bg-white text-slate-700 border-emerald-200 hover:bg-emerald-50',
    inputClass: 'bg-white border-emerald-300 text-slate-900 focus:ring-emerald-500',
    rowTintClass: 'hover:bg-emerald-50/40',
    cardTintClass: 'border-emerald-200 bg-white',
    printBadgeClass: 'bg-white text-black border-black',
  };
}

export interface PriorityTone {
  priority: SamplePriority;
  label: string;
  shortLabel: string;
  description: string;
  badgeClass: string;
  dotClass: string;
  activePillClass: string;
  idlePillClass: string;
  selectClass: string;
  cardClass: string;
  rowClass: string;
  printBadgeClass: string;
}

/**
 * Priority tones:
 * Statuses (Urgent, High/Pending, Normal/Approved) are tagged with badge color ONLY
 * and do NOT alter the card or row theme of the system.
 */
export function getPriorityTone(priority?: SamplePriority | string): PriorityTone {
  const p = (priority || 'normal').toLowerCase();

  if (p === 'urgent') {
    return {
      priority: 'urgent',
      label: 'URGENT',
      shortLabel: 'Urgent',
      description: 'Urgent 1-Day Priority (Tagged Only)',
      badgeClass: 'bg-red-600 text-white border-red-600 font-bold shadow-xs',
      dotClass: 'bg-white animate-pulse',
      activePillClass: 'bg-red-600 text-white font-bold border-red-600 shadow-xs',
      idlePillClass: 'bg-white text-red-700 border-red-200 hover:bg-red-50',
      selectClass: 'bg-white text-red-700 border-red-300 font-bold focus:ring-emerald-500',
      cardClass: 'bg-white hover:bg-emerald-50/30 border-emerald-200 shadow-xs',
      rowClass: 'bg-white hover:bg-emerald-50/40',
      printBadgeClass: 'bg-white text-black border-black font-bold',
    };
  }

  if (p === 'high') {
    return {
      priority: 'high',
      label: 'HIGH',
      shortLabel: 'High',
      description: 'High Priority (Tagged Only)',
      badgeClass: 'bg-amber-500 text-white border-amber-500 font-bold shadow-xs',
      dotClass: 'bg-white',
      activePillClass: 'bg-amber-500 text-white font-bold border-amber-500 shadow-xs',
      idlePillClass: 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50',
      selectClass: 'bg-white text-amber-800 border-amber-300 font-bold focus:ring-emerald-500',
      cardClass: 'bg-white hover:bg-emerald-50/30 border-emerald-200 shadow-xs',
      rowClass: 'bg-white hover:bg-emerald-50/40',
      printBadgeClass: 'bg-white text-black border-black font-bold',
    };
  }

  return {
    priority: 'normal',
    label: 'NORMAL',
    shortLabel: 'Normal',
    description: 'Standard Requisition',
    badgeClass: 'bg-emerald-600 text-white border-emerald-600 font-semibold',
    dotClass: 'bg-white',
    activePillClass: 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-xs',
    idlePillClass: 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50',
    selectClass: 'bg-white text-emerald-900 border-emerald-300 font-semibold focus:ring-emerald-500',
    cardClass: 'bg-white hover:bg-emerald-50/30 border-emerald-200 shadow-xs',
    rowClass: 'bg-white hover:bg-emerald-50/40',
    printBadgeClass: 'bg-white text-black border-black font-semibold',
  };
}

export interface RankedSampleSearchResult {
  sample: SampleItem;
  score: number;
  matchReason: string;
  matchedField:
    | 'poNumber'
    | 'styleName'
    | 'styleCode'
    | 'blNumber'
    | 'buyer'
    | 'color'
    | 'size'
    | 'fabric'
    | 'option'
    | 'trims'
    | 'stage'
    | 'parcel'
    | 'other';
}

function computeStringCloseness(targetRaw: string, queryRaw: string): number {
  const target = String(targetRaw || '').toLowerCase().trim();
  const query = String(queryRaw || '').toLowerCase().trim();
  if (!target || !query) return 0;
  if (target === query) return 100;

  const targetClean = target.replace(/[\s\-_/#.,:;()]/g, '');
  const queryClean = query.replace(/[\s\-_/#.,:;()]/g, '');

  // Single-character search support (e.g. searching "a" or "1")
  if (query.length === 1) {
    if (target.startsWith(query)) return 92;
    const words = target.split(/[\s\-_/#.,:;()]+/);
    if (words.some((w) => w.startsWith(query))) return 86;
    if (target.includes(query)) return 75;
    return 0;
  }

  if (targetClean && queryClean) {
    if (targetClean === queryClean) return 98;
    if (targetClean.startsWith(queryClean)) return 91;
    if (targetClean.includes(queryClean)) return 83;
  }

  if (target.startsWith(query)) return 94;
  const targetWords = target.split(/[\s\-_/#.,:;()]+/).filter(Boolean);
  if (targetWords.some((w) => w === query)) return 90;
  if (targetWords.some((w) => w.startsWith(query))) return 87;
  if (target.includes(query)) return 84;

  // Multi-word / token matching (supports 1+ char tokens)
  const queryTokens = query.split(/[\s\-_,/]+/).filter((t) => t.length >= 1);
  if (queryTokens.length > 1) {
    let matchedTokens = 0;
    for (const token of queryTokens) {
      if (target.includes(token) || targetClean.includes(token)) {
        matchedTokens++;
      }
    }
    if (matchedTokens === queryTokens.length) return 80;
    if (matchedTokens > 0) return 55 + Math.round((matchedTokens / queryTokens.length) * 20);
  }

  // Character bigram similarity (Dice coefficient) for close / typo-tolerant matching
  if (queryClean.length >= 2 && targetClean.length >= 2) {
    const bigrams = (str: string) => {
      const list: string[] = [];
      for (let i = 0; i < str.length - 1; i++) {
        list.push(str.slice(i, i + 2));
      }
      return list;
    };
    const tBigrams = bigrams(targetClean);
    const qBigrams = bigrams(queryClean);
    let intersection = 0;
    const used = new Array(tBigrams.length).fill(false);
    for (const qb of qBigrams) {
      const idx = tBigrams.findIndex((tb, i) => !used[i] && tb === qb);
      if (idx !== -1) {
        used[idx] = true;
        intersection++;
      }
    }
    const dice = (2 * intersection) / (tBigrams.length + qBigrams.length);
    if (dice >= 0.32) {
      return Math.round(dice * 76);
    }
  }

  return 0;
}

/**
 * Universal Deep-Index Search Engine:
 * Searches EVERY field in SampleItem (PO #, Style Name, Style Code, BL #, Buyer, Color, Wash,
 * Sizes, Options like Thread Mokab / Leg Panel / Sleeve Panel, Fabric Code/Name, Trims,
 * Courier/Tracking, Stage, Priority, Operator, Notes) and supports 1-character ("a") to full queries.
 */
export function rankSamplesBySearchQuery(
  samples: SampleItem[],
  query: string
): RankedSampleSearchResult[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const results: RankedSampleSearchResult[] = [];

  for (const sample of samples) {
    const candidates: {
      score: number;
      reason: string;
      field: RankedSampleSearchResult['matchedField'];
    }[] = [];

    const checkField = (
      val: string | undefined | null,
      label: string,
      field: RankedSampleSearchResult['matchedField'],
      boost = 0
    ) => {
      if (!val) return;
      const sc = computeStringCloseness(val, trimmed);
      if (sc > 0) {
        candidates.push({
          score: sc + boost,
          reason: `${label}: ${val}`,
          field,
        });
      }
    };

    // Primary Identifiers (Highest Priority)
    checkField(sample.poNumber, 'PO #', 'poNumber', 6);
    checkField(sample.styleName, 'Style Name', 'styleName', 5);
    checkField(sample.styleCode, 'Style Code', 'styleCode', 5);
    checkField(
      sample.blNumber || sample.requisitionForm?.blNumber,
      'BL #',
      'blNumber',
      4
    );
    checkField(sample.buyer, 'Buyer', 'buyer', 3);

    // Single Requisition Options (Thread Mokab, Leg Panel, Sleeve Panel, etc.)
    const allOptions = [
      ...(sample.requisitionOptions || []),
      ...(sample.requisitionForm?.requisitionOptions || []),
    ];
    for (const opt of allOptions) {
      checkField(`${opt.name} ${opt.note || ''}`, 'Option', 'option', 3);
    }

    // Colors & Washes
    checkField(sample.color, 'Color', 'color', 2);
    checkField(sample.washDetails?.washType, 'Wash', 'color', 2);
    checkField(sample.requisitionForm?.colorWash, 'Color/Wash', 'color', 2);
    for (const cb of sample.colorBreakdown || []) {
      checkField(`${cb.color} ${cb.wash || ''}`, 'Color Breakdown', 'color', 2);
    }

    // Sizes & Breakdown
    checkField(getEffectiveSizeName(sample), 'Size', 'size', 2);
    checkField(sample.sampleType, 'Sample Type', 'other', 2);
    checkField(sample.priority, 'Priority', 'other', 2);
    checkField(STAGE_CONFIG[sample.stage]?.label || sample.stage, 'Stage', 'stage', 2);

    // Fabric & Supplier
    checkField(sample.fabricCode, 'Fabric Code', 'fabric', 2);
    checkField(sample.fabricName, 'Fabric', 'fabric', 2);
    checkField(sample.requisitionForm?.supplier, 'Supplier', 'fabric', 1);
    checkField(sample.requisitionForm?.weight, 'Weight', 'fabric', 1);

    // Trims, Thread, Zipper, Button & Instructions
    checkField(
      sample.threadNote || sample.requisitionForm?.threadInstruction,
      'Thread',
      'trims',
      1
    );
    checkField(sample.zipperNote, 'Zipper', 'trims', 1);
    checkField(sample.buttonNote, 'Button', 'trims', 1);
    checkField(sample.requisitionForm?.fitting, 'Fitting', 'trims', 1);
    checkField(sample.requisitionForm?.specialInstructions, 'Instructions', 'trims', 1);

    // Line, Operator, Courier, Tracking & Approval Notes
    checkField(sample.lineCode, 'Line', 'other', 1);
    checkField(sample.sewingOperator, 'Operator', 'other', 1);
    checkField(sample.requisitionForm?.requestedBy, 'Requested By', 'other', 1);
    checkField(sample.parcelDetails?.courier, 'Courier', 'parcel', 1);
    checkField(sample.parcelDetails?.trackingNumber, 'Tracking #', 'parcel', 2);
    checkField(sample.approvalDetails?.overallVerdict, 'Approval', 'other', 1);
    checkField(sample.approvalDetails?.washComments, 'Wash Comment', 'other', 0);
    checkField(sample.approvalDetails?.trimsComments, 'Trims Comment', 'other', 0);

    if (candidates.length > 0) {
      candidates.sort((a, b) => b.score - a.score);
      const best = candidates[0];
      results.push({
        sample,
        score: Math.min(100, best.score),
        matchReason: best.reason,
        matchedField: best.field,
      });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}

// ============================================================================
// STYLES MODULE: CATALOG & COLORWAY CONSOLIDATION
// ============================================================================

export interface StyleColorwayItem {
  color: string;
  wash?: string;
  sizes?: string;
  fabricId?: string;
  fabricCode?: string;
  fabricName?: string;
  quantity?: number;
  sampleId?: string;
  sampleType?: string;
  stage?: SampleStage;
  createdAt?: string;
}

export interface StyleFabricSummaryItem {
  fabricId?: string;
  fabricCode: string;
  fabricName?: string;
  usedForColors?: string[];
}

export interface StyleCatalogItem {
  id: string; // Composite key or uuid
  styleKey: string; // Normalized: STYLE_CODE___STYLE_DESCRIPTION
  styleCode: string; // Style Number
  styleName: string; // Style Description
  buyer: string;
  poNumber?: string;
  lineCode?: string;
  thumbnail?: string;
  images?: string[];
  colors: StyleColorwayItem[];
  fabrics: StyleFabricSummaryItem[];
  sampleIds: string[];
  samples: SampleItem[];
  sampleCount: number;
  perPcsConsumptionYards?: number;
  totalQuantity: number;
  firstRequisitionDate: string;
  lastRequisitionDate: string;
  activeStages: SampleStage[];
}

/**
 * Composite key helper: Styles are grouped strictly by Style Number AND Style Description.
 * "Some times, style number can be same but description has to match with."
 */
export function getStyleCompositeKey(styleCode?: string, styleName?: string): string {
  const code = (styleCode || '').trim().toUpperCase();
  const desc = (styleName || '').trim().toUpperCase();
  return `${code}___${desc}`;
}

/**
 * Aggregates all samples into a consolidated Style Catalog.
 * When multiple colorways or multiple requisitions share the same Style Number and matching Description,
 * all colors, fabrics, and sample requisitions are listed under one unified style.
 */
export function aggregateStylesFromSamples(samples: SampleItem[]): StyleCatalogItem[] {
  const map = new Map<string, StyleCatalogItem>();

  for (const s of samples) {
    const code = (s.styleCode || '').trim();
    if (!code) continue;
    const name = (s.styleName || '').trim();
    const key = getStyleCompositeKey(code, name);

    const cBreakdown = getEffectiveColorBreakdown(s);
    const primaryFabricCode = s.fabricCode || '';
    const primaryFabricName = s.fabricName || '';
    const primaryFabricId = s.fabricId || '';

    // Colorways from this sample
    const sampleColorways: StyleColorwayItem[] = cBreakdown.map((cb) => ({
      color: cb.color,
      wash: cb.wash || s.washDetails?.washType || 'Standard Wash',
      sizes: cb.sizes || getEffectiveSizeName(s),
      fabricId: cb.fabricId || primaryFabricId,
      fabricCode: cb.fabricCode || primaryFabricCode,
      fabricName: cb.fabricName || primaryFabricName,
      quantity: cb.quantity,
      sampleId: s.id,
      sampleType: s.sampleType,
      stage: s.stage,
      createdAt: s.createdAt,
    }));

    if (!map.has(key)) {
      // First time seeing this style number + description
      const fabricsList: StyleFabricSummaryItem[] = [];
      if (primaryFabricCode) {
        fabricsList.push({
          fabricId: primaryFabricId,
          fabricCode: primaryFabricCode,
          fabricName: primaryFabricName,
          usedForColors: sampleColorways.map((c) => c.color),
        });
      }
      // Check colors for different fabrics
      for (const cw of sampleColorways) {
        if (cw.fabricCode && !fabricsList.some((f) => f.fabricCode === cw.fabricCode)) {
          fabricsList.push({
            fabricId: cw.fabricId,
            fabricCode: cw.fabricCode,
            fabricName: cw.fabricName,
            usedForColors: [cw.color],
          });
        }
      }

      map.set(key, {
        id: `style-${key.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        styleKey: key,
        styleCode: code.toUpperCase(),
        styleName: name,
        buyer: s.buyer || 'Direct Buyer',
        poNumber: s.poNumber || '',
        lineCode: s.lineCode || '',
        thumbnail: s.thumbnail || (s.images && s.images[0]) || undefined,
        images: s.images || (s.thumbnail ? [s.thumbnail] : []),
        colors: sampleColorways,
        fabrics: fabricsList,
        sampleIds: [s.id],
        samples: [s],
        sampleCount: 1,
        perPcsConsumptionYards: getEffectivePerPcsConsumption(s),
        totalQuantity: s.quantity || 1,
        firstRequisitionDate: s.createdAt,
        lastRequisitionDate: s.updatedAt || s.createdAt,
        activeStages: [s.stage],
      });
    } else {
      // Existing style with same Style Number AND Style Description -> Consolidate!
      const existing = map.get(key)!;
      existing.sampleCount += 1;
      existing.totalQuantity += s.quantity || 1;
      if (!existing.sampleIds.includes(s.id)) {
        existing.sampleIds.push(s.id);
        existing.samples.push(s);
      }
      if (!existing.activeStages.includes(s.stage)) {
        existing.activeStages.push(s.stage);
      }

      // Merge image if current existing does not have one
      if (!existing.thumbnail && (s.thumbnail || (s.images && s.images[0]))) {
        existing.thumbnail = s.thumbnail || (s.images && s.images[0]);
      }
      if (s.images && s.images.length > 0) {
        const mergedImages = Array.from(new Set([...(existing.images || []), ...s.images]));
        existing.images = mergedImages;
      }

      // Update date bounds
      if (new Date(s.createdAt) < new Date(existing.firstRequisitionDate)) {
        existing.firstRequisitionDate = s.createdAt;
      }
      if (new Date(s.updatedAt || s.createdAt) > new Date(existing.lastRequisitionDate)) {
        existing.lastRequisitionDate = s.updatedAt || s.createdAt;
      }

      // Merge colors without duplicating exact identical colorway (same color + wash + fabric)
      for (const cw of sampleColorways) {
        const alreadyHasColor = existing.colors.some(
          (c) =>
            c.color.toLowerCase() === cw.color.toLowerCase() &&
            (c.wash || '').toLowerCase() === (cw.wash || '').toLowerCase() &&
            (c.fabricCode || '').toLowerCase() === (cw.fabricCode || '').toLowerCase()
        );
        if (!alreadyHasColor) {
          existing.colors.push(cw);
        }
      }

      // Merge fabrics
      const allSampleFabrics: { code: string; name?: string; id?: string; color: string }[] = [];
      if (primaryFabricCode) {
        allSampleFabrics.push({
          code: primaryFabricCode,
          name: primaryFabricName,
          id: primaryFabricId,
          color: s.color,
        });
      }
      for (const cw of sampleColorways) {
        if (cw.fabricCode) {
          allSampleFabrics.push({
            code: cw.fabricCode,
            name: cw.fabricName,
            id: cw.fabricId,
            color: cw.color,
          });
        }
      }

      for (const f of allSampleFabrics) {
        const existingFab = existing.fabrics.find((ef) => ef.fabricCode === f.code);
        if (existingFab) {
          if (!existingFab.usedForColors?.includes(f.color)) {
            existingFab.usedForColors = [...(existingFab.usedForColors || []), f.color];
          }
        } else {
          existing.fabrics.push({
            fabricId: f.id,
            fabricCode: f.code,
            fabricName: f.name,
            usedForColors: [f.color],
          });
        }
      }

      if (!existing.perPcsConsumptionYards && getEffectivePerPcsConsumption(s) > 0) {
        existing.perPcsConsumptionYards = getEffectivePerPcsConsumption(s);
      }
    }
  }

  // Return sorted by most recent requisition date
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.lastRequisitionDate).getTime() - new Date(a.lastRequisitionDate).getTime()
  );
}



