// اطلبها — دالة Netlify آمنة: تقرأ صورة (ورقة جملة أو منتجات) وتستخرج المنتجات عبر Claude API.
// المفتاح يبقى سرّياً هنا (متغيّر بيئة ANTHROPIC_API_KEY) — لا يظهر أبداً في المتصفّح.

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return json(500, {
      ok: false,
      error: 'لم يُضبط مفتاح الذكاء الصناعي. أضِف ANTHROPIC_API_KEY في إعدادات Netlify.',
    });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { ok: false, error: 'bad_json' });
  }

  const { image, media_type, categories } = body;
  if (!image) return json(400, { ok: false, error: 'no_image' });

  const cats = Array.isArray(categories) ? categories.filter(Boolean) : [];
  const catLine = cats.length
    ? `الأقسام الموجودة حالياً: ${cats.join('، ')}.`
    : 'لا توجد أقسام بعد.';

  const prompt = `أنت مساعد لإدخال منتجات بقالة عراقية. حلّل الصورة المرفقة — وهي إمّا ورقة أسعار جملة (مكتوبة بخط اليد أو مطبوعة) أو صورة منتجات.
استخرج كل منتج تراه بوضوح. لكل منتج أعطِ:
- name: اسم المنتج بالعربية، نظيف ومختصر.
- price: السعر كرقم صحيح بالدينار العراقي فقط (بدون فواصل أو نص). إن لم يظهر سعر، ضع 0.
- unit: وحدة البيع (مثل: كيلو، علبة، قنينة، حبة، كيس، وحدة). إن لم تعرف، ضع "وحدة".
- category: اختر القسم الأنسب من القائمة الموجودة إن ناسب تماماً، وإلا اقترح اسم قسم عربي جديد مختصر (مثل: أجبان، مشروبات، ألبان).
- emoji: إيموجي واحد مناسب للمنتج.
${catLine}
أرجِع JSON فقط بهذا الشكل بالضبط، بدون أي شرح أو علامات markdown:
{"products":[{"name":"...","price":0,"unit":"...","category":"...","emoji":"..."}]}`;

  const payload = {
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: media_type || 'image/jpeg', data: image } },
          { type: 'text', text: prompt },
        ],
      },
    ],
  };

  let r;
  try {
    r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    });
  } catch {
    return json(502, { ok: false, error: 'تعذّر الاتصال بخدمة الذكاء الصناعي.' });
  }

  const out = await r.json().catch(() => null);
  if (!r.ok) {
    const msg = (out && out.error && out.error.message) || `خطأ من الخدمة (${r.status})`;
    return json(r.status, { ok: false, error: msg });
  }

  const text = ((out && out.content) || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();

  const products = parseProducts(text);
  if (!products) {
    return json(200, { ok: false, error: 'لم أتمكّن من قراءة المنتجات. جرّب صورة أوضح وأقرب.' });
  }
  return json(200, { ok: true, products });
};

function parseProducts(text) {
  if (!text) return null;
  let t = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  // locate the outermost JSON (object OR array) even if surrounded by stray text
  const opens = [t.indexOf('{'), t.indexOf('[')].filter((i) => i >= 0);
  const closes = [t.lastIndexOf('}'), t.lastIndexOf(']')];
  if (opens.length) {
    const s = Math.min(...opens);
    const e = Math.max(...closes);
    if (e > s) t = t.slice(s, e + 1);
  }
  try {
    const obj = JSON.parse(t);
    const arr = Array.isArray(obj) ? obj : obj.products;
    if (!Array.isArray(arr)) return null;
    return arr
      .map((p) => ({
        name: String(p.name || '').trim(),
        price: Math.max(0, parseInt(p.price, 10) || 0),
        unit: String(p.unit || 'وحدة').trim() || 'وحدة',
        category: String(p.category || '').trim(),
        emoji: String(p.emoji || '🛒').trim() || '🛒',
      }))
      .filter((p) => p.name);
  } catch {
    return null;
  }
}

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify(obj),
  };
}
