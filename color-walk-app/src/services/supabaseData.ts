import { COLOR_OPTIONS } from '../data/palette';
import type {
  ColorCategory,
  ColorDistribution,
  CommunityPost,
  DailyTarget,
  FriendRecord,
  LocalAccount,
  MoodRecord,
  PhotoRecord,
} from '../types';
import { toLocalDateString } from '../utils/date';
import { supabase } from './supabase';

const PHOTO_BUCKET = 'color-photos';
const categoryFallback = COLOR_OPTIONS[0];

type DbRow = Record<string, unknown>;

function backendErrorMessage(error: { message?: unknown; code?: unknown; details?: unknown; hint?: unknown }): string {
  const parts = [
    typeof error.message === 'string' ? error.message : '未知后端错误',
    typeof error.code === 'string' ? `code: ${error.code}` : '',
    typeof error.details === 'string' && error.details ? error.details : '',
    typeof error.hint === 'string' && error.hint ? error.hint : '',
  ].filter(Boolean);
  return parts.join(' | ');
}

function client() {
  if (!supabase) throw new Error('Supabase 未配置');
  return supabase;
}

function stringValue(row: DbRow, key: string, fallback = ''): string {
  return typeof row[key] === 'string' ? row[key] : fallback;
}

function targetFor(categoryValue: string, date: string, id: string): DailyTarget {
  const category = categoryValue as ColorCategory;
  const option = COLOR_OPTIONS.find((item) => item.targetCategory === category) ?? categoryFallback;
  return { id, date, ...option, targetCategory: option.targetCategory, source: 'global' };
}

