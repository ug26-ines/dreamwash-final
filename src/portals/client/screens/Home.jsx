import { useCollection, orderBy, where } from '../../../hooks/useFirestore';
import { fmtRWF, fmtDateTime } from '../../../utils/formatters';
import { PIPELINE_STAGES } from '../../../constants/stages';
import { stageBadge } from '../../../components/shared/Badge';

export default function ClientHome({ client }) {
  const { docs: orders } = useCollection('orders', [
    where('clientId','==', client?.id || ''),
    orderBy('createdAt','desc'),
  ]);

  const activeOrders = orders.filter(o => o.stage !== 'collected');
  const sub = client?.subscription;
  const kgPct = sub ? Math.round((sub.kgRemaining / sub.kgTotal) * 100) : 0;

  return (
    <div className="page-content" style={{ paddingBottom:'5rem' }}>
      {/* Greeting */}
      <div style={{ margin:'1rem 0 1.25rem' }}>
        <h2 style={{ fontFamily:'var(--font-head)' }}>Hello, {client?.name?.split(' ')[0]}</h2>
        <p className="text-muted text-sm">Track your laundry in real time</p>
      </div>

      {/* Subscription card */}
      {sub?.status === 'active' && (
        <div className="card" style={{ marginBottom:'1rem', background:'linear-gradient(135deg, #0d2a3f, #0d1f35)', borderColor:'var(--accent)' }}>
          <div className="flex-between mb-1">
            <span className="fw-700 font-head" style={{ color:'var(--accent)' }}>{sub.planName}</span>
            <span className="badge badge-teal">Active</span>
          </div>
          <div style={{ margin:'0.75rem 0' }}>
            <div className="flex-between text-sm mb-1">
              <span className="text-muted">kg remaining</span>
              <span className="mono fw-600">{sub.kgRemaining} / {sub.kgTotal} kg</span>
            </div>
            <div style={{ height:6, background:'var(--border)', borderRadius:3 }}>
              <div style={{ height:'100%', width:`${kgPct}%`, background:'var(--accent)', borderRadius:3, transition:'width 400ms' }} />
            </div>
          </div>
        </div>
      )}
      {!sub && (
        <div className="card" style={{ marginBottom:'1rem', background:'var(--accent-dim)', borderColor:'var(--accent)' }}>
          <div className="flex-between">
            <div>
              <div className="fw-600 font-head" style={{ color:'var(--accent)' }}>Join the 10k Club</div>
              <div className="text-muted text-sm">10 kg/month · 10,000 RWF</div>
            </div>
            <div className="badge badge-teal">Subscribe</div>
          </div>
        </div>
      )}

      {/* Active orders */}
      {activeOrders.length > 0 && (
        <section className="section">
          <div className="section-label">Active Orders</div>
          <div className="flex-col gap-1">
            {activeOrders.map(o => (
              <div key={o.id} className="card card-sm">
                <div className="flex-between mb-1">
                  <span className="mono text-sm">{o.orderId}</span>
                  {stageBadge(o.stage)}
                </div>
                <StageBar stage={o.stage} />
                <div className="flex-between mt-1">
                  <span className="text-muted text-xs">{o.weight} kg · {o.service}</span>
                  <span className="mono text-sm fw-600">{fmtRWF(o.total)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!activeOrders.length && !orders.length && (
        <div className="empty-state">
          <h3>No orders yet</h3>
          <p>Book a pickup or drop off at our Musanze shop.</p>
        </div>
      )}

      {/* Recent history */}
      {orders.filter(o=>o.stage==='collected').length > 0 && (
        <section className="section">
          <div className="section-label">Recent History</div>
          <div className="flex-col gap-1">
            {orders.filter(o=>o.stage==='collected').slice(0,5).map(o => (
              <div key={o.id} className="card card-sm flex-between">
                <div>
                  <div className="mono text-sm">{o.orderId}</div>
                  <div className="text-muted text-xs">{fmtDateTime(o.createdAt)} · {o.weight} kg</div>
                </div>
                <span className="mono fw-600">{fmtRWF(o.total)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StageBar({ stage }) {
  const stages = PIPELINE_STAGES;
  const idx    = stages.findIndex(s => s.key === stage);
  return (
    <div style={{ display:'flex', gap:3, margin:'0.375rem 0' }}>
      {stages.map((s, i) => (
        <div key={s.key} style={{
          flex:1, height:4, borderRadius:2,
          background: i <= idx ? 'var(--accent)' : 'var(--border)',
          transition:'background 300ms',
        }} />
      ))}
    </div>
  );
}
