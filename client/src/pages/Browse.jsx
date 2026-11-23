import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { KINDS } from '../kinds.js';
import ItemCard from '../components/ItemCard.jsx';
import Empty from '../components/Empty.jsx';
import Banner from '../components/Banner.jsx';
import { CardSkeletons } from '../components/Skeleton.jsx';

export default function Browse({ user, cart }) {
  const [kind, setKind] = useState('food');
  const [q, setQ] = useState('');
  const [items, setItems] = useState(null); // null = loading
  const [msg, setMsg] = useState(null);
  const k = KINDS[kind];

  useEffect(() => {
    setItems(null);
    const t = setTimeout(() => api(`${k.path}?q=${encodeURIComponent(q)}`).then(setItems)
      .catch((e) => { setItems([]); setMsg({ error: true, text: e.message }); }), 250);
    return () => clearTimeout(t);
  }, [kind, q]);

  // Adding only fills the cart; the order is placed from the cart page.
  function add(item) {
    const result = cart.add(kind, item);
    if (result === 'max') return setMsg({ error: true, text: <>You already have all {item.stock_quantity} "{item.title}" in your cart. <Link to="/cart">View cart</Link></> });
    if (result !== 'added') return;
    setMsg({ text: <>Added "{item.title}" to your cart. <Link to="/cart">View cart</Link></> });
  }

  const canBuy = !user || user.user_type === 'customer';

  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">Made at home, sold direct</p>
          <h1>Order from the women who make it.</h1>
        </div>
        <p className="lede">Every listing comes from a verified home-based provider. Pick a category, search, and order in one tap.</p>
      </section>

      <div className="toolbar">
        <div className="segmented" role="tablist">
          {Object.entries(KINDS).map(([key, v]) => (
            <button key={key} role="tab" aria-selected={kind === key} className={kind === key ? 'on' : ''} onClick={() => setKind(key)}>{v.label}</button>
          ))}
        </div>
        <input className="search" type="search" placeholder={`Search ${k.label.toLowerCase()}`} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <Banner msg={msg} onClose={() => setMsg(null)} />

      {items === null ? <CardSkeletons /> : items.length ? (
        <div className="grid">
          {items.map((item, i) => (
            <ItemCard key={item[k.id]} item={item} kind={kind} index={i} onAdd={canBuy ? add : null} />
          ))}
        </div>
      ) : (
        <Empty title="Nothing here yet">
          {q ? `No ${k.label.toLowerCase()} match "${q}". Try a shorter word.` : 'Verified providers have not listed anything in this category yet.'}
        </Empty>
      )}
    </>
  );
}
