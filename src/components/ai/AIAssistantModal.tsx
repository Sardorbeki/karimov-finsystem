import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
  Trash2,
  Maximize2,
  Minimize2,
  Mic,
  MicOff,
  RotateCcw,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { AIMessage, AIActionPayload } from '../../types';
import { db } from '../../lib/storage';
import { executeAIActions, parseAIActionsFromText, generateClientAIResponse } from '../../lib/aiActionExecutor';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_PROMPTS = [
  "Bugun tushlik uchun 45 000 so'm xarajat yoz",
  "Oylik maoshim 12 000 000 so'm tushdi",
  "Aliga 1 500 000 so'm qarz berdim 25-sentyabrgacha",
  "Avtomobil kategoriyasi byudjetini 1 200 000 so'm qil",
  "2026 Master Excel 2.0 faylini yuklab ber",
  "Avgust oyi moliyaviy tahlilini ber"
];

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ isOpen, onClose }) => {
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
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from storage
  useEffect(() => {
    if (currentUser?.id) {
      const stored = db.getAIChatHistory(currentUser.id);
      if (stored && stored.length > 0) {
        setMessages(stored);
      } else {
        // Welcome message
        const welcomeMsg: AIMessage = {
          id: `msg_welcome_${Date.now()}`,
          role: 'assistant',
          content: `Assalomu alaykum, **${currentUser.full_name || 'Admin'}**! 🤖✨\n\nMen sizning shaxsiy **AI Moliyaviy Boshqaruvchingizman**. Siz bilan suhbat orqali barcha amallarni bajara olaman:\n- 💸 Xarajat va daromadlarni yozish\n- 🤝 Qarzlar va to'lovlarni qayd etish\n- 🎯 Byudjet limitlarini boshqarish\n- 📊 Yillik va oylik hisobotlarni tahlil qilish\n- 📑 2026 Master Excel kitoblarini yuklab berish\n\nQanday yordam bera olaman?`,
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
      // Snapshot context
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
        rawReply = data.reply || "Buyrug'ingiz qabul qilindi.";
      } else {
        throw new Error("Server bilan aloqa uzildi");
      }

      // Parse JSON actions if any
      const { cleanText, actions } = parseAIActionsFromText(rawReply);

      // Execute actions
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
    if (confirm("AI suhbat tarixini tozalashni xohlaysizmi?")) {
      db.clearAIChatHistory(currentUser.id);
      const welcome: AIMessage = {
        id: `msg_welcome_${Date.now()}`,
        role: 'assistant',
        content: `Suhbat tarixi tozalandi. Qanday vazifa bajaramiz? 🚀`,
        timestamp: new Date().toISOString()
      };
      setMessages([welcome]);
      db.saveAIChatHistory(currentUser.id, [welcome]);
    }
  };

  // Speech to text simulation/web speech
  const handleToggleVoice = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Brauzeringizda ovozli kiritish qo'llab-quvvatlanmaydi. Matn orqali kiriting.");
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'uz-UZ';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
        handleSendMessage(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div
        className={`w-full bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col border border-slate-200/80 transition-all duration-200 overflow-hidden ${
          isExpanded ? 'h-[95vh] sm:max-w-4xl' : 'h-[85vh] sm:h-[650px] sm:max-w-2xl'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white border-b border-indigo-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5 text-indigo-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">AI Moliyaviy Maslahatchi & Boshqaruvchi</h3>
                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  24/7 Aktiv
                </span>
              </div>
              <p className="text-xs text-indigo-200/80">
                Suhbat orqali barcha moliyaviy amallarni avtomatlashtiring
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleClearChat}
              className="p-2 text-indigo-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              title="Tarixni tozalash"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="hidden sm:flex p-2 text-indigo-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              title={isExpanded ? "Kichiklashtirish" : "Kattalashtirish"}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-indigo-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/60">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-xs'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs'
                  }`}
                >
                  {/* Markdown-like formatting */}
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

                  {/* Executed Action Cards */}
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
                <span>AI buyruqni bajarmoqda va hisoblamoqda...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-white border-t border-slate-100 overflow-x-auto flex items-center gap-2 no-scrollbar">
          <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-500" /> Masalan:
          </span>
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 px-3 py-1.5 rounded-full whitespace-nowrap transition-colors text-slate-700 font-medium"
            >
              {prompt}
            </button>
          ))}
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
              title={isListening ? "Tinglashni to'xtatish" : "Ovozli buyruq aytish"}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Masalan: 'Bugun tushlikka 50 000 sarfladim' yoki 'Hisobotlarni chiqar'..."
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
    </div>
  );
};
