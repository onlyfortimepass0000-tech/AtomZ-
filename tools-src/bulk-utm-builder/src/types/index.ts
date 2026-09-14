export interface ChannelPreset {
  id: string;
  name: string;
  source: string;
  medium: string;
  description: string;
}

export interface UTMConfig {
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
}

export type SpaceReplacement = 'underscore' | 'hyphen';
export type ExistingUtmHandling = 'replace' | 'keep' | 'skip';

export interface NamingRules {
  spaceReplacement: SpaceReplacement;
  forceLowercase: boolean;
  removeSpecialChars: boolean;
  existingUtmHandling: ExistingUtmHandling;
}

export interface URLItem {
  id: string;
  rawUrl: string;
  cleanBaseUrl: string;
  isValid: boolean;
  errorMessage?: string;
  hasExistingUtms: boolean;
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
  generatedUrl: string;
  isDuplicate: boolean;
}

export interface SavedPreset {
  id: string;
  name: string;
  channelId: string;
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
  createdAt: number;
}
