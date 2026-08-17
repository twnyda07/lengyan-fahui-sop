const D = window.SOP_DATA;
const $ = (s,el=document)=>el.querySelector(s);
const esc = s => (s==null?'':String(s)).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const el = (tag,cls,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e;};
const _split=(t,re)=>t.split(re).map(x=>x.trim()).filter(Boolean);
// 把長句自動拆成列點：優先編號(1. 2.)，其次分號/句號；純箭頭流程→有序步驟
function bul(text){
  let t=String(text==null?'':text).trim(); if(!t) return '';
  const numRe=/(?:^|[\s、，；：:])\d{1,2}[.、)](?=\D)/g;
  let items;
  if((t.match(numRe)||[]).length>=2) items=_split(t,numRe);
  else items=_split(t,/[；;]|。(?=.)/);
  if(items.length>=2) return '<ul class="bl">'+items.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ul>';
  if((t.match(/→/g)||[]).length>=2 && !/[（）()]/.test(t))
    return '<ol class="steps">'+_split(t,/→/).map(s=>'<li>'+esc(s)+'</li>').join('')+'</ol>';
  return esc(t);
}
// 流程（壇口協作）：箭頭一律拆成有序步驟
function bulFlow(text){
  let t=String(text==null?'':text).trim(); if(!t) return '';
  const steps=_split(t,/→/);
  if(steps.length>=2) return '<ol class="steps">'+steps.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ol>';
  return bul(t);
}
// 職掌/使命：冒號前為總述，冒號後的頓號清單拆成列點（末尾「下轄…小組」另處理）
function fnBul(m){
  let t=String(m==null?'':m).trim(); if(!t) return '';
  t=t.replace(/(?:。|；)?\s*下轄[^。；]*?小組[^。；]*(?:。|；)?\s*$/,'').trim();
  const ci=t.search(/[：:]/);
  if(ci>=0){
    const lead=t.slice(0,ci).trim(), body=t.slice(ci+1).trim();
    const items=body.split(/[、；;。]/).map(x=>x.trim()).filter(Boolean);
    if(items.length>=3)
      return (lead?'<div class="fn-lead">'+esc(lead)+'</div>':'')+'<ul class="bl fnbl">'+items.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ul>';
  }
  return bul(t);
}
// 純頓號清單（如頻道成員）拆成列點
function enumBul(text){
  let t=String(text==null?'':text).trim(); if(!t) return '';
  const items=t.split(/[、；;。]/).map(x=>x.trim()).filter(Boolean);
  if(items.length>=2) return '<ul class="bl">'+items.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ul>';
  return bul(t);
}

function boot(){
  if(!D){document.querySelectorAll('.tab').forEach(t=>t.innerHTML='<div class="loading">資料尚未載入（data.js）</div>');return;}
  // header
  if(D.event&&D.event.schedule) $('#subline').textContent = D.event.schedule + '　·　各組串連 · 互相知會 · 一棒接一棒';
  const chips = [];
  chips.push(`<span class="chip">總指揮中心 <b>統籌調度</b></span>`);
  if(D.event&&D.event.venue) chips.push(`<span class="chip">📍 <b>${esc(String(D.event.venue).split('；')[0].replace(/^主場：/,''))}</b></span>`);
  chips.push(`<span class="chip">🔒 <b>職稱代號版</b></span>`);
  $('#cmdline').innerHTML = chips.join('');

  renderOverview(); renderZongce(); renderTimeline(); renderMatrix(); renderHandoff(); renderNotify(); renderCoop(); renderDepts(); renderChannels(); renderManpower(); renderConflict();
  $('#foot').innerHTML = `寶嚴國際佛學研修院／寶嚴禪寺　·　${esc((D.event&&D.event.name)||'楞嚴神奇大法會')} 工作SOP（職稱代號版）　·　資料來源：寶嚴流程表（執事人員組織總表＋法會排程規劃表）　·　人員分工與細節請以總指揮中心最新公告為準`;

  // tabs
  document.querySelectorAll('nav.tabs button').forEach(b=>b.onclick=()=>{
    document.querySelectorAll('nav.tabs button').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('section.tab').forEach(x=>x.classList.remove('active'));
    b.classList.add('active'); $('#'+b.dataset.tab).classList.add('active');
    window.scrollTo({top:0,behavior:'smooth'});
  });
}

