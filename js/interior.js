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
  $('w-status').innerHTML=S.phase===1?`Свет, вода, связь: есть<br>Депутатов в здании: ${tot}${S.away?' · в разъездах: '+S.away:''}`
    :`Свет: ${S.flags.noPower?'<b>нет</b> (Решимость −2 за ночь)':S.flags.gen?'<i>генератор</i>':'есть'} · Связь: ${S.flags.noComms?'<b>нет</b>':S.flags.radio?'<i>рация</i>':'есть'}<br>Депутатов в здании: ${tot}${S.away?' · в разъездах: '+S.away:''}`;
  {const y=whYield(S); $('w-status').innerHTML+=`<br>Работа Совета ${Math.round(y.q*100)}% · за ночь: Легитимность +${y.leg}, Эфир +${y.med}, Решимость +${y.hope}`;}
  $('w-sec').querySelectorAll('.room,.fl2').forEach(e=>e.remove());
  // meters
  seg('w-hope',S.hope);seg('w-rad',S.rad);$('w-mh').textContent=S.hope+'%';$('w-mr').textContent=S.rad+'%';
  const bar=(cls,v)=>`<div class="b ${cls}">${Array.from({length:10},(_,i)=>`<i class="${i<v?'on':''}"></i>`).join('')}</div>`;
  {
    // ---- factions mode ----
    $('w-h2').innerHTML=`ФРАКЦИИ В ЗДАНИИ <span>депутатов: ${tot} · кворум ${QUORUM}</span>`;
    $('w-hdr').innerHTML=`<span></span><span>Группа</span><span style="text-align:right">в зд.</span><span>Лояльность</span><span></span>`;
    {const F=FACTIONS.find(x=>x.id===S.selFac),h=document.querySelector('#s-wh .hint'); if(h)h.innerHTML=F&&FAC_PRESS[F.id]&&S.fac[F.id].n>0?F.nm.replace(/"/g,'')+' читают: '+FAC_PRESS[F.id].map(id=>{const o=OUTLETS.find(x=>x.id===id),st=outSt(S,o);return `<span style="color:${st==='vs'?'var(--ok)':st==='kr'?'#7fa0cf':'var(--dim)'}">${o.nm.replace(/[«»]/g,'')} ${st==='vs'?'↑':st==='kr'?'↓':'·'}</span>`;}).join(', ')+'. Свои издания тянут лояльность вверх, кремлёвские вниз.':'Чем лояльнее депутаты и чем их больше в здании, тем лучше работает Совет';}
    $('w-rows').innerHTML=FACTIONS.map(F=>{const f=S.fac[F.id];
      const sub0=(f.n<=0?'нет в здании':F.kind==='arm'?'вне Съезда':'')+(f.tr&&f.n>0?(f.tr.d>0?' <span style="color:var(--ok)">↑</span>':' <span style="color:#e0866a">↓</span>'):'')+(b=>!b?'':b.on>0?' · <span style="color:var(--ok)">бонус работает</span>':b.on<0?' · <span style="color:#e0866a">вредят</span>':' · бонус выключен')(facBonus(S,F));
      const sub=sub0.replace(/^ · /,'');
      return `<div class="row${f.loy<=3&&f.n>0?' warn':''}${F.kind==='arm'&&f.n>0?' hot':''}${S.selFac===F.id?' selr':''}${f.n<=0?' gone':''}" data-f="${F.id}"><span class="sw" style="background:${F.c}"></span><span class="nm">${F.nm}<small>${sub}</small></span><span class="ct">${Math.max(0,f.n)}</span>${(L=>`<div class="b l5">${Array.from({length:5},(_,i)=>`<i style="${i<=L?'background:'+LOY[L].c:''}"></i>`).join('')}</div><span class="lv" style="color:${LOY[L].c}">${LOY[L].nm}</span>`)(loyLvl(f.loy))}</div>`;}).join('');
    $('w-rows').querySelectorAll('.row').forEach(e=>e.onclick=()=>{S.selFac=e.dataset.f;renderWH();firstLook('f',e.dataset.f);});
    const F=FACTIONS.find(x=>x.id===S.selFac)||FACTIONS[0]; S.selFac=F.id; const f=S.fac[F.id]; 
    const acts=facActs(F.id).map((a,i)=>{const st=facActState(F.id,i);
      return `<div class="act${st!==true?' off':''}" data-i="${i}"><span class="k">${i+1}</span><span class="t">${a.t}</span><span class="cost">${st===true?fxText(a.fx(F),F.id):`<span class="risk">${st}</span>`}</span></div>`;}).join('');
    const W=PEOPLE[FAC_WHO[F.id]];
    $('w-det').innerHTML=`<div class="who">${faceHTML(FAC_WHO[F.id],'big')}<div><h3><span class="sw" style="background:${F.c}"></span>${F.nm}</h3><div class="own"><b class="wn">${W.nm}</b>, ${W.role}</div></div></div>
      ${f.n<=0?'<div class="own">Фракции нет в здании.</div>':''}
      ${f.n>0&&F.id!=='rne'?`<div class="own">Сейчас <b style="color:${LOY[loyLvl(f.loy)].c}">${LOY[loyLvl(f.loy)].nm}</b>: ${LOY[loyLvl(f.loy)].d}.${f.tr?` За ночь <b style="color:${f.tr.d>0?'var(--ok)':'#e0866a'}">${f.tr.d>0?'↑':'↓'}</b>: ${f.tr.why}.`:''}</div>`:''}
      ${(b=>b&&F.id!=='rne'?`<div class="own">Даёт сейчас, ${b.t}: <b style="color:${b.on>0?'var(--ok)':b.on<0?'#e0866a':'var(--dim)'}">${fxText(b.fx).replace(/<[^>]+>/g,'')} за ночь</b> ${b.on>0?'':b.on<0?'(«ненадёжны» и ниже: вредят)':'(выключен: нужны «лояльны»)'}</div>`:'')(facBonus(S,F))}
      ${F.id==='rne'&&f.n>0?(b=>`<div class="own" style="flex:none"><span class="p">Сила:</span> ${f.n} бойцов, в обороне как ${f.n*3}. <span class="n">Цена:</span> клеймо ${b}/3, ночью Москва −${Math.min(3,b+1)}${b>=1?', Легитимность −'+(b>=2?2:1):''}, умеренные уходят.</div>`)(S.flags.brand||0):''}
      <div class="acts">${acts}</div>`;
    $('w-det').querySelectorAll('.act').forEach(e=>e.onclick=()=>doFacAct(F.id,+e.dataset.i)); drawFaces($('w-det'));
  }
  $('w-orders').textContent='приказов: '+S.orders;
}
const FACTION_ACTS=[
  {t:'Переговоры с лидерами',  fx:F=>({fac:{[F.id]:{loy:2}}})},
  {t:'Призвать к порядку',     fx:F=>({rad:-3,fac:{[F.id]:{loy:-1}}})},
];
const RNE_OUT={t:'Выставить из здания', fx:F=>({city:4,leg:3,hope:-4,rad:-5}), run:()=>{S.fac.rne.n=0;S.flags.rneOut=1;S.flags.brand=Math.max(0,(S.flags.brand||0)-1);}};
const facActs=fid=>fid==='rne'?[FACTION_ACTS[0],RNE_OUT]:FACTION_ACTS;
function facActState(fid,i){const f=S.fac[fid]; if(f.n<=0)return 'нет в здании'; if(S.used['f'+fid+i])return 'уже сегодня'; if(!S.orders)return 'нет приказов до утра'; return true;}
function doFacAct(fid,i){if(facActState(fid,i)!==true)return; const a=facActs(fid)[i]; apply(a.fx(FACTIONS.find(F=>F.id===fid))); if(a.run)a.run();
  S.orders--;S.used['f'+fid+i]=1; log(FACTIONS.find(F=>F.id===fid).nm+': '+a.t.toLowerCase()+'.'); save(); renderWH();}

// =====================================================================================================
// ===== the assault: a separate level, two hours per turn from 07:00 to 17:00 =====
function unitStance(u){if(u.src==='alpha')return S.A&&S.A.alpha||'wait'; if(u.id==='omon'){const o=S.omon==null?100:S.omon;return o<=60?'waver':'attack';}const v=S.pts[u.src]; if(u.src==='mvd')return v>=50?'refuse':v>=30?'waver':'attack'; return v>=65?'refuse':v>=45?'waver':'attack';}
const STANCE_NM={attack:'наступают',waver:'колеблются',halt:'встали',refuse:'отказались',wait:'в резерве',stopped:'выведены'};
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
  alog(refused.length?'Отказались выполнять приказ: '+refused.join(', ')+'.':'Все части Кремля выполняют приказ.');
  A.lost=0; A.muster=musterRoll(A);
  // подготовка превращается в силу штурма: Легитимность, Москва, готовность ОМОНа и лояльность ведомств сбивают стартовый дух частей
  { const L=A.muster, dn=(u,d)=>{ if(u.cur>3&&u.id!=='alpha')u.mor=clamp(uMorV(u)-d,28,100); };
    const dl=S.leg>50?Math.round((S.leg-50)*.5):0; if(dl){for(const u of A.units)dn(u,dl); L.push({g:1,t:'Легитимность '+S.leg+': части Кремля идут неохотно, дух всех −'+dl});}
    const om=A.units.find(u=>u.id==='omon'), rd=S.omon==null?100:S.omon, do1=Math.round((100-rd)*.5)+(S.city>60?Math.round((S.city-60)*.3):0); if(do1&&om.cur>3){dn(om,do1); L.push({g:1,t:'ОМОН не рвётся в бой (готовность '+rd+'%, Москва '+S.city+'%): его дух −'+do1});}
    for(const u of A.units){const U=UNITS.find(x=>x.id===u.id); if(U.src==='alpha'||u.cur<=3)continue; const v=S.pts[U.src], d=v>30?Math.round((v-30)*.3):0; if(d)dn(u,d);}
    if(S.flags.corner){A.noRes=1; for(const u of A.units)dn(u,10); L.push({g:1,t:'Кремль загнан в угол: приказ отдан в спешке, резервов не будет, дух всех −10'});} }
  save(); show('assault'); renderAssault(); musterCard();
}
// ---------- the last night: everyone you dealt with shows up, or does not. Like a final battle, every earlier choice counts ----------
function musterRoll(A){const L=[], add=(g,t)=>L.push({g,t}), lv=id=>S.fac[id].n>0?loyLvl(S.fac[id].loy):-1, hp=d=>{S.hope=clamp(S.hope+d,0,100);};
  const mul=(id,k)=>{const u=A.units.find(x=>x.id===id); if(u)u.cur*=k;};
  // фракции внутри
  let l=lv('kr'); if(l>=3){S.ppl+=400;add(1,'Коммунисты привели заводские дружины: Люди +400');} else if(l>=0&&l<=1){const n=S.fac.kr.n;S.fac.kr.n=0;hp(-3);add(0,'Коммунисты ушли ночью, все '+n+': Решимость −3');}
  l=lv('ros'); if(l>=3){hp(6);add(1,'«Россия» держит зал заседаний: Решимость +6');} else if(l>=0&&l<=1){S.fac.ros.n=0;hp(-2);add(0,'«Россия» покинула здание до рассвета: Решимость −2');}
  l=lv('agr'); if(l>=3){A.stock+=4;A.medK=.8;add(1,'Аграрии развернули кухню и лазарет: Запасы +4, потерь на 20% меньше');} else if(l>=0&&l<=1){S.fac.agr.n=0;add(0,'Аграрии разъехались по областям');}
  l=lv('otc'); if(l>=3){A.gsB=.2;mul('taman',.9);add(1,'«Отчизна» знает частоты и фамилии командиров: звонок в Генштаб надёжнее, мотострелки −10%');}
    else if(l>=0&&l<=1){A.leak=1;S.fac.otc.n=0;add(0,'Депутаты «Отчизны» ушли и рассказали в Генштабе, кто чем командует: натиск +12%, башня прикрывает вдвое хуже');}
  l=lv('sm'); if(l>=3){A.air=Math.min(100,A.air+15);add(1,'«Смена» водит иностранную прессу по этажам: Эфир +15');} else if(l>=0&&l<=1){A.air=Math.max(0,A.air-15);hp(-4);S.fac.sm.n=0;add(0,'«Смена» вышла к камерам с белым флагом: Эфир −15, Решимость −4');}
  l=lv('kol'); if(l>=3){hp(3);add(1,'Колеблющиеся остались. Кворум в зале: Решимость +3');} else if(l>=0&&l<=1){A.ctl.entr-=10;A.ctl.front-=10;S.fac.kol.n=0;add(0,'Колеблющиеся вышли через оцепление и показали, где стоят посты: оба входа −10');}
  l=lv('rne'); if(l>=3){A.ctl.entr=Math.min(100,A.ctl.entr+10);add(1,'РНЕ держит двадцатый подъезд: слабый вход +10');} else if(l>=0&&l<=1){const g=Math.min(100,freeGuns(S));S.gun-=g;A.ammo=Math.max(0,A.ammo-g);S.fac.rne.n=0;S.flags.rneLeft=1;add(0,'Баркашовцы ушли коллектором и унесли стволы: Оружие −'+g);}
  l=lv('so'); if(l>=3)add(1,'«Союз офицеров» принял штаб обороны: все участки держатся лучше'); else if(l>=0&&l<=1){A.air=Math.max(0,A.air-10);S.rad=clamp(S.rad+5,0,100);add(0,'Офицеры Терехова воюют сами по себе: Эфир −10, Радикализм +5');}
  // силы снаружи
  for(const [id,nm] of [['mo','Минобороны'],['gs','Генштаб'],['mvd','МВД']]){const v=S.pts[id],hi=id==='mvd'?50:65,lo=id==='mvd'?30:45; add(v>=lo?1:0,nm+' ('+v+'% за вас, отказ от '+hi+'): '+(v>=hi?'части отказались выполнять приказ':v>=lo?'части колеблются и идут не в полную силу':'части выполняют приказ'));}
  {const o=S.omon==null?100:S.omon; add(o<=60?1:0,'ОМОН: '+(o<=60?'колеблется и идёт не в полную силу':'выполняет приказ')+' (готовность '+o+'%)');}
  if(S.pts.mer>=60){A.medK=(A.medK||1)*.85;add(1,'Мэрия не отозвала «скорые»: потерь на 15% меньше');} else if(S.pts.mer<25&&S.bar>0){S.bar--;add(0,'Мэрия дала бульдозеры: один ряд баррикад снесён до рассвета');}
  if(S.pts.smo>=60){A.incoming+=500;add(1,'Со Смоленской идёт колонна: через час +500 человек');}
  if(S.city>=60){A.incoming+=600;add(1,'Москва за вас: через час у стен ещё 600 человек');} else if(S.city<=25){const d=Math.round(S.ppl*.15);S.ppl-=d;add(0,'Москва смотрит штурм по телевизору: '+fmt(d)+' человек ушли от стен ночью');}
  // пресса
  for(const o of OUTLETS){const st=outSt(S,o), f=o.fin&&o.fin[st]; if(!f||!f.t)continue; const x=f.fx;
    if(x.air)A.air=clamp(A.air+x.air,0,100); if(x.hope)hp(x.hope); if(x.inc)A.incoming+=x.inc; if(x.ppl)S.ppl=Math.max(0,S.ppl+x.ppl); if(x.mil){S.mil+=x.mil;S.gun+=x.mil;}
    if(x.ctl){A.ctl.entr+=x.ctl;A.ctl.front+=x.ctl;} if(x.all)for(const u of A.units)u.cur*=x.all; if(x.u)for(const k in x.u)mul(k,x.u[k]);
    add(st==='vs'?1:0,f.t);}
  if((S.flags.brand||0)>=2){A.air=Math.max(0,A.air-12);add(0,'Клеймо «фашисты в парламенте»: Запад отводит глаза. Эфир −12');}
  // что вы успели сделать
  if(S.flags.tunnel){A.tunnel=1;add(1,'Коллекторы разведаны: раненых выносят под землёй, вдвое больше за час');}
  if(S.flags.noComms)add(0,'Связи нет: звонить некому, эфир вдвое дороже');
  if(S.flags.noPower){hp(-3);add(0,'Здание без света: Решимость −3');} else if(S.flags.gen)add(1,'Генераторы работают: свет и радио есть');
  if(S.bar>=4)add(1,'Баррикады в '+S.bar+' ряда: входы держатся дольше');
  if(deputies(S)<QUORUM){hp(-4);add(0,'Кворума нет: в зале '+deputies(S)+' депутатов. Решимость −4');}
  A.ctl.entr=clamp(A.ctl.entr,20,100);A.ctl.front=clamp(A.ctl.front,20,100);
  return L;}
