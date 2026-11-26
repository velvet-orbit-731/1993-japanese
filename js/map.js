// Moscow map art: copied from the approved mockup 1993-mockups/map.html ('scheme' background).
// drawMap() paints the static base once; drawMapDynamic() adds the cordon and crowds that change with the game state.
function drawMap(){

// ================= pixel map (440x260 canvas, shown at 2x; geometry in 220x130 map units) =================
const cv=document.getElementById('map-c'), g=cv.getContext('2d'); const K=2, W=220*K, H=130*K, S=4; // S = screen px per map unit
let seed=11; const rnd=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};
const B4=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
const dith=(x,y,t)=>t*16>B4[y&3][x&3]+.5;
const N=(x,y)=>{const v=Math.sin(x*12.9898+y*78.233)*43758.5453;return v-Math.floor(v);};
const px=(x,y,c)=>{g.fillStyle=c;g.fillRect(x|0,y|0,1,1);};                // fine pixel
const R=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x*K),Math.round(y*K),Math.max(1,Math.round(w*K)),Math.max(1,Math.round(h*K)));}; // map units

// ---- background style: #bg=night (default) | paper | aerial | scheme ----
const BG='scheme'; // approved: operational scheme
const STY={
  night:{ground:'#1d1c1a',ground2:'#211f1c',block:'#2b2925',block2:'#302d28',roof:'#38352f',roofHi:'#45413a',shadow:'#161513',road:'#45423b',road2:'#4d4a42',roadHi:'#6b6656',ringOut:'#2a2823',ring:'#5b574c',ringHi:'#6d685b',
    water:'#14202a',water2:'#1b2a36',bank:'#3a3a35',bankOut:'#4a4840',park:'#232a1c',park2:'#2b2f1d',leaf:'#5a4220',leaf2:'#3d3418',leafSh:'#1a1f14',bridge:['#5a564b','#77725f','#3a372f'],cordon:'#7fa0cf',cordon2:'#4a6488'},
  // staff map on aged paper: hatched quarters, ink outlines, pencil grid
  paper:{ground:'#cbbd9a',ground2:'#c4b590',block:'#b5a47c',block2:'#ad9c75',roof:'#b9a981',roofHi:'#8c7b58',shadow:'#8c7b58',road:'#efe6cc',road2:'#f4ecd4',roadHi:'#8c7b58',ringOut:'#7a6a4a',ring:'#f1e8cf',ringHi:'#f1e8cf',
    water:'#8aa0aa',water2:'#a3b6bd',bank:'#5f7480',bankOut:'#5f7480',park:'#a3ab7c',park2:'#99a274',leaf:'#7d8a58',leaf2:'#8b7a4a',leafSh:'#8f9a6c',bridge:['#efe6cc','#7a6a4a','#7a6a4a'],cordon:'#24468a',cordon2:'#24468a'},
  // night aerial: black city, chains of street lamps, lit windows
  aerial:{ground:'#0a0b0d',ground2:'#0c0d10',block:'#111215',block2:'#13141a',roof:'#16171c',roofHi:'#1b1c22',shadow:'#060607',road:'#1a1a1c',road2:'#232220',roadHi:'#3a3022',ringOut:'#0a0a0b',ring:'#24221f',ringHi:'#2e2a24',
    water:'#05080c',water2:'#0d141c',bank:'#15171a',bankOut:'#1b1d20',park:'#0b0f0b',park2:'#0d120d',leaf:'#141a12',leaf2:'#10140f',leafSh:'#080a08',bridge:['#24221f','#3a3022','#15140f'],cordon:'#7fa0cf',cordon2:'#4a6488'},
  // clean operational scheme: flat districts, thin lines, grid
  scheme:{ground:'#12161c',ground2:'#12161c',block:'#171c24',block2:'#171c24',roof:'#171c24',roofHi:'#171c24',shadow:'#12161c',road:'#39424f',road2:'#566273',roadHi:'#566273',ringOut:'#12161c',ring:'#6e7c90',ringHi:'#8796ab',
    water:'#1b2f44',water2:'#213a54',bank:'#3d5f82',bankOut:'#12161c',park:'#16211c',park2:'#16211c',leaf:'#1c2a22',leaf2:'#1c2a22',leafSh:'#16211c',bridge:['#6e7c90','#8796ab','#6e7c90'],cordon:'#7fa0cf',cordon2:'#4a6488'},
};
const C=STY[BG]||STY.night;

