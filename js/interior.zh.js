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
  $('w-status').innerHTML=S.phase===1?`供电、供水、通讯：有<br>大楼内议员：${tot}${S.away?' · 外出： '+S.away:''}`
    :`供电：${S.flags.noPower?'<b>无</b>（每晚决心 −2）':S.flags.gen?'<i>发电机</i>':'有'} · 通讯：${S.flags.noComms?'<b>无</b>':S.flags.radio?'<i>无线电</i>':'有'}<br>大楼内议员：${tot}${S.away?' · 外出： '+S.away:''}`;
  {const y=whYield(S); $('w-status').innerHTML+=`<br>最高苏维埃运转 ${Math.round(y.q*100)}% · 每晚：合法性 +${y.leg}，舆论 +${y.med}，决心 +${y.hope}`;}
  $('w-sec').querySelectorAll('.room,.fl2').forEach(e=>e.remove());
  // meters
  seg('w-hope',S.hope);seg('w-rad',S.rad);$('w-mh').textContent=S.hope+'%';$('w-mr').textContent=S.rad+'%';
  const bar=(cls,v)=>`<div class="b ${cls}">${Array.from({length:10},(_,i)=>`<i class="${i<v?'on':''}"></i>`).join('')}</div>`;
  {
    // ---- factions mode ----
    $('w-h2').innerHTML=`大楼内的派系 <span>议员：${tot} · 法定人数 ${QUORUM}</span>`;
    $('w-hdr').innerHTML=`<span></span><span>派系</span><span style="text-align:right">在楼内</span><span>忠诚度</span><span></span>`;
    {const F=FACTIONS.find(x=>x.id===S.selFac),h=document.querySelector('#s-wh .hint'); if(h)h.innerHTML=F&&FAC_PRESS[F.id]&&S.fac[F.id].n>0?F.nm.replace(/"/g,'')+' 读者： '+FAC_PRESS[F.id].map(id=>{const o=OUTLETS.find(x=>x.id===id),st=outSt(S,o);return `<span style="color:${st==='vs'?'var(--ok)':st==='kr'?'#7fa0cf':'var(--dim)'}">${o.nm.replace(/[«»]/g,'')} ${st==='vs'?'↑':st==='kr'?'↓':'·'}</span>`;}).join(', ')+'。自家媒体把忠诚度拉高，克里姆林宫的媒体把它拉低。':'议员越忠诚、人数越多，最高苏维埃运转得越好';}
    $('w-rows').innerHTML=FACTIONS.map(F=>{const f=S.fac[F.id];
      const sub0=(f.n<=0?'不在大楼内':F.kind==='arm'?'在代表大会之外':'')+(f.tr&&f.n>0?(f.tr.d>0?' <span style="color:var(--ok)">↑</span>':' <span style="color:#e0866a">↓</span>'):'')+(b=>!b?'':b.on>0?' · <span style="color:var(--ok)">加成生效</span>':b.on<0?' · <span style="color:#e0866a">有害</span>':' · 加成关闭')(facBonus(S,F));
      const sub=sub0.replace(/^ · /,'');
      return `<div class="row${f.loy<=3&&f.n>0?' warn':''}${F.kind==='arm'&&f.n>0?' hot':''}${S.selFac===F.id?' selr':''}${f.n<=0?' gone':''}" data-f="${F.id}"><span class="sw" style="background:${F.c}"></span><span class="nm">${F.nm}<small>${sub}</small></span><span class="ct">${Math.max(0,f.n)}</span>${(L=>`<div class="b l5">${Array.from({length:5},(_,i)=>`<i style="${i<=L?'background:'+LOY[L].c:''}"></i>`).join('')}</div><span class="lv" style="color:${LOY[L].c}">${LOY[L].nm}</span>`)(loyLvl(f.loy))}</div>`;}).join('');
    $('w-rows').querySelectorAll('.row').forEach(e=>e.onclick=()=>{S.selFac=e.dataset.f;renderWH();firstLook('f',e.dataset.f);});
    const F=FACTIONS.find(x=>x.id===S.selFac)||FACTIONS[0]; S.selFac=F.id; const f=S.fac[F.id]; 
    const acts=facActs(F.id).map((a,i)=>{const st=facActState(F.id,i);
      return `<div class="act${st!==true?' off':''}" data-i="${i}"><span class="k">${i+1}</span><span class="t">${a.t}</span><span class="cost">${st===true?fxText(a.fx(F),F.id):`<span class="risk">${st}</span>`}</span></div>`;}).join('');
    const W=PEOPLE[FAC_WHO[F.id]];
    $('w-det').innerHTML=`<div class="who">${faceHTML(FAC_WHO[F.id],'big')}<div><h3><span class="sw" style="background:${F.c}"></span>${F.nm}</h3><div class="own"><b class="wn">${W.nm}</b>, ${W.role}</div></div></div>
      ${f.n<=0?'<div class="own">派系不在大楼内。</div>':''}
      ${f.n>0&&F.id!=='rne'?`<div class="own">当前 <b style="color:${LOY[loyLvl(f.loy)].c}">${LOY[loyLvl(f.loy)].nm}</b>：${LOY[loyLvl(f.loy)].d}。${f.tr?` 每晚 <b style="color:${f.tr.d>0?'var(--ok)':'#e0866a'}">${f.tr.d>0?'↑':'↓'}</b>：${f.tr.why}。`:''}</div>`:''}
      ${(b=>b&&F.id!=='rne'?`<div class="own">当前产出，${b.t}：<b style="color:${b.on>0?'var(--ok)':b.on<0?'#e0866a':'var(--dim)'}">每晚 ${fxText(b.fx).replace(/<[^>]+>/g,'')}</b> ${b.on>0?'':b.on<0?'（“不可靠”及以下：有害）':'（关闭：需要“忠诚”）'}</div>`:'')(facBonus(S,F))}
      ${F.id==='rne'&&f.n>0?(b=>`<div class="own" style="flex:none"><span class="p">兵力：</span>${f.n}名战士，防守如${f.n*3}。<span class="n">代价：</span>污名 ${b}/3，夜间莫斯科 −${Math.min(3,b+1)}${b>=1?'，合法性 −'+(b>=2?2:1):''}，温和派离开。</div>`)(S.flags.brand||0):''}
      <div class="acts">${acts}</div>`;
    $('w-det').querySelectorAll('.act').forEach(e=>e.onclick=()=>doFacAct(F.id,+e.dataset.i)); drawFaces($('w-det'));
  }
  $('w-orders').textContent='命令： '+S.orders;
}
const FACTION_ACTS=[
  {t:'与领袖会谈',  fx:F=>({fac:{[F.id]:{loy:2}}})},
  {t:'号召秩序',     fx:F=>({rad:-3,fac:{[F.id]:{loy:-1}}})},
];
const RNE_OUT={t:'赶出大楼', fx:F=>({city:4,leg:3,hope:-4,rad:-5}), run:()=>{S.fac.rne.n=0;S.flags.rneOut=1;S.flags.brand=Math.max(0,(S.flags.brand||0)-1);}};
const facActs=fid=>fid==='rne'?[FACTION_ACTS[0],RNE_OUT]:FACTION_ACTS;
function facActState(fid,i){const f=S.fac[fid]; if(f.n<=0)return '不在大楼内'; if(S.used['f'+fid+i])return '今天已经做过'; if(!S.orders)return '直到早晨都没有命令'; return true;}
function doFacAct(fid,i){if(facActState(fid,i)!==true)return; const a=facActs(fid)[i]; apply(a.fx(FACTIONS.find(F=>F.id===fid))); if(a.run)a.run();
  S.orders--;S.used['f'+fid+i]=1; log(FACTIONS.find(F=>F.id===fid).nm+': '+a.t.toLowerCase()+'.'); save(); renderWH();}

// =====================================================================================================
// ===== the assault: a separate level, two hours per turn from 07:00 to 17:00 =====
function unitStance(u){if(u.src==='alpha')return S.A&&S.A.alpha||'wait'; if(u.id==='omon'){const o=S.omon==null?100:S.omon;return o<=60?'waver':'attack';}const v=S.pts[u.src]; if(u.src==='mvd')return v>=50?'refuse':v>=30?'waver':'attack'; return v>=65?'refuse':v>=45?'waver':'attack';}
const STANCE_NM={attack:'推进中',waver:'动摇',halt:'停止',refuse:'拒绝',wait:'在预备队',stopped:'已撤出'};
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
  alog(refused.length?'拒绝执行命令： '+refused.join(', ')+'.':'克里姆林宫的所有部队都在执行命令。');
  A.lost=0; A.muster=musterRoll(A);
  // подготовка превращается в силу штурма: Легитимность, Москва, готовность ОМОНа и лояльность ведомств сбивают стартовый дух частей
  { const L=A.muster, dn=(u,d)=>{ if(u.cur>3&&u.id!=='alpha')u.mor=clamp(uMorV(u)-d,28,100); };
    const dl=S.leg>50?Math.round((S.leg-50)*.5):0; if(dl){for(const u of A.units)dn(u,dl); L.push({g:1,t:'合法性 '+S.leg+'：克里姆林宫的部队不情不愿地前进，所有人士气 −'+dl});}
    const om=A.units.find(u=>u.id==='omon'), rd=S.omon==null?100:S.omon, do1=Math.round((100-rd)*.5)+(S.city>60?Math.round((S.city-60)*.3):0); if(do1&&om.cur>3){dn(om,do1); L.push({g:1,t:'特警不急于参战（备战度 '+rd+'%，莫斯科 '+S.city+'%）：其士气 −'+do1});}
    for(const u of A.units){const U=UNITS.find(x=>x.id===u.id); if(U.src==='alpha'||u.cur<=3)continue; const v=S.pts[U.src], d=v>30?Math.round((v-30)*.3):0; if(d)dn(u,d);}
    if(S.flags.corner){A.noRes=1; for(const u of A.units)dn(u,10); L.push({g:1,t:'克里姆林宫陷入困境：命令仓促下达，不会有预备队，所有人士气 −10'});} }
  save(); show('assault'); renderAssault(); musterCard();
}
// ---------- the last night: everyone you dealt with shows up, or does not. Like a final battle, every earlier choice counts ----------
function musterRoll(A){const L=[], add=(g,t)=>L.push({g,t}), lv=id=>S.fac[id].n>0?loyLvl(S.fac[id].loy):-1, hp=d=>{S.hope=clamp(S.hope+d,0,100);};
  const mul=(id,k)=>{const u=A.units.find(x=>x.id===id); if(u)u.cur*=k;};
  // фракции внутри
  let l=lv('kr'); if(l>=3){S.ppl+=400;add(1,'共产党人带来了工厂民兵队：民众 +400');} else if(l>=0&&l<=1){const n=S.fac.kr.n;S.fac.kr.n=0;hp(-3);add(0,'共产党人夜间离开，全部 '+n+'：决心 −3');}
  l=lv('ros'); if(l>=3){hp(6);add(1,'“俄罗斯”守住会议厅：决心 +6');} else if(l>=0&&l<=1){S.fac.ros.n=0;hp(-2);add(0,'“俄罗斯”在黎明前离开大楼：决心 −2');}
  l=lv('agr'); if(l>=3){A.stock+=4;A.medK=.8;add(1,'农业派设立了厨房和战地医院：补给 +4，伤亡减少20%');} else if(l>=0&&l<=1){S.fac.agr.n=0;add(0,'农业派回到了各自的州');}
  l=lv('otc'); if(l>=3){A.gsB=.2;mul('taman',.9);add(1,'“祖国”掌握各部队的频率和指挥官姓名：给总参谋部的电话更可靠，摩托化步兵 −10%');}
    else if(l>=0&&l<=1){A.leak=1;S.fac.otc.n=0;add(0,'“祖国”的议员离开，并向总参谋部说明了谁负责什么：强攻 +12%，塔楼的掩护效果减半');}
  l=lv('sm'); if(l>=3){A.air=Math.min(100,A.air+15);add(1,'“更替”带外国记者参观各层：舆论 +15');} else if(l>=0&&l<=1){A.air=Math.max(0,A.air-15);hp(-4);S.fac.sm.n=0;add(0,'“更替”举着白旗走向镜头：舆论 −15，决心 −4');}
  l=lv('kol'); if(l>=3){hp(3);add(1,'“动摇派”留了下来。大厅的法定人数：决心 +3');} else if(l>=0&&l<=1){A.ctl.entr-=10;A.ctl.front-=10;S.fac.kol.n=0;add(0,'“动摇派”穿过封锁线离开，并指明了哨位所在：两个入口 −10');}
  l=lv('rne'); if(l>=3){A.ctl.entr=Math.min(100,A.ctl.entr+10);add(1,'RNE守住第二十号入口：薄弱入口 +10');} else if(l>=0&&l<=1){const g=Math.min(100,freeGuns(S));S.gun-=g;A.ammo=Math.max(0,A.ammo-g);S.fac.rne.n=0;S.flags.rneLeft=1;add(0,'巴尔卡绍夫的人经下水道离开，并带走了枪械：武器 −'+g);}
  l=lv('so'); if(l>=3)add(1,'“军官联盟”接管防御指挥部：所有防区坚守得更好'); else if(l>=0&&l<=1){A.air=Math.max(0,A.air-10);S.rad=clamp(S.rad+5,0,100);add(0,'捷列霍夫的军官各自为战：舆论 −10，激进度 +5');}
  // силы снаружи
  for(const [id,nm] of [['mo','国防部'],['gs','总参谋部'],['mvd','内务部']]){const v=S.pts[id],hi=id==='mvd'?50:65,lo=id==='mvd'?30:45; add(v>=lo?1:0,nm+' ('+v+'% 支持你们，拒绝 '+hi+'): '+(v>=hi?'部队拒绝执行命令':v>=lo?'部队犹豫，以半数兵力推进':'部队正在执行命令'));}
  {const o=S.omon==null?100:S.omon; add(o<=60?1:0,'特警： '+(o<=60?'犹豫，以半数兵力推进':'正在执行命令')+' （备战度 '+o+'%)');}
  if(S.pts.mer>=60){A.medK=(A.medK||1)*.85;add(1,'市政府没有召回救护车：伤亡减少15%');} else if(S.pts.mer<25&&S.bar>0){S.bar--;add(0,'市政府提供了推土机：黎明前拆除了一排街垒');}
  if(S.pts.smo>=60){A.incoming+=500;add(1,'斯摩棱斯克方向有一支队伍过来：一小时后 +500人');}
  if(S.city>=60){A.incoming+=600;add(1,'莫斯科支持你们：一小时后墙边又有600人');} else if(S.city<=25){const d=Math.round(S.ppl*.15);S.ppl-=d;add(0,'莫斯科在电视上观看强攻： '+fmt(d)+' 人夜间离开了墙边');}
  // пресса
  for(const o of OUTLETS){const st=outSt(S,o), f=o.fin&&o.fin[st]; if(!f||!f.t)continue; const x=f.fx;
    if(x.air)A.air=clamp(A.air+x.air,0,100); if(x.hope)hp(x.hope); if(x.inc)A.incoming+=x.inc; if(x.ppl)S.ppl=Math.max(0,S.ppl+x.ppl); if(x.mil){S.mil+=x.mil;S.gun+=x.mil;}
    if(x.ctl){A.ctl.entr+=x.ctl;A.ctl.front+=x.ctl;} if(x.all)for(const u of A.units)u.cur*=x.all; if(x.u)for(const k in x.u)mul(k,x.u[k]);
    add(st==='vs'?1:0,f.t);}
  if((S.flags.brand||0)>=2){A.air=Math.max(0,A.air-12);add(0,'“议会里有法西斯分子”的污名：西方别过脸去。舆论 −12');}
  // что вы успели сделать
  if(S.flags.tunnel){A.tunnel=1;add(1,'下水道已探明：伤员从地下运出，每小时数量翻倍');}
  if(S.flags.noComms)add(0,'通讯中断：无人可以打电话，舆论成本翻倍');
  if(S.flags.noPower){hp(-3);add(0,'大楼断电：决心 −3');} else if(S.flags.gen)add(1,'发电机运转：有电和无线电');
  if(S.bar>=4)add(1,'街垒在 '+S.bar+' 排之中：入口坚守得更久');
  if(deputies(S)<QUORUM){hp(-4);add(0,'没有法定人数：大厅中 '+deputies(S)+' 名议员。决心 −4');}
  A.ctl.entr=clamp(A.ctl.entr,20,100);A.ctl.front=clamp(A.ctl.front,20,100);
  return L;}
