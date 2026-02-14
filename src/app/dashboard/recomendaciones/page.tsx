'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  Zap, Star, TrendingUp, Clock, AlertCircle, AlertTriangle,
  CheckCircle, Loader2, ArrowRight, Target, Flame, Brain, Shield,
  ChevronDown, DollarSign, Eye, Sparkles, Activity
} from 'lucide-react';
import { picksAPI, misApuestasAPI, miBancaAPI } from '@/lib/api';
import CombinadaLegs, { esCombinada } from '@/components/CombinadaLegs';

// ============================================================================
// TYPES
// ============================================================================
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

// ★ NeuroSignals types
interface Signal {
  tipo: string;
  emoji: string;
  confianza: number;
  detalle: string;
  tipster?: string;
  apuesta_id?: number;
}

interface PickSignals {
  score: number;
  nivel: string;
  nivel_emoji: string;
  senales: Signal[];
  positivas: number;
  negativas: number;
  tipster: string;
  apuesta_corta: string;
}

interface SignalsData {
  signals: Record<string, PickSignals>;
  resumen: {
    total_picks: number;
    con_senales: number;
    neuro_alerts: number;
    convergencias: number;
    peligros: number;
    top_signals: Signal[];
  };
  timestamp: string;
}

// ============================================================================
// SECURITY HELPERS — S1-S9
// ============================================================================
// S1: Sanitize ALL user-facing strings — strips HTML/XSS vectors
const sanitize = (s: string) => s?.replace(/[<>"'&]/g, '') || '';

// S2: Validate image URLs — block javascript:, data:, vbscript: protocols
const isValidUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    const u = new URL(url, window.location.origin);
    return ['http:', 'https:'].includes(u.protocol);
  } catch {
    return false;
  }
};

// ============================================================================
// UI HELPERS
// ============================================================================
const sportIcon = (tipo: string): string => {
  if (!tipo) return '🎯';
  const n = tipo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (n.includes('futbol') || n.includes('gol') || n.includes('corner') || n.includes('tarjeta') || n.includes('1x2') || n.includes('btts')) return '⚽';
  if (n.includes('punto') || n.includes('nba') || n.includes('basket') || n.includes('handicap')) return '🏀';
  if (n.includes('tenis') || n.includes('set') || n.includes('juego')) return '🎾';
  if (n.includes('combi')) return '🎯';
  return '🎯';
};

const normalizeSport = (tipo: string): string => {
  const icon = sportIcon(tipo);
  if (icon === '⚽') return 'Fútbol';
  if (icon === '🏀') return 'Básquetbol';
  if (icon === '🎾') return 'Tenis';
  return 'Otro';
};

const getMercadoLabel = (tipo: string | undefined) => {
  if (!tipo) return null;
  const map: Record<string, { label: string; color: string }> = {
    'GANADOR': { label: '1X2', color: '#3B82F6' }, 'DOBLE OPORTUNIDAD': { label: 'DO', color: '#6366F1' },
    'OVER GOLES': { label: 'OV GOL', color: '#00D1FF' }, 'UNDER GOLES': { label: 'UN GOL', color: '#F59E0B' },
    'AMBOS MARCAN': { label: 'BTTS', color: '#A855F7' }, 'HANDICAP': { label: 'HC', color: '#EC4899' },
    'OVER TARJETAS': { label: 'OV TAR', color: '#EAB308' }, 'UNDER TARJETAS': { label: 'UN TAR', color: '#CA8A04' },
    'OVER CORNERS': { label: 'OV CRN', color: '#06B6D4' }, 'UNDER CORNERS': { label: 'UN CRN', color: '#0891B2' },
    'OVER PUNTOS': { label: 'OV PTS', color: '#F97316' }, 'UNDER PUNTOS': { label: 'UN PTS', color: '#EA580C' },
    'SCORER': { label: 'SCORER', color: '#E11D48' }, 'TENIS': { label: 'TENIS', color: '#84CC16' },
    'NBA': { label: 'NBA', color: '#F97316' }, 'COMBINADAS': { label: 'COMBI', color: '#EF4444' },
  };
  // S3: Sanitize fallback
  return map[tipo] || { label: sanitize(tipo).slice(0, 6), color: '#64748B' };
};

const getTimeStatus = (hora?: string) => {
  if (!hora) return { label: '--:--', isLive: false, isSoon: false };
  try {
    const [h, m] = hora.split(':').map(Number);
    const now = new Date();
    const mins = h * 60 + m;
    const nowMins = now.getHours() * 60 + now.getMinutes();
    if (nowMins >= mins) return { label: hora, isLive: true, isSoon: false };
    if (mins - nowMins <= 30) return { label: hora, isLive: false, isSoon: true };
    return { label: hora, isLive: false, isSoon: false };
  } catch {
    return { label: hora, isLive: false, isSoon: false };
  }
};

