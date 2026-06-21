import { useState } from 'react';
import { Home, ShoppingBag, GitBranch, Users, CalendarCheck, FileText, LogOut } from 'lucide-react';
import PinLogin from './components/PinLogin';
import POSHome     from './screens/Home';
import POSOrder    from './screens/Order';
import POSPipeline from './screens/Pipeline';
import POSMembers  from './screens/Members';
import POSBookings from './screens/Bookings';
import POSZReport  from './screens/ZReport';
import Toast       from '../../components/shared/Toast';
import { useToast } from '../../hooks/useToast';
import { signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../../firebase';

const NAV = [
  { key:'home',     label:'Home',      Icon: Home },
  { key:'order',    label:'New Order', Icon: ShoppingBag },
  { key:'pipeline', label:'Pipeline',  Icon: GitBranch },
  { key:'members',  label:'Members',   Icon: Users },
  { key:'bookings', label:'Bookings',  Icon: CalendarCheck },
  { key:'zreport',  label:'Z-Report',  Icon: FileText },
];

export default function POS() {
  const [staff,  setStaff]  = useState(null);
  const [screen, setScreen] = useState('home');
  const { toasts, toast }   = useToast();

const handleLogin = async (staffData) => {
  try {
    await signInWithEmailAndPassword(auth, 'pos@dreamwash.rw', 'Rwanda@123');
  } catch (e) { console.warn('POS auth:', e.message); }
  setStaff(staffData);
};

if (!staff) return <PinLogin onLogin={handleLogin} />;

  const props = { staff, toast };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>Dream X Wash</h1>
          <p>POS · {staff.name}</p>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(({ key, label, Icon }) => (
            <button key={key} className={screen===key?'active':''} onClick={()=>setScreen(key)}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
         
<button className="btn btn-danger btn-sm btn-full" onClick={async()=>{ await firebaseSignOut(auth); setStaff(null); }}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="main-area">
        <div className="main-header">
          <h2>{NAV.find(n=>n.key===screen)?.label}</h2>
          <span className="badge badge-muted">{new Date().toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})}</span>
        </div>
        {screen === 'home'     && <POSHome     {...props} />}
        {screen === 'order'    && <POSOrder    {...props} />}
        {screen === 'pipeline' && <POSPipeline {...props} />}
        {screen === 'members'  && <POSMembers  {...props} />}
        {screen === 'bookings' && <POSBookings {...props} />}
        {screen === 'zreport'  && <POSZReport  {...props} />}
      </main>

      <Toast toasts={toasts} />
    </div>
  );
}
