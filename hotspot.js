/* WebUiBox v0.0.8 local Hotspot Manager, no dependency on Mihomo API. */
(() => {
"use strict";
const $=s=>document.querySelector(s);
const sessionKey="webuibox.hotspot.sessionKey";
const approvedDomain="box.lemanhquyen.io.vn";
const isOwnerHttps=location.protocol==="https:"&&location.hostname===approvedDomain;
const isGatewayLocal=location.protocol==="http:"&&["127.0.0.1","localhost"].includes(location.hostname)&&location.port==="9098";
const endpoint=(isOwnerHttps||isGatewayLocal)?location.origin+"/api/v1":null;
let accessKey=sessionStorage.getItem(sessionKey)||"";
let timer=0;
let connected=false;
let latest=[];
const dictionaries={
vi:{
heading:"Quản lý thiết bị và hạn mức dữ liệu IPv4 · Android root Beta",
warningTitle:"Thử nghiệm (Beta)",
warning:"Lưu lượng chỉ đo IPv4 theo iptables và có thể bỏ sót hardware offload, IPv6. Cách bật/tắt Hotspot có thể không hoạt động trên MIUI; chưa kiểm thử trên máy bạn. Không thay đổi Box/TProxy.",
status:"Trạng thái điểm phát",server:"Kết nối Root Backend",keyHelp:"File: /data/adb/webuibox-private/hotspot/access.key · Không chia sẻ key.",
connect:"Kết nối Backend",devices:"Thiết bị đang kết nối",deviceHelp:"Danh sách ước lượng từ ARP: thiếu những thiết bị chưa tạo bản ghi hoặc đã ngủ.",
usageTitle:"Giới hạn dữ liệu",usageNotes:"Đặt hạn mức bằng MB trên địa chỉ IPv4. Chỉ ghi nhận khi root backend và iptables hoạt động; IPv6/hardware offload có thể đi vòng. Hạn mức và số byte tính trong phiên này; không bảo đảm sau reboot.",
ready:"Đã kết nối backend",disconnected:"Backend chưa kết nối",on:"Hotspot có vẻ đang bật",off:"Chưa phát hiện Hotspot",iface:"Giao diện",noDevices:"Chưa thấy thiết bị IPv4 nào qua ARP.",
toggleUnavailable:"Nút bật/tắt chỉ khả dụng khi máy Android 11 và đã cấp phép thử Binder thủ công. Không có phương án bật/tắt bảo đảm với mọi MIUI.",
toggleAvailable:"Binder Android 11 thử nghiệm. Phải kiểm tra trạng thái Hotspot thật trong Cài đặt.",
turnOn:"Bật Hotspot",turnOff:"Tắt Hotspot",block:"Chặn",unblock:"Bỏ chặn",used:"Đã đếm IPv4",quota:"Giới hạn MB",save:"Lưu hạn mức",pending:"Đã gửi yêu cầu, kiểm tra Hotspot trong Android Settings.",confirm:"Đây là thao tác thử nghiệm trên Android root, có thể làm mất kết nối mạng. Tiếp tục?",confirmBlock:"Chặn / thay đổi hạn mức IPv4 của thiết bị này?",auth:"Nhập access.key từ MT Manager để kết nối.",serverLost:"Không kết nối được backend. Kiểm tra root service và key.",failed:"Không thực hiện được",reached:"Hết hạn mức",active:"Đang kết nối",disabled:"Không có quyền bật/tắt",noData:"Chưa có dữ liệu"
},
en:{
heading:"Client management and IPv4 data quotas · Root Android Beta",
warningTitle:"Experimental (Beta)",
warning:"IPv4 iptables accounting may miss hardware-offloaded traffic and IPv6. Hotspot toggle may not work on MIUI and has not been verified on your device. No Box/TProxy config changes.",
status:"Hotspot status",server:"Root backend connection",keyHelp:"File: /data/adb/webuibox-private/hotspot/access.key · Keep this key private.",
connect:"Connect Backend",devices:"Connected devices",deviceHelp:"Estimated from ARP; sleeping or inactive clients may not appear.",
usageTitle:"Data quota",usageNotes:"Quota in MB per IPv4 address. Only measured if root backend and iptables work. IPv6/offloaded traffic may bypass counters. Quotas and byte counts are session-only, not guaranteed across reboots.",
ready:"Backend connected",disconnected:"Backend unavailable",on:"Hotspot appears active",off:"Hotspot not detected",iface:"Interface",noDevices:"No IPv4 clients visible in ARP.",
toggleUnavailable:"Toggle requires Android 11 and explicit manual authorization for experimental Binder calls. Not guaranteed on MIUI.",
toggleAvailable:"Experimental Android 11 Binder. Verify real hotspot state in Android Settings.",
turnOn:"Turn on Hotspot",turnOff:"Turn off Hotspot",block:"Block",unblock:"Unblock",used:"IPv4 counted",quota:"Limit MB",save:"Save quota",pending:"Command requested; check hotspot state in Android Settings.",confirm:"Experimental root action may disrupt networking. Continue?",confirmBlock:"Modify IPv4 block or quota for this client?",auth:"Paste the access.key from MT Manager.",serverLost:"Cannot reach backend. Check root service and key.",failed:"Failed",reached:"Quota reached",active:"Connected",disabled:"Toggle unavailable",noData:"No data"
}
};
const getLang=()=>document.documentElement.lang==="en"?"en":"vi";
const t=k=>dictionaries[getLang()][k]||k;
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pretty=b=>{
 const n=Math.max(0,Number(b)||0);
 return n>=1073741824?(n/1073741824).toFixed(2)+" GB":n>=1048576?(n/1048576).toFixed(1)+" MB":(n/1024).toFixed(1)+" KB";
};
function translations(){
 const m={
 "#hs-heading-sub":"heading","#hs-warning-title":"warningTitle","#hs-warning-body":"warning",
 "#hs-status-title":"status","#hs-server-title":"server","#hs-key-help":"keyHelp",
 "#hs-connect":"connect","#hs-device-title":"devices","#hs-device-help":"deviceHelp",
 "#hs-usage-title":"usageTitle","#hs-usage-notes":"usageNotes",
 "#hs-on":"turnOn","#hs-off":"turnOff"
 };
 for(const [selector,key] of Object.entries(m))$(selector).textContent=t(key);
 $("#hs-toggle-info").textContent=t("toggleUnavailable");
}
function message(s,err=false){const el=$("#hs-message");el.textContent=s;el.style.color=err?"#ff9daf":"#65efc3";}
async function call(route,method="GET",data=null){
 if(!endpoint)throw Error("Root controls require HTTPS box.lemanhquyen.io.vn or local WebUiBox URL");
 if(!accessKey)throw Error(t("auth"));
 const controller=new AbortController();const wait=setTimeout(()=>controller.abort(),8000);
 try {
  const r=await fetch(endpoint+route,{
   method,signal:controller.signal,cache:"no-store",
   headers:{"X-WebUiBox-Key":accessKey,...(data?{"Content-Type":"application/json"}:{})},
   ...(data?{body:JSON.stringify(data)}:{})
  });
  if(!r.ok){
    if(isOwnerHttps&&r.status===404)throw Error("404: Cloudflare Tunnel phải định tuyến /api/v1/* tới 127.0.0.1:9098");
    const type=r.headers.get("content-type")||"";
    if(isOwnerHttps&&type.includes("text/html"))throw Error("API trả HTML; kiểm tra Cloudflare Access và Tunnel");
    const txt=await r.text();throw Error("HTTP "+r.status+": "+txt.slice(0,200));
  }
  return await r.json();
 } finally {clearTimeout(wait);}
}
function renderDevices(devices){
 const root=$("#hs-devices");
 $("#hs-count").textContent=String(devices.length);
 if(!devices.length){root.innerHTML='<p class="muted">'+esc(t("noDevices"))+'</p>';return;}
 root.innerHTML=devices.map((d,i)=>{
  const used=Number(d.upload||0)+Number(d.download||0);
  const quotaMB=Math.round((Number(d.limit||0))/1048576);
  const state=d.blocked?'<span class="badge-danger">'+esc(t("block"))+'</span>':d.quota_reached?'<span class="badge-danger">'+esc(t("reached"))+'</span>':'<span class="badge-good">'+esc(t("active"))+'</span>';
  return '<div class="hs-client" data-index="'+i+'"><div class="hs-client-main"><span class="hs-device-symbol">▣</span><div><strong>'+esc(d.ip)+'</strong><small>'+esc(d.mac)+' · '+esc(d.interface)+'</small></div>'+state+'</div>'+
  '<div class="hs-traffic">'+esc(t("used"))+': <strong>'+pretty(used)+'</strong> <small>↑ '+pretty(d.upload)+' · ↓ '+pretty(d.download)+'</small></div>'+
  '<div class="hs-client-actions"><label>'+esc(t("quota"))+' <input type="number" min="0" max="1048576" step="1" inputmode="numeric" data-field="quota" value="'+quotaMB+'"></label><button data-action="save" class="small-button">'+esc(t("save"))+'</button>'+
  '<button class="'+(d.blocked?"small-button":"danger-button")+'" data-action="block">'+esc(d.blocked?t("unblock"):t("block"))+'</button></div></div>';
 }).join("");
}
async function refresh(force=false){
 if(!accessKey){if(force)message(t("auth"),true);return;}
 try{
  const data=await call("/status");
  connected=true;latest=data.clients||[];
  $("#hs-label").textContent=t("ready");
  $("#hs-state").textContent=data.hotspot_detected?t("on"):t("off");
  $("#hs-interface").textContent=t("iface")+": "+(data.interface||"—");
  const control=Boolean(data.control_ready);
  $("#hs-on").disabled=!control;$("#hs-off").disabled=!control;
  $("#hs-toggle-info").textContent=t(control?"toggleAvailable":"toggleUnavailable");
  renderDevices(latest);
  message(t("ready")+" · 127.0.0.1:9098");
 }catch(err){
  connected=false;$("#hs-label").textContent=t("disconnected");
  $("#hs-on").disabled=true;$("#hs-off").disabled=true;
  if(force)message(t("serverLost")+" ("+err.message+")",true);
 }
}
async function toggleHotspot(enabled){
 if(!connected)return;
 if(!confirm(t("confirm")))return;
 try{
  const r=await call("/hotspot","POST",{enabled});
  message(t("pending"));
  setTimeout(()=>refresh(false),2000);
 }catch(err){message(t("failed")+": "+err.message,true);}
}
async function applyToClient(event){
 const button=event.target.closest("button[data-action]");
 if(!button)return;
 const wrapper=button.closest(".hs-client");if(!wrapper)return;
 const id=Number(wrapper.dataset.index),client=latest[id];
 if(!client)return;
 const amount=Number(wrapper.querySelector('[data-field="quota"]').value);
 if(!Number.isInteger(amount)||amount<0||amount>1048576){message("Invalid quota",true);return;}
 const blocked=button.dataset.action==="block"?!client.blocked:client.blocked;
 if(!confirm(t("confirmBlock")))return;
 button.disabled=true;
 try {
  await call("/client","POST",{ip:client.ip,mac:client.mac,blocked,limit_mb:amount});
  message(t("ready"));await refresh(false);
 }catch(err){message(t("failed")+": "+err.message,true);}
 finally{button.disabled=false;}
}
function mount(){
 translations();
 $("#hs-key").value=accessKey;
 $("#hs-connect").onclick=()=>{accessKey=$("#hs-key").value.trim();sessionStorage.setItem(sessionKey,accessKey);refresh(true);};
 $("#hs-refresh").onclick=()=>refresh(true);
 $("#hs-on").onclick=()=>toggleHotspot(true);
 $("#hs-off").onclick=()=>toggleHotspot(false);
 $("#hs-devices").addEventListener("click",applyToClient);
 const observer=new MutationObserver(()=>translations());
 // Observe only language button activations via click; avoid observer loops.
 document.querySelectorAll("#lang-vi,#lang-en").forEach(b=>b.addEventListener("click",()=>{
  translations();renderDevices(latest);
 }));
 if(accessKey)refresh(true);
 timer=setInterval(()=>{if(document.querySelector("#page-hotspot.active")&&accessKey)refresh(false);},6000);
}
document.addEventListener("DOMContentLoaded",mount);
})();
