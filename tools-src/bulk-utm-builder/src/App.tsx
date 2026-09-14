import React, { useState } from 'react';
import { Header } from './components/Header';
import { StepForm } from './components/StepForm';
import { ResultsView } from './components/ResultsView';
import { NamingRules, URLItem, UTMConfig } from './types';
import { processBulkUrls } from './utils/utmEngine';

const DEFAULT_RULES: NamingRules = {
  spaceReplacement: 'underscore',
  forceLowercase: true,
  removeSpecialChars: true,
  existingUtmHandling: 'replace',
};

const DEFAULT_UTM: UTMConfig = {
  source: 'instagram',
  medium: 'social',
  campaign: 'Summer Sale 2026',
  content: '',
  term: '',
};

export const App: React.FC = () => {
  const [rawUrlsText, setRawUrlsText] = useState<string>('');
  const [selectedChannelId, setSelectedChannelId] = useState<string>('instagram');

  const [utmConfig, setUtmConfig] = useState<UTMConfig>(DEFAULT_UTM);
  const [rules, setRules] = useState<NamingRules>(DEFAULT_RULES);

  const [urlItems, setUrlItems] = useState<URLItem[]>([]);
  const [hasGenerated, setHasGenerated] = useState<boolean>(false);

  const handleGenerate = () => {
    if (!rawUrlsText.trim()) return;

    const items = processBulkUrls(rawUrlsText, utmConfig, rules);
    setUrlItems(items);
    setHasGenerated(true);
  };

  const handleClearAll = () => {
    setRawUrlsText('');
    setUrlItems([]);
    setHasGenerated(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      <Header />

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        {!hasGenerated ? (
          <StepForm
            rawUrlsText={rawUrlsText}
            setRawUrlsText={setRawUrlsText}
            selectedChannelId={selectedChannelId}
            setSelectedChannelId={setSelectedChannelId}
            utmConfig={utmConfig}
            setUtmConfig={setUtmConfig}
            rules={rules}
            setRules={setRules}
            onGenerate={handleGenerate}
          />
        ) : (
          <ResultsView
            urlItems={urlItems}
            setUrlItems={setUrlItems}
            globalUtm={utmConfig}
            rules={rules}
            onClearAll={handleClearAll}
          />
        )}
      </main>
    </div>
  );
};
