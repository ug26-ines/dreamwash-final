import { useCollection, updateDocument, orderBy } from '../../../hooks/useFirestore';
import { fmtRWF, fmtDate } from '../../../utils/formatters';
import { subStatusBadge } from '../../../components/shared/Badge';

export default function AdminSubscriptions({ toast }) {
  const { docs: subs } = useCollection('subscriptions', [orderBy('createdAt','desc')]);

  const activate = async (sub) => {
    try {
      const now = new Date();
      const exp = new Date(now); exp.setMonth(exp.getMonth() + (sub.months || 1));
      await updateDocument('subscriptions', sub.id, { status:'active', activatedAt: now, expiresAt: exp, kgRemaining: sub.kgTotal });
      await updateDocument('clients', sub.clientId, { type:'club' });
      toast('Activated','success');
    } catch { toast('Failed','error'); }
  };

  const totalSubRevenue = subs.filter(s=>s.status==='active').reduce((t,s)=>t+(s.price||0),0);

  return (
    <div className="page-content-wide">
      <div className="flex-between" style={{ marginBottom:'1.25rem' }}>
        <h2>Subscriptions</h2>
        <div className="card card-sm">
          <span className="text-muted text-sm">Subscription Revenue </span>
          <span className="mono fw-700" style={{ color:'var(--accent)' }}>{fmtRWF(totalSubRevenue)}</span>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Client</th><th>Plan</th><th>kg Left</th><th>Paid</th><th>Status</th><th>Expires</th><th>Action</th></tr></thead>
          <tbody>
            {subs.map(s=>(
              <tr key={s.id}>
                <td className="fw-600">{s.clientName}</td>
                <td>{s.planName}</td>
                <td className="mono">{s.kgRemaining ?? s.kgTotal} / {s.kgTotal}</td>
                <td className="mono">{fmtRWF(s.price)}</td>
                <td>{subStatusBadge(s.status)}</td>
                <td className="text-muted text-sm">{s.expiresAt ? fmtDate(s.expiresAt) : '—'}</td>
                <td>{s.status==='pending' && <button className="btn btn-primary btn-sm" onClick={()=>activate(s)}>Activate</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!subs.length && <div className="empty-state"><p>No subscriptions yet</p></div>}
      </div>
    </div>
  );
}
