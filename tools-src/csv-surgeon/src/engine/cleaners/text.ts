export function stripHtmlTags(val: any): { cleaned: string; changed: boolean } {
  if (val === null || val === undefined) return { cleaned: '', changed: false };
  const str = String(val);

  // If text contains HTML tags (e.g. <p>, <span>, <div>, <br>)
  if (/<[a-z][\s\S]*>/i.test(str)) {
    const cleaned = str
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<br\s*[\/]?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\n\s*\n/g, '\n')
      .trim();

    return { cleaned, changed: cleaned !== str };
  }

  return { cleaned: str, changed: false };
}
