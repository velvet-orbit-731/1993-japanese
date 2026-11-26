// ================= White House cross-section: management screen and the assault level =================
// Section art is adapted from the approved mockup 1993-mockups/interior.html (380x296 canvas shown at 2x).

const SEC={W:380,H:296,GY:256,PODL:28,PODR:352,TL:132,TR:248,FH:10,PFH:12,podFloors:5,towFloors:15};
SEC.podTop=SEC.GY-SEC.podFloors*SEC.PFH; SEC.towTop=SEC.podTop-SEC.towFloors*SEC.FH;
SEC.floorsY=[]; for(let i=0;i<SEC.podFloors;i++)SEC.floorsY[i]=SEC.GY-(i+1)*SEC.PFH; for(let i=0;i<SEC.towFloors;i++)SEC.floorsY[SEC.podFloors+i]=SEC.podTop-(i+1)*SEC.FH;

// ---------- static building (drawn once into an offscreen canvas) ----------
const secBase=(function(){
  const {W,H,GY,PODL,PODR,TL,TR,FH,PFH,podFloors,towFloors,podTop,towTop,floorsY}=SEC;
  const B4=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];const dith=(x,y,t)=>t*16>B4[y&3][x&3]+.5;
  const CX=TL+48, CW=20, HX=PODL+6, HW=92, HY=GY-4*PFH+2, HH=2*PFH-3;      // лестнично-лифтовый узел и зал заседаний
  function build(lit){
    const cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');
    let seed=21;const rnd=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};
    const px=(x,y,c)=>{g.fillStyle=c;g.fillRect(x|0,y|0,1,1);};const rect=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x|0,y|0,w|0,h|0);};
    const ST={hi:'#dcd7c8',mid:'#b9b4a5',sh:'#8f8a7c',dk:'#625e54'};
    const C=lit?{w:['#4d4334','#463d30','#52483a','#41392d'],off:'#26221c',wain:'#352b1e',furn:'#8a6638',furn2:'#5e4528',door:'#2b2118',frame:'#a8975c',glow:'#fff0b8',lamp:'#72c276',part:'#6a6558',hall:'#4a3524',hall2:'#5a422c',seat:'#8a3028',core:'#2c2c2f',rail:'#55554f',win:'#f0cf7a',bas:'#28221a'}
              :{w:['#1b1c21','#18191e','#1e1f24','#16171b'],off:'#111215',wain:'#131418',furn:'#3d3226',furn2:'#2b231b',door:'#0d0d10',frame:'#3d3929',glow:'#3a3122',lamp:'#2b3b2d',part:'#2f2f33',hall:'#1c1712',hall2:'#241d16',seat:'#3d1d19',core:'#111114',rail:'#2a2a2c',win:'#18202e',bas:'#100f0d'};
    // ---- небо, звёзды, дальний город
    for(let y=0;y<GY;y++)for(let x=0;x<W;x++)px(x,y,dith(x,y,.15+y/GY*.75)?'#171a24':'#0c0e15');
    seed=11; for(let i=0;i<70;i++){const x=rnd()*W,y=rnd()*150;px(x,y,rnd()<.25?'#8088a0':'#454c60');}
    seed=5; for(const side of [0,1]){let x=side?PODR+3:0;const x1=side?W:PODL-3; while(x<x1){const w=4+(rnd()*6|0),h=8+(rnd()*24|0);rect(x,GY-h,Math.min(w,x1-x),h,'#0e0f15');rect(x,GY-h,Math.min(w,x1-x),1,'#191b24');
        for(let k=0;k<h/5;k++)px(x+1+rnd()*(w-2),GY-h+2+rnd()*(h-4),rnd()<.35?'#6f5f32':'#1b1d27'); x+=w+(rnd()<.3?1:0);}}
    // ---- земля
    rect(0,GY,W,H-GY,'#16130e'); seed=3; for(let i=0;i<1100;i++)px(rnd()*W,GY+3+rnd()*(H-GY),rnd()<.5?'#221d15':'#110e0a');
    for(let y=GY+24;y<H;y+=9)for(let x=0;x<W;x++)if(dith(x,y,.3))px(x,y+Math.sin(x*.07)*2,'#0f0c09');
    rect(0,GY,W,2,'#4c483f'); for(let x=0;x<W;x+=6)px(x,GY+1,'#2f2c26');
    // ---- коробка здания
    rect(PODL,podTop,PODR-PODL,GY-podTop,C.w[1]); rect(TL,towTop,TR-TL,podTop-towTop,C.w[1]);
    const skip=(x,f)=> (x>=CX-1&&x<CX+CW+1) || (f>=2&&f<=3&&x>=HX-1&&x<HX+HW+1&&f<podFloors);
    function room(x,w,y,h,f){ const dark=rnd()<(lit?.14:1); const wc=dark&&lit?C.off:C.w[(rnd()*4)|0];
      rect(x,y+2,w,h-2,wc); rect(x,y+h-3,w,1,dark&&lit?'#201c17':C.wain);
      if(lit&&!dark){const lx=x+(w>>1)-2; rect(lx,y+2,4,1,'#fff2c8'); for(let dy=1;dy<4;dy++)for(let dx=-3;dx<7;dx++)if(lx+dx>=x&&lx+dx<x+w&&dith(lx+dx,y+2+dy,.42-dy*.1))px(lx+dx,y+2+dy,'#665a42');}
      let u=x+1; const fb=y+h; // fb = верх следующего перекрытия = пол комнаты
      while(u<x+w-3){const k=rnd();
        if(k<.3&&u+3<=x+w){rect(u,fb-7,3,7,C.door);px(u,fb-7,C.frame);px(u+1,fb-7,C.frame);px(u+2,fb-7,C.frame);px(u+2,fb-4,C.frame);u+=5;}
        else if(k<.62&&u+6<=x+w){rect(u,fb-4,6,1,C.furn);px(u,fb-3,C.furn2);px(u,fb-2,C.furn2);px(u+5,fb-3,C.furn2);px(u+5,fb-2,C.furn2);rect(u+1,fb-3,4,1,C.furn2);
          px(u+4,fb-5,C.lamp);px(u+4,fb-6,lit&&!dark?C.glow:C.lamp);px(u+1,fb-5,lit?'#e8e2d0':'#3a3a3e');u+=8;}
        else if(k<.8&&u+4<=x+w){rect(u,fb-8,4,8,C.furn2);px(u,fb-8,C.furn);px(u+1,fb-8,C.furn);px(u+2,fb-8,C.furn);px(u+3,fb-8,C.furn);rect(u+1,fb-6,2,1,C.furn);rect(u+1,fb-3,2,1,C.furn);u+=6;}
        else if(k<.92&&u+3<=x+w){rect(u,y+3,3,2,C.frame);px(u+1,y+3,lit?'#5a6a7a':'#22262c');u+=5;}
        else u+=3;}
      rect(x+w,y+2,1,h-2,C.part);}
    function floorRow(x0,x1,y,h,f){ rect(x0,y,x1-x0,2,ST.sh); rect(x0,y,x1-x0,1,ST.mid);
      let x=x0+4; while(x<x1-5){ if(skip(x,f)){x++;continue;} let w=14+(rnd()*18|0); let e=x; while(e<x+w&&e<x1-5&&!skip(e,f))e++; w=e-x; if(w>=6)room(x,w-1,y,h,f); x=e; }
      // торцевые стены с окнами фасада
      for(const wx of [x0,x1-4]){rect(wx,y,4,h,ST.mid);rect(wx===x0?wx:wx+3,y,1,h,ST.hi);rect(wx+1,y+4,2,h-6,C.win);px(wx+1,y+4,lit?'#fff4c8':'#243044');}}
    seed=21;
    for(let i=0;i<podFloors;i++)floorRow(PODL,PODR,floorsY[i],PFH,i);
    for(let i=0;i<towFloors;i++)floorRow(TL,TR,floorsY[podFloors+i],FH,podFloors+i);
    // ---- лестнично-лифтовый узел: шахта с кабиной и марши лестниц
    rect(CX,towTop+2,CW,GY-towTop-2,C.core); rect(CX,towTop+2,1,GY-towTop-2,C.part); rect(CX+CW-1,towTop+2,1,GY-towTop-2,C.part); rect(CX+9,towTop+2,1,GY-towTop-2,C.part);
    for(let y=towTop+3;y<GY;y+=2){px(CX+2,y,C.rail);px(CX+7,y,C.rail);}
    {const cy=floorsY[9]; rect(CX+2,cy+2,6,FH-2,lit?'#c9b98a':'#3a3a34'); rect(CX+2,cy+2,6,1,ST.sh); px(CX+5,cy+4,lit?'#fff0b8':'#55503f'); rect(CX+4,towTop+3,1,cy-towTop-1,'#3d3d40');}
    for(let f=0;f<podFloors+towFloors;f++){const y=floorsY[f],h=f<podFloors?PFH:FH; rect(CX+10,y,CW-11,1,ST.sh);
      for(let i=0;i<8;i++){const sx=f%2?CX+17-i:CX+10+i, sy=y+h-1-Math.round(i*(h-2)/7); px(sx,sy,ST.sh); if(sy+1<y+h)px(sx,sy+1,C.rail);} }
    // ---- зал заседаний: балкон, партер, трибуна, герб
    rect(HX,HY,HW,HH,C.hall); for(let x=HX+6;x<HX+HW;x+=11)rect(x,HY,1,HH,C.hall2);
    rect(HX,HY,3,HH,lit?'#6a221c':'#2a1512'); rect(HX+HW-3,HY,3,HH,lit?'#6a221c':'#2a1512');
    rect(HX+3,HY+9,HW-24,2,ST.sh); rect(HX+3,HY+9,HW-24,1,ST.mid); for(let x=HX+4;x<HX+HW-22;x+=2)px(x,HY+8,C.frame);
    for(let x=HX+6;x<HX+HW-26;x+=4){rect(x,HY+6,2,2,C.seat);px(x,HY+5,lit?'#a84038':'#4a221d');}
    for(let r=0;r<2;r++)for(let x=HX+6+r*2;x<HX+HW-30;x+=4){rect(x,HY+HH-3-r*3,2,2,C.seat);px(x,HY+HH-4-r*3,lit?'#a84038':'#4a221d');}
    rect(HX+HW-22,HY+HH-7,14,7,C.furn2); rect(HX+HW-22,HY+HH-7,14,1,C.furn); rect(HX+HW-18,HY+HH-10,6,3,C.furn); px(HX+HW-16,HY+HH-9,'#d8b04a');
    rect(HX+HW-17,HY+2,4,4,'#d8b04a'); px(HX+HW-16,HY+3,'#b3322b'); px(HX+HW-15,HY+4,'#b3322b');
    rect(HX+HW-11,HY+1,1,7,'#cfc8b8'); rect(HX+HW-10,HY+1,5,1,'#e9e6dc'); rect(HX+HW-10,HY+2,5,1,'#2f8fd6'); rect(HX+HW-10,HY+3,5,1,'#b3322b');
    if(lit)for(const lx of [HX+20,HX+48]){rect(lx,HY,1,2,'#8a7a4a');rect(lx-2,HY+2,5,1,'#fff2c8');for(let dy=1;dy<5;dy++)for(let dx=-5;dx<6;dx++)if(dith(lx+dx,HY+2+dy,.4-dy*.07))px(lx+dx,HY+2+dy,'#7a6440');}
    // ---- парадный вестибюль с колоннами и 20-й подъезд
    {const y=floorsY[0]; rect(PODR-66,y+2,62,PFH-2,lit?'#5a5244':'#1c1d22'); for(let x=PODR-62;x<PODR-6;x+=9){rect(x,y+2,2,PFH-2,ST.mid);px(x,y+2,ST.hi);px(x+1,y+2,ST.hi);} for(let x=PODR-66;x<PODR-4;x+=4)px(x,y+PFH-1,lit?'#8a8272':'#2a2a2e');
      rect(PODR-4,y+3,4,PFH-3,'#3a2a1a'); rect(PODR-3,y+4,2,5,lit?'#f0cf7a':'#18202e');
      rect(PODL,y+4,4,PFH-4,'#3a2a1a'); rect(PODL+1,y+5,2,4,lit?'#f0cf7a':'#18202e');}
    rect(PODR,GY-3,4,3,ST.sh);rect(PODR+4,GY-2,4,2,ST.sh);rect(PODR+8,GY-1,4,1,ST.sh);rect(PODR,GY-3,4,1,ST.mid);rect(PODR+4,GY-2,4,1,ST.mid); rect(PODR,GY-PFH-1,9,1,ST.mid);rect(PODR,GY-PFH,9,1,ST.dk);
    rect(PODL-5,GY-1,5,1,ST.sh); rect(PODL-6,GY-PFH,6,1,ST.mid);
    for(const lx of [W-9,8]){rect(lx,GY-24,1,24,'#2c2c31');rect(lx-1,GY-25,3,1,'#3a3a40');px(lx,GY-24,lit?'#fff0b8':'#4a4636'); if(lit)for(let dy=0;dy<6;dy++)for(let dx=-4;dx<5;dx++)if(dith(lx+dx,GY-23+dy,.3-dy*.04))px(lx+dx,GY-23+dy,'#4a4430');}
    for(const tx of [16,W-20]){rect(tx,GY-7,1,7,'#2a2118');for(let dy=-9;dy<0;dy++)for(let dx=-4;dx<5;dx++)if(dx*dx+(dy+5)*(dy+5)<17&&dith(tx+dx,GY-7+dy,.75))px(tx+dx,GY-7+dy,(dx+dy)%2?'#1d2c1b':'#263a23');}
    // ---- кровля стилобата, карниз, аттик, башенка с часами, флаг
    for(const [a,b] of [[PODL-2,TL],[TR,PODR+2]]){rect(a,podTop-3,b-a,3,ST.hi);rect(a,podTop-1,b-a,1,ST.sh);for(let x=a+8;x<b-8;x+=17){rect(x,podTop-6,5,3,ST.dk);rect(x,podTop-6,5,1,ST.sh);}}
    rect(PODL+34,podTop-12,1,9,'#4a4a50');px(PODL+33,podTop-12,'#6a6a70');px(PODL+35,podTop-11,'#6a6a70'); rect(PODR-40,podTop-8,4,5,ST.dk);rect(PODR-41,podTop-9,6,1,ST.sh);
    rect(TL-2,towTop-3,TR-TL+4,3,ST.hi); rect(TL-2,towTop-1,TR-TL+4,1,ST.sh);
    rect(TL+10,towTop-13,TR-TL-20,10,ST.mid); rect(TL+10,towTop-13,TR-TL-20,1,ST.hi); for(let x=TL+14;x<TR-14;x+=5)rect(x,towTop-10,2,5,C.win);
    const cx=(TL+TR)>>1; rect(cx-14,towTop-23,28,10,ST.mid); rect(cx-14,towTop-23,28,1,ST.hi); rect(cx-15,towTop-24,30,1,ST.sh);
    rect(cx-3,towTop-21,7,7,'#d8b04a'); rect(cx-2,towTop-20,5,5,'#f1e9d0'); px(cx,towTop-18,'#1c1916'); px(cx,towTop-19,'#1c1916'); px(cx+1,towTop-18,'#1c1916');
    rect(cx,towTop-45,1,21,'#cfc8b8'); const flag=['#e9e6dc','#2f8fd6','#b3322b']; for(let s=0;s<3;s++)rect(cx+1,towTop-45+s*3,14,3,flag[s]);
    // ---- подвал: склад, трубы, генератор, ход в коллектор
    const bx=PODL+16,bw=PODR-PODL-32,by=GY+3; rect(bx-2,by-1,bw+4,22,'#3d3a33'); rect(bx,by,bw,18,C.bas); rect(bx,by+18,bw,2,'#4a463d');
    rect(bx,by+2,bw,1,'#55554e'); for(let x=bx+10;x<bx+bw;x+=22)px(x,by+2,'#7a7a70'); rect(bx,by+4,bw,1,'#3a4a55'); for(let x=bx+16;x<bx+bw;x+=31){px(x,by+4,'#5a7080');px(x,by+5,'#3a4a55');}
    rect(bx,by+6,6,12,'#050505'); px(bx+1,by+6,C.bas); px(bx+5,by+6,C.bas); rect(bx+6,by+6,1,12,'#4a463d');
    for(let i=0;i<9;i++){const x=bx+12+i*10,h=i%3===1?12:8; rect(x,by+18-h,8,h,'#4a3c28');rect(x,by+18-h,8,1,'#6a5638');px(x+3,by+18-h+3,'#2a2118');px(x+4,by+18-h+4,'#2a2118'); if(h>8)rect(x,by+12,8,1,'#2a2118');}
    for(let i=0;i<5;i++){const x=bx+108+i*7;rect(x,by+13,6,5,'#8a8068');rect(x+1,by+12,4,1,'#8a8068');px(x+2,by+12,'#5a5444');}
    for(let i=0;i<4;i++){const x=bx+bw-128+i*7;rect(x,by+10,5,8,'#2f4d5e');rect(x,by+10,5,1,'#4a6f84');rect(x,by+14,5,1,'#1f3542');}
    {const gx=bx+bw-86; rect(gx,by+6,26,12,'#55554a');rect(gx,by+6,26,1,'#7a7a6a');rect(gx+2,by+9,5,3,lit?'#f2a33a':'#8a5a22');rect(gx+10,by+8,12,8,'#2c2c26');for(let x=gx+11;x<gx+21;x+=2)rect(x,by+9,1,6,'#44443a');
      rect(gx+24,by-2,1,9,'#3a3a32'); px(gx+24,by-3,'#55554a'); for(let x=gx+27;x<bx+bw-6;x++)px(x,by+8,'#3a3a32');}
    {const x=bx+bw-22; rect(x,by+5,14,13,'#1f2a22');rect(x,by+5,14,1,'#3a4a3c');px(x+3,by+9,'#b3322b');px(x+4,by+9,'#b3322b');px(x+3,by+10,'#b3322b');px(x+4,by+8,'#b3322b');rect(x+8,by+8,4,6,'#101612');}
    return cv;}
  const cv=build(false), lit=build(true);
  // свечи (только координаты; рисуются анимированно, когда света нет)
  let seed=77;const rnd=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;}; const lights=[];
  for(let i=0;i<46;i++){const f=(rnd()*(podFloors+towFloors))|0;const fh=f<podFloors?PFH:FH;const y=floorsY[f]+fh-6;
    const x0=f<podFloors?PODL+8:TL+8,x1=f<podFloors?PODR-8:TR-8;const x=x0+rnd()*(x1-x0); if(x>CX-2&&x<CX+CW+2)continue; lights.push([x,y,rnd()]);}
  return {cv,lit,lights,dith,CX,CW};
})();

