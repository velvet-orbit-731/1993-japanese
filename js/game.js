// ================= 1993 — game logic =================
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fmt=n=>Math.round(n).toLocaleString('ru-RU');
const MON=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const WD=['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'];
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
    const good=(k==='rad'||k==='omon')?v<0:v>0; out.push(`<span class="${good?'p':'n'}">${RES_NAMES[k]} ${k==='sup'&&v%1?(v>0?'+':'−')+String(Math.abs(v)).replace('.',','):sg(v)}${k==='sup'?' дн.':''}</span>`);}
  if(fx.pts)for(const p in fx.pts){const v=fx.pts[p];if(!v)continue;const nm=POINTS.find(q=>q.id===p).nm.replace(/ ↑.*/,'');
    out.push(`<span class="${v>0?'p':'n'}">${p===ctx?'лояльность':nm} ${v>=100?'— наша':sg(v)}</span>`);}
  if(fx.fac)for(const f in fx.fac){const d=fx.fac[f], nm=f===ctx?'':FACTIONS.find(F=>F.id===f).sh+': ';
    if(d.n)out.push(`<span class="${d.n>0?'p':'n'}">${nm}${d.n<=-900?'уходят':d.n>0?'+'+d.n+' чел.':d.n+' чел.'}</span>`);
    if(d.loy)out.push(`<span class="${d.loy>0?'p':'n'}">${nm}${d.loy>=2?'намного лояльнее':d.loy>0?'лояльнее':d.loy<=-2?'сильно недовольны':'недовольны'}</span>`);}
  if(fx.pr)out.push(S&&S.phase===1?`<span class="${fx.pr>0?'n':'p'}">${fx.pr>0?'подозрения':'меньше подозрений'}</span>`:`<span class="${fx.pr>0?'n':'p'}">${fx.pr>0?'штурм ближе':'штурм дальше'}</span>`);
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
    document.querySelectorAll('.sndb').forEach(b=>{b.textContent='♪ ЗВУК: '+(on()?'ВКЛ':'ВЫКЛ');b.classList.toggle('off',!on());});}
  return {has,on,sync,set(w){want=w;sync();},toggle(){const o=store.get(OPTS)||{};o.mute=!o.mute;store.set(OPTS,o);sync();}};})();
addEventListener('pointerdown',()=>Music.sync());addEventListener('keydown',()=>Music.sync());

// ---------- intro: a slide show before a new game ----------
const INTRO=[
  {pic:['wh'],      st:'МОСКВА · 1993', t:'Советского Союза нет второй год. Цены отпущены, вклады сгорели, заводы стоят без зарплаты. Страна живёт по Конституции РСФСР 1978 года, в которую успели внести сотни поправок.'},
  {pic:['yeltsin'], st:'ПРЕЗИДЕНТ',      t:'Борис Ельцин избран в июне 1991-го. Он ведёт рыночные реформы и считает, что парламент не даёт довести их до конца. Ему нужна новая Конституция с сильным президентом.'},
  {pic:['hasb'],    st:'ПАРЛАМЕНТ',      t:'Съезд народных депутатов и Верховный Совет избраны в 1990-м. По действующей Конституции высшая власть в стране у них. Председатель Верховного Совета — Руслан Хасбулатов, вчерашний союзник Ельцина.'},
  {pic:['yeltsin','hasb'], st:'ДВОЕВЛАСТИЕ', t:'В декабре 1992-го Съезд не утвердил Гайдара премьером. В марте 1993-го попытался отрешить президента: не хватило 72 голосов. Каждый закон, каждый указ теперь отменяет другая сторона.'},
  {pic:['wh'],      st:'25 АПРЕЛЯ · «ДА, ДА, НЕТ, ДА»', t:'На референдуме большинство поддержало президента и его реформы. Но досрочных выборов не будет ни для кого. Обе стороны объявили, что победили.'},
  {pic:['rutskoy'], st:'ВИЦЕ-ПРЕЗИДЕНТ', t:'Александр Руцкой, генерал и Герой Советского Союза, перешёл на сторону парламента и обещал чемоданы компромата на министров. 1 сентября Ельцин указом отстранил его от должности. Верховный Совет считает указ незаконным.'},
  {pic:['wh'],      st:'14 СЕНТЯБРЯ',    t:'Вы — Верховный Совет. У вас есть здание на Краснопресненской набережной, 265 депутатов, закон и те, кто придёт к его стенам. Президент обещал армии «решающий сентябрь». Что будет дальше, не знает никто.'},
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
const OWN_NM={vs:'за Верховный Совет',kr:'за Кремль',neu:'между двумя властями'};
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
  add(whYield(S).leg,'работа Съезда'); add(-(S.phase===2?4:1),S.phase===2?'двоевластие затянулось':'усталость от противостояния');
  if(kremlinVoice()-mediaIncome()>=6)add(S.phase===2?-2:-1,'пресса Кремля громче вашей');
  const lm=Math.round((S.city-50)/20); add(lm,lm>0?'Москва за вас':'Москва против');
  if(S.cordon)add(ringPress(S).leg,'здание в кольце');
  if(S.phase===2&&deputies(S)<QUORUM)add(-3,'нет кворума');
  if(S.phase===2&&S.med<5)add(-1,'нечем ответить в эфире');
  return {v:P.reduce((a,p)=>a+p[0],0),P};}
const pressLeg=S=>OUTLETS.reduce((a,o)=>{const st=outSt(S,o),e=st==='vs'?o.pas:st==='kr'?o.kpas:null;return a+((e&&e.fx.leg)||0);},0);
// давление кольца за ночь; S.hold — что игрок оплачивает, чтобы терпеть
function ringPress(S){const h=S.hold||{}, hv=(S.ring==null?100:S.ring)>=50; return {leg:h.cour?(hv?-2:-1):(hv?-4:-2), hope:h.ration?0:(hv?-3:-2), sup:(h.port||S.flags.gap>0)?0:(hv?.6:.4), med:h.cour?0:(hv?-2:-1), dep:h.cour?0:(hv?4:2)};}
function syncRing(){ if(S.cordon){ if(S.ring==null)S.ring=100; if(S.ring<=0){S.cordon=0;S.ring=null;S.flags.ringOff=1;S.flags.gap=0;S.hold={};apply({hope:5,leg:3});log('Кольцо снято: к Белому дому снова идут люди и машины.');} } else S.ring=null; }
function halve(fx){const o={};for(const k in fx){const v=fx[k]; o[k]=typeof v==='object'?halve(v):(v<0?Math.ceil(v/2):Math.floor(v/2));}return o;}
// лояльность фракций двигается каждую ночь: её тянут издания, которые фракция читает, и общее положение дел
function facDrift(){const out=[]; for(const F of FACTIONS){const f=S.fac[F.id]; f.tr=null; if(F.kind!=='dep'||f.n<=0)continue; let v=0; const up=[],dn=[];
    for(const id of FAC_PRESS[F.id]||[]){const o=OUTLETS.find(x=>x.id===id),st=outSt(S,o); if(st==='vs'){v+=.34;up.push(o.nm+' за вас');} else if(st==='kr'){v-=.34;dn.push(o.nm+' у Кремля');}}
    const mod=['agr','sm','kol'].includes(F.id);
    if(S.hope>=70){v+=.2;up.push('в здании верят в успех');} else if(S.hope<45){v-=.3;dn.push('Решимость падает');}
    if(S.cordon&&mod){v-=.25;dn.push('здание в кольце');}
    if(S.fac.rne.n>0&&mod){v-=.2;dn.push('РНЕ в здании');}
    if(S.rad>=60){ if(mod){v-=.3;dn.push('радикалы у микрофона');} else{v+=.2;up.push('пошёл серьёзный разговор');} }
    f.dr=clamp((f.dr||0)+v,-1.6,1.6);
    if(f.dr>=1&&f.loy<10){f.dr-=1;f.loy++;f.tr={d:1,why:up[0]||'дела идут'};} else if(f.dr<=-1&&f.loy>0){f.dr+=1;f.loy--;f.tr={d:-1,why:dn[0]||'усталость'};}
    if(f.tr)out.push(F.sh+(f.tr.d>0?' ↑':' ↓')+' ('+f.tr.why+')');} return out;}
