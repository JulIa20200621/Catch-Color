# 色彩算法需求更新说明

本文档更新此前几份文档里"色彩识别算法"相关的部分，其余章节（环境安装、Git 协作、Zustand 状态管理等）不受影响，照旧执行。

---

## 一、需求变化总结

| | 旧版 | 新版 |
|---|---|---|
| 判断方式 | 只判断"是否匹配目标色"，达到一个最低占比阈值就算成功 | 识别照片里**所有颜色的分布**，判断目标色占比是否落在 **60%-70%** 区间 |
| 数据存储 | 只存一个匹配百分比 | 存完整的颜色分布数据（为后续"贴纸"功能做准备） |
| 存储/计算位置 | 一律上传服务器分析 | 分两条路径：**个人相册**（本地存储+本地算法）／**社区分享**（上传服务器+服务器算法） |
| 未来扩展 | 无 | 根据识别到的颜色种类解锁对应"购物贴纸" |

> **假设说明**：这里把"60%到70%"理解为目标色占比需要落在这个区间才算成功（不是达到 60% 以上就行，而是既不能太低也不能太高）。如果实际是"至少 60%~70% 之间任意一个数作为下限"，把下限具体数值告诉我，代码里改一个数字即可，不影响整体架构。

---

## 二、为什么这样设计（原理）

### 为什么颜色分类算法能三端复用
颜色分析的核心逻辑是：**输入一组像素的 RGB 值，输出这些像素分别属于哪个颜色分类、占比多少**——这是纯数学计算，不依赖"图片是从相机来的还是从网页上传的"。三个不同环境（手机 App、网页、服务器）只是**获取像素数据的方式不同**，但拿到像素数据之后要做的计算是完全一样的。所以我们把"计算"这部分单独写成一个函数，三端各自用不同方式拿到像素数据后，都调用这同一个函数——**逻辑只写一次，改一次数字（比如成功阈值从 60% 改成 55%）三端同时生效**，不用改三份代码。

### 为什么要分"本地"和"上传服务器"两条路
- **省流量、省服务器成本**：大部分照片可能只是用户自己看看，不需要占用网络和服务器资源
- **保护隐私**：不是所有照片用户都想上传到你们的服务器上
- **反作弊考虑**：本地计算的结果理论上用户可以篡改（比如改手机时间、改本地数据库），如果这个结果要用于社区排行榜或者双人挑战这种"跟别人比"的场景，服务器端最好能重新验证一遍，不能完全相信客户端报上来的数字。**这也是为什么"分享到社区"这条路要重新上传图片给服务器再算一遍，而不是直接把手机本地算好的结果发上去**——虽然 72 小时时间紧，这一点建议保留，否则双人挑战功能容易被随便刷分。

---

## 三、颜色分类体系（新增设计）

把色相环（Hue，0-360度）划分成 8 个区间，每个区间对应一个"色系"：

| 色系 | 色相范围（度） |
|---|---|
| 红 | 345-360, 0-15 |
| 橙 | 15-45 |
| 黄 | 45-70 |
| 绿 | 70-165 |
| 青 | 165-195 |
| 蓝 | 195-255 |
| 紫 | 255-290 |
| 粉 | 290-345 |

另外要**过滤掉"无色系"的像素**：饱和度太低（发灰）或亮度太极端（接近纯黑/纯白）的像素不属于任何色系，不能算进统计里，否则一张背景是白墙的照片会被误判。具体规则：饱和度 < 15%，或亮度 < 8% ／ > 92% 的像素，直接跳过不计入统计。

---

## 四、核心算法（三端共用的纯函数）

