# Color Walk 完整技术执行手册

这是把之前所有讨论汇总、加细节、加原理背景的最终版本，四人各自对照自己的章节执行。开头先重申你们已经定下的规则，后面所有内容都是照这个规则展开的，中途不要再犹豫方向。

## 已确定的规则（不要再改）

1. 移动端用 **React Native（通过 Expo 工具链）+ TypeScript**，一套代码出 Android 和 iOS
2. **Android**：打包出 `.apk`，直接上传到网站/文件托管，做成公开下载链接，不经过任何审核
3. **iOS**：代码同步开发、用 Xcode 编译出 `.ipa` 存档，暂不提交 App Store / TestFlight
4. **网页版**：独立的 React 项目，是 iOS 用户实际使用产品的入口，官网同时放"安卓下载"和"网页版"两个入口
5. 后端用 **Supabase**（认证/数据库/存储/实时同步/定时任务）
6. 色彩识别算法跑在**服务器端**（Node.js + Sharp），Android / iOS / 网页三端共用同一个接口
7. 状态管理用 **Zustand**
8. 分工：**你**=业务逻辑层+Android打包，**A**=UI组件层+iOS编译，**B**=网页端+协助C，**C**=全部后端

---

# 第一部分：需要先懂的计算机基础原理

这几个概念贯穿了后面所有内容，先花十分钟看懂，后面操作起来才知道自己在干什么，不是照抄命令。

### 什么是"运行时"（Runtime）
代码本身只是文本文件，必须有一个程序读懂它、一行行执行，这个程序就叫运行时。JavaScript/TypeScript 代码需要 Node.js（服务器端）或者浏览器的 JS 引擎（网页端）、或者 React Native 的 JS 引擎（手机端）来执行，同一份 JS/TS 代码能在三个不同"运行时"里跑，这也是你们能用一套语言打通前后端的原因。

### 什么是"编译"（Compile）与"构建"（Build）
TypeScript 代码本身浏览器和手机都不能直接运行，需要先转换成普通 JavaScript（这一步叫编译，工具帮你自动做）；React Native 项目最终要变成手机能装的安装包，这个过程要把 JS 代码、图片资源、原生依赖库全部打包压缩签名成一个文件（`.apk` 或 `.ipa`），这个过程叫构建（build）。`eas build` 命令做的就是这件事。

### 什么是包管理器和依赖（npm / package）
你们写的代码不是从零造轮子，而是引用别人写好的现成代码库（比如 `expo-camera` 帮你封装好了调用相机的复杂逻辑），这些代码库叫"依赖包"（package），`npm install 包名` 就是从网上下载别人写好的代码放进你项目里。所有依赖记录在项目根目录的 `package.json` 文件里，别人 clone 你的代码后跑一次 `npm install` 就能自动装好所有同样的依赖，保证大家环境一致。

### 什么是客户端-服务端模型 与 API
"客户端"就是用户在用的东西（App、网页），"服务端"是后台运行、处理数据的程序（你们的 Supabase 和色彩算法服务）。客户端不能直接读写服务端的数据库（不安全也不合理），必须通过约定好格式的"请求-响应"方式跟服务端对话——这套约定好的对话格式就叫 API（接口）。比如"上传照片"这个 API 约定：客户端发一个 POST 请求，带上图片文件，服务端处理完返回一段 JSON 数据告诉你"成功了，图片地址是 xxx"。你们四人之间最重要的对接，本质就是"约定好 API 的格式，谁都不能私自改"。

### 什么是异步编程（async/await）
上传照片、请求数据库这些操作都要等网络返回结果，不可能让程序在这里"卡住不动"（不然界面会直接卡死），所以这类操作都是"异步"的——代码写成：
```typescript
async function uploadPhoto() {
  const result = await supabase.storage.upload(...); // 等待上传完成，但不阻塞其他代码执行
  return result;
}
```
`await` 的意思是"这一步等结果出来再往下走，但整个 App 界面不会因此卡住"。你们写的绝大部分和后端打交道的代码都会用到这个写法。

### 什么是版本控制（Git）的基本工作原理
Git 记录你项目文件每一次改动的"快照"（叫 commit）。四人各自在自己电脑上改代码，改完用 `git push` 传到 GitHub 上的共享仓库，别人用 `git pull` 拉取最新版本。为了避免大家同时改同一份代码互相覆盖，一般每人开一个自己的分支（branch）单独开发，做完再合并（merge）回主分支——**建议你们采用这个方式，避免直接在同一个 main 分支上改，减少冲突**。

