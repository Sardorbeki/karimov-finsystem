import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Download,
  CheckCircle2,
  X,
  Sparkles,
  Terminal,
  ShieldCheck,
  Zap,
  ArrowRight,
  ExternalLink,
  Laptop,
  Layers
} from 'lucide-react';

interface DesktopInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DesktopInstallModal: React.FC<DesktopInstallModalProps> = ({
  isOpen,
  onClose
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    // Listen for PWA desktop install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already in standalone app mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallSuccess(true);
        setDeferredPrompt(null);
      }
    } else {
      // Fallback instruction
      alert(
        "Windows tizimiga o'rnatish uchun:\n1. Brauzeringizning manzil qatori (URL) o'ng tomonidagi 'O'rnatish' (Install App ⊕) belgisini bosing;\n2. Yoki brauzer menyusidan 'Ilovani o'rnatish' (Install as App) tugmasini tanlang."
      );
    }
  };

  // Generate Windows .BAT Launcher file that opens the app in native window (frameless app mode)
  const handleDownloadWindowsLauncher = () => {
    const appUrl = window.location.href;
    const batContent = `@echo off
:: ========================================================
:: Moliya Maks - Windows Native Desktop Launcher
:: 64-Bit Architecture Ready
:: ========================================================
title Moliya Maks Desktop
cls
echo -------------------------------------------------------
echo   Moliya Maks - Windows Desktop Ilovasi
echo   Xavfsiz ulanish va server sinxronizatsiyasi...
echo -------------------------------------------------------

:: Try launching in Edge App Mode (Default on all Windows 10/11)
start msedge.exe --app="${appUrl}" --window-size=1366,850

:: If Edge is not found, fallback to Chrome
if %ERRORLEVEL% NEQ 0 (
  start chrome.exe --app="${appUrl}" --window-size=1366,850
)

exit
`;

    const blob = new Blob([batContent], { type: 'application/x-bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Moliya_Maks_Launcher.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 md:p-7 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <img
              src="/moliya_maks_logo.jpg"
              alt="Moliya Maks"
              className="w-12 h-12 rounded-2xl object-cover border border-emerald-500/30 shadow-md"
              referrerPolicy="no-referrer"
            />
            <div>
              <h3 className="font-bold text-slate-900 text-lg">
                Moliya Maks — Desktop Ilovani O'rnatish
              </h3>
              <p className="text-xs text-slate-500">
                Brauzersiz, alohida mustaqil Windows ilovasi sifatida ish stoliga o'rnatish
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {installSuccess && (
          <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              Ilova Windows tizimingizga muvaffaqiyatli o'rnatildi! Endi Ish stoli (Desktop) yoki Pusk (Start) menyusidan to'g'ridan-to'g'ri ochishingiz mumkin.
            </span>
          </div>
        )}

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-2xl">
            <Laptop className="w-4 h-4 text-[#107c41] mb-2" />
            <h4 className="text-xs font-bold text-slate-900">Alohida Oyna</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Brauzer manzillar qatori va tablarsiz, to'liq ekranli dastur.
            </p>
          </div>
          <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-2xl">
            <Zap className="w-4 h-4 text-amber-600 mb-2" />
            <h4 className="text-xs font-bold text-slate-900">Tezkor Yuklanish</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Ish stolida qulay ikonka va 1 soniyada ochilish tezligi.
            </p>
          </div>
          <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-2xl">
            <ShieldCheck className="w-4 h-4 text-indigo-600 mb-2" />
            <h4 className="text-xs font-bold text-slate-900">Neon Sync</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Bulutli PostgreSQL bazasi va oflayn xotira bilan to'liq integratsiya.
            </p>
          </div>
        </div>

        {/* Installation Options */}
        <div className="space-y-4">
          {/* Option 1: Native Windows App Installation */}
          <div className="p-4 rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/20 relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#107c41] text-white mb-1">
                  1-USUL (TAVSIYA ETILADI)
                </span>
                <h4 className="text-sm font-bold text-slate-900">
                  Ish Stoliga 1-Klikda O'rnatish (Standalone App)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Telegram yoki Excel kabi alohida mustaqil Windows ilovasi sifatida o'rnatiladi.
                </p>
              </div>

              <button
                onClick={handleNativeInstall}
                className="px-5 py-2.5 bg-[#107c41] hover:bg-[#0e6837] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>O'rnatish</span>
              </button>
            </div>
          </div>

          {/* Option 2: Windows Launcher (.bat) */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-700 mb-1">
                  2-USUL (MUQOBIL)
                </span>
                <h4 className="text-xs font-bold text-slate-900">
                  Windows Desktop Launcher (.bat)
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Kompyuteringizga maxsus `.bat` ishga tushirish faylini yuklab oladi.
                </p>
              </div>

              <button
                onClick={handleDownloadWindowsLauncher}
                className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shrink-0 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Launcher (.bat)</span>
              </button>
            </div>
          </div>

          {/* Option 3: Electron Native EXE Package Info */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-900 text-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-2">
              <Terminal className="w-4 h-4" />
              <span>Electron x64 Setup (.exe) Tuzilishi</span>
            </div>
            <p className="text-[11px] text-slate-300 mb-2 leading-relaxed">
              Loyiha kodida Electron Windows x64 paketlash konfiguratsiyasi to'liq tayyorlangan. Terminal orqali to'g'ridan-to'g'ri o'rnatuvchi `.exe` faylini yaratish:
            </p>
            <div className="bg-black/50 px-3 py-2 rounded-xl font-mono text-[11px] text-emerald-300 flex items-center justify-between">
              <code>npm run electron</code>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>Versiya: 2.0.0 Pro (Windows 64-bit)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};
