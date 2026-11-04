import UPNG from 'upng-js';
import { GifWriter } from 'omggif';
import * as FileSystem from 'expo-file-system/legacy';
import { appLogger } from './appLogger';

const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function base64ToUint8Array(b64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(b64, 'base64'));
  }
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const len = clean.length;
  const bytes = new Uint8Array(Math.floor((len * 3) / 4));
  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const b0 = B64_CHARS.indexOf(clean[i]);
    const b1 = B64_CHARS.indexOf(clean[i + 1]);
    const b2 = i + 2 < len ? B64_CHARS.indexOf(clean[i + 2]) : -1;
    const b3 = i + 3 < len ? B64_CHARS.indexOf(clean[i + 3]) : -1;
    bytes[p++] = (b0 << 2) | (b1 >> 4);
    if (b2 !== -1 && b2 < 64) bytes[p++] = ((b1 & 15) << 4) | (b2 >> 2);
    if (b3 !== -1 && b3 < 64) bytes[p++] = ((b2 & 3) << 6) | b3;
  }
  return bytes.subarray(0, p);
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let str = '';
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < len ? bytes[i + 1] : 0;
    const b2 = i + 2 < len ? bytes[i + 2] : 0;
    str += B64_CHARS[b0 >> 2];
    str += B64_CHARS[((b0 & 3) << 4) | (b1 >> 4)];
    str += i + 1 < len ? B64_CHARS[((b1 & 15) << 2) | (b2 >> 6)] : '=';
    str += i + 2 < len ? B64_CHARS[b2 & 63] : '=';
  }
  return str;
}

/**
 * Pre-flattens transparent or semi-transparent RGBA pixels onto a solid opaque background color.
 * This completely prevents alpha-channel blotches, black rounded corners, or dark halos around text in GIF frames.
 */
function flattenRgbaAgainstBg(
  rgba: Uint8Array,
  bgR = 255,
  bgG = 255,
  bgB = 255
): Uint8Array {
  const len = rgba.length;
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i += 4) {
    const a = rgba[i + 3];
    if (a === 255) {
      out[i] = rgba[i];
      out[i + 1] = rgba[i + 1];
      out[i + 2] = rgba[i + 2];
      out[i + 3] = 255;
    } else if (a === 0) {
      out[i] = bgR;
      out[i + 1] = bgG;
      out[i + 2] = bgB;
      out[i + 3] = 255;
    } else {
      const alpha = a / 255;
      out[i] = Math.round(rgba[i] * alpha + bgR * (1 - alpha));
      out[i + 1] = Math.round(rgba[i + 1] * alpha + bgG * (1 - alpha));
      out[i + 2] = Math.round(rgba[i + 2] * alpha + bgB * (1 - alpha));
      out[i + 3] = 255;
    }
  }
  return out;
}

/**
 * Smooth bilinear interpolation scaling to fit target dimensions while preserving aspect ratio.
 * Centered on an opaque background color to avoid any jagged nearest-neighbor scaling artifacts.
 */
