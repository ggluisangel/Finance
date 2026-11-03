import React, { useState, useEffect } from 'react';
import { Transaction, TransactionCategory, TransactionType } from '../types/finance';
import { getTransactions, deleteTransaction, addSingleTransaction, updateTransaction } from '../db/storage';
import { Plus, Search, Trash2, Edit3, ArrowUpRight, ArrowDownRight, X } from 'lucide-react';

export const HistoryTab: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formType, setFormType] = useState<TransactionType>('expense');
  const [formCategory, setFormCategory] = useState<TransactionCategory>('Bodega & Alimentos');
  const [formNotes, setFormNotes] = useState('');

  const loadData = () => {
    setTransactions(getTransactions());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('finan_storage_updated', loadData);
    return () => window.removeEventListener('finan_storage_updated', loadData);
  }, []);

  const categoriesList: TransactionCategory[] = [
    'Bodega & Alimentos',
    'Cerveza & Recreación',
    'Transporte & Boteros',
    'Comunicaciones & ETECSA',
    'Servicios & Vivienda',
    'Salud & Aseo',
    'Ventas & Negocio',
    'Trabajos & Servicios',
    'Remesas & Entradas',
    'Otros Gastos'
  ];

  const filteredTransactions = transactions.filter(t => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchCat = t.category.toLowerCase().includes(q);
      const matchNotes = (t.notes || '').toLowerCase().includes(q);
      return matchTitle || matchCat || matchNotes;
    }
    return true;
  });

  const openCreateModal = () => {
    setEditingId(null);
    setFormTitle('');
    setFormAmount('');
    setFormType('expense');
    setFormCategory('Bodega & Alimentos');
    setFormNotes('En efectivo');
    setShowModal(true);
  };

  const openEditModal = (t: Transaction) => {
    setEditingId(t.id);
    setFormTitle(t.title);
    setFormAmount(t.amount.toString());
    setFormType(t.type);
    setFormCategory(t.category);
    setFormNotes(t.notes || 'En efectivo');
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(formAmount);
    if (!formTitle.trim() || isNaN(amountNum) || amountNum <= 0) {
      alert('Ingresa un título válido y un monto mayor a 0.');
      return;
    }

    if (editingId) {
      updateTransaction(editingId, {
        title: formTitle.trim(),
        amount: amountNum,
        type: formType,
        category: formCategory,
        notes: formNotes.trim()
      });
    } else {
      addSingleTransaction({
        title: formTitle.trim(),
        amount: amountNum,
        type: formType,
        category: formCategory,
        notes: formNotes.trim() || 'En efectivo',
        date: new Date().toISOString()
      });
    }

    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar esta anotación?')) {
      deleteTransaction(id);
    }
  };

  return (
    <div className="h-full w-full flex flex-col justify-between overflow-hidden py-1">
      {/* Header & Add Button */}
      <div className="flex items-center justify-between shrink-0 mb-1.5">
        <div>
          <h2 className="text-base font-bold text-slate-100 tracking-tight">Registro de Movimientos</h2>
          <p className="text-[10px] text-slate-400">Historial en efectivo</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md active:scale-95 transition shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Nuevo
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="space-y-1.5 shrink-0 mb-1.5">
        <div className="flex items-center gap-2">
          {/* Search Field */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar botero, cerveza, bodega..."
              className="w-full h-9 pl-8 pr-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Segmented Type Filter */}
          <div className="flex items-center p-0.5 bg-slate-900 border border-slate-800 rounded-xl shrink-0">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2 py-1 text-[10.5px] font-semibold rounded-lg transition ${
                filterType === 'all' ? 'bg-slate-800 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`px-2 py-1 text-[10.5px] font-semibold rounded-lg transition ${
                filterType === 'expense' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Gastos
            </button>
            <button
              onClick={() => setFilterType('income')}
              className={`px-2 py-1 text-[10.5px] font-semibold rounded-lg transition ${
                filterType === 'income' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Entradas
            </button>
          </div>
        </div>

        {/* Category Pill Filter Carousel */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 text-[10px] font-medium rounded-lg whitespace-nowrap transition ${
              selectedCategory === 'all'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Todas
          </button>
          {categoriesList.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 text-[10px] font-medium rounded-lg whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List Container */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        {filteredTransactions.length === 0 ? (
          <div className="p-6 text-center bg-slate-900/60 border border-slate-800 rounded-2xl space-y-1">
            <p className="text-xs font-semibold text-slate-300">No hay movimientos registrados</p>
            <p className="text-[10px] text-slate-500">Pídele al Agente que registre lo que ganaste o gastaste hoy.</p>
          </div>
        ) : (
          filteredTransactions.map(tx => {
            const isIncome = tx.type === 'income';
            const dateObj = new Date(tx.date);
            const formattedDate = dateObj.toLocaleDateString('es-CU', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={tx.id}
                className="bg-slate-900 border border-slate-800/80 p-2.5 rounded-2xl flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isIncome
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {isIncome ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-100 truncate">{tx.title}</h4>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
                      <span>{tx.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formattedDate}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className={`text-xs font-mono font-bold ${isIncome ? 'text-emerald-400' : 'text-slate-100'}`}>
                      {isIncome ? '+' : '-'}${tx.amount.toLocaleString('es-MX')} CUP
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => openEditModal(tx)}
                      className="p-1 rounded text-slate-400 hover:text-white"
                      title="Editar"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-400"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-100">
                {editingId ? 'Editar Anotación' : 'Nueva Anotación Manual'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setFormType('income')}
                  className={`py-1.5 rounded-lg font-bold transition text-[11px] ${
                    formType === 'income' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400'
                  }`}
                >
                  Entrada (+)
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('expense')}
                  className={`py-2 rounded-lg font-bold transition text-[11px] ${
                    formType === 'expense' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-slate-400'
                  }`}
                >
                  Salida (-)
                </button>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-0.5">Concepto</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="Ej. Trabajo realizado, botero..."
                  className="w-full h-9 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-0.5">Monto ($ CUP)</label>
                <input
                  type="number"
                  step="1"
                  value={formAmount}
                  onChange={e => setFormAmount(e.target.value)}
                  placeholder="2500"
                  className="w-full h-9 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-0.5">Categoría</label>
                <select
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value as any)}
                  className="w-full h-9 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                >
                  {categoriesList.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
