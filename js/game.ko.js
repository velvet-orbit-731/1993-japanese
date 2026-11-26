// ================= 1993 — game logic =================
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fmt=n=>Math.round(n).toLocaleString('ru-RU');
const MON=['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
const WD=['일요일','월요일','화요일','수요일','목요일','금요일','토요일'];
const dateOf=day=>new Date(1993,8,13+day);                // day 1 = 14 Sep 1993, day 8 = 21 Sep (decree)
const dateStr=day=>{const d=dateOf(day);return d.getDate()+' '+MON[d.getMonth()];};
const DECREE_DAY=8;
const PRATE=5;                                            // Kremlin pressure per night in the crisis (100 = assault)
const GL=window.GAME_LANG||'', SAVE='1993-save-v4'+(GL?'-'+GL:''), CHRON='1993-chron'+(GL?'-'+GL:''), OPTS='1993-opts';
const store={get(k){try{return JSON.parse(localStorage.getItem(k));}catch(e){return null;}},
             set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}},
             del(k){try{localStorage.removeItem(k);}catch(e){}}};

let S=null;           // game state
let screen='title';

function newState(){
  const pts={}; POINTS.forEach(p=>pts[p.id]=p.vs);
  const fac={}; FACTIONS.forEach(f=>fac[f.id]={n:f.n,loy:f.loy,rad:f.rad,room:f.room});
  return {day:1, phase:1, leg:60, ppl:800, mil:0, gun:150, med:15, sup:5, hope:70, rad:10, pr:0, bar:0, city:45, omon:100, kmed:0,
    pts, fac, away:0, cordon:0, ring:null, did:{}, strike:null, orders:2, used:{}, once:{}, laws:{}, lawCharges:1, flags:{}, fired:{}, appeals:{}, uses:{}, out:{}, st:{},
    sel:'wh', selFac:'kr', view:'map', log:[], chron:[], queue:[], kremlin:null, am:null, A:null};
}

// ---------- effects ----------
function merge(a,b){const o=JSON.parse(JSON.stringify(a||{}));for(const k in b||{}){
  if(k==='pts'){o.pts=o.pts||{};for(const p in b.pts)o.pts[p]=(o.pts[p]||0)+b.pts[p];}
  else if(k==='fac'){o.fac=o.fac||{};for(const f in b.fac){o.fac[f]=o.fac[f]||{};for(const q in b.fac[f])o.fac[f][q]=(o.fac[f][q]||0)+b.fac[f][q];}}
  else o[k]=(o[k]||0)+b[k];}return o;}
const fxOf=(obj)=>merge(merge(obj.fx,obj.dyn?obj.dyn(S):{}),obj.fac?{fac:obj.fac}:{});
function apply(fx){
  for(const k in fx){
    if(k==='pts'){for(const p in fx.pts)S.pts[p]=clamp(S.pts[p]+fx.pts[p],0,100);continue;}
    if(k==='fac'){for(const f in fx.fac){const t=S.fac[f],d=fx.fac[f];
      if(d.n){t.n=Math.max(0,t.n+d.n);const F0=FACTIONS.find(x=>x.id===f);if(F0.kind==='dep')t.n=Math.min(t.n,F0.n);} if(d.loy)t.loy=clamp(t.loy+d.loy,0,10);} continue;}
    if(k==='bar')S.bar=clamp(S.bar+fx.bar,0,5);
    else if(k==='ppl'||k==='gun'||k==='sup'||k==='mil'||k==='med')S[k]=Math.max(0,S[k]+fx[k]);
    else if(k==='leg'&&fx.leg>1&&S.leg>=70)S.leg=clamp(S.leg+Math.ceil(fx.leg/2),0,100); // выше 70 набирать вдвое труднее
    else if(k in S)S[k]=clamp(S[k]+fx[k],0,100);
  }
  if(S.mil>S.gun)S.gun=S.mil; // whoever comes armed brings the weapon along
}
const sg=v=>(v>0?'+':'−')+fmt(Math.abs(v));
function fxText(fx,ctx){
  const out=[];
  for(const k of ['leg','ppl','mil','gun','med','sup','hope','rad','bar','city','omon']){ if(!fx[k])continue; const v=fx[k];
    const good=(k==='rad'||k==='omon')?v<0:v>0; out.push(`<span class="${good?'p':'n'}">${RES_NAMES[k]} ${k==='sup'&&v%1?(v>0?'+':'−')+String(Math.abs(v)).replace('.',','):sg(v)}${k==='sup'?' 일':''}</span>`);}
  if(fx.pts)for(const p in fx.pts){const v=fx.pts[p];if(!v)continue;const nm=POINTS.find(q=>q.id===p).nm.replace(/ ↑.*/,'');
    out.push(`<span class="${v>0?'p':'n'}">${p===ctx?'충성':nm} ${v>=100?'— 우리 편':sg(v)}</span>`);}
  if(fx.fac)for(const f in fx.fac){const d=fx.fac[f], nm=f===ctx?'':FACTIONS.find(F=>F.id===f).sh+': ';
    if(d.n)out.push(`<span class="${d.n>0?'p':'n'}">${nm}${d.n<=-900?'떠나는 중':d.n>0?'+'+d.n+' 명':d.n+' 명'}</span>`);
    if(d.loy)out.push(`<span class="${d.loy>0?'p':'n'}">${nm}${d.loy>=2?'훨씬 충성':d.loy>0?'더 충성':d.loy<=-2?'매우 불만':'불만'}</span>`);}
  if(fx.pr)out.push(S&&S.phase===1?`<span class="${fx.pr>0?'n':'p'}">${fx.pr>0?'의심':'의심이 줄어듦'}</span>`:`<span class="${fx.pr>0?'n':'p'}">${fx.pr>0?'강습이 가까워졌다':'강습이 멀어졌다'}</span>`);
  return out.join(' · ');
}

// ---------- log ----------
function hhmm(){const h=(Math.random()*24)|0,m=(Math.random()*12|0)*5;return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');}
function log(text,cls,tm){S.log.unshift({tm:tm||hhmm(),text,cls:cls||'',day:S.day}); S.log.length=Math.min(S.log.length,40);}

// ---------- sound effects: all synthesised with WebAudio, no files. Silent until the first real click or key press ----------
const Sfx=(function(){let ctx,master,rv,nb,dcurve,armed=false,gk=1;
  const GAIN={click:4,paper:4,thud:2.5,stamp:2.5,phone:3.5,pips:3,teletype:3,crowd:4,alarm:3,fail:4,fire:2,night:1.6,win:1.6,engine:.6,static:1.3};
  const on=()=>!(store.get(OPTS)||{}).mute, R=Math.random;
  // общий тракт: компрессор на выходе и «комната» (свёрточное эхо из затухающего шума), чтобы звук не был сухим писком
  function setup(c){ctx=c;const comp=c.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=5;comp.attack.value=.003;comp.release.value=.2;
    master=c.createGain();master.gain.value=.7;master.connect(comp);comp.connect(c.destination);
    const sr=c.sampleRate,n=sr*2;nb=c.createBuffer(1,n,sr);const d=nb.getChannelData(0);for(let i=0;i<n;i++)d[i]=R()*2-1;
    const m=Math.floor(sr*1.9),ir=c.createBuffer(2,m,sr);for(let ch=0;ch<2;ch++){const x=ir.getChannelData(ch);let lp=0;
      for(let i=0;i<m;i++){const k=i/m;lp+=((R()*2-1)-lp)*(.55-.4*k);x[i]=lp*Math.pow(1-k,3.2)*(i<sr*.012?i/(sr*.012):1);}
      for(const e of [.031,.047,.083,.131]){const j=Math.floor(sr*(e+ch*.004));x[j]+=.5*(1-e*4);}}
    rv=c.createConvolver();rv.buffer=ir;const rg=c.createGain();rg.gain.value=.55;rv.connect(rg);rg.connect(master);
    dcurve=new Float32Array(1024);for(let i=0;i<1024;i++){const v=i/512-1;dcurve[i]=Math.tanh(v*3.5);}}
  function ac(){if(!ctx){try{setup(new (window.AudioContext||window.webkitAudioContext)());}catch(e){return null;}}
    if(ctx.state==='suspended')ctx.resume();return ctx;}
  function out(n,wet){n.connect(master);if(wet){const g=ctx.createGain();g.gain.value=wet;n.connect(g);g.connect(rv);}}
  function env(g,t,dur,vol,att){g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol*gk,t+(att||.004));g.gain.exponentialRampToValueAtTime(.0001,t+dur);}
  function tone(f,t,dur,vol,type,f2,wet,att){const o=ctx.createOscillator(),g=ctx.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);env(g,t,dur,vol,att);o.connect(g);out(g,wet);o.start(t);o.stop(t+dur+.05);return o;}
  function noise(t,dur,vol,type,fr,q,f2,att,wet,drive){const b=ctx.createBufferSource();b.buffer=nb;b.loop=true;const f=ctx.createBiquadFilter();f.type=type||'lowpass';f.frequency.setValueAtTime(fr||1000,t);if(f2)f.frequency.exponentialRampToValueAtTime(f2,t+dur);f.Q.value=q||1;
    const g=ctx.createGain();env(g,t,dur,vol,att);b.connect(f);
    if(drive){const pre=ctx.createGain();pre.gain.value=drive;const w=ctx.createWaveShaper();w.curve=dcurve;f.connect(pre);pre.connect(w);w.connect(g);}else f.connect(g);
    out(g,wet);b.start(t,R()*1.5);b.stop(t+dur+.05);return g;}
  // удар по металлу: несколько негармонических призвуков, верхние гаснут быстрее
  function bell(f,t,dur,vol,wet,ratios){(ratios||[1,2.76,5.4,8.93]).forEach((r,i)=>{if(f*r<15000)tone(f*r*(1+(R()-.5)*.004),t,dur/(1+i*.7),vol/(1+i*.8),'sine',0,wet,.002);});}
  function lfo(param,fr,depth,t,dur){const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=fr;g.gain.value=depth;o.connect(g);g.connect(param);o.start(t);o.stop(t+dur+.05);}
  // «голос»: пила через две форманты, слоги огибающей
  function voice(t,syl,vol,f0,wet,fm){const o=ctx.createOscillator(),g=ctx.createGain(),mix=ctx.createGain();o.type='sawtooth';o.frequency.setValueAtTime(f0,t);
    const F=[[700,1200],[400,2000],[500,900],[300,2300],[600,1000]];const b1=ctx.createBiquadFilter(),b2=ctx.createBiquadFilter();b1.type=b2.type='bandpass';b1.Q.value=6;b2.Q.value=8;
    g.gain.setValueAtTime(.0001,t);let x=t;syl.forEach((d,i)=>{const v=F[(fm||0)+i]||F[i%5];b1.frequency.setValueAtTime(v[0],x);b2.frequency.setValueAtTime(v[1],x);
      o.frequency.linearRampToValueAtTime(f0*(1+(i%2?.06:-.04)),x+d*.5);g.gain.linearRampToValueAtTime(vol*gk,x+d*.25);g.gain.linearRampToValueAtTime(vol*gk*.15,x+d*.9);x+=d;});
    g.gain.linearRampToValueAtTime(.0001,x+.05);o.connect(b1);o.connect(b2);b1.connect(mix);b2.connect(mix);mix.connect(g);out(g,wet);o.start(t);o.stop(x+.1);return x;}
  // один выстрел: щелчок, тело, низкий удар и раскат эха
  function shot(t,v,far){const k=far?.5:1;noise(t,.014,.9*v*k,'highpass',far?500:1100,.7,0,.001,.5);noise(t,.11,.75*v,'bandpass',far?700:1500,.8,far?260:480,.001,.6,3);
    tone(far?120:175,t,.1,.6*v,'sine',55,.3,.001);noise(t+.02,far?.7:.45,.2*v,'lowpass',far?1200:2600,.6,260,.01,.7);}
  const L={
    click:t=>{noise(t,.014,.16,'bandpass',3600,2.5,0,.001);tone(190,t,.035,.14,'sine',85);noise(t+.03,.01,.05,'bandpass',2200,3,0,.001);},    // клавиша тумблера, а не писк
    paper:t=>{noise(t,.28,.07,'highpass',5200,.6,1400,.05);for(let i=0;i<6;i++)noise(t+i*.04+R()*.03,.04+R()*.05,.04+R()*.08,'bandpass',2200+R()*3500,.9,0,.012);},
    thud:t=>{tone(115,t,.26,.5,'sine',42,.2,.002);noise(t,.14,.28,'lowpass',340,.8,0,.002,.2);noise(t,.03,.12,'bandpass',650,4,0,.001);},
    stamp:t=>{L.thud(t);noise(t+.012,.035,.2,'bandpass',2500,2,0,.001,.15);noise(t+.07,.05,.05,'bandpass',1300,3);},
    bolt:t=>{noise(t,.03,.32,'bandpass',2700,6,0,.001,.2);bell(1900,t,.07,.07,.2);noise(t+.03,.1,.06,'bandpass',1100,2,2500,.02);
      noise(t+.17,.04,.4,'bandpass',1800,5,0,.001,.25);bell(1280,t+.17,.11,.09,.25);tone(210,t+.17,.06,.2,'sine',90);},                       // затвор: назад, скольжение, вперёд
    phone:t=>{for(let k=0;k<2;k++)for(let i=0;i<24;i++){const x=t+k*1.55+i*.04+(R()-.5)*.004;bell(i%2?1570:1245,x,.11,.05,.18,[1,2.41,3.93]);noise(x,.006,.035,'bandpass',4200,2,0,.001);}
      tone(55,t,2.6,.012,'sine');},                                                                                                         // две чашки звонка и молоточек, 25 ударов в секунду
    pips:t=>{noise(t,1.9,.012,'bandpass',1600,.7,0,.2);for(let i=0;i<5;i++)tone(1000,t+i*.26,.1,.09,'sine',0,.1,.004);tone(1000,t+1.3,.5,.09,'sine',0,.15,.004);},
    static:t=>{noise(t,1.5,.11,'bandpass',2400,.5,1300,.05);noise(t,1.5,.05,'highpass',5000,.7,0,.1);
      const w=tone(2300,t+.05,1.1,.035,'sine',640,0,.1);lfo(w.frequency,6,45,t,1.3);tone(880,t+.5,.7,.02,'sine',1900,0,.1);
      for(let i=0;i<10;i++)noise(t+R()*1.4,.008+R()*.02,.12+R()*.15,'highpass',4000,.7,0,.001);
      voice(t+.25,[.12,.1,.16,.09,.14,.12],.05,128,0,1);},                                                                                  // эфир: шипение, свист несущей, треск и обрывок голоса
    teletype:t=>{for(let i=0;i<15;i++){const x=t+i*.068+R()*.012;noise(x,.016,.14,'bandpass',2900,3.5,0,.001,.1);tone(150,x,.03,.1,'sine',80);noise(x+.025,.012,.05,'bandpass',1700,4,0,.001);}
      noise(t,1.1,.02,'lowpass',240,.8,0,.05);bell(2150,t+1.08,.6,.05,.3);},                                                              // стук литер, гул мотора, звоночек конца строки
    crowd:t=>{const a=noise(t,3,.15,'bandpass',620,.5,560,.7,.3);lfo(a.gain,.9,.04,t,3);noise(t+.1,2.8,.09,'bandpass',1150,.7,1000,.8,.3);noise(t+.2,2.6,.04,'bandpass',2500,.9,2200,.9,.2);
      for(let b=0;b<4;b++)for(let v=0;v<4;v++)voice(t+.55+b*.5+R()*.04,[.19,.17],.018,140+R()*90,.35,v%3);
      const s=tone(2700,t+1.9,.3,.02,'sine',3200,.4,.03);lfo(s.frequency,18,60,t+1.9,.35);},                                                // гул площади, скандирование в четыре такта, свист
    boom:t=>{noise(t,.05,.9,'highpass',1300,.7,0,.001,.6);noise(t,1.3,.8,'lowpass',950,.7,55,.002,.6,4);tone(92,t,1.1,.75,'sine',27,.3,.002);
      noise(t+.34,1.5,.3,'lowpass',480,.7,50,.02,.7,2);for(let i=0;i<12;i++)noise(t+.45+R()*1.3,.02+R()*.03,.05+R()*.08,'bandpass',900+R()*2600,3,0,.001,.3);},   // выстрел орудия, раскат, осыпь
    burst:t=>{for(let i=0;i<6;i++)shot(t+i*.1+(R()-.5)*.006,.5*(.85+R()*.3));},                                                           // очередь, 600 выстр./мин
    shots:t=>{for(const d of [0,.34,.52,1.15])shot(t+d,.42*(.7+R()*.4),1);const r=tone(2900,t+.6,.3,.02,'sine',850,.5,.01);lfo(r.frequency,30,80,t+.6,.3);},   // одиночные вдали и рикошет
    engine:t=>{const D=2.8,o=ctx.createOscillator(),s=ctx.createOscillator(),f=ctx.createBiquadFilter(),g=ctx.createGain();o.type='sawtooth';s.type='square';
      o.frequency.setValueAtTime(40,t);o.frequency.linearRampToValueAtTime(46,t+1.2);o.frequency.linearRampToValueAtTime(38,t+D);s.frequency.setValueAtTime(20,t);s.frequency.linearRampToValueAtTime(23,t+1.2);s.frequency.linearRampToValueAtTime(19,t+D);
      f.type='lowpass';f.frequency.value=230;f.Q.value=2;g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.3*gk,t+.5);g.gain.linearRampToValueAtTime(.3*gk,t+D-.6);g.gain.linearRampToValueAtTime(.0001,t+D);
      o.connect(f);s.connect(f);f.connect(g);lfo(g.gain,13,.12,t,D);out(g,.15);o.start(t);s.start(t);o.stop(t+D+.05);s.stop(t+D+.05);
      noise(t,D,.22,'lowpass',210,.8,170,.5,.15,2);for(let i=0;i<28;i++)noise(t+.2+i*.088,.022,(i%2?.07:.04)*Math.min(1,i/5),'bandpass',1200+R()*500,3.5,0,.001,.15);
      const q=tone(1950,t+1,.5,.012,'sine',2350,.2,.1);lfo(q.frequency,9,50,t+1,.5);},                                                      // дизель с тактом, лязг траков, скрип катков
    alarm:t=>{for(const d of [1,1.013]){const o=ctx.createOscillator(),f=ctx.createBiquadFilter(),g=ctx.createGain();o.type='sawtooth';o.frequency.setValueAtTime(260*d,t);o.frequency.exponentialRampToValueAtTime(610*d,t+.9);o.frequency.setValueAtTime(610*d,t+1.3);o.frequency.exponentialRampToValueAtTime(300*d,t+2.4);
      f.type='lowpass';f.frequency.value=1700;g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.05*gk,t+.4);g.gain.linearRampToValueAtTime(.05*gk,t+1.8);g.gain.linearRampToValueAtTime(.0001,t+2.4);o.connect(f);f.connect(g);out(g,.35);o.start(t);o.stop(t+2.5);}},   // ручная сирена: вой вверх и вниз
    night:t=>{const B=[.5,1,1.19,1.5,2,2.51,3.01];bell(196,t,3.4,.13,.5,B);bell(196,t+1.7,3,.1,.5,B);const w=noise(t,3.4,.05,'bandpass',420,1.2,300,1.2,.2);lfo(w.gain,.6,.02,t,3.4);},   // башенный колокол и ветер
    fail:t=>{noise(t,.012,.12,'bandpass',2600,3,0,.001);for(let i=0;i<2;i++)tone(425,t+.05+i*.6,.33,.06,'sine',0,0,.01);},                 // короткие гудки «занято»
    win:t=>{const B=[.5,1,1.19,1.5,2,2.51];bell(262,t,2.6,.1,.5,B);bell(392,t+.5,2.4,.09,.5,B);bell(523,t+1,2.6,.09,.5,B);noise(t+.2,2.8,.13,'bandpass',900,.5,1700,1.2,.3);noise(t+.4,2.6,.06,'bandpass',2400,.8,3000,1.3,.3);},   // перезвон и ликование площади
    lose:t=>{tone(84,t,3,.4,'sine',30,.4,.01);noise(t,2.8,.35,'lowpass',520,.7,55,.01,.6,2);noise(t+1.2,1.6,.2,'lowpass',380,.7,50,.02,.7,2);bell(98,t+.3,3,.07,.5,[.5,1,1.19,1.5,2]);},
    fire:t=>{const r=noise(t,2.2,.1,'lowpass',430,.7,360,.4,.15);lfo(r.gain,5,.03,t,2.2);for(let i=0;i<26;i++){const x=t+R()*2;noise(x,.008+R()*.025,.05+R()*.16,'highpass',2200+R()*2500,.7,0,.001);if(i%4===0)tone(320,x,.025,.08,'sine',110);}},
  };
  addEventListener('pointerdown',e=>{if(e.isTrusted)armed=true;if(e.target.closest&&e.target.closest('.act,.aact,.law,.ch,.tabs div,#menu div,.pull,tr[data-o],.nextb,.row,.srow b,.close,.sndb,.fsb,.menub'))play('click');},true);
  addEventListener('keydown',e=>{if(e.isTrusted)armed=true;},true);
  function play(n,delay){if(!armed||!on())return;const c=ac();if(!c||!L[n])return;gk=GAIN[n]||1;try{L[n](c.currentTime+.01+(delay||0));}catch(e){}gk=1;}
  // проверка без колонок: отрисовать звук в память и вернуть пик/громкость/длину
  async function probe(n){const live=[ctx,master,rv,nb,dcurve];const o=new OfflineAudioContext(2,44100*5,44100);setup(o);let err='';gk=GAIN[n]||1;try{L[n](.01);}catch(e){err=String(e);}gk=1;
    const b=await o.startRendering();[ctx,master,rv,nb,dcurve]=live;const d=b.getChannelData(0);let pk=0,sq=0,last=0;for(let i=0;i<d.length;i++){const a=Math.abs(d[i]);if(a>pk)pk=a;sq+=a*a;if(a>.003)last=i;}
    return {n,err,peak:+pk.toFixed(3),rms:+Math.sqrt(sq/Math.max(1,last)).toFixed(3),len:+(last/44100).toFixed(2)};}
  return {play,probe,names:()=>Object.keys(L)};})();
const actSound=t=>/Звон|Запрос|телеграм/i.test(t)?'phone':/Митинг|Собрать|Пикет|Агитац|Перекрыть|обоз/i.test(t)?'crowd':/оруж|штурм|колонн/i.test(t)?'bolt':/баррикад|Запасти/i.test(t)?'thud':/суд|Иск|комисс|переговор/i.test(t)?'stamp':'paper';

// ---------- menu music: plays on the title screen and during the assault, only if music/music.js is present (it is not part of the shared build) ----------
const Music=(function(){let ctx,src,buf,want=false,loading=false;
  const has=()=>typeof MUSIC_B64!=='undefined', on=()=>!(store.get(OPTS)||{}).mute;
  const b2a=b=>{const t=atob(b),u=new Uint8Array(t.length);for(let i=0;i<t.length;i++)u[i]=t.charCodeAt(i);return u.buffer;};
  function load(){if(buf||loading)return;loading=true;try{ctx=ctx||new (window.AudioContext||window.webkitAudioContext)();}catch(e){return;}
    const list=[MUSIC_B64.ogg,MUSIC_B64.mp3].filter(Boolean);(function next(i){if(i>=list.length)return;try{ctx.decodeAudioData(b2a(list[i]),b=>{buf=b;sync();},()=>next(i+1));}catch(e){next(i+1);}})(0);}
  function sync(){const play=want&&on()&&has();
    if(play){load();if(!buf||!ctx)return;if(ctx.state==='suspended')ctx.resume();
      if(!src){src=ctx.createBufferSource();src.buffer=buf;src.loop=true;const g=ctx.createGain();g.gain.value=.5;src.connect(g);g.connect(ctx.destination);src.start();}}
    else if(src){try{src.stop();}catch(e){}src=null;}
    document.querySelectorAll('.sndb').forEach(b=>{b.textContent='♪ 소리: '+(on()?'켜짐':'꺼짐');b.classList.toggle('off',!on());});}
  return {has,on,sync,set(w){want=w;sync();},toggle(){const o=store.get(OPTS)||{};o.mute=!o.mute;store.set(OPTS,o);sync();}};})();
addEventListener('pointerdown',()=>Music.sync());addEventListener('keydown',()=>Music.sync());

// ---------- intro: a slide show before a new game ----------
const INTRO=[
  {pic:['wh'],      st:'모스크바 · 1993', t:'소련이 사라진 지 2년이다. 물가는 자유화되었고, 예금은 타 버렸으며, 공장은 임금 없이 서 있다. 나라는 1978년 RSFSR 헌법에 따라 살아가는데, 그 헌법은 이미 수백 번 고쳐졌다.'},
  {pic:['yeltsin'], st:'대통령',      t:'보리스 옐친은 1991년 6월에 선출되었다. 그는 시장 개혁을 추진하며, 의회가 이를 끝내지 못하게 한다고 믿는다. 강한 대통령이 있는 새 헌법이 필요하다.'},
  {pic:['hasb'],    st:'의회',      t:'인민대표대회와 최고회의는 1990년에 선출되었다. 현행 헌법에 따르면 국가의 최고 권력은 그들의 것이다. 최고회의 의장은 루슬란 하스불라토프로, 어제까지 옐친의 동맹이었다.'},
  {pic:['yeltsin','hasb'], st:'이중 권력', t:'1992년 12월 대회는 가이다르의 총리 임명을 승인하지 않았다. 1993년 3월에는 대통령 파면을 시도했지만 72표가 모자랐다. 이제 모든 법과 모든 법령은 상대방이 뒤집는다.'},
  {pic:['wh'],      st:'4월 25일 · ‘예, 예, 아니요, 예’', t:'국민투표에서 다수가 대통령과 그의 개혁을 지지했다. 그러나 누구에게도 조기 선거는 없을 것이다. 양측 모두 승리를 선언했다.'},
  {pic:['rutskoy'], st:'부통령', t:'알렉산드르 루츠코이는 장군이자 소련 영웅으로, 의회 편으로 넘어갔고 장관들에 관한 폭로 자료 상자들을 약속했다. 9월 1일 옐친은 그를 대통령령으로 해임했다. 최고회의는 이 령이 불법이라고 본다.'},
  {pic:['wh'],      st:'9월 14일',    t:'당신들은 최고회의다. 크라스노프레스넨스카야 강변에 건물이 있고, 의원 265명, 법, 그리고 그 벽 아래 찾아오는 사람들이 있다. 대통령은 군에 ‘결정적인 9월’을 약속했다. 그다음에 무슨 일이 일어날지는 아무도 모른다.'},
];
let introI=0,introN=0,introT=null,introGo=null;
function introStart(go){introGo=go;introI=0;show('intro');introSlide();}
function introSlide(){const sl=INTRO[introI],c=$('in-c'),g=c.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#07070a';g.fillRect(0,0,640,360);
  c.style.animation='none';void c.offsetWidth;c.style.animation='';
  if(sl.pic[0]==='wh')TitleArt.onReady(()=>g.drawImage(TitleArt.calm,0,0));
  else sl.pic.forEach((id,i)=>{const im=new Image(),x=sl.pic.length===1?160:i*320;im.onload=()=>{g.imageSmoothingEnabled=false;g.drawImage(im,x,0,320,360);};im.src=id==='yeltsin'?ASSET_YELTSIN:PEOPLE[id].img||'';});
  Sfx.play('paper');$('in-stamp').textContent=sl.st;$('in-n').textContent=(introI+1)+' / '+INTRO.length;introN=0;clearInterval(introT);
  introT=setInterval(()=>{introN+=2;$('in-txt').textContent=sl.t.slice(0,introN);if(introN>=sl.t.length)clearInterval(introT);},22);}
function introNext(skip){if(screen!=='intro')return;const sl=INTRO[introI];
  if(!skip&&introN<sl.t.length){introN=sl.t.length;clearInterval(introT);$('in-txt').textContent=sl.t;return;}
  clearInterval(introT);introI++;if(skip||introI>=INTRO.length){const f=introGo;introGo=null;f&&f();}else introSlide();}

// ---------- screens ----------
function show(id){screen=id; setTimeout(()=>{if(typeof cheatSync==='function')cheatSync();},0);document.querySelectorAll('.screen').forEach(e=>e.classList.toggle('on',e.id==='s-'+id)); Music.set(id==='title'||id==='assault');
  if(id==='title')TitleArt.start();else TitleArt.stop();}
function showMain(){ if(S.view==='wh'){show('wh');renderWH();}else{show('map');renderMap();} }
function setView(v){S.view=v;hideToast();showMain();}

