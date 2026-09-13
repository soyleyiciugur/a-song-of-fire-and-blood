"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { getCharacters } from "@/lib/characters";

import styles from "./characters.module.css";

const ROYAL_PARENT_IDS = ["baelenys-targaryen", "jaery-targaryen"] as const;

const SUCCESSION_IDS = [
  "visenor-targaryen",
  "gaelor-targaryen",
  "jacaelon-targaryen",
  "saera-targaryen",
  "maela-targaryen",
  "vhaemys-targaryen",
] as const;

const SUCCESSION_NUMERALS = ["I", "II", "III", "IV", "V", "VI"] as const;

const ROYAL_IDS = new Set<string>([
  ...ROYAL_PARENT_IDS,
  ...SUCCESSION_IDS,
]);

type StatusFilter = "all" | "Alive" | "Dead" | "Missing" | "Unknown";
type SortMode = "name" | "house";

type SelectOption = {
  value: string;
  label: string;
};

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "Alive", label: "Alive" },
  { value: "Dead", label: "Dead" },
  { value: "Missing", label: "Missing" },
  { value: "Unknown", label: "Unknown" },
];

function displayName(name: string) {
  return name.replace(/^(Ser|Mother)\s+/i, "").trim();
}

function sortableName(name: string) {
  return displayName(name).toLocaleLowerCase("en");
}

function houseLabel(house: string) {
  return house === "-" ? "Unaffiliated" : house.replace(/^House\s+/i, "");
}

const MINI_PORTRAIT_EXTS = ["webp", "png", "jpg", "jpeg"] as const;

