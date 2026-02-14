'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Calendar, CheckCircle, XCircle, Zap, Activity, Eye, Target,
  Brain, ChevronDown, ChevronUp, AlertTriangle
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
const sanitize = (s: string) => s?.replace(/[<>"'&]/g, '') || '';

// S1: Validación estricta de URLs — previene XSS via javascript: protocol y open redirect
const isValidImageUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    const u = new URL(url, window.location.origin);
    return ['http:', 'https:'].includes(u.protocol);
  } catch {
    return false;
  }
};

const sportIcon = (d: string): string => {
  if (!d) return '🎯';
  const n = d.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (n.includes('futbol') || n.includes('soccer') || n.includes('football')) return '⚽';
  if (n.includes('basquet') || n.includes('basket') || n.includes('nba')) return '🏀';
  if (n.includes('tenis') || n.includes('tennis')) return '🎾';
  if (n.includes('volei')) return '🏐';
  if (n.includes('hockey')) return '🏒';
  if (n.includes('beisbol') || n.includes('baseball')) return '⚾';
  if (n.includes('mma') || n.includes('ufc')) return '🥊';
  if (n.includes('esport') || n.includes('gaming')) return '🎮';
  return '🎯';
};

const normalizeSport = (d: string): string => {
  if (!d) return 'Otro';
  const n = d.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (n.includes('futbol') || n.includes('soccer') || n.includes('football')) return 'Fútbol';
  if (n.includes('basquet') || n.includes('basket') || n.includes('nba')) return 'Básquetbol';
  if (n.includes('tenis') || n.includes('tennis')) return 'Tenis';
  if (n.includes('volei')) return 'Voleibol';
  if (n.includes('hockey')) return 'Hockey';
  return 'Otro';
};

const getMercadoLabel = (tipo: string | undefined) => {
  if (!tipo) return null;
  const map: Record<string, { label: string; color: string }> = {
    'GANADOR': { label: '1X2', color: '#3B82F6' },
    'DOBLE OPORTUNIDAD': { label: 'DO', color: '#6366F1' },
    'OVER GOLES': { label: 'OV GOL', color: '#00D1FF' },
    'UNDER GOLES': { label: 'UN GOL', color: '#F59E0B' },
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
    'GOLES EXACTOS': { label: 'GOL EX', color: '#10B981' },
    'OTRO': { label: 'OTRO', color: '#64748B' },
  };
  // S4: Sanitize fallback — tipo_mercado podría contener HTML inyectado
  return map[tipo] || { label: sanitize(tipo).slice(0, 6), color: '#64748B' };
};

const getTimeStatus = (hora?: string, resultado?: string) => {
  if (!hora) return { label: '--:--', isLive: false, isSoon: false };
  try {
    const [h, m] = hora.split(':').map(Number);
    const now = new Date();
    const mins = h * 60 + m;
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const isResolved = resultado === 'GANADA' || resultado === 'PERDIDA';
    if (!isResolved && nowMins >= mins) return { label: hora, isLive: true, isSoon: false };
    if (!isResolved && mins - nowMins <= 30) return { label: hora, isLive: false, isSoon: true };
    return { label: hora, isLive: false, isSoon: false };
  } catch {
    return { label: hora, isLive: false, isSoon: false };
  }
};

