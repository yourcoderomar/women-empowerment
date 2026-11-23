import { KINDS } from '../kinds.js';

// Used when a listing has no uploaded photo: matched to the title's keywords (LoremFlickr), stable per item.
const FALLBACK = { food: 'food', craft: 'handmade,craft', service: 'cleaning' };
const photo = (title, kind, id) => {
  const words = title.toLowerCase().match(/[a-z]{4,}/g)?.slice(0, 2) ?? [];
  return `https://loremflickr.com/640/480/${[...words, FALLBACK[kind]].join(',')}?lock=${id}`;
};

// One listing in the browse grid. onAdd is left out when the viewer can't buy.
export default function ItemCard({ item, kind, index, onAdd }) {
  const k = KINDS[kind];
  return (
    <article className="item" style={{ '--i': index }}>
      <img src={item.image_url || photo(item.title, kind, item[k.id])} alt="" loading="lazy" />
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
