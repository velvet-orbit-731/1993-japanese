// ================= 1993 — game logic =================
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fmt=n=>Math.round(n).toLocaleString('ru-RU');
const MON=['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];
const WD=['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
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
    const good=(k==='rad'||k==='omon')?v<0:v>0; out.push(`<span class="${good?'p':'n'}">${RES_NAMES[k]} ${k==='sup'&&v%1?(v>0?'+':'−')+String(Math.abs(v)).replace('.',','):sg(v)}${k==='sup'?' 天':''}</span>`);}
  if(fx.pts)for(const p in fx.pts){const v=fx.pts[p];if(!v)continue;const nm=POINTS.find(q=>q.id===p).nm.replace(/ ↑.*/,'');
    out.push(`<span class="${v>0?'p':'n'}">${p===ctx?'忠诚':nm} ${v>=100?'— 我们的':sg(v)}</span>`);}
  if(fx.fac)for(const f in fx.fac){const d=fx.fac[f], nm=f===ctx?'':FACTIONS.find(F=>F.id===f).sh+': ';
    if(d.n)out.push(`<span class="${d.n>0?'p':'n'}">${nm}${d.n<=-900?'离开':d.n>0?'+'+d.n+' 人':d.n+' 人'}</span>`);
    if(d.loy)out.push(`<span class="${d.loy>0?'p':'n'}">${nm}${d.loy>=2?'忠诚得多':d.loy>0?'更忠诚':d.loy<=-2?'非常不满':'不满'}</span>`);}
  if(fx.pr)out.push(S&&S.phase===1?`<span class="${fx.pr>0?'n':'p'}">${fx.pr>0?'怀疑':'怀疑减少'}</span>`:`<span class="${fx.pr>0?'n':'p'}">${fx.pr>0?'强攻更近了':'强攻更远了'}</span>`);
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
    document.querySelectorAll('.sndb').forEach(b=>{b.textContent='♪ 声音： '+(on()?'开':'关');b.classList.toggle('off',!on());});}
  return {has,on,sync,set(w){want=w;sync();},toggle(){const o=store.get(OPTS)||{};o.mute=!o.mute;store.set(OPTS,o);sync();}};})();
addEventListener('pointerdown',()=>Music.sync());addEventListener('keydown',()=>Music.sync());

// ---------- intro: a slide show before a new game ----------
const INTRO=[
  {pic:['wh'],      st:'莫斯科 · 1993', t:'苏联已经不存在两年了。物价放开，存款烧光，工厂停工没有工资。国家依据1978年的俄罗斯联邦宪法生活，这部宪法已经被修改了几百次。'},
  {pic:['yeltsin'], st:'总统',      t:'鲍里斯·叶利钦于1991年6月当选。他在推行市场改革，认为议会不让他把改革进行到底。他需要一部赋予总统强大权力的新宪法。'},
  {pic:['hasb'],    st:'议会',      t:'人民代表大会和最高苏维埃于1990年选出。根据现行宪法，国家最高权力属于他们。最高苏维埃主席是鲁斯兰·哈斯布拉托夫，昨天还是叶利钦的盟友。'},
  {pic:['yeltsin','hasb'], st:'二元权力', t:'1992年12月，代表大会没有批准盖达尔出任总理。1993年3月，它试图罢免总统，但差了72票。现在，每一项法律和每一道法令都会被另一方推翻。'},
  {pic:['wh'],      st:'4月25日 · “是，是，不，是”', t:'在全民公投中，多数人支持总统及其改革。但对谁来说都不会有提前选举。双方都宣布自己赢了。'},
  {pic:['rutskoy'], st:'副总统', t:'亚历山大·鲁茨科伊是将军，苏联英雄，他已站到议会一边，并承诺拿出关于部长们的一箱箱黑材料。9月1日，叶利钦以总统令将他撤职。最高苏维埃认为该令违法。'},
  {pic:['wh'],      st:'9月14日',    t:'你们就是最高苏维埃。你们有红普列斯尼亚滨河路上的一座大楼、265名议员、法律，以及那些来到它墙下的人。总统答应给军队一个“决定性的九月”。接下来会怎样，没人知道。'},
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
const OWN_NM={vs:'支持最高苏维埃',kr:'支持克里姆林宫',neu:'夹在两种权力之间'};
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
  add(whYield(S).leg,'代表大会在运作'); add(-(S.phase===2?4:1),S.phase===2?'二元权力僵持已久':'对僵持的厌倦');
  if(kremlinVoice()-mediaIncome()>=6)add(S.phase===2?-2:-1,'克里姆林宫的媒体比你们的响');
  const lm=Math.round((S.city-50)/20); add(lm,lm>0?'莫斯科站在你们一边':'莫斯科反对');
  if(S.cordon)add(ringPress(S).leg,'大楼被封锁圈包围');
  if(S.phase===2&&deputies(S)<QUORUM)add(-3,'没有法定人数');
  if(S.phase===2&&S.med<5)add(-1,'电视上无话可答');
  return {v:P.reduce((a,p)=>a+p[0],0),P};}
const pressLeg=S=>OUTLETS.reduce((a,o)=>{const st=outSt(S,o),e=st==='vs'?o.pas:st==='kr'?o.kpas:null;return a+((e&&e.fx.leg)||0);},0);
// давление кольца за ночь; S.hold — что игрок оплачивает, чтобы терпеть
function ringPress(S){const h=S.hold||{}, hv=(S.ring==null?100:S.ring)>=50; return {leg:h.cour?(hv?-2:-1):(hv?-4:-2), hope:h.ration?0:(hv?-3:-2), sup:(h.port||S.flags.gap>0)?0:(hv?.6:.4), med:h.cour?0:(hv?-2:-1), dep:h.cour?0:(hv?4:2)};}
function syncRing(){ if(S.cordon){ if(S.ring==null)S.ring=100; if(S.ring<=0){S.cordon=0;S.ring=null;S.flags.ringOff=1;S.flags.gap=0;S.hold={};apply({hope:5,leg:3});log('封锁圈解除：人和车重新开往白宫。');} } else S.ring=null; }
function halve(fx){const o={};for(const k in fx){const v=fx[k]; o[k]=typeof v==='object'?halve(v):(v<0?Math.ceil(v/2):Math.floor(v/2));}return o;}
// лояльность фракций двигается каждую ночь: её тянут издания, которые фракция читает, и общее положение дел
function facDrift(){const out=[]; for(const F of FACTIONS){const f=S.fac[F.id]; f.tr=null; if(F.kind!=='dep'||f.n<=0)continue; let v=0; const up=[],dn=[];
    for(const id of FAC_PRESS[F.id]||[]){const o=OUTLETS.find(x=>x.id===id),st=outSt(S,o); if(st==='vs'){v+=.34;up.push(o.nm+' 支持你们');} else if(st==='kr'){v-=.34;dn.push(o.nm+' 在克里姆林宫');}}
    const mod=['agr','sm','kol'].includes(F.id);
    if(S.hope>=70){v+=.2;up.push('大楼相信会成功');} else if(S.hope<45){v-=.3;dn.push('决心在下降');}
    if(S.cordon&&mod){v-=.25;dn.push('大楼被封锁圈包围');}
    if(S.fac.rne.n>0&&mod){v-=.2;dn.push('RNE在大楼里');}
    if(S.rad>=60){ if(mod){v-=.3;dn.push('激进派掌握麦克风');} else{v+=.2;up.push('严肃的对话开始了');} }
    f.dr=clamp((f.dr||0)+v,-1.6,1.6);
    if(f.dr>=1&&f.loy<10){f.dr-=1;f.loy++;f.tr={d:1,why:up[0]||'事情在推进'};} else if(f.dr<=-1&&f.loy>0){f.dr+=1;f.loy--;f.tr={d:-1,why:dn[0]||'疲惫'};}
    if(f.tr)out.push(F.sh+(f.tr.d>0?' ↑':' ↓')+' ('+f.tr.why+')');} return out;}
