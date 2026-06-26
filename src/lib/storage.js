import { supabase } from './supabase.js';

// load a File into an <img> element
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// resize + compress. `bg` fills the canvas first (use '#ffffff' for product
// shots so transparent/white-background images blend cleanly via mix-blend).
export async function compressImage(file, { max = 400, quality = 0.85, bg = null } = {}) {
  try {
    const img = await loadImage(file);
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (bg) {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality));
    URL.revokeObjectURL(img.src);
    return blob || file;
  } catch {
    return file; // fall back to original if canvas fails
  }
}

/*
  Upload an avatar image to the public `avatars` bucket.
  prefix : 'customer' | 'admin' | 'driver'
  id     : the user id (used in the filename)
  returns { url } or { error }
*/
export async function uploadAvatar(file, prefix, id) {
  if (!supabase) return { error: 'التخزين غير مُهيّأ.' };
  if (!file) return { error: 'لم يتم اختيار صورة.' };
  if (!file.type?.startsWith('image/')) return { error: 'الرجاء اختيار صورة صحيحة.' };

  const blob = await compressImage(file, { max: 400, quality: 0.85 });
  const path = `${prefix}/${id}-${Date.now()}.jpg`;

  const { error: upErr } = await supabase.storage
    .from('avatars')
    .upload(path, blob, { upsert: true, contentType: 'image/jpeg', cacheControl: '3600' });

  if (upErr) return { error: upErr.message || 'تعذّر رفع الصورة.' };

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  const url = data?.publicUrl;
  if (!url) return { error: 'تعذّر الحصول على رابط الصورة.' };
  return { url };
}

/*
  Upload a product image to the public `products` bucket.
  id : the product id (or 'new'); only used to build a unique filename.
  White background + JPEG so it sits cleanly on the card's light plate.
  returns { url } or { error }
*/
export async function uploadProductImage(file, id) {
  if (!supabase) return { error: 'التخزين غير مُهيّأ.' };
  if (!file) return { error: 'لم يتم اختيار صورة.' };
  if (!file.type?.startsWith('image/')) return { error: 'الرجاء اختيار صورة صحيحة.' };

  const blob = await compressImage(file, { max: 800, quality: 0.82, bg: '#ffffff' });
  const path = `${id || 'p'}-${Date.now()}.jpg`;

  const { error: upErr } = await supabase.storage
    .from('products')
    .upload(path, blob, { upsert: true, contentType: 'image/jpeg', cacheControl: '3600' });

  if (upErr) return { error: upErr.message || 'تعذّر رفع الصورة.' };

  const { data } = supabase.storage.from('products').getPublicUrl(path);
  const url = data?.publicUrl;
  if (!url) return { error: 'تعذّر الحصول على رابط الصورة.' };
  return { url };
}

/*
  Upload a wide store COVER image (banner). Keeps full photo (no white fill),
  larger max so the banner stays crisp. Public `products` bucket.
*/
export async function uploadStoreCover(file, id) {
  if (!supabase) return { error: 'التخزين غير مُهيّأ.' };
  if (!file) return { error: 'لم يتم اختيار صورة.' };
  if (!file.type?.startsWith('image/')) return { error: 'الرجاء اختيار صورة صحيحة.' };

  const blob = await compressImage(file, { max: 1280, quality: 0.82 });
  const path = `cover-${id || 's'}-${Date.now()}.jpg`;
  const { error: upErr } = await supabase.storage
    .from('products')
    .upload(path, blob, { upsert: true, contentType: 'image/jpeg', cacheControl: '3600' });
  if (upErr) return { error: upErr.message || 'تعذّر رفع الصورة.' };
  const { data } = supabase.storage.from('products').getPublicUrl(path);
  return data?.publicUrl ? { url: data.publicUrl } : { error: 'تعذّر الحصول على رابط الصورة.' };
}

/*
  Upload a short store COVER video (mp4/webm). Raw upload (no transcoding).
  Guards against very large files. Public `products` bucket.
*/
export async function uploadStoreVideo(file, id) {
  if (!supabase) return { error: 'التخزين غير مُهيّأ.' };
  if (!file) return { error: 'لم يتم اختيار فيديو.' };
  if (!file.type?.startsWith('video/')) return { error: 'الرجاء اختيار ملف فيديو.' };
  if (file.size > 25 * 1024 * 1024) return { error: 'الفيديو كبير جداً (الحد ٢٥ ميغا). اختر مقطعاً أقصر.' };

  const ext = (file.name.split('.').pop() || 'mp4').toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp4';
  const path = `storevid-${id || 's'}-${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from('products')
    .upload(path, file, { upsert: true, contentType: file.type, cacheControl: '3600' });
  if (upErr) return { error: upErr.message || 'تعذّر رفع الفيديو.' };
  const { data } = supabase.storage.from('products').getPublicUrl(path);
  return data?.publicUrl ? { url: data.publicUrl } : { error: 'تعذّر الحصول على رابط الفيديو.' };
}
