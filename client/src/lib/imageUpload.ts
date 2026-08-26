/** Compress an image file to a JPEG data URL suitable for localStorage. */

export async function fileToCompressedDataUrl(
  file: File,
  opts?: { maxWidth?: number; quality?: number }
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Bitte eine Bilddatei wählen (JPG, PNG, WebP).");
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error("Bild ist zu groß (max. 12 MB).");
  }

  const maxWidth = opts?.maxWidth ?? 900;
  const quality = opts?.quality ?? 0.72;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Bildverarbeitung nicht verfügbar.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  // ~700KB ceiling keeps marketplace JSON under typical localStorage limits
  if (dataUrl.length > 900_000) {
    return fileToCompressedDataUrl(file, { maxWidth: Math.round(maxWidth * 0.75), quality: 0.6 });
  }
  return dataUrl;
}
