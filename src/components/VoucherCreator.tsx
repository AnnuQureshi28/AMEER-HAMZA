import React, { useState, useEffect } from 'react';
import {
  Voucher,
  Mutamer,
  HotelSector,
  TransportSector,
  B2BAgent,
  VisaCompany,
  PilgrimGroup,
  GroundContact,
  PaxType,
  HotelRate,
  TransportRate,
  VisaRate,
  RoomTypeOption,
} from '../types';
import { calculateNights, summarizePax, getNextVoucherNumber, calculateAgentHotelRate } from '../utils/voucherUtils';
import { DEFAULT_GROUND_CONTACTS } from '../data/initialData';
import {
  Building2,
  Car,
  Plane,
  Users,
  Plus,
  Trash2,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Briefcase,
  Layers,
  Edit3,
  DollarSign,
  PhoneCall,
  Tag,
} from 'lucide-react';

interface VoucherCreatorProps {
  currentAgent: B2BAgent;
  userRole: 'admin' | 'staff' | 'agent';
  allAgents: B2BAgent[];
  visaCompanies: VisaCompany[];
  groups: PilgrimGroup[];
  existingVouchers: Voucher[];
  hotelRates: HotelRate[];
  transportRates: TransportRate[];
  visaRates?: VisaRate[];
  defaultGroundContacts?: GroundContact[];
  prefilledGroup?: PilgrimGroup | null;
  editingVoucher?: Voucher | null;
  onSave: (voucher: Voucher) => void;
  onCancel: () => void;
  onOpenImporter: () => void;
}

const ROOM_TYPE_OPTIONS: RoomTypeOption[] = ['Double', 'Triple', 'Quad', 'Quint', 'Sharing'];

const normalizeRoomType = (rt?: string): RoomTypeOption => {
  if (!rt) return 'Quad';
  const lower = rt.toLowerCase();
  if (lower.includes('double')) return 'Double';
  if (lower.includes('triple')) return 'Triple';
  if (lower.includes('quad')) return 'Quad';
  if (lower.includes('quint')) return 'Quint';
  if (lower.includes('sharing')) return 'Sharing';
  return 'Quad';
};

const getCrmHotelRoomRate = (
  hotel: HotelRate | undefined,
  roomType: RoomTypeOption,
  agent?: B2BAgent
): number => {
  if (!hotel) return 0;
  const baseRate =
    hotel.roomTypeRates?.[roomType]?.sellingRateB2BSAR ??
    Number(hotel.sellingRateB2BSAR) ??
    0;
  if (baseRate <= 0) return 0;
  return calculateAgentHotelRate(baseRate, hotel.hotelName, agent).finalRate;
};

