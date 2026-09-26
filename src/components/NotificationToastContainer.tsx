import React from 'react';
import { PushNotification } from '../types/notification';
import { AlertTriangle, CheckCircle2, Info, X, AlertOctagon } from 'lucide-react';

interface NotificationToastContainerProps {
  notifications: PushNotification[];
  onDismiss: (id: string) => void;
  onNotificationClick?: (notif: PushNotification) => void;
}

export const NotificationToastContainer: React.FC<NotificationToastContainerProps> = ({
  notifications,
  onDismiss,
  onNotificationClick,
}) => {
  // Show the latest 3 active unread notifications as floating toasts
  const activeToasts = notifications.filter((n) => !n.read).slice(0, 3);

  if (activeToasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {activeToasts.map((toast) => {
        let borderClass = 'border-blue-500/40 bg-slate-900/95 text-blue-200';
        let icon = <Info className="w-5 h-5 text-blue-400 shrink-0" />;

        if (toast.type === 'critical') {
          borderClass = 'border-rose-500/60 bg-rose-950/95 text-rose-100 shadow-rose-950/50';
          icon = <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 animate-pulse" />;
        } else if (toast.type === 'warning') {
          borderClass = 'border-amber-500/50 bg-amber-950/90 text-amber-100 shadow-amber-950/40';
          icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
        } else if (toast.type === 'success') {
          borderClass = 'border-emerald-500/50 bg-emerald-950/90 text-emerald-100 shadow-emerald-950/40';
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            onClick={() => onNotificationClick?.(toast)}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all transform hover:-translate-y-0.5 cursor-pointer ${borderClass}`}
          >
            {icon}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold tracking-wide uppercase">
                  {toast.title}
                </h4>
                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                  Just now
                </span>
              </div>
              <p className="text-xs mt-0.5 leading-relaxed opacity-90 line-clamp-2">
                {toast.message}
              </p>
              {toast.styleCode && (
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 border border-white/10 font-semibold">
                    Style: {toast.styleCode}
                  </span>
                  {toast.fabricCode && (
                    <span className="inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-900/60 text-rose-200 border border-rose-500/30 font-semibold">
                      Fabric: {toast.fabricCode}
                    </span>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(toast.id);
              }}
              className="text-slate-400 hover:text-white transition-colors p-1 -mr-1 -mt-1 rounded-md"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
