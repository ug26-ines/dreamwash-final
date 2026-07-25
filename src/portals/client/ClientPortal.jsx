// ─────────────────────────────────────────────────────────
// ClientPortal.jsx  —  PRODUCTION VERSION
// Drop this into: src/portals/client/ClientPortal.jsx
//
// Firebase collections this file reads/writes:
//   bookings            — client writes, receptionist confirms
//   subscriptionRequests — client writes, receptionist activates
//   plans               — client reads their active plan
//   orders              — client reads their order history
// ─────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import { db } from "../../firebase";          // ← match your firebase config path
import { useAuth } from "../../hooks/useAuth"; // ← match your auth hook path

// ═══════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════
const C = {
  bg:           "#EFEFEB",
  surface:      "#FFFFFF",
  dark:         "#111214",
  accent:       "#00C9A7",
  accentLight:  "rgba(0,201,167,0.11)",
  muted:        "#8A9BA8",
  text:         "#111214",
  border:       "rgba(0,0,0,0.07)",
  danger:       "#EF4444",
  dangerLight:  "#FEF2F2",
  dangerBorder: "#FECACA",
  warn:         "#F59E0B",
  warnLight:    "#FFFBEB",
  warnBorder:   "#FDE68A",
};

// ═══════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════
const WALKIN_SERVICES = [
  { id: "full",     label: "Full Service", desc: "Wash + dry + iron", price: 1500 },
  { id: "wash_dry", label: "Wash & Dry",   desc: "Wash and dry only", price: 1200 },
  { id: "iron",     label: "Iron Only",    desc: "Pressing only",      price: 600  },
  { id: "express",  label: "Express Full", desc: "Ready in 4 hrs",     price: 2000 },
];

const PLANS = [
  {
    id:       "monthly",
    name:     "Monthly Plan",
    icon:     "📅",
    price:    10000,
    period:   "/month",
    kg:       10,
    subtitle: "Renew each month · 10kg",
    badge:    null,
  },
  {
    id:       "semester",
    name:     "Semester Plan",
    icon:     "🎓",
    price:    95000,
    period:   "/10 months",
    kg:       100,
    subtitle: "Best value — 10 months · 100kg",
    badge:    "BEST VALUE",
  },
];

const PLAN_COVERS = {
  monthly: [
    { icon: "🧺", text: "Full Service — wash, dry & iron" },
    { icon: "⚖️", text: "10 kg quota per month" },
    { icon: "🔄", text: "Auto-renews every month" },
    { icon: "📅", text: "Priority drop-off booking" },
    { icon: "⚡", text: "Overage at RWF 1,500/kg" },
  ],
  semester: [
    { icon: "🧺", text: "Full Service — wash, dry & iron" },
    { icon: "⚖️", text: "100 kg total quota over 10 months" },
    { icon: "💰", text: "Saves RWF 5,000 vs monthly plan" },
    { icon: "📅", text: "Priority drop-off booking" },
    { icon: "🎓", text: "One payment, no monthly renewal" },
    { icon: "⚡", text: "Overage at RWF 1,500/kg" },
  ],
};

const TIME_SLOTS = ["7:00 AM","9:00 AM","11:00 AM","1:00 PM","3:00 PM","5:00 PM"];

const fmt       = (n) => Number(n).toLocaleString();
const todayStr  = new Date().toISOString().split("T")[0];

