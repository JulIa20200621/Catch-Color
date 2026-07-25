import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ChallengeState, CommunityPost, DailyTarget, FriendRecord, LocalAccount, MoodRecord, PhotoRecord } from '../types';

interface AppState {
  dailyTarget: DailyTarget | null;
  photos: PhotoRecord[];
  communityPosts: CommunityPost[];
  friends: FriendRecord[];
  rebelledDate: string | null;
  challenge: ChallengeState | null;
  moods: Record<string, MoodRecord>;
  account: LocalAccount | null;
  isAnalyzing: boolean;
  setDailyTarget: (target: DailyTarget) => void;
  addPhoto: (photo: PhotoRecord) => void;
  setPhotos: (photos: PhotoRecord[]) => void;
  addCommunityPost: (post: CommunityPost) => void;
  toggleCommunityPostLike: (postId: string) => void;
  addFriend: (friend: FriendRecord) => void;
  rebelToday: (target: DailyTarget) => void;
  setChallenge: (challenge: ChallengeState | null) => void;
  saveMood: (record: MoodRecord) => void;
  setMoods: (records: Record<string, MoodRecord>) => void;
  registerAccount: (phone: string) => void;
  setAuthenticatedAccount: (account: LocalAccount) => void;
  updateNickname: (nickname: string) => void;
  logout: () => void;
  setAnalyzing: (value: boolean) => void;
  clearDemoData: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      dailyTarget: null,
      photos: [],
      communityPosts: [],
      friends: [],
      rebelledDate: null,
      challenge: null,
      moods: {},
      account: null,
      isAnalyzing: false,
      setDailyTarget: (dailyTarget) => set({ dailyTarget }),
      addPhoto: (photo) =>
        set((state) => ({ photos: [photo, ...state.photos] })),
      setPhotos: (photos) => set({ photos }),
      addCommunityPost: (post) =>
        set((state) => ({ communityPosts: [post, ...state.communityPosts] })),
      toggleCommunityPostLike: (postId) => set((state) => ({
        communityPosts: state.communityPosts.map((post) => post.id !== postId ? post : {
          ...post,
          likedByMe: !post.likedByMe,
          likes: Math.max(0, post.likes + (post.likedByMe ? -1 : 1)),
        }),
      })),
      addFriend: (friend) => set((state) => ({
        friends: [friend, ...state.friends.filter((item) => item.lookup !== friend.lookup)],
      })),
      rebelToday: (dailyTarget) =>
        set({ dailyTarget, rebelledDate: dailyTarget.date }),
      setChallenge: (challenge) => set({ challenge }),
      saveMood: (record) =>
        set((state) => ({ moods: { ...state.moods, [record.date]: record } })),
      setMoods: (moods) => set({ moods }),
      registerAccount: (phone) => set({
        account: { phone, nickname: '小鹿', registeredAt: new Date().toISOString() },
      }),
      setAuthenticatedAccount: (account) => set({ account }),
      updateNickname: (nickname) => set((state) => state.account ? {
        account: { ...state.account, nickname: nickname.trim() || state.account.nickname },
      } : state),
      logout: () => set({ account: null }),
      setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
      clearDemoData: () => set({ photos: [] }),
    }),
    {
      name: 'color-walk-demo',
      version: 4,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persistedState) => {
        const state = persistedState as Partial<AppState>;
        return {
          ...state,
          dailyTarget: state.dailyTarget
            ? { ...state.dailyTarget, source: state.dailyTarget.source ?? 'global' }
            : null,
          rebelledDate: state.rebelledDate ?? null,
          challenge: state.challenge ?? null,
          moods: state.moods ?? {},
          communityPosts: state.communityPosts ?? [],
          friends: state.friends ?? [],
          account: state.account ?? null,
        } as AppState;
      },
      partialize: (state) => ({
        dailyTarget: state.dailyTarget,
        photos: state.photos,
        communityPosts: state.communityPosts,
        friends: state.friends,
        rebelledDate: state.rebelledDate,
        challenge: state.challenge,
        moods: state.moods,
        account: state.account,
      }),
    },
  ),
);
