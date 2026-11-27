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
  $('w-status').innerHTML=S.phase===1?`電気・水道・通信：あり<br>館内の代議員：${tot}${S.away?' · 出張中：'+S.away:''}`
    :`電気：${S.flags.noPower?'<b>なし</b>（毎夜 決意 −2）':S.flags.gen?'<i>発電機</i>':'あり'} · 通信：${S.flags.noComms?'<b>なし</b>':S.flags.radio?'<i>無線機</i>':'あり'}<br>館内の代議員：${tot}${S.away?' · 出張中：'+S.away:''}`;
  {const y=whYield(S); $('w-status').innerHTML+=`<br>最高会議の稼働率 ${Math.round(y.q*100)}% · 毎夜：正統性 +${y.leg}、放送 +${y.med}、決意 +${y.hope}`;}
  $('w-sec').querySelectorAll('.room,.fl2').forEach(e=>e.remove());
  // meters
  seg('w-hope',S.hope);seg('w-rad',S.rad);$('w-mh').textContent=S.hope+'%';$('w-mr').textContent=S.rad+'%';
  const bar=(cls,v)=>`<div class="b ${cls}">${Array.from({length:10},(_,i)=>`<i class="${i<v?'on':''}"></i>`).join('')}</div>`;
  {
    // ---- factions mode ----
    $('w-h2').innerHTML=`館内の会派 <span>代議員：${tot} · 定足数 ${QUORUM}</span>`;
    $('w-hdr').innerHTML=`<span></span><span>グループ</span><span style="text-align:right">館内</span><span>忠誠度</span><span></span>`;
    {const F=FACTIONS.find(x=>x.id===S.selFac),h=document.querySelector('#s-wh .hint'); if(h)h.innerHTML=F&&FAC_PRESS[F.id]&&S.fac[F.id].n>0?F.nm.replace(/"/g,'')+'が読む媒体：'+FAC_PRESS[F.id].map(id=>{const o=OUTLETS.find(x=>x.id===id),st=outSt(S,o);return `<span style="color:${st==='vs'?'var(--ok)':st==='kr'?'#7fa0cf':'var(--dim)'}">${o.nm.replace(/[«»]/g,'')} ${st==='vs'?'↑':st==='kr'?'↓':'·'}</span>`;}).join('、')+'。味方の媒体は忠誠度を上げ、クレムリン寄りの媒体は下げます。':'代議員の忠誠度が高く、館内の人数が多いほど、最高会議はよく機能します';}
    $('w-rows').innerHTML=FACTIONS.map(F=>{const f=S.fac[F.id];
      const sub0=(f.n<=0?'館内にいない':F.kind==='arm'?'非代議員':'')+(f.tr&&f.n>0?(f.tr.d>0?' <span style="color:var(--ok)">↑</span>':' <span style="color:#e0866a">↓</span>'):'')+(b=>!b?'':b.on>0?' · <span style="color:var(--ok)">ボーナス有効</span>':b.on<0?' · <span style="color:#e0866a">悪影響</span>':' · ボーナス無効')(facBonus(S,F));
      const sub=sub0.replace(/^ · /,'');
      return `<div class="row${f.loy<=3&&f.n>0?' warn':''}${F.kind==='arm'&&f.n>0?' hot':''}${S.selFac===F.id?' selr':''}${f.n<=0?' gone':''}" data-f="${F.id}"><span class="sw" style="background:${F.c}"></span><span class="nm">${F.nm}<small>${sub}</small></span><span class="ct">${Math.max(0,f.n)}</span>${(L=>`<div class="b l5">${Array.from({length:5},(_,i)=>`<i style="${i<=L?'background:'+LOY[L].c:''}"></i>`).join('')}</div><span class="lv" style="color:${LOY[L].c}">${LOY[L].nm}</span>`)(loyLvl(f.loy))}</div>`;}).join('');
    $('w-rows').querySelectorAll('.row').forEach(e=>e.onclick=()=>{S.selFac=e.dataset.f;renderWH();firstLook('f',e.dataset.f);});
    const F=FACTIONS.find(x=>x.id===S.selFac)||FACTIONS[0]; S.selFac=F.id; const f=S.fac[F.id]; 
    const acts=facActs(F.id).map((a,i)=>{const st=facActState(F.id,i);
      return `<div class="act${st!==true?' off':''}" data-i="${i}"><span class="k">${i+1}</span><span class="t">${a.t}</span><span class="cost">${st===true?fxText(a.fx(F),F.id):`<span class="risk">${st}</span>`}</span></div>`;}).join('');
    const W=PEOPLE[FAC_WHO[F.id]];
    $('w-det').innerHTML=`<div class="who">${faceHTML(FAC_WHO[F.id],'big')}<div><h3><span class="sw" style="background:${F.c}"></span>${F.nm}</h3><div class="own"><b class="wn">${W.nm}</b>、${W.role}</div></div></div>
      ${f.n<=0?'<div class="own">この会派は館内にいない。</div>':''}
      ${f.n>0&&F.id!=='rne'?`<div class="own">現在は<b style="color:${LOY[loyLvl(f.loy)].c}">${LOY[loyLvl(f.loy)].nm}</b>：${LOY[loyLvl(f.loy)].d}。${f.tr?`昨夜<b style="color:${f.tr.d>0?'var(--ok)':'#e0866a'}">${f.tr.d>0?'↑':'↓'}</b>：${f.tr.why}。`:''}</div>`:''}
      ${(b=>b&&F.id!=='rne'?`<div class="own">現在の効果（${b.t}）：<b style="color:${b.on>0?'var(--ok)':b.on<0?'#e0866a':'var(--dim)'}">毎夜 ${fxText(b.fx).replace(/<[^>]+>/g,'')}</b> ${b.on>0?'':b.on<0?'（「不安定」以下では悪影響）':'（無効：「忠実」以上が必要）'}</div>`:'')(facBonus(S,F))}
      ${F.id==='rne'&&f.n>0?(b=>`<div class="own" style="flex:none"><span class="p">戦力：</span>戦闘員${f.n}人、防衛では${f.n*3}人に相当。<span class="n">代償：</span>烙印 ${b}/3、毎夜 モスクワ −${Math.min(3,b+1)}${b>=1?'、正統性 −'+(b>=2?2:1):''}、穏健派が去る。</div>`)(S.flags.brand||0):''}
      <div class="acts">${acts}</div>`;
    $('w-det').querySelectorAll('.act').forEach(e=>e.onclick=()=>doFacAct(F.id,+e.dataset.i)); drawFaces($('w-det'));
  }
  $('w-orders').textContent='命令：'+S.orders;
}
const FACTION_ACTS=[
  {t:'指導者と協議する',  fx:F=>({fac:{[F.id]:{loy:2}}})},
  {t:'規律を求める',     fx:F=>({rad:-3,fac:{[F.id]:{loy:-1}}})},
];
const RNE_OUT={t:'建物から追い出す', fx:F=>({city:4,leg:3,hope:-4,rad:-5}), run:()=>{S.fac.rne.n=0;S.flags.rneOut=1;S.flags.brand=Math.max(0,(S.flags.brand||0)-1);}};
const facActs=fid=>fid==='rne'?[FACTION_ACTS[0],RNE_OUT]:FACTION_ACTS;
function facActState(fid,i){const f=S.fac[fid]; if(f.n<=0)return '館内にいない'; if(S.used['f'+fid+i])return '今日は実施済み'; if(!S.orders)return '朝まで命令がない'; return true;}
function doFacAct(fid,i){if(facActState(fid,i)!==true)return; const a=facActs(fid)[i]; apply(a.fx(FACTIONS.find(F=>F.id===fid))); if(a.run)a.run();
  S.orders--;S.used['f'+fid+i]=1; log(FACTIONS.find(F=>F.id===fid).nm+'：'+a.t+'。'); save(); renderWH();}

// =====================================================================================================
// ===== the assault: a separate level, two hours per turn from 07:00 to 17:00 =====
function unitStance(u){if(u.src==='alpha')return S.A&&S.A.alpha||'wait'; if(u.id==='omon'){const o=S.omon==null?100:S.omon;return o<=60?'waver':'attack';}const v=S.pts[u.src]; if(u.src==='mvd')return v>=50?'refuse':v>=30?'waver':'attack'; return v>=65?'refuse':v>=45?'waver':'attack';}
const STANCE_NM={attack:'前進中',waver:'動揺',halt:'停止',refuse:'拒否',wait:'予備',stopped:'撤収'};
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
  alog(refused.length?'命令を拒否した部隊：'+refused.join('、')+'。':'クレムリン側の全部隊が命令に従っている。');
  A.lost=0; A.muster=musterRoll(A);
  // подготовка превращается в силу штурма: Легитимность, Москва, готовность ОМОНа и лояльность ведомств сбивают стартовый дух частей
  { const L=A.muster, dn=(u,d)=>{ if(u.cur>3&&u.id!=='alpha')u.mor=clamp(uMorV(u)-d,28,100); };
    const dl=S.leg>50?Math.round((S.leg-50)*.5):0; if(dl){for(const u of A.units)dn(u,dl); L.push({g:1,t:'正統性 '+S.leg+'：クレムリン側の部隊は気乗りしないまま前進している。全部隊の士気 −'+dl});}
    const om=A.units.find(u=>u.id==='omon'), rd=S.omon==null?100:S.omon, do1=Math.round((100-rd)*.5)+(S.city>60?Math.round((S.city-60)*.3):0); if(do1&&om.cur>3){dn(om,do1); L.push({g:1,t:'OMONは戦いに乗り気でない（戦意 '+rd+'%、モスクワ '+S.city+'%）：士気 −'+do1});}
    for(const u of A.units){const U=UNITS.find(x=>x.id===u.id); if(U.src==='alpha'||u.cur<=3)continue; const v=S.pts[U.src], d=v>30?Math.round((v-30)*.3):0; if(d)dn(u,d);}
    if(S.flags.corner){A.noRes=1; for(const u of A.units)dn(u,10); L.push({g:1,t:'クレムリンは追い詰められた：命令は急ごしらえで、予備兵力はない。全部隊の士気 −10'});} }
  save(); show('assault'); renderAssault(); musterCard();
}
// ---------- the last night: everyone you dealt with shows up, or does not. Like a final battle, every earlier choice counts ----------
function musterRoll(A){const L=[], add=(g,t)=>L.push({g,t}), lv=id=>S.fac[id].n>0?loyLvl(S.fac[id].loy):-1, hp=d=>{S.hope=clamp(S.hope+d,0,100);};
  const mul=(id,k)=>{const u=A.units.find(x=>x.id===id); if(u)u.cur*=k;};
  // фракции внутри
  let l=lv('kr'); if(l>=3){S.ppl+=400;add(1,'共産主義者が工場の自警団を連れてきた：市民 +400');} else if(l>=0&&l<=1){const n=S.fac.kr.n;S.fac.kr.n=0;hp(-3);add(0,'夜のうちに共産主義者が'+n+'人全員去った：決意 −3');}
  l=lv('ros'); if(l>=3){hp(6);add(1,'「ロシア」が議場を守り抜く：決意 +6');} else if(l>=0&&l<=1){S.fac.ros.n=0;hp(-2);add(0,'「ロシア」は夜明け前に建物を去った：決意 −2');}
  l=lv('agr'); if(l>=3){A.stock+=4;A.medK=.8;add(1,'農業派が炊き出しと救護所を設けた：物資 +4、死傷者 20%減');} else if(l>=0&&l<=1){S.fac.agr.n=0;add(0,'農業派はそれぞれの地元へ帰っていった');}
  l=lv('otc'); if(l>=3){A.gsB=.2;mul('taman',.9);add(1,'「祖国」は無線の周波数も指揮官の名も知っている：参謀本部への電話が効きやすくなり、自動車化狙撃兵 −10%');}
    else if(l>=0&&l<=1){A.leak=1;S.fac.otc.n=0;add(0,'「祖国」の代議員が去り、誰がどこを指揮しているかを参謀本部に漏らした：攻勢 +12%、タワーの援護は半減');}
  l=lv('sm'); if(l>=3){A.air=Math.min(100,A.air+15);add(1,'「スメナ」が外国人記者を各階へ案内している：放送 +15');} else if(l>=0&&l<=1){A.air=Math.max(0,A.air-15);hp(-4);S.fac.sm.n=0;add(0,'「スメナ」が白旗を掲げてカメラの前に出た：放送 −15、決意 −4');}
  l=lv('kol'); if(l>=3){hp(3);add(1,'態度未定の代議員は残った。議場は定足数を満たしている：決意 +3');} else if(l>=0&&l<=1){A.ctl.entr-=10;A.ctl.front-=10;S.fac.kol.n=0;add(0,'態度未定の代議員が封鎖線を抜けて去り、見張りの配置を明かした：両入口 −10');}
  l=lv('rne'); if(l>=3){A.ctl.entr=Math.min(100,A.ctl.entr+10);add(1,'RNEが20番玄関を固める：手薄な入口 +10');} else if(l>=0&&l<=1){const g=Math.min(100,freeGuns(S));S.gun-=g;A.ammo=Math.max(0,A.ammo-g);S.fac.rne.n=0;S.flags.rneLeft=1;add(0,'バルカショフ派が地下道から抜け出し、銃を持ち去った：武器 −'+g);}
  l=lv('so'); if(l>=3)add(1,'「将校同盟」が防衛本部を引き受けた：全区画の守りが堅くなる'); else if(l>=0&&l<=1){A.air=Math.max(0,A.air-10);S.rad=clamp(S.rad+5,0,100);add(0,'テレホフの将校たちは独断で戦っている：放送 −10、過激化 +5');}
  // силы снаружи
  for(const [id,nm] of [['mo','国防省'],['gs','参謀本部'],['mvd','内務省']]){const v=S.pts[id],hi=id==='mvd'?50:65,lo=id==='mvd'?30:45; add(v>=lo?1:0,nm+'（支持 '+v+'%、'+hi+'%以上で拒否）：'+(v>=hi?'部隊は命令を拒否した':v>=lo?'部隊は動揺し、全力では来ない':'部隊は命令に従う'));}
  {const o=S.omon==null?100:S.omon; add(o<=60?1:0,'OMON：'+(o<=60?'動揺し、全力では来ない':'命令に従う')+'（戦意 '+o+'%）');}
  if(S.pts.mer>=60){A.medK=(A.medK||1)*.85;add(1,'市庁舎は救急車を引き揚げなかった：死傷者 15%減');} else if(S.pts.mer<25&&S.bar>0){S.bar--;add(0,'市庁舎がブルドーザーを出した：夜明け前にバリケードが1列撤去された');}
  if(S.pts.smo>=60){A.incoming+=500;add(1,'スモレンスカヤ広場から隊列が向かっている：1時間後に +500人');}
  if(S.city>=60){A.incoming+=600;add(1,'モスクワは味方だ：1時間後、さらに600人が建物の前に');} else if(S.city<=25){const d=Math.round(S.ppl*.15);S.ppl-=d;add(0,'モスクワは突入をテレビで眺めている：夜のうちに'+fmt(d)+'人が建物の前から去った');}
  // пресса
  for(const o of OUTLETS){const st=outSt(S,o), f=o.fin&&o.fin[st]; if(!f||!f.t)continue; const x=f.fx;
    if(x.air)A.air=clamp(A.air+x.air,0,100); if(x.hope)hp(x.hope); if(x.inc)A.incoming+=x.inc; if(x.ppl)S.ppl=Math.max(0,S.ppl+x.ppl); if(x.mil){S.mil+=x.mil;S.gun+=x.mil;}
    if(x.ctl){A.ctl.entr+=x.ctl;A.ctl.front+=x.ctl;} if(x.all)for(const u of A.units)u.cur*=x.all; if(x.u)for(const k in x.u)mul(k,x.u[k]);
    add(st==='vs'?1:0,f.t);}
  if((S.flags.brand||0)>=2){A.air=Math.max(0,A.air-12);add(0,'「議会にファシスト」の烙印：西側は目をそらす。放送 −12');}
  // что вы успели сделать
  if(S.flags.tunnel){A.tunnel=1;add(1,'地下道は偵察済み：負傷者を地下から運び出せる。1時間あたりの搬出数は2倍');}
  if(S.flags.noComms)add(0,'通信途絶：電話はかけられず、放送の費用は2倍');
  if(S.flags.noPower){hp(-3);add(0,'建物は停電している：決意 −3');} else if(S.flags.gen)add(1,'発電機が稼働中：電気も無線も使える');
  if(S.bar>=4)add(1,'バリケードは'+S.bar+'列：入口が長く持ちこたえる');
  if(deputies(S)<QUORUM){hp(-4);add(0,'定足数割れ：議場の代議員は'+deputies(S)+'人。決意 −4');}
  A.ctl.entr=clamp(A.ctl.entr,20,100);A.ctl.front=clamp(A.ctl.front,20,100);
  return L;}
