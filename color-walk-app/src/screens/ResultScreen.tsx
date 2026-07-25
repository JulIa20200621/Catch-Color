import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DistributionBars } from '../components/DistributionBars';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { useAppStore } from '../store/useAppStore';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

export function ResultScreen({ navigation, route }: Props) {
  const photo = useAppStore((state) =>
    state.photos.find((item) => item.id === route.params.photoId),
  );

  if (!photo) {
    return (
      <Screen>
        <View style={styles.missing}>
          <Text style={styles.title}>这张相片暂时找不到</Text>
          <PrimaryButton label="回到首页" icon="home-outline" onPress={() => navigation.popToTop()} />
        </View>
      </Screen>
    );
  }

  const percentage = Math.round(photo.analysis.targetRatio * 100);
  const tooDark = photo.analysis.reason === 'too_dark';

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.resultHeader}>
          <View style={[styles.resultIcon, !photo.analysis.success && styles.resultIconMiss]}>
            <Ionicons
              name={photo.analysis.success ? 'checkmark' : tooDark ? 'moon-outline' : 'color-filter-outline'}
              size={28}
              color={colors.white}
            />
          </View>
          <Text style={styles.eyebrow}>ANALYSIS COMPLETE</Text>
          <Text style={styles.title}>
            {photo.analysis.success
              ? '抓到今天的颜色了'
              : tooDark
                ? '夜太深啦'
                : '差一点就抓到了'}
          </Text>
          <Text style={styles.description}>
            {tooDark
              ? '开启闪光灯，或者明天白天再来捕捉吧。'
              : `目标${photo.target.targetCategory}色占整张照片的 ${percentage}%。`}
          </Text>
          {!tooDark && photo.analysis.colorCoverage !== undefined ? (
            <Text style={styles.coverage}>
              有效彩色区域占画面 {Math.round(photo.analysis.colorCoverage * 100)}%，下方色彩分布已归一化为 100%。
            </Text>
          ) : null}
        </View>

        <View style={styles.photoFrame}>
          <Image source={{ uri: photo.imageUri }} style={styles.photo} resizeMode="cover" />
          <View style={styles.photoCaption}>
            <Text style={styles.captionName}>{photo.target.colorName}</Text>
            <Text style={styles.captionDate}>
              {new Date(photo.createdAt).toLocaleString('zh-CN', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>

        <View style={styles.analysisCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>颜色分布</Text>
            <Text style={styles.engine}>{photo.analysisMode.toUpperCase()}</Text>
          </View>
          <DistributionBars distribution={photo.analysis.distribution} />
        </View>

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={20} color={colors.inkMuted} />
          <Text style={styles.locationText}>
            {photo.location
              ? `${photo.location.latitude.toFixed(4)}, ${photo.location.longitude.toFixed(4)}`
              : '未知的角落（定位被拒绝或不可用）'}
          </Text>
        </View>

        <PrimaryButton
          label="查看本地相册"
          icon="images-outline"
          onPress={() => navigation.navigate('Main', { screen: 'Album' })}
        />
        <PrimaryButton
          label="继续寻找"
          icon="camera-outline"
          variant="secondary"
          onPress={() => navigation.replace('Camera')}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 44, gap: 18 },
  resultHeader: { alignItems: 'center', paddingVertical: 8, gap: 7 },
  resultIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  resultIconMiss: { backgroundColor: colors.danger },
  eyebrow: { color: colors.coralDark, fontSize: 11, fontWeight: '900' },
  title: { color: colors.ink, fontSize: 27, fontWeight: '900', textAlign: 'center' },
  description: { color: colors.inkMuted, lineHeight: 21, textAlign: 'center' },
  coverage: { color: colors.inkMuted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  photoFrame: {
    backgroundColor: colors.surface,
    padding: 12,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
  },
  photo: { width: '100%', aspectRatio: 1, backgroundColor: colors.line },
  photoCaption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  captionName: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  captionDate: { color: colors.inkMuted, fontSize: 12 },
  analysisCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    padding: 16,
    gap: 16,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  cardTitle: { color: colors.ink, fontWeight: '900', fontSize: 17 },
  engine: { color: colors.inkMuted, fontSize: 10, fontWeight: '900' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locationText: { color: colors.inkMuted, fontSize: 13, flex: 1 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 20 },
});
