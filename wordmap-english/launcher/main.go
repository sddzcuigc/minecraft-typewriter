package main

import (
    "flag"
    "fmt"
    "log"
    "net"
    "net/http"
    "os"
    "os/exec"
    "path/filepath"
    "runtime"
    "time"
)

func main() {
    exe, err := os.Executable()
    if err != nil { log.Fatal(err) }
    root := flag.String("root", filepath.Dir(exe), "静态网页目录")
    port := flag.Int("port", 18765, "本机服务端口（固定端口可保持浏览器学习记录稳定）")
    flag.Parse()

    absRoot, err := filepath.Abs(*root)
    if err != nil { log.Fatal(err) }
    if info, err := os.Stat(filepath.Join(absRoot, "index.html")); err != nil || info.IsDir() {
        log.Fatalf("目录中未找到 index.html：%s", absRoot)
    }
    if *port < 1024 || *port > 65535 {
        log.Fatalf("端口必须在 1024-65535 之间：%d", *port)
    }

    // Bind loopback only. Never expose the local learning app to the LAN.
    ln, err := net.Listen("tcp", fmt.Sprintf("127.0.0.1:%d", *port))
    if err != nil {
        log.Fatalf("本地端口 %d 无法使用：%v\n请关闭占用该端口的程序后重试。固定端口用于保持学习记录稳定。", *port, err)
    }

    mux := http.NewServeMux()
    mux.Handle("/", http.FileServer(http.Dir(absRoot)))
    server := &http.Server{Handler: mux, ReadHeaderTimeout: 5 * time.Second}
    url := fmt.Sprintf("http://127.0.0.1:%d/", *port)

    fmt.Println("词汇星图 WordMap 已启动。")
    fmt.Println("仅监听本机回环地址，不向局域网开放。")
    fmt.Println("访问地址：", url)
    fmt.Println("关闭此窗口即可停止服务。")
    go func() {
        time.Sleep(350 * time.Millisecond)
        openBrowser(url)
    }()
    log.Fatal(server.Serve(ln))
}

func openBrowser(url string) {
    var cmd *exec.Cmd
    switch runtime.GOOS {
    case "windows":
        cmd = exec.Command("rundll32", "url.dll,FileProtocolHandler", url)
    case "darwin":
        cmd = exec.Command("open", url)
    default:
        cmd = exec.Command("xdg-open", url)
    }
    _ = cmd.Start()
}
