import React, { useState } from 'react';
import { B2BAgent, UserAccount, HotelRate, AgentHotelDiscount } from '../types';
import {
  Building,
  User,
  Plus,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  Phone,
  MessageCircle,
  MapPin,
  CreditCard,
  Search,
  ExternalLink,
  ShieldCheck,
  Edit2,
  FileText,
  Wallet,
  Sparkles,
  CheckCircle2,
  X,
  LogIn,
  Tag,
  Percent,
  Trash2,
} from 'lucide-react';

interface SubAgentsManagerViewProps {
  agents: B2BAgent[];
  users: UserAccount[];
  hotelRates?: HotelRate[];
  onAddAgent: (newAgent: B2BAgent, newUser: UserAccount, openingBalancePKR?: number) => void;
  onUpdateAgent: (updatedAgent: B2BAgent, updatedPassword?: string) => void;
  onLoginAsAgent: (agentId: string) => void;
  onCreateVoucherForAgent: (agentId: string) => void;
  onViewLedgerForAgent: (agentId: string) => void;
}

export const SubAgentsManagerView: React.FC<SubAgentsManagerViewProps> = ({
  agents,
  users,
  hotelRates = [],
  onAddAgent,
  onUpdateAgent,
  onLoginAsAgent,
  onCreateVoucherForAgent,
  onViewLedgerForAgent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<B2BAgent | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<{ [agentId: string]: boolean }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Hotel Discount Configuration Modal State (Admin Option)
  const [discountAgent, setDiscountAgent] = useState<B2BAgent | null>(null);
  const [defaultDiscountSAR, setDefaultDiscountSAR] = useState<number>(0);
  const [defaultDiscountPercent, setDefaultDiscountPercent] = useState<number>(0);
  const [customDiscounts, setCustomDiscounts] = useState<AgentHotelDiscount[]>([]);

  // New Rule inputs
  const [newRuleHotelName, setNewRuleHotelName] = useState('');
  const [newRuleCity, setNewRuleCity] = useState<'Makkah' | 'Medinah' | 'Jeddah'>('Makkah');
  const [newRuleDiscountSAR, setNewRuleDiscountSAR] = useState<number>(0);
  const [newRuleCustomRateSAR, setNewRuleCustomRateSAR] = useState<number>(0);
  const [newRuleNotes, setNewRuleNotes] = useState('');

  // New Agent Form State
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [city, setCity] = useState('Lahore');
  const [address, setAddress] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [creditLimitPKR, setCreditLimitPKR] = useState<number>(2000000);
  const [openingBalancePKR, setOpeningBalancePKR] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Auto suggest username when company name changes
  const handleCompanyNameChange = (val: string) => {
    setCompanyName(val);
    if (!username || username === companyName.toLowerCase().replace(/[^a-z0-9]/g, '')) {
      const slug = val
        .toLowerCase()
        .replace(/travels?|tours?|express|world|services/gi, '')
        .trim()
        .replace(/[^a-z0-9]/g, '');
      if (slug.length >= 3) {
        setUsername(slug);
        setPassword(`${slug}123`);
      }
    }
  };

  const handleGeneratePassword = () => {
    const randomChars = Math.floor(100 + Math.random() * 900);
    const generated = `${(username || 'agent').toLowerCase()}${randomChars}`;
    setPassword(generated);
  };

  const handleResetCreateForm = () => {
    setCompanyName('');
    setContactName('');
    setCity('Lahore');
    setAddress('');
    setWhatsapp('');
    setPhone('');
    setEmail('');
    setUsername('');
    setPassword('');
    setCreditLimitPKR(2000000);
    setOpeningBalancePKR(0);
    setErrorMessage('');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      setErrorMessage('Username is required.');
      return;
    }

    // Check if username already exists
    const userExists = users.some((u) => u.username.toLowerCase() === cleanUsername);
    const agentExists = agents.some((a) => (a.username || '').toLowerCase() === cleanUsername);
    if (userExists || agentExists) {
      setErrorMessage(`Username "${cleanUsername}" is already taken. Please choose another username.`);
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Password is required.');
      return;
    }

    const newAgentId = `agent-${cleanUsername}-${Date.now().toString().slice(-4)}`;

    const newAgent: B2BAgent = {
      id: newAgentId,
      name: contactName.trim() || companyName.trim(),
      companyName: companyName.trim(),
      city: city.trim(),
      address: address.trim(),
      whatsapp: whatsapp.trim() || '+92 300 0000000',
      phone: phone.trim() || whatsapp.trim(),
      email: email.trim() || `${cleanUsername}@travels.pk`,
      username: cleanUsername,
      loginPassword: password.trim(),
      creditLimit: Number(creditLimitPKR) || 2000000,
      currentBalance: Number(openingBalancePKR) || 0,
      activeVouchersCount: 0,
      status: 'active',
    };

    const newUser: UserAccount = {
      id: `user-${cleanUsername}`,
      username: cleanUsername,
      name: contactName.trim() || companyName.trim(),
      role: 'agent',
      agentId: newAgentId,
      companyName: companyName.trim(),
      city: city.trim(),
      password: password.trim(),
      whatsapp: whatsapp.trim(),
    };

    onAddAgent(newAgent, newUser, openingBalancePKR);
    setSuccessNotice(`New Sub-Agent "${companyName}" created successfully with login ID: ${cleanUsername}`);
    setIsCreateModalOpen(false);
    handleResetCreateForm();
  };

  // Open Hotel Discounts Modal for a specific agent
  const openDiscountModal = (agent: B2BAgent) => {
    setDiscountAgent(agent);
    setDefaultDiscountSAR(agent.defaultHotelDiscountSAR || 0);
    setDefaultDiscountPercent(agent.defaultHotelDiscountPercent || 0);
    setCustomDiscounts(agent.customHotelDiscounts ? [...agent.customHotelDiscounts] : []);
    setNewRuleHotelName('');
    setNewRuleDiscountSAR(0);
    setNewRuleCustomRateSAR(0);
    setNewRuleNotes('');
  };

  const handleAddCustomRule = () => {
    if (!newRuleHotelName.trim()) return;
    const rule: AgentHotelDiscount = {
      id: 'ch-' + Date.now(),
      hotelName: newRuleHotelName.trim(),
      city: newRuleCity,
      discountSAR: Number(newRuleDiscountSAR) || undefined,
      customRateSAR: Number(newRuleCustomRateSAR) || undefined,
      notes: newRuleNotes.trim() || undefined,
    };
    setCustomDiscounts([...customDiscounts, rule]);
    setNewRuleHotelName('');
    setNewRuleDiscountSAR(0);
    setNewRuleCustomRateSAR(0);
    setNewRuleNotes('');
  };

  const handleRemoveCustomRule = (ruleId: string) => {
    setCustomDiscounts(customDiscounts.filter((r) => r.id !== ruleId));
  };

  const handleSaveDiscounts = (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountAgent) return;
    const updated: B2BAgent = {
      ...discountAgent,
      defaultHotelDiscountSAR: Number(defaultDiscountSAR) || 0,
      defaultHotelDiscountPercent: Number(defaultDiscountPercent) || 0,
      customHotelDiscounts: customDiscounts,
    };
    onUpdateAgent(updated);
    setSuccessNotice(`✓ Hotel discounts updated successfully for Sub-Agent "${discountAgent.companyName}"`);
    setDiscountAgent(null);
  };

  // Copy credentials helper
  const handleCopyCredentials = (agent: B2BAgent) => {
    const userAccount = users.find((u) => u.agentId === agent.id);
    const userLogin = agent.username || userAccount?.username || agent.id.replace('agent-', '');
    const userPass = agent.loginPassword || userAccount?.password || 'alquds123';

    const textToCopy = `*Ameer Hamza Travels - Sub-Agent Login Credentials*\nAgency: ${agent.companyName}\nCity: ${agent.city}\nPortal URL: ${window.location.origin}\nUsername: ${userLogin}\nPassword: ${userPass}`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedId(agent.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const togglePasswordVisibility = (agentId: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [agentId]: !prev[agentId],
    }));
  };

  // Filter agents
  const cities = Array.from(new Set(agents.map((a) => a.city)));
  const filteredAgents = agents.filter((a) => {
    const matchesSearch =
      a.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = selectedCity === 'all' || a.city.toLowerCase() === selectedCity.toLowerCase();
    return matchesSearch && matchesCity;
  });

  const totalCreditPKR = agents.reduce((sum, a) => sum + (a.creditLimit || 0), 0);
  const totalBalancePKR = agents.reduce((sum, a) => sum + (a.currentBalance || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-200 font-sans">
      {/* Top Banner / Heading */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  B2B Sub-Agents & Agency Accounts
                </h1>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                  Central Auth
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Create & configure individual login accounts, passwords, credit limits, and ledger balances for each B2B sub-agent partner
              </p>
            </div>
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={() => {
            handleResetCreateForm();
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-400/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Create New Sub-Agent Account
        </button>
      </div>

      {/* Success Notice if created */}
      {successNotice && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-semibold">{successNotice}</span>
          </div>
          <button
            onClick={() => setSuccessNotice(null)}
            className="text-emerald-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
            Total Sub-Agents
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">{agents.length} Agencies</div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">
            All assigned separate login access
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
            Total Credit Limit
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            PKR {(totalCreditPKR / 1000000).toFixed(1)}M
          </div>
          <span className="text-[10px] text-slate-500 font-medium mt-1 block">
            Approved B2B credit ceiling
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
            Net Ledger Position
          </span>
          <div className={`text-2xl font-black mt-1 ${totalBalancePKR >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            PKR {Math.abs(totalBalancePKR).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 font-medium mt-1 block">
            {totalBalancePKR >= 0 ? 'Net Advance on Deposit' : 'Net Receivable from Agents'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
            Security Isolation
          </span>
          <div className="text-2xl font-black text-amber-600 mt-1">100% Isolated</div>
          <span className="text-[10px] text-slate-500 font-medium mt-1 block">
            Each agent only sees their own data
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Agency Name, Contact Person, City, or Username..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none cursor-pointer"
          >
            <option value="all">All Cities ({agents.length})</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-800">{filteredAgents.length}</span> of{' '}
          {agents.length} sub-agents
        </div>
      </div>

      {/* Sub-Agents Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAgents.map((agent) => {
          const userAccount = users.find((u) => u.agentId === agent.id);
          const loginUser = agent.username || userAccount?.username || agent.id.replace('agent-', '');
          const loginPass = agent.loginPassword || userAccount?.password || '••••••••';
          const isPassVisible = visiblePasswords[agent.id];

          return (
            <div
              key={agent.id}
              className="bg-white rounded-3xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              {/* Card Header */}
              <div className="p-5 pb-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-slate-900 text-base leading-snug">
                        {agent.companyName}
                      </h2>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{agent.name}</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {agent.city}
                  </span>
                </div>

                {/* Contact strip */}
                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px] flex items-center gap-1">
                      <Phone className="w-3 h-3" /> WhatsApp:
                    </span>
                    <a
                      href={`https://wa.me/${agent.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-emerald-600 font-bold hover:underline flex items-center gap-1"
                    >
                      {agent.whatsapp}
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>

                  {agent.email && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Email:</span>
                      <span className="font-mono text-slate-700 truncate max-w-[160px]">
                        {agent.email}
                      </span>
                    </div>
                  )}

                  {agent.address && (
                    <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 truncate">
                      <MapPin className="w-3 h-3 inline mr-1 text-slate-400" />
                      {agent.address}
                    </div>
                  )}
                </div>

                {/* LOGIN CREDENTIALS BOX (CRITICAL REQUIREMENT) */}
                <div className="bg-slate-900 text-white rounded-xl p-3 space-y-2 border border-slate-800">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5" />
                      Sub-Agent Login Access
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCredentials(agent)}
                      className="text-slate-300 hover:text-white flex items-center gap-1 text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded cursor-pointer transition"
                      title="Copy credentials for WhatsApp"
                    >
                      {copiedId === agent.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-sans">Username:</span>
                      <span className="text-white font-bold select-all">{loginUser}</span>
                    </div>

                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">Password:</span>
                        <span className="text-amber-300 font-bold select-all">
                          {isPassVisible ? loginPass : '••••••••'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(agent.id)}
                        className="text-slate-400 hover:text-white p-1 cursor-pointer"
                      >
                        {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Ledger & Credit Stats */}
                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Credit Limit
                    </span>
                    <span className="font-bold text-slate-800">
                      PKR {agent.creditLimit.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Current Ledger
                    </span>
                    <span
                      className={`font-bold ${
                        agent.currentBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      PKR {agent.currentBalance.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Hotel Discounts Strip (Admin Managed Option) */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Tag className="w-4 h-4 text-amber-600 shrink-0" />
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 block text-[11px]">Hotel Discount Setting</span>
                      <span className="text-[10px] text-amber-900 font-medium truncate block">
                        {agent.defaultHotelDiscountSAR ? (
                          <>Flat <strong className="text-emerald-700">-{agent.defaultHotelDiscountSAR} SAR / night</strong></>
                        ) : agent.defaultHotelDiscountPercent ? (
                          <><strong className="text-emerald-700">{agent.defaultHotelDiscountPercent}% off</strong> B2B hotel rates</>
                        ) : (
                          <span className="text-slate-500">Standard B2B Hotel Rates</span>
                        )}
                        {agent.customHotelDiscounts && agent.customHotelDiscounts.length > 0 && (
                          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold text-[9px]">
                            +{agent.customHotelDiscounts.length} custom rules
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openDiscountModal(agent)}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] rounded-lg transition cursor-pointer flex items-center gap-1 shrink-0 shadow-xs"
                    title="Change hotel discount for this agent"
                  >
                    <Edit2 className="w-3 h-3" />
                    Discounts
                  </button>
                </div>
              </div>

              {/* Action Footer */}
              <div className="bg-slate-50 p-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onViewLedgerForAgent(agent.id)}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1"
                    title="View B2B Ledger for this agent"
                  >
                    <Wallet className="w-3 h-3 text-amber-600" />
                    Ledger
                  </button>

                  <button
                    onClick={() => onCreateVoucherForAgent(agent.id)}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1"
                    title="Create voucher for this agent"
                  >
                    <FileText className="w-3 h-3 text-blue-600" />
                    Voucher
                  </button>
                </div>

                <button
                  onClick={() => onLoginAsAgent(agent.id)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                  title="Switch session to this agent view"
                >
                  <LogIn className="w-3.5 h-3.5 text-amber-400" />
                  Login as Agent
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: CREATE NEW SUB-AGENT ACCOUNT */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 my-8">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-6 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">Register New Sub-Agent Account</h3>
                  <p className="text-xs text-slate-400">
                    Create travel agency profile & credentials for independent portal access
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-xs">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium">
                  {errorMessage}
                </div>
              )}

              {/* Agency Details */}
              <div className="space-y-3">
                <div className="font-bold text-slate-900 text-sm pb-1 border-b border-slate-200 flex items-center gap-2">
                  <Building className="w-4 h-4 text-amber-500" />
                  1. Agency & Contact Information
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">
                      Travel Agency / Company Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => handleCompanyNameChange(e.target.value)}
                      placeholder="e.g. Madinah Karwan Travels"
                      className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-bold block mb-1">
                      Owner / Managing Director Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="e.g. Haji Muhammad Aslam"
                      className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">
                      City <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Rawalpindi, Multan, Lahore, Islamabad"
                      className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-bold block mb-1">
                      WhatsApp Number (with country code) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="+92 300 1234567"
                      className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="info@agency.pk"
                      className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Office Address</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. Shop 4, Al-Madina Plaza, Saddar"
                      className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Login Credentials Setup */}
              <div className="space-y-3 pt-2">
                <div className="font-bold text-slate-900 text-sm pb-1 border-b border-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-500" />
                    2. Login Access & Security
                  </span>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[11px] text-amber-600 hover:text-amber-700 font-semibold cursor-pointer"
                  >
                    Generate Random Password
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">
                      Login Username <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                      placeholder="e.g. madina"
                      className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Sub-agent will use this to sign into the portal
                    </span>
                  </div>

                  <div>
                    <label className="text-slate-700 font-bold block mb-1">
                      Login Password <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono font-bold text-slate-900"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Can be viewed and shared via WhatsApp anytime
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial & Credit Limits */}
              <div className="space-y-3 pt-2">
                <div className="font-bold text-slate-900 text-sm pb-1 border-b border-slate-200 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-500" />
                  3. B2B Credit Limit & Opening Balance
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">
                      Assigned Credit Limit (PKR)
                    </label>
                    <input
                      type="number"
                      value={creditLimitPKR}
                      onChange={(e) => setCreditLimitPKR(Number(e.target.value))}
                      placeholder="2000000"
                      className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-bold block mb-1">
                      Opening Balance (PKR)
                    </label>
                    <input
                      type="number"
                      value={openingBalancePKR}
                      onChange={(e) => setOpeningBalancePKR(Number(e.target.value))}
                      placeholder="0"
                      className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Positive = Advance deposit by agent, 0 = Clean slate
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-semibold hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-md transition cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  Create Sub-Agent Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL: CONFIGURE AGENT HOTEL DISCOUNTS & CUSTOM RATES (ADMIN ONLY) */}
      {discountAgent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 my-6">
            {/* Header */}
            <div className="bg-slate-900 text-white p-6 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">
                    Hotel Discounts: {discountAgent.companyName}
                  </h3>
                  <p className="text-xs text-slate-400">
                    City: {discountAgent.city} • Admin control for agent-specific B2B hotel pricing
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDiscountAgent(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDiscounts} className="p-6 space-y-5 text-xs">
              {/* 1. General Hotel Discount */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  <Percent className="w-4 h-4 text-amber-600" />
                  1. General Discount Across All Hotels (Per Room / Night)
                </div>
                <p className="text-[11px] text-slate-500">
                  This discount is automatically subtracted from standard hotel B2B rates when generating vouchers for {discountAgent.companyName}.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">
                      Flat Discount Per Night (SAR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 font-bold text-slate-400 text-xs">SAR</span>
                      <input
                        type="number"
                        min="0"
                        value={defaultDiscountSAR}
                        onChange={(e) => setDefaultDiscountSAR(Number(e.target.value))}
                        placeholder="e.g. 20"
                        className="w-full pl-12 pr-3 py-2 border border-slate-300 rounded-xl bg-white font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      e.g. 20 means agent gets 20 SAR off per room/night
                    </span>
                  </div>

                  <div>
                    <label className="text-slate-700 font-bold block mb-1">
                      OR Percentage Discount (%)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 font-bold text-slate-400 text-xs">%</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={defaultDiscountPercent}
                        onChange={(e) => setDefaultDiscountPercent(Number(e.target.value))}
                        placeholder="e.g. 5"
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl bg-white font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      e.g. 5 means 5% discount on hotel total
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Specific Hotel Discounts / Custom Rates */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="font-bold text-slate-900 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-emerald-600" />
                    <span>2. Hotel-Specific Discounts & Custom Contract Rates</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    {customDiscounts.length} Rules Configured
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Override standard pricing for specific hotels (e.g. special promo rate for Clock Tower or Anwar Movenpick).
                </p>

                {/* Existing Rules Table */}
                {customDiscounts.length > 0 && (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold text-[10px] uppercase border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Hotel Name</th>
                          <th className="p-2.5">City</th>
                          <th className="p-2.5 text-right">Discount / Rate</th>
                          <th className="p-2.5">Note</th>
                          <th className="p-2.5 text-center w-12">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {customDiscounts.map((rule) => (
                          <tr key={rule.id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-900">{rule.hotelName}</td>
                            <td className="p-2.5 text-slate-600">{rule.city || 'Makkah'}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                              {rule.customRateSAR ? (
                                <span>Fixed SAR {rule.customRateSAR}/nt</span>
                              ) : rule.discountSAR ? (
                                <span>-SAR {rule.discountSAR}/nt</span>
                              ) : (
                                <span>-</span>
                              )}
                            </td>
                            <td className="p-2.5 text-slate-500 text-[11px]">{rule.notes || '-'}</td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveCustomRule(rule.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                                title="Remove rule"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Add New Custom Hotel Rule Box */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-bold text-[11px] text-slate-800 block">
                    + Add Specific Hotel Discount Rule:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        placeholder="Hotel Name (e.g. Swissotel Al Maqam)"
                        value={newRuleHotelName}
                        onChange={(e) => setNewRuleHotelName(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 font-semibold"
                        list="hotel-suggestions"
                      />
                      <datalist id="hotel-suggestions">
                        {hotelRates.map((h) => (
                          <option key={h.id} value={h.hotelName} />
                        ))}
                        <option value="Swissotel Al Maqam Clock Tower" />
                        <option value="Pullman Zamzam Makkah" />
                        <option value="Anwar Al Madinah Movenpick" />
                        <option value="Al Aqeeq Golden Tulip" />
                        <option value="Dar Al Taqwa Madinah" />
                      </datalist>
                    </div>

                    <div className="sm:col-span-3">
                      <select
                        value={newRuleCity}
                        onChange={(e) => setNewRuleCity(e.target.value as any)}
                        className="w-full border border-slate-300 rounded-lg p-2"
                      >
                        <option value="Makkah">Makkah</option>
                        <option value="Medinah">Medinah</option>
                        <option value="Jeddah">Jeddah</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        placeholder="Disc SAR"
                        value={newRuleDiscountSAR || ''}
                        onChange={(e) => setNewRuleDiscountSAR(Number(e.target.value))}
                        className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                        title="Discount SAR per night"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <button
                        type="button"
                        onClick={handleAddCustomRule}
                        disabled={!newRuleHotelName.trim()}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-bold rounded-lg transition cursor-pointer text-xs"
                      >
                        Add Rule
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setDiscountAgent(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-semibold hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md transition cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  Save Agent Discounts
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
