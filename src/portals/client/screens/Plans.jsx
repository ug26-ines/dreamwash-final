// ─────────────────────────────────────────────────────────
// Plans.jsx
// src/portals/client/screens/Plans.jsx
// ─────────────────────────────────────────────────────────

import { useState } from "react";
import { C, PLANS, PLAN_COVERS, fmt } from "../constants";
import { Avatar, Lbl } from "../Atoms";

export default function Plans({ user, activePlan, pendingSubscription, onSubscribe }) {
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
      {/* Header */}
      <div style={{ background: C.dark, padding: "16px 20px 14px", display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar initials={initials} color="#16A34A" />
        <span style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>My Plan</span>
      </div>

      <div style={{ padding: 16 }}>

        {/* Active plan banner */}
        {activePlan && (
          <div style={{ background: C.accentLight, border: `1.5px solid ${C.accent}`, borderRadius: 14, padding: "16px 18px", marginBottom: 14 }}>
            <div style={{ color: C.accent, fontWeight: 700, fontSize: 13, marginBottom: 2 }}>✅ Active Plan</div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{activePlan.planName}</div>
            <div style={{ color: C.muted, fontSize: 13, marginTop: 2 }}>{activePlan.kgLeft} kg remaining of {activePlan.kgTotal} kg</div>
          </div>
        )}

        {/* Pending banner */}
        {isPending && !activePlan && (
          <div style={{ background: C.warnLight, border: `1.5px solid ${C.warnBorder}`, borderRadius: 14, padding: "14px 18px", marginBottom: 14 }}>
            <div style={{ color: C.warn, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>⏳ Pending at Reception</div>
            <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>
              Your request is in the queue. Visit the reception and pay to activate your plan.
            </div>
          </div>
        )}

        {/* Plan picker — only when no active plan */}
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
                  {/* BEST VALUE — full width top strip, never crosses price */}
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
                    {/* Price — clean, nothing overlapping */}
                    <div style={{ textAlign: "right", flexShrink: 0, paddingLeft: 16 }}>
                      <div style={{ fontWeight: 800, fontSize: 18, color: selected ? C.accent : C.text }}>RWF {fmt(p.price)}</div>
                      <div style={{ color: C.muted, fontSize: 12 }}>{p.period}</div>
                    </div>
                  </div>

                  {/* Hover: what's included */}
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

            {/* Payment method */}
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

            <button
              onClick={handleSubscribe}
              disabled={isPending || loading}
              style={{ width: "100%", background: isPending ? "#9CA3AF" : C.accent, color: "#fff", border: "none", borderRadius: 12, padding: "16px", fontSize: 16, fontWeight: 700, cursor: isPending ? "default" : "pointer", boxShadow: isPending ? "none" : "0 4px 16px rgba(0,201,167,0.3)" }}
            >
              {loading ? "Sending..." : isPending ? "Request Sent to Reception" : `Send Request — RWF ${fmt(plan.price)}`}
            </button>
            <div style={{ textAlign: "center", color: C.muted, fontSize: 11, marginTop: 12 }}>
              Payment confirmed at the Dream X Wash reception
            </div>
          </>
        )}

      </div>
    </div>
  );
}
