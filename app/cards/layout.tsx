import type { ReactNode } from "react";
import { CardsAudioProvider } from "@/components/the-great-game/CardsAudioProvider";
import "./great-game.css";

export default function GreatGameLayout({ children }: { children: ReactNode }) {
  return <CardsAudioProvider><div className="great-game-shell">{children}</div></CardsAudioProvider>;
}
