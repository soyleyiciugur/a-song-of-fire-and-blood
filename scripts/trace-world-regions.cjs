/* Geography overlay adapted from the user's two reference maps to the existing
 * Known World artwork. The references describe different historical periods:
 * these are geographic areas, not claims about contemporary political control.
 * Control points use a 1850 x 1233 reference (one quarter of the source image).
 * Run: node scripts/trace-world-regions.cjs
 */
const fs = require('node:fs');
const sharp = require('sharp');
const { trace, inside } = require('./trace-map-regions.cjs');
const W=1850,H=1233;
const grid={width:W,height:H,left:0,top:0,scale:4};
const rectangle=(x1,y1,x2,y2)=>[[x1,y1],[x2,y1],[x2,y2],[x1,y2]];
const definitions=[];
const add=(id,name,color,ring,options={})=>definitions.push({id,name,color,ring,rings:[ring],...options});
const addMulti=(id,name,color,rings,options={})=>definitions.push({id,name,color,ring:rings[0],rings,...options});
const regionRings=region=>region.rings||[region.ring];
// Only explicitly coloured territories in the supplied references are included.
// The Free Cities close-up takes precedence. Blank land is intentionally unowned:
// do not add continent/hinterland catch-alls. Coordinates follow the base artwork.
// Small states precede adjoining large regions; islands are coast-clipped.
add('beyond-the-wall','Beyond the Wall','#8b9da6',rectangle(0,0,430,220));
add('ibben','Ibben','#949494',rectangle(1095,255,1330,425));
add('summer-islands','Summer Islands','#f4ce50',rectangle(390,955,645,1233));
add('moraq','Great Moraq','#d5f536',[[1260,933],[1338,938],[1358,984],[1358,1129],[1290,1129],[1262,1060],[1258,1009],[1232,977],[1235,952]]);
add('new-ghis','New Ghis','#ca9295',[[948,888],[978,894],[1000,905],[1042,912],[1066,934],[1048,971],[1020,986],[1020,1010],[950,1010],[950,945],[968,924]]);
add('elyria','Elyria','#4f92b2',rectangle(825,816,851,851));
add('tolos','Tolos','#4f92b2',[[851,803],[884,800],[895,822],[883,843],[852,843]]);
add('mantarys','Mantarys','#c43a94',[[810,797],[824,795],[833,806],[825,817],[812,816],[806,808]]);
add('lys','Lys','#bb438c',[[509,808],[536,808],[536,786],[551,780],[566,790],[580,790],[598,810],[574,820],[548,812],[548,849],[509,849]],{connectAcrossWater:true});
add('tyrosh','Tyrosh','#195b9f',[[469,710],[510,710],[522,731],[539,735],[529,753],[526,780],[509,790],[489,767],[486,757],[469,745]]);
add('lorath','Lorath','#9cbd2d',[[579,462],[638,461],[633,496],[651,504],[662,520],[670,538],[647,529],[623,522],[606,534],[581,543],[577,528],[588,504]]);
add('braavos','Braavos','#8950c0',[[470,430],[580,430],[588,504],[577,528],[581,543],[560,548],[549,543],[530,550],[513,548],[487,567],[460,550]]);
add('pentos','Pentos','#008653',[[488,597],[513,587],[533,580],[553,581],[568,594],[587,610],[596,625],[585,637],[580,657],[568,681],[550,701],[528,711],[499,696],[478,652]]);
add('norvos','Norvos','#edc13f',[[581,543],[606,534],[623,522],[647,529],[670,538],[681,513],[704,504],[714,538],[699,558],[697,584],[683,617],[678,636],[691,650],[682,666],[675,673],[666,655],[646,652],[630,641],[615,636],[602,626],[596,625],[587,610],[568,594],[553,581],[549,560],[549,543],[560,548]]);
add('qohor','Qohor','#ff5963',[[699,558],[727,555],[751,579],[765,610],[754,645],[754,669],[732,681],[709,675],[691,665],[682,666],[691,650],[678,636],[683,617],[697,584]]);
add('myr','Myr','#ee9a3c',[[528,711],[550,701],[568,681],[580,686],[570,703],[575,715],[587,720],[594,741],[598,758],[589,776],[575,765],[564,750],[539,746],[539,735],[550,722]]);
add('volantis','Volantis','#ad394f',[[675,748],[685,761],[689,779],[708,796],[730,801],[751,810],[764,830],[737,843],[710,838],[691,855],[670,851],[648,832],[623,815],[646,802],[651,782],[660,763]]);
add('saath','Saath','#bc9a2a',[[801,492],[827,487],[835,502],[825,512],[806,511]]);
add('morosh','Morosh','#a5bf38',[[837,465],[862,462],[875,479],[859,490],[835,483]]);
add('omber','Omber','#a86e21',[[917,485],[956,478],[978,498],[982,525],[965,542],[940,537],[928,529]]);
add('meereen','Meereen','#885d23',[[944,767],[985,761],[1025,775],[1029,790],[1008,794],[993,790],[974,787],[946,790]]);
add('yunkai','Yunkai','#4ed1a0',[[963,790],[974,787],[993,790],[998,809],[985,834],[980,847],[966,843],[968,822],[959,805]]);
add('astapor','Astapor','#59b9d1',[[924,842],[947,842],[966,843],[980,847],[991,866],[978,881],[952,885],[925,871]]);
add('lhazar','Lhazar','#2c9871',[[1025,775],[1059,772],[1096,767],[1137,770],[1161,785],[1154,810],[1127,832],[1098,840],[1061,823],[1029,790]]);
add('dothraki-sea','Dothraki Sea','#8a63ac',[[751,579],[775,544],[798,507],[835,502],[835,483],[859,490],[875,479],[899,514],[928,529],[940,537],[965,542],[982,525],[978,498],[997,500],[1048,454],[1120,462],[1180,420],[1223,420],[1235,447],[1212,480],[1220,516],[1210,553],[1220,598],[1215,640],[1223,678],[1194,693],[1170,726],[1137,755],[1099,758],[1042,770],[982,759],[934,763],[901,798],[879,785],[854,779],[831,772],[819,753],[800,742],[786,757],[773,780],[760,782],[766,744],[778,711],[775,672],[754,645],[765,610]]);
add('qarth','Qarth and Qarkash','#973c6a',[[1183,901],[1188,888],[1210,881],[1241,884],[1277,878],[1316,892],[1338,904],[1339,930],[1305,940],[1277,934],[1230,943],[1207,929],[1183,929]]);
add('nghai','Nghai','#95674e',[[1607,597],[1637,593],[1660,610],[1659,630],[1635,651],[1614,639],[1603,615]]);
add('jogos-nhai','Plains of the Jogos Nhai','#ffc082',[[1495,519],[1515,510],[1550,542],[1574,557],[1600,590],[1623,594],[1603,615],[1614,639],[1635,651],[1646,706],[1616,748],[1567,737],[1534,715],[1493,710],[1463,690],[1431,671],[1412,641],[1403,616],[1416,604],[1394,586],[1400,567],[1435,580],[1460,572],[1482,550]]);
add('mossovy','Mossovy','#769b20',[[1666,570],[1718,550],[1765,520],[1790,480],[1850,478],[1850,570],[1785,584],[1735,598],[1701,606],[1689,605]]);
add('yi-ti','Yi Ti','#107850',[[1403,800],[1431,764],[1440,740],[1470,727],[1493,710],[1534,715],[1567,737],[1616,748],[1655,778],[1695,795],[1720,832],[1737,875],[1747,918],[1729,958],[1698,995],[1682,1020],[1637,1019],[1596,980],[1535,976],[1507,1019],[1454,1020],[1423,988],[1399,975],[1373,953],[1350,935],[1357,887],[1382,842]]);
add('shadow-lands','Shadow Lands and Asshai','#626666',[[1747,918],[1790,887],[1850,879],[1850,1055],[1795,1100],[1740,1140],[1695,1145],[1635,1178],[1640,1105],[1682,1020],[1698,995],[1729,958]]);