function musterCard(){const A=S.A; A.card='muster'; save(); Sfx.play('engine');
  const col=g=>A.muster.filter(m=>m.g===g).map(m=>`<div class="ml ${g?'p':'n'}">${g?'+':'−'} ${m.t}</div>`).join('')||'<div class="ml">无人</div>';
  $('modal-win').innerHTML=`<h2>最后一夜：谁与你们同在</h2><div class="sub">你们两周来所做的一切，有的已经到达墙边，有的没有。派系、武装力量、媒体，以及你们的决定。</div>
   <div class="mus"><div><h3>支持你们</h3>${col(1)}</div><div><h3>反对你们</h3>${col(0)}</div></div><div class="close">ENTER — 迎战</div>`;
  $('modal').classList.add('on'); $('modal-win').querySelector('.close').onclick=musterClose;}
function musterClose(){const A=S.A; if(!A||A.card!=='muster')return; Sfx.play('boom'); A.card=0; $('modal').classList.remove('on'); save(); renderAssault(); if(A.allRef&&A.alpha==='wait'){alog('陆军、内卫部队和特警都没有进入大楼。克里姆林宫只剩下特种部队。');return alphaCard();} incidentCard();}
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
  if(A.incoming){S.ppl+=A.incoming;alog('莫斯科人冲到了白宫：+'+fmt(A.incoming)+'.');A.incoming=0;}
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
      uMor(u,-(dl*1.0)-(Ar<=D?2:-2)); u.why=Ar<=D?'被击退':'伤亡';
      if(u.dead>=U.str*.6&&u.cur>3){u.cur=0;u.st='stopped';u.why='流血殆尽';alog(U.nm+'：损失超过半数兵力，部分部队已撤离大楼。');aBanner(U.nm.toUpperCase()+'：退出战斗','损失超过半数兵力（'+fmt(u.lost)+'）。指挥部将部分部队撤离大楼。',true);}}
    A.last[s]={D:Math.round(D),A:Math.round(Ar),lost,kl};
    const nm=SECTORS.find(x=>x.id===s).nm;
    if(Ar>0)alog(`${nm}：${Ar>D?'压迫中':'守住'}。我方伤亡 ${fmt(lost)}，对方 ${fmt(kl)}。`,Ar>D?'bad':'');}
  const tk=A.units.find(u=>u.id==='tanks'), T=uEff(tk);
  if(T>0){const hl=Math.round(T/6+A.fire/5);S.hope=clamp(S.hope-hl,0,100);A.fire=Math.min(15,A.fire+T/20);
    const tl=Math.round(A.shares.tower/100*defForce()*.04*T/30);S.mil=Math.max(0,S.mil-tl);
    alog(`坦克轰击塔楼。楼层起火。决心 −${hl}。`,'bad');}
  else if(A.fire>0){const hl=Math.round(A.fire/5);A.fire=Math.min(15,A.fire+.5);if(hl){S.hope=clamp(S.hope-hl,0,100);alog(`大火在楼层间蔓延。决心 −${hl}。`,'bad');}}
  // wounded: the med post treats some; the rest lie in corridors and break morale
  const tr=Math.min(A.wnd,Math.round(A.wnd*.3*roomQ(S,'med')*(A.tunnel?2:1))); A.wnd-=tr; if(A.wnd>=40){const wl=Math.min(6,Math.round(A.wnd/80));if(wl){S.hope=clamp(S.hope-wl,0,100);alog(`伤员无处安置：${fmt(A.wnd)}。决心 −${wl}。`,'bad');}}
  // live air: while the world is watching, wavering units look for a reason to stop
  // камеры: эфир точит дух каждый час, а бойня под камерами точит вдвойне
  {const bl=A.air>=40?Math.min(5,lostHour/50):0; for(const u of A.units){if(u.cur<=3)continue; const d=A.air/150+(uEff(u)>0?bl:0)+(A.air>=60&&uState(u)==='waver'?3:0); if(d>0){uMor(u,-d); if(d>=3&&!u.why)u.why='摄像机';}}}
  // танки одни не воюют: если пехота стоит, экипажи не хотят в одиночку расстреливать парламент
  if(tk.cur>3&&!A.units.some(u=>u.id!=='tanks'&&uEff(u)>0)){uMor(tk,-20);tk.why='步兵停下了';}
  // большая кровь у Кремля: резервы не шлют, танкисты сникают
  if(kDead(A)>=450&&tk.cur>3){uMor(tk,-8);if(!tk.why)tk.why='强攻伤亡';}
  for(const u of A.units){if(u.cur<=3)continue; const was=u.mor0>=MOR_GO?2:u.mor0>=MOR_HALT?1:0, m=uMorV(u), now=m>=MOR_GO?2:m>=MOR_HALT?1:0; if(now===was)continue; const nm=UNITS.find(x=>x.id===u.id).nm;
    if(now===0){u.cur=0;u.st='stopped';u.halt=1;} // встали — значит вышли из боя насовсем: вернуть часть Кремль уже не может
    const tx=now===0?'停下，不再前进':now===1?(was===2?'动摇了，以半数兵力前进':'再次出发，但只有半数兵力'):'再次发起进攻';
    alog(nm+': '+tx+(u.why?' ('+u.why+')':'')+'.',now>was?'bad':''); aBanner(nm.toUpperCase()+': '+(now===0?'退出战斗':now===1?(was===2?'动摇中':'再次前进'):'再次进攻'),'士气 '+Math.round(m)+'%'+(u.why?' · 原因： '+u.why:'')+'. '+(now===0?'士兵们停下了，不再前进。这支部队不会再回到战场。':tx[0].toUpperCase()+tx.slice(1)+'.'),now<was);}
  // кровь меняет политику: каждые 500 убитых и раненых с обеих сторон — Радикализм +3, Легитимность −2
  {const bl=Math.floor(((A.lost||0)+kDead(A))/500); if(bl>(A.blood||0)){const d=bl-(A.blood||0);A.blood=bl;S.rad=clamp(S.rad+3*d,0,100);S.leg=clamp(S.leg-2*d,0,100);alog(`死伤人数已超过${fmt(bl*500)}。激进度 +${3*d}，合法性 −${2*d}。`,'bad');}}
  A.air=clamp(A.air+airGain(),0,100); // эфир не тает: каждый час капает от своих изданий
  // ammunition: every hour of fighting eats the stock; with empty magazines the doors hold much worse
  if(A.shares.tower<10){S.hope=clamp(S.hope-2,0,100);A.fire=Math.min(15,A.fire+1);alog('塔楼空了：上层被别的枪手占据，没有人去灭火。决心 −2。','bad');}
  if(S.mil>0){const am=Math.round(S.mil/8); const had=A.ammo>0; A.ammo=Math.max(0,A.ammo-am); if(had&&A.ammo<=0)alog('弹药耗尽。防御全靠枪托和酒瓶支撑。','bad');}
  // siege: after noon reserves come up to the units whose structures stayed with the Kremlin, and the House tires
  if(A.r>=5){S.hope=clamp(S.hope-1,0,100); if(A.r%2===1){ if(A.noRes)alog('没有预备队：克里姆林宫已无人可派。'); else if(kDead(A)>=350)alog('没有预备队：经历这样的伤亡，克里姆林宫不敢再派新部队。'); else{for(const u of A.units){const U=UNITS.find(x=>x.id===u.id); if(u.cur>3&&uEff(u)>0){u.cur=Math.min(U.str*1.2,u.cur+U.str*.15);uMor(u,8);if(!u.why)u.why='预备队';}} alog('预备队赶到了强攻部队。大楼正被以消耗战拿下。','bad');} } }
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
    const t=u.id==='alpha'&&A.alpha==='wait'?['','始终未投入战斗']:st==='refuse'?['p',u.id==='alpha'?'拒绝强攻':'拒绝执行命令，未参战']:st==='stopped'?['p','退出战斗'+(u.why?' ('+u.why+')':'')+(u.id==='tanks'?'':'，伤亡 '+lost)]
      :st==='halt'?['p','停下不前：士气 '+m+'%'+(u.id==='tanks'?'':'，伤亡 '+lost)]:st==='waver'?['','动摇：士气 '+m+'%'+(u.id==='tanks'?'':'，伤亡 '+lost)]:['n',(u.id==='tanks'?'开火中':'推进中')+'：士气 '+m+'%'+(u.id==='tanks'?'':'，伤亡 '+lost)];
    return `<div><b>${U.nm}</b><span class="${t[0]}">${t[1]}</span></div>`;};
  const going=A.units.filter(u=>uEff(u)>0&&u.id!=='tanks').map(u=>UNITS.find(x=>x.id===u.id).nm);
  const T={
    fell:['大楼已被攻下',`${why==='entr'?'20号门':'正门'}已经失守：那里已无守卫者，强攻部队已进入各层。仍在前进的部队（${going.join(', ')||'无人'}）进入了大楼。他们的士气和你们的伤亡已不再构成阻碍：大门已经打开。`],
    broken:['停火',`守卫者的决心降到了零：坦克炮击、楼层大火和走廊里的伤员起了作用。入口仍在坚守，但已无人守卫。窗口挂出了白床单。`],
    held:why==='dark'?['夜幕降临。强攻停止',`十二小时的战斗，大楼仍未拿下。黑暗中，克里姆林宫不敢继续：${going.length?'仍在推进的部队（'+going.join(', ')+'）接到了撤离墙边的命令。不是你们打垮了他们，而是你们熬过了他们。':'已经无人可以前进了。'}`]
      :['强攻已经力竭',`${A.units.some(u=>u.cur>3)?'连续三小时，没有一支部队前进':'墙边已没有任何能够前进的部队'}。指挥官向克里姆林宫报告，人员已无法站起。枪声自行平息。`]}[id];
  $('modal-win').innerHTML=`<h2>${T[0]}</h2><div class="sub">${HOURS[Math.min(A.r,HOURS.length-1)]}，战斗已持续 ${Math.min(A.r,HOURS.length)} 小时，共 ${HOURS.length} 小时。${T[1]}</div>
   <div class="finl">${A.units.map(unitLine).join('')}<div><b>你们的伤亡</b><span>伤亡 ${fmt(A.lost||0)} 人 · 入口：侧门 ${Math.round(A.ctl.entr)}%，正门 ${Math.round(A.ctl.front)}% · 决心 ${S.hope}%</span></div></div><div class="close">ENTER — 接下来发生了什么</div>`;
  $('modal').classList.add('on'); $('modal-win').querySelector('.close').onclick=finaleGo; renderAssaultSafe();}
