import * as Location from 'expo-location';
import type { PhotoLocation } from '../types';

export async function getOptionalLocation(): Promise<PhotoLocation | null> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return null;
    const current = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      latitude: current.coords.latitude,
      longitude: current.coords.longitude,
      accuracy: current.coords.accuracy,
    };
  } catch {
    return null;
  }
}

export async function savePhotoToDevice(_imageUri: string): Promise<void> {
  // App records already keep the captured image locally. System gallery saving is
  // intentionally omitted in Expo Go because its media-library native module varies by release.
}
