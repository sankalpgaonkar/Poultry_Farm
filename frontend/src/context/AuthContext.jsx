import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AuthContext = createContext(null);
const KEY = 'userInfo';

export const readStoredUser = () => {
  try {
    const u = JSON.parse(localStorage.getItem(KEY) || 'null');
    return u && u.token && u.role ? u : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  const login = useCallback((data) => {
    localStorage.setItem(KEY, JSON.stringify(data));
    setUser(data);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(KEY);
    localStorage.removeItem('token'); // left over from older versions
    setUser(null);
  }, []);

  // The API client fires this when the server says the session is no longer valid.
  useEffect(() => {
    const onExpired = () => setUser(null);
    const onStorage = (e) => { if (e.key === KEY) setUser(readStoredUser()); };
    window.addEventListener('auth-expired', onExpired);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('auth-expired', onExpired);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const homeFor = (role) => ({ Farmer: '/farmer', Buyer: '/buyer', Admin: '/admin' }[role] || '/buyer');
