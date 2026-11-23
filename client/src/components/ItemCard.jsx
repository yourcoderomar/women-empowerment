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
  return (
    <article className="item" style={{ '--i': index }}>
      {item.image_url && !broken
        ? <img src={item.image_url} alt={item.title} loading="lazy" onError={() => setBroken(true)} />
        : <Placeholder item={item} kind={kind} />}
      <div className="item-body">
        <p className="maker">{item.store_name}</p>
        <h3>{item.title}</h3>
        {item.description && <p className="desc">{item.description}</p>}
        <div className="item-foot">
          <p className="price">
            {Number(item[k.price]).toFixed(2)} <small>EGP{kind === 'service' && ` / hr · ${item.hours_needed} hr`}</small>
          </p>
          {onAdd && <button className="btn sm" onClick={() => onAdd(item)}>{kind === 'service' ? 'Book' : 'Add to cart'}</button>}
        </div>
      </div>
    </article>
  );
}