function renderHud(p){
  $(p+'-day').textContent='第 '+S.day;
  $(p+'-date').textContent=dateStr(S.day).toUpperCase();
  $(p+'-wd').textContent=WD[dateOf(S.day).getDay()]+' · '+PHASE_NM[S.phase];
  const cur=snap();
  const R=[['leg','合法性'],['dep','议员'],['ppl','民众'],['mil','民兵'],['gun','武器'],['med','舆论'],['sup','补给']];
  if(S.phase===1)R.splice(3,1);
  $(p+'-res').innerHTML=R.map(([k,nm])=>{const d=Math.round(cur[k]-(S.am?S.am[k]:cur[k]));
    let dl=d>0?`<span class="dlt up">+${fmt(d)}</span>`:d<0?`<span class="dlt dn">−${fmt(-d)}</span>`:'';
    if(k==='med')dl=`<span class="dlt up">+${mediaGain()}/回合</span>`;
    if(k==='gun'&&S.mil>0)dl=`<span class="dlt">空闲 ${fmt(freeGuns(S))}</span>`;
    if(k==='dep'){const r=S.depRate||0;dl=`<span class="dlt">${S.away?'−'+S.away+' 在路上 · ':''}${S.phase===2&&r>0?'法定人数约 '+Math.max(0,Math.ceil((cur.dep-QUORUM)/r))+' 天':'共265名'}</span>`;}
    if(k==='leg'){const f=legDrift(S).v+pressLeg(S);dl=`<span class="dlt ${f<0?'dn':'up'}">夜间 ${f?sg(f):'0'}</span>`;}
    const warn=(k==='sup'&&S.sup<=2)||(k==='leg'&&S.leg<=20)||(k==='med'&&S.med<10&&S.phase>1)?' warn':'';
    const v=k==='sup'?Math.floor(S.sup)+' 天':fmt(cur[k]);
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
  let tl='<div class="lbl px">大事记</div>';
  for(let d=start;d<start+14;d++){const n=dateOf(d).getDate();const cls=d<S.day?'past':d===S.day?'now':(d>=aday&&d<=aday+(S.phase===1?0:1))?'risk':'';
    tl+=`<div class="c ${cls}">${n}${cls==='risk'?' ?':''}</div>`;}
  $('tl').innerHTML=tl;
  // meters
  seg('hope',S.hope); seg('rad',S.rad); seg('city',S.city); $('m-city').textContent=S.city+'%';
  $('m-hope').textContent=S.hope+'%';
  $('m-rad').textContent=S.rad+'%'+(S.rad>=50?' ▲':''); $('m-rad').className=S.rad>=50?'warn':'';
  $('m-a1').textContent=S.phase===1?'克里姆林宫的怀疑':'距离强攻';
  $('m-a2').textContent=S.phase===1?'白宫在被监视':'据内务部传言';
  $('m-assault').textContent=S.phase===1?(S.pr>=15?'强':S.pr>=6?'增长':'弱'):'≈'+eta+' 天';
  $('m-hl').textContent=S.phase===1?'最高苏维埃的决心':'保卫者的决心';
  // points
  const map=$('map'); map.querySelectorAll('.pt,.tag').forEach(e=>e.remove());
  for(const p of POINTS){const v=S.pts[p.id];const d=document.createElement('div');
    d.className='pt lp-'+(MAP_LP[p.id]||p.lp||'b')+(p.big?' big':'')+(S.sel===p.id?' sel':'');
    d.style.left=(2+p.x*4)+'px';d.style.top=(p.y*4)+'px';d.style.setProperty('--c',`var(--${own(v)})`);
    const who=PEOPLE[POINT_WHO[p.id]];
    d.innerHTML=`<div class="mk">${p.ic}</div><div class="lb"><div class="pc">${who&&who.img?faceHTML(POINT_WHO[p.id]):''}<div class="pi"><div class="nm">${p.nm.replace(/ ↑.*/,'')}</div>${who?`<div class="wn">${who.nm.split(' ').slice(-1)[0]}</div>`:''}<div class="bar"><i style="width:${v}%"></i></div></div></div></div>`;
    d.querySelector('.mk').onclick=d.querySelector('.pc').onclick=()=>{S.sel=p.id;renderMap();firstLook('p',p.id);};
    map.appendChild(d);}
  syncRing(); const tags=[]; if(S.cordon)tags.push({x:12,y:2,t:'封锁圈 '+S.ring+(S.flags.gap>0?'，有一道缺口':'')+' ▸ 如何解除',c:'btn',on:openSiege});
  if(S.flags.noComms)tags.push({x:12,y:7,t:'无通讯：电话和编辑部都已切断 ▸',c:'btn red',on:openSiege});
  if(S.strike){const T=STRIKES.find(x=>x.id===S.strike.id);tags.push({x:12,y:S.flags.noComms&&S.cordon?12:(S.flags.noComms||S.cordon)?7:2,t:'叶利钦夜间打击： '+T.nm+(T.cover(S)?' · 已掩护':' · 未掩护')+' ▸',c:'btn'+(T.cover(S)?'':' red'),on:openStrike});}
  if(S.phase>1&&S.rad>=40)tags.push({x:84.5,y:95.5,t:'冲突',c:'red'});
  for(const tg of tags){const d=document.createElement('div');d.className='tag '+tg.c;d.textContent=tg.t;d.style.left=(tg.x*4-40)+'px';d.style.top=(tg.y*4+4)+'px';if(tg.on)d.onclick=tg.on;map.appendChild(d);}
  drawMapDynamic({cordon:S.cordon,crowds:[[84,76,Math.round(6+S.rad*.6),'#c0473a'],[78,50,Math.round(Math.min(60,(S.ppl+S.mil)/80)),'#c0473a'],[88,79,S.phase===1?0:S.cordon?24:12,'#7fa0cf']]});
  renderTarget(); drawFaces($('s-map'));
  // log
  $('log').innerHTML=S.log.slice(0,3).map((l,i)=>`<div class="${i===0&&l.day===S.day?'new ':''}${l.cls}"><span class="tm">${l.day===S.day?l.tm:'昨天'}</span>${l.text}</div>`).join('')||'<div>早晨。等待命令。</div>';
  // buttons
  $('laws-n').textContent='可用： '+lawsAvail(); $('b-laws').classList.toggle('none',!lawsAvail());
  $('orders').textContent='回车 · 命令： '+S.orders;
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
  if(a.once&&S.once[pid+i])return '已经完成';
  if(S.used[pid+i])return '今天已经做过';
  if(a.phone&&S.flags.noComms)return '电话已切断';
  if(S.cordon&&pid!=='wh'&&!a.phone&&!/оцеплением/.test(a.t)&&!(S.flags.gap>0||S.flags.tunnel))return '封锁圈：过不了铁丝网';
  if(a.req){const r=a.req(S);if(r!==true)return r;}
  if(a.dep&&deputies(S)-S.away<a.dep)return '自由议员不足';
  if(!S.orders)return '直到早晨都没有命令';
  return true;}
function renderTarget(){
  const p=POINTS.find(q=>q.id===S.sel), v=S.pts[p.id], o=own(v);
  const acts=actsOf(p.id).map(({a,i},n)=>{const st=actState(p.id,i);
    const f0=actFx(p.id,i), kf=inflOf(p.id,i);
    let cost=a.chance?fxText(a.cost||{},p.id):fxText(f0,p.id);
    if(a.chance&&!cost)cost=fxText(a.ok,p.id);
    if(a.dep)cost=`议员：${a.dep}`+(cost?' · '+cost:'');
    if(!a.chance&&kf<1)cost+=(cost?' · ':'')+`<span class="risk">${kf<0?'他们已经不听你们的了':'已经听腻了：效果 '+Math.round(kf*100)+'%'}</span>`;
    if(a.risk)cost+=(cost?' · ':'')+`<span class="risk">${a.risk}</span>`;
    if(st!==true)cost=`<span class="risk">${st}</span>`;
    return `<div class="act${st!==true?(S.used[p.id+i]||S.once[p.id+i]?' done':' off'):''}" data-i="${i}"><span class="k">${n+1}</span><span class="t">${a.t}</span><span class="cost">${cost}</span></div>`;}).join('');
  const W=PEOPLE[POINT_WHO[p.id]];
  $('target').innerHTML=`<div class="who">${faceHTML(POINT_WHO[p.id],'big')}<div><h3>${p.full}</h3>
    <div class="own"><b>${W.nm}</b>，${W.role}</div>
    <div class="own">${S.phase===1?'情绪':'控制'}：<span style="color:${OWN_COL[o]}">${OWN_NM[o]}</span></div></div></div>
    <div class="split"><div class="a" style="width:${v}%"></div><div class="b" style="width:${100-v}%"></div></div>
    <div class="split-l"><span>最高苏维埃 ${v}%</span><span>克里姆林宫 ${100-v}%</span></div>
    <div class="facts">${(T=>T?`<span class="${tugSide(v)==='vs'?'p':'n'}">现在每晚：${T.t}${fxText(T.fx)?' ('+fxText(T.fx).replace(/<[^>]+>/g,'')+')':''}${T.ph&&S.phase<T.ph?' — 自危机开始以来':''}</span><br>`:POINT_TUG[p.id]?'从65%起每晚为你们效力，降到35%就为克里姆林宫效力。<br>':'')(POINT_TUG[p.id]&&tugSide(v)&&POINT_TUG[p.id][tugSide(v)])}${(p.id==='mo'||p.id==='gs')&&S.phase===2?`在强攻中${p.id==='mo'?'坦克':'摩托化步兵'}：<span style="color:var(--paper)">${v>=65?'不会出动':v>=45?'只会以半数兵力出动':'将执行命令'}</span>（45以上动摇，65以上拒绝）。 `:''}${p.id==='mvd'&&S.phase===2?`<span style="color:var(--paper)">OMON：战备 ${S.omon==null?100:S.omon}%</span>（60及以下动摇，30及以下不出动）。 `:''}${p.id==='wh'?'代表大会在此开会。派别和苏维埃的工作在“白宫”界面中。':''}${p.id!=='wh'?`<span style="color:var(--paper)">命令执行：${Math.round(execChance(p.id)*100)}%</span>${S.flags.noComms?' （无通讯：−15%）':''}`:''}</div>
    <div class="acts">${acts}</div>`;
  $('target').querySelectorAll('.act').forEach(e=>e.onclick=()=>doAction(p.id,+e.dataset.i));
}
function doAction(pid,i){
  if(i===undefined||actState(pid,i)!==true)return;
  const a=ACTIONS[pid][i]; let fx, txt; S.uses=S.uses||{};
  if(Math.random()>execChance(pid)){S.orders--; S.used[pid+i]=1; log(POINTS.find(q=>q.id===pid).nm.replace(/ ↑.*/,'')+'：最高苏维埃的命令未被执行。合法性不足。','bad'); Sfx.play('fail'); S.st=S.st||{}; S.st.fail=(S.st.fail||0)+1; save(); renderMap(); return;}
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
  $('modal-win').innerHTML=`<h2>最高苏维埃决议</h2>${resStrip('law')}<div class="sub">${n?'可以通过： '+n+'。新决议每两天一次。合法性越高，决议效力越强（目前为 ×'+(.5+S.leg/100).toFixed(1)+').':'今天无法通过。新决议每两天一次。'}</div>`+
    LAWS.filter(inPh).map(l=>`<div class="law${S.laws[l.id]?' done':!n?' lock':''}" data-id="${l.id}"><div class="t">${l.t}</div><div class="d">${l.d}</div><div class="e">${S.laws[l.id]?'已通过':(!n?'<span class="n">没有可用的决议：每两天一次新决议</span> · ':'')+fxText(lawFx(l))}</div></div>`).join('')+
    `<div class="close">ESC — 关闭</div>`;
  $('modal').classList.add('on');
  $('modal-win').querySelectorAll('.law').forEach(e=>e.onclick=()=>{const l=LAWS.find(x=>x.id===e.dataset.id);
    if(S.laws[l.id]||!S.lawCharges)return; Sfx.play('stamp'); S.laws[l.id]=1;S.lawCharges--;S.did.law=1; if(l.flag)S.flags[l.flag]=1; apply(lawFx(l));
    log('通过决议：«'+l.t+'».'); closeModal(); if(checkLose())return; save(); showMain();});
  $('modal-win').querySelector('.close').onclick=closeModal;
}
// ---------- media: channels bring Эфир every night, appeals spend it ----------
let etherSel=null;
function outWayState(o,k){const W=OUT_WAYS[k]; if(S.appeals.pull)return '今天已经与一家编辑部打过交道'; return W.req(S,o);}
function outWin(o,k){const W=OUT_WAYS[k]; if(outWayState(o,k)!==true||outLocked(S,o))return; const st=outSt(S,o);
  apply(W.cost(o)); if(W.order)S.orders--; if(W.run)W.run(S); S.appeals.pull=1; S.did.media=1; Sfx.play(k==='p'?'crowd':k==='z'?'stamp':'paper');
  if(W.chance&&Math.random()>W.chance){apply({city:-3}); log('播出时间： '+o.nm+' ——施压失败，编辑部在写“闹事者”。');}
  else{S.out[o.id]=st==='kr'?'neu':'vs'; log('播出时间： '+o.nm+(st==='kr'?' 不再为克里姆林宫唱歌。':' 现在把发言权交给最高苏维埃。'));}
  save(); showMain(); openEther();}
function outActState(o,a,key){if(S.flags.noComms&&o.id!=='radio'&&o.id!=='for')return '没有通讯'; if(S.appeals[key])return '今天已经发生过'; if(S.med<a.cost)return '需要 '+a.cost+' 舆论'; return true;}
function outAct(o,a,key){if(outActState(o,a,key)!==true)return; Sfx.play(/echo|radio|ost|pch|600|for/.test(o.id)?'pips':'teletype'); S.med-=a.cost; S.appeals[key]=1; S.did.media=1; apply(fxOf(a)); if(a.run)a.run(S); log(o.nm+': '+a.t.toLowerCase()+'.'); save(); showMain(); openEther();}
const UNIT_SH={tanks:'坦克',taman:'摩托化步兵',vv:'内卫部队',omon:'OMON',alpha:'“阿尔法”'};
function finTxt(fx){if(!fx)return '';const o=[],pc=k=>(k<1?'−':'+')+Math.round(Math.abs(1-k)*100)+'%';
  if(fx.air)o.push('舆论 '+sg(fx.air)); if(fx.hope)o.push('决心 '+sg(fx.hope)); if(fx.inc)o.push('+'+fx.inc+' 人'); if(fx.ppl)o.push('民众 '+sg(fx.ppl));
  if(fx.mil)o.push('战士 '+sg(fx.mil)); if(fx.ctl)o.push('入口 '+sg(fx.ctl)); if(fx.all)o.push('压力 '+pc(fx.all));
  if(fx.u)for(const k in fx.u)if(fx.u[k]!==1)o.push(UNIT_SH[k]+' '+pc(fx.u[k])); return o.join(', ');}
function openEther(){
  const inc=mediaIncome(), kv=kremlinVoice(), dc=cityShift();
  let o=OUTLETS.find(x=>x.id===etherSel); if(!o){o=OUTLETS.find(x=>outSt(S,x)==='vs'&&x.act)||OUTLETS[0]; etherSel=o.id;}
  const SN={vs:'支持苏维埃',neu:'中立',kr:'支持克里姆林宫',off:'已关闭'}, ord={vs:0,neu:1,kr:2,off:3};
  const rows=OUTLETS.slice().sort((a,b)=>ord[outSt(S,a)]-ord[outSt(S,b)]||b.r-a.r).map(x=>{const st=outSt(S,x), fv=(x.pas&&fxText(x.pas.fx))||'', fk=(x.kpas&&fxText(x.kpas.fx))||'', pl=t=>t.replace(/<[^>]+>/g,'');
    const can=st!=='vs'&&st!=='off'&&!outLocked(S,x), fresh=st==='vs'&&x.act&&!S.appeals['o'+x.id];
    return `<tr class="s-${st}${etherSel===x.id?' sel':''}" data-o="${x.id}"><td class="nm">${x.nm}</td><td class="r">${x.r}</td><td class="st">${SN[st]}${st!=='vs'&&st!=='off'?(can?'':' · 无法夺取'):''}</td><td>${x.aud||''}</td>
      <td class="${st==='vs'?'':'dim'}">${x.act?x.act.t+(fresh?' <i>●</i>':''):''}</td>
      <td class="${st==='vs'?'':'dim'}">${st==='vs'?fv:pl(fv)}</td><td class="${st==='kr'?'':'dim'}">${st==='kr'?fk:pl(fk)}</td></tr>`;}).join('');
  const st=outSt(S,o); let det=`<div class="odet"><div class="ph">报刊 · ${st==='vs'?'你们的：委派（每天一次）':st==='off'?'不起作用':'如何拉拢（每天一次'+(S.appeals.pull?'，已经做过':'')+')'}</div><div class="oh"><b>${o.nm}</b> <span>覆盖 ${o.r} · ${SN[st]}。${o.about||''}</span></div><div class="obtn">`;
  if(st==='vs'){det+=[['o'+o.id,o.act],['p'+o.id,o.act2]].filter(x=>x[1]).map(([key,a])=>{const s2=outActState(o,a,key);return `<div class="law oact${s2!==true?' lock':''}" data-k="${key}"><div class="t">${a.t} <span class="cst">播出时间 −${a.cost}</span></div><div class="e">${s2===true?[fxText(fxOf(a)),a.e].filter(Boolean).join(' · '):`<span class="n">${s2}</span>`}</div></div>`;}).join('');}
  else if(st==='off')det+=`<div class="oa n">现在不起作用。</div>`;
  else if(outLocked(S,o))det+=`<div class="oa n">无法拉拢。</div>`;
  else det+=(o.ways||'').split('').map(k=>{const W=OUT_WAYS[k], s2=outWayState(o,k), c=fxText(W.cost(o))||(k==='z'?'决议':'');return `<div class="law oway${s2!==true?' lock':''}" data-w="${k}"><div class="t">${W.t} <span class="cst">${c||'命令'}</span></div><div class="e">${s2===true?W.d(o)+(st==='kr'?'。将变为中立':'。将变为你们的'):`<span class="n">${s2}</span>`}</div></div>`;}).join('');
  det+='</div></div>';
  const win=$('modal-win'); win.classList.add('wide');
  win.innerHTML=`<h2>播出时间 · 争夺莫斯科</h2>
   <div class="tug"><span class="l">支持苏维埃 ${S.city}%</span><div class="tb"><i style="width:${S.city}%"></i></div><span class="r">支持克里姆林宫 ${100-S.city}%</span></div>
   ${resStrip('med')}
   <div class="sub">你们的声音 <b style="color:var(--ok)">${inc}</b>，克里姆林宫的 <b style="color:#7fa0cf">${kv}</b>：莫斯科一夜之间 <b class="${dc<0?'n':'p'}">${dc?sg(dc):'无变化'}</b>。莫斯科的杠杆：《莫斯科共青团员报》和《莫斯科回声》（你们掌握的每一家每夜+1，现在为+${moscOut()}），下面的运动，以及早报上的辟谣。在表格中选择一家报刊。${S.flags.noComms?' <span class="n">无通讯：只有大楼的电台、外国人和获准进入的人还能工作。</span>':''}${S.kmed?' <span class="n">夜里克里姆林宫打击了电波。</span>':''}</div>
   <table class="otab"><tr><th>报刊</th><th>覆盖</th><th>归属</th><th>影响谁</th><th>归你们时会做什么</th><th>归你们时每回合</th><th>归克里姆林宫时</th></tr>${rows}</table>
   <div class="eth3">${det}<div><div class="ph">通用运动 · 不针对某家报刊，消耗播出时间（现在 ${fmt(S.med)}）</div><div class="app2 a1">`+
   APPEALS.filter(inPh).map(a=>{const nc=S.flags.noComms&&a.id!=='foreign', used=S.appeals[a.id]||nc, poor=S.med<a.cost;
     return `<div class="law gen${nc?' lock':used?' done2':poor?' lock':''}" data-id="${a.id}"><div class="t">${a.t} <span class="cst">播出时间 −${a.cost}</span></div><div class="e">${nc?'<span class="n">无通讯</span>':used?'今天已经发生过':poor?'<span class="n">播出时间不足：需要 '+a.cost+'</span>':[fxText(fxOf(a)),a.e].filter(Boolean).join(' · ')}</div></div>`;}).join('')+
   `</div></div></div><div class="close xtop">✕ 关闭</div>`;
  $('modal').classList.add('on');
  win.querySelectorAll('tr[data-o]').forEach(e=>e.onclick=()=>{etherSel=e.dataset.o;openEther();});
  win.querySelectorAll('.oway').forEach(e=>e.onclick=()=>outWin(o,e.dataset.w));
  win.querySelectorAll('.oact').forEach(e=>e.onclick=()=>{const key=e.dataset.k;outAct(o,key[0]==='o'?o.act:o.act2,key);});
  win.querySelectorAll('.law.gen').forEach(e=>e.onclick=()=>{const a=APPEALS.find(x=>x.id===e.dataset.id);
    if(S.appeals[a.id]||S.med<a.cost||(S.flags.noComms&&a.id!=='foreign'))return; S.med-=a.cost; S.appeals[a.id]=1; S.did.media=1; apply(fxOf(a)); if(a.run)a.run(S); if(a.id==='deny')S.kmed=0; log('播出时间： '+a.t.toLowerCase()+'.'); save(); showMain(); openEther();});
  win.querySelector('.close').onclick=closeModal;
}
function siegeState(i){const a=SIEGE[i]; if(a.once&&S.flags[a.once])return '已经完成'; const r=a.req(S); if(r!==true)return r; if(!S.orders)return '直到早晨都没有命令'; return true;}
function openSiege(){ syncRing();
  const win=$('modal-win'); win.classList.add('wide');
  const L=SIEGE.map((a,i)=>({a,i,st:siegeState(i)})), can=x=>x.st===true;
  const card=({a,i,st})=>`<div class="law${st===true?'':st==='已经完成'?' done2':' lock'}" data-i="${i}"><div class="t">${a.t} <span class="cst">${[a.ring?'<span class="p">封锁圈 −'+Math.min(a.ring,S.ring||0)+'</span>':'',fxText(a.fx)].filter(Boolean).join(' · ')}</span></div><div class="e">${st===true?a.d:st==='已经完成'?'已经完成':`<span class="n">${st}</span>`}</div></div>`;
  const grp=(t,l)=>l.length?`<div class="ph">${t}</div><div class="sg2">${l.map(card).join('')}</div>`:'';
  const ringL=L.filter(x=>x.a.ring&&x.a.ring<100), sum=ringL.filter(can).reduce((a,x)=>a+x.a.ring,0), oth=L.filter(x=>!x.a.ring||x.a.ring>=100).filter(x=>S.cordon||!/кольца нет/.test(x.st));
  win.innerHTML=`<h2>封锁${S.cordon?' · 封锁圈 '+S.ring+' 满值 100':''}</h2>${resStrip('ord')}${S.cordon?`<div class="tug"><span class="l">已解除 ${100-S.ring}</span><div class="tb"><i style="width:${100-S.ring}%"></i></div><span class="r">剩余 ${S.ring}</span></div>`:''}
   <div class="sub">${S.cordon?(RP=>'今晚的封锁圈：<span class="n">合法性 '+RP.leg+(RP.hope?'，决心 '+RP.hope:'')+(RP.med?'，播出时间 '+RP.med:'')+(RP.sup?'，补给 −'+String(RP.sup).replace('.',',')+' 天':'')+(RP.dep?'，另有 '+RP.dep+' 名议员离开':'')+'</span>，人不来，过不了铁丝网。 '+(S.ring>=50?'低于50时压力减弱。 ':'封锁圈已减弱：压力减小。 ')+'每晚收紧2。<b style="color:var(--paper);font-weight:400">还需解除 '+S.ring+'；现在开放的通道带来 −'+sum+'.</b>'+(S.flags.gap>0?' <span class="p">有缺口：还有 '+S.flags.gap+' 夜。</span>':''))(ringPress(S)):'没有封锁圈。这里正在恢复通讯和照明。'}
   ${S.flags.noComms?' <span class="n">无通讯。</span>':''}${S.flags.noPower?' <span class="n">市政府切断了电和水。</span>':''}</div>`+
   (S.cordon?`<div class="ph">忍耐并付出 · 每晚，不消耗命令，可以取消</div><div class="sg3">`+HOLDS.map(H=>{const on=(S.hold||{})[H.id],c=H.can(S);return `<div class="law hold${on?' on2':c!==true?' lock':''}" data-h="${H.id}"><div class="t">${H.t} <span class="cst">每晚 ${fxText(H.cost)}</span></div><div class="e">${on?'<span class="p">✓ 已开启。</span> '+H.d+'。点击取消':c!==true?`<span class="n">${c}</span>`:H.d}</div></div>`;}).join('')+'</div>':'')+
   (S.cordon?grp('分段解除封锁圈 · 现在开放 · 每项行动消耗一道命令',ringL.filter(can))+grp('分段解除封锁圈 · 目前关闭（显示缺少什么）',ringL.filter(x=>!can(x))):'')+
   grp(S.cordon?'突破、绕行、通讯和照明':'通讯和照明',oth.filter(can).concat(oth.filter(x=>!can(x))))+`<div class="close xtop">✕ 关闭</div>`;
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
  $('modal-win').innerHTML=`<h2>${kind==='p'?P.full:P.nm.replace(/"/g,'«').replace(/«([^«]*)«/,'«$1»').toUpperCase()}</h2><div style="display:flex;gap:14px;align-items:flex-start;margin-top:10px">${W?faceHTML(who,'big'):''}<div class="sub" style="margin:0;font-size:18px;line-height:21px">${W?`<b style="color:var(--paper);font-weight:400">${W.nm}</b>, ${W.role}<br><br>`:''}${txt}</div></div><div class="law" id="fl-ok" style="margin-top:16px;text-align:center"><div class="t">好</div></div>`;
  $('modal').classList.add('on'); drawFaces($('modal-win')); $('fl-ok').onclick=closeModal;}
function resStrip(hl){const it=[['leg','合法性',S.leg],['dep','议员',deputies(S)],['ppl','民众',fmt(S.ppl)],['mil','民兵',fmt(S.mil)],['gun','空闲武器',fmt(freeGuns(S))],['med','舆论',fmt(S.med)+' <i>+'+mediaGain()+' 每回合</i>'],['sup','补给',Math.floor(S.sup)+' 天'],['hope','决心',S.hope+'%'],['rad','激进度',S.rad+'%'],['city','莫斯科',S.city+'%'],['ord','命令',S.orders],['law','决议',S.lawCharges]];
  return '<div class="rstrip">'+it.map(([k,n,v])=>`<span class="${k===hl?'hl':''}">${n} <b>${v}</b></span>`).join('')+'</div>';}
function openStrike(){const T=S.strike&&STRIKES.find(x=>x.id===S.strike.id); if(!T)return; const ok=T.cover(S);
  $('modal-win').innerHTML=`<h2>叶利钦的主要打击 · ${T.nm.toUpperCase()}</h2><div class="sub">${T.warn}<br><br>今晚的打击会落在一个地方，而且很沉重：${fxText(T.hit(S))||T.e}${T.e&&fxText(T.hit(S))?' · <span class="n">'+T.e+'</span>':''}。<br><br>掩护手段：<b style="color:var(--paper)">${T.guard}</b>。${ok?'<span class="p">今天已经掩护。</span>':'<span class="n">尚未掩护。</span>'}${S.flags.shield?'<br>黑材料已经启用：如果打击落下，力度会减半。':'<br>“政府黑材料”运动会使打击减半。'}</div><div class="close">ESC — 关闭</div>`;
  $('modal').classList.add('on'); $('modal-win').querySelector('.close').onclick=closeModal;}

function openHelp(){
  const LD=legDrift(S);
  const H=[['合法性','外墙外的命令被执行的几率（现在为 '+Math.round(execChance('x')*100)+'%），决议倍率，事件中的检查。没有上限，但每晚都在消耗，高于70时，任何增益只有一半效果。今夜： '+LD.P.map(p=>p[1]+' '+sg(p[0])).join(', ')+'，报刊 '+(pressLeg(S)?sg(pressLeg(S)):'0')+'.'],
   ['议员','他们的人数本身就是议员资格。每天每走五人，合法性减1。危机中他们被慢慢耗掉：每晚都有人离开，封锁圈下更多，没有电时更多，还有叶利钦的“保障”之后。决心和派别的忠诚会留住他们。少于 '+QUORUM+' ——没有法定人数，合法性夜间−3。'],
   ['民众','人手：示威、运输队、街垒、灭火。危机中少于 '+PERIM+' ——外墙无人守卫，决心夜间−2。达到2500时，克里姆林宫会在强攻上犹豫，但人群会吃掉补给并助长激进度。'],
   ['民兵','持枪的人：强攻时守住入口，200人起可提升决心，并开启武力选项。'],
   ['武器','武器。持械的人成为民兵战士，武器随身携带：库存不减少，减少的只是空闲武器。'],
   ['舆论','唯一的媒体货币。每晚由站在你们一边的报刊带来。用于编辑部、运动和回应报纸；可以转化为合法性、莫斯科和派别的忠诚。'],
   ['补给','食品和柴油的天数。归零：人会离开，决心下降。'],
   ['莫斯科','城市的情绪：人员流入、合法性、强攻的速度。由电波决定。'],
   ['决心','大楼的团结：低于45%时议员离开得更快。归零：结束。'],
   ['激进度','赌注：开启武力选项，关闭谈判；60%起，克里姆林宫打击更重。'],
   ['地图上的力量','苏维埃和克里姆林宫之间的绳索。65%起，力量每晚为你们工作，降到35%就为克里姆林宫工作。克里姆林宫每晚都在把所有人往自己这边拉，每两三天叶利钦会认真打击其中一个：早报会提前警告。'],
   ['봉쇄선','大楼的封锁线，0–100。只要它还在，每晚都会打击合法性、决心、舆论、补给，并把议员拉走；低于50时压力减弱。可以忍受并付出代价（信使、双份口粮、搬运工），也可以分段解除：地图上的“封锁”窗口。']];
  $('modal-win').innerHTML='<h2>指标：什么影响什么</h2>'+H.map(h=>`<div class="hlp"><b>${h[0]}</b><span>${h[1]}</span></div>`).join('')+'<div class="close">ESC — 关闭</div>';
  $('modal').classList.add('on'); $('modal-win').querySelector('.close').onclick=closeModal;
}
function closeModal(){ $('modal-win').classList.remove('wide'); $('modal-win').classList.remove('full'); if(S&&S.A&&S.A.card&&screen==='assault')return; $('modal').classList.remove('on');}
function openChron(){
  const c=(S&&S.chron&&S.chron.length?S.chron:store.get(CHRON))||[];
  $('modal-win').innerHTML=`<h2>大事记</h2><div class="sub">上一局的决定。</div><div class="chron">`+
   (c.length?c.map(x=>`<div><b>${x.date}.</b> ${x.h}: ${x.ch}</div>`).join(''):'<div>还没有内容。开始新游戏。</div>')+`</div><div class="close">ESC — 关闭</div>`;
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
  slot.innerHTML=`<div class="toast"><div class="h">${dateStr(S.day).toUpperCase()} 夜 · ${S.phase===1?'克里姆林宫在做什么':'克里姆林宫的回应'}</div><div class="b">`+
    (k.moves||[]).slice().sort((a,b)=>(b.y||0)-(a.y||0)).map(m=>`<div class="km${m.g?' g':''}${m.y?' y':''}"><span class="c">${m.c}</span><div>${m.t}<br><span class="e">${m.e}</span></div></div>`).join('')+
    `${k.n?`<div class="nt"><b>你们的一夜：</b>${k.n}</div>`:''}</div><div class="x">点击关闭</div></div>`;
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
  if(S.cordon){S.hold=S.hold||{}; const paid=[]; for(const H of HOLDS){ if(!S.hold[H.id])continue; if(H.can(S)!==true){S.hold[H.id]=0; notes.push('没有东西可付：“'+H.t+'”已取消');} else{apply(H.cost);paid.push(H.t.toLowerCase());} } if(paid.length)notes.push('本夜已支付： '+paid.join(', ')); if(RP.med)S.med=Math.max(0,S.med+RP.med);}
  if(S.phase===2)S.sup=Math.max(0,S.sup-((.5+RP.sup)+S.ppl/5000)*(S.flags.ration?.5:1)+(S.flags.tunnel?.5:0));
  S.sup+=whYield(S).sup;
  if(S.sup<1){S.hope=clamp(S.hope-8,0,100);S.ppl=Math.round(S.ppl*.9);S.mil=Math.round(S.mil*.95);log('大楼里没有食物。人们在离开。','bad');}
  // the perimeter needs hands: too few people and the House feels abandoned
  if(S.phase===2&&S.ppl<PERIM){S.hope=clamp(S.hope-2,0,100);notes.push('少于 '+PERIM+'人，没人守外围：决心−2');}
  if(S.flags.gap>0){S.flags.gap--; notes.push(S.flags.gap?'封锁线上的缺口守住了':'封锁线上的缺口已堵上：三排铁丝网');}
  // people come and go
  const inflow=shut?Math.max(0,(S.city-55)*4):Math.max(0,Math.round((S.hope-40)*1+(S.city-40)*(S.phase===1?2:4)));
  S.ppl=Math.max(0,S.ppl+inflow-Math.round(S.ppl*(shut?.08:S.phase===2?.06:.03)));
  // rooms of the White House
  const LD=legDrift(S), dh=whYield(S).hope;
  S.leg=clamp(S.leg+LD.v,0,100);
  if(LD.v)notes.push('夜间合法性 '+sg(LD.v)+': '+LD.P.map(p=>p[1]+' '+sg(p[0])).join(', '));
  if(dh)notes.push('代表大会的工作：决心+'+dh);
  // media: income from channels; without a voice the Kremlin owns the air
  const dc=cityShift(), inc=mediaGain(); S.med+=inc; S.city=clamp(S.city+dc,0,100);
  if(dc)notes.push('争夺莫斯科： '+sg(dc));
  if(S.flags.komp>0)S.flags.komp--;
  if(S.mil>=400)S.rad=clamp(S.rad+1,0,100);
  if(S.phase===2){const o0=S.omon==null?100:S.omon; let o=o0+4; if(S.pts.mer>=65)o-=4; if(S.city>=60)o-=2; S.omon=clamp(o,0,100); if(o0<100&&S.omon>o0)notes.push('OMON获得奖金：战备 '+S.omon+'%');}
  // resolve is the unity of the House: when it cracks, deputies walk out
  if(S.phase===2&&S.hope<45){let out=Math.round((45-S.hope)/5)+2, o0=out; for(const id of ['kol','sm','agr','ros']){const f=S.fac[id],k=Math.min(f.n,out);f.n-=k;out-=k;if(f.n<4){f.n=0;f.room=null;} if(!out)break;} notes.push('分裂：离开 '+(o0-out)+' 名议员离开');}
  S.hope=clamp(S.hope-(S.phase===2?4:1)-(S.sup<3?1:0)+RP.hope+dh,0,100);
  if(S.cordon){S.rad=clamp(S.rad+2,0,100); S.ring=Math.min(100,(S.ring==null?100:S.ring)+2);}
  if(S.phase===2)S.pr=clamp(S.pr+prRate(),0,100);
  // the Kremlin slowly pulls everyone to its side
  for(const p of POINTS)if(!p.fixed&&S.pts[p.id]<100)S.pts[p.id]=clamp(S.pts[p.id]-(S.phase===1?1:(p.id==='mo'||p.id==='gs')?3:2),0,100);
  // канат: сила, которая стоит у одного из полюсов, каждую ночь работает на него
  {let tf={},rg=0;const tn=[]; for(const id in POINT_TUG){const sd=tugSide(S.pts[id]),T=sd&&POINT_TUG[id][sd]; if(!T||(T.ph&&S.phase<T.ph))continue; tf=merge(tf,T.fx); if(T.ring&&S.cordon)rg+=T.ring; tn.push(POINTS.find(p=>p.id===id).nm.replace(/ ↑.*/,'')+': '+T.t);}
   if(tn.length){apply(tf); if(rg&&S.ring!=null){S.ring=Math.max(0,S.ring-rg);} notes.push('夜间的力量： '+tn.join('; '));}}
  // factions
  // darkness and cold: no power wears the House down; generators burn supplies instead
  if(S.flags.noPower&&S.flags.gen&&S.sup>0)S.flags.noPower=0;
  if(S.phase===2&&S.flags.noPower){S.hope=clamp(S.hope-2,0,100);notes.push('没有电和水：决心−2');}
  else if(S.phase===2&&S.flags.gen){S.sup=Math.max(0,S.sup-.25);notes.push('发电机烧柴油：补给−0.25天'); if(S.sup<=0){S.flags.noPower=1;S.flags.gen=0;notes.push('柴油用完了：灯灭了');}}
  let fb={}, fbn=0;
  for(const F of FACTIONS){const b=facBonus(S,F); if(b&&b.on){fb=merge(fb,b.fx);fbn++;}}
  if(fbn){apply(fb); S.sup=Math.max(0,S.sup); const t=fxText(fb); if(t)notes.push('派别： '+t.replace(/<[^>]+>/g,''));}
  // deputies come back to a Congress that looks alive
  if(S.phase===2&&S.leg>=60&&S.hope>=65&&(!S.cordon||S.flags.tunnel||S.flags.gap>0||S.city>=55)){const F0=FACTIONS.find(x=>x.id==='kol'),k=Math.min(F0.n-S.fac.kol.n,2+Math.floor(Math.random()*4)); if(k>0){S.fac.kol.n+=k; notes.push('从各区返回 '+k+' 名已离开的议员：代表大会看起来仍有生气');}}
  for(const k in S.uses||{})if(S.day%2===0&&S.uses[k]>0&&!S.used[k])S.uses[k]--;
  for(const F of FACTIONS){const f=S.fac[F.id]; if(f.n<=0)continue;
    if(S.hope<40&&Math.random()<.5)f.loy=Math.max(0,f.loy-1);
    if(f.loy<=3&&S.phase===2){const out=Math.max(2,Math.round(f.n*.1));f.n=Math.max(0,f.n-out);if(f.n<4)f.n=0;
      notes.push(`${F.nm.replace(/"/g,'')}：离开 ${out}`); if(f.n===0)f.room=null;}
  }
  // до указа нелояльные тоже разъезжаются: «в округ, к избирателям»
  if(S.phase===1)for(const F of FACTIONS){const f=S.fac[F.id]; if(F.kind==='dep'&&f.n>4&&f.loy<=3){const o=1+Math.floor(Math.random()*3);f.n-=o;notes.push(F.nm.replace(/"/g,'')+': '+o+' “去选区”了');}}
  // измор: в кризис каждую ночь кто-то уходит; сначала те, кто меньше всех верит
  if(S.phase===2){const why=[]; let k=3+Math.floor(Math.random()*4);
    if(S.cordon&&RP.dep){k+=RP.dep;why.push('封锁线');} if(S.flags.noPower){k+=2;why.push('没有电');} if(S.flags.bribe){k+=2;why.push('总统的“保障”');}
    if(S.hope>=70)k-=2; if(S.laws.mandate)k-=2; if(S.leg>=60)k-=1; k=Math.max(0,k);
    const L=FACTIONS.filter(F=>F.kind==='dep'&&S.fac[F.id].n>0&&S.fac[F.id].loy<8).sort((a,b)=>S.fac[a.id].loy-S.fac[b.id].loy); let left=k,gone=0;
    for(const F of L){const f=S.fac[F.id],q=Math.min(f.n,Math.ceil(left*(f.loy<=3?.6:.45)));f.n-=q;left-=q;gone+=q;if(left<=0)break;}
    if(gone)notes.push('消耗：夜间离开 '+gone+' 名议员离开'+(why.length?' ('+why.join(', ')+')':''));}
  {const fd=facDrift(); if(fd.length)notes.push('派别： '+fd.join(', '));}
  // Kremlin answers: several moves a night, more as the stakes rise
  S.kdone=S.kdone||{};
  const nK=(S.phase===1?(S.pr>=10?2:1):2+(S.rad>=60||S.day>=15?1:0))-(S.flags.leak?1:0);
  const moves=[]; let kmed=0;
  for(let n=0;n<nK;n++){
    const opts=KREMLIN.filter(k=>!(S.flags.cam&&['挑衅','受挫','街头'].includes(k.c))&&!moves.includes(k)&&!(k.once&&S.kdone[k.t])&&!(k.good&&moves.some(m=>m.good))).map(k=>({k,w:k.w(S)})).filter(o=>o.w>0);
    if(!opts.length)break; let r=Math.random()*opts.reduce((a,o)=>a+o.w,0); const k=(opts.find(o=>(r-=o.w)<0)||opts[0]).k; moves.push(k);}
  const rep=[];
  // главный удар Ельцина: объявлен утром, приходит ночью по одному месту
  let struck=false;
  if(S.strike){const T=STRIKES.find(x=>x.id===S.strike.id); struck=true;
    if(T.cover(S)){rep.push({t:T.okT,h:T.okH,e:'<span class="p">打击被击退</span>',c:'叶利钦',g:1,y:1}); S.st.blk=(S.st.blk||0)+1;}
    else{const half=!!S.flags.shield; let fx=T.hit(S); if(half)fx=halve(fx); apply(fx); if(T.run)T.run(S,half); S.flags.shield=0; S.st.hit=(S.st.hit||0)+1; S.hope=clamp(S.hope-2,0,100); if(S.lastStrikeId==='mvd'||T.id==='mvd')S.omon=clamp((S.omon==null?100:S.omon)+10,0,100);
      rep.push({t:T.hitT+(half?' 黑材料削减了规模：打击只有一半力度。':''),h:T.hitH,e:[fxText(fx),T.e?'<span class="n">'+T.e+'</span>':''].filter(Boolean).join(' · '),c:'叶利钦',y:1});}
    S.lastStrike=S.strike.id; S.strike=null;}
  // Ельцин лично
  if(!struck){S.ydone=S.ydone||{}; const y=YELTSIN.find((y,i)=>!S.ydone[i]&&y.ph===S.phase&&y.w(S)); if(y){S.ydone[YELTSIN.indexOf(y)]=1; apply(y.fx); if(/ОКЛАД/.test(y.h))S.flags.bribe=1; if(y.run)y.run(S); rep.push({t:y.t,h:y.h,e:fxText(y.fx),c:'叶利钦',y:1}); moves.pop();}}
  // клеймо: пока РНЕ в здании, либеральная пресса бьёт каждую ночь и всё сильнее
  if(S.phase===2){const b0=S.flags.brand||0; if(S.fac.rne.n>0){S.flags.rneWas=1;const b=Math.min(3,b0+1);S.flags.brand=b;const fx={city:-b,leg:b>=3?-2:b>=2?-1:0};apply(fx);const T=BRAND_T[b-1];rep.push({t:T[S.day%T.length],e:fxText(fx),c:'烙印'});}
    else{ if(b0>0)S.flags.brand=b0-1; if(S.rad>=60){apply({city:-1});rep.push({t:'报纸写白宫里的“红褐分子”：关于开枪的议论太多。',e:fxText({city:-1}),c:'烙印'});}}}
  // издания работают каждую ночь на того, чьё они; в газету попадают самые громкие, остальное одной строкой
  {const agg={vs:{},kr:{}},L=[]; for(const o of OUTLETS){const sd=outSt(S,o),e=sd==='vs'?o.pas:sd==='kr'?o.kpas:null; if(!e)continue; apply(e.fx); agg[sd]=merge(agg[sd],e.fx); L.push({sd,e:S.phase===1&&e.t1?{...e,t:e.t1}:e});}
   const sh=a=>a.sort(()=>Math.random()-.5), tx=f=>fxText(f).replace(/<[^>]+>/g,'');
   for(const x of sh(L.filter(x=>x.sd==='vs')).slice(0,1))rep.push({t:x.e.t,e:fxText(x.e.fx),c:'你们的媒体',g:1});
   for(const x of sh(L.filter(x=>x.sd==='kr')).slice(0,S.phase===2?2:1))rep.push({t:x.e.t,e:fxText(x.e.fx),c:'他们的媒体'});
   if(tx(agg.vs))notes.push('你们的报刊夜间： '+tx(agg.vs)); if(tx(agg.kr))notes.push('克里姆林宫的报刊夜间： '+tx(agg.kr));}
  if(S.flags.leak)rep.push({t:'泄密奏效：克里姆林宫的一步被挫败，并且提前得知。',e:'',c:'你们的媒体',g:1}); if(S.flags.cam)rep.push({t:'摄像机整夜守在封锁线边。没有发生挑衅。',e:'',c:'你们的媒体',g:1}); S.flags.leak=0;S.flags.cam=0;
  for(const k0 of moves){const k=k0.tf?Object.assign({},k0,{t:k0.tf(S)}):k0; if(!k.t)continue; const fx=merge(k.fx,k.dyn?k.dyn(S):{}); apply(fx); if(k0.tf){S.kmed=1;kmed=1;S.kmedT=k.t;} if(k.run)k.run(S); if(k.once)S.kdone[k.t]=1;
    if(fx.city<0||fx.med<0){kmed=1;S.kmedT=k.t;} rep.push({t:k.t,e:fxText(fx)||k.e||'',c:k.c,g:k.good?1:0});}
  if(Math.random()<(S.phase===1?.3:.45)){const pool=KCRISIS.filter(k=>!S.kdone[k.t]&&k.w(S)>0); const k=pool[Math.floor(Math.random()*pool.length)];
    if(k){apply(k.fx);S.kdone[k.t]=1;rep.push({t:k.t,e:fxText(k.fx),c:'克里姆林宫的危机',g:1,kc:1});}}
  S.sup=Math.max(0,S.sup); S.kmed=kmed;
  S.day++; for(const m of rep)log(m.t,m.g?'':'kr','夜晚');
  // every deputy who walks out takes a piece of the mandate with him
  {const now=deputies(S), was=S.depPrev==null?now:S.depPrev, d=now-was; S.st=S.st||{};
   if(d<0){const h=Math.round(-d/5); S.leg=clamp(S.leg-h,0,100); S.st.depOut=(S.st.depOut||0)-d; notes.push('一天之内离开 '+(-d)+' 名议员离开'+(h?'：合法性−'+h:''));}
   else if(d>0){const h=Math.floor(d/6); S.st.depIn=(S.st.depIn||0)+d; if(h){S.leg=clamp(S.leg+h,0,100);notes.push('返回 '+d+' 名议员：合法性+'+h);}}
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
const PAPER_K={'叶利钦':'总统','烙印':'白宫里有谁','他们的媒体':'报刊综述','你们的媒体':'代表大会的声音','克里姆林宫的危机':'克里姆林宫不安','强力部门':'军队与警察','议员':'议员团','封锁':'白宫周围','媒体':'媒体与电波','黑材料':'揭露','窃听':'特务机关','挑衅':'事件','街头':'城市','地方':'地方','法律':'法令','钱':'钱','施压':'白宫周围','受挫':'失灵','流言':'流言','你们的夜晚':'在白宫'};
const PAPER_PIC={'叶利钦':'yeltsin','烙印':'barkash','强力部门':'grachev','议员':'hasb','克里姆林宫的危机':'yeltsin'};
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
  if(lead.c==='烙印')R.push({t:'把RNE清出大楼',fx:{city:4,leg:2,hope:-4,rad:-5},run:()=>{S.fac.rne.n=0;S.flags.rneOut=1;S.flags.brand=Math.max(0,(S.flags.brand||0)-1);}});
  else if(lead.c==='叶利钦')R.push({t:'主席团的回应决议',fx:{leg:2,hope:1,pr:2}});
  else if(lead.g)R.push({t:'把这一期发往各地区和部队',fx:{med:-4,leg:1,pts:{gs:1}},req:()=>S.med>=4||'需要4点舆论'});
  else R.push({t:'最高苏维埃主席团声明',fx:{leg:1,hope:1,rad:1}});
  if(S.kremlin&&S.kremlin.moves.some(m=>m.kc))R.push({t:'在克里姆林宫掀起丑闻',fx:{med:-5,city:2,pr:-3},e2:'叶利钦的下一次主要打击，半数力量',run:()=>{S.flags.shield=1;},req:()=>S.med>=5||'需要5点播出时间'});
  else if(!lead.g)R.push({t:'在电视上反驳',fx:{med:-6,city:3},req:()=>S.flags.noComms?'无通讯':S.med>=6||'需要6点播出时间'});
  R.push({t:'保持沉默',fx:{},e:'这一天将在没有回应的情况下开始'}); return R;}
function showPaper(){const k=S.kremlin; if(!k){S.paper=0;return startDay();}
  show('paper'); Sfx.play('paper'); Sfx.play('teletype',.25);
  const vs=voiceOf(S,'vs'),kr=voiceOf(S,'kr'),nu=voiceOf(S,'neu'),tot=vs+kr+nu||1, ours=vs>kr;
  const items=k.moves.slice(); const ord=m=>ours?(m.g?0:m.y?1:2):(m.y?0:m.c==='烙印'?1:m.g?3:2); items.sort((a,b)=>ord(a)-ord(b));
  const lead=items.shift()||{t:'夜晚平静地过去了。白宫亮着灯，克里姆林宫也一样。',e:'',c:'你们的夜晚',g:1};
  {const kc=items.findIndex(m=>m.kc); if(kc>0)items.unshift(items.splice(kc,1)[0]);}
  const ST=S.strike&&STRIKES.find(x=>x.id===S.strike.id); if(ST)items.unshift({t:ST.warn,h:ST.warnH,e:'<span class="n">今晚的主要打击</span>',c:'叶利钦'});
  const side2=lead.t.length<120&&items.length>3?items.shift():null, cols=items.splice(0,3), d=dateOf(S.day), WDN=['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
  let brief=(k.notes||[]).concat(items.map(m=>m.t.replace(/\.$/,'')+(m.e?' ('+m.e.replace(/<[^>]+>/g,'')+')':''))); {let n=0;brief=brief.filter(x=>(n+=x.length+3)<(side2?430:620));}
  k.lead=lead; k.rep=paperReplies(lead);
  $('np-sheet').innerHTML=`<div class="top"><span>第 ${180+S.day} 期（${1034+S.day}）</span><span>日报 · 1990年起出版</span><span>价格自定</span></div>
    <div class="mast">首都先驱报</div><div class="rule"></div>
    <div class="date"><span>${WDN[d.getDay()]}，1993年${dateStr(S.day)}</span><span>莫斯科</span></div>
    <div class="kick">${PAPER_K[lead.c]||lead.c.toUpperCase()}${S.phase===2?' · 危机，第 '+(S.day-DECREE_DAY+1):''}</div>
    <div class="h1">${lead.h||paperHead(lead.t,58)}</div>
    <div class="lead"><div><canvas class="ph" id="np-ph" width="220" height="110"></canvas></div>
      <div class="txt"><p>${/^[А-ЯЁA-Z]/.test(lead.t)?`<span class="dc">${lead.t.charAt(0)}</span>${lead.t.slice(1)}`:lead.t}</p>${paperStamps(lead.e)}${side2?`<div class="s2"><div class="h2">${side2.h||paperHead(side2.t,44)}</div>${paperBody(side2,side2.h||paperHead(side2.t,44))}${paperStamps(side2.e)}</div>`:''}</div></div>
    <div class="cols">${cols.map(m=>`<div class="col">${m.kc?'<div class="kick" style="margin:0 0 4px">克里姆林宫不安</div>':''}<div class="h2">${m.h||paperHead(m.t,40)}</div>${paperBody(m,m.h||paperHead(m.t,40))}${paperStamps(m.e)}</div>`).join('')}</div>
    ${brief.length?`<div class="brief"><b>简讯</b> ${brief.join(' · ')}</div>`:''}`;
  paperPhoto(PAPER_PIC[lead.c]||(S.phase===2&&S.cordon?'whf':'wh'));
  const now={...snap(),hope:S.hope,rad:S.rad,city:S.city,pr:S.pr}, o=k.d0||now;
  const row=(nm,key,suf,inv)=>{const v=Math.round(now[key]*10)/10, dl=Math.round((now[key]-o[key])*10)/10; return `<div class="row"><span>${nm}</span><span><b>${fmt(v)}${suf||''}</b> ${dl?`<span class="${(dl>0)!==!!inv?'p':'n'}">${dl>0?'+':'−'}${fmt(Math.abs(dl))}</span>`:''}</span></div>`;};
  $('np-side').innerHTML=`<div class="day">早报 · 第 ${S.day} 天</div><div class="big">晨报</div>
    <div class="npw">今天头版由 <b class="${ours?'v':''}">${ours?'支持苏维埃':'支持克里姆林宫'}</b> 的媒体撰写。${ours?'你们的报纸多于对方，头条就是你们的。':'在“播出时间”里把编辑部拉过来，标题就是你们的。'}</div>
    <div class="press"><i class="k" style="width:${kr/tot*100}%"></i><i class="n" style="width:${nu/tot*100}%"></i><i class="v" style="width:${vs/tot*100}%"></i></div>
    <div class="pl"><span>支持克里姆林宫 ${kr}</span><span>沉默 ${nu}</span><span>支持苏维埃 ${vs}</span></div>
    <div class="box"><div class="bt">夜间结果</div>${row('合法性','leg')}${row('议员','dep')}${row('民众','ppl')}${row('舆论','med')}${row('补给','sup',' 天')}${row('决心','hope','%')}${row('激进度','rad','%',1)}${row('莫斯科支持苏维埃','city','%')}</div>
    <div class="bt" style="margin-top:10px;margin-bottom:0">对头版的回应</div>`+
    k.rep.map((r,i)=>{const st=r.req?r.req():true;return `<div class="ch${st!==true?' lock':''}" data-i="${i}"><span class="k">${i+1}</span><span>${r.t}</span><span class="e">${st!==true?`<span class="n">${st}</span>`:[fxText(r.fx),r.e2].filter(Boolean).join(' · ')||r.e||''}</span></div>`;}).join('')+
    `<div class="go" id="np-go"><span class="a">开始第 ${S.day} 天</span><span class="b">ENTER</span></div>`;
  if(ST){const w=$('np-side').querySelector('.npw'); w.className='strk'; w.innerHTML=`<b>叶利钦今夜的主要打击：${ST.nm.toUpperCase()}</b>掩护：${ST.guard}。否则打击会很重。${S.flags.shield?' 黑材料已在使用：打击只有一半力度。':''}`;}
  $('np-side').querySelectorAll('.ch').forEach(e=>e.onclick=()=>paperGo(+e.dataset.i)); $('np-go').onclick=()=>paperGo(-1);
}
function paperGo(i){const k=S.kremlin; if(!k||screen!=='paper')return; const r=k.rep&&k.rep[i];
  if(r){if(r.req&&r.req()!==true)return; apply(r.fx); if(r.run)r.run(); if(r.fx&&Object.keys(r.fx).length)log('头版的回应： '+r.t.toLowerCase()+'.');}
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
    $('ev-cap-n').textContent='鲍里斯·叶利钦';$('ev-cap-r').textContent='俄罗斯联邦总统';}
  else if(pic==='tank'){ TitleArt.onReady(()=>drawTankShot(c));
    $('ev-cap-n').textContent='新阿尔巴特大桥';$('ev-cap-r').textContent='坦克炮击白宫';}
  else if(pic==='ost'){ drawOstankino(c);
    $('ev-cap-n').textContent='奥斯坦金诺';$('ev-cap-r').textContent='电视中心，阿卡杰米卡·科罗廖夫街12号';}
  else{TitleArt.onReady(()=>c.drawImage(pic==='whf'?TitleArt.burning:TitleArt.calm,270,0,320,360,0,0,320,360));
    $('ev-cap-n').textContent='白宫';$('ev-cap-r').textContent='苏维埃大厦，红普列斯尼亚滨河路';}
}
function showEvent(ev){
  evCur=ev; evSel=Math.max(0,ev.ch.findIndex(c=>!(c.req&&!c.req(S)))); show('event'); drawPhoto(ev.pic); Sfx.play(ev.end?(ev.win?'win':'lose'):ev.pic==='yeltsin'?'static':ev.urgent?'alarm':/grachev|kolesn|yerin/.test(ev.pic)?'phone':'paper');
  const tag=$('ev-tag'); tag.className='tag'+(ev.end?(ev.win?' win':' end'):''); tag.textContent=ev.end?(ev.win?'胜利':ev.tier==='neu'?'平局 · 没有赢家的危机':'失败'):ev.tag||'事件';
  $('ev-hud').innerHTML=`<span>第 <b>${S.day}</b> 天</span><span>合法性 <b>${S.leg}</b></span><span>决心 <b>${S.hope}%</b></span><span>激进度 <b>${S.rad}%</b></span>`;
  $('ev-meta').textContent=(dateStr(S.day)+' 1993'+(ev.time?' · '+ev.time:'')).toUpperCase();
  $('ev-meta2').textContent=ev.urgent?'紧急':'';
  $('ev-h').textContent=ev.h; $('ev-q').textContent=ev.q||''; $('ev-p').textContent=ev.p; $('ev-res').innerHTML='';
  renderChoices();
}
function renderChoices(){
  $('ev-ch').innerHTML=evCur.ch.map((c,i)=>{const fx=c.fx?fxText(merge(c.fx,c.fac?{fac:c.fac}:{})):'';
    let e=[fx,typeof c.e==='function'?c.e(S):c.e].filter(Boolean).join(' · ');
    const lk=c.req&&!c.req(S); if(lk)e='<span class="n">需要： '+c.rq+'</span>'; else if(c.rq)e=[e,'<span class="p">开放： '+c.rq+'</span>'].filter(Boolean).join(' · ');
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
function ASSAULT(){return {id:'assault',pic:unitStance(UNITS.find(u=>u.id==='tanks'))==='refuse'?'whf':'tank',time:'07:00',urgent:1,tag:'第3阶段 · 强攻',h:'强攻',q:'新阿尔巴特大桥上的坦克',
  p:(S.flags.corner==='army'?'军队正在离开叶利钦：国防部和总参谋部几乎公开站在代表大会一边。叶利钦明白，明天将无人可用于强攻，于是今天向仍然服从的人下令。 ':S.flags.corner==='elect'?'法院、地方和城市都要求选举。叶利钦被逼到墙角，决定趁自己的命令仍在执行时以武力了结。部队不情愿地行动。 ':'')+'黎明时分，装甲车开到了白宫前。哪些强力部门人员执行命令，哪些拒绝，取决于你们先和谁谈妥了。防御按小时计算，直到傍晚。',
  ch:[
    {t:'拿起武器！布防',e:`战士 ${fmt(S.mil)} · 无武器 ${fmt(S.ppl)} · 街垒 ${S.bar}/5`,go:()=>startAssault()},
    {t:'在担保下撤出人员',e:'议员不战而降',go:()=>ending('surrender')},
  ]};}
const ENDINGS={
  win_army:{win:1,pic:'wh',h:'军队与人民同在',q:'国防部和总参谋部支持代表大会',
    p:'各军区司令拒绝执行第1400号总统令。已无人能冲击议会：没有军队，克里姆林宫无力反击。叶利钦同意提前举行总统选举。'},
  win_elect:{win:1,pic:'whf',h:'选举',q:'强攻被击退，克里姆林宫撤退',
    p:'叶利钦试图用武力解决问题，失败了。宪法法院、地方苏维埃和媒体一致认为：总统令违法。克里姆林宫解除封锁，同意按代表大会的条件举行同期选举。'},
  elect_deal:{tier:'neu',pic:'wh',h:'零方案',q:'以选举代替强攻',
    p:'没有开一枪。法院、地方和媒体迫使双方都退了一步：第1400号总统令被撤销，代表大会的决定也一并作废，同期选举得以确定。最高苏维埃撑到了选举，但这算不上胜利。选举中，克里姆林宫掌握着电视、资金和选举委员会，而新的议会法是在没有你们的情况下起草的。最高苏维埃将再也不会有过去的作用。'},
  held:{win:1,pic:'whf',h:'守住了',q:'强攻失败了',
    p:'白宫燃烧着，但入口守住了。傍晚，数万莫斯科人涌向大楼。克里姆林宫宣布停火。'},
  held_iso:{tier:'neu',pic:'whf',h:'守住了，但孤立无援',q:'强攻被击退，但得不到承认',
    p:'入口守住了，但全国电视上只看到持枪的人，听到的只是对报复的呼声。各地保持沉默，西方谈论叛乱，莫斯科人绕开了河堤。克里姆林宫撤回了部队，静观其变。代表大会坐在一栋烧焦的大楼里，没有人愿意承认它是权力机构。谁也没有赢。'},
  pyrrhic:{tier:'neu',pic:'whf',h:'克里姆林宫的惨胜',q:'大楼被攻下，权力却未能掌握',
    p:'白宫被攻下了，但全国看到议会遭到炮击。部分部队拒绝执行命令，各地和宪法法院都不承认总统令。叶利钦坐在克里姆林宫里，无法施政：他的指令被原样退回，没有执行。前方是数月的双重权力与讨价还价，而双方都会输。'},
  draw_alpha:{tier:'neu',pic:'wh',h:'阿尔法部队不开枪',q:'特种部队拒绝强攻，亲自把人员带了出来',
    p:'“阿尔法”军官徒手进入大楼，并当着摄像机宣布不会执行向议会开枪的命令。议员和守卫在他们的保证下走了出来。白宫失守了，但总统的命令却被他自己的特种部队公开违抗。叶利钦已无法指挥，人们都明白了第1400号总统令是怎么回事。代表大会也不复存在。国家将陷入一场没有赢家的漫长危机。'},
  fell:{pic:'whf',h:'10月4日',q:'白宫在燃烧',
    p:'突击队冲进大楼。傍晚，守卫者在押送下走出。最高苏维埃不复存在。'},
  broken:{pic:'whf',h:'停火',q:'守卫者放下了武器',
    p:'坦克炮击之后，已经没有人能坚守了。人们举着白床单从门洞里走出来。代表大会被解散。'},
  surrender:{pic:'wh',h:'投降',q:'议员走出大楼',
    p:'在调停人的担保下，守卫者交出武器，走向大巴。流血较少，但代表大会不复存在。'},
  surrender_alpha:{pic:'whf',h:'在“阿尔法”的担保下',q:'军官把人员从燃烧的大楼中带了出来',
    p:'“阿尔法”拒绝强攻，亲自带领议员和守卫者穿过封锁线。本可能流更多血。最高苏维埃已经不存在。'},
  lose_hope:{pic:'wh',h:'散去',q:'守卫者离开了街垒',
    p:'寒冷、饥饿和不确定性发挥了作用。白宫不费一枪便空了下来。第1400号总统令生效。'},
  lose_leg:{pic:'yeltsin',h:'代表大会解体',q:'再没有人相信最高苏维埃',
    p:'各地已承认总统令，议员一个接一个地交还委任状。克里姆林宫甚至不需要强攻。'},
  lose_ppl:{pic:'wh',h:'空荡的街垒',q:'已无人守卫白宫',
    p:'最后的志愿者离开了。夜里，特警平静地接管了大楼。'},
};
// условия выборов без штурма (нужны все)
function dealScore(){const mine=OUTLETS.filter(o=>outSt(S,o)==='vs').length, kr=OUTLETS.filter(o=>outSt(S,o)==='kr').length, ci=ACTIONS.kre.findIndex(a=>/Иск в Конституционный суд/.test(a.t));
  return [[(S.flags.zero||0)>=1,'已采纳零方案'],[!!(S.once&&S.once['kre'+ci]),'已向宪法法院提起诉讼'],[mine>=10&&kr<=4,'支持你们的媒体：至少10家；支持克里姆林宫的：不超过4家（现在 '+mine+' 和 '+kr+')'],
    [S.leg>=85,'合法性不低于85（现在 '+S.leg+')'],[S.city>=80,'莫斯科不低于80%（现在 '+S.city+'%)'],[S.pts.mo>=50||S.pts.gs>=50,'国防部或总参谋部不低于50%'],[S.rad<40&&S.fac.rne.n<=0,'激进度低于40，且大楼内没有RNE'],[S.day>=18,'不早于10月1日']];}
function checkLose(){
  if(S.phase===1){S.hope=Math.max(S.hope,10);S.leg=Math.max(S.leg,10);return false;}
  if(S.hope<=0){ending('lose_hope');return true;}
  if(S.leg<=0){ending('lose_leg');return true;}
  if(S.phase===2&&S.ppl+S.mil<=0){ending('lose_ppl');return true;}
  return false;
}
// три яруса исходов: победа, нейтральный (здание потеряно, но Ельцин политически надломлен), поражение
const endTier=id=>{const E=ENDINGS[id]||{};return E.win?'win':E.tier||'lose';};
function drawScore(){const A=S.A||{units:[],air:0}; return [[S.leg>=50,'合法性不低于50（现在 '+S.leg+')'],[(A.air||0)>=50,'舆论不低于50（现在 '+Math.round(A.air||0)+')'],[A.units.some(u=>u.id!=='alpha'&&(u.st==='refuse'||u.st==='stopped')),'至少一支部队拒绝执行或已被制止'],[S.city>=55,'莫斯科不低于55%（现在 '+S.city+'%)']];}
function ending(id,exact){
  if(exact);
  else if((id==='fell'||id==='broken')&&drawScore().filter(x=>x[0]).length>=3)id='pyrrhic';
  if(!exact&&id==='held'&&S.flags.corner)id=S.flags.corner==='army'?'win_army':'win_elect';
  if(!exact&&id==='held'&&(S.rad>=70||(S.leg<35&&S.A&&S.A.air<30)||(S.A&&S.A.air<50&&(S.A.lost||0)+S.A.units.reduce((x,u)=>x+(u.lost||0),0)>=1500)))id='held_iso'; // без прессы или ценой большой крови без камер // кучка радикалов без прессы: отбились, но никто не признал
  const E={...ENDINGS[id]}; if(id==='fell')E.h=dateStr(S.day).toUpperCase(); if(S.A)S.A.card=0; $('modal').classList.remove('on');
  store.del(SAVE); store.set(CHRON,S.chron);
  S.endId=id; if(typeof aBanQ!=='undefined')aBanQ=[]; if(typeof achEnd==='function')achEnd(id); {const bn=$('a-banner'); if(bn)bn.className='';} stat('end-'+({win:'win',neu:'neutral'}[endTier(id)]||'lose')+'-'+id.replace(/_/g,'-'));
  showEvent({...E,tier:endTier(id),id:'end',end:1,time:'',urgent:0,ch:[
    {t:'每人的下场',go:()=>showEpi(0)},
    {t:'数字总结',go:()=>openFinal()},
    {t:'重新开始',go:()=>newGame()},
    {t:'返回主菜单',go:()=>{show('title');renderMenu();}},
  ]});
  $('ev-res').textContent=`坚守天数：${S.day}。做出的决定：${S.chron.length}。`;
}

// ===== эпилог: слайды «что стало с каждым». Гипотетические судьбы зависят от исхода, лояльности фракции, того, на чьей стороне была сила, и решений партии =====
// фракции: [ушли до конца, победа+верны, победа+колебались, поражение+верны, поражение+колебались]
const EPI_FAC={
  ros:['“俄罗斯”派系分散到各地去争取支持，没能赶回结局。巴布林后来说，他的人走得太早，别人这样说他时，他也没有争辩。',
       '巴布林出任新宪法委员会主席。在被围困的大楼里起草决议的“俄罗斯”派律师，如今正在起草根本大法，在其中议会强于总统。',
       '“俄罗斯”留在了获胜的代表大会里，但人们记得它的票数曾经需要反复劝说。巴布林被纳入宪法委员会，任副职而非主席。',
       '巴布林是最后离开大楼的人之一，在体育场附近被殴打。12月，鄂木斯克的选民再次选他为议员，他在杜马讲台上重复着他在白宫里说过的话。',
       '마지막 며칠 동안 계파는 이미 각자 탈출구를 찾고 있었다. 어쨌든 바부린은 건물을 나서다 폭행당했고, 12월 옴스크는 그를 의회로 돌려보냈지만 이번에는 계파 없이였다.'],
  kr: ['“俄罗斯共产党人”在结局之前离开了。雷布金比其他人更早与政府达成协议，为选举保住了政党。',
       '共产党人在民族和解政府中获得了三个部级职位。曾把人们带到白宫的党组织，在一个秋天里就成为全国组织最严密的力量。',
       '共产党人留在了代表大会，但没有得到部长职位：他们太久都在观望谁会获胜。雷布金转而做他最擅长的事，成为各方之间的中间人。',
       '派系坚持到了最后，党被禁止活动数周。12月选举前禁令解除。雷布金进入杜马，并成为杜马首任主席。',
       '共产党人在结局前一天离开大楼，这一点被记在了他们的功劳簿上：党被立即允许参加选举。雷布金成为新杜马主席，而白宫的守卫者们不再与他打招呼。'],
  agr:['农业派在事件结束前回到了各自的州。拉普申说，收割不会等人。',
       '农业联盟在代表大会上通过了它版本的土地法：不允许自由买卖。曾向围城运送土豆的国营农场获得了债务豁免。',
       '农业派留了下来，但直到最后一天都在讨价还价。土地法以折中版本通过，拉普申得到的是一个委员会，而不是部级职位。',
       '拉普申在押送下带领部下撤离，一个月后重新组建了农业党。12月，该党进入杜马，并与那些曾向白宫开火的人讨价还价，争取农村预算。',
       '农业派交还了委任状，换取不触碰集体农庄的承诺。这一承诺只维持了一年。农业党进入杜马，投票支持政府预算。'],
  otc:['来自“祖国”派、身着军装的议员离开了，并带走了各选区的人脉。决定性的那个夜晚，已经没有人可以给指挥部打电话了。',
       '“祖国”派的将军们作为胜利者回到了国防部。塔拉索夫获得了副部长一职，并首先叫停了军队裁减。',
       '“祖国”一直坚持到了胜利，但它给各地打的电话比指挥部要求的更为谨慎。在部里，派系的将军们得到的是没有部队的办公室。',
       '“祖国”的将军们以退役告终，不得再穿军装。一年后，塔拉索夫重返政坛，但已没有肩章，也没有派系。',
       '“祖国”在结束前几天停止了给各地打电话。将军们仍然被解职：克里姆林宫记住的不是事情如何结束，而是它如何开始。'],
  sm: ['“更替”派抢先走到镜头前，提议在没有叶利钦和哈斯布拉托夫的情况下举行选举。这些画面在所有频道上播出了一个晚上。',
       '“更替”派成了一场不必为之羞愧的胜利的面孔：年轻议员们谈判选举事宜，并向西方解释，在莫斯科获胜的是议会，而不是街垒。',
       '“更替”派留了下来，直到最后都为双方保持着门路。在选举谈判中，戈洛温被请去担任顾问，而不是代表团团长。',
       '派系在同一周解体。议员们分散加入了新的政党，而戈洛温又花了好几年解释，他既反对总统令，也反对开枪。',
       '“更替”派在结束之前举着白旗走出了大楼。克里姆林宫表示感谢，选民却不肯原谅：12月，派系中几乎无人当选。'],
  kol:['“动摇派”成员一个接一个地离开。总统令承诺给每人一个职位和一年的薪俸，几乎所有人都拿到了。',
       '“动摇派”留了下来，事后他们说自己一分钟也没有怀疑过。阿卜杜拉季波夫领导与各地区的协调委员会，在那里如鱼得水。',
       '“动摇派”坐到胜利，眼睛始终盯着门口。他们没有被原谅：在新的代表大会上，再也没有人提前估算他们的票数。',
       '他们坚持到了最后，连自己都感到惊讶。职位不会再有人提供给他们了。几个月后，阿卜杜拉季波夫还是进入了新议会的上院。',
       '得到了克里姆林宫承诺的职位和补偿。阿卜杜拉季波夫成为联邦委员会副主席，不喜欢回忆九月的事。'],
};
// силы: [победа+были за Совет, победа+были за Кремль или колебались, поражение+были за Совет, поражение+за Кремль]
const EPI_PT={
  mer:['卢日科夫及时看清了风向，在被要求之前就先把灯打开了。他仍然担任市长，但莫斯科市苏维埃现在逐项批准他的预算。',
       '卢日科夫直到最后一天都让白宫断电断水。胜利后的第一项决定，莫斯科市苏维埃就让他退休。两年后，他重返城市政坛。',
       '市政厅犹豫的时间比克里姆林宫愿意容忍的还要长。卢日科夫保住了位置，但代价是莫斯科市苏维埃：市苏维埃被他自己的命令解散了。',
       '卢日科夫切断了大楼的电、水和污水处理，而且从未为此后悔。莫斯科市苏维埃被解散，而他一直当到2010年。'],
  smo:['安皮洛夫把大批人带到斯摩棱斯克广场，以至于民警不得不后撤。胜利之后，“劳动俄罗斯”要求审判政府，代表大会不得不向自己的盟友解释：胜利不等于清算。',
       '安皮洛夫在结局前就被赶出了街头。他对着紧闭的大门举着扩音器迎接代表大会的胜利，并认为胜利是被人从他手里偷走的。',
       '安皮洛夫坚守广场直到最后。三天后，他在图拉附近的一个村子里被捕。1994年2月，他被大赦释放，并回到了广场。',
       '斯摩棱斯克广场在一个晚上就被清场。安皮洛夫在图拉附近的村子里被抓获；1994年2月，他被大赦释放。'],
  mo: ['格拉乔夫始终没有下达克里姆林宫期望他下达的命令。他没有留任部长：代表大会需要的是立刻说“不”的人，而不是沉默了两周的人。',
       '格拉乔夫本准备执行命令，但命令始终没有传到坦克那里。他在停火当天辞职，并且终其一生都认为，军队当时被双方同时背叛了。',
       '格拉乔夫拖延时间，并要求书面命令。他拿到命令已是清晨。叶利钦从未原谅他：几个月后，部长被更换。',
       '格拉乔夫要求书面命令，并拿到了。坦克开上了桥。他一直担任国防部长，直到1996年。'],
  gs: ['总参谋部没有给克里姆林宫一个师。科列斯尼科夫在新政府下继续担任总参谋长：让军队留在营房里的人，没有被更换。',
       '科列斯尼科夫等着看结局如何，他果然等到了。在代表大会之下他又任职半年，然后自行离职。',
       '总参谋部尽其所能地拖延命令：电文丢失，纵队迟迟不成形。这足以拖延强攻，却不足以取消强攻。一年后，科列斯尼科夫被悄悄撤职。',
       '总参谋部不情愿地执行了命令，但没有拖延。科列斯尼科夫一直在任，直到1996年。'],
  mvd:['内卫部队的军官拒绝走上铁丝网，叶林成了一个没有部的部长。他在停火当天辞职。',
       '叶林坚守封锁线直到最后一小时。代表大会胜利后，他被解职，并就那些日子的命令接受质询。此案从未进入法庭。',
       '内务部里有一些军官撤掉了岗哨，并把视线移开。他们在同年秋天被解雇。叶林获得了俄罗斯英雄勋章。',
       '特警和内卫部队做了被要求做的事。叶林获得了俄罗斯英雄勋章，直到1995年，在布琼诺夫斯克事件之后才辞职。'],
  ost:['奥斯坦金诺把电波交给了代表大会，全国第一次从内部看到了这场围攻。布拉金被撤职，电视中心转由议会监事会管理。',
       '奥斯坦金诺直到最后仍在播放克里姆林宫需要的内容。胜利后的第二天，布拉金被解职，电视台转由代表大会控制。',
       '奥斯坦金诺有一些编辑允许议员上镜。他们最先被解雇。克里姆林宫在12月撤掉了布拉金：太多东西通过电波播了出去。',
       '这些天里，奥斯坦金诺始终是克里姆林宫的喉舌。尽管如此，布拉金还是在12月被撤职，此前的选举对当局十分不利。'],
};
// ничья и «нулевой вариант»: [были верны, колебались]
const EPI_FAC_N={
  ros:['“俄罗斯”派的律师直到最后一天都在起草决议，而其中没有一项后来被法院推翻。巴布林作为一个既没有让步也没有获胜的人留在了政坛。在鄂木斯克，他一次又一次地当选。',
       '“俄罗斯”派在最后几天各自寻找出路。当危机以无人获胜告终时，巴布林重新组建了派系，但它已经没有了昔日的分量。'],
  kr: ['共产党人坚持到了最后，带着一个没人敢取缔的政党走出了危机。下一次选举中，他们赢得了那些既不原谅克里姆林宫、也不原谅代表大会的人的选票。',
       '共产党人一直在观望谁会获胜，结果没有人获胜。雷布金第一个与政府在谈判桌前落座，为选举保住了政党。'],
  agr:['农业派直到最后一天都在为被围困的大楼提供补给。土地法维持原状：双方都没有力量去改写它。拉普申把这称为自己的主要胜利。',
       '农业派与双方讨价还价，却没有欠任何一方的人情。一个月后，拉普申重新组织起农业党，带领它走向选举。'],
  otc:['“祖国”派的将军们直到最后一夜都在给各地打电话。他们没有被召回军队，但也不敢让他们蒙羞离职：太多指挥官记得那些电话。',
       '“祖国”派给各地打电话比指挥部要求的更为谨慎。派系的将军们悄然退役。一年后，塔拉索夫重返政坛，已没有肩章。'],
  sm: ['“更替”派替所有不愿彼此对话的人进行谈判。危机以无人获胜告终时，人们发现这正是它所追求的。戈洛温被邀请加入每一个调解委员会。',
       '“更替”派为双方保持着门路，并走进了打开的那一扇。议员们散入新的政党，戈洛温则长期解释，他同时反对双方。'],
  kol:['“动摇派”坚持到了最后，他们自己也感到惊讶。阿卜杜拉季波夫领导与各地区的调解委员会：当无人获胜时，调解人比英雄更有用。',
       '“动摇派”等待结局，却没有得到明确的答复。克里姆林宫承诺的职位并非人人都拿到了。阿卜杜拉季波夫还是进入了新议会的上院。'],
};
// ничья: [были за Совет, были за Кремль или колебались]
const EPI_PT_N={
  mer:['卢日科夫根据新闻，时而给大楼开灯，时而又关掉。他仍然担任市长：国家没有胜利者时，两边都需要城市的主人。',
       '这些天里，卢日科夫一直让白宫断电断水。危机以无人获胜告终时，莫斯科市苏维埃要求他辞职，却没有凑够选票。他又当了多年市长。'],
  smo:['安皮洛夫坚守斯摩棱斯克广场直到最后，并认为街头所做的比议员们更多。“劳动俄罗斯”要求审判政府。没有审判，集会仍在继续。',
       '安皮洛夫在结局前就被赶出了街头。他仍然逍遥法外，手里还拿着扩音器：经过那样一个秋天，没有理由再逮捕他。'],
  mo: ['格拉乔夫始终没有把整支军队交给克里姆林宫。叶利钦没有原谅他，代表大会也不信任他。几个月后部长被更换，而双方都认为这是自己的功劳。',
       '只要还有命令可执行，格拉乔夫就执行克里姆林宫的命令。没有胜利者的结局让他继续担任国防部长，而这支军队已经不愿再被召到莫斯科去了。'],
  gs: ['总参谋部尽其所能地拖延命令：电文丢失，纵队不成形。科列斯尼科夫既没有因此受奖，也没有受罚。他又任职半年，然后自行离职。',
       '总参谋部不情愿地执行命令，但没有拖延。科列斯尼科夫留任，并且在剩余的任期里始终避免谈论那个秋天。'],
  mvd:['内务部里有一些军官撤掉了岗哨，并把视线移开。叶林无法解雇他们：结果太过摇摆不定。他自己则在一年后辞职。',
       '叶林坚守封锁线直到最后一小时。为此他没有得到英雄星章：克里姆林宫不敢为一个无人获胜的秋天授勋。'],
  ost:['奥斯坦金诺把发言权交给了议员，全国从内部看到了这场围攻。布拉金被撤职。电视中心设立了监事会，克里姆林宫与议会在其中相互掣肘，持续了一年。',
       '奥斯坦金诺直到最后仍在播放克里姆林宫需要的内容。尽管如此，布拉金还是被撤职了：总得有人为国家不再只相信电视而负责。'],
};
// поражение без штурма («Разошлись», «Съезд распался», «Пустые баррикады», сдача до боя): замены для текстов, где упомянуты штурм и танки
const EPI_NOA={
  ros3:'巴布林是最后离开这栋逐渐空荡的大楼的人之一。12月，鄂木斯克的选民再次选他为议员，他在杜马讲台上重复着九月时说过的话。',
  ros4:'最后几天，派系成员各自寻找出路。12月，鄂木斯克把巴布林送回议会，但那已经是另一个议会了。',
  agr3:'拉普申最后一个带领部下撤离，一个月后组建了农业党。12月，该党进入杜马，并为农村预算讨价还价。',
  mo2:'格拉乔夫拖延时间，并要求书面命令。但命令已经用不着了：白宫自己空了。叶利钦记住了这位部长一直在等待，几个月后把他撤换了。',
  mo3:'格拉乔夫准备执行命令。坦克无需出动：大楼没有开一枪就空了。他一直担任国防部长，直到1996年。',
  gs2:'总参谋部尽其所能地拖延命令：电文丢失，纵队不成形。这是否足够，无从验证：强攻从未到来。',
  gs3:'总参谋部准备不情愿地、但不拖延地执行命令。但并不需要命令。科列斯尼科夫一直在任，直到1996年。',
};
function epilogue(){
  const id=S.endId||'', K=id==='elect_deal'?'deal':endTier(id)==='neu'?'draw':/army/.test(id)?'army':id==='win_elect'?'elect':id==='held'?'held':/fell|broken/.test(id)?'fell':/surrender/.test(id)?'surr':'fade', win=K==='army'||K==='elect'||K==='held', neu=K==='deal'||K==='draw', noA=!win&&!neu&&!(S.A&&S.A.units);
  const L=[], add=(pic,h,q,p)=>L.push({pic,h,q,p});
  add(win?'wh':K==='fell'?'whf':'wh','尾声','每人的下场','以下是没有发生的事，或者是另一种发生的样子。命运取决于你们的秋天如何结束，谁陪你们走到了最后，以及军队、民警、市政府和电波最终站在了谁的一边。');
  add('hasb','哈斯布拉托夫','最高苏维埃主席',{army:'哈斯布拉托夫在那个大厅里接受了政府的辞呈，两个星期前他还在那里借着烛光坐着。在提前选举之前，他一直是国内的第二号人物，而许多人认为他才是第一号。',
    deal:'哈斯布拉托夫签署了“零方案”，并一直担任主席直到选举。他称这是法律的胜利。在依照新法选出的新议会中，已不再有拥有这种权力的主席。',
    elect:'哈斯布拉托夫击退了强攻，并同意同期选举。他没有参加选举：他说自己的任务是保住议会，而不是再次领导它。',
    held:'哈斯布拉托夫在烧焦的墙边走到人群前，宣布停火。胜利与一份死者名单一同落到他头上，而每次选举，人们都会提醒他这份名单。',
    draw:S.endId==='held_iso'?'哈斯布拉托夫依然是一个只在封锁圈内得到承认的议会的主席。他要求激进派闭嘴，但麦克风已经不在他手里。':'哈斯布拉托夫作为一个自由人走出了大楼：在摄像机拍下了一切之后，克里姆林宫不敢逮捕议会主席。他宣布代表大会将在全国任何一个会场继续工作，各地区一个接一个地向他提供会场。',
    fell:'哈斯布拉托夫在押送下被带出大楼，并被送往莱福尔托沃。1994年2月26日，他根据国家杜马的大赦获释，并回到普列汉诺夫学院任教。',
    surr:'哈斯布拉托夫签署了投降条件，并与议员们一起走向大巴。莱福尔托沃、1994年2月的大赦、普列汉诺夫学院的一个教研室。',
    fade:'哈斯布拉托夫几乎独自留在了空荡的大楼里。他甚至没有被逮捕：克里姆林宫更看重的是表明没有需要逮捕的人。他回到了自己的教研室。'}[K]);
  add('rutskoy','鲁茨科伊','副总统',K==='deal'?'第1400号总统令被撤销的那天，鲁茨科伊辞去了代理总统的职权。他称这一妥协是双方同时投降。他亲自参加了选举并落败，三年后担任了库尔斯克州州长。':K==='draw'&&S.endId==='held_iso'?'鲁茨科伊在白宫院内检阅了守卫者的队伍。他的命令只在三百米半径内得到执行。再往外，则是记得他呼吁轰炸克里姆林宫的那个国家。':K==='draw'?'鲁茨科伊最后一个走出来，向记者展示一把还带着润滑油的冲锋枪。半个国家认为他是代理总统，另一半认为他是叛乱分子，两方各有各的道理。他始终没有受审。':win?(S.rad>=60?'鲁茨科伊宣誓就任代理总统，并兑现了从阳台上许下的一半承诺。另一半涉及监狱，代表大会没有批准。':'鲁茨科伊担任代理总统直到提前选举，并且令所有人意外的是，他真的把选举举行了。'):
    (K==='fade'?'鲁茨科伊放下了一项只有代表大会承认的权力。三年后，他当选为库尔斯克州州长。':'鲁茨科伊最后一个投降，并向记者展示一把还带着润滑油的冲锋枪：他没有开过一枪。莱福尔托沃，1994年2月的大赦。1996年，他当选为库尔斯克州州长。'));
  add('yeltsin','叶利钦','俄罗斯总统',{army:'军队没有执行命令，这就是结局。叶利钦同意提前选举，但他没有参加，然后前往巴尔维哈的别墅写书。',
    deal:'叶利钦撤销了第1400号总统令，并称之为“走向共识的一步”。在选举前，他成功修改了议会法和电视台的领导层。他赢得了选举。选举是否公平，至今仍有争议。',
    elect:'叶利钦撤回了第1400号总统令，并称之为“走向共识的一步”。在同期选举中，他提出了自己的候选人资格。选举如何结束，这个游戏无从得知。',
    held:'强攻在全世界的注视下失败了。叶利钦宣布停火，一周后同意举行选举。下令开枪的人，他一一点了名，却没有把自己算在其中。',
    draw:'叶利钦仍然待在克里姆林宫，但从那里发出的命令不再被执行：各军区等待书面确认，各地区把税款留给了自己，法院则称第1400号总统令是一场政变。几个月后，他同意提前选举，但没有参加。',
    fell:'叶利钦一直以总统令执政到12月。1993年12月12日，全民公投通过了新宪法，确立了强势总统与弱势议会。该宪法至今仍然有效。',
    surr:'叶利钦没有经过大战就得到了这座大楼，并把功劳揽到自己身上。12月，他的宪法获得通过。对投降者所作的保证，直到2月杜马宣布大赦时才被人想起。',
    fade:'克里姆林宫并不需要强攻。叶利钦签署了新议会选举令，并在12月把自己的宪法提交全民公投。'}[K]);
  for(const F of FACTIONS){ if(F.kind!=='dep')continue; const f=S.fac[F.id], T=EPI_FAC[F.id]; if(!T)continue; const gone=f.n<=0, loyal=f.loy>=6;
    add(FAC_WHO[F.id],F.nm.replace(/"/g,'«').replace(/«([^«]*)«/,'«$1»').toUpperCase(),gone?'在结局前离开':LOY[loyLvl(f.loy)].nm[0].toUpperCase()+LOY[loyLvl(f.loy)].nm.slice(1)+' · 剩余 '+f.n,gone?T[0]:neu?EPI_FAC_N[F.id][loyal?0:1]:win?T[loyal?1:2]:(noA&&EPI_NOA[F.id+(loyal?3:4)])||T[loyal?3:4]); }
  { const f=S.fac.rne, was=f.n>0||S.flags.rneWas;
    add('barkash','RNE',f.n>0?'一直留在大楼里':was?'被驱逐或自行离开':'未被允许进入大楼',
      neu?(f.n>0?'巴尔卡绍夫的人一直留在大楼里，直到结局，并带着武器离开。克里姆林宫一有机会就播放他们列队的画面：“这就是他们要我们与之谈判的人。”代表大会始终没能洗掉这些画面的印记。'
            :was?'到了结局时，RNE已不在大楼里。巴尔卡绍夫说他被出卖了。法西斯主义的指控仍被扣在守卫者头上，但站不住脚：已经没有人可以拿来展示了。'
            :'巴尔卡绍夫在门口被拒之门外。白宫附近的照片里没有出现黑色制服，这成了克里姆林宫无法宣布议会为叛乱的原因之一。')
      :noA?(f.n>0?'巴尔卡绍夫的人最后一个离开大楼，列队而行，携带武器。克里姆林宫整个冬天都在播放那支队伍的画面：“这就是当时坐在里面的人。”巴尔卡绍夫在冬天被捕，2月被大赦释放。'
            :was?'到结束时，RNE已经不在大楼里了。法西斯主义的指控仍然粘在守卫者身上，但站不住脚：已经没有人可以拿来展示了。'
            :'巴尔卡绍夫在门口被拒。没有人能在电视上展示议会墙上的纳粹十字标志，但这并没有挽救白宫。')
      :f.n>0?(win?'巴尔卡绍夫的人守住了第二十号入口，并要求分享胜利果实：场地、武器、代表大会警卫的位置。自由派报纸拿到了一张照片，此后十年一再刊载：黑色制服出现在议会台阶上。解除RNE武装的，已经是新政权。'
                 :'巴尔卡绍夫的人在入口处战斗的时间比任何人都长，然后带着武器经下水道离开。他们列队的画面成了强攻的主要理由：“那里有法西斯分子。”巴尔卡绍夫在冬天被捕，2月被大赦释放。')
      :was?(win?'在获胜的白宫里已没有RNE，没有人能把代表大会的胜利称为“褐色的”。巴尔卡绍夫说他被出卖了。一年后，他的组织只在犯罪新闻版面上被提及。'
              :'代表大会把RNE推了出去，却失去了它最好的一支队伍。巴尔卡绍夫带着他的人离开，没有参与战斗。法西斯主义的指控仍被扣在守卫者头上，但站不住脚：没有人可以拿来展示。')
      :(win?'巴尔卡绍夫在门口被拒。结果，这成了那个秋天最廉价的决定之一：照片里没有黑色制服，西方当天就承认了议会的胜利。'
           :'巴尔卡绍夫在门口被拒。强攻当日，一百二十名受过训练的战士不够用，但没有人能在电视上展示议会墙上的纳粹十字标志。')); }
  { const f=S.fac.so; add('terekh','“军官联盟”',f.n>0?'一直留在大楼里':'不在大楼里',neu?(f.n>0?'捷列霍夫的军官们负责大楼的防守，直到最后一天。克里姆林宫不敢逮捕捷列霍夫，也不肯让他回到军队。“军官联盟”仍然只是它原来的样子：一个由身着肩章的人组成的政治小圈子。':'“军官联盟”没有参与防守。捷列霍夫一会儿要求审判国防部长，一会儿要求他辞职，结果两样都没有得到。'):f.n>0?(win?'捷列霍夫的军官们以恢复军衔的身份回到了军队。捷列霍夫本人却没有被纳入总参谋部：胜利的代表大会需要的是军队，而不是它的政治小圈子。':'捷列霍夫被捕，并在审讯中遭到殴打。1994年2月，他被大赦释放，并重新组建了“军官联盟”，这次没有武器。')
      :(win?'“军官联盟”没有参与防守。胜利后，捷列霍夫要求清洗国防部，结果被礼貌地忽视了。':'捷列霍夫独自行动，在结局前就被捕了。1994年2月的大赦恢复了他的自由，却没有恢复他的军衔。')); }
  for(const pid of ['mo','gs','mvd','mer','smo','ost']){ const P=POINTS.find(x=>x.id===pid), v=S.pts[pid], our=v>=(win||neu?50:60), W=PEOPLE[POINT_WHO[pid]];
    add(POINT_WHO[pid],W.nm.split(' ').pop().toUpperCase(),P.nm.replace(/ ↑.*/,'')+' · 到结束时 '+(v>=65?'支持苏维埃':v<=35?'支持克里姆林宫':'动摇了')+' ('+v+'%)',neu?EPI_PT_N[pid][our?0:1]:win?EPI_PT[pid][our?0:1]:(noA&&EPI_NOA[pid+(our?2:3)])||EPI_PT[pid][our?2:3]); }
  // части Кремля: кто дошёл до конца, кто встал, кто не пошёл вовсе
  { const A=S.A, kWon=endTier(id)==='lose';
    if(!A||!A.units||false){ add('grachev','克里姆林宫部队','没有发生强攻',id==='elect_deal'?'被调往莫斯科的部队在环路上停留了一周，然后返回驻地。士兵们被告知，那只是一次演习。':'没有走到开枪那一步。纵队在河堤上停了一会儿就离开了：已经没有人可以抓了。'); }
    else{ const T={
      tanks:{who:'grachev',nm:'坦克上桥',sub:'坎捷米尔师',
        refuse:'坎捷米尔师的车组没有开上桥。团长要求部长下达书面命令，一直等到晚上。后来，拒绝开火的军官被悄悄解职，但没有人敢将他们送上法庭。',
        out:'坦克开上了桥，但在强攻结束之前就停止了开火。车组关掉引擎，当着摄像机坐在装甲上。白宫旁边那张沉默的坦克照片传遍了世界各地的报纸。',
        won:'坦克一直向上层开火，直到最后。据传，车组成员获得了现金报酬和住房。多年来，部里都没有公布坐在车里的军官的名字。',
        lost:'坦克一直开火到天黑，但大楼守住了。新政权没有审判向议会开火的军官，只是不再与他们握手。许多人当年就辞职了。'},
      taman:{who:POINT_WHO.gs,nm:'摩托化步兵',sub:'塔曼师',
        refuse:'塔曼师没有开往大楼。总参谋部向克里姆林宫报告燃料短缺。所有人都明白，燃料是有的。',
        out:'摩托化步兵开始了强攻，却没有完成。连队伏在基座旁，任何命令都无法再让他们站起来。傍晚，师部以伤亡为由将部队撤下。',
        won:'塔曼人从正门进入了大楼。占领各层的义务兵一个月后被送回营房，并被告知不得透露他们去过哪里。',
        lost:'摩托化步兵整天都朝正门推进，却始终没有拿下。师部在夜里带出莫斯科，没有队列，也没有音乐。它的指挥官最先被撤职。'},
      vv:{who:POINT_WHO.mvd,nm:'内卫部队',sub:'捷尔任斯基师',
        refuse:'捷尔任斯基师没有参加强攻。天亮前，一些军官宣布他们不会向自己人开火。部长得到的汇报是“技术上未做好准备”。',
        out:'内卫部队在第二十号入口作战，并在结束前撤离了那里。指挥官们没有等待上级命令，亲自带部下离开。',
        won:'捷尔任斯基师拿下了第二十号入口。那个秋天，它的战士们得到的奖章比任何人都多。之后他们在莫斯科佩戴这些奖章时感到尴尬。',
        lost:'捷尔任斯基师整天都在冲击第二十号入口。停火后，它被带出城市，国防部对其伤亡进行了保密。'},
      omon:{who:POINT_WHO.mvd,nm:'OMON',sub:'莫斯科内务总局',
        refuse:'特警没有进入大楼。队员们摘下头盔，背对白宫沿河堤站立。两个星期来一直去找他们的妇女和老兵都记住了这一幕。',
        out:'特警和大家一起开始行动，在白天中间停了下来。民警们说，驱散集会他们会，但不是来攻占议会的。',
        won:'特警跟在军队后面，清理周围的楼层和院子。关押在红普列斯尼亚体育场的人遭遇了什么，此后多年都有人在写。',
        lost:'特警冲到门口又退了回来。一周后，同一批战士被派去守卫同一个议会，而且是以议会的名义。'},
      alpha:{who:'yeltsin',nm:'“阿尔法”与“飞马”',sub:'特种部队'} };
      for(const u of A.units){ const t=T[u.id]; if(!t)continue; const lost=Math.round(u.lost||0), m=uMorV(u);
        if(u.id==='alpha'){ const al=A.alpha, neg=/alpha/.test(id);
          add(t.who,t.nm,t.sub+' · '+(neg?'以自己的保证带出人员':al==='refuse'?'拒绝强攻':al==='attack'?'发起强攻，伤亡 '+fmt(lost):'留作预备队'),
            neg?(id==='draw_alpha'?'“阿尔法”的军官未开一枪便进入大楼，并凭自己的承诺带出了人员。在摄像机前，他们表示不会强攻议会。克里姆林宫没有原谅他们：“飞马”被解散，“阿尔法”被划归另一个机构。':'“阿尔法”凭自己的保证把人员带出了大楼。这份保证在大巴车旁失效了。军官们后来说，他们已尽力而为，没有他们，死亡人数会多出十倍。')
            :al==='refuse'?'“阿尔法”通过无线电收到了号召，并留在原地。军官们回复克里姆林宫，他们不会对手无寸铁的议员动手。特种部队的拒绝，对那些仍有疑虑的人来说就是强攻的终结。'
            :al==='attack'?(kWon?'“阿尔法”和“飞马”最后进入了第二十号入口，做了其他人没能做到的事。他们的军官不喜欢回想那一天。':'“阿尔法”投入了强攻，却没有拿下入口。对于一支从未遭遇过失败的部队来说，这是一个转折点：一半军官递交了报告。')
            :'“阿尔法”和“飞马”一直留在预备队，直到最后也没有投入战斗。之后，他们的军官说，那是整个秋天最好的一道命令。'); continue; }
        const st=u.st==='refuse'&&lost===0?'refuse':(u.cur<=3||m<MOR_HALT)?'out':kWon?'won':'lost';
        const ls=u.id==='tanks'?'':'，伤亡 '+fmt(lost), sub=t.sub+' · '+(st==='refuse'?'拒绝，未参战':st==='out'?(u.halt||u.cur>3?(u.id==='tanks'?'停火':'停了下来，不再前进'):'退出战斗')+ls:(u.id==='tanks'?'一直开火到底':'战斗到底')+ls);
        add(t.who,t.nm,sub,t[st]); } } }
  { const mine=OUTLETS.filter(o=>outSt(S,o)==='vs').length, kr=OUTLETS.filter(o=>outSt(S,o)==='kr').length;
    add(null,'媒体',`支持你们 ${mine}，支持克里姆林宫 ${kr}`,win?(mine>=kr?'站在代表大会一边的编辑部率先书写了这个秋天的历史。之后的两个星期，其余的报纸都在向读者解释，他们真正想表达的是什么。':'大多数编辑部直到最后一天都与你们作对。获胜的代表大会争论是否应该关闭它们。 '+(S.rad>=60?'他们关闭了三家，这成了新政权的第一桩丑闻。':'一家也没有关，人们记住了这一点。'))
      :(mine>=4?'《真理报》、《苏维埃俄罗斯报》、《日报》以及另外十几家报纸，第二天就被以法令关闭。有些以其他名字重新出版。支持克里姆林宫的报纸则带着审查留下的空白版面出版，并表示愤慨。':'反对派报纸被以法令关闭。其余报纸带着审查留下的空白版面出版，几天后空白被撤销。')); }
  { const A=S.A, lost=A?Math.round(A.lost||0):0;
    add(K==='fell'||K==='held'?'whf':'wh','莫斯科','结局之后的城市',win?(lost>300?`胜利付出了守卫者 ${fmt(lost)} 名伤亡的代价。红普列斯尼亚体育场的墙边立起了一座纪念碑，铁丝网两边的人都会来这里。`:'街垒在一周内拆除了。布鲁诺铁丝网被运回了它来时的仓库。莫斯科人在厨房里争论了很久，这究竟是谁的胜利。')
      :(K==='draw'&&S.endId==='held_iso'?'白宫的街垒一直保留到冬天。城市习惯了绕开河堤。莫斯科人既没有感谢，也没有咒骂守住大楼的人：他们只是害怕他们。':K==='draw'?'白宫空荡荡地、被烟熏黑地一直站到春天：没有任何一方政权敢搬进去。莫斯科同时生活在两个政府之下，却又哪个都不承认；物价上涨，厨房里的人争论的不是谁赢了，而是谁该负责。':K==='fell'?'白色外墙上的黑色痕迹到冬天前已被涂掉。死亡人数长期被以不同的方式统计：官方数字约为一百五十人。两周后宵禁解除。':K==='surr'?'大楼是在没有大战的情况下交出的，这挽救了一百多人的生命。外墙仍然是白色的。白宫被围了起来，那道围栏至今仍在。':'白宫在没有一枪的情况下空了。一个月后，政府已经坐进了里面，周围的围栏也装好了，好让人们再也没有材料可以用来搭街垒。')); }
  add('wh','事情的真相','1993年9月21日至10月4日','1400号总统令于9月21日发布。白宫被切断了电力和通讯，并被铁丝网包围。10月3日，最高苏维埃的支持者冲破封锁，夺取了市政厅，并向奥斯坦金诺进发。10月4日清晨，新阿尔巴特桥上的坦克向议会开火，傍晚，守卫者投降。据官方数字，约150人死亡。12月，新宪法获得通过。');
  return L;
}
function showEpi(i){ const L=epilogue(); i=Math.max(0,Math.min(i||0,L.length-1)); const s=L[i], last=i===L.length-1;
  showEvent({id:'epi',pic:s.pic||'wh',tag:'尾声',h:s.h,q:s.q,p:s.p,time:'',ch:[
    last?{t:'至结局总结',go:()=>ending(S.endId)}:{t:'下一步',go:()=>showEpi(i+1)},
    ...(i>0?[{t:'返回',go:()=>showEpi(i-1)}]:[]),
    ...(!last?[{t:'跳过',go:()=>ending(S.endId)}]:[])]});
  $('ev-meta').textContent='各人结局 · '+(i+1)+' / '+L.length; $('ev-hud').innerHTML='';
}
// what became of every faction: [ушли до конца, победа, поражение]
const FATES={
  kr:['结局之前离开。雷布金比其他人更早与政府达成协议。','加入民族和解政府，获得三个部级职位。','共产党获准参加12月选举。雷布金成为新杜马主席。'],
  ros:['分散到各地去组织苏维埃，来不及组织起来。','巴布林出任新宪法委员会主席。','巴布林离开大楼时遭到殴打。12月，他再次当选为议员。'],
  agr:['结局之前回到了各自的地区。','在代表大会上通过了按自己版本修订的土地法。','农业党进入杜马，并为农村预算讨价还价。'],
  otc:['身着军装的议员离开了，并带走了各选区的人脉。','在国防部获得了职位。','无养老金退役。一年后，部分人重返政坛。'],
  sm:['抢先走到镜头前，提议在没有叶利钦和哈斯布拉托夫的情况下举行选举。','成为妥协的面孔：年轻议员主导了选举谈判。','派系解体。议员们分散加入了新政党。'],
  kol:['一个接一个地离开。总统令承诺每人一个职位和一年的薪俸。','留了下来，后来说自己一分钟也没有怀疑过。','得到了克里姆林宫承诺的职位和补偿。'],
  rne:['结局之前离开了大楼。','要求分享胜利果实，需要单独处理。','带着武器经下水道离开。巴尔卡绍夫在冬天被捕，后因大赦获释。'],
  so:['独自行动去了。','军官以恢复军衔的身份回到了军队。','捷列霍夫被捕。1994年2月因大赦获释。'],
};
function openFinal(){
  const id=S.endId||'', win=!!(ENDINGS[id]&&ENDINGS[id].win)||id==='held', neu=endTier(id)==='neu', A=S.A, st=S.st||{};
  const row=(a,b,c)=>`<div class="fr"><span>${a}</span><b class="${c||''}">${b}</b></div>`;
  const facs=FACTIONS.map(F=>{const f=S.fac[F.id],gone=f.n<=0,L=LOY[loyLvl(f.loy)];
    return `<div class="ff"><span class="sw" style="background:${F.c}"></span><div><b>${F.nm.replace(/"/g,'')}</b> <i style="color:${gone?'var(--dim)':L.c}">${gone?'不在大楼内':L.nm+' · '+f.n}</i><div>${FATES[F.id][gone?0:win?1:2]}</div></div></div>`;}).join('');
  const forces=[['mo','国防部'],['gs','总参谋部'],['mvd','内务部'],['mer','市政府'],['ost','奥斯坦金诺']].map(([k,n])=>{const v=S.pts[k];return row(n,v>=70?'支持苏维埃':v>=45?'动摇了':'支持克里姆林宫',v>=70?'p':v>=45?'':'n');}).join('');
  const mine=OUTLETS.filter(o=>outSt(S,o)==='vs').map(o=>o.nm).join(', ')||'无人';
  $('modal-win').innerHTML=`<h2>结局总结 · ${dateStr(S.day).toUpperCase()} 1993</h2><div class="sub">${win?'胜利：最高苏维埃守住了。':neu?'中立结局：大楼失守，但叶利钦在政治上遭到重创。':'失败：叶利钦获胜。'} ${A?'强攻持续了 '+A.r+' 小时（上限12小时）。':'强攻并未发生。'}</div>
   <div class="fin"><div><h3>数字</h3>
    ${row('自开始以来的天数',S.day)}${row('做出的决定',S.chron.length)}${row('合法性',S.leg)}${row('莫斯科支持苏维埃',S.city+'%')}
    ${row('剩余议员',deputies(S)+' / 265',deputies(S)<QUORUM?'n':'')}${row('离开的议员',st.depOut||0)}${row('返回的议员',st.depIn||0)}
    ${row('墙边的民众',fmt(S.ppl))}${row('战士',fmt(S.mil))}${A?row('死伤者',fmt(Math.round(A.lost||0)),'n'):''}
    ${A?row('进攻方伤亡',fmt(A.units.reduce((a,u)=>a+(u.lost||0),0)),'p'):''}${row('克里姆林宫对你们的行动次数',st.km||0)}${row('未执行的命令',st.fail||0)}
    <h3>兵力</h3>${forces}
    <h3>媒体站在你们一边</h3><div class="fo">${mine}</div>
    ${A&&A.muster?'<h3>最后一夜来的人</h3>'+A.muster.map(m=>`<div class="fo ${m.g?'p':'n'}">${m.t}</div>`).join(''):''}
   </div><div><h3>命运</h3>${facs}
    <div class="ff"><span class="sw" style="background:#b3322b"></span><div><b>哈斯布拉托夫与鲁茨科伊</b><div>${win?'直到提前选举前仍掌握权力。之后会发生什么，历史无从得知。':'莱福尔托沃。1994年2月26日，根据国家杜马的大赦获释。'}</div></div></div>
    <h3>事情的真相</h3><div class="fo">1400号总统令于9月21日发布。10月4日，新阿尔巴特桥上的坦克向白宫开火，傍晚，守卫者投降。据官方数字，约150人死亡。12月，新宪法获得通过。</div>
   </div></div><div class="sub" style="text-align:center;margin-top:6px">游戏《1993》· ${authorHTML()}</div><div class="close">ESC — 关闭</div>`;
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
[$('snd2').parentNode].forEach(b=>{const d=document.createElement('div');d.className='menub px';d.textContent='菜单';d.title='返回主菜单。党会保存下来';if(b.contains($('snd2')))d.style.cssText='right:132px;top:10px;font-size:8px;padding:6px 8px;z-index:3';d.onclick=e=>{e.stopPropagation();toMenu();};b.appendChild(d);});
// ---------- полный экран: кнопка видна только там, где браузер его даёт (на iPhone его нет — там игра ставится на экран «Домой») ----------
const FS={ el:()=>document.documentElement, can(){const e=this.el();return !!((document.fullscreenEnabled||document.webkitFullscreenEnabled)&&(e.requestFullscreen||e.webkitRequestFullscreen));},
  on:()=>!!(document.fullscreenElement||document.webkitFullscreenElement),
  sync(){const b=$('fsb'); if(!b)return; b.style.display=this.can()?'block':'none'; b.textContent=this.on()?'⤢ 退出全屏':'⤢ 全屏'; setTimeout(fit,60); setTimeout(fit,400);},
  toggle(){ try{ if(this.on()){(document.exitFullscreen||document.webkitExitFullscreen).call(document);return;}
      const e=this.el(), r=(e.requestFullscreen||e.webkitRequestFullscreen).call(e); const lock=()=>{try{const o=window.screen.orientation; if(o&&o.lock)o.lock('landscape').catch(()=>{});}catch(x){}}; if(r&&r.then)r.then(lock).catch(()=>{}); else lock(); }catch(x){} } };
document.addEventListener('fullscreenchange',()=>FS.sync());document.addEventListener('webkitfullscreenchange',()=>FS.sync());
{const b=$('fsb'); if(b)b.onclick=e=>{e.stopPropagation();FS.toggle();}; FS.sync();}
// ---------- шрифт: пиксельный по умолчанию, обычные подменяют те же два семейства (ширина подогнана, вёрстка не едет) ----------
const Font={ list:[['pix','像素'],['sans','常规'],['serif','衬线']],
  // fontv:2 — с версии 0.55 пиксельный шрифт по умолчанию; старый выбор («ОБЫЧНЫЙ» и т. д.) сбрасывается один раз
  cur(){const o=store.get(OPTS)||{}; if(o.fontv!==2) return 'pix'; return this.list.some(x=>x[0]===o.font)?o.font:'pix';},
  apply(){const k=this.cur(); let st=$('font-css'); if(!st){st=document.createElement('style');st.id='font-css';document.head.appendChild(st);} st.textContent=(typeof FONT_FACES!=='undefined'&&FONT_FACES[k])||''; document.documentElement.dataset.font=k;
    const b=$('fntb'); if(b)b.textContent='字体： '+this.list.find(x=>x[0]===k)[1]; const n=$('fntn'); if(n)n.style.display=k==='pix'?'none':'block'; },
  next(){const o=store.get(OPTS)||{}, i=this.list.findIndex(x=>x[0]===this.cur()); o.fontv=2; o.font=this.list[(i+1)%this.list.length][0]; store.set(OPTS,o); this.apply();} };
{const b=$('fntb'); if(b)b.onclick=e=>{e.stopPropagation();Font.next();}; Font.apply();}
// ---------- язык: переведённые копии скриптов (js/*.en.js и т. д.), выбор в настройках, смена = перезагрузка страницы ----------
const Lang={ list:[['','俄语'],['en','English'],['zh','中文'],['ko','한국어']], cur:()=>GL,
  note:{en:'Translations into English, Chinese and Korean have not been checked by anyone. We cannot guarantee their quality. The original game is in Russian, and the translation may be inaccurate.',zh:'英文、中文和韩文翻译未经任何人校对，无法保证翻译质量。游戏原文为俄语，译文可能不准确。',ko:'영어, 중국어, 한국어 번역은 아무도 검수하지 않았습니다. 번역 품질을 보장할 수 없습니다. 게임 원문은 러시아어이며, 번역이 부정확할 수 있습니다.'},
  sync(){const b=$('lngb'),p=$('lngp'); if(!b)return; if((typeof SINGLE!=='undefined'&&SINGLE)||!LANGS_ON){b.style.display='none';return;} b.textContent='⚑ '+this.list.find(x=>x[0]===GL)[1].toUpperCase()+' ▾';
    const N=this.note; p.innerHTML='<span class="lx" style="position:absolute;right:6px;top:2px;cursor:pointer;padding:0 4px">✕</span>'+this.list.map(x=>`<div class="l${x[0]===GL?' on':''}" data-l="${x[0]}">${x[1]}</div>`).join('')+`<div class="n">英文、中文和韩文译文均未经任何人核对，我们无法保证其质量。游戏原文为俄语，译文可能不准确。</div>`;
    p.querySelector('.lx').onclick=e=>{e.stopPropagation();p.style.display='none';}; p.querySelectorAll('.l').forEach(d=>d.onclick=e=>{e.stopPropagation();this.set(d.dataset.l);}); },
  set(l){ if(l===GL){$('lngp').style.display='none';return;} const o=store.get(OPTS)||{}; if(l)o.lang=l; else delete o.lang; store.set(OPTS,o); if(l&&window.Stat)Stat.ev('lang-'+l); location.href=location.pathname; } };
{const b=$('lngb'); if(b){b.onclick=e=>{e.stopPropagation();const p=$('lngp');p.style.display=p.style.display==='none'?'block':'none';}; Lang.sync();document.addEventListener('click',e=>{const p=$('lngp');if(p&&p.style.display!=='none'&&!p.contains(e.target)&&e.target!==b)p.style.display='none';});document.addEventListener('keydown',e=>{if(e.key==='Escape'){const p=$('lngp');if(p)p.style.display='none';}});}
 if(window.HTML_TR){const T=window.HTML_TR; const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT); let n; while(n=w.nextNode()){const k=n.nodeValue.trim(); if(k&&T[k]!==undefined&&!n.parentNode.closest('#lngp'))n.nodeValue=n.nodeValue.replace(k,T[k]);}
   document.querySelectorAll('[title]').forEach(e=>{if(T[e.title]!==undefined)e.title=T[e.title];});
   const st=document.createElement('style'); st.textContent='.law.done .t::after{content:"'+(T['  ✔ 已接受']||'  ✔')+'"}'+(typeof CJK_CSS!=='undefined'?CJK_CSS:''); document.head.appendChild(st);} }

drawMap(); applyOpts(); renderMenu(); show('title');

(function(){const v=document.getElementById('ver');if(v)v.textContent='版本 '+VERSION;})();

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
  const R=[['leg','合法性',20],['hope','决心',20],['rad','激进度',20],['city','莫斯科',20],['med','舆论',20],['ppl','民众',1000],['mil','民兵',200],['gun','武器',200],['sup','补给',3],['omon','OMON特警战备',30]];
  const b=(k,t,c)=>`<div class="law ck${c?' '+c:''}" data-k="${k}"><div class="t">${t}</div></div>`;
  win.innerHTML=`<h2>作弊 · 测试用</h2>${resStrip('')}
   <div class="sub">按键0打开和关闭此面板。在手机上：在标题页连续快速点按五次版本号，即可开启“作弊”按钮。</div>
   <div class="ph">跳转</div><div class="ckg">${b('go:decree','立即颁布第1400号总统令')+b('go:ost','事件“奥斯坦金诺”')+b('go:assault','直接进入强攻')+b('go:alpha','前往出入口的“阿尔法”')+b('go:epi','“各人结局”幻灯片')+b('x:night','结束回合')}</div>
   <div class="ph">指标</div><div class="ckg">${R.map(([k,n,v])=>b('r:'+k+':'+v,n+' +'+v)+b('r:'+k+':-'+v,n+' −'+v)).join('')}</div>
   <div class="ph">布局</div><div class="ckg">${b('x:all','全部拉满')+b('x:orders','命令 +5，决议 +3')+b('x:ptsup','所有兵力 +20')+b('x:ptsdn','所有兵力 −20')+b('x:loyup','所有派系更忠诚')+b('x:loydn','所有派系更激愤')+b('x:rne',S.fac.rne.n>0?'移除RNE':'RNE进入大楼')+b('x:ring',S.cordon?'解除封锁圈':'设立封锁圈')+b('x:power',S.flags.noPower?'恢复供电':'切断供电')+b('x:dep','议员 −60')+b('x:seen','重置提示信息')}</div>
   <div class="ph">展示结局</div><div class="ckg">${Object.keys(ENDINGS).map(id=>b('end:'+id,ENDINGS[id].h+' · '+({win:'胜利',neu:'中立',lose:'失败'})[endTier(id)])).join('')}</div>
   <div class="close xtop">✕ 关闭</div>`;
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
