package main

import (
 "net/http/httptest"
 "testing"
)
func TestValidMAC(t *testing.T){
 if !validMAC.MatchString("00:11:22:aa:bb:cc"){t.Fatal("valid")}
 if validMAC.MatchString("zz:zz:zz:zz:zz:zz"){t.Fatal("invalid")}
}
func TestInterface(t *testing.T){
 if !activeIface.MatchString("ap0") || !activeIface.MatchString("swlan0"){t.Fatal("interface")}
 if activeIface.MatchString("rmnet_data0"){t.Fatal("not hotspot")}
}
func TestLocalPreflightAndKey(t *testing.T){
 server:=&Server{token:"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}
 req:=httptest.NewRequest("OPTIONS","http://127.0.0.1:9098/api/v1/status",nil)
 req.Header.Set("Origin","http://127.0.0.1:9098")
 rec:=httptest.NewRecorder()
 server.auth(rec,req)
 if rec.Code!=204{t.Fatalf("local OPTIONS got %d, want 204",rec.Code)}
 if rec.Header().Get("Access-Control-Allow-Origin")=="*"{t.Fatal("wildcard CORS")}
 req2:=httptest.NewRequest("GET","http://127.0.0.1:9098/api/v1/status",nil)
 req2.Header.Set("Origin","http://127.0.0.1:9098")
 req2.Header.Set("X-WebUiBox-Key","incorrect")
 rec2:=httptest.NewRecorder()
 if server.auth(rec2,req2)||rec2.Code!=401{t.Fatal("local root API did not require correct key")}
}
func TestRemoteRequiresAccessJWTBeforeDeviceKey(t *testing.T){
 server:=&Server{token:"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}
 for _,origin:=range []string{"https://box.lemanhquyen.io.vn","https://evil.example",""}{
  req:=httptest.NewRequest("GET","http://box.lemanhquyen.io.vn/api/v1/status",nil)
  req.Header.Set("Origin",origin)
  req.Header.Set("X-WebUiBox-Key",server.token)
  rec:=httptest.NewRecorder()
  if server.auth(rec,req)||rec.Code!=403{t.Fatalf("remote %q allowed without valid signed JWT: HTTP %d",origin,rec.Code)}
 }
}
