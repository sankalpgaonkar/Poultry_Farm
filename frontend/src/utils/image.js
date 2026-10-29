/**
 * Shrinks a photo in the browser before upload (max 1200 px, JPEG/WebP ~80%).
 * A 4 MB phone photo becomes roughly 150-300 KB, which keeps uploads fast on 4G
 * and well under the server's 2 MB request limit.
 */
export async function compressImage(file, { maxSize = 1200, quality = 0.8 } = {}) {
  if (!file || !file.type?.startsWith('image/')) throw new Error('Please choose a photo (JPG, PNG or WebP).');
  if (file.size > 15 * 1024 * 1024) throw new Error('That photo is too large (over 15 MB).');

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Could not read that photo. Try a JPG or PNG.'));
      el.src = url;
    });
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    const webp = canvas.toDataURL('image/webp', quality);
    return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Same as compressImage but returns a File, for multipart uploads (keeps bills readable at 1600 px). */
export async function compressImageFile(file, opts = { maxSize: 1600, quality: 0.85 }) {
  const dataUrl = await compressImage(file, opts);
  const [head, b64] = dataUrl.split(',');
  const type = head.slice(5, head.indexOf(';'));
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], `photo.${type === 'image/webp' ? 'webp' : 'jpg'}`, { type });
}
