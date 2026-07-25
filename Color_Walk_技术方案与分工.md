# Color Walk 技术方案与团队分工（更新版）

目标：72 小时内交付一个**能在安卓手机上直接安装使用**的 App，同时**同步开发好 iOS 原生版本的代码但暂不上架**，iOS 用户先用**网页版**实际使用产品。

---

## 一、完整技术栈清单

| 层级 | 技术选型 | 说明 |
|---|---|---|
| 移动端语言 | TypeScript | 静态类型的 JavaScript，减少运行时报错，团队协作时接口定义更清晰 |
| 移动端框架 | React Native（通过 Expo 工具链） | 一套代码，分别编译出 Android / iOS 原生安装包 |
| 移动端状态管理 | Zustand | 比 Redux 简单，适合短期项目 |
| 移动端导航 | React Navigation | RN 生态标准路由库，管理页面栈 |
| 相机 | expo-camera | 调用系统相机、拍照、支持简单滤镜叠加 |
| 定位 | expo-location | 获取用户 GPS 经纬度 |
| 地图（App 内） | react-native-maps | Android 底层用 Google Maps，iOS 底层用 Apple Maps；如需高德需额外接第三方原生模块 |
| 本地离线存储 | AsyncStorage / expo-sqlite | 断网时缓存数据，联网后同步 |
| 网页端框架 | React（Vite 脚手架） | 独立网页项目，逻辑简化重写，避免与 RN 强耦合调试成本 |
| 网页端相机 | 浏览器 getUserMedia API | 网页端调用摄像头，需 HTTPS 环境 |
| 网页端定位 | 浏览器 Geolocation API | 网页端获取经纬度 |
| 网页端地图 | 高德地图 JS API 或 Mapbox GL JS | 网页专用地图 SDK，与移动端原生地图 SDK 不是同一套 |
| 后端 / BaaS | Supabase（基于 PostgreSQL） | 认证、数据库、文件存储、实时订阅、定时任务一站式解决，省去自建服务器 |
| 色彩识别算法服务 | Node.js + Sharp（图像处理库） | 独立小型接口，三端（Android/iOS/网页）共用同一套算法逻辑 |
| 版本控制 | Git + GitHub | 代码托管、分支协作 |
| 网页部署 | Vercel 或 Netlify | Git 推送自动构建部署，免运维 |

---

## 二、每一步具体用什么编译器 / 平台

### 移动端（Android + iOS 同一套代码）

**开发环境**
- 编辑器：VS Code（业界标准，装 React Native / ESLint 插件即可）
- 包管理器：npm 或 yarn（管理 JS 依赖库）
- 脚手架/工具链：Expo CLI（`npx create-expo-app` 初始化项目）

**Android 编译链**
- 本地编译工具：Android Studio + Gradle
  - Gradle 是 Android 的构建系统，负责把代码和资源文件编译打包成安装包，Android Studio 是官方 IDE，内置模拟器方便调试
- 云端编译（推荐，Windows 电脑也能用）：`eas build --platform android`
  - 命令把项目打包传到 Expo 云端服务器编译，几分钟后拿到产物
- 产物格式：
  - `.apk`（直接安装包，双击安装，**你们要的"下载链接"用这个**）
  - `.aab`（Android App Bundle，专供 Google Play 上架用，你们目前不需要）

**iOS 编译链**
- 本地编译工具：Xcode（苹果官方 IDE，底层用 Clang/LLVM 编译器把代码编译成机器码并签名）
- 云端编译：`eas build --platform ios`（同样支持，不需要碰 Mac，但你们现在已经有 Mac 了，可以直接本地跑）
- 签名机制：Provisioning Profile（描述文件，定义这个包能装在哪些设备/账号下）+ Certificate（开发者证书，标识身份）
  - 这两样东西在 Apple Developer 后台生成，Xcode / EAS 都能自动管理，不需要手动摸索
- 产物格式：`.ipa`（iOS 安装包，编完先留存，不提交 App Store / TestFlight）

### 网页端

