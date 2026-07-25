import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { decode } from 'jpeg-js';
import type { ColorAnalysisResult, ColorCategory } from '../types';
import { analyzePixels } from '../utils/colorAnalysis';

function base64ToBytes(base64: string): Uint8Array {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export async function analyzeLocalPhoto(
  imageUri: string,
  targetCategory: ColorCategory,
): Promise<ColorAnalysisResult> {
  const resized = await manipulateAsync(
    imageUri,
    [{ resize: { width: 128 } }],
    { base64: true, compress: 0.72, format: SaveFormat.JPEG },
  );

  if (!resized.base64) throw new Error('无法读取照片像素');
  const decoded = decode(base64ToBytes(resized.base64), {
    useTArray: true,
    formatAsRGBA: true,
    maxResolutionInMP: 1,
    maxMemoryUsageInMB: 32,
  });

  return analyzePixels(decoded.data, targetCategory);
}
