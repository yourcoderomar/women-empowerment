import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { api } from './api.js';
import Header from './components/Header.jsx';
import Empty from './components/Empty.jsx';
import Browse from './pages/Browse.jsx';
import Login from './pages/Login.jsx';
import Orders from './pages/Orders.jsx';
import Sell from './pages/Sell.jsx';
import Admin from './pages/Admin.jsx';

// Holds the logged-in user and maps URLs to pages.
export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!localStorage.getItem('token')); // wait for /auth/me before guarding routes
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    api('/auth/me').then(setUser).catch(() => localStorage.removeItem('token')).finally(() => setReady(true));
  }, []);

  const logout = () => { localStorage.removeItem('token'); setUser(null); navigate('/'); };

  // Only lets in logged-in users of the given roles; others go to /login and come back after.
  const guard = (page, ...roles) => {
    if (!ready) return null;
    if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    if (roles.length && !roles.includes(user.user_type)) return <Navigate to="/" replace />;
    return page;
  };

  return (
    <>
      <Header user={user} onLogout={logout} />
      <main className="shell" key={location.pathname}>
        <Routes>
          <Route path="/" element={<Browse user={user} />} />
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login onDone={setUser} />} />
          <Route path="/orders" element={guard(<Orders user={user} />)} />
          <Route path="/sell" element={guard(<Sell user={user} />, 'provider')} />
          <Route path="/admin" element={guard(<Admin />, 'admin')} />
          <Route path="*" element={<Empty title="Page not found">That link doesn't go anywhere. Use the menu above.</Empty>} />
        </Routes>
      </main>
    </>
  );
}
