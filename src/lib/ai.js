import { compressImage } from './storage.js';

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] || '');
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

// send a product/wholesale-paper image to the secure function and get back a product list
export async function extractProductsFromImage(file, categories = []) {
  let blob = file;
  try {
    blob = await compressImage(file, { max: 1600, quality: 0.82 });
  } catch {
    /* fall back to the original file */
  }
  const b64 = await blobToBase64(blob);
  const media_type = blob && blob.type && blob.type.startsWith('image/') ? blob.type : 'image/jpeg';

  let res;
  try {
    res = await fetch('/api/extract-products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: b64, media_type, categories }),
    });
  } catch {
    return { ok: false, error: 'تعذّر الاتصال بالخادم. تأكّد من الإنترنت.' };
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* ignore */
  }
  if (!data) return { ok: false, error: `فشل التحليل (${res.status})` };
  return data;
}

// ask the AI to write a short marketing description for one product
// opts: { name, category, unit, price, style?, current? }
//   style + current → refine an existing description ('shorter'|'longer'|'persuasive')
export async function generateProductDescription({ name, category, unit, price, style, current }) {
  return postAI({ task: 'description', name, category, unit, price, style, current }, 'فشل التوليد');
}

// suggest a promotional badge from the allowed set (or '')
export async function suggestBadge({ name, category }) {
  return postAI({ task: 'badge', name, category }, 'فشل اقتراح الشارة');
}

// suggest a typical retail price (IQD) for the Iraqi market
export async function suggestPrice({ name, category, unit }) {
  return postAI({ task: 'price', name, category, unit }, 'فشل اقتراح السعر');
}

// AI bundle generation: pass available products → returns a suggested bundle
export async function generateBundle(products, hint) {
  return postAI({ task: 'bundle', products, hint }, 'فشل توليد الباقة');
}

async function postAI(payload, failMsg) {
  let res;
  try {
    res = await fetch('/api/generate-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    return { ok: false, error: 'تعذّر الاتصال بالخادم. تأكّد من الإنترنت.' };
  }
  let data = null;
  try { data = await res.json(); } catch {}
  if (!data) return { ok: false, error: `${failMsg} (${res.status})` };
  return data;
}
