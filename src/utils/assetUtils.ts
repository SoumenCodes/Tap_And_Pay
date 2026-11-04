import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Loads any local bundled asset (GIF, PNG, JPG) at runtime and converts
 * it into a self-contained base64 data URI for sharing or PDF rendering.
 *
 * This avoids storing large multi-megabyte base64 strings in TypeScript files.
 */
export async function getAssetDataUri(assetModule: number, mimeType: string): Promise<string> {
  try {
    const asset = Asset.fromModule(assetModule);
    if (!asset.localUri) {
      await asset.downloadAsync();
    }
    let localPath = asset.localUri;
    if (!localPath && asset.uri && !asset.uri.startsWith('http')) {
      localPath = asset.uri;
    }
    if (!localPath) {
      return '';
    }
    const base64 = await FileSystem.readAsStringAsync(localPath, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.warn('Failed to resolve asset base64 URI:', error);
    return '';
  }
}

/**
 * Normalizes backend image and logo URLs to ensure static assets resolve correctly.
 * On stageserv, files in public/logo, public/advertisements, public/profile, etc.
 * must have the '/public/' segment, otherwise CodeIgniter routing throws a 404 error.
 */
export function normalizeImageUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  let trimmed = url.trim();
  if (!trimmed) return null;

  // If localhost (e.g. from local server test http://localhost/SEPAY_WEB/...), rewrite to stageserv
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/SEPAY_WEB)?\//i.test(trimmed)) {
    trimmed = trimmed.replace(
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/SEPAY_WEB)?\//i,
      'https://sepay.stageserv.in/'
    );
  }

  // Ensure /public/ segment exists on known asset directories
  // e.g. https://sepay.stageserv.in/logo/... -> https://sepay.stageserv.in/public/logo/...
  // e.g. https://sepay.stageserv.in/advertisements/... -> https://sepay.stageserv.in/public/advertisements/...
  return trimmed.replace(
    /(https?:\/\/[^\/]+)\/(?!public\/)(logo|advertisements|profile|documents|images)\//i,
    (_match, p1, p2) => `${p1}/public/${p2}/`
  );
}
