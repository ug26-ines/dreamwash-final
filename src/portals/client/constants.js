// ─────────────────────────────────────────────────────────
// constants.js
// src/portals/client/constants.js
// Shared across all client portal screens
// ─────────────────────────────────────────────────────────

export const C = {
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

export const WALKIN_SERVICES = [
  { id: "full",     label: "Full Service", desc: "Wash + dry + iron", price: 1500 },
  { id: "wash_dry", label: "Wash & Dry",   desc: "Wash and dry only", price: 1200 },
  { id: "iron",     label: "Iron Only",    desc: "Pressing only",      price: 600  },
  { id: "express",  label: "Express Full", desc: "Ready in 4 hrs",     price: 2000 },
];

export const PLANS = [
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

export const PLAN_COVERS = {
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

export const TIME_SLOTS = [
  "7:00 AM", "9:00 AM", "11:00 AM",
  "1:00 PM", "3:00 PM", "5:00 PM",
];

export const fmt      = (n) => Number(n).toLocaleString();
export const todayStr = new Date().toISOString().split("T")[0];
