import { useState } from 'react';
import { api } from '../api.js';
import { KINDS } from '../kinds.js';
import Field from '../components/Field.jsx';
import PageHead from '../components/PageHead.jsx';
import Empty from '../components/Empty.jsx';

export default function Sell({ user }) {
  const [kind, setKind] = useState('food');
  const [msg, setMsg] = useState(null);
  const k = KINDS[kind];

  async function submit(e) {
    e.preventDefault();
    const body = Object.fromEntries([...new FormData(e.target)].filter(([, v]) => v !== ''));
    try {
      const item = await api(k.path, { method: 'POST', body });
      setMsg({ text: `"${item.title}" is now listed.` });
      e.target.reset();
    } catch (err) { setMsg({ error: true, text: err.message }); }
  }

  if (user.verification_status !== 'accepted') {
    return (
      <>
        <PageHead eyebrow="Sell" title="Waiting for verification" />
        <Empty title={`Status: ${user.verification_status}`}>
          An admin has to accept your documents before you can list items. You will be able to sell as soon as that happens.
        </Empty>
      </>
    );
  }

  return (
    <div className="split">
      <div className="split-copy">
        <p className="eyebrow">Sell</p>
        <h1>List something new.</h1>
        <p className="lede">It appears in the market right away. Leave stock empty for things you make to order.</p>
      </div>
      <form className="panel form" onSubmit={submit}>
        <Field label="Category">
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            {Object.entries(KINDS).map(([key, v]) => <option key={key} value={key}>{v.label}</option>)}
          </select>
        </Field>
        <Field label="Title"><input name="title" required /></Field>
        <Field label="Description"><textarea name="description" rows={3} /></Field>
        <div className="two">
          <Field label={kind === 'service' ? 'Hourly rate (EGP)' : 'Price (EGP)'}>
            <input name={k.price} type="number" step="0.01" min="0" required />
          </Field>
          {kind === 'service'
            ? <Field label="Hours needed"><input name="hours_needed" type="number" min="1" required /></Field>
            : <Field label="Stock" hint="Empty = made to order"><input name="stock_quantity" type="number" min="0" /></Field>}
        </div>
        {msg && <p className={msg.error ? 'error' : 'success'} role="status">{msg.text}</p>}
        <button className="btn wide">Add listing</button>
      </form>
    </div>
  );
}