function renderOverview(){
  const s = $('#overview'); const co=D.coordination||{};
  const kpi = [
    [D.departments?.length||0,'工作部門'],
    [co.handoffMatrix?.length||0,'跨組交接點'],
    [co.notifyProtocol?.length||0,'即時知會協定'],
    [co.ritualCoops?.length||0,'壇口協作場景'],
    [co.channels?.length||0,'通訊頻道'],
    [co.escalation?.length||0,'突發升級機制'],
  ];
  let h = `<h2 class="sec">總覽 · 組織架構</h2><p class="lead">本 SOP 依「寶嚴流程表」（執事人員組織總表＋法會排程規劃表）真實內容製作。總指揮中心統籌，15 個工作部門串連協作、一棒接一棒。</p>`;
  h += `<div class="kpis">`+kpi.map(k=>`<div class="kpi"><div class="n">${k[0]}</div><div class="l">${k[1]}</div></div>`).join('')+`</div>`;
  // real ritual reference
  const rn = (D.event&&D.event.ritualNotes)||'';
  if(rn){
    const lines = rn.split('\n').map(L=>{
      L=esc(L.trim()); if(!L) return '';
      L=L.replace(/^【([^】]+)】/, '<b class="rl">$1</b> ');
      if(L.startsWith('※')) return `<div class="rn-warn">${L}</div>`;
      return `<div class="rn-line">${L}</div>`;
    }).filter(Boolean).join('');
    h += `<div class="card" style="margin-bottom:22px;border-color:var(--gold-soft)"><div class="dept-h"><span class="codebadge" style="background:linear-gradient(135deg,#8a5a12,#b8860b)">禮</span><h3>本場真實儀軌與項目（唯一取材來源）</h3></div><div class="rn-body">${lines}</div></div>`;
  }
  // command center
  const c=D.command||{};
  h += `<div class="grid"><div class="card command"><div class="dept-h"><span class="dot" style="background:var(--maroon)"></span><h3>總指揮中心</h3></div>`;
  h += `<div class="meta"><b>總指揮</b>：${esc(c.總指揮||'')}　｜　<b>執行長</b>：${esc(c.執行長||'')}</div>`;
  if(c.副執行長) h += `<div class="meta"><b>副執行長分工</b>：${esc(c.副執行長)}</div>`;
  h += `</div>`;
  // departments
  (D.departments||[]).forEach(d=>{
    const badge = d.code ? `<span class="codebadge">${esc(d.code)}</span>` : `<span class="dot"></span>`;
    h += `<div class="card"><div class="dept-h">${badge}<h3>${esc(d.name)}</h3></div>`;
    if(d.mission) h += `<div class="meta">${fnBul(d.mission)}</div>`;
    if(d.subgroups?.length) h += `<div class="tags">`+d.subgroups.slice(0,14).map(g=>`<span class="tag">${esc(g)}</span>`).join('')+`</div>`;
    h += `</div>`;
  });
  h += `</div>`;
  h += `<p class="note" style="margin-top:18px">🔒 為保護個資，本表人員一律以<b>職稱／組別代號</b>呈現（如 ${esc((D.departments&&D.departments[0]&&D.departments[0].code)||'宣')}=${esc((D.departments&&D.departments[0]&&D.departments[0].name)||'')}）。實際人員名單以總指揮中心私版為準。</p>`;
  s.innerHTML = h;
}

