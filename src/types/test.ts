export type TestSampleType = 'garment' | 'fabric';

export type TestStatus = 'pending' | 'passed' | 'failed' | 'retest_pending' | 'retest_submitted';

export interface TestFailureDetail {
  parameter: string;
  standardValue: string;
  actualValue: string;
  reason: string;
}

export interface BVTestItem {
  id: string;
  sampleType: TestSampleType;
  // Link to Garment Sample or Fabric
  sampleId?: string;
  styleCode?: string;
  styleName?: string;
  poNumber?: string;
  fabricCode?: string;
  fabricName?: string;
  buyer: string;

  // BV Testing Agency details
  testingAgency: string; // e.g. "Bureau Veritas (BV) - Dhaka Consumer Products Lab"
  testPackage: string; // e.g. "Garment Performance & Eco-Chemical Package"
  testParameters: string[]; // e.g. ["pH-Value (ISO 3071)", "Dimensional Stability (Shrinkage)", "Colorfastness to Washing"]

  // Timeline Dates
  sentDate: string; // YYYY-MM-DD
  expectedDate: string; // YYYY-MM-DD
  resultDate?: string; // YYYY-MM-DD (Passed / Failed date)

  // Results & BV Report
  status: TestStatus;
  reportNumber?: string; // e.g. "BV-(8826) 249-0182"
  overallResult?: 'PASS' | 'FAIL' | 'PENDING';

  // Failure & Re-test Information
  failReason?: string; // e.g. "PH-Value fail: measured pH 8.8 (allowed 4.0 - 7.5)"
  failedParameters?: TestFailureDetail[];
  reTestRequired: boolean;
  failedTimestamp?: string; // ISO timestamp when marked failed

  // 24-Hour Re-submission Tracking
  resubmitDueTimestamp?: string; // ISO timestamp 24h after failure
  resubmittedDate?: string;
  resubmissionNotes?: string;
  previousReportNumber?: string;
  retestReportNumber?: string;
  retestResultDate?: string;

  // Additional Notes
  inspectorNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// Clean initial state for live production deployment (Vercel + Supabase)
export const INITIAL_BV_TESTS: BVTestItem[] = [];

// Helper to check if a failed BV test is overdue (>= 24 hours since failure) for re-submission
export function isTestOverdueForResubmission(test: BVTestItem): boolean {
  if (test.status !== 'failed' || !test.reTestRequired) return false;
  if (!test.failedTimestamp) return false;
  const elapsedMs = Date.now() - new Date(test.failedTimestamp).getTime();
  return elapsedMs >= 24 * 60 * 60 * 1000;
}

export function getHoursSinceFailure(test: BVTestItem): number {
  if (!test.failedTimestamp) return 0;
  const elapsedMs = Date.now() - new Date(test.failedTimestamp).getTime();
  return Math.max(0, Math.floor(elapsedMs / (1000 * 60 * 60)));
}

export function get24HCountdownText(test: BVTestItem): {
  isOverdue: boolean;
  hours: number;
  label: string;
} {
  if (!test.failedTimestamp) {
    return { isOverdue: false, hours: 0, label: 'Pending timestamp' };
  }
  const elapsedHours = (Date.now() - new Date(test.failedTimestamp).getTime()) / (1000 * 60 * 60);
  if (elapsedHours >= 24) {
    const overdueBy = Math.floor(elapsedHours - 24);
    return {
      isOverdue: true,
      hours: Math.floor(elapsedHours),
      label: `24H Overdue! (${Math.floor(elapsedHours)}h elapsed, +${overdueBy}h past 24h deadline)`,
    };
  }
  const remainingHours = Math.ceil(24 - elapsedHours);
  return {
    isOverdue: false,
    hours: Math.floor(elapsedHours),
    label: `${remainingHours}h remaining to resubmit within 24h window`,
  };
}
