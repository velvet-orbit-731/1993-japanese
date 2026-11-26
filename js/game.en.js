// ================= 1993 — game logic =================
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fmt=n=>Math.round(n).toLocaleString('ru-RU');
const MON=['January','February','March','April','May','June','July','August','September','October','November','December'];
const WD=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
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
    const good=(k==='rad'||k==='omon')?v<0:v>0; out.push(`<span class="${good?'p':'n'}">${RES_NAMES[k]} ${k==='sup'&&v%1?(v>0?'+':'−')+String(Math.abs(v)).replace('.',','):sg(v)}${k==='sup'?' d.':''}</span>`);}
  if(fx.pts)for(const p in fx.pts){const v=fx.pts[p];if(!v)continue;const nm=POINTS.find(q=>q.id===p).nm.replace(/ ↑.*/,'');
    out.push(`<span class="${v>0?'p':'n'}">${p===ctx?'loyalty':nm} ${v>=100?'— ours':sg(v)}</span>`);}
  if(fx.fac)for(const f in fx.fac){const d=fx.fac[f], nm=f===ctx?'':FACTIONS.find(F=>F.id===f).sh+': ';
    if(d.n)out.push(`<span class="${d.n>0?'p':'n'}">${nm}${d.n<=-900?'leaving':d.n>0?'+'+d.n+' people':d.n+' people'}</span>`);
    if(d.loy)out.push(`<span class="${d.loy>0?'p':'n'}">${nm}${d.loy>=2?'much more loyal':d.loy>0?'more loyal':d.loy<=-2?'very dissatisfied':'dissatisfied'}</span>`);}
  if(fx.pr)out.push(S&&S.phase===1?`<span class="${fx.pr>0?'n':'p'}">${fx.pr>0?'suspicions':'fewer suspicions'}</span>`:`<span class="${fx.pr>0?'n':'p'}">${fx.pr>0?'the assault is closer':'the assault is further off'}</span>`);
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
    document.querySelectorAll('.sndb').forEach(b=>{b.textContent='♪ SOUND: '+(on()?'ON':'OFF');b.classList.toggle('off',!on());});}
  return {has,on,sync,set(w){want=w;sync();},toggle(){const o=store.get(OPTS)||{};o.mute=!o.mute;store.set(OPTS,o);sync();}};})();
addEventListener('pointerdown',()=>Music.sync());addEventListener('keydown',()=>Music.sync());

// ---------- intro: a slide show before a new game ----------
const INTRO=[
  {pic:['wh'],      st:'MOSCOW · 1993', t:'The Soviet Union has been gone for two years. Prices are free, savings have burned up, factories stand without wages. The country lives under the 1978 Constitution of the RSFSR, which has already been amended hundreds of times.'},
  {pic:['yeltsin'], st:'PRESIDENT',      t:'Boris Yeltsin was elected in June 1991. He is carrying out market reforms and believes parliament will not let him finish them. He needs a new Constitution with a strong president.'},
  {pic:['hasb'],    st:'PARLIAMENT',      t:'The Congress of People\'s Deputies and the Supreme Soviet were elected in 1990. Under the current Constitution supreme power in the country is theirs. The chairman of the Supreme Soviet is Ruslan Khasbulatov, yesterday\'s ally of Yeltsin.'},
  {pic:['yeltsin','hasb'], st:'DUAL POWER', t:'In December 1992 the Congress refused to confirm Gaidar as prime minister. In March 1993 it tried to remove the president and fell 72 votes short. Every law and every decree is now overturned by the other side.'},
  {pic:['wh'],      st:'25 APRIL · "YES, YES, NO, YES"', t:'In the referendum the majority backed the president and his reforms. But there will be no early elections for anyone. Both sides have declared victory.'},
  {pic:['rutskoy'], st:'VICE-PRESIDENT', t:'Alexander Rutskoy, a general and Hero of the Soviet Union, has gone over to the parliament\'s side and promised suitcases of compromising material on the ministers. On 1 September Yeltsin removed him from office by decree. The Supreme Soviet considers the decree illegal.'},
  {pic:['wh'],      st:'14 SEPTEMBER',    t:'You are the Supreme Soviet. You have a building on Krasnopresnenskaya Embankment, 265 deputies, the law, and those who come to its walls. The president has promised the army a "decisive September". Nobody knows what comes next.'},
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
const OWN_NM={vs:'for the Supreme Soviet',kr:'for the Kremlin',neu:'between the two powers'};
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
  add(whYield(S).leg,'the Congress at work'); add(-(S.phase===2?4:1),S.phase===2?'the dual power has dragged on':'weariness of the standoff');
  if(kremlinVoice()-mediaIncome()>=6)add(S.phase===2?-2:-1,'the Kremlin\'s press is louder than yours');
  const lm=Math.round((S.city-50)/20); add(lm,lm>0?'Moscow is with you':'Moscow is against');
  if(S.cordon)add(ringPress(S).leg,'the building is in the ring');
  if(S.phase===2&&deputies(S)<QUORUM)add(-3,'no quorum');
  if(S.phase===2&&S.med<5)add(-1,'nothing to answer with on air');
  return {v:P.reduce((a,p)=>a+p[0],0),P};}
const pressLeg=S=>OUTLETS.reduce((a,o)=>{const st=outSt(S,o),e=st==='vs'?o.pas:st==='kr'?o.kpas:null;return a+((e&&e.fx.leg)||0);},0);
// давление кольца за ночь; S.hold — что игрок оплачивает, чтобы терпеть
function ringPress(S){const h=S.hold||{}, hv=(S.ring==null?100:S.ring)>=50; return {leg:h.cour?(hv?-2:-1):(hv?-4:-2), hope:h.ration?0:(hv?-3:-2), sup:(h.port||S.flags.gap>0)?0:(hv?.6:.4), med:h.cour?0:(hv?-2:-1), dep:h.cour?0:(hv?4:2)};}
function syncRing(){ if(S.cordon){ if(S.ring==null)S.ring=100; if(S.ring<=0){S.cordon=0;S.ring=null;S.flags.ringOff=1;S.flags.gap=0;S.hold={};apply({hope:5,leg:3});log('The ring is lifted: people and vehicles are going to the White House again.');} } else S.ring=null; }
function halve(fx){const o={};for(const k in fx){const v=fx[k]; o[k]=typeof v==='object'?halve(v):(v<0?Math.ceil(v/2):Math.floor(v/2));}return o;}
// лояльность фракций двигается каждую ночь: её тянут издания, которые фракция читает, и общее положение дел
function facDrift(){const out=[]; for(const F of FACTIONS){const f=S.fac[F.id]; f.tr=null; if(F.kind!=='dep'||f.n<=0)continue; let v=0; const up=[],dn=[];
    for(const id of FAC_PRESS[F.id]||[]){const o=OUTLETS.find(x=>x.id===id),st=outSt(S,o); if(st==='vs'){v+=.34;up.push(o.nm+' for you');} else if(st==='kr'){v-=.34;dn.push(o.nm+' at the Kremlin');}}
    const mod=['agr','sm','kol'].includes(F.id);
    if(S.hope>=70){v+=.2;up.push('the building believes in success');} else if(S.hope<45){v-=.3;dn.push('Resolve is falling');}
    if(S.cordon&&mod){v-=.25;dn.push('the building is in the ring');}
    if(S.fac.rne.n>0&&mod){v-=.2;dn.push('RNE in the building');}
    if(S.rad>=60){ if(mod){v-=.3;dn.push('radicals at the microphone');} else{v+=.2;up.push('a serious conversation has started');} }
    f.dr=clamp((f.dr||0)+v,-1.6,1.6);
    if(f.dr>=1&&f.loy<10){f.dr-=1;f.loy++;f.tr={d:1,why:up[0]||'things are moving'};} else if(f.dr<=-1&&f.loy>0){f.dr+=1;f.loy--;f.tr={d:-1,why:dn[0]||'fatigue'};}
    if(f.tr)out.push(F.sh+(f.tr.d>0?' ↑':' ↓')+' ('+f.tr.why+')');} return out;}