function musterCard(){const A=S.A; A.card='muster'; save(); Sfx.play('engine');
  const col=g=>A.muster.filter(m=>m.g===g).map(m=>`<div class="ml ${g?'p':'n'}">${g?'+':'−'} ${m.t}</div>`).join('')||'<div class="ml">なし</div>';
  $('modal-win').innerHTML=`<h2>最後の夜：誰が味方か</h2><div class="sub">この2週間に積み重ねてきたことが、いま建物の前に姿を現す。あるいは、現さない。会派、軍と治安機関、報道、そしてあなた自身の決断。</div>
   <div class="mus"><div><h3>味方</h3>${col(1)}</div><div><h3>敵</h3>${col(0)}</div></div><div class="close">ENTER ― 戦闘へ</div>`;
  $('modal').classList.add('on'); $('modal-win').querySelector('.close').onclick=musterClose;}
function musterClose(){const A=S.A; if(!A||A.card!=='muster')return; Sfx.play('boom'); A.card=0; $('modal').classList.remove('on'); save(); renderAssault(); if(A.allRef&&A.alpha==='wait'){alog('軍も国内軍もOMONも、建物には向かわなかった。クレムリンに残るのは特殊部隊だけだ。');return alphaCard();} incidentCard();}
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
  if(A.incoming){S.ppl+=A.incoming;alog('モスクワ市民が包囲を抜けてホワイトハウスに到着：+'+fmt(A.incoming)+'人。');A.incoming=0;}
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
      uMor(u,-(dl*1.0)-(Ar<=D?2:-2)); u.why=Ar<=D?'撃退':'損害';
      if(u.dead>=U.str*.6&&u.cur>3){u.cur=0;u.st='stopped';u.why='大損害';alog(U.nm+'：兵力の半数以上を失い、部隊は建物から後退した。');aBanner(U.nm.toUpperCase()+'：戦線離脱','兵力の半数以上を失った（'+fmt(u.lost)+'人）。司令部は部隊を建物から後退させた。',true);}}
    A.last[s]={D:Math.round(D),A:Math.round(Ar),lost,kl};
    const nm=SECTORS.find(x=>x.id===s).nm;
    if(Ar>0)alog(`${nm}：${Ar>D?'押されている':'持ちこたえている'}。死傷者 味方${fmt(lost)}・敵${fmt(kl)}。`,Ar>D?'bad':'');}
  const tk=A.units.find(u=>u.id==='tanks'), T=uEff(tk);
  if(T>0){const hl=Math.round(T/6+A.fire/5);S.hope=clamp(S.hope-hl,0,100);A.fire=Math.min(15,A.fire+T/20);
    const tl=Math.round(A.shares.tower/100*defForce()*.04*T/30);S.mil=Math.max(0,S.mil-tl);
    alog(`戦車がタワーを砲撃。上の階が燃えている。決意 −${hl}。`,'bad');}
  else if(A.fire>0){const hl=Math.round(A.fire/5);A.fire=Math.min(15,A.fire+.5);if(hl){S.hope=clamp(S.hope-hl,0,100);alog(`火の手が各階に広がる。決意 −${hl}。`,'bad');}}
  // wounded: the med post treats some; the rest lie in corridors and break morale
  const tr=Math.min(A.wnd,Math.round(A.wnd*.3*roomQ(S,'med')*(A.tunnel?2:1))); A.wnd-=tr; if(A.wnd>=40){const wl=Math.min(6,Math.round(A.wnd/80));if(wl){S.hope=clamp(S.hope-wl,0,100);alog(`負傷者${fmt(A.wnd)}人、寝かせる場所もない。決意 −${wl}。`,'bad');}}
  // live air: while the world is watching, wavering units look for a reason to stop
  // камеры: эфир точит дух каждый час, а бойня под камерами точит вдвойне
  {const bl=A.air>=40?Math.min(5,lostHour/50):0; for(const u of A.units){if(u.cur<=3)continue; const d=A.air/150+(uEff(u)>0?bl:0)+(A.air>=60&&uState(u)==='waver'?3:0); if(d>0){uMor(u,-d); if(d>=3&&!u.why)u.why='カメラの目';}}}
  // танки одни не воюют: если пехота стоит, экипажи не хотят в одиночку расстреливать парламент
  if(tk.cur>3&&!A.units.some(u=>u.id!=='tanks'&&uEff(u)>0)){uMor(tk,-20);tk.why='歩兵が停止';}
  // большая кровь у Кремля: резервы не шлют, танкисты сникают
  if(kDead(A)>=450&&tk.cur>3){uMor(tk,-8);if(!tk.why)tk.why='突入の損害';}
  for(const u of A.units){if(u.cur<=3)continue; const was=u.mor0>=MOR_GO?2:u.mor0>=MOR_HALT?1:0, m=uMorV(u), now=m>=MOR_GO?2:m>=MOR_HALT?1:0; if(now===was)continue; const nm=UNITS.find(x=>x.id===u.id).nm;
    if(now===0){u.cur=0;u.st='stopped';u.halt=1;} // встали — значит вышли из боя насовсем: вернуть часть Кремль уже не может
    const tx=now===0?'停止し、それ以上進まない':now===1?(was===2?'動揺し、半分の力でしか進まない':'再び動き出したが、力は半分'):'再び攻撃に出た';
    alog(nm+'：'+tx+(u.why?'（'+u.why+'）':'')+'。',now>was?'bad':''); aBanner(nm.toUpperCase()+'：'+(now===0?'戦闘から離脱':now===1?(was===2?'動揺':'再び前進'):'再び攻撃'),'士気 '+Math.round(m)+'%'+(u.why?' · 理由：'+u.why:'')+'。'+(now===0?'兵士たちは立ち止まり、それ以上進まない。この部隊が戦闘に戻ることはもうない。':tx[0].toUpperCase()+tx.slice(1)+'。'),now<was);}
  // кровь меняет политику: каждые 500 убитых и раненых с обеих сторон — Радикализм +3, Легитимность −2
  {const bl=Math.floor(((A.lost||0)+kDead(A))/500); if(bl>(A.blood||0)){const d=bl-(A.blood||0);A.blood=bl;S.rad=clamp(S.rad+3*d,0,100);S.leg=clamp(S.leg-2*d,0,100);alog(`死傷者が${fmt(bl*500)}人を超えた。過激化 +${3*d}、正統性 −${2*d}。`,'bad');}}
  A.air=clamp(A.air+airGain(),0,100); // эфир не тает: каждый час капает от своих изданий
  // ammunition: every hour of fighting eats the stock; with empty magazines the doors hold much worse
  if(A.shares.tower<10){S.hope=clamp(S.hope-2,0,100);A.fire=Math.min(15,A.fire+1);alog('タワーが無人に：上階を正体不明の狙撃手に奪われ、消火する者もいない。決意 −2。','bad');}
  if(S.mil>0){const am=Math.round(S.mil/8); const had=A.ammo>0; A.ammo=Math.max(0,A.ammo-am); if(had&&A.ammo<=0)alog('弾薬が尽きた。守備側は銃床と火炎瓶で持ちこたえている。','bad');}
  // siege: after noon reserves come up to the units whose structures stayed with the Kremlin, and the House tires
  if(A.r>=5){S.hope=clamp(S.hope-1,0,100); if(A.r%2===1){ if(A.noRes)alog('予備兵力なし：クレムリンにはもう送り込む部隊がない。'); else if(kDead(A)>=350)alog('予備兵力なし：これほどの損害を出し、クレムリンは新たな部隊の投入をためらっている。'); else{for(const u of A.units){const U=UNITS.find(x=>x.id===u.id); if(u.cur>3&&uEff(u)>0){u.cur=Math.min(U.str*1.2,u.cur+U.str*.15);uMor(u,8);if(!u.why)u.why='増援';}} alog('突入部隊に増援が到着した。消耗戦で建物を落とす構えだ。','bad');} } }
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
    const t=u.id==='alpha'&&A.alpha==='wait'?['','結局、戦闘に投入されなかった']:st==='refuse'?['p',u.id==='alpha'?'突入を拒否した':'命令を拒否し、戦闘に加わらなかった']:st==='stopped'?['p','戦闘から離脱'+(u.why?'（'+u.why+'）':'')+(u.id==='tanks'?'':'、死傷者 '+lost)]
      :st==='halt'?['p','停止して動かない：士気 '+m+'%'+(u.id==='tanks'?'':'、死傷者 '+lost)]:st==='waver'?['','動揺：士気 '+m+'%'+(u.id==='tanks'?'':'、死傷者 '+lost)]:['n',(u.id==='tanks'?'砲撃を続けている':'前進中')+'：士気 '+m+'%'+(u.id==='tanks'?'':'、死傷者 '+lost)];
    return `<div><b>${U.nm}</b><span class="${t[0]}">${t[1]}</span></div>`;};
  const going=A.units.filter(u=>uEff(u)>0&&u.id!=='tanks').map(u=>UNITS.find(x=>x.id===u.id).nm);
  const T={
    fell:['建物陥落',`${why==='entr'?'20番玄関':'正面玄関'}が陥落した。守備隊は一人として残っておらず、突入部隊が各階へとなだれ込んでいる。進撃を続けていた部隊（${going.join('、')||'なし'}）が建物内へ突入した。士気がどうであれ、損害がどれほど出ていようと、もはや彼らを止めるものはない。扉は開かれたのだ。`],
    broken:['射撃停止',`守備側の決意はゼロになった。戦車からの砲撃、各階で上がる火の手、廊下にあふれる負傷者が、その心を折ったのだ。入口こそまだ持ちこたえていたが、守る者はすでにいない。窓から白いシーツが垂らされた。`],
    held:why==='dark'?['日没。突入中止',`12時間戦い続けても、建物は落ちなかった。暗闇の中、クレムリンは突入の続行に踏み切れなかった。${going.length?'まだ前進していた部隊（'+going.join('、')+'）には、建物から撤退せよとの命令が下った。あなたは敵を打ち破ったのではない。耐え抜いたのだ。':'もはや前進できる部隊は残っていなかった。'}`]
      :['突入は力尽きた',`${A.units.some(u=>u.cur>3)?'3時間続けて、前進する部隊は一つも現れなかった':'建物の前には、前進できる部隊が一つも残っていない'}。指揮官たちはクレムリンへ、兵が立ち上がろうとしないと報告している。銃声はいつしかやんでいた。`]}[id];
  $('modal-win').innerHTML=`<h2>${T[0]}</h2><div class="sub">${HOURS[Math.min(A.r,HOURS.length-1)]}、戦闘${Math.min(A.r,HOURS.length)}時間経過（全${HOURS.length}時間）。${T[1]}</div>
   <div class="finl">${A.units.map(unitLine).join('')}<div><b>味方の損害</b><span>死傷者 ${fmt(A.lost||0)} · 入口：20番玄関 ${Math.round(A.ctl.entr)}%、正面玄関 ${Math.round(A.ctl.front)}% · 決意 ${S.hope}%</span></div></div><div class="close">ENTER ― その後どうなったか</div>`;
  $('modal').classList.add('on'); $('modal-win').querySelector('.close').onclick=finaleGo; renderAssaultSafe();}
