'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Zap, Star, TrendingUp, Clock, ChevronLeft, AlertCircle,
  CheckCircle, Loader2, ArrowRight, Target, Flame
} from 'lucide-react';
import { picksAPI, misApuestasAPI, miBancaAPI } from '@/lib/api';

interface Pick {
  id: number;
  tipster: string;
  tipster_id: number;
  apuesta: string;
  cuota: number;
  ev_estimado: number;
  tipo_mercado: string;
  confianza: number; // 1, 2, 3
  stake_sugerido: number;
  stake_porcentaje: number;
  ganancia_potencial: number;
  racha_tipster: number;
  created_at: string;
}

interface BancaInfo {
  banca_actual: number;
  perfil_riesgo: string;
}

// Modal para registrar apuesta
const RegistrarModal = ({ 
  pick, 
  banca,
  onClose, 
  onSuccess 
}: { 
  pick: Pick; 
  banca: number;
  onClose: () => void; 
  onSuccess: () => void;
}) => {
  const [cuotaUsuario, setCuotaUsuario] = useState(pick.cuota.toString());
  const [stake, setStake] = useState(pick.stake_sugerido.toString());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const cuotaNum = parseFloat(cuotaUsuario) || 0;
  const stakeNum = parseFloat(stake) || 0;
  const gananciaEstimada = stakeNum * (cuotaNum - 1);
  const porcentajeBanca = banca > 0 ? (stakeNum / banca) * 100 : 0;

  const handleSubmit = async () => {
    if (cuotaNum <= 1) {
      setError('La cuota debe ser mayor a 1');
      return;
    }
    if (stakeNum <= 0) {
      setError('El stake debe ser mayor a 0');
      return;
    }
    if (stakeNum > banca) {
      setError('El stake no puede ser mayor a tu banca');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await misApuestasAPI.crear({
        apuesta_sistema_id: pick.id,
        tipster_id: pick.tipster_id,
        descripcion: pick.apuesta,
        cuota_usuario: cuotaNum,
        stake: stakeNum
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrar apuesta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-[#1E293B] rounded-2xl max-w-md w-full p-6 animate-fadeInUp">
        <h3 className="text-xl font-bold text-white mb-4">Registrar Apuesta</h3>
        
        {/* Info del pick */}
        <div className="bg-[#0F172A] rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-[#00D1B2] font-medium">{pick.tipster}</span>
            <div className="flex">
              {[...Array(pick.confianza)].map((_, i) => (
                <Star key={i} className="h-3 w-3 text-[#FFDD57] fill-[#FFDD57]" />
              ))}
            </div>
          </div>
          <p className="text-white">{pick.apuesta}</p>
          <p className="text-xs text-[#64748B] mt-2">Cuota referencia: @{pick.cuota}</p>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="text-sm text-[#94A3B8] mb-1.5 block">Tu cuota (de tu casa de apuestas)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">@</span>
              <input
                type="number"
                step="0.01"
                value={cuotaUsuario}
                onChange={(e) => setCuotaUsuario(e.target.value)}
                className="w-full bg-[#0F172A] border border-[#334155] rounded-lg py-2.5 pl-8 pr-4 text-white font-mono focus:border-[#00D1B2] outline-none"
                placeholder="1.75"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-[#94A3B8] mb-1.5 block">
              Stake <span className="text-[#64748B]">(Sugerido: ${pick.stake_sugerido.toLocaleString()})</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">$</span>
              <input
                type="number"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                className="w-full bg-[#0F172A] border border-[#334155] rounded-lg py-2.5 pl-8 pr-4 text-white font-mono focus:border-[#00D1B2] outline-none"
                placeholder="15000"
              />
            </div>
            <p className="text-xs text-[#64748B] mt-1">
              {porcentajeBanca.toFixed(1)}% de tu banca
            </p>
          </div>

          {/* Preview ganancia */}
          <div className="bg-[#00D1B2]/10 rounded-lg p-3 border border-[#00D1B2]/20">
            <div className="flex justify-between text-sm">
              <span className="text-[#94A3B8]">Ganancia potencial</span>
              <span className="text-[#00D1B2] font-mono font-bold">
                +${gananciaEstimada.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-[#334155] text-[#94A3B8] hover:bg-[#334155] transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-lg bg-[#00D1B2] text-white font-medium hover:bg-[#00D1B2]/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Registrar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function PicksRecomendadosPage() {
  const [picks, setPicks] = useState<Pick[]>([]);
  const [bancaInfo, setBancaInfo] = useState<BancaInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPick, setSelectedPick] = useState<Pick | null>(null);
  const [filter, setFilter] = useState<'todos' | 'alta' | 'media'>('todos');

  const fetchData = async () => {
    try {
      const [picksData, bancaData] = await Promise.all([
        picksAPI.getRecomendados().catch(() => ({ picks: [], total: 0 })),
        miBancaAPI.getEstado().catch(() => ({ banca_actual: 0, perfil_riesgo: 'moderado' }))
      ]);
      setPicks(picksData.picks || []);
      const bancaActual = parseFloat(bancaData?.banca_actual) || 0;
      if (bancaActual > 0) {
        setBancaInfo({
          banca_actual: bancaActual,
          perfil_riesgo: bancaData?.perfil_riesgo || 'moderado'
        });
      } else {
        setBancaInfo(null);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApuestaRegistrada = () => {
    setSelectedPick(null);
    fetchData(); // Refrescar para quitar el pick apostado
  };

  const filteredPicks = picks.filter(p => {
    if (filter === 'alta') return p.confianza === 3;
    if (filter === 'media') return p.confianza >= 2;
    return true;
  });

  const getConfianzaLabel = (nivel: number) => {
    if (nivel === 3) return { text: 'Alta Confianza', color: 'text-[#00D1B2]', bg: 'bg-[#00D1B2]/10' };
    if (nivel === 2) return { text: 'Confianza Media', color: 'text-[#FFDD57]', bg: 'bg-[#FFDD57]/10' };
    return { text: 'Valor Detectado', color: 'text-[#94A3B8]', bg: 'bg-[#94A3B8]/10' };
  };

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
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Zap className="h-6 w-6 text-[#00D1B2]" />
            Picks Recomendados
          </h1>
          <p className="text-[#94A3B8] mt-1">
            Stakes calculados para tu banca de ${bancaInfo?.banca_actual?.toLocaleString() || '0'}
          </p>
        </div>
      </div>

      {/* Info de perfil */}
      {bancaInfo && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[#94A3B8]">Perfil:</span>
          <span className={`px-2 py-0.5 rounded ${
            bancaInfo.perfil_riesgo === 'conservador' ? 'bg-blue-500/10 text-blue-400' :
            bancaInfo.perfil_riesgo === 'moderado' ? 'bg-[#FFDD57]/10 text-[#FFDD57]' :
            'bg-[#EF4444]/10 text-[#EF4444]'
          }`}>
            {bancaInfo.perfil_riesgo}
          </span>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { key: 'todos', label: `Todos (${picks.length})` },
          { key: 'alta', label: `⭐⭐⭐ Alta (${picks.filter(p => p.confianza === 3).length})` },
          { key: 'media', label: `⭐⭐ Media+ (${picks.filter(p => p.confianza >= 2).length})` },
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

      {/* Lista de Picks */}
      {filteredPicks.length === 0 ? (
        <div className="card-elite text-center py-16">
          <Zap className="h-12 w-12 text-[#334155] mx-auto mb-4" />
          <p className="text-[#94A3B8]">No hay picks disponibles en este momento</p>
          <p className="text-sm text-[#64748B] mt-2">Vuelve más tarde para ver nuevas recomendaciones</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPicks.map((pick, index) => {
            const confianza = getConfianzaLabel(pick.confianza);
            
            return (
              <div 
                key={pick.id}
                className="card-elite animate-fadeInUp"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Info Principal */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-[#00D1B2] font-medium">{pick.tipster}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${confianza.bg} ${confianza.color}`}>
                        {[...Array(pick.confianza)].map((_, i) => '⭐').join('')}
                      </span>
                      {pick.racha_tipster >= 3 && (
                        <span className="text-xs px-2 py-0.5 rounded bg-[#EF4444]/10 text-[#EF4444] flex items-center gap-1">
                          <Flame className="h-3 w-3" />
                          W{pick.racha_tipster}
                        </span>
                      )}
                    </div>
                    <p className="text-white font-medium">{pick.apuesta}</p>
                    {pick.tipo_mercado && (
                      <p className="text-xs text-[#64748B] mt-1">{pick.tipo_mercado}</p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 lg:gap-6">
                    <div className="text-center">
                      <p className="text-xs text-[#94A3B8]">Cuota</p>
                      <p className="text-xl font-bold text-white font-mono">@{pick.cuota}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-[#94A3B8]">EV</p>
                      <p className="text-lg font-bold text-[#00D1B2] font-mono">+{pick.ev_estimado}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-[#94A3B8]">Stake</p>
                      <p className="text-lg font-bold text-white font-mono">${pick.stake_sugerido.toLocaleString()}</p>
                      <p className="text-xs text-[#64748B]">{pick.stake_porcentaje}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-[#94A3B8]">Gan. Pot.</p>
                      <p className="text-lg font-bold text-[#00D1B2] font-mono">
                        +${pick.ganancia_potencial.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Botón */}
                  <button
                    onClick={() => setSelectedPick(pick)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#00D1B2] text-white font-medium hover:bg-[#00D1B2]/90 transition-all lg:ml-4"
                  >
                    <Target className="h-4 w-4" />
                    Apostar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {selectedPick && bancaInfo && bancaInfo.banca_actual > 0 && (
        <RegistrarModal
          pick={selectedPick}
          banca={bancaInfo.banca_actual}
          onClose={() => setSelectedPick(null)}
          onSuccess={handleApuestaRegistrada}
        />
      )}

      {/* Footer */}
      <div className="text-xs text-[#64748B] text-center pt-4 border-t border-slate-800/50">
        💡 Los stakes están calculados según tu perfil de riesgo y banca actual
      </div>
    </div>
  );
}
