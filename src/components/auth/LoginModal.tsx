import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User,
  Phone,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Loader2,
  X,
  Server,
  Cloud,
  Laptop
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  canClose?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, canClose = false }) => {
  const { login, register, keepAliveInfo } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loginIdentifier, setLoginIdentifier] = useState(() => {
    try {
      return localStorage.getItem('pfms_current_user_id_v2') === 'usr_admin_default' ? 'admin' : (localStorage.getItem('pfms_saved_login_id') || 'admin');
    } catch {
      return 'admin';
    }
  });
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      if (isRegisterMode) {
        if (!email.trim() || !username.trim() || !fullName.trim() || !password) {
          setErrorMsg("Barcha majburiy maydonlarni to'ldiring.");
          setIsLoading(false);
          return;
        }

        // Clean validation
        const cleanUsername = username.trim().toLowerCase();
        if (cleanUsername.length < 3) {
          setErrorMsg("Login (username) kamida 3 ta belgidan iborat bo'lishi kerak.");
          setIsLoading(false);
          return;
        }

        const res = await register(email, fullName, password, cleanUsername, phone);
        if (!res.success) {
          setErrorMsg(res.message || "Ro'yxatdan o'tishda xatolik.");
        }
      } else {
        const res = await login(loginIdentifier, password);
        if (!res.success) {
          setErrorMsg(res.message || "Kirishda xatolik yuz berdi.");
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Tizimga ulanishda xatolik.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemoAdmin = () => {
    setLoginIdentifier('admin');
    setPassword('admin123');
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative max-h-[90vh] overflow-y-auto custom-scrollbar">
        {canClose && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Banner Header */}
        <div className="bg-gradient-to-br from-[#0e6837] via-[#107c41] to-[#0c5c30] p-6 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <img
            src="/moliya_maks_logo.jpg"
            alt="Moliya Maks"
            className="w-16 h-16 rounded-2xl mx-auto mb-3 object-cover border-2 border-emerald-300/60 shadow-lg"
            referrerPolicy="no-referrer"
          />
          <h2 className="text-lg font-bold text-white">
            {isRegisterMode ? "Moliya Maks — Yangi Admin Ro'yxati" : "Moliya Maks — Tizimga Kirish"}
          </h2>
          <p className="text-[11px] text-emerald-100 mt-1">
            Moliya Maks Shaxsiy & Biznes Boshqaruv Tizimi (Neon.tech & Render)
          </p>

          {/* Keep-Alive Status Badge */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-black/25 backdrop-blur-xs rounded-full text-[10px] text-emerald-200 font-medium">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span>2 daqiqalik Anti-Sleep uyg'oq tizim: Faol</span>
          </div>
        </div>

        {/* Form Container */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isRegisterMode ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    To'liq Ism Familiya *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Sardor Karimov"
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Unikal Login (Username) *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                        placeholder="sardor_2026"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Telefon
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+998 90 123 45 67"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Unikal Email Manzili *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="sardor@karimov.uz"
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Login yoki Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="admin yoki email@karimov.uz"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Xavfsizlik Paroli *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Cross-Computer Feature Note */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-start gap-2 text-[11px] text-emerald-900">
              <Laptop className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span>
                <strong>Har qanday kompyuterdan kirish:</strong> Login va parolingiz orqali istalgan qurilmadan kirsangiz, barcha daromad, xarajat va hisobotlaringiz avtomatik sinxronlanadi.
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-[#107c41] hover:bg-[#0e6837] active:bg-[#0c5c30] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{isRegisterMode ? "Unikal Ro'yxatdan O'tish" : "Tizimga Kirish"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Pill */}
          {!isRegisterMode && (
            <div className="mt-4 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500">Standart Admin: </span>
                <span className="font-mono font-bold text-slate-800">admin / admin123</span>
              </div>
              <button
                type="button"
                onClick={handleFillDemoAdmin}
                className="px-2.5 py-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-bold rounded-lg transition-colors text-[11px]"
              >
                To'ldirish
              </button>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="mt-4 text-center text-xs text-slate-500">
            {isRegisterMode ? (
              <span>
                Akkauntingiz bormi?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(false);
                    setErrorMsg(null);
                  }}
                  className="font-bold text-emerald-700 hover:text-emerald-900 underline"
                >
                  Kirish
                </button>
              </span>
            ) : (
              <span>
                Yangi akkaunt kerakmi?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(true);
                    setErrorMsg(null);
                  }}
                  className="font-bold text-emerald-700 hover:text-emerald-900 underline"
                >
                  Yangi Admin yaratish (Unikal login)
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

