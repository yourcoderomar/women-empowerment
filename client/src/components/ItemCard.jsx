import { KINDS } from '../kinds.js';

// One listing in the browse grid. onOrder is left out when the viewer can't order.
export default function ItemCard({ item, kind, index, onOrder }) {
  const k = KINDS[kind];
  return (
    <article className="item" style={{ '--i': index }}>
      <img src={`https://picsum.photos/seed/${kind}-${item[k.id]}/640/480`} alt="" loading="lazy" />
      <div className="item-body">
        <p className="maker">{item.store_name}</p>
        <h3>{item.title}</h3>
        {item.description && <p className="desc">{item.description}</p>}
        <div className="item-foot">
          <p className="price">
            {Number(item[k.price]).toFixed(2)} <small>EGP{kind === 'service' && ` / hr · ${item.hours_needed} hr`}</small>
          </p>
          {onOrder && <button className="btn sm" onClick={() => onOrder(item)}>Order</button>}
        </div>
      </div>
    </article>
  );
}
