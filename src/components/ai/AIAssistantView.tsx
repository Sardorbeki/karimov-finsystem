import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
  Trash2,
  Mic,
  MicOff,
  RotateCcw,
  Loader2,
  Zap,
  ShieldCheck,
  BarChart3,
  Layers,
  ArrowRight,
  Wallet
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { AIMessage, AIActionPayload } from '../../types';
import { db } from '../../lib/storage';
import { executeAIActions, parseAIActionsFromText, generateClientAIResponse } from '../../lib/aiActionExecutor';
import { formatCurrency } from '../../lib/formatters';

const SAMPLE_COMMAND_CATEGORIES = [
  {
    title: "Tranzaksiyalar",
    icon: Wallet,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    commands: [
      "Bugun tushlik uchun 50 000 so'm xarajat kirit",
      "Kechagi sana bilan 150 000 so'm yoqilg'i xarajati yoz",
      "Frilans loyihadan 4 000 000 so'm daromad tushdi"
    ]
  },
  {
    title: "Qarzlar & To'lovlar",
    icon: TrendingUp,
    color: "text-sky-600 bg-sky-50 border-sky-200",
    commands: [
      "Javohirga 2 000 000 so'm qarz berdim 1-oktyabrgacha",
      "Bank kreditidan 800 000 so'm qarz to'landi",
      "Qaysi qarzlarimning muddati o'tgan?"
    ]
  },
  {
    title: "Byudjet & Limitlar",
    icon: Layers,
    color: "text-indigo-600 bg-indigo-50 border-indigo-200",
    commands: [
      "Restoran va kafe uchun oylik byudjetni 800 000 so'm qil",
      "Byudjetimdan qancha oshib ketganimni ko'rsat",
      "Yangi kategoriya och: Fitnes va sport"
    ]
  },
  {
    title: "Analitika & Excel",
    icon: FileSpreadsheet,
    color: "text-amber-600 bg-amber-50 border-amber-200",
    commands: [
      "2026 Master Excel 2.0 to'liq kitobini yuklab ber",
      "Mening bu yilgi daromad va sarflarimni chuqur tahlil qil",
      "Qayerda eng ko'p pul tejashim mumkin?"
    ]
  }
];

