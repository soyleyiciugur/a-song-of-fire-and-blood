import { chromium, expect } from '@playwright/test';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const env = fs.readFileSync('.env.local', 'utf8');
const project = new URL(env.match(/^NEXT_PUBLIC_SUPABASE_URL\s*=\s*["']?([^\s"']+)/m)[1]).hostname.split('.')[0];
const userId = '00000000-0000-4000-8000-000000000001';
const user = { id: userId, aud: 'authenticated', role: 'authenticated', email: 'fixture@example.test', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
const jwt = [Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'), Buffer.from(JSON.stringify({ sub: userId, exp: Math.floor(Date.now()/1000)+3600, role: 'authenticated' })).toString('base64url'), 'fixture'].join('.');
const cookie = `sb-${project}-auth-token=base64-${Buffer.from(JSON.stringify({ access_token: jwt, refresh_token: 'fixture', token_type: 'bearer', expires_at: Math.floor(Date.now()/1000)+3600, expires_in:3600, user })).toString('base64url')}`;
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  for (const width of [390, 320, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    // Browser-only cookie getter: fake auth never reaches the real server/proxy.
    await context.addInitScript(value => Object.defineProperty(document, 'cookie', { configurable: true, get: () => value, set: () => {} }), cookie);
    const rows = Array.from({ length: 45 }, (_, index) => ({ id: `00000000-0000-4000-8000-${String(index+10).padStart(12,'0')}`, user_id:userId, actor_id:null, kind:'realm_notice',source:'realm',mascot:index%2?'aldren':'mara', title:`Raven number ${index+1}.`,body:'A message awaits you in the realm.',href:'/offline',source_label:null,context:{},created_at:new Date(Date.now()-index*1000-10000).toISOString(),read_at:null }));
    let patches = 0, failNext = false;
    await context.route('**/auth/v1/**', route => route.fulfill({ json:user }));
    await context.route('**/rest/v1/**', async route => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith('/profiles')) return route.fulfill({json:{id:userId,username:'fixture',display_name:'Fixture',avatar_url:null}});
      if (!url.pathname.endsWith('/site_notifications')) return route.fulfill({ json: [] });
      const matches = row => (!url.searchParams.has('id') || url.searchParams.get('id')===`eq.${row.id}`) && (!url.searchParams.has('read_at') || !row.read_at) && (!url.searchParams.has('created_at') || row.created_at <= url.searchParams.get('created_at').slice(4));
      if (route.request().method()==='PATCH') {
        patches++;
        if (failNext) { failNext=false; return route.fulfill({status:500,json:{message:'fixture failure'}}); }
        for (const row of rows.filter(matches)) Object.assign(row, route.request().postDataJSON());
        return route.fulfill({status:204,body:''});
      }
      const selected = rows.filter(matches);
      if (route.request().method()==='HEAD') return route.fulfill({status:200,headers:{'content-range':`0-0/${selected.length}`},body:''});
      return route.fulfill({json:url.searchParams.has('id')?selected[0]:selected.slice(0,Number(url.searchParams.get('limit')||100))});
    });
    const page = await context.newPage();
    page.on('pageerror', error => console.error(error.message));
    await page.goto('http://localhost:3112/notifications');
    await expect(page.getByRole('button',{name:/Raven number 1\./})).toBeVisible();
    assert.equal(patches,0,'merely loading the ledger must not mark everything read');
    await expect(page.getByLabel('Unread',{exact:true})).toHaveCount(40);
    const sendClick = id => page.evaluate(async notificationId => {
      const channel = new MessageChannel();
      let timer;
      const reply = new Promise((resolve,reject) => {
        timer=setTimeout(()=>reject(Error(`App message listener did not acknowledge on ${location.pathname}`)),5000);
        channel.port1.onmessage=e=>{clearTimeout(timer);resolve(e.data);};
      });
      navigator.serviceWorker.dispatchEvent(new MessageEvent('message',{data:{type:'ASOFAB_OPEN_NOTIFICATION',url:`${location.origin}/notifications?open=${notificationId}`},ports:[channel.port2]}));
      const result=await reply;channel.port1.close();return result;
    }, id);
    // Already open on another ledger: click a push for an item outside page one.
    await page.getByRole('tab',{name:'Across the Realm'}).click();
    assert.equal(await sendClick(rows[44].id),'navigated');
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading',{name:'Raven number 45.'})).toBeVisible();
    await page.getByRole('button',{name:'Return to the rookery'}).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect.poll(()=>rows[44].read_at).not.toBeNull();
    await page.getByRole('tab',{name:'Personal Ravens'}).click();
    for (const [index, exit] of [[0,'close'],[1,'escape'],[2,'backdrop'],[3,'return']]) {
      await sendClick(rows[index].id);
      await expect(page.getByRole('heading',{name:rows[index].title})).toBeVisible();
      if(exit==='close') await page.getByRole('button',{name:'Close notification'}).click();
      if(exit==='escape') await page.keyboard.press('Escape');
      if(exit==='backdrop') await page.locator('[class*="lightboxBackdrop"]').click({position:{x:3,y:3}});
      if(exit==='return') await page.getByRole('button',{name:'Return to the rookery'}).click();
      await expect(page.getByRole('dialog'), `${exit} closes the popup at ${width}px`).toHaveCount(0);
      await expect(page.getByRole('button',{name:new RegExp(`Raven number ${index+1}\\.`)}).getByLabel('Unread',{exact:true})).toHaveCount(0);
      await expect.poll(()=>rows[index].read_at).not.toBeNull();
    }
    await page.goto('http://localhost:3112/offline');
    await expect(page.getByText('FI',{exact:true})).toBeVisible();
    assert.equal(await sendClick(rows[4].id),'navigated');
    await expect(page.getByRole('heading',{name:rows[4].title})).toBeVisible();
    await page.getByRole('link',{name:'See the notice'}).click();
    await expect(page).toHaveURL(/\/offline$/);
    await expect.poll(()=>rows[4].read_at).not.toBeNull();
    await page.goto('http://localhost:3112/notifications');
    await expect(page.getByLabel('Unread',{exact:true})).toHaveCount(35);
    failNext=true;
    await page.getByRole('button',{name:'Let no raven go unheard'}).click();
    await expect(page.getByText('The ledger could not be sealed. Please try again.')).toBeVisible();
    await expect(page.getByLabel('Unread',{exact:true})).toHaveCount(35);
    await page.getByRole('button',{name:'Let no raven go unheard'}).click();
    await expect(page.getByText('Every waiting raven has been heard.')).toBeVisible();
    assert.equal(rows.filter(row=>!row.read_at).length,0,'bulk action includes notifications beyond the loaded page');
    await expect(page.getByLabel('Unread',{exact:true})).toHaveCount(0);
    await expect(page.getByRole('link',{name:/Notifications, .* unread/})).toHaveCount(0);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await context.close();
  }
  console.log('Ledger browser checks passed: warm deep links, older notification, all four exits, highlights, bulk read, failed-write recovery and responsive widths.');
} finally { await browser.close(); }
