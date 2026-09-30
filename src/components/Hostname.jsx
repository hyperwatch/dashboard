// A hostname (or the address, without one). Those confirmed by a forward DNS
// lookup get a ✓, drawn by the stylesheet so it isn't copied with the name.
export default function Hostname({ value, verified, className = 'text-cyan' }) {
  if (!value) return null;
  if (!verified) return <span className={className}>{value}</span>;
  return (
    <span
      className={`${className} after:content-['✓'] after:text-green after:text-[0.9em] after:ml-[0.3em]`}
      title="Verified: the hostname resolves back to this address"
    >
      {value}
    </span>
  );
}
