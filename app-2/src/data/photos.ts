import { getColor, type ColorDef } from './colors';

export interface Photo {
  id: number;
  colorId: string;
  title: string;
  date: string; // MM-DD
  time: string;
  location: string;
  seed: number;
}

export interface EnrichedPhoto extends Photo {
  color: ColorDef;
}

export const PHOTOS: Photo[] = [
  { id: 1, colorId: 'red', title: '巷口的草莓牛奶', date: '07-23', time: '09:24', location: '樱花巷 · 转角商店', seed: 11 },
  { id: 2, colorId: 'blue', title: '晾衣绳上的蓝天', date: '07-23', time: '10:02', location: '老城区天台', seed: 22 },
  { id: 3, colorId: 'yellow', title: '便利店的柠檬糖', date: '07-23', time: '17:40', location: '河堤路便利店', seed: 33 },
  { id: 4, colorId: 'green', title: '公园长椅的苔痕', date: '07-22', time: '16:15', location: '森之公园', seed: 44 },
  { id: 5, colorId: 'pink', title: '傍晚的粉色云', date: '07-22', time: '18:52', location: '跨河大桥', seed: 55 },
  { id: 6, colorId: 'orange', title: '水果摊的蜜柑', date: '07-22', time: '11:08', location: '早市一条街', seed: 66 },
  { id: 7, colorId: 'purple', title: '花店的绣球花', date: '07-21', time: '14:30', location: '白花屋花店', seed: 77 },
  { id: 8, colorId: 'cyan', title: '汽水瓶的清凉', date: '07-21', time: '12:47', location: '昭和风喫茶店', seed: 88 },
  { id: 9, colorId: 'red', title: '邮筒的红帽子', date: '07-21', time: '08:19', location: '邮局前街角', seed: 99 },
  { id: 10, colorId: 'brown', title: '面包房的曲奇墙', date: '07-20', time: '15:33', location: '麦子面包房', seed: 110 },
  { id: 11, colorId: 'blue', title: '泳池的瓷砖', date: '07-20', time: '13:05', location: '市民游泳馆', seed: 121 },
  { id: 12, colorId: 'yellow', title: '校车路过的一瞬', date: '07-20', time: '07:58', location: '银杏小学门口', seed: 132 },
  { id: 13, colorId: 'black', title: '屋檐下的黑猫影', date: '07-19', time: '18:10', location: '老城巷子', seed: 143 },
  { id: 14, colorId: 'green', title: '雨后的青蛙雨伞', date: '07-19', time: '16:44', location: '河滨步道', seed: 154 },
  { id: 15, colorId: 'pink', title: '奶奶的毛线团', date: '07-19', time: '10:26', location: '梧桐里弄', seed: 165 },
  { id: 16, colorId: 'orange', title: '柿子熟了', date: '07-18', time: '09:12', location: '后院柿子树', seed: 176 },
  { id: 17, colorId: 'purple', title: '夜市的霓虹招牌', date: '07-18', time: '20:37', location: '南门夜市', seed: 187 },
  { id: 18, colorId: 'cyan', title: '自行车篮的薄荷色', date: '07-17', time: '08:55', location: '海岸单车径', seed: 198 },
  { id: 19, colorId: 'white', title: '婚纱店的橱窗', date: '07-17', time: '11:41', location: '中央大街', seed: 209 },
  { id: 20, colorId: 'gray', title: '阴天的水泥桥墩', date: '07-16', time: '14:20', location: '江边高架下', seed: 220 },
  { id: 21, colorId: 'brown', title: '旧书店的书脊', date: '07-16', time: '16:02', location: '时光二手书店', seed: 242 },
  { id: 22, colorId: 'red', title: '消防车路过的红', date: '07-15', time: '10:47', location: '中央大街', seed: 231 },
];

export const enrichedPhotos: EnrichedPhoto[] = PHOTOS.map((p) => ({
  ...p,
  color: getColor(p.colorId),
}));

/* ---------- 地图：多天散步轨迹 ---------- */

export interface WalkPin {
  x: number;
  y: number;
  photoId: number;
}

export interface WalkDay {
  date: string; // MM-DD
  distance: number; // km
  colorKinds: number;
  route: { x: number; y: number }[];
  pins: WalkPin[];
}

export const WALK_DAYS: WalkDay[] = [
  {
    date: '07-23',
    distance: 2.4,
    colorKinds: 3,
    route: [
      { x: 46, y: 636 }, { x: 92, y: 588 }, { x: 82, y: 516 }, { x: 132, y: 468 },
      { x: 122, y: 398 }, { x: 182, y: 348 }, { x: 172, y: 278 }, { x: 232, y: 228 }, { x: 298, y: 126 },
    ],
    pins: [
      { x: 92, y: 588, photoId: 1 },
      { x: 122, y: 398, photoId: 2 },
      { x: 232, y: 228, photoId: 3 },
    ],
  },
  {
    date: '07-22',
    distance: 3.1,
    colorKinds: 3,
    route: [
      { x: 60, y: 620 }, { x: 120, y: 560 }, { x: 180, y: 580 }, { x: 240, y: 520 },
      { x: 230, y: 430 }, { x: 280, y: 360 }, { x: 240, y: 280 }, { x: 180, y: 200 }, { x: 120, y: 150 },
    ],
    pins: [
      { x: 120, y: 560, photoId: 6 },
      { x: 230, y: 430, photoId: 4 },
      { x: 180, y: 200, photoId: 5 },
    ],
  },
  {
    date: '07-21',
    distance: 1.8,
    colorKinds: 3,
    route: [
      { x: 90, y: 640 }, { x: 140, y: 590 }, { x: 130, y: 510 }, { x: 190, y: 460 },
      { x: 250, y: 470 }, { x: 290, y: 400 }, { x: 260, y: 320 }, { x: 200, y: 250 },
    ],
    pins: [
      { x: 130, y: 510, photoId: 9 },
      { x: 250, y: 470, photoId: 8 },
      { x: 260, y: 320, photoId: 7 },
    ],
  },
];

/** 合并轨迹时每天的路径颜色 */
export const TRACK_COLORS = ['#e59266', '#6db5a8', '#a98fd0'];
