import React, { useState, useEffect } from 'react';
import {
  Voucher,
  B2BAgent,
  UserRole,
  UserAccount,
  HotelRate,
  VisaRate,
  TransportRate,
  VisaCompany,
  PilgrimGroup,
  LedgerEntry,
  GroundContact,
} from './types';
import {
  INITIAL_USERS,
  INITIAL_AGENTS,
  INITIAL_VISA_COMPANIES,
  INITIAL_PILGRIM_GROUPS,
  INITIAL_VOUCHERS,
  INITIAL_HOTEL_RATES,
  INITIAL_VISA_RATES,
  INITIAL_TRANSPORT_RATES,
  INITIAL_LEDGERS,
  DEFAULT_GROUND_CONTACTS,
} from './data/initialData';
import { Header } from './components/Header';
import { VoucherList } from './components/VoucherList';
import { VoucherDocument } from './components/VoucherDocument';
import { VoucherCreator } from './components/VoucherCreator';
import { B2BLedgerView } from './components/B2BLedgerView';
import { RatesMasterView } from './components/RatesMasterView';
import { ImportPilgrimsView } from './components/ImportPilgrimsView';
import { QRVerificationModal } from './components/QRVerificationModal';
import { LoginScreen } from './components/LoginScreen';
import { PublicVoucherView } from './components/PublicVoucherView';
import { SubAgentsManagerView } from './components/SubAgentsManagerView';

