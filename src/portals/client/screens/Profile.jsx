// ─────────────────────────────────────────────────────────
// Profile.jsx
// src/portals/client/screens/Profile.jsx
// NEW file — did not exist before
// ─────────────────────────────────────────────────────────

import { C } from "../constants";
import { Avatar, Card } from "../Atoms";

export default function Profile({ user, activePlan, onSignOut }) {
  const initials    = user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "?";
  const displayName = user?.displayName || user?.email?.split("@")[0] || "Client";
  const tier        = activePlan ? "SUBSCRIBER" : "STANDARD";

  const menuItems = [
    { icon: "📋", label: "Order History",   sub: "View all past orders"    },
    { icon: "🎓", label: "My Subscription", sub: "Manage plan & payments"  },
    { icon: "🔔", label: "Notifications",   sub: "Order updates"           },
    { icon: "❓", label: "Help & Support",  sub: "FAQs and contact"        },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ background: C.dark, padding: "16px 20px 14px", display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar initials={initials} />
        <span style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>My Profile</span>
      </div>

      <div style={{ padding: 16 }}>

        {/* Profile card */}
        <Card style={{ padding: "28px 20px", textAlign: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <Avatar initials={initials} size={64} />
          </div>
          <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 4 }}>{displayName}</div>
          <div style={{ color: C.muted, fontSize: 13, marginBottom: 12 }}>{user?.email}</div>
          <span style={{
            background: activePlan ? C.accentLight : "#F3F4F6",
            borderRadius: 6, padding: "4px 12px",
            fontSize: 10, fontWeight: 700,
            color: activePlan ? C.accent : C.muted,
            letterSpacing: "0.07em",
          }}>
            {tier}
          </span>
        </Card>

        {/* Menu items */}
        {menuItems.map(item => (
          <Card key={item.label} style={{ padding: "14px 16px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{item.label}</div>
              <div style={{ color: C.muted, fontSize: 12, marginTop: 1 }}>{item.sub}</div>
            </div>
            <span style={{ color: C.muted, fontSize: 18 }}>›</span>
          </Card>
        ))}

        {/* Sign out */}
        <button onClick={onSignOut} style={{ width: "100%", background: C.dangerLight, color: C.danger, border: `1.5px solid ${C.dangerBorder}`, borderRadius: 12, padding: "14px", fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 6 }}>
          Sign Out
        </button>

      </div>
    </div>
  );
}
