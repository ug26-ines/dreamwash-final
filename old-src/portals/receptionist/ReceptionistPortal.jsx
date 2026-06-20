// src/portals/receptionist/ReceptionistPortal.jsx
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  collection, query, orderBy, onSnapshot, doc,
  updateDoc, addDoc, getDoc, setDoc, serverTimestamp, limit,
} from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../shared/AuthContext'

// ── Design tokens (navy palette — staff lives in the dark theme) ───────────────
const C = {
  navy:'#0c1f35', navy2:'#152d47', navy3:'#1e3a57', navy4:'#243f5c',
  cyan:'#00b8a0', cyan2:'#009b86', cdim:'rgba(0,184,160,.12)',
  amber:'#f59e0b', adim:'rgba(245,158,11,.12)',
  red:'#ef4444',  rdim:'rgba(239,68,68,.12)',
  green:'#22c55e',gdim:'rgba(34,197,94,.12)',
  border:'rgba(255,255,255,.09)', border2:'rgba(255,255,255,.15)',
  text:'#fff', text2:'rgba(255,255,255,.7)', text3:'rgba(255,255,255,.4)', text4:'rgba(255,255,255,.22)',
  surface:'rgba(255,255,255,.04)', sf2:'rgba(255,255,255,.07)',
}

// Rates receptionist uses (customer-facing only — never show margins or cost)
const RATES = { walkin:848, club:748, wd_factor:0.8, vat:0.18 }

const STATUS_ORDER  = ['Received','Washing','Drying','Pressing','Ready','Collected']
const STATUS_COLOR  = { Received:'#6366f1',Washing:'#8b5cf6',Drying:'#f59e0b',Pressing:'#06b6d4',Ready:'#22c55e',Collected:'#64748b' }
const CTYPE_LABEL   = { walkin:'Walk-in',club:'Club Member',b2b:'Business (B2B)',dispatcher:'Via Dispatcher' }
const SVC_LABEL     = { full:'Full Wash + Dry + Press', wd:'Wash & Dry Only' }
const CLOTHES_LIST  = [
  { id:'shirts',  icon:'👕', label:'Shirts' },
  { id:'jeans',   icon:'👖', label:'Jeans' },
  { id:'dresses', icon:'👗', label:'Dresses' },
  { id:'jackets', icon:'🧥', label:'Jackets' },
  { id:'sheets',  icon:'🛏',  label:'Sheets' },
  { id:'under',   icon:'🧦', label:'Underwear' },
]
const ADDONS = [
  { id:'ironing',  label:'Extra Ironing',   price:500 },
  { id:'stain',    label:'Stain Treatment', price:1000 },
  { id:'fragrance',label:'Fragrance Spray', price:300 },
  { id:'express',  label:'Express (3 hr)',  price:2000 },
]

const fmt = n => Number(n||0).toLocaleString('en-RW')
const rwPhone = p => /^07[2389]\d{7}$/.test(p.replace(/\s/g,''))

const BLANK_FORM = () => ({
  clientName:'', clientPhone:'', collName:'', collPhone:'',
  ctype:'walkin', svc:'full', weight:0, clothes:[], addons:{},
  payment:'momo', momoTx:'', notes:'', assigned:'Unassigned', memberId:'',
})

// ── Main Component ────────────────────────────────────────────────────────────
export default function ReceptionistPortal() {
  const { profile, logout } = useAuth()
  const [tab, setTab]     = useState('pos')
  const [orders, setOrders] = useState([])
  const [clients, setClients] = useState({})  // keyed by phone
  const [members, setMembers] = useState([])
  const [toast, setToast] = useState(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  const showToast = useCallback((msg, type = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  useEffect(() => {
    const on  = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online',  on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online',on); window.removeEventListener('offline',off) }
  }, [])

  useEffect(() => {
    const uO = onSnapshot(query(collection(db,'orders'), orderBy('createdAt','desc'), limit(200)),
      s => setOrders(s.docs.map(d => ({ id:d.id, ...d.data() }))), console.error)
    const uC = onSnapshot(collection(db,'clients'),
      s => { const m={}; s.docs.forEach(d => { const x=d.data(); m[x.phone]=x }); setClients(m) }, console.error)
    const uM = onSnapshot(query(collection(db,'members'), orderBy('name')),
      s => setMembers(s.docs.map(d => ({ id:d.id, ...d.data() }))), console.error)
    return () => { uO(); uC(); uM() }
  }, [])

  const tabs = [
    { id:'pos',      label:'New Order', icon:'➕' },
    { id:'pipeline', label:'Pipeline',  icon:'⚙️' },
    { id:'orders',   label:'Orders',    icon:'📋' },
    { id:'clients',  label:'Clients',   icon:'👥' },
    { id:'zreport',  label:'Z-Report',  icon:'📊' },
  ]

  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', background: C.navy, overflow:'hidden' }}>
      {/* Topbar */}
      <div style={{
        height:54, background: C.navy2, borderBottom:`1px solid ${C.border}`,
        display:'flex', alignItems:'center', padding:'0 18px', gap:14, flexShrink:0,
      }}>
        <div style={{
          width:30, height:30, borderRadius:7, background: C.cyan,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:"'IBM Plex Mono',monospace", fontSize:10, fontWeight:700, color: C.navy,
        }}>DW</div>
        <div style={{ fontWeight:600, fontSize:13, color:C.text, marginRight:'auto' }}>
          POS · {profile?.name || 'Receptionist'}
        </div>
        {/* Online indicator */}
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background: isOnline ? C.green : C.red }} />
          <span style={{ fontSize:11, color: C.text3 }}>{isOnline ? 'Live' : 'Offline'}</span>
        </div>
        <button onClick={logout} style={{ padding:'5px 12px', borderRadius:7, border:`1px solid ${C.border}`, background:'transparent', color: C.text3, fontSize:11, cursor:'pointer' }}>
          Sign out
        </button>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', background: C.navy2, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding:'11px 20px', border:'none', background:'transparent',
            color: tab === t.id ? C.cyan : C.text3,
            fontWeight: tab === t.id ? 600 : 400, fontSize:13, cursor:'pointer',
            borderBottom: tab === t.id ? `2px solid ${C.cyan}` : '2px solid transparent',
            transition:'all .15s', display:'flex', alignItems:'center', gap:6,
          }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
        {/* Active order badge */}
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', paddingRight:16 }}>
          <span style={{ padding:'3px 10px', borderRadius:100, background: C.adim, color: C.amber, fontSize:11, fontWeight:700 }}>
            {orders.filter(o => o.status !== 'Collected').length} active
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex:1, overflow:'hidden', display:'flex' }}>
        {tab === 'pos'      && <POSForm clients={clients} members={members} showToast={showToast} profile={profile} />}
        {tab === 'pipeline' && <POSPipeline orders={orders} showToast={showToast} />}
        {tab === 'orders'   && <POSOrders orders={orders} showToast={showToast} />}
        {tab === 'clients'  && <ClientsTab clients={clients} members={members} showToast={showToast} />}
        {tab === 'zreport'  && <ZReport orders={orders} profile={profile} />}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)',
          background: toast.type==='ok' ? '#16a34a' : toast.type==='warn' ? C.amber : C.red,
          color:'#fff', padding:'11px 22px', borderRadius:10, fontSize:13, fontWeight:500,
          boxShadow:'0 8px 32px rgba(0,0,0,.4)', animation:'dw-slide-up .25s ease',
          zIndex:999, whiteSpace:'nowrap',
        }}>{toast.msg}</div>
      )}
    </div>
  )
}

