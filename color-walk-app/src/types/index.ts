import type { NavigatorScreenParams } from '@react-navigation/native';

export type ColorCategory =
  | '红'
  | '橙'
  | '黄'
  | '绿'
  | '青'
  | '蓝'
  | '紫'
  | '粉';

export type ColorDistribution = Partial<Record<ColorCategory, number>>;

export interface DailyTarget {
  id: string;
  date: string;
  colorHex: string;
  colorName: string;
  targetCategory: ColorCategory;
  quote: string;
  source: 'global' | 'personal';
}

export interface PhotoLocation {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

export interface ColorAnalysisResult {
  distribution: ColorDistribution;
  targetCategory: ColorCategory;
  targetRatio: number;
  success: boolean;
  reason: 'matched' | 'not_matched' | 'too_dark';
  brightness?: number;
  colorCoverage?: number;
}

export interface PhotoRecord {
  id: string;
  imageUri: string;
  createdAt: string;
  source: 'camera' | 'library';
  location: PhotoLocation | null;
  target: DailyTarget;
  analysis: ColorAnalysisResult;
  analysisMode: 'mock' | 'local' | 'remote';
  storageType: 'local' | 'synced';
}

export interface CommunityPhoto {
  id: string;
  imageUrl: string;
  createdAt: string;
  targetCategory: ColorCategory;
  targetRatio: number;
  nickname: string;
  locationLabel: string | null;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  nickname: string;
  imageUri: string;
  createdAt: string;
  caption: string;
  colorName: string;
  colorHex: string;
  likes: number;
  likedByMe: boolean;
  syncStatus: 'local' | 'synced';
}

export interface FriendRecord {
  id: string;
  lookup: string;
  nickname: string;
  addedAt: string;
  status: 'pending' | 'accepted';
}

export interface ChallengeState {
  id: string;
  inviteCode: string;
  mode: 'same_color' | 'own_color';
  opponentName: string | null;
  opponentProgress: number;
  status: 'inviting' | 'active' | 'expired';
  date: string;
}

export type MoodType = 'happy' | 'calm' | 'sad' | 'restless' | 'excited';

export interface MoodRecord {
  date: string;
  mood: MoodType;
  note: string;
}

export interface LocalAccount {
  id?: string;
  phone: string;
  email?: string;
  nickname: string;
  registeredAt: string;
}

export type RootStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  Camera: { initialFacing?: 'front' | 'back' } | undefined;
  Result: { photoId: string };
  Footprint: undefined;
  Challenge: undefined;
};

export type MainTabParamList = {
  Today: undefined;
  Album: undefined;
  Community: undefined;
  Diary: undefined;
  Me: undefined;
};
