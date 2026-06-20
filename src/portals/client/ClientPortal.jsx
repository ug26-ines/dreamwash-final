import { useState, useEffect } from 'react';
import { Home, Package, MapPin, Star, Calendar, User } from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import AuthScreen   from './components/AuthScreen';
import AccountModal from './components/AccountModal';
import ClientHome   from './screens/Home';
import ClientOrders from './screens/Orders';
import ClientTrack  from './screens/Track';
import ClientPlans  from './screens/Plans';
import ClientBook   from './screens/Book';
import Toast        from '../../components/shared/Toast';
import { useToast } from '../../hooks/useToast';
import { initials } from '../../utils/formatters';

const NAV = [
  { key:'home',    label:'Home',    Icon: Home },
  { key:'orders',  label:'Orders',  Icon: Package },
  { key:'track',   label:'Track',   Icon: MapPin },
  { key:'plans',   label:'Plans',   Icon: Star },
  { key:'book',    label:'Book',    Icon: Calendar },
  { key:'profile', label:'Profile', Icon: User },
];

export default function ClientPortal() {
  const [user,          setUser]          = useState(undefined);
  const [client,        setClient]        = useState(null);
  const [clientLoading, setClientLoading] = useState(false); // ← NEW: tracks Firestore fetch
  const [screen,        setScreen]        = useState('home');
  const [showAcct,      setShowAcct]      = useState(false);
  const { toasts,       toast }           = useToast();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        setClientLoading(true); // ← start before any await
        try {
          const q    = query(collection(db,'clients'), where('email','==',u.email));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const data = { id: snap.docs[0].id, ...snap.docs[0].data() };
            const sq   = query(
              collection(db,'subscriptions'),
              where('clientId','==',data.id),
              where('status','in',['active','pending'])
            );
            const ss = await getDocs(sq);
            if (!ss.empty) data.subscription = { id: ss.docs[0].id, ...ss.docs[0].data() };
            setClient(data);
          }
        } catch (err) {
          console.error('Failed to load client profile:', err);
        } finally {
          setClientLoading(false); // ← always stop, even on error
        }
      } else {
        setClient(null);
        setClientLoading(false);
      }
    });
    return unsub;
  }, []);

  if (user === undefined) return (
    <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <span className="spinner" />
    </div>
  );
  if (!user) return <AuthScreen />;

  const props = { client, toast };

  return (
    <div className="page">
      {/* Top bar */}
      <div className="top-bar">
        <span className="top-bar-brand">Dream X Wash</span>
        <button onClick={() => setShowAcct(true)} style={{
          width:36, height:36, borderRadius:'50%',
          background:'var(--accent-dim)', border:'1px solid var(--accent)',
          color:'var(--accent)', fontFamily:'var(--font-head)', fontWeight:700, fontSize:'0.875rem',
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          {initials(client?.name || user.email)}
        </button>
      </div>

      {/* Screen */}
      <div style={{ flex:1, overflowY:'auto' }}>
        {screen === 'home'   && <ClientHome   {...props} />}
        {screen === 'orders' && <ClientOrders {...props} />}
        {screen === 'track'  && <ClientTrack  {...props} />}
        {screen === 'plans'  && <ClientPlans  {...props} />}
        {screen === 'book'   && <ClientBook   {...props} />}
      </div>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        {NAV.map(({ key, label, Icon }) => (
          <a
            key={key}
            href="#"
            className={screen === key ? 'active' : ''}
            onClick={e => {
              e.preventDefault();
              if (key === 'profile') setShowAcct(true);
              else setScreen(key);
            }}
          >
            <Icon />
            <span>{label}</span>
          </a>
        ))}
      </nav>

      {/* Account Modal */}
      <AccountModal
        open={showAcct}
        onClose={() => setShowAcct(false)}
        client={client}
        clientLoading={clientLoading}         // ← pass down
        signOut={() => signOut(auth)}
        onUpdate={(updatedData) => setClient(updatedData)}
      />
      <Toast toasts={toasts} />
    </div>
  );
}