function musterCard(){const A=S.A; A.card='muster'; save(); Sfx.play('engine');
  const col=g=>A.muster.filter(m=>m.g===g).map(m=>`<div class="ml ${g?'p':'n'}">${g?'+':'−'} ${m.t}</div>`).join('')||'<div class="ml">никого</div>';
  $('modal-win').innerHTML=`<h2>ПОСЛЕДНЯЯ НОЧЬ: КТО С ВАМИ</h2><div class="sub">Всё, что вы делали две недели, пришло к стенам или не пришло. Фракции, силовые структуры, пресса и ваши решения.</div>
   <div class="mus"><div><h3>ЗА ВАС</h3>${col(1)}</div><div><h3>ПРОТИВ ВАС</h3>${col(0)}</div></div><div class="close">ENTER — к бою</div>`;
  $('modal').classList.add('on'); $('modal-win').querySelector('.close').onclick=musterClose;}
function musterClose(){const A=S.A; if(!A||A.card!=='muster')return; Sfx.play('boom'); A.card=0; $('modal').classList.remove('on'); save(); renderAssault(); if(A.allRef&&A.alpha==='wait'){alog('Армия, внутренние войска и ОМОН на здание не пошли. У Кремля остался только спецназ.');return alphaCard();} incidentCard();}
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
  if(A.incoming){S.ppl+=A.incoming;alog('К Белому дому прорвались москвичи: +'+fmt(A.incoming)+'.');A.incoming=0;}
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
      uMor(u,-(dl*1.0)-(Ar<=D?2:-2)); u.why=Ar<=D?'отбиты':'потери';
      if(u.dead>=U.str*.6&&u.cur>3){u.cur=0;u.st='stopped';u.why='обескровлены';alog(U.nm+': потеряли больше половины состава, часть отвели от здания.');aBanner(U.nm.toUpperCase()+': ВЫВЕДЕНЫ ИЗ БОЯ','Потеряли больше половины состава ('+fmt(u.lost)+'). Командование отвело часть от здания.',true);}}
    A.last[s]={D:Math.round(D),A:Math.round(Ar),lost,kl};
    const nm=SECTORS.find(x=>x.id===s).nm;
    if(Ar>0)alog(`${nm}: ${Ar>D?'теснят':'держим'}. Наши потери ${fmt(lost)}, их ${fmt(kl)}.`,Ar>D?'bad':'');}
  const tk=A.units.find(u=>u.id==='tanks'), T=uEff(tk);
  if(T>0){const hl=Math.round(T/6+A.fire/5);S.hope=clamp(S.hope-hl,0,100);A.fire=Math.min(15,A.fire+T/20);
    const tl=Math.round(A.shares.tower/100*defForce()*.04*T/30);S.mil=Math.max(0,S.mil-tl);
    alog(`Танки бьют по башне. Горят этажи. Решимость −${hl}.`,'bad');}
  else if(A.fire>0){const hl=Math.round(A.fire/5);A.fire=Math.min(15,A.fire+.5);if(hl){S.hope=clamp(S.hope-hl,0,100);alog(`Пожар расползается по этажам. Решимость −${hl}.`,'bad');}}
  // wounded: the med post treats some; the rest lie in corridors and break morale
  const tr=Math.min(A.wnd,Math.round(A.wnd*.3*roomQ(S,'med')*(A.tunnel?2:1))); A.wnd-=tr; if(A.wnd>=40){const wl=Math.min(6,Math.round(A.wnd/80));if(wl){S.hope=clamp(S.hope-wl,0,100);alog(`Раненых некуда класть: ${fmt(A.wnd)}. Решимость −${wl}.`,'bad');}}
  // live air: while the world is watching, wavering units look for a reason to stop
  // камеры: эфир точит дух каждый час, а бойня под камерами точит вдвойне
  {const bl=A.air>=40?Math.min(5,lostHour/50):0; for(const u of A.units){if(u.cur<=3)continue; const d=A.air/150+(uEff(u)>0?bl:0)+(A.air>=60&&uState(u)==='waver'?3:0); if(d>0){uMor(u,-d); if(d>=3&&!u.why)u.why='камеры';}}}
  // танки одни не воюют: если пехота стоит, экипажи не хотят в одиночку расстреливать парламент
  if(tk.cur>3&&!A.units.some(u=>u.id!=='tanks'&&uEff(u)>0)){uMor(tk,-20);tk.why='пехота встала';}
  // большая кровь у Кремля: резервы не шлют, танкисты сникают
  if(kDead(A)>=450&&tk.cur>3){uMor(tk,-8);if(!tk.why)tk.why='потери штурма';}
  for(const u of A.units){if(u.cur<=3)continue; const was=u.mor0>=MOR_GO?2:u.mor0>=MOR_HALT?1:0, m=uMorV(u), now=m>=MOR_GO?2:m>=MOR_HALT?1:0; if(now===was)continue; const nm=UNITS.find(x=>x.id===u.id).nm;
    if(now===0){u.cur=0;u.st='stopped';u.halt=1;} // встали — значит вышли из боя насовсем: вернуть часть Кремль уже не может
    const tx=now===0?'встали и дальше не идут':now===1?(was===2?'заколебались, идут вполсилы':'снова двинулись, но вполсилы'):'снова идут в атаку';
    alog(nm+': '+tx+(u.why?' ('+u.why+')':'')+'.',now>was?'bad':''); aBanner(nm.toUpperCase()+': '+(now===0?'ВЫШЛИ ИЗ БОЯ':now===1?(was===2?'КОЛЕБЛЮТСЯ':'СНОВА ИДУТ'):'СНОВА В АТАКЕ'),'Дух '+Math.round(m)+'%'+(u.why?' · причина: '+u.why:'')+'. '+(now===0?'Солдаты встали и дальше не идут. В бой эта часть уже не вернётся.':tx[0].toUpperCase()+tx.slice(1)+'.'),now<was);}
  // кровь меняет политику: каждые 500 убитых и раненых с обеих сторон — Радикализм +3, Легитимность −2
  {const bl=Math.floor(((A.lost||0)+kDead(A))/500); if(bl>(A.blood||0)){const d=bl-(A.blood||0);A.blood=bl;S.rad=clamp(S.rad+3*d,0,100);S.leg=clamp(S.leg-2*d,0,100);alog(`Счёт убитых и раненых перевалил за ${fmt(bl*500)}. Радикализм +${3*d}, Легитимность −${2*d}.`,'bad');}}
  A.air=clamp(A.air+airGain(),0,100); // эфир не тает: каждый час капает от своих изданий
  // ammunition: every hour of fighting eats the stock; with empty magazines the doors hold much worse
  if(A.shares.tower<10){S.hope=clamp(S.hope-2,0,100);A.fire=Math.min(15,A.fire+1);alog('Башня пуста: верхние этажи заняли чужие стрелки, пожар тушить некому. Решимость −2.','bad');}
  if(S.mil>0){const am=Math.round(S.mil/8); const had=A.ammo>0; A.ammo=Math.max(0,A.ammo-am); if(had&&A.ammo<=0)alog('Патроны кончились. Оборона держится на прикладах и бутылках.','bad');}
  // siege: after noon reserves come up to the units whose structures stayed with the Kremlin, and the House tires
  if(A.r>=5){S.hope=clamp(S.hope-1,0,100); if(A.r%2===1){ if(A.noRes)alog('Резервов нет: Кремлю больше некого прислать.'); else if(kDead(A)>=350)alog('Резервов нет: после таких потерь Кремль не решается слать новые части.'); else{for(const u of A.units){const U=UNITS.find(x=>x.id===u.id); if(u.cur>3&&uEff(u)>0){u.cur=Math.min(U.str*1.2,u.cur+U.str*.15);uMor(u,8);if(!u.why)u.why='резервы';}} alog('К штурмующим подошли резервы. Здание берут измором.','bad');} } }
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
    const t=u.id==='alpha'&&A.alpha==='wait'?['','в бой так и не ввели']:st==='refuse'?['p',u.id==='alpha'?'отказались штурмовать':'отказались выполнять приказ, в бою не были']:st==='stopped'?['p','выведены из боя'+(u.why?' ('+u.why+')':'')+(u.id==='tanks'?'':', потери '+lost)]
      :st==='halt'?['p','встали и не идут: дух '+m+'%'+(u.id==='tanks'?'':', потери '+lost)]:st==='waver'?['','колеблются: дух '+m+'%'+(u.id==='tanks'?'':', потери '+lost)]:['n',(u.id==='tanks'?'ведут огонь':'наступают')+': дух '+m+'%'+(u.id==='tanks'?'':', потери '+lost)];
    return `<div><b>${U.nm}</b><span class="${t[0]}">${t[1]}</span></div>`;};
  const going=A.units.filter(u=>uEff(u)>0&&u.id!=='tanks').map(u=>UNITS.find(x=>x.id===u.id).nm);
  const T={
    fell:['ЗДАНИЕ ВЗЯТО',`${why==='entr'?'Подъезд №20':'Парадный вход'} пал: защитников там не осталось, штурмующие на этажах. Части, которые ещё шли вперёд (${going.join(', ')||'никого'}), вошли в здание. Их дух и ваши потери им уже не помеха: дверь открыта.`],
    broken:['ОГОНЬ ПРЕКРАЩЁН',`Решимость защитников упала до нуля: танковый обстрел, пожар на этажах и раненые в коридорах сделали своё. Входы ещё держались, но держать их стало некому. Из окон вывесили белые простыни.`],
    held:why==='dark'?['ТЕМНОТА. ШТУРМ ОСТАНОВЛЕН',`Двенадцать часов боя, а здание не взято. В темноте Кремль продолжать не решился: ${going.length?'части, которые ещё наступали ('+going.join(', ')+'), получили приказ отойти от стен. Вы их не разбили, вы их пересидели.':'идти вперёд было уже некому.'}`]
      :['ШТУРМ ВЫДОХСЯ',`${A.units.some(u=>u.cur>3)?'Три часа подряд ни одна часть не шла вперёд':'У стен не осталось ни одной части, способной идти вперёд'}. Командиры докладывают в Кремль, что люди не поднимаются. Стрельба стихла сама.`]}[id];
  $('modal-win').innerHTML=`<h2>${T[0]}</h2><div class="sub">${HOURS[Math.min(A.r,HOURS.length-1)]}, позади ${Math.min(A.r,HOURS.length)} ч. боя из ${HOURS.length}. ${T[1]}</div>
   <div class="finl">${A.units.map(unitLine).join('')}<div><b>Ваши потери</b><span>${fmt(A.lost||0)} убитых и раненых · входы: подъезд ${Math.round(A.ctl.entr)}%, парадный ${Math.round(A.ctl.front)}% · Решимость ${S.hope}%</span></div></div><div class="close">ENTER — что было дальше</div>`;
  $('modal').classList.add('on'); $('modal-win').querySelector('.close').onclick=finaleGo; renderAssaultSafe();}
