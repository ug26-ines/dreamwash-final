import { useCollection, orderBy } from '../../../hooks/useFirestore';
import { fmtRWF, fmtDate } from '../../../utils/formatters';

export default function AdminFinancials() {
  const { docs: orders  } = useCollection('orders', [orderBy('createdAt','desc')]);
  const { docs: reports } = useCollection('z_reports', [orderBy('createdAt','desc')]);

  const totalRevenue = orders.reduce((s,o)=>s+(o.total||0),0);
  const totalVAT     = orders.reduce((s,o)=>s+(o.vat||0),0);
  const totalNet     = totalRevenue - totalVAT;
  const cash         = orders.filter(o=>o.payment==='cash').reduce((s,o)=>s+(o.total||0),0);
  const momo         = orders.filter(o=>o.payment==='momo').reduce((s,o)=>s+(o.total||0),0);
  const totalKg      = orders.reduce((s,o)=>s+(o.weight||0),0);

  return (
    <div className="page-content-wide">
      <h2 style={{ marginBottom:'1.25rem' }}>Financials</h2>

      <div className="grid-4" style={{ marginBottom:'1.5rem' }}>
        {[
          { label:'Gross Revenue',   value: fmtRWF(totalRevenue), color:'var(--accent)' },
          { label:'Net Revenue',     value: fmtRWF(totalNet) },
          { label:'VAT Collected',   value: fmtRWF(totalVAT), color:'var(--amber)' },
          { label:'Total kg Washed', value: `${totalKg.toFixed(1)} kg` },
        ].map(s=>(
          <div key={s.label} className="card">
            <div className="stat-value" style={s.color?{color:s.color}:{}}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom:'1.5rem' }}>
        <div className="card">
          <h3 style={{ fontFamily:'var(--font-head)', marginBottom:'0.75rem' }}>Payment Methods</h3>
          <div className="flex-between mb-1">
            <span className="text-muted text-sm">Cash</span>
            <div className="flex gap-1 text-sm">
              <span className="mono">{fmtRWF(cash)}</span>
              <span className="badge badge-muted">{totalRevenue?Math.round(cash/totalRevenue*100):0}%</span>
            </div>
          </div>
          <div className="flex-between">
            <span className="text-muted text-sm">MoMo</span>
            <div className="flex gap-1 text-sm">
              <span className="mono">{fmtRWF(momo)}</span>
              <span className="badge badge-muted">{totalRevenue?Math.round(momo/totalRevenue*100):0}%</span>
            </div>
          </div>
        </div>
        <div className="card">
          <h3 style={{ fontFamily:'var(--font-head)', marginBottom:'0.75rem' }}>Order Stats</h3>
          <div className="flex-between mb-1"><span className="text-muted text-sm">Total orders</span><span className="mono">{orders.length}</span></div>
          <div className="flex-between mb-1"><span className="text-muted text-sm">Avg order value</span><span className="mono">{fmtRWF(orders.length ? Math.round(totalRevenue/orders.length) : 0)}</span></div>
          <div className="flex-between"><span className="text-muted text-sm">Avg kg/order</span><span className="mono">{orders.length ? (totalKg/orders.length).toFixed(1) : 0} kg</span></div>
        </div>
      </div>

      <h3 style={{ fontFamily:'var(--font-head)', marginBottom:'0.75rem' }}>Z-Report History</h3>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Date</th><th>Orders</th><th>Revenue</th><th>VAT</th><th>Cash</th><th>MoMo</th><th>Closed By</th></tr></thead>
          <tbody>
            {reports.map(r=>(
              <tr key={r.id}>
                <td className="text-sm">{new Date(r.date).toLocaleDateString('en-GB')}</td>
                <td className="mono">{r.orderCount}</td>
                <td className="mono">{fmtRWF(r.revenue)}</td>
                <td className="mono">{fmtRWF(r.vatTotal)}</td>
                <td className="mono">{fmtRWF(r.cash)}</td>
                <td className="mono">{fmtRWF(r.momo)}</td>
                <td>{r.closedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!reports.length && <div className="empty-state"><p>No Z-Reports yet</p></div>}
      </div>
    </div>
  );
}
