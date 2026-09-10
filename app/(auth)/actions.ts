"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";

export type AuthState = { error?: string; success?: string };
const usernamePattern = /^[a-z0-9][a-z0-9_-]{2,29}$/;
function message(error: string) {
  const value=error.toLowerCase();
  if(value.includes("invalid login")) return "The email or password is incorrect.";
  if(value.includes("email not confirmed")) return "Confirm your email before signing in.";
  if(value.includes("already registered")||value.includes("duplicate")||value.includes("unique")) return "That email or username is already in use.";
  if(value.includes("password")) return "Use a stronger password with at least 8 characters.";
  return "The request could not be completed. Please try again.";
}
export async function login(_:AuthState, form:FormData):Promise<AuthState>{
  const email=String(form.get("email")??"").trim(), password=String(form.get("password")??"");
  const {error}=await (await createClient()).auth.signInWithPassword({email,password}); if(error)return{error:message(error.message)}; redirect("/forum");
}
export async function register(_:AuthState, form:FormData):Promise<AuthState>{
  const username=String(form.get("username")??"").trim().toLowerCase();
  const displayName=String(form.get("displayName")??"").trim(), email=String(form.get("email")??"").trim(), password=String(form.get("password")??"");
  if(!usernamePattern.test(username))return{error:"Username must be 3–30 lowercase letters, numbers, underscores, or hyphens, and start with a letter or number."};
  if(!displayName||displayName.length>60)return{error:"Display name must be between 1 and 60 characters."};
  if(password.length<8)return{error:"Password must contain at least 8 characters."};
  const supabase=await createClient(); const {data:existing}=await supabase.from("profiles").select("id").eq("username",username).maybeSingle();
  if(existing)return{error:"That username is already taken."};
  const {data,error}=await supabase.auth.signUp({email,password,options:{data:{username,display_name:displayName},emailRedirectTo:`${getSiteUrl()}/auth/confirm`}});
  if(error)return{error:message(error.message)};
  if(!data.session)return{success:"Your account has been created. Check your email and follow the confirmation link before signing in."};
  redirect("/forum");
}
export async function forgotPassword(_:AuthState,form:FormData):Promise<AuthState>{
  const email=String(form.get("email")??"").trim(); const {error}=await (await createClient()).auth.resetPasswordForEmail(email,{redirectTo:`${getSiteUrl()}/auth/confirm?next=/reset-password`});
  return error?{error:message(error.message)}:{success:"If an account exists for that email, a reset link is on its way."};
}
export async function updatePassword(_:AuthState,form:FormData):Promise<AuthState>{
  const password=String(form.get("password")??""); if(password.length<8)return{error:"Password must contain at least 8 characters."};
  const {error}=await (await createClient()).auth.updateUser({password}); if(error)return{error:message(error.message)}; redirect("/settings?password=updated");
}
export async function logout(){ await (await createClient()).auth.signOut(); redirect("/"); }
