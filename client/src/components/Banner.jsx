// A dismissible message: { text, error }.
export default function Banner({ msg, onClose }) {
  if (!msg) return null;
  return (
    <p className={msg.error ? 'banner error' : 'banner'} role={msg.error ? 'alert' : 'status'}>
      {msg.text}
      {onClose && <button onClick={onClose} aria-label="Dismiss">×</button>}
    </p>
  );
}
