'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Zap, Star, TrendingUp, Clock, ChevronLeft, AlertCircle, AlertTriangle,
  CheckCircle, Loader2, ArrowRight, Target, Flame, Brain, Shield,
  ChevronDown, ChevronUp, DollarSign, Percent, BarChart3, Eye, Sparkles
} from 'lucide-react';
import { picksAPI, misApuestasAPI, miBancaAPI } from '@/lib/api';
import CombinadaLegs, { esCombinada } from '@/components/CombinadaLegs';

interface Pick {
  id: number;
  tipster: string;
  tipster_id: number;
  apuesta: string;
  cuota: number;
  ev_estimado: number;
  tipo_mercado: string;
  confianza: number;
  stake_sugerido: number;
  stake_porcentaje: number;
  ganancia_potencial: number;
  racha_tipster: number;
  hora_partido?: string;
  neuroscore?: number;
  zona?: string;
  zona_color?: string;
  veredicto?: string;
  factores?: { nombre: string; valor: number; impacto: string }[];
  alerts?: string[];
  created_at: string;
}

interface BancaInfo {
  banca_actual: number;
  perfil_riesgo: string;
}

// ============================================================================
// NeuroScore Circle
// ============================================================================
const NeuroScoreCircle = ({ score, size = 56 }: { score: number; size?: number }) => {
  const color = score >= 75 ? '#22C55E' : score >= 50 ? '#F59E0B' : '#EF4444';
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 85) * circumference;
  const zona = score >= 72 ? 'ORO' : score >= 45 ? 'NEUTRA' : 'RIESGO';

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="relative" style={{ width: `${size}px`, height: `${size}px` }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" />
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth="3.5"
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.2s ease-out' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-bold font-mono" style={{ color, fontSize: size > 50 ? '16px' : '13px' }}>{score}</span>
        </div>
      </div>
      <span className="text-[9px] font-bold tracking-wider" style={{ color }}>
        {zona === 'ORO' ? '🟢 ORO' : zona === 'NEUTRA' ? '🟡 NEU' : '🔴 RIE'}
      </span>
    </div>
  );
};