function renderAssaultSafe(){try{renderAssault();}catch(e){}}
function finaleGo(){const A=S.A; if(!A||A.card!=='fin')return; A.card=0; $('modal').classList.remove('on'); ending(A.finId);}
function alphaCard(){
  const A=S.A;
  const DS=[[S.leg>=50,'正統性 50以上（現在 '+S.leg+'）'],[A.air>=40,'放送 40以上（現在 '+Math.round(A.air)+'）']], draw=DS.every(x=>x[0]);
  $('modal-win').innerHTML=`<h2>玄関前の「アルファ」</h2><div class="sub">${A.allRef?'命令に従う部隊はもはや一つもない。クレムリンに残された最後の予備戦力は「アルファ」と「ヴィンペル」だけだ。':'突入開始から4時間、建物はまだ落ちない。クレムリンは最後の予備戦力である「アルファ」と「ヴィンペル」を投入する。'}その将校たちは議会に銃を向けることを拒み、自らの保証のもとで人々を建物の外へ退去させると申し出ている。事態がどう決着するかは、国じゅうが彼らを注視しているかどうかにかかっている。</div>`+
    [{t:'「アルファ」を受け入れ、その保証のもとで退去する',d:draw?'<span class="p">引き分け：</span>「アルファ」はカメラの前で突入を拒む。建物を失いはするが、エリツィンはもはや軍に命令を下せない。':'<span class="n">敗北：</span>静かな降伏。引き分けに持ち込むには'+DS.filter(x=>!x[0]).map(x=>x[1]).join('と')+'が必要。'},
     {t:'無線で将校たちに呼びかける',d:S.A.air>=10?`放送 −10 · 成功率 ${Math.round((.25+S.leg/250)*100)}%：「アルファ」が突入を拒み、撤退する。${S.A.allRef?'そうなれば突入する部隊はいなくなる':'ほかの部隊との戦闘は続く'}`:'<span class="n">放送が10必要</span>'},
     {t:'戦う',d:'「アルファ」が20番玄関に突入してくる。クレムリン側最強の部隊だ。'}]
    .map((c,i)=>`<div class="law" data-i="${i}"><div class="t">${i+1}. ${c.t}</div><div class="d">${c.d}</div></div>`).join('');
  $('modal').classList.add('on'); A.card=1;
  $('modal-win').querySelectorAll('.law').forEach(e=>e.onclick=()=>alphaChoose(+e.dataset.i));
}
function alphaChoose(i){const A=S.A; const u=A.units.find(x=>x.id==='alpha'), base=UNITS.find(x=>x.id==='alpha').str;
  if(i===1&&S.A.air<10)return;
  A.card=0; closeModal();
  if(i===0){S.chron.push({date:dateStr(S.day),h:'「アルファ」',ch:'交渉'});return ending(S.leg>=50&&A.air>=40?'draw_alpha':'surrender_alpha');}
  if(i===1){S.A.air-=10; u.mor=90; if(Math.random()<.25+S.leg/250){A.alpha='refuse';u.cur=0;alog('「アルファ」は議会への突入を拒絶した。');aBanner('「アルファ」が拒否','将校たちは無線であなたの訴えを聞き入れ、突入を見送った。ほかの部隊との戦闘は続く。',true);}
    else{A.alpha='attack';u.cur=base;alog('「アルファ」の将校たちは耳を貸さなかった。玄関への突入が始まる。','bad');}}
  if(i===2){A.alpha='attack';u.cur=base;alog('「アルファ」が20番玄関へ突入する。','bad');}
  S.chron.push({date:dateStr(S.day),h:'「アルファ」',ch:['交渉','無線での呼びかけ','戦闘'][i]});
  save(); renderAssault();
}
// ---------- incidents: one per hour, something happens and has to be balanced against the rest ----------
const uMor=(u,d)=>{u.mor=clamp((u.mor==null?80:u.mor)+d,0,100);};
const uOn=(A,id)=>uEff(A.units.find(u=>u.id===id))>0;
function uMul(A,id,k,force){const u=A.units.find(x=>x.id===id),U=UNITS.find(x=>x.id===id); if(u.cur<=3)return; u.cur=Math.min(U.str*1.5,u.cur*k);}
function uStop(A,id,why){const u=A.units.find(x=>x.id===id); u.cur=0;u.st='stopped';alog(UNITS.find(x=>x.id===id).nm+'：'+why+'。');}
function uBack(A,k){const u=A.units.find(u=>(u.st==='refuse'||u.st==='stopped')&&u.id!=='alpha'); if(!u)return; const U=UNITS.find(x=>x.id===u.id); u.cur=U.str*k;u.st='attack';u.mor=Math.max(uMorV(u),60);u.dead=0;alog(U.nm+'：再び戦列へと戻った。','bad');}
const yCallUnit=A=>A.units.filter(u=>u.cur>3&&!u.called&&uMorV(u)<MOR_GO&&!(u.id==='alpha'&&A.alpha!=='attack')).sort((x,y)=>UNITS.find(q=>q.id===y.id).str-UNITS.find(q=>q.id===x.id).str)[0];
const yCallLoy=u=>{const U=UNITS.find(x=>x.id===u.id);return U.src==='alpha'?40:u.id==='omon'?100-(S.omon==null?100:S.omon):S.pts[U.src];};
const yCallGain=A=>Math.max(10,Math.round(40-yCallLoy(yCallUnit(A))/3)); // чем лояльнее вам структура, тем слабее действует звонок
const yCallTalk=A=>clamp(.15+yCallLoy(yCallUnit(A))/200+S.leg/400,.1,.7);
const gsChance=k=>clamp(S.pts.gs/130+(S.A.gsB||0)+(k||0),.05,.75);
const INCIDENTS=[
  // звонок в Генштаб: открывается приказом, не случайно. Генштабу подчинены только мотострелки; ВВ и ОМОН — это МВД, танки — Минобороны
  {id:'gs_call', who:'kolesn', cond:A=>false, h:'参謀本部への電話', p:()=>{const u=S.A.units.find(x=>x.id==='taman');return `将軍出身の代議員たちが参謀総長に電話をつないだ。コレスニコフは黙って耳を傾けている。彼の指揮下にある自動車化狙撃兵は、いま正面玄関にいる。士気 ${Math.round(uMorV(u))}%、死傷者 ${fmt(u.lost||0)}。参謀本部の支持は${S.pts.gs}%。国内軍とOMONは彼の管轄下になく、戦車部隊も同様だ。話ができるのはタマンスカヤ師団のことだけだ。`;},
   ch:[{t:'師団を建物から引き揚げるよう求める',d:()=>'成功率 '+Math.round(gsChance()*100)+'%：自動車化狙撃兵が完全に撤収する。失敗すればクレムリンに報告され、彼らの士気 +10',run:A=>{const u=A.units.find(x=>x.id==='taman'); if(Math.random()<gsChance()){u.cur=0;u.st='stopped';u.why='参謀本部が撤収';alog('自動車化狙撃兵：参謀本部が師団を建物から引き揚げさせた。');aBanner('自動車化狙撃兵：撤収','コレスニコフはタマンスカヤ師団に、ホワイトハウスからの撤収を命じた。',true);}else{u.mor0=uMorV(u);uMor(u,10);u.why='電話が裏目に';alog('コレスニコフは話を聞き終えると、受話器を置いた。1分後には、この電話の件がクレムリンに伝わっていた。','bad');aBanner('参謀本部は拒否','コレスニコフはこの電話の件をクレムリンに報告した。自動車化狙撃兵の士気 +10。',false);}}},
       {t:'急がないよう頼む：中隊を伏せさせて待たせる',d:()=>'確実：自動車化狙撃兵の士気 −15',rq:'参謀本部 30',req:()=>S.pts.gs>=30,run:A=>{const u=A.units.find(x=>x.id==='taman');u.mor0=uMorV(u);uMor(u,-15);u.why='参謀本部の時間稼ぎ';alog('参謀本部は命令を取り消しこそしないが、急かしもしない。自動車化狙撃兵は地面に伏せた。');}},
       {t:'大会の決議を読み上げる：命令は犯罪であり、責任は彼個人が負う',d:()=>'成功率 '+Math.round(gsChance(.2)*100)+'%：自動車化狙撃兵が撤退する。失敗すれば正統性 −3、彼らの士気 +10',rq:'正統性 60',req:()=>S.leg>=60,run:A=>{const u=A.units.find(x=>x.id==='taman'); if(Math.random()<gsChance(.2)){u.cur=0;u.st='stopped';u.why='参謀本部が撤収';alog('自動車化狙撃兵：コレスニコフは突入の責任を背負うことを拒んだ。師団は撤収した。');aBanner('自動車化狙撃兵：撤収','コレスニコフは、突入の責任を個人として負うことを拒んだ。',true);}else{u.mor0=uMorV(u);uMor(u,10);u.why='電話が裏目に';S.leg=clamp(S.leg-3,0,100);alog('コレスニコフは、大統領に忠誠を誓った身だと答えた。通話の録音はクレムリン寄りの記者たちへと渡った。','bad');}}}]},
  {id:'y_addr', cond:A=>A.r>=1, h:'エリツィンの声明', p:'午前9時、大統領がテレビ放送に登場する。「モスクワの武装反乱は鎮圧する。平和な街に刃向かった者どもには、当然の報いを受けさせる」。兵士たちは無線でその言葉を聞いている。',
   ch:[{t:'応じない',d:'全部隊の士気 +8 · 決意 −3',run:A=>{for(const u of A.units)uMor(u,8);S.hope=clamp(S.hope-3,0,100);}},
       {t:'生放送で反論する：撃たれているのは議場の代議員だ',d:'放送 −8 · 部隊の士気 −6',rq:'放送 30',req:()=>S.A.air>=30&&S.A.air>=8,run:A=>{S.A.air-=8;for(const u of A.units)uMor(u,-6);}},
       {t:'演説を館内に流す：何を約束されたか聞かせる',d:'決意 +4 · 過激化 +4',run:A=>{S.hope=clamp(S.hope+4,0,100);S.rad=clamp(S.rad+4,0,100);}}]},
  // тяни-толкай: когда часть встала или заколебалась, Ельцин один раз лично звонит её командиру. Вернуть каждую часть он может только однажды
  {id:'y_call', multi:1, prio:1, cond:A=>A.r>=1&&!!yCallUnit(A), h:'クレムリンからの電話', p:()=>{const u=yCallUnit(S.A),U=UNITS.find(x=>x.id===u.id);return `${U.nm}：士気 ${Math.round(uMorV(u))}%。部隊は動揺し、本来の半分の勢いでしか進んでいない。エリツィンが自ら指揮官に電話をかける。「拒めばどうなるか、分かっているな？　前進しろ」。だが、その檄が届くのはまだ戦っている部隊だけで、それも一度きりだ。部隊が立ち止まってしまえば、もう誰にも動かせない。`;},
   ch:[{t:'介入しない',d:()=>'部隊の士気 +'+yCallGain(S.A),run:A=>{const u=yCallUnit(A),g=yCallGain(A);u.called=1;u.mor0=uMorV(u);uMor(u,g);u.why='エリツィンの電話';}},
       {t:'彼らの無線周波数に割り込む：「指揮官、その命令は犯罪だ。責任を問われるのはあなただ」',d:()=>'放送 −10 · 部隊の士気はわずか +'+Math.round(yCallGain(S.A)/3),rq:'放送 10',req:()=>S.A.air>=10,run:A=>{const u=yCallUnit(A),g=yCallGain(A);u.called=1;u.mor0=uMorV(u);A.air-=10;uMor(u,Math.round(g/3));u.why='電話を妨害';}},
       {t:'白旗を掲げた将校出身の代議員を送る',d:()=>'成功率 '+Math.round(yCallTalk(S.A)*100)+'%：部隊が完全に撤収する。失敗すれば士気 +'+yCallGain(S.A)+'、決意 −3',run:A=>{const u=yCallUnit(A),U=UNITS.find(x=>x.id===u.id),g=yCallGain(A),ok=Math.random()<yCallTalk(A);u.called=1; if(ok){u.cur=0;u.st='stopped';u.why='部隊ごと離脱';alog(U.nm+'：指揮官は代議員の説得を聞き入れ、部隊を引き揚げさせた。');aBanner(U.nm.toUpperCase()+'：離脱','指揮官は代議員の説得を受け入れ、部隊を建物から引き揚げさせた。',true);}else{u.mor0=uMorV(u);uMor(u,g);u.why='エリツィンの電話';S.hope=clamp(S.hope-3,0,100);alog('軍使は指揮官に近づくことすらできなかった。','bad');}}}]},
  {id:'y_order', cond:A=>A.r>=4&&A.units.some(u=>u.cur>3&&u.mor<=45), h:'署名入りの命令', p:'各部隊の指揮官のもとへ、大統領直筆の署名入り命令書が届けられた。もはや拒否はためらいでは済まない。待っているのは軍法会議だ。',
   ch:[{t:'何もしない',d:'全部隊の士気 +15',run:A=>{for(const u of A.units)if(u.cur>3)uMor(u,15);}},
       {t:'放送で念を押す：命令は違法であり、責任は実行した者が負う',d:'放送 −10 · 士気は+15ではなく+5',rq:'正統性 50',req:()=>S.leg>=50&&S.A.air>=10,run:A=>{S.A.air-=10;for(const u of A.units)if(u.cur>3)uMor(u,5);}}]},
  // ----- части Кремля: кто отказывается, кто переходит, кого дожимают. Зависит от отношений со структурой -----
  {id:'u_tank', cond:A=>uOn(A,'tanks'), h:'乗員がエンジンを切った', p:'橋の上の戦車が1両、沈黙した。車長が無線の公開回線で問いかけている。議会を砲撃した責任は誰が取るのか、命令を拒んだ者はどうなるのか、と。',
   ch:[{t:'黙っている',d:'戦車 −10%',run:A=>uMul(A,'tanks',.9)},
       {t:'最高会議の名で保証する：拒否した者には手出しさせない',d:'戦車 −35%',rq:'正統性 60',req:()=>S.leg>=60,run:A=>uMul(A,'tanks',.65)},
       {t:'寝返りを誘う：「砲を逆に向けろ」',d:'戦車が正面玄関の守りにつく：入口 +15 · 過激化 +5 · 放送 −10',rq:'国防省 55',req:()=>S.pts.mo>=55,run:A=>{uMul(A,'tanks',.75);A.ctl.front=Math.min(100,A.ctl.front+15);S.rad=clamp(S.rad+5,0,100);A.air=Math.max(0,A.air-10);}}]},
  {id:'u_paid', pic:'tank', cond:A=>uOn(A,'tanks')&&S.pts.mo<50&&A.r>=1, h:'金で雇われた戦車兵', p:'徴集兵たちは発砲を拒否した。戦車には志願した将校たちが乗り込んでいる。一人ひとりに金と住宅が約束されており、砲手はいずれも熟練ぞろいだ。',
   ch:[{t:'何もしない',d:'戦車 +25%',run:A=>uMul(A,'tanks',1.25)},
       {t:'放送で実名と報酬額を暴露する',d:'放送 +2 · 戦車 +5%',rq:'放送 8',req:()=>S.A.air>=8,run:A=>{S.A.air-=8;uMul(A,'tanks',1.05);A.air=Math.min(100,A.air+10);}},
       {t:'師団長に電話する：「志願者を降ろせ」',d:'戦車 −15%',rq:'国防省 40',req:()=>S.pts.mo>=40&&!S.flags.noComms,run:A=>uMul(A,'tanks',.85)}]},
  {id:'u_vv', cond:A=>uOn(A,'vv'), h:'動かない連隊', p:'国内軍の連隊長から無線が入った。部下に議会を撃たせる気はないが、こちらに寝返るつもりもないという。自分たちに何を望むのか、と尋ねている。',
   ch:[{t:'兵を兵舎へ引き揚げさせる',d:'国内軍 −25%',run:A=>uMul(A,'vv',.75)},
       {t:'双方の間に隊列を敷くよう頼む',d:'国内軍 −45% · 20番玄関 +8',rq:'内務省 45',req:()=>S.pts.mvd>=45,run:A=>{uMul(A,'vv',.55);A.ctl.entr=Math.min(100,A.ctl.entr+8);}},
       {t:'武器を携えて寝返るよう要求する',d:'成功率 50%：義勇兵 +80、武器 +80 · 失敗すれば連隊の反感を買い、国内軍 +15%',rq:'過激化 50%',req:()=>S.rad>=50,run:A=>{if(Math.random()<.5){S.mil+=80;S.gun+=80;uMul(A,'vv',.7);alog('国内軍の連隊が最高会議側に寝返った。');}else{uMul(A,'vv',1.15);alog('連隊長は一方的に通信を切った。国内軍が前進してくる。','bad');}}}]},
  {id:'u_omon', cond:A=>uOn(A,'omon'), h:'OMONが停止', p:'モスクワのOMONが正面玄関の前で足を止めた。隊員たちは、建物の中には武装集団しかいないと聞かされている。指揮官が拡声器で叫ぶ。「中に誰がいるのか姿を見せろ」',
   ch:[{t:'頭上への威嚇射撃で応える',d:'OMON +10% · 決意 +2',run:A=>{uMul(A,'omon',1.1);S.hope=clamp(S.hope+2,0,100);}},
       {t:'身分証を持った代議員を階段に出す',d:'OMONが撤収',rq:'定足数：代議員'+QUORUM+'人',req:()=>deputies(S)>=QUORUM,run:A=>uStop(A,'omon','代議員の姿を見て、部隊は建物から引き揚げた')},
       {t:'市庁舎の捨て駒にされたのだと訴える',d:'OMON −40%',rq:'市庁舎 40',req:()=>S.pts.mer>=40,run:A=>uMul(A,'omon',.6)}]},
  {id:'u_general', cond:A=>A.r>=2&&A.units.some(u=>uState(u)==='waver'), h:'橋の上の将軍', p:'クレムリンは動揺する部隊のもとへ、命令書を携えた将軍を送り込んだ。従わなければ軍法会議だと脅し、将軍は隊列を巡って指揮官たちの目をのぞき込む。',
   ch:[{t:'待つ',d:'動揺していた部隊が総攻撃に出る',run:A=>{for(const u of A.units)if(uState(u)==='waver'){u.st='attack';u.mor=70;}}},
       {t:'将軍出身の代議員を差し向ける',d:'部隊は動揺したまま、戦力 15%減',rq:'参謀本部 45',req:()=>S.pts.gs>=45,run:A=>{for(const u of A.units)if(u.st==='waver')u.cur*=.85;}},
       {t:'命令書を持つ将軍を生中継で映す',d:'放送 −15 · 動揺する部隊の一つが撤収し、残りは攻撃に出る',rq:'放送 40',req:()=>S.A.air>=40,run:A=>{A.air-=15;const w=A.units.filter(u=>uState(u)==='waver').sort((a,b)=>b.cur-a.cur);if(w[0])uStop(A,w[0].id,'カメラを避けて撤収した');for(const u of w.slice(1)){u.st='attack';u.cur=UNITS.find(x=>x.id===u.id).str;}}}]},
  {id:'u_tula', cond:A=>A.r>=5&&S.pts.gs<50, h:'トゥーラの空挺部隊', p:'トゥーラ師団の連隊がモスクワに到着した。連隊長は、どちらの味方として連れてこられたのかも分からぬまま、モスクワ環状道路で待機している。',
   ch:[{t:'何もしない',d:'自動車化狙撃兵 +35%',run:A=>uMul(A,'taman',1.35,1)},
       {t:'無線で連隊長に呼びかける',d:'放送 −10 · 成功率 45%：連隊はモスクワ環状道路にとどまる',rq:'放送 10',req:()=>S.A.air>=10,run:A=>{S.A.air-=10;if(Math.random()<.45)alog('トゥーラの連隊はモスクワ環状道路にとどまり、市内へは入らない。');else{uMul(A,'taman',1.35,1);alog('空挺部隊が市内に入った。','bad');}}},
       {t:'大通りを人垣でふさぐ',d:'市民 −400 · 自動車化狙撃兵 +10%',rq:'市民 1500',req:()=>S.ppl>=1500,run:A=>{S.ppl-=400;uMul(A,'taman',1.1,1);}}]},
  {id:'u_column', cond:A=>A.r>=3&&S.pts.gs>=55, h:'号令を待つ車列', p:'モスクワ近郊の部隊の指揮官から、秘匿回線で電話が入った。部隊を率いてホワイトハウスへ向かう用意はある、必要なのは命令と署名だけだという。',
   ch:[{t:'断る：軍同士で撃ち合ってはならない',d:'放送 +10 · 決意 −2',run:A=>{A.air=Math.min(100,A.air+10);S.hope=clamp(S.hope-2,0,100);}},
       {t:'モスクワ環状道路で待機させる',d:'クレムリン側の全部隊 −12%',run:A=>{for(const u of A.units)u.cur*=.88;}},
       {t:'命令に署名する：部隊を市内へ',d:'義勇兵 +150 · 武器 +150 · 決意 +6 · 過激化 +10 · 放送 −20',rq:'過激化 50%',req:()=>S.rad>=50,run:A=>{S.mil+=150;S.gun+=150;A.ammo+=150;S.hope=clamp(S.hope+6,0,100);S.rad=clamp(S.rad+10,0,100);A.air=Math.max(0,A.air-20);}}]},
  {id:'u_cops', cond:A=>S.pts.mvd>=50, h:'警官隊が寝返った', p:'20番玄関に、地区警察署の警官30人ほどが官給の銃を携えてやって来た。年長の警官が言う。「我々が忠誠を誓ったのは法に対してだ」',
   ch:[{t:'窓際の守りにつける',d:'義勇兵 +40 · 武器 +40',run:A=>{S.mil+=40;S.gun+=40;}},
       {t:'制服姿のまま、負傷者と女性たちを連れ出させる',d:'負傷者を搬出 · 放送 +10',run:A=>{A.wnd=0;A.air=Math.min(100,A.air+10);}},
       {t:'送り返す：同僚たちを説得させる',d:'国内軍とOMON −15%',run:A=>{uMul(A,'vv',.85);uMul(A,'omon',.85);}}]},
  {id:'u_back', cond:A=>false&&A.r>=3&&A.units.some(u=>(u.st==='refuse'||u.st==='stopped')&&u.id!=='alpha'), h:'拒否部隊への締め付け', p:'突入を拒んだ部隊の指揮官が更迭された。新たな指揮官が報奨金と命令を携えて着任し、兵士たちは再び隊列を組まされている。',
   ch:[{t:'何もしない',d:'部隊が半分の戦力で復帰する',run:A=>uBack(A,.5)},
       {t:'兵士たちに呼びかける：「君たちは二度だまされている」',d:'放送 −10 · 部隊は4分の1の戦力で復帰',rq:'放送 10',req:()=>S.A.air>=10,run:A=>{S.A.air-=10;uBack(A,.25);}},
       {t:'解任された指揮官を指揮官代行と宣言する',d:'部隊はその場にとどまる',rq:'正統性 65',req:()=>S.leg>=65,run:A=>alog('兵士たちは元の指揮官に従っている。')}]},
  {id:'floor', cond:A=>A.fire>=3, h:'12階が燃えている', p:'火の手はケーブルシャフトを伝って燃え広がっている。上層階には大会の文書庫と、逃げ遅れた人々がいる。',
   ch:[{t:'消火に人を送る',d:'市民 −150 · 火災 −5',run:A=>{S.ppl=Math.max(0,S.ppl-150);A.fire=Math.max(0,A.fire-5);}},
       {t:'川からバケツリレーをする',d:'市民 −60 · 火災 −8',rq:'市民 1000',req:()=>S.ppl>=1000,run:A=>{S.ppl-=60;A.fire=Math.max(0,A.fire-8);}},
       {t:'その階を放棄する',d:'火災 +2 · 決意 −4',run:A=>{A.fire=Math.min(15,A.fire+2);S.hope=clamp(S.hope-4,0,100);}}]},
  {id:'wounded', cond:A=>A.wnd>=40, h:'20番玄関の負傷者', p:'包帯が尽き、医師たちはシーツを裂いて処置にあたっている。通りの向こうには救急車が待機しているが、封鎖線に阻まれて近づけない。',
   ch:[{t:'銃火の中を運び出す',d:'負傷者 −60% · 義勇兵 −20',run:A=>{A.wnd=Math.round(A.wnd*.4);S.mil=Math.max(0,S.mil-20);}},
       {t:'内務省の将校に通路を開けてもらう',d:'負傷者を搬出 · 放送 +10',rq:'内務省 30',req:()=>S.pts.mvd>=30,run:A=>{A.wnd=0;A.air=Math.min(100,A.air+10);}},
       {t:'日没まで動かさない',d:'決意 −6',run:A=>{S.hope=clamp(S.hope-6,0,100);}}]},
  {id:'cnn', cond:A=>true, h:'生中継', p:'向かいの屋上に据えられたCNNのカメラが、建物の姿を世界中に中継している。カメラマンが手を振り、誰か画面の前に出てくれと合図している。',
   ch:[{t:'ハズブラートフが窓際に立つ',d:'放送 +20',run:A=>{A.air=Math.min(100,A.air+20);}},
       {t:'代議員や女性を映し、自動小銃を持つ者は下がらせる',d:'放送 +35',rq:'過激化 40%以下',req:()=>S.rad<=40,run:A=>{A.air=Math.min(100,A.air+35);}},
       {t:'カメラどころではない',d:'決意 +2',run:A=>{S.hope=clamp(S.hope+2,0,100);}}]},
  {id:'snipers', cond:A=>true, h:'屋上の狙撃手', p:'正体不明の狙撃手が屋上から、こちらの人々にも部隊の兵士にも発砲している。双方が相手の仕業だと思い込んでいる。',
   ch:[{t:'人々を物陰に避難させる',d:'正面玄関 −8',run:A=>{A.ctl.front=Math.max(1,A.ctl.front-8);}},
       {t:'自力で狙撃手を排除する',d:'義勇兵 −15 · 決意 +4',rq:'義勇兵 150',req:()=>S.mil>=150,run:A=>{S.mil-=15;S.hope=clamp(S.hope+4,0,100);}},
       {t:'放送で訴える：「撃っているのは我々ではない」',d:'放送 −10 · 国内軍が弱まる',rq:'放送 30',req:()=>S.A.air>=30,run:A=>{A.air-=10;const u=A.units.find(x=>x.id==='vv');u.cur*=.75;}}]},
  {id:'parley', cond:A=>A.r>=2, h:'軍使', p:'白旗を掲げた将校が、女性と負傷者を外へ出すための30分間の停戦を申し出てきた。そのあとはもっとひどい攻撃になる、と彼は言う。',
   ch:[{t:'受け入れる',d:'市民 −300 · 負傷者を搬出 · 決意 −3',run:A=>{S.ppl=Math.max(0,S.ppl-300);A.wnd=0;S.hope=clamp(S.hope-3,0,100);}},
       {t:'仲介者を求める：総主教、憲法裁判所、地方',d:'放送 +15 · 攻勢が弱まる',rq:'正統性 70',req:()=>S.leg>=70,run:A=>{A.air=Math.min(100,A.air+15);for(const u of A.units)u.cur*=.9;}},
       {t:'拒否する',d:'決意 +3',run:A=>{S.hope=clamp(S.hope+3,0,100);}}]},
  {id:'hall', pic:'tank', cond:A=>A.units.find(u=>u.id==='tanks').cur>0, h:'議場に砲弾', p:'炸薬のない砲弾が議場の壁を撃ち抜いた。代議員たちは座席の間に身を伏せている。地下室へ下りようと言い出す者もいる。',
   ch:[{t:'全員地下室へ',d:'決意 −4',run:A=>{S.hope=clamp(S.hope-4,0,100);}},
       {t:'審議を続ける',d:'決意 +5 · 放送 +10 · 代議員10人が去る',rq:'決意 50%',req:()=>S.hope>=50,run:A=>{S.hope=clamp(S.hope+5,0,100);A.air=Math.min(100,A.air+10);S.fac.kol.n=Math.max(0,S.fac.kol.n-10);}}]},
  {id:'ammo', cond:A=>A.r>=1, h:'弾薬', p:'各玄関に残る弾薬は、銃1丁につき弾倉1本分だけだ。指揮官たちは、どこで補充すればいいのかと尋ねている。',
   ch:[{t:'単発で撃つ',d:'弾薬 +40 · 両入口 −6',run:A=>{A.ammo+=40;A.ctl.entr=Math.max(1,A.ctl.entr-6);A.ctl.front=Math.max(1,A.ctl.front-6);}},
       {t:'各階と非武装の者から集める',d:'弾薬 +100 · 市民 −80',rq:'市民 500',req:()=>S.ppl>=500,run:A=>{A.ammo+=100;S.ppl-=80;}},
       {t:'非常用の備蓄を開ける',d:'弾薬 +200',rq:'武器 300',req:()=>S.gun>=300,run:A=>{A.ammo+=200;}}]},
  {id:'crowd', cond:A=>S.city>=35, h:'河岸通り', p:'橋の上や河岸通りに、数千人のモスクワ市民が集まっている。まるで映画でも見るように眺める者もいれば、建物へ向かおうとする者もいる。',
   ch:[{t:'射線から離れるよう頼む',d:'決意 +1',run:A=>{S.hope=clamp(S.hope+1,0,100);}},
       {t:'人間の鎖で建物を囲むよう呼びかける',d:'1時間後に +800人 · 放送 +10',rq:'モスクワ 55%',req:()=>S.city>=55,run:A=>{A.incoming+=800;A.air=Math.min(100,A.air+10);}}]},
  {id:'water', cond:A=>A.fire>=2, h:'消火栓は空', p:'建物の水道は1週間前から止められたままだ。消火ホースは空で、消火器も尽きかけている。',
   ch:[{t:'銃火の中、川から水を運ぶ',d:'市民 −120 · 火災 −4',run:A=>{S.ppl=Math.max(0,S.ppl-120);A.fire=Math.max(0,A.fire-4);}},
       {t:'バリケードの砂をかけて消火する',d:'火災 −5 · 両入口 −5',run:A=>{A.fire=Math.max(0,A.fire-5);A.ctl.entr=Math.max(1,A.ctl.entr-5);A.ctl.front=Math.max(1,A.ctl.front-5);}},
       {t:'燃えるに任せる',d:'火災 +2',run:A=>{A.fire=Math.min(15,A.fire+2);}}]},
  {id:'defect', cond:A=>A.units.some(u=>u.id==='taman'&&u.cur>0), h:'寝返る兵士たち', p:'自動車化狙撃兵の1個小隊が基壇の陰に伏せたまま、撃とうとしない。中尉が、こんな戦いに加わりたくはないと叫んでいる。',
   ch:[{t:'立ち去るよう叫ぶ',d:'自動車化狙撃兵が弱まる',run:A=>{const u=A.units.find(x=>x.id==='taman');u.cur*=.85;}},
       {t:'武器ごと中へ引き入れる',d:'義勇兵 +30 · 武器 +60',rq:'参謀本部 40',req:()=>S.pts.gs>=40,run:A=>{S.mil+=30;S.gun+=60;const u=A.units.find(x=>x.id==='taman');u.cur*=.8;}},
       {t:'テレビで彼らを映す',d:'放送 +15',rq:'放送 20',req:()=>S.A.air>=20,run:A=>{A.air=Math.min(100,A.air+15);}}]},
  {id:'cellar', cond:A=>A.r>=2, h:'地下室', p:'防空壕には数百人の女性たちが身を寄せている。食堂の店員やタイピスト、それに職員の子どもたちもいる。もう上の階へは戻れない。',
   ch:[{t:'20番玄関から避難させる',d:'市民 −200 · 放送 +10 · 20番玄関 −6',run:A=>{S.ppl=Math.max(0,S.ppl-200);A.air=Math.min(100,A.air+10);A.ctl.entr=Math.max(1,A.ctl.entr-6);}},
       {t:'日没まで地下室にとどまらせる',d:'決意 −3',run:A=>{S.hope=clamp(S.hope-3,0,100);}}]},
  {id:'btr', cond:A=>A.r>=3, h:'戦利品', p:'正面玄関の前に、弾薬を満載した装甲兵員輸送車が乗り捨てられている。乗員は逃げ去った。',
   ch:[{t:'敵に渡さぬよう燃やす',d:'正面玄関 +4',run:A=>{A.ctl.front=Math.min(100,A.ctl.front+4);}},
       {t:'味方を乗り込ませ、機関銃を敵に向ける',d:'正面玄関 +15 · 武器 +80 · 放送 −10',rq:'義勇兵 250',req:()=>S.mil>=250,run:A=>{A.ctl.front=Math.min(100,A.ctl.front+15);S.gun+=80;A.air=Math.max(0,A.air-10);}}]},
  {id:'planes', cond:A=>A.r>=1, h:'無線で叫ぶルツコイ', p:'副大統領が無線の公開回線で叫ぶ。「同志諸君、飛行機を飛ばせ！」　その叫びを、パイロットも、記者も、クレムリンも聞いている。',
   ch:[{t:'叫ばせておく',d:'決意 +4 · 放送 −15',run:A=>{S.hope=clamp(S.hope+4,0,100);A.air=Math.max(0,A.air-15);}},
       {t:'無線機を取り上げる：世界に仲介を求める',d:'放送 +10',rq:'決意 40%',req:()=>S.hope>=40,run:A=>{A.air=Math.min(100,A.air+10);}}]},
  {id:'truce', cond:A=>A.r>=6, h:'静寂の1時間', p:'クレムリンが、負傷者を収容するための1時間の停戦を提案してきた。その1時間のうちに増援が到着することは、双方とも承知している。',
   ch:[{t:'受け入れる',d:'負傷者を搬出 · 両入口 +6 · クレムリン側の部隊が増強',run:A=>{A.wnd=0;A.ctl.entr=Math.min(100,A.ctl.entr+6);A.ctl.front=Math.min(100,A.ctl.front+6);for(const u of A.units)if(u.cur>3)u.cur*=1.12;}},
       {t:'拒否する',d:'決意 +2',run:A=>{S.hope=clamp(S.hope+2,0,100);}},
       {t:'受け入れ、記者を負傷者のもとへ案内する',d:'同上 · 放送 +20',rq:'放送 25',req:()=>S.A.air>=25,run:A=>{A.wnd=0;A.air=Math.min(100,A.air+20);A.ctl.entr=Math.min(100,A.ctl.entr+6);A.ctl.front=Math.min(100,A.ctl.front+6);for(const u of A.units)if(u.cur>3)u.cur*=1.12;}}]},
  {id:'rne', cond:A=>S.fac.rne.n>0, h:'バルカショフ派が去る', p:'RNEが地下道への入り口を見つけ、手遅れになる前に脱出しようとしている。銃の3分の1が彼らとともに消えてしまう。',
   ch:[{t:'行かせる',d:'RNEが建物を去る',run:A=>{S.fac.rne.n=0;}},
       {t:'隊列の前で恥を知れと叱りつける',d:'残留 · 決意 +2',rq:'決意 60%',req:()=>S.hope>=60,run:A=>{S.hope=clamp(S.hope+2,0,100);}},
       {t:'武器と引き換えに残らせる',d:'武器 −100 · 残留',rq:'武器 100',req:()=>S.gun>=100,run:A=>{S.gun-=100;if(S.mil>S.gun)S.mil=S.gun;}}]},
];
function incidentCard(){const A=S.A; if(!A||screen!=='assault')return;
  let I=A.card==='inc'&&INCIDENTS.find(x=>x.id===A.incId);
  if(!I){const pool=INCIDENTS.filter(x=>!A.inc[x.id]&&x.cond(A)); if(!pool.length)return; const pr=pool.filter(x=>x.prio); I=pr.length?pr[0]:pool[Math.floor(Math.random()*pool.length)];}
  if(A.card!=='inc')Sfx.play(/^u_|^y_/.test(I.id)?'static':'alarm',1.2);
  A.card='inc'; A.incId=I.id; save();
  const tk=I.pic==='tank'&&uOn(A,'tanks'), who=/^y_/.test(I.id)?'yeltsin':I.who, yel=!!who||tk, body=`<h2>${I.h}</h2><div class="sub">${typeof I.p==='function'?I.p():I.p}</div>`+I.ch.map((c,i)=>{const lk=c.req&&!c.req();
    return `<div class="law${lk?' lock':''}" data-i="${i}"><div class="t">${i+1}. ${c.t}</div><div class="e">${typeof c.d==='function'?c.d():c.d}${c.rq?` · <span class="${lk?'n':'p'}">${lk?'必要':'達成'}：${c.rq}</span>`:''}</div></div>`;}).join('');
  $('modal-win').innerHTML=tk?`<div class="incy"><div class="ph"><img src="${tankShotURL()}"><b>ノヴォアルバーツキー橋</b><small>戦車が建物を砲撃</small></div><div>${body}</div></div>`:yel?`<div class="incy"><div class="ph"><img src="${who==='yeltsin'?ASSET_YELTSIN:PEOPLE[who].img}"><b>${who==='yeltsin'?'ボリス・エリツィン':PEOPLE[who].nm.toUpperCase()}</b><small>${who==='yeltsin'?'直通電話で':PEOPLE[who].role+'、直通電話で'}</small></div><div>${body}</div></div>`:body;
  $('modal').classList.add('on');
  $('modal-win').querySelectorAll('.law').forEach(e=>e.onclick=()=>incChoose(+e.dataset.i));
}
function incChoose(i){const A=S.A, I=INCIDENTS.find(x=>x.id===A.incId), c=I&&I.ch[i]; if(!c||(c.req&&!c.req()))return;
  A.card=0; if(!I.multi)A.inc[I.id]=1; $('modal').classList.remove('on'); c.run(A); alog(I.h+'：'+c.t+'。');
  if(S.hope<=0)return finale('broken'); save(); renderAssault();}