// ============================================================================
// COMPONENTE: NeuroScore Ring (compacto)
// ============================================================================
const ScoreRing = ({ score, zona, size = 34 }: { score: number; zona: string; size?: number }) => {
  const colorMap: Record<string, string> = { 'ORO': '#22C55E', 'NEUTRA': '#F59E0B', 'RIESGO': '#EF4444' };
  const color = colorMap[zona] || '#94A3B8';
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 85) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="3"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size * 0.32, fontWeight: 900, fontFamily: 'monospace', color }}>{score}</span>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE: Imagen Capture
// ============================================================================
const ImageCapture = ({ url }: { url: string }) => {
  const [open, setOpen] = useState(false);
  // S2: Validar URL antes de renderizar — previene XSS via javascript: y data: URIs
  if (!isValidImageUrl(url)) return null;
  return (
    <>
      <button onClick={() => setOpen(!open)}
        style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#818CF8', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}>
        📷 <span style={{ textDecoration: 'underline' }}>{open ? 'Ocultar' : 'Ver capture'}</span>
      </button>
      {open && (
        <div style={{ marginTop: '4px', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(100,116,139,0.3)', background: 'rgba(15,23,42,0.5)', padding: '4px' }}>
          {/* S3: rel=noopener previene tab-napping en window.open */}
          <img src={url} alt="Capture" style={{ borderRadius: '8px', width: '100%', maxWidth: '350px', cursor: 'zoom-in' }}
            onClick={() => { if (isValidImageUrl(url)) window.open(url, '_blank', 'noopener,noreferrer'); }} />
        </div>
      )}
    </>
  );
};

// ============================================================================
// COMPONENTE: PickRow Compacto (igual al dashboard)
// ============================================================================
const PickRow = ({ apuesta, iaData }: { apuesta: Apuesta; iaData?: IAAnalysis }) => {
  const [expanded, setExpanded] = useState(false);
  const ts = getTimeStatus(apuesta.hora_partido, apuesta.resultado);
  const isResolved = apuesta.resultado === 'GANADA' || apuesta.resultado === 'PERDIDA';
  const isWin = apuesta.resultado === 'GANADA';
  const mercado = getMercadoLabel(apuesta.tipo_mercado);
  const isCombinada = esCombinada(apuesta);

  const borderColor = ts.isLive ? 'rgba(239,68,68,0.2)' : isResolved ? (isWin ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)') : 'rgba(255,255,255,0.04)';
  const bg = ts.isLive ? 'rgba(239,68,68,0.04)' : isResolved ? (isWin ? 'rgba(34,197,94,0.03)' : 'rgba(239,68,68,0.03)') : 'rgba(30,41,59,0.3)';

  const impactoColor: Record<string, string> = {
    'muy_positivo': '#00D1FF', 'positivo': '#34D399', 'neutral': '#94A3B8',
    'negativo': '#F59E0B', 'muy_negativo': '#EF4444',
  };

  return (
    <div style={{ borderBottom: `1px solid ${borderColor}` }}>
      {/* ── ROW PRINCIPAL ── */}
      <div onClick={() => setExpanded(!expanded)} style={{
        display: 'flex', alignItems: 'center', padding: '10px 12px', gap: '10px',
        background: bg, cursor: 'pointer', transition: 'background 0.2s',
      }}>
        {/* TIME */}
        <div style={{ width: '54px', flexShrink: 0, textAlign: 'center' }}>
          {ts.isLive ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
              <span style={{
                fontSize: '9px', fontWeight: 900, color: '#FFF',
                background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '3px',
                boxShadow: '0 0 8px rgba(239,68,68,0.4)', animation: 'liveGlow 2s ease-in-out infinite',
              }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#FFF', display: 'inline-block', animation: 'livePulse 1.5s infinite' }} />
                LIVE
              </span>
              <span style={{ fontSize: '11px', color: '#EF4444', fontFamily: 'monospace', fontWeight: 800 }}>{apuesta.hora_partido}</span>
            </div>
          ) : isResolved ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
              <span style={{ fontSize: '16px' }}>{isWin ? '✅' : '❌'}</span>
              <span style={{ fontSize: '9px', color: '#64748B', fontFamily: 'monospace' }}>{apuesta.hora_partido || ''}</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
              <span style={{
                fontSize: '16px', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '-0.5px',
                color: ts.isSoon ? '#F59E0B' : '#E2E8F0',
                textShadow: ts.isSoon ? '0 0 8px rgba(245,158,11,0.3)' : 'none',
              }}>
                {ts.label}
              </span>
              <span style={{ fontSize: '8px', color: '#475569', fontWeight: 600, letterSpacing: '0.5px' }}>CL</span>
              {ts.isSoon && (
                <span style={{ fontSize: '7px', fontWeight: 900, color: '#F59E0B', background: 'rgba(245,158,11,0.12)', padding: '1px 5px', borderRadius: '3px', marginTop: '1px' }}>⚡ PRONTO</span>
              )}
            </div>
          )}
        </div>

        {/* DIVIDER */}
        <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />

        {/* SPORT ICON */}
        <span style={{ fontSize: '18px', flexShrink: 0 }}>{sportIcon(apuesta.deporte)}</span>

        {/* INFO */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px', flexWrap: 'wrap' }}>
            {isCombinada ? (
              <>
                <span style={{ fontSize: '8px', fontWeight: 900, padding: '2px 6px', borderRadius: '4px', background: 'rgba(168,85,247,0.15)', color: '#A855F7', border: '1px solid rgba(168,85,247,0.25)', letterSpacing: '0.5px', flexShrink: 0 }}>
                  COMBINADA
                </span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: isResolved ? (isWin ? '#22C55E' : '#EF4444') : '#F1F5F9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {sanitize((apuesta.apuesta.replace(/^COMBINADA[:\s]*/i, '').split(' + ')[0] || apuesta.apuesta).substring(0, 45))}
                </span>
                {apuesta.apuesta.split(' + ').length > 1 && (
                  <span style={{ fontSize: '9px', color: '#A855F7', fontWeight: 700, flexShrink: 0 }}>
                    +{apuesta.apuesta.split(' + ').length - 1}
                  </span>
                )}
              </>
            ) : (
              <span style={{ fontSize: '12px', fontWeight: 700, color: isResolved ? (isWin ? '#22C55E' : '#EF4444') : '#F1F5F9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {sanitize(apuesta.apuesta)}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
            {mercado && (
              <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '3px', background: `${mercado.color}15`, color: mercado.color }}>
                {mercado.label}
              </span>
            )}
            <span style={{ fontSize: '9px', color: '#475569' }}>·</span>
            <span style={{ fontSize: '10px', color: '#818CF8', fontWeight: 600 }}>{sanitize(apuesta.tipster_alias)}</span>
            {apuesta.filtro_claude === 'APROBADA' && (
              <span style={{ fontSize: '8px', fontWeight: 800, color: '#00D1FF', background: 'rgba(0,209,255,0.1)', padding: '1px 4px', borderRadius: '3px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                <Zap style={{ width: '8px', height: '8px' }} /> IA
              </span>
            )}
            {iaData?.zona === 'RIESGO' && (
              <span style={{ fontSize: '8px', fontWeight: 800, color: '#EF4444', background: 'rgba(239,68,68,0.1)', padding: '1px 4px', borderRadius: '3px' }}>⚠️</span>
            )}
          </div>
        </div>

        {/* SCORE + CUOTA + CHEVRON */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {iaData && <ScoreRing score={iaData.score} zona={iaData.zona} size={34} />}
          <div style={{
            background: iaData?.zona === 'ORO' ? 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.08))' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${iaData?.zona === 'ORO' ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: '8px', padding: '5px 10px', textAlign: 'center', minWidth: '52px',
          }}>
            <span style={{ fontSize: '15px', fontWeight: 900, fontFamily: 'monospace', color: iaData?.zona === 'ORO' ? '#22C55E' : '#F1F5F9', letterSpacing: '-0.5px' }}>
              @{(apuesta.cuota || 0).toFixed(2)}
            </span>
          </div>
          <ChevronDown style={{
            width: '14px', height: '14px', color: '#475569', flexShrink: 0,
            transform: expanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s',
          }} />
        </div>
      </div>

      {/* ── EXPANDED DETAIL ── */}
      {expanded && (
        <div style={{ padding: '12px 16px', background: 'rgba(15,23,42,0.4)', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
          {/* Combinada legs */}
          {isCombinada && (
            <div style={{ marginBottom: '10px' }}>
              <CombinadaLegs textoApuesta={apuesta.apuesta} cuotaTotal={apuesta.cuota} resultado={apuesta.resultado} compact />
            </div>
          )}

          {/* IA Analysis */}
          {iaData && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{
                  fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.5px',
                  background: iaData.zona === 'ORO' ? 'rgba(34,197,94,0.15)' : iaData.zona === 'NEUTRA' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                  color: iaData.zona === 'ORO' ? '#22C55E' : iaData.zona === 'NEUTRA' ? '#F59E0B' : '#EF4444',
                }}>
                  {iaData.zona === 'ORO' ? '🟢 ZONA ORO' : iaData.zona === 'NEUTRA' ? '🟡 NEUTRA' : '🔴 RIESGO'}
                </span>
                {iaData.ev > 0 && (
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#00D1FF', fontFamily: 'monospace' }}>+{iaData.ev}% EV</span>
                )}
              </div>
              <p style={{ fontSize: '12px', color: '#CBD5E1', lineHeight: '1.5', marginBottom: '8px' }}>
                {sanitize(iaData.veredicto)}
              </p>
              {/* Top factores */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {iaData.factores.slice(0, 3).map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min((f.valor / 20) * 100, 100)}%`, height: '100%', borderRadius: '2px',
                        background: impactoColor[f.impacto] || '#94A3B8', transition: 'width 0.5s ease-out',
                      }} />
                    </div>
                    <span style={{ fontSize: '10px', color: '#94A3B8', whiteSpace: 'nowrap', minWidth: '120px' }}>
                      {sanitize(f.nombre)} <span style={{ color: impactoColor[f.impacto] || '#94A3B8', fontWeight: 700, fontFamily: 'monospace' }}>{f.valor}/20</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Análisis clásico si no hay IA */}
          {!iaData && apuesta.analisis && (
            <p style={{ fontSize: '12px', color: '#94A3B8', lineHeight: '1.5' }}>{sanitize(apuesta.analisis)}</p>
          )}

          {/* Imagen capture */}
          {apuesta.imagen_url && (
            <ImageCapture url={`${process.env.NEXT_PUBLIC_API_URL || ''}${apuesta.imagen_url}`} />
          )}

          {/* Alertas */}
          {iaData?.alerts && iaData.alerts.length > 0 && (
            <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {iaData.alerts.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#F59E0B' }}>
                  <AlertTriangle style={{ width: '10px', height: '10px' }} /> {sanitize(a)}
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
// PÁGINA PRINCIPAL — Apuestas V2 Mobile-First
// ============================================================================
export default function ApuestasPage() {
  const [apuestas, setApuestas] = useState<Apuesta[]>([]);
  const [fecha, setFecha] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [iaAnalysis, setIaAnalysis] = useState<Record<number, IAAnalysis>>({});
  const [iaLoading, setIaLoading] = useState(false);

  // Filtros
  const [sportFilter, setSportFilter] = useState<string>('Todos');
  const [resultFilter, setResultFilter] = useState<string>('todas');
  const sportScrollRef = useRef<HTMLDivElement>(null);
  const [showScrollFade, setShowScrollFade] = useState(true);

  // ── Data fetching ──
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

  // ── NeuroScore ──
  useEffect(() => {
    if (apuestas.length === 0) return;
    const fetchIA = async () => {
      setIaLoading(true);
      try {
        const data = await apuestasAPI.getAnalisisHoy();
        if (data?.analisis) {
          const parsed: Record<number, IAAnalysis> = {};
          for (const [id, analysis] of Object.entries(data.analisis)) {
            parsed[Number(id)] = analysis as IAAnalysis;
          }
          setIaAnalysis(parsed);
        }
      } catch (error) {
        console.warn('NeuroScore no disponible:', error);
      } finally {
        setIaLoading(false);
      }
    };
    fetchIA();
  }, [apuestas]);

  // ── Normalize ──
  const apuestasNorm = apuestas.map(a => ({
    ...a,
    resultado: (a.resultado && a.resultado !== '' && a.resultado !== 'NULA') ? a.resultado : 'PENDIENTE'
  }));

  // ── Unique sports ──
  const uniqueSports = Array.from(new Set(apuestasNorm.map(a => normalizeSport(a.deporte)))).filter(s => s !== 'Otro').sort();

  // ── Stats ──
  const stats = {
    total: apuestasNorm.length,
    ganadas: apuestasNorm.filter(a => a.resultado === 'GANADA').length,
    perdidas: apuestasNorm.filter(a => a.resultado === 'PERDIDA').length,
    pendientes: apuestasNorm.filter(a => a.resultado === 'PENDIENTE').length,
    iaApproved: apuestasNorm.filter(a => a.filtro_claude === 'APROBADA').length,
  };
  const oroCount = apuestasNorm.filter(a => (iaAnalysis[a.id]?.score || 0) >= 75).length;
  const liveCount = apuestasNorm.filter(a => a.resultado === 'PENDIENTE' && getTimeStatus(a.hora_partido, a.resultado).isLive).length;
  const winRate = (stats.ganadas + stats.perdidas) > 0
    ? Math.round((stats.ganadas / (stats.ganadas + stats.perdidas)) * 100) : 0;

  const fechaFormateada = fecha
    ? new Date(fecha + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
    : 'Hoy';

  // ── Filter logic ──
  let filtered = apuestasNorm;
  if (sportFilter !== 'Todos') filtered = filtered.filter(a => normalizeSport(a.deporte) === sportFilter);
  if (resultFilter === 'ia') filtered = filtered.filter(a => a.filtro_claude === 'APROBADA');
  if (resultFilter === 'pendientes') filtered = filtered.filter(a => a.resultado === 'PENDIENTE');
  if (resultFilter === 'ganadas') filtered = filtered.filter(a => a.resultado === 'GANADA');
  if (resultFilter === 'oro') filtered = filtered.filter(a => (iaAnalysis[a.id]?.score || 0) >= 75);

  const pendientes = filtered.filter(a => a.resultado === 'PENDIENTE');
  const resueltas = filtered.filter(a => a.resultado === 'GANADA' || a.resultado === 'PERDIDA');

  // Sort: LIVE first, then by NeuroScore
  const sortedPendientes = [...pendientes].sort((a, b) => {
    const aLive = getTimeStatus(a.hora_partido, a.resultado).isLive ? 0 : 1;
    const bLive = getTimeStatus(b.hora_partido, b.resultado).isLive ? 0 : 1;
    if (aLive !== bLive) return aLive - bLive;
    return (iaAnalysis[b.id]?.score || 0) - (iaAnalysis[a.id]?.score || 0);
  });

  // ── Loading ──
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(0,209,255,0.3)', borderTop: '3px solid #00D1FF', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  // ========================================================================
  // RENDER
  // ========================================================================
  return (
    <div style={{ paddingBottom: '80px' }} className="animate-fadeIn">

      {/* ================================================================ */}
      {/* HEADER COMPACTO — 1 línea en móvil                              */}
      {/* ================================================================ */}
      <div style={{ padding: '12px 0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ padding: '6px', borderRadius: '10px', background: 'rgba(0,209,255,0.1)' }}>
            <Target style={{ width: '18px', height: '18px', color: '#00D1FF' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 900, color: '#F1F5F9', margin: 0 }}>Centro de Operaciones</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
              <span style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Calendar style={{ width: '11px', height: '11px' }} /> {fechaFormateada}
              </span>
              {Object.keys(iaAnalysis).length > 0 && (
                <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '8px', background: 'rgba(139,92,246,0.15)', color: '#A78BFA', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <Brain style={{ width: '9px', height: '9px' }} /> NeuroScore ON
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── KPIs Compactos — UNA sola fila ── */}
        <div style={{
          display: 'flex', gap: '6px', marginTop: '8px', overflowX: 'auto',
          scrollbarWidth: 'none', msOverflowStyle: 'none', paddingBottom: '2px',
        }}>
          {/* Total */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', flexShrink: 0,
            background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <span style={{ fontSize: '18px', fontWeight: 900, fontFamily: 'monospace', color: '#E2E8F0' }}>{stats.total}</span>
            <span style={{ fontSize: '9px', color: '#64748B', fontWeight: 600 }}>picks</span>
          </div>
          {/* Ganadas */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '8px', flexShrink: 0,
            background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)',
          }}>
            <span style={{ fontSize: '14px' }}>✅</span>
            <span style={{ fontSize: '16px', fontWeight: 900, fontFamily: 'monospace', color: '#22C55E' }}>{stats.ganadas}</span>
          </div>
          {/* Perdidas */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '8px', flexShrink: 0,
            background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
          }}>
            <span style={{ fontSize: '14px' }}>❌</span>
            <span style={{ fontSize: '16px', fontWeight: 900, fontFamily: 'monospace', color: '#EF4444' }}>{stats.perdidas}</span>
          </div>
          {/* En Juego / Live */}
          {stats.pendientes > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '8px', flexShrink: 0,
              background: liveCount > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
              border: `1px solid ${liveCount > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.15)'}`,
            }}>
              <span style={{ fontSize: '14px' }}>{liveCount > 0 ? '🔴' : '⏳'}</span>
              <span style={{ fontSize: '16px', fontWeight: 900, fontFamily: 'monospace', color: liveCount > 0 ? '#EF4444' : '#F59E0B' }}>
                {stats.pendientes}
              </span>
              {liveCount > 0 && <span style={{ fontSize: '8px', fontWeight: 800, color: '#EF4444' }}>LIVE</span>}
            </div>
          )}
          {/* Win Rate */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', flexShrink: 0,
            background: winRate >= 50 ? 'rgba(0,209,255,0.08)' : 'rgba(239,68,68,0.06)',
            border: `1px solid ${winRate >= 50 ? 'rgba(0,209,255,0.2)' : 'rgba(239,68,68,0.15)'}`,
          }}>
            <span style={{ fontSize: '18px', fontWeight: 900, fontFamily: 'monospace', color: winRate >= 50 ? '#00D1FF' : '#EF4444' }}>
              {winRate}%
            </span>
            <span style={{ fontSize: '8px', color: '#64748B', fontWeight: 600 }}>WR</span>
            <span style={{ fontSize: '9px', color: '#475569', fontFamily: 'monospace' }}>{stats.ganadas}W/{stats.perdidas}L</span>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* FILTROS — 2 filas: Deportes + Resultado                        */}
      {/* ================================================================ */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20, paddingTop: '6px', paddingBottom: '6px',
        background: 'linear-gradient(180deg, var(--bg-main, #0F172A) 85%, transparent)',
      }}>
        {/* Fila 1: Sport tabs (scrollable) + Fixed ⭐ — SAME as dashboard */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '6px' }}>
          <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
            <div ref={sportScrollRef}
              onScroll={() => {
                const el = sportScrollRef.current;
                if (el) setShowScrollFade(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {['Todos', ...uniqueSports].map(f => (
                <button key={f} onClick={() => setSportFilter(f)} style={{
                  padding: '5px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                  fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap', transition: 'all 0.2s',
                  background: sportFilter === f ? 'linear-gradient(135deg, #00D1FF, #00A86B)' : 'rgba(255,255,255,0.04)',
                  color: sportFilter === f ? '#000' : '#94A3B8',
                  boxShadow: sportFilter === f ? '0 2px 10px rgba(0,209,255,0.25)' : 'none',
                }}>
                  {f !== 'Todos' ? sportIcon(f) + ' ' : ''}{f}
                </button>
              ))}
            </div>
            {showScrollFade && (
              <div style={{
                position: 'absolute', right: 0, top: 0, bottom: 0, width: '40px',
                background: 'linear-gradient(to right, transparent, #0F172A)',
                pointerEvents: 'none',
              }} />
            )}
          </div>
        </div>

        {/* Fila 2: Filtros resultado */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none', paddingBottom: '2px' }}>
          {[
            { key: 'todas', label: `Todas (${stats.total})` },
            { key: 'oro', label: `🟢 Oro (${oroCount})` },
            { key: 'ia', label: `IA ✓ (${stats.iaApproved})` },
            { key: 'pendientes', label: `⏳ En Juego (${stats.pendientes})` },
            { key: 'ganadas', label: `✅ Ganadas (${stats.ganadas})` },
          ].map(tab => (
            <button key={tab.key} onClick={() => setResultFilter(tab.key)} style={{
              padding: '5px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer',
              fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap', transition: 'all 0.2s',
              background: resultFilter === tab.key ? 'rgba(0,209,255,0.15)' : 'rgba(255,255,255,0.03)',
              color: resultFilter === tab.key ? '#00D1FF' : '#64748B',
              borderBottom: resultFilter === tab.key ? '2px solid #00D1FF' : '2px solid transparent',
            }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ================================================================ */}
      {/* LISTA DE PICKS                                                  */}
      {/* ================================================================ */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px', borderRadius: '16px',
          background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <Calendar style={{ width: '48px', height: '48px', color: '#334155', margin: '0 auto 16px' }} />
          <p style={{ color: '#94A3B8', fontSize: '14px' }}>
            {resultFilter !== 'todas' || sportFilter !== 'Todos' ? 'No hay apuestas con estos filtros' : 'No hay operaciones para hoy'}
          </p>
          <p style={{ color: '#475569', fontSize: '11px', marginTop: '4px' }}>Las apuestas se registran desde el bot de Telegram</p>
        </div>
      ) : (
        <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.04)' }}>
          {/* PENDIENTES */}
          {sortedPendientes.length > 0 && (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 12px',
                background: 'rgba(245,158,11,0.04)', borderBottom: '1px solid rgba(245,158,11,0.1)',
              }}>
                {liveCount > 0 && (
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', animation: 'livePulse 1s ease-in-out infinite' }} />
                )}
                <Activity style={{ width: '14px', height: '14px', color: '#F59E0B' }} />
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#F59E0B' }}>
                  Pendientes ({sortedPendientes.length})
                </span>
                {liveCount > 0 && (
                  <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '10px', background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
                    🔴 {liveCount} EN VIVO
                  </span>
                )}
                <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(245,158,11,0.3), transparent)' }} />
              </div>
              {sortedPendientes.map(a => (
                <PickRow key={a.id} apuesta={a} iaData={iaAnalysis[a.id]} />
              ))}
            </>
          )}

          {/* SEPARADOR */}
          {sortedPendientes.length > 0 && resueltas.length > 0 && (
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />
          )}

          {/* RESUELTAS */}
          {resueltas.length > 0 && (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 12px',
                background: 'rgba(100,116,139,0.04)', borderBottom: '1px solid rgba(100,116,139,0.1)',
              }}>
                <CheckCircle style={{ width: '14px', height: '14px', color: '#64748B' }} />
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#64748B' }}>
                  Resueltas ({resueltas.length})
                </span>
                <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(100,116,139,0.3), transparent)' }} />
              </div>
              {resueltas.map(a => (
                <PickRow key={a.id} apuesta={a} iaData={iaAnalysis[a.id]} />
              ))}
            </>
          )}
        </div>
      )}

      {/* CSS */}
      <style jsx>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.7); }
        }
        @keyframes liveGlow {
          0%, 100% { box-shadow: 0 0 8px rgba(239,68,68,0.4); }
          50% { box-shadow: 0 0 16px rgba(239,68,68,0.6); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
