export interface ColorDef {
  id: string;
  name: string;
  nameEn: string;
  hex: string;
  soft: string;
}

/** 12 标准色（莫兰迪化）：红橙黄绿青蓝紫粉棕黑白灰 */
export const COLORS: ColorDef[] = [
  { id: 'red', name: '樱桃红', nameEn: 'cherry red', hex: '#E5AFA8', soft: '#F7E7E4' },
  { id: 'orange', name: '蜜柑橙', nameEn: 'tangerine', hex: '#EDC9A2', soft: '#F9EEDF' },
  { id: 'yellow', name: '柠檬黄', nameEn: 'butter yellow', hex: '#EDDFA8', soft: '#FAF4E0' },
  { id: 'green', name: '抹茶绿', nameEn: 'matcha green', hex: '#BFD6B2', soft: '#EBF2E5' },
  { id: 'cyan', name: '薄荷青', nameEn: 'mint cyan', hex: '#AFD8CD', soft: '#E6F2EE' },
  { id: 'blue', name: '晴空蓝', nameEn: 'sky blue', hex: '#B2CCE2', soft: '#E8F0F8' },
  { id: 'purple', name: '葡萄紫', nameEn: 'grape purple', hex: '#C9BCDC', soft: '#EFEBF6' },
  { id: 'pink', name: '樱花粉', nameEn: 'sakura pink', hex: '#EBC2D3', soft: '#F9EBF2' },
  { id: 'brown', name: '可可棕', nameEn: 'cocoa brown', hex: '#CFB99C', soft: '#F3EBDD' },
  { id: 'black', name: '墨黑', nameEn: 'ink black', hex: '#8E8E96', soft: '#E8E8EA' },
  { id: 'white', name: '云朵白', nameEn: 'cloud white', hex: '#EDEAE0', soft: '#FAF8F3' },
  { id: 'gray', name: '烟灰', nameEn: 'mist gray', hex: '#C4C4C6', soft: '#EFEFEF' },
];

export const TARGET_COLORS = COLORS;

export function getColor(id: string): ColorDef {
  return COLORS.find((c) => c.id === id) ?? COLORS[0];
}