function bilinearFitRgba(
  srcRgba: Uint8Array,
  srcW: number,
  srcH: number,
  targetW: number,
  targetH: number,
  bg: [number, number, number, number] = [15, 23, 42, 255]
): Uint8Array {
  if (srcW === targetW && srcH === targetH) {
    return srcRgba;
  }
  const out = new Uint8Array(targetW * targetH * 4);
  const scale = Math.min(targetW / srcW, targetH / srcH);
  const dw = Math.round(srcW * scale);
  const dh = Math.round(srcH * scale);
  const ox = Math.floor((targetW - dw) / 2);
  const oy = Math.floor((targetH - dh) / 2);

  // Fill solid background
  for (let i = 0; i < targetW * targetH; i++) {
    const o = i * 4;
    out[o] = bg[0];
    out[o + 1] = bg[1];
    out[o + 2] = bg[2];
    out[o + 3] = bg[3];
  }

  for (let y = 0; y < dh; y++) {
    const sy = y / scale;
    const y0 = Math.floor(sy);
    const y1 = Math.min(y0 + 1, srcH - 1);
    const wy1 = sy - y0;
    const wy0 = 1 - wy1;

    for (let x = 0; x < dw; x++) {
      const sx = x / scale;
      const x0 = Math.floor(sx);
      const x1 = Math.min(x0 + 1, srcW - 1);
      const wx1 = sx - x0;
      const wx0 = 1 - wx1;

      const idx00 = (y0 * srcW + x0) * 4;
      const idx01 = (y0 * srcW + x1) * 4;
      const idx10 = (y1 * srcW + x0) * 4;
      const idx11 = (y1 * srcW + x1) * 4;

      const tIdx = ((oy + y) * targetW + (ox + x)) * 4;

      for (let c = 0; c < 4; c++) {
        const val =
          srcRgba[idx00 + c] * wx0 * wy0 +
          srcRgba[idx01 + c] * wx1 * wy0 +
          srcRgba[idx10 + c] * wx0 * wy1 +
          srcRgba[idx11 + c] * wx1 * wy1;
        out[tIdx + c] = Math.round(val);
      }
    }
  }

  return out;
}

/**
 * Uses UPNG's median-cut vector quantizer to generate a crystal-clear 256-color palette
 * and mapped pixel indices for high-fidelity GIF frames.
 */
function quantizeRgbaToGifFrame(
  rgbaBuffer: ArrayBuffer,
  w: number,
  h: number
): {
  indexedPixels: Uint8Array;
  palette: number[];
} {
  // UPNG.quantize takes an array of ArrayBuffers and max palette size (256 for GIF)
  // roundAlpha = true ensures clean 1-bit transparency rounding without premultiplication halos
  const qres = (UPNG as any).quantize([rgbaBuffer], 256, true);
  const palette32: number[] = qres.plte.map((p: any) => p.est.rgba);
  const colorMap = new Map<number, number>();
  const gifPalette: number[] = [];

  for (let i = 0; i < palette32.length; i++) {
    const c32 = palette32[i];
    colorMap.set(c32, i);
    // GIF palette color is RGB: (R << 16) | (G << 8) | B
    const r = c32 & 0xff;
    const g = (c32 >> 8) & 0xff;
    const b = (c32 >> 16) & 0xff;
    gifPalette.push((r << 16) | (g << 8) | b);
  }

  // GIF palette length must be a power of 2 (2, 4, 8, 16, 32, 64, 128, 256)
  let pLen = 2;
  while (pLen < gifPalette.length && pLen < 256) {
    pLen *= 2;
  }
  while (gifPalette.length < pLen) {
    gifPalette.push(0);
  }

  const u32 = new Uint32Array(qres.bufs[0]);
  const indexedPixels = new Uint8Array(u32.length);
  for (let i = 0; i < u32.length; i++) {
    indexedPixels[i] = colorMap.get(u32[i]) ?? 0;
  }

  return { indexedPixels, palette: gifPalette };
}

export interface AnimatedGifOptions {
  receiptBase64Png: string;
  adBannerBase64Png: string;
  receiptDelaySec?: number; // Timing: default 4.0s (400 centiseconds) for Receipt Card
  adDelaySec?: number;      // Timing: default 4.0s (400 centiseconds) for Advertisement Banner
}

