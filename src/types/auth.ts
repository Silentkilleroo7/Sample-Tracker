import { SampleStage } from './sample';

export type UserRole = 'merchandiser' | 'sewing' | 'wash';

export interface AppUser {
  id: string;
  username: string;
  displayName: string;
  password: string;
  role: UserRole;
  department: string;
  permissionsSummary: string;
  lastLoginAt?: string;
}

/**
 * Official 6 System Users:
 * - 4 Merchandiser users: zahid, animesh, rakib, hasan (full general user access)
 * - 1 Sewing user: sohag (sees Requisition status samples only + Fabric Inventory in View Mode; moves Requisition -> Sewing only)
 * - 1 Wash user: arian (sees Sewing/Wash status samples only; moves Sewing -> Wash and Wash -> Finishing only)
 */
export const SYSTEM_USERS: AppUser[] = [
  {
    id: 'usr-merchandiser-zahid',
    username: 'zahid',
    displayName: 'Zahid',
    password: 'zahid1234',
    role: 'merchandiser',
    department: 'Merchandising Department',
    permissionsSummary:
      'Full General User Access — Create requisitions, manage all sample stages, fabric inventory, BV lab tests & approvals.',
  },
  {
    id: 'usr-merchandiser-animesh',
    username: 'animesh',
    displayName: 'Animesh',
    password: 'animesh2345',
    role: 'merchandiser',
    department: 'Merchandising Department',
    permissionsSummary:
      'Full General User Access — Create requisitions, manage all sample stages, fabric inventory, BV lab tests & approvals.',
  },
  {
    id: 'usr-merchandiser-rakib',
    username: 'rakib',
    displayName: 'Rakib',
    password: 'rakib3456',
    role: 'merchandiser',
    department: 'Merchandising Department',
    permissionsSummary:
      'Full General User Access — Create requisitions, manage all sample stages, fabric inventory, BV lab tests & approvals.',
  },
  {
    id: 'usr-merchandiser-hasan',
    username: 'hasan',
    displayName: 'Hasan',
    password: 'hasan4567',
    role: 'merchandiser',
    department: 'Merchandising Department',
    permissionsSummary:
      'Full General User Access — Create requisitions, manage all sample stages, fabric inventory, BV lab tests & approvals.',
  },
  {
    id: 'usr-sewing-sohag',
    username: 'sohag',
    displayName: 'Sohag',
    password: 'sohag5678',
    role: 'sewing',
    department: 'Sewing Floor Section',
    permissionsSummary:
      'Sewing Restricted Access — View Requisition status samples only, move Requisition → Sewing Status only, and view Fabric Inventory (View-Only Mode, no edit access).',
  },
  {
    id: 'usr-wash-arian',
    username: 'arian',
    displayName: 'Arian',
    password: 'arian6789',
    role: 'wash',
    department: 'Washing & Wet Processing Plant',
    permissionsSummary:
      'Wash Restricted Access — View Sewing Status samples (and active Wash samples) only; move Sewing → Wash and Wash → Finishing only.',
  },
];

export const ROLE_BADGE_CONFIG: Record<
  UserRole,
  {
    label: string;
    shortLabel: string;
    badgeClass: string;
    dotClass: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
  }
> = {
  merchandiser: {
    label: 'Merchandiser (Full Access)',
    shortLabel: 'Merchandiser',
    badgeClass:
      'bg-indigo-500/20 text-indigo-200 border-indigo-400/50 shadow-sm shadow-indigo-500/10',
    dotClass: 'bg-indigo-400',
    bgClass: 'bg-indigo-500/20',
    textClass: 'text-indigo-200',
    borderClass: 'border-indigo-400/50',
  },
  sewing: {
    label: 'Sewing User (Req → Sewing Only)',
    shortLabel: 'Sewing',
    badgeClass:
      'bg-purple-500/20 text-purple-200 border-purple-400/50 shadow-sm shadow-purple-500/10',
    dotClass: 'bg-purple-400',
    bgClass: 'bg-purple-500/20',
    textClass: 'text-purple-200',
    borderClass: 'border-purple-400/50',
  },
  wash: {
    label: 'Wash User (Sewing → Wash → Finishing)',
    shortLabel: 'Wash',
    badgeClass:
      'bg-cyan-500/20 text-cyan-200 border-cyan-400/50 shadow-sm shadow-cyan-500/10',
    dotClass: 'bg-cyan-400',
    bgClass: 'bg-cyan-500/20',
    textClass: 'text-cyan-200',
    borderClass: 'border-cyan-400/50',
  },
};

export function canUserMakeAllChanges(role: UserRole): boolean {
  return role === 'merchandiser';
}

export function canUserAccessFabricInventory(role: UserRole): boolean {
  return role === 'merchandiser' || role === 'sewing';
}

export function isFabricInventoryViewOnly(role: UserRole): boolean {
  return role !== 'merchandiser';
}

export function canUserAdvanceSampleStage(
  role: UserRole,
  currentStage: SampleStage,
  targetStage?: SampleStage
): boolean {
  if (role === 'merchandiser') {
    return true;
  }
  if (role === 'sewing') {
    if (targetStage) {
      return currentStage === 'requisition' && targetStage === 'sewing';
    }
    return currentStage === 'requisition';
  }
  if (role === 'wash') {
    if (targetStage) {
      return (
        (currentStage === 'sewing' && targetStage === 'wash') ||
        (currentStage === 'wash' && targetStage === 'finishing')
      );
    }
    return currentStage === 'sewing' || currentStage === 'wash';
  }
  return false;
}

export const canUserAdvanceStage = canUserAdvanceSampleStage;

export function filterSamplesForUserRole<T extends { stage: SampleStage }>(
  samples: T[],
  role: UserRole
): T[] {
  if (role === 'merchandiser') {
    return samples;
  }
  if (role === 'sewing') {
    // Sewing user sees Requisition status samples only
    return samples.filter((s) => s.stage === 'requisition');
  }
  if (role === 'wash') {
    // Wash user sees Sewing status samples (to move Sewing -> Wash) and Wash status samples (to move Wash -> Finishing)
    return samples.filter((s) => s.stage === 'sewing' || s.stage === 'wash');
  }
  return samples;
}
