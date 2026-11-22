import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Lots from './pages/Lots';
import LotDetail from './pages/LotDetail';
import MyReservations from './pages/MyReservations';
import Reports from './pages/Reports';

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/" element={<ProtectedRoute><Lots /></ProtectedRoute>} />
          <Route path="/lots/:id" element={<ProtectedRoute><LotDetail /></ProtectedRoute>} />
          <Route
            path="/my-reservations"
            element={<ProtectedRoute roles={['driver']}><MyReservations /></ProtectedRoute>}
          />
          <Route
            path="/reports"
            element={<ProtectedRoute roles={['manager', 'admin']}><Reports /></ProtectedRoute>}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
