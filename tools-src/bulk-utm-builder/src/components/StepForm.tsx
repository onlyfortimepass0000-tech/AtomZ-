import React, { useState } from 'react';
import { ChannelPreset, NamingRules, SavedPreset, UTMConfig } from '../types';
import { CHANNEL_PRESETS } from '../constants/channels';
import {
  Link,
  Share2,
  Tag,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Plus,
  Trash2,
  Info,
} from 'lucide-react';
import { getSavedPresets, savePreset, deleteSavedPreset } from '../utils/presetStorage';

interface StepFormProps {
  rawUrlsText: string;
  setRawUrlsText: (text: string) => void;
  selectedChannelId: string;
  setSelectedChannelId: (id: string) => void;
  utmConfig: UTMConfig;
  setUtmConfig: React.Dispatch<React.SetStateAction<UTMConfig>>;
  rules: NamingRules;
  setRules: React.Dispatch<React.SetStateAction<NamingRules>>;
  onGenerate: () => void;
}

export const StepForm: React.FC<StepFormProps> = ({
  rawUrlsText,
  setRawUrlsText,
  selectedChannelId,
  setSelectedChannelId,
  utmConfig,
  setUtmConfig,
  rules,
  setRules,
  onGenerate,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [savedPresetsList, setSavedPresetsList] = useState<SavedPreset[]>(getSavedPresets());
  const [newPresetName, setNewPresetName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  const handleChannelSelect = (channel: ChannelPreset) => {
    setSelectedChannelId(channel.id);
    if (channel.id !== 'other') {
      setUtmConfig((prev) => ({
        ...prev,
        source: channel.source,
        medium: channel.medium,
      }));
    }
  };

  const handleSavePresetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;

    const updated = savePreset({
      name: newPresetName.trim(),
      channelId: selectedChannelId,
      source: utmConfig.source,
      medium: utmConfig.medium,
      campaign: utmConfig.campaign,
      content: utmConfig.content,
      term: utmConfig.term,
    });

    setSavedPresetsList(updated);
    setNewPresetName('');
    setShowSaveModal(false);
  };

  const handleLoadPreset = (preset: SavedPreset) => {
    setSelectedChannelId(preset.channelId);
    setUtmConfig({
      source: preset.source,
      medium: preset.medium,
      campaign: preset.campaign,
      content: preset.content,
      term: preset.term,
    });
  };

  const handleDeletePreset = (id: string) => {
    const updated = deleteSavedPreset(id);
    setSavedPresetsList(updated);
  };

  const detectedCount = rawUrlsText
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0).length;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Guided 3-Step Progress Bar */}
      <div className="grid grid-cols-3 gap-2 p-1 bg-gray-900 border border-gray-800 rounded-2xl text-xs font-semibold">
        <div className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400">
          <span className="w-5 h-5 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center text-[10px]">
            1
          </span>
          <span>Add Links</span>
        </div>
        <div className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gray-950 text-gray-300">
          <span className="w-5 h-5 rounded-full bg-gray-800 text-gray-300 font-bold flex items-center justify-center text-[10px]">
            2
          </span>
          <span>Choose Channel</span>
        </div>
        <div className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gray-950 text-gray-300">
          <span className="w-5 h-5 rounded-full bg-gray-800 text-gray-300 font-bold flex items-center justify-center text-[10px]">
            3
          </span>
          <span>Create Links</span>
        </div>
      </div>

      {/* Non-jargon explanation callout */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-start gap-3 text-xs text-blue-200">
        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Tracked links help you see where website visitors came from.</strong> Paste one or multiple website links below, choose where you are sharing them, and instantly get tracked links ready to copy or download.
        </p>
      </div>

      {/* STEP 1: Paste Links */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-lg font-bold text-white flex items-center gap-2 font-display">
            <Link className="w-5 h-5 text-orange-500" />
            <span>STEP 1: Paste the links you want to track</span>
          </label>
          <span className="text-xs font-mono text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20">
            {detectedCount} {detectedCount === 1 ? 'URL' : 'URLs'} detected
          </span>
        </div>

        <textarea
          rows={5}
          value={rawUrlsText}
          onChange={(e) => setRawUrlsText(e.target.value)}
          placeholder={`https://brand.com/shoes\nhttps://brand.com/bags\nhttps://brand.com/sale`}
          className="w-full bg-gray-950 border border-gray-800 rounded-2xl p-4 text-sm font-mono text-white placeholder-gray-600 focus:border-orange-500 focus:outline-none transition-colors"
        />
        <p className="text-xs text-gray-500">
          Paste multiple links (one per line). Standard website pages, product links, or landing pages.
        </p>
      </div>

      {/* STEP 2: Choose Channel */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-3xl p-6 sm:p-8 space-y-5">
        <div>
          <label className="text-lg font-bold text-white flex items-center gap-2 font-display">
            <Share2 className="w-5 h-5 text-orange-500" />
            <span>STEP 2: Where will these links be used?</span>
          </label>
          <p className="text-xs text-gray-400 mt-1">
            Select the platform or channel where you plan to post or advertise these links.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CHANNEL_PRESETS.map((channel) => {
            const isSelected = selectedChannelId === channel.id;
            return (
              <button
                key={channel.id}
                type="button"
                onClick={() => handleChannelSelect(channel)}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-orange-500/10 border-orange-500 text-white shadow-lg shadow-orange-500/10'
                    : 'bg-gray-950/60 border-gray-800/80 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                }`}
              >
                <div className="text-sm font-bold text-white mb-1">{channel.name}</div>
                <div className="text-[11px] text-gray-400 font-mono">
                  {channel.source} / {channel.medium}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 3: Campaign Name */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <div>
          <label className="text-lg font-bold text-white flex items-center gap-2 font-display">
            <Tag className="w-5 h-5 text-orange-500" />
            <span>STEP 3: What is this campaign called?</span>
          </label>
          <p className="text-xs text-gray-400 mt-1">
            Give your promotion or ad launch a simple name to group your analytics.
          </p>
        </div>

        <input
          type="text"
          value={utmConfig.campaign}
          onChange={(e) => setUtmConfig((prev) => ({ ...prev, campaign: e.target.value }))}
          placeholder="e.g. Summer Sale 2026"
          className="w-full bg-gray-950 border border-gray-800 rounded-2xl px-4 py-3.5 text-sm font-medium text-white placeholder-gray-600 focus:border-orange-500 focus:outline-none transition-colors"
        />

        <div className="pt-2">
          <button
            type="button"
            onClick={onGenerate}
            disabled={!rawUrlsText.trim()}
            className="w-full py-4 px-8 rounded-2xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-base shadow-xl shadow-orange-600/25 flex items-center justify-center gap-3 transition-all duration-200"
          >
            <Sparkles className="w-5 h-5" />
            <span>Create Tracked Links</span>
          </button>
        </div>
      </div>

      {/* ADVANCED SETTINGS ACCORDION */}
      <div className="border border-gray-800 rounded-3xl bg-gray-950/80 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full p-5 flex items-center justify-between text-xs font-bold text-gray-300 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2">
            <span>Advanced Settings & Saved Presets</span>
            <span className="text-[10px] text-gray-500 font-mono font-normal">
              (Manual UTM fields, sanitization & preset manager)
            </span>
          </div>
          {showAdvanced ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {showAdvanced && (
          <div className="p-6 border-t border-gray-800/80 space-y-6 animate-fadeIn">
            {/* Manual UTM Parameter Fields */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                Manual Technical Parameters
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-gray-400 block mb-1 font-mono">utm_source</label>
                  <input
                    type="text"
                    value={utmConfig.source}
                    onChange={(e) => setUtmConfig((prev) => ({ ...prev, source: e.target.value }))}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1 font-mono">utm_medium</label>
                  <input
                    type="text"
                    value={utmConfig.medium}
                    onChange={(e) => setUtmConfig((prev) => ({ ...prev, medium: e.target.value }))}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1 font-mono">utm_campaign</label>
                  <input
                    type="text"
                    value={utmConfig.campaign}
                    onChange={(e) => setUtmConfig((prev) => ({ ...prev, campaign: e.target.value }))}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1 font-mono">utm_content (optional)</label>
                  <input
                    type="text"
                    value={utmConfig.content}
                    onChange={(e) => setUtmConfig((prev) => ({ ...prev, content: e.target.value }))}
                    placeholder="e.g. hero_banner"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1 font-mono">utm_term (optional)</label>
                  <input
                    type="text"
                    value={utmConfig.term}
                    onChange={(e) => setUtmConfig((prev) => ({ ...prev, term: e.target.value }))}
                    placeholder="e.g. running_shoes"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Formatting & Sanitization Rules */}
            <div className="pt-4 border-t border-gray-800">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                Formatting & Sanitization Rules
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-gray-400 block mb-1">Space Replacement</label>
                  <select
                    value={rules.spaceReplacement}
                    onChange={(e) =>
                      setRules((prev) => ({
                        ...prev,
                        spaceReplacement: e.target.value as 'underscore' | 'hyphen',
                      }))
                    }
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="underscore">Convert spaces to underscores (_)</option>
                    <option value="hyphen">Convert spaces to hyphens (-)</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">Existing UTM Parameters</label>
                  <select
                    value={rules.existingUtmHandling}
                    onChange={(e) =>
                      setRules((prev) => ({
                        ...prev,
                        existingUtmHandling: e.target.value as 'replace' | 'keep' | 'skip',
                      }))
                    }
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="replace">Replace existing UTM parameters</option>
                    <option value="keep">Keep existing UTM parameters</option>
                    <option value="skip">Skip URLs that already have UTMs</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-900 border border-gray-800 rounded-xl">
                  <span className="text-gray-300">Force Lowercase Values</span>
                  <input
                    type="checkbox"
                    checked={rules.forceLowercase}
                    onChange={(e) =>
                      setRules((prev) => ({ ...prev, forceLowercase: e.target.checked }))
                    }
                    className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-900 border border-gray-800 rounded-xl">
                  <span className="text-gray-300">Remove Special Characters</span>
                  <input
                    type="checkbox"
                    checked={rules.removeSpecialChars}
                    onChange={(e) =>
                      setRules((prev) => ({ ...prev, removeSpecialChars: e.target.checked }))
                    }
                    className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Saved Local Presets */}
            <div className="pt-4 border-t border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4 text-orange-400" />
                  <span>Saved Presets (Local Storage)</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowSaveModal(true)}
                  className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save Current Configuration</span>
                </button>
              </div>

              {savedPresetsList.length === 0 ? (
                <p className="text-xs text-gray-500 italic">No custom presets saved yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {savedPresetsList.map((preset) => (
                    <div
                      key={preset.id}
                      className="p-2.5 bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-bold text-white">{preset.name}</div>
                        <div className="text-[10px] text-gray-400 font-mono">
                          {preset.source} / {preset.medium} · {preset.campaign || 'no campaign'}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleLoadPreset(preset)}
                          className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-[10px] font-semibold"
                        >
                          Load
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePreset(preset.id)}
                          className="p-1 text-gray-500 hover:text-red-400 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Save Preset Dialog */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSavePresetSubmit}
            className="bg-gray-900 border border-gray-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl"
          >
            <h3 className="text-sm font-bold text-white">Save Custom UTM Preset</h3>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Preset Label</label>
              <input
                type="text"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="e.g. Meta Prospecting Ads"
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white"
                required
              />
            </div>
            <div className="flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="px-3 py-1.5 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-lg"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
