// Default Notification Sound & Browser Notification Utility
// Plays the default notification sound whenever any status changes or any update is done

let sharedAudioCtx: AudioContext | null = null;
let cachedDefaultWavUrl: string | null = null;

function getAudioContext(): AudioContext | null {
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioContextClass();
    }
    if (sharedAudioCtx.state === 'suspended') {
      void sharedAudioCtx.resume();
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

// Generate an in-memory standard notification chime WAV data URI as an HTML5 Audio fallback
function getDefaultNotificationWavDataUrl(): string {
  if (cachedDefaultWavUrl) return cachedDefaultWavUrl;
  try {
    const sampleRate = 22050;
    const durationSec = 0.42;
    const numSamples = Math.floor(sampleRate * durationSec);
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, numSamples * 2, true);

    // Classic two-note default notification chime (D5 -> A5)
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const freq = t < 0.16 ? 587.33 : 880.0;
      const localT = t < 0.16 ? t : t - 0.16;
      const env = Math.exp(-localT * 12) * Math.min(1, localT * 120);
      const sample = Math.sin(2 * Math.PI * freq * t) * env * 0.35;
      const pcm = Math.max(-1, Math.min(1, sample));
      view.setInt16(44 + i * 2, pcm < 0 ? pcm * 0x8000 : pcm * 0x7fff, true);
    }

    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    cachedDefaultWavUrl = `data:audio/wav;base64,${btoa(binary)}`;
    return cachedDefaultWavUrl;
  } catch {
    return '';
  }
}

// Unlock audio & request native notification permission on first user interaction
if (typeof window !== 'undefined') {
  const unlockAudioAndNotifications = () => {
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        void ctx.resume();
      }
      if ('Notification' in window && Notification.permission === 'default') {
        void Notification.requestPermission().catch(() => {});
      }
    } catch {
      // Ignore in restricted environments
    }
  };

  window.addEventListener('click', unlockAudioAndNotifications, { passive: true });
  window.addEventListener('keydown', unlockAudioAndNotifications, { passive: true });
  window.addEventListener('touchstart', unlockAudioAndNotifications, { passive: true });
}

export function playDefaultNotificationSound(
  type: 'critical' | 'success' | 'info' | 'warning' = 'info',
  title?: string,
  message?: string
): void {
  // 1. Play HTML5 Audio WAV chime (works reliably as default notification sound)
  try {
    const wavUrl = getDefaultNotificationWavDataUrl();
    if (wavUrl) {
      const audio = new Audio(wavUrl);
      audio.volume = 0.7;
      void audio.play().catch(() => {
        // Fallback to Web Audio API below if HTMLAudioElement is blocked
      });
    }
  } catch {
    // Ignore HTML5 audio errors
  }

  // 2. Play Web Audio API chime (layered clarity & distinct tone support)
  try {
    const ctx = getAudioContext();
    if (ctx) {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'critical') {
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.setValueAtTime(880.0, now + 0.12);
        osc.frequency.setValueAtTime(587.33, now + 0.24);
      } else if (type === 'success') {
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.setValueAtTime(880.0, now + 0.14);
      } else {
        // Default notification chime (D5 -> A5)
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.setValueAtTime(880.0, now + 0.14);
      }

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.start(now);
      osc.stop(now + 0.42);
    }
  } catch {
    // Ignore audio context restriction errors
  }

  // 3. Trigger subtle vibration on mobile/PWA devices
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  } catch {
    // Ignore vibration errors
  }

  // 4. Trigger Native Chrome / OS Notification with Default OS Sound (silent: false)
  if (title && typeof window !== 'undefined' && 'Notification' in window) {
    try {
      if (Notification.permission === 'granted') {
        if ('serviceWorker' in navigator) {
          void navigator.serviceWorker.ready
            .then((reg) =>
              reg.showNotification(title, {
                body: message || '',
                icon: '/pwa-192x192.png',
                badge: '/pwa-192x192.png',
                silent: false,
                tag: `ga-notif-${Date.now()}`,
              })
            )
            .catch(() => {
              new Notification(title, {
                body: message || '',
                icon: '/pwa-192x192.png',
                silent: false,
              });
            });
        } else {
          new Notification(title, {
            body: message || '',
            icon: '/pwa-192x192.png',
            silent: false,
          });
        }
      }
    } catch {
      // Ignore browser notification errors in restricted contexts
    }
  }
}
