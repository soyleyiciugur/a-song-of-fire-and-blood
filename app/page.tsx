import Link from "next/link";

export default function Home() {
  return (
    <main className="page">
      <div className="container">

        <h1 className="page-title">
          A Song of Fire and Blood
        </h1>

        <p className="page-subtitle">
          A living chronicle of House Targaryen.
        </p>

        <div className="button-row">

          <Link
            href="/chapters"
            className="button"
          >
            Chapters
          </Link>

          <Link
            href="/characters"
            className="button"
          >
            Characters
          </Link>

        </div>

      </div>
    </main>
  );
}