// Valyria is traced from the supplied transparent PNG (valyria.png).
// Mapping: map_x = 700 + png_col * 0.8, map_y = 780 + png_row * 0.8
// The northern lake/river inlet is correctly excluded by following the PNG alpha boundary.
addMulti('valyria','Valyria','#aa2428',[
  // Main body (PNG component 1, 27249 px)
  [[811,812],[826,814],[827,818],[826,821],[823,822],[823,824],[822,825],[823,826],[823,829],[823,830],[821,832],[822,834],[820,835],[818,838],[820,841],[819,844],[822,845],[822,849],[820,853],[821,856],[818,858],[834,860],[841,862],[841,863],[842,864],[842,866],[851,868],[855,870],[857,872],[857,875],[856,877],[857,878],[857,884],[855,886],[855,888],[858,889],[854,891],[852,892],[851,894],[846,896],[846,898],[842,898],[843,901],[848,902],[846,905],[848,906],[846,909],[846,910],[844,911],[845,914],[846,918],[843,922],[843,924],[844,929],[842,930],[847,932],[846,934],[849,937],[849,940],[847,942],[846,943],[846,945],[843,946],[834,947],[832,949],[842,950],[843,952],[842,956],[841,959],[842,961],[848,962],[850,962],[848,965],[846,966],[843,968],[840,970],[842,973],[842,976],[841,979],[838,982],[838,985],[837,986],[838,989],[838,991],[836,993],[836,998],[830,1000],[826,1002],[826,1005],[826,1006],[795,1007],[794,1009],[796,1010],[796,1011],[799,1012],[800,1014],[797,1015],[796,1018],[796,1019],[788,1022],[786,1022],[784,1025],[784,1026],[781,1027],[781,1028],[778,1028],[781,1027],[777,1026],[766,1025],[761,1022],[761,1018],[758,1016],[760,1014],[760,1007],[762,1006],[762,1000],[765,998],[765,992],[730,990],[727,990],[726,986],[725,983],[726,982],[726,979],[723,977],[723,974],[721,974],[720,967],[718,966],[719,963],[719,958],[722,957],[722,954],[722,951],[724,950],[724,946],[730,943],[730,941],[733,940],[733,938],[731,937],[730,934],[733,933],[734,930],[735,926],[730,925],[733,922],[729,922],[729,919],[724,918],[724,916],[726,914],[724,913],[725,909],[723,908],[724,902],[725,898],[726,897],[725,895],[726,894],[725,893],[727,890],[727,885],[729,882],[732,880],[730,878],[732,875],[734,874],[734,872],[739,871],[739,869],[745,866],[742,866],[746,863],[744,862],[748,858],[750,855],[750,853],[752,851],[752,848],[751,845],[763,843],[774,842],[775,838],[778,835],[781,834],[782,830],[782,827],[786,826],[786,824],[792,821],[794,818],[793,817],[795,814],[810,812]],
  // Lower-left island (PNG component 2, 340 px)
  [[713,978],[717,979],[717,982],[720,985],[722,988],[722,990],[721,991],[725,994],[725,996],[725,998],[729,999],[730,1002],[729,1004],[730,1006],[727,1009],[726,1010],[722,1007],[723,1006],[724,1001],[722,1000],[722,998],[718,994],[714,992],[714,990],[713,988],[715,986],[714,983],[710,981],[713,979]],
  // Small lower island (PNG component 3, 310 px)
  [[745,970],[746,972],[746,976],[747,978],[746,979],[745,981],[746,982],[746,988],[745,989],[742,991],[743,994],[742,998],[742,1000],[740,1000],[740,994],[738,992],[738,989],[738,986],[738,983],[739,981],[740,977],[738,974],[741,971],[744,970]],
  // Western mid island (PNG component 4, 306 px)
  [[715,910],[714,913],[715,916],[714,920],[719,922],[719,924],[722,925],[722,926],[720,927],[720,930],[722,931],[717,934],[715,935],[715,938],[714,939],[714,943],[713,944],[712,944],[711,939],[713,936],[712,931],[713,929],[713,926],[710,925],[710,922],[711,921],[710,916],[711,911],[714,910]],
  // Bottom-center island (PNG component 5, 214 px)
  [[804,1010],[806,1013],[806,1015],[806,1018],[807,1020],[805,1022],[806,1025],[807,1026],[806,1030],[808,1030],[806,1033],[803,1030],[792,1030],[794,1027],[794,1025],[796,1022],[798,1021],[802,1020],[802,1017],[802,1014],[803,1013],[802,1010]],
  // Eastern island (PNG component 6, 119 px)
  [[870,920],[867,922],[865,923],[862,926],[861,929],[861,931],[859,934],[858,934],[858,933],[858,930],[857,929],[858,927],[851,926],[853,925],[861,924],[866,920]],
  // Small central island (PNG component 7, 59 px)
  [[798,996],[799,997],[800,999],[803,1002],[803,1003],[801,1004],[800,1004],[800,1003],[798,1001],[795,999],[797,998],[796,996]]
],{clipToLand:false});

