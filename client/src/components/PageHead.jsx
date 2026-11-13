export default function PageHead({ eyebrow, title, children }) {
  return (
    <div className="pagehead">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {children && <p className="lede">{children}</p>}
    </div>
  );
}
