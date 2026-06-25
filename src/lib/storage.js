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

// resize + compress to keep avatars small and fast (square-ish, max 400px, JPEG)
async function compressImage(file, max = 400, quality = 0.85) {
  try {
    const img = await loadImage(file);
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
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

  const blob = await compressImage(file);
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