### 什么是关系型数据库与 SQL
你们的数据（用户、照片、挑战记录）存在 Supabase 背后的 PostgreSQL 数据库里，这是一种"表格化"存储数据的方式，表和表之间用"外键"关联（比如一条照片记录里存着"这是哪个用户拍的"这个用户 ID，指向用户表里的一条记录）。SQL 是操作这种数据库的标准语言，C 用它来建表、查询、增删数据。

---

# 第二部分：四人环境安装清单（精确到下载哪个文件）

## 你（业务逻辑层 + Android）

| 步骤 | 具体操作 |
|---|---|
| 1 | 去 nodejs.org，下载 **LTS** 版本 Windows 安装包，双击一路 Next 装完 |
| 2 | 终端敲 `node -v` 和 `npm -v`，都能看到版本号说明装好了 |
| 3 | 去 code.visualstudio.com 下载 VS Code，装好后打开，左侧扩展图标搜索并安装：**ES7+ React/Redux/React-Native Snippets**、**Prettier**、**ESLint** |
| 4 | 去 git-scm.com 下载 Git，装好后终端敲 `git --version` 确认 |
| 5 | 终端敲 `npx create-expo-app colorwalk --template blank-typescript` 创建项目 |
| 6 | 手机装 **Expo Go** App（应用商店搜索），项目目录里敲 `npx expo start`，扫码预览 |
| 7 | （可选，想用电脑模拟器而不是手机）去 developer.android.com/studio 下载装好，打开后用 Device Manager 建一个虚拟设备 |

## A（UI 组件层 + iOS 编译）

Windows 电脑上的步骤和"你"完全一样（1-6），因为你们共用同一个代码仓库，环境要求一致。额外的是：

| 步骤 | 具体操作 |
|---|---|
| 8 | 用 `git clone` 把你和团队共享的 GitHub 仓库地址拉到自己电脑 |
| 9（等功能大致做完，转到 Mac 上时） | Mac 上打开 App Store，搜索 **Xcode** 下载安装（体积较大，几十 GB，提前留够时间下载） |
| 10 | Mac 终端里敲 `xcode-select --install` 装命令行工具 |
| 11 | 在项目目录敲 `npx expo prebuild` 生成原生 iOS 工程文件夹 `/ios` |
| 12 | 用 Xcode 打开 `ios/colorwalk.xcworkspace`（不是 `.xcodeproj`） |

## B（网页端 + 协助 C）

| 步骤 | 具体操作 |
|---|---|
| 1-4 | 同"你"的步骤 1-4（Node.js、VS Code、插件、Git） |
| 5 | 终端敲 `npm create vite@latest colorwalk-web -- --template react-ts` 创建网页项目 |
| 6 | `cd colorwalk-web && npm install && npm run dev`，终端会给一个 `http://localhost:5173` 的本地地址，浏览器打开就能看到网页 |
| 7 | 去 vercel.com 用 GitHub 账号登录注册，后面部署时一键连接仓库 |

## C（后端）

| 步骤 | 具体操作 |
|---|---|
| 1 | 不需要装任何 IDE，去 app.supabase.com 用 GitHub 或邮箱注册账号 |
| 2 | 点 "New Project"，起个项目名，选一个离你们近的服务器区域，设置数据库密码（记好，后面命令行连接要用） |
| 3 | （可选，想用命令行而不是全靠网页操作）终端敲 `npm install -g supabase`，装 Supabase CLI |
| 4 | 如果负责色彩算法服务，额外装 Node.js（同"你"步骤1），以及去 railway.app 或 render.com 注册账号，用于后面部署这个小服务 |

---

# 第三部分：数据库表结构（C 第一时间执行，其他人依据这个开发）

在 Supabase 控制台左侧 "SQL Editor" 里新建查询，粘贴执行：

