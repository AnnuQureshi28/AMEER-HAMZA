import React, { useState } from 'react';
import { Mutamer } from '../types';
import { parseStandardCSV, parseNusukCSV, summarizePax } from '../utils/voucherUtils';
import { SAMPLE_STANDARD_CSV, SAMPLE_NUSUK_CSV } from '../data/initialData';
import { FileSpreadsheet, Upload, Check, AlertCircle, X, ArrowRight, Sparkles } from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: { groupNo: string; groupName: string; mutamers: Mutamer[] }) => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [activeFormat, setActiveFormat] = useState<'standard' | 'nusuk'>('standard');
  const [csvContent, setCsvContent] = useState<string>('');
  const [parsedData, setParsedData] = useState<{ groupNo: string; groupName: string; mutamers: Mutamer[] } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setCsvContent(text);
      processParse(text, activeFormat);
    };
    reader.readAsText(file);
  };

  const processParse = (rawText: string, format: 'standard' | 'nusuk') => {
    setErrorMsg('');
    try {
      if (!rawText.trim()) {
        setParsedData(null);
        return;
      }

      let res;
      if (format === 'standard') {
        res = parseStandardCSV(rawText);
      } else {
        res = parseNusukCSV(rawText);
      }

      if (res.mutamers.length === 0) {
        setErrorMsg('No mutamer records could be extracted. Please check the CSV header format.');
        setParsedData(null);
      } else {
        setParsedData(res);
      }
    } catch (err: any) {
      setErrorMsg('Error parsing file: ' + err.message);
      setParsedData(null);
    }
  };

  const loadSample = (format: 'standard' | 'nusuk') => {
    setActiveFormat(format);
    const sample = format === 'standard' ? SAMPLE_STANDARD_CSV : SAMPLE_NUSUK_CSV;
    setCsvContent(sample);
    processParse(sample, format);
  };

  const handleApply = () => {
    if (parsedData && parsedData.mutamers.length > 0) {
      onImport(parsedData);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full my-auto overflow-hidden animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Import Mutamers & Pilgrims Data
                <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase">
                  Bulk CSV / Excel
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Support for official Nusuk portal export and Standard B2B agency spreadsheets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format Selector & Quick Samples */}
        <div className="p-5 border-b border-slate-200 bg-slate-50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Format:</span>
              <button
                onClick={() => {
                  setActiveFormat('standard');
                  if (csvContent) processParse(csvContent, 'standard');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeFormat === 'standard'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Standard Agency Format
              </button>
              <button
                onClick={() => {
                  setActiveFormat('nusuk');
                  if (csvContent) processParse(csvContent, 'nusuk');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeFormat === 'nusuk'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Nusuk Platform Export
              </button>
            </div>

            {/* Quick Sample Buttons */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Quick Test:</span>
              <button
                onClick={() => loadSample('standard')}
                className="text-xs font-medium text-amber-700 bg-amber-100/70 hover:bg-amber-200/80 px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-amber-600" />
                Load Provided CSV Sample (Group 1000)
              </button>
              <button
                onClick={() => loadSample('nusuk')}
                className="text-xs font-medium text-slate-700 bg-slate-200 hover:bg-slate-300 px-2.5 py-1 rounded-md transition cursor-pointer"
              >
                Load Nusuk Sample
              </button>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* File Upload Box */}
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-amber-500 transition bg-slate-50/50 flex flex-col justify-center items-center">
              <Upload className="w-8 h-8 text-amber-600 mb-2" />
              <p className="text-xs font-bold text-slate-800 mb-1">Upload CSV or Excel File</p>
              <p className="text-[11px] text-slate-500 mb-3">Select .csv or drag file here</p>
              <label className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-xs">
                Browse File
                <input
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>

            {/* Paste Text Area */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700">Or Paste CSV Data Directly:</label>
                {csvContent && (
                  <button
                    onClick={() => {
                      setCsvContent('');
                      setParsedData(null);
                    }}
                    className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <textarea
                value={csvContent}
                onChange={(e) => {
                  setCsvContent(e.target.value);
                  processParse(e.target.value, activeFormat);
                }}
                rows={5}
                placeholder={
                  activeFormat === 'standard'
                    ? 'GroupNo,1000\nGroupName,AMEERHAMZAONLYACC\nPassportNo,First Name,Family Name,Birth Date,Gender\nBA6925931,FIAZ,HUSSAIN,01/01/1950,Male'
                    : 'Group Code,Group Name,Passport No,Mutamer Full Name,Nationality,Gender,DOB,Visa No,MOFA No,PNR...'
                }
                className="w-full text-xs font-mono border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedData && (
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/70">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-900">
                    Extracted {parsedData.mutamers.length} Mutamer(s)
                  </span>
                  <span className="text-xs bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-mono">
                    Grp #{parsedData.groupNo}: {parsedData.groupName}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-600">
                  {summarizePax(parsedData.mutamers).paxText}
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg bg-white">
                <table className="w-full text-[11px] text-left">
                  <thead className="bg-slate-100 text-slate-700 sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="px-2 py-1.5 w-8">#</th>
                      <th className="px-2 py-1.5">Passport</th>
                      <th className="px-2 py-1.5">Full Name</th>
                      <th className="px-2 py-1.5 w-12">Gender</th>
                      <th className="px-2 py-1.5 w-14">Type</th>
                      <th className="px-2 py-1.5 w-12">Bed</th>
                      <th className="px-2 py-1.5">MOFA #</th>
                      <th className="px-2 py-1.5">Visa #</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedData.mutamers.map((m, idx) => (
                      <tr key={idx} className="hover:bg-amber-50/40">
                        <td className="px-2 py-1 text-slate-500">{m.sno}</td>
                        <td className="px-2 py-1 font-mono font-medium text-slate-900">{m.passportNo}</td>
                        <td className="px-2 py-1 font-medium">{m.mutamerName}</td>
                        <td className="px-2 py-1">{m.gender}</td>
                        <td className="px-2 py-1 font-semibold">{m.paxType}</td>
                        <td className="px-2 py-1">{m.bed}</td>
                        <td className="px-2 py-1 font-mono text-slate-600">{m.mofaNo}</td>
                        <td className="px-2 py-1 font-mono text-slate-600">{m.visaNo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleApply}
            disabled={!parsedData || parsedData.mutamers.length === 0}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer ${
              parsedData && parsedData.mutamers.length > 0
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            Populate into Voucher
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
