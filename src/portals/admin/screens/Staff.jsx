import { useState } from 'react';
import { useCollection, addDocument, updateDocument, orderBy } from '../../../hooks/useFirestore';
import { fmtDate } from '../../../utils/formatters';

const ROLES = ['receptionist', 'ops', 'admin', 'cleaner'];

export default function AdminStaff({ toast }) {
  const { docs: staff } = useCollection('staff', [orderBy('name')]);
  const [form, setForm] = useState({ name:'', role:'receptionist', phone:'', pin:'' });
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm(p=>({...p,[k]:e.target.value}));

  const save = async () => {
    if (!form.name || !form.pin) return;
    setSaving(true);
    try { await addDocument('staff', form); toast('Staff added','success'); setShow(false); setForm({name:'',role:'receptionist',phone:'',pin:''}); }
    catch { toast('Failed','error'); }
    setSaving(false);
  };

  return (
    <div className="page-content-wide">
      <div className="flex-between" style={{ marginBottom:'1.25rem' }}>
        <h2>Staff</h2>
        <button className="btn btn-primary btn-sm" onClick={()=>setShow(!show)}>+ Add Staff</button>
      </div>

      {show && (
        <div className="card" style={{ marginBottom:'1.25rem', maxWidth:460 }}>
          <h3 style={{ fontFamily:'var(--font-head)', marginBottom:'1rem' }}>New Staff Member</h3>
          <div className="flex-col gap-2">
            <div className="grid-2">
              <div className="field"><label>Full Name *</label><input className="input" value={form.name} onChange={set('name')} /></div>
              <div className="field"><label>Phone</label><input className="input" value={form.phone} onChange={set('phone')} /></div>
            </div>
            <div className="grid-2">
              <div className="field">
                <label>Role</label>
                <select className="select" value={form.role} onChange={set('role')}>
                  {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="field"><label>PIN (4–6 digits) *</label><input className="input" type="password" maxLength={6} value={form.pin} onChange={set('pin')} style={{ fontFamily:'var(--font-mono)' }} /></div>
            </div>
            <div className="flex gap-1">
              <button className="btn btn-ghost" onClick={()=>setShow(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={!form.name||!form.pin||saving} onClick={save}>
                {saving?<span className="spinner"/>:'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Role</th><th>Phone</th><th>Added</th></tr></thead>
          <tbody>
            {staff.map(s=>(
              <tr key={s.id}>
                <td className="fw-600">{s.name}</td>
                <td><span className="badge badge-muted">{s.role}</span></td>
                <td className="mono text-sm">{s.phone||'—'}</td>
                <td className="text-muted text-sm">{fmtDate(s.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!staff.length && <div className="empty-state"><p>No staff added yet</p></div>}
      </div>
    </div>
  );
}