```typescript
// colorAnalysis.ts —— 这个文件三端都放一份一模一样的代码

export interface ColorAnalysisResult {
  distribution: Record<string, number>; // 每个色系占"有效像素"的比例，如 { 红: 0.05, 蓝: 0.65 }
  targetCategory: string;
  targetRatio: number;
  success: boolean;
}

const CATEGORIES = [
  { name: '红', min: 345, max: 15 },   // 跨0度，特殊处理
  { name: '橙', min: 15, max: 45 },
  { name: '黄', min: 45, max: 70 },
  { name: '绿', min: 70, max: 165 },
  { name: '青', min: 165, max: 195 },
  { name: '蓝', min: 195, max: 255 },
  { name: '紫', min: 255, max: 290 },
  { name: '粉', min: 290, max: 345 },
];

function rgbToHSL(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return { h, s, l };
}

function classifyHue(h: number): string | null {
  for (const c of CATEGORIES) {
    if (c.min < c.max) {
      if (h >= c.min && h < c.max) return c.name;
    } else {
      // 红色区间跨越0度，比如 345~360 和 0~15 都算红
      if (h >= c.min || h < c.max) return c.name;
    }
  }
  return null;
}

// pixels: RGBA 格式的像素数组，每4个数字是一个像素 (R,G,B,A)
export function analyzePixels(pixels: Uint8ClampedArray | Buffer, targetCategory: string): ColorAnalysisResult {
  const counts: Record<string, number> = {};
  let validPixels = 0;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
    const { h, s, l } = rgbToHSL(r, g, b);
    if (s < 0.15 || l < 0.08 || l > 0.92) continue; // 过滤灰/黑/白像素
    const category = classifyHue(h);
    if (!category) continue;
    counts[category] = (counts[category] || 0) + 1;
    validPixels++;
  }

  const distribution: Record<string, number> = {};
  for (const key in counts) {
    distribution[key] = counts[key] / validPixels;
  }

  const targetRatio = distribution[targetCategory] || 0;
  const success = targetRatio >= 0.6 && targetRatio <= 0.7; // 区间判断

  return { distribution, targetCategory, targetRatio, success };
}
```

---

## 五、各端怎么拿到像素数据（唯一需要分开写的部分）

### 手机 App（你负责，需要新装一个库）
```bash
npm install react-native-canvas
```
```typescript
// 在组件里画布拿像素（简化示意，A可以直接照这个逻辑接进拍照结果页）
import Canvas, { Image as CanvasImage } from 'react-native-canvas';
import { analyzePixels } from '../utils/colorAnalysis';

async function analyzeLocal(canvasRef: Canvas, imageUri: string, targetCategory: string) {
  const ctx = canvasRef.getContext('2d');
  const img = new CanvasImage(canvasRef);
  img.src = imageUri;
  await new Promise((resolve) => { img.addEventListener('load', resolve); });
  canvasRef.width = 100; canvasRef.height = 100; // 缩小尺寸减少计算量
  ctx.drawImage(img, 0, 0, 100, 100);
  const imageData = await ctx.getImageData(0, 0, 100, 100);
  return analyzePixels(imageData.data, targetCategory);
}
```
原理：`react-native-canvas` 在 RN 里模拟出了浏览器才有的 Canvas API，`drawImage` 把图片画到画布上，`getImageData` 读出每个像素的 RGBA 值，这样就不需要额外的原生模块来做像素级图像处理。

### 网页端（B负责，浏览器原生自带，不用装额外的库）
```typescript
function analyzeLocal(imgElement: HTMLImageElement, targetCategory: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 100; canvas.height = 100;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(imgElement, 0, 0, 100, 100);
  const { data } = ctx.getImageData(0, 0, 100, 100);
  return analyzePixels(data, targetCategory);
}
```

### 服务器端（B写／C部署，只在"分享到社区"时触发）
```javascript
const sharp = require('sharp');
const { analyzePixels } = require('./colorAnalysis');

app.post('/analyze', async (req, res) => {
  const { imageUrl, targetCategory } = req.body;
  const imageRes = await fetch(imageUrl);
  const buffer = Buffer.from(await imageRes.arrayBuffer());
  const { data } = await sharp(buffer)
    .resize(100, 100)
    .ensureAlpha() // 强制输出RGBA四通道，跟Canvas格式对齐，这样能直接调用同一个analyzePixels函数
    .raw()
    .toBuffer({ resolveWithObject: true });
  const result = analyzePixels(data, targetCategory);
  res.json(result);
});
```
关键点：`.ensureAlpha()` 让 Sharp 输出的像素格式和浏览器/RN 的 Canvas 格式对齐（都是 RGBA 四通道），这样服务器端也能直接调用同一个 `analyzePixels` 函数，不用重写一遍逻辑。

