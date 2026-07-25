import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { app2Colors } from '../data/app2Mock';
import { colors } from '../theme/colors';
import type { MainTabParamList, RootStackParamList } from '../types';

type Props = CompositeScreenProps<BottomTabScreenProps<MainTabParamList, 'Today'>, NativeStackScreenProps<RootStackParamList>>;
type ShootMode = 'single' | 'multi';

// Direct native translation of app-2/pages/CameraPage.tsx. The shutter still
// opens the real Expo camera so the original photo-analysis flow remains usable.
export function HomeScreen({ navigation }: Props) {
  const [mode, setMode] = useState<ShootMode | null>(null);
  const [targetIndex, setTargetIndex] = useState(0);
  const [flash, setFlash] = useState(false);
  const [zoom, setZoom] = useState(1);
  const color = app2Colors[targetIndex];

  return (
    <Screen>
      <View style={styles.page}>
        <View style={styles.topLine}>
          <View style={styles.colorInfo}>
            <View style={[styles.colorDot, { backgroundColor: color.hex }]} />
            <Text style={styles.topText}>今天的颜色：{mode === 'single' ? color.name : '任意'}</Text>
            <Pressable style={styles.changeColor} onPress={() => setTargetIndex((index) => (index + 1) % app2Colors.length)}><Ionicons name="refresh" size={12} color={colors.primary} /><Text style={styles.changeText}>换一色</Text></Pressable>
          </View>
          <Text style={styles.counter}>{mode === 'multi' ? '已收集：0 色' : '已拍：0 张'}</Text>
        </View>

        <View style={[styles.viewfinder, { backgroundColor: color.soft }]}>
          <View style={styles.verticalOne} /><View style={styles.verticalTwo} /><View style={styles.horizontalOne} /><View style={styles.horizontalTwo} />
          <View style={styles.meta}><Text style={styles.metaText}>iso 100 / f 1.8</Text><View style={styles.live}><View style={styles.liveDot} /><Text style={styles.metaText}>live</Text></View></View>
          <View style={styles.zoomPill}>{['0.5x', '1x', '2x'].map((label, index) => <Pressable key={label} onPress={() => setZoom(index)}><Text style={[styles.zoomText, zoom === index && styles.zoomActive]}>{label}</Text></Pressable>)}</View>
        </View>

        <View style={styles.shutterRow}>
          <Pressable style={[styles.sideButton, { borderColor: color.hex, backgroundColor: flash ? color.hex : color.soft }]} onPress={() => setFlash((value) => !value)}><Ionicons name="flash-outline" size={18} color={flash ? colors.white : colors.ink} /></Pressable>
          <Pressable accessibilityLabel="使用后置摄像头拍摄" style={[styles.shutter, { borderColor: color.hex }]} onPress={() => navigation.navigate('Camera', { initialFacing: 'back' })}><View style={[styles.shutterInner, { backgroundColor: color.hex }]} /></Pressable>
          <Pressable accessibilityLabel="使用前置摄像头拍摄" style={[styles.sideButton, { borderColor: color.hex, backgroundColor: color.soft }]} onPress={() => navigation.navigate('Camera', { initialFacing: 'front' })}><Ionicons name="camera-reverse-outline" size={19} color={colors.ink} /></Pressable>
        </View>

        {mode === null ? (
          <Pressable style={styles.mask} onPress={() => setMode(null)}>
            <Pressable style={styles.modeCard} onPress={(event) => event.stopPropagation()}>
              <Text style={styles.modeTitle}>今天想怎么拍？</Text>
              <Text style={styles.modeText}>专注捕捉「{color.name}」，{`\n`}还是把 12 种颜色都收进口袋？</Text>
              <Pressable style={styles.defaultAction} onPress={() => setMode('single')}><Text style={styles.defaultActionText}>🎨 一个颜色拍多张</Text></Pressable>
              <Pressable style={styles.primaryAction} onPress={() => setMode('multi')}><Text style={styles.primaryActionText}>🧺 收集不同颜色</Text></Pressable>
            </Pressable>
          </Pressable>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingTop: 8, paddingBottom: 4 },
  topLine: { height: 38, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  colorInfo: { flexDirection: 'row', alignItems: 'center', gap: 7, flexShrink: 1 },
  colorDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  topText: { color: colors.ink, fontSize: 13, fontWeight: '600' },
  changeColor: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  changeText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  counter: { color: colors.inkMuted, fontSize: 12, fontWeight: '600' },
  viewfinder: { flex: 1, minHeight: 350, marginTop: 6, overflow: 'hidden' },
  verticalOne: { position: 'absolute', top: 0, bottom: 0, left: '33.333%', borderLeftWidth: 1, borderStyle: 'dashed', borderColor: '#DCDCD9' },
  verticalTwo: { position: 'absolute', top: 0, bottom: 0, left: '66.666%', borderLeftWidth: 1, borderStyle: 'dashed', borderColor: '#DCDCD9' },
  horizontalOne: { position: 'absolute', left: 0, right: 0, top: '33.333%', borderTopWidth: 1, borderStyle: 'dashed', borderColor: '#DCDCD9' },
  horizontalTwo: { position: 'absolute', left: 0, right: 0, top: '66.666%', borderTopWidth: 1, borderStyle: 'dashed', borderColor: '#DCDCD9' },
  meta: { position: 'absolute', left: 20, right: 20, top: 16, flexDirection: 'row', justifyContent: 'space-between' },
  metaText: { color: 'rgba(59,59,62,0.7)', fontSize: 13, fontWeight: '500', letterSpacing: 0.5 },
  live: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#DBA9A3' },
  zoomPill: { position: 'absolute', bottom: 16, alignSelf: 'center', flexDirection: 'row', gap: 20, borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, paddingHorizontal: 22, paddingVertical: 9 },
  zoomText: { color: colors.inkMuted, fontSize: 13, fontWeight: '500' },
  zoomActive: { color: colors.ink, fontWeight: '700' },
  shutterRow: { height: 94, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 54 },
  sideButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  shutter: { width: 68, height: 68, borderRadius: 34, padding: 6, borderWidth: 2 },
  shutterInner: { flex: 1, borderRadius: 30 },
  mask: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 3, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, backgroundColor: 'rgba(59,59,62,0.25)' },
  modeCard: { width: '100%', maxWidth: 320, borderRadius: 24, padding: 24, backgroundColor: colors.surface, shadowColor: '#46423C', shadowOpacity: 0.2, shadowRadius: 18, elevation: 8 },
  modeTitle: { color: colors.ink, textAlign: 'center', fontSize: 18, fontWeight: '700' },
  modeText: { marginTop: 12, color: '#6B6B70', textAlign: 'center', fontSize: 13, lineHeight: 20, fontWeight: '500' },
  defaultAction: { marginTop: 20, height: 46, borderWidth: 1, borderColor: colors.line, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  defaultActionText: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  primaryAction: { marginTop: 12, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink },
  primaryActionText: { color: colors.white, fontSize: 14, fontWeight: '700' },
});
