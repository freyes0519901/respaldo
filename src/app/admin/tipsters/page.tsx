'use client';

import { useState, useEffect } from 'react';
import { Trophy, Search, Edit2, Check, X, Plus, UserPlus, Loader2 } from 'lucide-react';
import { useAuth, adminFetch } from '../layout';

interface Tipster {
  id: number;
  nombre_real: string;
  alias: string;
  deporte: string;
  activo: boolean;
  total_apuestas: number;
  ganadas: number;
  perdidas: number;
}

const DEPORTES = ['Fútbol', 'Basketball', 'Tenis', 'Baseball', 'Hockey', 'MMA', 'eSports', 'Mixto', 'Otro'];

export default function TipstersPage() {
  const [tipsters, setTipsters] = useState<Tipster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ alias: '', deporte: '' });
  const [search, setSearch] = useState('');
  const { accessToken } = useAuth();

  // Modal agregar tipster
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ nombre_real: '', alias: '', deporte: 'Fútbol' });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');

  useEffect(() => {
    loadTipsters();
  }, [accessToken]);

  const loadTipsters = async () => {
    if (!accessToken) return;
    try {
      const response = await adminFetch('/api/admin/tipsters/stats', {}, accessToken);
      const data = await response.json();
      setTipsters(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (tipster: Tipster) => {
    setEditingId(tipster.id);
    setEditForm({ alias: tipster.alias, deporte: tipster.deporte || '' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ alias: '', deporte: '' });
  };

  const saveEdit = async (id: number) => {
    if (!accessToken) return;
    try {
      await adminFetch(
        `/api/admin/tipsters/${id}`,
        { method: 'PUT', body: JSON.stringify(editForm) },
        accessToken
      );
      await loadTipsters();
      setEditingId(null);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const toggleActive = async (id: number, currentState: boolean) => {
    if (!accessToken) return;
    try {
      await adminFetch(
        `/api/admin/tipsters/${id}`,
        { method: 'PUT', body: JSON.stringify({ activo: !currentState }) },
        accessToken
      );
      await loadTipsters();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleAddTipster = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    setAddSuccess('');

    if (!addForm.nombre_real.trim() || !addForm.alias.trim()) {
      setAddError('Nombre real y alias son obligatorios');
      return;
    }

    setAddLoading(true);
    try {
      const response = await adminFetch(
        '/api/admin/tipsters',
        { method: 'POST', body: JSON.stringify(addForm) },
        accessToken
      );
      const data = await response.json();

      if (response.ok) {
        setAddSuccess(`✅ Tipster "${addForm.alias}" agregado correctamente`);
        setAddForm({ nombre_real: '', alias: '', deporte: 'Fútbol' });
        await loadTipsters();
        setTimeout(() => {
          setShowAdd(false);
          setAddSuccess('');
        }, 1500);
      } else {
        setAddError(data.error || 'Error al agregar tipster');
      }
    } catch (error) {
      setAddError('Error de conexión');
    } finally {
      setAddLoading(false);
    }
  };

  const filteredTipsters = tipsters.filter(t => 
    t.alias.toLowerCase().includes(search.toLowerCase()) ||
    t.nombre_real?.toLowerCase().includes(search.toLowerCase()) ||
    t.deporte?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestión de Tipsters</h1>
          <p className="text-gray-400">Administra los tipsters y sus alias públicos</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setAddError(''); setAddSuccess(''); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar Tipster
        </button>
      </div>

      {/* Modal Agregar Tipster */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowAdd(false)}>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Nuevo Tipster</h2>
                <p className="text-gray-400 text-sm">Agrega un tipster a la plataforma</p>
              </div>
              <button onClick={() => setShowAdd(false)} className="ml-auto text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 mb-4 text-red-400 text-sm">
                {addError}
              </div>
            )}

            {addSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2 mb-4 text-emerald-400 text-sm">
                {addSuccess}
              </div>
            )}

            <form onSubmit={handleAddTipster} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nombre Real *</label>
                <input
                  type="text"
                  value={addForm.nombre_real}
                  onChange={e => setAddForm({ ...addForm, nombre_real: e.target.value })}
                  placeholder="Ej: Juan Pérez"
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Alias Público *</label>
                <input
                  type="text"
                  value={addForm.alias}
                  onChange={e => setAddForm({ ...addForm, alias: e.target.value })}
                  placeholder="Ej: ElCrack_Tips"
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Este es el nombre que verán los usuarios</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Deporte</label>
                <select
                  value={addForm.deporte}
                  onChange={e => setAddForm({ ...addForm, deporte: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-teal-500 focus:outline-none"
                >
                  {DEPORTES.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-gray-300 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex-1 py-2.5 bg-teal-500 hover:bg-teal-600 disabled:bg-teal-500/50 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
                >
                  {addLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Agregando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Agregar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por alias, nombre o deporte..."
          className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:border-teal-500"
        />
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{tipsters.length}</p>
          <p className="text-gray-400 text-sm">Total Tipsters</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{tipsters.filter(t => t.activo).length}</p>
          <p className="text-gray-400 text-sm">Activos</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{tipsters.filter(t => !t.activo).length}</p>
          <p className="text-gray-400 text-sm">Inactivos</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">
            {tipsters.reduce((sum, t) => sum + t.total_apuestas, 0)}
          </p>
          <p className="text-gray-400 text-sm">Total Apuestas</p>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-700/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Nombre Real</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Alias Público</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Deporte</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Apuestas</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Win Rate</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Estado</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {filteredTipsters.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  {search ? 'No se encontraron tipsters' : 'No hay tipsters registrados. ¡Agrega el primero!'}
                </td>
              </tr>
            ) : (
              filteredTipsters.map((tipster) => {
                const winRate = tipster.total_apuestas > 0 
                  ? ((tipster.ganadas / tipster.total_apuestas) * 100).toFixed(1)
                  : '0';
                const isEditing = editingId === tipster.id;

                return (
                  <tr key={tipster.id} className="hover:bg-slate-700/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-amber-400" />
                        <span className="text-white font-medium">{tipster.nombre_real}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.alias}
                          onChange={(e) => setEditForm({ ...editForm, alias: e.target.value })}
                          className="px-2 py-1 bg-slate-900 border border-slate-600 rounded text-white text-sm"
                        />
                      ) : (
                        <span className="text-teal-400">{tipster.alias}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.deporte}
                          onChange={(e) => setEditForm({ ...editForm, deporte: e.target.value })}
                          className="px-2 py-1 bg-slate-900 border border-slate-600 rounded text-white text-sm"
                        />
                      ) : (
                        <span className="text-gray-400">{tipster.deporte || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-300">{tipster.total_apuestas}</td>
                    <td className="px-4 py-3">
                      <span className={`font-mono ${parseFloat(winRate) >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {winRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(tipster.id, tipster.activo)}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          tipster.activo 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {tipster.activo ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <button onClick={() => saveEdit(tipster.id)} className="text-emerald-400 hover:text-emerald-300">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={cancelEdit} className="text-red-400 hover:text-red-300">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(tipster)} className="text-gray-400 hover:text-teal-400">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