// Sothoryos follows the Known World coastline. solidify fills the dark jungle interior.
// solidifyPasses is increased to 8 to close larger jungle gaps across the territory.
add('sothoryos','Sothoryos','#72916c',[[820,1233],[820,1162],[854,1129],[919,1130],[950,1106],[993,1121],[1020,1113],[1080,1108],[1111,1081],[1183,1072],[1203,1097],[1174,1149],[1167,1233]],{solidify:true,solidifyPasses:8});

// Ulthos is traced from the supplied WebP (ulthos.webp).
// Mapping: map_x = 1586 + png_col * 0.737, map_y = 1086 + png_row * 0.767
// Calibrated against the existing island ring centres.
// The main continent continues through the map's bottom/right crop;
// those edges terminate at W/H intentionally.
addMulti('ulthos','Ulthos','#9c8768',[
  // Main continent body (PNG component 1) + map edge closure
  [[1842,1131],[1843,1214],[1839,1218],[1832,1224],[1850,1224],[1850,1233],[1593,1233],[1600,1224],[1609,1221],[1614,1219],[1616,1216],[1617,1214],[1623,1213],[1623,1209],[1626,1208],[1627,1205],[1631,1203],[1635,1198],[1631,1197],[1631,1194],[1633,1191],[1634,1190],[1648,1189],[1651,1185],[1651,1181],[1660,1179],[1662,1178],[1670,1177],[1676,1175],[1679,1173],[1695,1171],[1697,1169],[1704,1167],[1759,1166],[1760,1165],[1762,1163],[1780,1161],[1783,1160],[1784,1158],[1788,1156],[1794,1155],[1796,1153],[1796,1151],[1799,1149],[1799,1147],[1799,1145],[1799,1142],[1800,1140],[1835,1138],[1836,1137],[1840,1136],[1843,1132]],
  // Northern island (PNG component 2, 1079 px)
  [[1815,1096],[1824,1099],[1831,1100],[1831,1102],[1835,1102],[1837,1105],[1834,1106],[1833,1109],[1831,1110],[1830,1112],[1831,1115],[1833,1117],[1833,1119],[1832,1119],[1832,1122],[1830,1123],[1830,1125],[1827,1126],[1814,1128],[1812,1128],[1811,1127],[1812,1125],[1812,1122],[1809,1119],[1810,1118],[1811,1116],[1811,1114],[1814,1112],[1813,1109],[1816,1108],[1810,1105],[1810,1104],[1809,1102],[1811,1100],[1812,1097],[1814,1096]],
  // Western island (PNG component 3, 348 px)
  [[1785,1137],[1788,1138],[1784,1141],[1784,1143],[1777,1145],[1777,1147],[1766,1149],[1766,1151],[1763,1152],[1763,1153],[1760,1153],[1761,1152],[1760,1149],[1763,1147],[1763,1144],[1766,1142],[1767,1140],[1775,1139],[1777,1138],[1784,1137]]
],{clipToLand:false});

