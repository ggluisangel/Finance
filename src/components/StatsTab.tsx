import React, { useState, useEffect } from 'react';
import { getFinancialSummary } from '../db/storage';
import { PieChart, Sparkles, BarChart3, Banknote, ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, DollarSign } from 'lucide-react';

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

  // Daily average
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
    <div className="space-y-4 pb-28 pt-2">
      {/* Real Cash Balance Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-emerald-500/30 p-5 shadow-2xl space-y-4">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="flex items-start justify-between relative z-10">
          <div>
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" /> Efectivo Físico en Bolsillo
            </span>
            <div className="text-3xl font-extrabold text-slate-100 tracking-tight mt-1 tabular-nums">
              ${summary.currentCashInHand.toLocaleString('es-MX')} <span className="text-sm font-semibold text-emerald-400">CUP</span>
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-slate-950/80 border border-slate-800 text-right">
            <span className="text-[10px] font-semibold text-slate-400 uppercase block">Flujo Neto Mes</span>
            <span className={`text-sm font-mono font-bold tabular-nums ${summary.monthlyNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {summary.monthlyNet >= 0 ? '+' : ''}${summary.monthlyNet.toLocaleString('es-MX')}
            </span>
          </div>
        </div>

        {/* Multi-metric stats row (Income vs Expense on the fly) */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 relative z-10">
          <div className="flex items-center gap-2.5 bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <ArrowUpRight className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Generado Mes</span>
              <span className="text-sm font-bold text-emerald-400 tabular-nums">
                +${summary.monthlyIncome.toLocaleString('es-MX')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
              <ArrowDownRight className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Gastado Mes</span>
              <span className="text-sm font-bold text-rose-400 tabular-nums">
                -${summary.monthlyExpenses.toLocaleString('es-MX')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Promedio Entrada Diario</span>
          <div className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
            +${dailyAverageIncome.toLocaleString('es-MX')} <span className="text-xs font-normal text-slate-400">/día</span>
          </div>
          <span className="text-[10px] text-slate-500">Ingresos variables acumulados</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Promedio Gasto Diario</span>
          <div className="text-lg font-bold font-mono text-rose-400 tabular-nums">
            -${dailyAverageExpense.toLocaleString('es-MX')} <span className="text-xs font-normal text-slate-400">/día</span>
          </div>
          <span className="text-[10px] text-slate-500">Gastos en billetes</span>
        </div>
      </div>

      {/* AI Financial Insight Banner */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border border-emerald-500/30 p-4 rounded-3xl space-y-2 relative overflow-hidden">
        <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-emerald-400" /> Balance Financiero de FinanAI
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {totalIncome > totalExpense
            ? `¡Excelente! En el mes has generado **+$${(totalIncome - totalExpense).toLocaleString('es-MX')} CUP más de lo que has gastado**. Tu principal ingreso fue por **${topIncomeCategory?.category || 'Trabajos & Servicios'}**.`
            : totalIncome === 0 && totalExpense === 0
            ? 'Comienza a anotar tus entradas y salidas en efectivo en la pestaña del Agente AI para ver tus estadísticas en tiempo real.'
            : `Atención: Has gastado $${totalExpense.toLocaleString('es-MX')} CUP frente a $${totalIncome.toLocaleString('es-MX')} CUP generados. Tu principal gasto ha sido **${topExpenseCategory?.category || 'Bodega & Alimentos'}**.`}
        </p>
      </div>

      {/* Category Breakdown Progress Bars */}
      <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-3xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-400" /> Distribución Completa por Categoría
          </h3>
          <span className="text-xs text-slate-400 font-mono tabular-nums">{summary.transactionCount} registros</span>
        </div>

        {summary.categorySummaries.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">No hay suficientes registros este mes.</p>
        ) : (
          <div className="space-y-3.5">
            {summary.categorySummaries.map(cat => {
              const gradient = categoryColors[cat.category] || 'from-slate-500 to-slate-400';
              const isIncome = cat.type === 'income';

              return (
                <div key={cat.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${gradient}`} />
                      {cat.category}
                    </span>
                    <div className="flex items-center gap-2 font-mono font-bold text-slate-300">
                      <span className={isIncome ? 'text-emerald-400' : 'text-slate-200'}>
                        {isIncome ? '+' : '-'}${cat.totalAmount.toLocaleString('es-MX')} CUP
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-500`}
                      style={{ width: `${Math.min(100, cat.percentage)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Daily Net Flow Visual Chart */}
      <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-3xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" /> Movimientos Diarios en Efectivo
          </h3>
          <span className="text-[10px] text-slate-400">Entradas vs Salidas</span>
        </div>

        {summary.dailySummaries.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">Aún no hay días registrados.</p>
        ) : (
          <div className="pt-2">
            <div className="h-32 flex items-end gap-2 px-2 border-b border-slate-800 pb-2">
              {summary.dailySummaries.map(d => {
                const maxAmount = Math.max(...summary.dailySummaries.map(s => Math.max(s.income, s.expense)), 1);
                const incPct = Math.max(5, Math.round((d.income / maxAmount) * 100));
                const expPct = Math.max(5, Math.round((d.expense / maxAmount) * 100));

                return (
                  <div key={d.dateKey} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="flex items-end gap-1 w-full h-full justify-center">
                      <div
                        className="w-2 rounded-t bg-emerald-500 transition-all duration-300"
                        style={{ height: `${incPct}%` }}
                        title={`Entrada: +$${d.income}`}
                      />
                      <div
                        className="w-2 rounded-t bg-rose-500 transition-all duration-300"
                        style={{ height: `${expPct}%` }}
                        title={`Gasto: -$${d.expense}`}
                      />
                    </div>

                    <span className="text-[9px] text-slate-400 font-mono truncate">{d.formattedDate}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-center gap-4 text-[10px] pt-2 text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500 inline-block"/> Entradas</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-rose-500 inline-block"/> Salidas</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
