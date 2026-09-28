import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  SampleItem,
  getSampleImage,
  getSampleTypeTone,
  getEffectiveSizeBreakdown,
  getEffectivePerPcsConsumption,
} from '../types/sample';
import { FabricItem } from '../types/fabric';
import { BVTestItem } from '../types/test';
import { PushNotification } from '../types/notification';
import { RequisitionOptions, INITIAL_REQUISITION_OPTIONS } from '../types/requisitionOptions';
import { AppUser, SYSTEM_USERS } from '../types/auth';

const env = (import.meta.env || {}) as Record<string, string | undefined>;

function sanitizeEnvValue(val?: string): string {
  if (!val || typeof val !== 'string') return '';
  return val
    .trim()
    .replace(/^['"`]+|['"`]+$/g, '')
    .trim();
}

function normalizeSupabaseUrl(raw: string): string {
  const cleaned = sanitizeEnvValue(raw).replace(/\/+$/, '');
  if (
    !cleaned ||
    cleaned.includes('your-project-ref') ||
    cleaned === 'undefined' ||
    cleaned === 'null'
  ) {
    return '';
  }

  let candidate = cleaned;
  if (!/^https?:\/\//i.test(candidate)) {
    if (candidate.includes('.supabase.co') || candidate.includes('.supabase.in')) {
      candidate = `https://${candidate}`;
    } else if (/^[a-z0-9]{15,30}$/i.test(candidate)) {
      candidate = `https://${candidate}.supabase.co`;
    } else {
      return '';
    }
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '';
    }
    return parsed.origin;
  } catch {
    return '';
  }
}

const rawUrl =
  env.VITE_SUPABASE_URL ||
  env.NEXT_PUBLIC_SUPABASE_URL ||
  env.SUPABASE_URL ||
  '';

const rawAnonKey =
  env.VITE_SUPABASE_ANON_KEY ||
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  env.SUPABASE_ANON_KEY ||
  env.SUPABASE_KEY ||
  '';

const supabaseUrl = normalizeSupabaseUrl(rawUrl);
const supabaseAnonKey = sanitizeEnvValue(rawAnonKey);

export const isSupabaseConfigured =
  Boolean(supabaseUrl && supabaseAnonKey) &&
  !supabaseAnonKey.includes('your-supabase-anon') &&
  supabaseAnonKey !== 'undefined' &&
  supabaseAnonKey !== 'null';

function initSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  try {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        fetch: (...args) => globalThis.fetch(...args),
      },
    });
  } catch (err) {
    console.error('Supabase client initialization failed safely:', err);
    return null;
  }
}

export const supabase: SupabaseClient | null = initSupabaseClient();

export const STYLE_PHOTOS_BUCKET = 'style-photos';

// ============================================================================
// 1. ROW MAPPERS (CamelCase TypeScript <-> snake_case PostgreSQL)
// ============================================================================

