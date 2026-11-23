import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, uploadImage } from '../api.js';
import { DOC_TYPES } from '../docTypes.js';
import Field from '../components/Field.jsx';
import Banner from '../components/Banner.jsx';
import { RowSkeletons } from '../components/Skeleton.jsx';

const STATUS = {
  pending: ['pending', 'Waiting for an admin', 'Upload your documents below. An admin checks them and accepts your shop.'],
  accepted: ['completed', 'Verified', 'Your shop is live. You can keep your documents up to date here.'],
  rejected: ['cancelled', 'Not accepted', 'An admin did not accept your documents. Check they are clear and complete.'],
};

// A provider's verification documents (photos or scans).
export default function Documents({ user }) {
  const [docs, setDocs] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const load = () => api('/documents').then(setDocs).catch((e) => { setDocs([]); setMsg({ error: true, text: e.message }); });
  useEffect(() => { load(); }, []);

  async function upload(e) {
    e.preventDefault();
    const form = e.target;
    const { document_type, file } = Object.fromEntries(new FormData(form));
    setBusy(true);
    try {
      const file_url = await uploadImage(file);
      await api('/documents', { method: 'POST', body: { document_type, file_url } });
      form.reset();
      setMsg({ text: `${DOC_TYPES[document_type]} uploaded.` });
      load();
    } catch (err) { setMsg({ error: true, text: err.message }); }
    setBusy(false);
  }

  async function remove(doc) {
    if (!confirm(`Remove your ${DOC_TYPES[doc.document_type]}?`)) return;
    try { await api(`/documents/${doc.document_id}`, { method: 'DELETE' }); load(); }
    catch (e) { setMsg({ error: true, text: e.message }); }
  }

  const [tone, title, text] = STATUS[user.verification_status] ?? STATUS.pending;
  const missing = docs ? Object.keys(DOC_TYPES).filter((t) => !docs.some((d) => d.document_type === t)) : [];

  return (
    <>
      <div className="pagehead">
        <p className="eyebrow">Verification</p>
        <h1>Your documents</h1>
      </div>
      <div className="status-card">
        <span className={`pill ${tone}`}>{title}</span>
        <p>{text} {user.verification_status === 'accepted' && <Link to="/listings">Go to My shop</Link>}</p>
      </div>
      <Banner msg={msg} onClose={() => setMsg(null)} />

      <div className="checkout">
        <section>
          {docs === null ? <RowSkeletons count={2} /> : (
            <div className="rows">
              {Object.entries(DOC_TYPES).map(([type, label]) => {
                const list = docs.filter((d) => d.document_type === type);
                return (
                  <div className="row doc-row" key={type}>
                    <div className="row-main">
                      <strong>{label}</strong>
                      <small className="muted">{list.length ? `Uploaded ${new Date(list[0].uploaded_at).toLocaleDateString()}` : 'Not uploaded yet'}</small>
                    </div>
                    <div className="row-actions">
                      {list.map((d) => (
                        <span key={d.document_id} className="doc-chip">
                          <a href={d.file_url} target="_blank" rel="noreferrer">View</a>
                          <button className="link" onClick={() => remove(d)} aria-label={`Remove ${label}`}>×</button>
                        </span>
                      ))}
                      {!list.length && <span className="pill">Missing</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <form className="panel form summary" onSubmit={upload}>
          <h2>Upload a document</h2>
          <Field label="Document">
            <select name="document_type" defaultValue={missing[0] ?? 'id_card'} key={missing[0]}>
              {Object.entries(DOC_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="Photo or scan" hint="JPEG, PNG or WebP, up to 2 MB. Make sure the text is readable.">
            <input name="file" type="file" accept="image/jpeg,image/png,image/webp" required />
          </Field>
          <button className="btn wide" disabled={busy}>{busy ? 'Uploading…' : 'Upload'}</button>
        </form>
      </div>
    </>
  );
}
