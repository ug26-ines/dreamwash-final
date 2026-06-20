// src/portals/ceo/CeoDashboard.jsx
import { useState, useEffect, useCallback } from 'react'
import {
  collection, query, orderBy, onSnapshot, doc, getDoc,
  updateDoc, addDoc, setDoc, serverTimestamp, where, getDocs, limit,
} from 'firebase/firestore'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { db, auth } from '../../firebase'
import { useAuth } from '../../shared/AuthContext'

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  navy:'#0c1f35', navy2:'#152d47', navy3:'#1e3a57',
  cyan:'#00b8a0', cyan2:'#009b86', cdim:'rgba(0,184,160,.12)',
  amber:'#d97706', adim:'rgba(217,119,6,.12)',
  red:'#dc2626', rdim:'rgba(220,38,38,.12)',
  green:'#16a34a', gdim:'rgba(22,163,74,.12)',
  bg:'#f0f2f5', surface:'#fff', sf2:'#f7f8fa',
  border:'#e2e6eb', border2:'#d0d5dd',
  text:'#0c1f35', text2:'#3d5068', text3:'#6b7c93', text4:'#9aacbf',
}

const STATUS_ORDER = ['Received','Washing','Drying','Pressing','Ready','Collected']
const STATUS_COLOR = {
  Received:'#1d4ed8', Washing:'#7c3aed', Drying:'#d97706',
  Pressing:'#0891b2', Ready:'#16a34a', Collected:'#6b7c93',
}

const fmt = (n) => Number(n || 0).toLocaleString('en-RW')
const today = () => new Date().toDateString()

// ── Main Component ────────────────────────────────────────────────────────────
export default function CeoDashboard() {
  const { profile, logout } = useAuth()
  const [tab, setTab] = useState('overview')
  const [orders,  setOrders]  = useState([])
  const [clients, setClients] = useState([])
  const [members, setMembers] = useState([])
  const [toast,   setToast]   = useState(null)

  const showToast = useCallback((msg, type = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  // Live listeners
  useEffect(() => {
    const uO = onSnapshot(query(collection(db,'orders'), orderBy('createdAt','desc'), limit(500)),
      s => setOrders(s.docs.map(d => ({ id: d.id, ...d.data() }))), console.error)
    const uC = onSnapshot(query(collection(db,'clients'), orderBy('name')),
      s => setClients(s.docs.map(d => ({ id: d.id, ...d.data() }))), console.error)
    const uM = onSnapshot(query(collection(db,'members'), orderBy('name')),
      s => setMembers(s.docs.map(d => ({ id: d.id, ...d.data() }))), console.error)
    return () => { uO(); uC(); uM() }
  }, [])

  // KPI calculations
  const todayOrders = orders.filter(o => o.createdAt?.toDate && o.createdAt.toDate().toDateString() === today())
  const kpis = {
    todayRevenue: todayOrders.reduce((s, o) => s + (o.total || 0), 0),
    todayOrders:  todayOrders.length,
    todayKg:      todayOrders.reduce((s, o) => s + (o.weight || 0), 0),
    activeOrders: orders.filter(o => o.status !== 'Collected').length,
    activeMembers: members.filter(m => m.status === 'active').length,
    monthRevenue: orders.filter(o => {
      if (!o.createdAt?.toDate) return false
      const d = o.createdAt.toDate()
      const now = new Date()
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).reduce((s, o) => s + (o.total || 0), 0),
  }

  const tabs = [
    { id:'overview', label:'Overview',  icon:'📊' },
    { id:'orders',   label:'Orders',    icon:'📋' },
    { id:'pipeline', label:'Pipeline',  icon:'⚙️' },
    { id:'clients',  label:'Clients',   icon:'👥' },
    { id:'members',  label:'10k Club',  icon:'👑' },
    { id:'staff',    label:'Staff',     icon:'🧑‍💼' },
    { id:'settings', label:'Settings',  icon:'⚙️' },
  ]

  return (
    <div style={{ minHeight:'100vh', background: C.navy, display:'flex', flexDirection:'column' }}>
      {/* Topbar */}
      <div style={{
        background: C.navy2, borderBottom:`1px solid rgba(255,255,255,.08)`,
        padding:'0 24px', height: 60, display:'flex', alignItems:'center', gap: 16, flexShrink: 0,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap: 10, marginRight:'auto' }}>
          <div style={{
            width:32, height:32, borderRadius:8, background: C.cyan,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:"'IBM Plex Mono',monospace", fontSize:11, fontWeight:700, color: C.navy,
          }}>DW</div>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:'#fff' }}>Dream Wash</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:'.06em' }}>CEO Dashboard</div>
          </div>
        </div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,.5)' }}>
          {profile?.name || 'CEO'}
        </div>
        <button onClick={logout} style={{
          padding:'6px 14px', borderRadius:7, border:'1px solid rgba(255,255,255,.12)',
          background:'transparent', color:'rgba(255,255,255,.5)', fontSize:12, cursor:'pointer',
        }}>Sign out</button>
      </div>

      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        {/* Sidebar nav */}
        <div style={{
          width:200, background: C.navy2, borderRight:'1px solid rgba(255,255,255,.06)',
          padding:'16px 10px', display:'flex', flexDirection:'column', gap:2, flexShrink:0,
        }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display:'flex', alignItems:'center', gap:9,
              padding:'9px 12px', borderRadius:9, border:'none', cursor:'pointer', textAlign:'left',
              background: tab === t.id ? 'rgba(0,184,160,.15)' : 'transparent',
              color: tab === t.id ? C.cyan : 'rgba(255,255,255,.5)',
              fontSize:13, fontWeight: tab === t.id ? 600 : 400,
              transition:'all .15s',
            }}>
              <span style={{ fontSize:14 }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex:1, overflow:'auto', background: C.bg }}>
          {tab === 'overview'  && <Overview kpis={kpis} orders={orders} members={members} />}
          {tab === 'orders'    && <Orders orders={orders} showToast={showToast} />}
          {tab === 'pipeline'  && <Pipeline orders={orders} showToast={showToast} />}
          {tab === 'clients'   && <Clients clients={clients} />}
          {tab === 'members'   && <Members members={members} showToast={showToast} />}
          {tab === 'staff'     && <Staff showToast={showToast} />}
          {tab === 'settings'  && <Settings showToast={showToast} />}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position:'fixed', bottom:28, right:28, zIndex:999,
          background: toast.type === 'ok' ? C.green : toast.type === 'warn' ? C.amber : C.red,
          color:'#fff', padding:'12px 20px', borderRadius:10, fontSize:13, fontWeight:500,
          boxShadow:'0 8px 32px rgba(0,0,0,.3)', animation:'dw-slide-up .3s ease',
        }}>{toast.msg}</div>
      )}
    </div>
  )
}

