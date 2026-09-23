/** Best-effort image dimension checks without native image libraries. */

export const MAX_IMAGE_DIMENSION = 8_000;
export const MAX_IMAGE_PIXELS = 40_000_000;

export function readImageDimensions(buffer: Buffer, mimeType: string): { width: number; height: number } | null {
  try {
    if (mimeType === "image/png" && buffer.length >= 24) {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return width > 0 && height > 0 ? { width, height } : null;
    }
    if (mimeType === "image/jpeg") {
      let offset = 2;
      while (offset + 9 < buffer.length) {
        if (buffer[offset] !== 0xff) break;
        const marker = buffer[offset + 1];
        if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
          const height = buffer.readUInt16BE(offset + 5);
          const width = buffer.readUInt16BE(offset + 7);
          return width > 0 && height > 0 ? { width, height } : null;
        }
        const length = buffer.readUInt16BE(offset + 2);
        if (length < 2) break;
        offset += 2 + length;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function dimensionsAllowed(buffer: Buffer, mimeType: string): boolean {
  const dims = readImageDimensions(buffer, mimeType);
  if (!dims) return mimeType === "image/webp";
  if (dims.width > MAX_IMAGE_DIMENSION || dims.height > MAX_IMAGE_DIMENSION) return false;
  if (dims.width * dims.height > MAX_IMAGE_PIXELS) return false;
  return true;
}