function renderAssaultSafe(){try{renderAssault();}catch(e){}}
function finaleGo(){const A=S.A; if(!A||A.card!=='fin')return; A.card=0; $('modal').classList.remove('on'); ending(A.finId);}
function alphaCard(){
  const A=S.A;
  const DS=[[S.leg>=50,'Легитимность от 50 (сейчас '+S.leg+')'],[A.air>=40,'Эфир от 40 (сейчас '+Math.round(A.air)+')']], draw=DS.every(x=>x[0]);
  $('modal-win').innerHTML=`<h2>«АЛЬФА» У ПОДЪЕЗДА</h2><div class="sub">${A.allRef?'Ни одна часть не выполнила приказ. У Кремля остался последний резерв: «Альфа» и «Вымпел».':'Четыре часа штурма, а здание не взято. Кремль бросает последний резерв: «Альфу» и «Вымпел».'} Их офицеры не хотят стрелять по парламенту и предлагают вывести людей под свои гарантии. Чем это кончится, зависит от того, смотрит ли на них страна.</div>`+
    [{t:'Впустить «Альфу» и выйти под её гарантии',d:draw?'<span class="p">Нейтральный исход:</span> «Альфа» при камерах отказывается от штурма. Здание вы теряете, но Ельцин больше не может командовать.':'<span class="n">Поражение:</span> тихая сдача. Чтобы это стало ничьей, нужны '+DS.filter(x=>!x[0]).map(x=>x[1]).join(' и ')+'.'},
     {t:'Обратиться к офицерам по рации',d:S.A.air>=10?`Эфир −10 · шанс ${Math.round((.25+S.leg/250)*100)}%, что «Альфа» откажется штурмовать и уйдёт. ${S.A.allRef?'Тогда штурмовать будет некому':'Бой с остальными продолжается'}`:'<span class="n">нужно 10 Эфира</span>'},
     {t:'Драться',d:'«Альфа» пойдёт на штурм подъезда №20. Это самая сильная часть Кремля.'}]
    .map((c,i)=>`<div class="law" data-i="${i}"><div class="t">${i+1}. ${c.t}</div><div class="d">${c.d}</div></div>`).join('');
  $('modal').classList.add('on'); A.card=1;
  $('modal-win').querySelectorAll('.law').forEach(e=>e.onclick=()=>alphaChoose(+e.dataset.i));
}
function alphaChoose(i){const A=S.A; const u=A.units.find(x=>x.id==='alpha'), base=UNITS.find(x=>x.id==='alpha').str;
  if(i===1&&S.A.air<10)return;
  A.card=0; closeModal();
  if(i===0){S.chron.push({date:dateStr(S.day),h:'«АЛЬФА»',ch:'переговоры'});return ending(S.leg>=50&&A.air>=40?'draw_alpha':'surrender_alpha');}
  if(i===1){S.A.air-=10; u.mor=90; if(Math.random()<.25+S.leg/250){A.alpha='refuse';u.cur=0;alog('«Альфа» отказалась штурмовать парламент.');aBanner('«АЛЬФА» ОТКАЗАЛАСЬ','Офицеры выслушали вас по рации и на штурм не пошли. Бой с остальными частями продолжается.',true);}
    else{A.alpha='attack';u.cur=base;alog('Офицеры «Альфы» не стали слушать. Штурм подъезда.','bad');}}
  if(i===2){A.alpha='attack';u.cur=base;alog('«Альфа» идёт на штурм подъезда №20.','bad');}
  S.chron.push({date:dateStr(S.day),h:'«АЛЬФА»',ch:['переговоры','обращение по рации','бой'][i]});
  save(); renderAssault();
}
// ---------- incidents: one per hour, something happens and has to be balanced against the rest ----------
const uMor=(u,d)=>{u.mor=clamp((u.mor==null?80:u.mor)+d,0,100);};
const uOn=(A,id)=>uEff(A.units.find(u=>u.id===id))>0;
function uMul(A,id,k,force){const u=A.units.find(x=>x.id===id),U=UNITS.find(x=>x.id===id); if(u.cur<=3)return; u.cur=Math.min(U.str*1.5,u.cur*k);}
function uStop(A,id,why){const u=A.units.find(x=>x.id===id); u.cur=0;u.st='stopped';alog(UNITS.find(x=>x.id===id).nm+': '+why+'.');}
function uBack(A,k){const u=A.units.find(u=>(u.st==='refuse'||u.st==='stopped')&&u.id!=='alpha'); if(!u)return; const U=UNITS.find(x=>x.id===u.id); u.cur=U.str*k;u.st='attack';u.mor=Math.max(uMorV(u),60);u.dead=0;alog(U.nm+': снова в строю.','bad');}
const yCallUnit=A=>A.units.filter(u=>u.cur>3&&!u.called&&uMorV(u)<MOR_GO&&!(u.id==='alpha'&&A.alpha!=='attack')).sort((x,y)=>UNITS.find(q=>q.id===y.id).str-UNITS.find(q=>q.id===x.id).str)[0];
const yCallLoy=u=>{const U=UNITS.find(x=>x.id===u.id);return U.src==='alpha'?40:u.id==='omon'?100-(S.omon==null?100:S.omon):S.pts[U.src];};
const yCallGain=A=>Math.max(10,Math.round(40-yCallLoy(yCallUnit(A))/3)); // чем лояльнее вам структура, тем слабее действует звонок
const yCallTalk=A=>clamp(.15+yCallLoy(yCallUnit(A))/200+S.leg/400,.1,.7);
const gsChance=k=>clamp(S.pts.gs/130+(S.A.gsB||0)+(k||0),.05,.75);
const INCIDENTS=[
  // звонок в Генштаб: открывается приказом, не случайно. Генштабу подчинены только мотострелки; ВВ и ОМОН — это МВД, танки — Минобороны
  {id:'gs_call', who:'kolesn', cond:A=>false, h:'ЗВОНОК В ГЕНШТАБ', p:()=>{const u=S.A.units.find(x=>x.id==='taman');return `Депутаты-генералы дозвонились до начальника Генштаба. Колесников слушает молча. Его мотострелки сейчас у парадного входа: дух ${Math.round(uMorV(u))}%, потери ${fmt(u.lost||0)}. Генштаб за вас на ${S.pts.gs}%. ВВ и ОМОН ему не подчиняются, танки тоже: говорить можно только о Таманской дивизии.`;},
   ch:[{t:'Просить отвести дивизию от здания',d:()=>'шанс '+Math.round(gsChance()*100)+'%: мотострелки уходят совсем. Иначе доложит в Кремль: их дух +10',run:A=>{const u=A.units.find(x=>x.id==='taman'); if(Math.random()<gsChance()){u.cur=0;u.st='stopped';u.why='отвёл Генштаб';alog('Мотострелки: Генштаб отвёл дивизию от здания.');aBanner('МОТОСТРЕЛКИ: ОТВЕДЕНЫ','Колесников приказал Таманской дивизии отойти от Белого дома.',true);}else{u.mor0=uMorV(u);uMor(u,10);u.why='звонок сорвался';alog('Колесников выслушал и положил трубку. Через минуту о звонке знали в Кремле.','bad');aBanner('ГЕНШТАБ ОТКАЗАЛ','Колесников доложил о звонке в Кремль. Дух мотострелков +10.',false);}}},
       {t:'Просить не торопиться: пусть роты залягут и ждут',d:()=>'наверняка: дух мотострелков −15',rq:'Генштаб 30',req:()=>S.pts.gs>=30,run:A=>{const u=A.units.find(x=>x.id==='taman');u.mor0=uMorV(u);uMor(u,-15);u.why='Генштаб тянет время';alog('Генштаб не отменил приказ, но и не торопит. Мотострелки залегли.');}},
       {t:'Зачитать постановление Съезда: приказ преступен, отвечать будет лично он',d:()=>'шанс '+Math.round(gsChance(.2)*100)+'%: мотострелки уходят. Иначе Легитимность −3 и их дух +10',rq:'Легитимность 60',req:()=>S.leg>=60,run:A=>{const u=A.units.find(x=>x.id==='taman'); if(Math.random()<gsChance(.2)){u.cur=0;u.st='stopped';u.why='отвёл Генштаб';alog('Мотострелки: Колесников не захотел отвечать за штурм. Дивизию отвели.');aBanner('МОТОСТРЕЛКИ: ОТВЕДЕНЫ','Колесников не захотел отвечать за штурм лично.',true);}else{u.mor0=uMorV(u);uMor(u,10);u.why='звонок сорвался';S.leg=clamp(S.leg-3,0,100);alog('Колесников ответил, что присягал президенту. Запись разговора передали журналистам Кремля.','bad');}}}]},
  {id:'y_addr', cond:A=>A.r>=1, h:'ОБРАЩЕНИЕ ЕЛЬЦИНА', p:'В девять утра президент выходит в эфир: «Вооружённый мятеж в Москве будет подавлен. Те, кто пошёл против мирного города, получат по заслугам». Солдаты слушают по рациям.',
   ch:[{t:'Не отвечать',d:'дух всех частей +8 · Решимость −3',run:A=>{for(const u of A.units)uMor(u,8);S.hope=clamp(S.hope-3,0,100);}},
       {t:'Ответить в прямом эфире: депутаты в зале, стреляют по ним',d:'Эфир −8 · дух частей −6',rq:'Эфир 30',req:()=>S.A.air>=30&&S.A.air>=8,run:A=>{S.A.air-=8;for(const u of A.units)uMor(u,-6);}},
       {t:'Включить его речь на этажах: пусть слышат, что им обещано',d:'Решимость +4 · Радикализм +4',run:A=>{S.hope=clamp(S.hope+4,0,100);S.rad=clamp(S.rad+4,0,100);}}]},
  // тяни-толкай: когда часть встала или заколебалась, Ельцин один раз лично звонит её командиру. Вернуть каждую часть он может только однажды
  {id:'y_call', multi:1, prio:1, cond:A=>A.r>=1&&!!yCallUnit(A), h:'ЗВОНОК ИЗ КРЕМЛЯ', p:()=>{const u=yCallUnit(S.A),U=UNITS.find(x=>x.id===u.id);return `${U.nm}: дух ${Math.round(uMorV(u))}%, часть колеблется и идёт вполсилы. Ельцин лично звонит командиру: «Вы понимаете, чем кончится для вас отказ? Вперёд». Подбодрить он может только тех, кто ещё воюет, и только один раз. Если часть встанет, её уже никто не вернёт.`;},
   ch:[{t:'Не вмешиваться',d:()=>'дух части +'+yCallGain(S.A),run:A=>{const u=yCallUnit(A),g=yCallGain(A);u.called=1;u.mor0=uMorV(u);uMor(u,g);u.why='звонок Ельцина';}},
       {t:'Выйти на их частоту: «Командир, приказ преступный, отвечать будете вы»',d:()=>'Эфир −10 · дух части только +'+Math.round(yCallGain(S.A)/3),rq:'Эфир 10',req:()=>S.A.air>=10,run:A=>{const u=yCallUnit(A),g=yCallGain(A);u.called=1;u.mor0=uMorV(u);A.air-=10;uMor(u,Math.round(g/3));u.why='звонок перебит';}},
       {t:'Послать к ним депутатов-офицеров с белым флагом',d:()=>'шанс '+Math.round(yCallTalk(S.A)*100)+'%: часть уходит совсем. Иначе дух +'+yCallGain(S.A)+', Решимость −3',run:A=>{const u=yCallUnit(A),U=UNITS.find(x=>x.id===u.id),g=yCallGain(A),ok=Math.random()<yCallTalk(A);u.called=1; if(ok){u.cur=0;u.st='stopped';u.why='увели часть';alog(U.nm+': командир выслушал депутатов и увёл часть.');aBanner(U.nm.toUpperCase()+': УШЛИ','Командир выслушал депутатов и увёл часть от здания.',true);}else{u.mor0=uMorV(u);uMor(u,g);u.why='звонок Ельцина';S.hope=clamp(S.hope-3,0,100);alog('Парламентёров не подпустили к командиру.','bad');}}}]},
  {id:'y_order', cond:A=>A.r>=4&&A.units.some(u=>u.cur>3&&u.mor<=45), h:'ПРИКАЗ ЗА ПОДПИСЬЮ', p:'Командирам частей привезли письменный приказ президента с личной подписью. Теперь отказ — это трибунал, а не колебания.',
   ch:[{t:'Ничего не сделать',d:'дух всех частей +15',run:A=>{for(const u of A.units)if(u.cur>3)uMor(u,15);}},
       {t:'Напомнить в эфире: приказ незаконен, отвечать будет исполнитель',d:'Эфир −10 · дух +5 вместо +15',rq:'Легитимность 50',req:()=>S.leg>=50&&S.A.air>=10,run:A=>{S.A.air-=10;for(const u of A.units)if(u.cur>3)uMor(u,5);}}]},
  // ----- части Кремля: кто отказывается, кто переходит, кого дожимают. Зависит от отношений со структурой -----
  {id:'u_tank', cond:A=>uOn(A,'tanks'), h:'ЭКИПАЖ ЗАГЛУШИЛ МОТОР', p:'Один из танков на мосту замолчал. Командир экипажа по открытой связи спрашивает, кто ответит за стрельбу по парламенту и что будет с теми, кто откажется.',
   ch:[{t:'Промолчать',d:'танки −10%',run:A=>uMul(A,'tanks',.9)},
       {t:'Гарантии от имени Верховного Совета: отказавшихся не тронут',d:'танки −35%',rq:'Легитимность 60',req:()=>S.leg>=60,run:A=>uMul(A,'tanks',.65)},
       {t:'Звать к себе: разверните орудие',d:'танк встаёт у парадного входа: вход +15 · Радикализм +5 · Эфир −10',rq:'Минобороны 55',req:()=>S.pts.mo>=55,run:A=>{uMul(A,'tanks',.75);A.ctl.front=Math.min(100,A.ctl.front+15);S.rad=clamp(S.rad+5,0,100);A.air=Math.max(0,A.air-10);}}]},
  {id:'u_paid', pic:'tank', cond:A=>uOn(A,'tanks')&&S.pts.mo<50&&A.r>=1, h:'ЭКИПАЖИ ЗА ДЕНЬГИ', p:'Срочники стрелять отказались. В танки сажают офицеров-добровольцев: каждому обещаны деньги и квартира. Наводчики опытные.',
   ch:[{t:'Ничего не сделать',d:'танки +25%',run:A=>uMul(A,'tanks',1.25)},
       {t:'Назвать в эфире фамилии и цену',d:'Эфир +2 · танки +5%',rq:'Эфир 8',req:()=>S.A.air>=8,run:A=>{S.A.air-=8;uMul(A,'tanks',1.05);A.air=Math.min(100,A.air+10);}},
       {t:'Звонок командиру дивизии: снимите добровольцев',d:'танки −15%',rq:'Минобороны 40',req:()=>S.pts.mo>=40&&!S.flags.noComms,run:A=>uMul(A,'tanks',.85)}]},
  {id:'u_vv', cond:A=>uOn(A,'vv'), h:'ПОЛК НЕ ИДЁТ', p:'Командир полка внутренних войск передаёт по рации: в парламент его люди стрелять не будут. Но и переходить он не собирается. Спрашивает, чего вы от него хотите.',
   ch:[{t:'Пусть уводит людей в казармы',d:'ВВ −25%',run:A=>uMul(A,'vv',.75)},
       {t:'Просить встать цепью между сторонами',d:'ВВ −45% · Подъезд +8',rq:'МВД 45',req:()=>S.pts.mvd>=45,run:A=>{uMul(A,'vv',.55);A.ctl.entr=Math.min(100,A.ctl.entr+8);}},
       {t:'Требовать перейти с оружием',d:'шанс 50%: Ополчение +80, Оружие +80 · иначе полк оскорблён, ВВ +15%',rq:'Радикализм 50%',req:()=>S.rad>=50,run:A=>{if(Math.random()<.5){S.mil+=80;S.gun+=80;uMul(A,'vv',.7);alog('Полк ВВ перешёл на сторону Совета.');}else{uMul(A,'vv',1.15);alog('Командир полка бросил трубку. ВВ идут вперёд.','bad');}}}]},
  {id:'u_omon', cond:A=>uOn(A,'omon'), h:'ОМОН ВСТАЛ', p:'Московский ОМОН остановился у парадного входа. Бойцам сказали, что в здании одни боевики. Командир кричит в мегафон: покажите, кто у вас там.',
   ch:[{t:'Ответить огнём поверх голов',d:'ОМОН +10% · Решимость +2',run:A=>{uMul(A,'omon',1.1);S.hope=clamp(S.hope+2,0,100);}},
       {t:'Вывести депутатов с удостоверениями на ступени',d:'ОМОН уходит',rq:'кворум: '+QUORUM+' депутатов',req:()=>deputies(S)>=QUORUM,run:A=>uStop(A,'omon','увидели депутатов и отошли от здания')},
       {t:'Напомнить, что мэрия их подставила',d:'ОМОН −40%',rq:'Мэрия 40',req:()=>S.pts.mer>=40,run:A=>uMul(A,'omon',.6)}]},
  {id:'u_general', cond:A=>A.r>=2&&A.units.some(u=>uState(u)==='waver'), h:'ГЕНЕРАЛ НА МОСТУ', p:'Кремль прислал к колеблющимся частям генерала с письменным приказом и угрозой трибунала. Он обходит строй и смотрит в глаза командирам.',
   ch:[{t:'Ждать',d:'колеблющиеся части идут в атаку в полную силу',run:A=>{for(const u of A.units)if(uState(u)==='waver'){u.st='attack';u.mor=70;}}},
       {t:'Послать навстречу депутатов-генералов',d:'части остаются колебаться и слабеют на 15%',rq:'Генштаб 45',req:()=>S.pts.gs>=45,run:A=>{for(const u of A.units)if(u.st==='waver')u.cur*=.85;}},
       {t:'Показать генерала с приказом в прямом эфире',d:'Эфир −15 · одна колеблющаяся часть уходит, остальные идут в атаку',rq:'Эфир 40',req:()=>S.A.air>=40,run:A=>{A.air-=15;const w=A.units.filter(u=>uState(u)==='waver').sort((a,b)=>b.cur-a.cur);if(w[0])uStop(A,w[0].id,'ушли из-под камер');for(const u of w.slice(1)){u.st='attack';u.cur=UNITS.find(x=>x.id===u.id).str;}}}]},
  {id:'u_tula', cond:A=>A.r>=5&&S.pts.gs<50, h:'ДЕСАНТНИКИ ИЗ ТУЛЫ', p:'К Москве подошёл полк Тульской дивизии. Командир полка до сих пор не понял, за кого его привезли, и ждёт у Кольцевой.',
   ch:[{t:'Ничего не сделать',d:'мотострелки +35%',run:A=>uMul(A,'taman',1.35,1)},
       {t:'Обратиться к нему по радио',d:'Эфир −10 · шанс 45%, что полк останется у Кольцевой',rq:'Эфир 10',req:()=>S.A.air>=10,run:A=>{S.A.air-=10;if(Math.random()<.45)alog('Тульский полк стоит у Кольцевой и в город не входит.');else{uMul(A,'taman',1.35,1);alog('Десантники вошли в город.','bad');}}},
       {t:'Перекрыть проспект людьми',d:'Люди −400 · мотострелки +10%',rq:'Люди 1500',req:()=>S.ppl>=1500,run:A=>{S.ppl-=400;uMul(A,'taman',1.1,1);}}]},
  {id:'u_column', cond:A=>A.r>=3&&S.pts.gs>=55, h:'КОЛОННА ЖДЁТ СЛОВА', p:'Командир части из Подмосковья звонит по закрытой связи: он готов вывести колонну к Белому дому. Ему нужен приказ и подпись.',
   ch:[{t:'Отказаться: армия не должна стрелять в армию',d:'Эфир +10 · Решимость −2',run:A=>{A.air=Math.min(100,A.air+10);S.hope=clamp(S.hope-2,0,100);}},
       {t:'Пусть встанет у Кольцевой и ждёт',d:'все части Кремля −12%',run:A=>{for(const u of A.units)u.cur*=.88;}},
       {t:'Подписать приказ: колонну в город',d:'Ополчение +150 · Оружие +150 · Решимость +6 · Радикализм +10 · Эфир −20',rq:'Радикализм 50%',req:()=>S.rad>=50,run:A=>{S.mil+=150;S.gun+=150;A.ammo+=150;S.hope=clamp(S.hope+6,0,100);S.rad=clamp(S.rad+10,0,100);A.air=Math.max(0,A.air-20);}}]},
  {id:'u_cops', cond:A=>S.pts.mvd>=50, h:'ОТДЕЛЕНИЕ ПЕРЕШЛО', p:'К двадцатому подъезду вышли три десятка милиционеров из районного отдела, с табельным оружием. Старший говорит: «Мы присягу давали закону».',
   ch:[{t:'Поставить к окнам',d:'Ополчение +40 · Оружие +40',run:A=>{S.mil+=40;S.gun+=40;}},
       {t:'Пусть в форме выводят раненых и женщин',d:'раненые вывезены · Эфир +10',run:A=>{A.wnd=0;A.air=Math.min(100,A.air+10);}},
       {t:'Отправить обратно: агитировать своих',d:'ВВ и ОМОН −15%',run:A=>{uMul(A,'vv',.85);uMul(A,'omon',.85);}}]},
  {id:'u_back', cond:A=>false&&A.r>=3&&A.units.some(u=>(u.st==='refuse'||u.st==='stopped')&&u.id!=='alpha'), h:'ОТКАЗНИКОВ ДОЖИМАЮТ', p:'Командира части, которая отказалась идти на штурм, сняли. Новый командир привёз деньги и приказ. Солдат строят заново.',
   ch:[{t:'Ничего не сделать',d:'часть возвращается в половину силы',run:A=>uBack(A,.5)},
       {t:'Обращение к солдатам: вас обманывают второй раз',d:'Эфир −10 · часть возвращается в четверть силы',rq:'Эфир 10',req:()=>S.A.air>=10,run:A=>{S.A.air-=10;uBack(A,.25);}},
       {t:'Объявить снятого командира исполняющим обязанности',d:'часть остаётся на месте',rq:'Легитимность 65',req:()=>S.leg>=65,run:A=>alog('Солдаты слушают прежнего командира.')}]},
  {id:'floor', cond:A=>A.fire>=3, h:'ГОРИТ ДВЕНАДЦАТЫЙ ЭТАЖ', p:'Огонь идёт по кабельным шахтам. Наверху архив Съезда и люди, которые не успели спуститься.',
   ch:[{t:'Послать людей тушить',d:'Люди −150 · Пожар −5',run:A=>{S.ppl=Math.max(0,S.ppl-150);A.fire=Math.max(0,A.fire-5);}},
       {t:'Живая цепь с вёдрами от реки',d:'Люди −60 · Пожар −8',rq:'Люди 1000',req:()=>S.ppl>=1000,run:A=>{S.ppl-=60;A.fire=Math.max(0,A.fire-8);}},
       {t:'Бросить этаж',d:'Пожар +2 · Решимость −4',run:A=>{A.fire=Math.min(15,A.fire+2);S.hope=clamp(S.hope-4,0,100);}}]},
  {id:'wounded', cond:A=>A.wnd>=40, h:'РАНЕНЫЕ В ДВАДЦАТОМ ПОДЪЕЗДЕ', p:'Бинты кончились, врачи режут простыни. Через дорогу стоят «скорые», которые не пускает оцепление.',
   ch:[{t:'Выносить под огнём',d:'Раненые −60% · Ополчение −20',run:A=>{A.wnd=Math.round(A.wnd*.4);S.mil=Math.max(0,S.mil-20);}},
       {t:'Просить коридор у офицеров МВД',d:'Раненые вывезены · Эфир +10',rq:'МВД 30',req:()=>S.pts.mvd>=30,run:A=>{A.wnd=0;A.air=Math.min(100,A.air+10);}},
       {t:'Оставить до темноты',d:'Решимость −6',run:A=>{S.hope=clamp(S.hope-6,0,100);}}]},
  {id:'cnn', cond:A=>true, h:'ПРЯМОЙ ЭФИР', p:'Камера CNN стоит на крыше напротив и показывает здание на весь мир. Оператор машет: дайте кого-нибудь в кадр.',
   ch:[{t:'Хасбулатов выходит к окну',d:'Эфир +20',run:A=>{A.air=Math.min(100,A.air+20);}},
       {t:'Показать депутатов и женщин, автоматчиков убрать',d:'Эфир +35',rq:'Радикализм не выше 40%',req:()=>S.rad<=40,run:A=>{A.air=Math.min(100,A.air+35);}},
       {t:'Не до камер',d:'Решимость +2',run:A=>{S.hope=clamp(S.hope+2,0,100);}}]},
  {id:'snipers', cond:A=>true, h:'СНАЙПЕРЫ НА КРЫШАХ', p:'Неизвестные стрелки бьют с крыш и по вашим, и по солдатам. Каждая сторона уверена, что это другая.',
   ch:[{t:'Укрыть людей',d:'Фасад −8',run:A=>{A.ctl.front=Math.max(1,A.ctl.front-8);}},
       {t:'Снять стрелков своими силами',d:'Ополчение −15 · Решимость +4',rq:'Ополчение 150',req:()=>S.mil>=150,run:A=>{S.mil-=15;S.hope=clamp(S.hope+4,0,100);}},
       {t:'Сказать в эфир: это не мы',d:'Эфир −10 · внутренние войска слабеют',rq:'Эфир 30',req:()=>S.A.air>=30,run:A=>{A.air-=10;const u=A.units.find(x=>x.id==='vv');u.cur*=.75;}}]},
  {id:'parley', cond:A=>A.r>=2, h:'ПАРЛАМЕНТЁР', p:'Офицер с белым флагом предлагает полчаса тишины, чтобы вывести женщин и раненых. Потом, говорит он, будет хуже.',
   ch:[{t:'Согласиться',d:'Люди −300 · раненые вывезены · Решимость −3',run:A=>{S.ppl=Math.max(0,S.ppl-300);A.wnd=0;S.hope=clamp(S.hope-3,0,100);}},
       {t:'Требовать посредников: патриарх, суд, регионы',d:'Эфир +15 · натиск слабеет',rq:'Легитимность 70',req:()=>S.leg>=70,run:A=>{A.air=Math.min(100,A.air+15);for(const u of A.units)u.cur*=.9;}},
       {t:'Отказаться',d:'Решимость +3',run:A=>{S.hope=clamp(S.hope+3,0,100);}}]},
  {id:'hall', pic:'tank', cond:A=>A.units.find(u=>u.id==='tanks').cur>0, h:'СНАРЯД В ЗАЛЕ', p:'Болванка прошила стену зала заседаний. Депутаты лежат между кресел. Кто-то предлагает спуститься в подвал.',
   ch:[{t:'Всем в подвал',d:'Решимость −4',run:A=>{S.hope=clamp(S.hope-4,0,100);}},
       {t:'Продолжить заседание',d:'Решимость +5 · Эфир +10 · уйдут 10 депутатов',rq:'Решимость 50%',req:()=>S.hope>=50,run:A=>{S.hope=clamp(S.hope+5,0,100);A.air=Math.min(100,A.air+10);S.fac.kol.n=Math.max(0,S.fac.kol.n-10);}}]},
  {id:'ammo', cond:A=>A.r>=1, h:'ПАТРОНЫ', p:'У подъездов осталось по рожку на ствол. Командиры спрашивают, где брать ещё.',
   ch:[{t:'Бить одиночными',d:'Патроны +40 · оба входа −6',run:A=>{A.ammo+=40;A.ctl.entr=Math.max(1,A.ctl.entr-6);A.ctl.front=Math.max(1,A.ctl.front-6);}},
       {t:'Собрать по этажам и у невооружённых',d:'Патроны +100 · Люди −80',rq:'Люди 500',req:()=>S.ppl>=500,run:A=>{A.ammo+=100;S.ppl-=80;}},
       {t:'Вскрыть неприкосновенный запас',d:'Патроны +200',rq:'Оружие 300',req:()=>S.gun>=300,run:A=>{A.ammo+=200;}}]},
  {id:'crowd', cond:A=>S.city>=35, h:'НАБЕРЕЖНАЯ', p:'На мосту и набережной тысячи москвичей. Одни смотрят, как в кино. Другие готовы идти к зданию.',
   ch:[{t:'Просить уйти из-под огня',d:'Решимость +1',run:A=>{S.hope=clamp(S.hope+1,0,100);}},
       {t:'Позвать живым кольцом',d:'через час +800 человек · Эфир +10',rq:'Москва 55%',req:()=>S.city>=55,run:A=>{A.incoming+=800;A.air=Math.min(100,A.air+10);}}]},
  {id:'water', cond:A=>A.fire>=2, h:'ГИДРАНТЫ СУХИЕ', p:'Воду в здании отключили ещё неделю назад. Пожарные рукава пусты, огнетушители кончаются.',
   ch:[{t:'Носить воду из реки под огнём',d:'Люди −120 · Пожар −4',run:A=>{S.ppl=Math.max(0,S.ppl-120);A.fire=Math.max(0,A.fire-4);}},
       {t:'Засыпать песком с баррикад',d:'Пожар −5 · оба входа −5',run:A=>{A.fire=Math.max(0,A.fire-5);A.ctl.entr=Math.max(1,A.ctl.entr-5);A.ctl.front=Math.max(1,A.ctl.front-5);}},
       {t:'Пусть горит',d:'Пожар +2',run:A=>{A.fire=Math.min(15,A.fire+2);}}]},
  {id:'defect', cond:A=>A.units.some(u=>u.id==='taman'&&u.cur>0), h:'ПЕРЕБЕЖЧИКИ', p:'Взвод мотострелков залёг у стилобата и не стреляет. Лейтенант кричит, что они не хотят в этом участвовать.',
   ch:[{t:'Крикнуть, чтобы уходили',d:'мотострелки слабеют',run:A=>{const u=A.units.find(x=>x.id==='taman');u.cur*=.85;}},
       {t:'Втащить к себе с оружием',d:'Ополчение +30 · Оружие +60',rq:'Генштаб 40',req:()=>S.pts.gs>=40,run:A=>{S.mil+=30;S.gun+=60;const u=A.units.find(x=>x.id==='taman');u.cur*=.8;}},
       {t:'Показать их по телевидению',d:'Эфир +15',rq:'Эфир 20',req:()=>S.A.air>=20,run:A=>{A.air=Math.min(100,A.air+15);}}]},
  {id:'cellar', cond:A=>A.r>=2, h:'ПОДВАЛ', p:'В бомбоубежище сотни женщин, буфетчицы, машинистки и дети сотрудников. Наверх они уже не поднимутся.',
   ch:[{t:'Вывести через двадцатый подъезд',d:'Люди −200 · Эфир +10 · Подъезд −6',run:A=>{S.ppl=Math.max(0,S.ppl-200);A.air=Math.min(100,A.air+10);A.ctl.entr=Math.max(1,A.ctl.entr-6);}},
       {t:'Оставить в подвале до темноты',d:'Решимость −3',run:A=>{S.hope=clamp(S.hope-3,0,100);}}]},
  {id:'btr', cond:A=>A.r>=3, h:'ТРОФЕЙ', p:'У парадного входа стоит брошенный бронетранспортёр с полным боекомплектом. Экипаж сбежал.',
   ch:[{t:'Сжечь, чтобы не достался',d:'Парадный вход +4',run:A=>{A.ctl.front=Math.min(100,A.ctl.front+4);}},
       {t:'Посадить своих и развернуть пулемёт',d:'Парадный вход +15 · Оружие +80 · Эфир −10',rq:'Ополчение 250',req:()=>S.mil>=250,run:A=>{A.ctl.front=Math.min(100,A.ctl.front+15);S.gun+=80;A.air=Math.max(0,A.air-10);}}]},
  {id:'planes', cond:A=>A.r>=1, h:'РУЦКОЙ У РАЦИИ', p:'Вице-президент кричит в открытый эфир: «Товарищи, поднимайте самолёты!» Это слышат и лётчики, и журналисты, и Кремль.',
   ch:[{t:'Пусть зовёт',d:'Решимость +4 · Эфир −15',run:A=>{S.hope=clamp(S.hope+4,0,100);A.air=Math.max(0,A.air-15);}},
       {t:'Забрать рацию: просить мир о посредничестве',d:'Эфир +10',rq:'Решимость 40%',req:()=>S.hope>=40,run:A=>{A.air=Math.min(100,A.air+10);}}]},
  {id:'truce', cond:A=>A.r>=6, h:'ЧАС ТИШИНЫ', p:'Кремль предлагает перемирие на час, чтобы собрать раненых. Обе стороны знают, что за этот час подойдут резервы.',
   ch:[{t:'Согласиться',d:'раненые вывезены · оба входа +6 · части Кремля крепнут',run:A=>{A.wnd=0;A.ctl.entr=Math.min(100,A.ctl.entr+6);A.ctl.front=Math.min(100,A.ctl.front+6);for(const u of A.units)if(u.cur>3)u.cur*=1.12;}},
       {t:'Отказаться',d:'Решимость +2',run:A=>{S.hope=clamp(S.hope+2,0,100);}},
       {t:'Согласиться и вывести прессу к раненым',d:'то же · Эфир +20',rq:'Эфир 25',req:()=>S.A.air>=25,run:A=>{A.wnd=0;A.air=Math.min(100,A.air+20);A.ctl.entr=Math.min(100,A.ctl.entr+6);A.ctl.front=Math.min(100,A.ctl.front+6);for(const u of A.units)if(u.cur>3)u.cur*=1.12;}}]},
  {id:'rne', cond:A=>S.fac.rne.n>0, h:'БАРКАШОВЦЫ УХОДЯТ', p:'РНЕ нашло ход в подземный коллектор и собирается уйти, пока не поздно. С ними уйдёт треть стволов.',
   ch:[{t:'Пусть идут',d:'РНЕ покидает здание',run:A=>{S.fac.rne.n=0;}},
       {t:'Пристыдить перед строем',d:'остаются · Решимость +2',rq:'Решимость 60%',req:()=>S.hope>=60,run:A=>{S.hope=clamp(S.hope+2,0,100);}},
       {t:'Откупиться оружием',d:'Оружие −100 · остаются',rq:'Оружие 100',req:()=>S.gun>=100,run:A=>{S.gun-=100;if(S.mil>S.gun)S.mil=S.gun;}}]},
];
function incidentCard(){const A=S.A; if(!A||screen!=='assault')return;
  let I=A.card==='inc'&&INCIDENTS.find(x=>x.id===A.incId);
  if(!I){const pool=INCIDENTS.filter(x=>!A.inc[x.id]&&x.cond(A)); if(!pool.length)return; const pr=pool.filter(x=>x.prio); I=pr.length?pr[0]:pool[Math.floor(Math.random()*pool.length)];}
  if(A.card!=='inc')Sfx.play(/^u_|^y_/.test(I.id)?'static':'alarm',1.2);
  A.card='inc'; A.incId=I.id; save();
  const tk=I.pic==='tank'&&uOn(A,'tanks'), who=/^y_/.test(I.id)?'yeltsin':I.who, yel=!!who||tk, body=`<h2>${I.h}</h2><div class="sub">${typeof I.p==='function'?I.p():I.p}</div>`+I.ch.map((c,i)=>{const lk=c.req&&!c.req();
    return `<div class="law${lk?' lock':''}" data-i="${i}"><div class="t">${i+1}. ${c.t}</div><div class="e">${typeof c.d==='function'?c.d():c.d}${c.rq?` · <span class="${lk?'n':'p'}">${lk?'нужно':'открыто'}: ${c.rq}</span>`:''}</div></div>`;}).join('');
  $('modal-win').innerHTML=tk?`<div class="incy"><div class="ph"><img src="${tankShotURL()}"><b>НОВОАРБАТСКИЙ МОСТ</b><small>танки бьют по зданию</small></div><div>${body}</div></div>`:yel?`<div class="incy"><div class="ph"><img src="${who==='yeltsin'?ASSET_YELTSIN:PEOPLE[who].img}"><b>${who==='yeltsin'?'БОРИС ЕЛЬЦИН':PEOPLE[who].nm.toUpperCase()}</b><small>${who==='yeltsin'?'на прямой линии':PEOPLE[who].role+', на прямой линии'}</small></div><div>${body}</div></div>`:body;
  $('modal').classList.add('on');
  $('modal-win').querySelectorAll('.law').forEach(e=>e.onclick=()=>incChoose(+e.dataset.i));
}
function incChoose(i){const A=S.A, I=INCIDENTS.find(x=>x.id===A.incId), c=I&&I.ch[i]; if(!c||(c.req&&!c.req()))return;
  A.card=0; if(!I.multi)A.inc[I.id]=1; $('modal').classList.remove('on'); c.run(A); alog(I.h.charAt(0)+I.h.slice(1).toLowerCase()+': '+c.t.toLowerCase()+'.');
  if(S.hope<=0)return finale('broken'); save(); renderAssault();}
