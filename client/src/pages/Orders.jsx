import { useEffect, useState } from 'react';
import { api } from '../api.js';
import PageHead from '../components/PageHead.jsx';
import OrderRow from '../components/OrderRow.jsx';
import Empty from '../components/Empty.jsx';
import Banner from '../components/Banner.jsx';
import { RowSkeletons } from '../components/Skeleton.jsx';

export default function Orders({ user }) {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const load = () => api('/orders').then(setOrders).catch((e) => { setOrders([]); setError(e.message); });
  useEffect(() => { load(); }, []);

  async function setStatus(id, status) {
    try { await api(`/orders/${id}/status`, { method: 'PATCH', body: { status } }); load(); }
    catch (e) { setError(e.message); }
  }

  return (
    <>
      <PageHead eyebrow={user.user_type === 'provider' ? 'Incoming' : 'Your purchases'} title="Orders" />
      <Banner msg={error && { error: true, text: error }} />
      {orders === null ? <RowSkeletons /> : orders.length ? (
        <div className="rows">
          {orders.map((o, i) => <OrderRow key={o.order_id} order={o} user={user} index={i} onStatus={setStatus} />)}
        </div>
      ) : (
        <Empty title="No orders yet">
          {user.user_type === 'provider' ? 'Orders for your listings will show up here.' : 'Browse the market and place your first order.'}
        </Empty>
      )}
    </>
  );
}
