const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({ channel:'msedge', headless:true });
 const page = await browser.newPage({ viewport:{width:1440,height:900} });
 const base='http://localhost:3100';
 const go=async(path)=>{ await page.goto(base+path); await page.waitForTimeout(1200); };
 try {
  await go('/timeline');
  await page.getByRole('link',{name:'The Collection',exact:true}).first().hover();
  await page.getByRole('link',{name:'Artifacts',exact:true}).waitFor({state:'visible'});
  const menu=await page.getByRole('link',{name:'Artifacts',exact:true}).boundingBox();
  assert(await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.closest('a')?.textContent==='Artifacts',{x:menu.x+10,y:menu.y+10}));
  const search=page.getByRole('textbox',{name:'Search the realm',exact:true});
  const narrow=await search.boundingBox(); await search.click(); await page.waitForTimeout(350);
  const wide=await search.boundingBox(); assert(wide.width>narrow.width*3);
  await search.press('Escape');
  await page.getByRole('button',{name:'Filter by character'}).click();
  const filter=page.getByPlaceholder('Search characters…');
  assert((await filter.boundingBox()).height<=40);
  console.log('PASS navbar hover hit target, expanding search, compact dropdown');
  await page.screenshot({path:'ui-timeline.png'});
  await go('/');
  const timeline=page.locator('section[aria-labelledby="chronicle-timeline-title"]');
  await timeline.scrollIntoViewIfNeeded();
  const marker=timeline.locator('a').first(); await marker.hover();
  const popup=page.locator('[class*="floatingTooltip"]'); await popup.waitFor({state:'visible'});
  assert((await popup.locator('a').first().getAttribute('href')).startsWith('/timeline#'));
  const bounds=await page.evaluate(()=>{ const a=document.querySelector('.home-left-col > a:last-child'); const b=document.querySelector('.realm-ledger-card'); return [a.getBoundingClientRect().bottom,b.getBoundingClientRect().bottom]; });
  assert(Math.abs(bounds[0]-bounds[1])<2);
  console.log('PASS portal tooltip, timeline link, homepage card alignment');
  await page.screenshot({path:'ui-home.png'});
  await go('/bestiary'); assert(await page.getByRole('link',{name:'Dragons',exact:false}).count()>0);
  await go('/bestiary/dragons'); await page.getByRole('heading',{name:'Living',exact:true}).waitFor(); await page.getByRole('heading',{name:'Lost',exact:true}).waitFor();
  assert(await page.locator('main a[href="/characters/baelenys-targaryen"] img').count()>0);
  console.log('PASS Bestiary Living/Lost and rider profile links');
  for(const size of [{width:1440,height:900},{width:390,height:844}]) {
   await page.setViewportSize(size);
   await go('/chapters?openToc=1');
   const last=page.getByRole('button',{name:'Chapter XV: The Glass Flower',exact:true}); await last.scrollIntoViewIfNeeded(); assert(await last.isVisible());
   const check=await page.evaluate(()=>({doc:document.documentElement.scrollHeight,v:innerHeight})); assert(check.doc<=check.v+2,JSON.stringify(check));
   await go('/chapters/the-glass-flower');
   const controlBottom=await page.getByRole('button',{name:'Click to read the full chapter',exact:true}).evaluate(el=>el.getBoundingClientRect().bottom);
   const bookTop=await page.locator('[class*="chapter-reader"][class*="__book"]').evaluate(el=>el.getBoundingClientRect().top);
   assert(bookTop-controlBottom>=20,`Book/control gap: ${bookTop-controlBottom}`);
   const dims=await page.evaluate(()=>({doc:document.documentElement.scrollHeight,v:innerHeight})); assert(dims.doc<=dims.v+2,JSON.stringify(dims));
   await page.getByRole('button',{name:'Click to read the full chapter',exact:true}).click();
   assert(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight*2));
   console.log('PASS chapter scroll modes and latest chapter',size.width);
   await page.screenshot({path:`ui-chapter-${size.width}.png`});
  }
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
