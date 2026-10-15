package main
import("testing";"net/http/httptest")
func TestValidMAC(t *testing.T){
 if !validMAC.MatchString("00:11:22:aa:bb:cc"){t.Fatal("valid")}
 if validMAC.MatchString("zz:zz:zz:zz:zz:zz"){t.Fatal("invalid")}
}
func TestInterface(t *testing.T){
 if !activeIface.MatchString("ap0") || !activeIface.MatchString("swlan0"){t.Fatal("interface")}
 if activeIface.MatchString("rmnet_data0"){t.Fatal("not hotspot")}
}

func TestOwnerHTTPSOriginAuth(t *testing.T){
 server:=&Server{token:"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}
 cases:=[]struct{origin string;expected int}{
  {"https://ox.lemanhquyen.io.vn",204},
  {"http://127.0.0.1:9090",204},
  {"https://evil.example",403},
  {"http://ox.lemanhquyen.io.vn",403},
 }
 for _,c:=range cases{
  req:=httptest.NewRequest("OPTIONS","http://127.0.0.1:9097/api/v1/status",nil)
  req.Header.Set("Origin",c.origin)
  rec:=httptest.NewRecorder()
  server.auth(rec,req)
  if rec.Code!=c.expected{t.Errorf("%s got %d wanted %d",c.origin,rec.Code,c.expected)}
  if rec.Header().Get("Access-Control-Allow-Origin")=="*"{t.Fatal("wildcard CORS")}
 }
 req:=httptest.NewRequest("GET","http://127.0.0.1:9097/api/v1/status",nil)
 req.Header.Set("Origin","https://ox.lemanhquyen.io.vn")
 req.Header.Set("X-WebUiBox-Key","incorrect")
 rec:=httptest.NewRecorder()
 if server.auth(rec,req)||rec.Code!=401{t.Fatal("key required on custom HTTPS domain")}
}