function renderHud(p){
  $(p+'-day').textContent='ДЕНЬ '+S.day;
  $(p+'-date').textContent=dateStr(S.day).toUpperCase();
  $(p+'-wd').textContent=WD[dateOf(S.day).getDay()]+' · '+PHASE_NM[S.phase];
  const cur=snap();
  const R=[['leg','Легитимность'],['dep','Депутаты'],['ppl','Люди'],['mil','Ополчение'],['gun','Оружие'],['med','Эфир'],['sup','Снабжение']];
  if(S.phase===1)R.splice(3,1);
  $(p+'-res').innerHTML=R.map(([k,nm])=>{const d=Math.round(cur[k]-(S.am?S.am[k]:cur[k]));
    let dl=d>0?`<span class="dlt up">+${fmt(d)}</span>`:d<0?`<span class="dlt dn">−${fmt(-d)}</span>`:'';
    if(k==='med')dl=`<span class="dlt up">+${mediaGain()}/ход</span>`;
    if(k==='gun'&&S.mil>0)dl=`<span class="dlt">свободно ${fmt(freeGuns(S))}</span>`;
    if(k==='dep'){const r=S.depRate||0;dl=`<span class="dlt">${S.away?'−'+S.away+' в пути · ':''}${S.phase===2&&r>0?'кворум ≈ '+Math.max(0,Math.ceil((cur.dep-QUORUM)/r))+' дн.':'из 265'}</span>`;}
    if(k==='leg'){const f=legDrift(S).v+pressLeg(S);dl=`<span class="dlt ${f<0?'dn':'up'}">ночью ${f?sg(f):'0'}</span>`;}
    const warn=(k==='sup'&&S.sup<=2)||(k==='leg'&&S.leg<=20)||(k==='med'&&S.med<10&&S.phase>1)?' warn':'';
    const v=k==='sup'?Math.floor(S.sup)+' дн.':fmt(cur[k]);
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
  let tl='<div class="lbl px">ХРОНОЛОГИЯ</div>';
  for(let d=start;d<start+14;d++){const n=dateOf(d).getDate();const cls=d<S.day?'past':d===S.day?'now':(d>=aday&&d<=aday+(S.phase===1?0:1))?'risk':'';
    tl+=`<div class="c ${cls}">${n}${cls==='risk'?' ?':''}</div>`;}
  $('tl').innerHTML=tl;
  // meters
  seg('hope',S.hope); seg('rad',S.rad); seg('city',S.city); $('m-city').textContent=S.city+'%';
  $('m-hope').textContent=S.hope+'%';
  $('m-rad').textContent=S.rad+'%'+(S.rad>=50?' ▲':''); $('m-rad').className=S.rad>=50?'warn':'';
  $('m-a1').textContent=S.phase===1?'ПОДОЗРЕНИЯ КРЕМЛЯ':'ДО ШТУРМА';
  $('m-a2').textContent=S.phase===1?'за Белым домом следят':'по слухам из МВД';
  $('m-assault').textContent=S.phase===1?(S.pr>=15?'сильные':S.pr>=6?'растут':'слабые'):'≈'+eta+' дн.';
  $('m-hl').textContent=S.phase===1?'Решимость Верховного Совета':'Решимость защитников';
  // points
  const map=$('map'); map.querySelectorAll('.pt,.tag').forEach(e=>e.remove());
  for(const p of POINTS){const v=S.pts[p.id];const d=document.createElement('div');
    d.className='pt lp-'+(MAP_LP[p.id]||p.lp||'b')+(p.big?' big':'')+(S.sel===p.id?' sel':'');
    d.style.left=(2+p.x*4)+'px';d.style.top=(p.y*4)+'px';d.style.setProperty('--c',`var(--${own(v)})`);
    const who=PEOPLE[POINT_WHO[p.id]];
    d.innerHTML=`<div class="mk">${p.ic}</div><div class="lb"><div class="pc">${who&&who.img?faceHTML(POINT_WHO[p.id]):''}<div class="pi"><div class="nm">${p.nm.replace(/ ↑.*/,'')}</div>${who?`<div class="wn">${who.nm.split(' ').slice(-1)[0]}</div>`:''}<div class="bar"><i style="width:${v}%"></i></div></div></div></div>`;
    d.querySelector('.mk').onclick=d.querySelector('.pc').onclick=()=>{S.sel=p.id;renderMap();firstLook('p',p.id);};
    map.appendChild(d);}
  syncRing(); const tags=[]; if(S.cordon)tags.push({x:12,y:2,t:'Кольцо '+S.ring+(S.flags.gap>0?', есть лаз':'')+' ▸ как снять',c:'btn',on:openSiege});
  if(S.flags.noComms)tags.push({x:12,y:7,t:'Связи нет: звонки и редакции закрыты ▸',c:'btn red',on:openSiege});
  if(S.strike){const T=STRIKES.find(x=>x.id===S.strike.id);tags.push({x:12,y:S.flags.noComms&&S.cordon?12:(S.flags.noComms||S.cordon)?7:2,t:'Удар Ельцина ночью: '+T.nm+(T.cover(S)?' · прикрыто':' · не прикрыто')+' ▸',c:'btn'+(T.cover(S)?'':' red'),on:openStrike});}
  if(S.phase>1&&S.rad>=40)tags.push({x:84.5,y:95.5,t:'Столкновения',c:'red'});
  for(const tg of tags){const d=document.createElement('div');d.className='tag '+tg.c;d.textContent=tg.t;d.style.left=(tg.x*4-40)+'px';d.style.top=(tg.y*4+4)+'px';if(tg.on)d.onclick=tg.on;map.appendChild(d);}
  drawMapDynamic({cordon:S.cordon,crowds:[[84,76,Math.round(6+S.rad*.6),'#c0473a'],[78,50,Math.round(Math.min(60,(S.ppl+S.mil)/80)),'#c0473a'],[88,79,S.phase===1?0:S.cordon?24:12,'#7fa0cf']]});
  renderTarget(); drawFaces($('s-map'));
  // log
  $('log').innerHTML=S.log.slice(0,3).map((l,i)=>`<div class="${i===0&&l.day===S.day?'new ':''}${l.cls}"><span class="tm">${l.day===S.day?l.tm:'вчера'}</span>${l.text}</div>`).join('')||'<div>Утро. Ждём приказов.</div>';
  // buttons
  $('laws-n').textContent='доступно: '+lawsAvail(); $('b-laws').classList.toggle('none',!lawsAvail());
  $('orders').textContent='ENTER · приказов: '+S.orders;
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
  if(a.once&&S.once[pid+i])return 'уже сделано';
  if(S.used[pid+i])return 'уже сегодня';
  if(a.phone&&S.flags.noComms)return 'телефоны отключены';
  if(S.cordon&&pid!=='wh'&&!a.phone&&!/оцеплением/.test(a.t)&&!(S.flags.gap>0||S.flags.tunnel))return 'кольцо: за проволоку не выйти';
  if(a.req){const r=a.req(S);if(r!==true)return r;}
  if(a.dep&&deputies(S)-S.away<a.dep)return 'не хватает свободных депутатов';
  if(!S.orders)return 'нет приказов до утра';
  return true;}
function renderTarget(){
  const p=POINTS.find(q=>q.id===S.sel), v=S.pts[p.id], o=own(v);
  const acts=actsOf(p.id).map(({a,i},n)=>{const st=actState(p.id,i);
    const f0=actFx(p.id,i), kf=inflOf(p.id,i);
    let cost=a.chance?fxText(a.cost||{},p.id):fxText(f0,p.id);
    if(a.chance&&!cost)cost=fxText(a.ok,p.id);
    if(a.dep)cost=`Депутаты: ${a.dep}`+(cost?' · '+cost:'');
    if(!a.chance&&kf<1)cost+=(cost?' · ':'')+`<span class="risk">${kf<0?'вас уже не слушают':'приелось: эффект '+Math.round(kf*100)+'%'}</span>`;
    if(a.risk)cost+=(cost?' · ':'')+`<span class="risk">${a.risk}</span>`;
    if(st!==true)cost=`<span class="risk">${st}</span>`;
    return `<div class="act${st!==true?(S.used[p.id+i]||S.once[p.id+i]?' done':' off'):''}" data-i="${i}"><span class="k">${n+1}</span><span class="t">${a.t}</span><span class="cost">${cost}</span></div>`;}).join('');
  const W=PEOPLE[POINT_WHO[p.id]];
  $('target').innerHTML=`<div class="who">${faceHTML(POINT_WHO[p.id],'big')}<div><h3>${p.full}</h3>
    <div class="own"><b>${W.nm}</b>, ${W.role}</div>
    <div class="own">${S.phase===1?'Настроения':'Контроль'}: <span style="color:${OWN_COL[o]}">${OWN_NM[o]}</span></div></div></div>
    <div class="split"><div class="a" style="width:${v}%"></div><div class="b" style="width:${100-v}%"></div></div>
    <div class="split-l"><span>ВС ${v}%</span><span>Кремль ${100-v}%</span></div>
    <div class="facts">${(T=>T?`<span class="${tugSide(v)==='vs'?'p':'n'}">Сейчас каждую ночь: ${T.t}${fxText(T.fx)?' ('+fxText(T.fx).replace(/<[^>]+>/g,'')+')':''}${T.ph&&S.phase<T.ph?' — с начала кризиса':''}</span><br>`:POINT_TUG[p.id]?'От 65% работает на вас каждую ночь, до 35% — на Кремль.<br>':'')(POINT_TUG[p.id]&&tugSide(v)&&POINT_TUG[p.id][tugSide(v)])}${(p.id==='mo'||p.id==='gs')&&S.phase===2?`В штурме ${p.id==='mo'?'танки':'мотострелки'}: <span style="color:var(--paper)">${v>=65?'не выйдут':v>=45?'пойдут вполсилы':'выполнят приказ'}</span> (от 45 колеблются, от 65 отказ). `:''}${p.id==='mvd'&&S.phase===2?`<span style="color:var(--paper)">ОМОН: готовность ${S.omon==null?100:S.omon}%</span> (до 60 колеблется, до 30 не пойдёт). `:''}${p.id==='wh'?'Здесь заседает Съезд. Фракции и работа Совета — на экране «Белый дом».':''}${p.id!=='wh'?`<span style="color:var(--paper)">Приказ исполнят: ${Math.round(execChance(p.id)*100)}%</span>${S.flags.noComms?' (связи нет: −15%)':''}`:''}</div>
    <div class="acts">${acts}</div>`;
  $('target').querySelectorAll('.act').forEach(e=>e.onclick=()=>doAction(p.id,+e.dataset.i));
}
function doAction(pid,i){
  if(i===undefined||actState(pid,i)!==true)return;
  const a=ACTIONS[pid][i]; let fx, txt; S.uses=S.uses||{};
  if(Math.random()>execChance(pid)){S.orders--; S.used[pid+i]=1; log(POINTS.find(q=>q.id===pid).nm.replace(/ ↑.*/,'')+': приказ Верховного Совета не исполнили. Легитимности не хватает.','bad'); Sfx.play('fail'); S.st=S.st||{}; S.st.fail=(S.st.fail||0)+1; save(); renderMap(); return;}
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
  $('modal-win').innerHTML=`<h2>ПОСТАНОВЛЕНИЯ ВЕРХОВНОГО СОВЕТА</h2>${resStrip('law')}<div class="sub">${n?'Можно принять: '+n+'. Новое — раз в два дня. Чем выше Легитимность, тем сильнее действует постановление (сейчас ×'+(.5+S.leg/100).toFixed(1)+').':'Сегодня принять нельзя. Новое постановление — раз в два дня.'}</div>`+
    LAWS.filter(inPh).map(l=>`<div class="law${S.laws[l.id]?' done':!n?' lock':''}" data-id="${l.id}"><div class="t">${l.t}</div><div class="d">${l.d}</div><div class="e">${S.laws[l.id]?'принято':(!n?'<span class="n">нет свободного постановления: новое раз в два дня</span> · ':'')+fxText(lawFx(l))}</div></div>`).join('')+
    `<div class="close">ESC — закрыть</div>`;
  $('modal').classList.add('on');
  $('modal-win').querySelectorAll('.law').forEach(e=>e.onclick=()=>{const l=LAWS.find(x=>x.id===e.dataset.id);
    if(S.laws[l.id]||!S.lawCharges)return; Sfx.play('stamp'); S.laws[l.id]=1;S.lawCharges--;S.did.law=1; if(l.flag)S.flags[l.flag]=1; apply(lawFx(l));
    log('Принято постановление «'+l.t+'».'); closeModal(); if(checkLose())return; save(); showMain();});
  $('modal-win').querySelector('.close').onclick=closeModal;
}
// ---------- media: channels bring Эфир every night, appeals spend it ----------
let etherSel=null;
function outWayState(o,k){const W=OUT_WAYS[k]; if(S.appeals.pull)return 'сегодня уже работали с редакцией'; return W.req(S,o);}
function outWin(o,k){const W=OUT_WAYS[k]; if(outWayState(o,k)!==true||outLocked(S,o))return; const st=outSt(S,o);
  apply(W.cost(o)); if(W.order)S.orders--; if(W.run)W.run(S); S.appeals.pull=1; S.did.media=1; Sfx.play(k==='p'?'crowd':k==='z'?'stamp':'paper');
  if(W.chance&&Math.random()>W.chance){apply({city:-3}); log('Эфир: '+o.nm+' — нажим не удался, редакция пишет о «погромщиках».');}
  else{S.out[o.id]=st==='kr'?'neu':'vs'; log('Эфир: '+o.nm+(st==='kr'?' больше не поёт с голоса Кремля.':' теперь даёт слово Верховному Совету.'));}
  save(); showMain(); openEther();}
function outActState(o,a,key){if(S.flags.noComms&&o.id!=='radio'&&o.id!=='for')return 'нет связи'; if(S.appeals[key])return 'сегодня уже было'; if(S.med<a.cost)return 'нужно '+a.cost+' Эфира'; return true;}
function outAct(o,a,key){if(outActState(o,a,key)!==true)return; Sfx.play(/echo|radio|ost|pch|600|for/.test(o.id)?'pips':'teletype'); S.med-=a.cost; S.appeals[key]=1; S.did.media=1; apply(fxOf(a)); if(a.run)a.run(S); log(o.nm+': '+a.t.toLowerCase()+'.'); save(); showMain(); openEther();}
const UNIT_SH={tanks:'танки',taman:'мотострелки',vv:'ВВ',omon:'ОМОН',alpha:'«Альфа»'};
function finTxt(fx){if(!fx)return '';const o=[],pc=k=>(k<1?'−':'+')+Math.round(Math.abs(1-k)*100)+'%';
  if(fx.air)o.push('Эфир '+sg(fx.air)); if(fx.hope)o.push('Решимость '+sg(fx.hope)); if(fx.inc)o.push('+'+fx.inc+' людей'); if(fx.ppl)o.push('Люди '+sg(fx.ppl));
  if(fx.mil)o.push('бойцы '+sg(fx.mil)); if(fx.ctl)o.push('входы '+sg(fx.ctl)); if(fx.all)o.push('натиск '+pc(fx.all));
  if(fx.u)for(const k in fx.u)if(fx.u[k]!==1)o.push(UNIT_SH[k]+' '+pc(fx.u[k])); return o.join(', ');}
function openEther(){
  const inc=mediaIncome(), kv=kremlinVoice(), dc=cityShift();
  let o=OUTLETS.find(x=>x.id===etherSel); if(!o){o=OUTLETS.find(x=>outSt(S,x)==='vs'&&x.act)||OUTLETS[0]; etherSel=o.id;}
  const SN={vs:'за Совет',neu:'нейтральны',kr:'за Кремль',off:'закрыто'}, ord={vs:0,neu:1,kr:2,off:3};
  const rows=OUTLETS.slice().sort((a,b)=>ord[outSt(S,a)]-ord[outSt(S,b)]||b.r-a.r).map(x=>{const st=outSt(S,x), fv=(x.pas&&fxText(x.pas.fx))||'', fk=(x.kpas&&fxText(x.kpas.fx))||'', pl=t=>t.replace(/<[^>]+>/g,'');
    const can=st!=='vs'&&st!=='off'&&!outLocked(S,x), fresh=st==='vs'&&x.act&&!S.appeals['o'+x.id];
    return `<tr class="s-${st}${etherSel===x.id?' sel':''}" data-o="${x.id}"><td class="nm">${x.nm}</td><td class="r">${x.r}</td><td class="st">${SN[st]}${st!=='vs'&&st!=='off'?(can?'':' · не взять'):''}</td><td>${x.aud||''}</td>
      <td class="${st==='vs'?'':'dim'}">${x.act?x.act.t+(fresh?' <i>●</i>':''):''}</td>
      <td class="${st==='vs'?'':'dim'}">${st==='vs'?fv:pl(fv)}</td><td class="${st==='kr'?'':'dim'}">${st==='kr'?fk:pl(fk)}</td></tr>`;}).join('');
  const st=outSt(S,o); let det=`<div class="odet"><div class="ph">ИЗДАНИЕ · ${st==='vs'?'ваше: поручить (раз в день)':st==='off'?'не работает':'как перетянуть (одно в день'+(S.appeals.pull?', уже было':'')+')'}</div><div class="oh"><b>${o.nm}</b> <span>охват ${o.r} · ${SN[st]}. ${o.about||''}</span></div><div class="obtn">`;
  if(st==='vs'){det+=[['o'+o.id,o.act],['p'+o.id,o.act2]].filter(x=>x[1]).map(([key,a])=>{const s2=outActState(o,a,key);return `<div class="law oact${s2!==true?' lock':''}" data-k="${key}"><div class="t">${a.t} <span class="cst">Эфир −${a.cost}</span></div><div class="e">${s2===true?[fxText(fxOf(a)),a.e].filter(Boolean).join(' · '):`<span class="n">${s2}</span>`}</div></div>`;}).join('');}
  else if(st==='off')det+=`<div class="oa n">Сейчас не работает.</div>`;
  else if(outLocked(S,o))det+=`<div class="oa n">Перетянуть нельзя.</div>`;
  else det+=(o.ways||'').split('').map(k=>{const W=OUT_WAYS[k], s2=outWayState(o,k), c=fxText(W.cost(o))||(k==='z'?'постановление':'');return `<div class="law oway${s2!==true?' lock':''}" data-w="${k}"><div class="t">${W.t} <span class="cst">${c||'приказ'}</span></div><div class="e">${s2===true?W.d(o)+(st==='kr'?'. Станет нейтральным':'. Станет вашим'):`<span class="n">${s2}</span>`}</div></div>`;}).join('');
  det+='</div></div>';
  const win=$('modal-win'); win.classList.add('wide');
  win.innerHTML=`<h2>ЭФИР · БОРЬБА ЗА МОСКВУ</h2>
   <div class="tug"><span class="l">за Совет ${S.city}%</span><div class="tb"><i style="width:${S.city}%"></i></div><span class="r">за Кремль ${100-S.city}%</span></div>
   ${resStrip('med')}
   <div class="sub">Ваш голос <b style="color:var(--ok)">${inc}</b> против кремлёвского <b style="color:#7fa0cf">${kv}</b>: Москва <b class="${dc<0?'n':'p'}">${dc?sg(dc):'без перемен'}</b> за ночь. Рычаги Москвы: «МК» и «Эхо Москвы» (каждое ваше даёт +1 за ночь, сейчас +${moscOut()}), кампании ниже, опровержения в утренней газете. Выберите издание в таблице.${S.flags.noComms?' <span class="n">Связи нет: работают только радио здания, иностранцы и те, кого пустили внутрь.</span>':''}${S.kmed?' <span class="n">Ночью Кремль бил по эфиру.</span>':''}</div>
   <table class="otab"><tr><th>Издание</th><th>Охват</th><th>Чьё</th><th>На кого влияет</th><th>Что делает, когда ваше</th><th>Каждый ход, пока ваше</th><th>пока у Кремля</th></tr>${rows}</table>
   <div class="eth3">${det}<div><div class="ph">ОБЩИЕ КАМПАНИИ · не привязаны к изданию, тратят Эфир (сейчас ${fmt(S.med)})</div><div class="app2 a1">`+
   APPEALS.filter(inPh).map(a=>{const nc=S.flags.noComms&&a.id!=='foreign', used=S.appeals[a.id]||nc, poor=S.med<a.cost;
     return `<div class="law gen${nc?' lock':used?' done2':poor?' lock':''}" data-id="${a.id}"><div class="t">${a.t} <span class="cst">Эфир −${a.cost}</span></div><div class="e">${nc?'<span class="n">нет связи</span>':used?'сегодня уже было':poor?'<span class="n">не хватает Эфира: нужно '+a.cost+'</span>':[fxText(fxOf(a)),a.e].filter(Boolean).join(' · ')}</div></div>`;}).join('')+
   `</div></div></div><div class="close xtop">✕ ЗАКРЫТЬ</div>`;
  $('modal').classList.add('on');
  win.querySelectorAll('tr[data-o]').forEach(e=>e.onclick=()=>{etherSel=e.dataset.o;openEther();});
  win.querySelectorAll('.oway').forEach(e=>e.onclick=()=>outWin(o,e.dataset.w));
  win.querySelectorAll('.oact').forEach(e=>e.onclick=()=>{const key=e.dataset.k;outAct(o,key[0]==='o'?o.act:o.act2,key);});
  win.querySelectorAll('.law.gen').forEach(e=>e.onclick=()=>{const a=APPEALS.find(x=>x.id===e.dataset.id);
    if(S.appeals[a.id]||S.med<a.cost||(S.flags.noComms&&a.id!=='foreign'))return; S.med-=a.cost; S.appeals[a.id]=1; S.did.media=1; apply(fxOf(a)); if(a.run)a.run(S); if(a.id==='deny')S.kmed=0; log('Эфир: '+a.t.toLowerCase()+'.'); save(); showMain(); openEther();});
  win.querySelector('.close').onclick=closeModal;
}
function siegeState(i){const a=SIEGE[i]; if(a.once&&S.flags[a.once])return 'уже сделано'; const r=a.req(S); if(r!==true)return r; if(!S.orders)return 'нет приказов до утра'; return true;}
function openSiege(){ syncRing();
  const win=$('modal-win'); win.classList.add('wide');
  const L=SIEGE.map((a,i)=>({a,i,st:siegeState(i)})), can=x=>x.st===true;
  const card=({a,i,st})=>`<div class="law${st===true?'':st==='уже сделано'?' done2':' lock'}" data-i="${i}"><div class="t">${a.t} <span class="cst">${[a.ring?'<span class="p">Кольцо −'+Math.min(a.ring,S.ring||0)+'</span>':'',fxText(a.fx)].filter(Boolean).join(' · ')}</span></div><div class="e">${st===true?a.d:st==='уже сделано'?'уже сделано':`<span class="n">${st}</span>`}</div></div>`;
  const grp=(t,l)=>l.length?`<div class="ph">${t}</div><div class="sg2">${l.map(card).join('')}</div>`:'';
  const ringL=L.filter(x=>x.a.ring&&x.a.ring<100), sum=ringL.filter(can).reduce((a,x)=>a+x.a.ring,0), oth=L.filter(x=>!x.a.ring||x.a.ring>=100).filter(x=>S.cordon||!/кольца нет/.test(x.st));
  win.innerHTML=`<h2>БЛОКАДА${S.cordon?' · КОЛЬЦО '+S.ring+' ИЗ 100':''}</h2>${resStrip('ord')}${S.cordon?`<div class="tug"><span class="l">снято ${100-S.ring}</span><div class="tb"><i style="width:${100-S.ring}%"></i></div><span class="r">осталось ${S.ring}</span></div>`:''}
   <div class="sub">${S.cordon?(RP=>'Кольцо за ночь сейчас: <span class="n">Легитимность '+RP.leg+(RP.hope?', Решимость '+RP.hope:'')+(RP.med?', Эфир '+RP.med:'')+(RP.sup?', Снабжение −'+String(RP.sup).replace('.',',')+' дн.':'')+(RP.dep?', уходят ещё '+RP.dep+' депутатов':'')+'</span>, люди не приходят, за проволоку не выйти. '+(S.ring>=50?'Ниже 50 давит слабее. ':'Кольцо ослаблено: давит слабее. ')+'Каждую ночь его подтягивают на 2. <b style="color:var(--paper);font-weight:400">Осталось снять '+S.ring+'; открытые сейчас пути дают −'+sum+'.</b>'+(S.flags.gap>0?' <span class="p">Есть лаз: ещё '+S.flags.gap+' ноч.</span>':''))(ringPress(S)):'Кольца нет. Здесь же чинят связь и свет.'}
   ${S.flags.noComms?' <span class="n">Связи нет.</span>':''}${S.flags.noPower?' <span class="n">Свет и вода отключены мэрией.</span>':''}</div>`+
   (S.cordon?`<div class="ph">ТЕРПЕТЬ И ПЛАТИТЬ · каждую ночь, приказ не тратится, можно отменить</div><div class="sg3">`+HOLDS.map(H=>{const on=(S.hold||{})[H.id],c=H.can(S);return `<div class="law hold${on?' on2':c!==true?' lock':''}" data-h="${H.id}"><div class="t">${H.t} <span class="cst">${fxText(H.cost)} за ночь</span></div><div class="e">${on?'<span class="p">✓ включено.</span> '+H.d+'. Нажмите, чтобы отменить':c!==true?`<span class="n">${c}</span>`:H.d}</div></div>`;}).join('')+'</div>':'')+
   (S.cordon?grp('СНЯТЬ КОЛЬЦО ПО ЧАСТЯМ · ОТКРЫТО СЕЙЧАС · каждое действие тратит приказ',ringL.filter(can))+grp('СНЯТЬ КОЛЬЦО ПО ЧАСТЯМ · ПОКА ЗАКРЫТО (видно, чего не хватает)',ringL.filter(x=>!can(x))):'')+
   grp(S.cordon?'ПРОРЫВ, ОБХОД, СВЯЗЬ И СВЕТ':'СВЯЗЬ И СВЕТ',oth.filter(can).concat(oth.filter(x=>!can(x))))+`<div class="close xtop">✕ ЗАКРЫТЬ</div>`;
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
  $('modal-win').innerHTML=`<h2>${kind==='p'?P.full:P.nm.replace(/"/g,'«').replace(/«([^«]*)«/,'«$1»').toUpperCase()}</h2><div style="display:flex;gap:14px;align-items:flex-start;margin-top:10px">${W?faceHTML(who,'big'):''}<div class="sub" style="margin:0;font-size:18px;line-height:21px">${W?`<b style="color:var(--paper);font-weight:400">${W.nm}</b>, ${W.role}<br><br>`:''}${txt}</div></div><div class="law" id="fl-ok" style="margin-top:16px;text-align:center"><div class="t">ОК</div></div>`;
  $('modal').classList.add('on'); drawFaces($('modal-win')); $('fl-ok').onclick=closeModal;}
function resStrip(hl){const it=[['leg','Легитимность',S.leg],['dep','Депутаты',deputies(S)],['ppl','Люди',fmt(S.ppl)],['mil','Ополчение',fmt(S.mil)],['gun','Стволы свободные',fmt(freeGuns(S))],['med','Эфир',fmt(S.med)+' <i>+'+mediaGain()+' за ход</i>'],['sup','Снабжение',Math.floor(S.sup)+' дн.'],['hope','Решимость',S.hope+'%'],['rad','Радикализм',S.rad+'%'],['city','Москва',S.city+'%'],['ord','Приказы',S.orders],['law','Постановления',S.lawCharges]];
  return '<div class="rstrip">'+it.map(([k,n,v])=>`<span class="${k===hl?'hl':''}">${n} <b>${v}</b></span>`).join('')+'</div>';}
function openStrike(){const T=S.strike&&STRIKES.find(x=>x.id===S.strike.id); if(!T)return; const ok=T.cover(S);
  $('modal-win').innerHTML=`<h2>ГЛАВНЫЙ УДАР ЕЛЬЦИНА · ${T.nm.toUpperCase()}</h2><div class="sub">${T.warn}<br><br>Удар придётся этой ночью по одному месту и будет тяжёлым: ${fxText(T.hit(S))||T.e}${T.e&&fxText(T.hit(S))?' · <span class="n">'+T.e+'</span>':''}.<br><br>Прикрыть: <b style="color:var(--paper)">${T.guard}</b>. ${ok?'<span class="p">Сегодня уже прикрыто.</span>':'<span class="n">Пока не прикрыто.</span>'}${S.flags.shield?'<br>Компромат в ходу: если удар пройдёт, то вполсилы.':'<br>Кампания «Компромат на правительство» в «Эфире» ослабит удар вдвое.'}</div><div class="close">ESC — закрыть</div>`;
  $('modal').classList.add('on'); $('modal-win').querySelector('.close').onclick=closeModal;}

function openHelp(){
  const LD=legDrift(S);
  const H=[['Легитимность','шанс, что приказ за стенами исполнят (сейчас '+Math.round(execChance('x')*100)+'%), множитель постановлений, проверки в событиях. Потолка нет, но каждую ночь она уходит, а выше 70 любая прибавка даёт вдвое меньше. Сейчас за ночь: '+LD.P.map(p=>p[1]+' '+sg(p[0])).join(', ')+', издания '+(pressLeg(S)?sg(pressLeg(S)):'0')+'.'],
   ['Депутаты','их число и есть мандат. Каждые 5 ушедших за сутки снимают 1 Легитимности. В кризис их берут измором: каждую ночь кто-то уходит, больше при кольце, без света и после ельцинских «гарантий»; Решимость и лояльность фракций уход сдерживают. Меньше '+QUORUM+' — нет кворума, Легитимность −3 за ночь.'],
   ['Люди','руки: пикеты, обозы, баррикады, тушение пожара. В кризис меньше '+PERIM+' — периметр пуст, Решимость −2 за ночь. От 2500 Кремль медлит со штурмом, но толпа съедает снабжение и растит радикализм.'],
   ['Ополчение','люди с оружием: держат входы при штурме, от 200 поднимают Решимость, открывают силовые варианты.'],
   ['Оружие','стволы. Вооружённый человек становится бойцом ополчения и держит ствол при себе: запас не уменьшается, уменьшаются свободные стволы.'],
   ['Эфир','единственная медийная валюта. Приходит каждую ночь от изданий на вашей стороне. Тратится на редакции, кампании, ответы на газету; меняется на Легитимность, Москву и лояльность фракций.'],
   ['Снабжение','дни еды и солярки. Ноль — люди уходят, Решимость падает.'],
   ['Москва','настроение города: приток людей, Легитимность, скорость штурма. Решается в «Эфире».'],
   ['Решимость','единство дома: ниже 45% депутаты уходят быстрее. Ноль — конец.'],
   ['Радикализм','ставки: открывает силовые варианты, закрывает переговоры, от 60% Кремль бьёт сильнее.'],
   ['Силы на карте','канат между Советом и Кремлём. От 65% сила работает на вас каждую ночь, до 35% — на Кремль. Кремль каждую ночь тянет всех к себе, а раз в два-три дня Ельцин бьёт по одной из них всерьёз: газета предупреждает утром.'],
   ['Кольцо','оцепление здания, 0–100. Пока стоит, каждую ночь бьёт по Легитимности, Решимости, Эфиру, Снабжению и уводит депутатов; ниже 50 давит слабее. Можно терпеть и платить (курьеры, двойной паёк, носильщики) или снимать по частям: окно «Блокада» на карте.']];
  $('modal-win').innerHTML='<h2>ПОКАЗАТЕЛИ: ЧТО НА ЧТО ВЛИЯЕТ</h2>'+H.map(h=>`<div class="hlp"><b>${h[0]}</b><span>${h[1]}</span></div>`).join('')+'<div class="close">ESC — закрыть</div>';
  $('modal').classList.add('on'); $('modal-win').querySelector('.close').onclick=closeModal;
}
function closeModal(){ $('modal-win').classList.remove('wide'); $('modal-win').classList.remove('full'); if(S&&S.A&&S.A.card&&screen==='assault')return; $('modal').classList.remove('on');}
function openChron(){
  const c=(S&&S.chron&&S.chron.length?S.chron:store.get(CHRON))||[];
  $('modal-win').innerHTML=`<h2>ХРОНИКА СОБЫТИЙ</h2><div class="sub">Решения последней партии.</div><div class="chron">`+
   (c.length?c.map(x=>`<div><b>${x.date}.</b> ${x.h}: ${x.ch}</div>`).join(''):'<div>Пока пусто. Начните новую игру.</div>')+`</div><div class="close">ESC — закрыть</div>`;
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
  slot.innerHTML=`<div class="toast"><div class="h">НОЧЬ НА ${dateStr(S.day).toUpperCase()} · ${S.phase===1?'ЧТО ДЕЛАЕТ КРЕМЛЬ':'ОТВЕТ КРЕМЛЯ'}</div><div class="b">`+
    (k.moves||[]).slice().sort((a,b)=>(b.y||0)-(a.y||0)).map(m=>`<div class="km${m.g?' g':''}${m.y?' y':''}"><span class="c">${m.c}</span><div>${m.t}<br><span class="e">${m.e}</span></div></div>`).join('')+
    `${k.n?`<div class="nt"><b>Ваша ночь:</b> ${k.n}</div>`:''}</div><div class="x">щёлкните, чтобы закрыть</div></div>`;
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
  if(S.cordon){S.hold=S.hold||{}; const paid=[]; for(const H of HOLDS){ if(!S.hold[H.id])continue; if(H.can(S)!==true){S.hold[H.id]=0; notes.push('Нечем платить: «'+H.t+'» отменены');} else{apply(H.cost);paid.push(H.t.toLowerCase());} } if(paid.length)notes.push('Оплачено за ночь: '+paid.join(', ')); if(RP.med)S.med=Math.max(0,S.med+RP.med);}
  if(S.phase===2)S.sup=Math.max(0,S.sup-((.5+RP.sup)+S.ppl/5000)*(S.flags.ration?.5:1)+(S.flags.tunnel?.5:0));
  S.sup+=whYield(S).sup;
  if(S.sup<1){S.hope=clamp(S.hope-8,0,100);S.ppl=Math.round(S.ppl*.9);S.mil=Math.round(S.mil*.95);log('В здании нет еды. Люди уходят.','bad');}
  // the perimeter needs hands: too few people and the House feels abandoned
  if(S.phase===2&&S.ppl<PERIM){S.hope=clamp(S.hope-2,0,100);notes.push('Людей меньше '+PERIM+', периметр держать некому: Решимость −2');}
  if(S.flags.gap>0){S.flags.gap--; notes.push(S.flags.gap?'Лаз в оцеплении держится':'Лаз в оцеплении закрыли: спираль в три ряда');}
  // people come and go
  const inflow=shut?Math.max(0,(S.city-55)*4):Math.max(0,Math.round((S.hope-40)*1+(S.city-40)*(S.phase===1?2:4)));
  S.ppl=Math.max(0,S.ppl+inflow-Math.round(S.ppl*(shut?.08:S.phase===2?.06:.03)));
  // rooms of the White House
  const LD=legDrift(S), dh=whYield(S).hope;
  S.leg=clamp(S.leg+LD.v,0,100);
  if(LD.v)notes.push('Легитимность за ночь '+sg(LD.v)+': '+LD.P.map(p=>p[1]+' '+sg(p[0])).join(', '));
  if(dh)notes.push('Работа Съезда: Решимость +'+dh);
  // media: income from channels; without a voice the Kremlin owns the air
  const dc=cityShift(), inc=mediaGain(); S.med+=inc; S.city=clamp(S.city+dc,0,100);
  if(dc)notes.push('Борьба за Москву: '+sg(dc));
  if(S.flags.komp>0)S.flags.komp--;
  if(S.mil>=400)S.rad=clamp(S.rad+1,0,100);
  if(S.phase===2){const o0=S.omon==null?100:S.omon; let o=o0+4; if(S.pts.mer>=65)o-=4; if(S.city>=60)o-=2; S.omon=clamp(o,0,100); if(o0<100&&S.omon>o0)notes.push('ОМОНу выдали премии: готовность '+S.omon+'%');}
  // resolve is the unity of the House: when it cracks, deputies walk out
  if(S.phase===2&&S.hope<45){let out=Math.round((45-S.hope)/5)+2, o0=out; for(const id of ['kol','sm','agr','ros']){const f=S.fac[id],k=Math.min(f.n,out);f.n-=k;out-=k;if(f.n<4){f.n=0;f.room=null;} if(!out)break;} notes.push('Раскол: ушли '+(o0-out)+' депутатов');}
  S.hope=clamp(S.hope-(S.phase===2?4:1)-(S.sup<3?1:0)+RP.hope+dh,0,100);
  if(S.cordon){S.rad=clamp(S.rad+2,0,100); S.ring=Math.min(100,(S.ring==null?100:S.ring)+2);}
  if(S.phase===2)S.pr=clamp(S.pr+prRate(),0,100);
  // the Kremlin slowly pulls everyone to its side
  for(const p of POINTS)if(!p.fixed&&S.pts[p.id]<100)S.pts[p.id]=clamp(S.pts[p.id]-(S.phase===1?1:(p.id==='mo'||p.id==='gs')?3:2),0,100);
  // канат: сила, которая стоит у одного из полюсов, каждую ночь работает на него
  {let tf={},rg=0;const tn=[]; for(const id in POINT_TUG){const sd=tugSide(S.pts[id]),T=sd&&POINT_TUG[id][sd]; if(!T||(T.ph&&S.phase<T.ph))continue; tf=merge(tf,T.fx); if(T.ring&&S.cordon)rg+=T.ring; tn.push(POINTS.find(p=>p.id===id).nm.replace(/ ↑.*/,'')+': '+T.t);}
   if(tn.length){apply(tf); if(rg&&S.ring!=null){S.ring=Math.max(0,S.ring-rg);} notes.push('Силы за ночь: '+tn.join('; '));}}
  // factions
  // darkness and cold: no power wears the House down; generators burn supplies instead
  if(S.flags.noPower&&S.flags.gen&&S.sup>0)S.flags.noPower=0;
  if(S.phase===2&&S.flags.noPower){S.hope=clamp(S.hope-2,0,100);notes.push('Нет света и воды: Решимость −2');}
  else if(S.phase===2&&S.flags.gen){S.sup=Math.max(0,S.sup-.25);notes.push('Генераторы жгут солярку: Снабжение −0,25 дн.'); if(S.sup<=0){S.flags.noPower=1;S.flags.gen=0;notes.push('Солярка кончилась: свет погас');}}
  let fb={}, fbn=0;
  for(const F of FACTIONS){const b=facBonus(S,F); if(b&&b.on){fb=merge(fb,b.fx);fbn++;}}
  if(fbn){apply(fb); S.sup=Math.max(0,S.sup); const t=fxText(fb); if(t)notes.push('Фракции: '+t.replace(/<[^>]+>/g,''));}
  // deputies come back to a Congress that looks alive
  if(S.phase===2&&S.leg>=60&&S.hope>=65&&(!S.cordon||S.flags.tunnel||S.flags.gap>0||S.city>=55)){const F0=FACTIONS.find(x=>x.id==='kol'),k=Math.min(F0.n-S.fac.kol.n,2+Math.floor(Math.random()*4)); if(k>0){S.fac.kol.n+=k; notes.push('Вернулись из округов '+k+' ушедших депутатов: Съезд выглядит живым');}}
  for(const k in S.uses||{})if(S.day%2===0&&S.uses[k]>0&&!S.used[k])S.uses[k]--;
  for(const F of FACTIONS){const f=S.fac[F.id]; if(f.n<=0)continue;
    if(S.hope<40&&Math.random()<.5)f.loy=Math.max(0,f.loy-1);
    if(f.loy<=3&&S.phase===2){const out=Math.max(2,Math.round(f.n*.1));f.n=Math.max(0,f.n-out);if(f.n<4)f.n=0;
      notes.push(`${F.nm.replace(/"/g,'')}: ушли ${out}`); if(f.n===0)f.room=null;}
  }
  // до указа нелояльные тоже разъезжаются: «в округ, к избирателям»
  if(S.phase===1)for(const F of FACTIONS){const f=S.fac[F.id]; if(F.kind==='dep'&&f.n>4&&f.loy<=3){const o=1+Math.floor(Math.random()*3);f.n-=o;notes.push(F.nm.replace(/"/g,'')+': '+o+' уехали «в округ»');}}
  // измор: в кризис каждую ночь кто-то уходит; сначала те, кто меньше всех верит
  if(S.phase===2){const why=[]; let k=3+Math.floor(Math.random()*4);
    if(S.cordon&&RP.dep){k+=RP.dep;why.push('кольцо');} if(S.flags.noPower){k+=2;why.push('нет света');} if(S.flags.bribe){k+=2;why.push('«гарантии» президента');}
    if(S.hope>=70)k-=2; if(S.laws.mandate)k-=2; if(S.leg>=60)k-=1; k=Math.max(0,k);
    const L=FACTIONS.filter(F=>F.kind==='dep'&&S.fac[F.id].n>0&&S.fac[F.id].loy<8).sort((a,b)=>S.fac[a.id].loy-S.fac[b.id].loy); let left=k,gone=0;
    for(const F of L){const f=S.fac[F.id],q=Math.min(f.n,Math.ceil(left*(f.loy<=3?.6:.45)));f.n-=q;left-=q;gone+=q;if(left<=0)break;}
    if(gone)notes.push('Измор: за ночь ушли '+gone+' депутатов'+(why.length?' ('+why.join(', ')+')':''));}
  {const fd=facDrift(); if(fd.length)notes.push('Фракции: '+fd.join(', '));}
  // Kremlin answers: several moves a night, more as the stakes rise
  S.kdone=S.kdone||{};
  const nK=(S.phase===1?(S.pr>=10?2:1):2+(S.rad>=60||S.day>=15?1:0))-(S.flags.leak?1:0);
  const moves=[]; let kmed=0;
  for(let n=0;n<nK;n++){
    const opts=KREMLIN.filter(k=>!(S.flags.cam&&['провокация','срыв','улица'].includes(k.c))&&!moves.includes(k)&&!(k.once&&S.kdone[k.t])&&!(k.good&&moves.some(m=>m.good))).map(k=>({k,w:k.w(S)})).filter(o=>o.w>0);
    if(!opts.length)break; let r=Math.random()*opts.reduce((a,o)=>a+o.w,0); const k=(opts.find(o=>(r-=o.w)<0)||opts[0]).k; moves.push(k);}
  const rep=[];
  // главный удар Ельцина: объявлен утром, приходит ночью по одному месту
  let struck=false;
  if(S.strike){const T=STRIKES.find(x=>x.id===S.strike.id); struck=true;
    if(T.cover(S)){rep.push({t:T.okT,h:T.okH,e:'<span class="p">удар отбит</span>',c:'Ельцин',g:1,y:1}); S.st.blk=(S.st.blk||0)+1;}
    else{const half=!!S.flags.shield; let fx=T.hit(S); if(half)fx=halve(fx); apply(fx); if(T.run)T.run(S,half); S.flags.shield=0; S.st.hit=(S.st.hit||0)+1; S.hope=clamp(S.hope-2,0,100); if(S.lastStrikeId==='mvd'||T.id==='mvd')S.omon=clamp((S.omon==null?100:S.omon)+10,0,100);
      rep.push({t:T.hitT+(half?' Компромат сбил размах: удар вышел вполсилы.':''),h:T.hitH,e:[fxText(fx),T.e?'<span class="n">'+T.e+'</span>':''].filter(Boolean).join(' · '),c:'Ельцин',y:1});}
    S.lastStrike=S.strike.id; S.strike=null;}
  // Ельцин лично
  if(!struck){S.ydone=S.ydone||{}; const y=YELTSIN.find((y,i)=>!S.ydone[i]&&y.ph===S.phase&&y.w(S)); if(y){S.ydone[YELTSIN.indexOf(y)]=1; apply(y.fx); if(/ОКЛАД/.test(y.h))S.flags.bribe=1; if(y.run)y.run(S); rep.push({t:y.t,h:y.h,e:fxText(y.fx),c:'Ельцин',y:1}); moves.pop();}}
  // клеймо: пока РНЕ в здании, либеральная пресса бьёт каждую ночь и всё сильнее
  if(S.phase===2){const b0=S.flags.brand||0; if(S.fac.rne.n>0){S.flags.rneWas=1;const b=Math.min(3,b0+1);S.flags.brand=b;const fx={city:-b,leg:b>=3?-2:b>=2?-1:0};apply(fx);const T=BRAND_T[b-1];rep.push({t:T[S.day%T.length],e:fxText(fx),c:'клеймо'});}
    else{ if(b0>0)S.flags.brand=b0-1; if(S.rad>=60){apply({city:-1});rep.push({t:'Газеты пишут о «красно-коричневых» в Белом доме: слишком много разговоров о стрельбе.',e:fxText({city:-1}),c:'клеймо'});}}}
  // издания работают каждую ночь на того, чьё они; в газету попадают самые громкие, остальное одной строкой
  {const agg={vs:{},kr:{}},L=[]; for(const o of OUTLETS){const sd=outSt(S,o),e=sd==='vs'?o.pas:sd==='kr'?o.kpas:null; if(!e)continue; apply(e.fx); agg[sd]=merge(agg[sd],e.fx); L.push({sd,e:S.phase===1&&e.t1?{...e,t:e.t1}:e});}
   const sh=a=>a.sort(()=>Math.random()-.5), tx=f=>fxText(f).replace(/<[^>]+>/g,'');
   for(const x of sh(L.filter(x=>x.sd==='vs')).slice(0,1))rep.push({t:x.e.t,e:fxText(x.e.fx),c:'ваша пресса',g:1});
   for(const x of sh(L.filter(x=>x.sd==='kr')).slice(0,S.phase===2?2:1))rep.push({t:x.e.t,e:fxText(x.e.fx),c:'их пресса'});
   if(tx(agg.vs))notes.push('Ваши издания за ночь: '+tx(agg.vs)); if(tx(agg.kr))notes.push('Издания Кремля за ночь: '+tx(agg.kr));}
  if(S.flags.leak)rep.push({t:'Утечка сработала: один ход Кремля сорван, о нём узнали заранее.',e:'',c:'ваша пресса',g:1}); if(S.flags.cam)rep.push({t:'Камеры простояли у оцепления всю ночь. Провокаций не было.',e:'',c:'ваша пресса',g:1}); S.flags.leak=0;S.flags.cam=0;
  for(const k0 of moves){const k=k0.tf?Object.assign({},k0,{t:k0.tf(S)}):k0; if(!k.t)continue; const fx=merge(k.fx,k.dyn?k.dyn(S):{}); apply(fx); if(k0.tf){S.kmed=1;kmed=1;S.kmedT=k.t;} if(k.run)k.run(S); if(k.once)S.kdone[k.t]=1;
    if(fx.city<0||fx.med<0){kmed=1;S.kmedT=k.t;} rep.push({t:k.t,e:fxText(fx)||k.e||'',c:k.c,g:k.good?1:0});}
  if(Math.random()<(S.phase===1?.3:.45)){const pool=KCRISIS.filter(k=>!S.kdone[k.t]&&k.w(S)>0); const k=pool[Math.floor(Math.random()*pool.length)];
    if(k){apply(k.fx);S.kdone[k.t]=1;rep.push({t:k.t,e:fxText(k.fx),c:'кризис в Кремле',g:1,kc:1});}}
  S.sup=Math.max(0,S.sup); S.kmed=kmed;
  S.day++; for(const m of rep)log(m.t,m.g?'':'kr','ночь');
  // every deputy who walks out takes a piece of the mandate with him
  {const now=deputies(S), was=S.depPrev==null?now:S.depPrev, d=now-was; S.st=S.st||{};
   if(d<0){const h=Math.round(-d/5); S.leg=clamp(S.leg-h,0,100); S.st.depOut=(S.st.depOut||0)-d; notes.push('За сутки ушли '+(-d)+' депутатов'+(h?': Легитимность −'+h:''));}
   else if(d>0){const h=Math.floor(d/6); S.st.depIn=(S.st.depIn||0)+d; if(h){S.leg=clamp(S.leg+h,0,100);notes.push('Вернулись '+d+' депутатов: Легитимность +'+h);}}
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
const PAPER_K={'Ельцин':'ПРЕЗИДЕНТ','клеймо':'КТО В БЕЛОМ ДОМЕ','их пресса':'ОБЗОР ПЕЧАТИ','ваша пресса':'ГОЛОС СЪЕЗДА','кризис в Кремле':'В КРЕМЛЕ НЕСПОКОЙНО','силовики':'АРМИЯ И МИЛИЦИЯ','депутаты':'ДЕПУТАТСКИЙ КОРПУС','блокада':'ВОКРУГ БЕЛОГО ДОМА','пресса':'ПЕЧАТЬ И ЭФИР','компромат':'РАЗОБЛАЧЕНИЕ','прослушка':'СПЕЦСЛУЖБЫ','провокация':'ПРОИСШЕСТВИЯ','улица':'ГОРОД','регионы':'РЕГИОНЫ','закон':'УКАЗЫ','деньги':'ДЕНЬГИ','давление':'ВОКРУГ БЕЛОГО ДОМА','срыв':'СБОЙ','слух':'СЛУХИ','ваша ночь':'В БЕЛОМ ДОМЕ'};
const PAPER_PIC={'Ельцин':'yeltsin','клеймо':'barkash','силовики':'grachev','депутаты':'hasb','кризис в Кремле':'yeltsin'};
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
  if(lead.c==='клеймо')R.push({t:'Выставить РНЕ из здания',fx:{city:4,leg:2,hope:-4,rad:-5},run:()=>{S.fac.rne.n=0;S.flags.rneOut=1;S.flags.brand=Math.max(0,(S.flags.brand||0)-1);}});
  else if(lead.c==='Ельцин')R.push({t:'Постановление Президиума в ответ',fx:{leg:2,hope:1,pr:2}});
  else if(lead.g)R.push({t:'Разослать номер по регионам и частям',fx:{med:-4,leg:1,pts:{gs:1}},req:()=>S.med>=4||'нужно 4 Эфира'});
  else R.push({t:'Заявление Президиума Верховного Совета',fx:{leg:1,hope:1,rad:1}});
  if(S.kremlin&&S.kremlin.moves.some(m=>m.kc))R.push({t:'Раздуть скандал в Кремле',fx:{med:-5,city:2,pr:-3},e2:'следующий главный удар Ельцина вполсилы',run:()=>{S.flags.shield=1;},req:()=>S.med>=5||'нужно 5 Эфира'});
  else if(!lead.g)R.push({t:'Опровержение в эфире',fx:{med:-6,city:3},req:()=>S.flags.noComms?'связи нет':S.med>=6||'нужно 6 Эфира'});
  R.push({t:'Промолчать',fx:{},e:'день начнётся без ответа'}); return R;}
function showPaper(){const k=S.kremlin; if(!k){S.paper=0;return startDay();}
  show('paper'); Sfx.play('paper'); Sfx.play('teletype',.25);
  const vs=voiceOf(S,'vs'),kr=voiceOf(S,'kr'),nu=voiceOf(S,'neu'),tot=vs+kr+nu||1, ours=vs>kr;
  const items=k.moves.slice(); const ord=m=>ours?(m.g?0:m.y?1:2):(m.y?0:m.c==='клеймо'?1:m.g?3:2); items.sort((a,b)=>ord(a)-ord(b));
  const lead=items.shift()||{t:'Ночь прошла тихо. В Белом доме горит свет, в Кремле тоже.',e:'',c:'ваша ночь',g:1};
  {const kc=items.findIndex(m=>m.kc); if(kc>0)items.unshift(items.splice(kc,1)[0]);}
  const ST=S.strike&&STRIKES.find(x=>x.id===S.strike.id); if(ST)items.unshift({t:ST.warn,h:ST.warnH,e:'<span class="n">главный удар этой ночью</span>',c:'Ельцин'});
  const side2=lead.t.length<120&&items.length>3?items.shift():null, cols=items.splice(0,3), d=dateOf(S.day), WDN=['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
  let brief=(k.notes||[]).concat(items.map(m=>m.t.replace(/\.$/,'')+(m.e?' ('+m.e.replace(/<[^>]+>/g,'')+')':''))); {let n=0;brief=brief.filter(x=>(n+=x.length+3)<(side2?430:620));}
  k.lead=lead; k.rep=paperReplies(lead);
  $('np-sheet').innerHTML=`<div class="top"><span>№ ${180+S.day} (${1034+S.day})</span><span>Ежедневная газета · выходит с 1990 года</span><span>Цена свободная</span></div>
    <div class="mast">СТОЛИЧНЫЙ ВЕСТНИК</div><div class="rule"></div>
    <div class="date"><span>${WDN[d.getDay()]}, ${dateStr(S.day)} 1993 года</span><span>Москва</span></div>
    <div class="kick">${PAPER_K[lead.c]||lead.c.toUpperCase()}${S.phase===2?' · КРИЗИС, ДЕНЬ '+(S.day-DECREE_DAY+1):''}</div>
    <div class="h1">${lead.h||paperHead(lead.t,58)}</div>
    <div class="lead"><div><canvas class="ph" id="np-ph" width="220" height="110"></canvas></div>
      <div class="txt"><p>${/^[А-ЯЁA-Z]/.test(lead.t)?`<span class="dc">${lead.t.charAt(0)}</span>${lead.t.slice(1)}`:lead.t}</p>${paperStamps(lead.e)}${side2?`<div class="s2"><div class="h2">${side2.h||paperHead(side2.t,44)}</div>${paperBody(side2,side2.h||paperHead(side2.t,44))}${paperStamps(side2.e)}</div>`:''}</div></div>
    <div class="cols">${cols.map(m=>`<div class="col">${m.kc?'<div class="kick" style="margin:0 0 4px">В КРЕМЛЕ НЕСПОКОЙНО</div>':''}<div class="h2">${m.h||paperHead(m.t,40)}</div>${paperBody(m,m.h||paperHead(m.t,40))}${paperStamps(m.e)}</div>`).join('')}</div>
    ${brief.length?`<div class="brief"><b>КОРОТКОЙ СТРОКОЙ</b> ${brief.join(' · ')}</div>`:''}`;
  paperPhoto(PAPER_PIC[lead.c]||(S.phase===2&&S.cordon?'whf':'wh'));
  const now={...snap(),hope:S.hope,rad:S.rad,city:S.city,pr:S.pr}, o=k.d0||now;
  const row=(nm,key,suf,inv)=>{const v=Math.round(now[key]*10)/10, dl=Math.round((now[key]-o[key])*10)/10; return `<div class="row"><span>${nm}</span><span><b>${fmt(v)}${suf||''}</b> ${dl?`<span class="${(dl>0)!==!!inv?'p':'n'}">${dl>0?'+':'−'}${fmt(Math.abs(dl))}</span>`:''}</span></div>`;};
  $('np-side').innerHTML=`<div class="day">УТРО · ДЕНЬ ${S.day}</div><div class="big">УТРЕННЯЯ ГАЗЕТА</div>
    <div class="npw">Сегодня первую полосу пишет пресса <b class="${ours?'v':''}">${ours?'за Совет':'за Кремль'}</b>. ${ours?'Пока редакций у вас больше, главные новости ваши.':'Перетянете редакции в «Эфире», и заголовки будут ваши.'}</div>
    <div class="press"><i class="k" style="width:${kr/tot*100}%"></i><i class="n" style="width:${nu/tot*100}%"></i><i class="v" style="width:${vs/tot*100}%"></i></div>
    <div class="pl"><span>за Кремль ${kr}</span><span>молчат ${nu}</span><span>за Совет ${vs}</span></div>
    <div class="box"><div class="bt">ИТОГИ НОЧИ</div>${row('Легитимность','leg')}${row('Депутаты','dep')}${row('Люди','ppl')}${row('Эфир','med')}${row('Снабжение','sup',' дн.')}${row('Решимость','hope','%')}${row('Радикализм','rad','%',1)}${row('Москва за Совет','city','%')}</div>
    <div class="bt" style="margin-top:10px;margin-bottom:0">ОТВЕТ НА ПЕРВУЮ ПОЛОСУ</div>`+
    k.rep.map((r,i)=>{const st=r.req?r.req():true;return `<div class="ch${st!==true?' lock':''}" data-i="${i}"><span class="k">${i+1}</span><span>${r.t}</span><span class="e">${st!==true?`<span class="n">${st}</span>`:[fxText(r.fx),r.e2].filter(Boolean).join(' · ')||r.e||''}</span></div>`;}).join('')+
    `<div class="go" id="np-go"><span class="a">НАЧАТЬ ДЕНЬ ${S.day}</span><span class="b">ENTER</span></div>`;
  if(ST){const w=$('np-side').querySelector('.npw'); w.className='strk'; w.innerHTML=`<b>ГЛАВНЫЙ УДАР ЕЛЬЦИНА ЭТОЙ НОЧЬЮ: ${ST.nm.toUpperCase()}</b>Прикрыть: ${ST.guard}. Иначе удар будет тяжёлым.${S.flags.shield?' Компромат в ходу: ударит вполсилы.':''}`;}
  $('np-side').querySelectorAll('.ch').forEach(e=>e.onclick=()=>paperGo(+e.dataset.i)); $('np-go').onclick=()=>paperGo(-1);
}
function paperGo(i){const k=S.kremlin; if(!k||screen!=='paper')return; const r=k.rep&&k.rep[i];
  if(r){if(r.req&&r.req()!==true)return; apply(r.fx); if(r.run)r.run(); if(r.fx&&Object.keys(r.fx).length)log('Ответ на первую полосу: '+r.t.toLowerCase()+'.');}
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
    $('ev-cap-n').textContent='БОРИС ЕЛЬЦИН';$('ev-cap-r').textContent='Президент Российской Федерации';}
  else if(pic==='tank'){ TitleArt.onReady(()=>drawTankShot(c));
    $('ev-cap-n').textContent='НОВОАРБАТСКИЙ МОСТ';$('ev-cap-r').textContent='Танки бьют по Белому дому';}
  else if(pic==='ost'){ drawOstankino(c);
    $('ev-cap-n').textContent='ОСТАНКИНО';$('ev-cap-r').textContent='Телецентр, улица Академика Королёва, 12';}
  else{TitleArt.onReady(()=>c.drawImage(pic==='whf'?TitleArt.burning:TitleArt.calm,270,0,320,360,0,0,320,360));
    $('ev-cap-n').textContent='БЕЛЫЙ ДОМ';$('ev-cap-r').textContent='Дом Советов, Краснопресненская набережная';}
}
function showEvent(ev){
  evCur=ev; evSel=Math.max(0,ev.ch.findIndex(c=>!(c.req&&!c.req(S)))); show('event'); drawPhoto(ev.pic); Sfx.play(ev.end?(ev.win?'win':'lose'):ev.pic==='yeltsin'?'static':ev.urgent?'alarm':/grachev|kolesn|yerin/.test(ev.pic)?'phone':'paper');
  const tag=$('ev-tag'); tag.className='tag'+(ev.end?(ev.win?' win':' end'):''); tag.textContent=ev.end?(ev.win?'ПОБЕДА':ev.tier==='neu'?'НИЧЬЯ · КРИЗИС БЕЗ ПОБЕДИТЕЛЯ':'ПОРАЖЕНИЕ'):ev.tag||'СОБЫТИЕ';
  $('ev-hud').innerHTML=`<span>День <b>${S.day}</b></span><span>Легитимность <b>${S.leg}</b></span><span>Решимость <b>${S.hope}%</b></span><span>Радикализм <b>${S.rad}%</b></span>`;
  $('ev-meta').textContent=(dateStr(S.day)+' 1993'+(ev.time?' · '+ev.time:'')).toUpperCase();
  $('ev-meta2').textContent=ev.urgent?'СРОЧНО':'';
  $('ev-h').textContent=ev.h; $('ev-q').textContent=ev.q||''; $('ev-p').textContent=ev.p; $('ev-res').innerHTML='';
  renderChoices();
}
function renderChoices(){
  $('ev-ch').innerHTML=evCur.ch.map((c,i)=>{const fx=c.fx?fxText(merge(c.fx,c.fac?{fac:c.fac}:{})):'';
    let e=[fx,typeof c.e==='function'?c.e(S):c.e].filter(Boolean).join(' · ');
    const lk=c.req&&!c.req(S); if(lk)e='<span class="n">нужно: '+c.rq+'</span>'; else if(c.rq)e=[e,'<span class="p">открыто: '+c.rq+'</span>'].filter(Boolean).join(' · ');
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
function ASSAULT(){return {id:'assault',pic:unitStance(UNITS.find(u=>u.id==='tanks'))==='refuse'?'whf':'tank',time:'07:00',urgent:1,tag:'ФАЗА 3 · ШТУРМ',h:'ШТУРМ',q:'Танки на Новоарбатском мосту',
  p:(S.flags.corner==='army'?'Армия уходит из-под Кремля: Минобороны и Генштаб почти открыто на стороне Съезда. Ельцин понимает, что завтра штурмовать будет некем, и отдаёт приказ сегодня, тем, кто ещё слушается. ':S.flags.corner==='elect'?'Суд, регионы и город требуют выборов. Ельцин загнан в угол и решает кончить дело силой, пока его приказы ещё выполняют. Части идут неохотно. ':'')+'На рассвете к Белому дому выдвинулась бронетехника. Кто из силовиков выполнит приказ, а кто откажется — зависит от того, с кем вы успели договориться. Оборона идёт по часам, до вечера.',
  ch:[
    {t:'К оружию! Занять оборону',e:`бойцов ${fmt(S.mil)} · безоружных ${fmt(S.ppl)} · баррикады ${S.bar}/5`,go:()=>startAssault()},
    {t:'Вывести людей под гарантии',e:'депутаты сдаются без боя',go:()=>ending('surrender')},
  ]};}
const ENDINGS={
  win_army:{win:1,pic:'wh',h:'АРМИЯ С НАРОДОМ',q:'Министерство обороны и Генштаб поддержали Съезд',
    p:'Командующие округами отказались выполнять указ №1400. Штурмовать парламент некому: без армии Кремлю нечем ответить. Ельцин соглашается на досрочные выборы президента.'},
  win_elect:{win:1,pic:'whf',h:'ВЫБОРЫ',q:'Штурм отбит, Кремль отступил',
    p:'Ельцин попробовал решить дело силой и не смог. Конституционный суд, советы регионов и пресса едины: указ незаконен. Кремль снимает блокаду и соглашается на одновременные выборы на условиях Съезда.'},
  elect_deal:{tier:'neu',pic:'wh',h:'НУЛЕВОЙ ВАРИАНТ',q:'Выборы вместо штурма',
    p:'До стрельбы не дошло. Суд, регионы и пресса заставили обе стороны отступить: указ №1400 отменён, решения Съезда тоже, назначены одновременные выборы. Верховный Совет дотянул до них, но это не победа. На выборах у Кремля телевидение, деньги и избиркомы, а новый закон о парламенте писали уже без вас. Прежней роли у Верховного Совета больше не будет.'},
  held:{win:1,pic:'whf',h:'УСТОЯЛИ',q:'Штурм захлебнулся',
    p:'Белый дом горит, но входы удержаны. К вечеру к зданию стекаются десятки тысяч москвичей. Кремль объявляет перемирие.'},
  held_iso:{tier:'neu',pic:'whf',h:'ОТБИЛИСЬ, НО ОДНИ',q:'Штурм отбит, признания нет',
    p:'Входы удержаны, но страна видела по телевизору только людей с автоматами и слышала только призывы к расправе. Регионы молчат, Запад говорит о мятеже, Москва обходит набережную стороной. Кремль отвёл войска и ждёт. Съезд сидит в обгоревшем здании, которое некому признать властью. Победы нет ни у кого.'},
  pyrrhic:{tier:'neu',pic:'whf',h:'ПИРРОВА ПОБЕДА КРЕМЛЯ',q:'Здание взято, власть не удержана',
    p:'Белый дом взят, но страна видела, как расстреливают парламент. Часть войск не выполнила приказ, регионы и Конституционный суд указ не признают. Ельцин сидит в Кремле и не может править: его распоряжения возвращаются неисполненными. Впереди месяцы двоевластия и торга, в котором проиграли оба.'},
  draw_alpha:{tier:'neu',pic:'wh',h:'«АЛЬФА» НЕ СТРЕЛЯЕТ',q:'Спецназ отказался штурмовать и вывел людей сам',
    p:'Офицеры «Альфы» вошли в здание без оружия и сказали при камерах, что приказа стрелять по парламенту выполнять не будут. Депутаты и защитники вышли под их гарантии. Белый дом потерян, но приказ президента публично не выполнен его же спецназом. Командовать Ельцин больше не может, и всем понятно, чем был указ №1400. Съезда тоже нет. Страна входит в долгий кризис без победителя.'},
  fell:{pic:'whf',h:'4 ОКТЯБРЯ',q:'Белый дом горит',
    p:'Штурмовые группы ворвались в здание. К вечеру защитники выходят под конвоем. Верховный Совет перестал существовать.'},
  broken:{pic:'whf',h:'ОГОНЬ ПРЕКРАЩЁН',q:'Защитники сложили оружие',
    p:'После танкового обстрела держаться больше некому. Из подъездов выходят с белыми простынями. Съезд распущен.'},
  surrender:{pic:'wh',h:'КАПИТУЛЯЦИЯ',q:'Депутаты выходят из здания',
    p:'Под гарантии посредников защитники сдают оружие и выходят к автобусам. Крови меньше, но Съезда больше нет.'},
  surrender_alpha:{pic:'whf',h:'ПОД ГАРАНТИИ «АЛЬФЫ»',q:'Офицеры вывели людей из горящего здания',
    p:'«Альфа» отказалась штурмовать и сама вывела депутатов и защитников через оцепление. Крови могло быть больше. Верховного Совета больше нет.'},
  lose_hope:{pic:'wh',h:'РАЗОШЛИСЬ',q:'Защитники покинули баррикады',
    p:'Холод, голод и неизвестность сделали своё. Белый дом пустеет без единого выстрела. Указ №1400 вступает в силу.'},
  lose_leg:{pic:'yeltsin',h:'СЪЕЗД РАСПАЛСЯ',q:'Никто больше не верит Верховному Совету',
    p:'Регионы признали указ, депутаты сдают мандаты один за другим. Кремлю даже не нужен штурм.'},
  lose_ppl:{pic:'wh',h:'ПУСТЫЕ БАРРИКАДЫ',q:'Белый дом некому защищать',
    p:'Последние добровольцы ушли. Ночью ОМОН спокойно занимает здание.'},
};
// условия выборов без штурма (нужны все)
function dealScore(){const mine=OUTLETS.filter(o=>outSt(S,o)==='vs').length, kr=OUTLETS.filter(o=>outSt(S,o)==='kr').length, ci=ACTIONS.kre.findIndex(a=>/Иск в Конституционный суд/.test(a.t));
  return [[(S.flags.zero||0)>=1,'нулевой вариант принят'],[!!(S.once&&S.once['kre'+ci]),'иск в Конституционный суд подан'],[mine>=10&&kr<=4,'за вас от 10 изданий, за Кремль не больше 4 (сейчас '+mine+' и '+kr+')'],
    [S.leg>=85,'Легитимность от 85 (сейчас '+S.leg+')'],[S.city>=80,'Москва от 80% (сейчас '+S.city+'%)'],[S.pts.mo>=50||S.pts.gs>=50,'Минобороны или Генштаб от 50%'],[S.rad<40&&S.fac.rne.n<=0,'Радикализм ниже 40 и нет РНЕ в здании'],[S.day>=18,'не раньше 1 октября']];}
function checkLose(){
  if(S.phase===1){S.hope=Math.max(S.hope,10);S.leg=Math.max(S.leg,10);return false;}
  if(S.hope<=0){ending('lose_hope');return true;}
  if(S.leg<=0){ending('lose_leg');return true;}
  if(S.phase===2&&S.ppl+S.mil<=0){ending('lose_ppl');return true;}
  return false;
}
// три яруса исходов: победа, нейтральный (здание потеряно, но Ельцин политически надломлен), поражение
const endTier=id=>{const E=ENDINGS[id]||{};return E.win?'win':E.tier||'lose';};
function drawScore(){const A=S.A||{units:[],air:0}; return [[S.leg>=50,'Легитимность от 50 (сейчас '+S.leg+')'],[(A.air||0)>=50,'Эфир от 50 (сейчас '+Math.round(A.air||0)+')'],[A.units.some(u=>u.id!=='alpha'&&(u.st==='refuse'||u.st==='stopped')),'хотя бы одна часть отказалась или остановлена'],[S.city>=55,'Москва от 55% (сейчас '+S.city+'%)']];}
function ending(id,exact){
  if(exact);
  else if((id==='fell'||id==='broken')&&drawScore().filter(x=>x[0]).length>=3)id='pyrrhic';
  if(!exact&&id==='held'&&S.flags.corner)id=S.flags.corner==='army'?'win_army':'win_elect';
  if(!exact&&id==='held'&&(S.rad>=70||(S.leg<35&&S.A&&S.A.air<30)||(S.A&&S.A.air<50&&(S.A.lost||0)+S.A.units.reduce((x,u)=>x+(u.lost||0),0)>=1500)))id='held_iso'; // без прессы или ценой большой крови без камер // кучка радикалов без прессы: отбились, но никто не признал
  const E={...ENDINGS[id]}; if(id==='fell')E.h=dateStr(S.day).toUpperCase(); if(S.A)S.A.card=0; $('modal').classList.remove('on');
  store.del(SAVE); store.set(CHRON,S.chron);
  S.endId=id; if(typeof aBanQ!=='undefined')aBanQ=[]; if(typeof achEnd==='function')achEnd(id); {const bn=$('a-banner'); if(bn)bn.className='';} stat('end-'+({win:'win',neu:'neutral'}[endTier(id)]||'lose')+'-'+id.replace(/_/g,'-'));
  showEvent({...E,tier:endTier(id),id:'end',end:1,time:'',urgent:0,ch:[
    {t:'Что стало с каждым',go:()=>showEpi(0)},
    {t:'Итоги в цифрах',go:()=>openFinal()},
    {t:'Начать заново',go:()=>newGame()},
    {t:'В главное меню',go:()=>{show('title');renderMenu();}},
  ]});
  $('ev-res').textContent=`Продержались дней: ${S.day}. Решений принято: ${S.chron.length}.`;
}

// ===== эпилог: слайды «что стало с каждым». Гипотетические судьбы зависят от исхода, лояльности фракции, того, на чьей стороне была сила, и решений партии =====
// фракции: [ушли до конца, победа+верны, победа+колебались, поражение+верны, поражение+колебались]
const EPI_FAC={
  ros:['Фракция «Россия» разъехалась по регионам собирать советы и к развязке не успела. Бабурин потом говорил, что его люди ушли слишком рано, и не спорил, когда ему отвечали то же самое.',
       'Бабурин возглавил комиссию по новой Конституции. Юристы «России», писавшие постановления в осаждённом здании, теперь пишут основной закон, и парламент в нём сильнее президента.',
       '«Россия» осталась в победившем Съезде, но ей помнят дни, когда её голоса приходилось уговаривать. В конституционную комиссию Бабурина взяли заместителем, а не главой.',
       'Бабурин вышел из здания одним из последних, у стадиона его избили. В декабре избиратели Омска снова выбрали его депутатом, и с трибуны Думы он повторял то же, что говорил в Белом доме.',
       'В последние дни фракция уже искала выход поодиночке. Бабурина всё равно избили при выходе из здания, а в декабре Омск вернул его в парламент, уже без фракции.'],
  kr: ['«Коммунисты России» ушли до развязки. Рыбкин договорился с правительством раньше остальных и сохранил партию для выборов.',
       'Коммунисты получили три министерства в правительстве национального согласия. Партийные ячейки, выводившие людей к Белому дому, за одну осень стали самой организованной силой страны.',
       'Коммунисты остались в Съезде, но министерств им не дали: слишком долго считали, чья возьмёт. Рыбкин занялся тем, что умел лучше всего, и стал посредником между всеми.',
       'Фракция стояла до конца, и партию на несколько недель запретили. К декабрьским выборам запрет сняли. Рыбкин прошёл в Думу и стал её первым председателем.',
       'Коммунисты ушли из здания за день до конца, и это им зачли: партию допустили к выборам сразу. Рыбкин стал председателем новой Думы, а защитники Белого дома здороваться с ним перестали.'],
  agr:['Аграрии вернулись в свои области до конца событий. Уборочная, сказал Лапшин, ждать не будет.',
       'Аграрный союз провёл через Съезд закон о земле в своей редакции: без свободной продажи. Совхозы, возившие в осаду картошку, получили списание долгов.',
       'Аграрии остались, но торговались до последнего дня. Закон о земле приняли в компромиссной редакции, а Лапшин получил комитет вместо министерства.',
       'Лапшин вывел своих людей под конвоем и через месяц собрал Аграрную партию. В декабре она прошла в Думу и торговалась за бюджет села с теми, кто стрелял по Белому дому.',
       'Аграрии сдали мандаты в обмен на обещание не трогать колхозы. Обещание продержалось год. Аграрная партия прошла в Думу и голосовала за бюджет правительства.'],
  otc:['Депутаты в погонах из «Отчизны» ушли и унесли с собой связи в округах. В решающую ночь звонить в штабы было уже некому.',
       'Генералы «Отчизны» вернулись в Министерство обороны победителями. Тарасов получил кресло заместителя министра и первым делом остановил сокращение армии.',
       '«Отчизна» дотянула до победы, но её звонки в округа были осторожнее, чем просил штаб. В министерстве генералам фракции дали кабинеты без войск.',
       'Генералов «Отчизны» уволили в запас без права носить форму. Тарасов через год вернулся в политику, но уже без погон и без фракции.',
       '«Отчизна» перестала звонить в округа за несколько дней до конца. Генералов всё равно уволили: Кремль запомнил не то, чем кончилось, а то, с чего начиналось.'],
  sm: ['«Смена» вышла к камерам раньше всех и предложила выборы без Ельцина и без Хасбулатова. Их показали по всем каналам один вечер.',
       '«Смена» стала лицом победы, за которую не стыдно: молодые депутаты вели переговоры о выборах и объясняли Западу, что в Москве победил парламент, а не баррикады.',
       '«Смена» осталась, но до последнего держала дверь открытой в обе стороны. На переговоры о выборах Головина позвали советником, а не главой делегации.',
       'Фракция распалась в ту же неделю. Её депутаты разошлись по новым партиям, а Головин ещё несколько лет объяснял, что был против и указа, и стрельбы.',
       '«Смена» вышла из здания с белым флагом раньше, чем кончилось. Кремль поблагодарил, избиратели не простили: в декабре из фракции не выбрали почти никого.'],
  kol:['Колеблющиеся ушли по одному. Указ обещал каждому должность и годовой оклад, и почти все их получили.',
       'Колеблющиеся остались и потом рассказывали, что не сомневались ни минуты. Абдулатипов возглавил согласительную комиссию с регионами и оказался там на своём месте.',
       'Колеблющиеся досидели до победы, глядя на дверь. Им этого не забыли: в новом Съезде их голоса больше никто не считал заранее.',
       'Они остались до конца и сами удивились этому. Должностей им уже не предложили. Абдулатипов через несколько месяцев всё равно оказался в верхней палате нового парламента.',
       'Получили от Кремля обещанные должности и компенсации. Абдулатипов стал заместителем председателя Совета Федерации и о сентябре вспоминать не любил.'],
};
// силы: [победа+были за Совет, победа+были за Кремль или колебались, поражение+были за Совет, поражение+за Кремль]
const EPI_PT={
  mer:['Лужков вовремя понял, куда дует ветер, и включил свет раньше, чем его об этом попросили. Мэром он остался, но Моссовет теперь утверждает его бюджет построчно.',
       'Лужков до последнего дня держал Белый дом без света и воды. Моссовет отправил его в отставку первым же решением после победы. Через два года он вернулся в городскую политику.',
       'Мэрия колебалась дольше, чем Кремль был готов терпеть. Лужков усидел, но ценой Моссовета: городские советы распустили его же распоряжением.',
       'Лужков отключил зданию свет, воду и канализацию и ни разу об этом не пожалел. Моссовет распустили, а мэром он оставался до 2010 года.'],
  smo:['Анпилов привёл на Смоленскую столько людей, что милиция отступила. После победы «Трудовая Россия» требовала суда над правительством, и Съезду пришлось объяснять своим же союзникам, что победа не означает расправы.',
       'Улицу у Анпилова отбили ещё до развязки. Победу Съезда он встретил с мегафоном у закрытых дверей и считал, что её у него украли.',
       'Анпилов держал площадь до конца. Его арестовали через три дня в деревне под Тулой. В феврале 1994 года он вышел по амнистии и вернулся на площадь.',
       'Смоленскую зачистили за один вечер. Анпилова взяли в деревне под Тулой, в феврале 1994 года он вышел по амнистии.'],
  mo: ['Грачёв так и не отдал приказ, которого от него ждал Кремль. Министром он не остался: Съезд хотел человека, который сказал «нет» сразу, а не того, кто молчал две недели.',
       'Грачёв был готов выполнить приказ, но приказ не дошёл до танков. Он подал в отставку в день перемирия и до конца жизни считал, что армию тогда предали с обеих сторон.',
       'Грачёв тянул и требовал письменный приказ. Получил его под утро. Ельцин ему этого не простил: министра сменили через несколько месяцев.',
       'Грачёв потребовал письменный приказ и получил его. Танки вышли на мост. Министром обороны он оставался до 1996 года.'],
  gs: ['Генштаб не дал Кремлю ни одной дивизии. Колесников остался начальником Генерального штаба при новой власти: человека, который удержал армию в казармах, менять не стали.',
       'Колесников ждал, чем кончится, и дождался. При Съезде он прослужил ещё полгода и ушёл сам.',
       'Генштаб саботировал приказы как умел: терялись шифровки, не заводились колонны. Этого хватило, чтобы задержать штурм, но не чтобы его отменить. Колесникова тихо убрали через год.',
       'Генштаб выполнил приказ без энтузиазма и без задержек. Колесников оставался на посту до 1996 года.'],
  mvd:['Офицеры внутренних войск отказались идти на проволоку, и Ерин остался министром без министерства. Он ушёл в отставку в день перемирия.',
       'Ерин держал оцепление до последнего часа. После победы Съезда его уволили и допрашивали о приказах тех дней. До суда дело не дошло.',
       'В МВД были офицеры, отводившие посты и смотревшие в сторону. Их уволили той же осенью. Ерин получил звезду Героя России.',
       'ОМОН и внутренние войска сделали то, что от них требовали. Ерин получил звезду Героя России и ушёл в отставку только в 1995 году, после Будённовска.'],
  ost:['Останкино дало Съезду эфир, и страна впервые увидела осаду изнутри. Брагина сняли, а телецентр перешёл под наблюдательный совет парламента.',
       'Останкино до конца показывало то, что нужно Кремлю. Брагина уволили на следующий день после победы, телевидение передали под контроль Съезда.',
       'В Останкине нашлись редакторы, пускавшие в эфир депутатов. Их уволили первыми. Брагина Кремль снял в декабре: слишком много лишнего ушло в эфир.',
       'Останкино оставалось голосом Кремля все эти дни. Брагина всё равно сняли в декабре, после неудачных для власти выборов.'],
};
// ничья и «нулевой вариант»: [были верны, колебались]
const EPI_FAC_N={
  ros:['Юристы «России» до последнего дня писали постановления, и ни одно из них суд потом не отменил. Бабурин остался в политике как человек, который не уступил и не победил. В Омске его выбирали снова и снова.',
       '«Россия» в последние дни искала выход поодиночке. Когда кризис кончился без победителя, Бабурин собрал фракцию заново, но прежнего веса у неё уже не было.'],
  kr: ['Коммунисты остались до конца и вышли из кризиса с партией, которую никто не посмел запретить. На следующих выборах они собрали голоса тех, кто не простил ни Кремлю, ни Съезду.',
       'Коммунисты считали, чья возьмёт, а не взял никто. Рыбкин первым сел за стол переговоров с правительством и сохранил партию для выборов.'],
  agr:['Аграрии кормили осаждённое здание до последнего дня. Закон о земле остался таким, каким был: ни одна сторона не набрала сил его переписать. Лапшин называл это своей главной победой.',
       'Аграрии торговались с обеими сторонами и ни одной ничего не остались должны. Через месяц Лапшин собрал Аграрную партию и повёл её на выборы.'],
  otc:['Генералы «Отчизны» звонили в округа до последней ночи. В армию их не вернули, но и увольнять с позором не решились: слишком многие командиры помнили эти звонки.',
       '«Отчизна» звонила в округа осторожнее, чем просил штаб. Генералы фракции тихо ушли в запас. Тарасов через год вернулся в политику уже без погон.'],
  sm: ['«Смена» вела переговоры за всех, кто не хотел говорить друг с другом. Когда кризис кончился без победителя, оказалось, что этого она и добивалась. Головина звали в каждую согласительную комиссию.',
       '«Смена» держала дверь открытой в обе стороны и вошла в ту, что открылась. Её депутаты разошлись по новым партиям, а Головин ещё долго объяснял, что был против обеих сторон сразу.'],
  kol:['Колеблющиеся остались до конца и сами этому удивились. Абдулатипов возглавил согласительную комиссию с регионами: когда никто не победил, посредники оказались нужнее героев.',
       'Колеблющиеся ждали, чем кончится, и не дождались ясного ответа. Должности, обещанные Кремлём, получили не все. Абдулатипов всё равно оказался в верхней палате нового парламента.'],
};
// ничья: [были за Совет, были за Кремль или колебались]
const EPI_PT_N={
  mer:['Лужков включал зданию свет и снова выключал, смотря по новостям. Мэром он остался: когда в стране нет победителя, хозяин города нужен обеим сторонам.',
       'Лужков держал Белый дом без света и воды все эти дни. Когда кризис кончился без победителя, Моссовет потребовал его отставки и не собрал голосов. Мэром он оставался ещё много лет.'],
  smo:['Анпилов держал Смоленскую до конца и считал, что улица сделала больше, чем депутаты. «Трудовая Россия» требовала суда над правительством. Суда не было, митинги продолжались.',
       'Улицу у Анпилова отбили ещё до развязки. Он остался на свободе и с мегафоном: арестовывать его после такой осени было незачем.'],
  mo: ['Грачёв так и не дал Кремлю армию целиком. Ельцин ему этого не простил, Съезд ему не поверил. Министра сменили через несколько месяцев, и обе стороны сочли это своей заслугой.',
       'Грачёв выполнял приказы Кремля, пока было что выполнять. Развязка без победителя оставила его министром армии, которая больше не хотела, чтобы её звали в Москву.'],
  gs: ['Генштаб саботировал приказы как умел: терялись шифровки, не заводились колонны. Колесникова за это не наградили и не наказали. Он прослужил ещё полгода и ушёл сам.',
       'Генштаб выполнял приказы без энтузиазма и без задержек. Колесников остался на посту и до конца службы избегал разговоров о той осени.'],
  mvd:['В МВД были офицеры, отводившие посты и смотревшие в сторону. Уволить их Ерин не смог: слишком шатким вышел итог. Сам он ушёл в отставку через год.',
       'Оцепление Ерин держал до последнего часа. Звезду Героя ему за это не дали: награждать за осень, в которой никто не победил, Кремль не решился.'],
  ost:['Останкино дало слово депутатам, и страна увидела осаду изнутри. Брагина сняли. Телецентр получил наблюдательный совет, в котором Кремль и парламент ещё год блокировали друг друга.',
       'Останкино до конца показывало то, что нужно Кремлю. Брагина всё равно сняли: кто-то должен был ответить за то, что страна поверила не телевизору.'],
};
// поражение без штурма («Разошлись», «Съезд распался», «Пустые баррикады», сдача до боя): замены для текстов, где упомянуты штурм и танки
const EPI_NOA={
  ros3:'Бабурин вышел из пустеющего здания одним из последних. В декабре избиратели Омска снова выбрали его депутатом, и с трибуны Думы он повторял то же, что говорил в сентябре.',
  ros4:'В последние дни фракция искала выход поодиночке. В декабре Омск вернул Бабурина в парламент, уже в другой.',
  agr3:'Лапшин увёл своих людей последним и через месяц собрал Аграрную партию. В декабре она прошла в Думу и торговалась за бюджет села.',
  mo2:'Грачёв тянул и требовал письменный приказ. Приказ не понадобился: Белый дом опустел сам. Ельцин запомнил, что министр ждал, и сменил его через несколько месяцев.',
  mo3:'Грачёв был готов выполнить приказ. Выводить танки не пришлось: здание опустело без единого выстрела. Министром обороны он оставался до 1996 года.',
  gs2:'Генштаб саботировал приказы как умел: терялись шифровки, не заводились колонны. Хватило бы этого или нет, проверить не довелось: до штурма дело не дошло.',
  gs3:'Генштаб был готов выполнить приказ без энтузиазма и без задержек. Приказа не понадобилось. Колесников оставался на посту до 1996 года.',
};
function epilogue(){
  const id=S.endId||'', K=id==='elect_deal'?'deal':endTier(id)==='neu'?'draw':/army/.test(id)?'army':id==='win_elect'?'elect':id==='held'?'held':/fell|broken/.test(id)?'fell':/surrender/.test(id)?'surr':'fade', win=K==='army'||K==='elect'||K==='held', neu=K==='deal'||K==='draw', noA=!win&&!neu&&!(S.A&&S.A.units);
  const L=[], add=(pic,h,q,p)=>L.push({pic,h,q,p});
  add(win?'wh':K==='fell'?'whf':'wh','ЭПИЛОГ','Что стало с каждым','Дальше то, чего не было. Или было не так. Судьбы зависят от того, чем кончилась ваша осень, кто остался с вами до конца и на чьей стороне оказались армия, милиция, мэрия и эфир.');
  add('hasb','ХАСБУЛАТОВ','Председатель Верховного Совета',{army:'Хасбулатов принял отставку правительства в том же зале, где две недели сидел при свечах. До досрочных выборов он оставался вторым человеком в стране, а многие считали, что первым.',
    deal:'Хасбулатов подписал «нулевой вариант» и остался председателем до выборов. Он называл это победой права. В новом парламенте, избранном по новому закону, председателя с такими полномочиями уже не было.',
    elect:'Хасбулатов отбил штурм и согласился на одновременные выборы. На них он не пошёл: сказал, что его дело было сохранить парламент, а не возглавить его снова.',
    held:'Хасбулатов вышел к людям у обгоревшей стены и объявил перемирие. Победа досталась ему вместе со списком погибших, и этот список ему потом напоминали на каждых выборах.',
    draw:S.endId==='held_iso'?'Хасбулатов остался председателем парламента, который признают только в пределах оцепления. Он требовал от радикалов замолчать, но микрофон был уже не у него.':'Хасбулатов вышел из здания свободным человеком: арестовать председателя парламента после всего, что показали камеры, Кремль не решился. Он объявил, что Съезд продолжит работу в любом зале страны, и регионы один за другим предлагали ему этот зал.',
    fell:'Хасбулатова вывели из здания под конвоем и увезли в Лефортово. 26 февраля 1994 года он вышел по амнистии Государственной думы и вернулся преподавать в Плехановский институт.',
    surr:'Хасбулатов подписал условия сдачи и вышел к автобусам вместе с депутатами. Лефортово, амнистия в феврале 1994 года, кафедра в Плехановском институте.',
    fade:'Хасбулатов остался в пустеющем здании почти один. Его даже не арестовали: Кремлю было важнее показать, что арестовывать некого. Он вернулся на кафедру.'}[K]);
  add('rutskoy','РУЦКОЙ','Вице-президент',K==='deal'?'Руцкой сложил полномочия исполняющего обязанности президента в тот день, когда указ №1400 отменили. Он называл компромисс капитуляцией обеих сторон сразу. На выборы он пошёл сам и проиграл, а через три года стал губернатором Курской области.':K==='draw'&&S.endId==='held_iso'?'Руцкой принимал парад защитников во дворе Белого дома. Его указы исполнялись в радиусе трёхсот метров. Дальше начиналась страна, которая запомнила его призыв бомбить Кремль.':K==='draw'?'Руцкой вышел последним и показал журналистам автомат в смазке. Половина страны считала его исполняющим обязанности президента, вторая половина считала мятежником, и обе были по-своему правы. Суда над ним так и не случилось.':win?(S.rad>=60?'Руцкой принял присягу исполняющего обязанности президента и выполнил половину обещаний, данных с балкона. Вторая половина касалась тюрем, и Съезд её не утвердил.':'Руцкой исполнял обязанности президента до досрочных выборов и, к общему удивлению, действительно их провёл.'):
    (K==='fade'?'Руцкой сложил с себя полномочия, которые никто, кроме Съезда, не признавал. Через три года его выбрали губернатором Курской области.':'Руцкой сдался последним и показал журналистам автомат в смазке: не стрелял. Лефортово, амнистия в феврале 1994 года. В 1996-м его выбрали губернатором Курской области.'));
  add('yeltsin','ЕЛЬЦИН','Президент России',{army:'Армия не выполнила приказ, и это был конец. Ельцин согласился на досрочные выборы, в которых участвовать не стал, и уехал на дачу в Барвиху писать книгу.',
    deal:'Ельцин отменил указ №1400 и назвал это «шагом к согласию». До выборов он успел сменить закон о парламенте и руководство телевидения. Выборы он выиграл. Насколько честно, спорят до сих пор.',
    elect:'Ельцин отозвал указ №1400, назвав это «шагом к согласию». На одновременных выборах он выставил свою кандидатуру. Чем они кончились, эта игра не знает.',
    held:'Штурм захлебнулся на глазах у всего мира. Ельцин объявил перемирие и через неделю согласился на выборы. Тех, кто отдавал приказы о стрельбе, он назвал поимённо, себя среди них не назвал.',
    draw:'Ельцин остался в Кремле, но приказы оттуда больше не выполнялись: округа ждали письменных подтверждений, регионы оставляли налоги себе, суд назвал указ №1400 переворотом. Через несколько месяцев он согласился на досрочные выборы и на них не пошёл.',
    fell:'Ельцин правил указами до декабря. 12 декабря 1993 года на референдуме приняли новую Конституцию с сильным президентом и слабым парламентом. Она действует до сих пор.',
    surr:'Ельцин получил здание без большого боя и поставил это себе в заслугу. В декабре приняли его Конституцию. О гарантиях, данных сдавшимся, вспомнили только в феврале, когда Дума объявила амнистию.',
    fade:'Кремлю не понадобился штурм. Ельцин подписал указ о выборах в новый парламент и в декабре провёл через референдум свою Конституцию.'}[K]);
  for(const F of FACTIONS){ if(F.kind!=='dep')continue; const f=S.fac[F.id], T=EPI_FAC[F.id]; if(!T)continue; const gone=f.n<=0, loyal=f.loy>=6;
    add(FAC_WHO[F.id],F.nm.replace(/"/g,'«').replace(/«([^«]*)«/,'«$1»').toUpperCase(),gone?'Ушли до развязки':LOY[loyLvl(f.loy)].nm[0].toUpperCase()+LOY[loyLvl(f.loy)].nm.slice(1)+' · осталось '+f.n,gone?T[0]:neu?EPI_FAC_N[F.id][loyal?0:1]:win?T[loyal?1:2]:(noA&&EPI_NOA[F.id+(loyal?3:4)])||T[loyal?3:4]); }
  { const f=S.fac.rne, was=f.n>0||S.flags.rneWas;
    add('barkash','РНЕ',f.n>0?'Остались в здании до конца':was?'Выставлены или ушли сами':'В здание не пустили',
      neu?(f.n>0?'Баркашовцы оставались в здании до развязки и ушли с оружием. Кадры с их строем Кремль показывал при каждом удобном случае: «вот с кем нам предлагают договариваться». Отмыться от этих кадров Съезду так и не удалось.'
            :was?'РНЕ к развязке в здании уже не было. Баркашов говорил, что его предали. Обвинение в фашизме к защитникам всё равно клеили, но держалось оно плохо: показывать было некого.'
            :'Баркашову отказали у дверей. Чёрной формы на снимках у Белого дома не оказалось, и это стало одной из причин, по которым Кремль не смог объявить парламент мятежом.')
      :noA?(f.n>0?'Баркашовцы ушли из здания последними, строем и с оружием. Кадры с этим строем Кремль показывал всю зиму: «вот кто там сидел». Баркашова арестовали зимой, в феврале он вышел по амнистии.'
            :was?'РНЕ к концу в здании уже не было. Обвинение в фашизме к защитникам всё равно приклеили, но держалось оно хуже: показывать было некого.'
            :'Баркашову отказали у дверей. Никто не смог показать по телевизору свастику у стен парламента, но Белый дом это не спасло.')
      :f.n>0?(win?'Баркашовцы держали двадцатый подъезд и потребовали свою долю победы: помещение, оружие, место в охране Съезда. Либеральные газеты получили фотографию, которую печатали ещё десять лет: чёрная форма на ступенях парламента. Разоружать РНЕ пришлось уже новой власти.'
                 :'Баркашовцы дрались у подъезда дольше всех, а потом ушли через коллекторы с оружием. Кадры с их строем стали главным оправданием штурма: «там были фашисты». Баркашова арестовали зимой, в феврале он вышел по амнистии.')
      :was?(win?'РНЕ в победившем Белом доме не было, и победу Съезда никто не смог назвать коричневой. Баркашов говорил, что его предали. Через год о его организации писали уже только в криминальной хронике.'
              :'Съезд выставил РНЕ и остался без лучшего отряда. Баркашов увёл людей и в бою не участвовал. Обвинение в фашизме к защитникам всё равно приклеили, но оно держалось хуже: показывать было некого.')
      :(win?'Баркашову отказали у дверей, и это оказалось одним из самых дешёвых решений той осени: без чёрной формы на снимках Запад признал победу парламента в тот же день.'
           :'Баркашову отказали у дверей. Ста двадцати обученных бойцов в день штурма не хватило, зато никто не смог показать по телевизору свастику у стен парламента.')); }
  { const f=S.fac.so; add('terekh','«СОЮЗ ОФИЦЕРОВ»',f.n>0?'В здании до конца':'В здании не было',neu?(f.n>0?'Офицеры Терехова отвечали за оборону здания до последнего дня. Арестовать Терехова Кремль не решился, вернуть в армию отказался. «Союз офицеров» остался тем, чем был: политическим кружком людей в погонах.':'«Союз офицеров» в обороне не участвовал. Терехов требовал то суда над министром обороны, то его отставки и не добился ни того, ни другого.'):f.n>0?(win?'Офицеры Терехова вернулись в армию с восстановленными званиями. Самого Терехова в Генштаб не взяли: победившему Съезду нужна была армия, а не её политический кружок.':'Терехова арестовали и били на допросах. В феврале 1994 года он вышел по амнистии и снова собрал «Союз офицеров», уже без оружия.')
      :(win?'«Союз офицеров» в обороне не участвовал. После победы Терехов требовал чистки Министерства обороны, и его вежливо не услышали.':'Терехов действовал сам и был арестован ещё до развязки. Амнистия в феврале 1994 года вернула ему свободу, но не звание.')); }
  for(const pid of ['mo','gs','mvd','mer','smo','ost']){ const P=POINTS.find(x=>x.id===pid), v=S.pts[pid], our=v>=(win||neu?50:60), W=PEOPLE[POINT_WHO[pid]];
    add(POINT_WHO[pid],W.nm.split(' ').pop().toUpperCase(),P.nm.replace(/ ↑.*/,'')+' · к концу '+(v>=65?'за Совет':v<=35?'за Кремль':'колебались')+' ('+v+'%)',neu?EPI_PT_N[pid][our?0:1]:win?EPI_PT[pid][our?0:1]:(noA&&EPI_NOA[pid+(our?2:3)])||EPI_PT[pid][our?2:3]); }
  // части Кремля: кто дошёл до конца, кто встал, кто не пошёл вовсе
  { const A=S.A, kWon=endTier(id)==='lose';
    if(!A||!A.units||false){ add('grachev','ЧАСТИ КРЕМЛЯ','Штурма не было',id==='elect_deal'?'Части, стянутые к Москве, простояли неделю на кольцевой и вернулись в гарнизоны. Солдатам объявили, что это были учения.':'До стрельбы не дошло. Колонны постояли на набережной и ушли: брать было уже некого.'); }
    else{ const T={
      tanks:{who:'grachev',nm:'ТАНКИ НА МОСТУ',sub:'Кантемировская дивизия',
        refuse:'Экипажи Кантемировской дивизии на мост не выехали. Командир полка попросил письменный приказ министра и ждал его до вечера. Офицеров, отказавшихся стрелять, позже тихо уволили, но судить не решились.',
        out:'Танки вышли на мост, но огонь прекратили раньше, чем кончился штурм. Экипажи заглушили моторы и сидели на броне под камерами. Фотография молчащих танков у Белого дома обошла все газеты мира.',
        won:'Танки отстрелялись по верхним этажам до конца. Экипажам, по слухам, заплатили наличными и дали квартиры. Имена офицеров, сидевших в машинах, министерство не раскрывало много лет.',
        lost:'Танки били по зданию до темноты, но здание устояло. Офицеров, стрелявших по парламенту, новая власть судить не стала, им просто перестали подавать руку. Многие уволились в тот же год.'},
      taman:{who:POINT_WHO.gs,nm:'МОТОСТРЕЛКИ',sub:'Таманская дивизия',
        refuse:'Таманская дивизия к зданию не пошла. Генштаб доложил в Кремль о нехватке горючего. Все понимали, что горючее было.',
        out:'Мотострелки начали штурм и не закончили его. Роты залегли у стилобата, и никакие приказы поднять их уже не могли. К вечеру дивизию отвели, сославшись на потери.',
        won:'Таманцы вошли в здание через парадный вход. Срочников, бравших этажи, через месяц вернули в казармы и велели не рассказывать, где они были.',
        lost:'Мотострелки шли на парадный вход весь день и не взяли его. Дивизию вывели из Москвы ночью, без строя и без музыки. Её командира сняли первым.'},
      vv:{who:POINT_WHO.mvd,nm:'ВНУТРЕННИЕ ВОЙСКА',sub:'Дивизия имени Дзержинского',
        refuse:'Дивизия Дзержинского на штурм не вышла. Часть офицеров ещё до рассвета заявила, что по своим стрелять не будет. Министру доложили об этом как о «технической неготовности».',
        out:'Внутренние войска дрались у двадцатого подъезда и ушли оттуда раньше конца. Командиры увели людей сами, не дожидаясь приказа сверху.',
        won:'Дивизия Дзержинского взяла двадцатый подъезд. Её бойцам дали больше всего наград за эту осень. Носить их в Москве они потом стеснялись.',
        lost:'Дивизия Дзержинского билась о двадцатый подъезд весь день. После перемирия её вывели из города, а счёт её потерь министерство засекретило.'},
      omon:{who:POINT_WHO.mvd,nm:'ОМОН',sub:'ГУВД Москвы',
        refuse:'ОМОН на здание не пошёл. Бойцы сняли шлемы и стояли вдоль набережной спиной к Белому дому. Женщины и ветераны, которые ходили к ним две недели, это запомнили.',
        out:'ОМОН начал вместе со всеми и встал посреди дня. Милиционеры сказали, что разгонять митинги они умеют, а брать парламент не нанимались.',
        won:'ОМОН шёл за армией и зачищал этажи и дворы вокруг. Про то, что делали с задержанными на стадионе «Красная Пресня», потом писали годами.',
        lost:'ОМОН дошёл до дверей и откатился. Через неделю тех же бойцов поставили охранять тот же парламент, уже от его имени.'},
      alpha:{who:'yeltsin',nm:'«АЛЬФА» И «ВЫМПЕЛ»',sub:'Спецподразделения'} };
      for(const u of A.units){ const t=T[u.id]; if(!t)continue; const lost=Math.round(u.lost||0), m=uMorV(u);
        if(u.id==='alpha'){ const al=A.alpha, neg=/alpha/.test(id);
          add(t.who,t.nm,t.sub+' · '+(neg?'вывели людей под свои гарантии':al==='refuse'?'отказались штурмовать':al==='attack'?'пошли на штурм, потери '+fmt(lost):'остались в резерве'),
            neg?(id==='draw_alpha'?'Офицеры «Альфы» вошли в здание без выстрела и вывели людей под своё слово. Перед камерами они сказали, что штурмовать парламент не будут. Этого Кремль им не простил: «Вымпел» расформировали, «Альфу» передали другому ведомству.':'«Альфа» вывела людей из здания под свои гарантии. Гарантии кончились у автобусов. Офицеры потом говорили, что сделали что могли, и что без них убитых было бы вдесятеро больше.')
            :al==='refuse'?'«Альфа» выслушала обращение по рации и осталась на месте. Офицеры ответили Кремлю, что по безоружным депутатам они не работают. Отказ спецназа стал концом штурма для всех, кто ещё сомневался.'
            :al==='attack'?(kWon?'«Альфа» и «Вымпел» вошли в двадцатый подъезд последними и сделали то, чего не смогли остальные. Об этом дне их офицеры не любят вспоминать.':'«Альфа» пошла на штурм и не взяла подъезд. Для подразделения, которое не знало неудач, это стало переломом: половина офицеров подала рапорты.')
            :'«Альфу» и «Вымпел» держали в резерве до самого конца и в бой так и не бросили. Их офицеры потом говорили, что это был лучший приказ за всю осень.'); continue; }
        const st=u.st==='refuse'&&lost===0?'refuse':(u.cur<=3||m<MOR_HALT)?'out':kWon?'won':'lost';
        const ls=u.id==='tanks'?'':', потери '+fmt(lost), sub=t.sub+' · '+(st==='refuse'?'отказались, в бою не были':st==='out'?(u.halt||u.cur>3?(u.id==='tanks'?'прекратили огонь':'встали и дальше не пошли'):'выведены из боя')+ls:(u.id==='tanks'?'стреляли до конца':'дрались до конца')+ls);
        add(t.who,t.nm,sub,t[st]); } } }
  { const mine=OUTLETS.filter(o=>outSt(S,o)==='vs').length, kr=OUTLETS.filter(o=>outSt(S,o)==='kr').length;
    add(null,'ПРЕССА',`За вас ${mine}, за Кремль ${kr}`,win?(mine>=kr?'Редакции, вставшие на сторону Съезда, написали историю этой осени первыми. Остальные две недели объясняли читателям, что имели в виду на самом деле.':'Большинство редакций было против вас до последнего дня. Победивший Съезд спорил, закрывать ли их. '+(S.rad>=60?'Закрыли три, и это стало первым скандалом новой власти.':'Не закрыл ни одной, и это запомнили.'))
      :(mine>=4?'«Правду», «Советскую Россию», «День» и ещё десяток изданий закрыли указом на следующий день. Часть вернулась под другими названиями. Газеты, поддержавшие Кремль, вышли с белыми пятнами цензуры и возмутились.':'Оппозиционные газеты закрыли указом. Остальные вышли с белыми пятнами цензуры, которую через несколько дней отменили.')); }
  { const A=S.A, lost=A?Math.round(A.lost||0):0;
    add(K==='fell'||K==='held'?'whf':'wh','МОСКВА','Город после развязки',win?(lost>300?`Победа стоила ${fmt(lost)} убитых и раненых защитников. У стены стадиона «Красная Пресня» поставили памятник, и к нему ходят те, кто был по разные стороны проволоки.`:'Баррикады разобрали за неделю. Спираль Бруно увезли на склад, с которого её привезли. Москвичи ещё долго спорили на кухнях, чья это была победа.')
      :(K==='draw'&&S.endId==='held_iso'?'Баррикады у Белого дома простояли до зимы. Город привык объезжать набережную. Тех, кто удержал здание, москвичи не благодарили и не проклинали: их просто боялись.':K==='draw'?'Белый дом стоял пустой и закопчённый до весны: ни одна власть не решалась в него въехать. Москва жила с двумя правительствами и ни одним, цены росли, а на кухнях спорили не о том, кто победил, а о том, кто виноват.':K==='fell'?'Чёрные пятна на белом фасаде закрасили к зиме. Погибших считали долго и по-разному: официально около полутора сотен. Комендантский час отменили через две недели.':K==='surr'?'Здание отдали без большого боя, и это спасло не одну сотню жизней. Фасад остался белым. Белый дом обнесли оградой, которая стоит до сих пор.':'Белый дом опустел без выстрела. Через месяц в нём уже сидело правительство, и ограду вокруг поставили такую, чтобы баррикады больше было не из чего строить.')); }
  add('wh','КАК БЫЛО НА САМОМ ДЕЛЕ','21 сентября — 4 октября 1993 года','Указ №1400 вышел 21 сентября. Белый дом отключили от света и связи и окружили проволокой. 3 октября сторонники Верховного Совета прорвали оцепление, взяли мэрию и пошли на Останкино. Утром 4 октября танки с Новоарбатского моста расстреляли парламент, к вечеру защитники сдались. Погибли, по официальным данным, около 150 человек. В декабре приняли новую Конституцию.');
  return L;
}
function showEpi(i){ const L=epilogue(); i=Math.max(0,Math.min(i||0,L.length-1)); const s=L[i], last=i===L.length-1;
  showEvent({id:'epi',pic:s.pic||'wh',tag:'ЭПИЛОГ',h:s.h,q:s.q,p:s.p,time:'',ch:[
    last?{t:'К итогам',go:()=>ending(S.endId)}:{t:'Дальше',go:()=>showEpi(i+1)},
    ...(i>0?[{t:'Назад',go:()=>showEpi(i-1)}]:[]),
    ...(!last?[{t:'Пропустить',go:()=>ending(S.endId)}]:[])]});
  $('ev-meta').textContent='ЧТО СТАЛО С КАЖДЫМ · '+(i+1)+' ИЗ '+L.length; $('ev-hud').innerHTML='';
}
// what became of every faction: [ушли до конца, победа, поражение]
const FATES={
  kr:['Ушли до развязки. Рыбкин договорился с правительством раньше остальных.','Вошли в правительство национального согласия и получили три министерства.','Компартию допустили к декабрьским выборам. Рыбкин стал председателем новой Думы.'],
  ros:['Разъехались по регионам собирать советы. Собрать не успели.','Бабурин возглавил комиссию по новой Конституции.','Бабурина избили при выходе из здания. В декабре его снова выбрали депутатом.'],
  agr:['Вернулись в свои области до конца событий.','Провели через Съезд закон о земле в своей редакции.','Аграрная партия прошла в Думу и торговалась за бюджет села.'],
  otc:['Депутаты в погонах ушли и унесли с собой связи в округах.','Получили кресла в Министерстве обороны.','Уволены в запас без пенсии. Через год часть вернулась в политику.'],
  sm:['Вышли к камерам раньше всех и предложили выборы без Ельцина и Хасбулатова.','Стали лицом компромисса: молодые депутаты повели переговоры о выборах.','Фракция распалась. Её депутаты разошлись по новым партиям.'],
  kol:['Ушли по одному. Указ обещал каждому должность и годовой оклад.','Остались и потом рассказывали, что не сомневались ни минуты.','Получили от Кремля обещанные должности и компенсации.'],
  rne:['Покинули здание до конца.','Потребовали свою долю победы. С ними пришлось разбираться отдельно.','Ушли через коллекторы с оружием. Баркашова арестовали зимой, по амнистии он вышел.'],
  so:['Ушли действовать сами.','Офицеры вернулись в армию с восстановленными званиями.','Терехов арестован. В феврале 1994-го освобождён по амнистии.'],
};
function openFinal(){
  const id=S.endId||'', win=!!(ENDINGS[id]&&ENDINGS[id].win)||id==='held', neu=endTier(id)==='neu', A=S.A, st=S.st||{};
  const row=(a,b,c)=>`<div class="fr"><span>${a}</span><b class="${c||''}">${b}</b></div>`;
  const facs=FACTIONS.map(F=>{const f=S.fac[F.id],gone=f.n<=0,L=LOY[loyLvl(f.loy)];
    return `<div class="ff"><span class="sw" style="background:${F.c}"></span><div><b>${F.nm.replace(/"/g,'')}</b> <i style="color:${gone?'var(--dim)':L.c}">${gone?'нет в здании':L.nm+' · '+f.n}</i><div>${FATES[F.id][gone?0:win?1:2]}</div></div></div>`;}).join('');
  const forces=[['mo','Минобороны'],['gs','Генштаб'],['mvd','МВД'],['mer','Мэрия'],['ost','Останкино']].map(([k,n])=>{const v=S.pts[k];return row(n,v>=70?'за Совет':v>=45?'колебались':'за Кремль',v>=70?'p':v>=45?'':'n');}).join('');
  const mine=OUTLETS.filter(o=>outSt(S,o)==='vs').map(o=>o.nm).join(', ')||'никого';
  $('modal-win').innerHTML=`<h2>ИТОГИ · ${dateStr(S.day).toUpperCase()} 1993</h2><div class="sub">${win?'Победа: Верховный Совет устоял.':neu?'Нейтральный исход: здание потеряно, но Ельцин политически надломлен.':'Поражение: Ельцин победил.'} ${A?'Штурм длился '+A.r+' ч. из 12.':'До штурма дело не дошло.'}</div>
   <div class="fin"><div><h3>ЦИФРЫ</h3>
    ${row('Дней от начала',S.day)}${row('Решений принято',S.chron.length)}${row('Легитимность',S.leg)}${row('Москва за Совет',S.city+'%')}
    ${row('Депутатов осталось',deputies(S)+' из 265',deputies(S)<QUORUM?'n':'')}${row('Депутатов ушло',st.depOut||0)}${row('Депутатов вернулось',st.depIn||0)}
    ${row('Людей у стен',fmt(S.ppl))}${row('Бойцов',fmt(S.mil))}${A?row('Убитых и раненых',fmt(Math.round(A.lost||0)),'n'):''}
    ${A?row('Потери штурмующих',fmt(A.units.reduce((a,u)=>a+(u.lost||0),0)),'p'):''}${row('Ходов Кремля против вас',st.km||0)}${row('Приказов не исполнено',st.fail||0)}
    <h3>СИЛЫ</h3>${forces}
    <h3>ПРЕССА ЗА ВАС</h3><div class="fo">${mine}</div>
    ${A&&A.muster?'<h3>КТО ПРИШЁЛ В ПОСЛЕДНЮЮ НОЧЬ</h3>'+A.muster.map(m=>`<div class="fo ${m.g?'p':'n'}">${m.t}</div>`).join(''):''}
   </div><div><h3>СУДЬБЫ</h3>${facs}
    <div class="ff"><span class="sw" style="background:#b3322b"></span><div><b>Хасбулатов и Руцкой</b><div>${win?'Остались у власти до досрочных выборов. Что было бы дальше, история не знает.':'Лефортово. 26 февраля 1994 года вышли по амнистии Государственной думы.'}</div></div></div>
    <h3>КАК БЫЛО НА САМОМ ДЕЛЕ</h3><div class="fo">Указ №1400 вышел 21 сентября. 4 октября танки с Новоарбатского моста расстреляли Белый дом, к вечеру защитники сдались. Погибли, по официальным данным, около 150 человек. В декабре приняли новую Конституцию.</div>
   </div></div><div class="sub" style="text-align:center;margin-top:6px">Игра «1993» · ${authorHTML()}</div><div class="close">ESC — закрыть</div>`;
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
[$('snd2').parentNode].forEach(b=>{const d=document.createElement('div');d.className='menub px';d.textContent='МЕНЮ';d.title='В главное меню. Партия сохранится';if(b.contains($('snd2')))d.style.cssText='right:132px;top:10px;font-size:8px;padding:6px 8px;z-index:3';d.onclick=e=>{e.stopPropagation();toMenu();};b.appendChild(d);});
// ---------- полный экран: кнопка видна только там, где браузер его даёт (на iPhone его нет — там игра ставится на экран «Домой») ----------
const FS={ el:()=>document.documentElement, can(){const e=this.el();return !!((document.fullscreenEnabled||document.webkitFullscreenEnabled)&&(e.requestFullscreen||e.webkitRequestFullscreen));},
  on:()=>!!(document.fullscreenElement||document.webkitFullscreenElement),
  sync(){const b=$('fsb'); if(!b)return; b.style.display=this.can()?'block':'none'; b.textContent=this.on()?'⤢ ВЫЙТИ ИЗ ПОЛНОГО ЭКРАНА':'⤢ ВО ВЕСЬ ЭКРАН'; setTimeout(fit,60); setTimeout(fit,400);},
  toggle(){ try{ if(this.on()){(document.exitFullscreen||document.webkitExitFullscreen).call(document);return;}
      const e=this.el(), r=(e.requestFullscreen||e.webkitRequestFullscreen).call(e); const lock=()=>{try{const o=window.screen.orientation; if(o&&o.lock)o.lock('landscape').catch(()=>{});}catch(x){}}; if(r&&r.then)r.then(lock).catch(()=>{}); else lock(); }catch(x){} } };
document.addEventListener('fullscreenchange',()=>FS.sync());document.addEventListener('webkitfullscreenchange',()=>FS.sync());
{const b=$('fsb'); if(b)b.onclick=e=>{e.stopPropagation();FS.toggle();}; FS.sync();}
// ---------- шрифт: пиксельный по умолчанию, обычные подменяют те же два семейства (ширина подогнана, вёрстка не едет) ----------
const Font={ list:[['pix','ПИКСЕЛЬНЫЙ'],['sans','ОБЫЧНЫЙ'],['serif','С ЗАСЕЧКАМИ']],
  // fontv:2 — с версии 0.55 пиксельный шрифт по умолчанию; старый выбор («ОБЫЧНЫЙ» и т. д.) сбрасывается один раз
  cur(){const o=store.get(OPTS)||{}; if(o.fontv!==2) return 'pix'; return this.list.some(x=>x[0]===o.font)?o.font:'pix';},
  apply(){const k=this.cur(); let st=$('font-css'); if(!st){st=document.createElement('style');st.id='font-css';document.head.appendChild(st);} st.textContent=(typeof FONT_FACES!=='undefined'&&FONT_FACES[k])||''; document.documentElement.dataset.font=k;
    const b=$('fntb'); if(b)b.textContent='ШРИФТ: '+this.list.find(x=>x[0]===k)[1]; const n=$('fntn'); if(n)n.style.display=k==='pix'?'none':'block'; },
  next(){const o=store.get(OPTS)||{}, i=this.list.findIndex(x=>x[0]===this.cur()); o.fontv=2; o.font=this.list[(i+1)%this.list.length][0]; store.set(OPTS,o); this.apply();} };
{const b=$('fntb'); if(b)b.onclick=e=>{e.stopPropagation();Font.next();}; Font.apply();}
// ---------- язык: переведённые копии скриптов (js/*.en.js и т. д.), выбор в настройках, смена = перезагрузка страницы ----------
const Lang={ list:[['','Русский'],['en','English'],['zh','中文'],['ko','한국어']], cur:()=>GL,
  note:{en:'Translations into English, Chinese and Korean have not been checked by anyone. We cannot guarantee their quality. The original game is in Russian, and the translation may be inaccurate.',zh:'英文、中文和韩文翻译未经任何人校对，无法保证翻译质量。游戏原文为俄语，译文可能不准确。',ko:'영어, 중국어, 한국어 번역은 아무도 검수하지 않았습니다. 번역 품질을 보장할 수 없습니다. 게임 원문은 러시아어이며, 번역이 부정확할 수 있습니다.'},
  sync(){const b=$('lngb'),p=$('lngp'); if(!b)return; if((typeof SINGLE!=='undefined'&&SINGLE)||!LANGS_ON){b.style.display='none';return;} b.textContent='⚑ '+this.list.find(x=>x[0]===GL)[1].toUpperCase()+' ▾';
    const N=this.note; p.innerHTML='<span class="lx" style="position:absolute;right:6px;top:2px;cursor:pointer;padding:0 4px">✕</span>'+this.list.map(x=>`<div class="l${x[0]===GL?' on':''}" data-l="${x[0]}">${x[1]}</div>`).join('')+`<div class="n">Английский, китайский и корейский переводы никем не проверялись, качество не гарантируем. Оригинал игры на русском, перевод может быть некорректным.</div>`;
    p.querySelector('.lx').onclick=e=>{e.stopPropagation();p.style.display='none';}; p.querySelectorAll('.l').forEach(d=>d.onclick=e=>{e.stopPropagation();this.set(d.dataset.l);}); },
  set(l){ if(l===GL){$('lngp').style.display='none';return;} const o=store.get(OPTS)||{}; if(l)o.lang=l; else delete o.lang; store.set(OPTS,o); if(l&&window.Stat)Stat.ev('lang-'+l); location.href=location.pathname; } };
{const b=$('lngb'); if(b){b.onclick=e=>{e.stopPropagation();const p=$('lngp');p.style.display=p.style.display==='none'?'block':'none';}; Lang.sync();document.addEventListener('click',e=>{const p=$('lngp');if(p&&p.style.display!=='none'&&!p.contains(e.target)&&e.target!==b)p.style.display='none';});document.addEventListener('keydown',e=>{if(e.key==='Escape'){const p=$('lngp');if(p)p.style.display='none';}});}
 if(window.HTML_TR){const T=window.HTML_TR; const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT); let n; while(n=w.nextNode()){const k=n.nodeValue.trim(); if(k&&T[k]!==undefined&&!n.parentNode.closest('#lngp'))n.nodeValue=n.nodeValue.replace(k,T[k]);}
   document.querySelectorAll('[title]').forEach(e=>{if(T[e.title]!==undefined)e.title=T[e.title];});
   const st=document.createElement('style'); st.textContent='.law.done .t::after{content:"'+(T['  ✔ принято']||'  ✔')+'"}'+(typeof CJK_CSS!=='undefined'?CJK_CSS:''); document.head.appendChild(st);} }

drawMap(); applyOpts(); renderMenu(); show('title');

(function(){const v=document.getElementById('ver');if(v)v.textContent='версия '+VERSION;})();

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
  const R=[['leg','Легитимность',20],['hope','Решимость',20],['rad','Радикализм',20],['city','Москва',20],['med','Эфир',20],['ppl','Люди',1000],['mil','Ополчение',200],['gun','Оружие',200],['sup','Снабжение',3],['omon','Готовность ОМОНа',30]];
  const b=(k,t,c)=>`<div class="law ck${c?' '+c:''}" data-k="${k}"><div class="t">${t}</div></div>`;
  win.innerHTML=`<h2>ЧИТЫ · ДЛЯ ТЕСТОВ</h2>${resStrip('')}
   <div class="sub">Клавиша 0 открывает и закрывает эту панель. На телефоне: пять быстрых нажатий на номер версии на титуле включают кнопку «ЧИТ».</div>
   <div class="ph">ПЕРЕЙТИ</div><div class="ckg">${b('go:decree','Указ №1400 сейчас')+b('go:ost','Событие «Останкино»')+b('go:assault','Сразу к штурму')+b('go:alpha','К «Альфе» у подъезда')+b('go:epi','Слайды «что стало с каждым»')+b('x:night','Закончить ход')}</div>
   <div class="ph">ПОКАЗАТЕЛИ</div><div class="ckg">${R.map(([k,n,v])=>b('r:'+k+':'+v,n+' +'+v)+b('r:'+k+':-'+v,n+' −'+v)).join('')}</div>
   <div class="ph">РАСКЛАД</div><div class="ckg">${b('x:all','Всё по максимуму')+b('x:orders','Приказы +5, постановления +3')+b('x:ptsup','Все силы +20')+b('x:ptsdn','Все силы −20')+b('x:loyup','Все фракции лояльнее')+b('x:loydn','Все фракции злее')+b('x:rne',S.fac.rne.n>0?'Убрать РНЕ':'РНЕ в здание')+b('x:ring',S.cordon?'Снять кольцо':'Поставить кольцо')+b('x:power',S.flags.noPower?'Включить свет':'Отключить свет')+b('x:dep','Депутатов −60')+b('x:seen','Сбросить справки')}</div>
   <div class="ph">ПОКАЗАТЬ КОНЦОВКУ</div><div class="ckg">${Object.keys(ENDINGS).map(id=>b('end:'+id,ENDINGS[id].h+' · '+({win:'победа',neu:'ничья',lose:'поражение'})[endTier(id)])).join('')}</div>
   <div class="close xtop">✕ ЗАКРЫТЬ</div>`;
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