export const AIAssistantView: React.FC = () => {
  const {
    categories,
    allCategories,
    incomes,
    expenses,
    debts,
    budgets,
    summary,
    settings,
    addIncome,
    addExpense,
    addDebt,
    addDebtPayment,
    saveBudget,
    saveCategory,
    updateSettings,
    setActiveTab
  } = useFinance();

  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history
  useEffect(() => {
    if (currentUser?.id) {
      const stored = db.getAIChatHistory(currentUser.id);
      if (stored && stored.length > 0) {
        setMessages(stored);
      } else {
        const welcomeMsg: AIMessage = {
          id: `msg_welcome_${Date.now()}`,
          role: 'assistant',
          content: `Assalomu alaykum, **${currentUser.full_name || 'Admin'}**! 🤖✨\n\nMen sizning **Bosh AI Moliyaviy Boshqaruvchingizman**. Tabiiy tilda yozing yoki ovoz bering — tizimdagi barcha amallarni (xarajat, daromad, qarz, byudjet, Excel yuklash, tahlil) bir zumda bajaraman!`,
          timestamp: new Date().toISOString()
        };
        setMessages([welcomeMsg]);
        db.saveAIChatHistory(currentUser.id, [welcomeMsg]);
      }
    }
  }, [currentUser?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isLoading) return;

    setInputValue('');

    const userMessage: AIMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const contextData = {
        categories: categories.map((c) => ({ id: c.id, name: c.name, type: c.type })),
        summary,
        debts: debts.map((d) => ({ id: d.id, counterparty: d.counterparty, remaining: d.remaining_amount, type: d.type })),
        budgets: budgets.map((b) => ({ category: b.category_name, limit: b.limit_amount, spent: b.spent_amount })),
        currency: settings?.currency || 'UZS',
        user: { name: currentUser.full_name, role: currentUser.role }
      };

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          conversationHistory: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          contextData
        })
      });

      let rawReply = '';
      if (response.ok) {
        const data = await response.json();
        rawReply = data.reply || "Buyrug'ingiz muvaffaqiyatli bajarildi.";
      } else {
        throw new Error("Server javob bermadi");
      }

      const { cleanText, actions } = parseAIActionsFromText(rawReply);

      let executedActions: AIActionPayload[] = [];
      if (actions.length > 0) {
        executedActions = await executeAIActions(actions, {
          categories,
          allCategories,
          incomes,
          expenses,
          debts,
          budgets,
          summary,
          settings,
          addIncome,
          addExpense,
          addDebt,
          addDebtPayment,
          saveBudget,
          saveCategory,
          updateSettings,
          setActiveTab
        });
      }

      const assistantMsg: AIMessage = {
        id: `msg_ai_${Date.now()}`,
        role: 'assistant',
        content: cleanText,
        timestamp: new Date().toISOString(),
        actions: executedActions.length > 0 ? executedActions : undefined
      };

      const finalMessages = [...updatedMessages, assistantMsg];
      setMessages(finalMessages);
      db.saveAIChatHistory(currentUser.id, finalMessages);
    } catch (err: any) {
      // Graceful fallback to client-side rule processor
      const fallbackReply = generateClientAIResponse(query, settings?.currency || 'UZS');
      const { cleanText, actions } = parseAIActionsFromText(fallbackReply);

      let executedActions: AIActionPayload[] = [];
      if (actions.length > 0) {
        executedActions = await executeAIActions(actions, {
          categories,
          allCategories,
          incomes,
          expenses,
          debts,
          budgets,
          summary,
          settings,
          addIncome,
          addExpense,
          addDebt,
          addDebtPayment,
          saveBudget,
          saveCategory,
          updateSettings,
          setActiveTab
        });
      }

      const assistantMsg: AIMessage = {
        id: `msg_ai_${Date.now()}`,
        role: 'assistant',
        content: cleanText,
        timestamp: new Date().toISOString(),
        actions: executedActions.length > 0 ? executedActions : undefined
      };

      const finalMessages = [...updatedMessages, assistantMsg];
      setMessages(finalMessages);
      db.saveAIChatHistory(currentUser.id, finalMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (confirm("AI suhbat tarixini tozalashni tasdiqlaysizmi?")) {
      db.clearAIChatHistory(currentUser.id);
      const welcome: AIMessage = {
        id: `msg_welcome_${Date.now()}`,
        role: 'assistant',
        content: `Suhbat tozalandi. Qanday moliyaviy vazifani bajaramiz?`,
        timestamp: new Date().toISOString()
      };
      setMessages([welcome]);
      db.saveAIChatHistory(currentUser.id, [welcome]);
    }
  };

  const handleToggleVoice = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Brauzeringizda ovozli kiritish qo'llab-quvvatlanmaydi.");
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'uz-UZ';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
        handleSendMessage(transcript);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-6 rounded-3xl text-white border border-indigo-800/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shadow-inner">
            <Sparkles className="w-7 h-7 text-indigo-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">Sun'iy Intellekt Moliyaviy Boshqaruv Markazi</h2>
              <span className="px-2.5 py-0.5 text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                Avtopilot & Chat
              </span>
            </div>
            <p className="text-xs text-indigo-200/80 mt-1 max-w-xl">
              Admin buyruqlari asosida daromad/xarajat kiritish, qarz va byudjetlarni boshqarish, tahlil qilish hamda Excel generatsiya qilish.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleClearChat}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-indigo-200 text-xs font-semibold rounded-xl transition-all border border-white/10"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Suhbatni tozalash</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Chat Stream & Interactive Command Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Chat Stream */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col h-[640px] overflow-hidden">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-tr-xs'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs'
                    }`}
                  >
                    <div className="whitespace-pre-wrap space-y-2">
                      {msg.content.split('\n\n').map((para, i) => (
                        <p key={i}>
                          {para.split('**').map((chunk, j) =>
                            j % 2 === 1 ? (
                              <strong key={j} className={isUser ? 'font-bold text-white' : 'font-bold text-indigo-900'}>
                                {chunk}
                              </strong>
                            ) : (
                              chunk
                            )
                          )}
                        </p>
                      ))}
                    </div>

                    {msg.actions && msg.actions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                        {msg.actions.map((act, actIdx) => (
                          <div
                            key={actIdx}
                            className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-semibold"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="flex-1">{act.summary}</span>
                            <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] rounded-md font-bold">
                              Bajarildi
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div
                      className={`text-[10px] mt-2 font-medium ${
                        isUser ? 'text-indigo-200 text-right' : 'text-slate-400'
                      }`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex gap-3 justify-start animate-in fade-in">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-xs p-4 shadow-xs text-xs text-slate-500 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500 animate-bounce" />
                  <span>AI buyruqni tahlil qilib bajarmoqda...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-4 bg-white border-t border-slate-200/80">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`p-3 rounded-2xl transition-all shadow-xs shrink-0 ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
                title={isListening ? "Tinglashni to'xtatish" : "Ovozli buyruq"}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Buyruqni yozing: 'Bugun tushlikka 45 000 so'm xarajat yoz' yoki 'Excel faylni yukla'..."
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                disabled={isLoading}
              />

              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="p-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white rounded-2xl transition-all shadow-md shadow-indigo-600/20 shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>

        {/* Right 1 Col: Quick Command Shortcuts & Capabilities */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">Tezkor AI Buyruqlari</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Istalgan buyruq ustiga bosing, AI uni bir zumda bajaradi:
            </p>

            <div className="space-y-4">
              {SAMPLE_COMMAND_CATEGORIES.map((cat, idx) => {
                const Icon = cat.icon;
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                      <span>{cat.title}</span>
                    </div>
                    <div className="space-y-1">
                      {cat.commands.map((cmd, cIdx) => (
                        <button
                          key={cIdx}
                          onClick={() => handleSendMessage(cmd)}
                          className="w-full text-left px-3 py-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200/70 rounded-xl text-xs text-slate-700 font-medium transition-all flex items-center justify-between group"
                        >
                          <span className="line-clamp-1">{cmd}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-5 rounded-3xl text-white border border-indigo-900 shadow-md space-y-2">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Xavfsiz va To'g'ridan-to'g'ri Ijro</span>
            </div>
            <p className="text-xs text-indigo-200/80 leading-relaxed">
              AI barcha moliyaviy amallarni tizim audit jurnalida (Audit Log) ro'yxatga oladi va har bir operatsiyani aniq tekshiradi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
