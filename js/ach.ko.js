// ===== достижения и статистика. Всё хранится в браузере; проценты игроков берутся из открытого счётчика, только когда игра открыта по сети =====
const ACH_KEY='1993-ach', STATS_KEY='1993-stats', ACH_KASHIN="data:image/png;base64,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";
const ACH=[
 {id:'ost',    nm:'모스크바가 말한다',     d:'오스탄키노를 점령하라'},
 {id:'mer',    nm:'경제상호원조회의 건물',         d:'시청을 최고회의 편으로 끌어온다: 70% 이상'},
 {id:'city',   nm:'모스크바는 우리 편',      d:'모스크바 지지율을 75%로 올린다'},
 {id:'zero',   nm:'제로 옵션',    d:'강습 없이 동시 재선거를 달성한다'},
 {id:'ring',   nm:'돌파',             d:'백악관 주변 봉쇄선을 해제한다'},
 {id:'dep',    nm:'인민대표대회 전원 집결',      d:'건물 안 의원 220명으로 강습을 맞는다'},
 {id:'bar',    nm:'다섯 줄',         d:'다섯 줄 깊이의 바리케이드를 쌓는다'},
 {id:'mil',    nm:'인민 민병', d:'강습에 맞춰 전투원 400명을 내보낸다'},
 {id:'zhupel', nm:'자유주의의 허수아비',  d:'RNE가 건물에 있고 ‘파시스트’라는 낙인이 붙은 상태에서도 지지 않는다'},
 {id:'fluger', nm:'풍향계',             d:'RNE를 건물에 들였다가 내보내고, 지지 않는다'},
 {id:'refuse', nm:'거부',              d:'강습 시작 전까지 크렘린 부대 최소 하나가 명령 집행을 거부하도록 만든다'},
 {id:'tanks',  nm:'조국의 연기는 우리에게 달콤하다', d:'다리 위의 전차를 멈춘다'},
 {id:'alpha',  nm:'경례 완료',       d:'무전으로 ‘알파’를 설득해 떠나게 한다'},
 {id:'parley', nm:'협상가',       d:'크렘린 부대 하나를 강습에서 빠지게 설득한다: 옐친의 전화 후 백기'},
 {id:'meat',   nm:'분쇄기',          d:'강습 측에 400명의 손실을 입힌다'},
 {id:'dark',   nm:'열두 시간',   d:'어두워질 때까지 버틴다'},
 {id:'hold',   nm:'한 발짝도 물러서지 않는다',      d:'어두워질 때까지 버티되, 어느 출입구도 50% 아래로 떨어뜨리지 않는다'},
 {id:'blood',  nm:'적은 피로',       d:'어둠 전에 물리친다: 크렘린 부대가 멈추거나 떠나고, 여러분의 손실은 400 미만'},
 {id:'army',   nm:'군대는 인민과 함께',    d:'승리하고, 국방부와 총참모부를 여러분 편으로 끌어온다'},
 {id:'elect',  nm:'선거',             d:'강습을 격퇴하고 인민대표대회의 조건으로 선거를 얻는다'},
 {id:'kashin', nm:'올레그 카신',         d:'여러분은 1993년을 모두 안다. 다른 모든 업적을 얻으세요'},
];
const achGot=()=>store.get(ACH_KEY)||{};
const achStats=()=>store.get(STATS_KEY)||{games:0,assaults:0,ends:{}};
function achGive(id){ if(!S||S.cheat)return; const g=achGot(); if(g[id]&&g[id]!=='cheat')return; g[id]=Date.now(); store.set(ACH_KEY,g); stat('ach-'+id,1); achToast(id);
  if(id!=='kashin'&&ACH.every(a=>a.id==='kashin'||(g[a.id]&&g[a.id]!=='cheat')))achGive('kashin'); }
let achQ=[],achBusy=0;
function achToast(id){achQ.push(id); if(!achBusy)achNext();}
function achNext(){const id=achQ.shift(), el=$('ach-toast'); if(!id){achBusy=0;el.classList.remove('on');return;} achBusy=1; const a=ACH.find(x=>x.id===id);
  el.innerHTML=`<canvas width="48" height="48"></canvas><div><small>업적</small><b>${a.nm}</b><span>${a.d}</span></div>`; achIcon(el.querySelector('canvas'),id,true); el.classList.add('on');
  try{Sfx.play('paper');}catch(e){} setTimeout(()=>{el.classList.remove('on');setTimeout(achNext,400);},4200);}
