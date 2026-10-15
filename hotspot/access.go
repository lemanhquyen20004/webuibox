package main

// Cloudflare Access JWT authentication for a protected, exact-match owner domain.
// A public Tunnel route is NOT sufficient authorization for a root API.
// Remote requests require BOTH a valid RS256 Cloudflare Access JWT and the
// independent random X-WebUiBox-Key. Local requests still require the key.
import (
 "crypto"
 "crypto/rsa"
 "crypto/sha256"
 "encoding/base64"
 "encoding/json"
 "errors"
 "fmt"
 "io"
 "math/big"
 "net/http"
 "os"
 "regexp"
 "strings"
 "sync"
 "time"
)
const ownerHostname="box.lemanhquyen.io.vn"
const ownerOrigin="https://box.lemanhquyen.io.vn"
const remoteAccessConfig="/data/adb/webuibox-private/hotspot/remote-access.json"

type accessConfiguration struct {
 TeamDomain string `json:"team_domain"`
 Audience string `json:"aud"`
}
type accessJWTHeader struct {
 Alg string `json:"alg"`
 Kid string `json:"kid"`
}
type accessJWTClaims struct {
 Iss string `json:"iss"`
 Aud json.RawMessage `json:"aud"`
 Exp int64 `json:"exp"`
 Nbf int64 `json:"nbf"`
 Iat int64 `json:"iat"`
}
type cloudflareJWK struct{
 Kid string `json:"kid"`
 Kty string `json:"kty"`
 Alg string `json:"alg"`
 N string `json:"n"`
 E string `json:"e"`
}
var teamDomainRE=regexp.MustCompile("^[a-z0-9-]{1,63}\\.cloudflareaccess\\.com$")
var audienceRE=regexp.MustCompile("^[A-Za-z0-9_-]{32,128}$")
var jwkCache=struct{
 sync.Mutex
 Team string
 Until time.Time
 Keys map[string]*rsa.PublicKey
}{}
var accessClient=&http.Client{
 Timeout:8*time.Second,
 CheckRedirect:func(req *http.Request,via []*http.Request)error{return errors.New("unexpected Access JWKS redirect")},
}

