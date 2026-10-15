package main
import (
 "encoding/json"
 "net/http/httptest"
 "testing"
)
func TestRemoteRequiresExactHost(t *testing.T){
 for _,host:=range []string{"box.lemanhquyen.io.vn.evil.com","ox.lemanhquyen.io.vn","localhost:9097",""} {
  r:=httptest.NewRequest("GET","http://example.com/api/v1/status",nil)
  r.Host=host;r.Header.Set("Origin",ownerOrigin)
  if allowedRemoteAccess(r)==nil{t.Fatalf("allowed untrusted hostname %q",host)}
 }
}
func TestLocalOriginHost(t *testing.T){
 r:=httptest.NewRequest("GET","http://127.0.0.1:9097/api/v1/status",nil)
 if !isLocalRequest(r){t.Fatal("localhost rejected")}
 r.Header.Set("Origin","https://evil.example")
 if isLocalRequest(r){t.Fatal("cross origin accepted")}
 r.Header.Set("Origin",ownerOrigin)
 if isLocalRequest(r){t.Fatal("remote origin accepted locally")}
}
func TestAccessAudience(t *testing.T){
 arr,_:=json.Marshal([]string{"first","correct-aud"})
 if !audienceContains(arr,"correct-aud"){t.Fatal("audience not found")}
 if audienceContains(arr,"not-accepted"){t.Fatal("extra audience accepted")}
}
func TestAccessJWTMissing(t *testing.T){
 if verifyAccessJWT("",accessConfiguration{})==nil{t.Fatal("missing JWT accepted")}
}
