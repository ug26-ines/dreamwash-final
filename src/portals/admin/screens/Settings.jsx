import { useState } from 'react';
import { RATES } from '../../../constants/pricing';
import { fmtRWF } from '../../../utils/formatters';

export default function AdminSettings({ toast }) {
  const [saved, setSaved] = useState(false);
  const [biz, setBiz] = useState({
    name: 'Dream X Wash', phone: '', address: 'Musanze, Rwanda', tin: '', email: 'info@dreamxwash.rw',
  });

  const save = () => { setSaved(true); toast('Settings saved','success'); setTimeout(()=>setSaved(false),2000); };

  return (
    <div className="page-content-wide" style={{ maxWidth:640 }}>
      <h2 style={{ marginBottom:'1.25rem' }}>Settings</h2>

      <section className="section">
        <div className="section-label">Business Info</div>
        <div className="card flex-col gap-2">
          <div className="grid-2">
            <div className="field"><label>Business Name</label><input className="input" value={biz.name} onChange={e=>setBiz(p=>({...p,name:e.target.value}))} /></div>
            <div className="field"><label>Phone</label><input className="input" value={biz.phone} onChange={e=>setBiz(p=>({...p,phone:e.target.value}))} /></div>
          </div>
          <div className="field"><label>Address</label><input className="input" value={biz.address} onChange={e=>setBiz(p=>({...p,address:e.target.value}))} /></div>
          <div className="grid-2">
            <div className="field"><label>TIN Number</label><input className="input" value={biz.tin} onChange={e=>setBiz(p=>({...p,tin:e.target.value}))} placeholder="EBM TIN" /></div>
            <div className="field"><label>Email</label><input className="input" value={biz.email} onChange={e=>setBiz(p=>({...p,email:e.target.value}))} /></div>
          </div>
          <button className="btn btn-primary" style={{ alignSelf:'flex-start' }} onClick={save}>Save Changes</button>
        </div>
      </section>

      <section className="section">
        <div className="section-label">EBM Settings</div>
        <div className="card">
          <p className="text-muted text-sm" style={{ marginBottom:'0.75rem' }}>Electronic Billing Machine integration is pending. Fields reserved for RRA compliance.</p>
          <div className="grid-2">
            <div className="field"><label>EBM Serial</label><input className="input" placeholder="Pending" disabled /></div>
            <div className="field"><label>EBM Status</label><input className="input" value="Not connected" disabled /></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-label">Current Price Rates (RWF/kg)</div>
        <div className="card">
          <div className="table-wrap" style={{ border:'none' }}>
            <table>
              <thead><tr><th>Service</th><th>Walk-in</th><th>Club Overage</th><th>B2B</th></tr></thead>
              <tbody>
                {Object.entries(RATES.walkin).map(([svc, rate]) => (
                  <tr key={svc}>
                    <td className="fw-600">{svc}</td>
                    <td className="mono">{fmtRWF(rate)}</td>
                    <td className="mono">{fmtRWF(RATES.club_over[svc])}</td>
                    <td className="mono">{fmtRWF(RATES.b2b[svc])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-muted text-xs" style={{ marginTop:'0.75rem' }}>B2B rates are contract-adjustable per client. Contact developer to update.</p>
        </div>
      </section>
    </div>
  );
}
