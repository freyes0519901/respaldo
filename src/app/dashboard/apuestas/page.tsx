'use client';

import { useEffect, useState } from 'react';
import { 
  Calendar, CheckCircle, XCircle, Clock, Zap, TrendingUp, 
  TrendingDown, Filter, Activity, Eye, Target, BarChart3, 
  Brain, Shield, ChevronDown, ChevronUp, AlertTriangle
} from 'lucide-react';
import { apuestasAPI } from '@/lib/api';
import CombinadaLegs, { esCombinada } from '@/components/CombinadaLegs';

// ============================================================================
// TYPES
// ============================================================================
interface Apuesta {
  id: number;
  tipster_alias: string;
  deporte: string;
  apuesta: string;
  cuota: number;
  stake_tipster: number;
  stake_grok: number;
  resultado: string;
  ganancia_neta: number;
  filtro_claude: string;
  analisis: string;
  tipo_mercado?: string;
  hora_partido?: string;
  imagen_url?: string;
}

interface IAAnalysis {
  score: number;
  zona: string;
  zona_color: string;
  factores: { nombre: string; valor: number; impacto: string }[];
  veredicto: string;
  stake_mult: number;
  alerts: string[];
  ev: number;
  tipster_wr?: number;
  tipster_roi?: number;
}

// ============================================================================
// HELPERS
// ============================================================================
const getDeporteIcon = (deporte: string) => {
  const icons: { [key: string]: string } = {
    'Futbol': '⚽', 'Tenis': '🎾', 'NBA': '🏀', 'Baloncesto': '🏀',
    'Voleibol': '🏐', 'Mixto': '🎯', 'eSports': '🎮', 'Hockey': '🏒'
  };
  return icons[deporte] || '🎯';
};

const getMercadoLabel = (tipo: string | undefined) => {
  if (!tipo) return null;
  const map: Record<string, { label: string; color: string }> = {
    'GANADOR': { label: '1X2', color: '#3B82F6' },
    'DOBLE OPORTUNIDAD': { label: 'DO', color: '#6366F1' },
    'OVER GOLES': { label: 'OV GOL', color: '#00D1FF' },
    'UNDER GOLES': { label: 'UN GOL', color: '#F59E0B' },
    'GOLES EXACTOS': { label: 'GOL EX', color: '#10B981' },
    'AMBOS MARCAN': { label: 'BTTS', color: '#A855F7' },
    'AMBOS NO MARCAN': { label: 'NO BTTS', color: '#8B5CF6' },
    'HANDICAP': { label: 'HC', color: '#EC4899' },
    'HANDICAP ASIATICO': { label: 'HC AS', color: '#F472B6' },
    'OVER TARJETAS': { label: 'OV TAR', color: '#EAB308' },
    'UNDER TARJETAS': { label: 'UN TAR', color: '#CA8A04' },
    'OVER CORNERS': { label: 'OV CRN', color: '#06B6D4' },
    'UNDER CORNERS': { label: 'UN CRN', color: '#0891B2' },
    'OVER PUNTOS': { label: 'OV PTS', color: '#F97316' },
    'UNDER PUNTOS': { label: 'UN PTS', color: '#EA580C' },
    'PRIMERA MITAD': { label: '1T', color: '#14B8A6' },
    'SEGUNDA MITAD': { label: '2T', color: '#0D9488' },
    'SCORER': { label: 'SCORER', color: '#E11D48' },
    'RESULTADO EXACTO': { label: 'RES EX', color: '#BE123C' },
    'TENIS': { label: 'TENIS', color: '#84CC16' },
    'NBA': { label: 'NBA', color: '#F97316' },
    'COMBINADAS': { label: 'COMBI', color: '#EF4444' },
    'OTRO': { label: 'OTRO', color: '#64748B' },
  };
  return map[tipo] || { label: tipo.slice(0, 6), color: '#64748B' };
};

