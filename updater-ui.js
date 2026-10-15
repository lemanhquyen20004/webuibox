/* WebUiBox v0.0.8 — authenticated, user-confirmed one-tap UI update.
   Requires optional root backend (127.0.0.1:9098), enabled separately.
   No arbitrary commands and no automatic root action on page load. */
(() => {
"use strict";
const $=s=>document.querySelector(s);
const keyName="webuibox.hotspot.sessionKey";
const remote="https://raw.githubusercontent.com/lemanhquyen20004/webuibox/main/update.json";
const approvedDomain="box.lemanhquyen.io.vn";
const isOwnerHttps=location.protocol==="https:"&&location.hostname===approvedDomain;
const isGatewayLocal=location.protocol==="http:"&&["127.0.0.1","localhost"].includes(location.hostname)&&location.port==="9098";
const localBackend=(isOwnerHttps||isGatewayLocal)?location.origin+"/api/v1/update":null;
const t=(vi,en)=>document.documentElement.lang==="en"?en:vi;
let sessionKey=sessionStorage.getItem(keyName)||"";
let newest="";
let busy=false;
let stateTimer=null;
function currentVersion(){return ($("[data-version]")?.textContent||"0.0.6").replace(/^v/,"").trim();}
function parts(v){return /^\d+\.\d+\.\d+$/.test(v)?v.split(".").map(Number):[0,0,0];}
function newer(a,b){let x=parts(a),y=parts(b);for(let i=0;i<3;i++)if(x[i]!==y[i])return x[i]>y[i];return false;}
function text(msg,error=false){const n=$("#oneclick-status");n.textContent=msg;n.style.color=error?"#ffa4b8":"#b0e9df";}
async function api(path,method="GET",data=null){
 if(!localBackend)throw new Error("Root API requires HTTPS box.lemanhquyen.io.vn or localhost");
 if(!sessionKey)throw new Error(t("Hãy nhập Access Key của WebUiBox Root Backend.","Enter the root backend access key."));
 const controller=new AbortController(),stop=setTimeout(()=>controller.abort(),12000);
 try{
  const r=await fetch(localBackend+path,{method,cache:"no-store",signal:controller.signal,
   headers:{"X-WebUiBox-Key":sessionKey,...(data?{"Content-Type":"application/json"}:{})},
   ...(data?{body:JSON.stringify(data)}:{})
  });
  if(!r.ok){
    if(isOwnerHttps&&r.status===403)throw new Error("Cloudflare Access JWT bị từ chối; kiểm tra remote-access.json, team_domain và AUD tag (403)");
    if(isOwnerHttps&&r.status===404)throw new Error("Cloudflare Tunnel chưa định tuyến /api/v1/* tới 127.0.0.1:9098 (404)");
    if(isOwnerHttps&&(r.headers.get("content-type")||"").includes("text/html"))throw new Error("API trả HTML; kiểm tra Tunnel/Access");
    throw new Error("HTTP "+r.status+": "+(await r.text()).slice(0,120));
  }
  return await r.json();
 }finally{clearTimeout(stop);}
}
async function checkLatest(){
 try{
  const r=await fetch(remote+"?ts="+Date.now(),{cache:"no-store"});
  if(!r.ok)throw Error("GitHub HTTP "+r.status);
  const j=await r.json();
  if(!/^\d+\.\d+\.\d+$/.test(j.version))throw Error("Invalid release version");
  newest=j.version;
  return newer(newest,currentVersion());
 }catch(err){text(t("Không kiểm tra được GitHub: ","GitHub check failed: ")+err.message,true);return false;}
}
async function connect(){
 sessionKey=$("#oneclick-key").value.trim();
 if(sessionKey)sessionStorage.setItem(keyName,sessionKey);
 else sessionStorage.removeItem(keyName);
 try{
  const info=await api("/status");
  $("#oneclick-install").disabled=!(newest&&newer(newest,info.installed))||info.update.running;
  text(t("Đã kết nối Root Backend. Phiên bản cài: ","Root backend connected. Installed: ")+info.installed);
  if(info.update.running)watch();
 }catch(err){
  $("#oneclick-install").disabled=true;
  text(t("Chưa kết nối được Root Backend: ","Cannot connect root backend: ")+err.message,true);
 }
}
async function watch(){
 if(stateTimer)clearInterval(stateTimer);
 const poll=async()=>{
  try{
   const res=await api("/status");
   const info=res.update||{};
   if(info.running){
    busy=true;
    text(t("Đang xử lý: ","Processing: ")+(info.stage||"updating")+" · v"+(info.version||""));
    return;
   }
   if(info.complete){
    busy=false;
    clearInterval(stateTimer);stateTimer=null;
    $("#oneclick-install").disabled=true;
    text(t("Đã cài thành công v","Installed v")+info.version+t(". Đang tải lại WebUI... (khởi động lại máy khi cần cập nhật backend).",". Reloading the UI... (reboot to activate a changed backend)."));
    setTimeout(()=>{window.location.href=location.pathname+"?installed="+encodeURIComponent(info.version)+"#updates";},1700);
    return;
   }
   if(info.error){
    busy=false;clearInterval(stateTimer);stateTimer=null;
    $("#oneclick-install").disabled=false;
    text(t("Cập nhật thất bại; bản cũ vẫn được giữ lại: ","Update failed; old UI retained: ")+info.error,true);
   }
  }catch(err){
   text(t("Không lấy được tiến trình cập nhật: ","Cannot read update progress: ")+err.message,true);
  }
 };
 await poll();
 if(!stateTimer)stateTimer=setInterval(poll,2300);
}
async function begin(){
 if(busy)return;
 try{
  const hasNew=await checkLatest();
  if(!hasNew){text(t("Chưa có phiên bản mới hơn.","No newer version available."));return;}
  const msg=t("Cài WebUiBox v"+newest+" từ GitHub? Giao diện cũ sẽ được sao lưu. Không thay đổi config VPN/iptables.","Install WebUiBox v"+newest+" from GitHub? Existing UI will be backed up; VPN config and iptables are unchanged.");
  if(!window.confirm(msg))return;
  $("#oneclick-install").disabled=true;
  await api("/install","POST",{version:newest});
  busy=true;text(t("Đang tải và xác minh ZIP...","Downloading and verifying release ZIP..."));
  await watch();
 }catch(err){
  busy=false;$("#oneclick-install").disabled=false;
  text(t("Không thể cập nhật: ","Update failed to start: ")+err.message,true);
 }
}
async function start(){
 const input=$("#oneclick-key");
 if(!input)return;
 input.value=sessionKey;
 $("#oneclick-connect").onclick=connect;
 $("#oneclick-repair").onclick=async()=>{
   sessionKey=$("#oneclick-key").value.trim()||sessionKey;
   if(sessionKey)sessionStorage.setItem(keyName,sessionKey);
   if(!window.confirm(t("Khôi phục dữ liệu CPU/RAM/Core bằng quyền root?","Repair CPU/RAM/Core metadata with root?")))return;
   try{
     const result=await api("/repair-bridge","POST");
     if(!result.ok)throw Error("bridge service did not confirm repair");
     text(t("Đã khôi phục Box Bridge. Tải lại trang để xem dữ liệu CPU/RAM/Core.","Box Bridge repaired. Reload to check CPU/RAM/Core."));
     setTimeout(()=>window.location.reload(),1800);
   }catch(err){
     text(t("Không thể khôi phục Bridge: ","Bridge repair failed: ")+err.message,true);
   }
 };
 $("#oneclick-install").onclick=begin;
 $("#oneclick-refresh").onclick=async()=>{
  const hasNew=await checkLatest();
  text(hasNew?t("Có phiên bản mới: v","New release: v")+newest:t("Không có phiên bản mới.","No newer version found."));
  if(sessionKey)await connect();
 };
 await checkLatest();
 if(sessionKey)connect();
}
document.addEventListener("DOMContentLoaded",start);
})();
