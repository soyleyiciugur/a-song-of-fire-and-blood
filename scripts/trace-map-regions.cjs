/* Offline geometry authoring for the existing 7400 x 4932 Known World artwork.
 * Run: node scripts/trace-map-regions.cjs
 * The browser only consumes the resulting vector paths; it never segments pixels.
 * Coastlines come from this artwork, internal borders are editorial control points.
 * Reference geography: https://awoiaf.westeros.org/index.php/Regions_of_Westeros
 */
const fs = require('node:fs');
const sharp = require('sharp');
const crop = { left: 180, top: 500, width: 1750, height: 2880 };
const W = 875, H = 1440;
// Control points use the 800px-wide reference crop, not viewport coordinates.
const reference = { left: 420, top: 650, width: 1510 };
const refScale = 800 / 755;
const northEdge = [[0,630],[253,630],[275,634],[293,641],[314,639],[335,644],[359,632],[380,624],[421,621],[800,621]];
const valeEdge = [[421,621],[410,643],[407,665],[414,685],[430,702],[438,723],[450,742],[457,764],[467,784],[476,799],[489,813],[514,825],[535,834],[548,851],[800,851]];
const westRiverEdge = [[170,774],[192,783],[213,794],[227,809],[241,823],[251,842],[267,854],[290,863],[310,876],[319,891],[331,910],[352,924]];
const riverReachEdge = [[352,924],[381,926],[410,934],[438,937],[472,937]];
const westReachEdge = [[0,1015],[135,1015],[165,1000],[191,998],[222,1004],[250,999],[276,986],[295,966],[314,949],[333,934],[352,924]];
const crownRiverEdge = [[548,851],[534,854],[522,851],[511,858],[502,874],[502,896],[491,914],[481,927],[472,937]];
const crownReachEdge = [[472,937],[472,956],[459,973],[464,989],[479,1007],[494,1020],[509,1036]];
const crownStormEdge = [[509,1036],[534,1047],[557,1054],[583,1052],[602,1045],[626,1042],[658,1033],[800,1033]];
// The Marches extend southwest towards the Prince's Pass. Ashford stays in
// the Reach; the Red Watch / Slayne range and Cape Wrath stay in Stormlands.
// https://atlasoficeandfireblog.wordpress.com/2017/02/25/geographic-map-12-the-stormlands/
const reachStormEdge = [[509,1036],[500,1060],[500,1085],[491,1105],[485,1125],[472,1147],[450,1160],[422,1165],[395,1177],[368,1184],[343,1190],[320,1200],[307,1220]];
const dorneReachEdge = [[0,1446],[220,1446],[223,1364],[241,1340],[252,1318],[259,1297],[266,1275],[271,1253],[282,1233],[307,1220]];
const dorneStormEdge = [[307,1220],[340,1216],[372,1213],[401,1201],[425,1192],[449,1189],[473,1200],[486,1214],[473,1232],[465,1250],[490,1270],[600,1270],[800,1270]];
const dorneEdge = [...dorneReachEdge,...dorneStormEdge.slice(1)];
const reverse = a => [...a].reverse();
const regions = [
  { id:'the-north', name:'The North', house:'stark', label:[405,365], size:105,
    ring:[[0,110],[300,110],[300,80],[360,65],[389,56],[418,45],[446,35],[475,38],[506,36],[533,36],[560,34],[800,34],[800,530],[470,530],[465,594],...reverse(northEdge.slice(0,-1))] },
  { id:'iron-islands', name:'The Iron Islands', house:'greyjoy', label:[116,697], size:66,
    ring:[[-140,650],[242,650],[242,771],[-140,771]] },
  { id:'the-vale', name:'The Vale', house:'arryn', label:[600,726], size:86,
    ring:[...valeEdge,[800,540],[421,540]] },
  { id:'the-riverlands', name:'The Riverlands', house:'tully', label:[365,765], size:76,
    ring:[...northEdge.slice(0,-1),...valeEdge.slice(1,-1),...crownRiverEdge.slice(1),...reverse(riverReachEdge).slice(1),...reverse(westRiverEdge).slice(1),[0,774]] },
  { id:'the-westerlands', name:'The Westerlands', house:'lannister', label:[226,928], size:101,
    ring:[[0,771],...westRiverEdge,...reverse(westReachEdge).slice(1)] },
  { id:'the-crownlands', name:'The Crownlands', house:'targaryen', label:[555,936], size:70,
    ring:[...crownRiverEdge,...crownReachEdge.slice(1),...crownStormEdge.slice(1),[800,851]] },
  { id:'the-stormlands', name:'The Stormlands', house:'baratheon', label:[571,1164], size:94,
    ring:[...crownStormEdge,...reverse(dorneStormEdge),...reverse(reachStormEdge).slice(1)] },
  { id:'dorne', name:'Dorne', house:'martell', label:[452,1355], size:89,
    ring:[...dorneEdge,[800,1447],[0,1447]] },
  { id:'the-reach', name:'The Reach', house:'tyrell', label:[300,1100], size:92,
    ring:[...westReachEdge,...riverReachEdge.slice(1),...crownReachEdge.slice(1),...reachStormEdge.slice(1),...reverse(dorneReachEdge).slice(1)] },
];
function inside(x,y,ring) {
  let hit=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++) {
    const [ax,ay]=ring[i], [bx,by]=ring[j];
    if((ay>y)!==(by>y) && x<(bx-ax)*(y-ay)/(by-ay)+ax) hit=!hit;
  }
  return hit;
}
// Remove tiny isolated texture fragments and close enclosed water-coloured
// holes (terrain shadows, lettering, narrow rivers). Open bays remain water.
function components(mask, value, visit) {
  const seen=new Uint8Array(W*H), queue=new Int32Array(W*H);
  for(let i=0;i<mask.length;i++) {
    if(seen[i]||mask[i]!==value) continue;
    let start=0,end=1,edge=false; queue[0]=i; seen[i]=1;
    while(start<end) {
      const p=queue[start++], x=p%W,y=Math.floor(p/W);
      if(!x||!y||x===W-1||y===H-1) edge=true;
      for(const q of [x? p-1:-1,x<W-1?p+1:-1,y?p-W:-1,y<H-1?p+W:-1]) {
        if(q<0||seen[q]||mask[q]!==value) continue;
        seen[q]=1;queue[end++]=q;
      }
    }
    visit(queue.subarray(0,end),edge);
  }
}
function simplify(points, tolerance=.8) {
  if(points.length<3) return points;
  const a=points[0],b=points.at(-1);let max=0,index=0;
  for(let i=1;i<points.length-1;i++) {
    const p=points[i],dx=b[0]-a[0],dy=b[1]-a[1];
    const t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1)));
    const d=Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);
    if(d>max) {max=d;index=i;}
  }
  return max>tolerance ? [...simplify(points.slice(0,index+1),tolerance).slice(0,-1),...simplify(points.slice(index),tolerance)] : [a,b];
}
// Every neighbouring pair uses identical canonical arcs, simplified once in
// the same direction. Quadratic midpoints smooth the coastline without
// independently rounding shared borders into gaps or overlapping fills.
const defaultGrid = { width: W, height: H, left: crop.left, top: crop.top, scale: 2 };
function smoothArc(points, grid = defaultGrid) {
  const key=p=>p[1]*(grid.width+1)+p[0];
  const backwards=key(points[0])>key(points.at(-1));
  let pts=simplify(backwards?[...points].reverse():points,1.3);
  if(backwards)pts=pts.reverse();
  const xy=([x,y])=>`${grid.left+x*grid.scale},${grid.top+y*grid.scale}`;
  const mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
  if(pts.length===2)return 'L'+xy(pts[1]);
  let d='L'+xy(mid(pts[0],pts[1]));
  for(let i=1;i<pts.length-1;i++)d+='Q'+xy(pts[i])+' '+xy(mid(pts[i],pts[i+1]));
  return d+'L'+xy(pts.at(-1));
}
function trace(mask, junctions, grid = defaultGrid) {
  const { width: W, height: H, left, top, scale } = grid;
  const edges=new Map();
  const add=(a,b)=>{if(!edges.has(a))edges.set(a,[]);edges.get(a).push(b);};
  const stride=W+1;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++) {
    const i=y*W+x;if(!mask[i])continue;
    const a=y*stride+x,b=a+1,c=a+stride,d=c+1;
    if(!y||!mask[i-W])add(a,b);
    if(x===W-1||!mask[i+1])add(b,d);
    if(y===H-1||!mask[i+W])add(d,c);
    if(!x||!mask[i-1])add(c,a);
  }
  const loops=[];
  while(edges.size) {
    const start=edges.keys().next().value;let p=start;const pts=[];
    do {
      pts.push([p%stride,Math.floor(p/stride)]);
      const next=edges.get(p);if(!next)throw Error('Unclosed boundary');
      const q=next.pop();if(!next.length)edges.delete(p);p=q;
    }while(p!==start);
    if(pts.length<8)continue;
    const cuts=pts.flatMap((p,i)=>junctions.has(p[1]*stride+p[0])?[i]:[]);
    let d;
    if(!cuts.length) {
      pts.push(pts[0]);
      d=`M${left+pts[0][0]*scale},${top+pts[0][1]*scale}`+smoothArc(pts, grid);
    } else {
      const rotated=[...pts.slice(cuts[0]),...pts.slice(0,cuts[0])];
      rotated.push(rotated[0]);
      d=`M${left+rotated[0][0]*scale},${top+rotated[0][1]*scale}`;
      let start=0;
      for(let i=1;i<rotated.length;i++)if(junctions.has(rotated[i][1]*stride+rotated[i][0])) {
        d+=smoothArc(rotated.slice(start,i+1), grid);start=i;
      }
    }
    loops.push(d+'Z');
  }
  return loops.join('');
}
async function main() {
  // Regression anchors in the reference artwork, away from boundary strokes.
  for(const [name,x,y,id] of [
    ["Storm's End",650,1100,'the-stormlands'],['Cape Wrath',615,1210,'the-stormlands'],
    ['Red Watch',505,1180,'the-stormlands'],['Marches',320,1210,'the-stormlands'],
    ['Ashford',416,1155,'the-reach'],['Oldtown',122,1290,'the-reach'],
    ['Starfall',251,1335,'dorne'],['Sunspear',700,1370,'dorne'],
  ]) {
    const matches=regions.filter(r=>inside(x,y,r.ring));
    if(matches.length!==1||matches[0].id!==id)throw Error(`${name}: expected ${id}, got ${matches.map(r=>r.id)}`);
  }
  for(let y=880;y<1400;y+=2)for(let x=220;x<700;x+=2) {
    if(regions.filter(r=>inside(x+.5,y+.5,r.ring)).length>1)throw Error(`Overlapping inland polygons at ${x},${y}`);
  }
  const {data,info}=await sharp('public/images/map/known-world.webp').extract(crop).resize(W,H).removeAlpha().raw().toBuffer({resolveWithObject:true});
  if(info.channels!==3)throw Error('Expected RGB');
  const land=new Uint8Array(W*H);
  for(let i=0;i<land.length;i++) {
    const [r,g,b]=data.subarray(i*3,i*3+3);
    land[i]=!(b>r*1.025 && b>g*.98) && (r+g+b)>130 ? 1:0;
  }
  components(land,1,(pixels)=>{if(pixels.length<12)for(const p of pixels)land[p]=0;});
  components(land,0,(pixels,edge)=>{if(!edge&&pixels.length<9000)for(const p of pixels)land[p]=1;});
  const masks=regions.map(()=>new Uint8Array(W*H));
  const owners=new Int8Array(W*H).fill(-1);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++) {
    const i=y*W+x;if(!land[i])continue;
    // Exclude Essos/Stepstones in the southeast of this crop.
    const rx=(crop.left-reference.left)/2*refScale+(x+.5)*refScale;
    const ry=(crop.top-reference.top)/2*refScale+(y+.5)*refScale;
    if(rx>740 && ry>1150)continue;
    // Skagos and Skane are offshore, north of the Wall's latitude. Do not
    // extend the mainland region north of the Wall to include those islands.
    const match=rx>620 && ry>=-100 && ry<120 ? 0 : regions.findIndex(r=>inside(rx,ry,r.ring));
    // The marked northern Stepstones island is not part of either mainland
    // realm. Exclude it in native artwork coordinates, without moving borders.
    const mapX=crop.left+(x+.5)*2,mapY=crop.top+(y+.5)*2;
    // Pale lettering in this offshore strip is the "The Narrow Sea" label,
    // not land. Keep it out of Crownlands without touching Dragonstone/Driftmark.
    if(match>=0&&['the-crownlands','the-stormlands'].includes(regions[match].id)
      &&mapX>=1680&&mapY>=2140&&mapY<=2650)continue;
    if(match>=0&&['dorne','the-stormlands'].includes(regions[match].id)
      &&mapX>=1760&&mapX<=1832&&mapY>=2980&&mapY<=3160)continue;
    if(match>=0){masks[match][i]=1;owners[i]=match;}
  }
  const junctions=new Set();
  const owner=(x,y)=>x<0||y<0||x>=W||y>=H?-1:owners[y*W+x];
  for(let y=0;y<=H;y++)for(let x=0;x<=W;x++) {
    if(new Set([owner(x-1,y-1),owner(x,y-1),owner(x-1,y),owner(x,y)]).size>2)junctions.add(y*(W+1)+x);
  }
  const houses=JSON.parse(fs.readFileSync('data/houses.json','utf8'));
  // Map-specific reference palette; do not change canonical House brand colours.
  const referenceColors={stark:'#ffffff',greyjoy:'#101014',arryn:'#0098e0',tully:'#a70819',lannister:'#c60012',targaryen:'#101014',baratheon:'#ffe21c',martell:'#ed8500',tyrell:'#008509'};
  const result=regions.map((r,i)=>({id:r.id,name:r.name,house:r.house,color:referenceColors[r.house],
    sigil:houses.find(h=>h.id===r.house).sigilSrc,
    label:{x:Math.round(reference.left+r.label[0]*reference.width/800),y:Math.round(reference.top+r.label[1]*reference.width/800),size:Math.round(r.size*reference.width/800)},path:trace(masks[i],junctions)}));
  fs.writeFileSync('data/map/region-geometry.json',JSON.stringify({width:7400,height:4932,regions:result},null,2)+'\n');
  const paths=result.map(r=>`<path d="${r.path}" fill="${r.color}" fill-opacity=".28" stroke="#ebd7a2" stroke-width="2"/>`).join('');
  const svg=Buffer.from(`<svg width="7400" height="4932" xmlns="http://www.w3.org/2000/svg">${paths}</svg>`);
  const preview=await sharp('public/images/map/known-world.webp').composite([{input:svg}]).png().toBuffer();
  await sharp(preview).extract(crop).resize(800).png().toFile('.tmp/region-trace-preview.png');
  console.log(result.map(r=>`${r.id}: ${r.path.length} chars`).join('\n'));
}

module.exports = { trace, regions, inside };
if (require.main === module) main().catch(e=>{console.error(e);process.exit(1);});