// ground
for(let y=0;y<H;y++)for(let x=0;x<W;x++)px(x,y,dith(x,y,.25)?C.ground2:C.ground);
if(BG==='paper'){ // stains, fibres, fold lines
  const nzp=(x,y,sx,sy)=>{const X=x/sx,Y=y/sy,ix=Math.floor(X),iy=Math.floor(Y),fx=X-ix,fy=Y-iy;return (N(ix,iy)*(1-fx)+N(ix+1,iy)*fx)*(1-fy)+(N(ix,iy+1)*(1-fx)+N(ix+1,iy+1)*fx)*fy;};
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const n=nzp(x,y,60,40);if(n>.6&&dith(x,y,(n-.6)*2))px(x,y,'#bfae88');if(N(x,y)<.02)px(x,y,'#b3a27c');}
}
if(BG==='scheme'){ for(let x=0;x<W;x+=40)for(let y=0;y<H;y+=2)px(x,y,'#1b222c'); for(let y=0;y<H;y+=40)for(let x=0;x<W;x+=2)px(x,y,'#1b222c'); }

// city blocks
seed=3;
for(let by=2;by<130;by+=7)for(let bx=2;bx<220;bx+=8){
  const X=bx*K,Y=by*K,w=10+(rnd()*3|0),h=8+(rnd()*3|0);
  if(BG==='paper'){ // hatched quarter with ink outline
    g.fillStyle=C.block;g.fillRect(X,Y,w,h); for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++)if(((xx+yy)%3)==0)px(X+xx,Y+yy,'#9d8c66');
    g.fillStyle=C.roofHi;g.fillRect(X,Y,w,1);g.fillRect(X,Y+h-1,w,1);g.fillRect(X,Y,1,h);g.fillRect(X+w-1,Y,1,h); rnd();continue; }
  if(BG==='scheme'){ g.fillStyle=C.block;g.fillRect(X,Y,w,h); continue; }
  g.fillStyle=C.shadow;g.fillRect(X+1,Y+1,w,h);
  let cx=X; while(cx<X+w-2){const rw=3+(rnd()*4|0),rh=3+(rnd()*(h-3)|0); const ry=Y+(rnd()<.5?0:h-rh);
    g.fillStyle=rnd()<.5?C.block:C.block2;g.fillRect(cx,Y,Math.min(rw,X+w-cx),h);
    g.fillStyle=C.roof;g.fillRect(cx,ry,Math.min(rw,X+w-cx)-1,rh-1);
    g.fillStyle=C.roofHi;g.fillRect(cx,ry,Math.min(rw,X+w-cx)-1,1); cx+=rw;}
  if(BG==='aerial'){ for(let i=0;i<3;i++)if(rnd()<.55)px(X+1+rnd()*(w-2),Y+1+rnd()*(h-2),rnd()<.7?'#6b5a34':'#a08a4a'); }
}

// parks (autumn trees as 2x2 crowns)
function park(cx,cy,rx,ry){cx*=K;cy*=K;rx*=K;ry*=K;
  for(let y=-ry;y<=ry;y++)for(let x=-rx;x<=rx;x++){if((x*x)/(rx*rx)+(y*y)/(ry*ry)>1)continue;const X=cx+x,Y=cy+y;px(X,Y,dith(X,Y,.5)?C.park2:C.park);}
  for(let i=0;i<rx*ry*.5;i++){const a=rnd()*6.283,r=Math.sqrt(rnd());const X=cx+Math.cos(a)*rx*r,Y=cy+Math.sin(a)*ry*r;
    const c=rnd()<.6?C.leaf:C.leaf2; px(X,Y,c);px(X+1,Y,c);px(X,Y+1,C.leafSh);}}
park(40,40,12,7); park(121,108,7,7); park(20,100,10,10); park(82,112,8,5);

