"use client";
import { useActionState } from "react";
import Link from "next/link";
import type { AuthState } from "./actions";
import styles from "./auth.module.css";
type Field={name:string;label:string;type?:string;autoComplete?:string;minLength?:number;maxLength?:number;pattern?:string};
export default function AuthForm({title,intro,action,fields,submit,footer}:{title:string;intro:string;action:(state:AuthState,data:FormData)=>Promise<AuthState>;fields:Field[];submit:string;footer?:{text:string;href:string;label:string}}){
 const [state,formAction,pending]=useActionState(action,{});
 return <main className={styles.page}><section className={styles.panel}><p className={styles.eyebrow}>THE REALM REMEMBERS</p><h1>{title}</h1><p>{intro}</p><form action={formAction}>{fields.map(f=><label key={f.name}>{f.label}<input required {...f}/></label>)}{state.error&&<p className={styles.error} role="alert">{state.error}</p>}{state.success&&<p className={styles.success} role="status">{state.success}</p>}<button disabled={pending}>{pending?"Please wait…":submit}</button></form>{footer&&<p className={styles.footer}>{footer.text} <Link href={footer.href}>{footer.label}</Link></p>}</section></main>;
}
