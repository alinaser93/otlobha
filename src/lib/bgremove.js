// إزالة خلفية صورة المنتج (محلياً بالمتصفّح، مجاناً) ثم وضعها على مربّع أبيض موحّد.
// تُحمّل المكتبة عند الطلب فقط حتى لا تثقّل المتجر.

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function cleanProductImage(file, onProgress) {
  const { removeBackground } = await import('@imgly/background-removal');

  // 1) remove the background → transparent PNG blob
  const cutout = await removeBackground(file, {
    progress: (key, current, total) => {
      if (onProgress && total) onProgress(Math.round((current / total) * 100));
    },
  });

  // 2) composite the cut-out, centered, onto a clean white square
  const url = URL.createObjectURL(cutout);
  try {
    const img = await loadImage(url);
    const size = 800;
    const pad = 0.86; // product fills ~86% of the tile
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    const scale = Math.min((size * pad) / img.width, (size * pad) / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.9));
    return blob || cutout;
  } finally {
    URL.revokeObjectURL(url);
  }
}