func loadAccessConfiguration()(accessConfiguration,error){
 raw,err:=os.ReadFile(remoteAccessConfig)
 if err!=nil{return accessConfiguration{},errors.New("remote Access verification not configured")}
 if len(raw)>4096{return accessConfiguration{},errors.New("Access configuration too large")}
 var cfg accessConfiguration
 if err=json.Unmarshal(raw,&cfg);err!=nil{return cfg,errors.New("invalid remote Access JSON")}
 cfg.TeamDomain=strings.ToLower(strings.TrimSpace(cfg.TeamDomain))
 cfg.Audience=strings.TrimSpace(cfg.Audience)
 if !teamDomainRE.MatchString(cfg.TeamDomain)||!audienceRE.MatchString(cfg.Audience){
  return cfg,errors.New("invalid Cloudflare Access team domain or application audience")
 }
 return cfg,nil
}
func jwksForTeam(team string)(map[string]*rsa.PublicKey,error){
 jwkCache.Lock()
 defer jwkCache.Unlock()
 if jwkCache.Team==team && time.Now().Before(jwkCache.Until) && len(jwkCache.Keys)>0{
  return jwkCache.Keys,nil
 }
 // The team-domain value is strictly validated before concatenating this URL.
 res,err:=accessClient.Get("https://"+team+"/cdn-cgi/access/certs")
 if err!=nil{return nil,fmt.Errorf("cannot refresh Access keys: %w",err)}
 defer res.Body.Close()
 if res.StatusCode!=http.StatusOK{return nil,fmt.Errorf("Access certs HTTP %d",res.StatusCode)}
 var obj struct{Keys []cloudflareJWK `json:"keys"`}
 body,err:=io.ReadAll(io.LimitReader(res.Body,131073))
 if err!=nil || len(body)>131072{return nil,errors.New("invalid Access JWKS body")}
 if err=json.Unmarshal(body,&obj);err!=nil{return nil,errors.New("invalid Access JWKS JSON")}
 keys:=map[string]*rsa.PublicKey{}
 for _,key:=range obj.Keys{
  if key.Kty!="RSA" || key.Kid=="" || (key.Alg!="" && key.Alg!="RS256"){continue}
  n,errN:=base64.RawURLEncoding.DecodeString(key.N)
  e,errE:=base64.RawURLEncoding.DecodeString(key.E)
  if errN!=nil||errE!=nil||len(n)<256||len(n)>1024||len(e)>4||len(e)==0{continue}
  exponent:=new(big.Int).SetBytes(e)
  if !exponent.IsInt64() || exponent.Int64()<3 || exponent.Int64()>2147483647 || exponent.Int64()%2==0{continue}
  pub:=&rsa.PublicKey{N:new(big.Int).SetBytes(n),E:int(exponent.Int64())}
  if pub.N.BitLen()<2048{continue}
  keys[key.Kid]=pub
 }
 if len(keys)==0{return nil,errors.New("no usable RSA signing key")}
 jwkCache.Team=team;jwkCache.Until=time.Now().Add(15*time.Minute);jwkCache.Keys=keys
 return keys,nil
}
func audienceContains(raw json.RawMessage,want string)bool{
 var one string
 if json.Unmarshal(raw,&one)==nil{return one==want}
 var several []string
 if json.Unmarshal(raw,&several)!=nil{return false}
 for _,v:=range several{if v==want{return true}}
 return false
}
func verifyAccessJWT(token string,cfg accessConfiguration)error{
 if len(token)>16384 || len(token)<60{return errors.New("missing or oversized Access JWT")}
 parts:=strings.Split(token,".")
 if len(parts)!=3{return errors.New("invalid Access JWT format")}
 hdr,err:=base64.RawURLEncoding.DecodeString(parts[0]);if err!=nil{return errors.New("invalid JWT header")}
 payload,err:=base64.RawURLEncoding.DecodeString(parts[1]);if err!=nil{return errors.New("invalid JWT payload")}
 signature,err:=base64.RawURLEncoding.DecodeString(parts[2]);if err!=nil{return errors.New("invalid JWT signature")}
 if len(hdr)>4096||len(payload)>8192{return errors.New("JWT body too large")}
 var h accessJWTHeader
 var c accessJWTClaims
 if json.Unmarshal(hdr,&h)!=nil || h.Alg!="RS256" || h.Kid==""{return errors.New("Access JWT must use RS256")}
 if json.Unmarshal(payload,&c)!=nil{return errors.New("invalid Access JWT claims")}
 now:=time.Now().Unix()
 if c.Iss!="https://"+cfg.TeamDomain || !audienceContains(c.Aud,cfg.Audience) || c.Exp<=now || c.Exp>now+86400*31 || c.Nbf>now+30 || c.Iat>now+30{
  return errors.New("Access JWT issuer, audience or expiry invalid")
 }
 keys,err:=jwksForTeam(cfg.TeamDomain);if err!=nil{return err}
 key:=keys[h.Kid];if key==nil{return errors.New("unrecognized Access JWT signing key")}
 signed:=sha256.Sum256([]byte(parts[0]+"."+parts[1]))
 if err=rsa.VerifyPKCS1v15(key,crypto.SHA256,signed[:],signature);err!=nil{
  return errors.New("Access JWT signature invalid")
 }
 return nil
}
func allowedRemoteAccess(r *http.Request)error{
 // The HTTP Host must stay unchanged in Tunnel's HTTP Host Header settings.
 if r.Host!=ownerHostname{return errors.New("remote host not allowed")}
 origin:=r.Header.Get("Origin")
 if origin!=""&&origin!=ownerOrigin{return errors.New("remote origin not allowed")}
 cfg,err:=loadAccessConfiguration()
 if err!=nil{return err}
 if err=verifyAccessJWT(r.Header.Get("Cf-Access-Jwt-Assertion"),cfg);err!=nil{return err}
 return nil
}
func isLocalRequest(r *http.Request)bool{
 // Host is checked exactly; no untrusted X-Forwarded-* header is relied upon.
 if r.Host!="127.0.0.1:9098" && r.Host!="localhost:9098"{return false}
 // Reject requests with proxy headers, even if Tunnel origin mistakenly rewrites
 // Host to localhost. This prevents silently downgrading remote JWT checks.
 for _,header:=range []string{"Cf-Connecting-Ip","Cf-Ray","X-Forwarded-For","X-Forwarded-Proto","Forwarded"}{
  if r.Header.Get(header)!=""{return false}
 }
 origin:=r.Header.Get("Origin")
 return origin==""||origin=="http://127.0.0.1:9090"||origin=="http://localhost:9090"
}
