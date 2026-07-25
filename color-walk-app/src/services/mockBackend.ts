import type { AppBackend, AnalyzePhotoRequest } from './contracts';
import type { ColorCategory, ColorDistribution, DailyTarget } from '../types';

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

const allCategories: ColorCategory[] = ['红', '橙', '黄', '绿', '青', '蓝', '紫', '粉'];

function buildDistribution(targetCategory: ColorCategory): ColorDistribution {
  const alternatives = allCategories.filter((item) => item !== targetCategory);
  return {
    [targetCategory]: 0.64,
    [alternatives[0]]: 0.23,
    [alternatives[1]]: 0.13,
  };
}

export const mockBackend: AppBackend = {
  async getDailyTarget(date): Promise<DailyTarget> {
    await wait(260);
    return {
      id: `mock-${date}`,
      date,
      colorHex: '#D95D4F',
      colorName: '胶片珊瑚红',
      targetCategory: '红',
      quote: '去街角，找一块今天才会注意到的红。',
      source: 'global',
    };
  },

  async getCommunityPhotos() {
    await wait(260);
    return [];
  },

  async analyzePhoto(request: AnalyzePhotoRequest) {
    await wait(1100);
    return {
      requestId: `mock-${Date.now()}`,
      analyzedAt: new Date().toISOString(),
      distribution: buildDistribution(request.targetCategory),
      targetCategory: request.targetCategory,
      targetRatio: 0.64,
      success: true,
      reason: 'matched',
      brightness: 0.58,
    };
  },
};
