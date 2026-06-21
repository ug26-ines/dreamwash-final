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
      </div>

      {tab === 'order' && (
        <OrderForm clients={clients} toast={toast} onSuccess={() => {}} />
      )}

    </div>
  );
}
