// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\chapters\[id]\page.tsx

import Image from "next/image";

import { getChapter } from "@/data/chapters";
import LinkedParagraph from "@/components/chapter/LinkedParagraph";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ChapterPage({ params }: Props) {
  const { id } = await params;

  const chapter = getChapter(id);

  if (!chapter) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "var(--background)",
          color: "var(--text)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        Chapter not found
      </main>
    );
  }

  return (
    <main
      style={{
        background: "var(--background)",
        color: "var(--text)",
        minHeight: "100vh",
        padding: "60px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          lineHeight: 1.8,
        }}
      >
        <Image
          src={chapter.image}
          alt={chapter.title}
          width={500}
          height={280}
          style={{
            width: "100%",
            maxWidth: "500px",
            height: "auto",
            borderRadius: "var(--radius-md)",
            marginBottom: 30,
            display: "block",
            marginInline: "auto",
          }}
        />

        <h1
          style={{
            color: "var(--gold)",
            fontSize: 36,
            marginTop: 0,
            marginBottom: 30,
          }}
        >
          {chapter.title}
        </h1>

        {chapter.content.map((paragraph, index) => (
          <LinkedParagraph key={index} text={paragraph} />
        ))}
      </div>
    </main>
  );
}