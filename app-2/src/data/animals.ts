export interface Animal {
  id: string;
  name: string;
  emoji: string;
  colorId: string;
  personality: string;
  unlocked: boolean;
}

/** 12 色 · 12 只动物伙伴 */
export const ANIMALS: Animal[] = [
  { id: 'fox', name: '冒险家小狐狸', emoji: '🦊', colorId: 'red', personality: '充满好奇心，总是第一个冲向下一个街角，尾巴尖沾着樱桃红的晚霞。', unlocked: true },
  { id: 'squirrel', name: '收藏家小松鼠', emoji: '🐿️', colorId: 'orange', personality: '爱收集果实，口袋里永远装着一颗蜜柑，走路都透着满足的橙香。', unlocked: true },
  { id: 'duck', name: '阳光小黄鸭', emoji: '🐥', colorId: 'yellow', personality: '阳光开朗，最喜欢雨后的水洼，一摇一摆把好心情传染给整条街。', unlocked: true },
  { id: 'frog', name: '探路小树蛙', emoji: '🐸', colorId: 'green', personality: '擅长发现隐藏道路，荷叶背面是它的秘密基地，总能带你抄近道。', unlocked: true },
  { id: 'lizard', name: '安静小蜥蜴', emoji: '🦎', colorId: 'cyan', personality: '薄荷青色的小隐士，趴在溪边石头上一动不动，帮你留意每一处水光。', unlocked: true },
  { id: 'bird', name: '旅行家小蓝鹊', emoji: '🐦', colorId: 'blue', personality: '向往自由，每天清晨把第一片蓝天唱给你听，翅膀下藏着远方的风。', unlocked: true },
  { id: 'octopus', name: '神秘小章鱼', emoji: '🐙', colorId: 'purple', personality: '充满神秘感，八只手各执一颗紫色贝壳，只在黄昏时分悄悄出现。', unlocked: false },
  { id: 'flamingo', name: '优雅小火烈鸟', emoji: '🦩', colorId: 'pink', personality: '优雅温柔，单脚立在粉色的暮色里，连倒影都美得不像话。', unlocked: false },
  { id: 'bear', name: '踏实小棕熊', emoji: '🐻', colorId: 'brown', personality: '憨厚踏实，闻起来像刚出炉的可可饼干，累了可以靠在它背上歇一会儿。', unlocked: false },
  { id: 'cat', name: '外冷内热小黑猫', emoji: '🐈‍⬛', colorId: 'black', personality: '外冷内热，表面上爱答不理，其实每晚都悄悄跟在你身后陪你散步。', unlocked: false },
  { id: 'rabbit', name: '希望小白兔', emoji: '🐰', colorId: 'white', personality: '象征新生与希望，像一团软乎乎的云，出现的地方总有好事发生。', unlocked: false },
  { id: 'koala', name: '沉稳小考拉', emoji: '🐨', colorId: 'gray', personality: '沉稳安静，抱着树枝慢慢打盹，教你在匆忙的世界里慢下来。', unlocked: false },
];
