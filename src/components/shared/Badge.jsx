export default function Badge({ children, color = 'muted' }) {
  return <span className={`badge badge-${color}`}>{children}</span>;
}

export function clientTypeBadge(type) {
  const map = {
    walkin:     ['Walk-in',    'muted'],
    club:       ['10k Club',   'teal'],
    b2b:        ['B2B',        'blue'],
    dispatcher: ['Dispatcher', 'purple'],
  };
  const [label, color] = map[type] || [type, 'muted'];
  return <span className={`badge badge-${color}`}>{label}</span>;
}

export function stageBadge(stage) {
  const map = {
    received:  'muted',
    washing:   'blue',
    drying:    'blue',
    pressing:  'amber',
    ready:     'green',
    collected: 'muted',
  };
  return <span className={`badge badge-${map[stage] || 'muted'}`}>{stage}</span>;
}

export function subStatusBadge(status) {
  const map = { active: 'green', pending: 'amber', expired: 'red' };
  return <span className={`badge badge-${map[status] || 'muted'}`}>{status}</span>;
}