// splines
function spline(pts,step=.01){const out=[];for(let i=0;i<pts.length-1;i++){const p0=pts[i-1]||pts[i],p1=pts[i],p2=pts[i+1],p3=pts[i+2]||p2;
  for(let t=0;t<1;t+=step){const t2=t*t,t3=t2*t;
    out.push([.5*((2*p1[0])+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),
              .5*((2*p1[1])+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)]);}}return out;}
function stroke(pts,r,col){r*=K;for(const [x0,y0] of pts){const x=x0*K,y=y0*K;for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)if(dx*dx+dy*dy<=r*r+.5)px(x+dx,y+dy,col);}}
function line(pts,col){for(const [x,y] of pts)px(x*K,y*K,col);}

// Moscow river, traced from a real map (stylised layout kept):
//  west arm: rises from the south-west to the White House embankment, bends sharply south (Novoarbatsky – Borodinsky bridges) and leaves toward Luzhniki
//  east arm: comes back from the south past Gorky park, runs under the Kremlin wall, then turns south again
const riverA=spline([[-6,78],[6,76],[16,73.5],[29,62.5],[42.5,57],[53,58.5],[60.5,63],[64.5,71.5],[64,82],[60,92],[51,104],[36,118],[22,128],[12,136]]);
const riverB=spline([[84,142],[91,134],[99,124.5],[108,110],[114.5,95],[121,86.5],[130.5,82.8],[141,82.5],[154.5,85],[164,90],[172.5,99],[177,112],[180.5,131],[182,140]]);
const river=riverA.concat(riverB);
// Vodootvodny canal: leaves the river above the Krymsky bend, runs south of it and rejoins downstream; Bolotny island lies between
const canal=spline([[116,92.5],[119.5,91],[129,92.5],[142.5,94.5],[154.5,97.5],[162,103.5],[167,113],[171.5,123],[178.5,126]]);
// island: slightly lighter ground between river and canal
{ const isl=[...spline([[121,86.5],[130.5,82.8],[141,82.5],[154.5,85],[164,90],[172.5,99],[177,112],[178.5,126]]),...canal.slice().reverse()];
  g.fillStyle=BG==='paper'?'#d6c9a6':BG==='aerial'?'#101114':BG==='scheme'?'#1a212b':'#262421'; g.beginPath(); isl.forEach(([x,y],i)=>i?g.lineTo(x*K,y*K):g.moveTo(x*K,y*K)); g.closePath(); g.fill(); }
for(const rv of [riverA,riverB])stroke(rv,3.4,C.bankOut); stroke(canal,1.5,C.bankOut);
for(const rv of [riverA,riverB])stroke(rv,3,C.bank); stroke(canal,1.2,C.bank);
for(const rv of [riverA,riverB])stroke(rv,2.5,C.water); stroke(canal,.8,C.water);
for(let i=0;i<700;i++){const [x,y]=river[(rnd()*river.length)|0];const X=x*K+(rnd()*8-4),Y=y*K+(rnd()*6-3);const d=g.getImageData(X|0,Y|0,1,1).data;if(d[2]>d[0]+12){px(X,Y,C.water2);px(X+1,Y,C.water2);}}

// rings
function ellipse(cx,cy,rx,ry,col,w=1){for(let a=0;a<Math.PI*2;a+=.002){const x=(cx+Math.cos(a)*rx)*K,y=(cy+Math.sin(a)*ry)*K;g.fillStyle=col;g.fillRect(x|0,y|0,w,w);}}
ellipse(140,64,60,44,C.ringOut,4); ellipse(140,64,60,44,C.ring,3);
ellipse(140,64,60,44,C.ringHi,1);
ellipse(140,62,28,22,C.road,2);
// avenues
const roads=[[[66,56],[100,60],[128,62]], [[140,62],[150,30],[156,0]], [[140,62],[118,30],[110,0]], [[140,62],[180,40],[220,30]],
  [[140,62],[176,90],[220,124]], [[140,62],[148,100],[150,130]], [[66,56],[40,58],[0,62]], [[60,56],[58,30],[56,0]], [[84,80],[60,100],[40,130]]];
