import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';

interface IslandPrimaryButtonProps {
  label: string;
  onPress: () => void;
}

// Native counterpart for the web-only Animal-Island-UI Button.
export function IslandPrimaryButton({ label, onPress }: IslandPrimaryButtonProps) {
  return <Pressable style={styles.button} onPress={onPress}><Text style={styles.text}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  button: { height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.ink },
  text: { color: colors.white, fontSize: 15, fontWeight: '700' },
});
