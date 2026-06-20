import { useState } from 'react';
import { Delete } from 'lucide-react';

const STAFF = [
  { id: 'staff-1', name: 'Receptionist', pin: '1234', role: 'receptionist' },
  { id: 'staff-2', name: 'WISDOM WIE',   pin: '5678', role: 'ops' },
  { id: 'staff-3', name: 'Fresh Boy',    pin: '9999', role: 'admin' },
];

export default function PinLogin({ onLogin }) {
  const [pin,   setPin]   = useState('');
  const [error, setError] = useState('');

  const handleKey = (k) => {
    if (pin.length >= 6) return;
    const next = pin + k;
    setPin(next);
    setError('');
    if (next.length >= 4) {
      const staff = STAFF.find(s => s.pin === next);
      if (staff) { onLogin(staff); }
      else if (next.length >= 6) { setError('Incorrect PIN'); setPin(''); }
    }
  };

  const del = () => setPin(p => p.slice(0, -1));

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: 320, textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-head)', color: 'var(--accent)', marginBottom: '0.25rem' }}>Dream X Wash</h1>
        <p style={{ color: 'var(--muted)', marginBottom: '2rem', fontSize: '0.875rem' }}>Receptionist POS — Enter PIN</p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              width: 14, height: 14, borderRadius: '50%',
              background: i < pin.length ? 'var(--accent)' : 'var(--border)',
              transition: 'background 150ms',
            }} />
          ))}
        </div>

        {error && <p style={{ color: 'var(--red)', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem' }}>
          {[1,2,3,4,5,6,7,8,9].map(n => (
            <button key={n} className="btn btn-secondary" style={{ height: 60, fontSize: '1.25rem', fontFamily: 'var(--font-mono)' }}
              onClick={() => handleKey(String(n))}>{n}</button>
          ))}
          <div />
          <button className="btn btn-secondary" style={{ height: 60, fontSize: '1.25rem', fontFamily: 'var(--font-mono)' }}
            onClick={() => handleKey('0')}>0</button>
          <button className="btn btn-ghost" style={{ height: 60 }} onClick={del}><Delete size={20} /></button>
        </div>
      </div>
    </div>
  );
}
