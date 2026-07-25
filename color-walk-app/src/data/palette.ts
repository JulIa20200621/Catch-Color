import type { ColorCategory, DailyTarget } from '../types';
import { toLocalDateString } from '../utils/date';

export const COLOR_OPTIONS: ReadonlyArray<{
  colorHex: string;
  colorName: string;
  targetCategory: ColorCategory;
  quote: string;
}> = [
  { colorHex: '#D95D4F', colorName: '胶片珊瑚红', targetCategory: '红', quote: '寻找街角最醒目的热烈。' },
  { colorHex: '#DB8A3B', colorName: '落日橘', targetCategory: '橙', quote: '把傍晚留在今天的相纸里。' },
  { colorHex: '#D5B936', colorName: '旧报纸黄', targetCategory: '黄', quote: '留意阳光落下的地方。' },
  { colorHex: '#668B5D', colorName: '苔藓绿', targetCategory: '绿', quote: '沿着植物生长的方向走。' },
  { colorHex: '#4F9B9E', colorName: '雨后青', targetCategory: '青', quote: '寻找雨停以后清醒的颜色。' },
  { colorHex: '#4A72A5', colorName: '午夜蓝', targetCategory: '蓝', quote: '把远处的安静收进镜头。' },
  { colorHex: '#78629C', colorName: '旧唱片紫', targetCategory: '紫', quote: '在城市里找一点不合时宜的浪漫。' },
  { colorHex: '#CF7F98', colorName: '糖纸粉', targetCategory: '粉', quote: '今天适合发现柔软的小事。' },
];

export function createPersonalTarget(current: DailyTarget): DailyTarget {
  const currentIndex = COLOR_OPTIONS.findIndex(
    (option) => option.targetCategory === current.targetCategory,
  );
  const offset = 1 + (Date.now() % (COLOR_OPTIONS.length - 1));
  const option = COLOR_OPTIONS[(Math.max(0, currentIndex) + offset) % COLOR_OPTIONS.length];
  return {
    id: `personal-${current.date}-${option.targetCategory}`,
    date: current.date,
    ...option,
    source: 'personal',
  };
}

// Keeps the camera usable while the daily-target request is loading or the
// backend has not created today's row yet. The target is deterministic by day.
export function createFallbackDailyTarget(date = toLocalDateString()): DailyTarget {
  const dayNumber = Number(date.replaceAll('-', '')) || 0;
  const option = COLOR_OPTIONS[dayNumber % COLOR_OPTIONS.length];
  return {
    id: `fallback-${date}-${option.targetCategory}`,
    date,
    ...option,
    source: 'global',
  };
}
