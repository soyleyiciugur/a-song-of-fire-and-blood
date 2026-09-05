import type { ReactNode } from "react";
import "./great-game.css";

export default function GreatGameLayout({ children }: { children: ReactNode }) {
  return <div className="great-game-shell">{children}</div>;
}