const getEstadoPartido = (hora_partido?: string): { estado: 'LIVE' | 'PROXIMO' | 'SIN_HORA'; texto: string; color: string } => {
  if (!hora_partido) {
    return { estado: 'SIN_HORA', texto: 'Sin hora', color: '#94A3B8' };
  }
  try {
    const [h, m] = hora_partido.split(':').map(Number);
    const ahora = new Date();
    const horaPartidoMinutos = h * 60 + m;
    const ahoraMinutos = ahora.getHours() * 60 + ahora.getMinutes();
    if (ahoraMinutos >= horaPartidoMinutos) {
      return { estado: 'LIVE', texto: `🔴 EN VIVO · ${hora_partido}`, color: '#EF4444' };
    }
    if (horaPartidoMinutos - ahoraMinutos <= 30) {
      return { estado: 'PROXIMO', texto: `⚡ POR INICIAR · ${hora_partido}`, color: '#F59E0B' };
    }
    return { estado: 'PROXIMO', texto: `🕐 ${hora_partido} CL`, color: '#F59E0B' };
  } catch {
    return { estado: 'SIN_HORA', texto: hora_partido, color: '#94A3B8' };
  }
};

// ============================================================================
// COMPONENTE: NeuroScore Badge (circular score)
// ============================================================================
const NeuroScoreBadge = ({ 
  score, zona, zona_color 
}: { 
  score: number; zona: string; zona_color: string 
}) => {
  const colorMap: Record<string, string> = {
    'green': '#00D1FF',
    'yellow': '#F59E0B', 
    'red': '#EF4444',
  };
  const color = colorMap[zona_color] || '#94A3B8';
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 85) * circumference;

  return (
    <div className="flex flex-col items-center gap-0.5" title={`NeuroScore: ${score}/85 — ${zona}`}>
      <div className="relative" style={{ width: '48px', height: '48px' }}>
        <svg width="48" height="48" viewBox="0 0 48 48" className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="24" cy="24" r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="3"
          />
          {/* Score arc */}
          <circle
            cx="24" cy="24" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold font-mono" style={{ color }}>
            {score}
          </span>
        </div>
      </div>
      <span className="text-[9px] font-bold tracking-wide" style={{ color }}>
        {zona === 'ORO' ? '🟢 ORO' : zona === 'NEUTRA' ? '🟡 NEU' : zona === 'BLOQUEADO' ? '🚫' : '🔴 RIE'}
      </span>
    </div>
  );
};

