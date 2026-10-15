package main

import (
 "crypto"
 "crypto/rand"
 "crypto/rsa"
 "crypto/sha256"
 "encoding/base64"
 "encoding/json"
 "net/http/httptest"
 "strings"
 "testing"
 "time"
)
func TestRemoteRequiresExactHost(t *testing.T){
 for _,host:=range []string{"box.lemanhquyen.io.vn.evil.com","ox.lemanhquyen.io.vn","localhost:9098",""} {
  r:=httptest.NewRequest("GET","http://example.com/api/v1/status",nil)
  r.Host=host;r.Header.Set("Origin",ownerOrigin)
  if allowedRemoteAccess(r)==nil{t.Fatalf("allowed untrusted hostname %q",host)}
 }
}
func TestLocalOriginHost(t *testing.T){
 r:=httptest.NewRequest("GET","http://127.0.0.1:9098/api/v1/status",nil)
 if !isLocalRequest(r){t.Fatal("localhost rejected")}
 r.Header.Set("Origin","https://evil.example")
 if isLocalRequest(r){t.Fatal("cross origin accepted")}
 r.Header.Set("Origin","http://127.0.0.1:9098")
 if !isLocalRequest(r){t.Fatal("gateway same origin rejected")}
 r.Header.Set("Origin",ownerOrigin)
 if isLocalRequest(r){t.Fatal("remote origin accepted locally")}
 r.Header.Del("Origin")
 r.Header.Set("Cf-Connecting-Ip","198.51.100.13")
 if isLocalRequest(r){t.Fatal("proxied localhost Host bypassed Access JWT")}
}
func TestAccessAudience(t *testing.T){
 arr,_:=json.Marshal([]string{"first","correct-aud"})
 if !audienceContains(arr,"correct-aud"){t.Fatal("audience not found")}
 if audienceContains(arr,"not-accepted"){t.Fatal("extra audience accepted")}
}
func TestAccessJWTMissing(t *testing.T){
 if verifyAccessJWT("",accessConfiguration{})==nil{t.Fatal("missing JWT accepted")}
}
func TestSignedAccessJWT(t *testing.T){
 key,err:=rsa.GenerateKey(rand.Reader,2048)
 if err!=nil{t.Fatal(err)}
 cfg:=accessConfiguration{TeamDomain:"test-team.cloudflareaccess.com",Audience:strings.Repeat("a",64)}
 jwkCache.Lock()
 jwkCache.Team=cfg.TeamDomain
 jwkCache.Until=time.Now().Add(10*time.Minute)
 jwkCache.Keys=map[string]*rsa.PublicKey{"test-key":&key.PublicKey}
 jwkCache.Unlock()
 head,_:=json.Marshal(map[string]any{"alg":"RS256","kid":"test-key"})
 body,_:=json.Marshal(map[string]any{
  "iss":"https://"+cfg.TeamDomain,"aud":[]string{cfg.Audience},
  "exp":time.Now().Add(time.Hour).Unix(),
  "nbf":time.Now().Add(-time.Minute).Unix(),
  "iat":time.Now().Add(-time.Minute).Unix(),
 })
 prefix:=base64.RawURLEncoding.EncodeToString(head)+"."+base64.RawURLEncoding.EncodeToString(body)
 hashed:=sha256.Sum256([]byte(prefix))
 sig,err:=rsa.SignPKCS1v15(rand.Reader,key,crypto.SHA256,hashed[:]);if err!=nil{t.Fatal(err)}
 token:=prefix+"."+base64.RawURLEncoding.EncodeToString(sig)
 if err:=verifyAccessJWT(token,cfg);err!=nil{t.Fatalf("valid signed JWT rejected: %v",err)}
 bad:=cfg;bad.Audience=strings.Repeat("b",64)
 if verifyAccessJWT(token,bad)==nil{t.Fatal("wrong Access audience accepted")}
 badSig:=append([]byte(nil),sig...)
 badSig[0]^=0x01 // Alter an actual signed byte, never unused base64 padding bits.
 tampered:=prefix+"."+base64.RawURLEncoding.EncodeToString(badSig)
 if verifyAccessJWT(tampered,cfg)==nil{t.Fatal("tampered signature accepted")}
}