---

## 六、数据库结构更新（C 执行）

```sql
-- photos 表新增字段
alter table photos add column storage_type text default 'local'; -- 'local' 仅本地 / 'synced' 已上传社区
alter table photos add column color_distribution jsonb;           -- 完整颜色分布，如 {"红":0.05,"蓝":0.65}
alter table photos add column target_category text;               -- 目标色系名称
alter table photos rename column match_score to target_ratio;     -- 字段改名，语义更准确

-- 为未来"贴纸"功能预留的表结构（现在建好，不需要现在就做功能）
create table color_categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  hue_min numeric,
  hue_max numeric
);

create table stickers (
  id uuid primary key default gen_random_uuid(),
  color_category text references color_categories(name),
  name text,
  image_url text
);

create table user_stickers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  sticker_id uuid references stickers(id),
  unlocked_at timestamptz default now()
);
```

**只有 `storage_type = 'synced'` 的照片才会真正写进 Supabase 的 `photos` 表**——本地相册的照片不上传，数据库里根本不会有记录，减少不必要的写入。

---

## 七、本地存储方案（你负责，手机端）

```bash
npx expo install expo-sqlite
```
本地建一张结构类似的表，存在手机本地的 SQLite 数据库文件里：
```typescript
// src/services/localDb.ts
import * as SQLite from 'expo-sqlite';
const db = SQLite.openDatabaseSync('colorwalk.db');

db.execSync(`
  create table if not exists local_photos (
    id text primary key,
    image_uri text,
    color_distribution text,
    target_category text,
    target_ratio real,
    success integer,
    synced integer default 0,
    created_at text
  );
`);
```
原理：SQLite 是一个"装在手机本地的迷你数据库"，不需要联网，App 关掉重开数据还在，跟 Supabase 用的 PostgreSQL 是同一类东西（都是关系型数据库），只是一个跑在服务器上给所有用户共用，一个跑在手机本地只服务这一个用户。

---

## 八、"分享到社区"的具体流程

1. 用户在本地相册里选一张照片，点"分享到社区"
2. 从 `local_photos` 表读出这条记录的 `image_uri`
3. 调用之前写好的 `uploadPhoto()` 逻辑，把图片文件上传到 Supabase Storage
4. 调用服务器的 `/analyze` 接口重新计算一遍（不直接用本地算好的结果，原因见第二章"反作弊"那段）
5. 把结果写进 Supabase 的 `photos` 表，`storage_type` 设为 `'synced'`
6. 把本地 `local_photos` 表里这条记录的 `synced` 字段改成 `1`，表示"已同步"

> 如果团队评估下来 72 小时实在来不及做"服务器重新计算"这一步，也可以简化成"直接把本地算好的结果一起传上去"，跳过反作弊这层保护——这是一个时间 vs 完整度的取舍，建议你们四人一起决定要不要简化这一步。

---

## 九、对分工的影响

| 角色 | 新增的工作 |
|---|---|
| 你 | 写 `colorAnalysis.ts` 核心算法文件、集成 `react-native-canvas`、写本地 SQLite 存取逻辑、写"保存本地 / 分享社区"两条路径的切换逻辑 |
| A | 界面上要加"保存到本地"和"分享到社区"两个按钮/选项，结果页要能展示颜色分布（比如一个条形图，每个色系一条），不只是一个百分比数字 |
| B | 网页端同样要实现本地 Canvas 计算逻辑（之前只需要写上传服务器的版本），服务器端的 `/analyze` 接口要按新的分类算法重写 |
| C | 执行上面第六章的数据库改动、新建三张预留表 |

核心算法文件 `colorAnalysis.ts` 建议你写完之后发到群里，A、B 直接复制这同一份代码用在各自的项目里，确保三端算法逻辑完全一致，不会出现"同一张照片在 App 上算出匹配，在网页上算出不匹配"这种不一致的情况。