const A_ORDERS=[
  {t:'反撃',                 d:'入口 +20 · 戦闘員 −50 · 敵の士気 −7', req:()=>S.mil>=50||'戦闘員が50人必要',
   run:()=>{const s=S.A.ctl.entr<=S.A.ctl.front?'entr':'front';S.A.ctl[s]=Math.min(100,S.A.ctl[s]+20);S.mil-=50;for(const u of S.A.units)if(UNITS.find(x=>x.id===u.id).target===s&&u.cur>3){uMor(u,-7);u.lost=(u.lost||0)+15;}alog('「'+SECTORS.find(x=>x.id===s).nm+'」で反撃に出た。');}},
  {t:'手薄な入口をふさぐ',      d:'市民 −100 · 入口 +10', req:()=>S.ppl>=100||'100人必要',
   run:()=>{const s=S.A.ctl.entr<=S.A.ctl.front?'entr':'front';S.ppl-=100;S.A.ctl[s]=Math.min(100,S.A.ctl[s]+10);alog('人々が家具や金庫を「'+SECTORS.find(x=>x.id===s).nm+'」へ運び込む。');}},
  {t:'参謀本部に電話',           d:()=>'コレスニコフと自動車化狙撃兵について話し合う', once:1, req:()=>S.flags.noComms?'通信途絶':deputies(S)<5?'代議員がいない':uEff(S.A.units.find(u=>u.id==='taman'))>0||'自動車化狙撃兵は戦っていない',
   run:()=>{const A=S.A; A.card='inc'; A.incId='gs_call'; incidentCard();}},
  {t:'代議員を議場へ',          d:'決意 +8', once:1, req:()=>true, run:()=>{S.hope=clamp(S.hope+8,0,100);alog('砲火の中、大会は審議を続けている。人々は持ちこたえている。');}},
  {t:'消火する',               d:'市民 −100 · 火災 −6', req:()=>(S.A.fire>=1&&S.ppl>=100)||(S.A.fire<1?'燃えているものはない':'100人必要'),
   run:()=>{S.ppl-=100;S.A.fire=Math.max(0,S.A.fire-6);alog('志願者たちが各階の消火にあたる。');}},
  {t:'市民を武装させる',            d:()=>{const k=Math.min(100,S.ppl,freeGuns(S));return '市民 −'+k+' · 義勇兵 +'+k;}, req:()=>(S.ppl>=20&&freeGuns(S)>=20)||(freeGuns(S)<20?'空いている銃がない':'人手がない'),
   run:()=>{const k=Math.min(100,S.ppl,freeGuns(S));S.ppl-=k;S.mil+=k;alog('さらに'+k+'人が武器を受け取り、窓際についた。');}},
  {t:'戦闘員に食料と水',          d:'物資 −2 · 決意 +5', req:()=>S.A.stock>=2||'物資が2必要',
   run:()=>{S.A.stock-=2;S.hope=clamp(S.hope+5,0,100);alog('各階にパンとお茶、水が配られる。');}},
  {t:'負傷者に包帯',  d:'物資 −2 · 負傷者 −60%', req:()=>S.A.wnd<20?'負傷者は少ない':S.A.stock>=2||'物資が2必要',
   run:()=>{S.A.stock-=2;S.A.wnd=Math.round(S.A.wnd*.4);alog('20番玄関で、最後の包帯の箱が開けられた。');}},
  {t:'バリケードに軽油',       d:'物資 −3 · 手薄な入口 +12 · 火災 +1', req:()=>S.A.stock>=3||'物資が3必要',
   run:()=>{const s=S.A.ctl.entr<=S.A.ctl.front?'entr':'front';S.A.stock-=3;S.A.ctl[s]=Math.min(100,S.A.ctl[s]+12);S.A.fire+=1;alog('「'+SECTORS.find(x=>x.id===s).nm+'」のバリケードに軽油をまき、火を放った。');}},
  {t:'白旗',                 d:'降伏する', flag:1, req:()=>true, run:()=>ending('surrender')},
];
// ---------- the air during the assault: what you ask the world for. One request an hour, paid in Эфир ----------
const AIR=[
  {t:'モスクワ市民を建物へ呼ぶ', cost:10, d:()=>`1時間後に${fmt(300+S.city*10)}人が来る`, run:A=>{A.incoming+=300+S.city*10;alog('放送：モスクワ市民にホワイトハウスへの結集を呼びかけた。');}},
  {t:'負傷者搬出のための停戦を求める', cost:8, d:()=>`成功率 ${Math.round(Math.min(.9,.3+S.A.air/100)*100)}%：負傷者を搬出、決意 +3`, req:()=>S.A.wnd>=20||'負傷者は少ない',
   run:A=>{if(Math.random()<Math.min(.9,.3+A.air/100)){A.wnd=0;S.hope=clamp(S.hope+3,0,100);alog('銃撃が20分間やんだ。救急車が負傷者を運び出した。');}else alog('停戦は拒否された。','bad');}},
  {t:'兵士に呼びかける：「撃つな」', cost:12, d:()=>`成功率 ${Math.round(Math.min(.45,.1+S.A.air/200)*100)}%：動揺する部隊が一つ停止する。失敗しても攻勢 −6%`,
   run:A=>{const g=A.units.filter(u=>uState(u)==='waver').sort((a,b)=>a.cur-b.cur)[0];
     if(g&&Math.random()<Math.min(.45,.1+A.air/200)){g.cur=0;g.st='stopped';alog(UNITS.find(x=>x.id===g.id).nm+'：呼びかけを聞き入れ、射撃をやめた。');}else{for(const u of A.units){u.cur*=.94;uMor(u,-5);}alog('兵士たちは耳を傾けるが、命令は命令だ。銃撃はまばらになった。');}}},
  {t:'火災と負傷者を世界に見せる', cost:0, d:()=>'放送 +15', run:A=>{A.air=Math.min(100,A.air+15);alog('燃える議会の映像が、世界中のチャンネルで流れている。');}},
  {t:'命令を下した指揮官を名指しする', cost:10, d:()=>'戦車 −25%、戦車兵の士気 −15、過激化 +3', req:()=>S.A.units.find(u=>u.id==='tanks').cur>0||'戦車は沈黙している',
   run:A=>{A.units.find(u=>u.id==='tanks').cur*=.75;uMor(A.units.find(u=>u.id==='tanks'),-15);S.rad=clamp(S.rad+3,0,100);alog('放送で指揮官の名前と部隊番号が読み上げられる。戦車2両がエンジンを止めた。');}},
  {t:'憲法裁判所と地方に仲介を求める', cost:15, d:()=>'攻勢 −10%、決意 +4', req:()=>S.leg>=50||'正統性 50が必要',
   run:A=>{for(const u of A.units)u.cur*=.9;S.hope=clamp(S.hope+4,0,100);alog('ゾリキンと地方の首長たちが停戦を要求している。');}},
  {t:'兵士たちに自軍の損害を突きつける', cost:8, d:()=>'全部隊の士気 −5、損害を出した部隊は −10', run:A=>{for(const u of A.units)if(u.cur>3)uMor(u,(u.lost||0)>=40?-10:-5);alog('拡声器で戦死した兵士の名が読み上げられる。兵の列が静まり返る。');}},
  {t:'医師と救急車を要請する', cost:5, d:()=>'負傷者が半減', req:()=>S.A.wnd>=20||'負傷者は少ない', run:A=>{A.wnd=Math.round(A.wnd/2);alog('志願した医師たちが封鎖線を越えてきた。');}},
];
const airGain=()=>1+Math.floor(OUTLETS.filter(o=>outSt(S,o)==='vs').length/4)+(S.pts.ost>=100?2:0);
const airCost=o=>o.cost*(S.flags.noComms?2:1);
function airState(i){const o=AIR[i],A=S.A; if(A.airUsed)return 'この時間はすでに放送した'; if(S.A.air<airCost(o))return '放送が'+airCost(o)+'必要'; const r=o.req?o.req():true; return r;}
function openAir(){const A=S.A; if(!A||screen!=='assault'||A.card)return;
  $('modal-win').innerHTML=`<h2>ホワイトハウスからの放送</h2><div class="sub">放送：<b style="color:var(--paper)">${Math.round(A.air)}</b>／100。味方の媒体から毎時 +${airGain()}。放送の値が高いあいだは世界が注目しています。攻勢は弱まり、部隊の士気は下がり、60以上なら動揺する部隊が停止することもあります。呼びかけには放送を消費します。呼びかけは1時間に1回までで、命令の回数は減りません。${S.flags.noComms?'<span class="n">通信が途絶しているため、外国メディア経由でしか放送できません。費用はすべて2倍になります。</span>':''}放送の値が高いほど攻勢は弱まり、呼びかけも聞き入れられやすくなります。</div><div class="app2">`+
    AIR.map((o,i)=>{const st=airState(i);return `<div class="law${st!==true?' lock':''}" data-i="${i}"><div class="t">${o.t} <span class="cst">${airCost(o)?"放送 −"+airCost(o):"無料"}</span></div><div class="e">${st===true?o.d():`<span class="n">${st}</span>`}</div></div>`;}).join('')+
    `</div><div class="close">ESC ― 閉じる</div>`;
  $('modal').classList.add('on');
  $('modal-win').querySelectorAll('.law').forEach(e=>e.onclick=()=>{const i=+e.dataset.i; if(airState(i)!==true)return; Sfx.play('static');Sfx.play('pips',.7); S.A.air-=airCost(AIR[i]); A.airUsed=1; AIR[i].run(A); $('modal').classList.remove('on'); save(); renderAssault();});
  $('modal-win').querySelector('.close').onclick=closeModal;
}
function aOrderState(i){const o=A_ORDERS[i],A=S.A; if(o.once&&A.once[i])return '実行済み'; if(A.used[i])return 'この時間は実施済み';
  const r=o.req(); if(r!==true)return r; if(!A.orders&&!A_ORDERS[i].flag)return '命令が残っていない'; return true;}
