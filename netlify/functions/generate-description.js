// اطلبها — دالة Netlify آمنة: تكتب وصفاً تسويقياً قصيراً لمنتج واحد عبر Claude API.
// المفتاح يبقى سرّياً هنا (ANTHROPIC_API_KEY).

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'method_not_allowed' });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return json(500, { ok: false, error: 'لم يُضبط مفتاح الذكاء الصناعي. أضِف ANTHROPIC_API_KEY في إعدادات Netlify.' });
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { ok: false, error: 'bad_json' }); }

  const name = String(body.name || '').trim();
  const category = String(body.category || '').trim();
  const unit = String(body.unit || '').trim();
  const price = body.price;
  if (!name) return json(400, { ok: false, error: 'no_name' });

  const prompt = `أنت كاتب إعلاني محترف لمتجر بقالة عراقي اسمه «اطلبها».
اكتب وصفاً تسويقياً جذّاباً وقصيراً لهذا المنتج يجعل الزبون يرغب بشرائه:
- الاسم: ${name}${category ? `\n- القسم: ${category}` : ''}${unit ? `\n- وحدة البيع: ${unit}` : ''}${price ? `\n- السعر: ${price} دينار` : ''}

القواعد:
- بالعربية الفصحى السهلة، بلهجة دافئة تناسب العراق.
- من 2 إلى 3 جمل فقط (40-60 كلمة).
- ركّز على الطزاجة والجودة والفائدة وتجربة الطعم، وادعُ للطلب في النهاية بلطف.
- لا تذكر السعر رقمياً داخل النص، ولا تستخدم رموزاً أو نقاطاً أو عناوين.
أرجِع نص الوصف فقط، بدون أي مقدمة أو علامات اقتباس.`;

  const payload = {
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
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
    return json(502, { ok: false, error: 'تعذّر الاتصال بخدمة الذكاء الصناعي.' });
  }

  const out = await r.json().catch(() => null);
  if (!r.ok) {
    const msg = (out && out.error && out.error.message) || `خطأ من الخدمة (${r.status})`;
    return json(r.status, { ok: false, error: msg });
  }

  let text = ((out && out.content) || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
  // strip wrapping quotes if present
  text = text.replace(/^["'«»\s]+/, '').replace(/["'«»\s]+$/, '').trim();
  if (!text) return json(200, { ok: false, error: 'تعذّر توليد الوصف، حاول مجدداً.' });
  return json(200, { ok: true, description: text });
};

function json(statusCode, obj) {
  return { statusCode, headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify(obj) };
}
