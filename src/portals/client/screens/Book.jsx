import { useState } from 'react';
import { addDocument } from '../../../hooks/useFirestore';

const TIME_SLOTS = ['8:00 AM – 10:00 AM', '10:00 AM – 12:00 PM', '2:00 PM – 4:00 PM', '4:00 PM – 6:00 PM'];
const SERVICES   = ['Full Wash', 'Wash & Dry', 'Iron Only'];

export default function ClientBook({ client, toast }) {
  const [form, setForm] = useState({
    date: '', timeSlot: '', service: '', location: '', kg: '', notes: '',
  });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const pick = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.date)     e.date     = 'Pick a date';
    if (!form.timeSlot) e.timeSlot = 'Choose a time slot';
    if (!form.location) e.location = 'Enter pickup location';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await addDocument('booking_requests', {
        clientId:   client.id,
        clientName: client.name,
        phone:      client.phone,
        ...form,
        status: 'pending',
      });
      setDone(true);
    } catch { toast('Submission failed — try again','error'); }
    setLoading(false);
  };

  if (done) return (
    <div className="page-content flex-center flex-col" style={{ paddingBottom:'5rem', gap:'1rem', textAlign:'center', paddingTop:'4rem' }}>
      <div style={{ fontSize:60 }}>🎉</div>
      <h2 style={{ fontFamily:'var(--font-head)' }}>Booking Submitted!</h2>
      <p className="text-muted">We'll confirm via phone or WhatsApp soon.</p>
      <button className="btn btn-primary" onClick={() => { setDone(false); setForm({ date:'', timeSlot:'', service:'', location:'', kg:'', notes:'' }); }}>
        Book Another →
      </button>
    </div>
  );

  return (
    <div className="page-content" style={{ paddingBottom:'5rem' }}>
      <h2 style={{ margin:'1rem 0 0.25rem', fontFamily:'var(--font-head)' }}>Book Pickup</h2>
      <p className="text-muted text-sm" style={{ marginBottom:'1.5rem' }}>We'll come to you in Musanze.</p>

      <div className="flex-col gap-2">
        <div className="field">
          <label>Date *</label>
          <input className="input" type="date" value={form.date} onChange={set('date')}
            min={new Date().toISOString().split('T')[0]} />
          {errors.date && <span className="field-error">{errors.date}</span>}
        </div>

        <div className="field">
          <label>Time Slot *</label>
          <div className="pill-group">
            {TIME_SLOTS.map(s => (
              <button key={s} className={`pill ${form.timeSlot===s?'active':''}`} onClick={()=>pick('timeSlot',s)}>{s}</button>
            ))}
          </div>
          {errors.timeSlot && <span className="field-error">{errors.timeSlot}</span>}
        </div>

        <div className="field">
          <label>Service needed</label>
          <div className="pill-group">
            {SERVICES.map(s => (
              <button key={s} className={`pill ${form.service===s?'active':''}`} onClick={()=>pick('service',s)}>{s}</button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Pickup location *</label>
          <input className="input" placeholder="Hostel name, room, or address" value={form.location} onChange={set('location')} />
          {errors.location && <span className="field-error">{errors.location}</span>}
        </div>

        <div className="field">
          <label>Estimated weight (kg) <span className="text-muted">(optional)</span></label>
          <input className="input" type="number" min="0" step="0.5" placeholder="e.g. 4"
            value={form.kg} onChange={set('kg')} style={{ fontFamily:'var(--font-mono)' }} />
          <span className="field-error" style={{ color:'var(--muted)' }}>Helps us plan — not binding</span>
        </div>

        <div className="field">
          <label>Notes <span className="text-muted">(optional)</span></label>
          <textarea className="textarea" rows={3} placeholder="Stains, delicates, special instructions…"
            value={form.notes} onChange={set('notes')} />
        </div>

        <button className="btn btn-primary btn-full btn-lg" disabled={loading} onClick={submit}>
          {loading ? <span className="spinner" /> : 'Submit Booking Request →'}
        </button>
      </div>
    </div>
  );
}