function renderHud(p){
  $(p+'-day').textContent='DAY '+S.day;
  $(p+'-date').textContent=dateStr(S.day).toUpperCase();
  $(p+'-wd').textContent=WD[dateOf(S.day).getDay()]+' · '+PHASE_NM[S.phase];
  const cur=snap();
  const R=[['leg','Legitimacy'],['dep','Deputies'],['ppl','People'],['mil','Militia'],['gun','Weapons'],['med','Airtime'],['sup','Supplies']];
  if(S.phase===1)R.splice(3,1);
  $(p+'-res').innerHTML=R.map(([k,nm])=>{const d=Math.round(cur[k]-(S.am?S.am[k]:cur[k]));
    let dl=d>0?`<span class="dlt up">+${fmt(d)}</span>`:d<0?`<span class="dlt dn">−${fmt(-d)}</span>`:'';
    if(k==='med')dl=`<span class="dlt up">+${mediaGain()}/turn</span>`;
    if(k==='gun'&&S.mil>0)dl=`<span class="dlt">free ${fmt(freeGuns(S))}</span>`;
    if(k==='dep'){const r=S.depRate||0;dl=`<span class="dlt">${S.away?'−'+S.away+' en route · ':''}${S.phase===2&&r>0?'quorum ≈ '+Math.max(0,Math.ceil((cur.dep-QUORUM)/r))+' d.':'of 265'}</span>`;}
    if(k==='leg'){const f=legDrift(S).v+pressLeg(S);dl=`<span class="dlt ${f<0?'dn':'up'}">overnight ${f?sg(f):'0'}</span>`;}
    const warn=(k==='sup'&&S.sup<=2)||(k==='leg'&&S.leg<=20)||(k==='med'&&S.med<10&&S.phase>1)?' warn':'';
    const v=k==='sup'?Math.floor(S.sup)+' d.':fmt(cur[k]);
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
  let tl='<div class="lbl px">CHRONOLOGY</div>';
  for(let d=start;d<start+14;d++){const n=dateOf(d).getDate();const cls=d<S.day?'past':d===S.day?'now':(d>=aday&&d<=aday+(S.phase===1?0:1))?'risk':'';
    tl+=`<div class="c ${cls}">${n}${cls==='risk'?' ?':''}</div>`;}
  $('tl').innerHTML=tl;
  // meters
  seg('hope',S.hope); seg('rad',S.rad); seg('city',S.city); $('m-city').textContent=S.city+'%';
  $('m-hope').textContent=S.hope+'%';
  $('m-rad').textContent=S.rad+'%'+(S.rad>=50?' ▲':''); $('m-rad').className=S.rad>=50?'warn':'';
  $('m-a1').textContent=S.phase===1?'THE KREMLIN\'S SUSPICIONS':'TO THE ASSAULT';
  $('m-a2').textContent=S.phase===1?'the White House is being watched':'according to Interior Ministry rumours';
  $('m-assault').textContent=S.phase===1?(S.pr>=15?'strong':S.pr>=6?'growing':'weak'):'≈'+eta+' d.';
  $('m-hl').textContent=S.phase===1?'Supreme Soviet\'s Resolve':'Defenders\' Resolve';
  // points
  const map=$('map'); map.querySelectorAll('.pt,.tag').forEach(e=>e.remove());
  for(const p of POINTS){const v=S.pts[p.id];const d=document.createElement('div');
    d.className='pt lp-'+(MAP_LP[p.id]||p.lp||'b')+(p.big?' big':'')+(S.sel===p.id?' sel':'');
    d.style.left=(2+p.x*4)+'px';d.style.top=(p.y*4)+'px';d.style.setProperty('--c',`var(--${own(v)})`);
    const who=PEOPLE[POINT_WHO[p.id]];
    d.innerHTML=`<div class="mk">${p.ic}</div><div class="lb"><div class="pc">${who&&who.img?faceHTML(POINT_WHO[p.id]):''}<div class="pi"><div class="nm">${p.nm.replace(/ ↑.*/,'')}</div>${who?`<div class="wn">${who.nm.split(' ').slice(-1)[0]}</div>`:''}<div class="bar"><i style="width:${v}%"></i></div></div></div></div>`;
    d.querySelector('.mk').onclick=d.querySelector('.pc').onclick=()=>{S.sel=p.id;renderMap();firstLook('p',p.id);};
    map.appendChild(d);}
  syncRing(); const tags=[]; if(S.cordon)tags.push({x:12,y:2,t:'Ring '+S.ring+(S.flags.gap>0?', there is a gap':'')+' ▸ how to lift it',c:'btn',on:openSiege});
  if(S.flags.noComms)tags.push({x:12,y:7,t:'No connection: phones and newsrooms are cut off ▸',c:'btn red',on:openSiege});
  if(S.strike){const T=STRIKES.find(x=>x.id===S.strike.id);tags.push({x:12,y:S.flags.noComms&&S.cordon?12:(S.flags.noComms||S.cordon)?7:2,t:'Yeltsin\'s strike overnight: '+T.nm+(T.cover(S)?' · covered':' · not covered')+' ▸',c:'btn'+(T.cover(S)?'':' red'),on:openStrike});}
  if(S.phase>1&&S.rad>=40)tags.push({x:84.5,y:95.5,t:'Clashes',c:'red'});
  for(const tg of tags){const d=document.createElement('div');d.className='tag '+tg.c;d.textContent=tg.t;d.style.left=(tg.x*4-40)+'px';d.style.top=(tg.y*4+4)+'px';if(tg.on)d.onclick=tg.on;map.appendChild(d);}
  drawMapDynamic({cordon:S.cordon,crowds:[[84,76,Math.round(6+S.rad*.6),'#c0473a'],[78,50,Math.round(Math.min(60,(S.ppl+S.mil)/80)),'#c0473a'],[88,79,S.phase===1?0:S.cordon?24:12,'#7fa0cf']]});
  renderTarget(); drawFaces($('s-map'));
  // log
  $('log').innerHTML=S.log.slice(0,3).map((l,i)=>`<div class="${i===0&&l.day===S.day?'new ':''}${l.cls}"><span class="tm">${l.day===S.day?l.tm:'yesterday'}</span>${l.text}</div>`).join('')||'<div>Morning. Awaiting orders.</div>';
  // buttons
  $('laws-n').textContent='available: '+lawsAvail(); $('b-laws').classList.toggle('none',!lawsAvail());
  $('orders').textContent='ENTER · orders: '+S.orders;
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
  if(a.once&&S.once[pid+i])return 'already done';
  if(S.used[pid+i])return 'already today';
  if(a.phone&&S.flags.noComms)return 'telephones cut off';
  if(S.cordon&&pid!=='wh'&&!a.phone&&!/оцеплением/.test(a.t)&&!(S.flags.gap>0||S.flags.tunnel))return 'ring: no getting past the wire';
  if(a.req){const r=a.req(S);if(r!==true)return r;}
  if(a.dep&&deputies(S)-S.away<a.dep)return 'not enough free deputies';
  if(!S.orders)return 'no orders until morning';
  return true;}
function renderTarget(){
  const p=POINTS.find(q=>q.id===S.sel), v=S.pts[p.id], o=own(v);
  const acts=actsOf(p.id).map(({a,i},n)=>{const st=actState(p.id,i);
    const f0=actFx(p.id,i), kf=inflOf(p.id,i);
    let cost=a.chance?fxText(a.cost||{},p.id):fxText(f0,p.id);
    if(a.chance&&!cost)cost=fxText(a.ok,p.id);
    if(a.dep)cost=`Deputies: ${a.dep}`+(cost?' · '+cost:'');
    if(!a.chance&&kf<1)cost+=(cost?' · ':'')+`<span class="risk">${kf<0?'they no longer listen to you':'it has worn thin: effect '+Math.round(kf*100)+'%'}</span>`;
    if(a.risk)cost+=(cost?' · ':'')+`<span class="risk">${a.risk}</span>`;
    if(st!==true)cost=`<span class="risk">${st}</span>`;
    return `<div class="act${st!==true?(S.used[p.id+i]||S.once[p.id+i]?' done':' off'):''}" data-i="${i}"><span class="k">${n+1}</span><span class="t">${a.t}</span><span class="cost">${cost}</span></div>`;}).join('');
  const W=PEOPLE[POINT_WHO[p.id]];
  $('target').innerHTML=`<div class="who">${faceHTML(POINT_WHO[p.id],'big')}<div><h3>${p.full}</h3>
    <div class="own"><b>${W.nm}</b>, ${W.role}</div>
    <div class="own">${S.phase===1?'Moods':'Control'}: <span style="color:${OWN_COL[o]}">${OWN_NM[o]}</span></div></div></div>
    <div class="split"><div class="a" style="width:${v}%"></div><div class="b" style="width:${100-v}%"></div></div>
    <div class="split-l"><span>SOVIET ${v}%</span><span>Kremlin ${100-v}%</span></div>
    <div class="facts">${(T=>T?`<span class="${tugSide(v)==='vs'?'p':'n'}">Each night now: ${T.t}${fxText(T.fx)?' ('+fxText(T.fx).replace(/<[^>]+>/g,'')+')':''}${T.ph&&S.phase<T.ph?' — since the start of the crisis':''}</span><br>`:POINT_TUG[p.id]?'From 65% it works for you every night, down to 35% it works for the Kremlin.<br>':'')(POINT_TUG[p.id]&&tugSide(v)&&POINT_TUG[p.id][tugSide(v)])}${(p.id==='mo'||p.id==='gs')&&S.phase===2?`In the assault ${p.id==='mo'?'tanks':'motor rifles'}: <span style="color:var(--paper)">${v>=65?'will not come out':v>=45?'will go in at half strength':'will carry out the order'}</span> (from 45 they waver, from 65 they refuse). `:''}${p.id==='mvd'&&S.phase===2?`<span style="color:var(--paper)">OMON: readiness ${S.omon==null?100:S.omon}%</span> (wavers at 60 and below, will not go at 30 and below). `:''}${p.id==='wh'?'The Congress sits here. The factions and the work of the Soviet are on the "White House" screen.':''}${p.id!=='wh'?`<span style="color:var(--paper)">Order carried out: ${Math.round(execChance(p.id)*100)}%</span>${S.flags.noComms?' (no communications: −15%)':''}`:''}</div>
    <div class="acts">${acts}</div>`;
  $('target').querySelectorAll('.act').forEach(e=>e.onclick=()=>doAction(p.id,+e.dataset.i));
}
function doAction(pid,i){
  if(i===undefined||actState(pid,i)!==true)return;
  const a=ACTIONS[pid][i]; let fx, txt; S.uses=S.uses||{};
  if(Math.random()>execChance(pid)){S.orders--; S.used[pid+i]=1; log(POINTS.find(q=>q.id===pid).nm.replace(/ ↑.*/,'')+': the Supreme Soviet\'s order was not carried out. Legitimacy is not enough.','bad'); Sfx.play('fail'); S.st=S.st||{}; S.st.fail=(S.st.fail||0)+1; save(); renderMap(); return;}
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
  $('modal-win').innerHTML=`<h2>RESOLUTIONS OF THE SUPREME SOVIET</h2>${resStrip('law')}<div class="sub">${n?'Can pass: '+n+'. A new one every two days. The higher the Legitimacy, the stronger the resolution works (now ×'+(.5+S.leg/100).toFixed(1)+').':'Cannot pass one today. A new resolution every two days.'}</div>`+
    LAWS.filter(inPh).map(l=>`<div class="law${S.laws[l.id]?' done':!n?' lock':''}" data-id="${l.id}"><div class="t">${l.t}</div><div class="d">${l.d}</div><div class="e">${S.laws[l.id]?'passed':(!n?'<span class="n">no free resolution: a new one every two days</span> · ':'')+fxText(lawFx(l))}</div></div>`).join('')+
    `<div class="close">ESC — close</div>`;
  $('modal').classList.add('on');
  $('modal-win').querySelectorAll('.law').forEach(e=>e.onclick=()=>{const l=LAWS.find(x=>x.id===e.dataset.id);
    if(S.laws[l.id]||!S.lawCharges)return; Sfx.play('stamp'); S.laws[l.id]=1;S.lawCharges--;S.did.law=1; if(l.flag)S.flags[l.flag]=1; apply(lawFx(l));
    log('Resolution passed: «'+l.t+'».'); closeModal(); if(checkLose())return; save(); showMain();});
  $('modal-win').querySelector('.close').onclick=closeModal;
}
// ---------- media: channels bring Эфир every night, appeals spend it ----------
let etherSel=null;
function outWayState(o,k){const W=OUT_WAYS[k]; if(S.appeals.pull)return 'already worked with a newsroom today'; return W.req(S,o);}
function outWin(o,k){const W=OUT_WAYS[k]; if(outWayState(o,k)!==true||outLocked(S,o))return; const st=outSt(S,o);
  apply(W.cost(o)); if(W.order)S.orders--; if(W.run)W.run(S); S.appeals.pull=1; S.did.media=1; Sfx.play(k==='p'?'crowd':k==='z'?'stamp':'paper');
  if(W.chance&&Math.random()>W.chance){apply({city:-3}); log('Airtime: '+o.nm+' — the pressure failed, the newsroom writes about "rioters".');}
  else{S.out[o.id]=st==='kr'?'neu':'vs'; log('Airtime: '+o.nm+(st==='kr'?' no longer sings in the Kremlin\'s voice.':' now gives the floor to the Supreme Soviet.'));}
  save(); showMain(); openEther();}
function outActState(o,a,key){if(S.flags.noComms&&o.id!=='radio'&&o.id!=='for')return 'no connection'; if(S.appeals[key])return 'already happened today'; if(S.med<a.cost)return 'needs '+a.cost+' Airtime'; return true;}
function outAct(o,a,key){if(outActState(o,a,key)!==true)return; Sfx.play(/echo|radio|ost|pch|600|for/.test(o.id)?'pips':'teletype'); S.med-=a.cost; S.appeals[key]=1; S.did.media=1; apply(fxOf(a)); if(a.run)a.run(S); log(o.nm+': '+a.t.toLowerCase()+'.'); save(); showMain(); openEther();}
const UNIT_SH={tanks:'tanks',taman:'motor rifles',vv:'Interior Troops',omon:'OMON',alpha:'"Alpha"'};
function finTxt(fx){if(!fx)return '';const o=[],pc=k=>(k<1?'−':'+')+Math.round(Math.abs(1-k)*100)+'%';
  if(fx.air)o.push('Airtime '+sg(fx.air)); if(fx.hope)o.push('Resolve '+sg(fx.hope)); if(fx.inc)o.push('+'+fx.inc+' people'); if(fx.ppl)o.push('People '+sg(fx.ppl));
  if(fx.mil)o.push('fighters '+sg(fx.mil)); if(fx.ctl)o.push('entrances '+sg(fx.ctl)); if(fx.all)o.push('pressure '+pc(fx.all));
  if(fx.u)for(const k in fx.u)if(fx.u[k]!==1)o.push(UNIT_SH[k]+' '+pc(fx.u[k])); return o.join(', ');}
function openEther(){
  const inc=mediaIncome(), kv=kremlinVoice(), dc=cityShift();
  let o=OUTLETS.find(x=>x.id===etherSel); if(!o){o=OUTLETS.find(x=>outSt(S,x)==='vs'&&x.act)||OUTLETS[0]; etherSel=o.id;}
  const SN={vs:'for the Soviet',neu:'neutral',kr:'for the Kremlin',off:'closed'}, ord={vs:0,neu:1,kr:2,off:3};
  const rows=OUTLETS.slice().sort((a,b)=>ord[outSt(S,a)]-ord[outSt(S,b)]||b.r-a.r).map(x=>{const st=outSt(S,x), fv=(x.pas&&fxText(x.pas.fx))||'', fk=(x.kpas&&fxText(x.kpas.fx))||'', pl=t=>t.replace(/<[^>]+>/g,'');
    const can=st!=='vs'&&st!=='off'&&!outLocked(S,x), fresh=st==='vs'&&x.act&&!S.appeals['o'+x.id];
    return `<tr class="s-${st}${etherSel===x.id?' sel':''}" data-o="${x.id}"><td class="nm">${x.nm}</td><td class="r">${x.r}</td><td class="st">${SN[st]}${st!=='vs'&&st!=='off'?(can?'':' · cannot take'):''}</td><td>${x.aud||''}</td>
      <td class="${st==='vs'?'':'dim'}">${x.act?x.act.t+(fresh?' <i>●</i>':''):''}</td>
      <td class="${st==='vs'?'':'dim'}">${st==='vs'?fv:pl(fv)}</td><td class="${st==='kr'?'':'dim'}">${st==='kr'?fk:pl(fk)}</td></tr>`;}).join('');
  const st=outSt(S,o); let det=`<div class="odet"><div class="ph">PUBLICATION · ${st==='vs'?'yours: assign (once a day)':st==='off'?'not working':'how to pull it over (one a day'+(S.appeals.pull?', already done':'')+')'}</div><div class="oh"><b>${o.nm}</b> <span>reach ${o.r} · ${SN[st]}. ${o.about||''}</span></div><div class="obtn">`;
  if(st==='vs'){det+=[['o'+o.id,o.act],['p'+o.id,o.act2]].filter(x=>x[1]).map(([key,a])=>{const s2=outActState(o,a,key);return `<div class="law oact${s2!==true?' lock':''}" data-k="${key}"><div class="t">${a.t} <span class="cst">Airtime −${a.cost}</span></div><div class="e">${s2===true?[fxText(fxOf(a)),a.e].filter(Boolean).join(' · '):`<span class="n">${s2}</span>`}</div></div>`;}).join('');}
  else if(st==='off')det+=`<div class="oa n">Not working now.</div>`;
  else if(outLocked(S,o))det+=`<div class="oa n">Cannot be pulled over.</div>`;
  else det+=(o.ways||'').split('').map(k=>{const W=OUT_WAYS[k], s2=outWayState(o,k), c=fxText(W.cost(o))||(k==='z'?'resolution':'');return `<div class="law oway${s2!==true?' lock':''}" data-w="${k}"><div class="t">${W.t} <span class="cst">${c||'order'}</span></div><div class="e">${s2===true?W.d(o)+(st==='kr'?'. Will become neutral':'. Will become yours'):`<span class="n">${s2}</span>`}</div></div>`;}).join('');
  det+='</div></div>';
  const win=$('modal-win'); win.classList.add('wide');
  win.innerHTML=`<h2>AIRTIME · THE FIGHT FOR MOSCOW</h2>
   <div class="tug"><span class="l">for the Soviet ${S.city}%</span><div class="tb"><i style="width:${S.city}%"></i></div><span class="r">for the Kremlin ${100-S.city}%</span></div>
   ${resStrip('med')}
   <div class="sub">Your voice <b style="color:var(--ok)">${inc}</b> against the Kremlin's <b style="color:#7fa0cf">${kv}</b>: Moscow <b class="${dc<0?'n':'p'}">${dc?sg(dc):'unchanged'}</b> overnight. Moscow's levers: "MK" and "Echo of Moscow" (each one yours gives +1 overnight, now +${moscOut()}), the campaigns below, rebuttals in the morning paper. Choose a publication in the table.${S.flags.noComms?' <span class="n">No connection: only the building\'s radio, foreigners and those let inside still work.</span>':''}${S.kmed?' <span class="n">Overnight the Kremlin hit the airwaves.</span>':''}</div>
   <table class="otab"><tr><th>Publication</th><th>Reach</th><th>Whose</th><th>Affects</th><th>What it does when yours</th><th>Each turn while yours</th><th>while the Kremlin's</th></tr>${rows}</table>
   <div class="eth3">${det}<div><div class="ph">GENERAL CAMPAIGNS · not tied to a publication, cost Airtime (now ${fmt(S.med)})</div><div class="app2 a1">`+
   APPEALS.filter(inPh).map(a=>{const nc=S.flags.noComms&&a.id!=='foreign', used=S.appeals[a.id]||nc, poor=S.med<a.cost;
     return `<div class="law gen${nc?' lock':used?' done2':poor?' lock':''}" data-id="${a.id}"><div class="t">${a.t} <span class="cst">Airtime −${a.cost}</span></div><div class="e">${nc?'<span class="n">no connection</span>':used?'already happened today':poor?'<span class="n">not enough Airtime: needs '+a.cost+'</span>':[fxText(fxOf(a)),a.e].filter(Boolean).join(' · ')}</div></div>`;}).join('')+
   `</div></div></div><div class="close xtop">✕ CLOSE</div>`;
  $('modal').classList.add('on');
  win.querySelectorAll('tr[data-o]').forEach(e=>e.onclick=()=>{etherSel=e.dataset.o;openEther();});
  win.querySelectorAll('.oway').forEach(e=>e.onclick=()=>outWin(o,e.dataset.w));
  win.querySelectorAll('.oact').forEach(e=>e.onclick=()=>{const key=e.dataset.k;outAct(o,key[0]==='o'?o.act:o.act2,key);});
  win.querySelectorAll('.law.gen').forEach(e=>e.onclick=()=>{const a=APPEALS.find(x=>x.id===e.dataset.id);
    if(S.appeals[a.id]||S.med<a.cost||(S.flags.noComms&&a.id!=='foreign'))return; S.med-=a.cost; S.appeals[a.id]=1; S.did.media=1; apply(fxOf(a)); if(a.run)a.run(S); if(a.id==='deny')S.kmed=0; log('Airtime: '+a.t.toLowerCase()+'.'); save(); showMain(); openEther();});
  win.querySelector('.close').onclick=closeModal;
}
function siegeState(i){const a=SIEGE[i]; if(a.once&&S.flags[a.once])return 'already done'; const r=a.req(S); if(r!==true)return r; if(!S.orders)return 'no orders until morning'; return true;}
function openSiege(){ syncRing();
  const win=$('modal-win'); win.classList.add('wide');
  const L=SIEGE.map((a,i)=>({a,i,st:siegeState(i)})), can=x=>x.st===true;
  const card=({a,i,st})=>`<div class="law${st===true?'':st==='already done'?' done2':' lock'}" data-i="${i}"><div class="t">${a.t} <span class="cst">${[a.ring?'<span class="p">Ring −'+Math.min(a.ring,S.ring||0)+'</span>':'',fxText(a.fx)].filter(Boolean).join(' · ')}</span></div><div class="e">${st===true?a.d:st==='already done'?'already done':`<span class="n">${st}</span>`}</div></div>`;
  const grp=(t,l)=>l.length?`<div class="ph">${t}</div><div class="sg2">${l.map(card).join('')}</div>`:'';
  const ringL=L.filter(x=>x.a.ring&&x.a.ring<100), sum=ringL.filter(can).reduce((a,x)=>a+x.a.ring,0), oth=L.filter(x=>!x.a.ring||x.a.ring>=100).filter(x=>S.cordon||!/кольца нет/.test(x.st));
  win.innerHTML=`<h2>BLOCKADE${S.cordon?' · RING '+S.ring+' OUT OF 100':''}</h2>${resStrip('ord')}${S.cordon?`<div class="tug"><span class="l">lifted ${100-S.ring}</span><div class="tb"><i style="width:${100-S.ring}%"></i></div><span class="r">left ${S.ring}</span></div>`:''}
   <div class="sub">${S.cordon?(RP=>'The ring tonight: <span class="n">Legitimacy '+RP.leg+(RP.hope?', Resolve '+RP.hope:'')+(RP.med?', Airtime '+RP.med:'')+(RP.sup?', Supplies −'+String(RP.sup).replace('.',',')+' d.':'')+(RP.dep?', a further '+RP.dep+' deputies leave':'')+'</span>, people do not come, you cannot get past the wire. '+(S.ring>=50?'Below 50 it presses more weakly. ':'The ring is weakened: it presses more weakly. ')+'Each night it is pulled tighter by 2. <b style="color:var(--paper);font-weight:400">Left to lift '+S.ring+'; the open routes now give −'+sum+'.</b>'+(S.flags.gap>0?' <span class="p">There is a gap: another '+S.flags.gap+' nights.</span>':''))(ringPress(S)):'No ring. Here communications and light are being restored.'}
   ${S.flags.noComms?' <span class="n">No connection.</span>':''}${S.flags.noPower?' <span class="n">Light and water cut off by the City Hall.</span>':''}</div>`+
   (S.cordon?`<div class="ph">ENDURE AND PAY · every night, an order is not spent, can be cancelled</div><div class="sg3">`+HOLDS.map(H=>{const on=(S.hold||{})[H.id],c=H.can(S);return `<div class="law hold${on?' on2':c!==true?' lock':''}" data-h="${H.id}"><div class="t">${H.t} <span class="cst">${fxText(H.cost)} per night</span></div><div class="e">${on?'<span class="p">✓ on.</span> '+H.d+'. Click to cancel':c!==true?`<span class="n">${c}</span>`:H.d}</div></div>`;}).join('')+'</div>':'')+
   (S.cordon?grp('LIFT THE RING IN PARTS · OPEN NOW · each action spends an order',ringL.filter(can))+grp('LIFT THE RING IN PARTS · CLOSED FOR NOW (shows what is missing)',ringL.filter(x=>!can(x))):'')+
   grp(S.cordon?'BREAKTHROUGH, BYPASS, COMMUNICATIONS AND LIGHT':'COMMUNICATIONS AND LIGHT',oth.filter(can).concat(oth.filter(x=>!can(x))))+`<div class="close xtop">✕ CLOSE</div>`;
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
  $('modal-win').innerHTML=`<h2>${kind==='p'?P.full:P.nm.replace(/"/g,'«').replace(/«([^«]*)«/,'«$1»').toUpperCase()}</h2><div style="display:flex;gap:14px;align-items:flex-start;margin-top:10px">${W?faceHTML(who,'big'):''}<div class="sub" style="margin:0;font-size:18px;line-height:21px">${W?`<b style="color:var(--paper);font-weight:400">${W.nm}</b>, ${W.role}<br><br>`:''}${txt}</div></div><div class="law" id="fl-ok" style="margin-top:16px;text-align:center"><div class="t">OK</div></div>`;
  $('modal').classList.add('on'); drawFaces($('modal-win')); $('fl-ok').onclick=closeModal;}
function resStrip(hl){const it=[['leg','Legitimacy',S.leg],['dep','Deputies',deputies(S)],['ppl','People',fmt(S.ppl)],['mil','Militia',fmt(S.mil)],['gun','Weapons free',fmt(freeGuns(S))],['med','Airtime',fmt(S.med)+' <i>+'+mediaGain()+' per turn</i>'],['sup','Supplies',Math.floor(S.sup)+' d.'],['hope','Resolve',S.hope+'%'],['rad','Radicalism',S.rad+'%'],['city','Moscow',S.city+'%'],['ord','Orders',S.orders],['law','Resolutions',S.lawCharges]];
  return '<div class="rstrip">'+it.map(([k,n,v])=>`<span class="${k===hl?'hl':''}">${n} <b>${v}</b></span>`).join('')+'</div>';}
function openStrike(){const T=S.strike&&STRIKES.find(x=>x.id===S.strike.id); if(!T)return; const ok=T.cover(S);
  $('modal-win').innerHTML=`<h2>YELTSIN'S MAIN STRIKE · ${T.nm.toUpperCase()}</h2><div class="sub">${T.warn}<br><br>Tonight's blow falls on one place and will be heavy: ${fxText(T.hit(S))||T.e}${T.e&&fxText(T.hit(S))?' · <span class="n">'+T.e+'</span>':''}.<br><br>To cover it: <b style="color:var(--paper)">${T.guard}</b>. ${ok?'<span class="p">Already covered today.</span>':'<span class="n">Not covered yet.</span>'}${S.flags.shield?'<br>Compromising material in play: if the strike goes ahead, it will be at half strength.':'<br>The "compromising material on the government" campaign in Airtime will halve the strike.'}</div><div class="close">ESC — close</div>`;
  $('modal').classList.add('on'); $('modal-win').querySelector('.close').onclick=closeModal;}

function openHelp(){
  const LD=legDrift(S);
  const H=[['Legitimacy','chance that the order outside the walls is carried out (now '+Math.round(execChance('x')*100)+'%), resolution multiplier, checks in the events. There is no ceiling, but it drains every night, and above 70 any gain gives only half as much. Overnight now: '+LD.P.map(p=>p[1]+' '+sg(p[0])).join(', ')+', publications '+(pressLeg(S)?sg(pressLeg(S)):'0')+'.'],
   ['Deputies','their number is the mandate itself. Every five who leave in a day cost 1 Legitimacy. In the crisis they are worn down: someone leaves every night, more under the ring, without light and after Yeltsin\'s "guarantees"; Resolve and the factions\' loyalty hold them back. Fewer than '+QUORUM+' — no quorum, Legitimacy −3 overnight.'],
   ['People','hands: pickets, supply convoys, barricades, putting out fires. In the crisis fewer than '+PERIM+' — the perimeter is empty, Resolve −2 overnight. From 2500 the Kremlin hesitates over the assault, but the crowd eats supplies and raises radicalism.'],
   ['Militia','people with weapons: they hold the entrances during the assault, from 200 they raise Resolve, and they open the force options.'],
   ['Weapons','weapons. An armed person becomes a militia fighter and keeps the weapon on them: the stock does not shrink, only the free weapons do.'],
   ['Airtime','the only media currency. It arrives every night from the publications on your side. It is spent on newsrooms, campaigns and replies to the papers; it converts into Legitimacy, Moscow and faction loyalty.'],
   ['Supplies','days of food and diesel. Zero: people leave, Resolve falls.'],
   ['Moscow','the mood of the city: inflow of people, Legitimacy, the speed of the assault. Decided on the airwaves.'],
   ['Resolve','unity of the house: below 45% deputies leave faster. Zero: the end.'],
   ['Radicalism','the stakes: unlocks the force options, closes the negotiations; from 60% the Kremlin strikes harder.'],
   ['Forces on the map','a rope between the Soviet and the Kremlin. From 65% the force works for you every night, down to 35% it works for the Kremlin. The Kremlin pulls everyone toward itself every night, and every two or three days Yeltsin strikes one of them in earnest: the paper warns in the morning.'],
   ['Ring','the building\'s cordon, 0–100. While it stands, every night it hits Legitimacy, Resolve, Airtime, Supplies and draws deputies away; below 50 it presses more weakly. You can endure it and pay (couriers, double rations, porters) or lift it in parts: the "Blockade" window on the map.']];
  $('modal-win').innerHTML='<h2>INDICATORS: WHAT AFFECTS WHAT</h2>'+H.map(h=>`<div class="hlp"><b>${h[0]}</b><span>${h[1]}</span></div>`).join('')+'<div class="close">ESC — close</div>';
  $('modal').classList.add('on'); $('modal-win').querySelector('.close').onclick=closeModal;
}
function closeModal(){ $('modal-win').classList.remove('wide'); $('modal-win').classList.remove('full'); if(S&&S.A&&S.A.card&&screen==='assault')return; $('modal').classList.remove('on');}
function openChron(){
  const c=(S&&S.chron&&S.chron.length?S.chron:store.get(CHRON))||[];
  $('modal-win').innerHTML=`<h2>CHRONICLE OF EVENTS</h2><div class="sub">Decisions of the last game.</div><div class="chron">`+
   (c.length?c.map(x=>`<div><b>${x.date}.</b> ${x.h}: ${x.ch}</div>`).join(''):'<div>Nothing yet. Start a new game.</div>')+`</div><div class="close">ESC — close</div>`;
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
  slot.innerHTML=`<div class="toast"><div class="h">NIGHT ON ${dateStr(S.day).toUpperCase()} · ${S.phase===1?'WHAT THE KREMLIN IS DOING':'THE KREMLIN\'S REPLY'}</div><div class="b">`+
    (k.moves||[]).slice().sort((a,b)=>(b.y||0)-(a.y||0)).map(m=>`<div class="km${m.g?' g':''}${m.y?' y':''}"><span class="c">${m.c}</span><div>${m.t}<br><span class="e">${m.e}</span></div></div>`).join('')+
    `${k.n?`<div class="nt"><b>Your night:</b> ${k.n}</div>`:''}</div><div class="x">click to close</div></div>`;
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
  if(S.cordon){S.hold=S.hold||{}; const paid=[]; for(const H of HOLDS){ if(!S.hold[H.id])continue; if(H.can(S)!==true){S.hold[H.id]=0; notes.push('Nothing to pay with: "'+H.t+'" cancelled');} else{apply(H.cost);paid.push(H.t.toLowerCase());} } if(paid.length)notes.push('Paid for the night: '+paid.join(', ')); if(RP.med)S.med=Math.max(0,S.med+RP.med);}
  if(S.phase===2)S.sup=Math.max(0,S.sup-((.5+RP.sup)+S.ppl/5000)*(S.flags.ration?.5:1)+(S.flags.tunnel?.5:0));
  S.sup+=whYield(S).sup;
  if(S.sup<1){S.hope=clamp(S.hope-8,0,100);S.ppl=Math.round(S.ppl*.9);S.mil=Math.round(S.mil*.95);log('There is no food in the building. People are leaving.','bad');}
  // the perimeter needs hands: too few people and the House feels abandoned
  if(S.phase===2&&S.ppl<PERIM){S.hope=clamp(S.hope-2,0,100);notes.push('Fewer than '+PERIM+'people, no one to hold the perimeter: Resolve −2');}
  if(S.flags.gap>0){S.flags.gap--; notes.push(S.flags.gap?'The gap in the cordon holds':'The gap in the cordon has been closed: wire in three rows');}
  // people come and go
  const inflow=shut?Math.max(0,(S.city-55)*4):Math.max(0,Math.round((S.hope-40)*1+(S.city-40)*(S.phase===1?2:4)));
  S.ppl=Math.max(0,S.ppl+inflow-Math.round(S.ppl*(shut?.08:S.phase===2?.06:.03)));
  // rooms of the White House
  const LD=legDrift(S), dh=whYield(S).hope;
  S.leg=clamp(S.leg+LD.v,0,100);
  if(LD.v)notes.push('Legitimacy overnight '+sg(LD.v)+': '+LD.P.map(p=>p[1]+' '+sg(p[0])).join(', '));
  if(dh)notes.push('The Congress\'s work: Resolve +'+dh);
  // media: income from channels; without a voice the Kremlin owns the air
  const dc=cityShift(), inc=mediaGain(); S.med+=inc; S.city=clamp(S.city+dc,0,100);
  if(dc)notes.push('The fight for Moscow: '+sg(dc));
  if(S.flags.komp>0)S.flags.komp--;
  if(S.mil>=400)S.rad=clamp(S.rad+1,0,100);
  if(S.phase===2){const o0=S.omon==null?100:S.omon; let o=o0+4; if(S.pts.mer>=65)o-=4; if(S.city>=60)o-=2; S.omon=clamp(o,0,100); if(o0<100&&S.omon>o0)notes.push('OMON were given bonuses: readiness '+S.omon+'%');}
  // resolve is the unity of the House: when it cracks, deputies walk out
  if(S.phase===2&&S.hope<45){let out=Math.round((45-S.hope)/5)+2, o0=out; for(const id of ['kol','sm','agr','ros']){const f=S.fac[id],k=Math.min(f.n,out);f.n-=k;out-=k;if(f.n<4){f.n=0;f.room=null;} if(!out)break;} notes.push('Split: left '+(o0-out)+' deputies leave');}
  S.hope=clamp(S.hope-(S.phase===2?4:1)-(S.sup<3?1:0)+RP.hope+dh,0,100);
  if(S.cordon){S.rad=clamp(S.rad+2,0,100); S.ring=Math.min(100,(S.ring==null?100:S.ring)+2);}
  if(S.phase===2)S.pr=clamp(S.pr+prRate(),0,100);
  // the Kremlin slowly pulls everyone to its side
  for(const p of POINTS)if(!p.fixed&&S.pts[p.id]<100)S.pts[p.id]=clamp(S.pts[p.id]-(S.phase===1?1:(p.id==='mo'||p.id==='gs')?3:2),0,100);
  // канат: сила, которая стоит у одного из полюсов, каждую ночь работает на него
  {let tf={},rg=0;const tn=[]; for(const id in POINT_TUG){const sd=tugSide(S.pts[id]),T=sd&&POINT_TUG[id][sd]; if(!T||(T.ph&&S.phase<T.ph))continue; tf=merge(tf,T.fx); if(T.ring&&S.cordon)rg+=T.ring; tn.push(POINTS.find(p=>p.id===id).nm.replace(/ ↑.*/,'')+': '+T.t);}
   if(tn.length){apply(tf); if(rg&&S.ring!=null){S.ring=Math.max(0,S.ring-rg);} notes.push('Forces overnight: '+tn.join('; '));}}
  // factions
  // darkness and cold: no power wears the House down; generators burn supplies instead
  if(S.flags.noPower&&S.flags.gen&&S.sup>0)S.flags.noPower=0;
  if(S.phase===2&&S.flags.noPower){S.hope=clamp(S.hope-2,0,100);notes.push('No light or water: Resolve −2');}
  else if(S.phase===2&&S.flags.gen){S.sup=Math.max(0,S.sup-.25);notes.push('Generators burn diesel: Supplies −0.25 days'); if(S.sup<=0){S.flags.noPower=1;S.flags.gen=0;notes.push('The diesel has run out: the lights went out');}}
  let fb={}, fbn=0;
  for(const F of FACTIONS){const b=facBonus(S,F); if(b&&b.on){fb=merge(fb,b.fx);fbn++;}}
  if(fbn){apply(fb); S.sup=Math.max(0,S.sup); const t=fxText(fb); if(t)notes.push('Factions: '+t.replace(/<[^>]+>/g,''));}
  // deputies come back to a Congress that looks alive
  if(S.phase===2&&S.leg>=60&&S.hope>=65&&(!S.cordon||S.flags.tunnel||S.flags.gap>0||S.city>=55)){const F0=FACTIONS.find(x=>x.id==='kol'),k=Math.min(F0.n-S.fac.kol.n,2+Math.floor(Math.random()*4)); if(k>0){S.fac.kol.n+=k; notes.push('Back from the districts '+k+' departed deputies: the Congress looks alive');}}
  for(const k in S.uses||{})if(S.day%2===0&&S.uses[k]>0&&!S.used[k])S.uses[k]--;
  for(const F of FACTIONS){const f=S.fac[F.id]; if(f.n<=0)continue;
    if(S.hope<40&&Math.random()<.5)f.loy=Math.max(0,f.loy-1);
    if(f.loy<=3&&S.phase===2){const out=Math.max(2,Math.round(f.n*.1));f.n=Math.max(0,f.n-out);if(f.n<4)f.n=0;
      notes.push(`${F.nm.replace(/"/g,'')}: left ${out}`); if(f.n===0)f.room=null;}
  }
  // до указа нелояльные тоже разъезжаются: «в округ, к избирателям»
  if(S.phase===1)for(const F of FACTIONS){const f=S.fac[F.id]; if(F.kind==='dep'&&f.n>4&&f.loy<=3){const o=1+Math.floor(Math.random()*3);f.n-=o;notes.push(F.nm.replace(/"/g,'')+': '+o+' went "to the district"');}}
  // измор: в кризис каждую ночь кто-то уходит; сначала те, кто меньше всех верит
  if(S.phase===2){const why=[]; let k=3+Math.floor(Math.random()*4);
    if(S.cordon&&RP.dep){k+=RP.dep;why.push('the ring');} if(S.flags.noPower){k+=2;why.push('no light');} if(S.flags.bribe){k+=2;why.push('the president\'s "guarantees"');}
    if(S.hope>=70)k-=2; if(S.laws.mandate)k-=2; if(S.leg>=60)k-=1; k=Math.max(0,k);
    const L=FACTIONS.filter(F=>F.kind==='dep'&&S.fac[F.id].n>0&&S.fac[F.id].loy<8).sort((a,b)=>S.fac[a.id].loy-S.fac[b.id].loy); let left=k,gone=0;
    for(const F of L){const f=S.fac[F.id],q=Math.min(f.n,Math.ceil(left*(f.loy<=3?.6:.45)));f.n-=q;left-=q;gone+=q;if(left<=0)break;}
    if(gone)notes.push('Attrition: overnight left '+gone+' deputies leave'+(why.length?' ('+why.join(', ')+')':''));}
  {const fd=facDrift(); if(fd.length)notes.push('Factions: '+fd.join(', '));}
  // Kremlin answers: several moves a night, more as the stakes rise
  S.kdone=S.kdone||{};
  const nK=(S.phase===1?(S.pr>=10?2:1):2+(S.rad>=60||S.day>=15?1:0))-(S.flags.leak?1:0);
  const moves=[]; let kmed=0;
  for(let n=0;n<nK;n++){
    const opts=KREMLIN.filter(k=>!(S.flags.cam&&['provocation','disruption','the street'].includes(k.c))&&!moves.includes(k)&&!(k.once&&S.kdone[k.t])&&!(k.good&&moves.some(m=>m.good))).map(k=>({k,w:k.w(S)})).filter(o=>o.w>0);
    if(!opts.length)break; let r=Math.random()*opts.reduce((a,o)=>a+o.w,0); const k=(opts.find(o=>(r-=o.w)<0)||opts[0]).k; moves.push(k);}
  const rep=[];
  // главный удар Ельцина: объявлен утром, приходит ночью по одному месту
  let struck=false;
  if(S.strike){const T=STRIKES.find(x=>x.id===S.strike.id); struck=true;
    if(T.cover(S)){rep.push({t:T.okT,h:T.okH,e:'<span class="p">the strike was repulsed</span>',c:'Yeltsin',g:1,y:1}); S.st.blk=(S.st.blk||0)+1;}
    else{const half=!!S.flags.shield; let fx=T.hit(S); if(half)fx=halve(fx); apply(fx); if(T.run)T.run(S,half); S.flags.shield=0; S.st.hit=(S.st.hit||0)+1; S.hope=clamp(S.hope-2,0,100); if(S.lastStrikeId==='mvd'||T.id==='mvd')S.omon=clamp((S.omon==null?100:S.omon)+10,0,100);
      rep.push({t:T.hitT+(half?' Compromising material cut the scale: the strike was at half strength.':''),h:T.hitH,e:[fxText(fx),T.e?'<span class="n">'+T.e+'</span>':''].filter(Boolean).join(' · '),c:'Yeltsin',y:1});}
    S.lastStrike=S.strike.id; S.strike=null;}
  // Ельцин лично
  if(!struck){S.ydone=S.ydone||{}; const y=YELTSIN.find((y,i)=>!S.ydone[i]&&y.ph===S.phase&&y.w(S)); if(y){S.ydone[YELTSIN.indexOf(y)]=1; apply(y.fx); if(/ОКЛАД/.test(y.h))S.flags.bribe=1; if(y.run)y.run(S); rep.push({t:y.t,h:y.h,e:fxText(y.fx),c:'Yeltsin',y:1}); moves.pop();}}
  // клеймо: пока РНЕ в здании, либеральная пресса бьёт каждую ночь и всё сильнее
  if(S.phase===2){const b0=S.flags.brand||0; if(S.fac.rne.n>0){S.flags.rneWas=1;const b=Math.min(3,b0+1);S.flags.brand=b;const fx={city:-b,leg:b>=3?-2:b>=2?-1:0};apply(fx);const T=BRAND_T[b-1];rep.push({t:T[S.day%T.length],e:fxText(fx),c:'the brand'});}
    else{ if(b0>0)S.flags.brand=b0-1; if(S.rad>=60){apply({city:-1});rep.push({t:'The papers write about "red-browns" in the White House: too much talk of shooting.',e:fxText({city:-1}),c:'the brand'});}}}
  // издания работают каждую ночь на того, чьё они; в газету попадают самые громкие, остальное одной строкой
  {const agg={vs:{},kr:{}},L=[]; for(const o of OUTLETS){const sd=outSt(S,o),e=sd==='vs'?o.pas:sd==='kr'?o.kpas:null; if(!e)continue; apply(e.fx); agg[sd]=merge(agg[sd],e.fx); L.push({sd,e:S.phase===1&&e.t1?{...e,t:e.t1}:e});}
   const sh=a=>a.sort(()=>Math.random()-.5), tx=f=>fxText(f).replace(/<[^>]+>/g,'');
   for(const x of sh(L.filter(x=>x.sd==='vs')).slice(0,1))rep.push({t:x.e.t,e:fxText(x.e.fx),c:'your press',g:1});
   for(const x of sh(L.filter(x=>x.sd==='kr')).slice(0,S.phase===2?2:1))rep.push({t:x.e.t,e:fxText(x.e.fx),c:'their press'});
   if(tx(agg.vs))notes.push('Your publications overnight: '+tx(agg.vs)); if(tx(agg.kr))notes.push('The Kremlin\'s publications overnight: '+tx(agg.kr));}
  if(S.flags.leak)rep.push({t:'The leak worked: one Kremlin move was foiled, and it was known in advance.',e:'',c:'your press',g:1}); if(S.flags.cam)rep.push({t:'The cameras stood at the cordon all night. There were no provocations.',e:'',c:'your press',g:1}); S.flags.leak=0;S.flags.cam=0;
  for(const k0 of moves){const k=k0.tf?Object.assign({},k0,{t:k0.tf(S)}):k0; if(!k.t)continue; const fx=merge(k.fx,k.dyn?k.dyn(S):{}); apply(fx); if(k0.tf){S.kmed=1;kmed=1;S.kmedT=k.t;} if(k.run)k.run(S); if(k.once)S.kdone[k.t]=1;
    if(fx.city<0||fx.med<0){kmed=1;S.kmedT=k.t;} rep.push({t:k.t,e:fxText(fx)||k.e||'',c:k.c,g:k.good?1:0});}
  if(Math.random()<(S.phase===1?.3:.45)){const pool=KCRISIS.filter(k=>!S.kdone[k.t]&&k.w(S)>0); const k=pool[Math.floor(Math.random()*pool.length)];
    if(k){apply(k.fx);S.kdone[k.t]=1;rep.push({t:k.t,e:fxText(k.fx),c:'the crisis in the Kremlin',g:1,kc:1});}}
  S.sup=Math.max(0,S.sup); S.kmed=kmed;
  S.day++; for(const m of rep)log(m.t,m.g?'':'kr','night');
  // every deputy who walks out takes a piece of the mandate with him
  {const now=deputies(S), was=S.depPrev==null?now:S.depPrev, d=now-was; S.st=S.st||{};
   if(d<0){const h=Math.round(-d/5); S.leg=clamp(S.leg-h,0,100); S.st.depOut=(S.st.depOut||0)-d; notes.push('In a day left '+(-d)+' deputies leave'+(h?': Legitimacy −'+h:''));}
   else if(d>0){const h=Math.floor(d/6); S.st.depIn=(S.st.depIn||0)+d; if(h){S.leg=clamp(S.leg+h,0,100);notes.push('Returned '+d+' deputies: Legitimacy +'+h);}}
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
const PAPER_K={'Yeltsin':'PRESIDENT','the brand':'WHO IS IN THE WHITE HOUSE','their press':'PRESS REVIEW','your press':'THE VOICE OF THE CONGRESS','the crisis in the Kremlin':'UNEASE IN THE KREMLIN','the security forces':'THE ARMY AND THE POLICE','deputies':'THE BODY OF DEPUTIES','the blockade':'AROUND THE WHITE HOUSE','the press':'PRESS AND AIRWAVES','compromising material':'EXPOSÉ','wiretap':'SECURITY SERVICES','provocation':'INCIDENTS','the street':'THE CITY','the regions':'THE REGIONS','the law':'DECREES','money':'MONEY','pressure':'AROUND THE WHITE HOUSE','disruption':'BREAKDOWN','rumour':'RUMOURS','your night':'IN THE WHITE HOUSE'};
const PAPER_PIC={'Yeltsin':'yeltsin','the brand':'barkash','the security forces':'grachev','deputies':'hasb','the crisis in the Kremlin':'yeltsin'};
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
  if(lead.c==='the brand')R.push({t:'Remove the RNE from the building',fx:{city:4,leg:2,hope:-4,rad:-5},run:()=>{S.fac.rne.n=0;S.flags.rneOut=1;S.flags.brand=Math.max(0,(S.flags.brand||0)-1);}});
  else if(lead.c==='Yeltsin')R.push({t:'A resolution of the Presidium in reply',fx:{leg:2,hope:1,pr:2}});
  else if(lead.g)R.push({t:'Send the issue to the regions and units',fx:{med:-4,leg:1,pts:{gs:1}},req:()=>S.med>=4||'needs 4 Airtime'});
  else R.push({t:'Statement of the Presidium of the Supreme Soviet',fx:{leg:1,hope:1,rad:1}});
  if(S.kremlin&&S.kremlin.moves.some(m=>m.kc))R.push({t:'Stir up a scandal in the Kremlin',fx:{med:-5,city:2,pr:-3},e2:'Yeltsin\'s next main strike, at half strength',run:()=>{S.flags.shield=1;},req:()=>S.med>=5||'needs 5 Airtime'});
  else if(!lead.g)R.push({t:'Rebuttal on air',fx:{med:-6,city:3},req:()=>S.flags.noComms?'no connection':S.med>=6||'needs 6 Airtime'});
  R.push({t:'Keep silent',fx:{},e:'the day begins without an answer'}); return R;}
function showPaper(){const k=S.kremlin; if(!k){S.paper=0;return startDay();}
  show('paper'); Sfx.play('paper'); Sfx.play('teletype',.25);
  const vs=voiceOf(S,'vs'),kr=voiceOf(S,'kr'),nu=voiceOf(S,'neu'),tot=vs+kr+nu||1, ours=vs>kr;
  const items=k.moves.slice(); const ord=m=>ours?(m.g?0:m.y?1:2):(m.y?0:m.c==='the brand'?1:m.g?3:2); items.sort((a,b)=>ord(a)-ord(b));
  const lead=items.shift()||{t:'The night passed quietly. Lights are on in the White House, and in the Kremlin too.',e:'',c:'your night',g:1};
  {const kc=items.findIndex(m=>m.kc); if(kc>0)items.unshift(items.splice(kc,1)[0]);}
  const ST=S.strike&&STRIKES.find(x=>x.id===S.strike.id); if(ST)items.unshift({t:ST.warn,h:ST.warnH,e:'<span class="n">the main strike tonight</span>',c:'Yeltsin'});
  const side2=lead.t.length<120&&items.length>3?items.shift():null, cols=items.splice(0,3), d=dateOf(S.day), WDN=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  let brief=(k.notes||[]).concat(items.map(m=>m.t.replace(/\.$/,'')+(m.e?' ('+m.e.replace(/<[^>]+>/g,'')+')':''))); {let n=0;brief=brief.filter(x=>(n+=x.length+3)<(side2?430:620));}
  k.lead=lead; k.rep=paperReplies(lead);
  $('np-sheet').innerHTML=`<div class="top"><span>No. ${180+S.day} (${1034+S.day})</span><span>Daily paper · published since 1990</span><span>Price free</span></div>
    <div class="mast">CAPITAL HERALD</div><div class="rule"></div>
    <div class="date"><span>${WDN[d.getDay()]}, ${dateStr(S.day)} 1993</span><span>Moscow</span></div>
    <div class="kick">${PAPER_K[lead.c]||lead.c.toUpperCase()}${S.phase===2?' · CRISIS, DAY '+(S.day-DECREE_DAY+1):''}</div>
    <div class="h1">${lead.h||paperHead(lead.t,58)}</div>
    <div class="lead"><div><canvas class="ph" id="np-ph" width="220" height="110"></canvas></div>
      <div class="txt"><p>${/^[А-ЯЁA-Z]/.test(lead.t)?`<span class="dc">${lead.t.charAt(0)}</span>${lead.t.slice(1)}`:lead.t}</p>${paperStamps(lead.e)}${side2?`<div class="s2"><div class="h2">${side2.h||paperHead(side2.t,44)}</div>${paperBody(side2,side2.h||paperHead(side2.t,44))}${paperStamps(side2.e)}</div>`:''}</div></div>
    <div class="cols">${cols.map(m=>`<div class="col">${m.kc?'<div class="kick" style="margin:0 0 4px">UNEASE IN THE KREMLIN</div>':''}<div class="h2">${m.h||paperHead(m.t,40)}</div>${paperBody(m,m.h||paperHead(m.t,40))}${paperStamps(m.e)}</div>`).join('')}</div>
    ${brief.length?`<div class="brief"><b>IN BRIEF</b> ${brief.join(' · ')}</div>`:''}`;
  paperPhoto(PAPER_PIC[lead.c]||(S.phase===2&&S.cordon?'whf':'wh'));
  const now={...snap(),hope:S.hope,rad:S.rad,city:S.city,pr:S.pr}, o=k.d0||now;
  const row=(nm,key,suf,inv)=>{const v=Math.round(now[key]*10)/10, dl=Math.round((now[key]-o[key])*10)/10; return `<div class="row"><span>${nm}</span><span><b>${fmt(v)}${suf||''}</b> ${dl?`<span class="${(dl>0)!==!!inv?'p':'n'}">${dl>0?'+':'−'}${fmt(Math.abs(dl))}</span>`:''}</span></div>`;};
  $('np-side').innerHTML=`<div class="day">MORNING · DAY ${S.day}</div><div class="big">MORNING PAPER</div>
    <div class="npw">Today the front page is written by the press <b class="${ours?'v':''}">${ours?'for the Soviet':'for the Kremlin'}</b>. ${ours?'While your publications outnumber theirs, the main news is yours.':'Pull the newsrooms over in "Airtime" and the headlines will be yours.'}</div>
    <div class="press"><i class="k" style="width:${kr/tot*100}%"></i><i class="n" style="width:${nu/tot*100}%"></i><i class="v" style="width:${vs/tot*100}%"></i></div>
    <div class="pl"><span>for the Kremlin ${kr}</span><span>silent ${nu}</span><span>for the Soviet ${vs}</span></div>
    <div class="box"><div class="bt">NIGHT'S RESULTS</div>${row('Legitimacy','leg')}${row('Deputies','dep')}${row('People','ppl')}${row('Airtime','med')}${row('Supplies','sup',' d.')}${row('Resolve','hope','%')}${row('Radicalism','rad','%',1)}${row('Moscow for the Soviet','city','%')}</div>
    <div class="bt" style="margin-top:10px;margin-bottom:0">REPLY TO THE FRONT PAGE</div>`+
    k.rep.map((r,i)=>{const st=r.req?r.req():true;return `<div class="ch${st!==true?' lock':''}" data-i="${i}"><span class="k">${i+1}</span><span>${r.t}</span><span class="e">${st!==true?`<span class="n">${st}</span>`:[fxText(r.fx),r.e2].filter(Boolean).join(' · ')||r.e||''}</span></div>`;}).join('')+
    `<div class="go" id="np-go"><span class="a">START DAY ${S.day}</span><span class="b">ENTER</span></div>`;
  if(ST){const w=$('np-side').querySelector('.npw'); w.className='strk'; w.innerHTML=`<b>YELTSIN'S MAIN STRIKE TONIGHT: ${ST.nm.toUpperCase()}</b>Cover: ${ST.guard}. Otherwise the strike will be heavy.${S.flags.shield?' Compromising material in play: the strike will be at half strength.':''}`;}
  $('np-side').querySelectorAll('.ch').forEach(e=>e.onclick=()=>paperGo(+e.dataset.i)); $('np-go').onclick=()=>paperGo(-1);
}
function paperGo(i){const k=S.kremlin; if(!k||screen!=='paper')return; const r=k.rep&&k.rep[i];
  if(r){if(r.req&&r.req()!==true)return; apply(r.fx); if(r.run)r.run(); if(r.fx&&Object.keys(r.fx).length)log('Reply on the front page: '+r.t.toLowerCase()+'.');}
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
    $('ev-cap-n').textContent='BORIS YELTSIN';$('ev-cap-r').textContent='President of the Russian Federation';}
  else if(pic==='tank'){ TitleArt.onReady(()=>drawTankShot(c));
    $('ev-cap-n').textContent='NOVY ARBAT BRIDGE';$('ev-cap-r').textContent='Tanks fire on the White House';}
  else if(pic==='ost'){ drawOstankino(c);
    $('ev-cap-n').textContent='OSTANKINO';$('ev-cap-r').textContent='TV centre, Akademika Koroleva Street, 12';}
  else{TitleArt.onReady(()=>c.drawImage(pic==='whf'?TitleArt.burning:TitleArt.calm,270,0,320,360,0,0,320,360));
    $('ev-cap-n').textContent='WHITE HOUSE';$('ev-cap-r').textContent='House of Soviets, Krasnopresnenskaya Embankment';}
}
function showEvent(ev){
  evCur=ev; evSel=Math.max(0,ev.ch.findIndex(c=>!(c.req&&!c.req(S)))); show('event'); drawPhoto(ev.pic); Sfx.play(ev.end?(ev.win?'win':'lose'):ev.pic==='yeltsin'?'static':ev.urgent?'alarm':/grachev|kolesn|yerin/.test(ev.pic)?'phone':'paper');
  const tag=$('ev-tag'); tag.className='tag'+(ev.end?(ev.win?' win':' end'):''); tag.textContent=ev.end?(ev.win?'VICTORY':ev.tier==='neu'?'DRAW · A CRISIS WITH NO WINNER':'DEFEAT'):ev.tag||'EVENT';
  $('ev-hud').innerHTML=`<span>Day <b>${S.day}</b></span><span>Legitimacy <b>${S.leg}</b></span><span>Resolve <b>${S.hope}%</b></span><span>Radicalism <b>${S.rad}%</b></span>`;
  $('ev-meta').textContent=(dateStr(S.day)+' 1993'+(ev.time?' · '+ev.time:'')).toUpperCase();
  $('ev-meta2').textContent=ev.urgent?'URGENT':'';
  $('ev-h').textContent=ev.h; $('ev-q').textContent=ev.q||''; $('ev-p').textContent=ev.p; $('ev-res').innerHTML='';
  renderChoices();
}
function renderChoices(){
  $('ev-ch').innerHTML=evCur.ch.map((c,i)=>{const fx=c.fx?fxText(merge(c.fx,c.fac?{fac:c.fac}:{})):'';
    let e=[fx,typeof c.e==='function'?c.e(S):c.e].filter(Boolean).join(' · ');
    const lk=c.req&&!c.req(S); if(lk)e='<span class="n">needs: '+c.rq+'</span>'; else if(c.rq)e=[e,'<span class="p">open: '+c.rq+'</span>'].filter(Boolean).join(' · ');
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
function ASSAULT(){return {id:'assault',pic:unitStance(UNITS.find(u=>u.id==='tanks'))==='refuse'?'whf':'tank',time:'07:00',urgent:1,tag:'PHASE 3 · ASSAULT',h:'ASSAULT',q:'Tanks on the Novy Arbat Bridge',
  p:(S.flags.corner==='army'?'The army is leaving Yeltsin\'s side: the Defence Ministry and the General Staff are almost openly with the Congress. Yeltsin understands there will be no one to assault with tomorrow, and gives the order today, to those who still obey. ':S.flags.corner==='elect'?'The courts, the regions and the city demand elections. Yeltsin is cornered and decides to end it by force while his orders are still being carried out. The units go reluctantly. ':'')+'At dawn armoured vehicles moved up to the White House. Which of the security men carry out the order and which refuse depends on whom you have managed to deal with. The defence runs by the hour, until evening.',
  ch:[
    {t:'To arms! Take up defence',e:`fighters ${fmt(S.mil)} · unarmed ${fmt(S.ppl)} · barricades ${S.bar}/5`,go:()=>startAssault()},
    {t:'Withdraw people under guarantees',e:'deputies surrender without a fight',go:()=>ending('surrender')},
  ]};}
const ENDINGS={
  win_army:{win:1,pic:'wh',h:'THE ARMY WITH THE PEOPLE',q:'The Defence Ministry and the General Staff backed the Congress',
    p:'District commanders refused to carry out Decree No. 1400. There is no one left to storm parliament: without the army, the Kremlin has nothing to answer with. Yeltsin agrees to early presidential elections.'},
  win_elect:{win:1,pic:'whf',h:'ELECTIONS',q:'Assault repelled, the Kremlin withdrew',
    p:'Yeltsin tried to settle it by force and failed. The Constitutional Court, regional soviets and the press are united: the decree is illegal. The Kremlin lifts the blockade and agrees to simultaneous elections on the Congress\'s terms.'},
  elect_deal:{tier:'neu',pic:'wh',h:'THE ZERO OPTION',q:'Elections instead of assault',
    p:'No shots were fired. The court, the regions and the press forced both sides to step back: Decree 1400 was cancelled, the Congress\'s decisions too, and simultaneous elections were set. The Supreme Soviet lasted until them, but that is not a victory. At the elections the Kremlin has television, money and the election commissions, and the new law on parliament was written without you. The Supreme Soviet will never have its old role again.'},
  held:{win:1,pic:'whf',h:'THEY HELD',q:'The assault fizzled out',
    p:'The White House is burning, but the entrances are held. By evening tens of thousands of Muscovites are flocking to the building. The Kremlin declares a truce.'},
  held_iso:{tier:'neu',pic:'whf',h:'HELD OUT, BUT ALONE',q:'Assault repelled, no recognition',
    p:'The entrances held, but the country saw only men with guns on television and heard only calls for reprisals. The regions are silent, the West speaks of a mutiny, Moscow avoids the embankment. The Kremlin has pulled back its troops and waits. The Congress sits in a burnt-out building that no one is willing to recognise as power. No one has won.'},
  pyrrhic:{tier:'neu',pic:'whf',h:'THE KREMLIN\'S PYRRHIC VICTORY',q:'The building taken, power not held',
    p:'The White House has been taken, but the country watched parliament being shot at. Part of the troops refused the order, and the regions and the Constitutional Court do not recognise the decree. Yeltsin sits in the Kremlin and cannot govern: his orders come back unexecuted. Months of dual power and bargaining lie ahead, and both sides lose.'},
  draw_alpha:{tier:'neu',pic:'wh',h:'ALPHA WILL NOT FIRE',q:'Special forces refused to storm and led people out themselves',
    p:'Alpha officers entered the building unarmed and said on camera that they would not carry out an order to fire on parliament. Deputies and defenders walked out under their guarantee. The White House is lost, but the president\'s order was publicly disobeyed by his own special forces. Yeltsin can no longer command, and everyone understands what Decree 1400 was. The Congress is gone too. The country enters a long crisis without a winner.'},
  fell:{pic:'whf',h:'4 OCTOBER',q:'The White House is burning',
    p:'Assault groups broke into the building. By evening the defenders come out under escort. The Supreme Soviet has ceased to exist.'},
  broken:{pic:'whf',h:'CEASE FIRE',q:'The defenders laid down their arms',
    p:'After the tank shelling there is no one left to hold out. People come out of the entrances with white sheets. The Congress is dissolved.'},
  surrender:{pic:'wh',h:'SURRENDER',q:'Deputies leave the building',
    p:'Under the mediators\' guarantee the defenders hand in their weapons and walk to the buses. Less blood, but the Congress is gone.'},
  surrender_alpha:{pic:'whf',h:'UNDER ALPHA\'S GUARANTEE',q:'Officers led people out of the burning building',
    p:'Alpha refused to storm and itself led deputies and defenders out through the cordon. There could have been more blood. The Supreme Soviet is no more.'},
  lose_hope:{pic:'wh',h:'DISPERSED',q:'The defenders left the barricades',
    p:'Cold, hunger and uncertainty did their work. The White House empties without a single shot. Decree No. 1400 takes effect.'},
  lose_leg:{pic:'yeltsin',h:'THE CONGRESS BROKE UP',q:'Nobody believes the Supreme Soviet any more',
    p:'The regions have accepted the decree, and deputies hand in their mandates one after another. The Kremlin does not even need an assault.'},
  lose_ppl:{pic:'wh',h:'EMPTY BARRICADES',q:'No one left to defend the White House',
    p:'The last volunteers have left. At night OMON calmly takes the building.'},
};
// условия выборов без штурма (нужны все)
function dealScore(){const mine=OUTLETS.filter(o=>outSt(S,o)==='vs').length, kr=OUTLETS.filter(o=>outSt(S,o)==='kr').length, ci=ACTIONS.kre.findIndex(a=>/Иск в Конституционный суд/.test(a.t));
  return [[(S.flags.zero||0)>=1,'zero option adopted'],[!!(S.once&&S.once['kre'+ci]),'a claim lodged with the Constitutional Court'],[mine>=10&&kr<=4,'for you: from 10 outlets; for the Kremlin: no more than 4 (now '+mine+' and '+kr+')'],
    [S.leg>=85,'Legitimacy from 85 (now '+S.leg+')'],[S.city>=80,'Moscow from 80% (now '+S.city+'%)'],[S.pts.mo>=50||S.pts.gs>=50,'Defence Ministry or General Staff from 50%'],[S.rad<40&&S.fac.rne.n<=0,'Radicalism below 40 and no RNE in the building'],[S.day>=18,'not before 1 October']];}
function checkLose(){
  if(S.phase===1){S.hope=Math.max(S.hope,10);S.leg=Math.max(S.leg,10);return false;}
  if(S.hope<=0){ending('lose_hope');return true;}
  if(S.leg<=0){ending('lose_leg');return true;}
  if(S.phase===2&&S.ppl+S.mil<=0){ending('lose_ppl');return true;}
  return false;
}
// три яруса исходов: победа, нейтральный (здание потеряно, но Ельцин политически надломлен), поражение
const endTier=id=>{const E=ENDINGS[id]||{};return E.win?'win':E.tier||'lose';};
function drawScore(){const A=S.A||{units:[],air:0}; return [[S.leg>=50,'Legitimacy from 50 (now '+S.leg+')'],[(A.air||0)>=50,'Airtime from 50 (now '+Math.round(A.air||0)+')'],[A.units.some(u=>u.id!=='alpha'&&(u.st==='refuse'||u.st==='stopped')),'at least one unit has refused or been stopped'],[S.city>=55,'Moscow from 55% (now '+S.city+'%)']];}
function ending(id,exact){
  if(exact);
  else if((id==='fell'||id==='broken')&&drawScore().filter(x=>x[0]).length>=3)id='pyrrhic';
  if(!exact&&id==='held'&&S.flags.corner)id=S.flags.corner==='army'?'win_army':'win_elect';
  if(!exact&&id==='held'&&(S.rad>=70||(S.leg<35&&S.A&&S.A.air<30)||(S.A&&S.A.air<50&&(S.A.lost||0)+S.A.units.reduce((x,u)=>x+(u.lost||0),0)>=1500)))id='held_iso'; // без прессы или ценой большой крови без камер // кучка радикалов без прессы: отбились, но никто не признал
  const E={...ENDINGS[id]}; if(id==='fell')E.h=dateStr(S.day).toUpperCase(); if(S.A)S.A.card=0; $('modal').classList.remove('on');
  store.del(SAVE); store.set(CHRON,S.chron);
  S.endId=id; if(typeof aBanQ!=='undefined')aBanQ=[]; if(typeof achEnd==='function')achEnd(id); {const bn=$('a-banner'); if(bn)bn.className='';} stat('end-'+({win:'win',neu:'neutral'}[endTier(id)]||'lose')+'-'+id.replace(/_/g,'-'));
  showEvent({...E,tier:endTier(id),id:'end',end:1,time:'',urgent:0,ch:[
    {t:'What became of each',go:()=>showEpi(0)},
    {t:'The figures',go:()=>openFinal()},
    {t:'Start over',go:()=>newGame()},
    {t:'To main menu',go:()=>{show('title');renderMenu();}},
  ]});
  $('ev-res').textContent=`Days held: ${S.day}. Decisions made: ${S.chron.length}.`;
}

// ===== эпилог: слайды «что стало с каждым». Гипотетические судьбы зависят от исхода, лояльности фракции, того, на чьей стороне была сила, и решений партии =====
// фракции: [ушли до конца, победа+верны, победа+колебались, поражение+верны, поражение+колебались]
const EPI_FAC={
  ros:['The Russia faction dispersed to the regions to gather support and did not make it back for the finale. Baburin later said his people had left too early, and did not argue when he was told the same.',
       'Baburin headed the commission on the new Constitution. The Russia lawyers who drafted resolutions in the besieged building are now writing the basic law, and in it parliament is stronger than the president.',
       'Russia stayed in the winning Congress, but people remember the days when its votes had to be coaxed. Baburin was taken onto the constitutional commission as deputy, not chair.',
       'Baburin was one of the last to leave the building; he was beaten near the stadium. In December the voters of Omsk elected him deputy again, and from the Duma rostrum he repeated what he had said in the White House.',
       'In the last days the faction was already looking for a way out one by one. Baburin was beaten on his way out of the building anyway, and in December Omsk returned him to parliament, this time without the faction.'],
  kr: ['The Communists of Russia left before the finale. Rybkin reached a deal with the government ahead of the others and kept the party intact for the elections.',
       'The Communists received three ministries in the government of national accord. The party cells that had brought people out to the White House became the country\'s best-organised force within a single autumn.',
       'The Communists stayed in the Congress, but were given no ministries: they had counted for too long whose side would win. Rybkin turned to what he did best and became the go-between for everyone.',
       'The faction stood to the end, and the party was banned for several weeks. The ban was lifted by the December elections. Rybkin won a seat in the Duma and became its first chairman.',
       'The Communists left the building a day before the end, and this was counted in their favour: the party was admitted to the elections at once. Rybkin became chairman of the new Duma, and the defenders of the White House stopped greeting him.'],
  agr:['The Agrarians went back to their regions before the end. The harvest, said Lapshin, would not wait.',
       'The Agrarian Union pushed its version of the land law through the Congress: no free sale. The state farms that had carried potatoes to the siege received debt write-offs.',
       'The Agrarians stayed, but haggled to the last day. The land law was adopted in a compromise version, and Lapshin got a committee instead of a ministry.',
       'Lapshin led his people out under escort and a month later rebuilt the Agrarian Party. In December it entered the Duma and bargained over the village budget with those who had fired on the White House.',
       'The Agrarians handed in their mandates in exchange for a promise not to touch the collective farms. The promise lasted a year. The Agrarian Party entered the Duma and voted for the government\'s budget.'],
  otc:['Deputies in uniform from "Fatherland" left and took their district contacts with them. On the decisive night there was no one left to call the headquarters.',
       'Generals from "Fatherland" went back to the Defence Ministry as victors. Tarasov received the post of deputy minister and first of all halted the cuts to the army.',
       '"Fatherland" held on to victory, but its calls to the districts were more cautious than the headquarters had asked. At the ministry the faction\'s generals were given offices without troops.',
       'Generals of "Fatherland" were retired without the right to wear uniform. Tarasov returned to politics a year later, but without epaulettes and without a faction.',
       '"Fatherland" stopped calling the districts a few days before the end. The generals were dismissed all the same: the Kremlin remembered not how it ended, but how it began.'],
  sm: ['"Smena" came out to the cameras before anyone else and proposed elections without Yeltsin and without Khasbulatov. They were shown on all channels for one evening.',
       '"Smena" became the face of a victory no one need be ashamed of: young deputies negotiated the elections and explained to the West that in Moscow it was parliament that had won, not the barricades.',
       '"Smena" stayed, but kept the door open in both directions to the very end. For the election talks Golovin was invited as an adviser, not as head of the delegation.',
       'The faction broke up the same week. Its deputies scattered into new parties, and Golovin spent several more years explaining that he had been against both the decree and the shooting.',
       '"Smena" walked out of the building with a white flag before the end. The Kremlin thanked it; the voters did not forgive it: in December almost no one from the faction was elected.'],
  kol:['The Waverers left one by one. The decree promised each of them a post and an annual salary, and almost all of them got them.',
       'The Waverers stayed, and afterwards said they had never doubted for a minute. Abdulatipov headed the conciliation commission with the regions and proved to be right at home there.',
       'The Waverers sat it out to victory, watching the door. They were not forgiven for it: in the new Congress nobody counted their votes in advance any more.',
       'They stayed to the end and were surprised at themselves. No posts were offered to them any more. Abdulatipov nonetheless ended up in the upper chamber of the new parliament a few months later.',
       'Received the posts and compensation promised by the Kremlin. Abdulatipov became deputy chairman of the Federation Council and did not like to recall September.'],
};
// силы: [победа+были за Совет, победа+были за Кремль или колебались, поражение+были за Совет, поражение+за Кремль]
const EPI_PT={
  mer:['Luzhkov understood which way the wind was blowing in good time and turned the lights on before he was asked. He stayed mayor, but the City Council now approves his budget line by line.',
       'Luzhkov kept the White House without light or water to the last day. The City Council sent him into retirement with the first decision after the victory. Two years later he returned to city politics.',
       'City Hall hesitated longer than the Kremlin was willing to put up with. Luzhkov held on, but at the cost of the City Council: the city soviets were dissolved by his own order.',
       'Luzhkov cut the building\'s light, water and sewage and never regretted it. The City Council was disbanded, and he stayed mayor until 2010.'],
  smo:['Anpilov brought so many people to Smolenskaya that the militia pulled back. After the victory “Working Russia” demanded a trial of the government, and the Congress had to explain to its own allies that victory did not mean reprisals.',
       'Anpilov was pushed off the street before the finale. He met the Congress\'s victory with a megaphone at closed doors, and believed it had been stolen from him.',
       'Anpilov held the square to the end. He was arrested three days later in a village near Tula. In February 1994 he was released under an amnesty and returned to the square.',
       'Smolenskaya was cleared in a single evening. Anpilov was taken in a village near Tula; in February 1994 he was released under an amnesty.'],
  mo: ['Grachev never gave the order the Kremlin expected of him. He did not stay on as minister: the Congress wanted a man who said "no" at once, not one who kept silent for two weeks.',
       'Grachev was ready to carry out the order, but the order never reached the tanks. He resigned on the day of the truce and to the end of his life held that the army had been betrayed by both sides.',
       'Grachev dragged his feet and demanded a written order. He got it in the early morning. Yeltsin never forgave him for it: the minister was replaced a few months later.',
       'Grachev demanded a written order and received it. The tanks moved onto the bridge. He remained defence minister until 1996.'],
  gs: ['The General Staff did not give the Kremlin a single division. Kolesnikov stayed on as Chief of the General Staff under the new government: the man who kept the army in its barracks was not replaced.',
       'Kolesnikov waited to see how it would end, and he did see it. He served on for another six months under the Congress and left of his own accord.',
       'The General Staff sabotaged orders as best it could: cables went missing, columns were not formed. That was enough to delay the assault, but not to cancel it. Kolesnikov was quietly removed a year later.',
       'The General Staff carried out the order without enthusiasm and without delays. Kolesnikov stayed in post until 1996.'],
  mvd:['Interior Troops officers refused to go onto the wire, and Yerin remained minister without a ministry. He resigned on the day of the truce.',
       'Yerin held the cordon to the last hour. After the Congress\'s victory he was dismissed and questioned about the orders of those days. The case never reached court.',
       'There were officers in the Interior Ministry who withdrew their posts and looked the other way. They were dismissed that same autumn. Yerin received the Hero of Russia star.',
       'OMON and the Interior Troops did what they were told. Yerin received the Hero of Russia star and resigned only in 1995, after Budyonnovsk.'],
  ost:['Ostankino gave the Congress the airwaves, and the country saw the siege from inside for the first time. Bragin was removed, and the TV centre passed under the parliament\'s supervisory board.',
       'Ostankino kept showing what the Kremlin needed to the very end. Bragin was dismissed the day after the victory, and television passed under the Congress\'s control.',
       'There were editors at Ostankino who let deputies on air. They were fired first. The Kremlin removed Bragin in December: too much had gone out over the air.',
       'Ostankino remained the Kremlin\'s voice all these days. Bragin was removed in December all the same, after elections that went badly for the authorities.'],
};
// ничья и «нулевой вариант»: [были верны, колебались]
const EPI_FAC_N={
  ros:['Lawyers of "Russia" wrote resolutions to the last day, and not one of them was later overturned by a court. Baburin stayed in politics as a man who neither yielded nor won. In Omsk he was elected again and again.',
       '"Russia" looked for a way out one by one in the final days. When the crisis ended with no winner, Baburin rebuilt the faction, but it no longer had its former weight.'],
  kr: ['The Communists stayed to the end and came out of the crisis with a party no one dared to ban. In the next elections they collected the votes of those who had forgiven neither the Kremlin nor the Congress.',
       'The Communists counted whose side would win, and in the end nobody won. Rybkin was the first to sit down at the negotiating table with the government and kept the party for the elections.'],
  agr:['The Agrarians fed the besieged building to the last day. The land law remained as it was: neither side had the strength to rewrite it. Lapshin called this his main victory.',
       'The Agrarians bargained with both sides and owed neither of them anything. A month later Lapshin gathered the Agrarian Party and led it into the elections.'],
  otc:['"Fatherland" generals called the districts until the last night. They were not returned to the army, but they did not dare to dismiss them in disgrace: too many commanders remembered those calls.',
       '"Fatherland" called the districts more cautiously than the headquarters asked. The faction\'s generals quietly retired. Tarasov returned to politics a year later, without epaulettes.'],
  sm: ['"Smena" negotiated on behalf of everyone who did not want to talk to each other. When the crisis ended with no winner, it turned out this was exactly what it had aimed for. Golovin was invited to every conciliation commission.',
       '"Smena" kept the door open in both directions and went through the one that opened. Its deputies scattered into new parties, and Golovin explained for a long time that he had been against both sides at once.'],
  kol:['The Waverers stayed to the end and were surprised at themselves. Abdulatipov headed the conciliation commission with the regions: when no one had won, mediators proved more needed than heroes.',
       'The Waverers waited to see how it would end and did not get a clear answer. Not all of them received the posts promised by the Kremlin. Abdulatipov nonetheless ended up in the upper chamber of the new parliament.'],
};
// ничья: [были за Совет, были за Кремль или колебались]
const EPI_PT_N={
  mer:['Luzhkov turned the building\'s lights on and off again, depending on the news. He stayed mayor: when a country has no winner, the master of the city is needed by both sides.',
       'Luzhkov held the White House without light or water all these days. When the crisis ended with no winner, the City Council demanded his resignation and did not gather the votes. He remained mayor for many years more.'],
  smo:['Anpilov held Smolenskaya to the end and believed the street had done more than the deputies. "Working Russia" demanded a trial of the government. There was no trial, and the rallies went on.',
       'Anpilov was pushed off the street before the finale. He remained free, with his megaphone: there was no reason to arrest him after an autumn like that.'],
  mo: ['Grachev never gave the Kremlin the army in full. Yeltsin never forgave him, and the Congress did not trust him. The minister was replaced a few months later, and both sides considered it their own merit.',
       'Grachev carried out the Kremlin\'s orders for as long as there were orders to carry out. The outcome with no winner left him as defence minister of an army that no longer wanted to be called to Moscow.'],
  gs: ['The General Staff sabotaged orders as best it could: cables went missing, columns did not form. Kolesnikov was neither rewarded nor punished for it. He served another six months and left of his own accord.',
       'The General Staff carried out orders without enthusiasm and without delays. Kolesnikov stayed in post and for the rest of his service avoided talking about that autumn.'],
  mvd:['There were officers in the Interior Ministry who withdrew their posts and looked the other way. Yerin could not dismiss them: the outcome was too shaky. He himself resigned a year later.',
       'Yerin held the cordon to the last hour. For that he was not given the Hero\'s star: the Kremlin did not dare to reward an autumn in which no one won.'],
  ost:['Ostankino gave the floor to the deputies, and the country saw the siege from inside. Bragin was removed. The TV centre received a supervisory board in which the Kremlin and parliament blocked each other for another year.',
       'Ostankino showed what the Kremlin needed to the very end. Bragin was removed all the same: someone had to answer for the country believing something other than television.'],
};
// поражение без штурма («Разошлись», «Съезд распался», «Пустые баррикады», сдача до боя): замены для текстов, где упомянуты штурм и танки
const EPI_NOA={
  ros3:'Baburin was one of the last to leave the emptying building. In December the voters of Omsk elected him deputy again, and from the Duma rostrum he repeated what he had said in September.',
  ros4:'In the last days the faction was looking for a way out one by one. In December Omsk returned Baburin to parliament, but to a different one.',
  agr3:'Lapshin led his people out last and a month later gathered the Agrarian Party. In December it entered the Duma and bargained over the village budget.',
  mo2:'Grachev dragged his feet and demanded a written order. The order was not needed: the White House emptied by itself. Yeltsin remembered that the minister had waited, and replaced him a few months later.',
  mo3:'Grachev was ready to carry out the order. The tanks did not have to move: the building emptied without a single shot. He remained defence minister until 1996.',
  gs2:'The General Staff sabotaged orders as best it could: cables went missing, columns did not form. Whether that would have been enough cannot be known: the assault never came.',
  gs3:'The General Staff was ready to carry out the order without enthusiasm and without delays. No order was needed. Kolesnikov stayed in post until 1996.',
};
function epilogue(){
  const id=S.endId||'', K=id==='elect_deal'?'deal':endTier(id)==='neu'?'draw':/army/.test(id)?'army':id==='win_elect'?'elect':id==='held'?'held':/fell|broken/.test(id)?'fell':/surrender/.test(id)?'surr':'fade', win=K==='army'||K==='elect'||K==='held', neu=K==='deal'||K==='draw', noA=!win&&!neu&&!(S.A&&S.A.units);
  const L=[], add=(pic,h,q,p)=>L.push({pic,h,q,p});
  add(win?'wh':K==='fell'?'whf':'wh','EPILOGUE','What became of each','What follows is what did not happen. Or happened differently. Fates depend on how your autumn ended, who stayed with you to the end, and on whose side the army, the militia, the city hall and the airwaves ended up.');
  add('hasb','KHASBULATOV','Chairman of the Supreme Soviet',{army:'Khasbulatov accepted the government\'s resignation in the same hall where for two weeks he had sat by candlelight. Until the early elections he remained the second man in the country, and many considered him the first.',
    deal:'Khasbulatov signed the "zero option" and remained chairman until the elections. He called it a victory of law. In the new parliament, elected under the new law, there was no longer a chairman with such powers.',
    elect:'Khasbulatov repelled the assault and agreed to simultaneous elections. He did not run in them: he said his task had been to keep parliament, not to lead it again.',
    held:'Khasbulatov came out to the people by the burnt wall and announced a truce. The victory came to him together with a list of the dead, and at every election he was reminded of that list.',
    draw:S.endId==='held_iso'?'Khasbulatov remained chairman of a parliament recognised only within the cordon. He demanded that the radicals fall silent, but the microphone was no longer his.':'Khasbulatov walked out of the building a free man: after everything the cameras had shown, the Kremlin did not dare to arrest the chairman of parliament. He announced that the Congress would continue its work in any hall in the country, and regions one after another offered him that hall.',
    fell:'Khasbulatov was led out of the building under escort and taken to Lefortovo. On 26 February 1994 he was released under an amnesty by the State Duma and returned to teaching at the Plekhanov Institute.',
    surr:'Khasbulatov signed the terms of surrender and walked out to the buses with the deputies. Lefortovo, the amnesty of February 1994, a department at the Plekhanov Institute.',
    fade:'Khasbulatov remained almost alone in the emptying building. He was not even arrested: the Kremlin found it more important to show that there was no one to arrest. He returned to his department.'}[K]);
  add('rutskoy','RUTSKOY','Vice-President',K==='deal'?'Rutskoy resigned his powers as acting president on the day the decree No. 1400 was cancelled. He called the compromise a capitulation of both sides at once. He stood in the elections himself and lost, and three years later became governor of Kursk Oblast.':K==='draw'&&S.endId==='held_iso'?'Rutskoy took the salute of the defenders in the courtyard of the White House. His decrees were carried out within a radius of three hundred metres. Beyond that began the country that remembered his call to bomb the Kremlin.':K==='draw'?'Rutskoy came out last and showed journalists an assault rifle still greased. Half the country considered him acting president, the other half a rebel, and both were right in their own way. He was never tried.':win?(S.rad>=60?'Rutskoy took the oath as acting president and fulfilled half of the promises made from the balcony. The second half concerned prisons, and the Congress did not approve it.':'Rutskoy served as acting president until the early elections and, to general surprise, really did hold them.'):
    (K==='fade'?'Rutskoy laid down powers that no one but the Congress recognised. Three years later he was elected governor of Kursk Oblast.':'Rutskoy surrendered last and showed journalists an assault rifle still greased: he did not fire it. Lefortovo, the amnesty in February 1994. In 1996 he was elected governor of Kursk Oblast.'));
  add('yeltsin','YELTSIN','President of Russia',{army:'The army did not carry out the order, and that was the end. Yeltsin agreed to early elections, which he did not take part in, and went to his dacha in Barvikha to write a book.',
    deal:'Yeltsin cancelled Decree No. 1400 and called it "a step towards agreement". Before the elections he managed to change the law on parliament and the leadership of television. He won the elections. How fair they were is still disputed.',
    elect:'Yeltsin withdrew Decree No. 1400, calling it "a step towards agreement". He put his own candidacy forward at the simultaneous elections. How they ended, this game does not know.',
    held:'The assault choked in full view of the whole world. Yeltsin declared a truce and a week later agreed to elections. Those who had given the orders to fire he named one by one, and he did not name himself among them.',
    draw:'Yeltsin remained in the Kremlin, but orders from there were no longer carried out: the districts waited for written confirmations, the regions kept their taxes for themselves, and the court called Decree No. 1400 a coup. A few months later he agreed to early elections and did not take part in them.',
    fell:'Yeltsin ruled by decree until December. On 12 December 1993 a referendum adopted a new Constitution with a strong president and a weak parliament. It is still in force.',
    surr:'Yeltsin received the building without a major battle and claimed the credit for it. In December his Constitution was adopted. The guarantees given to those who surrendered were remembered only in February, when the Duma declared an amnesty.',
    fade:'The Kremlin did not need an assault. Yeltsin signed the decree on elections to the new parliament and in December put his Constitution through a referendum.'}[K]);
  for(const F of FACTIONS){ if(F.kind!=='dep')continue; const f=S.fac[F.id], T=EPI_FAC[F.id]; if(!T)continue; const gone=f.n<=0, loyal=f.loy>=6;
    add(FAC_WHO[F.id],F.nm.replace(/"/g,'«').replace(/«([^«]*)«/,'«$1»').toUpperCase(),gone?'Left before the finale':LOY[loyLvl(f.loy)].nm[0].toUpperCase()+LOY[loyLvl(f.loy)].nm.slice(1)+' · remaining '+f.n,gone?T[0]:neu?EPI_FAC_N[F.id][loyal?0:1]:win?T[loyal?1:2]:(noA&&EPI_NOA[F.id+(loyal?3:4)])||T[loyal?3:4]); }
  { const f=S.fac.rne, was=f.n>0||S.flags.rneWas;
    add('barkash','RNE',f.n>0?'Stayed in the building to the end':was?'Expelled or left on their own':'Not let into the building',
      neu?(f.n>0?'Barkashov\'s men stayed in the building until the finale and left with their weapons. The Kremlin showed footage of their formation whenever it could: "these are the people we are being asked to negotiate with." The Congress never managed to wash off those images.'
            :was?'RNE was no longer in the building by the finale. Barkashov said he had been betrayed. The charge of fascism was still pinned on the defenders, but it held poorly: there was no one left to show.'
            :'Barkashov was refused at the doors. No black uniforms appeared in the photos by the White House, and that became one of the reasons the Kremlin could not declare parliament a mutiny.')
      :noA?(f.n>0?'Barkashov\'s men left the building last, in formation and with their weapons. The Kremlin showed footage of that formation all winter: "this is who was sitting there." Barkashov was arrested in the winter, and in February he was released under an amnesty.'
            :was?'RNE was no longer in the building by the end. The charge of fascism was still stuck on the defenders, but it held worse: there was no one left to show.'
            :'Barkashov was refused at the doors. No one could show a swastika on television at the walls of parliament, but that did not save the White House.')
      :f.n>0?(win?'Barkashov\'s men held the twentieth entrance and demanded their share of the victory: premises, weapons, a place in the Congress\'s guard. The liberal papers got a photograph that they went on printing for ten years: black uniforms on the parliament steps. The new authorities had to disarm the RNE themselves.'
                 :'Barkashov\'s men fought at the entrance longer than anyone, and then left through the sewers with their weapons. Footage of their formation became the main justification for the assault: "there were fascists there." Barkashov was arrested in the winter, and in February he was released under an amnesty.')
      :was?(win?'There was no RNE in the Congress\'s victorious White House, and no one could call the Congress\'s victory brown. Barkashov said he had been betrayed. A year later his organisation was written about only in the crime pages.'
              :'The Congress pushed out the RNE and was left without its best squad. Barkashov led his people away and took no part in the fighting. The charge of fascism was still pinned on the defenders, but it held worse: there was no one to show.')
      :(win?'Barkashov was refused at the doors, and that turned out to be one of the cheapest decisions of that autumn: with no black uniforms in the photos, the West recognised the parliament\'s victory the same day.'
           :'Barkashov was refused at the doors. A hundred and twenty trained fighters were not enough on the day of the assault, but no one could show a swastika on television at the walls of parliament.')); }
  { const f=S.fac.so; add('terekh','"OFFICERS\' UNION"',f.n>0?'To the end in the building':'Not in the building',neu?(f.n>0?'Terekhov\'s officers were responsible for the defence of the building to the last day. The Kremlin did not dare arrest Terekhov, and refused to return him to the army. The "Officers\' Union" remained what it had been: a political circle of men in epaulettes.':'The "Officers\' Union" did not take part in the defence. Terekhov demanded at one point the trial of the defence minister, at another his resignation, and got neither.'):f.n>0?(win?'Terekhov\'s officers returned to the army with their ranks restored. Terekhov himself was not taken into the General Staff: the victorious Congress needed an army, not its political circle.':'Terekhov was arrested and beaten during interrogations. In February 1994 he was released under an amnesty and rebuilt the "Officers\' Union", this time without weapons.')
      :(win?'The "Officers\' Union" did not take part in the defence. After the victory Terekhov demanded a purge of the Defence Ministry, and was politely not heard.':'Terekhov acted on his own and was arrested before the finale. The amnesty of February 1994 returned his freedom, but not his rank.')); }
  for(const pid of ['mo','gs','mvd','mer','smo','ost']){ const P=POINTS.find(x=>x.id===pid), v=S.pts[pid], our=v>=(win||neu?50:60), W=PEOPLE[POINT_WHO[pid]];
    add(POINT_WHO[pid],W.nm.split(' ').pop().toUpperCase(),P.nm.replace(/ ↑.*/,'')+' · by the end '+(v>=65?'for the Soviet':v<=35?'for the Kremlin':'wavered')+' ('+v+'%)',neu?EPI_PT_N[pid][our?0:1]:win?EPI_PT[pid][our?0:1]:(noA&&EPI_NOA[pid+(our?2:3)])||EPI_PT[pid][our?2:3]); }
  // части Кремля: кто дошёл до конца, кто встал, кто не пошёл вовсе
  { const A=S.A, kWon=endTier(id)==='lose';
    if(!A||!A.units||false){ add('grachev','KREMLIN UNITS','There was no assault',id==='elect_deal'?'Units pulled towards Moscow stood for a week on the ring road and then returned to their garrisons. The soldiers were told it had been an exercise.':'It did not come to shooting. The columns stood on the embankment and left: there was no one left to take.'); }
    else{ const T={
      tanks:{who:'grachev',nm:'TANKS ON THE BRIDGE',sub:'Kantemirovskaya Division',
        refuse:'The crews of the Kantemirovskaya Division did not drive onto the bridge. The regiment commander asked for a written order from the minister and waited for it until evening. The officers who refused to fire were quietly dismissed later, but no one dared to put them on trial.',
        out:'The tanks went onto the bridge, but stopped firing before the assault was over. The crews switched off their engines and sat on the armour in front of the cameras. The photograph of the silent tanks by the White House went round every newspaper in the world.',
        won:'The tanks fired at the upper floors until the end. The crews, so the rumour went, were paid in cash and given flats. The names of the officers who sat in the vehicles were not disclosed by the ministry for many years.',
        lost:'The tanks fired on the building until dark, but the building held. The new authorities did not put the officers who fired on parliament on trial; they simply stopped shaking their hands. Many resigned the same year.'},
      taman:{who:POINT_WHO.gs,nm:'MOTOR RIFLES',sub:'Taman Division',
        refuse:'The Taman Division did not go to the building. The General Staff reported a shortage of fuel to the Kremlin. Everyone understood that there had been fuel.',
        out:'The motor rifles began the assault and did not finish it. The companies went to ground by the plinth, and no orders could get them up again. By evening the division was pulled back, citing losses.',
        won:'The Tamanites entered the building through the main entrance. The conscripts who had taken the floors were sent back to barracks a month later and told not to say where they had been.',
        lost:'The motor rifles headed for the main entrance all day and did not take it. The division was led out of Moscow at night, without formation and without music. Its commander was removed first.'},
      vv:{who:POINT_WHO.mvd,nm:'INTERIOR TROOPS',sub:'Dzerzhinsky Division',
        refuse:'The Dzerzhinsky Division did not go into the assault. Some officers declared before dawn that they would not fire on their own people. The minister was told this as "technical unreadiness".',
        out:'The Interior Troops fought at the twentieth entrance and left it before the end. The commanders led their men away themselves, without waiting for an order from above.',
        won:'The Dzerzhinsky Division took the twentieth entrance. Its fighters were given more awards for that autumn than anyone. Later they felt awkward wearing them in Moscow.',
        lost:'The Dzerzhinsky Division beat against the twentieth entrance all day. After the truce it was led out of the city, and the ministry classified its losses.'},
      omon:{who:POINT_WHO.mvd,nm:'OMON',sub:'Moscow GUVD',
        refuse:'OMON did not go into the building. The fighters took off their helmets and stood along the embankment with their backs to the White House. The women and veterans who had come to them for two weeks remembered that.',
        out:'OMON began together with everyone and stopped in the middle of the day. The policemen said they knew how to break up rallies, but had not signed up to take parliament.',
        won:'OMON followed the army and cleared the floors and yards around. What was done to those detained at the Krasnaya Presnya stadium was written about for years afterwards.',
        lost:'OMON reached the doors and fell back. A week later the same fighters were posted to guard the same parliament, now in its name.'},
      alpha:{who:'yeltsin',nm:'ALPHA AND VYMPEL',sub:'Special units'} };
      for(const u of A.units){ const t=T[u.id]; if(!t)continue; const lost=Math.round(u.lost||0), m=uMorV(u);
        if(u.id==='alpha'){ const al=A.alpha, neg=/alpha/.test(id);
          add(t.who,t.nm,t.sub+' · '+(neg?'led people out under their own guarantee':al==='refuse'?'refused to storm':al==='attack'?'went to the assault, losses '+fmt(lost):'stayed in reserve'),
            neg?(id==='draw_alpha'?'Alpha\'s officers entered the building without a shot and led people out on their own word. In front of the cameras they said they would not storm parliament. The Kremlin did not forgive them for it: Vympel was disbanded, and Alpha was transferred to another agency.':'Alpha led people out of the building under its own guarantee. The guarantee ran out at the buses. Officers later said they had done what they could, and that without them there would have been ten times more dead.')
            :al==='refuse'?'Alpha heard the appeal over the radio and stayed where it was. The officers answered the Kremlin that they did not work against unarmed deputies. The special forces\' refusal became the end of the assault for everyone who still had doubts.'
            :al==='attack'?(kWon?'Alpha and Vympel entered the twentieth entrance last and did what the others had failed to do. Their officers do not like to remember that day.':'Alpha went into the assault and did not take the entrance. For a unit that had never known failure, this was a turning point: half of the officers submitted reports.')
            :'Alpha and Vympel were kept in reserve to the very end and never thrown into battle. Their officers later said it was the best order of the whole autumn.'); continue; }
        const st=u.st==='refuse'&&lost===0?'refuse':(u.cur<=3||m<MOR_HALT)?'out':kWon?'won':'lost';
        const ls=u.id==='tanks'?'':', losses '+fmt(lost), sub=t.sub+' · '+(st==='refuse'?'refused, did not fight':st==='out'?(u.halt||u.cur>3?(u.id==='tanks'?'ceased fire':'stopped and went no further'):'withdrawn from the fighting')+ls:(u.id==='tanks'?'fired to the end':'fought to the end')+ls);
        add(t.who,t.nm,sub,t[st]); } } }
  { const mine=OUTLETS.filter(o=>outSt(S,o)==='vs').length, kr=OUTLETS.filter(o=>outSt(S,o)==='kr').length;
    add(null,'PRESS',`For you ${mine}, for the Kremlin ${kr}`,win?(mine>=kr?'The outlets that sided with the Congress wrote the history of this autumn first. For the next two weeks the rest explained to their readers what they had really meant.':'Most outlets were against you to the last day. The victorious Congress argued over whether to close them. '+(S.rad>=60?'They closed three, and that became the new authorities\' first scandal.':'It did not close a single one, and people remembered that.'))
      :(mine>=4?'Pravda, Sovetskaya Rossiya, Den and a dozen more outlets were closed by decree the next day. Some came back under other names. The papers that had backed the Kremlin came out with white gaps of censorship and were outraged.':'Opposition papers were closed by decree. The rest came out with white gaps of censorship, which were lifted a few days later.')); }
  { const A=S.A, lost=A?Math.round(A.lost||0):0;
    add(K==='fell'||K==='held'?'whf':'wh','MOSCOW','The city after the finale',win?(lost>300?`Victory cost ${fmt(lost)} killed and wounded among the defenders. A memorial was placed by the wall of the Krasnaya Presnya stadium, and people from both sides of the wire visit it.`:'The barricades were taken down within a week. The Bruno wire was taken back to the warehouse it had come from. Muscovites argued for a long time in their kitchens about whose victory it had been.')
      :(K==='draw'&&S.endId==='held_iso'?'The barricades at the White House stood until winter. The city got used to going around the embankment. Muscovites neither thanked nor cursed those who had held the building: they simply feared them.':K==='draw'?'The White House stood empty and sooty until spring: no authority dared to move into it. Moscow lived with two governments and neither; prices rose, and in kitchens people argued not about who had won, but about who was to blame.':K==='fell'?'The black marks on the white facade were painted over by winter. The dead were counted for a long time and in different ways: officially about a hundred and fifty. The curfew was lifted two weeks later.':K==='surr'?'The building was handed over without a major battle, and that saved more than a hundred lives. The facade stayed white. The White House was fenced in, and the fence stands to this day.':'The White House emptied without a shot. A month later the government was already sitting in it, and the fence around it was set up so that there would be nothing left to build barricades from.')); }
  add('wh','WHAT REALLY HAPPENED','21 September — 4 October 1993','Decree No. 1400 was issued on 21 September. The White House was cut off from power and communications and surrounded with wire. On 3 October supporters of the Supreme Soviet broke through the cordon, took City Hall and headed for Ostankino. On the morning of 4 October tanks from the Novy Arbat bridge fired on parliament, and by evening the defenders surrendered. About 150 people died, according to official figures. In December a new Constitution was adopted.');
  return L;
}
function showEpi(i){ const L=epilogue(); i=Math.max(0,Math.min(i||0,L.length-1)); const s=L[i], last=i===L.length-1;
  showEvent({id:'epi',pic:s.pic||'wh',tag:'EPILOGUE',h:s.h,q:s.q,p:s.p,time:'',ch:[
    last?{t:'To the results',go:()=>ending(S.endId)}:{t:'Next',go:()=>showEpi(i+1)},
    ...(i>0?[{t:'Back',go:()=>showEpi(i-1)}]:[]),
    ...(!last?[{t:'Skip',go:()=>ending(S.endId)}]:[])]});
  $('ev-meta').textContent='WHAT BECAME OF EACH · '+(i+1)+' OF '+L.length; $('ev-hud').innerHTML='';
}
// what became of every faction: [ушли до конца, победа, поражение]
const FATES={
  kr:['Left before the finale. Rybkin reached a deal with the government ahead of the others.','Joined the government of national accord and received three ministries.','The Communist Party was admitted to the December elections. Rybkin became chairman of the new Duma.'],
  ros:['Dispersed to the regions to gather councils. Did not manage to gather them in time.','Baburin headed the commission on the new Constitution.','Baburin was beaten as he left the building. In December he was elected deputy again.'],
  agr:['Returned to their regions before the end.','Pushed through the Congress a land law in their own version.','The Agrarian Party entered the Duma and bargained over the village budget.'],
  otc:['Deputies in uniform left and took their district contacts with them.','Received seats in the Defence Ministry.','Retired without a pension. A year later some returned to politics.'],
  sm:['Came out to the cameras first and proposed elections without Yeltsin and Khasbulatov.','Became the face of the compromise: young deputies led the election talks.','The faction broke up. Its deputies scattered into new parties.'],
  kol:['Left one by one. The decree promised each a post and an annual salary.','Stayed and later said they had never doubted for a minute.','Received the posts and compensation promised by the Kremlin.'],
  rne:['Left the building before the end.','Demanded their share of the victory. They had to be dealt with separately.','Left through the sewers with weapons. Barkashov was arrested in the winter and released under the amnesty.'],
  so:['Went off to act on their own.','Officers returned to the army with their ranks restored.','Terekhov arrested. Released under the amnesty in February 1994.'],
};
function openFinal(){
  const id=S.endId||'', win=!!(ENDINGS[id]&&ENDINGS[id].win)||id==='held', neu=endTier(id)==='neu', A=S.A, st=S.st||{};
  const row=(a,b,c)=>`<div class="fr"><span>${a}</span><b class="${c||''}">${b}</b></div>`;
  const facs=FACTIONS.map(F=>{const f=S.fac[F.id],gone=f.n<=0,L=LOY[loyLvl(f.loy)];
    return `<div class="ff"><span class="sw" style="background:${F.c}"></span><div><b>${F.nm.replace(/"/g,'')}</b> <i style="color:${gone?'var(--dim)':L.c}">${gone?'not in the building':L.nm+' · '+f.n}</i><div>${FATES[F.id][gone?0:win?1:2]}</div></div></div>`;}).join('');
  const forces=[['mo','Defence Ministry'],['gs','General Staff'],['mvd','Interior Min.'],['mer','City Hall'],['ost','Ostankino']].map(([k,n])=>{const v=S.pts[k];return row(n,v>=70?'for the Soviet':v>=45?'wavered':'for the Kremlin',v>=70?'p':v>=45?'':'n');}).join('');
  const mine=OUTLETS.filter(o=>outSt(S,o)==='vs').map(o=>o.nm).join(', ')||'nobody';
  $('modal-win').innerHTML=`<h2>RESULTS · ${dateStr(S.day).toUpperCase()} 1993</h2><div class="sub">${win?'Victory: the Supreme Soviet held.':neu?'Neutral outcome: the building is lost, but Yeltsin is politically broken.':'Defeat: Yeltsin won.'} ${A?'The assault lasted '+A.r+' h of 12.':'The assault never came.'}</div>
   <div class="fin"><div><h3>FIGURES</h3>
    ${row('Days since the start',S.day)}${row('Decisions made',S.chron.length)}${row('Legitimacy',S.leg)}${row('Moscow for the Soviet',S.city+'%')}
    ${row('Deputies remaining',deputies(S)+' of 265',deputies(S)<QUORUM?'n':'')}${row('Deputies departed',st.depOut||0)}${row('Deputies returned',st.depIn||0)}
    ${row('People at the walls',fmt(S.ppl))}${row('Fighters',fmt(S.mil))}${A?row('Killed and wounded',fmt(Math.round(A.lost||0)),'n'):''}
    ${A?row('Assaulters\' losses',fmt(A.units.reduce((a,u)=>a+(u.lost||0),0)),'p'):''}${row('Kremlin moves against you',st.km||0)}${row('Orders not carried out',st.fail||0)}
    <h3>FORCES</h3>${forces}
    <h3>PRESS ON YOUR SIDE</h3><div class="fo">${mine}</div>
    ${A&&A.muster?'<h3>WHO CAME IN THE LAST NIGHT</h3>'+A.muster.map(m=>`<div class="fo ${m.g?'p':'n'}">${m.t}</div>`).join(''):''}
   </div><div><h3>FATES</h3>${facs}
    <div class="ff"><span class="sw" style="background:#b3322b"></span><div><b>Khasbulatov and Rutskoy</b><div>${win?'Remained in power until early elections. What would have happened next, history does not know.':'Lefortovo. Released on 26 February 1994 under the State Duma\'s amnesty.'}</div></div></div>
    <h3>WHAT REALLY HAPPENED</h3><div class="fo">Decree No. 1400 was issued on 21 September. On 4 October tanks from the Novy Arbat bridge fired on the White House, and by evening the defenders surrendered. About 150 people died, according to official figures. In December a new Constitution was adopted.</div>
   </div></div><div class="sub" style="text-align:center;margin-top:6px">Game "1993" · ${authorHTML()}</div><div class="close">ESC — close</div>`;
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
[$('snd2').parentNode].forEach(b=>{const d=document.createElement('div');d.className='menub px';d.textContent='MENU';d.title='To main menu. The party will survive';if(b.contains($('snd2')))d.style.cssText='right:132px;top:10px;font-size:8px;padding:6px 8px;z-index:3';d.onclick=e=>{e.stopPropagation();toMenu();};b.appendChild(d);});
// ---------- полный экран: кнопка видна только там, где браузер его даёт (на iPhone его нет — там игра ставится на экран «Домой») ----------
const FS={ el:()=>document.documentElement, can(){const e=this.el();return !!((document.fullscreenEnabled||document.webkitFullscreenEnabled)&&(e.requestFullscreen||e.webkitRequestFullscreen));},
  on:()=>!!(document.fullscreenElement||document.webkitFullscreenElement),
  sync(){const b=$('fsb'); if(!b)return; b.style.display=this.can()?'block':'none'; b.textContent=this.on()?'⤢ EXIT FULL SCREEN':'⤢ FULL SCREEN'; setTimeout(fit,60); setTimeout(fit,400);},
  toggle(){ try{ if(this.on()){(document.exitFullscreen||document.webkitExitFullscreen).call(document);return;}
      const e=this.el(), r=(e.requestFullscreen||e.webkitRequestFullscreen).call(e); const lock=()=>{try{const o=window.screen.orientation; if(o&&o.lock)o.lock('landscape').catch(()=>{});}catch(x){}}; if(r&&r.then)r.then(lock).catch(()=>{}); else lock(); }catch(x){} } };
document.addEventListener('fullscreenchange',()=>FS.sync());document.addEventListener('webkitfullscreenchange',()=>FS.sync());
{const b=$('fsb'); if(b)b.onclick=e=>{e.stopPropagation();FS.toggle();}; FS.sync();}
// ---------- шрифт: пиксельный по умолчанию, обычные подменяют те же два семейства (ширина подогнана, вёрстка не едет) ----------
const Font={ list:[['pix','PIXEL'],['sans','REGULAR'],['serif','SERIF']],
  // fontv:2 — с версии 0.55 пиксельный шрифт по умолчанию; старый выбор («ОБЫЧНЫЙ» и т. д.) сбрасывается один раз
  cur(){const o=store.get(OPTS)||{}; if(o.fontv!==2) return 'pix'; return this.list.some(x=>x[0]===o.font)?o.font:'pix';},
  apply(){const k=this.cur(); let st=$('font-css'); if(!st){st=document.createElement('style');st.id='font-css';document.head.appendChild(st);} st.textContent=(typeof FONT_FACES!=='undefined'&&FONT_FACES[k])||''; document.documentElement.dataset.font=k;
    const b=$('fntb'); if(b)b.textContent='FONT: '+this.list.find(x=>x[0]===k)[1]; const n=$('fntn'); if(n)n.style.display=k==='pix'?'none':'block'; },
  next(){const o=store.get(OPTS)||{}, i=this.list.findIndex(x=>x[0]===this.cur()); o.fontv=2; o.font=this.list[(i+1)%this.list.length][0]; store.set(OPTS,o); this.apply();} };
{const b=$('fntb'); if(b)b.onclick=e=>{e.stopPropagation();Font.next();}; Font.apply();}
// ---------- язык: переведённые копии скриптов (js/*.en.js и т. д.), выбор в настройках, смена = перезагрузка страницы ----------
const Lang={ list:[['ja','日本語'],['','Russian'],['en','English'],['zh','中文'],['ko','한국어']], cur:()=>GL,
  note:{en:'Translations into English, Chinese and Korean have not been checked by anyone. We cannot guarantee their quality. The original game is in Russian, and the translation may be inaccurate.',zh:'英文、中文和韩文翻译未经任何人校对，无法保证翻译质量。游戏原文为俄语，译文可能不准确。',ko:'영어, 중국어, 한국어 번역은 아무도 검수하지 않았습니다. 번역 품질을 보장할 수 없습니다. 게임 원문은 러시아어이며, 번역이 부정확할 수 있습니다.'},
  sync(){const b=$('lngb'),p=$('lngp'); if(!b)return; if((typeof SINGLE!=='undefined'&&SINGLE)||!LANGS_ON){b.style.display='none';return;} b.textContent='⚑ '+this.list.find(x=>x[0]===GL)[1].toUpperCase()+' ▾';
    const N=this.note; p.innerHTML='<span class="lx" style="position:absolute;right:6px;top:2px;cursor:pointer;padding:0 4px">✕</span>'+this.list.map(x=>`<div class="l${x[0]===GL?' on':''}" data-l="${x[0]}">${x[1]}</div>`).join('')+`<div class="n">English, Chinese and Korean translations have not been checked by anyone; we cannot guarantee their quality. The original game is in Russian, and the translation may be inaccurate.</div>`;
    p.querySelector('.lx').onclick=e=>{e.stopPropagation();p.style.display='none';}; p.querySelectorAll('.l').forEach(d=>d.onclick=e=>{e.stopPropagation();this.set(d.dataset.l);}); },
  set(l){ if(l===GL){$('lngp').style.display='none';return;} const o=store.get(OPTS)||{}; o.lang=l||'ru'; store.set(OPTS,o); if(l&&window.Stat)Stat.ev('lang-'+l); location.href=location.pathname; } };
{const b=$('lngb'); if(b){b.onclick=e=>{e.stopPropagation();const p=$('lngp');p.style.display=p.style.display==='none'?'block':'none';}; Lang.sync();document.addEventListener('click',e=>{const p=$('lngp');if(p&&p.style.display!=='none'&&!p.contains(e.target)&&e.target!==b)p.style.display='none';});document.addEventListener('keydown',e=>{if(e.key==='Escape'){const p=$('lngp');if(p)p.style.display='none';}});}
 if(window.HTML_TR){const T=window.HTML_TR; const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT); let n; while(n=w.nextNode()){const k=n.nodeValue.trim(); if(k&&T[k]!==undefined&&!n.parentNode.closest('#lngp'))n.nodeValue=n.nodeValue.replace(k,T[k]);}
   document.querySelectorAll('[title]').forEach(e=>{if(T[e.title]!==undefined)e.title=T[e.title];});
   const st=document.createElement('style'); st.textContent='.law.done .t::after{content:"'+(T['  ✔ accepted']||'  ✔')+'"}'+(typeof CJK_CSS!=='undefined'?CJK_CSS:''); document.head.appendChild(st);} }

drawMap(); applyOpts(); renderMenu(); show('title');

(function(){const v=document.getElementById('ver');if(v)v.textContent='version '+VERSION;})();

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
  const R=[['leg','Legitimacy',20],['hope','Resolve',20],['rad','Radicalism',20],['city','Moscow',20],['med','Airtime',20],['ppl','People',1000],['mil','Militia',200],['gun','Weapons',200],['sup','Supplies',3],['omon','OMON readiness',30]];
  const b=(k,t,c)=>`<div class="law ck${c?' '+c:''}" data-k="${k}"><div class="t">${t}</div></div>`;
  win.innerHTML=`<h2>CHEATS · FOR TESTING</h2>${resStrip('')}
   <div class="sub">Key 0 opens and closes this panel. On a phone: five quick taps on the version number on the title turn on the "CHEAT" button.</div>
   <div class="ph">GO TO</div><div class="ckg">${b('go:decree','Decree 1400 now')+b('go:ost','Ostankino event')+b('go:assault','Straight to assault')+b('go:alpha','To Alpha at the entrance')+b('go:epi','Slides "What became of each"')+b('x:night','End the turn')}</div>
   <div class="ph">INDICATORS</div><div class="ckg">${R.map(([k,n,v])=>b('r:'+k+':'+v,n+' +'+v)+b('r:'+k+':-'+v,n+' −'+v)).join('')}</div>
   <div class="ph">LAYOUT</div><div class="ckg">${b('x:all','Everything to the max')+b('x:orders','Orders +5, resolutions +3')+b('x:ptsup','All forces +20')+b('x:ptsdn','All forces −20')+b('x:loyup','All factions more loyal')+b('x:loydn','All factions angrier')+b('x:rne',S.fac.rne.n>0?'Remove RNE':'RNE into the building')+b('x:ring',S.cordon?'Lift the Ring':'Set up the Ring')+b('x:power',S.flags.noPower?'Turn on the lights':'Cut the lights')+b('x:dep','Deputies −60')+b('x:seen','Reset hints')}</div>
   <div class="ph">SHOW ENDING</div><div class="ckg">${Object.keys(ENDINGS).map(id=>b('end:'+id,ENDINGS[id].h+' · '+({win:'victory',neu:'neutral',lose:'defeat'})[endTier(id)])).join('')}</div>
   <div class="close xtop">✕ CLOSE</div>`;
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
