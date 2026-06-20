import { useState } from 'react';
import { Printer } from 'lucide-react';
import { useCollection, addDocument, orderBy } from '../../../hooks/useFirestore';
import { fmtRWF, fmtN, fmtDateTime } from '../../../utils/formatters';
import { extractVAT } from '../../../utils/calculations';

export default function POSZReport({ staff, toast }) {
  const { docs: orders  } = useCollection('orders', [orderBy('createdAt','desc')]);
  const { docs: reports } = useCollection('z_reports', [orderBy('createdAt','desc')]);
  const [closing, setClosing] = useState(false);

  const today = new Date(); today.setHours(0,0,0,0);
  const todayOrders = orders.filter(o => {
    const d = o.createdAt?.toDate?.() || new Date(0);
    return d >= today;
  });

  const revenue  = todayOrders.reduce((s,o) => s+(o.total||0), 0);
  const vatTotal = todayOrders.reduce((s,o) => s+(o.vat||0), 0);
  const cash     = todayOrders.filter(o=>o.payment==='cash').reduce((s,o)=>s+(o.total||0),0);
  const momo     = todayOrders.filter(o=>o.payment==='momo').reduce((s,o)=>s+(o.total||0),0);
  const totalKg  = todayOrders.reduce((s,o)=>s+(o.weight||0),0);

  const closeShift = async () => {
    setClosing(true);
    try {
      await addDocument('z_reports', {
        date: today.toISOString(),
        closedBy: staff?.name,
        orderCount: todayOrders.length,
        revenue, vatTotal, cash, momo, totalKg,
        orders: todayOrders.map(o=>o.orderId),
      });
      toast('Shift closed — Z-Report saved', 'success');
    } catch { toast('Failed to save report','error'); }
    setClosing(false);
  };

  return (
    <div className="page-content-wide">
      <div className="flex-between" style={{ marginBottom:'1.5rem' }}>
        <h2>Z-Report</h2>
        <button className="btn btn-secondary btn-sm" onClick={()=>window.print()}>
          <Printer size={16} /> Print
        </button>
      </div>

      <div className="card" style={{ marginBottom:'1.5rem', maxWidth:520 }}>
        <div style={{ textAlign:'center', marginBottom:'1rem' }}>
          <h3 style={{ fontFamily:'var(--font-head)', color:'var(--accent)' }}>Dream X Wash</h3>
          <p className="text-muted text-sm">Musanze, Rwanda · EBM Z-Report</p>
          <p className="text-sm">{new Date().toLocaleDateString('en-GB', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
        </div>
        <hr className="divider" />
        <div className="flex-col gap-1">
          <Row label="Orders"         value={fmtN(todayOrders.length)} />
          <Row label="Total Weight"   value={`${totalKg.toFixed(1)} kg`} />
          <Row label="Cash"           value={fmtRWF(cash)} />
          <Row label="MoMo"           value={fmtRWF(momo)} />
          <hr className="divider" />
          <Row label="VAT Collected"  value={fmtRWF(vatTotal)} accent />
          <Row label="Net Revenue"    value={fmtRWF(revenue - vatTotal)} />
          <Row label="Gross Revenue"  value={fmtRWF(revenue)} bold accent />
        </div>
        <hr className="divider" />
        <p className="text-muted text-xs" style={{ textAlign:'center' }}>Cashier: {staff?.name} · TIN: Pending EBM</p>
      </div>

      <button className="btn btn-primary" disabled={closing || !todayOrders.length} onClick={closeShift}>
        {closing ? <span className="spinner" /> : 'Close Shift & Save Z-Report'}
      </button>

      {reports.length > 0 && (
        <>
          <h3 style={{ fontFamily:'var(--font-head)', margin:'1.5rem 0 0.75rem' }}>Previous Reports</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Orders</th><th>Revenue</th><th>VAT</th><th>Closed By</th></tr></thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id}>
                    <td className="text-sm">{new Date(r.date).toLocaleDateString('en-GB')}</td>
                    <td className="mono">{r.orderCount}</td>
                    <td className="mono">{fmtRWF(r.revenue)}</td>
                    <td className="mono">{fmtRWF(r.vatTotal)}</td>
                    <td>{r.closedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Row({ label, value, bold, accent }) {
  return (
    <div className="flex-between">
      <span className={`text-sm ${bold?'fw-700':'text-muted'}`}>{label}</span>
      <span className={`mono text-sm ${bold?'fw-700':''}`} style={accent?{color:'var(--accent)'}:{}}>{value}</span>
    </div>
  );
}
