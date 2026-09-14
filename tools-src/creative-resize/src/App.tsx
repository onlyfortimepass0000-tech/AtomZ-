import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LandingHero } from './components/LandingHero';
import { InteractiveCanvas } from './components/InteractiveCanvas';
import { EditorControls } from './components/EditorControls';
import { PresetSelector } from './components/PresetSelector';
import { PreviewGrid } from './components/PreviewGrid';
import { PreviewModal } from './components/PreviewModal';
import { ExportPanel } from './components/ExportPanel';
import {
  ExportConfig,
  ImageAdjustment,
  LoadedImage,
  PlatformPreset,
} from './types';
import { PLATFORM_PRESETS } from './constants/presets';
import { downloadBlob, generatePresetsZip } from './utils/zipExporter';
import { Upload, Trash2 } from 'lucide-react';

const DEFAULT_ADJUSTMENT: ImageAdjustment = {
  offsetX: 0,
  offsetY: 0,
  zoom: 1.0,
  fitMode: 'crop',
  bgColor: '#000000',
  showSafeZone: false,
};

const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  format: 'image/jpeg',
  quality: 0.9,
  campaignName: 'campaign-creative',
};

export const App: React.FC = () => {
  const [loadedImage, setLoadedImage] = useState<LoadedImage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [adjustment, setAdjustment] = useState<ImageAdjustment>(DEFAULT_ADJUSTMENT);
  const [customPresets, setCustomPresets] = useState<PlatformPreset[]>([]);

  // Default select all standard presets
  const [selectedPresetIds, setSelectedPresetIds] = useState<string[]>(
    PLATFORM_PRESETS.map((p) => p.id)
  );

  const [config, setConfig] = useState<ExportConfig>(DEFAULT_EXPORT_CONFIG);
  const [modalPreset, setModalPreset] = useState<PlatformPreset | null>(null);

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<{
    current: number;
    total: number;
    name: string;
  } | null>(null);

  // File loading & validation
  const handleFileSelect = (file: File) => {
    setError(null);

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setError(
        `Unsupported format (${file.type || file.name}). Please upload a PNG, JPG, or WebP image.`
      );
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // Revoke previous object URL if any
      if (loadedImage) {
        URL.revokeObjectURL(loadedImage.src);
      }

      setLoadedImage({
        file,
        src: objectUrl,
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight,
      });

      // Derive clean default campaign name from image file name
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setConfig((prev) => ({
        ...prev,
        campaignName: baseName,
      }));

      // Reset adjustment
      setAdjustment(DEFAULT_ADJUSTMENT);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setError('Failed to load image. File may be corrupted or unreadable.');
    };

    img.src = objectUrl;
  };

  const handleResetImage = () => {
    if (loadedImage) {
      URL.revokeObjectURL(loadedImage.src);
    }
    setLoadedImage(null);
    setAdjustment(DEFAULT_ADJUSTMENT);
    setError(null);
  };

  // Preset Selection Handlers
  const handleTogglePreset = (presetId: string) => {
    setSelectedPresetIds((prev) =>
      prev.includes(presetId)
        ? prev.filter((id) => id !== presetId)
        : [...prev, presetId]
    );
  };

  const allPresets = [...PLATFORM_PRESETS, ...customPresets];

  const handleSelectAll = () => {
    setSelectedPresetIds(allPresets.map((p) => p.id));
  };

  const handleDeselectAll = () => {
    setSelectedPresetIds([]);
  };

  const handleAddCustomPreset = (preset: PlatformPreset) => {
    setCustomPresets((prev) => [...prev, preset]);
    setSelectedPresetIds((prev) => [...prev, preset.id]);
  };

  const handleRemoveCustomPreset = (presetId: string) => {
    setCustomPresets((prev) => prev.filter((p) => p.id !== presetId));
    setSelectedPresetIds((prev) => prev.filter((id) => id !== presetId));
  };

  const selectedPresets = allPresets.filter((p) =>
    selectedPresetIds.includes(p.id)
  );

  // Download ZIP
  const handleDownloadZip = async () => {
    if (!loadedImage || selectedPresets.length === 0) return;

    try {
      setIsExporting(true);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = loadedImage.src;
      await new Promise((res) => (img.onload = res));

      const zipBlob = await generatePresetsZip(
        img,
        selectedPresets,
        adjustment,
        config,
        (current, total, name) => {
          setExportProgress({ current, total, name });
        }
      );

      const cleanCampaign = config.campaignName.trim() || 'creatives';
      downloadBlob(zipBlob, `${cleanCampaign}_all-formats.zip`);
    } catch (err: any) {
      alert(`Export failed: ${err?.message || 'Unknown canvas processing error'}`);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      <Header />

      <main className="flex-1">
        {!loadedImage ? (
          <LandingHero onFileSelect={handleFileSelect} error={error} />
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
            {/* Top Workspace Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-900/80 border border-gray-800 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                    {loadedImage.file.name}
                  </h2>
                  <p className="text-xs font-mono text-gray-400">
                    Original: {loadedImage.width} × {loadedImage.height} px (
                    {(loadedImage.file.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label
                  className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-200 rounded-xl border border-gray-700 cursor-pointer transition-colors"
                >
                  <span>Change Creative</span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={(e) =>
                      e.target.files && handleFileSelect(e.target.files[0])
                    }
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleResetImage}
                  className="px-3 py-2 bg-red-950/40 hover:bg-red-900/60 text-xs font-semibold text-red-300 rounded-xl border border-red-800/60 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>

            {/* Split Workspace Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Interactive Editor Workspace */}
              <div className="lg:col-span-6 space-y-6 sticky lg:top-20">
                <InteractiveCanvas
                  image={loadedImage}
                  adjustment={adjustment}
                  onChange={setAdjustment}
                  aspectRatio={1}
                />

                <EditorControls
                  adjustment={adjustment}
                  onChange={setAdjustment}
                  onReset={() => setAdjustment(DEFAULT_ADJUSTMENT)}
                />
              </div>

              {/* Right Column: Presets & Export Panel */}
              <div className="lg:col-span-6 space-y-6">
                <PresetSelector
                  selectedPresetIds={selectedPresetIds}
                  onTogglePreset={handleTogglePreset}
                  onSelectAll={handleSelectAll}
                  onDeselectAll={handleDeselectAll}
                  customPresets={customPresets}
                  onAddCustomPreset={handleAddCustomPreset}
                  onRemoveCustomPreset={handleRemoveCustomPreset}
                />

                <ExportPanel
                  config={config}
                  onChangeConfig={setConfig}
                  selectedCount={selectedPresets.length}
                  onDownloadZip={handleDownloadZip}
                  isExporting={isExporting}
                  exportProgress={exportProgress}
                />
              </div>
            </div>

            {/* Bottom Previews Grid */}
            <div className="pt-8 border-t border-gray-800">
              <PreviewGrid
                selectedPresets={selectedPresets}
                image={loadedImage}
                adjustment={adjustment}
                onOpenModal={setModalPreset}
                onDeselectPreset={handleTogglePreset}
              />
            </div>
          </div>
        )}
      </main>

      {/* Enlarged Single Format Modal */}
      {loadedImage && (
        <PreviewModal
          preset={modalPreset}
          image={loadedImage}
          adjustment={adjustment}
          campaignName={config.campaignName}
          onClose={() => setModalPreset(null)}
        />
      )}
    </div>
  );
};
