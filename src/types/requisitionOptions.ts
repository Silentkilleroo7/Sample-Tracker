import {
  fetchRequisitionOptionsFromSupabase,
  saveRequisitionOptionsToSupabase,
} from '../lib/supabase';

export interface LineCodeOption {
  code: string;
  label: string;
}

export interface RequisitionOptions {
  buyers: string[];
  lineCodes: LineCodeOption[];
  sampleTypes: string[];
  sizes: string[];
  colors: string[];
  washTypes: string[];
  couriers: string[];
}

/**
 * Clean initial state with zero mock data.
 * Users input and list their own Buyers, Line Codes, Sample Types, Sizes, Colors, Wash Types, and Couriers.
 */
export const INITIAL_REQUISITION_OPTIONS: RequisitionOptions = {
  buyers: [],
  lineCodes: [],
  sampleTypes: [],
  sizes: [],
  colors: [],
  washTypes: [],
  couriers: [],
};

const LEGACY_MOCK_BUYERS = new Set([
  'Levi Strauss & Co.',
  'Zara / Inditex',
  'Tommy Hilfiger',
  'COS / H&M Group',
  'Represent Clo / UK',
  'Urban Outfitters',
  'Club Monaco',
  'Massimo Dutti',
  'Nudie Jeans Co.',
  'G-Star RAW',
  'Calvin Klein Jeans',
]);

const LEGACY_MOCK_COLORS = new Set([
  'Vintage Indigo',
  'Desert Sand Khaki',
  'Washed Black Carbon',
  'Vintage Bone / Ecru',
  'Raw Indigo',
  'Washed Olive',
  'Bleach Blue',
  'Natural Ecru',
  'Charcoal Heather',
  'Dusty Sage',
]);

const LEGACY_MOCK_WASHES = new Set([
  'Bio-Enzyme Stone Wash',
  'Bleach Stone Wash',
  'Vintage Acid Burnout Wash',
  'Ozone Cold Bleach Rinse',
  'Neutral Enzyme Bath + Softening',
  'Resin 3D Whiskers + Tint',
  'Raw / Rinse Wash',
  'Super Heavy Enzyme + Destroy',
  'Silicone Peach Soft Finish',
]);

const LEGACY_MOCK_LINES = new Set([
  'LINE-A01',
  'LINE-A02',
  'LINE-B02',
  'LINE-B05',
  'LINE-D01',
  'LINE-D02',
  'LINE-D03',
  'LINE-K01',
  'LINE-K04',
]);

const STORAGE_KEY = 'threadtrack_clean_req_options_v2';

function sanitizeOptions(raw: Partial<RequisitionOptions> | null | undefined): RequisitionOptions {
  if (!raw) return INITIAL_REQUISITION_OPTIONS;

  const buyers = Array.isArray(raw.buyers)
    ? raw.buyers.filter((b) => b && !LEGACY_MOCK_BUYERS.has(b))
    : [];
  const lineCodes = Array.isArray(raw.lineCodes)
    ? raw.lineCodes.filter((l) => l && l.code && !LEGACY_MOCK_LINES.has(l.code))
    : [];
  const sampleTypes = Array.isArray(raw.sampleTypes)
    ? raw.sampleTypes.filter(Boolean)
    : [];
  const sizes = Array.isArray(raw.sizes)
    ? raw.sizes.filter(Boolean)
    : [];
  const colors = Array.isArray(raw.colors)
    ? raw.colors.filter((c) => c && !LEGACY_MOCK_COLORS.has(c))
    : [];
  const washTypes = Array.isArray(raw.washTypes)
    ? raw.washTypes.filter((w) => w && !LEGACY_MOCK_WASHES.has(w))
    : [];
  const couriers = Array.isArray(raw.couriers)
    ? raw.couriers.filter(Boolean)
    : [];

  return {
    buyers: Array.from(new Set(buyers)),
    lineCodes,
    sampleTypes: Array.from(new Set(sampleTypes)),
    sizes: Array.from(new Set(sizes)),
    colors: Array.from(new Set(colors)),
    washTypes: Array.from(new Set(washTypes)),
    couriers: Array.from(new Set(couriers)),
  };
}

export function loadRequisitionOptions(): RequisitionOptions {
  try {
    // Remove legacy mock storage key if present
    localStorage.removeItem('threadtrack_live_req_options_v1');
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return sanitizeOptions(parsed);
    }
  } catch (e) {
    console.error('Failed to load requisition options:', e);
  }
  return INITIAL_REQUISITION_OPTIONS;
}

export async function syncRequisitionOptionsFromCloud(): Promise<RequisitionOptions> {
  const localOptions = loadRequisitionOptions();
  const cloudOptions = await fetchRequisitionOptionsFromSupabase();
  if (cloudOptions) {
    const cleanCloud = sanitizeOptions(cloudOptions);
    const mergedLineCodesMap = new Map<string, LineCodeOption>();
    [...cleanCloud.lineCodes, ...localOptions.lineCodes].forEach((lc) => {
      if (lc && lc.code) {
        mergedLineCodesMap.set(lc.code, lc);
      }
    });

    const merged: RequisitionOptions = {
      buyers: Array.from(new Set([...cleanCloud.buyers, ...localOptions.buyers])),
      lineCodes: Array.from(mergedLineCodesMap.values()),
      sampleTypes: Array.from(new Set([...cleanCloud.sampleTypes, ...localOptions.sampleTypes])),
      sizes: Array.from(new Set([...cleanCloud.sizes, ...localOptions.sizes])),
      colors: Array.from(new Set([...cleanCloud.colors, ...localOptions.colors])),
      washTypes: Array.from(new Set([...cleanCloud.washTypes, ...localOptions.washTypes])),
      couriers: Array.from(new Set([...cleanCloud.couriers, ...localOptions.couriers])),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  }
  return localOptions;
}

export function saveRequisitionOptions(options: RequisitionOptions): void {
  try {
    const clean = sanitizeOptions(options);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    void saveRequisitionOptionsToSupabase(clean);
  } catch (e) {
    console.error('Failed to save requisition options:', e);
  }
}