export function mapRowToSample(row: any): SampleItem {
  const reqForm = row.requisition_form || undefined;
  const pDetails = row.parcel_details || {};
  const aDetails = row.approval_details || {};

  const effectiveShipmentDate =
    row.shipment_date ||
    reqForm?.shipmentDate ||
    pDetails?.shipmentDate ||
    row.target_parcel_date ||
    '';

  const isLocked =
    row.is_requisition_locked !== undefined
      ? Boolean(row.is_requisition_locked)
      : reqForm?.isLocked !== undefined
      ? Boolean(reqForm.isLocked)
      : Boolean(pDetails?.isRequisitionLocked);

  const effectiveThreadNote =
    row.thread_note ||
    reqForm?.threadNote ||
    reqForm?.trims?.threadNote ||
    reqForm?.threadInstruction ||
    '';
  const effectiveZipperNote =
    row.zipper_note ||
    reqForm?.zipperNote ||
    reqForm?.trims?.zipperNote ||
    '';
  const effectiveButtonNote =
    row.button_note ||
    reqForm?.buttonNote ||
    reqForm?.trims?.buttonNote ||
    '';

  const sample: SampleItem = {
    id: row.id,
    styleCode: row.style_code || '',
    styleName: row.style_name || '',
    buyer: row.buyer || '',
    poNumber: row.po_number || '',
    lineCode: row.line_code || '',
    sampleType: row.sample_type || 'Red Seal Sample',
    color: row.color || '',
    size: row.size || '',
    sizeBreakdown: Array.isArray(row.size_breakdown)
      ? row.size_breakdown
      : Array.isArray(reqForm?.sizeBreakdown)
      ? reqForm.sizeBreakdown
      : undefined,
    quantity: Number(row.quantity ?? 1),
    fabricId: row.fabric_id || '',
    fabricCode: row.fabric_code || '',
    fabricName: row.fabric_name || '',
    perPcsConsumptionYards:
      Number(row.per_pcs_consumption_yards ?? reqForm?.perPcsConsumptionYards ?? 0) || undefined,
    fabricRequiredYards: Number(row.fabric_required_yards ?? 0),
    threadNote: effectiveThreadNote,
    zipperNote: effectiveZipperNote,
    buttonNote: effectiveButtonNote,
    stage: row.stage || 'requisition',
    priority: row.priority || 'normal',
    targetParcelDate: row.target_parcel_date || '',
    shipmentDate: effectiveShipmentDate,
    isRequisitionLocked: isLocked,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    thumbnail: row.thumbnail || undefined,
    images: Array.isArray(row.images) ? row.images : [],
    stageHistory: Array.isArray(row.stage_history) ? row.stage_history : [],
    sewingOperator: row.sewing_operator || undefined,
    washDetails: row.wash_details || {
      washType: 'Standard Wash',
      washTechnician: '',
      washFormula: '',
    },
    finishingDetails: row.finishing_details || {
      finishingLine: 'Finishing Line #1',
      supervisor: '',
      ironingDone: false,
      threadTrimmingDone: false,
      taggingDone: false,
      qualityPassed: false,
    },
    parcelDetails: {
      courier: pDetails.courier || 'DHL Express Worldwide',
      trackingNumber: pDetails.trackingNumber || '',
      parcelDate: pDetails.parcelDate || row.target_parcel_date || '',
      recipient: pDetails.recipient || '',
      destinationCountry: pDetails.destinationCountry || '',
      dispatchStatus: pDetails.dispatchStatus || 'pending',
      workbookSent: Boolean(pDetails.workbookSent),
      workbookSentDate: pDetails.workbookSentDate,
      workbookSentBy: pDetails.workbookSentBy,
      workbookNotes: pDetails.workbookNotes,
      followUp: pDetails.followUp,
    },
    approvalDetails: {
      washComments: aDetails.washComments || '',
      washApproved: Boolean(aDetails.washApproved),
      trimsComments: aDetails.trimsComments || '',
      trimsApproved: Boolean(aDetails.trimsApproved),
      accessoriesComments: aDetails.accessoriesComments || '',
      accessoriesApproved: Boolean(aDetails.accessoriesApproved),
      buttonApproved:
        aDetails.buttonApproved !== undefined
          ? Boolean(aDetails.buttonApproved)
          : Boolean(aDetails.accessoriesApproved),
      threadApproved:
        aDetails.threadApproved !== undefined
          ? Boolean(aDetails.threadApproved)
          : Boolean(aDetails.trimsApproved),
      zipperApproved:
        aDetails.zipperApproved !== undefined
          ? Boolean(aDetails.zipperApproved)
          : Boolean(aDetails.accessoriesApproved),
      labelApproved:
        aDetails.labelApproved !== undefined
          ? Boolean(aDetails.labelApproved)
          : Boolean(aDetails.trimsApproved),
      overallVerdict: aDetails.overallVerdict || 'pending',
      reviewedBy: aDetails.reviewedBy,
      reviewedAt: aDetails.reviewedAt,
      generalRemarks: aDetails.generalRemarks,
    },
    requisitionForm: reqForm
      ? {
          ...reqForm,
          shipmentDate: reqForm.shipmentDate || effectiveShipmentDate,
          threadNote: effectiveThreadNote,
          zipperNote: effectiveZipperNote,
          buttonNote: effectiveButtonNote,
          trims: {
            ...(reqForm.trims || {}),
            threadNote: reqForm.trims?.threadNote || effectiveThreadNote,
            zipperNote: reqForm.trims?.zipperNote || effectiveZipperNote,
            buttonNote: reqForm.trims?.buttonNote || effectiveButtonNote,
          },
          isLocked,
        }
      : undefined,
  };

  const selectedImg = sample.thumbnail?.trim() || (sample.images && sample.images[0]?.trim()) || '';
  sample.thumbnail = selectedImg || undefined;
  sample.images = selectedImg ? [selectedImg] : [];
  return sample;
}

