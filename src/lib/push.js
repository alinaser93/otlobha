// 📳 إشعارات Push (جهة العميل): تسجيل Service Worker + اشتراك + حفظ بالخادم.
import { supabase, supabaseEnabled } from './supabase.js';

// المفتاح العام لـVAPID (عام بطبيعته — الإرسال يحتاج المفتاح السري بالخادم)
const VAPID_PUBLIC_KEY = 'BIi3xXQhhq6uTDJEWBrT7c474ChXXRRZr3MeW5vYgC8w4C_Z_n_fnTRhlEcF_0fpVPXATCVfQ2KVNVunbPvyW5E';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function pushSupported() {
  return typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window;
}

async function getRegistration() {
  let reg = await navigator.serviceWorker.getRegistration('/sw.js');
  if (!reg) reg = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  return reg;
}

async function rpc(fn, args) {
  if (!supabaseEnabled || !supabase) return null;
  try { const { data } = await supabase.rpc(fn, args); return data; } catch (e) { return null; }
}

// الحالة الحالية: 'unsupported' | 'denied' | 'default' | 'granted-on' | 'granted-off'
export async function pushStatus() {
  if (!pushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  if (Notification.permission === 'default') return 'default';
  try {
    const reg = await navigator.serviceWorker.getRegistration('/sw.js');
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    return sub ? 'granted-on' : 'granted-off';
  } catch (e) { return 'granted-off'; }
}

// تفعيل الإشعارات: يطلب الإذن، يشترك، يحفظ بالخادم
export async function enablePush(partyType, partyId) {
  if (!pushSupported()) return { ok: false, error: 'unsupported' };
  let perm = Notification.permission;
  if (perm === 'default') perm = await Notification.requestPermission();
  if (perm !== 'granted') return { ok: false, error: 'denied' };

  const reg = await getRegistration();
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }
  const r = await rpc('save_push_subscription', {
    p_party_type: partyType,
    p_party_id: partyId || null,
    p_subscription: sub.toJSON(),
  });
  if (!r?.ok) return { ok: false, error: 'save_failed' };
  return { ok: true };
}

// إيقاف الإشعارات: إلغاء الاشتراك + حذفه من الخادم
export async function disablePush() {
  if (!pushSupported()) return { ok: false };
  try {
    const reg = await navigator.serviceWorker.getRegistration('/sw.js');
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    if (sub) {
      const ep = sub.endpoint;
      await sub.unsubscribe();
      await rpc('delete_push_subscription', { p_endpoint: ep });
    }
    return { ok: true };
  } catch (e) { return { ok: false }; }
}

// يُستدعى بعد إنشاء الطلب لإطلاق إشعار للتاجر/الأدمن (fire-and-forget)
export function notifyNewOrder(orderId) {
  if (!orderId) return;
  try {
    fetch('/.netlify/functions/send-order-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
      keepalive: true,
    }).catch(() => {});
  } catch (e) { /* ignore */ }
}
