/** Merge partial CSS module class maps while preserving rules defined across multiple partials. */
export function mergeCssModules(
  ...modules: Record<string, string>[]
): Record<string, string> {
  const merged: Record<string, string> = {};
  for (const mod of modules) {
    for (const [key, val] of Object.entries(mod)) {
      if (!val) continue;
      merged[key] = merged[key] ? `${merged[key]} ${val}` : val;
    }
  }

  // Fallback for test environments (e.g. Vitest without css parsing) where
  // CSS module imports are ES Proxies with empty Object.entries().
  return new Proxy(merged, {
    get(target, prop) {
      if (
        typeof prop !== 'string' ||
        prop === 'then' ||
        prop === 'toJSON' ||
        prop === '__esModule' ||
        prop in Object.prototype
      ) {
        return Reflect.get(target, prop);
      }
      if (Object.prototype.hasOwnProperty.call(target, prop)) {
        return target[prop];
      }
      const fallback = new Set<string>();
      for (const mod of modules) {
        const val = mod[prop];
        if (typeof val === 'string' && val) fallback.add(val);
      }
      return fallback.size > 0 ? Array.from(fallback).join(' ') : undefined;
    },
  });
}
