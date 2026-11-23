import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import PageHead from '../components/PageHead.jsx';
import Empty from '../components/Empty.jsx';
import Field from '../components/Field.jsx';
import SlotPicker from '../components/SlotPicker.jsx';
import AddressPicker from '../components/AddressPicker.jsx';

const DELIVERY_FEE = 20; // same flat fee as order.model.js; the backend's total is the one that counts
const money = (n) => `${n.toFixed(2)} EGP`;

// Cart → choose times and address → place order → order page.
export default function Cart({ user, cart }) {
  const navigate = useNavigate();
  const [addressId, setAddressId] = useState(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const { lines } = cart;
  const subTotal = lines.reduce((s, l) => s + l.unit * l.qty, 0);
  const delivery = lines.some((l) => l.kind !== 'service') ? DELIVERY_FEE : 0;
  const missingSlot = lines.some((l) => l.kind === 'service' && !l.slot_id);

  async function placeOrder(e) {
    e.preventDefault();
    if (!user) return navigate('/login', { state: { from: '/cart' } });
    if (missingSlot) return setError('Choose a time for each service.');
    if (!addressId) return setError('Choose or add an address.');
    setBusy(true); setError('');
    try {
      const order = await api('/orders', {
        method: 'POST',
        body: {
          items: lines.map((l) => ({ item_type: l.kind, item_id: l.item_id, quantity: l.qty, slot_id: l.slot_id ?? undefined })),
          delivery_address_id: addressId,
          special_instruction: note || undefined,
        },
      });
      cart.clear();
      navigate(`/orders/${order.order_id}`, { state: { placed: true } });
    } catch (err) { setError(err.message); setBusy(false); }
  }

  if (!lines.length) {
    return (
      <>
        <PageHead eyebrow="Cart" title="Your cart" />
        <Empty title="Your cart is empty">Add food, crafts or a home service from the <Link to="/">market</Link>, then come back here to check out.</Empty>
      </>
    );
  }

  return (
    <>
      <PageHead eyebrow={`From ${lines[0].store_name}`} title="Checkout" />
      <form className="checkout" onSubmit={placeOrder}>
        <div className="checkout-main">
          <section className="panel">
            <h2 className="step"><span>1</span>Items</h2>
            <div className="lines">
              {lines.map((l) => (
                <div className="line" key={l.key}>
                  <div className="line-info">
                    <strong>{l.title}</strong>
                    <small className="muted">
                      {l.kind === 'service' ? `${l.hours} hr service` : `${money(l.unit)} each`}
                      {l.stock != null && l.qty >= l.stock && ` · that's all ${l.stock} in stock`}
                    </small>
                    {l.kind === 'service' && (
                      <Field label="Appointment">
                        <SlotPicker serviceId={l.item_id} value={l.slot_id} onChange={(slot_id) => cart.update(l.key, { slot_id })} />
                      </Field>
                    )}
                  </div>
                  {l.kind !== 'service' && (
                    <div className="stepper" aria-label={`Quantity of ${l.title}`}>
                      <button type="button" onClick={() => (l.qty > 1 ? cart.update(l.key, { qty: l.qty - 1 }) : cart.remove(l.key))} aria-label="Less">−</button>
                      <span className="mono">{l.qty}</span>
                      <button type="button" onClick={() => cart.update(l.key, { qty: l.qty + 1 })} aria-label="More"
                        disabled={l.stock != null && l.qty >= l.stock} title={l.stock != null && l.qty >= l.stock ? `Only ${l.stock} available` : undefined}>+</button>
                    </div>
                  )}
                  <span className="mono line-total">{money(l.unit * l.qty)}</span>
                  <button type="button" className="link" onClick={() => cart.remove(l.key)}>Remove</button>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <h2 className="step"><span>2</span>{delivery ? 'Delivery address' : 'Service address'}</h2>
            {user
              ? <AddressPicker value={addressId} onChange={setAddressId} />
              : <p className="muted">Log in to choose an address. <Link to="/login" state={{ from: '/cart' }}>Log in</Link></p>}
          </section>

          <section className="panel">
            <h2 className="step"><span>3</span>Note for {lines[0].store_name}</h2>
            <Field label="Special instructions" hint="Optional, e.g. a message on the cake or the gate code">
              <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
          </section>
        </div>

        <aside className="panel summary">
          <h2>Summary</h2>
          <dl>
            <div><dt>Subtotal</dt><dd className="mono">{money(subTotal)}</dd></div>
            <div><dt>Delivery</dt><dd className="mono">{delivery ? money(delivery) : 'Free'}</dd></div>
            <div className="total"><dt>Total</dt><dd className="mono">{money(subTotal + delivery)}</dd></div>
          </dl>
          {error && <p className="error" role="alert">{error}</p>}
          <button className="btn wide" disabled={busy}>{busy ? 'Placing order…' : user ? 'Place order' : 'Log in to order'}</button>
          <small className="muted">You can cancel while the order is still pending.</small>
        </aside>
      </form>
    </>
  );
}
