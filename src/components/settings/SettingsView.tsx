import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { Currency } from '../../types';
import {
  Settings,
  User,
  Bell,
  Coins,
  Check,
  Users
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { currentUser, updateProfile, switchUser, allUsers } = useAuth();
  const { settings, updateSettings } = useFinance();

  const [fullName, setFullName] = useState(currentUser.full_name || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [currency, setCurrency] = useState<Currency>(settings.currency || 'UZS');
  const [budgetThreshold, setBudgetThreshold] = useState(
    (settings.budget_alert_threshold || 80).toString()
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(settings.notifications_enabled);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      full_name: fullName.trim(),
      email: email.trim(),
      currency
    });

    updateSettings({
      currency,
      budget_alert_threshold: parseInt(budgetThreshold, 10) || 80,
      notifications_enabled: notificationsEnabled
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-3 bg-slate-100 text-slate-800 rounded-2xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Tizim & Profil Sozlamalari</h2>
            <p className="text-xs text-slate-500">
              Shaxsiy ma'lumotlar, valyuta formatlari va avtomatik ogohlantirish parametrlari
            </p>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Barcha sozlamalar muvaffaqiyatli saqlandi!</span>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Profile Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600" />
            Shaxsiy Profil Ma'lumotlari
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                F.I.Sh (To'liq Ism)
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Elektron Pochta
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Currency & Financial Preferences */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Coins className="w-4 h-4 text-emerald-600" />
            Valyuta & Buxgalteriya Formatlari
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Asosiy Valyuta
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="UZS">UZS — O'zbekiston So'mi (so'm)</option>
                <option value="USD">USD — AQSH Dollari ($)</option>
                <option value="EUR">EUR — Yevro (€)</option>
                <option value="RUB">RUB — Rossiya Rubli (₽)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Alerts & Notifications */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-600" />
            Avtomatik Moliyaviy Bildirishnomalar
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/70">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Tizim Bildirishnomalari</h4>
                <p className="text-[11px] text-slate-500">
                  Muddati o'tgan qarzlar va byudjet ogohlantirishlarini yoqish
                </p>
              </div>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded-md focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/70">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Byudjet Chegarasi Bo'yicha Ogohlantirish</h4>
                <p className="text-[11px] text-slate-500">
                  Oylik byudjet sarfi foizdan oshganda bildirishnoma yuborish
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={budgetThreshold}
                  onChange={(e) => setBudgetThreshold(e.target.value)}
                  className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 text-center"
                />
                <span className="text-xs font-semibold text-slate-600">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-user Switcher (for multi-tenant isolation demo) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600" />
            Foydalanuvchilar Izolyatsiyasi (Multi-User Switcher)
          </h3>
          <p className="text-xs text-slate-500">
            Har bir foydalanuvchi ma'lumotlari to'liq alohida saqlanadi va xavfsiz himoyalangan.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allUsers.map((u) => {
              const isCurrent = u.id === currentUser.id;
              return (
                <div
                  key={u.id}
                  onClick={() => !isCurrent && switchUser(u.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    isCurrent
                      ? 'border-[#107c41] bg-emerald-50/50 ring-2 ring-[#107c41]/20'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#107c41] text-white font-bold flex items-center justify-center text-xs">
                      {u.full_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{u.full_name}</p>
                      <p className="text-[10px] text-slate-500">@{u.username || 'admin'} • {u.email}</p>
                    </div>
                  </div>

                  {isCurrent ? (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#107c41] text-white">
                      Faol
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-[#107c41] hover:underline">
                      O'tish
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Neon.tech & Render.com Anti-Sleep Cloud Engine Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-6 rounded-3xl text-white border border-slate-700 shadow-md">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#107c41] flex items-center justify-center text-white font-bold">
                ⚡
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Neon.tech (PostgreSQL) & Render.com 24/7 Uyg'oq Tizim</h3>
                <p className="text-[11px] text-emerald-200/80">
                  5 daqiqada uxlab qolish (cold-start) muammosiga qarshi avtomatik 2 daqiqalik Anti-Sleep yurak urishi (Heartbeat)
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold">
              🟢 Faol (120s puls)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-950/40 p-3.5 rounded-2xl border border-white/10">
            <div>
              <p className="text-slate-400 text-[10px]">Ma'lumotlar Bazasi:</p>
              <p className="font-bold text-white mt-0.5">Neon.tech Cloud PostgreSQL</p>
            </div>
            <div>
              <p className="text-slate-400 text-[10px]">Server & Hosting:</p>
              <p className="font-bold text-white mt-0.5">Render.com Node.js Server</p>
            </div>
            <div>
              <p className="text-slate-400 text-[10px]">Anti-Sleep Strategiyasi:</p>
              <p className="font-bold text-emerald-300 mt-0.5">Har 2 daqiqada SQL & Web Puls</p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-[#107c41] hover:bg-[#0e6837] active:bg-[#0c5c30] text-white text-xs font-bold rounded-xl shadow-md transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Barcha Sozlamalarni Saqlash</span>
          </button>
        </div>
      </form>
    </div>
  );
};