```sql
create table profiles (
  id uuid primary key references auth.users(id),
  nickname text,
  avatar_url text,
  created_at timestamptz default now()
);

create table daily_targets (
  id uuid primary key default gen_random_uuid(),
  date date unique not null,
  color_hex text not null,
  color_name text not null
);

create table challenges (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid references profiles(id),
  user_b_id uuid references profiles(id),
  date date not null,
  status text default 'active',
  created_at timestamptz default now()
);

create table photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  challenge_id uuid references challenges(id),
  image_url text not null,
  match_score numeric,
  latitude double precision,
  longitude double precision,
  created_at timestamptz default now()
);

-- 开启行级安全（不开这个，任何人都能读写所有数据，非常不安全）
alter table profiles enable row level security;
alter table daily_targets enable row level security;
alter table challenges enable row level security;
alter table photos enable row level security;

-- 基础策略：登录用户能读所有数据，只能改自己的数据
create policy "任何人可读" on photos for select using (true);
create policy "只能插入自己的" on photos for insert with check (auth.uid() = user_id);
create policy "任何人可读daily_targets" on daily_targets for select using (true);
create policy "任何人可读profiles" on profiles for select using (true);
create policy "只能改自己的profile" on profiles for update using (auth.uid() = id);
```

C 建完表之后，把 **Project URL** 和 **anon public key**（在 Settings → API 里找）发到群里，你、A、B 都需要这两个值来连接后端。

---

# 第四部分：你的详细任务（业务逻辑层 + Android）

### 项目结构（第 1 小时内建好空文件夹占位）
```
/src
  /screens      (A 写)
  /components   (A 写)
  /store        ← 你
  /services     ← 你
  /types        ← 你
  /hooks        ← 你
```

### 第一步：环境变量（存放 C 给的密钥）
项目根目录建 `.env` 文件：
```
EXPO_PUBLIC_SUPABASE_URL=C给的URL
EXPO_PUBLIC_SUPABASE_ANON_KEY=C给的密钥
```
原理：这两个值不能直接写在代码里提交到 GitHub（公开仓库谁都能看到），用环境变量的方式让每个人的本地配置分开管理，`.env` 文件要加进 `.gitignore` 里，确保不会被提交上去。

### 第二步：类型定义（对应数据库表，第 2 小时内完成）
```typescript
// src/types/index.ts
export interface Photo {
  id: string;
  user_id: string;
  challenge_id: string | null;
  image_url: string;
  match_score: number | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}
export interface DailyTarget {
  color_hex: string;
  color_name: string;
}
export interface Challenge {
  id: string;
  user_a_id: string;
  user_b_id: string;
  date: string;
  status: 'active' | 'expired';
}
```

### 第三步：Supabase 客户端初始化
```typescript
// src/services/supabase.ts
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);
```

### 第四步：API 服务层（先用假数据 mock，不用等 C）
```typescript
// src/services/api.ts
const USE_MOCK = true; // C的接口写好之后改成 false

export async function fetchTodayTarget(): Promise<DailyTarget> {
  if (USE_MOCK) {
    return { color_hex: '#FF6B6B', color_name: '珊瑚红' };
  }
  const { data } = await supabase.from('daily_targets').select('*').eq('date', new Date().toISOString().slice(0,10)).single();
  return data;
}

export async function uploadPhoto(userId: string, imageUri: string) {
  // 1. 读取本地图片文件转成二进制
  const response = await fetch(imageUri);
  const blob = await response.blob();
  // 2. 上传到 Supabase Storage
  const fileName = `${userId}/${Date.now()}.jpg`;
  const { data: uploadData } = await supabase.storage.from('photos').upload(fileName, blob);
  const imageUrl = supabase.storage.from('photos').getPublicUrl(fileName).data.publicUrl;
  // 3. 调用色彩算法服务（C提供的接口地址）
  const analyzeRes = await fetch('C提供的算法服务地址/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl, targetHex: '#FF6B6B' }),
  });
  const { ratio, success } = await analyzeRes.json();
  // 4. 写入数据库
  await supabase.from('photos').insert({ user_id: userId, image_url: imageUrl, match_score: ratio });
  return { success, ratio, imageUrl };
}
```
**这个函数是整条链路的核心，务必理解每一步在做什么，因为几乎所有和后端的对接都长这个样子：拿数据 → 处理 → 存回去。**

### 第五步：Zustand 状态管理
```typescript
// src/store/useUserStore.ts
import { create } from 'zustand';
interface UserState {
  user: { id: string; nickname: string } | null;
  setUser: (u: any) => void;
}
export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
```

