import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { KINDS } from '../kinds.js';
import PageHead from '../components/PageHead.jsx';
import Empty from '../components/Empty.jsx';
import Banner from '../components/Banner.jsx';
import ItemForm from '../components/ItemForm.jsx';
import { RowSkeletons } from '../components/Skeleton.jsx';

function Thumb({ item }) {
  return item.image_url
    ? <img className="thumb" src={item.image_url} alt="" />
    : <span className="thumb thumb-ph">{item.title[0]}</span>;
}

// Stock as the provider sees it. Only food has an on/off "available" switch in the database.
function StockPill({ kind, item }) {
  if (kind === 'service') return <span className="pill">{item.hours_needed} hr</span>;
  if (kind === 'food' && !item.is_available) return <span className="pill cancelled">Hidden</span>;
  if (item.stock_quantity === null) return <span className="pill">Made to order</span>;
  if (item.stock_quantity <= 0) return <span className="pill out">Out of stock</span>;
  return <span className={item.stock_quantity <= 3 ? 'pill pending' : 'pill completed'}>{item.stock_quantity} in stock</span>;
}

// A provider's own listings: edit, restock, hide, delete, and time slots for services.
export default function Listings({ user }) {
  const [rows, setRows] = useState(null);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = () => Promise.all(Object.entries(KINDS).map(([kind, k]) =>
    api(`${k.path}?provider_id=${user.provider_id}`).then((list) => list.map((item) => ({ kind, item, key: `${kind}-${item[k.id]}` })))))
    .then((groups) => setRows(groups.flat()))
    .catch((e) => { setRows([]); setMsg({ error: true, text: e.message }); });
  useEffect(() => { load(); }, []);

  async function patch(kind, item, body, text) {
    const k = KINDS[kind];
    try { await api(`${k.path}/${item[k.id]}`, { method: 'PATCH', body }); setMsg({ text }); load(); }
    catch (e) { setMsg({ error: true, text: e.message }); }
  }

  async function remove(kind, item) {
    if (!confirm(`Delete "${item.title}"? Customers will no longer see it. This can't be undone.`)) return;
    const k = KINDS[kind];
    try { await api(`${k.path}/${item[k.id]}`, { method: 'DELETE' }); setMsg({ text: `Deleted "${item.title}".` }); load(); }
    catch (e) { setMsg({ error: true, text: `${e.message}. If it has past orders, hide it or set its stock to 0 instead.` }); }
  }

  if (user.verification_status !== 'accepted') {
    return (
      <>
        <PageHead eyebrow="My shop" title="Waiting for verification" />
        <Empty title={`Status: ${user.verification_status}`}>You can list items once an admin accepts you. <Link to="/documents">Upload your documents</Link>.</Empty>
      </>
    );
  }

  return (
    <>
      <div className="pagehead order-head">
        <div>
          <p className="eyebrow">My shop</p>
          <h1>{user.store_name}</h1>
        </div>
        <Link className="btn" to="/sell">Add listing</Link>
      </div>
      <Banner msg={msg} onClose={() => setMsg(null)} />

      {rows === null ? <RowSkeletons /> : !rows.length ? (
        <Empty title="Nothing listed yet"><Link to="/sell">Add your first listing</Link> and it will show up in the market.</Empty>
      ) : Object.entries(KINDS).map(([kind, k]) => {
        const group = rows.filter((r) => r.kind === kind);
        if (!group.length) return null;
        return (
          <section key={kind} className="shop-group">
            <h2 className="group-title">{k.label} <span className="muted">{group.length}</span></h2>
            <div className="rows">
              {group.map(({ item, key }, i) => (
                <div key={key} className="listing" style={{ '--i': i }}>
                  <div className="row listing-row">
                    <Thumb item={item} />
                    <div className="row-main">
                      <strong>{item.title}</strong>
                      <small className="muted mono">{Number(item[k.price]).toFixed(2)} EGP{kind === 'service' ? ' / hr' : ''}</small>
                    </div>
                    <StockPill kind={kind} item={item} />
                    <div className="row-actions">
                      {kind === 'service' && <Link className="btn sm" to={`/listings/services/${item.service_id}/slots`}>Time slots</Link>}
                      {kind !== 'service' && item.stock_quantity === 0 && (
                        <button className="btn sm" onClick={() => setEditing(key)}>Restock</button>
                      )}
                      {kind === 'food' && (
                        <button className="btn ghost sm" onClick={() => patch(kind, item, { is_available: !item.is_available },
                          item.is_available ? `"${item.title}" is hidden from the market.` : `"${item.title}" is back in the market.`)}>
                          {item.is_available ? 'Hide' : 'Show'}
                        </button>
                      )}
                      <button className="btn ghost sm" onClick={() => setEditing(editing === key ? null : key)}>{editing === key ? 'Close' : 'Edit'}</button>
                      <button className="btn ghost sm danger" onClick={() => remove(kind, item)}>Delete</button>
                    </div>
                  </div>
                  {editing === key && (
                    <div className="edit-panel">
                      <ItemForm kind={kind} item={item} onSaved={() => { setEditing(null); setMsg({ text: `Saved "${item.title}".` }); load(); }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
