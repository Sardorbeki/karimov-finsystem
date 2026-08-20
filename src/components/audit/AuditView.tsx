import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatDate } from '../../lib/formatters';
import { History, Search, Download } from 'lucide-react';
import { Pagination } from '../common/Pagination';
import { exportToCSV } from '../../lib/excelService';

export const AuditView: React.FC = () => {
  const { auditLogs } = useFinance();
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (entityFilter !== 'all' && log.entity_type !== entityFilter) return false;
      if (actionFilter !== 'all' && log.action !== actionFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchEntity = log.entity_type.toLowerCase().includes(q);
        const matchAction = log.action.toLowerCase().includes(q);
        const matchTitle = (log.title || '').toLowerCase().includes(q);
        const matchDetails = (log.details || '').toLowerCase().includes(q);
        if (!matchEntity && !matchAction && !matchTitle && !matchDetails) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [auditLogs, entityFilter, actionFilter, search]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">YARATILDI</span>;
      case 'UPDATE':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-800">O'ZGARTIRILDI</span>;
      case 'DELETE':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800">O'CHIRILDI</span>;
      case 'REPAYMENT':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">QARZ TO'LOVI</span>;
      case 'IMPORT':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800">IMPORT</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800">{action}</span>;
    }
  };

  const handleExportCSV = () => {
    const data = filteredLogs.map((l, idx) => ({
      'T/r': idx + 1,
      'Vaqt': formatDate(l.timestamp),
      'Modul': l.entity_type,
      'Amal': l.action,
      'Sarlavha': l.title,
      'Tafsilot': l.details
    }));
    exportToCSV(data, `Audit_Jurnali_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-100 text-slate-800 rounded-2xl">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Audit Jurnali & Tranzaksiya Tarixi</h2>
            <p className="text-xs text-slate-500">
              Tizimdagi barcha amallar, o'zgarishlar va to'lovlar xavfsiz audit jurnali
            </p>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Auditni CSV ga yuklash</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Qidirish..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={entityFilter}
          onChange={(e) => {
            setEntityFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Barcha modullar</option>
          <option value="INCOME">Daromadlar (INCOME)</option>
          <option value="EXPENSE">Xarajatlar (EXPENSE)</option>
          <option value="DEBT">Qarzlar (DEBT)</option>
          <option value="PAYMENT">Qarz to'lovlari (PAYMENT)</option>
          <option value="BUDGET">Byudjetlar (BUDGET)</option>
          <option value="CATEGORY">Kategoriyalar (CATEGORY)</option>
          <option value="SETTINGS">Sozlamalar (SETTINGS)</option>
        </select>

        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Barcha amallar</option>
          <option value="CREATE">Yaratish (CREATE)</option>
          <option value="UPDATE">O'zgartirish (UPDATE)</option>
          <option value="DELETE">O'chirish (DELETE)</option>
          <option value="REPAYMENT">Qarz To'lovi (REPAYMENT)</option>
          <option value="IMPORT">Import (IMPORT)</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Vaqt</th>
                <th className="px-4 py-3.5">Modul</th>
                <th className="px-4 py-3.5">Amal</th>
                <th className="px-4 py-3.5">Amal Sarlavhasi</th>
                <th className="px-4 py-3.5">Tafsilot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    Audit yozuvlari topilmadi
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5 font-medium text-slate-900 whitespace-nowrap">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-mono text-[11px] text-slate-600">
                      {log.entity_type}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                      {log.title}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 max-w-md truncate">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredLogs.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="audit yozuvi"
        />
      </div>
    </div>
  );
};
