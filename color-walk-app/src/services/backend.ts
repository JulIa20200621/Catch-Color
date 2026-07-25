import type { AppBackend } from './contracts';
import { httpBackend } from './httpBackend';
import { mockBackend } from './mockBackend';

const hasSupabaseConfig = Boolean(
  process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
);
export const isMockMode =
  process.env.EXPO_PUBLIC_USE_MOCK === 'true' || !hasSupabaseConfig;

export const backend: AppBackend = isMockMode
  ? mockBackend
  : {
      ...httpBackend,
      async getDailyTarget(date) {
        try {
          return await httpBackend.getDailyTarget(date);
        } catch (error) {
          if (error instanceof Error && error.message === 'No daily target configured for today') {
            return mockBackend.getDailyTarget(date);
          }
          throw error;
        }
      },
    };
