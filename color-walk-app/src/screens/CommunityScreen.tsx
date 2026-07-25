import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createCommunityPost, loadCommunityPosts, loadFriends, requestFriend, toggleCommunityLike } from '../services/supabaseData';
import { Screen } from '../components/Screen';
import { useAppStore } from '../store/useAppStore';
import { colors } from '../theme/colors';
import { getPhotoStats } from '../utils/photoStats';
import type { CommunityPost, FriendRecord, MainTabParamList, PhotoRecord, RootStackParamList } from '../types';

type Props = BottomTabScreenProps<MainTabParamList, 'Community'>;
type Tab = 'friends' | 'rank' | 'community';
type FeedPost = Pick<CommunityPost, 'id' | 'nickname' | 'imageUri' | 'createdAt' | 'caption' | 'colorName' | 'colorHex' | 'likes' | 'likedByMe'> & { local: boolean };

const categoryHex: Record<string, string> = { 红: '#E5AFA8', 橙: '#EDC9A2', 黄: '#EDDFA8', 绿: '#BFD6B2', 青: '#AFD8CD', 蓝: '#B2CCE2', 紫: '#C9BCDC', 粉: '#EBC2D3' };

function relativeTime(value: string): string {
  const milliseconds = Date.now() - new Date(value).getTime();
  if (milliseconds < 60_000) return '刚刚';
  if (milliseconds < 3_600_000) return `${Math.floor(milliseconds / 60_000)} 分钟前`;
  if (milliseconds < 86_400_000) return `${Math.floor(milliseconds / 3_600_000)} 小时前`;
  return new Date(value).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}

