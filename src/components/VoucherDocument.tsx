import React, { useEffect, useState } from 'react';
import { Voucher, GroundContact, VisaCompany } from '../types';
import { DEFAULT_GROUND_CONTACTS } from '../data/initialData';
import { generateVoucherQRCode, printVoucherDocument, formatVoucherDisplayNo } from '../utils/voucherUtils';
import {
  Printer,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Building,
  Plane,
  Users,
  PhoneCall,
  Briefcase,
  Edit3,
  Plus,
  Trash2,
  X,
  Check,
} from 'lucide-react';

interface VoucherDocumentProps {
  voucher: Voucher;
  onBack?: () => void;
  onApprove?: (voucherId: string) => void;
  onReject?: (voucherId: string, reason: string) => void;
  onUpdateContacts?: (voucherId: string, contacts: GroundContact[]) => void;
  visaCompanies?: VisaCompany[];
  onChangeVisaCompany?: (voucherId: string, visaCompany: VisaCompany) => void;
  onEditVoucher?: (voucher: Voucher) => void;
  onDeleteVoucher?: (voucherId: string) => void;
  userRole: 'admin' | 'staff' | 'agent';
  onVerifyClick?: (voucher: Voucher) => void;
}

export const VoucherDocument: React.FC<VoucherDocumentProps> = ({
  voucher,
  onBack,
  onApprove,
  onReject,
  onUpdateContacts,
  visaCompanies = [],
  onChangeVisaCompany,
  onEditVoucher,
  onDeleteVoucher,
  userRole,
  onVerifyClick,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [activeTab, setActiveTab] = useState<'voucher' | 'guidelines'>('voucher');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // Ground Contacts editing state
  const [groundContacts, setGroundContacts] = useState<GroundContact[]>(
    voucher.groundContacts && voucher.groundContacts.length > 0
      ? voucher.groundContacts
      : DEFAULT_GROUND_CONTACTS
  );
  const [isEditStaffOpen, setIsEditStaffOpen] = useState(false);
  const [tempContacts, setTempContacts] = useState<GroundContact[]>([]);
  const [staffSavedNotice, setStaffSavedNotice] = useState(false);

  useEffect(() => {
    generateVoucherQRCode(voucher).then((url) => setQrCodeUrl(url));
    if (voucher.groundContacts && voucher.groundContacts.length > 0) {
      setGroundContacts(voucher.groundContacts);
    }
  }, [voucher]);

  const openEditStaffModal = () => {
    setTempContacts(groundContacts.map((c) => ({ ...c })));
    setIsEditStaffOpen(true);
  };

  const handleUpdateTempContact = (index: number, field: keyof GroundContact, value: string) => {
    const updated = [...tempContacts];
    updated[index] = { ...updated[index], [field]: value };
    setTempContacts(updated);
  };

  const handleAddTempContact = () => {
    setTempContacts([
      ...tempContacts,
      {
        city: 'Makkah',
        name: '',
        role: 'Hotel Check-in',
        contact: '+966 ',
      },
    ]);
  };

  const handleRemoveTempContact = (index: number) => {
    setTempContacts(tempContacts.filter((_, i) => i !== index));
  };

  const handleResetTempToDefaults = () => {
    setTempContacts(DEFAULT_GROUND_CONTACTS.map((c) => ({ ...c })));
  };

  const handleSaveStaffChanges = () => {
    setGroundContacts(tempContacts);
    if (onUpdateContacts) {
      onUpdateContacts(voucher.id, tempContacts);
    }
    setIsEditStaffOpen(false);
    setStaffSavedNotice(true);
    setTimeout(() => setStaffSavedNotice(false), 3000);
  };

  const totalNights = voucher.accommodations.reduce(
    (sum, acc) => sum + (Number(acc.nights) || 0),
    0
  );

  const handlePrint = () => {
    printVoucherDocument(voucher.voucherNo);
  };

  const isApproved = voucher.status === 'approved';
  const isDraft = voucher.status === 'draft';
  const canApprove =
    (userRole === 'admin' || userRole === 'staff') && voucher.status !== 'approved';

  // Format visa whatsapp cleanly
  const formatWhatsapp = (val?: string) => {
    if (!val) return 'Whats APP: +92 300 8632190';
    if (val.toLowerCase().includes('whats app:')) return val;
    return `Whats APP: ${val}`;
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-3 sm:px-6">
      {/* Top Action Bar (Hidden in print) */}
      <div className="no-print max-w-[850px] mx-auto mb-6 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-800 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-amber-400">{voucher.voucherNo}</span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                  isApproved
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : isDraft
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : voucher.status === 'rejected'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}
              >
                {voucher.status}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Sub-Agent: <span className="text-slate-200 font-semibold">{voucher.agentCompany}</span> | Visa Co:{' '}
              <span className="text-amber-300 font-semibold">{voucher.visaCompanyName || 'Ziafa International'}</span>
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg text-xs">
          <button
            onClick={() => setActiveTab('voucher')}
            className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
              activeTab === 'voucher'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Page 1: Voucher Itinerary
          </button>
          <button
            onClick={() => setActiveTab('guidelines')}
            className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
              activeTab === 'guidelines'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Page 2: Pilgrim Guidelines (Urdu)
          </button>
        </div>

        {/* Control Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {(userRole === 'admin' || userRole === 'staff') && visaCompanies.length > 0 && onChangeVisaCompany && (
            <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1">
              <Briefcase className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[10px] text-slate-300 font-semibold whitespace-nowrap">Visa Co:</span>
              <select
                value={voucher.visaCompanyId}
                onChange={(e) => {
                  const selected = visaCompanies.find((vc) => vc.id === e.target.value);
                  if (selected) onChangeVisaCompany(voucher.id, selected);
                }}
                className="bg-slate-900 text-amber-300 text-xs font-bold rounded px-2 py-1 border border-slate-700 focus:outline-none cursor-pointer"
                title="Change Visa Company on this voucher"
              >
                {visaCompanies.map((vc) => (
                  <option key={vc.id} value={vc.id}>
                    {vc.companyName} ({vc.branchCity})
                  </option>
                ))}
              </select>
            </div>
          )}

          {onEditVoucher && (userRole === 'admin' || userRole === 'staff' || !isApproved) && (
            <button
              onClick={() => onEditVoucher(voucher)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition cursor-pointer"
              title="Edit voucher details, hotels, transport, or mutamers"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Voucher
            </button>
          )}

          {onDeleteVoucher && (userRole === 'admin' || userRole === 'staff' || !isApproved) && (
            confirmDeleteOpen ? (
              <div className="flex items-center gap-1.5 bg-rose-950 border border-rose-700 rounded-lg px-2.5 py-1.5 text-xs">
                <span className="text-rose-200 font-semibold">Delete?</span>
                <button
                  onClick={() => onDeleteVoucher(voucher.id)}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-2 py-0.5 rounded cursor-pointer"
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirmDeleteOpen(false)}
                  className="text-slate-300 hover:text-white px-1 cursor-pointer"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDeleteOpen(true)}
                className="flex items-center gap-1.5 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/70 text-rose-300 text-xs font-medium px-2.5 py-2 rounded-lg transition cursor-pointer"
                title="Delete this voucher"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            )
          )}

          {canApprove && (
            <>
              <button
                onClick={() => onApprove && onApprove(voucher.id)}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-sm transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve Voucher
              </button>
              <button
                onClick={() => setRejectModalOpen(true)}
                className="flex items-center gap-1.5 bg-rose-900/40 hover:bg-rose-900/60 border border-rose-700/50 text-rose-300 text-xs font-medium px-3 py-2 rounded-lg transition cursor-pointer"
              >
                Reject
              </button>
            </>
          )}

          <button
            onClick={() => onVerifyClick && onVerifyClick(voucher)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium px-3 py-2 rounded-lg transition cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            Verify QR
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg shadow transition cursor-pointer"
            title="Print or Save as PDF"
          >
            <Printer className="w-4 h-4" />
            Print / PDF
          </button>
        </div>
      </div>

      {/* REJECTION MODAL */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              Reject Voucher {voucher.voucherNo}
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              Specify the reason for returning this draft voucher to the B2B Sub-Agent ({voucher.agentCompany}).
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. MOFA number mismatch, hotel confirmation pending, dates conflict..."
              rows={3}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 mb-4 focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onReject) onReject(voucher.id, rejectionReason || 'Information incomplete');
                  setRejectModalOpen(false);
                }}
                className="px-4 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-500 cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PHYSICAL PRINTABLE A4 VOUCHER CONTAINER
          Pixel-matched to the uploaded Hotel_Voucher__5__6872e5e8.pdf
          ========================================================================= */}
      <div className="max-w-[850px] mx-auto bg-white text-slate-900 shadow-2xl rounded-sm border border-slate-300 p-6 sm:p-8 print-container relative overflow-hidden">
        {/* WATERMARK STAMPS */}
        {isApproved && <div className="watermark-approved">APPROVED</div>}
        {isDraft && <div className="watermark-draft">DRAFT ONLY</div>}

        {/* ================= PAGE 1 CONTENT ================= */}
        <div className={activeTab === 'guidelines' ? 'hidden print:block' : 'block'}>
          {/* 1. HEADER SECTION (Left: Ameer Hamza, Center: Logo, Right: Visa Company) */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3 mb-2">
            {/* Left: Agency details & voucher summary */}
            <div className="w-[33%] text-left">
              <h1 className="text-xl font-black text-slate-950 tracking-tight font-serif">
                Ameer Hamza Travel
              </h1>
              <div className="text-[11px] leading-tight text-slate-800 space-y-0.5 mt-1 font-medium">
                <div>
                  <span className="font-bold">Voucher Date:</span> {voucher.voucherDate}
                </div>
                <div>
                  <span className="font-bold">Package:</span> {voucher.packageType}
                </div>
                <div>
                  <span className="font-bold">PAX:</span> {voucher.paxCountText}
                </div>
              </div>
            </div>

            {/* Center: Brand Logo */}
            <div className="w-[34%] flex flex-col items-center justify-center text-center px-1">
              <img
                src="/assets/aistudio/WhatsApp_Image_2026-09-19_at_6.05.56_PM_e36ed21d.jpeg"
                alt="Ameer Hamza Travels & Tours"
                className="h-16 object-contain max-w-[200px]"
              />
              <div className="text-[9px] uppercase tracking-wider font-bold text-amber-600 mt-0.5">
                Faith • Trust • Excellence
              </div>
            </div>

            {/* Right: Visa Company (e.g. Ziafa International, Bab Al-Umrah) */}
            <div className="w-[33%] text-right">
              <h2 className="text-lg font-bold text-blue-900 leading-tight">
                {voucher.visaCompanyName || 'Ziafa International'}
              </h2>
              <div className="text-[11px] leading-tight text-slate-800 space-y-0.5 mt-1">
                <div className="font-semibold text-slate-900">
                  {voucher.visaCompanyName || 'Ziafa International'}
                </div>
                <div className="text-slate-700">{voucher.visaCompanyCity || 'Multan'}</div>
                <div>{formatWhatsapp(voucher.visaCompanyWhatsapp)}</div>
              </div>
            </div>
          </div>

          {/* Sub-Agent / Group Metadata Strip */}
          <div className="flex justify-between items-center text-[10px] text-slate-700 bg-amber-50/70 border border-amber-200 px-3 py-1 mb-2 font-medium">
            <div>
              <span className="font-bold text-slate-950">Sub-Agent (Client):</span> {voucher.agentCompany} ({voucher.agentCity})
            </div>
            <div>
              <span className="font-bold text-slate-950">Group:</span> {voucher.groupName || 'AMEERHAMZAONLYACC'} (#{voucher.groupNo || '1000'})
            </div>
            <div>
              <span className="font-bold text-slate-950">Visa Provider:</span> {voucher.visaCompanyName || 'Ziafa International'}
            </div>
          </div>

          {/* 2. TITLE BAR & FAMILY HEAD / VOUCHER NO */}
          <div className="text-center mb-1">
            <span className="text-sm font-bold text-slate-900 border-b border-slate-400 pb-0.5 px-4 tracking-wide uppercase">
              Hotel Voucher
            </span>
          </div>

          <div className="border border-slate-900 bg-slate-50 grid grid-cols-12 text-xs font-semibold py-1.5 px-3 mb-2">
            <div className="col-span-5 text-left truncate">
              <span className="font-bold text-slate-950">Family Head:</span>{' '}
              <span className="font-extrabold text-slate-900">{voucher.familyHead}</span>
            </div>
            <div className="col-span-3 text-center font-black text-slate-950 text-sm tracking-wider">
              {voucher.voucherNo}
            </div>
            <div className="col-span-4 text-right">
              <span className="font-bold text-slate-950">Manual No:</span>{' '}
              <span className="font-extrabold tracking-widest text-slate-900">{voucher.manualNo}</span>
            </div>
          </div>

          {/* 3. MUTAMERS TABLE */}
          <div className="mb-2.5">
            <div className="text-[10px] font-bold text-center uppercase tracking-wider text-slate-700 mb-0.5">
              Mutamers
            </div>
            <table className="w-full border-collapse border border-slate-800 text-[10px]">
              <thead>
                <tr className="bg-slate-100 text-slate-950 border-b border-slate-800 font-bold">
                  <th className="border-r border-slate-800 px-1.5 py-1 text-center w-8">SNO</th>
                  <th className="border-r border-slate-800 px-1.5 py-1 text-left w-24">Passport</th>
                  <th className="border-r border-slate-800 px-2 py-1 text-left">Mutamer Name</th>
                  <th className="border-r border-slate-800 px-1 py-1 text-center w-7">G</th>
                  <th className="border-r border-slate-800 px-1.5 py-1 text-center w-12">PAX</th>
                  <th className="border-r border-slate-800 px-1 py-1 text-center w-8">Bed</th>
                  <th className="border-r border-slate-800 px-1.5 py-1 text-center w-24">MOFA #</th>
                  <th className="border-r border-slate-800 px-1.5 py-1 text-center w-14">GRP #</th>
                  <th className="border-r border-slate-800 px-1.5 py-1 text-center w-20">Visa #</th>
                  <th className="px-1.5 py-1 text-center w-16">PNR</th>
                </tr>
              </thead>
              <tbody>
                {voucher.mutamers.map((m, idx) => (
                  <tr key={m.id || idx} className="border-b border-slate-300 hover:bg-slate-50/50">
                    <td className="border-r border-slate-300 px-1.5 py-0.5 text-center font-semibold">
                      {m.sno}
                    </td>
                    <td className="border-r border-slate-300 px-1.5 py-0.5 font-mono font-medium">
                      {m.passportNo}
                    </td>
                    <td className="border-r border-slate-300 px-2 py-0.5 font-medium">
                      {m.mutamerName}
                    </td>
                    <td className="border-r border-slate-300 px-1 py-0.5 text-center">{m.gender}</td>
                    <td className="border-r border-slate-300 px-1.5 py-0.5 text-center">{m.paxType}</td>
                    <td className="border-r border-slate-300 px-1 py-0.5 text-center">{m.bed}</td>
                    <td className="border-r border-slate-300 px-1.5 py-0.5 text-center font-mono">
                      {m.mofaNo}
                    </td>
                    <td className="border-r border-slate-300 px-1.5 py-0.5 text-center">{m.grpNo}</td>
                    <td className="border-r border-slate-300 px-1.5 py-0.5 text-center font-mono">
                      {m.visaNo}
                    </td>
                    <td className="px-1.5 py-0.5 text-center font-mono">{m.pnr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 4. ACCOMMODATION TABLE (SUPPORTING UP TO 6+ SECTORS) */}
          <div className="mb-2.5">
            <div className="text-[10px] font-bold text-center uppercase tracking-wider text-slate-700 mb-0.5">
              Accommodation ({voucher.accommodations.length} Sectors)
            </div>
            <table className="w-full border-collapse border border-slate-800 text-[10px]">
              <thead>
                <tr className="bg-slate-100 text-slate-950 border-b border-slate-800 font-bold">
                  <th className="border-r border-slate-800 px-2 py-1 text-left w-18">City</th>
                  <th className="border-r border-slate-800 px-2 py-1 text-left">Hotel Name</th>
                  <th className="border-r border-slate-800 px-1.5 py-1 text-center w-16">View</th>
                  <th className="border-r border-slate-800 px-1 py-1 text-center w-10">Meal</th>
                  <th className="border-r border-slate-800 px-1.5 py-1 text-center w-18">Conf#</th>
                  <th className="border-r border-slate-800 px-2 py-1 text-left w-24">Room Type</th>
                  <th className="border-r border-slate-800 px-1 py-1 text-center w-10">Qty</th>
                  <th className="border-r border-slate-800 px-1.5 py-1 text-center w-18">Checkin</th>
                  <th className="border-r border-slate-800 px-1.5 py-1 text-center w-18">Checkout</th>
                  <th className="px-1.5 py-1 text-center w-12">Nights</th>
                </tr>
              </thead>
              <tbody>
                {voucher.accommodations.map((acc, idx) => (
                  <tr key={acc.id || idx} className="border-b border-slate-300">
                    <td className="border-r border-slate-300 px-2 py-0.5 font-semibold text-slate-900">
                      {acc.city}
                    </td>
                    <td className="border-r border-slate-300 px-2 py-0.5 font-medium">
                      {acc.hotelName}
                    </td>
                    <td className="border-r border-slate-300 px-1.5 py-0.5 text-center text-slate-700">
                      {acc.view || 'Standard'}
                    </td>
                    <td className="border-r border-slate-300 px-1 py-0.5 text-center font-semibold">
                      {acc.meal || 'RO'}
                    </td>
                    <td className="border-r border-slate-300 px-1.5 py-0.5 text-center font-mono">
                      {acc.confNo || '-'}
                    </td>
                    <td className="border-r border-slate-300 px-2 py-0.5 text-slate-800">
                      {acc.roomType}
                    </td>
                    <td className="border-r border-slate-300 px-1 py-0.5 text-center font-semibold">
                      {acc.roomCount || 1}
                    </td>
                    <td className="border-r border-slate-300 px-1.5 py-0.5 text-center whitespace-nowrap">
                      {acc.checkin}
                    </td>
                    <td className="border-r border-slate-300 px-1.5 py-0.5 text-center whitespace-nowrap">
                      {acc.checkout}
                    </td>
                    <td className="px-1.5 py-0.5 text-center font-bold">{acc.nights}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold border-t border-slate-800 text-[10px]">
                  <td colSpan={9} className="border-r border-slate-800 px-3 py-1 text-right uppercase">
                    Total Nights:
                  </td>
                  <td className="px-1.5 py-1 text-center text-slate-950 font-black">
                    {totalNights}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 5. TRANSPORT / SERVICES SECTORS */}
          <div className="mb-2.5">
            <div className="text-[10px] font-bold text-center uppercase tracking-wider text-slate-700 mb-0.5">
              Transport/Services
            </div>
            <table className="w-full border-collapse border border-slate-800 text-[10px]">
              <thead>
                <tr className="bg-slate-100 text-slate-950 border-b border-slate-800 font-bold">
                  <th className="border-r border-slate-800 px-2 py-1 text-center w-24">Travel Date</th>
                  <th className="border-r border-slate-800 px-2 py-1 text-left w-48">Transporter</th>
                  <th className="border-r border-slate-800 px-2 py-1 text-left w-40">Type</th>
                  <th className="px-2 py-1 text-left">Description</th>
                </tr>
              </thead>
              <tbody>
                {voucher.transportServices.length > 0 ? (
                  voucher.transportServices.map((t, idx) => (
                    <tr key={t.id || idx} className="border-b border-slate-300">
                      <td className="border-r border-slate-300 px-2 py-0.5 text-center font-medium">
                        {t.travelDate}
                      </td>
                      <td className="border-r border-slate-300 px-2 py-0.5">{t.transporter}</td>
                      <td className="border-r border-slate-300 px-2 py-0.5 font-medium">
                        {t.vehicleType}
                      </td>
                      <td className="px-2 py-0.5 font-medium">{t.routeDescription}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-1 text-slate-500 italic">
                      Self Transport / Not Included
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 6. FLIGHT DETAILS & QR CODE ROW */}
          <div className="grid grid-cols-12 gap-2 mb-2.5 items-stretch">
            {/* Flights Tables (9 Cols) */}
            <div className="col-span-9 space-y-1.5">
              <div className="grid grid-cols-2 gap-2">
                {/* Departure Flight */}
                <div>
                  <div className="text-[9px] font-bold text-center uppercase border border-slate-800 bg-slate-100 py-0.5">
                    Departure (Pakistan to KSA)
                  </div>
                  <table className="w-full border border-slate-800 border-t-0 text-[9px] text-center">
                    <thead>
                      <tr className="bg-slate-50 font-bold border-b border-slate-800">
                        <th className="border-r border-slate-800 py-0.5 px-1">Flight</th>
                        <th className="border-r border-slate-800 py-0.5 px-1">Sector</th>
                        <th className="border-r border-slate-800 py-0.5 px-1">Departure</th>
                        <th className="py-0.5 px-1">Arrival</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border-r border-slate-300 py-0.5 font-bold">
                          {voucher.flights?.departure?.flightNo || '-'}
                        </td>
                        <td className="border-r border-slate-300 py-0.5">
                          {voucher.flights?.departure?.sector || '-'}
                        </td>
                        <td className="border-r border-slate-300 py-0.5 whitespace-nowrap">
                          {voucher.flights?.departure?.depTime || '-'}
                        </td>
                        <td className="py-0.5 whitespace-nowrap">
                          {voucher.flights?.departure?.arrTime || '-'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Return Flight */}
                <div>
                  <div className="text-[9px] font-bold text-center uppercase border border-slate-800 bg-slate-100 py-0.5">
                    Arrival (KSA to PAK)
                  </div>
                  <table className="w-full border border-slate-800 border-t-0 text-[9px] text-center">
                    <thead>
                      <tr className="bg-slate-50 font-bold border-b border-slate-800">
                        <th className="border-r border-slate-800 py-0.5 px-1">Flight</th>
                        <th className="border-r border-slate-800 py-0.5 px-1">Sector</th>
                        <th className="border-r border-slate-800 py-0.5 px-1">Departure</th>
                        <th className="py-0.5 px-1">Arrival</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border-r border-slate-300 py-0.5 font-bold">
                          {voucher.flights?.arrival?.flightNo || '-'}
                        </td>
                        <td className="border-r border-slate-300 py-0.5">
                          {voucher.flights?.arrival?.sector || '-'}
                        </td>
                        <td className="border-r border-slate-300 py-0.5 whitespace-nowrap">
                          {voucher.flights?.arrival?.depTime || '-'}
                        </td>
                        <td className="py-0.5 whitespace-nowrap">
                          {voucher.flights?.arrival?.arrTime || '-'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Special Instructions */}
              <div className="text-[10px] leading-snug border border-slate-300 p-1.5 bg-slate-50/50">
                <span className="font-bold text-slate-950">Special Instructions:</span>{' '}
                <span className="text-slate-800">
                  {voucher.specialInstructions ||
                    'Strict adherence to group reporting time and hotel check-out hours required.'}
                </span>
              </div>
            </div>

            {/* QR Code (3 Cols) */}
            <div className="col-span-3 border border-slate-800 p-1.5 flex flex-col items-center justify-center bg-white text-center">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="Voucher Verification QR"
                  className="w-24 h-24 object-contain cursor-pointer hover:opacity-90 transition"
                  onClick={() => onVerifyClick && onVerifyClick(voucher)}
                  title="Click to verify voucher"
                />
              ) : (
                <div className="w-24 h-24 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                  QR Code
                </div>
              )}
              <span className="text-[8px] font-bold text-slate-600 mt-0.5 tracking-tight uppercase">
                Scan to Verify
              </span>
              <span className="text-[7px] text-slate-400 font-mono">{voucher.voucherNo}</span>
            </div>
          </div>

          {/* 7. CONTACT INFORMATION TABLE */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <div className="text-left flex-1">
                <h3 className="text-sm font-bold text-emerald-900 tracking-tight">
                  Contact Information
                </h3>
                <p className="text-[9px] text-slate-600 italic">
                  Your on-ground contacts for hotel check-in and transport.
                </p>
              </div>

              {/* Action to change staff names and phone numbers (no-print) */}
              <div className="no-print flex items-center gap-2">
                {staffSavedNotice && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded animate-in fade-in">
                    ✓ Staff Updated!
                  </span>
                )}
                <button
                  type="button"
                  onClick={openEditStaffModal}
                  className="text-[10px] font-bold text-emerald-950 bg-emerald-200 hover:bg-emerald-300 border border-emerald-400 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  title="Change staff names or numbers on this voucher"
                >
                  <Edit3 className="w-3 h-3 text-emerald-900" />
                  Change Staff & Numbers
                </button>
              </div>
            </div>

            <table className="w-full border-collapse border border-emerald-900 text-[10px]">
              <thead>
                <tr className="bg-emerald-950 text-white font-bold text-[9px] uppercase tracking-wider">
                  <th className="border-r border-emerald-800 px-3 py-1.5 text-center w-24">CITY</th>
                  <th className="border-r border-emerald-800 px-3 py-1.5 text-left w-36">NAME</th>
                  <th className="border-r border-emerald-800 px-3 py-1.5 text-left w-36">ROLE</th>
                  <th className="px-3 py-1.5 text-left">CONTACT</th>
                </tr>
              </thead>
              <tbody>
                {groundContacts.map((c, idx) => (
                  <tr key={idx} className="border-b border-emerald-200/80 hover:bg-emerald-50/30">
                    <td className="border-r border-emerald-200 px-3 py-1 text-center font-bold text-emerald-950">
                      {c.city}
                    </td>
                    <td className="border-r border-emerald-200 px-3 py-1 font-bold text-slate-900">
                      {c.name}
                    </td>
                    <td className="border-r border-emerald-200 px-3 py-1 text-slate-700">{c.role}</td>
                    <td className="px-3 py-1 font-bold font-mono text-slate-950 tracking-wider flex items-center gap-1.5">
                      <PhoneCall className="w-3 h-3 text-emerald-700 inline" />
                      {c.contact}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Approval Signature Footer */}
          <div className="mt-4 pt-2 border-t border-slate-300 flex justify-between items-center text-[9px] text-slate-600">
            <div>
              <span className="font-bold">Ameer Hamza Travels & Tours</span> • Sub-Agent Client:{' '}
              <span className="font-semibold text-slate-900">{voucher.agentCompany}</span> | Visa Co:{' '}
              <span className="font-semibold text-slate-900">{voucher.visaCompanyName || 'Ziafa International'}</span>
            </div>
            <div>
              {isApproved ? (
                <span className="text-emerald-700 font-bold">
                  ✓ Officially Approved by: {voucher.approvedBy || 'Operations Desk'} ({voucher.approvedDate || 'Active'})
                </span>
              ) : (
                <span className="text-amber-700 font-bold">
                  ⚠ DRAFT VOUCHER: Pending Ameer Hamza Staff Approval
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ================= PAGE 2: PILGRIM GUIDELINES (URDU & ENGLISH) ================= */}
        <div
          className={`print-page-break ${
            activeTab === 'voucher' ? 'hidden print:block' : 'block'
          } mt-8 print:mt-0 pt-6 print:pt-4 border-t-2 print:border-t-0 border-slate-300`}
        >
          <div className="text-center border-b-2 border-slate-900 pb-3 mb-4">
            <h2 className="text-xl font-bold font-urdu text-slate-950 mb-1" dir="rtl">
              رہنمائے معتمرین و ضروری ہدایات (حرمین شریفین)
            </h2>
            <p className="text-xs font-semibold text-slate-700 tracking-wide uppercase">
              Important Terms, Saudi Ministry Guidelines & Pilgrim Instructions
            </p>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Voucher Ref: {voucher.voucherNo} | Head: {voucher.familyHead} | Group:{' '}
              {voucher.groupName || voucher.groupNo || 'Direct'} | Sub-Agent: {voucher.agentCompany}
            </div>
          </div>

          {/* Urdu Guidelines List */}
          <div
            className="font-urdu text-right space-y-3.5 text-sm leading-relaxed text-slate-900 bg-amber-50/40 p-5 rounded-lg border border-amber-200/60 mb-6"
            dir="rtl"
          >
            <div className="flex items-start gap-2">
              <span className="font-black text-amber-700 text-lg leading-none mt-1">•</span>
              <p>
                آپ کا ہوٹل اور پیکج اس دستاویز میں لکھ دیا گیا ہے۔ اس کے مطابق آپ کو رہائش اور دیگر سہولیات فراہم کی جائیں گی۔
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-black text-amber-700 text-lg leading-none mt-1">•</span>
              <p>
                سفری سامان حرمین شریفین کی طرف لے جانا سعودی انتظامیہ کی طرف سے ممنوع ہے۔ خلاف ورزی کی صورت میں حکومت جرمانہ کر سکتی ہے۔ جس کی ادائیگی آپ کے ذمہ ہوگی۔
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-black text-rose-700 text-lg leading-none mt-1">•</span>
              <p className="text-rose-950 font-bold">
                نشہ آور اشیاء سعودی عرب میں سختی سے ممنوع ہیں، سعودی میں منشیات لانے کی سزا موت ہے۔
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-black text-amber-700 text-lg leading-none mt-1">•</span>
              <p>
                حرمین شریفین (مسجد الحرام و مسجد نبوی) کے اندر زمین پر گری ہوئی کوئی چیز (پرس، موبائل فون یا کوئی قیمتی چیز) ہرگز نہ اٹھائیں ورنہ آپ مشکل میں پڑ جائیں گے۔
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-black text-amber-700 text-lg leading-none mt-1">•</span>
              <p>
                جدہ اور مدینہ ایئرپورٹ پر امیگریشن اور سعودی وزارتِ حج کمپنی کے انتظام میں 3 سے 5 گھنٹے لگ سکتے ہیں، لہٰذا صبر و تحمل کا مظاہرہ فرمائیں اور سعودی پہنچ کر اپنے گھر والوں کو خیریت سے پہنچنے کا فون ضرور کر لیں۔
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-black text-amber-700 text-lg leading-none mt-1">•</span>
              <p>
                ہوٹل سے چیک آؤٹ ٹائم دوپہر 2 بجے ہے۔ اس کے بعد اگلی Night چارج ہوگی اور ہوٹل واپسی کی چابیاں اور واؤچر کی کاپی آپ کے پاس ہونی چاہیے۔
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-black text-amber-700 text-lg leading-none mt-1">•</span>
              <p>
                واپسی فلائٹ سے چھ سے آٹھ گھنٹے پہلے معتمر اپنے سامان سمیت ہوٹل کی ریسپشن پر موجود رہیں گے۔ واپسی کی فلائٹ کی معلومات معتمر کی اپنی ذمہ داری ہے۔ نیچے دیئے ہوئے نمبروں پر رابطہ کریں۔
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-black text-rose-700 text-lg leading-none mt-1">•</span>
              <p>
                سعودی حکومت کے قانون کے مطابق کمپنی کے ہوٹلوں کے علاوہ کسی غیر رجسٹرڈ ہوٹل میں قیام کرنا جرم ہے۔ اگر کوئی معتمر اپنے طور پر نقد ہوٹل کا کمرہ لے گا تو اس کے قانونی اور معاشی نقصان کا خود ذمہ دار ہوگا۔
              </p>
            </div>
          </div>

          {/* English Summary Box */}
          <div className="border border-slate-300 p-4 rounded-lg bg-slate-50 text-[11px] space-y-2 text-slate-800">
            <h4 className="font-bold text-slate-950 uppercase tracking-wider text-xs border-b border-slate-200 pb-1">
              Standard Operating Procedures for Mutamers
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <span className="font-bold text-slate-900">Hotel Check-in & Out:</span> Check-in begins at 16:00 KSA time. Standard checkout is 12:00–14:00. Any extension incurs full next-day charges.
              </div>
              <div>
                <span className="font-bold text-slate-900">Airport Reporting:</span> All passengers must assemble in hotel lobby 5 to 6 hours before departure flight time.
              </div>
              <div>
                <span className="font-bold text-slate-900">Luggage Weight:</span> Standard allowance is 2 pieces up to 23kg each + 7kg hand luggage + 5L Zamzam (subject to airline rules).
              </div>
              <div>
                <span className="font-bold text-slate-900">24/7 Helpline:</span> Ameer Hamza Central Desk: +92 300 8632190 / Saudi Ministry of Hajj Helpline: 1966
              </div>
            </div>
          </div>

          {/* Page 2 Signoff */}
          <div className="mt-8 pt-4 border-t border-slate-300 flex justify-between items-center text-[10px] text-slate-500">
            <div>Ameer Hamza Travels & Tours - Official Pilgrim Advisory</div>
            <div className="font-mono">Page 2 of 2</div>
          </div>
        </div>
      </div>

      {/* MODAL: EDIT STAFF NAMES AND PHONE NUMBERS */}
      {isEditStaffOpen && (
        <div className="no-print fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 my-6">
            {/* Header */}
            <div className="bg-emerald-950 text-white p-5 flex items-center justify-between border-b border-emerald-900">
              <div className="flex items-center gap-2.5">
                <PhoneCall className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-black text-sm text-white">
                    Change Staff Names & Numbers for Voucher {voucher.voucherNo}
                  </h3>
                  <p className="text-[11px] text-emerald-200/80">
                    Update Makkah and Madinah ground team details printed on this voucher
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditStaffOpen(false)}
                className="w-8 h-8 rounded-full bg-emerald-900/60 hover:bg-emerald-900 text-emerald-200 hover:text-white flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Table */}
            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-800">
                  On-Ground Contacts List ({tempContacts.length})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetTempToDefaults}
                    className="text-[11px] text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition cursor-pointer"
                  >
                    Reset Defaults
                  </button>
                  <button
                    type="button"
                    onClick={handleAddTempContact}
                    className="text-[11px] font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 px-3 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    Add Staff Row
                  </button>
                </div>
              </div>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {tempContacts.map((c, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200"
                  >
                    <div className="col-span-3">
                      <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">City</label>
                      <select
                        value={c.city}
                        onChange={(e) => handleUpdateTempContact(idx, 'city', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="Makkah">Makkah</option>
                        <option value="Medinah">Medinah</option>
                        <option value="Jeddah">Jeddah</option>
                        <option value="Airport Desk">Airport Desk</option>
                        <option value="Central Ops">Central Ops</option>
                      </select>
                    </div>

                    <div className="col-span-3">
                      <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Staff Name</label>
                      <input
                        type="text"
                        value={c.name}
                        onChange={(e) => handleUpdateTempContact(idx, 'name', e.target.value)}
                        placeholder="Staff Name"
                        className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="col-span-3">
                      <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Duty / Role</label>
                      <input
                        type="text"
                        value={c.role}
                        onChange={(e) => handleUpdateTempContact(idx, 'role', e.target.value)}
                        placeholder="e.g. Hotel Check-in"
                        className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Number</label>
                      <input
                        type="text"
                        value={c.contact}
                        onChange={(e) => handleUpdateTempContact(idx, 'contact', e.target.value)}
                        placeholder="+966 5..."
                        className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-mono font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="col-span-1 text-center pt-3">
                      <button
                        type="button"
                        onClick={() => handleRemoveTempContact(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        title="Delete staff row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditStaffOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-semibold hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveStaffChanges}
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  Save & Update Voucher
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
