import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import Field from '../components/Field.jsx';

export default function Login({ onDone }) {
  const navigate = useNavigate();
  const from = useLocation().state?.from || '/'; // the page that sent us here
  const [mode, setMode] = useState('login');
  const [type, setType] = useState('customer');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const { token, user } = await api(`/auth/${mode}`, { method: 'POST', body: Object.fromEntries(new FormData(e.target)) });
      localStorage.setItem('token', token);
      onDone(user);
      navigate(from, { replace: true });
    } catch (err) { setError(err.message); setBusy(false); }
  }

  return (
    <div className="split">
      <div className="split-copy">
        <p className="eyebrow">{mode === 'login' ? 'Welcome back' : 'Join the market'}</p>
        <h1>Food, crafts and care, made at home by women in your city.</h1>
        <p className="lede">Customers order straight from the maker. Providers sell from home once an admin checks their documents.</p>
      </div>
      <form className="panel form" onSubmit={submit}>
        <h2>{mode === 'login' ? 'Log in' : 'Create account'}</h2>
        {mode === 'register' && <>
          <Field label="Full name"><input name="full_name" required /></Field>
          <Field label="Phone number"><input name="phone_number" inputMode="tel" /></Field>
          <Field label="I want to">
            <select name="user_type" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="customer">Buy</option>
              <option value="provider">Sell</option>
            </select>
          </Field>
          {type === 'provider' && <Field label="Store name"><input name="store_name" required /></Field>}
        </>}
        <Field label="Email"><input name="email" type="email" autoComplete="email" required /></Field>
        <Field label="Password" hint={mode === 'register' ? 'At least 6 characters' : null}>
          <input name="password" type="password" minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required />
        </Field>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn wide" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}</button>
        <button type="button" className="link" onClick={() => { setError(''); setMode(mode === 'login' ? 'register' : 'login'); }}>
          {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Log in'}
        </button>
      </form>
    </div>
  );
}
