import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Shield,
  Lock,
  CheckCircle2,
  AlertCircle,
  Save,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  Layers,
  Calendar,
  Clock,
  LogOut,
  RotateCcw,
  Check,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { AdminRole, Currency, Language } from '../../types';
import { formatCurrency } from '../../lib/formatters';

export const ProfileView: React.FC = () => {
  const { currentUser, updateProfile, changePassword, logout, resetDemoData } = useAuth();
  const { summary, incomes, expenses, debts, auditLogs } = useFinance();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'activity'>('profile');

  // Form states
  const [fullName, setFullName] = useState(currentUser.full_name || '');
  const [username, setUsername] = useState(currentUser.username || 'admin');
  const [email, setEmail] = useState(currentUser.email || '');
  const [phone, setPhone] = useState(currentUser.phone || '+998 90 123 45 67');
  const [role, setRole] = useState<AdminRole>(currentUser.role || 'bosh_admin');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [currency, setCurrency] = useState<Currency>(currentUser.currency || 'UZS');
  const [language, setLanguage] = useState<Language>(currentUser.language || 'uz');

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Status feedback
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!fullName.trim()) {
      setErrorMsg("Ism familiya bo'sh bo'lmasligi kerak.");
      return;
    }

    updateProfile({
      full_name: fullName.trim(),
      username: username.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role,
      bio: bio.trim(),
      currency,
      language
    });

    setSuccessMsg("Admin profili muvaffaqiyatli yangilandi! ✅");
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!currentPassword || !newPassword) {
      setErrorMsg("Barcha parol maydonlarini to'ldiring.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Yangi parollar bir-biriga mos kelmadi.");
      return;
    }

    const res = await changePassword(currentPassword, newPassword);
    if (res.success) {
      setSuccessMsg("Xavfsizlik paroli muvaffaqiyatli yangilandi! ✅");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccessMsg(null), 3500);
    } else {
      setErrorMsg(res.message || "Parolni o'zgartirishda xatolik.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-3xl text-white border border-indigo-900 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-800 border-2 border-indigo-300/40 flex items-center justify-center shadow-lg text-white font-black text-2xl sm:text-3xl tracking-wide shrink-0">
            {currentUser.full_name?.charAt(0)?.toUpperCase() || 'A'}
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black text-white">{currentUser.full_name}</h2>
              <span className="px-3 py-1 text-xs font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 rounded-full">
                {currentUser.role === 'bosh_admin' ? 'Bosh Administrator' : currentUser.role}
              </span>
            </div>
            <p className="text-xs text-indigo-200/80 mt-1 flex items-center gap-2">
              <span>{currentUser.email}</span>
              <span>•</span>
              <span className="font-mono">{currentUser.phone || '+998 90 123 45 67'}</span>
            </p>
            <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Oxirgi kirish: {new Date(currentUser.last_login || currentUser.updated_at).toLocaleString('uz-UZ')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Chiqish (Logout)</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Tabs & Profile Management */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Tabs */}
        <div className="lg:col-span-1 space-y-2">
          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'profile'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Shaxsiy Ma'lumotlar</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'security'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Parol & Xavfsizlik</span>
            </button>

            <button
              onClick={() => setActiveTab('activity')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'activity'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Admin Amallari Tarixi</span>
            </button>
          </div>

          {/* Account Metrics Card */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-800">Admin Nazorati</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                <span className="text-slate-500">Daromadlar soni:</span>
                <span className="font-bold text-slate-800">{incomes.length} ta</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                <span className="text-slate-500">Xarajatlar soni:</span>
                <span className="font-bold text-slate-800">{expenses.length} ta</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                <span className="text-slate-500">Aktiv Qarzlar:</span>
                <span className="font-bold text-slate-800">{debts.filter(d => d.status !== 'paid').length} ta</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content Panels */}
        <div className="lg:col-span-3">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs">
            {errorMsg && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Admin Shaxsiy Ma'lumotlari</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tizimdagi ism, username, aloqa va asosiy hisob sozlamalari
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      To'liq Ism Familiya
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Admin Login (Username)
                    </label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Elektron Pochta (Email)
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Telefon Raqam
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+998 90 123 45 67"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Admin Roli & Vakolati
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as AdminRole)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    >
                      <option value="bosh_admin">Bosh Administrator (To'liq nazorat)</option>
                      <option value="moliya_boshqaruvchisi">Moliya Menejeri</option>
                      <option value="auditor">Auditor (Ko'rish va eksport)</option>
                      <option value="foydalanuvchi">Oddiy Foydalanuvchi</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Standart Valyuta
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as Currency)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    >
                      <option value="UZS">UZS — O'zbekiston so'mi</option>
                      <option value="USD">USD — AQSH dollari</option>
                      <option value="EUR">EUR — Yevro</option>
                      <option value="RUB">RUB — Rossiya rubli</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Bio & Moliyaviy Maqsadlar
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Qisqa eslatma yoki moliyaviy rejangiz..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Saqlash</span>
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'security' && (
              <form onSubmit={handleChangePassword} className="space-y-6 max-w-lg">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Admin Xavfsizlik Paroli</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tizimga kirish uchun maxfiy parolni yangilash
                  </p>
                </div>

                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-xs text-indigo-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>Xavfsizlik Tavsiyasi</span>
                  </div>
                  <p>Murakkab, harf va raqamlardan iborat kamida 6 belgili parol tanlang.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Hozirgi Parol
                    </label>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Hozirgi parolingizni kiriting"
                        className="w-full px-4 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Yangi Parol
                    </label>
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Yangi parol (kamida 4 ta belgi)"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Yangi Parolni Qaytadan Kiriting
                    </label>
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Yangi parolni tasdiqlang"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Parolni Yangilash</span>
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Admin Audit Jurnali</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Oxirgi kiritilgan va o'zgartirilgan operatsiyalar ro'yxati
                  </p>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                  {auditLogs.slice(0, 10).map((log) => (
                    <div key={log.id} className="p-3.5 bg-white hover:bg-slate-50 flex items-center justify-between text-xs transition-colors">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          log.action_type === 'CREATE' ? 'bg-emerald-100 text-emerald-800' :
                          log.action_type === 'UPDATE' ? 'bg-indigo-100 text-indigo-800' :
                          log.action_type === 'DELETE' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {log.action_type}
                        </span>
                        <div>
                          <p className="font-bold text-slate-800">{log.summary}</p>
                          {log.details && <p className="text-[11px] text-slate-500">{log.details}</p>}
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-400 shrink-0 font-medium">
                        {new Date(log.created_at).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
