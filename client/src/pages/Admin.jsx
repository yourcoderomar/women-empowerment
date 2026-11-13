import { useEffect, useState } from 'react';
import { api } from '../api.js';
import PageHead from '../components/PageHead.jsx';
import Empty from '../components/Empty.jsx';
import Banner from '../components/Banner.jsx';
import { RowSkeletons } from '../components/Skeleton.jsx';

export default function Admin() {
  const [providers, setProviders] = useState(null);
  const [error, setError] = useState('');
  const load = () => api('/users?user_type=provider&verification_status=pending').then(setProviders)
    .catch((e) => { setProviders([]); setError(e.message); });
  useEffect(() => { load(); }, []);

  async function verify(id, verification_status) {
    try { await api(`/providers/${id}/verification`, { method: 'PATCH', body: { verification_status } }); load(); }
    catch (e) { setError(e.message); }
  }

  return (
    <>
      <PageHead eyebrow="Admin" title="Providers waiting">Check each provider's documents, then accept or reject them.</PageHead>
      <Banner msg={error && { error: true, text: error }} />
      {providers === null ? <RowSkeletons count={2} /> : providers.length ? (
        <div className="rows">
          {providers.map((p, i) => (
            <div className="row" key={p.provider_id} style={{ '--i': i }}>
              <span className="avatar">{p.store_name?.[0]}</span>
              <div className="row-main"><strong>{p.store_name}</strong><small className="muted">{p.full_name} · {p.email}</small></div>
              <div className="row-actions">
                <button className="btn sm" onClick={() => verify(p.provider_id, 'accepted')}>Accept</button>
                <button className="btn ghost sm" onClick={() => verify(p.provider_id, 'rejected')}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Empty title="All caught up">No providers are waiting for verification.</Empty>
      )}
    </>
  );
}
