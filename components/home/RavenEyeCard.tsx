import { getRandomSeriousGalleryItem } from "@/lib/gallery";
import RavenEyeCardClient from "./RavenEyeCardClient";

export default function RavenEyeCard() {
  const item = getRandomSeriousGalleryItem();
  if (!item) return null;

  return (
    <RavenEyeCardClient
      id={item.id}
      src={item.src}
      caption={item.caption || ""}
    />
  );
}
