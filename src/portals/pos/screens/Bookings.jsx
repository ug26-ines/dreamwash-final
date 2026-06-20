import { useCollection, updateDocument, orderBy } from '../../../hooks/useFirestore';
import { fmtDate, fmtDateTime } from '../../../utils/formatters';

export default function POSBookings({ toast }) {
  const { docs: bookings } = useCollection('booking_requests', [orderBy('createdAt','desc')]);

  const confirm = async (b) => {
    try { await updateDocument('booking_requests', b.id, { status: 'confirmed' }); toast('Booking confirmed','success'); }
    catch { toast('Failed','error'); }
  };
  const decline = async (b) => {
    try { await updateDocument('booking_requests', b.id, { status: 'declined' }); toast('Booking declined','info'); }
    catch { toast('Failed','error'); }
  };

  return (
    <div className="page-content-wide">
      <div className="flex-between" style={{ marginBottom:'1.25rem' }}>
        <h2>Pickup Bookings</h2>
        <span className="badge badge-amber">{bookings.filter(b=>b.status==='pending').length} pending</span>
      </div>

      <div className="table-wrap">
        <table>
          <thead><tr><th>Client</th><th>Phone</th><th>Date</th><th>Slot</th><th>Location</th><th>Service</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {bookings.map(b => (
              <tr key={b.id}>
                <td className="fw-600">{b.clientName}</td>
                <td className="mono text-sm">{b.phone}</td>
                <td className="text-sm">{fmtDate(b.date)}</td>
                <td className="text-sm">{b.timeSlot}</td>
                <td className="text-sm">{b.location}</td>
                <td className="text-sm">{b.service || '—'}</td>
                <td>
                  <span className={`badge badge-${b.status==='confirmed'?'green':b.status==='declined'?'red':'amber'}`}>{b.status}</span>
                </td>
                <td>
                  {b.status === 'pending' && (
                    <div className="flex gap-1">
                      <button className="btn btn-primary btn-sm" onClick={()=>confirm(b)}>Confirm</button>
                      <button className="btn btn-danger btn-sm"  onClick={()=>decline(b)}>Decline</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!bookings.length && <div className="empty-state"><p>No booking requests yet</p></div>}
      </div>
    </div>
  );
}
