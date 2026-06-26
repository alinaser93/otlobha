// 🔔 تنبيهات الطلبات الجديدة — صوت متكرّر (Web Audio، بدون ملفّات) + اهتزاز + كتم.
// يرنّ ما دام فيه طلب جديد لم يُطّلع عليه، ويتوقّف عند الضغط على «تم الاطلاع» أو الكتم.
import { useCallback, useEffect, useRef, useState } from 'react';

let _ctx = null;
function getCtx() {
  if (typeof window === 'undefined') return null;
  try {
    if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (_ctx.state === 'suspended') _ctx.resume();
  } catch { /* unsupported */ }
  return _ctx;
}

// رنّة لطيفة من ثلاث نغمات صاعدة
export function chime() {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  [880, 1175, 1568].forEach((freq, i) => {
    const t = now + i * 0.13;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.4, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.46);
  });
  try { navigator.vibrate && navigator.vibrate([140, 70, 140]); } catch (e) { /* no vibrate */ }
}

const MUTE_KEY = 'otlobha-alert-mute';

// count: عدد الطلبات الجديدة الحالية. يرنّ عند تجاوزها لآخر عدد «اطُّلع عليه».
export function useOrderChime(count, opts) {
  const repeatMs = (opts && opts.repeatMs) || 5000;
  const [muted, setMuted] = useState(() => {
    try { return localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { return false; }
  });
  const [acked, setAcked] = useState(0);
  const [primed, setPrimed] = useState(false); // حالة (وليست ref) حتى يعيد المؤثّر التقييم بعد التفعيل
  const timer = useRef(null);

  const newCount = Math.max(0, (count || 0) - acked);
  const hasNew = newCount > 0;

  const prime = useCallback(() => { getCtx(); setPrimed(true); }, []);
  const acknowledge = useCallback(() => { setAcked(count || 0); }, [count]);
  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const n = !m;
      try { localStorage.setItem(MUTE_KEY, n ? '1' : '0'); } catch (e) { /* ignore */ }
      if (!n) { getCtx(); chime(); } // صوت تأكيد عند التفعيل
      return n;
    });
    setPrimed(true);
  }, []);

  // أوّل لمسة/ضغطة بأي مكان تُهيّئ الصوت (بصمت — بدون رنّة)
  useEffect(() => {
    if (primed) return undefined;
    const once = () => { getCtx(); setPrimed(true); };
    window.addEventListener('pointerdown', once, { once: true });
    window.addEventListener('keydown', once, { once: true });
    window.addEventListener('touchstart', once, { once: true });
    return () => {
      window.removeEventListener('pointerdown', once);
      window.removeEventListener('keydown', once);
      window.removeEventListener('touchstart', once);
    };
  }, [primed]);

  // الرنين المتكرّر ما دام فيه جديد (يعتمد على primed كحالة)
  useEffect(() => {
    clearInterval(timer.current);
    if (!muted && hasNew && primed) {
      chime();
      timer.current = setInterval(chime, repeatMs);
    }
    return () => clearInterval(timer.current);
  }, [muted, hasNew, primed, repeatMs]);

  return { hasNew, newCount, muted, toggleMute, acknowledge, prime, primed };
}