function renderAssaultSafe(){try{renderAssault();}catch(e){}}
function finaleGo(){const A=S.A; if(!A||A.card!=='fin')return; A.card=0; $('modal').classList.remove('on'); ending(A.finId);}
function alphaCard(){
  const A=S.A;
  const DS=[[S.leg>=50,'合法性不低于50（现在 '+S.leg+')'],[A.air>=40,'舆论不低于40（现在 '+Math.round(A.air)+')']], draw=DS.every(x=>x[0]);
  $('modal-win').innerHTML=`<h2>出入口的“阿尔法”</h2><div class="sub">${A.allRef?'没有一支部队执行命令。克里姆林宫还剩最后的预备队：“阿尔法”和“飞马”。':'强攻已四小时，大楼仍未拿下。克里姆林宫投入最后的预备队：“阿尔法”和“飞马”。'} 他们的军官不想向议会开火，并提议以他们自己的担保带领人员撤出。结局如何，取决于全国是否在注视他们。</div>`+
    [{t:'放“阿尔法”进来，并在其担保下撤出',d:draw?'<span class="p">中立结局：</span>“阿尔法”当着摄像机拒绝强攻。你们失去大楼，但叶利钦已无法指挥。':'<span class="n">失败：</span>悄无声息地投降。要让结局变为中立，需要 '+DS.filter(x=>!x[0]).map(x=>x[1]).join(' 和 ')+'.'},
     {t:'通过无线电向军官喊话',d:S.A.air>=10?`舆论 −10 · “阿尔法”拒绝强攻并撤离的几率为 ${Math.round((.25+S.leg/250)*100)}%。${S.A.allRef?'那时就没有人可以强攻了':'与其余部队的战斗继续'}`:'<span class="n">需要 10 舆论</span>'},
     {t:'战斗',d:'“阿尔法”将强攻第二十号入口。这是克里姆林宫最强的部队。'}]
    .map((c,i)=>`<div class="law" data-i="${i}"><div class="t">${i+1}. ${c.t}</div><div class="d">${c.d}</div></div>`).join('');
  $('modal').classList.add('on'); A.card=1;
  $('modal-win').querySelectorAll('.law').forEach(e=>e.onclick=()=>alphaChoose(+e.dataset.i));
}
function alphaChoose(i){const A=S.A; const u=A.units.find(x=>x.id==='alpha'), base=UNITS.find(x=>x.id==='alpha').str;
  if(i===1&&S.A.air<10)return;
  A.card=0; closeModal();
  if(i===0){S.chron.push({date:dateStr(S.day),h:'“阿尔法”',ch:'谈判'});return ending(S.leg>=50&&A.air>=40?'draw_alpha':'surrender_alpha');}
  if(i===1){S.A.air-=10; u.mor=90; if(Math.random()<.25+S.leg/250){A.alpha='refuse';u.cur=0;alog('“阿尔法”拒绝强攻议会。');aBanner('“阿尔法”拒绝了','军官们通过无线电听取了你们的呼吁，没有去强攻。与其他部队的战斗继续。',true);}
    else{A.alpha='attack';u.cur=base;alog('“阿尔法”的军官拒绝听从。强攻入口。','bad');}}
  if(i===2){A.alpha='attack';u.cur=base;alog('“阿尔法”强攻第二十号入口。','bad');}
  S.chron.push({date:dateStr(S.day),h:'“阿尔法”',ch:['谈判','无线电呼吁','战斗'][i]});
  save(); renderAssault();
}
// ---------- incidents: one per hour, something happens and has to be balanced against the rest ----------
const uMor=(u,d)=>{u.mor=clamp((u.mor==null?80:u.mor)+d,0,100);};
const uOn=(A,id)=>uEff(A.units.find(u=>u.id===id))>0;
function uMul(A,id,k,force){const u=A.units.find(x=>x.id===id),U=UNITS.find(x=>x.id===id); if(u.cur<=3)return; u.cur=Math.min(U.str*1.5,u.cur*k);}
function uStop(A,id,why){const u=A.units.find(x=>x.id===id); u.cur=0;u.st='stopped';alog(UNITS.find(x=>x.id===id).nm+': '+why+'.');}
function uBack(A,k){const u=A.units.find(u=>(u.st==='refuse'||u.st==='stopped')&&u.id!=='alpha'); if(!u)return; const U=UNITS.find(x=>x.id===u.id); u.cur=U.str*k;u.st='attack';u.mor=Math.max(uMorV(u),60);u.dead=0;alog(U.nm+'：重新归队。','bad');}
const yCallUnit=A=>A.units.filter(u=>u.cur>3&&!u.called&&uMorV(u)<MOR_GO&&!(u.id==='alpha'&&A.alpha!=='attack')).sort((x,y)=>UNITS.find(q=>q.id===y.id).str-UNITS.find(q=>q.id===x.id).str)[0];
const yCallLoy=u=>{const U=UNITS.find(x=>x.id===u.id);return U.src==='alpha'?40:u.id==='omon'?100-(S.omon==null?100:S.omon):S.pts[U.src];};
const yCallGain=A=>Math.max(10,Math.round(40-yCallLoy(yCallUnit(A))/3)); // чем лояльнее вам структура, тем слабее действует звонок
const yCallTalk=A=>clamp(.15+yCallLoy(yCallUnit(A))/200+S.leg/400,.1,.7);
const gsChance=k=>clamp(S.pts.gs/130+(S.A.gsB||0)+(k||0),.05,.75);
const INCIDENTS=[
  // звонок в Генштаб: открывается приказом, не случайно. Генштабу подчинены только мотострелки; ВВ и ОМОН — это МВД, танки — Минобороны
  {id:'gs_call', who:'kolesn', cond:A=>false, h:'给总参谋部打电话', p:()=>{const u=S.A.units.find(x=>x.id==='taman');return `议员出身的将军们接通了总参谋长的电话。科列斯尼科夫沉默地听着。他的摩托化步兵此刻在正门：士气 ${Math.round(uMorV(u))}%，伤亡 ${fmt(u.lost||0)}。总参谋部对你们的支持率为 ${S.pts.gs}%。内卫部队和特警不听他指挥，坦克也一样：只能谈论塔曼师。`;},
   ch:[{t:'请求让师部撤离大楼',d:()=>'成功率 '+Math.round(gsChance()*100)+'%：摩托化步兵全部撤离。否则他会向克里姆林宫报告：其士气 +10',run:A=>{const u=A.units.find(x=>x.id==='taman'); if(Math.random()<gsChance()){u.cur=0;u.st='stopped';u.why='总参谋部撤回了';alog('摩托化步兵：总参谋部已将师部撤离大楼。');aBanner('摩托化步兵：已撤离','科列斯尼科夫命令塔曼师撤离白宫。',true);}else{u.mor0=uMorV(u);uMor(u,10);u.why='通话失败';alog('科列斯尼科夫听完挂断了电话。一分钟后，克里姆林宫就知道了这通电话。','bad');aBanner('总参谋部拒绝','科列斯尼科夫向克里姆林宫报告了这通电话。摩托化步兵士气 +10。',false);}}},
       {t:'请求不要着急：让连队伏下等待',d:()=>'必定：摩托化步兵士气 −15',rq:'总参谋部 30',req:()=>S.pts.gs>=30,run:A=>{const u=A.units.find(x=>x.id==='taman');u.mor0=uMorV(u);uMor(u,-15);u.why='总参谋部在拖延';alog('总参谋部没有取消命令，但也不催促。摩托化步兵伏倒在地。');}},
       {t:'宣读代表大会决议：命令是犯罪的，他将亲自承担责任',d:()=>'成功率 '+Math.round(gsChance(.2)*100)+'%：摩托化步兵撤离。否则合法性 −3，其士气 +10',rq:'合法性60',req:()=>S.leg>=60,run:A=>{const u=A.units.find(x=>x.id==='taman'); if(Math.random()<gsChance(.2)){u.cur=0;u.st='stopped';u.why='总参谋部撤回了';alog('摩托化步兵：科列斯尼科夫不愿为强攻承担责任。师部已撤离。');aBanner('摩托化步兵：已撤离','科列斯尼科夫不愿亲自为强攻负责。',true);}else{u.mor0=uMorV(u);uMor(u,10);u.why='通话失败';S.leg=clamp(S.leg-3,0,100);alog('科列斯尼科夫回答说，他向总统宣过誓。通话录音被交给了克里姆林宫的记者。','bad');}}}]},
  {id:'y_addr', cond:A=>A.r>=1, h:'叶利钦讲话', p:'早上九点，总统在电视上讲话：“莫斯科的武装叛乱将被镇压。那些与和平城市作对的人，将得到应有的下场。”士兵们用无线电收听。',
   ch:[{t:'不予回应',d:'所有部队士气 +8 · 决心 −3',run:A=>{for(const u of A.units)uMor(u,8);S.hope=clamp(S.hope-3,0,100);}},
       {t:'现场回应：议员在大厅里，他们正在向他们开枪',d:'舆论 −8 · 部队士气 −6',rq:'舆论30',req:()=>S.A.air>=30&&S.A.air>=8,run:A=>{S.A.air-=8;for(const u of A.units)uMor(u,-6);}},
       {t:'在各层播放他的讲话：让他们听听许诺给他们的是什么',d:'决心 +4 · 激进度 +4',run:A=>{S.hope=clamp(S.hope+4,0,100);S.rad=clamp(S.rad+4,0,100);}}]},
  // тяни-толкай: когда часть встала или заколебалась, Ельцин один раз лично звонит её командиру. Вернуть каждую часть он может только однажды
  {id:'y_call', multi:1, prio:1, cond:A=>A.r>=1&&!!yCallUnit(A), h:'来自克里姆林宫的电话', p:()=>{const u=yCallUnit(S.A),U=UNITS.find(x=>x.id===u.id);return `${U.nm}：士气 ${Math.round(uMorV(u))}%，部队动摇，以半数兵力前进。叶利钦亲自给指挥官打电话：“你明白拒绝的代价吗？前进。”他只能鼓励仍在作战的部队，而且只能一次。如果某支部队停下来，就再也没有人能把它拉回去。`;},
   ch:[{t:'不予介入',d:()=>'部队士气 +'+yCallGain(S.A),run:A=>{const u=yCallUnit(A),g=yCallGain(A);u.called=1;u.mor0=uMorV(u);uMor(u,g);u.why='叶利钦的电话';}},
       {t:'切换到他们的频率：“指挥官，这道命令是犯罪的，你们将为此负责”',d:()=>'舆论 −10 · 部队士气仅 +'+Math.round(yCallGain(S.A)/3),rq:'舆论10',req:()=>S.A.air>=10,run:A=>{const u=yCallUnit(A),g=yCallGain(A);u.called=1;u.mor0=uMorV(u);A.air-=10;uMor(u,Math.round(g/3));u.why='通话被切断';}},
       {t:'派议员军官举着白旗前去',d:()=>'成功率 '+Math.round(yCallTalk(S.A)*100)+'%：部队全部撤离。否则士气 +'+yCallGain(S.A)+'，决心 −3',run:A=>{const u=yCallUnit(A),U=UNITS.find(x=>x.id===u.id),g=yCallGain(A),ok=Math.random()<yCallTalk(A);u.called=1; if(ok){u.cur=0;u.st='stopped';u.why='带走了部队';alog(U.nm+'：指挥官听取了议员的意见，带走了部队。');aBanner(U.nm.toUpperCase()+'：已撤离','指挥官听取了议员的意见，将部队带离大楼。',true);}else{u.mor0=uMorV(u);uMor(u,g);u.why='叶利钦的电话';S.hope=clamp(S.hope-3,0,100);alog('谈判代表没能接近指挥官。','bad');}}}]},
  {id:'y_order', cond:A=>A.r>=4&&A.units.some(u=>u.cur>3&&u.mor<=45), h:'带签名的命令', p:'总统亲笔签名的书面命令被送到了各部队指挥官手中。现在拒绝意味着军事法庭，而不是犹豫。',
   ch:[{t:'什么也不做',d:'所有部队士气 +15',run:A=>{for(const u of A.units)if(u.cur>3)uMor(u,15);}},
       {t:'在电视上提醒：命令是非法的，执行者将承担责任',d:'舆论 −10 · 士气 +5（而非 +15）',rq:'合法性50',req:()=>S.leg>=50&&S.A.air>=10,run:A=>{S.A.air-=10;for(const u of A.units)if(u.cur>3)uMor(u,5);}}]},
  // ----- части Кремля: кто отказывается, кто переходит, кого дожимают. Зависит от отношений со структурой -----
  {id:'u_tank', cond:A=>uOn(A,'tanks'), h:'车组关掉了引擎', p:'桥上的一辆坦克沉默了。车组指挥员通过公开频道问：谁来为向议会开火负责，拒绝的人又会怎样。',
   ch:[{t:'保持沉默',d:'坦克 −10%',run:A=>uMul(A,'tanks',.9)},
       {t:'以最高苏维埃的名义作出保证：拒绝者不会受到伤害',d:'坦克 −35%',rq:'合法性60',req:()=>S.leg>=60,run:A=>uMul(A,'tanks',.65)},
       {t:'召唤他们过来：调转炮口',d:'一辆坦克停在正门：入口 +15 · 激进度 +5 · 舆论 −10',rq:'国防部55',req:()=>S.pts.mo>=55,run:A=>{uMul(A,'tanks',.75);A.ctl.front=Math.min(100,A.ctl.front+15);S.rad=clamp(S.rad+5,0,100);A.air=Math.max(0,A.air-10);}}]},
  {id:'u_paid', pic:'tank', cond:A=>uOn(A,'tanks')&&S.pts.mo<50&&A.r>=1, h:'为钱而战的车组', p:'义务兵拒绝开火。自愿报名的军官被派上坦克：每人都被许诺金钱和住房。炮手都是有经验的。',
   ch:[{t:'什么也不做',d:'坦克 +25%',run:A=>uMul(A,'tanks',1.25)},
       {t:'在电视上点名并公布价码',d:'舆论 +2 · 坦克 +5%',rq:'舆论 8',req:()=>S.A.air>=8,run:A=>{S.A.air-=8;uMul(A,'tanks',1.05);A.air=Math.min(100,A.air+10);}},
       {t:'致电师长：把志愿者撤下来',d:'坦克 −15%',rq:'国防部 40',req:()=>S.pts.mo>=40&&!S.flags.noComms,run:A=>uMul(A,'tanks',.85)}]},
  {id:'u_vv', cond:A=>uOn(A,'vv'), h:'团不肯出动', p:'一个内卫部队团的团长通过无线电说：他的人不会向议会开火。但他也不打算过来。他问你们想让他做什么。',
   ch:[{t:'让他把人带回营房',d:'内卫部队 −25%',run:A=>uMul(A,'vv',.75)},
       {t:'请他在双方之间列队隔开',d:'内卫部队 −45% · 入口 +8',rq:'内务部 45',req:()=>S.pts.mvd>=45,run:A=>{uMul(A,'vv',.55);A.ctl.entr=Math.min(100,A.ctl.entr+8);}},
       {t:'要求他们带着武器过来',d:'50%几率：民兵 +80，武器 +80 · 否则团会感到受辱，内卫部队 +15%',rq:'激进度 50%',req:()=>S.rad>=50,run:A=>{if(Math.random()<.5){S.mil+=80;S.gun+=80;uMul(A,'vv',.7);alog('内卫部队团转向了苏维埃一边。');}else{uMul(A,'vv',1.15);alog('团长挂断了电话。内卫部队继续前进。','bad');}}}]},
  {id:'u_omon', cond:A=>uOn(A,'omon'), h:'特警停下', p:'莫斯科特警在正门停下。战士们被告知，大楼里全是武装分子。指挥官通过扩音器喊道：让我们看看你们里面有谁。',
   ch:[{t:'朝头顶上方开火',d:'特警 +10% · 决心 +2',run:A=>{uMul(A,'omon',1.1);S.hope=clamp(S.hope+2,0,100);}},
       {t:'带持证议员走到台阶上',d:'特警撤退',rq:'法定人数： '+QUORUM+' 名议员离开',req:()=>deputies(S)>=QUORUM,run:A=>uStop(A,'omon','看到了议员，撤离了大楼')},
       {t:'提醒他们，市政府把他们推进了火坑',d:'特警 −40%',rq:'市政府 40',req:()=>S.pts.mer>=40,run:A=>uMul(A,'omon',.6)}]},
  {id:'u_general', cond:A=>A.r>=2&&A.units.some(u=>uState(u)==='waver'), h:'桥上的将军', p:'克里姆林宫派出一名将军，携带书面命令并以军事法庭相威胁，前往动摇的部队。他沿着队列走动，直视指挥官的眼睛。',
   ch:[{t:'等待',d:'动摇的部队全力进攻',run:A=>{for(const u of A.units)if(uState(u)==='waver'){u.st='attack';u.mor=70;}}},
       {t:'派议员出身的将军前去会面',d:'部队继续动摇，并减弱15%',rq:'总参谋部 45',req:()=>S.pts.gs>=45,run:A=>{for(const u of A.units)if(u.st==='waver')u.cur*=.85;}},
       {t:'在直播中展示手持命令的将军',d:'舆论 −15 · 一支动摇的部队撤离，其余部队进攻',rq:'舆论 40',req:()=>S.A.air>=40,run:A=>{A.air-=15;const w=A.units.filter(u=>uState(u)==='waver').sort((a,b)=>b.cur-a.cur);if(w[0])uStop(A,w[0].id,'离开了摄像机的视野');for(const u of w.slice(1)){u.st='attack';u.cur=UNITS.find(x=>x.id===u.id).str;}}}]},
  {id:'u_tula', cond:A=>A.r>=5&&S.pts.gs<50, h:'来自图拉的伞兵', p:'图拉师的一个团已抵达莫斯科。团长至今不明白是为了谁把他们调来的，正在环路上等候。',
   ch:[{t:'什么也不做',d:'摩托化步兵 +35%',run:A=>uMul(A,'taman',1.35,1)},
       {t:'通过无线电与他联络',d:'舆论 −10 · 45%几率该团留在环路',rq:'舆论10',req:()=>S.A.air>=10,run:A=>{S.A.air-=10;if(Math.random()<.45)alog('图拉团留在环路，没有进入城市。');else{uMul(A,'taman',1.35,1);alog('伞兵进入了城市。','bad');}}},
       {t:'用人群封住大街',d:'民众 −400 · 摩托化步兵 +10%',rq:'民众1500',req:()=>S.ppl>=1500,run:A=>{S.ppl-=400;uMul(A,'taman',1.1,1);}}]},
  {id:'u_column', cond:A=>A.r>=3&&S.pts.gs>=55, h:'纵队等待命令', p:'莫斯科郊外一支部队的指挥官通过保密线路来电：他准备带领纵队开往白宫。他需要命令和签字。',
   ch:[{t:'拒绝：军队不得向军队开火',d:'舆论 +10 · 决心 −2',run:A=>{A.air=Math.min(100,A.air+10);S.hope=clamp(S.hope-2,0,100);}},
       {t:'让它停在环路上等待',d:'克里姆林宫所有部队 −12%',run:A=>{for(const u of A.units)u.cur*=.88;}},
       {t:'签署命令：纵队进城',d:'民兵 +150 · 武器 +150 · 决心 +6 · 激进度 +10 · 舆论 −20',rq:'激进度 50%',req:()=>S.rad>=50,run:A=>{S.mil+=150;S.gun+=150;A.ammo+=150;S.hope=clamp(S.hope+6,0,100);S.rad=clamp(S.rad+10,0,100);A.air=Math.max(0,A.air-20);}}]},
  {id:'u_cops', cond:A=>S.pts.mvd>=50, h:'一个分队倒戈', p:'三十多名来自区分局的民警带着制式武器来到第二十号入口。带队的军官说：“我们向法律宣过誓。”',
   ch:[{t:'安排到窗口',d:'民兵 +40 · 武器 +40',run:A=>{S.mil+=40;S.gun+=40;}},
       {t:'让他们穿着制服带出伤员和妇女',d:'伤员已撤出 · 舆论 +10',run:A=>{A.wnd=0;A.air=Math.min(100,A.air+10);}},
       {t:'送回去去说服自己人',d:'内卫部队和特警 −15%',run:A=>{uMul(A,'vv',.85);uMul(A,'omon',.85);}}]},
  {id:'u_back', cond:A=>false&&A.r>=3&&A.units.some(u=>(u.st==='refuse'||u.st==='stopped')&&u.id!=='alpha'), h:'逼迫拒绝者', p:'拒绝强攻的部队指挥官被撤职。新指挥官带来了钱和命令。士兵们被重新集合。',
   ch:[{t:'什么也不做',d:'部队以半数兵力返回',run:A=>uBack(A,.5)},
       {t:'向士兵喊话：你们第二次被骗了',d:'舆论 −10 · 部队以四分之一兵力返回',rq:'舆论10',req:()=>S.A.air>=10,run:A=>{S.A.air-=10;uBack(A,.25);}},
       {t:'宣布被撤职的指挥官为代理人',d:'部队原地不动',rq:'合法性65',req:()=>S.leg>=65,run:A=>alog('士兵们听从原来的指挥官。')}]},
  {id:'floor', cond:A=>A.fire>=3, h:'十二层在燃烧', p:'火势沿电缆井向上蔓延。上面有代表大会的档案，还有来不及下来的人。',
   ch:[{t:'派人灭火',d:'民众 −150 · 火势 −5',run:A=>{S.ppl=Math.max(0,S.ppl-150);A.fire=Math.max(0,A.fire-5);}},
       {t:'从河边传递水桶的人链',d:'民众 −60 · 火势 −8',rq:'民众1000',req:()=>S.ppl>=1000,run:A=>{S.ppl-=60;A.fire=Math.max(0,A.fire-8);}},
       {t:'放弃这一层',d:'火势 +2 · 决心 −4',run:A=>{A.fire=Math.min(15,A.fire+2);S.hope=clamp(S.hope-4,0,100);}}]},
  {id:'wounded', cond:A=>A.wnd>=40, h:'第二十号入口的伤员', p:'绷带用完了，医生把床单剪开。街对面停着救护车，却被封锁线挡着不让进。',
   ch:[{t:'冒着火力把伤员抬出去',d:'伤员 −60% · 民兵 −20',run:A=>{A.wnd=Math.round(A.wnd*.4);S.mil=Math.max(0,S.mil-20);}},
       {t:'请内务部军官开辟一条通道',d:'伤员已撤出 · 舆论 +10',rq:'内务部30',req:()=>S.pts.mvd>=30,run:A=>{A.wnd=0;A.air=Math.min(100,A.air+10);}},
       {t:'留到天黑',d:'决心 −6',run:A=>{S.hope=clamp(S.hope-6,0,100);}}]},
  {id:'cnn', cond:A=>true, h:'现场直播', p:'对面屋顶上的CNN摄像机把大楼画面传向全世界。摄影师挥手：给我们找个人入镜。',
   ch:[{t:'哈斯布拉托夫走到窗前',d:'舆论 +20',run:A=>{A.air=Math.min(100,A.air+20);}},
       {t:'让议员和妇女入镜，把持枪者撤下去',d:'舆论 +35',rq:'激进度不高于40%',req:()=>S.rad<=40,run:A=>{A.air=Math.min(100,A.air+35);}},
       {t:'没空理会镜头',d:'决心 +2',run:A=>{S.hope=clamp(S.hope+2,0,100);}}]},
  {id:'snipers', cond:A=>true, h:'屋顶上的狙击手', p:'不明身份的枪手从屋顶上向你们这边和士兵们开火。双方都确信对方才是开枪者。',
   ch:[{t:'掩护人员',d:'外墙 −8',run:A=>{A.ctl.front=Math.max(1,A.ctl.front-8);}},
       {t:'由自己人解决这些枪手',d:'民兵 −15 · 决心 +4',rq:'民兵 150',req:()=>S.mil>=150,run:A=>{S.mil-=15;S.hope=clamp(S.hope+4,0,100);}},
       {t:'在电视上声明：不是我们干的',d:'舆论 −10 · 内卫部队减弱',rq:'舆论30',req:()=>S.A.air>=30,run:A=>{A.air-=10;const u=A.units.find(x=>x.id==='vv');u.cur*=.75;}}]},
  {id:'parley', cond:A=>A.r>=2, h:'谈判使者', p:'一名举白旗的军官提议停火半小时，让妇女和伤员撤离。他说，之后情况会更糟。',
   ch:[{t:'同意',d:'民众 −300 · 伤员已撤出 · 决心 −3',run:A=>{S.ppl=Math.max(0,S.ppl-300);A.wnd=0;S.hope=clamp(S.hope-3,0,100);}},
       {t:'要求调停人：宗主教、法院、各地区',d:'舆论 +15 · 进攻减弱',rq:'合法性70',req:()=>S.leg>=70,run:A=>{A.air=Math.min(100,A.air+15);for(const u of A.units)u.cur*=.9;}},
       {t:'拒绝',d:'决心 +3',run:A=>{S.hope=clamp(S.hope+3,0,100);}}]},
  {id:'hall', pic:'tank', cond:A=>A.units.find(u=>u.id==='tanks').cur>0, h:'大厅里的炮弹', p:'一发实心弹穿透了会议厅的墙壁。议员们趴在座椅之间。有人建议下到地下室。',
   ch:[{t:'全部去地下室',d:'决心 −4',run:A=>{S.hope=clamp(S.hope-4,0,100);}},
       {t:'继续开会',d:'决心 +5 · 舆论 +10 · 10名议员将离开',rq:'决心 50%',req:()=>S.hope>=50,run:A=>{S.hope=clamp(S.hope+5,0,100);A.air=Math.min(100,A.air+10);S.fac.kol.n=Math.max(0,S.fac.kol.n-10);}}]},
  {id:'ammo', cond:A=>A.r>=1, h:'弹药', p:'各入口每支枪只剩一个弹匣。指挥官们问，还能去哪里弄到更多。',
   ch:[{t:'单发射击',d:'弹药 +40 · 两个入口 −6',run:A=>{A.ammo+=40;A.ctl.entr=Math.max(1,A.ctl.entr-6);A.ctl.front=Math.max(1,A.ctl.front-6);}},
       {t:'从各层和非武装人员那里收集',d:'弹药 +100 · 民众 −80',rq:'民众 500',req:()=>S.ppl>=500,run:A=>{A.ammo+=100;S.ppl-=80;}},
       {t:'打开应急储备',d:'弹药 +200',rq:'武器300',req:()=>S.gun>=300,run:A=>{A.ammo+=200;}}]},
  {id:'crowd', cond:A=>S.city>=35, h:'河堤', p:'桥上和河堤上有成千上万的莫斯科人。有人像看电影一样观望，有人则准备走向大楼。',
   ch:[{t:'请他们离开火线',d:'决心 +1',run:A=>{S.hope=clamp(S.hope+1,0,100);}},
       {t:'召集他们组成人墙',d:'一小时后 +800人 · 舆论 +10',rq:'莫斯科55%',req:()=>S.city>=55,run:A=>{A.incoming+=800;A.air=Math.min(100,A.air+10);}}]},
  {id:'water', cond:A=>A.fire>=2, h:'消防栓没水', p:'大楼的水一周前就断了。消防水管是空的，灭火器也快用完了。',
   ch:[{t:'冒着火力从河里提水',d:'民众 −120 · 火势 −4',run:A=>{S.ppl=Math.max(0,S.ppl-120);A.fire=Math.max(0,A.fire-4);}},
       {t:'用街垒上的沙袋压灭',d:'火势 −5 · 两个入口 −5',run:A=>{A.fire=Math.max(0,A.fire-5);A.ctl.entr=Math.max(1,A.ctl.entr-5);A.ctl.front=Math.max(1,A.ctl.front-5);}},
       {t:'任其燃烧',d:'火势 +2',run:A=>{A.fire=Math.min(15,A.fire+2);}}]},
  {id:'defect', cond:A=>A.units.some(u=>u.id==='taman'&&u.cur>0), h:'叛逃者', p:'一个摩托化步兵排伏在基座旁，没有开火。中尉喊道，他们不想参与此事。',
   ch:[{t:'喊他们离开',d:'摩托化步兵减弱',run:A=>{const u=A.units.find(x=>x.id==='taman');u.cur*=.85;}},
       {t:'带着武器把他们拉进来',d:'民兵 +30 · 武器 +60',rq:'总参谋部 40',req:()=>S.pts.gs>=40,run:A=>{S.mil+=30;S.gun+=60;const u=A.units.find(x=>x.id==='taman');u.cur*=.8;}},
       {t:'在电视上展示他们',d:'舆论 +15',rq:'舆论20',req:()=>S.A.air>=20,run:A=>{A.air=Math.min(100,A.air+15);}}]},
  {id:'cellar', cond:A=>A.r>=2, h:'地下室', p:'防空洞里有数百名妇女、食堂工作人员、打字员和员工的孩子。他们再也上不来了。',
   ch:[{t:'从第二十号入口带出去',d:'民众 −200 · 舆论 +10 · 入口 −6',run:A=>{S.ppl=Math.max(0,S.ppl-200);A.air=Math.min(100,A.air+10);A.ctl.entr=Math.max(1,A.ctl.entr-6);}},
       {t:'留在地下室，直到天黑',d:'决心 −3',run:A=>{S.hope=clamp(S.hope-3,0,100);}}]},
  {id:'btr', cond:A=>A.r>=3, h:'战利品', p:'正门旁停着一辆被弃的装甲输送车，弹药装满。车组已经逃跑。',
   ch:[{t:'烧掉，别让他们拿去',d:'正门 +4',run:A=>{A.ctl.front=Math.min(100,A.ctl.front+4);}},
       {t:'让自己人上车，调转机枪',d:'正门 +15 · 武器 +80 · 舆论 −10',rq:'民兵 250',req:()=>S.mil>=250,run:A=>{A.ctl.front=Math.min(100,A.ctl.front+15);S.gun+=80;A.air=Math.max(0,A.air-10);}}]},
  {id:'planes', cond:A=>A.r>=1, h:'鲁茨科伊的无线电', p:'副总统对着公开频道大喊：“同志们，起飞战机！”飞行员、记者和克里姆林宫都听到了。',
   ch:[{t:'让他去喊',d:'决心 +4 · 舆论 −15',run:A=>{S.hope=clamp(S.hope+4,0,100);A.air=Math.max(0,A.air-15);}},
       {t:'拿下电台：请世界出面调停',d:'舆论 +10',rq:'决心 40%',req:()=>S.hope>=40,run:A=>{A.air=Math.min(100,A.air+10);}}]},
  {id:'truce', cond:A=>A.r>=6, h:'一小时的寂静', p:'克里姆林宫提议停火一小时，用来收容伤员。双方都知道，在这一小时里预备队会赶到。',
   ch:[{t:'同意',d:'伤员已撤出 · 两个入口 +6 · 克里姆林宫部队增强',run:A=>{A.wnd=0;A.ctl.entr=Math.min(100,A.ctl.entr+6);A.ctl.front=Math.min(100,A.ctl.front+6);for(const u of A.units)if(u.cur>3)u.cur*=1.12;}},
       {t:'拒绝',d:'决心 +2',run:A=>{S.hope=clamp(S.hope+2,0,100);}},
       {t:'同意，并把记者带到伤员处',d:'同上 · 舆论 +20',rq:'舆论 25',req:()=>S.A.air>=25,run:A=>{A.wnd=0;A.air=Math.min(100,A.air+20);A.ctl.entr=Math.min(100,A.ctl.entr+6);A.ctl.front=Math.min(100,A.ctl.front+6);for(const u of A.units)if(u.cur>3)u.cur*=1.12;}}]},
  {id:'rne', cond:A=>S.fac.rne.n>0, h:'巴尔卡绍夫的人离开', p:'RNE找到了通往地下下水道的路，打算趁为时未晚离开。三分之一的枪械将随他们带走。',
   ch:[{t:'放他们走',d:'RNE离开大楼',run:A=>{S.fac.rne.n=0;}},
       {t:'在队列前使他们蒙羞',d:'留下 · 决心 +2',rq:'决心60%',req:()=>S.hope>=60,run:A=>{S.hope=clamp(S.hope+2,0,100);}},
       {t:'用武器收买',d:'武器 −100 · 留下',rq:'武器 100',req:()=>S.gun>=100,run:A=>{S.gun-=100;if(S.mil>S.gun)S.mil=S.gun;}}]},
];
function incidentCard(){const A=S.A; if(!A||screen!=='assault')return;
  let I=A.card==='inc'&&INCIDENTS.find(x=>x.id===A.incId);
  if(!I){const pool=INCIDENTS.filter(x=>!A.inc[x.id]&&x.cond(A)); if(!pool.length)return; const pr=pool.filter(x=>x.prio); I=pr.length?pr[0]:pool[Math.floor(Math.random()*pool.length)];}
  if(A.card!=='inc')Sfx.play(/^u_|^y_/.test(I.id)?'static':'alarm',1.2);
  A.card='inc'; A.incId=I.id; save();
  const tk=I.pic==='tank'&&uOn(A,'tanks'), who=/^y_/.test(I.id)?'yeltsin':I.who, yel=!!who||tk, body=`<h2>${I.h}</h2><div class="sub">${typeof I.p==='function'?I.p():I.p}</div>`+I.ch.map((c,i)=>{const lk=c.req&&!c.req();
    return `<div class="law${lk?' lock':''}" data-i="${i}"><div class="t">${i+1}. ${c.t}</div><div class="e">${typeof c.d==='function'?c.d():c.d}${c.rq?` · <span class="${lk?'n':'p'}">${lk?'需要':'开放'}: ${c.rq}</span>`:''}</div></div>`;}).join('');
  $('modal-win').innerHTML=tk?`<div class="incy"><div class="ph"><img src="${tankShotURL()}"><b>新阿尔巴特桥</b><small>坦克向大楼开火</small></div><div>${body}</div></div>`:yel?`<div class="incy"><div class="ph"><img src="${who==='yeltsin'?ASSET_YELTSIN:PEOPLE[who].img}"><b>${who==='yeltsin'?'鲍里斯·叶利钦':PEOPLE[who].nm.toUpperCase()}</b><small>${who==='yeltsin'?'通过直线通话':PEOPLE[who].role+'，通过直线通话'}</small></div><div>${body}</div></div>`:body;
  $('modal').classList.add('on');
  $('modal-win').querySelectorAll('.law').forEach(e=>e.onclick=()=>incChoose(+e.dataset.i));
}
function incChoose(i){const A=S.A, I=INCIDENTS.find(x=>x.id===A.incId), c=I&&I.ch[i]; if(!c||(c.req&&!c.req()))return;
  A.card=0; if(!I.multi)A.inc[I.id]=1; $('modal').classList.remove('on'); c.run(A); alog(I.h.charAt(0)+I.h.slice(1).toLowerCase()+': '+c.t.toLowerCase()+'.');
  if(S.hope<=0)return finale('broken'); save(); renderAssault();}
