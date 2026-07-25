// ─────────────────────────────────────────────────────────
// Orders.jsx
// src/portals/client/screens/Orders.jsx
// Replaces both old Orders.jsx AND Track.jsx
// ─────────────────────────────────────────────────────────

import { useState } from "react";
import { C } from "../constants";
import { Avatar, Card, StatusBadge } from "../Atoms";

export default function Orders({ user, orders }) {
  const [activeTab, setActiveTab] = useState("active");
  const initials = user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "?";

  const filtered =
    activeTab === "active"    ? orders.filter(o => o.status !== "collected") :
    activeTab === "collected" ? orders.filter(o => o.status === "collected") :
    orders;

  return (
    <div>
      {/* Header with tabs */}
      <div style={{ background: C.dark }}>
        <div style={{ padding: "16px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar initials={initials} />
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>My Orders</span>
          </div>
        </div>
        <div style={{ display: "flex", marginTop: 10 }}>
          {["active", "all", "collected"].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              flex: 1, padding: "12px 0", background: "none", border: "none",
              borderBottom: `2px solid ${activeTab === t ? C.accent : "transparent"}`,
              color: activeTab === t ? C.accent : "#6B7280",
              fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", cursor: "pointer",
            }}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>🧺</div>
            <div style={{ color: C.text, fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No orders here</div>
            <div style={{ color: C.muted, fontSize: 13 }}>Your {activeTab} orders will appear here</div>
          </div>
        ) : (
          filtered.map(o => (
            <Card key={o.id} style={{ padding: "16px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{o.serviceLabel}</div>
                  <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>#{o.id} · {o.date}</div>
                </div>
                <StatusBadge status={o.status} />
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: 12, color: C.muted }}>
                <span>⏰ {o.timeSlot}</span>
                <span>⚖️ ~{o.estimatedKg} kg</span>
                {o.overageKg > 0 && (
                  <span style={{ color: C.warn, fontWeight: 600 }}>⚠️ {o.overageKg}kg overage</span>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
