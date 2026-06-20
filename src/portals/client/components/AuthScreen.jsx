import { useState } from 'react';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc, getFirestore, serverTimestamp } from 'firebase/firestore';

const auth = getAuth();
const db   = getFirestore();

const toEmail = (phone) =>
  `${phone.replace(/\s/g, '')}@dreamxwash.rw`;

export default function AuthScreen() {
  const [mode,     setMode]     = useState('login');
  const [phone,    setPhone]    = useState('');
  const [password, setPassword] = useState('');
  const [name,     setName]     = useState('');
  const [hostel,   setHostel]   = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanPhone = phone.replace(/\s/g, '');
    const email      = toEmail(cleanPhone);

    try {
      if (mode === 'register') {
        if (!name.trim()) { setError('Enter your full name.'); setLoading(false); return; }
        if (!cleanPhone)   { setError('Enter your phone number.'); setLoading(false); return; }

        const cred = await createUserWithEmailAndPassword(auth, email, password);

        await setDoc(doc(db, 'clients', cred.user.uid), {
          uid:          cred.user.uid,
          name:         name.trim(),
          phone:        cleanPhone,
          hostel:       hostel.trim(),
          email,
          orders:       0,
          totalSpent:   0,
          createdAt:    serverTimestamp(),
          registeredBy: 'portal',
        });

      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError(
          'This phone is already registered. Sign in using your phone and password. ' +
          'If you were registered by the receptionist, use password: Rwanda@123'
        );
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Incorrect password. If registered at the shop, try: Rwanda@123');
      } else if (err.code === 'auth/user-not-found') {
        setError('No account found. Please register first.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password must be at least 6 characters.');
      } else {
        setError(err.message);
      }
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 24, background: '#050e1a',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            fontSize: 26, fontWeight: 800, color: '#00d4b8',
            letterSpacing: '-0.02em', marginBottom: 4,
          }}>Dream X Wash</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)' }}>
            Musanze, Rwanda
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: '#0d1f33', borderRadius: 18,
          padding: '32px 28px', border: '1px solid rgba(255,255,255,.08)',
        }}>

          {/* Toggle */}
          <div style={{
            display: 'flex', background: 'rgba(0,0,0,.3)',
            borderRadius: 10, padding: 4, marginBottom: 26,
          }}>
            {['login', 'register'].map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                style={{
                  flex: 1, padding: '9px', borderRadius: 7, border: 'none',
                  background: mode === m ? '#00d4b8' : 'transparent',
                  color: mode === m ? '#050e1a' : 'rgba(255,255,255,.45)',
                  fontWeight: 600, fontSize: 13, cursor: 'pointer',
                }}>
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>

            {/* Name — register only */}
            {mode === 'register' && (
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="Amahoro Jean" style={inputStyle} />
              </div>
            )}

            {/* Phone */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Phone Number</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="0780 000 000" style={inputStyle} />
            </div>

            {/* Hostel / Area — register only */}
            {mode === 'register' && (
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Hostel / Area</label>
                <input value={hostel} onChange={e => setHostel(e.target.value)}
                  placeholder="e.g. INES Dorm B" style={inputStyle} />
              </div>
            )}

            {/* Password */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Password</label>
              <input type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'login' ? '••••••••' : 'Min 6 characters'}
                style={inputStyle} />
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: 'rgba(220,38,38,.12)', border: '1px solid rgba(220,38,38,.3)',
                borderRadius: 9, padding: '10px 14px', marginBottom: 16,
                fontSize: 13, color: '#fca5a5', lineHeight: 1.5,
              }}>{error}</div>
            )}

            {/* Hint for POS-registered clients */}
            {mode === 'login' && (
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,.25)', marginBottom: 14 }}>
                Registered at the shop? Use your phone number and password{' '}
                <span style={{ color: 'rgba(255,255,255,.45)', fontWeight: 600 }}>
                  Rwanda@123
                </span>
              </p>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: 13, borderRadius: 10, border: 'none',
              background: loading ? 'rgba(0,212,184,.4)' : '#00d4b8',
              color: '#050e1a', fontWeight: 700, fontSize: 14,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}>
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '.07em',
  color: 'rgba(255,255,255,.35)', marginBottom: 5,
};
const inputStyle = {
  width: '100%', padding: '10px 13px',
  background: 'rgba(255,255,255,.05)',
  border: '1.5px solid rgba(255,255,255,.1)',
  borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none',
};