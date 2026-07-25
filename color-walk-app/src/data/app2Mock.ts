export interface App2Color {
  id: string;
  name: string;
  nameEn: string;
  hex: string;
  soft: string;
}

export const app2Colors: App2Color[] = [
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
  { id: 'gray', name: '雾灰', nameEn: 'mist gray', hex: '#C4C4C6', soft: '#EFEFEF' },
];

export const app2Animals = [
  ['fox', '小狐狸', '🦊', true], ['squirrel', '小松鼠', '🐿️', true],
  ['duck', '小黄鸭', '🐥', true], ['frog', '小树蛙', '🐸', true],
  ['lizard', '小蜥蜴', '🦎', true], ['bird', '小蓝鸟', '🐦', true],
  ['octopus', '小章鱼', '🐙', false], ['flamingo', '火烈鸟', '🦩', false],
  ['bear', '小棕熊', '🐻', false], ['cat', '小黑猫', '🐈‍⬛', false],
  ['rabbit', '小白兔', '🐇', false], ['koala', '小考拉', '🐨', false],
] as const;

export interface App2Photo {
  id: number;
  colorId: string;
  title: string;
  date: string;
  time: string;
  location: string;
  seed: number;
}

const photoRows: Array<[string, string, string]> = [
  ['red', '07-23', '巷口的草莓牛奶'], ['blue', '07-23', '晾衣绳上的蓝天'],
  ['yellow', '07-23', '便利店的柠檬糖'], ['green', '07-22', '公园长椅的苔痕'],
  ['pink', '07-22', '傍晚的粉色云'], ['orange', '07-22', '水果摊的蜜柑'],
  ['purple', '07-21', '花店的绣球花'], ['cyan', '07-21', '汽水瓶的清凉'],
  ['red', '07-21', '邮筒的红帽子'], ['brown', '07-20', '面包房的曲奇墙'],
  ['blue', '07-20', '泳池的碎瓷'], ['yellow', '07-20', '校车路过的一瞬'],
  ['black', '07-19', '屋檐下的黑猫影'], ['green', '07-19', '雨后的青蛙雨伞'],
  ['pink', '07-19', '奶奶的毛线团'], ['orange', '07-18', '柿子熟了'],
  ['purple', '07-18', '夜市的霓虹招牌'], ['cyan', '07-17', '自行车篓的薄荷色'],
  ['white', '07-17', '婚纱店的橱窗'], ['gray', '07-16', '阴天的水泥桥墩'],
  ['brown', '07-16', '旧书店的书脊'], ['red', '07-15', '消防车路过的红'],
];

export const app2Photos: App2Photo[] = photoRows.map(([colorId, date, title], index) => ({
  id: index + 1,
  colorId,
  date,
  title,
  time: `${String(8 + (index % 12)).padStart(2, '0')}:${String(10 + index * 3).padStart(2, '0')}`,
  location: '城市漫步 · 街角',
  seed: (index + 1) * 11,
}));

export const app2Moods = [
  ['🌧️', '有点小乌云'], ['☁️', '有点闷闷的'], ['😶', '不咸不淡'], ['🌤️', '有点放晴'], ['☀️', '心情大晴天'],
] as const;

export const app2Friends = [
  ['桃梨', '🍙', 4, 312], ['阿澄', '🍐', 3, 198], ['薄荷', '🌿', 2, 154], ['小满', '🌼', 5, 402],
] as const;

export function getApp2Color(id: string): App2Color {
  return app2Colors.find((color) => color.id === id) ?? app2Colors[0];
}