function renderZongce(){
  const s=$('#zongce'); const Z=window.ZONGCEHUA;
  if(!Z){ s.innerHTML='<div class="loading">總策劃資料未載入（zongcehua.js）</div>'; return; }
  const ev=Z.event||{};
  let h=`<h2 class="sec">總策劃 · 大排程</h2>`;
  h+=`<p class="lead">依試算表「${esc(Z.source||'總策劃')}」整理的真實大排程　·　${esc(ev.venue||'')}　·　人員一律以職稱/組別呈現。</p>`;
  h+=`<div class="note" style="margin-bottom:18px">📅 <b>${esc(ev.dates||'')}</b><br>🔄 更新日：${esc(Z.updated||'')}（每日自動同步試算表至 2026-10-24，之後待通知）</div>`;
  // 出席人數統計
  const at=Z.attendance;
  if(at&&at.cats&&at.cats.length){
    const cell=v=>{v=String(v==null?'':v).trim();return (!v||v==='-')?'<span style="color:#c9bfa8">·</span>':esc(v);};
    h+=`<h3 style="font-size:19px;color:var(--plum);margin:6px 0 6px">📊 出席人數（每日）</h3>`;
    h+=`<div style="overflow-x:auto"><table class="tbl" style="min-width:520px"><thead><tr><th>類別</th>`+at.dates.map(d=>`<th style="text-align:center">${esc(d)}</th>`).join('')+`</tr></thead><tbody>`;
    at.cats.forEach(c=>{
      const tot=c.label==='總數';
      h+=`<tr${tot?' style="background:#faf1dc;font-weight:800"':''}><td${tot?' style="font-weight:800;color:var(--maroon)"':''}>${esc(c.label)}</td>`+c.counts.map(v=>`<td style="text-align:center">${cell(v)}</td>`).join('')+`</tr>`;
    });
    h+=`</tbody></table></div>`;
  }
  // 志工報名現況
  const ro=Z.roster;
  if(ro&&ro.groups&&ro.groups.length){
    const max=Math.max.apply(null,ro.groups.map(g=>g.count));
    h+=`<h3 style="font-size:19px;color:var(--plum);margin:22px 0 6px">🙋 志工報名現況　<span style="color:var(--maroon)">${ro.total}</span> 人（依執事分組）</h3>`;
    h+=`<div class="rbars">`+ro.groups.map(g=>`<div class="rbar"><span class="rbn">${esc(g.group)}</span><span class="rbt"><span class="rbf" style="width:${Math.max(6,Math.round(g.count/max*100))}%"></span></span><span class="rbc">${g.count}</span></div>`).join('')+`</div>`;
  }
  h+=`<h3 style="font-size:19px;color:var(--plum);margin:24px 0 8px">🗓️ 全程大排程</h3>`;
  h+=`<div class="phase-track">`;
  (Z.schedule||[]).forEach((d,i)=>{
    h+=`<div class="phase z-${esc(d.tone||'prep')}"><div class="phase-head"><div class="idx">${i+1}</div><h3>${esc(d.day)}</h3><div class="win">${esc(d.label||'')}</div></div>`;
    h+=`<div style="padding:12px 18px 14px"><ul class="bl">`+(d.items||[]).map(x=>`<li>${esc(x)}</li>`).join('')+`</ul></div></div>`;
  });
  h+=`</div>`;
  s.innerHTML=h;
}
function renderTimeline(){
  const s=$('#timeline'); const tl=(D.coordination&&D.coordination.masterTimeline)||[];
  let h=`<h2 class="sec">主時間軸 · 全場 Workflow</h2><p class="lead">從活動前約2個月的籌備，到圓滿撤場，全程一棒接一棒：每個里程碑標示 <span style="color:#7a5a12">主責組</span> 與 <span style="color:#3f6a52">協作組</span>。</p><div class="phase-track">`;
  tl.forEach((p,i)=>{
    h+=`<div class="phase p${i%6}"><div class="phase-head"><div class="idx">${i+1}</div><h3>${esc(p.phase)}</h3><div class="win">${esc(p.window||'')}</div></div>`;
    (p.milestones||[]).forEach(m=>{
      const sup=(m.supportGroups||[]).map(g=>`<span class="sup">${esc(g)}</span>`).join('');
      h+=`<div class="mile"><div class="t">${esc(m.time||'')}</div><div><div class="ev">${bul(m.event||'')}</div><div class="roles"><span class="lead">主 ${esc(m.leadGroup||'')}</span>${sup}</div></div></div>`;
    });
    h+=`</div>`;
  });
  h+=`</div>`; s.innerHTML=h;
}

