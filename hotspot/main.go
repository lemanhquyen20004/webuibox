package main

// WebUiBox hotspot daemon for rooted Android. Loopback-only; can be reverse proxied using Access-protected HTTPS Tunnel.
// Limitations: Android 11 binder methods vary across OEM builds; traffic quotas
// count IPv4 iptables packets, and may miss IPv6 or hardware-offloaded flows.
import (
 "crypto/rand"
 "crypto/subtle"
 "encoding/hex"
 "encoding/json"
 "errors"
 "fmt"
 "log"
 "net"
 "net/http"
 "os"
 "os/exec"
 "path/filepath"
 "regexp"
 "strconv"
 "strings"
 "sync"
 "time"
)

const (
 base = "/data/adb/webuibox-private/hotspot"
 chainIn = "WUBX_IN"
 chainOut = "WUBX_OUT"
)
type Client struct {
 IP string `json:"ip"`
 MAC string `json:"mac"`
 Interface string `json:"interface"`
 Upload uint64 `json:"upload"`
 Download uint64 `json:"download"`
 Limit uint64 `json:"limit"`
 Blocked bool `json:"blocked"`
 QuotaReached bool `json:"quota_reached"`
}
type Rule struct {
 IP string `json:"ip"`
 MAC string `json:"mac"`
 Interface string `json:"interface"`
 Limit uint64 `json:"limit"`
 Blocked bool `json:"blocked"`
 QuotaReached bool `json:"quota_reached"`
}
type state struct {
 Rules map[string]Rule `json:"rules"`
}
type Server struct {
 mu sync.Mutex
 state state
 token string
 update updateResult
}
var validMAC=regexp.MustCompile(`(?i)^([0-9a-f]{2}:){5}[0-9a-f]{2}$`)
var validIP=regexp.MustCompile("^[0-9]{1,3}(\\.[0-9]{1,3}){3}$")
var activeIface=regexp.MustCompile("^(ap[0-9]*|swlan[0-9]*|wlan[1-9][0-9]*|softap[0-9]*)$")
func cmd(name string,args ...string)(string,error){
 c:=exec.Command(name,args...);c.Env=[]string{"PATH=/system/bin:/system/xbin:/vendor/bin:/data/adb/magisk"}
 output,err:=c.CombinedOutput()
 if err!=nil{return string(output),fmt.Errorf("%s %v: %w (%s)",name,args,err,strings.TrimSpace(string(output)))}
 return string(output),nil
}
func ipt(args ...string)error{
 _,err:=cmd("/system/bin/iptables",append([]string{"-w","3","-t","mangle"},args...)...)
 return err
}
func iptOutput(args ...string)(string,error){
 return cmd("/system/bin/iptables",append([]string{"-w","3","-t","mangle"},args...)...)
}
func findHotspotInterface()string{
 list,_:=net.Interfaces()
 for _,i:=range list{
  if i.Flags&net.FlagUp==0 {continue}
  if !activeIface.MatchString(i.Name) && i.Name!="wlan0" {continue}
  addrs,err:=i.Addrs();if err!=nil {continue}
  for _,addr:=range addrs{
   ip,network,err:=net.ParseCIDR(addr.String());if err!=nil {continue}
   p:=ip.To4()
   if p==nil || !p.IsPrivate() {continue}
   if i.Name=="wlan0" && !(strings.HasPrefix(p.String(),"192.168.43.")||strings.HasPrefix(p.String(),"192.168.232.")){continue}
   ones,_:=network.Mask.Size()
   if ones<16 || ones>30 {continue}
   return i.Name
  }
 }
 return ""
}
func peers(iface string)[]Client{
 if iface=="" {return []Client{}}
 raw,err:=os.ReadFile("/proc/net/arp");if err!=nil{return []Client{}}
 rows:=strings.Split(string(raw),"\n")
 seen:=map[string]bool{}
 out:=[]Client{}
 for _,row:=range rows[1:]{
  fields:=strings.Fields(row)
  if len(fields)<6 || fields[5]!=iface {continue}
  ip,mac:=fields[0],strings.ToLower(fields[3])
  if !validMAC.MatchString(mac)||!validIP.MatchString(ip)||mac=="00:00:00:00:00:00"||seen[ip] {continue}
  parsed:=net.ParseIP(ip).To4();if parsed==nil {continue}
  flags,_:=strconv.ParseUint(strings.TrimPrefix(fields[2],"0x"),16,16)
  if flags&2==0 {continue}
  seen[ip]=true;out=append(out,Client{IP:ip,MAC:mac,Interface:iface})
 }
 return out
}
func (s *Server)save()error{
 bytes,err:=json.MarshalIndent(s.state,"","  ");if err!=nil{return err}
 temp:=filepath.Join(base,"rules.json.tmp")
 if err=os.WriteFile(temp,bytes,0600);err!=nil{return err}
 return os.Rename(temp,filepath.Join(base,"rules.json"))
}
func (s *Server)ensure(iface string)error{
 if iface=="" {return errors.New("hotspot IPv4 interface not found")}
 for _,chain:=range []string{chainIn,chainOut}{
  if _,err:=iptOutput("-L",chain,"-n");err!=nil {
   if err=ipt("-N",chain);err!=nil{return fmt.Errorf("cannot create %s: %w",chain,err)}
  }
 }
 hooks:=[][]string{
  {"PREROUTING","-i",iface,"-j",chainIn},
  {"POSTROUTING","-o",iface,"-j",chainOut},
 }
 for _,h:=range hooks {
  check:=append([]string{"-C",h[0]},h[1:]...)
  if err:=ipt(check...);err!=nil {
   add:=append([]string{"-I",h[0],"1"},h[1:]...)
   if err=ipt(add...);err!=nil{return fmt.Errorf("cannot hook %s: %w",h[0],err)}
  }
 }
 return nil
}
func ensureRule(chain,flag,ip,target string)error{
 match:=[]string{flag,ip+"/32","-j",target}
 if err:=ipt(append([]string{"-C",chain},match...)...);err==nil{return nil}
 return ipt(append([]string{"-A",chain},match...)...)
}
func removeRule(chain,flag,ip,target string){
 match:=[]string{flag,ip+"/32","-j",target}
 for k:=0;k<4;k++{
  if err:=ipt(append([]string{"-C",chain},match...)...);err!=nil{return}
  if err:=ipt(append([]string{"-D",chain},match...)...);err!=nil{return}
 }
}
func (s *Server)apply(rule Rule)error{
 if err:=s.ensure(rule.Interface);err!=nil{return err}
 for _,t:=range []struct{chain,flag string}{{chainIn,"-s"},{chainOut,"-d"}}{
  if err:=ensureRule(t.chain,t.flag,rule.IP,"RETURN");err!=nil{return err}
  if rule.Blocked||rule.QuotaReached {
   if err:=ensureRule(t.chain,t.flag,rule.IP,"DROP");err!=nil{return err}
   // DROP must precede RETURN. Place new DROP on top, idempotently.
   removeRule(t.chain,t.flag,rule.IP,"DROP")
   args:=[]string{"-I",t.chain,"1",t.flag,rule.IP+"/32","-j","DROP"}
   if err:=ipt(args...);err!=nil{return err}
  }else{
   removeRule(t.chain,t.flag,rule.IP,"DROP")
  }
 }
 return nil
}
func usage(chain,ip string)uint64{
 raw,err:=iptOutput("-L",chain,"-n","-v","-x");if err!=nil{return 0}
 var bytes uint64
 for _,line:=range strings.Split(raw,"\n"){
  f:=strings.Fields(line)
  if len(f)<9 || f[2]!="RETURN" {continue}
  // iptables columns pkts bytes target prot opt in out source destination
  idx:=7;if chain==chainOut{idx=8}
  if len(f)<=idx{continue}
  if f[idx]!=ip && f[idx]!=ip+"/32"{continue}
  n,err:=strconv.ParseUint(f[1],10,64);if err==nil{bytes+=n}
 }
 return bytes
}
func (s *Server)clientStatus()(string,[]Client){
 iface:=findHotspotInterface()
 clients:=peers(iface)
 // Expire device rules if the ARP mapping disappears or changes.
 active:=map[string]string{}
 for _,client:=range clients{active[client.IP]=client.MAC}
 for ip,r:=range s.state.Rules{
  if active[ip]!=r.MAC || iface!=r.Interface{
   removeRule(chainIn,"-s",ip,"DROP")
   removeRule(chainOut,"-d",ip,"DROP")
   removeRule(chainIn,"-s",ip,"RETURN")
   removeRule(chainOut,"-d",ip,"RETURN")
   delete(s.state.Rules,ip)
   _=s.save()
  }
 }
 for i:=range clients{
  c:=&clients[i]
  if r,ok:=s.state.Rules[c.IP];ok && r.MAC==c.MAC && r.Interface==iface{
   c.Limit=r.Limit;c.Blocked=r.Blocked;c.QuotaReached=r.QuotaReached
   c.Upload=usage(chainIn,c.IP);c.Download=usage(chainOut,c.IP)
   if r.Limit>0 && c.Upload+c.Download>=r.Limit && !r.QuotaReached{
    r.QuotaReached=true
    if err:=s.apply(r);err==nil{s.state.Rules[c.IP]=r;_ = s.save();c.QuotaReached=true}else{log.Printf("quota apply failed: %s: %v",c.IP,err)}
   }
  }
 }
 return iface,clients
}
func (s *Server)auth(w http.ResponseWriter,r *http.Request)bool{
 w.Header().Set("Cache-Control","no-store")
 w.Header().Set("X-Content-Type-Options","nosniff")
 w.Header().Set("Referrer-Policy","no-referrer")
 local:=isLocalRequest(r)
 if !local{
  // Remote authorization is fail-closed unless the verified Access
  // team domain and AUD are configured on-device outside the static UI.
  if err:=allowedRemoteAccess(r);err!=nil{
   http.Error(w,"remote Cloudflare Access authentication denied: "+err.Error(),403)
   return false
  }
 }
 origin:=r.Header.Get("Origin")
 if local && origin!=""{
  w.Header().Set("Access-Control-Allow-Origin",origin)
  w.Header().Set("Vary","Origin")
  w.Header().Set("Access-Control-Allow-Methods","GET,POST,OPTIONS")
  w.Header().Set("Access-Control-Allow-Headers","Content-Type,X-WebUiBox-Key")
 }
 if r.Method=="OPTIONS"{
  if !local{http.Error(w,"remote OPTIONS not supported",405)}else{w.WriteHeader(204)}
  return false
 }
 // JWT alone cannot authorize root operations: require separate device key.
 token:=r.Header.Get("X-WebUiBox-Key")
 if subtle.ConstantTimeCompare([]byte(token),[]byte(s.token))!=1{
  http.Error(w,"invalid root backend key",401);return false
 }
 return true
}
func jsonResponse(w http.ResponseWriter,v any){
 w.Header().Set("Content-Type","application/json")
 w.Header().Set("Cache-Control","no-store")
 _=json.NewEncoder(w).Encode(v)
}
func (s *Server)handler(w http.ResponseWriter,r *http.Request){
 if !s.auth(w,r){return}
 s.mu.Lock();defer s.mu.Unlock()
 switch r.URL.Path {
 case "/api/v1/status":
  if r.Method!="GET"{http.Error(w,"method",405);return}
  iface,clients:=s.clientStatus()
  enabled:=iface!=""
  jsonResponse(w,map[string]any{"hotspot_detected":enabled,"interface":iface,"clients":clients,"android_sdk":sdk(),"control_ready":sdk()==30 && fileExists(filepath.Join(base,"allow-android11-binder")),"accounting":"IPv4 iptables (hardware offload/IPv6 not covered)","note":"Beta; device discovery uses ARP and is not a guaranteed complete client list."})
 case "/api/v1/client":
  if r.Method!="POST"{http.Error(w,"method",405);return}
  var input struct{IP string `json:"ip"`;MAC string `json:"mac"`;Blocked bool `json:"blocked"`;LimitMB int64 `json:"limit_mb"`}
  if err:=json.NewDecoder(http.MaxBytesReader(w,r.Body,2048)).Decode(&input);err!=nil{http.Error(w,"invalid json",400);return}
  if input.LimitMB<0||input.LimitMB>1048576{http.Error(w,"invalid quota",400);return}
  iface,clients:=s.clientStatus()
  var chosen *Client
  for i:=range clients {if clients[i].IP==input.IP && strings.EqualFold(clients[i].MAC,input.MAC) {chosen=&clients[i];break}}
  if chosen==nil || iface==""{http.Error(w,"device not found in current hotspot ARP table",409);return}
  old:=s.state.Rules[input.IP]
  if old.MAC!=""&&(old.MAC!=strings.ToLower(input.MAC)||old.Interface!=iface){
   http.Error(w,"client address changed; rules require manual reset",409);return
  }
  rule:=Rule{IP:input.IP,MAC:strings.ToLower(input.MAC),Interface:iface,Blocked:input.Blocked,Limit:uint64(input.LimitMB)*1024*1024}
  // Reconfigure existing counters without claiming lifetime usage.
  if err:=s.apply(rule);err!=nil{http.Error(w,"IPv4 iptables unavailable: "+err.Error(),503);return}
  s.state.Rules[input.IP]=rule;_ = s.save()
  jsonResponse(w,map[string]any{"ok":true,"ip":input.IP,"blocked":input.Blocked,"limit_mb":input.LimitMB,"notice":"IPv4 only; quotas are best effort and reset with iptables counters."})
 case "/api/v1/hotspot":
  if r.Method!="POST"{http.Error(w,"method",405);return}
  var input struct{Enabled bool `json:"enabled"`}
  if err:=json.NewDecoder(http.MaxBytesReader(w,r.Body,1024)).Decode(&input);err!=nil{http.Error(w,"invalid json",400);return}
  if sdk()!=30 || !fileExists(filepath.Join(base,"allow-android11-binder")){
   http.Error(w,"Unsupported by default: require Android 11 and explicit allow-android11-binder file after validating MIUI compatibility",501);return
  }
  transaction:="49";if input.Enabled{transaction="47"}
  result,err:=cmd("/system/bin/service","call","wifi",transaction)
  if err!=nil{http.Error(w,err.Error(),503);return}
  jsonResponse(w,map[string]any{"requested":true,"binder_output":strings.TrimSpace(result),"warning":"Service call result is NOT confirmation. Check actual hotspot state in Android Settings and the next status refresh."})
 default:http.NotFound(w,r)
 }
}
func sdk()int{
 value,_:=cmd("/system/bin/getprop","ro.build.version.sdk");i,_:=strconv.Atoi(strings.TrimSpace(value));return i
}
func fileExists(f string)bool{_,err:=os.Stat(f);return err==nil}
func token()string{
 _=os.MkdirAll(base,0700)
 f:=filepath.Join(base,"access.key")
 old,err:=os.ReadFile(f);if err==nil && len(strings.TrimSpace(string(old)))>=40{return strings.TrimSpace(string(old))}
 buf:=make([]byte,32);if _,err=rand.Read(buf);err!=nil{log.Fatal(err)}
 key:=hex.EncodeToString(buf)
 if err=os.WriteFile(f,[]byte(key+"\n"),0600);err!=nil{log.Fatal(err)}
 return key
}
func main(){
 if len(os.Args)>1 && os.Args[1]=="--gateway"{runGateway();return}
 if len(os.Args)>1 && os.Args[1]!="--root"{log.Fatal("usage: webuibox-hotspot-arm64 [--root|--gateway]")}

 if os.Geteuid()!=0{log.Fatal("WebUiBox hotspot backend must run as root")}
 s:=&Server{state:state{Rules:map[string]Rule{}},token:token()}
 if file,err:=os.ReadFile(filepath.Join(base,"rules.json"));err==nil{
  _=json.Unmarshal(file,&s.state)
  if s.state.Rules==nil{s.state.Rules=map[string]Rule{}}
 }
 // A reboot may leave stale DROP rules if the service process restarts.
 // Flush ONLY our dedicated chains (never Android/Box built-in firewall chains).
 for _,ch:=range []string{chainIn,chainOut}{
  if _,err:=iptOutput("-L",ch,"-n");err==nil{_ = ipt("-F",ch)}
 }
 // Counters are session-only; do not claim persistence after restarting the service.
 s.state.Rules=map[string]Rule{};_ = s.save()
 // Enforce active IPv4 session quotas even when the browser is closed.
 // Reading iptables counters is intentionally limited to once every 5 seconds.
 go func(){
  ticker:=time.NewTicker(5*time.Second);defer ticker.Stop()
  for range ticker.C {
   s.mu.Lock()
   if len(s.state.Rules)>0 {_,_ = s.clientStatus()}
   s.mu.Unlock()
  }
 }()
 runRootUnixServer(s)
}
