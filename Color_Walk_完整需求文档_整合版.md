# Color Walk 完整需求文档（整合版）

本文档整合《参赛作品策划》里的完整产品愿景，和之前几轮讨论定下的 72 小时技术方案，并加入本次新增的四个功能。分两层看：**完整版愿景**是长期方向，不要求 72 小时做完；**72 小时 MVP 范围**是你们实际要交付的东西。

---

## 一、产品故事（浓缩版）

Color Walk 源自"用颜色做主题的散步游戏"这个想法——出门前选一个颜色，散步时专门留意这个颜色，拍下来。核心体验是"重新注意到被忽略的生活细节"，用颜色作为一个简单的切入点，让散步这件事变得像寻宝。产品形态上，用户拍照收集颜色，解锁对应的小动物伙伴，也可以和朋友比一比、去社区看看别人拍到了什么。

---

## 二、完整版功能全貌 与 72小时取舍

| Tab | 完整版功能 | 72小时范围 |
|---|---|---|
| **拍摄页** | 相机（闪光灯/变焦/翻转）+ 今日目标色 + 进度条 + 拍立得确认卡片 + 手动修正颜色 | ✅ 做，简化掉闪光灯/变焦这些相机高级控制，保留最核心的拍照+确认流程 |
| **相册页-相册模式** | 网格画廊 + 按颜色/日期筛选（书本翻页样式）+ 贴纸编辑 | ✅ 做基础网格画廊；筛选功能保留但不做"书本翻页"这种精细动效；贴纸编辑功能砍掉（放进"以后再做"） |
| **相册页-地图模式** | 每日轨迹 + 多天轨迹合并 + 照片标记点 | ✅ 做单屏足迹展示（之前已经定过这个简化方案）；"多天轨迹合并"这个功能砍掉 |
| **伙伴页-好友模式** | 好友列表 + PK功能 + 同行记录 | ❌ 砍掉。好友关系、PK、同行识别这套逻辑复杂度高，72小时做不完整，**用新提的"排行榜"功能替代**，效果类似但实现简单得多 |
| **伙伴页-社区模式** | 公开Feed流 + 点赞评论 + 官方活动 | ❌ 砍掉（之前已经讨论过，公开UGC社区涉及内容审核，App Store审核风险高，72小时也做不完整） |
| **我的页** | 统计数据 + 专属色盘 + 成就徽章 + 动物伙伴（含装扮/故事） | ✅ 做统计数据和色盘展示；成就徽章做**简化版**（本次设计）；动物伙伴解锁做**基础版**（只做解锁，不做装扮换装和角色故事） |
| （新增）| 排行榜 | ✅ 做，替代好友PK/社区的位置 |
| （新增）| 压力测试模式 | ✅ 做 |
| （新增）| 每日心情模式 | ✅ 做 |

**一句话总结**：72 小时聚焦在"一个人也能完整体验"的核心闭环（拍照→识别→收集→解锁→看排行榜），社交向的复杂功能（好友、PK、公开社区、精细的贴纸编辑装扮）留到黑客松之后再做。

---

## 三、新增功能技术设计

### 3.1 排行榜

两个榜单，数据直接从 `photos` 表聚合，不需要额外的数据结构：

```sql
-- 颜色种类榜：谁找到的不同颜色种类最多
select user_id, count(distinct target_category) as color_count
from photos
where target_category is not null
group by user_id
order by color_count desc
limit 50;

-- 照片数量榜：谁拍的照片最多
select user_id, count(*) as photo_count
from photos
group by user_id
order by photo_count desc
limit 50;
```

**实现建议**：不需要做实时更新（不用 Supabase Realtime 订阅这么复杂），用户打开排行榜页面时查询一次就够，加个下拉刷新即可。前端用一个二级 Tab 切换"颜色榜"和"照片榜"，`FlatList` 渲染排名、头像、昵称、数值——跟之前相册页那个 `FlatList` 用法是一样的组件。

### 3.2 成就勋章（含简单规则算法）

这是你要的"需要一些简单算法支撑"的部分。这里说的"算法"不是机器学习，而是**一套规则匹配逻辑**：每个勋章定义一个"解锁条件"，系统检查用户当前的统计数据是否达到条件，达到就解锁——本质上是最简单的"if 条件成立就触发"，但组织成一套可扩展的规则表，方便以后加新勋章不用改代码逻辑。

