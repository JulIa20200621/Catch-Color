# 好友模式 + 我的页完整版 —— 需求更新

本文档更新《完整需求文档整合版》里"伙伴页-好友模式"和"我的页-动物伙伴"这两部分，其余内容不受影响。

---

## 一、变更说明

| | 之前 | 现在 |
|---|---|---|
| 好友模式 | 砍掉，用排行榜替代 | 重新纳入范围，做简化版（邀请好友、好友列表、PK、同行记录），排行榜功能保留不冲突，两者并存 |
| 我的页-动物伙伴 | 只做解锁，不做详情 | 做完整详情页（形象、性格、解锁信息、故事），**装扮换装功能暂不做**（依赖贴纸拖拽编辑器这个更大的子系统，假设你们暂时不需要这部分，如果需要告诉我再展开） |

同行记录简化说明：策划文档里的"自动识别同两个好友同时间同区域散步"需要实时比对两人的 GPS 轨迹重合度，这个计算逻辑和实时定位同步的复杂度，在 72 小时、0 基础团队的条件下风险较高，**改成用户手动标记"这次散步是和谁一起"**，效果类似（都能生成同行记录和纪念卡片），但实现成本低很多。

---

## 二、好友模式技术设计

### 2.1 数据库

```sql
create table friendships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  friend_id uuid references profiles(id),
  created_at timestamptz default now(),
  unique(user_id, friend_id)
);

create table companion_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  friend_id uuid references profiles(id),
  date date not null,
  note text,
  created_at timestamptz default now()
);
```
`friendships` 每加一对好友要插入两行（我加你、你加我各一行），这样查"我的好友列表"时不用再判断方向，直接按 `user_id = 我` 查就行，牺牲一点存储空间换查询简单。

### 2.2 邀请好友（简化实现，不做二维码生成）

不用做真的生成二维码图片这么复杂，用户的 `id` 本身就可以当"邀请码"：

```typescript
// 分享出去的内容就是自己的 user id（或者做个短链接包装一下）
const myInviteCode = user.id;

// 对方输入这个码，加好友
async function addFriendByCode(myUserId: string, inviteCode: string) {
  const { data: friend, error } = await supabase
    .from('profiles')
    .select('id, nickname')
    .eq('id', inviteCode)
    .single();
  if (error || !friend) throw new Error('找不到该用户，检查邀请码是否正确');

  await supabase.from('friendships').insert([
    { user_id: myUserId, friend_id: friend.id },
    { user_id: friend.id, friend_id: myUserId },
  ]);
}
```
界面上做成"输入好友的邀请码"这样一个简单的文本框+确认按钮，比做二维码扫描省事很多，效果一样能加上好友。

### 2.3 好友列表

```sql
select p.id, p.nickname, p.avatar_url
from friendships f
join profiles p on p.id = f.friend_id
where f.user_id = :my_user_id;
```
拿到好友列表后，对每个好友再查一次统计数据（复用排行榜那部分的聚合查询，加个 `where user_id = 好友id` 的条件），显示"今日拍照数/累计拍照数"这些。

### 2.4 PK 功能

```typescript
async function getPKStats(userIdA: string, userIdB: string) {
  const { data } = await supabase
    .from('photos')
    .select('user_id, target_category')
    .in('user_id', [userIdA, userIdB]);

  const statsA = data.filter(p => p.user_id === userIdA);
  const statsB = data.filter(p => p.user_id === userIdB);

  return {
    a: { photoCount: statsA.length, colorCount: new Set(statsA.map(p => p.target_category)).size },
    b: { photoCount: statsB.length, colorCount: new Set(statsB.map(p => p.target_category)).size },
  };
}
```
拿到双方数据后，前端界面直接并排显示两个数字对比，谁的数字大谁赢，不需要额外的"胜负判定算法"，就是简单的数值比较。胜利的一方可以插入一条 `user_badges` 记录（关联"PK冠军"这个勋章），复用之前设计好的成就勋章系统。

### 2.5 同行记录（手动标记版）

