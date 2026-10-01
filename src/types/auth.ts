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
 * Official 8 System Users:
 * - 6 Merchandiser / General users: zahid, animesh, rakib, hasan, nishi, tohidul (full general user access)
 * - 1 Sewing & Fabric Viewer user: shohag (access from Requisition to Sewing + Fabric Inventory Viewer only)
 * - 1 Wash user: arian (sees Sewing/Wash status samples only; moves Sewing -> Wash and Wash -> Finishing only)
 */
export const REMOVED_USERNAMES: string[] = [];

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
    id: 'usr-merchandiser-nishi',
    username: 'nishi',
    displayName: 'Nishi',
    password: 'nishi5678',
    role: 'merchandiser',
    department: 'Merchandising Department',
    permissionsSummary:
      'Full General User Access — Create requisitions, manage all sample stages, fabric inventory, BV lab tests & approvals.',
  },
  {
    id: 'usr-merchandiser-tohidul',
    username: 'tohidul',
    displayName: 'Tohidul',
    password: 'tohidul7890',
    role: 'merchandiser',
    department: 'Merchandising Department',
    permissionsSummary:
      'Full General User Access — Create requisitions, manage all sample stages, fabric inventory, BV lab tests & approvals.',
  },
  {
    id: 'usr-sewing-shohag',
    username: 'shohag',
    displayName: 'Shohag',
    password: 'shohag8901',
    role: 'sewing',
    department: 'Sewing & Sample Room Department',
    permissionsSummary:
      'Requisition to Sewing & Fabric Inventory Viewer Only — Access Requisition & Sewing pages, move Requisition → Sewing only, and view Fabric Inventory (read-only).',
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
    badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-300',
    dotClass: 'bg-emerald-600',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-900',
    borderClass: 'border-emerald-300',
  },
  sewing: {
    label: 'Sewing & Fabric Viewer (Req → Sewing Only)',
    shortLabel: 'Sewing / Fabric Viewer',
    badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-300',
    dotClass: 'bg-emerald-600',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-900',
    borderClass: 'border-emerald-300',
  },
  wash: {
    label: 'Wash User (Sewing → Wash → Finishing)',
    shortLabel: 'Wash',
    badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-300',
    dotClass: 'bg-emerald-600',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-900',
    borderClass: 'border-emerald-300',
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
    // Sewing user accesses Requisition to Sewing status samples only
    return samples.filter((s) => s.stage === 'requisition' || s.stage === 'sewing');
  }
  if (role === 'wash') {
    // Wash user sees Sewing status samples (to move Sewing -> Wash) and Wash status samples (to move Wash -> Finishing)
    return samples.filter((s) => s.stage === 'sewing' || s.stage === 'wash');
  }
  return samples;
}