export function mapSampleToRow(sample: SampleItem) {
  const effectiveShipmentDate =
    sample.shipmentDate ||
    sample.requisitionForm?.shipmentDate ||
    sample.targetParcelDate ||
    '';
  const isLocked = Boolean(
    sample.isRequisitionLocked || sample.requisitionForm?.isLocked
  );

  const effectiveThreadNote =
    sample.threadNote ||
    sample.requisitionForm?.trims?.threadNote ||
    sample.requisitionForm?.threadNote ||
    sample.requisitionForm?.threadInstruction ||
    '';
  const effectiveZipperNote =
    sample.zipperNote ||
    sample.requisitionForm?.trims?.zipperNote ||
    sample.requisitionForm?.zipperNote ||
    '';
  const effectiveButtonNote =
    sample.buttonNote ||
    sample.requisitionForm?.trims?.buttonNote ||
    sample.requisitionForm?.buttonNote ||
    '';

  const enrichedParcelDetails = {
    ...(sample.parcelDetails || {}),
    shipmentDate: effectiveShipmentDate,
    isRequisitionLocked: isLocked,
  };

  const effectiveSizeBreakdown = getEffectiveSizeBreakdown(sample);
  const effectivePerPcsConsumption = getEffectivePerPcsConsumption(sample);

  const enrichedRequisitionForm = sample.requisitionForm
    ? {
        ...sample.requisitionForm,
        perPcsConsumptionYards:
          sample.requisitionForm.perPcsConsumptionYards || effectivePerPcsConsumption,
        fabricRequiredYards: sample.fabricRequiredYards,
        sizeBreakdown:
          sample.requisitionForm.sizeBreakdown &&
          sample.requisitionForm.sizeBreakdown.length > 0
            ? sample.requisitionForm.sizeBreakdown
            : effectiveSizeBreakdown,
        shipmentDate: effectiveShipmentDate,
        threadNote: effectiveThreadNote,
        zipperNote: effectiveZipperNote,
        buttonNote: effectiveButtonNote,
        trims: {
          ...(sample.requisitionForm.trims || {}),
          threadNote: sample.requisitionForm.trims?.threadNote || effectiveThreadNote,
          zipperNote: sample.requisitionForm.trims?.zipperNote || effectiveZipperNote,
          buttonNote: sample.requisitionForm.trims?.buttonNote || effectiveButtonNote,
        },
        isLocked,
      }
    : {
        perPcsConsumptionYards: effectivePerPcsConsumption,
        fabricRequiredYards: sample.fabricRequiredYards,
        shipmentDate: effectiveShipmentDate,
        threadNote: effectiveThreadNote,
        zipperNote: effectiveZipperNote,
        buttonNote: effectiveButtonNote,
        isLocked,
      };

  const toneCategory = getSampleTypeTone(sample.sampleType).category;
  const sampleColorTone =
    toneCategory === 'gold'
      ? 'gold'
      : toneCategory === 'red'
      ? 'red'
      : toneCategory === 'initial'
      ? 'white'
      : 'default';

  return {
    id: sample.id,
    style_code: sample.styleCode,
    style_name: sample.styleName,
    buyer: sample.buyer,
    po_number: sample.poNumber,
    line_code: sample.lineCode,
    sample_type: sample.sampleType,
    sample_color_tone: sampleColorTone,
    color: sample.color,
    size: sample.size,
    size_breakdown: effectiveSizeBreakdown,
    quantity: sample.quantity,
    fabric_id: sample.fabricId,
    fabric_code: sample.fabricCode,
    fabric_name: sample.fabricName,
    per_pcs_consumption_yards: effectivePerPcsConsumption,
    fabric_required_yards: sample.fabricRequiredYards,
    thread_note: effectiveThreadNote,
    zipper_note: effectiveZipperNote,
    button_note: effectiveButtonNote,
    stage: sample.stage,
    priority: sample.priority,
    target_parcel_date: sample.targetParcelDate,
    shipment_date: effectiveShipmentDate,
    is_requisition_locked: isLocked,
    thumbnail: sample.thumbnail || null,
    images: sample.thumbnail ? [sample.thumbnail] : [],
    stage_history: sample.stageHistory || [],
    sewing_operator: sample.sewingOperator || null,
    wash_details: sample.washDetails || {},
    finishing_details: sample.finishingDetails || {},
    parcel_details: enrichedParcelDetails,
    approval_details: sample.approvalDetails || {},
    requisition_form: enrichedRequisitionForm,
    created_at: sample.createdAt || new Date().toISOString(),
    updated_at: sample.updatedAt || new Date().toISOString(),
  };
}