### 第六步：写 Hook 给 A 用（这是你和 A 的对接方式）
```typescript
// src/hooks/useCamera.ts
import * as ImagePicker from 'expo-image-picker';
import { uploadPhoto } from '../services/api';
import { useUserStore } from '../store/useUserStore';
import { useState } from 'react';

export function useCamera() {
  const user = useUserStore((s) => s.user);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; ratio: number } | null>(null);

  const takePhotoAndAnalyze = async () => {
    const photo = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (photo.canceled) return;
    setLoading(true);
    const res = await uploadPhoto(user!.id, photo.assets[0].uri);
    setResult(res);
    setLoading(false);
  };

  return { takePhotoAndAnalyze, loading, result };
}
```
A 在页面里这样用：
```typescript
const { takePhotoAndAnalyze, loading, result } = useCamera();
// <Button onPress={takePhotoAndAnalyze} title="拍照" />
// {loading && <Text>分析中...</Text>}
// {result && <Text>匹配度 {result.ratio * 100}%</Text>}
```
A 完全不需要知道 Supabase、不需要知道色彩算法怎么调，只管拿 `loading`、`result` 这几个状态渲染界面。

### 第七步：路由
```bash
npm install @react-navigation/native @react-navigation/native-stack
```
把 A 做好的页面组件一个个注册进路由表，管理页面跳转。

### 第八步：离线缓存
```bash
npm install @react-native-async-storage/async-storage @react-native-community/netinfo
```
监听网络状态，断网时把待上传数据存进 AsyncStorage，网络恢复后遍历上传。

### 第九步：Android 打包
```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```
编译完成后 Expo 给一个下载链接，把这个 `.apk` 传到蒲公英（pgyer.com）或者 GitHub Release，拿到最终链接给 B 放进官网。

---

# 第五部分：A 的详细任务（UI 组件层 + iOS 编译）

### 需要实现的页面（对照你提供的 hook 逐个写）

| 页面 | 用到的 Hook（你提供） | 主要组件 |
|---|---|---|
| 登录页 | `useAuth()` | `TextInput`、`TouchableOpacity` |
| 拍摄页 | `useCamera()` | 取景按钮、loading 状态展示 |
| 结果页 | 拍摄后 `result` 直接传参过来 | 大字号百分比展示 |
| 相册页 | `usePhotos()` | `FlatList` 网格布局 |
| 地图页 | `useFootprints()` | `react-native-maps` 的 `<MapView>` + `<Marker>` |
| 挑战页 | `useChallenge()` | 双人进度条对比 |

### RN 基础组件速查
- `<View>`：布局容器，相当于网页的 `<div>`
- `<Text>`：RN 里文字必须包在这里面，不能直接写在 `<View>` 里
- `<Image source={{uri: url}} />`：显示网络图片
- `<TouchableOpacity onPress={fn}>`：可点击区域
- `<FlatList data={arr} renderItem={...} />`：高性能长列表，数据多也不卡

### 样式写法
```typescript
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold' },
});
```
布局用 Flexbox（`flex`、`justifyContent`、`alignItems`），和网页 CSS 的 Flexbox 是同一套原理。

### iOS 编译具体步骤（Mac 上）

1. `npx expo prebuild` 生成 `/ios` 文件夹
2. Xcode 打开 `ios/colorwalk.xcworkspace`
3. 左侧点项目名 → **Signing & Capabilities** → Team 选你们的 Apple Developer 账号
4. 打开 `ios/colorwalk/Info.plist`，右键 Open As → Source Code，加入：
```xml
<key>NSCameraUsageDescription</key>
<string>需要使用相机拍摄颜色照片</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>需要定位记录足迹</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>需要访问相册选择照片</string>
```
**原理**：iOS 系统要求任何调用相机、定位、相册的行为必须先向用户解释原因，没配这几行代码，App 一调用相机就会直接闪退，不会弹出授权框。
5. 用数据线连真机，Xcode 左上角选中你的设备，点▶运行，第一次运行需要在 iPhone 设置里"信任"这个开发者证书（设置 → 通用 → VPN与设备管理）
6. 都跑通后，Product 菜单 → Archive，导出 `.ipa` 文件存好

---

# 第六部分：B 的详细任务（网页端 + 协助 C）

