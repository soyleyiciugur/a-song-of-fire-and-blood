// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\admin\content-sync\page.tsx

"use client";

import { useState, useCallback, useMemo } from "react";
import styles from "./content-sync.module.css";

const DETECTION_TYPES = [
  { value: "characters", label: "Characters", icon: "👤" },
  { value: "houses", label: "Houses", icon: "🛡" },
  { value: "timeline", label: "Timeline events", icon: "📅" },
  { value: "events", label: "Named events", icon: "🎉" },
  { value: "map", label: "Map movements", icon: "📍" },
  { value: "dragons", label: "Dragons", icon: "🔥" },
  { value: "dates", label: "World dates", icon: "🗓" },
  { value: "relationships", label: "Relationships", icon: "🤝" },
  { value: "quotes", label: "Quotes", icon: "💬" },
] as const;

const TYPE_VALUES = DETECTION_TYPES.map((t) => t.value);
type DetectionType = (typeof TYPE_VALUES)[number];

type Confidence = "high" | "medium" | "low";

type FieldDiff = {
  old?: string | null;
  new?: string | null;
  note?: string;
};

type Change = {
  type: DetectionType;
  operation: "new" | "update" | "note";
  subject: string;
  slug?: string;
  confidence?: Confidence;
  fields?: Record<string, FieldDiff>;
  value?: Record<string, unknown>;
  note?: string;
  _idx: number;
};

type AnalysisResult = {
  summary: string;
  changes: Change[];
};

const KEY_LABELS = ["Key 1", "Key 2", "Key 3", "Key 4", "Key 5"];

const CONFIDENCE_ORDER: Record<Confidence, number> = { high: 0, medium: 1, low: 2 };
const CONFIDENCE_LABEL: Record<Confidence, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence — review",
};

// Mirrors the backend's TYPE_FILE_MAP — the primary (writable) file for each
// detection type, used to merge accepted changes back into the original file.
const TYPE_PRIMARY_FILE: Record<string, string> = {
  characters: "characters/characters.json",
  houses: "houses.json",
  dragons: "dragons.json",
  timeline: "timeline.json",
  events: "events.json",
  map: "map/character-positions.json",
  dates: "worldDate.json",
  relationships: "characters/characters.json",
  quotes: "quotes.json",
};

function idKeyOf(record: unknown): string | undefined {
  if (record && typeof record === "object") {
    const r = record as Record<string, unknown>;
    if (typeof r.id === "string") return r.id;
    if (typeof r.chapterSlug === "string") return r.chapterSlug;
    if (typeof r.character === "string") return r.character;
  }
  return undefined;
}

