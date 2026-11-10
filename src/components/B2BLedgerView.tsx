import React, { useState } from 'react';
import { B2BAgent, LedgerEntry } from '../types';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Printer,
  Plus,
  Search,
  Filter,
  CheckCircle,
  FileText,
  Building,
  Phone,
} from 'lucide-react';

interface B2BLedgerViewProps {
  agents: B2BAgent[];
  selectedAgentId: string;
  onSelectAgent: (id: string) => void;
  ledgers: LedgerEntry[];
  onAddLedgerEntry: (entry: LedgerEntry) => void;
  userRole: 'admin' | 'staff' | 'agent';
}

export const B2BLedgerView: React.FC<B2BLedgerViewProps> = ({
  agents,
  selectedAgentId,
  onSelectAgent,
  ledgers,
  onAddLedgerEntry,
  userRole,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(500000);
  const [paymentDesc, setPaymentDesc] = useState<string>('Bank Transfer Deposit');
  const [paymentRef, setPaymentRef] = useState<string>('PAY-' + Math.floor(1000 + Math.random() * 9000));
  const [paymentMethod, setPaymentMethod] = useState<string>('Bank Transfer (Meezan Bank)');

  const currentAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];
  const agentLedgers = ledgers.filter((l) => l.agentId === currentAgent.id);

  const filteredEntries = agentLedgers.filter(
    (e) =>
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.refNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalDebits = agentLedgers
    .filter((l) => l.type === 'DEBIT')
    .reduce((sum, l) => sum + l.amountPKR, 0);

  const totalCredits = agentLedgers
    .filter((l) => l.type === 'CREDIT')
    .reduce((sum, l) => sum + l.amountPKR, 0);

  const netBalance = totalCredits - totalDebits; // positive = advance credit; negative = amount owed

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentAmount || paymentAmount <= 0) return;

    const newRunningBalance = (agentLedgers[agentLedgers.length - 1]?.runningBalancePKR || 0) + paymentAmount;

    const newEntry: LedgerEntry = {
      id: 'led-' + Date.now(),
      agentId: currentAgent.id,
      date: new Date().toISOString().split('T')[0],
      refNo: paymentRef || 'PAY-' + Math.floor(1000 + Math.random() * 9000),
      type: 'CREDIT',
      description: paymentDesc || 'Agent Payment Receipt',
      amountPKR: paymentAmount,
      runningBalancePKR: newRunningBalance,
      method: paymentMethod,
    };

    onAddLedgerEntry(newEntry);
    setIsPaymentModalOpen(false);
    setPaymentAmount(500000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">B2B Financial Ledger & Accounts</h1>
            <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase">
              Real-Time Balances
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track agency billing, voucher debits, bank payments, credit limits, and running balances.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {userRole === 'admin' && (
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Record Agent Payment
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Statement
          </button>
        </div>
      </div>

      {/* Agent Selector (Admin view) */}
      {userRole === 'admin' && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-700">Select B2B Partner:</span>
            <div className="flex flex-wrap gap-2">
              {agents.map((ag) => (
                <button
                  key={ag.id}
                  onClick={() => onSelectAgent(ag.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    ag.id === currentAgent.id
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {ag.companyName} ({ag.city})
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-slate-500">
            Credit Limit: <span className="font-bold text-slate-900">PKR {currentAgent.creditLimit.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Partner Details */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1">
            B2B Agent Account
          </span>
          <div className="text-base font-bold text-slate-900 truncate">{currentAgent.companyName}</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <Phone className="w-3 h-3 text-slate-400" />
            {currentAgent.whatsapp}
          </div>
          <div className="mt-2 text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded inline-block">
            {currentAgent.city} • Active Status
          </div>
        </div>

        {/* Card 2: Total Credits (Payments) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Payments Made
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-emerald-700">
            PKR {totalCredits.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Advance deposits & bank receipts</div>
        </div>

        {/* Card 3: Total Debits (Vouchers) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Voucher Debits
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-rose-700">
            PKR {totalDebits.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Booked hotel, transport & visa charges</div>
        </div>

        {/* Card 4: Net Balance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Current Available Balance
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-xl font-black ${netBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            PKR {Math.abs(netBalance).toLocaleString()}
            <span className="text-xs font-normal text-slate-500 ml-1">
              {netBalance >= 0 ? '(Cr Balance)' : '(Payable Owed)'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Credit Available: PKR {(currentAgent.creditLimit + netBalance).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Ledger Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Search & Actions Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative min-w-[280px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search reference # or description..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <FileText className="w-4 h-4 text-slate-400" />
            <span>Showing {filteredEntries.length} transaction records</span>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="p-3 w-28">Date</th>
                <th className="p-3 w-36">Reference #</th>
                <th className="p-3">Particulars / Description</th>
                <th className="p-3 w-24 text-center">Type</th>
                <th className="p-3 w-32 text-right">Debit (PKR)</th>
                <th className="p-3 w-32 text-right">Credit (PKR)</th>
                <th className="p-3 w-36 text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.map((entry, idx) => (
                <tr key={entry.id || idx} className="hover:bg-amber-50/20">
                  <td className="p-3 text-slate-600 whitespace-nowrap">{entry.date}</td>
                  <td className="p-3 font-mono font-bold text-slate-900">{entry.refNo}</td>
                  <td className="p-3 font-medium text-slate-800">
                    <div>{entry.description}</div>
                    {entry.method && (
                      <span className="text-[10px] text-slate-500">Mode: {entry.method}</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        entry.type === 'CREDIT'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {entry.type}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono font-medium text-rose-600">
                    {entry.type === 'DEBIT' ? entry.amountPKR.toLocaleString() : '-'}
                  </td>
                  <td className="p-3 text-right font-mono font-medium text-emerald-600">
                    {entry.type === 'CREDIT' ? entry.amountPKR.toLocaleString() : '-'}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900">
                    PKR {entry.runningBalancePKR.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-600" />
              Record Agent Payment / Deposit
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Posting credit to {currentAgent.companyName} ({currentAgent.city})
            </p>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Amount (PKR)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Receipt / Transaction Reference</label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  placeholder="e.g. MEZN-TXN-9021"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                >
                  <option value="Bank Transfer (Meezan Bank)">Bank Transfer (Meezan Bank)</option>
                  <option value="Bank Transfer (Habib Bank Ltd)">Bank Transfer (Habib Bank Ltd)</option>
                  <option value="Cash Receipt at Multan Office">Cash Receipt at Central Office</option>
                  <option value="Cross Cheque / Pay Order">Cross Cheque / Pay Order</option>
                  <option value="Adjustment / Discount Credit">Adjustment / Promotional Credit</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes / Description</label>
                <input
                  type="text"
                  value={paymentDesc}
                  onChange={(e) => setPaymentDesc(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                  placeholder="e.g. Winter season group advance booking"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  Post Payment Credit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
