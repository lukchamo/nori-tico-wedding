// Optimiza en el navegador la foto que el invitado sube: corrige orientación, reduce a ~1024 px y comprime a JPEG.
export type OptimizedImage = { dataUrl: string; width: number; height: number; originalBytes: number; bytes: number };

const MAX_SIDE = 1024;
const TARGET_CHARS = 600_000;

async function decode(file: File): Promise<{ source: CanvasImageSource; width: number; height: number }> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    return { source: bmp, width: bmp.width, height: bmp.height };
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return { source: img, width: img.naturalWidth, height: img.naturalHeight };
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }
}

export async function optimizeImage(file: File): Promise<OptimizedImage> {
  if (!file.type.startsWith("image/") && !/\.(heic|heif)$/i.test(file.name)) throw new Error("Elige una foto (JPG, PNG o HEIC).");
  const { source, width, height } = await decode(file);
  let side = MAX_SIDE;
  let quality = 0.82;
  for (;;) {
    const scale = Math.min(1, side / Math.max(width, height));
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Tu navegador no pudo procesar la foto.");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(source, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    if (dataUrl.length <= TARGET_CHARS || side <= 640) {
      return { dataUrl, width: w, height: h, originalBytes: file.size, bytes: Math.round((dataUrl.length * 3) / 4) };
    }
    if (quality > 0.62) quality -= 0.1;
    else side -= 128;
  }
}

export function fmtBytes(n: number) {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1000))} KB`;
}
