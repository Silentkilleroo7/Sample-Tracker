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
  lastNotifiedAt?: string;
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
}

export function isParcelCompleted(sample: SampleItem): boolean {
  return (
    sample.parcelDetails.dispatchStatus === 'dispatched' ||
    sample.parcelDetails.dispatchStatus === 'delivered' ||
    sample.stage === 'ready_for_parcel' ||
    sample.stage === 'approval_comments'
  );
}

export function generateWhatsAppFollowUpLink(sample: SampleItem, phone: string, customMessage?: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const p = sample.parcelDetails;
  const wbStatus = p.workbookSent ? `✅ Sent on ${p.workbookSentDate || 'dispatch'}` : `⚠️ Pending / Not Sent`;
  const defaultText = `*GA SAMPLE TRACKING - PARCEL FOLLOW-UP NOTIFICATION*\nStyle: *${sample.styleName}* (${sample.styleCode})\nBuyer: *${sample.buyer}* | PO: ${sample.poNumber}\nCourier: ${p.courier || 'DHL Express'}\nAirway Bill (AWB): ${p.trackingNumber || 'Pending'}\nParcel Dispatch Date: ${p.parcelDate}\nWorkbook Sent Status: ${wbStatus}\n\n*Follow-up Notice:* Dear Team, the sample parcel for style *${sample.styleName}* has been sent. Please confirm parcel delivery receipt and share your remarks for wash, trims, and accessories.`;
  const textToUse = customMessage || defaultText;
  return cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(textToUse)}` : `https://wa.me/?text=${encodeURIComponent(textToUse)}`;
}

export interface ApprovalDetails {
  washComments: string;
  washApproved: boolean;
  trimsComments: string;
  trimsApproved: boolean;
  accessoriesComments: string;
  accessoriesApproved: boolean;
  buttonApproved?: boolean;
  threadApproved?: boolean;
  zipperApproved?: boolean;
  labelApproved?: boolean;
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
  date: string;
  requiredDate: string;
  shipmentDate?: string;
  buyer: string;
  requestedBy: string;
  priorityType: 'urgent' | 'normal';
  sampleType: string;
  descriptionCode: string;
  styleName: string;
  sampleSizeLabel: string;
  sizeBreakdown?: SizeBreakdownItem[];
  colorWash: string;
  fabricCode: string;
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
  styleCode: string; // e.g. "ST-8820"
  styleName: string; // e.g. "Vintage Carpenter Denim Pant"
  buyer: string; // e.g. "Levi Strauss & Co."
  poNumber: string; // e.g. "PO-99412"
  lineCode: string; // e.g. "LINE-A04"
  sampleType: SampleType;
  color: string;
  size: string; // e.g. "28, 29, 30, 31, 32, 33, 34, 36, 38, 40, 42, 44"
  sizeBreakdown?: SizeBreakdownItem[]; // e.g. 10 or 12 sizes with individual quantities in a single requisition
  quantity: number;
  fabricId: string;
  fabricCode: string;
  fabricName: string;
  fabricRequiredYards: number;
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
  const parsedSizes = (sample.size || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (parsedSizes.length === 0) return [];
  const totalQty = sample.quantity || parsedSizes.length;
  const perSizeQty =
    parsedSizes.length > 0 && totalQty >= parsedSizes.length
      ? Math.max(1, Math.floor(totalQty / parsedSizes.length))
      : 1;
  return parsedSizes.map((sz) => ({ size: sz, quantity: perSizeQty }));
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
 * Returns granular approval statuses for Button, Thread, Wash, Trims, and Accessories
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

  const pendingItems: string[] = [];
  if (!washApproved) pendingItems.push('Wash');
  if (!buttonApproved) pendingItems.push('Button');
  if (!threadApproved) pendingItems.push('Thread');
  if (!trimsApproved) pendingItems.push('Trims');
  if (!accessoriesApproved) pendingItems.push('Accessories');

  const isFullyApproved =
    washApproved &&
    buttonApproved &&
    threadApproved &&
    trimsApproved &&
    accessoriesApproved &&
    a.overallVerdict === 'approved';

  return {
    washApproved,
    buttonApproved,
    threadApproved,
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
    color: '#3b82f6',
    badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    badgeText: 'Requisition Raised',
    description: 'Fabric & spec approved, awaiting sewing floor input',
    nextStage: 'sewing',
    prevStage: null,
  },
  sewing: {
    label: 'Sewing Status',
    shortLabel: 'Sewing',
    stepNumber: 2,
    color: '#8b5cf6',
    badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    badgeText: 'In Sewing',
    description: 'On assembly line for tailoring & panel assembly',
    nextStage: 'wash',
    prevStage: 'requisition',
  },
  wash: {
    label: 'Wash Status',
    shortLabel: 'Wash',
    stepNumber: 3,
    color: '#06b6d4',
    badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    badgeText: 'In Wash Plant',
    description: 'Undergoing chemical/enzyme treatment & drying',
    nextStage: 'finishing',
    prevStage: 'sewing',
  },
  finishing: {
    label: 'Finishing Status',
    shortLabel: 'Finishing',
    stepNumber: 4,
    color: '#f59e0b',
    badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
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
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    badgeText: 'Ready for Parcel',
    description: 'Packed, labeled, scheduled for courier dispatch',
    nextStage: 'approval_comments',
    prevStage: 'finishing',
  },
  approval_comments: {
    label: 'Approval Comments',
    shortLabel: 'Approval',
    stepNumber: 6,
    color: '#ec4899',
    badgeBg: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
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
      badgeClass:
        'bg-gradient-to-r from-amber-500/30 via-yellow-400/25 to-amber-500/30 text-amber-200 border-amber-400/80 shadow-sm shadow-amber-500/20',
      dotClass: 'bg-amber-400 ring-2 ring-amber-300/50',
      activePillClass:
        'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black border-amber-200 shadow-md shadow-amber-500/30 ring-2 ring-amber-300/50',
      idlePillClass:
        'bg-amber-950/60 text-amber-300 border-amber-500/50 hover:bg-amber-900/70 hover:border-amber-400',
      inputClass:
        'bg-amber-950/40 border-amber-400/80 text-amber-200 focus:ring-amber-400',
      rowTintClass:
        'bg-amber-950/15 hover:bg-amber-950/30 border-l-4 border-l-amber-400',
      cardTintClass:
        'border-amber-500/60 bg-gradient-to-br from-amber-950/30 via-slate-900/90 to-slate-900/90',
      printBadgeClass: 'bg-amber-100 text-amber-950 border-amber-600',
    };
  }

