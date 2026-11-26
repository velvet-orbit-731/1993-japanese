// Title screen art: copied from the approved mockup 1993-mockups/title.html (burning White House, 56-frame fire loop).
// Wrapped so the game can start/stop the animation and reuse two still pictures (calm / burning) on event screens.
const TitleArt=(function(){
let running=false, timer=0, ready=false; const readyCbs=[];
const calm=document.createElement('canvas');calm.width=640;calm.height=360;
const burning=document.createElement('canvas');burning.width=640;burning.height=360;

// ---------- pixel helpers: 640x360 canvas shown at 2x ----------
const cv=document.getElementById('title-c'), g=cv.getContext('2d');
const W=640,H=360, CX=436;
// White House geometry (canvas px)
let seed=1993; function rnd(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646;}
const B4=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
function px(x,y,c){g.fillStyle=c;g.fillRect(x|0,y|0,1,1);}
function rect(x,y,w,h,c){g.fillStyle=c;g.fillRect(x|0,y|0,w|0,h|0);}
function dith(x,y,t){return t*16>B4[y&3][x&3]+0.5;}
function hband(y0,y1,c0,c1){for(let y=y0;y<y1;y++){const t=(y-y0)/(y1-y0);for(let x=0;x<W;x++)px(x,y,dith(x,y,t)?c1:c0);}}
const N=(x,y)=>{const v=Math.sin(x*12.9898+y*78.233)*43758.5453;return v-Math.floor(v);};
const noise=(x,y,sx,sy)=>{const X=x/sx,Y=y/sy,ix=Math.floor(X),iy=Math.floor(Y),fx=X-ix,fy=Y-iy;
  const a=N(ix,iy),b=N(ix+1,iy),c=N(ix,iy+1),d=N(ix+1,iy+1);return (a*(1-fx)+b*fx)*(1-fy)+(c*(1-fx)+d*fx)*fy;};

const base=document.createElement('canvas');base.width=W;base.height=H;
function drawStatic(){
  // sky: cold night above, fire glow near the horizon
  hband(0,80,'#08090c','#0f1014');
  hband(80,160,'#0f1014','#1a1517');
  hband(160,224,'#1a1517','#2e1a14');
  hband(224,256,'#2e1a14','#3d2116');
  // low clouds lit from below
  for(let y=20;y<150;y++)for(let x=0;x<W;x++){const n=noise(x,y,46,10);if(n>.62)px(x,y,dith(x,y,(n-.62)*3)?'#1f1a1a':'#141316');}

  // far city
  seed=7;
  for(let x=0;x<W;){const w=12+(rnd()*30|0),h=12+(rnd()*36|0);rect(x,250-h,w,h+8,rnd()<.5?'#121215':'#141417');
    rect(x,250-h,w,1,'#1b1b1f');
    for(let i=0;i<w*h/60;i++){if(rnd()<.35)px(x+2+rnd()*(w-4),250-h+3+rnd()*(h-4),rnd()<.5?'#5b4a2c':'#3a3226');} x+=w;}
  // stepped high-rise silhouette on the far bank
  const sp=[[44,184,60,72],[56,160,36,26],[64,140,20,22],[70,116,8,26],[72,92,4,26]];
  for(const [x,y,w,h] of sp){rect(x,y,w,h,'#0f0f12');rect(x,y,w,1,'#19191d');}
  for(let y=190;y<248;y+=5)for(let x=48;x<100;x+=4)if(rnd()<.14)px(x,y,'#4a3d26');

  // river + embankment
  hband(280,360,'#0c0d10','#07080a');
  for(let y=282;y<360;y+=3)for(let x=0;x<W;x++)if(noise(x,y,30,1)>.72)px(x,y,'#12141a');
  rect(0,266,W,14,'#26241f');
  for(let r=0;r<3;r++)for(let x=(r%2)*8;x<W;x+=16)rect(x,268+r*4,1,4,'#1a1916');
  for(let y=270;y<280;y+=4)rect(0,y,W,1,'#201e1a');
  rect(0,266,W,1,'#3a362d');
  // parapet posts
  for(let x=4;x<W;x+=24)rect(x,260,2,6,'#2a2823');rect(0,260,W,1,'#2a2823');

}

// ---------- White House: hand-built pixel painting (separate layer), geometry follows the reference view ----------
const WH=new Image(); WH.src=ASSET_WH;
// roof line of the tower in canvas px (slanted: the right end is nearer to the viewer)
const TWL=325,TWR=537; const roofY=x=>102.4+(78.4-102.4)*((x-TWL)/(TWR-TWL)); const towerH=x=>92+(x-TWL)/(TWR-TWL)*16;
let mask=null, winComp=[];   // building alpha mask; window components that can burn
function buildLayer(){
  g.drawImage(WH,0,0);
  const id=g.getImageData(0,0,W,H), d=id.data; mask=new Uint8Array(W*H);
  const isWin=new Uint8Array(W*H);
  const tmp=document.createElement('canvas');tmp.width=W;tmp.height=H;const tc=tmp.getContext('2d');tc.drawImage(WH,0,0);const wd=tc.getImageData(0,0,W,H).data;
  for(let i=0;i<W*H;i++){mask[i]=wd[i*4+3]>0?1:0; const r=wd[i*4],b=wd[i*4+2]; if(mask[i]&&r<70&&b>=r&&b<80)isWin[i]=1;}
  // windows of the tower -> connected components
  const seen=new Uint8Array(W*H);
  for(let y=70;y<200;y++)for(let x=TWL;x<TWR;x++){const i=y*W+x;if(!isWin[i]||seen[i])continue; const depth=(y-roofY(x))/towerH(x); if(depth<.17||depth>.75){seen[i]=1;continue;}
    const st=[i],pix=[];seen[i]=1;while(st.length){const j=st.pop();pix.push(j);for(const k of [j-1,j+1,j-W,j+W])if(isWin[k]&&!seen[k]){seen[k]=1;st.push(k);}}
    let x0=1e9,x1=0,y0=1e9;for(const j of pix){const X=j%W,Y=(j/W)|0;if(X<x0)x0=X;if(X>x1)x1=X;if(Y<y0)y0=Y;}
    winComp.push({pix,depth,ph:N(x,y),x0,y0,w:x1-x0+1});}
  // soot: upper floors burned black, fading downwards with a ragged edge
  for(let y=60;y<200;y++)for(let x=TWL;x<TWR;x++){const i=y*W+x;if(!mask[i])continue; const depth=(y-roofY(x))/towerH(x); if(depth<-.02||depth>.8)continue;
    const t=1-depth/.72, v=t*1.3-noise(x,y,18,12)*.45-noise(x,y,6,5)*.15-(depth<.17?.25:0); if(v<.22)continue;
    const dark=d[i*4]<80; px(x,y, v>.6?(dark?'#0b0a09':'#1f1b18'): v>.38?(dark?'#141210':'#3b3631'):(dark?'#1d1c1a':'#6f6a60'));}
  // soot tongues rising above some window columns
  seed=33;
  for(let n=0;n<7;n++){const x0=TWL+14+(rnd()*(TWR-TWL-28)|0),y0=Math.round(roofY(x0)+towerH(x0)*(.55+rnd()*.25)),h=12+rnd()*14;
    for(let k=0;k<h;k++){const w=2+k*.4,a=1-k/h;for(let dx=-w;dx<=w;dx++){const X=(x0+dx)|0,Y=y0-k;const e=1-Math.abs(dx)/w;
      if(mask[Y*W+X]&&e*1.2*a+noise(X,Y,3,3)*.3>.55)px(X,Y,dith(X,Y,.6)?'#3a3530':'#4d4842');}}}
}

// ---------- animated layers ----------
let tick=0;
const P=56, TAU=Math.PI*2;                         // the whole animation loops every P frames
const wv=(k,ph=0)=>Math.sin(tick*TAU*k/P+ph);
// value noise that wraps vertically every M cells, so upward scrolling loops seamlessly
const nz=(x,y,sx,sy,M)=>{const X=x/sx,Y=y/sy,ix=Math.floor(X),iy=Math.floor(Y),fx=X-ix,fy=Y-iy;const m=v=>((v%M)+M)%M;
  const a=N(ix,m(iy)),b=N(ix+1,m(iy)),c=N(ix,m(iy+1)),d=N(ix+1,m(iy+1));const ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy);return (a*(1-ux)+b*ux)*(1-uy)+(c*(1-ux)+d*ux)*uy;};
const embers=[];for(let i=0;i<70;i++)embers.push({x:TWL+N(i,1)*(TWR-TWL),off:N(i,2)*P,drift:(N(i,3)-.7)*50,rise:50+N(i,4)*90,hot:N(i,5)});

function flag(t){
  const cols=[['#e9e6dc','#c9c6bc'],['#2f8fd6','#2470ad'],['#b3322b','#8a2520']]; // 1991–1993: white / azure / red
  for(let i=0;i<24;i++){const x=421-i;const ph=Math.sin(t*TAU*2/P - i*.3);const off=Math.round(ph*1.6*(i/24+.1));const sh=ph>.4?1:0;
    for(let s=0;s<3;s++)for(let k=0;k<4;k++)px(x,29+s*4+k+off,cols[s][sh]);}
}

function frame(){
  tick++;
  g.drawImage(base,0,0);
  const pulse=.85+.15*wv(3)+.08*wv(7,1);
  // fire glow in the sky around the top of the tower (breathes with the fire)
  for(let y=20;y<170;y++)for(let x=CX-150;x<CX+150;x++){if(mask[y*W+x])continue;const d=Math.hypot((x-430)/1.6,y-100);if(d<100&&dith(x,y,(1-d/100)*.42*pulse))px(x,y,'#3f1d12');}
  // smoke: a billowing plume from the whole roof, leaning left with the wind
  for(let y=0;y<140;y++)for(let x=120;x<600;x++){ if(mask[y*W+x])continue;
    const xr=x<TWL?TWL:x>TWR-1?TWR-1:x, h=roofY(xr)-y; if(h<-3)continue;
    const c=431-h*.75-h*h*.004, hw=104+h*.4, e=1-Math.abs(x-c)/hw; if(e<=0)continue;
    const big=nz(x+h*.7,y+tick*2,26,14,8), fine=nz(x+h*.5,y+tick*4,9,7,32);
    const dens=Math.pow(e,.55)*(.58*big+.42*fine)*(h<6?.6+h*.07:1);
    if(dens<.27)continue; if(dens<.33&&!dith(x,y,(dens-.27)/.06))continue;
    let col= dens>.46?'#131212': dens>.38?'#1d1b1a':'#282422';
    if(fine>.68&&dens>.36)col='#34302c';
    if(h<34){const lit=(1-h/34)*pulse; if(big>.5&&dith(x,y,lit*.9))col=h<12?'#8a4318':'#5a2c18';}
    px(x,y,col);}
  flag(tick);
  // burning windows: openings glow and flicker, tongues of flame lick upward
  for(const wc of winComp){ if(wc.ph>.62-wc.depth*.55)continue; const f=Math.sin(tick*TAU*3/P+wc.ph*20)+Math.sin(tick*TAU/P+wc.ph*7);
    g.fillStyle=f>1.1?'#ffe08a':f>0?'#f2a33a':f>-1?'#d9592a':'#7a2a15'; for(const j of wc.pix)g.fillRect(j%W,(j/W)|0,1,1);
    const hh=Math.round((nz(wc.x0*3.1,tick*3+wc.ph*90,5,8,21))*9*(wc.ph<.3?1.3:.8));
    for(let k=1;k<=hh;k++){const t=k/hh, sway=Math.round(Math.sin(tick*TAU*4/P+k*.8+wc.ph*9)*t*1.2), w=Math.max(1,Math.round(wc.w*(1-t)));
      g.fillStyle=t<.3?'#ffe08a':t<.65?'#f2a33a':'#c9461f'; g.fillRect(wc.x0+((wc.w-w)>>1)+sway,wc.y0-k,w,1);}}
  // flames along the roof line: height driven by scrolling noise, strongest in a few seats of fire
  for(let x=TWL+2;x<TWR-2;x++){ if(x>407&&x<439)continue; const seat=nz(x,0,22,1,64); if(seat<.38)continue;
    const hgt=Math.round(Math.pow(nz(x,tick*3+x*.37,5,8,21),1.4)*26*(seat-.3)*1.6*pulse); const y0=Math.round(roofY(x));
    for(let k=0;k<hgt;k++){const t=k/hgt; px(x+Math.round(Math.sin(tick*TAU*4/P+k*.5+x)*t),y0-k, t<.25?'#fff0b0':t<.5?'#ffd060':t<.78?'#f2913a':'#c9461f');}}
  // warm light on the crown under the flames
  for(let x=TWL;x<TWR;x++){const y0=Math.round(roofY(x));for(let k=1;k<5;k++)if(mask[(y0+k)*W+x]&&dith(x,y0+k,.3*pulse))px(x,y0+k,'#a2441c');}

  // fire reflection in the river
  for(let y=284;y<352;y+=2){const k=(y-284)/68;const w=((60-k*30)+wv(2,y)*6)*pulse;const x0=CX-w/2+wv(1,y*.45)*5;
    for(let x=x0;x<x0+w;x+=1+(((x*7+y+tick)>>1)%4)) px(x,y, k<.3&&((x|0)+tick)%5==0?'#f2a33a':k<.6?'#a2441c':'#5a2412');}
  g.drawImage(fg,0,0);
  { // bonfires on the barricade line: flicker, glow on the people nearby
    for(const [bx,ph] of [[246,0],[430,2],[588,4]]){const f=.6+.4*Math.sin(tick*TAU*5/P+ph), hh=5+Math.round(f*4+wv(9,ph));
      for(let y=246;y<268;y++)for(let x=bx-18;x<bx+20;x++){const d=Math.hypot(x-bx,(y-262)*1.5);if(d<18&&dith(x,y,(1-d/18)*.55*f))px(x,y,'#6b3316');}
      for(let k=0;k<hh;k++){const t=k/hh,w=k<2?5:k<4?4:k<6?3:k<8?2:1;rect(bx-(w>>1)+Math.round(Math.sin(tick*TAU*4/P+k+ph)*t),264-k,w,1,t<.3?'#ffe08a':t<.65?'#f2a33a':'#c9461f');}
      rect(bx-3,265,7,1,'#2a1a10');}
  }
  // embers rising from the fire, carried by the wind
  for(const e of embers){const t=((tick+e.off)%P)/P; const x=e.x+e.drift*t+Math.sin(t*9+e.off)*3, y=roofY(e.x)-4-e.rise*t;
    if(t<.9)px(x,y, t<.35?(e.hot>.5?'#ffe08a':'#f2a33a'):t<.7?'#d9592a':'#7a2a15');}
  if(running) timer=setTimeout(()=>requestAnimationFrame(frame),1000/12);
}

// ---------- foreground: bridge with tanks, barricade with defenders ----------
const fg=document.createElement('canvas');fg.width=W;fg.height=H;
const fgCalm=document.createElement('canvas');fgCalm.width=W;fgCalm.height=H;
(function(){const c=fg.getContext('2d');const P=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x|0,y|0,w|0,h|0);};
  seed=5;
  // bridge
  P(0,254,190,8,'#16161a');P(0,262,190,4,'#0c0c0e');P(0,252,190,2,'#1e1e23');
  for(let x=4;x<190;x+=6)P(x,248,1,4,'#1b1b20');P(0,247,190,1,'#1b1b20');
  for(let x=12;x<190;x+=36){P(x,266,6,18,'#111114');P(x-2,266,10,2,'#16161a');}
  // tanks (generic silhouettes)
  const tank=(x,y)=>{P(x+2,y+8,36,8,'#0a0a0c');P(x,y+12,40,4,'#08080a');for(let i=0;i<6;i++)P(x+3+i*6,y+15,3,2,'#141418');
    P(x+9,y+1,18,8,'#0a0a0c');P(x+11,y,12,1,'#111114');P(x+26,y+3,22,2,'#0a0a0c');P(x+47,y+2,2,4,'#0a0a0c');P(x+14,y-2,4,2,'#0a0a0c');};
  tank(40,232);tank(112,232);
  fgCalm.getContext('2d').drawImage(fg,0,0); // для спокойных картинок: без баррикад
  { // вариант Б (выбран 2026-11-21): линия баррикад на набережной у здания, костры
    // barricade line on the embankment road in front of the building (people ~7px at this distance)
    seed=11;
    // back layer: tall ragged heap of beams, sheet metal, furniture
    for(let x=194;x<W;){const w=6+(rnd()*12|0),h=5+(rnd()*8|0),t=rnd();
      const col=t<.35?'#2c2823':t<.7?'#1f1c19':'#35302a';
      P(x,266-h,w,h,col);P(x,266-h,w,1,'#6a4a2c');P(x,266-h,1,h,'#3d3027');
      if(rnd()<.45){const hx=x+(rnd()*w|0),hy=266-h;for(let k=0;k<7;k++){P(hx+k,hy-k,1,2,'#3a342e');P(hx+6-k,hy-k,1,2,'#3a342e');}}  // crossed beams
      if(rnd()<.35)P(x+(rnd()*w|0),266-h-6,1,7,'#4a443c');
      x+=w-(rnd()*4|0);}
    // front layer: low rubble with lighter edges, tyres
    for(let x=196;x<W;){const w=4+(rnd()*9|0),h=2+(rnd()*4|0),t=rnd();
      P(x,267-h,w,h,t<.4?'#45413a':t<.75?'#191715':'#2a2622');P(x,267-h,w,1,t<.4?'#7d776b':'#5a3f28');
      if(rnd()<.22){P(x+1,261,6,6,'#0b0b0b');P(x+3,263,2,2,'#2f2a26');}
      x+=w+(rnd()*5|0);}
    // overturned truck and a bus built into the line
    P(300,256,26,9,'#1c1d20');P(300,256,26,1,'#4a4c52');P(302,258,8,4,'#0b0c0e');P(326,259,7,6,'#15161a');P(304,265,5,2,'#0a0a0a');P(318,265,5,2,'#0a0a0a');
    P(520,254,34,11,'#23201c');P(520,254,34,1,'#5a5348');for(let x=523;x<552;x+=5)P(x,257,3,3,'#0b0c0e');P(524,265,5,2,'#0a0a0a');P(544,265,5,2,'#0a0a0a');
    // concrete blocks
    for(const x of [232,238,372,378,384,470,476,600,606,612])P(x,261-(x%4),5,5+(x%4),'#4d4a43'),P(x,261-(x%4),5,1,'#77726a');
    // defenders: small silhouettes behind and on top of the line
    const man=(x,y)=>{y-=5;P(x+1,y,2,2,'#060607');P(x,y+2,4,4,'#060607');P(x,y+6,1,3,'#060607');P(x+3,y+6,1,3,'#060607');P(x+4,y+2,1,3,'#4a2a18');};
    for(const [x,y] of [[214,255],[222,256],[262,254],[270,255],[278,256],[338,253],[346,255],[398,255],[406,254],[414,256],[452,255],[494,254],[502,255],[560,252],[568,254],[576,255],[622,254],[630,255]])man(x,y);
    for(const x of [270,406,568])P(x+5,243,1,9,'#0b0b0c');                    // rifles / poles
    // flags on poles: red, and black-yellow-white
    P(346,230,1,22,'#3a342e');P(347,230,12,8,'#8f241e');P(347,230,12,1,'#b3322b');
    P(576,230,1,22,'#3a342e');P(577,230,12,3,'#0c0c0c');P(577,233,12,3,'#b89a2e');P(577,236,12,2,'#c9c6bc');
  }
  // mud strip
  for(let x=0;x<W;x++){P(x,352+(x*7%5),1,8,'#0b0b0a');}
  {const c2=fgCalm.getContext('2d');c2.fillStyle='#0b0b0a';for(let x=0;x<W;x++)c2.fillRect(x,352+(x*7%5),1,8);}
})();

WH.onload=()=>{drawStatic();
  // calm variant (no soot, no fire, still flag) for event pictures of the first days
  const bg0=g.getImageData(0,0,W,H); g.drawImage(WH,0,0); flag(0); g.drawImage(fgCalm,0,0);
  calm.getContext('2d').drawImage(cv,0,0); g.putImageData(bg0,0,0);
  buildLayer(); base.getContext('2d').drawImage(cv,0,0); ready=true;
  // burning variant: one frame of the fire loop
  tick=20; const keep=running; running=false; frame(); burning.getContext('2d').drawImage(cv,0,0); running=keep;
  if(running) frame(); readyCbs.forEach(f=>f()); };



return {
  start(){ if(running) return; running=true; if(ready) frame(); },
  stop(){ running=false; clearTimeout(timer); },
  onReady(f){ ready?f():readyCbs.push(f); },
  calm, burning
};
})();