async function displayImageUri(pathOrUrl: string): Promise<string> {
  if (!pathOrUrl || /^(https?:|data:|blob:|file:)/.test(pathOrUrl)) return pathOrUrl;
  const { data, error } = await client().storage.from(PHOTO_BUCKET).createSignedUrl(pathOrUrl, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}

async function photoFromRow(row: DbRow): Promise<PhotoRecord> {
  const createdAt = stringValue(row, 'created_at', new Date().toISOString());
  const targetCategory = stringValue(row, 'target_category', categoryFallback.targetCategory);
  const latitude = typeof row.latitude === 'number' ? row.latitude : null;
  const longitude = typeof row.longitude === 'number' ? row.longitude : null;
  const distribution = (row.color_distribution && typeof row.color_distribution === 'object'
    ? row.color_distribution
    : {}) as ColorDistribution;
  const success = row.success !== false;
  return {
    id: stringValue(row, 'id'),
    imageUri: await displayImageUri(stringValue(row, 'image_url')),
    createdAt,
    source: row.source === 'library' ? 'library' : 'camera',
    location: latitude !== null && longitude !== null ? { latitude, longitude, accuracy: null } : null,
    target: targetFor(targetCategory, toLocalDateString(createdAt), `target-${stringValue(row, 'id')}`),
    analysis: {
      distribution,
      targetCategory: targetCategory as ColorCategory,
      targetRatio: Number(row.target_ratio ?? 0),
      success,
      reason: success ? 'matched' : 'not_matched',
    },
    analysisMode: 'remote',
    storageType: 'synced',
  };
}

export async function ensureProfile(account: LocalAccount): Promise<void> {
  if (!account.id) return;
  const publicId = (account.email?.split('@')[0] || account.id.slice(0, 8)).replace(/[^a-zA-Z0-9_-]/g, '_');
  const { error } = await client().from('profiles').upsert({
    id: account.id,
    nickname: account.nickname,
    public_id: publicId,
    is_discoverable: true,
  }, { onConflict: 'id' });
  if (error) throw error;
}

export async function loadOwnPhotos(userId: string): Promise<PhotoRecord[]> {
  const { data, error } = await client().from('photos').select('*')
    .eq('user_id', userId).is('deleted_at', null).order('created_at', { ascending: false });
  if (error) throw error;
  return Promise.all((data as DbRow[]).map(photoFromRow));
}

export async function uploadCapturedPhoto(userId: string, photo: PhotoRecord): Promise<PhotoRecord> {
  let response: Response;
  try {
    response = await fetch(photo.imageUri);
  } catch (error) {
    throw new Error(`无法读取刚拍摄的图片：${error instanceof Error ? error.message : '浏览器未返回图片数据。'}`);
  }
  if (!response.ok) throw new Error(`无法读取刚拍摄的图片（HTTP ${response.status}）。`);
  const bytes = await response.arrayBuffer();
  if (!bytes.byteLength) throw new Error('刚拍摄的图片为空，无法上传。');
  const mimeType = response.headers.get('content-type') || 'image/jpeg';
  const extension = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const storage = client().storage.from(PHOTO_BUCKET);
  const upload = await storage.upload(path, bytes, { contentType: mimeType, upsert: false });
  if (upload.error) throw new Error(`Storage 上传失败：${backendErrorMessage(upload.error)}`);

  const { data, error } = await client().from('photos').insert({
    user_id: userId,
    image_url: path,
    target_ratio: photo.analysis.targetRatio,
    target_category: photo.target.targetCategory,
    color_distribution: photo.analysis.distribution,
    storage_type: 'synced',
    latitude: photo.location?.latitude ?? null,
    longitude: photo.location?.longitude ?? null,
    visibility: 'private',
    source: photo.source,
    success: photo.analysis.success,
  }).select('*').single();
  if (error) {
    await storage.remove([path]);
    throw new Error(`photos 表写入失败：${backendErrorMessage(error)}`);
  }
  return photoFromRow(data as DbRow);
}

export async function loadMoodRecords(userId: string): Promise<Record<string, MoodRecord>> {
  const { data, error } = await client().from('mood_records').select('*').eq('user_id', userId);
  if (error) throw error;
  return (data as DbRow[]).reduce<Record<string, MoodRecord>>((result, row) => {
    const date = stringValue(row, 'date');
    if (date) result[date] = { date, mood: stringValue(row, 'mood', 'calm') as MoodRecord['mood'], note: stringValue(row, 'note') };
    return result;
  }, {});
}

export async function saveMoodRecord(userId: string, record: MoodRecord): Promise<void> {
  const { error } = await client().from('mood_records').upsert({
    user_id: userId,
    date: record.date,
    mood: record.mood,
    note: record.note,
  }, { onConflict: 'user_id,date' });
  if (error) throw error;
}

export async function loadCommunityPosts(currentUserId: string): Promise<CommunityPost[]> {
  const { data: rows, error } = await client().from('community_posts').select('*')
    .eq('status', 'published').eq('visibility', 'public').order('created_at', { ascending: false }).limit(30);
  if (error) throw error;
  const posts = rows as DbRow[];
  if (!posts.length) return [];
  const photoIds = posts.map((row) => stringValue(row, 'photo_id')).filter(Boolean);
  const authorIds = posts.map((row) => stringValue(row, 'author_id')).filter(Boolean);
  const [{ data: photos, error: photosError }, { data: profiles, error: profilesError }, { data: likes, error: likesError }] = await Promise.all([
    client().from('photos').select('*').in('id', photoIds),
    client().from('profiles').select('id,nickname').in('id', authorIds),
    client().from('post_likes').select('post_id,user_id').in('post_id', posts.map((row) => stringValue(row, 'id'))),
  ]);
  if (photosError) throw photosError;
  if (profilesError) throw profilesError;
  if (likesError) throw likesError;
  const photoById = new Map((photos as DbRow[]).map((row) => [stringValue(row, 'id'), row]));
  const nicknameById = new Map((profiles as DbRow[]).map((row) => [stringValue(row, 'id'), stringValue(row, 'nickname', '色彩漫游者')]));
  const likesByPost = new Map<string, DbRow[]>();
  (likes as DbRow[]).forEach((like) => {
    const postId = stringValue(like, 'post_id');
    likesByPost.set(postId, [...(likesByPost.get(postId) ?? []), like]);
  });
  return Promise.all(posts.map(async (post) => {
    const photo = photoById.get(stringValue(post, 'photo_id'));
    if (!photo) throw new Error('社区帖子缺少关联照片');
    const postLikes = likesByPost.get(stringValue(post, 'id')) ?? [];
    const category = stringValue(photo, 'target_category', categoryFallback.targetCategory);
    return {
      id: stringValue(post, 'id'),
      authorId: stringValue(post, 'author_id'),
      nickname: nicknameById.get(stringValue(post, 'author_id')) ?? '色彩漫游者',
      imageUri: await displayImageUri(stringValue(photo, 'thumbnail_path') || stringValue(photo, 'image_url')),
      createdAt: stringValue(post, 'created_at'),
      caption: stringValue(post, 'caption'),
      colorName: targetFor(category, '', '').colorName,
      colorHex: targetFor(category, '', '').colorHex,
      likes: postLikes.length,
      likedByMe: postLikes.some((like) => stringValue(like, 'user_id') === currentUserId),
      syncStatus: 'synced',
    };
  }));
}

export async function createCommunityPost(userId: string, photoId: string, caption: string): Promise<void> {
  const { error: visibilityError } = await client().from('photos').update({ visibility: 'community' }).eq('id', photoId).eq('user_id', userId);
  if (visibilityError) throw visibilityError;
  const { error } = await client().from('community_posts').insert({ author_id: userId, photo_id: photoId, caption, visibility: 'public', status: 'published' });
  if (error) throw error;
}

export async function toggleCommunityLike(userId: string, postId: string, liked: boolean): Promise<void> {
  const query = liked
    ? client().from('post_likes').delete().eq('post_id', postId).eq('user_id', userId)
    : client().from('post_likes').insert({ post_id: postId, user_id: userId });
  const { error } = await query;
  if (error) throw error;
}

export interface CommunityCommentRecord {
  id: string;
  nickname: string;
  body: string;
  createdAt: string;
}

export async function loadCommunityComments(postId: string): Promise<CommunityCommentRecord[]> {
  const { data: rows, error } = await client().from('post_comments').select('id,author_id,body,created_at')
    .eq('post_id', postId).eq('status', 'published').order('created_at', { ascending: true });
  if (error) throw error;
  const comments = rows as DbRow[];
  const authorIds = comments.map((row) => stringValue(row, 'author_id')).filter(Boolean);
  if (!authorIds.length) return [];
  const { data: profiles, error: profileError } = await client().from('profiles').select('id,nickname').in('id', authorIds);
  if (profileError) throw profileError;
  const nicknameById = new Map((profiles as DbRow[]).map((row) => [stringValue(row, 'id'), stringValue(row, 'nickname', '色彩漫游者')]));
  return comments.map((row) => ({
    id: stringValue(row, 'id'),
    nickname: nicknameById.get(stringValue(row, 'author_id')) ?? '色彩漫游者',
    body: stringValue(row, 'body'),
    createdAt: stringValue(row, 'created_at'),
  }));
}

export async function createCommunityComment(userId: string, postId: string, body: string): Promise<void> {
  const { error } = await client().from('post_comments').insert({
    post_id: postId,
    author_id: userId,
    body,
    status: 'published',
  });
  if (error) throw error;
}

export async function recordCommunityShare(userId: string, postId: string, channel: string): Promise<void> {
  const { error } = await client().from('post_shares').insert({ post_id: postId, user_id: userId, channel });
  if (error) throw error;
}

export async function loadFriends(userId: string): Promise<FriendRecord[]> {
  const { data, error } = await client().from('friendships').select('*')
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`).in('status', ['pending', 'accepted']).order('created_at', { ascending: false });
  if (error) throw error;
  const relations = data as DbRow[];
  const friendIds = relations.map((row) => stringValue(row, 'user_id') === userId ? stringValue(row, 'friend_id') : stringValue(row, 'user_id'));
  if (!friendIds.length) return [];
  const { data: profiles, error: profileError } = await client().from('profiles').select('id,nickname,public_id').in('id', friendIds);
  if (profileError) throw profileError;
  const profileById = new Map((profiles as DbRow[]).map((row) => [stringValue(row, 'id'), row]));
  return relations.map((row) => {
    const friendId = stringValue(row, 'user_id') === userId ? stringValue(row, 'friend_id') : stringValue(row, 'user_id');
    const profile = profileById.get(friendId) ?? {};
    return {
      id: stringValue(row, 'id'),
      lookup: stringValue(profile, 'public_id', friendId),
      nickname: stringValue(profile, 'nickname', '色彩伙伴'),
      addedAt: stringValue(row, 'created_at'),
      status: stringValue(row, 'status', 'pending') as FriendRecord['status'],
    };
  });
}

export async function requestFriend(userId: string, publicId: string): Promise<void> {
  const { data: profile, error: lookupError } = await client().from('profiles').select('id').eq('public_id', publicId).eq('is_discoverable', true).maybeSingle();
  if (lookupError) throw lookupError;
  if (!profile) throw new Error('没有找到可添加的用户 ID。');
  if (profile.id === userId) throw new Error('不能添加自己为好友。');

  const { data: existing, error: existingError } = await client().from('friendships')
    .select('id,status,user_id,friend_id')
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`);
  if (existingError) throw existingError;
  const relation = (existing as DbRow[]).find((row) =>
    (stringValue(row, 'user_id') === userId && stringValue(row, 'friend_id') === profile.id)
    || (stringValue(row, 'friend_id') === userId && stringValue(row, 'user_id') === profile.id),
  );
  if (relation) {
    const status = stringValue(relation, 'status');
    if (status === 'accepted') throw new Error('你们已经是好友了。');
    if (status === 'pending') throw new Error('已有一条好友申请在等待处理。');
  }

  const { error } = await client().from('friendships').insert({ user_id: userId, friend_id: profile.id, status: 'pending' });
  if (error?.code === '23505') throw new Error('已有一条好友申请在等待处理。');
  if (error) throw error;
}

