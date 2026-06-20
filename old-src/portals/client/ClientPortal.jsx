// src/portals/client/ClientPortal.jsx
import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../shared/AuthContext'

const C = {
  navy:'#0c1f35', navy2:'#152d47', navy3:'#1e3a57',
  cyan:'#00b8a0', cdim:'rgba(0,184,160,.12)',
  amber:'#f59e0b', adim:'rgba(245,158,11,.12)',
  red:'#ef4444',
  green:'#22c55e', gdim:'rgba(34,197,94,.12)',
  border:'rgba(255,255,255,.09)', border2:'rgba(255,255,255,.15)',
  text:'#fff', text2:'rgba(255,255,255,.7)', text3:'rgba(255,255,255,.4)',
  surface:'rgba(255,255,255,.05)', sf2:'rgba(255,255,255,.08)',
}

const STATUS_ORDER = ['Received','Washing','Drying','Pressing','Ready','Collected']
const STATUS_ICON  = { Received:'📥', Washing:'🫧', Drying:'💨', Pressing:'👔', Ready:'✅', Collected:'📦' }
const STATUS_COLOR = { Received:'#6366f1',Washing:'#8b5cf6',Drying:'#f59e0b',Pressing:'#06b6d4',Ready:'#22c55e',Collected:'#64748b' }

const fmt = n => Number(n||0).toLocaleString('en-RW')
const WA  = '250780000000'

export default function ClientPortal() {
  const { profile, logout } = useAuth()
  const [tab, setTab]   = useState('orders')
  const [orders, setOrders] = useState([])
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)

  const phone = profile?.phone || ''

  useEffect(() => {
    if (!phone) { setLoading(false); return }
    // Query orders by clientPhone — clients see only their own (enforced by Firestore rules)
    const uO = onSnapshot(
      query(collection(db,'orders'), where('clientPhone','==',phone), orderBy('createdAt','desc'), limit(50)),
      s => { setOrders(s.docs.map(d => ({id:d.id,...d.data()}))); setLoading(false) },
      () => setLoading(false)
    )
    const uM = onSnapshot(
      query(collection(db,'members'), where('phone','==',phone), limit(1)),
      s => setMember(s.docs[0] ? {id:s.docs[0].id,...s.docs[0].data()} : null)
    )
    return () => { uO(); uM() }
  }, [phone])

  // Fallback: if client has no phone on profile, query by clientId or show all
  useEffect(() => {
    if (phone || !profile?.email) return
    // Try to find orders by email match (graceful degradation)
    const uO = onSnapshot(
      query(collection(db,'orders'), orderBy('createdAt','desc'), limit(20)),
      s => {
        const filtered = s.docs
          .map(d => ({id:d.id,...d.data()}))
          .filter(o => o.clientEmail === profile.email || o.clientName === profile.name)
        setOrders(filtered)
        setLoading(false)
      },
      () => setLoading(false)
    )
    return uO
  }, [phone, profile])

  const tabs = [
    { id:'orders',      label:'My Orders',   icon:'📦' },
    { id:'track',       label:'Track Live',  icon:'📍' },
    { id:'subscription',label:'Subscription',icon:'👑' },
    { id:'book',        label:'Book',        icon:'📲' },
  ]

  return (
    <div style={{ minHeight:'100vh', background: C.navy, display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <div style={{
        background: C.navy2, borderBottom:`1px solid ${C.border}`,
        padding:'0 20px', height:58, display:'flex', alignItems:'center', gap:14,
      }}>
        <div style={{
          width:32, height:32, borderRadius:8, background: C.cyan,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:"'IBM Plex Mono',monospace", fontSize:10, fontWeight:700, color: C.navy,
        }}>DW</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:600, color:'#fff' }}>My Dream Wash</div>
          <div style={{ fontSize:11, color: C.text3 }}>Welcome, {profile?.name?.split(' ')[0] || 'there'} 👋</div>
        </div>
        <button onClick={logout} style={{
          padding:'5px 12px', borderRadius:7, border:`1px solid ${C.border}`,
          background:'transparent', color: C.text3, fontSize:11, cursor:'pointer',
        }}>Sign out</button>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', background: C.navy2, borderBottom:`1px solid ${C.border}`, overflowX:'auto' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding:'12px 18px', border:'none', background:'transparent',
            color: tab===t.id ? C.cyan : C.text3,
            fontWeight: tab===t.id ? 600 : 400, fontSize:13, cursor:'pointer',
            borderBottom: tab===t.id ? `2px solid ${C.cyan}` : '2px solid transparent',
            whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:6,
          }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex:1, overflowY:'auto' }}>
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
            <div style={{ fontSize:13, color: C.text3 }}>Loading your orders…</div>
          </div>
        ) : (
          <>
            {tab === 'orders'       && <MyOrders orders={orders} />}
            {tab === 'track'        && <TrackLive orders={orders} />}
            {tab === 'subscription' && <Subscription member={member} profile={profile} />}
            {tab === 'book'         && <Book profile={profile} />}
          </>
        )}
      </div>
    </div>
  )
}

