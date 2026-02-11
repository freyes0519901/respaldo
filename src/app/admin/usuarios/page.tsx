'use client';

import { useState, useEffect } from 'react';
import { Users, Search, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useAuth, adminFetch } from '../layout';

interface Usuario {
  id: number;
  email: string;
  plan: string;
  suscripcion_hasta: string;
  is_admin: boolean;
  created_at: string;
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const { accessToken } = useAuth();

  useEffect(() => {
    loadUsuarios();
  }, [accessToken, page, search]);

  const loadUsuarios = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), per_page: '20' });
      if (search) params.append('search', search);
      
      const response = await adminFetch(`/api/admin/usuarios?${params}`, {}, accessToken);
      const data = await response.json();
      setUsuarios(data.usuarios);
      setTotalPages(data.total_pages);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePlan = async (id: number, plan: string) => {
    if (!accessToken) return;
    try {
      await adminFetch(
        `/api/admin/usuarios/${id}`,
        { method: 'PATCH', body: JSON.stringify({ plan }) },
        accessToken
      );
      await loadUsuarios();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const extendSubscription = async (id: number) => {
    if (!accessToken) return;
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + 30);
    try {
      await adminFetch(
        `/api/admin/usuarios/${id}`,
        { method: 'PATCH', body: JSON.stringify({ suscripcion_hasta: newDate.toISOString().split('T')[0] }) },
        accessToken
      );
      await loadUsuarios();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'PREMIUM': return 'bg-emerald-500/20 text-emerald-400';
      case 'FREE_TRIAL': return 'bg-amber-500/20 text-amber-400';
      default: return 'bg-red-500/20 text-red-400';
    }
  };

  const getDaysRemaining = (date: string) => {
    const diff = new Date(date).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  if (isLoading && usuarios.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Gestión de Usuarios</h1>
        <p className="text-gray-400">Administra usuarios y suscripciones</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Buscar por email..."
          className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:border-teal-500"
        />
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-700/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Plan</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Vence</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Días</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {usuarios.map((user) => {
              const daysRemaining = getDaysRemaining(user.suscripcion_hasta);
              return (
                <tr key={user.id} className="hover:bg-slate-700/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-white">{user.email}</span>
                      {user.is_admin && (
                        <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">Admin</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.plan}
                      onChange={(e) => updatePlan(user.id, e.target.value)}
                      className={`px-2 py-1 rounded text-xs font-medium bg-slate-900 border border-slate-600 ${getPlanColor(user.plan)}`}
                    >
                      <option value="FREE_TRIAL">Trial</option>
                      <option value="PREMIUM">Premium</option>
                      <option value="EXPIRED">Expirado</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">
                    {new Date(user.suscripcion_hasta).toLocaleDateString('es-CL')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-mono ${daysRemaining > 7 ? 'text-emerald-400' : daysRemaining > 0 ? 'text-amber-400' : 'text-red-400'}`}>
                      {daysRemaining > 0 ? `${daysRemaining}d` : 'Vencido'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => extendSubscription(user.id)}
                      className="px-2 py-1 bg-teal-500/20 text-teal-400 rounded text-xs hover:bg-teal-500/30 flex items-center gap-1"
                    >
                      <Calendar className="w-3 h-3" />
                      +30 días
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-gray-400 text-sm">Página {page} de {totalPages}</p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-gray-400 hover:text-white disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-gray-400 hover:text-white disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
