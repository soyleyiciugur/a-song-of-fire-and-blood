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
const add=(id,name,color,ring)=>definitions.push({id,name,color,ring});
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
add('lys','Lys','#bb438c',rectangle(509,808,548,849));
add('lys-coast','Lys — coastal territory','#bb438c',[[536,786],[551,780],[566,790],[580,790],[598,810],[574,820],[544,807]]);
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
 const owners=new Int8Array(W*H).fill(-1);
 const bounds=definitions.map(r=>({minX:Math.min(...r.ring.map(p=>p[0])),maxX:Math.max(...r.ring.map(p=>p[0])),minY:Math.min(...r.ring.map(p=>p[1])),maxY:Math.max(...r.ring.map(p=>p[1]))}));
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
   const i=y*W+x;if(!land[i]||westernMask[i*4+3]>0)continue;
   for(let j=0;j<definitions.length;j++){
     const a=bounds[j];if(x<a.minX||x>a.maxX||y<a.minY||y>a.maxY)continue;
     if(inside(x+.5,y+.5,definitions[j].ring)){owners[i]=j;break;}
   }
 }
 const junctions=new Set(),owner=(x,y)=>x<0||y<0||x>=W||y>=H?-1:owners[y*W+x];
 for(let y=0;y<=H;y++)for(let x=0;x<=W;x++)if(new Set([owner(x-1,y-1),owner(x,y-1),owner(x-1,y),owner(x,y)]).size>2)junctions.add(y*(W+1)+x);
 const regions=definitions.map((r,index)=>{
   const mask=new Uint8Array(W*H);for(let i=0;i<mask.length;i++)mask[i]=owners[i]===index?1:0;
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