// ── My Orders ─────────────────────────────────────────────────────────────────
function MyOrders({ orders }) {
  if (orders.length === 0) {
    return (
      <div style={{ padding:48, textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:16 }}>👗</div>
        <div style={{ fontSize:16, fontWeight:600, color:'#fff', marginBottom:8 }}>No orders yet</div>
        <div style={{ fontSize:13, color: C.text3 }}>Drop off your laundry at Dream Wash, Musanze</div>
      </div>
    )
  }

  return (
    <div style={{ padding:20, maxWidth:600, margin:'0 auto' }}>
      <h2 style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:20 }}>My Orders ({orders.length})</h2>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {orders.map(o => (
          <div key={o.id} style={{
            background: C.navy2, borderRadius:14, padding:18,
            border:`1px solid ${o.status==='Ready' ? 'rgba(34,197,94,.4)' : C.border}`,
            boxShadow: o.status==='Ready' ? '0 0 20px rgba(34,197,94,.1)' : 'none',
          }}>
            {/* Status indicator */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <span style={{
                padding:'4px 12px', borderRadius:100, fontSize:12, fontWeight:700,
                background:`${STATUS_COLOR[o.status]}22`, color: STATUS_COLOR[o.status],
              }}>
                {STATUS_ICON[o.status]} {o.status}
              </span>
              <span style={{ fontSize:11, fontFamily:"'IBM Plex Mono',monospace", color: C.text3 }}>
                {o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString('en-RW') : '—'}
              </span>
            </div>

            {/* Progress bar */}
            <ProgressBar status={o.status} />

            {/* Details */}
            <div style={{ marginTop:14, display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <Detail label="Weight"  value={`${o.weight} kg`} />
              <Detail label="Service" value={o.svc==='full'?'Full Wash':'Wash & Dry'} />
              <Detail label="Payment" value={o.payment==='momo'?'MTN MoMo':'Cash'} />
              <Detail label="Total"   value={`${fmt(o.total)} RWF`} highlight />
            </div>

            {o.status === 'Ready' && (
              <div style={{
                marginTop:12, padding:'10px 14px', background: C.gdim,
                borderRadius:9, border:'1px solid rgba(34,197,94,.3)',
                fontSize:13, color: C.green, fontWeight:600, textAlign:'center',
              }}>
                🎉 Your laundry is ready for collection!
              </div>
            )}
            {o.notes && (
              <div style={{ marginTop:10, fontSize:12, color: C.text3, fontStyle:'italic' }}>
                Note: {o.notes}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Track Live ────────────────────────────────────────────────────────────────
function TrackLive({ orders }) {
  const activeOrders = orders.filter(o => o.status !== 'Collected')

  if (activeOrders.length === 0) {
    return (
      <div style={{ padding:48, textAlign:'center' }}>
        <div style={{ fontSize:36, marginBottom:16 }}>✅</div>
        <div style={{ fontSize:15, fontWeight:600, color:'#fff', marginBottom:6 }}>No active orders</div>
        <div style={{ fontSize:13, color: C.text3 }}>All your laundry has been collected</div>
      </div>
    )
  }

  return (
    <div style={{ padding:20, maxWidth:600, margin:'0 auto' }}>
      <h2 style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:6 }}>Live Tracking</h2>
      <p style={{ fontSize:13, color: C.text3, marginBottom:20 }}>Updates in real time as staff advance your order</p>
      {activeOrders.map(o => (
        <div key={o.id} style={{ background: C.navy2, borderRadius:14, padding:20, border:`1px solid ${C.border}`, marginBottom:12 }}>
          <div style={{ fontWeight:600, fontSize:15, color:'#fff', marginBottom:4 }}>{o.svc==='full'?'Full Wash':'Wash & Dry'} · {o.weight} kg</div>
          <div style={{ fontSize:12, color: C.text3, marginBottom:16 }}>
            Dropped off: {o.createdAt?.toDate ? o.createdAt.toDate().toLocaleString('en-RW') : '—'}
          </div>
          {/* Step tracker */}
          <div style={{ position:'relative' }}>
            {STATUS_ORDER.slice(0,-1).map((st, i) => {
              const done    = STATUS_ORDER.indexOf(o.status) > i
              const current = o.status === st
              return (
                <div key={st} style={{ display:'flex', gap:14, marginBottom: i < STATUS_ORDER.length-2 ? 4 : 0, alignItems:'center' }}>
                  <div style={{
                    width:28, height:28, borderRadius:'50%', flexShrink:0,
                    background: done ? C.cyan : current ? 'rgba(0,184,160,.3)' : 'rgba(255,255,255,.05)',
                    border: current ? `2px solid ${C.cyan}` : `2px solid ${done ? C.cyan : 'rgba(255,255,255,.1)'}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:12, fontWeight:700, color: done||current ? '#fff' : C.text3,
                  }}>
                    {done ? '✓' : current ? '●' : i+1}
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight: current ? 700 : 400, color: done||current ? '#fff' : C.text3 }}>
                      {STATUS_ICON[st]} {st}
                    </div>
                    {current && <div style={{ fontSize:11, color: C.cyan }}>In progress right now</div>}
                    {done && (
                      <div style={{ fontSize:11, color: C.text3 }}>
                        {(o.statusHistory||[]).find(h=>h.status===st)
                          ? new Date((o.statusHistory||[]).find(h=>h.status===st).time).toLocaleTimeString('en-RW',{hour:'2-digit',minute:'2-digit'})
                          : 'Completed'}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Subscription ──────────────────────────────────────────────────────────────
function Subscription({ member, profile }) {
  const WA_MSG = `Hello! I am ${profile?.name||'a customer'} and I would like to join the Dream Wash 10k Club (14 kg/month for 10,000 RWF). Please register me. My phone: ${profile?.phone||''}`

  if (!member) {
    return (
      <div style={{ padding:28, maxWidth:500, margin:'0 auto' }}>
        <div style={{
          background: C.navy2, borderRadius:16, padding:28, border:`1px solid ${C.border}`,
          textAlign:'center',
        }}>
          <div style={{ fontSize:40, marginBottom:16 }}>👑</div>
          <h2 style={{ fontSize:20, fontWeight:700, color:'#fff', marginBottom:8 }}>10k Club</h2>
          <p style={{ fontSize:13, color: C.text3, lineHeight:1.6, marginBottom:24 }}>
            14 kg of laundry per month for just <strong style={{ color: C.cyan }}>10,000 RWF</strong>.
            Save up to 25% compared to walk-in prices. Priority processing, no queuing.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:24 }}>
            {['14 kg / month','Priority service','Save ~25%','No waiting'].map(f => (
              <div key={f} style={{ padding:'10px', background: C.cdim, borderRadius:9, fontSize:12, color: C.cyan, fontWeight:500 }}>
                ✓ {f}
              </div>
            ))}
          </div>
          <a href={`https://wa.me/${WA}?text=${encodeURIComponent(WA_MSG)}`} target="_blank" rel="noreferrer"
            style={{
              display:'block', padding:'13px', borderRadius:11,
              background:'#25D366', color:'#fff', fontWeight:700, fontSize:14, textAlign:'center',
            }}>
            📲 Join the 10k Club via WhatsApp
          </a>
          <p style={{ fontSize:11, color: C.text3, marginTop:12 }}>
            We'll activate your membership within 24 hours of payment confirmation.
          </p>
        </div>
      </div>
    )
  }

  const pct = Math.min(Math.round(((member.used||0)/(member.limit||14))*100), 100)
  const rem = (member.limit||14) - (member.used||0)
  const barColor = pct < 70 ? C.cyan : pct < 100 ? C.amber : C.red

  return (
    <div style={{ padding:28, maxWidth:500, margin:'0 auto' }}>
      <div style={{ background: C.navy2, borderRadius:16, padding:28, border:`1px solid ${C.border}` }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <div>
            <h2 style={{ fontSize:18, fontWeight:700, color:'#fff' }}>10k Club</h2>
            <div style={{ fontSize:12, color: C.text3 }}>Member ID: {member.id?.slice(0,12)}</div>
          </div>
          <span style={{
            padding:'5px 14px', borderRadius:100, fontSize:12, fontWeight:700,
            background: member.status==='active' ? C.gdim : C.adim,
            color: member.status==='active' ? C.green : C.amber,
          }}>{member.status==='active' ? '● Active' : 'Inactive'}</span>
        </div>

        {/* Usage bar */}
        <div style={{ marginBottom:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ fontSize:13, color: C.text2 }}>Monthly usage</span>
            <span style={{ fontSize:13, fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, color: barColor }}>
              {member.used||0} / {member.limit||14} kg
            </span>
          </div>
          <div style={{ height:10, background:'rgba(255,255,255,.1)', borderRadius:5, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${pct}%`, background: barColor, borderRadius:5, transition:'width .6s ease' }} />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
            <span style={{ fontSize:11, color: C.text3 }}>{pct}% used</span>
            <span style={{ fontSize:11, color: rem > 0 ? C.cyan : C.red }}>
              {rem > 0 ? `${rem} kg remaining` : 'Monthly limit reached'}
            </span>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div style={{ background: C.surface, borderRadius:9, padding:'12px 14px' }}>
            <div style={{ fontSize:10, color: C.text3, textTransform:'uppercase', letterSpacing:'.07em', marginBottom:4 }}>Plan renews</div>
            <div style={{ fontSize:13, fontWeight:600, color:'#fff' }}>
              {member.planEndDate?.toDate ? member.planEndDate.toDate().toLocaleDateString('en-RW') : '—'}
            </div>
          </div>
          <div style={{ background: C.surface, borderRadius:9, padding:'12px 14px' }}>
            <div style={{ fontSize:10, color: C.text3, textTransform:'uppercase', letterSpacing:'.07em', marginBottom:4 }}>Monthly fee</div>
            <div style={{ fontSize:13, fontWeight:600, color: C.cyan, fontFamily:"'IBM Plex Mono',monospace" }}>10,000 RWF</div>
          </div>
        </div>

        {pct >= 90 && (
          <div style={{
            marginTop:16, padding:'12px 14px',
            background: pct >= 100 ? C.rdim : C.adim,
            borderRadius:9, fontSize:12,
            color: pct >= 100 ? C.red : C.amber, fontWeight:500,
          }}>
            {pct >= 100
              ? '⚠️ You have reached your monthly limit. Overage orders are charged at 748 RWF/kg.'
              : '📊 You are approaching your monthly limit. Consider bringing your laundry soon.'}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Book ──────────────────────────────────────────────────────────────────────
function Book({ profile }) {
  const preMsg = encodeURIComponent(`Hello Dream Wash! My name is ${profile?.name||''} and I would like to schedule a laundry drop-off. Could you let me know the available times?`)

  return (
    <div style={{ padding:28, maxWidth:480, margin:'0 auto' }}>
      <h2 style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:6 }}>Book a Drop-off</h2>
      <p style={{ fontSize:13, color: C.text3, marginBottom:28, lineHeight:1.6 }}>
        Contact us via WhatsApp to schedule your drop-off or ask about our services.
      </p>

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <a href={`https://wa.me/${WA}?text=${preMsg}`} target="_blank" rel="noreferrer"
          style={{ display:'flex', alignItems:'center', gap:14, background: C.navy2, borderRadius:13, padding:18, border:`1px solid ${C.border}`, textDecoration:'none' }}>
          <span style={{ fontSize:28 }}>📲</span>
          <div>
            <div style={{ fontWeight:600, fontSize:14, color:'#fff', marginBottom:3 }}>WhatsApp Chat</div>
            <div style={{ fontSize:12, color: C.text3 }}>+250 780 000 000 · Instant response</div>
          </div>
        </a>

        <div style={{ background: C.navy2, borderRadius:13, padding:18, border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:13, fontWeight:600, color:'#fff', marginBottom:12 }}>📍 Find Us</div>
          <p style={{ fontSize:12, color: C.text3, lineHeight:1.7 }}>
            Near INES-Ruhengeri<br />
            Musanze District, Northern Province<br />
            Rwanda
          </p>
        </div>

        <div style={{ background: C.navy2, borderRadius:13, padding:18, border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:13, fontWeight:600, color:'#fff', marginBottom:12 }}>🕐 Opening Hours</div>
          {[
            ['Monday – Friday', '7:00 AM – 7:00 PM'],
            ['Saturday',        '7:00 AM – 6:00 PM'],
            ['Sunday',          '8:00 AM – 2:00 PM'],
          ].map(([day, hrs]) => (
            <div key={day} style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:6 }}>
              <span style={{ color: C.text3 }}>{day}</span>
              <span style={{ color:'#fff', fontWeight:500 }}>{hrs}</span>
            </div>
          ))}
        </div>

        <div style={{ background: C.navy2, borderRadius:13, padding:18, border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:13, fontWeight:600, color:'#fff', marginBottom:12 }}>💰 Pricing</div>
          {[
            ['Walk-in (Full Wash)', '848 RWF / kg'],
            ['10k Club Members',   '~714 RWF / kg effective'],
            ['VAT',                '18% included'],
          ].map(([svc, price]) => (
            <div key={svc} style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:6 }}>
              <span style={{ color: C.text3 }}>{svc}</span>
              <span style={{ color: C.cyan, fontFamily:"'IBM Plex Mono',monospace", fontWeight:600 }}>{price}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── UI Primitives ─────────────────────────────────────────────────────────────
function ProgressBar({ status }) {
  const idx = STATUS_ORDER.indexOf(status)
  return (
    <div style={{ display:'flex', gap:3, marginBottom:4 }}>
      {STATUS_ORDER.slice(0,-1).map((s,i) => (
        <div key={s} style={{
          flex:1, height:4, borderRadius:2,
          background: i <= idx ? STATUS_COLOR[status] : 'rgba(255,255,255,.1)',
          transition:'background .4s',
        }} />
      ))}
    </div>
  )
}
function Detail({ label, value, highlight }) {
  return (
    <div style={{ background:'rgba(255,255,255,.04)', borderRadius:8, padding:'8px 11px' }}>
      <div style={{ fontSize:10, color: C.text3, textTransform:'uppercase', letterSpacing:'.07em', marginBottom:3 }}>{label}</div>
      <div style={{ fontSize:13, fontWeight: highlight ? 700 : 500, color: highlight ? C.cyan : '#fff', fontFamily: highlight ? "'IBM Plex Mono',monospace" : 'inherit' }}>{value}</div>
    </div>
  )
}
