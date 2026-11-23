import { useState } from 'react';
import { KINDS } from '../kinds.js';

// Shown when a listing has no uploaded photo (or it fails to load). Local only: no outside image service to go down.
const TINT = { food: 'warm', craft: 'rose', service: 'cool' };
function Placeholder({ item, kind }) {
  return (
    <div className={`photo-ph ${TINT[kind]}`} aria-hidden="true">
      <span>{item.title[0]}</span>
      <small>{KINDS[kind].label}</small>
    </div>
  );
}

// One listing in the browse grid. onAdd is left out when the viewer can't buy.
export default function ItemCard({ item, kind, index, onAdd }) {
  const k = KINDS[kind];
  const [broken, setBroken] = useState(false);
  // stock_quantity: null = made to order (never runs out); services have no stock.
  const stock = item.stock_quantity ?? null;
  const soldOut = stock !== null && stock <= 0;
  return (
    <article className={soldOut ? 'item sold-out' : 'item'} style={{ '--i': index }}>
      <div className="photo">
        {item.image_url && !broken
          ? <img src={item.image_url} alt={item.title} loading="lazy" onError={() => setBroken(true)} />
          : <Placeholder item={item} kind={kind} />}
        {soldOut && <span className="stock-tag">Out of stock</span>}
        {!soldOut && stock !== null && stock <= 3 && <span className="stock-tag low">Only {stock} left</span>}
      </div>
      <div className="item-body">
        <p className="maker">{item.store_name}</p>
        <h3>{item.title}</h3>
        {item.description && <p className="desc">{item.description}</p>}
        <div className="item-foot">
          <p className="price">
            {Number(item[k.price]).toFixed(2)} <small>EGP{kind === 'service' && ` / hr · ${item.hours_needed} hr`}</small>
          </p>
          {onAdd && (soldOut
            ? <button className="btn sm" disabled>Out of stock</button>
            : <button className="btn sm" onClick={() => onAdd(item)}>{kind === 'service' ? 'Book' : 'Add to cart'}</button>)}
        </div>
      </div>
    </article>
  );
}
