// ─────────────────────────────────────────────────────────
// Home.jsx
// src/portals/client/screens/Home.jsx
// ─────────────────────────────────────────────────────────

import { C, fmt } from "../constants";
import { Avatar, Card, Lbl, StatusBadge } from "../Atoms";

export default function Home({ user, activePlan, orders, activeOrders, setTab }) {
  const hour        = new Date().getHours();
  const greeting    = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const initials    = user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "?";
  const displayName = user?.displayName || user?.email?.split("@")[0] || "there";

  return (
    <div>
      {/* Header */}
      <div style={{ background: C.dark, padding: "16px 20px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar initials={initials} />
          <div>
            <div style={{ color: "#6B7280", fontSize: 12 }}>{greeting},</div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{displayName} 🍁</div>
          </div>
        </div>
        <div style={{ background: "#2A2A2E", borderRadius: 6, padding: "4px 10px", fontSize: 10, color: "#6B7280", fontWeight: 700, letterSpacing: "0.06em" }}>
          {activePlan ? "SUBSCRIBER" : "STANDARD"}
        </div>
      </div>

      <div style={{ padding: "16px 16px 0" }}>

        {/* Plan status card */}
        <div style={{ background: C.dark, borderRadius: 16, padding: "22px 20px 20px", marginBottom: 14 }}>
          {activePlan ? (
            <>
              <div style={{ color: "#6B7280", fontSize: 12, marginBottom: 2 }}>Active Plan</div>
              <div style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>{activePlan.planName}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
                <div>
                  <div style={{ color: C.accent, fontSize: 22, fontWeight: 800 }}>{activePlan.kgLeft} kg</div>
                  <div style={{ color: "#6B7280", fontSize: 11 }}>remaining</div>
                </div>
                <div style={{ flex: 1, height: 6, background: "#2A2A2E", borderRadius: 3 }}>
                  <div style={{ width: `${(activePlan.kgLeft / activePlan.kgTotal) * 100}%`, height: "100%", background: C.accent, borderRadius: 3 }} />
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{ color: "#fff", fontSize: 20, fontWeight: 700, marginBottom: 14 }}>No Active Plan</div>
              <button onClick={() => setTab("plan")} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Subscribe Now
              </button>
            </>
          )}
        </div>

        {/* Book CTA */}
        <button onClick={() => setTab("book")} style={{ width: "100%", background: C.accent, color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 14, boxShadow: "0 4px 16px rgba(0,201,167,0.3)" }}>
          + Book a Drop-off
        </button>

        {/* Active orders preview */}
        <Lbl>ACTIVE ORDERS</Lbl>
        {activeOrders.length === 0 ? (
          <Card style={{ padding: "24px 20px", textAlign: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🧺</div>
            <div style={{ color: C.muted, fontSize: 14 }}>No active orders right now</div>
          </Card>
        ) : (
          activeOrders.slice(0, 2).map(o => (
            <Card key={o.id} style={{ padding: "14px 16px", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{o.serviceLabel}</div>
                <div style={{ color: C.muted, fontSize: 12 }}>{o.date} · {o.timeSlot}</div>
              </div>
              <StatusBadge status={o.status} />
            </Card>
          ))
        )}

        {/* Stats — use full orders list */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[
            { emoji: "🧺", label: "VISITS",   value: orders.filter(o => o.status === "collected").length },
            { emoji: "⚖️", label: "TOTAL KG", value: orders.reduce((s, o) => s + (o.actualKg || 0), 0)  },
            { emoji: "💳", label: "SPENT",    value: fmt(orders.reduce((s, o) => s + (o.amountPaid || 0), 0)) },
          ].map(stat => (
            <Card key={stat.label} style={{ padding: "14px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{stat.emoji}</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{stat.value}</div>
              <div style={{ fontSize: 9, color: C.muted, fontWeight: 700, letterSpacing: "0.07em", marginTop: 2 }}>{stat.label}</div>
            </Card>
          ))}
        </div>

      </div>
    </div>
  );
}
