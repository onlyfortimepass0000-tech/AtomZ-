export function cleanWhitespace(val: any): { cleaned: string; changed: boolean } {
  if (val === null || val === undefined) return { cleaned: '', changed: false };
  const str = String(val);

  // Remove BOM, zero-width space, non-breaking space, hidden control chars
  const stripped = str
    .replace(/[\uFEFF\u200B\u00A0\u200C\u200D]/g, '')
    .replace(/[\x00-\x09\x0B-\x1F\x7F]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();

  return {
    cleaned: stripped,
    changed: stripped !== str,
  };
}
