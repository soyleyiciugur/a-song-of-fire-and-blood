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
// The latest coloured western-Essos border reference takes precedence here.
// Existing colours are retained; blank land is intentionally unowned:
// do not add continent/hinterland catch-alls. Coordinates follow the base artwork.
// Small states precede adjoining large regions; islands are coast-clipped.
add('beyond-the-wall','Beyond the Wall','#8b9da6',rectangle(0,0,430,220),{solidify:true});
add('ibben','Ibben','#949494',rectangle(1095,255,1330,425));
add('summer-islands','Summer Islands','#f4ce50',rectangle(390,955,645,1233));
add('moraq','Great Moraq','#d5f536',[[1260,933],[1338,938],[1358,984],[1358,1129],[1290,1129],[1262,1060],[1258,1009],[1232,977],[1235,952]]);
add('new-ghis','New Ghis','#ca9295',[[946,885],[963,892],[976,904],[993,908],[1011,917],[1034,914],[1049,925],[1054,945],[1046,961],[1024,968],[1005,957],[1009,986],[1010,1007],[966,1007],[956,973],[962,948],[953,933],[948,915]]);
add('elyria','Elyria','#4f92b2',[[833,824],[845,823],[848,833],[845,842],[832,843],[829,832]]);
add('tolos','Tolos','#4f92b2',[[860,821],[867,817],[875,819],[875,829],[869,835],[859,834]]);
add('mantarys','Mantarys','#c43a94',[[795,809],[804,802],[819,798],[828,800],[828,807],[819,810],[810,815],[798,817]]);
addMulti('lys','Lys','#bb438c',[rectangle(514,809,540,845),[[536,788],[545,789],[553,794],[558,800],[558,804],[551,803],[547,797],[539,794]]]);
addMulti('tyrosh','Tyrosh','#195b9f',[
  [[475,721],[485,718],[497,720],[501,729],[496,738],[486,742],[476,735]],
  [[499,731],[518,729],[536,737],[528,754],[526,780],[509,790],[493,769],[487,754]]
]);
addMulti('lorath','Lorath','#9cbd2d',[[[584,466],[616,466],[626,484],[612,497],[584,491]],[[579,520],[595,511],[612,510],[633,500],[636,507],[623,515],[607,521],[592,524],[580,532]]]);
add('braavos','Braavos','#8950c0',[[501,440],[581,440],[584,482],[580,502],[585,516],[576,531],[565,534],[558,548],[542,552],[532,551],[525,559],[492,567],[478,558]]);
add('pentos','Pentos','#008653',[[490,594],[508,590],[526,581],[541,579],[554,587],[565,594],[576,600],[585,614],[584,625],[578,637],[560,644],[539,640],[521,647],[507,640],[490,627]]);
add('norvos','Norvos','#edc13f',[[558,548],[576,539],[597,534],[616,527],[634,530],[659,528],[666,526],[662,539],[660,553],[664,567],[673,580],[677,592],[674,608],[666,620],[654,631],[640,638],[627,638],[613,635],[604,625],[595,620],[585,614],[576,600],[565,594],[554,587],[548,575],[544,564],[542,552]]);
add('qohor','Qohor','#ff5963',[[704,574],[716,561],[730,548],[752,540],[766,550],[775,570],[777,588],[773,611],[777,628],[767,651],[755,658],[735,657],[719,655],[699,656],[688,650],[695,635],[697,616],[698,596]]);
add('myr','Myr','#ee9a3c',[[553,707],[565,711],[571,720],[572,731],[566,740],[557,747],[548,742],[550,731],[557,720]]);
add('volantis','Volantis','#ad394f',[[674,746],[683,748],[683,760],[679,771],[684,782],[683,795],[690,806],[708,808],[722,806],[733,813],[754,813],[761,821],[756,831],[737,835],[716,831],[708,836],[701,850],[684,851],[671,841],[658,836],[638,823],[622,820],[641,814],[657,804],[667,791],[667,778],[663,765],[666,753]]);
add('saath','Saath','#bc9a2a',[[801,492],[827,487],[835,502],[825,512],[806,511]]);
add('morosh','Morosh','#a5bf38',[[837,465],[862,462],[875,479],[859,490],[835,483]]);
add('omber','Omber','#a86e21',[[917,485],[939,478],[960,481],[975,490],[979,504],[990,515],[987,532],[977,539],[963,533],[951,525],[938,524],[926,516],[913,509]]);
add('meereen','Meereen','#885d23',[[986,768],[998,765],[1013,771],[1018,781],[1010,789],[1000,789],[991,783],[983,779]]);
add('yunkai','Yunkai','#4ed1a0',[[965,794],[976,790],[984,793],[985,805],[980,817],[970,821],[963,817],[965,807],[960,801]]);
add('astapor','Astapor','#59b9d1',[[942,853],[951,852],[961,858],[964,865],[956,868],[947,863]]);
add('lhazar','Lhazar','#2c9871',[[1013,771],[1028,768],[1046,765],[1060,764],[1084,756],[1105,756],[1127,748],[1148,746],[1154,753],[1148,773],[1153,787],[1141,801],[1130,812],[1121,829],[1107,835],[1090,831],[1077,820],[1070,806],[1056,798],[1044,785],[1025,782],[1018,781]]);
add('dothraki-sea','Dothraki Sea','#8a63ac',[[766,550],[775,534],[791,520],[804,514],[806,507],[825,512],[835,502],[835,483],[859,490],[875,479],[885,492],[894,514],[913,509],[926,516],[938,524],[951,525],[963,533],[977,539],[987,532],[997,525],[1000,509],[1015,512],[1032,530],[1055,526],[1080,515],[1110,510],[1141,508],[1170,502],[1200,494],[1220,498],[1212,530],[1210,553],[1220,598],[1215,640],[1223,678],[1194,693],[1170,726],[1148,746],[1127,748],[1105,756],[1084,756],[1060,764],[1046,765],[1028,768],[1013,771],[998,765],[986,768],[975,779],[963,782],[952,786],[946,778],[953,761],[952,750],[940,742],[916,740],[890,736],[866,733],[845,736],[823,734],[804,737],[788,728],[776,717],[770,703],[756,692],[751,678],[755,658],[767,651],[777,628],[773,611],[777,588],[775,570]]);
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
add('sothoryos','Sothoryos','#72916c',[[820,1233],[820,1162],[854,1129],[919,1130],[950,1106],[993,1121],[1020,1113],[1080,1108],[1111,1081],[1183,1072],[1203,1097],[1174,1149],[1190,1180],[1210,1233]],{solidify:true});

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
 // The continent continues beyond the artwork. Seal the cropped bottom edge
 // before flood filling so dark interior terrain cannot leak to the exterior.
 const bottom=(H-1)*W;
 let first=-1,last=-1;
 for(let x=0;x<W;x++)if(mask[bottom+x]){if(first<0)first=x;last=x;}
 if(first>=0)for(let x=first;x<=last;x++)mask[bottom+x]=1;
 fillInterior(mask);
}