const A_ORDERS=[
  {t:'Контратака',                 d:'вход +20 · бойцы −50 · дух врага −7', req:()=>S.mil>=50||'нужно 50 бойцов',
   run:()=>{const s=S.A.ctl.entr<=S.A.ctl.front?'entr':'front';S.A.ctl[s]=Math.min(100,S.A.ctl[s]+20);S.mil-=50;for(const u of S.A.units)if(UNITS.find(x=>x.id===u.id).target===s&&u.cur>3){uMor(u,-7);u.lost=(u.lost||0)+15;}alog('Контратака у входа «'+SECTORS.find(x=>x.id===s).nm+'».');}},
  {t:'Завал у слабого входа',      d:'Люди −100 · вход +10', req:()=>S.ppl>=100||'нужно 100 человек',
   run:()=>{const s=S.A.ctl.entr<=S.A.ctl.front?'entr':'front';S.ppl-=100;S.A.ctl[s]=Math.min(100,S.A.ctl[s]+10);alog('Люди таскают мебель и сейфы к входу «'+SECTORS.find(x=>x.id===s).nm+'».');}},
  {t:'Звонок в Генштаб',           d:()=>'разговор с Колесниковым о мотострелках', once:1, req:()=>S.flags.noComms?'связи нет':deputies(S)<5?'нет депутатов':uEff(S.A.units.find(u=>u.id==='taman'))>0||'мотострелки не воюют',
   run:()=>{const A=S.A; A.card='inc'; A.incId='gs_call'; incidentCard();}},
  {t:'Депутатов — в зал',          d:'Решимость +8', once:1, req:()=>true, run:()=>{S.hope=clamp(S.hope+8,0,100);alog('Съезд заседает под обстрелом. Люди держатся.');}},
  {t:'Тушить пожар',               d:'Люди −100 · Пожар −6', req:()=>(S.A.fire>=1&&S.ppl>=100)||(S.A.fire<1?'ничего не горит':'нужно 100 человек'),
   run:()=>{S.ppl-=100;S.A.fire=Math.max(0,S.A.fire-6);alog('Добровольцы тушат этажи.');}},
  {t:'Вооружить людей',            d:()=>{const k=Math.min(100,S.ppl,freeGuns(S));return 'Люди −'+k+' · Ополчение +'+k;}, req:()=>(S.ppl>=20&&freeGuns(S)>=20)||(freeGuns(S)<20?'нет свободных стволов':'нет людей'),
   run:()=>{const k=Math.min(100,S.ppl,freeGuns(S));S.ppl-=k;S.mil+=k;alog('Ещё '+k+' человек получили оружие и встали к окнам.');}},
  {t:'Еда и вода бойцам',          d:'Запасы −2 · Решимость +5', req:()=>S.A.stock>=2||'нужно 2 Запаса',
   run:()=>{S.A.stock-=2;S.hope=clamp(S.hope+5,0,100);alog('По этажам разносят хлеб, чай и воду.');}},
  {t:'Бинты раненым',  d:'Запасы −2 · Раненые −60%', req:()=>S.A.wnd<20?'раненых немного':S.A.stock>=2||'нужно 2 Запаса',
   run:()=>{S.A.stock-=2;S.A.wnd=Math.round(S.A.wnd*.4);alog('В двадцатом подъезде вскрыли последние ящики с бинтами.');}},
  {t:'Солярку на баррикады',       d:'Запасы −3 · слабый вход +12 · Пожар +1', req:()=>S.A.stock>=3||'нужно 3 Запаса',
   run:()=>{const s=S.A.ctl.entr<=S.A.ctl.front?'entr':'front';S.A.stock-=3;S.A.ctl[s]=Math.min(100,S.A.ctl[s]+12);S.A.fire+=1;alog('Баррикаду у входа «'+SECTORS.find(x=>x.id===s).nm+'» облили соляркой и подожгли.');}},
  {t:'Белый флаг',                 d:'сдаться', flag:1, req:()=>true, run:()=>ending('surrender')},
];
// ---------- the air during the assault: what you ask the world for. One request an hour, paid in Эфир ----------
const AIR=[
  {t:'Позвать москвичей к зданию', cost:10, d:()=>`через час придут ${fmt(300+S.city*10)} человек`, run:A=>{A.incoming+=300+S.city*10;alog('Эфир: москвичей зовут к Белому дому.');}},
  {t:'Просить перемирия, чтобы вывезти раненых', cost:8, d:()=>`шанс ${Math.round(Math.min(.9,.3+S.A.air/100)*100)}%: раненые вывезены, Решимость +3`, req:()=>S.A.wnd>=20||'раненых немного',
   run:A=>{if(Math.random()<Math.min(.9,.3+A.air/100)){A.wnd=0;S.hope=clamp(S.hope+3,0,100);alog('Огонь стих на двадцать минут. «Скорые» забрали раненых.');}else alog('В перемирии отказано.','bad');}},
  {t:'Обращение к солдатам: не стреляйте', cost:12, d:()=>`шанс ${Math.round(Math.min(.45,.1+S.A.air/200)*100)}%, что одна колеблющаяся часть остановится; иначе натиск −6%`,
   run:A=>{const g=A.units.filter(u=>uState(u)==='waver').sort((a,b)=>a.cur-b.cur)[0];
     if(g&&Math.random()<Math.min(.45,.1+A.air/200)){g.cur=0;g.st='stopped';alog(UNITS.find(x=>x.id===g.id).nm+': услышали обращение и прекратили огонь.');}else{for(const u of A.units){u.cur*=.94;uMor(u,-5);}alog('Солдаты слушают, но приказ есть приказ. Огонь стал реже.');}}},
  {t:'Показать миру пожар и раненых', cost:0, d:()=>'Эфир +15', run:A=>{A.air=Math.min(100,A.air+15);alog('Кадры горящего парламента идут по всем мировым каналам.');}},
  {t:'Назвать по именам командиров, отдавших приказ', cost:10, d:()=>'танки −25%, дух танкистов −15, Радикализм +3', req:()=>S.A.units.find(u=>u.id==='tanks').cur>0||'танки молчат',
   run:A=>{A.units.find(u=>u.id==='tanks').cur*=.75;uMor(A.units.find(u=>u.id==='tanks'),-15);S.rad=clamp(S.rad+3,0,100);alog('В эфире звучат фамилии и номера частей. Два экипажа заглушили моторы.');}},
  {t:'Просить суд и регионы о посредничестве', cost:15, d:()=>'натиск −10%, Решимость +4', req:()=>S.leg>=50||'нужна Легитимность 50',
   run:A=>{for(const u of A.units)u.cur*=.9;S.hope=clamp(S.hope+4,0,100);alog('Зорькин и главы регионов требуют прекратить огонь.');}},
  {t:'Показать солдатам их собственные потери', cost:8, d:()=>'дух всех частей −5, а у понёсших потери −10', run:A=>{for(const u of A.units)if(u.cur>3)uMor(u,(u.lost||0)>=40?-10:-5);alog('По громкой связи читают фамилии убитых солдат. В цепях тихо.');}},
  {t:'Просить врачей и «скорые»', cost:5, d:()=>'раненых вдвое меньше', req:()=>S.A.wnd>=20||'раненых немного', run:A=>{A.wnd=Math.round(A.wnd/2);alog('Врачи-добровольцы прошли через оцепление.');}},
];
const airGain=()=>1+Math.floor(OUTLETS.filter(o=>outSt(S,o)==='vs').length/4)+(S.pts.ost>=100?2:0);
const airCost=o=>o.cost*(S.flags.noComms?2:1);
function airState(i){const o=AIR[i],A=S.A; if(A.airUsed)return 'в этот час уже выходили'; if(S.A.air<airCost(o))return 'нужно '+airCost(o)+' Эфира'; const r=o.req?o.req():true; return r;}
function openAir(){const A=S.A; if(!A||screen!=='assault'||A.card)return;
  $('modal-win').innerHTML=`<h2>ЭФИР ИЗ БЕЛОГО ДОМА</h2><div class="sub">Эфир: <b style="color:var(--paper)">${Math.round(A.air)}</b> из 100, каждый час +${airGain()} от ваших изданий. Пока Эфир высок, мир смотрит: натиск слабее, дух частей падает, от 60 колеблющиеся части могут встать. Обращения тратят его. Одна просьба в час, приказ не тратится.${S.flags.noComms?' <span class="n">Связи нет, выйти в эфир можно только через иностранцев: всё вдвое дороже.</span>':''} Чем выше Эфир, тем слабее натиск и тем охотнее вас слышат.</div><div class="app2">`+
    AIR.map((o,i)=>{const st=airState(i);return `<div class="law${st!==true?' lock':''}" data-i="${i}"><div class="t">${o.t} <span class="cst">${airCost(o)?"Эфир −"+airCost(o):"даром"}</span></div><div class="e">${st===true?o.d():`<span class="n">${st}</span>`}</div></div>`;}).join('')+
    `</div><div class="close">ESC — закрыть</div>`;
  $('modal').classList.add('on');
  $('modal-win').querySelectorAll('.law').forEach(e=>e.onclick=()=>{const i=+e.dataset.i; if(airState(i)!==true)return; Sfx.play('static');Sfx.play('pips',.7); S.A.air-=airCost(AIR[i]); A.airUsed=1; AIR[i].run(A); $('modal').classList.remove('on'); save(); renderAssault();});
  $('modal-win').querySelector('.close').onclick=closeModal;
}
function aOrderState(i){const o=A_ORDERS[i],A=S.A; if(o.once&&A.once[i])return 'уже сделано'; if(A.used[i])return 'уже было';
  const r=o.req(); if(r!==true)return r; if(!A.orders&&!A_ORDERS[i].flag)return 'нет приказов'; return true;}
