// ─────────────────────────────────────────────────────────
// Atoms.jsx
// src/portals/client/Atoms.jsx
// Shared micro-components used across all client screens
// ─────────────────────────────────────────────────────────

import { C } from "./constants";

export function Avatar({ initials, size = 38, color = C.accent }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color, color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: size * 0.38, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

export function Lbl({ children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, color: C.muted,
      letterSpacing: "0.09em", marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

export function Card({ children, style = {} }) {
  return (
    <div style={{
      background: C.surface, borderRadius: 14,
      border: `1px solid ${C.border}`, ...style,
    }}>
      {children}
    </div>
  );
}

export function StatusBadge({ status }) {
  const map = {
    pending:   { label: "Pending",   bg: "#FEF9C3", color: "#854D0E" },
    received:  { label: "Received",  bg: "#DBEAFE", color: "#1E40AF" },
    washing:   { label: "Washing",   bg: C.accentLight, color: "#065F46" },
    ready:     { label: "Ready ✓",  bg: "#DCFCE7", color: "#166534" },
    collected: { label: "Collected", bg: "#F3F4F6", color: C.muted   },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700,
      padding: "4px 10px", borderRadius: 20,
      background: s.bg, color: s.color,
    }}>
      {s.label}
    </span>
  );
}
