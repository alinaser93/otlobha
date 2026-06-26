// اطلبها — دالة Netlify آمنة متعدّدة المهام عبر Claude API.
// task = 'description' (افتراضي، يدعم style + current) | 'badge' | 'price'
// المفتاح يبقى سرّياً هنا (ANTHROPIC_API_KEY).

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'method_not_allowed' });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return json(500, { ok: false, error: 'لم يُضبط مفتاح الذكاء الصناعي. أضِف ANTHROPIC_API_KEY في إعدادات Netlify.' });
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { ok: false, error: 'bad_json' }); }

  const task = String(body.task || 'description').trim();
  const name = String(body.name || '').trim();
  const category = String(body.category || '').trim();
  const unit = String(body.unit || '').trim();
  const price = body.price;
  const style = String(body.style || '').trim();
  const current = String(body.current || '').trim();
  if (!name) return json(400, { ok: false, error: 'no_name' });

  const BADGES = ['جديد', 'الأكثر مبيعاً', 'عرض خاص', 'محدود'];

  let prompt;
  let maxTokens = 400;

  if (task === 'badge') {
    maxTokens = 40;
    prompt = `أنت مساعد تسويق لمتجر بقالة عراقي. اقترح أنسب شارة ترويجية واحدة لهذا المنتج من القائمة فقط، أو اتركها فارغة إن لم تناسب أي شارة.
- المنتج: ${name}${category ? `\n- القسم: ${category}` : ''}
الشارات المسموحة فقط: ${BADGES.join('، ')}.
أرجِع JSON فقط بلا شرح: {"badge":"..."} (ضع "" إن لا شيء مناسب).`;
  } else if (task === 'price') {
    maxTokens = 150;
    prompt = `أنت خبير تسعير لبقالة في مدينة السماوة بالعراق. اقترح سعر بيع تقريبياً واقعياً للمستهلك بالدينار العراقي لهذا المنتج.
- المنتج: ${name}${category ? `\n- القسم: ${category}` : ''}${unit ? `\n- وحدة البيع: ${unit}` : ''}
أعطِ رقماً صحيحاً واقعياً (بدون فواصل) وملاحظة قصيرة جداً. اعلم أن الأسعار تختلف، فهذا تقدير استرشادي.
أرجِع JSON فقط بلا شرح: {"price":0,"note":"..."}`;
  } else {
    // description (optionally refine an existing one by style)
    let refine = '';
    if (current) {
      const map = {
        shorter: 'أعد صياغته أقصر: جملة أو جملتين قويتين فقط (حتى 25 كلمة).',
        longer: 'أعد صياغته أطول قليلاً: 3 إلى 4 جمل مع تفاصيل تشهّي الزبون.',
        persuasive: 'أعد صياغته بأسلوب أكثر إقناعاً وحماساً يدفع للشراء فوراً.',
      };
      refine = `\nلديك وصف حالي: "${current}"\nالمطلوب: ${map[style] || 'حسّن صياغته مع الحفاظ على نفس المنتج.'}`;
    }
    prompt = `أنت كاتب إعلاني محترف لمتجر بقالة عراقي اسمه «اطلبها».
اكتب وصفاً تسويقياً جذّاباً وقصيراً لهذا المنتج يجعل الزبون يرغب بشرائه:
- الاسم: ${name}${category ? `\n- القسم: ${category}` : ''}${unit ? `\n- وحدة البيع: ${unit}` : ''}${price ? `\n- السعر: ${price} دينار` : ''}${refine}

القواعد:
- بالعربية الفصحى السهلة، بلهجة دافئة تناسب العراق.
- من 2 إلى 3 جمل فقط (40-60 كلمة) ما لم يُطلب غير ذلك أعلاه.
- ركّز على الطزاجة والجودة والفائدة وتجربة الطعم، وادعُ للطلب في النهاية بلطف.
- لا تذكر السعر رقمياً داخل النص، ولا تستخدم رموزاً أو نقاطاً أو عناوين.
أرجِع نص الوصف فقط، بدون أي مقدمة أو علامات اقتباس.`;
  }

  const payload = {
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
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

  if (task === 'badge') {
    const obj = extractJson(text);
    let badge = obj && typeof obj.badge === 'string' ? obj.badge.trim() : '';
    if (badge && !BADGES.includes(badge)) badge = '';
    return json(200, { ok: true, badge });
  }
  if (task === 'price') {
    const obj = extractJson(text);
    const p = obj ? Math.max(0, parseInt(obj.price, 10) || 0) : 0;
    const note = obj && typeof obj.note === 'string' ? obj.note.trim() : '';
    if (!p) return json(200, { ok: false, error: 'تعذّر اقتراح سعر، حاول مجدداً.' });
    return json(200, { ok: true, price: p, note });
  }

  // description
  text = text.replace(/^["'«»\s]+/, '').replace(/["'«»\s]+$/, '').trim();
  if (!text) return json(200, { ok: false, error: 'تعذّر توليد الوصف، حاول مجدداً.' });
  return json(200, { ok: true, description: text });
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
