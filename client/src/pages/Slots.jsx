import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import Field from '../components/Field.jsx';
import Empty from '../components/Empty.jsx';
import Banner from '../components/Banner.jsx';
import { RowSkeletons } from '../components/Skeleton.jsx';

const time = (t) => t?.slice(0, 5);
const day = (d) => new Date(d).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const today = () => new Date().toISOString().slice(0, 10);

// The times customers can book one of the provider's services.
export default function Slots({ user }) {
  const { id } = useParams();
  const [service, setService] = useState(undefined);
  const [slots, setSlots] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => api(`/slots?service_id=${id}`)
    .then((list) => setSlots(list.sort((a, b) => `${a.slot_date}${a.start_time}`.localeCompare(`${b.slot_date}${b.start_time}`))))
    .catch((e) => { setSlots([]); setMsg({ error: true, text: e.message }); });

  useEffect(() => {
    api(`/services/${id}`).then((s) => setService(s.provider_id === user.provider_id ? s : null)).catch(() => setService(null));
    load();
  }, [id]);

  async function add(e) {
    e.preventDefault();
    const body = { service_id: Number(id), ...Object.fromEntries(new FormData(e.target)) };
    if (body.end_time <= body.start_time) return setMsg({ error: true, text: 'The end time must be after the start time.' });
    setBusy(true);
    try {
      await api('/slots', { method: 'POST', body });
      setMsg({ text: `Added ${day(body.slot_date)}, ${body.start_time}–${body.end_time}.` });
      load();
    } catch (err) { setMsg({ error: true, text: err.message }); }
    setBusy(false);
  }

  async function remove(slot) {
    try { await api(`/slots/${slot.slot_id}`, { method: 'DELETE' }); load(); }
    catch (e) { setMsg({ error: true, text: e.message }); }
  }

  if (service === undefined) return <RowSkeletons />;
  if (service === null) return <Empty title="Service not found">It doesn't exist or isn't yours. <Link to="/listings">Back to My shop</Link></Empty>;

  const free = slots?.filter((s) => !s.is_booked).length ?? 0;

  return (
    <>
      <div className="pagehead">
        <p className="eyebrow"><Link to="/listings">My shop</Link> / Time slots</p>
        <h1>{service.title}</h1>
        <p className="lede">Customers pick one of these free times when they book. Booked times can't be changed.</p>
      </div>
      <Banner msg={msg} onClose={() => setMsg(null)} />

      <div className="checkout">
        <section>
          {slots === null ? <RowSkeletons /> : slots.length ? (
            <div className="rows">
              {slots.map((s, i) => (
                <div className="row slot-row" key={s.slot_id} style={{ '--i': i }}>
                  <div className="row-main">
                    <strong>{day(s.slot_date)}</strong>
                    <small className="muted mono">{time(s.start_time)}–{time(s.end_time)}</small>
                  </div>
                  <span className={s.is_booked ? 'pill accepted' : 'pill completed'}>{s.is_booked ? 'Booked' : 'Free'}</span>
                  <div className="row-actions">
                    {!s.is_booked && <button className="btn ghost sm danger" onClick={() => remove(s)}>Remove</button>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty title="No times yet">Customers can't book this service until you add at least one free time.</Empty>
          )}
          {slots?.length > 0 && !free && <p className="banner error" style={{ marginTop: 16 }}>Every time is booked. Add more so customers can keep booking.</p>}
        </section>

        <form className="panel form summary" onSubmit={add}>
          <h2>Add a time</h2>
          <Field label="Date"><input name="slot_date" type="date" min={today()} required /></Field>
          <div className="two">
            <Field label="From"><input name="start_time" type="time" required /></Field>
            <Field label="To"><input name="end_time" type="time" required /></Field>
          </div>
          <small className="muted">This service takes {service.hours_needed} hr.</small>
          <button className="btn wide" disabled={busy}>{busy ? 'Adding…' : 'Add time'}</button>
        </form>
      </div>
    </>
  );
}
