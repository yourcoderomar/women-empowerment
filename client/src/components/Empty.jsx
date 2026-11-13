export default function Empty({ title, children }) {
  return (
    <div className="empty">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M3 7l9-4 9 4-9 4-9-4z" /><path d="M3 7v10l9 4 9-4V7" /><path d="M12 11v10" />
      </svg>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
