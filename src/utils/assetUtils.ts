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
