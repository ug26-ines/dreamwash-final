import { useState } from 'react';
import { Check } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '../../../constants/plans';
import { addDocument } from '../../../hooks/useFirestore';
import { fmtRWF } from '../../../utils/formatters';

export default function ClientPlans({ client, toast }) {
  const [loading, setLoading] = useState(null);
  const [done,    setDone]    = useState(null);

  const sub = client?.subscription;

  const subscribe = async (plan) => {
    setLoading(plan.id);
    try {
      await addDocument('subscriptions', {
        clientId:   client.id,
        clientName: client.name,
        planId:     plan.id,
        planName:   plan.name,
        price:      plan.price,
        kgTotal:    plan.kg,
        kgRemaining:plan.kg,
        months:     plan.months,
        status:     'pending',
      });
      setDone(plan.id);
      toast('Subscription request submitted — visit the desk to pay and activate.', 'success');
    } catch { toast('Failed to submit','error'); }
    setLoading(null);
  };

  return (
    <div className="page-content" style={{ paddingBottom:'5rem' }}>
      <h2 style={{ margin:'1rem 0 0.25rem', fontFamily:'var(--font-head)' }}>Plans</h2>
      <p className="text-muted text-sm" style={{ marginBottom:'1.5rem' }}>
        Save on every wash. Pay cash at the shop to activate.
      </p>

      {sub?.status === 'active' && (
        <div className="card" style={{ marginBottom:'1.25rem', background:'var(--accent-dim)', borderColor:'var(--accent)' }}>
          <div className="fw-700 font-head" style={{ color:'var(--accent)', marginBottom:'0.25rem' }}>Current: {sub.planName}</div>
          <div className="text-sm text-muted">{sub.kgRemaining} kg remaining · Active</div>
        </div>
      )}

      <div className="flex-col gap-2">
        {SUBSCRIPTION_PLANS.map(plan => {
          const isStudentOnly = plan.studentOnly && client?.clientType !== 'individual';
          return (
            <div key={plan.id} className="card" style={{
              border: plan.recommended ? '1px solid var(--accent)' : undefined,
              position:'relative'
            }}>
              {plan.recommended && (
                <div style={{ position:'absolute', top:-10, left:'50%', transform:'translateX(-50%)' }}>
                  <span className="badge badge-teal">Recommended</span>
                </div>
              )}
              <div className="flex-between mb-1">
                <h3 style={{ fontFamily:'var(--font-head)' }}>{plan.name}</h3>
                <span className="mono fw-700" style={{ color:'var(--accent)', fontSize:'1.125rem' }}>{fmtRWF(plan.price)}</span>
              </div>
              <p className="text-muted text-sm" style={{ marginBottom:'0.75rem' }}>{plan.description}</p>

              <div className="flex-col gap-1" style={{ marginBottom:'1rem' }}>
                <Row>{plan.kg} kg included</Row>
                <Row>{plan.months === 1 ? 'Monthly renewal' : `${plan.months} months`}</Row>
                <Row>Overage: {fmtRWF(plan.overageRate)}/kg</Row>
                {plan.studentOnly && <Row>Students only</Row>}
              </div>

              {done === plan.id ? (
                <div className="flex-center gap-1" style={{ color:'var(--green)', fontWeight:600 }}>
                  <Check size={16} /> Request submitted
                </div>
              ) : (
                <button className="btn btn-primary btn-full" disabled={!!loading || isStudentOnly || sub?.status==='pending'}
                  onClick={() => subscribe(plan)}>
                  {loading === plan.id ? <span className="spinner" /> :
                   sub?.status === 'pending' ? 'Pending activation' :
                   isStudentOnly ? 'Students only' : `Subscribe · ${fmtRWF(plan.price)}`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="card" style={{ marginTop:'1rem', background:'var(--card)' }}>
        <p className="text-sm text-muted">
          After subscribing, visit the Dream X Wash shop in Musanze with your cash payment.
          The receptionist will activate your plan immediately.
        </p>
      </div>
    </div>
  );
}

function Row({ children }) {
  return (
    <div className="flex gap-1 text-sm" style={{ alignItems:'center' }}>
      <Check size={13} style={{ color:'var(--green)', flexShrink:0 }} />
      <span>{children}</span>
    </div>
  );
}
