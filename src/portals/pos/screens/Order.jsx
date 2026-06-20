import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useCollection, addDocument, orderBy } from '../../../hooks/useFirestore';
import OrderForm from '../components/OrderForm';
import { genClientId } from '../../../utils/generators';

export default function POSOrder({ toast }) {
  const { docs: clients } = useCollection('clients', [orderBy('name')]);
  const [tab, setTab]       = useState('order'); // 'order' | 'register'
  const [form, setForm]     = useState({ name:'', phone:'', phone2:'', email:'', area:'', type:'walkin', clientType:'individual' });
  const [saving, setSaving] = useState(false);

  const registerClient = async () => {
    if (!form.name || !form.phone) return;
    setSaving(true);
    try {
      await addDocument('clients', { ...form, clientId: genClientId(), createdBy: 'pos' });
      toast('Client registered', 'success');
      setForm({ name:'', phone:'', phone2:'', email:'', area:'', type:'walkin', clientType:'individual' });
      setTab('order');
    } catch { toast('Failed to register client','error'); }
    setSaving(false);
  };

  return (
    <div className="page-content-wide">
      <div className="flex gap-1" style={{ marginBottom:'1.5rem' }}>
        <button className={`pill ${tab==='order'?'active':''}`} onClick={()=>setTab('order')}>New Order</button>
        <button className={`pill ${tab==='register'?'active':''}`} onClick={()=>setTab('register')}>
          <UserPlus size={14} /> Register Client
        </button>
      </div>

      {tab === 'order' && (
        <OrderForm clients={clients} toast={toast} onSuccess={() => {}} />
      )}

      {tab === 'register' && (
        <div style={{ maxWidth: 480 }}>
          <h3 style={{ fontFamily:'var(--font-head)', marginBottom:'1rem' }}>Register New Client</h3>
          <div className="flex-col gap-2">
            <div className="grid-2">
              <div className="field"><label>Full Name *</label><input className="input" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} /></div>
              <div className="field"><label>Primary Phone *</label><input className="input" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} /></div>
            </div>
            <div className="grid-2">
              <div className="field"><label>Secondary Phone</label><input className="input" value={form.phone2} onChange={e=>setForm(p=>({...p,phone2:e.target.value}))} /></div>
              <div className="field"><label>Email</label><input className="input" type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} /></div>
            </div>
            <div className="field"><label>Area / Hostel</label><input className="input" value={form.area} onChange={e=>setForm(p=>({...p,area:e.target.value}))} /></div>
            <div className="field">
              <label>Client Type</label>
              <div className="pill-group">
                {['walkin','club','b2b','dispatcher'].map(t => (
                  <button key={t} className={`pill ${form.type===t?'active':''}`} onClick={()=>setForm(p=>({...p,type:t}))}>
                    {t==='walkin'?'Walk-in':t==='club'?'10k Club':t==='b2b'?'B2B':'Dispatcher'}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Individual / Business</label>
              <div className="pill-group">
                <button className={`pill ${form.clientType==='individual'?'active':''}`} onClick={()=>setForm(p=>({...p,clientType:'individual'}))}>Individual</button>
                <button className={`pill ${form.clientType==='business'?'active':''}`} onClick={()=>setForm(p=>({...p,clientType:'business'}))}>Business</button>
              </div>
            </div>
            <button className="btn btn-primary" disabled={!form.name || !form.phone || saving} onClick={registerClient}>
              {saving ? <span className="spinner" /> : 'Register Client'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
