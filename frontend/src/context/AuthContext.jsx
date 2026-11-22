import { createContext, useContext, useEffect, useState } from 'react';
import { api, tokens } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on page refresh
  useEffect(() => {
    const restore = async () => {
      if (!tokens.access) return setLoading(false);
      try {
        const data = await api('/api/auth/me');
        setUser(data.user);
      } catch {
        tokens.clear();
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  const authenticate = async (path, body) => {
    const data = await api(path, { method: 'POST', body, auth: false });
    tokens.set(data.accessToken, data.refreshToken);
    setUser(data.user);
    return data.user;
  };

  const login = (email, password) => authenticate('/api/auth/login', { email, password });
  const register = (form) => authenticate('/api/auth/register', form);

  const logout = async () => {
    try { await api('/api/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    tokens.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
