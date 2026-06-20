// src/App.jsx
import { useEffect } from 'react'
import { AuthProvider, useAuth } from './shared/AuthContext'
import LoginScreen        from './components/LoginScreen'
import CeoDashboard       from './portals/ceo/CeoDashboard'
import ReceptionistPortal from './portals/receptionist/ReceptionistPortal'
import ClientPortal       from './portals/client/ClientPortal'

// ── PORTAL DETECTOR ───────────────────────────────────────────────────────────
// Route by URL path / hostname:
//   /admin  or  /ceo    → CEO portal
//   /pos    or  /staff  → Receptionist portal
//   /portal or  /       → Client portal (default)
//
// The marketing page lives at the true domain root (public/index.html, served
// as dist/index.html by Firebase Hosting). The React app is compiled from
// app.html and served only at the paths listed in firebase.json rewrites.
// A visitor who hits /admin or /pos gets app.html → React → correct portal.
// A visitor who hits / gets the static marketing page — not the React app.
function detectPortal() {
  const p = window.location.pathname
  const h = window.location.hostname
  if (h.startsWith('admin') || p.startsWith('/admin') || p.startsWith('/ceo'))    return 'ceo'
  if (h.startsWith('staff') || p.startsWith('/pos')   || p.startsWith('/staff'))  return 'receptionist'
  return 'client'  // /portal or any unmatched path served by app.html
}

// ── LOADING SCREEN ────────────────────────────────────────────────────────────
function Loading() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#0c1f35',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20,
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 13,
        background: '#00b8a0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, fontWeight: 700,
        color: '#0c1f35', letterSpacing: '.04em',
        animation: 'dw-fade .4s ease',
      }}>DW</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 7, height: 7, borderRadius: '50%',
            background: 'rgba(0,184,160,.6)', display: 'block',
            animation: `dw-pulse 1.2s ${i * .2}s infinite ease-in-out`,
          }} />
        ))}
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.2)', letterSpacing: '.1em', textTransform: 'uppercase' }}>
        Dream Wash · Musanze
      </div>
    </div>
  )
}

// ── GATED APP ─────────────────────────────────────────────────────────────────
function GatedApp({ portal }) {
  const { user, profile, role, loading } = useAuth()

  // Page title per portal
  useEffect(() => {
    const titles = {
      ceo:          'Dream Wash · CEO',
      receptionist: 'Dream Wash · POS',
      client:       'Dream Wash · My Laundry',
    }
    document.title = titles[portal] || 'Dream Wash'
  }, [portal])

  if (loading) return <Loading />

  // Not logged in — show appropriate login form
  if (!user || !profile) return <LoginScreen portalType={portal} />

  // Block non-CEO from CEO URL
  if (portal === 'ceo' && role !== 'ceo') return <LoginScreen portalType="ceo" />

  // Block clients from staff URL
  if (portal === 'receptionist' && !['ceo', 'receptionist'].includes(role)) {
    return <LoginScreen portalType="receptionist" />
  }

  // ── Render correct portal for the authenticated role ──
  // (Portal URL only controls which login form unauthenticated visitors see.
  //  Once logged in, always render the role-correct portal.)
  if (role === 'ceo')          return <CeoDashboard />
  if (role === 'receptionist') return <ReceptionistPortal />
  if (role === 'client')       return <ClientPortal />

  // Unknown role — back to login
  return <LoginScreen portalType={portal} />
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  const portal = detectPortal()
  return (
    <AuthProvider>
      <GatedApp portal={portal} />
    </AuthProvider>
  )
}
