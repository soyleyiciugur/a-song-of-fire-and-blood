// Trace the original flat-color dragon shapes into resolution-independent SVG paths.
// Inputs stay untouched. Existing clipping masks exclude captions and human figures.
const fs = require('node:fs');
const sharp = require('sharp');
const shapes = require('../data/dragon-size-shapes.json');
const distance = (a,b) => a.reduce((sum,v,i)=>sum+(v-b[i])**2,0);
function simplify(points, tolerance=1.3) {
  if(points.length<3)return points;
  const a=points[0],b=points.at(-1),dx=b[0]-a[0],dy=b[1]-a[1],den=dx*dx+dy*dy;
  let max=0,index=0;
  for(let i=1;i<points.length-1;i++) {
    const p=points[i],t=den?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/den)):0;
    const d=(p[0]-a[0]-t*dx)**2+(p[1]-a[1]-t*dy)**2;
    if(d>max){max=d;index=i;}
  }
  return max>tolerance*tolerance?[...simplify(points.slice(0,index+1),tolerance).slice(0,-1),...simplify(points.slice(index),tolerance)]:[a,b];
}
function trace(labels,w,h,target) {
  const edges=new Map();
  const add=(x,y,xx,yy)=>{const key=y*(w+1)+x;const list=edges.get(key)||[];list.push(yy*(w+1)+xx);edges.set(key,list);};
  const inside=(x,y)=>x>=0&&x<w&&y>=0&&y<h&&labels[y*w+x]===target;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(inside(x,y)) {
    if(!inside(x,y-1))add(x,y,x+1,y);
    if(!inside(x+1,y))add(x+1,y,x+1,y+1);
    if(!inside(x,y+1))add(x+1,y+1,x,y+1);
    if(!inside(x-1,y))add(x,y+1,x,y);
  }
  let result=''; const fmt=p=>p.map(v=>Number(v.toFixed(2))).join(' ');
  while(edges.size) {
    const start=edges.keys().next().value;let key=start,points=[];
    do{points.push([key%(w+1),Math.floor(key/(w+1))]);const list=edges.get(key);if(!list)break;const next=list.pop();if(!list.length)edges.delete(key);key=next;}while(key!==start);
    if(points.length<8)continue;
    const mid=Math.floor(points.length/2);
    points=[...simplify(points.slice(0,mid+1)).slice(0,-1),...simplify([...points.slice(mid),points[0]]).slice(0,-1)];
    if(points.length<3)continue;
    // Round only a small fraction of each corner, retaining spikes and tail tips.
    const lerp=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
    result+=`M${fmt(lerp(points.at(-1),points[0],.7))}`;
    for(let i=0;i<points.length;i++) {
      const prev=points[(i+points.length-1)%points.length],p=points[i],next=points[(i+1)%points.length];
      result+=`L${fmt(lerp(prev,p,.7))}Q${fmt(p)} ${fmt(lerp(p,next,.3))}`;
    }
    result+='Z';
  }
  return result;
}
if (require.main === module) (async()=>{
  fs.mkdirSync('public/images/dragons/sizes/clean',{recursive:true});
  let total=0;
  for(const [id,shape] of Object.entries(shapes)) {
    const {data,info}=await sharp(`public/images/dragons/sizes/atlas/${shape.file}.png`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const [left,top,w,h]=shape.box,mask=new Uint8Array(w*h),labels=new Int8Array(w*h).fill(-1),hist=new Map();
    for(const match of shape.clip.matchAll(/M(\d+) (\d+)h(\d+)v1H\d+z/g)) {
      const x=+match[1]-left,y=+match[2]-top;for(let i=0;i<+match[3];i++)mask[y*w+x+i]=1;
    }
    const color=p=>{const k=((top+Math.floor(p/w))*info.width+left+p%w)*4;return [...data.subarray(k,k+3)];};
    for(let p=0;p<mask.length;p++)if(mask[p]) {
      const c=color(p);if(Math.min(...c)>245)continue;
      const key=c.map(v=>Math.round(v/8)*8).join(',');const bin=hist.get(key)||{count:0,sum:[0,0,0]};bin.count++;c.forEach((v,i)=>bin.sum[i]+=v);hist.set(key,bin);
    }
    const bins=[...hist.values()].sort((a,b)=>b.count-a.count),palette=[];
    for(const bin of bins){const c=bin.sum.map(v=>Math.round(v/bin.count));if(palette.every(p=>distance(p,c)>(id==='grey-ghost'?600:1800)))palette.push(c);if(palette.length===(id==='morghul-shrykos'?3:2))break;}
    const queue=[];
    for(let p=0;p<mask.length;p++)if(mask[p]) {
      const c=color(p),d=palette.map(v=>distance(v,c)),nearest=d.indexOf(Math.min(...d));
      if(d[nearest]<900){labels[p]=nearest;queue.push(p);}
    }
    // Extend the adjacent original fill into matte-contaminated edge pixels.
    for(let i=0;i<queue.length;i++) {
      const p=queue[i],x=p%w,y=Math.floor(p/w);
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy,n=yy*w+xx;if(xx>=0&&xx<w&&yy>=0&&yy<h&&mask[n]&&labels[n]===-1){labels[n]=labels[p];queue.push(n);}}
    }
    const paths=palette.map((c,i)=>`<path fill="rgb(${c.join(',')})" d="${trace(labels,w,h,i)}"/>`).join('');
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${paths}</svg>\n`;
    fs.writeFileSync(`public/images/dragons/sizes/clean/${id}.svg`,svg);total+=Buffer.byteLength(svg);
    console.log(id,palette.map(c=>c.join(',')),svg.length);
  }
  console.log('Vector bytes:',total);
})().catch(error=>{console.error(error);process.exitCode=1;});

module.exports = { trace };
