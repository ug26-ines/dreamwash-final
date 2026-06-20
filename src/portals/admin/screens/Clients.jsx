import { useState } from 'react';
import { useCollection, orderBy } from '../../../hooks/useFirestore';
import { fmtDate } from '../../../utils/formatters';
import { clientTypeBadge } from '../../../components/shared/Badge';

export default function AdminClients() {
  const { docs: clients, loading } = useCollection('clients', [orderBy('name')]);
  const { docs: orders }           = useCollection('orders');
  const [search, setSearch]        = useState('');
  const [filter, setFilter]        = useState('all');
  const [selected, setSelected]    = useState(null);

  const filtered = clients.filter(c => {
    const matchType = filter === 'all' || c.type === filter;
    const matchText = !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search);
    return matchType && matchText;
  });

  const clientOrders = (id) => orders.filter(o => o.clientId === id);

  if (selected) {
    const co = clientOrders(selected.id);
    const spent = co.reduce((s,o)=>s+(o.total||0),0);
    return (
      <div className="page-content-wide">
        <button className="btn btn-ghost btn-sm" style={{ marginBottom:'1rem' }} onClick={()=>setSelected(null)}>← Back to clients</button>
        <div className="grid-2" style={{ gap:'1.5rem', alignItems:'start' }}>
          <div>
            <div className="card" style={{ marginBottom:'1rem' }}>
              <h3 style={{ fontFamily:'var(--font-head)', marginBottom:'0.75rem' }}>{selected.name}</h3>
              <div className="flex-col gap-1">
                {[['Client ID', selected.clientId, true],['Phone', selected.phone],['Email', selected.email],
                  ['Area', selected.area],['Type', null, false, clientTypeBadge(selected.type)],
                  ['Joined', fmtDate(selected.createdAt)]
                ].map(([l,v,mono,el]) => (
                  <div key={l} className="flex-between"><span className="text-muted text-sm">{l}</span>
                    {el || <span className={`text-sm fw-600 ${mono?'mono':''}`} style={mono?{fontSize:'0.75rem'}:{}}>{v||'—'}</span>}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid-2">
              <div className="card"><div className="stat-value">{co.length}</div><div className="stat-label">Total orders</div></div>
              <div className="card"><div className="stat-value mono" style={{ fontSize:'1.1rem' }}>{spent.toLocaleString()}</div><div className="stat-label">RWF spent</div></div>
            </div>
          </div>
          <div>
            <h3 style={{ fontFamily:'var(--font-head)', marginBottom:'0.75rem' }}>Order History</h3>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Order</th><th>Service</th><th>kg</th><th>Total</th><th>Date</th></tr></thead>
                <tbody>
                  {co.map(o=>(
                    <tr key={o.id}>
                      <td className="mono text-sm">{o.orderId}</td><td>{o.service}</td>
                      <td className="mono">{o.weight}</td><td className="mono">{(o.total||0).toLocaleString()} RWF</td>
                      <td className="text-muted text-sm">{fmtDate(o.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!co.length && <div className="empty-state"><p>No orders</p></div>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content-wide">
      <div className="flex-between" style={{ marginBottom:'1.25rem' }}>
        <h2>Clients <span className="badge badge-muted">{clients.length}</span></h2>
      </div>
      <div className="flex gap-2" style={{ marginBottom:'1rem', flexWrap:'wrap' }}>
        <input className="input" style={{ maxWidth:260 }} placeholder="Search name or phone…" value={search} onChange={e=>setSearch(e.target.value)} />
        <div className="pill-group">
          {['all','walkin','club','b2b','dispatcher'].map(t=>(
            <button key={t} className={`pill ${filter===t?'active':''}`} onClick={()=>setFilter(t)}>
              {t==='all'?'All':t==='walkin'?'Walk-in':t==='club'?'10k Club':t==='b2b'?'B2B':'Dispatcher'}
            </button>
          ))}
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Phone</th><th>Type</th><th>Area</th><th>Joined</th><th>Orders</th></tr></thead>
          <tbody>
            {filtered.map(c=>(
              <tr key={c.id} style={{ cursor:'pointer' }} onClick={()=>setSelected(c)}>
                <td className="fw-600">{c.name}</td>
                <td className="mono text-sm">{c.phone}</td>
                <td>{clientTypeBadge(c.type)}</td>
                <td className="text-muted text-sm">{c.area||'—'}</td>
                <td className="text-muted text-sm">{fmtDate(c.createdAt)}</td>
                <td className="mono">{clientOrders(c.id).length}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <div className="empty-state"><p>No clients found</p></div>}
      </div>
    </div>
  );
}