// проверка условий раз в секунду, пока идёт партия
function achTick(){ if(!S||S.cheat||screen==='title'||screen==='intro'||S.endId)return; const G=id=>achGive(id);
  if(S.pts.ost>=100)G('ost'); if(S.pts.mer>=70)G('mer'); if(S.city>=75)G('city');
  if(S.flags.ringOff)G('ring'); if(S.bar>=5)G('bar');
  const A=S.A; if(!A||!A.units)return;
  A.minCtl=Math.min(A.minCtl==null?100:A.minCtl,A.ctl.entr,A.ctl.front);
  if(A.r===0&&A.card!=='muster'){ if(deputies(S)>=220)G('dep'); if(S.mil>=400)G('mil'); if(A.units.some(u=>u.st==='refuse'&&u.id!=='alpha'))G('refuse'); }
  const t=A.units.find(u=>u.id==='tanks'); if(A.r>=1&&t.st!=='refuse'&&(t.cur<=3||uMorV(t)<MOR_HALT))G('tanks');
  if(A.alpha==='refuse')G('alpha'); if(A.units.some(u=>u.why==='부대를 이끌고 빠져나갔다'))G('parley'); if(kDead(A)>=400)G('meat');
}
setInterval(()=>{try{achTick();}catch(e){}},1000);
function achEnd(id){ if(!S||S.cheat)return; try{achTickEnd();}catch(e){}
  const st=achStats(); st.games=(st.games||0)+1; if(S.A)st.assaults=(st.assaults||0)+1; st.ends=st.ends||{}; st.ends[id]=(st.ends[id]||0)+1; store.set(STATS_KEY,st);
  const tier=endTier(id), A=S.A, notLost=tier!=='lose';
  if(id==='win_army')achGive('army'); if(id==='elect_deal')achGive('zero'); if(id==='win_elect')achGive('elect');
  if(notLost&&S.fac.rne.n>0&&(S.flags.brand||0)>=1)achGive('zhupel');
  if(notLost&&S.flags.rneWas&&S.fac.rne.n<=0&&S.flags.rneOut)achGive('fluger');
  if(A&&(id==='held'||id==='held_iso')){ if(A.r>=HOURS.length){achGive('dark'); if((A.minCtl==null?100:A.minCtl)>=50&&A.ctl.entr>=50&&A.ctl.front>=50)achGive('hold');}
    else if((A.lost||0)<400)achGive('blood'); }
}
function achTickEnd(){const e=S.endId;S.endId=null;try{achTick();}finally{S.endId=e;}}
// ---------- иконки: пиксельная графика 16x16, рисуется прямоугольниками ----------
const ACH_ICON={
 ost:   [[7,1,2,5,'#8a8170'],[8,0,1,1,'#b3322b'],[6,6,4,2,'#c9c2ad'],[7,8,2,5,'#8a8170'],[5,10,6,1,'#c9c2ad'],[4,13,8,2,'#5a5548'],[2,3,2,1,'#e8a23a'],[12,3,2,1,'#e8a23a'],[1,5,2,1,'#e8a23a'],[13,5,2,1,'#e8a23a']],
 mer:   [[3,2,4,12,'#c9c2ad'],[9,2,4,12,'#c9c2ad'],[7,5,2,9,'#8a8170'],[4,3,2,1,'#2b3446'],[4,5,2,1,'#2b3446'],[4,7,2,1,'#2b3446'],[4,9,2,1,'#2b3446'],[4,11,2,1,'#2b3446'],[10,3,2,1,'#2b3446'],[10,5,2,1,'#2b3446'],[10,7,2,1,'#2b3446'],[10,9,2,1,'#2b3446'],[10,11,2,1,'#2b3446'],[1,14,14,1,'#5a5548']],
 city:  [[1,9,3,6,'#5a5548'],[4,6,3,9,'#8a8170'],[7,10,2,5,'#5a5548'],[9,4,3,11,'#8a8170'],[12,8,3,7,'#5a5548'],[10,1,1,3,'#8a8170'],[5,8,1,1,'#e8a23a'],[5,11,1,1,'#e8a23a'],[10,6,1,1,'#e8a23a'],[10,9,1,1,'#e8a23a'],[13,10,1,1,'#e8a23a'],[2,11,1,1,'#e8a23a']],
 zero:  [[5,2,6,2,'#e9e0c8'],[3,4,2,8,'#e9e0c8'],[11,4,2,8,'#e9e0c8'],[5,12,6,2,'#e9e0c8'],[9,5,2,2,'#b3322b'],[7,7,2,2,'#b3322b'],[5,9,2,2,'#b3322b']],
 ring:  [[4,2,5,2,'#8a8170'],[2,4,2,3,'#8a8170'],[2,9,2,3,'#8a8170'],[4,12,8,2,'#8a8170'],[12,9,2,3,'#8a8170'],[11,3,1,1,'#8a8170'],[10,5,4,1,'#e8a23a'],[12,3,1,5,'#e8a23a'],[6,6,4,4,'#e9e0c8']],
 dep:   [[2,3,2,2,'#e9e0c8'],[5,3,2,2,'#e9e0c8'],[8,3,2,2,'#e9e0c8'],[11,3,2,2,'#e9e0c8'],[2,7,2,2,'#c9c2ad'],[5,7,2,2,'#c9c2ad'],[8,7,2,2,'#c9c2ad'],[11,7,2,2,'#c9c2ad'],[2,11,2,2,'#8a8170'],[5,11,2,2,'#8a8170'],[8,11,2,2,'#8a8170'],[11,11,2,2,'#8a8170'],[1,5,14,1,'#b3322b'],[1,9,14,1,'#b3322b'],[1,13,14,1,'#b3322b']],
 bar:   [[1,2,14,2,'#6b5a3a'],[2,5,13,2,'#8a8170'],[1,8,14,2,'#6b5a3a'],[2,11,13,2,'#8a8170'],[1,14,14,1,'#6b5a3a'],[4,2,1,2,'#3a3226'],[10,2,1,2,'#3a3226'],[6,5,1,2,'#3a3226'],[12,5,1,2,'#3a3226'],[3,8,1,2,'#3a3226'],[9,8,1,2,'#3a3226'],[7,11,1,2,'#3a3226']],
 mil:   [[2,12,3,2,'#6b5a3a'],[4,10,3,2,'#6b5a3a'],[6,8,3,2,'#8a8170'],[8,6,3,2,'#8a8170'],[10,4,3,2,'#8a8170'],[12,2,2,2,'#c9c2ad'],[7,10,2,3,'#3a3226'],[3,3,4,3,'#b3322b'],[3,4,4,1,'#e9e0c8']],
 zhupel:[[2,1,1,14,'#8a8170'],[3,2,11,3,'#1a1c22'],[3,5,11,3,'#e8c23a'],[3,8,11,3,'#e9e0c8'],[3,2,11,1,'#3a3c44']],
 fluger:[[7,4,2,11,'#8a8170'],[4,14,8,1,'#5a5548'],[2,3,10,2,'#e9e0c8'],[12,2,1,4,'#e8a23a'],[13,3,1,2,'#e8a23a'],[14,3,1,1,'#e8a23a'],[1,2,2,1,'#e9e0c8'],[1,5,2,1,'#e9e0c8'],[7,1,2,2,'#b3322b']],
 refuse:[[7,1,2,10,'#8a8170'],[6,1,4,3,'#6b5a3a'],[8,11,1,3,'#c9c2ad'],[3,14,10,1,'#5a5548'],[5,6,6,1,'#3a3226'],[11,3,3,1,'#b3322b'],[12,2,1,3,'#b3322b']],
 tanks: [[2,9,12,3,'#56603f'],[1,12,14,2,'#3a3f2f'],[5,6,5,3,'#6b7650'],[10,7,5,1,'#8a8170'],[2,13,1,1,'#111'],[5,13,1,1,'#111'],[8,13,1,1,'#111'],[11,13,1,1,'#111'],[2,2,2,2,'#b3322b'],[4,4,2,2,'#b3322b'],[12,2,2,2,'#b3322b'],[10,4,2,2,'#b3322b'],[6,3,4,1,'#b3322b']],
 alpha: [[3,1,10,2,'#2b3446'],[2,3,12,7,'#2b3446'],[3,10,10,2,'#2b3446'],[5,12,6,2,'#2b3446'],[7,14,2,1,'#2b3446'],[7,3,2,2,'#e9e0c8'],[6,5,1,6,'#e9e0c8'],[9,5,1,6,'#e9e0c8'],[7,8,2,1,'#e9e0c8']],
 parley:[[3,1,1,14,'#8a8170'],[4,2,9,6,'#e9e0c8'],[13,3,1,4,'#e9e0c8'],[4,8,6,1,'#c9c2ad'],[1,14,6,1,'#5a5548']],
 meat:  [[4,2,8,6,'#e9e0c8'],[3,4,10,3,'#e9e0c8'],[5,8,6,3,'#e9e0c8'],[5,5,2,2,'#1a1c22'],[9,5,2,2,'#1a1c22'],[7,8,2,1,'#1a1c22'],[6,10,1,1,'#1a1c22'],[8,10,1,1,'#1a1c22'],[10,10,1,1,'#1a1c22'],[2,12,3,1,'#b3322b'],[11,12,3,1,'#b3322b'],[5,13,6,1,'#b3322b'],[7,14,2,1,'#b3322b']],
 dark:  [[5,2,6,1,'#8a8170'],[3,3,2,2,'#8a8170'],[11,3,2,2,'#8a8170'],[2,5,1,6,'#8a8170'],[13,5,1,6,'#8a8170'],[3,11,2,2,'#8a8170'],[11,11,2,2,'#8a8170'],[5,13,6,1,'#8a8170'],[3,3,10,10,'#1d2233'],[7,4,2,5,'#e9e0c8'],[7,8,4,1,'#e8a23a']],
 hold:  [[2,2,12,2,'#c9c2ad'],[2,4,2,10,'#c9c2ad'],[12,4,2,10,'#c9c2ad'],[4,4,8,10,'#3a3226'],[6,6,4,5,'#b3322b'],[7,11,2,1,'#b3322b'],[7,7,2,2,'#e9e0c8'],[1,14,14,1,'#5a5548']],
 blood: [[3,3,8,2,'#3a3c44'],[2,5,3,3,'#3a3c44'],[9,5,3,3,'#3a3c44'],[3,8,3,2,'#3a3c44'],[5,10,3,2,'#3a3c44'],[7,12,4,2,'#3a3c44'],[11,11,3,3,'#3a3c44'],[12,1,1,1,'#6b8f4a'],[13,2,1,3,'#6b8f4a'],[14,4,1,2,'#6b8f4a']],
 army:  [[7,1,2,3,'#b3322b'],[6,4,4,2,'#b3322b'],[1,6,14,2,'#b3322b'],[3,8,10,2,'#b3322b'],[4,10,8,2,'#b3322b'],[3,12,3,2,'#b3322b'],[10,12,3,2,'#b3322b'],[7,6,2,3,'#e8c23a']],
 elect: [[2,7,12,7,'#8a8170'],[2,7,12,1,'#c9c2ad'],[5,8,6,1,'#1a1c22'],[6,2,4,6,'#e9e0c8'],[7,3,2,1,'#b3322b'],[7,5,2,1,'#8a8170'],[1,14,14,1,'#5a5548']],
};
function achIcon(cv,id,on){const c=cv.getContext('2d'),k=cv.width/16; c.imageSmoothingEnabled=false; c.fillStyle=on?'#14171f':'#0e0f12'; c.fillRect(0,0,cv.width,cv.height);
  if(id==='kashin'){ if(on){const im=new Image();im.onload=()=>{c.imageSmoothingEnabled=false;c.drawImage(im,0,0,cv.width,cv.height);};im.src=ACH_KASHIN;} else{c.fillStyle='#2a2c33';c.font='bold '+Math.round(cv.width*.6)+'px monospace';c.textAlign='center';c.textBaseline='middle';c.fillText('?',cv.width/2,cv.height/2+2);} return;}
  for(const [x,y,w,h,col] of ACH_ICON[id]||[]){c.fillStyle=on?col:'#2a2c33';c.fillRect(x*k,y*k,w*k,h*k);} }
