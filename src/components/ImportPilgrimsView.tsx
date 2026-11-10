import React, { useState } from 'react';
import { Mutamer, B2BAgent, VisaCompany, PilgrimGroup } from '../types';
import { parseStandardCSV, parseNusukCSV, parseExternalAgentExport, parseMutamersFromPDFBytes, summarizePax } from '../utils/voucherUtils';
import {
  FileSpreadsheet,
  Upload,
  ArrowRight,
  CheckCircle2,
  Users,
  ShieldCheck,
  Building,
  FileText,
  AlertCircle,
  Copy,
  Check,
  Plus,
  Briefcase,
  Layers,
} from 'lucide-react';

interface ImportPilgrimsViewProps {
  agents: B2BAgent[];
  visaCompanies: VisaCompany[];
  groups: PilgrimGroup[];
  onSaveGroup: (group: PilgrimGroup) => void;
  onCreateVoucherForGroup: (group: PilgrimGroup) => void;
  onAddVisaCompany: (company: VisaCompany) => void;
}

export const ImportPilgrimsView: React.FC<ImportPilgrimsViewProps> = ({
  agents,
  visaCompanies,
  groups,
  onSaveGroup,
  onCreateVoucherForGroup,
  onAddVisaCompany,
}) => {
  const [rawCsvText, setRawCsvText] = useState<string>('');

  // Sub-Agent (Client) Selection
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agents[0]?.id || '');
  // Visa Company Selection (e.g. Ziafa International, Bab Al-Umrah)
  const [selectedVisaCompanyId, setSelectedVisaCompanyId] = useState<string>(visaCompanies[0]?.id || '');

  // Parsed Data from Uploaded File
  const [parsedData, setParsedData] = useState<{ groupNo: string; groupName: string; mutamers: Mutamer[] } | null>(null);

  const [groupNoOverride, setGroupNoOverride] = useState<string>('');
  const [groupNameOverride, setGroupNameOverride] = useState<string>('');

  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successBanner, setSuccessBanner] = useState<string>('');

  // Quick Add Visa Company Modal State
  const [isNewVisaCoModalOpen, setIsNewVisaCoModalOpen] = useState(false);
  const [newCoName, setNewCoName] = useState('');
  const [newCoCity, setNewCoCity] = useState('');
  const [newCoWhatsapp, setNewCoWhatsapp] = useState('');

  const currentAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];
  const currentVisaCo = visaCompanies.find((v) => v.id === selectedVisaCompanyId) || visaCompanies[0];

  const handleTextChange = (text: string) => {
    setRawCsvText(text);
    setErrorMsg('');
    try {
      if (!text.trim()) {
        setParsedData(null);
        return;
      }

      const lower = text.toLowerCase();
      let res: { groupNo: string; groupName: string; mutamers: Mutamer[] } | null = null;

      if (lower.includes('main external agent') || lower.includes('sub ea') || lower.includes('mutamer age')) {
        const eaRes = parseExternalAgentExport(text);
        res = { groupNo: eaRes.groupNo, groupName: eaRes.groupName, mutamers: eaRes.mutamers };
      } else if (lower.includes('nusuk') || lower.includes('group code')) {
        res = parseNusukCSV(text);
      } else {
        const stdRes = parseStandardCSV(text);
        if (stdRes.mutamers.length > 0) {
          res = stdRes;
        } else {
          const nskRes = parseNusukCSV(text);
          if (nskRes.mutamers.length > 0) {
            res = nskRes;
          } else {
            const eaRes = parseExternalAgentExport(text);
            res = { groupNo: eaRes.groupNo, groupName: eaRes.groupName, mutamers: eaRes.mutamers };
          }
        }
      }

      if (!res || res.mutamers.length === 0) {
        setErrorMsg('No pilgrim records found in data. Please check file columns.');
        setParsedData(null);
      } else {
        setParsedData(res);
        setGroupNoOverride(res.groupNo);
        setGroupNameOverride(res.groupName);
      }
    } catch (err: any) {
      setErrorMsg('Parsing error: ' + err.message);
      setParsedData(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    const fileName = file.name.toLowerCase();

    // Check if uploaded file is a PDF
    if (fileName.endsWith('.pdf')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const arrayBuffer = evt.target?.result as ArrayBuffer;
          if (!arrayBuffer) return;
          const u8 = new Uint8Array(arrayBuffer);
          const pdfResult = parseMutamersFromPDFBytes(u8);

          if (pdfResult.mutamers.length === 0) {
            setErrorMsg('Could not read mutamers from PDF. Please make sure it is a valid Mutamers Export PDF or upload CSV/TSV.');
            return;
          }

          setGroupNoOverride(pdfResult.groupNo);
          setGroupNameOverride(pdfResult.groupName);
          setParsedData({
            groupNo: pdfResult.groupNo,
            groupName: pdfResult.groupName,
            mutamers: pdfResult.mutamers,
          });

          // Generate clean TSV text for inspection in textarea
          const headers = ['Passport', 'Mutamer Name', 'Group Code', 'Group Name', 'MOFA #', 'Visa #'].join('\t');
          const rows = pdfResult.mutamers.map(m => [m.passportNo, m.mutamerName, m.grpNo, pdfResult.groupName, m.mofaNo, m.visaNo].join('\t'));
          setRawCsvText([headers, ...rows].join('\n'));
          setSuccessBanner(`✓ Successfully extracted Group Code (${pdfResult.groupNo}), Group Name (${pdfResult.groupName}), and ${pdfResult.mutamers.length} Mutamers from PDF "${file.name}"!`);
        } catch (err: any) {
          setErrorMsg('PDF parsing error: ' + (err.message || 'Unknown error'));
        }
      };
      reader.readAsArrayBuffer(file);
      e.target.value = '';
      return;
    }

    // Otherwise read text file (csv, tsv, txt)
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      handleTextChange(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCreateGroup = () => {
    if (!parsedData || parsedData.mutamers.length === 0) return;

    const finalGroupNo = groupNoOverride.trim() || parsedData.groupNo || '1000';
    const finalGroupName = groupNameOverride.trim() || parsedData.groupName || 'AMEERHAMZAONLYACC';
    const paxStats = summarizePax(parsedData.mutamers);

    const newGroup: PilgrimGroup = {
      id: 'grp-' + Date.now(),
      groupNo: finalGroupNo,
      groupName: finalGroupName,
      subAgentId: currentAgent.id,
      subAgentName: currentAgent.name,
      subAgentCompany: currentAgent.companyName,
      subAgentCity: currentAgent.city,
      visaCompanyId: currentVisaCo.id,
      visaCompanyName: currentVisaCo.companyName,
      visaCompanyCity: currentVisaCo.branchCity,
      visaCompanyWhatsapp: currentVisaCo.whatsapp,
      mutamers: parsedData.mutamers.map((m) => ({
        ...m,
        grpNo: finalGroupNo,
      })),
      paxSummary: paxStats.paxText,
      totalBeds: paxStats.totalBeds,
      importDate: new Date().toISOString().split('T')[0],
      voucherStatus: 'none',
    };

    onSaveGroup(newGroup);
    setSuccessBanner(
      `✓ Group #${finalGroupNo} (${finalGroupName}) successfully created for Sub-Agent "${currentAgent.companyName}" with Visa Company "${currentVisaCo.companyName}"!`
    );
    setTimeout(() => setSuccessBanner(''), 7000);
  };

  const handleSaveNewVisaCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoName.trim()) return;

    const newCompany: VisaCompany = {
      id: 'vc-' + Date.now(),
      companyName: newCoName.trim(),
      branchCity: newCoCity.trim() || 'Saudi Arabia',
      whatsapp: newCoWhatsapp.trim() || '+966 50 000 0000',
      phone: '+966 50 000 0000',
    };

    onAddVisaCompany(newCompany);
    setSelectedVisaCompanyId(newCompany.id);
    setIsNewVisaCoModalOpen(false);
    setNewCoName('');
    setNewCoCity('');
    setNewCoWhatsapp('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Excel / Nusuk Group Import Engine
            </h1>
            <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase">
              Auto-Creates Pilgrim Group
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Every imported file creates an active Pilgrim Group under your selected Sub-Agent (Client) with its assigned Visa Company (e.g. Ziafa International).
          </p>
        </div>

        {parsedData && (
          <button
            onClick={handleCreateGroup}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-lg cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            Import & Add Mutamers
          </button>
        )}
      </div>

      {successBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successBanner}</span>
          </div>
        </div>
      )}

      {/* Main Grid: Left = Importer & Parameters, Right = Existing Groups List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Import Settings & Data Upload (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Sub-Agent & Visa Company Assignment */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <Briefcase className="w-4 h-4 text-amber-600" />
              1. Assign Sub-Agent (Client) & Visa Company (Supplier)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Select Sub-Agent */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Sub-Agent Client (Travel Agency):
                </label>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 font-semibold focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {agents.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.companyName} ({ag.city})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Your B2B client who booked these pilgrims and holds the ledger balance.
                </p>
              </div>

              {/* Select Visa Company */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 block">
                    Visa Company (Saudi MOFA Partner):
                  </label>
                  <button
                    onClick={() => setIsNewVisaCoModalOpen(true)}
                    className="text-[10px] text-amber-700 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> Add Co
                  </button>
                </div>
                <select
                  value={selectedVisaCompanyId}
                  onChange={(e) => setSelectedVisaCompanyId(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 font-semibold text-blue-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {visaCompanies.map((vc) => (
                    <option key={vc.id} value={vc.id}>
                      {vc.companyName} ({vc.branchCity})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Shown on the top right of the voucher (e.g. Ziafa International).
                </p>
              </div>
            </div>

            {/* Group Number & Group Name from Excel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-100">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Group Number (From Excel)</label>
                <input
                  type="text"
                  value={groupNoOverride}
                  onChange={(e) => setGroupNoOverride(e.target.value)}
                  placeholder="e.g. 1000"
                  className="w-full border border-slate-300 rounded-xl p-2 font-mono font-bold text-slate-900 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Group Name (From Excel)</label>
                <input
                  type="text"
                  value={groupNameOverride}
                  onChange={(e) => setGroupNameOverride(e.target.value)}
                  placeholder="e.g. AMEERHAMZAONLYACC"
                  className="w-full border border-slate-300 rounded-xl p-2 font-bold text-slate-900 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* 2. File Upload & Data Input */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                2. Upload PDF / Excel / CSV File
              </h3>
            </div>

            <div>
              <label className="border-2 border-dashed border-amber-300 rounded-xl p-6 text-center hover:border-amber-500 hover:bg-amber-50/40 transition bg-slate-50 flex flex-col justify-center items-center cursor-pointer">
                <Upload className="w-7 h-7 text-amber-600 mb-2" />
                <span className="text-sm font-bold text-slate-900">Upload PDF / Excel / CSV File</span>
                <span className="text-xs text-slate-500 mt-1">
                  Click to browse (.pdf, .csv, .tsv, .txt) — Auto-extracts Group Code, Group Name & Passport Numbers
                </span>
                <input type="file" accept=".pdf,.csv,.tsv,.txt" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Raw CSV Data (Auto-detected from file):
              </label>
              <textarea
                value={rawCsvText}
                onChange={(e) => handleTextChange(e.target.value)}
                rows={6}
                className="w-full text-xs font-mono border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* 3. Mutamer Parsed Table Preview */}
          {parsedData && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-900 uppercase">
                  Mutamers in Group: {parsedData.mutamers.length}
                </span>
                <span className="text-xs font-semibold text-slate-600">
                  {summarizePax(parsedData.mutamers).paxText}
                </span>
              </div>

              <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 text-[11px] sticky top-0">
                    <tr>
                      <th className="p-2 w-8 text-center">#</th>
                      <th className="p-2 w-28">Passport</th>
                      <th className="p-2">Mutamer Name</th>
                      <th className="p-2 w-12 text-center">G</th>
                      <th className="p-2 w-16 text-center">PAX</th>
                      <th className="p-2 w-12 text-center">Bed</th>
                      <th className="p-2 w-24">MOFA #</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedData.mutamers.map((m, idx) => (
                      <tr key={idx} className="hover:bg-amber-50/20">
                        <td className="p-2 text-center text-slate-500">{m.sno}</td>
                        <td className="p-2 font-mono font-bold text-slate-900">{m.passportNo}</td>
                        <td className="p-2 font-medium">{m.mutamerName}</td>
                        <td className="p-2 text-center">{m.gender}</td>
                        <td className="p-2 text-center font-semibold text-slate-700">{m.paxType}</td>
                        <td className="p-2 text-center">{m.bed}</td>
                        <td className="p-2 font-mono text-slate-600">{m.mofaNo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleCreateGroup}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition shadow-md cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Save & Create Pilgrim Group #{groupNoOverride}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Active Pilgrim Groups Dashboard (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-600" />
                Active Pilgrim Groups ({groups.length})
              </h3>
              <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                Auto-saved
              </span>
            </div>

            <p className="text-[11px] text-slate-500">
              Groups created from Excel imports. Click <span className="font-bold text-slate-800">"Create Voucher"</span> to generate a 6-sector voucher instantly.
            </p>

            <div className="space-y-3">
              {groups.map((grp) => (
                <div
                  key={grp.id}
                  className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 hover:bg-slate-50 transition space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-900">
                          Grp #{grp.groupNo}
                        </span>
                        <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                          {grp.groupName}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-1">
                        Sub-Agent Client:{' '}
                        <span className="font-semibold text-slate-900">
                          {grp.subAgentCompany} ({grp.subAgentCity})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Visa Company:{' '}
                        <span className="font-semibold text-blue-900">
                          {grp.visaCompanyName}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        grp.voucherStatus === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : grp.voucherStatus === 'draft'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {grp.voucherStatus === 'none' ? 'No Voucher Yet' : grp.voucherStatus}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                    <div>
                      {grp.mutamers.length} Mutamers • {grp.paxSummary}
                    </div>
                    <button
                      onClick={() => onCreateVoucherForGroup(grp)}
                      className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition cursor-pointer shadow-xs"
                    >
                      Create Voucher
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Modal: Add Visa Company */}
      {isNewVisaCoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">Add New Visa Company</h3>
            <p className="text-xs text-slate-500 mb-4">
              Add a Saudi visa company / MOFA provider (e.g. Ziafa International, Bab Al-Umrah, Al-Deafah).
            </p>

            <form onSubmit={handleSaveNewVisaCompany} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bab Al-Umrah Services"
                  value={newCoName}
                  onChange={(e) => setNewCoName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">City / Branch</label>
                <input
                  type="text"
                  placeholder="e.g. Jeddah / Multan"
                  value={newCoCity}
                  onChange={(e) => setNewCoCity(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">WhatsApp Number</label>
                <input
                  type="text"
                  placeholder="e.g. +966 50 123 4567"
                  value={newCoWhatsapp}
                  onChange={(e) => setNewCoWhatsapp(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewVisaCoModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg cursor-pointer"
                >
                  Save Visa Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
