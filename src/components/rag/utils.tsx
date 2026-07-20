export function isValidUrl(s: string) {
  try { return !!new URL(s); } catch { return false; }
}

export function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

export function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function highlightText(text: string, q: string): (string | React.ReactNode)[] {
  if (!q.trim()) return [text];
  const escaped = escapeRegex(q);
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return parts.map((p, i) =>
    p.toLowerCase() === q.toLowerCase() ? <strong key={i}>{p}</strong> : p
  );
}
