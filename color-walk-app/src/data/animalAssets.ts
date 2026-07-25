import type { ImageSourcePropType } from 'react-native';

// Static requires let Metro bundle the transparent animal artwork for native and web.
const animalAssets: Record<string, ImageSourcePropType> = {
  fox: require('../../assets/animals/fox.png'),
  duck: require('../../assets/animals/duck.png'),
  lizard: require('../../assets/animals/lizard.png'),
  bird: require('../../assets/animals/bird.png'),
  octopus: require('../../assets/animals/octopus.png'),
  flamingo: require('../../assets/animals/flamingo.png'),
  bear: require('../../assets/animals/bear.png'),
  koala: require('../../assets/animals/koala.png'),
  turtle: require('../../assets/animals/turtle.png'),
};

export function getAnimalAsset(id: string): ImageSourcePropType | undefined {
  return animalAssets[id];
}