export function mapRowToFabric(row: any): FabricItem {
  return {
    id: row.id,
    code: row.code || '',
    name: row.name || '',
    linkedStyleCodes: Array.isArray(row.linked_style_codes) ? row.linked_style_codes : [],
    composition: row.composition || '',
    color: row.color || '',
    gsm: Number(row.gsm ?? 0),
    widthInches: Number(row.width_inches ?? 58),
    availableYards: Number(row.available_yards ?? 0),
    allocatedYards: Number(row.allocated_yards ?? 0),
    perPcsConsumptionYards: Number(row.per_pcs_consumption_yards ?? 0) || undefined,
    styleConsumptionMap:
      row.style_consumption_map && typeof row.style_consumption_map === 'object'
        ? row.style_consumption_map
        : undefined,
    minimumThresholdYards: Number(row.minimum_threshold_yards ?? 5),
    supplier: row.supplier || '',
    location: row.location || '',
    lastReceivedDate: row.last_received_date || '',
  };
}

export function mapFabricToRow(fabric: FabricItem) {
  return {
    id: fabric.id,
    code: fabric.code,
    name: fabric.name,
    linked_style_codes: fabric.linkedStyleCodes || [],
    composition: fabric.composition,
    color: fabric.color,
    gsm: fabric.gsm,
    width_inches: fabric.widthInches,
    available_yards: fabric.availableYards,
    allocated_yards: fabric.allocatedYards,
    per_pcs_consumption_yards: fabric.perPcsConsumptionYards ?? 0,
    style_consumption_map: fabric.styleConsumptionMap || {},
    minimum_threshold_yards: fabric.minimumThresholdYards ?? 5,
    supplier: fabric.supplier,
    location: fabric.location,
    last_received_date: fabric.lastReceivedDate,
    updated_at: new Date().toISOString(),
  };
}