// Fill only enclosed holes of a selected continent, never open coastal bays.
function fillInterior(mask) {
 const exterior=new Uint8Array(W*H),queue=new Int32Array(W*H);
 let head=0,tail=0;
 const seed=p=>{if(!mask[p]&&!exterior[p]){exterior[p]=1;queue[tail++]=p;}};
 for(let x=0;x<W;x++){seed(x);seed((H-1)*W+x);}
 for(let y=0;y<H;y++){seed(y*W);seed(y*W+W-1);}
 while(head<tail){const p=queue[head++],x=p%W,y=Math.floor(p/W);
   if(x)seed(p-1);if(x<W-1)seed(p+1);if(y)seed(p-W);if(y<H-1)seed(p+W);
 }
 for(let i=0;i<mask.length;i++)if(!exterior[i])mask[i]=1;
}

// Close narrow holes/corridors caused by dark terrain being mistaken for water.
// passes is configurable per region (default 2, Sothoryos uses 8).
function dilate4(mask,passes=2){
 let src=mask;
 for(let pass=0;pass<passes;pass++){
   const out=src.slice();
   for(let y=0;y<H;y++)for(let x=0;x<W;x++){
     const i=y*W+x;
     if(src[i]||(x&&src[i-1])||(x<W-1&&src[i+1])||(y&&src[i-W])||(y<H-1&&src[i+W]))out[i]=1;
   }
   src=out;
 }
 return src;
}
function erode4(mask,passes=2){
 let src=mask;
 for(let pass=0;pass<passes;pass++){
   const out=src.slice();
   for(let y=0;y<H;y++)for(let x=0;x<W;x++){
     const i=y*W+x;
     if(!src[i]||(x&&!src[i-1])||(x<W-1&&!src[i+1])||(y&&!src[i-W])||(y<H-1&&!src[i+W]))out[i]=0;
   }
   src=out;
 }
 return src;
}
function solidifyInterior(mask,passes=2){
 const closed=erode4(dilate4(mask,passes),passes);
 mask.set(closed);
 fillInterior(mask);
}

