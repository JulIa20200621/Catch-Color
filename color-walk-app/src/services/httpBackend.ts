import type { AppBackend, AnalyzePhotoRequest } from './contracts';
import type { ColorCategory, CommunityPhoto, DailyTarget } from '../types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const analyzeApiUrl = process.env.EXPO_PUBLIC_ANALYZE_API_URL;

function requireValue(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function toDailyTarget(row: Record<string, unknown>): DailyTarget {
  return {
    id: String(row.id),
    date: String(row.date),
    colorHex: String(row.color_hex),
    colorName: String(row.color_name),
    targetCategory: String(row.target_category ?? '红') as DailyTarget['targetCategory'],
    quote: String(row.quote ?? '今天也去捕捉一种颜色。'),
    source: 'global',
  };
}

function toCommunityPhoto(row: Record<string, unknown>): CommunityPhoto | null {
  if (typeof row.image_url !== 'string' || !row.image_url) return null;
  return {
    id: String(row.id),
    imageUrl: row.image_url,
    createdAt: String(row.created_at),
    targetCategory: String(row.target_category ?? '红') as ColorCategory,
    targetRatio: Number(row.target_ratio ?? row.match_score ?? 0),
    nickname: String(row.nickname ?? '色彩漫游者'),
    locationLabel: typeof row.location_label === 'string' ? row.location_label : null,
  };
}

export const httpBackend: AppBackend = {
  async getDailyTarget(date) {
    const baseUrl = requireValue(supabaseUrl, 'EXPO_PUBLIC_SUPABASE_URL');
    const apiKey = requireValue(supabaseAnonKey, 'EXPO_PUBLIC_SUPABASE_ANON_KEY');
    const query = new URLSearchParams({
      select: '*',
      date: `eq.${date}`,
      limit: '1',
    });
    const response = await fetch(`${baseUrl}/rest/v1/daily_targets?${query}`, {
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) throw new Error(`Daily target request failed: ${response.status}`);
    const rows = (await response.json()) as Record<string, unknown>[];
    if (!rows[0]) throw new Error('No daily target configured for today');
    return toDailyTarget(rows[0]);
  },

  async getCommunityPhotos(limit = 24) {
    const baseUrl = requireValue(supabaseUrl, 'EXPO_PUBLIC_SUPABASE_URL');
    const apiKey = requireValue(supabaseAnonKey, 'EXPO_PUBLIC_SUPABASE_ANON_KEY');
    const query = new URLSearchParams({
      select: '*',
      storage_type: 'eq.synced',
      order: 'created_at.desc',
      limit: String(limit),
    });
    const response = await fetch(`${baseUrl}/rest/v1/photos?${query}`, {
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) throw new Error(`Community request failed: ${response.status}`);
    const rows = (await response.json()) as Record<string, unknown>[];
    return rows.map(toCommunityPhoto).filter((item): item is CommunityPhoto => item !== null);
  },

  async analyzePhoto(request: AnalyzePhotoRequest) {
    const endpoint = requireValue(analyzeApiUrl, 'EXPO_PUBLIC_ANALYZE_API_URL');
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) throw new Error(`Analyze request failed: ${response.status}`);
    return response.json();
  },
};
