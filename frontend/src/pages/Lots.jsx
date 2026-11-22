import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const emptyForm = { name: '', address: '', totalSlots: '', ratePerHour: '' };

export default function Lots() {
  const { user } = useAuth();
  const [lots, setLots] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const canManage = user.role === 'manager' || user.role === 'admin';

  const loadLots = async () => {
    try {
      const data = await api('/api/lots');
      setLots(data.lots);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => { loadLots(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api('/api/lots', {
        method: 'POST',
        body: {
          ...form,
          totalSlots: Number(form.totalSlots),
          ratePerHour: Number(form.ratePerHour),
        },
      });
      setForm(emptyForm);
      loadLots();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lot and all its slots?')) return;
    try {
      await api(`/api/lots/${id}`, { method: 'DELETE' });
      loadLots();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <h2>Parking Lots</h2>
      {error && <p className="error">{error}</p>}

      {canManage && (
        <form className="card form inline" onSubmit={handleCreate}>
          <h3>Add new lot</h3>
          <input name="name" placeholder="Lot name" value={form.name} onChange={handleChange} required />
          <input name="address" placeholder="Address" value={form.address} onChange={handleChange} required />
          <input name="totalSlots" type="number" min="1" max="500" placeholder="Total slots" value={form.totalSlots} onChange={handleChange} required />
          <input name="ratePerHour" type="number" min="0" placeholder="Rate per hour" value={form.ratePerHour} onChange={handleChange} required />
          <button>Create lot</button>
        </form>
      )}

      <div className="grid">
        {lots.map((lot) => (
          <div className="card" key={lot._id}>
            <h3>{lot.name}</h3>
            <p>{lot.address}</p>
            <p>{lot.totalSlots} slots · Rs {lot.ratePerHour}/hr</p>
            <p className="muted">Manager: {lot.manager?.name}</p>
            <Link to={`/lots/${lot._id}`}><button>View slots</button></Link>
            {canManage && (user.role === 'admin' || lot.manager?._id === user._id) && (
              <button className="danger" onClick={() => handleDelete(lot._id)}>Delete</button>
            )}
          </div>
        ))}
        {lots.length === 0 && <p>No lots yet.</p>}
      </div>
    </>
  );
}
