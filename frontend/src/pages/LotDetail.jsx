import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { api, SOCKET_URL } from '../api';
import { useAuth } from '../context/AuthContext';

export default function LotDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [lot, setLot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ startTime: '', endTime: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const isDriver = user.role === 'driver';

  useEffect(() => {
    const load = async () => {
      try {
        const [lotRes, slotRes] = await Promise.all([
          api(`/api/lots/${id}`),
          api(`/api/lots/${id}/slots`),
        ]);
        setLot(lotRes.lot);
        setSlots(slotRes.slots);
      } catch (err) {
        setError(err.message);
      }
    };
    load();

    // Live availability via Socket.IO
    const socket = io(SOCKET_URL);
    socket.on('slotUpdated', (data) => {
      if (data.lotId !== id) return;
      setSlots((prev) => prev.map((s) => (s._id === data.slotId ? { ...s, status: data.status } : s)));
    });
    return () => socket.disconnect();
  }, [id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleBook = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    if (!selected) return setError('Please select a slot first');
    try {
      await api('/api/reservations', {
        method: 'POST',
        body: {
          slotId: selected._id,
          startTime: new Date(form.startTime).toISOString(),
          endTime: new Date(form.endTime).toISOString(),
        },
      });
      setMsg(`Slot ${selected.slotNumber} reserved successfully`);
      setSelected(null);
      setForm({ startTime: '', endTime: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  if (!lot) return <p>{error || 'Loading...'}</p>;

  const counts = slots.reduce((acc, s) => ({ ...acc, [s.status]: (acc[s.status] || 0) + 1 }), {});

  return (
    <>
      <h2>{lot.name}</h2>
      <p>{lot.address} · Rs {lot.ratePerHour}/hr</p>
      <p className="muted">
        Available: {counts.available || 0} · Reserved: {counts.reserved || 0} · Occupied: {counts.occupied || 0}
        {' '}(updates live)
      </p>

      {error && <p className="error">{error}</p>}
      {msg && <p className="success">{msg}</p>}

      <div className="slot-grid">
        {slots.map((s) => (
          <button
            key={s._id}
            className={`slot ${s.status} ${selected?._id === s._id ? 'selected' : ''}`}
            onClick={() => isDriver && setSelected(s)}
            disabled={!isDriver || s.status === 'occupied'}
            title={s.status}
          >
            {s.slotNumber}
          </button>
        ))}
      </div>

      {isDriver && (
        <form className="card form" onSubmit={handleBook}>
          <h3>Book a slot {selected && `(Slot ${selected.slotNumber})`}</h3>
          <label>Start time</label>
          <input type="datetime-local" name="startTime" value={form.startTime} onChange={handleChange} required />
          <label>End time</label>
          <input type="datetime-local" name="endTime" value={form.endTime} onChange={handleChange} required />
          <button>Reserve</button>
        </form>
      )}
    </>
  );
}