export function mapRowToBVTest(row: any): BVTestItem {
  return {
    id: row.id,
    sampleType: row.sample_type || 'garment',
    sampleId: row.sample_id || undefined,
    styleCode: row.style_code || undefined,
    styleName: row.style_name || undefined,
    poNumber: row.po_number || undefined,
    fabricCode: row.fabric_code || undefined,
    fabricName: row.fabric_name || undefined,
    buyer: row.buyer || '',
    testingAgency: row.testing_agency || '',
    testPackage: row.test_package || '',
    testParameters: Array.isArray(row.test_parameters) ? row.test_parameters : [],
    sentDate: row.sent_date || '',
    expectedDate: row.expected_date || '',
    resultDate: row.result_date || undefined,
    status: row.status || 'pending',
    reportNumber: row.report_number || undefined,
    overallResult: row.overall_result || 'PENDING',
    failReason: row.fail_reason || undefined,
    failedParameters: Array.isArray(row.failed_parameters) ? row.failed_parameters : [],
    reTestRequired: Boolean(row.re_test_required),
    failedTimestamp: row.failed_timestamp || undefined,
    resubmitDueTimestamp: row.resubmit_due_timestamp || undefined,
    resubmittedDate: row.resubmitted_date || undefined,
    resubmissionNotes: row.resubmission_notes || undefined,
    previousReportNumber: row.previous_report_number || undefined,
    retestReportNumber: row.retest_report_number || undefined,
    retestResultDate: row.retest_result_date || undefined,
    inspectorNotes: row.inspector_notes || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export function mapBVTestToRow(test: BVTestItem) {
  return {
    id: test.id,
    sample_type: test.sampleType,
    sample_id: test.sampleId || null,
    style_code: test.styleCode || null,
    style_name: test.styleName || null,
    po_number: test.poNumber || null,
    fabric_code: test.fabricCode || null,
    fabric_name: test.fabricName || null,
    buyer: test.buyer,
    testing_agency: test.testingAgency,
    test_package: test.testPackage,
    test_parameters: test.testParameters || [],
    sent_date: test.sentDate,
    expected_date: test.expectedDate,
    result_date: test.resultDate || null,
    status: test.status,
    report_number: test.reportNumber || null,
    overall_result: test.overallResult || 'PENDING',
    fail_reason: test.failReason || null,
    failed_parameters: test.failedParameters || [],
    re_test_required: Boolean(test.reTestRequired),
    failed_timestamp: test.failedTimestamp || null,
    resubmit_due_timestamp: test.resubmitDueTimestamp || null,
    resubmitted_date: test.resubmittedDate || null,
    resubmission_notes: test.resubmissionNotes || null,
    previous_report_number: test.previousReportNumber || null,
    retest_report_number: test.retestReportNumber || null,
    retest_result_date: test.retestResultDate || null,
    inspector_notes: test.inspectorNotes || null,
    created_at: test.createdAt || new Date().toISOString(),
    updated_at: test.updatedAt || new Date().toISOString(),
  };
}

export function mapRowToNotification(row: any): PushNotification {
  return {
    id: row.id,
    title: row.title || '',
    message: row.message || '',
    type: row.type || 'info',
    timestamp: row.timestamp || new Date().toISOString(),
    read: Boolean(row.read),
    sampleId: row.sample_id || undefined,
    fabricCode: row.fabric_code || undefined,
    styleCode: row.style_code || undefined,
  };
}

export function mapNotificationToRow(notif: PushNotification) {
  return {
    id: notif.id,
    title: notif.title,
    message: notif.message,
    type: notif.type,
    timestamp: notif.timestamp,
    read: notif.read,
    sample_id: notif.sampleId || null,
    fabric_code: notif.fabricCode || null,
    style_code: notif.styleCode || null,
  };
}

// ============================================================================
// 2. SUPABASE CRUD OPERATIONS FOR ALL TABLES
// ============================================================================

export async function fetchAllSupabaseData(): Promise<{
  samples: SampleItem[];
  fabrics: FabricItem[];
  tests: BVTestItem[];
  notifications: PushNotification[];
} | null> {
  if (!supabase) return null;

  try {
    const [samplesRes, fabricsRes, testsRes, notifsRes] = await Promise.all([
      supabase.from('samples').select('*').order('created_at', { ascending: false }),
      supabase.from('fabrics').select('*').order('created_at', { ascending: false }),
      supabase.from('bv_tests').select('*').order('created_at', { ascending: false }),
      supabase.from('notifications').select('*').order('timestamp', { ascending: false }).limit(100),
    ]);

    if (samplesRes.error) console.error('Supabase samples fetch error:', samplesRes.error);
    if (fabricsRes.error) console.error('Supabase fabrics fetch error:', fabricsRes.error);
    if (testsRes.error) console.error('Supabase bv_tests fetch error:', testsRes.error);
    if (notifsRes.error) console.error('Supabase notifications fetch error:', notifsRes.error);

    return {
      samples: (samplesRes.data || []).map(mapRowToSample),
      fabrics: (fabricsRes.data || []).map(mapRowToFabric),
      tests: (testsRes.data || []).map(mapRowToBVTest),
      notifications: (notifsRes.data || []).map(mapRowToNotification),
    };
  } catch (err) {
    console.error('Failed to load initial data from Supabase:', err);
    return null;
  }
}

export async function upsertSampleInSupabase(sample: SampleItem): Promise<void> {
  if (!supabase) return;
  const fullRow = mapSampleToRow(sample);
  const { error } = await supabase.from('samples').upsert(fullRow);
  if (error) {
    // Fallback if new columns are not yet added to table
    const {
      thread_note,
      zipper_note,
      button_note,
      shipment_date,
      is_requisition_locked,
      sample_color_tone,
      size_breakdown,
      per_pcs_consumption_yards,
      ...legacyRow
    } = fullRow;
    const { error: fallbackErr } = await supabase.from('samples').upsert(legacyRow);
    if (fallbackErr) {
      console.error('Supabase upsert sample error:', fallbackErr);
    }
  }
}

/**
 * Direct deletion from the frontend system is disabled by policy.
 * Once data is inputted into the system, it is permanently retained.
 */
export async function deleteSampleFromSupabase(_sampleId: string): Promise<void> {
  console.warn('Direct deletion from the frontend system is disabled. Records are permanently retained.');
}

export async function upsertFabricInSupabase(fabric: FabricItem): Promise<void> {
  if (!supabase) return;
  const fullRow = mapFabricToRow(fabric);
  const { error } = await supabase.from('fabrics').upsert(fullRow);
  if (error) {
    const { per_pcs_consumption_yards, style_consumption_map, ...legacyRow } = fullRow;
    const { error: fallbackErr } = await supabase.from('fabrics').upsert(legacyRow);
    if (fallbackErr) console.error('Supabase upsert fabric error:', fallbackErr);
  }
}

export async function deleteFabricFromSupabase(_fabricId: string): Promise<void> {
  console.warn('Direct deletion from the frontend system is disabled. Records are permanently retained.');
}

export async function upsertBVTestInSupabase(test: BVTestItem): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('bv_tests').upsert(mapBVTestToRow(test));
  if (error) console.error('Supabase upsert bv_test error:', error);
}

export async function deleteBVTestFromSupabase(_testId: string): Promise<void> {
  console.warn('Direct deletion from the frontend system is disabled. Records are permanently retained.');
}

export async function insertNotificationInSupabase(notif: PushNotification): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('notifications').upsert(mapNotificationToRow(notif));
  if (error) console.error('Supabase insert notification error:', error);
}

