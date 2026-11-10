import React, { useState } from 'react';
import { UserAccount, B2BAgent } from '../types';
import {
  Lock,
  User,
  ShieldCheck,
  Building,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  PlusCircle,
  X,
  Check,
  MapPin,
  Phone,
} from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: UserAccount) => void;
  users: UserAccount[];
  onRegisterSubAgent?: (newAgent: B2BAgent, newUser: UserAccount) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  users,
  onRegisterSubAgent,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Register Modal State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regCompanyName, setRegCompanyName] = useState('');
  const [regContactName, setRegContactName] = useState('');
  const [regCity, setRegCity] = useState('Lahore');
  const [regWhatsapp, setRegWhatsapp] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedUser = username.trim().toLowerCase();
    const matchedUser = users.find(
      (u) =>
        (u.username.toLowerCase() === trimmedUser ||
          u.companyName.toLowerCase().includes(trimmedUser)) &&
        u.password === password
    );

    if (matchedUser) {
      onLogin(matchedUser);
    } else {
      setErrorMsg('Invalid username or password. Please check your credentials.');
    }
  };


  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    const cleanUsername = regUsername.trim().toLowerCase();
    if (!cleanUsername) {
      setRegError('Username is required.');
      return;
    }

    if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      setRegError(`Username "${cleanUsername}" is already taken.`);
      return;
    }

    if (!regPassword.trim()) {
      setRegError('Password is required.');
      return;
    }

    const newAgentId = `agent-${cleanUsername}-${Date.now().toString().slice(-4)}`;

    const newAgent: B2BAgent = {
      id: newAgentId,
      name: regContactName.trim() || regCompanyName.trim(),
      companyName: regCompanyName.trim(),
      city: regCity.trim(),
      whatsapp: regWhatsapp.trim() || '+92 300 0000000',
      phone: regWhatsapp.trim(),
      email: `${cleanUsername}@travels.pk`,
      username: cleanUsername,
      loginPassword: regPassword.trim(),
      creditLimit: 1500000,
      currentBalance: 0,
      activeVouchersCount: 0,
      status: 'active',
    };

    const newUser: UserAccount = {
      id: `user-${cleanUsername}`,
      username: cleanUsername,
      name: regContactName.trim() || regCompanyName.trim(),
      role: 'agent',
      agentId: newAgentId,
      companyName: regCompanyName.trim(),
      city: regCity.trim(),
      password: regPassword.trim(),
      whatsapp: regWhatsapp.trim(),
    };

    if (onRegisterSubAgent) {
      onRegisterSubAgent(newAgent, newUser);
    }

    setIsRegisterOpen(false);
    // Automatically log in as the newly created sub-agent!
    onLogin(newUser);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-amber-500/20 selection:text-amber-300 font-sans">
      {/* Background ambient pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-slate-950 to-slate-950 pointer-events-none"></div>

      <div className="relative max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <img
              src="/assets/aistudio/WhatsApp_Image_2026-09-19_at_6.05.56_PM_e36ed21d.jpeg"
              alt="Ameer Hamza Travels & Tours"
              className="h-16 object-contain bg-white rounded-xl p-1.5 shadow-md"
            />
          </div>
          <div>
            <h1 className="text-xl font-black text-white font-serif tracking-tight">
              Ameer Hamza Travels & Tours
            </h1>
            <p className="text-xs text-amber-400 font-bold uppercase tracking-wider mt-0.5">
              B2B Umrah CRM & Voucher Portal
            </p>
          </div>
          <p className="text-[11px] text-slate-400">
            Sign in with your authorized Admin or Sub-Agent account
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="text-slate-300 font-bold block mb-1">Username / Login ID</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin or alquds"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-bold block mb-1">Password</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-white cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2 text-xs"
          >
            Sign In to Portal
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Register New Sub-Agent Button */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => setIsRegisterOpen(true)}
            className="inline-flex items-center gap-2 text-xs text-amber-400 hover:text-amber-300 font-bold bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-4 py-2 rounded-xl transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            New Agency? Register Sub-Agent Account
          </button>
        </div>
        {/* Security Notice */}
        <div className="pt-4 border-t border-slate-800 text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400">
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            <span>Strictly Confidential B2B Operations Portal</span>
          </div>
          <p className="text-[10px] text-slate-500">
            Ameer Hamza Travels & Tours • Multan / Lahore / Karachi • Authorized Personnel Only
          </p>
        </div>
      </div>

      {/* QUICK REGISTRATION MODAL */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-sm text-white">Register Sub-Agent Agency</h3>
              </div>
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {regError && (
              <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs rounded-xl">
                {regError}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Agency / Travel Co Name *</label>
                <input
                  type="text"
                  required
                  value={regCompanyName}
                  onChange={(e) => {
                    setRegCompanyName(e.target.value);
                    if (!regUsername) {
                      const slug = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
                      setRegUsername(slug);
                      setRegPassword(`${slug}123`);
                    }
                  }}
                  placeholder="e.g. Madinah Karwan Travels"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Contact Person *</label>
                  <input
                    type="text"
                    required
                    value={regContactName}
                    onChange={(e) => setRegContactName(e.target.value)}
                    placeholder="Mian Aslam"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    placeholder="Rawalpindi"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">WhatsApp Number *</label>
                <input
                  type="text"
                  required
                  value={regWhatsapp}
                  onChange={(e) => setRegWhatsapp(e.target.value)}
                  placeholder="+92 300 1234567"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Desired Username *</label>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    placeholder="madinah"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Password *</label>
                  <input
                    type="text"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  Create & Login
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