// ================= TITLE =================
let menuSel=0;
function menuItems(){return [...document.querySelectorAll('#menu div')];}
function renderMenu(){const has=!!store.get(SAVE);
  menuItems().forEach((d,i)=>{d.classList.toggle('sel',i===menuSel);d.classList.toggle('off',d.dataset.m==='cont'&&!has);});
  if(typeof cheatSync==='function')cheatSync();}
// анонимная статистика: window.Stat есть только в публичной копии. Партии с читами концовки и достижения не шлют
function stat(n,once){try{ if(!window.Stat)return; if(S&&S.cheat&&/^(end-|ach-|decree$|assault$)/.test(n))return; once?Stat.once(n):Stat.ev(n);}catch(e){}}
function newGame(){S=newState();S.am=snap();stat('start',1);stat('new');startDay();}
function menuGo(m){
  if(m==='new')introStart(newGame);
  else if(m==='cont'){const s=store.get(SAVE);if(!s)return;S=s;afterLoad();}
  else if(m==='chron')openChron();
  else if(m==='ach')openAch();
  else if(m==='stats')openStats();

}
function applyOpts(){}
menuItems().forEach((d,i)=>{d.onmouseenter=()=>{menuSel=i;renderMenu();};d.onclick=()=>menuGo(d.dataset.m);});

// ================= HUD (shared by the map and the White House screens) =================
const own=v=>v>=65?'vs':v<=35?'kr':'neu';
const OWN_NM={vs:'최고회의 편',kr:'크렘린 편',neu:'두 권력 사이'};
const OWN_COL={vs:'#e0866a',kr:'#7fa0cf',neu:'#c9a25a'};
const snap=()=>({leg:S.leg,dep:deputies(S),ppl:S.ppl,mil:S.mil,gun:S.gun,med:S.med,sup:S.sup});
const pressVoice=()=>whYield(S).med;
const mediaIncome=()=>voiceOf(S,'vs')+pressVoice();
const mediaGain=()=>Math.ceil(mediaIncome()/2);
// battle for Moscow: the outlets on your side against the outlets on the Kremlin's, every night
const kremlinVoice=()=>Math.max(0,voiceOf(S,'kr')-(S.flags.komp>0?3:0));
const moscOut=()=>OUTLETS.filter(o=>(o.id==='mk'||o.id==='echo')&&outSt(S,o)==='vs').length;
const cityShift=()=>clamp(Math.round((mediaIncome()-kremlinVoice())/5)+moscOut(),-1,4);
// how fast the assault approaches: the structures you won over slow the Kremlin down
const prRate=()=>Math.max(2,PRATE-(S.pts.gs>=65?2:0)-(S.pts.mo>=65?1:0)+(S.pts.mvd<=10?1:0)-(S.city>=65?1:0)+(S.city<=25?1:0)+(S.rad>=60?1:0)+(S.rad>=80?1:0)-(S.ppl>=2500?1:0));
// Легитимность за ночь: всё, что известно заранее, в одном месте (HUD показывает прогноз, ночь применяет)
function legDrift(S){const P=[],add=(v,t)=>{if(v)P.push([v,t]);};
  add(whYield(S).leg,'대회의 활동'); add(-(S.phase===2?4:1),S.phase===2?'이중 권력이 길어졌다':'대치에 대한 피로');
  if(kremlinVoice()-mediaIncome()>=6)add(S.phase===2?-2:-1,'크렘린 언론이 당신들보다 더 크다');
  const lm=Math.round((S.city-50)/20); add(lm,lm>0?'모스크바는 당신들 편이다':'모스크바는 반대한다');
  if(S.cordon)add(ringPress(S).leg,'건물이 봉쇄선 안에 있다');
  if(S.phase===2&&deputies(S)<QUORUM)add(-3,'정족수 없음');
  if(S.phase===2&&S.med<5)add(-1,'방송에서 응수할 것이 없다');
  return {v:P.reduce((a,p)=>a+p[0],0),P};}
const pressLeg=S=>OUTLETS.reduce((a,o)=>{const st=outSt(S,o),e=st==='vs'?o.pas:st==='kr'?o.kpas:null;return a+((e&&e.fx.leg)||0);},0);
// давление кольца за ночь; S.hold — что игрок оплачивает, чтобы терпеть
function ringPress(S){const h=S.hold||{}, hv=(S.ring==null?100:S.ring)>=50; return {leg:h.cour?(hv?-2:-1):(hv?-4:-2), hope:h.ration?0:(hv?-3:-2), sup:(h.port||S.flags.gap>0)?0:(hv?.6:.4), med:h.cour?0:(hv?-2:-1), dep:h.cour?0:(hv?4:2)};}
function syncRing(){ if(S.cordon){ if(S.ring==null)S.ring=100; if(S.ring<=0){S.cordon=0;S.ring=null;S.flags.ringOff=1;S.flags.gap=0;S.hold={};apply({hope:5,leg:3});log('봉쇄선이 풀렸다: 사람과 차량이 다시 백악관으로 향한다.');} } else S.ring=null; }
function halve(fx){const o={};for(const k in fx){const v=fx[k]; o[k]=typeof v==='object'?halve(v):(v<0?Math.ceil(v/2):Math.floor(v/2));}return o;}
// лояльность фракций двигается каждую ночь: её тянут издания, которые фракция читает, и общее положение дел
function facDrift(){const out=[]; for(const F of FACTIONS){const f=S.fac[F.id]; f.tr=null; if(F.kind!=='dep'||f.n<=0)continue; let v=0; const up=[],dn=[];
    for(const id of FAC_PRESS[F.id]||[]){const o=OUTLETS.find(x=>x.id===id),st=outSt(S,o); if(st==='vs'){v+=.34;up.push(o.nm+' 당신들 편');} else if(st==='kr'){v-=.34;dn.push(o.nm+' 크렘린 쪽');}}
    const mod=['agr','sm','kol'].includes(F.id);
    if(S.hope>=70){v+=.2;up.push('건물이 성공을 믿는다');} else if(S.hope<45){v-=.3;dn.push('결의가 떨어진다');}
    if(S.cordon&&mod){v-=.25;dn.push('건물이 봉쇄선 안에 있다');}
    if(S.fac.rne.n>0&&mod){v-=.2;dn.push('RNE가 건물 안에 있다');}
    if(S.rad>=60){ if(mod){v-=.3;dn.push('급진파가 마이크를 잡았다');} else{v+=.2;up.push('진지한 대화가 시작됐다');} }
    f.dr=clamp((f.dr||0)+v,-1.6,1.6);
    if(f.dr>=1&&f.loy<10){f.dr-=1;f.loy++;f.tr={d:1,why:up[0]||'일이 진행 중이다'};} else if(f.dr<=-1&&f.loy>0){f.dr+=1;f.loy--;f.tr={d:-1,why:dn[0]||'피로'};}
    if(f.tr)out.push(F.sh+(f.tr.d>0?' ↑':' ↓')+' ('+f.tr.why+')');} return out;}
function renderHud(p){
  $(p+'-day').textContent='제 '+S.day;
  $(p+'-date').textContent=dateStr(S.day).toUpperCase();
  $(p+'-wd').textContent=WD[dateOf(S.day).getDay()]+' · '+PHASE_NM[S.phase];
  const cur=snap();
  const R=[['leg','정통성'],['dep','의원'],['ppl','시민'],['mil','민병대'],['gun','무기'],['med','방송'],['sup','보급']];
  if(S.phase===1)R.splice(3,1);
  $(p+'-res').innerHTML=R.map(([k,nm])=>{const d=Math.round(cur[k]-(S.am?S.am[k]:cur[k]));
    let dl=d>0?`<span class="dlt up">+${fmt(d)}</span>`:d<0?`<span class="dlt dn">−${fmt(-d)}</span>`:'';
    if(k==='med')dl=`<span class="dlt up">+${mediaGain()}/턴</span>`;
    if(k==='gun'&&S.mil>0)dl=`<span class="dlt">남음 ${fmt(freeGuns(S))}</span>`;
    if(k==='dep'){const r=S.depRate||0;dl=`<span class="dlt">${S.away?'−'+S.away+' 이동 중 · ':''}${S.phase===2&&r>0?'정족수 ≈ '+Math.max(0,Math.ceil((cur.dep-QUORUM)/r))+' 일':'265명 중'}</span>`;}
    if(k==='leg'){const f=legDrift(S).v+pressLeg(S);dl=`<span class="dlt ${f<0?'dn':'up'}">밤사이 ${f?sg(f):'0'}</span>`;}
    const warn=(k==='sup'&&S.sup<=2)||(k==='leg'&&S.leg<=20)||(k==='med'&&S.med<10&&S.phase>1)?' warn':'';
    const v=k==='sup'?Math.floor(S.sup)+' 일':fmt(cur[k]);
    return `<div class="r${k==='med'?' click':''}" data-k="${k}"><div class="k"><canvas class="ico" data-i="${k}"></canvas>${nm}</div><div class="v${warn}">${v}${dl}</div></div>`;}).join('');
  drawIcons();
  $(p+'-res').querySelector('[data-k=med]').onclick=openEther;
  $(p+'-res').querySelectorAll('.r:not([data-k=med])').forEach(e=>{e.style.cursor='pointer';e.onclick=openHelp;});
}

// ---------- portraits: stylised photo if we have one, otherwise a silhouette placeholder ----------
const faceCache={};
function drawFace(cv,pid){const P=PEOPLE[pid], c=cv.getContext('2d'), W=cv.width, H=cv.height; c.imageSmoothingEnabled=false;
  c.fillStyle='#17181c';c.fillRect(0,0,W,H);
  if(P&&P.img){const put=im=>{const k=P.crop||[0,0,im.width,im.height];c.drawImage(im,k[0],k[1],k[2],k[3],0,0,W,H);};
    if(faceCache[pid]&&faceCache[pid].complete)put(faceCache[pid]); else{const im=faceCache[pid]=new Image();im.onload=()=>put(im);im.src=P.img;} return;}
  // placeholder: head and shoulders
  const r=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x*W),Math.round(y*H),Math.round(w*W),Math.round(h*H));};
  r(.34,.16,.32,.36,'#3a372f');r(.38,.12,.24,.06,'#3a372f');r(.42,.5,.16,.1,'#33302a');r(.12,.6,.76,.4,'#2e2c27');r(.2,.56,.6,.06,'#2e2c27');
  r(.44,.6,.12,.14,'#4a463d');
}
const faceHTML=(pid,cls)=>`<canvas class="face ${cls||''}" data-p="${pid}" width="28" height="32"></canvas>`;
function drawFaces(root){root.querySelectorAll('canvas.face').forEach(c=>drawFace(c,c.dataset.p));}

// ================= MAP =================
const MAP_LP={wh:'l',mer:'t',mo:'t',gs:'l',smo:'b',mvd:'t',ost:'b',kre:'r'};
function renderMap(){
  renderHud('h');
  // timeline: 14 days; risk = the decree (phase 1) or the rumoured assault date (phase 2)
  const eta=Math.max(1,Math.ceil((100-S.pr)/prRate())), aday=S.phase===1?999:S.day+eta, start=Math.max(1,S.day-9);
  let tl='<div class="lbl px">연대기</div>';
  for(let d=start;d<start+14;d++){const n=dateOf(d).getDate();const cls=d<S.day?'past':d===S.day?'now':(d>=aday&&d<=aday+(S.phase===1?0:1))?'risk':'';
    tl+=`<div class="c ${cls}">${n}${cls==='risk'?' ?':''}</div>`;}
  $('tl').innerHTML=tl;
  // meters
  seg('hope',S.hope); seg('rad',S.rad); seg('city',S.city); $('m-city').textContent=S.city+'%';
  $('m-hope').textContent=S.hope+'%';
  $('m-rad').textContent=S.rad+'%'+(S.rad>=50?' ▲':''); $('m-rad').className=S.rad>=50?'warn':'';
  $('m-a1').textContent=S.phase===1?'크렘린의 의심':'강습까지';
  $('m-a2').textContent=S.phase===1?'백악관은 감시받고 있다':'내무부 소문에 따르면';
  $('m-assault').textContent=S.phase===1?(S.pr>=15?'강함':S.pr>=6?'커지는 중':'약함'):'≈'+eta+' 일';
  $('m-hl').textContent=S.phase===1?'최고회의의 결의':'수호자들의 결의';
  // points
  const map=$('map'); map.querySelectorAll('.pt,.tag').forEach(e=>e.remove());
  for(const p of POINTS){const v=S.pts[p.id];const d=document.createElement('div');
    d.className='pt lp-'+(MAP_LP[p.id]||p.lp||'b')+(p.big?' big':'')+(S.sel===p.id?' sel':'');
    d.style.left=(2+p.x*4)+'px';d.style.top=(p.y*4)+'px';d.style.setProperty('--c',`var(--${own(v)})`);
    const who=PEOPLE[POINT_WHO[p.id]];
    d.innerHTML=`<div class="mk">${p.ic}</div><div class="lb"><div class="pc">${who&&who.img?faceHTML(POINT_WHO[p.id]):''}<div class="pi"><div class="nm">${p.nm.replace(/ ↑.*/,'')}</div>${who?`<div class="wn">${who.nm.split(' ').slice(-1)[0]}</div>`:''}<div class="bar"><i style="width:${v}%"></i></div></div></div></div>`;
    d.querySelector('.mk').onclick=d.querySelector('.pc').onclick=()=>{S.sel=p.id;renderMap();firstLook('p',p.id);};
    map.appendChild(d);}
  syncRing(); const tags=[]; if(S.cordon)tags.push({x:12,y:2,t:'봉쇄선 '+S.ring+(S.flags.gap>0?', 틈이 있다':'')+' ▸ 해제 방법',c:'btn',on:openSiege});
  if(S.flags.noComms)tags.push({x:12,y:7,t:'통신 두절: 전화와 편집국이 끊겼다 ▸',c:'btn red',on:openSiege});
  if(S.strike){const T=STRIKES.find(x=>x.id===S.strike.id);tags.push({x:12,y:S.flags.noComms&&S.cordon?12:(S.flags.noComms||S.cordon)?7:2,t:'옐친의 밤 타격: '+T.nm+(T.cover(S)?' · 막음':' · 막지 못함')+' ▸',c:'btn'+(T.cover(S)?'':' red'),on:openStrike});}
  if(S.phase>1&&S.rad>=40)tags.push({x:84.5,y:95.5,t:'충돌',c:'red'});
  for(const tg of tags){const d=document.createElement('div');d.className='tag '+tg.c;d.textContent=tg.t;d.style.left=(tg.x*4-40)+'px';d.style.top=(tg.y*4+4)+'px';if(tg.on)d.onclick=tg.on;map.appendChild(d);}
  drawMapDynamic({cordon:S.cordon,crowds:[[84,76,Math.round(6+S.rad*.6),'#c0473a'],[78,50,Math.round(Math.min(60,(S.ppl+S.mil)/80)),'#c0473a'],[88,79,S.phase===1?0:S.cordon?24:12,'#7fa0cf']]});
  renderTarget(); drawFaces($('s-map'));
  // log
  $('log').innerHTML=S.log.slice(0,3).map((l,i)=>`<div class="${i===0&&l.day===S.day?'new ':''}${l.cls}"><span class="tm">${l.day===S.day?l.tm:'어제'}</span>${l.text}</div>`).join('')||'<div>아침. 명령을 기다린다.</div>';
  // buttons
  $('laws-n').textContent='가능: '+lawsAvail(); $('b-laws').classList.toggle('none',!lawsAvail());
  $('orders').textContent='ENTER · 명령: '+S.orders;
}
const lawsAvail=()=>Math.min(S.lawCharges,LAWS.filter(l=>inPh(l)&&!S.laws[l.id]).length);
function seg(id,v){const e=$(id);e.innerHTML='';const on=Math.round(v/5);for(let i=0;i<20;i++){const s=document.createElement('i');if(i<on)s.className='on';e.appendChild(s);}}

// actions available on a point in the current phase: [{a, i}] (i = index in ACTIONS[pid], used as a stable key)
const inPh=o=>!o.ph||o.ph.includes(S.phase);
const actsOf=pid=>ACTIONS[pid].map((a,i)=>({a,i})).filter(o=>inPh(o.a)).slice(0,3);
// influence inflation: pressing the same button again and again gives less, then backfires
const INFL=[1,.7,.4,.15,-.3];
const inflOf=(pid,i)=>INFL[Math.min(INFL.length-1,(S.uses&&S.uses[pid+i])||0)];
// legitimacy = chance that an order sent outside the building is actually carried out
const execChance=pid=>pid==='wh'?1:clamp(.2+S.leg*.008-(S.flags.noComms?.15:0),.1,1);
function actFx(pid,i){const a=ACTIONS[pid][i], fx=fxOf(a), k=inflOf(pid,i);
  if(fx.pts)for(const q in fx.pts){const d=fx.pts[q];if(d>0&&d<100){const v=d*(100-S.pts[q])/(q==='mo'||q==='gs'?90:60)*k;fx.pts[q]=k<0?Math.min(-1,Math.round(d*k)):Math.max(1,Math.round(v));}}
  if(!a.dyn&&k<1)for(const q of ['hope','ppl','leg','city','med'])if(fx[q]>0)fx[q]=Math.max(q==='ppl'?10:1,Math.round(fx[q]*Math.max(.15,k)));
  return fx;}
const lawFx=l=>{const fx=fxOf(l), m=.5+S.leg/100; for(const q of ['leg','hope','ppl','med','gun','city'])if(fx[q]>0)fx[q]=Math.max(1,Math.round(fx[q]*m)); return fx;};
function actState(pid,i){const a=ACTIONS[pid][i];
  if(a.once&&S.once[pid+i])return '이미 완료';
  if(S.used[pid+i])return '오늘 이미 함';
  if(a.phone&&S.flags.noComms)return '전화 차단';
  if(S.cordon&&pid!=='wh'&&!a.phone&&!/оцеплением/.test(a.t)&&!(S.flags.gap>0||S.flags.tunnel))return '봉쇄선: 철조망을 넘을 수 없다';
  if(a.req){const r=a.req(S);if(r!==true)return r;}
  if(a.dep&&deputies(S)-S.away<a.dep)return '자유로운 의원이 부족하다';
  if(!S.orders)return '아침까지 명령 없음';
  return true;}
function renderTarget(){
  const p=POINTS.find(q=>q.id===S.sel), v=S.pts[p.id], o=own(v);
  const acts=actsOf(p.id).map(({a,i},n)=>{const st=actState(p.id,i);
    const f0=actFx(p.id,i), kf=inflOf(p.id,i);
    let cost=a.chance?fxText(a.cost||{},p.id):fxText(f0,p.id);
    if(a.chance&&!cost)cost=fxText(a.ok,p.id);
    if(a.dep)cost=`의원: ${a.dep}`+(cost?' · '+cost:'');
    if(!a.chance&&kf<1)cost+=(cost?' · ':'')+`<span class="risk">${kf<0?'그들은 더 이상 당신들 말을 듣지 않는다':'식상해졌다: 효과 '+Math.round(kf*100)+'%'}</span>`;
    if(a.risk)cost+=(cost?' · ':'')+`<span class="risk">${a.risk}</span>`;
    if(st!==true)cost=`<span class="risk">${st}</span>`;
    return `<div class="act${st!==true?(S.used[p.id+i]||S.once[p.id+i]?' done':' off'):''}" data-i="${i}"><span class="k">${n+1}</span><span class="t">${a.t}</span><span class="cost">${cost}</span></div>`;}).join('');
  const W=PEOPLE[POINT_WHO[p.id]];
  $('target').innerHTML=`<div class="who">${faceHTML(POINT_WHO[p.id],'big')}<div><h3>${p.full}</h3>
    <div class="own"><b>${W.nm}</b>, ${W.role}</div>
    <div class="own">${S.phase===1?'분위기':'통제'}: <span style="color:${OWN_COL[o]}">${OWN_NM[o]}</span></div></div></div>
    <div class="split"><div class="a" style="width:${v}%"></div><div class="b" style="width:${100-v}%"></div></div>
    <div class="split-l"><span>최고회의 ${v}%</span><span>크렘린 ${100-v}%</span></div>
    <div class="facts">${(T=>T?`<span class="${tugSide(v)==='vs'?'p':'n'}">지금 매일 밤: ${T.t}${fxText(T.fx)?' ('+fxText(T.fx).replace(/<[^>]+>/g,'')+')':''}${T.ph&&S.phase<T.ph?' — 위기 시작 이후':''}</span><br>`:POINT_TUG[p.id]?'65%부터는 매일 밤 당신들을 위해 일하고, 35%까지 떨어지면 크렘린을 위해 일한다.<br>':'')(POINT_TUG[p.id]&&tugSide(v)&&POINT_TUG[p.id][tugSide(v)])}${(p.id==='mo'||p.id==='gs')&&S.phase===2?`강습 때 ${p.id==='mo'?'전차':'차량화보병'}: <span style="color:var(--paper)">${v>=65?'나서지 않는다':v>=45?'절반 병력으로 나선다':'명령을 이행한다'}</span> (45부터 흔들리고, 65부터 거부). `:''}${p.id==='mvd'&&S.phase===2?`<span style="color:var(--paper)">OMON: 준비 태세 ${S.omon==null?100:S.omon}%</span> (60 이하에서는 흔들리고, 30 이하에서는 나서지 않는다). `:''}${p.id==='wh'?'대회가 이곳에서 열린다. 계파와 최고회의의 일은 ‘백악관’ 화면에 있다.':''}${p.id!=='wh'?`<span style="color:var(--paper)">명령 이행: ${Math.round(execChance(p.id)*100)}%</span>${S.flags.noComms?' (통신 두절: −15%)':''}`:''}</div>
    <div class="acts">${acts}</div>`;
  $('target').querySelectorAll('.act').forEach(e=>e.onclick=()=>doAction(p.id,+e.dataset.i));
}
function doAction(pid,i){
  if(i===undefined||actState(pid,i)!==true)return;
  const a=ACTIONS[pid][i]; let fx, txt; S.uses=S.uses||{};
  if(Math.random()>execChance(pid)){S.orders--; S.used[pid+i]=1; log(POINTS.find(q=>q.id===pid).nm.replace(/ ↑.*/,'')+': 최고회의의 명령이 이행되지 않았다. 정통성이 부족하다.','bad'); Sfx.play('fail'); S.st=S.st||{}; S.st.fail=(S.st.fail||0)+1; save(); renderMap(); return;}
  Sfx.play(actSound(a.t));
  if(a.chance){const ok=Math.random()<a.chance(S); fx=ok?a.ok:a.fail; txt=ok?a.okLog:a.failLog; log(txt,ok?'':'bad');}
  else{fx=actFx(pid,i); S.uses[pid+i]=(S.uses[pid+i]||0)+1; txt=POINTS.find(q=>q.id===pid).nm.replace(/ ↑.*/,'')+': '+a.t.toLowerCase()+'.'; log(txt);}
  apply(fx); S.orders--; S.used[pid+i]=1; S.did[pid]=1; if(a.once)S.once[pid+i]=1; if(a.dep)S.away+=a.dep;
  if(checkLose())return;
  save(); renderMap();
}

// ---------- decrees ----------
function openLaws(){
  const n=S.lawCharges;
  $('modal-win').innerHTML=`<h2>최고회의 결의</h2>${resStrip('law')}<div class="sub">${n?'통과 가능: '+n+'. 새 결의는 이틀에 한 번. 정통성이 높을수록 결의가 강하게 작용한다(현재 ×'+(.5+S.leg/100).toFixed(1)+').':'오늘은 통과시킬 수 없다. 새 결의는 이틀에 한 번이다.'}</div>`+
    LAWS.filter(inPh).map(l=>`<div class="law${S.laws[l.id]?' done':!n?' lock':''}" data-id="${l.id}"><div class="t">${l.t}</div><div class="d">${l.d}</div><div class="e">${S.laws[l.id]?'통과됨':(!n?'<span class="n">쓸 수 있는 결의 없음: 새 결의는 이틀에 한 번</span> · ':'')+fxText(lawFx(l))}</div></div>`).join('')+
    `<div class="close">ESC — 닫기</div>`;
  $('modal').classList.add('on');
  $('modal-win').querySelectorAll('.law').forEach(e=>e.onclick=()=>{const l=LAWS.find(x=>x.id===e.dataset.id);
    if(S.laws[l.id]||!S.lawCharges)return; Sfx.play('stamp'); S.laws[l.id]=1;S.lawCharges--;S.did.law=1; if(l.flag)S.flags[l.flag]=1; apply(lawFx(l));
    log('결의 통과: «'+l.t+'».'); closeModal(); if(checkLose())return; save(); showMain();});
  $('modal-win').querySelector('.close').onclick=closeModal;
}
// ---------- media: channels bring Эфир every night, appeals spend it ----------
let etherSel=null;
function outWayState(o,k){const W=OUT_WAYS[k]; if(S.appeals.pull)return '오늘 이미 편집국과 작업했다'; return W.req(S,o);}
function outWin(o,k){const W=OUT_WAYS[k]; if(outWayState(o,k)!==true||outLocked(S,o))return; const st=outSt(S,o);
  apply(W.cost(o)); if(W.order)S.orders--; if(W.run)W.run(S); S.appeals.pull=1; S.did.media=1; Sfx.play(k==='p'?'crowd':k==='z'?'stamp':'paper');
  if(W.chance&&Math.random()>W.chance){apply({city:-3}); log('방송: '+o.nm+' — 압박이 실패했다. 편집국은 ‘폭도’에 관해 쓴다.');}
  else{S.out[o.id]=st==='kr'?'neu':'vs'; log('방송: '+o.nm+(st==='kr'?' 더 이상 크렘린의 목소리로 노래하지 않는다.':' 이제 최고회의에 발언권을 준다.'));}
  save(); showMain(); openEther();}
function outActState(o,a,key){if(S.flags.noComms&&o.id!=='radio'&&o.id!=='for')return '통신 두절'; if(S.appeals[key])return '오늘 이미 있었다'; if(S.med<a.cost)return '필요: '+a.cost+' 방송'; return true;}
function outAct(o,a,key){if(outActState(o,a,key)!==true)return; Sfx.play(/echo|radio|ost|pch|600|for/.test(o.id)?'pips':'teletype'); S.med-=a.cost; S.appeals[key]=1; S.did.media=1; apply(fxOf(a)); if(a.run)a.run(S); log(o.nm+': '+a.t.toLowerCase()+'.'); save(); showMain(); openEther();}
const UNIT_SH={tanks:'전차',taman:'차량화보병',vv:'내무군',omon:'OMON',alpha:'‘알파’'};
function finTxt(fx){if(!fx)return '';const o=[],pc=k=>(k<1?'−':'+')+Math.round(Math.abs(1-k)*100)+'%';
  if(fx.air)o.push('방송 '+sg(fx.air)); if(fx.hope)o.push('결의 '+sg(fx.hope)); if(fx.inc)o.push('+'+fx.inc+' 명'); if(fx.ppl)o.push('시민 '+sg(fx.ppl));
  if(fx.mil)o.push('전투원 '+sg(fx.mil)); if(fx.ctl)o.push('출입구 '+sg(fx.ctl)); if(fx.all)o.push('압박 '+pc(fx.all));
  if(fx.u)for(const k in fx.u)if(fx.u[k]!==1)o.push(UNIT_SH[k]+' '+pc(fx.u[k])); return o.join(', ');}
