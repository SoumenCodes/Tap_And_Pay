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
    const uri = asset.localUri || asset.uri;
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('Failed to resolve asset base64 URI:', error);
    return '';
  }
}
