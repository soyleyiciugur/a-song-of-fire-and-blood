import Image from "next/image";
import Link from "next/link";
import { getRandomSeriousGalleryItem } from "@/lib/gallery";

export default function RavenEyeCard() {
  const item = getRandomSeriousGalleryItem();
  if (!item) return null;

  return (
    <Link
      href={`/ravens-eye?item=${item.id}`}
      className="card card-padding home-quote-card"
      style={{
        textDecoration: "none",
        color: "inherit",
        display: "block",
        alignSelf: "start",
        width: "100%",
      }}
    >
      <span className="home-quote-label">From the Raven's Eye</span>
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "4/3", // 16/9 yerine daha az kırpan bir oran
          borderRadius: "6px",
          overflow: "hidden",
          marginTop: "12px",
        }}
      >
        <Image
          src={item.src}
          alt={item.caption || "Raven's Eye"}
          fill
          style={{ objectFit: "cover", objectPosition: "top" }}
        />
      </div>
      {item.caption && (
        <p style={{ marginTop: "10px", fontSize: "0.9rem", opacity: 0.8, fontStyle: "italic" }}>{item.caption}</p>
      )}
    </Link>
  );
}