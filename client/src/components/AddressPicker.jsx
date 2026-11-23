import { useEffect, useState } from 'react';
import { api } from '../api.js';
import Field from './Field.jsx';

export const formatAddress = (a) =>
  [a.street_address, a.building_number && `Bldg ${a.building_number}`, a.floor && `Floor ${a.floor}`, a.district, a.city].filter(Boolean).join(', ');

// Pick one of the user's saved addresses, or add a new one.
export default function AddressPicker({ value, onChange }) {
  const [addresses, setAddresses] = useState(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/addresses').then((list) => {
      setAddresses(list);
      if (!list.length) setAdding(true);
      else if (!value) onChange(list[0].address_id);
    }).catch((e) => { setAddresses([]); setError(e.message); });
  }, []);

  // Not a <form>: it sits inside the checkout form, and forms can't be nested.
  async function save(e) {
    const box = e.target.closest('.new-address');
    const fields = [...box.querySelectorAll('input')];
    if (!fields.every((f) => f.reportValidity())) return;
    try {
      const a = await api('/addresses', { method: 'POST', body: Object.fromEntries(fields.filter((f) => f.value).map((f) => [f.name, f.value])) });
      setAddresses((list) => [a, ...list]);
      onChange(a.address_id);
      setAdding(false); setError('');
    } catch (err) { setError(err.message); }
  }

  if (addresses === null) return <div className="ph" style={{ height: 56 }} />;
  return (
    <div className="addresses">
      {addresses.map((a) => (
        <label key={a.address_id} className={value === a.address_id ? 'choice on' : 'choice'}>
          <input type="radio" name="address" checked={value === a.address_id} onChange={() => onChange(a.address_id)} />
          <span>{formatAddress(a)}</span>
        </label>
      ))}
      {adding ? (
        <div className="new-address">
          <Field label="Street"><input name="street_address" required /></Field>
          <div className="two">
            <Field label="City"><input name="city" required /></Field>
            <Field label="District"><input name="district" /></Field>
            <Field label="Building"><input name="building_number" /></Field>
            <Field label="Floor"><input name="floor" /></Field>
          </div>
          <div className="row-actions" style={{ justifyContent: 'flex-start' }}>
            <button type="button" className="btn sm" onClick={save}>Save address</button>
            {addresses.length > 0 && <button type="button" className="btn ghost sm" onClick={() => setAdding(false)}>Cancel</button>}
          </div>
        </div>
      ) : (
        <button type="button" className="link" style={{ textAlign: 'left' }} onClick={() => setAdding(true)}>+ Add a new address</button>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
