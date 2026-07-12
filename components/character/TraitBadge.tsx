// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\components\character\TraitBadge.tsx
type Props = {
  children: React.ReactNode;
};

export default function TraitBadge({ children }: Props) {
  return (
    <span
      style={{
        padding: "8px 14px",
        background: "var(--surface-hover)",
        border: "1px solid var(--border)",
        borderRadius: 999,
        color: "var(--text)",
        fontSize: 15,
      }}
    >
      {children}
    </span>
  );
}
