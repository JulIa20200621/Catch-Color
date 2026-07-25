import type { PhotoRecord } from '../types';
import { toLocalDateString } from './date';

export interface PhotoStats {
  photoCount: number;
  successfulCount: number;
  colorCount: number;
  capturedDays: number;
  streakDays: number;
}

function previousDate(value: string): string {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() - 1);
  return toLocalDateString(date);
}

export function calculateStreak(dates: ReadonlyArray<string>): number {
  const uniqueDates = Array.from(new Set(dates.map(toLocalDateString))).sort().reverse();
  if (!uniqueDates[0]) return 0;

  let streak = 1;
  let expected = uniqueDates[0];
  for (const date of uniqueDates.slice(1)) {
    expected = previousDate(expected);
    if (date !== expected) break;
    streak += 1;
  }
  return streak;
}

export function getPhotoStats(photos: ReadonlyArray<PhotoRecord>): PhotoStats {
  const successfulPhotos = photos.filter((photo) => photo.analysis.success);
  return {
    photoCount: photos.length,
    successfulCount: successfulPhotos.length,
    colorCount: new Set(successfulPhotos.map((photo) => photo.target.targetCategory)).size,
    capturedDays: new Set(photos.map((photo) => toLocalDateString(photo.createdAt))).size,
    streakDays: calculateStreak(photos.map((photo) => photo.createdAt)),
  };
}
