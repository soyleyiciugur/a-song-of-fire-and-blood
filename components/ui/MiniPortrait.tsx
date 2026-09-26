// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\components\ui\MiniPortrait.tsx
import CharacterMiniPortrait from "@/components/MiniPortrait";

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
    <CharacterMiniPortrait
      id={characterId ?? ""}
      alt={name}
      size={size}
      className={className}
    />
  );
}
