import { useEffect, useState } from 'react';
import { api } from '../api';

const fmt = (d) => new Date(d).toLocaleString();

export default function MyReservations() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      const data = await api('/api/reservations/my');
      setItems(data.reservations);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => { load(); }, []);

  const act = async (id, action) => {
    setError('');
    setMsg('');
    try {
      const data = await api(`/api/reservations/${id}/${action}`, { method: 'PATCH' });
      if (action === 'exit') setMsg(`Exited. Hours: ${data.hours}, Fee: Rs ${data.fee}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <h2>My Bookings</h2>
      {error && <p className="error">{error}</p>}
      {msg && <p className="success">{msg}</p>}

      <table>
        <thead>
          <tr><th>Lot</th><th>Slot</th><th>From</th><th>To</th><th>Status</th><th>Fee</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r._id}>
              <td>{r.lot?.name}</td>
              <td>{r.slot?.slotNumber}</td>
              <td>{fmt(r.startTime)}</td>
              <td>{fmt(r.endTime)}</td>
              <td><span className={`tag ${r.status}`}>{r.status}</span></td>
              <td>{r.status === 'completed' ? `Rs ${r.fee}` : '-'}</td>
              <td>
                {r.status === 'reserved' && (
                  <>
                    <button onClick={() => act(r._id, 'checkin')}>Check in</button>
                    <button className="danger" onClick={() => act(r._id, 'cancel')}>Cancel</button>
                  </>
                )}
                {r.status === 'active' && <button onClick={() => act(r._id, 'exit')}>Exit & pay</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 && <p>No bookings yet.</p>}
    </>
  );
}