export async function createChallenge(userId: string, mode: 'same_color' | 'own_color', target?: DailyTarget | null): Promise<{ id: string; inviteCode: string }> {
  const date = toLocalDateString();
  const inviteCode = `COLOR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const { data, error } = await client().from('challenges').insert({
    user_a_id: userId,
    creator_id: userId,
    date,
    target_date: date,
    target_id: target?.id && !target.id.startsWith('mock-') && !target.id.startsWith('personal-') ? target.id : null,
    invite_code: inviteCode,
    mode,
    status: 'inviting',
    max_participants: 2,
    expires_at: `${date}T23:59:59.999Z`,
  }).select('id,invite_code').single();
  if (error) throw error;
  const { error: participantError } = await client().from('challenge_participants').insert({ challenge_id: data.id, user_id: userId, status: 'joined' });
  if (participantError) throw participantError;
  return { id: data.id, inviteCode: data.invite_code };
}

export async function getTodayChallenge(userId: string): Promise<{ id: string; inviteCode: string; mode: 'same_color' | 'own_color'; status: string; opponentName: string | null; opponentProgress: number } | null> {
  const date = toLocalDateString();
  const { data: participations, error } = await client().from('challenge_participants').select('challenge_id,score,status').eq('user_id', userId);
  if (error) throw error;
  const ids = (participations as DbRow[]).map((row) => stringValue(row, 'challenge_id')).filter(Boolean);
  if (!ids.length) return null;
  const { data: challenges, error: challengeError } = await client().from('challenges').select('*').in('id', ids).eq('target_date', date).in('status', ['inviting', 'active']);
  if (challengeError) throw challengeError;
  const challenge = (challenges as DbRow[])[0];
  if (!challenge) return null;
  const { data: people, error: peopleError } = await client().from('challenge_participants').select('*').eq('challenge_id', stringValue(challenge, 'id'));
  if (peopleError) throw peopleError;
  const opponent = (people as DbRow[]).find((row) => stringValue(row, 'user_id') !== userId);
  let opponentName: string | null = null;
  if (opponent) {
    const { data: profile } = await client().from('profiles').select('nickname').eq('id', stringValue(opponent, 'user_id')).maybeSingle();
    opponentName = profile?.nickname ?? '色彩搭子';
  }
  return { id: stringValue(challenge, 'id'), inviteCode: stringValue(challenge, 'invite_code'), mode: stringValue(challenge, 'mode', 'same_color') as 'same_color' | 'own_color', status: stringValue(challenge, 'status'), opponentName, opponentProgress: Number(opponent?.score ?? 0) };
}

export async function joinChallenge(userId: string, inviteCode: string): Promise<void> {
  const { data: challenge, error } = await client().from('challenges').select('*').eq('invite_code', inviteCode.trim().toUpperCase()).maybeSingle();
  if (error) throw error;
  if (!challenge) throw new Error('挑战口令不存在。');
  if (challenge.creator_id === userId) throw new Error('不能加入自己创建的挑战。');
  const { error: participantError } = await client().from('challenge_participants').insert({ challenge_id: challenge.id, user_id: userId, status: 'joined' });
  if (participantError) throw participantError;
  const { error: statusError } = await client().from('challenges').update({ user_b_id: userId, status: 'active' }).eq('id', challenge.id);
  if (statusError) throw statusError;
}
