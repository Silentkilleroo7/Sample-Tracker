export type SampleStage = 
  | 'requisition' 
  | 'sewing' 
  | 'wash' 
  | 'finishing' 
  | 'ready_for_parcel' 
  | 'approval_comments';

export type SamplePriority = 'urgent' | 'high' | 'normal';

export type SampleType = 
  | 'Proto Sample' 
  | 'Fit Sample' 
  | 'Salesman Sample (SMS)' 
  | 'Red Seal Sample' 
  | 'TOP Sample' 
  | 'Gold Seal Sample'
  | 'Pre-Production (PP)'; // legacy compatibility

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
  buckles: boolean;
  velcro: boolean;
  rivet: boolean;
  stud: boolean;
  thread: boolean;
  threadNote?: string;
  interlining: boolean;
  elastic: boolean;
  zipper: boolean;
  drawstring: boolean;
  stopperEyelet: boolean;
  snap: boolean;
  pocketing: boolean;
  pocketingNote?: string;
  customTrims?: { name: string; checked: boolean; note?: string }[];
}

export interface VolarRequisitionForm {
  companyName: string;
  date: string;
  requiredDate: string;
  buyer: string;
  requestedBy: string;
  priorityType: 'urgent' | 'normal';
  sampleType: string;
  descriptionCode: string;
  styleName: string;
  sampleSizeLabel: string;
  colorWash: string;
  fabricCode: string;
  fitting: string;
  threadInstruction: string;
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
  size: string; // e.g. "32/34", "M"
  quantity: number;
  fabricId: string;
  fabricCode: string;
  fabricName: string;
  fabricRequiredYards: number;
  stage: SampleStage;
  stageHistory: StageHistoryEntry[];
  priority: SamplePriority;
  targetParcelDate: string;
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

export function getSampleImage(sample: Partial<SampleItem>): string {
  if (sample.thumbnail && sample.thumbnail.trim() !== '') {
    return sample.thumbnail;
  }
  if (sample.images && sample.images.length > 0) {
    return sample.images[0];
  }
  // Deterministic fallback based on styleCode or id so every style always has a product picture
  const key = sample.styleCode || sample.id || 'default';
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PRESET_STYLE_IMAGES.length;
  return PRESET_STYLE_IMAGES[index].url;
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
