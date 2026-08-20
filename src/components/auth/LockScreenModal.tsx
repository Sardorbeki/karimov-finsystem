import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, KeyRound, ArrowRight, ShieldCheck, LogOut, AlertCircle } from 'lucide-react';

export const LockScreenModal: React.FC = () => {
  const { currentUser, isLocked, unlockScreen, logout } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isLocked) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Iltimos, parolni kiriting');
      return;
    }

    const success = unlockScreen(password);
    if (success) {
      setPassword('');
      setError(null);
    } else {
      setError("Noto'g'ri parol kiritildi!");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-7 animate-in zoom-in-95 text-center">
        {/* Lock Icon Badge */}
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-amber-100 shadow-xs">
          <Lock className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-black text-slate-900">
          Tizim Blokirlandi (Auto-Lock)
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          20 daqiqa harakatsizlik tufayli xavfsizlik maqsadida ekranga qulf o'rnatildi.
        </p>

        {/* User Card */}
        <div className="my-5 p-3.5 bg-slate-50 border border-slate-200/70 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#107c41] text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
            {currentUser.full_name?.charAt(0) || 'U'}
          </div>
          <div className="text-left min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 truncate">{currentUser.full_name}</p>
            <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800">
            Bloklangan
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleUnlock} className="space-y-3">
          <div className="relative text-left">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Qulfni ochish uchun parolni kiriting:
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                autoFocus
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#107c41] focus:bg-white"
              />
            </div>
            {error && (
              <div className="flex items-center gap-1 text-rose-600 text-[11px] mt-1.5 font-bold animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#107c41] hover:bg-[#0e6837] text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <span>Qulfdan Chiqarish</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Logout Option */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center">
          <button
            onClick={logout}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Chiqish (Logout)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
