import React, { useEffect, useState } from 'react';
import { Voucher } from '../types';
import { generateVoucherQRCode } from '../utils/voucherUtils';
import { ShieldCheck, CheckCircle2, AlertTriangle, X, Building, Plane, Users, Calendar, Award } from 'lucide-react';

interface QRVerificationModalProps {
  voucher: Voucher | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QRVerificationModal: React.FC<QRVerificationModalProps> = ({
  voucher,
  isOpen,
  onClose,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    if (voucher) {
      generateVoucherQRCode(voucher).then((url) => setQrCodeUrl(url));
    }
  }, [voucher]);

  if (!isOpen || !voucher) return null;

  const isApproved = voucher.status === 'approved';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        
        {/* Certificate Header Banner */}
        <div className={`p-6 text-center text-white ${isApproved ? 'bg-emerald-950' : 'bg-slate-900'} relative`}>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="mx-auto w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-3">
            {isApproved ? (
              <ShieldCheck className="w-10 h-10 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-10 h-10 text-amber-400" />
            )}
          </div>

          <h3 className="text-lg font-black tracking-tight text-white uppercase">
            Voucher Authenticity Certificate
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Official Electronic Verification Record
          </p>
        </div>

        {/* Verification Status Badge */}
        <div className="p-6 space-y-5">
          <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
            isApproved
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : 'bg-amber-50 border-amber-200 text-amber-950'
          }`}>
            {isApproved ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
            )}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider">
                {isApproved ? 'Official Status: VERIFIED & APPROVED' : 'Official Status: DRAFT / PENDING REVIEW'}
              </div>
              <div className="text-[11px] opacity-80 mt-0.5">
                {isApproved
                  ? `Authorized by Ameer Hamza Central Operations on ${voucher.approvedDate || 'Record'}`
                  : 'This voucher is currently in draft mode and has not yet been stamped by Ameer Hamza operations staff.'}
              </div>
            </div>
          </div>

          {/* QR Code & Voucher Summary Details */}
          <div className="grid grid-cols-12 gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="col-span-5 flex flex-col items-center justify-center text-center">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="Voucher QR Code"
                  className="w-28 h-28 object-contain bg-white p-1 rounded-xl shadow-xs border border-slate-200"
                />
              ) : (
                <div className="w-28 h-28 bg-slate-200 rounded-xl flex items-center justify-center text-xs text-slate-500">
                  QR
                </div>
              )}
              <span className="text-[9px] font-mono text-slate-500 mt-1 uppercase">
                {voucher.voucherNo}
              </span>
            </div>

            <div className="col-span-7 space-y-1.5 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Head of Family</span>
                <span className="font-bold text-slate-900">{voucher.familyHead}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">B2B Agent</span>
                <span className="font-semibold text-slate-800">{voucher.agentCompany} ({voucher.agentCity})</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Pilgrims Count</span>
                <span className="font-semibold text-slate-800">{voucher.paxCountText}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Accommodation</span>
                <span className="font-semibold text-slate-800">{voucher.accommodations.length} Hotel Sectors</span>
              </div>
            </div>
          </div>

          {/* Security Fingerprint */}
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-100/70 text-[10px] font-mono text-slate-600 break-all space-y-1">
            <div className="text-[9px] font-bold text-slate-500 uppercase font-sans">
              Cryptographic Security Hash
            </div>
            <div>{voucher.securityHash || 'AH-SEC-2026-X8890124'}</div>
          </div>

          {/* Issuer Seal */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-600" />
              <span>Ameer Hamza Travels & Tours</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer transition text-xs"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