export default function App() {
  // 1. Direct Public QR Verification Route (Strictly isolated view, no CRM access)
  const [publicVoucherNo, setPublicVoucherNo] = useState<string | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('voucher') || params.get('v') || params.get('verify') || null;
    } catch {
      return null;
    }
  });

  // 2. Users and Credentials State
  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem('ah_users_list');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_USERS;
  });

  // 3. Authentication & Session State - STRICT LOGIN REQUIRED UPON OPENING LINK
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      // Clear legacy localStorage auto-session to enforce mandatory login screen
      localStorage.removeItem('ah_session_user');
      const saved = sessionStorage.getItem('ah_session_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    // Must NOT auto-login. Always prompt for login credentials when visiting the app.
    return null;
  });

  // Operational State
  const [agents, setAgents] = useState<B2BAgent[]>(() => {
    try {
      const saved = localStorage.getItem('ah_agents_list');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_AGENTS;
  });

  const [selectedAgentId, setSelectedAgentId] = useState<string>(() => {
    return currentUser?.agentId || 'agent-alquds';
  });
  const [visaCompanies, setVisaCompanies] = useState<VisaCompany[]>(INITIAL_VISA_COMPANIES);
  const [groups, setGroups] = useState<PilgrimGroup[]>(INITIAL_PILGRIM_GROUPS);
  const [vouchers, setVouchers] = useState<Voucher[]>(() => {
    try {
      const saved = localStorage.getItem('ah_vouchers');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_VOUCHERS;
  });
  const [hotelRates, setHotelRates] = useState<HotelRate[]>(() => {
    try {
      const saved = localStorage.getItem('ah_hotel_rates');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_HOTEL_RATES;
  });
  const [visaRates, setVisaRates] = useState<VisaRate[]>(() => {
    try {
      const saved = localStorage.getItem('ah_visa_rates');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_VISA_RATES;
  });
  const [transportRates, setTransportRates] = useState<TransportRate[]>(() => {
    try {
      const saved = localStorage.getItem('ah_transport_rates');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_TRANSPORT_RATES;
  });
  const [ledgers, setLedgers] = useState<LedgerEntry[]>(INITIAL_LEDGERS);
  const [defaultGroundContacts, setDefaultGroundContacts] = useState<GroundContact[]>(() => {
    try {
      const saved = localStorage.getItem('ah_ground_contacts');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_GROUND_CONTACTS;
  });

  // Active CRM View
  const [currentTab, setCurrentTab] = useState<'vouchers' | 'create' | 'import' | 'ledgers' | 'rates' | 'subagents'>('vouchers');
  const [viewingVoucher, setViewingVoucher] = useState<Voucher | null>(null);
  const [verifyingVoucher, setVerifyingVoucher] = useState<Voucher | null>(null);
  const [prefilledGroupForVoucher, setPrefilledGroupForVoucher] = useState<PilgrimGroup | null>(null);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);

  // Sync selectedAgentId when currentUser changes
  useEffect(() => {
    if (currentUser?.agentId) {
      setSelectedAgentId(currentUser.agentId);
    }
  }, [currentUser]);

  // Handle Login
  const handleLogin = (user: UserAccount) => {
    setCurrentUser(user);
    try {
      sessionStorage.setItem('ah_session_user', JSON.stringify(user));
    } catch {}
    if (user.agentId) {
      setSelectedAgentId(user.agentId);
    }
    // Reset view
    setViewingVoucher(null);
    setCurrentTab('vouchers');
  };

  // Handle Logout
  const handleLogout = () => {
    try {
      sessionStorage.removeItem('ah_session_user');
      localStorage.removeItem('ah_session_user');
    } catch {}
    setCurrentUser(null);
    setViewingVoucher(null);
  };

  // Create Sub-Agent Account (from Admin Portal or Registration)
  const handleCreateSubAgent = (
    newAgent: B2BAgent,
    newUser: UserAccount,
    openingBalancePKR?: number
  ) => {
    const updatedAgents = [newAgent, ...agents];
    setAgents(updatedAgents);
    try {
      localStorage.setItem('ah_agents_list', JSON.stringify(updatedAgents));
    } catch {}

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    try {
      localStorage.setItem('ah_users_list', JSON.stringify(updatedUsers));
    } catch {}

    // If opening balance is specified, create ledger record
    if (openingBalancePKR && openingBalancePKR !== 0) {
      const openingEntry: LedgerEntry = {
        id: 'led-open-' + Date.now(),
        agentId: newAgent.id,
        date: new Date().toISOString().split('T')[0],
        refNo: 'OPEN-BAL',
        type: openingBalancePKR > 0 ? 'CREDIT' : 'DEBIT',
        description: `Opening Balance Account Initialization (${newAgent.companyName})`,
        amountPKR: Math.abs(openingBalancePKR),
        runningBalancePKR: openingBalancePKR,
      };
      setLedgers((prev) => [...prev, openingEntry]);
    }
  };

  // Update existing Sub-Agent
  const handleUpdateSubAgent = (updatedAgent: B2BAgent, updatedPassword?: string) => {
    const updatedAgents = agents.map((a) => (a.id === updatedAgent.id ? updatedAgent : a));
    setAgents(updatedAgents);
    try {
      localStorage.setItem('ah_agents_list', JSON.stringify(updatedAgents));
    } catch {}

    if (updatedPassword) {
      const updatedUsers = users.map((u) =>
        u.agentId === updatedAgent.id ? { ...u, password: updatedPassword } : u
      );
      setUsers(updatedUsers);
      try {
        localStorage.setItem('ah_users_list', JSON.stringify(updatedUsers));
      } catch {}
    }
  };

  // Switch session into agent perspective
  const handleLoginAsAgent = (agentId: string) => {
    const targetUser = users.find((u) => u.agentId === agentId);
    if (targetUser) {
      handleLogin(targetUser);
    }
  };

  // Switch to Create Voucher for a specific agent
  const handleCreateVoucherForAgent = (agentId: string) => {
    setSelectedAgentId(agentId);
    setPrefilledGroupForVoucher(null);
    setEditingVoucher(null);
    setCurrentTab('create');
  };

  // Switch to Ledger view for a specific agent
  const handleViewLedgerForAgent = (agentId: string) => {
    setSelectedAgentId(agentId);
    setCurrentTab('ledgers');
  };

  // 1. PUBLIC QR SCAN CHECK - If accessed via QR scan link, render ONLY the public voucher view
  if (publicVoucherNo) {
    const cleanNo = publicVoucherNo.trim().toLowerCase();
    const foundVoucher =
      vouchers.find(
        (v) =>
          v.voucherNo.toLowerCase() === cleanNo ||
          v.voucherNo.toLowerCase() === `hv-${cleanNo}` ||
          v.id.toLowerCase() === cleanNo
      ) || vouchers[0];

    return (
      <div className="min-h-screen bg-slate-900">
        <PublicVoucherView voucher={foundVoucher} />
      </div>
    );
  }

  // 2. AUTHENTICATION GATE - If not logged in, show Login Screen with distinct Admin & Sub-Agent credentials
  if (!currentUser) {
    return (
      <LoginScreen
        users={users}
        onLogin={handleLogin}
        onRegisterSubAgent={handleCreateSubAgent}
      />
    );
  }

  const userRole: UserRole = currentUser.role;
  const isAgent = userRole === 'agent';
  const effectiveAgentId = isAgent && currentUser.agentId ? currentUser.agentId : selectedAgentId;
  const currentAgent = agents.find((a) => a.id === effectiveAgentId) || agents[0];

  // Role-based data isolation: Sub-agents only see their own vouchers, groups, and ledgers
  const visibleVouchers = isAgent && currentUser.agentId
    ? vouchers.filter((v) => v.agentId === currentUser.agentId)
    : vouchers;

  const visibleGroups = isAgent && currentUser.agentId
    ? groups.filter((g) => g.subAgentId === currentUser.agentId)
    : groups;

  const visibleLedgers = isAgent && currentUser.agentId
    ? ledgers.filter((l) => l.agentId === currentUser.agentId)
    : ledgers;

  const pendingApprovalsCount = vouchers.filter(
    (v) => v.status === 'draft' || v.status === 'pending'
  ).length;

  const persistVouchers = (list: Voucher[]) => {
    try {
      localStorage.setItem('ah_vouchers', JSON.stringify(list));
    } catch {}
  };

  // Approve a voucher (Admin only)
  const handleApproveVoucher = (voucherId: string) => {
    setVouchers((prev) => {
      const next = prev.map((v) => {
        if (v.id === voucherId) {
          const updated: Voucher = {
            ...v,
            status: 'approved',
            approvedBy: 'Ameer Hamza Central Operations (Staff Auth ID: AH-901)',
            approvedDate:
              new Date().toLocaleDateString('en-GB') +
              ' ' +
              new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) +
              ' PKT',
            financials: {
              ...v.financials,
              ledgerPosted: true,
            },
          };

          // Post to ledger if not yet posted
          if (!v.financials.ledgerPosted) {
            const costInPKR = Math.round(v.financials.grandTotal * 74);
            const agentLedgerList = ledgers.filter((l) => l.agentId === v.agentId);
            const prevRunning = agentLedgerList[agentLedgerList.length - 1]?.runningBalancePKR || 0;
            const newEntry: LedgerEntry = {
              id: 'led-' + Date.now(),
              agentId: v.agentId,
              date: new Date().toISOString().split('T')[0],
              refNo: 'VCH-' + v.voucherNo,
              type: 'DEBIT',
              description: `Voucher ${v.voucherNo}: ${v.mutamers.length} Mutamers (${v.familyHead})`,
              amountPKR: costInPKR > 0 ? costInPKR : 300000,
              runningBalancePKR: prevRunning - (costInPKR > 0 ? costInPKR : 300000),
            };
            setLedgers((prevLedgers) => [...prevLedgers, newEntry]);
          }

          if (viewingVoucher?.id === voucherId) {
            setViewingVoucher(updated);
          }
          return updated;
        }
        return v;
      });
      persistVouchers(next);
      return next;
    });
  };

  // Reject a voucher
  const handleRejectVoucher = (voucherId: string, reason: string) => {
    setVouchers((prev) => {
      const next = prev.map((v) => {
        if (v.id === voucherId) {
          const updated: Voucher = {
            ...v,
            status: 'rejected',
            rejectionReason: reason,
          };
          if (viewingVoucher?.id === voucherId) {
            setViewingVoucher(updated);
          }
          return updated;
        }
        return v;
      });
      persistVouchers(next);
      return next;
    });
  };

  // Start editing an existing voucher
  const handleStartEditVoucher = (voucher: Voucher) => {
    setViewingVoucher(null);
    setPrefilledGroupForVoucher(null);
    setEditingVoucher(voucher);
    setSelectedAgentId(voucher.agentId);
    setCurrentTab('create');
  };

  // Delete an existing voucher
  const handleDeleteVoucher = (voucherId: string) => {
    const target = vouchers.find((v) => v.id === voucherId);
    const updated = vouchers.filter((v) => v.id !== voucherId);
    setVouchers(updated);
    persistVouchers(updated);

    if (viewingVoucher?.id === voucherId) {
      setViewingVoucher(null);
    }
    if (editingVoucher?.id === voucherId) {
      setEditingVoucher(null);
    }
    if (target?.groupNo) {
      setGroups((prev) =>
        prev.map((g) =>
          g.voucherId === voucherId || g.groupNo === target.groupNo
            ? { ...g, voucherStatus: 'none', voucherId: undefined }
            : g
        )
      );
    }
  };

  // Admin: Change Visa Company on an existing voucher after creation
  const handleChangeVoucherVisaCompany = (voucherId: string, visaCompany: VisaCompany) => {
    setVouchers((prev) => {
      const next = prev.map((v) =>
        v.id === voucherId
          ? {
              ...v,
              visaCompanyId: visaCompany.id,
              visaCompanyName: visaCompany.companyName,
              visaCompanyCity: visaCompany.branchCity,
              visaCompanyWhatsapp: visaCompany.whatsapp,
            }
          : v
      );
      persistVouchers(next);
      return next;
    });

    if (viewingVoucher?.id === voucherId) {
      setViewingVoucher((prev) =>
        prev
          ? {
              ...prev,
              visaCompanyId: visaCompany.id,
              visaCompanyName: visaCompany.companyName,
              visaCompanyCity: visaCompany.branchCity,
              visaCompanyWhatsapp: visaCompany.whatsapp,
            }
          : null
      );
    }
  };

  // Save newly created or updated voucher
  const handleSaveVoucher = (savedVoucher: Voucher) => {
    const exists = vouchers.some((v) => v.id === savedVoucher.id);
    const prevVersion = exists ? vouchers.find((v) => v.id === savedVoucher.id) : undefined;
    const nextVouchers = exists
      ? vouchers.map((v) => (v.id === savedVoucher.id ? savedVoucher : v))
      : [savedVoucher, ...vouchers];

    setVouchers(nextVouchers);
    persistVouchers(nextVouchers);
    setEditingVoucher(null);

    // Update group status if matches groupNo
    if (savedVoucher.groupNo) {
      setGroups((prev) =>
        prev.map((g) =>
          g.groupNo === savedVoucher.groupNo
            ? { ...g, voucherStatus: savedVoucher.status, voucherId: savedVoucher.id }
            : g
        )
      );
    }

    if (
      savedVoucher.status === 'approved' &&
      savedVoucher.financials.ledgerPosted &&
      !prevVersion?.financials?.ledgerPosted
    ) {
      const costInPKR = Math.round(savedVoucher.financials.grandTotal * 74);
      const agentLedgerList = ledgers.filter((l) => l.agentId === savedVoucher.agentId);
      const prevRunning = agentLedgerList[agentLedgerList.length - 1]?.runningBalancePKR || 0;
      const newEntry: LedgerEntry = {
        id: 'led-' + Date.now(),
        agentId: savedVoucher.agentId,
        date: new Date().toISOString().split('T')[0],
        refNo: 'VCH-' + savedVoucher.voucherNo,
        type: 'DEBIT',
        description: `Voucher ${savedVoucher.voucherNo}: ${savedVoucher.mutamers.length} Mutamers (${savedVoucher.familyHead})`,
        amountPKR: costInPKR,
        runningBalancePKR: prevRunning - costInPKR,
      };
      setLedgers((prevLedgers) => [...prevLedgers, newEntry]);
    }

    // Open physical document view
    setViewingVoucher(savedVoucher);
  };

  // Save new imported group
  const handleSaveGroup = (newGroup: PilgrimGroup) => {
    setGroups([newGroup, ...groups]);
  };

  // Create voucher for a specific group
  const handleCreateVoucherForGroup = (group: PilgrimGroup) => {
    setEditingVoucher(null);
    setPrefilledGroupForVoucher(group);
    setSelectedAgentId(group.subAgentId);
    setCurrentTab('create');
  };

  // Add Visa Company
  const handleAddVisaCompany = (company: VisaCompany) => {
    setVisaCompanies([company, ...visaCompanies]);
  };

  // Add ledger entry
  const handleAddLedgerEntry = (entry: LedgerEntry) => {
    setLedgers((prev) => [...prev, entry]);
  };

  // Rates master actions
  const handleAddHotelRate = (rate: HotelRate) => {
    const updated = [rate, ...hotelRates];
    setHotelRates(updated);
    try {
      localStorage.setItem('ah_hotel_rates', JSON.stringify(updated));
    } catch {}
  };
  const handleUpdateHotelRate = (updatedRate: HotelRate) => {
    const updated = hotelRates.map((h) => (h.id === updatedRate.id ? updatedRate : h));
    setHotelRates(updated);
    try {
      localStorage.setItem('ah_hotel_rates', JSON.stringify(updated));
    } catch {}
  };
  const handleDeleteHotelRate = (hotelId: string) => {
    const updated = hotelRates.filter((h) => h.id !== hotelId);
    setHotelRates(updated);
    try {
      localStorage.setItem('ah_hotel_rates', JSON.stringify(updated));
    } catch {}
  };
  const handleAddVisaRate = (rate: VisaRate) => {
    const updated = [rate, ...visaRates];
    setVisaRates(updated);
    try {
      localStorage.setItem('ah_visa_rates', JSON.stringify(updated));
    } catch {}
  };
  const handleUpdateVisaRate = (updatedRate: VisaRate) => {
    const updated = visaRates.map((v) => (v.id === updatedRate.id ? updatedRate : v));
    setVisaRates(updated);
    try {
      localStorage.setItem('ah_visa_rates', JSON.stringify(updated));
    } catch {}
  };
  const handleDeleteVisaRate = (visaId: string) => {
    const updated = visaRates.filter((v) => v.id !== visaId);
    setVisaRates(updated);
    try {
      localStorage.setItem('ah_visa_rates', JSON.stringify(updated));
    } catch {}
  };

  const handleAddTransportRate = (rate: TransportRate) => {
    const updated = [rate, ...transportRates];
    setTransportRates(updated);
    try {
      localStorage.setItem('ah_transport_rates', JSON.stringify(updated));
    } catch {}
  };
  const handleUpdateTransportRate = (updatedRate: TransportRate) => {
    const updated = transportRates.map((t) => (t.id === updatedRate.id ? updatedRate : t));
    setTransportRates(updated);
    try {
      localStorage.setItem('ah_transport_rates', JSON.stringify(updated));
    } catch {}
  };
  const handleDeleteTransportRate = (transportId: string) => {
    const updated = transportRates.filter((t) => t.id !== transportId);
    setTransportRates(updated);
    try {
      localStorage.setItem('ah_transport_rates', JSON.stringify(updated));
    } catch {}
  };

  // Update staff contacts on a specific voucher (from VoucherDocument)
  const handleUpdateVoucherContacts = (voucherId: string, updatedContacts: GroundContact[]) => {
    setVouchers((prev) => {
      const next = prev.map((v) =>
        v.id === voucherId ? { ...v, groundContacts: updatedContacts } : v
      );
      persistVouchers(next);
      return next;
    });
    if (viewingVoucher && viewingVoucher.id === voucherId) {
      setViewingVoucher((prev) => (prev ? { ...prev, groundContacts: updatedContacts } : null));
    }
  };

  // Update global default staff directory (from RatesMasterView)
  const handleUpdateDefaultGroundContacts = (contacts: GroundContact[]) => {
    setDefaultGroundContacts(contacts);
    try {
      localStorage.setItem('ah_ground_contacts', JSON.stringify(contacts));
    } catch {}
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* Top Header Bar */}
      <Header
        currentTab={currentTab}
        onTabChange={(tab) => {
          setViewingVoucher(null);
          if (tab !== 'create') {
            setPrefilledGroupForVoucher(null);
            setEditingVoucher(null);
          }
          setCurrentTab(tab);
        }}
        userRole={userRole}
        currentUser={currentUser}
        onLogout={handleLogout}
        agents={agents}
        currentAgent={currentAgent}
        onAgentChange={setSelectedAgentId}
        pendingApprovalsCount={pendingApprovalsCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {/* If viewing a single voucher document for print or preview */}
        {viewingVoucher ? (
          <VoucherDocument
            voucher={viewingVoucher}
            onBack={() => setViewingVoucher(null)}
            onApprove={handleApproveVoucher}
            onReject={handleRejectVoucher}
            onUpdateContacts={handleUpdateVoucherContacts}
            visaCompanies={visaCompanies}
            onChangeVisaCompany={handleChangeVoucherVisaCompany}
            onEditVoucher={handleStartEditVoucher}
            onDeleteVoucher={handleDeleteVoucher}
            userRole={userRole}
            onVerifyClick={(v) => setVerifyingVoucher(v)}
          />
        ) : (
          <>
            {currentTab === 'vouchers' && (
              <VoucherList
                vouchers={visibleVouchers}
                onSelectVoucher={(v) => setViewingVoucher(v)}
                onCreateNew={() => {
                  setPrefilledGroupForVoucher(null);
                  setEditingVoucher(null);
                  setCurrentTab('create');
                }}
                onApprove={handleApproveVoucher}
                onVerify={(v) => setVerifyingVoucher(v)}
                onEditVoucher={handleStartEditVoucher}
                onDeleteVoucher={handleDeleteVoucher}
                userRole={userRole}
                currentAgent={currentAgent}
              />
            )}

            {currentTab === 'create' && (
              <VoucherCreator
                key={editingVoucher?.id || prefilledGroupForVoucher?.id || 'new-voucher'}
                currentAgent={currentAgent}
                userRole={userRole}
                allAgents={agents}
                visaCompanies={visaCompanies}
                groups={visibleGroups}
                existingVouchers={vouchers}
                hotelRates={hotelRates}
                transportRates={transportRates}
                visaRates={visaRates}
                defaultGroundContacts={defaultGroundContacts}
                prefilledGroup={prefilledGroupForVoucher}
                editingVoucher={editingVoucher}
                onSave={handleSaveVoucher}
                onCancel={() => {
                  setPrefilledGroupForVoucher(null);
                  setEditingVoucher(null);
                  setCurrentTab('vouchers');
                }}
                onOpenImporter={() => setCurrentTab('import')}
              />
            )}

            {currentTab === 'import' && (
              <ImportPilgrimsView
                agents={agents}
                visaCompanies={visaCompanies}
                groups={visibleGroups}
                onSaveGroup={handleSaveGroup}
                onCreateVoucherForGroup={handleCreateVoucherForGroup}
                onAddVisaCompany={handleAddVisaCompany}
              />
            )}

            {currentTab === 'ledgers' && (
              <B2BLedgerView
                agents={agents}
                selectedAgentId={effectiveAgentId}
                onSelectAgent={setSelectedAgentId}
                ledgers={visibleLedgers}
                onAddLedgerEntry={handleAddLedgerEntry}
                userRole={userRole}
              />
            )}

            {currentTab === 'subagents' && (
              <SubAgentsManagerView
                agents={agents}
                users={users}
                hotelRates={hotelRates}
                onAddAgent={handleCreateSubAgent}
                onUpdateAgent={handleUpdateSubAgent}
                onLoginAsAgent={handleLoginAsAgent}
                onCreateVoucherForAgent={handleCreateVoucherForAgent}
                onViewLedgerForAgent={handleViewLedgerForAgent}
              />
            )}

            {currentTab === 'rates' && (
              <RatesMasterView
                hotelRates={hotelRates}
                visaRates={visaRates}
                transportRates={transportRates}
                visaCompanies={visaCompanies}
                groundContacts={defaultGroundContacts}
                onAddHotelRate={handleAddHotelRate}
                onUpdateHotelRate={handleUpdateHotelRate}
                onDeleteHotelRate={handleDeleteHotelRate}
                onAddVisaRate={handleAddVisaRate}
                onUpdateVisaRate={handleUpdateVisaRate}
                onDeleteVisaRate={handleDeleteVisaRate}
                onAddTransportRate={handleAddTransportRate}
                onUpdateTransportRate={handleUpdateTransportRate}
                onDeleteTransportRate={handleDeleteTransportRate}
                onAddVisaCompany={handleAddVisaCompany}
                onUpdateGroundContacts={handleUpdateDefaultGroundContacts}
                userRole={userRole}
              />
            )}
          </>
        )}
      </main>

      {/* Verification Certificate Modal */}
      <QRVerificationModal
        voucher={verifyingVoucher}
        isOpen={Boolean(verifyingVoucher)}
        onClose={() => setVerifyingVoucher(null)}
      />

      {/* Footer (No print) */}
      <footer className="no-print bg-slate-900 border-t border-slate-800 text-slate-400 py-6 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">Ameer Hamza Travels & Tours</span>
            <span>•</span>
            <span>B2B Umrah & Hajj Operations Central Platform</span>
          </div>
          <div>
            KSA Visa Partners: Ziafa International / Bab Al-Umrah / Al-Deafah • Central Operations Multan
          </div>
        </div>
      </footer>
    </div>
  );
}
