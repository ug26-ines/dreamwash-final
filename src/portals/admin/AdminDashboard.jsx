import { useState } from 'react';
import { LayoutDashboard, Users, UserCog, Star, DollarSign, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import AdminOverview      from './screens/Overview';
import AdminClients       from './screens/Clients';
import AdminStaff         from './screens/Staff';
import AdminSubscriptions from './screens/Subscriptions';
import AdminFinancials    from './screens/Financials';
import AdminSettings      from './screens/Settings';
import Toast              from '../../components/shared/Toast';
import { useToast }       from '../../hooks/useToast';

const NAV = [
  { key:'overview',      label:'Overview',       Icon: LayoutDashboard },
  { key:'clients',       label:'Clients',        Icon: Users },
  { key:'staff',         label:'Staff',          Icon: UserCog },
  { key:'subscriptions', label:'Subscriptions',  Icon: Star },
  { key:'financials',    label:'Financials',     Icon: DollarSign },
  { key:'settings',      label:'Settings',       Icon: Settings },
];

export default function AdminDashboard() {
  const { user, loading, signIn, signOut } = useAuth();
  const [screen, setScreen]  = useState('overview');
  const [email,  setEmail]   = useState('');
  const [pass,   setPass]    = useState('');
  const [err,    setErr]     = useState('');
  const [signingIn, setSI]   = useState(false);
  const { toasts, toast }    = useToast();

  if (loading) return <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center' }}><span className="spinner" /></div>;

  if (!user) return (
    <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
      <div style={{ width:320 }}>
        <h1 style={{ fontFamily:'var(--font-head)', color:'var(--accent)', marginBottom:'0.25rem' }}>Dream X Wash</h1>
        <p style={{ color:'var(--muted)', fontSize:'0.875rem', marginBottom:'2rem' }}>CEO Dashboard</p>
        <div className="flex-col gap-2">
          <div className="field"><label>Email</label><input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} /></div>
          <div className="field"><label>Password</label><input className="input" type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doSignIn()} /></div>
          {err && <p style={{ color:'var(--red)', fontSize:'0.875rem' }}>{err}</p>}
          <button className="btn btn-primary btn-full" disabled={signingIn} onClick={doSignIn}>
            {signingIn ? <span className="spinner" /> : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );

  async function doSignIn() {
    setSI(true); setErr('');
    try { await signIn(email, pass); }
    catch { setErr('Invalid credentials'); }
    setSI(false);
  }

  const props = { toast };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>Dream X Wash</h1>
          <p>CEO Dashboard</p>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(({ key, label, Icon }) => (
            <button key={key} className={screen===key?'active':''} onClick={()=>setScreen(key)}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div style={{ fontSize:'0.75rem', color:'var(--muted)', marginBottom:'0.5rem' }}>{user.email}</div>
          <button className="btn btn-danger btn-sm btn-full" onClick={signOut}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="main-area">
        <div className="main-header">
          <h2>{NAV.find(n=>n.key===screen)?.label}</h2>
          <span className="badge badge-muted">{new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}</span>
        </div>
        {screen === 'overview'      && <AdminOverview      {...props} />}
        {screen === 'clients'       && <AdminClients       {...props} />}
        {screen === 'staff'         && <AdminStaff         {...props} />}
        {screen === 'subscriptions' && <AdminSubscriptions {...props} />}
        {screen === 'financials'    && <AdminFinancials    {...props} />}
        {screen === 'settings'      && <AdminSettings      {...props} />}
      </main>

      <Toast toasts={toasts} />
    </div>
  );
}
