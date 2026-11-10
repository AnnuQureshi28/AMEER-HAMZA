import React, { useState, useEffect } from 'react';
import { Voucher } from '../types';
import { generateVoucherQRCode, printVoucherDocument } from '../utils/voucherUtils';
import {
  Printer,
  ShieldCheck,
  CheckCircle2,
  Clock,
  PhoneCall,
  Calendar,
  Building,
  Plane,
  Award,
} from 'lucide-react';

interface PublicVoucherViewProps {
  voucher: Voucher;
}

export const PublicVoucherView: React.FC<PublicVoucherViewProps> = ({ voucher }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'voucher' | 'guidelines'>('voucher');

  useEffect(() => {
    generateVoucherQRCode(voucher).then((url) => setQrCodeUrl(url));
  }, [voucher]);

  const totalNights = voucher.accommodations.reduce(
    (sum, acc) => sum + (Number(acc.nights) || 0),
    0
  );

  const isApproved = voucher.status === 'approved';
  const isDraft = voucher.status === 'draft';

  const formatWhatsapp = (val?: string) => {
    if (!val) return 'Whats APP: +92 300 8632190';
    if (val.toLowerCase().includes('whats app:')) return val;
    return `Whats APP: ${val}`;
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-3 sm:px-6 font-sans">
      {/* Public Verified Top Bar (No CRM Navigation, No Admin Tools) */}
      <div className="no-print max-w-[850px] mx-auto mb-6 bg-slate-950 text-white rounded-2xl shadow-xl border border-slate-800 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-white font-serif">
                Ameer Hamza Travels & Tours
              </span>
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  isApproved
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                {isApproved ? '✓ Verified E-Voucher' : '⚠ Draft Voucher'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Voucher #{voucher.voucherNo} • Family Head: {voucher.familyHead} ({voucher.mutamers.length} Mutamers)
            </p>
          </div>
        </div>

        {/* View Switcher & Print */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setActiveTab('voucher')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                activeTab === 'voucher'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Page 1: Itinerary
            </button>
            <button
              onClick={() => setActiveTab('guidelines')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                activeTab === 'guidelines'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Page 2: Guidelines (Urdu)
            </button>
          </div>

          <button
            onClick={() => printVoucherDocument(voucher.voucherNo)}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl shadow transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print / Save PDF (HV-{voucher.voucherNo.replace(/^HV-/, '')})
          </button>
        </div>
      </div>

      {/* Official Verified Notice */}
      <div className="no-print max-w-[850px] mx-auto mb-4 bg-emerald-50 border border-emerald-200 text-emerald-950 p-3 rounded-xl text-xs flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <span className="font-bold">Official Digital Verification:</span> This electronic voucher is registered in the Ameer Hamza Travels Central Logistics System under MOFA partner <span className="font-bold">{voucher.visaCompanyName}</span>.
          </div>
        </div>
        <div className="text-[10px] font-mono text-emerald-800 font-bold shrink-0">
          Ref: {voucher.manualNo}
        </div>
      </div>

      {/* =========================================================================
          PHYSICAL A4 VOUCHER LAYOUT (Pixel-matched to PDF)
          ========================================================================= */}
      <div className="max-w-[850px] mx-auto bg-white text-slate-900 shadow-2xl rounded-sm border border-slate-300 p-6 sm:p-8 print-container relative overflow-hidden">
        {/* Watermark Stamps */}
        {isApproved && <div className="watermark-approved">APPROVED</div>}
        {isDraft && <div className="watermark-draft">DRAFT ONLY</div>}

        {/* ================= PAGE 1 ================= */}
        <div className={activeTab === 'guidelines' ? 'hidden print:block' : 'block'}>
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3 mb-2">
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

            {/* Right Header: Visa Company */}
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

          {/* Group Details Strip */}
          <div className="flex justify-between items-center text-[10px] text-slate-700 bg-amber-50/70 border border-amber-200 px-3 py-1 mb-2 font-medium">
            <div>
              <span className="font-bold text-slate-950">Sub-Agent Client:</span> {voucher.agentCompany} ({voucher.agentCity})
            </div>
            <div>
              <span className="font-bold text-slate-950">Group:</span> {voucher.groupName || 'AMEERHAMZAONLYACC'} (#{voucher.groupNo || '1000'})
            </div>
            <div>
              <span className="font-bold text-slate-950">Visa Company:</span> {voucher.visaCompanyName || 'Ziafa International'}
            </div>
          </div>

          {/* Title Bar */}
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

          {/* Mutamers Table */}
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
                  <tr key={m.id || idx} className="border-b border-slate-300">
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

          {/* Accommodations Table (6 Sectors) */}
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
                  <th className="border-r border-slate-800 px-2 py-1 text-left w-28">Room Type</th>
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
                  <td colSpan={8} className="border-r border-slate-800 px-3 py-1 text-right uppercase">
                    Total Nights:
                  </td>
                  <td className="px-1.5 py-1 text-center text-slate-950 font-black">
                    {totalNights}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Transport Table */}
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

          {/* Flights & QR Code Row */}
          <div className="grid grid-cols-12 gap-2 mb-2.5 items-stretch">
            <div className="col-span-9 space-y-1.5">
              <div className="grid grid-cols-2 gap-2">
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

              <div className="text-[10px] leading-snug border border-slate-300 p-1.5 bg-slate-50/50">
                <span className="font-bold text-slate-950">Special Instructions:</span>{' '}
                <span className="text-slate-800">
                  {voucher.specialInstructions ||
                    'Strict adherence to group reporting time and hotel check-out hours required.'}
                </span>
              </div>
            </div>

            {/* QR Code */}
            <div className="col-span-3 border border-slate-800 p-1.5 flex flex-col items-center justify-center bg-white text-center">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="Voucher Verification QR"
                  className="w-24 h-24 object-contain"
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

          {/* On-ground Contacts */}
          <div>
            <div className="text-center mb-1">
              <h3 className="text-sm font-bold text-emerald-900 tracking-tight">
                Contact Information
              </h3>
              <p className="text-[9px] text-slate-600 italic">
                Your on-ground contacts for hotel check-in and transport.
              </p>
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
                {(voucher.groundContacts || []).map((c, idx) => (
                  <tr key={idx} className="border-b border-emerald-200/80">
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

          <div className="mt-4 pt-2 border-t border-slate-300 flex justify-between items-center text-[9px] text-slate-600">
            <div>
              <span className="font-bold">Ameer Hamza Travels & Tours</span> • Visa Partner:{' '}
              <span className="font-semibold text-slate-900">{voucher.visaCompanyName}</span>
            </div>
            <div>
              {isApproved ? (
                <span className="text-emerald-700 font-bold">
                  ✓ Verified & Approved: {voucher.approvedBy || 'Operations Desk'} ({voucher.approvedDate || 'Active'})
                </span>
              ) : (
                <span className="text-amber-700 font-bold">
                  ⚠ DRAFT VOUCHER: Unapproved Electronic Copy
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ================= PAGE 2 ================= */}
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
              Voucher Ref: {voucher.voucherNo} | Head: {voucher.familyHead} | Group: {voucher.groupName || voucher.groupNo}
            </div>
          </div>

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

          <div className="border border-slate-300 p-4 rounded-lg bg-slate-50 text-[11px] space-y-2 text-slate-800">
            <h4 className="font-bold text-slate-950 uppercase tracking-wider text-xs border-b border-slate-200 pb-1">
              Standard Operating Procedures for Mutamers
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <span className="font-bold text-slate-900">Hotel Check-in & Out:</span> Check-in begins at 16:00 KSA time. Standard checkout is 12:00–14:00.
              </div>
              <div>
                <span className="font-bold text-slate-900">Airport Reporting:</span> All passengers must assemble in hotel lobby 5 to 6 hours before departure flight time.
              </div>
              <div>
                <span className="font-bold text-slate-900">24/7 Helpline:</span> Ameer Hamza Central Desk: +92 300 8632190 / Saudi Ministry of Hajj: 1966
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-300 flex justify-between items-center text-[10px] text-slate-500">
            <div>Ameer Hamza Travels & Tours - Official Pilgrim Advisory</div>
            <div className="font-mono">Page 2 of 2</div>
          </div>
        </div>
      </div>
    </div>
  );
};
