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

export const INITIAL_REQUISITION_OPTIONS: RequisitionOptions = {
  buyers: [
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
  ],
  lineCodes: [
    { code: 'LINE-A01', label: 'LINE-A01 (Woven Tops)' },
    { code: 'LINE-A02', label: 'LINE-A02 (Shirts)' },
    { code: 'LINE-B02', label: 'LINE-B02 (Chino Bottoms)' },
    { code: 'LINE-B05', label: 'LINE-B05 (Cargo Pants)' },
    { code: 'LINE-D01', label: 'LINE-D01 (Rigid Denim)' },
    { code: 'LINE-D02', label: 'LINE-D02 (Stretch Denim)' },
    { code: 'LINE-D03', label: 'LINE-D03 (Denim Jackets)' },
    { code: 'LINE-K01', label: 'LINE-K01 (Heavy Knits / Hoodies)' },
    { code: 'LINE-K04', label: 'LINE-K04 (T-Shirts / Jersey)' },
  ],
  sampleTypes: [
    'Proto Sample',
    'Fit Sample',
    'Salesman Sample (SMS)',
    'Red Seal Sample',
    'TOP Sample',
    'Gold Seal Sample',
    'Size Set Sample',
    'Photo Shoot Sample',
  ],
  sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38'],
  colors: [
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
  ],
  washTypes: [
    'Bio-Enzyme Stone Wash',
    'Bleach Stone Wash',
    'Vintage Acid Burnout Wash',
    'Ozone Cold Bleach Rinse',
    'Neutral Enzyme Bath + Softening',
    'Resin 3D Whiskers + Tint',
    'Raw / Rinse Wash',
    'Super Heavy Enzyme + Destroy',
    'Silicone Peach Soft Finish',
  ],
  couriers: [
    'DHL Express Worldwide',
    'FedEx Priority',
    'UPS Worldwide Express',
    'Aramex Global',
    'TNT Express',
  ],
};

const STORAGE_KEY = 'threadtrack_live_req_options_v1';

export function loadRequisitionOptions(): RequisitionOptions {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with defaults to ensure all keys and Red Seal are present
      return {
        buyers: Array.from(new Set([...INITIAL_REQUISITION_OPTIONS.buyers, ...(parsed.buyers || [])])),
        lineCodes: [
          ...INITIAL_REQUISITION_OPTIONS.lineCodes,
          ...(parsed.lineCodes || []).filter(
            (c: LineCodeOption) =>
              !INITIAL_REQUISITION_OPTIONS.lineCodes.some((ic) => ic.code === c.code)
          ),
        ],
        sampleTypes: Array.from(
          new Set([
            ...INITIAL_REQUISITION_OPTIONS.sampleTypes,
            ...(parsed.sampleTypes || []).filter((t: string) => t !== 'Pre-Production (PP)'),
          ])
        ),
        sizes: Array.from(new Set([...INITIAL_REQUISITION_OPTIONS.sizes, ...(parsed.sizes || [])])),
        colors: Array.from(new Set([...INITIAL_REQUISITION_OPTIONS.colors, ...(parsed.colors || [])])),
        washTypes: Array.from(
          new Set([...INITIAL_REQUISITION_OPTIONS.washTypes, ...(parsed.washTypes || [])])
        ),
        couriers: Array.from(new Set([...INITIAL_REQUISITION_OPTIONS.couriers, ...(parsed.couriers || [])])),
      };
    }
  } catch (e) {
    console.error('Failed to load requisition options:', e);
  }
  return INITIAL_REQUISITION_OPTIONS;
}

export async function syncRequisitionOptionsFromCloud(): Promise<RequisitionOptions> {
  const cloudOptions = await fetchRequisitionOptionsFromSupabase();
  if (cloudOptions) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudOptions));
    return cloudOptions;
  }
  return loadRequisitionOptions();
}

export function saveRequisitionOptions(options: RequisitionOptions): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
    void saveRequisitionOptionsToSupabase(options);
  } catch (e) {
    console.error('Failed to save requisition options:', e);
  }
}
