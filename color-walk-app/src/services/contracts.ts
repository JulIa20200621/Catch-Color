import type {
  ColorAnalysisResult,
  ColorCategory,
  CommunityPhoto,
  DailyTarget,
  PhotoLocation,
} from '../types';

// This is the client/backend contract. Backend implementations can change
// without leaking Supabase or HTTP details into screens and stores.
export interface AnalyzePhotoRequest {
  imageUri?: string;
  imageUrl?: string;
  targetCategory: ColorCategory;
  targetHex: string;
  location?: PhotoLocation | null;
}

export interface AnalyzePhotoResponse extends ColorAnalysisResult {
  requestId: string;
  analyzedAt: string;
}

export interface CreatePhotoRequest {
  userId: string;
  imageUrl: string;
  targetId: string;
  analysis: ColorAnalysisResult;
  location: PhotoLocation | null;
  visibility: 'private' | 'community';
}

export interface CreatePhotoResponse {
  photoId: string;
  createdAt: string;
}

export interface AppBackend {
  getDailyTarget(date: string): Promise<DailyTarget>;
  getCommunityPhotos(limit?: number): Promise<CommunityPhoto[]>;
  analyzePhoto(request: AnalyzePhotoRequest): Promise<AnalyzePhotoResponse>;
}

export interface BackendErrorBody {
  code: string;
  message: string;
  requestId?: string;
}
