import { chromium } from '@playwright/test';
import { mkdir, writeFile, unlink, rmdir, access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const fixture = path.join(root, 'app', 'social-test');
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
server = spawn(process.execPath, ['node_modules/next/dist/bin/next','dev','--port','3107'], { cwd:root, env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54329',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'test-key'}, stdio:['ignore','pipe','pipe'], windowsHide:true });
server.stdout.on('data',d=>logs+=d); server.stderr.on('data',d=>logs+=d);
  for(let n=0;n<90;n++){try{if((await fetch('http://localhost:3107/social-test')).ok)break;}catch{} await new Promise(r=>setTimeout(r,500));if(n===89)throw Error(logs.slice(-3000));}
  browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || path.join(process.env.LOCALAPPDATA,'ms-playwright','chromium-1194','chrome-win','chrome.exe')});
  for (const viewport of [{width:1440,height:900},{width:390,height:844},{width:320,height:568}]) {
    const page=await browser.newPage({viewport});
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
    await page.goto('http://localhost:3107/social-test');
    const input=page.getByRole('textbox',{name:'Message',exact:true});await input.waitFor();
    await page.evaluate(()=>document.fonts.ready); await page.waitForTimeout(500);
    const before=await input.boundingBox();
    for(let i=0;i<12;i++){await input.fill(`New message ${i}`);await input.press('Enter');await page.getByText(`New message ${i}`,{exact:true}).waitFor();}
    const after=await input.boundingBox();
    assert.ok(after.y+after.height<=viewport.height,`Composer visible at ${viewport.width}`);
    const toolsBox=await page.locator('[class*="composerTools"]').boundingBox();
    const composerBox=await page.locator('[class*="composerArea"]').boundingBox();
    assert.ok(toolsBox.y+toolsBox.height<=composerBox.y+composerBox.height,"Attachment and emoji tools are not clipped");
    await mkdir(path.join(root,"test-results"),{recursive:true});await page.screenshot({path:path.join(root,"test-results",`raven-debug-${viewport.width}.png`)});
    assert.ok(Math.abs(before.y-after.y)<2,'Composer does not drift after sending');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'No horizontal overflow');
    assert.equal(await page.evaluate(()=>window.scrollY),0,'Sending never scrolls the document');
    failNext=true;await input.fill('Keep this failed draft');await input.press('Enter');await page.getByText('The raven could not be sent. Your draft is still here.',{exact:true}).waitFor();assert.equal(await input.inputValue(),'Keep this failed draft');
    await page.getByRole('button',{name:'Emoji',exact:false}).click();await page.getByRole('button',{name:'🔥',exact:true}).click();assert.ok((await input.inputValue()).endsWith('🔥'));
    const list=page.locator('[class*="messages"]').first();await list.evaluate(el=>el.scrollTop=0);await page.waitForTimeout(100);
    assert.equal(await page.evaluate(()=>window.scrollY),0);
    await mkdir(path.join(root,'test-results'),{recursive:true});await page.screenshot({path:path.join(root,'test-results',`raven-${viewport.width}.png`)});
    await page.goto('http://localhost:3107/social-test?inbox=1');await page.getByRole('button',{name:'New Raven',exact:true}).click();await page.getByPlaceholder('Search @username').fill('bran');await page.getByRole('button',{name:/Brandon of the Rookery/}).waitFor();
    await page.goto('http://localhost:3107/social-test?profile=1');
    await page.getByRole('tab',{name:'Threads',exact:true}).click();await page.getByText('A member thread',{exact:true}).waitFor();
    await page.getByRole('tab',{name:'Replies',exact:true}).click();await page.getByText('No replies yet.',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Add friend',exact:false}).click();await page.getByRole('button',{name:'Cancel request',exact:true}).waitFor();await page.getByRole('button',{name:'Cancel request',exact:true}).click();
    await page.locator('input[name="banner"]').setInputFiles({name:'banner.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aTZkAAAAASUVORK5CYII=','base64')});
    await page.getByAltText('Banner preview').waitFor();await page.getByRole('button',{name:'Save profile',exact:true}).click();await page.getByText('Profile updated.',{exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Profile has no horizontal overflow');
    await page.close();console.log(`Raven UI ${viewport.width}x${viewport.height}: composer, send, failed draft, emoji, overflow, recipient search, profile banner, activity tabs and friend requests passed.`);
  }
}finally{
  await browser?.close();
  server?.kill();
  await unlink(path.join(fixture,'page.tsx'));await rmdir(fixture);
  for (const name of ['validator.ts','routes.d.ts']) await unlink(path.join(root,'.next','dev','types',name)).catch(e=>{if(e.code!=='ENOENT')throw e;});
}
