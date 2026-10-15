package main

// Updates only WebUiBox files from its fixed, official GitHub Release path.
// Never accepts caller-supplied URLs or commands. It does not touch Box config,
// subscriptions or iptables. A secret key and an explicit user confirmation
// from the local UI are required before starting an update.
import (
 "archive/zip"
 "context"
 "log"
 "os/exec"
 "bytes"
 "crypto/sha256"
 "encoding/hex"
 "encoding/json"
 "errors"
 "fmt"
 "io"
 "net/http"
 "os"
 "path/filepath"
 "regexp"
 "strconv"
 "strings"
 "time"
)

const (
 uiRoot="/data/adb/box/clash/webuibox"
 uiParent="/data/adb/box/clash"
 remoteManifest="https://raw.githubusercontent.com/lemanhquyen20004/webuibox/main/update.json"
 releaseBase="https://github.com/lemanhquyen20004/webuibox/releases/download/v"
)
var safeVersion=regexp.MustCompile("^[0-9]+\\.[0-9]+\\.[0-9]+$")
var safeSha=regexp.MustCompile("^[0-9a-f]{64}$")
var updateClient=&http.Client{Timeout:90*time.Second}
var updateFiles=[]string{
 "index.html", "app.js", "styles.css", "hotspot.js", "updater-ui.js", "update.json", "box-status.json",
 "bridge/box-status.sh", "scripts/install.sh", "scripts/update.sh",
 "scripts/enable-hotspot.sh", "scripts/disable-hotspot.sh",
 "hotspot/webuibox-hotspot-arm64",
 "LICENSE", "README.md", "README_vi.md", "package.json",
}

