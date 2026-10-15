package main

// A single localhost HTTP entrypoint for Cloudflare Tunnel.
// Root-only HTTP endpoints are forwarded over a permission-restricted Unix
// socket; Mihomo traffic is proxied to its existing 127.0.0.1:9090 listener.
// No privileged HTTP/TCP listener is exposed.
import (
 "context"
 "errors"
 "log"
 "net"
 "net/http"
 "net/http/httputil"
 "net/url"
 "os"
 "strings"
 "time"
)

const (
 gatewayAddress="127.0.0.1:9098"
 rootSocket="/data/adb/webuibox-private/hotspot/root-api.sock"
 mihomoAddress="http://127.0.0.1:9090"
)

func rootTransport() *http.Transport {
 return &http.Transport{
  DisableKeepAlives:true,
  MaxIdleConns:2,
  DialContext:func(ctx context.Context, network, address string)(net.Conn,error){
   d:=&net.Dialer{Timeout:3*time.Second}
   return d.DialContext(ctx,"unix",rootSocket)
  },
 }
}
func newGatewayHandler() http.Handler {
 target,_:=url.Parse(mihomoAddress)
 mihomo:=httputil.NewSingleHostReverseProxy(target)
 mihomo.ErrorHandler=func(w http.ResponseWriter,r *http.Request,err error){
  http.Error(w,"Mihomo not reachable on 127.0.0.1:9090",http.StatusBadGateway)
 }
 mihomo.ModifyResponse=func(resp *http.Response)error{
  // Prevent browser-caching stale Box metrics / version manifests.
  if strings.HasPrefix(resp.Request.URL.Path,"/ui/box-status.json") ||
   strings.HasPrefix(resp.Request.URL.Path,"/ui/update.json"){
   resp.Header.Set("Cache-Control","no-store")
  }
  return nil
 }
 rootURL,_:=url.Parse("http://root.internal")
 root:=httputil.NewSingleHostReverseProxy(rootURL)
 root.Transport=rootTransport()
 root.ErrorHandler=func(w http.ResponseWriter,r *http.Request,err error){
  http.Error(w,"Root Magisk service unavailable: Unix socket not ready",http.StatusServiceUnavailable)
 }
 return http.HandlerFunc(func(w http.ResponseWriter,r *http.Request){
  w.Header().Set("X-Content-Type-Options","nosniff")
  w.Header().Set("Referrer-Policy","no-referrer")
  // A direct localhost request can access the Mihomo UI without Cloudflare,
  // but privileged operations still require the independent device key.
  // All requests for the public owner hostname require a SIGNED Access JWT,
  // even static HTML and ordinary Mihomo API/WebSocket traffic.
  if !isLocalRequest(r){
   if err:=allowedRemoteAccess(r);err!=nil{
    http.Error(w,"Cloudflare Access verification required: "+err.Error(),403)
    return
   }
  }
  if r.URL.Path=="/api/v1" || strings.HasPrefix(r.URL.Path,"/api/v1/"){
   w.Header().Set("Cache-Control","no-store")
   if r.URL.Path=="/api/v1"{http.NotFound(w,r);return}
   // The root service repeats its own authorization check on the socket.
   // Any arbitrary browser path is NOT a privileged API route.
   root.ServeHTTP(w,r)
   return
  }
  // Never forward the root service key to Mihomo or to WebUI static assets.
  r.Header.Del("X-WebUiBox-Key")
  // Ordinary controller requests, static UI and websocket events all go to
  // the existing Mihomo server. Its own API secret remains effective.
  mihomo.ServeHTTP(w,r)
 })
}
func runGateway() {
 listener,err:=net.Listen("tcp",gatewayAddress)
 if err!=nil{log.Fatalf("WebUiBox gateway listen %s: %v",gatewayAddress,err)}
 // Confirm OS did not silently bind the listener to a LAN address.
 addr:=listener.Addr().(*net.TCPAddr)
 if !addr.IP.IsLoopback(){listener.Close();log.Fatal("Gateway must listen on loopback")}
 defer listener.Close()
 srv:=&http.Server{
  Handler:newGatewayHandler(),
  ReadHeaderTimeout:8*time.Second,
  IdleTimeout:65*time.Second,
  MaxHeaderBytes:32768,
 }
 log.Printf("WebUiBox secure gateway %s: /api/v1/ -> Unix socket, rest -> Mihomo",gatewayAddress)
 if err=srv.Serve(listener);err!=nil && !errors.Is(err,http.ErrServerClosed){log.Fatal(err)}
}
func runRootUnixServer(s *Server){
 if err:=os.MkdirAll(base,0700);err!=nil{log.Fatalf("Root private directory: %v",err)}
 if err:=os.Chmod(base,0700);err!=nil{log.Fatal(err)}
 // Only delete a stale socket if there is no responsive daemon already there.
 if st,err:=os.Lstat(rootSocket);err==nil{
  if st.Mode()&os.ModeSocket==0{log.Fatal("Refusing to replace non-socket at root-api.sock")}
  conn,err:=net.DialTimeout("unix",rootSocket,1200*time.Millisecond)
  if err==nil{conn.Close();log.Fatal("Root Unix daemon already running")}
  if err:=os.Remove(rootSocket);err!=nil{log.Fatal(err)}
 }
 listener,err:=net.Listen("unix",rootSocket)
 if err!=nil{log.Fatal(err)}
 if err=os.Chmod(rootSocket,0600);err!=nil{listener.Close();log.Fatal(err)}
 defer func(){listener.Close();os.Remove(rootSocket)}()
 mux:=http.NewServeMux()
 mux.HandleFunc("/api/v1/update/",s.updaterHandler)
 mux.HandleFunc("/api/v1/",s.handler)
 server:=&http.Server{Handler:mux,ReadHeaderTimeout:5*time.Second,ReadTimeout:15*time.Second,WriteTimeout:20*time.Second,IdleTimeout:30*time.Second}
 log.Printf("WebUiBox root backend on private Unix socket %s",rootSocket)
 if err=server.Serve(listener);err!=nil && !errors.Is(err,http.ErrServerClosed){log.Fatal(err)}
}
