import {
  PlatformDestination,
  IssueItem,
  PatternGroup,
  CellDiff,
  RepairLogRecord,
} from '../types/surgeon';
import { autoMapHeader } from './cleaners/headers';
import { cleanWhitespace } from './cleaners/whitespace';
import { cleanPrice } from './cleaners/prices';
import { normalizeAvailability } from './cleaners/availability';
import { cleanUrl } from './cleaners/urls';
import { stripHtmlTags } from './cleaners/text';
import { validateShopifyRow } from './validators/shopify';
import { validateMetaRow } from './validators/meta';
import { validateGoogleMerchantRow } from './validators/googleMerchant';
import { validateGenericRow } from './validators/generic';

export interface ScanAnalysisResult {
  headers: string[];
  rows: Record<string, any>[];
  issues: IssueItem[];
  patternGroups: PatternGroup[];
  diffs: CellDiff[];
  repairLogs: RepairLogRecord[];
  autoFixableCount: number;
  humanInputCount: number;
}

export function analyzeAndScanDataset(
  headers: string[],
  rows: Record<string, any>[],
  platform: PlatformDestination
): ScanAnalysisResult {
  const cleanHeaders: string[] = [];
  const headerMap: Record<string, string> = {}; // orig -> mapped
  const diffs: CellDiff[] = [];
  const repairLogs: RepairLogRecord[] = [];
  const issues: IssueItem[] = [];

  // Step 1: Header Mapping & Whitespace Cleanup
  headers.forEach(h => {
    const ws = cleanWhitespace(h);
    const mapped = autoMapHeader(ws.cleaned, platform);
    cleanHeaders.push(mapped.mapped);
    headerMap[h] = mapped.mapped;

    if (mapped.changed || ws.changed) {
      repairLogs.push({
        row: 0,
        field: h,
        problem: 'Header name alias / whitespace formatting',
        originalValue: h,
        newValue: mapped.mapped,
        repairType: 'HEADER_ALIAS',
      });
    }
  });

  // Remap data row keys to clean headers
  const cleanRows = rows.map(r => {
    const newRow: Record<string, any> = {};
    Object.entries(r).forEach(([k, v]) => {
      const targetHeader = headerMap[k] || k;
      newRow[targetHeader] = v;
    });
    return newRow;
  });

  // Trackers for duplicates
  const existingHandles = new Map<string, number>();
  const existingSkus = new Map<string, number>();
  const existingIds = new Map<string, number>();

  // Pattern Grouping maps e.g. "AVAILABILITY:YES" -> issue ids
  const patternMap = new Map<string, {
    title: string;
    description: string;
    fromValue: string;
    toValue: string;
    issueIds: string[];
  }>();

  // Step 2: Row by Row Scan & Cleaner Evaluation
  cleanRows.forEach((row, idx) => {
    const rowIndex = idx + 1;

    cleanHeaders.forEach(header => {
      const lowerHeader = header.toLowerCase();
      const val = row[header];
      if (val === undefined || val === null) return;

      const strVal = String(val);

      // 1. Whitespace Cleaner
      const ws = cleanWhitespace(strVal);
      if (ws.changed) {
        row[header] = ws.cleaned;
        diffs.push({
          rowIndex,
          field: header,
          before: strVal,
          after: ws.cleaned,
          issueType: 'WHITESPACE',
          category: 'SAFE_AUTO_FIX',
        });
        repairLogs.push({
          row: rowIndex,
          field: header,
          problem: 'Trimmed hidden spaces / line endings',
          originalValue: strVal,
          newValue: ws.cleaned,
          repairType: 'WHITESPACE',
        });
      }

      const currentVal = row[header];
      if (currentVal === undefined || currentVal === null || String(currentVal).trim() === '') return;

      // 2. Price Cleaner
      if (lowerHeader.includes('price') || lowerHeader.includes('cost')) {
        const pr = cleanPrice(currentVal);
        if (pr.changed && pr.isValid) {
          const pKey = `PRICE_FORMAT:${String(currentVal).replace(/[0-9.]/g, '')}`;
          const issueId = `iss_pr_${rowIndex}_${header}`;
          issues.push({
            id: issueId,
            rowIndex,
            field: header,
            originalValue: currentVal,
            suggestedValue: pr.cleaned,
            issueType: 'CURRENCY_PRICE_FORMAT',
            severity: 'WARNING',
            category: 'SAFE_AUTO_FIX',
            message: `Removed currency symbol/comma from price "${currentVal}"`,
            patternKey: pKey,
            isResolved: false,
          });

          if (!patternMap.has(pKey)) {
            patternMap.set(pKey, {
              title: `Remove currency symbols & commas from prices`,
              description: `Format prices as pure numbers (e.g. ₹1,299 → 1299)`,
              fromValue: String(currentVal),
              toValue: pr.cleaned,
              issueIds: [],
            });
          }
          patternMap.get(pKey)!.issueIds.push(issueId);
        }
      }

      // 3. Availability Cleaner
      if (lowerHeader.includes('stock') || lowerHeader.includes('availability') || lowerHeader.includes('qty')) {
        const av = normalizeAvailability(currentVal, platform);
        if (av.changed && av.isRecognized) {
          const pKey = `AVAILABILITY:${String(currentVal).toUpperCase().trim()}`;
          const issueId = `iss_av_${rowIndex}_${header}`;
          issues.push({
            id: issueId,
            rowIndex,
            field: header,
            originalValue: currentVal,
            suggestedValue: av.cleaned,
            issueType: 'UNSUPPORTED_AVAILABILITY_WORD',
            severity: 'WARNING',
            category: 'SAFE_AUTO_FIX',
            message: `Normalized availability value "${currentVal}" to "${av.cleaned}"`,
            patternKey: pKey,
            isResolved: false,
          });

          if (!patternMap.has(pKey)) {
            patternMap.set(pKey, {
              title: `Normalize availability wording "${String(currentVal).trim()}"`,
              description: `Convert values like "${String(currentVal).trim()}" to platform standard "${av.cleaned}"`,
              fromValue: String(currentVal),
              toValue: av.cleaned,
              issueIds: [],
            });
          }
          patternMap.get(pKey)!.issueIds.push(issueId);
        }
      }

      // 4. URL Cleaner
      if (lowerHeader.includes('url') || lowerHeader.includes('link') || lowerHeader.includes('src') || lowerHeader.includes('image')) {
        const ur = cleanUrl(currentVal);
        if (ur.changed) {
          const pKey = `URL_ENCODE_PROTOCOL`;
          const issueId = `iss_ur_${rowIndex}_${header}`;
          issues.push({
            id: issueId,
            rowIndex,
            field: header,
            originalValue: currentVal,
            suggestedValue: ur.cleaned,
            issueType: 'MALFORMED_URL_SPACES',
            severity: 'WARNING',
            category: 'SAFE_AUTO_FIX',
            message: `Encoded spaces / inferred protocol for URL "${currentVal}"`,
            patternKey: pKey,
            isResolved: false,
          });

          if (!patternMap.has(pKey)) {
            patternMap.set(pKey, {
              title: `Clean up URL spaces and protocols`,
              description: `Encode unescaped spaces and infer https:// protocol`,
              fromValue: String(currentVal),
              toValue: ur.cleaned,
              issueIds: [],
            });
          }
          patternMap.get(pKey)!.issueIds.push(issueId);
        }
      }

      // 5. HTML Tags Strip Cleaner
      if (platform === 'META' || platform === 'GOOGLE') {
        if (lowerHeader.includes('description') || lowerHeader.includes('title')) {
          const ht = stripHtmlTags(currentVal);
          if (ht.changed) {
            const pKey = `STRIP_HTML_TAGS`;
            const issueId = `iss_ht_${rowIndex}_${header}`;
            issues.push({
              id: issueId,
              rowIndex,
              field: header,
              originalValue: currentVal,
              suggestedValue: ht.cleaned,
              issueType: 'ACCIDENTAL_HTML_TAGS',
              severity: 'WARNING',
              category: 'SAFE_AUTO_FIX',
              message: `Stripped HTML formatting tags from ${header}`,
              patternKey: pKey,
              isResolved: false,
            });

            if (!patternMap.has(pKey)) {
              patternMap.set(pKey, {
                title: `Strip HTML tags from product fields`,
                description: `Remove <p>, <span>, and formatting tags for feed compatibility`,
                fromValue: String(currentVal).substring(0, 30) + '...',
                toValue: ht.cleaned.substring(0, 30) + '...',
                issueIds: [],
              });
            }
            patternMap.get(pKey)!.issueIds.push(issueId);
          }
        }
      }
    });

    // Step 3: Destination Platform Specific Validations
    let platformIssues: IssueItem[] = [];
    if (platform === 'SHOPIFY') {
      platformIssues = validateShopifyRow(row, rowIndex, existingHandles, existingSkus);
    } else if (platform === 'META') {
      platformIssues = validateMetaRow(row, rowIndex, existingIds);
    } else if (platform === 'GOOGLE') {
      platformIssues = validateGoogleMerchantRow(row, rowIndex, existingIds);
    } else {
      platformIssues = validateGenericRow(row, rowIndex, existingIds);
    }

    issues.push(...platformIssues);
  });

  // Step 4: Build PatternGroups array
  const patternGroups: PatternGroup[] = [];
  patternMap.forEach((data, pKey) => {
    if (data.issueIds.length > 0) {
      patternGroups.push({
        patternKey: pKey,
        title: data.title,
        description: data.description,
        affectedRowsCount: data.issueIds.length,
        issueIds: data.issueIds,
        fromValueSample: data.fromValue,
        toValueSample: data.toValue,
      });
    }
  });

  const autoFixableCount = issues.filter(i => i.category === 'SAFE_AUTO_FIX').length;
  const humanInputCount = issues.filter(i => i.category === 'NEEDS_CONFIRMATION' || i.category === 'CANNOT_DETERMINE').length;

  return {
    headers: cleanHeaders,
    rows: cleanRows,
    issues,
    patternGroups,
    diffs,
    repairLogs,
    autoFixableCount,
    humanInputCount,
  };
}