// ============================================================================
// COMPONENTE: ScoreRing compacto
// ============================================================================
const ScoreRing = ({ score, size = 34 }: { score: number; size?: number }) => {
  const color = score >= 75 ? '#22C55E' : score >= 50 ? '#F59E0B' : '#EF4444';
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
// 🧠 MOTOR DE INSIGHTS V2 — Fusiona NeuroSignals (backend) + fallback client
// ============================================================================
interface Insight {
  emoji: string;
  text: string;
  type: 'positive' | 'warning' | 'info' | 'danger';
  priority: number;
  source: 'signals' | 'client';
}

const generateInsights = (picks: Pick[], signalsData?: SignalsData): Insight[] => {
  if (picks.length === 0) return [];
  const insights: Insight[] = [];

  // ═══════════════════════════════════════════════
  // PRIORIDAD 1: Señales reales del backend
  // ═══════════════════════════════════════════════
  if (signalsData?.resumen) {
    const r = signalsData.resumen;

    // NEURO_ALERT — picks con 3+ señales positivas
    if (r.neuro_alerts > 0) {
      insights.push({
        emoji: '🔴', priority: 15, source: 'signals',
        text: `${r.neuro_alerts} pick${r.neuro_alerts > 1 ? 's' : ''} con NEURO ALERT — máxima confianza del sistema`,
        type: 'positive',
      });
    }

    // CONVERGENCIA — múltiples tipsters mismo partido
    if (r.convergencias > 0) {
      insights.push({
        emoji: '⚡', priority: 14, source: 'signals',
        text: `${r.convergencias} convergencia${r.convergencias > 1 ? 's' : ''} detectada${r.convergencias > 1 ? 's' : ''} — tipsters independientes apuntan al mismo resultado`,
        type: 'positive',
      });
    }

    // PELIGROS
    if (r.peligros > 0) {
      insights.push({
        emoji: '⚫', priority: 13, source: 'signals',
        text: `${r.peligros} pick${r.peligros > 1 ? 's' : ''} en PELIGRO — anti-patrones detectados, evitar o reducir`,
        type: 'danger',
      });
    }

    // Top signals del backend (máximo 3 más relevantes)
    if (r.top_signals?.length > 0) {
      const signalTypeMap: Record<string, { type: Insight['type']; priority: number }> = {
        'SWEET_SPOT': { type: 'positive', priority: 11 },
        'MERCADO_FUERTE': { type: 'positive', priority: 10 },
        'DIA_FUERTE': { type: 'info', priority: 9 },
        'RACHA_CALIENTE': { type: 'positive', priority: 10 },
        'CONVERGENCIA': { type: 'positive', priority: 14 },
        'DIVERGENCIA': { type: 'warning', priority: 12 },
        'ANTIPATRON': { type: 'danger', priority: 11 },
      };

      // Deduplicate by tipo (keep highest confianza)
      const seen = new Set<string>();
      for (const sig of r.top_signals.slice(0, 4)) {
        const key = sig.tipo;
        if (seen.has(key)) continue;
        seen.add(key);

        const meta = signalTypeMap[key] || { type: 'info' as const, priority: 5 };
        insights.push({
          emoji: sig.emoji || '🧠',
          priority: meta.priority,
          source: 'signals',
          text: `${sanitize(sig.tipster || '')}: ${sanitize(sig.detalle)}`,
          type: meta.type,
        });
      }
    }

    // Resumen global de señales
    if (r.con_senales > 0 && r.con_senales >= picks.length * 0.5) {
      insights.push({
        emoji: '🧠', priority: 7, source: 'signals',
        text: `${r.con_senales} de ${r.total_picks} picks tienen señales positivas — buen día para operar`,
        type: 'info',
      });
    }
  }

  // ═══════════════════════════════════════════════
  // PRIORIDAD 2: Fallback client-side (si no hay señales backend)
  // ═══════════════════════════════════════════════
  const hasBackendInsights = insights.filter(i => i.source === 'signals').length;

  // Racha caliente (solo si backend no lo reportó)
  if (hasBackendInsights < 2) {
    const bestRacha = picks.reduce((best, p) => p.racha_tipster > (best?.racha_tipster || 0) ? p : best, picks[0]);
    if (bestRacha.racha_tipster >= 3) {
      insights.push({
        emoji: '🔥', priority: 8, source: 'client',
        text: `${sanitize(bestRacha.tipster)} lleva racha W${bestRacha.racha_tipster} — considéralo hoy`,
        type: 'positive',
      });
    }
  }

  // Picks zona oro
  const oroCount = picks.filter(p => (p.neuroscore || 0) >= 75).length;
  if (oroCount >= 3 && hasBackendInsights < 3) {
    insights.push({ emoji: '🟢', priority: 7, source: 'client', text: `${oroCount} picks en Zona Oro — prioriza estos`, type: 'positive' });
  }

  // Mejor EV
  if (hasBackendInsights < 2) {
    const bestEV = picks.reduce((best, p) => (p.ev_estimado || 0) > (best?.ev_estimado || 0) ? p : best, picks[0]);
    if (bestEV.ev_estimado > 10) {
      insights.push({
        emoji: '💰', priority: 6, source: 'client',
        text: `Mejor EV: ${sanitize(bestEV.tipster)} @${bestEV.cuota} con +${bestEV.ev_estimado}% EV`,
        type: 'positive',
      });
    }
  }

  // Zona riesgo
  const riesgoCount = picks.filter(p => (p.neuroscore || 0) < 50).length;
  if (riesgoCount >= 3 && !insights.some(i => i.type === 'danger')) {
    insights.push({ emoji: '⚠️', priority: 8, source: 'client', text: `${riesgoCount} picks en zona de riesgo — sé selectivo`, type: 'danger' });
  }

  // Score promedio
  const avgScore = Math.round(picks.reduce((s, p) => s + (p.neuroscore || 50), 0) / picks.length);
  if (avgScore >= 70 && hasBackendInsights < 3) {
    insights.push({ emoji: '🧠', priority: 5, source: 'client', text: `Score promedio ${avgScore}/85 — la IA tiene alta confianza hoy`, type: 'positive' });
  }

  // Sort by priority desc, max 5
  return insights.sort((a, b) => b.priority - a.priority).slice(0, 5);
};

// ============================================================================
// COMPONENTE: PickRow compacto expandible
// ============================================================================
const PickRow = ({ pick, onApostar, canApostar, pickSignals }: { pick: Pick; onApostar: () => void; canApostar: boolean; pickSignals?: PickSignals }) => {
  const [expanded, setExpanded] = useState(false);
  const ts = getTimeStatus(pick.hora_partido);
  const score = pick.neuroscore || 50;
  const isOro = score >= 75 || pick.confianza === 3;
  const mercado = getMercadoLabel(pick.tipo_mercado);
  const isCombinada = esCombinada({ tipo_mercado: pick.tipo_mercado, apuesta: pick.apuesta });

  const impactoColor: Record<string, string> = {
    'muy_positivo': '#00D1FF', 'positivo': '#34D399', 'neutral': '#94A3B8',
    'negativo': '#F59E0B', 'muy_negativo': '#EF4444',
  };

  const borderColor = isOro ? 'rgba(34,197,94,0.15)' : score >= 50 ? 'rgba(255,255,255,0.04)' : 'rgba(239,68,68,0.08)';
  const bg = isOro ? 'rgba(34,197,94,0.02)' : 'rgba(30,41,59,0.3)';

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
              <span style={{ fontSize: '11px', color: '#EF4444', fontFamily: 'monospace', fontWeight: 800 }}>{pick.hora_partido}</span>
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
        <span style={{ fontSize: '18px', flexShrink: 0 }}>{sportIcon(pick.tipo_mercado)}</span>

        {/* INFO — S4: sanitize all user data */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px', flexWrap: 'wrap' }}>
            {isCombinada ? (
              <>
                <span style={{ fontSize: '8px', fontWeight: 900, padding: '2px 6px', borderRadius: '4px', background: 'rgba(168,85,247,0.15)', color: '#A855F7', border: '1px solid rgba(168,85,247,0.25)', letterSpacing: '0.5px', flexShrink: 0 }}>
                  COMBINADA
                </span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#F1F5F9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {sanitize((pick.apuesta.replace(/^COMBINADA[:\s]*/i, '').split(' + ')[0] || pick.apuesta).substring(0, 45))}
                </span>
              </>
            ) : (
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#F1F5F9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {sanitize(pick.apuesta)}
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
            <span style={{ fontSize: '10px', color: '#818CF8', fontWeight: 600 }}>{sanitize(pick.tipster)}</span>
            {pick.racha_tipster >= 3 && (
              <span style={{ fontSize: '8px', fontWeight: 800, color: '#22C55E', background: 'rgba(34,197,94,0.1)', padding: '1px 4px', borderRadius: '3px' }}>🔥W{pick.racha_tipster}</span>
            )}
            {isOro && (
              <span style={{ fontSize: '8px', fontWeight: 800, color: '#00D1FF', background: 'rgba(0,209,255,0.1)', padding: '1px 4px', borderRadius: '3px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                <Zap style={{ width: '8px', height: '8px' }} /> IA
              </span>
            )}
          </div>
        </div>

        {/* SCORE + CUOTA + CHEVRON */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <ScoreRing score={score} size={34} />
          <div style={{
            background: isOro ? 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.08))' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${isOro ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: '8px', padding: '5px 10px', textAlign: 'center', minWidth: '52px',
          }}>
            <span style={{ fontSize: '15px', fontWeight: 900, fontFamily: 'monospace', color: isOro ? '#22C55E' : '#F1F5F9', letterSpacing: '-0.5px' }}>
              @{(pick.cuota || 0).toFixed(2)}
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
              <CombinadaLegs textoApuesta={pick.apuesta} cuotaTotal={pick.cuota} compact />
            </div>
          )}

          {/* Zona badge + EV + Veredicto */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.5px',
              background: score >= 75 ? 'rgba(34,197,94,0.15)' : score >= 50 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
              color: score >= 75 ? '#22C55E' : score >= 50 ? '#F59E0B' : '#EF4444',
            }}>
              {score >= 75 ? '🟢 ZONA ORO' : score >= 50 ? '🟡 NEUTRA' : '🔴 RIESGO'}
            </span>
            {pick.ev_estimado > 0 && (
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#00D1FF', fontFamily: 'monospace' }}>+{pick.ev_estimado}% EV</span>
            )}
            {/* Stake + Ganancia */}
            <span style={{ fontSize: '10px', color: '#FFDD57', fontWeight: 700, fontFamily: 'monospace' }}>
              Stake: ${pick.stake_sugerido.toLocaleString()}
            </span>
            <span style={{ fontSize: '10px', color: '#00D1FF', fontWeight: 700, fontFamily: 'monospace' }}>
              Gan: +${pick.ganancia_potencial.toLocaleString()}
            </span>
          </div>

          {/* S5: Sanitize veredicto */}
          {pick.veredicto && (
            <p style={{ fontSize: '12px', color: '#CBD5E1', lineHeight: '1.5', marginBottom: '8px', fontStyle: 'italic' }}>
              &quot;{sanitize(pick.veredicto)}&quot;
            </p>
          )}

          {/* Factores — S6: sanitize nombres */}
          {pick.factores && pick.factores.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
              {pick.factores.slice(0, 3).map((f, i) => (
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
          )}

          {/* Alerts — S7: sanitize alerts */}
          {pick.alerts && pick.alerts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '8px' }}>
              {pick.alerts.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#F59E0B' }}>
                  <AlertTriangle style={{ width: '10px', height: '10px' }} /> {sanitize(a)}
                </div>
              ))}
            </div>
          )}

          {/* ★ NEUROSIGNALS — Señales del backend por pick */}
          {pickSignals && pickSignals.senales.length > 0 && (
            <div style={{
              padding: '8px 10px', borderRadius: '8px', marginBottom: '8px',
              background: pickSignals.nivel === 'NEURO_ALERT' ? 'rgba(239,68,68,0.06)' :
                pickSignals.nivel === 'ALTA_CONFIANZA' ? 'rgba(255,165,0,0.06)' :
                pickSignals.nivel === 'PELIGRO' ? 'rgba(0,0,0,0.15)' : 'rgba(0,209,255,0.04)',
              border: `1px solid ${pickSignals.nivel === 'NEURO_ALERT' ? 'rgba(239,68,68,0.2)' :
                pickSignals.nivel === 'PELIGRO' ? 'rgba(100,100,100,0.3)' : 'rgba(0,209,255,0.1)'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#FF6B9D' }}>⚡ NeuroSignals</span>
                <span style={{
                  fontSize: '9px', fontWeight: 800, padding: '1px 6px', borderRadius: '4px',
                  background: pickSignals.nivel === 'NEURO_ALERT' ? 'rgba(239,68,68,0.15)' :
                    pickSignals.nivel === 'ALTA_CONFIANZA' ? 'rgba(255,165,0,0.15)' :
                    pickSignals.nivel === 'PELIGRO' ? 'rgba(100,100,100,0.2)' : 'rgba(245,158,11,0.15)',
                  color: pickSignals.nivel === 'NEURO_ALERT' ? '#EF4444' :
                    pickSignals.nivel === 'ALTA_CONFIANZA' ? '#F97316' :
                    pickSignals.nivel === 'PELIGRO' ? '#94A3B8' : '#F59E0B',
                }}>
                  {pickSignals.nivel_emoji} {pickSignals.nivel.replace('_', ' ')}
                </span>
                <span style={{ fontSize: '9px', fontFamily: 'monospace', color: pickSignals.score >= 0 ? '#22C55E' : '#EF4444', fontWeight: 700 }}>
                  {pickSignals.score > 0 ? '+' : ''}{pickSignals.score} pts
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {pickSignals.senales.map((s, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px',
                    color: s.confianza > 0 ? '#CBD5E1' : '#F59E0B',
                  }}>
                    <span>{s.emoji}</span>
                    <span style={{ fontWeight: 600 }}>{sanitize(s.tipo)}:</span>
                    <span style={{ color: s.confianza > 0 ? '#94A3B8' : '#EF4444' }}>{sanitize(s.detalle)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA Apostar */}
          <button
            onClick={(e) => { e.stopPropagation(); if (canApostar) onApostar(); }}
            disabled={!canApostar}
            style={{
              width: '100%', padding: '10px', borderRadius: '10px', border: 'none', cursor: canApostar ? 'pointer' : 'not-allowed',
              fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              background: isOro ? 'linear-gradient(135deg, #00D1FF, #00B8E6)' : 'linear-gradient(135deg, #334155, #1E293B)',
              color: 'white', opacity: canApostar ? 1 : 0.4,
              boxShadow: isOro && canApostar ? '0 4px 15px rgba(0,209,255,0.3)' : 'none',
            }}>
            <Target style={{ width: '14px', height: '14px' }} />
            {canApostar ? `Apostar $${pick.stake_sugerido.toLocaleString()} → +$${pick.ganancia_potencial.toLocaleString()}` : 'Configura tu banca primero'}
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENTE: Registrar Modal (S8: inputs validados)
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

  // S8: Validate inputs before submit
  const handleSubmit = async () => {
    if (cuotaNum <= 1 || cuotaNum > 100) { setError('Cuota entre 1.01 y 100'); return; }
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '90%', maxWidth: '400px', padding: '20px', borderRadius: '16px',
        background: 'linear-gradient(145deg, #1E293B, #0F172A)', border: '1px solid rgba(0,209,255,0.2)',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#F1F5F9', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target style={{ width: '18px', height: '18px', color: '#00D1FF' }} /> Registrar Apuesta
          </h3>
          {pick.neuroscore && <ScoreRing score={pick.neuroscore} size={40} />}
        </div>

        {/* Pick info */}
        <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(0,209,255,0.05)', border: '1px solid rgba(0,209,255,0.15)', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#00D1FF' }}>{sanitize(pick.tipster)}</span>
            <div style={{ display: 'flex' }}>
              {[...Array(pick.confianza)].map((_, i) => (
                <Star key={i} style={{ width: '10px', height: '10px', color: '#FFDD57', fill: '#FFDD57' }} />
              ))}
            </div>
          </div>
          {esCombinada({ tipo_mercado: pick.tipo_mercado, apuesta: pick.apuesta }) ? (
            <CombinadaLegs textoApuesta={pick.apuesta} cuotaTotal={pick.cuota} compact />
          ) : (
            <p style={{ fontSize: '13px', color: '#F1F5F9' }}>{sanitize(pick.apuesta)}</p>
          )}
          <p style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>Cuota ref: @{pick.cuota}</p>
        </div>

        {/* Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Tu cuota</label>
            <input type="number" step="0.01" value={cuotaUsuario}
              onChange={e => setCuotaUsuario(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155', background: '#0F172A', color: '#F1F5F9', fontFamily: 'monospace', fontSize: '14px', outline: 'none' }} />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
              Stake <span style={{ color: '#64748B' }}>(Sugerido: ${pick.stake_sugerido.toLocaleString()})</span>
            </label>
            <input type="number" value={stake}
              onChange={e => setStake(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155', background: '#0F172A', color: '#F1F5F9', fontFamily: 'monospace', fontSize: '14px', outline: 'none' }} />
            <p style={{ fontSize: '10px', color: '#64748B', marginTop: '2px' }}>{porcentajeBanca.toFixed(1)}% de tu banca</p>
          </div>
        </div>

        {/* Ganancia */}
        <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(0,209,255,0.06)', border: '1px solid rgba(0,209,255,0.15)', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#94A3B8' }}>Ganancia potencial</span>
          <span style={{ fontSize: '16px', fontWeight: 900, fontFamily: 'monospace', color: '#00D1FF' }}>
            +${gananciaEstimada.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>

        {error && (
          <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: '12px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle style={{ width: '14px', height: '14px', flexShrink: 0 }} /> {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #334155', background: 'transparent', color: '#94A3B8', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={isLoading} style={{
            flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #00D1FF, #00B8E6)', color: '#FFF', fontSize: '13px', fontWeight: 800,
            opacity: isLoading ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}>
            {isLoading ? <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> : <><CheckCircle style={{ width: '14px', height: '14px' }} /> Confirmar</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// PÁGINA PRINCIPAL — IA Picks V2 Mobile-First
// ============================================================================
export default function PicksRecomendadosPage() {
  const [picks, setPicks] = useState<Pick[]>([]);
  const [bancaInfo, setBancaInfo] = useState<BancaInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPick, setSelectedPick] = useState<Pick | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [requiereSetup, setRequiereSetup] = useState(false);
  const [fetchError, setFetchError] = useState('');

  // ★ NeuroSignals state
  const [signalsData, setSignalsData] = useState<SignalsData | null>(null);

  // Filtros
  const [sportFilter, setSportFilter] = useState<string>('Todos');
  const [zonaFilter, setZonaFilter] = useState<string>('todos');
  const sportScrollRef = useRef<HTMLDivElement>(null);
  const [showScrollFade, setShowScrollFade] = useState(true);

  // ── Data fetching ──
  const fetchData = async () => {
    try {
      setFetchError('');
      let picksOk = false;
      let bancaOk = false;
      const [picksData, bancaData] = await Promise.all([
        picksAPI.getRecomendados().then((d: any) => { picksOk = true; return d; }).catch(() => ({ picks: [], total: 0, requiere_setup: false })),
        miBancaAPI.getEstado().then((d: any) => { bancaOk = true; return d; }).catch(() => ({ onboarding_completo: false, banca_actual: 0 })),
      ]);
      if (!picksOk && !bancaOk) { setFetchError('Sin conexión. Toca para reintentar.'); setPicks([]); setBancaInfo(null); return; }
      setRequiereSetup(picksData.requiere_setup || (bancaOk && !bancaData.onboarding_completo));
      setPicks(picksData.picks || []);
      const bancaActual = parseFloat(bancaData?.banca_actual) || 0;
      if (bancaActual > 0) { setBancaInfo({ banca_actual: bancaActual, perfil_riesgo: bancaData?.perfil_riesgo || 'moderado' }); }
      else { setBancaInfo(null); }
      setLastUpdate(new Date());

      // ★ Fetch NeuroSignals (non-blocking — degrades gracefully)
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (token) {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://franciscoanalistadeportivo.pythonanywhere.com';
          const sigRes = await fetch(`${API_URL}/api/neuro-signals/hoy`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          });
          if (sigRes.ok) {
            const sigData = await sigRes.json();
            setSignalsData(sigData);
          }
        }
      } catch {
        // NeuroSignals es mejora visual — no bloquea funcionalidad
        console.warn('NeuroSignals no disponible');
      }
    } catch (error) {
      console.error('Error cargando picks:', error);
      setFetchError('Error al cargar datos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); const interval = setInterval(fetchData, 120000); return () => clearInterval(interval); }, []);
  const handleApuestaRegistrada = () => { setSelectedPick(null); fetchData(); };

  // ── Unique sports from tipo_mercado ──
  const uniqueSports = Array.from(new Set(picks.map(p => normalizeSport(p.tipo_mercado)))).filter(s => s !== 'Otro').sort();

  // ── Stats ──
  const oroCount = picks.filter(p => (p.neuroscore || 0) >= 75 || p.confianza === 3).length;
  const avgScore = picks.length > 0 ? Math.round(picks.reduce((s, p) => s + (p.neuroscore || 50), 0) / picks.length) : 0;
  const totalStake = picks.reduce((s, p) => s + (p.stake_sugerido || 0), 0);
  const totalGan = picks.reduce((s, p) => s + (p.ganancia_potencial || 0), 0);
  const liveCount = picks.filter(p => getTimeStatus(p.hora_partido).isLive).length;

  // ── Insights dinámicos (fusiona backend signals + client fallback) ──
  const insights = generateInsights(picks, signalsData || undefined);

  // ── Filters ──
  let filtered = picks;
  if (sportFilter !== 'Todos') filtered = filtered.filter(p => normalizeSport(p.tipo_mercado) === sportFilter);
  if (zonaFilter === 'oro') filtered = filtered.filter(p => (p.neuroscore || 0) >= 75 || p.confianza === 3);
  if (zonaFilter === 'media') filtered = filtered.filter(p => (p.neuroscore || 0) >= 50 || p.confianza >= 2);

  // Sort: Oro first, then by score
  const sortedPicks = [...filtered].sort((a, b) => {
    const aLive = getTimeStatus(a.hora_partido).isLive ? 0 : 1;
    const bLive = getTimeStatus(b.hora_partido).isLive ? 0 : 1;
    if (aLive !== bLive) return aLive - bLive;
    return (b.neuroscore || 0) - (a.neuroscore || 0);
  });

  const canApostar = !!bancaInfo && bancaInfo.banca_actual > 0;

  // ── Loading ──
  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '256px', gap: '12px' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ width: '48px', height: '48px', border: '3px solid rgba(0,209,255,0.2)', borderTop: '3px solid #00D1FF', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <Brain style={{ width: '20px', height: '20px', color: '#00D1FF', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
        </div>
        <p style={{ fontSize: '13px', color: '#94A3B8' }}>Analizando picks con IA...</p>
      </div>
    );
  }

  // ========================================================================
  // RENDER
  // ========================================================================
  return (
    <div style={{ paddingBottom: '80px' }} className="animate-fadeIn">

      {/* ================================================================ */}
      {/* HEADER COMPACTO                                                  */}
      {/* ================================================================ */}
      <div style={{ padding: '12px 0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ padding: '6px', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(0,209,255,0.15), rgba(0,209,255,0.05))', border: '1px solid rgba(0,209,255,0.2)' }}>
              <Brain style={{ width: '18px', height: '18px', color: '#FF6B9D' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 900, color: '#F1F5F9', margin: 0 }}>Recomendaciones IA</h1>
              <span style={{ fontSize: '10px', color: '#64748B' }}>Análisis inteligente en tiempo real</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '10px', color: '#475569' }}>
              {lastUpdate.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00D1FF', animation: 'livePulse 1.5s infinite' }} />
          </div>
        </div>

        {/* ── KPIs Compactos ── */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '8px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '8px', flexShrink: 0, background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Zap style={{ width: '12px', height: '12px', color: '#00D1FF' }} />
            <span style={{ fontSize: '16px', fontWeight: 900, fontFamily: 'monospace', color: '#E2E8F0' }}>{picks.length}</span>
            <span style={{ fontSize: '9px', color: '#64748B' }}>picks</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '8px', flexShrink: 0, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
            <span style={{ fontSize: '12px' }}>🟢</span>
            <span style={{ fontSize: '16px', fontWeight: 900, fontFamily: 'monospace', color: '#22C55E' }}>{oroCount}</span>
            <span style={{ fontSize: '9px', color: '#64748B' }}>oro</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '8px', flexShrink: 0, background: 'rgba(0,209,255,0.06)', border: '1px solid rgba(0,209,255,0.15)' }}>
            <Brain style={{ width: '12px', height: '12px', color: '#00D1FF' }} />
            <span style={{ fontSize: '16px', fontWeight: 900, fontFamily: 'monospace', color: avgScore >= 70 ? '#00D1FF' : avgScore >= 50 ? '#F59E0B' : '#EF4444' }}>{avgScore}</span>
            <span style={{ fontSize: '9px', color: '#64748B' }}>/85</span>
          </div>
          {totalStake > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '8px', flexShrink: 0, background: 'rgba(255,221,87,0.06)', border: '1px solid rgba(255,221,87,0.15)' }}>
              <DollarSign style={{ width: '12px', height: '12px', color: '#FFDD57' }} />
              <span style={{ fontSize: '14px', fontWeight: 900, fontFamily: 'monospace', color: '#FFDD57' }}>${totalStake.toLocaleString()}</span>
            </div>
          )}
          {totalGan > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '8px', flexShrink: 0, background: 'rgba(0,209,255,0.08)', border: '1px solid rgba(0,209,255,0.2)' }}>
              <TrendingUp style={{ width: '12px', height: '12px', color: '#00D1FF' }} />
              <span style={{ fontSize: '14px', fontWeight: 900, fontFamily: 'monospace', color: '#00D1FF' }}>+${totalGan.toLocaleString()}</span>
            </div>
          )}
          {liveCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '8px', flexShrink: 0, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <span style={{ fontSize: '12px' }}>🔴</span>
              <span style={{ fontSize: '14px', fontWeight: 900, fontFamily: 'monospace', color: '#EF4444' }}>{liveCount}</span>
              <span style={{ fontSize: '8px', fontWeight: 800, color: '#EF4444' }}>LIVE</span>
            </div>
          )}
          {/* ★ NeuroSignals badge */}
          {signalsData && signalsData.resumen.con_senales > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '8px', flexShrink: 0, background: 'rgba(255,107,157,0.06)', border: '1px solid rgba(255,107,157,0.15)' }}>
              <span style={{ fontSize: '12px' }}>⚡</span>
              <span style={{ fontSize: '14px', fontWeight: 900, fontFamily: 'monospace', color: '#FF6B9D' }}>{signalsData.resumen.con_senales}</span>
              <span style={{ fontSize: '8px', fontWeight: 800, color: '#FF6B9D' }}>señales</span>
            </div>
          )}
        </div>
      </div>

      {/* ================================================================ */}
      {/* 🧠 INSIGHTS DINÁMICOS — Consejos basados en datos REALES         */}
      {/* ================================================================ */}
      {insights.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none', padding: '4px 0 8px' }}>
          {insights.map((ins, i) => {
            const colors = { positive: '#22C55E', warning: '#F59E0B', info: '#00D1FF', danger: '#EF4444' };
            const bgs = { positive: 'rgba(34,197,94,0.06)', warning: 'rgba(245,158,11,0.06)', info: 'rgba(0,209,255,0.06)', danger: 'rgba(239,68,68,0.06)' };
            return (
              <div key={i} style={{
                flexShrink: 0, padding: '8px 12px', borderRadius: '10px', maxWidth: '280px',
                background: bgs[ins.type], border: `1px solid ${colors[ins.type]}20`,
              }}>
                <p style={{ fontSize: '11px', color: colors[ins.type], fontWeight: 600, lineHeight: '1.4' }}>
                  {ins.emoji} {ins.text}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* ================================================================ */}
      {/* FILTROS STICKY — Deportes + Zona                                */}
      {/* ================================================================ */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20, paddingTop: '6px', paddingBottom: '6px',
        background: 'linear-gradient(180deg, var(--bg-main, #0F172A) 85%, transparent)',
      }}>
        {/* Fila 1: Sport tabs con fade */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '6px' }}>
          <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
            <div ref={sportScrollRef}
              onScroll={() => { const el = sportScrollRef.current; if (el) setShowScrollFade(el.scrollLeft < el.scrollWidth - el.clientWidth - 10); }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px', scrollbarWidth: 'none' }}>
              {['Todos', ...uniqueSports].map(f => (
                <button key={f} onClick={() => setSportFilter(f)} style={{
                  padding: '5px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                  fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap', transition: 'all 0.2s',
                  background: sportFilter === f ? 'linear-gradient(135deg, #00D1FF, #00A86B)' : 'rgba(255,255,255,0.04)',
                  color: sportFilter === f ? '#000' : '#94A3B8',
                  boxShadow: sportFilter === f ? '0 2px 10px rgba(0,209,255,0.25)' : 'none',
                }}>
                  {f !== 'Todos' ? sportIcon(f === 'Fútbol' ? 'GANADOR' : f === 'Básquetbol' ? 'OVER PUNTOS' : 'TENIS') + ' ' : ''}{f}
                </button>
              ))}
            </div>
            {showScrollFade && (
              <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '40px', background: 'linear-gradient(to right, transparent, #0F172A)', pointerEvents: 'none' }} />
            )}
          </div>
        </div>

        {/* Fila 2: Zona filter */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '2px' }}>
          {[
            { key: 'todos', label: `Todos (${picks.length})` },
            { key: 'oro', label: `🟢 Oro (${oroCount})` },
            { key: 'media', label: `🟡 Media+ (${picks.filter(p => (p.neuroscore || 0) >= 50 || p.confianza >= 2).length})` },
          ].map(tab => (
            <button key={tab.key} onClick={() => setZonaFilter(tab.key)} style={{
              padding: '5px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer',
              fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap',
              background: zonaFilter === tab.key ? 'rgba(0,209,255,0.15)' : 'rgba(255,255,255,0.03)',
              color: zonaFilter === tab.key ? '#00D1FF' : '#64748B',
              borderBottom: zonaFilter === tab.key ? '2px solid #00D1FF' : '2px solid transparent',
            }}>
              {tab.label}
            </button>
          ))}
          {/* Perfil riesgo inline */}
          {bancaInfo && (
            <span style={{
              padding: '5px 10px', borderRadius: '7px', fontSize: '10px', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 'auto',
              background: 'rgba(255,221,87,0.06)', border: '1px solid rgba(255,221,87,0.15)', color: '#FFDD57',
              display: 'flex', alignItems: 'center', gap: '4px',
            }}>
              <Shield style={{ width: '10px', height: '10px' }} />
              {sanitize(bancaInfo.perfil_riesgo.charAt(0).toUpperCase() + bancaInfo.perfil_riesgo.slice(1))}
              · ${bancaInfo.banca_actual.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* ================================================================ */}
      {/* ERROR / SETUP STATES                                             */}
      {/* ================================================================ */}
      {fetchError && !isLoading && (
        <button onClick={() => { setFetchError(''); setIsLoading(true); fetchData(); }}
          style={{ width: '100%', padding: '24px', borderRadius: '16px', textAlign: 'center', cursor: 'pointer', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.04)' }}>
          <AlertCircle style={{ width: '40px', height: '40px', color: '#EF4444', margin: '0 auto 12px' }} />
          <p style={{ fontWeight: 700, color: '#F1F5F9', marginBottom: '4px' }}>Error de conexión</p>
          <p style={{ fontSize: '12px', color: '#94A3B8' }}>{fetchError}</p>
          <span style={{ fontSize: '12px', color: '#00D1FF', marginTop: '8px', display: 'inline-block' }}>🔄 Toca para reintentar</span>
        </button>
      )}

      {requiereSetup && !isLoading && !fetchError && (
        <div style={{ padding: '24px', borderRadius: '16px', textAlign: 'center', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <Zap style={{ width: '32px', height: '32px', color: '#FFDD57', margin: '0 auto 12px' }} />
          <h3 style={{ fontWeight: 800, color: '#F1F5F9', fontSize: '16px', marginBottom: '4px' }}>Configura tu banca</h3>
          <p style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '12px' }}>Para ver stakes personalizados según tu perfil de riesgo</p>
          <Link href="/dashboard/mi-banca/setup" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #FFDD57, #D4A843)', color: '#0F172A', fontWeight: 800, fontSize: '13px', textDecoration: 'none',
          }}>
            <Target style={{ width: '14px', height: '14px' }} /> Configurar Mi Banca
          </Link>
        </div>
      )}

      {/* ================================================================ */}
      {/* LISTA DE PICKS                                                   */}
      {/* ================================================================ */}
      {!fetchError && (
        <>
          {sortedPicks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', borderRadius: '16px', background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Brain style={{ width: '48px', height: '48px', color: '#334155', margin: '0 auto 16px' }} />
              <p style={{ color: '#94A3B8', fontSize: '14px' }}>Sin picks en este filtro</p>
              <p style={{ color: '#475569', fontSize: '11px', marginTop: '4px' }}>Las recomendaciones aparecerán cuando la IA analice los picks del día</p>
              {(zonaFilter !== 'todos' || sportFilter !== 'Todos') && (
                <button onClick={() => { setZonaFilter('todos'); setSportFilter('Todos'); }}
                  style={{ marginTop: '12px', padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(0,209,255,0.3)', background: 'transparent', color: '#00D1FF', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  Ver todos los picks
                </button>
              )}
            </div>
          ) : (
            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.04)' }}>
              {sortedPicks.map(pick => (
                <PickRow key={pick.id} pick={pick} canApostar={canApostar}
                  onApostar={() => setSelectedPick(pick)}
                  pickSignals={signalsData?.signals?.[String(pick.id)]} />
              ))}
            </div>
          )}

          {/* Link Centro Operaciones */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px' }}>
            <Link href="/dashboard/apuestas" style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '10px',
              background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.08)', color: '#94A3B8',
              fontSize: '12px', fontWeight: 600, textDecoration: 'none',
            }}>
              <Eye style={{ width: '14px', height: '14px' }} /> Ver todas las apuestas del día <ArrowRight style={{ width: '14px', height: '14px' }} />
            </Link>
          </div>
        </>
      )}

      {/* Banca bar */}
      {bancaInfo && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '12px', background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(255,221,87,0.15)', marginTop: '12px' }}>
          <div>
            <p style={{ fontSize: '10px', color: '#94A3B8' }}>Tu banca actual</p>
            <p style={{ fontSize: '18px', fontWeight: 900, fontFamily: 'monospace', color: '#F1F5F9' }}>${bancaInfo.banca_actual.toLocaleString()}</p>
          </div>
          <Link href="/dashboard/mi-banca" style={{
            padding: '8px 16px', borderRadius: '8px', textDecoration: 'none',
            background: 'linear-gradient(135deg, #FFDD57, #D4A843)', color: '#0F172A', fontWeight: 800, fontSize: '12px',
          }}>
            Ver Banca
          </Link>
        </div>
      )}

      {/* Footer */}
      <p style={{ fontSize: '10px', color: '#475569', textAlign: 'center', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.03)', marginTop: '12px' }}>
        💡 Stakes calculados según tu perfil de riesgo y banca · NeuroScore v2.0
      </p>

      {/* Modal */}
      {selectedPick && canApostar && (
        <RegistrarModal pick={selectedPick} banca={bancaInfo!.banca_actual} onClose={() => setSelectedPick(null)} onSuccess={handleApuestaRegistrada} />
      )}

      {/* CSS */}
      <style jsx>{`
        @keyframes livePulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.3; transform: scale(0.7); } }
        @keyframes liveGlow { 0%, 100% { box-shadow: 0 0 8px rgba(239,68,68,0.4); } 50% { box-shadow: 0 0 16px rgba(239,68,68,0.6); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
