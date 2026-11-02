import React, { useState, useEffect } from 'react';
import { Transaction, TransactionCategory, TransactionType } from '../types/finance';
import { getTransactions, deleteTransaction, addSingleTransaction, updateTransaction } from '../db/storage';
import { Plus, Search, Trash2, Edit3, ArrowUpRight, ArrowDownRight, X, Banknote } from 'lucide-react';

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
    if (confirm('¿Eliminar esta anotación de dinero en efectivo?')) {
      deleteTransaction(id);
    }
  };

  return (
    <div className="space-y-4 pb-24 pt-2">
      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Registro de Entradas y Salidas</h2>
          <p className="text-xs text-slate-400">Historial completo de tu dinero en efectivo</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-3.5 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" /> Nuevo
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          {/* Search Field */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar trabajo, botero, cerveza, bodega..."
              className="w-full h-10 pl-9 pr-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Segmented Type Filter */}
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-2xl">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-xl transition ${
                filterType === 'all' ? 'bg-slate-800 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-xl transition ${
                filterType === 'expense' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Gastos
            </button>
            <button
              onClick={() => setFilterType('income')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-xl transition ${
                filterType === 'income' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Entradas
            </button>
          </div>
        </div>

        {/* Category Pill Filter Carousel */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition ${
              selectedCategory === 'all'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Todas las categorías
          </button>
          {categoriesList.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition ${
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

      {/* Transactions List */}
      <div className="space-y-2">
        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-3xl space-y-2">
            <p className="text-sm font-semibold text-slate-300">No hay movimientos registrados</p>
            <p className="text-xs text-slate-500">Pídele al Agente que registre lo que ganaste o gastaste hoy.</p>
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
                className="bg-slate-900 border border-slate-800/80 p-3.5 rounded-2xl flex items-center justify-between hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      isIncome
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {isIncome ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-100">{tx.title}</h4>
                    {/* Unboxed Metadata discipline */}
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span>{tx.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formattedDate}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div
                      className={`text-sm font-mono font-bold ${
                        isIncome ? 'text-emerald-400' : 'text-slate-100'
                      }`}
                    >
                      {isIncome ? '+' : '-'}${tx.amount.toLocaleString('es-MX')} CUP
                    </div>
                    {tx.notes && <div className="text-[10px] text-slate-500 truncate max-w-[110px]">{tx.notes}</div>}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(tx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      title="Editar"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
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
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-100">
                {editingId ? 'Editar Anotación' : 'Nueva Anotación Manual'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setFormType('income')}
                  className={`py-2 rounded-xl font-bold transition ${
                    formType === 'income' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400'
                  }`}
                >
                  Entrada / Ingreso (+)
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('expense')}
                  className={`py-2 rounded-xl font-bold transition ${
                    formType === 'expense' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-slate-400'
                  }`}
                >
                  Salida / Gasto (-)
                </button>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Concepto / Título</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="Ej. Trabajo realizado, venta, gasolina, bodega..."
                  className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Monto ($ CUP Efectivo)</label>
                <input
                  type="number"
                  step="1"
                  value={formAmount}
                  onChange={e => setFormAmount(e.target.value)}
                  placeholder="2500"
                  className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-sm focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Categoría</label>
                <select
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                >
                  {categoriesList.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Notas en efectivo (opcional)</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Detalles adicionales..."
                  className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20"
                >
                  Guardar Anotación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
