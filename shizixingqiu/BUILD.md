# 便携构建说明

GitHub Actions 工作流 `.github/workflows/build-portable.yml` 在更新本项目后自动构建：

- Windows x64 单文件启动器
- Linux x64 单文件启动器
- macOS Apple Silicon 单文件启动器
- 完整源码与离线网页资源 ZIP

构建时使用 `CGO_ENABLED=0`，Go 标准库编入可执行文件；不需要 Node.js/npm。Actions 产物保留30天。第一次运行前请解压源码包或直接使用对应启动器。默认只监听 127.0.0.1；局域网共享需要显式设置 `-listen 0.0.0.0:18765` 并配置防火墙。
