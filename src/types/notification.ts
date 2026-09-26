export type NotificationType = 'info' | 'success' | 'warning' | 'critical';

export interface PushNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: string;
  read: boolean;
  sampleId?: string;
  fabricCode?: string;
  styleCode?: string;
}