// ---------- dynamic layer: people by faction, defenders, attackers, fire ----------
let secTick=0;
function drawSection(canvas,opt){
  const g=canvas.getContext('2d'); g.drawImage(opt.lit?secBase.lit:secBase.cv,0,0);
  const {GY,PODL,PODR,TL,TR,FH,PFH,podFloors,floorsY,towTop}=SEC; const dith=secBase.dith;
  const px=(x,y,c)=>{g.fillStyle=c;g.fillRect(x|0,y|0,1,1);};const rect=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x|0,y|0,w|0,h|0);};
  let seed=8;const rnd=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};
  function person(x,y,c,skin){px(x+1,y,skin||'#d8c9a6');px(x+2,y,skin||'#d8c9a6');px(x+1,y+1,'#b8a886');px(x+2,y+1,'#b8a886');
    rect(x,y+2,4,3,c);px(x,y+2,'#0e0e10');rect(x+1,y+5,1,2,'#1b1b1e');rect(x+2,y+5,1,2,'#1b1b1e');}
  // candles
  const t=secTick;
  for(const [x,y,ph] of secBase.lights){const f=Math.sin(t*.4+ph*30); if(opt.lit)continue;
    for(let dy=-3;dy<=3;dy++)for(let dx=-4;dx<=4;dx++){if(dx*dx+dy*dy>12)continue;if(dith((x+dx)|0,(y+dy)|0,.35))px(x+dx,y+dy,'#2e2418');}
    px(x,y+1,'#d8d0b8');px(x,y+2,'#d8d0b8');px(x,y,f>.3?'#ffe08a':'#e09040');if(f>0)px(x,y-1,'#f2a33a');}
  // factions in rooms / tower offices
  const fac=opt.fac||{};
  {const HXa=PODL+10,HWa=58; let hi=0;
  FACTIONS.forEach((F,fi)=>{const f=fac[F.id];if(!f||f.n<=0)return; const cnt=Math.max(1,Math.round(f.n/6));
    if(F.kind==='arm'){for(let i=0;i<Math.min(cnt,10);i++)person(fi%2?PODR-60+rnd()*50:PODL+6+rnd()*40,GY-9,F.c);return;}
    const inHall=Math.ceil(cnt*.4); for(let i=0;i<inHall;i++){const row=hi%2;person(HXa+((hi*7)%HWa)+rnd()*2,(row?GY-4*PFH+2+3:GY-2*PFH-9),F.c);hi++;}
    const fl=podFloors+1+((fi*2)%12), y=floorsY[fl]+FH-9; for(let i=0;i<Math.min(cnt-inHall,10);i++){let x=TL+7+rnd()*(TR-TL-18); if(x>secBase.CX-5&&x<secBase.CX+secBase.CW)x+=secBase.CW+5;
      if(opt.st&&i%2===0){const left=x<secBase.CX, lo=left?TL+6:secBase.CX+secBase.CW+2, hi2=left?secBase.CX-6:TR-10; x=Math.max(lo,Math.min(hi2,x+Math.round(Math.sin(t*(opt.st.hope<40?.08:.16)+i*1.7+fi*2.3)*9)));} // ходят по кабинетам
      person(x,y,F.c);}
  });}
  // жизнь здания (экран «Белый дом»): вид зависит от состояния парламента
  if(opt.st){const st=opt.st, CX=secBase.CX, CW=secBase.CW;
    // аппарат в коридорах стилобата: чем меньше депутатов, тем пустее
    const nW=st.dep>=QUORUM?9:st.dep>=100?5:2, L=PODR-PODL-22;
    for(let k=0;k<nW;k++){const f=[0,1,4][k%3], sp=(st.hope<40?.5:1)*(.9+(k%4)*.25), u=(t*sp+k*53)%(2*L), x=PODL+8+(u<L?u:2*L-u);
      person(x,floorsY[f]+PFH-9,k%4===0?'#6f7f8f':'#8d8674'); if(k%3===1)px(x+4,floorsY[f]+PFH-5,'#d8d0b8');}   // папка с бумагами
    // лифт ходит, пока есть свет
    if(opt.lit){const top=towTop+6, bot=GY-12, Ls=bot-top, u=(t*1.5)%(2*Ls), y=bot-(u<Ls?u:2*Ls-u); rect(CX+3,y,5,7,'#d8c9a6');rect(CX+4,y+1,3,5,'#6a5a34');}
    // вооружённые патрули, когда радикалы берут верх
    if(st.rad>=60){for(let k=0;k<5;k++){const fl=podFloors+2+k*3, Lw=CX-TL-14, u=(t*.8+k*17)%(2*Lw), x=TL+6+(u<Lw?u:2*Lw-u), y=floorsY[Math.min(fl,floorsY.length-1)]+FH-9; person(x,y,'#3a1512'); rect(x+4,y-1,1,6,'#0b0b0c');}
      rect(PODL+2,GY-22,1,14,'#3a342e');rect(PODL+3,GY-22,7,5,'#b3322b');}
    // решимость падает: люди с вещами тянутся к выходу
    if(st.hope<40){for(let k=0;k<4;k++){const u=(t*.7+k*31)%120, x=PODR-30+u; if(x<SEC.W-2){person(x,GY-8,'#5d5a52');rect(x+4,GY-4,2,2,'#2a2622');}}}
    // сторонники у стен: чем больше людей, тем гуще толпа; ночью костры
    if(!opt.calm){const nC=Math.min(14,Math.round(st.ppl/350)); let s2=77;const r2=()=>{s2=(s2*16807)%2147483647;return (s2-1)/2147483646;};
      for(let k=0;k<nC;k++){const x=1+r2()*(PODL-8), sway=Math.round(Math.sin(t*.2+k)*1); person(x+sway,GY-8,k%5===0?'#7a2a20':'#4d463c');}
      if(nC>=4){const f=Math.sin(t*.9); rect(PODL-12,GY-3,3,1,'#2a1a10');px(PODL-11,GY-4,f>0?'#ffe08a':'#f2a33a');px(PODL-11,GY-5,f>.4?'#f2a33a':'#c9461f');}}
    // рация на крыше
    if(st.radio){rect(TL+20,towTop-34,1,22,'#8d8674');px(TL+19,towTop-30,'#8d8674');px(TL+21,towTop-26,'#8d8674');if(Math.sin(t*.8)>0)px(TL+20,towTop-35,'#e0483a');}
  }
  // defenders (assault): militia at the two entrances, snipers in the tower
  if(opt.def){const d=opt.def;
    for(let i=0;i<Math.min(16,d.entr);i++)person(2+rnd()*22,GY-8-(i%2)*1,'#7a2a20');
    for(let i=0;i<Math.min(14,d.front);i++)person(PODR-20+rnd()*16,GY-8,'#7a2a20');
    for(let i=0;i<Math.min(10,d.tower);i++){const fl=podFloors+1+((i*5)%12);person(TL+6+rnd()*(TR-TL-16),floorsY[fl]+FH-9,'#7a2a20');}
  } else {
    // barricade at entrance 20 and the cordon on the right (crisis)
    seed=30; if(!opt.calm)for(let i=0;i<30;i++){rect(2+rnd()*22,GY-3-rnd()*7,6+rnd()*8,3,rnd()<.5?'#2a2622':'#1f1c19');}
    if(!opt.calm)for(let i=0;i<4;i++){rect(4+i*6,GY-6,5,5,'#111');rect(5+i*6,GY-5,3,3,'#262321');}
    if(opt.cordon){for(let x=SEC.W-22;x<SEC.W;x+=7){rect(x,GY-9,4,9,'#1d2c42');rect(x,GY-9,4,1,'#3a5a86');px(x+1,GY-11,'#9fb8dc');}
      for(let x=SEC.W-26;x<SEC.W;x+=2)px(x,GY-14+(x%3),'#7fa0cf');}
  }
  // attackers
  if(opt.att){const a=opt.att; seed=55;
    for(let i=0;i<Math.min(14,a.entr);i++)person(0+rnd()*14,GY-8,'#3a5a86','#9fb8dc');
    for(let i=0;i<Math.min(14,a.front);i++)person(SEC.W-16+rnd()*14,GY-8,'#3a5a86','#9fb8dc');
  }
  // fire from tank hits: upper floors burn
  if(opt.fire){const n=Math.min(SEC.towFloors,Math.round(opt.fire));
    for(let k=0;k<n;k++){const fl=podFloors+SEC.towFloors-1-k;const y=floorsY[fl];
      for(let x=TL+4;x<TR-4;x+=7){const ph=Math.sin(t*.9+x*.7+k*3); if(ph<-.2)continue;
        rect(x,y+3,4,FH-4,ph>.6?'#ffd060':'#f2913a'); rect(x+1,y+1,2,2,'#c9461f');}
      for(let x=TL;x<TR;x++)if(((x+k*3+t)%5)==0)px(x,y-1,'#1b1a19');}
    for(let x=TL+10;x<TR-10;x++){const h=(Math.sin(x*.4+t*.6)+1)*3+n*.4;for(let k=0;k<h;k++)px(x,towTop-15-k,k<2?'#f2913a':'#2a2624');}
  }
}

// =====================================================================================================
// ===== White House screen (phase 1–2) =====
// how well the building works: deputies' loyalty (weighted by size) x how many are in the building
const deputies=S=>FACTIONS.filter(f=>f.kind==='dep').reduce((a,f)=>a+S.fac[f.id].n,0);
function whQ(S){const tot=deputies(S); if(!tot)return 0; let q=0; for(const F of FACTIONS)if(F.kind==='dep')q+=S.fac[F.id].n*LOY[loyLvl(S.fac[F.id].loy)].q;
  return q/tot*Math.min(1,tot/200)*Math.max(0,1-S.away/tot);}
const whYield=S=>{const q=whQ(S); return {q,leg:Math.round(q*2),med:Math.round(q*3),hope:Math.round(q*1.5),sup:+(q*.5).toFixed(1)};};
// in the assault: officers run the HQ, RNE holds entrance 20, deputies carry the wounded
function roomQ(S,room){const a=id=>S.fac[id].n>0?LOY[loyLvl(S.fac[id].loy)].q*Math.min(1,S.fac[id].n/30):0;
  return room==='hq'?a('so'):room==='entr'?a('rne'):whQ(S)*.8;}
