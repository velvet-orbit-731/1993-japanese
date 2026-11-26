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
  $('w-status').innerHTML=S.phase===1?`전기, 수도, 통신: 있음<br>건물 안 의원: ${tot}${S.away?' · 출장 중: '+S.away:''}`
    :`전기: ${S.flags.noPower?'<b>없음</b> (밤마다 결의 −2)':S.flags.gen?'<i>발전기</i>':'있음'} · 통신: ${S.flags.noComms?'<b>없음</b>':S.flags.radio?'<i>무전기</i>':'있음'}<br>건물 안 의원: ${tot}${S.away?' · 출장 중: '+S.away:''}`;
  {const y=whYield(S); $('w-status').innerHTML+=`<br>최고회의 가동 ${Math.round(y.q*100)}% · 밤마다: 정통성 +${y.leg}, 방송 +${y.med}, 결의 +${y.hope}`;}
  $('w-sec').querySelectorAll('.room,.fl2').forEach(e=>e.remove());
  // meters
  seg('w-hope',S.hope);seg('w-rad',S.rad);$('w-mh').textContent=S.hope+'%';$('w-mr').textContent=S.rad+'%';
  const bar=(cls,v)=>`<div class="b ${cls}">${Array.from({length:10},(_,i)=>`<i class="${i<v?'on':''}"></i>`).join('')}</div>`;
  {
    // ---- factions mode ----
    $('w-h2').innerHTML=`건물 안 계파 <span>의원: ${tot} · 정족수 ${QUORUM}</span>`;
    $('w-hdr').innerHTML=`<span></span><span>계파</span><span style="text-align:right">건물 내</span><span>충성도</span><span></span>`;
    {const F=FACTIONS.find(x=>x.id===S.selFac),h=document.querySelector('#s-wh .hint'); if(h)h.innerHTML=F&&FAC_PRESS[F.id]&&S.fac[F.id].n>0?F.nm.replace(/"/g,'')+' 독자: '+FAC_PRESS[F.id].map(id=>{const o=OUTLETS.find(x=>x.id===id),st=outSt(S,o);return `<span style="color:${st==='vs'?'var(--ok)':st==='kr'?'#7fa0cf':'var(--dim)'}">${o.nm.replace(/[«»]/g,'')} ${st==='vs'?'↑':st==='kr'?'↓':'·'}</span>`;}).join(', ')+'. 자기 매체는 충성도를 올리고, 크렘린 매체는 내린다.':'의원이 충성적일수록, 건물 안에 많을수록 최고회의는 더 잘 돌아간다';}
    $('w-rows').innerHTML=FACTIONS.map(F=>{const f=S.fac[F.id];
      const sub0=(f.n<=0?'건물에 없음':F.kind==='arm'?'인민대표대회 밖':'')+(f.tr&&f.n>0?(f.tr.d>0?' <span style="color:var(--ok)">↑</span>':' <span style="color:#e0866a">↓</span>'):'')+(b=>!b?'':b.on>0?' · <span style="color:var(--ok)">보너스 작동 중</span>':b.on<0?' · <span style="color:#e0866a">해로움</span>':' · 보너스 꺼짐')(facBonus(S,F));
      const sub=sub0.replace(/^ · /,'');
      return `<div class="row${f.loy<=3&&f.n>0?' warn':''}${F.kind==='arm'&&f.n>0?' hot':''}${S.selFac===F.id?' selr':''}${f.n<=0?' gone':''}" data-f="${F.id}"><span class="sw" style="background:${F.c}"></span><span class="nm">${F.nm}<small>${sub}</small></span><span class="ct">${Math.max(0,f.n)}</span>${(L=>`<div class="b l5">${Array.from({length:5},(_,i)=>`<i style="${i<=L?'background:'+LOY[L].c:''}"></i>`).join('')}</div><span class="lv" style="color:${LOY[L].c}">${LOY[L].nm}</span>`)(loyLvl(f.loy))}</div>`;}).join('');
    $('w-rows').querySelectorAll('.row').forEach(e=>e.onclick=()=>{S.selFac=e.dataset.f;renderWH();firstLook('f',e.dataset.f);});
    const F=FACTIONS.find(x=>x.id===S.selFac)||FACTIONS[0]; S.selFac=F.id; const f=S.fac[F.id]; 
    const acts=facActs(F.id).map((a,i)=>{const st=facActState(F.id,i);
      return `<div class="act${st!==true?' off':''}" data-i="${i}"><span class="k">${i+1}</span><span class="t">${a.t}</span><span class="cost">${st===true?fxText(a.fx(F),F.id):`<span class="risk">${st}</span>`}</span></div>`;}).join('');
    const W=PEOPLE[FAC_WHO[F.id]];
    $('w-det').innerHTML=`<div class="who">${faceHTML(FAC_WHO[F.id],'big')}<div><h3><span class="sw" style="background:${F.c}"></span>${F.nm}</h3><div class="own"><b class="wn">${W.nm}</b>, ${W.role}</div></div></div>
      ${f.n<=0?'<div class="own">계파가 건물에 없다.</div>':''}
      ${f.n>0&&F.id!=='rne'?`<div class="own">지금 <b style="color:${LOY[loyLvl(f.loy)].c}">${LOY[loyLvl(f.loy)].nm}</b>: ${LOY[loyLvl(f.loy)].d}.${f.tr?` 밤마다 <b style="color:${f.tr.d>0?'var(--ok)':'#e0866a'}">${f.tr.d>0?'↑':'↓'}</b>: ${f.tr.why}.`:''}</div>`:''}
      ${(b=>b&&F.id!=='rne'?`<div class="own">지금 제공, ${b.t}: <b style="color:${b.on>0?'var(--ok)':b.on<0?'#e0866a':'var(--dim)'}">밤마다 ${fxText(b.fx).replace(/<[^>]+>/g,'')}</b> ${b.on>0?'':b.on<0?'(‘불안정’ 이하: 해로움)':'(꺼짐: ‘충성’ 필요)'}</div>`:'')(facBonus(S,F))}
      ${F.id==='rne'&&f.n>0?(b=>`<div class="own" style="flex:none"><span class="p">병력:</span> 전투원 ${f.n}명, 방어력 ${f.n*3}. <span class="n">대가:</span> 낙인 ${b}/3, 밤에 모스크바 −${Math.min(3,b+1)}${b>=1?', 정통성 −'+(b>=2?2:1):''}, 온건파 이탈.</div>`)(S.flags.brand||0):''}
      <div class="acts">${acts}</div>`;
    $('w-det').querySelectorAll('.act').forEach(e=>e.onclick=()=>doFacAct(F.id,+e.dataset.i)); drawFaces($('w-det'));
  }
  $('w-orders').textContent='명령: '+S.orders;
}
const FACTION_ACTS=[
  {t:'지도부와 협상',  fx:F=>({fac:{[F.id]:{loy:2}}})},
  {t:'질서를 촉구',     fx:F=>({rad:-3,fac:{[F.id]:{loy:-1}}})},
];
const RNE_OUT={t:'건물에서 쫓아내기', fx:F=>({city:4,leg:3,hope:-4,rad:-5}), run:()=>{S.fac.rne.n=0;S.flags.rneOut=1;S.flags.brand=Math.max(0,(S.flags.brand||0)-1);}};
const facActs=fid=>fid==='rne'?[FACTION_ACTS[0],RNE_OUT]:FACTION_ACTS;
function facActState(fid,i){const f=S.fac[fid]; if(f.n<=0)return '건물에 없음'; if(S.used['f'+fid+i])return '오늘 이미 함'; if(!S.orders)return '아침까지 명령 없음'; return true;}
function doFacAct(fid,i){if(facActState(fid,i)!==true)return; const a=facActs(fid)[i]; apply(a.fx(FACTIONS.find(F=>F.id===fid))); if(a.run)a.run();
  S.orders--;S.used['f'+fid+i]=1; log(FACTIONS.find(F=>F.id===fid).nm+': '+a.t.toLowerCase()+'.'); save(); renderWH();}

// =====================================================================================================
// ===== the assault: a separate level, two hours per turn from 07:00 to 17:00 =====
function unitStance(u){if(u.src==='alpha')return S.A&&S.A.alpha||'wait'; if(u.id==='omon'){const o=S.omon==null?100:S.omon;return o<=60?'waver':'attack';}const v=S.pts[u.src]; if(u.src==='mvd')return v>=50?'refuse':v>=30?'waver':'attack'; return v>=65?'refuse':v>=45?'waver':'attack';}
const STANCE_NM={attack:'진격 중',waver:'동요',halt:'멈춰 섬',refuse:'거부',wait:'예비대',stopped:'철수함'};
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
  alog(refused.length?'명령 집행을 거부: '+refused.join(', ')+'.':'크렘린의 모든 부대가 명령을 집행하고 있다.');
  A.lost=0; A.muster=musterRoll(A);
  // подготовка превращается в силу штурма: Легитимность, Москва, готовность ОМОНа и лояльность ведомств сбивают стартовый дух частей
  { const L=A.muster, dn=(u,d)=>{ if(u.cur>3&&u.id!=='alpha')u.mor=clamp(uMorV(u)-d,28,100); };
    const dl=S.leg>50?Math.round((S.leg-50)*.5):0; if(dl){for(const u of A.units)dn(u,dl); L.push({g:1,t:'정통성 '+S.leg+': 크렘린 부대는 내키지 않는 듯 전진, 모두의 사기 −'+dl});}
    const om=A.units.find(u=>u.id==='omon'), rd=S.omon==null?100:S.omon, do1=Math.round((100-rd)*.5)+(S.city>60?Math.round((S.city-60)*.3):0); if(do1&&om.cur>3){dn(om,do1); L.push({g:1,t:'OMON은 싸우려 하지 않음 (준비도 '+rd+'%, 모스크바 '+S.city+'%): 사기 −'+do1});}
    for(const u of A.units){const U=UNITS.find(x=>x.id===u.id); if(U.src==='alpha'||u.cur<=3)continue; const v=S.pts[U.src], d=v>30?Math.round((v-30)*.3):0; if(d)dn(u,d);}
    if(S.flags.corner){A.noRes=1; for(const u of A.units)dn(u,10); L.push({g:1,t:'크렘린이 궁지에 몰렸다: 명령은 서둘러 내려졌고 예비대는 없다, 모두의 사기 −10'});} }
  save(); show('assault'); renderAssault(); musterCard();
}
// ---------- the last night: everyone you dealt with shows up, or does not. Like a final battle, every earlier choice counts ----------
function musterRoll(A){const L=[], add=(g,t)=>L.push({g,t}), lv=id=>S.fac[id].n>0?loyLvl(S.fac[id].loy):-1, hp=d=>{S.hope=clamp(S.hope+d,0,100);};
  const mul=(id,k)=>{const u=A.units.find(x=>x.id===id); if(u)u.cur*=k;};
  // фракции внутри
  let l=lv('kr'); if(l>=3){S.ppl+=400;add(1,'공산주의자들이 공장 민병대를 데려왔다: 시민 +400');} else if(l>=0&&l<=1){const n=S.fac.kr.n;S.fac.kr.n=0;hp(-3);add(0,'공산주의자들이 밤에 떠났다, 전원 '+n+': 결의 −3');}
  l=lv('ros'); if(l>=3){hp(6);add(1,'‘러시아’가 회의실을 지킨다: 결의 +6');} else if(l>=0&&l<=1){S.fac.ros.n=0;hp(-2);add(0,'‘러시아’가 새벽 전에 건물을 떠났다: 결의 −2');}
  l=lv('agr'); if(l>=3){A.stock+=4;A.medK=.8;add(1,'농업파가 취사장과 야전병원을 차렸다: 보급 +4, 손실 20% 감소');} else if(l>=0&&l<=1){S.fac.agr.n=0;add(0,'농업파는 고향 주로 돌아갔다');}
  l=lv('otc'); if(l>=3){A.gsB=.2;mul('taman',.9);add(1,'‘조국’은 지휘관들의 주파수와 이름을 안다: 총참모부에 거는 전화가 더 확실하다, 차량화보병 −10%');}
    else if(l>=0&&l<=1){A.leak=1;S.fac.otc.n=0;add(0,'‘조국’ 의원들이 떠나면서 총참모부에 누가 무엇을 지휘하는지 알렸다: 돌격 +12%, 탑의 엄호는 절반 수준');}
  l=lv('sm'); if(l>=3){A.air=Math.min(100,A.air+15);add(1,'‘교체’가 외신 기자들을 층마다 안내한다: 방송 +15');} else if(l>=0&&l<=1){A.air=Math.max(0,A.air-15);hp(-4);S.fac.sm.n=0;add(0,'‘교체’가 백기를 들고 카메라 앞에 나섰다: 방송 −15, 결의 −4');}
  l=lv('kol'); if(l>=3){hp(3);add(1,'‘동요파’가 남았다. 회의장 정족수: 결의 +3');} else if(l>=0&&l<=1){A.ctl.entr-=10;A.ctl.front-=10;S.fac.kol.n=0;add(0,'‘동요파’가 봉쇄선을 통해 나가며 초소 위치를 알려줬다: 양쪽 출입구 −10');}
  l=lv('rne'); if(l>=3){A.ctl.entr=Math.min(100,A.ctl.entr+10);add(1,'RNE가 20번 출입구를 지킨다: 취약한 출입구 +10');} else if(l>=0&&l<=1){const g=Math.min(100,freeGuns(S));S.gun-=g;A.ammo=Math.max(0,A.ammo-g);S.fac.rne.n=0;S.flags.rneLeft=1;add(0,'바르카쇼프 부대가 하수도로 빠져나가며 총을 가져갔다: 무기 −'+g);}
  l=lv('so'); if(l>=3)add(1,'‘장교 연맹’이 방어 사령부를 맡았다: 모든 구역이 더 잘 버틴다'); else if(l>=0&&l<=1){A.air=Math.max(0,A.air-10);S.rad=clamp(S.rad+5,0,100);add(0,'테레호프의 장교들이 제멋대로 싸운다: 방송 −10, 급진성 +5');}
  // силы снаружи
  for(const [id,nm] of [['mo','국방부'],['gs','총참모부'],['mvd','내무부']]){const v=S.pts[id],hi=id==='mvd'?50:65,lo=id==='mvd'?30:45; add(v>=lo?1:0,nm+' ('+v+'% 당신들 편, 거부 '+hi+'): '+(v>=hi?'부대가 명령 집행을 거부했다':v>=lo?'부대가 망설이며 절반의 전력으로 나아간다':'부대가 명령을 집행하고 있다'));}
  {const o=S.omon==null?100:S.omon; add(o<=60?1:0,'OMON: '+(o<=60?'망설이며 절반의 전력으로 나아간다':'명령을 집행하고 있다')+' (준비도 '+o+'%)');}
  if(S.pts.mer>=60){A.medK=(A.medK||1)*.85;add(1,'시청이 구급차를 회수하지 않았다: 손실 15% 감소');} else if(S.pts.mer<25&&S.bar>0){S.bar--;add(0,'시청이 불도저를 내줬다: 새벽 전에 바리케이드 한 줄이 치워졌다');}
  if(S.pts.smo>=60){A.incoming+=500;add(1,'스몰렌스카야에서 행렬이 온다: 한 시간 뒤 +500명');}
  if(S.city>=60){A.incoming+=600;add(1,'모스크바가 당신들 편이다: 한 시간 뒤 벽 앞에 600명 더');} else if(S.city<=25){const d=Math.round(S.ppl*.15);S.ppl-=d;add(0,'모스크바가 텔레비전으로 강습을 본다: '+fmt(d)+' 명이 밤에 벽을 떠났다');}
  // пресса
  for(const o of OUTLETS){const st=outSt(S,o), f=o.fin&&o.fin[st]; if(!f||!f.t)continue; const x=f.fx;
    if(x.air)A.air=clamp(A.air+x.air,0,100); if(x.hope)hp(x.hope); if(x.inc)A.incoming+=x.inc; if(x.ppl)S.ppl=Math.max(0,S.ppl+x.ppl); if(x.mil){S.mil+=x.mil;S.gun+=x.mil;}
    if(x.ctl){A.ctl.entr+=x.ctl;A.ctl.front+=x.ctl;} if(x.all)for(const u of A.units)u.cur*=x.all; if(x.u)for(const k in x.u)mul(k,x.u[k]);
    add(st==='vs'?1:0,f.t);}
  if((S.flags.brand||0)>=2){A.air=Math.max(0,A.air-12);add(0,'‘의회에 파시스트들’이라는 낙인: 서방이 외면한다. 방송 −12');}
  // что вы успели сделать
  if(S.flags.tunnel){A.tunnel=1;add(1,'하수도가 탐사되었다: 부상자들을 지하로 빼낸다, 시간당 두 배');}
  if(S.flags.noComms)add(0,'통신 없음: 연락할 사람이 없고 방송은 두 배 비싸다');
  if(S.flags.noPower){hp(-3);add(0,'건물에 전기 없음: 결의 −3');} else if(S.flags.gen)add(1,'발전기 가동: 전기와 무전 있음');
  if(S.bar>=4)add(1,'바리케이드 '+S.bar+' 줄: 출입구가 더 오래 버틴다');
  if(deputies(S)<QUORUM){hp(-4);add(0,'정족수 없음: 회의장에 '+deputies(S)+' 명의 의원. 결의 −4');}
  A.ctl.entr=clamp(A.ctl.entr,20,100);A.ctl.front=clamp(A.ctl.front,20,100);
  return L;}