export async function markNotificationReadInSupabase(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
  if (error) console.error('Supabase update notification error:', error);
}

export async function markAllNotificationsReadInSupabase(): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('notifications').update({ read: true }).eq('read', false);
  if (error) console.error('Supabase mark all notifications read error:', error);
}

export async function clearAllNotificationsInSupabase(): Promise<void> {
  if (!supabase) return;
  // Instead of deleting records, mark all notifications as read so audit logs are preserved
  const { error } = await supabase.from('notifications').update({ read: true }).eq('read', false);
  if (error) console.error('Supabase mark notifications read error:', error);
}

export async function clearAllDatabaseTablesInSupabase(): Promise<void> {
  console.warn('Direct database deletion from the frontend system is permanently disabled.');
}

// ============================================================================
// 3. REQUISITION OPTIONS SYNC (Buyers, Line Codes, Wash Types, Couriers)
// ============================================================================

export async function fetchRequisitionOptionsFromSupabase(): Promise<RequisitionOptions | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('requisition_options')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (error || !data) return null;
    return {
      buyers: Array.isArray(data.buyers) ? data.buyers : INITIAL_REQUISITION_OPTIONS.buyers,
      lineCodes: Array.isArray(data.line_codes) ? data.line_codes : INITIAL_REQUISITION_OPTIONS.lineCodes,
      sampleTypes: Array.isArray(data.sample_types) ? data.sample_types : INITIAL_REQUISITION_OPTIONS.sampleTypes,
      sizes: Array.isArray(data.sizes) ? data.sizes : INITIAL_REQUISITION_OPTIONS.sizes,
      colors: Array.isArray(data.colors) ? data.colors : INITIAL_REQUISITION_OPTIONS.colors,
      washTypes: Array.isArray(data.wash_types) ? data.wash_types : INITIAL_REQUISITION_OPTIONS.washTypes,
      couriers: Array.isArray(data.couriers) ? data.couriers : INITIAL_REQUISITION_OPTIONS.couriers,
      perPcsConsumptionYards: Number(data.per_pcs_consumption_yards ?? 0) || 0,
      styleConsumptionMap:
        data.style_consumption_map && typeof data.style_consumption_map === 'object'
          ? data.style_consumption_map
          : {},
    };
  } catch (err) {
    console.error('Supabase fetch requisition_options error:', err);
    return null;
  }
}