export function executeBatchPatternFix(
  patternKey: string,
  rows: Record<string, any>[],
  issues: IssueItem[]
): { updatedRows: Record<string, any>[]; updatedIssues: IssueItem[]; newDiffs: CellDiff[] } {
  const targetIssues = issues.filter(i => i.patternKey === patternKey && !i.isResolved);
  const newDiffs: CellDiff[] = [];

  const updatedRows = [...rows];
  const updatedIssues = issues.map(iss => {
    if (iss.patternKey === patternKey && !iss.isResolved && iss.suggestedValue !== undefined) {
      const rIdx = iss.rowIndex - 1;
      if (updatedRows[rIdx]) {
        const origVal = updatedRows[rIdx][iss.field];
        updatedRows[rIdx] = { ...updatedRows[rIdx], [iss.field]: iss.suggestedValue };
        newDiffs.push({
          rowIndex: iss.rowIndex,
          field: iss.field,
          before: String(origVal),
          after: String(iss.suggestedValue),
          issueType: iss.issueType,
          category: iss.category,
        });
      }
      return {
        ...iss,
        isResolved: true,
        resolvedValue: iss.suggestedValue,
        resolvedType: 'PATTERN' as const,
      };
    }
    return iss;
  });

  return { updatedRows, updatedIssues, newDiffs };
}