async function main(){
 const {data}=await sharp('public/images/map/known-world.webp').resize(W,H).removeAlpha().raw().toBuffer({resolveWithObject:true});
 const west=JSON.parse(fs.readFileSync('data/map/region-geometry.json','utf8'));
 const westernMask=await sharp(Buffer.from(`<svg width="${W}" height="${H}" viewBox="0 0 7400 4932" xmlns="http://www.w3.org/2000/svg">${west.regions.map(r=>`<path d="${r.path}" fill="white"/>`).join('')}</svg>`)).ensureAlpha().raw().toBuffer();
 const land=new Uint8Array(W*H);
 for(let i=0;i<land.length;i++){
   const r=data[i*3],g=data[i*3+1],b=data[i*3+2];
   land[i]=(!(b>r*1.025&&b>g*.98)||(r>180&&Math.max(r,g,b)-Math.min(r,g,b)<35))&&(r+g+b)>130?1:0;
 }
 function components(value,visit){
   const seen=new Uint8Array(W*H),q=new Int32Array(W*H);
   for(let i=0;i<land.length;i++){
     if(seen[i]||land[i]!==value)continue;
     let start=0,end=1,edge=false;q[0]=i;seen[i]=1;
     while(start<end){const p=q[start++],x=p%W,y=Math.floor(p/W);if(!x||!y||x===W-1||y===H-1)edge=true;
       for(const n of [x?p-1:-1,x<W-1?p+1:-1,y?p-W:-1,y<H-1?p+W:-1])if(n>=0&&!seen[n]&&land[n]===value){seen[n]=1;q[end++]=n;}
     }visit(q.subarray(0,end),edge);
   }
 }
 components(1,pixels=>{if(pixels.length<14)for(const p of pixels)land[p]=0;});
 components(0,(pixels,edge)=>{if(!edge&&pixels.length<1500)for(const p of pixels)land[p]=1;});
 const owners=new Int8Array(W*H).fill(-1);
 const bounds=definitions.map(r=>{
   const points=regionRings(r).flat();
   return{minX:Math.min(...points.map(p=>p[0])),maxX:Math.max(...points.map(p=>p[0])),minY:Math.min(...points.map(p=>p[1])),maxY:Math.max(...points.map(p=>p[1]))};
 });
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
   const i=y*W+x;if(westernMask[i*4+3]>0)continue;
   for(let j=0;j<definitions.length;j++){
     const region=definitions[j],a=bounds[j];
     if(x<a.minX||x>a.maxX||y<a.minY||y>a.maxY)continue;
     if(region.clipToLand!==false&&!land[i])continue;
     if(regionRings(region).some(ring=>inside(x+.5,y+.5,ring))){owners[i]=j;break;}
   }
 }
 const lysIndex=definitions.findIndex(r=>r.id==='lys');
 if(lysIndex>=0){
   const lys=definitions[lysIndex];
   const ring=lys.ring;
   const minX=Math.floor(Math.min(...ring.map(p=>p[0]))),maxX=Math.ceil(Math.max(...ring.map(p=>p[0])));
   const minY=Math.floor(Math.min(...ring.map(p=>p[1]))),maxY=Math.ceil(Math.max(...ring.map(p=>p[1])));
   for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
     if(inside(x+.5,y+.5,ring)) owners[y*W+x]=lysIndex;
   }
 }

 const valyriaIndex=definitions.findIndex(r=>r.id==='valyria');
 const elyriaIndex=definitions.findIndex(r=>r.id==='elyria');
 for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){
   const i=y*W+x;if(owners[i]!==valyriaIndex)continue;
   if([-W-1,-W,-W+1,-1,1,W-1,W,W+1].some(d=>owners[i+d]===elyriaIndex))owners[i]=-1;
 }
 const junctions=new Set(),owner=(x,y)=>x<0||y<0||x>=W||y>=H?-1:owners[y*W+x];
 for(let y=0;y<=H;y++)for(let x=0;x<=W;x++)if(new Set([owner(x-1,y-1),owner(x,y-1),owner(x-1,y),owner(x,y)]).size>2)junctions.add(y*(W+1)+x);
 const regions=definitions.map((r,index)=>{
   const mask=new Uint8Array(W*H);for(let i=0;i<mask.length;i++)mask[i]=owners[i]===index?1:0;
   if(r.solidify)solidifyInterior(mask,r.solidifyPasses||2);
   return{id:r.id,name:r.name,color:r.color,path:trace(mask,junctions,grid)};
 }).filter(r=>r.path);
 fs.writeFileSync('data/map/world-region-geometry.json',JSON.stringify({width:7400,height:4932,regions},null,2)+'\n');
 const paths=[...west.regions,...regions].map(r=>`<path d="${r.path}" fill="${r.color}" fill-opacity=".25" stroke="${r.color}" stroke-width="2"/>`).join('');
 const composite=await sharp('public/images/map/known-world.webp').composite([{input:Buffer.from(`<svg width="7400" height="4932" xmlns="http://www.w3.org/2000/svg">${paths}</svg>`)}]).jpeg({quality:85}).toBuffer();
 await sharp(composite).resize(W).toFile('.tmp/world-regions-preview.jpg');
 console.log(`${regions.length} world regions; ${regions.reduce((n,r)=>n+r.path.length,0)} path characters; existing Westeros data unchanged.`);
}
if(require.main===module)main().catch(e=>{console.error(e);process.exit(1);});
module.exports={definitions};