// Native translation of app-2/pages/PartnerPage.tsx, backed by Supabase posts and private photo URLs.
export function CommunityScreen({ navigation }: Props) {
  const [tab, setTab] = useState<Tab>('friends');
  const [publishing, setPublishing] = useState(false);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [addingFriend, setAddingFriend] = useState(false);
  const [friendLookup, setFriendLookup] = useState('');
  const [friendNickname, setFriendNickname] = useState('');
  const [remotePosts, setRemotePosts] = useState<FeedPost[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const account = useAppStore((state) => state.account);
  const photos = useAppStore((state) => state.photos);
  const localPosts = useAppStore((state) => state.communityPosts);
  const friends = useAppStore((state) => state.friends);
  const addCommunityPost = useAppStore((state) => state.addCommunityPost);
  const toggleLike = useAppStore((state) => state.toggleCommunityPostLike);
  const addFriend = useAppStore((state) => state.addFriend);
  const selectedPhoto = photos.find((photo) => photo.id === selectedPhotoId) ?? null;
  const photoStats = getPhotoStats(photos);
  const openChallenge = () => navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('Challenge');

  const loadFeed = useCallback(async () => {
    if (!account?.id) return;
    setIsLoadingFeed(true);
    setFeedError(null);
    try {
      setRemotePosts((await loadCommunityPosts(account.id)).map((post) => ({ ...post, local: false })));
    } catch {
      setFeedError('暂时无法读取社区动态；你仍可查看本机已发布的内容。');
    } finally {
      setIsLoadingFeed(false);
    }
  }, [account?.id]);

  useEffect(() => { void loadFeed(); }, [loadFeed]);
  useEffect(() => {
    if (!account?.id) return;
    void loadFriends(account.id).then((records) => records.forEach(addFriend)).catch((error) => console.warn('Load friends failed', error));
  }, [account?.id, addFriend]);

  const feed = useMemo<FeedPost[]>(() => [
    ...localPosts.map((post) => ({ ...post, local: true })),
    ...remotePosts,
  ].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()), [localPosts, remotePosts]);

  const openPublish = () => {
    if (!photos.length) {
      Alert.alert('还没有可发布的照片', '先拍摄或从相册选择一张照片，再来分享吧。');
      return;
    }
    setSelectedPhotoId(photos[0].id);
    setCaption('');
    setPublishing(true);
  };

  const publish = async () => {
    if (!selectedPhoto || !account) return;
    if (!account.id) return;
    try {
      await createCommunityPost(account.id, selectedPhoto.id, caption.trim() || `今天捕捉到${selectedPhoto.target.colorName}。`);
      setPublishing(false);
      setTab('community');
      await loadFeed();
    } catch (error) {
      Alert.alert('发布失败', error instanceof Error ? error.message : '请稍后重试');
    }
  };

  const openAddFriend = () => {
    setFriendLookup('');
    setFriendNickname('');
    setAddingFriend(true);
  };

  const saveFriend = async () => {
    const lookup = friendLookup.trim().toLowerCase();
    if (!lookup) {
      Alert.alert('请输入用户 ID 或邮箱');
      return;
    }
    if (!account?.id) return;
    try {
      await requestFriend(account.id, lookup);
      const records = await loadFriends(account.id);
      records.forEach(addFriend);
      setAddingFriend(false);
    } catch (error) {
      Alert.alert('好友申请失败', error instanceof Error ? error.message : '请稍后重试');
    }
  };

  const togglePostLike = async (post: FeedPost) => {
    if (!account?.id || post.local) return;
    try {
      await toggleCommunityLike(account.id, post.id, post.likedByMe);
      await loadFeed();
    } catch (error) {
      Alert.alert('点赞失败', error instanceof Error ? error.message : '请稍后重试');
    }
  };
  const renderPost = (post: FeedPost) => <View key={post.id} style={styles.post}><View style={styles.postTop}><View style={[styles.friendAvatar, { backgroundColor: `${post.colorHex}40` }]}><Text style={styles.friendEmoji}>🎨</Text></View><View style={styles.friendCopy}><Text style={styles.friendName}>{post.nickname}</Text><Text style={styles.postTime}>{relativeTime(post.createdAt)} · {post.colorName}{post.local ? ' · 本机待同步' : ''}</Text></View></View><Text style={styles.postText}>{post.caption}</Text><Image source={{ uri: post.imageUri }} style={styles.postImage} resizeMode="cover" /><View style={styles.postActions}><Pressable onPress={() => void togglePostLike(post)} hitSlop={8}><Text style={[styles.action, post.likedByMe && styles.likedAction]}>{post.likedByMe ? '♥' : '♡'} {post.likes}</Text></Pressable><Text style={styles.action}>◌ 评论</Text><Text style={styles.action}>↗ 分享</Text></View></View>;

  return <Screen><View style={styles.page}><View style={styles.tabs}>{([['friends', '好友'], ['rank', '排行榜'], ['community', '社区']] as const).map(([key, label]) => <Pressable key={key} style={[styles.tab, tab === key && styles.tabActive]} onPress={() => setTab(key)}><Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text></Pressable>)}</View><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    {tab === 'friends' ? <><View style={styles.friendHead}><View><Text style={styles.title}>我的伙伴</Text><Text style={styles.subtitle}>和朋友一起收集今天的颜色</Text></View><Pressable style={styles.add} onPress={openAddFriend}><Text style={styles.addText}>＋</Text></Pressable></View>{friends.length ? friends.map((friend) => <View key={friend.id} style={styles.friendCard}><View style={styles.friendAvatar}><Text style={styles.friendEmoji}>👋</Text></View><View style={styles.friendCopy}><Text style={styles.friendName}>{friend.nickname}</Text><Text style={styles.friendMeta}>{friend.status === 'pending' ? '等待对方确认好友申请' : '已成为你的色彩伙伴'}</Text><View style={styles.progressTrack}><View style={[styles.progress, { width: friend.status === 'accepted' ? '20%' : '0%' }]} /></View></View><Pressable style={styles.pk} onPress={openChallenge}><Text style={styles.pkText}>PK</Text></Pressable></View>) : <View style={styles.emptyFeed}><Text style={styles.emptyTitle}>还没有伙伴</Text><Text style={styles.emptyText}>点击右上角加号，用公开用户 ID 添加朋友。</Text></View>}</> : null}
    {tab === 'rank' ? <><Text style={styles.title}>本周色彩榜</Text><Text style={styles.subtitle}>排行榜将在后端聚合 View 接入后显示所有用户</Text><View style={styles.rankCard}><View style={styles.rankRow}><Text style={styles.medal}>•</Text><View style={styles.rankAvatar}><Text>🎨</Text></View><Text style={styles.rankName}>你</Text><Text style={styles.score}>{photoStats.colorCount} 色</Text></View></View><Pressable style={styles.multiPk} onPress={openChallenge}><Text style={styles.multiText}>⚔ 发起颜色 PK</Text></Pressable></> : null}
    {tab === 'community' ? <><View style={styles.communityHead}><View><Text style={styles.title}>色彩社区</Text><Text style={styles.subtitle}>分享你今天发现的小颜色</Text></View><View style={styles.communityActions}><Pressable style={styles.refresh} onPress={() => void loadFeed()}><Text style={styles.refreshText}>↻</Text></Pressable><Pressable style={styles.publish} onPress={openPublish}><Text style={styles.publishText}>＋ 发布</Text></Pressable></View></View>{isLoadingFeed ? <ActivityIndicator style={styles.loader} color={colors.coral} /> : null}{feedError ? <Text style={styles.feedError}>{feedError}</Text> : null}{feed.length ? feed.map(renderPost) : <View style={styles.emptyFeed}><Text style={styles.emptyTitle}>还没有公开动态</Text><Text style={styles.emptyText}>发布你的第一张色彩照片吧。</Text></View>}</> : null}
  </ScrollView>
  <Modal visible={publishing} transparent animationType="slide" onRequestClose={() => setPublishing(false)}><View style={styles.mask}><View style={styles.drawer}><View style={styles.handle} /><Text style={styles.drawerTitle}>发布色彩动态</Text><Text style={styles.fieldLabel}>选择自己的照片</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoPicker}>{photos.map((photo: PhotoRecord) => <Pressable key={photo.id} style={[styles.pickTile, selectedPhotoId === photo.id && styles.pickTileActive]} onPress={() => setSelectedPhotoId(photo.id)}><Image source={{ uri: photo.imageUri }} style={styles.pickImage} /><View style={[styles.pickColor, { backgroundColor: photo.target.colorHex }]} /></Pressable>)}</ScrollView><Text style={styles.fieldLabel}>想说的话</Text><TextInput value={caption} onChangeText={setCaption} maxLength={140} multiline placeholder="比如：散步时遇到一块特别温柔的蓝。" placeholderTextColor="#B4A88E" style={styles.captionInput} /><Text style={styles.syncHint}>发布后将立即写入社区；原图仍保留在私有相册 bucket 中。</Text><Pressable style={styles.publishSubmit} onPress={() => void publish()}><Text style={styles.publishSubmitText}>发布动态</Text></Pressable></View></View></Modal>
  <Modal visible={addingFriend} transparent animationType="slide" onRequestClose={() => setAddingFriend(false)}><View style={styles.mask}><View style={styles.friendDrawer}><View style={styles.handle} /><Text style={styles.drawerTitle}>添加伙伴</Text><Text style={styles.fieldLabel}>对方的公开用户 ID</Text><TextInput value={friendLookup} onChangeText={setFriendLookup} autoCapitalize="none" autoCorrect={false} placeholder="例如：colorwalker" placeholderTextColor="#B4A88E" style={styles.singleInput} /><Text style={styles.fieldLabel}>备注昵称（可选）</Text><TextInput value={friendNickname} onChangeText={setFriendNickname} maxLength={12} placeholder="例如：小满" placeholderTextColor="#B4A88E" style={styles.singleInput} /><Text style={styles.syncHint}>会向对应用户发送真实好友申请；对方确认后即可成为伙伴。</Text><Pressable style={styles.publishSubmit} onPress={() => void saveFriend()}><Text style={styles.publishSubmitText}>发送好友申请</Text></Pressable></View></View></Modal>
  </View></Screen>;
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingTop: 8 }, tabs: { height: 42, flexDirection: 'row', justifyContent: 'center', gap: 30, borderBottomWidth: 1, borderBottomColor: colors.line }, tab: { justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' }, tabActive: { borderBottomColor: colors.ink }, tabText: { color: colors.inkMuted, fontSize: 13, fontWeight: '600' }, tabTextActive: { color: colors.ink }, content: { padding: 20, paddingBottom: 96, gap: 14 }, friendHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }, title: { color: colors.ink, fontSize: 20, fontWeight: '700' }, subtitle: { marginTop: 5, color: colors.inkMuted, fontSize: 11, fontWeight: '500' }, add: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceStrong }, addText: { color: colors.ink, fontSize: 26, fontWeight: '300' }, friendCard: { minHeight: 82, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface }, friendAvatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.7)' }, friendEmoji: { fontSize: 20 }, friendCopy: { flex: 1 }, friendName: { color: colors.ink, fontSize: 13, fontWeight: '700' }, friendMeta: { marginTop: 3, color: colors.inkMuted, fontSize: 10, fontWeight: '500' }, progressTrack: { height: 4, marginTop: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: colors.line }, progress: { height: '100%', borderRadius: 4, backgroundColor: '#7EC67E' }, pk: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 13, backgroundColor: '#F6ECE9' }, pkText: { color: colors.coral, fontSize: 11, fontWeight: '700' }, rankCard: { marginTop: 20, overflow: 'hidden', borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface }, rankRow: { height: 62, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }, rankBorder: { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' }, medal: { width: 25, color: colors.ink, textAlign: 'center', fontSize: 16, fontWeight: '700' }, rankAvatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surfaceStrong }, rankName: { flex: 1, color: colors.ink, fontSize: 13, fontWeight: '700' }, score: { color: colors.primary, fontSize: 12, fontWeight: '700' }, multiPk: { height: 48, marginTop: 16, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink }, multiText: { color: colors.white, fontSize: 14, fontWeight: '700' }, communityHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, communityActions: { flexDirection: 'row', gap: 8, alignItems: 'center' }, refresh: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceStrong }, refreshText: { color: colors.ink, fontSize: 20 }, publish: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 14, backgroundColor: colors.ink }, publishText: { color: colors.white, fontSize: 11, fontWeight: '700' }, loader: { marginTop: 26 }, feedError: { padding: 10, borderRadius: 10, color: colors.inkMuted, fontSize: 11, backgroundColor: '#F8EEE5' }, post: { padding: 14, borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface }, postTop: { flexDirection: 'row', alignItems: 'center', gap: 9 }, postTime: { marginTop: 2, color: colors.inkMuted, fontSize: 10 }, postText: { marginTop: 12, color: colors.ink, fontSize: 12, lineHeight: 19, fontWeight: '500' }, postImage: { width: '100%', height: 210, marginTop: 12, borderRadius: 14, backgroundColor: colors.line }, postActions: { marginTop: 10, flexDirection: 'row', gap: 18 }, action: { color: colors.inkMuted, fontSize: 11, fontWeight: '600' }, likedAction: { color: colors.coral }, emptyFeed: { minHeight: 260, alignItems: 'center', justifyContent: 'center', padding: 28 }, emptyTitle: { color: colors.ink, fontSize: 16, fontWeight: '700' }, emptyText: { marginTop: 7, color: colors.inkMuted, fontSize: 12 }, mask: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(59,59,62,0.32)' }, drawer: { padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: colors.paper }, friendDrawer: { padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: colors.paper }, handle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 4, backgroundColor: colors.line }, drawerTitle: { marginTop: 14, color: colors.ink, fontSize: 18, fontWeight: '700' }, fieldLabel: { marginTop: 18, color: colors.ink, fontSize: 12, fontWeight: '700' }, photoPicker: { marginTop: 9, gap: 10 }, pickTile: { width: 72, height: 72, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent', borderRadius: 10 }, pickTileActive: { borderColor: colors.ink }, pickImage: { width: '100%', height: '100%' }, pickColor: { position: 'absolute', right: 4, bottom: 4, width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: colors.white }, captionInput: { minHeight: 86, marginTop: 9, padding: 12, borderRadius: 12, color: colors.ink, backgroundColor: 'rgba(255,255,255,0.7)', textAlignVertical: 'top', fontSize: 12 }, singleInput: { height: 46, marginTop: 9, paddingHorizontal: 12, borderRadius: 12, color: colors.ink, backgroundColor: 'rgba(255,255,255,0.7)', fontSize: 12 }, syncHint: { marginTop: 9, color: colors.inkMuted, fontSize: 10, lineHeight: 15 }, publishSubmit: { height: 46, marginTop: 16, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink }, publishSubmitText: { color: colors.white, fontSize: 14, fontWeight: '700' },
});
