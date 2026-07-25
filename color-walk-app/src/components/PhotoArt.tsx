import { StyleSheet, View } from 'react-native';
import { getApp2Color } from '../data/app2Mock';

interface PhotoArtProps {
  colorId: string;
  seed: number;
  borderRadius?: number;
}

// Native translation of app-2/components/PhotoArt.tsx. The web source does
// not use image files: each tile is a generated low-saturation color book.
export function PhotoArt({ colorId, seed, borderRadius = 8 }: PhotoArtProps) {
  const color = getApp2Color(colorId);
  const tilt = (seed % 3) * 8;

  return (
    <View style={[styles.art, { backgroundColor: color.hex, borderRadius }]}> 
      <View style={styles.spine} />
      <View style={[styles.softLayer, { backgroundColor: color.soft }]} />
      <View style={[styles.light, { right: tilt }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  art: { overflow: 'hidden', flex: 1, minHeight: 1 },
  spine: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '6%', backgroundColor: 'rgba(0,0,0,0.045)' },
  softLayer: { position: 'absolute', left: '19%', right: 0, bottom: 0, height: '40%', opacity: 0.45 },
  light: { position: 'absolute', top: '-20%', width: '68%', height: '55%', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.36)' },
});
