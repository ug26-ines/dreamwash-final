export const fmtRWF = (n) => Number(n).toLocaleString('en-US') + ' RWF';
export const fmtN   = (n) => Number(n).toLocaleString('en-US');

export const fmtDate = (ts) => {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const fmtDateTime = (ts) => {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

export const fmtTime = (ts) => {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

export const initials = (name = '') =>
  name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');