// ---------- общий счётчик: только по сети, один запрос на путь, кеш на сессию ----------
const ACH_NET={}; let achNetOn=null;
async function achCount(name){ if(name in ACH_NET)return ACH_NET[name];
  // явный период: без него GoatCounter отдаёт закэшированный старый итог
  const r=await fetch('https://game1993.goatcounter.com/counter/'+encodeURIComponent('ev/'+name)+'.json?start=2026-11-20&end=2030-01-01'); const j=await r.json();
  return ACH_NET[name]=parseInt(String(j.count_unique||'0').replace(/\D/g,''),10)||0; }
const endEvName=id=>'end-'+({win:'win',neu:'neutral'}[endTier(id)]||'lose')+'-'+id.replace(/_/g,'-');
const netOk=()=>/^https?:/.test(location.protocol)&&achNetOn!==false;
const pct=(n,t)=>t?(n>0&&n/t*100<1?'<1':Math.round(n/t*100))+'%':'—';
async function achNetFill(){ const e=$('ach-net'); if(!netOk()){ if(e)e.textContent='링크로 게임을 열고 인터넷에 연결되어 있으면 플레이어 비율이 표시된다. 업적은 이 브라우저에 저장된다.'; return; }
  try{const total=await achCount('start'); achNetOn=true;
    if(e)e.textContent='총 플레이 인원: '+fmt(total)+'. 각 업적마다: 플레이어 비율과 획득한 사람 수.'+(total<20?' 아직 데이터가 충분하지 않다.':'');
    const els=[...document.querySelectorAll('#modal-win [data-net]')];
    await Promise.all(els.map(async el=>{try{const n=await achCount(el.dataset.net); el.innerHTML=pct(n,total)+'<small> · '+fmt(n)+'</small>';}catch(e){}}));
  }catch(e){achNetOn=false; {const z=$('ach-net'); if(z)z.textContent='공용 집계는 지금 이용할 수 없다. 업적은 이 브라우저에 저장된다.';}} }
