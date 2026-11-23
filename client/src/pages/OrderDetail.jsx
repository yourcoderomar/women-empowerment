import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api } from '../api.js';
import Banner from '../components/Banner.jsx';
import Empty from '../components/Empty.jsx';
import { RowSkeletons } from '../components/Skeleton.jsx';
import { StatusButtons, pretty } from '../components/OrderRow.jsx';
import { formatAddress } from '../components/AddressPicker.jsx';

const STEPS = ['pending', 'accepted', 'in_progress', 'completed'];

// One order: where it is in the flow, what's in it, where it goes.
export default function OrderDetail({ user }) {
  const { id } = useParams();
  const placed = useLocation().state?.placed;
  const [order, setOrder] = useState(undefined); // undefined = loading, null = not found
  const [error, setError] = useState('');
  const load = () => api(`/orders/${id}`).then(setOrder).catch((e) => { setOrder(null); setError(e.message); });
  useEffect(() => { load(); }, [id]);

  async function setStatus(orderId, status) {
    try { await api(`/orders/${orderId}/status`, { method: 'PATCH', body: { status } }); load(); }
    catch (e) { setError(e.message); }
  }

  if (order === undefined) return <RowSkeletons />;
  if (order === null) return <Empty title="Order not found">{error} <Link to="/orders">Back to your orders</Link></Empty>;

  const reached = STEPS.indexOf(order.status);
  const time = (t) => t?.slice(0, 5);

  return (
    <>
      {placed && <Banner msg={{ text: `Order placed. ${order.store_name} will accept it soon.` }} />}
      {error && <Banner msg={{ error: true, text: error }} onClose={() => setError('')} />}
      <div className="pagehead order-head">
        <div>
          <p className="eyebrow"><Link to="/orders">Orders</Link> / #{order.order_id}</p>
          <h1>{user.user_type === 'provider' ? order.customer_name : order.store_name}</h1>
          <p className="muted">{new Date(order.order_date).toLocaleString()}</p>
        </div>
        <div className="row-actions"><StatusButtons order={order} user={user} onStatus={setStatus} /></div>
      </div>

      {order.status === 'cancelled' ? (
        <p className="banner error">This order was cancelled.</p>
      ) : (
        <ol className="timeline">
          {STEPS.map((s, i) => <li key={s} className={i <= reached ? 'done' : ''}><span />{pretty(s)}</li>)}
        </ol>
      )}

      <div className="checkout">
        <section className="panel">
          <h2>Items</h2>
          <div className="lines">
            {order.items.map((it) => (
              <div className="line" key={it.order_item_id}>
                <div className="line-info">
                  <strong>{it.title}</strong>
                  <small className="muted">
                    {it.item_type === 'service'
                      ? (it.slot_date ? `${new Date(it.slot_date).toLocaleDateString()} · ${time(it.start_time)}–${time(it.end_time)}` : 'No time booked')
                      : `${it.quantity} × ${it.unit_price} EGP`}
                  </small>
                </div>
                <span className="mono line-total">{it.sub_total} EGP</span>
              </div>
            ))}
          </div>
          {order.special_instruction && <p className="note"><strong>Note:</strong> {order.special_instruction}</p>}
        </section>

        <aside className="panel summary">
          <h2>Summary</h2>
          <dl>
            <div><dt>Subtotal</dt><dd className="mono">{order.sub_total_amount} EGP</dd></div>
            <div><dt>Delivery</dt><dd className="mono">{Number(order.delivery_fee) ? `${order.delivery_fee} EGP` : 'Free'}</dd></div>
            <div className="total"><dt>Total</dt><dd className="mono">{order.total_amount} EGP</dd></div>
          </dl>
          {order.street_address && <><h3>Address</h3><p className="muted">{formatAddress(order)}</p></>}
          {user.user_type === 'provider' && order.customer_phone && <><h3>Customer phone</h3><p className="mono">{order.customer_phone}</p></>}
        </aside>
      </div>
    </>
  );
}