async function main(){
 // Pixel registration against the matching terrain in the supplied PNG.
 // Its alpha, not a guessed land-colour threshold, defines Valyria's coverage.
 const valyriaReference=await sharp('data/map/valyria-reference.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const valyriaPlacement={x:720.9,y:782.9,scale:0.725};
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
 const referenceIndex=definitions.findIndex(r=>r.id==='valyria');
 bounds[referenceIndex]={minX:720,maxX:883,minY:782,maxY:1020};
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
   const i=y*W+x;if(westernMask[i*4+3]>0)continue;
   for(let j=0;j<definitions.length;j++){
     const region=definitions[j],a=bounds[j];
     if(x<a.minX||x>a.maxX||y<a.minY||y>a.maxY)continue;
     if(region.id==='valyria'){
       const px=Math.floor((x+.5-valyriaPlacement.x)/valyriaPlacement.scale);
       const py=Math.floor((y+.5-valyriaPlacement.y)/valyriaPlacement.scale);
       if(px>=0&&py>=0&&px<valyriaReference.info.width&&py<valyriaReference.info.height&&valyriaReference.data[(py*valyriaReference.info.width+px)*4+3]>=128)owners[i]=j;
       if(owners[i]===j)break;
       continue;
     }
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
 // Crop edges must be straight, not rounded into the land by midpoint curves.
 for(let x=0;x<=W;x++){junctions.add(x);junctions.add(H*(W+1)+x);}
 for(let y=0;y<=H;y++){junctions.add(y*(W+1));junctions.add(y*(W+1)+W);}
 const regions=definitions.map((r,index)=>{
   const mask=new Uint8Array(W*H);for(let i=0;i<mask.length;i++)mask[i]=owners[i]===index?1:0;
   if(r.solidify)solidifyInterior(mask);
   // Northern forest and mountain shadows are land, not holes. Filling those
   // interiors must still respect the Wall and existing northern territories.
   if(r.id==='beyond-the-wall'){
     const excluded=new Uint8Array(W*H);
     for(let i=0;i<excluded.length;i++)excluded[i]=westernMask[i*4+3]>0?1:0;
     const safeBoundary=dilate4(excluded,1);
     for(let i=0;i<mask.length;i++)if(safeBoundary[i])mask[i]=0;
   }
   return{id:r.id,name:r.name,color:r.color,group:r.group||r.id,path:trace(mask,junctions,grid)};
 }).filter(r=>r.path);
 fs.writeFileSync('data/map/world-region-geometry.json',JSON.stringify({width:7400,height:4932,regions},null,2)+'\n');
 const paths=[...west.regions,...regions].map(r=>`<path d="${r.path}" fill="${r.color}" fill-opacity=".25" stroke="${r.color}" stroke-width="2"/>`).join('');
 const composite=await sharp('public/images/map/known-world.webp').composite([{input:Buffer.from(`<svg width="7400" height="4932" xmlns="http://www.w3.org/2000/svg">${paths}</svg>`)}]).jpeg({quality:85}).toBuffer();
 await sharp(composite).resize(W).toFile('.tmp/world-regions-preview.jpg');
 console.log(`${regions.length} world regions; ${regions.reduce((n,r)=>n+r.path.length,0)} path characters; existing Westeros data unchanged.`);
}
if(require.main===module)main().catch(e=>{console.error(e);process.exit(1);});
module.exports={definitions};
