import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { useAppStore } from '../store/useAppStore';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Footprint'>;

export function FootprintScreen({ navigation }: Props) {
  const photos = useAppStore((state) => state.photos);
  const located = photos
    .filter((photo) => photo.location)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const share = async () => {
    await Share.share({
      message: `我在 Color Walk 留下了 ${located.length} 个色彩足迹。`,
    });
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>COLOR ROUTE</Text>
          <Text style={styles.title}>我的色彩足迹</Text>
          <Text style={styles.subtitle}>{located.length} 个有定位的色彩坐标</Text>
        </View>

        {located.length ? (
          <>
          <View style={styles.mapPanel}>
            <View style={styles.mapRoadHorizontal} />
            <View style={styles.mapRoadVertical} />
            <View style={styles.mapRiver} />
            <View style={styles.mapRoute} />
            <Text style={styles.mapTitle}>本次色彩漫步</Text>
            <Text style={styles.mapSubtitle}>{located.length} 个定位点 · 拍摄时允许定位即可新增</Text>
            {located.slice(0, 5).map((photo, index) => (
              <View key={photo.id} style={[styles.mapPin, { left: 36 + index * 48, top: 284 - index * 42, backgroundColor: photo.target.colorHex }]} />
            ))}
          </View>
          <View style={styles.route}>
            {located.map((photo, index) => (
              <View key={photo.id} style={styles.routeRow}>
                <View style={styles.track}>
                  <View style={[styles.dot, { backgroundColor: photo.target.colorHex }]} />
                  {index < located.length - 1 ? <View style={styles.line} /> : null}
                </View>
                <View style={styles.stop}>
                  <Text style={styles.stopName}>{photo.target.colorName}</Text>
                  <Text style={styles.coordinates}>
                    {photo.location?.latitude.toFixed(4)}, {photo.location?.longitude.toFixed(4)}
                  </Text>
                  <Text style={styles.time}>
                    {new Date(photo.createdAt).toLocaleString('zh-CN')}
                  </Text>
                </View>
              </View>
            ))}
          </View>
          </>
        ) : (
          <View style={styles.empty}>
            <Ionicons name="map-outline" size={42} color={colors.coral} />
            <Text style={styles.emptyTitle}>还没有可绘制的足迹</Text>
            <Text style={styles.emptyText}>拍摄时允许定位，照片就会出现在这里。</Text>
          </View>
        )}

        {located.length ? (
          <PrimaryButton label="分享足迹摘要" icon="share-outline" onPress={() => void share()} />
        ) : null}
        <PrimaryButton label="返回相册" icon="arrow-back" variant="secondary" onPress={() => navigation.goBack()} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { padding: 20, paddingBottom: 40, gap: 20 },
  header: { gap: 5 },
  eyebrow: { color: colors.coralDark, fontSize: 11, fontWeight: '900' },
  title: { color: colors.ink, fontSize: 29, fontWeight: '900' },
  subtitle: { color: colors.inkMuted, fontSize: 13 },
  mapPanel: { height: 340, overflow: 'hidden', borderRadius: 18, backgroundColor: '#EEF0DC' },
  mapRoadHorizontal: { position: 'absolute', left: -10, right: -10, top: 108, height: 14, backgroundColor: '#FFFDF4' },
  mapRoadVertical: { position: 'absolute', top: -10, bottom: -10, left: '58%', width: 12, backgroundColor: '#FFFDF4' },
  mapRiver: { position: 'absolute', top: 222, left: -10, right: -10, height: 34, backgroundColor: '#C4E2DA', transform: [{ rotate: '-3deg' }] },
  mapRoute: { position: 'absolute', top: 62, left: 66, width: 5, height: 230, borderRadius: 5, backgroundColor: colors.coral, transform: [{ rotate: '31deg' }] },
  mapTitle: { position: 'absolute', top: 18, left: 18, color: colors.ink, fontSize: 17, fontWeight: '800' },
  mapSubtitle: { position: 'absolute', top: 44, left: 18, color: colors.inkMuted, fontSize: 10, fontWeight: '600' },
  mapPin: { position: 'absolute', width: 18, height: 18, borderRadius: 9, borderWidth: 3, borderColor: colors.white },
  route: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 18, padding: 18 },
  routeRow: { flexDirection: 'row', minHeight: 96 },
  track: { width: 30, alignItems: 'center' },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 3, borderColor: colors.paper },
  line: { width: 2, flex: 1, backgroundColor: colors.line },
  stop: { flex: 1, paddingLeft: 10, paddingBottom: 22 },
  stopName: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  coordinates: { color: colors.coralDark, fontSize: 12, marginTop: 4 },
  time: { color: colors.inkMuted, fontSize: 11, marginTop: 4 },
  empty: { minHeight: 300, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyTitle: { color: colors.ink, fontSize: 19, fontWeight: '900' },
  emptyText: { color: colors.inkMuted, textAlign: 'center' },
});
