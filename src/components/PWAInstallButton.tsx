import React, { useState } from 'react';
import { Download, Smartphone, CheckCircle2, X, Monitor } from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  // If already running as an installed standalone PWA, hide the button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) return;
    }
    setShowGuideModal(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className={`min-h-[40px] flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-900 hover:text-white border border-emerald-300 hover:border-emerald-600 text-xs font-bold shadow-2xs transition-all cursor-pointer whitespace-nowrap`}
        title="Save GA Sample Tracking Master as an App through Google Chrome"
      >
        <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
        <span className={compact ? 'hidden sm:inline' : ''}>Save as App</span>
      </button>

      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border-2 border-emerald-500 p-5 sm:p-6 shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-start justify-between gap-3 border-b border-emerald-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Save System as Google Chrome App
                  </h3>
                  <p className="text-xs text-emerald-800 font-medium">
                    Install GA Sample Tracking Master on Desktop or Mobile
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-emerald-50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isInstallable && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 space-y-2">
                <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Ready for Direct 1-Click Chrome Installation
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await install();
                    if (ok) setShowGuideModal(false);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Install App Now
                </button>
              </div>
            )}

            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1.5">
                <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Monitor className="w-4 h-4 text-emerald-700" />
                  Google Chrome (Desktop / Laptop):
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-700">
                  <li>
                    Open this app URL in a direct <strong>Google Chrome</strong> tab.
                  </li>
                  <li>
                    Click the <strong>Install App icon</strong> in the right side of the Chrome address bar, <em>or</em> click the Chrome menu <strong>⋮</strong> (top-right).
                  </li>
                  <li>
                    Select <strong>Cast, save, and share</strong> → <strong>Install page as app...</strong> (or <strong>Save and share → Create shortcut → Open as window</strong>).
                  </li>
                </ol>
              </div>

              {isIOS ? (
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1.5">
                  <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-700" />
                    iPhone / iPad (Safari or Chrome):
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-700">
                    <li>Tap the <strong>Share</strong> button in the browser toolbar.</li>
                    <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                  </ol>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1.5">
                  <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-700" />
                    Google Chrome (Android / Mobile):
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-700">
                    <li>Tap the Chrome menu <strong>⋮</strong> (top-right corner).</li>
                    <li>Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
                  </ol>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-white shadow-lg border border-amber-600">
      <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
      Offline Mode — Cached app data is active.
    </div>
  );
};
