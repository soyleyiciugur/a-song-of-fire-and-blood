import { chromium } from '@playwright/test';
import { mkdir, writeFile, unlink, rmdir, access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const fixtureName = `social-test-${process.pid}`;
const fixtureUrl = `http://localhost:3107/${fixtureName}`;
const fixture = path.join(root, 'app', fixtureName);
try { await access(fixture); throw Error('Refusing to overwrite an existing fixture directory.'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
const me = '00000000-0000-4000-8000-000000000001', partner = '00000000-0000-4000-8000-000000000002', conversation = '00000000-0000-4000-8000-000000000004';
const profile = { id:partner, username:'brandon', display_name:'Brandon of the Rookery', avatar_url:null, bio:null, role:'member', created_at:'2026-09-10T10:00:00Z', updated_at:'2026-09-10T10:00:00Z' };
const initial = Array.from({length:60}, (_,i)=>({id:`00000000-0000-4000-8001-${String(i).padStart(12,'0')}`,conversation_id:conversation,sender_id:i%2?me:partner,body:`Raven ${i}: A letter from the northern keep.`,created_at:new Date(Date.UTC(2026,8,10,10,i)).toISOString(),edited_at:null,deleted_at:null}));
await mkdir(fixture);
await writeFile(path.join(fixture,'page.tsx'), `import RavenConversation from '@/components/direct-raven/RavenConversation';
import Inbox from '@/components/direct-raven/DirectRavenInbox';
import ProfileActivity from '@/components/community/ProfileActivity';
import ProfileFriends from '@/components/community/ProfileFriends';
import ProfileSettings from '@/app/settings/ProfileSettings';
import styles from '@/components/direct-raven/direct-raven.module.css';
export default async function Page({searchParams}:{searchParams:Promise<{inbox?:string;profile?:string}>}){const q=await searchParams;if(q.profile)return <><ProfileSettings profile={${JSON.stringify({...profile,id:me})}}/><ProfileActivity userId="${me}"/><ProfileFriends profileId="${partner}" viewerId="${me}"/></>;return <main className={styles.page}><div className={styles.shell}><Inbox conversations={[]} />{!q.inbox&&<RavenConversation conversationId="${conversation}" userId="${me}" partner={${JSON.stringify(profile)}} initialMessages={${JSON.stringify(initial)}} blockedByMe={false} blockedByThem={false}/>}</div></main>}`);
let server;
let browser;
let logs='';
try {
server = spawn(process.execPath, ['node_modules/next/dist/bin/next','dev','--port','3107'], { cwd:root, env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54329',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'test-key',NEXT_PUBLIC_GIPHY_API_KEY:'test-giphy-key'}, stdio:['ignore','pipe','pipe'], windowsHide:true });
server.stdout.on('data',d=>logs+=d); server.stderr.on('data',d=>logs+=d);
  for(let n=0;n<90;n++){try{if((await fetch(fixtureUrl)).ok)break;}catch{} await new Promise(r=>setTimeout(r,500));if(n===89)throw Error(logs.slice(-3000));}
  browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || path.join(process.env.LOCALAPPDATA,'ms-playwright','chromium-1194','chrome-win','chrome.exe')});
  for (const viewport of [{width:1440,height:900},{width:390,height:844},{width:320,height:568}]) {
    const page=await browser.newPage({viewport});
    const pageErrors=[];page.on("pageerror",error=>pageErrors.push(error.message));
    let messages=[...initial], failNext=false;let friendships=[];
    await page.route('http://127.0.0.1:54329/**',async route=>{
      const url=new URL(route.request().url()), method=route.request().method();
      let data=[];
      if(url.pathname.includes('direct_raven_messages')){
        if(method==='POST'){
          if(failNext){failNext=false;return route.fulfill({status:500,json:{message:'test failure'}});}
          const input=route.request().postDataJSON();
          const message={...input,id:crypto.randomUUID(),created_at:new Date().toISOString(),edited_at:null,deleted_at:null};messages.push(message);data=message;
        }else if(method==='PATCH'){
          const id=url.searchParams.get('id')?.replace('eq.','');const changes=route.request().postDataJSON();messages=messages.map(m=>m.id===id?{...m,...changes,edited_at:new Date().toISOString()}:m);data=messages.find(m=>m.id===id);
        }else data=messages;
      }else if(url.pathname.includes('member_friendships')){if(method==='POST')friendships=[{...route.request().postDataJSON(),id:crypto.randomUUID(),accepted_at:null}];if(method==='DELETE')friendships=[];data=friendships;}else if(url.pathname.includes('forum_threads'))data=[{id:conversation,title:'A member thread',body:'An actual contribution',created_at:'2026-09-10T10:00:00Z'}];else if(url.pathname.includes('direct_raven_reads'))data=method==='GET'?null:{};
      else if(url.pathname.includes('/profiles'))data=[profile];
      else if(url.pathname.includes('start_direct_raven'))data=conversation;
      return route.fulfill({status:200,json:data,headers:{'access-control-allow-origin':'*'}});
    });
    await page.goto(fixtureUrl);
    await page.addStyleTag({content:'nextjs-portal{pointer-events:none}'});
    const input=page.getByRole('textbox',{name:'Message',exact:true});await input.waitFor();
    // Authentication controls may be inside the closed mobile drawer.
    await page.evaluate(()=>document.fonts.ready); await page.waitForTimeout(500);
    const navOverlaps=await page.locator('header').first().evaluate(header=>{
      const inner=header.firstElementChild;
      const boxes=[...inner.children].filter(el=>!el.matches('button[aria-label*="site navigation"]')).map(el=>el.getBoundingClientRect()).filter(r=>r.width&&r.height);
      return boxes.some((a,i)=>boxes.slice(i+1).some(b=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1));
    });
    assert.equal(navOverlaps,false,'Navbar controls do not overlap');
    const title = page.locator('header a').filter({hasText:'A Song of Fire and Blood'}).first();
    if(await title.isVisible()) assert.equal(await title.evaluate(el=>getComputedStyle(el).whiteSpace),'nowrap','Site title stays on one line');
    const dot=page.locator('[class*="notificationDot"]');
    if(await dot.count()) assert.equal(await dot.evaluate(el=>el.offsetParent===el.parentElement),true,'Notification dot is anchored to its own icon');
    const messageList=page.locator('[class*="messages"]').first();
    for(const edge of ['top','bottom']) {
      await messageList.evaluate((el,edge)=>el.scrollTop=edge==='top'?0:el.scrollHeight,edge);
      await page.waitForTimeout(100);
      const option=page.getByRole('button',{name:'Message options',exact:true});
      await (edge==='top'?option.first():option.last()).click();
      const menu=page.locator('[data-raven-message-menu] > div');
      const box=await menu.boundingBox(),bounds=await messageList.boundingBox();
      assert.ok(box.y>=bounds.y&&box.y+box.height<=bounds.y+bounds.height,'Message menu stays inside the message viewport');
      await page.keyboard.press('Escape');
    }
    await messageList.evaluate((el) => {
      el.scrollTop = 0;
      el.dispatchEvent(new Event('scroll', { bubbles: true }));
    });
    await page.waitForTimeout(400);
    const afterManualScroll = await messageList.evaluate((el) => el.scrollTop);
    assert.ok(afterManualScroll < 100, 'Conversation should stay where the user left it rather than snapping back to the newest message');
    const account=page.getByLabel('Account menu',{exact:true});
    await account.click();
    await page.getByRole('link',{name:'Sign in',exact:true}).waitFor();
    await page.getByRole('link',{name:'Join',exact:true}).waitFor();
    await page.keyboard.press('Escape');
    assert.equal(await account.evaluate(el=>el.parentElement.open),false,'Anonymous account menu closes on Escape');
    const utilities=await page.locator('header').first().evaluate(el=>{
      const row=el.firstElementChild;
      return [...row.children].filter(el=>el.matches('[class*="searchWrap"],[class*="forumButton"],[class*="directRavenButton"],[class*="notificationsButton"],[class*="accountMenu"]')).map(el=>el.className);
    });
    assert.ok(utilities[0].includes('searchWrap')&&utilities[1].includes('forumButton')&&utilities.at(-1).includes('accountMenu'),'Utility order: search, forum, optional DM, notifications, account');
    if(viewport.width>760){
      const sound=page.getByRole('button',{name:'Enable notification sounds',exact:true});
      await sound.click();await page.getByRole('button',{name:'Mute notification sounds',exact:true}).click();
      assert.equal(await sound.innerText(),'','Sound control uses only an icon');
    }
    const before=await input.boundingBox();
    for(let i=0;i<12;i++){await input.fill(`New message ${i}`);await input.press('Enter');await page.getByText(`New message ${i}`,{exact:true}).waitFor();}
    const after=await input.boundingBox();
    assert.ok(after.y+after.height<=viewport.height,`Composer visible at ${viewport.width}`);
    const toolsBox=await page.locator('[class*="composerTools"]').boundingBox();
    const composerBox=await page.locator('[class*="composerArea"]').boundingBox();
    assert.ok(toolsBox.y+toolsBox.height<=composerBox.y+composerBox.height,"Attachment and emoji tools are not clipped");
    await mkdir(path.join(root,"test-results"),{recursive:true});await page.screenshot({path:path.join(root,"test-results",`raven-debug-${viewport.width}.png`)});
    assert.ok(Math.abs(before.y-after.y)<2,`Composer does not drift after sending at ${viewport.width}: ${before.y} -> ${after.y}`);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'No horizontal overflow');
    assert.equal(await page.evaluate(()=>window.scrollY),0,'Sending never scrolls the document');
    failNext=true;await input.fill('Keep this failed draft');await input.press('Enter');await page.getByText('The raven could not be sent. Your draft is still here.',{exact:true}).waitFor();assert.equal(await input.inputValue(),'Keep this failed draft');
    await page.getByRole('button',{name:'Emoji',exact:false}).click();await page.getByRole('button',{name:'🔥',exact:true}).click();assert.ok((await input.inputValue()).endsWith('🔥'));
    await input.fill('Before after');await input.evaluate(el=>el.setSelectionRange(7,7));
    await page.getByRole('button',{name:'Portraits',exact:false}).click();
    await page.getByRole('button',{name:/^Add .* mini portrait$/}).first().click();
    assert.match(await input.inputValue(),/^Before \[\[portrait:[a-z0-9-]+\]\]after$/);
    await page.getByRole('button',{name:'Send',exact:true}).click();
    await page.locator('[class*="inlinePortrait"]').first().waitFor();
    assert.equal(await page.locator('[class*="inlinePortrait"]').count(),1);
    await page.route('**/api/giphy/search?**',route=>route.fulfill({json:{data:[{id:'abc123',title:'Test wave',url:'https://media.giphy.com/media/abc123/200.gif'}]}}));
    await page.getByRole('button',{name:'GIF',exact:true}).click();await page.getByRole('searchbox',{name:'Search GIFs'}).fill('wave');
    await page.getByRole('button',{name:'Select Test wave'}).click();await page.getByRole('button',{name:'Send',exact:true}).click();
    await page.getByAltText('Test wave').waitFor();
    await page.waitForFunction(()=>document.querySelector('textarea[aria-label="Message"]')?.value==='');
    assert.equal(messages.at(-1).gif.id,'abc123');
    if(viewport.width<760){await page.setViewportSize({width:viewport.width,height:400});await input.focus();await page.waitForTimeout(300);const box=await input.boundingBox();assert.ok(box.y>=0&&box.y+box.height<=400,'Composer fits keyboard-sized viewport');await page.setViewportSize(viewport);}
    const list=page.locator('[class*="messages"]').first();await list.evaluate(el=>el.scrollTop=0);await page.waitForTimeout(100);
    assert.equal(await page.evaluate(()=>window.scrollY),0);
    await mkdir(path.join(root,'test-results'),{recursive:true});await page.screenshot({path:path.join(root,'test-results',`raven-${viewport.width}.png`)});
    await page.goto(fixtureUrl+'?inbox=1');await page.getByRole('button',{name:'New Raven',exact:true}).click();await page.getByPlaceholder('Search @username').fill('bran');await page.getByRole('button',{name:/Brandon of the Rookery/}).waitFor();
    await page.goto('http://localhost:3107/forum');
    const banner=page.locator('[class*="bannerImage"]');
    await banner.waitFor();await banner.hover();await page.waitForTimeout(750);
    assert.equal(await banner.evaluate(el=>{
      const parent=el.parentElement;
      return getComputedStyle(parent).overflow==='hidden'&&Number(getComputedStyle(parent,'::after').zIndex)>Number(getComputedStyle(el).zIndex);
    }),true,'Taverns hover image stays clipped beneath the overlay');
    if (!process.env.RAVEN_ONLY) {
    await page.goto(fixtureUrl+'?profile=1');
    await page.getByRole('tab',{name:'Threads',exact:true}).click();await page.getByText('A member thread',{exact:true}).waitFor();
    await page.getByRole('tab',{name:'Replies',exact:true}).click();await page.getByText('No replies yet.',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Add friend',exact:false}).click();await page.getByRole('button',{name:'Cancel request',exact:true}).waitFor();await page.getByRole('button',{name:'Cancel request',exact:true}).click();
    await page.locator('input[name="banner"]').setInputFiles({name:'banner.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aTZkAAAAASUVORK5CYII=','base64')});
    await page.getByAltText('Banner preview').waitFor();await page.getByRole('button',{name:'Save profile',exact:true}).click();await page.getByText('Profile updated.',{exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Profile has no horizontal overflow');
    }
    assert.deepEqual(pageErrors,[],"No browser runtime errors");
    await page.close();console.log(`Raven UI ${viewport.width}x${viewport.height}: composer, send, failed draft, emoji, GIF, navbar, overflow and recipient search passed. Profile checks: ${process.env.RAVEN_ONLY ? "skipped" : "passed"}.`);
  }
}finally{
  await browser?.close();
  server?.kill();
  await unlink(path.join(fixture,'page.tsx'));await rmdir(fixture);
  for (const name of ['validator.ts','routes.d.ts']) await unlink(path.join(root,'.next','dev','types',name)).catch(e=>{if(e.code!=='ENOENT')throw e;});
}
