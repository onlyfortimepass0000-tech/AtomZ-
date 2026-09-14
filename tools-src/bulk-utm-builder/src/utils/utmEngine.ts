import { NamingRules, URLItem, UTMConfig } from '../types';

/**
 * Sanitizes a single parameter value according to naming rules.
 */
export function sanitizeUtmValue(value: string, rules: NamingRules): string {
  if (!value) return '';

  let result = value.trim();

  if (rules.forceLowercase) {
    result = result.toLowerCase();
  }

  // Replace spaces
  const replacementChar = rules.spaceReplacement === 'hyphen' ? '-' : '_';
  result = result.replace(/\s+/g, replacementChar);

  if (rules.removeSpecialChars) {
    // Keep alphanumeric, hyphens, underscores
    result = result.replace(/[^a-zA-Z0-9_\-]/g, '');
  }

  return result;
}

/**
 * Parses a raw URL line and constructs a tracked UTM URL item.
 */
export function processUrlLine(
  rawUrlLine: string,
  index: number,
  globalUtm: UTMConfig,
  rules: NamingRules,
  itemCustomOverrides?: Partial<UTMConfig>
): URLItem {
  const trimmed = rawUrlLine.trim();

  if (!trimmed) {
    return {
      id: `url-${index}-${Date.now()}`,
      rawUrl: '',
      cleanBaseUrl: '',
      isValid: false,
      errorMessage: 'Empty line',
      hasExistingUtms: false,
      source: '',
      medium: '',
      campaign: '',
      content: '',
      term: '',
      generatedUrl: '',
      isDuplicate: false,
    };
  }

  // Ensure protocol
  let urlToParse = trimmed;
  if (!/^https?:\/\//i.test(urlToParse)) {
    urlToParse = 'https://' + urlToParse;
  }

  try {
    const parsedUrl = new URL(urlToParse);

    // Check existing UTMs
    const existingParams = parsedUrl.searchParams;
    const hasExistingSource = existingParams.has('utm_source');
    const hasExistingMedium = existingParams.has('utm_medium');
    const hasExistingCampaign = existingParams.has('utm_campaign');
    const hasExistingUtms =
      hasExistingSource ||
      hasExistingMedium ||
      hasExistingCampaign ||
      existingParams.has('utm_content') ||
      existingParams.has('utm_term');

    if (rules.existingUtmHandling === 'skip' && hasExistingUtms) {
      return {
        id: `url-${index}`,
        rawUrl: trimmed,
        cleanBaseUrl: parsedUrl.origin + parsedUrl.pathname,
        isValid: true,
        errorMessage: 'Skipped (URL already contains tracking parameters)',
        hasExistingUtms: true,
        source: existingParams.get('utm_source') || '',
        medium: existingParams.get('utm_medium') || '',
        campaign: existingParams.get('utm_campaign') || '',
        content: existingParams.get('utm_content') || '',
        term: existingParams.get('utm_term') || '',
        generatedUrl: urlToParse,
        isDuplicate: false,
      };
    }

    // Determine final values (item overrides > global config > existing values)
    const effectiveSource =
      itemCustomOverrides?.source ??
      (rules.existingUtmHandling === 'keep' && hasExistingSource
        ? existingParams.get('utm_source') || ''
        : globalUtm.source);

    const effectiveMedium =
      itemCustomOverrides?.medium ??
      (rules.existingUtmHandling === 'keep' && hasExistingMedium
        ? existingParams.get('utm_medium') || ''
        : globalUtm.medium);

    const effectiveCampaign =
      itemCustomOverrides?.campaign ??
      (rules.existingUtmHandling === 'keep' && hasExistingCampaign
        ? existingParams.get('utm_campaign') || ''
        : globalUtm.campaign);

    const effectiveContent =
      itemCustomOverrides?.content ??
      (rules.existingUtmHandling === 'keep' && existingParams.has('utm_content')
        ? existingParams.get('utm_content') || ''
        : globalUtm.content);

    const effectiveTerm =
      itemCustomOverrides?.term ??
      (rules.existingUtmHandling === 'keep' && existingParams.has('utm_term')
        ? existingParams.get('utm_term') || ''
        : globalUtm.term);

    // Sanitize values
    const cleanSource = sanitizeUtmValue(effectiveSource, rules);
    const cleanMedium = sanitizeUtmValue(effectiveMedium, rules);
    const cleanCampaign = sanitizeUtmValue(effectiveCampaign, rules);
    const cleanContent = sanitizeUtmValue(effectiveContent, rules);
    const cleanTerm = sanitizeUtmValue(effectiveTerm, rules);

    // Construct query parameters
    const finalUrl = new URL(urlToParse);

    if (rules.existingUtmHandling === 'replace') {
      finalUrl.searchParams.delete('utm_source');
      finalUrl.searchParams.delete('utm_medium');
      finalUrl.searchParams.delete('utm_campaign');
      finalUrl.searchParams.delete('utm_content');
      finalUrl.searchParams.delete('utm_term');
    }

    if (cleanSource) finalUrl.searchParams.set('utm_source', cleanSource);
    if (cleanMedium) finalUrl.searchParams.set('utm_medium', cleanMedium);
    if (cleanCampaign) finalUrl.searchParams.set('utm_campaign', cleanCampaign);
    if (cleanContent) finalUrl.searchParams.set('utm_content', cleanContent);
    if (cleanTerm) finalUrl.searchParams.set('utm_term', cleanTerm);

    return {
      id: `url-${index}`,
      rawUrl: trimmed,
      cleanBaseUrl: finalUrl.origin + finalUrl.pathname,
      isValid: true,
      hasExistingUtms,
      source: cleanSource,
      medium: cleanMedium,
      campaign: cleanCampaign,
      content: cleanContent,
      term: cleanTerm,
      generatedUrl: finalUrl.toString(),
      isDuplicate: false,
    };
  } catch (err) {
    return {
      id: `url-${index}`,
      rawUrl: trimmed,
      cleanBaseUrl: trimmed,
      isValid: false,
      errorMessage: 'Invalid URL syntax (e.g. https://domain.com)',
      hasExistingUtms: false,
      source: '',
      medium: '',
      campaign: '',
      content: '',
      term: '',
      generatedUrl: trimmed,
      isDuplicate: false,
    };
  }
}