// ═══════════════════════════════════════════════════
// SHARED ATOMS
// ═══════════════════════════════════════════════════
function Avatar({ initials, size = 38, color = C.accent }) {
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

function Lbl({ children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, color: C.muted,
      letterSpacing: "0.09em", marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: C.surface, borderRadius: 14,
      border: `1px solid ${C.border}`, ...style,
    }}>
      {children}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending:   { label: "Pending",    bg: "#FEF9C3", color: "#854D0E" },
    received:  { label: "Received",   bg: "#DBEAFE", color: "#1E40AF" },
    washing:   { label: "Washing",    bg: C.accentLight, color: "#065F46" },
    ready:     { label: "Ready ✓",   bg: "#DCFCE7", color: "#166534" },
    collected: { label: "Collected",  bg: "#F3F4F6", color: C.muted   },
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

// ═══════════════════════════════════════════════════
// BOTTOM NAV
// ═══════════════════════════════════════════════════
function BottomNav({ tab, setTab, activeOrderCount, planPending }) {
  const items = [
    { id: "home",    label: "Home",    icon: "⌂" },
    { id: "orders",  label: "Orders",  icon: "≡", badge: activeOrderCount || null },
    { id: "book",    label: "Book",    icon: "+", fab: true },
    { id: "plan",    label: "Plan",    icon: "★", badge: planPending ? "!" : null },
    { id: "profile", label: "Profile", icon: "◎" },
  ];

  return (
    <div style={{
      position: "fixed", bottom: 0,
      left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 430,
      background: C.surface, borderTop: `1px solid ${C.border}`,
      display: "flex", zIndex: 100,
    }}>
      {items.map(({ id, label, icon, fab, badge }) => {
        const active = tab === id;
        return (
          <button key={id} onClick={() => setTab(id)} style={{
            flex: 1, padding: fab ? "6px 0 8px" : "10px 0 8px",
            background: "none", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: 3, position: "relative",
          }}>
            {fab ? (
              <div style={{
                width: 42, height: 42, borderRadius: "50%",
                background: C.accent, display: "flex",
                alignItems: "center", justifyContent: "center",
                marginBottom: 2, boxShadow: "0 4px 14px rgba(0,201,167,0.4)",
                fontSize: 22, color: "#fff",
              }}>
                {icon}
              </div>
            ) : (
              <span style={{ fontSize: 20, color: active ? C.accent : C.muted }}>{icon}</span>
            )}
            <span style={{
              fontSize: 9, fontWeight: 700,
              color: fab ? C.accent : active ? C.accent : C.muted,
              letterSpacing: "0.04em",
            }}>
              {label.toUpperCase()}
            </span>
            {badge && (
              <div style={{
                position: "absolute", top: 6, right: "18%",
                background: C.danger, color: "#fff",
                fontSize: 9, fontWeight: 700,
                minWidth: 16, height: 16, borderRadius: 8,
                display: "flex", alignItems: "center",
                justifyContent: "center", padding: "0 4px",
              }}>
                {badge}
              </div>
            )}
            {active && !fab && (
              <div style={{
                position: "absolute", bottom: 0,
                width: 20, height: 2,
                background: C.accent, borderRadius: 2,
              }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// HOME SCREEN
// ═══════════════════════════════════════════════════
function HomeScreen({ user, activePlan, orders, activeOrders, setTab }) {
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const initials = user?.displayName
    ? user.displayName.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || "?";
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
        {/* Plan card */}
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

        {/* Active orders */}
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

        {/* Stats — use full orders list so collected visits count */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[
            { emoji: "🧺", label: "VISITS",   value: orders.filter(o => o.status === "collected").length },
            { emoji: "⚖️", label: "TOTAL KG", value: `${orders.reduce((s, o) => s + (o.actualKg || 0), 0)}` },
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

// ═══════════════════════════════════════════════════
// ORDERS SCREEN
// ═══════════════════════════════════════════════════
function OrdersScreen({ user, orders }) {
  const [activeTab, setActiveTab] = useState("active");
  const initials = user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "?";

  const filtered =
    activeTab === "active"    ? orders.filter(o => o.status !== "collected") :
    activeTab === "collected" ? orders.filter(o => o.status === "collected") :
    orders;

  return (
    <div>
      <div style={{ background: C.dark }}>
        <div style={{ padding: "16px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar initials={initials} />
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>My Orders</span>
          </div>
        </div>
        <div style={{ display: "flex", marginTop: 10 }}>
          {["active", "all", "collected"].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ flex: 1, padding: "12px 0", background: "none", border: "none", borderBottom: `2px solid ${activeTab === t ? C.accent : "transparent"}`, color: activeTab === t ? C.accent : "#6B7280", fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", cursor: "pointer" }}>
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
                {o.overageKg > 0 && <span style={{ color: C.warn, fontWeight: 600 }}>⚠️ {o.overageKg}kg overage</span>}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// BOOKING SCREEN
// ═══════════════════════════════════════════════════
function BookingScreen({ user, activePlan, onSubmit }) {
  const isSubscriber = !!activePlan;
  const [service,  setService]  = useState("full");
  const [date,     setDate]     = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [kg,       setKg]       = useState(3);
  const [notes,    setNotes]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [sent,     setSent]     = useState(false);
  const [error,    setError]    = useState("");

  const initials    = user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "?";
  const kgLeft      = activePlan?.kgLeft || 0;
  const coveredKg   = isSubscriber ? Math.min(kg, kgLeft) : 0;
  const overageKg   = isSubscriber ? Math.max(0, kg - kgLeft) : 0;
  const overageRate = 1500;
  const overageCost = overageKg * overageRate;
  const walkinSvc   = WALKIN_SERVICES.find(s => s.id === service);
  const walkinCost  = walkinSvc ? walkinSvc.price * kg : 0;
  const totalCost   = isSubscriber ? overageCost : walkinCost;
  const canSubmit   = date && timeSlot && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    try {
      await onSubmit({
        type:         isSubscriber ? "subscriber" : "walkin",
        service:      isSubscriber ? "full" : service,
        serviceLabel: isSubscriber ? "Subscriber Drop-off" : walkinSvc?.label,
        date,
        timeSlot,
        estimatedKg:  kg,
        coveredKg:    isSubscriber ? coveredKg : 0,
        overageKg,
        overageCost,
        walkinCost:   isSubscriber ? 0 : walkinCost,
        notes,
        // status is set by handleBookingSubmit in root, not here
      });
      setSent(true);
    } catch (e) {
      setError("Failed to send booking. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", padding: 32, textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>📋</div>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Booking Sent!</div>
        <div style={{ background: C.accentLight, border: `1.5px solid ${C.accent}`, borderRadius: 12, padding: "14px 20px", marginBottom: 20, maxWidth: 280 }}>
          <div style={{ color: C.accent, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>📡 Sent to Reception</div>
          <div style={{ color: C.text, fontSize: 13, lineHeight: 1.6 }}>
            Your booking is in the reception queue. Check the <strong>Orders</strong> tab for status updates.
          </div>
        </div>
        <button
          onClick={() => { setSent(false); setDate(""); setTimeSlot(""); setNotes(""); setKg(3); }}
          style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 10, padding: "13px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
        >
          Book Another
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ background: C.dark, padding: "16px 20px 14px", display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar initials={initials} />
        <span style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>Book Drop-off</span>
      </div>

      <div style={{ padding: "16px 16px 100px" }}>

        {/* Subscriber plan info */}
        {isSubscriber && (
          <>
            <div style={{ background: C.dark, borderRadius: 14, padding: "18px", marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ color: "#6B7280", fontSize: 12, marginBottom: 2 }}>Your Plan</div>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{activePlan.planName}</div>
                </div>
                <span style={{ background: "rgba(0,201,167,0.2)", color: C.accent, fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 20 }}>ACTIVE</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div>
                  <div style={{ color: C.accent, fontSize: 22, fontWeight: 800 }}>{kgLeft} kg</div>
                  <div style={{ color: "#6B7280", fontSize: 11 }}>remaining</div>
                </div>
                <div style={{ flex: 1, height: 6, background: "#2A2A2E", borderRadius: 3 }}>
                  <div style={{ width: `${(kgLeft / activePlan.kgTotal) * 100}%`, height: "100%", background: C.accent, borderRadius: 3 }} />
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#6B7280", fontSize: 22, fontWeight: 800 }}>{activePlan.kgTotal} kg</div>
                  <div style={{ color: "#6B7280", fontSize: 11 }}>total quota</div>
                </div>
              </div>
            </div>
            <div style={{ background: "#F0FDF4", border: "1.5px solid #BBF7D0", borderRadius: 12, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#166534", lineHeight: 1.5 }}>
              ✅ Your subscription covers <strong>Full Service</strong> (wash + dry + iron). Select a date, time, and estimated weight.
            </div>
          </>
        )}

        {/* Walk-in service picker */}
        {!isSubscriber && (
          <>
            <Lbl>CHOOSE SERVICE</Lbl>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
              {WALKIN_SERVICES.map(s => {
                const active = service === s.id;
                return (
                  <button key={s.id} onClick={() => setService(s.id)} style={{ background: active ? C.accentLight : C.surface, border: `1.5px solid ${active ? C.accent : C.border}`, borderRadius: 12, padding: "13px 12px", cursor: "pointer", textAlign: "left" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: active ? C.accent : C.text, marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>{s.desc}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.accent }}>RWF {fmt(s.price)}/kg</div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Date */}
        <Lbl>DROP-OFF DATE</Lbl>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} min={todayStr}
          style={{ width: "100%", padding: "12px 14px", border: `1.5px solid ${date ? C.accent : C.border}`, borderRadius: 10, fontSize: 14, color: C.text, background: C.surface, fontFamily: "inherit", boxSizing: "border-box", marginBottom: 20, outline: "none" }} />

        {/* Time */}
        <Lbl>DROP-OFF TIME</Lbl>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          {TIME_SLOTS.map(t => {
            const active = timeSlot === t;
            return (
              <button key={t} onClick={() => setTimeSlot(t)} style={{ padding: "8px 14px", border: `1.5px solid ${active ? C.accent : C.border}`, borderRadius: 8, background: active ? C.accentLight : C.surface, color: active ? C.accent : C.text, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                {t}
              </button>
            );
          })}
        </div>

        {/* Weight */}
        <Lbl>ESTIMATED WEIGHT</Lbl>
        <Card style={{ padding: "14px 16px", marginBottom: isSubscriber && overageKg > 0 ? 12 : 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 14, color: C.text }}>Approx. weight</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: overageKg > 0 ? C.warn : C.accent }}>{kg} kg</span>
          </div>
          <input type="range" min={1} max={30} value={kg} onChange={e => setKg(Number(e.target.value))}
            style={{ width: "100%", accentColor: overageKg > 0 ? C.warn : C.accent }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.muted, marginTop: 4 }}>
            <span>1 kg</span><span>30 kg</span>
          </div>
          {/* Subscriber breakdown */}
          {isSubscriber && kg > 0 && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "0.08em", marginBottom: 8 }}>WEIGHT BREAKDOWN</div>
              <div style={{ display: "flex", height: 10, borderRadius: 6, overflow: "hidden", marginBottom: 10 }}>
                {coveredKg > 0 && <div style={{ flex: coveredKg, background: C.accent }} />}
                {overageKg > 0 && <div style={{ flex: overageKg, background: C.warn }} />}
                {kgLeft - coveredKg > 0 && <div style={{ flex: Math.max(1, kgLeft - coveredKg), background: "#E5E7EB" }} />}
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: C.accent }} />
                  <span style={{ color: C.muted }}>Plan covers: <strong style={{ color: C.text }}>{coveredKg} kg</strong></span>
                </div>
                {overageKg > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: C.warn }} />
                    <span style={{ color: C.muted }}>Overage: <strong style={{ color: C.warn }}>{overageKg} kg</strong></span>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Overage warning */}
        {isSubscriber && overageKg > 0 && (
          <div style={{ background: C.warnLight, border: `1.5px solid ${C.warnBorder}`, borderRadius: 12, padding: "13px 16px", marginBottom: 20, fontSize: 13, color: "#92400E", lineHeight: 1.6 }}>
            <div style={{ fontWeight: 700, marginBottom: 3 }}>⚠️ Overage Detected</div>
            <div>You only have <strong>{kgLeft} kg</strong> left. The extra <strong>{overageKg} kg</strong> will be charged at RWF {fmt(overageRate)}/kg.</div>
            <div style={{ marginTop: 6, fontWeight: 700 }}>Overage charge: RWF {fmt(overageCost)}</div>
          </div>
        )}

        {/* Notes */}
        <Lbl>SPECIAL NOTES (OPTIONAL)</Lbl>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Handle gym wear gently..." rows={3}
          style={{ width: "100%", padding: "12px 14px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 14, fontFamily: "inherit", resize: "none", color: C.text, background: C.surface, boxSizing: "border-box", outline: "none", marginBottom: 20 }} />

        {/* Error */}
        {error && <div style={{ color: C.danger, fontSize: 13, marginBottom: 12, textAlign: "center" }}>{error}</div>}

        {/* Cost + CTA */}
        <div style={{ background: C.dark, borderRadius: 14, padding: "18px 18px 16px" }}>
          {isSubscriber ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: "#6B7280" }}>Plan covers ({coveredKg} kg)</span>
                <span style={{ color: C.accent, fontWeight: 700 }}>RWF 0</span>
              </div>
              {overageKg > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: "#6B7280" }}>Overage ({overageKg} kg × {fmt(overageRate)})</span>
                  <span style={{ color: C.warn, fontWeight: 700 }}>RWF {fmt(overageCost)}</span>
                </div>
              )}
              <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "10px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                <span style={{ color: "#6B7280", fontSize: 13 }}>Total due at reception</span>
                <span style={{ color: overageKg > 0 ? C.warn : C.accent, fontWeight: 800, fontSize: 22 }}>RWF {fmt(totalCost)}</span>
              </div>
            </>
          ) : (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
              <span style={{ color: "#6B7280", fontSize: 13 }}>Estimated total</span>
              <span style={{ color: "#fff", fontWeight: 800, fontSize: 22 }}>RWF {fmt(totalCost)}</span>
            </div>
          )}
          <div style={{ color: "#4B5563", fontSize: 11, marginBottom: 14 }}>Final price confirmed at actual drop-off weight</div>
          <button onClick={handleSubmit} disabled={!canSubmit} style={{ width: "100%", background: canSubmit ? C.accent : "#3A3A3E", color: "#fff", border: "none", borderRadius: 10, padding: "15px", fontSize: 15, fontWeight: 700, cursor: canSubmit ? "pointer" : "default" }}>
            {loading ? "Sending..." : canSubmit ? "Send to Reception" : "Select date & time to continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// PLAN SCREEN
// ═══════════════════════════════════════════════════
function PlanScreen({ user, activePlan, pendingSubscription, onSubscribe }) {
  const [selectedPlan, setSelectedPlan] = useState("semester");
  const [payment,      setPayment]      = useState("cash");
  const [loading,      setLoading]      = useState(false);
  const [sent,         setSent]         = useState(false);
  const [hoveredPlan,  setHoveredPlan]  = useState(null);
  const [error,        setError]        = useState("");

  const initials  = user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "?";
  const plan      = PLANS.find(p => p.id === selectedPlan);
  const isPending = sent || !!pendingSubscription;

  const handleSubscribe = async () => {
    if (isPending || loading) return;
    setLoading(true);
    setError("");
    try {
      await onSubscribe({ plan, payment });
      setSent(true);
    } catch (e) {
      setError("Failed to send request. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ background: C.dark, padding: "16px 20px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar initials={initials} color="#16A34A" />
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>My Plan</span>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {/* Active plan */}
        {activePlan && (
          <div style={{ background: C.accentLight, border: `1.5px solid ${C.accent}`, borderRadius: 14, padding: "16px 18px", marginBottom: 14 }}>
            <div style={{ color: C.accent, fontWeight: 700, fontSize: 13, marginBottom: 2 }}>✅ Active Plan</div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{activePlan.planName}</div>
            <div style={{ color: C.muted, fontSize: 13, marginTop: 2 }}>{activePlan.kgLeft} kg remaining of {activePlan.kgTotal} kg</div>
          </div>
        )}

        {/* Pending */}
        {isPending && !activePlan && (
          <div style={{ background: C.warnLight, border: `1.5px solid ${C.warnBorder}`, borderRadius: 14, padding: "14px 18px", marginBottom: 14 }}>
            <div style={{ color: C.warn, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>⏳ Pending at Reception</div>
            <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>Your request is in the queue. Visit the reception and pay to activate your plan.</div>
          </div>
        )}

        {!activePlan && (
          <>
            <Lbl>CHOOSE A PLAN</Lbl>

            {PLANS.map(p => {
              const selected = selectedPlan === p.id;
              const hovered  = hoveredPlan === p.id;
              const covers   = PLAN_COVERS[p.id];

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlan(p.id)}
                  onMouseEnter={() => setHoveredPlan(p.id)}
                  onMouseLeave={() => setHoveredPlan(null)}
                  style={{
                    background: selected ? C.accentLight : C.surface,
                    borderRadius: 14, marginBottom: 12, cursor: "pointer",
                    border: `2px solid ${selected ? C.accent : hovered ? "#CBD5E1" : C.border}`,
                    overflow: "hidden", transition: "border-color 0.15s",
                  }}
                >
                  {/* BEST VALUE top strip — never overlaps price */}
                  {p.badge && (
                    <div style={{ background: C.dark, padding: "5px 16px", display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 9, color: "#FFD700" }}>★</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#FFD700", letterSpacing: "0.1em" }}>{p.badge}</span>
                    </div>
                  )}

                  {/* Main row */}
                  <div style={{ padding: "16px 18px 14px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 18 }}>{p.icon}</span>
                        <span style={{ fontWeight: 700, fontSize: 16, color: selected ? C.accent : C.text }}>{p.name}</span>
                      </div>
                      <div style={{ color: C.muted, fontSize: 13 }}>{p.subtitle}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, paddingLeft: 16 }}>
                      <div style={{ fontWeight: 800, fontSize: 18, color: selected ? C.accent : C.text }}>RWF {fmt(p.price)}</div>
                      <div style={{ color: C.muted, fontSize: 12 }}>{p.period}</div>
                    </div>
                  </div>

                  {/* Hover coverage panel */}
                  {hovered && (
                    <div style={{ borderTop: `1px solid ${selected ? "rgba(0,201,167,0.2)" : C.border}`, padding: "12px 18px 14px", background: selected ? "rgba(0,201,167,0.06)" : "#FAFAFA" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: "0.08em", marginBottom: 10 }}>WHAT'S INCLUDED</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                        {covers.map((item, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 14, flexShrink: 0 }}>{item.icon}</span>
                            <span style={{ fontSize: 13, color: C.text }}>{item.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <div style={{ textAlign: "center", color: C.muted, fontSize: 11, marginBottom: 18 }}>
              Hover over a plan to see what's included
            </div>

            <Lbl>PAYMENT METHOD</Lbl>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
              {[{ id: "cash", label: "💵  Cash" }, { id: "momo", label: "📱  MoMo" }].map(m => {
                const active = payment === m.id;
                return (
                  <button key={m.id} onClick={() => setPayment(m.id)} style={{ padding: "13px", cursor: "pointer", border: `1.5px solid ${active ? C.accent : C.border}`, borderRadius: 10, background: active ? C.accentLight : C.surface, color: active ? C.accent : C.text, fontWeight: 600, fontSize: 14 }}>
                    {m.label}
                  </button>
                );
              })}
            </div>

            {error && <div style={{ color: C.danger, fontSize: 13, marginBottom: 12, textAlign: "center" }}>{error}</div>}

            <button onClick={handleSubscribe} disabled={isPending || loading} style={{ width: "100%", background: isPending ? "#9CA3AF" : C.accent, color: "#fff", border: "none", borderRadius: 12, padding: "16px", fontSize: 16, fontWeight: 700, cursor: isPending ? "default" : "pointer", boxShadow: isPending ? "none" : "0 4px 16px rgba(0,201,167,0.3)" }}>
              {loading ? "Sending..." : isPending ? "Request Sent to Reception" : `Send Request — RWF ${fmt(plan.price)}`}
            </button>
            <div style={{ textAlign: "center", color: C.muted, fontSize: 11, marginTop: 12 }}>
              Payment confirmed at the Dream Wash reception
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// PROFILE SCREEN
// ═══════════════════════════════════════════════════
function ProfileScreen({ user, activePlan, onSignOut }) {
  const initials    = user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "?";
  const displayName = user?.displayName || user?.email?.split("@")[0] || "Client";
  const tier        = activePlan ? "SUBSCRIBER" : "STANDARD";

  return (
    <div>
      <div style={{ background: C.dark, padding: "16px 20px 14px", display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar initials={initials} />
        <span style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>My Profile</span>
      </div>
      <div style={{ padding: 16 }}>
        <Card style={{ padding: "28px 20px", textAlign: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <Avatar initials={initials} size={64} />
          </div>
          <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 4 }}>{displayName}</div>
          <div style={{ color: C.muted, fontSize: 13, marginBottom: 12 }}>{user?.email}</div>
          <span style={{ background: activePlan ? C.accentLight : "#F3F4F6", borderRadius: 6, padding: "4px 12px", fontSize: 10, fontWeight: 700, color: activePlan ? C.accent : C.muted, letterSpacing: "0.07em" }}>{tier}</span>
        </Card>

        {[
          { icon: "📋", label: "Order History",   sub: "View all past orders"         },
          { icon: "🎓", label: "My Subscription", sub: "Manage plan & payments"        },
          { icon: "🔔", label: "Notifications",   sub: "Order updates"                 },
          { icon: "❓", label: "Help & Support",  sub: "FAQs and contact"              },
        ].map(item => (
          <Card key={item.label} style={{ padding: "14px 16px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{item.label}</div>
              <div style={{ color: C.muted, fontSize: 12, marginTop: 1 }}>{item.sub}</div>
            </div>
            <span style={{ color: C.muted, fontSize: 18 }}>›</span>
          </Card>
        ))}

        <button onClick={onSignOut} style={{ width: "100%", background: "#FEF2F2", color: C.danger, border: `1.5px solid ${C.dangerBorder}`, borderRadius: 12, padding: "14px", fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 6 }}>
          Sign Out
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// ROOT — ClientPortal with real Firebase
// ═══════════════════════════════════════════════════
export default function ClientPortal() {
  const { user, signOut } = useAuth();           // ← your existing auth hook
  const [tab,                 setTab]                 = useState("home");
  const [orders,              setOrders]              = useState([]);
  const [activePlan,          setActivePlan]          = useState(null);
  const [pendingSubscription, setPendingSubscription] = useState(null);

  // ── Real-time orders listener ──────────────────
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "bookings"),
      where("clientUid", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  // ── Real-time active plan listener ────────────
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "plans"),
      where("clientUid", "==", user.uid),
      where("status", "==", "active")
    );
    const unsub = onSnapshot(q, (snap) => {
      setActivePlan(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() });
    });
    return () => unsub();
  }, [user]);

  // ── Real-time pending subscription listener ───
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "subscriptionRequests"),
      where("clientUid", "==", user.uid),
      where("status", "==", "pending")
    );
    const unsub = onSnapshot(q, (snap) => {
      setPendingSubscription(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() });
    });
    return () => unsub();
  }, [user]);

  // ── Write a booking to Firestore ──────────────
  const handleBookingSubmit = async (bookingData) => {
    await addDoc(collection(db, "bookings"), {
      ...bookingData,
      clientUid:   user.uid,
      clientName:  user.displayName || user.email,
      clientEmail: user.email,
      status:      "pending",
      createdAt:   serverTimestamp(),
    });
  };

  // ── Write a subscription request to Firestore ─
  const handleSubscribeRequest = async ({ plan, payment }) => {
    await addDoc(collection(db, "subscriptionRequests"), {
      clientUid:   user.uid,
      clientName:  user.displayName || user.email,
      clientEmail: user.email,
      plan,
      payment,
      status:      "pending",
      createdAt:   serverTimestamp(),
    });
  };

  const activeOrders      = orders.filter(o => o.status !== "collected");
  const activeOrderCount  = activeOrders.length;

  if (!user) return null; // handled by your router/auth guard

  return (
    <div style={{
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      background: C.bg, minHeight: "100vh",
      maxWidth: 430, margin: "0 auto",
      position: "relative", paddingBottom: 80,
    }}>
      {tab === "home"    && <HomeScreen    user={user} activePlan={activePlan} orders={orders} activeOrders={activeOrders} setTab={setTab} />}
      {tab === "orders"  && <OrdersScreen  user={user} orders={orders} />}
      {tab === "book"    && <BookingScreen user={user} activePlan={activePlan} onSubmit={handleBookingSubmit} />}
      {tab === "plan"    && <PlanScreen    user={user} activePlan={activePlan} pendingSubscription={pendingSubscription} onSubscribe={handleSubscribeRequest} />}
      {tab === "profile" && <ProfileScreen user={user} activePlan={activePlan} onSignOut={signOut} />}

      <BottomNav
        tab={tab}
        setTab={setTab}
        activeOrderCount={activeOrderCount}
        planPending={!!pendingSubscription}
      />
    </div>
  );
}
