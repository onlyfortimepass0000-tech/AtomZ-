import React, { useState } from 'react';
import { Header } from './components/Header';
import { StepUpload } from './components/StepUpload';
import { StepPlatform } from './components/StepPlatform';
import { StepMapping } from './components/StepMapping';
import { StepFixReview } from './components/StepFixReview';
import { StepDownload } from './components/StepDownload';
import { ColumnMapping, ParseResult, PlatformType, ProcessedProduct } from './types';
import { PLATFORM_SPECS } from './constants/platforms';
import { autoMatchColumns } from './utils/columnMatcher';
import { validateAndProcessCatalog } from './utils/validator';

export const App: React.FC = () => {
  const [step, setStep] = useState<number>(1);

  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [platform, setPlatform] = useState<PlatformType>('meta');
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [products, setProducts] = useState<ProcessedProduct[]>([]);

  // Step 1: File Parsed
  const handleParsed = (result: ParseResult) => {
    setParseResult(result);
    // Initial auto-mapping
    const initialMapping = autoMatchColumns(result.headers, PLATFORM_SPECS.meta.fields);
    setMapping(initialMapping);
    setStep(2);
  };

  // Step 2: Platform Selected
  const handleSelectPlatform = (selected: PlatformType) => {
    setPlatform(selected);
    if (parseResult) {
      const newMapping = autoMatchColumns(parseResult.headers, PLATFORM_SPECS[selected].fields);
      setMapping(newMapping);
    }
  };

  // Step 2 -> 3: Go to Column Mapping
  const handlePlatformNext = () => {
    setStep(3);
  };

  // Step 3: Column Mapping changed
  const handleMappingChange = (targetKey: string, sourceCol: string) => {
    setMapping((prev) => ({
      ...prev,
      [targetKey]: sourceCol,
    }));
  };

  // Step 3 -> 4: Run Validation & Processing
  const handleMappingNext = () => {
    if (!parseResult) return;
    const processed = validateAndProcessCatalog(
      parseResult.rows,
      mapping,
      PLATFORM_SPECS[platform]
    );
    setProducts(processed);
    setStep(4);
  };

  // Step 4 -> 5: Go to Download
  const handleFixNext = () => {
    setStep(5);
  };

  const handleStartOver = () => {
    setStep(1);
    setParseResult(null);
    setMapping({});
    setProducts([]);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      <Header />

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        {step === 1 && <StepUpload onParsed={handleParsed} />}

        {step === 2 && parseResult && (
          <StepPlatform
            selectedPlatform={platform}
            onSelectPlatform={handleSelectPlatform}
            onNext={handlePlatformNext}
            productCount={parseResult.rows.length}
            columnCount={parseResult.headers.length}
          />
        )}

        {step === 3 && parseResult && (
          <StepMapping
            sourceHeaders={parseResult.headers}
            platformSpec={PLATFORM_SPECS[platform]}
            mapping={mapping}
            onMappingChange={handleMappingChange}
            onNext={handleMappingNext}
          />
        )}

        {step === 4 && parseResult && (
          <StepFixReview
            products={products}
            setProducts={setProducts}
            platformSpec={PLATFORM_SPECS[platform]}
            rawRows={parseResult.rows}
            mapping={mapping}
            onNext={handleFixNext}
          />
        )}

        {step === 5 && parseResult && (
          <StepDownload
            products={products}
            platformSpec={PLATFORM_SPECS[platform]}
            originalFileName={parseResult.fileName}
            onStartOver={handleStartOver}
          />
        )}
      </main>
    </div>
  );
};
