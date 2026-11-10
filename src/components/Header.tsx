import React from 'react';
import { UserRole, B2BAgent, UserAccount } from '../types';
import {
  FileText,
  PlusCircle,
  FileSpreadsheet,
  Wallet,
  Settings,
  ShieldCheck,
  Building,
  LogOut,
  Users,
} from 'lucide-react';

interface HeaderProps {
  currentTab: 'vouchers' | 'create' | 'import' | 'ledgers' | 'rates' | 'subagents';
  onTabChange: (tab: 'vouchers' | 'create' | 'import' | 'ledgers' | 'rates' | 'subagents') => void;
  userRole: UserRole;
  currentUser: UserAccount;
  onLogout: () => void;
  agents: B2BAgent[];
  currentAgent: B2BAgent;
  onAgentChange: (agentId: string) => void;
  pendingApprovalsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  userRole,
  currentUser,
  onLogout,
  agents,
  currentAgent,
  onAgentChange,
  pendingApprovalsCount,
}) => {
  const isAdmin = userRole === 'admin' || userRole === 'staff';

  return (
    <header className="no-print bg-slate-950 text-white border-b border-slate-800 sticky top-0 z-40 shadow-xl">
      {/* Upper Brand & User Account Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80">
        {/* Brand identity & Logo */}
        <div className="flex items-center gap-3">
          <img
            src="/assets/aistudio/WhatsApp_Image_2026-09-19_at_6.05.56_PM_e36ed21d.jpeg"
            alt="Ameer Hamza Travels & Tours"
            className="h-11 object-contain bg-white/95 rounded-lg p-1 shadow-xs"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-black text-lg tracking-tight text-white">
                AMEER HAMZA
              </span>
              <span className="text-amber-400 font-extrabold text-sm uppercase tracking-wider">
                Travels & Tours
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              B2B Umrah CRM & Hotel Voucher Management Platform
            </div>
          </div>
        </div>

        {/* User Account & Session Controls */}
        <div className="flex items-center gap-3">
          {/* User Profile Pill */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
              isAdmin ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}>
              {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <Building className="w-4 h-4" />}
            </div>
            <div>
              <div className="font-bold text-white leading-tight">{currentUser.name}</div>
              <div className="text-[10px] text-slate-400 truncate max-w-[160px]">
                {currentUser.companyName}
              </div>
            </div>
          </div>



          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-800 hover:border-rose-800/60 text-xs font-semibold transition cursor-pointer"
            title="Log out of account"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between overflow-x-auto">
        <nav className="flex space-x-1 py-2 text-xs font-semibold">
          <button
            onClick={() => onTabChange('vouchers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition cursor-pointer ${
              currentTab === 'vouchers'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            Vouchers
            {pendingApprovalsCount > 0 && isAdmin && (
              <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {pendingApprovalsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('create')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition cursor-pointer ${
              currentTab === 'create'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Create Voucher (6+ Sectors)
          </button>

          <button
            onClick={() => onTabChange('import')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition cursor-pointer ${
              currentTab === 'import'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Import Excel / Nusuk
          </button>

          <button
            onClick={() => onTabChange('ledgers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition cursor-pointer ${
              currentTab === 'ledgers'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Wallet className="w-4 h-4" />
            B2B Ledgers & Accounts
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() => onTabChange('subagents')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition cursor-pointer ${
                  currentTab === 'subagents'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                Sub-Agents & Logins
              </button>

              <button
                onClick={() => onTabChange('rates')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition cursor-pointer ${
                  currentTab === 'rates'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4" />
                CRM Rates Master
              </button>
            </>
          )}
        </nav>

        {/* Security / Server status */}
        <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Ameer Hamza Central Server Active</span>
        </div>
      </div>
    </header>
  );
};
