package main

import (
	"embed"
	"flag"
	"fmt"
	"io/fs"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"time"
)

//go:embed index.html style.css data.js notes.js app.js advanced.js teacher-engine.js teacher.js strokes.js sw.js ATTRIBUTION.md STROKE-DATA-LICENSE.txt UPSTREAM-MIT-LICENSE.txt
var site embed.FS

func main() {
	listen := flag.String("listen", "127.0.0.1:18765", "HTTP listen address; use 0.0.0.0:18765 only when LAN access is needed")
	open := flag.Bool("open", true, "open the local site in the default browser")
	flag.Parse()

	root, err := fs.Sub(site, ".")
	if err != nil {
		log.Fatal(err)
	}

	mux := http.NewServeMux()
	mux.Handle("/", http.FileServer(http.FS(root)))
	server := &http.Server{
		Addr:              *listen,
		Handler:           securityHeaders(mux),
		ReadHeaderTimeout: 5 * time.Second,
	}

	ln, err := net.Listen("tcp", *listen)
	if err != nil {
		log.Fatalf("cannot listen on %s: %v", *listen, err)
	}
	url := "http://" + ln.Addr().String() + "/"
	fmt.Println("识字星球已启动：", url)
	fmt.Println("核心字库、练习和本地记录可离线使用；首次图片搜索/未缓存笔顺需要网络。")
	fmt.Println("默认仅监听本机。若需内网访问，请显式指定 -listen 0.0.0.0:18765，并自行配置防火墙。")
	if host, port, err := net.SplitHostPort(ln.Addr().String()); err == nil && host == "0.0.0.0" {
		if addrs, err := net.InterfaceAddrs(); err == nil {
			for _, addr := range addrs {
				if ipnet, ok := addr.(*net.IPNet); ok && ipnet.IP.To4() != nil && !ipnet.IP.IsLoopback() {
					fmt.Printf("内网访问地址：http://%s:%s/\n", ipnet.IP.String(), port)
				}
			}
		}
	}

	if *open {
		go func() {
			time.Sleep(250 * time.Millisecond)
			browserURL := url
			if strings.HasPrefix(browserURL, "http://0.0.0.0:") {
				browserURL = strings.Replace(browserURL, "0.0.0.0", "127.0.0.1", 1)
			}
			if err := openBrowser(browserURL); err != nil {
				log.Printf("自动打开浏览器失败，请手动访问 %s: %v", browserURL, err)
			}
		}()
	}
	if err := server.Serve(ln); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
}

func securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		next.ServeHTTP(w, r)
	})
}

func openBrowser(url string) error {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("rundll32", "url.dll,FileProtocolHandler", url)
	case "darwin":
		cmd = exec.Command("open", url)
	default:
		cmd = exec.Command("xdg-open", url)
	}
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Start()
}
