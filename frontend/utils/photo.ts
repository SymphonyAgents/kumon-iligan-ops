import imageCompression from 'browser-image-compression';

// Accept up to 20MB raw — iPhones on high quality mode produce 8-12MB shots.
export const RAW_MAX_SIZE_MB = 20;

// Compression target: 1280px / 0.82 quality → ~150-600KB per sneaker photo.
export const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1280,
  useWebWorker: true,
  fileType: 'image/jpeg' as const,
  initialQuality: 0.82,
};

// iOS Safari converts HEIC to JPEG before handing the File to JS,
// so file.type may be 'image/jpeg' even for .heic files taken on iPhone.
// Using startsWith('image/') covers all variants without an allowlist that
// can drift. The 20MB size cap is the real guard here.
export function isValidImageType(file: File): boolean {
  // Some Android browsers report an empty string for MIME type — treat as valid
  // and let the compression step fail loudly if it's not actually an image.
  if (file.type === '') return true;
  return file.type.startsWith('image/');
}

export async function compressWithFallback(file: File): Promise<{ blob: File; sizeKB: number; compressed: boolean }> {
  // Always run through imageCompression — even small files — to guarantee
  // the output is real JPEG bytes. Without this, a small PNG/WebP would be
  // returned as-is but then uploaded with Content-Type: image/jpeg (wrong).
  const originalSizeKB = Math.round(file.size / 1024);

  try {
    const compressed = await imageCompression(file, COMPRESSION_OPTIONS);
    const compressedSizeKB = Math.round(compressed.size / 1024);
    return { blob: compressed, sizeKB: compressedSizeKB, compressed: compressedSizeKB < originalSizeKB };
  } catch {
    // Compression failed (OOM on low-end device, corrupted metadata, etc.)
    // Fall back to original file only if it fits within the raw limit.
    if (file.size > RAW_MAX_SIZE_MB * 1024 * 1024) {
      throw new Error(`Image too large (${Math.round(file.size / 1024 / 1024)}MB). Try a lower quality camera setting.`);
    }
    return { blob: file, sizeKB: originalSizeKB, compressed: false };
  }
}
