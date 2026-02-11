'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, CheckCircle, XCircle, Clock, Trash2, 
  TrendingUp, TrendingDown, AlertCircle, Loader2, MoreVertical
} from 'lucide-react';
import { misApuestasAPI } from '@/lib/api';

interface MiApuesta {
  id: number;
  descripcion: string;
  tipster: string;
  tipster_id: number;
  cuota: number;
  stake: number;
  stake_porcentaje: number;
  resultado: 'PENDIENTE' | 'GANADA' | 'PERDIDA' | 'NULA';
  ganancia_neta: number;
  fecha_evento: string | null;
  notas: string | null;
  created_at: string;
  ev_estimado: number | null;
}

interface Totales {
  total: number;
  pendientes: number;
  ganadas: number;
  perdidas: number;
}

// Modal de confirmación
const ConfirmModal = ({ 
  title,
  message,
  confirmText,
  confirmColor,
  onConfirm, 
  onCancel,
  isLoading 
}: { 
  title: string;
  message: string;
  confirmText: string;
  confirmColor: 'green' | 'red' | 'yellow';
  onConfirm: () => void; 
  onCancel: () => void;
  isLoading: boolean;
}) => {
  const colors = {
    green: 'bg-[#00D1B2] hover:bg-[#00D1B2]/90',
    red: 'bg-[#EF4444] hover:bg-[#EF4444]/90',
    yellow: 'bg-[#FFDD57] text-black hover:bg-[#FFDD57]/90'
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-[#1E293B] rounded-2xl max-w-sm w-full p-6 animate-fadeInUp">
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-[#94A3B8] text-sm mb-6">{message}</p>
        
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-lg border border-[#334155] text-[#94A3B8] hover:bg-[#334155] transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2.5 rounded-lg text-white font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${colors[confirmColor]}`}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function MisApuestasPage() {
  const [apuestas, setApuestas] = useState<MiApuesta[]>([]);
  const [totales, setTotales] = useState<Totales>({ total: 0, pendientes: 0, ganadas: 0, perdidas: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'todas' | 'PENDIENTE' | 'GANADA' | 'PERDIDA'>('todas');
  
  const [actionModal, setActionModal] = useState<{
    type: 'resultado' | 'eliminar';
    apuesta: MiApuesta;
    resultado?: 'GANADA' | 'PERDIDA' | 'NULA';
  } | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);

  const fetchApuestas = async () => {
    try {
      const data = await misApuestasAPI.getAll(filter === 'todas' ? undefined : filter);
      setApuestas(data.apuestas || []);
      setTotales(data.totales || { total: 0, pendientes: 0, ganadas: 0, perdidas: 0 });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApuestas();
  }, [filter]);

  const handleMarcarResultado = async () => {
    if (!actionModal || actionModal.type !== 'resultado' || !actionModal.resultado) return;
    
    setIsActionLoading(true);
    try {
      await misApuestasAPI.marcarResultado(actionModal.apuesta.id, actionModal.resultado);
      setActionModal(null);
      fetchApuestas();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleEliminar = async () => {
    if (!actionModal || actionModal.type !== 'eliminar') return;
    
    setIsActionLoading(true);
    try {
      await misApuestasAPI.eliminar(actionModal.apuesta.id);
      setActionModal(null);
      fetchApuestas();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const gananciaTotal = apuestas
    .filter(a => a.resultado !== 'PENDIENTE')
    .reduce((acc, a) => acc + (a.ganancia_neta || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-3 border-[#00D1B2]/30 border-t-[#00D1B2] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/mi-banca" className="p-2 rounded-lg hover:bg-[#1E293B] transition-all">
          <ChevronLeft className="h-5 w-5 text-[#94A3B8]" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Mis Apuestas</h1>
          <p className="text-[#94A3B8] mt-1">Historial de apuestas personales</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="stat-card">
          <p className="text-2xl font-bold text-white font-mono">{totales.total}</p>
          <p className="text-xs text-[#94A3B8]">Total</p>
        </div>
        <div className="stat-card">
          <p className="text-2xl font-bold text-[#00D1B2] font-mono">{totales.ganadas}</p>
          <p className="text-xs text-[#94A3B8]">Ganadas</p>
        </div>
        <div className="stat-card">
          <p className="text-2xl font-bold text-[#EF4444] font-mono">{totales.perdidas}</p>
          <p className="text-xs text-[#94A3B8]">Perdidas</p>
        </div>
        <div className="stat-card">
          <p className="text-2xl font-bold text-[#FFDD57] font-mono">{totales.pendientes}</p>
          <p className="text-xs text-[#94A3B8]">Pendientes</p>
        </div>
        <div className="stat-card col-span-2 lg:col-span-1">
          <p className={`text-2xl font-bold font-mono ${gananciaTotal >= 0 ? 'text-[#00D1B2]' : 'text-[#EF4444]'}`}>
            {gananciaTotal >= 0 ? '+' : ''}${gananciaTotal.toLocaleString()}
          </p>
          <p className="text-xs text-[#94A3B8]">Profit Total</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { key: 'todas', label: `Todas (${totales.total})` },
          { key: 'PENDIENTE', label: `Pendientes (${totales.pendientes})` },
          { key: 'GANADA', label: `Ganadas (${totales.ganadas})` },
          { key: 'PERDIDA', label: `Perdidas (${totales.perdidas})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              filter === tab.key
                ? 'bg-[#00D1B2] text-white'
                : 'bg-[#1E293B] text-[#94A3B8] hover:bg-[#334155]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Lista de Apuestas */}
      {apuestas.length === 0 ? (
        <div className="card-elite text-center py-16">
          <Clock className="h-12 w-12 text-[#334155] mx-auto mb-4" />
          <p className="text-[#94A3B8]">No hay apuestas {filter !== 'todas' ? 'con este filtro' : 'registradas'}</p>
          <Link href="/dashboard/mi-banca/picks" className="inline-block mt-4 text-[#00D1B2] hover:underline">
            Ver picks recomendados →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {apuestas.map((apuesta, index) => (
            <div 
              key={apuesta.id}
              className={`card-elite animate-fadeInUp ${
                apuesta.resultado === 'GANADA' ? 'border-l-4 border-l-[#00D1B2]' :
                apuesta.resultado === 'PERDIDA' ? 'border-l-4 border-l-[#EF4444]' :
                apuesta.resultado === 'NULA' ? 'border-l-4 border-l-[#94A3B8]' :
                'border-l-4 border-l-[#FFDD57]'
              }`}
              style={{ animationDelay: `${index * 0.03}s` }}
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {apuesta.tipster && (
                      <span className="text-sm text-[#00D1B2] font-medium">{apuesta.tipster}</span>
                    )}
                    <span className="text-xs text-[#64748B]">
                      {new Date(apuesta.created_at).toLocaleDateString('es-CL')}
                    </span>
                  </div>
                  <p className="text-white font-medium">{apuesta.descripcion}</p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 lg:gap-6">
                  <div className="text-center">
                    <p className="text-xs text-[#94A3B8]">Cuota</p>
                    <p className="text-xl font-bold text-white font-mono">@{apuesta.cuota}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-[#94A3B8]">Stake</p>
                    <p className="text-lg font-bold text-white font-mono">${apuesta.stake.toLocaleString()}</p>
                  </div>

                  {/* Resultado o Acciones */}
                  {apuesta.resultado === 'PENDIENTE' ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActionModal({ type: 'resultado', apuesta, resultado: 'GANADA' })}
                        className="p-2 rounded-lg bg-[#00D1B2]/10 text-[#00D1B2] hover:bg-[#00D1B2]/20 transition-all"
                        title="Marcar como ganada"
                      >
                        <CheckCircle className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setActionModal({ type: 'resultado', apuesta, resultado: 'PERDIDA' })}
                        className="p-2 rounded-lg bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20 transition-all"
                        title="Marcar como perdida"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setMenuOpen(menuOpen === apuesta.id ? null : apuesta.id)}
                          className="p-2 rounded-lg hover:bg-[#334155] transition-all"
                        >
                          <MoreVertical className="h-5 w-5 text-[#94A3B8]" />
                        </button>
                        {menuOpen === apuesta.id && (
                          <div className="absolute right-0 top-full mt-1 bg-[#1E293B] border border-[#334155] rounded-lg shadow-lg z-10 min-w-[140px]">
                            <button
                              onClick={() => {
                                setMenuOpen(null);
                                setActionModal({ type: 'resultado', apuesta, resultado: 'NULA' });
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-[#94A3B8] hover:bg-[#334155] transition-all"
                            >
                              Marcar Nula
                            </button>
                            <button
                              onClick={() => {
                                setMenuOpen(null);
                                setActionModal({ type: 'eliminar', apuesta });
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-[#EF4444] hover:bg-[#334155] transition-all"
                            >
                              Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-right">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg ${
                        apuesta.resultado === 'GANADA' ? 'bg-[#00D1B2]/10 text-[#00D1B2]' :
                        apuesta.resultado === 'PERDIDA' ? 'bg-[#EF4444]/10 text-[#EF4444]' :
                        'bg-[#94A3B8]/10 text-[#94A3B8]'
                      }`}>
                        {apuesta.resultado === 'GANADA' ? <CheckCircle className="h-4 w-4" /> :
                         apuesta.resultado === 'PERDIDA' ? <XCircle className="h-4 w-4" /> :
                         <Clock className="h-4 w-4" />}
                        <span className="text-sm font-bold">{apuesta.resultado}</span>
                      </div>
                      {apuesta.resultado !== 'NULA' && (
                        <p className={`text-lg font-bold font-mono mt-1 ${
                          apuesta.ganancia_neta >= 0 ? 'text-[#00D1B2]' : 'text-[#EF4444]'
                        }`}>
                          {apuesta.ganancia_neta >= 0 ? '+' : ''}${apuesta.ganancia_neta.toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Notas */}
              {apuesta.notas && (
                <p className="text-sm text-[#64748B] mt-3 pt-3 border-t border-[#334155]">
                  📝 {apuesta.notas}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modales */}
      {actionModal?.type === 'resultado' && actionModal.resultado && (
        <ConfirmModal
          title={`Marcar como ${actionModal.resultado}`}
          message={`¿Confirmas que la apuesta "${actionModal.apuesta.descripcion.substring(0, 50)}..." fue ${actionModal.resultado}?`}
          confirmText={actionModal.resultado}
          confirmColor={
            actionModal.resultado === 'GANADA' ? 'green' :
            actionModal.resultado === 'PERDIDA' ? 'red' : 'yellow'
          }
          onConfirm={handleMarcarResultado}
          onCancel={() => setActionModal(null)}
          isLoading={isActionLoading}
        />
      )}

      {actionModal?.type === 'eliminar' && (
        <ConfirmModal
          title="Eliminar apuesta"
          message={`¿Estás seguro de eliminar esta apuesta? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          confirmColor="red"
          onConfirm={handleEliminar}
          onCancel={() => setActionModal(null)}
          isLoading={isActionLoading}
        />
      )}

      {/* Floating bar mobile */}
      {totales.pendientes > 0 && (
        <div className="fixed bottom-16 left-4 right-4 lg:hidden">
          <div className="rounded-xl p-3 bg-[#FFDD57]/20 border border-[#FFDD57]/30 flex items-center justify-between">
            <span className="text-white font-medium">
              {totales.pendientes} apuesta{totales.pendientes > 1 ? 's' : ''} pendiente{totales.pendientes > 1 ? 's' : ''}
            </span>
            <Clock className="h-5 w-5 text-[#FFDD57]" />
          </div>
        </div>
      )}
    </div>
  );
}
