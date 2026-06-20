import { useCollection, orderBy } from '../../../hooks/useFirestore';
import { fmtRWF, fmtN, fmtDateTime } from '../../../utils/formatters';
import { CLIENT_TYPES } from '../../../constants/pricing';
import { stageBadge, clientTypeBadge } from '../../../components/shared/Badge';

export default function POSHome({ staff }) {
  const { docs: orders } = useCollection('orders', [orderBy('createdAt','desc')]);

  const today = new Date(); today.setHours(0,0,0,0);
  const todayOrders = orders.filter(o => {
    const d = o.createdAt?.toDate?.() || new Date(0);
    return d >= today;
  });
  const revenue  = todayOrders.reduce((s,o) => s + (o.total||0), 0);
  const totalKg  = todayOrders.reduce((s,o) => s + (o.weight||0), 0);

  return (
    <div className="page-content-wide">
      <div style={{ marginBottom:'1.5rem' }}>
        <h2>Welcome back, {staff?.name}</h2>
        <p className="text-muted text-sm">Today's shift overview</p>
      </div>

      <div className="grid-4" style={{ marginBottom:'1.5rem' }}>
        {[
          { label:"Today's Revenue", value: fmtRWF(revenue), color:'var(--accent)' },
          { label:"Orders Today",    value: fmtN(todayOrders.length) },
          { label:"kg Processed",    value: `${totalKg.toFixed(1)} kg` },
          { label:"All-Time Orders", value: fmtN(orders.length) },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="stat-value" style={s.color ? { color: s.color } : {}}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <h3 style={{ marginBottom:'0.75rem', fontFamily:'var(--font-head)' }}>Recent Orders</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order ID</th><th>Client</th><th>Type</th><th>Weight</th><th>Total</th><th>Stage</th><th>Time</th>
            </tr>
          </thead>
          <tbody>
            {orders.slice(0,20).map(o => (
              <tr key={o.id}>
                <td className="mono" style={{ fontSize:'0.8125rem' }}>{o.orderId}</td>
                <td className="fw-600">{o.clientName}</td>
                <td>{clientTypeBadge(o.clientType)}</td>
                <td className="mono">{o.weight} kg</td>
                <td className="mono">{fmtRWF(o.total)}</td>
                <td>{stageBadge(o.stage)}</td>
                <td className="text-muted text-sm">{fmtDateTime(o.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!orders.length && <div className="empty-state"><p>No orders yet</p></div>}
      </div>
    </div>
  );
}
