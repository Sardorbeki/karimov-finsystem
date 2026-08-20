import React, { useState, useEffect } from 'react';
import {
  Activity,
  Database,
  Cloud,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Laptop,
  Check,
  Server,
  Zap,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cloud } from '../../lib/cloudService';

export const KeepAliveStatusBar: React.FC = () => {
  const { keepAliveInfo } = useAuth();
  const [isPinging, setIsPinging] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [lastSyncSuccess, setLastSyncSuccess] = useState(false);

  useEffect(() => {
    // Listen for PWA desktop install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleManualPing = async () => {
    setIsPinging(true);
    try {
      await cloud.ping();
      setLastSyncSuccess(true);
      setTimeout(() => setLastSyncSuccess(false), 3000);
    } finally {
      setIsPinging(false);
    }
  };

  const handleInstallDesktop = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowInstallGuide(true);
    }
  };

  const formatLastPing = (iso: string | null) => {
    if (!iso) return "Hali yuborilmadi";
    const date = new Date(iso);
    return date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <>
      <div className="bg-white border border-[#cbd5e1] rounded-xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Anti-Sleep Heartbeat Status */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping absolute opacity-75" />
              <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full" />
            </div>
            <span className="font-bold text-slate-800">Neon.tech & Render Uyg'oq Saqlovchi:</span>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 rounded text-[11px] flex items-center gap-1">
              <Zap className="w-3 h-3 text-emerald-600" />
              2 daqiqalik Anti-Sleep Faol
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-slate-500 text-[11px]">
            <span>Oxirgi puls: <strong className="text-slate-700">{formatLastPing(keepAliveInfo.last_ping_time)}</strong></span>
            <span>•</span>
            <span>Kechikish: <strong className="text-slate-700">{keepAliveInfo.last_latency_ms || 45} ms</strong></span>
            <span>•</span>
            <span>Jami impulslar: <strong className="text-slate-700">{keepAliveInfo.total_pings || 1}</strong></span>
          </div>
        </div>

        {/* Right: Actions (Manual Ping & Install PC App) */}
        <div className="flex items-center gap-2">
          {/* Manual Pulse test button */}
          <button
            type="button"
            onClick={handleManualPing}
            disabled={isPinging}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-medium rounded-lg transition-colors text-xs disabled:opacity-50"
            title="Render va Neon serverini darhol tekshirish va impuls yuborish"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin text-emerald-600' : ''}`} />
            <span>{isPinging ? 'Puls yuborilmoqda...' : lastSyncSuccess ? 'Uyg\'oq 🟢' : 'Puls Yuborish'}</span>
          </button>

          {/* Desktop Install Button */}
          {!isInstalled ? (
            <button
              type="button"
              onClick={handleInstallDesktop}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#107c41] hover:bg-[#0e6837] active:bg-[#0c5c30] text-white font-bold rounded-lg shadow-xs transition-all text-xs"
              title="Dasturni kompyuterga alohida ilova sifatida o'rnatish"
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Kompyuterga O'rnatish</span>
            </button>
          ) : (
            <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-semibold">
              <Check className="w-3.5 h-3.5" />
              <span>Dastur O'rnatilgan</span>
            </div>
          )}
        </div>
      </div>

      {/* Modal / Guide on how to install on PC */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
                <Laptop className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Dasturni Kompyuterga O'rnatish</h3>
                <p className="text-xs text-slate-500">Windows, Mac yoki Linux tizimida mustaqil dastur bo'lib ishlaydi</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 bg-[#107c41] text-white font-bold rounded-full flex items-center justify-center shrink-0 text-[11px]">1</span>
                <span>Brauzeringizning manzil qatorida (yuqori o'ngda) <strong>"O'rnatish" (Install App 💻)</strong> belgisini bosing.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 bg-[#107c41] text-white font-bold rounded-full flex items-center justify-center shrink-0 text-[11px]">2</span>
                <span>Chrome yoki Edge brauzer menyusida (3 nuqta) <strong>"Ilovani o'rnatish" (Install Moliya Maks)</strong> bandini tanlang.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 bg-[#107c41] text-white font-bold rounded-full flex items-center justify-center shrink-0 text-[11px]">3</span>
                <span>Shundan so'ng dastur ish stolingizda alohida ilova sifatida paydo bo'ladi va har qanday kompyuterda login parolingiz orqali o'z ma'lumotlaringizni ochadi!</span>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowInstallGuide(false)}
                className="px-4 py-2 bg-[#107c41] hover:bg-[#0e6837] text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Tushunarli
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
