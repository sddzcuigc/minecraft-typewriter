# WordMap V5.1.1 · 便携发布包

## 构建改进

- Windows、macOS ARM64、Linux amd64 构建脚本统一更新到 V5.1。
- 构建前如存在 Node.js，自动运行无 npm 依赖的静态回归检查。
- 运行包同时包含 Go 启动器、静态资源、Three.js、本地离线单文件、使用说明和验收记录。
- 新增独立源代码 ZIP，包含 Go 启动器、构建脚本、词库、HTML/CSS/JS、Three.js 许可证和测试。
- 目标电脑不需要 Go、Node.js、Python 或 npm；浏览器是页面 JavaScript 的运行时。
- 启动器继续使用 CGO_ENABLED=0，仅监听 127.0.0.1:18765。

## 输出

- Windows：WordMap-V5.1-windows-amd64.zip
- macOS Apple Silicon：WordMap-V5.1-macos-arm64.zip
- Linux amd64：WordMap-V5.1-linux-amd64.zip
- 源代码：WordMap-V5.1-source.zip

## 验证边界

构建脚本和打包逻辑已更新。各平台二进制仍需在对应操作系统运行实测；Linux amd64 可在 Linux 构建机验证，Windows/macOS 产物需分别在目标设备验收。
