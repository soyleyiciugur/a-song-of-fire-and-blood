"use client";

import { useState } from "react";
import type { CharacterStatus } from "@/types/character";

import styles from "./statusReveal.module.css";

const statusMap: Record<
  CharacterStatus,
  { label: string; color: string; icon: string }
> = {
  Alive: { label: "Alive", color: "#39d353", icon: "●" },
  Dead: { label: "Dead", color: "#f85149", icon: "✕" },
  Missing: { label: "Missing", color: "#f59e0b", icon: "?" },
  Unknown: { label: "Unknown", color: "#8b949e", icon: "–" },
};

export type StatusSecret = {
  status: CharacterStatus;
  note: string;
};

type Props = {
  status: CharacterStatus;
  secret?: StatusSecret;
};

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }

  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.3 20.3 0 0 1 5.06-5.94M9.9 4.24A9.13 9.13 0 0 1 12 4c7 0 11 8 11 8a20.3 20.3 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default function StatusReveal({ status, secret }: Props) {
  const [revealed, setRevealed] = useState(false);

  const publicItem = statusMap[status];

  const effectiveSecret: StatusSecret = secret ?? {
    status,
    note: "This is common knowledge across the realm — there is no hidden truth here.",
  };

  const secretItem = statusMap[effectiveSecret.status];
  const isRealSecret = Boolean(secret);

  return (
    <div>
      <div className={styles.row}>
        <div className={styles.labelStack}>
          <span
            className={`${styles.label} ${
              revealed ? styles.labelHidden : styles.labelVisible
            }`}
            style={{ color: publicItem.color }}
          >
            <span className={styles.icon}>{publicItem.icon}</span>
            {publicItem.label}
          </span>

          <span
            className={`${styles.label} ${
              revealed ? styles.labelVisible : styles.labelHidden
            }`}
            style={{ color: secretItem.color }}
          >
            <span className={styles.icon}>{secretItem.icon}</span>
            {secretItem.label}
          </span>
        </div>

        <button
          type="button"
          className={styles.eyeButton}
          onClick={() => setRevealed((r) => !r)}
          aria-label={
            revealed ? "Hide the true status" : "Reveal the true status"
          }
          aria-pressed={revealed}
          title={revealed ? "Hide the true status" : "Reveal the true status"}
        >
          <EyeIcon open={revealed} />
        </button>
      </div>

      {revealed && (
        <p
          className={`${styles.note} ${
            isRealSecret ? styles.noteSecret : styles.noteConfirmed
          }`}
        >
          {effectiveSecret.note}
        </p>
      )}
    </div>
  );
}