for(const r of roads){const p=spline(r);for(const [x,y] of p){px(x*K,y*K,C.road);px(x*K+1,y*K,C.road);}}
// Novy Arbat
stroke(spline([[68,58],[90,62],[112,64],[128,64]]),1,C.road2);
for(const [x,y] of spline([[68,58],[90,62],[112,64],[128,64]]))if(N(x|0,1)<.3)px(x*K,y*K,C.roadHi);
// мосты на карте не рисуем (решение Ивана 2026-11-21: выглядят плохо)

// style extras
if(BG==='aerial'){ // chains of sodium street lamps along the avenues and the rings
  const lamp=(x,y)=>{px(x,y,'#ffd27a');px(x+1,y,'#a8742e');px(x-1,y,'#a8742e');px(x,y+1,'#6b4a20');px(x,y-1,'#6b4a20');};
  for(const r of roads){const p=spline(r);for(let i=0;i<p.length;i+=14)lamp(p[i][0]*K,p[i][1]*K);}
  for(let a=0;a<Math.PI*2;a+=.045){lamp((140+Math.cos(a)*60)*K+1,(64+Math.sin(a)*44)*K+1);}
  for(let a=0;a<Math.PI*2;a+=.09){lamp((140+Math.cos(a)*28)*K,(62+Math.sin(a)*22)*K);}
  for(const [x,y] of river)if(N(x|0,y|0)<.012){px(x*K,y*K,'#3a3022');px(x*K+1,y*K,'#241e16');}
}
if(BG==='paper'){ // pencil grid with square labels, ink road casings
  for(let x=40;x<W;x+=80)for(let y=0;y<H;y++)if(y%3)px(x,y,'#a08f6a'); for(let y=30;y<H;y+=80)for(let x=0;x<W;x++)if(x%3)px(x,y,'#a08f6a');
  for(const r of roads){const p=spline(r);for(const [x,y] of p){px(x*K-1,y*K+1,'#8c7b58');}for(const [x,y] of p){px(x*K,y*K,C.road);px(x*K+1,y*K,C.road);}}
}

// Kremlin: real outline of the walls (irregular polygon), towers at the corners, cathedrals inside
(function(){
  const Z=1.3,ox=141,oy=69,zx=x=>ox+(x-ox)*Z,zy=y=>oy+(y-70.5)*Z; const R0=R; const RZ=(x,y,w,h,c)=>R0(zx(x),zy(y),w*Z,h*Z,c);
  // Arsenal corner (N) -> Nikolskaya -> Spasskaya -> Beklemishevskaya (SE) -> river wall -> Vodovzvodnaya (SW) -> Borovitskaya -> Troitskaya (W)
  const pts=[[135.5,63.2],[144,63],[149.5,67.5],[151.5,76],[142,78.2],[133,77.6],[130.5,73.5],[131.5,67.5]].map(([x,y])=>[zx(x),zy(y)]);
  const inside=(x,y)=>{let c=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const [xi,yi]=pts[i],[xj,yj]=pts[j];if(((yi>y)!=(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))c=!c;}return c;};
  for(let y=56*K;y<82*K;y++)for(let x=126*K;x<157*K;x++){const X=(x+.5)/K,Y=(y+.5)/K;if(!inside(X,Y))continue;
    const edge=!inside(X-.6,Y)||!inside(X+.6,Y)||!inside(X,Y-.6)||!inside(X,Y+.6);
    px(x,y,edge?'#a03c2e':(BG==='paper'?'#c9b48c':'#2a2026'));}
  // towers
  for(const [x,y] of pts){R0(x-1,y-1,2,2,'#c0473a');R0(x-.5,y-.5,1,1,'#e0866a');}
  for(const [x,y] of [[146.8,65.2],[150.5,72],[146.5,77.2],[137.5,77.9],[131,70.5],[139.7,63.1]])RZ(x-.5,y-.5,1,1,'#c0473a'); // mid-wall towers
  // inside: Senate/Arsenal block, Cathedral square, Ivan the Great, Grand Kremlin Palace, garden
  RZ(138.5,64.5,4,2,'#6a5a4a');RZ(143,66.5,3.5,2.5,'#6a5a4a');
  RZ(139,72,1.5,1.5,'#d8d2be');RZ(141,71,1.5,1.5,'#d8d2be');RZ(141.2,73.4,1.5,1.5,'#d8d2be');RZ(143.2,72,1,2,'#efe6cc');
  for(const [x,y] of [[139.6,72.6],[141.6,71.6],[141.8,74],[143.5,72.6]])px(zx(x)*K,zy(y)*K,'#c9a25a');
  RZ(134.5,74,4.5,2,'#8a8270');
  RZ(145.5,73.5,3.5,2.5,BG==='paper'?'#a3ab7c':'#1c2a22');
})();

