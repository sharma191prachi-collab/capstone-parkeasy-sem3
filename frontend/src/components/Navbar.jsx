import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="brand">ParkEasy</Link>
      <div className="links">
        {user && <Link to="/">Lots</Link>}
        {user?.role === 'driver' && <Link to="/my-reservations">My Bookings</Link>}
        {(user?.role === 'manager' || user?.role === 'admin') && <Link to="/reports">Reports</Link>}
        {user ? (
          <>
            <span className="badge">{user.name} ({user.role})</span>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
