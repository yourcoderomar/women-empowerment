import { Link } from 'react-router-dom';

// Which status buttons each role gets, mirroring TRANSITIONS in order.controller.js.
export const NEXT = {
  provider: { pending: ['accepted', 'cancelled'], accepted: ['in_progress'], in_progress: ['completed'] },
  customer: { pending: ['cancelled'] },
};
export const pretty = (s) => s.replace('_', ' ');

export function StatusButtons({ order, user, onStatus }) {
  return (NEXT[user.user_type]?.[order.status] || []).map((s) => (
    <button key={s} className={s === 'cancelled' ? 'btn ghost sm' : 'btn sm'} onClick={() => onStatus(order.order_id, s)}>
      {s === 'cancelled' ? 'Cancel' : `Mark ${pretty(s)}`}
    </button>
  ));
}

export default function OrderRow({ order: o, user, index, onStatus }) {
  return (
    <div className="row" style={{ '--i': index }}>
      <span className="mono muted">#{o.order_id}</span>
      <Link className="row-main" to={`/orders/${o.order_id}`}>
        <strong>{user.user_type === 'provider' ? o.customer_name : o.store_name}</strong>
        <small className="muted">{new Date(o.order_date).toLocaleDateString()} · View details</small>
      </Link>
      <span className="mono">{o.total_amount} EGP</span>
      <span className={`pill ${o.status}`}>{pretty(o.status)}</span>
      <div className="row-actions"><StatusButtons order={o} user={user} onStatus={onStatus} /></div>
    </div>
  );
}