// ---------- экран «Статистика»: все игроки (по сети) и вы (из браузера) ----------
function openStats(){const st=achStats(), g=achGot(), win=$('modal-win'); win.classList.add('full');
  const ids=Object.keys(ENDINGS), nm=id=>id==='fell'?'백악관 점령':ENDINGS[id].h||id, TN={win:'승리',neu:'중립적 결과',lose:'패배'};
  const mine={win:0,neu:0,lose:0}; for(const id in st.ends||{})if(ENDINGS[id])mine[endTier(id)]+=st.ends[id];
  const bar=(k,l,cls)=>`<div class="stb ${cls||''}"><span>${l}</span><div><i data-bar="${k}"></i></div><b data-val="${k}">…</b></div>`;
  const tierBlock=t=>bar('tier-'+t,TN[t],'t-'+t);
  win.innerHTML=`<div class="close xtop">✕ 닫기</div><h2>통계</h2><div class="sub" id="st-net">공용 집계를 불러오는 중…</div>
   <div class="stg"><div><h3 class="sth">모든 플레이어</h3>${bar('start','게임 시작')}${bar('decree','1400호 대통령령을 보았다')}${bar('assault','강습까지 갔다')}
     <h3 class="sth">결말 분포 <small>끝난 판 전체 중 비율</small></h3>${tierBlock('win')}${tierBlock('neu')}${tierBlock('lose')}</div>
    <div><h3 class="sth">당신</h3>
     <div class="stm">플레이한 판<b>${st.games||0}</b></div><div class="stm">강습까지 간 판<b>${st.assaults||0}</b></div>
     <div class="stm">승리<b class="p">${mine.win}</b></div><div class="stm">중립적 결과<b>${mine.neu}</b></div><div class="stm">패배<b class="n">${mine.lose}</b></div>
     <div class="stm">업적<b>${ACH.filter(a=>g[a.id]).length} / ${ACH.length}</b></div>
     <h3 class="sth">당신의 결말</h3>${ids.filter(id=>(st.ends||{})[id]).map(id=>`<div class="stm t-${endTier(id)}">${nm(id)}<b>×${st.ends[id]}</b></div>`).join('')||'<div class="stm">아직 끝난 판이 없다</div>'}
     <div class="stn">업적별 비율은 «업적» 항목에서 보세요. 치트를 쓴 판은 통계에 들어가지 않습니다.</div></div></div>`;
  $('modal').classList.add('on'); win.querySelector('.close').onclick=closeModal; statsFill(ids);
}
async function statsFill(ids){const e=$('st-net'), set=(k,v,w)=>{const a=document.querySelector('#modal-win [data-val="'+k+'"]'),b=document.querySelector('#modal-win [data-bar="'+k+'"]'); if(a)a.textContent=v; if(b)b.style.width=Math.max(0,Math.min(100,w||0))+'%';};
  const blank=t=>{document.querySelectorAll('#modal-win [data-val]').forEach(x=>x.textContent='—'); if(e)e.textContent=t;};
  if(!netOk())return blank('링크로 게임을 열고 인터넷에 연결되어 있으면 전체 통계가 표시된다. 오른쪽은 이 브라우저의 개인 통계다.');
  try{const start=await achCount('start'); achNetOn=true; const [dec,ass]=await Promise.all([achCount('decree'),achCount('assault')]);
    const ev=ids.map(endEvName), cnt=await Promise.all(ev.map(n=>achCount(n).catch(()=>0))), tot=cnt.reduce((a,b)=>a+b,0);
    if(!$('st-net'))return;
    e.textContent='이 집계는 링크로 플레이하는 모든 사람이 공유한다. 판이 아니라 사람을 센다: 각자 한 번씩 계산된다.'+(start<20?' 아직 데이터가 적어 숫자가 크게 흔들린다.':'');
    set('start',fmt(start),100); set('decree',pct(dec,start)+' · '+fmt(dec),start?dec/start*100:0); set('assault',pct(ass,start)+' · '+fmt(ass),start?ass/start*100:0);
    const T={win:0,neu:0,lose:0}; ids.forEach((id,i)=>{T[endTier(id)]+=cnt[i];});
    for(const t in T)set('tier-'+t,pct(T[t],tot)+' · '+fmt(T[t]),tot?T[t]/tot*100:0);
  }catch(x){achNetOn=false; blank('공용 집계를 지금 이용할 수 없다(네트워크 없음, 또는 차단 프로그램이 막음). 오른쪽은 개인 통계다.');} }
