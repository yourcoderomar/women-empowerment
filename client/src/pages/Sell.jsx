import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHead from '../components/PageHead.jsx';
import Empty from '../components/Empty.jsx';
import ItemForm from '../components/ItemForm.jsx';

export default function Sell({ user }) {
  const [kind, setKind] = useState('food');

  if (user.verification_status !== 'accepted') {
    return (
      <>
        <PageHead eyebrow="Sell" title="Waiting for verification" />
        <Empty title={`Status: ${user.verification_status}`}>
          An admin has to accept your documents before you can list items. <Link to="/documents">Upload your documents</Link>.
        </Empty>
      </>
    );
  }

  return (
    <div className="split">
      <div className="split-copy">
        <p className="eyebrow"><Link to="/listings">My shop</Link> / New</p>
        <h1>List something new.</h1>
        <p className="lede">It appears in the market right away. Leave stock empty for things you make to order.
          For services, add time slots afterwards so customers can book.</p>
      </div>
      <div className="panel"><ItemForm kind={kind} onKindChange={setKind} /></div>
    </div>
  );
}
