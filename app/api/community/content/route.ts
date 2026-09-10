import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import forum from "@/data/forum.json";
import gallery from "@/data/gallery.json";
const schema=z.discriminatedUnion("kind",[
 z.object({kind:z.literal("thread"),title:z.string().trim().min(3).max(140),body:z.string().trim().min(1).max(10000),category:z.string().trim().min(1).max(60).default("Community")}),
 z.object({kind:z.literal("post"),threadId:z.string().min(1).max(160),parentId:z.string().min(1).max(160).nullable().optional(),body:z.string().trim().min(1).max(10000)}),
 z.object({kind:z.literal("raven"),entryId:z.string().min(1).max(160),parentId:z.string().min(1).max(160).nullable().optional(),body:z.string().trim().min(1).max(4000)})
]);
export async function POST(request:Request){
 const supabase=await createClient(),{data:{user}}=await supabase.auth.getUser(); if(!user)return NextResponse.json({error:"Sign in to join the discussion."},{status:401});
 const {data:profile}=await supabase.from("profiles").select("id").eq("id",user.id).maybeSingle();
 if(!profile){const {error:profileError}=await supabase.rpc("ensure_own_profile");if(profileError){console.error("Profile repair failed",{code:profileError.code,message:profileError.message});return NextResponse.json({error:"Your member profile is not ready. Apply the latest database migration and try again."},{status:409});}}
 const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Check the required fields and length limits."},{status:400});
 const input=parsed.data; let result:{error:{message:string;code?:string}|null};
 if(input.kind==="thread")result=await supabase.from("forum_threads").insert({title:input.title,body:input.body,category:input.category,author_type:"user",user_author_id:user.id});
 else if(input.kind==="post"){
  const staticThread=forum.threads.some(t=>t.id===input.threadId);const {data:liveThread}=staticThread?{data:null}:await supabase.from("forum_threads").select("id,is_locked").eq("id",input.threadId).maybeSingle();
  if(!staticThread&&(!liveThread||liveThread.is_locked))return NextResponse.json({error:"This discussion is unavailable or locked."},{status:404});
  result=await supabase.from("forum_posts").insert({thread_id:input.threadId,parent_id:input.parentId??null,body:input.body,author_type:"user",user_author_id:user.id});
 } else {
  if(!gallery.some(entry=>entry.id===input.entryId))return NextResponse.json({error:"This Raven’s Eye entry is unavailable."},{status:404});
  result=await supabase.from("raven_comments").insert({entry_id:input.entryId,parent_id:input.parentId??null,body:input.body,author_type:"user",user_author_id:user.id});
 }
 if(result.error){console.error("Community insert failed",{code:result.error.code,message:result.error.message});return NextResponse.json({error:result.error.code==="42501"?"Your session does not have permission to post. Sign out and sign in again.":"Your contribution could not be saved. Please try again."},{status:400});}return NextResponse.json({ok:true},{status:201});
}
export async function DELETE(request:Request){const supabase=await createClient(),{data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Sign in required."},{status:401});const body=await request.json().catch(()=>null) as {kind?:string;id?:string}|null;if(!body?.id||!["thread","post","raven"].includes(body.kind??""))return NextResponse.json({error:"Invalid request."},{status:400});const table=body.kind==="thread"?"forum_threads":body.kind==="post"?"forum_posts":"raven_comments";const {error}=await supabase.from(table).delete().eq("id",body.id);return error?NextResponse.json({error:"Not permitted."},{status:403}):NextResponse.json({ok:true});}
export async function PATCH(request:Request){const supabase=await createClient(),{data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Sign in required."},{status:401});const body=await request.json().catch(()=>null) as {kind?:string;id?:string;body?:string}|null;const limit=body?.kind==="raven"?4000:10000;if(!body?.id||!["thread","post","raven"].includes(body.kind??"")||!body.body?.trim()||body.body.length>limit)return NextResponse.json({error:"Invalid request."},{status:400});const table=body.kind==="thread"?"forum_threads":body.kind==="post"?"forum_posts":"raven_comments";const {error}=await supabase.from(table).update({body:body.body.trim()}).eq("id",body.id);return error?NextResponse.json({error:"Not permitted."},{status:403}):NextResponse.json({ok:true});}