// ── POS FORM ──────────────────────────────────────────────────────────────────
function POSForm({ clients, members, showToast, profile }) {
  const [F, setF] = useState(BLANK_FORM())
  const [preview, setPreview] = useState({ sub:0, vat:0, total:0 })
  const [busy, setBusy] = useState(false)
  const [returnHint, setReturnHint] = useState(null)
  const [memberHint, setMemberHint] = useState(null)
  const [selectedMember, setSelectedMember] = useState(null)
  const [showMemberList, setShowMemberList] = useState(false)

  // Recalculate totals whenever form changes
  useEffect(() => {
    const rate = F.ctype === 'club' ? RATES.club : RATES.walkin
    const factor = F.svc === 'wd' ? RATES.wd_factor : 1
    const kgSub  = parseFloat(F.weight||0) * rate * factor
    const addTotal = Object.entries(F.addons).filter(([,v])=>v).reduce((s,[k])=>{
      const a = ADDONS.find(x=>x.id===k); return s + (a?.price||0)
    }, 0)
    // NOTE: Receptionist sees the customer total only — not the rate breakdown or margins
    const sub   = Math.round(kgSub + addTotal)
    const vat   = Math.round(sub * RATES.vat)
    const total = sub + vat
    setPreview({ sub, vat, total })
  }, [F])

  const onPhoneChange = (phone) => {
    setF(f => ({ ...f, clientPhone: phone }))
    const p = phone.replace(/\s/g,'')
    if (clients[p]) {
      const c = clients[p]
      setReturnHint(c)
      setF(f => ({ ...f, clientName: c.name, collName: c.name, collPhone: p }))
    } else {
      setReturnHint(null)
    }
  }

  const onCtypeChange = (ct) => {
    setF(f => ({ ...f, ctype: ct }))
    setSelectedMember(null)
    setMemberHint(null)
    setShowMemberList(ct === 'club')
  }

  const pickMember = (m) => {
    setSelectedMember(m)
    setShowMemberList(false)
    setF(f => ({ ...f, clientName: m.name, clientPhone: m.phone, collName: m.name, collPhone: m.phone, memberId: m.id }))
    const rem = (m.limit||14) - (m.used||0)
    setMemberHint(rem)
  }

  const toggleCloth = (id) => {
    setF(f => ({
      ...f,
      clothes: f.clothes.includes(id) ? f.clothes.filter(c => c !== id) : [...f.clothes, id],
    }))
  }

  const toggleAddon = (id) => {
    setF(f => ({ ...f, addons: { ...f.addons, [id]: !f.addons[id] } }))
  }

  const setWeight = (w) => setF(f => ({ ...f, weight: parseFloat(w)||0 }))

  const validate = () => {
    if (!F.clientName.trim())  return 'Client name is required.'
    if (!F.clientPhone.trim()) return 'Client phone is required.'
    if (!rwPhone(F.clientPhone)) return 'Enter a valid Rwandan phone (07x xxx xxxx).'
    if (!F.weight || F.weight <= 0) return 'Weight must be greater than 0.'
    if (F.weight > 100) return 'Weight over 100 kg — please verify.'
    if (F.payment === 'momo' && !F.momoTx.trim()) return 'MoMo Transaction ID is required.'
    if (F.ctype === 'club' && !selectedMember) return 'Please select a club member.'
    return null
  }

  const submit = async (e) => {
    e.preventDefault()
    const err = validate()
    if (err) { showToast(err, 'err'); return }

    setBusy(true)
    try {
      const now = serverTimestamp()
      const orderData = {
        clientName:  F.clientName.trim(),
        clientPhone: F.clientPhone.replace(/\s/g,''),
        collName:    F.collName.trim() || F.clientName.trim(),
        collPhone:   F.collPhone.trim() || F.clientPhone.replace(/\s/g,''),
        ctype:    F.ctype,
        svc:      F.svc,
        clothes:  F.clothes,
        addonList: Object.keys(F.addons).filter(k=>F.addons[k]).join(', '),
        weight:   parseFloat(F.weight),
        // SECURITY: rate stored for audit but receptionist UI never displays it
        rate:     F.ctype === 'club' ? RATES.club : RATES.walkin,
        total:    preview.total,
        vat:      preview.vat,
        payment:  F.payment,
        momoTx:   F.momoTx.trim(),
        notes:    F.notes.trim(),
        assigned: F.assigned,
        memberId: F.memberId || null,
        status:   'Received',
        statusHistory: [{ status:'Received', time: new Date().toISOString() }],
        createdAt: now,
        updatedAt: now,
        clientId:  null,
      }

      const ref = await addDoc(collection(db,'orders'), orderData)

      // Update or create client record
      const phone = F.clientPhone.replace(/\s/g,'')
      const existing = clients[phone]
      await setDoc(doc(db,'clients',phone), {
        name:      F.clientName.trim(),
        phone,
        orders:    (existing?.orders||0) + 1,
        total:     (existing?.total||0)  + preview.total,
        lastVisit: now,
      }, { merge: true })

      // Decrement club member usage
      if (F.ctype === 'club' && selectedMember) {
        const newUsed = Math.min((selectedMember.used||0) + parseFloat(F.weight), selectedMember.limit||14)
        await updateDoc(doc(db,'members', selectedMember.id), { used: newUsed, updatedAt: now })
      }

      showToast(`Order #${ref.id.slice(-8)} submitted — ${fmt(preview.total)} RWF`)
      setF(BLANK_FORM())
      setSelectedMember(null)
      setReturnHint(null)
      setMemberHint(null)
    } catch (err) {
      console.error(err)
      showToast('Failed to submit order. Check connection.', 'err')
    }
    setBusy(false)
  }

  return (
    <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
      {/* ── Left: Form column ── */}
      <div style={{ width:400, borderRight:`1px solid ${C.border}`, display:'flex', flexDirection:'column', flexShrink:0 }}>
        <div style={{ flex:1, overflowY:'auto', padding:18 }}>
          <form id="pos-form" onSubmit={submit}>
            {/* Client info */}
            <Section title="Client">
              <Field label="Phone Number">
                <Inp value={F.clientPhone}
                  onChange={e => onPhoneChange(e.target.value)}
                  placeholder="0780 000 000" type="tel" />
                {returnHint && (
                  <div style={{ marginTop:6, padding:'7px 11px', background: C.cdim, borderRadius:7, fontSize:12, color: C.cyan }}>
                    👤 Returning: <strong>{returnHint.name}</strong> · {returnHint.orders} orders
                  </div>
                )}
              </Field>
              <Field label="Client Name">
                <Inp value={F.clientName} onChange={e => setF(f=>({...f,clientName:e.target.value}))} placeholder="Full name" />
              </Field>
              <div style={{ height:1, background: C.border, margin:'10px 0' }} />
              <Field label="Collector Phone (if different)">
                <Inp value={F.collPhone} onChange={e => setF(f=>({...f,collPhone:e.target.value}))} placeholder="Same as client" />
              </Field>
              <Field label="Collector Name">
                <Inp value={F.collName} onChange={e => setF(f=>({...f,collName:e.target.value}))} placeholder="Who will collect?" />
              </Field>
            </Section>

            {/* Customer type */}
            <Section title="Customer Type">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                {Object.entries(CTYPE_LABEL).map(([k,v]) => (
                  <Pill key={k} active={F.ctype===k} onClick={()=>onCtypeChange(k)}>{v}</Pill>
                ))}
              </div>
              {/* Club member selector */}
              {F.ctype === 'club' && (
                <div style={{ marginTop:10 }}>
                  {selectedMember
                    ? (
                      <div style={{ background: C.cdim, borderRadius:8, padding:'8px 12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <div>
                          <div style={{ fontWeight:600, fontSize:13, color: C.cyan }}>{selectedMember.name}</div>
                          <div style={{ fontSize:11, color: C.text3 }}>
                            {selectedMember.id} · {(selectedMember.limit||14)-(selectedMember.used||0)} kg remaining
                          </div>
                        </div>
                        <button type="button" onClick={()=>{setSelectedMember(null);setShowMemberList(true)}}
                          style={{ padding:'3px 9px', borderRadius:6, border:`1px solid ${C.border2}`, background:'transparent', color: C.text3, fontSize:11, cursor:'pointer' }}>
                          Change
                        </button>
                      </div>
                    )
                    : (
                      <div>
                        <div style={{ marginBottom:6, fontSize:11, color: C.text3 }}>Select club member:</div>
                        <div style={{ maxHeight:160, overflowY:'auto', display:'flex', flexDirection:'column', gap:5 }}>
                          {members.map(m => {
                            const rem = (m.limit||14)-(m.used||0)
                            const cls = rem>0 ? (rem/(m.limit||14) > .3 ? C.cyan : C.amber) : C.red
                            return (
                              <div key={m.id} onClick={()=>pickMember(m)} style={{
                                padding:'8px 12px', borderRadius:7, background: C.sf2,
                                border:`1px solid ${C.border}`, cursor:'pointer', display:'flex', justifyContent:'space-between',
                              }}>
                                <span style={{ fontSize:13, color: C.text }}>{m.name}</span>
                                <span style={{ fontSize:11, color: cls }}>{rem} kg left</span>
                              </div>
                            )
                          })}
                          {members.length === 0 && <div style={{ color: C.text3, fontSize:12, padding:8 }}>No members found</div>}
                        </div>
                      </div>
                    )
                  }
                </div>
              )}
            </Section>

            {/* Service */}
            <Section title="Service">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                {Object.entries(SVC_LABEL).map(([k,v]) => (
                  <Pill key={k} active={F.svc===k} onClick={()=>setF(f=>({...f,svc:k}))}>{v}</Pill>
                ))}
              </div>
            </Section>

            {/* Weight */}
            <Section title="Weight">
              <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
                <input type="number" value={F.weight||''} onChange={e=>setWeight(e.target.value)}
                  min={0} max={200} step={0.1} placeholder="0.0"
                  style={{ ...inpStyle, flex:1, fontSize:22, fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, textAlign:'center', padding:'10px' }} />
                <span style={{ color: C.text3, fontSize:13 }}>kg</span>
              </div>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                {[1,2,3,5,7,10,15,20].map(w => (
                  <button key={w} type="button" onClick={()=>setWeight(w)} style={{
                    padding:'5px 10px', borderRadius:6, border:`1px solid ${C.border}`,
                    background: F.weight===w ? C.cdim : 'transparent',
                    color: F.weight===w ? C.cyan : C.text3, fontSize:12, cursor:'pointer',
                  }}>{w} kg</button>
                ))}
              </div>
            </Section>

            {/* Clothes */}
            <Section title="Clothing Types">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:5 }}>
                {CLOTHES_LIST.map(c => (
                  <button key={c.id} type="button" onClick={()=>toggleCloth(c.id)} style={{
                    padding:'7px 6px', borderRadius:7, border:`1.5px solid ${F.clothes.includes(c.id) ? C.cyan : C.border}`,
                    background: F.clothes.includes(c.id) ? C.cdim : 'transparent',
                    color: F.clothes.includes(c.id) ? C.cyan : C.text3,
                    cursor:'pointer', fontSize:11, display:'flex', flexDirection:'column', alignItems:'center', gap:3,
                  }}>
                    <span style={{ fontSize:16 }}>{c.icon}</span>
                    {c.label}
                  </button>
                ))}
              </div>
            </Section>

            {/* Add-ons */}
            <Section title="Add-ons">
              {ADDONS.map(a => (
                <div key={a.id} onClick={()=>toggleAddon(a.id)} style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'9px 11px', borderRadius:7, border:`1.5px solid ${F.addons[a.id] ? C.cyan : C.border}`,
                  background: F.addons[a.id] ? C.cdim : 'transparent',
                  cursor:'pointer', marginBottom:5, transition:'all .15s',
                }}>
                  <span style={{ fontSize:13, color: F.addons[a.id] ? C.cyan : C.text2 }}>{a.label}</span>
                  <span style={{ fontSize:12, color: C.text3 }}>+{fmt(a.price)} RWF</span>
                </div>
              ))}
            </Section>

            {/* Assignment & payment */}
            <Section title="Assignment & Payment">
              <Field label="Assign to staff">
                <select value={F.assigned} onChange={e=>setF(f=>({...f,assigned:e.target.value}))} style={inpStyle}>
                  {['Unassigned','Claudine','Aline','Fidèle','Emmanuel','Esperance'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="Payment Method">
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                  <Pill active={F.payment==='momo'} onClick={()=>setF(f=>({...f,payment:'momo'}))}>📱 MTN MoMo</Pill>
                  <Pill active={F.payment==='cash'} onClick={()=>setF(f=>({...f,payment:'cash'}))}>💵 Cash</Pill>
                </div>
              </Field>
              {F.payment === 'momo' && (
                <Field label="MoMo Transaction ID">
                  <Inp value={F.momoTx} onChange={e=>setF(f=>({...f,momoTx:e.target.value}))}
                    placeholder="e.g. 1234567890" style={{ fontFamily:"'IBM Plex Mono',monospace" }} />
                </Field>
              )}
              <Field label="Notes (optional)">
                <textarea value={F.notes} onChange={e=>setF(f=>({...f,notes:e.target.value}))}
                  placeholder="Special instructions…" rows={2}
                  style={{ ...inpStyle, resize:'vertical', lineHeight:1.5 }} />
              </Field>
            </Section>
          </form>
        </div>

        {/* ── Sticky footer: total + submit ── */}
        <div style={{
          flexShrink:0, borderTop:`1px solid ${C.border}`, padding:16,
          background: C.navy2,
        }}>
          {/* Total — receptionist sees the customer total, not the rate breakdown */}
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
            <span style={{ fontSize:12, color: C.text3 }}>Subtotal (incl. add-ons)</span>
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:13, color: C.text2 }}>{fmt(preview.sub)} RWF</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
            <span style={{ fontSize:12, color: C.text3 }}>VAT 18%</span>
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:13, color: C.text2 }}>{fmt(preview.vat)} RWF</span>
          </div>
          <div style={{
            display:'flex', justifyContent:'space-between', alignItems:'center',
            padding:'12px 14px', background: C.cdim, borderRadius:10, marginBottom:14,
            border:`1px solid ${C.cyan}33`,
          }}>
            <span style={{ fontWeight:700, fontSize:13, color: C.cyan }}>TOTAL TO COLLECT</span>
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:22, fontWeight:700, color: C.cyan }}>
              {fmt(preview.total)} RWF
            </span>
          </div>
          <button form="pos-form" type="submit" disabled={busy} style={{
            width:'100%', padding:'13px', borderRadius:10, border:'none',
            background: busy ? 'rgba(0,184,160,.4)' : C.cyan,
            color: C.navy, fontWeight:800, fontSize:15, cursor: busy ? 'not-allowed' : 'pointer',
            letterSpacing:'.01em', transition:'background .15s',
          }}>
            {busy ? 'Submitting…' : '✓ Process Order'}
          </button>
        </div>
      </div>

      {/* ── Right: Live preview ── */}
      <div style={{ flex:1, overflowY:'auto', padding:22 }}>
        <div style={{ marginBottom:16, fontSize:13, fontWeight:600, color: C.text2 }}>Live Order Summary</div>
        <div style={{ background: C.navy2, borderRadius:12, padding:18, border:`1px solid ${C.border}`, marginBottom:16 }}>
          <Row k="Client"      v={F.clientName||'—'} />
          <Row k="Phone"       v={F.clientPhone||'—'} mono />
          <Row k="Collector"   v={F.collName||'—'} />
          <Row k="Type"        v={CTYPE_LABEL[F.ctype]} />
          <Row k="Service"     v={SVC_LABEL[F.svc]} />
          <Row k="Weight"      v={F.weight ? `${F.weight} kg` : '—'} mono />
          <Row k="Clothing"    v={F.clothes.length ? F.clothes.join(', ') : '—'} />
          <Row k="Add-ons"     v={Object.keys(F.addons).filter(k=>F.addons[k]).map(k=>ADDONS.find(a=>a.id===k)?.label).join(', ')||'None'} />
          <Row k="Payment"     v={F.payment==='momo'?'MTN MoMo':'Cash'} />
          {F.payment==='momo'&&F.momoTx&&<Row k="TX ID" v={F.momoTx} mono />}
          {F.notes && <Row k="Notes" v={F.notes} />}
          <Row k="Assigned"    v={F.assigned} />
        </div>

        {/* Recent 5 orders so receptionist can quickly check */}
        <div style={{ fontSize:12, fontWeight:600, color: C.text3, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:10 }}>
          Recent orders
        </div>
      </div>
    </div>
  )
}