function formatNickname(nickname?: string | null) {
  if (!nickname || nickname === "-") return null;

  const clean = nickname
    .trim()
    .replace(/^[\s"'“”‘’]+|[\s"'“”‘’]+$/g, "");

  return clean || null;
}

function Nickname({ value }: { value: string }) {
  return (
    <span className={styles.nickname}>
      <span aria-hidden="true">&quot;</span>
      <span className={styles.nicknameText}>{value}</span>
      <span aria-hidden="true">&quot;</span>
    </span>
  );
}

function RawMiniPortrait({
  id,
  alt,
  size,
}: {
  id: string;
  alt: string;
  size: number;
}) {
  const [extIndex, setExtIndex] = useState(0);

  const src =
    extIndex >= MINI_PORTRAIT_EXTS.length
      ? "/images/miniportraits/default.webp"
      : `/images/miniportraits/${id}.${MINI_PORTRAIT_EXTS[extIndex]}`;

  const onError =
    extIndex <= MINI_PORTRAIT_EXTS.length - 1
      ? () => setExtIndex((current) => current + 1)
      : undefined;

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={styles.rawMiniPortrait}
      draggable={false}
      decoding="async"
      onError={onError}
    />
  );
}

function StyledSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      const root = rootRef.current;
      if (root && !root.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className={styles.selectWrap} ref={rootRef}>
      <span className={styles.controlLabel}>{label}</span>

      <div className={styles.styledSelect}>
        <button
          type="button"
          className={`${styles.selectTrigger} ${open ? styles.selectTriggerOpen : ""}`}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          <span>{selected?.label ?? "—"}</span>
          <span className={styles.selectChevron} aria-hidden="true">
            ◆
          </span>
        </button>

        {open && (
          <div className={styles.selectMenu} role="listbox" aria-label={label}>
            {options.map((option) => {
              const active = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`${styles.selectOption} ${
                    active ? styles.selectOptionActive : ""
                  }`}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <span>{option.label}</span>
                  {active && (
                    <span className={styles.selectOptionMark} aria-hidden="true">
                      ✦
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Characters() {
  const characters = useMemo(
    () => getCharacters().filter((character) => !character.hidden),
    []
  );

  const byId = useMemo(
    () => new Map(characters.map((character) => [character.id, character])),
    [characters]
  );

  const royalParents = ROYAL_PARENT_IDS.map((id) => byId.get(id)).filter(
    Boolean
  );

  const succession = SUCCESSION_IDS.map((id) => byId.get(id)).filter(Boolean);

  const otherCharacters = useMemo(
    () => characters.filter((character) => !ROYAL_IDS.has(character.id)),
    [characters]
  );

  const houses = useMemo(
    () =>
      Array.from(
        new Set(
          otherCharacters
            .map((character) => character.house)
            .filter((house) => house && house !== "-")
        )
      ).sort((a, b) => houseLabel(a).localeCompare(houseLabel(b))),
    [otherCharacters]
  );

  const [query, setQuery] = useState("");
  const [houseFilter, setHouseFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortMode>("name");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const visibleCharacters = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("en");

    return otherCharacters
      .filter((character) => {
        if (statusFilter !== "all" && character.status !== statusFilter) {
          return false;
        }

        if (houseFilter !== "all" && character.house !== houseFilter) {
          return false;
        }

        if (!normalizedQuery) return true;

        const haystack = [
          displayName(character.name),
          character.nickname !== "-" ? character.nickname : "",
          character.house !== "-" ? character.house : "",
          character.title !== "-" ? character.title : "",
        ]
          .join(" ")
          .toLocaleLowerCase("en");

        return haystack.includes(normalizedQuery);
      })
      .sort((a, b) => {
        if (sortBy === "house") {
          const houseCompare = houseLabel(a.house).localeCompare(
            houseLabel(b.house),
            "en",
            { sensitivity: "base" }
          );

          if (houseCompare !== 0) return houseCompare;
        }

        return sortableName(a.name).localeCompare(sortableName(b.name), "en", {
          sensitivity: "base",
        });
      });
  }, [otherCharacters, houseFilter, query, sortBy, statusFilter]);

  const houseOptions = useMemo<SelectOption[]>(
    () => [
      { value: "all", label: "All houses" },
      ...houses.map((house) => ({ value: house, label: houseLabel(house) })),
    ],
    [houses]
  );

  const sortOptions: SelectOption[] = [
    { value: "name", label: "Name A–Z" },
    { value: "house", label: "House A–Z" },
  ];

  return (
    <main className="page-shell">
      <div className="page-shell-inner">
        <header className={styles.pageHeader}>
          <div>
            <h1 className="page-heading realm-page-title">Characters</h1>
            <p className="page-subheading">
              The blood of the Crown, and every other soul moving through the
              realm.
            </p>
          </div>

          <nav className={styles.utilityNav} aria-label="Character maps">
            <Link href="/family-tree" className={styles.utilityLink}>
              <span className={styles.utilityIcon}>♧</span>
              Family Tree
            </Link>
            <Link href="/relationships" className={styles.utilityLink}>
              <span className={styles.utilityIcon}>✦</span>
              Relationships
            </Link>
          </nav>
        </header>

        <section className={styles.crownSection}>
          <div className={styles.sectionHeadingRow}>
            <div>
              <span className={styles.eyebrow}>The Royal Family</span>
              <h2 className={styles.sectionTitle}>The Crown</h2>
            </div>
            <span className={styles.sectionNote}>Line of Succession</span>
          </div>

          <div className={styles.crownPair}>
            {royalParents.map((character, index) =>
              character ? (
                <Link
                  key={character.id}
                  href={`/characters/${character.id}`}
                  className={styles.crownCard}
                >
                  <span className={styles.crownGlyph} aria-hidden="true">
                    ♛
                  </span>
                  <RawMiniPortrait
                    id={character.id}
                    alt={character.name}
                    size={62}
                  />
                  <span className={styles.crownIdentity}>
                    <strong>{displayName(character.name)}</strong>
                    <small>{index === 0 ? "King" : "Queen"}</small>
                  </span>
                </Link>
              ) : null
            )}
          </div>

          <div className={styles.successionLine}>
            {succession.map((character, index) =>
              character ? (
                <Link
                  key={character.id}
                  href={`/characters/${character.id}`}
                  className={styles.successionCard}
                >
                  <span className={styles.successionNumber}>
                    <span>{SUCCESSION_NUMERALS[index]}</span>
                  </span>
                  <RawMiniPortrait
                    id={character.id}
                    alt={character.name}
                    size={46}
                  />
                  <span className={styles.successionIdentity}>
                    <strong>{displayName(character.name)}</strong>
                    {formatNickname(character.nickname) && (
                      <small>
                        &quot;{formatNickname(character.nickname)}&quot;
                      </small>
                    )}
                  </span>
                </Link>
              ) : null
            )}
          </div>
        </section>

        <section className={styles.directorySection}>
          <div className={styles.directoryHeader}>
            <div>
              <span className={styles.eyebrow}>The Realm</span>
              <h2 className={styles.sectionTitle}>Other Characters</h2>
            </div>

            <div className={styles.directoryHeaderTools}>
              <div className={styles.statusTabs} role="group" aria-label="Status filter">
                {STATUS_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    className={`${styles.statusTab} ${
                      statusFilter === tab.value ? styles.statusTabActive : ""
                    }`}
                    onClick={() => setStatusFilter(tab.value)}
                    aria-pressed={statusFilter === tab.value}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <span className={styles.resultCount}>
                {visibleCharacters.length} of {otherCharacters.length}
              </span>
            </div>
          </div>

          <div className={styles.controls}>
            <label className={styles.searchWrap}>
              <span className={styles.controlLabel}>Find</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name, house, title…"
                className={styles.searchInput}
              />
            </label>

            <StyledSelect
              label="House"
              value={houseFilter}
              options={houseOptions}
              onChange={setHouseFilter}
            />

            <StyledSelect
              label="Sort"
              value={sortBy}
              options={sortOptions}
              onChange={(value) => setSortBy(value as SortMode)}
            />
          </div>

          {visibleCharacters.length > 0 ? (
            <ul className={styles.characterGrid}>
              {visibleCharacters.map((character) => {
                const name = displayName(character.name);
                const title = character.title !== "-" ? character.title : null;
                const nickname = formatNickname(character.nickname);

                return (
                  <li key={character.id} className={styles.characterItem}>
                    <Link
                      href={`/characters/${character.id}`}
                      className={styles.characterRow}
                    >
                      <RawMiniPortrait
                        id={character.id}
                        alt={character.name}
                        size={44}
                      />

                      <span className={styles.characterText}>
                        <span className={styles.nameLine}>
                          <strong>{name}</strong>
                          {nickname && (
                            <Nickname value={nickname} />
                          )}
                        </span>

                        <span className={styles.metaLine}>
                          <span>{houseLabel(character.house)}</span>
                          {title && (
                            <>
                              <span className={styles.metaDot}>·</span>
                              <span className={styles.title} title={title}>
                                {title}
                              </span>
                            </>
                          )}
                        </span>
                      </span>

                      <span className={styles.rowArrow} aria-hidden="true">
                        ›
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className={styles.emptyState}>
              No characters match these filters.
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setHouseFilter("all");
                  setSortBy("name");
                  setStatusFilter("all");
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