  if (lower.includes('red')) {
    return {
      category: 'red',
      label: raw || 'Red Seal Sample',
      badgeClass:
        'bg-gradient-to-r from-rose-600/35 via-red-500/25 to-rose-600/35 text-rose-200 border-rose-400/80 shadow-sm shadow-rose-500/20',
      dotClass: 'bg-rose-500 ring-2 ring-rose-300/50',
      activePillClass:
        'bg-gradient-to-r from-rose-600 to-red-600 text-white font-black border-rose-300 shadow-md shadow-rose-600/30 ring-2 ring-rose-400/50',
      idlePillClass:
        'bg-rose-950/60 text-rose-300 border-rose-500/50 hover:bg-rose-900/70 hover:border-rose-400',
      inputClass:
        'bg-rose-950/40 border-rose-500/80 text-rose-200 focus:ring-rose-500',
      rowTintClass:
        'bg-rose-950/15 hover:bg-rose-950/30 border-l-4 border-l-rose-500',
      cardTintClass:
        'border-rose-500/60 bg-gradient-to-br from-rose-950/30 via-slate-900/90 to-slate-900/90',
      printBadgeClass: 'bg-rose-100 text-rose-950 border-rose-600',
    };
  }

  if (lower.includes('initial') || lower === 'init') {
    return {
      category: 'initial',
      label: raw || 'Initial Sample',
      badgeClass:
        'bg-white/95 text-slate-950 border-white shadow-sm shadow-white/20',
      dotClass: 'bg-slate-900 ring-2 ring-slate-400/60',
      activePillClass:
        'bg-white text-slate-950 font-black border-white shadow-md shadow-white/30 ring-2 ring-white/60',
      idlePillClass:
        'bg-white/15 text-white border-white/50 hover:bg-white/25 hover:border-white',
      inputClass:
        'bg-white/15 border-white/80 text-white focus:ring-white',
      rowTintClass:
        'bg-white/[0.04] hover:bg-white/[0.08] border-l-4 border-l-white',
      cardTintClass:
        'border-white/50 bg-gradient-to-br from-white/[0.08] via-slate-900/90 to-slate-900/90',
      printBadgeClass: 'bg-white text-black border-black',
    };
  }

  return {
    category: 'default',
    label: raw || 'Standard Sample',
    badgeClass: 'bg-slate-800 text-slate-200 border-slate-600',
    dotClass: 'bg-indigo-400',
    activePillClass: 'bg-indigo-600 text-white font-bold border-indigo-400',
    idlePillClass:
      'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-500',
    inputClass:
      'bg-slate-800 border-slate-700 text-white focus:ring-indigo-500',
    rowTintClass: 'hover:bg-slate-800/40',
    cardTintClass: 'border-slate-800 bg-slate-900/80',
    printBadgeClass: 'bg-slate-100 text-black border-black',
  };
}

