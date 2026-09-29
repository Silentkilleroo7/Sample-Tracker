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

export interface ColorBreakdownItem {
  color: string;
  wash?: string;
  sizes?: string;
  quantity: number;
}

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
    return sample.colorBreakdown;
  }
  if (
    sample.requisitionForm?.colorBreakdown &&
    sample.requisitionForm.colorBreakdown.length > 0
  ) {
    return sample.requisitionForm.colorBreakdown;
  }
  const rawColorStr = (sample.color || '').trim();
  const parsedColors = rawColorStr
    .split(/[,;]+/)
    .map((c) => c.trim())
    .filter(Boolean);
  const washName = sample.washDetails?.washType || 'Standard Wash';
  const sizeName = getEffectiveSizeName(sample);
  const totalQty = Math.max(1, Number(sample.quantity || 1));

  if (parsedColors.length === 0) {
    return [
      {
        color: 'Standard',
        wash: washName,
        sizes: sizeName,
        quantity: totalQty,
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
 * Returns the visual color tone configuration for a Requisition Priority:
 * - Normal ('normal') -> White color
 * - High ('high') -> Little Red (soft/light red) color
 * - Urgent ('urgent') -> Fully Red (solid vibrant red) color
 */
export function getPriorityTone(priority?: SamplePriority | string): PriorityTone {
  const p = (priority || 'normal').toLowerCase();

  if (p === 'urgent') {
    return {
      priority: 'urgent',
      label: 'URGENT',
      shortLabel: 'Urgent',
      description: 'Fully Red — Immediate 1-Day Priority',
      badgeClass:
        'bg-red-600 text-white border-red-400 shadow-md shadow-red-600/50 font-black',
      dotClass: 'bg-white ring-2 ring-red-200/80 animate-pulse',
      activePillClass:
        'bg-red-600 text-white font-black border-red-300 shadow-lg shadow-red-600/40 ring-2 ring-red-400/70',
      idlePillClass:
        'bg-red-950/70 text-red-300 border-red-500/50 hover:bg-red-900/80 hover:border-red-400',
      selectClass:
        'bg-red-600 text-white border-red-300 font-black shadow-md shadow-red-600/40 focus:ring-red-400',
      cardClass:
        'bg-gradient-to-r from-red-950/90 via-rose-950/85 to-red-950/90 hover:from-red-900/90 hover:to-red-900/90 border-red-500 border-l-4 border-l-red-500 shadow-lg shadow-red-950/50 ring-1 ring-red-500/40',
      rowClass:
        'bg-red-950/65 hover:bg-red-900/75 border-l-4 border-l-red-500',
      printBadgeClass: 'bg-red-600 text-white border-red-800 font-black',
    };
  }

  if (p === 'high') {
    return {
      priority: 'high',
      label: 'HIGH',
      shortLabel: 'High',
      description: 'Little Red — Elevated Priority',
      badgeClass:
        'bg-rose-500/25 text-rose-200 border-rose-400/70 shadow-sm shadow-rose-500/20 font-bold',
      dotClass: 'bg-rose-400 ring-2 ring-rose-300/50',
      activePillClass:
        'bg-rose-500/35 text-rose-100 font-black border-rose-400 shadow-md shadow-rose-500/25 ring-2 ring-rose-400/50',
      idlePillClass:
        'bg-rose-950/45 text-rose-300 border-rose-500/40 hover:bg-rose-900/60 hover:border-rose-400',
      selectClass:
        'bg-rose-950/65 text-rose-200 border-rose-400/80 font-bold shadow-sm shadow-rose-500/20 focus:ring-rose-400',
      cardClass:
        'bg-rose-950/35 hover:bg-rose-950/50 border-rose-400/60 border-l-4 border-l-rose-400 shadow-md shadow-rose-950/30',
      rowClass:
        'bg-rose-950/25 hover:bg-rose-950/40 border-l-4 border-l-rose-400',
      printBadgeClass: 'bg-rose-100 text-rose-900 border-rose-500 font-bold',
    };
  }

  return {
    priority: 'normal',
    label: 'NORMAL',
    shortLabel: 'Normal',
    description: 'White — Standard Requisition',
    badgeClass:
      'bg-white text-slate-950 border-white shadow-sm shadow-white/25 font-black',
    dotClass: 'bg-slate-900 ring-2 ring-slate-400/60',
    activePillClass:
      'bg-white text-slate-950 font-black border-white shadow-md shadow-white/30 ring-2 ring-white/70',
    idlePillClass:
      'bg-white/10 text-white border-white/40 hover:bg-white/20 hover:border-white',
    selectClass:
      'bg-white text-slate-950 border-white font-black shadow-sm shadow-white/20 focus:ring-white',
    cardClass:
      'bg-white/[0.07] hover:bg-white/[0.11] border-white/60 border-l-4 border-l-white shadow-md shadow-white/5',
    rowClass:
      'bg-white/[0.05] hover:bg-white/[0.09] border-l-4 border-l-white',
    printBadgeClass: 'bg-white text-black border-black font-black',
  };
}