用户拍完照，界面上可以选"这次和谁一起散步"，从好友列表里选一个，加一句备注，直接存：
```typescript
async function markCompanion(userId: string, friendId: string, note: string) {
  await supabase.from('companion_records').insert({
    user_id: userId, friend_id: friendId, date: new Date().toISOString().slice(0,10), note,
  });
}
```
"同行纪念卡片"可以做成一个简单的分享图片生成（用 `react-native-view-shot` 把一个卡片样式的组件截图保存），不需要复杂的图像合成逻辑。

---

## 三、我的页 —— 动物伙伴完整详情

### 3.1 扩展 stickers 表，加上"人设"信息

```sql
alter table stickers add column personality text;   -- 一句性格描述，如"火红的尾巴"
alter table stickers add column story text;          -- 一段角色故事
alter table stickers add column unlock_condition_text text; -- 面向用户展示的解锁条件文案
```

C 建表之后，需要**手动往 `stickers` 表里插入初始数据**（10个色系对应10只动物，参考策划文档里的对照表）：
```sql
insert into stickers (color_category, name, personality, story, unlock_condition_text) values
('红', '小狐狸', '火红的尾巴', '小狐狸最喜欢在傍晚散步，它的尾巴像一团暖暖的火焰...', '首次捕捉到第一种红色'),
('橙', '小松鼠', '爱囤东西', '小松鼠的脸颊总是鼓鼓的，据说藏满了秋天的颜色...', '首次捕捉到橙色'),
('黄', '小黄鸭', '永远元气满满', '', '首次捕捉到黄色'),
('绿', '小树蛙', '安静的观察者', '', '首次捕捉到绿色'),
('蓝', '小蓝鹊', '喜欢在天空找答案', '', '首次捕捉到蓝色'),
('紫', '小章鱼', '八条腿都很忙', '', '首次捕捉到紫色'),
('粉', '小火烈鸟', '优雅得过分', '', '首次捕捉到粉色'),
('棕/肤色', '小棕熊', '温暖又可靠', '', '首次捕捉到棕色系');
-- 白色系/黑色系如果你们的色彩分类体系里没单独区分，这两个可以先不建
```
（故事文案先占位，具体文字内容 A 或者团队里喜欢写文案的人可以后面慢慢填，不影响功能先跑通）

### 3.2 动物详情页数据结构

```typescript
interface AnimalDetail {
  name: string;
  personality: string;
  story: string;
  unlockConditionText: string;
  unlockedAt: string | null; // 从 user_stickers 表查，没解锁就是 null
  appearedPhotos: []; // 本次不做贴纸编辑器，这个列表先留空数组占位，不影响页面正常显示
}
```
详情页 UI 就是策划文档里画的那个样子：大图 + 名字 + 性格一句话 + 解锁时间/条件 + 故事段落，"出现过的照片"这个板块因为没有贴纸编辑器，暂时可以隐藏这个板块或者显示"暂无"。

---

## 四、数据库更新汇总（新增部分）

```sql
create table friendships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  friend_id uuid references profiles(id),
  created_at timestamptz default now(),
  unique(user_id, friend_id)
);

create table companion_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  friend_id uuid references profiles(id),
  date date not null,
  note text,
  created_at timestamptz default now()
);

alter table stickers add column personality text;
alter table stickers add column story text;
alter table stickers add column unlock_condition_text text;
```

（记得执行完 `alter table` 之后，把第三章 3.1 那段 `insert into stickers` 的初始数据也跑一遍，不然表结构有了但没内容。）

---

## 五、对分工的影响

| 角色 | 新增工作 |
|---|---|
| 你 | 好友增删逻辑、PK 数据获取函数、同行记录写入逻辑 |
| A | 好友列表页面、PK 对比界面、动物详情页 UI（形象+故事+解锁信息展示） |
| B | 网页端视情况决定要不要做好友模式（如果时间紧，网页端可以只保留排行榜，好友/PK 只在 App 端做） |
| C | 执行第四章的建表和 `stickers` 初始数据插入 |

排期建议：好友模式和动物详情页都建立在"拍照识别→色彩分布→排行榜"这条主链路已经跑通的基础上，建议放在集成测试点（30-40小时）之后再加，属于锦上添花的部分，主链路稳定性优先级更高。