**数据库设计：**
```sql
create table badges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  icon_url text,
  condition_type text not null, -- 'photo_count' | 'color_count' | 'streak_days' | 'stress_relief_count' | 'mood_streak_days'
  condition_value numeric not null
);

create table user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  badge_id uuid references badges(id),
  unlocked_at timestamptz default now(),
  unique(user_id, badge_id)
);
```

**建议的初版勋章清单**（参考你策划文档里的例子，加了两个跟新功能相关的）：

| 勋章 | 解锁条件 |
|---|---|
| 初来乍到 | 拍摄第一张照片 |
| 十全十美 | 捕捉到10种不同颜色 |
| 颜色猎人 | 捕捉到所有8个色系 |
| 连续打卡 | 连续7天都有拍照记录 |
| 解压达人 | 压力测试模式使用满5次，且平均压力下降为正 |
| 心情记录家 | 连续记录心情7天 |

**规则检查算法（每次拍照/记录心情/压力测试后触发一次）：**
```typescript
async function checkAndUnlockBadges(userId: string) {
  // 1. 拉取用户当前统计数据
  const { data: photos } = await supabase.from('photos').select('target_category, created_at').eq('user_id', userId);
  const { data: moods } = await supabase.from('mood_records').select('date').eq('user_id', userId);
  const { data: stress } = await supabase.from('stress_records').select('stress_delta').eq('user_id', userId);

  const stats = {
    photo_count: photos.length,
    color_count: new Set(photos.map(p => p.target_category)).size,
    streak_days: calculateStreak(photos.map(p => p.created_at)), // 连续天数计算函数，自己写一个简单的日期比较循环即可
    stress_relief_count: stress.filter(s => s.stress_delta < 0).length,
    mood_streak_days: calculateStreak(moods.map(m => m.date)),
  };

  // 2. 拿到所有勋章规则，和用户已解锁的勋章
  const { data: badges } = await supabase.from('badges').select('*');
  const { data: unlocked } = await supabase.from('user_badges').select('badge_id').eq('user_id', userId);
  const unlockedIds = new Set(unlocked.map(u => u.badge_id));

  // 3. 逐条检查，达标且未解锁的就插入解锁记录
  for (const badge of badges) {
    if (unlockedIds.has(badge.id)) continue;
    if (stats[badge.condition_type] >= badge.condition_value) {
      await supabase.from('user_badges').insert({ user_id: userId, badge_id: badge.id });
      // 这里可以触发一个解锁动画/弹窗通知
    }
  }
}
```

`calculateStreak` 这个"连续天数"函数思路：把日期数组去重排序，从最近一天往前数，只要连续两天日期差是1天就继续累加，中断就停止计数——这是一个简单的循环比较，不需要复杂算法。

### 3.3 压力测试模式

拍照前后各测一次压力值，记录差异，帮用户直观看到"这次散步/拍照有没有帮自己放松"。

**数据库设计：**
```sql
create table stress_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  photo_id uuid references photos(id),
  stress_before smallint,  -- 1-10
  stress_after smallint,   -- 1-10
  stress_delta smallint generated always as (stress_after - stress_before) stored, -- 数据库自动算差值，不用你手动计算
  created_at timestamptz default now()
);
```
`generated always as ... stored` 这个写法的意思是：这一列不需要你插入数据时手动算，数据库会根据另外两列自动算好存起来，省一步计算逻辑。

**交互流程：**
1. 用户在拍摄页开启"压力测试模式"（一个开关按钮）
2. 拍照前弹出一个 1-10 的滑条："现在压力值是多少？"
3. 走正常的拍照→识别流程
4. 确认保存前再弹一次同样的滑条
5. 把两次数值和照片 ID 一起存进 `stress_records`

**前端组件：**
```bash
npx expo install @react-native-community/slider
```
```typescript
import Slider from '@react-native-community/slider';
<Slider minimumValue={1} maximumValue={10} step={1} value={stressValue} onValueChange={setStressValue} />
```

**结果展示**：可以在确认卡片上加一行"压力从 7 降到 4，放松了不少"，配一句鼓励文案，这个小反馈本身也是产品体验的一部分。