function doAOrder(i){if(aOrderState(i)!==true)return; Sfx.play(['burst','thud','phone','crowd','fire','bolt','paper','lose'][i]||'click');const A=S.A; A.used[i]=1; if(A_ORDERS[i].once)A.once[i]=1; if(!A_ORDERS[i].flag)A.orders--;
  A_ORDERS[i].run(); if(screen==='assault'){save();renderAssault();}}
function moveShare(s,d){const A=S.A, sh=A.shares; if(d>0){const o=Object.keys(sh).filter(k=>k!==s&&sh[k]>=10).sort((a,b)=>sh[b]-sh[a])[0];if(!o)return;sh[o]-=10;sh[s]+=10;}
  else{if(sh[s]<10)return;const o=Object.keys(sh).filter(k=>k!==s).sort((a,b)=>sh[a]-sh[b])[0];sh[s]-=10;sh[o]+=10;}
  save();renderAssault();}

function renderAssault(){
  const A=S.A; const F=defForce();
  $('a-time').textContent=dateStr(S.day).toUpperCase()+' '+HOURS[Math.min(A.r,HOURS.length-1)];
  $('a-round').textContent='戦闘 '+(A.r+1)+'/'+HOURS.length+'時間 · 日没まで';
  const fireL=A.fire>0?Math.round(A.fire/5):0, wndL=A.wnd>=40?Math.min(6,Math.round(A.wnd/80)):0;
  const R=[['ppl','市民',fmt(S.ppl),''],['mil','義勇兵',fmt(S.mil),A.ammo<=0?'<span class="n">弾薬切れ</span>':''],
    ['hope','決意',S.hope+'%',[A.fire>0?'火災'+(fireL?' −'+fireL:'')+'':'',A.wnd>=20?'負傷者 '+fmt(A.wnd)+(wndL?' −'+wndL:''):''].filter(Boolean).map(x=>'<span class="n">'+x+'</span>').join(' · ')],
    ['stk','物資',fmt(A.stock||0),''],['air','放送',Math.round(A.air),'<span class="p">毎時 +'+airGain()+'</span>']];
  $('a-res').innerHTML=R.map(([k,nm,v,sub])=>`<div class="r"><div class="k">${nm}</div><div class="v${(k==='hope'&&S.hope<30)?' warn':''}">${v}${sub?` <small style="font-size:13px;font-family:'Tiny5'">${sub}</small>`:''}</div></div>`).join('');
  // section
  const att={entr:0,front:0};for(const u of A.units){const t=UNITS.find(x=>x.id===u.id).target;if(t!=='tower')att[t]+=uEff(u)/3;}
  const unitsN=x=>Math.round(A.shares[x]/100*F/40);
  drawSection($('a-c'),{fac:S.fac,def:{entr:unitsN('entr'),front:unitsN('front'),tower:unitsN('tower')},att,fire:A.fire});
  $('a-status').innerHTML=A.log.slice(0,4).map(l=>`<div class="${l.cls}"><span class="tm">${l.h}</span> ${l.t}</div>`).join('');
  // units
  $('a-units').innerHTML=`<h2>クレムリン側の兵力 <span>死傷者 ${fmt(kDead(A))} · 味方 ${fmt(A.lost||0)} · ゲージ：戦闘力</span></h2>`+A.units.map(u=>{const U=UNITS.find(x=>x.id===u.id);
    const st=uState(u), m=Math.round(uMorV(u)), dm=u.mor0==null?0:Math.round(m-u.mor0);
    const on=Math.ceil(uEff(u)/50*8);
    const sub=u.cur<=3&&st!=='wait'?`死傷者 ${fmt(u.lost||0)}${u.why?' · '+u.why:''}`:`死傷者 ${fmt(u.lost||0)} · 士気 ${m}%`+(dm?` <span class="${dm<0?'p':'n'}">${dm<0?'▼':'▲'}${Math.abs(dm)}${u.why?' '+u.why:''}</span>`:'');
    return `<div class="urow ${st}"><span class="nm">${U.nm}<small>${sub}</small></span><span class="stt">${STANCE_NM[st]}</span><div class="b r" title="現在の戦闘力">${Array.from({length:8},(_,i)=>`<i class="${i<on?'on':''}"></i>`).join('')}</div></div>`;}).join('')+'<div class="uhint">士気50以上：前進 · 25–49：戦力半減 · 25未満：戦闘から完全に離脱</div>';
  // sectors
  $('a-sect').innerHTML=`<h2>防衛 <span>戦力 ${fmt(F)} · 弾薬 残り${S.mil>0?Math.floor(A.ammo/Math.max(1,Math.round(S.mil/8))):'—'}時間分</span></h2>`+SECTORS.map(s=>{const sh=A.shares[s.id];const c=A.ctl[s.id];
    const pr=s.id==='tower'?`<small class="${sh<10?'n':'p'}">${sh<10?'無人：上階に正体不明の狙撃手、決意 −2/時':'狙撃手：両入口への攻勢 −'+Math.round(towerCut(A)*100)+'%'}</small>`:(()=>{const {D,A:a}=assaultSector(s.id);const L=A.last&&A.last[s.id];return `<small class="${a>D?'n':'p'}">防衛 ${Math.round(D)} 対 攻勢 ${Math.round(a)}：${a>D?'押されている':'持ちこたえている'}${L?` · 直近1時間：味方 −${fmt(L.lost)}、敵 −${fmt(L.kl)}`:''}</small>`;})();
    return `<div class="srow"><span class="nm">${s.nm}${pr||`<small>${s.sub}</small>`}</span>
      ${c===undefined?'<span></span>':`<div class="ctl"><i style="width:${c}%"></i></div>`}
      <span class="sh"><b data-s="${s.id}" data-d="-1">−</b>${sh}%<b data-s="${s.id}" data-d="1">+</b></span></div>`;}).join('');
  $('a-sect').querySelectorAll('b[data-s]').forEach(b=>b.onclick=()=>moveShare(b.dataset.s,+b.dataset.d));
  // orders
  $('a-orders').innerHTML=`<h2>命令 <span>残り：${A.orders} · <u id="a-air" style="cursor:pointer;color:#e8a23a">呼びかけ [M]${A.airUsed?' ✓':''}</u></span></h2><div class="agrid">`+A_ORDERS.map((o,i)=>{const st=aOrderState(i);
    return `<div class="aact${st!==true?' off':''}" data-i="${i}"><span class="k">${i+1}</span><span class="t">${o.t}</span><span class="cost">${st===true?(typeof o.d==='function'?o.d():o.d):`<span class="risk">${st}</span>`}</span></div>`;}).join('')+'</div>';
  $('a-orders').querySelectorAll('.aact').forEach(e=>e.onclick=()=>doAOrder(+e.dataset.i)); $('a-air').onclick=openAir;
}

// candle flicker on the section screens
setInterval(()=>{secTick++; if(screen==='wh'&&S)drawSection($('w-c'),{fac:S.fac,cordon:S.cordon,calm:S.phase===1,lit:!S.flags.noPower,st:{hope:S.hope,rad:S.rad,ppl:S.ppl,dep:deputies(S),radio:S.flags.radio}});
  else if(screen==='assault'&&S&&S.A){const A=S.A,F=defForce();const att={entr:0,front:0};for(const u of A.units){const t=UNITS.find(x=>x.id===u.id).target;if(t!=='tower')att[t]+=uEff(u)/3;}
    const n=x=>Math.round(A.shares[x]/100*F/40); drawSection($('a-c'),{fac:S.fac,def:{entr:n('entr'),front:n('front'),tower:n('tower')},att,fire:A.fire});}},160);
