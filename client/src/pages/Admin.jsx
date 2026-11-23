import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { DOC_TYPES } from '../docTypes.js';
import PageHead from '../components/PageHead.jsx';
import Empty from '../components/Empty.jsx';
import Banner from '../components/Banner.jsx';
import { RowSkeletons } from '../components/Skeleton.jsx';

// Pending providers with the documents they uploaded, so the admin can check them before accepting.
export default function Admin() {
  const [providers, setProviders] = useState(null);
  const [open, setOpen] = useState(null);
  const [error, setError] = useState('');

  const load = () => api('/users?user_type=provider&verification_status=pending')
    .then((list) => Promise.all(list.map((p) =>
      api(`/documents?provider_id=${p.provider_id}`).then((docs) => ({ ...p, docs })).catch(() => ({ ...p, docs: [] })))))
    .then(setProviders)
    .catch((e) => { setProviders([]); setError(e.message); });
  useEffect(() => { load(); }, []);

  async function verify(p, verification_status) {
    if (verification_status === 'accepted' && !p.docs.length &&
        !confirm(`${p.store_name} hasn't uploaded any documents. Accept anyway?`)) return;
    try { await api(`/providers/${p.provider_id}/verification`, { method: 'PATCH', body: { verification_status } }); load(); }
    catch (e) { setError(e.message); }
  }

  return (
    <>
      <PageHead eyebrow="Admin" title="Providers waiting">Open each provider's documents, check them, then accept or reject.</PageHead>
      <Banner msg={error && { error: true, text: error }} onClose={() => setError('')} />
      {providers === null ? <RowSkeletons count={2} /> : providers.length ? (
        <div className="rows">
          {providers.map((p, i) => (
            <div key={p.provider_id} style={{ '--i': i }} className="listing">
              <div className="row admin-row">
                <span className="avatar">{p.store_name?.[0]}</span>
                <div className="row-main"><strong>{p.store_name}</strong><small className="muted">{p.full_name} · {p.email}</small></div>
                <button className="btn ghost sm" onClick={() => setOpen(open === p.provider_id ? null : p.provider_id)}>
                  {p.docs.length ? `Documents (${p.docs.length})` : 'No documents'}
                </button>
                <div className="row-actions">
                  <button className="btn sm" onClick={() => verify(p, 'accepted')}>Accept</button>
                  <button className="btn ghost sm" onClick={() => verify(p, 'rejected')}>Reject</button>
                </div>
              </div>
              {open === p.provider_id && (
                <div className="edit-panel">
                  {p.docs.length ? (
                    <div className="doc-grid">
                      {p.docs.map((d) => (
                        <a key={d.document_id} className="doc-tile" href={d.file_url} target="_blank" rel="noreferrer">
                          {/\.(jpe?g|png|webp)$/i.test(d.file_url)
                            // Not previewable (PDF, broken link): the tile just opens the file.
                            ? <img src={d.file_url} alt={DOC_TYPES[d.document_type]} onError={(e) => e.currentTarget.replaceWith(Object.assign(document.createElement('div'), { className: 'doc-file', textContent: 'Open file' }))} />
                            : <div className="doc-file">Open file</div>}
                          <span>{DOC_TYPES[d.document_type] ?? d.document_type}</span>
                        </a>
                      ))}
                    </div>
                  ) : <p className="muted" style={{ margin: 0 }}>This provider hasn't uploaded any documents yet.</p>}
                  {p.national_id && <p className="muted" style={{ margin: '12px 0 0' }}>National ID number: <span className="mono">{p.national_id}</span></p>}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Empty title="All caught up">No providers are waiting for verification.</Empty>
      )}
    </>
  );
}
