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
addMulti('lys','Lys','#bb438c',[
  rectangle(509,808,548,849),
  [[536,786],[551,780],[566,790],[580,790],[598,810],[574,820],[544,807]]
]);
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

// Explicit additions requested after the coloured-territory reference pass.
// Valyria is traced from the supplied transparent PNG rather than inferred from
// terrain colour. This keeps the northern lake/river OUT of Valyria and retains
// the small western/southern/eastern fragments shown in the annotated reference.
add('valyria','Valyria','#aa2428',[[810,814],[819,814],[819,822],[825,834],[829,847],[845,850],[863,858],[871,873],[865,890],[870,913],[872,939],[859,978],[830,1020],[772,1020],[741,996],[723,976],[721,951],[728,927],[725,911],[724,888],[736,870],[751,860],[765,851],[778,837],[792,829],[799,818]]);

// Sothoryos still follows the Known World coastline, but its dark jungle must not
// punch holes through the region. `solidify` closes only narrow classifier gaps
// before filling the resulting interior, while open coastal water remains outside.
add('sothoryos','Sothoryos','#72916c',[[820,1233],[820,1162],[854,1129],[919,1130],[950,1106],[993,1121],[1020,1113],[1080,1108],[1111,1081],[1183,1072],[1203,1097],[1174,1149],[1167,1233]],{solidify:true});

// Ulthos is traced from the supplied WebP: the full south-eastern landmass plus
// the two detached islands. The mainland continues through the map's bottom/right
// crop, so those edges intentionally terminate at W/H.
addMulti('ulthos','Ulthos','#9c8768',[
  [[1850,1084],[1850,1233],[1593,1233],[1593,1226],[1604,1223],[1609,1216],[1616,1217],[1617,1210],[1621,1206],[1624,1208],[1625,1203],[1629,1200],[1625,1198],[1626,1194],[1629,1191],[1632,1194],[1640,1193],[1645,1189],[1647,1182],[1649,1185],[1652,1185],[1657,1179],[1666,1179],[1684,1173],[1691,1174],[1700,1168],[1704,1172],[1714,1170],[1720,1174],[1735,1174],[1738,1171],[1744,1172],[1746,1176],[1754,1174],[1765,1163],[1781,1163],[1791,1156],[1798,1156],[1804,1148],[1803,1142],[1805,1140],[1811,1145],[1824,1145],[1835,1139],[1837,1141],[1842,1137],[1847,1137],[1849,1134],[1850,1134]],
  [[1817,1097],[1816,1101],[1813,1102],[1821,1108],[1818,1109],[1819,1112],[1814,1119],[1817,1122],[1816,1127],[1823,1125],[1832,1127],[1839,1118],[1835,1112],[1842,1104],[1837,1100]],
  [[1791,1138],[1770,1140],[1765,1144],[1763,1153],[1769,1148],[1776,1148],[1786,1144]]
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
// A small 4-neighbour diamond is deliberately conservative at real coastlines.
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
function solidifyInterior(mask){
 const closed=erode4(dilate4(mask,2),2);
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
 // Connected components remove offshore lettering. Fill enclosed terrain-colour
 // holes, but retain open bays and large lakes. This is an offline operation.
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
 const originalLand=land.slice();
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
     // Preserve the northern Valyrian lake/river as water.
     if(region.id==='valyria'&&y<850&&!originalLand[i])continue;
     if(regionRings(region).some(ring=>inside(x+.5,y+.5,ring))){owners[i]=j;break;}
   }
 }
 // Leave a one-grid-pixel separation at Elyria so curve smoothing cannot
 // bleed Valyria into the island's independent territory.
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
   if(r.solidify)solidifyInterior(mask);
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
