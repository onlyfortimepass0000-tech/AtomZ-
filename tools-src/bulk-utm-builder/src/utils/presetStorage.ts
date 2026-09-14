import { SavedPreset } from '../types';

const STORAGE_KEY = 'atomz_utm_saved_presets';

export function getSavedPresets(): SavedPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedPreset[];
  } catch (err) {
    return [];
  }
}

export function savePreset(preset: Omit<SavedPreset, 'id' | 'createdAt'>): SavedPreset[] {
  const existing = getSavedPresets();
  const newPreset: SavedPreset = {
    ...preset,
    id: `preset-${Date.now()}`,
    createdAt: Date.now(),
  };
  const updated = [newPreset, ...existing];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save preset to localStorage:', err);
  }
  return updated;
}

export function deleteSavedPreset(id: string): SavedPreset[] {
  const existing = getSavedPresets();
  const updated = existing.filter((p) => p.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete preset from localStorage:', err);
  }
  return updated;
}
