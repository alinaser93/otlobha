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
export async function generateProductDescription({ name, category, unit, price }) {
  let res;
  try {
    res = await fetch('/api/generate-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category, unit, price }),
    });
  } catch {
    return { ok: false, error: 'تعذّر الاتصال بالخادم. تأكّد من الإنترنت.' };
  }
  let data = null;
  try { data = await res.json(); } catch {}
  if (!data) return { ok: false, error: `فشل التوليد (${res.status})` };
  return data;
}
