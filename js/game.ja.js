// ================= 1993 — game logic =================
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fmt=n=>Math.round(n).toLocaleString('ja-JP');
const MON=['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
const WD=['日曜日','月曜日','火曜日','水曜日','木曜日','金曜日','土曜日'];
const dateOf=day=>new Date(1993,8,13+day);                // day 1 = 14 Sep 1993, day 8 = 21 Sep (decree)
const dateStr=day=>{const d=dateOf(day);return MON[d.getMonth()]+d.getDate()+'日';};   // 日本語版：「9月21日」
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
    const good=(k==='rad'||k==='omon')?v<0:v>0; out.push(`<span class="${good?'p':'n'}">${RES_NAMES[k]} ${k==='sup'&&v%1?(v>0?'+':'−')+String(Math.abs(v)):sg(v)}${k==='sup'?'日':''}</span>`);}
  if(fx.pts)for(const p in fx.pts){const v=fx.pts[p];if(!v)continue;const nm=POINTS.find(q=>q.id===p).nm.replace(/ ↑.*/,'');
    out.push(`<span class="${v>0?'p':'n'}">${p===ctx?'忠誠度':nm} ${v>=100?'味方に':sg(v)}</span>`);}
  if(fx.fac)for(const f in fx.fac){const d=fx.fac[f], nm=f===ctx?'':FACTIONS.find(F=>F.id===f).sh+': ';
    if(d.n)out.push(`<span class="${d.n>0?'p':'n'}">${nm}${d.n<=-900?'離脱':d.n>0?'+'+d.n+'人':d.n+'人'}</span>`);
    if(d.loy)out.push(`<span class="${d.loy>0?'p':'n'}">${nm}${d.loy>=2?'忠誠度が大きく上昇':d.loy>0?'忠誠度上昇':d.loy<=-2?'強い不満':'不満'}</span>`);}
  if(fx.pr)out.push(S&&S.phase===1?`<span class="${fx.pr>0?'n':'p'}">${fx.pr>0?'疑念が強まる':'疑念が薄れる'}</span>`:`<span class="${fx.pr>0?'n':'p'}">${fx.pr>0?'突入が近づく':'突入が遠のく'}</span>`);
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
const actSound=t=>/電話|追及|電報/.test(t)?'phone':/集める|集会|ピケ|通りを封鎖|訴える|輸送隊/.test(t)?'crowd':/武器|突入|隊列/.test(t)?'bolt':/バリケード|備蓄/.test(t)?'thud':/裁判|提訴|調停|交渉/.test(t)?'stamp':'paper';

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
    document.querySelectorAll('.sndb').forEach(b=>{b.textContent='♪ サウンド：'+(on()?'オン':'オフ');b.classList.toggle('off',!on());});}
  return {has,on,sync,set(w){want=w;sync();},toggle(){const o=store.get(OPTS)||{};o.mute=!o.mute;store.set(OPTS,o);sync();}};})();
addEventListener('pointerdown',()=>Music.sync());addEventListener('keydown',()=>Music.sync());

// ---------- intro: a slide show before a new game ----------
const INTRO=[
  {pic:['wh'],      st:'モスクワ · 1993', t:'ソ連が消えて2年目になる。価格は自由化され、預金は紙くず同然となり、工場は止まって賃金も出ない。国はいまも1978年制定のロシア共和国（RSFSR）憲法のもとにあり、そこにはすでに数百もの修正が加えられている。'},
  {pic:['yeltsin'], st:'大統領',      t:'ボリス・エリツィンは1991年6月に大統領に選ばれた。市場経済改革を進めているが、議会のせいで最後までやり遂げられないと考えている。彼に必要なのは、強い大統領を定めた新しい憲法だ。'},
  {pic:['hasb'],    st:'議会',      t:'人民代議員大会と最高会議は1990年に選ばれた。現行憲法のもとでは、国の最高権力は彼らにある。最高会議議長は、つい最近までエリツィンの盟友だったルスラン・ハズブラートフだ。'},
  {pic:['yeltsin','hasb'], st:'二重権力', t:'1992年12月、大会はガイダルの首相就任を承認しなかった。1993年3月には大統領の罷免を試みたが、72票足りなかった。いまや法律も大統領令も、ことごとく相手側に覆される。'},
  {pic:['wh'],      st:'4月25日 · 「賛成、賛成、反対、賛成」', t:'国民投票では、多数が大統領とその改革を支持した。だが、大統領と議会のどちらについても前倒し選挙は行われない。両陣営とも勝利を宣言した。'},
  {pic:['rutskoy'], st:'副大統領', t:'将軍でソ連邦英雄のアレクサンドル・ルツコイは議会側に移り、閣僚たちの不正を暴く資料が「スーツケース何個分も」あると予告した。9月1日、エリツィンは大統領令で彼の職務を停止した。最高会議はこの大統領令を違法とみなしている。'},
  {pic:['wh'],      st:'9月14日',    t:'あなたは最高会議だ。手元にあるのは、クラスノプレスネンスカヤ河岸通りの建物、265人の代議員、法、そしてその壁のもとへ駆けつける人々。大統領は軍に「決定的な9月」を約束した。この先どうなるかは、誰にもわからない。'},
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
const OWN_NM={vs:'最高会議側',kr:'クレムリン側',neu:'二つの権力の間'};
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
  add(whYield(S).leg,'大会の活動'); add(-(S.phase===2?4:1),S.phase===2?'二重権力の長期化':'対立への疲れ');
  if(kremlinVoice()-mediaIncome()>=6)add(S.phase===2?-2:-1,'クレムリン側の報道が優勢');
  const lm=Math.round((S.city-50)/20); add(lm,lm>0?'モスクワが味方':'モスクワが敵対');
  if(S.cordon)add(ringPress(S).leg,'建物が包囲網の中');
  if(S.phase===2&&deputies(S)<QUORUM)add(-3,'定足数割れ');
  if(S.phase===2&&S.med<5)add(-1,'放送で反論できない');
  return {v:P.reduce((a,p)=>a+p[0],0),P};}
const pressLeg=S=>OUTLETS.reduce((a,o)=>{const st=outSt(S,o),e=st==='vs'?o.pas:st==='kr'?o.kpas:null;return a+((e&&e.fx.leg)||0);},0);
// давление кольца за ночь; S.hold — что игрок оплачивает, чтобы терпеть
function ringPress(S){const h=S.hold||{}, hv=(S.ring==null?100:S.ring)>=50; return {leg:h.cour?(hv?-2:-1):(hv?-4:-2), hope:h.ration?0:(hv?-3:-2), sup:(h.port||S.flags.gap>0)?0:(hv?.6:.4), med:h.cour?0:(hv?-2:-1), dep:h.cour?0:(hv?4:2)};}
function syncRing(){ if(S.cordon){ if(S.ring==null)S.ring=100; if(S.ring<=0){S.cordon=0;S.ring=null;S.flags.ringOff=1;S.flags.gap=0;S.hold={};apply({hope:5,leg:3});log('包囲網が解けた。ホワイトハウスへ再び人と車が向かっている。');} } else S.ring=null; }
function halve(fx){const o={};for(const k in fx){const v=fx[k]; o[k]=typeof v==='object'?halve(v):(v<0?Math.ceil(v/2):Math.floor(v/2));}return o;}
// лояльность фракций двигается каждую ночь: её тянут издания, которые фракция читает, и общее положение дел
function facDrift(){const out=[]; for(const F of FACTIONS){const f=S.fac[F.id]; f.tr=null; if(F.kind!=='dep'||f.n<=0)continue; let v=0; const up=[],dn=[];
    for(const id of FAC_PRESS[F.id]||[]){const o=OUTLETS.find(x=>x.id===id),st=outSt(S,o); if(st==='vs'){v+=.34;up.push(o.nm+'が味方');} else if(st==='kr'){v-=.34;dn.push(o.nm+'がクレムリン側');}}
    const mod=['agr','sm','kol'].includes(F.id);
    if(S.hope>=70){v+=.2;up.push('館内に勝利への確信');} else if(S.hope<45){v-=.3;dn.push('決意の低下');}
    if(S.cordon&&mod){v-=.25;dn.push('建物が包囲網の中');}
    if(S.fac.rne.n>0&&mod){v-=.2;dn.push('館内にRNE');}
    if(S.rad>=60){ if(mod){v-=.3;dn.push('マイクを握る過激派');} else{v+=.2;up.push('本気の議論が始まった');} }
    f.dr=clamp((f.dr||0)+v,-1.6,1.6);
    if(f.dr>=1&&f.loy<10){f.dr-=1;f.loy++;f.tr={d:1,why:up[0]||'順調'};} else if(f.dr<=-1&&f.loy>0){f.dr+=1;f.loy--;f.tr={d:-1,why:dn[0]||'疲労'};}
    if(f.tr)out.push(F.sh+(f.tr.d>0?' ↑':' ↓')+' ('+f.tr.why+')');} return out;}