### 网页拍照（最简单可靠写法）
```html
<input type="file" accept="image/*" capture="environment" onChange={handleFile} />
```
```typescript
const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const fileName = `${userId}/${Date.now()}.jpg`;
  const { data } = await supabase.storage.from('photos').upload(fileName, file);
  // 后续调用算法接口逻辑和移动端 uploadPhoto 一致
};
```
原理：`capture="environment"` 让手机浏览器直接调起后置摄像头拍照，不需要用更复杂的 `getUserMedia` API 自己写取景框逻辑。

### 网页项目结构
和移动端类似分层，但更简单：
```
/src
  /pages
  /services   ← 复制移动端的 supabase.ts 和 api.ts 逻辑，改成网页写法
```

### 部署
GitHub 仓库连接 Vercel（网页几步点击操作：Import Project → 选仓库 → Deploy），之后每次 `git push` 自动重新构建。

### 协助 C：色彩算法服务（B 独立开发，C 负责部署）
```javascript
// analyze.js
const express = require('express');
const sharp = require('sharp');
const app = express();
app.use(express.json());

function rgbToHSL(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h = 0, l = (max+min)/2;
  const d = max - min;
  if (d !== 0) {
    if (max === r) h = ((g-b)/d) % 6;
    else if (max === g) h = (b-r)/d + 2;
    else h = (r-g)/d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, l };
}

app.post('/analyze', async (req, res) => {
  const { imageUrl, targetHex } = req.body;
  const imageRes = await fetch(imageUrl);
  const buffer = Buffer.from(await imageRes.arrayBuffer());
  const { data, info } = await sharp(buffer).resize(100, 100).raw().toBuffer({ resolveWithObject: true });

  const targetR = parseInt(targetHex.slice(1,3), 16);
  const targetG = parseInt(targetHex.slice(3,5), 16);
  const targetB = parseInt(targetHex.slice(5,7), 16);
  const targetH = rgbToHSL(targetR, targetG, targetB).h;

  let matchCount = 0;
  const totalPixels = info.width * info.height;
  for (let i = 0; i < data.length; i += info.channels) {
    const { h } = rgbToHSL(data[i], data[i+1], data[i+2]);
    if (Math.abs(h - targetH) <= 15) matchCount++;
  }

  const ratio = matchCount / totalPixels;
  res.json({ ratio, success: ratio >= 0.15 });
});

app.listen(3000);
```
这段代码的每一步原理在之前的文档里讲过（缩小图片减少计算量、RGB转HSL方便判断色系、用色相容差判断"同一色系"），照着改参数就能用。

---

# 第七部分：C 的详细任务（后端）

1. 按第三部分的 SQL 建表 + 配置 RLS
2. Authentication → Providers，开启 Email 登录
3. Storage → New bucket，名字叫 `photos`，配置策略：
```sql
create policy "登录用户可上传" on storage.objects
for insert with check (bucket_id = 'photos' and auth.role() = 'authenticated');
```
4. Database → Replication，把 `challenges` 表加入 realtime 发布，实现双人进度实时同步
5. 终端敲 `supabase functions new daily-reset`，写定时任务逻辑（每天 0 点把过期挑战状态改成 `expired`），`supabase functions deploy daily-reset` 部署
6. 拿到 B 写的 `analyze.js`，去 railway.app 新建项目连接 GitHub 仓库，自动部署出一个 HTTPS 地址，把这个地址发给你（用在 `uploadPhoto` 函数里）
7. 持续维护一份共享文档：表结构变化、接口地址、字段含义，任何改动第一时间同步给其他三人

---

# 第八部分：四人对接协议总结

| 谁和谁对接 | 通过什么 | 具体形式 |
|---|---|---|
| 你 ↔ A | Hook 契约 | 你写 `useXxx()` 函数返回数据和方法，A 只管调用渲染，不碰 Supabase |
| 你/A ↔ C | API 契约 | C 提供数据库表结构 + 色彩算法接口地址，你按这个格式写 `api.ts` |
| B ↔ C | API 契约（同上） | 网页版调用同一套 Supabase 后端和算法接口 |
| 全员 | Git 分支 | 建议每人开自己的分支（`git checkout -b feature/你的名字`），做完提 Pull Request 合并到 main，避免直接改同一个文件互相覆盖 |

**最重要的原则**：C 第一时间把数据库表结构定下来发出来，之后谁都不能私自改字段名——如果必须改，改之前群里说一声，因为你、A、B 的代码里到处都在按这个结构读写数据，字段名一变所有人的代码都要跟着改。