// ============================================================================
// COMPONENTE: NeuroScore Detail (expandible con factores)
// ============================================================================
const NeuroScoreDetail = ({ analysis }: { analysis: IAAnalysis }) => {
  const [open, setOpen] = useState(false);

  const impactoColor: Record<string, string> = {
    'muy_positivo': '#00D1FF',
    'positivo': '#34D399',
    'neutral': '#94A3B8',
    'negativo': '#F59E0B',
    'muy_negativo': '#EF4444',
  };

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#00D1FF] transition-colors"
      >
        <Brain className="h-3 w-3" />
        <span>NeuroScore {analysis.score}/85</span>
        {analysis.ev > 0 && (
          <span className="text-[#00D1FF] font-mono">+{analysis.ev}% EV</span>
        )}
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      
      {open && (
        <div className="mt-2 p-3 rounded-lg bg-[#0F172A]/70 border border-white/5 space-y-2.5">
          {/* Veredicto */}
          <p className="text-sm font-medium" style={{ 
            color: analysis.zona === 'ORO' ? '#00D1FF' : analysis.zona === 'NEUTRA' ? '#F59E0B' : '#EF4444'
          }}>
            {analysis.veredicto}
          </p>

          {/* Factores */}
          <div className="space-y-1.5">
            {analysis.factores.map((f, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-[#94A3B8]">{f.nombre}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-700"
                      style={{ 
                        width: `${Math.min(100, Math.max(5, f.valor))}%`,
                        background: impactoColor[f.impacto] || '#94A3B8',
                      }} 
                    />
                  </div>
                  <span className="font-mono w-8 text-right" style={{ color: impactoColor[f.impacto] || '#94A3B8' }}>
                    {f.valor}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Alertas */}
          {analysis.alerts.length > 0 && (
            <div className="space-y-1 pt-1 border-t border-white/5">
              {analysis.alerts.map((alert, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs">
                  <AlertTriangle className="h-3 w-3 text-[#F59E0B] mt-0.5 flex-shrink-0" />
                  <span className="text-[#F59E0B]">{alert}</span>
                </div>
              ))}
            </div>
          )}

          {/* Stats tipster */}
          {(analysis.tipster_wr || analysis.tipster_roi) && (
            <div className="flex gap-3 pt-1 border-t border-white/5 text-[10px] text-[#64748B]">
              {analysis.tipster_wr && <span>WR Global: {analysis.tipster_wr}%</span>}
              {analysis.tipster_roi && <span>ROI: {analysis.tipster_roi}%</span>}
              <span>×{analysis.stake_mult} stake</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENTE: KPI Card
// ============================================================================
const KPICard = ({ 
  valor, label, color, porcentaje, icono 
}: { 
  valor: string | number; label: string; color: string; porcentaje?: number; icono?: React.ReactNode 
}) => (
  <div 
    className="rounded-2xl p-4"
    style={{
      background: 'rgba(30, 41, 59, 0.7)',
      backdropFilter: 'blur(12px)',
      border: `1px solid ${color}25`,
    }}
  >
    <div className="flex items-center justify-between mb-2">
      {icono && (
        <div className="p-2 rounded-lg" style={{ background: `${color}15` }}>
          {icono}
        </div>
      )}
      {porcentaje !== undefined && porcentaje > 0 && (
        <span className="text-xs font-mono" style={{ color }}>{porcentaje}%</span>
      )}
    </div>
    <p className="text-2xl font-bold font-mono" style={{ color }}>{valor}</p>
    <p className="text-xs text-[#94A3B8] mt-0.5">{label}</p>
    {porcentaje !== undefined && (
      <div style={{ 
        width: '100%', height: '3px', borderRadius: '2px',
        background: 'rgba(255,255,255,0.06)', marginTop: '8px'
      }}>
        <div style={{ 
          width: `${Math.min(porcentaje, 100)}%`, height: '100%', borderRadius: '2px',
          background: color, transition: 'width 1s ease-out'
        }} />
      </div>
    )}
  </div>
);

// ============================================================================
// COMPONENTE: Card Apuesta PENDIENTE (con NeuroScore)
// ============================================================================
const CardPendiente = ({ 
  apuesta, index, iaData 
}: { 
  apuesta: Apuesta; index: number; iaData?: IAAnalysis 
}) => {
  const mercado = getMercadoLabel(apuesta.tipo_mercado);
  const estadoPartido = getEstadoPartido(apuesta.hora_partido);
  const isLive = estadoPartido.estado === 'LIVE';
  
  return (
    <div 
      className="rounded-xl p-4 relative overflow-hidden"
      style={{
        background: isLive
          ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(255, 50, 50, 0.03) 100%)'
          : 'linear-gradient(135deg, rgba(255, 187, 0, 0.08) 0%, rgba(255, 221, 87, 0.02) 100%)',
        border: isLive
          ? '1.5px solid rgba(239, 68, 68, 0.4)'
          : '1.5px solid rgba(255, 187, 0, 0.3)',
        animationDelay: `${index * 0.05}s`,
      }}
    >
      {/* Borde izquierdo */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px',
        background: isLive
          ? 'linear-gradient(180deg, #EF4444, #F97316)'
          : 'linear-gradient(180deg, #F59E0B, #FFDD57)',
        borderRadius: '4px 0 0 4px',
      }} />

      <div className="pl-3">
        {/* Header: Badge + Tipster + Cuota + NeuroScore */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {isLive ? (
              <span className="live-badge" style={{
                background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                color: '#FFF', fontSize: '10px', fontWeight: 800,
                padding: '3px 10px', borderRadius: '6px', letterSpacing: '0.5px',
                display: 'flex', alignItems: 'center', gap: '4px',
                boxShadow: '0 0 12px rgba(239, 68, 68, 0.4)',
              }}>
                <span className="live-dot" style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: '#FFF', display: 'inline-block',
                }} />
                EN VIVO
              </span>
            ) : (
              <span style={{
                background: 'linear-gradient(135deg, #F59E0B, #F59E0B)',
                color: '#000', fontSize: '10px', fontWeight: 800,
                padding: '3px 10px', borderRadius: '6px', letterSpacing: '0.5px',
                display: 'flex', alignItems: 'center', gap: '4px',
              }}>
                ⏳ PENDIENTE
              </span>
            )}
            <span className="text-sm font-medium text-[#00D1FF]">
              {getDeporteIcon(apuesta.deporte)} {apuesta.tipster_alias}
            </span>
            {mercado && (
              <span style={{
                background: `${mercado.color}20`, color: mercado.color,
                fontSize: '10px', fontWeight: 700, padding: '2px 8px',
                borderRadius: '4px',
              }}>
                {mercado.label}
              </span>
            )}
            {apuesta.filtro_claude === 'APROBADA' && (
              <span className="badge-ia">
                <Zap className="h-3 w-3" /> IA
              </span>
            )}
          </div>

          {/* NeuroScore + Cuota */}
          <div className="flex items-center gap-3">
            {iaData && (
              <NeuroScoreBadge 
                score={iaData.score} 
                zona={iaData.zona} 
                zona_color={iaData.zona_color} 
              />
            )}
            {!esCombinada(apuesta) && (
              <span className="font-mono font-bold text-lg" style={{ color: isLive ? '#EF4444' : '#F59E0B' }}>
                @{Number(apuesta.cuota || 0).toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* Apuesta — Combinadas se muestran con legs individuales */}
        {esCombinada(apuesta) ? (
          <CombinadaLegs
            textoApuesta={apuesta.apuesta}
            cuotaTotal={apuesta.cuota}
            resultado={apuesta.resultado}
            compact
          />
        ) : (
          <p className="text-white font-medium text-[15px] mb-2 leading-snug">
            {apuesta.apuesta}
          </p>
        )}

        {/* Imagen capture */}
        {apuesta.imagen_url && (
          <ImageCapture url={`${process.env.NEXT_PUBLIC_API_URL || ''}${apuesta.imagen_url}`} />
        )}

        {/* Footer: Hora del partido */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-mono font-bold" style={{ color: estadoPartido.color }}>
              {estadoPartido.texto}
            </span>
          </div>
          {!isLive && (
            <span className="flex items-center gap-1 text-[#94A3B8]">
              <Eye className="h-3 w-3" /> Esperando...
            </span>
          )}
          {isLive && (
            <span className="flex items-center gap-1 text-[#EF4444] font-bold">
              <Activity className="h-3 w-3" /> Jugándose ahora
            </span>
          )}
        </div>

        {/* NeuroScore detalle expandible */}
        {iaData && <NeuroScoreDetail analysis={iaData} />}

        {/* Barra progreso animada */}
        <div style={{ 
          width: '100%', height: '3px', borderRadius: '2px',
          background: isLive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 187, 0, 0.1)',
          overflow: 'hidden', marginTop: '10px',
        }}>
          <div className="pendiente-bar" style={{
            height: '100%', borderRadius: '2px',
            background: isLive
              ? 'linear-gradient(90deg, #EF4444, #F97316)'
              : 'linear-gradient(90deg, #F59E0B, #FFDD57)',
          }} />
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE: Card Apuesta RESUELTA (con NeuroScore)
// ============================================================================
const CardResuelta = ({ 
  apuesta, index, iaData 
}: { 
  apuesta: Apuesta; index: number; iaData?: IAAnalysis 
}) => {
  const [showAnalisis, setShowAnalisis] = useState(false);
  const isGanada = apuesta.resultado === 'GANADA';
  const mercado = getMercadoLabel(apuesta.tipo_mercado);
  const color = isGanada ? '#22C55E' : '#EF4444';
  
  return (
    <div 
      className="rounded-xl p-4 animate-fadeInUp"
      style={{
        background: isGanada ? 'rgba(0, 209, 255, 0.05)' : 'rgba(239, 68, 68, 0.05)',
        border: `1px solid ${isGanada ? 'rgba(0, 209, 255, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
        animationDelay: `${index * 0.03}s`,
      }}
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-lg">{getDeporteIcon(apuesta.deporte)}</span>
            <span className="text-sm font-medium text-[#00D1FF]">{apuesta.tipster_alias}</span>
            {mercado && (
              <span style={{
                background: `${mercado.color}15`, color: mercado.color,
                fontSize: '10px', fontWeight: 600, padding: '2px 7px',
                borderRadius: '4px',
              }}>
                {mercado.label}
              </span>
            )}
            {apuesta.filtro_claude === 'APROBADA' && (
              <span className="badge-ia">
                <Zap className="h-3 w-3" /> IA
              </span>
            )}
          </div>
          {esCombinada(apuesta) ? (
            <CombinadaLegs
              textoApuesta={apuesta.apuesta}
              cuotaTotal={apuesta.cuota}
              resultado={apuesta.resultado}
              compact
            />
          ) : (
            <p className="text-white font-medium">{apuesta.apuesta}</p>
          )}
          {apuesta.imagen_url && (
            <ImageCapture url={`${process.env.NEXT_PUBLIC_API_URL || ''}${apuesta.imagen_url}`} />
          )}
        </div>

        {/* NeuroScore + Datos numéricos */}
        <div className="flex items-center gap-4 lg:gap-6">
          {iaData && (
            <NeuroScoreBadge score={iaData.score} zona={iaData.zona} zona_color={iaData.zona_color} />
          )}
          <div className="text-center">
            <p className="text-[10px] text-[#64748B] uppercase">Cuota</p>
            <p className="text-xl font-bold text-white font-mono">@{Number(apuesta.cuota || 0).toFixed(2)}</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{
              background: `${color}10`, border: `1px solid ${color}20`
            }}>
              {isGanada 
                ? <CheckCircle className="h-4 w-4 text-[#00D1FF]" />
                : <XCircle className="h-4 w-4 text-[#EF4444]" />
              }
              <span className="text-sm font-bold" style={{ color }}>{apuesta.resultado}</span>
            </div>
          </div>
        </div>
      </div>

      {/* NeuroScore detalle O análisis IA clásico */}
      {iaData ? (
        <NeuroScoreDetail analysis={iaData} />
      ) : apuesta.analisis ? (
        <div className="mt-3">
          <button
            onClick={() => setShowAnalisis(!showAnalisis)}
            className="flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#00D1FF] transition-colors"
          >
            <Brain className="h-3 w-3" />
            Análisis IA
            {showAnalisis ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          {showAnalisis && (
            <div className="mt-2 p-3 rounded-lg bg-[#0F172A]/50 border border-white/5">
              <p className="text-sm text-[#94A3B8] leading-relaxed">{apuesta.analisis}</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

// ============================================================================
// COMPONENTE: Imagen Capture
// ============================================================================
const ImageCapture = ({ url }: { url: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button 
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs mt-1 mb-1 px-2 py-1 rounded-lg transition-all"
        style={{
          background: open ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
          color: '#818CF8',
        }}
      >
        📷 <span className="underline">{open ? 'Ocultar capture' : 'Ver capture'}</span>
      </button>
      {open && (
        <div className="mt-1 mb-2 rounded-xl overflow-hidden border border-slate-600/50 bg-slate-900/50 p-1.5">
          <img 
            src={url}
            alt="Capture apuesta" 
            className="rounded-lg w-full max-w-[350px]"
            onClick={() => window.open(url, '_blank')}
            style={{ cursor: 'zoom-in' }}
          />
        </div>
      )}
    </>
  );
};

// ============================================================================
// PÁGINA PRINCIPAL — Centro de Operaciones con NeuroScore
// ============================================================================
export default function ApuestasPage() {
  const [apuestas, setApuestas] = useState<Apuesta[]>([]);
  const [fecha, setFecha] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'todas' | 'ia' | 'pendientes' | 'ganadas' | 'oro'>('todas');
  
  // ★ NUEVO: Estado para análisis IA (NeuroScore por apuesta)
  const [iaAnalysis, setIaAnalysis] = useState<Record<number, IAAnalysis>>({});
  const [iaLoading, setIaLoading] = useState(false);

  useEffect(() => {
    const fetchApuestas = async () => {
      try {
        const response = await apuestasAPI.getHoy();
        setApuestas(response.apuestas || []);
        setFecha(response.fecha);
      } catch (error) {
        console.error('Error fetching apuestas:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchApuestas();
  }, []);

  // ★ NUEVO: Cargar NeuroScore cuando hay apuestas
  useEffect(() => {
    if (apuestas.length === 0) return;
    
    const fetchIA = async () => {
      setIaLoading(true);
      try {
        const data = await apuestasAPI.getAnalisisHoy();
        if (data?.analisis) {
          // La API devuelve { analisis: { [apuesta_id]: IAAnalysis } }
          const parsed: Record<number, IAAnalysis> = {};
          for (const [id, analysis] of Object.entries(data.analisis)) {
            parsed[Number(id)] = analysis as IAAnalysis;
          }
          setIaAnalysis(parsed);
        }
      } catch (error) {
        // NeuroScore es mejora visual, no bloquea funcionalidad
        console.warn('NeuroScore no disponible:', error);
      } finally {
        setIaLoading(false);
      }
    };
    fetchIA();
  }, [apuestas]);

  // Normalizar
  const apuestasNorm = apuestas.map(a => ({
    ...a,
    resultado: (a.resultado && a.resultado !== '' && a.resultado !== 'NULA') 
      ? a.resultado : 'PENDIENTE'
  }));

  const filtradas = apuestasNorm.filter((a) => {
    if (filter === 'ia') return a.filtro_claude === 'APROBADA';
    if (filter === 'pendientes') return a.resultado === 'PENDIENTE';
    if (filter === 'ganadas') return a.resultado === 'GANADA';
    // ★ NUEVO: Filtro ZONA ORO (NeuroScore >= 75)
    if (filter === 'oro') return (iaAnalysis[a.id]?.score || 0) >= 75;
    return true;
  });

  const pendientes = filtradas.filter(a => a.resultado === 'PENDIENTE');
  const resueltas = filtradas.filter(a => a.resultado === 'GANADA' || a.resultado === 'PERDIDA');

  const oroCount = apuestasNorm.filter(a => (iaAnalysis[a.id]?.score || 0) >= 75).length;

  const stats = {
    total: apuestasNorm.length,
    ganadas: apuestasNorm.filter(a => a.resultado === 'GANADA').length,
    perdidas: apuestasNorm.filter(a => a.resultado === 'PERDIDA').length,
    pendientes: apuestasNorm.filter(a => a.resultado === 'PENDIENTE').length,
    iaApproved: apuestasNorm.filter(a => a.filtro_claude === 'APROBADA').length,
    gananciaTotal: apuestasNorm.reduce((acc, a) => acc + (a.ganancia_neta || 0), 0)
  };

  const winRate = (stats.ganadas + stats.perdidas) > 0 
    ? Math.round((stats.ganadas / (stats.ganadas + stats.perdidas)) * 100) : 0;

  const fechaFormateada = fecha 
    ? new Date(fecha + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
    : 'Hoy';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-3 border-[#00D1FF]/30 border-t-[#00D1FF] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fadeIn pb-20 lg:pb-6">

      {/* HEADER */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2.5 rounded-xl" style={{ background: 'rgba(0, 209, 255, 0.1)' }}>
            <Target className="h-6 w-6 text-[#00D1FF]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Centro de Operaciones</h1>
            <p className="text-[#94A3B8] text-sm flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> {fechaFormateada}
              </span>
              {stats.pendientes > 0 && (
                <span style={{
                  background: 'linear-gradient(135deg, #F59E0B, #F59E0B)',
                  color: '#000', fontSize: '10px', fontWeight: 800,
                  padding: '2px 8px', borderRadius: '10px',
                }}>
                  {stats.pendientes} en juego
                </span>
              )}
              {stats.ganadas > 0 && (
                <span style={{
                  background: 'rgba(0, 209, 255, 0.15)',
                  color: '#00D1FF', fontSize: '10px', fontWeight: 700,
                  padding: '2px 8px', borderRadius: '10px',
                }}>
                  {stats.ganadas} ganadas
                </span>
              )}
              {/* ★ NUEVO: Badge NeuroScore activo */}
              {Object.keys(iaAnalysis).length > 0 && (
                <span style={{
                  background: 'rgba(139, 92, 246, 0.15)',
                  color: '#A78BFA', fontSize: '10px', fontWeight: 700,
                  padding: '2px 8px', borderRadius: '10px',
                  display: 'flex', alignItems: 'center', gap: '3px',
                }}>
                  <Brain className="h-3 w-3" /> NeuroScore ON
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KPICard 
          valor={stats.total} label="Total Operaciones" color="#E2E8F0"
          icono={<BarChart3 className="h-4 w-4 text-[#E2E8F0]" />}
        />
        <KPICard 
          valor={stats.ganadas} label="Ganadas" color="#00D1FF"
          porcentaje={stats.total > 0 ? Math.round((stats.ganadas / stats.total) * 100) : 0}
          icono={<CheckCircle className="h-4 w-4 text-[#00D1FF]" />}
        />
        <KPICard 
          valor={stats.perdidas} label="Perdidas" color="#EF4444"
          porcentaje={stats.total > 0 ? Math.round((stats.perdidas / stats.total) * 100) : 0}
          icono={<XCircle className="h-4 w-4 text-[#EF4444]" />}
        />
        <KPICard 
          valor={stats.pendientes} label="En Juego" color="#F59E0B"
          porcentaje={stats.total > 0 ? Math.round((stats.pendientes / stats.total) * 100) : 0}
          icono={<Activity className="h-4 w-4 text-[#F59E0B]" />}
        />
        
        {/* Win Rate */}
        <div className="rounded-2xl p-4 col-span-2 lg:col-span-1" style={{
          background: winRate >= 50 
            ? 'linear-gradient(135deg, rgba(0, 209, 255, 0.1), rgba(30, 41, 59, 0.7))'
            : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(30, 41, 59, 0.7))',
          border: `1px solid ${winRate >= 50 ? 'rgba(0, 209, 255, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
        }}>
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg" style={{ 
              background: winRate >= 50 ? 'rgba(0, 209, 255, 0.15)' : 'rgba(239, 68, 68, 0.15)' 
            }}>
              <Target className="h-4 w-4" style={{ color: winRate >= 50 ? '#00D1FF' : '#EF4444' }} />
            </div>
            <span className="text-xs font-mono text-[#94A3B8]">
              {stats.ganadas}W / {stats.perdidas}L
            </span>
          </div>
          <p className={`text-2xl font-bold font-mono ${
            winRate >= 50 ? 'text-[#00D1FF]' : 'text-[#EF4444]'
          }`}>
            {winRate}%
          </p>
          <p className="text-xs text-[#94A3B8] mt-0.5">Win Rate Hoy</p>
        </div>
      </div>

      {/* FILTROS (★ NUEVO: filtro Zona Oro) */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { key: 'todas', label: `Todas (${stats.total})`, color: '#00D1FF' },
          { key: 'oro', label: `🟢 Oro (${oroCount})`, color: '#A855F7' },
          { key: 'ia', label: `IA ✓ (${stats.iaApproved})`, color: '#FFDD57' },
          { key: 'pendientes', label: `En Juego (${stats.pendientes})`, color: '#F59E0B' },
          { key: 'ganadas', label: `Ganadas (${stats.ganadas})`, color: '#00D1FF' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className="px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all"
            style={filter === tab.key ? {
              background: tab.color,
              color: ['ia', 'pendientes'].includes(tab.key) ? '#000' : '#fff',
              boxShadow: `0 0 15px ${tab.color}30`,
            } : {
              background: 'rgba(30, 41, 59, 0.7)',
              color: '#94A3B8',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* LISTA DE APUESTAS */}
      {filtradas.length === 0 ? (
        <div className="rounded-2xl text-center py-16"
          style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Calendar className="h-12 w-12 text-[#334155] mx-auto mb-4" />
          <p className="text-[#94A3B8]">
            {filter !== 'todas' ? 'No hay apuestas con este filtro' : 'No hay operaciones para hoy'}
          </p>
          <p className="text-[#64748B] text-xs mt-1">Las apuestas se registran desde el bot de Telegram</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* PENDIENTES */}
          {pendientes.length > 0 && (
            <div>
              {(filter === 'todas' || filter === 'oro') && (
                <div className="flex items-center gap-2 mb-3">
                  {pendientes.some(a => getEstadoPartido(a.hora_partido).estado === 'LIVE') && (
                    <span className="live-dot-anim" style={{
                      width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444',
                    }} />
                  )}
                  <Activity className="h-4 w-4 text-[#F59E0B]" />
                  <span className="text-sm font-bold text-[#F59E0B]">
                    Pendientes ({pendientes.length})
                    {(() => {
                      const liveCount = pendientes.filter(a => getEstadoPartido(a.hora_partido).estado === 'LIVE').length;
                      return liveCount > 0 ? ` · ` : '';
                    })()}
                  </span>
                  {(() => {
                    const liveCount = pendientes.filter(a => getEstadoPartido(a.hora_partido).estado === 'LIVE').length;
                    return liveCount > 0 ? (
                      <span style={{
                        background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444',
                        fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '10px',
                      }}>
                        🔴 {liveCount} EN VIVO
                      </span>
                    ) : null;
                  })()}
                  <div style={{
                    flex: 1, height: '1px',
                    background: 'linear-gradient(90deg, rgba(255, 187, 0, 0.3), transparent)',
                  }} />
                </div>
              )}
              <div className="space-y-3">
                {[...pendientes].sort((a, b) => {
                  const aLive = getEstadoPartido(a.hora_partido).estado === 'LIVE' ? 0 : 1;
                  const bLive = getEstadoPartido(b.hora_partido).estado === 'LIVE' ? 0 : 1;
                  if (aLive !== bLive) return aLive - bLive;
                  // ★ NUEVO: secundariamente ordenar por NeuroScore
                  return (iaAnalysis[b.id]?.score || 0) - (iaAnalysis[a.id]?.score || 0);
                }).map((a, i) => (
                  <CardPendiente 
                    key={a.id} 
                    apuesta={a} 
                    index={i} 
                    iaData={iaAnalysis[a.id]}
                  />
                ))}
              </div>
            </div>
          )}

          {/* SEPARADOR */}
          {pendientes.length > 0 && resueltas.length > 0 && (filter === 'todas' || filter === 'oro') && (
            <div className="flex items-center gap-2 pt-2">
              <CheckCircle className="h-4 w-4 text-[#64748B]" />
              <span className="text-sm font-medium text-[#64748B]">
                Resueltas ({resueltas.length})
              </span>
              <div style={{
                flex: 1, height: '1px',
                background: 'linear-gradient(90deg, rgba(100, 116, 139, 0.3), transparent)',
              }} />
            </div>
          )}

          {/* RESUELTAS */}
          {resueltas.length > 0 && (
            <div className="space-y-3">
              {resueltas.map((a, i) => (
                <CardResuelta 
                  key={a.id} 
                  apuesta={a} 
                  index={i} 
                  iaData={iaAnalysis[a.id]}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* CSS */}
      <style jsx>{`
        .pendiente-bar {
          animation: barSlide 2.5s ease-in-out infinite alternate;
        }
        @keyframes barSlide {
          0% { width: 20%; opacity: 0.4; }
          50% { width: 65%; opacity: 1; }
          100% { width: 20%; opacity: 0.4; }
        }
        .live-dot {
          animation: livePulse 1s ease-in-out infinite;
        }
        .live-dot-anim {
          animation: livePulse 1s ease-in-out infinite;
        }
        .live-badge {
          animation: liveGlow 2s ease-in-out infinite;
        }
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.7); }
        }
        @keyframes liveGlow {
          0%, 100% { box-shadow: 0 0 12px rgba(239, 68, 68, 0.4); }
          50% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.7); }
        }
      `}</style>
    </div>
  );
}


