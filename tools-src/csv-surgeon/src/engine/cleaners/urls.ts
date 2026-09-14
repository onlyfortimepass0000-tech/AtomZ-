export function cleanUrl(val: any): { cleaned: string; changed: boolean; isValid: boolean } {
  if (val === null || val === undefined || String(val).trim() === '') {
    return { cleaned: '', changed: false, isValid: false };
  }

  let str = String(val).trim();

  // URL-encode unencoded spaces inside URL
  if (str.includes(' ')) {
    str = str.replace(/ /g, '%20');
  }

  // Infer protocol if missing safe domain format (e.g. brand.com/shoes -> https://brand.com/shoes)
  if (!/^https?:\/\//i.test(str) && /^[a-zA-Z0-9.\-]+[a-zA-Z]{2,}\/.*$/.test(str)) {
    str = `https://${str}`;
  }

  // Validate URL structure
  let isValid = false;
  try {
    const parsed = new URL(str);
    isValid = parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    isValid = false;
  }

  return {
    cleaned: str,
    changed: str !== String(val).trim(),
    isValid,
  };
}