// ── PIPELINE VIEW ─────────────────────────────────────────────────────────────
function POSPipeline({ orders, showToast }) {
  const active = orders.filter(o => o.status !== 'Collected')

  const advance = async (o) => {
    const idx = STATUS_ORDER.indexOf(o.status)
    if (idx < 0 || idx >= STATUS_ORDER.length - 1) return
    const next = STATUS_ORDER[idx + 1]
    try {
      await updateDoc(doc(db,'orders',o.id), {
        status: next,
        statusHistory: [...(o.statusHistory||[]), { status:next, time:new Date().toISOString() }],
        updatedAt: serverTimestamp(),
      })
      showToast(`Moved to ${next}`)
    } catch { showToast('Update failed — check connection', 'err') }
  }

  return (
    <div style={{ flex:1, overflowX:'auto', padding:20, display:'flex', gap:12, alignItems:'flex-start' }}>
      {STATUS_ORDER.slice(0,-1).map(st => {
        const stO = active.filter(o => o.status === st)
        return (
          <div key={st} style={{ flexShrink:0, width:200 }}>
            <div style={{
              padding:'7px 12px', borderRadius:'8px 8px 0 0',
              background:`${STATUS_COLOR[st]}22`, borderBottom:`2px solid ${STATUS_COLOR[st]}`,
              display:'flex', justifyContent:'space-between',
            }}>
              <span style={{ fontSize:11, fontWeight:700, color: STATUS_COLOR[st], textTransform:'uppercase', letterSpacing:'.07em' }}>{st}</span>
              <span style={{ fontSize:11, background: STATUS_COLOR[st], color:'#fff', borderRadius:100, padding:'1px 6px', fontWeight:700 }}>{stO.length}</span>
            </div>
            <div style={{ background: C.navy3, borderRadius:'0 0 8px 8px', border:`1px solid ${C.border}`, borderTop:'none', minHeight:60, padding:8, display:'flex', flexDirection:'column', gap:7 }}>
              {stO.length === 0
                ? <div style={{ padding:12, textAlign:'center', fontSize:11, color: C.text4 }}>Empty</div>
                : stO.map(o => (
                  <div key={o.id} style={{ background: C.navy4, borderRadius:8, padding:'10px 11px', border:`1px solid ${C.border}` }}>
                    <div style={{ fontWeight:600, fontSize:13, color: C.text, marginBottom:2 }}>{o.clientName}</div>
                    <div style={{ fontSize:11, color: C.text3, marginBottom:8 }}>{o.weight} kg · {o.svc==='full'?'Full':'W&D'}</div>
                    {/* NOTE: Total shown to receptionist — not rate/margin */}
                    <div style={{ fontSize:11, color: C.cyan, fontFamily:"'IBM Plex Mono',monospace", marginBottom:8 }}>
                      {fmt(o.total)} RWF
                    </div>
                    {st !== 'Ready' ? (
                      <button onClick={()=>advance(o)} style={{
                        width:'100%', padding:'5px', borderRadius:6, border:'none',
                        background: STATUS_COLOR[STATUS_ORDER[STATUS_ORDER.indexOf(st)+1]],
                        color:'#fff', fontSize:11, fontWeight:600, cursor:'pointer',
                      }}>→ {STATUS_ORDER[STATUS_ORDER.indexOf(st)+1]}</button>
                    ) : (
                      <button onClick={()=>advance(o)} style={{
                        width:'100%', padding:'5px', borderRadius:6, border:'none',
                        background: C.green, color:'#fff', fontSize:11, fontWeight:600, cursor:'pointer',
                      }}>✓ Mark Collected</button>
                    )}
                  </div>
                ))
              }
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── ORDERS LIST (POS view — no rate/margin columns) ───────────────────────────
function POSOrders({ orders, showToast }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('active')

  const list = orders.filter(o => {
    const matchStatus = filter === 'all' || (filter === 'active' ? o.status !== 'Collected' : o.status === filter)
    const q = search.toLowerCase()
    return matchStatus && (!q || o.clientName?.toLowerCase().includes(q) || o.clientPhone?.includes(q))
  })

  const advance = async (o) => {
    const idx = STATUS_ORDER.indexOf(o.status)
    if (idx >= STATUS_ORDER.length - 1) return
    const next = STATUS_ORDER[idx + 1]
    await updateDoc(doc(db,'orders',o.id), {
      status:next, statusHistory:[...(o.statusHistory||[]),{status:next,time:new Date().toISOString()}], updatedAt:serverTimestamp()
    })
    showToast(`Moved to ${next}`)
  }

  return (
    <div style={{ flex:1, overflowY:'auto', padding:20 }}>
      <div style={{ display:'flex', gap:10, marginBottom:18, flexWrap:'wrap', alignItems:'center' }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search client or phone…"
          style={{ ...inpStyle, width:220, padding:'8px 12px', fontSize:13 }} />
        <select value={filter} onChange={e=>setFilter(e.target.value)} style={{ ...inpStyle, padding:'8px 12px', fontSize:13 }}>
          <option value="active">Active orders</option>
          <option value="all">All orders</option>
          {STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{ fontSize:12, color: C.text3, marginLeft:'auto' }}>{list.length} orders</span>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {list.length === 0
          ? <div style={{ padding:40, textAlign:'center', color: C.text3 }}>No orders found</div>
          : list.map(o => (
            <div key={o.id} style={{ background: C.navy2, borderRadius:10, padding:14, border:`1px solid ${C.border}`, display:'flex', gap:14, alignItems:'center' }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:4 }}>
                  <span style={{ fontWeight:600, fontSize:14, color: C.text }}>{o.clientName}</span>
                  <span style={{ fontSize:11, fontFamily:"'IBM Plex Mono',monospace", color: C.text3 }}>{o.clientPhone}</span>
                </div>
                <div style={{ fontSize:12, color: C.text3 }}>
                  {o.weight} kg · {o.svc==='full'?'Full Wash':'Wash & Dry'} · {o.payment==='momo'?'MoMo':'Cash'}
                </div>
              </div>
              {/* Receptionist sees total only — not rate per kg */}
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:14, fontWeight:700, color: C.cyan, flexShrink:0 }}>
                {fmt(o.total)} RWF
              </div>
              <div style={{ flexShrink:0 }}>
                <span style={{ padding:'4px 10px', borderRadius:100, fontSize:11, fontWeight:600, background:`${STATUS_COLOR[o.status]}22`, color: STATUS_COLOR[o.status] }}>
                  {o.status}
                </span>
              </div>
              {o.status !== 'Collected' && (
                <button onClick={()=>advance(o)} style={{
                  padding:'6px 12px', borderRadius:7, border:`1px solid ${C.border2}`,
                  background:'transparent', color: C.text2, fontSize:12, cursor:'pointer', flexShrink:0,
                }}>→</button>
              )}
            </div>
          ))
        }
      </div>
    </div>
  )
}

// ── Z-REPORT ─────────────────────────────────────────────────────────────────
function ZReport({ orders, profile }) {
  const hr    = new Date().getHours()
  const shift = hr < 12 ? 'Morning' : hr < 17 ? 'Afternoon' : 'Evening'
  const todayStr = new Date().toDateString()
  const todayOrders = orders.filter(o => o.createdAt?.toDate && o.createdAt.toDate().toDateString() === todayStr)

  const cash  = todayOrders.filter(o=>o.payment==='cash').reduce((s,o)=>s+(o.total||0),0)
  const momo  = todayOrders.filter(o=>o.payment==='momo').reduce((s,o)=>s+(o.total||0),0)
  const kg    = todayOrders.reduce((s,o)=>s+(o.weight||0),0)
  const total = cash + momo

  const WA = '250780000000'
  const sendWA = () => {
    const msg = [
      `DREAM WASH — Z-Report`,
      `Staff: ${profile?.name||'Receptionist'}`,
      `Shift: ${shift}`,
      `Date: ${new Date().toLocaleDateString('en-RW')}`,
      ``,
      `Cash collected:  ${fmt(cash)} RWF`,
      `MoMo collected:  ${fmt(momo)} RWF`,
      `Kg processed:    ${kg.toFixed(1)} kg`,
      `Transactions:    ${todayOrders.length}`,
      ``,
      `SHIFT TOTAL: ${fmt(total)} RWF`,
      ``,
      `Sent from Dream Wash POS.`,
    ].join('\n')
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div style={{ flex:1, overflowY:'auto', padding:28 }}>
      <h2 style={{ fontSize:20, fontWeight:700, color: C.text, marginBottom:6 }}>Z-Report</h2>
      <div style={{ fontSize:13, color: C.text3, marginBottom:28 }}>{shift} shift · {new Date().toLocaleDateString('en-RW')}</div>

      {/* Summary — shows revenue totals only, no margins */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:24, maxWidth:500 }}>
        {[
          { label:'Cash Collected',  value:`${fmt(cash)} RWF`,           icon:'💵' },
          { label:'MoMo Collected',  value:`${fmt(momo)} RWF`,           icon:'📱' },
          { label:'Total Revenue',   value:`${fmt(total)} RWF`,          icon:'💰' },
          { label:'Kg Processed',    value:`${kg.toFixed(1)} kg`,        icon:'⚖️' },
          { label:'Transactions',    value: todayOrders.length,           icon:'📦' },
          { label:'Avg Order',       value: todayOrders.length ? `${fmt(Math.round(total/todayOrders.length))} RWF` : '—', icon:'📊' },
        ].map(c => (
          <div key={c.label} style={{ background: C.navy2, borderRadius:12, padding:16, border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:18, marginBottom:6 }}>{c.icon}</div>
            <div style={{ fontSize:11, color: C.text3, textTransform:'uppercase', letterSpacing:'.07em', marginBottom:4 }}>{c.label}</div>
            <div style={{ fontSize:18, fontWeight:700, color: C.cyan, fontFamily:"'IBM Plex Mono',monospace" }}>{c.value}</div>
          </div>
        ))}
      </div>

      <button onClick={sendWA} style={{
        padding:'12px 24px', borderRadius:10, border:'none',
        background:'#25D366', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer',
        display:'flex', alignItems:'center', gap:8,
      }}>
        📲 Send Z-Report to Manager via WhatsApp
      </button>

      {/* Today's transactions */}
      <div style={{ marginTop:28 }}>
        <div style={{ fontSize:12, fontWeight:600, color: C.text3, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:12 }}>
          Today's Transactions ({todayOrders.length})
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {todayOrders.map((o,i) => (
            <div key={o.id} style={{ display:'flex', gap:12, background: C.navy2, borderRadius:8, padding:'9px 14px', border:`1px solid ${C.border}`, fontSize:12 }}>
              <span style={{ color: C.text3, minWidth:20 }}>{i+1}</span>
              <span style={{ flex:1, color: C.text }}>{o.clientName}</span>
              <span style={{ color: C.text3 }}>{o.weight} kg</span>
              <span style={{ color: C.text2 }}>{o.payment==='momo'?'MoMo':'Cash'}</span>
              {/* Z-report shows total only — no rate per kg */}
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:600, color: C.cyan }}>{fmt(o.total)} RWF</span>
            </div>
          ))}
          {todayOrders.length === 0 && (
            <div style={{ padding:24, textAlign:'center', color: C.text3 }}>No orders today</div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── CLIENTS TAB ───────────────────────────────────────────────────────────────
// Receptionist can:
//   • Register a new walk-in client (name + phone → clients collection)
//   • Enroll a new 10k Club subscriber (name + phone + payment → members collection)
//   • Search and view existing clients and current members
function ClientsTab({ clients, members, showToast }) {
  const [view, setView]       = useState('list')   // 'list' | 'reg-client' | 'reg-member'
  const [search, setSearch]   = useState('')

  const clientList = Object.values(clients).filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
  )

  return (
    <div style={{ flex:1, overflowY:'auto', padding:20 }}>
      {/* Sub-nav */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ display:'flex', gap:6 }}>
          <SubBtn active={view==='list'}       onClick={()=>setView('list')}>📋 Directory</SubBtn>
          <SubBtn active={view==='reg-client'} onClick={()=>setView('reg-client')}>➕ Register Walk-in</SubBtn>
          <SubBtn active={view==='reg-member'} onClick={()=>setView('reg-member')}>👑 Enroll Subscriber</SubBtn>
        </div>
        {view === 'list' && (
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search name or phone…"
            style={{ ...inpStyle, width:220, marginLeft:'auto', padding:'7px 11px', fontSize:12 }} />
        )}
      </div>

      {/* ── Directory ── */}
      {view === 'list' && (
        <div>
          {/* Members section */}
          <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', color: C.text4, marginBottom:10 }}>
            10k Club Members ({members.length})
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:24 }}>
            {members.length === 0
              ? <EmptyNote>No subscribers yet. Use "Enroll Subscriber" to add one.</EmptyNote>
              : members.filter(m => !search || m.name?.toLowerCase().includes(search.toLowerCase()) || m.phone?.includes(search)).map(m => {
                  const pct = Math.round(((m.used||0)/(m.limit||14))*100)
                  const barColor = pct < 70 ? C.cyan : pct < 100 ? C.amber : C.red
                  const rem = (m.limit||14)-(m.used||0)
                  return (
                    <div key={m.id} style={{ background: C.navy2, borderRadius:10, padding:14, border:`1px solid ${C.border}` }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                        <div>
                          <div style={{ fontWeight:600, fontSize:13, color: C.text }}>{m.name}</div>
                          <div style={{ fontSize:11, fontFamily:"'IBM Plex Mono',monospace", color: C.text3 }}>{m.phone}</div>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <div style={{ fontSize:11, color: barColor, fontWeight:600 }}>{rem > 0 ? `${rem} kg left` : 'Limit reached'}</div>
                          <div style={{ fontSize:10, color: C.text4 }}>
                            {m.planEndDate?.toDate ? `Renews ${m.planEndDate.toDate().toLocaleDateString('en-RW')}` : '—'}
                          </div>
                        </div>
                      </div>
                      {/* Usage bar */}
                      <div style={{ height:5, background:'rgba(255,255,255,.08)', borderRadius:3, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${Math.min(pct,100)}%`, background: barColor, borderRadius:3 }} />
                      </div>
                      <div style={{ fontSize:10, color: C.text4, marginTop:4 }}>{m.used||0} / {m.limit||14} kg used</div>
                    </div>
                  )
                })
            }
          </div>

          {/* Walk-in clients section */}
          <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', color: C.text4, marginBottom:10 }}>
            Walk-in Clients ({clientList.length})
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {clientList.length === 0
              ? <EmptyNote>No clients yet. Clients are added automatically when their first order is processed.</EmptyNote>
              : clientList.map(c => (
                <div key={c.phone} style={{ background: C.navy2, borderRadius:10, padding:'11px 14px', border:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:13, color: C.text }}>{c.name}</div>
                    <div style={{ fontSize:11, fontFamily:"'IBM Plex Mono',monospace", color: C.text3 }}>{c.phone}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:12, color: C.text2 }}>{c.orders||0} orders</div>
                    <div style={{ fontSize:11, color: C.text3 }}>Last: {c.lastVisit?.toDate ? c.lastVisit.toDate().toLocaleDateString('en-RW') : '—'}</div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* ── Register Walk-in Client ── */}
      {view === 'reg-client' && (
        <RegisterClientForm showToast={showToast} onDone={()=>setView('list')} existingClients={clients} />
      )}

      {/* ── Enroll 10k Club Subscriber ── */}
      {view === 'reg-member' && (
        <EnrollMemberForm showToast={showToast} onDone={()=>setView('list')} existingClients={clients} existingMembers={members} />
      )}
    </div>
  )
}

// ── Register Walk-in Client Form ──────────────────────────────────────────────
function RegisterClientForm({ showToast, onDone, existingClients }) {
  const BLANK = { name:'', phone:'' }
  const [F, setF]     = useState(BLANK)
  const [busy, setBusy] = useState(false)
  const [dup, setDup]   = useState(null)   // existing client on same phone

  const onPhone = (phone) => {
    setF(f => ({...f, phone}))
    const p = phone.replace(/\s/g,'')
    const ex = existingClients[p]
    setDup(ex || null)
    if (ex) setF(f => ({...f, phone, name: ex.name}))
  }

  const submit = async (e) => {
    e.preventDefault()
    const phone = F.phone.replace(/\s/g,'')
    if (!F.name.trim()) { showToast('Name is required', 'err'); return }
    if (!rwPhone(phone)) { showToast('Enter a valid Rwandan phone: 07x xxx xxxx', 'err'); return }

    setBusy(true)
    try {
      await setDoc(doc(db, 'clients', phone), {
        name:      F.name.trim(),
        phone,
        orders:    existingClients[phone]?.orders || 0,
        total:     existingClients[phone]?.total  || 0,
        lastVisit: existingClients[phone]?.lastVisit || serverTimestamp(),
        registeredAt: serverTimestamp(),
      }, { merge: true })
      showToast(`Client "${F.name.trim()}" registered ✓`)
      setF(BLANK)
      setDup(null)
      onDone()
    } catch (err) {
      showToast('Failed to register client. Check connection.', 'err')
      console.error(err)
    }
    setBusy(false)
  }

  return (
    <div style={{ maxWidth:420 }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:16, fontWeight:700, color: C.text, marginBottom:4 }}>Register Walk-in Client</div>
        <div style={{ fontSize:12, color: C.text3 }}>Creates a client profile. No order required.</div>
      </div>

      <form onSubmit={submit}>
        <Field label="Phone Number">
          <Inp value={F.phone} onChange={e=>onPhone(e.target.value)} placeholder="0780 000 000" type="tel" />
          {dup && (
            <div style={{ marginTop:6, padding:'8px 11px', background: C.adim, borderRadius:7, fontSize:12, color: C.amber }}>
              ⚠️ This phone is already registered as <strong>{dup.name}</strong> ({dup.orders||0} orders).
              Saving will update their name.
            </div>
          )}
        </Field>

        <Field label="Full Name">
          <Inp value={F.name} onChange={e=>setF(f=>({...f,name:e.target.value}))} placeholder="Full name" />
        </Field>

        <div style={{ display:'flex', gap:10, marginTop:20 }}>
          <button type="button" onClick={onDone} style={{ flex:1, padding:'11px', borderRadius:9, border:`1px solid ${C.border}`, background:'transparent', color: C.text3, fontSize:13, cursor:'pointer' }}>
            Cancel
          </button>
          <button type="submit" disabled={busy} style={{ flex:2, padding:'11px', borderRadius:9, border:'none', background: busy ? 'rgba(0,184,160,.4)' : C.cyan, color: C.navy, fontWeight:700, fontSize:13, cursor: busy ? 'not-allowed' : 'pointer' }}>
            {busy ? 'Saving…' : '✓ Register Client'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Enroll 10k Club Member Form ───────────────────────────────────────────────
const CLUB_FEE = 10000   // RWF — receptionist sees this as customer price only
const CLUB_KG  = 14      // kg per month

function EnrollMemberForm({ showToast, onDone, existingClients, existingMembers }) {
  const BLANK = { name:'', phone:'', payment:'momo', momoTx:'', months:1 }
  const [F, setF]       = useState(BLANK)
  const [busy, setBusy]   = useState(false)
  const [dupMember, setDupMember] = useState(null)
  const [existClient, setExistClient] = useState(null)

  const onPhone = (phone) => {
    setF(f => ({...f, phone}))
    const p = phone.replace(/\s/g,'')
    const ec = existingClients[p]
    const em = existingMembers.find(m => m.phone === p)
    setExistClient(ec || null)
    setDupMember(em || null)
    if (ec) setF(f => ({...f, phone, name: ec.name}))
  }

  const submit = async (e) => {
    e.preventDefault()
    const phone = F.phone.replace(/\s/g,'')

    if (!F.name.trim())  { showToast('Name is required', 'err'); return }
    if (!rwPhone(phone)) { showToast('Enter a valid Rwandan phone: 07x xxx xxxx', 'err'); return }
    if (F.payment === 'momo' && !F.momoTx.trim()) { showToast('MoMo Transaction ID is required', 'err'); return }
    if (dupMember && dupMember.status === 'active') {
      showToast(`${dupMember.name} already has an active subscription`, 'err'); return
    }

    setBusy(true)
    try {
      const now       = new Date()
      const planStart = now
      const planEnd   = new Date(now)
      planEnd.setDate(planEnd.getDate() + (30 * parseInt(F.months)))

      const memberData = {
        name:         F.name.trim(),
        phone,
        limit:        CLUB_KG,
        used:         0,
        status:       'active',
        planStartDate: planStart,
        planEndDate:   planEnd,
        fee:          CLUB_FEE * parseInt(F.months),
        months:       parseInt(F.months),
        payment:      F.payment,
        momoTx:       F.momoTx.trim(),
        enrolledAt:   serverTimestamp(),
        enrolledBy:   'receptionist',
        renewals:     dupMember ? (dupMember.renewals||0) + 1 : 0,
      }

      // Write or overwrite the member document
      if (dupMember) {
        await updateDoc(doc(db, 'members', dupMember.id), memberData)
      } else {
        await addDoc(collection(db, 'members'), memberData)
      }

      // Ensure client profile exists
      await setDoc(doc(db, 'clients', phone), {
        name:  F.name.trim(),
        phone,
        orders:    existingClients[phone]?.orders || 0,
        total:     existingClients[phone]?.total  || 0,
        lastVisit: existingClients[phone]?.lastVisit || serverTimestamp(),
        isMember:  true,
      }, { merge: true })

      const action = dupMember ? 'renewed' : 'enrolled'
      showToast(`${F.name.trim()} ${action} in 10k Club ✓ · Plan ends ${planEnd.toLocaleDateString('en-RW')}`)
      setF(BLANK)
      setDupMember(null)
      setExistClient(null)
      onDone()
    } catch (err) {
      showToast('Failed to enroll member. Check connection.', 'err')
      console.error(err)
    }
    setBusy(false)
  }

  const totalFee = CLUB_FEE * parseInt(F.months || 1)

  return (
    <div style={{ maxWidth:440 }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:16, fontWeight:700, color: C.text, marginBottom:4 }}>Enroll 10k Club Subscriber</div>
        <div style={{ fontSize:12, color: C.text3 }}>
          {CLUB_KG} kg / month · {CLUB_FEE.toLocaleString('en-RW')} RWF/month · Priority service
        </div>
      </div>

      <form onSubmit={submit}>
        <Field label="Client Phone">
          <Inp value={F.phone} onChange={e=>onPhone(e.target.value)} placeholder="0780 000 000" type="tel" />
          {existClient && !dupMember && (
            <div style={{ marginTop:6, padding:'7px 11px', background: C.cdim, borderRadius:7, fontSize:12, color: C.cyan }}>
              👤 Existing client: <strong>{existClient.name}</strong>
            </div>
          )}
          {dupMember && (
            <div style={{ marginTop:6, padding:'7px 11px', background: dupMember.status==='active' ? C.rdim : C.adim, borderRadius:7, fontSize:12, color: dupMember.status==='active' ? C.red : C.amber }}>
              {dupMember.status === 'active'
                ? `⛔ Already an active member. Expires ${dupMember.planEndDate?.toDate ? dupMember.planEndDate.toDate().toLocaleDateString('en-RW') : '—'}`
                : `🔄 Expired member — this will renew their subscription.`}
            </div>
          )}
        </Field>

        <Field label="Full Name">
          <Inp value={F.name} onChange={e=>setF(f=>({...f,name:e.target.value}))} placeholder="Full name" />
        </Field>

        {/* Subscription duration */}
        <Field label="Subscription Duration">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6 }}>
            {[1, 2, 3].map(m => (
              <button key={m} type="button" onClick={()=>setF(f=>({...f,months:m}))} style={{
                padding:'9px 6px', borderRadius:8,
                border:`1.5px solid ${F.months===m ? C.cyan : C.border}`,
                background: F.months===m ? C.cdim : 'transparent',
                color: F.months===m ? C.cyan : C.text3,
                fontSize:12, fontWeight: F.months===m ? 700 : 400, cursor:'pointer',
                textAlign:'center',
              }}>
                <div>{m} Month{m>1?'s':''}</div>
                <div style={{ fontSize:10, marginTop:2 }}>{(CLUB_FEE*m).toLocaleString('en-RW')} RWF</div>
              </button>
            ))}
          </div>
        </Field>

        {/* Payment */}
        <Field label="Payment Method">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
            <Pill active={F.payment==='momo'} onClick={()=>setF(f=>({...f,payment:'momo'}))}>📱 MTN MoMo</Pill>
            <Pill active={F.payment==='cash'} onClick={()=>setF(f=>({...f,payment:'cash'}))}>💵 Cash</Pill>
          </div>
        </Field>

        {F.payment === 'momo' && (
          <Field label="MoMo Transaction ID">
            <Inp value={F.momoTx} onChange={e=>setF(f=>({...f,momoTx:e.target.value}))}
              placeholder="e.g. 1234567890"
              style={{ fontFamily:"'IBM Plex Mono',monospace" }} />
          </Field>
        )}

        {/* Fee summary box — shows customer price only, never margin */}
        <div style={{
          margin:'18px 0 20px', padding:'14px 16px',
          background: C.cdim, borderRadius:10, border:`1px solid ${C.cyan}33`,
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
            <span style={{ fontSize:12, color: C.text3 }}>{F.months} month{F.months>1?'s':''} × {CLUB_FEE.toLocaleString('en-RW')} RWF</span>
            <span style={{ fontSize:12, color: C.text2, fontFamily:"'IBM Plex Mono',monospace" }}>{totalFee.toLocaleString('en-RW')} RWF</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontSize:13, fontWeight:700, color: C.cyan }}>TOTAL TO COLLECT</span>
            <span style={{ fontSize:18, fontWeight:700, color: C.cyan, fontFamily:"'IBM Plex Mono',monospace" }}>
              {totalFee.toLocaleString('en-RW')} RWF
            </span>
          </div>
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button type="button" onClick={onDone} style={{ flex:1, padding:'11px', borderRadius:9, border:`1px solid ${C.border}`, background:'transparent', color: C.text3, fontSize:13, cursor:'pointer' }}>
            Cancel
          </button>
          <button type="submit" disabled={busy || (dupMember?.status==='active')} style={{
            flex:2, padding:'11px', borderRadius:9, border:'none',
            background: (busy || dupMember?.status==='active') ? 'rgba(0,184,160,.35)' : C.cyan,
            color: C.navy, fontWeight:700, fontSize:13,
            cursor: (busy || dupMember?.status==='active') ? 'not-allowed' : 'pointer',
          }}>
            {busy ? 'Enrolling…' : dupMember && dupMember.status !== 'active' ? '🔄 Renew Subscription' : '👑 Enroll in 10k Club'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Small helpers ─────────────────────────────────────────────────────────────
function SubBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding:'7px 13px', borderRadius:8, border:`1px solid ${active ? C.cyan : C.border}`,
      background: active ? C.cdim : 'transparent',
      color: active ? C.cyan : C.text3,
      fontSize:12, fontWeight: active ? 600 : 400, cursor:'pointer', whiteSpace:'nowrap',
    }}>{children}</button>
  )
}
function EmptyNote({ children }) {
  return <div style={{ padding:'16px', textAlign:'center', fontSize:12, color: C.text4, border:`1px dashed ${C.border}`, borderRadius:9 }}>{children}</div>
}

// ── UI Primitives ─────────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', color: C.text4, marginBottom:8 }}>{title}</div>
      {children}
    </div>
  )
}
function Field({ label, children }) {
  return (
    <div style={{ marginBottom:10 }}>
      <label style={{ display:'block', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em', color: C.text4, marginBottom:5 }}>{label}</label>
      {children}
    </div>
  )
}
function Pill({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding:'8px', borderRadius:8,
      border:`1.5px solid ${active ? C.cyan : C.border}`,
      background: active ? C.cdim : 'transparent',
      color: active ? C.cyan : C.text3,
      fontSize:11, fontWeight: active ? 600 : 400, cursor:'pointer',
      transition:'all .15s', textAlign:'center',
    }}>{children}</button>
  )
}
function Row({ k, v, mono }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:`1px solid ${C.border}` }}>
      <span style={{ fontSize:11, color: C.text3 }}>{k}</span>
      <span style={{ fontSize:12, color: C.text2, fontFamily: mono ? "'IBM Plex Mono',monospace" : 'inherit', fontWeight: mono ? 500 : 400, textAlign:'right', maxWidth:'60%' }}>{v||'—'}</span>
    </div>
  )
}
function Inp({ style: extra, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <input {...props}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{ ...inpStyle, borderColor: focused ? C.cyan : 'rgba(255,255,255,.1)', ...extra }}
    />
  )
}

const inpStyle = {
  width:'100%', padding:'9px 11px',
  background:'rgba(255,255,255,.05)',
  border:'1.5px solid rgba(255,255,255,.1)',
  borderRadius:8, color:'#fff', fontSize:13, outline:'none',
  transition:'border-color .15s',
}
