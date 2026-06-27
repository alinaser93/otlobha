// اطلبها — دالة Netlify ترسل إشعار Push للتاجر/الأدمن عند طلب جديد.
// تحتاج متغيّر بيئة واحد فقط: VAPID_PRIVATE_KEY (سرّي).
const webpush = require('web-push');

const SUPABASE_URL = 'https://tzruqvplazcwwhpmgdje.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6cnVxdnBsYXpjd3docG1nZGplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyODcwMTcsImV4cCI6MjA5Nzg2MzAxN30.rXfhNjLq99OyPTEVMHgSaodoldCb44UQu0e0dP6wrFE';
const VAPID_PUBLIC_KEY = 'BIi3xXQhhq6uTDJEWBrT7c474ChXXRRZr3MeW5vYgC8w4C_Z_n_fnTRhlEcF_0fpVPXATCVfQ2KVNVunbPvyW5E';

function json(status, obj) {
  return { statusCode: status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) };
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'method_not_allowed' });

  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!priv) return json(200, { ok: false, error: 'no_vapid_key' }); // 200 so order flow isn't blocked

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { ok: false, error: 'bad_json' }); }
  const orderId = String(body.orderId || '').trim();
  if (!orderId) return json(400, { ok: false, error: 'no_order' });

  // fetch push targets (merchant + admin subscriptions) + order summary
  let payload;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/push_targets_for_new_order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ p_order_id: orderId }),
    });
    payload = await res.json();
  } catch (e) {
    return json(200, { ok: false, error: 'fetch_failed' });
  }

  const targets = (payload && payload.targets) || [];
  const order = (payload && payload.order) || {};
  if (!targets.length) return json(200, { ok: true, sent: 0 });

  webpush.setVapidDetails('mailto:support@otlobha.app', VAPID_PUBLIC_KEY, priv);

  const note = {
    title: '🛒 طلب جديد في اطلبها',
    body: `طلب #${order.order_no || ''} — ${order.area || ''} · ${(order.total || 0).toLocaleString('en')} د.ع`,
    url: '/merchant',
    tag: `order-${orderId}`,
  };
  const data = JSON.stringify(note);

  let sent = 0;
  await Promise.all(
    targets.map(async (sub) => {
      try { await webpush.sendNotification(sub, data); sent++; }
      catch (e) { /* expired/invalid subscription — ignore */ }
    })
  );

  return json(200, { ok: true, sent });
};
