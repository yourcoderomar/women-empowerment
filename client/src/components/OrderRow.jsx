// Which status buttons each role gets, mirroring TRANSITIONS in order.controller.js.
const NEXT = {
  provider: { pending: ['accepted', 'cancelled'], accepted: ['in_progress'], in_progress: ['completed'] },
  customer: { pending: ['cancelled'] },
};
const pretty = (s) => s.replace('_', ' ');

export default function OrderRow({ order: o, user, index, onStatus }) {
  return (
    <div className="row" style={{ '--i': index }}>
      <span className="mono muted">#{o.order_id}</span>
      <div className="row-main">
        <strong>{user.user_type === 'provider' ? o.customer_name : o.store_name}</strong>
        <small className="muted">{new Date(o.order_date).toLocaleDateString()}</small>
      </div>
      <span className="mono">{o.total_amount} EGP</span>
      <span className={`pill ${o.status}`}>{pretty(o.status)}</span>
      <div className="row-actions">
        {(NEXT[user.user_type]?.[o.status] || []).map((s) => (
          <button key={s} className={s === 'cancelled' ? 'btn ghost sm' : 'btn sm'} onClick={() => onStatus(o.order_id, s)}>
            {s === 'cancelled' ? 'Cancel' : `Mark ${pretty(s)}`}
          </button>
        ))}
      </div>
    </div>
  );
}
