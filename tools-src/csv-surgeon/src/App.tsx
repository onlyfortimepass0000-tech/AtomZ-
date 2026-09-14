import React, { useState } from 'react';
import {
  AppStage,
  PlatformDestination,
  IssueItem,
  PatternGroup,
  CellDiff,
  RepairLogRecord,
} from './types/surgeon';
import { Header } from './components/Header';
import { StageUpload } from './components/StageUpload';
import { StageDestination } from './components/StageDestination';
import { StageScan } from './components/StageScan';
import { StageAutoFixSummary } from './components/StageAutoFixSummary';
import { HumanReviewCard } from './components/HumanReviewCard';
import { StageComplete } from './components/StageComplete';
import { analyzeAndScanDataset, executeBatchPatternFix } from './engine/repairEngine';

export function App() {
  const [stage, setStage] = useState<AppStage>('UPLOAD');
  const [fileName, setFileName] = useState<string>('');
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawDataRows, setRawDataRows] = useState<Record<string, any>[]>([]);

  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [platform, setPlatform] = useState<PlatformDestination>('SHOPIFY');

  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [patternGroups, setPatternGroups] = useState<PatternGroup[]>([]);
  const [diffs, setDiffs] = useState<CellDiff[]>([]);
  const [repairLogs, setRepairLogs] = useState<RepairLogRecord[]>([]);

  const [autoRepairedCount, setAutoRepairedCount] = useState<number>(0);
  const [humanFixedCount, setHumanFixedCount] = useState<number>(0);
  const [humanReviewIndex, setHumanReviewIndex] = useState<number>(0);

  const [historyStack, setHistoryStack] = useState<Array<{
    headers: string[];
    rows: Record<string, any>[];
    issues: IssueItem[];
    diffs: CellDiff[];
  }>>([]);

  // File Uploaded handler
  const handleFileLoaded = (name: string, hdrs: string[], data: Record<string, any>[]) => {
    setFileName(name);
    setRawHeaders(hdrs);
    setRawDataRows(data);
    setHeaders(hdrs);
    setRows(data);
    setStage('DESTINATION');
  };

  // Destination Selected handler
  const handleDestinationSelected = (dest: PlatformDestination) => {
    setPlatform(dest);
    setStage('SCANNING');
  };

  // Scan Finished handler
  const handleScanFinished = () => {
    const analysis = analyzeAndScanDataset(headers, rows, platform);
    setHeaders(analysis.headers);
    setRows(analysis.rows);
    setIssues(analysis.issues);
    setPatternGroups(analysis.patternGroups);
    setDiffs(analysis.diffs);
    setRepairLogs(analysis.repairLogs);
    setStage('SUMMARY');
  };

  // Fix Everything Safe handler
  const handleFixAllSafe = () => {
    // Save state to history for undo
    setHistoryStack(prev => [...prev, { headers, rows, issues, diffs }]);

    let currentRows = [...rows];
    let currentIssues = [...issues];
    let currentDiffs = [...diffs];
    let fixCount = 0;

    // Apply all pattern groups
    patternGroups.forEach(group => {
      const batchRes = executeBatchPatternFix(group.patternKey, currentRows, currentIssues);
      currentRows = batchRes.updatedRows;
      currentIssues = batchRes.updatedIssues;
      currentDiffs.push(...batchRes.newDiffs);
      fixCount += group.affectedRowsCount;
    });

    // Auto-fix remaining safe issues
    currentIssues = currentIssues.map(iss => {
      if (iss.category === 'SAFE_AUTO_FIX' && !iss.isResolved && iss.suggestedValue !== undefined) {
        const rIdx = iss.rowIndex - 1;
        if (currentRows[rIdx]) {
          const origVal = currentRows[rIdx][iss.field];
          currentRows[rIdx] = { ...currentRows[rIdx], [iss.field]: iss.suggestedValue };
          currentDiffs.push({
            rowIndex: iss.rowIndex,
            field: iss.field,
            before: String(origVal),
            after: String(iss.suggestedValue),
            issueType: iss.issueType,
            category: iss.category,
          });
          fixCount++;
        }
        return { ...iss, isResolved: true, resolvedValue: iss.suggestedValue, resolvedType: 'AUTO' as const };
      }
      return iss;
    });

    setRows(currentRows);
    setIssues(currentIssues);
    setDiffs(currentDiffs);
    setAutoRepairedCount(prev => prev + fixCount);
    setPatternGroups([]);

    const remainingHuman = currentIssues.filter(i => (i.category === 'NEEDS_CONFIRMATION' || i.category === 'CANNOT_DETERMINE') && !i.isResolved);
    if (remainingHuman.length > 0) {
      setHumanReviewIndex(0);
      setStage('HUMAN_REVIEW');
    } else {
      setStage('COMPLETE');
    }
  };

  // Apply single pattern fix
  const handleApplyPatternFix = (patternKey: string) => {
    setHistoryStack(prev => [...prev, { headers, rows, issues, diffs }]);
    const batchRes = executeBatchPatternFix(patternKey, rows, issues);
    setRows(batchRes.updatedRows);
    setIssues(batchRes.updatedIssues);
    setDiffs(prev => [...prev, ...batchRes.newDiffs]);

    const grp = patternGroups.find(g => g.patternKey === patternKey);
    if (grp) {
      setAutoRepairedCount(prev => prev + grp.affectedRowsCount);
    }
    setPatternGroups(prev => prev.filter(g => g.patternKey !== patternKey));
  };

  // Human Review start
  const handleStartHumanReview = () => {
    setHumanReviewIndex(0);
    setStage('HUMAN_REVIEW');
  };

  // Human Review individual card resolution
  const handleResolveHumanIssue = (issueId: string, newValue: string) => {
    setHistoryStack(prev => [...prev, { headers, rows, issues, diffs }]);

    const unres = issues.filter(i => (i.category === 'NEEDS_CONFIRMATION' || i.category === 'CANNOT_DETERMINE') && !i.isResolved);
    const currentIssue = unres[humanReviewIndex];

    if (currentIssue) {
      const rIdx = currentIssue.rowIndex - 1;
      const updatedRows = [...rows];
      if (updatedRows[rIdx]) {
        updatedRows[rIdx] = { ...updatedRows[rIdx], [currentIssue.field]: newValue };
      }

      const updatedIssues = issues.map(i => {
        if (i.id === issueId) {
          return { ...i, isResolved: true, resolvedValue: newValue, resolvedType: 'MANUAL' as const };
        }
        return i;
      });

      setRows(updatedRows);
      setIssues(updatedIssues);
      setHumanFixedCount(prev => prev + 1);

      if (humanReviewIndex + 1 < unres.length) {
        setHumanReviewIndex(prev => prev + 1);
      } else {
        setStage('COMPLETE');
      }
    }
  };

  // Undo
  const handleUndo = () => {
    if (historyStack.length === 0) return;
    const prev = historyStack[historyStack.length - 1];
    setHistoryStack(st => st.slice(0, -1));
    setHeaders(prev.headers);
    setRows(prev.rows);
    setIssues(prev.issues);
    setDiffs(prev.diffs);
  };

  // Reset
  const handleReset = () => {
    setStage('UPLOAD');
    setFileName('');
    setRawHeaders([]);
    setRawDataRows([]);
    setHeaders([]);
    setRows([]);
    setIssues([]);
    setPatternGroups([]);
    setDiffs([]);
    setRepairLogs([]);
    setHistoryStack([]);
    setAutoRepairedCount(0);
    setHumanFixedCount(0);
  };

  const humanIssuesRemaining = issues.filter(i => (i.category === 'NEEDS_CONFIRMATION' || i.category === 'CANNOT_DETERMINE') && !i.isResolved);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      <Header
        canUndo={historyStack.length > 0}
        onUndo={handleUndo}
        onReset={handleReset}
        hasFile={stage !== 'UPLOAD'}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {stage === 'UPLOAD' && (
          <StageUpload onFileLoaded={handleFileLoaded} />
        )}

        {stage === 'DESTINATION' && (
          <StageDestination onSelect={handleDestinationSelected} />
        )}

        {stage === 'SCANNING' && (
          <StageScan totalRows={rows.length} onScanFinished={handleScanFinished} />
        )}

        {stage === 'SUMMARY' && (
          <StageAutoFixSummary
            totalIssuesCount={issues.length}
            autoFixableCount={issues.filter(i => i.category === 'SAFE_AUTO_FIX' && !i.isResolved).length}
            humanInputCount={humanIssuesRemaining.length}
            patternGroups={patternGroups}
            diffs={diffs}
            onFixAllSafe={handleFixAllSafe}
            onApplyPatternFix={handleApplyPatternFix}
            onStartHumanReview={handleStartHumanReview}
          />
        )}

        {stage === 'HUMAN_REVIEW' && humanIssuesRemaining.length > 0 && (
          <HumanReviewCard
            issue={humanIssuesRemaining[humanReviewIndex] || humanIssuesRemaining[0]}
            currentIndex={humanReviewIndex}
            totalIssues={humanIssuesRemaining.length}
            onResolve={handleResolveHumanIssue}
          />
        )}

        {stage === 'COMPLETE' && (
          <StageComplete
            totalRows={rows.length}
            autoRepairedCount={autoRepairedCount}
            humanFixedCount={humanFixedCount}
            headers={headers}
            rows={rows}
            repairLogs={repairLogs}
            diffs={diffs}
            fileName={fileName}
            platform={platform}
          />
        )}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>CSV Surgeon by Atomz &bull; 100% Client-Side Local Browser Tool</p>
        </div>
      </footer>
    </div>
  );
}