const A_ORDERS=[
  {t:'反攻',                 d:'入口 +20 · 战士 −50 · 敌方士气 −7', req:()=>S.mil>=50||'需要50名战士',
   run:()=>{const s=S.A.ctl.entr<=S.A.ctl.front?'entr':'front';S.A.ctl[s]=Math.min(100,S.A.ctl[s]+20);S.mil-=50;for(const u of S.A.units)if(UNITS.find(x=>x.id===u.id).target===s&&u.cur>3){uMor(u,-7);u.lost=(u.lost||0)+15;}alog('入口反攻«'+SECTORS.find(x=>x.id===s).nm+'».');}},
  {t:'封堵薄弱入口',      d:'民众 −100 · 入口 +10', req:()=>S.ppl>=100||'需要100人',
   run:()=>{const s=S.A.ctl.entr<=S.A.ctl.front?'entr':'front';S.ppl-=100;S.A.ctl[s]=Math.min(100,S.A.ctl[s]+10);alog('民众把家具和保险柜拖到入口«'+SECTORS.find(x=>x.id===s).nm+'».');}},
  {t:'致电总参谋部',           d:()=>'与科列斯尼科夫谈摩托化步兵的事', once:1, req:()=>S.flags.noComms?'无通讯':deputies(S)<5?'没有议员':uEff(S.A.units.find(u=>u.id==='taman'))>0||'摩托化步兵不参战',
   run:()=>{const A=S.A; A.card='inc'; A.incId='gs_call'; incidentCard();}},
  {t:'议员——到会场去',          d:'决心 +8', once:1, req:()=>true, run:()=>{S.hope=clamp(S.hope+8,0,100);alog('代表大会在炮火下继续开会。人们坚守着。');}},
  {t:'灭火',               d:'民众 −100 · 火势 −6', req:()=>(S.A.fire>=1&&S.ppl>=100)||(S.A.fire<1?'没有东西在烧':'需要100人'),
   run:()=>{S.ppl-=100;S.A.fire=Math.max(0,S.A.fire-6);alog('志愿者正在扑灭各层的火。');}},
  {t:'武装民众',            d:()=>{const k=Math.min(100,S.ppl,freeGuns(S));return '民众 −'+k+' · 民兵 +'+k;}, req:()=>(S.ppl>=20&&freeGuns(S)>=20)||(freeGuns(S)<20?'没有空闲的枪':'没有人'),
   run:()=>{const k=Math.min(100,S.ppl,freeGuns(S));S.ppl-=k;S.mil+=k;alog('另外 '+k+' 人领到了武器，站到了窗口。');}},
  {t:'给战士的食物和水',          d:'补给 −2 · 决心 +5', req:()=>S.A.stock>=2||'需要补给 2',
   run:()=>{S.A.stock-=2;S.hope=clamp(S.hope+5,0,100);alog('面包、茶和水被分发到各层。');}},
  {t:'给伤员的绷带',  d:'补给 −2 · 伤员 −60%', req:()=>S.A.wnd<20?'伤员不多':S.A.stock>=2||'需要补给 2',
   run:()=>{S.A.stock-=2;S.A.wnd=Math.round(S.A.wnd*.4);alog('第二十号入口打开了最后几箱绷带。');}},
  {t:'柴油泼到街垒上',       d:'补给 −3 · 薄弱入口 +12 · 火势 +1', req:()=>S.A.stock>=3||'需要补给 3',
   run:()=>{const s=S.A.ctl.entr<=S.A.ctl.front?'entr':'front';S.A.stock-=3;S.A.ctl[s]=Math.min(100,S.A.ctl[s]+12);S.A.fire+=1;alog('入口«'+SECTORS.find(x=>x.id===s).nm+'»被泼上柴油并点燃。');}},
  {t:'白旗',                 d:'投降', flag:1, req:()=>true, run:()=>ending('surrender')},
];
// ---------- the air during the assault: what you ask the world for. One request an hour, paid in Эфир ----------
const AIR=[
  {t:'召唤莫斯科人到大楼来', cost:10, d:()=>`一小时后 ${fmt(300+S.city*10)} 人会来`, run:A=>{A.incoming+=300+S.city*10;alog('舆论：莫斯科人被号召前往白宫。');}},
  {t:'请求停火，以便撤离伤员', cost:8, d:()=>`${Math.round(Math.min(.9,.3+S.A.air/100)*100)}%几率：伤员撤出，决心 +3`, req:()=>S.A.wnd>=20||'伤员不多',
   run:A=>{if(Math.random()<Math.min(.9,.3+A.air/100)){A.wnd=0;S.hope=clamp(S.hope+3,0,100);alog('火力停了二十分钟。救护车带走了伤员。');}else alog('停火被拒绝。','bad');}},
  {t:'向士兵喊话：不要开枪', cost:12, d:()=>`${Math.round(Math.min(.45,.1+S.A.air/200)*100)}%几率一支动摇的部队停下；否则进攻压力 −6%`,
   run:A=>{const g=A.units.filter(u=>uState(u)==='waver').sort((a,b)=>a.cur-b.cur)[0];
     if(g&&Math.random()<Math.min(.45,.1+A.air/200)){g.cur=0;g.st='stopped';alog(UNITS.find(x=>x.id===g.id).nm+'：听到了呼吁，停止了开火。');}else{for(const u of A.units){u.cur*=.94;uMor(u,-5);}alog('士兵们听着，但命令就是命令。火力变得稀疏了。');}}},
  {t:'向世界展示大火和伤员', cost:0, d:()=>'舆论 +15', run:A=>{A.air=Math.min(100,A.air+15);alog('燃烧的议会画面播向全球各大频道。');}},
  {t:'点名那些下达命令的指挥官', cost:10, d:()=>'坦克 −25%，坦克车组士气 −15，激进度 +3', req:()=>S.A.units.find(u=>u.id==='tanks').cur>0||'坦克沉默',
   run:A=>{A.units.find(u=>u.id==='tanks').cur*=.75;uMor(A.units.find(u=>u.id==='tanks'),-15);S.rad=clamp(S.rad+3,0,100);alog('电视上宣读了姓名和部队番号。两个车组关掉了引擎。');}},
  {t:'请求法院和各地区出面调停', cost:15, d:()=>'进攻 −10%，决心 +4', req:()=>S.leg>=50||'需要合法性 50',
   run:A=>{for(const u of A.units)u.cur*=.9;S.hope=clamp(S.hope+4,0,100);alog('佐尔金和各地区首长要求停火。');}},
  {t:'向士兵展示他们自己的伤亡', cost:8, d:()=>'所有部队士气 −5，遭受伤亡者士气 −10', run:A=>{for(const u of A.units)if(u.cur>3)uMor(u,(u.lost||0)>=40?-10:-5);alog('扩音器里念出阵亡士兵的名字。队列里一片寂静。');}},
  {t:'请求医生和救护车', cost:5, d:()=>'伤员减半', req:()=>S.A.wnd>=20||'伤员不多', run:A=>{A.wnd=Math.round(A.wnd/2);alog('志愿医生穿过了封锁线。');}},
];
const airGain=()=>1+Math.floor(OUTLETS.filter(o=>outSt(S,o)==='vs').length/4)+(S.pts.ost>=100?2:0);
const airCost=o=>o.cost*(S.flags.noComms?2:1);
function airState(i){const o=AIR[i],A=S.A; if(A.airUsed)return '这个时候已经出来了'; if(S.A.air<airCost(o))return '需要 '+airCost(o)+' 舆论'; const r=o.req?o.req():true; return r;}
function openAir(){const A=S.A; if(!A||screen!=='assault'||A.card)return;
  $('modal-win').innerHTML=`<h2>来自白宫的舆论</h2><div class="sub">舆论：<b style="color:var(--paper)">${Math.round(A.air)}</b>（满分100），你们的媒体每小时 +${airGain()}。舆论高时，世界都在看：进攻减弱，部队士气下降，从60起，动摇的部队可能停下。呼吁会消耗舆论。每小时一次请求，命令不消耗舆论。${S.flags.noComms?' <span class="n">通讯中断，只能通过外国人发布舆论：一切成本翻倍。</span>':''}舆论越高，进攻越弱，你们也越容易被听见。</div><div class="app2">`+
    AIR.map((o,i)=>{const st=airState(i);return `<div class="law${st!==true?' lock':''}" data-i="${i}"><div class="t">${o.t} <span class="cst">${airCost(o)?"舆论 −"+airCost(o):"免费"}</span></div><div class="e">${st===true?o.d():`<span class="n">${st}</span>`}</div></div>`;}).join('')+
    `</div><div class="close">ESC — 关闭</div>`;
  $('modal').classList.add('on');
  $('modal-win').querySelectorAll('.law').forEach(e=>e.onclick=()=>{const i=+e.dataset.i; if(airState(i)!==true)return; Sfx.play('static');Sfx.play('pips',.7); S.A.air-=airCost(AIR[i]); A.airUsed=1; AIR[i].run(A); $('modal').classList.remove('on'); save(); renderAssault();});
  $('modal-win').querySelector('.close').onclick=closeModal;
}
function aOrderState(i){const o=A_ORDERS[i],A=S.A; if(o.once&&A.once[i])return '已经完成'; if(A.used[i])return '已经有了';
  const r=o.req(); if(r!==true)return r; if(!A.orders&&!A_ORDERS[i].flag)return '没有命令了'; return true;}
