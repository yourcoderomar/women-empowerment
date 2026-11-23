import { useEffect, useState } from 'react';
import { KINDS } from './kinds.js';

// The backend only accepts orders where every item comes from one provider, so the cart holds one store at a time.
// Kept in localStorage so a refresh doesn't empty it.
const load = () => { try { return JSON.parse(localStorage.getItem('cart')) || []; } catch { return []; } };

export function useCart() {
  const [lines, setLines] = useState(load);
  useEffect(() => { try { localStorage.setItem('cart', JSON.stringify(lines)); } catch { /* storage off: cart lives in memory */ } }, [lines]);

  // Returns false if the user kept their cart from another store.
  function add(kind, item) {
    const k = KINDS[kind];
    if (lines.length && lines[0].provider_id !== item.provider_id &&
        !confirm(`Your cart has items from ${lines[0].store_name}. One order can only come from one store. Empty the cart and add this instead?`)) {
      return false;
    }
    const key = `${kind}-${item[k.id]}`;
    setLines((prev) => {
      const same = prev[0]?.provider_id === item.provider_id ? prev : [];
      const found = same.find((l) => l.key === key);
      if (found) return same.map((l) => (l.key === key && kind !== 'service' ? { ...l, qty: l.qty + 1 } : l));
      return [...same, {
        key, kind, item_id: item[k.id], title: item.title, store_name: item.store_name, provider_id: item.provider_id,
        // A service is priced as hourly rate × hours, like DomesticServiceModel.unitPrice on the backend.
        unit: kind === 'service' ? item.hourly_rate * item.hours_needed : Number(item.price),
        hours: item.hours_needed, qty: 1, slot_id: null,
      }];
    });
    return true;
  }

  const update = (key, change) => setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...change } : l)));
  const remove = (key) => setLines((prev) => prev.filter((l) => l.key !== key));
  const clear = () => setLines([]);
  const count = lines.reduce((n, l) => n + l.qty, 0);

  return { lines, count, add, update, remove, clear };
}