// ── OVERVIEW TAB ──────────────────────────────────────────────────────────────
function Overview({ kpis, orders, members }) {
  const cards = [
    { label:"Today's Revenue",  value:`${fmt(kpis.todayRevenue)} RWF`, icon:'💰', color: C.cyan },
    { label:'Orders Today',     value: kpis.todayOrders,               icon:'📦', color:'#7c3aed' },
    { label:'Kg Today',         value:`${(kpis.todayKg||0).toFixed(1)} kg`, icon:'⚖️', color:'#1d4ed8' },
    { label:'Active Orders',    value: kpis.activeOrders,              icon:'⚙️', color: C.amber },
    { label:'Month Revenue',    value:`${fmt(kpis.monthRevenue)} RWF`, icon:'📈', color: C.green },
    { label:'Club Members',     value: kpis.activeMembers,             icon:'👑', color:'#0891b2' },
  ]

  const recentOrders = orders.slice(0, 8)

  return (
    <div style={{ padding:28 }}>
      <h2 style={{ fontSize:20, fontWeight:700, color: C.text, marginBottom:24 }}>Business Overview</h2>

      {/* KPI Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:16, marginBottom:32 }}>
        {cards.map(c => (
          <div key={c.label} style={{
            background: C.surface, borderRadius:14, padding:'20px 22px',
            border:`1px solid ${C.border}`, boxShadow:'0 1px 4px rgba(0,0,0,.05)',
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
              <div style={{ fontSize:11, color: C.text3, textTransform:'uppercase', letterSpacing:'.08em', fontWeight:600 }}>
                {c.label}
              </div>
              <span style={{ fontSize:18 }}>{c.icon}</span>
            </div>
            <div style={{ fontSize:24, fontWeight:700, color: c.color, fontFamily:"'IBM Plex Mono',monospace" }}>
              {c.value}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div style={{ background: C.surface, borderRadius:14, border:`1px solid ${C.border}`, overflow:'hidden' }}>
        <div style={{ padding:'16px 22px', borderBottom:`1px solid ${C.border}`, fontWeight:600, fontSize:14, color: C.text }}>
          Recent Orders
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background: C.sf2 }}>
                {['Order','Client','Service','Kg','Total','Status','Date'].map(h => (
                  <th key={h} style={{ padding:'10px 16px', textAlign:'left', color: C.text3, fontWeight:600, fontSize:11, textTransform:'uppercase', letterSpacing:'.06em', borderBottom:`1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr><td colSpan={7} style={{ padding:'32px', textAlign:'center', color: C.text3 }}>No orders yet</td></tr>
              ) : recentOrders.map(o => (
                <tr key={o.id} style={{ borderBottom:`1px solid ${C.border}` }}>
                  <td style={{ padding:'10px 16px', fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color: C.text3 }}>{o.id?.slice(-8)}</td>
                  <td style={{ padding:'10px 16px', fontWeight:500, color: C.text }}>{o.clientName}</td>
                  <td style={{ padding:'10px 16px', color: C.text2 }}>{o.svc === 'full' ? 'Full Wash' : 'Wash & Dry'}</td>
                  <td style={{ padding:'10px 16px', color: C.text2 }}>{o.weight} kg</td>
                  <td style={{ padding:'10px 16px', fontFamily:"'IBM Plex Mono',monospace", fontWeight:600, color: C.navy }}>{fmt(o.total)} RWF</td>
                  <td style={{ padding:'10px 16px' }}>
                    <span style={{
                      padding:'3px 9px', borderRadius:100, fontSize:11, fontWeight:600,
                      background: `${STATUS_COLOR[o.status]}22`, color: STATUS_COLOR[o.status],
                    }}>{o.status}</span>
                  </td>
                  <td style={{ padding:'10px 16px', color: C.text3, fontSize:11 }}>
                    {o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString('en-RW') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── ORDERS TAB ────────────────────────────────────────────────────────────────
function Orders({ orders, showToast }) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = orders.filter(o => {
    const matchStatus = filter === 'all' || o.status === filter
    const q = search.toLowerCase()
    const matchSearch = !q || o.clientName?.toLowerCase().includes(q) || o.id?.toLowerCase().includes(q) || o.clientPhone?.includes(q)
    return matchStatus && matchSearch
  })

  const advance = async (o) => {
    const idx = STATUS_ORDER.indexOf(o.status)
    if (idx < 0 || idx >= STATUS_ORDER.length - 1) return
    const next = STATUS_ORDER[idx + 1]
    try {
      await updateDoc(doc(db,'orders',o.id), {
        status: next,
        statusHistory: [...(o.statusHistory||[]), { status: next, time: new Date().toISOString() }],
        updatedAt: serverTimestamp(),
      })
      showToast(`Order moved to "${next}"`)
    } catch { showToast('Failed to update order', 'err') }
  }

  return (
    <div style={{ padding:28 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24, flexWrap:'wrap' }}>
        <h2 style={{ fontSize:20, fontWeight:700, color: C.text, marginRight:'auto' }}>All Orders</h2>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search client, phone, ID…"
          style={{ padding:'8px 14px', borderRadius:9, border:`1.5px solid ${C.border}`, background:'#fff', fontSize:13, outline:'none', width:240, color: C.text }} />
        <select value={filter} onChange={e => setFilter(e.target.value)}
          style={{ padding:'8px 12px', borderRadius:9, border:`1.5px solid ${C.border}`, background:'#fff', fontSize:13, color: C.text, outline:'none' }}>
          <option value="all">All statuses</option>
          {STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div style={{ background: C.surface, borderRadius:14, border:`1px solid ${C.border}`, overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13, minWidth:900 }}>
            <thead>
              <tr style={{ background: C.sf2 }}>
                {['ID','Client','Phone','Type','Service','Kg','Rate','Total','Payment','Status','Action'].map(h => (
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', color: C.text3, fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', borderBottom:`1px solid ${C.border}`, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={11} style={{ padding:40, textAlign:'center', color: C.text3 }}>No orders found</td></tr>
              ) : filtered.map(o => (
                <tr key={o.id} style={{ borderBottom:`1px solid ${C.border}` }}>
                  <td style={{ padding:'10px 14px', fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color: C.text3 }}>{o.id?.slice(-10)}</td>
                  <td style={{ padding:'10px 14px', fontWeight:500 }}>{o.clientName}</td>
                  <td style={{ padding:'10px 14px', fontFamily:"'IBM Plex Mono',monospace", fontSize:11 }}>{o.clientPhone}</td>
                  <td style={{ padding:'10px 14px' }}>
                    <span style={{ padding:'2px 8px', borderRadius:100, fontSize:10, fontWeight:600, background: C.cdim, color: C.cyan }}>
                      {o.ctype || 'walkin'}
                    </span>
                  </td>
                  <td style={{ padding:'10px 14px', color: C.text2 }}>{o.svc === 'full' ? 'Full' : 'W&D'}</td>
                  <td style={{ padding:'10px 14px', color: C.text2 }}>{o.weight} kg</td>
                  {/* CEO sees rate per kg — financial data */}
                  <td style={{ padding:'10px 14px', fontFamily:"'IBM Plex Mono',monospace", color: C.amber, fontWeight:600 }}>{fmt(o.rate)}</td>
                  <td style={{ padding:'10px 14px', fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, color: C.navy }}>{fmt(o.total)}</td>
                  <td style={{ padding:'10px 14px', color: C.text2 }}>{o.payment === 'momo' ? 'MoMo' : 'Cash'}</td>
                  <td style={{ padding:'10px 14px' }}>
                    <span style={{ padding:'3px 9px', borderRadius:100, fontSize:11, fontWeight:600, background:`${STATUS_COLOR[o.status]}22`, color: STATUS_COLOR[o.status] }}>
                      {o.status}
                    </span>
                  </td>
                  <td style={{ padding:'10px 14px' }}>
                    {o.status !== 'Collected' && (
                      <button onClick={() => advance(o)} style={{
                        padding:'4px 10px', borderRadius:6, border:`1px solid ${C.border2}`,
                        background:'transparent', color: C.text2, fontSize:11, cursor:'pointer',
                      }}>→ Next</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── PIPELINE TAB ──────────────────────────────────────────────────────────────
function Pipeline({ orders, showToast }) {
  const active = orders.filter(o => o.status !== 'Collected')
  const cols   = STATUS_ORDER.slice(0, -1) // exclude Collected

  const advance = async (o) => {
    const idx = STATUS_ORDER.indexOf(o.status)
    if (idx >= STATUS_ORDER.length - 1) return
    const next = STATUS_ORDER[idx + 1]
    await updateDoc(doc(db,'orders',o.id), {
      status: next,
      statusHistory: [...(o.statusHistory||[]), { status: next, time: new Date().toISOString() }],
      updatedAt: serverTimestamp(),
    })
    showToast(`Moved to "${next}"`)
  }

  return (
    <div style={{ padding:28, height:'100%' }}>
      <h2 style={{ fontSize:20, fontWeight:700, color: C.text, marginBottom:24 }}>Live Pipeline</h2>
      <div style={{ display:'flex', gap:12, overflowX:'auto', paddingBottom:16, alignItems:'flex-start' }}>
        {cols.map(st => {
          const stOrders = active.filter(o => o.status === st)
          return (
            <div key={st} style={{ minWidth:220, flex:'0 0 220px' }}>
              <div style={{
                padding:'8px 14px', borderRadius:'9px 9px 0 0',
                background: `${STATUS_COLOR[st]}22`, borderBottom:`2px solid ${STATUS_COLOR[st]}`,
                display:'flex', justifyContent:'space-between', alignItems:'center',
              }}>
                <span style={{ fontSize:12, fontWeight:700, color: STATUS_COLOR[st], textTransform:'uppercase', letterSpacing:'.08em' }}>{st}</span>
                <span style={{ fontSize:11, background: STATUS_COLOR[st], color:'#fff', borderRadius:100, padding:'1px 7px', fontWeight:700 }}>{stOrders.length}</span>
              </div>
              <div style={{ background:'#fff', borderRadius:'0 0 9px 9px', border:`1px solid ${C.border}`, borderTop:'none', minHeight:80, padding:8, display:'flex', flexDirection:'column', gap:8 }}>
                {stOrders.length === 0
                  ? <div style={{ padding:16, textAlign:'center', color: C.text4, fontSize:12 }}>Empty</div>
                  : stOrders.map(o => (
                    <div key={o.id} style={{
                      background: C.sf2, borderRadius:8, padding:'10px 12px',
                      border:`1px solid ${C.border}`,
                    }}>
                      <div style={{ fontWeight:600, fontSize:13, color: C.text, marginBottom:2 }}>{o.clientName}</div>
                      <div style={{ fontSize:11, color: C.text3, marginBottom:8 }}>{o.weight} kg · {fmt(o.total)} RWF</div>
                      {st !== 'Ready' && (
                        <button onClick={() => advance(o)} style={{
                          width:'100%', padding:'5px', borderRadius:6, border:'none',
                          background: STATUS_COLOR[STATUS_ORDER[STATUS_ORDER.indexOf(st)+1]],
                          color:'#fff', fontSize:11, fontWeight:600, cursor:'pointer',
                        }}>→ {STATUS_ORDER[STATUS_ORDER.indexOf(st)+1]}</button>
                      )}
                    </div>
                  ))
                }
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── CLIENTS TAB ───────────────────────────────────────────────────────────────
function Clients({ clients }) {
  const [search, setSearch] = useState('')
  const list = clients.filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search))

  return (
    <div style={{ padding:28 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
        <h2 style={{ fontSize:20, fontWeight:700, color: C.text, marginRight:'auto' }}>Clients ({clients.length})</h2>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or phone…"
          style={{ padding:'8px 14px', borderRadius:9, border:`1.5px solid ${C.border}`, background:'#fff', fontSize:13, outline:'none', color: C.text, width:240 }} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16 }}>
        {list.length === 0 ? <p style={{ color: C.text3 }}>No clients yet</p> : list.map(c => {
          const tier = c.orders >= 8 ? 'vip' : c.orders >= 3 ? 'regular' : 'new'
          const tierColors = { vip:[C.amber,'rgba(217,119,6,.12)'], regular:[C.cyan,C.cdim], new:[C.text3,'rgba(107,124,147,.12)'] }
          const [tc, tbg] = tierColors[tier]
          const initials = (c.name||'??').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
          return (
            <div key={c.id} style={{ background: C.surface, borderRadius:14, padding:20, border:`1px solid ${C.border}` }}>
              <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:14 }}>
                <div style={{ width:42, height:42, borderRadius:'50%', background: C.cdim, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color: C.cyan, fontSize:14 }}>{initials}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, color: C.text }}>{c.name}</div>
                  <div style={{ fontSize:12, fontFamily:"'IBM Plex Mono',monospace", color: C.text3 }}>{c.phone}</div>
                </div>
                <span style={{ padding:'3px 10px', borderRadius:100, fontSize:11, fontWeight:600, background: tbg, color: tc }}>{tier.toUpperCase()}</span>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <Stat label="Orders" value={c.orders || 0} />
                <Stat label="Total Spent" value={`${fmt(c.total||0)} RWF`} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── MEMBERS (10k Club) TAB ────────────────────────────────────────────────────
function Members({ members, showToast }) {
  return (
    <div style={{ padding:28 }}>
      <h2 style={{ fontSize:20, fontWeight:700, color: C.text, marginBottom:24 }}>10k Club Members ({members.length})</h2>
      <div style={{ background: C.surface, borderRadius:14, border:`1px solid ${C.border}`, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr style={{ background: C.sf2 }}>
              {['Member ID','Name','Phone','Used','Limit','Usage','Plan End','Status'].map(h => (
                <th key={h} style={{ padding:'10px 16px', textAlign:'left', color: C.text3, fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', borderBottom:`1px solid ${C.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr><td colSpan={8} style={{ padding:40, textAlign:'center', color: C.text3 }}>No members yet</td></tr>
            ) : members.map(m => {
              const pct = Math.round(((m.used||0) / (m.limit||14)) * 100)
              const cls = pct < 70 ? C.cyan : pct < 100 ? C.amber : C.red
              return (
                <tr key={m.id} style={{ borderBottom:`1px solid ${C.border}` }}>
                  <td style={{ padding:'10px 16px', fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color: C.text3 }}>{m.id?.slice(0,10)}</td>
                  <td style={{ padding:'10px 16px', fontWeight:600, color: C.text }}>{m.name}</td>
                  <td style={{ padding:'10px 16px', fontFamily:"'IBM Plex Mono',monospace", fontSize:11 }}>{m.phone}</td>
                  <td style={{ padding:'10px 16px' }}>{m.used||0} kg</td>
                  <td style={{ padding:'10px 16px' }}>{m.limit||14} kg</td>
                  <td style={{ padding:'10px 16px', minWidth:120 }}>
                    <div style={{ height:5, background: C.border, borderRadius:3, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${Math.min(pct,100)}%`, background: cls, borderRadius:3, transition:'width .4s' }} />
                    </div>
                    <div style={{ fontSize:10, color: cls, marginTop:3 }}>{pct}%</div>
                  </td>
                  <td style={{ padding:'10px 16px', fontSize:11, color: C.text3 }}>
                    {m.planEndDate?.toDate ? m.planEndDate.toDate().toLocaleDateString('en-RW') : '—'}
                  </td>
                  <td style={{ padding:'10px 16px' }}>
                    <span style={{ padding:'3px 9px', borderRadius:100, fontSize:11, fontWeight:600, background: m.status==='active' ? C.gdim : C.rdim, color: m.status==='active' ? C.green : C.red }}>{m.status || 'inactive'}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── STAFF TAB ─────────────────────────────────────────────────────────────────
function Staff({ showToast }) {
  const [staff,    setStaff]    = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form,     setForm]     = useState({ name:'', email:'', pwd:'', role:'receptionist' })
  const [busy,     setBusy]     = useState(false)

  useEffect(() => {
    const u = onSnapshot(query(collection(db,'users'), where('role','in',['receptionist','ceo'])),
      s => setStaff(s.docs.map(d => ({ uid: d.id, ...d.data() }))), console.error)
    return u
  }, [])

  const createStaff = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      // NOTE: createUserWithEmailAndPassword signs in as the new user.
      // In production, use Firebase Admin SDK or Cloud Functions for this.
      // For local dev this works but signs out the CEO temporarily.
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.pwd)
      await setDoc(doc(db,'users',cred.user.uid), {
        name:  form.name,
        email: form.email,
        role:  form.role,
        createdAt: serverTimestamp(),
      })
      showToast(`${form.role} account created for ${form.name}`)
      setForm({ name:'', email:'', pwd:'', role:'receptionist' })
      setShowForm(false)
    } catch (err) {
      showToast(err.message, 'err')
    }
    setBusy(false)
  }

  return (
    <div style={{ padding:28 }}>
      <div style={{ display:'flex', alignItems:'center', marginBottom:24 }}>
        <h2 style={{ fontSize:20, fontWeight:700, color: C.text, marginRight:'auto' }}>Staff Accounts</h2>
        <button onClick={() => setShowForm(v => !v)} style={primaryBtn}>
          {showForm ? 'Cancel' : '+ New Staff Account'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: C.surface, borderRadius:14, padding:24, border:`1px solid ${C.border}`, marginBottom:24 }}>
          <h3 style={{ fontWeight:600, color: C.text, marginBottom:18 }}>Create Staff Account</h3>
          <div style={{
            background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.3)',
            borderRadius:8, padding:'10px 14px', marginBottom:18, fontSize:12, color: C.amber,
          }}>
            ⚠️ Creating a staff account will temporarily sign you out. Sign back in after.
          </div>
          <form onSubmit={createStaff}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
              <CField label="Full Name">
                <input value={form.name} onChange={e => setForm({...form, name:e.target.value})} required placeholder="Full name" style={inputStyleLight} />
              </CField>
              <CField label="Email">
                <input type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} required placeholder="staff@email.com" style={inputStyleLight} />
              </CField>
              <CField label="Password (min 6 chars)">
                <input type="password" value={form.pwd} onChange={e => setForm({...form, pwd:e.target.value})} required minLength={6} placeholder="••••••••" style={inputStyleLight} />
              </CField>
              <CField label="Role">
                <select value={form.role} onChange={e => setForm({...form, role:e.target.value})} style={inputStyleLight}>
                  <option value="receptionist">Receptionist</option>
                  <option value="ceo">CEO</option>
                </select>
              </CField>
            </div>
            <button type="submit" disabled={busy} style={primaryBtn}>{busy ? 'Creating…' : 'Create Account'}</button>
          </form>
        </div>
      )}

      <div style={{ background: C.surface, borderRadius:14, border:`1px solid ${C.border}`, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr style={{ background: C.sf2 }}>
              {['Name','Email','Role','Created'].map(h => (
                <th key={h} style={{ padding:'10px 16px', textAlign:'left', color: C.text3, fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', borderBottom:`1px solid ${C.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staff.length === 0 ? (
              <tr><td colSpan={4} style={{ padding:40, textAlign:'center', color: C.text3 }}>No staff accounts</td></tr>
            ) : staff.map(s => (
              <tr key={s.uid} style={{ borderBottom:`1px solid ${C.border}` }}>
                <td style={{ padding:'10px 16px', fontWeight:600, color: C.text }}>{s.name}</td>
                <td style={{ padding:'10px 16px', color: C.text2 }}>{s.email}</td>
                <td style={{ padding:'10px 16px' }}>
                  <span style={{ padding:'3px 9px', borderRadius:100, fontSize:11, fontWeight:600, background: s.role==='ceo' ? 'rgba(217,119,6,.12)' : C.cdim, color: s.role==='ceo' ? C.amber : C.cyan }}>
                    {s.role}
                  </span>
                </td>
                <td style={{ padding:'10px 16px', fontSize:11, color: C.text3 }}>
                  {s.createdAt?.toDate ? s.createdAt.toDate().toLocaleDateString('en-RW') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── SETTINGS TAB ──────────────────────────────────────────────────────────────
function Settings({ showToast }) {
  const [rates, setRates] = useState({ walkin:848, club:748, wdDiscount:0.8, vatRate:0.18, clubFee:10000, clubLimit:14 })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getDoc(doc(db,'config','rates')).then(snap => {
      if (snap.exists()) setRates(r => ({ ...r, ...snap.data() }))
    }).catch(() => {})
  }, [])

  const saveRates = async () => {
    try {
      await setDoc(doc(db,'config','rates'), { ...rates, updatedAt: serverTimestamp() })
      showToast('Rates saved successfully')
    } catch { showToast('Failed to save rates', 'err') }
  }

  return (
    <div style={{ padding:28 }}>
      <h2 style={{ fontSize:20, fontWeight:700, color: C.text, marginBottom:24 }}>Pricing & Configuration</h2>
      <div style={{ background: C.surface, borderRadius:14, padding:28, border:`1px solid ${C.border}`, maxWidth:600 }}>
        <div style={{
          background:'rgba(0,184,160,.08)', border:'1px solid rgba(0,184,160,.2)',
          borderRadius:8, padding:'10px 14px', marginBottom:22, fontSize:12, color:'#0891b2',
        }}>
          🔒 These rates are only visible to the CEO. Receptionists see totals only.
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
          <RateField label="Walk-in Rate (RWF/kg)" value={rates.walkin} onChange={v => setRates({...rates,walkin:v})} />
          <RateField label="Club Overage Rate (RWF/kg)" value={rates.club} onChange={v => setRates({...rates,club:v})} />
          <RateField label="W&D Discount Factor" value={rates.wdDiscount} onChange={v => setRates({...rates,wdDiscount:v})} step={0.01} />
          <RateField label="VAT Rate" value={rates.vatRate} onChange={v => setRates({...rates,vatRate:v})} step={0.01} />
          <RateField label="Club Monthly Fee (RWF)" value={rates.clubFee} onChange={v => setRates({...rates,clubFee:v})} />
          <RateField label="Club Kg Limit" value={rates.clubLimit} onChange={v => setRates({...rates,clubLimit:v})} />
        </div>
        <button onClick={saveRates} style={{ ...primaryBtn, marginTop:22 }}>Save Configuration</button>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function Stat({ label, value }) {
  return (
    <div style={{ flex:1, background: C.sf2, borderRadius:8, padding:'8px 12px' }}>
      <div style={{ fontSize:10, color: C.text4, textTransform:'uppercase', letterSpacing:'.06em' }}>{label}</div>
      <div style={{ fontWeight:600, color: C.text, fontSize:14, marginTop:2 }}>{value}</div>
    </div>
  )
}
function CField({ label, children }) {
  return (
    <div>
      <label style={{ display:'block', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'.07em', color: C.text3, marginBottom:5 }}>{label}</label>
      {children}
    </div>
  )
}
function RateField({ label, value, onChange, step = 1 }) {
  return (
    <CField label={label}>
      <input type="number" value={value} step={step} onChange={e => onChange(parseFloat(e.target.value))} style={inputStyleLight} />
    </CField>
  )
}

const primaryBtn = {
  padding:'9px 18px', borderRadius:9, border:'none',
  background: C.cyan, color: C.navy, fontWeight:700, fontSize:13, cursor:'pointer',
}
const inputStyleLight = {
  width:'100%', padding:'9px 12px', borderRadius:8,
  border:`1.5px solid ${C.border}`, background:'#fff', color: C.text,
  fontSize:13, outline:'none',
}