function musterCard(){const A=S.A; A.card='muster'; save(); Sfx.play('engine');
  const col=g=>A.muster.filter(m=>m.g===g).map(m=>`<div class="ml ${g?'p':'n'}">${g?'+':'−'} ${m.t}</div>`).join('')||'<div class="ml">아무도 없음</div>';
  $('modal-win').innerHTML=`<h2>마지막 밤: 누가 함께하는가</h2><div class="sub">지난 두 주 동안 여러분이 한 모든 일이 벽까지 닿았거나 닿지 못했다. 계파, 치안 세력, 언론, 그리고 여러분의 결정.</div>
   <div class="mus"><div><h3>당신들 편</h3>${col(1)}</div><div><h3>당신들 반대</h3>${col(0)}</div></div><div class="close">ENTER — 전투로</div>`;
  $('modal').classList.add('on'); $('modal-win').querySelector('.close').onclick=musterClose;}
function musterClose(){const A=S.A; if(!A||A.card!=='muster')return; Sfx.play('boom'); A.card=0; $('modal').classList.remove('on'); save(); renderAssault(); if(A.allRef&&A.alpha==='wait'){alog('군대, 내무군, OMON은 건물로 가지 않았다. 크렘린에는 특수부대만 남았다.');return alphaCard();} incidentCard();}
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
  if(A.incoming){S.ppl+=A.incoming;alog('모스크바 시민들이 백악관까지 밀고 들어왔다: +'+fmt(A.incoming)+'.');A.incoming=0;}
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
      uMor(u,-(dl*1.0)-(Ar<=D?2:-2)); u.why=Ar<=D?'격퇴됨':'손실';
      if(u.dead>=U.str*.6&&u.cur>3){u.cur=0;u.st='stopped';u.why='피를 많이 흘림';alog(U.nm+': 병력의 절반 이상을 잃었고, 일부는 건물에서 물러났다.');aBanner(U.nm.toUpperCase()+': 전투에서 철수','병력의 절반 이상을 잃음 ('+fmt(u.lost)+'). 지휘부가 일부를 건물에서 물렸다.',true);}}
    A.last[s]={D:Math.round(D),A:Math.round(Ar),lost,kl};
    const nm=SECTORS.find(x=>x.id===s).nm;
    if(Ar>0)alog(`${nm}: ${Ar>D?'밀어붙임':'버팀'}. 우리 손실 ${fmt(lost)}, 상대 ${fmt(kl)}.`,Ar>D?'bad':'');}
  const tk=A.units.find(u=>u.id==='tanks'), T=uEff(tk);
  if(T>0){const hl=Math.round(T/6+A.fire/5);S.hope=clamp(S.hope-hl,0,100);A.fire=Math.min(15,A.fire+T/20);
    const tl=Math.round(A.shares.tower/100*defForce()*.04*T/30);S.mil=Math.max(0,S.mil-tl);
    alog(`전차가 탑을 두드린다. 층이 불타고 있다. 결의 −${hl}.`,'bad');}
  else if(A.fire>0){const hl=Math.round(A.fire/5);A.fire=Math.min(15,A.fire+.5);if(hl){S.hope=clamp(S.hope-hl,0,100);alog(`불길이 층마다 번진다. 결의 −${hl}.`,'bad');}}
  // wounded: the med post treats some; the rest lie in corridors and break morale
  const tr=Math.min(A.wnd,Math.round(A.wnd*.3*roomQ(S,'med')*(A.tunnel?2:1))); A.wnd-=tr; if(A.wnd>=40){const wl=Math.min(6,Math.round(A.wnd/80));if(wl){S.hope=clamp(S.hope-wl,0,100);alog(`부상자를 눕힐 곳이 없다: ${fmt(A.wnd)}. 결의 −${wl}.`,'bad');}}
  // live air: while the world is watching, wavering units look for a reason to stop
  // камеры: эфир точит дух каждый час, а бойня под камерами точит вдвойне
  {const bl=A.air>=40?Math.min(5,lostHour/50):0; for(const u of A.units){if(u.cur<=3)continue; const d=A.air/150+(uEff(u)>0?bl:0)+(A.air>=60&&uState(u)==='waver'?3:0); if(d>0){uMor(u,-d); if(d>=3&&!u.why)u.why='카메라';}}}
  // танки одни не воюют: если пехота стоит, экипажи не хотят в одиночку расстреливать парламент
  if(tk.cur>3&&!A.units.some(u=>u.id!=='tanks'&&uEff(u)>0)){uMor(tk,-20);tk.why='보병이 멈췄다';}
  // большая кровь у Кремля: резервы не шлют, танкисты сникают
  if(kDead(A)>=450&&tk.cur>3){uMor(tk,-8);if(!tk.why)tk.why='강습 손실';}
  for(const u of A.units){if(u.cur<=3)continue; const was=u.mor0>=MOR_GO?2:u.mor0>=MOR_HALT?1:0, m=uMorV(u), now=m>=MOR_GO?2:m>=MOR_HALT?1:0; if(now===was)continue; const nm=UNITS.find(x=>x.id===u.id).nm;
    if(now===0){u.cur=0;u.st='stopped';u.halt=1;} // встали — значит вышли из боя насовсем: вернуть часть Кремль уже не может
    const tx=now===0?'멈춰 섰고 더 나아가지 않는다':now===1?(was===2?'흔들려서 절반의 전력으로 나아간다':'다시 움직였지만 절반의 전력이다'):'다시 공격 중';
    alog(nm+': '+tx+(u.why?' ('+u.why+')':'')+'.',now>was?'bad':''); aBanner(nm.toUpperCase()+': '+(now===0?'전투에서 빠졌다':now===1?(was===2?'흔들림':'다시 전진'):'다시 공격'),'사기 '+Math.round(m)+'%'+(u.why?' · 이유: '+u.why:'')+'. '+(now===0?'병사들이 멈췄고 더 나아가지 않는다. 이 부대는 다시 전투에 돌아오지 않을 것이다.':tx[0].toUpperCase()+tx.slice(1)+'.'),now<was);}
  // кровь меняет политику: каждые 500 убитых и раненых с обеих сторон — Радикализм +3, Легитимность −2
  {const bl=Math.floor(((A.lost||0)+kDead(A))/500); if(bl>(A.blood||0)){const d=bl-(A.blood||0);A.blood=bl;S.rad=clamp(S.rad+3*d,0,100);S.leg=clamp(S.leg-2*d,0,100);alog(`사상자 수가 ${fmt(bl*500)}명을 넘었다. 급진성 +${3*d}, 정통성 −${2*d}.`,'bad');}}
  A.air=clamp(A.air+airGain(),0,100); // эфир не тает: каждый час капает от своих изданий
  // ammunition: every hour of fighting eats the stock; with empty magazines the doors hold much worse
  if(A.shares.tower<10){S.hope=clamp(S.hope-2,0,100);A.fire=Math.min(15,A.fire+1);alog('탑이 비었다: 상층은 다른 사수들이 차지했고 불을 끌 사람이 없다. 결의 −2.','bad');}
  if(S.mil>0){const am=Math.round(S.mil/8); const had=A.ammo>0; A.ammo=Math.max(0,A.ammo-am); if(had&&A.ammo<=0)alog('탄약이 떨어졌다. 방어는 개머리판과 병으로 버틴다.','bad');}
  // siege: after noon reserves come up to the units whose structures stayed with the Kremlin, and the House tires
  if(A.r>=5){S.hope=clamp(S.hope-1,0,100); if(A.r%2===1){ if(A.noRes)alog('예비대가 없다: 크렘린은 더 보낼 사람이 없다.'); else if(kDead(A)>=350)alog('예비대가 없다: 이런 손실 후 크렘린은 새 부대를 보낼 엄두를 내지 못한다.'); else{for(const u of A.units){const U=UNITS.find(x=>x.id===u.id); if(u.cur>3&&uEff(u)>0){u.cur=Math.min(U.str*1.2,u.cur+U.str*.15);uMor(u,8);if(!u.why)u.why='예비대';}} alog('강습 부대에 예비대가 도착했다. 건물은 소모전으로 점령된다.','bad');} } }
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
    const t=u.id==='alpha'&&A.alpha==='wait'?['','끝내 전투에 투입되지 않았다']:st==='refuse'?['p',u.id==='alpha'?'강습을 거부했다':'명령 집행을 거부했고, 전투에 참여하지 않았다']:st==='stopped'?['p','전투에서 빠졌다'+(u.why?' ('+u.why+')':'')+(u.id==='tanks'?'':', 손실 '+lost)]
      :st==='halt'?['p','멈춰 서서 나아가지 않는다: 사기 '+m+'%'+(u.id==='tanks'?'':', 손실 '+lost)]:st==='waver'?['','흔들림: 사기 '+m+'%'+(u.id==='tanks'?'':', 손실 '+lost)]:['n',(u.id==='tanks'?'사격 중':'진격 중')+': 사기 '+m+'%'+(u.id==='tanks'?'':', 손실 '+lost)];
    return `<div><b>${U.nm}</b><span class="${t[0]}">${t[1]}</span></div>`;};
  const going=A.units.filter(u=>uEff(u)>0&&u.id!=='tanks').map(u=>UNITS.find(x=>x.id===u.id).nm);
  const T={
    fell:['건물 점령',`${why==='entr'?'20번 출입구':'정문'}이 함락되었다: 그곳에는 수비대가 남아 있지 않고 강습 부대는 층마다 있다. 아직 전진 중인 부대(${going.join(', ')||'아무도 없음'})가 건물에 들어갔다. 그들의 사기와 당신들의 손실은 이제 장애가 되지 않는다: 문은 열렸다.`],
    broken:['사격 중지',`수비대의 결의가 0으로 떨어졌다: 전차 포격, 층의 화재, 복도의 부상자들이 제 몫을 했다. 출입구는 아직 버티고 있었지만 지킬 사람이 없었다. 창문에서 흰 천이 내걸렸다.`],
    held:why==='dark'?['어둠. 강습 중단',`열두 시간의 전투였지만 건물은 점령되지 않았다. 어둠 속에서 크렘린은 계속할 엄두를 내지 못했다: ${going.length?'아직 전진하던 부대 ('+going.join(', ')+'), 벽에서 물러나라는 명령을 받았다. 당신들이 그들을 무찌른 것이 아니라, 버텨서 이긴 것이다.':'더 전진할 사람이 없었다.'}`]
      :['강습이 동력을 잃었다',`${A.units.some(u=>u.cur>3)?'세 시간 연속 어떤 부대도 전진하지 않았다':'벽 앞에 전진할 수 있는 부대가 남아 있지 않다'}. 지휘관들은 크렘린에 병력이 일어나지 않는다고 보고한다. 총소리는 저절로 잦아들었다.`]}[id];
  $('modal-win').innerHTML=`<h2>${T[0]}</h2><div class="sub">${HOURS[Math.min(A.r,HOURS.length-1)]}, 전투 ${Math.min(A.r,HOURS.length)}시간 경과 / 총 ${HOURS.length}시간. ${T[1]}</div>
   <div class="finl">${A.units.map(unitLine).join('')}<div><b>당신들의 손실</b><span>사상자 ${fmt(A.lost||0)}명 · 출입구: 입구 ${Math.round(A.ctl.entr)}%, 정문 ${Math.round(A.ctl.front)}% · 결의 ${S.hope}%</span></div></div><div class="close">ENTER — 그다음에 일어난 일</div>`;
  $('modal').classList.add('on'); $('modal-win').querySelector('.close').onclick=finaleGo; renderAssaultSafe();}
