import { useCollection, orderBy } from '../../../hooks/useFirestore';
import { fmtRWF, fmtN } from '../../../utils/formatters';
import { clientTypeBadge, stageBadge } from '../../../components/shared/Badge';

export default function AdminOverview() {
  const { docs: orders } = useCollection('orders', [orderBy('createdAt','desc')]);
  const { docs: subs   } = useCollection('subscriptions');
  const { docs: bookings}= useCollection('booking_requests', [orderBy('createdAt','desc')]);

  const today = new Date(); today.setHours(0,0,0,0);
  const todayOrders = orders.filter(o => {
    const d = o.createdAt?.toDate?.() || new Date(0);
    return d >= today;
  });

  const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 6);
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekAgo); d.setDate(d.getDate() + i);
    const next = new Date(d); next.setDate(next.getDate() + 1);
    const rev = orders.filter(o => {
      const od = o.createdAt?.toDate?.() || new Date(0);
      return od >= d && od < next;
    }).reduce((s,o)=>s+(o.total||0),0);
    return { label: d.toLocaleDateString('en-GB',{weekday:'short'}), rev };
  });

  const maxRev = Math.max(...weeklyData.map(d=>d.rev), 1);

  const revenue  = todayOrders.reduce((s,o)=>s+(o.total||0),0);
  const totalKg  = todayOrders.reduce((s,o)=>s+(o.weight||0),0);
  const activeSubs   = subs.filter(s=>s.status==='active').length;
  const pendingSubs  = subs.filter(s=>s.status==='pending').length;
  const pendingBooks = bookings.filter(b=>b.status==='pending').length;

  return (
    <div className="page-content-wide">
      <h2 style={{ marginBottom:'1.25rem' }}>Overview</h2>

      <div className="grid-4" style={{ marginBottom:'1.5rem' }}>
        {[
          { label:"Today's Revenue", value: fmtRWF(revenue),      color:'var(--accent)' },
          { label:"Orders Today",    value: fmtN(todayOrders.length) },
          { label:"kg Today",        value: `${totalKg.toFixed(1)} kg` },
          { label:"Active Members",  value: fmtN(activeSubs),      color:'var(--green)' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="stat-value" style={s.color?{color:s.color}:{}}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {(pendingSubs > 0 || pendingBooks > 0) && (
        <div className="grid-2" style={{ marginBottom:'1.5rem' }}>
          {pendingSubs > 0 && (
            <div className="card" style={{ background:'rgba(245,158,11,0.08)', borderColor:'var(--amber)' }}>
              <div className="stat-value" style={{ color:'var(--amber)' }}>{pendingSubs}</div>
              <div className="stat-label">Pending subscription{pendingSubs>1?'s':''}</div>
            </div>
          )}
          {pendingBooks > 0 && (
            <div className="card" style={{ background:'rgba(59,130,246,0.08)', borderColor:'var(--blue)' }}>
              <div className="stat-value" style={{ color:'var(--blue)' }}>{pendingBooks}</div>
              <div className="stat-label">Pending booking{pendingBooks>1?'s':''}</div>
            </div>
          )}
        </div>
      )}

      {/* Weekly revenue chart */}
      <div className="card" style={{ marginBottom:'1.5rem' }}>
        <div className="flex-between" style={{ marginBottom:'1rem' }}>
          <h3 style={{ fontFamily:'var(--font-head)' }}>Revenue — Last 7 Days</h3>
        </div>
        <div style={{ display:'flex', alignItems:'flex-end', gap:'0.5rem', height:120 }}>
          {weeklyData.map(d => (
            <div key={d.label} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <div style={{
                width:'100%', background:'var(--accent)',
                height: `${Math.round((d.rev/maxRev)*100)}%`,
                minHeight: d.rev > 0 ? 4 : 0,
                borderRadius:'4px 4px 0 0',
                opacity: 0.85,
                transition:'height 400ms',
              }} />
              <span style={{ fontSize:'0.7rem', color:'var(--muted)' }}>{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent orders */}
      <h3 style={{ fontFamily:'var(--font-head)', marginBottom:'0.75rem' }}>Recent Orders</h3>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Order</th><th>Client</th><th>Type</th><th>kg</th><th>Total</th><th>Stage</th></tr></thead>
          <tbody>
            {orders.slice(0,15).map(o => (
              <tr key={o.id}>
                <td className="mono text-sm">{o.orderId}</td>
                <td className="fw-600">{o.clientName}</td>
                <td>{clientTypeBadge(o.clientType)}</td>
                <td className="mono">{o.weight}</td>
                <td className="mono">{fmtRWF(o.total)}</td>
                <td>{stageBadge(o.stage)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!orders.length && <div className="empty-state"><p>No orders yet</p></div>}
      </div>
    </div>
  );
}
