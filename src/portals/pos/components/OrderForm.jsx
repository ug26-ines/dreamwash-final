import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { SERVICE_NAMES, ADDONS, CLIENT_TYPES } from '../../../constants/pricing';
import { SUBSCRIPTION_PLANS } from '../../../constants/plans';
import { calculateOrder } from '../../../utils/calculations';
import { fmtRWF } from '../../../utils/formatters';
import { genOrderId, genWarrantNum } from '../../../utils/generators';
import { addDocument } from '../../../hooks/useFirestore';
import { serverTimestamp, doc, setDoc, getFirestore } from 'firebase/firestore';


const auth = getAuth();
const db   = getFirestore();

const SERVICES = Object.entries(SERVICE_NAMES).map(([key, name]) => ({ key, name }));
const PAYMENT_METHODS = ['cash', 'momo'];

export default function OrderForm({ clients, onSuccess, toast }) {
  const [step,      setStep]     = useState(1);
  const [clientId,  setClientId] = useState('');
  const [search,    setSearch]   = useState('');
  const [weight,    setWeight]   = useState('');
  const [service,   setService]  = useState('full');
  const [addons,    setAddons]   = useState([]);
  const [payment,   setPayment]  = useState('cash');
  const [notes,     setNotes]    = useState('');
  const [loading,   setLoading]  = useState(false);
  const [showReg,    setShowReg]    = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [newClient,  setNewClient]  = useState({ name: '', phone: '', hostel: '' });

  const client      = clients.find(c => c.id === clientId);
  const filtered    = clients.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  ).slice(0, 20);

  const kgRemaining = client?.subscription?.kgRemaining ?? 0;
  const calc        = weight ? calculateOrder(parseFloat(weight), service, client?.type || 'walkin', addons, kgRemaining) : null;

  const toggleAddon = (key) => setAddons(prev => prev.includes(key) ? prev.filter(k=>k!==key) : [...prev, key]);

  const registerClient = async () => {
    const cleanPhone = newClient.phone.replace(/\s/g, '');
    if (!newClient.name.trim()) { toast('Enter client name', 'error'); return; }
    if (!cleanPhone)             { toast('Enter phone number', 'error'); return; }

    setRegLoading(true);
    try {
      const email    = `${cleanPhone}@dreamxwash.rw`;
      const password = 'Rwanda@123';

      let uid;
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        uid = cred.user.uid;
      } catch (authErr) {
        if (authErr.code === 'auth/email-already-in-use') {
          const existing = await signInWithEmailAndPassword(auth, email, password);
          uid = existing.user.uid;
        } else {
          throw authErr;
        }
      }

      // FIX: createUserWithEmailAndPassword signs in as the new client.
      // We now write BOTH documents while authenticated as the new client:

      // 1. clients/{uid} — CRM record (Firestore rule now allows isAuth() && uid == id)
      await setDoc(doc(db, 'clients', uid), {
        uid,
        name:         newClient.name.trim(),
        phone:        cleanPhone,
        hostel:       newClient.hostel.trim(),
        email,
        type:         'walkin',
        orders:       0,
        totalSpent:   0,
        createdAt:    serverTimestamp(),
        registeredBy: 'pos',
      }, { merge: true });

      // 2. users/{uid} — role document so client can log into the portal
      // Rule allows: isAuth() && request.auth.uid == uid && role == 'client'
      await setDoc(doc(db, 'users', uid), {
        uid,
        name:      newClient.name.trim(),
        phone:     cleanPhone,
        email,
        role:      'client',
        createdAt: serverTimestamp(),
      }, { merge: true });

      toast(`${newClient.name.trim()} registered`, 'success');
      await signInWithEmailAndPassword(auth, 'pos@dreamwash.rw', 'Rwanda@123');
      setShowReg(false);
      setNewClient({ name: '', phone: '', hostel: '' });
      setSearch(newClient.name.trim());
    } catch (err) {
      toast('Registration failed: ' + err.message, 'error');
    }
    setRegLoading(false);
  };

  const submit = async () => {
    if (!client || !weight || !service) return;
    setLoading(true);
    try {
      const orderId    = genOrderId();
      const warrantNum = genWarrantNum();
      await addDocument('orders', {
        orderId, warrantNum,
        clientId:   client.id,
        clientName: client.name,
        clientType: client.type,
        weight:     parseFloat(weight),
        service, addons, payment, notes,
        ...calc,
        stage:     'received',
        ebm:       { status: 'pending', receiptNo: null },
        createdBy: 'pos',
      });
      toast(`Order ${orderId} created`, 'success');
      onSuccess?.();
      setStep(1); setClientId(''); setSearch(''); setWeight('');
      setService('full'); setAddons([]); setPayment('cash'); setNotes('');
    } catch (e) {
      toast('Failed to create order', 'error');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 560 }}>
      {/* Step indicators */}
      <div className="flex gap-1" style={{ marginBottom: '1.5rem' }}>
        {['Client','Service','Review'].map((s,i) => (
          <div key={s} style={{ flex:1, textAlign:'center' }}>
            <div style={{
              height: 3, borderRadius: 2, marginBottom: '0.35rem',
              background: i+1 <= step ? 'var(--accent)' : 'var(--border)',
              transition: 'background 200ms',
            }} />
            <span style={{ fontSize:'0.75rem', color: i+1===step ? 'var(--accent)' : 'var(--muted)' }}>{s}</span>
          </div>
        ))}
      </div>

      {/* Step 1 — Client */}
      {step === 1 && (
        <div className="flex-col gap-2">
          <div className="field">
            <label>Search client</label>
            <input className="input" placeholder="Name or phone…" value={search} onChange={e=>setSearch(e.target.value)} autoFocus />
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto', display:'flex', flexDirection:'column', gap:'0.5rem' }}>
            {filtered.map(c => (
              <div key={c.id} className="card card-sm" style={{
                cursor:'pointer', border: clientId===c.id ? '1px solid var(--accent)' : undefined,
                background: clientId===c.id ? 'var(--accent-dim)' : undefined,
              }} onClick={() => setClientId(c.id)}>
                <div className="flex-between">
                  <div>
                    <div className="fw-600" style={{ fontFamily:'var(--font-head)' }}>{c.name}</div>
                    <div className="text-muted text-sm">{c.phone} · {CLIENT_TYPES[c.type] || c.type}</div>
                  </div>
                  {c.subscription?.kgRemaining > 0 && (
                    <span className="badge badge-teal">{c.subscription.kgRemaining} kg left</span>
                  )}
                </div>
              </div>
            ))}
            {!filtered.length && (
              <div>
                <p className="text-muted text-sm" style={{ marginBottom: '0.75rem' }}>
                  No clients found.
                </p>
                <button className="btn btn-ghost btn-full" onClick={() => setShowReg(true)}
                  style={{ border: '1px dashed var(--accent)', color: 'var(--accent)' }}>
                  + Register New Client
                </button>
              </div>
            )}

            {showReg && (
              <div className="card" style={{ background:'var(--accent-dim)', border:'1px solid var(--accent)', marginTop: '0.75rem' }}>
                <p className="fw-600" style={{ color:'var(--accent)', marginBottom:'0.75rem' }}>
                  Register New Client
                </p>
                <div className="field">
                  <label>Full Name *</label>
                  <input className="input" placeholder="Amahoro Jean"
                    value={newClient.name}
                    onChange={e => setNewClient({ ...newClient, name: e.target.value })} />
                </div>
                <div className="field">
                  <label>Phone Number *</label>
                  <input className="input" placeholder="0780 000 000" type="tel"
                    value={newClient.phone}
                    onChange={e => setNewClient({ ...newClient, phone: e.target.value })} />
                </div>
                <div className="field">
                  <label>Hostel / Area</label>
                  <input className="input" placeholder="e.g. INES Dorm B"
                    value={newClient.hostel}
                    onChange={e => setNewClient({ ...newClient, hostel: e.target.value })} />
                </div>
                <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: '0.75rem' }}>
                  Portal password will be set to <strong>Rwanda@123</strong>
                </p>
                <div className="flex gap-1">
                  <button className="btn btn-ghost" onClick={() => setShowReg(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" style={{ flex: 1 }}
                    disabled={regLoading} onClick={registerClient}>
                    {regLoading ? 'Creating…' : 'Register Client'}
                  </button>
                </div>
              </div>
            )}
          </div>
          <button className="btn btn-primary btn-full" disabled={!clientId} onClick={()=>setStep(2)}>
            Continue →
          </button>
        </div>
      )}

      {/* Step 2 — Service */}
      {step === 2 && (
        <div className="flex-col gap-2">
          {client && (
            <div className="card card-sm flex-between" style={{ marginBottom:'0.5rem' }}>
              <div>
                <div className="fw-600">{client.name}</div>
                <div className="text-muted text-sm">{CLIENT_TYPES[client.type]}</div>
              </div>
              {kgRemaining > 0 && <span className="badge badge-teal">{kgRemaining} kg remaining</span>}
            </div>
          )}

          <div className="field">
            <label>Weight (kg)</label>
            <input className="input" type="number" min="0.1" step="0.1" placeholder="e.g. 3.5"
              value={weight} onChange={e=>setWeight(e.target.value)} style={{ fontFamily:'var(--font-mono)' }} />
          </div>

          <div className="field">
            <label>Service</label>
            <div className="pill-group">
              {SERVICES.map(s => (
                <button key={s.key} className={`pill ${service===s.key?'active':''}`} onClick={()=>setService(s.key)}>{s.name}</button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Add-ons (optional)</label>
            <div className="pill-group">
              {ADDONS.map(a => (
                <button key={a.key} className={`pill ${addons.includes(a.key)?'active':''}`} onClick={()=>toggleAddon(a.key)}>
                  {a.name} <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.75rem' }}>{fmtRWF(a.price)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Payment method</label>
            <div className="pill-group">
              {PAYMENT_METHODS.map(m => (
                <button key={m} className={`pill ${payment===m?'active':''}`} onClick={()=>setPayment(m)}>
                  {m === 'cash' ? 'Cash' : 'MoMo'}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Notes</label>
            <textarea className="textarea" rows={2} placeholder="Stains, special instructions…" value={notes} onChange={e=>setNotes(e.target.value)} />
          </div>

          {calc && (
            <div className="card" style={{ background:'var(--accent-dim)', border:'1px solid var(--accent)' }}>
              <div className="flex-between mb-1"><span className="text-muted text-sm">Base</span><span className="mono">{fmtRWF(calc.base)}</span></div>
              {calc.addonTotal > 0 && <div className="flex-between mb-1"><span className="text-muted text-sm">Add-ons</span><span className="mono">{fmtRWF(calc.addonTotal)}</span></div>}
              <div className="flex-between mb-1"><span className="text-muted text-sm">VAT (incl.)</span><span className="mono">{fmtRWF(calc.vat)}</span></div>
              <hr className="divider" style={{ margin:'0.5rem 0' }} />
              <div className="flex-between"><span className="fw-600">Total</span><span className="mono fw-700" style={{ color:'var(--accent)', fontSize:'1.125rem' }}>{fmtRWF(calc.total)}</span></div>
            </div>
          )}

          <div className="flex gap-1">
            <button className="btn btn-ghost" onClick={()=>setStep(1)}>← Back</button>
            <button className="btn btn-primary" style={{ flex:1 }} disabled={!weight || parseFloat(weight) <= 0} onClick={()=>setStep(3)}>Review →</button>
          </div>
        </div>
      )}

      {/* Step 3 — Review */}
      {step === 3 && calc && client && (
        <div className="flex-col gap-2">
          <div className="card">
            <h3 style={{ fontFamily:'var(--font-head)', marginBottom:'0.75rem' }}>Order Summary</h3>
            <div className="flex-between mb-1"><span className="text-muted text-sm">Client</span><span className="fw-600">{client.name}</span></div>
            <div className="flex-between mb-1"><span className="text-muted text-sm">Service</span><span>{SERVICE_NAMES[service]}</span></div>
            <div className="flex-between mb-1"><span className="text-muted text-sm">Weight</span><span className="mono">{weight} kg</span></div>
            {addons.length > 0 && <div className="flex-between mb-1"><span className="text-muted text-sm">Add-ons</span><span>{addons.map(k=>ADDONS.find(a=>a.key===k)?.name).join(', ')}</span></div>}
            <div className="flex-between mb-1"><span className="text-muted text-sm">Payment</span><span>{payment === 'cash' ? 'Cash' : 'MoMo'}</span></div>
            <hr className="divider" />
            <div className="flex-between mb-1"><span className="text-muted text-sm">Net</span><span className="mono">{fmtRWF(calc.net)}</span></div>
            <div className="flex-between mb-1"><span className="text-muted text-sm">VAT (18%)</span><span className="mono">{fmtRWF(calc.vat)}</span></div>
            <div className="flex-between"><span className="fw-700 font-head">Total</span><span className="mono fw-700" style={{ color:'var(--accent)', fontSize:'1.25rem' }}>{fmtRWF(calc.total)}</span></div>
          </div>

          <div className="flex gap-1">
            <button className="btn btn-ghost" onClick={()=>setStep(2)}>← Back</button>
            <button className="btn btn-primary" style={{ flex:1 }} disabled={loading} onClick={submit}>
              {loading ? <span className="spinner" /> : 'Confirm & Create Order'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