type releaseManifest struct {Version string `json:"version"`}
type updateResult struct {
 Running bool `json:"running"`
 Stage string `json:"stage"`
 Version string `json:"version"`
 Error string `json:"error,omitempty"`
 Complete bool `json:"complete"`
 Backup string `json:"backup,omitempty"`
}
func versionParts(v string)([]int,error){
 if !safeVersion.MatchString(v){return nil,fmt.Errorf("unsafe version")}
 parts:=strings.Split(v,".")
 nums:=make([]int,3)
 for i,p:=range parts{
  n,e:=strconv.Atoi(p)
  if e!=nil||n<0||n>999999{return nil,fmt.Errorf("invalid version")}
  nums[i]=n
 }
 return nums,nil
}
func newer(next,current string)bool{
 a,err:=versionParts(next);if err!=nil{return false}
 b,err:=versionParts(current);if err!=nil{return false}
 for i:=0;i<3;i++{if a[i]!=b[i]{return a[i]>b[i]}}
 return false
}
func readVersion(path string)(string,error){
 data,err:=os.ReadFile(path);if err!=nil{return "",err}
 var m releaseManifest
 if err=json.Unmarshal(data,&m);err!=nil{return "",err}
 if !safeVersion.MatchString(m.Version){return "",errors.New("bad manifest version")}
 return m.Version,nil
}
func getLimited(url string,limit int64)([]byte,error){
 if !strings.HasPrefix(url,"https://"){return nil,errors.New("only HTTPS allowed")}
 req,err:=http.NewRequest("GET",url,nil);if err!=nil{return nil,err}
 req.Header.Set("User-Agent","WebUiBox-Updater/0.0.7")
 res,err:=updateClient.Do(req);if err!=nil{return nil,err}
 defer res.Body.Close()
 if res.StatusCode!=200{return nil,fmt.Errorf("GitHub HTTP %d",res.StatusCode)}
 if res.ContentLength>limit{return nil,errors.New("release file too large")}
 data,err:=io.ReadAll(io.LimitReader(res.Body,limit+1))
 if err!=nil{return nil,err}
 if int64(len(data))>limit{return nil,errors.New("release file too large")}
 return data,nil
}
func currentRemote() (string,error) {
 b,err:=getLimited(remoteManifest,64<<10);if err!=nil{return "",err}
 var m releaseManifest
 if err=json.Unmarshal(b,&m);err!=nil{return "",err}
 if !safeVersion.MatchString(m.Version){return "",errors.New("invalid GitHub manifest")}
 return m.Version,nil
}
func packageFor(version string)([]byte,error){
 if !safeVersion.MatchString(version){return nil,errors.New("unsafe release version")}
 filename:="webuibox-v"+version+".zip"
 url:=releaseBase+version+"/"+filename
 payload,err:=getLimited(url,32<<20);if err!=nil{return nil,err}
 checksum,err:=getLimited(url+".sha256",4096);if err!=nil{return nil,err}
 f:=strings.Fields(string(checksum))
 if len(f)!=2 || !safeSha.MatchString(f[0]) || f[1]!=filename{
  return nil,errors.New("malformed SHA256 checksum asset")
 }
 actual:=sha256.Sum256(payload)
 if hex.EncodeToString(actual[:])!=f[0] {return nil,errors.New("release SHA256 mismatch")}
 return payload,nil
}
func unpackRelease(data []byte,dir,version string)error{
 reader,err:=zip.NewReader(bytes.NewReader(data),int64(len(data)))
 if err!=nil{return err}
 wanted:=map[string]bool{}
 for _,f:=range updateFiles{wanted[f]=true}
 found:=map[string]bool{}
 var total int64
 for _,f:=range reader.File{
  name:=f.Name
  if f.FileInfo().IsDir() || !wanted[name] {continue}
  if found[name]{return fmt.Errorf("duplicate archive entry: %s",name)}
  if !f.Mode().IsRegular(){return fmt.Errorf("invalid archive entry type: %s",name)}
  if f.UncompressedSize64>16<<20{return fmt.Errorf("file oversized: %s",name)}
  total+=int64(f.UncompressedSize64)
  if total>64<<20{return errors.New("unpacked archive too large")}
  target:=filepath.Join(dir,filepath.FromSlash(name))
  if err=os.MkdirAll(filepath.Dir(target),0755);err!=nil{return err}
  rf,err:=f.Open();if err!=nil{return err}
  of,err:=os.OpenFile(target,os.O_CREATE|os.O_EXCL|os.O_WRONLY,0644)
  if err!=nil{rf.Close();return err}
  n,copyErr:=io.Copy(of,io.LimitReader(rf,int64(f.UncompressedSize64)+1))
  rf.Close()
  closeErr:=of.Close()
  if copyErr!=nil{return copyErr}
  if closeErr!=nil{return closeErr}
  if n!=int64(f.UncompressedSize64){return errors.New("unexpected extracted file length")}
  found[name]=true
 }
 for _,f:=range updateFiles{if !found[f]{return fmt.Errorf("missing signed release file: %s",f)}}
 actual,err:=readVersion(filepath.Join(dir,"update.json"))
 if err!=nil || actual!=version{return fmt.Errorf("archive version mismatch")}
 for _,f:=range []string{"bridge/box-status.sh","scripts/install.sh","scripts/update.sh","scripts/enable-hotspot.sh","scripts/disable-hotspot.sh","hotspot/webuibox-hotspot-arm64"}{
  if err=os.Chmod(filepath.Join(dir,f),0755);err!=nil{return err}
 }
 return nil
}
func installRelease(next string)(string,error){
 current,err:=readVersion(filepath.Join(uiRoot,"update.json"))
 if err!=nil{return "",fmt.Errorf("cannot read installed version: %w",err)}
 if !newer(next,current){return "",errors.New("requested version is not newer")}
 available,err:=currentRemote()
 if err!=nil{return "",err}
 if next!=available{return "",errors.New("GitHub latest version changed; check again")}
 bytes,err:=packageFor(next);if err!=nil{return "",err}
 // A staged directory is on the same filesystem as current UI, so rename
 // operations do not partly overwrite live files.
 stage,err:=os.MkdirTemp(uiParent,".webuibox-update-")
 if err!=nil{return "",err}
 defer os.RemoveAll(stage)
 if err=unpackRelease(bytes,stage,next);err!=nil{return "",err}
 // Each release includes a non-device-specific box-status.json placeholder.
 // Preserve a validated live snapshot during the atomic directory swap.
 statusPath:=filepath.Join(uiRoot,"box-status.json")
 if stat,statErr:=os.Lstat(statusPath);statErr==nil && stat.Mode().IsRegular() && stat.Size()<8192{
  if state,readErr:=os.ReadFile(statusPath);readErr==nil && json.Valid(state){
   _=os.WriteFile(filepath.Join(stage,"box-status.json"),state,0644)
  }
 }
 backup:=filepath.Join(uiParent,fmt.Sprintf("webuibox.backup-%d",time.Now().Unix()))
 if err=os.Rename(uiRoot,backup);err!=nil{return "",err}
 if err=os.Rename(stage,uiRoot);err!=nil{
  if revert:=os.Rename(backup,uiRoot);revert!=nil{return backup,fmt.Errorf("install failed; restore from %s: %w",backup,revert)}
  return "",fmt.Errorf("install failed and old UI restored: %w",err)
 }
 // Preserve the user's previous explicit Root Backend opt-in across upgrades.
 // Update the on-boot launcher so the new binary starts BOTH the private
 // Unix service and the localhost gateway after the next Android reboot.
 if _,statErr:=os.Stat("/data/adb/service.d/webuibox-hotspot.sh");statErr==nil{
  launcher:=filepath.Join(uiRoot,"scripts/enable-hotspot.sh")
  ctx,cancel:=context.WithTimeout(context.Background(),8*time.Second)
  out,runErr:=exec.CommandContext(ctx,"/system/bin/sh",launcher).CombinedOutput()
  cancel()
  if runErr!=nil{log.Printf("WebUiBox gateway service migration failed (reboot may need manual setup): %v, %s",runErr,strings.TrimSpace(string(out)))}
 }
 // Restore the independent Box metadata bridge whenever the UI is upgraded.
 // Its service.d entry survives reboots; --once regenerates the JSON now.
 if err:=refreshBoxBridge();err!=nil{
  log.Printf("WebUiBox: metadata repair warning after upgrade: %v",err)
 }
 // Root backend keeps the previously loaded binary until the next reboot.
 return backup,nil
}
func refreshBoxBridge()error{
 script:=filepath.Join(uiRoot,"bridge/box-status.sh")
 launcher:="#!/system/bin/sh\n/system/bin/sh /data/adb/box/clash/webuibox/bridge/box-status.sh >/dev/null 2>&1 &\n"
 if err:=os.MkdirAll("/data/adb/service.d",0755);err==nil{
  if err=os.WriteFile("/data/adb/service.d/webuibox-status.sh",[]byte(launcher),0755);err!=nil{
   log.Printf("WebUiBox: cannot repair service.d entry: %v",err)
  }
 }
 ctx,cancel:=context.WithTimeout(context.Background(),8*time.Second)
 defer cancel()
 out,err:=exec.CommandContext(ctx,"/system/bin/sh",script,"--once").CombinedOutput()
 if err!=nil{return fmt.Errorf("status regeneration failed: %w (%s)",err,strings.TrimSpace(string(out)))}
 // A detached script exits immediately when a bridge process is already alive.
 cmd:=exec.Command("/system/bin/sh",script)
 cmd.Stdin=nil;cmd.Stdout=io.Discard;cmd.Stderr=io.Discard
 if err=cmd.Start();err!=nil{return fmt.Errorf("cannot start metadata bridge: %w",err)}
 _=cmd.Process.Release()
 return nil
}
func (s *Server)updateStage(stage string){
 s.mu.Lock();s.update.Stage=stage;s.mu.Unlock()
}
func (s *Server)runUpdate(next string){
 backup,err:=installRelease(next)
 s.mu.Lock()
 s.update.Running=false
 s.update.Complete=(err==nil)
 s.update.Backup=backup
 if err!=nil{s.update.Error=err.Error();s.update.Stage="failed"}else{s.update.Stage="installed"}
 s.mu.Unlock()
}
func (s *Server)updaterHandler(w http.ResponseWriter,r *http.Request){
 if !s.auth(w,r){return}
 switch r.URL.Path {
 case "/api/v1/update/repair-bridge":
  if r.Method!="POST"{http.Error(w,"method",405);return}
  if err:=refreshBoxBridge();err!=nil{
   http.Error(w,"bridge repair failed: "+err.Error(),503);return
  }
  jsonResponse(w,map[string]any{"ok":true,"status_file":"/ui/box-status.json","message":"Box metrics refreshed; service.d bridge launcher repaired"})
 case "/api/v1/update/status":
  if r.Method!="GET"{http.Error(w,"method",405);return}
  s.mu.Lock();status:=s.update;s.mu.Unlock()
  installed,err:=readVersion(filepath.Join(uiRoot,"update.json"))
  if err!=nil{http.Error(w,"installed manifest unavailable",503);return}
  jsonResponse(w,map[string]any{"installed":installed,"update":status})
 case "/api/v1/update/install":
  if r.Method!="POST"{http.Error(w,"method",405);return}
  var input struct{Version string `json:"version"`}
  if err:=json.NewDecoder(http.MaxBytesReader(w,r.Body,512)).Decode(&input);err!=nil{http.Error(w,"invalid input",400);return}
  if !safeVersion.MatchString(input.Version){http.Error(w,"invalid version",400);return}
  installed,err:=readVersion(filepath.Join(uiRoot,"update.json"))
  if err!=nil{http.Error(w,"installed version unavailable",503);return}
  if !newer(input.Version,installed){http.Error(w,"version is not newer",409);return}
  s.mu.Lock()
  if s.update.Running{s.mu.Unlock();http.Error(w,"already updating",409);return}
  s.update=updateResult{Running:true,Stage:"downloading and checking signed checksum",Version:input.Version}
  s.mu.Unlock()
  go s.runUpdate(input.Version)
  jsonResponse(w,map[string]any{"accepted":true,"version":input.Version})
 default:http.NotFound(w,r)
 }
}