export async function saveRequisitionOptionsToSupabase(options: RequisitionOptions): Promise<void> {
  if (!supabase) return;
  try {
    const fullPayload = {
      id: 'default',
      buyers: options.buyers,
      line_codes: options.lineCodes,
      sample_types: options.sampleTypes,
      sizes: options.sizes,
      colors: options.colors,
      wash_types: options.washTypes,
      couriers: options.couriers,
      per_pcs_consumption_yards: options.perPcsConsumptionYards ?? 0,
      style_consumption_map: options.styleConsumptionMap || {},
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('requisition_options').upsert(fullPayload);
    if (error) {
      const { per_pcs_consumption_yards, style_consumption_map, ...legacyPayload } = fullPayload;
      await supabase.from('requisition_options').upsert(legacyPayload);
    }
  } catch (err) {
    console.error('Supabase save requisition_options exception:', err);
  }
}

// ============================================================================
// 3.5 ROLE-BASED USERS SYNC (Merchandiser: zahid, animesh, rakib, hasan | Sewing: sohag | Wash: arian)
// ============================================================================

export async function syncAppUsersWithSupabase(): Promise<AppUser[]> {
  if (!supabase) return SYSTEM_USERS;
  try {
    // Ensure the 6 default users are seeded in public.app_users
    const rowsToUpsert = SYSTEM_USERS.map((u) => ({
      id: u.id,
      username: u.username,
      display_name: u.displayName,
      password: u.password,
      role: u.role,
      department: u.department,
      permissions_summary: u.permissionsSummary,
      is_active: true,
      updated_at: new Date().toISOString(),
    }));

    await supabase.from('app_users').upsert(rowsToUpsert, { onConflict: 'username' });

    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('is_active', true);

    if (error || !data || data.length === 0) {
      return SYSTEM_USERS;
    }

    const mapped: AppUser[] = data.map((row: any) => ({
      id: row.id || `usr-${row.username}`,
      username: row.username,
      displayName: row.display_name || row.username,
      password: row.password,
      role: row.role,
      department: row.department || '',
      permissionsSummary: row.permissions_summary || '',
      lastLoginAt: row.last_login_at || undefined,
    }));

    // Merge with SYSTEM_USERS so all 6 required users are always present
    const byUsername = new Map<string, AppUser>();
    SYSTEM_USERS.forEach((u) => byUsername.set(u.username.toLowerCase(), u));
    mapped.forEach((u) => byUsername.set(u.username.toLowerCase(), u));
    return Array.from(byUsername.values());
  } catch {
    return SYSTEM_USERS;
  }
}

export async function recordUserLoginInSupabase(username: string): Promise<void> {
  if (!supabase) return;
  try {
    await supabase
      .from('app_users')
      .update({
        last_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('username', username.toLowerCase());
  } catch {
    // Ignore if table not yet migrated
  }
}

// ============================================================================
// 4. PRODUCT PHOTO UPLOAD TO SUPABASE STORAGE BUCKET ('style-photos')
// ============================================================================

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        resolve(e.target.result);
      } else {
        reject(new Error('Failed to read image file'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a style product photo directly to Supabase Storage ('style-photos' bucket)
 * and logs metadata in the 'style_photos' SQL table.
 * Automatically falls back to Data URL if Supabase is not configured or bucket is unreachable.
 */
export async function uploadStylePhoto(
  file: File,
  meta?: { sampleId?: string; styleCode?: string }
): Promise<{ url: string; storagePath?: string }> {
  if (supabase) {
    try {
      const cleanStyle = (meta?.styleCode || 'general')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .toUpperCase();
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const safeName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 40);
      const storagePath = `styles/${cleanStyle}/${Date.now()}_${safeName}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(STYLE_PHOTOS_BUCKET)
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || 'image/jpeg',
        });

      if (!uploadError) {
        const { data: pubData } = supabase.storage
          .from(STYLE_PHOTOS_BUCKET)
          .getPublicUrl(storagePath);

        if (pubData?.publicUrl) {
          // Also record the photo upload in the SQL style_photos table
          await supabase.from('style_photos').insert({
            sample_id: meta?.sampleId || null,
            style_code: meta?.styleCode || cleanStyle,
            storage_path: storagePath,
            public_url: pubData.publicUrl,
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type || 'image/jpeg',
          });

          return { url: pubData.publicUrl, storagePath };
        }
      } else {
        console.warn('Supabase storage upload warning, falling back to Data URL:', uploadError.message);
      }
    } catch (err) {
      console.warn('Supabase storage upload exception, falling back to Data URL:', err);
    }
  }

  const dataUrl = await readFileAsDataUrl(file);
  return { url: dataUrl };
}