function doAOrder(i){if(aOrderState(i)!==true)return; Sfx.play(['burst','thud','phone','crowd','fire','bolt','paper','lose'][i]||'click');const A=S.A; A.used[i]=1; if(A_ORDERS[i].once)A.once[i]=1; if(!A_ORDERS[i].flag)A.orders--;
  A_ORDERS[i].run(); if(screen==='assault'){save();renderAssault();}}
function moveShare(s,d){const A=S.A, sh=A.shares; if(d>0){const o=Object.keys(sh).filter(k=>k!==s&&sh[k]>=10).sort((a,b)=>sh[b]-sh[a])[0];if(!o)return;sh[o]-=10;sh[s]+=10;}
  else{if(sh[s]<10)return;const o=Object.keys(sh).filter(k=>k!==s).sort((a,b)=>sh[a]-sh[b])[0];sh[s]-=10;sh[o]+=10;}
  save();renderAssault();}

function renderAssault(){
  const A=S.A; const F=defForce();
  $('a-time').textContent=dateStr(S.day).toUpperCase()+' '+HOURS[Math.min(A.r,HOURS.length-1)];
  $('a-round').textContent='第 '+(A.r+1)+' / '+HOURS.length+' · 直到天黑';
  const fireL=A.fire>0?Math.round(A.fire/5):0, wndL=A.wnd>=40?Math.min(6,Math.round(A.wnd/80)):0;
  const R=[['ppl','民众',fmt(S.ppl),''],['mil','民兵',fmt(S.mil),A.ammo<=0?'<span class="n">没有弹药</span>':''],
    ['hope','决心',S.hope+'%',[A.fire>0?'火势'+(fireL?' −'+fireL:'')+'':'',A.wnd>=20?'伤员 '+fmt(A.wnd)+(wndL?' −'+wndL:''):''].filter(Boolean).map(x=>'<span class="n">'+x+'</span>').join(' · ')],
    ['stk','补给',fmt(A.stock||0),''],['air','舆论',Math.round(A.air),'<span class="p">+'+airGain()+' 每小时</span>']];
  $('a-res').innerHTML=R.map(([k,nm,v,sub])=>`<div class="r"><div class="k">${nm}</div><div class="v${(k==='hope'&&S.hope<30)?' warn':''}">${v}${sub?` <small style="font-size:13px;font-family:'Tiny5'">${sub}</small>`:''}</div></div>`).join('');
  // section
  const att={entr:0,front:0};for(const u of A.units){const t=UNITS.find(x=>x.id===u.id).target;if(t!=='tower')att[t]+=uEff(u)/3;}
  const unitsN=x=>Math.round(A.shares[x]/100*F/40);
  drawSection($('a-c'),{fac:S.fac,def:{entr:unitsN('entr'),front:unitsN('front'),tower:unitsN('tower')},att,fire:A.fire});
  $('a-status').innerHTML=A.log.slice(0,4).map(l=>`<div class="${l.cls}"><span class="tm">${l.h}</span> ${l.t}</div>`).join('');
  // units
  $('a-units').innerHTML=`<h2>克里姆林宫兵力 <span>损失 ${fmt(kDead(A))} · 你们的 ${fmt(A.lost||0)} · 刻度：战斗中的兵力</span></h2>`+A.units.map(u=>{const U=UNITS.find(x=>x.id===u.id);
    const st=uState(u), m=Math.round(uMorV(u)), dm=u.mor0==null?0:Math.round(m-u.mor0);
    const on=Math.ceil(uEff(u)/50*8);
    const sub=u.cur<=3&&st!=='wait'?`损失 ${fmt(u.lost||0)}${u.why?' · '+u.why:''}`:`损失 ${fmt(u.lost||0)} · 士气 ${m}%`+(dm?` <span class="${dm<0?'p':'n'}">${dm<0?'▼':'▲'}${Math.abs(dm)}${u.why?' '+u.why:''}</span>`:'');
    return `<div class="urow ${st}"><span class="nm">${U.nm}<small>${sub}</small></span><span class="stt">${STANCE_NM[st]}</span><div class="b r" title="当前战斗兵力">${Array.from({length:8},(_,i)=>`<i class="${i<on?'on':''}"></i>`).join('')}</div></div>`;}).join('')+'<div class="uhint">士气 50 以上：前进 · 25–49：半数兵力 · 低于 25：永久退出战斗</div>';
  // sectors
  $('a-sect').innerHTML=`<h2>防御 <span>兵力 ${fmt(F)} · 弹药够用 ${S.mil>0?Math.floor(A.ammo/Math.max(1,Math.round(S.mil/8))):'—'} 小时</span></h2>`+SECTORS.map(s=>{const sh=A.shares[s.id];const c=A.ctl[s.id];
    const pr=s.id==='tower'?`<small class="${sh<10?'n':'p'}">${sh<10?'空：上层有敌方枪手，每小时决心 −2':'狙击手：对两个入口的压力 −'+Math.round(towerCut(A)*100)+'%'}</small>`:(()=>{const {D,A:a}=assaultSector(s.id);const L=A.last&&A.last[s.id];return `<small class="${a>D?'n':'p'}">防御 ${Math.round(D)} 对抗进攻 ${Math.round(a)}：${a>D?'压迫中':'守住'}${L?` · 每小时：我方 −${fmt(L.lost)}，敌方 −${fmt(L.kl)}`:''}</small>`;})();
    return `<div class="srow"><span class="nm">${s.nm}${pr||`<small>${s.sub}</small>`}</span>
      ${c===undefined?'<span></span>':`<div class="ctl"><i style="width:${c}%"></i></div>`}
      <span class="sh"><b data-s="${s.id}" data-d="-1">−</b>${sh}%<b data-s="${s.id}" data-d="1">+</b></span></div>`;}).join('');
  $('a-sect').querySelectorAll('b[data-s]').forEach(b=>b.onclick=()=>moveShare(b.dataset.s,+b.dataset.d));
  // orders
  $('a-orders').innerHTML=`<h2>命令 <span>剩余：${A.orders} · <u id="a-air" style="cursor:pointer;color:#e8a23a">呼吁 [M]${A.airUsed?' ✓':''}</u></span></h2><div class="agrid">`+A_ORDERS.map((o,i)=>{const st=aOrderState(i);
    return `<div class="aact${st!==true?' off':''}" data-i="${i}"><span class="k">${i+1}</span><span class="t">${o.t}</span><span class="cost">${st===true?(typeof o.d==='function'?o.d():o.d):`<span class="risk">${st}</span>`}</span></div>`;}).join('')+'</div>';
  $('a-orders').querySelectorAll('.aact').forEach(e=>e.onclick=()=>doAOrder(+e.dataset.i)); $('a-air').onclick=openAir;
}

// candle flicker on the section screens
setInterval(()=>{secTick++; if(screen==='wh'&&S)drawSection($('w-c'),{fac:S.fac,cordon:S.cordon,calm:S.phase===1,lit:!S.flags.noPower,st:{hope:S.hope,rad:S.rad,ppl:S.ppl,dep:deputies(S),radio:S.flags.radio}});
  else if(screen==='assault'&&S&&S.A){const A=S.A,F=defForce();const att={entr:0,front:0};for(const u of A.units){const t=UNITS.find(x=>x.id===u.id).target;if(t!=='tower')att[t]+=uEff(u)/3;}
    const n=x=>Math.round(A.shares[x]/100*F/40); drawSection($('a-c'),{fac:S.fac,def:{entr:n('entr'),front:n('front'),tower:n('tower')},att,fire:A.fire});}},160);
