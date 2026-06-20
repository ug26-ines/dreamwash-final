// src/components/LoginScreen.jsx
import { useState } from 'react'
import { useAuth } from '../shared/AuthContext'

const C = {
  navy:  '#0c1f35',
  navy2: '#152d47',
  navy3: '#1e3a57',
  cyan:  '#00b8a0',
  cyan2: '#009b86',
  text2: 'rgba(255,255,255,.55)',
  text3: 'rgba(255,255,255,.3)',
  border: 'rgba(255,255,255,.1)',
}

const ERROR_MSGS = {
  'auth/invalid-credential':     'Email or password is incorrect.',
  'auth/user-not-found':         'No account found with this email.',
  'auth/wrong-password':         'Incorrect password.',
  'auth/email-already-in-use':   'This email is already registered.',
  'auth/weak-password':          'Password must be at least 6 characters.',
  'auth/invalid-email':          'Please enter a valid email address.',
  'auth/too-many-requests':      'Too many attempts. Please wait a moment.',
  'auth/network-request-failed': 'Network error — check your connection.',
}

const PORTAL_META = {
  ceo:          { icon: '👑', title: 'CEO Portal',    sub: 'Executive access only',     canRegister: false },
  receptionist: { icon: '🖥️', title: 'Staff POS',     sub: 'Receptionist access',        canRegister: false },
  client:       { icon: '👗', title: 'My Dream Wash', sub: 'Track your laundry orders',  canRegister: true  },
}

export default function LoginScreen({ portalType }) {
  const { login, register } = useAuth()
  const meta = PORTAL_META[portalType] || PORTAL_META.client

  const [mode,  setMode]  = useState('login')
  const [name,  setName]  = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [pwd,   setPwd]   = useState('')
  const [error, setError] = useState('')
  const [busy,  setBusy]  = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')

    if (mode === 'register') {
      if (!name.trim()) { setError('Please enter your full name.'); return }
      const cleanPhone = phone.replace(/\s/g, '')
      if (!cleanPhone || !/^07[2389]\d{7}$/.test(cleanPhone)) {
        setError('Enter a valid Rwandan phone number (e.g. 0780 000 000)')
        return
      }
    }

    setBusy(true)
    try {
      if (mode === 'register') {
        await register(email, pwd, name.trim(), phone.replace(/\s/g, ''))
      } else {
        await login(email, pwd)
      }
    } catch (err) {
      setError(ERROR_MSGS[err.code] || err.message || 'An error occurred.')
    }
    setBusy(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 24,
      background: `radial-gradient(ellipse 80% 70% at 30% 40%, rgba(0,184,160,.07), transparent 60%), ${C.navy}`,
    }}>
      {/* Subtle grid */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage:
          'linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),' +
          'linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px)',
        backgroundSize: '60px 60px',
        maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 20%, transparent 75%)',
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420, animation: 'dw-slide-up .4s ease' }}>
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 58, height: 58, borderRadius: 15, background: C.cyan,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'IBM Plex Mono',monospace", fontSize: 15, fontWeight: 700,
            color: C.navy, letterSpacing: '.04em', marginBottom: 18,
            boxShadow: '0 8px 32px rgba(0,184,160,.35)',
          }}>DW</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 4, letterSpacing: '-.01em' }}>
            Dream Wash
          </div>
          <div style={{ fontSize: 11, color: C.text3, letterSpacing: '.1em', textTransform: 'uppercase' }}>
            Musanze · Rwanda
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: C.navy2,
          border: `1px solid ${C.border}`,
          borderRadius: 22,
          padding: '36px 32px',
          boxShadow: '0 24px 64px rgba(0,0,0,.45)',
        }}>
          {/* Portal identity */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 26, marginBottom: 10 }}>{meta.icon}</div>
            <div style={{ fontSize: 21, fontWeight: 700, color: '#fff', marginBottom: 5, letterSpacing: '-.01em' }}>
              {meta.title}
            </div>
            <div style={{ fontSize: 13, color: C.text2 }}>{meta.sub}</div>
          </div>

          {/* Mode toggle — client portal only */}
          {meta.canRegister && (
            <div style={{
              display: 'flex', background: 'rgba(0,0,0,.25)',
              borderRadius: 11, padding: 4, marginBottom: 26,
            }}>
              {['login', 'register'].map(m => (
                <button key={m} onClick={() => { setMode(m); setError('') }}
                  style={{
                    flex: 1, padding: '9px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: mode === m ? C.cyan : 'transparent',
                    color:      mode === m ? C.navy  : C.text2,
                    fontWeight: 600, fontSize: 13, transition: 'all .15s',
                  }}>
                  {m === 'login' ? 'Sign In' : 'Register'}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={submit}>
            {mode === 'register' && (
              <Field label="Full Name">
                <Input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Amahoro Jean Pierre" required />
              </Field>
            )}
            {mode === 'register' && (
              <Field label="Phone Number">
                <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="0780 000 000" required />
              </Field>
            )}
            <Field label="Email Address">
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required />
            </Field>
            <Field label="Password">
              <Input type="password" value={pwd} onChange={e => setPwd(e.target.value)}
                placeholder="••••••••" required />
            </Field>

            {error && (
              <div style={{
                background: 'rgba(220,38,38,.12)', border: '1px solid rgba(220,38,38,.3)',
                borderRadius: 9, padding: '10px 14px',
                fontSize: 13, color: '#fca5a5', marginBottom: 18, lineHeight: 1.4,
              }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={busy} style={{
              width: '100%', padding: '13px', borderRadius: 11, border: 'none',
              background: busy ? 'rgba(0,184,160,.5)' : C.cyan,
              color: C.navy, fontWeight: 700, fontSize: 14,
              cursor: busy ? 'not-allowed' : 'pointer',
              transition: 'background .15s, transform .1s',
              letterSpacing: '.01em',
            }}
            onMouseEnter={e => { if (!busy) e.target.style.background = C.cyan2 }}
            onMouseLeave={e => { if (!busy) e.target.style.background = C.cyan }}>
              {busy ? 'Please wait…' : mode === 'register' ? 'Create Account →' : 'Sign In →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: 'rgba(255,255,255,.15)', letterSpacing: '.03em' }}>
          © 2025 Dream Wash · All rights reserved
        </p>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        display: 'block', fontSize: 11, fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '.08em',
        color: 'rgba(255,255,255,.35)', marginBottom: 6,
      }}>{label}</label>
      {children}
    </div>
  )
}

function Input({ style: extraStyle, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      {...props}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: '100%', padding: '11px 14px',
        background: 'rgba(0,0,0,.22)',
        border: `1.5px solid ${focused ? 'rgba(0,184,160,.7)' : 'rgba(255,255,255,.1)'}`,
        borderRadius: 9, color: '#fff', fontSize: 14, outline: 'none',
        transition: 'border-color .15s',
        ...extraStyle,
      }}
    />
  )
}
