(function(){
  "use strict";
  var KEY = "fifth-onboarding-demo-v2";
  var TOTAL = 10;
  var CATS = ["Roofing","Pools","HVAC","Fence","Landscaping","Turf","Other"];
  var TIMES = ["8:00 AM","9:30 AM","11:00 AM","1:00 PM"];
  var CAPS = [
    ["They raise a hand","Owner taps the button on IG or the website, or answers your call or email."],
    ["Instant reply","An email goes out right away with one button: Get my free leads."],
    ["Quick intake","One short form: business, category, area, ideal customer, best email and phone."],
    ["Category check","One business per category. If it's open, they see \u201cspot available.\u201d"],
    ["Free starter leads","Leads land by email: who, what they need, and where."],
    ["Proposal","A branded proposal for the digital assistant setup, filled in from their intake."],
    ["E-signature","They review and sign on their phone in under a minute."],
    ["Payment","They pay the setup fee online with a secure payment link."],
    ["Book onboarding","They pick a time on your Google Calendar. The invite goes out on its own."],
    ["Your view (Jesse)","A new client card lands in your tracker with the onboarding checklist started."]
  ];
  var JOBS = {
    Pools:["Pool resurfacing","New paver patio","Pool heater + cleaning"],
    Turf:["Backyard putting green","Pet turf for a side yard","Front lawn swap to turf"],
    Landscaping:["Front bed redesign + mulch","New paver walkway","Backyard drainage fix"],
    Roofing:["Storm damage inspection","Full roof replacement quote","Leak around a chimney"],
    HVAC:["Upstairs AC not cooling","Heat pump replacement","Tune-up for two units"],
    Fence:["Privacy fence, about 150 ft","Pool fence to meet code","Replace a leaning wood fence"],
    Other:["New project quote","Recurring home service","Repair visit, flexible timing"]
  };
  var ZIPS = {"mt pleasant":["29464","29466"],"mount pleasant":["29464","29466"],"daniel island":["29492"],"charleston":["29401","29403"],"downtown":["29401"],"west ashley":["29407","29414"],"james island":["29412"],"johns island":["29455"],"summerville":["29483","29485"],"north charleston":["29406","29405"],"goose creek":["29445"],"isle of palms":["29451"],"sullivans island":["29482"],"folly beach":["29439"],"kiawah":["29455"],"hanahan":["29410"],"ladson":["29456"],"moncks corner":["29461"],"wando":["29492"]};

  // ---------- state ----------
  function fresh(){ return {step:1,biz:"",name:"",cat:"",area:"",ideal:"",email:"",phone:"",sig:"",agree:false,pay:"card",day:"",time:""}; }
  var state = (function(){ try{ var s = JSON.parse(localStorage.getItem(KEY)); if(s && typeof s === "object") return Object.assign(fresh(), s); }catch(e){} return fresh(); })();
  function save(){ try{ localStorage.setItem(KEY, JSON.stringify(state)); }catch(e){} }

  var $ = function(id){ return document.getElementById(id); };
  var screens = [].slice.call(document.querySelectorAll(".screen"));
  var scroller = $("screens");

  // ---------- helpers ----------
  function el(tag, cls, txt){ var e = document.createElement(tag); if(cls) e.className = cls; if(txt != null) e.textContent = txt; return e; }
  function fmtDate(d, o){ return d.toLocaleDateString("en-US", o || {month:"short", day:"numeric", year:"numeric"}); }
  function firstName(){ return state.name.trim().split(/\s+/)[0] || ""; }
  function areas(){
    var a = state.area.split(/,|\/|;|\band\b|&/i).map(function(s){ return s.trim(); }).filter(Boolean);
    return a.length ? a : ["Mt. Pleasant"];
  }
  function zipFor(area, i){
    var k = area.toLowerCase().replace(/[.']/g, "").replace(/\s+/g, " ").trim();
    var z = ZIPS[k]; return z ? " " + z[i % z.length] : "";
  }
  function iso(d){ return d.getFullYear() + "-" + ("0"+(d.getMonth()+1)).slice(-2) + "-" + ("0"+d.getDate()).slice(-2); }
  function parseIso(v){ var a = (v||"").split("-"); return a.length === 3 ? new Date(+a[0], +a[1]-1, +a[2], 12) : null; }
  function today(){ var d = new Date(); d.setHours(12,0,0,0); return d; }

  // ---------- navigation ----------
  function go(n, opts){
    opts = opts || {};
    n = Math.max(1, Math.min(TOTAL, n));
    var rev = n < state.step;
    state.step = n; save();
    screens.forEach(function(s){
      var on = +s.dataset.step === n;
      s.classList.toggle("active", on);
      s.classList.toggle("rev", on && rev && !opts.initial);
      if(on) $("clock").textContent = s.dataset.time;
    });
    $("stepnum").textContent = "Step " + n + " of " + TOTAL;
    $("backBtn").classList.toggle("hide", n === 1);
    $("capNum").textContent = n; $("capT").textContent = CAPS[n-1][0]; $("capD").textContent = CAPS[n-1][1];
    render(n);
    scroller.scrollTop = 0;
    if(!opts.initial){ window.scrollTo(0,0); }
  }
  document.addEventListener("click", function(e){
    if(e.target.closest("[data-next]")) go(state.step + 1);
    else if(e.target.closest("[data-prev]")) go(state.step - 1);
  });
  $("backBtn").addEventListener("click", function(){ go(state.step - 1); });

  // ---------- errors ----------
  function setErr(id, msg, target){
    var p = $("e-" + id); if(p) p.textContent = msg || "";
    if(target){ target.classList.toggle("invalid", !!msg); if(target.tagName === "INPUT" || target.tagName === "TEXTAREA"){ if(msg){ target.setAttribute("aria-invalid","true"); target.setAttribute("aria-describedby","e-"+id); } else target.removeAttribute("aria-invalid"); } }
  }

  // ---------- 3 intake ----------
  var F = {biz:$("f-biz"), name:$("f-name"), area:$("f-area"), ideal:$("f-ideal"), email:$("f-email"), phone:$("f-phone")};
  function digits(s){ return (s||"").replace(/\D/g,""); }
  function fmtPhone(s){
    var d = digits(s); if(d.length === 11 && d[0] === "1") d = d.slice(1); d = d.slice(0,10);
    if(d.length < 4) return d;
    if(d.length < 7) return "(" + d.slice(0,3) + ") " + d.slice(3);
    return "(" + d.slice(0,3) + ") " + d.slice(3,6) + "-" + d.slice(6);
  }
  var checks = {
    biz:function(){ return state.biz.trim().length < 2 ? "Add your business name." : ""; },
    name:function(){ return state.name.trim().length < 2 ? "Add your name." : ""; },
    cat:function(){ return !state.cat ? "Pick your category." : ""; },
    area:function(){ return state.area.trim().length < 2 ? "Add the area you serve." : ""; },
    email:function(){ return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(state.email.trim()) ? "" : "Enter an email like you@company.com."; },
    phone:function(){ var d = digits(state.phone); if(d.length === 11 && d[0] === "1") d = d.slice(1); return d.length === 10 ? "" : "Enter a 10-digit phone number."; }
  };
  Object.keys(F).forEach(function(k){
    var inp = F[k];
    inp.addEventListener("input", function(){
      if(k === "phone") inp.value = fmtPhone(inp.value);
      state[k] = inp.value; save();
      if(checks[k] && inp.classList.contains("invalid")) setErr(k, checks[k](), inp);
    });
    inp.addEventListener("blur", function(){ if(checks[k] && inp.value) setErr(k, checks[k](), inp); });
  });
  function buildCats(){
    var box = $("catChips"); box.innerHTML = "";
    CATS.forEach(function(c){
      var b = el("button", "chip", c); b.type = "button"; b.setAttribute("role","radio");
      b.setAttribute("aria-checked", state.cat === c ? "true" : "false");
      b.addEventListener("click", function(){
        state.cat = c; save();
        [].forEach.call(box.children, function(x){ x.setAttribute("aria-checked", x === b ? "true" : "false"); });
        setErr("cat", "", box);
      });
      box.appendChild(b);
    });
  }
  $("intake").addEventListener("submit", function(e){
    e.preventDefault();
    var first = null;
    ["biz","name","cat","area","email","phone"].forEach(function(k){
      var m = checks[k](); setErr(k, m, k === "cat" ? $("catChips") : F[k]);
      if(m && !first) first = k;
    });
    if(first){
      var t = first === "cat" ? $("catChips") : F[first];
      t.scrollIntoView({behavior:"smooth", block:"center"});
      if(first !== "cat") setTimeout(function(){ t.focus({preventScroll:true}); }, 350);
      return;
    }
    go(4);
  });

  // ---------- 6 pdf ----------
  $("pdfBtn").addEventListener("click", function(){ window.print(); });

  // ---------- 7 signature ----------
  var cv = $("sig"), ctx = cv.getContext("2d"), drawing = false, hasInk = !!state.sig, last = null;
  function sizeCanvas(){
    var r = cv.getBoundingClientRect(); if(!r.width) return;
    var dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#1d1d1f"; ctx.lineWidth = 2.6;
    if(state.sig){ var img = new Image(); img.onload = function(){ ctx.drawImage(img, 0, 0, r.width, r.height); }; img.src = state.sig; }
    $("sigHint").classList.toggle("gone", hasInk);
  }
  function pt(e){ var r = cv.getBoundingClientRect(); return {x:e.clientX - r.left, y:e.clientY - r.top}; }
  cv.addEventListener("pointerdown", function(e){
    e.preventDefault(); drawing = true; last = pt(e);
    try{ cv.setPointerCapture(e.pointerId); }catch(_){}
    ctx.beginPath(); ctx.arc(last.x, last.y, 1.2, 0, Math.PI*2); ctx.fillStyle = "#1d1d1f"; ctx.fill();
    if(!hasInk){ hasInk = true; $("sigHint").classList.add("gone"); }
  });
  cv.addEventListener("pointermove", function(e){
    if(!drawing) return; e.preventDefault();
    var p = pt(e); ctx.beginPath(); ctx.moveTo(last.x, last.y);
    var mx = (last.x + p.x)/2, my = (last.y + p.y)/2;
    ctx.quadraticCurveTo(last.x, last.y, mx, my); ctx.lineTo(p.x, p.y); ctx.stroke(); last = p;
  });
  function endStroke(){ if(!drawing) return; drawing = false; state.sig = cv.toDataURL("image/png"); save(); setErr("sig", "", $("sigbox")); }
  cv.addEventListener("pointerup", endStroke); cv.addEventListener("pointercancel", endStroke); cv.addEventListener("pointerleave", endStroke);
  $("clearSig").addEventListener("click", function(){ ctx.clearRect(0,0,cv.width,cv.height); state.sig = ""; hasInk = false; save(); $("sigHint").classList.remove("gone"); });
  $("f-agree").addEventListener("change", function(){ state.agree = this.checked; save(); if(this.checked) setErr("agree",""); });
  function tab(which){
    var sign = which === "sign";
    $("tabSign").setAttribute("aria-selected", sign); $("tabReview").setAttribute("aria-selected", !sign);
    $("paneSign").hidden = !sign; $("paneReview").hidden = sign;
    if(sign) requestAnimationFrame(sizeCanvas);
  }
  $("tabSign").addEventListener("click", function(){ tab("sign"); });
  $("tabReview").addEventListener("click", function(){ tab("review"); });
  $("toSign").addEventListener("click", function(){ tab("sign"); });
  $("signForm").addEventListener("submit", function(e){
    e.preventDefault(); var ok = true;
    if(!hasInk){ setErr("sig", "Draw your signature in the box.", $("sigbox")); ok = false; }
    if(!state.agree){ setErr("agree", "Check the box to agree to the terms."); ok = false; }
    if(ok) go(8);
  });
  var rt; window.addEventListener("resize", function(){ clearTimeout(rt); rt = setTimeout(function(){ if(state.step === 7 && !$("paneSign").hidden) sizeCanvas(); }, 150); });

  // ---------- 8 payment ----------
  [].forEach.call(document.querySelectorAll("#payMethod .radio"), function(b){
    b.addEventListener("click", function(){
      state.pay = b.dataset.v; save(); paintPay();
    });
  });
  function paintPay(){
    [].forEach.call(document.querySelectorAll("#payMethod .radio"), function(x){ var on = x.dataset.v === state.pay; x.classList.toggle("on", on); x.setAttribute("aria-checked", on); });
    var card = state.pay === "card";
    document.querySelector(".paydemo .achbox").hidden = card;
    [].forEach.call(document.querySelectorAll(".paydemo > .lbl, .paydemo > .in, .paydemo > .two"), function(x){ x.hidden = !card; });
  }

  // ---------- 9 calendar ----------
  var monthOffset = 0;
  function bookable(d){ var t = today(); var max = new Date(t); max.setDate(max.getDate() + 45); var w = d.getDay(); return d > t && d <= max && w !== 0 && w !== 6; }
  function buildCal(){
    var t = today(), base = new Date(t.getFullYear(), t.getMonth() + monthOffset, 1, 12);
    $("monthLbl").textContent = base.toLocaleDateString("en-US", {month:"long", year:"numeric"});
    $("prevM").disabled = monthOffset === 0; $("nextM").disabled = monthOffset >= 1;
    var g = $("cal"); g.innerHTML = "";
    ["S","M","T","W","T","F","S"].forEach(function(d){ g.appendChild(el("div","dw",d)); });
    var days = new Date(base.getFullYear(), base.getMonth()+1, 0).getDate();
    var startDn = 1;
    if(monthOffset === 0){ var ws = new Date(t); ws.setDate(t.getDate() - t.getDay() - 7); if(ws.getMonth() === t.getMonth()) startDn = ws.getDate(); }
    var lead = new Date(base.getFullYear(), base.getMonth(), startDn).getDay();
    for(var i = 0; i < lead; i++) g.appendChild(el("span","e",""));
    for(var dn = startDn; dn <= days; dn++){
      var d = new Date(base.getFullYear(), base.getMonth(), dn, 12), id = iso(d);
      if(bookable(d)){
        var b = el("button", null, dn); b.type = "button"; b.dataset.d = id;
        b.setAttribute("aria-pressed", state.day === id ? "true" : "false");
        b.setAttribute("aria-label", fmtDate(d, {weekday:"long", month:"long", day:"numeric"}));
        b.addEventListener("click", function(){ state.day = this.dataset.d; save(); setErr("day",""); buildCal(); buildSlots(); });
        g.appendChild(b);
      } else {
        var s = el("span", "x" + (iso(t) === id ? " today" : ""), dn); s.setAttribute("aria-hidden","true"); g.appendChild(s);
      }
    }
  }
  function buildSlots(){
    var d = parseIso(state.day);
    $("dayLbl").textContent = d ? fmtDate(d, {weekday:"long", month:"short", day:"numeric"}) : "Pick a day, then a time";
    var box = $("slots"); box.innerHTML = "";
    TIMES.forEach(function(t){
      var b = el("button", "slot radio" + (state.time === t ? " on" : "")); b.type = "button"; b.setAttribute("role","radio"); b.setAttribute("aria-checked", state.time === t);
      b.appendChild(el("span","rad")); b.appendChild(document.createTextNode(t));
      b.addEventListener("click", function(){ state.time = t; save(); setErr("time",""); buildSlots(); });
      box.appendChild(b);
    });
  }
  $("prevM").addEventListener("click", function(){ if(monthOffset > 0){ monthOffset--; buildCal(); } });
  $("nextM").addEventListener("click", function(){ if(monthOffset < 1){ monthOffset++; buildCal(); } });
  $("bookBtn").addEventListener("click", function(){
    var ok = true;
    if(!state.day){ setErr("day","Pick a day on the calendar."); ok = false; }
    if(!state.time){ setErr("time","Pick a time."); ok = false; }
    if(ok) go(10);
  });

  // ---------- 10 ----------
  $("folderBtn").addEventListener("click", function(){ $("toast").hidden = false; });
  $("restart").addEventListener("click", function(){
    try{ localStorage.removeItem(KEY); }catch(e){}
    state = fresh(); hasInk = false; monthOffset = 0; hydrate();
    document.querySelectorAll(".invalid").forEach(function(x){ x.classList.remove("invalid"); });
    document.querySelectorAll(".err").forEach(function(x){ x.textContent = ""; });
    $("toast").hidden = true;
    go(1);
  });

  // ---------- per-screen fill ----------
  function render(n){
    var cat = state.cat || "Pools", a = areas(), biz = state.biz.trim() || "Your business";
    if(n === 2){
      $("hiLine").textContent = firstName() ? "Hi " + firstName() + "," : "Hi there,";
      $("toLine").textContent = "to " + (firstName() || "you") + " \u00b7 just now";
    }
    if(n === 4){
      var box = $("spots"); box.innerHTML = "";
      var open = el("div","slot open"); var s1 = el("span"); s1.appendChild(el("b",null,cat)); s1.appendChild(document.createTextNode(" \u00b7 " + a[0])); open.appendChild(s1); open.appendChild(el("span","tag","OPEN")); box.appendChild(open);
      ["Fence","HVAC","Roofing","Pools"].filter(function(c){ return c !== cat; }).slice(0,2).forEach(function(c){
        var r = el("div","slot taken"); r.appendChild(el("span",null,c + " \u00b7 " + a[0])); r.appendChild(el("b",null,"TAKEN")); box.appendChild(r);
      });
    }
    if(n === 5){
      $("leadSub").textContent = biz + " \u00b7 " + cat;
      var w = $("leads"); w.innerHTML = "";
      (JOBS[cat] || JOBS.Other).forEach(function(job, i){
        var ar = a[i % a.length];
        var c = el("div","lead");
        c.appendChild(el("span","samp","SAMPLE"));
        var r1 = el("div","r"); r1.appendChild(el("span","k","WHO")); var bl = el("span","blur"); bl.style.width = [118,104,130][i] + "px"; bl.setAttribute("aria-label","Name hidden"); r1.appendChild(bl); c.appendChild(r1);
        var r2 = el("div","r"); r2.appendChild(el("span","k","WHAT")); r2.appendChild(el("span",null,job)); c.appendChild(r2);
        var r3 = el("div","r"); r3.appendChild(el("span","k","WHERE")); r3.appendChild(el("span",null,ar + zipFor(ar, i))); c.appendChild(r3);
        w.appendChild(c);
      });
    }
    if(n === 6){
      var pr = $("prepared"); pr.textContent = "";
      pr.appendChild(document.createTextNode("Prepared for " + (state.name.trim() || "you"))); pr.appendChild(el("br"));
      pr.appendChild(document.createTextNode(biz + " \u00b7 " + fmtDate(today())));
    }
    if(n === 7){
      $("signName").textContent = state.name.trim() || "Your name";
      $("signDate").textContent = fmtDate(today());
      $("f-agree").checked = !!state.agree;
      requestAnimationFrame(sizeCanvas);
    }
    if(n === 8) paintPay();
    if(n === 9){
      if(state.day){ var dd = parseIso(state.day); if(!dd || !bookable(dd)) { state.day = ""; save(); } else { var t = today(); monthOffset = (dd.getFullYear() - t.getFullYear()) * 12 + dd.getMonth() - t.getMonth(); } }
      buildCal(); buildSlots();
    }
    if(n === 10){
      $("cBiz").textContent = biz;
      $("cMeta").textContent = [state.name.trim(), cat, a[0]].filter(Boolean).join(" \u00b7 ");
      var d = parseIso(state.day);
      $("cCall").textContent = d ? "Call " + fmtDate(d, {weekday:"short"}) + " " + state.time.replace(":00","") : "Call booked";
    }
  }

  function hydrate(){
    Object.keys(F).forEach(function(k){ F[k].value = state[k] || ""; });
    buildCats();
    $("f-agree").checked = !!state.agree;
    ctx.clearRect(0,0,cv.width,cv.height); $("sigHint").classList.toggle("gone", hasInk);
    tab("sign");
  }

  hydrate();
  go(state.step || 1, {initial:true});
})();