function renderAssaultSafe(){try{renderAssault();}catch(e){}}
function finaleGo(){const A=S.A; if(!A||A.card!=='fin')return; A.card=0; $('modal').classList.remove('on'); ending(A.finId);}
function alphaCard(){
  const A=S.A;
  const DS=[[S.leg>=50,'정통성 50 이상 (현재 '+S.leg+')'],[A.air>=40,'방송 40 이상 (현재 '+Math.round(A.air)+')']], draw=DS.every(x=>x[0]);
  $('modal-win').innerHTML=`<h2>출입구의 ‘알파’</h2><div class="sub">${A.allRef?'명령을 집행한 부대는 하나도 없다. 크렘린에 남은 마지막 예비대는 ‘알파’와 ‘벰펠’이다.':'강습 네 시간째, 건물은 여전히 점령되지 않았다. 크렘린은 마지막 예비대인 ‘알파’와 ‘벰펠’을 투입한다.'} 그들의 장교들은 의회에 발포하고 싶지 않으며, 자신들의 보장 아래 사람들을 내보내자고 제안한다. 어떻게 끝날지는 나라가 그들을 지켜보고 있는지에 달려 있다.</div>`+
    [{t:'‘알파’를 들이고 그 보장 아래 나온다',d:draw?'<span class="p">중립적 결과:</span> ‘알파’가 카메라 앞에서 강습을 거부한다. 건물은 잃지만 옐친은 더 이상 지휘할 수 없다.':'<span class="n">패배:</span> 조용한 항복. 중립으로 만들려면 '+DS.filter(x=>!x[0]).map(x=>x[1]).join(' 그리고 ')+'.'},
     {t:'무전으로 장교들에게 호소',d:S.A.air>=10?`방송 −10 · ‘알파’가 강습을 거부하고 철수할 확률 ${Math.round((.25+S.leg/250)*100)}%. ${S.A.allRef?'그러면 강습할 사람이 없게 된다':'나머지 부대와의 전투는 계속된다'}`:'<span class="n">방송 10 필요</span>'},
     {t:'싸운다',d:'‘알파’는 20번 출입구를 강습할 것이다. 크렘린에서 가장 강한 부대다.'}]
    .map((c,i)=>`<div class="law" data-i="${i}"><div class="t">${i+1}. ${c.t}</div><div class="d">${c.d}</div></div>`).join('');
  $('modal').classList.add('on'); A.card=1;
  $('modal-win').querySelectorAll('.law').forEach(e=>e.onclick=()=>alphaChoose(+e.dataset.i));
}
function alphaChoose(i){const A=S.A; const u=A.units.find(x=>x.id==='alpha'), base=UNITS.find(x=>x.id==='alpha').str;
  if(i===1&&S.A.air<10)return;
  A.card=0; closeModal();
  if(i===0){S.chron.push({date:dateStr(S.day),h:'‘알파’',ch:'협상'});return ending(S.leg>=50&&A.air>=40?'draw_alpha':'surrender_alpha');}
  if(i===1){S.A.air-=10; u.mor=90; if(Math.random()<.25+S.leg/250){A.alpha='refuse';u.cur=0;alog('‘알파’는 의회 강습을 거부했다.');aBanner('‘알파’ 거부','장교들은 무전으로 당신들의 말을 듣고 강습에 나서지 않았다. 다른 부대와의 전투는 계속된다.',true);}
    else{A.alpha='attack';u.cur=base;alog('‘알파’ 장교들은 듣지 않았다. 출입구 강습.','bad');}}
  if(i===2){A.alpha='attack';u.cur=base;alog('‘알파’가 20번 출입구를 강습한다.','bad');}
  S.chron.push({date:dateStr(S.day),h:'‘알파’',ch:['협상','무전 호소','전투'][i]});
  save(); renderAssault();
}
// ---------- incidents: one per hour, something happens and has to be balanced against the rest ----------
const uMor=(u,d)=>{u.mor=clamp((u.mor==null?80:u.mor)+d,0,100);};
const uOn=(A,id)=>uEff(A.units.find(u=>u.id===id))>0;
function uMul(A,id,k,force){const u=A.units.find(x=>x.id===id),U=UNITS.find(x=>x.id===id); if(u.cur<=3)return; u.cur=Math.min(U.str*1.5,u.cur*k);}
function uStop(A,id,why){const u=A.units.find(x=>x.id===id); u.cur=0;u.st='stopped';alog(UNITS.find(x=>x.id===id).nm+': '+why+'.');}
function uBack(A,k){const u=A.units.find(u=>(u.st==='refuse'||u.st==='stopped')&&u.id!=='alpha'); if(!u)return; const U=UNITS.find(x=>x.id===u.id); u.cur=U.str*k;u.st='attack';u.mor=Math.max(uMorV(u),60);u.dead=0;alog(U.nm+': 다시 대열에 복귀.','bad');}
const yCallUnit=A=>A.units.filter(u=>u.cur>3&&!u.called&&uMorV(u)<MOR_GO&&!(u.id==='alpha'&&A.alpha!=='attack')).sort((x,y)=>UNITS.find(q=>q.id===y.id).str-UNITS.find(q=>q.id===x.id).str)[0];
const yCallLoy=u=>{const U=UNITS.find(x=>x.id===u.id);return U.src==='alpha'?40:u.id==='omon'?100-(S.omon==null?100:S.omon):S.pts[U.src];};
const yCallGain=A=>Math.max(10,Math.round(40-yCallLoy(yCallUnit(A))/3)); // чем лояльнее вам структура, тем слабее действует звонок
const yCallTalk=A=>clamp(.15+yCallLoy(yCallUnit(A))/200+S.leg/400,.1,.7);
const gsChance=k=>clamp(S.pts.gs/130+(S.A.gsB||0)+(k||0),.05,.75);
const INCIDENTS=[
  // звонок в Генштаб: открывается приказом, не случайно. Генштабу подчинены только мотострелки; ВВ и ОМОН — это МВД, танки — Минобороны
  {id:'gs_call', who:'kolesn', cond:A=>false, h:'총참모부에 건 전화', p:()=>{const u=S.A.units.find(x=>x.id==='taman');return `의원 출신 장군들이 총참모장에게 전화를 연결했다. 콜레스니코프는 말없이 듣고 있다. 그의 차량화보병은 지금 정문에 있다: 사기 ${Math.round(uMorV(u))}%, 손실 ${fmt(u.lost||0)}. 총참모부의 여러분 편 지지율은 ${S.pts.gs}%다. 내무군과 OMON은 그의 지휘를 받지 않고, 전차도 마찬가지다. 논의할 수 있는 것은 타만 사단뿐이다.`;},
   ch:[{t:'사단을 건물에서 물려 달라고 요청',d:()=>'성공률 '+Math.round(gsChance()*100)+'%: 차량화보병은 완전히 철수한다. 그렇지 않으면 그는 크렘린에 보고한다: 그들의 사기 +10',run:A=>{const u=A.units.find(x=>x.id==='taman'); if(Math.random()<gsChance()){u.cur=0;u.st='stopped';u.why='총참모부가 철수시켰다';alog('차량화보병: 총참모부가 사단을 건물에서 철수시켰다.');aBanner('차량화보병: 철수','콜레스니코프는 타만 사단에 백악관에서 물러나라고 명령했다.',true);}else{u.mor0=uMorV(u);uMor(u,10);u.why='통화 실패';alog('콜레스니코프는 듣고 전화를 끊었다. 1분 뒤 크렘린은 그 통화를 알았다.','bad');aBanner('총참모부 거부','콜레스니코프는 그 통화를 크렘린에 보고했다. 차량화보병의 사기 +10.',false);}}},
       {t:'서두르지 말도록 요청: 중대들을 엎드려 기다리게 한다',d:()=>'확실히: 차량화보병 사기 −15',rq:'총참모부 30',req:()=>S.pts.gs>=30,run:A=>{const u=A.units.find(x=>x.id==='taman');u.mor0=uMorV(u);uMor(u,-15);u.why='총참모부가 시간을 끈다';alog('총참모부는 명령을 취소하지 않았지만 재촉하지도 않았다. 차량화보병은 엎드렸다.');}},
       {t:'인민대표대회 결의를 낭독: 명령은 범죄이며 본인이 직접 책임을 진다',d:()=>'성공률 '+Math.round(gsChance(.2)*100)+'%: 차량화보병이 철수한다. 그렇지 않으면 정통성 −3, 그들의 사기 +10',rq:'정통성 60',req:()=>S.leg>=60,run:A=>{const u=A.units.find(x=>x.id==='taman'); if(Math.random()<gsChance(.2)){u.cur=0;u.st='stopped';u.why='총참모부가 철수시켰다';alog('차량화보병: 콜레스니코프는 강습의 책임을 지기 싫어했다. 사단이 철수했다.');aBanner('차량화보병: 철수','콜레스니코프는 강습에 대해 직접 책임지기를 원하지 않았다.',true);}else{u.mor0=uMorV(u);uMor(u,10);u.why='통화 실패';S.leg=clamp(S.leg-3,0,100);alog('콜레스니코프는 대통령에게 선서했다고 답했다. 통화 녹음은 크렘린 기자들에게 넘겨졌다.','bad');}}}]},
  {id:'y_addr', cond:A=>A.r>=1, h:'옐친의 연설', p:'오전 9시 대통령이 방송에 나온다: “모스크바의 무장 반란은 진압될 것이다. 평화로운 도시에 맞선 자들은 응당한 대가를 받을 것이다.” 병사들은 무전기로 듣고 있다.',
   ch:[{t:'응답하지 않기',d:'모든 부대 사기 +8 · 결의 −3',run:A=>{for(const u of A.units)uMor(u,8);S.hope=clamp(S.hope-3,0,100);}},
       {t:'생방송으로 응답: 의원들이 회의장에 있다, 그들에게 발포하고 있다',d:'방송 −8 · 부대 사기 −6',rq:'방송 30',req:()=>S.A.air>=30&&S.A.air>=8,run:A=>{S.A.air-=8;for(const u of A.units)uMor(u,-6);}},
       {t:'층에서 그의 연설을 틀어준다: 그들이 약속받은 것이 무엇인지 듣게 한다',d:'결의 +4 · 급진성 +4',run:A=>{S.hope=clamp(S.hope+4,0,100);S.rad=clamp(S.rad+4,0,100);}}]},
  // тяни-толкай: когда часть встала или заколебалась, Ельцин один раз лично звонит её командиру. Вернуть каждую часть он может только однажды
  {id:'y_call', multi:1, prio:1, cond:A=>A.r>=1&&!!yCallUnit(A), h:'크렘린의 전화', p:()=>{const u=yCallUnit(S.A),U=UNITS.find(x=>x.id===u.id);return `${U.nm}: 사기 ${Math.round(uMorV(u))}%, 부대가 흔들리며 절반의 전력으로 전진한다. 옐친이 지휘관에게 직접 전화를 건다: “거부하면 어떤 대가를 치를지 알겠나? 전진하라.” 그는 아직 싸우는 부대만 격려할 수 있고, 한 번뿐이다. 부대가 멈추면 아무도 되돌리지 못한다.`;},
   ch:[{t:'끼어들지 않기',d:()=>'부대 사기 +'+yCallGain(S.A),run:A=>{const u=yCallUnit(A),g=yCallGain(A);u.called=1;u.mor0=uMorV(u);uMor(u,g);u.why='옐친의 전화';}},
       {t:'그들의 주파수로: “지휘관, 이 명령은 범죄다, 책임은 당신이 진다”',d:()=>'방송 −10 · 부대 사기만 +'+Math.round(yCallGain(S.A)/3),rq:'방송 10',req:()=>S.A.air>=10,run:A=>{const u=yCallUnit(A),g=yCallGain(A);u.called=1;u.mor0=uMorV(u);A.air-=10;uMor(u,Math.round(g/3));u.why='통화가 끊겼다';}},
       {t:'백기를 든 의원 장교들을 그들에게 보낸다',d:()=>'성공률 '+Math.round(yCallTalk(S.A)*100)+'%: 부대가 완전히 철수한다. 그렇지 않으면 사기 +'+yCallGain(S.A)+', 결의 −3',run:A=>{const u=yCallUnit(A),U=UNITS.find(x=>x.id===u.id),g=yCallGain(A),ok=Math.random()<yCallTalk(A);u.called=1; if(ok){u.cur=0;u.st='stopped';u.why='부대를 이끌고 빠져나갔다';alog(U.nm+': 지휘관은 의원들의 말을 듣고 부대를 이끌고 나갔다.');aBanner(U.nm.toUpperCase()+': 빠져나감','지휘관은 의원들의 말을 듣고 부대를 건물에서 이끌고 나갔다.',true);}else{u.mor0=uMorV(u);uMor(u,g);u.why='옐친의 전화';S.hope=clamp(S.hope-3,0,100);alog('협상가들은 지휘관에게 접근하지 못했다.','bad');}}}]},
  {id:'y_order', cond:A=>A.r>=4&&A.units.some(u=>u.cur>3&&u.mor<=45), h:'서명이 있는 명령', p:'대통령의 친필 서명이 든 서면 명령이 부대 지휘관들에게 전달되었다. 이제 거부는 망설임이 아니라 군법회의를 뜻한다.',
   ch:[{t:'아무것도 하지 않는다',d:'모든 부대 사기 +15',run:A=>{for(const u of A.units)if(u.cur>3)uMor(u,15);}},
       {t:'방송으로 상기시킨다: 명령은 불법이다, 집행자가 책임진다',d:'방송 −10 · 사기 +15 대신 +5',rq:'정통성 50',req:()=>S.leg>=50&&S.A.air>=10,run:A=>{S.A.air-=10;for(const u of A.units)if(u.cur>3)uMor(u,5);}}]},
  // ----- части Кремля: кто отказывается, кто переходит, кого дожимают. Зависит от отношений со структурой -----
  {id:'u_tank', cond:A=>uOn(A,'tanks'), h:'승무원이 시동을 껐다', p:'다리 위의 전차 한 대가 침묵했다. 승무원 지휘관이 공개 채널로 묻는다: 의회 발포의 책임은 누가 지며, 거부한 사람은 어떻게 되는가.',
   ch:[{t:'침묵하기',d:'전차 −10%',run:A=>uMul(A,'tanks',.9)},
       {t:'최고회의의 이름으로 보장: 거부한 이들은 건드리지 않는다',d:'전차 −35%',rq:'정통성 60',req:()=>S.leg>=60,run:A=>uMul(A,'tanks',.65)},
       {t:'그들을 불러들인다: 포를 돌려라',d:'전차 한 대가 정문에 선다: 출입구 +15 · 급진성 +5 · 방송 −10',rq:'국방부 55',req:()=>S.pts.mo>=55,run:A=>{uMul(A,'tanks',.75);A.ctl.front=Math.min(100,A.ctl.front+15);S.rad=clamp(S.rad+5,0,100);A.air=Math.max(0,A.air-10);}}]},
  {id:'u_paid', pic:'tank', cond:A=>uOn(A,'tanks')&&S.pts.mo<50&&A.r>=1, h:'돈을 받는 승무원', p:'징집병들은 발포를 거부했다. 자원 장교들이 전차에 올라탄다: 각자에게 돈과 아파트가 약속되었다. 포수들은 숙련되어 있다.',
   ch:[{t:'아무것도 하지 않는다',d:'전차 +25%',run:A=>uMul(A,'tanks',1.25)},
       {t:'방송에서 이름과 대가를 밝힌다',d:'방송 +2 · 전차 +5%',rq:'방송 8',req:()=>S.A.air>=8,run:A=>{S.A.air-=8;uMul(A,'tanks',1.05);A.air=Math.min(100,A.air+10);}},
       {t:'사단장에게 전화: 자원병들을 빼라',d:'전차 −15%',rq:'국방부 40',req:()=>S.pts.mo>=40&&!S.flags.noComms,run:A=>uMul(A,'tanks',.85)}]},
  {id:'u_vv', cond:A=>uOn(A,'vv'), h:'연대는 나서지 않는다', p:'내무군 연대장이 무전으로 말한다: 그의 병력은 의회에 발포하지 않겠다. 그러나 넘어오지도 않겠다. 무엇을 원하는지 묻는다.',
   ch:[{t:'병력을 병영으로 되돌리게 한다',d:'내무군 −25%',run:A=>uMul(A,'vv',.75)},
       {t:'양측 사이에 사슬처럼 서 달라고 요청한다',d:'내무군 −45% · 출입구 +8',rq:'내무부 45',req:()=>S.pts.mvd>=45,run:A=>{uMul(A,'vv',.55);A.ctl.entr=Math.min(100,A.ctl.entr+8);}},
       {t:'무기를 들고 넘어오라고 요구한다',d:'50% 확률: 민병 +80, 무기 +80 · 실패 시 연대가 모욕감을 느껴 내무군 +15%',rq:'급진성 50%',req:()=>S.rad>=50,run:A=>{if(Math.random()<.5){S.mil+=80;S.gun+=80;uMul(A,'vv',.7);alog('내무군 연대가 최고회의 편으로 넘어왔다.');}else{uMul(A,'vv',1.15);alog('연대장은 전화를 끊었다. 내무군이 전진한다.','bad');}}}]},
  {id:'u_omon', cond:A=>uOn(A,'omon'), h:'OMON 멈춤', p:'모스크바 OMON이 정문에서 멈췄다. 대원들은 건물 안에 무장 세력만 있다고 들었다. 지휘관이 메가폰으로 외친다: 안에 누가 있는지 보여줘라.',
   ch:[{t:'머리 위로 사격한다',d:'OMON +10% · 결의 +2',run:A=>{uMul(A,'omon',1.1);S.hope=clamp(S.hope+2,0,100);}},
       {t:'신분증을 든 의원들을 계단 위로 내보낸다',d:'OMON 철수',rq:'정족수: '+QUORUM+' 명의 의원이 떠난다',req:()=>deputies(S)>=QUORUM,run:A=>uStop(A,'omon','의원들을 보고 건물에서 물러났다')},
       {t:'시청이 그들을 이용했다고 상기시킨다',d:'OMON −40%',rq:'시청 40',req:()=>S.pts.mer>=40,run:A=>uMul(A,'omon',.6)}]},
  {id:'u_general', cond:A=>A.r>=2&&A.units.some(u=>uState(u)==='waver'), h:'다리 위의 장군', p:'크렘린은 흔들리는 부대에 서면 명령과 군법회의 위협을 든 장군을 보냈다. 그는 대열을 따라 걸으며 지휘관들의 눈을 똑바로 본다.',
   ch:[{t:'기다린다',d:'흔들리던 부대들이 전력으로 공격한다',run:A=>{for(const u of A.units)if(uState(u)==='waver'){u.st='attack';u.mor=70;}}},
       {t:'의원 출신 장군들을 맞이하러 보낸다',d:'부대는 계속 흔들리며 15% 약화된다',rq:'총참모부 45',req:()=>S.pts.gs>=45,run:A=>{for(const u of A.units)if(u.st==='waver')u.cur*=.85;}},
       {t:'명령을 든 장군을 생방송으로 보여준다',d:'방송 −15 · 흔들리던 부대 하나가 철수하고 나머지는 공격한다',rq:'방송 40',req:()=>S.A.air>=40,run:A=>{A.air-=15;const w=A.units.filter(u=>uState(u)==='waver').sort((a,b)=>b.cur-a.cur);if(w[0])uStop(A,w[0].id,'카메라 시야 밖으로 빠졌다');for(const u of w.slice(1)){u.st='attack';u.cur=UNITS.find(x=>x.id===u.id).str;}}}]},
  {id:'u_tula', cond:A=>A.r>=5&&S.pts.gs<50, h:'툴라에서 온 낙하산병', p:'툴라 사단의 연대 하나가 모스크바에 도착했다. 연대장은 자신들이 누구를 위해 왔는지 아직 모른 채 순환도로에서 기다리고 있다.',
   ch:[{t:'아무것도 하지 않는다',d:'차량화보병 +35%',run:A=>uMul(A,'taman',1.35,1)},
       {t:'무전으로 그에게 말을 건다',d:'방송 −10 · 연대가 순환도로에 남을 확률 45%',rq:'방송 10',req:()=>S.A.air>=10,run:A=>{S.A.air-=10;if(Math.random()<.45)alog('툴라 연대는 순환도로에 머물며 도시로 들어가지 않는다.');else{uMul(A,'taman',1.35,1);alog('낙하산병들이 도시에 들어왔다.','bad');}}},
       {t:'사람들로 대로를 막는다',d:'시민 −400 · 차량화보병 +10%',rq:'시민 1500',req:()=>S.ppl>=1500,run:A=>{S.ppl-=400;uMul(A,'taman',1.1,1);}}]},
  {id:'u_column', cond:A=>A.r>=3&&S.pts.gs>=55, h:'행렬이 명령을 기다린다', p:'모스크바 근교 부대 지휘관이 보안 회선으로 전화한다: 그는 행렬을 백악관으로 이끌 준비가 되어 있다. 명령과 서명이 필요하다고 한다.',
   ch:[{t:'거부: 군대는 군대에 발포해선 안 된다',d:'방송 +10 · 결의 −2',run:A=>{A.air=Math.min(100,A.air+10);S.hope=clamp(S.hope-2,0,100);}},
       {t:'순환도로에 서서 기다리게 한다',d:'크렘린 모든 부대 −12%',run:A=>{for(const u of A.units)u.cur*=.88;}},
       {t:'명령에 서명: 행렬을 도시로',d:'민병 +150 · 무기 +150 · 결의 +6 · 급진성 +10 · 방송 −20',rq:'급진성 50%',req:()=>S.rad>=50,run:A=>{S.mil+=150;S.gun+=150;A.ammo+=150;S.hope=clamp(S.hope+6,0,100);S.rad=clamp(S.rad+10,0,100);A.air=Math.max(0,A.air-20);}}]},
  {id:'u_cops', cond:A=>S.pts.mvd>=50, h:'분대가 넘어왔다', p:'구 경찰서에서 근무 중인 경찰 30여 명이 근무용 무기를 들고 20번 출입구에 왔다. 선임 경관이 말한다: “우리는 법에 선서했다.”',
   ch:[{t:'창문에 배치한다',d:'민병 +40 · 무기 +40',run:A=>{S.mil+=40;S.gun+=40;}},
       {t:'제복을 입은 채 부상자와 여성들을 빼내게 한다',d:'부상자 이송 완료 · 방송 +10',run:A=>{A.wnd=0;A.air=Math.min(100,A.air+10);}},
       {t:'돌려보내 자기 사람들을 설득하게 한다',d:'내무군과 OMON −15%',run:A=>{uMul(A,'vv',.85);uMul(A,'omon',.85);}}]},
  {id:'u_back', cond:A=>false&&A.r>=3&&A.units.some(u=>(u.st==='refuse'||u.st==='stopped')&&u.id!=='alpha'), h:'거부자들을 압박한다', p:'강습을 거부한 부대의 지휘관은 해임되었다. 새 지휘관은 돈과 명령을 가져왔다. 병사들이 다시 집합된다.',
   ch:[{t:'아무것도 하지 않는다',d:'부대가 절반의 전력으로 복귀한다',run:A=>uBack(A,.5)},
       {t:'병사들에게 호소: 여러분은 두 번째로 속고 있다',d:'방송 −10 · 부대가 4분의 1의 전력으로 복귀한다',rq:'방송 10',req:()=>S.A.air>=10,run:A=>{S.A.air-=10;uBack(A,.25);}},
       {t:'해임된 지휘관을 임시 지휘관으로 선포한다',d:'부대는 제자리에 머문다',rq:'정통성 65',req:()=>S.leg>=65,run:A=>alog('병사들은 이전 지휘관의 말을 듣는다.')}]},
  {id:'floor', cond:A=>A.fire>=3, h:'12층이 불타고 있다', p:'불길이 케이블 샤프트를 타고 올라간다. 위쪽에는 인민대표대회 문서고와 미처 내려오지 못한 사람들이 있다.',
   ch:[{t:'사람들을 보내 불을 끈다',d:'시민 −150 · 화재 −5',run:A=>{S.ppl=Math.max(0,S.ppl-150);A.fire=Math.max(0,A.fire-5);}},
       {t:'강에서 양동이를 나르는 사람의 줄',d:'시민 −60 · 화재 −8',rq:'시민 1000',req:()=>S.ppl>=1000,run:A=>{S.ppl-=60;A.fire=Math.max(0,A.fire-8);}},
       {t:'그 층을 포기한다',d:'화재 +2 · 결의 −4',run:A=>{A.fire=Math.min(15,A.fire+2);S.hope=clamp(S.hope-4,0,100);}}]},
  {id:'wounded', cond:A=>A.wnd>=40, h:'20번 출입구의 부상자들', p:'붕대가 떨어져 의사들이 시트를 잘라 쓴다. 길 건너에는 구급차들이 서 있지만 봉쇄선이 들여보내지 않는다.',
   ch:[{t:'사격을 받으며 들것으로 빼낸다',d:'부상자 −60% · 민병 −20',run:A=>{A.wnd=Math.round(A.wnd*.4);S.mil=Math.max(0,S.mil-20);}},
       {t:'내무부 장교들에게 통로를 요청한다',d:'부상자 이송 완료 · 방송 +10',rq:'내무부 30',req:()=>S.pts.mvd>=30,run:A=>{A.wnd=0;A.air=Math.min(100,A.air+10);}},
       {t:'어두워질 때까지 기다린다',d:'결의 −6',run:A=>{S.hope=clamp(S.hope-6,0,100);}}]},
  {id:'cnn', cond:A=>true, h:'생방송', p:'맞은편 옥상의 CNN 카메라가 건물을 전 세계에 보여준다. 카메라맨이 손을 흔든다: 프레임에 누군가 세워 달라.',
   ch:[{t:'하스불라토프가 창가로 나간다',d:'방송 +20',run:A=>{A.air=Math.min(100,A.air+20);}},
       {t:'의원들과 여성들을 보여주고, 자동소총수들은 치운다',d:'방송 +35',rq:'급진성 40% 이하',req:()=>S.rad<=40,run:A=>{A.air=Math.min(100,A.air+35);}},
       {t:'카메라에 신경 쓸 틈 없다',d:'결의 +2',run:A=>{S.hope=clamp(S.hope+2,0,100);}}]},
  {id:'snipers', cond:A=>true, h:'지붕 위의 저격수', p:'정체불명의 사수들이 지붕에서 당신들 쪽과 병사들 모두를 쏜다. 양쪽 모두 상대가 쐈다고 확신한다.',
   ch:[{t:'사람들을 엄폐시킨다',d:'외벽 −8',run:A=>{A.ctl.front=Math.max(1,A.ctl.front-8);}},
       {t:'자체 인력으로 사수들을 제압한다',d:'민병 −15 · 결의 +4',rq:'민병 150',req:()=>S.mil>=150,run:A=>{S.mil-=15;S.hope=clamp(S.hope+4,0,100);}},
       {t:'방송에서 말한다: 우리가 아니다',d:'방송 −10 · 내무군 약화',rq:'방송 30',req:()=>S.A.air>=30,run:A=>{A.air-=10;const u=A.units.find(x=>x.id==='vv');u.cur*=.75;}}]},
  {id:'parley', cond:A=>A.r>=2, h:'협상 사절', p:'백기를 든 장교가 여성과 부상자를 빼낼 수 있도록 30분 휴전을 제안한다. 그 뒤에는 더 나빠질 것이라고 말한다.',
   ch:[{t:'동의한다',d:'시민 −300 · 부상자 이송 완료 · 결의 −3',run:A=>{S.ppl=Math.max(0,S.ppl-300);A.wnd=0;S.hope=clamp(S.hope-3,0,100);}},
       {t:'중재자를 요구: 총대주교, 법원, 지방',d:'방송 +15 · 공세가 약해진다',rq:'정통성 70',req:()=>S.leg>=70,run:A=>{A.air=Math.min(100,A.air+15);for(const u of A.units)u.cur*=.9;}},
       {t:'거부하기',d:'결의 +3',run:A=>{S.hope=clamp(S.hope+3,0,100);}}]},
  {id:'hall', pic:'tank', cond:A=>A.units.find(u=>u.id==='tanks').cur>0, h:'회의장의 포탄', p:'관통탄이 회의장 벽을 뚫었다. 의원들이 의자 사이에 엎드려 있다. 누군가 지하로 내려가자고 제안한다.',
   ch:[{t:'모두 지하로',d:'결의 −4',run:A=>{S.hope=clamp(S.hope-4,0,100);}},
       {t:'회의를 계속한다',d:'결의 +5 · 방송 +10 · 의원 10명이 떠날 것이다',rq:'결의 50%',req:()=>S.hope>=50,run:A=>{S.hope=clamp(S.hope+5,0,100);A.air=Math.min(100,A.air+10);S.fac.kol.n=Math.max(0,S.fac.kol.n-10);}}]},
  {id:'ammo', cond:A=>A.r>=1, h:'탄약', p:'출입구마다 총 한 자루당 탄창 하나만 남았다. 지휘관들이 어디서 더 구할지 묻는다.',
   ch:[{t:'단발로 쏜다',d:'탄약 +40 · 양쪽 출입구 −6',run:A=>{A.ammo+=40;A.ctl.entr=Math.max(1,A.ctl.entr-6);A.ctl.front=Math.max(1,A.ctl.front-6);}},
       {t:'층마다, 그리고 비무장 인원에게서 거둬들인다',d:'탄약 +100 · 시민 −80',rq:'시민 500',req:()=>S.ppl>=500,run:A=>{A.ammo+=100;S.ppl-=80;}},
       {t:'비상 비축분을 푼다',d:'탄약 +200',rq:'무기 300',req:()=>S.gun>=300,run:A=>{A.ammo+=200;}}]},
  {id:'crowd', cond:A=>S.city>=35, h:'강변', p:'다리와 강변에는 수천 명의 모스크바 시민이 있다. 일부는 영화를 보듯 구경하고, 다른 이들은 건물을 향해 걸어갈 준비가 되어 있다.',
   ch:[{t:'사격선에서 물러나 달라고 요청한다',d:'결의 +1',run:A=>{S.hope=clamp(S.hope+1,0,100);}},
       {t:'살아 있는 고리로 불러 모은다',d:'한 시간 뒤 +800명 · 방송 +10',rq:'모스크바 55%',req:()=>S.city>=55,run:A=>{A.incoming+=800;A.air=Math.min(100,A.air+10);}}]},
  {id:'water', cond:A=>A.fire>=2, h:'소화전이 말라 있다', p:'건물의 물은 일주일 전에 끊겼다. 소방 호스는 비었고 소화기도 떨어져 간다.',
   ch:[{t:'사격을 받으며 강에서 물을 나른다',d:'시민 −120 · 화재 −4',run:A=>{S.ppl=Math.max(0,S.ppl-120);A.fire=Math.max(0,A.fire-4);}},
       {t:'바리케이드의 모래로 덮어 끈다',d:'화재 −5 · 양쪽 출입구 −5',run:A=>{A.fire=Math.max(0,A.fire-5);A.ctl.entr=Math.max(1,A.ctl.entr-5);A.ctl.front=Math.max(1,A.ctl.front-5);}},
       {t:'그냥 타게 둔다',d:'화재 +2',run:A=>{A.fire=Math.min(15,A.fire+2);}}]},
  {id:'defect', cond:A=>A.units.some(u=>u.id==='taman'&&u.cur>0), h:'탈영자', p:'차량화보병 소대가 기단 옆에 엎드린 채 사격하지 않는다. 중위가 그들은 이 일에 가담하고 싶지 않다고 외친다.',
   ch:[{t:'떠나라고 외친다',d:'차량화보병 약화',run:A=>{const u=A.units.find(x=>x.id==='taman');u.cur*=.85;}},
       {t:'무기를 든 채 안으로 끌어들인다',d:'민병 +30 · 무기 +60',rq:'총참모부 40',req:()=>S.pts.gs>=40,run:A=>{S.mil+=30;S.gun+=60;const u=A.units.find(x=>x.id==='taman');u.cur*=.8;}},
       {t:'텔레비전에 그들을 내보낸다',d:'방송 +15',rq:'방송 20',req:()=>S.A.air>=20,run:A=>{A.air=Math.min(100,A.air+15);}}]},
  {id:'cellar', cond:A=>A.r>=2, h:'지하', p:'대피소에는 수백 명의 여성, 매점 직원, 타이피스트, 직원들의 아이들이 있다. 그들은 다시는 위로 올라오지 못할 것이다.',
   ch:[{t:'20번 출입구로 빼낸다',d:'시민 −200 · 방송 +10 · 출입구 −6',run:A=>{S.ppl=Math.max(0,S.ppl-200);A.air=Math.min(100,A.air+10);A.ctl.entr=Math.max(1,A.ctl.entr-6);}},
       {t:'어두워질 때까지 지하에 둔다',d:'결의 −3',run:A=>{S.hope=clamp(S.hope-3,0,100);}}]},
  {id:'btr', cond:A=>A.r>=3, h:'전리품', p:'정문 옆에 버려진 장갑차가 탄약을 가득 싣고 서 있다. 승무원은 도망쳤다.',
   ch:[{t:'그들 손에 들어가지 않게 태운다',d:'정문 +4',run:A=>{A.ctl.front=Math.min(100,A.ctl.front+4);}},
       {t:'우리 쪽 인원을 태우고 기관총을 돌린다',d:'정문 +15 · 무기 +80 · 방송 −10',rq:'민병 250',req:()=>S.mil>=250,run:A=>{A.ctl.front=Math.min(100,A.ctl.front+15);S.gun+=80;A.air=Math.max(0,A.air-10);}}]},
  {id:'planes', cond:A=>A.r>=1, h:'무전기 앞의 루츠코이', p:'부통령이 공개 채널에 외친다: “동지들, 항공기를 띄워라!” 조종사들도, 기자들도, 크렘린도 그 소리를 듣는다.',
   ch:[{t:'부르게 둔다',d:'결의 +4 · 방송 −15',run:A=>{S.hope=clamp(S.hope+4,0,100);A.air=Math.max(0,A.air-15);}},
       {t:'무전기를 빼앗아: 세계에 중재를 요청한다',d:'방송 +10',rq:'결의 40%',req:()=>S.hope>=40,run:A=>{A.air=Math.min(100,A.air+10);}}]},
  {id:'truce', cond:A=>A.r>=6, h:'한 시간의 침묵', p:'크렘린은 부상자를 수습하기 위해 한 시간 휴전을 제안한다. 양측 모두 그 한 시간 동안 예비대가 도착하리라는 것을 안다.',
   ch:[{t:'동의한다',d:'부상자 이송 완료 · 양쪽 출입구 +6 · 크렘린 부대 강화',run:A=>{A.wnd=0;A.ctl.entr=Math.min(100,A.ctl.entr+6);A.ctl.front=Math.min(100,A.ctl.front+6);for(const u of A.units)if(u.cur>3)u.cur*=1.12;}},
       {t:'거부하기',d:'결의 +2',run:A=>{S.hope=clamp(S.hope+2,0,100);}},
       {t:'동의하고, 기자들을 부상자에게 데려간다',d:'동일 · 방송 +20',rq:'방송 25',req:()=>S.A.air>=25,run:A=>{A.wnd=0;A.air=Math.min(100,A.air+20);A.ctl.entr=Math.min(100,A.ctl.entr+6);A.ctl.front=Math.min(100,A.ctl.front+6);for(const u of A.units)if(u.cur>3)u.cur*=1.12;}}]},
  {id:'rne', cond:A=>S.fac.rne.n>0, h:'바르카쇼프 부대가 떠난다', p:'RNE가 지하 하수도로 가는 길을 찾았고, 너무 늦기 전에 떠나려 한다. 총의 3분의 1이 그들과 함께 나간다.',
   ch:[{t:'떠나게 둔다',d:'RNE가 건물을 떠난다',run:A=>{S.fac.rne.n=0;}},
       {t:'대열 앞에서 망신을 준다',d:'남는다 · 결의 +2',rq:'결의 60%',req:()=>S.hope>=60,run:A=>{S.hope=clamp(S.hope+2,0,100);}},
       {t:'무기로 매수한다',d:'무기 −100 · 남는다',rq:'무기 100',req:()=>S.gun>=100,run:A=>{S.gun-=100;if(S.mil>S.gun)S.mil=S.gun;}}]},
];
function incidentCard(){const A=S.A; if(!A||screen!=='assault')return;
  let I=A.card==='inc'&&INCIDENTS.find(x=>x.id===A.incId);
  if(!I){const pool=INCIDENTS.filter(x=>!A.inc[x.id]&&x.cond(A)); if(!pool.length)return; const pr=pool.filter(x=>x.prio); I=pr.length?pr[0]:pool[Math.floor(Math.random()*pool.length)];}
  if(A.card!=='inc')Sfx.play(/^u_|^y_/.test(I.id)?'static':'alarm',1.2);
  A.card='inc'; A.incId=I.id; save();
  const tk=I.pic==='tank'&&uOn(A,'tanks'), who=/^y_/.test(I.id)?'yeltsin':I.who, yel=!!who||tk, body=`<h2>${I.h}</h2><div class="sub">${typeof I.p==='function'?I.p():I.p}</div>`+I.ch.map((c,i)=>{const lk=c.req&&!c.req();
    return `<div class="law${lk?' lock':''}" data-i="${i}"><div class="t">${i+1}. ${c.t}</div><div class="e">${typeof c.d==='function'?c.d():c.d}${c.rq?` · <span class="${lk?'n':'p'}">${lk?'필요':'열림'}: ${c.rq}</span>`:''}</div></div>`;}).join('');
  $('modal-win').innerHTML=tk?`<div class="incy"><div class="ph"><img src="${tankShotURL()}"><b>노비 아르바트 다리</b><small>전차들이 건물에 포격한다</small></div><div>${body}</div></div>`:yel?`<div class="incy"><div class="ph"><img src="${who==='yeltsin'?ASSET_YELTSIN:PEOPLE[who].img}"><b>${who==='yeltsin'?'보리스 옐친':PEOPLE[who].nm.toUpperCase()}</b><small>${who==='yeltsin'?'직통 회선으로':PEOPLE[who].role+', 직통 회선으로'}</small></div><div>${body}</div></div>`:body;
  $('modal').classList.add('on');
  $('modal-win').querySelectorAll('.law').forEach(e=>e.onclick=()=>incChoose(+e.dataset.i));
}
function incChoose(i){const A=S.A, I=INCIDENTS.find(x=>x.id===A.incId), c=I&&I.ch[i]; if(!c||(c.req&&!c.req()))return;
  A.card=0; if(!I.multi)A.inc[I.id]=1; $('modal').classList.remove('on'); c.run(A); alog(I.h.charAt(0)+I.h.slice(1).toLowerCase()+': '+c.t.toLowerCase()+'.');
  if(S.hope<=0)return finale('broken'); save(); renderAssault();}
