import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { api } from './api.js';
import { useCart } from './cart.js';
import Header from './components/Header.jsx';
import Empty from './components/Empty.jsx';
import Browse from './pages/Browse.jsx';
import Login from './pages/Login.jsx';
import Cart from './pages/Cart.jsx';
import Orders from './pages/Orders.jsx';
import OrderDetail from './pages/OrderDetail.jsx';
import Sell from './pages/Sell.jsx';
import Admin from './pages/Admin.jsx';

// Holds the logged-in user and the cart, and maps URLs to pages.
export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!localStorage.getItem('token')); // wait for /auth/me before guarding routes
  const cart = useCart();
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

  // Guests can fill a cart; they log in at checkout.
  const shopper = !user || user.user_type === 'customer';

  return (
    <>
      <Header user={user} cartCount={shopper ? cart.count : null} onLogout={logout} />
      <main className="shell" key={location.pathname}>
        <Routes>
          <Route path="/" element={<Browse user={user} cart={cart} />} />
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login onDone={setUser} />} />
          <Route path="/cart" element={shopper ? <Cart user={user} cart={cart} /> : <Navigate to="/" replace />} />
          <Route path="/orders" element={guard(<Orders user={user} />)} />
          <Route path="/orders/:id" element={guard(<OrderDetail user={user} />)} />
          <Route path="/sell" element={guard(<Sell user={user} />, 'provider')} />
          <Route path="/admin" element={guard(<Admin />, 'admin')} />
          <Route path="*" element={<Empty title="Page not found">That link doesn't go anywhere. Use the menu above.</Empty>} />
        </Routes>
      </main>
    </>
  );
}
