import { useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getAnimalAsset } from '../data/animalAssets';
import { app2Animals, app2Colors, getApp2Color } from '../data/app2Mock';
import { Screen } from '../components/Screen';
import { useAppStore } from '../store/useAppStore';
import { colors } from '../theme/colors';
import type { MainTabParamList, PhotoRecord, RootStackParamList } from '../types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Album'>,
  NativeStackScreenProps<RootStackParamList>
>;
type Tab = 'color' | 'date' | 'map' | 'gallery';

const categoryToColorId: Record<string, string> = {
  红: 'red', 橙: 'orange', 黄: 'yellow', 绿: 'green', 青: 'cyan', 蓝: 'blue', 紫: 'purple', 粉: 'pink',
};

function photoColorId(photo: PhotoRecord): string | null {
  const category = categoryToColorId[photo.target.targetCategory];
  if (category) return category;
  const targetHex = photo.target.colorHex.toLowerCase();
  return app2Colors.find((color) => color.hex.toLowerCase() === targetHex)?.id ?? null;
}

function dateKey(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '未知日期';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '未知日期';
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

// Native translation of app-2/pages/AlbumPage.tsx, backed by the signed-in user's captured photos.
export function AlbumScreen({ navigation }: Props) {
  const [tab, setTab] = useState<Tab>('gallery');
  const [colorFilter, setColorFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<PhotoRecord | null>(null);
  const ownedPhotos = useAppStore((state) => state.photos);
  const photosOfColor = useMemo(
    () => colorFilter ? ownedPhotos.filter((photo) => photoColorId(photo) === colorFilter) : [],
    [colorFilter, ownedPhotos],
  );
  const byDate = useMemo(() => {
    const groups = new Map<string, PhotoRecord[]>();
    ownedPhotos.forEach((photo) => {
      const key = dateKey(photo.createdAt);
      groups.set(key, [...(groups.get(key) ?? []), photo]);
    });
    return [...groups.entries()].sort(([left], [right]) => right.localeCompare(left));
  }, [ownedPhotos]);

  const renderEmpty = (title: string, copy: string) => <View style={styles.emptyGallery}><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyText}>{copy}</Text></View>;

  return <Screen><View style={styles.page}>
    <View style={styles.tabs}>{([['color', '按颜色'], ['date', '按日期'], ['map', '地图'], ['gallery', '画廊']] as const).map(([key, label]) => <Pressable key={key} style={[styles.tab, tab === key && styles.tabActive]} onPress={() => setTab(key)}><Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text></Pressable>)}</View>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {tab === 'color' ? <View style={styles.animalGrid}>{app2Animals.map(([id, animalName, emoji], index) => { const color = app2Colors[index]; const count = ownedPhotos.filter((photo) => photoColorId(photo) === color.id).length; const animalAsset = getAnimalAsset(id); return <Pressable key={id} style={styles.animalItem} onPress={() => setColorFilter(color.id)}><View style={[styles.animalCircle, { backgroundColor: color.soft }]}>{animalAsset ? <Image source={animalAsset} style={styles.animalImage} resizeMode="contain" /> : <Text style={styles.animalEmoji}>{emoji}</Text>}</View><Text style={styles.animalColor}>{color.name}</Text><Text style={styles.animalMeta}>{animalName} · {count} 张</Text></Pressable>; })}</View> : null}
      {tab === 'date' ? (byDate.length ? <View style={styles.dateList}>{byDate.map(([date, photos]) => <View key={date}><Text style={styles.dateLabel}>{date.replaceAll('-', '.')}</Text><View style={styles.dateGrid}>{photos.map((photo) => <Pressable key={photo.id} style={styles.dateTile} onPress={() => setSelected(photo)}><Image source={{ uri: photo.imageUri }} style={styles.ownedImage} /></Pressable>)}</View></View>)}</View> : renderEmpty('还没有色彩足迹', '拍摄或从相册选择照片后，会按真实日期整理在这里。')) : null}
      {tab === 'gallery' ? (ownedPhotos.length ? <View style={styles.gallery}>{ownedPhotos.map((photo) => <Pressable key={photo.id} style={styles.galleryTile} onPress={() => setSelected(photo)}><Image source={{ uri: photo.imageUri }} style={styles.ownedImage} /><Text style={styles.galleryDate}>{dateLabel(photo.createdAt).slice(5)}</Text></Pressable>)}</View> : renderEmpty('这里还没有你的照片', '拍下第一种颜色后，它会出现在这里。')) : null}
      {tab === 'map' ? <View style={styles.map}><View style={styles.roadHorizontal} /><View style={styles.roadVertical} /><View style={styles.river} /><View style={styles.route} /><Text style={styles.mapTitle}>色彩漫步地图</Text><Text style={styles.mapText}>已记录 {ownedPhotos.filter((photo) => photo.location).length} 个有定位的色彩足迹</Text><Pressable style={styles.mapAction} onPress={() => navigation.navigate('Footprint')}><Text style={styles.mapActionText}>查看我的真实足迹</Text></Pressable></View> : null}
    </ScrollView>
    <Modal visible={colorFilter !== null} transparent animationType="slide" onRequestClose={() => setColorFilter(null)}><View style={styles.modalMask}><View style={styles.drawer}><View style={styles.drawerHandle} /><Text style={styles.drawerTitle}>{colorFilter ? `${getApp2Color(colorFilter).name} · 色彩小书` : ''}</Text>{photosOfColor.length ? <ScrollView contentContainerStyle={styles.bookGrid}>{photosOfColor.map((photo) => <Pressable key={photo.id} style={styles.bookItem} onPress={() => { setColorFilter(null); setSelected(photo); }}><Image source={{ uri: photo.imageUri }} style={styles.bookArt} /><Text style={styles.bookName}>{photo.target.colorName}</Text><Text style={styles.bookDate}>{dateLabel(photo.createdAt)}</Text></Pressable>)}</ScrollView> : <Text style={styles.emptyBook}>还没有拍到这个颜色的照片。</Text>}</View></View></Modal>
    <Modal visible={selected !== null} transparent animationType="fade" onRequestClose={() => setSelected(null)}><View style={styles.detailMask}><Pressable style={styles.close} onPress={() => setSelected(null)}><Text style={styles.closeText}>×</Text></Pressable>{selected ? <View style={styles.detailCard}><Image source={{ uri: selected.imageUri }} style={styles.detailArt} /><Text style={styles.detailName}>{selected.target.colorName}</Text><Text style={styles.detailMeta}>{dateLabel(selected.createdAt)}</Text><Text style={styles.detailLocation}>{selected.location ? '已记录拍摄位置' : '未记录拍摄位置'}</Text></View> : null}</View></Modal>
  </View></Screen>;
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingTop: 8 }, tabs: { height: 42, flexDirection: 'row', justifyContent: 'space-around', borderBottomWidth: 1, borderBottomColor: colors.line }, tab: { paddingHorizontal: 11, justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' }, tabActive: { borderBottomColor: colors.ink }, tabText: { color: colors.inkMuted, fontSize: 13, fontWeight: '600' }, tabTextActive: { color: colors.ink }, content: { padding: 12, paddingBottom: 92 }, animalGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 20 }, animalItem: { width: '33.333%', alignItems: 'center' }, animalCircle: { width: 80, height: 80, borderRadius: 26, alignItems: 'center', justifyContent: 'center', shadowColor: '#3C3732', shadowOpacity: 0.12, shadowRadius: 5, elevation: 2 }, animalImage: { width: 68, height: 68 }, animalEmoji: { fontSize: 38 }, animalColor: { marginTop: 8, color: colors.ink, fontSize: 11, fontWeight: '700' }, animalMeta: { marginTop: 2, color: colors.inkMuted, fontSize: 9, fontWeight: '500' }, dateList: { gap: 20 }, dateLabel: { paddingHorizontal: 4, marginBottom: 8, color: colors.ink, fontSize: 13, fontWeight: '700' }, dateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, dateTile: { width: '23.6%', aspectRatio: 1, overflow: 'hidden', borderRadius: 8, backgroundColor: colors.line }, gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, galleryTile: { width: '23.5%', aspectRatio: 1, overflow: 'hidden', borderRadius: 8, backgroundColor: colors.line }, ownedImage: { width: '100%', height: '100%' }, galleryDate: { position: 'absolute', left: 5, bottom: 4, color: colors.white, fontSize: 8, fontWeight: '700' }, emptyGallery: { minHeight: 330, alignItems: 'center', justifyContent: 'center', padding: 32 }, emptyTitle: { color: colors.ink, fontSize: 17, fontWeight: '700' }, emptyText: { marginTop: 7, color: colors.inkMuted, textAlign: 'center', fontSize: 12 }, map: { height: 560, overflow: 'hidden', borderRadius: 18, backgroundColor: '#EEF0DC' }, roadHorizontal: { position: 'absolute', left: -10, right: -10, top: 180, height: 14, backgroundColor: '#FFFDF4' }, roadVertical: { position: 'absolute', top: -10, bottom: -10, left: '50%', width: 12, backgroundColor: '#FFFDF4' }, river: { position: 'absolute', left: 0, right: 0, top: 330, height: 44, backgroundColor: '#C4E2DA', transform: [{ rotate: '-3deg' }] }, route: { position: 'absolute', left: '23%', top: '19%', height: '59%', width: 6, borderRadius: 6, backgroundColor: '#E59266', transform: [{ rotate: '26deg' }] }, mapTitle: { position: 'absolute', left: 18, top: 18, color: colors.ink, fontSize: 17, fontWeight: '700' }, mapText: { position: 'absolute', left: 18, top: 44, color: colors.inkMuted, fontSize: 11, fontWeight: '600' }, mapAction: { position: 'absolute', left: 18, right: 18, bottom: 18, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink }, mapActionText: { color: colors.white, fontSize: 13, fontWeight: '700' }, modalMask: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(59,59,62,0.28)' }, drawer: { minHeight: '65%', maxHeight: '78%', padding: 18, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: colors.paper }, drawerHandle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 4, backgroundColor: colors.line }, drawerTitle: { marginTop: 14, marginBottom: 18, color: colors.ink, fontSize: 17, fontWeight: '700' }, bookGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 20 }, bookItem: { width: '33.333%', paddingHorizontal: 5 }, bookArt: { width: '100%', aspectRatio: 0.75, borderRadius: 6 }, bookName: { marginTop: 8, color: colors.primary, fontSize: 12, fontWeight: '700' }, bookDate: { marginTop: 2, color: colors.inkMuted, fontSize: 10 }, emptyBook: { paddingVertical: 36, color: colors.inkMuted, textAlign: 'center', fontSize: 12 }, detailMask: { flex: 1, justifyContent: 'center', padding: 28, backgroundColor: 'rgba(59,59,62,0.86)' }, close: { position: 'absolute', top: 52, right: 24, zIndex: 1, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }, closeText: { color: colors.white, fontSize: 32, fontWeight: '300' }, detailCard: { padding: 14, borderRadius: 6, backgroundColor: colors.white }, detailArt: { width: '100%', aspectRatio: 0.82, borderRadius: 6 }, detailName: { marginTop: 16, color: colors.primary, fontSize: 19, fontWeight: '700' }, detailMeta: { marginTop: 4, color: colors.inkMuted, fontSize: 11, fontWeight: '600' }, detailLocation: { marginTop: 5, color: colors.ink, fontSize: 11 },
});
