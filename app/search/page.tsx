import PageTitleIcon from "@/components/nav/PageTitleIcon";
import Link from "next/link";
import { SEARCH_TYPE_LABELS, SEARCH_TYPE_ORDER, searchIndex, type SearchResult, type SearchResultType } from "@/lib/search";
import SearchResultGroup, { type SearchDisplayResult } from "./SearchResultGroup";
import styles from "./search.module.css";

type Props = { searchParams: Promise<{ q?: string; type?: string }> };

function groupResults(results: SearchResult[]) {
  const groups = new Map<SearchResult["type"], SearchResult[]>();
  for (const type of SEARCH_TYPE_ORDER) groups.set(type, []);
  for (const result of results) groups.get(result.type)?.push(result);
  return SEARCH_TYPE_ORDER.map((type) => ({
    type,
    label: SEARCH_TYPE_LABELS[type],
    items: (groups.get(type) ?? []).map((result) => {
      const item = { ...result } as Partial<SearchResult>;
      delete item.keywords;
      return item as SearchDisplayResult;
    }),
  })).filter((group) => group.items.length > 0);
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = "", type: requestedType = "" } = await searchParams;
  const activeType = SEARCH_TYPE_ORDER.includes(requestedType as SearchResultType) ? requestedType as SearchResultType : undefined;
  const allResults = searchIndex(q);
  const results = activeType ? allResults.filter((item) => item.type === activeType) : allResults;
  const grouped = groupResults(results);
  const counts = new Map<SearchResultType, number>();
  for (const result of allResults) counts.set(result.type, (counts.get(result.type) ?? 0) + 1);

  return <main className={styles.page}><div className={styles.container}>
    <h1 className={styles.heading}>Search<PageTitleIcon name="search" /></h1>
    <form action="/search" className={styles.searchForm}>
      <input name="q" defaultValue={q} placeholder="Search the public archives…" aria-label="Search query" />
      <button type="submit">Search</button>
    </form>
    <p className={styles.subheading}>{q ? <>{allResults.length} {allResults.length === 1 ? "result" : "results"} for <q>{q}</q></> : "Type something in the search bar above to look through the realm."}</p>

    {q && allResults.length > 0 && <nav className={styles.filters} aria-label="Filter search results">
      <Link className={!activeType ? styles.filterActive : ""} href={`/search?q=${encodeURIComponent(q)}`}>All <span>{allResults.length}</span></Link>
      {SEARCH_TYPE_ORDER.filter((type) => counts.has(type)).map((type) => <Link key={type} className={activeType === type ? styles.filterActive : ""} href={`/search?q=${encodeURIComponent(q)}&type=${type}`}>
        {SEARCH_TYPE_LABELS[type]} <span>{counts.get(type)}</span>
      </Link>)}
    </nav>}

    {q && grouped.length === 0 && <p className={styles.empty}>Nothing in the records matches <q>{q}</q>.</p>}
    <div className={styles.groups}>{grouped.map((group) => <SearchResultGroup key={group.type} label={group.label} items={group.items} />)}</div>
  </div></main>;
}