function renderWH(){
  renderHud('w');
  drawSection($('w-c'),{fac:S.fac,cordon:S.cordon,calm:S.phase===1,lit:!S.flags.noPower,st:{hope:S.hope,rad:S.rad,ppl:S.ppl,dep:deputies(S),radio:S.flags.radio}});
  const tot=deputies(S);
  $('w-status').innerHTML=S.phase===1?`Light, water, comms: yes<br>Deputies in the building: ${tot}${S.away?' · away on trips: '+S.away:''}`
    :`Light: ${S.flags.noPower?'<b>no</b> (Resolve −2 per night)':S.flags.gen?'<i>generator</i>':'yes'} · Comms: ${S.flags.noComms?'<b>no</b>':S.flags.radio?'<i>radio</i>':'yes'}<br>Deputies in the building: ${tot}${S.away?' · away on trips: '+S.away:''}`;
  {const y=whYield(S); $('w-status').innerHTML+=`<br>Soviet work ${Math.round(y.q*100)}% · per night: Legitimacy +${y.leg}, Airtime +${y.med}, Resolve +${y.hope}`;}
  $('w-sec').querySelectorAll('.room,.fl2').forEach(e=>e.remove());
  // meters
  seg('w-hope',S.hope);seg('w-rad',S.rad);$('w-mh').textContent=S.hope+'%';$('w-mr').textContent=S.rad+'%';
  const bar=(cls,v)=>`<div class="b ${cls}">${Array.from({length:10},(_,i)=>`<i class="${i<v?'on':''}"></i>`).join('')}</div>`;
  {
    // ---- factions mode ----
    $('w-h2').innerHTML=`FACTIONS IN THE BUILDING <span>deputies: ${tot} · quorum ${QUORUM}</span>`;
    $('w-hdr').innerHTML=`<span></span><span>Group</span><span style="text-align:right">in bldg</span><span>Loyalty</span><span></span>`;
    {const F=FACTIONS.find(x=>x.id===S.selFac),h=document.querySelector('#s-wh .hint'); if(h)h.innerHTML=F&&FAC_PRESS[F.id]&&S.fac[F.id].n>0?F.nm.replace(/"/g,'')+' readers: '+FAC_PRESS[F.id].map(id=>{const o=OUTLETS.find(x=>x.id===id),st=outSt(S,o);return `<span style="color:${st==='vs'?'var(--ok)':st==='kr'?'#7fa0cf':'var(--dim)'}">${o.nm.replace(/[«»]/g,'')} ${st==='vs'?'↑':st==='kr'?'↓':'·'}</span>`;}).join(', ')+'. Their own outlets pull loyalty up, Kremlin outlets pull it down.':'The more loyal the deputies and the more of them are in the building, the better the Soviet works';}
    $('w-rows').innerHTML=FACTIONS.map(F=>{const f=S.fac[F.id];
      const sub0=(f.n<=0?'not in the building':F.kind==='arm'?'outside the Congress':'')+(f.tr&&f.n>0?(f.tr.d>0?' <span style="color:var(--ok)">↑</span>':' <span style="color:#e0866a">↓</span>'):'')+(b=>!b?'':b.on>0?' · <span style="color:var(--ok)">bonus active</span>':b.on<0?' · <span style="color:#e0866a">harmful</span>':' · bonus off')(facBonus(S,F));
      const sub=sub0.replace(/^ · /,'');
      return `<div class="row${f.loy<=3&&f.n>0?' warn':''}${F.kind==='arm'&&f.n>0?' hot':''}${S.selFac===F.id?' selr':''}${f.n<=0?' gone':''}" data-f="${F.id}"><span class="sw" style="background:${F.c}"></span><span class="nm">${F.nm}<small>${sub}</small></span><span class="ct">${Math.max(0,f.n)}</span>${(L=>`<div class="b l5">${Array.from({length:5},(_,i)=>`<i style="${i<=L?'background:'+LOY[L].c:''}"></i>`).join('')}</div><span class="lv" style="color:${LOY[L].c}">${LOY[L].nm}</span>`)(loyLvl(f.loy))}</div>`;}).join('');
    $('w-rows').querySelectorAll('.row').forEach(e=>e.onclick=()=>{S.selFac=e.dataset.f;renderWH();firstLook('f',e.dataset.f);});
    const F=FACTIONS.find(x=>x.id===S.selFac)||FACTIONS[0]; S.selFac=F.id; const f=S.fac[F.id]; 
    const acts=facActs(F.id).map((a,i)=>{const st=facActState(F.id,i);
      return `<div class="act${st!==true?' off':''}" data-i="${i}"><span class="k">${i+1}</span><span class="t">${a.t}</span><span class="cost">${st===true?fxText(a.fx(F),F.id):`<span class="risk">${st}</span>`}</span></div>`;}).join('');
    const W=PEOPLE[FAC_WHO[F.id]];
    $('w-det').innerHTML=`<div class="who">${faceHTML(FAC_WHO[F.id],'big')}<div><h3><span class="sw" style="background:${F.c}"></span>${F.nm}</h3><div class="own"><b class="wn">${W.nm}</b>, ${W.role}</div></div></div>
      ${f.n<=0?'<div class="own">The faction is not in the building.</div>':''}
      ${f.n>0&&F.id!=='rne'?`<div class="own">Now <b style="color:${LOY[loyLvl(f.loy)].c}">${LOY[loyLvl(f.loy)].nm}</b>: ${LOY[loyLvl(f.loy)].d}.${f.tr?` Per night <b style="color:${f.tr.d>0?'var(--ok)':'#e0866a'}">${f.tr.d>0?'↑':'↓'}</b>: ${f.tr.why}.`:''}</div>`:''}
      ${(b=>b&&F.id!=='rne'?`<div class="own">Gives now, ${b.t}: <b style="color:${b.on>0?'var(--ok)':b.on<0?'#e0866a':'var(--dim)'}">${fxText(b.fx).replace(/<[^>]+>/g,'')} per night</b> ${b.on>0?'':b.on<0?'("unreliable" and below: harmful)':'(off: needs "loyal")'}</div>`:'')(facBonus(S,F))}
      ${F.id==='rne'&&f.n>0?(b=>`<div class="own" style="flex:none"><span class="p">Strength:</span> ${f.n} fighters, in defence like ${f.n*3}. <span class="n">Cost:</span> stigma ${b}/3, at night Moscow −${Math.min(3,b+1)}${b>=1?', Legitimacy −'+(b>=2?2:1):''}, moderates leave.</div>`)(S.flags.brand||0):''}
      <div class="acts">${acts}</div>`;
    $('w-det').querySelectorAll('.act').forEach(e=>e.onclick=()=>doFacAct(F.id,+e.dataset.i)); drawFaces($('w-det'));
  }
  $('w-orders').textContent='orders: '+S.orders;
}
const FACTION_ACTS=[
  {t:'Talks with the leaders',  fx:F=>({fac:{[F.id]:{loy:2}}})},
  {t:'Call for order',     fx:F=>({rad:-3,fac:{[F.id]:{loy:-1}}})},
];
const RNE_OUT={t:'Remove from the building', fx:F=>({city:4,leg:3,hope:-4,rad:-5}), run:()=>{S.fac.rne.n=0;S.flags.rneOut=1;S.flags.brand=Math.max(0,(S.flags.brand||0)-1);}};
const facActs=fid=>fid==='rne'?[FACTION_ACTS[0],RNE_OUT]:FACTION_ACTS;
function facActState(fid,i){const f=S.fac[fid]; if(f.n<=0)return 'not in the building'; if(S.used['f'+fid+i])return 'already today'; if(!S.orders)return 'no orders until morning'; return true;}
function doFacAct(fid,i){if(facActState(fid,i)!==true)return; const a=facActs(fid)[i]; apply(a.fx(FACTIONS.find(F=>F.id===fid))); if(a.run)a.run();
  S.orders--;S.used['f'+fid+i]=1; log(FACTIONS.find(F=>F.id===fid).nm+': '+a.t.toLowerCase()+'.'); save(); renderWH();}

// =====================================================================================================
// ===== the assault: a separate level, two hours per turn from 07:00 to 17:00 =====
function unitStance(u){if(u.src==='alpha')return S.A&&S.A.alpha||'wait'; if(u.id==='omon'){const o=S.omon==null?100:S.omon;return o<=60?'waver':'attack';}const v=S.pts[u.src]; if(u.src==='mvd')return v>=50?'refuse':v>=30?'waver':'attack'; return v>=65?'refuse':v>=45?'waver':'attack';}
const STANCE_NM={attack:'advancing',waver:'wavering',halt:'halted',refuse:'refused',wait:'in reserve',stopped:'withdrawn'};
// дух части решает, идёт ли она в бой: от 50 наступает, 25–49 колеблется (идёт вполсилы), ниже 25 стоит. Ельцин звонками тянет дух вверх, вы — вниз
const MOR_GO=50, MOR_HALT=25;
const uMorV=u=>u.mor==null?80:u.mor;
const uEff=u=>u.cur<=3?0:u.cur*(uMorV(u)>=MOR_GO?1:uMorV(u)>=MOR_HALT?.55:0);
function uState(u){const A=S.A; if(u.id==='alpha'&&A.alpha!=='attack')return A.alpha==='wait'?'wait':'refuse'; if(u.cur<=3)return u.halt?'halt':u.st==='refuse'?'refuse':'stopped'; const m=uMorV(u); return m>=MOR_GO?'attack':m>=MOR_HALT?'waver':'halt';}
const kDead=A=>A.units.reduce((a,u)=>a+(u.lost||0),0);
function startAssault(){
  S.phase=3; S.queue=[]; stat('assault',1);
  const A=S.A={r:0,shares:{entr:40,front:40,tower:20},ctl:{entr:100,front:100},fire:0,wnd:0,stock:Math.round(S.sup*2),ammo:Math.round(S.gun),airUsed:0,air:clamp(Math.round(S.med*.5+S.city*.2+(S.pts.ost>=100?15:0)),0,100),inc:{},incoming:0,orders:2,used:{},once:{},log:[],alpha:'wait'};
  A.units=UNITS.map(u=>{const st=unitStance(u);return {id:u.id,cur:st==='refuse'?0:st==='waver'?u.str*.9:u.src==='alpha'?0:u.str,st,mor:u.src==='alpha'?95:st==='waver'?44:85,lost:0,dead:0};});
  const ground=A.units.filter(u=>['taman','vv','omon'].includes(u.id));
  const refused=A.units.filter(u=>u.st==='refuse').map(u=>UNITS.find(x=>x.id===u.id).nm);
  alog(refused.length?'Refused to carry out the order: '+refused.join(', ')+'.':'All Kremlin units are carrying out the order.');
  A.lost=0; A.muster=musterRoll(A);
  // подготовка превращается в силу штурма: Легитимность, Москва, готовность ОМОНа и лояльность ведомств сбивают стартовый дух частей
  { const L=A.muster, dn=(u,d)=>{ if(u.cur>3&&u.id!=='alpha')u.mor=clamp(uMorV(u)-d,28,100); };
    const dl=S.leg>50?Math.round((S.leg-50)*.5):0; if(dl){for(const u of A.units)dn(u,dl); L.push({g:1,t:'Legitimacy '+S.leg+': Kremlin units advance reluctantly, morale of all −'+dl});}
    const om=A.units.find(u=>u.id==='omon'), rd=S.omon==null?100:S.omon, do1=Math.round((100-rd)*.5)+(S.city>60?Math.round((S.city-60)*.3):0); if(do1&&om.cur>3){dn(om,do1); L.push({g:1,t:'OMON is not eager to fight (readiness '+rd+'%, Moscow '+S.city+'%): its morale −'+do1});}
    for(const u of A.units){const U=UNITS.find(x=>x.id===u.id); if(U.src==='alpha'||u.cur<=3)continue; const v=S.pts[U.src], d=v>30?Math.round((v-30)*.3):0; if(d)dn(u,d);}
    if(S.flags.corner){A.noRes=1; for(const u of A.units)dn(u,10); L.push({g:1,t:'The Kremlin is cornered: the order was given in haste, there will be no reserves, morale of all −10'});} }
  save(); show('assault'); renderAssault(); musterCard();
}
// ---------- the last night: everyone you dealt with shows up, or does not. Like a final battle, every earlier choice counts ----------
function musterRoll(A){const L=[], add=(g,t)=>L.push({g,t}), lv=id=>S.fac[id].n>0?loyLvl(S.fac[id].loy):-1, hp=d=>{S.hope=clamp(S.hope+d,0,100);};
  const mul=(id,k)=>{const u=A.units.find(x=>x.id===id); if(u)u.cur*=k;};
  // фракции внутри
  let l=lv('kr'); if(l>=3){S.ppl+=400;add(1,'Communists brought the factory squads: People +400');} else if(l>=0&&l<=1){const n=S.fac.kr.n;S.fac.kr.n=0;hp(-3);add(0,'The Communists left at night, all '+n+': Resolve −3');}
  l=lv('ros'); if(l>=3){hp(6);add(1,'‘Russia’ holds the meeting hall: Resolve +6');} else if(l>=0&&l<=1){S.fac.ros.n=0;hp(-2);add(0,'‘Russia’ left the building before dawn: Resolve −2');}
  l=lv('agr'); if(l>=3){A.stock+=4;A.medK=.8;add(1,'The Agrarians set up a kitchen and a field hospital: Supplies +4, 20% fewer losses');} else if(l>=0&&l<=1){S.fac.agr.n=0;add(0,'The Agrarians went back to their regions');}
  l=lv('otc'); if(l>=3){A.gsB=.2;mul('taman',.9);add(1,'‘Fatherland’ knows the frequencies and names of the commanders: a call to the General Staff is more reliable, motor rifles −10%');}
    else if(l>=0&&l<=1){A.leak=1;S.fac.otc.n=0;add(0,'Deputies of ‘Fatherland’ left and told the General Staff who commanded what: assault +12%, the tower covers half as well');}
  l=lv('sm'); if(l>=3){A.air=Math.min(100,A.air+15);add(1,'‘Smena’ takes foreign press around the floors: Airtime +15');} else if(l>=0&&l<=1){A.air=Math.max(0,A.air-15);hp(-4);S.fac.sm.n=0;add(0,'‘Smena’ came out to the cameras with a white flag: Airtime −15, Resolve −4');}
  l=lv('kol'); if(l>=3){hp(3);add(1,'The Waverers stayed. Quorum in the hall: Resolve +3');} else if(l>=0&&l<=1){A.ctl.entr-=10;A.ctl.front-=10;S.fac.kol.n=0;add(0,'The Waverers went out through the cordon and showed where the posts stood: both entrances −10');}
  l=lv('rne'); if(l>=3){A.ctl.entr=Math.min(100,A.ctl.entr+10);add(1,'RNE holds the twentieth entrance: weak entrance +10');} else if(l>=0&&l<=1){const g=Math.min(100,freeGuns(S));S.gun-=g;A.ammo=Math.max(0,A.ammo-g);S.fac.rne.n=0;S.flags.rneLeft=1;add(0,'Barkashov\'s men left through the sewer and took the guns: Weapons −'+g);}
  l=lv('so'); if(l>=3)add(1,'The ‘Officers’ Union’ took over the defence HQ: all sectors hold better'); else if(l>=0&&l<=1){A.air=Math.max(0,A.air-10);S.rad=clamp(S.rad+5,0,100);add(0,'Terekhov\'s officers fight on their own: Airtime −10, Radicalism +5');}
  // силы снаружи
  for(const [id,nm] of [['mo','Defence Ministry'],['gs','General Staff'],['mvd','Interior Min.']]){const v=S.pts[id],hi=id==='mvd'?50:65,lo=id==='mvd'?30:45; add(v>=lo?1:0,nm+' ('+v+'% for you, refusal of '+hi+'): '+(v>=hi?'units refused to carry out the order':v>=lo?'units hesitate and advance at half strength':'units are carrying out the order'));}
  {const o=S.omon==null?100:S.omon; add(o<=60?1:0,'OMON: '+(o<=60?'hesitates and advances at half strength':'is carrying out the order')+' (readiness '+o+'%)');}
  if(S.pts.mer>=60){A.medK=(A.medK||1)*.85;add(1,'City Hall did not recall the ambulances: 15% fewer losses');} else if(S.pts.mer<25&&S.bar>0){S.bar--;add(0,'City Hall supplied bulldozers: one row of barricades cleared before dawn');}
  if(S.pts.smo>=60){A.incoming+=500;add(1,'A column is coming from Smolenskaya: in an hour +500 people');}
  if(S.city>=60){A.incoming+=600;add(1,'Moscow is with you: in an hour 600 more people at the walls');} else if(S.city<=25){const d=Math.round(S.ppl*.15);S.ppl-=d;add(0,'Moscow watches the assault on television: '+fmt(d)+' people left the walls at night');}
  // пресса
  for(const o of OUTLETS){const st=outSt(S,o), f=o.fin&&o.fin[st]; if(!f||!f.t)continue; const x=f.fx;
    if(x.air)A.air=clamp(A.air+x.air,0,100); if(x.hope)hp(x.hope); if(x.inc)A.incoming+=x.inc; if(x.ppl)S.ppl=Math.max(0,S.ppl+x.ppl); if(x.mil){S.mil+=x.mil;S.gun+=x.mil;}
    if(x.ctl){A.ctl.entr+=x.ctl;A.ctl.front+=x.ctl;} if(x.all)for(const u of A.units)u.cur*=x.all; if(x.u)for(const k in x.u)mul(k,x.u[k]);
    add(st==='vs'?1:0,f.t);}
  if((S.flags.brand||0)>=2){A.air=Math.max(0,A.air-12);add(0,'Stigma of ‘fascists in parliament’: the West looks away. Airtime −12');}
  // что вы успели сделать
  if(S.flags.tunnel){A.tunnel=1;add(1,'The sewers have been scouted: wounded carried out underground, twice as many per hour');}
  if(S.flags.noComms)add(0,'No communications: nobody to call, airtime costs twice as much');
  if(S.flags.noPower){hp(-3);add(0,'The building has no light: Resolve −3');} else if(S.flags.gen)add(1,'Generators running: light and radio available');
  if(S.bar>=4)add(1,'Barricades in '+S.bar+' rows: the entrances hold longer');
  if(deputies(S)<QUORUM){hp(-4);add(0,'No quorum: in the hall '+deputies(S)+' deputies. Resolve −4');}
  A.ctl.entr=clamp(A.ctl.entr,20,100);A.ctl.front=clamp(A.ctl.front,20,100);
  return L;}
function musterCard(){const A=S.A; A.card='muster'; save(); Sfx.play('engine');
  const col=g=>A.muster.filter(m=>m.g===g).map(m=>`<div class="ml ${g?'p':'n'}">${g?'+':'−'} ${m.t}</div>`).join('')||'<div class="ml">nobody</div>';
  $('modal-win').innerHTML=`<h2>LAST NIGHT: WHO IS WITH YOU</h2><div class="sub">Everything you did for two weeks has either reached the walls or not. Factions, security forces, the press and your decisions.</div>
   <div class="mus"><div><h3>FOR YOU</h3>${col(1)}</div><div><h3>AGAINST YOU</h3>${col(0)}</div></div><div class="close">ENTER — to battle</div>`;
  $('modal').classList.add('on'); $('modal-win').querySelector('.close').onclick=musterClose;}
function musterClose(){const A=S.A; if(!A||A.card!=='muster')return; Sfx.play('boom'); A.card=0; $('modal').classList.remove('on'); save(); renderAssault(); if(A.allRef&&A.alpha==='wait'){alog('The army, the Interior Troops and OMON did not go into the building. Only the special forces are left to the Kremlin.');return alphaCard();} incidentCard();}
function alog(t,cls){S.A.log.unshift({t,cls:cls||'',h:HOURS[Math.min(S.A.r,HOURS.length-1)]});S.A.log.length=Math.min(S.A.log.length,12);}
function defForce(){const r=S.fac.rne.n,s=S.fac.so.n;return S.mil+3*r+1.5*s+.05*S.ppl;}
// the tower: snipers and spotters on the upper floors blunt the push on both doors
const towerCut=A=>Math.min(.3,A.shares.tower/100*.9)*(A.leak?.5:1);
function assaultSector(id){const A=S.A, F=defForce(), m=.5+S.hope/100, hq=1+.15*roomQ(S,'hq');
  let D=A.shares[id]/100*F/18*m*hq*(A.ammo<=0?.6:1);
  if(id==='entr')D*=1+S.bar*.1+.2*roomQ(S,'entr'); else if(id==='front')D*=1+S.bar*.05;
  const att=A.units.filter(u=>UNITS.find(x=>x.id===u.id).target===id);
  const snipe=1-towerCut(A);
  const Araw=att.reduce((a,u)=>a+uEff(u),0)*snipe*(1-A.air/450)*(A.leak?1.12:1);
  return {D,A:Araw,att};}
function nextHour(){
  const A=S.A; if(!A||screen!=='assault')return;
  if(A.units.find(u=>u.id==='tanks').cur>0){Sfx.play('boom');Sfx.play('boom',1.3);} Sfx.play('burst',.6); Sfx.play('shots',2); if(A.fire>=3)Sfx.play('fire',2.4);
  if(A.incoming){S.ppl+=A.incoming;alog('Muscovites broke through to the White House: +'+fmt(A.incoming)+'.');A.incoming=0;}
  const medB=1-.2*roomQ(S,'med');
  for(const u of A.units){u.mor0=uMorV(u);u.why='';}
  A.last={}; let lostHour=0;
  for(const s of ['entr','front']){const {D,A:a,att}=assaultSector(s);const Ar=a*(.85+Math.random()*.3);
    if(Ar>D){A.ctl[s]=Math.max(0,A.ctl[s]-(Ar-D)*.75);}else A.ctl[s]=Math.min(100,A.ctl[s]+(D-Ar)*.5);
    // свои потери: держать вход тоже стоит людей, чем гуще оборона в проёме, тем больше ложится
    const lost=Math.round(Ar*2.6*medB*(A.medK||1)*(.85+.15*Math.min(3,D/Math.max(Ar,1)))); lostHour+=lost; A.lost=(A.lost||0)+lost; A.wnd+=Math.round(lost*.4); const fromMil=Math.min(S.mil,Math.round(lost*.7)); S.mil-=fromMil; S.ppl=Math.max(0,S.ppl-(lost-fromMil));
    // потери штурмующих растут с числом защитников; бьют по духу, а потеряв половину, часть выводят совсем
    const on=att.filter(u=>uEff(u)>0), tot=on.reduce((x,u)=>x+uEff(u),0)||1; let kl=0;
    for(const u of on){const U=UNITS.find(x=>x.id===u.id); const dl=Math.min(u.cur*.3,D*.13*uEff(u)/tot); u.cur=Math.max(0,u.cur-dl); u.dead=(u.dead||0)+dl; const k=Math.round(dl*9); u.lost=(u.lost||0)+k; kl+=k;
      uMor(u,-(dl*1.0)-(Ar<=D?2:-2)); u.why=Ar<=D?'repulsed':'losses';
      if(u.dead>=U.str*.6&&u.cur>3){u.cur=0;u.st='stopped';u.why='bled dry';alog(U.nm+': lost more than half of their strength, part withdrawn from the building.');aBanner(U.nm.toUpperCase()+': WITHDRAWN FROM THE FIGHT','Lost more than half their strength ('+fmt(u.lost)+'). The command pulled part of them back from the building.',true);}}
    A.last[s]={D:Math.round(D),A:Math.round(Ar),lost,kl};
    const nm=SECTORS.find(x=>x.id===s).nm;
    if(Ar>0)alog(`${nm}: ${Ar>D?'pressing':'holding'}. Our losses ${fmt(lost)}, theirs ${fmt(kl)}.`,Ar>D?'bad':'');}
  const tk=A.units.find(u=>u.id==='tanks'), T=uEff(tk);
  if(T>0){const hl=Math.round(T/6+A.fire/5);S.hope=clamp(S.hope-hl,0,100);A.fire=Math.min(15,A.fire+T/20);
    const tl=Math.round(A.shares.tower/100*defForce()*.04*T/30);S.mil=Math.max(0,S.mil-tl);
    alog(`Tanks hit the tower. Floors are burning. Resolve −${hl}.`,'bad');}
  else if(A.fire>0){const hl=Math.round(A.fire/5);A.fire=Math.min(15,A.fire+.5);if(hl){S.hope=clamp(S.hope-hl,0,100);alog(`Fire is spreading through the floors. Resolve −${hl}.`,'bad');}}
  // wounded: the med post treats some; the rest lie in corridors and break morale
  const tr=Math.min(A.wnd,Math.round(A.wnd*.3*roomQ(S,'med')*(A.tunnel?2:1))); A.wnd-=tr; if(A.wnd>=40){const wl=Math.min(6,Math.round(A.wnd/80));if(wl){S.hope=clamp(S.hope-wl,0,100);alog(`There is nowhere to lay the wounded: ${fmt(A.wnd)}. Resolve −${wl}.`,'bad');}}
  // live air: while the world is watching, wavering units look for a reason to stop
  // камеры: эфир точит дух каждый час, а бойня под камерами точит вдвойне
  {const bl=A.air>=40?Math.min(5,lostHour/50):0; for(const u of A.units){if(u.cur<=3)continue; const d=A.air/150+(uEff(u)>0?bl:0)+(A.air>=60&&uState(u)==='waver'?3:0); if(d>0){uMor(u,-d); if(d>=3&&!u.why)u.why='cameras';}}}
  // танки одни не воюют: если пехота стоит, экипажи не хотят в одиночку расстреливать парламент
  if(tk.cur>3&&!A.units.some(u=>u.id!=='tanks'&&uEff(u)>0)){uMor(tk,-20);tk.why='infantry halted';}
  // большая кровь у Кремля: резервы не шлют, танкисты сникают
  if(kDead(A)>=450&&tk.cur>3){uMor(tk,-8);if(!tk.why)tk.why='assault losses';}
  for(const u of A.units){if(u.cur<=3)continue; const was=u.mor0>=MOR_GO?2:u.mor0>=MOR_HALT?1:0, m=uMorV(u), now=m>=MOR_GO?2:m>=MOR_HALT?1:0; if(now===was)continue; const nm=UNITS.find(x=>x.id===u.id).nm;
    if(now===0){u.cur=0;u.st='stopped';u.halt=1;} // встали — значит вышли из боя насовсем: вернуть часть Кремль уже не может
    const tx=now===0?'halted and go no further':now===1?(was===2?'wavered, advancing at half strength':'moved again, but at half strength'):'attacking again';
    alog(nm+': '+tx+(u.why?' ('+u.why+')':'')+'.',now>was?'bad':''); aBanner(nm.toUpperCase()+': '+(now===0?'LEFT THE FIGHT':now===1?(was===2?'WAVERING':'ADVANCING AGAIN'):'ATTACKING AGAIN'),'Morale '+Math.round(m)+'%'+(u.why?' · reason: '+u.why:'')+'. '+(now===0?'The soldiers halted and go no further. This unit will not return to the fight.':tx[0].toUpperCase()+tx.slice(1)+'.'),now<was);}
  // кровь меняет политику: каждые 500 убитых и раненых с обеих сторон — Радикализм +3, Легитимность −2
  {const bl=Math.floor(((A.lost||0)+kDead(A))/500); if(bl>(A.blood||0)){const d=bl-(A.blood||0);A.blood=bl;S.rad=clamp(S.rad+3*d,0,100);S.leg=clamp(S.leg-2*d,0,100);alog(`The toll of dead and wounded has passed ${fmt(bl*500)}. Radicalism +${3*d}, Legitimacy −${2*d}.`,'bad');}}
  A.air=clamp(A.air+airGain(),0,100); // эфир не тает: каждый час капает от своих изданий
  // ammunition: every hour of fighting eats the stock; with empty magazines the doors hold much worse
  if(A.shares.tower<10){S.hope=clamp(S.hope-2,0,100);A.fire=Math.min(15,A.fire+1);alog('The tower is empty: upper floors taken by other riflemen, no one to put out the fire. Resolve −2.','bad');}
  if(S.mil>0){const am=Math.round(S.mil/8); const had=A.ammo>0; A.ammo=Math.max(0,A.ammo-am); if(had&&A.ammo<=0)alog('Ammunition is gone. The defence holds on rifle butts and bottles.','bad');}
  // siege: after noon reserves come up to the units whose structures stayed with the Kremlin, and the House tires
  if(A.r>=5){S.hope=clamp(S.hope-1,0,100); if(A.r%2===1){ if(A.noRes)alog('No reserves: the Kremlin has no one left to send.'); else if(kDead(A)>=350)alog('No reserves: after such losses the Kremlin does not dare send new units.'); else{for(const u of A.units){const U=UNITS.find(x=>x.id===u.id); if(u.cur>3&&uEff(u)>0){u.cur=Math.min(U.str*1.2,u.cur+U.str*.15);uMor(u,8);if(!u.why)u.why='reserves';}} alog('Reserves have reached the assaulting troops. The building is being taken by attrition.','bad');} } }
  A.r++; A.orders=2; A.used={}; A.airUsed=0;
  if(A.ctl.entr<=0||A.ctl.front<=0)return finale('fell',A.ctl.entr<=0?'entr':'front');
  if(S.hope<=0)return finale('broken');
  const active=A.units.filter(u=>u.cur>=3);
  A.quiet=A.units.some(u=>uEff(u)>0)?0:(A.quiet||0)+1; // три часа подряд никто не идёт вперёд — штурм выдохся
  if(A.r>=HOURS.length||((!active.length||A.quiet>=3)&&A.alpha!=='wait'))return finale('held',A.r>=HOURS.length?'dark':'spent');
  if(A.r===4&&A.alpha==='wait')return alphaCard();
  save(); renderAssault(); incidentCard();
}
// ---------- заметные события штурма: плашка сверху, когда часть встала, ушла или вернулась ----------
let aBanQ=[],aBanBusy=0;
function aBanner(t,d,good){aBanQ.push({t,d,good}); if(!aBanBusy)aBanNext();}
function aBanNext(){const el=$('a-banner'), x=aBanQ.shift(); if(!x||screen!=='assault'||!S||!S.A||S.A.card==='fin'){aBanBusy=0;aBanQ=[];el.className='';return;} aBanBusy=1; el.innerHTML=`<b>${x.t}</b><span>${x.d}</span>`; el.className='on '+(x.good?'g':'b'); setTimeout(()=>{el.className='';setTimeout(aBanNext,350);},3200);}
// ---------- развязка: перед экраном концовки объясняем, почему штурм кончился именно сейчас и что с каждой частью ----------
function finale(id,why){const A=S.A; A.card='fin'; A.finId=id; if(why!==undefined)A.finWhy=why; else why=A.finWhy; save(); aBanQ=[]; $('a-banner').className='';
  const unitLine=u=>{const U=UNITS.find(x=>x.id===u.id), st=uState(u), m=Math.round(uMorV(u)), lost=fmt(u.lost||0);
    const t=u.id==='alpha'&&A.alpha==='wait'?['','never committed to the fight']:st==='refuse'?['p',u.id==='alpha'?'refused to storm':'refused to carry out the order, did not fight']:st==='stopped'?['p','withdrawn from the fighting'+(u.why?' ('+u.why+')':'')+(u.id==='tanks'?'':', losses '+lost)]
      :st==='halt'?['p','halted and not advancing: morale '+m+'%'+(u.id==='tanks'?'':', losses '+lost)]:st==='waver'?['','wavering: morale '+m+'%'+(u.id==='tanks'?'':', losses '+lost)]:['n',(u.id==='tanks'?'firing':'advancing')+': morale '+m+'%'+(u.id==='tanks'?'':', losses '+lost)];
    return `<div><b>${U.nm}</b><span class="${t[0]}">${t[1]}</span></div>`;};
  const going=A.units.filter(u=>uEff(u)>0&&u.id!=='tanks').map(u=>UNITS.find(x=>x.id===u.id).nm);
  const T={
    fell:['THE BUILDING IS TAKEN',`${why==='entr'?'Entrance No. 20':'Main entrance'} has fallen: no defenders are left there, the assaulters are on the floors. The units still pushing forward (${going.join(', ')||'nobody'}) entered the building. Their morale and your losses no longer stand in their way: the door is open.`],
    broken:['CEASE FIRE',`The defenders' resolve fell to zero: tank fire, fire on the floors and wounded in the corridors did their work. The entrances still held, but there was no one left to hold them. White sheets were hung from the windows.`],
    held:why==='dark'?['DARKNESS. THE ASSAULT IS HALTED',`Twelve hours of fighting, and the building is not taken. In the dark the Kremlin did not dare to go on: ${going.length?'units that were still advancing ('+going.join(', ')+'), were ordered to pull back from the walls. You did not beat them, you outlasted them.':'there was no one left to advance.'}`]
      :['THE ASSAULT HAS RUN OUT OF STEAM',`${A.units.some(u=>u.cur>3)?'For three hours in a row not one unit advanced':'No unit able to advance is left at the walls'}. The commanders report to the Kremlin that the men will not get up. The shooting died down on its own.`]}[id];
  $('modal-win').innerHTML=`<h2>${T[0]}</h2><div class="sub">${HOURS[Math.min(A.r,HOURS.length-1)]}, behind ${Math.min(A.r,HOURS.length)} h of fighting out of ${HOURS.length}. ${T[1]}</div>
   <div class="finl">${A.units.map(unitLine).join('')}<div><b>Your losses</b><span>${fmt(A.lost||0)} killed and wounded · entrances: entrance ${Math.round(A.ctl.entr)}%, main ${Math.round(A.ctl.front)}% · Resolve ${S.hope}%</span></div></div><div class="close">ENTER — what happened next</div>`;
  $('modal').classList.add('on'); $('modal-win').querySelector('.close').onclick=finaleGo; renderAssaultSafe();}
function renderAssaultSafe(){try{renderAssault();}catch(e){}}
function finaleGo(){const A=S.A; if(!A||A.card!=='fin')return; A.card=0; $('modal').classList.remove('on'); ending(A.finId);}
function alphaCard(){
  const A=S.A;
  const DS=[[S.leg>=50,'Legitimacy from 50 (now '+S.leg+')'],[A.air>=40,'Airtime from 40 (now '+Math.round(A.air)+')']], draw=DS.every(x=>x[0]);
  $('modal-win').innerHTML=`<h2>"ALPHA" AT THE ENTRANCE</h2><div class="sub">${A.allRef?'Not one unit has carried out the order. The Kremlin has one last reserve: \'Alpha\' and \'Vympel\'.':'Four hours of assault and the building is not taken. The Kremlin throws in its last reserve: \'Alpha\' and \'Vympel\'.'} Their officers do not want to fire on parliament and propose to lead people out under their own guarantee. How it ends depends on whether the country is watching them.</div>`+
    [{t:'Let Alpha in and leave under its guarantee',d:draw?'<span class="p">Neutral outcome:</span> Alpha refuses to storm in front of the cameras. You lose the building, but Yeltsin can no longer command.':'<span class="n">Defeat:</span> a quiet surrender. To make it neutral, you need '+DS.filter(x=>!x[0]).map(x=>x[1]).join(' and ')+'.'},
     {t:'Appeal to the officers by radio',d:S.A.air>=10?`Airtime −10 · ${Math.round((.25+S.leg/250)*100)}% chance that Alpha refuses to storm and withdraws. ${S.A.allRef?'Then there will be no one left to storm':'The fight with the rest goes on'}`:'<span class="n">needs 10 Airtime</span>'},
     {t:'Fight',d:'Alpha will storm entrance No. 20. This is the Kremlin\'s strongest unit.'}]
    .map((c,i)=>`<div class="law" data-i="${i}"><div class="t">${i+1}. ${c.t}</div><div class="d">${c.d}</div></div>`).join('');
  $('modal').classList.add('on'); A.card=1;
  $('modal-win').querySelectorAll('.law').forEach(e=>e.onclick=()=>alphaChoose(+e.dataset.i));
}
function alphaChoose(i){const A=S.A; const u=A.units.find(x=>x.id==='alpha'), base=UNITS.find(x=>x.id==='alpha').str;
  if(i===1&&S.A.air<10)return;
  A.card=0; closeModal();
  if(i===0){S.chron.push({date:dateStr(S.day),h:'ALPHA',ch:'talks'});return ending(S.leg>=50&&A.air>=40?'draw_alpha':'surrender_alpha');}
  if(i===1){S.A.air-=10; u.mor=90; if(Math.random()<.25+S.leg/250){A.alpha='refuse';u.cur=0;alog('Alpha refused to storm parliament.');aBanner('ALPHA REFUSED','The officers heard you over the radio and did not go to storm. The fight with the other units goes on.',true);}
    else{A.alpha='attack';u.cur=base;alog('The officers of "Alpha" refused to listen. Storm of the entrance.','bad');}}
  if(i===2){A.alpha='attack';u.cur=base;alog('"Alpha" storms entrance No. 20.','bad');}
  S.chron.push({date:dateStr(S.day),h:'ALPHA',ch:['talks','radio appeal','fight'][i]});
  save(); renderAssault();
}
// ---------- incidents: one per hour, something happens and has to be balanced against the rest ----------
const uMor=(u,d)=>{u.mor=clamp((u.mor==null?80:u.mor)+d,0,100);};
const uOn=(A,id)=>uEff(A.units.find(u=>u.id===id))>0;
function uMul(A,id,k,force){const u=A.units.find(x=>x.id===id),U=UNITS.find(x=>x.id===id); if(u.cur<=3)return; u.cur=Math.min(U.str*1.5,u.cur*k);}
function uStop(A,id,why){const u=A.units.find(x=>x.id===id); u.cur=0;u.st='stopped';alog(UNITS.find(x=>x.id===id).nm+': '+why+'.');}
function uBack(A,k){const u=A.units.find(u=>(u.st==='refuse'||u.st==='stopped')&&u.id!=='alpha'); if(!u)return; const U=UNITS.find(x=>x.id===u.id); u.cur=U.str*k;u.st='attack';u.mor=Math.max(uMorV(u),60);u.dead=0;alog(U.nm+': back in formation.','bad');}
const yCallUnit=A=>A.units.filter(u=>u.cur>3&&!u.called&&uMorV(u)<MOR_GO&&!(u.id==='alpha'&&A.alpha!=='attack')).sort((x,y)=>UNITS.find(q=>q.id===y.id).str-UNITS.find(q=>q.id===x.id).str)[0];
const yCallLoy=u=>{const U=UNITS.find(x=>x.id===u.id);return U.src==='alpha'?40:u.id==='omon'?100-(S.omon==null?100:S.omon):S.pts[U.src];};
const yCallGain=A=>Math.max(10,Math.round(40-yCallLoy(yCallUnit(A))/3)); // чем лояльнее вам структура, тем слабее действует звонок
const yCallTalk=A=>clamp(.15+yCallLoy(yCallUnit(A))/200+S.leg/400,.1,.7);
const gsChance=k=>clamp(S.pts.gs/130+(S.A.gsB||0)+(k||0),.05,.75);
const INCIDENTS=[
  // звонок в Генштаб: открывается приказом, не случайно. Генштабу подчинены только мотострелки; ВВ и ОМОН — это МВД, танки — Минобороны
  {id:'gs_call', who:'kolesn', cond:A=>false, h:'CALL TO THE GENERAL STAFF', p:()=>{const u=S.A.units.find(x=>x.id==='taman');return `The deputy-generals got through to the Chief of the General Staff. Kolesnikov listens in silence. His motor rifles are now at the main entrance: morale ${Math.round(uMorV(u))}%, losses ${fmt(u.lost||0)}. The General Staff is for you at ${S.pts.gs}%. The Interior Troops and OMON do not answer to him, nor the tanks: only the Taman Division can be discussed.`;},
   ch:[{t:'Ask to withdraw the division from the building',d:()=>'chance '+Math.round(gsChance()*100)+'%: the motor rifles leave altogether. Otherwise he reports to the Kremlin: their morale +10',run:A=>{const u=A.units.find(x=>x.id==='taman'); if(Math.random()<gsChance()){u.cur=0;u.st='stopped';u.why='the General Staff withdrew';alog('Motor rifles: the General Staff has withdrawn the division from the building.');aBanner('MOTOR RIFLES: WITHDRAWN','Kolesnikov ordered the Taman Division to pull back from the White House.',true);}else{u.mor0=uMorV(u);uMor(u,10);u.why='the call failed';alog('Kolesnikov listened and hung up. A minute later the Kremlin knew about the call.','bad');aBanner('THE GENERAL STAFF REFUSED','Kolesnikov reported the call to the Kremlin. Morale of the motor rifles +10.',false);}}},
       {t:'Ask not to hurry: let the companies lie down and wait',d:()=>'for sure: morale of the motor rifles −15',rq:'General Staff 30',req:()=>S.pts.gs>=30,run:A=>{const u=A.units.find(x=>x.id==='taman');u.mor0=uMorV(u);uMor(u,-15);u.why='The General Staff is stalling';alog('The General Staff did not cancel the order, but did not hurry it either. The motor rifles lay down.');}},
       {t:'Read out the Congress\'s resolution: the order is criminal, he will answer personally',d:()=>'chance '+Math.round(gsChance(.2)*100)+'%: the motor rifles leave. Otherwise Legitimacy −3 and their morale +10',rq:'Legitimacy 60',req:()=>S.leg>=60,run:A=>{const u=A.units.find(x=>x.id==='taman'); if(Math.random()<gsChance(.2)){u.cur=0;u.st='stopped';u.why='the General Staff withdrew';alog('Motor rifles: Kolesnikov did not want to answer for the assault. The division was withdrawn.');aBanner('MOTOR RIFLES: WITHDRAWN','Kolesnikov did not want to answer for the assault personally.',true);}else{u.mor0=uMorV(u);uMor(u,10);u.why='the call failed';S.leg=clamp(S.leg-3,0,100);alog('Kolesnikov replied that he had sworn an oath to the president. The recording of the conversation was passed to Kremlin journalists.','bad');}}}]},
  {id:'y_addr', cond:A=>A.r>=1, h:'YELTSIN\'S ADDRESS', p:'At nine in the morning the president goes on air: "The armed mutiny in Moscow will be suppressed. Those who went against a peaceful city will get what they deserve." The soldiers listen on their radios.',
   ch:[{t:'Don\'t respond',d:'morale of all units +8 · Resolve −3',run:A=>{for(const u of A.units)uMor(u,8);S.hope=clamp(S.hope-3,0,100);}},
       {t:'Answer live: deputies are in the hall, they are shooting at them',d:'Airtime −8 · units\' morale −6',rq:'Airtime 30',req:()=>S.A.air>=30&&S.A.air>=8,run:A=>{S.A.air-=8;for(const u of A.units)uMor(u,-6);}},
       {t:'Play his speech on the floors: let them hear what they have been promised',d:'Resolve +4 · Radicalism +4',run:A=>{S.hope=clamp(S.hope+4,0,100);S.rad=clamp(S.rad+4,0,100);}}]},
  // тяни-толкай: когда часть встала или заколебалась, Ельцин один раз лично звонит её командиру. Вернуть каждую часть он может только однажды
  {id:'y_call', multi:1, prio:1, cond:A=>A.r>=1&&!!yCallUnit(A), h:'CALL FROM THE KREMLIN', p:()=>{const u=yCallUnit(S.A),U=UNITS.find(x=>x.id===u.id);return `${U.nm}: morale ${Math.round(uMorV(u))}%, the unit is wavering and advancing at half strength. Yeltsin calls the commander personally: "Do you understand what refusal will cost you? Forward." He can encourage only those still fighting, and only once. If a unit stands, no one will bring it back.`;},
   ch:[{t:'Stay out of it',d:()=>'unit morale +'+yCallGain(S.A),run:A=>{const u=yCallUnit(A),g=yCallGain(A);u.called=1;u.mor0=uMorV(u);uMor(u,g);u.why='Yeltsin\'s call';}},
       {t:'Get on their frequency: "Commander, the order is criminal, you will answer for it"',d:()=>'Airtime −10 · unit morale only +'+Math.round(yCallGain(S.A)/3),rq:'Airtime 10',req:()=>S.A.air>=10,run:A=>{const u=yCallUnit(A),g=yCallGain(A);u.called=1;u.mor0=uMorV(u);A.air-=10;uMor(u,Math.round(g/3));u.why='the call was cut off';}},
       {t:'Send deputy-officers to them with a white flag',d:()=>'chance '+Math.round(yCallTalk(S.A)*100)+'%: the unit withdraws altogether. Otherwise morale +'+yCallGain(S.A)+', Resolve −3',run:A=>{const u=yCallUnit(A),U=UNITS.find(x=>x.id===u.id),g=yCallGain(A),ok=Math.random()<yCallTalk(A);u.called=1; if(ok){u.cur=0;u.st='stopped';u.why='led the unit away';alog(U.nm+': the commander listened to the deputies and led the unit away.');aBanner(U.nm.toUpperCase()+': LEFT','The commander listened to the deputies and led the unit away from the building.',true);}else{u.mor0=uMorV(u);uMor(u,g);u.why='Yeltsin\'s call';S.hope=clamp(S.hope-3,0,100);alog('The negotiators were not let near the commander.','bad');}}}]},
  {id:'y_order', cond:A=>A.r>=4&&A.units.some(u=>u.cur>3&&u.mor<=45), h:'ORDER WITH A SIGNATURE', p:'Written orders from the president with his personal signature were brought to the unit commanders. Now refusal means a court-martial, not hesitation.',
   ch:[{t:'Do nothing',d:'morale of all units +15',run:A=>{for(const u of A.units)if(u.cur>3)uMor(u,15);}},
       {t:'Remind on air: the order is illegal, the executor will answer',d:'Airtime −10 · morale +5 instead of +15',rq:'Legitimacy 50',req:()=>S.leg>=50&&S.A.air>=10,run:A=>{S.A.air-=10;for(const u of A.units)if(u.cur>3)uMor(u,5);}}]},
  // ----- части Кремля: кто отказывается, кто переходит, кого дожимают. Зависит от отношений со структурой -----
  {id:'u_tank', cond:A=>uOn(A,'tanks'), h:'THE CREW SHUT OFF THE ENGINE', p:'One of the tanks on the bridge fell silent. The crew commander asks over the open channel who will answer for the shooting at parliament and what will happen to those who refuse.',
   ch:[{t:'Keep silent',d:'tanks −10%',run:A=>uMul(A,'tanks',.9)},
       {t:'Guarantee on behalf of the Supreme Soviet: those who refuse will not be touched',d:'tanks −35%',rq:'Legitimacy 60',req:()=>S.leg>=60,run:A=>uMul(A,'tanks',.65)},
       {t:'Call them over: turn the gun',d:'a tank stands at the main entrance: entrance +15 · Radicalism +5 · Airtime −10',rq:'Defence Ministry 55',req:()=>S.pts.mo>=55,run:A=>{uMul(A,'tanks',.75);A.ctl.front=Math.min(100,A.ctl.front+15);S.rad=clamp(S.rad+5,0,100);A.air=Math.max(0,A.air-10);}}]},
  {id:'u_paid', pic:'tank', cond:A=>uOn(A,'tanks')&&S.pts.mo<50&&A.r>=1, h:'CREWS FOR MONEY', p:'The conscripts refused to fire. Volunteer officers are put into the tanks: each is promised money and a flat. The gunners are experienced.',
   ch:[{t:'Do nothing',d:'tanks +25%',run:A=>uMul(A,'tanks',1.25)},
       {t:'Name the surnames and the price on air',d:'Airtime +2 · tanks +5%',rq:'Airtime 8',req:()=>S.A.air>=8,run:A=>{S.A.air-=8;uMul(A,'tanks',1.05);A.air=Math.min(100,A.air+10);}},
       {t:'Call the division commander: take the volunteers off',d:'tanks −15%',rq:'Defence Ministry 40',req:()=>S.pts.mo>=40&&!S.flags.noComms,run:A=>uMul(A,'tanks',.85)}]},
  {id:'u_vv', cond:A=>uOn(A,'vv'), h:'THE REGIMENT WILL NOT GO', p:'The commander of an Interior Troops regiment says over the radio: his men will not fire on parliament. But he is not going to cross over either. He asks what you want from him.',
   ch:[{t:'Let him lead the men back to barracks',d:'Interior Troops −25%',run:A=>uMul(A,'vv',.75)},
       {t:'Ask him to stand in a chain between the sides',d:'Interior Troops −45% · entrance +8',rq:'Interior Ministry 45',req:()=>S.pts.mvd>=45,run:A=>{uMul(A,'vv',.55);A.ctl.entr=Math.min(100,A.ctl.entr+8);}},
       {t:'Demand they cross over with their weapons',d:'50% chance: Militia +80, Weapons +80 · otherwise the regiment is offended, Interior Troops +15%',rq:'Radicalism 50%',req:()=>S.rad>=50,run:A=>{if(Math.random()<.5){S.mil+=80;S.gun+=80;uMul(A,'vv',.7);alog('The Interior Troops regiment crossed over to the Soviet\'s side.');}else{uMul(A,'vv',1.15);alog('The regiment commander hung up. The Interior Troops advance.','bad');}}}]},
  {id:'u_omon', cond:A=>uOn(A,'omon'), h:'OMON STOPS', p:'Moscow OMON halted at the main entrance. The fighters were told the building holds only militants. The commander shouts through a megaphone: show us who you have in there.',
   ch:[{t:'Fire over their heads',d:'OMON +10% · Resolve +2',run:A=>{uMul(A,'omon',1.1);S.hope=clamp(S.hope+2,0,100);}},
       {t:'Bring deputies with ID cards out onto the steps',d:'OMON withdraws',rq:'quorum: '+QUORUM+' deputies leave',req:()=>deputies(S)>=QUORUM,run:A=>uStop(A,'omon','saw the deputies and pulled back from the building')},
       {t:'Remind them that the city hall set them up',d:'OMON −40%',rq:'City Hall 40',req:()=>S.pts.mer>=40,run:A=>uMul(A,'omon',.6)}]},
  {id:'u_general', cond:A=>A.r>=2&&A.units.some(u=>uState(u)==='waver'), h:'GENERAL ON THE BRIDGE', p:'The Kremlin sent a general with a written order and a threat of a court-martial to the wavering units. He walks along the ranks and looks the commanders in the eye.',
   ch:[{t:'Wait',d:'the wavering units attack at full strength',run:A=>{for(const u of A.units)if(uState(u)==='waver'){u.st='attack';u.mor=70;}}},
       {t:'Send deputy-generals to meet him',d:'the units stay wavering and weaken by 15%',rq:'General Staff 45',req:()=>S.pts.gs>=45,run:A=>{for(const u of A.units)if(u.st==='waver')u.cur*=.85;}},
       {t:'Show the general with the order live on air',d:'Airtime −15 · one wavering unit withdraws, the rest attack',rq:'Airtime 40',req:()=>S.A.air>=40,run:A=>{A.air-=15;const w=A.units.filter(u=>uState(u)==='waver').sort((a,b)=>b.cur-a.cur);if(w[0])uStop(A,w[0].id,'went out of the cameras\' view');for(const u of w.slice(1)){u.st='attack';u.cur=UNITS.find(x=>x.id===u.id).str;}}}]},
  {id:'u_tula', cond:A=>A.r>=5&&S.pts.gs<50, h:'PARATROOPERS FROM TULA', p:'A regiment of the Tula Division has reached Moscow. The regiment commander still has not understood for whom he was brought, and is waiting at the Ring Road.',
   ch:[{t:'Do nothing',d:'motor rifles +35%',run:A=>uMul(A,'taman',1.35,1)},
       {t:'Address him by radio',d:'Airtime −10 · 45% chance the regiment stays at the Ring Road',rq:'Airtime 10',req:()=>S.A.air>=10,run:A=>{S.A.air-=10;if(Math.random()<.45)alog('The Tula regiment stays at the Ring Road and does not enter the city.');else{uMul(A,'taman',1.35,1);alog('The paratroopers entered the city.','bad');}}},
       {t:'Block the avenue with people',d:'People −400 · motor rifles +10%',rq:'People 1500',req:()=>S.ppl>=1500,run:A=>{S.ppl-=400;uMul(A,'taman',1.1,1);}}]},
  {id:'u_column', cond:A=>A.r>=3&&S.pts.gs>=55, h:'THE COLUMN AWAITS THE WORD', p:'The commander of a unit from the Moscow suburbs calls on a secure line: he is ready to lead the column to the White House. He needs an order and a signature.',
   ch:[{t:'Refuse: the army must not fire on the army',d:'Airtime +10 · Resolve −2',run:A=>{A.air=Math.min(100,A.air+10);S.hope=clamp(S.hope-2,0,100);}},
       {t:'Let it stand at the Ring Road and wait',d:'all Kremlin units −12%',run:A=>{for(const u of A.units)u.cur*=.88;}},
       {t:'Sign the order: the column into the city',d:'Militia +150 · Weapons +150 · Resolve +6 · Radicalism +10 · Airtime −20',rq:'Radicalism 50%',req:()=>S.rad>=50,run:A=>{S.mil+=150;S.gun+=150;A.ammo+=150;S.hope=clamp(S.hope+6,0,100);S.rad=clamp(S.rad+10,0,100);A.air=Math.max(0,A.air-20);}}]},
  {id:'u_cops', cond:A=>S.pts.mvd>=50, h:'A DETACHMENT CROSSED OVER', p:'Three dozen policemen from a district precinct with service weapons came to the twentieth entrance. The senior officer says: "We swore an oath to the law."',
   ch:[{t:'Put them at the windows',d:'Militia +40 · Weapons +40',run:A=>{S.mil+=40;S.gun+=40;}},
       {t:'Let them lead the wounded and women out in uniform',d:'wounded evacuated · Airtime +10',run:A=>{A.wnd=0;A.air=Math.min(100,A.air+10);}},
       {t:'Send them back to persuade their own',d:'Interior Troops and OMON −15%',run:A=>{uMul(A,'vv',.85);uMul(A,'omon',.85);}}]},
  {id:'u_back', cond:A=>false&&A.r>=3&&A.units.some(u=>(u.st==='refuse'||u.st==='stopped')&&u.id!=='alpha'), h:'THE REFUSERS ARE BEING PRESSED', p:'The commander of the unit that refused to storm was removed. The new commander brought money and an order. The soldiers are being formed up again.',
   ch:[{t:'Do nothing',d:'unit returns at half strength',run:A=>uBack(A,.5)},
       {t:'Appeal to the soldiers: they are being deceived a second time',d:'Airtime −10 · unit returns at a quarter strength',rq:'Airtime 10',req:()=>S.A.air>=10,run:A=>{S.A.air-=10;uBack(A,.25);}},
       {t:'Declare the removed commander acting',d:'the unit stays in place',rq:'Legitimacy 65',req:()=>S.leg>=65,run:A=>alog('The soldiers listen to their former commander.')}]},
  {id:'floor', cond:A=>A.fire>=3, h:'THE TWELFTH FLOOR IS BURNING', p:'The fire is moving up the cable shafts. Above are the Congress archive and people who did not manage to get down.',
   ch:[{t:'Send people to put it out',d:'People −150 · Fire −5',run:A=>{S.ppl=Math.max(0,S.ppl-150);A.fire=Math.max(0,A.fire-5);}},
       {t:'A living chain with buckets from the river',d:'People −60 · Fire −8',rq:'People 1000',req:()=>S.ppl>=1000,run:A=>{S.ppl-=60;A.fire=Math.max(0,A.fire-8);}},
       {t:'Abandon the floor',d:'Fire +2 · Resolve −4',run:A=>{A.fire=Math.min(15,A.fire+2);S.hope=clamp(S.hope-4,0,100);}}]},
  {id:'wounded', cond:A=>A.wnd>=40, h:'THE WOUNDED IN THE TWENTIETH ENTRANCE', p:'Bandages have run out, doctors cut up sheets. Ambulances are standing across the road, not let through by the cordon.',
   ch:[{t:'Carry them out under fire',d:'Wounded −60% · Militia −20',run:A=>{A.wnd=Math.round(A.wnd*.4);S.mil=Math.max(0,S.mil-20);}},
       {t:'Ask the Interior Ministry officers for a corridor',d:'Wounded evacuated · Airtime +10',rq:'Interior Ministry 30',req:()=>S.pts.mvd>=30,run:A=>{A.wnd=0;A.air=Math.min(100,A.air+10);}},
       {t:'Leave them until dark',d:'Resolve −6',run:A=>{S.hope=clamp(S.hope-6,0,100);}}]},
  {id:'cnn', cond:A=>true, h:'LIVE BROADCAST', p:'A CNN camera stands on the roof opposite and shows the building to the whole world. The operator waves: give us someone in the frame.',
   ch:[{t:'Khasbulatov goes to the window',d:'Airtime +20',run:A=>{A.air=Math.min(100,A.air+20);}},
       {t:'Show the deputies and women, remove the gunmen',d:'Airtime +35',rq:'Radicalism no higher than 40%',req:()=>S.rad<=40,run:A=>{A.air=Math.min(100,A.air+35);}},
       {t:'No time for cameras',d:'Resolve +2',run:A=>{S.hope=clamp(S.hope+2,0,100);}}]},
  {id:'snipers', cond:A=>true, h:'SNIPERS ON THE ROOFS', p:'Unknown shooters fire from the roofs at both your people and the soldiers. Each side is sure it is the other.',
   ch:[{t:'Shelter the people',d:'Facade −8',run:A=>{A.ctl.front=Math.max(1,A.ctl.front-8);}},
       {t:'Take the shooters down with your own people',d:'Militia −15 · Resolve +4',rq:'Militia 150',req:()=>S.mil>=150,run:A=>{S.mil-=15;S.hope=clamp(S.hope+4,0,100);}},
       {t:'Say on air: it wasn\'t us',d:'Airtime −10 · Interior Troops weaken',rq:'Airtime 30',req:()=>S.A.air>=30,run:A=>{A.air-=10;const u=A.units.find(x=>x.id==='vv');u.cur*=.75;}}]},
  {id:'parley', cond:A=>A.r>=2, h:'PARLEYER', p:'An officer with a white flag offers half an hour of quiet to get the women and the wounded out. Afterwards, he says, it will be worse.',
   ch:[{t:'Agree',d:'People −300 · wounded evacuated · Resolve −3',run:A=>{S.ppl=Math.max(0,S.ppl-300);A.wnd=0;S.hope=clamp(S.hope-3,0,100);}},
       {t:'Demand mediators: the patriarch, the court, the regions',d:'Airtime +15 · the push weakens',rq:'Legitimacy 70',req:()=>S.leg>=70,run:A=>{A.air=Math.min(100,A.air+15);for(const u of A.units)u.cur*=.9;}},
       {t:'Refuse',d:'Resolve +3',run:A=>{S.hope=clamp(S.hope+3,0,100);}}]},
  {id:'hall', pic:'tank', cond:A=>A.units.find(u=>u.id==='tanks').cur>0, h:'A SHELL IN THE HALL', p:'A solid shot has pierced the wall of the meeting hall. Deputies lie between the seats. Someone suggests going down to the basement.',
   ch:[{t:'Everyone to the basement',d:'Resolve −4',run:A=>{S.hope=clamp(S.hope-4,0,100);}},
       {t:'Continue the sitting',d:'Resolve +5 · Airtime +10 · 10 deputies will leave',rq:'Resolve 50%',req:()=>S.hope>=50,run:A=>{S.hope=clamp(S.hope+5,0,100);A.air=Math.min(100,A.air+10);S.fac.kol.n=Math.max(0,S.fac.kol.n-10);}}]},
  {id:'ammo', cond:A=>A.r>=1, h:'CARTRIDGES', p:'There is one magazine per gun left at the entrances. The commanders ask where to get more.',
   ch:[{t:'Fire single shots',d:'Cartridges +40 · both entrances −6',run:A=>{A.ammo+=40;A.ctl.entr=Math.max(1,A.ctl.entr-6);A.ctl.front=Math.max(1,A.ctl.front-6);}},
       {t:'Collect from the floors and from the unarmed',d:'Cartridges +100 · People −80',rq:'People 500',req:()=>S.ppl>=500,run:A=>{A.ammo+=100;S.ppl-=80;}},
       {t:'Open the emergency reserve',d:'Cartridges +200',rq:'Weapons 300',req:()=>S.gun>=300,run:A=>{A.ammo+=200;}}]},
  {id:'crowd', cond:A=>S.city>=35, h:'THE EMBANKMENT', p:'Thousands of Muscovites are on the bridge and the embankment. Some watch as if at the cinema. Others are ready to walk to the building.',
   ch:[{t:'Ask them to leave the line of fire',d:'Resolve +1',run:A=>{S.hope=clamp(S.hope+1,0,100);}},
       {t:'Call them into a living ring',d:'in an hour +800 people · Airtime +10',rq:'Moscow 55%',req:()=>S.city>=55,run:A=>{A.incoming+=800;A.air=Math.min(100,A.air+10);}}]},
  {id:'water', cond:A=>A.fire>=2, h:'THE HYDRANTS ARE DRY', p:'Water in the building was cut off a week ago. The fire hoses are empty, and the extinguishers are running out.',
   ch:[{t:'Carry water from the river under fire',d:'People −120 · Fire −4',run:A=>{S.ppl=Math.max(0,S.ppl-120);A.fire=Math.max(0,A.fire-4);}},
       {t:'Smother with sand from the barricades',d:'Fire −5 · both entrances −5',run:A=>{A.fire=Math.max(0,A.fire-5);A.ctl.entr=Math.max(1,A.ctl.entr-5);A.ctl.front=Math.max(1,A.ctl.front-5);}},
       {t:'Let it burn',d:'Fire +2',run:A=>{A.fire=Math.min(15,A.fire+2);}}]},
  {id:'defect', cond:A=>A.units.some(u=>u.id==='taman'&&u.cur>0), h:'DEFECTORS', p:'A platoon of motor riflemen has lain down by the plinth and is not firing. The lieutenant shouts that they do not want to take part in this.',
   ch:[{t:'Shout to them to leave',d:'motor rifles weaken',run:A=>{const u=A.units.find(x=>x.id==='taman');u.cur*=.85;}},
       {t:'Pull them inside with their weapons',d:'Militia +30 · Weapons +60',rq:'General Staff 40',req:()=>S.pts.gs>=40,run:A=>{S.mil+=30;S.gun+=60;const u=A.units.find(x=>x.id==='taman');u.cur*=.8;}},
       {t:'Show them on television',d:'Airtime +15',rq:'Airtime 20',req:()=>S.A.air>=20,run:A=>{A.air=Math.min(100,A.air+15);}}]},
  {id:'cellar', cond:A=>A.r>=2, h:'BASEMENT', p:'In the bomb shelter are hundreds of women, canteen workers, typists and staff children. They will not come up again.',
   ch:[{t:'Lead them out through the twentieth entrance',d:'People −200 · Airtime +10 · Entrance −6',run:A=>{S.ppl=Math.max(0,S.ppl-200);A.air=Math.min(100,A.air+10);A.ctl.entr=Math.max(1,A.ctl.entr-6);}},
       {t:'Keep them in the basement until dark',d:'Resolve −3',run:A=>{S.hope=clamp(S.hope-3,0,100);}}]},
  {id:'btr', cond:A=>A.r>=3, h:'TROPHY', p:'An abandoned armoured personnel carrier with a full load of ammunition stands by the main entrance. The crew ran away.',
   ch:[{t:'Burn it so it does not go to them',d:'Main entrance +4',run:A=>{A.ctl.front=Math.min(100,A.ctl.front+4);}},
       {t:'Put your own men in and turn the machine gun',d:'Main entrance +15 · Weapons +80 · Airtime −10',rq:'Militia 250',req:()=>S.mil>=250,run:A=>{A.ctl.front=Math.min(100,A.ctl.front+15);S.gun+=80;A.air=Math.max(0,A.air-10);}}]},
  {id:'planes', cond:A=>A.r>=1, h:'RUTSKOY AT THE RADIO', p:'The vice-president shouts into an open channel: "Comrades, raise the aircraft!" Pilots, journalists and the Kremlin all hear it.',
   ch:[{t:'Let him call',d:'Resolve +4 · Airtime −15',run:A=>{S.hope=clamp(S.hope+4,0,100);A.air=Math.max(0,A.air-15);}},
       {t:'Take the radio: ask the world for mediation',d:'Airtime +10',rq:'Resolve 40%',req:()=>S.hope>=40,run:A=>{A.air=Math.min(100,A.air+10);}}]},
  {id:'truce', cond:A=>A.r>=6, h:'AN HOUR OF SILENCE', p:'The Kremlin proposes a one-hour truce to collect the wounded. Both sides know that reserves will come up in that hour.',
   ch:[{t:'Agree',d:'wounded evacuated · both entrances +6 · Kremlin units grow stronger',run:A=>{A.wnd=0;A.ctl.entr=Math.min(100,A.ctl.entr+6);A.ctl.front=Math.min(100,A.ctl.front+6);for(const u of A.units)if(u.cur>3)u.cur*=1.12;}},
       {t:'Refuse',d:'Resolve +2',run:A=>{S.hope=clamp(S.hope+2,0,100);}},
       {t:'Agree, and bring the press to the wounded',d:'same · Airtime +20',rq:'Airtime 25',req:()=>S.A.air>=25,run:A=>{A.wnd=0;A.air=Math.min(100,A.air+20);A.ctl.entr=Math.min(100,A.ctl.entr+6);A.ctl.front=Math.min(100,A.ctl.front+6);for(const u of A.units)if(u.cur>3)u.cur*=1.12;}}]},
  {id:'rne', cond:A=>S.fac.rne.n>0, h:'BARKASHOV\'S MEN LEAVE', p:'The RNE has found a way into the underground sewer and intends to leave before it is too late. A third of the guns will go with them.',
   ch:[{t:'Let them go',d:'RNE leaves the building',run:A=>{S.fac.rne.n=0;}},
       {t:'Shame them in front of the ranks',d:'stay · Resolve +2',rq:'Resolve 60%',req:()=>S.hope>=60,run:A=>{S.hope=clamp(S.hope+2,0,100);}},
       {t:'Buy them off with weapons',d:'Weapons −100 · stay',rq:'Weapons 100',req:()=>S.gun>=100,run:A=>{S.gun-=100;if(S.mil>S.gun)S.mil=S.gun;}}]},
];
function incidentCard(){const A=S.A; if(!A||screen!=='assault')return;
  let I=A.card==='inc'&&INCIDENTS.find(x=>x.id===A.incId);
  if(!I){const pool=INCIDENTS.filter(x=>!A.inc[x.id]&&x.cond(A)); if(!pool.length)return; const pr=pool.filter(x=>x.prio); I=pr.length?pr[0]:pool[Math.floor(Math.random()*pool.length)];}
  if(A.card!=='inc')Sfx.play(/^u_|^y_/.test(I.id)?'static':'alarm',1.2);
  A.card='inc'; A.incId=I.id; save();
  const tk=I.pic==='tank'&&uOn(A,'tanks'), who=/^y_/.test(I.id)?'yeltsin':I.who, yel=!!who||tk, body=`<h2>${I.h}</h2><div class="sub">${typeof I.p==='function'?I.p():I.p}</div>`+I.ch.map((c,i)=>{const lk=c.req&&!c.req();
    return `<div class="law${lk?' lock':''}" data-i="${i}"><div class="t">${i+1}. ${c.t}</div><div class="e">${typeof c.d==='function'?c.d():c.d}${c.rq?` · <span class="${lk?'n':'p'}">${lk?'needed':'open'}: ${c.rq}</span>`:''}</div></div>`;}).join('');
  $('modal-win').innerHTML=tk?`<div class="incy"><div class="ph"><img src="${tankShotURL()}"><b>NOVY ARBAT BRIDGE</b><small>tanks fire at the building</small></div><div>${body}</div></div>`:yel?`<div class="incy"><div class="ph"><img src="${who==='yeltsin'?ASSET_YELTSIN:PEOPLE[who].img}"><b>${who==='yeltsin'?'BORIS YELTSIN':PEOPLE[who].nm.toUpperCase()}</b><small>${who==='yeltsin'?'on the direct line':PEOPLE[who].role+', on the direct line'}</small></div><div>${body}</div></div>`:body;
  $('modal').classList.add('on');
  $('modal-win').querySelectorAll('.law').forEach(e=>e.onclick=()=>incChoose(+e.dataset.i));
}
function incChoose(i){const A=S.A, I=INCIDENTS.find(x=>x.id===A.incId), c=I&&I.ch[i]; if(!c||(c.req&&!c.req()))return;
  A.card=0; if(!I.multi)A.inc[I.id]=1; $('modal').classList.remove('on'); c.run(A); alog(I.h.charAt(0)+I.h.slice(1).toLowerCase()+': '+c.t.toLowerCase()+'.');
  if(S.hope<=0)return finale('broken'); save(); renderAssault();}
const A_ORDERS=[
  {t:'Counterattack',                 d:'entrance +20 · fighters −50 · enemy morale −7', req:()=>S.mil>=50||'needs 50 fighters',
   run:()=>{const s=S.A.ctl.entr<=S.A.ctl.front?'entr':'front';S.A.ctl[s]=Math.min(100,S.A.ctl[s]+20);S.mil-=50;for(const u of S.A.units)if(UNITS.find(x=>x.id===u.id).target===s&&u.cur>3){uMor(u,-7);u.lost=(u.lost||0)+15;}alog('Counterattack at the entrance «'+SECTORS.find(x=>x.id===s).nm+'».');}},
  {t:'Blocking the weak entrance',      d:'People −100 · entrance +10', req:()=>S.ppl>=100||'needs 100 people',
   run:()=>{const s=S.A.ctl.entr<=S.A.ctl.front?'entr':'front';S.ppl-=100;S.A.ctl[s]=Math.min(100,S.A.ctl[s]+10);alog('People drag furniture and safes to the entrance «'+SECTORS.find(x=>x.id===s).nm+'».');}},
  {t:'Call the General Staff',           d:()=>'talk with Kolesnikov about the motor rifles', once:1, req:()=>S.flags.noComms?'no connection':deputies(S)<5?'no deputies':uEff(S.A.units.find(u=>u.id==='taman'))>0||'the motor rifles are not fighting',
   run:()=>{const A=S.A; A.card='inc'; A.incId='gs_call'; incidentCard();}},
  {t:'Deputies — to the hall',          d:'Resolve +8', once:1, req:()=>true, run:()=>{S.hope=clamp(S.hope+8,0,100);alog('The Congress is sitting under fire. The people hold on.');}},
  {t:'Put out the fire',               d:'People −100 · Fire −6', req:()=>(S.A.fire>=1&&S.ppl>=100)||(S.A.fire<1?'nothing is burning':'needs 100 people'),
   run:()=>{S.ppl-=100;S.A.fire=Math.max(0,S.A.fire-6);alog('Volunteers are putting out the floors.');}},
  {t:'Arm the people',            d:()=>{const k=Math.min(100,S.ppl,freeGuns(S));return 'People −'+k+' · Militia +'+k;}, req:()=>(S.ppl>=20&&freeGuns(S)>=20)||(freeGuns(S)<20?'no free guns':'no people'),
   run:()=>{const k=Math.min(100,S.ppl,freeGuns(S));S.ppl-=k;S.mil+=k;alog('Another '+k+' people received guns and took up positions at the windows.');}},
  {t:'Food and water for the fighters',          d:'Supplies −2 · Resolve +5', req:()=>S.A.stock>=2||'needs 2 Supplies',
   run:()=>{S.A.stock-=2;S.hope=clamp(S.hope+5,0,100);alog('Bread, tea and water are carried around the floors.');}},
  {t:'Bandages for the wounded',  d:'Supplies −2 · Wounded −60%', req:()=>S.A.wnd<20?'few wounded':S.A.stock>=2||'needs 2 Supplies',
   run:()=>{S.A.stock-=2;S.A.wnd=Math.round(S.A.wnd*.4);alog('In the twentieth entrance the last crates of bandages have been opened.');}},
  {t:'Diesel onto the barricades',       d:'Supplies −3 · weak entrance +12 · Fire +1', req:()=>S.A.stock>=3||'needs 3 Supplies',
   run:()=>{const s=S.A.ctl.entr<=S.A.ctl.front?'entr':'front';S.A.stock-=3;S.A.ctl[s]=Math.min(100,S.A.ctl[s]+12);S.A.fire+=1;alog('Barricade at the entrance «'+SECTORS.find(x=>x.id===s).nm+'» was doused with diesel and set alight.');}},
  {t:'White flag',                 d:'surrender', flag:1, req:()=>true, run:()=>ending('surrender')},
];
// ---------- the air during the assault: what you ask the world for. One request an hour, paid in Эфир ----------
const AIR=[
  {t:'Call Muscovites to the building', cost:10, d:()=>`in an hour ${fmt(300+S.city*10)} people will come`, run:A=>{A.incoming+=300+S.city*10;alog('Airtime: Muscovites are called to the White House.');}},
  {t:'Ask for a truce to evacuate the wounded', cost:8, d:()=>`${Math.round(Math.min(.9,.3+S.A.air/100)*100)}% chance: wounded evacuated, Resolve +3`, req:()=>S.A.wnd>=20||'few wounded',
   run:A=>{if(Math.random()<Math.min(.9,.3+A.air/100)){A.wnd=0;S.hope=clamp(S.hope+3,0,100);alog('The fire died down for twenty minutes. The ambulances took the wounded away.');}else alog('The truce was refused.','bad');}},
  {t:'Appeal to the soldiers: do not shoot', cost:12, d:()=>`${Math.round(Math.min(.45,.1+S.A.air/200)*100)}% chance that one wavering unit stops; otherwise pressure −6%`,
   run:A=>{const g=A.units.filter(u=>uState(u)==='waver').sort((a,b)=>a.cur-b.cur)[0];
     if(g&&Math.random()<Math.min(.45,.1+A.air/200)){g.cur=0;g.st='stopped';alog(UNITS.find(x=>x.id===g.id).nm+': heard the appeal and ceased fire.');}else{for(const u of A.units){u.cur*=.94;uMor(u,-5);}alog('The soldiers listen, but an order is an order. The fire has become sparser.');}}},
  {t:'Show the world the fire and the wounded', cost:0, d:()=>'Airtime +15', run:A=>{A.air=Math.min(100,A.air+15);alog('Footage of the burning parliament goes out on all world channels.');}},
  {t:'Name the commanders who gave the order by name', cost:10, d:()=>'tanks −25%, tank crews\' morale −15, Radicalism +3', req:()=>S.A.units.find(u=>u.id==='tanks').cur>0||'tanks fall silent',
   run:A=>{A.units.find(u=>u.id==='tanks').cur*=.75;uMor(A.units.find(u=>u.id==='tanks'),-15);S.rad=clamp(S.rad+3,0,100);alog('The surnames and unit numbers are read out on air. Two crews switched off their engines.');}},
  {t:'Ask the courts and the regions for mediation', cost:15, d:()=>'pressure −10%, Resolve +4', req:()=>S.leg>=50||'needs Legitimacy 50',
   run:A=>{for(const u of A.units)u.cur*=.9;S.hope=clamp(S.hope+4,0,100);alog('Zorkin and the heads of the regions demand a ceasefire.');}},
  {t:'Show the soldiers their own losses', cost:8, d:()=>'morale of all units −5, and of those who took losses −10', run:A=>{for(const u of A.units)if(u.cur>3)uMor(u,(u.lost||0)>=40?-10:-5);alog('Names of the dead soldiers are read out over the loudspeaker. The chains fall quiet.');}},
  {t:'Ask for doctors and ambulances', cost:5, d:()=>'wounded half as many', req:()=>S.A.wnd>=20||'few wounded', run:A=>{A.wnd=Math.round(A.wnd/2);alog('Volunteer doctors came through the cordon.');}},
];
const airGain=()=>1+Math.floor(OUTLETS.filter(o=>outSt(S,o)==='vs').length/4)+(S.pts.ost>=100?2:0);
const airCost=o=>o.cost*(S.flags.noComms?2:1);
function airState(i){const o=AIR[i],A=S.A; if(A.airUsed)return 'already came out at this hour'; if(S.A.air<airCost(o))return 'needs '+airCost(o)+' Airtime'; const r=o.req?o.req():true; return r;}
function openAir(){const A=S.A; if(!A||screen!=='assault'||A.card)return;
  $('modal-win').innerHTML=`<h2>AIRTIME FROM THE WHITE HOUSE</h2><div class="sub">Airtime: <b style="color:var(--paper)">${Math.round(A.air)}</b> of 100, each hour +${airGain()} from your outlets. While Airtime is high the world watches: the push is weaker, the units' morale falls, and from 60 the wavering units may stand up. Appeals spend it. One request per hour, an order does not spend it.${S.flags.noComms?' <span class="n">No communications: airtime is possible only through foreigners: everything costs twice as much.</span>':''} The higher the Airtime, the weaker the push and the more readily you are heard.</div><div class="app2">`+
    AIR.map((o,i)=>{const st=airState(i);return `<div class="law${st!==true?' lock':''}" data-i="${i}"><div class="t">${o.t} <span class="cst">${airCost(o)?"Airtime −"+airCost(o):"free"}</span></div><div class="e">${st===true?o.d():`<span class="n">${st}</span>`}</div></div>`;}).join('')+
    `</div><div class="close">ESC — close</div>`;
  $('modal').classList.add('on');
  $('modal-win').querySelectorAll('.law').forEach(e=>e.onclick=()=>{const i=+e.dataset.i; if(airState(i)!==true)return; Sfx.play('static');Sfx.play('pips',.7); S.A.air-=airCost(AIR[i]); A.airUsed=1; AIR[i].run(A); $('modal').classList.remove('on'); save(); renderAssault();});
  $('modal-win').querySelector('.close').onclick=closeModal;
}
function aOrderState(i){const o=A_ORDERS[i],A=S.A; if(o.once&&A.once[i])return 'already done'; if(A.used[i])return 'already was';
  const r=o.req(); if(r!==true)return r; if(!A.orders&&!A_ORDERS[i].flag)return 'no orders left'; return true;}
function doAOrder(i){if(aOrderState(i)!==true)return; Sfx.play(['burst','thud','phone','crowd','fire','bolt','paper','lose'][i]||'click');const A=S.A; A.used[i]=1; if(A_ORDERS[i].once)A.once[i]=1; if(!A_ORDERS[i].flag)A.orders--;
  A_ORDERS[i].run(); if(screen==='assault'){save();renderAssault();}}
function moveShare(s,d){const A=S.A, sh=A.shares; if(d>0){const o=Object.keys(sh).filter(k=>k!==s&&sh[k]>=10).sort((a,b)=>sh[b]-sh[a])[0];if(!o)return;sh[o]-=10;sh[s]+=10;}
  else{if(sh[s]<10)return;const o=Object.keys(sh).filter(k=>k!==s).sort((a,b)=>sh[a]-sh[b])[0];sh[s]-=10;sh[o]+=10;}
  save();renderAssault();}

function renderAssault(){
  const A=S.A; const F=defForce();
  $('a-time').textContent=dateStr(S.day).toUpperCase()+' '+HOURS[Math.min(A.r,HOURS.length-1)];
  $('a-round').textContent='hour '+(A.r+1)+' of '+HOURS.length+' · until dark';
  const fireL=A.fire>0?Math.round(A.fire/5):0, wndL=A.wnd>=40?Math.min(6,Math.round(A.wnd/80)):0;
  const R=[['ppl','People',fmt(S.ppl),''],['mil','Militia',fmt(S.mil),A.ammo<=0?'<span class="n">no cartridges</span>':''],
    ['hope','Resolve',S.hope+'%',[A.fire>0?'fire'+(fireL?' −'+fireL:'')+'':'',A.wnd>=20?'wounded '+fmt(A.wnd)+(wndL?' −'+wndL:''):''].filter(Boolean).map(x=>'<span class="n">'+x+'</span>').join(' · ')],
    ['stk','Supplies',fmt(A.stock||0),''],['air','Airtime',Math.round(A.air),'<span class="p">+'+airGain()+' per hour</span>']];
  $('a-res').innerHTML=R.map(([k,nm,v,sub])=>`<div class="r"><div class="k">${nm}</div><div class="v${(k==='hope'&&S.hope<30)?' warn':''}">${v}${sub?` <small style="font-size:13px;font-family:'Tiny5'">${sub}</small>`:''}</div></div>`).join('');
  // section
  const att={entr:0,front:0};for(const u of A.units){const t=UNITS.find(x=>x.id===u.id).target;if(t!=='tower')att[t]+=uEff(u)/3;}
  const unitsN=x=>Math.round(A.shares[x]/100*F/40);
  drawSection($('a-c'),{fac:S.fac,def:{entr:unitsN('entr'),front:unitsN('front'),tower:unitsN('tower')},att,fire:A.fire});
  $('a-status').innerHTML=A.log.slice(0,4).map(l=>`<div class="${l.cls}"><span class="tm">${l.h}</span> ${l.t}</div>`).join('');
  // units
  $('a-units').innerHTML=`<h2>KREMLIN FORCES <span>losses ${fmt(kDead(A))} · yours ${fmt(A.lost||0)} · scale: strength in battle</span></h2>`+A.units.map(u=>{const U=UNITS.find(x=>x.id===u.id);
    const st=uState(u), m=Math.round(uMorV(u)), dm=u.mor0==null?0:Math.round(m-u.mor0);
    const on=Math.ceil(uEff(u)/50*8);
    const sub=u.cur<=3&&st!=='wait'?`losses ${fmt(u.lost||0)}${u.why?' · '+u.why:''}`:`losses ${fmt(u.lost||0)} · morale ${m}%`+(dm?` <span class="${dm<0?'p':'n'}">${dm<0?'▼':'▲'}${Math.abs(dm)}${u.why?' '+u.why:''}</span>`:'');
    return `<div class="urow ${st}"><span class="nm">${U.nm}<small>${sub}</small></span><span class="stt">${STANCE_NM[st]}</span><div class="b r" title="strength in battle now">${Array.from({length:8},(_,i)=>`<i class="${i<on?'on':''}"></i>`).join('')}</div></div>`;}).join('')+'<div class="uhint">morale from 50: advancing · 25–49: half strength · below 25: leave the fight for good</div>';
  // sectors
  $('a-sect').innerHTML=`<h2>DEFENCE <span>strength ${fmt(F)} · cartridges for ${S.mil>0?Math.floor(A.ammo/Math.max(1,Math.round(S.mil/8))):'—'} h</span></h2>`+SECTORS.map(s=>{const sh=A.shares[s.id];const c=A.ctl[s.id];
    const pr=s.id==='tower'?`<small class="${sh<10?'n':'p'}">${sh<10?'empty: enemy shooters above, Resolve −2/hour':'snipers: pressure on both entrances −'+Math.round(towerCut(A)*100)+'%'}</small>`:(()=>{const {D,A:a}=assaultSector(s.id);const L=A.last&&A.last[s.id];return `<small class="${a>D?'n':'p'}">defence ${Math.round(D)} against pressure ${Math.round(a)}: ${a>D?'pressing':'holding'}${L?` · per hour: us −${fmt(L.lost)}, them −${fmt(L.kl)}`:''}</small>`;})();
    return `<div class="srow"><span class="nm">${s.nm}${pr||`<small>${s.sub}</small>`}</span>
      ${c===undefined?'<span></span>':`<div class="ctl"><i style="width:${c}%"></i></div>`}
      <span class="sh"><b data-s="${s.id}" data-d="-1">−</b>${sh}%<b data-s="${s.id}" data-d="1">+</b></span></div>`;}).join('');
  $('a-sect').querySelectorAll('b[data-s]').forEach(b=>b.onclick=()=>moveShare(b.dataset.s,+b.dataset.d));
  // orders
  $('a-orders').innerHTML=`<h2>ORDERS <span>left: ${A.orders} · <u id="a-air" style="cursor:pointer;color:#e8a23a">APPEALS [M]${A.airUsed?' ✓':''}</u></span></h2><div class="agrid">`+A_ORDERS.map((o,i)=>{const st=aOrderState(i);
    return `<div class="aact${st!==true?' off':''}" data-i="${i}"><span class="k">${i+1}</span><span class="t">${o.t}</span><span class="cost">${st===true?(typeof o.d==='function'?o.d():o.d):`<span class="risk">${st}</span>`}</span></div>`;}).join('')+'</div>';
  $('a-orders').querySelectorAll('.aact').forEach(e=>e.onclick=()=>doAOrder(+e.dataset.i)); $('a-air').onclick=openAir;
}

// candle flicker on the section screens
setInterval(()=>{secTick++; if(screen==='wh'&&S)drawSection($('w-c'),{fac:S.fac,cordon:S.cordon,calm:S.phase===1,lit:!S.flags.noPower,st:{hope:S.hope,rad:S.rad,ppl:S.ppl,dep:deputies(S),radio:S.flags.radio}});
  else if(screen==='assault'&&S&&S.A){const A=S.A,F=defForce();const att={entr:0,front:0};for(const u of A.units){const t=UNITS.find(x=>x.id===u.id).target;if(t!=='tower')att[t]+=uEff(u)/3;}
    const n=x=>Math.round(A.shares[x]/100*F/40); drawSection($('a-c'),{fac:S.fac,def:{entr:n('entr'),front:n('front'),tower:n('tower')},att,fire:A.fire});}},160);
