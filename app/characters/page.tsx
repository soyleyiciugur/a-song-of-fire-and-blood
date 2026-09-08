"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { getCharacters } from "@/lib/characters";
import MiniPortrait from "@/components/MiniPortrait";

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

const ROYAL_IDS = new Set<string>([
  ...ROYAL_PARENT_IDS,
  ...SUCCESSION_IDS,
]);

function displayName(name: string) {
  return name.replace(/^(Ser|Mother)\s+/i, "").trim();
}

function sortableName(name: string) {
  return displayName(name).toLocaleLowerCase("en");
}

function houseLabel(house: string) {
  return house === "-" ? "Unaffiliated" : house.replace(/^House\s+/i, "");
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
  const [sortBy, setSortBy] = useState<"name" | "house">("name");

  const visibleCharacters = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("en");

    return otherCharacters
      .filter((character) => {
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
  }, [otherCharacters, houseFilter, query, sortBy]);

  return (
    <main className="page-shell">
      <div className="page-shell-inner">
        <header className={styles.pageHeader}>
          <div>
            <h1 className="page-heading">Characters</h1>
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
                  <MiniPortrait
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
                  <span className={styles.successionNumber}>{index + 1}</span>
                  <MiniPortrait
                    id={character.id}
                    alt={character.name}
                    size={46}
                  />
                  <span className={styles.successionIdentity}>
                    <strong>{displayName(character.name)}</strong>
                    {character.nickname !== "-" && (
                      <small>{character.nickname}</small>
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
            <span className={styles.resultCount}>
              {visibleCharacters.length} of {otherCharacters.length}
            </span>
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

            <label className={styles.selectWrap}>
              <span className={styles.controlLabel}>House</span>
              <select
                value={houseFilter}
                onChange={(event) => setHouseFilter(event.target.value)}
                className={styles.select}
              >
                <option value="all">All houses</option>
                {houses.map((house) => (
                  <option key={house} value={house}>
                    {houseLabel(house)}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.selectWrap}>
              <span className={styles.controlLabel}>Sort</span>
              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value as "name" | "house")
                }
                className={styles.select}
              >
                <option value="name">Name A–Z</option>
                <option value="house">House A–Z</option>
              </select>
            </label>
          </div>

          {visibleCharacters.length > 0 ? (
            <ul className={styles.characterGrid}>
              {visibleCharacters.map((character) => {
                const name = displayName(character.name);
                const title = character.title !== "-" ? character.title : null;

                return (
                  <li key={character.id} className={styles.characterItem}>
                    <Link
                      href={`/characters/${character.id}`}
                      className={styles.characterRow}
                    >
                      <MiniPortrait
                        id={character.id}
                        alt={character.name}
                        size={44}
                      />

                      <span className={styles.characterText}>
                        <span className={styles.nameLine}>
                          <strong>{name}</strong>
                          {character.nickname !== "-" && (
                            <span className={styles.nickname}>
                              “{character.nickname}”
                            </span>
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
