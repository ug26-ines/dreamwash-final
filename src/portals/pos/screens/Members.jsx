import { useState } from 'react';
import { useCollection, updateDocument, orderBy, where } from '../../../hooks/useFirestore';
import { fmtRWF, fmtDate } from '../../../utils/formatters';
import { subStatusBadge } from '../../../components/shared/Badge';

export default function POSMembers({ toast }) {
  const { docs: subs }     = useCollection('subscriptions', [orderBy('createdAt','desc')]);
  const { docs: clients }  = useCollection('clients');
  const [tab, setTab]      = useState('active'); // active | pending

  const active  = subs.filter(s => s.status === 'active');
  const pending = subs.filter(s => s.status === 'pending');
  const list    = tab === 'active' ? active : pending;

  const activate = async (sub) => {
    try {
      const now      = new Date();
      const expires  = new Date(now); expires.setMonth(expires.getMonth() + (sub.months || 1));
      await updateDocument('subscriptions', sub.id, {
        status: 'active', activatedAt: now, expiresAt: expires,
        kgRemaining: sub.kgTotal,
      });
      // update client type
      if (sub.clientId) {
        await updateDocument('clients', sub.clientId, { type: 'club' });
      }
      toast('Subscription activated', 'success');
    } catch { toast('Activation failed','error'); }
  };

  const clientName = (id) => clients.find(c=>c.id===id)?.name || id;

  return (
    <div className="page-content-wide">
      <div className="flex-between" style={{ marginBottom:'1.25rem' }}>
        <h2>Members</h2>
        <span className="badge badge-amber">{pending.length} pending</span>
      </div>

      <div className="pill-group" style={{ marginBottom:'1.25rem' }}>
        <button className={`pill ${tab==='active'?'active':''}`} onClick={()=>setTab('active')}>Active ({active.length})</button>
        <button className={`pill ${tab==='pending'?'active':''}`} onClick={()=>setTab('pending')}>Pending ({pending.length})</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead><tr><th>Client</th><th>Plan</th><th>kg Left</th><th>Paid</th><th>Status</th><th>Expires</th>{tab==='pending'&&<th>Action</th>}</tr></thead>
          <tbody>
            {list.map(s => (
              <tr key={s.id}>
                <td className="fw-600">{clientName(s.clientId)}</td>
                <td>{s.planName}</td>
                <td className="mono">{s.kgRemaining ?? s.kgTotal} / {s.kgTotal} kg</td>
                <td className="mono">{fmtRWF(s.price)}</td>
                <td>{subStatusBadge(s.status)}</td>
                <td className="text-muted text-sm">{s.expiresAt ? fmtDate(s.expiresAt) : '—'}</td>
                {tab==='pending' && (
                  <td><button className="btn btn-primary btn-sm" onClick={()=>activate(s)}>Activate</button></td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!list.length && <div className="empty-state"><p>No {tab} subscriptions</p></div>}
      </div>
    </div>
  );
}