### 3.4 每日心情模式

**数据库设计：**
```sql
create table mood_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  date date not null,
  mood text not null,  -- 预设枚举：'开心'|'平静'|'难过'|'烦躁'|'兴奋'
  note text,           -- 可选的文字感受
  created_at timestamptz default now(),
  unique(user_id, date)
);
```
`unique(user_id, date)` 保证一天只有一条记录——如果用户当天再记一次，用 `upsert`（更新或插入）而不是普通插入，代码里这样写：
```typescript
await supabase.from('mood_records').upsert(
  { user_id: userId, date: today, mood: selectedMood, note },
  { onConflict: 'user_id,date' }
);
```

**交互流程**：拍照确认保存之后，弹出一个"今天心情怎么样？"的选择器（5-6 个表情图标选一个）+ 一个可选的文字输入框，选完直接存。

**主页日历展示**：
```bash
npm install react-native-calendars
```
这个库能直接渲染一个月历组件，每个日期格子可以自定义显示内容（比如背景色或者小表情图标）。你从 `mood_records` 表拉出当月数据，转换成这个库要求的格式（`{ '2026-07-24': { customStyles: {...} } }` 这种以日期为 key 的对象），传给组件就能显示"哪天心情怎么样"的日历视图。

---

## 四、数据库结构总表（含本次新增）

汇总目前为止确定的全部表结构，之后就以这份为准：

```sql
-- 用户资料
create table profiles (
  id uuid primary key references auth.users(id),
  nickname text, avatar_url text, created_at timestamptz default now()
);

-- 每日目标色
create table daily_targets (
  id uuid primary key default gen_random_uuid(),
  date date unique not null, color_hex text not null, color_name text not null
);

-- 双人挑战
create table challenges (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid references profiles(id), user_b_id uuid references profiles(id),
  date date not null, status text default 'active', created_at timestamptz default now()
);

-- 拍照记录
create table photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  challenge_id uuid references challenges(id),
  image_url text not null,
  target_ratio numeric,
  target_category text,
  color_distribution jsonb,
  storage_type text default 'local',
  latitude double precision, longitude double precision,
  created_at timestamptz default now()
);

-- 颜色分类参考表 + 动物伙伴解锁（此前预留，现在对应策划文档里的"动物伙伴"功能）
create table color_categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null, hue_min numeric, hue_max numeric
);
create table stickers (
  id uuid primary key default gen_random_uuid(),
  color_category text references color_categories(name), name text, image_url text
);
create table user_stickers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id), sticker_id uuid references stickers(id),
  unlocked_at timestamptz default now()
);

-- 成就徽章（本次新增）
create table badges (
  id uuid primary key default gen_random_uuid(),
  name text not null, description text, icon_url text,
  condition_type text not null, condition_value numeric not null
);
create table user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id), badge_id uuid references badges(id),
  unlocked_at timestamptz default now(), unique(user_id, badge_id)
);

-- 压力测试（本次新增）
create table stress_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id), photo_id uuid references photos(id),
  stress_before smallint, stress_after smallint,
  stress_delta smallint generated always as (stress_after - stress_before) stored,
  created_at timestamptz default now()
);

-- 每日心情（本次新增）
create table mood_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id), date date not null,
  mood text not null, note text,
  created_at timestamptz default now(), unique(user_id, date)
);
```

---

## 五、对分工的影响

| 角色 | 新增工作 |
|---|---|
| 你 | 排行榜查询逻辑、成就勋章检查算法（`checkAndUnlockBadges`）、压力测试和心情记录的 hook |
| A | 排行榜页面 UI、压力测试的滑条交互界面、心情选择器界面、主页日历组件接入 |
| B | 网页端同步实现排行榜展示（心情/压力测试如果时间不够，可以只做移动端，网页端跳过） |
| C | 执行第四章的数据库建表，特别注意 `badges` 表要预先插入几条初始数据（前面给的示例勋章清单），不然表建好了但没内容可检查 |

建议实际排期上，**排行榜优先级最高**（最简单，替代了原本复杂的好友/PK/社区模块），压力测试和心情模式可以放在核心拍照链路跑通之后再加，成就徽章排最后（因为依赖前面几个功能的数据都跑起来才有东西可检查）。
