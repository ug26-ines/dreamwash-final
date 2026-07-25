// ─────────────────────────────────────────────────────────
// Book.jsx
// src/portals/client/screens/Book.jsx
// ─────────────────────────────────────────────────────────

import { useState } from "react";
import { C, WALKIN_SERVICES, TIME_SLOTS, fmt, todayStr } from "../constants";
import { Avatar, Card, Lbl } from "../Atoms";

export default function Book({ user, activePlan, onSubmit }) {
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
      });
      setSent(true);
    } catch (e) {
      setError("Failed to send booking. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSent(false); setDate(""); setTimeSlot(""); setNotes(""); setKg(3);
  };

  // ── Success screen ──────────────────────────────
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
        <button onClick={resetForm} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 10, padding: "13px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          Book Another
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ background: C.dark, padding: "16px 20px 14px", display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar initials={initials} />
        <span style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>Book Drop-off</span>
      </div>

      <div style={{ padding: "16px 16px 100px" }}>

        {/* ── Subscriber: plan quota display ── */}
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

        {/* ── Walk-in: service picker ── */}
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

        {/* Time slots */}
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

        {/* Weight slider */}
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

          {/* Subscriber breakdown bar */}
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
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="e.g. Handle gym wear gently..." rows={3}
          style={{ width: "100%", padding: "12px 14px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 14, fontFamily: "inherit", resize: "none", color: C.text, background: C.surface, boxSizing: "border-box", outline: "none", marginBottom: 20 }} />

        {/* Error */}
        {error && <div style={{ color: C.danger, fontSize: 13, marginBottom: 12, textAlign: "center" }}>{error}</div>}

        {/* Cost summary + CTA */}
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
