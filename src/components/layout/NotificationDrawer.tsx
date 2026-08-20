import React from 'react';
import { X, AlertTriangle, AlertCircle, CheckCircle, Info, Trash2, ArrowRight } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatDate } from '../../lib/formatters';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { notifications, markNotificationAsRead, clearAllNotifications, setActiveTab } = useFinance();

  if (!isOpen) return null;

  const handleNavigate = (link?: string, notifId?: string) => {
    if (notifId) markNotificationAsRead(notifId);
    if (link) {
      setActiveTab(link);
      onClose();
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'danger':
        return <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-sky-600 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Bildirishnomalar & Ogohlantirishlar</h3>
              <p className="text-xs text-slate-500 mt-0.5">Avtomatik moliyaviy monitoring</p>
            </div>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 text-xs flex items-center gap-1"
                  title="Barchasini o'qilgan qilish"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <CheckCircle className="w-10 h-10 text-emerald-400 mb-2 opacity-80" />
                <p className="font-medium text-slate-700 text-sm">Barcha ko'rsatkichlar me'yorda!</p>
                <p className="text-xs text-slate-400 mt-1">
                  Muddati o'tgan qarzlar yoki oshib ketgan byudjetlar mavjud emas.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNavigate(n.linkTo, n.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    n.read
                      ? 'bg-slate-50/60 border-slate-100 opacity-70'
                      : n.type === 'danger'
                      ? 'bg-rose-50/40 border-rose-100 hover:bg-rose-50/70'
                      : n.type === 'warning'
                      ? 'bg-amber-50/40 border-amber-100 hover:bg-amber-50/70'
                      : 'bg-indigo-50/40 border-indigo-100 hover:bg-indigo-50/70'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {getIcon(n.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{n.title}</h4>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 ml-2" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed mb-2">{n.message}</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{formatDate(n.timestamp)}</span>
                        {n.linkTo && (
                          <span className="text-indigo-600 font-medium flex items-center gap-1 hover:underline">
                            Ko'rish <ArrowRight className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