function renderHud(p){
  $(p+'-day').textContent=S.day+'日目';
  $(p+'-date').textContent=dateStr(S.day).toUpperCase();
  $(p+'-wd').textContent=WD[dateOf(S.day).getDay()]+' · '+PHASE_NM[S.phase];
  const cur=snap();
  const R=[['leg','正統性'],['dep','代議員'],['ppl','市民'],['mil','義勇兵'],['gun','武器'],['med','放送'],['sup','補給']];
  if(S.phase===1)R.splice(3,1);
  $(p+'-res').innerHTML=R.map(([k,nm])=>{const d=Math.round(cur[k]-(S.am?S.am[k]:cur[k]));
    let dl=d>0?`<span class="dlt up">+${fmt(d)}</span>`:d<0?`<span class="dlt dn">−${fmt(-d)}</span>`:'';
    if(k==='med')dl=`<span class="dlt up">+${mediaGain()}/ターン</span>`;
    if(k==='gun'&&S.mil>0)dl=`<span class="dlt">空き ${fmt(freeGuns(S))}</span>`;
    if(k==='dep'){const r=S.depRate||0;dl=`<span class="dlt">${S.away?'−'+S.away+' 移動中 · ':''}${S.phase===2&&r>0?'定足数割れまで ≈'+Math.max(0,Math.ceil((cur.dep-QUORUM)/r))+'日':'／265人'}</span>`;}
    if(k==='leg'){const f=legDrift(S).v+pressLeg(S);dl=`<span class="dlt ${f<0?'dn':'up'}">夜間 ${f?sg(f):'0'}</span>`;}
    const warn=(k==='sup'&&S.sup<=2)||(k==='leg'&&S.leg<=20)||(k==='med'&&S.med<10&&S.phase>1)?' warn':'';
    const v=k==='sup'?Math.floor(S.sup)+'日':fmt(cur[k]);
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
  let tl='<div class="lbl px">日程</div>';
  for(let d=start;d<start+14;d++){const n=dateOf(d).getDate();const cls=d<S.day?'past':d===S.day?'now':(d>=aday&&d<=aday+(S.phase===1?0:1))?'risk':'';
    tl+=`<div class="c ${cls}">${n}${cls==='risk'?' ?':''}</div>`;}
  $('tl').innerHTML=tl;
  // meters
  seg('hope',S.hope); seg('rad',S.rad); seg('city',S.city); $('m-city').textContent=S.city+'%';
  $('m-hope').textContent=S.hope+'%';
  $('m-rad').textContent=S.rad+'%'+(S.rad>=50?' ▲':''); $('m-rad').className=S.rad>=50?'warn':'';
  $('m-a1').textContent=S.phase===1?'クレムリンの疑念':'突入まで';
  $('m-a2').textContent=S.phase===1?'ホワイトハウスは監視されている':'内務省筋の噂では';
  $('m-assault').textContent=S.phase===1?(S.pr>=15?'強い':S.pr>=6?'強まっている':'弱い'):'≈'+eta+'日';
  $('m-hl').textContent=S.phase===1?'最高会議の決意':'守備側の決意';
  // points
  const map=$('map'); map.querySelectorAll('.pt,.tag').forEach(e=>e.remove());
  for(const p of POINTS){const v=S.pts[p.id];const d=document.createElement('div');
    d.className='pt lp-'+(MAP_LP[p.id]||p.lp||'b')+(p.big?' big':'')+(S.sel===p.id?' sel':'');
    d.style.left=(2+p.x*4)+'px';d.style.top=(p.y*4)+'px';d.style.setProperty('--c',`var(--${own(v)})`);
    const who=PEOPLE[POINT_WHO[p.id]];
    d.innerHTML=`<div class="mk">${p.ic}</div><div class="lb"><div class="pc">${who&&who.img?faceHTML(POINT_WHO[p.id]):''}<div class="pi"><div class="nm">${p.nm.replace(/ ↑.*/,'')}</div>${who?`<div class="wn">${who.nm.split(/[ ・]/).slice(-1)[0]}</div>`:''}<div class="bar"><i style="width:${v}%"></i></div></div></div></div>`;
    d.querySelector('.mk').onclick=d.querySelector('.pc').onclick=()=>{S.sel=p.id;renderMap();firstLook('p',p.id);};
    map.appendChild(d);}
  syncRing(); const tags=[]; if(S.cordon)tags.push({x:12,y:2,t:'包囲網 '+S.ring+(S.flags.gap>0?'、抜け道あり':'')+' ▸ 解除方法',c:'btn',on:openSiege});
  if(S.flags.noComms)tags.push({x:12,y:7,t:'通信途絶：電話も編集部も使えない ▸',c:'btn red',on:openSiege});
  if(S.strike){const T=STRIKES.find(x=>x.id===S.strike.id);tags.push({x:12,y:S.flags.noComms&&S.cordon?12:(S.flags.noComms||S.cordon)?7:2,t:'今夜のエリツィンの攻撃：'+T.nm+(T.cover(S)?' · 対処済み':' · 未対処')+' ▸',c:'btn'+(T.cover(S)?'':' red'),on:openStrike});}
  if(S.phase>1&&S.rad>=40)tags.push({x:84.5,y:95.5,t:'衝突',c:'red'});
  for(const tg of tags){const d=document.createElement('div');d.className='tag '+tg.c;d.textContent=tg.t;d.style.left=(tg.x*4-40)+'px';d.style.top=(tg.y*4+4)+'px';if(tg.on)d.onclick=tg.on;map.appendChild(d);}
  drawMapDynamic({cordon:S.cordon,crowds:[[84,76,Math.round(6+S.rad*.6),'#c0473a'],[78,50,Math.round(Math.min(60,(S.ppl+S.mil)/80)),'#c0473a'],[88,79,S.phase===1?0:S.cordon?24:12,'#7fa0cf']]});
  renderTarget(); drawFaces($('s-map'));
  // log
  $('log').innerHTML=S.log.slice(0,3).map((l,i)=>`<div class="${i===0&&l.day===S.day?'new ':''}${l.cls}"><span class="tm">${l.day===S.day?l.tm:'昨日'}</span>${l.text}</div>`).join('')||'<div>朝。命令を待つ。</div>';
  // buttons
  $('laws-n').textContent='採択可能：'+lawsAvail(); $('b-laws').classList.toggle('none',!lawsAvail());
  $('orders').textContent='ENTER · 残り命令：'+S.orders;
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
  if(a.once&&S.once[pid+i])return '実行済み';
  if(S.used[pid+i])return '今日は実行済み';
  if(a.phone&&S.flags.noComms)return '電話が不通';
  if(S.cordon&&pid!=='wh'&&!a.phone&&!/封鎖線/.test(a.t)&&!(S.flags.gap>0||S.flags.tunnel))return '包囲網：鉄条網の外に出られない';
  if(a.req){const r=a.req(S);if(r!==true)return r;}
  if(a.dep&&deputies(S)-S.away<a.dep)return '手の空いた代議員が足りない';
  if(!S.orders)return '朝まで命令なし';
  return true;}
function renderTarget(){
  const p=POINTS.find(q=>q.id===S.sel), v=S.pts[p.id], o=own(v);
  const acts=actsOf(p.id).map(({a,i},n)=>{const st=actState(p.id,i);
    const f0=actFx(p.id,i), kf=inflOf(p.id,i);
    let cost=a.chance?fxText(a.cost||{},p.id):fxText(f0,p.id);
    if(a.chance&&!cost)cost=fxText(a.ok,p.id);
    if(a.dep)cost=`代議員：${a.dep}`+(cost?' · '+cost:'');
    if(!a.chance&&kf<1)cost+=(cost?' · ':'')+`<span class="risk">${kf<0?'もう誰も耳を貸さない':'飽きられている：効果 '+Math.round(kf*100)+'%'}</span>`;
    if(a.risk)cost+=(cost?' · ':'')+`<span class="risk">${a.risk}</span>`;
    if(st!==true)cost=`<span class="risk">${st}</span>`;
    return `<div class="act${st!==true?(S.used[p.id+i]||S.once[p.id+i]?' done':' off'):''}" data-i="${i}"><span class="k">${n+1}</span><span class="t">${a.t}</span><span class="cost">${cost}</span></div>`;}).join('');
  const W=PEOPLE[POINT_WHO[p.id]];
  $('target').innerHTML=`<div class="who">${faceHTML(POINT_WHO[p.id],'big')}<div><h3>${p.full}</h3>
    <div class="own"><b>${W.nm}</b>、${W.role}</div>
    <div class="own">${S.phase===1?'傾向':'掌握'}：<span style="color:${OWN_COL[o]}">${OWN_NM[o]}</span></div></div></div>
    <div class="split"><div class="a" style="width:${v}%"></div><div class="b" style="width:${100-v}%"></div></div>
    <div class="split-l"><span>最高会議 ${v}%</span><span>クレムリン ${100-v}%</span></div>
    <div class="facts">${(T=>T?`<span class="${tugSide(v)==='vs'?'p':'n'}">現在、毎晩：${T.t}${fxText(T.fx)?'（'+fxText(T.fx).replace(/<[^>]+>/g,'')+'）':''}${T.ph&&S.phase<T.ph?' ― 危機が始まってから':''}</span><br>`:POINT_TUG[p.id]?'65%以上で毎晩あなたに有利に、35%以下でクレムリンに有利に働きます。<br>':'')(POINT_TUG[p.id]&&tugSide(v)&&POINT_TUG[p.id][tugSide(v)])}${(p.id==='mo'||p.id==='gs')&&S.phase===2?`突入時の${p.id==='mo'?'戦車':'自動車化狙撃兵'}：<span style="color:var(--paper)">${v>=65?'出動しない':v>=45?'及び腰で出動':'命令を実行'}</span>（45以上でためらい、65以上で拒否）。`:''}${p.id==='mvd'&&S.phase===2?`<span style="color:var(--paper)">OMONの戦意：${S.omon==null?100:S.omon}%</span>（60以下でためらい、30以下で出動しない）。`:''}${p.id==='wh'?'ここで大会が開かれています。会派と最高会議の活動は「ホワイトハウス」画面で確認できます。':''}${p.id!=='wh'?`<span style="color:var(--paper)">命令の実行率：${Math.round(execChance(p.id)*100)}%</span>${S.flags.noComms?'（通信途絶：−15%）':''}`:''}</div>
    <div class="acts">${acts}</div>`;
  $('target').querySelectorAll('.act').forEach(e=>e.onclick=()=>doAction(p.id,+e.dataset.i));
}
function doAction(pid,i){
  if(i===undefined||actState(pid,i)!==true)return;
  const a=ACTIONS[pid][i]; let fx, txt; S.uses=S.uses||{};
  if(Math.random()>execChance(pid)){S.orders--; S.used[pid+i]=1; log(POINTS.find(q=>q.id===pid).nm.replace(/ ↑.*/,'')+'：最高会議の命令は実行されなかった。正統性が足りない。','bad'); Sfx.play('fail'); S.st=S.st||{}; S.st.fail=(S.st.fail||0)+1; save(); renderMap(); return;}
  Sfx.play(actSound(a.t));
  if(a.chance){const ok=Math.random()<a.chance(S); fx=ok?a.ok:a.fail; txt=ok?a.okLog:a.failLog; log(txt,ok?'':'bad');}
  else{fx=actFx(pid,i); S.uses[pid+i]=(S.uses[pid+i]||0)+1; txt=POINTS.find(q=>q.id===pid).nm.replace(/ ↑.*/,'')+'：'+a.t+'。'; log(txt);}
  apply(fx); S.orders--; S.used[pid+i]=1; S.did[pid]=1; if(a.once)S.once[pid+i]=1; if(a.dep)S.away+=a.dep;
  if(checkLose())return;
  save(); renderMap();
}

// ---------- decrees ----------
function openLaws(){
  const n=S.lawCharges;
  $('modal-win').innerHTML=`<h2>最高会議の決議</h2>${resStrip('law')}<div class="sub">${n?'採択できる決議：'+n+'件。新しい決議は2日に1回です。正統性が高いほど決議の効果は大きくなります（現在 ×'+(.5+S.leg/100).toFixed(1)+'）。':'今日は採択できません。新しい決議は2日に1回です。'}</div>`+
    LAWS.filter(inPh).map(l=>`<div class="law${S.laws[l.id]?' done':!n?' lock':''}" data-id="${l.id}"><div class="t">${l.t}</div><div class="d">${l.d}</div><div class="e">${S.laws[l.id]?'採択済み':(!n?'<span class="n">採択できる決議がない：新しい決議は2日に1回</span> · ':'')+fxText(lawFx(l))}</div></div>`).join('')+
    `<div class="close">ESC：閉じる</div>`;
  $('modal').classList.add('on');
  $('modal-win').querySelectorAll('.law').forEach(e=>e.onclick=()=>{const l=LAWS.find(x=>x.id===e.dataset.id);
    if(S.laws[l.id]||!S.lawCharges)return; Sfx.play('stamp'); S.laws[l.id]=1;S.lawCharges--;S.did.law=1; if(l.flag)S.flags[l.flag]=1; apply(lawFx(l));
    log('決議「'+l.t+'」を採択した。'); closeModal(); if(checkLose())return; save(); showMain();});
  $('modal-win').querySelector('.close').onclick=closeModal;
}
// ---------- media: channels bring Эфир every night, appeals spend it ----------
let etherSel=null;
function outWayState(o,k){const W=OUT_WAYS[k]; if(S.appeals.pull)return '今日はすでに編集部に働きかけた'; return W.req(S,o);}
function outWin(o,k){const W=OUT_WAYS[k]; if(outWayState(o,k)!==true||outLocked(S,o))return; const st=outSt(S,o);
  apply(W.cost(o)); if(W.order)S.orders--; if(W.run)W.run(S); S.appeals.pull=1; S.did.media=1; Sfx.play(k==='p'?'crowd':k==='z'?'stamp':'paper');
  if(W.chance&&Math.random()>W.chance){apply({city:-3}); log('放送：'+o.nm+'への圧力は失敗。編集部は「暴徒」について書き立てている。');}
  else{S.out[o.id]=st==='kr'?'neu':'vs'; log('放送：'+o.nm+(st==='kr'?'はもうクレムリンの言いなりではない。':'が最高会議に発言の場を与えるようになった。'));}
  save(); showMain(); openEther();}
function outActState(o,a,key){if(S.flags.noComms&&o.id!=='radio'&&o.id!=='for')return '通信途絶'; if(S.appeals[key])return '今日は実施済み'; if(S.med<a.cost)return '放送'+a.cost+'が必要'; return true;}
function outAct(o,a,key){if(outActState(o,a,key)!==true)return; Sfx.play(/echo|radio|ost|pch|600|for/.test(o.id)?'pips':'teletype'); S.med-=a.cost; S.appeals[key]=1; S.did.media=1; apply(fxOf(a)); if(a.run)a.run(S); log(o.nm+'：'+a.t+'。'); save(); showMain(); openEther();}
const UNIT_SH={tanks:'戦車',taman:'自動車化狙撃兵',vv:'国内軍',omon:'OMON',alpha:'「アルファ」'};
function finTxt(fx){if(!fx)return '';const o=[],pc=k=>(k<1?'−':'+')+Math.round(Math.abs(1-k)*100)+'%';
  if(fx.air)o.push('放送 '+sg(fx.air)); if(fx.hope)o.push('決意 '+sg(fx.hope)); if(fx.inc)o.push('+'+fx.inc+'人'); if(fx.ppl)o.push('市民 '+sg(fx.ppl));
  if(fx.mil)o.push('戦闘員 '+sg(fx.mil)); if(fx.ctl)o.push('入口 '+sg(fx.ctl)); if(fx.all)o.push('攻勢 '+pc(fx.all));
  if(fx.u)for(const k in fx.u)if(fx.u[k]!==1)o.push(UNIT_SH[k]+' '+pc(fx.u[k])); return o.join('、');}
function openEther(){
  const inc=mediaIncome(), kv=kremlinVoice(), dc=cityShift();
  let o=OUTLETS.find(x=>x.id===etherSel); if(!o){o=OUTLETS.find(x=>outSt(S,x)==='vs'&&x.act)||OUTLETS[0]; etherSel=o.id;}
  const SN={vs:'最高会議側',neu:'中立',kr:'クレムリン側',off:'停止中'}, ord={vs:0,neu:1,kr:2,off:3};
  const rows=OUTLETS.slice().sort((a,b)=>ord[outSt(S,a)]-ord[outSt(S,b)]||b.r-a.r).map(x=>{const st=outSt(S,x), fv=(x.pas&&fxText(x.pas.fx))||'', fk=(x.kpas&&fxText(x.kpas.fx))||'', pl=t=>t.replace(/<[^>]+>/g,'');
    const can=st!=='vs'&&st!=='off'&&!outLocked(S,x), fresh=st==='vs'&&x.act&&!S.appeals['o'+x.id];
    return `<tr class="s-${st}${etherSel===x.id?' sel':''}" data-o="${x.id}"><td class="nm">${x.nm}</td><td class="r">${x.r}</td><td class="st">${SN[st]}${st!=='vs'&&st!=='off'?(can?'':' · 奪取不可'):''}</td><td>${x.aud||''}</td>
      <td class="${st==='vs'?'':'dim'}">${x.act?x.act.t+(fresh?' <i>●</i>':''):''}</td>
      <td class="${st==='vs'?'':'dim'}">${st==='vs'?fv:pl(fv)}</td><td class="${st==='kr'?'':'dim'}">${st==='kr'?fk:pl(fk)}</td></tr>`;}).join('');
  const st=outSt(S,o); let det=`<div class="odet"><div class="ph">媒体 · ${st==='vs'?'味方：指示を出す（1日1回）':st==='off'?'停止中':'引き込む方法（1日1件'+(S.appeals.pull?'、実施済み':'')+'）'}</div><div class="oh"><b>${o.nm}</b> <span>影響力 ${o.r} · ${SN[st]}。${o.about||''}</span></div><div class="obtn">`;
  if(st==='vs'){det+=[['o'+o.id,o.act],['p'+o.id,o.act2]].filter(x=>x[1]).map(([key,a])=>{const s2=outActState(o,a,key);return `<div class="law oact${s2!==true?' lock':''}" data-k="${key}"><div class="t">${a.t} <span class="cst">放送 −${a.cost}</span></div><div class="e">${s2===true?[fxText(fxOf(a)),a.e].filter(Boolean).join(' · '):`<span class="n">${s2}</span>`}</div></div>`;}).join('');}
  else if(st==='off')det+=`<div class="oa n">現在は停止中。</div>`;
  else if(outLocked(S,o))det+=`<div class="oa n">引き込めない。</div>`;
  else det+=(o.ways||'').split('').map(k=>{const W=OUT_WAYS[k], s2=outWayState(o,k), c=fxText(W.cost(o))||(k==='z'?'決議':'');return `<div class="law oway${s2!==true?' lock':''}" data-w="${k}"><div class="t">${W.t} <span class="cst">${c||'命令'}</span></div><div class="e">${s2===true?W.d(o)+(st==='kr'?'。中立になる':'。味方になる'):`<span class="n">${s2}</span>`}</div></div>`;}).join('');
  det+='</div></div>';
  const win=$('modal-win'); win.classList.add('wide');
  win.innerHTML=`<h2>放送 · モスクワをめぐる攻防</h2>
   <div class="tug"><span class="l">最高会議側 ${S.city}%</span><div class="tb"><i style="width:${S.city}%"></i></div><span class="r">クレムリン側 ${100-S.city}%</span></div>
   ${resStrip('med')}
   <div class="sub">あなたの発信力 <b style="color:var(--ok)">${inc}</b> 対 クレムリンの発信力 <b style="color:#7fa0cf">${kv}</b>：今夜のモスクワは <b class="${dc<0?'n':'p'}">${dc?sg(dc):'変化なし'}</b>。モスクワを動かす手段は、「モスコフスキー・コムソモーレツ」と「モスクワのこだま」（味方になった媒体1つにつき毎晩+1、現在 +${moscOut()}）、下のキャンペーン、朝刊での反論です。表から媒体を選んでください。${S.flags.noComms?' <span class="n">通信途絶：使えるのは館内のラジオ、外国メディア、館内に招き入れた者だけです。</span>':''}${S.kmed?' <span class="n">昨夜、クレムリンが放送で攻勢をかけた。</span>':''}</div>
   <table class="otab"><tr><th>媒体</th><th>影響力</th><th>陣営</th><th>影響対象</th><th>味方のときの行動</th><th>味方の間の毎ターン効果</th><th>クレムリン側の間</th></tr>${rows}</table>
   <div class="eth3">${det}<div><div class="ph">共通キャンペーン · 媒体に関係なく放送を消費（現在 ${fmt(S.med)}）</div><div class="app2 a1">`+
   APPEALS.filter(inPh).map(a=>{const nc=S.flags.noComms&&a.id!=='foreign', used=S.appeals[a.id]||nc, poor=S.med<a.cost;
     return `<div class="law gen${nc?' lock':used?' done2':poor?' lock':''}" data-id="${a.id}"><div class="t">${a.t} <span class="cst">放送 −${a.cost}</span></div><div class="e">${nc?'<span class="n">通信途絶</span>':used?'今日は実施済み':poor?'<span class="n">放送が足りない：'+a.cost+'必要</span>':[fxText(fxOf(a)),a.e].filter(Boolean).join(' · ')}</div></div>`;}).join('')+
   `</div></div></div><div class="close xtop">✕ 閉じる</div>`;
  $('modal').classList.add('on');
  win.querySelectorAll('tr[data-o]').forEach(e=>e.onclick=()=>{etherSel=e.dataset.o;openEther();});
  win.querySelectorAll('.oway').forEach(e=>e.onclick=()=>outWin(o,e.dataset.w));
  win.querySelectorAll('.oact').forEach(e=>e.onclick=()=>{const key=e.dataset.k;outAct(o,key[0]==='o'?o.act:o.act2,key);});
  win.querySelectorAll('.law.gen').forEach(e=>e.onclick=()=>{const a=APPEALS.find(x=>x.id===e.dataset.id);
    if(S.appeals[a.id]||S.med<a.cost||(S.flags.noComms&&a.id!=='foreign'))return; S.med-=a.cost; S.appeals[a.id]=1; S.did.media=1; apply(fxOf(a)); if(a.run)a.run(S); if(a.id==='deny')S.kmed=0; log('放送：'+a.t+'。'); save(); showMain(); openEther();});
  win.querySelector('.close').onclick=closeModal;
}
function siegeState(i){const a=SIEGE[i]; if(a.once&&S.flags[a.once])return '実行済み'; const r=a.req(S); if(r!==true)return r; if(!S.orders)return '朝まで命令なし'; return true;}
function openSiege(){ syncRing();
  const win=$('modal-win'); win.classList.add('wide');
  const L=SIEGE.map((a,i)=>({a,i,st:siegeState(i)})), can=x=>x.st===true;
  const card=({a,i,st})=>`<div class="law${st===true?'':st==='実行済み'?' done2':' lock'}" data-i="${i}"><div class="t">${a.t} <span class="cst">${[a.ring?'<span class="p">包囲網 −'+Math.min(a.ring,S.ring||0)+'</span>':'',fxText(a.fx)].filter(Boolean).join(' · ')}</span></div><div class="e">${st===true?a.d:st==='実行済み'?'実行済み':`<span class="n">${st}</span>`}</div></div>`;
  const grp=(t,l)=>l.length?`<div class="ph">${t}</div><div class="sg2">${l.map(card).join('')}</div>`:'';
  const ringL=L.filter(x=>x.a.ring&&x.a.ring<100), sum=ringL.filter(can).reduce((a,x)=>a+x.a.ring,0), oth=L.filter(x=>!x.a.ring||x.a.ring>=100).filter(x=>S.cordon||!/包囲網がない/.test(x.st));
  win.innerHTML=`<h2>封鎖${S.cordon?' · 包囲網 '+S.ring+'/100':''}</h2>${resStrip('ord')}${S.cordon?`<div class="tug"><span class="l">解除 ${100-S.ring}</span><div class="tb"><i style="width:${100-S.ring}%"></i></div><span class="r">残り ${S.ring}</span></div>`:''}
   <div class="sub">${S.cordon?(RP=>'現在の包囲網による一晩の影響：<span class="n">正統性 '+RP.leg+(RP.hope?'、決意 '+RP.hope:'')+(RP.med?'、放送 '+RP.med:'')+(RP.sup?'、補給 −'+String(RP.sup)+'日':'')+(RP.dep?'、さらに代議員'+RP.dep+'人が去る':'')+'</span>。人は来ず、鉄条網の外にも出られません。'+(S.ring>=50?'50を下回ると圧力は弱まります。':'包囲網は弱まっており、圧力も小さくなっています。')+'包囲網は毎晩2ずつ締め直されます。<b style="color:var(--paper);font-weight:400">解除まで残り'+S.ring+'。いま使える手段の合計は −'+sum+'。</b>'+(S.flags.gap>0?' <span class="p">抜け道あり：あと'+S.flags.gap+'晩。</span>':''))(ringPress(S)):'包囲網はありません。ここでは通信と電気の復旧もできます。'}
   ${S.flags.noComms?' <span class="n">通信途絶。</span>':''}${S.flags.noPower?' <span class="n">市庁舎により電気と水道が止められている。</span>':''}</div>`+
   (S.cordon?`<div class="ph">耐えて支払う · 毎晩、命令は消費しない、取り消し可能</div><div class="sg3">`+HOLDS.map(H=>{const on=(S.hold||{})[H.id],c=H.can(S);return `<div class="law hold${on?' on2':c!==true?' lock':''}" data-h="${H.id}"><div class="t">${H.t} <span class="cst">${fxText(H.cost)}（毎晩）</span></div><div class="e">${on?'<span class="p">✓ 実施中。</span> '+H.d+'。押すと取り消します':c!==true?`<span class="n">${c}</span>`:H.d}</div></div>`;}).join('')+'</div>':'')+
   (S.cordon?grp('包囲網を少しずつ解く · 実行可能 · 各行動で命令を1つ消費',ringL.filter(can))+grp('包囲網を少しずつ解く · 未解放（不足しているものを表示）',ringL.filter(x=>!can(x))):'')+
   grp(S.cordon?'突破・迂回・通信・電気':'通信・電気',oth.filter(can).concat(oth.filter(x=>!can(x))))+`<div class="close xtop">✕ 閉じる</div>`;
  $('modal').classList.add('on');
  win.querySelectorAll('.law.hold').forEach(e=>e.onclick=()=>{const H=HOLDS.find(x=>x.id===e.dataset.h); S.hold=S.hold||{}; if(!S.hold[H.id]&&H.can(S)!==true)return; S.hold[H.id]=S.hold[H.id]?0:1; Sfx.play('bolt'); save(); showMain(); openSiege();});
  win.querySelectorAll('.law[data-i]').forEach(e=>e.onclick=()=>{const i=+e.dataset.i,a=SIEGE[i]; if(siegeState(i)!==true)return; S.orders--;
    Sfx.play(/力ずく/.test(a.t)?'burst':/無線機/.test(a.t)?'static':/モスクワ市民/.test(a.t)?'crowd':/総主教/.test(a.t)?'night':'bolt');
    if(a.chance&&Math.random()>a.chance){apply(a.fail);log(a.failLog,'bad');} else{apply(a.fx);a.run(S);if(a.once)S.flags[a.once]=1;if(a.ring&&S.ring!=null)S.ring=Math.max(0,S.ring-a.ring);log(a.okLog);syncRing();}
    save(); if(checkLose())return; showMain(); openSiege();});
  win.querySelector('.close').onclick=closeModal;
}
// историческая справка: один раз, при первом нажатии на силу или фракцию; после «ОК» больше не показывается
function firstLook(kind,id){S.seen=S.seen||{}; const key=kind+id; if(S.seen[key])return; const P=kind==='p'?POINTS.find(x=>x.id===id):FACTIONS.find(x=>x.id===id), txt=kind==='p'?(P.why?P.why+'<br><br>'+((S.phase===1&&P.facts1)||P.facts).join(' '):''):FAC_WHY[id]; if(!txt)return;
  S.seen[key]=1; save(); const who=kind==='p'?POINT_WHO[id]:FAC_WHO[id], W=PEOPLE[who];
  $('modal-win').classList.remove('wide');
  $('modal-win').innerHTML=`<h2>${kind==='p'?P.full:P.nm.replace(/"/g,'「').replace(/「([^「]*)「/,'「$1」').toUpperCase()}</h2><div style="display:flex;gap:14px;align-items:flex-start;margin-top:10px">${W?faceHTML(who,'big'):''}<div class="sub" style="margin:0;font-size:18px;line-height:21px">${W?`<b style="color:var(--paper);font-weight:400">${W.nm}</b>、${W.role}<br><br>`:''}${txt}</div></div><div class="law" id="fl-ok" style="margin-top:16px;text-align:center"><div class="t">OK</div></div>`;
  $('modal').classList.add('on'); drawFaces($('modal-win')); $('fl-ok').onclick=closeModal;}
function resStrip(hl){const it=[['leg','正統性',S.leg],['dep','代議員',deputies(S)],['ppl','市民',fmt(S.ppl)],['mil','義勇兵',fmt(S.mil)],['gun','空いている武器',fmt(freeGuns(S))],['med','放送',fmt(S.med)+' <i>+'+mediaGain()+'/ターン</i>'],['sup','補給',Math.floor(S.sup)+'日'],['hope','決意',S.hope+'%'],['rad','過激化',S.rad+'%'],['city','モスクワ',S.city+'%'],['ord','命令',S.orders],['law','決議',S.lawCharges]];
  return '<div class="rstrip">'+it.map(([k,n,v])=>`<span class="${k===hl?'hl':''}">${n} <b>${v}</b></span>`).join('')+'</div>';}
function openStrike(){const T=S.strike&&STRIKES.find(x=>x.id===S.strike.id); if(!T)return; const ok=T.cover(S);
  $('modal-win').innerHTML=`<h2>エリツィンの主攻撃 · ${T.nm.toUpperCase()}</h2><div class="sub">${T.warn}<br><br>攻撃は今夜、一か所に集中し、深刻な打撃となります：${fxText(T.hit(S))||T.e}${T.e&&fxText(T.hit(S))?' · <span class="n">'+T.e+'</span>':''}。<br><br>対処法：<b style="color:var(--paper)">${T.guard}</b>。${ok?'<span class="p">今日はすでに対処済みです。</span>':'<span class="n">まだ対処していません。</span>'}${S.flags.shield?'<br>醜聞の暴露が効いています：攻撃が通っても威力は半分です。':'<br>「放送」画面の「政府の醜聞を暴く」キャンペーンで、攻撃の威力を半分にできます。'}</div><div class="close">ESC：閉じる</div>`;
  $('modal').classList.add('on'); $('modal-win').querySelector('.close').onclick=closeModal;}

function openHelp(){
  const LD=legDrift(S);
  const H=[['正統性','建物の外で命令が実行される確率（現在 '+Math.round(execChance('x')*100)+'%）、決議の効果倍率、イベントでの判定に影響します。上限はありませんが毎晩減っていき、70を超えると増える量は半分になります。現在の一晩の変化：'+LD.P.map(p=>p[1]+' '+sg(p[0])).join('、')+'、媒体 '+(pressLeg(S)?sg(pressLeg(S)):'0')+'。'],
   ['代議員','その人数こそが議会の権限の裏付けです。1日に5人去るごとに正統性が1下がります。危機フェーズでは消耗戦となり、毎晩誰かが去ります。包囲網、停電、エリツィンの「保証」の後は離脱が増え、決意と会派の忠誠度が離脱を抑えます。'+QUORUM+'人を下回ると定足数割れとなり、正統性が毎晩−3。'],
   ['市民','人手です。ピケ、輸送隊、バリケード、消火に使います。危機フェーズで'+PERIM+'人を下回ると外周を守る者がいなくなり、決意が毎晩−2。2500人以上いるとクレムリンは突入をためらいますが、群衆は補給を食いつぶし、過激化を進めます。'],
   ['義勇兵','武器を持った人々です。突入時に入口を守り、200人以上で決意を高め、武力による選択肢を開きます。'],
   ['武器','銃器です。武装した人は義勇兵の戦闘員となり、武器を手元に置き続けます。在庫は減りませんが、空いている武器が減ります。'],
   ['放送','唯一のメディア通貨です。味方の媒体から毎晩入ってきます。編集部への働きかけ、キャンペーン、新聞への反論に使い、正統性、モスクワ、会派の忠誠度に換わります。'],
   ['補給','食料と軽油が何日分あるかです。ゼロになると人々が去り、決意が下がります。'],
   ['モスクワ','街の空気です。人の流入、正統性、突入の速さに影響します。「放送」画面で争います。'],
   ['決意','建物内の結束です。45%を下回ると代議員の離脱が速まります。ゼロになると終わりです。'],
   ['過激化','緊張の度合いです。武力による選択肢を開き、交渉の道を閉ざします。60%以上ではクレムリンの攻撃が強まります。'],
   ['地図上の勢力','最高会議とクレムリンの綱引きです。65%以上ならその勢力は毎晩あなたに有利に、35%以下ならクレムリンに有利に働きます。クレムリンは毎晩すべての勢力を自陣へ引き寄せ、2〜3日に1度はエリツィンがそのうち1つに本格的な攻撃をかけます。朝刊が予告します。'],
   ['包囲網','建物を囲む封鎖線（0〜100）です。存在する間は毎晩、正統性、決意、放送、補給を削り、代議員を去らせます。50を下回ると圧力は弱まります。耐えて代価を払う（伝令、2倍の配給、夜間の荷運び）か、少しずつ解除するかを選べます。地図上の「封鎖」画面から操作します。']];
  $('modal-win').innerHTML='<h2>指標：何が何に影響するか</h2>'+H.map(h=>`<div class="hlp"><b>${h[0]}</b><span>${h[1]}</span></div>`).join('')+'<div class="close">ESC：閉じる</div>';
  $('modal').classList.add('on'); $('modal-win').querySelector('.close').onclick=closeModal;
}
function closeModal(){ $('modal-win').classList.remove('wide'); $('modal-win').classList.remove('full'); if(S&&S.A&&S.A.card&&screen==='assault')return; $('modal').classList.remove('on');}
function openChron(){
  const c=(S&&S.chron&&S.chron.length?S.chron:store.get(CHRON))||[];
  $('modal-win').innerHTML=`<h2>出来事の年代記</h2><div class="sub">直近のプレイでの決断。</div><div class="chron">`+
   (c.length?c.map(x=>`<div><b>${x.date}</b> ${x.h}：${x.ch}</div>`).join(''):'<div>まだ何もありません。新しいゲームを始めてください。</div>')+`</div><div class="close">ESC：閉じる</div>`;
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
  slot.innerHTML=`<div class="toast"><div class="h">${dateStr(S.day).toUpperCase()}にかけての夜 · ${S.phase===1?'クレムリンの動き':'クレムリンの反撃'}</div><div class="b">`+
    (k.moves||[]).slice().sort((a,b)=>(b.y||0)-(a.y||0)).map(m=>`<div class="km${m.g?' g':''}${m.y?' y':''}"><span class="c">${m.c}</span><div>${m.t}<br><span class="e">${m.e}</span></div></div>`).join('')+
    `${k.n?`<div class="nt"><b>あなたの夜：</b> ${k.n}</div>`:''}</div><div class="x">クリックで閉じる</div></div>`;
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
  if(S.cordon){S.hold=S.hold||{}; const paid=[]; for(const H of HOLDS){ if(!S.hold[H.id])continue; if(H.can(S)!==true){S.hold[H.id]=0; notes.push('支払えない：「'+H.t+'」を中止');} else{apply(H.cost);paid.push(H.t);} } if(paid.length)notes.push('夜間の支払い：'+paid.join('、')); if(RP.med)S.med=Math.max(0,S.med+RP.med);}
  if(S.phase===2)S.sup=Math.max(0,S.sup-((.5+RP.sup)+S.ppl/5000)*(S.flags.ration?.5:1)+(S.flags.tunnel?.5:0));
  S.sup+=whYield(S).sup;
  if(S.sup<1){S.hope=clamp(S.hope-8,0,100);S.ppl=Math.round(S.ppl*.9);S.mil=Math.round(S.mil*.95);log('館内に食料がない。人々が去っていく。','bad');}
  // the perimeter needs hands: too few people and the House feels abandoned
  if(S.phase===2&&S.ppl<PERIM){S.hope=clamp(S.hope-2,0,100);notes.push('市民が'+PERIM+'人を下回り、外周を守る者がいない：決意 −2');}
  if(S.flags.gap>0){S.flags.gap--; notes.push(S.flags.gap?'封鎖線の抜け道はまだ使える':'封鎖線の抜け道がふさがれた：鉄条網が三重に張られた');}
  // people come and go
  const inflow=shut?Math.max(0,(S.city-55)*4):Math.max(0,Math.round((S.hope-40)*1+(S.city-40)*(S.phase===1?2:4)));
  S.ppl=Math.max(0,S.ppl+inflow-Math.round(S.ppl*(shut?.08:S.phase===2?.06:.03)));
  // rooms of the White House
  const LD=legDrift(S), dh=whYield(S).hope;
  S.leg=clamp(S.leg+LD.v,0,100);
  if(LD.v)notes.push('一夜の正統性 '+sg(LD.v)+'：'+LD.P.map(p=>p[1]+' '+sg(p[0])).join('、'));
  if(dh)notes.push('大会の活動：決意 +'+dh);
  // media: income from channels; without a voice the Kremlin owns the air
  const dc=cityShift(), inc=mediaGain(); S.med+=inc; S.city=clamp(S.city+dc,0,100);
  if(dc)notes.push('モスクワをめぐる攻防：'+sg(dc));
  if(S.flags.komp>0)S.flags.komp--;
  if(S.mil>=400)S.rad=clamp(S.rad+1,0,100);
  if(S.phase===2){const o0=S.omon==null?100:S.omon; let o=o0+4; if(S.pts.mer>=65)o-=4; if(S.city>=60)o-=2; S.omon=clamp(o,0,100); if(o0<100&&S.omon>o0)notes.push('OMONに特別手当が出た：戦意 '+S.omon+'%');}
  // resolve is the unity of the House: when it cracks, deputies walk out
  if(S.phase===2&&S.hope<45){let out=Math.round((45-S.hope)/5)+2, o0=out; for(const id of ['kol','sm','agr','ros']){const f=S.fac[id],k=Math.min(f.n,out);f.n-=k;out-=k;if(f.n<4){f.n=0;f.room=null;} if(!out)break;} notes.push('分裂：代議員'+(o0-out)+'人が去った');}
  S.hope=clamp(S.hope-(S.phase===2?4:1)-(S.sup<3?1:0)+RP.hope+dh,0,100);
  if(S.cordon){S.rad=clamp(S.rad+2,0,100); S.ring=Math.min(100,(S.ring==null?100:S.ring)+2);}
  if(S.phase===2)S.pr=clamp(S.pr+prRate(),0,100);
  // the Kremlin slowly pulls everyone to its side
  for(const p of POINTS)if(!p.fixed&&S.pts[p.id]<100)S.pts[p.id]=clamp(S.pts[p.id]-(S.phase===1?1:(p.id==='mo'||p.id==='gs')?3:2),0,100);
  // канат: сила, которая стоит у одного из полюсов, каждую ночь работает на него
  {let tf={},rg=0;const tn=[]; for(const id in POINT_TUG){const sd=tugSide(S.pts[id]),T=sd&&POINT_TUG[id][sd]; if(!T||(T.ph&&S.phase<T.ph))continue; tf=merge(tf,T.fx); if(T.ring&&S.cordon)rg+=T.ring; tn.push(POINTS.find(p=>p.id===id).nm.replace(/ ↑.*/,'')+': '+T.t);}
   if(tn.length){apply(tf); if(rg&&S.ring!=null){S.ring=Math.max(0,S.ring-rg);} notes.push('夜間の勢力の動き：'+tn.join('／'));}}
  // factions
  // darkness and cold: no power wears the House down; generators burn supplies instead
  if(S.flags.noPower&&S.flags.gen&&S.sup>0)S.flags.noPower=0;
  if(S.phase===2&&S.flags.noPower){S.hope=clamp(S.hope-2,0,100);notes.push('電気も水もない：決意 −2');}
  else if(S.phase===2&&S.flags.gen){S.sup=Math.max(0,S.sup-.25);notes.push('発電機が軽油を消費：補給 −0.25日'); if(S.sup<=0){S.flags.noPower=1;S.flags.gen=0;notes.push('軽油が尽きた：明かりが消えた');}}
  let fb={}, fbn=0;
  for(const F of FACTIONS){const b=facBonus(S,F); if(b&&b.on){fb=merge(fb,b.fx);fbn++;}}
  if(fbn){apply(fb); S.sup=Math.max(0,S.sup); const t=fxText(fb); if(t)notes.push('会派：'+t.replace(/<[^>]+>/g,''));}
  // deputies come back to a Congress that looks alive
  if(S.phase===2&&S.leg>=60&&S.hope>=65&&(!S.cordon||S.flags.tunnel||S.flags.gap>0||S.city>=55)){const F0=FACTIONS.find(x=>x.id==='kol'),k=Math.min(F0.n-S.fac.kol.n,2+Math.floor(Math.random()*4)); if(k>0){S.fac.kol.n+=k; notes.push('去っていた代議員'+k+'人が選挙区から戻った：大会は健在と見られている');}}
  for(const k in S.uses||{})if(S.day%2===0&&S.uses[k]>0&&!S.used[k])S.uses[k]--;
  for(const F of FACTIONS){const f=S.fac[F.id]; if(f.n<=0)continue;
    if(S.hope<40&&Math.random()<.5)f.loy=Math.max(0,f.loy-1);
    if(f.loy<=3&&S.phase===2){const out=Math.max(2,Math.round(f.n*.1));f.n=Math.max(0,f.n-out);if(f.n<4)f.n=0;
      notes.push(`${F.nm.replace(/"/g,'')}：${out}人が去った`); if(f.n===0)f.room=null;}
  }
  // до указа нелояльные тоже разъезжаются: «в округ, к избирателям»
  if(S.phase===1)for(const F of FACTIONS){const f=S.fac[F.id]; if(F.kind==='dep'&&f.n>4&&f.loy<=3){const o=1+Math.floor(Math.random()*3);f.n-=o;notes.push(F.nm.replace(/"/g,'')+'：'+o+'人が「選挙区へ」去った');}}
  // измор: в кризис каждую ночь кто-то уходит; сначала те, кто меньше всех верит
  if(S.phase===2){const why=[]; let k=3+Math.floor(Math.random()*4);
    if(S.cordon&&RP.dep){k+=RP.dep;why.push('包囲網');} if(S.flags.noPower){k+=2;why.push('停電');} if(S.flags.bribe){k+=2;why.push('大統領の「保証」');}
    if(S.hope>=70)k-=2; if(S.laws.mandate)k-=2; if(S.leg>=60)k-=1; k=Math.max(0,k);
    const L=FACTIONS.filter(F=>F.kind==='dep'&&S.fac[F.id].n>0&&S.fac[F.id].loy<8).sort((a,b)=>S.fac[a.id].loy-S.fac[b.id].loy); let left=k,gone=0;
    for(const F of L){const f=S.fac[F.id],q=Math.min(f.n,Math.ceil(left*(f.loy<=3?.6:.45)));f.n-=q;left-=q;gone+=q;if(left<=0)break;}
    if(gone)notes.push('消耗：一晩で代議員'+gone+'人が去った'+(why.length?'（'+why.join('、')+'）':''));}
  {const fd=facDrift(); if(fd.length)notes.push('会派：'+fd.join('、'));}
  // Kremlin answers: several moves a night, more as the stakes rise
  S.kdone=S.kdone||{};
  const nK=(S.phase===1?(S.pr>=10?2:1):2+(S.rad>=60||S.day>=15?1:0))-(S.flags.leak?1:0);
  const moves=[]; let kmed=0;
  for(let n=0;n<nK;n++){
    const opts=KREMLIN.filter(k=>!(S.flags.cam&&['挑発','つまずき','街頭'].includes(k.c))&&!moves.includes(k)&&!(k.once&&S.kdone[k.t])&&!(k.good&&moves.some(m=>m.good))).map(k=>({k,w:k.w(S)})).filter(o=>o.w>0);
    if(!opts.length)break; let r=Math.random()*opts.reduce((a,o)=>a+o.w,0); const k=(opts.find(o=>(r-=o.w)<0)||opts[0]).k; moves.push(k);}
  const rep=[];
  // главный удар Ельцина: объявлен утром, приходит ночью по одному месту
  let struck=false;
  if(S.strike){const T=STRIKES.find(x=>x.id===S.strike.id); struck=true;
    if(T.cover(S)){rep.push({t:T.okT,h:T.okH,e:'<span class="p">攻撃を撃退</span>',c:'エリツィン',g:1,y:1}); S.st.blk=(S.st.blk||0)+1;}
    else{const half=!!S.flags.shield; let fx=T.hit(S); if(half)fx=halve(fx); apply(fx); if(T.run)T.run(S,half); S.flags.shield=0; S.st.hit=(S.st.hit||0)+1; S.hope=clamp(S.hope-2,0,100); if(S.lastStrikeId==='mvd'||T.id==='mvd')S.omon=clamp((S.omon==null?100:S.omon)+10,0,100);
      rep.push({t:T.hitT+(half?'醜聞の暴露で勢いがそがれ、攻撃は半減した。':''),h:T.hitH,e:[fxText(fx),T.e?'<span class="n">'+T.e+'</span>':''].filter(Boolean).join(' · '),c:'エリツィン',y:1});}
    S.lastStrike=S.strike.id; S.strike=null;}
  // Ельцин лично
  if(!struck){S.ydone=S.ydone||{}; const y=YELTSIN.find((y,i)=>!S.ydone[i]&&y.ph===S.phase&&y.w(S)); if(y){S.ydone[YELTSIN.indexOf(y)]=1; apply(y.fx); if(/給与/.test(y.h))S.flags.bribe=1; if(y.run)y.run(S); rep.push({t:y.t,h:y.h,e:fxText(y.fx),c:'エリツィン',y:1}); moves.pop();}}
  // клеймо: пока РНЕ в здании, либеральная пресса бьёт каждую ночь и всё сильнее
  if(S.phase===2){const b0=S.flags.brand||0; if(S.fac.rne.n>0){S.flags.rneWas=1;const b=Math.min(3,b0+1);S.flags.brand=b;const fx={city:-b,leg:b>=3?-2:b>=2?-1:0};apply(fx);const T=BRAND_T[b-1];rep.push({t:T[S.day%T.length],e:fxText(fx),c:'烙印'});}
    else{ if(b0>0)S.flags.brand=b0-1; if(S.rad>=60){apply({city:-1});rep.push({t:'新聞はホワイトハウスの「赤褐色勢力」について書き立てている。発砲をめぐる話が多すぎるのだ。',e:fxText({city:-1}),c:'烙印'});}}}
  // издания работают каждую ночь на того, чьё они; в газету попадают самые громкие, остальное одной строкой
  {const agg={vs:{},kr:{}},L=[]; for(const o of OUTLETS){const sd=outSt(S,o),e=sd==='vs'?o.pas:sd==='kr'?o.kpas:null; if(!e)continue; apply(e.fx); agg[sd]=merge(agg[sd],e.fx); L.push({sd,e:S.phase===1&&e.t1?{...e,t:e.t1}:e});}
   const sh=a=>a.sort(()=>Math.random()-.5), tx=f=>fxText(f).replace(/<[^>]+>/g,'');
   for(const x of sh(L.filter(x=>x.sd==='vs')).slice(0,1))rep.push({t:x.e.t,e:fxText(x.e.fx),c:'味方の報道',g:1});
   for(const x of sh(L.filter(x=>x.sd==='kr')).slice(0,S.phase===2?2:1))rep.push({t:x.e.t,e:fxText(x.e.fx),c:'敵側の報道'});
   if(tx(agg.vs))notes.push('味方媒体の一夜の効果：'+tx(agg.vs)); if(tx(agg.kr))notes.push('クレムリン側媒体の一夜の効果：'+tx(agg.kr));}
  if(S.flags.leak)rep.push({t:'リークが功を奏した：クレムリンの一手が事前に察知され、阻止された。',e:'',c:'味方の報道',g:1}); if(S.flags.cam)rep.push({t:'カメラが一晩中封鎖線のそばに張りついた。挑発は起きなかった。',e:'',c:'味方の報道',g:1}); S.flags.leak=0;S.flags.cam=0;
  for(const k0 of moves){const k=k0.tf?Object.assign({},k0,{t:k0.tf(S)}):k0; if(!k.t)continue; const fx=merge(k.fx,k.dyn?k.dyn(S):{}); apply(fx); if(k0.tf){S.kmed=1;kmed=1;S.kmedT=k.t;} if(k.run)k.run(S); if(k.once)S.kdone[k.t]=1;
    if(fx.city<0||fx.med<0){kmed=1;S.kmedT=k.t;} rep.push({t:k.t,e:fxText(fx)||k.e||'',c:k.c,g:k.good?1:0});}
  if(Math.random()<(S.phase===1?.3:.45)){const pool=KCRISIS.filter(k=>!S.kdone[k.t]&&k.w(S)>0); const k=pool[Math.floor(Math.random()*pool.length)];
    if(k){apply(k.fx);S.kdone[k.t]=1;rep.push({t:k.t,e:fxText(k.fx),c:'クレムリンの内紛',g:1,kc:1});}}
  S.sup=Math.max(0,S.sup); S.kmed=kmed;
  S.day++; for(const m of rep)log(m.t,m.g?'':'kr','夜');
  // every deputy who walks out takes a piece of the mandate with him
  {const now=deputies(S), was=S.depPrev==null?now:S.depPrev, d=now-was; S.st=S.st||{};
   if(d<0){const h=Math.round(-d/5); S.leg=clamp(S.leg-h,0,100); S.st.depOut=(S.st.depOut||0)-d; notes.push('この一日で代議員'+(-d)+'人が去った'+(h?'：正統性 −'+h:''));}
   else if(d>0){const h=Math.floor(d/6); S.st.depIn=(S.st.depIn||0)+d; if(h){S.leg=clamp(S.leg+h,0,100);notes.push('代議員'+d+'人が戻った：正統性 +'+h);}}
   S.depPrev=now; S.depRate=Math.round(((S.depRate||0)+Math.max(0,-d))/2*10)/10; S.st.km=(S.st.km||0)+rep.length;}
  S.orders=S.flags.tapped?1:2; S.flags.tapped=0; S.used={}; S.appeals={}; S.did={}; S.away=0; if(S.day%2===1)S.lawCharges++;
  syncRing(); notes.sort((a,b)=>(/^(消耗|一夜の正統性|この一日で)/.test(b)?1:0)-(/^(消耗|一夜の正統性|この一日で)/.test(a)?1:0));
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
const PAPER_K={'エリツィン':'大統領','烙印':'ホワイトハウスにいるのは誰か','敵側の報道':'各紙の論調','味方の報道':'大会の声','クレムリンの内紛':'クレムリンに不穏な動き','軍・治安機関':'軍と警察','代議員':'代議員団','封鎖':'ホワイトハウス周辺','報道':'新聞と放送','中傷工作':'暴露記事','盗聴':'情報機関','挑発':'事件','街頭':'街の動き','地方':'地方','法令':'大統領令','資金':'カネ','圧力':'ホワイトハウス周辺','つまずき':'計画に狂い','噂':'うわさ','あなたの夜':'ホワイトハウスにて'};
const PAPER_PIC={'エリツィン':'yeltsin','烙印':'barkash','軍・治安機関':'grachev','代議員':'hasb','クレムリンの内紛':'yeltsin'};
const paperNorm=x=>x.replace(/[«»".,:!?…「」『』（）、。：！？・\s]/g,'').replace(/\s+/g,' ').trim().toUpperCase();
const paperBody=(m,h)=>paperNorm(m.t)===paperNorm(h)||paperNorm(m.t).indexOf(paperNorm(h).replace(/…$/,''))===0&&paperNorm(m.t).length-paperNorm(h).length<4?'':`<p>${m.t}</p>`;
function paperHead(t,max){max=Math.round(max*.75); let h=t.split(/[.!?。！？]/)[0].trim(); if(h.length>max){h=h.slice(0,max-1)+'…';} return h;}   // 日本語版：字数の上限は原作の4分の3（日本語は1字あたりの情報量が多い）
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
  if(lead.c==='烙印')R.push({t:'RNEを建物から追い出す',fx:{city:4,leg:2,hope:-4,rad:-5},run:()=>{S.fac.rne.n=0;S.flags.rneOut=1;S.flags.brand=Math.max(0,(S.flags.brand||0)-1);}});
  else if(lead.c==='エリツィン')R.push({t:'幹部会の決議で応じる',fx:{leg:2,hope:1,pr:2}});
  else if(lead.g)R.push({t:'この号を地方と部隊に配る',fx:{med:-4,leg:1,pts:{gs:1}},req:()=>S.med>=4||'放送4が必要'});
  else R.push({t:'最高会議幹部会の声明を出す',fx:{leg:1,hope:1,rad:1}});
  if(S.kremlin&&S.kremlin.moves.some(m=>m.kc))R.push({t:'クレムリンの醜聞をあおる',fx:{med:-5,city:2,pr:-3},e2:'エリツィンの次の主攻撃が半減',run:()=>{S.flags.shield=1;},req:()=>S.med>=5||'放送5が必要'});
  else if(!lead.g)R.push({t:'放送で反論する',fx:{med:-6,city:3},req:()=>S.flags.noComms?'通信途絶':S.med>=6||'放送6が必要'});
  R.push({t:'沈黙する',fx:{},e:'反論のないまま一日が始まる'}); return R;}
function showPaper(){const k=S.kremlin; if(!k){S.paper=0;return startDay();}
  show('paper'); Sfx.play('paper'); Sfx.play('teletype',.25);
  const vs=voiceOf(S,'vs'),kr=voiceOf(S,'kr'),nu=voiceOf(S,'neu'),tot=vs+kr+nu||1, ours=vs>kr;
  const items=k.moves.slice(); const ord=m=>ours?(m.g?0:m.y?1:2):(m.y?0:m.c==='烙印'?1:m.g?3:2); items.sort((a,b)=>ord(a)-ord(b));
  const lead=items.shift()||{t:'夜は静かに過ぎた。ホワイトハウスにも、クレムリンにも明かりがともっている。',e:'',c:'あなたの夜',g:1};
  {const kc=items.findIndex(m=>m.kc); if(kc>0)items.unshift(items.splice(kc,1)[0]);}
  const ST=S.strike&&STRIKES.find(x=>x.id===S.strike.id); if(ST)items.unshift({t:ST.warn,h:ST.warnH,e:'<span class="n">今夜、主攻撃あり</span>',c:'エリツィン'});
  const side2=lead.t.length<120&&items.length>3?items.shift():null, cols=items.splice(0,3), d=dateOf(S.day), WDN=['日曜日','月曜日','火曜日','水曜日','木曜日','金曜日','土曜日'];
  let brief=(k.notes||[]).concat(items.map(m=>m.t.replace(/[.。]$/,'')+(m.e?'（'+m.e.replace(/<[^>]+>/g,'')+'）':''))); {let n=0;brief=brief.filter(x=>(n+=x.length+3)<(side2?430:620));}
  k.lead=lead; k.rep=paperReplies(lead);
  $('np-sheet').innerHTML=`<div class="top"><span>第${180+S.day}号（通巻${1034+S.day}号）</span><span>日刊紙 · 1990年創刊</span><span>自由価格</span></div>
    <div class="mast">首都新報</div><div class="rule"></div>
    <div class="date"><span>1993年${dateStr(S.day)}（${WDN[d.getDay()]}）</span><span>モスクワ</span></div>
    <div class="kick">${PAPER_K[lead.c]||lead.c.toUpperCase()}${S.phase===2?' · 危機 '+(S.day-DECREE_DAY+1)+'日目':''}</div>
    <div class="h1">${lead.h||paperHead(lead.t,58)}</div>
    <div class="lead"><div><canvas class="ph" id="np-ph" width="220" height="110"></canvas></div>
      <div class="txt"><p>${false?`<span class="dc">${lead.t.charAt(0)}</span>${lead.t.slice(1)}`:lead.t}</p>${paperStamps(lead.e)}${side2?`<div class="s2"><div class="h2">${side2.h||paperHead(side2.t,44)}</div>${paperBody(side2,side2.h||paperHead(side2.t,44))}${paperStamps(side2.e)}</div>`:''}</div></div>
    <div class="cols">${cols.map(m=>`<div class="col">${m.kc?'<div class="kick" style="margin:0 0 4px">クレムリンに不穏な動き</div>':''}<div class="h2">${m.h||paperHead(m.t,40)}</div>${paperBody(m,m.h||paperHead(m.t,40))}${paperStamps(m.e)}</div>`).join('')}</div>
    ${brief.length?`<div class="brief"><b>短信</b> ${brief.join(' · ')}</div>`:''}`;
  paperPhoto(PAPER_PIC[lead.c]||(S.phase===2&&S.cordon?'whf':'wh'));
  const now={...snap(),hope:S.hope,rad:S.rad,city:S.city,pr:S.pr}, o=k.d0||now;
  const row=(nm,key,suf,inv)=>{const v=Math.round(now[key]*10)/10, dl=Math.round((now[key]-o[key])*10)/10; return `<div class="row"><span>${nm}</span><span><b>${fmt(v)}${suf||''}</b> ${dl?`<span class="${(dl>0)!==!!inv?'p':'n'}">${dl>0?'+':'−'}${fmt(Math.abs(dl))}</span>`:''}</span></div>`;};
  $('np-side').innerHTML=`<div class="day">朝 · ${S.day}日目</div><div class="big">朝刊</div>
    <div class="npw">今日の一面を書いているのは<b class="${ours?'v':''}">${ours?'最高会議側':'クレムリン側'}</b>の報道です。${ours?'味方の編集部が多いうちは、主要ニュースはこちらのものです。':'「放送」画面で編集部を引き込めば、見出しはこちらのものになります。'}</div>
    <div class="press"><i class="k" style="width:${kr/tot*100}%"></i><i class="n" style="width:${nu/tot*100}%"></i><i class="v" style="width:${vs/tot*100}%"></i></div>
    <div class="pl"><span>クレムリン側 ${kr}</span><span>沈黙 ${nu}</span><span>最高会議側 ${vs}</span></div>
    <div class="box"><div class="bt">一夜の結果</div>${row('正統性','leg')}${row('代議員','dep')}${row('市民','ppl')}${row('放送','med')}${row('補給','sup','日')}${row('決意','hope','%')}${row('過激化','rad','%',1)}${row('モスクワの支持','city','%')}</div>
    <div class="bt" style="margin-top:10px;margin-bottom:0">一面への応答</div>`+
    k.rep.map((r,i)=>{const st=r.req?r.req():true;return `<div class="ch${st!==true?' lock':''}" data-i="${i}"><span class="k">${i+1}</span><span>${r.t}</span><span class="e">${st!==true?`<span class="n">${st}</span>`:[fxText(r.fx),r.e2].filter(Boolean).join(' · ')||r.e||''}</span></div>`;}).join('')+
    `<div class="go" id="np-go"><span class="a">${S.day}日目を始める</span><span class="b">ENTER</span></div>`;
  if(ST){const w=$('np-side').querySelector('.npw'); w.className='strk'; w.innerHTML=`<b>今夜のエリツィンの主攻撃：${ST.nm.toUpperCase()}</b>対処法：${ST.guard}。対処しなければ深刻な打撃を受けます。${S.flags.shield?'醜聞の暴露が効いています：威力は半分になります。':''}`;}
  $('np-side').querySelectorAll('.ch').forEach(e=>e.onclick=()=>paperGo(+e.dataset.i)); $('np-go').onclick=()=>paperGo(-1);
}
function paperGo(i){const k=S.kremlin; if(!k||screen!=='paper')return; const r=k.rep&&k.rep[i];
  if(r){if(r.req&&r.req()!==true)return; apply(r.fx); if(r.run)r.run(); if(r.fx&&Object.keys(r.fx).length)log('一面への応答：'+r.t+'。');}
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
    $('ev-cap-n').textContent='ボリス・エリツィン';$('ev-cap-r').textContent='ロシア連邦大統領';}
  else if(pic==='tank'){ TitleArt.onReady(()=>drawTankShot(c));
    $('ev-cap-n').textContent='ノヴォアルバーツキー橋';$('ev-cap-r').textContent='戦車がホワイトハウスを砲撃';}
  else if(pic==='ost'){ drawOstankino(c);
    $('ev-cap-n').textContent='オスタンキノ';$('ev-cap-r').textContent='テレビセンター（アカデミカ・コロリョーヴァ通り12番地）';}
  else{TitleArt.onReady(()=>c.drawImage(pic==='whf'?TitleArt.burning:TitleArt.calm,270,0,320,360,0,0,320,360));
    $('ev-cap-n').textContent='ホワイトハウス';$('ev-cap-r').textContent='ソヴィエト会館（クラスノプレスネンスカヤ河岸通り）';}
}
function showEvent(ev){
  evCur=ev; evSel=Math.max(0,ev.ch.findIndex(c=>!(c.req&&!c.req(S)))); show('event'); drawPhoto(ev.pic); Sfx.play(ev.end?(ev.win?'win':'lose'):ev.pic==='yeltsin'?'static':ev.urgent?'alarm':/grachev|kolesn|yerin/.test(ev.pic)?'phone':'paper');
  const tag=$('ev-tag'); tag.className='tag'+(ev.end?(ev.win?' win':' end'):''); tag.textContent=ev.end?(ev.win?'勝利':ev.tier==='neu'?'引き分け · 勝者なき危機':'敗北'):ev.tag||'出来事';
  $('ev-hud').innerHTML=`<span><b>${S.day}</b>日目</span><span>正統性 <b>${S.leg}</b></span><span>決意 <b>${S.hope}%</b></span><span>過激化 <b>${S.rad}%</b></span>`;
  $('ev-meta').textContent='1993年'+dateStr(S.day)+(ev.time?' · '+ev.time:'');
  $('ev-meta2').textContent=ev.urgent?'緊急':'';
  $('ev-h').textContent=ev.h; $('ev-q').textContent=ev.q||''; $('ev-p').textContent=ev.p; $('ev-res').innerHTML='';
  renderChoices();
}
function renderChoices(){
  $('ev-ch').innerHTML=evCur.ch.map((c,i)=>{const fx=c.fx?fxText(merge(c.fx,c.fac?{fac:c.fac}:{})):'';
    let e=[fx,typeof c.e==='function'?c.e(S):c.e].filter(Boolean).join(' · ');
    const lk=c.req&&!c.req(S); if(lk)e='<span class="n">必要：'+c.rq+'</span>'; else if(c.rq)e=[e,'<span class="p">条件達成：'+c.rq+'</span>'].filter(Boolean).join(' · ');
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
  log(ev.h+'：'+c.t+'。');
  if(checkLose())return;
  nextEvent();
}

// ---------- assault intro and endings ----------
function ASSAULT(){return {id:'assault',pic:unitStance(UNITS.find(u=>u.id==='tanks'))==='refuse'?'whf':'tank',time:'07:00',urgent:1,tag:'フェーズ3 · 突入',h:'突入',q:'ノヴォアルバーツキー橋に戦車',
  p:(S.flags.corner==='army'?'軍がクレムリンの手を離れつつある。国防省と参謀本部はほぼ公然と大会側についた。明日になれば突入させる部隊がいなくなると悟ったエリツィンは、まだ命令に従う者たちに今日のうちに命令を下す。':S.flags.corner==='elect'?'憲法裁判所、地方、そしてモスクワが選挙を求めている。追い詰められたエリツィンは、命令がまだ通るうちに力で決着をつけようとする。部隊の足取りは重い。':'')+'夜明け、装甲車両がホワイトハウスへ向けて動き出した。軍や治安部隊のうち誰が命令に従い、誰が拒むかは、あなたが誰と話をつけておいたかにかかっている。防衛戦は1時間ごとに進み、夕方まで続く。',
  ch:[
    {t:'武器を取れ！　防衛につく',e:`戦闘員 ${fmt(S.mil)} · 非武装 ${fmt(S.ppl)} · バリケード ${S.bar}/5`,go:()=>startAssault()},
    {t:'安全の保証を得て人々を外に出す',e:'代議員は戦わずに投降する',go:()=>ending('surrender')},
  ]};}
const ENDINGS={
  win_army:{win:1,pic:'wh',h:'軍は人民とともに',q:'国防省と参謀本部が大会を支持',
    p:'軍管区司令官たちは大統領令第1400号の執行を拒んだ。議会に突入する者はいない。軍がなければ、クレムリンに打つ手はない。エリツィンは大統領の前倒し選挙に同意する。'},
  win_elect:{win:1,pic:'whf',h:'選挙',q:'突入を撃退、クレムリンは後退',
    p:'エリツィンは力で決着をつけようとして失敗した。憲法裁判所も地方議会も報道も、大統領令は違法だと口をそろえる。クレムリンは封鎖を解き、大会の条件での同時選挙に同意する。'},
  elect_deal:{tier:'neu',pic:'wh',h:'ゼロ・オプション',q:'突入ではなく選挙',
    p:'銃撃戦には至らなかった。憲法裁判所、地方、報道が両陣営を引き下がらせた。大統領令第1400号は撤回され、大会の決定も取り消され、同時選挙が決まった。最高会議は選挙までもちこたえたが、これは勝利ではない。選挙ではテレビも資金も選挙管理委員会もクレムリンが握っており、新しい議会法はもはやあなた抜きで書かれた。最高会議がかつての役割を取り戻すことはない。'},
  held:{win:1,pic:'whf',h:'持ちこたえた',q:'突入は頓挫した',
    p:'ホワイトハウスは燃えているが、入口は守り抜いた。夕方までに数万人のモスクワ市民が建物に集まってくる。クレムリンは停戦を宣言する。'},
  held_iso:{tier:'neu',pic:'whf',h:'撃退、しかし孤立',q:'突入は退けたが、誰も認めない',
    p:'入口は守り抜いた。だが国民がテレビで目にしたのは自動小銃を持った男たちだけで、耳にしたのは報復の呼びかけだけだった。地方は沈黙し、西側は反乱を口にし、モスクワ市民は河岸通りに近寄ろうとしない。クレムリンは部隊を下げて様子をうかがっている。大会は焼け焦げた建物に居座るが、それを権力と認める者はいない。勝者はどこにもいない。'},
  pyrrhic:{tier:'neu',pic:'whf',h:'クレムリンのピュロスの勝利',q:'建物は落ちたが、権力は保てず',
    p:'ホワイトハウスは制圧されたが、国民は議会が砲撃されるのを見た。一部の部隊は命令に従わず、地方と憲法裁判所は大統領令を認めない。エリツィンはクレムリンにいながら統治できない。彼の命令は実行されないまま戻ってくる。この先に待つのは二重権力と駆け引きの数か月であり、そこでは双方とも敗者だ。'},
  draw_alpha:{tier:'neu',pic:'wh',h:'「アルファ」は撃たない',q:'特殊部隊が突入を拒み、自ら人々を連れ出した',
    p:'「アルファ」の将校たちは丸腰で建物に入り、カメラの前で、議会への発砲命令には従わないと述べた。代議員と守備隊は彼らの保証のもとで外に出た。ホワイトハウスは失われたが、大統領の命令は彼自身の特殊部隊によって公然と拒まれた。エリツィンはもはや指揮をとれず、大統領令第1400号が何だったのか、誰の目にも明らかだ。大会も消えた。国は勝者のいない長い危機に入っていく。'},
  fell:{pic:'whf',h:'10月4日',q:'ホワイトハウス炎上',
    p:'突入部隊が建物になだれ込んだ。夕方、守備隊は護送されて出てくる。最高会議は消滅した。'},
  broken:{pic:'whf',h:'砲火やむ',q:'守備隊は武器を置いた',
    p:'戦車の砲撃のあと、もう持ちこたえる者はいない。人々は白いシーツを掲げて玄関から出てくる。大会は解散させられた。'},
  surrender:{pic:'wh',h:'降伏',q:'代議員が建物を後にする',
    p:'仲介者の保証のもと、守備隊は武器を引き渡してバスへ向かう。流血は少なくて済んだが、大会はもう存在しない。'},
  surrender_alpha:{pic:'whf',h:'「アルファ」の保証のもとで',q:'将校たちが燃える建物から人々を連れ出した',
    p:'「アルファ」は突入を拒み、自ら代議員と守備隊を封鎖線の外へ連れ出した。もっと血が流れていてもおかしくなかった。最高会議はもう存在しない。'},
  lose_hope:{pic:'wh',h:'散り散りに',q:'守備隊はバリケードを去った',
    p:'寒さと飢えと先の見えない不安が、じわじわと効いた。ホワイトハウスは一発の銃声もなく空になっていく。大統領令第1400号が発効する。'},
  lose_leg:{pic:'yeltsin',h:'大会の崩壊',q:'もはや誰も最高会議を信じない',
    p:'地方は大統領令を受け入れ、代議員は次々と代議員資格を返上していく。クレムリンには突入の必要すらない。'},
  lose_ppl:{pic:'wh',h:'無人のバリケード',q:'ホワイトハウスを守る者はいない',
    p:'最後の志願者たちも去った。夜、OMONは難なく建物を占拠する。'},
};
// условия выборов без штурма (нужны все)
function dealScore(){const mine=OUTLETS.filter(o=>outSt(S,o)==='vs').length, kr=OUTLETS.filter(o=>outSt(S,o)==='kr').length, ci=ACTIONS.kre.findIndex(a=>/^憲法裁判所に提訴/.test(a.t));
  return [[(S.flags.zero||0)>=1,'ゼロ・オプションを採択済み'],[!!(S.once&&S.once['kre'+ci]),'憲法裁判所に提訴済み'],[mine>=10&&kr<=4,'味方の媒体10以上、クレムリン側4以下（現在 '+mine+' と '+kr+'）'],
    [S.leg>=85,'正統性85以上（現在 '+S.leg+'）'],[S.city>=80,'モスクワ80%以上（現在 '+S.city+'%）'],[S.pts.mo>=50||S.pts.gs>=50,'国防省か参謀本部が50%以上'],[S.rad<40&&S.fac.rne.n<=0,'過激化40未満、館内にRNEがいない'],[S.day>=18,'10月1日以降']];}
function checkLose(){
  if(S.phase===1){S.hope=Math.max(S.hope,10);S.leg=Math.max(S.leg,10);return false;}
  if(S.hope<=0){ending('lose_hope');return true;}
  if(S.leg<=0){ending('lose_leg');return true;}
  if(S.phase===2&&S.ppl+S.mil<=0){ending('lose_ppl');return true;}
  return false;
}
// три яруса исходов: победа, нейтральный (здание потеряно, но Ельцин политически надломлен), поражение
const endTier=id=>{const E=ENDINGS[id]||{};return E.win?'win':E.tier||'lose';};
function drawScore(){const A=S.A||{units:[],air:0}; return [[S.leg>=50,'正統性50以上（現在 '+S.leg+'）'],[(A.air||0)>=50,'放送50以上（現在 '+Math.round(A.air||0)+'）'],[A.units.some(u=>u.id!=='alpha'&&(u.st==='refuse'||u.st==='stopped')),'1部隊以上が拒否または停止'],[S.city>=55,'モスクワ55%以上（現在 '+S.city+'%）']];}
function ending(id,exact){
  if(exact);
  else if((id==='fell'||id==='broken')&&drawScore().filter(x=>x[0]).length>=3)id='pyrrhic';
  if(!exact&&id==='held'&&S.flags.corner)id=S.flags.corner==='army'?'win_army':'win_elect';
  if(!exact&&id==='held'&&(S.rad>=70||(S.leg<35&&S.A&&S.A.air<30)||(S.A&&S.A.air<50&&(S.A.lost||0)+S.A.units.reduce((x,u)=>x+(u.lost||0),0)>=1500)))id='held_iso'; // без прессы или ценой большой крови без камер // кучка радикалов без прессы: отбились, но никто не признал
  const E={...ENDINGS[id]}; if(id==='fell')E.h=dateStr(S.day).toUpperCase(); if(S.A)S.A.card=0; $('modal').classList.remove('on');
  store.del(SAVE); store.set(CHRON,S.chron);
  S.endId=id; if(typeof aBanQ!=='undefined')aBanQ=[]; if(typeof achEnd==='function')achEnd(id); {const bn=$('a-banner'); if(bn)bn.className='';} stat('end-'+({win:'win',neu:'neutral'}[endTier(id)]||'lose')+'-'+id.replace(/_/g,'-'));
  showEvent({...E,tier:endTier(id),id:'end',end:1,time:'',urgent:0,ch:[
    {t:'それぞれのその後',go:()=>showEpi(0)},
    {t:'数字で見る結果',go:()=>openFinal()},
    {t:'最初からやり直す',go:()=>newGame()},
    {t:'メインメニューへ',go:()=>{show('title');renderMenu();}},
  ]});
  $('ev-res').textContent=`持ちこたえた日数：${S.day}。下した決断：${S.chron.length}。`;
}

// ===== эпилог: слайды «что стало с каждым». Гипотетические судьбы зависят от исхода, лояльности фракции, того, на чьей стороне была сила, и решений партии =====
// фракции: [ушли до конца, победа+верны, победа+колебались, поражение+верны, поражение+колебались]
const EPI_FAC={
  ros:['会派「ロシア」は地方のソヴィエトを糾合しようと各地へ散り、結末に間に合わなかった。バブーリンは後に、仲間たちは去るのが早すぎたと語った。同じことを人から言われても、反論はしなかった。',
       'バブーリンは新憲法起草委員会の委員長に就いた。包囲下の建物で決議を書いていた会派「ロシア」の法律家たちが、今度は国の基本法を起草している。その草案では、議会が大統領より強い権限を持つ。',
       '会派「ロシア」は勝利した大会に残ったが、その票を得るために説得を重ねねばならなかった日々を、誰も忘れてはいない。バブーリンは憲法委員会に迎えられたが、委員長ではなく副委員長としてだった。',
       'バブーリンは最後に建物を出た者の一人で、近くのスタジアムのそばで殴打された。12月、オムスクの有権者は再び彼を議員に選び、彼は国家院の演壇から、ホワイトハウスで語ったのと同じことを繰り返した。',
       '最後の数日、会派の面々はすでに一人ひとり抜け道を探していた。それでもバブーリンは建物を出るときに殴打された。12月、オムスクは彼を議会に送り返したが、今度は会派抜きだった。'],
  kr: ['「ロシアの共産主義者」は決着を待たずに去った。ルイプキンは誰よりも早く政府と話をつけ、選挙に向けて党を守り抜いた。',
       '共産主義者たちは挙国一致政府で3つの大臣ポストを得た。人々をホワイトハウスへ連れ出した党細胞は、ひと秋のうちに国内で最もよく組織された勢力になった。',
       '共産主義者たちは大会に残ったが、大臣ポストは与えられなかった。どちらが勝つか、あまりに長く様子をうかがっていたからだ。ルイプキンは自分の最も得意なことに専念し、あらゆる陣営の間を取り持つ仲介役になった。',
       '会派は最後まで踏みとどまり、党は数週間にわたって活動を禁じられた。禁止は12月の選挙までに解かれた。ルイプキンは国家院に当選し、その初代議長になった。',
       '共産主義者たちは終わりの前日に建物を去り、それが手柄として認められた。党はすぐに選挙への参加を許された。ルイプキンは新しい国家院の議長になったが、ホワイトハウスを守った人々は彼と挨拶を交わさなくなった。'],
  agr:['農業派の代議員たちは、事態が決着する前に地元の州へ帰っていった。「収穫は待ってくれない」とラプシンは言った。',
       '「農業同盟」は、土地の自由売買を認めない自派の案どおりに、土地法を大会で通した。籠城中の建物にジャガイモを運び込んだソフホーズは、債務を帳消しにされた。',
       '農業派は残ったが、最後の日まで条件をめぐって駆け引きを続けた。土地法は妥協案で成立し、ラプシンが得たのは大臣のポストではなく委員長のポストだった。',
       'ラプシンは仲間とともに護送されて建物を出て、1か月後に農業党を立て直した。12月、党は国家院に議席を得て、ホワイトハウスを砲撃した者たちを相手に農村予算をめぐる駆け引きをした。',
       '農業派は、コルホーズには手を出さないという約束と引き換えに代議員資格を返上した。約束が守られたのは1年だった。農業党は国家院に議席を得て、政府の予算案に賛成票を投じた。'],
  otc:['会派「祖国」の軍人代議員たちは去り、軍管区との人脈も持ち去った。決定的な夜、各司令部に電話をかけられる者はもう誰もいなかった。',
       '「祖国」の将軍たちは勝者として国防省に戻った。タラソフは国防次官の椅子を手にし、真っ先に軍の削減を止めた。',
       '「祖国」は勝利までどうにか持ちこたえたが、軍管区への電話は本部が求めたよりも控えめだった。国防省で会派の将軍たちに与えられたのは、指揮する部隊のない執務室だった。',
       '「祖国」の将軍たちは、軍服着用の権利も認められないまま予備役に回された。タラソフは1年後に政界へ戻ったが、もはや肩章も会派もなかった。',
       '「祖国」は終わりの数日前に軍管区への電話をやめた。それでも将軍たちは軍を追われた。クレムリンが覚えていたのは、どう終わったかではなく、どう始まったかだった。'],
  sm: ['「スメナ」は誰よりも早くカメラの前に出て、エリツィンもハズブラートフも立候補しない選挙を提案した。その姿はひと晩だけ、全チャンネルで流された。',
       '「スメナ」は、恥じる必要のない勝利の顔になった。若い代議員たちが選挙をめぐる交渉にあたり、モスクワで勝ったのはバリケードではなく議会なのだと西側に説明した。',
       '「スメナ」は残ったが、最後までどちらの側にも扉を開けたままにしていた。選挙をめぐる交渉にゴロヴィンが呼ばれたのは、代表団長としてではなく顧問としてだった。',
       '会派はその週のうちに瓦解した。所属代議員は新しい政党に散り、ゴロヴィンはその後何年も、自分は大統領令にも発砲にも反対だったと説明し続けた。',
       '「スメナ」は決着より早く、白旗を掲げて建物を出た。クレムリンは礼を言ったが、有権者は許さなかった。12月の選挙で、会派から当選した者はほとんどいなかった。'],
  kol:['態度未定の代議員たちは一人また一人と去った。大統領令は一人ひとりに役職と1年分の給与を約束しており、ほぼ全員がそれを手にした。',
       '態度未定の代議員たちは残り、のちに「一瞬たりとも迷わなかった」と語った。アブドゥラチポフは地方との調停委員会を率い、まさに適任であることを示した。',
       '態度未定の代議員たちは、出口をうかがいながら勝利まで居残った。そのことは忘れられなかった。新しい大会では、もう誰も彼らの票を最初から計算に入れなかった。',
       '彼らは最後まで残り、自分たちでもそれに驚いた。役職はもう提示されなかった。それでもアブドゥラチポフは数か月後、新しい議会の上院に席を得ていた。',
       '彼らはクレムリンから約束どおりの役職と補償を受け取った。アブドゥラチポフは連邦院の副議長になり、9月のことは思い出したがらなかった。'],
};
// силы: [победа+были за Совет, победа+были за Кремль или колебались, поражение+были за Совет, поражение+за Кремль]
const EPI_PT={
  mer:['ルシコフは時機を逃さず風向きを読み、頼まれる前に建物の電気を戻した。市長の座にはとどまったが、今ではモスクワ市議会が彼の予算を一行ずつ承認している。',
       'ルシコフは最後の日までホワイトハウスの電気と水を止め続けた。モスクワ市議会は勝利後の最初の決定で彼を解任した。2年後、彼は市政に返り咲いた。',
       '市庁舎は、クレムリンが我慢できる以上に長く迷い続けた。ルシコフは市長の座を守ったが、その代償はモスクワ市議会だった。市内の各議会は、ほかならぬ彼の命令で解散させられた。',
       'ルシコフは建物の電気・水道・下水を止め、そのことを一度も後悔しなかった。モスクワ市議会は解散され、彼は2010年まで市長の座にあった。'],
  smo:['アンピロフがスモレンスカヤ広場に集めた群衆はあまりに多く、警察は退いた。勝利の後、「勤労ロシア」は政府を裁判にかけろと要求し、大会は味方であるはずの彼らに、勝利は報復を意味しないと説いて聞かせねばならなかった。',
       'アンピロフは決着より前に街頭を奪い返されていた。大会の勝利を、彼は閉ざされた扉の前でメガホンを手に迎え、勝利は自分から盗まれたのだと考えた。',
       'アンピロフは最後まで広場を守り抜いた。3日後、彼はトゥーラ近郊の村で逮捕された。1994年2月に恩赦で釈放されると、彼は再び広場に戻った。',
       'スモレンスカヤ広場はひと晩で掃討された。アンピロフはトゥーラ近郊の村で捕らえられ、1994年2月に恩赦で釈放された。'],
  mo: ['グラチョフは、クレムリンが待っていた命令をついに出さなかった。それでも国防相の座にはとどまれなかった。大会が求めたのは即座に「ノー」と言った人物であって、2週間黙っていた人物ではなかった。',
       'グラチョフは命令を実行する用意があったが、命令は戦車まで届かなかった。彼は停戦の日に辞任し、あのとき軍は双方から裏切られたのだと生涯考え続けた。',
       'グラチョフは決断を引き延ばし、書面による命令を求めた。それを受け取ったのは明け方だった。エリツィンはこれを許さず、数か月後に国防相を更迭した。',
       'グラチョフは書面による命令を求め、それを受け取った。戦車は橋の上に進み出た。彼は1996年まで国防相の座にあった。'],
  gs: ['参謀本部はクレムリンに1個師団たりとも差し出さなかった。コレスニコフは新政権のもとでも参謀総長にとどまった。軍を兵営から出さなかった人物を替えようとする者はいなかった。',
       'コレスニコフは事の成り行きを見守り、その結末を見届けた。大会のもとでさらに半年勤めたのち、自ら職を退いた。',
       '参謀本部はできる限りの手で命令をサボタージュした。暗号電報は行方不明になり、車列はエンジンがかからなかった。それで突入を遅らせることはできたが、中止させることはできなかった。1年後、コレスニコフはひっそりと職を解かれた。',
       '参謀本部は熱意もなく、遅滞もなく命令を実行した。コレスニコフは1996年までその職にとどまった。'],
  mvd:['国内軍の将校たちは鉄条網の封鎖線に立つことを拒み、エリンは手足を失った内務相になった。彼は停戦の日に辞任した。',
       'エリンは最後の1時間まで封鎖線を維持した。大会の勝利後、彼は解任され、当時の命令について取り調べを受けた。だが裁判には至らなかった。',
       '内務省には、警備の持ち場を引き払い、見て見ぬふりをした将校たちがいた。彼らはその秋のうちに解任された。エリンはロシア連邦英雄の称号を受けた。',
       'OMONと国内軍は求められたとおりのことをした。エリンはロシア連邦英雄の称号を受け、辞任したのはようやく1995年、ブジョンノフスク事件のあとだった。'],
  ost:['オスタンキノは大会に放送枠を与え、国民は初めて包囲された建物の内側を目にした。ブラーギンは解任され、テレビセンターは議会の監督評議会の管理下に移った。',
       'オスタンキノは最後までクレムリンに都合のよいものを流し続けた。ブラーギンは勝利の翌日に解任され、テレビは大会の管理下に置かれた。',
       'オスタンキノには、代議員を放送に出す編集者たちがいた。真っ先に解雇されたのは彼らだった。ブラーギンも12月にクレムリンによって解任された。余計なものを放送に流しすぎたのだ。',
       'オスタンキノはこの間ずっとクレムリンの声であり続けた。それでもブラーギンは12月、政権にとって不本意な結果に終わった選挙のあとで解任された。'],
};
// ничья и «нулевой вариант»: [были верны, колебались]
const EPI_FAC_N={
  ros:['会派「ロシア」の法律家たちは最後の日まで決議を書き続け、そのどれひとつとして、のちに裁判所で覆されることはなかった。バブーリンは、譲りもせず勝ちもしなかった男として政界に残った。オムスクでは選挙のたびに彼が選ばれた。',
       '会派「ロシア」の面々は、最後の数日には一人ひとり抜け道を探していた。危機が勝者のないまま終わると、バブーリンは会派を立て直したが、かつての重みはもうなかった。'],
  kr: ['共産主義者たちは最後まで残り、誰も禁止に踏み切れなかった党を携えて危機を抜け出した。次の選挙では、クレムリンも大会も許さなかった人々の票を集めた。',
       '共産主義者たちはどちらが勝つかを計算していたが、結局どちらも勝たなかった。ルイプキンは真っ先に政府との交渉の席に着き、選挙に向けて党を守り抜いた。'],
  agr:['農業派は最後の日まで、包囲された建物に食料を届け続けた。土地法は元のまま残った。どちらの側にも、それを書き換えるだけの力がなかったからだ。ラプシンはこれを自分の最大の勝利と呼んだ。',
       '農業派は双方と取引をし、どちらにも借りを残さなかった。1か月後、ラプシンは農業党をまとめ上げ、選挙に臨んだ。'],
  otc:['「祖国」の将軍たちは最後の夜まで軍管区に電話をかけ続けた。軍に戻されることはなかったが、不名誉な形で追放する決断も下されなかった。あの電話を覚えている指揮官があまりに多かったからだ。',
       '「祖国」は本部が求めたよりも控えめにしか軍管区に電話をかけなかった。会派の将軍たちは静かに予備役に退いた。タラソフは1年後、肩章を外して政界に戻った。'],
  sm: ['「スメナ」は、互いに口をききたがらない者たち全員に代わって交渉にあたった。危機が勝者のないまま終わったとき、それこそが彼らの狙いだったとわかった。ゴロヴィンはあらゆる調停委員会に呼ばれた。',
       '「スメナ」はどちらの側にも扉を開けておき、開いたほうの扉をくぐった。所属代議員は新しい政党に散り、ゴロヴィンはその後も長いこと、自分はどちらの側にも反対だったと説明し続けた。'],
  kol:['態度未定の代議員たちは最後まで残り、自分たちでもそれに驚いた。アブドゥラチポフは地方との調停委員会を率いた。誰も勝たなかったとき、英雄よりも必要とされたのは仲介者だった。',
       '態度未定の代議員たちは結末を待ったが、はっきりした答えは出なかった。クレムリンが約束した役職を得られたのは一部だけだった。それでもアブドゥラチポフは新しい議会の上院に席を得た。'],
};
// ничья: [были за Совет, были за Кремль или колебались]
const EPI_PT_N={
  mer:['ルシコフはニュース次第で、建物の電気をつけてはまた消した。彼は市長の座にとどまった。国に勝者がいないとき、街を取り仕切る者はどちらの側にも必要なのだ。',
       'ルシコフはこの間ずっと、ホワイトハウスの電気と水を止めていた。危機が勝者のないまま終わると、モスクワ市議会は彼の辞任を要求したが、票が集まらなかった。彼はその後も長く市長の座にあった。'],
  smo:['アンピロフは最後までスモレンスカヤ広場を守り、代議員よりも街頭のほうが多くを成し遂げたと考えていた。「勤労ロシア」は政府を裁判にかけろと要求した。裁判は開かれず、集会は続いた。',
       'アンピロフは決着より前に街頭を奪い返されていた。彼は逮捕されず、メガホンも手放さなかった。あんな秋のあとで、彼を捕まえる理由はなかった。'],
  mo: ['グラチョフは、ついに軍をまるごとクレムリンに差し出すことはなかった。エリツィンはそれを許さず、大会は彼を信用しなかった。数か月後に国防相は交代させられ、双方がそれを自分の手柄とみなした。',
       'グラチョフは、実行すべき命令がある限りクレムリンの命令に従った。勝者のない結末のあとも国防相の座に残ったが、その軍はもう二度とモスクワに呼び出されたくないと思っていた。'],
  gs: ['参謀本部はできる限りの手で命令をサボタージュした。暗号電報は行方不明になり、車列はエンジンがかからなかった。コレスニコフはそのことで褒賞も処罰も受けなかった。さらに半年勤めたのち、自ら職を退いた。',
       '参謀本部は熱意もなく、遅滞もなく命令を実行した。コレスニコフはその職にとどまり、軍を去るまであの秋の話を避け続けた。'],
  mvd:['内務省には、警備の持ち場を引き払い、見て見ぬふりをした将校たちがいた。エリンは彼らを解任できなかった。決着があまりに危ういものだったからだ。エリン自身も1年後に辞任した。',
       'エリンは最後の1時間まで封鎖線を維持した。だがその功でロシア連邦英雄の称号を受けることはなかった。誰も勝たなかった秋の働きを表彰する決断を、クレムリンは下せなかった。'],
  ost:['オスタンキノは代議員に発言の場を与え、国民は包囲された建物の内側を目にした。ブラーギンは解任された。テレビセンターには監督評議会が置かれたが、そこではクレムリン側と議会側がその後1年にわたって互いの決定を阻み合った。',
       'オスタンキノは最後までクレムリンに都合のよいものを流し続けた。それでもブラーギンは解任された。国民がテレビを信じなかったことの責任を、誰かが負わねばならなかった。'],
};
// поражение без штурма («Разошлись», «Съезд распался», «Пустые баррикады», сдача до боя): замены для текстов, где упомянуты штурм и танки
const EPI_NOA={
  ros3:'バブーリンは、人の去っていく建物を最後に出た一人だった。12月、オムスクの有権者は再び彼を議員に選び、彼は国家院の演壇から、9月に語ったのと同じことを繰り返した。',
  ros4:'最後の数日、会派の面々は一人ひとり抜け道を探していた。12月、オムスクはバブーリンを議会に送り返した。ただし、それはもう別の議会だった。',
  agr3:'ラプシンは最後に仲間を連れて建物を去り、1か月後に農業党を立て直した。12月、党は国家院に議席を得て、農村予算をめぐる駆け引きをした。',
  mo2:'グラチョフは決断を引き延ばし、書面による命令を求めた。だが命令は必要なかった。ホワイトハウスはひとりでに空になった。エリツィンは国防相が待ったことを忘れず、数か月後に彼を更迭した。',
  mo3:'グラチョフは命令を実行する用意があった。戦車を出す必要はなかった。建物は一発の銃声もなく空になった。彼は1996年まで国防相の座にあった。',
  gs2:'参謀本部はできる限りの手で命令をサボタージュした。暗号電報は行方不明になり、車列はエンジンがかからなかった。それで足りたのかどうかは、確かめる機会がなかった。突入には至らなかったからだ。',
  gs3:'参謀本部は、熱意はなくとも遅滞なく命令を実行する構えだった。命令は必要なかった。コレスニコフは1996年までその職にとどまった。',
};
function epilogue(){
  const id=S.endId||'', K=id==='elect_deal'?'deal':endTier(id)==='neu'?'draw':/army/.test(id)?'army':id==='win_elect'?'elect':id==='held'?'held':/fell|broken/.test(id)?'fell':/surrender/.test(id)?'surr':'fade', win=K==='army'||K==='elect'||K==='held', neu=K==='deal'||K==='draw', noA=!win&&!neu&&!(S.A&&S.A.units);
  const L=[], add=(pic,h,q,p)=>L.push({pic,h,q,p});
  add(win?'wh':K==='fell'?'whf':'wh','エピローグ','それぞれのその後','ここから先は、実際には起こらなかったこと。あるいは、実際とは違う形で起きたこと。人々の運命を決めるのは、あなたの秋がどう終わったか、誰が最後まであなたと共にいたか、そして軍、警察、市庁舎、放送がどちらの側についたかだ。');
  add('hasb','ハズブラートフ','最高会議議長',{army:'ハズブラートフは、2週間ろうそくの灯りで過ごしたのと同じ議場で、政府の総辞職を受理した。繰り上げ選挙まで、彼は国のナンバー2であり続けた。いや、ナンバー1だと見る者も多かった。',
    deal:'ハズブラートフは「ゼロ・オプション」に署名し、選挙まで議長の座にとどまった。彼はこれを法の勝利と呼んだ。新しい法律のもとで選ばれた新議会には、もはやそれほどの権限を持つ議長は存在しなかった。',
    elect:'ハズブラートフは突入を退け、大統領と議会の同時選挙に同意した。自らは出馬しなかった。自分の務めは議会を守ることであって、再びその長になることではない、と彼は言った。',
    held:'ハズブラートフは焼け焦げた壁のそばで人々の前に姿を現し、停戦を宣言した。勝利は死者の名簿とともに彼の手に渡り、その名簿はその後、選挙のたびに彼に突きつけられた。',
    draw:S.endId==='held_iso'?'ハズブラートフは、封鎖線の内側でしか認められない議会の議長として残った。彼は過激派に黙れと迫ったが、マイクはもう彼の手にはなかった。':'ハズブラートフは自由の身で建物を出た。カメラがあれだけのものを映し出したあとで、議会の議長を逮捕する度胸はクレムリンになかった。彼は、大会は国内のどこの議場でも活動を続けると宣言した。すると地方が次々に、その議場を提供すると申し出た。',
    fell:'ハズブラートフは護送されて建物から連れ出され、レフォルトヴォ拘置所へ送られた。1994年2月26日、国家院の決議した恩赦で釈放され、プレハーノフ経済大学の教壇に戻った。',
    surr:'ハズブラートフは降伏の条件に署名し、代議員たちとともにバスへ向かった。レフォルトヴォ拘置所、1994年2月の恩赦、そしてプレハーノフ経済大学の教壇。',
    fade:'ハズブラートフは人の去っていく建物に、ほとんど一人で残った。逮捕すらされなかった。クレムリンにとっては、逮捕すべき者などいないと示すほうが重要だったのだ。彼は大学の教壇に戻った。'}[K]);
  add('rutskoy','ルツコイ','副大統領',K==='deal'?'ルツコイは、大統領令第1400号が撤回されたその日に、大統領代行の権限を返上した。彼はこの妥協を「双方そろっての降伏」と呼んだ。選挙には自ら出馬して敗れたが、3年後にクルスク州知事となった。':K==='draw'&&S.endId==='held_iso'?'ルツコイはホワイトハウスの中庭で、防衛にあたった者たちの閲兵を行った。彼の大統領令が効力を持ったのは、半径300メートルの範囲だけだった。その外には、クレムリンを爆撃せよという彼の呼びかけを忘れていない国が広がっていた。':K==='draw'?'ルツコイは最後に建物を出て、グリースも拭っていない自動小銃を記者たちに見せた。国の半分は彼を大統領代行とみなし、残る半分は反乱者とみなした。どちらもそれぞれに正しかった。結局、彼が裁かれることはなかった。':win?(S.rad>=60?'ルツコイは大統領代行として宣誓し、バルコニーで約束したことの半分を実行した。残る半分は投獄にかかわるもので、大会はそれを承認しなかった。':'ルツコイは繰り上げ選挙まで大統領代行を務め、大方の予想を裏切って、本当に選挙を実施した。'):
    (K==='fade'?'ルツコイは、大会のほかには誰も認めていなかった権限を自ら返上した。3年後、彼はクルスク州知事に選ばれた。':'ルツコイは最後に投降し、記者たちにグリースが付いたままの自動小銃を見せた。撃っていないという証しだった。レフォルトヴォに収監され、1994年2月に恩赦で出所した。1996年、彼はクルスク州知事に選ばれた。'));
  add('yeltsin','エリツィン','ロシア大統領',{army:'軍が命令に従わなかった時点で、すべては終わっていた。エリツィンは繰り上げ選挙に同意したが自らは出馬せず、本を書くためにバルヴィハの別荘へ去った。',
    deal:'エリツィンは大統領令第1400号を撤回し、それを「合意への一歩」と呼んだ。選挙までに彼は議会に関する法律を改め、テレビ局の首脳陣も入れ替えた。選挙には勝った。それがどこまで公正だったかは、今も議論が続いている。',
    elect:'エリツィンは「合意への一歩」と称して大統領令第1400号を撤回した。同時選挙には自ら立候補した。その結果がどうなったかは、このゲームにもわからない。',
    held:'突入は全世界の見守る前で頓挫した。エリツィンは停戦を宣言し、1週間後に選挙に同意した。発砲を命じた者たちの名を一人ひとり挙げたが、その中に自分の名はなかった。',
    draw:'エリツィンはクレムリンに残ったが、そこから出る命令はもう実行されなかった。軍管区は書面での確認を待ち、地方は税を手元に留め、憲法裁判所は大統領令第1400号をクーデターと呼んだ。数か月後、彼は繰り上げ選挙に同意し、自らは出馬しなかった。',
    fell:'エリツィンは12月まで大統領令で統治した。1993年12月12日、強い大統領と弱い議会を定めた新憲法が国民投票で採択された。この憲法は今も効力を持っている。',
    surr:'エリツィンは大きな戦闘なしに建物を手に入れ、それを自らの手柄とした。12月には彼の憲法が採択された。投降した者たちに与えられた保証が思い出されたのは、2月に国家院が恩赦を宣言したときだった。',
    fade:'クレムリンに突入は必要なかった。エリツィンは新しい議会の選挙に関する大統領令に署名し、12月には自らの憲法を国民投票で通した。'}[K]);
  for(const F of FACTIONS){ if(F.kind!=='dep')continue; const f=S.fac[F.id], T=EPI_FAC[F.id]; if(!T)continue; const gone=f.n<=0, loyal=f.loy>=6;
    add(FAC_WHO[F.id],F.nm.replace(/"/g,'「').replace(/「([^「]*)「/,'「$1」').toUpperCase(),gone?'決着前に去った':LOY[loyLvl(f.loy)].nm[0].toUpperCase()+LOY[loyLvl(f.loy)].nm.slice(1)+' · 残り'+f.n,gone?T[0]:neu?EPI_FAC_N[F.id][loyal?0:1]:win?T[loyal?1:2]:(noA&&EPI_NOA[F.id+(loyal?3:4)])||T[loyal?3:4]); }
  { const f=S.fac.rne, was=f.n>0||S.flags.rneWas;
    add('barkash','RNE',f.n>0?'最後まで建物に残った':was?'追い出されたか、自ら去った':'建物に入れてもらえなかった',
      neu?(f.n>0?'バルカショフ派は決着がつくまで建物に残り、武器を持ったまま去った。彼らが隊列を組む映像を、クレムリンは機会があるたびに流した。「こんな連中と交渉しろと言うのか」。大会はついに、この映像の汚名を拭い去れなかった。'
            :was?'決着の時には、RNEはもう建物にいなかった。バルカショフは裏切られたと語った。それでも守備側にはファシストのレッテルが貼られたが、なかなか定着しなかった。映し出せる者がいなかったからだ。'
            :'バルカショフは門前払いされた。ホワイトハウス前の写真に黒い制服は写っておらず、それがクレムリンが議会を反乱と断じられなかった理由の一つになった。')
      :noA?(f.n>0?'バルカショフ派は最後に、隊列を組み、武器を携えて建物を出た。その隊列の映像を、クレムリンは冬じゅう流し続けた。「中にいたのはこういう連中だ」。バルカショフは冬に逮捕され、2月に恩赦で釈放された。'
            :was?'最後の時点で、RNEはもう建物にいなかった。それでも守備側にはファシストのレッテルが貼られたが、効き目は薄かった。映し出せる者がいなかったからだ。'
            :'バルカショフは門前払いされた。議会の壁際の鉤十字をテレビで映せた者はいなかったが、それでホワイトハウスが救われることはなかった。')
      :f.n>0?(win?'バルカショフ派は20番玄関を守り抜き、勝利の分け前を要求した。拠点となる部屋、武器、大会警備の持ち場である。リベラル系の新聞は、その後10年にわたって載せ続けることになる写真を手に入れた。議会の階段に並ぶ黒い制服だ。RNEの武装解除は、新しい政権が自ら行わねばならなかった。'
                 :'バルカショフ派は玄関で誰よりも長く戦い、その後、武器を持ったまま地下道から脱出した。彼らが隊列を組む映像は、突入を正当化する最大の根拠になった。「あそこにはファシストがいた」。バルカショフは冬に逮捕され、2月に恩赦で釈放された。')
      :was?(win?'勝利したホワイトハウスにRNEはおらず、大会の勝利をファシストの勝利と呼べる者はいなかった。バルカショフは裏切られたと語った。1年後には、彼の組織が報じられるのは事件記事だけになっていた。'
              :'大会はRNEを追い出し、最精鋭の部隊を失った。バルカショフは部下を連れて去り、戦闘には加わらなかった。それでも守備側にはファシストのレッテルが貼られたが、効き目は薄かった。映し出せる者がいなかったからだ。')
      :(win?'バルカショフは門前払いされた。これはあの秋で最も安上がりな決断の一つとなった。写真に黒い制服が写っていなかったため、西側はその日のうちに議会の勝利を承認した。'
           :'バルカショフは門前払いされた。突入の日には訓練された戦闘員120人の不在が響いたが、その代わり、議会の壁際の鉤十字をテレビで映せた者はいなかった。')); }
  { const f=S.fac.so; add('terekh','「将校同盟」',f.n>0?'最後まで建物内に':'建物にいなかった',neu?(f.n>0?'テレホフの将校たちは最後の日まで建物の防衛を担った。クレムリンはテレホフを逮捕する勇気もなく、軍への復帰も拒んだ。「将校同盟」は結局、元のまま、軍人たちの政治サークルにとどまった。':'「将校同盟」は防衛に加わらなかった。テレホフは国防相の裁判を求めたかと思えば辞任を求め、どちらも実現しなかった。'):f.n>0?(win?'テレホフの将校たちは階級を回復されて軍に戻った。テレホフ本人は参謀本部に迎えられなかった。勝利した大会に必要なのは軍であって、軍の中の政治サークルではなかった。':'テレホフは逮捕され、取り調べで暴行を受けた。1994年2月に恩赦で出所し、今度は武器を持たずに「将校同盟」を再建した。')
      :(win?'「将校同盟」は防衛に加わらなかった。勝利の後、テレホフは国防省の粛清を求めたが、丁重に聞き流された。':'テレホフは独自に動き、決着を待たずに逮捕された。1994年2月の恩赦で自由は戻ったが、階級は戻らなかった。')); }
  for(const pid of ['mo','gs','mvd','mer','smo','ost']){ const P=POINTS.find(x=>x.id===pid), v=S.pts[pid], our=v>=(win||neu?50:60), W=PEOPLE[POINT_WHO[pid]];
    add(POINT_WHO[pid],W.nm.split(/[ ・]/).pop().toUpperCase(),P.nm.replace(/ ↑.*/,'')+' · 最終的に'+(v>=65?'最高会議側':v<=35?'クレムリン側':'態度未定')+' ('+v+'%)',neu?EPI_PT_N[pid][our?0:1]:win?EPI_PT[pid][our?0:1]:(noA&&EPI_NOA[pid+(our?2:3)])||EPI_PT[pid][our?2:3]); }
  // части Кремля: кто дошёл до конца, кто встал, кто не пошёл вовсе
  { const A=S.A, kWon=endTier(id)==='lose';
    if(!A||!A.units||false){ add('grachev','クレムリン側の部隊','突入はなかった',id==='elect_deal'?'モスクワに集められた部隊は環状道路で1週間待機したのち、駐屯地に戻った。兵士たちには、あれは演習だったと告げられた。':'発砲には至らなかった。部隊の車列は河岸通りでしばらく待機し、引き揚げた。もう制圧すべき相手はいなかった。'); }
    else{ const T={
      tanks:{who:'grachev',nm:'橋の上の戦車',sub:'カンテミロフスカヤ師団',
        refuse:'カンテミロフスカヤ師団の戦車兵は橋に出なかった。連隊長は国防相の書面による命令を求め、夕方までそれを待ち続けた。発砲を拒んだ将校たちは後にひっそりと解任されたが、裁判にかける勇気は誰にもなかった。',
        out:'戦車は橋に出たが、突入が終わる前に砲撃をやめた。乗員たちはエンジンを切り、カメラの前で車体の上に座っていた。ホワイトハウス前で沈黙する戦車の写真は、世界中の新聞に載った。',
        won:'戦車は最後まで上層階を砲撃し続けた。噂では、乗員たちには現金が支払われ、住宅が与えられたという。車内にいた将校たちの名を、国防省は長年明かさなかった。',
        lost:'戦車は日没まで建物を砲撃したが、建物は持ちこたえた。議会を砲撃した将校たちを新しい政権は裁かなかった。ただ、誰も彼らと握手しようとしなくなった。多くがその年のうちに軍を去った。'},
      taman:{who:POINT_WHO.gs,nm:'自動車化狙撃兵',sub:'タマンスカヤ師団',
        refuse:'タマンスカヤ師団は建物に向かわなかった。参謀本部はクレムリンに燃料不足を報告した。燃料があったことは誰もがわかっていた。',
        out:'自動車化狙撃兵は突入を始めたが、やり遂げなかった。中隊は基壇のそばで地に伏せ、もはやどんな命令でも立ち上がらせることはできなかった。夕方までに師団は、損害を理由に後退させられた。',
        won:'タマンスカヤ師団の兵士たちは正面玄関から建物に入った。各階を制圧した徴集兵たちは1か月後に兵舎へ戻され、どこにいたかは口外するなと命じられた。',
        lost:'自動車化狙撃兵は一日中正面玄関に攻めかかったが、落とせなかった。師団は夜のうちに、隊列も組まず軍楽もなしにモスクワから撤収した。真っ先に解任されたのは師団長だった。'},
      vv:{who:POINT_WHO.mvd,nm:'国内軍',sub:'ジェルジンスキー師団',
        refuse:'ジェルジンスキー師団は突入に出なかった。夜明け前、将校の一部が同胞に銃は向けないと表明した。内務相にはこれが「技術的な準備不足」として報告された。',
        out:'国内軍は20番玄関で戦ったが、最後まで戦わずに撤退した。指揮官たちは上からの命令を待たず、自らの判断で部下を引き揚げた。',
        won:'ジェルジンスキー師団は20番玄関を制圧した。この秋の勲章を最も多く受けたのは同師団の兵士たちだった。のちに彼らは、モスクワでそれを着けるのをためらった。',
        lost:'ジェルジンスキー師団は一日中20番玄関に攻めかかった。停戦後、師団は市外へ移され、その損害の数を内務省は機密扱いにした。'},
      omon:{who:POINT_WHO.mvd,nm:'OMON',sub:'モスクワ市警察本部',
        refuse:'OMONは建物に向かわなかった。隊員たちはヘルメットを脱ぎ、ホワイトハウスに背を向けて河岸通りに並んだ。2週間、彼らのもとに通い続けた女性や退役軍人たちは、このことを忘れなかった。',
        out:'OMONはほかの部隊と一緒に突入を始めたが、昼ごろには動きを止めた。警官たちは、集会を蹴散らすのは慣れているが、議会を落とすために雇われたわけではないと言った。',
        won:'OMONは軍の後に続き、建物の各階と周辺の中庭を掃討した。クラスナヤ・プレスニャ競技場で拘束者たちに何が行われたかは、その後何年も書き続けられた。',
        lost:'OMONは扉の前まで迫ったが、押し返された。1週間後、同じ隊員たちが、今度は議会の名において、その同じ議会の警備に就かされた。'},
      alpha:{who:'yeltsin',nm:'「アルファ」と「ヴィンペル」',sub:'特殊部隊'} };
      for(const u of A.units){ const t=T[u.id]; if(!t)continue; const lost=Math.round(u.lost||0), m=uMorV(u);
        if(u.id==='alpha'){ const al=A.alpha, neg=/alpha/.test(id);
          add(t.who,t.nm,t.sub+' · '+(neg?'自らの保証で人々を連れ出した':al==='refuse'?'突入を拒否した':al==='attack'?'突入に加わった、死傷者'+fmt(lost):'予備にとどまった'),
            neg?(id==='draw_alpha'?'「アルファ」の将校たちは一発も撃たずに建物に入り、自分たちの言葉を保証として人々を連れ出した。彼らはカメラの前で、議会への突入はしないと語った。クレムリンはそれを許さなかった。「ヴィンペル」は解体され、「アルファ」は別の官庁の管轄に移された。':'「アルファ」は自らの保証のもとに人々を建物から連れ出した。その保証はバスの前までしか効かなかった。将校たちは後に、できることはやった、自分たちがいなければ死者は10倍になっていたと語った。')
            :al==='refuse'?'「アルファ」は無線での呼びかけを聞き、その場を動かなかった。将校たちはクレムリンに、丸腰の代議員を相手にする仕事はしないと答えた。特殊部隊の拒否は、まだ迷っていた者すべてにとって突入の終わりを意味した。'
            :al==='attack'?(kWon?'「アルファ」と「ヴィンペル」は最後に20番玄関へ突入し、ほかの部隊にできなかったことをやってのけた。その日のことを、彼らの将校たちは語りたがらない。':'「アルファ」は突入したが、玄関を落とせなかった。失敗を知らなかった部隊にとって、これは転機となった。将校の半数が辞職願を出した。')
            :'「アルファ」と「ヴィンペル」は最後まで予備として待機させられ、結局戦闘には投入されなかった。彼らの将校たちは後に、あれはこの秋で最良の命令だったと語った。'); continue; }
        const st=u.st==='refuse'&&lost===0?'refuse':(u.cur<=3||m<MOR_HALT)?'out':kWon?'won':'lost';
        const ls=u.id==='tanks'?'':'、死傷者'+fmt(lost), sub=t.sub+' · '+(st==='refuse'?'拒否し、戦闘に加わらなかった':st==='out'?(u.halt||u.cur>3?(u.id==='tanks'?'砲撃をやめた':'停止し、それ以上進まなかった'):'戦闘から外された')+ls:(u.id==='tanks'?'最後まで砲撃した':'最後まで戦った')+ls);
        add(t.who,t.nm,sub,t[st]); } } }
  { const mine=OUTLETS.filter(o=>outSt(S,o)==='vs').length, kr=OUTLETS.filter(o=>outSt(S,o)==='kr').length;
    add(null,'報道機関',`味方 ${mine}、クレムリン側 ${kr}`,win?(mine>=kr?'大会側についた編集部が、この秋の歴史を最初に書いた。残りの編集部は2週間かけて、本当は何を言いたかったのかを読者に説明した。':'ほとんどの編集部は最後の日まであなたに敵対していた。勝利した大会は、それらを閉鎖するかどうかで揉めた。'+(S.rad>=60?'結局3つを閉鎖し、これが新しい政権の最初のスキャンダルになった。':'1つも閉鎖しなかった。そのことは人々の記憶に残った。'))
      :(mine>=4?'「プラウダ」「ソヴィエツカヤ・ロシア」「デーニ」をはじめ10余りの媒体が、翌日、大統領令で閉鎖された。一部は別の名前で復刊した。クレムリンを支持した新聞も検閲で白く抜けた紙面のまま発行され、憤慨した。':'野党系の新聞は大統領令で閉鎖された。残りの新聞は検閲で白く抜けた紙面のまま発行されたが、検閲は数日後に撤廃された。')); }
  { const A=S.A, lost=A?Math.round(A.lost||0):0;
    add(K==='fell'||K==='held'?'whf':'wh','モスクワ','決着後の街',win?(lost>300?`勝利の代償は、守備側の死傷者${fmt(lost)}人だった。クラスナヤ・プレスニャ競技場の壁際に記念碑が建てられ、かつて鉄条網の両側に分かれていた人々が、今もそこを訪れる。`:'バリケードは1週間で撤去された。蛇腹鉄条網は、もと来た倉庫へ運び戻された。モスクワ市民は台所で、あれは誰の勝利だったのかと長いあいだ議論した。')
      :(K==='draw'&&S.endId==='held_iso'?'ホワイトハウス前のバリケードは冬まで残った。街の人々は河岸通りを迂回することに慣れた。建物を守り抜いた者たちを、モスクワ市民は感謝もせず、呪いもしなかった。ただ恐れていた。':K==='draw'?'ホワイトハウスは春まで、すすけたまま空き家になっていた。どちらの権力も入居する決心がつかなかった。モスクワには政府が二つあり、同時に一つもなかった。物価は上がり、台所では誰が勝ったかではなく、誰が悪いのかが議論された。':K==='fell'?'白い外壁の黒い焼け跡は、冬までに塗りつぶされた。死者の数は長いあいだ、さまざまに数えられた。公式には約150人。夜間外出禁止令は2週間後に解除された。':K==='surr'?'建物は大きな戦闘なしに明け渡され、それが数百の命を救った。外壁は白いままだった。ホワイトハウスは塀で囲まれ、その塀は今も立っている。':'ホワイトハウスは一発の銃声もなく空になった。1か月後にはもう政府が入居しており、周りには、二度とバリケードの材料が見つからないような塀が建てられた。')); }
  add('wh','実際の歴史','1993年9月21日～10月4日','大統領令第1400号は9月21日に出された。ホワイトハウスは電気と通信を断たれ、鉄条網で囲まれた。10月3日、最高会議の支持者たちは封鎖線を突破して市庁舎を占拠し、オスタンキノへ向かった。10月4日朝、ノヴォアルバーツキー橋の戦車が議会を砲撃し、夕方までに守備側は投降した。公式発表では約150人が死亡した。12月には新憲法が採択された。');
  return L;
}
function showEpi(i){ const L=epilogue(); i=Math.max(0,Math.min(i||0,L.length-1)); const s=L[i], last=i===L.length-1;
  showEvent({id:'epi',pic:s.pic||'wh',tag:'エピローグ',h:s.h,q:s.q,p:s.p,time:'',ch:[
    last?{t:'結果へ',go:()=>ending(S.endId)}:{t:'次へ',go:()=>showEpi(i+1)},
    ...(i>0?[{t:'戻る',go:()=>showEpi(i-1)}]:[]),
    ...(!last?[{t:'スキップ',go:()=>ending(S.endId)}]:[])]});
  $('ev-meta').textContent='それぞれのその後 · '+(i+1)+' / '+L.length; $('ev-hud').innerHTML='';
}
// what became of every faction: [ушли до конца, победа, поражение]
const FATES={
  kr:['決着前に去った。ルイプキンは誰よりも先に政府と話をつけた。','挙国一致政府に加わり、3つの省を手に入れた。','共産党は12月の選挙への参加を認められた。ルイプキンは新しい国家院の議長になった。'],
  ros:['地方へ散って各地のソヴィエトをまとめようとしたが、間に合わなかった。','バブーリンが新憲法の起草委員会を率いた。','バブーリンは建物を出たところで殴打された。12月、彼は国家院議員に選ばれ、再び議席を得た。'],
  agr:['事態が終わる前に地元の州へ帰った。','自分たちの案どおりの土地法を大会で通した。','農業党は国家院に議席を得て、農村予算をめぐって駆け引きをした。'],
  otc:['軍人の代議員たちは去り、軍管区との人脈も持ち去った。','国防省の要職を得た。','年金なしで予備役に回された。1年後、一部が政界に戻った。'],
  sm:['誰よりも早くカメラの前に出て、エリツィンもハズブラートフも抜きの選挙を提案した。','妥協の顔になった。若い代議員たちが選挙をめぐる交渉を主導した。','会派は分裂した。所属代議員は新しい政党へ散っていった。'],
  kol:['一人、また一人と去った。大統領令は各人にポストと1年分の給与を約束していた。','最後まで残り、後になって、一瞬たりとも迷わなかったと語った。','クレムリンから約束どおりのポストと補償を受け取った。'],
  rne:['最後を待たずに建物を去った。','勝利の分け前を要求した。彼らには別途対処せねばならなかった。','武器を持って地下道から脱出した。バルカショフは冬に逮捕され、恩赦で釈放された。'],
  so:['独自に行動するため去った。','将校たちは階級を回復されて軍に戻った。','テレホフは逮捕された。1994年2月、恩赦で釈放。'],
};
function openFinal(){
  const id=S.endId||'', win=!!(ENDINGS[id]&&ENDINGS[id].win)||id==='held', neu=endTier(id)==='neu', A=S.A, st=S.st||{};
  const row=(a,b,c)=>`<div class="fr"><span>${a}</span><b class="${c||''}">${b}</b></div>`;
  const facs=FACTIONS.map(F=>{const f=S.fac[F.id],gone=f.n<=0,L=LOY[loyLvl(f.loy)];
    return `<div class="ff"><span class="sw" style="background:${F.c}"></span><div><b>${F.nm.replace(/"/g,'')}</b> <i style="color:${gone?'var(--dim)':L.c}">${gone?'建物にいない':L.nm+' · '+f.n}</i><div>${FATES[F.id][gone?0:win?1:2]}</div></div></div>`;}).join('');
  const forces=[['mo','国防省'],['gs','参謀本部'],['mvd','内務省'],['mer','市庁舎'],['ost','オスタンキノ']].map(([k,n])=>{const v=S.pts[k];return row(n,v>=70?'最高会議側':v>=45?'態度未定':'クレムリン側',v>=70?'p':v>=45?'':'n');}).join('');
  const mine=OUTLETS.filter(o=>outSt(S,o)==='vs').map(o=>o.nm).join('、')||'なし';
  $('modal-win').innerHTML=`<h2>結果 · 1993年${dateStr(S.day).toUpperCase()}</h2><div class="sub">${win?'勝利：最高会議は持ちこたえた。':neu?'引き分け：建物は失われたが、エリツィンは政治的に深手を負った。':'敗北：エリツィンが勝った。'}${A?'突入は12時間中'+A.r+'時間続いた。':'突入には至らなかった。'}</div>
   <div class="fin"><div><h3>数字</h3>
    ${row('経過日数',S.day)}${row('下した決断',S.chron.length)}${row('正統性',S.leg)}${row('モスクワの支持',S.city+'%')}
    ${row('残った代議員',deputies(S)+' / 265',deputies(S)<QUORUM?'n':'')}${row('去った代議員',st.depOut||0)}${row('戻った代議員',st.depIn||0)}
    ${row('建物前の市民',fmt(S.ppl))}${row('戦闘員',fmt(S.mil))}${A?row('死傷者',fmt(Math.round(A.lost||0)),'n'):''}
    ${A?row('突入部隊の死傷者',fmt(A.units.reduce((a,u)=>a+(u.lost||0),0)),'p'):''}${row('クレムリンが打った手',st.km||0)}${row('実行されなかった命令',st.fail||0)}
    <h3>勢力</h3>${forces}
    <h3>味方の報道機関</h3><div class="fo">${mine}</div>
    ${A&&A.muster?'<h3>最後の夜に駆けつけた者</h3>'+A.muster.map(m=>`<div class="fo ${m.g?'p':'n'}">${m.t}</div>`).join(''):''}
   </div><div><h3>その後の運命</h3>${facs}
    <div class="ff"><span class="sw" style="background:#b3322b"></span><div><b>ハズブラートフとルツコイ</b><div>${win?'繰り上げ選挙まで権力の座にとどまった。その先どうなったかは、歴史にもわからない。':'レフォルトヴォに収監された。1994年2月26日、国家院の恩赦で釈放された。'}</div></div></div>
    <h3>実際の歴史</h3><div class="fo">大統領令第1400号は9月21日に出された。10月4日、ノヴォアルバーツキー橋の戦車がホワイトハウスを砲撃し、夕方までに守備側は投降した。公式発表では約150人が死亡した。12月には新憲法が採択された。</div>
   </div></div><div class="sub" style="text-align:center;margin-top:6px">ゲーム「1993」 · ${authorHTML()}</div><div class="close">ESC：閉じる</div>`;
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
[$('snd2').parentNode].forEach(b=>{const d=document.createElement('div');d.className='menub px';d.textContent='メニュー';d.title='メインメニューへ。ゲームは保存されます';if(b.contains($('snd2')))d.style.cssText='right:132px;top:10px;font-size:8px;padding:6px 8px;z-index:3';d.onclick=e=>{e.stopPropagation();toMenu();};b.appendChild(d);});
// ---------- полный экран: кнопка видна только там, где браузер его даёт (на iPhone его нет — там игра ставится на экран «Домой») ----------
const FS={ el:()=>document.documentElement, can(){const e=this.el();return !!((document.fullscreenEnabled||document.webkitFullscreenEnabled)&&(e.requestFullscreen||e.webkitRequestFullscreen));},
  on:()=>!!(document.fullscreenElement||document.webkitFullscreenElement),
  sync(){const b=$('fsb'); if(!b)return; b.style.display=this.can()?'block':'none'; b.textContent=this.on()?'⤢ 全画面を終了':'⤢ 全画面表示'; setTimeout(fit,60); setTimeout(fit,400);},
  toggle(){ try{ if(this.on()){(document.exitFullscreen||document.webkitExitFullscreen).call(document);return;}
      const e=this.el(), r=(e.requestFullscreen||e.webkitRequestFullscreen).call(e); const lock=()=>{try{const o=window.screen.orientation; if(o&&o.lock)o.lock('landscape').catch(()=>{});}catch(x){}}; if(r&&r.then)r.then(lock).catch(()=>{}); else lock(); }catch(x){} } };
document.addEventListener('fullscreenchange',()=>FS.sync());document.addEventListener('webkitfullscreenchange',()=>FS.sync());
{const b=$('fsb'); if(b)b.onclick=e=>{e.stopPropagation();FS.toggle();}; FS.sync();}
// ---------- шрифт: пиксельный по умолчанию, обычные подменяют те же два семейства (ширина подогнана, вёрстка не едет) ----------
const Font={ list:[['pix','ドット'],['sans','ゴシック'],['serif','明朝']],
  // fontv:2 — с версии 0.55 пиксельный шрифт по умолчанию; старый выбор («ОБЫЧНЫЙ» и т. д.) сбрасывается один раз
  cur(){const o=store.get(OPTS)||{}; if(o.fontv!==2) return 'pix'; return this.list.some(x=>x[0]===o.font)?o.font:'pix';},
  apply(){const k=this.cur(); let st=$('font-css'); if(!st){st=document.createElement('style');st.id='font-css';document.head.appendChild(st);} st.textContent=(typeof FONT_FACES!=='undefined'&&FONT_FACES[k])||''; document.documentElement.dataset.font=k;
    const b=$('fntb'); if(b)b.textContent='フォント：'+this.list.find(x=>x[0]===k)[1]; const n=$('fntn'); if(n)n.style.display=k==='pix'?'none':'block'; },
  next(){const o=store.get(OPTS)||{}, i=this.list.findIndex(x=>x[0]===this.cur()); o.fontv=2; o.font=this.list[(i+1)%this.list.length][0]; store.set(OPTS,o); this.apply();} };
{const b=$('fntb'); if(b)b.onclick=e=>{e.stopPropagation();Font.next();}; Font.apply();}
// ---------- язык: переведённые копии скриптов (js/*.en.js и т. д.), выбор в настройках, смена = перезагрузка страницы ----------
const Lang={ list:[['ja','日本語'],['','ロシア語（原文）'],['en','English'],['zh','中文'],['ko','한국어']], cur:()=>GL,
  note:{en:'Translations into English, Chinese and Korean have not been checked by anyone. We cannot guarantee their quality. The original game is in Russian, and the translation may be inaccurate.',zh:'英文、中文和韩文翻译未经任何人校对，无法保证翻译质量。游戏原文为俄语，译文可能不准确。',ko:'영어, 중국어, 한국어 번역은 아무도 검수하지 않았습니다. 번역 품질을 보장할 수 없습니다. 게임 원문은 러시아어이며, 번역이 부정확할 수 있습니다.'},
  sync(){const b=$('lngb'),p=$('lngp'); if(!b)return; if((typeof SINGLE!=='undefined'&&SINGLE)||!LANGS_ON){b.style.display='none';return;} b.textContent='⚑ '+this.list.find(x=>x[0]===GL)[1].toUpperCase()+' ▾';
    const N=this.note; p.innerHTML='<span class="lx" style="position:absolute;right:6px;top:2px;cursor:pointer;padding:0 4px">✕</span>'+this.list.map(x=>`<div class="l${x[0]===GL?' on':''}" data-l="${x[0]}">${x[1]}</div>`).join('')+`<div class="n">日本語版は非公式の翻訳です（原文はロシア語）。英語・中国語・韓国語の翻訳は、原作者によると誰の確認も受けておらず、品質は保証されていません。</div>`;
    p.querySelector('.lx').onclick=e=>{e.stopPropagation();p.style.display='none';}; p.querySelectorAll('.l').forEach(d=>d.onclick=e=>{e.stopPropagation();this.set(d.dataset.l);}); },
  set(l){ if(l===GL){$('lngp').style.display='none';return;} const o=store.get(OPTS)||{}; o.lang=l||'ru'; store.set(OPTS,o); if(l&&window.Stat)Stat.ev('lang-'+l); location.href=location.pathname; } };
{const b=$('lngb'); if(b){b.onclick=e=>{e.stopPropagation();const p=$('lngp');p.style.display=p.style.display==='none'?'block':'none';}; Lang.sync();document.addEventListener('click',e=>{const p=$('lngp');if(p&&p.style.display!=='none'&&!p.contains(e.target)&&e.target!==b)p.style.display='none';});document.addEventListener('keydown',e=>{if(e.key==='Escape'){const p=$('lngp');if(p)p.style.display='none';}});}
 if(window.HTML_TR){const T=window.HTML_TR; const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT); let n; while(n=w.nextNode()){const k=n.nodeValue.trim(); if(k&&T[k]!==undefined&&!n.parentNode.closest('#lngp'))n.nodeValue=n.nodeValue.replace(k,T[k]);}
   document.querySelectorAll('[title]').forEach(e=>{if(T[e.title]!==undefined)e.title=T[e.title];});
   const st=document.createElement('style'); st.textContent='.law.done .t::after{content:"'+(T['  ✔ принято']||'  ✔')+'"}'+(typeof CJK_CSS!=='undefined'?CJK_CSS:''); document.head.appendChild(st);} }

drawMap(); applyOpts(); renderMenu(); show('title');

(function(){const v=document.getElementById('ver');if(v)v.textContent='バージョン '+VERSION;})();

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
  const R=[['leg','正統性',20],['hope','決意',20],['rad','過激化',20],['city','モスクワ',20],['med','放送',20],['ppl','市民',1000],['mil','義勇兵',200],['gun','武器',200],['sup','補給',3],['omon','OMONの戦意',30]];
  const b=(k,t,c)=>`<div class="law ck${c?' '+c:''}" data-k="${k}"><div class="t">${t}</div></div>`;
  win.innerHTML=`<h2>チート · テスト用</h2>${resStrip('')}
   <div class="sub">キー 0 でこのパネルを開閉できます。スマートフォンでは、タイトル画面のバージョン番号を素早く5回タップすると「チート」ボタンが有効になります。</div>
   <div class="ph">ジャンプ</div><div class="ckg">${b('go:decree','今すぐ大統領令第1400号')+b('go:ost','イベント「オスタンキノ」')+b('go:assault','すぐに突入へ')+b('go:alpha','玄関前の「アルファ」へ')+b('go:epi','スライド「それぞれのその後」')+b('x:night','ターン終了')}</div>
   <div class="ph">指標</div><div class="ckg">${R.map(([k,n,v])=>b('r:'+k+':'+v,n+' +'+v)+b('r:'+k+':-'+v,n+' −'+v)).join('')}</div>
   <div class="ph">状況設定</div><div class="ckg">${b('x:all','すべて最大')+b('x:orders','命令 +5、決議 +3')+b('x:ptsup','全勢力 +20')+b('x:ptsdn','全勢力 −20')+b('x:loyup','全会派の忠誠度を上げる')+b('x:loydn','全会派の忠誠度を下げる')+b('x:rne',S.fac.rne.n>0?'RNEを退去させる':'RNEを建物に入れる')+b('x:ring',S.cordon?'包囲網を解除':'包囲網を設置')+b('x:power',S.flags.noPower?'電気を戻す':'電気を止める')+b('x:dep','代議員 −60')+b('x:seen','解説をリセット')}</div>
   <div class="ph">エンディング表示</div><div class="ckg">${Object.keys(ENDINGS).map(id=>b('end:'+id,ENDINGS[id].h+' · '+({win:'勝利',neu:'引き分け',lose:'敗北'})[endTier(id)])).join('')}</div>
   <div class="close xtop">✕ 閉じる</div>`;
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