function openAch(ch){const g=achGot(), st=achStats(), n=ACH.filter(a=>g[a.id]).length, win=$('modal-win'); win.classList.add('full');
  const tiers={win:0,neu:0,lose:0}; for(const id in st.ends||{})if(ENDINGS[id])tiers[endTier(id)]+=st.ends[id];
  const ends=Object.keys(ENDINGS).map(id=>{const c=(st.ends||{})[id]||0,t=endTier(id);return `<span class="aend t-${t}${c?'':' no'}">${c?(id==='fell'?'백악관 점령':ENDINGS[id].h||id):'???'}${c?' ×'+c:''}</span>`;}).join('');
  win.innerHTML=`<div class="close xtop">✕ 닫기</div><h2>업적 · ${n} / ${ACH.length}</h2><div class="sub" id="ach-net">업적은 이 브라우저에 저장된다. 치트를 쓴 판에서는 업적이 주어지지 않는다.</div>
   <div class="achg">`+ACH.map(a=>`<div class="ach${g[a.id]?' on':''}"><canvas width="64" height="64" data-a="${a.id}"></canvas><div><b>${a.nm}</b><span>${a.d}</span></div><i data-net="ach-${a.id}"></i></div>`).join('')+`</div>
   <h3 class="achh">당신의 통계</h3><div class="achs">판: <b>${st.games||0}</b> · 강습까지: <b>${st.assaults||0}</b> · 승리: <b class="p">${tiers.win}</b> · 중립: <b>${tiers.neu}</b> · 패배: <b class="n">${tiers.lose}</b></div>
   <div class="aes">${ends}</div>`+((ch||cheatOn())?`<div class="achc"><b>치트:</b> <u data-c="all">모두 열기</u> <u data-c="none">초기화</u> <u data-c="toast">알림 띠 보기</u> <span>치트로 연 것은 공용 통계에 들어가지 않는다</span></div>`:'');
  win.querySelectorAll('.achc u').forEach(u=>u.onclick=()=>{const c=u.dataset.c; if(c==='toast'){achToast(ACH[Math.floor(Math.random()*ACH.length)].id);return;}
    const g2=achGot(); if(c==='all'){for(const a of ACH)if(!g2[a.id])g2[a.id]='cheat';} else {for(const k in g2)if(g2[k]==='cheat')delete g2[k]; if(u.dataset.sure){store.set(ACH_KEY,{});openAch(1);return;} }
    store.set(ACH_KEY,g2); openAch(1); if(c==='none'){const b=document.querySelector('.achc u[data-c="none"]'); if(Object.keys(g2).length){b.textContent='초기화, 그리고 실제 획득한 ('+Object.keys(g2).length+')';b.dataset.sure=1;}}});
  win.querySelectorAll('canvas[data-a]').forEach(c=>achIcon(c,c.dataset.a,!!g[c.dataset.a]));
  $('modal').classList.add('on'); win.querySelector('.close').onclick=closeModal; achNetFill();
}
