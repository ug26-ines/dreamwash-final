import Modal from '../../../components/shared/Modal';
import { initials } from '../../../utils/formatters';
import { clientTypeBadge, subStatusBadge } from '../../../components/shared/Badge';

export default function AccountModal({ open, onClose, client, signOut }) {

  if (!client) return (
    <Modal open={open} onClose={onClose} title="Profile">
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start', gap:'1.5rem' }}>
        <div style={{ color:'var(--text-muted)' }}>Loading profile…</div>
        <button className="btn btn-danger" onClick={signOut}>Sign Out</button>
      </div>
    </Modal>
  );

  const sub = client.subscription;

  return (
    <Modal open={open} onClose={onClose} title="Profile">

      {/* Two-column header */}
      <div style={{
        display:'flex', justifyContent:'space-between', alignItems:'flex-start',
        paddingBottom:'1rem',
        borderBottom:'1px solid rgba(255,255,255,0.07)',
        marginBottom:'1rem',
      }}>
        <div>
          <div style={{ fontSize:'1rem', fontWeight:700, fontFamily:'var(--font-head)', marginBottom:'0.35rem' }}>
            {client.name}
          </div>
          <div style={{ marginBottom:'0.5rem' }}>
            {clientTypeBadge(client.type)}
          </div>
          <button onClick={() => {}} style={{
            background:'none', border:'none',
            color:'var(--accent)', fontSize:'0.8rem',
            cursor:'pointer', padding:0,
            display:'flex', alignItems:'center', gap:'4px',
          }}>
            ✏️ Update profile
          </button>
        </div>
        <button className="btn btn-danger" onClick={signOut}>Sign Out</button>
      </div>

      {/* Info rows */}
      <div style={{ marginBottom:'1rem' }}>
        <Row icon="📧" label="Email"     value={client.email} />
        <Row icon="📞" label="Phone"     value={client.phone} />
        <Row icon="📍" label="Area"      value={client.area} />
        <Row icon="🪪" label="Client ID" value={client.clientId} mono divider={false} />
      </div>

      {/* Subscription card */}
      {sub && (
        <div style={{
          background:'rgba(255,255,255,0.03)',
          border:'1px solid rgba(255,255,255,0.08)',
          borderRadius:'10px',
          padding:'0.85rem 1rem',
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: sub.status === 'active' ? '0.6rem' : 0 }}>
            <span style={{ fontWeight:700, fontSize:'0.875rem' }}>🧺 {sub.planName}</span>
            {subStatusBadge(sub.status)}
          </div>
          {sub.status === 'active' && (
            <>
              <div style={{
                background:'rgba(255,255,255,0.06)',
                borderRadius:'999px', height:5,
                overflow:'hidden', marginBottom:'0.4rem',
              }}>
                <div style={{
                  width:`${Math.min((sub.kgRemaining / (sub.totalKg || 10)) * 100, 100)}%`,
                  background:'var(--accent)', height:'100%',
                  borderRadius:'999px', transition:'width 0.4s ease',
                }} />
              </div>
              <div className="text-muted text-sm">{sub.kgRemaining} kg remaining</div>
            </>
          )}
        </div>
      )}

    </Modal>
  );
}

function Row({ icon, label, value, mono, divider = true }) {
  return (
    <div style={{
      display:'flex', justifyContent:'space-between', alignItems:'center',
      padding:'0.6rem 0',
      borderBottom: divider ? '1px solid rgba(255,255,255,0.05)' : 'none',
    }}>
      <span className="text-muted text-sm">{icon} {label}</span>
      <span className={`text-sm fw-600 ${mono ? 'mono' : ''}`}
        style={{ fontSize: mono ? '0.72rem' : undefined, opacity: value ? 1 : 0.4 }}>
        {value || '—'}
      </span>
    </div>
  );
}