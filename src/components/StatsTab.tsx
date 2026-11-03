import React, { useState, useEffect } from 'react';
import { getFinancialSummary } from '../db/storage';
import { PieChart, Sparkles, BarChart3, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const StatsTab: React.FC = () => {
  const [summary, setSummary] = useState(getFinancialSummary());

  const loadData = () => {
    setSummary(getFinancialSummary());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('finan_storage_updated', loadData);
    return () => window.removeEventListener('finan_storage_updated', loadData);
  }, []);

  const totalExpense = summary.monthlyExpenses;
  const totalIncome = summary.monthlyIncome;
  const topExpenseCategory = summary.categorySummaries.find(c => c.type === 'expense');
  const topIncomeCategory = summary.categorySummaries.find(c => c.type === 'income');

  const today = new Date().getDate();
  const dailyAverageExpense = today > 0 ? Math.round(totalExpense / today) : 0;
  const dailyAverageIncome = today > 0 ? Math.round(totalIncome / today) : 0;

  const categoryColors: Record<string, string> = {
    'Bodega & Alimentos': 'from-emerald-500 to-teal-500',
    'Cerveza & Recreación': 'from-amber-500 to-orange-500',
    'Transporte & Boteros': 'from-blue-500 to-indigo-500',
    'Comunicaciones & ETECSA': 'from-purple-500 to-violet-500',
    'Servicios & Vivienda': 'from-cyan-500 to-blue-400',
    'Salud & Aseo': 'from-rose-500 to-red-500',
    'Ventas & Negocio': 'from-emerald-400 to-green-500',
    'Trabajos & Servicios': 'from-teal-400 to-emerald-600',
    'Remesas & Entradas': 'from-indigo-400 to-emerald-400',
    'Otros Gastos': 'from-slate-500 to-slate-400'
  };

  return (
    <div className="h-full w-full flex flex-col justify-between py-1 overflow-hidden space-y-2">
      {/* Hero Cash Balance Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-emerald-500/30 p-3.5 shadow-lg space-y-2 shrink-0">
        <div className="flex items-start justify-between relative z-10">
          <div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <Wallet className="w-3 h-3" /> Efectivo Físico en Bolsillo
            </span>
            <div className="text-2xl font-extrabold text-slate-100 tracking-tight mt-0.5 tabular-nums">
              ${summary.currentCashInHand.toLocaleString('es-MX')} <span className="text-xs font-semibold text-emerald-400">CUP</span>
            </div>
          </div>

          <div className="px-3 py-1 rounded-xl bg-slate-950/80 border border-slate-800 text-right">
            <span className="text-[9px] font-semibold text-slate-400 uppercase block">Flujo Neto</span>
            <span className={`text-xs font-mono font-bold tabular-nums ${summary.monthlyNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {summary.monthlyNet >= 0 ? '+' : ''}${summary.monthlyNet.toLocaleString('es-MX')}
            </span>
          </div>
        </div>

        {/* Multi-metric stats row */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 relative z-10">
          <div className="flex items-center gap-2 bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] text-slate-400 block font-semibold uppercase truncate">Generado</span>
              <span className="text-xs font-bold text-emerald-400 tabular-nums">
                +${summary.monthlyIncome.toLocaleString('es-MX')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
              <ArrowDownRight className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] text-slate-400 block font-semibold uppercase truncate">Gastado</span>
              <span className="text-xs font-bold text-rose-400 tabular-nums">
                -${summary.monthlyExpenses.toLocaleString('es-MX')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-2 shrink-0">
        <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-2xl space-y-0.5">
          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Entrada Diaria</span>
          <div className="text-sm font-bold font-mono text-emerald-400 tabular-nums">
            +${dailyAverageIncome.toLocaleString('es-MX')} <span className="text-[10px] font-normal text-slate-400">/día</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-2xl space-y-0.5">
          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Salida Diaria</span>
          <div className="text-sm font-bold font-mono text-rose-400 tabular-nums">
            -${dailyAverageExpense.toLocaleString('es-MX')} <span className="text-[10px] font-normal text-slate-400">/día</span>
          </div>
        </div>
      </div>

      {/* AI Financial Insight Banner */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border border-emerald-500/30 p-2.5 rounded-2xl text-[11px] space-y-1 relative overflow-hidden shrink-0">
        <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-[10px] uppercase tracking-wider">
          <Sparkles className="w-3 h-3 text-emerald-400" /> Insight FinanAI
        </div>
        <p className="text-slate-300 leading-tight text-[10.5px]">
          {totalIncome > totalExpense
            ? `¡Excelente! Llevas **+$${(totalIncome - totalExpense).toLocaleString('es-MX')} CUP a favor**. Principal ingreso: **${topIncomeCategory?.category || 'Trabajos'}**.`
            : totalIncome === 0 && totalExpense === 0
            ? 'Anota tus entradas y salidas en efectivo en el chat de la IA para ver tus estadísticas en tiempo real.'
            : `Gasto del mes: $${totalExpense.toLocaleString('es-MX')} CUP. Mayor egreso: **${topExpenseCategory?.category || 'Bodega'}**.`}
        </p>
      </div>

      {/* Category Breakdown Compact Bars */}
      <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-2xl flex-1 flex flex-col justify-between overflow-hidden min-h-0">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 shrink-0">
          <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
            <PieChart className="w-3.5 h-3.5 text-emerald-400" /> Desglose por Categoría
          </h3>
          <span className="text-[10px] text-slate-400 font-mono tabular-nums">{summary.transactionCount} registros</span>
        </div>

        {summary.categorySummaries.length === 0 ? (
          <p className="text-[11px] text-slate-500 text-center my-auto">Sin movimientos registrados este mes.</p>
        ) : (
          <div className="space-y-2 py-1 overflow-hidden flex-1 flex flex-col justify-around">
            {summary.categorySummaries.slice(0, 4).map(cat => {
              const gradient = categoryColors[cat.category] || 'from-slate-500 to-slate-400';
              const isIncome = cat.type === 'income';

              return (
                <div key={cat.category} className="space-y-0.5">
                  <div className="flex items-center justify-between text-[10.5px]">
                    <span className="font-semibold text-slate-200 flex items-center gap-1 truncate max-w-[170px]">
                      <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${gradient} shrink-0`} />
                      {cat.category}
                    </span>
                    <span className={`font-mono font-bold ${isIncome ? 'text-emerald-400' : 'text-slate-200'}`}>
                      {isIncome ? '+' : '-'}${cat.totalAmount.toLocaleString('es-MX')} CUP
                    </span>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800/80">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
                      style={{ width: `${Math.min(100, cat.percentage)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Daily Net Flow Compact Chart */}
      <div className="bg-slate-900 border border-slate-800/80 p-2.5 rounded-2xl shrink-0">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-1">
          <h3 className="text-[11px] font-bold text-slate-100 flex items-center gap-1">
            <BarChart3 className="w-3 h-3 text-indigo-400" /> Flujo Diario
          </h3>
          <span className="text-[9px] text-slate-400">Verde: Entradas · Rojo: Salidas</span>
        </div>

        {summary.dailySummaries.length === 0 ? (
          <p className="text-[10px] text-slate-500 text-center py-1">Aún no hay días con movimientos.</p>
        ) : (
          <div className="h-14 flex items-end gap-1 px-1">
            {summary.dailySummaries.slice(-7).map(d => {
              const maxAmount = Math.max(...summary.dailySummaries.map(s => Math.max(s.income, s.expense)), 1);
              const incPct = Math.max(8, Math.round((d.income / maxAmount) * 100));
              const expPct = Math.max(8, Math.round((d.expense / maxAmount) * 100));

              return (
                <div key={d.dateKey} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="flex items-end gap-0.5 w-full h-10 justify-center">
                    <div className="w-1.5 rounded-t bg-emerald-500" style={{ height: `${incPct}%` }} />
                    <div className="w-1.5 rounded-t bg-rose-500" style={{ height: `${expPct}%` }} />
                  </div>
                  <span className="text-[8px] text-slate-400 font-mono truncate">{d.formattedDate}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
