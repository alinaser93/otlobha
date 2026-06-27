// اطلبها — مساعد التسوّق الذكي عبر Claude API.
// يستقبل حاجة الزبون (وصفة/مناسبة/قائمة) + الكتالوج المتوفّر، ويرجّع سلّة مقترحة.
// المفتاح يبقى سرّياً هنا (ANTHROPIC_API_KEY). يرجع 200 بلا مفتاح حتى لا يتعطّل البحث.

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'method_not_allowed' });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return json(200, { ok: false, no_key: true });

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { ok: false, error: 'bad_json' }); }

  const query = String(body.query || '').trim();
  if (!query) return json(400, { ok: false, error: 'no_query' });

  const products = Array.isArray(body.products) ? body.products.slice(0, 140) : [];
  const bundles = Array.isArray(body.bundles) ? body.bundles.slice(0, 25) : [];
  if (!products.length && !bundles.length) return json(200, { ok: false, error: 'empty_catalog' });

  const prodList = products.map((p) => {
    const id = String(p.id || '').trim();
    const nm = String(p.name || '').trim();
    const tag = String(p.tag || '').trim();
    const un = String(p.unit || '').trim();
    const pr = parseInt(p.price, 10) || 0;
    return `- id:${id} | ${nm}${tag ? ` [${tag}]` : ''}${un ? ` (${un})` : ''}${pr ? ` — ${pr} د.ع` : ''}`;
  }).join('\n');

  const bundleList = bundles.map((b) => {
    const id = String(b.id || '').trim();
    const nm = String(b.name || '').trim();
    const items = Array.isArray(b.items) ? b.items.join('، ') : '';
    return `- id:${id} | ${nm}${items ? ` (تحتوي: ${items})` : ''}`;
  }).join('\n');

  const prompt = `أنت «مساعد اطلبها» الذكي — مساعد تسوّق ودود لسوق بقالة عراقي في مدينة السماوة. الزبون يكتب لك حاجته بلغته العادية (وصفة، مناسبة، أو قائمة)، ومهمّتك تجمع له سلّة مناسبة من المنتجات المتوفّرة **فقط**.

طلب الزبون: "${query}"

المنتجات المتوفّرة (استخدم الـ id تماماً كما هو):
${prodList || '(لا يوجد)'}

${bundleList ? `الباقات الجاهزة المتوفّرة:\n${bundleList}\n` : ''}
القواعد:
- اختر فقط من المنتجات/الباقات أعلاه. لا تخترع أي منتج غير موجود.
- اختر الكميات المنطقية حسب الطلب (مثلاً وصفة لعدد أشخاص).
- إذا كانت إحدى الباقات الجاهزة تغطّي طلب الزبون بشكل ممتاز، اقترحها في "bundleId" (واجعل items أقل أو فارغة).
- إن لم يكن الطلب واضحاً أو لا يوجد ما يناسبه، أرجِع items فارغة وnote لطيفة تطلب توضيحاً.
- "note": رسالة قصيرة جداً (جملة واحدة) باللهجة العراقية الدارجة الودودة.
أرجِع JSON فقط بلا أي شرح أو علامات:
{"note":"...","items":[{"id":"...","qty":1}],"bundleId":""}`;

  const payload = {
    model: 'claude-sonnet-4-6',
    max_tokens: 900,
    messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
  };

  let r;
  try {
    r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(payload),
    });
  } catch {
    return json(200, { ok: false, error: 'connect_failed' });
  }

  const out = await r.json().catch(() => null);
  if (!r.ok) {
    const msg = (out && out.error && out.error.message) || `service_error_${r.status}`;
    return json(200, { ok: false, error: msg });
  }

  const text = ((out && out.content) || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();

  const obj = extractJson(text);
  if (!obj) return json(200, { ok: false, error: 'parse_failed' });

  const validProd = new Set(products.map((p) => String(p.id || '').trim()));
  const validBundle = new Set(bundles.map((b) => String(b.id || '').trim()));

  const items = (Array.isArray(obj.items) ? obj.items : [])
    .map((x) => ({ id: String(x?.id || '').trim(), qty: Math.max(1, Math.min(20, parseInt(x?.qty, 10) || 1)) }))
    .filter((x) => validProd.has(x.id))
    // de-dupe by id (keep the first/highest)
    .reduce((acc, x) => { if (!acc.some((y) => y.id === x.id)) acc.push(x); return acc; }, [])
    .slice(0, 15);

  let bundleId = String(obj.bundleId || '').trim();
  if (bundleId && !validBundle.has(bundleId)) bundleId = '';

  const note = (typeof obj.note === 'string' ? obj.note : '').trim().slice(0, 240);

  return json(200, { ok: true, note, items, bundleId });
};

function extractJson(text) {
  if (!text) return null;
  let t = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const s = t.indexOf('{');
  const e = t.lastIndexOf('}');
  if (s >= 0 && e > s) t = t.slice(s, e + 1);
  try { return JSON.parse(t); } catch { return null; }
}

function json(statusCode, obj) {
  return { statusCode, headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify(obj) };
}
