/**
 * Shrinks JPEG uploads so POST /api/try-on stays under typical host body limits
 * (e.g. Vercel serverless ~4.5MB total request including multipart overhead).
 */
const MAX_LONG_EDGE = 1536;
const TARGET_MAX_BYTES = 1_400_000;

export async function compressImageForTryOnUpload(file: File): Promise<File> {
  if (file.size <= TARGET_MAX_BYTES) {
    return file;
  }

  if (!file.type.startsWith("image/") || typeof createImageBitmap !== "function") {
    return file;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  try {
    const scale = Math.min(1, MAX_LONG_EDGE / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return file;
    }

    ctx.drawImage(bitmap, 0, 0, w, h);

    let quality = 0.88;
    for (let i = 0; i < 12; i++) {
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/jpeg", quality);
      });

      if (!blob) {
        return file;
      }

      if (blob.size <= TARGET_MAX_BYTES || quality <= 0.48) {
        const base = file.name.replace(/\.[^.]+$/, "") || "image";
        return new File([blob], `${base}.jpg`, {
          type: "image/jpeg",
          lastModified: Date.now(),
        });
      }

      quality -= 0.06;
    }

    const fallback = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.48);
    });
    if (!fallback) {
      return file;
    }
    const base = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([fallback], `${base}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}
