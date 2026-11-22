import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Reports() {
  const [occupancy, setOccupancy] = useState([]);
  const [revenue, setRevenue] = useState({ grandTotal: 0, report: [] });
  const [range, setRange] = useState({ from: '', to: '' });
  const [error, setError] = useState('');

  const loadOccupancy = async () => {
    try {
      const data = await api('/api/reports/occupancy');
      setOccupancy(data.report);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadRevenue = async () => {
    try {
      const q = new URLSearchParams();
      if (range.from) q.set('from', range.from);
      if (range.to) q.set('to', range.to);
      const data = await api(`/api/reports/revenue?${q.toString()}`);
      setRevenue(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => { loadOccupancy(); loadRevenue(); }, []);

  return (
    <>
      <h2>Reports</h2>
      {error && <p className="error">{error}</p>}

      <h3>Occupancy</h3>
      <table>
        <thead>
          <tr><th>Lot</th><th>Total</th><th>Available</th><th>Reserved</th><th>Occupied</th><th>Occupancy %</th></tr>
        </thead>
        <tbody>
          {occupancy.map((r) => (
            <tr key={r.lotId}>
              <td>{r.lotName}</td><td>{r.total}</td><td>{r.available}</td>
              <td>{r.reserved}</td><td>{r.occupied}</td><td>{r.occupancyPercent}%</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Revenue (Total: Rs {revenue.grandTotal})</h3>
      <div className="form inline">
        <input type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} />
        <input type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} />
        <button onClick={loadRevenue}>Apply</button>
      </div>
      <table>
        <thead>
          <tr><th>Lot</th><th>Bookings</th><th>Revenue</th><th>Avg fee</th></tr>
        </thead>
        <tbody>
          {revenue.report.map((r) => (
            <tr key={r.lotId}>
              <td>{r.lotName}</td><td>{r.totalBookings}</td>
              <td>Rs {r.totalRevenue}</td><td>Rs {r.avgFee}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
