// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\admin\_components\NumberStepper.tsx
"use client";

interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
}

export const NumberStepper = ({ value, onChange, min = -Infinity, max = Infinity, label }: NumberStepperProps) => {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {label && <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>{label}</span>}
      <div className="number-stepper">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
        />
        <div className="number-stepper-buttons">
          <button type="button" onClick={() => onChange(clamp(value + 1))} aria-label="Increase">▲</button>
          <button type="button" onClick={() => onChange(clamp(value - 1))} aria-label="Decrease">▼</button>
        </div>
      </div>
    </label>
  );
};
