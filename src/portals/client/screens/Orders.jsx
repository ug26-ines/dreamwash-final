import { useCollection, orderBy, where } from '../../../hooks/useFirestore';
import { fmtRWF, fmtDate } from '../../../utils/formatters';
import { SERVICE_NAMES } from '../../../constants/pricing';
import { stageBadge } from '../../../components/shared/Badge';

export default function ClientOrders({ client }) {
  const { docs: orders, loading } = useCollection('orders', [
    where('clientId','==', client?.id || ''),
    orderBy('createdAt','desc'),
  ]);

  if (loading) return <div className="flex-center" style={{ padding:'3rem' }}><span className="spinner" /></div>;

  return (
    <div className="page-content" style={{ paddingBottom:'5rem' }}>
      <h2 style={{ margin:'1rem 0 1.25rem', fontFamily:'var(--font-head)' }}>My Orders</h2>
      {orders.length === 0 && (
        <div className="empty-state">
          <h3>No orders yet</h3>
          <p>Your order history will appear here.</p>
        </div>
      )}
      <div className="flex-col gap-1">
        {orders.map(o => (
          <div key={o.id} className="card">
            <div className="flex-between mb-1">
              <span className="mono text-sm fw-600">{o.orderId}</span>
              {stageBadge(o.stage)}
            </div>
            <div className="text-muted text-sm mb-1">{fmtDate(o.createdAt)} · {SERVICE_NAMES[o.service] || o.service}</div>
            <div className="flex-between">
              <span className="text-sm text-muted">{o.weight} kg</span>
              <div className="flex gap-1 text-sm">
                <span className="text-muted">VAT {fmtRWF(o.vat)}</span>
                <span className="mono fw-700">{fmtRWF(o.total)}</span>
              </div>
            </div>
            {o.notes && <p className="text-muted text-xs" style={{ marginTop:'0.5rem' }}>{o.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
