import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Header } from './components/Header';
import { PickItem, PackingOrder, SortField, SlipLayout } from './types/pickPack';
import { parseAndGroupOrders, sortPickingList, generatePackingSlipsPdf } from './engine/pickPack';
import { Upload, Download, Printer, CheckSquare, Square, Package, ListChecks, FileText } from 'lucide-react';

export const App: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1);

  const [pickingList, setPickingList] = useState<PickItem[]>([]);
  const [packingOrders, setPackingOrders] = useState<PackingOrder[]>([]);

  const [sortField, setSortField] = useState<SortField>('SKU');
  const [slipLayout, setSlipLayout] = useState<SlipLayout>('2_PER_PAGE');

  // Privacy toggles
  const [includeAddress, setIncludeAddress] = useState<boolean>(true);
  const [includePhone, setIncludePhone] = useState<boolean>(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws, { defval: '' });

        if (data.length > 0) {
          const { pickingList: parsedList, packingOrders: parsedOrders } = parseAndGroupOrders(data);
          setPickingList(parsedList);
          setPackingOrders(parsedOrders);
          setStep(2);
        }
      } catch (err) {
        alert('Failed to parse order file. Please upload a valid CSV or XLSX file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const toggleCheckItem = (sku: string) => {
    setPickingList(prev => prev.map(item => item.sku === sku ? { ...item, checked: !item.checked } : item));
  };

  const sortedList = sortPickingList(pickingList, sortField);
  const totalItemsToPick = pickingList.reduce((acc, i) => acc + i.totalQuantity, 0);

  const handleDownloadPickingCsv = () => {
    const exportData = sortedList.map(i => ({
      'SKU': i.sku,
      'Product Name': i.productName,
      'Variant': i.variant,
      'Bin Location': i.binLocation,
      'Total Quantity to Pick': i.totalQuantity,
      'Picked': i.checked ? 'YES' : 'NO',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Picking List');
    XLSX.writeFile(wb, 'Warehouse_Picking_List.csv', { bookType: 'csv' });
  };

  const handleDownloadPackingSlipsPdf = () => {
    const pdfDoc = generatePackingSlipsPdf(packingOrders, slipLayout, includeAddress, includePhone);
    pdfDoc.save('Packing_Slips.pdf');
  };

  return (
    <div className="min-h-screen bg-[#0E0E10] text-gray-100 flex flex-col font-sans">
      <Header toolName="PickPack" tagline="Warehouse Picking List & Printable Packing Slips" />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-8">

        {/* STEP 1: UPLOAD */}
        {step === 1 && (
          <div className="bg-[#151518] border border-[#24242A] rounded-3xl p-8 text-center space-y-6 max-w-2xl mx-auto shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B] flex items-center justify-center mx-auto">
              <Package className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white">Upload today's order file</h2>
              <p className="text-gray-400 text-sm mt-2 leading-relaxed">
                Upload CSV or XLSX order export. We’ll aggregate quantities by SKU into a picking list and generate printable packing slips.
              </p>
            </div>

            <label className="inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-[#F59E0B] hover:bg-[#f59e0b]/90 text-white font-bold text-sm shadow-xl shadow-[#F59E0B]/20 cursor-pointer transition-all gap-2">
              <Upload className="w-4 h-4" />
              <span>Select Order File</span>
              <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} className="hidden" />
            </label>

            <div className="pt-4 border-t border-[#24242A] text-xs text-gray-500 font-mono">
              🔒 100% Client-Side. Your file stays on your computer.
            </div>
          </div>
        )}

        {/* STEP 2: PICKING LIST & PACKING SLIPS */}
        {step === 2 && (
          <div className="space-y-8 max-w-4xl mx-auto">

            {/* Stats Header */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#151518] border border-[#24242A] p-5 rounded-2xl text-center">
                <span className="text-3xl font-extrabold text-white font-mono">{packingOrders.length}</span>
                <p className="text-xs text-gray-400 font-mono mt-1">Total Orders</p>
              </div>
              <div className="bg-[#151518] border border-[#F59E0B]/30 p-5 rounded-2xl text-center">
                <span className="text-3xl font-extrabold text-[#F59E0B] font-mono">{pickingList.length}</span>
                <p className="text-xs text-gray-400 font-mono mt-1">Unique SKUs to Pick</p>
              </div>
              <div className="bg-[#151518] border border-[#00F5A0]/30 p-5 rounded-2xl text-center">
                <span className="text-3xl font-extrabold text-[#00F5A0] font-mono">{totalItemsToPick}</span>
                <p className="text-xs text-gray-400 font-mono mt-1">Total Units to Pick</p>
              </div>
            </div>

            {/* WAREHOUSE PICKING LIST */}
            <div className="bg-[#151518] border border-[#24242A] rounded-3xl p-6 space-y-4 shadow-2xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#24242A] pb-4 gap-3">
                <div className="flex items-center gap-2">
                  <ListChecks className="w-5 h-5 text-[#F59E0B]" />
                  <h3 className="text-lg font-bold text-white">Warehouse Picking List</h3>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 font-bold">Sort by:</span>
                  <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value as SortField)}
                    className="bg-[#0E0E10] border border-[#24242A] text-xs text-white px-3 py-1.5 rounded-lg focus:border-[#F59E0B] focus:outline-none"
                  >
                    <option value="SKU">SKU</option>
                    <option value="PRODUCT">Product Name</option>
                    <option value="BIN">Bin Location</option>
                  </select>

                  <button
                    onClick={handleDownloadPickingCsv}
                    className="px-3 py-1.5 rounded-lg bg-[#24242A] hover:bg-gray-700 text-white font-bold text-xs flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-lg bg-[#F59E0B] hover:bg-[#f59e0b]/90 text-white font-bold text-xs flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print List</span>
                  </button>
                </div>
              </div>

              {/* Interactive Picking List Items */}
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {sortedList.map(item => (
                  <div
                    key={item.sku}
                    onClick={() => toggleCheckItem(item.sku)}
                    className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      item.checked
                        ? 'bg-[#00F5A0]/10 border-[#00F5A0]/30 line-through text-gray-400'
                        : 'bg-[#0E0E10] border-[#24242A] text-white hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.checked ? (
                        <CheckSquare className="w-5 h-5 text-[#00F5A0] shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-500 shrink-0" />
                      )}
                      <div>
                        <span className="font-mono font-bold text-sm block">{item.productName}</span>
                        <div className="flex items-center gap-3 text-xs text-gray-400 font-mono mt-0.5">
                          <span>SKU: {item.sku}</span>
                          {item.variant && <span>Variant: {item.variant}</span>}
                          <span>Bin: {item.binLocation}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-gray-400 text-[10px] block">TOTAL TO PICK</span>
                      <span className="text-xl font-extrabold text-[#F59E0B]">{item.totalQuantity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PRINTABLE PACKING SLIPS GENERATOR */}
            <div className="bg-[#151518] border border-[#24242A] rounded-3xl p-6 space-y-6 shadow-2xl">
              <div className="flex items-center gap-2 border-b border-[#24242A] pb-3">
                <FileText className="w-5 h-5 text-[#F59E0B]" />
                <h3 className="text-lg font-bold text-white">Packing Slips Generator</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Slip Layout Option */}
                <div className="space-y-2">
                  <label className="text-gray-300 font-bold block">Printer Layout</label>
                  <select
                    value={slipLayout}
                    onChange={(e) => setSlipLayout(e.target.value as SlipLayout)}
                    className="w-full bg-[#0E0E10] border border-[#24242A] text-white p-2.5 rounded-lg focus:border-[#F59E0B] focus:outline-none"
                  >
                    <option value="1_PER_PAGE">1 Slip Per Page (Full A4 Sheet)</option>
                    <option value="2_PER_PAGE">2 Slips Per Page (Half A4 Sheet)</option>
                    <option value="4_PER_PAGE">4 Slips Per Page (Quarter A4 Sheet)</option>
                  </select>
                </div>

                {/* Privacy Options */}
                <div className="space-y-2">
                  <label className="text-gray-300 font-bold block">Customer Privacy Toggles</label>
                  <div className="flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeAddress}
                        onChange={(e) => setIncludeAddress(e.target.checked)}
                        className="rounded border-[#24242A] text-[#F59E0B] focus:ring-0 bg-[#0E0E10]"
                      />
                      <span>Include Address</span>
                    </label>
                    <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includePhone}
                        onChange={(e) => setIncludePhone(e.target.checked)}
                        className="rounded border-[#24242A] text-[#F59E0B] focus:ring-0 bg-[#0E0E10]"
                      />
                      <span>Include Phone</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-xl bg-[#24242A] text-gray-300 hover:text-white text-xs font-bold"
                >
                  Upload New File
                </button>

                <button
                  onClick={handleDownloadPackingSlipsPdf}
                  className="px-6 py-3 rounded-xl bg-[#F59E0B] hover:bg-[#f59e0b]/90 text-white font-bold text-xs shadow-lg shadow-[#F59E0B]/20 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Packing Slips PDF</span>
                </button>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
};