- 脚手架：Vite（比 Create React App 快，现在业界主流选择）
- 部署：Vercel（`git push` 后自动构建上线，生成 `https://xxx.vercel.app` 链接，免费额度够用）
- 如果要自定义域名：买个域名接到 Vercel 上，几分钟能配好

### 后端

- Supabase 项目在网页控制台（app.supabase.com）创建，不需要本地装数据库
- 数据库操作：Supabase 自带的 SQL Editor（网页里直接写建表语句）或 Table Editor（图形化建表）
- Edge Functions（定时任务/自定义逻辑）：用 Deno 运行时写 TypeScript 函数，通过 Supabase CLI 部署（`supabase functions deploy`）
- 色彩算法服务：可以直接写成 Supabase Edge Function，或者用 Railway / Render 这类平台单独部署一个 Node.js 小服务（如果算法需要用到 Edge Function 不支持的 Node 原生图像库，就走这条路）

---

## 三、系统架构说明（对应上方架构图）

- **移动端项目（RN）** 是一个代码仓库，内部分两层：
  - **业务逻辑层**：状态管理、Supabase SDK 调用、色彩算法接口调用、导航逻辑
  - **UI 组件层**：各个页面的界面实现（拍照页、相册页、地图页、挑战页）
- 这套代码分别编译出 **Android APK**（直接分发）和 **iOS IPA**（先存档，不提交）
- **网页端** 是完全独立的 React 项目，UI 单独实现一遍（不与 RN 共享组件代码，逻辑简单重写成本更低）
- 移动端和网页端**调用同一个 Supabase 后端**，保证两边用户看到的是同一份数据（比如网页端拍的照片，移动端也能看到）

---

## 四、团队分工建议（在你们方案基础上微调）

| 角色 | 主要任务 | 说明 |
|---|---|---|
| 你 | RN 业务逻辑层（TypeScript）+ Android 编译发布 | 状态管理、Supabase SDK 对接、导航结构、色彩算法接口调用逻辑；Android 打包工作量集中在功能完成后，前中期重心在业务逻辑 |
| A | RN UI 组件层 + iOS 编译 | 前中期重心是把各页面界面实现出来（视觉上先对齐 CapWords 那种简洁风格，不用做精细设计稿），后期抽时间处理 Xcode 编译、权限配置、真机测试 |
| B | 网页端制作与部署 + 协助 C 的独立模块 | 网页整体功能对齐 App；协助内容建议明确为"色彩识别算法服务"或"地图 Key 统一申请管理"，不要笼统分配 |
| C | 三端共用的所有后端工作 | Supabase 认证/数据库/存储/实时同步/定时任务、色彩算法服务主体逻辑、统一维护数据库表结构文档 |

### 关键协作节点

1. **第 0-4 小时**：C 把数据库表结构、字段定义、API 调用方式写成一份共享文档（哪怕是简单的 Markdown），你和 B 在拿到真实接口前先用假数据（mock data）把 UI 和交互跑通，不用等 C
2. **第 6 小时左右**：你和 A 先跑一次最小可行流程——空项目跑通 `eas build`，确认 Android/iOS 编译链没有环境问题，避免留到最后才发现坑
3. **第 30-40 小时**：四人做一次集成检查点，把 App、网页、后端实际拼起来跑一次真实流程（拍照→上传→算法返回→存储→展示），尽早暴露联调问题，而不是留到最后一天
4. **持续**：Android 版本每完成一个功能模块，尽快在 iOS 模拟器/真机上跑一次，别等到最后才第一次在 iOS 上测试

---

## 五、72 小时时间轴参考

- **0-4h**：项目初始化（RN 项目、网页项目、Supabase 项目建好）、C 输出接口文档、Apple Developer 账号确认可用
- **4-30h**：并行开发——业务逻辑（你）、UI组件（A）、网页（B）、后端+算法（C）
- **30-40h**：第一次全链路集成测试
- **40-60h**：修复联调问题、补齐双人挑战/离线缓存等次要功能
- **60-68h**：iOS 真机测试、Android 打包出 APK、网页最终部署
- **68-72h**：最终检查、发布下载链接、留出缓冲
