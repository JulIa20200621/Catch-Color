import type {
  ColorAnalysisResult,
  ColorCategory,
  ColorDistribution,
} from '../types';

const CATEGORY_RANGES: ReadonlyArray<{
  name: ColorCategory;
  min: number;
  max: number;
}> = [
  { name: '红', min: 345, max: 15 },
  { name: '橙', min: 15, max: 45 },
  { name: '黄', min: 45, max: 70 },
  { name: '绿', min: 70, max: 165 },
  { name: '青', min: 165, max: 195 },
  { name: '蓝', min: 195, max: 255 },
  { name: '紫', min: 255, max: 290 },
  { name: '粉', min: 290, max: 345 },
];

function rgbToHsl(r: number, g: number, b: number) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) {
    return { hue: 0, saturation: 0, lightness };
  }

  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;

  if (max === red) hue = ((green - blue) / delta) % 6;
  if (max === green) hue = (blue - red) / delta + 2;
  if (max === blue) hue = (red - green) / delta + 4;

  hue *= 60;
  if (hue < 0) hue += 360;

  return { hue, saturation, lightness };
}

function classifyHue(hue: number): ColorCategory | null {
  for (const category of CATEGORY_RANGES) {
    const matches =
      category.min < category.max
        ? hue >= category.min && hue < category.max
        : hue >= category.min || hue < category.max;

    if (matches) return category.name;
  }

  return null;
}

export function analyzePixels(
  pixels: ArrayLike<number>,
  targetCategory: ColorCategory,
): ColorAnalysisResult {
  const counts: Partial<Record<ColorCategory, number>> = {};
  let opaquePixels = 0;
  let coloredPixels = 0;
  let brightnessSum = 0;

  for (let index = 0; index < pixels.length; index += 4) {
    const alpha = pixels[index + 3] ?? 255;
    if (alpha < 128) continue;

    const { hue, saturation, lightness } = rgbToHsl(
      pixels[index],
      pixels[index + 1],
      pixels[index + 2],
    );
    opaquePixels += 1;
    brightnessSum += lightness;

    if (saturation < 0.15 || lightness < 0.08 || lightness > 0.92) {
      continue;
    }

    const category = classifyHue(hue);
    if (!category) continue;
    counts[category] = (counts[category] ?? 0) + 1;
    coloredPixels += 1;
  }

  const imagePixelCount = Math.max(1, opaquePixels);
  const colorPixelCount = Math.max(1, coloredPixels);
  const brightness = brightnessSum / imagePixelCount;
  const distribution: ColorDistribution = {};

  if (coloredPixels > 0) {
    for (const category of CATEGORY_RANGES) {
      const count = counts[category.name];
      if (count) distribution[category.name] = count / colorPixelCount;
    }
  }

  // Matching uses the full image area. The display distribution intentionally
  // excludes neutral pixels so its visible color categories sum to 100%.
  const targetRatio = (counts[targetCategory] ?? 0) / imagePixelCount;
  const tooDark = brightness < 0.12;
  const success = !tooDark && targetRatio >= 0.15;

  return {
    distribution,
    targetCategory,
    targetRatio,
    success,
    reason: tooDark ? 'too_dark' : success ? 'matched' : 'not_matched',
    brightness,
    colorCoverage: coloredPixels / imagePixelCount,
  };
}
