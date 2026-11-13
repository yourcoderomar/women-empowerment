// Loading placeholders shaped like the content they stand in for.
export function CardSkeletons({ count = 5 }) {
  return (
    <div className="grid">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="item skeleton"><div className="ph img" /><div className="ph line" /><div className="ph line short" /></div>
      ))}
    </div>
  );
}

export function RowSkeletons({ count = 3 }) {
  return <div className="rows">{Array.from({ length: count }, (_, i) => <div key={i} className="ph row-ph" />)}</div>;
}
