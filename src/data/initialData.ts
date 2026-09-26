import { FabricItem } from '../types/fabric';
import { SampleItem } from '../types/sample';
import { PushNotification } from '../types/notification';

/**
 * Clean initial state for live production deployment (Vercel + Supabase).
 * All demo/mock records have been removed so the database starts fresh.
 */
export const INITIAL_FABRICS: FabricItem[] = [];

export const INITIAL_SAMPLES: SampleItem[] = [];

export const INITIAL_NOTIFICATIONS: PushNotification[] = [];
