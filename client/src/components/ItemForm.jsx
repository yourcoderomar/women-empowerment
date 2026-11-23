import { useState } from 'react';
import { api, uploadImage } from '../api.js';
import { KINDS } from '../kinds.js';
import Field from './Field.jsx';
import CategorySelect from './CategorySelect.jsx';

// Add a new listing (no `item`) or edit an existing one. Used by the Sell and My shop pages.
export default function ItemForm({ kind, item, onKindChange, onSaved }) {
  const k = KINDS[kind];
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const form = e.target;
    const { photo, ...rest } = Object.fromEntries(new FormData(form));
    let body;
    if (item) {
      // Editing: an emptied field means "clear it" (empty stock = made to order).
      body = { ...rest, category_id: rest.category_id || null };
      if ('stock_quantity' in rest) body.stock_quantity = rest.stock_quantity === '' ? null : rest.stock_quantity;
    } else {
      body = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== ''));
    }
    setBusy(true); setMsg(null);
    try {
      if (photo?.size) body.image_url = await uploadImage(photo);
      const saved = await api(item ? `${k.path}/${item[k.id]}` : k.path, { method: item ? 'PATCH' : 'POST', body });
      if (!item) form.reset();
      setMsg({ text: item ? 'Saved.' : `"${saved.title}" is now listed.` });
      onSaved?.(saved);
    } catch (err) { setMsg({ error: true, text: err.message }); }
    setBusy(false);
  }

  return (
    <form className="form" onSubmit={submit} key={item ? item[k.id] : kind}>
      {onKindChange && (
        <Field label="What are you selling?">
          <select value={kind} onChange={(e) => onKindChange(e.target.value)}>
            {Object.entries(KINDS).map(([key, v]) => <option key={key} value={key}>{v.label}</option>)}
          </select>
        </Field>
      )}
      <Field label="Title"><input name="title" defaultValue={item?.title} required /></Field>
      <Field label="Description"><textarea name="description" rows={3} defaultValue={item?.description ?? ''} /></Field>
      <Field label="Category"><CategorySelect defaultValue={item?.category_id} /></Field>
      <Field label={item?.image_url ? 'Replace photo' : 'Photo'} hint="Optional · JPEG, PNG or WebP, up to 2 MB">
        <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
      </Field>
      <div className="two">
        <Field label={kind === 'service' ? 'Hourly rate (EGP)' : 'Price (EGP)'}>
          <input name={k.price} type="number" step="0.01" min="0" defaultValue={item?.[k.price]} required />
        </Field>
        {kind === 'service'
          ? <Field label="Hours needed"><input name="hours_needed" type="number" min="1" defaultValue={item?.hours_needed} required /></Field>
          : <Field label="Stock" hint="Empty = made to order"><input name="stock_quantity" type="number" min="0" defaultValue={item?.stock_quantity ?? ''} /></Field>}
      </div>
      {msg && <p className={msg.error ? 'error' : 'success'} role="status">{msg.text}</p>}
      <button className="btn wide" disabled={busy}>{busy ? 'Saving…' : item ? 'Save changes' : 'Add listing'}</button>
    </form>
  );
}
