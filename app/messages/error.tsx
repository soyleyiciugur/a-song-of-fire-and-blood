"use client";
import Link from "next/link";
import RavenIcon from "@/components/direct-raven/RavenIcon";
import styles from "@/components/direct-raven/direct-raven.module.css";
export default function RavenError({ unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  return <main className={styles.page}><section className={styles.errorPanel}><RavenIcon size={48} /><h1>The rookery could not be reached.</h1><p>Your correspondence is still there. Please try again.</p><button className={styles.sendRavenButton} onClick={unstable_retry}>Try again</button><Link href="/messages">Back to inbox</Link></section></main>;
}
