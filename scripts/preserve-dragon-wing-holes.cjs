// Keep pre-existing enclosed wing holes out of the new backing layer.
﻿const fs=require('fs');const first=new Set(['boneskin','dreamfyre','meleys','seasmoke','sheepstealer','sunfyre','vermithor']);
for(const file of fs.readdirSync('public/images/dragons/sizes/clean')) {
const p='public/images/dragons/sizes/clean/'+file;let s=fs.readFileSync(p,'utf8');if(!s.includes('data-wing-backing')||s.includes('id="wing-holes"'))continue;
const paths=[...s.matchAll(/<path fill="[^"]+" d="([^"]+)"\s*\/>/g)];const wing=paths[first.has(file.replace('.svg',''))?0:1];if(!wing)continue;
const holes=wing[1].split(/(?=M)/).filter(d=>{const pts=[...d.matchAll(/[MLQ]([^MLQZ]+)/g)].map(m=>m[1].trim().split(/[ ,]+/).map(Number)).map(a=>a.slice(-2));let area=0;for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];area+=a[0]*b[1]-b[0]*a[1];}return area<0;});if(!holes.length)continue;
const box=s.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);s=s.replace('<path data-wing-backing="true"',`<defs><mask id="wing-holes" maskUnits="userSpaceOnUse" x="0" y="0" width="${box[2]}" height="${box[3]}"><rect width="${box[2]}" height="${box[3]}" fill="white"/><path fill="black" d="${holes.join('')}"/></mask></defs><path mask="url(#wing-holes)" data-wing-backing="true"`);fs.writeFileSync(p,s);console.log(file,holes.length);
}
