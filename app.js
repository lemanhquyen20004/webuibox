/* WebUiBox v0.0.6 — independently implemented UI using the Mihomo REST/WebSocket API.
   Demo data is clearly labeled; live mode never invents traffic or CPU metrics. */
(function () {
  "use strict";
  const VERSION = "0.0.6";
  const REPO = "https://github.com/lemanhquyen20004/webuibox";
  const MANIFEST = "https://raw.githubusercontent.com/lemanhquyen20004/webuibox/main/update.json";
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const tr = {
    vi: {
      overview:"Tổng quan",overviewDesc:"Giám sát Box, máy chủ và lưu lượng theo thời gian thực.",proxies:"Máy chủ",connections:"Kết nối",rules:"Quy tắc",logs:"Nhật ký",settings:"Cài đặt",updates:"Cập nhật",
      download:"Tải xuống",upload:"Tải lên",totalDown:"Tổng tải xuống",totalUp:"Tổng tải lên",status:"Trạng thái",uptime:"Thời gian hoạt động",memoryNote:"Bộ nhớ core, không phải RAM toàn điện thoại.",currentCore:"Core / Binary hiện tại",fromBox:"Theo Box",selectedProxy:"Proxy đang sử dụng",activeSessions:"Phiên hiện tại",traffic:"Lưu lượng theo thời gian",realTime:"Thời gian thực • 60 mẫu gần nhất",quickProxies:"Máy chủ / Proxy",seeAll:"Xem tất cả →",recentConnections:"Kết nối gần đây",recentLogs:"Nhật ký mới",
      proxiesDesc:"Chọn node, kiểm tra độ trễ và cập nhật subscription.",refreshProviders:"Cập nhật providers",connectionsDesc:"Quan sát và ngắt phiên kết nối đang chạy.",closeAll:"Ngắt tất cả",rulesDesc:"Kiểm tra quy tắc định tuyến Mihomo.",reload:"Nạp lại cấu hình",logsDesc:"Log trực tiếp từ Mihomo WebSocket.",clear:"Xóa màn hình",
      settingsDesc:"Kết nối API, DNS và chế độ hoạt động.",apiConnection:"Mihomo API",apiEndpoint:"Địa chỉ API",apiSecret:"Secret (nếu có)",secretHelp:"Secret chỉ được lưu trong session của trình duyệt.",saveConnect:"Lưu và kết nối",mode:"Chế độ định tuyến",flushDns:"Xóa DNS cache",flushFake:"Xóa Fake-IP",modeNote:"Các thao tác này sử dụng API Mihomo và cần core đang chạy.",boxBridge:"Đọc core từ Box",boxBridgeDesc:"Trình duyệt đọc file trạng thái do bridge tạo từ /data/adb/box/settings.ini, không đọc trực tiếp thư mục root.",bridgeNote:"Cài scripts/box-status.sh để hiển thị chính xác core.",appearance:"Giao diện",appearanceDesc:"Dark Neon • hiệu ứng nhẹ • điện thoại và desktop • tiếng Việt / English.",demoMode:"Bật dữ liệu demo (minh họa)",demoSafety:"Chế độ demo không gửi lệnh đến Mihomo.",
      updatesDesc:"Kiểm tra phiên bản WebUiBox trên GitHub.",checkUpdates:"Kiểm tra cập nhật",latestHint:"Đang dùng v0.0.1. Kiểm tra phiên bản mới để nhận thông báo.",updateMethod:"Cập nhật an toàn: xem Release trên GitHub, sau đó chạy script cập nhật có xác minh SHA-256.",viewReleases:"Xem bản phát hành →",newUpdate:"Có phiên bản WebUiBox mới",details:"Chi tiết",demoNote:"Đây là dữ liệu minh họa. Kết nối Mihomo API để xem dữ liệu thật.",connect:"Kết nối",
      running:"Đang chạy",offline:"Mất kết nối",unknown:"Chưa xác định",notAvailable:"Chưa có dữ liệu",preview:"Chế độ xem trước",test:"Kiểm tra",choose:"Chọn node",empty:"Không có dữ liệu",providerUpdated:"Đã cập nhật provider",success:"Thành công",confirmDisconnect:"Ngắt tất cả kết nối đang hoạt động?",failed:"Lỗi",updateAvailable:"Có bản mới",latest:"Bạn đang dùng phiên bản mới nhất",cannotCheck:"Không thể kiểm tra bản cập nhật",demoReadOnly:"Đây là demo, không thực hiện thao tác lên Mihomo.",connected:"Đã kết nối API thành công",needApi:"Hãy cấu hình Mihomo API trước.",apiProblem:"Không thể kết nối API",noBridge:"Chưa đọc được bin_name từ Box; hãy cài bridge.",bridgeReady:"Đã đọc bin_name từ Box",noActive:"Không tìm thấy nhóm proxy"
    },
    en: {
      overview:"Overview",overviewDesc:"Monitor Box, proxies and live network traffic.",proxies:"Proxies",connections:"Connections",rules:"Rules",logs:"Logs",settings:"Settings",updates:"Updates",
      download:"Download",upload:"Upload",totalDown:"Total download",totalUp:"Total upload",status:"Status",uptime:"Uptime",memoryNote:"Core memory, not total phone RAM.",currentCore:"Current core / binary",fromBox:"Box settings",selectedProxy:"Active proxy",activeSessions:"Active sessions",traffic:"Traffic over time",realTime:"Live • last 60 samples",quickProxies:"Proxies / Servers",seeAll:"View all →",recentConnections:"Recent connections",recentLogs:"Recent logs",
      proxiesDesc:"Choose nodes, test latency and update subscriptions.",refreshProviders:"Refresh providers",connectionsDesc:"Monitor and close active connections.",closeAll:"Close all",rulesDesc:"Inspect Mihomo routing rules.",reload:"Reload config",logsDesc:"Real-time Mihomo WebSocket logs.",clear:"Clear display",
      settingsDesc:"API connection, DNS and operating mode.",apiConnection:"Mihomo API",apiEndpoint:"API endpoint",apiSecret:"Secret (if set)",secretHelp:"Secret is saved only for this browser session.",saveConnect:"Save and connect",mode:"Routing mode",flushDns:"Flush DNS cache",flushFake:"Flush Fake-IP",modeNote:"These actions require a running Mihomo API.",boxBridge:"Box core detection",boxBridgeDesc:"The browser reads status generated by the root bridge from /data/adb/box/settings.ini; it cannot read root directories directly.",bridgeNote:"Install scripts/box-status.sh for correct binary detection.",appearance:"Appearance",appearanceDesc:"Dark Neon • moderate motion • mobile and desktop • Vietnamese / English.",demoMode:"Use demo data (preview)",demoSafety:"Demo mode does not send commands to Mihomo.",
      updatesDesc:"Check WebUiBox releases on GitHub.",checkUpdates:"Check updates",latestHint:"Running v0.0.1. Check for new releases.",updateMethod:"Safe update: review the GitHub release, then run the checksum-verified update script.",viewReleases:"View releases →",newUpdate:"WebUiBox update available",details:"Details",demoNote:"This is illustrative data. Connect Mihomo API to see real metrics.",connect:"Connect",
      running:"Running",offline:"Disconnected",unknown:"Unknown",notAvailable:"Not available",preview:"Preview mode",test:"Test",choose:"Select node",empty:"No data",providerUpdated:"Provider updated",success:"Success",confirmDisconnect:"Close all active connections?",failed:"Error",updateAvailable:"New version available",latest:"You have the latest version",cannotCheck:"Unable to check for updates",demoReadOnly:"Demo mode: no commands are sent to Mihomo.",connected:"API connected successfully",needApi:"Configure Mihomo API first.",apiProblem:"Cannot connect to Mihomo API",noBridge:"Could not read Box bin_name. Install the status bridge.",bridgeReady:"Box bin_name detected",noActive:"No proxy groups found"
    }
  };

  Object.assign(tr.vi, {
    oneClickTitle:"Cập nhật WebUiBox một chạm",oneClickHelp:"Cần WebUiBox Root Backend đã bật và Access Key. Khi nâng cấp từ v0.0.3 phải cài v0.0.6 thủ công một lần và khởi động lại backend.",oneClickConnect:"Kết nối Root Backend",oneClickCheck:"Kiểm tra phiên bản",oneClickInstall:"Cập nhật ngay",oneClickRepair:"Khôi phục CPU/RAM/Core",hotspot:"Phát Wi-Fi",tools:"Công cụ",about:"Giới thiệu",today:"Hôm nay",device:"Thiết bị",cpuFoot:"CPU toàn máy · cần bridge root",boxStatus:"Trạng thái Box",latency:"Độ trễ",latencyFoot:"Độ trễ node đã chọn",current:"Hiện tại",trafficDistribution:"Phân bố lưu lượng",activeOnly:"Các kết nối hiện tại",activeOnlyShort:"Đang hoạt động",shareNote:"Ước tính theo lưu lượng các kết nối đang hoạt động, không phải cả ngày",toolsDesc:"Công cụ hỗ trợ kiểm tra mạng qua Mihomo API.",dnsTools:"DNS và Cache",dnsToolsHelp:"Các thao tác cache nằm trong Cài đặt và chỉ dùng API Mihomo.",openSettings:"Mở cài đặt",coreTools:"Thông tin core",coreToolsHelp:"Lõi đang chọn trong settings.ini của Box.",aboutDesc:"WebUI Dark Neon cho Box for Root, hỗ trợ Mihomo trên desktop và Android."
  });
  Object.assign(tr.en, {
    oneClickTitle:"One-tap WebUiBox update",oneClickHelp:"Requires enabled WebUiBox Root Backend and its key. From v0.0.3, install v0.0.6 once manually and restart the backend.",oneClickConnect:"Connect Root Backend",oneClickCheck:"Check releases",oneClickInstall:"Install update",oneClickRepair:"Repair CPU/RAM/Core",hotspot:"Hotspot",tools:"Tools",about:"About",today:"Today",device:"Device",cpuFoot:"Phone CPU · root bridge needed",boxStatus:"Box status",latency:"Latency",latencyFoot:"Selected node latency",current:"Selected",trafficDistribution:"Traffic distribution",activeOnly:"Current connections",activeOnlyShort:"Active",shareNote:"Estimated from active connection bytes, not daily totals",toolsDesc:"Networking tools through the Mihomo API.",dnsTools:"DNS and Cache",dnsToolsHelp:"Cache maintenance is available in Settings through Mihomo API.",openSettings:"Open Settings",coreTools:"Core information",coreToolsHelp:"Core selected in Box settings.ini.",aboutDesc:"Dark Neon WebUI for Box for Root with Mihomo support on desktop and Android."
  });
  let lang = localStorage.getItem("webuibox.lang") === "en" ? "en" : "vi";
  let demo = localStorage.getItem("webuibox.demo") === "true";
  let endpoint = localStorage.getItem("webuibox.endpoint") || (location.protocol.startsWith("http") ? location.origin : "http://127.0.0.1:9090");
  let secret = sessionStorage.getItem("webuibox.secret") || "";
  let currentPage = "overview";
  let live = false;
  let tick = 0;
  let startedAt = Date.now();
  let wsTraffic = null;
  let wsMemory = null;
  let wsLogs = null;
  let proxies = {};
  let providers = {};
  let connections = [];
  let rules = [];
  let logs = [];
  let config = {};
  let seriesDown = Array(60).fill(0);
  let seriesUp = Array(60).fill(0);
  let lastUpdate = null;
  let bridgeBin = "";
  const demoNames = [
    {name:"SG - Singapore 01",type:"VLESS",history:[{delay:28}]},
    {name:"JP - Tokyo 01",type:"VMess",history:[{delay:42}]},
    {name:"US - Los Angeles",type:"Trojan",history:[{delay:68}]},
    {name:"HK - Hong Kong",type:"Hysteria2",history:[{delay:55}]}
  ];
  const demoGroups = {"PROXY":{type:"Selector",now:"SG - Singapore 01",all:demoNames.map(x=>x.name)}, ...Object.fromEntries(demoNames.map(x=>[x.name,{...x,type:"VLESS"}]))};
  function t(key) { return (tr[lang] && tr[lang][key]) || key; }
  function html(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]); }
  function cleanUrl(value) {
    const url = new URL(value);
    if (!["http:","https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error("Invalid endpoint");
    return url.origin;
  }
  function fmtBytes(value, speed) {
    if (value === undefined || value === null || !Number.isFinite(+value)) return "—";
    let v = Math.max(0, +value) * (speed ? 8 : 1);
    const units = speed ? ["bps","Kbps","Mbps","Gbps"] : ["B","KB","MB","GB","TB"];
    let i = 0; while (v >= 1000 && i < units.length - 1) { v /= 1000; i++; }
    return v.toFixed(v >= 100 ? 0 : 1) + " " + units[i];
  }
  function prettyTime(s) {
    const n = Math.max(0,Math.floor(s || 0));
    const d = Math.floor(n/86400),h = Math.floor(n%86400/3600),m = Math.floor(n%3600/60);
    return (d ? d+"d " : "") + h+"h "+m+"m";
  }
  function notify(message) { const n=$("#notification"); n.textContent=message;n.classList.remove("hidden");clearTimeout(notify.timer);notify.timer=setTimeout(()=>n.classList.add("hidden"),4300); }
  function translate() {
    document.documentElement.lang=lang;
    $$("[data-i]").forEach(el=>{el.textContent=t(el.dataset.i);});
    $("#lang-vi").classList.toggle("selected",lang==="vi");
    $("#lang-en").classList.toggle("selected",lang==="en");
    $("#api-url").value=endpoint;
    $("#api-secret").value=secret;
    $("#demo-toggle").checked=demo;
    $("#search").placeholder=lang==="vi"?"Tìm máy chủ, quy tắc, kết nối...":"Search servers, rules, connections...";
    renderAll();
  }
  function navigate(name) {
    if (!$("#page-"+name)) return;
    currentPage=name;
    $$(".page").forEach(p=>p.classList.toggle("active",p.id==="page-"+name));
    $$("[data-nav]").forEach(b=>b.classList.toggle("active",b.dataset.nav===name));
    location.hash=name;
    if (name==="updates") checkUpdates(false);
    if (name==="overview") drawChart();
    window.scrollTo({top:0,behavior:"instant"});
  }
  async function request(path, options={}) {
    if (demo) throw Error(t("demoReadOnly"));
    const abort=new AbortController();const timer=setTimeout(()=>abort.abort(),9000);
    try {
      const headers={"Accept":"application/json",...(options.body ? {"Content-Type":"application/json"} : {}),...(secret?{"Authorization":"Bearer "+secret}:{}),...(options.headers||{})};
      const response=await fetch(cleanUrl(endpoint)+path,{...options,headers,signal:abort.signal,cache:"no-store"});
      if (!response.ok) throw Error("HTTP "+response.status+" "+path);
      if (response.status===204 || response.headers.get("content-length")==="0") return {};
      const text=await response.text();
      return text ? JSON.parse(text) : {};
    } finally { clearTimeout(timer); }
  }
  async function command(path, options) { try{const data=await request(path,options);notify(t("success"));await refreshAll();return data;}catch(e){notify(t("failed")+": "+e.message);} }
  function websocket(path, callback) {
    if (demo || !live) return null;
    try{
      const url=new URL(cleanUrl(endpoint));url.protocol=url.protocol==="https:"?"wss:":"ws:";
      url.pathname=path;url.search=secret?"?token="+encodeURIComponent(secret):"";
      const ws=new WebSocket(url.href);
      ws.onmessage=e=>{try{callback(JSON.parse(e.data));}catch(_){}};
      ws.onclose=()=>{if (live && !demo) setTimeout(()=>{if(path==="/traffic")wsTraffic=websocket(path,callback);else if(path==="/memory")wsMemory=websocket(path,callback);else if(path==="/logs")wsLogs=websocket(path,callback);},3500);};
      return ws;
    }catch(e){return null;}
  }
  function stopWs() {live=false;[wsTraffic,wsMemory,wsLogs].forEach(w=>{if(w){w.onclose=null;w.close();}});wsTraffic=wsMemory=wsLogs=null;}
  function demoSpeed() {
    tick++; const down=Math.max(0,14000000+5500000*Math.sin(tick/4)+2700000*Math.sin(tick*1.47));
    const up=Math.max(0,1600000+800000*Math.sin(tick/5)+400000*Math.sin(tick*1.21));
    updateTraffic(down,up);
    $("#total-down").textContent="12.4 GB";$("#total-up").textContent="1.6 GB";
    $("#memory").textContent="29.6 MB";
    $("#cpu-usage").textContent="18%";$("#cpu-progress").style.width="18%";
    $("#system-memory").textContent="42%";$("#system-memory-progress").style.width="42%";
    $("#system-memory-detail").textContent="2.6 / 6 GB";
    $("#uptime").textContent=prettyTime(2*86400+6*3600+38*60+tick);
    $("#connection-count").textContent="245";
    $("#mobile-uptime").textContent=$("#uptime").textContent;
    $("#mobile-core-state").textContent=t("preview");
  }
  function updateTraffic(down,up) {
    seriesDown.push(Math.max(0,+down||0));seriesDown.shift();
    seriesUp.push(Math.max(0,+up||0));seriesUp.shift();
    $("#download-speed").textContent=fmtBytes(down,true);
    $("#upload-speed").textContent=fmtBytes(up,true);
    spark("#down-spark",seriesDown,"#04ccff");
    spark("#up-spark",seriesUp,"#c05aff");
    if(currentPage==="overview")drawChart();
  }
  function spark(sel,arr,color) {
    const el=$(sel); const max=Math.max(1,...arr),min=0;
    const pts=arr.map((v,i)=>(i/(arr.length-1)*100).toFixed(2)+","+((1-(v-min)/(max-min))*36+2).toFixed(2)).join(" ");
    el.innerHTML='<svg viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true"><polyline points="'+pts+'" fill="none" stroke="'+color+'" stroke-width="1.8" vector-effect="non-scaling-stroke"/></svg>';
  }
  function drawChart() {
    const canvas=$("#traffic-chart"),rect=canvas.getBoundingClientRect();
    const dpr=Math.min(2,window.devicePixelRatio||1),w=Math.max(250,rect.width),h=210;
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    const ctx=canvas.getContext("2d");ctx.scale(dpr,dpr);
    const inset={l:16,r:8,t:8,b:20};const cw=w-inset.l-inset.r,ch=h-inset.t-inset.b;
    const mx=Math.max(1,...seriesDown,...seriesUp)*1.12;
    ctx.strokeStyle="#203e58";ctx.lineWidth=1;
    for(let i=0;i<5;i++){const y=inset.t+i*ch/4;ctx.beginPath();ctx.moveTo(inset.l,y);ctx.lineTo(w-inset.r,y);ctx.stroke();}
    function line(data,color,fill){
      const points=data.map((v,i)=>[inset.l+i*cw/(data.length-1),inset.t+ch-(v/mx)*ch]);
      ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));
      if(fill){ctx.lineTo(inset.l+cw,inset.t+ch);ctx.lineTo(inset.l,inset.t+ch);ctx.closePath();const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,color+"44");g.addColorStop(1,color+"05");ctx.fillStyle=g;ctx.fill();}
      ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();
    }
    line(seriesDown,"#03d5ff",true);line(seriesUp,"#b55dff",true);
    ctx.fillStyle="#7797b6";ctx.font="11px system-ui";ctx.fillText("60s",inset.l,h-4);ctx.fillText("now",w-30,h-4);
  }
  async function connect() {
    if (demo) { stopWs();resetDemo();return; }
    stopWs();
    // Never leave illustrative demo metrics visible after switching to live mode.
    proxies={};providers={};connections=[];rules=[];logs=[];config={};
    seriesDown=Array(60).fill(0);seriesUp=Array(60).fill(0);
    $("#download-speed").textContent="—";$("#upload-speed").textContent="—";
    $("#total-down").textContent="—";$("#total-up").textContent="—";
    $("#memory").textContent="—";$("#memory-progress").style.width="0%";
    $("#cpu-usage").textContent="—";$("#cpu-progress").style.width="0%";
    $("#system-memory").textContent="—";$("#system-memory-detail").textContent="—";
    $("#system-memory-progress").style.width="0%";
    $("#mobile-uptime").textContent="—";$("#mobile-core-state").textContent=t("unknown");
    $("#uptime").textContent="—";$("#connection-count").textContent="—";
    $("#core-version").textContent="—";$("#connection-mode").textContent="Mihomo API";
    $("#active-latency").textContent="—";
    renderAll();
    // Read current Box binary even when the Mihomo API is offline.
    await loadBridge();
    try {
      const v=await request("/version");
      live=true;startedAt=Date.now();
      $("#core-version").textContent=v.version || v.meta || "Mihomo";
      $("#core-indicator-text").textContent=t("running");
      $("#core-indicator").classList.remove("offline");
      $("#core-status").textContent=t("running");
      $("#mobile-core-state").textContent=t("running");
      $("#mobile-core-detail").textContent="Mihomo "+(v.version||"");
      $("#api-message").textContent=t("connected");
      wsTraffic=websocket("/traffic",(p)=>updateTraffic(p.down||0,p.up||0));
      wsMemory=websocket("/memory",(p)=>{if(p.inuse!=null){$("#memory").textContent=fmtBytes(p.inuse,false);$("#memory-progress").style.width="0%";}});
      wsLogs=websocket("/logs",(p)=>pushLog(p));
      notify(t("connected"));
      await refreshAll();
    }catch(e){
      live=false;$("#api-message").textContent=t("apiProblem")+": "+e.message;
      $("#core-indicator-text").textContent=t("offline");
      $("#core-indicator").classList.add("offline");
      $("#core-status").textContent=t("offline");
      $("#mobile-core-state").textContent=t("offline");
    }
  }
  function resetDemo() {
    live=false;tick=0;proxies=demoGroups;providers={};
    connections=[
      {id:"demo-1",metadata:{host:"www.google.com",destinationPort:"443",network:"tcp"},rule:"MATCH",chains:["SG - Singapore 01"]},
      {id:"demo-2",metadata:{host:"discord.com",destinationPort:"443",network:"tcp"},rule:"MATCH",chains:["JP - Tokyo 01"]},
      {id:"demo-3",metadata:{host:"youtube.com",destinationPort:"443",network:"udp"},rule:"MATCH",chains:["SG - Singapore 01"]}
    ];
    rules=[{type:"DOMAIN-SUFFIX",payload:"google.com",proxy:"PROXY"},{type:"DOMAIN-KEYWORD",payload:"game",proxy:"PROXY"},{type:"GEOIP",payload:"VN",proxy:"DIRECT"},{type:"MATCH",payload:"",proxy:"PROXY"}];
    config={mode:"rule"};logs=[];
    pushLog({type:"info",payload:"WebUiBox v0.0.6 · DEMO MODE"});
    pushLog({type:"info",payload:"Sample Mihomo metrics — no live data"});
    bridgeBin="mihomo";$("#core-name").textContent="mihomo";$("#core-version").textContent="v1.19.31 (demo)";
    $("#core-source").textContent="DEMO / bin_name";$("#settings-bin").textContent="mihomo (demo)";
    $("#core-warning").textContent=t("demoNote");
    $("#core-status").textContent=t("running");$("#core-indicator-text").textContent=t("preview");
    $("#core-indicator").classList.remove("offline");$("#connection-mode").textContent="Mihomo · demo";
    $("#mobile-core-state").textContent=t("preview");$("#mobile-core-detail").textContent="Mihomo · demo";
    $("#demo-alert").classList.remove("hidden");$("#api-message").textContent="";
    seriesDown=Array.from({length:60},(_,i)=>9000000+3800000*Math.sin(i/4)+1000000*Math.sin(i*1.3));
    seriesUp=Array.from({length:60},(_,i)=>1250000+500000*Math.sin(i/4.5));
    demoSpeed();renderAll();
  }
  async function refreshAll() {
    if (demo){renderAll();return;}
    if(!live)return;
    const tasks=[
      request("/proxies").then(x=>proxies=x.proxies||{}).catch(()=>{}),
      request("/providers/proxies").then(x=>providers=x.providers||{}).catch(()=>{}),
      request("/connections").then(x=>{
        connections=x.connections||[];
        $("#connection-count").textContent=connections.length;
        $("#total-down").textContent=fmtBytes(x.downloadTotal,false);
        $("#total-up").textContent=fmtBytes(x.uploadTotal,false);
      }).catch(()=>{}),
      request("/rules").then(x=>rules=x.rules||[]).catch(()=>{}),
      request("/configs").then(x=>config=x||{}).catch(()=>{}),
      loadBridge()
    ];
    await Promise.all(tasks);
    renderAll();
  }
  async function loadBridge(){
    try{
      // The root bridge emits a read-only JSON file inside Mihomo SAFE_PATHS.
      // fetch uses the page origin, so the controller's secret is not exposed to a third-party host.
      const snapshotUrl=new URL("./box-status.json",location.href);
      snapshotUrl.searchParams.set("t",Date.now().toString());
      const response=await fetch(snapshotUrl,{cache:"no-store"});
      if(!response.ok)throw Error("HTTP "+response.status+" (/ui/box-status.json)");
      const data=await response.json();
      const core=typeof data.bin_name==="string"?data.bin_name.trim():"";
      if(core==="unknown")throw Error(lang==="vi"?"Chưa có dữ liệu từ script root":"Waiting for root status writer");
      if(!/^(?:clash|mihomo|sing-box|xray|v2fly|hysteria|hysteria2)$/.test(core))throw Error("unknown bin");
      bridgeBin=core;
      $("#core-name").textContent=core;
      $("#settings-bin").textContent=core;
      $("#tools-core").textContent=core;
      $("#core-source").textContent="settings.ini → bin_name";
      const lastUpdated=Date.parse(data.updated_at||"");
      const stale=Number.isFinite(lastUpdated)&&Date.now()-lastUpdated>60000;
      $("#core-warning").textContent=(stale
        ? (lang==="vi"?"Bridge chưa cập nhật trong 60 giây":"Bridge status older than 60 seconds")
        : t("bridgeReady"))+" · "+(data.running?t("running"):t("offline"));
      const cpu=Number(data.cpu_percent);
      if (data.cpu_percent!=null && Number.isFinite(cpu) && cpu>=0 && cpu<=100){
        $("#cpu-usage").textContent=cpu.toFixed(0)+"%";
        $("#cpu-progress").style.width=cpu+"%";
      }
      const total=Number(data.ram_total_bytes),used=Number(data.ram_used_bytes);
      if(Number.isFinite(total)&&total>0&&Number.isFinite(used)&&used>=0){
        const pct=Math.min(100,Math.max(0,used/total*100));
        $("#system-memory").textContent=pct.toFixed(0)+"%";
        $("#system-memory-progress").style.width=pct+"%";
        $("#system-memory-detail").textContent=fmtBytes(used,false)+" / "+fmtBytes(total,false);
      }
      const uptime=Number(data.uptime_seconds);
      if(Number.isFinite(uptime)&&uptime>=0){
        $("#uptime").textContent=prettyTime(uptime);
        $("#mobile-uptime").textContent=prettyTime(uptime);
      }
    }catch(e){
      bridgeBin="";
      $("#settings-bin").textContent="—";$("#tools-core").textContent="—";
      $("#core-name").textContent=t("unknown");
      $("#core-source").textContent="settings.ini → bin_name";
      const onLocal=["127.0.0.1","localhost"].includes(location.hostname);
      const detail=String(e&&e.message||"unknown error").slice(0,100);
      $("#core-warning").textContent=lang==="vi"
        ? "Không đọc được Box Bridge ("+detail+"). "+(onLocal
          ? "Kiểm tra /ui/box-status.json và service.d/webuibox-status.sh."
          : "Bạn đang mở qua tên miền; thử http://127.0.0.1:9090/ui/ trên điện thoại gốc.")
        : "Box Bridge inaccessible ("+detail+"). "+(onLocal
          ? "Check /ui/box-status.json and the service.d bridge."
          : "You're using a domain; try http://127.0.0.1:9090/ui/ on the rooted phone.");
      $("#cpu-usage").textContent="—";$("#system-memory").textContent="—";
      $("#system-memory-detail").textContent="—";
      $("#cpu-progress").style.width="0%";$("#system-memory-progress").style.width="0%";
    }
  }
  function renderTrafficShare(){
    const dest = new Map();
    if(demo) {
      dest.set("SG - Singapore 01", 3940000);
      dest.set("JP - Tokyo 01", 1620000);
      dest.set("US - Los Angeles", 1200000);
      dest.set("DIRECT",850000);
    }else{
      for(const c of connections){
        const name=(Array.isArray(c.chains)&&c.chains[0]) || c.rule || "DIRECT";
        const total=(Number(c.download)||0)+(Number(c.upload)||0);
        if(Number.isFinite(total) && total>0)dest.set(name,(dest.get(name)||0)+total);
      }
    }
    const groups=Array.from(dest.entries()).sort((a,b)=>b[1]-a[1]);
    const total=groups.reduce((acc,x)=>acc+x[1],0);
    const el=$("#traffic-donut"),list=$("#traffic-share-legend");
    if(total===0){
      el.style.background="conic-gradient(#183b58 0 100%)";
      $("#donut-total").textContent="—";
      list.innerHTML='<span class="muted">'+html(t("empty"))+'</span>'; return;
    }
    const colors=["#0ecaf1","#9751ff","#2d7efa","#e14baf","#ffac4f","#46628a"];
    let offset=0, stops=[];
    groups.slice(0,6).forEach((g,i)=>{
      const end=Math.min(100,offset+g[1]/total*100);
      stops.push(colors[i]+" "+offset+"% "+end+"%");
      offset=end;
    });
    if(offset<100)stops.push("#46628a "+offset+"% 100%");
    el.style.background="conic-gradient("+stops.join(",")+")";
    $("#donut-total").textContent=fmtBytes(total,false);
    list.innerHTML=groups.slice(0,6).map((g,i)=>{
      const percent=g[1]/total*100;
      return '<div class="legend-row"><i class="legend-color" style="background:'+colors[i]+'"></i><span class="legend-label">'+html(g[0])+'</span><strong class="legend-value">'+percent.toFixed(0)+'%</strong></div>';
    }).join("");
  }
  function updateClock(){
    const now=new Date();
    $("#ui-clock").textContent=new Intl.DateTimeFormat(lang==="vi"?"vi-VN":"en-US",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false}).format(now);
  }
  function pushLog(p){
    const level=String(p.type||"info").toLowerCase();
    const raw=String(p.payload||p.message||"");
    logs.push({type:level,message:raw,time:new Date().toLocaleTimeString()});
    if(logs.length>300) logs.shift();
    renderLogs();
  }
  function renderLogs(){
    const make=x=>'<div class="log-line"><span class="log-level '+html(x.type)+'">'+html(x.type.toUpperCase())+'</span> <span class="muted">['+html(x.time)+']</span> '+html(x.message)+'</div>';
    $("#recent-logs").innerHTML=logs.slice(-8).reverse().map(make).join("")||'<span class="muted">—</span>';
    $("#logs-full").innerHTML=logs.slice().reverse().map(make).join("")||'<span class="muted">—</span>';
  }
  function delayText(p){ const n=p&&p.history&&p.history.length?p.history[p.history.length-1].delay:null;return Number(n)>0?n+" ms":"—"; }
  function proxyEntry(name,ref,group,active,quick){
    const d=ref||{};
    const delay=delayText(d);
    const cls=delay==="—"?"none":parseInt(delay,10)>180?"bad":"";
    if (quick) return '<div class="proxy-item"><div class="proxy-info"><strong>'+html(name)+'</strong><small>'+html(d.type||"Mihomo")+'</small></div><span class="latency '+cls+'">'+html(delay)+'</span></div>';
    return '<div class="node '+(active?"selected":"")+'"><div class="node-title"><span>'+html(name)+'</span><span class="latency '+cls+'">'+html(delay)+'</span></div><small class="muted">'+html(d.type||"")+'</small><div class="node-actions"><button class="small-button" data-latency="'+html(name)+'">'+html(t("test"))+'</button><button class="primary-button" data-select="'+html(name)+'" data-group="'+html(group)+'" '+(active?"disabled":"")+'>'+html(active?"✓":t("choose"))+'</button></div></div>';
  }
  function renderProxies(){
    const names=Object.keys(proxies).filter(n=>proxies[n]&&Array.isArray(proxies[n].all)&&proxies[n].all.length>0);
    const q=$("#search").value.trim().toLowerCase();
    const filtered=names.filter(n=>!q || n.toLowerCase().includes(q) || proxies[n].all.some(v=>v.toLowerCase().includes(q)));
    $("#proxy-groups").innerHTML=filtered.map(group=>{
      const p=proxies[group];const nodes=p.all.filter(n=>!q||group.toLowerCase().includes(q)||n.toLowerCase().includes(q));
      return '<article class="panel"><div class="group-title"><span>'+html(group)+' <span class="tag">'+html(p.type||"")+'</span></span><small class="muted">'+html(p.now||"")+'</small></div><div class="group-nodes">'+nodes.map(n=>proxyEntry(n,proxies[n],group,n===p.now,false)).join("")+'</div></article>';
    }).join("")||'<div class="panel muted">'+html(t("noActive"))+'</div>';
    // Box for Root usually exposes a selector called "box"; GLOBAL often defaults to DIRECT.
    const preferred=names.find(n=>/^box$/i.test(n)) || names.find(n=>/^proxy$/i.test(n)) || names.find(n=>n!=="GLOBAL" && /selector|urltest|fallback|loadbalance/i.test(proxies[n].type||"")) || "GLOBAL";
    const primary=proxies[preferred]||proxies.GLOBAL||proxies[names[0]];
    const active=primary&&(primary.now||primary.all&&primary.all[0]);
    $("#active-proxy").textContent=active||"—";
    const p=active?proxies[active]:null;
    $("#active-latency").textContent=delayText(p);
    const list=active?([active,...(primary.all||[]).filter(n=>n!==active)].slice(0,4)):[];
    $("#quick-proxies").innerHTML=list.map(n=>proxyEntry(n,proxies[n],"",n===active,true)).join("")||'<p class="muted">—</p>';
  }
  function renderConnections(){
    const q=$("#search").value.trim().toLowerCase();
    const rows=connections.filter(c=>!q||JSON.stringify(c.metadata||{}).toLowerCase().includes(q)||String(c.rule||"").toLowerCase().includes(q)).slice(0,150);
    const make=c=>{
      const m=c.metadata||{},host=m.host||m.destinationIP||"—",chain=(c.chains||[]).join(" → ");
      return '<div class="table-row"><div><strong>'+html(host)+'</strong><small>'+html(m.destinationPort||"")+" · "+html(m.network||"")+'</small></div><div>'+html(chain||c.rule||"—")+'</div><div><button class="danger-button btn-inline" data-kill="'+html(c.id||"")+'">×</button></div></div>';
    };
    $("#connection-table").innerHTML=rows.map(make).join("")||'<p class="muted">'+t("empty")+'</p>';
    $("#recent-connections").innerHTML=rows.slice(0,5).map(make).join("")||'<p class="muted">'+t("empty")+'</p>';
    if(demo)$("#connection-count").textContent="245";
    else $("#connection-count").textContent=connections.length;
  }
  function renderRules(){
    const q=$("#search").value.toLowerCase().trim();
    $("#rules-table").innerHTML=rules.filter(r=>!q||[r.type,r.payload,r.proxy].join(" ").toLowerCase().includes(q)).slice(0,250).map(r=>
      '<div class="table-row"><div><strong>'+html(r.type||"")+'</strong><small>'+html(r.payload||"")+'</small></div><div>'+html(r.proxy||"")+'</div><div><span class="tag">'+html(r.disabled?"OFF":"ON")+'</span></div></div>').join("")||'<p class="muted">'+t("empty")+'</p>';
  }
  function renderMode(){ $$("[data-mode]").forEach(b=>b.classList.toggle("active",b.dataset.mode===config.mode)); }
  function renderAll(){
    $("#demo-alert").classList.toggle("hidden",!demo);
    $("#demo-toggle").checked=demo;
    renderProxies();renderConnections();renderRules();renderLogs();renderMode();renderTrafficShare();drawChart();
  }
  function compareVersions(a,b){
    const x=String(a).replace(/^v/,"").split(".").map(n=>parseInt(n,10)||0);
    const y=String(b).replace(/^v/,"").split(".").map(n=>parseInt(n,10)||0);
    for(let i=0;i<3;i++)if((x[i]||0)!==(y[i]||0))return (x[i]||0)>(y[i]||0)?1:-1;
    return 0;
  }
  async function checkUpdates(showFeedback){
    try{
      const response=await fetch(MANIFEST+"?t="+Date.now(),{cache:"no-store"});
      if(!response.ok)throw Error("HTTP "+response.status);
      const data=await response.json();
      if(!/^\d+\.\d+\.\d+$/.test(data.version))throw Error("Invalid version");
      const raw=String(data.release_url||"");
      const url=new URL(raw);
      if(url.hostname!=="github.com"||url.protocol!=="https:"||!url.pathname.startsWith("/lemanhquyen20004/webuibox/"))throw Error("Untrusted release URL");
      lastUpdate=data;
      $("#update-link").href=url.href;
      if(compareVersions(data.version,VERSION)>0){
        $("#header-update-dot").classList.remove("hidden");
        $("#update-dot").classList.remove("hidden");$("#update-toast").classList.remove("hidden");
        $("#update-toast-text").textContent="v"+VERSION+" → v"+data.version;
        $("#update-status").textContent=t("updateAvailable")+": v"+data.version+" — "+(data.notes&&data.notes[lang]||"");
      }else{
        $("#header-update-dot").classList.add("hidden");
        $("#update-dot").classList.add("hidden");
        $("#update-status").textContent=t("latest")+" (v"+VERSION+")";
        if(showFeedback)notify(t("latest"));
      }
    }catch(e){
      $("#update-status").textContent=t("cannotCheck")+": "+e.message;
      if(showFeedback)notify(t("cannotCheck"));
    }
  }
  function bind(){
    $$("[data-nav]").forEach(el=>el.addEventListener("click",()=>navigate(el.dataset.nav)));
    $$("[data-goto]").forEach(el=>el.addEventListener("click",()=>navigate(el.dataset.goto)));
    $("#lang-vi").onclick=()=>{lang="vi";localStorage.setItem("webuibox.lang",lang);translate();};
    $("#lang-en").onclick=()=>{lang="en";localStorage.setItem("webuibox.lang",lang);translate();};
    $("#search").addEventListener("input",()=>{renderProxies();renderConnections();renderRules();});
    $("#refresh").onclick=()=>{if(demo)resetDemo();else connect();};
    $("#update-nav").onclick=()=>navigate("updates");
    $("#connect-api").onclick=()=>navigate("settings");
    $("#api-form").addEventListener("submit",async e=>{
      e.preventDefault();
      try{endpoint=cleanUrl($("#api-url").value.trim());}catch(_){notify("Invalid API URL");return;}
      secret=$("#api-secret").value;
      localStorage.setItem("webuibox.endpoint",endpoint);sessionStorage.setItem("webuibox.secret",secret);
      demo=false;localStorage.setItem("webuibox.demo","false");
      $("#demo-toggle").checked=false;await connect();
    });
    $("#demo-toggle").addEventListener("change",async e=>{
      demo=e.target.checked;localStorage.setItem("webuibox.demo",String(demo));
      if(demo)resetDemo();else {$("#demo-alert").classList.add("hidden");await connect();}
    });
    $("#proxy-groups").addEventListener("click",async e=>{
      const target=e.target.closest("button");if(!target)return;
      if(demo){notify(t("demoReadOnly"));return;}
      if(target.dataset.select)await command("/proxies/"+encodeURIComponent(target.dataset.group),{method:"PUT",body:JSON.stringify({name:target.dataset.select})});
      else if(target.dataset.latency){
        try{const url="/proxies/"+encodeURIComponent(target.dataset.latency)+"/delay?url="+encodeURIComponent("https://www.gstatic.com/generate_204")+"&timeout=5000";const result=await request(url);notify(target.dataset.latency+": "+(result.delay||"—")+" ms");await refreshAll();}catch(err){notify(t("failed")+": "+err.message);}
      }
    });
    async function closeConn(id){if(demo){notify(t("demoReadOnly"));return;}await command("/connections/"+encodeURIComponent(id),{method:"DELETE"});}
    $("#connection-table").addEventListener("click",e=>{const b=e.target.closest("[data-kill]");if(b)closeConn(b.dataset.kill);});
    $("#recent-connections").addEventListener("click",e=>{const b=e.target.closest("[data-kill]");if(b)closeConn(b.dataset.kill);});
    $("#close-all").onclick=()=>{if(demo){notify(t("demoReadOnly"));return;}if(confirm(t("confirmDisconnect")))command("/connections",{method:"DELETE"});};
    $$("[data-mode]").forEach(el=>el.onclick=()=>{if(demo){notify(t("demoReadOnly"));return;}command("/configs",{method:"PATCH",body:JSON.stringify({mode:el.dataset.mode})});});
    $("#flush-dns").onclick=()=>command("/cache/dns/flush",{method:"POST"});
    $("#flush-fakeip").onclick=()=>command("/cache/fakeip/flush",{method:"POST"});
    $("#reload-config").onclick=()=>command("/configs?reload=true",{method:"PUT",body:JSON.stringify({path:"",payload:""})});
    $("#clear-logs").onclick=()=>{logs=[];renderLogs();};
    $("#refresh-providers").onclick=async()=>{
      if(demo){notify(t("demoReadOnly"));return;}
      const keys=Object.keys(providers).filter(k=>k!=="default");
      for(const name of keys){try{await request("/providers/proxies/"+encodeURIComponent(name),{method:"PUT"});}catch(e){notify(name+": "+e.message);}}
      notify(t("providerUpdated"));await refreshAll();
    };
    $("#check-updates").onclick=()=>checkUpdates(true);
    $("#open-update").onclick=()=>navigate("updates");
    $("#dismiss-update").onclick=()=>$("#update-toast").classList.add("hidden");
    window.addEventListener("resize",()=>{if(currentPage==="overview")drawChart();});
    window.addEventListener("hashchange",()=>{const name=location.hash.slice(1);if(name!==currentPage&&$("#page-"+name))navigate(name);});
  }
  async function start(){
    $$("[data-version]").forEach(e=>e.textContent=VERSION);
    bind();translate();navigate(location.hash.slice(1)||"overview");
    updateClock();setInterval(updateClock,30000);
    // Remove the old Zashboard PWA service worker, if the browser kept one for /ui/.
    if("serviceWorker" in navigator)navigator.serviceWorker.getRegistrations().then(rs=>{
      for(const reg of rs)if(new URL(reg.scope).pathname.startsWith(new URL("./",location.href).pathname))reg.unregister();
    }).catch(()=>{});
    if(demo)resetDemo();else await connect();
    setInterval(()=>{if(demo)demoSpeed();},1000);
    setInterval(()=>{if(live&&!demo)refreshAll();},6500);
    setInterval(()=>{if(!demo)loadBridge();},12000);
    setInterval(()=>checkUpdates(false),6*60*60*1000);
    setTimeout(()=>checkUpdates(false),1700);
  }
  document.addEventListener("DOMContentLoaded",start);
})();