// White House + SEV
R(55,51,11,8,'#7a766b');R(56,52,9,6,'#a9a497');R(56,52,9,.5,'#d6d2c4');R(58.5,49,4,4,'#c2beb0');R(58.5,49,4,.5,'#e0dccd');
for(let x=56.5;x<65;x+=1)R(x,54,.5,.5,'#55534c');
// полосатый серый блок справа от Белого дома (мост-рампа) убран по просьбе Ивана


MapArt.base=g.getImageData(0,0,W,H); MapArt.g=g; MapArt.px=px; MapArt.K=K; MapArt.W=W; MapArt.H=H;
}
const MapArt={};
function drawMapDynamic(st){
  const {g,px,K,W,H}=MapArt; g.putImageData(MapArt.base,0,0);
  let seed=91; const rnd=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};
  const C={cordon:'#7fa0cf',cordon2:'#4a6488'};
  if(st.cordon){
// cordon ring: barbed wire + vehicles
const cx0=61,cy0=55;
for(let a=0;a<Math.PI*2;a+=.012){const x=(cx0+Math.cos(a)*17)*K,y=(cy0+Math.sin(a)*13)*K; if(((a*80)|0)%4==0)continue; px(x,y,C.cordon); if(((a*240)|0)%3==0)px(x,y-1,C.cordon2);}
for(let a=0;a<Math.PI*2;a+=Math.PI/8){const x=(cx0+Math.cos(a)*17)*K,y=(cy0+Math.sin(a)*13)*K;
  g.fillStyle='#1d2c42';g.fillRect(x-3,y-2,6,4);g.fillStyle='#3a5a86';g.fillRect(x-3,y-2,6,1);px(x+2,y-1,'#9fb8dc');}

  }
  function crowd(x,y,n,col){for(let i=0;i<n;i++){const X=(x+rnd()*9-4.5)*K,Y=(y+rnd()*6-3)*K;px(X,Y,col);px(X,Y-1,'#d8c9a6');}}
  for(const c of st.crowds)crowd(c[0],c[1],c[2],c[3]);
}
// ================= tiny pixel icons =================
const ICONS={
 leg:["..1111..",".1....1.","1.1..1.1","1..11..1","1..11..1","1.1..1.1",".1....1.","..1111.."],
 ppl:["..11....",".1111.11","..11.1111",".1111.11","111111..","1111111.","11.11.11","11.11.11"],
 gun:["........","1111111.","11111111","....11..","....1...","...11...","...1....","........"],
 med:["..1.....","...1..1.","1111111.","1.....1.","1.111.1.","1.111.1.","1.....1.","1111111."],
 sup:["..1111..",".1....1.","11111111","1......1","1.1111.1","1......1","1......1","11111111"],
 dep:["..111...","..111...","...1....",".11111..","1.111.1.","1.111.1.","..1.1...","..1.1..."],
 mil:["..11...1","..11..1.",".1111.1.","1.11.11.","..11.1..","..11....",".1..1...",".1..1..."]};
function drawIcons(){document.querySelectorAll('canvas.ico:not([data-done])').forEach(c=>{const m=ICONS[c.dataset.i];c.width=8;c.height=8;const x=c.getContext('2d');x.fillStyle='#c9a25a';
  m.forEach((r,j)=>[...r].forEach((ch,i)=>{if(ch=='1')x.fillRect(i,j,1,1);}));c.dataset.done=1;});}