function doAOrder(i){if(aOrderState(i)!==true)return; Sfx.play(['burst','thud','phone','crowd','fire','bolt','paper','lose'][i]||'click');const A=S.A; A.used[i]=1; if(A_ORDERS[i].once)A.once[i]=1; if(!A_ORDERS[i].flag)A.orders--;
  A_ORDERS[i].run(); if(screen==='assault'){save();renderAssault();}}
function moveShare(s,d){const A=S.A, sh=A.shares; if(d>0){const o=Object.keys(sh).filter(k=>k!==s&&sh[k]>=10).sort((a,b)=>sh[b]-sh[a])[0];if(!o)return;sh[o]-=10;sh[s]+=10;}
  else{if(sh[s]<10)return;const o=Object.keys(sh).filter(k=>k!==s).sort((a,b)=>sh[a]-sh[b])[0];sh[s]-=10;sh[o]+=10;}
  save();renderAssault();}

function renderAssault(){
  const A=S.A; const F=defForce();
  $('a-time').textContent=dateStr(S.day).toUpperCase()+' '+HOURS[Math.min(A.r,HOURS.length-1)];
  $('a-round').textContent='час '+(A.r+1)+' из '+HOURS.length+' · до темноты';
  const fireL=A.fire>0?Math.round(A.fire/5):0, wndL=A.wnd>=40?Math.min(6,Math.round(A.wnd/80)):0;
  const R=[['ppl','Люди',fmt(S.ppl),''],['mil','Ополчение',fmt(S.mil),A.ammo<=0?'<span class="n">патронов нет</span>':''],
    ['hope','Решимость',S.hope+'%',[A.fire>0?'пожар'+(fireL?' −'+fireL:'')+'':'',A.wnd>=20?'раненых '+fmt(A.wnd)+(wndL?' −'+wndL:''):''].filter(Boolean).map(x=>'<span class="n">'+x+'</span>').join(' · ')],
    ['stk','Запасы',fmt(A.stock||0),''],['air','Эфир',Math.round(A.air),'<span class="p">+'+airGain()+' в час</span>']];
  $('a-res').innerHTML=R.map(([k,nm,v,sub])=>`<div class="r"><div class="k">${nm}</div><div class="v${(k==='hope'&&S.hope<30)?' warn':''}">${v}${sub?` <small style="font-size:13px;font-family:'Tiny5'">${sub}</small>`:''}</div></div>`).join('');
  // section
  const att={entr:0,front:0};for(const u of A.units){const t=UNITS.find(x=>x.id===u.id).target;if(t!=='tower')att[t]+=uEff(u)/3;}
  const unitsN=x=>Math.round(A.shares[x]/100*F/40);
  drawSection($('a-c'),{fac:S.fac,def:{entr:unitsN('entr'),front:unitsN('front'),tower:unitsN('tower')},att,fire:A.fire});
  $('a-status').innerHTML=A.log.slice(0,4).map(l=>`<div class="${l.cls}"><span class="tm">${l.h}</span> ${l.t}</div>`).join('');
  // units
  $('a-units').innerHTML=`<h2>СИЛЫ КРЕМЛЯ <span>потери ${fmt(kDead(A))} · ваши ${fmt(A.lost||0)} · шкала: сила в бою</span></h2>`+A.units.map(u=>{const U=UNITS.find(x=>x.id===u.id);
    const st=uState(u), m=Math.round(uMorV(u)), dm=u.mor0==null?0:Math.round(m-u.mor0);
    const on=Math.ceil(uEff(u)/50*8);
    const sub=u.cur<=3&&st!=='wait'?`потери ${fmt(u.lost||0)}${u.why?' · '+u.why:''}`:`потери ${fmt(u.lost||0)} · дух ${m}%`+(dm?` <span class="${dm<0?'p':'n'}">${dm<0?'▼':'▲'}${Math.abs(dm)}${u.why?' '+u.why:''}</span>`:'');
    return `<div class="urow ${st}"><span class="nm">${U.nm}<small>${sub}</small></span><span class="stt">${STANCE_NM[st]}</span><div class="b r" title="сила в бою сейчас">${Array.from({length:8},(_,i)=>`<i class="${i<on?'on':''}"></i>`).join('')}</div></div>`;}).join('')+'<div class="uhint">дух от 50: идут · 25–49: вполсилы · ниже 25: выходят из боя насовсем</div>';
  // sectors
  $('a-sect').innerHTML=`<h2>ОБОРОНА <span>сила ${fmt(F)} · патронов на ${S.mil>0?Math.floor(A.ammo/Math.max(1,Math.round(S.mil/8))):'—'} ч.</span></h2>`+SECTORS.map(s=>{const sh=A.shares[s.id];const c=A.ctl[s.id];
    const pr=s.id==='tower'?`<small class="${sh<10?'n':'p'}">${sh<10?'пусто: чужие стрелки наверху, Решимость −2/час':'снайперы: натиск на оба входа −'+Math.round(towerCut(A)*100)+'%'}</small>`:(()=>{const {D,A:a}=assaultSector(s.id);const L=A.last&&A.last[s.id];return `<small class="${a>D?'n':'p'}">оборона ${Math.round(D)} против натиска ${Math.round(a)}: ${a>D?'теснят':'держим'}${L?` · за час: мы −${fmt(L.lost)}, они −${fmt(L.kl)}`:''}</small>`;})();
    return `<div class="srow"><span class="nm">${s.nm}${pr||`<small>${s.sub}</small>`}</span>
      ${c===undefined?'<span></span>':`<div class="ctl"><i style="width:${c}%"></i></div>`}
      <span class="sh"><b data-s="${s.id}" data-d="-1">−</b>${sh}%<b data-s="${s.id}" data-d="1">+</b></span></div>`;}).join('');
  $('a-sect').querySelectorAll('b[data-s]').forEach(b=>b.onclick=()=>moveShare(b.dataset.s,+b.dataset.d));
  // orders
  $('a-orders').innerHTML=`<h2>ПРИКАЗЫ <span>осталось: ${A.orders} · <u id="a-air" style="cursor:pointer;color:#e8a23a">ОБРАЩЕНИЯ [M]${A.airUsed?' ✓':''}</u></span></h2><div class="agrid">`+A_ORDERS.map((o,i)=>{const st=aOrderState(i);
    return `<div class="aact${st!==true?' off':''}" data-i="${i}"><span class="k">${i+1}</span><span class="t">${o.t}</span><span class="cost">${st===true?(typeof o.d==='function'?o.d():o.d):`<span class="risk">${st}</span>`}</span></div>`;}).join('')+'</div>';
  $('a-orders').querySelectorAll('.aact').forEach(e=>e.onclick=()=>doAOrder(+e.dataset.i)); $('a-air').onclick=openAir;
}

// candle flicker on the section screens
setInterval(()=>{secTick++; if(screen==='wh'&&S)drawSection($('w-c'),{fac:S.fac,cordon:S.cordon,calm:S.phase===1,lit:!S.flags.noPower,st:{hope:S.hope,rad:S.rad,ppl:S.ppl,dep:deputies(S),radio:S.flags.radio}});
  else if(screen==='assault'&&S&&S.A){const A=S.A,F=defForce();const att={entr:0,front:0};for(const u of A.units){const t=UNITS.find(x=>x.id===u.id).target;if(t!=='tower')att[t]+=uEff(u)/3;}
    const n=x=>Math.round(A.shares[x]/100*F/40); drawSection($('a-c'),{fac:S.fac,def:{entr:n('entr'),front:n('front'),tower:n('tower')},att,fire:A.fire});}},160);