const A_ORDERS=[
  {t:'반격',                 d:'출입구 +20 · 전투원 −50 · 적 사기 −7', req:()=>S.mil>=50||'전투원 50명 필요',
   run:()=>{const s=S.A.ctl.entr<=S.A.ctl.front?'entr':'front';S.A.ctl[s]=Math.min(100,S.A.ctl[s]+20);S.mil-=50;for(const u of S.A.units)if(UNITS.find(x=>x.id===u.id).target===s&&u.cur>3){uMor(u,-7);u.lost=(u.lost||0)+15;}alog('출입구 반격 «'+SECTORS.find(x=>x.id===s).nm+'».');}},
  {t:'취약한 출입구를 막는다',      d:'시민 −100 · 출입구 +10', req:()=>S.ppl>=100||'100명 필요',
   run:()=>{const s=S.A.ctl.entr<=S.A.ctl.front?'entr':'front';S.ppl-=100;S.A.ctl[s]=Math.min(100,S.A.ctl[s]+10);alog('사람들이 가구와 금고를 출입구 «'+SECTORS.find(x=>x.id===s).nm+'».');}},
  {t:'총참모부에 전화',           d:()=>'차량화보병 문제로 콜레스니코프와 대화', once:1, req:()=>S.flags.noComms?'통신 없음':deputies(S)<5?'의원 없음':uEff(S.A.units.find(u=>u.id==='taman'))>0||'차량화보병은 싸우지 않는다',
   run:()=>{const A=S.A; A.card='inc'; A.incId='gs_call'; incidentCard();}},
  {t:'의원들을 회의장으로',          d:'결의 +8', once:1, req:()=>true, run:()=>{S.hope=clamp(S.hope+8,0,100);alog('인민대표대회는 포화 속에서도 회의를 연다. 사람들은 버틴다.');}},
  {t:'불을 끈다',               d:'시민 −100 · 화재 −6', req:()=>(S.A.fire>=1&&S.ppl>=100)||(S.A.fire<1?'불에 탄 것 없음':'100명 필요'),
   run:()=>{S.ppl-=100;S.A.fire=Math.max(0,S.A.fire-6);alog('자원자들이 층의 불을 끄고 있다.');}},
  {t:'사람들을 무장시킨다',            d:()=>{const k=Math.min(100,S.ppl,freeGuns(S));return '시민 −'+k+' · 민병 +'+k;}, req:()=>(S.ppl>=20&&freeGuns(S)>=20)||(freeGuns(S)<20?'남은 총이 없다':'사람 없음'),
   run:()=>{const k=Math.min(100,S.ppl,freeGuns(S));S.ppl-=k;S.mil+=k;alog('추가 '+k+' 명이 무기를 받고 창가에 자리 잡았다.');}},
  {t:'전투원들에게 음식과 물을',          d:'보급 −2 · 결의 +5', req:()=>S.A.stock>=2||'보급 2 필요',
   run:()=>{S.A.stock-=2;S.hope=clamp(S.hope+5,0,100);alog('빵, 차, 물을 층마다 나눠준다.');}},
  {t:'부상자를 위한 붕대',  d:'보급 −2 · 부상자 −60%', req:()=>S.A.wnd<20?'부상자가 많지 않다':S.A.stock>=2||'보급 2 필요',
   run:()=>{S.A.stock-=2;S.A.wnd=Math.round(S.A.wnd*.4);alog('20번 출입구에서 마지막 붕대 상자를 열었다.');}},
  {t:'바리케이드에 경유를',       d:'보급 −3 · 취약 출입구 +12 · 화재 +1', req:()=>S.A.stock>=3||'보급 3 필요',
   run:()=>{const s=S.A.ctl.entr<=S.A.ctl.front?'entr':'front';S.A.stock-=3;S.A.ctl[s]=Math.min(100,S.A.ctl[s]+12);S.A.fire+=1;alog('출입구 «의 바리케이드'+SECTORS.find(x=>x.id===s).nm+'»에 경유를 붓고 불을 질렀다.');}},
  {t:'백기',                 d:'항복', flag:1, req:()=>true, run:()=>ending('surrender')},
];
// ---------- the air during the assault: what you ask the world for. One request an hour, paid in Эфир ----------
const AIR=[
  {t:'모스크바 시민들을 건물로 부른다', cost:10, d:()=>`한 시간 뒤 ${fmt(300+S.city*10)}명이 올 것이다`, run:A=>{A.incoming+=300+S.city*10;alog('방송: 모스크바 시민들이 백악관으로 불린다.');}},
  {t:'부상자 이송을 위해 휴전을 요청한다', cost:8, d:()=>`${Math.round(Math.min(.9,.3+S.A.air/100)*100)}% 확률: 부상자 이송, 결의 +3`, req:()=>S.A.wnd>=20||'부상자가 많지 않다',
   run:A=>{if(Math.random()<Math.min(.9,.3+A.air/100)){A.wnd=0;S.hope=clamp(S.hope+3,0,100);alog('사격이 20분간 잦아들었다. 구급차들이 부상자들을 실어 갔다.');}else alog('휴전은 거부되었다.','bad');}},
  {t:'병사들에게 호소: 쏘지 마라', cost:12, d:()=>`${Math.round(Math.min(.45,.1+S.A.air/200)*100)}% 확률로 흔들리는 부대 하나가 멈춘다. 그렇지 않으면 공세 −6%`,
   run:A=>{const g=A.units.filter(u=>uState(u)==='waver').sort((a,b)=>a.cur-b.cur)[0];
     if(g&&Math.random()<Math.min(.45,.1+A.air/200)){g.cur=0;g.st='stopped';alog(UNITS.find(x=>x.id===g.id).nm+': 호소를 듣고 사격을 중지했다.');}else{for(const u of A.units){u.cur*=.94;uMor(u,-5);}alog('병사들은 듣지만 명령은 명령이다. 사격이 드물어졌다.');}}},
  {t:'전 세계에 화재와 부상자를 보여준다', cost:0, d:()=>'방송 +15', run:A=>{A.air=Math.min(100,A.air+15);alog('불타는 의회 장면이 세계 모든 채널로 나간다.');}},
  {t:'명령을 내린 지휘관들의 이름을 공개한다', cost:10, d:()=>'전차 −25%, 전차병 사기 −15, 급진성 +3', req:()=>S.A.units.find(u=>u.id==='tanks').cur>0||'전차가 침묵한다',
   run:A=>{A.units.find(u=>u.id==='tanks').cur*=.75;uMor(A.units.find(u=>u.id==='tanks'),-15);S.rad=clamp(S.rad+3,0,100);alog('방송에서 이름과 부대 번호가 낭독된다. 두 승무원이 시동을 껐다.');}},
  {t:'법원과 지방에 중재를 요청한다', cost:15, d:()=>'공세 −10%, 결의 +4', req:()=>S.leg>=50||'정통성 50 필요',
   run:A=>{for(const u of A.units)u.cur*=.9;S.hope=clamp(S.hope+4,0,100);alog('조르킨과 지방 수장들이 휴전을 요구한다.');}},
  {t:'병사들에게 그들 자신의 손실을 보여준다', cost:8, d:()=>'모든 부대 사기 −5, 손실을 입은 부대는 −10', run:A=>{for(const u of A.units)if(u.cur>3)uMor(u,(u.lost||0)>=40?-10:-5);alog('확성기로 전사한 병사들의 이름이 낭독된다. 대열이 조용해진다.');}},
  {t:'의사와 구급차를 요청한다', cost:5, d:()=>'부상자 절반으로', req:()=>S.A.wnd>=20||'부상자가 많지 않다', run:A=>{A.wnd=Math.round(A.wnd/2);alog('자원 의사들이 봉쇄선을 통과했다.');}},
];
const airGain=()=>1+Math.floor(OUTLETS.filter(o=>outSt(S,o)==='vs').length/4)+(S.pts.ost>=100?2:0);
const airCost=o=>o.cost*(S.flags.noComms?2:1);
function airState(i){const o=AIR[i],A=S.A; if(A.airUsed)return '이 시각에 이미 나왔다'; if(S.A.air<airCost(o))return '필요: '+airCost(o)+' 방송'; const r=o.req?o.req():true; return r;}
function openAir(){const A=S.A; if(!A||screen!=='assault'||A.card)return;
  $('modal-win').innerHTML=`<h2>백악관의 방송</h2><div class="sub">방송: <b style="color:var(--paper)">${Math.round(A.air)}</b> / 100, 매 시간 여러분의 매체에서 +${airGain()}. 방송이 높으면 세상이 지켜본다: 공세는 약해지고, 부대의 사기는 떨어지며, 60 이상에서는 흔들리던 부대가 멈출 수 있다. 호소는 방송을 소모한다. 시간당 요청 한 번, 명령은 소모하지 않는다.${S.flags.noComms?' <span class="n">통신이 끊겼다. 외국인을 통해서만 방송할 수 있다: 모든 것이 두 배 비싸다.</span>':''} 방송이 높을수록 공세는 약해지고, 여러분의 말은 더 잘 들린다.</div><div class="app2">`+
    AIR.map((o,i)=>{const st=airState(i);return `<div class="law${st!==true?' lock':''}" data-i="${i}"><div class="t">${o.t} <span class="cst">${airCost(o)?"방송 −"+airCost(o):"무료"}</span></div><div class="e">${st===true?o.d():`<span class="n">${st}</span>`}</div></div>`;}).join('')+
    `</div><div class="close">ESC — 닫기</div>`;
  $('modal').classList.add('on');
  $('modal-win').querySelectorAll('.law').forEach(e=>e.onclick=()=>{const i=+e.dataset.i; if(airState(i)!==true)return; Sfx.play('static');Sfx.play('pips',.7); S.A.air-=airCost(AIR[i]); A.airUsed=1; AIR[i].run(A); $('modal').classList.remove('on'); save(); renderAssault();});
  $('modal-win').querySelector('.close').onclick=closeModal;
}
function aOrderState(i){const o=A_ORDERS[i],A=S.A; if(o.once&&A.once[i])return '이미 완료'; if(A.used[i])return '이미 있었다';
  const r=o.req(); if(r!==true)return r; if(!A.orders&&!A_ORDERS[i].flag)return '남은 명령 없음'; return true;}
