# WordCraft V4.0 · Minecraft 风格 Three.js 世界重构

## 视觉与交互
- 将 V3.3 二维卡片式界面改为全屏、可旋转的方块世界。
- 程序化生成中央村庄、六个单元浮岛、浮空岩层、方块桥梁、树木、单元建筑、云层、海面、传送门、方块角色和粒子。
- 左侧任务清单、浮岛标签、当前单词 HUD 与原有学习进度同步。
- 鼠标拖动旋转视角、滚轮缩放、点击浮岛切换到对应单元；保留底部学习热栏。
- 采用深色像素边框和草木/泥土/木材配色，学习面板作为游戏内 HUD，而非传统白色卡片。

## 技术实现
- Three.js 0.159 classic build 固定存放于 `vendor/three.min.js`，附 MIT 许可证；运行不依赖 CDN。
- 通过 `InstancedMesh` 对方块进行批量绘制，避免为每个方块创建独立 draw call。
- 世界地形和装饰由 JavaScript 程序化生成，不依赖远程模型、贴图或音频资源。
- WebGL 初始化失败时隐藏 3D 画布，保留原学习功能。
- Service Worker 缓存新增 world-theme.css、world.js、Three.js 本地引擎。
- 单文件离线版内嵌 Three.js、词库、应用逻辑、世界场景与样式。
- Windows/macOS/Linux Go 便携构建脚本将 Three.js 与许可证复制到 dist/vendor。

## 数据与兼容
- 保留 V3.3 153 个词条、149 条关系边、6 个单元。
- 不改变 localStorage 键 `wordmap_product_v21` 和原学习状态结构。
- 保留拼音打字、图片词典、记忆卡、间隔复习、自动听写、家长中心和 JSON 备份恢复。

## 已知边界
- 图片词典的 Wikimedia 搜索仍是用户主动使用时的可选联网功能；3D 世界本身完全本地生成。
- 实际 WebGL 渲染、目标电脑 GPU 性能、触屏拖动和 Go 多平台重新编译仍需目标设备验收。
- Three.js 采用本地固定版本，升级时需同步重新验证单文件离线包与许可证。
