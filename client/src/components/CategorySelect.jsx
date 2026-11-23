import { useEffect, useState } from 'react';
import { api } from '../api.js';

// Categories grouped under their parent (Homemade Food → Cakes & Desserts, ...).
export default function CategorySelect({ defaultValue }) {
  const [cats, setCats] = useState(null);
  const [value, setValue] = useState(defaultValue == null ? '' : String(defaultValue));
  useEffect(() => { api('/categories').then(setCats).catch(() => setCats([])); }, []);

  if (cats === null) return <select disabled><option>Loading…</option></select>;
  const top = cats.filter((c) => !c.parent_category_id);
  return (
    <select name="category_id" value={value} onChange={(e) => setValue(e.target.value)}>
      <option value="">No category</option>
      {top.map((t) => (
        <optgroup key={t.category_id} label={t.category_name}>
          <option value={t.category_id}>{t.category_name} (general)</option>
          {cats.filter((c) => c.parent_category_id === t.category_id).map((c) => (
            <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
