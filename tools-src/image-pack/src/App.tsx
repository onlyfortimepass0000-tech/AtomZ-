import React, { useState } from 'react';
import JSZip from 'jszip';
import { Header } from './components/Header';
import { ProcessingOptions, ProcessedImage, OutputFormat, MaxDimension, NamingPattern } from './types/imagePack';
import { processSingleImage, formatBytes, generateManifestCsv } from './engine/imagePack';
import { Upload, Download, ArrowRight, RefreshCw, Image as ImageIcon, Sliders } from 'lucide-react';

export const App: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rawFiles, setRawFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Settings
  const [options, setOptions] = useState<ProcessingOptions>({
    outputFormat: 'image/jpeg',
    maxDimension: '1600',
    quality: 0.85,
    namingPattern: 'SKU_NUMBER',
    customPrefix: 'PRODUCT',
  });

  // Results
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f => f.type.startsWith('image/'));
    if (validFiles.length > 0) {
      setRawFiles(prev => [...prev, ...validFiles]);
    }
  };

  const handleStartProcessing = async () => {
    if (rawFiles.length === 0) return;
    setIsProcessing(true);
    setProgress(0);
    setStep(2);

    const results: ProcessedImage[] = [];

    for (let i = 0; i < rawFiles.length; i++) {
      try {
        const processed = await processSingleImage(rawFiles[i], i, options.customPrefix, options);
        results.push(processed);
      } catch (err) {
        console.error(`Error processing ${rawFiles[i].name}`, err);
      }
      setProgress(Math.round(((i + 1) / rawFiles.length) * 100));
    }

    setProcessedImages(results);
    setIsProcessing(false);
    setStep(3);
  };

  const handleDownloadZip = async () => {
    if (processedImages.length === 0) return;
    const zip = new JSZip();
    const folder = zip.folder('product-images') || zip;

    // Add images
    processedImages.forEach(img => {
      folder.file(img.newName, img.blob);
    });

    // Add manifest.csv
    const manifestCsv = generateManifestCsv(processedImages);
    folder.file('manifest.csv', manifestCsv);

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ImagePack_${options.customPrefix || 'Product'}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const totalOriginalSize = processedImages.reduce((acc, img) => acc + img.originalSize, 0);
  const totalNewSize = processedImages.reduce((acc, img) => acc + img.newSize, 0);
  const savingsPct = totalOriginalSize > 0 ? Math.round(((totalOriginalSize - totalNewSize) / totalOriginalSize) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#0E0E10] text-gray-100 flex flex-col font-sans">
      <Header toolName="ImagePack" tagline="Bulk Product Image Compressor & Renamer" />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-8">

        {/* STEP 1: UPLOAD IMAGES */}
        {step === 1 && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="bg-[#151518] border border-[#24242A] rounded-3xl p-8 text-center space-y-6 shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-[#FF5722]/10 border border-[#FF5722]/30 text-[#FF5722] flex items-center justify-center mx-auto">
                <ImageIcon className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white">Drop your product images</h2>
                <p className="text-gray-400 text-sm mt-2 leading-relaxed">
                  Upload multiple product images (JPG, PNG, WebP). We'll compress, resize, sanitize filenames, and package them into an export ZIP.
                </p>
              </div>

              <label className="inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-[#FF5722] hover:bg-[#b56ef8] text-white font-bold text-sm shadow-xl shadow-[#FF5722]/20 cursor-pointer transition-all gap-2">
                <Upload className="w-4 h-4" />
                <span>Select Images</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {rawFiles.length > 0 && (
                <div className="bg-[#0E0E10] border border-[#24242A] p-4 rounded-2xl flex items-center justify-between text-xs font-mono">
                  <span className="text-white font-bold">{rawFiles.length} images selected</span>
                  <span className="text-gray-400">{formatBytes(rawFiles.reduce((a, f) => a + f.size, 0))} Total</span>
                </div>
              )}
            </div>

            {/* Processing Controls */}
            {rawFiles.length > 0 && (
              <div className="bg-[#151518] border border-[#24242A] rounded-3xl p-6 space-y-6 shadow-2xl">
                <div className="flex items-center gap-2 border-b border-[#24242A] pb-3 text-sm font-bold text-white">
                  <Sliders className="w-4 h-4 text-[#FF5722]" />
                  <span>Image Settings & Rename Rules</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Format */}
                  <div className="space-y-1">
                    <label className="text-gray-300 font-bold">Output Format</label>
                    <select
                      value={options.outputFormat}
                      onChange={(e) => setOptions({ ...options, outputFormat: e.target.value as OutputFormat })}
                      className="w-full bg-[#0E0E10] border border-[#24242A] text-white rounded-lg p-2.5 focus:border-[#FF5722] focus:outline-none"
                    >
                      <option value="image/jpeg">JPG (Web Optimized)</option>
                      <option value="image/webp">WebP (Next-Gen Smallest)</option>
                      <option value="image/png">PNG (Transparent)</option>
                    </select>
                  </div>

                  {/* Dimension */}
                  <div className="space-y-1">
                    <label className="text-gray-300 font-bold">Max Dimensions</label>
                    <select
                      value={options.maxDimension}
                      onChange={(e) => setOptions({ ...options, maxDimension: e.target.value as MaxDimension })}
                      className="w-full bg-[#0E0E10] border border-[#24242A] text-white rounded-lg p-2.5 focus:border-[#FF5722] focus:outline-none"
                    >
                      <option value="ORIGINAL">Original Dimensions</option>
                      <option value="2000">2000px (High Res Catalog)</option>
                      <option value="1600">1600px (Shopify Standard)</option>
                      <option value="1200">1200px (E-commerce Square)</option>
                      <option value="800">800px (Fast Mobile Web)</option>
                    </select>
                  </div>

                  {/* Quality Slider */}
                  <div className="space-y-1 sm:col-span-2">
                    <div className="flex justify-between font-bold text-gray-300">
                      <span>Image Quality Compression</span>
                      <span className="text-[#FF5722] font-mono">{Math.round(options.quality * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.3"
                      max="1.0"
                      step="0.05"
                      value={options.quality}
                      onChange={(e) => setOptions({ ...options, quality: parseFloat(e.target.value) })}
                      className="w-full accent-[#FF5722]"
                    />
                  </div>

                  {/* Naming Pattern */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-gray-300 font-bold">Rename Rule</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { id: 'SKU_NUMBER', label: '[SKU]_[NUMBER]', ex: 'TEE-BLK-M_01.jpg' },
                        { id: 'PRODUCT_NUMBER', label: '[PRODUCT]_[NUMBER]', ex: 'PRODUCT_PROD_01.jpg' },
                        { id: 'SKU_PRODUCT_NUMBER', label: '[SKU]-[ORIGINAL]-[NUMBER]', ex: 'TEE-BLK-M_PHOTO_01.jpg' },
                        { id: 'ORIGINAL_SANITIZED', label: 'Sanitize Original Filename', ex: 'PHOTO1_01.jpg' },
                      ].map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setOptions({ ...options, namingPattern: p.id as NamingPattern })}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            options.namingPattern === p.id
                              ? 'bg-[#FF5722]/10 border-[#FF5722] text-white'
                              : 'bg-[#0E0E10] border-[#24242A] text-gray-400 hover:border-gray-600'
                          }`}
                        >
                          <span className="font-mono font-bold text-xs block">{p.label}</span>
                          <span className="text-[10px] text-gray-500 font-mono">e.g. {p.ex}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom SKU Prefix */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-gray-300 font-bold">Default SKU / Product Prefix</label>
                    <input
                      type="text"
                      value={options.customPrefix}
                      onChange={(e) => setOptions({ ...options, customPrefix: e.target.value })}
                      placeholder="e.g. TEE-BLK-M"
                      className="w-full bg-[#0E0E10] border border-[#24242A] text-white rounded-lg p-2.5 focus:border-[#FF5722] focus:outline-none text-xs font-mono"
                    />
                  </div>
                </div>

                <button
                  onClick={handleStartProcessing}
                  className="w-full py-4 rounded-2xl bg-[#FF5722] hover:bg-[#b56ef8] text-white font-bold text-sm shadow-xl shadow-[#FF5722]/20 flex items-center justify-center gap-2"
                >
                  <span>Process {rawFiles.length} Images</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: PROCESSING ANIMATION */}
        {step === 2 && isProcessing && (
          <div className="bg-[#151518] border border-[#24242A] rounded-3xl p-12 text-center space-y-6 max-w-xl mx-auto shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-[#FF5722]/10 border border-[#FF5722]/30 text-[#FF5722] flex items-center justify-center mx-auto animate-spin">
              <RefreshCw className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">Processing Product Images...</h3>
              <p className="text-xs text-gray-400 mt-1">Resizing, compressing, stripping metadata & generating pack.</p>
            </div>

            <div className="w-full bg-[#0E0E10] rounded-full h-3 overflow-hidden border border-[#24242A]">
              <div
                className="bg-gradient-to-r from-[#FF5722] to-[#00F5A0] h-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="text-xs font-mono text-[#A855F7] font-bold">{progress}% Complete</span>
          </div>
        )}

        {/* STEP 3: RESULTS & ZIP DOWNLOAD */}
        {step === 3 && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Stats Summary */}
            <div className="bg-[#151518] border border-[#00F5A0]/30 rounded-3xl p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div>
                <span className="text-xs text-gray-400 font-mono block">Original Size</span>
                <span className="text-2xl font-extrabold text-white font-mono">{formatBytes(totalOriginalSize)}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 font-mono block">Finished Pack Size</span>
                <span className="text-2xl font-extrabold text-[#00F5A0] font-mono">{formatBytes(totalNewSize)}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 font-mono block">Total Space Saved</span>
                <span className="text-2xl font-extrabold text-[#A855F7] font-mono">{savingsPct > 0 ? `-${savingsPct}%` : '0%'}</span>
              </div>
            </div>

            {/* Prepared Images Table */}
            <div className="bg-[#151518] border border-[#24242A] rounded-3xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#24242A] pb-3">
                <h3 className="text-sm font-bold text-white">{processedImages.length} Images Prepared</h3>
                <span className="text-xs font-mono text-gray-400">manifest.csv included in ZIP</span>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {processedImages.map(img => (
                  <div key={img.id} className="bg-[#0E0E10] border border-[#24242A] p-3 rounded-xl flex items-center justify-between text-xs gap-3">
                    <div className="flex items-center gap-3">
                      <img src={img.previewUrl} alt={img.newName} className="w-10 h-10 object-cover rounded-lg border border-[#24242A]" />
                      <div>
                        <span className="font-mono font-bold text-white block">{img.newName}</span>
                        <span className="text-[10px] text-gray-500 font-mono">{img.originalName} ({img.originalWidth}x{img.originalHeight})</span>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-[#00F5A0] font-bold block">{formatBytes(img.newSize)}</span>
                      <span className="text-[10px] text-gray-500">{img.newWidth}x{img.newHeight}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Download Bar */}
            <div className="bg-[#151518] border border-[#24242A] rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                onClick={() => {
                  setStep(1);
                  setRawFiles([]);
                  setProcessedImages([]);
                }}
                className="px-4 py-2 rounded-xl bg-[#24242A] text-gray-300 hover:text-white text-xs font-bold"
              >
                Process More Images
              </button>

              <button
                onClick={handleDownloadZip}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#A855F7] hover:bg-[#b56ef8] text-white font-bold text-sm shadow-xl shadow-[#A855F7]/20 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Image Pack ZIP</span>
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