export const animatedGifService = {
  /**
   * Generates a 2-frame animated GIF:
   * - Frame 1: Receipt Card for receiptDelaySec (default 4.0s)
   * - Frame 2: Ad Banner for adDelaySec (default 4.0s)
   * With alpha pre-flattening, bilinear resampling, and median-cut color quantization.
   */
  createAndSaveAnimatedGif: async (
    targetUri: string,
    options: AnimatedGifOptions
  ): Promise<string> => {
    const {
      receiptBase64Png,
      adBannerBase64Png,
      receiptDelaySec = 4.0, // <-- RECEIPT TIMER: 4.0 seconds (400 cs)
      adDelaySec = 4.0,      // <-- AD BANNER TIMER: 4.0 seconds (400 cs)
    } = options;

    appLogger.info(
      'ANIMATED_GIF',
      `Starting animated GIF: Receipt duration = ${receiptDelaySec}s, Ad duration = ${adDelaySec}s`
    );
    const t0 = Date.now();

    // 1. Decode Frame 1 (Receipt Card)
    const buf1 = base64ToUint8Array(receiptBase64Png);
    const img1 = UPNG.decode(buf1.buffer as ArrayBuffer);
    const rawRgba1 = new Uint8Array(UPNG.toRGBA8(img1)[0] as ArrayBuffer);
    const width = img1.width;
    const height = img1.height;

    // Pre-flatten Frame 1 against solid white background to eliminate alpha artifacts/halos
    const flatRgba1 = flattenRgbaAgainstBg(rawRgba1, 255, 255, 255);

    // 2. Decode Frame 2 (Ad Banner Card)
    const buf2 = base64ToUint8Array(adBannerBase64Png);
    const img2 = UPNG.decode(buf2.buffer as ArrayBuffer);
    const rawRgba2 = new Uint8Array(UPNG.toRGBA8(img2)[0] as ArrayBuffer);

    // Pre-flatten Frame 2 against dark navy background ([15, 23, 42])
    const flatRgba2 = flattenRgbaAgainstBg(rawRgba2, 15, 23, 42);

    // Smooth bilinear resampling for Frame 2 if dimensions differ from Frame 1
    let finalRgba2Buffer: ArrayBuffer;
    if (img2.width !== width || img2.height !== height) {
      const fittedRgba2 = bilinearFitRgba(
        flatRgba2,
        img2.width,
        img2.height,
        width,
        height,
        [15, 23, 42, 255]
      );
      finalRgba2Buffer = fittedRgba2.buffer as ArrayBuffer;
    } else {
      finalRgba2Buffer = flatRgba2.buffer as ArrayBuffer;
    }

    // 3. High-fidelity median cut quantization for both frames
    const f1 = quantizeRgbaToGifFrame(flatRgba1.buffer as ArrayBuffer, width, height);
    const f2 = quantizeRgbaToGifFrame(finalRgba2Buffer, width, height);

    // 4. Encode animated GIF via omggif with mobile-safe pacing & disposal: 2
    // Mobile decoders (iOS Photos, Android Gallery, WhatsApp) truncate single-frame long delays (>200cs)
    // and flicker when disposal is 0. Pacing in 1.0s chunks (100cs) with disposal: 2 guarantees
    // rock-solid, flicker-free playback where both Receipt and Ad stay for the full duration!
    const gifBuffer = new Uint8Array(width * height * 4);
    const writer = new GifWriter(gifBuffer, width, height, { loop: 0 });

    const addPacedFrames = (
      pixels: Uint8Array,
      palette: number[],
      totalSeconds: number
    ) => {
      const chunks = Math.max(1, Math.round(totalSeconds));
      const chunkDelay = Math.round((totalSeconds / chunks) * 100);

      for (let c = 0; c < chunks; c++) {
        writer.addFrame(0, 0, width, height, pixels as unknown as number[], {
          palette,
          delay: chunkDelay,
          disposal: 2, // Restore to background: required by mobile decoders to prevent flicker!
        });
      }
    };

    // Sequence 1: Receipt Card — 4 chunks of 1.0s = 4.0 seconds total
    addPacedFrames(f1.indexedPixels, f1.palette, receiptDelaySec);

    // Sequence 2: Ad Banner — 4 chunks of 1.0s = 4.0 seconds total
    addPacedFrames(f2.indexedPixels, f2.palette, adDelaySec);

    const finalGifBytes = gifBuffer.subarray(0, writer.end());
    const finalBase64 = uint8ArrayToBase64(finalGifBytes);

    appLogger.info(
      'ANIMATED_GIF',
      `High-fidelity GIF generated in ${Date.now() - t0}ms, size: ${finalGifBytes.length} bytes. Writing to: ${targetUri}`
    );

    // 5. Write to local file system
    await FileSystem.writeAsStringAsync(targetUri, finalBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return targetUri;
  },
};