/**
 * Processes multiple raw text lines into URL items and flags duplicate generated links.
 */
export function processBulkUrls(
  rawText: string,
  globalUtm: UTMConfig,
  rules: NamingRules
): URLItem[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const items = lines.map((line, idx) => processUrlLine(line, idx, globalUtm, rules));

  // Flag duplicate generated URLs
  const seenUrls = new Set<string>();
  return items.map((item) => {
    if (!item.isValid) return item;
    const isDup = seenUrls.has(item.generatedUrl);
    seenUrls.add(item.generatedUrl);
    return {
      ...item,
      isDuplicate: isDup,
    };
  });
}

/**
 * Generates CSV string content for export.
 */
export function generateCSVContent(items: URLItem[]): string {
  const headers = [
    'Original URL',
    'Source',
    'Medium',
    'Campaign',
    'Content',
    'Term',
    'Generated Tracked URL',
  ];

  const escapeCSV = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;

  const rows = items
    .filter((i) => i.isValid)
    .map((item) => [
      escapeCSV(item.rawUrl),
      escapeCSV(item.source),
      escapeCSV(item.medium),
      escapeCSV(item.campaign),
      escapeCSV(item.content),
      escapeCSV(item.term),
      escapeCSV(item.generatedUrl),
    ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Generates plain TXT string of tracked URLs.
 */
export function generateTXTContent(items: URLItem[]): string {
  return items
    .filter((i) => i.isValid)
    .map((i) => i.generatedUrl)
    .join('\n');
}
