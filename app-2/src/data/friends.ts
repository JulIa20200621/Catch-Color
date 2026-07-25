export interface Friend {
  id: number;
  name: string;
  avatar: string;
  todayColors: number;
  photos: number;
  animals: number;
  streak: number;
}

export const FRIENDS: Friend[] = [
  { id: 1, name: '桃桃', avatar: '🍑', todayColors: 4, photos: 312, animals: 8, streak: 63 },
  { id: 2, name: '阿澄', avatar: '🍊', todayColors: 3, photos: 198, animals: 6, streak: 41 },
  { id: 3, name: '薄荷', avatar: '🌿', todayColors: 2, photos: 154, animals: 5, streak: 28 },
  { id: 4, name: '小满', avatar: '🌾', todayColors: 5, photos: 402, animals: 9, streak: 87 },
];

/** 可添加的新朋友（Mock 搜索） */
export const NEW_FRIENDS: Friend[] = [
  { id: 5, name: '栗子', avatar: '🌰', todayColors: 1, photos: 88, animals: 3, streak: 12 },
  { id: 6, name: '阿蓝', avatar: '🫐', todayColors: 2, photos: 120, animals: 4, streak: 19 },
  { id: 7, name: '柚子', avatar: '🍋', todayColors: 3, photos: 230, animals: 7, streak: 35 },
];

export interface Post {
  id: number;
  user: string;
  avatar: string;
  time: string;
  text: string;
  colorId: string;
  seed: number;
  likes: number;
  comments: { user: string; avatar: string; text: string }[];
  liked?: boolean;
}

export const POSTS: Post[] = [
  {
    id: 1, user: '桃桃', avatar: '🍑', time: '2小时前',
    text: '今天在天台发现了一整片被晒得发亮的晴空蓝，像汽水一样。',
    colorId: 'blue', seed: 301, likes: 128,
    comments: [
      { user: '阿澄', avatar: '🍊', text: '这片蓝也太干净了吧！' },
      { user: '小鹿', avatar: '🦌', text: '求定位，明天就去～' },
    ],
  },
  {
    id: 2, user: '小满', avatar: '🌾', time: '4小时前',
    text: '下班路上遇到的蜜柑橙晚霞，奖励给认真生活的自己。',
    colorId: 'orange', seed: 302, likes: 96,
    comments: [{ user: '薄荷', avatar: '🌿', text: '被治愈到了 🧡' }],
  },
  {
    id: 3, user: '阿澄', avatar: '🍊', time: '6小时前',
    text: '花店门口的绣球开了，葡萄紫 +1 💜',
    colorId: 'purple', seed: 303, likes: 74,
    comments: [],
  },
  {
    id: 4, user: '薄荷', avatar: '🌿', time: '昨天',
    text: '雨后散步，积水里倒映的樱桃红绿灯好可爱。',
    colorId: 'red', seed: 304, likes: 152,
    comments: [
      { user: '桃桃', avatar: '🍑', text: '这个角度绝了' },
      { user: '小满', avatar: '🌾', text: '雨天也有惊喜呀' },
    ],
  },
  {
    id: 5, user: '桃桃', avatar: '🍑', time: '昨天',
    text: '抹茶色的苔藓地毯，想光着脚踩上去。',
    colorId: 'green', seed: 305, likes: 88,
    comments: [],
  },
];

export const USER = {
  name: '小鹿',
  avatar: '🦌',
  phone: '138****8888',
  wechat: '已绑定',
  level: '捕色师 · Lv.5',
  colors: 47,
  photos: 239,
  walkDays: 56,
};

/** 五档心情（压力改善模式） */
export const MOODS = [
  { emoji: '🌧️', label: '有点小乌云', desc: '没关系，乌云也会散步走的' },
  { emoji: '☁️', label: '有点闷闷的', desc: '深呼吸，明天会轻一点' },
  { emoji: '⛅', label: '不咸不淡', desc: '平平的日子也是好日子' },
  { emoji: '🌤️', label: '有点放晴了', desc: '看吧，颜色开始冒出来了' },
  { emoji: '☀️', label: '心情大晴天', desc: '把这份晴朗存进相册里！' },
];