// ============================================================================
// Factores Detail (expandible)
// ============================================================================
const FactoresDetail = ({ pick }: { pick: Pick }) => {
  const [open, setOpen] = useState(false);

  const impactoColors: Record<string, string> = {
    muy_positivo: '#00D1FF', positivo: '#34D399', neutral: '#94A3B8',
    negativo: '#F59E0B', muy_negativo: '#EF4444',
  };

  if (!pick.factores?.length && !pick.veredicto) return null;

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs transition-all"
        style={{ color: 'rgba(255, 107, 157, 0.9)' }}
      >
        <Brain className="h-3 w-3" />
        <span>NeuroScore {pick.neuroscore}/85</span>
        {pick.ev_estimado > 0 && (
          <span className="text-[#00D1FF] font-mono font-bold">+{pick.ev_estimado}% EV</span>
        )}
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {open && (
        <div className="mt-2 p-3 rounded-lg animate-fadeIn" style={{
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(0, 209, 255, 0.1)',
        }}>
          {pick.veredicto && (
            <p className="text-xs text-[#94A3B8] mb-3 italic">&quot;{pick.veredicto}&quot;</p>
          )}
          {pick.factores?.map((f, i) => (
            <div key={i} className="mb-2 last:mb-0">
              <div className="flex justify-between text-xs mb-0.5">
                <span className="text-[#94A3B8]">{f.nombre}</span>
                <span style={{ color: impactoColors[f.impacto] || '#94A3B8' }} className="font-mono">
                  {f.valor}/85
                </span>
              </div>
              <div className="h-1 rounded-full bg-[#1E293B] overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{
                  width: `${f.valor}%`,
                  background: impactoColors[f.impacto] || '#94A3B8',
                }} />
              </div>
            </div>
          ))}
          {pick.alerts && pick.alerts.length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-700/50">
              {pick.alerts.map((alert, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-[#F59E0B]">
                  <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                  <span>{alert}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Modal Registrar Apuesta (premium)
// ============================================================================
const RegistrarModal = ({ pick, banca, onClose, onSuccess }: { 
  pick: Pick; banca: number; onClose: () => void; onSuccess: () => void;
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
    if (cuotaNum <= 1) { setError('La cuota debe ser mayor a 1'); return; }
    if (stakeNum <= 0) { setError('El stake debe ser mayor a 0'); return; }
    if (stakeNum > banca) { setError('El stake no puede ser mayor a tu banca'); return; }
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="rounded-2xl max-w-md w-full p-6 animate-fadeInUp" style={{
        background: 'linear-gradient(145deg, #1E293B 0%, #0F172A 100%)',
        border: '1px solid rgba(0, 209, 255, 0.2)',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 209, 255, 0.05)',
      }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Target className="h-5 w-5 text-[#00D1FF]" />
            Registrar Apuesta
          </h3>
          {pick.neuroscore && <NeuroScoreCircle score={pick.neuroscore} size={44} />}
        </div>
        
        <div className="rounded-xl p-4 mb-5" style={{
          background: 'rgba(0, 209, 255, 0.05)',
          border: '1px solid rgba(0, 209, 255, 0.15)',
        }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-[#00D1FF] font-medium">{pick.tipster}</span>
            <div className="flex">
              {[...Array(pick.confianza)].map((_, i) => (
                <Star key={i} className="h-3 w-3 text-[#FFDD57] fill-[#FFDD57]" />
              ))}
            </div>
          </div>
          {esCombinada({ tipo_mercado: pick.tipo_mercado, apuesta: pick.apuesta }) ? (
            <CombinadaLegs
              textoApuesta={pick.apuesta}
              cuotaTotal={pick.cuota}
              compact
            />
          ) : (
            <>
              <p className="text-white text-sm">{pick.apuesta}</p>
              <p className="text-xs text-[#64748B] mt-2">Cuota referencia: @{pick.cuota}</p>
            </>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-[#94A3B8] mb-1.5 block">Tu cuota</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">@</span>
              <input type="number" step="0.01" value={cuotaUsuario}
                onChange={(e) => setCuotaUsuario(e.target.value)}
                className="w-full bg-[#0F172A] border border-[#334155] rounded-lg py-2.5 pl-8 pr-4 text-white font-mono focus:border-[#00D1FF] outline-none transition-colors" />
            </div>
          </div>
          <div>
            <label className="text-sm text-[#94A3B8] mb-1.5 block">
              Stake <span className="text-[#64748B]">(Sugerido: ${pick.stake_sugerido.toLocaleString()})</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">$</span>
              <input type="number" value={stake}
                onChange={(e) => setStake(e.target.value)}
                className="w-full bg-[#0F172A] border border-[#334155] rounded-lg py-2.5 pl-8 pr-4 text-white font-mono focus:border-[#00D1FF] outline-none transition-colors" />
            </div>
            <p className="text-xs text-[#64748B] mt-1">{porcentajeBanca.toFixed(1)}% de tu banca</p>
          </div>

          <div className="rounded-lg p-3" style={{
            background: 'linear-gradient(135deg, rgba(0, 209, 255, 0.08), rgba(0, 209, 255, 0.02))',
            border: '1px solid rgba(0, 209, 255, 0.2)',
          }}>
            <div className="flex justify-between text-sm">
              <span className="text-[#94A3B8]">Ganancia potencial</span>
              <span className="text-[#00D1FF] font-mono font-bold">
                +${gananciaEstimada.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[#334155] text-[#94A3B8] hover:bg-[#1E293B] transition-all font-medium">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl text-white font-bold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #00D1FF, #00B8E6)',
              boxShadow: '0 4px 15px rgba(0, 209, 255, 0.3)',
            }}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle className="h-4 w-4" />Confirmar</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN PAGE
// ============================================================================
export default function PicksRecomendadosPage() {
  const [picks, setPicks] = useState<Pick[]>([]);
  const [bancaInfo, setBancaInfo] = useState<BancaInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPick, setSelectedPick] = useState<Pick | null>(null);
  const [filter, setFilter] = useState<'todos' | 'oro' | 'media'>('todos');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [requiereSetup, setRequiereSetup] = useState(false);
  const [fetchError, setFetchError] = useState('');

  const fetchData = async () => {
    try {
      setFetchError('');

      // ★ Calls independientes — si uno falla, el otro sigue
      let picksOk = false;
      let bancaOk = false;

      const [picksData, bancaData] = await Promise.all([
        picksAPI.getRecomendados()
          .then((data: any) => { picksOk = true; return data; })
          .catch(() => ({ picks: [], total: 0, requiere_setup: false })),
        miBancaAPI.getEstado()
          .then((data: any) => { bancaOk = true; return data; })
          .catch(() => ({ onboarding_completo: false, banca_actual: 0 }))
      ]);

      // ★ Si AMBAS fallaron → error de red
      if (!picksOk && !bancaOk) {
        setFetchError('Sin conexión. Toca para reintentar.');
        setPicks([]);
        setBancaInfo(null);
        return;
      }

      // ★ Detectar si backend pide configurar banca
      if (picksData.requiere_setup || (bancaOk && !bancaData.onboarding_completo)) {
        setRequiereSetup(true);
      } else {
        setRequiereSetup(false);
      }

      // ★ Setear picks (siempre safe)
      setPicks(picksData.picks || []);

      // ★ Solo setear bancaInfo si hay banca real (> 0)
      const bancaActual = parseFloat(bancaData?.banca_actual) || 0;
      if (bancaActual > 0) {
        setBancaInfo({
          banca_actual: bancaActual,
          perfil_riesgo: bancaData?.perfil_riesgo || 'moderado'
        });
      } else {
        setBancaInfo(null);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error cargando picks:', error);
      setFetchError('Error al cargar datos. Toca para reintentar.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 120000);
    return () => clearInterval(interval);
  }, []);

  const handleApuestaRegistrada = () => {
    setSelectedPick(null);
    fetchData();
  };

  const filteredPicks = picks.filter(p => {
    if (filter === 'oro') return (p.neuroscore || 0) >= 75 || p.confianza === 3;
    if (filter === 'media') return (p.neuroscore || 0) >= 50 || p.confianza >= 2;
    return true;
  });

  const oroCount = picks.filter(p => (p.neuroscore || 0) >= 75 || p.confianza === 3).length;
  const mediaCount = picks.filter(p => (p.neuroscore || 0) >= 50 || p.confianza >= 2).length;

  const totalGanPotencial = filteredPicks.reduce((sum, p) => sum + (p.ganancia_potencial || 0), 0);
  const totalStake = filteredPicks.reduce((sum, p) => sum + (p.stake_sugerido || 0), 0);
  const avgScore = filteredPicks.length > 0 
    ? Math.round(filteredPicks.reduce((sum, p) => sum + (p.neuroscore || 50), 0) / filteredPicks.length) 
    : 0;

  const getZonaBorder = (pick: Pick) => {
    const score = pick.neuroscore || 50;
    if (score >= 75) return 'rgba(0, 209, 255, 0.35)';
    if (score >= 50) return 'rgba(255, 187, 0, 0.25)';
    return 'rgba(239, 68, 68, 0.25)';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="relative">
          <div className="w-12 h-12 border-3 border-[#00D1FF]/20 border-t-[#00D1FF] rounded-full animate-spin" />
          <Brain className="h-5 w-5 text-[#00D1FF] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-[#94A3B8] text-sm">Analizando picks con IA...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fadeIn pb-20 lg:pb-6">
      {/* ================================================================ */}
      {/* HEADER PREMIUM                                                    */}
      {/* ================================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl" style={{
              background: 'linear-gradient(135deg, rgba(0, 209, 255, 0.15), rgba(0, 209, 255, 0.05))',
              border: '1px solid rgba(0, 209, 255, 0.2)',
            }}>
              <Brain className="h-5 w-5" style={{ color: '#FF6B9D' }} />
            </div>
            Recomendaciones IA
          </h1>
          <p className="text-[#94A3B8] text-sm mt-1">
            Análisis inteligente basado en rendimiento
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#64748B]">
            Actualizado {lastUpdate.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <div className="w-2 h-2 rounded-full bg-[#00D1FF] animate-pulse" />
        </div>
      </div>

      {/* ================================================================ */}
      {/* RESUMEN CARDS                                                     */}
      {/* ================================================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Picks Activos */}
        <div className="rounded-xl p-4" style={{
          background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
          border: '1px solid rgba(0, 209, 255, 0.15)',
        }}>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-[#00D1FF]" />
            <span className="text-xs text-[#94A3B8]">Picks Activos</span>
          </div>
          <p className="text-2xl font-bold font-mono text-white">{picks.length}</p>
          <p className="text-xs text-[#00D1FF] mt-0.5">{oroCount} zona oro</p>
        </div>

        {/* Score Promedio */}
        <div className="rounded-xl p-4" style={{
          background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
          border: '1px solid rgba(255, 187, 0, 0.15)',
        }}>
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-4 w-4 text-[#F59E0B]" />
            <span className="text-xs text-[#94A3B8]">Score Promedio</span>
          </div>
          <p className="text-2xl font-bold font-mono" style={{ color: avgScore >= 75 ? '#00D1FF' : avgScore >= 50 ? '#F59E0B' : '#EF4444' }}>
            {avgScore}/85
          </p>
        </div>

        {/* Inversión Sugerida */}
        <div className="rounded-xl p-4" style={{
          background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
          border: '1px solid rgba(255, 221, 87, 0.15)',
        }}>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-[#FFDD57]" />
            <span className="text-xs text-[#94A3B8]">Inversión</span>
          </div>
          <p className="text-2xl font-bold font-mono text-white">${totalStake.toLocaleString()}</p>
          <p className="text-xs text-[#64748B] mt-0.5">
            {bancaInfo && bancaInfo.banca_actual > 0 ? `${((totalStake / bancaInfo.banca_actual) * 100).toFixed(1)}% banca` : ''}
          </p>
        </div>

        {/* Ganancia Potencial */}
        <div className="rounded-xl p-4" style={{
          background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
          border: '1px solid rgba(0, 209, 255, 0.25)',
        }}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-[#00D1FF]" />
            <span className="text-xs text-[#94A3B8]">Gan. Potencial</span>
          </div>
          <p className="text-2xl font-bold font-mono text-[#00D1FF]">+${totalGanPotencial.toLocaleString()}</p>
        </div>
      </div>

      {/* ================================================================ */}
      {/* PERFIL + FILTROS                                                  */}
      {/* ================================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { key: 'todos', label: `Todos (${picks.length})`, icon: null },
            { key: 'oro', label: `Oro (${oroCount})`, icon: '🟢' },
            { key: 'media', label: `Media+ (${mediaCount})`, icon: '🟡' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className="px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all"
              style={{
                background: filter === tab.key
                  ? 'linear-gradient(135deg, #00D1FF, #00B8E6)'
                  : 'rgba(30, 41, 59, 0.8)',
                color: filter === tab.key ? 'white' : '#94A3B8',
                border: filter === tab.key ? 'none' : '1px solid rgba(255,255,255,0.06)',
                boxShadow: filter === tab.key ? '0 4px 12px rgba(0, 209, 255, 0.25)' : 'none',
              }}
            >
              {tab.icon && <span className="mr-1">{tab.icon}</span>}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Perfil */}
        {bancaInfo && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-[#64748B]">Perfil:</span>
            <span className="px-3 py-1 rounded-lg font-medium" style={{
              background: bancaInfo.perfil_riesgo === 'conservador' ? 'rgba(59, 130, 246, 0.1)' :
                bancaInfo.perfil_riesgo === 'moderado' ? 'rgba(255, 221, 87, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: bancaInfo.perfil_riesgo === 'conservador' ? '#60A5FA' :
                bancaInfo.perfil_riesgo === 'moderado' ? '#FFDD57' : '#EF4444',
              border: `1px solid ${bancaInfo.perfil_riesgo === 'conservador' ? 'rgba(59, 130, 246, 0.2)' :
                bancaInfo.perfil_riesgo === 'moderado' ? 'rgba(255, 221, 87, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            }}>
              <Shield className="h-3 w-3 inline mr-1" />
              {bancaInfo.perfil_riesgo.charAt(0).toUpperCase() + bancaInfo.perfil_riesgo.slice(1)}
            </span>
            <span className="text-[#94A3B8] font-mono">${bancaInfo.banca_actual.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/* ERROR STATE                                                       */}
      {/* ================================================================ */}
      {fetchError && !isLoading && (
        <button 
          onClick={() => { setFetchError(''); setIsLoading(true); fetchData(); }}
          className="w-full rounded-2xl p-6 text-center transition-all hover:scale-[1.01] active:scale-[0.99]"
          style={{
            background: 'linear-gradient(135deg, rgba(239,68,68,0.06), rgba(30,41,59,0.9))',
            border: '1px solid rgba(239,68,68,0.2)',
          }}
        >
          <AlertCircle className="h-10 w-10 text-[#EF4444] mx-auto mb-3" />
          <h3 className="text-white font-bold mb-1">Error de conexión</h3>
          <p className="text-[#94A3B8] text-sm">{fetchError}</p>
          <span className="inline-flex items-center gap-2 mt-3 text-[#00D1FF] text-sm font-medium">
            🔄 Toca para reintentar
          </span>
        </button>
      )}

      {/* ================================================================ */}
      {/* REQUIERE SETUP BANCA                                              */}
      {/* ================================================================ */}
      {requiereSetup && !isLoading && !fetchError && (
        <div className="rounded-2xl p-6 text-center" style={{
          background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(30,41,59,0.9))',
          border: '1px solid rgba(245,158,11,0.25)',
        }}>
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(255,221,87,0.1)' }}>
            <Zap className="h-8 w-8 text-[#FFDD57]" />
          </div>
          <h3 className="text-white font-bold text-lg mb-2">Configura tu banca primero</h3>
          <p className="text-[#94A3B8] text-sm mb-4 max-w-sm mx-auto">
            Para ver picks con stakes personalizados según tu perfil de riesgo, necesitas configurar tu banca.
          </p>
          <Link href="/dashboard/mi-banca/setup"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #FFDD57, #D4A843)',
              color: '#0F172A',
              boxShadow: '0 4px 15px rgba(255, 221, 87, 0.25)',
            }}>
            <Target className="h-5 w-5" />
            Configurar Mi Banca
          </Link>
        </div>
      )}

      {/* ================================================================ */}
      {/* LISTA DE PICKS                                                    */}
      {/* ================================================================ */}
      {filteredPicks.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{
          background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.5), rgba(15, 23, 42, 0.5))',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <Brain className="h-14 w-14 text-[#334155] mx-auto mb-4" />
          <p className="text-[#94A3B8] text-lg font-medium">Sin picks en este filtro</p>
          <p className="text-sm text-[#64748B] mt-2 max-w-sm mx-auto">
            {filter !== 'todos' ? 'Prueba con el filtro "Todos" para ver más opciones' : 'Las recomendaciones aparecerán cuando haya picks del día analizados por la IA'}
          </p>
          {filter !== 'todos' && (
            <button onClick={() => setFilter('todos')}
              className="mt-4 px-4 py-2 rounded-lg text-sm text-[#00D1FF] border border-[#00D1FF]/30 hover:bg-[#00D1FF]/10 transition-all">
              Ver todos los picks
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPicks.map((pick, index) => {
            const score = pick.neuroscore || 50;
            const isOro = score >= 75 || pick.confianza === 3;

            return (
              <div 
                key={pick.id}
                className="rounded-xl overflow-hidden animate-fadeInUp"
                style={{ 
                  animationDelay: `${index * 0.04}s`,
                  background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))',
                  border: `1px solid ${getZonaBorder(pick)}`,
                  boxShadow: isOro ? '0 0 20px rgba(0, 209, 255, 0.06)' : 'none',
                }}
              >
                <div className="p-4 lg:p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* LEFT: Info */}
                    <div className="flex-1 min-w-0">
                      {/* Tipster + Badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-[#00D1FF]">{pick.tipster}</span>
                        {pick.tipo_mercado && (
                          <span className="text-[10px] px-2 py-0.5 rounded font-medium"
                            style={{ background: 'rgba(255, 221, 87, 0.1)', color: '#FFDD57', border: '1px solid rgba(255, 221, 87, 0.2)' }}>
                            {pick.tipo_mercado}
                          </span>
                        )}
                        {isOro && (
                          <span className="text-[10px] px-2 py-0.5 rounded font-bold"
                            style={{ background: 'rgba(0, 209, 255, 0.1)', color: '#00D1FF', border: '1px solid rgba(0, 209, 255, 0.2)' }}>
                            🧠 IA APROBADA
                          </span>
                        )}
                        {pick.racha_tipster >= 3 && (
                          <span className="text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-0.5"
                            style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
                            <Flame className="h-2.5 w-2.5" />W{pick.racha_tipster}
                          </span>
                        )}
                      </div>

                      {/* Apuesta */}
                      {/* Apuesta — Combinadas con legs individuales */}
                      {esCombinada({ tipo_mercado: pick.tipo_mercado, apuesta: pick.apuesta }) ? (
                        <CombinadaLegs
                          textoApuesta={pick.apuesta}
                          cuotaTotal={pick.cuota}
                        />
                      ) : (
                        <p className="text-white font-medium text-sm lg:text-base leading-snug">{pick.apuesta}</p>
                      )}

                      {/* Hora */}
                      {pick.hora_partido && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <Clock className="h-3 w-3 text-[#64748B]" />
                          <span className="text-xs text-[#64748B]">{pick.hora_partido}</span>
                        </div>
                      )}

                      {/* NeuroScore expandible */}
                      <FactoresDetail pick={pick} />
                    </div>

                    {/* RIGHT: Stats + Button */}
                    <div className="flex items-center gap-3 lg:gap-5 flex-shrink-0">
                      {/* NeuroScore Circle */}
                      <NeuroScoreCircle score={score} size={52} />

                      {/* Stats column */}
                      <div className="flex flex-col gap-1 min-w-[80px]">
                        <div className="flex items-baseline gap-1">
                          <span className="text-xs text-[#64748B]">Cuota</span>
                          <span className="text-lg font-bold text-white font-mono ml-auto">@{pick.cuota}</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xs text-[#64748B]">Stake</span>
                          <span className="text-sm font-bold text-[#FFDD57] font-mono ml-auto">${pick.stake_sugerido.toLocaleString()}</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xs text-[#64748B]">Gan.</span>
                          <span className="text-sm font-bold text-[#00D1FF] font-mono ml-auto">+${pick.ganancia_potencial.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* CTA Button */}
                      <button
                        onClick={() => bancaInfo && bancaInfo.banca_actual > 0 ? setSelectedPick(pick) : null}
                        disabled={!bancaInfo || bancaInfo.banca_actual <= 0}
                        title={!bancaInfo ? 'Configura tu banca primero' : ''}
                        className="px-5 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                        style={{
                          background: isOro 
                            ? 'linear-gradient(135deg, #00D1FF, #00B8E6)' 
                            : 'linear-gradient(135deg, #334155, #1E293B)',
                          color: 'white',
                          boxShadow: isOro ? '0 4px 15px rgba(0, 209, 255, 0.3)' : 'none',
                          border: isOro ? 'none' : '1px solid rgba(255,255,255,0.1)',
                        }}
                      >
                        <Target className="h-4 w-4" />
                        {bancaInfo && bancaInfo.banca_actual > 0 ? 'Apostar' : 'Sin banca'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom gradient bar */}
                <div className="h-0.5" style={{
                  background: score >= 75 
                    ? 'linear-gradient(90deg, #00D1FF, transparent)' 
                    : score >= 50 
                      ? 'linear-gradient(90deg, #F59E0B, transparent)' 
                      : 'linear-gradient(90deg, #EF4444, transparent)',
                  opacity: 0.6,
                }} />
              </div>
            );
          })}
        </div>
      )}

      {/* ================================================================ */}
      {/* LINK A CENTRO OPERACIONES                                        */}
      {/* ================================================================ */}
      <div className="flex justify-center pt-2">
        <Link href="/dashboard/apuestas"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.02]"
          style={{
            background: 'rgba(30, 41, 59, 0.8)',
            color: '#94A3B8',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
          <Eye className="h-4 w-4" />
          Ver todas las apuestas del día
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* ================================================================ */}
      {/* TIPSTERS PARA SEGUIR + ZONA RIESGO (mantenemos sección original) */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tipsters recomendados */}
        <div className="rounded-xl p-5" style={{
          background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
          border: '1px solid rgba(0, 209, 255, 0.12)',
        }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-[#00D1FF]" />
            <h3 className="font-bold text-white">Tipsters para Seguir</h3>
          </div>
          <p className="text-xs text-[#94A3B8]">Alto rendimiento comprobado</p>
          {picks.length > 0 ? (
            <div className="space-y-2 mt-3">
              {Array.from(new Map(picks.filter(p => (p.neuroscore || 0) >= 70).map(p => [p.tipster, p] as [string, Pick])).values())
                .slice(0, 3)
                .map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg" style={{
                    background: 'rgba(0, 209, 255, 0.05)',
                  }}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: 'rgba(0, 209, 255, 0.15)', color: '#00D1FF' }}>
                        {p.tipster.charAt(0)}
                      </div>
                      <span className="text-sm text-white font-medium">{p.tipster}</span>
                    </div>
                    <span className="text-xs text-[#00D1FF] font-mono">Score {p.neuroscore}</span>
                  </div>
                ))}
              {picks.filter(p => (p.neuroscore || 0) >= 70).length === 0 && (
                <p className="text-[#64748B] text-sm text-center py-4">No hay suficientes datos para generar recomendaciones</p>
              )}
            </div>
          ) : (
            <p className="text-[#64748B] text-sm text-center py-4 mt-2">No hay suficientes datos para generar recomendaciones</p>
          )}
        </div>

        {/* Zona de riesgo */}
        <div className="rounded-xl p-5" style={{
          background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
          border: '1px solid rgba(239, 68, 68, 0.12)',
        }}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-[#EF4444]" />
            <h3 className="font-bold text-white">Zona de Riesgo</h3>
          </div>
          <p className="text-xs text-[#94A3B8]">Considerar evitar o reducir stake</p>
          {picks.filter(p => (p.neuroscore || 0) < 50).length > 0 ? (
            <div className="space-y-2 mt-3">
              {Array.from(new Map(picks.filter(p => (p.neuroscore || 0) < 50).map(p => [p.tipster, p] as [string, Pick])).values())
                .slice(0, 3)
                .map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg" style={{
                    background: 'rgba(239, 68, 68, 0.05)',
                  }}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' }}>
                        {p.tipster.charAt(0)}
                      </div>
                      <span className="text-sm text-white font-medium">{p.tipster}</span>
                    </div>
                    <span className="text-xs text-[#EF4444] font-mono">Score {p.neuroscore || '?'}</span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-[#64748B] text-sm text-center py-4 mt-2">Sin tipsters en zona de riesgo hoy ✅</p>
          )}
        </div>
      </div>

      {/* ================================================================ */}
      {/* CONSEJOS                                                          */}
      {/* ================================================================ */}
      <div className="rounded-xl p-5" style={{
        background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.5), rgba(15, 23, 42, 0.5))',
        border: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-[#FFDD57]" />
          <h3 className="font-bold text-white text-sm">Consejos del Sistema</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { icon: '📊', title: 'Diversifica', desc: 'No apuestes más del 30% de tu banca en un solo tipster', color: '#60A5FA' },
            { icon: '🎯', title: 'Sigue las rachas', desc: 'Aumenta stake en tipsters con racha positiva W3+', color: '#00D1FF' },
            { icon: '⚠️', title: 'Gestiona riesgo', desc: 'Reduce o pausa tipsters con racha negativa L3+', color: '#FFDD57' },
          ].map((c, i) => (
            <div key={i} className="p-3 rounded-lg" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
              <p className="font-medium text-sm mb-1" style={{ color: c.color }}>
                {c.icon} {c.title}
              </p>
              <p className="text-xs text-[#64748B]">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ================================================================ */}
      {/* BANCA BAR                                                         */}
      {/* ================================================================ */}
      {bancaInfo && (
        <div className="rounded-xl p-4 flex items-center justify-between" style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))',
          border: '1px solid rgba(255, 221, 87, 0.15)',
        }}>
          <div>
            <p className="text-xs text-[#94A3B8]">Tu banca actual</p>
            <p className="text-xl font-bold font-mono text-white">${bancaInfo.banca_actual.toLocaleString()}</p>
          </div>
          <Link href="/dashboard/mi-banca"
            className="px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, #FFDD57, #D4A843)',
              color: '#0F172A',
              boxShadow: '0 4px 12px rgba(255, 221, 87, 0.2)',
            }}>
            Ver Mi Banca
          </Link>
        </div>
      )}

      {/* Footer */}
      <div className="text-xs text-[#64748B] text-center pt-2 border-t border-slate-800/50">
        💡 Los stakes están calculados según tu perfil de riesgo y banca actual · NeuroScore v2.0
      </div>

      {/* Modal */}
      {selectedPick && bancaInfo && bancaInfo.banca_actual > 0 && (
        <RegistrarModal
          pick={selectedPick}
          banca={bancaInfo.banca_actual}
          onClose={() => setSelectedPick(null)}
          onSuccess={handleApuestaRegistrada}
        />
      )}
    </div>
  );
}

