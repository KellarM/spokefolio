// Reads the portrait the résumé Word export embeds. Word needs the real bytes plus the
// picture's dimensions, so the image is fetched here and described before it is packaged.

export interface PhotoAsset {
  base64: string;
  ext: 'jpeg' | 'png';
  widthPx: number;
  heightPx: number;
}

const MAX_BYTES = 6 * 1024 * 1024;

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
  }
  return btoa(binary);
}

function be16(bytes: Uint8Array, at: number): number {
  return (bytes[at] << 8) | bytes[at + 1];
}

// Only the two formats Word handles everywhere, and whose size can be read from the header.
function describe(bytes: Uint8Array) {
  const png = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (png) {
    const widthPx = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
    const heightPx = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
    return { ext: 'png' as const, widthPx, heightPx };
  }

  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
  if (jpeg) {
    let at = 2;
    while (at + 9 < bytes.length) {
      if (bytes[at] !== 0xff) {
        at += 1;
        continue;
      }
      const marker = bytes[at + 1];
      const isSizeMarker = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (isSizeMarker) {
        return { ext: 'jpeg' as const, widthPx: be16(bytes, at + 7), heightPx: be16(bytes, at + 5) };
      }
      at += 2 + be16(bytes, at + 2);
    }
  }

  return null;
}

export async function loadPhoto(url: unknown): Promise<PhotoAsset | null> {
  try {
    if (typeof url !== 'string' || !/^https:\/\//i.test(url.trim())) return null;
    const response = await fetch(url.trim(), { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return null;
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (!bytes.length || bytes.length > MAX_BYTES) return null;
    const meta = describe(bytes);
    if (!meta || !meta.widthPx || !meta.heightPx) return null;
    return { base64: toBase64(bytes), ext: meta.ext, widthPx: meta.widthPx, heightPx: meta.heightPx };
  } catch (error) {
    // A portrait that cannot be read simply leaves the résumé without one.
    return null;
  }
}