function groupNames(){return (D.departments||[]).map(d=>d.name);}

function phaseOrder(){
  const order=['籌備','入場場佈','法會進行','三皈','圓滿','檢討'];
  const set=[];
  (D.departments||[]).forEach(d=>(d.phases||[]).forEach(p=>{ if(!set.includes(p.phase)) set.push(p.phase); }));
  return set.sort((a,b)=>{
    const ai=order.findIndex(o=>a.includes(o)), bi=order.findIndex(o=>b.includes(o));
    return (ai<0?99:ai)-(bi<0?99:bi);
  });
}
function renderMatrix(){
  const s=$('#matrix'); const ds=D.departments||[]; const phases=phaseOrder();
  const shortP = p => p.replace(/（[^）]*）|\([^)]*\)/g,'').trim();
  let h=`<h2 class="sec">全組時間表 · 各組依時間軸要做的事</h2><p class="lead">直向是 15 個工作組，橫向是六個階段（時間）。每一格＝該組在那個時間要做的事。<span class="mtx-hint">← 手機可左右滑動看各階段 →</span></p>`;
  h+=`<div class="matrix-wrap"><table class="mtx"><thead><tr><th class="corner">組別 ＼ 階段</th>`;
  phases.forEach((p,i)=>{ h+=`<th class="ph${i%6}h">${esc(shortP(p))}</th>`; });
  h+=`</tr></thead><tbody>`;
  ds.forEach(d=>{
    h+=`<tr><th class="rowh"><span class="codebadge">${esc(d.code||'')}</span>${esc(d.name)}</th>`;
    phases.forEach(p=>{
      const ph=(d.phases||[]).find(x=>x.phase===p);
      const tasks=(ph&&ph.tasks)||[];
      const cell = tasks.length
        ? tasks.map(t=>`<div class="mtk"><span class="mt">${esc(t.time)}</span>${bul(t.task)}</div>`).join('')
        : `<span class="mnone">—</span>`;
      h+=`<td>${cell}</td>`;
    });
    h+=`</tr>`;
  });
  h+=`</tbody></table></div>`;
  s.innerHTML=h;
}

