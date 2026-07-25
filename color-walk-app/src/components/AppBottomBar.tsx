import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

const tabMeta = [
  ['Today', '拍摄', 'camera-outline'], ['Album', '相册', 'color-palette-outline'],
  ['Diary', '日记', 'book-outline'], ['Community', '伙伴', 'chatbubbles-outline'], ['Me', '我的', 'person-outline'],
] as const;

// Native translation of app-2/components/BottomNavigation.tsx.
export function AppBottomBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.bar}>
      {state.routes.map((route, index) => {
        const active = state.index === index;
        const meta = tabMeta.find(([key]) => key === route.name);
        if (!meta) return null;
        const [, label, icon] = meta;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!active && !event.defaultPrevented) navigation.navigate(route.name);
        };
        return (
          <Pressable key={route.key} accessibilityRole="button" accessibilityState={active ? { selected: true } : {}} accessibilityLabel={descriptors[route.key].options.tabBarAccessibilityLabel ?? label} style={styles.item} onPress={onPress}>
            <View style={[styles.iconWrap, active && styles.iconActive]}>
              <Ionicons name={icon} size={26} color={active ? colors.coralDark : '#B4A88E'} />
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { height: 76, paddingTop: 9, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: 'rgba(253,251,242,0.98)' },
  item: { width: 56, alignItems: 'center', gap: 3 },
  iconWrap: { height: 29, justifyContent: 'center', alignItems: 'center', opacity: 0.42 },
  iconActive: { opacity: 1, transform: [{ translateY: -2 }, { scale: 1.06 }] },
  label: { color: '#B4A88E', fontSize: 11, fontWeight: '500', letterSpacing: 0.4 },
  labelActive: { color: colors.coralDark, fontWeight: '700' },
});
