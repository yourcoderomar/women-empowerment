import { Link, NavLink } from 'react-router-dom';

export default function Header({ user, cartCount, onLogout }) {
  const tabs = [['/', 'Browse']];
  if (user) tabs.push(['/orders', 'Orders']);
  if (user?.user_type === 'provider') tabs.push(['/listings', 'My shop'], ['/documents', 'Documents']);
  if (user?.user_type === 'admin') tabs.push(['/admin', 'Verify']);

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link className="brand" to="/">Bayt<span>.</span></Link>
        <nav className="tabs">
          {tabs.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'tab on' : 'tab')}>{label}</NavLink>
          ))}
        </nav>
        {cartCount !== null && (
          <NavLink to="/cart" className={({ isActive }) => (isActive ? 'tab on cart-link' : 'tab cart-link')}>
            Cart{cartCount > 0 && <span className="badge">{cartCount}</span>}
          </NavLink>
        )}
        {user ? (
          <div className="who">
            <span className="avatar">{user.full_name?.[0]}</span>
            <span className="who-name">{user.full_name}<small>{user.user_type}</small></span>
            <button className="btn ghost" onClick={onLogout}>Log out</button>
          </div>
        ) : (
          <Link className="btn" to="/login">Log in</Link>
        )}
      </div>
    </header>
  );
}