function renderHandoff(){
  const s=$('#handoff'); const rows=(D.coordination&&D.coordination.handoffMatrix)||[];
  const opts = ['<option value="">全部部門</option>'].concat([...new Set(rows.flatMap(r=>[r.from,r.to]))].filter(Boolean).map(g=>`<option>${esc(g)}</option>`)).join('');
  let h=`<h2 class="sec">跨組串連矩陣</h2><p class="lead">誰交給誰、交付什麼、何時觸發、走哪個管道、期限。共 ${rows.length} 條交接。可用上方搜尋或篩選特定組別的「進／出」。</p>`;
  h+=`<div class="toolbar"><input id="hoSearch" placeholder="搜尋交付內容 / 部門…"><select id="hoFilter">${opts}</select><span id="hoCount" class="ch"></span></div>`;
  h+=`<div class="hcards" id="hoBody"></div>`;
  s.innerHTML=h;
  const draw=()=>{
    const q=($('#hoSearch').value||'').trim(); const f=$('#hoFilter').value;
    const body=$('#hoBody'); body.innerHTML='';
    const list = rows.filter(r=>{
      const okF = !f || r.from===f || r.to===f;
      const okQ = !q || JSON.stringify(r).includes(q);
      return okF&&okQ;
    });
    list.forEach(r=>{
      body.appendChild(el('div','hcard',
        `<div class="flow"><span class="pill from-p">${esc(r.from)}</span><span class="flow-arrow">→</span><span class="pill to-p">${esc(r.to)}</span></div>`+
        `<div class="art">${bul(r.artifact)}</div>`+
        `<div class="row"><span class="lbl">觸發</span><span>${esc(r.trigger)}</span></div>`+
        `<div class="row"><span class="lbl">管道</span><span class="ch">${esc(r.channel)}</span></div>`+
        `<div class="row"><span class="lbl">期限</span><span><span class="sla-badge">${esc(r.deadline)}</span></span></div>`));
    });
    $('#hoCount').textContent = `顯示 ${list.length} / ${rows.length} 條`;
  };
  $('#hoSearch').oninput=draw; $('#hoFilter').onchange=draw; draw();
}

function renderNotify(){
  const s=$('#notify'); const rows=(D.coordination&&D.coordination.notifyProtocol)||[];
  let h=`<h2 class="sec">即時知會協定</h2><p class="lead">法會當天什麼事一發生，誰要在多久內、用什麼管道通知誰。共 ${rows.length} 條。</p>`;
  h+=`<div class="hcards">`;
  rows.forEach(r=>{
    h+=`<div class="hcard"><div class="ev">📢 ${bul(r.event)}</div>`+
      `<div class="flow"><span class="pill from-p">${esc(r.notifier)}</span><span class="flow-arrow">通知→</span><span class="pill to-p">${esc(r.audience)}</span></div>`+
      `<div class="row"><span class="lbl">管道</span><span class="ch">${esc(r.channel)}</span></div>`+
      `<div class="row"><span class="lbl">時效</span><span><span class="sla-badge">${esc(r.sla)}</span></span></div></div>`;
  });
  h+=`</div>`;
  // escalation
  const esca=(D.coordination&&D.coordination.escalation)||[];
  if(esca.length){
    h+=`<h2 class="sec" style="margin-top:30px">突發狀況 · 三級升級</h2><p class="lead">狀況分級處理，逐級上報不越級亂。</p>`;
    esca.forEach(e=>{
      h+=`<div class="esc"><div class="issue">⚠ ${esc(e.issue)}</div><div class="esc-steps">`+
        `<div class="lv"><b>第一線</b>${esc(e.level1)}</div><div class="arr">→</div>`+
        `<div class="lv"><b>第二級</b>${esc(e.level2)}</div><div class="arr">→</div>`+
        `<div class="lv"><b>第三級 / 總指揮</b>${esc(e.level3)}</div></div></div>`;
    });
  }
  s.innerHTML=h;
}

function renderCoop(){
  const s=$('#coop'); const rows=(D.coordination&&D.coordination.ritualCoops)||[];
  let h=`<h2 class="sec">壇口協作 · 關鍵時刻誰跟誰串</h2><p class="lead">內壇、獻供、普施、神鼓金剛藏王、三皈五戒、菩薩戒正授等時刻，多組如何同時上工、一棒接一棒。</p>`;
  rows.forEach(r=>{
    const gs=(r.groups||[]).map(g=>`<span class="tag">${esc(g)}</span>`).join('');
    h+=`<div class="coop"><div class="mo">🪷 ${esc(r.moment)}</div><div class="gs tags">${gs}</div><div class="fl">${bulFlow(r.flow)}</div></div>`;
  });
  s.innerHTML=h;
}

