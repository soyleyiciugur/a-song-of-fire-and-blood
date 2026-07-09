"use client";

import { useState, useEffect } from "react";

interface PromptModalProps {
  title: string;
  placeholder?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export const PromptModal = ({ title, placeholder, onConfirm, onCancel }: PromptModalProps) => {
  const [value, setValue] = useState("");

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm(value);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [value, onConfirm, onCancel]);

  return (
    <div style={overlayStyle} onClick={onCancel}>
      <div style={boxStyle} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 16px 0", color: "var(--gold)" }}>{title}</h3>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          style={{ width: "100%", padding: "12px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.2)", color: "var(--text)", borderRadius: "4px", outline: "none", fontFamily: "inherit", marginBottom: "20px", boxSizing: "border-box" }}
        />
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={cancelButtonStyle}>Cancel</button>
          <button onClick={() => onConfirm(value)} style={confirmButtonStyle}>Create</button>
        </div>
      </div>
    </div>
  );
};

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal = ({ title, message, confirmLabel = "Confirm", danger = true, onConfirm, onCancel }: ConfirmModalProps) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  return (
    <div style={overlayStyle} onClick={onCancel}>
      <div style={boxStyle} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 12px 0", color: danger ? "#ff4c4c" : "var(--gold)" }}>{title}</h3>
        <p style={{ opacity: 0.85, lineHeight: 1.5, marginBottom: "24px", whiteSpace: "pre-line" }}>{message}</p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={cancelButtonStyle}>Cancel</button>
          <button onClick={onConfirm} style={danger ? dangerButtonStyle : confirmButtonStyle}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
};

const overlayStyle: React.CSSProperties = {
  position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
  background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)",
  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
};

const boxStyle: React.CSSProperties = {
  background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px",
  padding: "24px", width: "400px", maxWidth: "90vw",
  boxShadow: "0 12px 32px rgba(0,0,0,0.6)", fontFamily: "inherit",
};

const cancelButtonStyle: React.CSSProperties = {
  padding: "10px 18px", background: "transparent", color: "var(--text)",
  border: "1px solid rgba(255,255,255,0.2)", borderRadius: "4px", cursor: "pointer", fontFamily: "inherit",
};

const confirmButtonStyle: React.CSSProperties = {
  padding: "10px 18px", background: "var(--gold)", color: "#000",
  border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", fontFamily: "inherit",
};

const dangerButtonStyle: React.CSSProperties = {
  padding: "10px 18px", background: "#B22222", color: "#fff",
  border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", fontFamily: "inherit",
};