export const VoucherCreator: React.FC<VoucherCreatorProps> = ({
  currentAgent,
  userRole,
  allAgents,
  visaCompanies,
  groups,
  existingVouchers,
  hotelRates,
  transportRates,
  visaRates = [],
  defaultGroundContacts,
  prefilledGroup,
  editingVoucher,
  onSave,
  onCancel,
  onOpenImporter,
}) => {
  // Sub-Agent (Client) Selection
  const [selectedAgentId, setSelectedAgentId] = useState<string>(
    editingVoucher?.agentId || prefilledGroup?.subAgentId || currentAgent.id
  );
  // Visa Company Selection (e.g. Ziafa International, Bab Al-Umrah)
  const [selectedVisaCompanyId, setSelectedVisaCompanyId] = useState<string>(
    editingVoucher?.visaCompanyId || prefilledGroup?.visaCompanyId || visaCompanies[0]?.id || ''
  );

  const activeAgent = allAgents.find((a) => a.id === selectedAgentId) || currentAgent;
  const activeVisaCompany =
    visaCompanies.find((v) => v.id === selectedVisaCompanyId) || visaCompanies[0];

  // Voucher Numbers & Headers (Starting from 10101 sequence)
  const [voucherNo, setVoucherNo] = useState<string>(
    editingVoucher?.voucherNo || getNextVoucherNumber(existingVouchers || [])
  );
  const [manualNo, setManualNo] = useState<string>(
    editingVoucher?.manualNo || 'M G H ' + Math.floor(10 + Math.random() * 90)
  );
  const [voucherDate, setVoucherDate] = useState<string>(
    editingVoucher?.voucherDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })
  );
  const [packageType, setPackageType] = useState<string>(editingVoucher?.packageType || '20 Standard');
  const [groupNo, setGroupNo] = useState<string>(editingVoucher?.groupNo || prefilledGroup?.groupNo || '1000');
  const [groupName, setGroupName] = useState<string>(
    editingVoucher?.groupName || prefilledGroup?.groupName || 'AMEERHAMZAONLYACC'
  );
  const [familyHead, setFamilyHead] = useState<string>(editingVoucher?.familyHead || '');

  // Visa Per Pax Rate (SAR) - sourced from CRM Visa Rates or 0 for Accommodation-Only
  const [visaRatePerPaxSAR, setVisaRatePerPaxSAR] = useState<number>(() => {
    if (editingVoucher) {
      const paxCount = editingVoucher.mutamers.length || 1;
      return Math.round((editingVoucher.financials?.visaTotal || 0) / paxCount);
    }
    const gName = (prefilledGroup?.groupName || '').toUpperCase();
    if (gName.includes('ONLYACC')) return 0;
    return visaRates[0] ? Math.round(visaRates[0].sellingRateB2BPKR / 74) : 0;
  });

  // Manual Final Rate Override State
  const [isManualOverride, setIsManualOverride] = useState<boolean>(
    editingVoucher?.financials?.isManualRateOverridden || false
  );
  const [customFinalRateSAR, setCustomFinalRateSAR] = useState<number>(
    editingVoucher?.financials?.manualFinalRateSAR || 0
  );
  const [adjustmentReason, setAdjustmentReason] = useState<string>(
    editingVoucher?.financials?.manualAdjustmentReason || ''
  );

  // Mutamers / Pilgrims
  const [mutamers, setMutamers] = useState<Mutamer[]>(
    editingVoucher?.mutamers ||
      prefilledGroup?.mutamers || [
        {
          id: 'm-init-1',
          sno: 1,
          passportNo: 'BA6925931',
          firstName: 'FIAZ',
          familyName: 'HUSSAIN',
          mutamerName: 'FIAZ HUSSAIN',
          gender: 'M',
          paxType: 'Adult',
          bed: 'Yes',
          mofaNo: '4810029311',
          grpNo: '1000',
          visaNo: '99201101',
          pnr: 'PK760',
          birthDate: '01/01/1950',
        },
        {
          id: 'm-init-2',
          sno: 2,
          passportNo: 'BF8526352',
          firstName: 'GHULAM',
          familyName: 'JAFFAR',
          mutamerName: 'GHULAM JAFFAR',
          gender: 'M',
          paxType: 'Adult',
          bed: 'Yes',
          mofaNo: '4810029312',
          grpNo: '1000',
          visaNo: '99201102',
          pnr: 'PK760',
          birthDate: '01/01/1962',
        },
        {
          id: 'm-init-3',
          sno: 3,
          passportNo: 'KG6896784',
          firstName: 'IQBAL',
          familyName: 'HUSSAIN',
          mutamerName: 'IQBAL HUSSAIN',
          gender: 'M',
          paxType: 'Adult',
          bed: 'Yes',
          mofaNo: '4810029313',
          grpNo: '1000',
          visaNo: '99201103',
          pnr: 'PK760',
          birthDate: '12/04/1986',
        },
      ]
  );

  // Accommodations (Strictly sourced from CRM Hotel Rates Master)
  const [accommodations, setAccommodations] = useState<HotelSector[]>(() => {
    if (editingVoucher) {
      return editingVoucher.accommodations.map((a) => ({
        ...a,
        roomType: normalizeRoomType(a.roomType),
        roomCount: Number(a.roomCount) || 1,
        b2bRatePerNight: Number(a.b2bRatePerNight) || 0,
      }));
    }
    if (hotelRates.length > 0) {
      const first = hotelRates[0];
      const rt = normalizeRoomType(first.roomType);
      const rate = getCrmHotelRoomRate(first, rt, activeAgent);
      return [
        {
          id: 'acc-sec-1',
          city: first.city,
          hotelName: first.hotelName,
          view: 'Standard',
          meal: first.mealPlan,
          confNo: 'CONF-' + Math.floor(1000 + Math.random() * 9000),
          roomType: rt,
          checkin: '01-11-26',
          checkout: '06-11-26',
          nights: 5,
          roomCount: 1,
          b2bRatePerNight: rate,
        },
      ];
    }
    return [];
  });

  // Transport Sectors (Strictly sourced from CRM Transport Rates Master)
  const [transportServices, setTransportServices] = useState<TransportSector[]>(() => {
    if (editingVoucher) {
      return editingVoucher.transportServices;
    }
    return [];
  });

  // Flights
  const [depFlight, setDepFlight] = useState(
    editingVoucher?.flights?.departure || {
      flightNo: 'SV-723',
      sector: 'ISB-JED',
      depTime: '01-NOV 10:30',
      arrTime: '01-NOV 14:20',
    }
  );
  const [arrFlight, setArrFlight] = useState(
    editingVoucher?.flights?.arrival || {
      flightNo: 'SV-726',
      sector: 'JED-ISB',
      depTime: '28-NOV 18:10',
      arrTime: '29-NOV 00:50',
    }
  );

  const [specialInstructions, setSpecialInstructions] = useState<string>(
    editingVoucher?.specialInstructions ||
      'Hotel check-in at 16:00. Report to lobby 5 hours prior to airport departure. Keep original passports handy for bus check.'
  );

  const [groundContacts, setGroundContacts] = useState<GroundContact[]>(
    editingVoucher?.groundContacts && editingVoucher.groundContacts.length > 0
      ? editingVoucher.groundContacts
      : defaultGroundContacts && defaultGroundContacts.length > 0
      ? defaultGroundContacts
      : DEFAULT_GROUND_CONTACTS
  );

  // Ground Staff Contacts handlers
  const updateGroundContact = (index: number, field: keyof GroundContact, value: string) => {
    const updated = [...groundContacts];
    updated[index] = { ...updated[index], [field]: value };
    setGroundContacts(updated);
  };

  const addGroundContact = () => {
    setGroundContacts([
      ...groundContacts,
      {
        city: 'Makkah',
        name: '',
        role: 'Hotel Check-in',
        contact: '+966 ',
      },
    ]);
  };

  const removeGroundContact = (index: number) => {
    setGroundContacts(groundContacts.filter((_, i) => i !== index));
  };

  const resetDefaultGroundContacts = () => {
    setGroundContacts(
      defaultGroundContacts && defaultGroundContacts.length > 0
        ? defaultGroundContacts
        : DEFAULT_GROUND_CONTACTS
    );
  };

  // Set family head default
  useEffect(() => {
    if (!familyHead && mutamers.length > 0) {
      setFamilyHead(mutamers[0].mutamerName);
    }
  }, [mutamers, familyHead]);

  // Handle switching to a pre-existing imported group
  const handleSelectExistingGroup = (groupId: string) => {
    const selected = groups.find((g) => g.id === groupId);
    if (!selected) return;

    setSelectedAgentId(selected.subAgentId);
    setSelectedVisaCompanyId(selected.visaCompanyId);
    setGroupNo(selected.groupNo);
    setGroupName(selected.groupName);
    setMutamers(selected.mutamers);
    if (selected.mutamers.length > 0) {
      setFamilyHead(selected.mutamers[0].mutamerName);
    }
  };

  // Mutamers handlers
  const addMutamerRow = () => {
    const sno = mutamers.length + 1;
    setMutamers([
      ...mutamers,
      {
        id: 'm-' + Date.now(),
        sno,
        passportNo: '',
        firstName: '',
        familyName: '',
        mutamerName: '',
        gender: 'M',
        paxType: 'Adult',
        bed: 'Yes',
        mofaNo: '4809' + Math.floor(100000 + Math.random() * 900000),
        grpNo: groupNo || '1000',
        visaNo: '',
        pnr: depFlight.flightNo,
      },
    ]);
  };

  const updateMutamer = (index: number, field: keyof Mutamer, value: any) => {
    const updated = [...mutamers];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'firstName' || field === 'familyName') {
      const fName = field === 'firstName' ? value : updated[index].firstName;
      const lName = field === 'familyName' ? value : updated[index].familyName;
      updated[index].mutamerName = `${fName} ${lName}`.trim();
    }
    setMutamers(updated);
  };

  const removeMutamer = (index: number) => {
    const updated = mutamers.filter((_, i) => i !== index).map((m, idx) => ({ ...m, sno: idx + 1 }));
    setMutamers(updated);
  };

  // Accommodations handlers (Strictly linked to CRM Hotel Rates Master)
  const addAccommodationSector = () => {
    if (hotelRates.length === 0) return;
    const lastSector = accommodations[accommodations.length - 1];
    const preferredCity = lastSector?.city === 'Makkah' ? 'Medinah' : 'Makkah';
    const matchingHotel = hotelRates.find((h) => h.city === preferredCity) || hotelRates[0];
    const rt = normalizeRoomType(matchingHotel.roomType);
    const rate = getCrmHotelRoomRate(matchingHotel, rt, activeAgent);

    setAccommodations([
      ...accommodations,
      {
        id: 'acc-' + Date.now(),
        city: matchingHotel.city,
        hotelName: matchingHotel.hotelName,
        view: 'Standard',
        meal: matchingHotel.mealPlan,
        confNo: 'CONF-' + Math.floor(1000 + Math.random() * 9000),
        roomType: rt,
        checkin: lastSector?.checkout || '01-11-26',
        checkout: '07-11-26',
        nights: 6,
        roomCount: 1,
        b2bRatePerNight: rate,
      },
    ]);
  };

  const handleSelectCrmHotel = (index: number, hotelRateId: string) => {
    const matched = hotelRates.find((h) => h.id === hotelRateId);
    if (!matched) return;
    const updated = [...accommodations];
    const currentRoomType = normalizeRoomType(updated[index].roomType || matched.roomType);
    const rate = getCrmHotelRoomRate(matched, currentRoomType, activeAgent);
    updated[index] = {
      ...updated[index],
      city: matched.city,
      hotelName: matched.hotelName,
      meal: matched.mealPlan,
      roomType: currentRoomType,
      b2bRatePerNight: rate,
    };
    setAccommodations(updated);
  };

  const updateAccommodation = (index: number, field: keyof HotelSector, value: any) => {
    const updated = [...accommodations];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'checkin' || field === 'checkout') {
      const inDate = field === 'checkin' ? value : updated[index].checkin;
      const outDate = field === 'checkout' ? value : updated[index].checkout;
      updated[index].nights = calculateNights(inDate, outDate);
    }

    if (field === 'roomType') {
      const rt = normalizeRoomType(value);
      updated[index].roomType = rt;
      const matched = hotelRates.find(
        (h) =>
          h.hotelName.toLowerCase().trim() === updated[index].hotelName.toLowerCase().trim() &&
          h.city === updated[index].city
      ) || hotelRates.find(
        (h) => h.hotelName.toLowerCase().trim() === updated[index].hotelName.toLowerCase().trim()
      );
      if (matched) {
        updated[index].b2bRatePerNight = getCrmHotelRoomRate(matched, rt, activeAgent);
      }
    }

    setAccommodations(updated);
  };

  const removeAccommodation = (index: number) => {
    setAccommodations(accommodations.filter((_, i) => i !== index));
  };

  // Apply Agent Discounts to All Accommodation Sectors (sourced from CRM Hotel Rates Master)
  const applyAgentDiscountsToAllSectors = () => {
    const updated = accommodations.map((acc) => {
      const rt = normalizeRoomType(acc.roomType);
      const matched = hotelRates.find(
        (h) =>
          h.hotelName.toLowerCase().trim() === acc.hotelName.toLowerCase().trim() &&
          h.city === acc.city
      ) || hotelRates.find(
        (h) => h.hotelName.toLowerCase().trim() === acc.hotelName.toLowerCase().trim()
      );
      if (matched) {
        return {
          ...acc,
          roomType: rt,
          b2bRatePerNight: getCrmHotelRoomRate(matched, rt, activeAgent),
        };
      }
      const baseRate = Number(acc.b2bRatePerNight) || 0;
      const finalRate =
        baseRate > 0 ? calculateAgentHotelRate(baseRate, acc.hotelName, activeAgent).finalRate : 0;
      return {
        ...acc,
        roomType: rt,
        b2bRatePerNight: finalRate,
      };
    });
    setAccommodations(updated);
  };

  // Transport handlers (Strictly sourced from CRM Transport Rates Master)
  const addTransportSector = () => {
    if (transportRates.length === 0) return;
    const first = transportRates[0];
    setTransportServices([
      ...transportServices,
      {
        id: 'tr-' + Date.now(),
        travelDate: '01-11-26',
        transporter: 'Company Transport',
        vehicleType: first.vehicleType,
        routeDescription: first.route,
        b2bPrice: first.sellingRateB2BSAR,
      },
    ]);
  };

  const handleSelectCrmTransport = (index: number, transportRateId: string) => {
    const matched = transportRates.find((t) => t.id === transportRateId);
    if (!matched) return;
    const updated = [...transportServices];
    updated[index] = {
      ...updated[index],
      vehicleType: matched.vehicleType,
      routeDescription: matched.route,
      b2bPrice: matched.sellingRateB2BSAR,
    };
    setTransportServices(updated);
  };

  const updateTransport = (index: number, field: keyof TransportSector, value: any) => {
    const updated = [...transportServices];
    updated[index] = { ...updated[index], [field]: value };
    setTransportServices(updated);
  };

  const removeTransport = (index: number) => {
    setTransportServices(transportServices.filter((_, i) => i !== index));
  };

  // Calculations (Exact: Nights * B2B Rate * Room/Bed Qty, without hardcoded fallbacks)
  const paxStats = summarizePax(mutamers);
  const totalNights = accommodations.reduce((s, a) => s + (Number(a.nights) || 0), 0);
  const estimatedHotelTotal = accommodations.reduce(
    (s, a) =>
      s +
      (Number(a.nights) || 0) *
        (Number(a.b2bRatePerNight) || 0) *
        (Number(a.roomCount) || 1),
    0
  );
  const estimatedTransportTotal = transportServices.reduce(
    (s, t) => s + (Number(t.b2bPrice) || 0),
    0
  );
  const estimatedVisaTotal = mutamers.length * (Number(visaRatePerPaxSAR) || 0);
  const baseCalculatedTotal = estimatedHotelTotal + estimatedTransportTotal + estimatedVisaTotal;
  const grandTotalSAR =
    isManualOverride && customFinalRateSAR > 0 ? customFinalRateSAR : baseCalculatedTotal;
  const effectiveGrandTotal = grandTotalSAR;

  // Handle saving (Create or Edit)
  const handleSave = (statusToSave: 'draft' | 'pending' | 'approved') => {
    if (!familyHead.trim() && mutamers.length > 0) {
      setFamilyHead(mutamers[0].mutamerName || 'Group Head');
    }

    const normalizedAccommodations: HotelSector[] = accommodations.map((a) => {
      const nights = Number(a.nights) || 0;
      const roomCount = Number(a.roomCount) || 1;
      const rate = Number(a.b2bRatePerNight) || 0;
      return {
        ...a,
        roomType: normalizeRoomType(a.roomType),
        roomCount,
        b2bRatePerNight: rate,
        totalCost: nights * rate * roomCount,
      };
    });

    const newVoucher: Voucher = {
      id: editingVoucher?.id || 'v-' + Date.now(),
      voucherNo: voucherNo.trim() || 'HV-10101',
      manualNo: manualNo.trim() || 'M G H ' + Math.floor(10 + Math.random() * 90),
      status: statusToSave,
      voucherDate,
      packageType,
      familyHead: familyHead.trim() || (mutamers[0] ? mutamers[0].mutamerName : 'Mutamer Head'),
      groupNo,
      groupName,
      agentId: activeAgent.id,
      agentName: activeAgent.name,
      agentCompany: activeAgent.companyName,
      agentCity: activeAgent.city,
      agentWhatsapp: activeAgent.whatsapp,
      visaCompanyId: activeVisaCompany.id,
      visaCompanyName: activeVisaCompany.companyName,
      visaCompanyCity: activeVisaCompany.branchCity,
      visaCompanyWhatsapp: activeVisaCompany.whatsapp,
      mutamers,
      paxCountText: paxStats.paxText,
      accommodations: normalizedAccommodations,
      transportServices,
      flights: {
        departure: depFlight,
        arrival: arrFlight,
      },
      specialInstructions,
      groundContacts,
      financials: {
        hotelTotal: estimatedHotelTotal,
        transportTotal: estimatedTransportTotal,
        visaTotal: estimatedVisaTotal,
        subTotal: baseCalculatedTotal,
        isManualRateOverridden: isManualOverride,
        manualFinalRateSAR: effectiveGrandTotal,
        manualAdjustmentReason: adjustmentReason,
        grandTotal: effectiveGrandTotal,
        ledgerPosted:
          statusToSave === 'approved' || Boolean(editingVoucher?.financials?.ledgerPosted),
      },
      approvedBy:
        statusToSave === 'approved'
          ? editingVoucher?.approvedBy || 'Ameer Hamza Travels Central Ops (Direct Auth)'
          : undefined,
      approvedDate:
        statusToSave === 'approved'
          ? editingVoucher?.approvedDate || new Date().toLocaleDateString()
          : undefined,
      securityHash:
        editingVoucher?.securityHash ||
        'ah-' + Math.random().toString(36).substring(2, 12).toUpperCase(),
      createdAt: editingVoucher?.createdAt || new Date().toISOString(),
    };

    onSave(newVoucher);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Title Bar */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white tracking-tight">
              {editingVoucher ? `Edit Voucher (${editingVoucher.voucherNo})` : 'Create B2B Hotel Voucher'}
            </h1>
            <span className="text-xs bg-amber-500 text-slate-950 font-black px-2.5 py-0.5 rounded-full uppercase">
              CRM Rates Master Linked
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Group #{groupNo} ({groupName}) • Client: <span className="text-amber-400 font-semibold">{activeAgent.companyName}</span> • Visa Co: <span className="text-blue-300 font-semibold">{activeVisaCompany.companyName}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>

          {userRole === 'agent' ? (
            <>
              <button
                onClick={() => handleSave('draft')}
                className="px-4 py-2.5 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-sm transition cursor-pointer"
              >
                {editingVoucher ? 'Save Draft Changes' : 'Save as Draft Voucher'}
              </button>
              <button
                onClick={() => handleSave('pending')}
                className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-sm transition cursor-pointer flex items-center gap-2"
              >
                Submit to Ameer Hamza for Approval
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleSave('draft')}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition cursor-pointer"
              >
                Save as Draft
              </button>
              <button
                onClick={() => handleSave('approved')}
                className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm transition cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {editingVoucher ? 'Save & Update Voucher' : 'Issue & Approve Voucher'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* QUICK LOAD FROM EXISTING IMPORTED GROUPS */}
      <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <div className="text-xs font-bold text-amber-950">
              Select an Imported Group or Import New Excel File:
            </div>
            <div className="text-[11px] text-amber-800">
              Pre-fills all mutamers, beds, sub-agent client, and visa company automatically.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            onChange={(e) => handleSelectExistingGroup(e.target.value)}
            className="border border-amber-300 rounded-xl px-3 py-1.5 text-xs bg-white font-semibold text-slate-800 cursor-pointer shadow-xs"
          >
            <option value="">-- Choose Existing Group ({groups.length} Available) --</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                Grp #{g.groupNo} - {g.groupName} ({g.subAgentCompany} / {g.visaCompanyName})
              </option>
            ))}
          </select>

          <button
            onClick={onOpenImporter}
            className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            + Import New Excel File
          </button>
        </div>
      </div>

      {/* SECTION 1: HEADER & ENTITY ASSIGNMENTS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
          1. Agency, Sub-Agent Client & Visa Company Parameters
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {/* Sub-Agent (Client) */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Sub-Agent Client (Travel Agency)
            </label>
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 font-semibold focus:bg-white"
            >
              {allAgents.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.companyName} ({ag.city})
                </option>
              ))}
            </select>
          </div>

          {/* Visa Company (Right side of voucher) */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Visa Company (Right Header)
            </label>
            <select
              value={selectedVisaCompanyId}
              onChange={(e) => setSelectedVisaCompanyId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 font-bold text-blue-900 focus:bg-white"
            >
              {visaCompanies.map((vc) => (
                <option key={vc.id} value={vc.id}>
                  {vc.companyName} ({vc.branchCity})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Group Number (From Excel)</label>
            <input
              type="text"
              value={groupNo}
              onChange={(e) => setGroupNo(e.target.value)}
              placeholder="e.g. 1000"
              className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900 bg-slate-50 focus:bg-white"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Group Name (From Excel)</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. AMEERHAMZAONLYACC"
              className="w-full border border-slate-300 rounded-lg p-2 font-bold text-slate-900 bg-slate-50 focus:bg-white"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Voucher Number</label>
            <input
              type="text"
              value={voucherNo}
              onChange={(e) => setVoucherNo(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900 bg-slate-50 focus:bg-white"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Manual Reference No</label>
            <input
              type="text"
              value={manualNo}
              onChange={(e) => setManualNo(e.target.value)}
              placeholder="e.g. M G H 20"
              className="w-full border border-slate-300 rounded-lg p-2 font-bold text-slate-900 bg-slate-50 focus:bg-white"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Voucher Date</label>
            <input
              type="text"
              value={voucherDate}
              onChange={(e) => setVoucherDate(e.target.value)}
              placeholder="DD/MM/YY"
              className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 focus:bg-white"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Package Name / Type</label>
            <input
              type="text"
              value={packageType}
              onChange={(e) => setPackageType(e.target.value)}
              placeholder="e.g. 20 Standard"
              className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 focus:bg-white"
            />
          </div>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1 text-xs">Family Head Name</label>
          <input
            type="text"
            value={familyHead}
            onChange={(e) => setFamilyHead(e.target.value)}
            placeholder="e.g. Fiaz Hussain or Zahra Fatima Abid Latif"
            className="w-full border border-slate-300 rounded-lg p-2 font-semibold text-slate-900 text-xs bg-slate-50 focus:bg-white"
          />
        </div>
      </div>

      {/* SECTION 2: MUTAMERS / PILGRIMS TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-600" />
              2. Mutamers / Pilgrims in this Group ({mutamers.length})
            </h2>
            <div className="text-xs text-slate-500 mt-0.5">
              PAX Breakdown: <span className="font-semibold text-slate-800">{paxStats.paxText}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenImporter}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 border border-amber-300 text-xs font-bold transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-600" />
              Import Excel / CSV
            </button>
            <button
              onClick={addMutamerRow}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Pilgrim
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="p-2 w-8 text-center">#</th>
                <th className="p-2 w-28">Passport No</th>
                <th className="p-2">First Name</th>
                <th className="p-2">Family / Last Name</th>
                <th className="p-2 w-14 text-center">Gender</th>
                <th className="p-2 w-20">Pax Type</th>
                <th className="p-2 w-14 text-center">Bed</th>
                <th className="p-2 w-28">MOFA #</th>
                <th className="p-2 w-24">Visa #</th>
                <th className="p-2 w-20">PNR</th>
                <th className="p-2 w-8 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mutamers.map((m, idx) => (
                <tr key={m.id || idx} className="hover:bg-slate-50/60">
                  <td className="p-2 text-center text-slate-500 font-semibold">{idx + 1}</td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={m.passportNo}
                      onChange={(e) => updateMutamer(idx, 'passportNo', e.target.value)}
                      placeholder="Passport #"
                      className="w-full border border-slate-200 rounded px-2 py-1 font-mono uppercase text-xs"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={m.firstName}
                      onChange={(e) => updateMutamer(idx, 'firstName', e.target.value)}
                      placeholder="First Name"
                      className="w-full border border-slate-200 rounded px-2 py-1 text-xs"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={m.familyName}
                      onChange={(e) => updateMutamer(idx, 'familyName', e.target.value)}
                      placeholder="Family Name"
                      className="w-full border border-slate-200 rounded px-2 py-1 text-xs"
                    />
                  </td>
                  <td className="p-1 text-center">
                    <select
                      value={m.gender}
                      onChange={(e) => updateMutamer(idx, 'gender', e.target.value)}
                      className="border border-slate-200 rounded px-1 py-1 text-xs"
                    >
                      <option value="M">M</option>
                      <option value="F">F</option>
                    </select>
                  </td>
                  <td className="p-1">
                    <select
                      value={m.paxType}
                      onChange={(e) => updateMutamer(idx, 'paxType', e.target.value as PaxType)}
                      className="w-full border border-slate-200 rounded px-1 py-1 text-xs"
                    >
                      <option value="Adult">Adult</option>
                      <option value="Child">Child</option>
                      <option value="Infant">Infant</option>
                    </select>
                  </td>
                  <td className="p-1 text-center">
                    <select
                      value={m.bed}
                      onChange={(e) => updateMutamer(idx, 'bed', e.target.value)}
                      className="border border-slate-200 rounded px-1 py-1 text-xs"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={m.mofaNo}
                      onChange={(e) => updateMutamer(idx, 'mofaNo', e.target.value)}
                      placeholder="MOFA"
                      className="w-full border border-slate-200 rounded px-1.5 py-1 font-mono text-xs"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={m.visaNo}
                      onChange={(e) => updateMutamer(idx, 'visaNo', e.target.value)}
                      placeholder="Visa #"
                      className="w-full border border-slate-200 rounded px-1.5 py-1 font-mono text-xs"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={m.pnr}
                      onChange={(e) => updateMutamer(idx, 'pnr', e.target.value)}
                      placeholder="PNR"
                      className="w-full border border-slate-200 rounded px-1.5 py-1 font-mono text-xs"
                    />
                  </td>
                  <td className="p-1 text-center">
                    {mutamers.length > 1 && (
                      <button
                        onClick={() => removeMutamer(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition cursor-pointer"
                        title="Remove passenger"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: ACCOMMODATION (CRM RATES MASTER ONLY) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-600" />
              3. Accommodation Sectors ({accommodations.length} Sectors Active)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hotels & Room Type rates are pulled strictly from CRM Rates Master. Total Nights:{' '}
              <span className="font-bold text-slate-900">{totalNights} Nights</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addAccommodationSector}
              disabled={hotelRates.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-semibold transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Hotel Sector
            </button>
          </div>
        </div>

        {hotelRates.length === 0 && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">No Hotels Added in CRM Rates Master</div>
              <div className="text-amber-800 mt-0.5">
                Voucher creation strictly pulls hotel & room type rates from CRM Rates Master. Please add hotels in <span className="font-bold">CRM Rates Master &gt; Hotels</span> first.
              </div>
            </div>
          </div>
        )}

        {/* Sub-Agent Contract Discount Alert & Quick Action */}
        {(activeAgent.defaultHotelDiscountSAR || activeAgent.defaultHotelDiscountPercent || (activeAgent.customHotelDiscounts && activeAgent.customHotelDiscounts.length > 0)) && accommodations.length > 0 && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs flex flex-wrap items-center justify-between gap-3 text-emerald-950">
            <div className="flex items-center gap-2.5">
              <Tag className="w-4 h-4 text-emerald-700 shrink-0" />
              <div>
                <span className="font-bold text-slate-900 block sm:inline">
                  Special Hotel Discount Configured for {activeAgent.companyName}:
                </span>{' '}
                <span className="text-emerald-800 font-semibold">
                  {activeAgent.defaultHotelDiscountSAR ? `Flat -${activeAgent.defaultHotelDiscountSAR} SAR / room / night` : ''}
                  {activeAgent.defaultHotelDiscountPercent ? ` ${activeAgent.defaultHotelDiscountPercent}% off B2B rates` : ''}
                  {activeAgent.customHotelDiscounts && activeAgent.customHotelDiscounts.length > 0
                    ? ` (+${activeAgent.customHotelDiscounts.length} hotel-specific contract rules)`
                    : ''}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={applyAgentDiscountsToAllSectors}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Refresh CRM + Agent Rates
            </button>
          </div>
        )}

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="p-2 w-8 text-center">Sec</th>
                <th className="p-2 w-20">City</th>
                <th className="p-2 min-w-[200px]">CRM Hotel Name</th>
                <th className="p-2 w-20">View</th>
                <th className="p-2 w-14">Meal</th>
                <th className="p-2 w-24">Conf #</th>
                <th className="p-2 w-28">Room Type</th>
                <th className="p-2 w-14 text-center">Qty</th>
                <th className="p-2 w-24">Checkin</th>
                <th className="p-2 w-24">Checkout</th>
                <th className="p-2 w-12 text-center">Nts</th>
                <th className="p-2 w-20 text-right">Rate/Nt</th>
                <th className="p-2 w-24 text-right">Total SAR</th>
                <th className="p-2 w-8 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accommodations.length === 0 ? (
                <tr>
                  <td colSpan={14} className="p-6 text-center text-slate-500 text-xs">
                    No hotel sectors added yet. {hotelRates.length > 0 ? 'Click "+ Add Hotel Sector" to choose from CRM Rates Master.' : 'Add hotels in CRM Rates Master first.'}
                  </td>
                </tr>
              ) : (
                accommodations.map((acc, idx) => {
                  const matchedRateObj =
                    hotelRates.find(
                      (h) =>
                        h.hotelName.toLowerCase().trim() === acc.hotelName.toLowerCase().trim() &&
                        h.city === acc.city
                    ) ||
                    hotelRates.find(
                      (h) => h.hotelName.toLowerCase().trim() === acc.hotelName.toLowerCase().trim()
                    );
                  const currentSelectValue = matchedRateObj ? matchedRateObj.id : acc.hotelName ? '__legacy__' : '';
                  const roomQty = Number(acc.roomCount) || 1;
                  const rowTotalSAR =
                    (Number(acc.nights) || 0) * (Number(acc.b2bRatePerNight) || 0) * roomQty;

                  return (
                    <tr key={acc.id || idx} className="hover:bg-slate-50/60">
                      <td className="p-2 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={acc.city}
                          readOnly
                          className="w-full border border-slate-200 rounded px-1.5 py-1 text-xs font-semibold bg-slate-50 text-slate-700"
                        />
                      </td>
                      <td className="p-1">
                        <select
                          value={currentSelectValue}
                          onChange={(e) => handleSelectCrmHotel(idx, e.target.value)}
                          className="w-full border border-slate-200 rounded px-2 py-1 text-xs font-medium bg-white"
                        >
                          <option value="">-- Select CRM Hotel --</option>
                          {!matchedRateObj && acc.hotelName && (
                            <option value="__legacy__">
                              {acc.hotelName} (Saved on Voucher)
                            </option>
                          )}
                          {hotelRates.map((hr) => (
                            <option key={hr.id} value={hr.id}>
                              [{hr.city}] {hr.hotelName} ({hr.mealPlan})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={acc.view}
                          onChange={(e) => updateAccommodation(idx, 'view', e.target.value)}
                          placeholder="View"
                          className="w-full border border-slate-200 rounded px-1.5 py-1 text-xs"
                        />
                      </td>
                      <td className="p-1">
                        <select
                          value={acc.meal}
                          onChange={(e) => updateAccommodation(idx, 'meal', e.target.value)}
                          className="w-full border border-slate-200 rounded px-1 py-1 text-xs font-bold"
                        >
                          <option value="RO">RO</option>
                          <option value="BB">BB</option>
                          <option value="HB">HB</option>
                          <option value="FB">FB</option>
                        </select>
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={acc.confNo}
                          onChange={(e) => updateAccommodation(idx, 'confNo', e.target.value)}
                          placeholder="Conf #"
                          className="w-full border border-slate-200 rounded px-1.5 py-1 font-mono text-xs"
                        />
                      </td>
                      <td className="p-1">
                        <select
                          value={normalizeRoomType(acc.roomType)}
                          onChange={(e) => updateAccommodation(idx, 'roomType', e.target.value)}
                          className="w-full border border-slate-200 rounded px-1.5 py-1 text-xs font-semibold text-amber-900 bg-amber-50/40"
                        >
                          {ROOM_TYPE_OPTIONS.map((rt) => (
                            <option key={rt} value={rt}>
                              {rt}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-1">
                        <input
                          type="number"
                          min={1}
                          value={roomQty}
                          onChange={(e) =>
                            updateAccommodation(idx, 'roomCount', Math.max(1, Number(e.target.value) || 1))
                          }
                          className="w-full border border-slate-200 rounded px-1 py-1 text-xs text-center font-bold"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={acc.checkin}
                          onChange={(e) => updateAccommodation(idx, 'checkin', e.target.value)}
                          placeholder="DD-MM-YY"
                          className="w-full border border-slate-200 rounded px-1.5 py-1 font-mono text-xs text-center"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={acc.checkout}
                          onChange={(e) => updateAccommodation(idx, 'checkout', e.target.value)}
                          placeholder="DD-MM-YY"
                          className="w-full border border-slate-200 rounded px-1.5 py-1 font-mono text-xs text-center"
                        />
                      </td>
                      <td className="p-1 text-center font-bold text-slate-900">{acc.nights}</td>
                      <td className="p-1">
                        <input
                          type="number"
                          min={0}
                          value={acc.b2bRatePerNight ?? 0}
                          onChange={(e) =>
                            updateAccommodation(idx, 'b2bRatePerNight', Number(e.target.value) || 0)
                          }
                          placeholder="SAR"
                          className="w-full border border-slate-200 rounded px-1 py-1 text-xs text-right font-mono font-bold"
                        />
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {rowTotalSAR.toLocaleString()}
                      </td>
                      <td className="p-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeAccommodation(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded transition cursor-pointer"
                          title="Delete sector"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 4: TRANSPORT & SERVICES SECTORS (CRM RATES MASTER ONLY) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Car className="w-4 h-4 text-amber-600" />
              4. Transport Sectors & Sightseeing (CRM Rates Master)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select transport routes and vehicle types strictly from CRM Rates Master.
            </p>
          </div>

          <button
            type="button"
            onClick={addTransportSector}
            disabled={transportRates.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-semibold transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Transport Sector
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="p-2 w-8 text-center">#</th>
                <th className="p-2 w-28">Travel Date</th>
                <th className="p-2 w-40">Transporter</th>
                <th className="p-2 min-w-[260px]">CRM Route & Vehicle Sector</th>
                <th className="p-2 w-28 text-right">B2B Rate (SAR)</th>
                <th className="p-2 w-8 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transportServices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500 text-xs">
                    No transport sectors added. {transportRates.length > 0 ? 'Click "+ Add Transport Sector" to pick a route from CRM Rates Master.' : 'Add transport routes in CRM Rates Master first.'}
                  </td>
                </tr>
              ) : (
                transportServices.map((tr, idx) => {
                  const matchedTr = transportRates.find(
                    (rate) =>
                      rate.route.toLowerCase().trim() === tr.routeDescription.toLowerCase().trim() &&
                      rate.vehicleType.toLowerCase().trim() === tr.vehicleType.toLowerCase().trim()
                  ) || transportRates.find(
                    (rate) => rate.route.toLowerCase().trim() === tr.routeDescription.toLowerCase().trim()
                  );
                  const currentSelectValue = matchedTr ? matchedTr.id : tr.routeDescription ? '__legacy__' : '';

                  return (
                    <tr key={tr.id || idx} className="hover:bg-slate-50/60">
                      <td className="p-2 text-center text-slate-500 font-semibold">{idx + 1}</td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={tr.travelDate}
                          onChange={(e) => updateTransport(idx, 'travelDate', e.target.value)}
                          placeholder="DD-MM-YY"
                          className="w-full border border-slate-200 rounded px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={tr.transporter}
                          onChange={(e) => updateTransport(idx, 'transporter', e.target.value)}
                          placeholder="Transporter"
                          className="w-full border border-slate-200 rounded px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="p-1">
                        <select
                          value={currentSelectValue}
                          onChange={(e) => handleSelectCrmTransport(idx, e.target.value)}
                          className="w-full border border-slate-200 rounded px-2 py-1 text-xs font-medium bg-white"
                        >
                          <option value="">-- Select CRM Transport Route --</option>
                          {!matchedTr && tr.routeDescription && (
                            <option value="__legacy__">
                              {tr.routeDescription} — {tr.vehicleType} (Saved on Voucher)
                            </option>
                          )}
                          {transportRates.map((rate) => (
                            <option key={rate.id} value={rate.id}>
                              {rate.route} — {rate.vehicleType} (SAR {rate.sellingRateB2BSAR})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-1">
                        <input
                          type="number"
                          min={0}
                          value={tr.b2bPrice ?? 0}
                          onChange={(e) => updateTransport(idx, 'b2bPrice', Number(e.target.value) || 0)}
                          placeholder="SAR"
                          className="w-full border border-slate-200 rounded px-1.5 py-1 text-xs text-right font-mono font-bold"
                        />
                      </td>
                      <td className="p-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeTransport(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded transition cursor-pointer"
                          title="Remove transport"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 5: FLIGHT DETAILS & ON-GROUND LOGISTICS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
          <Plane className="w-4 h-4 text-amber-600" />
          5. Flight Itinerary & Special Instructions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Departure Flight (Pakistan to KSA)
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Flight Number</label>
                <input
                  type="text"
                  value={depFlight.flightNo}
                  onChange={(e) => setDepFlight({ ...depFlight, flightNo: e.target.value })}
                  placeholder="e.g. SV-723"
                  className="w-full border border-slate-300 rounded p-1.5 font-bold bg-white"
                />
              </div>
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Sector</label>
                <input
                  type="text"
                  value={depFlight.sector}
                  onChange={(e) => setDepFlight({ ...depFlight, sector: e.target.value })}
                  placeholder="e.g. ISB-JED"
                  className="w-full border border-slate-300 rounded p-1.5 bg-white"
                />
              </div>
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Departure Time</label>
                <input
                  type="text"
                  value={depFlight.depTime}
                  onChange={(e) => setDepFlight({ ...depFlight, depTime: e.target.value })}
                  placeholder="01-NOV 10:30"
                  className="w-full border border-slate-300 rounded p-1.5 bg-white"
                />
              </div>
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Arrival Time</label>
                <input
                  type="text"
                  value={depFlight.arrTime}
                  onChange={(e) => setDepFlight({ ...depFlight, arrTime: e.target.value })}
                  placeholder="01-NOV 14:20"
                  className="w-full border border-slate-300 rounded p-1.5 bg-white"
                />
              </div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Arrival Flight (KSA to Pakistan)
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Flight Number</label>
                <input
                  type="text"
                  value={arrFlight.flightNo}
                  onChange={(e) => setArrFlight({ ...arrFlight, flightNo: e.target.value })}
                  placeholder="e.g. SV-726"
                  className="w-full border border-slate-300 rounded p-1.5 font-bold bg-white"
                />
              </div>
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Sector</label>
                <input
                  type="text"
                  value={arrFlight.sector}
                  onChange={(e) => setArrFlight({ ...arrFlight, sector: e.target.value })}
                  placeholder="e.g. JED-ISB"
                  className="w-full border border-slate-300 rounded p-1.5 bg-white"
                />
              </div>
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Departure Time</label>
                <input
                  type="text"
                  value={arrFlight.depTime}
                  onChange={(e) => setArrFlight({ ...arrFlight, depTime: e.target.value })}
                  placeholder="28-NOV 18:10"
                  className="w-full border border-slate-300 rounded p-1.5 bg-white"
                />
              </div>
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Arrival Time</label>
                <input
                  type="text"
                  value={arrFlight.arrTime}
                  onChange={(e) => setArrFlight({ ...arrFlight, arrTime: e.target.value })}
                  placeholder="29-NOV 00:50"
                  className="w-full border border-slate-300 rounded p-1.5 bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Special Instructions for Mutamers
          </label>
          <textarea
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            rows={2}
            className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* SECTION 5B: GROUND STAFF & ON-GROUND EMERGENCY CONTACTS (STAFF NAME & NUMBER EDITING) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">
                Section 5B: On-Ground Staff & Emergency Contacts (Voucher Contact Info)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Voucher ke niche print hone wale Makkah & Madinah ke staff ke naam aur Saudi numbers yahan se customize karein
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetDefaultGroundContacts}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
            >
              Reset to Default Team
            </button>
            <button
              type="button"
              onClick={addGroundContact}
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 px-3.5 py-1.5 rounded-xl transition cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Add Staff Contact
            </button>
          </div>
        </div>

        {/* Staff Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3 text-left w-36">City</th>
                <th className="py-2.5 px-3 text-left">Staff Name</th>
                <th className="py-2.5 px-3 text-left w-48">Duty / Responsibility</th>
                <th className="py-2.5 px-3 text-left w-52">Mobile / WhatsApp Number</th>
                <th className="py-2.5 px-2 text-center w-12">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groundContacts.map((contact, index) => (
                <tr key={index} className="hover:bg-slate-50/80 transition">
                  <td className="p-2">
                    <select
                      value={contact.city}
                      onChange={(e) => updateGroundContact(index, 'city', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="Makkah">Makkah</option>
                      <option value="Medinah">Medinah</option>
                      <option value="Jeddah">Jeddah</option>
                      <option value="Airport Desk">Airport Desk</option>
                      <option value="Central Ops">Central Ops</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={contact.name}
                      onChange={(e) => updateGroundContact(index, 'name', e.target.value)}
                      placeholder="e.g. Saddam, Rana Rashid, Ismail..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={contact.role}
                      onChange={(e) => updateGroundContact(index, 'role', e.target.value)}
                      placeholder="e.g. Hotel Check-in, Transport..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-700 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={contact.contact}
                      onChange={(e) => updateGroundContact(index, 'contact', e.target.value)}
                      placeholder="+966 59 818 3039"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold text-emerald-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeGroundContact(index)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                      title="Remove contact"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-slate-500 italic">
          Tip: You can add as many ground staff contacts as needed (e.g. Jeddah airport reception, Ziyarat guide, Makkah hotel coordinator).
        </p>
      </div>

      {/* SECTION 6: FINANCIAL SUMMARY & MANUAL RATE ADJUSTMENT */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 space-y-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white text-base">
                Final B2B Rate & Package Pricing ({activeAgent.companyName})
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Customize or manually adjust the total package rate charged to this sub-agent for this voucher
            </p>
          </div>

          {/* Toggle between Auto-Calculate and Manual Override */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => {
                setIsManualOverride(false);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                !isManualOverride
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              System Auto-Rate (SAR {baseCalculatedTotal.toLocaleString()})
            </button>
            <button
              type="button"
              onClick={() => {
                setIsManualOverride(true);
                if (customFinalRateSAR === 0) {
                  setCustomFinalRateSAR(baseCalculatedTotal);
                }
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                isManualOverride
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              Manual Rate Adjust
            </button>
          </div>
        </div>

        {/* Breakdown Line */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs">
          <div className="space-y-0.5">
            <span className="text-slate-400">Accommodations Total</span>
            <div className="font-bold text-slate-200 text-sm">SAR {estimatedHotelTotal.toLocaleString()}</div>
            <div className="text-[10px] text-slate-400">{accommodations.length} Sectors ({totalNights} Nights)</div>
          </div>
          <div className="space-y-0.5">
            <span className="text-slate-400">Transport & Rail Total</span>
            <div className="font-bold text-slate-200 text-sm">SAR {estimatedTransportTotal.toLocaleString()}</div>
            <div className="text-[10px] text-slate-400">{transportServices.length} Routes scheduled</div>
          </div>
          <div className="space-y-1">
            <span className="text-slate-400 block">Visa / MOFA Rate (SAR/Pax)</span>
            <div className="font-bold text-slate-200 text-sm">SAR {estimatedVisaTotal.toLocaleString()}</div>
            <div className="flex items-center gap-1.5 mt-1">
              <select
                value={
                  visaRatePerPaxSAR === 0
                    ? '0'
                    : visaRates.some((vr) => Math.round(vr.sellingRateB2BPKR / 74) === visaRatePerPaxSAR)
                    ? String(visaRatePerPaxSAR)
                    : 'custom'
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val !== 'custom') {
                    setVisaRatePerPaxSAR(Number(val) || 0);
                  }
                }}
                className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] text-slate-200 max-w-[130px]"
              >
                <option value="0">0 SAR (No Visa / Acc Only)</option>
                {visaRates.map((vr) => {
                  const sar = Math.round(vr.sellingRateB2BPKR / 74);
                  return (
                    <option key={vr.id} value={String(sar)}>
                      {vr.visaType} ({sar} SAR)
                    </option>
                  );
                })}
                <option value="custom">Custom SAR</option>
              </select>
              <input
                type="number"
                min={0}
                value={visaRatePerPaxSAR}
                onChange={(e) => setVisaRatePerPaxSAR(Number(e.target.value) || 0)}
                className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] font-mono text-amber-300 text-right"
                title="SAR per Mutamer"
              />
            </div>
          </div>
          <div className="space-y-0.5 border-l border-slate-800 pl-3">
            <span className="text-amber-400 font-bold">Standard Base Total</span>
            <div className="font-black text-amber-400 text-base">SAR {baseCalculatedTotal.toLocaleString()}</div>
            <div className="text-[10px] text-slate-400">~ PKR {(baseCalculatedTotal * 74).toLocaleString()}</div>
          </div>
        </div>

        {/* If Manual Rate Override is Active */}
        {isManualOverride && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-3 animate-in fade-in duration-150">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Manual Final B2B Selling Rate Override (B2B Negotiated Price)
              </span>
              <span className="text-[11px] text-amber-200/80">
                This exact amount will be printed on voucher financials & debited to agent ledger upon approval
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">
                  Adjusted Package Amount (SAR) <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-amber-400">SAR</span>
                  <input
                    type="number"
                    value={customFinalRateSAR || ''}
                    onChange={(e) => setCustomFinalRateSAR(Number(e.target.value) || 0)}
                    placeholder={baseCalculatedTotal.toString()}
                    className="w-full bg-slate-900 border border-amber-500/40 rounded-lg pl-12 pr-4 py-2 text-white font-mono font-bold text-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setCustomFinalRateSAR(baseCalculatedTotal)}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded transition cursor-pointer"
                  >
                    Reset to Base (SAR {baseCalculatedTotal})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomFinalRateSAR(Math.round(baseCalculatedTotal * 0.95))}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-amber-300 px-2 py-1 rounded transition cursor-pointer"
                  >
                    -5% Deal (SAR {Math.round(baseCalculatedTotal * 0.95)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomFinalRateSAR(Math.round(baseCalculatedTotal * 0.90))}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-amber-300 px-2 py-1 rounded transition cursor-pointer"
                  >
                    -10% Discount (SAR {Math.round(baseCalculatedTotal * 0.90)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomFinalRateSAR(Math.ceil(baseCalculatedTotal / 500) * 500)}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded transition cursor-pointer"
                  >
                    Round to 500
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">
                  Manual Adjustment Reason / Note for Ledger
                </label>
                <input
                  type="text"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="e.g. Special B2B group deal / Early bird discount agreed by management"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-xs text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
                <div className="mt-2 text-xs">
                  {customFinalRateSAR > 0 && customFinalRateSAR !== baseCalculatedTotal && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Adjustment delta:</span>
                      {customFinalRateSAR < baseCalculatedTotal ? (
                        <span className="font-bold text-emerald-400">
                          - SAR {(baseCalculatedTotal - customFinalRateSAR).toLocaleString()} Discount
                        </span>
                      ) : (
                        <span className="font-bold text-amber-400">
                          + SAR {(customFinalRateSAR - baseCalculatedTotal).toLocaleString()} Margin
                        </span>
                      )}
                      <span className="text-slate-400">| PKR {((customFinalRateSAR - baseCalculatedTotal) * 74).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Grand Total Bar and Actions */}
        <div className="flex flex-wrap items-center justify-between gap-6 pt-2">
          <div>
            <span className="text-xs text-amber-400 font-bold uppercase tracking-wider block">
              Final Selling Total B2B ({isManualOverride ? 'Manual Rate' : 'Standard Rate'})
            </span>
            <div className="text-3xl font-black text-white mt-1">
              SAR {grandTotalSAR.toLocaleString()}
              <span className="text-sm font-semibold text-amber-400 ml-3">
                (~ PKR {(grandTotalSAR * 74).toLocaleString()})
              </span>
            </div>
            {isManualOverride && adjustmentReason && (
              <div className="text-xs text-slate-400 mt-1 italic">
                Reason: {adjustmentReason}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>

            {userRole === 'agent' ? (
              <button
                onClick={() => handleSave('draft')}
                className="px-6 py-3 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-lg transition cursor-pointer"
              >
                {editingVoucher ? `Save Changes (${voucherNo})` : `Save Draft Voucher (${voucherNo})`}
              </button>
            ) : (
              <button
                onClick={() => handleSave('approved')}
                className="px-6 py-3 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg transition cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                {editingVoucher ? `Save & Update Voucher (${voucherNo})` : `Approve & Generate Official Voucher (${voucherNo})`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
