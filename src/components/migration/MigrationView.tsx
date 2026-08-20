import React, { useState, useRef } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle,
  Database,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import {
  parseExcelFile,
  exportComprehensiveExcel,
  generateEmptyTemplateExcel,
  exportBackupJSON,
  importBackupJSON,
  ParsedImportData
} from '../../lib/excelService';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { db } from '../../lib/storage';

export const MigrationView: React.FC = () => {
  const { incomes, expenses, debts, categories, refreshData, addIncome, addExpense, addDebt, saveCategory } = useFinance();
  const { currentUser } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedImportData | null>(null);

  const [importOption, setImportOption] = useState<'append' | 'overwrite'>('append');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const result = await parseExcelFile(file);
      setParsedData(result);
    } catch (err: any) {
      alert('Faylni o\'qishda xatolik yuz berdi: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommitImport = () => {
    if (!parsedData) return;

    try {
      if (importOption === 'overwrite') {
        // Reset DB to fresh state
        db.resetToSeedData();
      }

      // Add categories if new
      parsedData.incomes.forEach((inc) => {
        let cat = categories.find((c) => c.name.toLowerCase() === inc.categoryName.toLowerCase());
        if (!cat) {
          saveCategory({
            name: inc.categoryName,
            type: 'income',
            color: '#10b981',
            icon: 'Briefcase',
            is_active: true
          });
        }
      });

      parsedData.expenses.forEach((exp) => {
        let cat = categories.find((c) => c.name.toLowerCase() === exp.categoryName.toLowerCase());
        if (!cat) {
          saveCategory({
            name: exp.categoryName,
            type: 'expense',
            color: '#f43f5e',
            icon: 'ShoppingCart',
            is_active: true
          });
        }
      });

      // Commit incomes
      parsedData.incomes.forEach((inc) => {
        const cat = categories.find((c) => c.name.toLowerCase() === inc.categoryName.toLowerCase());
        addIncome({
          date: inc.date || new Date().toISOString().split('T')[0],
          category_id: cat ? cat.id : (categories[0]?.id || 'cat_inc_1'),
          amount: inc.amount,
          description: inc.description || '',
          payment_method: inc.paymentMethod || 'Plastik karta'
        });
      });

      // Commit expenses
      parsedData.expenses.forEach((exp) => {
        const cat = categories.find((c) => c.name.toLowerCase() === exp.categoryName.toLowerCase());
        addExpense({
          date: exp.date || new Date().toISOString().split('T')[0],
          category_id: cat ? cat.id : (categories[0]?.id || 'cat_exp_1'),
          amount: exp.amount,
          description: exp.description || '',
          payment_method: exp.paymentMethod || 'Plastik karta'
        });
      });

      // Commit debts
      parsedData.debts.forEach((d) => {
        addDebt({
          type: d.type || 'given',
          counterparty: d.counterparty || 'Noma\'lum',
          initial_amount: d.initial_amount || 0,
          due_date: d.due_date || new Date().toISOString().split('T')[0],
          description: d.description || ''
        });
      });

      refreshData();
      setSuccessMsg('Excel ma\'lumotlari muvaffaqiyatli bazaga yuklandi!');
      setParsedData(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      alert('Import qilishda xatolik yuz berdi: ' + err.message);
    }
  };

  const handleDownloadTemplate = () => {
    generateEmptyTemplateExcel(categories);
  };

  const handleDownloadBackup = () => {
    exportBackupJSON();
  };

  const handleJSONRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await importBackupJSON(file);
      refreshData();
      setSuccessMsg('Baza zaxira nusxadan tiklandi!');
    } catch (err: any) {
      alert('Tiklashda xatolik yuz berdi: ' + err.message);
    }
  };

  const handleResetToSeed = () => {
    db.resetToSeedData();
    refreshData();
    setSuccessMsg('Baza 2026-yil namuna ma\'lumotlariga qaytarildi!');
    setIsResetConfirmOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Excel 2.0 Integratsiyasi & Ma'lumotlar Migratsiyasi
            </h2>
            <p className="text-xs text-slate-500">
              "Каримов_Moliyaviy_boshqaruv_tizimi_excel_2_0_versiya_2026_yillik.xlsx" fayli bilan 100% muvofiqlik
            </p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 font-bold">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Excel Import Box */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-600" />
                Excel Faylni Yuklash (.xlsx, .xls)
              </h3>
              <button
                onClick={handleDownloadTemplate}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 hover:underline"
              >
                <Download className="w-3 h-3" />
                Shablonni olish
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-6">
              Mavjud Excel jadvalingizni tanlang. Dastur sahifalarni (Daromadlar, Xarajatlar, Qarzlar) avtomatik aniqlaydi va bazaga yozadi.
            </p>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/60 hover:bg-indigo-50/20 rounded-2xl p-8 text-center cursor-pointer transition-colors"
            >
              <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-800">
                Faylni tanlash uchun bu yerga bosing
              </p>
              <p className="text-[11px] text-slate-400 mt-1">.xlsx yoki .xls formatidagi fayllar</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {isLoading && (
            <div className="mt-4 p-3 bg-indigo-50 text-indigo-700 text-xs rounded-xl flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Excel fayli o'qilmoqda va tekshirilmoqda...</span>
            </div>
          )}
        </div>

        {/* Export & Backup Box */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Database className="w-4 h-4 text-emerald-600" />
              To'liq Zaxira Nusxasi (Backup) & Eksport
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Barcha moliyaviy ma'lumotlaringizni Excel formatida yuklab oling yoki to'liq JSON zaxira nusxasini yarating.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => exportComprehensiveExcel(incomes, expenses, debts, categories)}
                className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-800 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Excel 2.0 Formatida Barcha Sahifalarni Eksport Qilish
                </span>
                <Download className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={handleDownloadBackup}
                className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-800 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  To'liq JSON Baza Nusxasini Saqlash (Offline Backup)
                </span>
                <Download className="w-4 h-4 text-slate-400" />
              </button>

              <div
                onClick={() => jsonInputRef.current?.click()}
                className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-800 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <RefreshCw className="w-4 h-4 text-purple-600" />
                  JSON Fayldan Bazani Qayta Tiklash
                </span>
                <Upload className="w-4 h-4 text-slate-400" />
                <input
                  ref={jsonInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleJSONRestore}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Namuna ma'lumotlariga qaytish:</span>
            <button
              onClick={() => setIsResetConfirmOpen(true)}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700"
            >
              2026-yil namunasini tiklash
            </button>
          </div>
        </div>
      </div>

      {/* Parsed Excel Preview & Commit Modal */}
      {parsedData && (
        <div className="bg-white p-6 rounded-3xl border border-indigo-200 shadow-xl space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Excel Fayli Muvaffaqiyatli O'qildi — Import Qilishga Tayyor
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Quyidagi ma'lumotlar bazaga qo'shilish uchun aniqlandi
              </p>
            </div>

            <button
              onClick={() => setParsedData(null)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              Bekor qilish
            </button>
          </div>

          {/* Stats Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
              <span className="text-[11px] font-semibold text-emerald-800">Daromadlar</span>
              <p className="text-xl font-bold text-emerald-900 mt-1">{parsedData.incomes.length} ta</p>
            </div>
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-center">
              <span className="text-[11px] font-semibold text-rose-800">Xarajatlar</span>
              <p className="text-xl font-bold text-rose-900 mt-1">{parsedData.expenses.length} ta</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-center">
              <span className="text-[11px] font-semibold text-amber-800">Qarzlar</span>
              <p className="text-xl font-bold text-amber-900 mt-1">{parsedData.debts.length} ta</p>
            </div>
          </div>

          {/* Import Strategy Options */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">Import Strategiyasi</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                onClick={() => setImportOption('append')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                  importOption === 'append'
                    ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="importOption"
                  checked={importOption === 'append'}
                  onChange={() => setImportOption('append')}
                  className="mt-1"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Mavjud ma'lumotlarga qo'shish (Append)</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Hozirgi barcha yozuvlar saqlanadi, yangi qatorlar qo'shiladi.
                  </p>
                </div>
              </label>

              <label
                onClick={() => setImportOption('overwrite')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                  importOption === 'overwrite'
                    ? 'border-rose-500 bg-rose-50/50 ring-2 ring-rose-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="importOption"
                  checked={importOption === 'overwrite'}
                  onChange={() => setImportOption('overwrite')}
                  className="mt-1"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Bazani tozalab yangitdan yozish (Overwrite)</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Eski ma'lumotlar o'chiriladi va faqat Excel fayldagi ma'lumotlar qoladi.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setParsedData(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Bekor qilish
            </button>
            <button
              onClick={handleCommitImport}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/25"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Bazaga Import Qilishni Tasdiqlash</span>
            </button>
          </div>
        </div>
      )}

      {/* Reset Confirmation */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        title="2026-yil namunasini qayta tiklash"
        message="Haqiqatan ham barcha joriy yozuvlarni tozalab, 2026-yilgi to'liq namuna ma'lumotlarini yuklamoqchimisiz?"
        confirmLabel="Ha, tiklansin"
        cancelLabel="Bekor qilish"
        onConfirm={handleResetToSeed}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
};