function renderDepts(){
  const s=$('#depts'); const ds=D.departments||[];
  let h=`<h2 class="sec">各組 SOP</h2><p class="lead">點開每一組，看六階段任務（籌備期→入場場佈→法會→受戒→撤場→結案）、需別組先給(進)、要交付別組(出)、風險對策、檢核清單、KPI。</p>`;
  h+=`<div class="toolbar"><input id="dSearch" placeholder="搜尋部門 / 任務關鍵字…"><button onclick="document.querySelectorAll('#depts .acc').forEach(a=>a.classList.add('open'))" style="font-family:inherit;font-size:15px;padding:9px 14px;border:1px solid var(--line);border-radius:10px;background:#fff;cursor:pointer">全部展開</button><button onclick="document.querySelectorAll('#depts .acc').forEach(a=>a.classList.remove('open'))" style="font-family:inherit;font-size:15px;padding:9px 14px;border:1px solid var(--line);border-radius:10px;background:#fff;cursor:pointer">全部收合</button></div>`;
  h+=`<div id="dList"></div>`;
  s.innerHTML=h;
  const list=$('#dList');
  ds.forEach(d=>{
    const acc=el('div','acc');
    acc.dataset.txt = JSON.stringify(d);
    const badge = d.code ? `<span class="codebadge">${esc(d.code)}</span>` : `<span class="dot"></span>`;
    let inner=`<div class="acc-h">${badge}<h3>${esc(d.name)}</h3><span class="mm">${esc((d.mission||'').split(/[：:]/)[0])}</span><span class="caret">▸</span></div><div class="acc-body">`;
    inner+=`<div class="meta" style="margin-top:12px">執事：組長・指導法師・各小組長（名單以總指揮中心私版為準）</div>`;
    if(d.mission) inner+=`<div class="box" style="margin-top:12px"><h4>本組職掌</h4>${fnBul(d.mission)}</div>`;
    if(d.subgroups&&d.subgroups.length) inner+=`<div class="box" style="margin-top:12px"><h4>下轄小組</h4><div class="tags">`+d.subgroups.map(g=>`<span class="tag">${esc(g)}</span>`).join('')+`</div></div>`;
    // phases
    inner+=`<div class="box" style="margin-top:12px"><h4>六階段任務</h4>`;
    (d.phases||[]).forEach(p=>{
      inner+=`<div class="phase-mini"><div class="pm-h">${esc(p.phase)}</div>`;
      (p.tasks||[]).forEach(t=>{inner+=`<div class="tk"><span class="tkt">${esc(t.time)}</span><span>${bul(t.task)}${t.owner?`<span class="tko">〔${esc(t.owner)}〕</span>`:''}</span></div>`;});
      inner+=`</div>`;
    });
    inner+=`</div>`;
    // io grid
    inner+=`<div class="sop-grid">`;
    inner+=`<div class="box"><h4>◤ 需別組先給（進）</h4>`+((d.inbound||[]).map(x=>`<div class="io"><span class="pill from-p">${esc(x.from)}</span> <span class="flow-arrow">→</span> ${bul(x.what)}<div class="tko">${esc(x.when)} · ${esc(x.channel)}</div></div>`).join('')||'<div class="tko">—</div>')+`</div>`;
    inner+=`<div class="box"><h4>◥ 要交付別組（出）</h4>`+((d.outbound||[]).map(x=>`<div class="io"><span class="flow-arrow">→</span> <span class="pill to-p">${esc(x.to)}</span> ${bul(x.what)}<div class="tko">${esc(x.when)} · ${esc(x.channel)}</div></div>`).join('')||'<div class="tko">—</div>')+`</div>`;
    inner+=`</div>`;
    // risks + checklist
    inner+=`<div class="sop-grid">`;
    inner+=`<div class="box"><h4>⚠ 風險與對策</h4>`+((d.risks||[]).map(r=>`<div class="risk"><span class="r">${esc(r.risk)}</span><div class="m">↳ ${esc(r.mitigation)}</div></div>`).join('')||'<div class="tko">—</div>')+`</div>`;
    inner+=`<div class="box"><h4>✔ 關鍵檢核清單</h4><ul class="ck">`+((d.checklist||[]).map(c=>`<li>${esc(c)}</li>`).join(''))+`</ul>`;
    if(d.kpis?.length) inner+=`<div class="kpi-line">`+d.kpis.map(k=>`<span class="k">${esc(k)}</span>`).join('')+`</div>`;
    inner+=`</div></div>`;
    inner+=`</div>`;
    acc.innerHTML=inner;
    acc.querySelector('.acc-h').onclick=()=>acc.classList.toggle('open');
    list.appendChild(acc);
  });
  $('#dSearch').oninput=e=>{
    const q=e.target.value.trim();
    list.querySelectorAll('.acc').forEach(a=>{
      const hit = !q || a.dataset.txt.includes(q);
      a.style.display = hit?'':'none';
      if(q&&hit) a.classList.add('open');
    });
  };
}

