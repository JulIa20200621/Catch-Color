import { Button } from 'animal-island-ui';
import 'animal-island-ui/style';

interface IslandPrimaryButtonProps {
  label: string;
  onPress: () => void;
}

// The package targets React DOM. Expo resolves this .web file only for Web,
// while Android/iOS resolve IslandPrimaryButton.tsx above.
export function IslandPrimaryButton({ label, onPress }: IslandPrimaryButtonProps) {
  return <Button type="primary" size="large" block onClick={onPress}>{label}</Button>;
}
