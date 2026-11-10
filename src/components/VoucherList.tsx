import React, { useState } from 'react';
import { Voucher, B2BAgent } from '../types';
import {
  Search,
  Filter,
  Plus,
  Eye,
  Printer,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  Building2,
  Users,
  Calendar,
  FileSpreadsheet,
  Edit2,
  Trash2,
} from 'lucide-react';

interface VoucherListProps {
  vouchers: Voucher[];
  onSelectVoucher: (voucher: Voucher) => void;
  onCreateNew: () => void;
  onApprove: (voucherId: string) => void;
  onVerify: (voucher: Voucher) => void;
  onEditVoucher?: (voucher: Voucher) => void;
  onDeleteVoucher?: (voucherId: string) => void;
  userRole: 'admin' | 'staff' | 'agent';
  currentAgent: B2BAgent;
}

export const VoucherList: React.FC<VoucherListProps> = ({
  vouchers,
  onSelectVoucher,
  onCreateNew,
  onApprove,
  onVerify,
  onEditVoucher,
  onDeleteVoucher,
  userRole,
  currentAgent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'pending' | 'approved' | 'rejected'>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Filter by user role: agents only see their own agency vouchers, admin sees all
  const accessibleVouchers =
    userRole === 'admin' || userRole === 'staff'
      ? vouchers
      : vouchers.filter((v) => v.agentId === currentAgent.id);

  const filteredVouchers = accessibleVouchers.filter((v) => {
    const matchesSearch =
      v.voucherNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.familyHead.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.groupName && v.groupName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      v.agentCompany.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.mutamers.some((m) => m.passportNo.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Umrah & Hotel Vouchers Management</h1>
            <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase">
              B2B Portal
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {userRole === 'admin'
              ? 'Central Administrative Dashboard: Review, approve, and audit partner agency vouchers.'
              : `Agency Workspace for ${currentAgent.companyName} (${currentAgent.city}). Create draft vouchers for approval.`}
          </p>
        </div>

        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition shadow-lg cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create New Voucher (6+ Sectors)
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[280px] flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Voucher #, Family Head, Passport, or Group..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({accessibleVouchers.length})
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
              statusFilter === 'approved'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Approved ({accessibleVouchers.filter((v) => v.status === 'approved').length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending ({accessibleVouchers.filter((v) => v.status === 'pending').length})
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
              statusFilter === 'draft'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Drafts ({accessibleVouchers.filter((v) => v.status === 'draft').length})
          </button>
        </div>
      </div>

      {/* Vouchers Table / Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="p-3 w-32">Voucher #</th>
                <th className="p-3 w-28">Status</th>
                <th className="p-3">Family Head / Group</th>
                <th className="p-3 w-28 text-center">PAX / Beds</th>
                <th className="p-3">Accommodation Sectors</th>
                <th className="p-3 w-40">Agent Account</th>
                <th className="p-3 w-28 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVouchers.map((v) => {
                const isApproved = v.status === 'approved';
                const isDraft = v.status === 'draft';
                const isPending = v.status === 'pending';
                const canApprove = (userRole === 'admin' || userRole === 'staff') && !isApproved;

                return (
                  <tr key={v.id} className="hover:bg-amber-50/20 transition">
                    <td className="p-3">
                      <div className="font-mono font-bold text-slate-950 text-sm">{v.voucherNo}</div>
                      <div className="text-[10px] text-slate-500">Ref: {v.manualNo}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{v.voucherDate}</div>
                    </td>

                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          isApproved
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : isDraft
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : isPending
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {isApproved && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {isDraft && <Clock className="w-3 h-3 text-amber-600" />}
                        {isPending && <AlertCircle className="w-3 h-3 text-blue-600" />}
                        {v.status}
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="font-bold text-slate-900 text-xs">{v.familyHead}</div>
                      {v.groupName && (
                        <div className="text-[10px] text-slate-500 font-mono">
                          Grp: {v.groupName} ({v.groupNo})
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400">Pkg: {v.packageType}</div>
                    </td>

                    <td className="p-3 text-center">
                      <div className="font-bold text-slate-800">{v.mutamers.length} Mutamers</div>
                      <div className="text-[10px] text-slate-500">{v.paxCountText}</div>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-1 text-xs font-semibold text-slate-800">
                        <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{v.accommodations.length} Hotel Sectors</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-xs mt-0.5">
                        {v.accommodations.map((a) => `${a.city}: ${a.hotelName} (${a.nights}n)`).join(' ➔ ')}
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{v.agentCompany}</div>
                      <div className="text-[10px] text-slate-500">{v.agentCity}</div>
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectVoucher(v)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center gap-1 transition cursor-pointer shadow-xs"
                          title="Open physical voucher & print view"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>

                        {onEditVoucher && (userRole === 'admin' || userRole === 'staff' || !isApproved) && (
                          <button
                            onClick={() => onEditVoucher(v)}
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition cursor-pointer"
                            title="Edit / Change Voucher"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {onDeleteVoucher && (userRole === 'admin' || userRole === 'staff' || !isApproved) && (
                          confirmDeleteId === v.id ? (
                            <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-lg px-1.5 py-0.5">
                              <button
                                onClick={() => {
                                  onDeleteVoucher(v.id);
                                  setConfirmDeleteId(null);
                                }}
                                className="text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-500 px-2 py-0.5 rounded cursor-pointer"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-[10px] font-semibold text-slate-600 hover:text-slate-900 px-1 cursor-pointer"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(v.id)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer"
                              title="Delete Voucher"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )
                        )}

                        <button
                          onClick={() => onVerify(v)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                          title="Verify QR code authenticity"
                        >
                          <ShieldCheck className="w-4 h-4 text-amber-600" />
                        </button>

                        {canApprove && (
                          <button
                            onClick={() => onApprove(v.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                            title="Approve this draft voucher"
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredVouchers.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No vouchers found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
