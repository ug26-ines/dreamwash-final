import { useState } from 'react';
import { Search } from 'lucide-react';
import { useCollection, orderBy, where } from '../../../hooks/useFirestore';
import { PIPELINE_STAGES } from '../../../constants/stages';
import { fmtRWF, fmtDateTime } from '../../../utils/formatters';

export default function ClientTrack({ client }) {
  const { docs: orders } = useCollection('orders', [
    where('clientId','==', client?.id || ''),
    orderBy('createdAt','desc'),
  ]);
  const [input, setInput] = useState('');
  const [found, setFound] = useState(null);

  const search = () => {
    const match = orders.find(o => o.orderId?.toLowerCase() === input.toLowerCase().trim());
    setFound(match || false);
  };

  const active = orders.filter(o => o.stage !== 'collected');

  return (
    <div className="page-content" style={{ paddingBottom:'5rem' }}>
      <h2 style={{ margin:'1rem 0 0.25rem', fontFamily:'var(--font-head)' }}>Track Order</h2>
      <p className="text-muted text-sm" style={{ marginBottom:'1.25rem' }}>Enter your order ID to check status</p>

      <div className="flex gap-1" style={{ marginBottom:'1.5rem' }}>
        <input className="input" style={{ flex:1 }} placeholder="DWO-2406-XXXX"
          value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&search()} />
        <button className="btn btn-primary" onClick={search}><Search size={18} /></button>
      </div>

      {found === false && <p className="text-red text-sm">Order not found. Check the ID and try again.</p>}
      {found && <TrackCard order={found} />}

      {active.length > 0 && (
        <>
          <div className="section-label" style={{ marginTop:'1.5rem' }}>Your Active Orders</div>
          <div className="flex-col gap-1">
            {active.map(o => <TrackCard key={o.id} order={o} />)}
          </div>
        </>
      )}
    </div>
  );
}

function TrackCard({ order }) {
  const stages = PIPELINE_STAGES;
  const idx    = stages.findIndex(s => s.key === order.stage);
  const current = stages[idx];

  return (
    <div className="card" style={{ marginBottom:'0.75rem' }}>
      <div className="flex-between mb-1">
        <span className="mono fw-600">{order.orderId}</span>
        <span className="badge badge-teal">{current?.label}</span>
      </div>
      <p className="text-muted text-sm" style={{ marginBottom:'1rem' }}>{current?.description}</p>

      <div style={{ position:'relative', marginBottom:'1.25rem' }}>
        <div style={{ position:'absolute', top:10, left:0, right:0, height:2, background:'var(--border)', borderRadius:1 }} />
        <div style={{ position:'absolute', top:10, left:0, height:2, background:'var(--accent)', borderRadius:1,
          width:`${(idx/(stages.length-1))*100}%`, transition:'width 400ms' }} />
        <div style={{ display:'flex', justifyContent:'space-between', position:'relative' }}>
          {stages.map((s,i) => (
            <div key={s.key} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <div style={{
                width:20, height:20, borderRadius:'50%', border:`2px solid ${i<=idx?'var(--accent)':'var(--border)'}`,
                background: i<idx?'var(--accent)':i===idx?'var(--accent-dim)':'var(--bg)',
                transition:'all 300ms',
              }} />
              <span style={{ fontSize:'0.6rem', color: i<=idx?'var(--accent)':'var(--muted)', textAlign:'center', maxWidth:40, lineHeight:1.2 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-between text-sm">
        <span className="text-muted">{order.weight} kg · {order.service}</span>
        <span className="mono fw-600">{fmtRWF(order.total)}</span>
      </div>
    </div>
  );
}