// Merges accepted changes' `value` objects into the original file content pulled
// from GitHub, so the push reflects the real file plus these changes rather than
// just the diff. Falls back gracefully for shapes it doesn't recognize.
function mergeChangesIntoFile(originalContent: string, changes: Change[]): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(originalContent);
  } catch {
    parsed = null;
  }

  const values = changes.map((c) => c.value).filter((v): v is Record<string, unknown> => v != null);

  if (Array.isArray(parsed)) {
    const arr = [...parsed];
    for (const value of values) {
      const key = idKeyOf(value);
      const idx = key ? arr.findIndex((item) => idKeyOf(item) === key) : -1;
      if (idx >= 0) arr[idx] = value;
      else arr.push(value);
    }
    return JSON.stringify(arr, null, 2);
  }

  if (parsed && typeof parsed === "object") {
    // Single-object file (e.g. worldDate.json) — last accepted change wins.
    const merged = values.length ? values[values.length - 1] : parsed;
    return JSON.stringify(merged, null, 2);
  }

  // No valid original content (or nothing fetched) — fall back to just the values.
  return JSON.stringify(values.length === 1 ? values[0] : values, null, 2);
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ContentSyncPage() {
  const [chapterText, setChapterText] = useState("");
  const [chapterSlug, setChapterSlug] = useState("");
  const [jsonContext, setJsonContext] = useState("");
  const [useGithub, setUseGithub] = useState(false);
  const [githubRepo, setGithubRepo] = useState("soyleyiciugur/a-song-of-fire-and-blood");
  const [githubBranch, setGithubBranch] = useState("main");
  const [githubDataDir, setGithubDataDir] = useState("data");
  const [selectedTypes, setSelectedTypes] = useState<DetectionType[]>([
    "characters",
    "houses",
    "timeline",
    "events",
    "map",
    "dragons",
    "dates",
    "relationships",
    "quotes",
  ]);
  const [activeKeyIndex, setActiveKeyIndex] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [githubMeta, setGithubMeta] = useState<{
    repo: string;
    branch: string;
    files: { path: string; ok: boolean; error: string | null }[];
  } | null>(null);
  const [rawGithubFiles, setRawGithubFiles] = useState<Record<string, string>>({});
  const [pushStatus, setPushStatus] = useState<Record<string, { state: "pushing" | "done" | "error"; message?: string }>>({});
  const [rejected, setRejected] = useState<Set<number>>(new Set());
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);

  const toggleType = (type: DetectionType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleExpand = (idx: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const setAccepted = (idx: number, accept: boolean) => {
    setRejected((prev) => {
      const next = new Set(prev);
      if (accept) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const updateChangeField = (idx: number, updater: (c: Change) => Change) => {
    setResult((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        changes: prev.changes.map((c) => (c._idx === idx ? updater(c) : c)),
      };
    });
  };

  const analyze = useCallback(async () => {
    if (!chapterText.trim()) {
      setError("Paste your chapter text first.");
      return;
    }
    if (!selectedTypes.length) {
      setError("Select at least one detection type.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setRejected(new Set());
    setExpanded(new Set());
    setGithubMeta(null);

    try {
      const res = await fetch("/api/admin/content-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapter: chapterText,
          slug: chapterSlug,
          jsonContext,
          types: selectedTypes,
          keyIndex: activeKeyIndex,
          useGithub,
          githubRepo,
          githubBranch,
          githubDataDir,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "API error");
      }

      const changes: Change[] = (data.changes ?? []).map(
        (c: Omit<Change, "_idx">, i: number) => ({ confidence: "medium", ...c, _idx: i })
      );
      setResult({ summary: data.summary ?? "", changes });
      if (data._meta?.github) {
        setGithubMeta(data._meta.github);
        const raw: Record<string, string> = {};
        for (const f of data._meta.github.files ?? []) {
          if (f.ok && f.content) raw[f.path] = f.content;
        }
        setRawGithubFiles(raw);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [chapterText, chapterSlug, jsonContext, selectedTypes, activeKeyIndex, useGithub, githubRepo, githubBranch, githubDataDir]);

  const acceptedChanges = useMemo(
    () => result?.changes.filter((c) => !rejected.has(c._idx)) ?? [],
    [result, rejected]
  );

  const jsonOutput = JSON.stringify({ changes: acceptedChanges }, null, 2);

  const copyJson = () => {
    navigator.clipboard.writeText(jsonOutput).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const reset = () => {
    setChapterText("");
    setChapterSlug("");
    setJsonContext("");
    setResult(null);
    setError(null);
    setRejected(new Set());
    setExpanded(new Set());
  };

  const grouped = useMemo(() => {
    if (!result) return {};
    return result.changes.reduce<Record<string, Change[]>>((acc, c) => {
      if (!acc[c.type]) acc[c.type] = [];
      acc[c.type].push(c);
      return acc;
    }, {});
  }, [result]);

  const downloadAll = () => {
    downloadJson(
      `content-sync-all-${chapterSlug || "chapter"}.json`,
      { summary: result?.summary, changes: result?.changes ?? [] }
    );
  };

  const downloadSelected = () => {
    downloadJson(
      `content-sync-accepted-${chapterSlug || "chapter"}.json`,
      { summary: result?.summary, changes: acceptedChanges }
    );
  };

  const pushCategoryToGithub = async (type: string, changes: Change[]) => {
    const accepted = changes.filter((c) => !rejected.has(c._idx));
    const withValue = accepted.filter((c) => c.value !== undefined);

    if (withValue.length === 0) {
      window.alert(`No accepted changes with a mergeable value for "${type}".`);
      return;
    }

    const path = `${githubDataDir}/${TYPE_PRIMARY_FILE[type] ?? `${type}.json`}`.replace(/\/+/g, "/");
    const original = rawGithubFiles[TYPE_PRIMARY_FILE[type] ?? ""] ?? "";

    if (!original) {
      window.alert(
        `Couldn't find the original fetched content for ${path}. Make sure "Pull latest JSON files from GitHub" was on and this file loaded successfully before analyzing.`
      );
      return;
    }

    const merged = mergeChangesIntoFile(original, withValue);

    const confirmed = window.confirm(
      `This will commit ${withValue.length} accepted change(s) directly to:\n\n${githubRepo}@${githubBranch}\n${path}\n\nThis writes to your repository. Continue?`
    );
    if (!confirmed) return;

    setPushStatus((prev) => ({ ...prev, [type]: { state: "pushing" } }));
    try {
      const res = await fetch("/api/admin/content-sync/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo: githubRepo,
          branch: githubBranch,
          path,
          content: merged,
          message: `content-sync: update ${TYPE_PRIMARY_FILE[type]} (${chapterSlug || "chapter"})`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Push failed");
      setPushStatus((prev) => ({
        ...prev,
        [type]: { state: "done", message: data.commitUrl },
      }));
    } catch (err: unknown) {
      setPushStatus((prev) => ({
        ...prev,
        [type]: { state: "error", message: err instanceof Error ? err.message : "Unknown error" },
      }));
    }
  };

  const downloadCategory = (type: string, changes: Change[]) => {
    const accepted = changes.filter((c) => !rejected.has(c._idx));
    const withValue = accepted.filter((c) => c.value !== undefined);

    if (withValue.length > 0) {
      const values = withValue.map((c) => c.value);
      // Most category files (characters.json, houses.json, dragons.json, quotes.json...)
      // are a top-level array of records; worldDate.json is a single object. Match that shape
      // directly so this can be pasted/merged straight into the real file.
      downloadJson(`content-sync-${type}.json`, values.length === 1 ? values[0] : values);
    } else {
      // Nothing mergeable (note-only category) — export the raw changes for reference.
      downloadJson(`content-sync-${type}.json`, { changes: accepted });
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Content sync</h1>
          <p className={styles.subtitle}>
            Paste a chapter and extract structured diffs for your JSON data files.
          </p>
        </div>

        <div className={styles.keyRow}>
          <span className={styles.keyLabel}>API key</span>
          {KEY_LABELS.map((label, i) => (
            <button
              key={i}
              className={`${styles.keyBtn} ${activeKeyIndex === i ? styles.keyBtnActive : ""}`}
              onClick={() => setActiveKeyIndex(i)}
              title={`Use ANTHROPIC_API_KEY${i === 0 ? "" : `_${i + 1}`}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>Chapter text</label>
          <textarea
            className={styles.textarea}
            rows={8}
            placeholder="Paste your chapter prose here..."
            value={chapterText}
            onChange={(e) => setChapterText(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Chapter slug / title (optional)</label>
          <input
            className={styles.input}
            type="text"
            placeholder="e.g. the-viper-in-silk or Chapter VIII"
            value={chapterSlug}
            onChange={(e) => setChapterSlug(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>GitHub data source</label>
          <div className={styles.githubToggleRow}>
            <button
              type="button"
              className={`${styles.typeChip} ${useGithub ? styles.typeChipActive : ""}`}
              onClick={() => setUseGithub((v) => !v)}
            >
              {useGithub ? "✓ " : ""}Pull latest JSON files from GitHub
            </button>
          </div>
          {useGithub && (
            <div className={styles.githubFields}>
              <input
                className={styles.input}
                type="text"
                placeholder="owner/repo, e.g. locpick-13/a-song-of-fire-and-blood"
                value={githubRepo}
                onChange={(e) => setGithubRepo(e.target.value)}
              />
              <div className={styles.githubFieldsRow}>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="branch (default: main)"
                  value={githubBranch}
                  onChange={(e) => setGithubBranch(e.target.value)}
                />
                <input
                  className={styles.input}
                  type="text"
                  placeholder="data directory (default: data)"
                  value={githubDataDir}
                  onChange={(e) => setGithubDataDir(e.target.value)}
                />
              </div>
              <p className={styles.hint}>
                Fetches the current characters.json, houses.json, etc. straight from this repo/branch/path for
                every selected type below, and uses them as the reference context automatically. Requires a
                GITHUB_TOKEN in .env.local for private repos.
              </p>
            </div>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Existing JSON context (optional, supplements GitHub)</label>
          <textarea
            className={styles.textarea}
            rows={5}
            placeholder="Paste relevant JSON here — characters.json, houses.json, timeline.json, etc."
            value={jsonContext}
            onChange={(e) => setJsonContext(e.target.value)}
          />
          <p className={styles.hint}>
            Paste your existing data so the AI can distinguish new entries from
            updates. If GitHub pulling is on, this is added on top of the fetched files.
          </p>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>What to detect</label>
          <div className={styles.typeGrid}>
            {DETECTION_TYPES.map(({ value, label, icon }) => (
              <button
                key={value}
                className={`${styles.typeChip} ${selectedTypes.includes(value) ? styles.typeChipActive : ""}`}
                onClick={() => toggleType(value)}
                type="button"
              >
                <span>{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.btnPrimary}
            onClick={analyze}
            disabled={loading}
          >
            {loading ? "Analyzing..." : "Analyze chapter"}
          </button>
          {result && (
            <button className={styles.btnSecondary} onClick={reset}>
              Reset
            </button>
          )}
        </div>

        {error && <p className={styles.errorMsg}>{error}</p>}
      </div>

      {result && (
        <div className={styles.results}>
          {githubMeta && (
            <div className={styles.githubStatus}>
              <span className={styles.githubStatusLabel}>
                GitHub source: {githubMeta.repo}@{githubMeta.branch}
              </span>
              <div className={styles.githubStatusFiles}>
                {githubMeta.files.map((f) => (
                  <span
                    key={f.path}
                    className={`${styles.githubFileBadge} ${f.ok ? styles.githubFileOk : styles.githubFileFail}`}
                    title={f.error ?? "fetched"}
                  >
                    {f.ok ? "✓" : "✕"} {f.path}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className={styles.resultsHeader}>
            <h2 className={styles.resultsTitle}>Detected changes</h2>
            <div className={styles.resultsHeaderActions}>
              <span className={styles.badge}>
                {acceptedChanges.length} / {result.changes.length} accepted
              </span>
              <button className={styles.btnSecondary} onClick={downloadAll}>
                Download all
              </button>
              <button className={styles.btnSecondary} onClick={downloadSelected}>
                Download accepted
              </button>
            </div>
          </div>

          {result.summary && (
            <p className={styles.summary}>{result.summary}</p>
          )}

          {Object.entries(grouped).map(([type, changes]) => {
            const sorted = [...changes].sort(
              (a, b) =>
                CONFIDENCE_ORDER[a.confidence ?? "medium"] -
                CONFIDENCE_ORDER[b.confidence ?? "medium"]
            );
            return (
              <div key={type} className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitle}>
                    {DETECTION_TYPES.find((t) => t.value === type)?.icon}{" "}
                    {type}
                    <span className={styles.sectionCount}>{changes.length}</span>
                  </div>
                  <div className={styles.sectionHeaderActions}>
                    <button
                      className={styles.miniBtn}
                      onClick={() => downloadCategory(type, changes)}
                    >
                      Download {type}.json
                    </button>
                    {useGithub && githubRepo && (
                      <button
                        className={styles.miniBtn}
                        onClick={() => pushCategoryToGithub(type, changes)}
                        disabled={pushStatus[type]?.state === "pushing"}
                      >
                        {pushStatus[type]?.state === "pushing"
                          ? "Pushing..."
                          : `Push ${type}.json to GitHub`}
                      </button>
                    )}
                  </div>
                </div>
                {pushStatus[type]?.state === "done" && (
                  <p className={styles.pushSuccess}>
                    Pushed.{" "}
                    {pushStatus[type]?.message && (
                      <a href={pushStatus[type]?.message} target="_blank" rel="noreferrer">
                        View commit
                      </a>
                    )}
                  </p>
                )}
                {pushStatus[type]?.state === "error" && (
                  <p className={styles.pushError}>Push failed: {pushStatus[type]?.message}</p>
                )}
                {sorted.map((ch) => {
                  const isRejected = rejected.has(ch._idx);
                  const isExpanded = expanded.has(ch._idx);
                  const conf: Confidence = ch.confidence ?? "medium";
                  return (
                    <div
                      key={ch._idx}
                      className={`${styles.card} ${isRejected ? styles.cardRejected : ""}`}
                    >
                      <div
                        className={styles.cardHeader}
                        onClick={() => toggleExpand(ch._idx)}
                      >
                        <div className={styles.cardTitle}>
                          <span
                            className={`${styles.opBadge} ${
                              ch.operation === "new"
                                ? styles.opNew
                                : ch.operation === "update"
                                ? styles.opUpdate
                                : styles.opNote
                            }`}
                          >
                            {ch.operation}
                          </span>
                          <span
                            className={`${styles.confBadge} ${styles["conf" + conf.charAt(0).toUpperCase() + conf.slice(1)]}`}
                            title={CONFIDENCE_LABEL[conf]}
                          >
                            {conf}
                          </span>
                          {ch.subject}
                          {ch.slug && (
                            <span className={styles.slug}>[{ch.slug}]</span>
                          )}
                        </div>
                        <div
                          className={styles.cardActions}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${!isRejected ? styles.actionAccept : ""}`}
                            onClick={() => setAccepted(ch._idx, true)}
                          >
                            ✓ Accept
                          </button>
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${isRejected ? styles.actionReject : ""}`}
                            onClick={() => setAccepted(ch._idx, false)}
                          >
                            ✕ Reject
                          </button>
                          <span className={styles.expandIcon}>
                            {isExpanded ? "▲" : "▼"}
                          </span>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className={styles.cardBody}>
                          <div className={styles.diffRow}>
                            <span className={styles.diffKey}>subject</span>
                            <input
                              className={styles.editInput}
                              value={ch.subject}
                              onChange={(e) =>
                                updateChangeField(ch._idx, (c) => ({
                                  ...c,
                                  subject: e.target.value,
                                }))
                              }
                            />
                          </div>
                          {ch.value && (
                            <div className={styles.diffRow}>
                              <span className={styles.diffKey}>value</span>
                              <textarea
                                className={styles.editTextarea}
                                rows={4}
                                defaultValue={JSON.stringify(ch.value, null, 2)}
                                onBlur={(e) => {
                                  try {
                                    const parsed = JSON.parse(e.target.value);
                                    updateChangeField(ch._idx, (c) => ({
                                      ...c,
                                      value: parsed,
                                    }));
                                  } catch {
                                    // leave as-is on invalid JSON; user can keep editing
                                  }
                                }}
                              />
                            </div>
                          )}
                          {ch.fields &&
                            Object.entries(ch.fields).map(([key, diff]) => (
                              <div key={key} className={styles.diffRow}>
                                <span className={styles.diffKey}>{key}</span>
                                <div className={styles.diffVals}>
                                  {diff.old != null && diff.old !== diff.new && (
                                    <span className={styles.diffOld}>
                                      {String(diff.old)}
                                    </span>
                                  )}
                                  <input
                                    className={styles.editInput}
                                    value={
                                      typeof diff.new === "object"
                                        ? JSON.stringify(diff.new)
                                        : diff.new ?? ""
                                    }
                                    onChange={(e) =>
                                      updateChangeField(ch._idx, (c) => ({
                                        ...c,
                                        fields: {
                                          ...c.fields,
                                          [key]: { ...diff, new: e.target.value },
                                        },
                                      }))
                                    }
                                  />
                                  {diff.note && (
                                    <span className={styles.diffNote}>
                                      {diff.note}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          {ch.note && (
                            <div className={styles.diffRow}>
                              <span className={styles.diffKey}>note</span>
                              <span className={styles.diffNote}>{ch.note}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          <div className={styles.outputSection}>
            <div className={styles.outputHeader}>
              <span className={styles.outputLabel}>
                Accepted changes — copy and apply to your JSON files
              </span>
              <button className={styles.btnSecondary} onClick={copyJson}>
                {copied ? "Copied!" : "Copy JSON"}
              </button>
            </div>
            <pre className={styles.jsonOutput}>{jsonOutput}</pre>
          </div>
        </div>
      )}
    </div>
  );
}