const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const SOCKET_URL = BASE;

export const tokens = {
  get access() { return localStorage.getItem('accessToken'); },
  get refresh() { return localStorage.getItem('refreshToken'); },
  set(a, r) {
    localStorage.setItem('accessToken', a);
    localStorage.setItem('refreshToken', r);
  },
  clear() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
};

const send = (path, method, body, auth) =>
  fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(auth && tokens.access ? { Authorization: `Bearer ${tokens.access}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

// Try to get a new access token using the refresh token
const tryRefresh = async () => {
  if (!tokens.refresh) return false;
  const res = await send('/api/auth/refresh', 'POST', { refreshToken: tokens.refresh }, false);
  if (!res.ok) return false;
  const data = await res.json();
  tokens.set(data.accessToken, data.refreshToken);
  return true;
};

export async function api(path, { method = 'GET', body, auth = true } = {}) {
  let res = await send(path, method, body, auth);

  if (res.status === 401 && auth && (await tryRefresh())) {
    res = await send(path, method, body, auth);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && auth) tokens.clear();
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
}
