export type UserRole = 'admin' | 'staff' | 'agent';

export interface UserAccount {
  id: string;
  username: string; // or email
  name: string;
  role: UserRole;
  agentId?: string; // linked to B2BAgent if role is agent
  companyName: string;
  city: string;
  password: string;
  whatsapp: string;
}

export interface AgentHotelDiscount {
  id: string;
  hotelName: string;
  city?: 'Makkah' | 'Medinah' | 'Jeddah';
  discountSAR?: number; // specific SAR discount per night
  customRateSAR?: number; // or fixed custom net rate for this agent
  notes?: string;
}

export interface B2BAgent {
  id: string;
  name: string;
  companyName: string;
  city: string;
  phone: string;
  whatsapp: string;
  email: string;
  username?: string;
  loginPassword?: string;
  creditLimit: number;
  currentBalance: number; // positive = advance credit, negative = payable owed
  activeVouchersCount: number;
  status: 'active' | 'suspended';
  address?: string;

  // Sub-Agent Specific Hotel Discounts & Custom Rates (Configured by Admin)
  defaultHotelDiscountSAR?: number; // flat SAR discount per night across all hotels
  defaultHotelDiscountPercent?: number; // percentage discount across all hotels (e.g. 5%)
  customHotelDiscounts?: AgentHotelDiscount[]; // hotel-specific discounts or custom rates
}

export interface VisaCompany {
  id: string;
  companyName: string; // e.g. "Ziafa International", "Bab Al-Umrah", "Al-Deafah", "Dallah KSA"
  branchCity: string;
  whatsapp: string;
  phone: string;
  licenseNo?: string;
  notes?: string;
}

export type PaxType = 'Adult' | 'Child' | 'Infant';
export type Gender = 'Male' | 'Female' | 'M' | 'F';

export interface Mutamer {
  id: string;
  sno: number;
  passportNo: string;
  firstName: string;
  familyName: string;
  mutamerName: string;
  gender: string;
  paxType: PaxType;
  bed: 'Yes' | 'No';
  mofaNo: string;
  grpNo: string;
  visaNo: string;
  pnr: string;
  birthDate?: string;
  nationality?: string;
}

export interface PilgrimGroup {
  id: string;
  groupNo: string;
  groupName: string;
  subAgentId: string;
  subAgentName: string;
  subAgentCompany: string;
  subAgentCity: string;
  visaCompanyId: string;
  visaCompanyName: string;
  visaCompanyCity: string;
  visaCompanyWhatsapp: string;
  mutamers: Mutamer[];
  paxSummary: string;
  totalBeds: number;
  importDate: string;
  voucherId?: string;
  voucherStatus?: 'none' | 'draft' | 'pending' | 'approved' | 'rejected';
}

export interface HotelSector {
  id: string;
  city: 'Makkah' | 'Medinah' | 'Jeddah' | 'Riyadh' | 'Taif';
  hotelName: string;
  view: string;
  meal: 'RO' | 'BB' | 'HB' | 'FB';
  confNo: string;
  roomType: string;
  checkin: string;
  checkout: string;
  nights: number;
  roomCount?: number;
  b2bRatePerNight?: number;
  totalCost?: number;
}

export interface TransportSector {
  id: string;
  travelDate: string;
  transporter: string;
  vehicleType: string;
  routeDescription: string;
  b2bPrice?: number;
}

export interface FlightSector {
  flightNo: string;
  sector: string;
  depTime: string;
  arrTime: string;
}

export interface FlightDetails {
  departure: FlightSector;
  arrival: FlightSector;
}

export interface GroundContact {
  id?: string;
  city: string;
  name: string;
  role: string;
  contact: string;
}

export type VoucherStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export interface VoucherFinancials {
  hotelTotal: number;
  transportTotal: number;
  visaTotal: number;
  subTotal: number;
  // Manual rate adjustments
  isManualRateOverridden: boolean;
  manualFinalRateSAR: number;
  manualAdjustmentReason?: string;
  grandTotal: number; // The final effective SAR amount
  ledgerPosted: boolean;
}

export interface Voucher {
  id: string;
  voucherNo: string;
  manualNo: string;
  status: VoucherStatus;
  voucherDate: string;
  packageType: string;
  familyHead: string;
  groupNo?: string;
  groupName?: string;
  
  // Sub-Agent (Client)
  agentId: string;
  agentName: string;
  agentCompany: string;
  agentCity: string;
  agentWhatsapp: string;

  // Visa Company (Saudi Visa / MOFA provider e.g. Ziafa International)
  visaCompanyId: string;
  visaCompanyName: string;
  visaCompanyCity: string;
  visaCompanyWhatsapp: string;

  mutamers: Mutamer[];
  paxCountText: string;
  accommodations: HotelSector[]; // Supports at least 6 sectors
  transportServices: TransportSector[];
  flights: FlightDetails;
  specialInstructions: string;
  groundContacts: GroundContact[];
  approvedBy?: string;
  approvedDate?: string;
  rejectionReason?: string;
  financials: VoucherFinancials;
  qrData?: string;
  securityHash?: string;
  createdAt: string;
}

export type RoomTypeOption = 'Double' | 'Triple' | 'Quad' | 'Quint' | 'Sharing';

export interface RoomTypeRatePair {
  buyingRateSAR: number;
  sellingRateB2BSAR: number;
}

export interface HotelRate {
  id: string;
  city: 'Makkah' | 'Medinah' | 'Jeddah';
  hotelName: string;
  roomType: RoomTypeOption | string;
  mealPlan: 'RO' | 'BB' | 'HB' | 'FB';
  season: 'Standard' | 'Peak (Ramadan)' | 'Off-Peak';
  buyingRateSAR: number;
  sellingRateB2BSAR: number;
  starRating: number;
  roomTypeRates?: Record<RoomTypeOption, RoomTypeRatePair>;
}

export interface VisaRate {
  id: string;
  visaType: string;
  durationDays: number;
  buyingRatePKR: number;
  sellingRateB2BPKR: number;
  processingTime: string;
}

export interface TransportRate {
  id: string;
  route: string;
  vehicleType: string;
  buyingRateSAR: number;
  sellingRateB2BSAR: number;
}

export interface LedgerEntry {
  id: string;
  agentId: string;
  date: string;
  refNo: string;
  type: 'DEBIT' | 'CREDIT';
  description: string;
  amountPKR: number;
  runningBalancePKR: number;
  method?: string;
  notes?: string;
}
