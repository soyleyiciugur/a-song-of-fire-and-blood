import Image from "next/image";
import { getSafeMiniPortrait } from "@/lib/portraits";

type MiniPortraitProps = {
  characterId?: string;
  name: string;
  size?: number;
  className?: string;
};

export default function MiniPortrait({
  characterId,
  name,
  size = 32,
  className,
}: MiniPortraitProps) {
  return (
    <Image
      src={getSafeMiniPortrait(characterId)}
      alt={name}
      width={size}
      height={size}
      className={className}
      style={{
        borderRadius: "6px",
        objectFit: "cover",
      }}
    />
  );
}