function doAOrder(i){if(aOrderState(i)!==true)return; Sfx.play(['burst','thud','phone','crowd','fire','bolt','paper','lose'][i]||'click');const A=S.A; A.used[i]=1; if(A_ORDERS[i].once)A.once[i]=1; if(!A_ORDERS[i].flag)A.orders--;
  A_ORDERS[i].run(); if(screen==='assault'){save();renderAssault();}}
function moveShare(s,d){const A=S.A, sh=A.shares; if(d>0){const o=Object.keys(sh).filter(k=>k!==s&&sh[k]>=10).sort((a,b)=>sh[b]-sh[a])[0];if(!o)return;sh[o]-=10;sh[s]+=10;}
  else{if(sh[s]<10)return;const o=Object.keys(sh).filter(k=>k!==s).sort((a,b)=>sh[a]-sh[b])[0];sh[s]-=10;sh[o]+=10;}
  save();renderAssault();}

function renderAssault(){
  const A=S.A; const F=defForce();
  $('a-time').textContent=dateStr(S.day).toUpperCase()+' '+HOURS[Math.min(A.r,HOURS.length-1)];
  $('a-round').textContent='시간 '+(A.r+1)+' / '+HOURS.length+' · 어두워질 때까지';
  const fireL=A.fire>0?Math.round(A.fire/5):0, wndL=A.wnd>=40?Math.min(6,Math.round(A.wnd/80)):0;
  const R=[['ppl','시민',fmt(S.ppl),''],['mil','민병대',fmt(S.mil),A.ammo<=0?'<span class="n">탄약 없음</span>':''],
    ['hope','결의',S.hope+'%',[A.fire>0?'화재'+(fireL?' −'+fireL:'')+'':'',A.wnd>=20?'부상자 '+fmt(A.wnd)+(wndL?' −'+wndL:''):''].filter(Boolean).map(x=>'<span class="n">'+x+'</span>').join(' · ')],
    ['stk','보급',fmt(A.stock||0),''],['air','방송',Math.round(A.air),'<span class="p">+'+airGain()+' 시간당</span>']];
  $('a-res').innerHTML=R.map(([k,nm,v,sub])=>`<div class="r"><div class="k">${nm}</div><div class="v${(k==='hope'&&S.hope<30)?' warn':''}">${v}${sub?` <small style="font-size:13px;font-family:'Tiny5'">${sub}</small>`:''}</div></div>`).join('');
  // section
  const att={entr:0,front:0};for(const u of A.units){const t=UNITS.find(x=>x.id===u.id).target;if(t!=='tower')att[t]+=uEff(u)/3;}
  const unitsN=x=>Math.round(A.shares[x]/100*F/40);
  drawSection($('a-c'),{fac:S.fac,def:{entr:unitsN('entr'),front:unitsN('front'),tower:unitsN('tower')},att,fire:A.fire});
  $('a-status').innerHTML=A.log.slice(0,4).map(l=>`<div class="${l.cls}"><span class="tm">${l.h}</span> ${l.t}</div>`).join('');
  // units
  $('a-units').innerHTML=`<h2>크렘린 병력 <span>손실 ${fmt(kDead(A))} · 여러분 ${fmt(A.lost||0)} · 눈금: 전투 중 전력</span></h2>`+A.units.map(u=>{const U=UNITS.find(x=>x.id===u.id);
    const st=uState(u), m=Math.round(uMorV(u)), dm=u.mor0==null?0:Math.round(m-u.mor0);
    const on=Math.ceil(uEff(u)/50*8);
    const sub=u.cur<=3&&st!=='wait'?`손실 ${fmt(u.lost||0)}${u.why?' · '+u.why:''}`:`손실 ${fmt(u.lost||0)} · 사기 ${m}%`+(dm?` <span class="${dm<0?'p':'n'}">${dm<0?'▼':'▲'}${Math.abs(dm)}${u.why?' '+u.why:''}</span>`:'');
    return `<div class="urow ${st}"><span class="nm">${U.nm}<small>${sub}</small></span><span class="stt">${STANCE_NM[st]}</span><div class="b r" title="지금 전투 전력">${Array.from({length:8},(_,i)=>`<i class="${i<on?'on':''}"></i>`).join('')}</div></div>`;}).join('')+'<div class="uhint">사기 50 이상: 전진 · 25–49: 절반의 전력 · 25 미만: 영원히 전투에서 이탈</div>';
  // sectors
  $('a-sect').innerHTML=`<h2>방어 <span>전력 ${fmt(F)} · 탄약 ${S.mil>0?Math.floor(A.ammo/Math.max(1,Math.round(S.mil/8))):'—'}시간분</span></h2>`+SECTORS.map(s=>{const sh=A.shares[s.id];const c=A.ctl[s.id];
    const pr=s.id==='tower'?`<small class="${sh<10?'n':'p'}">${sh<10?'비었음: 위층에 적 사수들, 시간당 결의 −2':'저격수: 양쪽 출입구 압박 −'+Math.round(towerCut(A)*100)+'%'}</small>`:(()=>{const {D,A:a}=assaultSector(s.id);const L=A.last&&A.last[s.id];return `<small class="${a>D?'n':'p'}">방어 ${Math.round(D)} 대 공세 ${Math.round(a)}: ${a>D?'밀어붙임':'버팀'}${L?` · 시간당: 우리 −${fmt(L.lost)}, 상대 −${fmt(L.kl)}`:''}</small>`;})();
    return `<div class="srow"><span class="nm">${s.nm}${pr||`<small>${s.sub}</small>`}</span>
      ${c===undefined?'<span></span>':`<div class="ctl"><i style="width:${c}%"></i></div>`}
      <span class="sh"><b data-s="${s.id}" data-d="-1">−</b>${sh}%<b data-s="${s.id}" data-d="1">+</b></span></div>`;}).join('');
  $('a-sect').querySelectorAll('b[data-s]').forEach(b=>b.onclick=()=>moveShare(b.dataset.s,+b.dataset.d));
  // orders
  $('a-orders').innerHTML=`<h2>명령 <span>남음: ${A.orders} · <u id="a-air" style="cursor:pointer;color:#e8a23a">호소 [M]${A.airUsed?' ✓':''}</u></span></h2><div class="agrid">`+A_ORDERS.map((o,i)=>{const st=aOrderState(i);
    return `<div class="aact${st!==true?' off':''}" data-i="${i}"><span class="k">${i+1}</span><span class="t">${o.t}</span><span class="cost">${st===true?(typeof o.d==='function'?o.d():o.d):`<span class="risk">${st}</span>`}</span></div>`;}).join('')+'</div>';
  $('a-orders').querySelectorAll('.aact').forEach(e=>e.onclick=()=>doAOrder(+e.dataset.i)); $('a-air').onclick=openAir;
}

// candle flicker on the section screens
setInterval(()=>{secTick++; if(screen==='wh'&&S)drawSection($('w-c'),{fac:S.fac,cordon:S.cordon,calm:S.phase===1,lit:!S.flags.noPower,st:{hope:S.hope,rad:S.rad,ppl:S.ppl,dep:deputies(S),radio:S.flags.radio}});
  else if(screen==='assault'&&S&&S.A){const A=S.A,F=defForce();const att={entr:0,front:0};for(const u of A.units){const t=UNITS.find(x=>x.id===u.id).target;if(t!=='tower')att[t]+=uEff(u)/3;}
    const n=x=>Math.round(A.shares[x]/100*F/40); drawSection($('a-c'),{fac:S.fac,def:{entr:n('entr'),front:n('front'),tower:n('tower')},att,fire:A.fire});}},160);