function renderChannels(){
  const s=$('#channels'); const rows=(D.coordination&&D.coordination.channels)||[];
  let h=`<h2 class="sec">通訊頻道配置</h2><p class="lead">無線電頻道 / LINE群組 / 共用雲端 建議分工，讓知會走對管道不塞爆。共 ${rows.length} 個。</p>`;
  h+=`<div class="hcards">`;
  rows.forEach(r=>{
    const color = r.type==='無線電頻道'?'#2b5a86':r.type==='LINE群組'?'#2f6d4f':'#8a5a12';
    const icon = r.type==='無線電頻道'?'📻':r.type==='LINE群組'?'💬':'☁️';
    h+=`<div class="hcard"><div class="ev">${icon} ${esc(r.name)}</div>`+
      `<div style="margin-bottom:8px"><span class="ch-badge" style="color:${color};background:#f7f0e0">${esc(r.type)}</span></div>`+
      `<div class="row"><span class="lbl">用途</span><span>${bul(r.purpose)}</span></div>`+
      `<div class="row"><span class="lbl">成員</span><span class="ch">${enumBul(r.members)}</span></div></div>`;
  });
  h+=`</div>`;
  s.innerHTML=h;
}

function renderManpower(){
  const s=$('#manpower'); const M=window.MANPOWER;
  if(!M){ s.innerHTML='<h2 class="sec">人力編制</h2><p class="lead">人力資料尚未載入（manpower.js）。</p>'; return; }
  const people=M.people||[]; const dr=M.deptRoster||{}; const multi=people.filter(p=>p.count>=2);
  let h=`<h2 class="sec">人力編制 · 關鍵人力（編號制）</h2><p class="lead">為保護個資，人員一律以<b>編號</b>呈現（編號↔姓名對照表只留在承辦人本機，不上傳網路）。範圍：總指揮中心＋各組組長＋指導法師，共 ${people.length} 位；其中 <b style="color:var(--red)">${multi.length} 位身兼多職</b>。</p>`;
  h+=`<div class="kpis"><div class="kpi"><div class="n">${people.length}</div><div class="l">關鍵人力</div></div><div class="kpi"><div class="n">${Object.keys(dr).length}</div><div class="l">部門</div></div><div class="kpi"><div class="n" style="color:var(--red)">${multi.length}</div><div class="l">身兼多職</div></div></div>`;
  h+=`<div class="grid">`;
  Object.keys(dr).forEach(d=>{
    const rows=dr[d];
    h+=`<div class="card"><div class="dept-h"><span class="dot"></span><h3>${esc(d)}</h3></div><div class="meta">關鍵人力 ${rows.length} 位</div><div class="mp-list">`+
      rows.map(r=>`<div class="mp-row"><span class="pid">#${r.id}</span><span class="mp-role">${esc(r.role)}</span></div>`).join('')+`</div></div>`;
  });
  h+=`</div>`;
  h+=`<h2 class="sec" style="margin-top:26px">身兼多職一覽</h2><p class="lead">同一編號出現在多個角色（可能撞班，詳見「人力衝突檢查」）。</p><div class="hcards">`+
    multi.slice().sort((a,b)=>b.count-a.count).map(p=>`<div class="hcard"><div class="ev"><span class="pid">#${p.id}</span>　身兼 ${p.count} 職</div>`+
      `<ul class="bl">`+p.roles.map(r=>`<li>${esc(r.dept)} · ${esc(r.role)}</li>`).join('')+`</ul></div>`).join('')+`</div>`;
  s.innerHTML=h;
}
function renderConflict(){
  const s=$('#conflict'); const M=window.MANPOWER; const C=M&&M.check;
  if(!C){ s.innerHTML='<h2 class="sec">人力衝突檢查</h2><p class="lead">衝突檢查資料尚未載入（manpower.js）。</p>'; return; }
  const V=C.verdicts||[]; const cc=C.counts||{};
  let h=`<h2 class="sec">人力衝突檢查 · workflow 判定</h2><p class="lead">用 workflow 逐一檢查身兼多職者是否時段撞班、能否執行，並對判為「不可行」者做對抗驗證再定案。</p>`;
  h+=`<div class="kpis"><div class="kpi"><div class="n" style="color:var(--red)">${cc.red||0}</div><div class="l">🔴 不可行</div></div><div class="kpi"><div class="n" style="color:var(--amber)">${cc.amber||0}</div><div class="l">🟡 需注意</div></div><div class="kpi"><div class="n" style="color:var(--green)">${cc.green||0}</div><div class="l">🟢 可兼任</div></div><div class="kpi"><div class="n">${cc.multi||0}</div><div class="l">身兼多職</div></div></div>`;
  if(C.observations&&C.observations.length){
    h+=`<div class="card" style="border-color:var(--gold-soft);margin-bottom:20px"><div class="dept-h"><span class="codebadge" style="background:linear-gradient(135deg,#8a5a12,#b8860b)">觀</span><h3>人力總觀察</h3></div><ul class="bl">`+C.observations.map(o=>`<li>${esc(o)}</li>`).join('')+`</ul></div>`;
  }
  const ord=s=>s&&s.indexOf('🔴')===0?0:s&&s.indexOf('🟡')===0?1:2;
  const sorted=V.slice().sort((a,b)=>ord(a.severity)-ord(b.severity));
  h+=`<div class="hcards">`;
  sorted.forEach(v=>{
    const person=(M.people||[]).find(p=>p.id===v.id);
    const badges=(person?person.roles:[]).map(r=>`<span class="tag">${esc(r.dept)}·${esc(r.role)}</span>`).join('');
    const col=(v.severity||'').indexOf('🔴')===0?'var(--red)':(v.severity||'').indexOf('🟡')===0?'var(--amber)':'var(--green)';
    h+=`<div class="hcard" style="border-left:5px solid ${col}"><div class="ev"><span class="pid">#${esc(v.id)}</span>　${esc(v.severity)}${v.downgraded?' <span class="ch">（驗證後降級）</span>':''}</div>`+
      `<div class="tags" style="margin:4px 0 8px">${badges}</div>`+
      (v.conflictWindow&&v.conflictWindow!=='—'?`<div class="row"><span class="lbl">重疊時段</span><span>${esc(v.conflictWindow)}</span></div>`:'')+
      `<div class="row"><span class="lbl">研判</span><span>${bul(v.reason)}</span></div>`+
      `<div class="row"><span class="lbl">建議</span><span>${bul(v.suggestion)}</span></div>`+
      (v.verifyNote?`<div class="row"><span class="lbl">驗證</span><span class="ch">${esc(v.verifyNote)}</span></div>`:'')+
      `</div>`;
  });
  h+=`</div>`;
  s.innerHTML=h;
}
boot();
