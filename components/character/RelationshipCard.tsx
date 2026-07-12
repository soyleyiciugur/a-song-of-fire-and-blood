// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\components\character\RelationshipCard.tsx
"use client";

import Link from "next/link";
import MiniPortrait from "@/components/MiniPortrait";
import { getCharacter } from "@/lib/characters";

type Props = {
  id: string;
  description: string;
};

export default function RelationshipCard({ id, description }: Props) {
  const related = getCharacter(id);
  const name = related?.name || id.replace(/-/g, " ");

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      {/* Portreyi Link ile sarmaladık */}
      <Link 
        href={`/characters/${id}`} 
        style={{ 
          transition: "transform 0.2s, opacity 0.2s", 
          display: "block",
          lineHeight: 0 // Resmin etrafındaki boşluğu yok etmek için
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.opacity = "0.9"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.opacity = "1"; }}
      >
        <MiniPortrait id={id} size={42} alt={name} />
      </Link>
      
      <div style={{ display: "flex", flexDirection: "column" }}>
        <Link 
          href={`/characters/${id}`} 
          style={{ 
            color: "#ececec", 
            textDecoration: "none", 
            fontWeight: "bold", 
            fontSize: 16, 
            transition: "all 0.2s" 
          }}
          onMouseEnter={(e) => { 
            e.currentTarget.style.color = "var(--gold)"; 
            e.currentTarget.style.textDecoration = "underline"; 
          }}
          onMouseLeave={(e) => { 
            e.currentTarget.style.color = "#ececec"; 
            e.currentTarget.style.textDecoration = "none"; 
          }}
        >
          {name}
        </Link>
        <span style={{ color: "#888", fontSize: 13 }}>{description}</span>
      </div>
    </div>
  );
}