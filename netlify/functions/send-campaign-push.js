// اطلبها — دالة Netlify تبثّ حملة إعلانية لكل الزبائن المشتركين.
// تحتاج VAPID_PRIVATE_KEY (سرّي). البثّ يتطلّب هوية أدمن صالحة.
const webpush = require('web-push');

const SUPABASE_URL = 'https://tzruqvplazcwwhpmgdje.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6cnVxdnBsYXpjd3docG1nZGplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyODcwMTcsImV4cCI6MjA5Nzg2MzAxN30.rXfhNjLq99OyPTEVMHgSaodoldCb44UQu0e0dP6wrFE';
const VAPID_PUBLIC_KEY = 'BIi3xXQhhq6uTDJEWBrT7c474ChXXRRZr3MeW5vYgC8w4C_Z_n_fnTRhlEcF_0fpVPXATCVfQ2KVNVunbPvyW5E';

function json(status, obj) {
  return { statusCode: status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) };
}
async function rpc(name, args) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    body: JSON.stringify(args),
  });
  return res.json();
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'method_not_allowed' });

  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!priv) return json(200, { ok: false, error: 'no_vapid_key' });

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { ok: false, error: 'bad_json' }); }
  const campaignId = body.campaignId;
  const adminId = String(body.adminId || '').trim();
  if (!campaignId || !adminId) return json(400, { ok: false, error: 'bad_input' });

  let payload;
  try { payload = await rpc('campaign_targets', { p_admin_id: adminId, p_campaign_id: campaignId }); }
  catch (e) { return json(200, { ok: false, error: 'fetch_failed' }); }

  if (!payload || payload.error) return json(200, { ok: false, error: payload && payload.error ? payload.error : 'no_data' });

  const targets = payload.targets || [];
  const campaign = payload.campaign || {};
  if (!targets.length) return json(200, { ok: true, sent: 0 });

  webpush.setVapidDetails('mailto:support@otlobha.app', VAPID_PUBLIC_KEY, priv);

  const note = {
    title: campaign.title || 'اطلبها',
    body: campaign.body || '',
    url: campaign.url || '/',
    tag: `campaign-${campaignId}`,
  };
  const data = JSON.stringify(note);

  let sent = 0;
  await Promise.all(targets.map(async (sub) => {
    try { await webpush.sendNotification(sub, data); sent++; } catch (e) { /* expired — ignore */ }
  }));

  try { await rpc('admin_set_campaign_sent', { p_admin_id: adminId, p_campaign_id: campaignId, p_sent: sent }); } catch (e) {}

  return json(200, { ok: true, sent });
};