function openEther(){
  const inc=mediaIncome(), kv=kremlinVoice(), dc=cityShift();
  let o=OUTLETS.find(x=>x.id===etherSel); if(!o){o=OUTLETS.find(x=>outSt(S,x)==='vs'&&x.act)||OUTLETS[0]; etherSel=o.id;}
  const SN={vs:'최고회의 편',neu:'중립',kr:'크렘린 편',off:'폐쇄됨'}, ord={vs:0,neu:1,kr:2,off:3};
  const rows=OUTLETS.slice().sort((a,b)=>ord[outSt(S,a)]-ord[outSt(S,b)]||b.r-a.r).map(x=>{const st=outSt(S,x), fv=(x.pas&&fxText(x.pas.fx))||'', fk=(x.kpas&&fxText(x.kpas.fx))||'', pl=t=>t.replace(/<[^>]+>/g,'');
    const can=st!=='vs'&&st!=='off'&&!outLocked(S,x), fresh=st==='vs'&&x.act&&!S.appeals['o'+x.id];
    return `<tr class="s-${st}${etherSel===x.id?' sel':''}" data-o="${x.id}"><td class="nm">${x.nm}</td><td class="r">${x.r}</td><td class="st">${SN[st]}${st!=='vs'&&st!=='off'?(can?'':' · 점령 불가'):''}</td><td>${x.aud||''}</td>
      <td class="${st==='vs'?'':'dim'}">${x.act?x.act.t+(fresh?' <i>●</i>':''):''}</td>
      <td class="${st==='vs'?'':'dim'}">${st==='vs'?fv:pl(fv)}</td><td class="${st==='kr'?'':'dim'}">${st==='kr'?fk:pl(fk)}</td></tr>`;}).join('');
  const st=outSt(S,o); let det=`<div class="odet"><div class="ph">매체 · ${st==='vs'?'당신 쪽: 지시하기 (하루 한 번)':st==='off'?'작동하지 않음':'어떻게 끌어올지 (하루 한 번'+(S.appeals.pull?', 이미 했다':'')+')'}</div><div class="oh"><b>${o.nm}</b> <span>도달 ${o.r} · ${SN[st]}. ${o.about||''}</span></div><div class="obtn">`;
  if(st==='vs'){det+=[['o'+o.id,o.act],['p'+o.id,o.act2]].filter(x=>x[1]).map(([key,a])=>{const s2=outActState(o,a,key);return `<div class="law oact${s2!==true?' lock':''}" data-k="${key}"><div class="t">${a.t} <span class="cst">방송 −${a.cost}</span></div><div class="e">${s2===true?[fxText(fxOf(a)),a.e].filter(Boolean).join(' · '):`<span class="n">${s2}</span>`}</div></div>`;}).join('');}
  else if(st==='off')det+=`<div class="oa n">지금은 작동하지 않는다.</div>`;
  else if(outLocked(S,o))det+=`<div class="oa n">끌어올 수 없다.</div>`;
  else det+=(o.ways||'').split('').map(k=>{const W=OUT_WAYS[k], s2=outWayState(o,k), c=fxText(W.cost(o))||(k==='z'?'결의':'');return `<div class="law oway${s2!==true?' lock':''}" data-w="${k}"><div class="t">${W.t} <span class="cst">${c||'명령'}</span></div><div class="e">${s2===true?W.d(o)+(st==='kr'?'. 중립이 된다':'. 당신들 편이 된다'):`<span class="n">${s2}</span>`}</div></div>`;}).join('');
  det+='</div></div>';
  const win=$('modal-win'); win.classList.add('wide');
  win.innerHTML=`<h2>방송 · 모스크바를 위한 싸움</h2>
   <div class="tug"><span class="l">최고회의 편 ${S.city}%</span><div class="tb"><i style="width:${S.city}%"></i></div><span class="r">크렘린 편 ${100-S.city}%</span></div>
   ${resStrip('med')}
   <div class="sub">당신들의 목소리 <b style="color:var(--ok)">${inc}</b>, 크렘린의 <b style="color:#7fa0cf">${kv}</b>: 모스크바는 밤사이 <b class="${dc<0?'n':'p'}">${dc?sg(dc):'변화 없음'}</b>. 모스크바의 지렛대: ‘MK’와 ‘메아리’ (당신들 것 하나마다 밤마다 +1, 지금 +${moscOut()}), 아래의 캠페인, 아침 신문의 반박. 표에서 매체를 고르십시오.${S.flags.noComms?' <span class="n">통신 두절: 건물 무전, 외국인, 안으로 들어온 사람들만 작동한다.</span>':''}${S.kmed?' <span class="n">밤사이 크렘린이 전파를 때렸다.</span>':''}</div>
   <table class="otab"><tr><th>매체</th><th>도달</th><th>소유</th><th>영향 대상</th><th>당신 쪽일 때 하는 일</th><th>당신 쪽인 동안 매 턴</th><th>크렘린 쪽인 동안</th></tr>${rows}</table>
   <div class="eth3">${det}<div><div class="ph">공통 캠페인 · 매체와 무관, 방송을 소모 (지금 ${fmt(S.med)})</div><div class="app2 a1">`+
   APPEALS.filter(inPh).map(a=>{const nc=S.flags.noComms&&a.id!=='foreign', used=S.appeals[a.id]||nc, poor=S.med<a.cost;
     return `<div class="law gen${nc?' lock':used?' done2':poor?' lock':''}" data-id="${a.id}"><div class="t">${a.t} <span class="cst">방송 −${a.cost}</span></div><div class="e">${nc?'<span class="n">통신 없음</span>':used?'오늘 이미 있었다':poor?'<span class="n">방송 부족: 필요 '+a.cost+'</span>':[fxText(fxOf(a)),a.e].filter(Boolean).join(' · ')}</div></div>`;}).join('')+
   `</div></div></div><div class="close xtop">✕ 닫기</div>`;
  $('modal').classList.add('on');
  win.querySelectorAll('tr[data-o]').forEach(e=>e.onclick=()=>{etherSel=e.dataset.o;openEther();});
  win.querySelectorAll('.oway').forEach(e=>e.onclick=()=>outWin(o,e.dataset.w));
  win.querySelectorAll('.oact').forEach(e=>e.onclick=()=>{const key=e.dataset.k;outAct(o,key[0]==='o'?o.act:o.act2,key);});
  win.querySelectorAll('.law.gen').forEach(e=>e.onclick=()=>{const a=APPEALS.find(x=>x.id===e.dataset.id);
    if(S.appeals[a.id]||S.med<a.cost||(S.flags.noComms&&a.id!=='foreign'))return; S.med-=a.cost; S.appeals[a.id]=1; S.did.media=1; apply(fxOf(a)); if(a.run)a.run(S); if(a.id==='deny')S.kmed=0; log('방송: '+a.t.toLowerCase()+'.'); save(); showMain(); openEther();});
  win.querySelector('.close').onclick=closeModal;
}
function siegeState(i){const a=SIEGE[i]; if(a.once&&S.flags[a.once])return '이미 완료'; const r=a.req(S); if(r!==true)return r; if(!S.orders)return '아침까지 명령 없음'; return true;}
function openSiege(){ syncRing();
  const win=$('modal-win'); win.classList.add('wide');
  const L=SIEGE.map((a,i)=>({a,i,st:siegeState(i)})), can=x=>x.st===true;
  const card=({a,i,st})=>`<div class="law${st===true?'':st==='이미 완료'?' done2':' lock'}" data-i="${i}"><div class="t">${a.t} <span class="cst">${[a.ring?'<span class="p">봉쇄선 −'+Math.min(a.ring,S.ring||0)+'</span>':'',fxText(a.fx)].filter(Boolean).join(' · ')}</span></div><div class="e">${st===true?a.d:st==='이미 완료'?'이미 완료':`<span class="n">${st}</span>`}</div></div>`;
  const grp=(t,l)=>l.length?`<div class="ph">${t}</div><div class="sg2">${l.map(card).join('')}</div>`:'';
  const ringL=L.filter(x=>x.a.ring&&x.a.ring<100), sum=ringL.filter(can).reduce((a,x)=>a+x.a.ring,0), oth=L.filter(x=>!x.a.ring||x.a.ring>=100).filter(x=>S.cordon||!/кольца нет/.test(x.st));
  win.innerHTML=`<h2>봉쇄${S.cordon?' · 봉쇄선 '+S.ring+' / 100':''}</h2>${resStrip('ord')}${S.cordon?`<div class="tug"><span class="l">해제 ${100-S.ring}</span><div class="tb"><i style="width:${100-S.ring}%"></i></div><span class="r">남음 ${S.ring}</span></div>`:''}
   <div class="sub">${S.cordon?(RP=>'오늘 밤 봉쇄선: <span class="n">정통성 '+RP.leg+(RP.hope?', 결의 '+RP.hope:'')+(RP.med?', 방송 '+RP.med:'')+(RP.sup?', 보급 −'+String(RP.sup).replace('.',',')+' 일':'')+(RP.dep?', 추가로 '+RP.dep+' 명의 의원이 떠난다':'')+'</span>, 사람들이 오지 않고, 철조망을 넘을 수 없다. '+(S.ring>=50?'50 미만이면 압박이 약해진다. ':'봉쇄선이 약해졌다: 압박이 약하다. ')+'매일 밤 2씩 조여진다. <b style="color:var(--paper);font-weight:400">해제까지 남은 '+S.ring+'; 지금 열린 길은 −'+sum+'.</b>'+(S.flags.gap>0?' <span class="p">틈이 있다: 앞으로 '+S.flags.gap+' 밤.</span>':''))(ringPress(S)):'봉쇄선 없음. 여기서 통신과 전기를 복구하고 있다.'}
   ${S.flags.noComms?' <span class="n">통신 두절.</span>':''}${S.flags.noPower?' <span class="n">시청이 전기와 수도를 끊었다.</span>':''}</div>`+
   (S.cordon?`<div class="ph">견디며 치르기 · 매일 밤, 명령은 소모되지 않으며 취소할 수 있다</div><div class="sg3">`+HOLDS.map(H=>{const on=(S.hold||{})[H.id],c=H.can(S);return `<div class="law hold${on?' on2':c!==true?' lock':''}" data-h="${H.id}"><div class="t">${H.t} <span class="cst">밤마다 ${fxText(H.cost)}</span></div><div class="e">${on?'<span class="p">✓ 켜짐.</span> '+H.d+'. 누르면 취소':c!==true?`<span class="n">${c}</span>`:H.d}</div></div>`;}).join('')+'</div>':'')+
   (S.cordon?grp('봉쇄선을 부분적으로 걷기 · 지금 열림 · 행동마다 명령 1회 소모',ringL.filter(can))+grp('봉쇄선을 부분적으로 걷기 · 지금은 닫힘 (무엇이 부족한지 보여 줌)',ringL.filter(x=>!can(x))):'')+
   grp(S.cordon?'돌파, 우회, 통신과 전기':'통신과 전기',oth.filter(can).concat(oth.filter(x=>!can(x))))+`<div class="close xtop">✕ 닫기</div>`;
  $('modal').classList.add('on');
  win.querySelectorAll('.law.hold').forEach(e=>e.onclick=()=>{const H=HOLDS.find(x=>x.id===e.dataset.h); S.hold=S.hold||{}; if(!S.hold[H.id]&&H.can(S)!==true)return; S.hold[H.id]=S.hold[H.id]?0:1; Sfx.play('bolt'); save(); showMain(); openSiege();});
  win.querySelectorAll('.law[data-i]').forEach(e=>e.onclick=()=>{const i=+e.dataset.i,a=SIEGE[i]; if(siegeState(i)!==true)return; S.orders--;
    Sfx.play(/силой/.test(a.t)?'burst':/рацию/.test(a.t)?'static':/москвич/.test(a.t)?'crowd':/Патриарх/.test(a.t)?'night':'bolt');
    if(a.chance&&Math.random()>a.chance){apply(a.fail);log(a.failLog,'bad');} else{apply(a.fx);a.run(S);if(a.once)S.flags[a.once]=1;if(a.ring&&S.ring!=null)S.ring=Math.max(0,S.ring-a.ring);log(a.okLog);syncRing();}
    save(); if(checkLose())return; showMain(); openSiege();});
  win.querySelector('.close').onclick=closeModal;
}
// историческая справка: один раз, при первом нажатии на силу или фракцию; после «ОК» больше не показывается
function firstLook(kind,id){S.seen=S.seen||{}; const key=kind+id; if(S.seen[key])return; const P=kind==='p'?POINTS.find(x=>x.id===id):FACTIONS.find(x=>x.id===id), txt=kind==='p'?(P.why?P.why+'<br><br>'+((S.phase===1&&P.facts1)||P.facts).join(' '):''):FAC_WHY[id]; if(!txt)return;
  S.seen[key]=1; save(); const who=kind==='p'?POINT_WHO[id]:FAC_WHO[id], W=PEOPLE[who];
  $('modal-win').classList.remove('wide');
  $('modal-win').innerHTML=`<h2>${kind==='p'?P.full:P.nm.replace(/"/g,'«').replace(/«([^«]*)«/,'«$1»').toUpperCase()}</h2><div style="display:flex;gap:14px;align-items:flex-start;margin-top:10px">${W?faceHTML(who,'big'):''}<div class="sub" style="margin:0;font-size:18px;line-height:21px">${W?`<b style="color:var(--paper);font-weight:400">${W.nm}</b>, ${W.role}<br><br>`:''}${txt}</div></div><div class="law" id="fl-ok" style="margin-top:16px;text-align:center"><div class="t">확인</div></div>`;
  $('modal').classList.add('on'); drawFaces($('modal-win')); $('fl-ok').onclick=closeModal;}
function resStrip(hl){const it=[['leg','정통성',S.leg],['dep','의원',deputies(S)],['ppl','시민',fmt(S.ppl)],['mil','민병대',fmt(S.mil)],['gun','남는 무기',fmt(freeGuns(S))],['med','방송',fmt(S.med)+' <i>+'+mediaGain()+' 턴당</i>'],['sup','보급',Math.floor(S.sup)+' 일'],['hope','결의',S.hope+'%'],['rad','급진성',S.rad+'%'],['city','모스크바',S.city+'%'],['ord','명령',S.orders],['law','결의',S.lawCharges]];
  return '<div class="rstrip">'+it.map(([k,n,v])=>`<span class="${k===hl?'hl':''}">${n} <b>${v}</b></span>`).join('')+'</div>';}
function openStrike(){const T=S.strike&&STRIKES.find(x=>x.id===S.strike.id); if(!T)return; const ok=T.cover(S);
  $('modal-win').innerHTML=`<h2>옐친의 주요 타격 · ${T.nm.toUpperCase()}</h2><div class="sub">${T.warn}<br><br>오늘 밤 타격은 한 곳에 떨어지며 무거울 것이다: ${fxText(T.hit(S))||T.e}${T.e&&fxText(T.hit(S))?' · <span class="n">'+T.e+'</span>':''}.<br><br>막으려면: <b style="color:var(--paper)">${T.guard}</b>. ${ok?'<span class="p">오늘은 이미 막았다.</span>':'<span class="n">아직 막지 못했다.</span>'}${S.flags.shield?'<br>폭로 자료가 가동 중이다: 타격이 떨어지더라도 절반의 힘이다.':'<br>방송의 ‘정부 폭로 자료’ 캠페인은 타격을 절반으로 줄인다.'}</div><div class="close">ESC — 닫기</div>`;
  $('modal').classList.add('on'); $('modal-win').querySelector('.close').onclick=closeModal;}

function openHelp(){
  const LD=legDrift(S);
  const H=[['정통성','벽 밖의 명령이 이행될 가능성(지금 '+Math.round(execChance('x')*100)+'%), 결의 배수, 사건의 점검. 상한은 없지만 매일 밤 줄어들고, 70을 넘으면 어떤 증가든 절반만 효과가 있다. 지금 밤사이: '+LD.P.map(p=>p[1]+' '+sg(p[0])).join(', ')+', 매체 '+(pressLeg(S)?sg(pressLeg(S)):'0')+'.'],
   ['의원','의원의 수가 곧 위임이다. 하루에 다섯 명이 떠날 때마다 정통성 1이 줄어든다. 위기 속에서 이들은 소모된다: 매일 밤 누군가 떠나고, 봉쇄선 아래에서는 더 많이, 전기가 없으면 더 많이, 옐친의 ‘보장’ 이후에는 더 많이. 결의와 계파의 충성이 이들을 붙잡는다. 다음보다 적으면 '+QUORUM+' — 정족수 없음, 밤사이 정통성 −3.'],
   ['시민','손: 피켓, 보급 행렬, 바리케이드, 불 끄기. 위기에서 '+PERIM+' — 외곽이 비고, 밤사이 결의 −2. 2500부터는 크렘린이 강습을 망설이지만, 군중이 보급을 먹고 급진성을 키운다.'],
   ['민병대','무장한 사람들: 강습 때 출입구를 지키고, 200명부터 결의를 높이며, 무력 선택지를 연다.'],
   ['무기','무기. 무장한 사람은 민병대 전투원이 되어 무기를 지니고 있으며, 비축은 줄지 않고 남는 무기만 줄어든다.'],
   ['방송','유일한 매체 화폐. 매일 밤 당신 쪽 매체에서 들어온다. 편집국, 캠페인, 신문에 대한 반박에 쓰이며, 정통성, 모스크바, 계파 충성으로 바뀐다.'],
   ['보급','식량과 경유 일수. 0이 되면 사람들이 떠나고 결의가 떨어진다.'],
   ['모스크바','도시의 분위기: 사람의 유입, 정통성, 강습의 속도. 방송에서 결정된다.'],
   ['결의','건물의 결속: 45% 아래에서는 의원들이 더 빨리 떠난다. 0이면 끝.'],
   ['급진성','판돈: 무력 선택지를 열고 협상을 닫는다. 60%부터 크렘린의 타격이 세진다.'],
   ['지도 위의 세력','최고회의와 크렘린 사이의 밧줄. 65%부터는 세력이 매일 밤 당신들을 위해 일하고, 35%까지 떨어지면 크렘린을 위해 일한다. 크렘린은 매일 밤 모두를 자기 쪽으로 당기고, 이틀이나 사흘에 한 번씩 옐친이 그중 하나를 진지하게 친다. 신문이 아침에 미리 경고한다.'],
   ['봉쇄선','건물을 둘러싼 봉쇄선, 0–100. 봉쇄선이 있는 동안 매일 밤 정통성, 결의, 방송, 보급을 치고 의원들을 떠나게 한다. 50 아래에서는 압박이 약해진다. 견디며 대가를 치르거나(전령, 이중 배급, 짐꾼), 지도의 ‘봉쇄’ 창에서 부분적으로 걷어낼 수 있다.']];
  $('modal-win').innerHTML='<h2>지표: 무엇이 무엇에 영향을 주는가</h2>'+H.map(h=>`<div class="hlp"><b>${h[0]}</b><span>${h[1]}</span></div>`).join('')+'<div class="close">ESC — 닫기</div>';
  $('modal').classList.add('on'); $('modal-win').querySelector('.close').onclick=closeModal;
}
function closeModal(){ $('modal-win').classList.remove('wide'); $('modal-win').classList.remove('full'); if(S&&S.A&&S.A.card&&screen==='assault')return; $('modal').classList.remove('on');}
function openChron(){
  const c=(S&&S.chron&&S.chron.length?S.chron:store.get(CHRON))||[];
  $('modal-win').innerHTML=`<h2>연대기</h2><div class="sub">지난 판의 결정들.</div><div class="chron">`+
   (c.length?c.map(x=>`<div><b>${x.date}.</b> ${x.h}: ${x.ch}</div>`).join(''):'<div>아직 비어 있다. 새 게임을 시작하라.</div>')+`</div><div class="close">ESC — 닫기</div>`;
  $('modal').classList.add('on'); $('modal-win').querySelector('.close').onclick=closeModal;
}
$('modal').onclick=e=>{if(e.target.id==='modal')closeModal();};
$('b-laws').onclick=()=>openLaws();
$('b-end').onclick=()=>endTurn();
$('b-wh').onclick=()=>setView('wh');
$('b-ether').onclick=()=>openEther();
document.querySelectorAll('#s-wh .tabs div').forEach(d=>d.onclick=()=>{const t=d.dataset.t; if(t==='menu')return toMenu();
  if(t==='map')setView('map');else if(t==='ether')openEther();else if(t==='laws')openLaws();else if(t==='end')endTurn();});
$('a-next').onclick=()=>nextHour();

// ---------- toast with the Kremlin's night move ----------
function showToast(){
  return; /* the morning report is now the newspaper screen */ const k=S.kremlin;
  const slot=screen==='wh'?$('w-toast'):$('toast-slot');
  slot.innerHTML=`<div class="toast"><div class="h">${dateStr(S.day).toUpperCase()} 밤 · ${S.phase===1?'크렘린이 하는 일':'크렘린의 응답'}</div><div class="b">`+
    (k.moves||[]).slice().sort((a,b)=>(b.y||0)-(a.y||0)).map(m=>`<div class="km${m.g?' g':''}${m.y?' y':''}"><span class="c">${m.c}</span><div>${m.t}<br><span class="e">${m.e}</span></div></div>`).join('')+
    `${k.n?`<div class="nt"><b>당신들의 밤:</b> ${k.n}</div>`:''}</div><div class="x">눌러서 닫기</div></div>`;
  slot.firstChild.onclick=hideToast;
}
function hideToast(){$('toast-slot').innerHTML='';$('w-toast').innerHTML='';}
const toastOn=()=>!!($('toast-slot').firstChild||$('w-toast').firstChild);

