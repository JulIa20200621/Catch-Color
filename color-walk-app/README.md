# Color Walk App Demo

这是团队分工中“APP 开发”部分的 Expo React Native + TypeScript Demo。一套业务代码支持 Android、iOS 和 Web；后端表、RLS、Storage、认证和服务端算法不在本项目内实现。

## 当前可演示功能

1. 今日色卡：优先读取 Supabase `daily_targets`，当日记录缺失时明确显示本地演示色。
2. 拍摄流程：相机、前后镜头、闪光灯、定位和相册选择；Web 无相机时降级为文件选择。
3. 真实本地颜色识别：缩放照片、读取像素、RGB 转 HSL、过滤低饱和/过暗/过亮像素，再按色相区间统计八类颜色。
4. 分析结果：目标色比例、颜色分布、低光提示和拍摄位置。
5. 本地相册：按日期或颜色浏览、颜色筛选、最近色彩日历、本地成就摘要。
6. 色彩足迹：展示带定位照片的路线时间线并分享摘要。
7. 社区照片墙：只读 Supabase 中 `storage_type = synced` 的公开照片。
8. 每日挑战：本地生成规则、口令、分享和个人进度，可完整演示交互。
9. 换色：选择个人色后保留本地拍摄，但当天不再具有全网色社区资格。

社区发布、Storage 上传、服务端复验、登录、真实双人加入/实时计分和地图瓦片需要后端提供对应 API、认证与数据，当前不会伪装成已完成。

## 本地运行

```powershell
cd D:\code\Horizon_Hackthon\color-walk-app
npm.cmd run typecheck
npm.cmd run web
```

若 Expo 开发服务器在当前网络环境中无法启动，可用已导出的静态版本验证网页：

```powershell
npm.cmd run export:web
npm.cmd run preview:web
```

然后访问 `http://localhost:8085`。

Android 真机使用 Expo Go：

```powershell
npm.cmd run start:android:clean
```

`--tunnel` 适合校园网、热点或手机与电脑无法直接互访的情况。启动后用新版 Expo Go 扫描二维码。

### Expo Go 卡在 99%

先在运行 Expo 的终端按 `Ctrl+C` 停止旧服务，再执行：

```powershell
npx.cmd expo start -c --tunnel
```

`-c` 会清掉旧 JavaScript bundle 和环境变量缓存。手机端请完全关闭 Expo Go 后重新扫码；若仍然只显示启动 Logo，确认 Expo Go 已更新，并让手机切换到能访问互联网的 Wi-Fi 或热点。新版本会在 React 页面启动异常时显示具体错误文字，截图该文字即可继续定位。

### 照片墙状态

社区页只读 Supabase 的 `photos` 表中 `storage_type = synced` 的记录：

- “今天还没有公开照片”：请求成功，但数据库尚无公开照片。
- “暂时无法读取照片墙”：手机无法访问 Supabase、RLS 拒绝读取，或 Expo Go 仍使用旧环境变量。按上面的清缓存步骤重启后再下拉刷新。

## 目录结构

```text
src/
  components/   通用按钮、页面容器、颜色分布
  data/         客户端演示色板
  navigation/   Stack 与底部 Tab 导航
  screens/      今日、拍摄、结果、相册、社区、挑战、足迹
  services/     后端适配、设备能力、图片分析、TypeScript 契约
  store/        Zustand + AsyncStorage 持久化及旧数据迁移
  theme/        设计变量
  types/        领域与导航类型
  utils/        颜色算法、日期工具
```

## Supabase 与 Mock

应用目录的 `.env` 使用以下变量：

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_ANALYZE_API_URL=https://your-analysis-service.example/analyze
```

URL 和 anon key 都存在时自动读取真实 Supabase。设置 `EXPO_PUBLIC_USE_MOCK=true` 可强制离线 Mock。当前 APP 只读：

- `daily_targets`：`id`、`date`、`color_hex`、`color_name`；`target_category`、`quote` 缺失时使用默认值。
- `photos`：只查询 `storage_type = synced`；`image_url` 必填，其余展示字段有安全默认值。

个人相册使用 Zustand + AsyncStorage，只存客户端记录，不向数据库写入。

## 前后端 TypeScript 契约

契约位于 `src/services/contracts.ts`：

- `getDailyTarget(date)` 获取今日颜色。
- `getCommunityPhotos(limit)` 获取公开社区照片。
- `analyzePhoto(request)` 预留服务端复验。
- `CreatePhotoRequest/Response` 预留认证后社区发布。

本地拍摄直接使用 `src/services/photoAnalysis.ts`，不等待后端算法。若结果要进入社区或挑战排行榜，后端仍应重新分析图片，不能信任客户端上报比例。

## Android APK

`eas.json` 的 `preview` profile 输出 APK：

```powershell
npm.cmd install --global eas-cli
eas.cmd login
eas.cmd build --platform android --profile preview
```

## iOS 准备状态

`app.json` 已包含 Bundle ID 及相机、定位、照片读取/保存权限说明；代码没有 Android 专属业务分支，可继续由 EAS 或 Mac/Xcode 验证。上架前仍需 Apple Developer 账号、正式图标、隐私清单和 iPhone 真机测试。

## UI 设计交接

UI 设计同学只修改 `src/screens`、`src/components`、`src/theme` 和 `assets`，通过现有 typed navigation、Zustand state 与 service contracts 取数据，不直接操作 Supabase。Figma 应同时交付正常、加载、空、错误、权限拒绝和成功状态，并标明颜色、字号、间距、圆角与图标规格。
