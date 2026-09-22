import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { isLuckAdmin } from "@/lib/adminAccess";
import { createClient } from "@/lib/supabase/server";
const fields=["title","description","status","character_ids","chapter_refs","date_opened","latest_development","private_gm_context"] as const;
async function admin(){if(!await isLuckAdmin())return null;return getCurrentProfile()}
export async function POST(request:Request){const profile=await admin();if(!profile)return NextResponse.json({error:"Forbidden"},{status:403});const body=await request.json();const payload=Object.fromEntries(fields.map(k=>[k,body[k]]));const supabase=await createClient();const{data,error}=await supabase.from("story_threads").insert({...payload,created_by:profile.id}).select("*").single();return error?NextResponse.json({error:error.message},{status:400}):NextResponse.json(data,{status:201})}
export async function PATCH(request:Request){if(!await admin())return NextResponse.json({error:"Forbidden"},{status:403});const body=await request.json();const payload=Object.fromEntries(fields.filter(k=>body[k]!==undefined).map(k=>[k,body[k]]));const supabase=await createClient();const{data,error}=await supabase.from("story_threads").update(payload).eq("id",body.id).select("*").single();return error?NextResponse.json({error:error.message},{status:400}):NextResponse.json(data)}
export async function DELETE(request:Request){if(!await admin())return NextResponse.json({error:"Forbidden"},{status:403});const{id}=await request.json();const supabase=await createClient();const{error}=await supabase.from("story_threads").delete().eq("id",id);return error?NextResponse.json({error:error.message},{status:400}):NextResponse.json({ok:true})}
