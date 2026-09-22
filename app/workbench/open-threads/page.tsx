import { isLuckAdmin } from "@/lib/adminAccess";
import { createClient } from "@/lib/supabase/server";
import { WorkbenchHeader } from "../WorkbenchShell";
import styles from "../workbench.module.css";
import OpenThreadsClient from "./OpenThreadsClient";
export default async function Page(){const isAdmin=await isLuckAdmin();const supabase=await createClient();const source=isAdmin?"story_threads":"story_threads_public";const{data}=await supabase.from(source).select("*").order("updated_at",{ascending:false});return <main className={styles.page}><WorkbenchHeader title="Open Threads">A living register of unresolved, dormant, and completed story continuity.</WorkbenchHeader><OpenThreadsClient initial={(data??[]) as never[]} isAdmin={isAdmin}/></main>}
