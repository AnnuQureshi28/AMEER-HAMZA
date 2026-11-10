import React, { useState } from 'react';
import { HotelRate, VisaRate, TransportRate, VisaCompany, GroundContact, RoomTypeOption, RoomTypeRatePair } from '../types';

const ROOM_TYPE_OPTIONS: RoomTypeOption[] = ['Double', 'Triple', 'Quad', 'Quint', 'Sharing'];

const createDefaultRoomTypeRates = (baseBuying = 200, baseSelling = 260): Record<RoomTypeOption, RoomTypeRatePair> => ({
  Double: { buyingRateSAR: baseBuying, sellingRateB2BSAR: baseSelling },
  Triple: { buyingRateSAR: Math.round(baseBuying * 1.15), sellingRateB2BSAR: Math.round(baseSelling * 1.15) },
  Quad: { buyingRateSAR: Math.round(baseBuying * 1.3), sellingRateB2BSAR: Math.round(baseSelling * 1.3) },
  Quint: { buyingRateSAR: Math.round(baseBuying * 1.45), sellingRateB2BSAR: Math.round(baseSelling * 1.45) },
  Sharing: { buyingRateSAR: Math.round(baseBuying * 0.4), sellingRateB2BSAR: Math.round(baseSelling * 0.4) },
});
import {
  Building2,
  FileCheck2,
  Car,
  Plus,
  Search,
  Star,
  DollarSign,
  Briefcase,
  PhoneCall,
  CheckCircle,
  Users,
  Trash2,
  Edit2,
  X,
  Check,
} from 'lucide-react';

interface RatesMasterViewProps {
  hotelRates: HotelRate[];
  visaRates: VisaRate[];
  transportRates: TransportRate[];
  visaCompanies: VisaCompany[];
  groundContacts: GroundContact[];
  onAddHotelRate: (rate: HotelRate) => void;
  onUpdateHotelRate?: (rate: HotelRate) => void;
  onDeleteHotelRate?: (rateId: string) => void;
  onAddVisaRate: (rate: VisaRate) => void;
  onUpdateVisaRate?: (rate: VisaRate) => void;
  onDeleteVisaRate?: (rateId: string) => void;
  onAddTransportRate: (rate: TransportRate) => void;
  onUpdateTransportRate?: (rate: TransportRate) => void;
  onDeleteTransportRate?: (rateId: string) => void;
  onAddVisaCompany: (company: VisaCompany) => void;
  onUpdateGroundContacts: (contacts: GroundContact[]) => void;
  userRole: 'admin' | 'staff' | 'agent';
}

