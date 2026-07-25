import type { ColorAnalysisResult, ColorCategory } from '../types';
import { analyzePixels } from '../utils/colorAnalysis';

function loadImage(imageUri: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('浏览器无法读取这张照片'));
    image.src = imageUri;
  });
}

export async function analyzeLocalPhoto(
  imageUri: string,
  targetCategory: ColorCategory,
): Promise<ColorAnalysisResult> {
  const image = await loadImage(imageUri);
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('浏览器不支持图片像素分析');

  const scale = Math.max(canvas.width / image.width, canvas.height / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  context.drawImage(
    image,
    (canvas.width - width) / 2,
    (canvas.height - height) / 2,
    width,
    height,
  );

  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  return analyzePixels(pixels, targetCategory);
}
