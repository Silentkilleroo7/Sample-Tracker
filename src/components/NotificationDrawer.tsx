import React from 'react';
import { PushNotification } from '../types/notification';
import {
  X,
  Bell,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Info,
  Check,
  Trash2,
} from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: PushNotification[];
  onMarkAllAsRead: () => void;
  onClearNotifications: () => void;
  onNotificationClick: (notif: PushNotification) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onClearNotifications,
  onNotificationClick,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-white">
              Real-Time Push Notifications & Alerts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="px-4 py-2 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between text-xs">
          <button
            onClick={onMarkAllAsRead}
            className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            Mark all read
          </button>
          <button
            onClick={onClearNotifications}
            className="text-slate-400 hover:text-rose-400 flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear all
          </button>
        </div>

        {/* List of Notifications */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.map((notif) => {
            let icon = <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />;
            let borderClass = 'border-slate-800 bg-slate-800/40';

            if (notif.type === 'critical') {
              icon = <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 animate-pulse" />;
              borderClass = 'border-rose-500/40 bg-rose-950/30';
            } else if (notif.type === 'warning') {
              icon = <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />;
              borderClass = 'border-amber-500/30 bg-amber-950/20';
            } else if (notif.type === 'success') {
              icon = <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />;
              borderClass = 'border-emerald-500/30 bg-emerald-950/20';
            }

            return (
              <div
                key={notif.id}
                onClick={() => onNotificationClick(notif)}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all hover:border-slate-600 ${borderClass} ${
                  !notif.read ? 'ring-1 ring-indigo-500/30 font-medium' : 'opacity-80'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {icon}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4
                        className={`text-xs font-bold ${
                          notif.type === 'critical' ? 'text-rose-300' : 'text-white'
                        }`}
                      >
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(notif.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                    {(notif.styleCode || notif.fabricCode) && (
                      <div className="mt-2 flex items-center gap-2">
                        {notif.styleCode && (
                          <span className="px-1.5 py-0.5 rounded bg-black/40 text-[10px] font-mono font-bold text-indigo-300 border border-indigo-500/30">
                            {notif.styleCode}
                          </span>
                        )}
                        {notif.fabricCode && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-950/80 text-[10px] font-mono font-bold text-rose-300 border border-rose-500/30">
                            {notif.fabricCode}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {notifications.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-xs">
              No notifications or alerts.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
