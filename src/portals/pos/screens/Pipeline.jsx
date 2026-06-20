import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useCollection, updateDocument, orderBy } from '../../../hooks/useFirestore';
import { PIPELINE_STAGES, STAGE_ORDER } from '../../../constants/stages';
import { fmtRWF, fmtDateTime } from '../../../utils/formatters';
import { stageBadge } from '../../../components/shared/Badge';

export default function POSPipeline({ toast }) {
  const { docs: orders, loading } = useCollection('orders', [orderBy('createdAt','desc')]);
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? orders.filter(o=>o.stage!=='collected') : orders.filter(o=>o.stage===filter);

  const advance = async (order) => {
    const idx = STAGE_ORDER.indexOf(order.stage);
    if (idx < 0 || idx >= STAGE_ORDER.length - 1) return;
    const next = STAGE_ORDER[idx + 1];
    try {
      await updateDocument('orders', order.id, { stage: next });
      toast(`${order.orderId} → ${next}`, 'info');
    } catch { toast('Update failed','error'); }
  };

  if (loading) return <div className="flex-center" style={{ padding:'3rem' }}><span className="spinner" /></div>;

  return (
    <div className="page-content-wide">
      <div className="flex-between" style={{ marginBottom:'1.25rem' }}>
        <h2>Pipeline</h2>
        <span className="badge badge-teal">{orders.filter(o=>o.stage!=='collected').length} active</span>
      </div>

      <div className="pill-group" style={{ marginBottom:'1.25rem' }}>
        <button className={`pill ${filter==='all'?'active':''}`} onClick={()=>setFilter('all')}>All Active</button>
        {PIPELINE_STAGES.filter(s=>s.key!=='collected').map(s => (
          <button key={s.key} className={`pill ${filter===s.key?'active':''}`} onClick={()=>setFilter(s.key)}>
            {s.label} <span className="badge badge-muted" style={{ marginLeft:'0.25rem' }}>
              {orders.filter(o=>o.stage===s.key).length}
            </span>
          </button>
        ))}
      </div>

      <div className="table-wrap">
        <table>
          <thead><tr><th>Order</th><th>Client</th><th>Service</th><th>Weight</th><th>Stage</th><th>Since</th><th>Action</th></tr></thead>
          <tbody>
            {filtered.map(o => {
              const stageIdx = STAGE_ORDER.indexOf(o.stage);
              const isLast   = stageIdx >= STAGE_ORDER.length - 1;
              return (
                <tr key={o.id}>
                  <td className="mono" style={{ fontSize:'0.8125rem' }}>{o.orderId}</td>
                  <td className="fw-600">{o.clientName}</td>
                  <td className="text-sm">{o.service}</td>
                  <td className="mono">{o.weight} kg</td>
                  <td>{stageBadge(o.stage)}</td>
                  <td className="text-muted text-sm">{fmtDateTime(o.updatedAt || o.createdAt)}</td>
                  <td>
                    {!isLast && (
                      <button className="btn btn-secondary btn-sm" onClick={()=>advance(o)}>
                        {PIPELINE_STAGES[stageIdx+1]?.label} <ChevronRight size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!filtered.length && <div className="empty-state"><p>No orders in this stage</p></div>}
      </div>
    </div>
  );
}