export const RatesMasterView: React.FC<RatesMasterViewProps> = ({
  hotelRates,
  visaRates,
  transportRates,
  visaCompanies,
  groundContacts,
  onAddHotelRate,
  onUpdateHotelRate,
  onDeleteHotelRate,
  onAddVisaRate,
  onUpdateVisaRate,
  onDeleteVisaRate,
  onAddTransportRate,
  onUpdateTransportRate,
  onDeleteTransportRate,
  onAddVisaCompany,
  onUpdateGroundContacts,
  userRole,
}) => {
  const [activeTab, setActiveTab] = useState<'hotels' | 'visas' | 'transport' | 'visacompanies' | 'staff'>('hotels');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
  const [isEditHotelModalOpen, setIsEditHotelModalOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<HotelRate | null>(null);

  const [isVisaModalOpen, setIsVisaModalOpen] = useState(false);
  const [isEditVisaModalOpen, setIsEditVisaModalOpen] = useState(false);
  const [editingVisa, setEditingVisa] = useState<VisaRate | null>(null);

  const [isTransportModalOpen, setIsTransportModalOpen] = useState(false);
  const [isEditTransportModalOpen, setIsEditTransportModalOpen] = useState(false);
  const [editingTransport, setEditingTransport] = useState<TransportRate | null>(null);

  const [isVisaCompanyModalOpen, setIsVisaCompanyModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaffIndex, setEditingStaffIndex] = useState<number | null>(null);

  // Forms State
  const [newHotel, setNewHotel] = useState<Partial<HotelRate>>({
    city: 'Makkah',
    hotelName: '',
    roomType: 'Quad',
    mealPlan: 'RO',
    season: 'Standard',
    buyingRateSAR: 200,
    sellingRateB2BSAR: 260,
    starRating: 4,
    roomTypeRates: createDefaultRoomTypeRates(200, 260),
  });

  const [newVisa, setNewVisa] = useState<Partial<VisaRate>>({
    visaType: 'Umrah Visa 30 Days Single Entry',
    durationDays: 30,
    buyingRatePKR: 44000,
    sellingRateB2BPKR: 50000,
    processingTime: '24-48 Hours',
  });

  const [newTransport, setNewTransport] = useState<Partial<TransportRate>>({
    route: 'Jeddah Airport -> Makkah Hotel',
    vehicleType: 'Private GMC Yukon (7 Pax)',
    buyingRateSAR: 450,
    sellingRateB2BSAR: 550,
  });

  const [newVisaCo, setNewVisaCo] = useState<Partial<VisaCompany>>({
    companyName: '',
    branchCity: 'Multan',
    whatsapp: '+92 300 8632190',
    licenseNo: 'KSA-MOFA-4809',
    notes: 'Saudi Umrah Visa & MOFA Issuing Partner',
  });

  const [staffForm, setStaffForm] = useState<GroundContact>({
    city: 'Makkah',
    name: '',
    role: 'Hotel Check-in',
    contact: '+966 ',
  });

  const updateNewHotelRoomRate = (rt: RoomTypeOption, field: 'buyingRateSAR' | 'sellingRateB2BSAR', value: number) => {
    const currentMap = newHotel.roomTypeRates || createDefaultRoomTypeRates(newHotel.buyingRateSAR || 200, newHotel.sellingRateB2BSAR || 260);
    const updatedMap = {
      ...currentMap,
      [rt]: {
        ...currentMap[rt],
        [field]: value,
      },
    };
    const activeRt = (ROOM_TYPE_OPTIONS.includes(newHotel.roomType as RoomTypeOption) ? newHotel.roomType : 'Quad') as RoomTypeOption;
    setNewHotel({
      ...newHotel,
      roomTypeRates: updatedMap,
      buyingRateSAR: updatedMap[activeRt].buyingRateSAR,
      sellingRateB2BSAR: updatedMap[activeRt].sellingRateB2BSAR,
    });
  };

  const updateEditHotelRoomRate = (rt: RoomTypeOption, field: 'buyingRateSAR' | 'sellingRateB2BSAR', value: number) => {
    if (!editingHotel) return;
    const currentMap = editingHotel.roomTypeRates || createDefaultRoomTypeRates(editingHotel.buyingRateSAR || 200, editingHotel.sellingRateB2BSAR || 260);
    const updatedMap = {
      ...currentMap,
      [rt]: {
        ...currentMap[rt],
        [field]: value,
      },
    };
    const activeRt = (ROOM_TYPE_OPTIONS.includes(editingHotel.roomType as RoomTypeOption) ? editingHotel.roomType : 'Quad') as RoomTypeOption;
    setEditingHotel({
      ...editingHotel,
      roomTypeRates: updatedMap,
      buyingRateSAR: updatedMap[activeRt].buyingRateSAR,
      sellingRateB2BSAR: updatedMap[activeRt].sellingRateB2BSAR,
    });
  };

  const handleCreateHotel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHotel.hotelName) return;
    const ratesMap = newHotel.roomTypeRates || createDefaultRoomTypeRates(Number(newHotel.buyingRateSAR) || 200, Number(newHotel.sellingRateB2BSAR) || 260);
    const activeRt = (ROOM_TYPE_OPTIONS.includes(newHotel.roomType as RoomTypeOption) ? newHotel.roomType : 'Quad') as RoomTypeOption;
    onAddHotelRate({
      id: 'hr-' + Date.now(),
      city: newHotel.city as any,
      hotelName: newHotel.hotelName,
      roomType: activeRt,
      mealPlan: newHotel.mealPlan as any || 'RO',
      season: newHotel.season || 'Standard',
      buyingRateSAR: ratesMap[activeRt].buyingRateSAR,
      sellingRateB2BSAR: ratesMap[activeRt].sellingRateB2BSAR,
      starRating: Number(newHotel.starRating) || 4,
      roomTypeRates: ratesMap,
    });
    setIsHotelModalOpen(false);
    setNewHotel({
      city: 'Makkah',
      hotelName: '',
      roomType: 'Quad',
      mealPlan: 'RO',
      season: 'Standard',
      buyingRateSAR: 200,
      sellingRateB2BSAR: 260,
      starRating: 4,
      roomTypeRates: createDefaultRoomTypeRates(200, 260),
    });
  };

  const openEditHotelModal = (hotel: HotelRate) => {
    const fallbackRates = createDefaultRoomTypeRates(hotel.buyingRateSAR || 200, hotel.sellingRateB2BSAR || 260);
    const activeRt = ROOM_TYPE_OPTIONS.includes(hotel.roomType as RoomTypeOption) ? (hotel.roomType as RoomTypeOption) : 'Quad';
    if (!hotel.roomTypeRates) {
      fallbackRates[activeRt] = {
        buyingRateSAR: hotel.buyingRateSAR || 0,
        sellingRateB2BSAR: hotel.sellingRateB2BSAR || 0,
      };
    }
    setEditingHotel({
      ...hotel,
      roomType: activeRt,
      roomTypeRates: hotel.roomTypeRates || fallbackRates,
    });
    setIsEditHotelModalOpen(true);
  };

  const handleSaveEditedHotel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHotel || !editingHotel.hotelName) return;
    const activeRt = ROOM_TYPE_OPTIONS.includes(editingHotel.roomType as RoomTypeOption)
      ? (editingHotel.roomType as RoomTypeOption)
      : 'Quad';
    const finalHotel: HotelRate = {
      ...editingHotel,
      roomType: activeRt,
      buyingRateSAR: editingHotel.roomTypeRates?.[activeRt]?.buyingRateSAR ?? editingHotel.buyingRateSAR,
      sellingRateB2BSAR: editingHotel.roomTypeRates?.[activeRt]?.sellingRateB2BSAR ?? editingHotel.sellingRateB2BSAR,
    };
    if (onUpdateHotelRate) {
      onUpdateHotelRate(finalHotel);
    }
    setIsEditHotelModalOpen(false);
    setEditingHotel(null);
  };

  const handleDeleteHotel = (hotelId: string, hotelName: string) => {
    if (confirm(`Are you sure you want to delete rate for "${hotelName}"?`)) {
      if (onDeleteHotelRate) {
        onDeleteHotelRate(hotelId);
      }
    }
  };

  const handleCreateVisa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVisa.visaType) return;
    onAddVisaRate({
      id: 'vr-' + Date.now(),
      visaType: newVisa.visaType,
      durationDays: Number(newVisa.durationDays) || 30,
      buyingRatePKR: Number(newVisa.buyingRatePKR) || 0,
      sellingRateB2BPKR: Number(newVisa.sellingRateB2BPKR) || 0,
      processingTime: newVisa.processingTime || '24 Hours',
    });
    setIsVisaModalOpen(false);
  };

  const openEditVisaModal = (visa: VisaRate) => {
    setEditingVisa({ ...visa });
    setIsEditVisaModalOpen(true);
  };

  const handleSaveEditedVisa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVisa || !editingVisa.visaType) return;
    if (onUpdateVisaRate) {
      onUpdateVisaRate(editingVisa);
    }
    setIsEditVisaModalOpen(false);
    setEditingVisa(null);
  };

  const handleDeleteVisa = (visaId: string, visaType: string) => {
    if (confirm(`Are you sure you want to delete rate for "${visaType}"?`)) {
      if (onDeleteVisaRate) {
        onDeleteVisaRate(visaId);
      }
    }
  };

  const handleCreateTransport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransport.route) return;
    onAddTransportRate({
      id: 'tr-' + Date.now(),
      route: newTransport.route,
      vehicleType: newTransport.vehicleType || 'Economy By Bus',
      buyingRateSAR: Number(newTransport.buyingRateSAR) || 0,
      sellingRateB2BSAR: Number(newTransport.sellingRateB2BSAR) || 0,
    });
    setIsTransportModalOpen(false);
  };

  const openEditTransportModal = (transport: TransportRate) => {
    setEditingTransport({ ...transport });
    setIsEditTransportModalOpen(true);
  };

  const handleSaveEditedTransport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransport || !editingTransport.route) return;
    if (onUpdateTransportRate) {
      onUpdateTransportRate(editingTransport);
    }
    setIsEditTransportModalOpen(false);
    setEditingTransport(null);
  };

  const handleDeleteTransport = (transportId: string, route: string) => {
    if (confirm(`Are you sure you want to delete transport rate for "${route}"?`)) {
      if (onDeleteTransportRate) {
        onDeleteTransportRate(transportId);
      }
    }
  };

  const handleCreateVisaCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVisaCo.companyName) return;
    onAddVisaCompany({
      id: 'vc-' + Date.now(),
      companyName: newVisaCo.companyName,
      branchCity: newVisaCo.branchCity || 'Saudi Arabia',
      whatsapp: newVisaCo.whatsapp || '+966 50 123 4567',
      phone: newVisaCo.whatsapp || '+966 50 123 4567',
      licenseNo: newVisaCo.licenseNo || 'KSA-MOFA-GEN',
      notes: newVisaCo.notes || 'Visa Partner',
    });
    setIsVisaCompanyModalOpen(false);
  };

  const openAddStaffModal = () => {
    setEditingStaffIndex(null);
    setStaffForm({
      city: 'Makkah',
      name: '',
      role: 'Hotel Check-in',
      contact: '+966 ',
    });
    setIsStaffModalOpen(true);
  };

  const openEditStaffModal = (contact: GroundContact, index: number) => {
    setEditingStaffIndex(index);
    setStaffForm({ ...contact });
    setIsStaffModalOpen(true);
  };

  const handleSaveStaffForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.name.trim()) return;

    let updated: GroundContact[];
    if (editingStaffIndex !== null) {
      updated = [...groundContacts];
      updated[editingStaffIndex] = staffForm;
    } else {
      updated = [...groundContacts, staffForm];
    }
    onUpdateGroundContacts(updated);
    setIsStaffModalOpen(false);
  };

  const handleDeleteStaff = (index: number) => {
    const updated = groundContacts.filter((_, i) => i !== index);
    onUpdateGroundContacts(updated);
  };

  const isAdmin = userRole === 'admin' || userRole === 'staff';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">CRM Pricing & Master Data</h1>
            <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase">
              B2B Masters
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage contract rates for hotels, Umrah visas, transport routes, Saudi Visa Companies, and Ground Staff contacts.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-800 p-1.5 rounded-xl text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('hotels')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'hotels' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Hotels ({hotelRates.length})
          </button>
          <button
            onClick={() => setActiveTab('visas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'visas' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            Visa Rates ({visaRates.length})
          </button>
          <button
            onClick={() => setActiveTab('transport')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'transport' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Car className="w-4 h-4" />
            Transport ({transportRates.length})
          </button>
          <button
            onClick={() => setActiveTab('visacompanies')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'visacompanies' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Visa Companies ({visaCompanies.length})
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'staff' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Ground Staff ({groundContacts.length})
          </button>
        </div>
      </div>

      {/* Subheader Search & Add Button */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        {isAdmin && (
          <div>
            {activeTab === 'hotels' && (
              <button
                onClick={() => setIsHotelModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Contract Hotel Rate
              </button>
            )}
            {activeTab === 'visas' && (
              <button
                onClick={() => setIsVisaModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Visa Pricing
              </button>
            )}
            {activeTab === 'transport' && (
              <button
                onClick={() => setIsTransportModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Transport Route
              </button>
            )}
            {activeTab === 'visacompanies' && (
              <button
                onClick={() => setIsVisaCompanyModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Saudi Visa Company
              </button>
            )}
            {activeTab === 'staff' && (
              <button
                onClick={openAddStaffModal}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Ground Staff Contact
              </button>
            )}
          </div>
        )}
      </div>

      {/* TAB 1: HOTELS */}
      {activeTab === 'hotels' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="p-3">City</th>
                  <th className="p-3">Hotel Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Room Type</th>
                  <th className="p-3">Meal</th>
                  <th className="p-3">Season</th>
                  {isAdmin && <th className="p-3 text-right">Cost (SAR)</th>}
                  <th className="p-3 text-right text-emerald-700">B2B Rate (SAR)</th>
                  {isAdmin && <th className="p-3 text-right text-amber-600">Margin</th>}
                  {isAdmin && <th className="p-3 text-center w-24">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hotelRates.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 10 : 7} className="p-8 text-center text-slate-500">
                      <div className="max-w-md mx-auto space-y-3">
                        <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
                        <div className="font-bold text-slate-800 text-sm">No Hotel Contract Rates Configured</div>
                        <p className="text-xs text-slate-500">
                          Previous default hotel rates have been removed as requested. You can now add and customize your exact contract hotel rates for Makkah, Medinah, and Jeddah.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsHotelModalOpen(true)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer shadow-xs"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                          Add Contract Hotel Rate
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  hotelRates
                    .filter(
                      (h) =>
                        h.hotelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        h.city.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((hotel) => {
                      const margin = hotel.sellingRateB2BSAR - hotel.buyingRateSAR;
                      return (
                        <tr key={hotel.id} className="hover:bg-amber-50/30 transition">
                          <td className="p-3 font-semibold text-slate-900">{hotel.city}</td>
                          <td className="p-3 font-bold text-slate-900">{hotel.hotelName}</td>
                          <td className="p-3 text-amber-500">
                            {'★'.repeat(hotel.starRating || 4)}
                          </td>
                          <td className="p-3 text-slate-700">
                            {hotel.roomTypeRates ? (
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {ROOM_TYPE_OPTIONS.map((rt) => (
                                  <span
                                    key={rt}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-800"
                                  >
                                    {rt}: <span className="font-mono text-emerald-700 font-bold">{hotel.roomTypeRates?.[rt]?.sellingRateB2BSAR ?? hotel.sellingRateB2BSAR}</span>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              hotel.roomType
                            )}
                          </td>
                          <td className="p-3 font-medium text-slate-600">{hotel.mealPlan}</td>
                          <td className="p-3 text-slate-500">{hotel.season}</td>
                          {isAdmin && (
                            <td className="p-3 text-right font-mono text-slate-500">
                              SAR {hotel.buyingRateSAR}
                            </td>
                          )}
                          <td className="p-3 text-right font-mono font-bold text-emerald-700 text-sm">
                            SAR {hotel.sellingRateB2BSAR}
                          </td>
                          {isAdmin && (
                            <td className="p-3 text-right font-mono font-bold text-amber-600">
                              +SAR {margin}
                            </td>
                          )}
                          {isAdmin && (
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openEditHotelModal(hotel)}
                                  className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                                  title="Change / Edit Hotel Rate"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteHotel(hotel.id, hotel.hotelName)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                  title="Delete Hotel Rate"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: VISAS */}
      {activeTab === 'visas' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="p-3">Visa Type & Inclusions</th>
                  <th className="p-3">Validity</th>
                  <th className="p-3">Turnaround Time</th>
                  {isAdmin && <th className="p-3 text-right">Cost (PKR)</th>}
                  <th className="p-3 text-right text-emerald-700">B2B Rate (PKR)</th>
                  {isAdmin && <th className="p-3 text-right text-amber-600">Margin</th>}
                  {isAdmin && <th className="p-3 text-center w-24">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visaRates
                  .filter((v) => v.visaType.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((visa) => {
                    const margin = visa.sellingRateB2BPKR - visa.buyingRatePKR;
                    return (
                      <tr key={visa.id} className="hover:bg-amber-50/30 transition">
                        <td className="p-3 font-bold text-slate-900">{visa.visaType}</td>
                        <td className="p-3 font-medium text-slate-700">{visa.durationDays} Days</td>
                        <td className="p-3 text-slate-500">{visa.processingTime}</td>
                        {isAdmin && (
                          <td className="p-3 text-right font-mono text-slate-500">
                            PKR {visa.buyingRatePKR.toLocaleString()}
                          </td>
                        )}
                        <td className="p-3 text-right font-mono font-bold text-emerald-700 text-sm">
                          PKR {visa.sellingRateB2BPKR.toLocaleString()}
                        </td>
                        {isAdmin && (
                          <td className="p-3 text-right font-mono font-bold text-amber-600">
                            +PKR {margin.toLocaleString()}
                          </td>
                        )}
                        {isAdmin && (
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditVisaModal(visa)}
                                className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                                title="Change / Edit Visa Rate"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteVisa(visa.id, visa.visaType)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Delete Visa Rate"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TRANSPORT */}
      {activeTab === 'transport' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="p-3">Route Description</th>
                  <th className="p-3">Vehicle Specification</th>
                  {isAdmin && <th className="p-3 text-right">Cost (SAR)</th>}
                  <th className="p-3 text-right text-emerald-700">B2B Price (SAR)</th>
                  {isAdmin && <th className="p-3 text-right text-amber-600">Margin</th>}
                  {isAdmin && <th className="p-3 text-center w-24">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transportRates
                  .filter(
                    (t) =>
                      t.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      t.vehicleType.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((tr) => {
                    const margin = tr.sellingRateB2BSAR - tr.buyingRateSAR;
                    return (
                      <tr key={tr.id} className="hover:bg-amber-50/30 transition">
                        <td className="p-3 font-bold text-slate-900">{tr.route}</td>
                        <td className="p-3 font-medium text-slate-700">{tr.vehicleType}</td>
                        {isAdmin && (
                          <td className="p-3 text-right font-mono text-slate-500">
                            SAR {tr.buyingRateSAR}
                          </td>
                        )}
                        <td className="p-3 text-right font-mono font-bold text-emerald-700 text-sm">
                          SAR {tr.sellingRateB2BSAR}
                        </td>
                        {isAdmin && (
                          <td className="p-3 text-right font-mono font-bold text-amber-600">
                            +SAR {margin}
                          </td>
                        )}
                        {isAdmin && (
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditTransportModal(tr)}
                                className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                                title="Change / Edit Transport Rate"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTransport(tr.id, tr.route)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Delete Transport Rate"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: VISA COMPANIES (SAUDI MOFA PARTNERS) */}
      {activeTab === 'visacompanies' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-blue-50/60 border-b border-blue-100 text-xs text-blue-900">
            <span className="font-bold">Understanding Visa Companies:</span> As clarified in your workflow, Visa Companies (like <span className="font-bold">Ziafa International</span>) are Saudi MOFA providers and visa processors—<span className="underline">not</span> your clients. They appear on the top-right header of the hotel voucher, while Sub-Agents are your B2B clients. You can configure multiple Visa Companies here.
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="p-3">Visa Company Name</th>
                  <th className="p-3 w-36">Branch / City</th>
                  <th className="p-3 w-44">WhatsApp Contact</th>
                  <th className="p-3 w-40">KSA MOFA License</th>
                  <th className="p-3">Operational Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visaCompanies
                  .filter((vc) => vc.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((vc) => (
                    <tr key={vc.id} className="hover:bg-amber-50/20">
                      <td className="p-3 font-bold text-blue-950 text-sm flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        {vc.companyName}
                      </td>
                      <td className="p-3 font-medium text-slate-800">{vc.branchCity}</td>
                      <td className="p-3 font-mono font-bold text-slate-900 flex items-center gap-1.5">
                        <PhoneCall className="w-3.5 h-3.5 text-emerald-600 inline" />
                        {vc.whatsapp}
                      </td>
                      <td className="p-3 font-mono text-slate-600">{vc.licenseNo || '-'}</td>
                      <td className="p-3 text-slate-500">{vc.notes || 'Official Visa Gateway'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: GROUND STAFF CONTACTS MASTER (MAKKAH / MADINAH / JEDDAH) */}
      {activeTab === 'staff' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden space-y-4">
          <div className="p-4 bg-emerald-50/80 border-b border-emerald-100 text-xs text-emerald-950 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="font-bold">On-Ground Staff Directory:</span> These staff members (names, roles, and Saudi mobile/WhatsApp numbers) are pre-filled as default contacts on all newly generated vouchers.
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={openAddStaffModal}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                Add New Staff Member
              </button>
            )}
          </div>

          <div className="overflow-x-auto p-4 pt-0">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="p-3 w-32">City</th>
                  <th className="p-3">Staff Name</th>
                  <th className="p-3 w-48">Duty / Responsibility</th>
                  <th className="p-3 w-52">Saudi Contact / WhatsApp</th>
                  {isAdmin && <th className="p-3 text-center w-24">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {groundContacts
                  .filter(
                    (c) =>
                      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      c.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      c.role.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((contact, idx) => (
                    <tr key={idx} className="hover:bg-emerald-50/30 transition">
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                          {contact.city}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-900 text-sm">{contact.name}</td>
                      <td className="p-3 text-slate-700 font-medium">{contact.role}</td>
                      <td className="p-3 font-mono font-bold text-emerald-800 flex items-center gap-1.5">
                        <PhoneCall className="w-3.5 h-3.5 text-emerald-600 inline" />
                        {contact.contact}
                      </td>
                      {isAdmin && (
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditStaffModal(contact, idx)}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                              title="Edit staff details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteStaff(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Delete staff contact"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT STAFF CONTACT */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-700" />
                {editingStaffIndex !== null ? 'Edit Staff Contact' : 'Add Ground Staff Contact'}
              </h3>
              <button
                type="button"
                onClick={() => setIsStaffModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStaffForm} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">City</label>
                <select
                  value={staffForm.city}
                  onChange={(e) => setStaffForm({ ...staffForm, city: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-semibold"
                >
                  <option value="Makkah">Makkah</option>
                  <option value="Medinah">Medinah</option>
                  <option value="Jeddah">Jeddah</option>
                  <option value="Airport Desk">Airport Desk</option>
                  <option value="Central Ops">Central Ops</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Staff Member Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Saddam, Rana Rashid, Ismail..."
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Duty / Role</label>
                <input
                  type="text"
                  placeholder="e.g. Hotel Check-in, Transport Coordinator..."
                  value={staffForm.role}
                  onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Saudi Contact / WhatsApp *</label>
                <input
                  type="text"
                  required
                  placeholder="+966 59 818 3039"
                  value={staffForm.contact}
                  onChange={(e) => setStaffForm({ ...staffForm, contact: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold text-emerald-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  Save Staff Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD HOTEL */}
      {isHotelModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-600" />
              Add Hotel Contract Rate (5 Room Types)
            </h3>
            <form onSubmit={handleCreateHotel} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">City</label>
                  <select
                    value={newHotel.city}
                    onChange={(e) => setNewHotel({ ...newHotel, city: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  >
                    <option value="Makkah">Makkah</option>
                    <option value="Medinah">Medinah</option>
                    <option value="Jeddah">Jeddah</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Star Category</label>
                  <select
                    value={newHotel.starRating}
                    onChange={(e) => setNewHotel({ ...newHotel, starRating: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  >
                    <option value={3}>3 Star Standard</option>
                    <option value={4}>4 Star Deluxe</option>
                    <option value={5}>5 Star Luxury</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Hotel Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Swissotel Al Maqam Clock Tower"
                  value={newHotel.hotelName}
                  onChange={(e) => setNewHotel({ ...newHotel, hotelName: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Default Room Type</label>
                  <select
                    value={newHotel.roomType}
                    onChange={(e) => {
                      const rt = e.target.value as RoomTypeOption;
                      const rtPair = newHotel.roomTypeRates?.[rt];
                      setNewHotel({
                        ...newHotel,
                        roomType: rt,
                        buyingRateSAR: rtPair?.buyingRateSAR ?? newHotel.buyingRateSAR,
                        sellingRateB2BSAR: rtPair?.sellingRateB2BSAR ?? newHotel.sellingRateB2BSAR,
                      });
                    }}
                    className="w-full border border-slate-300 rounded-lg p-2 font-semibold"
                  >
                    {ROOM_TYPE_OPTIONS.map((rt) => (
                      <option key={rt} value={rt}>{rt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Meal Plan</label>
                  <select
                    value={newHotel.mealPlan}
                    onChange={(e) => setNewHotel({ ...newHotel, mealPlan: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  >
                    <option value="RO">RO (Room Only)</option>
                    <option value="BB">BB (Bed & Breakfast)</option>
                    <option value="HB">HB (Half Board)</option>
                    <option value="FB">FB (Full Board)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Season</label>
                  <input
                    type="text"
                    value={newHotel.season}
                    onChange={(e) => setNewHotel({ ...newHotel, season: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                    placeholder="Standard"
                  />
                </div>
              </div>

              {/* 5 Room Types Separate Rates */}
              <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 space-y-2">
                <div className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">
                  Room Type Rates (SAR / Night) — All 5 Types
                </div>
                <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-600 px-1">
                  <div className="col-span-4">Room Type</div>
                  <div className="col-span-4 text-right">Cost (SAR)</div>
                  <div className="col-span-4 text-right">B2B Rate (SAR)</div>
                </div>
                {ROOM_TYPE_OPTIONS.map((rt) => {
                  const pair = newHotel.roomTypeRates?.[rt] || { buyingRateSAR: 200, sellingRateB2BSAR: 260 };
                  return (
                    <div key={rt} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-4 font-bold text-slate-800">{rt}</div>
                      <div className="col-span-4">
                        <input
                          type="number"
                          value={pair.buyingRateSAR}
                          onChange={(e) => updateNewHotelRoomRate(rt, 'buyingRateSAR', Number(e.target.value))}
                          className="w-full border border-slate-300 bg-white rounded-lg p-1.5 text-right font-mono"
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          type="number"
                          required
                          value={pair.sellingRateB2BSAR}
                          onChange={(e) => updateNewHotelRoomRate(rt, 'sellingRateB2BSAR', Number(e.target.value))}
                          className="w-full border border-amber-300 bg-white rounded-lg p-1.5 text-right font-mono font-bold text-emerald-800"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsHotelModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  Save Hotel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT / CHANGE HOTEL CONTRACT RATE */}
      {isEditHotelModalOpen && editingHotel && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-600" />
                Edit Hotel Contract Rate (5 Room Types)
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsEditHotelModalOpen(false);
                  setEditingHotel(null);
                }}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedHotel} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">City</label>
                  <select
                    value={editingHotel.city}
                    onChange={(e) => setEditingHotel({ ...editingHotel, city: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-semibold"
                  >
                    <option value="Makkah">Makkah</option>
                    <option value="Medinah">Medinah</option>
                    <option value="Jeddah">Jeddah</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Star Category</label>
                  <select
                    value={editingHotel.starRating}
                    onChange={(e) => setEditingHotel({ ...editingHotel, starRating: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-semibold"
                  >
                    <option value={3}>3 Star Standard</option>
                    <option value={4}>4 Star Deluxe</option>
                    <option value={5}>5 Star Luxury</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Hotel Name *</label>
                <input
                  type="text"
                  required
                  value={editingHotel.hotelName}
                  onChange={(e) => setEditingHotel({ ...editingHotel, hotelName: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Default Room Type</label>
                  <select
                    value={editingHotel.roomType}
                    onChange={(e) => {
                      const rt = e.target.value as RoomTypeOption;
                      const rtPair = editingHotel.roomTypeRates?.[rt];
                      setEditingHotel({
                        ...editingHotel,
                        roomType: rt,
                        buyingRateSAR: rtPair?.buyingRateSAR ?? editingHotel.buyingRateSAR,
                        sellingRateB2BSAR: rtPair?.sellingRateB2BSAR ?? editingHotel.sellingRateB2BSAR,
                      });
                    }}
                    className="w-full border border-slate-300 rounded-lg p-2 font-semibold"
                  >
                    {ROOM_TYPE_OPTIONS.map((rt) => (
                      <option key={rt} value={rt}>{rt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Meal Plan</label>
                  <select
                    value={editingHotel.mealPlan}
                    onChange={(e) => setEditingHotel({ ...editingHotel, mealPlan: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  >
                    <option value="RO">RO (Room Only)</option>
                    <option value="BB">BB (Bed & Breakfast)</option>
                    <option value="HB">HB (Half Board)</option>
                    <option value="FB">FB (Full Board)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Season</label>
                  <input
                    type="text"
                    value={editingHotel.season}
                    onChange={(e) => setEditingHotel({ ...editingHotel, season: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                    placeholder="Standard / Peak / Ramadan"
                  />
                </div>
              </div>

              {/* 5 Room Types Separate Rates */}
              <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 space-y-2">
                <div className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">
                  Room Type Rates (SAR / Night) — All 5 Types
                </div>
                <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-600 px-1">
                  <div className="col-span-4">Room Type</div>
                  <div className="col-span-4 text-right">Cost (SAR)</div>
                  <div className="col-span-4 text-right">B2B Rate (SAR)</div>
                </div>
                {ROOM_TYPE_OPTIONS.map((rt) => {
                  const pair = editingHotel.roomTypeRates?.[rt] || {
                    buyingRateSAR: editingHotel.buyingRateSAR,
                    sellingRateB2BSAR: editingHotel.sellingRateB2BSAR,
                  };
                  return (
                    <div key={rt} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-4 font-bold text-slate-800">{rt}</div>
                      <div className="col-span-4">
                        <input
                          type="number"
                          value={pair.buyingRateSAR}
                          onChange={(e) => updateEditHotelRoomRate(rt, 'buyingRateSAR', Number(e.target.value))}
                          className="w-full border border-slate-300 bg-white rounded-lg p-1.5 text-right font-mono"
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          type="number"
                          required
                          value={pair.sellingRateB2BSAR}
                          onChange={(e) => updateEditHotelRoomRate(rt, 'sellingRateB2BSAR', Number(e.target.value))}
                          className="w-full border border-amber-300 bg-white rounded-lg p-1.5 text-right font-mono font-bold text-emerald-800"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditHotelModalOpen(false);
                    setEditingHotel(null);
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD VISA */}
      {isVisaModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-amber-600" />
              Add Umrah Visa Pricing
            </h3>
            <form onSubmit={handleCreateVisa} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Visa Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Umrah 30 Days Single Entry"
                  value={newVisa.visaType}
                  onChange={(e) => setNewVisa({ ...newVisa, visaType: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cost PKR</label>
                  <input
                    type="number"
                    value={newVisa.buyingRatePKR}
                    onChange={(e) => setNewVisa({ ...newVisa, buyingRatePKR: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Selling PKR</label>
                  <input
                    type="number"
                    value={newVisa.sellingRateB2BPKR}
                    onChange={(e) =>
                      setNewVisa({ ...newVisa, sellingRateB2BPKR: Number(e.target.value) })
                    }
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsVisaModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  Save Visa Rate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD TRANSPORT */}
      {isTransportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Car className="w-5 h-5 text-amber-600" />
              Add Transport Route Rate
            </h3>
            <form onSubmit={handleCreateTransport} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Route</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Makkah -> Madinah"
                  value={newTransport.route}
                  onChange={(e) => setNewTransport({ ...newTransport, route: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Vehicle Type</label>
                <input
                  type="text"
                  value={newTransport.vehicleType}
                  onChange={(e) =>
                    setNewTransport({ ...newTransport, vehicleType: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cost SAR</label>
                  <input
                    type="number"
                    value={newTransport.buyingRateSAR}
                    onChange={(e) =>
                      setNewTransport({ ...newTransport, buyingRateSAR: Number(e.target.value) })
                    }
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">B2B Price SAR</label>
                  <input
                    type="number"
                    value={newTransport.sellingRateB2BSAR}
                    onChange={(e) =>
                      setNewTransport({ ...newTransport, sellingRateB2BSAR: Number(e.target.value) })
                    }
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTransportModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  Save Transport
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD VISA COMPANY */}
      {isVisaCompanyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-700" />
              Add Visa Company (Saudi Provider)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Add a Saudi visa company (e.g. Ziafa International, Bab Al-Umrah) that appears on voucher top-right.
            </p>

            <form onSubmit={handleCreateVisaCompany} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bab Al-Umrah Services"
                  value={newVisaCo.companyName}
                  onChange={(e) => setNewVisaCo({ ...newVisaCo, companyName: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Branch / City</label>
                <input
                  type="text"
                  placeholder="e.g. Multan / Jeddah"
                  value={newVisaCo.branchCity}
                  onChange={(e) => setNewVisaCo({ ...newVisaCo, branchCity: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">WhatsApp Number</label>
                <input
                  type="text"
                  placeholder="e.g. +92 300 8632190"
                  value={newVisaCo.whatsapp}
                  onChange={(e) => setNewVisaCo({ ...newVisaCo, whatsapp: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">KSA MOFA License #</label>
                <input
                  type="text"
                  placeholder="e.g. KSA-MOFA-480901"
                  value={newVisaCo.licenseNo}
                  onChange={(e) => setNewVisaCo({ ...newVisaCo, licenseNo: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsVisaCompanyModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  Save Visa Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL: EDIT VISA PRICING */}
      {isEditVisaModalOpen && editingVisa && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-600" />
                Edit Umrah Visa Rate
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsEditVisaModalOpen(false);
                  setEditingVisa(null);
                }}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedVisa} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Visa Title *</label>
                <input
                  type="text"
                  required
                  value={editingVisa.visaType}
                  onChange={(e) => setEditingVisa({ ...editingVisa, visaType: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Validity (Days)</label>
                  <input
                    type="number"
                    value={editingVisa.durationDays}
                    onChange={(e) => setEditingVisa({ ...editingVisa, durationDays: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Processing Time</label>
                  <input
                    type="text"
                    value={editingVisa.processingTime}
                    onChange={(e) => setEditingVisa({ ...editingVisa, processingTime: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cost / Buying (PKR)</label>
                  <input
                    type="number"
                    value={editingVisa.buyingRatePKR}
                    onChange={(e) => setEditingVisa({ ...editingVisa, buyingRatePKR: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono text-slate-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">B2B Rate (PKR) *</label>
                  <input
                    type="number"
                    required
                    value={editingVisa.sellingRateB2BPKR}
                    onChange={(e) => setEditingVisa({ ...editingVisa, sellingRateB2BPKR: Number(e.target.value) })}
                    className="w-full border border-amber-300 bg-amber-50/50 rounded-lg p-2 font-mono font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditVisaModalOpen(false);
                    setEditingVisa(null);
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT TRANSPORT RATE */}
      {isEditTransportModalOpen && editingTransport && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-600" />
                Edit Transport Route & Rate
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsEditTransportModalOpen(false);
                  setEditingTransport(null);
                }}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedTransport} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Route Description *</label>
                <input
                  type="text"
                  required
                  value={editingTransport.route}
                  onChange={(e) => setEditingTransport({ ...editingTransport, route: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Vehicle Specification *</label>
                <input
                  type="text"
                  required
                  value={editingTransport.vehicleType}
                  onChange={(e) => setEditingTransport({ ...editingTransport, vehicleType: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Buying Rate (SAR)</label>
                  <input
                    type="number"
                    value={editingTransport.buyingRateSAR}
                    onChange={(e) => setEditingTransport({ ...editingTransport, buyingRateSAR: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono text-slate-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">B2B Rate (SAR) *</label>
                  <input
                    type="number"
                    required
                    value={editingTransport.sellingRateB2BSAR}
                    onChange={(e) => setEditingTransport({ ...editingTransport, sellingRateB2BSAR: Number(e.target.value) })}
                    className="w-full border border-amber-300 bg-amber-50/50 rounded-lg p-2 font-mono font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditTransportModalOpen(false);
                    setEditingTransport(null);
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
