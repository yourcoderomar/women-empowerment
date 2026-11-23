import { useEffect, useState } from 'react';
import { api } from '../api.js';

const time = (t) => t?.slice(0, 5);

// Free appointment times for one service.
export default function SlotPicker({ serviceId, value, onChange }) {
  const [slots, setSlots] = useState(null);
  useEffect(() => {
    api(`/slots?service_id=${serviceId}&is_booked=false`).then(setSlots).catch(() => setSlots([]));
  }, [serviceId]);

  if (slots === null) return <div className="ph" style={{ height: 40 }} />;
  if (!slots.length) return <small className="error">No free times for this service right now. Remove it or try later.</small>;
  return (
    <select value={value ?? ''} onChange={(e) => onChange(Number(e.target.value) || null)} required>
      <option value="">Choose a time</option>
      {slots.map((s) => (
        <option key={s.slot_id} value={s.slot_id}>
          {new Date(s.slot_date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })} · {time(s.start_time)}–{time(s.end_time)}
        </option>
      ))}
    </select>
  );
}
