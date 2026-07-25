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

// Browser-selected files already remain under browser control. There is no
// native media library to write to, so this intentionally does nothing.
export async function savePhotoToDevice(_imageUri: string): Promise<void> {}
