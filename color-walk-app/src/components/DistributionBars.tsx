import { StyleSheet, Text, View } from 'react-native';
import type { ColorDistribution } from '../types';
import { colors } from '../theme/colors';

const categoryColors: Record<string, string> = {
  红: '#D95D4F',
  橙: '#E89042',
  黄: '#DFC84F',
  绿: '#6E9B62',
  青: '#57A6A8',
  蓝: '#4A78A8',
  紫: '#8068A8',
  粉: '#D6819B',
};

export function DistributionBars({ distribution }: { distribution: ColorDistribution }) {
  const total = Object.values(distribution).reduce((sum, value) => sum + value, 0);
  const entries = Object.entries(distribution)
    .map(([name, value]) => [name, total > 0 ? value / total : 0] as const)
    .sort((a, b) => b[1] - a[1]);

  if (!entries.length) {
    return <Text style={styles.empty}>未检测到可用的彩色像素</Text>;
  }

  return (
    <View style={styles.container}>
      {entries.map(([name, value]) => (
        <View key={name} style={styles.row}>
          <Text style={styles.name}>{name}</Text>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                {
                  width: `${Math.max(3, value * 100)}%`,
                  backgroundColor: categoryColors[name] ?? colors.inkMuted,
                },
              ]}
            />
          </View>
          <Text style={styles.value}>{Math.round(value * 100)}%</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { width: 20, color: colors.ink, fontWeight: '700' },
  track: {
    flex: 1,
    height: 8,
    backgroundColor: '#ECE8DE',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 4 },
  value: { width: 38, textAlign: 'right', color: colors.inkMuted, fontSize: 12 },
  empty: { color: colors.inkMuted, fontSize: 13 },
});