// ================= TURN =================
function endTurn(){ Sfx.play('night'); const d0={...snap(),hope:S.hope,rad:S.rad,city:S.city,pr:S.pr};
  if(screen!=='map'&&screen!=='wh')return; hideToast(); $('modal').classList.remove('on');
  const notes=[]; S.did=S.did||{}; S.st=S.st||{}; syncRing();
  // supplies
  // no siege before the decree; deliveries still trickle in until the barbed wire goes up
  const shut=S.cordon&&!(S.flags.gap>0);
  const RP=S.cordon?ringPress(S):{leg:0,hope:0,sup:0,med:0,dep:0};
  if(S.cordon){S.hold=S.hold||{}; const paid=[]; for(const H of HOLDS){ if(!S.hold[H.id])continue; if(H.can(S)!==true){S.hold[H.id]=0; notes.push('지불할 것이 없음: “'+H.t+'” 취소됨');} else{apply(H.cost);paid.push(H.t.toLowerCase());} } if(paid.length)notes.push('밤에 지불함: '+paid.join(', ')); if(RP.med)S.med=Math.max(0,S.med+RP.med);}
  if(S.phase===2)S.sup=Math.max(0,S.sup-((.5+RP.sup)+S.ppl/5000)*(S.flags.ration?.5:1)+(S.flags.tunnel?.5:0));
  S.sup+=whYield(S).sup;
  if(S.sup<1){S.hope=clamp(S.hope-8,0,100);S.ppl=Math.round(S.ppl*.9);S.mil=Math.round(S.mil*.95);log('건물에 식량이 없다. 사람들이 떠나고 있다.','bad');}
  // the perimeter needs hands: too few people and the House feels abandoned
  if(S.phase===2&&S.ppl<PERIM){S.hope=clamp(S.hope-2,0,100);notes.push('미만: '+PERIM+'명, 외곽을 지킬 사람이 없다: 결의 −2');}
  if(S.flags.gap>0){S.flags.gap--; notes.push(S.flags.gap?'봉쇄선의 틈이 유지된다':'봉쇄선의 틈을 막았다: 철조망 세 줄');}
  // people come and go
  const inflow=shut?Math.max(0,(S.city-55)*4):Math.max(0,Math.round((S.hope-40)*1+(S.city-40)*(S.phase===1?2:4)));
  S.ppl=Math.max(0,S.ppl+inflow-Math.round(S.ppl*(shut?.08:S.phase===2?.06:.03)));
  // rooms of the White House
  const LD=legDrift(S), dh=whYield(S).hope;
  S.leg=clamp(S.leg+LD.v,0,100);
  if(LD.v)notes.push('밤사이 정통성 '+sg(LD.v)+': '+LD.P.map(p=>p[1]+' '+sg(p[0])).join(', '));
  if(dh)notes.push('대회의 활동: 결의 +'+dh);
  // media: income from channels; without a voice the Kremlin owns the air
  const dc=cityShift(), inc=mediaGain(); S.med+=inc; S.city=clamp(S.city+dc,0,100);
  if(dc)notes.push('모스크바를 위한 싸움: '+sg(dc));
  if(S.flags.komp>0)S.flags.komp--;
  if(S.mil>=400)S.rad=clamp(S.rad+1,0,100);
  if(S.phase===2){const o0=S.omon==null?100:S.omon; let o=o0+4; if(S.pts.mer>=65)o-=4; if(S.city>=60)o-=2; S.omon=clamp(o,0,100); if(o0<100&&S.omon>o0)notes.push('OMON에 상여금 지급: 준비 태세 '+S.omon+'%');}
  // resolve is the unity of the House: when it cracks, deputies walk out
  if(S.phase===2&&S.hope<45){let out=Math.round((45-S.hope)/5)+2, o0=out; for(const id of ['kol','sm','agr','ros']){const f=S.fac[id],k=Math.min(f.n,out);f.n-=k;out-=k;if(f.n<4){f.n=0;f.room=null;} if(!out)break;} notes.push('분열: 떠남 '+(o0-out)+' 명의 의원이 떠난다');}
  S.hope=clamp(S.hope-(S.phase===2?4:1)-(S.sup<3?1:0)+RP.hope+dh,0,100);
  if(S.cordon){S.rad=clamp(S.rad+2,0,100); S.ring=Math.min(100,(S.ring==null?100:S.ring)+2);}
  if(S.phase===2)S.pr=clamp(S.pr+prRate(),0,100);
  // the Kremlin slowly pulls everyone to its side
  for(const p of POINTS)if(!p.fixed&&S.pts[p.id]<100)S.pts[p.id]=clamp(S.pts[p.id]-(S.phase===1?1:(p.id==='mo'||p.id==='gs')?3:2),0,100);
  // канат: сила, которая стоит у одного из полюсов, каждую ночь работает на него
  {let tf={},rg=0;const tn=[]; for(const id in POINT_TUG){const sd=tugSide(S.pts[id]),T=sd&&POINT_TUG[id][sd]; if(!T||(T.ph&&S.phase<T.ph))continue; tf=merge(tf,T.fx); if(T.ring&&S.cordon)rg+=T.ring; tn.push(POINTS.find(p=>p.id===id).nm.replace(/ ↑.*/,'')+': '+T.t);}
   if(tn.length){apply(tf); if(rg&&S.ring!=null){S.ring=Math.max(0,S.ring-rg);} notes.push('밤사이 세력: '+tn.join('; '));}}
  // factions
  // darkness and cold: no power wears the House down; generators burn supplies instead
  if(S.flags.noPower&&S.flags.gen&&S.sup>0)S.flags.noPower=0;
  if(S.phase===2&&S.flags.noPower){S.hope=clamp(S.hope-2,0,100);notes.push('전기와 수도 없음: 결의 −2');}
  else if(S.phase===2&&S.flags.gen){S.sup=Math.max(0,S.sup-.25);notes.push('발전기가 경유를 태운다: 보급 −0.25일'); if(S.sup<=0){S.flags.noPower=1;S.flags.gen=0;notes.push('경유가 떨어졌다: 전기가 나갔다');}}
  let fb={}, fbn=0;
  for(const F of FACTIONS){const b=facBonus(S,F); if(b&&b.on){fb=merge(fb,b.fx);fbn++;}}
  if(fbn){apply(fb); S.sup=Math.max(0,S.sup); const t=fxText(fb); if(t)notes.push('계파: '+t.replace(/<[^>]+>/g,''));}
  // deputies come back to a Congress that looks alive
  if(S.phase===2&&S.leg>=60&&S.hope>=65&&(!S.cordon||S.flags.tunnel||S.flags.gap>0||S.city>=55)){const F0=FACTIONS.find(x=>x.id==='kol'),k=Math.min(F0.n-S.fac.kol.n,2+Math.floor(Math.random()*4)); if(k>0){S.fac.kol.n+=k; notes.push('지역에서 복귀 '+k+' 명의 떠난 의원: 대회가 살아 있는 것처럼 보인다');}}
  for(const k in S.uses||{})if(S.day%2===0&&S.uses[k]>0&&!S.used[k])S.uses[k]--;
  for(const F of FACTIONS){const f=S.fac[F.id]; if(f.n<=0)continue;
    if(S.hope<40&&Math.random()<.5)f.loy=Math.max(0,f.loy-1);
    if(f.loy<=3&&S.phase===2){const out=Math.max(2,Math.round(f.n*.1));f.n=Math.max(0,f.n-out);if(f.n<4)f.n=0;
      notes.push(`${F.nm.replace(/"/g,'')}: 떠남 ${out}`); if(f.n===0)f.room=null;}
  }
  // до указа нелояльные тоже разъезжаются: «в округ, к избирателям»
  if(S.phase===1)for(const F of FACTIONS){const f=S.fac[F.id]; if(F.kind==='dep'&&f.n>4&&f.loy<=3){const o=1+Math.floor(Math.random()*3);f.n-=o;notes.push(F.nm.replace(/"/g,'')+': '+o+' “지역으로” 떠났다');}}
  // измор: в кризис каждую ночь кто-то уходит; сначала те, кто меньше всех верит
  if(S.phase===2){const why=[]; let k=3+Math.floor(Math.random()*4);
    if(S.cordon&&RP.dep){k+=RP.dep;why.push('봉쇄선');} if(S.flags.noPower){k+=2;why.push('전기 없음');} if(S.flags.bribe){k+=2;why.push('대통령의 ‘보장’');}
    if(S.hope>=70)k-=2; if(S.laws.mandate)k-=2; if(S.leg>=60)k-=1; k=Math.max(0,k);
    const L=FACTIONS.filter(F=>F.kind==='dep'&&S.fac[F.id].n>0&&S.fac[F.id].loy<8).sort((a,b)=>S.fac[a.id].loy-S.fac[b.id].loy); let left=k,gone=0;
    for(const F of L){const f=S.fac[F.id],q=Math.min(f.n,Math.ceil(left*(f.loy<=3?.6:.45)));f.n-=q;left-=q;gone+=q;if(left<=0)break;}
    if(gone)notes.push('소모: 밤사이 떠남 '+gone+' 명의 의원이 떠난다'+(why.length?' ('+why.join(', ')+')':''));}
  {const fd=facDrift(); if(fd.length)notes.push('계파: '+fd.join(', '));}
  // Kremlin answers: several moves a night, more as the stakes rise
  S.kdone=S.kdone||{};
  const nK=(S.phase===1?(S.pr>=10?2:1):2+(S.rad>=60||S.day>=15?1:0))-(S.flags.leak?1:0);
  const moves=[]; let kmed=0;
  for(let n=0;n<nK;n++){
    const opts=KREMLIN.filter(k=>!(S.flags.cam&&['도발','차질','거리'].includes(k.c))&&!moves.includes(k)&&!(k.once&&S.kdone[k.t])&&!(k.good&&moves.some(m=>m.good))).map(k=>({k,w:k.w(S)})).filter(o=>o.w>0);
    if(!opts.length)break; let r=Math.random()*opts.reduce((a,o)=>a+o.w,0); const k=(opts.find(o=>(r-=o.w)<0)||opts[0]).k; moves.push(k);}
  const rep=[];
  // главный удар Ельцина: объявлен утром, приходит ночью по одному месту
  let struck=false;
  if(S.strike){const T=STRIKES.find(x=>x.id===S.strike.id); struck=true;
    if(T.cover(S)){rep.push({t:T.okT,h:T.okH,e:'<span class="p">타격을 막아냈다</span>',c:'옐친',g:1,y:1}); S.st.blk=(S.st.blk||0)+1;}
    else{const half=!!S.flags.shield; let fx=T.hit(S); if(half)fx=halve(fx); apply(fx); if(T.run)T.run(S,half); S.flags.shield=0; S.st.hit=(S.st.hit||0)+1; S.hope=clamp(S.hope-2,0,100); if(S.lastStrikeId==='mvd'||T.id==='mvd')S.omon=clamp((S.omon==null?100:S.omon)+10,0,100);
      rep.push({t:T.hitT+(half?' 폭로 자료가 규모를 줄였다: 타격은 절반의 힘이었다.':''),h:T.hitH,e:[fxText(fx),T.e?'<span class="n">'+T.e+'</span>':''].filter(Boolean).join(' · '),c:'옐친',y:1});}
    S.lastStrike=S.strike.id; S.strike=null;}
  // Ельцин лично
  if(!struck){S.ydone=S.ydone||{}; const y=YELTSIN.find((y,i)=>!S.ydone[i]&&y.ph===S.phase&&y.w(S)); if(y){S.ydone[YELTSIN.indexOf(y)]=1; apply(y.fx); if(/ОКЛАД/.test(y.h))S.flags.bribe=1; if(y.run)y.run(S); rep.push({t:y.t,h:y.h,e:fxText(y.fx),c:'옐친',y:1}); moves.pop();}}
  // клеймо: пока РНЕ в здании, либеральная пресса бьёт каждую ночь и всё сильнее
  if(S.phase===2){const b0=S.flags.brand||0; if(S.fac.rne.n>0){S.flags.rneWas=1;const b=Math.min(3,b0+1);S.flags.brand=b;const fx={city:-b,leg:b>=3?-2:b>=2?-1:0};apply(fx);const T=BRAND_T[b-1];rep.push({t:T[S.day%T.length],e:fxText(fx),c:'낙인'});}
    else{ if(b0>0)S.flags.brand=b0-1; if(S.rad>=60){apply({city:-1});rep.push({t:'신문들은 백악관의 ‘적갈색 세력’을 쓴다: 총격에 관한 이야기가 너무 많다.',e:fxText({city:-1}),c:'낙인'});}}}
  // издания работают каждую ночь на того, чьё они; в газету попадают самые громкие, остальное одной строкой
  {const agg={vs:{},kr:{}},L=[]; for(const o of OUTLETS){const sd=outSt(S,o),e=sd==='vs'?o.pas:sd==='kr'?o.kpas:null; if(!e)continue; apply(e.fx); agg[sd]=merge(agg[sd],e.fx); L.push({sd,e:S.phase===1&&e.t1?{...e,t:e.t1}:e});}
   const sh=a=>a.sort(()=>Math.random()-.5), tx=f=>fxText(f).replace(/<[^>]+>/g,'');
   for(const x of sh(L.filter(x=>x.sd==='vs')).slice(0,1))rep.push({t:x.e.t,e:fxText(x.e.fx),c:'당신들의 언론',g:1});
   for(const x of sh(L.filter(x=>x.sd==='kr')).slice(0,S.phase===2?2:1))rep.push({t:x.e.t,e:fxText(x.e.fx),c:'그들의 언론'});
   if(tx(agg.vs))notes.push('당신 쪽 매체, 밤사이: '+tx(agg.vs)); if(tx(agg.kr))notes.push('크렘린 쪽 매체, 밤사이: '+tx(agg.kr));}
  if(S.flags.leak)rep.push({t:'유출이 먹혔다: 크렘린의 한 수가 무산됐고, 미리 알았다.',e:'',c:'당신들의 언론',g:1}); if(S.flags.cam)rep.push({t:'카메라가 밤새 봉쇄선 앞에 서 있었다. 도발은 없었다.',e:'',c:'당신들의 언론',g:1}); S.flags.leak=0;S.flags.cam=0;
  for(const k0 of moves){const k=k0.tf?Object.assign({},k0,{t:k0.tf(S)}):k0; if(!k.t)continue; const fx=merge(k.fx,k.dyn?k.dyn(S):{}); apply(fx); if(k0.tf){S.kmed=1;kmed=1;S.kmedT=k.t;} if(k.run)k.run(S); if(k.once)S.kdone[k.t]=1;
    if(fx.city<0||fx.med<0){kmed=1;S.kmedT=k.t;} rep.push({t:k.t,e:fxText(fx)||k.e||'',c:k.c,g:k.good?1:0});}
  if(Math.random()<(S.phase===1?.3:.45)){const pool=KCRISIS.filter(k=>!S.kdone[k.t]&&k.w(S)>0); const k=pool[Math.floor(Math.random()*pool.length)];
    if(k){apply(k.fx);S.kdone[k.t]=1;rep.push({t:k.t,e:fxText(k.fx),c:'크렘린의 위기',g:1,kc:1});}}
  S.sup=Math.max(0,S.sup); S.kmed=kmed;
  S.day++; for(const m of rep)log(m.t,m.g?'':'kr','밤');
  // every deputy who walks out takes a piece of the mandate with him
  {const now=deputies(S), was=S.depPrev==null?now:S.depPrev, d=now-was; S.st=S.st||{};
   if(d<0){const h=Math.round(-d/5); S.leg=clamp(S.leg-h,0,100); S.st.depOut=(S.st.depOut||0)-d; notes.push('하루에 떠남 '+(-d)+' 명의 의원이 떠난다'+(h?': 정통성 −'+h:''));}
   else if(d>0){const h=Math.floor(d/6); S.st.depIn=(S.st.depIn||0)+d; if(h){S.leg=clamp(S.leg+h,0,100);notes.push('돌아옴 '+d+' 명의 의원: 정통성 +'+h);}}
   S.depPrev=now; S.depRate=Math.round(((S.depRate||0)+Math.max(0,-d))/2*10)/10; S.st.km=(S.st.km||0)+rep.length;}
  S.orders=S.flags.tapped?1:2; S.flags.tapped=0; S.used={}; S.appeals={}; S.did={}; S.away=0; if(S.day%2===1)S.lawCharges++;
  syncRing(); notes.sort((a,b)=>(/^(Измор|Легитимность за ночь|За сутки)/.test(b)?1:0)-(/^(Измор|Легитимность за ночь|За сутки)/.test(a)?1:0));
  // следующий главный удар: до указа раз в три дня, в кризис через день
  {const due=S.phase===1?(S.day>=2&&S.day<DECREE_DAY-1&&S.day%2===0):(S.phase===2&&S.pr<100&&(S.pr>=60||(S.day-DECREE_DAY)%2===1));
   if(due){const pool=STRIKES.filter(T=>T.id!==S.lastStrike&&T.ph.includes(S.phase)).map(T=>({T,w:T.w(S)})).filter(o=>o.w>0); let r=Math.random()*pool.reduce((a,o)=>a+o.w,0); const pk=pool.find(o=>(r-=o.w)<0)||pool[0]; if(pk)S.strike={id:pk.T.id};}}
  S.kremlin={moves:rep,notes,d0};
  S.am=snap();
  if(S.phase===2){
    // без штурма возможен только редкий компромисс: все восемь условий сразу. Иначе загнанный в угол Кремль идёт на штурм, а победа засчитывается после боя
    if(S.day>=15&&S.pts.mo>=80&&S.pts.gs>=80&&S.pr<100)return ending('win_army',1); // армия за Съезд: штурмовать некому
    if(dealScore().every(x=>x[0])&&!S.flags.dealNo){ if(Math.random()<.45)return ending('elect_deal'); S.flags.dealNo=1; S.flags.corner='elect'; S.pr=100; } // Кремль соглашается не всегда: иначе идёт на штурм
    if(!S.flags.corner&&S.pr<100){ const dealNear=dealScore().slice(0,7).every(x=>x[0]); /* полный мирный набор: Кремль ждёт до 1 октября и идёт на выборы */ const c=(!dealNear&&(S.flags.zero||0)>=1&&S.leg>=80&&S.city>=72&&S.day>=13)?'elect':0; if(c){S.flags.corner=c;S.pr=100;} }
  }
  if(checkLose())return;
  S.paper=1; save(); showPaper();
}
// ================= the morning paper: last night's report as a front page =================
const PAPER_K={'옐친':'대통령','낙인':'백악관에는 누가 있나','그들의 언론':'언론 개관','당신들의 언론':'대회의 목소리','크렘린의 위기':'크렘린의 불안','무력 기관':'군대와 경찰','의원':'의원단','봉쇄':'백악관 주변','언론':'언론과 방송','폭로 자료':'폭로','도청':'특수기관','도발':'사건','거리':'도시','지방':'지방','법':'법령','돈':'돈','압박':'백악관 주변','차질':'고장','소문':'소문','당신들의 밤':'백악관에서'};
const PAPER_PIC={'옐친':'yeltsin','낙인':'barkash','무력 기관':'grachev','의원':'hasb','크렘린의 위기':'yeltsin'};
const paperNorm=x=>x.replace(/[«»".,:!?…]/g,'').replace(/\s+/g,' ').trim().toUpperCase();
const paperBody=(m,h)=>paperNorm(m.t)===paperNorm(h)||paperNorm(m.t).indexOf(paperNorm(h).replace(/…$/,''))===0&&paperNorm(m.t).length-paperNorm(h).length<4?'':`<p>${m.t}</p>`;
function paperHead(t,max){let h=t.replace(/[«»"]/g,'').split(/[.!?]/)[0].trim(); if(h.length>max){h=h.slice(0,max);h=h.slice(0,h.lastIndexOf(' '))+'…';} return h.toUpperCase();}
const paperStamps=e=>(e||'').split(' · ').filter(Boolean).map(x=>`<span class="st${/class="p"/.test(x)?' g':''}">${x.replace(/<[^>]+>/g,'').toUpperCase()}</span>`).join('');
function paperPhoto(pic){const c=$('np-ph'),g=c.getContext('2d'),W=220,H=110;g.fillStyle='#cfc4a6';g.fillRect(0,0,W,H);
  const tone=['#1c1916','#5b5244','#958a70','#cfc4a6'],B=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
  const draw=im=>{const t=document.createElement('canvas');t.width=W;t.height=H;const x=t.getContext('2d');x.imageSmoothingEnabled=false;
    const k=Math.max(W/im.width,H/im.height),w=im.width*k,h=im.height*k;x.drawImage(im,(W-w)/2,(H-h)*.3,w,h);
    let d;try{d=x.getImageData(0,0,W,H);}catch(e){g.drawImage(t,0,0);return;}
    for(let y=0;y<H;y++)for(let X=0;X<W;X++){const i=(y*W+X)*4,l=(d.data[i]*.3+d.data[i+1]*.59+d.data[i+2]*.11)/255*1.5+.08,v=Math.min(2.999,Math.max(0,l*3)),f=v-Math.floor(v);
      g.fillStyle=tone[Math.min(3,Math.floor(v)+((f*16>B[y&3][X&3])?1:0))];g.fillRect(X,y,1,1);}};
  if(pic==='yeltsin'||(PEOPLE[pic]&&PEOPLE[pic].img)){const im=new Image();im.onload=()=>draw(im);im.src=pic==='yeltsin'?ASSET_YELTSIN:PEOPLE[pic].img;}
  else TitleArt.onReady(()=>draw(TitleArt.calm));}
function paperReplies(lead){const R=[];
  if(lead.c==='낙인')R.push({t:'RNE를 건물에서 내보내기',fx:{city:4,leg:2,hope:-4,rad:-5},run:()=>{S.fac.rne.n=0;S.flags.rneOut=1;S.flags.brand=Math.max(0,(S.flags.brand||0)-1);}});
  else if(lead.c==='옐친')R.push({t:'간부회의 답변 결의',fx:{leg:2,hope:1,pr:2}});
  else if(lead.g)R.push({t:'이 호를 지방과 부대에 보내기',fx:{med:-4,leg:1,pts:{gs:1}},req:()=>S.med>=4||'방송 4 필요'});
  else R.push({t:'최고회의 간부회 성명',fx:{leg:1,hope:1,rad:1}});
  if(S.kremlin&&S.kremlin.moves.some(m=>m.kc))R.push({t:'크렘린에서 스캔들을 키우기',fx:{med:-5,city:2,pr:-3},e2:'옐친의 다음 주요 타격, 절반의 힘',run:()=>{S.flags.shield=1;},req:()=>S.med>=5||'방송 5 필요'});
  else if(!lead.g)R.push({t:'방송에서 반박',fx:{med:-6,city:3},req:()=>S.flags.noComms?'통신 없음':S.med>=6||'방송 6 필요'});
  R.push({t:'침묵하기',fx:{},e:'대답 없이 하루가 시작된다'}); return R;}
function showPaper(){const k=S.kremlin; if(!k){S.paper=0;return startDay();}
  show('paper'); Sfx.play('paper'); Sfx.play('teletype',.25);
  const vs=voiceOf(S,'vs'),kr=voiceOf(S,'kr'),nu=voiceOf(S,'neu'),tot=vs+kr+nu||1, ours=vs>kr;
  const items=k.moves.slice(); const ord=m=>ours?(m.g?0:m.y?1:2):(m.y?0:m.c==='낙인'?1:m.g?3:2); items.sort((a,b)=>ord(a)-ord(b));
  const lead=items.shift()||{t:'밤은 조용히 지나갔다. 백악관에도, 크렘린에도 불이 켜져 있다.',e:'',c:'당신들의 밤',g:1};
  {const kc=items.findIndex(m=>m.kc); if(kc>0)items.unshift(items.splice(kc,1)[0]);}
  const ST=S.strike&&STRIKES.find(x=>x.id===S.strike.id); if(ST)items.unshift({t:ST.warn,h:ST.warnH,e:'<span class="n">오늘 밤 주요 타격</span>',c:'옐친'});
  const side2=lead.t.length<120&&items.length>3?items.shift():null, cols=items.splice(0,3), d=dateOf(S.day), WDN=['일요일','월요일','화요일','수요일','목요일','금요일','토요일'];
  let brief=(k.notes||[]).concat(items.map(m=>m.t.replace(/\.$/,'')+(m.e?' ('+m.e.replace(/<[^>]+>/g,'')+')':''))); {let n=0;brief=brief.filter(x=>(n+=x.length+3)<(side2?430:620));}
  k.lead=lead; k.rep=paperReplies(lead);
  $('np-sheet').innerHTML=`<div class="top"><span>No. ${180+S.day} (${1034+S.day})</span><span>일간지 · 1990년부터 발행</span><span>가격 자유</span></div>
    <div class="mast">수도 헤럴드</div><div class="rule"></div>
    <div class="date"><span>${WDN[d.getDay()]}, 1993년 ${dateStr(S.day)}</span><span>모스크바</span></div>
    <div class="kick">${PAPER_K[lead.c]||lead.c.toUpperCase()}${S.phase===2?' · 위기, '+(S.day-DECREE_DAY+1):''}</div>
    <div class="h1">${lead.h||paperHead(lead.t,58)}</div>
    <div class="lead"><div><canvas class="ph" id="np-ph" width="220" height="110"></canvas></div>
      <div class="txt"><p>${/^[А-ЯЁA-Z]/.test(lead.t)?`<span class="dc">${lead.t.charAt(0)}</span>${lead.t.slice(1)}`:lead.t}</p>${paperStamps(lead.e)}${side2?`<div class="s2"><div class="h2">${side2.h||paperHead(side2.t,44)}</div>${paperBody(side2,side2.h||paperHead(side2.t,44))}${paperStamps(side2.e)}</div>`:''}</div></div>
    <div class="cols">${cols.map(m=>`<div class="col">${m.kc?'<div class="kick" style="margin:0 0 4px">크렘린의 불안</div>':''}<div class="h2">${m.h||paperHead(m.t,40)}</div>${paperBody(m,m.h||paperHead(m.t,40))}${paperStamps(m.e)}</div>`).join('')}</div>
    ${brief.length?`<div class="brief"><b>짧게</b> ${brief.join(' · ')}</div>`:''}`;
  paperPhoto(PAPER_PIC[lead.c]||(S.phase===2&&S.cordon?'whf':'wh'));
  const now={...snap(),hope:S.hope,rad:S.rad,city:S.city,pr:S.pr}, o=k.d0||now;
  const row=(nm,key,suf,inv)=>{const v=Math.round(now[key]*10)/10, dl=Math.round((now[key]-o[key])*10)/10; return `<div class="row"><span>${nm}</span><span><b>${fmt(v)}${suf||''}</b> ${dl?`<span class="${(dl>0)!==!!inv?'p':'n'}">${dl>0?'+':'−'}${fmt(Math.abs(dl))}</span>`:''}</span></div>`;};
  $('np-side').innerHTML=`<div class="day">아침 · ${S.day}일차</div><div class="big">아침 신문</div>
    <div class="npw">오늘 1면은 <b class="${ours?'v':''}">${ours?'최고회의 편':'크렘린 편'}</b> 쪽 언론이 쓴다. ${ours?'당신들 매체가 더 많은 동안, 주요 뉴스는 당신들 것이다.':'‘방송’에서 편집국을 끌어오면 제목도 당신들 것이 된다.'}</div>
    <div class="press"><i class="k" style="width:${kr/tot*100}%"></i><i class="n" style="width:${nu/tot*100}%"></i><i class="v" style="width:${vs/tot*100}%"></i></div>
    <div class="pl"><span>크렘린 편 ${kr}</span><span>침묵 ${nu}</span><span>최고회의 편 ${vs}</span></div>
    <div class="box"><div class="bt">밤 결산</div>${row('정통성','leg')}${row('의원','dep')}${row('시민','ppl')}${row('방송','med')}${row('보급','sup',' 일')}${row('결의','hope','%')}${row('급진성','rad','%',1)}${row('모스크바는 최고회의 편','city','%')}</div>
    <div class="bt" style="margin-top:10px;margin-bottom:0">1면에 대한 답변</div>`+
    k.rep.map((r,i)=>{const st=r.req?r.req():true;return `<div class="ch${st!==true?' lock':''}" data-i="${i}"><span class="k">${i+1}</span><span>${r.t}</span><span class="e">${st!==true?`<span class="n">${st}</span>`:[fxText(r.fx),r.e2].filter(Boolean).join(' · ')||r.e||''}</span></div>`;}).join('')+
    `<div class="go" id="np-go"><span class="a">${S.day}일차 시작</span><span class="b">ENTER</span></div>`;
  if(ST){const w=$('np-side').querySelector('.npw'); w.className='strk'; w.innerHTML=`<b>오늘 밤 옐친의 주요 타격: ${ST.nm.toUpperCase()}</b>막기: ${ST.guard}. 그렇지 않으면 타격이 무겁다.${S.flags.shield?' 폭로 자료가 가동 중: 타격은 절반의 힘이다.':''}`;}
  $('np-side').querySelectorAll('.ch').forEach(e=>e.onclick=()=>paperGo(+e.dataset.i)); $('np-go').onclick=()=>paperGo(-1);
}
function paperGo(i){const k=S.kremlin; if(!k||screen!=='paper')return; const r=k.rep&&k.rep[i];
  if(r){if(r.req&&r.req()!==true)return; apply(r.fx); if(r.run)r.run(); if(r.fx&&Object.keys(r.fx).length)log('1면에 대한 답변: '+r.t.toLowerCase()+'.');}
  S.kremlin=null; S.paper=0; if(checkLose())return; startDay();}

function startDay(){
  if(S.phase===2&&S.pr>=100){S.queue=['assault'];}
  else{
    for(const e of EVENTS)if(e.day===S.day&&!S.fired[e.id]&&!S.queue.includes(e.id))S.queue.push(e.id);
    for(const e of EVENTS)if(e.cond&&!S.fired[e.id]&&!S.queue.includes(e.id)&&e.cond(S)){S.queue.push(e.id);break;}
    // a random situation most days, weighted by the state of things: no two games alike
    if(S.day>1&&S.day!==DECREE_DAY&&Math.random()<.7){const pool=EVENTS.filter(e=>e.rnd&&!S.fired[e.id]&&!S.queue.includes(e.id)&&inPh(e)).map(e=>({e,w:e.rnd(S)})).filter(o=>o.w>0);
      let r=Math.random()*pool.reduce((a,o)=>a+o.w,0); const pk=pool.find(o=>(r-=o.w)<0); if(pk)S.queue.push(pk.e.id);}
  }
  // через день приходит фракция (самая довольная или самая злая), через день — одна из сил на карте
  if(!(S.phase===2&&S.pr>=100)&&S.day>=3&&S.day!==DECREE_DAY&&S.queue.length<2){S.fev=S.fev||{}; let c;
    if(S.day%2===1){const L=FACTIONS.filter(F=>F.kind==='dep'&&S.fac[F.id].n>0); c=L.filter(F=>S.fac[F.id].loy>=7).map(F=>'fg_'+F.id).concat(L.filter(F=>S.fac[F.id].loy<=4).map(F=>'fb_'+F.id));}
    else c=['mer','mo','gs','mvd','smo'].map(p=>{const sd=tugSide(S.pts[p]);return sd?'pf_'+p+'_'+(sd==='vs'?'v':'k'):'';});
    c=c.filter(x=>x&&(S.fev[x]||0)<2&&!S.queue.includes(x)&&EVENTS.some(e=>e.id===x)); const id=c[Math.floor(Math.random()*c.length)];
    if(id){S.fev[id]=(S.fev[id]||0)+1;S.queue.push(id);}}
  save(); nextEvent();
}
function afterLoad(){ S.did=S.did||{}; if(S.omon==null)S.omon=100;
  if(S.phase===3&&S.A){show('assault');renderAssault();if(S.A.card==='inc')incidentCard();else if(S.A.card==='muster')musterCard();else if(S.A.card==='fin')finale(S.A.finId,S.A.finWhy);else if(S.A.card)alphaCard();return;}
  if(S.paper&&S.kremlin)return showPaper();
  if(S.queue.length)nextEvent(); else{showMain();showToast();} }
function nextEvent(){
  if(!S.queue.length){save();showMain();showToast();return;}
  const id=S.queue[0];
  showEvent(id==='assault'?ASSAULT():EVENTS.find(e=>e.id===id));
}

// ================= EVENT SCREEN =================
let evCur=null, evSel=0;
// ===== заставка «Останкино»: ночь 3 октября, башня, телецентр, толпа, грузовик у входа, БТР, трассеры. Рисуется попиксельно в 320x360 =====
function drawOstankino(c){
  const W=320,H=360, im=c.createImageData(W,H), D=im.data;
  let seed=1993; const rnd=()=>{seed=(seed*1664525+1013904223)>>>0; return seed/4294967296;};
  const hash=(x,y)=>{let h=(x*374761393+y*668265263)>>>0; h=((h^(h>>>13))*1274126177)>>>0; return ((h^(h>>>16))>>>0)/4294967296;};
  const B4=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5], bay=(x,y)=>(B4[(y&3)*4+(x&3)]+.5)/16;
  const set=(x,y,r,g,b)=>{x|=0;y|=0; if(x<0||y<0||x>=W||y>=H)return; const i=(y*W+x)*4; D[i]=r;D[i+1]=g;D[i+2]=b;D[i+3]=255;};
  const get=(x,y)=>{const i=((y|0)*W+(x|0))*4; return [D[i],D[i+1],D[i+2]];};
  const P=(x,y,col)=>set(x,y,col[0],col[1],col[2]);
  const R=(x,y,w,h,col)=>{for(let j=0;j<h;j++)for(let i=0;i<w;i++)P(x+i,y+j,col);};
  const add=(x,y,r,g,b,k)=>{x|=0;y|=0; if(x<0||y<0||x>=W||y>=H)return; const i=(y*W+x)*4; D[i]=Math.min(255,D[i]+r*k);D[i+1]=Math.min(255,D[i+1]+g*k);D[i+2]=Math.min(255,D[i+2]+b*k);};
  const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
  const noise=(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,s=t=>t*t*(3-2*t),a=hash(xi,yi),b=hash(xi+1,yi),cc=hash(xi,yi+1),d=hash(xi+1,yi+1); return a+(b-a)*s(fx)+(cc-a)*s(fy)+(a-b-cc+d)*s(fx)*s(fy);};
  const fbm=(x,y)=>noise(x,y)*.55+noise(x*2.1,y*2.1)*.3+noise(x*4.3,y*4.3)*.15;
  const glow=(cx,cy,rad,r,g,b,k)=>{for(let y=-rad;y<=rad;y++)for(let x=-rad;x<=rad;x++){const d=Math.sqrt(x*x+y*y)/rad; if(d>=1)continue; const v=(1-d)*(1-d); if(v>bay(cx+x,cy+y)*.9)add(cx+x,cy+y,r,g,b,k*(.35+v*.65));}};
  const HOR=262;
  // --- небо: ступенчатый градиент с дизерингом, зарево у горизонта слева (пожар у входа)
  const SKY=[[7,8,16],[9,11,21],[12,14,26],[16,17,30],[22,20,33],[30,23,34],[40,27,33],[54,33,32]];
  for(let y=0;y<HOR;y++)for(let x=0;x<W;x++){ let t=Math.pow(y/HOR,1.7)*6.2+Math.max(0,1-Math.hypot(x-70,y-250)/170)*1.6; t+=bay(x,y)-.5; const k=Math.max(0,Math.min(SKY.length-1,Math.round(t))); P(x,y,SKY[k]); }
  // звёзды
  for(let i=0;i<70;i++){const x=(rnd()*W)|0,y=(rnd()*170)|0,b=rnd(); P(x,y,b>.85?[190,198,226]:b>.5?[96,106,140]:[52,60,88]);}
  // дым: тянется от входа вверх и вправо
  for(let y=40;y<HOR;y++)for(let x=0;x<W;x++){ const u=(x-104-(HOR-y)*.42)/(26+(HOR-y)*.5), band=Math.exp(-u*u*2.6)*Math.min(1,y/70); const n=fbm(x*.035+3,y*.05+7)*band;
    if(n>.30+bay(x,y)*.10){const hot=Math.max(0,1-(HOR-y)/90); P(x,y,mix(n>.46?[40,36,44]:[26,25,34],[92,50,36],hot*.55));} }
  // --- башня (вдали, правее центра)
  const TX=222, wAt=y=>y<22?1:y<44?2:y<68?3:y<92?5:y<100?7:y<104?9:y<110?13:y<120?16:y<124?12:y<232?7.5+(y-124)*.055:13.5+Math.pow((y-232)/30,1.8)*30;
  const TC=[[104,110,130],[72,78,98],[46,50,68],[30,33,46]];
  for(let y=6;y<HOR;y++){ const w=wAt(y), x0=Math.round(TX-w/2), x1=Math.round(TX+w/2);
    for(let x=x0;x<Math.max(x1,x0+1);x++){ const u=(x-x0+.5)/Math.max(1,x1-x0); let k=u<.22?0:u<.5?1:u<.8?2:3; if(k<3&&bay(x,y)<((u*4)%1)*.5)k++;
      let col=TC[k]; if(y<92){ col=((y/9)|0)%2?[150,58,52]:[168,170,180]; if(u>.5)col=mix(col,[20,20,30],.45); }
      P(x,y,col); } }
  // кольцевые балконы и вертикальные ряды окон ствола
  for(const y of [140,158,176,194,212]){const w=wAt(y)+4; for(let x=Math.round(TX-w/2);x<Math.round(TX+w/2);x++){P(x,y,[120,126,146]);P(x,y+1,[26,28,40]);}}
  for(let y=126;y<230;y+=3){P(TX-1,y,[24,26,38]); if(hash(7,y)>.8)P(TX-1,y,[226,190,110]);}
  // главный блок: смотровая и ресторан, свет в окнах
  for(let x=TX-8;x<TX+8;x++){P(x,110,[132,138,158]); if((x+TX)%2)P(x,113,hash(x,3)>.3?[236,204,124]:[40,44,60]); P(x,116,[28,30,42]); if(x%2)P(x,117,hash(x,9)>.5?[214,170,96]:[36,40,54]); P(x,119,[22,24,34]);}
  for(let x=TX-6;x<TX+7;x++)P(x,104,[120,126,146]);
  // арки основания
  for(const ax of [-12,-5,3,10]){for(let y=250;y<HOR;y++){const hw=y<253?1:2; for(let x=-hw;x<=hw;x++)P(TX+ax+x,y,[10,11,18]);}}
  // красные огни
  for(const [x,y] of [[TX,6],[TX-1,44],[TX+1,68],[TX-3,92],[TX+3,92],[TX-8,110],[TX+7,110],[TX-5,176],[TX+5,176]]){glow(x,y,5,120,20,14,1);P(x,y,[255,96,72]);}
  // --- дальний план: деревья парка и дома за прудом
  for(let x=0;x<W;x++){ const h=6+fbm(x*.09,1)*16+(hash(x,77)>.7?2:0); for(let y=HOR-h;y<HOR;y++){const e=y-(HOR-h); P(x,y,e<2&&hash(x,y)>.5?[22,26,24]:[11,14,15]);} }
  for(const [x,w,h] of [[250,26,20],[284,36,28],[204,14,12]]){R(x,HOR-h-4,w,h,[18,20,28]); for(let j=2;j<h-2;j+=3)for(let i=2;i<w-1;i+=3)if(hash(x+i,j)>.72)P(x+i,HOR-h-4+j,[198,160,90]);}
  // --- земля: асфальт улицы Королёва
  for(let y=HOR;y<H;y++)for(let x=0;x<W;x++){ const n=hash(x,y), d=(y-HOR)/(H-HOR); let col=n>.93?[30,30,36]:n<.12?[11,12,16]:[18,19,24]; if(bay(x,y)<d*.35)col=[13,14,18]; P(x,y,col); }
  for(let x=0;x<W;x++){P(x,296-(x*.02|0),[40,40,46]); if(((x+4)/14|0)%2)P(x,318,[58,56,54]);}
  // отражения окон и огня на мокром асфальте
  for(let x=0;x<196;x++){const h1=hash((x/6)|0,41); if(h1>.72)for(let y=294;y<294+10+h1*14;y++)if(bay(x,y)<.34*(1-(y-294)/26))add(x,y,40,30,14,1);}
  // --- телецентр: длинный стеклянный фасад в перспективе (ближний край слева)
  const FX=196, top=x=>198+x*.105, bot=x=>292-x*.04;
  for(let x=0;x<FX;x++){ const t=top(x), b=bot(x), hh=b-t, sc=1-x/FX*.34, cell=x/(7.2*sc)|0, inCell=(x/(7.2*sc))%1;
    for(let y=Math.floor(t);y<b;y++){ const v=(y-t)/hh; let col;
      if(v<.04)col=[96,102,122]; else if(v<.07)col=[28,30,42];
      else if(v<.66){ const f=(v-.07)/.59*5, fl=f|0, fv=f%1; // пять этажей ленточного остекления
        if(fv<.34)col=bay(x,y)<.5?[58,62,78]:[50,54,70];
        else if(inCell<.14)col=[22,24,34];
        else{ const h1=hash(cell,fl+11); col=h1>.80?(fv<.5?[250,222,150]:[226,186,108]):h1>.70?[112,146,190]:h1>.62?[120,92,54]:(fv<.48?[30,36,52]:[15,18,28]); if(h1<=.62&&hash(x,y)>.94)col=[44,52,74]; } }
      else if(v<.70)col=[104,108,126];
      else{ const pc=(x/(11*sc))%1; // двухсветный вестибюль: пилоны и витражи
        if(pc<.2)col=v<.74?[120,124,140]:[84,88,104]; else { const h2=hash((x/(11*sc))|0,5); col=h2>.55?[188,150,84]:h2>.4?[92,76,50]:[16,19,29]; if(((y-t)|0)%7===0)col=[30,32,44]; if(v>.95)col=[40,42,54]; } }
      P(x,y,col); } }
  for(let x=FX;x<FX+12;x++){const t=top(FX)+(x-FX)*.5,b=bot(FX)-(x-FX)*.3; for(let y=t|0;y<b;y++)P(x,y,(y-t)<2?[60,64,80]:hash(x,y)>.9?[30,33,46]:[22,24,35]);}
  // вспышки выстрелов в окнах верхних этажей
  const FL=[[38,214],[86,221],[131,226],[160,231]]; for(const [x,y] of FL){glow(x,y,6,255,200,110,.9);R(x-1,y-1,3,3,[255,244,200]);P(x-2,y,[255,214,130]);P(x+2,y,[255,214,130]);}
  // --- пролом у входа: огонь и грузовик, застрявший в дверях
  const EX=104, EY=bot(EX)|0;
  for(let y=EY-26;y<EY;y++)for(let x=EX-13;x<EX+14;x++){const d=Math.hypot((x-EX)/13,(y-EY+6)/22), n=fbm(x*.3,y*.3+2); if(d<1){const v=1-d+n*.35-.2; P(x,y,v>.75?[255,236,170]:v>.55?[250,176,70]:v>.35?[206,96,36]:[92,36,24]);}}
  for(let i=0;i<26;i++){const x=EX-12+rnd()*26,y=EY-30-rnd()*46; if(rnd()>.4)P(x,y,rnd()>.5?[255,170,70]:[200,90,40]);}
  glow(EX,EY-12,46,150,74,22,.55);
  // грузовик (вид сзади-сбоку): тент, кузов, кабина ушла в проём
  {const x=EX-11,y=EY-17; R(x,y,24,11,[58,66,46]); R(x,y,24,2,[92,100,70]); for(let i=0;i<24;i+=5)R(x+i,y+2,1,9,[44,50,36]); R(x,y+11,24,5,[36,40,30]); R(x,y+11,24,1,[70,74,54]); R(x+24,y+3,6,10,[40,46,34]); R(x+25,y+5,4,3,[240,170,70]);
   R(x+2,y+15,6,5,[8,8,10]);R(x+15,y+15,6,5,[8,8,10]);P(x+4,y+17,[60,60,60]);P(x+17,y+17,[60,60,60]); P(x,y+12,[220,40,30]);P(x+1,y+12,[220,40,30]); for(let i=0;i<24;i++)if(hash(i,3)>.6)P(x+i,y,[150,120,70]);}
  // --- фонари
  for(const [x,y0] of [[22,246],[168,252],[300,250]]){ R(x,y0,1,300-y0,[40,42,50]); R(x,y0,5,1,[40,42,50]); P(x+5,y0+1,[255,236,180]);P(x+4,y0+1,[255,214,140]); glow(x+5,y0+2,13,120,96,50,.7);
    for(let y=292;y<312;y++)for(let i=-16;i<=16;i++){const d=Math.hypot(i/16,(y-302)/9); if(d<1&&bay(x+i,y)<(1-d)*.8)add(x+5+i,y,26,20,10,1);} }
  // --- БТР справа: корпус, башенка, колёса, фара
  {const x=236,y=288; for(let j=0;j<12;j++){const ind=j<4?4-j:j>8?(j-8)*2:0; R(x+ind,y+j,58-ind*2+(j<4?0:2),1,j<1?[84,92,66]:j<5?[58,66,46]:[40,46,34]);}
   R(x+20,y-6,14,6,[52,60,42]);R(x+20,y-6,14,1,[86,94,68]);R(x+4,y-4,17,1,[70,76,58]);R(x+4,y-3,3,1,[30,32,26]);
   for(const wx of [6,19,33,46]){R(x+wx,y+10,8,7,[7,7,9]);R(x+wx+2,y+12,4,3,[34,34,36]);P(x+wx+3,y+13,[70,70,70]);}
   for(let i=8;i<52;i+=9)P(x+i,y+3,[30,34,26]); R(x+1,y+5,2,2,[255,240,190]); glow(x+1,y+6,12,150,130,80,.8);
   for(let i=1;i<60;i++){const hw=i*.16; for(let j=-hw;j<=hw;j++)if(bay(x-i,y+8+(i*.22|0)+(j|0))<.5*(1-i/60))add(x-i,y+8+i*.22+j,40,34,18,1);}
   glow(x+2,y-4,7,255,190,100,.9);R(x+1,y-5,3,3,[255,246,206]);}
  // --- трассеры: из окон и от БТР по площади
  const tr=(x1,y1,x2,y2)=>{const n=Math.max(Math.abs(x2-x1),Math.abs(y2-y1)); for(let i=0;i<=n;i++){const t=i/n,x=x1+(x2-x1)*t,y=y1+(y2-y1)*t,ph=i%9; if(ph<5){P(x,y,ph<1?[255,250,220]:[255,206,110]); add(x,y+1,90,46,10,.6);add(x,y-1,90,46,10,.4);} } };
  tr(40,216,150,318); tr(88,223,214,330); tr(162,233,96,320); tr(238,284,120,300);
  // --- толпа: дальний ряд (мелкие фигуры) и ближний (крупнее), отсвет огня слева
  const man=(x,y,s,lit)=>{ const b=[[24,26,34],[34,30,30],[26,34,30],[40,36,32],[20,22,30]][(hash(x,y)*5)|0], sk=lit?[150,104,70]:[62,52,48], rim=lit?[176,112,56]:[52,54,66];
    if(s===1){ P(x,y,sk);P(x+1,y,sk); R(x,y+1,2,4,b); P(x,y+1,rim); P(x,y+5,[10,10,12]);P(x+1,y+5,[10,10,12]); }
    else{ R(x+1,y,2,2,sk); R(x,y+2,4,6,b); R(x,y+2,1,6,rim); R(x,y+8,1,4,[10,10,13]);R(x+3,y+8,1,4,[10,10,13]); if(hash(x,y+1)>.6){P(x-1,y+3,b);P(x+4,y+3,b);} } };
  for(let i=0;i<64;i++){const x=4+rnd()*226,y=297+rnd()*10; man(x|0,y|0,1,Math.abs(x-EX)<60&&rnd()>.3);}
  // лежащие у входа
  for(const [x,y] of [[62,304],[140,308],[178,313]]){R(x,y,6,2,[26,26,32]);P(x+6,y,[70,56,50]);}
  // флаги: красный, имперский чёрно-жёлто-белый, красный
  const flag=(x,y,rows)=>{R(x,y,1,16,[70,66,60]); rows.forEach((cc,j)=>{for(let i=1;i<9;i++)P(x+i,y+j+((i/3)|0)%2,cc);});};
  flag(58,318,[[178,40,36],[178,40,36],[150,30,30],[150,30,30],[120,24,26]]);
  flag(126,322,[[20,20,22],[20,20,22],[214,170,50],[214,170,50],[214,210,200],[214,210,200]]);
  flag(206,320,[[170,36,34],[170,36,34],[140,28,30],[140,28,30],[116,22,26]]);
  for(let i=0;i<46;i++){const x=rnd()*312,y=322+rnd()*26; man(x|0,y|0,2,x<170&&rnd()>.45);}
  // лёгкое затемнение краёв
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const d=Math.hypot((x-W/2)/(W*.72),(y-H*.5)/(H*.72)); if(d>.62){const k=Math.max(.55,1-(d-.62)*1.1),i=(y*W+x)*4; D[i]*=k;D[i+1]*=k;D[i+2]*=k;}}
  c.putImageData(im,0,0);
}
// ===== заставка «Танки бьют по Белому дому»: Новоарбатский мост, выстрел, попадание в верхние этажи. Фон — утверждённый рисунок горящего Белого дома =====
function drawTankShot(c){
  const W=320,H=360; c.drawImage(TitleArt.calm,292,0,W,H,0,0,W,H);
  const im=c.getImageData(0,0,W,H), D=im.data;
  let seed=4101993; const rnd=()=>{seed=(seed*1664525+1013904223)>>>0; return seed/4294967296;};
  const hash=(x,y)=>{let h=((x|0)*374761393+(y|0)*668265263)>>>0; h=((h^(h>>>13))*1274126177)>>>0; return ((h^(h>>>16))>>>0)/4294967296;};
  const B4=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5], bay=(x,y)=>(B4[(y&3)*4+(x&3)]+.5)/16;
  const P=(x,y,col)=>{x|=0;y|=0; if(x<0||y<0||x>=W||y>=H)return; const i=(y*W+x)*4; D[i]=col[0];D[i+1]=col[1];D[i+2]=col[2];D[i+3]=255;};
  const R=(x,y,w,h,col)=>{for(let j=0;j<h;j++)for(let i=0;i<w;i++)P(x+i,y+j,col);};
  const add=(x,y,r,g,b,k)=>{x|=0;y|=0; if(x<0||y<0||x>=W||y>=H)return; const i=(y*W+x)*4; D[i]=Math.min(255,D[i]+r*k);D[i+1]=Math.min(255,D[i+1]+g*k);D[i+2]=Math.min(255,D[i+2]+b*k);};
  const dark=(x,y,k)=>{x|=0;y|=0; if(x<0||y<0||x>=W||y>=H)return; const i=(y*W+x)*4; D[i]*=k;D[i+1]*=k;D[i+2]*=k;};
  const noise=(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,s=t=>t*t*(3-2*t),a=hash(xi,yi),b=hash(xi+1,yi),cc=hash(xi,yi+1),d=hash(xi+1,yi+1); return a+(b-a)*s(fx)+(cc-a)*s(fy)+(a-b-cc+d)*s(fx)*s(fy);};
  const fbm=(x,y)=>noise(x,y)*.55+noise(x*2.1,y*2.1)*.3+noise(x*4.3,y*4.3)*.15;
  const glow=(cx,cy,rad,r,g,b,k)=>{for(let y=-rad;y<=rad;y++)for(let x=-rad;x<=rad;x++){const d=Math.sqrt(x*x+y*y)/rad; if(d>=1)continue; const v=(1-d)*(1-d); if(v>bay(cx+x,cy+y)*.9)add(cx+x,cy+y,r,g,b,k*(.35+v*.65));}};
  const blob=(cx,cy,rx,ry,pal,sx,sy,thr)=>{for(let y=-ry;y<=ry;y++)for(let x=-rx;x<=rx;x++){const d=Math.hypot(x/rx,y/ry), n=fbm((cx+x)*sx+5,(cy+y)*sy+9), v=1-d+(n-.5)*.9; if(v>thr+bay(cx+x,cy+y)*.12){const k=Math.min(pal.length-1,((v-thr)*pal.length*1.5)|0); P(cx+x,cy+y,pal[k]);}}};
  // проекция: танк стоит кормой к зрителю, носом и стволом к зданию (вид сзади-сбоку и чуть сверху)
  const deck=x=>262-x*.02, KM=24, YA=35*Math.PI/180, PT=17*Math.PI/180, CX0=226, CY0=318;
  const FV=[-Math.sin(YA)*KM,-Math.cos(YA)*Math.sin(PT)*KM], RV=[Math.cos(YA)*KM,-Math.sin(YA)*Math.sin(PT)*KM], UV=[0,-Math.cos(PT)*KM];
  const pr=(x,y,z)=>[CX0+x*RV[0]+y*FV[0]+z*UV[0], CY0+x*RV[1]+y*FV[1]+z*UV[1]]; // x вправо, y вперёд, z вверх (метры)
  const EL=16*Math.PI/180, bdir=[0,Math.cos(EL),Math.sin(EL)], B0=[0,1.7,1.62], BL=5.3;
  const [BX,BY]=pr(B0[0],B0[1],B0[2]), [MX,MY]=pr(B0[0],B0[1]+bdir[1]*BL,B0[2]+bdir[2]*BL);
  const dl=Math.hypot(MX-BX,MY-BY), HX=Math.round(MX+(MX-BX)/dl*100), HY=Math.round(MY+(MY-BY)/dl*100);
  // --- попадание: копоть на верхних этажах, шар разрыва, обломки, столб дыма
  for(let y=-30;y<=16;y++)for(let x=-30;x<=30;x++){const d=Math.hypot(x/30,(y+8)/22), n=fbm((HX+x)*.09,(HY+y)*.11); const v=1-d+(n-.5)*.7; if(v>.12){const k=Math.max(.28,1-v*1.15); if(bay(HX+x,HY+y)<Math.min(1,v*2.4))dark(HX+x,HY+y,k);}}
  blob(HX+5,HY-44,20,36,[[34,32,36],[48,44,48],[66,60,62],[88,78,76]],.06,.045,.16);
  blob(HX+18,HY-86,28,22,[[30,29,34],[42,40,44],[58,54,58]],.05,.05,.20);
  blob(HX,HY-4,15,12,[[120,44,24],[196,84,30],[244,150,54],[255,214,120],[255,246,214]],.22,.22,.22);
  glow(HX,HY-4,30,160,84,26,.6);
  for(const [fx,fy] of [[HX+17,HY+9],[HX-13,HY+13]]){R(fx,fy,3,4,[236,120,40]);R(fx,fy+1,2,3,[255,208,110]);P(fx+1,fy-1,[250,160,60]);P(fx+1,fy-2,[200,90,36]);glow(fx+1,fy+1,7,150,70,20,.6);}
  for(let i=0;i<34;i++){const a=rnd()*6.283, r=10+rnd()*22, x=HX+Math.cos(a)*r*1.2, y=HY-6+Math.sin(a)*r*.9-rnd()*10, t=rnd(); P(x,y,t>.6?[255,196,96]:t>.3?[214,208,196]:[40,36,36]); if(t>.8)P(x+1,y,[255,236,170]);}
  for(let i=0;i<14;i++){const x=HX-30+rnd()*60, y0=HY+8+rnd()*10, len=6+rnd()*22; for(let j=0;j<len;j++)if(hash(x,y0+j)>.35)P(x+((j/7)|0)%2,y0+j,[206,200,188]);}
  // --- настил моста на переднем плане и перила у дальнего края
  for(let x=0;x<W;x++){ const d=deck(x)|0; for(let y=d;y<H;y++){const n=hash(x,y), v=(y-d)/(H-d); let col=n>.94?[40,40,46]:n<.1?[12,13,16]:[22,23,28]; if(y-d<2)col=[70,70,76]; else if(bay(x,y)<v*.4)col=[15,16,20]; P(x,y,col);}
    const ry=d-13; P(x,ry,[82,84,92]);P(x,ry+1,[30,31,38]); P(x,ry+6,[54,56,64]); if(x%13===4){for(let y=ry;y<d;y++){P(x,y,[74,76,84]);P(x+1,y,[34,35,42]);}} }
  for(let x=0;x<W;x+=1)if(((x+6)/18|0)%2)P(x,352-(x*.04|0),[70,68,62]);
  // фонарь моста
  {const x=22,d=deck(x)|0; R(x,d-78,2,78,[52,54,62]); R(x-8,d-78,18,2,[52,54,62]); R(x-9,d-76,4,2,[30,31,38]);R(x+7,d-76,4,2,[30,31,38]);}
  // --- танк Т-80 на мосту: коробки корпуса, гусениц и башни в проекции, грани с разным светом
  const OL=[[112,122,86],[84,94,64],[60,70,47],[42,50,35],[26,31,24]];
  const mixc=(a,b)=>[(a[0]+b[0])>>1,(a[1]+b[1])>>1,(a[2]+b[2])>>1];
  const poly=(pts,f)=>{let y0=1e9,y1=-1e9; for(const p of pts){y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1]);} for(let y=Math.round(y0);y<=Math.round(y1);y++){let xs=[]; for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length]; if((a[1]<=y&&b[1]>y)||(b[1]<=y&&a[1]>y))xs.push(a[0]+(y-a[1])/(b[1]-a[1])*(b[0]-a[0]));} if(xs.length<2)continue; xs.sort((p,q)=>p-q); for(let x=Math.round(xs[0]);x<=Math.round(xs[xs.length-1]);x++)P(x,y,typeof f==='function'?f(x,y):f);}};
  const line=(x1,y1,x2,y2,th,col,hi,lo)=>{const n=Math.max(Math.abs(x2-x1),Math.abs(y2-y1))*2; for(let i=0;i<=n;i++){const t=i/n,x=x1+(x2-x1)*t,y=y1+(y2-y1)*t; for(let k=0;k<th;k++)P(x,y+k,k===0?hi:k>=th-1?lo:k<th*.45?mixc(hi,col):col);}};
  const edge=(a,b,col)=>line(a[0],a[1],b[0],b[1],1,col,col,col);
  // коробка: видны верх, корма и левый борт
  const box=(x0,x1,y0,y1,z0,z1,ct,cr,cs)=>{ const p=(x,y,z)=>pr(x,y,z);
    poly([p(x0,y0,z0),p(x1,y0,z0),p(x1,y0,z1),p(x0,y0,z1)],cr); poly([p(x0,y0,z0),p(x0,y1,z0),p(x0,y1,z1),p(x0,y0,z1)],cs); poly([p(x0,y0,z1),p(x1,y0,z1),p(x1,y1,z1),p(x0,y1,z1)],ct);
    edge(p(x0,y0,z1),p(x1,y0,z1),OL[0]); edge(p(x0,y0,z1),p(x0,y1,z1),OL[0]); edge(p(x0,y0,z0),p(x0,y0,z1),OL[4]); };
  const tex=(c,k)=>(x,y)=>hash(x,y)>.9?mixc(c,OL[4]):bay(x,y)<k?mixc(c,OL[3]):c;
  // тень под танком
  poly([pr(-2,-3.9,0),pr(2.1,-3.9,0),pr(2.1,3.7,0),pr(-2,3.7,0)],(x,y)=>bay(x,y)<.7?[10,11,14]:[18,19,24]);
  // гусеницы
  for(const sx of [1,-1]){ const a=sx<0?-1.75:1.05, b=sx<0?-1.05:1.75; box(a,b,-3.5,3.5,0,.9,[24,26,26],(x,y)=>(y%3===0)?[40,42,42]:[14,15,16],[16,17,18]); }
  // катки по левому борту
  for(let i=0;i<6;i++){const wy=-2.75+i*1.1; for(let t=0;t<360;t+=6)for(let r=0;r<=.36;r+=.06){const [x,y]=pr(-1.77,wy+Math.cos(t*Math.PI/180)*r*1.15,.44+Math.sin(t*Math.PI/180)*r*1.15); P(x,y,r<.08?[96,100,88]:r<.14?[28,32,28]:r<.3?[52,60,46]:[20,22,20]);}}
  // корпус с надгусеничными полками, корма с решёткой и бочками
  box(-1.75,1.75,-3.35,3.2,.74,1.26,tex(OL[2],.2),tex(OL[4],.3),tex(OL[3],.25));
  for(let i=0;i<5;i++){const [a1,b1]=pr(-1.3+i*.62,-3.36,.82),[a2,b2]=pr(-1.3+i*.62,-3.36,1.02); line(a1,b1,a2,b2,1,OL[4],OL[4],OL[4]);}
  for(const dx of [-1.25,.12]){box(dx,dx+1.13,-3.95,-3.4,1.0,1.56,tex(OL[1],.15),tex(OL[3],.25),tex(OL[2],.2)); const [a1,b1]=pr(dx+.56,-3.96,1.0),[a2,b2]=pr(dx+.56,-3.96,1.56); line(a1,b1,a2,b2,1,OL[4],OL[4],OL[4]);}
  {const [a,b]=pr(-1.5,-3.36,.9); R(a|0,b|0,2,2,[200,40,30]); const [a2,b2]=pr(1.5,-3.36,.9); R(a2|0,b2|0,2,2,[200,40,30]);}
  for(let i=0;i<6;i++){const [a,b]=pr(-1.76,-2.6+i*1.05,1.24),[a2,b2]=pr(-1.76,-2.6+i*1.05,.8); line(a,b,a2,b2,1,OL[4],OL[4],OL[4]);}
  // ствол (рисуется до башни: его основание закрыто башней)
  line(BX,BY-1,MX,MY-1,4,OL[2],OL[0],OL[4]);
  line(BX+(MX-BX)*.48,BY+(MY-BY)*.48-2,BX+(MX-BX)*.62,BY+(MY-BY)*.62-2,6,OL[2],OL[0],OL[4]);
  line(MX+2,MY,MX-1,MY-2,5,OL[3],OL[1],OL[4]);
  // башня, ящик ЗИП на корме башни, башенка командира, пулемёт, антенна
  box(-1.35,1.35,-1.1,1.75,1.26,1.98,tex(OL[1],.12),tex(OL[3],.25),tex(OL[2],.18));
  box(-1.05,1.05,-1.45,-1.1,1.36,1.76,tex(OL[1],.1),tex(OL[3],.2),tex(OL[2],.2));
  box(.35,.95,-.25,.4,1.98,2.24,OL[0],OL[3],OL[2]);
  {const [a,b]=pr(.65,.1,2.28),[a2,b2]=pr(.5,1.2,2.5); line(a,b,a2,b2,2,[34,36,34],[66,68,62],[20,22,20]); const [h1,h2]=pr(-.6,.2,1.76); for(let t=0;t<360;t+=10)for(let r=.18;r<=.3;r+=.06){const [x,y]=pr(-.6+Math.cos(t*Math.PI/180)*r,.2+Math.sin(t*Math.PI/180)*r,1.99); P(x,y,OL[3]);}}
  {const [a,b]=pr(-1.1,-.8,1.98); R(a|0,(b|0)-34,1,34,[74,76,72]);}
  // отсвет выстрела на передних кромках
  for(let y=0;y<H;y++)for(let x=120;x<300;x++){const d=Math.hypot(x-MX,y-MY); if(d<120&&y>MY+10&&bay(x,y)<(1-d/120)*.4){const i=(y*W+x)*4; if(D[i+1]>D[i+2]+8&&D[i+1]>D[i]-2)add(x,y,64,40,8,1);}}
  // --- выстрел: пламя из ствола и пороховой дым
  const ang=Math.atan2(MY-BY,MX-BX), ux=Math.cos(ang), uy=Math.sin(ang);
  blob(MX+ux*20,MY+uy*20-10,24,15,[[52,48,48],[78,72,70],[108,100,94],[146,136,124]],.09,.11,.30);
  blob(MX+2,MY+16,18,9,[[60,56,54],[92,86,80]],.12,.14,.34);
  for(let i=0;i<34;i++){const w=i<7?3+i*1.0:Math.max(0,9-(i-7)*.34); for(let k=-w;k<=w;k+=.5){const x=MX+ux*i-uy*k, y=MY+uy*i+ux*k, a=Math.abs(k)/(w+.01); P(x,y,a<.35?[255,250,224]:a<.7?[255,208,110]:[236,122,40]);}}
  for(const sd of [-1,1])for(let i=0;i<18;i++)for(let t=0;t<2;t++){const x=MX+ux*4-uy*sd*i*1.1+ux*i*.3+t, y=MY+uy*4+ux*sd*i*1.1+uy*i*.3; P(x,y,i<8?[255,232,160]:[236,140,50]);}
  glow(MX+ux*10,MY+uy*10,40,190,120,40,.7);
  for(let i=34;i<80;i++){const x=MX+ux*i,y=MY+uy*i; if(i%8<5){P(x,y,[255,240,190]);P(x,y+1,[255,190,100]);add(x,y+2,90,50,14,.7);add(x,y-1,90,50,14,.5);}}
  for(let i=0;i<30;i++){const d=44+rnd()*40,k=(rnd()-.5)*30; P(MX+ux*d-uy*k,MY+uy*d+ux*k,rnd()>.5?[255,200,100]:[230,120,44]);}
  // пыль из-под гусениц
  
  // гильзы и осколки бетона на асфальте
  for(let i=0;i<24;i++){const x=rnd()*W,y=deck(x)+4+rnd()*(H-deck(x)-6); P(x,y,rnd()>.5?[150,126,60]:[92,90,88]);}
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const d=Math.hypot((x-W/2)/(W*.72),(y-H*.5)/(H*.72)); if(d>.66){const k=Math.max(.6,1-(d-.66)*1.1),i=(y*W+x)*4; D[i]*=k;D[i+1]*=k;D[i+2]*=k;}}
  c.putImageData(im,0,0);
}
let _tankURL=null; function tankShotURL(){ if(!_tankURL){const cv=document.createElement('canvas');cv.width=320;cv.height=360;drawTankShot(cv.getContext('2d'));_tankURL=cv.toDataURL();} return _tankURL; }
function drawPhoto(pic){
  const c=$('ev-photo').getContext('2d'); c.fillStyle='#0b0c0f'; c.fillRect(0,0,320,360);
  if(pic!=='yeltsin'&&PEOPLE[pic]&&PEOPLE[pic].img){const P=PEOPLE[pic],im=new Image();c.imageSmoothingEnabled=false;im.onload=()=>c.drawImage(im,0,0,320,360);im.src=P.img;
    $('ev-cap-n').textContent=P.nm.toUpperCase();$('ev-cap-r').textContent=P.role.charAt(0).toUpperCase()+P.role.slice(1);}
  else if(pic==='yeltsin'){const im=new Image();im.onload=()=>c.drawImage(im,0,0);im.src=ASSET_YELTSIN;
    $('ev-cap-n').textContent='보리스 옐친';$('ev-cap-r').textContent='러시아 연방 대통령';}
  else if(pic==='tank'){ TitleArt.onReady(()=>drawTankShot(c));
    $('ev-cap-n').textContent='노비 아르바트 다리';$('ev-cap-r').textContent='전차가 백악관을 포격한다';}
  else if(pic==='ost'){ drawOstankino(c);
    $('ev-cap-n').textContent='오스탄키노';$('ev-cap-r').textContent='방송센터, 아카데미카 코롤료바 거리 12';}
  else{TitleArt.onReady(()=>c.drawImage(pic==='whf'?TitleArt.burning:TitleArt.calm,270,0,320,360,0,0,320,360));
    $('ev-cap-n').textContent='백악관';$('ev-cap-r').textContent='소비에트 청사, 크라스노프레스넨스카야 강변';}
}
function showEvent(ev){
  evCur=ev; evSel=Math.max(0,ev.ch.findIndex(c=>!(c.req&&!c.req(S)))); show('event'); drawPhoto(ev.pic); Sfx.play(ev.end?(ev.win?'win':'lose'):ev.pic==='yeltsin'?'static':ev.urgent?'alarm':/grachev|kolesn|yerin/.test(ev.pic)?'phone':'paper');
  const tag=$('ev-tag'); tag.className='tag'+(ev.end?(ev.win?' win':' end'):''); tag.textContent=ev.end?(ev.win?'승리':ev.tier==='neu'?'무승부 · 승자 없는 위기':'패배'):ev.tag||'사건';
  $('ev-hud').innerHTML=`<span><b>${S.day}</b>일차</span><span>정통성 <b>${S.leg}</b></span><span>결의 <b>${S.hope}%</b></span><span>급진성 <b>${S.rad}%</b></span>`;
  $('ev-meta').textContent=(dateStr(S.day)+' 1993'+(ev.time?' · '+ev.time:'')).toUpperCase();
  $('ev-meta2').textContent=ev.urgent?'긴급':'';
  $('ev-h').textContent=ev.h; $('ev-q').textContent=ev.q||''; $('ev-p').textContent=ev.p; $('ev-res').innerHTML='';
  renderChoices();
}
function renderChoices(){
  $('ev-ch').innerHTML=evCur.ch.map((c,i)=>{const fx=c.fx?fxText(merge(c.fx,c.fac?{fac:c.fac}:{})):'';
    let e=[fx,typeof c.e==='function'?c.e(S):c.e].filter(Boolean).join(' · ');
    const lk=c.req&&!c.req(S); if(lk)e='<span class="n">필요: '+c.rq+'</span>'; else if(c.rq)e=[e,'<span class="p">열림: '+c.rq+'</span>'].filter(Boolean).join(' · ');
    return `<div class="ch${i===evSel?' sel':''}${lk?' lock':''}" data-i="${i}"><span class="k">${i+1}</span><span>${c.t}</span>${e?`<span class="e">${e}</span>`:''}</div>`;}).join('');
  $('ev-ch').querySelectorAll('.ch').forEach(d=>{d.onmouseenter=()=>{evSel=+d.dataset.i;$('ev-ch').querySelectorAll('.ch').forEach((x,j)=>x.classList.toggle('sel',j===evSel));};
    d.onclick=()=>choose(+d.dataset.i);});
}
function choose(i){
  const ev=evCur, c=ev.ch[i]; if(!c)return; if(c.req&&!c.req(S))return;
  if(c.go)return c.go();
  S.queue.shift(); S.fired[ev.id]=1;
  if(ev.run)ev.run(S);
  apply(fxOf(c)); if(c.run)c.run(S);
  S.chron.push({date:dateStr(S.day),h:ev.h,ch:c.t}); store.set(CHRON,S.chron);
  log(ev.h.charAt(0)+ev.h.slice(1).toLowerCase()+': '+c.t.toLowerCase()+'.');
  if(checkLose())return;
  nextEvent();
}

// ---------- assault intro and endings ----------
function ASSAULT(){return {id:'assault',pic:unitStance(UNITS.find(u=>u.id==='tanks'))==='refuse'?'whf':'tank',time:'07:00',urgent:1,tag:'3단계 · 강습',h:'강습',q:'노비 아르바트 다리 위의 전차',
  p:(S.flags.corner==='army'?'군은 옐친의 곁을 떠나고 있다: 국방부와 총참모부는 거의 공공연히 대회 편이다. 옐친은 내일이면 강습에 쓸 사람이 없다는 것을 알고, 아직 말을 듣는 이들에게 오늘 명령을 내린다. ':S.flags.corner==='elect'?'법원, 지방, 도시가 선거를 요구한다. 옐친은 궁지에 몰려, 명령이 아직 먹히는 동안 힘으로 끝내기로 한다. 부대들은 마지못해 움직인다. ':'')+'새벽에 장갑차가 백악관으로 다가온다. 어떤 무력 요원이 명령을 이행하고 어떤 이가 거부할지는 당신들이 누구와 먼저 합의했는지에 달렸다. 방어는 저녁까지 시간 단위로 이어진다.',
  ch:[
    {t:'무기를 들어라! 방어 태세',e:`전투원 ${fmt(S.mil)} · 비무장 ${fmt(S.ppl)} · 바리케이드 ${S.bar}/5`,go:()=>startAssault()},
    {t:'보장을 받고 사람들을 빼낸다',e:'의원들이 싸우지 않고 항복한다',go:()=>ending('surrender')},
  ]};}
const ENDINGS={
  win_army:{win:1,pic:'wh',h:'군대는 인민과 함께',q:'국방부와 총참모부가 인민대표대회를 지지했다',
    p:'군관구 사령관들이 1400호 대통령령 집행을 거부했다. 의회를 공격할 병력이 없고, 군대가 없으면 크렘린은 응수할 수단이 없다. 옐친은 조기 대선에 동의한다.'},
  win_elect:{win:1,pic:'whf',h:'선거',q:'강습이 격퇴되었고 크렘린은 물러났다',
    p:'옐친은 힘으로 해결하려다 실패했다. 헌법재판소, 지방 소비에트, 언론이 한목소리로 대통령령이 위법이라고 선언했다. 크렘린은 봉쇄를 풀고 인민대표대회의 조건에 따른 동시 선거에 동의한다.'},
  elect_deal:{tier:'neu',pic:'wh',h:'제로 옵션',q:'강습 대신 선거',
    p:'총성은 없었다. 법원, 지방, 언론이 양쪽을 모두 물러서게 했다. 1400호 대통령령은 폐지되었고, 인민대표대회의 결정도 함께 무효가 되었으며, 동시 선거가 확정되었다. 최고회의는 선거 때까지 버텼지만 이것은 승리가 아니다. 선거에서 크렘린은 방송, 돈, 선거관리위원회를 쥐고 있고, 새 의회법은 여러분 없이 쓰였다. 최고회의는 예전 역할을 다시는 갖지 못할 것이다.'},
  held:{win:1,pic:'whf',h:'버텨냈다',q:'강습이 무산되었다',
    p:'백악관은 불타고 있지만 출입구는 지켜냈다. 저녁이 되자 수만 명의 모스크바 시민이 건물로 몰려든다. 크렘린은 휴전을 선언한다.'},
  held_iso:{tier:'neu',pic:'whf',h:'버텼지만 고립되었다',q:'강습은 격퇴되었지만 인정은 받지 못했다',
    p:'출입구는 지켰지만, 나라는 텔레비전에서 총을 든 사람들만 보았고 보복을 부추기는 외침만 들었다. 지방은 침묵하고, 서방은 반란을 말하며, 모스크바는 강변을 피해 다닌다. 크렘린은 병력을 물리고 기다린다. 인민대표대회는 불탄 건물에 앉아 있고, 아무도 그것을 권력으로 인정하지 않는다. 누구도 이기지 못했다.'},
  pyrrhic:{tier:'neu',pic:'whf',h:'크렘린의 피로스의 승리',q:'건물은 점령했지만 권력은 장악하지 못했다',
    p:'백악관은 점령되었지만, 나라는 의회에 포격이 가해지는 것을 지켜봤다. 일부 부대는 명령을 거부했고, 지방과 헌법재판소는 대통령령을 인정하지 않는다. 옐친은 크렘린에 앉아 있지만 통치할 수 없다. 그의 지시는 집행되지 않은 채 되돌아온다. 몇 달간의 이중 권력과 흥정이 이어지고, 양쪽 모두 패배한다.'},
  draw_alpha:{tier:'neu',pic:'wh',h:'‘알파’는 쏘지 않는다',q:'특수부대는 강습을 거부하고 직접 사람들을 빼냈다',
    p:'‘알파’ 장교들은 무장을 풀고 건물에 들어가 카메라 앞에서 의회에 발포하라는 명령을 따르지 않겠다고 말했다. 의원과 수비대는 그들의 보장 아래 걸어 나왔다. 백악관은 함락되었지만, 대통령의 명령은 그 자신의 특수부대에 의해 공개적으로 거부되었다. 옐친은 더 이상 지휘할 수 없고, 1400호 대통령령이 무엇이었는지 모두가 알게 되었다. 인민대표대회도 사라졌다. 나라는 승자 없는 긴 위기로 들어선다.'},
  fell:{pic:'whf',h:'10월 4일',q:'백악관이 불타고 있다',
    p:'돌격대가 건물로 밀고 들어왔다. 저녁에 수비대원들이 호송을 받으며 나온다. 최고회의는 존재하지 않게 되었다.'},
  broken:{pic:'whf',h:'사격 중지',q:'수비대원들이 무기를 내려놓았다',
    p:'전차 포격 이후 버틸 사람이 남아 있지 않다. 사람들이 흰 천을 들고 출입구에서 나온다. 인민대표대회는 해산되었다.'},
  surrender:{pic:'wh',h:'항복',q:'의원들이 건물에서 나온다',
    p:'중재자들의 보장 아래 수비대원들은 무기를 넘기고 버스 쪽으로 걸어간다. 피는 덜 흘렀지만 인민대표대회는 더 이상 없다.'},
  surrender_alpha:{pic:'whf',h:'‘알파’의 보장 아래',q:'장교들이 불타는 건물에서 사람들을 빼냈다',
    p:'‘알파’는 강습을 거부하고 직접 의원과 수비대원들을 봉쇄선 밖으로 이끌었다. 피는 더 흘릴 수도 있었다. 최고회의는 이제 없다.'},
  lose_hope:{pic:'wh',h:'흩어졌다',q:'수비대원들이 바리케이드를 떠났다',
    p:'추위, 굶주림, 불확실함이 제 몫을 했다. 백악관은 한 발의 총성도 없이 비어간다. 1400호 대통령령이 발효된다.'},
  lose_leg:{pic:'yeltsin',h:'인민대표대회가 와해되었다',q:'아무도 더 이상 최고회의를 믿지 않는다',
    p:'지방은 대통령령을 인정했고, 의원들은 차례로 위임장을 반납한다. 크렘린은 강습조차 필요하지 않다.'},
  lose_ppl:{pic:'wh',h:'텅 빈 바리케이드',q:'백악관을 지킬 사람이 없다',
    p:'마지막 자원병들이 떠났다. 밤에 OMON이 조용히 건물을 접수한다.'},
};
// условия выборов без штурма (нужны все)
function dealScore(){const mine=OUTLETS.filter(o=>outSt(S,o)==='vs').length, kr=OUTLETS.filter(o=>outSt(S,o)==='kr').length, ci=ACTIONS.kre.findIndex(a=>/Иск в Конституционный суд/.test(a.t));
  return [[(S.flags.zero||0)>=1,'제로 옵션이 채택되었다'],[!!(S.once&&S.once['kre'+ci]),'헌법재판소에 소송이 제기됨'],[mine>=10&&kr<=4,'당신들 편: 10개 이상 매체; 크렘린 편: 4개 이하 (현재 '+mine+' 그리고 '+kr+')'],
    [S.leg>=85,'정통성 85 이상 (현재 '+S.leg+')'],[S.city>=80,'모스크바 80% 이상 (현재 '+S.city+'%)'],[S.pts.mo>=50||S.pts.gs>=50,'국방부 또는 총참모부 50% 이상'],[S.rad<40&&S.fac.rne.n<=0,'급진성 40 미만이고 건물에 RNE가 없음'],[S.day>=18,'10월 1일 이전은 안 됨']];}
function checkLose(){
  if(S.phase===1){S.hope=Math.max(S.hope,10);S.leg=Math.max(S.leg,10);return false;}
  if(S.hope<=0){ending('lose_hope');return true;}
  if(S.leg<=0){ending('lose_leg');return true;}
  if(S.phase===2&&S.ppl+S.mil<=0){ending('lose_ppl');return true;}
  return false;
}
// три яруса исходов: победа, нейтральный (здание потеряно, но Ельцин политически надломлен), поражение
const endTier=id=>{const E=ENDINGS[id]||{};return E.win?'win':E.tier||'lose';};
function drawScore(){const A=S.A||{units:[],air:0}; return [[S.leg>=50,'정통성 50 이상 (현재 '+S.leg+')'],[(A.air||0)>=50,'방송 50 이상 (현재 '+Math.round(A.air||0)+')'],[A.units.some(u=>u.id!=='alpha'&&(u.st==='refuse'||u.st==='stopped')),'최소 한 개 부대가 거부했거나 저지됨'],[S.city>=55,'모스크바 55% 이상 (현재 '+S.city+'%)']];}
function ending(id,exact){
  if(exact);
  else if((id==='fell'||id==='broken')&&drawScore().filter(x=>x[0]).length>=3)id='pyrrhic';
  if(!exact&&id==='held'&&S.flags.corner)id=S.flags.corner==='army'?'win_army':'win_elect';
  if(!exact&&id==='held'&&(S.rad>=70||(S.leg<35&&S.A&&S.A.air<30)||(S.A&&S.A.air<50&&(S.A.lost||0)+S.A.units.reduce((x,u)=>x+(u.lost||0),0)>=1500)))id='held_iso'; // без прессы или ценой большой крови без камер // кучка радикалов без прессы: отбились, но никто не признал
  const E={...ENDINGS[id]}; if(id==='fell')E.h=dateStr(S.day).toUpperCase(); if(S.A)S.A.card=0; $('modal').classList.remove('on');
  store.del(SAVE); store.set(CHRON,S.chron);
  S.endId=id; if(typeof aBanQ!=='undefined')aBanQ=[]; if(typeof achEnd==='function')achEnd(id); {const bn=$('a-banner'); if(bn)bn.className='';} stat('end-'+({win:'win',neu:'neutral'}[endTier(id)]||'lose')+'-'+id.replace(/_/g,'-'));
  showEvent({...E,tier:endTier(id),id:'end',end:1,time:'',urgent:0,ch:[
    {t:'각자의 결말',go:()=>showEpi(0)},
    {t:'수치로 본 결과',go:()=>openFinal()},
    {t:'처음부터 다시',go:()=>newGame()},
    {t:'메인 메뉴로',go:()=>{show('title');renderMenu();}},
  ]});
  $('ev-res').textContent=`버틴 날: ${S.day}. 내린 결정: ${S.chron.length}.`;
}

// ===== эпилог: слайды «что стало с каждым». Гипотетические судьбы зависят от исхода, лояльности фракции, того, на чьей стороне была сила, и решений партии =====
// фракции: [ушли до конца, победа+верны, победа+колебались, поражение+верны, поражение+колебались]
const EPI_FAC={
  ros:['‘러시아’ 계파는 지지를 모으러 지방으로 흩어졌고 결말에는 맞춰 돌아오지 못했다. 바부린은 나중에 자기 사람들이 너무 일찍 떠났다고 말했고, 같은 말을 들어도 반박하지 않았다.',
       '바부린은 새 헌법 위원회를 이끈다. 포위된 건물에서 결의안을 쓰던 ‘러시아’ 법률가들이 이제 기본법을 쓰고 있고, 그 법에서 의회는 대통령보다 강하다.',
       '‘러시아’는 승리한 인민대표대회에 남았지만, 사람들은 그 표를 얻으려 설득해야 했던 날들을 기억한다. 바부린은 헌법위원회에 부위원장으로 들어갔고, 위원장은 아니었다.',
       '바부린은 건물에서 마지막으로 나온 사람 중 하나였고, 경기장 근처에서 폭행당했다. 12월 옴스크 유권자들은 그를 다시 의원으로 뽑았고, 그는 두마 연단에서 백악관에서 했던 말을 되풀이했다.',
       '最后几天，派系成员已经开始各自寻找出路。无论如何，巴布林在离开大楼时还是被殴打了；12月，鄂木斯克把他送回议会，但这次已经没有了派系。'],
  kr: ['‘러시아 공산주의자’들은 결말 전에 떠났다. 립킨은 다른 이들보다 먼저 정부와 합의해 선거를 위해 당을 지켜냈다.',
       '공산주의자들은 민족화합 정부에서 세 개 부처를 얻었다. 백악관으로 사람들을 이끌었던 당 세포 조직은 한 가을 만에 나라에서 가장 조직된 세력이 되었다.',
       '공산주의자들은 인민대표대회에 남았지만 부처는 받지 못했다. 누가 이길지 너무 오래 저울질했기 때문이다. 립킨은 자신이 가장 잘하는 일에 매달려 모두의 중재자가 되었다.',
       '계파는 끝까지 버텼고, 당은 몇 주간 활동이 금지되었다. 12월 선거 전에 금지는 해제되었다. 립킨은 두마에 들어가 초대 의장이 되었다.',
       '공산주의자들은 결말 하루 전에 건물을 떠났고, 그 점은 그들에게 유리하게 인정되었다. 정당은 즉시 선거 참여를 허가받았다. 립킨은 새 두마의 의장이 되었고, 백악관 수비대원들은 그에게 인사하기를 그만두었다.'],
  agr:['농업파 의원들은 사태가 끝나기 전에 고향 주로 돌아갔다. 수확은 기다려주지 않는다고 라프신은 말했다.',
       '농업 연맹은 인민대표대회에서 자유 매매를 금지하는 자체 버전의 토지법을 통과시켰다. 포위 기간 감자를 날랐던 국영농장은 부채 탕감을 받았다.',
       '농업파는 남았지만 마지막 날까지 흥정했다. 토지법은 절충안으로 채택되었고, 라프신은 부처 대신 위원회를 받았다.',
       '라프신은 호송을 받으며 부하들을 이끌고 나왔고 한 달 뒤 농업당을 다시 세웠다. 12월 그 당은 두마에 입성해, 백악관에 발포했던 이들과 농촌 예산을 두고 흥정했다.',
       '농업파는 집단농장을 건드리지 않겠다는 약속과 맞바꿔 위임장을 반납했다. 그 약속은 1년 갔다. 농업당은 두마에 들어가 정부 예산에 찬성표를 던졌다.'],
  otc:['‘조국’ 계파의 군복 입은 의원들이 떠나면서 지역 연줄도 함께 가져갔다. 결정적인 밤에는 사령부에 전화할 사람이 남아 있지 않았다.',
       '‘조국’ 계파의 장군들은 승자로 국방부에 돌아갔다. 타라소프는 차관직을 받았고, 가장 먼저 군 감축을 중단시켰다.',
       '‘조국’은 승리까지 버텼지만, 지역에 건 전화는 사령부가 요구한 것보다 신중했다. 부처에서 계파 장군들은 병력 없는 사무실을 받았다.',
       '‘조국’ 장군들은 군복을 입을 권리 없이 예비역으로 전역했다. 타라소프는 1년 뒤 정치에 복귀했지만, 계급장도 계파도 없이였다.',
       '‘조국’은 결말을 며칠 앞두고 지역에 대한 전화를 멈췄다. 그래도 장군들은 해임되었다. 크렘린이 기억한 것은 어떻게 끝났는가가 아니라 어떻게 시작되었는가였다.'],
  sm: ['‘교체’ 계파는 누구보다 먼저 카메라 앞에 나서서 옐친과 하스불라토프 없는 선거를 제안했다. 그 장면은 하룻밤 동안 모든 채널에서 방송되었다.',
       '‘교체’는 부끄러울 것 없는 승리의 얼굴이 되었다. 젊은 의원들은 선거를 협상했고, 모스크바에서 이긴 것은 바리케이드가 아니라 의회라고 서방에 설명했다.',
       '‘교체’는 남았고 끝까지 양쪽으로 통하는 문을 열어두었다. 선거 협상에서 골로빈은 대표단장이 아니라 고문으로 초대되었다.',
       '계파는 같은 주에 와해되었다. 의원들은 새 정당들로 흩어졌고, 골로빈은 그 뒤 몇 년 동안 자신이 총령과 발포 모두에 반대했다고 설명해야 했다.',
       '‘교체’는 결말 전에 백기를 들고 건물에서 걸어 나왔다. 크렘린은 고마워했지만 유권자들은 용서하지 않았다. 12월 계파에서 당선된 사람은 거의 없었다.'],
  kol:['‘동요파’는 한 명씩 떠났다. 대통령령은 각자에게 직책과 1년치 봉급을 약속했고, 거의 모두 그것을 받았다.',
       '‘동요파’는 남았고, 이후 그들은 단 1분도 의심하지 않았다고 말했다. 압둘라티포프는 지방과의 조정위원회를 이끌었고 그 자리에 제격임을 증명했다.',
       '‘동요파’는 문만 바라보며 승리까지 버텼다. 그들은 용서받지 못했다. 새 인민대표대회에서는 아무도 그들의 표를 미리 세지 않게 되었다.',
       '그들은 끝까지 남았고 스스로도 놀랐다. 이제 어떤 직책도 제안되지 않았다. 그래도 압둘라티포프는 몇 달 뒤 새 의회의 상원에 자리를 얻었다.',
       '크렘린이 약속한 직책과 보상을 받았다. 압둘라티포프는 연방 평의회 부의장이 되었고, 9월 일을 떠올리는 것을 좋아하지 않았다.'],
};
// силы: [победа+были за Совет, победа+были за Кремль или колебались, поражение+были за Совет, поражение+за Кремль]
const EPI_PT={
  mer:['루시코프는 바람이 어느 쪽으로 부는지 제때 알아차리고, 요청받기 전에 불을 켰다. 그는 시장직을 유지했지만, 이제 모스크바 시의회가 그의 예산을 항목별로 승인한다.',
       '루시코프는 마지막 날까지 백악관의 전기와 수도를 끊어두었다. 승리 후 첫 결정으로 모스크바 시의회는 그를 은퇴시켰다. 2년 뒤 그는 도시 정치에 복귀했다.',
       '시청은 크렘린이 참을 수 있는 것보다 오래 망설였다. 루시코프는 자리를 지켰지만 대가는 시의회였다. 시의회는 그 자신의 명령으로 해산되었다.',
       '루시코프는 건물의 전기, 수도, 하수를 끊었고 한 번도 그것을 후회하지 않았다. 시의회는 해산되었고, 그는 2010년까지 시장으로 남았다.'],
  smo:['안필로프는 스몰렌스카야로 너무 많은 사람을 데려와서 경찰이 물러섰다. 승리 후 ‘노동 러시아’는 정부 재판을 요구했고, 인민대표대회는 자기 동맹들에게 승리가 보복을 뜻하지 않는다고 설명해야 했다.',
       '안필로프는 결말 전에 거리에서 밀려났다. 그는 닫힌 문 앞에서 메가폰을 들고 인민대표대회의 승리를 맞았고, 그 승리를 자신이 도둑맞았다고 믿었다.',
       '안필로프는 끝까지 광장을 지켰다. 사흘 뒤 그는 툴라 근처 마을에서 체포되었다. 1994년 2월 사면으로 풀려난 그는 광장으로 돌아갔다.',
       '스몰렌스카야는 하룻밤 사이에 정리되었다. 안필로프는 툴라 근처 마을에서 붙잡혔고, 1994년 2월 사면으로 풀려났다.'],
  mo: ['그라초프는 크렘린이 기대한 명령을 끝내 내리지 않았다. 그는 장관직을 유지하지 못했다. 인민대표대회는 즉시 ‘아니오’라고 말할 사람을 원했지, 2주 동안 침묵한 사람을 원하지 않았다.',
       '그라초프는 명령을 이행할 준비가 되어 있었지만 명령은 전차에 닿지 않았다. 그는 휴전 당일 사임했고, 평생 군이 양쪽 모두에게 배신당했다고 믿었다.',
       '그라초프는 시간을 끌며 서면 명령을 요구했다. 그는 이른 아침에 그것을 받았다. 옐친은 그를 용서하지 않았고, 장관은 몇 달 뒤 교체되었다.',
       '그라초프는 서면 명령을 요구했고 받았다. 전차가 다리 위로 올라섰다. 그는 1996년까지 국방장관으로 남았다.'],
  gs: ['총참모부는 크렘린에 사단 하나도 넘기지 않았다. 콜레스니코프는 새 정부 아래서도 총참모장으로 남았다. 군대를 병영에 묶어둔 사람을 바꾸지 않았다.',
       '콜레스니코프는 결말을 기다렸고 그것을 보았다. 그는 인민대표대회 아래서 반년을 더 근무한 뒤 스스로 떠났다.',
       '총참모부는 할 수 있는 만큼 명령을 사보타주했다. 암호 전문이 사라지고 종대는 편성되지 않았다. 강습을 늦추기엔 충분했지만 취소하기에는 부족했다. 콜레스니코프는 1년 뒤 조용히 물러났다.',
       '총참모부는 열의 없이, 그러나 지체 없이 명령을 이행했다. 콜레스니코프는 1996년까지 자리를 지켰다.'],
  mvd:['내무군 장교들은 철조망 쪽으로 나가기를 거부했고, 예린은 부처 없는 장관으로 남았다. 그는 휴전 당일 사임했다.',
       '예린은 마지막 시간까지 봉쇄선을 지켰다. 인민대표대회 승리 후 그는 해임되었고, 그날들의 명령에 관해 심문을 받았다. 재판까지는 가지 않았다.',
       '내무부에는 초소를 빼고 외면한 장교들이 있었다. 그들은 그해 가을 해고되었다. 예린은 러시아 영웅 훈장을 받았다.',
       'OMON과 내무군은 시키는 대로 했다. 예린은 러시아 영웅 훈장을 받았고, 부존노프스크 사건 이후인 1995년에야 사임했다.'],
  ost:['오스탄키노는 인민대표대회에 전파를 넘겼고, 나라는 처음으로 포위를 안에서 보았다. 브라긴은 해임되었고, 방송센터는 의회 감독위원회의 통제 아래 들어갔다.',
       '오스탄키노는 끝까지 크렘린이 원하는 것을 내보냈다. 승리 다음 날 브라긴은 해임되었고, 방송은 인민대표대회의 통제 아래 넘어갔다.',
       '오스탄키노에는 의원들을 방송에 내보낸 편집자들이 있었다. 그들이 제일 먼저 해고되었다. 크렘린은 12월 브라긴을 해임했다. 방송으로 너무 많은 것이 나갔기 때문이다.',
       '이 날들 내내 오스탄키노는 크렘린의 목소리로 남았다. 그래도 브라긴은 당국에 불리하게 끝난 선거 뒤인 12월에 해임되었다.'],
};
// ничья и «нулевой вариант»: [были верны, колебались]
const EPI_FAC_N={
  ros:['‘러시아’의 법률가들은 마지막 날까지 결의안을 썼고, 그중 어느 것도 나중에 법원에 의해 뒤집히지 않았다. 바부린은 양보도 승리도 하지 않은 사람으로 정치에 남았다. 옴스크에서 그는 거듭 당선되었다.',
       '‘러시아’ 계파는 마지막 며칠 각자 탈출구를 찾았다. 위기가 승자 없이 끝나자 바부린은 계파를 다시 꾸렸지만 예전의 무게는 없었다.'],
  kr: ['공산주의자들은 끝까지 남았고, 아무도 감히 금지하지 못한 당을 가지고 위기에서 벗어났다. 다음 선거에서 그들은 크렘린도 인민대표대회도 용서하지 않은 이들의 표를 모았다.',
       '공산주의자들은 누가 이길지 저울질했지만 결국 아무도 이기지 못했다. 립킨은 정부와 협상 테이블에 가장 먼저 앉았고 선거를 위해 당을 지켰다.'],
  agr:['농업파는 포위된 건물에 마지막 날까지 식량을 댔다. 토지법은 그대로 남았다. 어느 쪽도 그것을 다시 쓸 힘이 없었다. 라프신은 이를 자신의 가장 큰 승리라고 불렀다.',
       '농업파는 양측과 흥정했지만 어느 쪽에도 빚지지 않았다. 한 달 뒤 라프신은 농업당을 다시 모아 선거로 이끌었다.'],
  otc:['‘조국’ 계파의 장군들은 마지막 밤까지 지역에 전화를 걸었다. 그들은 군으로 복귀하지 못했지만, 망신을 주며 해임하지도 못했다. 그 전화를 기억하는 지휘관이 너무 많았기 때문이다.',
       '‘조국’은 사령부가 요구한 것보다 신중하게 지역에 전화를 걸었다. 계파 장군들은 조용히 예비역으로 물러났다. 타라소프는 1년 뒤 계급장 없이 정치에 복귀했다.'],
  sm: ['‘교체’는 서로 대화하기를 원치 않는 모든 이들을 대신해 협상했다. 위기가 승자 없이 끝나자, 그것이야말로 그들이 노린 것임이 드러났다. 골로빈은 모든 조정위원회에 초대되었다.',
       '‘교체’는 양쪽으로 문을 열어두었고, 열린 문으로 들어갔다. 의원들은 새 정당들로 흩어졌고, 골로빈은 한동안 자신이 양쪽 모두에 반대했다고 설명했다.'],
  kol:['‘동요파’는 끝까지 남았고 스스로도 놀랐다. 압둘라티포프는 지방과의 조정위원회를 이끌었다. 아무도 이기지 못하자 영웅보다 중재자가 더 필요해졌다.',
       '‘동요파’는 결말을 기다렸지만 분명한 답을 얻지 못했다. 크렘린이 약속한 직책은 모두가 받은 것이 아니었다. 그래도 압둘라티포프는 새 의회의 상원에 자리를 얻었다.'],
};
// ничья: [были за Совет, были за Кремль или колебались]
const EPI_PT_N={
  mer:['루시코프는 뉴스를 보고 건물의 불을 켰다 껐다 했다. 그는 시장으로 남았다. 나라에 승자가 없을 때 도시의 주인은 양측 모두에게 필요했기 때문이다.',
       '이 날들 내내 루시코프는 백악관의 전기와 수도를 끊어두었다. 위기가 승자 없이 끝나자 모스크바 시의회는 그의 사임을 요구했지만 표를 모으지 못했다. 그는 그 후 여러 해 동안 시장직을 유지했다.'],
  smo:['안필로프는 끝까지 스몰렌스카야를 지켰고, 거리가 의원들보다 더 많은 일을 했다고 믿었다. ‘노동 러시아’는 정부 재판을 요구했다. 재판은 열리지 않았고, 집회는 계속되었다.',
       '안필로프는 결말 전에 거리에서 밀려났다. 그는 메가폰을 들고 여전히 자유의 몸이었다. 그런 가을을 보낸 뒤 그를 체포할 이유는 없었다.'],
  mo: ['그라초프는 끝내 크렘린에 군대 전체를 넘기지 않았다. 옐친은 그를 용서하지 않았고, 인민대표대회도 그를 믿지 않았다. 몇 달 뒤 장관은 교체되었고, 양측 모두 그것을 자신의 공으로 여겼다.',
       '그라초프는 수행할 명령이 남아 있는 동안 크렘린의 명령을 따랐다. 승자 없는 결말은 그를 더는 모스크바로 불려 가고 싶어 하지 않는 군대의 국방장관으로 남겼다.'],
  gs: ['총참모부는 할 수 있는 만큼 명령을 사보타주했다. 암호 전문이 사라지고 종대는 편성되지 않았다. 콜레스니코프는 그 일로 상을 받지도 벌을 받지도 않았다. 그는 반년을 더 근무한 뒤 스스로 떠났다.',
       '총참모부는 열의 없이, 그러나 지체 없이 명령을 이행했다. 콜레스니코프는 자리를 지켰고, 남은 임기 내내 그 가을에 대해 말하기를 피했다.'],
  mvd:['내무부에는 초소를 빼고 외면한 장교들이 있었다. 예린은 그들을 해고할 수 없었다. 결과가 너무 불확실했다. 그 자신은 1년 뒤 사임했다.',
       '예린은 마지막 시간까지 봉쇄선을 지켰다. 그 대가로 영웅 훈장은 받지 못했다. 아무도 이기지 못한 가을에 상을 주기를 크렘린이 주저했기 때문이다.'],
  ost:['오스탄키노는 의원들에게 발언권을 넘겼고, 나라는 포위를 안에서 보았다. 브라긴은 해임되었다. 방송센터에는 감독위원회가 생겼고, 그 안에서 크렘린과 의회는 1년 더 서로를 가로막았다.',
       '오스탄키노는 끝까지 크렘린이 원하는 것을 내보냈다. 그래도 브라긴은 해임되었다. 나라가 텔레비전 말고 다른 것을 믿게 된 데 대해 누군가는 책임을 져야 했다.'],
};
// поражение без штурма («Разошлись», «Съезд распался», «Пустые баррикады», сдача до боя): замены для текстов, где упомянуты штурм и танки
const EPI_NOA={
  ros3:'바부린은 점점 비어가는 건물을 마지막으로 나온 사람 중 하나였다. 12월 옴스크 유권자들은 그를 다시 의원으로 뽑았고, 그는 두마 연단에서 9월에 했던 말을 되풀이했다.',
  ros4:'마지막 며칠 동안 계파는 각자 탈출구를 찾았다. 12월 옴스크는 바부린을 의회로 돌려보냈지만, 이미 다른 의회였다.',
  agr3:'라프신은 부하들을 가장 마지막에 이끌고 나왔고, 한 달 뒤 농업당을 모았다. 12월 그 당은 두마에 들어가 농촌 예산을 두고 흥정했다.',
  mo2:'그라초프는 시간을 끌며 서면 명령을 요구했다. 그러나 명령은 필요 없게 되었다. 백악관이 저절로 비었기 때문이다. 옐친은 장관이 기다리기만 했다는 것을 기억했고, 몇 달 뒤 그를 교체했다.',
  mo3:'그라초프는 명령을 이행할 준비가 되어 있었다. 전차를 움직일 필요는 없었다. 건물은 한 발의 총성도 없이 비었다. 그는 1996년까지 국방장관으로 남았다.',
  gs2:'총참모부는 할 수 있는 만큼 명령을 사보타주했다. 그것으로 충분했을지는 알 길이 없다. 강습은 끝내 오지 않았다.',
  gs3:'총참모부는 열의 없이, 그러나 지체 없이 명령을 이행할 준비가 되어 있었다. 명령은 필요하지 않았다. 콜레스니코프는 1996년까지 자리를 지켰다.',
};
function epilogue(){
  const id=S.endId||'', K=id==='elect_deal'?'deal':endTier(id)==='neu'?'draw':/army/.test(id)?'army':id==='win_elect'?'elect':id==='held'?'held':/fell|broken/.test(id)?'fell':/surrender/.test(id)?'surr':'fade', win=K==='army'||K==='elect'||K==='held', neu=K==='deal'||K==='draw', noA=!win&&!neu&&!(S.A&&S.A.units);
  const L=[], add=(pic,h,q,p)=>L.push({pic,h,q,p});
  add(win?'wh':K==='fell'?'whf':'wh','에필로그','각자의 결말','다음은 일어나지 않은 일, 또는 다르게 일어난 일이다. 운명은 여러분의 가을이 어떻게 끝났는지, 누가 끝까지 함께했는지, 그리고 군대, 경찰, 시청, 방송이 누구의 편에 섰는지에 달려 있다.');
  add('hasb','하스불라토프','최고회의 의장',{army:'하스불라토프는 두 주 동안 촛불 아래 앉아 있던 같은 홀에서 정부의 사직을 받아들였다. 조기 선거 때까지 그는 나라의 2인자였고, 많은 이들은 그가 1인자라고 여겼다.',
    deal:'하스불라토프는 ‘제로 옵션’에 서명했고 선거 때까지 의장직을 유지했다. 그는 이것을 법의 승리라고 불렀다. 새 법에 따라 선출된 새 의회에는 그런 권한을 가진 의장이 더 이상 없었다.',
    elect:'하스불라토프는 강습을 격퇴했고 동시 선거에 동의했다. 그는 선거에 나오지 않았다. 자신의 임무는 의회를 지키는 것이었지 다시 이끄는 것이 아니었다고 말했다.',
    held:'하스불라토프는 그을린 벽 옆에서 사람들 앞으로 나와 휴전을 선언했다. 승리는 사망자 명단과 함께 그에게 왔고, 매번 선거 때마다 사람들은 그 명단을 그에게 상기시켰다.',
    draw:S.endId==='held_iso'?'하스불라토프는 봉쇄선 안에서만 인정받는 의회의 의장으로 남았다. 그는 급진파에게 입을 다물라고 요구했지만, 마이크는 이미 그의 손에 없었다.':'하스불라토프는 자유인으로 건물을 걸어 나왔다. 카메라가 보여준 모든 것 이후에 크렘린은 의회 의장을 체포할 엄두를 내지 못했다. 그는 인민대표대회가 나라의 어느 홀에서든 계속될 것이라고 선언했고, 지방들은 차례로 그에게 그 홀을 내주겠다고 제안했다.',
    fell:'하스불라토프는 호송을 받으며 건물에서 끌려 나와 레포르토보로 이송되었다. 1994년 2월 26일 그는 국가두마의 사면으로 풀려났고, 플레하노프 연구소에서 강의를 하러 돌아갔다.',
    surr:'하스불라토프는 항복 조건에 서명했고 의원들과 함께 버스 쪽으로 걸어 나왔다. 레포르토보, 1994년 2월의 사면, 플레하노프 연구소의 한 학과.',
    fade:'하스불라토프는 텅 비어가는 건물에 거의 혼자 남았다. 그는 체포조차 되지 않았다. 크렘린은 체포할 사람이 없다는 것을 보여주는 편이 더 중요하다고 여겼다. 그는 강단으로 돌아갔다.'}[K]);
  add('rutskoy','루츠코이','부통령',K==='deal'?'1400호 대통령령이 폐지된 날 루츠코이는 대행 대통령 권한을 내려놓았다. 그는 이 타협을 양측의 동시 항복이라고 불렀다. 그는 직접 선거에 나갔다가 패했고, 3년 뒤 쿠르스크주 지사가 되었다.':K==='draw'&&S.endId==='held_iso'?'루츠코이는 백악관 마당에서 수비대의 사열을 받았다. 그의 명령은 반경 300미터 안에서만 집행되었다. 그 너머에는 그가 크렘린 폭격을 외친 것을 기억하는 나라가 있었다.':K==='draw'?'루츠코이는 마지막으로 나와 기자들에게 기름칠이 채 마르지 않은 자동소총을 보여주었다. 나라의 절반은 그를 대행 대통령으로, 나머지 절반은 반란자로 여겼고, 양쪽 다 나름대로 옳았다. 그는 끝내 재판받지 않았다.':win?(S.rad>=60?'루츠코이는 대행 대통령 선서를 했고, 발코니에서 한 약속의 절반을 지켰다. 나머지 절반은 감옥에 관한 것이었는데, 인민대표대회가 승인하지 않았다.':'루츠코이는 조기 선거 때까지 대행 대통령직을 수행했고, 모두의 의외로 실제로 선거를 치렀다.'):
    (K==='fade'?'루츠코이는 인민대표대회 말고는 누구도 인정하지 않은 권한을 내려놓았다. 3년 뒤 그는 쿠르스크주 지사로 선출되었다.':'루츠코이는 마지막으로 항복했고, 기자들에게 기름칠이 채 마르지 않은 자동소총을 보여주었다. 그는 쏘지 않았다. 레포르토보, 1994년 2월 사면. 1996년 그는 쿠르스크주 지사로 선출되었다.'));
  add('yeltsin','옐친','러시아 대통령',{army:'군대는 명령을 집행하지 않았고, 그것으로 끝이었다. 옐친은 조기 선거에 동의했지만 참여하지 않았고, 책을 쓰러 바르비하의 별장으로 떠났다.',
    deal:'옐친은 1400호 대통령령을 철회하고 이를 “합의를 향한 한 걸음”이라고 불렀다. 선거 전에 그는 의회법과 방송 지도부를 바꿔놓았다. 그는 선거에서 이겼다. 얼마나 공정했는지는 지금도 논쟁 중이다.',
    elect:'옐친은 1400호 대통령령을 철회하고 이를 “합의를 향한 한 걸음”이라고 불렀다. 그는 동시 선거에 자신의 후보 등록을 했다. 그 선거가 어떻게 끝났는지는 이 게임이 알지 못한다.',
    held:'강습은 전 세계가 보는 앞에서 무산되었다. 옐친은 휴전을 선언했고 일주일 뒤 선거에 동의했다. 발포 명령을 내린 사람들을 그는 이름으로 지목했지만, 그 안에 자신은 넣지 않았다.',
    draw:'옐친은 크렘린에 남았지만 그곳에서 내려오는 명령은 더 이상 집행되지 않았다. 군관구는 서면 확인을 기다렸고, 지방은 세금을 자기들이 챙겼으며, 법원은 1400호 대통령령을 쿠데타라고 판결했다. 몇 달 뒤 그는 조기 선거에 동의했지만 참여하지 않았다.',
    fell:'옐친은 12월까지 대통령령으로 통치했다. 1993년 12월 12일 국민투표는 강한 대통령과 약한 의회를 담은 새 헌법을 채택했다. 그 헌법은 지금도 효력이 있다.',
    surr:'옐친은 큰 전투 없이 건물을 얻었고 그 공을 자기 것으로 돌렸다. 12월 그의 헌법이 채택되었다. 항복한 이들에게 주어진 보장은 2월, 두마가 사면을 선포했을 때에야 떠올려졌다.',
    fade:'크렘린은 강습이 필요하지 않았다. 옐친은 새 의회 선거에 관한 대통령령에 서명했고, 12월에는 자신의 헌법을 국민투표에 부쳤다.'}[K]);
  for(const F of FACTIONS){ if(F.kind!=='dep')continue; const f=S.fac[F.id], T=EPI_FAC[F.id]; if(!T)continue; const gone=f.n<=0, loyal=f.loy>=6;
    add(FAC_WHO[F.id],F.nm.replace(/"/g,'«').replace(/«([^«]*)«/,'«$1»').toUpperCase(),gone?'결말 전에 떠났다':LOY[loyLvl(f.loy)].nm[0].toUpperCase()+LOY[loyLvl(f.loy)].nm.slice(1)+' · 남음 '+f.n,gone?T[0]:neu?EPI_FAC_N[F.id][loyal?0:1]:win?T[loyal?1:2]:(noA&&EPI_NOA[F.id+(loyal?3:4)])||T[loyal?3:4]); }
  { const f=S.fac.rne, was=f.n>0||S.flags.rneWas;
    add('barkash','RNE',f.n>0?'끝까지 건물에 남았다':was?'쫓겨났거나 스스로 떠났다':'건물에 들어가지 못했다',
      neu?(f.n>0?'바르카쇼프 부대는 결말까지 건물에 남았다가 무기를 가지고 떠났다. 크렘린은 기회만 되면 그들이 대열을 짓는 장면을 내보냈다. “이런 자들과 협상하라고 우리에게 요구하는 것이다.” 인민대표대회는 그 장면들을 끝내 씻어내지 못했다.'
            :was?'결말 무렵 RNE는 이미 건물에 없었다. 바르카쇼프는 자신이 배신당했다고 말했다. 파시즘 혐의는 수비대에 여전히 씌워졌지만 잘 먹히지 않았다. 보여줄 사람이 남아 있지 않았기 때문이다.'
            :'바르카쇼프는 문 앞에서 거절당했다. 백악관 근처 사진에는 검은 제복이 없었고, 이것은 크렘린이 의회를 반란으로 선포하지 못한 이유 중 하나가 되었다.')
      :noA?(f.n>0?'바르카쇼프 부대는 마지막으로 건물을 떠났다. 대열을 지어 무기를 든 채였다. 크렘린은 그 겨울 내내 대열 장면을 내보냈다. “그 안에 이런 자들이 앉아 있었다.” 바르카쇼프는 겨울에 체포되었고, 2월 사면으로 풀려났다.'
            :was?'끝 무렵 RNE는 이미 건물에 없었다. 파시즘 혐의는 여전히 수비대에 달라붙었지만 더 약하게 먹혔다. 보여줄 사람이 남아 있지 않았기 때문이다.'
            :'바르카쇼프는 문 앞에서 거절당했다. 의회 벽에 걸린 하켄크로이츠를 텔레비전에서 보여준 사람은 없었지만, 그것이 백악관을 구하지는 못했다.')
      :f.n>0?(win?'바르카쇼프 부대는 20번 출입구를 지켰고 승리의 몫을 요구했다. 공간, 무기, 인민대표대회 경호에서의 자리였다. 자유주의 신문들은 10년 동안 되풀이해 실은 사진을 받았다. 의회 계단 위의 검은 제복. RNE를 무장 해제한 것은 새 정권이었다.'
                 :'바르카쇼프 부대는 누구보다 오래 출입구에서 싸웠고, 그다음 무기를 들고 하수도를 통해 빠져나갔다. 그들의 대열 장면은 강습의 주된 명분이 되었다. “거기 파시스트들이 있었다.” 바르카쇼프는 겨울에 체포되었고, 2월 사면으로 풀려났다.')
      :was?(win?'승리한 백악관에는 RNE가 없었고, 인민대표대회의 승리를 갈색이라 부를 사람도 없었다. 바르카쇼프는 자신이 배신당했다고 말했다. 1년 뒤 그의 조직은 범죄 면에서만 언급되었다.'
              :'인민대표대회는 RNE를 밀어냈고 가장 나은 부대를 잃었다. 바르카쇼프는 부하들을 이끌고 떠났고 전투에는 참여하지 않았다. 파시즘 혐의는 수비대에 여전히 씌워졌지만 더 약하게 먹혔다. 보여줄 사람이 없었기 때문이다.')
      :(win?'바르카쇼프는 문 앞에서 거절당했다. 그것은 그 가을 가장 싼값에 치른 결정 중 하나였다. 사진에 검은 제복이 없었으므로 서방은 그날 바로 의회의 승리를 인정했다.'
           :'바르카쇼프는 문 앞에서 거절당했다. 강습 당일 훈련받은 전투원 120명으로는 부족했지만, 의회 벽의 하켄크로이츠를 텔레비전에서 보여준 사람은 없었다.')); }
  { const f=S.fac.so; add('terekh','‘장교 연맹’',f.n>0?'끝까지 건물에 있었다':'건물에 없었다',neu?(f.n>0?'테레호프의 장교들은 마지막 날까지 건물 방어를 책임졌다. 크렘린은 테레호프를 체포할 엄두를 내지 못했고, 그를 군으로 돌려보내기를 거부했다. ‘장교 연맹’은 원래의 모습 그대로였다. 계급장을 단 사람들의 정치 모임.':'‘장교 연맹’은 방어에 참여하지 않았다. 테레호프는 한때 국방장관의 재판을, 다른 때에는 그의 사임을 요구했지만 어느 것도 얻지 못했다.'):f.n>0?(win?'테레호프의 장교들은 계급을 회복하고 군으로 돌아갔다. 테레호프 본인은 총참모부에 들어가지 못했다. 승리한 인민대표대회가 필요로 한 것은 군대였지 그 정치 모임이 아니었다.':'테레호프는 체포되었고 심문 중 구타당했다. 1994년 2월 사면으로 풀려난 그는 ‘장교 연맹’을 다시 꾸렸고, 이번에는 무기 없이였다.')
      :(win?'‘장교 연맹’은 방어에 참여하지 않았다. 승리 후 테레호프는 국방부 숙청을 요구했지만, 예의 바르게 무시당했다.':'테레호프는 혼자 행동했고 결말 전에 체포되었다. 1994년 2월 사면으로 자유는 돌아왔지만 계급은 돌아오지 않았다.')); }
  for(const pid of ['mo','gs','mvd','mer','smo','ost']){ const P=POINTS.find(x=>x.id===pid), v=S.pts[pid], our=v>=(win||neu?50:60), W=PEOPLE[POINT_WHO[pid]];
    add(POINT_WHO[pid],W.nm.split(' ').pop().toUpperCase(),P.nm.replace(/ ↑.*/,'')+' · 끝까지 '+(v>=65?'최고회의 편':v<=35?'크렘린 편':'흔들렸다')+' ('+v+'%)',neu?EPI_PT_N[pid][our?0:1]:win?EPI_PT[pid][our?0:1]:(noA&&EPI_NOA[pid+(our?2:3)])||EPI_PT[pid][our?2:3]); }
  // части Кремля: кто дошёл до конца, кто встал, кто не пошёл вовсе
  { const A=S.A, kWon=endTier(id)==='lose';
    if(!A||!A.units||false){ add('grachev','크렘린 부대','강습은 없었다',id==='elect_deal'?'모스크바 쪽으로 불려 온 부대들은 일주일 동안 순환도로에 서 있다가 주둔지로 돌아갔다. 병사들에게는 훈련이었다고 전했다.':'총격까지 가지는 않았다. 종대는 강변에 잠시 서 있다가 떠났다. 잡을 사람이 더 이상 없었다.'); }
    else{ const T={
      tanks:{who:'grachev',nm:'다리 위의 전차',sub:'칸테미르 사단',
        refuse:'칸테미르 사단 승무원들은 다리 위로 나가지 않았다. 연대장은 장관에게 서면 명령을 요구했고 저녁까지 기다렸다. 발포를 거부한 장교들은 나중에 조용히 해임되었지만, 재판에 넘길 용기는 없었다.',
        out:'전차들은 다리 위로 올라갔지만 강습이 끝나기 전에 사격을 멈췄다. 승무원들은 시동을 끄고 카메라 앞에서 장갑차 위에 앉았다. 백악관 곁의 침묵하는 전차 사진은 세계 모든 신문에 실렸다.',
        won:'전차들은 끝까지 상층부를 향해 사격했다. 소문에 따르면 승무원들은 현금을 받고 아파트도 받았다. 차량에 앉아 있던 장교들의 이름은 몇 년 동안 국방부가 공개하지 않았다.',
        lost:'전차들은 어두워질 때까지 건물에 사격했지만 건물은 버텼다. 새 정권은 의회에 발포한 장교들을 재판에 넘기지 않았다. 그들은 그저 악수를 청하지 않았다. 많은 이들이 그해 사임했다.'},
      taman:{who:POINT_WHO.gs,nm:'차량화보병',sub:'타만 사단',
        refuse:'타만 사단은 건물로 가지 않았다. 총참모부는 크렘린에 연료가 부족하다고 보고했다. 모두가 연료는 있었다는 것을 알고 있었다.',
        out:'차량화보병은 강습을 시작했지만 끝내지 못했다. 중대들은 기단 옆에 엎드렸고, 어떤 명령도 그들을 다시 일으키지 못했다. 저녁이 되자 사단은 손실을 이유로 후퇴했다.',
        won:'타만 부대원들은 정문을 통해 건물에 들어갔다. 층을 점령했던 징집병들은 한 달 뒤 병영으로 돌아갔고, 자신들이 어디에 있었는지 말하지 말라는 지시를 받았다.',
        lost:'차량화보병은 하루 종일 정문을 향해 나아갔지만 끝내 점령하지 못했다. 사단은 밤에 대열도 음악도 없이 모스크바에서 빠져나갔다. 지휘관이 가장 먼저 해임되었다.'},
      vv:{who:POINT_WHO.mvd,nm:'내무군',sub:'제르진스키 사단',
        refuse:'제르진스키 사단은 강습에 나서지 않았다. 새벽 전에 일부 장교들이 자기 편에게 발포하지 않겠다고 선언했다. 장관에게는 이것을 “기술적 준비 미비”라고 보고했다.',
        out:'내무군은 20번 출입구에서 싸웠고 끝나기 전에 그곳을 떠났다. 지휘관들은 위에서 명령이 내려오기를 기다리지 않고 직접 부하들을 이끌고 나갔다.',
        won:'제르진스키 사단은 20번 출입구를 점령했다. 그 가을 이 사단의 전투원들은 누구보다 많은 훈장을 받았다. 나중에 그들은 모스크바에서 그것을 달고 다니기를 어색해했다.',
        lost:'제르진스키 사단은 하루 종일 20번 출입구를 두드렸다. 휴전 후 사단은 도시에서 철수했고, 국방부는 그 손실을 기밀로 분류했다.'},
      omon:{who:POINT_WHO.mvd,nm:'OMON',sub:'모스크바 내무총국',
        refuse:'OMON은 건물로 들어가지 않았다. 대원들은 헬멧을 벗고 백악관에 등을 돌린 채 강변을 따라 섰다. 두 주 동안 그들을 찾아왔던 여성들과 참전용사들이 그 장면을 기억한다.',
        out:'OMON은 모두와 함께 시작했고 한낮에 멈췄다. 경찰들은 집회 해산은 할 줄 알지만 의회를 점령하려고 입대한 것은 아니라고 말했다.',
        won:'OMON은 군대를 따라가며 주변의 층과 마당을 소탕했다. 크라스나야 프레스냐 경기장에 구금된 사람들에게 무슨 일이 있었는지는 그 뒤로 몇 년 동안 글로 다뤄졌다.',
        lost:'OMON은 문까지 갔다가 물러났다. 일주일 뒤 같은 대원들이 같은 의회를 경비하도록 배치되었다. 이제는 의회의 이름으로.'},
      alpha:{who:'yeltsin',nm:'‘알파’와 ‘벰펠’',sub:'특수부대'} };
      for(const u of A.units){ const t=T[u.id]; if(!t)continue; const lost=Math.round(u.lost||0), m=uMorV(u);
        if(u.id==='alpha'){ const al=A.alpha, neg=/alpha/.test(id);
          add(t.who,t.nm,t.sub+' · '+(neg?'자신들의 보장 아래 사람들을 빼냈다':al==='refuse'?'강습을 거부했다':al==='attack'?'강습에 나섰다, 손실 '+fmt(lost):'예비로 남았다'),
            neg?(id==='draw_alpha'?'‘알파’ 장교들은 한 발도 쏘지 않고 건물에 들어가 자신들의 말을 믿고 사람들을 빼냈다. 카메라 앞에서 그들은 의회를 강습하지 않겠다고 말했다. 크렘린은 이를 용서하지 않았다. ‘벰펠’은 해산되었고, ‘알파’는 다른 기관으로 넘겨졌다.':'‘알파’는 자신들의 보장 아래 사람들을 건물 밖으로 이끌었다. 그 보장은 버스 앞에서 끝났다. 장교들은 나중에 할 수 있는 일을 다 했다고, 그들이 없었다면 사망자가 열 배는 더 많았을 것이라고 말했다.')
            :al==='refuse'?'‘알파’는 무전으로 호소를 들었고 제자리에 머물렀다. 장교들은 크렘린에 무장하지 않은 의원들을 상대로는 작전하지 않겠다고 답했다. 특수부대의 거부는 아직 망설이던 모든 이에게 강습의 끝이 되었다.'
            :al==='attack'?(kWon?'‘알파’와 ‘벰펠’은 마지막에 20번 출입구로 들어가 다른 이들이 해내지 못한 일을 했다. 그들의 장교들은 그날을 떠올리기를 좋아하지 않는다.':'‘알파’는 강습에 나섰지만 출입구를 점령하지 못했다. 한 번도 실패를 겪어 본 적 없던 부대에게 이것은 전환점이었다. 장교 절반이 보고서를 제출했다.')
            :'‘알파’와 ‘벰펠’은 끝까지 예비로 남았고 전투에 투입되지 않았다. 그들의 장교들은 나중에 그것이 그 가을 전체에서 가장 좋은 명령이었다고 말했다.'); continue; }
        const st=u.st==='refuse'&&lost===0?'refuse':(u.cur<=3||m<MOR_HALT)?'out':kWon?'won':'lost';
        const ls=u.id==='tanks'?'':', 손실 '+fmt(lost), sub=t.sub+' · '+(st==='refuse'?'거부했고, 전투에 참여하지 않았다':st==='out'?(u.halt||u.cur>3?(u.id==='tanks'?'사격을 중지했다':'멈춰 섰고 더 나아가지 않았다'):'전투에서 빠졌다')+ls:(u.id==='tanks'?'끝까지 사격했다':'끝까지 싸웠다')+ls);
        add(t.who,t.nm,sub,t[st]); } } }
  { const mine=OUTLETS.filter(o=>outSt(S,o)==='vs').length, kr=OUTLETS.filter(o=>outSt(S,o)==='kr').length;
    add(null,'언론',`당신들 편 ${mine}, 크렘린 편 ${kr}`,win?(mine>=kr?'인민대표대회 편에 선 편집부들이 이 가을의 역사를 가장 먼저 썼다. 그 뒤 두 주 동안 나머지 매체들은 독자들에게 자신들이 실제로 무엇을 말하려 했는지 설명했다.':'대다수 매체는 마지막 날까지 여러분에게 반대했다. 승리한 인민대표대회는 이들을 폐쇄할지를 두고 논쟁했다. '+(S.rad>=60?'세 곳을 폐쇄했고, 그것이 새 권력의 첫 스캔들이 되었다.':'한 곳도 폐쇄하지 않았고, 사람들은 그것을 기억했다.'))
      :(mine>=4?'《프라우다》, 《소베츠카야 로시야》, 《덴》 그리고 열 곳 남짓의 매체가 다음 날 대통령령으로 폐쇄되었다. 일부는 다른 이름으로 돌아왔다. 크렘린을 지지했던 신문들은 검열의 흰 공백을 달고 나와 분노했다.':'야당 신문들은 대통령령으로 폐쇄되었다. 나머지 신문은 검열의 흰 공백을 달고 나왔고, 그 공백은 며칠 뒤 해제되었다.')); }
  { const A=S.A, lost=A?Math.round(A.lost||0):0;
    add(K==='fell'||K==='held'?'whf':'wh','모스크바','결말 이후의 도시',win?(lost>300?`승리의 대가는 수비대원 ${fmt(lost)}명의 사상자였다. 크라스나야 프레스냐 경기장 벽 옆에 기념비가 세워졌고, 철조망 양쪽에 있던 사람들이 그곳을 찾는다.`:'바리케이드는 일주일 안에 철거되었다. 브루노 철조망은 왔던 창고로 되돌아갔다. 모스크바 사람들은 부엌에서 그것이 누구의 승리였는지를 오래도록 논쟁했다.')
      :(K==='draw'&&S.endId==='held_iso'?'백악관의 바리케이드는 겨울까지 남았다. 도시는 강변을 돌아가는 데 익숙해졌다. 모스크바 사람들은 건물을 지킨 이들에게 감사하지도 저주하지도 않았다. 그들을 그저 두려워했다.':K==='draw'?'백악관은 봄까지 텅 빈 채 그을린 모습으로 서 있었다. 어느 권력도 그곳에 들어갈 엄두를 내지 못했다. 모스크바는 두 정부와 함께, 그러나 어느 정부도 인정하지 않은 채 살았다. 물가는 오르고, 부엌에서는 누가 이겼는지가 아니라 누구 탓인지를 두고 말다툼이 벌어졌다.':K==='fell'?'하얀 외벽의 그을음 자국은 겨울이 오기 전에 덧칠되었다. 사망자 수는 오랫동안 여러 방식으로 집계되었다. 공식적으로는 약 150명이다. 통행금지는 2주 뒤 해제되었다.':K==='surr'?'건물은 큰 전투 없이 넘겨졌고, 그 덕에 100명이 넘는 목숨이 구해졌다. 외벽은 하얗게 남았다. 백악관은 울타리에 둘러싸였고, 그 울타리는 지금까지 서 있다.':'백악관은 한 발의 총성도 없이 비었다. 한 달 뒤 이미 정부가 그 안에 들어앉았고, 주변 울타리는 바리케이드를 쌓을 재료가 남지 않도록 세워졌다.')); }
  add('wh','실제로 있었던 일','1993년 9월 21일 — 10월 4일','1400호 대통령령은 9월 21일 발표되었다. 백악관은 전기와 통신이 끊기고 철조망으로 둘러싸였다. 10월 3일 최고회의 지지자들이 봉쇄선을 뚫고 시청을 점거한 뒤 오스탄키노로 향했다. 10월 4일 아침 노비 아르바트 다리의 전차들이 의회에 포격했고, 저녁에 수비대는 항복했다. 공식 집계로 약 150명이 사망했다. 12월 새 헌법이 채택되었다.');
  return L;
}
function showEpi(i){ const L=epilogue(); i=Math.max(0,Math.min(i||0,L.length-1)); const s=L[i], last=i===L.length-1;
  showEvent({id:'epi',pic:s.pic||'wh',tag:'에필로그',h:s.h,q:s.q,p:s.p,time:'',ch:[
    last?{t:'결과로',go:()=>ending(S.endId)}:{t:'다음',go:()=>showEpi(i+1)},
    ...(i>0?[{t:'뒤로',go:()=>showEpi(i-1)}]:[]),
    ...(!last?[{t:'건너뛰기',go:()=>ending(S.endId)}]:[])]});
  $('ev-meta').textContent='각자의 결말 · '+(i+1)+' / '+L.length; $('ev-hud').innerHTML='';
}
// what became of every faction: [ушли до конца, победа, поражение]
const FATES={
  kr:['결말 전에 떠났다. 립킨은 다른 이들보다 먼저 정부와 합의했다.','민족화합 정부에 합류해 세 개 부처를 받았다.','공산당은 12월 선거 참여를 허가받았다. 립킨은 새 두마의 의장이 되었다.'],
  ros:['지방으로 흩어져 소비에트를 모으려 했다. 제때 모으지 못했다.','바부린은 새 헌법 위원회를 이끌었다.','바부린은 건물을 나서다 폭행당했다. 12월 그는 다시 의원으로 선출되었다.'],
  agr:['결말 전에 고향 지역으로 돌아갔다.','인민대표대회에서 자체 버전의 토지법을 통과시켰다.','농업당은 두마에 들어가 농촌 예산을 두고 흥정했다.'],
  otc:['군복 입은 의원들이 떠나면서 지역 연줄도 함께 가져갔다.','국방부에 자리를 받았다.','연금 없이 예비역으로 전역했다. 1년 뒤 일부는 정치에 복귀했다.'],
  sm:['누구보다 먼저 카메라 앞에 나서 옐친과 하스불라토프 없는 선거를 제안했다.','타협의 얼굴이 되었다. 젊은 의원들이 선거 협상을 이끌었다.','계파가 와해되었다. 의원들은 새 정당들로 흩어졌다.'],
  kol:['한 명씩 떠났다. 대통령령은 각자에게 직책과 1년치 봉급을 약속했다.','남았고, 이후 단 1분도 의심하지 않았다고 말했다.','크렘린이 약속한 직책과 보상을 받았다.'],
  rne:['결말 전에 건물을 떠났다.','승리의 몫을 요구했다. 따로 처리해야 했다.','무기를 들고 하수도로 빠져나갔다. 바르카쇼프는 겨울에 체포되었고 사면으로 풀려났다.'],
  so:['스스로 행동하러 떠났다.','장교들은 계급을 회복하고 군으로 돌아갔다.','테레호프 체포. 1994년 2월 사면으로 석방되었다.'],
};
function openFinal(){
  const id=S.endId||'', win=!!(ENDINGS[id]&&ENDINGS[id].win)||id==='held', neu=endTier(id)==='neu', A=S.A, st=S.st||{};
  const row=(a,b,c)=>`<div class="fr"><span>${a}</span><b class="${c||''}">${b}</b></div>`;
  const facs=FACTIONS.map(F=>{const f=S.fac[F.id],gone=f.n<=0,L=LOY[loyLvl(f.loy)];
    return `<div class="ff"><span class="sw" style="background:${F.c}"></span><div><b>${F.nm.replace(/"/g,'')}</b> <i style="color:${gone?'var(--dim)':L.c}">${gone?'건물에 없음':L.nm+' · '+f.n}</i><div>${FATES[F.id][gone?0:win?1:2]}</div></div></div>`;}).join('');
  const forces=[['mo','국방부'],['gs','총참모부'],['mvd','내무부'],['mer','시청'],['ost','오스탄키노']].map(([k,n])=>{const v=S.pts[k];return row(n,v>=70?'최고회의 편':v>=45?'흔들렸다':'크렘린 편',v>=70?'p':v>=45?'':'n');}).join('');
  const mine=OUTLETS.filter(o=>outSt(S,o)==='vs').map(o=>o.nm).join(', ')||'아무도 없음';
  $('modal-win').innerHTML=`<h2>결과 · ${dateStr(S.day).toUpperCase()} 1993</h2><div class="sub">${win?'승리: 최고회의가 버텨냈다.':neu?'중립적 결과: 건물은 잃었지만 옐친은 정치적으로 무너졌다.':'패배: 옐친이 승리했다.'} ${A?'강습은 '+A.r+' 시간 (최대 12시간).':'강습은 없었다.'}</div>
   <div class="fin"><div><h3>수치</h3>
    ${row('시작 후 일수',S.day)}${row('내린 결정',S.chron.length)}${row('정통성',S.leg)}${row('모스크바는 최고회의 편',S.city+'%')}
    ${row('남은 의원',deputies(S)+' / 265',deputies(S)<QUORUM?'n':'')}${row('떠난 의원',st.depOut||0)}${row('돌아온 의원',st.depIn||0)}
    ${row('벽 앞의 시민',fmt(S.ppl))}${row('전투원',fmt(S.mil))}${A?row('사상자',fmt(Math.round(A.lost||0)),'n'):''}
    ${A?row('강습 측 손실',fmt(A.units.reduce((a,u)=>a+(u.lost||0),0)),'p'):''}${row('크렘린의 당신들에 대한 행동',st.km||0)}${row('집행되지 않은 명령',st.fail||0)}
    <h3>병력</h3>${forces}
    <h3>당신들 편의 언론</h3><div class="fo">${mine}</div>
    ${A&&A.muster?'<h3>마지막 밤에 온 사람들</h3>'+A.muster.map(m=>`<div class="fo ${m.g?'p':'n'}">${m.t}</div>`).join(''):''}
   </div><div><h3>운명</h3>${facs}
    <div class="ff"><span class="sw" style="background:#b3322b"></span><div><b>하스불라토프와 루츠코이</b><div>${win?'조기 선거 때까지 권력을 유지했다. 그다음 무슨 일이 일어났을지는 역사도 모른다.':'레포르토보. 1994년 2월 26일 국가두마의 사면으로 석방되었다.'}</div></div></div>
    <h3>실제로 있었던 일</h3><div class="fo">1400호 대통령령은 9월 21일 발표되었다. 10월 4일 노비 아르바트 다리의 전차들이 백악관에 포격을 가했고, 저녁에 수비대는 항복했다. 공식 집계로 약 150명이 사망했다. 12월 새 헌법이 채택되었다.</div>
   </div></div><div class="sub" style="text-align:center;margin-top:6px">게임 «1993» · ${authorHTML()}</div><div class="close">ESC — 닫기</div>`;
  $('modal').classList.add('on'); $('modal-win').querySelector('.close').onclick=()=>$('modal').classList.remove('on');
}
function save(){store.set(SAVE,S);}

// ================= input =================
addEventListener('keydown',e=>{
  const k=e.key;
  if($('modal').classList.contains('on')){
    if(S&&S.A&&S.A.card&&screen==='assault'){if(S.A.card==='muster'){if(k==='Enter'||k===' ')musterClose();}else if(S.A.card==='fin'){if(k==='Enter'||k===' ')finaleGo();}else if(k>='1'&&k<='3')(S.A.card==='inc'?incChoose:alphaChoose)(+k-1);return;}
    if(k==='Escape'||k==='Enter')closeModal();return;}
  if(screen==='intro'){introNext(k==='Escape');return;}
  if(screen==='paper'){if(k==='Enter'||k===' ')paperGo(-1);else if(k>='1'&&k<='3')paperGo(+k-1);return;}
  if(screen==='title'){
    const n=menuItems().length;
    if(k==='ArrowDown'){menuSel=(menuSel+1)%n;renderMenu();}
    else if(k==='ArrowUp'){menuSel=(menuSel+n-1)%n;renderMenu();}
    else if(k==='Enter'||k===' '){menuGo(menuItems()[menuSel].dataset.m);}
  }else if(screen==='map'||screen==='wh'){
    if(toastOn()&&(k==='Escape'||k===' ')){hideToast();return;}
    if(k==='Tab'){e.preventDefault();setView(screen==='map'?'wh':'map');}
    else if(k==='Enter'){endTurn();}
    else if(k==='p'||k==='з'){openLaws();}
    else if(k==='m'||k==='ь'){openEther();}
    else if(k==='Escape'){show('title');renderMenu();}
    else if(screen==='map'){
      if(k>='1'&&k<='3'){const o=actsOf(S.sel)[+k-1];if(o)doAction(S.sel,o.i);}
      else if(k==='ArrowRight'||k==='ArrowLeft'){const i=POINTS.findIndex(p=>p.id===S.sel);
        S.sel=POINTS[(i+(k==='ArrowLeft'?POINTS.length-1:1))%POINTS.length].id;renderMap();}
    }else{
      if(k>='1'&&k<='2')doFacAct(S.selFac,+k-1);
      else if(k==='ArrowDown'||k==='ArrowUp'){e.preventDefault();const i=FACTIONS.findIndex(f=>f.id===S.selFac);
        S.selFac=FACTIONS[(i+(k==='ArrowUp'?FACTIONS.length-1:1))%FACTIONS.length].id;renderWH();}
    }
  }else if(screen==='assault'){
    if(k>='1'&&k<='8')doAOrder(+k-1); else if(k==='m'||k==='M'||k==='ь'||k==='Ь')openAir(); else if(k==='Enter')nextHour();
  }else if(screen==='event'){
    const n=evCur.ch.length;
    if(k>='1'&&k<=String(n)){choose(+k-1);}
    else if(k==='ArrowDown'){evSel=(evSel+1)%n;renderChoices();}
    else if(k==='ArrowUp'){evSel=(evSel+n-1)%n;renderChoices();}
    else if(k==='Enter'){choose(evSel);}
  }
});

function fit(){const d=document.documentElement,s=Math.min(d.clientWidth/1280,d.clientHeight/720);$('stage').style.transform=`scale(${s})`;}
addEventListener('resize',fit);addEventListener('orientationchange',()=>setTimeout(fit,200));fit();
// ---------- выход в главное меню с карты, из Белого дома и со штурма: партия сохраняется, «Продолжить» вернёт туда же ----------
function toMenu(){ if(S&&!S.endId)save(); $('modal').classList.remove('on'); show('title'); renderMenu(); }
$('b-menu').onclick=()=>toMenu();
[$('snd2').parentNode].forEach(b=>{const d=document.createElement('div');d.className='menub px';d.textContent='메뉴';d.title='메인 메뉴로. 당은 살아남는다';if(b.contains($('snd2')))d.style.cssText='right:132px;top:10px;font-size:8px;padding:6px 8px;z-index:3';d.onclick=e=>{e.stopPropagation();toMenu();};b.appendChild(d);});
// ---------- полный экран: кнопка видна только там, где браузер его даёт (на iPhone его нет — там игра ставится на экран «Домой») ----------
const FS={ el:()=>document.documentElement, can(){const e=this.el();return !!((document.fullscreenEnabled||document.webkitFullscreenEnabled)&&(e.requestFullscreen||e.webkitRequestFullscreen));},
  on:()=>!!(document.fullscreenElement||document.webkitFullscreenElement),
  sync(){const b=$('fsb'); if(!b)return; b.style.display=this.can()?'block':'none'; b.textContent=this.on()?'⤢ 전체 화면 종료':'⤢ 전체 화면'; setTimeout(fit,60); setTimeout(fit,400);},
  toggle(){ try{ if(this.on()){(document.exitFullscreen||document.webkitExitFullscreen).call(document);return;}
      const e=this.el(), r=(e.requestFullscreen||e.webkitRequestFullscreen).call(e); const lock=()=>{try{const o=window.screen.orientation; if(o&&o.lock)o.lock('landscape').catch(()=>{});}catch(x){}}; if(r&&r.then)r.then(lock).catch(()=>{}); else lock(); }catch(x){} } };
document.addEventListener('fullscreenchange',()=>FS.sync());document.addEventListener('webkitfullscreenchange',()=>FS.sync());
{const b=$('fsb'); if(b)b.onclick=e=>{e.stopPropagation();FS.toggle();}; FS.sync();}
// ---------- шрифт: пиксельный по умолчанию, обычные подменяют те же два семейства (ширина подогнана, вёрстка не едет) ----------
const Font={ list:[['pix','픽셀'],['sans','일반'],['serif','세리프']],
  // fontv:2 — с версии 0.55 пиксельный шрифт по умолчанию; старый выбор («ОБЫЧНЫЙ» и т. д.) сбрасывается один раз
  cur(){const o=store.get(OPTS)||{}; if(o.fontv!==2) return 'pix'; return this.list.some(x=>x[0]===o.font)?o.font:'pix';},
  apply(){const k=this.cur(); let st=$('font-css'); if(!st){st=document.createElement('style');st.id='font-css';document.head.appendChild(st);} st.textContent=(typeof FONT_FACES!=='undefined'&&FONT_FACES[k])||''; document.documentElement.dataset.font=k;
    const b=$('fntb'); if(b)b.textContent='글꼴: '+this.list.find(x=>x[0]===k)[1]; const n=$('fntn'); if(n)n.style.display=k==='pix'?'none':'block'; },
  next(){const o=store.get(OPTS)||{}, i=this.list.findIndex(x=>x[0]===this.cur()); o.fontv=2; o.font=this.list[(i+1)%this.list.length][0]; store.set(OPTS,o); this.apply();} };
{const b=$('fntb'); if(b)b.onclick=e=>{e.stopPropagation();Font.next();}; Font.apply();}
// ---------- язык: переведённые копии скриптов (js/*.en.js и т. д.), выбор в настройках, смена = перезагрузка страницы ----------
const Lang={ list:[['ja','日本語'],['','러시아어'],['en','English'],['zh','中文'],['ko','한국어']], cur:()=>GL,
  note:{en:'Translations into English, Chinese and Korean have not been checked by anyone. We cannot guarantee their quality. The original game is in Russian, and the translation may be inaccurate.',zh:'英文、中文和韩文翻译未经任何人校对，无法保证翻译质量。游戏原文为俄语，译文可能不准确。',ko:'영어, 중국어, 한국어 번역은 아무도 검수하지 않았습니다. 번역 품질을 보장할 수 없습니다. 게임 원문은 러시아어이며, 번역이 부정확할 수 있습니다.'},
  sync(){const b=$('lngb'),p=$('lngp'); if(!b)return; if((typeof SINGLE!=='undefined'&&SINGLE)||!LANGS_ON){b.style.display='none';return;} b.textContent='⚑ '+this.list.find(x=>x[0]===GL)[1].toUpperCase()+' ▾';
    const N=this.note; p.innerHTML='<span class="lx" style="position:absolute;right:6px;top:2px;cursor:pointer;padding:0 4px">✕</span>'+this.list.map(x=>`<div class="l${x[0]===GL?' on':''}" data-l="${x[0]}">${x[1]}</div>`).join('')+`<div class="n">영어, 중국어, 한국어 번역은 아무도 검토하지 않았으며, 품질을 보장할 수 없습니다. 게임 원문은 러시아어이며, 번역이 부정확할 수 있습니다.</div>`;
    p.querySelector('.lx').onclick=e=>{e.stopPropagation();p.style.display='none';}; p.querySelectorAll('.l').forEach(d=>d.onclick=e=>{e.stopPropagation();this.set(d.dataset.l);}); },
  set(l){ if(l===GL){$('lngp').style.display='none';return;} const o=store.get(OPTS)||{}; o.lang=l||'ru'; store.set(OPTS,o); if(l&&window.Stat)Stat.ev('lang-'+l); location.href=location.pathname; } };
{const b=$('lngb'); if(b){b.onclick=e=>{e.stopPropagation();const p=$('lngp');p.style.display=p.style.display==='none'?'block':'none';}; Lang.sync();document.addEventListener('click',e=>{const p=$('lngp');if(p&&p.style.display!=='none'&&!p.contains(e.target)&&e.target!==b)p.style.display='none';});document.addEventListener('keydown',e=>{if(e.key==='Escape'){const p=$('lngp');if(p)p.style.display='none';}});}
 if(window.HTML_TR){const T=window.HTML_TR; const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT); let n; while(n=w.nextNode()){const k=n.nodeValue.trim(); if(k&&T[k]!==undefined&&!n.parentNode.closest('#lngp'))n.nodeValue=n.nodeValue.replace(k,T[k]);}
   document.querySelectorAll('[title]').forEach(e=>{if(T[e.title]!==undefined)e.title=T[e.title];});
   const st=document.createElement('style'); st.textContent='.law.done .t::after{content:"'+(T['  ✔ 적용됨']||'  ✔')+'"}'+(typeof CJK_CSS!=='undefined'?CJK_CSS:''); document.head.appendChild(st);} }

drawMap(); applyOpts(); renderMenu(); show('title');

(function(){const v=document.getElementById('ver');if(v)v.textContent='버전 '+VERSION;})();

// ================= ЧИТЫ (для тестов): включаются в главном меню, в игре кнопка «ЧИТ» и клавиши =================
function cheatOn(){return !!(store.get(OPTS)||{}).cheat;}
function cheatSync(){const b=$('cheat-btn'); if(b)b.style.display=cheatOn()&&S&&['map','wh','assault','event','paper'].includes(screen)?'block':'none';
}
function cheatBack(){ $('modal').classList.remove('on'); if(screen==='map'||screen==='wh'){save();showMain();} else if(screen==='assault'){save();renderAssault();} }
function cheatGo(k,auto){ if(!S)return; S.cheat=1;
  const toCrisis=()=>{ if(S.phase===1){S.phase=2;S.day=Math.max(S.day,DECREE_DAY+1);S.fired.e1400=1;} };
  $('modal').classList.remove('on');
  if(k==='assault'){ if(S.phase===3)return; if(S.phase===1||S.day<12){const T={ppl:3500,mil:250,gun:300,med:40,sup:5,bar:3}; for(const q in T)S[q]=Math.max(S[q]||0,T[q]);} toCrisis(); S.pr=100; S.queue=['assault']; nextEvent(); if(auto)choose(0); }
  else if(k==='ost'){ toCrisis(); S.fired.eost=0; S.queue=['eost']; nextEvent(); }
  else if(k==='decree'){ if(S.phase!==1)return; S.day=DECREE_DAY; S.queue=['e1400']; nextEvent(); }
  else if(k==='alpha'){ if(S.phase!==3)cheatGo('assault',1); if(S.A){ if(S.A.card==='muster')musterClose(); S.A.r=4; alphaCard(); } }
  else if(k==='epi'){ S.endId=S.endId||'held'; showEpi(0); }
  cheatSync();
}
function openCheats(){ if(!S)return; S.cheat=1; const win=$('modal-win'); win.classList.add('wide');
  const R=[['leg','정통성',20],['hope','결의',20],['rad','급진성',20],['city','모스크바',20],['med','방송',20],['ppl','시민',1000],['mil','민병대',200],['gun','무기',200],['sup','보급',3],['omon','OMON 준비 태세',30]];
  const b=(k,t,c)=>`<div class="law ck${c?' '+c:''}" data-k="${k}"><div class="t">${t}</div></div>`;
  win.innerHTML=`<h2>치트 · 테스트용</h2>${resStrip('')}
   <div class="sub">키 0으로 이 패널을 열고 닫습니다. 휴대폰에서는 타이틀 화면의 버전 번호를 빠르게 다섯 번 누르면 «치트» 버튼이 켜집니다.</div>
   <div class="ph">이동</div><div class="ckg">${b('go:decree','지금 1400호 대통령령')+b('go:ost','‘오스탄키노’ 사건')+b('go:assault','바로 강습으로')+b('go:alpha','출입구의 ‘알파’로')+b('go:epi','‘각자의 결말’ 슬라이드')+b('x:night','턴 종료')}</div>
   <div class="ph">지표</div><div class="ckg">${R.map(([k,n,v])=>b('r:'+k+':'+v,n+' +'+v)+b('r:'+k+':-'+v,n+' −'+v)).join('')}</div>
   <div class="ph">배치</div><div class="ckg">${b('x:all','전부 최대로')+b('x:orders','명령 +5, 결의 +3')+b('x:ptsup','모든 세력 +20')+b('x:ptsdn','모든 세력 −20')+b('x:loyup','모든 계파 충성도 상승')+b('x:loydn','모든 계파 더 격앙')+b('x:rne',S.fac.rne.n>0?'RNE 제거':'RNE를 건물에 투입')+b('x:ring',S.cordon?'봉쇄선 해제':'봉쇄선 설치')+b('x:power',S.flags.noPower?'전기 켜기':'전기 끊기')+b('x:dep','의원 −60')+b('x:seen','도움말 초기화')}</div>
   <div class="ph">결말 보기</div><div class="ckg">${Object.keys(ENDINGS).map(id=>b('end:'+id,ENDINGS[id].h+' · '+({win:'승리',neu:'중립',lose:'패배'})[endTier(id)])).join('')}</div>
   <div class="close xtop">✕ 닫기</div>`;
  $('modal').classList.add('on'); win.querySelector('.close').onclick=cheatBack;
  win.querySelectorAll('.ck').forEach(e=>e.onclick=()=>{const [a,k,v]=e.dataset.k.split(':');
    if(a==='go')return cheatGo(k);
    if(a==='end'){$('modal').classList.remove('on');const sv=store.get(SAVE);ending(k,1);if(sv)store.set(SAVE,sv);cheatSync();return;}
    if(a==='r'){ if(k==='omon'&&S.omon==null)S.omon=100; apply({[k]:+v}); }
    if(a==='x')cheatX(k);
    if(a==='x'&&k==='night')return;
    save(); if(screen==='map'||screen==='wh')showMain(); openCheats();});
}
function cheatX(k){
  if(k==='all'){apply({leg:100,hope:100,city:30,med:60,ppl:3000,mil:400,gun:400,sup:10});S.rad=Math.min(S.rad,30);S.orders+=5;S.lawCharges+=3;}
  else if(k==='orders'){S.orders+=5;S.lawCharges+=3;}
  else if(k==='ptsup'||k==='ptsdn'){for(const p in S.pts)if(p!=='wh'&&p!=='kre')S.pts[p]=clamp(S.pts[p]+(k==='ptsup'?20:-20),0,100);}
  else if(k==='loyup'||k==='loydn'){for(const F of FACTIONS)S.fac[F.id].loy=clamp(S.fac[F.id].loy+(k==='loyup'?2:-2),0,10);}
  else if(k==='rne'){S.fac.rne.n=S.fac.rne.n>0?0:120;}
  else if(k==='ring'){ if(S.cordon){S.ring=0;syncRing();} else if(S.phase===2){S.cordon=1;S.ring=null;syncRing();} }
  else if(k==='power'){S.flags.noPower=S.flags.noPower?0:1;}
  else if(k==='dep'){let n=60;for(const id of ['kol','sm','agr','ros','otc','kr']){const f=S.fac[id],q=Math.min(f.n,n);f.n-=q;n-=q;}}
  else if(k==='seen'){S.seen={};}
  else if(k==='night'){$('modal').classList.remove('on'); if(screen==='map'||screen==='wh')endTurn();}
}
// клавиша 0 открывает панель читов (в меню их нет). На телефоне: пять быстрых нажатий на номер версии на титуле включают кнопку «ЧИТ»
addEventListener('keydown',e=>{ if(e.key==='0'&&screen==='title'){e.stopImmediatePropagation();e.preventDefault(); if($('modal').classList.contains('on'))closeModal(); else openAch(1); return;}
  if(e.key!=='0'||!S||screen==='title'||screen==='intro')return; e.stopImmediatePropagation();e.preventDefault(); if($('modal').classList.contains('on')&&$('modal-win').querySelector('.ck'))cheatBack(); else openCheats();},true);
{let n=0,t0=0; $('ver').style.pointerEvents='auto'; $('ver').onclick=e=>{e.stopPropagation(); const now=Date.now(); n=now-t0<600?n+1:1; t0=now; if(n>=5){n=0; const o=store.get(OPTS)||{}; o.cheat=!o.cheat; store.set(OPTS,o); $('ver').style.color=o.cheat?'#c0473a':'#6e6658'; cheatSync();}};
 if(cheatOn())$('ver').style.color='#c0473a';}

$('cheat-btn').onclick=openCheats; cheatSync();

$('author').innerHTML=authorHTML();
