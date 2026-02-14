'use client';

// ============================================================================
// NEUROTIPS DASHBOARD V15 — "SPORTSBOOK IA"
// ============================================================================
// Estilo casa de apuestas (Betano) + cerebro IA
// Endpoints: /api/public/dashboard-ia, /api/picks/live, /api/alertas/rachas
// Security: JWT auth, XSS-safe rendering, no secrets exposed, rate-limit aware
// Git strategy: This is page_v15.tsx — swap with page.tsx when approved
// ============================================================================

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  TrendingUp, TrendingDown, Users, Calendar, Target, AlertTriangle,
  ChevronRight, Zap, Trophy, Clock, Star, ArrowUpRight, Brain,
  Flame, Shield, Eye, Activity, BarChart3, MessageCircle, Phone,
  Volume2, VolumeX, ChevronDown, ChevronUp, Award, Percent, Info,
  Share2, Copy, Check, X as XIcon, Filter
} from 'lucide-react';
import { dashboardAPI, picksAPI, alertasAPI, tipstersAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import CombinadaCertificada from '@/components/CombinadaCertificada';
import CombinadaLegs, { esCombinada } from '@/components/CombinadaLegs';
import StatsReales from '@/components/StatsReales';

// ============================================================================
// TYPES — Same interfaces as V14 (zero breaking changes)
// ============================================================================
interface IAAnalysis {
  score: number;
  zona: 'ORO' | 'NEUTRA' | 'RIESGO' | 'BLOQUEADO';
  zona_color: string;
  factores: { nombre: string; valor: number; impacto: string }[];
  veredicto: string;
  stake_mult: number;
  alerts: string[];
  ev: number;
  tipster_wr: number;
  tipster_roi: number;
  tipster_specialty: string;
  tipster_best_streak: number;
  golden_rules: string[];
  total_bets_analyzed: number;
}

interface Apuesta {
  id: number;
  tipster_id: number;
  tipster_alias: string;
  deporte: string;
  apuesta: string;
  cuota: number;
  resultado: string;
  stake_ia: number;
  stake_tipster: number;
  ganancia_neta: number;
  filtro_claude: string;
  analisis: string;
  tipo_mercado: string;
  racha_actual: number;
  hora_partido: string;
  imagen_url: string;
  odds_comparacion: any;
  ia_analysis?: IAAnalysis | null;
}

interface DashboardData {
  totalTipsters: number;
  apuestasHoy: number;
  topTipster: { alias: string; ganancia: number } | null;
  alertas: { alias: string; racha: number; tipster_id?: number }[];
  apuestasRecientes: Apuesta[];
  iaVersion: string;
  profilesAvailable: number[];
  allTipsters: { id: number; alias: string; deporte: string }[];
}

// ============================================================================
// SECURITY: Sanitize text output (XSS prevention)
// ============================================================================
const sanitize = (text: string | null | undefined): string => {
  if (!text) return '';
  return String(text).replace(/[<>"'&]/g, (c) => {
    const map: Record<string, string> = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;' };
    return map[c] || c;
  });
};

// ============================================================================
// SOUND SYSTEM — Reused from V14
// ============================================================================
const useSoundNotifications = () => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
    return audioCtxRef.current;
  }, []);

  const playTone = useCallback((freq: number, duration: number, type: OscillatorType = 'sine', vol = 0.15) => {
    if (!soundEnabled) return;
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type; osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + duration);
    } catch (_e) { /* Security: fail silently */ }
  }, [soundEnabled, getCtx]);

  const playNewPick = useCallback(() => {
    playTone(880, 0.15, 'sine', 0.12);
    setTimeout(() => playTone(1100, 0.2, 'sine', 0.1), 150);
  }, [playTone]);
  const playWin = useCallback(() => {
    playTone(523, 0.12, 'sine', 0.12);
    setTimeout(() => playTone(659, 0.12, 'sine', 0.12), 120);
    setTimeout(() => playTone(784, 0.2, 'sine', 0.12), 240);
  }, [playTone]);
  const playLoss = useCallback(() => { playTone(350, 0.3, 'triangle', 0.08); }, [playTone]);

  return { soundEnabled, setSoundEnabled, playNewPick, playWin, playLoss };
};

// ============================================================================
// IA CONFIDENCE RING — Circular score indicator
// ============================================================================
const IAConfidenceRing = ({ score, zona, size = 40 }: { score: number; zona: string; size?: number }) => {
  const radius = (size - 5) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeScore = Math.max(0, Math.min(85, Number(score) || 0));
  const offset = circumference - (safeScore / 85) * circumference;

  const colors: Record<string, { stroke: string; glow: string }> = {
    ORO: { stroke: '#22C55E', glow: 'rgba(34,197,94,0.4)' },
    NEUTRA: { stroke: '#F59E0B', glow: 'rgba(245,158,11,0.4)' },
    RIESGO: { stroke: '#EF4444', glow: 'rgba(239,68,68,0.4)' },
    BLOQUEADO: { stroke: '#6B7280', glow: 'rgba(107,114,128,0.3)' },
  };
  const c = colors[zona] || colors.NEUTRA;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={c.stroke} strokeWidth="3" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out', filter: `drop-shadow(0 0 4px ${c.glow})` }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size > 40 ? '13px' : '10px', fontWeight: 900, color: c.stroke, fontFamily: 'monospace', lineHeight: 1 }}>
          {safeScore}
        </span>
        {size > 40 && <span style={{ fontSize: '7px', color: '#FF6B9D', fontWeight: 600, letterSpacing: '0.5px' }}>IA</span>}
      </div>
    </div>
  );
};

// ============================================================================
// ZONA BADGE — Colored pill
// ============================================================================
const ZonaBadge = ({ zona, small = false }: { zona: string; small?: boolean }) => {
  const config: Record<string, { bg: string; border: string; color: string; emoji: string; label: string }> = {
    ORO: { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.35)', color: '#22C55E', emoji: '🟢', label: 'ZONA ORO' },
    NEUTRA: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)', color: '#F59E0B', emoji: '🟡', label: 'ZONA NEUTRA' },
    RIESGO: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)', color: '#EF4444', emoji: '🔴', label: 'PELIGRO' },
    BLOQUEADO: { bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.35)', color: '#6B7280', emoji: '🚫', label: 'BLOQUEADO' },
  };
  const c = config[zona] || config.NEUTRA;

  return (
    <span style={{
      background: c.bg, border: `1px solid ${c.border}`, color: c.color,
      fontSize: small ? '8px' : '9px', fontWeight: 800, padding: small ? '1px 5px' : '2px 7px',
      borderRadius: '5px', letterSpacing: '0.5px', display: 'inline-flex', alignItems: 'center', gap: '3px',
      whiteSpace: 'nowrap',
    }}>
      {c.emoji} {c.label}
    </span>
  );
};

// ============================================================================
// FACTOR BAR — For deep analysis modal
// ============================================================================
const FactorBar = ({ factor }: { factor: { nombre: string; valor: number; impacto: string } }) => {
  const colorMap: Record<string, string> = {
    positivo: '#00D1FF', elite: '#00D1FF', neutral: '#F59E0B', negativo: '#EF4444', bloqueado: '#6B7280'
  };
  const color = colorMap[factor.impacto] || '#F59E0B';
  const safeVal = Math.max(0, Math.min(100, Number(factor.valor) || 0));

  return (
    <div style={{ marginBottom: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
        <span style={{ fontSize: '10px', color: '#CBD5E1' }}>{sanitize(factor.nombre)}</span>
        <span style={{ fontSize: '10px', fontWeight: 700, color, fontFamily: 'monospace' }}>{safeVal}%</span>
      </div>
      <div style={{ width: '100%', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)' }}>
        <div style={{
          width: `${safeVal}%`, height: '100%', borderRadius: '2px',
          background: `linear-gradient(90deg, ${color}, ${color}CC)`,
          transition: 'width 0.8s ease-out', boxShadow: `0 0 6px ${color}40`,
        }} />
      </div>
    </div>
  );
};

// ============================================================================
// DYNAMIC ROTATING PHRASES — Uses real data from API
// ============================================================================
const FrasesDinamicas = ({ data, rachas }: { data: DashboardData; rachas: any }) => {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  // Build dynamic phrases from REAL data
  const frases = [
    `${data.profilesAvailable?.length || 0} tipsters analizados con IA profunda`,
    'Donde la suerte se vuelve ciencia',
    `Hoy ${data.apuestasHoy || 0} picks analizados — solo los mejores pasan`,
    'Hacemos lo que el ojo humano no ve',
    'El único sistema que analiza DNA de cada tipster',
    'IA que aprende de cada resultado',
    'Cada pick analizado en tiempo real',
    '6 señales neuronales por cada pick',
    'Zona ORO = máxima confianza IA',
    'Tu ventaja empieza aquí',
    'El Tesla de las predicciones deportivas',
  ];

  // Add data-driven phrases
  if (rachas?.alertas?.length > 0) {
    const topRacha = rachas.alertas.find((a: any) => a.tipo === 'positiva');
    if (topRacha) frases.push(`Racha más alta: ${topRacha.tipster} con W${topRacha.racha}`);
  }
  if (data.topTipster) {
    frases.push(`Tipster del mes: ${data.topTipster.alias} — Mejor rendimiento`);
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => { setIndex(prev => (prev + 1) % frases.length); setFade(true); }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, [frases.length]);

  return (
    <span style={{ opacity: fade ? 1 : 0, color: '#00D1FF', fontStyle: 'italic', fontSize: '11px', transition: 'opacity 0.4s' }}>
      &quot;{frases[index % frases.length]}&quot;
    </span>
  );
};

// ============================================================================
// SPORT NORMALIZATION — Groups all DB variants into display categories
// DB values can be: 'Futbol', 'Fútbol', 'NBA', 'Baloncesto', 'Basketball',
// 'Basket', 'Tenis', 'Hockey', 'MMA', 'Mixto', 'eSports', 'Baseball', etc.
// ============================================================================
const SPORT_CATEGORIES: Record<string, { label: string; icon: string; keywords: string[] }> = {
  'Fútbol': {
    label: 'Fútbol',
    icon: '⚽',
    keywords: ['futbol', 'fútbol', 'soccer', 'football'],
  },
  'Básquetbol': {
    label: 'Básquetbol',
    icon: '🏀',
    keywords: ['basket', 'basketball', 'baloncesto', 'basquetbol', 'básquetbol', 'nba', 'euroleague', 'euroliga'],
  },
  'Tenis': {
    label: 'Tenis',
    icon: '🎾',
    keywords: ['tenis', 'tennis', 'atp', 'wta', 'itf'],
  },
  'Voleibol': {
    label: 'Voleibol',
    icon: '🏐',
    keywords: ['voleibol', 'voley', 'volleyball'],
  },
  'Handball': {
    label: 'Handball',
    icon: '🤾',
    keywords: ['handball', 'balonmano'],
  },
  'Hockey': {
    label: 'Hockey',
    icon: '🏒',
    keywords: ['hockey', 'nhl'],
  },
  'Béisbol': {
    label: 'Béisbol',
    icon: '⚾',
    keywords: ['baseball', 'beisbol', 'béisbol', 'mlb'],
  },
  'MMA': {
    label: 'MMA',
    icon: '🥊',
    keywords: ['mma', 'ufc', 'boxeo', 'boxing'],
  },
  'Esports': {
    label: 'Esports',
    icon: '🎮',
    keywords: ['esports', 'esport', 'gaming', 'lol', 'csgo', 'dota', 'valorant'],
  },
};

/**
 * Normalize any DB deporte value to a display category.
 * "Multideporte" / "Mixto" are tipster categories, NOT real sports.
 * Picks with these values have an undefined sport → return null.
 */
const normalizeSport = (deporte: string | null | undefined): string | null => {
  if (!deporte) return null;
  const lower = deporte.toLowerCase().trim();
  // These are tipster categories, not sports — skip them
  if (['mixto', 'multideporte', 'multi'].includes(lower)) return null;
  for (const [category, config] of Object.entries(SPORT_CATEGORIES)) {
    if (config.keywords.some(kw => lower.includes(kw) || lower === kw)) {
      return category;
    }
  }
  return null;
};

/** Get icon for any sport value — unknown sports get generic icon */
const sportIcon = (deporte: string): string => {
  const normalized = normalizeSport(deporte);
  if (normalized && SPORT_CATEGORIES[normalized]) return SPORT_CATEGORIES[normalized].icon;
  return '🎯';
};

// ============================================================================
// TIME STATUS HELPER — Determines if pick is live, starting soon, or upcoming
// ============================================================================
const getTimeStatus = (hora: string | null, resultado: string) => {
  if (!hora || resultado === 'GANADA' || resultado === 'PERDIDA' || resultado === 'NULA') {
    return { label: hora || '', color: '#94A3B8', isLive: false, isSoon: false };
  }
  try {
    const [h, m] = hora.split(':').map(Number);
    const now = new Date();
    const horaMin = h * 60 + (m || 0);
    const nowMin = now.getHours() * 60 + now.getMinutes();
    if (nowMin >= horaMin) return { label: 'EN VIVO', color: '#EF4444', isLive: true, isSoon: false };
    if (horaMin - nowMin <= 30) return { label: hora, color: '#F59E0B', isLive: false, isSoon: true };
    return { label: hora, color: '#94A3B8', isLive: false, isSoon: false };
  } catch (_e) {
    return { label: hora || '', color: '#94A3B8', isLive: false, isSoon: false };
  }
};

// ============================================================================
// SHARE PICK — Generate share text + copy/WhatsApp/X
// ============================================================================
const SharePick = ({ apuesta, onClose }: { apuesta: Apuesta; onClose: () => void }) => {
  const [copied, setCopied] = useState(false);
  const ia = apuesta.ia_analysis;

  // Security: sanitize all user-facing text
  const shareText = [
    '🧠 NeuroTips IA — Pick Certificado',
    '',
    `${sportIcon(apuesta.deporte)} ${sanitize(apuesta.apuesta)}`,
    `📋 ${sanitize(apuesta.tipo_mercado || 'Mercado')}`,
    `💰 @${(apuesta.cuota || 0).toFixed(2)}${ia?.ev ? ` · EV: +${ia.ev}%` : ''}`,
    ia ? `${ia.zona === 'ORO' ? '🟢 ZONA ORO' : ia.zona === 'RIESGO' ? '🔴 PELIGRO' : '🟡 ZONA NEUTRA'} · Score: ${ia.score}/85` : '',
    '',
    '📊 neurotips.io',
  ].filter(Boolean).join('\n');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_e) { /* Security: clipboard may be blocked */ }
  };

  const handleWhatsApp = () => {
    // Security: encode for URL
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
  };

  const handleX = () => {
    const tweetText = `${sportIcon(apuesta.deporte)} ${sanitize(apuesta.apuesta)} @${apuesta.cuota?.toFixed(2)} ${ia?.zona === 'ORO' ? '🟢 ZONA ORO' : ''}\n\n📊 neurotips.io #betting #neurotips`;
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div style={{ marginTop: '12px', padding: '12px', borderRadius: '10px', background: 'rgba(0,209,255,0.04)', border: '1px solid rgba(0,209,255,0.12)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#00D1FF', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Share2 style={{ width: '14px', height: '14px' }} /> Compartir este pick
        </span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '2px' }}>
          <XIcon style={{ width: '14px', height: '14px' }} />
        </button>
      </div>
      {/* Preview */}
      <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', marginBottom: '10px', fontSize: '11px', color: '#CBD5E1', whiteSpace: 'pre-line', fontFamily: 'monospace', lineHeight: 1.5 }}>
        {shareText}
      </div>
      {/* Buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={handleWhatsApp} style={{
          flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
          background: 'rgba(34,197,94,0.15)', color: '#22C55E', fontSize: '11px', fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
        }}>
          <MessageCircle style={{ width: '14px', height: '14px' }} /> WhatsApp
        </button>
        <button onClick={handleX} style={{
          flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
          background: 'rgba(255,255,255,0.06)', color: '#F1F5F9', fontSize: '11px', fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
        }}>
          𝕏 Post
        </button>
        <button onClick={handleCopy} style={{
          flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
          background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(0,209,255,0.1)',
          color: copied ? '#22C55E' : '#00D1FF', fontSize: '11px', fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
        }}>
          {copied ? <Check style={{ width: '14px', height: '14px' }} /> : <Copy style={{ width: '14px', height: '14px' }} />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// PICK ROW — Betano-style with PROMINENT TIME
// ============================================================================
const PickRow = ({ apuesta, onClick }: { apuesta: Apuesta; onClick: () => void }) => {
  const [expanded, setExpanded] = useState(false);
  const ia = apuesta.ia_analysis;
  const timeStatus = getTimeStatus(apuesta.hora_partido, apuesta.resultado);
  const isResolved = apuesta.resultado === 'GANADA' || apuesta.resultado === 'PERDIDA';
  const isWin = apuesta.resultado === 'GANADA';
  const racha = apuesta.racha_actual || 0;

  const borderColor = timeStatus.isLive ? 'rgba(239,68,68,0.2)' : isResolved ? (isWin ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)') : 'rgba(255,255,255,0.04)';
  const bg = timeStatus.isLive ? 'rgba(239,68,68,0.04)' : isResolved ? (isWin ? 'rgba(34,197,94,0.03)' : 'rgba(239,68,68,0.03)') : 'rgba(30,41,59,0.3)';

  return (
    <div style={{ borderBottom: `1px solid ${borderColor}` }}>
      {/* ── ROW PRINCIPAL — click para expandir/colapsar ── */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex', alignItems: 'center', padding: '10px 12px', gap: '10px',
          background: bg, cursor: 'pointer', transition: 'background 0.2s',
        }}
      >
        {/* ★ TIME COLUMN */}
        <div style={{ width: '54px', flexShrink: 0, textAlign: 'center' }}>
          {timeStatus.isLive ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
              <span style={{
                fontSize: '9px', fontWeight: 900, color: '#FFF',
                background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '3px',
                boxShadow: '0 0 8px rgba(239,68,68,0.4)',
                animation: 'liveGlow 2s ease-in-out infinite',
              }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#FFF', display: 'inline-block', animation: 'livePulse 1.5s infinite' }} />
                LIVE
              </span>
              <span style={{ fontSize: '11px', color: '#EF4444', fontFamily: 'monospace', fontWeight: 800, letterSpacing: '-0.3px' }}>
                {apuesta.hora_partido}
              </span>
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
                color: timeStatus.isSoon ? '#F59E0B' : '#E2E8F0',
                textShadow: timeStatus.isSoon ? '0 0 8px rgba(245,158,11,0.3)' : 'none',
              }}>
                {timeStatus.label}
              </span>
              <span style={{ fontSize: '8px', color: '#475569', fontWeight: 600, letterSpacing: '0.5px' }}>CL</span>
              {timeStatus.isSoon && (
                <span style={{ fontSize: '7px', fontWeight: 900, color: '#F59E0B', background: 'rgba(245,158,11,0.12)', padding: '1px 5px', borderRadius: '3px', marginTop: '1px' }}>⚡ 30 MIN</span>
              )}
            </div>
          )}
        </div>

        {/* DIVIDER */}
        <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />

        {/* SPORT ICON */}
        <span style={{ fontSize: '18px', flexShrink: 0 }}>{sportIcon(apuesta.deporte)}</span>

        {/* MATCH + MARKET + TIPSTER */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px', flexWrap: 'wrap' }}>
            {esCombinada({ tipo_mercado: apuesta.tipo_mercado, apuesta: apuesta.apuesta }) ? (
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
            <span style={{ fontSize: '10px', color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px' }}>
              {sanitize(apuesta.tipo_mercado || '')}
            </span>
            <span style={{ fontSize: '9px', color: '#475569' }}>·</span>
            <span style={{ fontSize: '10px', color: '#818CF8', fontWeight: 600 }}>{sanitize(apuesta.tipster_alias)}</span>
            {racha >= 4 && (
              <span style={{ fontSize: '8px', fontWeight: 800, color: '#22C55E', background: 'rgba(34,197,94,0.1)', padding: '1px 4px', borderRadius: '3px' }}>
                🔥W{racha}
              </span>
            )}
            {ia && ia.zona === 'RIESGO' && (
              <span style={{ fontSize: '8px', fontWeight: 800, color: '#EF4444', background: 'rgba(239,68,68,0.1)', padding: '1px 4px', borderRadius: '3px' }}>
                ⚠️
              </span>
            )}
          </div>
        </div>

        {/* NEUROSCORE + CUOTA + CHEVRON */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {ia && <IAConfidenceRing score={ia.score} zona={ia.zona} size={34} />}
          <div style={{
            background: ia?.zona === 'ORO' ? 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.08))' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${ia?.zona === 'ORO' ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: '8px', padding: '5px 10px', textAlign: 'center', minWidth: '52px',
          }}>
            <span style={{ fontSize: '15px', fontWeight: 900, fontFamily: 'monospace', color: ia?.zona === 'ORO' ? '#22C55E' : '#F1F5F9', letterSpacing: '-0.5px' }}>
              @{(apuesta.cuota || 0).toFixed(2)}
            </span>
          </div>
          <ChevronDown style={{ 
            width: '14px', height: '14px', color: '#475569', flexShrink: 0,
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }} />
        </div>
      </div>

      {/* ── PANEL EXPANDIBLE — Pronóstico inline sin abrir modal ── */}
      {expanded && ia && (
        <div style={{ padding: '0 12px 12px', background: 'rgba(15,23,42,0.5)' }}>
          {/* Zona + EV + Stake en una línea */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap', paddingTop: '8px' }}>
            <ZonaBadge zona={ia.zona} />
            {ia.ev > 0 && (
              <span style={{ fontSize: '9px', fontWeight: 800, fontFamily: 'monospace', color: '#00D1FF', background: 'rgba(0,209,255,0.1)', padding: '2px 7px', borderRadius: '5px' }}>
                EV: +{ia.ev}%
              </span>
            )}
            <span style={{ fontSize: '9px', fontWeight: 700, color: '#818CF8', background: 'rgba(99,102,241,0.1)', padding: '2px 7px', borderRadius: '5px' }}>
              Stake: x{(ia.stake_mult || 1).toFixed(2)}
            </span>
          </div>

          {/* Veredicto IA — el pronóstico clave */}
          <div style={{
            padding: '10px 12px', borderRadius: '10px', marginBottom: '8px',
            background: `rgba(${ia.zona === 'ORO' ? '34,197,94' : ia.zona === 'RIESGO' ? '239,68,68' : '245,158,11'},0.06)`,
            border: `1px solid rgba(${ia.zona === 'ORO' ? '34,197,94' : ia.zona === 'RIESGO' ? '239,68,68' : '245,158,11'},0.12)`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Brain style={{ width: '14px', height: '14px', color: '#FF6B9D', flexShrink: 0 }} />
              <p style={{ fontSize: '11px', color: '#E2E8F0', lineHeight: 1.4, margin: 0 }}>
                {sanitize(ia.veredicto || 'Sin veredicto disponible')}
              </p>
            </div>
          </div>

          {/* Top 2 factores + alertas */}
          {(ia.factores || []).slice(0, 2).map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{sanitize(f.nombre || '')}</span>
              <span style={{ fontSize: '10px', fontWeight: 800, fontFamily: 'monospace', color: f.valor >= 60 ? '#22C55E' : f.valor >= 40 ? '#F59E0B' : '#EF4444' }}>
                {f.valor}%
              </span>
            </div>
          ))}

          {/* Botón ver análisis completo */}
          <button onClick={(e) => { e.stopPropagation(); onClick(); }} style={{
            width: '100%', marginTop: '8px', padding: '8px', borderRadius: '8px', cursor: 'pointer',
            background: 'rgba(0,209,255,0.08)', border: '1px solid rgba(0,209,255,0.15)',
            color: '#00D1FF', fontSize: '11px', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}>
            🔬 Ver análisis completo
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// PICK DETAIL MODAL — Slide-up with deep analysis + share
// ============================================================================
const PickModal = ({ apuesta, onClose }: { apuesta: Apuesta | null; onClose: () => void }) => {
  const [showShare, setShowShare] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  if (!apuesta) return null;

  const ia = apuesta.ia_analysis;
  const timeStatus = getTimeStatus(apuesta.hora_partido, apuesta.resultado);
  const tabs = [
    { icon: '🔬', label: 'Diagnóstico', key: 'diagnostico' },
    { icon: '📊', label: 'Valor Esperado', key: 'ev' },
    { icon: '📈', label: 'Histórico', key: 'historico' },
    { icon: '⚖️', label: 'Veredicto', key: 'veredicto' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
      <div onClick={(e) => e.stopPropagation()} style={{
        position: 'relative', width: '100%', maxWidth: '500px', maxHeight: '85vh', overflowY: 'auto',
        background: 'linear-gradient(180deg, #1A2332 0%, #0F172A 100%)', borderRadius: '20px 20px 0 0',
        border: '1px solid rgba(0,209,255,0.15)', padding: '16px 18px 24px',
      }}>
        {/* Handle + Back button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <button onClick={onClose} style={{
            display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px',
            borderRadius: '6px', border: 'none', cursor: 'pointer',
            background: 'rgba(255,255,255,0.06)', color: '#94A3B8', fontSize: '11px', fontWeight: 600,
          }}>
            ← Volver
          </button>
          <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.15)' }} />
          <div style={{ width: '60px' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '48px' }}>
              <span style={{ fontSize: '22px' }}>{sportIcon(apuesta.deporte)}</span>
              {timeStatus.isLive ? (
                <span style={{ fontSize: '8px', fontWeight: 900, color: '#FFF', background: '#EF4444', padding: '1px 5px', borderRadius: '3px', marginTop: '2px' }}>LIVE</span>
              ) : (
                <span style={{ fontSize: '12px', fontWeight: 800, fontFamily: 'monospace', color: timeStatus.color, marginTop: '2px' }}>{timeStatus.label}</span>
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              {esCombinada({ tipo_mercado: apuesta.tipo_mercado, apuesta: apuesta.apuesta }) ? (
                <CombinadaLegs textoApuesta={apuesta.apuesta} cuotaTotal={apuesta.cuota} resultado={apuesta.resultado} />
              ) : (
                <p style={{ fontSize: '15px', fontWeight: 800, color: '#F1F5F9', margin: 0, lineHeight: 1.3 }}>{sanitize(apuesta.apuesta)}</p>
              )}
              <p style={{ fontSize: '11px', color: '#94A3B8', margin: '2px 0 0' }}>{sanitize(apuesta.tipo_mercado || '')}</p>
            </div>
          </div>
          {ia && <IAConfidenceRing score={ia.score} zona={ia.zona} size={50} />}
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {ia && <ZonaBadge zona={ia.zona} />}
          {ia && ia.ev > 0 && (
            <span style={{ fontSize: '9px', fontWeight: 800, fontFamily: 'monospace', color: '#00D1FF', background: 'rgba(0,209,255,0.1)', padding: '2px 7px', borderRadius: '5px' }}>
              EV: +{ia.ev}%
            </span>
          )}
          {ia && (
            <span style={{ fontSize: '9px', fontWeight: 700, color: '#818CF8', background: 'rgba(99,102,241,0.1)', padding: '2px 7px', borderRadius: '5px' }}>
              Stake: x{(ia.stake_mult || 1).toFixed(2)}
            </span>
          )}
        </div>

        {/* Info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px' }}>
          {[
            { label: 'CUOTA', value: `@${(apuesta.cuota || 0).toFixed(2)}`, color: '#F59E0B' },
            { label: 'HORA', value: `${apuesta.hora_partido || '—'} CL`, color: timeStatus.color },
            { label: 'TIPSTER', value: sanitize(apuesta.tipster_alias || ''), color: '#00D1FF' },
          ].map(item => (
            <div key={item.label} style={{ textAlign: 'center', padding: '8px 4px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ fontSize: '8px', color: '#64748B', fontWeight: 700, marginBottom: '3px', letterSpacing: '0.5px' }}>{item.label}</p>
              <p style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'monospace', color: item.color }}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* Image (if available) */}
        {apuesta.imagen_url && (
          <div style={{ marginBottom: '12px', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
            <img
              src={`${process.env.NEXT_PUBLIC_API_URL || ''}${apuesta.imagen_url}`}
              alt="Capture"
              style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', cursor: 'zoom-in' }}
              onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || ''}${apuesta.imagen_url}`, '_blank', 'noopener,noreferrer')}
            />
          </div>
        )}

        {/* IA Deep Analysis — Tabs (moved from inline accordion to modal) */}
        {ia && (
          <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(0,209,255,0.12)', background: 'rgba(0,209,255,0.03)', marginBottom: '12px' }}>
            <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(0,209,255,0.08)' }}>
              <Brain style={{ width: '14px', height: '14px', color: '#FF6B9D' }} />
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#00D1FF' }}>Análisis IA Profundo</span>
              <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', background: 'rgba(0,209,255,0.1)', color: '#00D1FF', fontFamily: 'monospace' }}>v2.0</span>
            </div>

            {/* Tab nav */}
            <div style={{ display: 'flex', gap: '3px', padding: '6px 10px', overflowX: 'auto' }}>
              {tabs.map((tab, i) => (
                <button key={tab.key} onClick={() => setActiveTab(i)} style={{
                  padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  fontSize: '10px', fontWeight: 700, whiteSpace: 'nowrap',
                  background: activeTab === i ? 'rgba(0,209,255,0.15)' : 'rgba(255,255,255,0.04)',
                  color: activeTab === i ? '#00D1FF' : '#64748B',
                }}>
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ padding: '10px 12px' }}>
              {activeTab === 0 && (
                <div>
                  <p style={{ fontSize: '10px', color: '#94A3B8', marginBottom: '8px' }}>Factores que determinan la confianza IA:</p>
                  {(ia.factores || []).map((f, i) => <FactorBar key={i} factor={f} />)}
                  {(ia.alerts || []).length > 0 && (
                    <div style={{ marginTop: '8px', padding: '8px', borderRadius: '8px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                      {ia.alerts.map((alert, i) => (
                        <p key={i} style={{ fontSize: '10px', color: '#EF4444', marginBottom: i < ia.alerts.length - 1 ? '3px' : 0 }}>{sanitize(alert)}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {activeTab === 1 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '10px', background: ia.ev > 5 ? 'rgba(0,209,255,0.06)' : ia.ev > 0 ? 'rgba(245,158,11,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${ia.ev > 5 ? 'rgba(0,209,255,0.15)' : ia.ev > 0 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)'}`, marginBottom: '8px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '22px', fontWeight: 900, fontFamily: 'monospace', color: ia.ev > 5 ? '#00D1FF' : ia.ev > 0 ? '#F59E0B' : '#EF4444' }}>
                        {ia.ev > 0 ? '+' : ''}{ia.ev}%
                      </p>
                      <p style={{ fontSize: '8px', color: '#94A3B8', fontWeight: 600 }}>VALOR ESPERADO</p>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '11px', color: '#E2E8F0', lineHeight: 1.4 }}>
                        {ia.ev > 15 ? '🔥 EV excepcional. Genera valor a largo plazo.' :
                         ia.ev > 5 ? '✅ EV positivo. Matemáticamente justificada.' :
                         ia.ev > 0 ? '⚠️ EV marginal. Ventaja mínima.' : '❌ EV negativo. Probabilidades en contra.'}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
                      <p style={{ fontSize: '15px', fontWeight: 800, fontFamily: 'monospace', color: '#F59E0B' }}>@{(apuesta.cuota || 0).toFixed(2)}</p>
                      <p style={{ fontSize: '8px', color: '#64748B' }}>CUOTA</p>
                    </div>
                    <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
                      <p style={{ fontSize: '15px', fontWeight: 800, fontFamily: 'monospace', color: '#00D1FF' }}>x{(ia.stake_mult || 1).toFixed(2)}</p>
                      <p style={{ fontSize: '8px', color: '#64748B' }}>STAKE MULT</p>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 2 && (
                <div>
                  <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(0,209,255,0.04)', border: '1px solid rgba(0,209,255,0.1)', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '16px' }}>{sportIcon(apuesta.deporte)}</span>
                      <div>
                        <p style={{ fontSize: '12px', fontWeight: 800, color: '#FFF' }}>{sanitize(apuesta.tipster_alias)}</p>
                        <p style={{ fontSize: '10px', color: '#94A3B8' }}>{sanitize(ia.tipster_specialty || 'Sin perfil')} · {ia.total_bets_analyzed || 0} picks</p>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                      {[
                        { label: 'WIN RATE', value: `${(ia.tipster_wr || 0).toFixed(1)}%`, color: (ia.tipster_wr || 0) >= 65 ? '#00D1FF' : '#F59E0B' },
                        { label: 'ROI', value: `${(ia.tipster_roi || 0) > 0 ? '+' : ''}${(ia.tipster_roi || 0).toFixed(1)}%`, color: (ia.tipster_roi || 0) > 0 ? '#00D1FF' : '#EF4444' },
                        { label: 'BEST', value: `+${ia.tipster_best_streak || 0}`, color: '#FFDD57' },
                      ].map(m => (
                        <div key={m.label} style={{ textAlign: 'center', padding: '6px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)' }}>
                          <p style={{ fontSize: '13px', fontWeight: 900, fontFamily: 'monospace', color: m.color }}>{m.value}</p>
                          <p style={{ fontSize: '7px', color: '#64748B', fontWeight: 600 }}>{m.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {(ia.golden_rules || []).length > 0 && (
                    <div>
                      <p style={{ fontSize: '10px', fontWeight: 700, color: '#FFDD57', marginBottom: '4px' }}>📌 Reglas de oro:</p>
                      {ia.golden_rules.slice(0, 3).map((rule, i) => (
                        <p key={i} style={{ fontSize: '10px', color: '#94A3B8', marginBottom: '3px', paddingLeft: '8px', borderLeft: '2px solid rgba(255,221,87,0.3)' }}>{sanitize(rule)}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {activeTab === 3 && (
                <div>
                  <div style={{ padding: '14px', borderRadius: '10px', textAlign: 'center', background: `rgba(${ia.zona === 'ORO' ? '34,197,94' : ia.zona === 'RIESGO' ? '239,68,68' : '245,158,11'},0.06)`, border: `1px solid rgba(${ia.zona === 'ORO' ? '34,197,94' : ia.zona === 'RIESGO' ? '239,68,68' : '245,158,11'},0.15)`, marginBottom: '8px' }}>
                    <IAConfidenceRing score={ia.score} zona={ia.zona} size={60} />
                    <p style={{ fontSize: '13px', fontWeight: 800, color: '#FFF', marginTop: '8px' }}>{sanitize(ia.veredicto)}</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <div style={{ padding: '8px', borderRadius: '8px', textAlign: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p style={{ fontSize: '8px', color: '#64748B', fontWeight: 600, marginBottom: '2px' }}>STAKE</p>
                      <p style={{ fontSize: '14px', fontWeight: 900, fontFamily: 'monospace', color: ia.stake_mult > 1 ? '#00D1FF' : ia.stake_mult > 0 ? '#F59E0B' : '#EF4444' }}>
                        {ia.stake_mult === 0 ? 'NO APOSTAR' : `${(ia.stake_mult * 100).toFixed(0)}%`}
                      </p>
                    </div>
                    <div style={{ padding: '8px', borderRadius: '8px', textAlign: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p style={{ fontSize: '8px', color: '#64748B', fontWeight: 600, marginBottom: '2px' }}>CONFIANZA</p>
                      <p style={{ fontSize: '14px', fontWeight: 900, fontFamily: 'monospace', color: ia.score >= 75 ? '#22C55E' : ia.score >= 50 ? '#F59E0B' : '#EF4444' }}>{ia.score}/85</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Odds comparison (reuse existing) */}
        {apuesta.odds_comparacion && (() => {
          let parsed = apuesta.odds_comparacion;
          if (typeof parsed === 'string') { try { parsed = JSON.parse(parsed); } catch(_) { parsed = null; } }
          if (!parsed?.bookmakers?.length) return null;
          const casas = parsed.bookmakers.slice(0, 5);
          return (
            <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(15,23,42,0.5)', marginBottom: '12px' }}>
              <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '10px', fontWeight: 700, color: '#94A3B8' }}>
                📊 Cuotas comparativas ({casas.length} casas)
              </div>
              {casas.map((casa: any, i: number) => (
                <div key={i} style={{ padding: '5px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: i < casas.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none', background: i === 0 ? 'rgba(0,209,255,0.04)' : 'transparent' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {i === 0 && <span style={{ background: 'rgba(0,209,255,0.2)', color: '#00D1FF', fontSize: '8px', fontWeight: 800, padding: '1px 5px', borderRadius: '3px' }}>⭐</span>}
                    <span style={{ fontSize: '11px', color: i === 0 ? '#FFF' : '#94A3B8', fontWeight: i === 0 ? 600 : 400 }}>{sanitize(casa.nombre)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {Object.values(casa.cuotas || {}).map((v: any, j: number) => (
                      <span key={j} style={{ fontFamily: 'monospace', fontSize: '11px', padding: '1px 5px', borderRadius: '3px', background: i === 0 ? 'rgba(0,209,255,0.12)' : 'rgba(255,255,255,0.04)', color: i === 0 ? '#00D1FF' : '#CBD5E1', fontWeight: i === 0 ? 700 : 500 }}>
                        {Number(v).toFixed(2)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* ★ SHARE BUTTON */}
        {!showShare ? (
          <button onClick={() => setShowShare(true)} style={{
            width: '100%', padding: '10px', borderRadius: '10px', cursor: 'pointer',
            background: 'linear-gradient(135deg, rgba(0,209,255,0.12), rgba(34,197,94,0.08))',
            border: '1px solid rgba(0,209,255,0.2)', color: '#00D1FF', fontSize: '12px', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '8px',
          }}>
            <Share2 style={{ width: '14px', height: '14px' }} /> Compartir este pick
          </button>
        ) : (
          <SharePick apuesta={apuesta} onClose={() => setShowShare(false)} />
        )}

        {/* Close */}
        <button onClick={onClose} style={{
          width: '100%', marginTop: '4px', padding: '10px', borderRadius: '10px',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          color: '#94A3B8', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
        }}>
          Cerrar
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// HIGHLIGHTED PICK CARD — For carousel
// ============================================================================
const HighlightCard = ({ apuesta, label, icon, gradient, onClick }: {
  apuesta: Apuesta; label: string; icon: string; gradient: string; onClick: () => void;
}) => {
  const ia = apuesta.ia_analysis;
  const isCombinada = esCombinada({ tipo_mercado: apuesta.tipo_mercado, apuesta: apuesta.apuesta });
  // For combinadas: extract team names (first part before " - Combinada")
  const displayName = isCombinada
    ? (apuesta.apuesta.split(' - Combinada')[0] || apuesta.apuesta).substring(0, 40)
    : apuesta.apuesta;

  return (
    <div onClick={onClick} style={{
      minWidth: '240px', maxWidth: '280px', padding: '14px', borderRadius: '14px', cursor: 'pointer',
      background: gradient, border: '1px solid rgba(255,255,255,0.08)',
      transition: 'all 0.3s', position: 'relative', overflow: 'hidden', flexShrink: 0,
    }}>
      <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
        <span style={{ fontSize: '9px', fontWeight: 900, padding: '2px 8px', borderRadius: '5px', background: 'rgba(0,0,0,0.3)', color: '#FFF', letterSpacing: '0.8px' }}>
          {icon} {label}
        </span>
        {isCombinada && (
          <span style={{ fontSize: '8px', fontWeight: 800, padding: '1px 6px', borderRadius: '4px', background: 'rgba(168,85,247,0.2)', color: '#A855F7', border: '1px solid rgba(168,85,247,0.3)' }}>
            COMBINADA
          </span>
        )}
        {ia && <ZonaBadge zona={ia.zona} small />}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', marginBottom: '2px' }}>
            {sanitize(apuesta.tipster_alias)} · {apuesta.hora_partido || ''} CL
          </p>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#FFF', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px' }}>
            {sanitize(displayName)}
          </p>
          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px' }}>
            {sanitize(apuesta.tipo_mercado || '')}
          </p>
        </div>
        <div style={{ textAlign: 'center', marginLeft: '8px' }}>
          {ia && <IAConfidenceRing score={ia.score} zona={ia.zona} size={40} />}
          <p style={{ fontSize: '14px', fontWeight: 900, fontFamily: 'monospace', color: '#FFF', marginTop: '2px' }}>@{(apuesta.cuota || 0).toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN DASHBOARD V15
// ============================================================================
export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [data, setData] = useState<DashboardData>({
    totalTipsters: 0, apuestasHoy: 0, topTipster: null, alertas: [],
    apuestasRecientes: [], iaVersion: '2.0', profilesAvailable: [], allTipsters: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [liveData, setLiveData] = useState<{ live: any[]; urgentes: any[]; total_live: number; total_urgentes: number }>({ live: [], urgentes: [], total_live: 0, total_urgentes: 0 });
  const [rachasData, setRachasData] = useState<{ alertas: any[]; total: number }>({ alertas: [], total: 0 });
  const prevApuestasRef = useRef<string>('');
  const { soundEnabled, setSoundEnabled, playNewPick, playWin, playLoss } = useSoundNotifications();

  // ★ V15: Filters
  const [sportFilter, setSportFilter] = useState<string>('Todos');
  const [showFavorites, setShowFavorites] = useState(false);
  const sportScrollRef = useRef<HTMLDivElement>(null);
  const [showScrollFade, setShowScrollFade] = useState(true);
  const [favoriteTipsters, setFavoriteTipsters] = useState<number[]>([]);
  const [showFavModal, setShowFavModal] = useState(false);
  const [selectedPick, setSelectedPick] = useState<Apuesta | null>(null);

  // Load favorites from API user prefs (fallback localStorage)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('neurotips_fav_tipsters');
        if (saved) setFavoriteTipsters(JSON.parse(saved));
      } catch (_e) { /* Security: ignore corrupted data */ }
    }
  }, []);

  const saveFavorites = (ids: number[]) => {
    setFavoriteTipsters(ids);
    try { localStorage.setItem('neurotips_fav_tipsters', JSON.stringify(ids)); } catch (_e) { /* quota exceeded */ }
  };

  // ★ Data fetching — Same endpoints as V14
  useEffect(() => {
    const fetchData = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
        let dashboardData: any;

        try {
          const resp = await fetch(`${API_URL}/api/public/dashboard-ia`);
          if (resp.ok) {
            dashboardData = await resp.json();
          } else {
            dashboardData = await dashboardAPI.getData();
          }
        } catch (_e) {
          dashboardData = await dashboardAPI.getData();
        }

        const todasApuestas = dashboardData.apuestas?.apuestas || [];
        const nuevasApuestas = todasApuestas.slice(0, 25);

        // Sound detection (reused from V14)
        const newSignature = JSON.stringify(nuevasApuestas.map((a: any) => ({ id: a.id, resultado: a.resultado })));
        if (prevApuestasRef.current && prevApuestasRef.current !== newSignature) {
          const prevApuestas = JSON.parse(prevApuestasRef.current);
          const prevIds = prevApuestas.map((a: any) => a.id);
          const newPicks = nuevasApuestas.filter((a: any) => !prevIds.includes(a.id));
          if (newPicks.length > 0) playNewPick();
          for (const apuesta of nuevasApuestas) {
            const prev = prevApuestas.find((p: any) => p.id === apuesta.id);
            if (prev && prev.resultado === 'PENDIENTE' && apuesta.resultado !== 'PENDIENTE') {
              if (apuesta.resultado === 'GANADA') playWin();
              else if (apuesta.resultado === 'PERDIDA') playLoss();
            }
          }
        }
        prevApuestasRef.current = newSignature;

        setData({
          totalTipsters: dashboardData.tipsters?.total || 0,
          apuestasHoy: dashboardData.apuestas?.total || nuevasApuestas.length || 0,
          topTipster: dashboardData.topTipster || null,
          alertas: dashboardData.alertas || [],
          apuestasRecientes: nuevasApuestas,
          iaVersion: dashboardData.ia_version || '2.0',
          profilesAvailable: dashboardData.profiles_available || [],
          allTipsters: [], // Will be populated below
        });

        // Non-blocking: Live + Rachas + ALL Tipsters
        try {
          const [liveRes, rachasRes, tipstersRes] = await Promise.all([
            picksAPI.getLive().catch(() => ({ live: [], urgentes: [], total_live: 0, total_urgentes: 0 })),
            alertasAPI.getRachas().catch(() => ({ alertas: [], total: 0 })),
            tipstersAPI.getAll().catch(() => ({ tipsters: [] })),
          ]);
          setLiveData(liveRes);
          setRachasData(rachasRes);
          // Update allTipsters from /api/tipsters (ALL active tipsters, not just today's)
          const tipstersList = (tipstersRes.tipsters || []).map((t: any) => ({
            id: t.id, alias: t.alias, deporte: t.deporte || ''
          }));
          if (tipstersList.length > 0) {
            setData(prev => ({ ...prev, allTipsters: tipstersList }));
          }
        } catch (_) {}

      } catch (error) {
        console.error('[DASHBOARD] Error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 60000); // Auto-refresh 60s
    return () => clearInterval(interval);
  }, [playNewPick, playWin, playLoss]);

  // ★ LOADING STATE
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div style={{ textAlign: 'center' }}>
          <div className="w-12 h-12 border-3 border-[#00D1FF]/30 border-t-[#00D1FF] rounded-full animate-spin mx-auto mb-3"></div>
          <p style={{ fontSize: '13px', color: '#00D1FF', fontWeight: 600 }}>🧠 Cargando análisis IA...</p>
        </div>
      </div>
    );
  }

  // ★ COMPUTED DATA
  const apuestas = data.apuestasRecientes.map(a => ({
    ...a,
    resultado: (a.resultado && a.resultado !== '' && a.resultado !== 'NULA') ? a.resultado : 'PENDIENTE'
  }));

  // Filters — SOLO deportes reales. Picks sin deporte real (Mixto/Multideporte) solo aparecen en "Todos"
  const uniqueSports = Array.from(new Set(
    apuestas.map(a => normalizeSport(a.deporte)).filter((s): s is string => s !== null)
  ));
  const sportOrder = ['Fútbol', 'Básquetbol', 'Tenis', 'Voleibol', 'Handball', 'Hockey', 'Béisbol', 'MMA', 'Esports'];
  uniqueSports.sort((a, b) => {
    const ia = sportOrder.indexOf(a); const ib = sportOrder.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });


  let filtered = apuestas;
  if (sportFilter !== 'Todos') filtered = filtered.filter(a => normalizeSport(a.deporte) === sportFilter);
  if (showFavorites && favoriteTipsters.length > 0) filtered = filtered.filter(a => favoriteTipsters.includes(a.tipster_id));

  // Group by status
  const livePicks = filtered.filter(a => {
    if (a.resultado !== 'PENDIENTE') return false;
    const ts = getTimeStatus(a.hora_partido, a.resultado);
    return ts.isLive;
  });
  const pendingPicks = filtered.filter(a => {
    if (a.resultado !== 'PENDIENTE') return false;
    const ts = getTimeStatus(a.hora_partido, a.resultado);
    return !ts.isLive;
  });
  const resolvedPicks = filtered.filter(a => a.resultado === 'GANADA' || a.resultado === 'PERDIDA');

  // IA stats
  const iaScores = apuestas.filter(a => a.ia_analysis).map(a => a.ia_analysis!.score);
  const avgIAScore = iaScores.length > 0 ? Math.round(iaScores.reduce((a, b) => a + b, 0) / iaScores.length) : 0;
  const zonaOroCount = apuestas.filter(a => a.ia_analysis?.zona === 'ORO').length;

  // Best picks for carousel
  const pendientesConIA = apuestas.filter(a => a.resultado === 'PENDIENTE' && a.ia_analysis);
  const bestPick = pendientesConIA.length > 0 ? pendientesConIA.reduce((a, b) => (a.ia_analysis!.score > b.ia_analysis!.score ? a : b)) : null;
  const bestEV = pendientesConIA.filter(a => a.ia_analysis!.ev > 5).sort((a, b) => (b.ia_analysis!.ev) - (a.ia_analysis!.ev))[0] || null;
  const hotStreak = apuestas.filter(a => a.resultado === 'PENDIENTE' && (a.racha_actual || 0) >= 4).sort((a, b) => (b.racha_actual || 0) - (a.racha_actual || 0))[0] || null;

  // Insights
  const insights: { emoji: string; text: string; type: 'pos' | 'warn' | 'neutral' }[] = [];
  if (zonaOroCount > 0) insights.push({ emoji: '🟢', text: `${zonaOroCount} pick${zonaOroCount > 1 ? 's' : ''} en ZONA ORO hoy. Alta confianza IA.`, type: 'pos' });
  if (data.alertas.length > 0) {
    const nombres = data.alertas.slice(0, 2).map(a => sanitize(a.alias)).join(', ');
    insights.push({ emoji: '⚠️', text: `${nombres} en racha negativa. IA reduce stakes.`, type: 'warn' });
  }
  if (avgIAScore > 0) insights.push({ emoji: '🧠', text: `Score IA promedio: ${avgIAScore}/85. ${avgIAScore >= 65 ? 'Buen día.' : 'Día mixto, sé selectivo.'}`, type: 'neutral' });
  if (bestEV?.ia_analysis) insights.push({ emoji: '💰', text: `Mejor EV: ${sanitize(bestEV.tipster_alias)} con +${bestEV.ia_analysis.ev}% en ${sanitize(bestEV.tipo_mercado || '')}.`, type: 'pos' });

  const diasRestantes = (() => {
    if (!user?.suscripcion_hasta) return 5;
    const hasta = new Date(user.suscripcion_hasta);
    return Math.max(0, Math.ceil((hasta.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
  })();

  // ========================================================================
  // RENDER
  // ========================================================================
  return (
    <div className="space-y-0 animate-fadeIn pb-20 lg:pb-6">

      {/* ================================================================ */}
      {/* HEADER — Sticky with sport tabs                                   */}
      {/* ================================================================ */}
      <div className="sticky top-0 z-30 -mx-4 px-4 pb-2 pt-1" style={{ background: 'linear-gradient(180deg, var(--bg-main, #0F172A) 85%, transparent)' }}>
        {/* Top row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h1 style={{ fontSize: '18px', fontWeight: 900, margin: 0 }}>
              <span style={{ color: '#00D1FF' }}>Neuro</span><span style={{ fontSize: '20px' }}>🧠</span><span style={{ color: '#F1F5F9' }}>Tips</span>
            </h1>
            <span style={{ fontSize: '10px', color: '#94A3B8' }}>
              ¡Hola, <span style={{ color: '#00D1FF' }}>{sanitize(user?.nombre || 'Apostador')}</span>!
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '9px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', background: 'rgba(0,209,255,0.08)', border: '1px solid rgba(0,209,255,0.2)', color: '#00D1FF', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Brain style={{ width: '11px', height: '11px' }} /> IA v{data.iaVersion}
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00D1FF', animation: 'livePulse 1.5s infinite' }} />
            </span>
            <button onClick={() => setSoundEnabled(!soundEnabled)} style={{
              display: 'flex', alignItems: 'center', gap: '3px', padding: '3px 8px', borderRadius: '6px',
              fontSize: '9px', fontWeight: 700, cursor: 'pointer',
              background: soundEnabled ? 'rgba(0,209,255,0.1)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${soundEnabled ? 'rgba(0,209,255,0.25)' : 'rgba(255,255,255,0.08)'}`,
              color: soundEnabled ? '#00D1FF' : '#64748B',
            }}>
              {soundEnabled ? <Volume2 style={{ width: '11px', height: '11px' }} /> : <VolumeX style={{ width: '11px', height: '11px' }} />}
              {soundEnabled ? 'ON' : 'OFF'}
            </button>
            {user?.plan === 'PREMIUM' && (
              <span style={{ fontSize: '9px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', background: 'linear-gradient(135deg, rgba(255,221,87,0.15), rgba(245,158,11,0.1))', border: '1px solid rgba(255,221,87,0.3)', color: '#FFDD57' }}>
                👑 Premium
              </span>
            )}
          </div>
        </div>

        {/* Rotating phrase */}
        <div style={{ marginBottom: '8px' }}>
          <FrasesDinamicas data={data} rachas={rachasData} />
        </div>

        {/* Sport tabs (scrollable) + Fixed ⭐ button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
          {/* ── Scrollable sports area with fade hint ── */}
          <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
            <div
              ref={sportScrollRef}
              onScroll={() => {
                const el = sportScrollRef.current;
                if (el) setShowScrollFade(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px',
                scrollbarWidth: 'none', msOverflowStyle: 'none',
              }}
            >
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
            {/* Fade gradient → indica que hay más contenido */}
            {showScrollFade && (
              <div style={{
                position: 'absolute', right: 0, top: 0, bottom: 0, width: '40px',
                background: 'linear-gradient(to right, transparent, #0F172A)',
                pointerEvents: 'none',
              }} />
            )}
          </div>

          {/* ── Divider ── */}
          <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.08)', flexShrink: 0, margin: '0 6px' }} />

          {/* ── ⭐ Fixed button — siempre visible ── */}
          <button onClick={() => {
            if (favoriteTipsters.length === 0) { setShowFavModal(true); return; }
            if (showFavorites) { setShowFavModal(true); } else { setShowFavorites(true); }
          }} style={{
            padding: '5px 12px', borderRadius: '7px', cursor: 'pointer', flexShrink: 0,
            fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap',
            background: showFavorites ? 'rgba(255,221,87,0.15)' : favoriteTipsters.length > 0 ? 'rgba(255,221,87,0.06)' : 'rgba(255,255,255,0.04)',
            color: showFavorites ? '#FFDD57' : favoriteTipsters.length > 0 ? '#FFDD57' : '#64748B',
            border: showFavorites ? '1px solid rgba(255,221,87,0.3)' : '1px solid transparent',
          }}>
            ⭐ {showFavorites ? `Filtrado (${favoriteTipsters.length})` : favoriteTipsters.length > 0 ? `Mis ${favoriteTipsters.length}` : 'Filtrar'}
          </button>
        </div>
      </div>

      {/* ================================================================ */}
      {/* FAVORITES MODAL — Simple multi-select                            */}
      {/* ================================================================ */}
      {showFavModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowFavModal(false)}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
          <div onClick={(e) => e.stopPropagation()} style={{
            position: 'relative', width: '90%', maxWidth: '360px', padding: '20px', borderRadius: '16px',
            background: '#1A2332', border: '1px solid rgba(255,221,87,0.2)',
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#FFDD57', marginBottom: '4px' }}>⭐ Elige tus tipsters favoritos</h3>
            <p style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '14px' }}>{data.allTipsters.length} tipsters activos · Solo verás sus picks</p>
            <div style={{ display: 'grid', gap: '6px', maxHeight: '350px', overflowY: 'auto' }}>
              {data.allTipsters.slice().sort((a, b) => a.alias.localeCompare(b.alias)).map(t => (
                <button key={t.id} onClick={() => {
                  const newFavs = favoriteTipsters.includes(t.id) ? favoriteTipsters.filter(id => id !== t.id) : [...favoriteTipsters, t.id];
                  saveFavorites(newFavs);
                }} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px',
                  borderRadius: '8px', cursor: 'pointer', width: '100%',
                  background: favoriteTipsters.includes(t.id) ? 'rgba(255,221,87,0.1)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${favoriteTipsters.includes(t.id) ? 'rgba(255,221,87,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  color: favoriteTipsters.includes(t.id) ? '#FFDD57' : '#CBD5E1', fontSize: '12px', fontWeight: 600,
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px' }}>{sportIcon(t.deporte)}</span>
                    {sanitize(t.alias)}
                  </span>
                  {favoriteTipsters.includes(t.id) && <Check style={{ width: '14px', height: '14px', color: '#FFDD57' }} />}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={() => { saveFavorites([]); setShowFavorites(false); setShowFavModal(false); }} style={{
                flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#94A3B8', fontSize: '12px', fontWeight: 700,
              }}>
                Mostrar todos
              </button>
              <button onClick={() => { setShowFavModal(false); if (favoriteTipsters.length > 0) setShowFavorites(true); }} style={{
                flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #00D1FF, #00A86B)', color: '#000', fontSize: '12px', fontWeight: 800,
              }}>
                Aplicar ({favoriteTipsters.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TRIAL BANNER (reused from V14)                                    */}
      {/* ================================================================ */}
      {user?.plan === 'FREE_TRIAL' && (
        <div className="mx-0 mt-2" style={{ padding: '12px 14px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(255,221,87,0.05))', border: '1px solid rgba(255,221,87,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock style={{ width: '18px', height: '18px', color: '#FFDD57' }} />
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#FFDD57', margin: 0 }}>🔥 Prueba activa · {diasRestantes} días</p>
                <p style={{ fontSize: '10px', color: '#94A3B8', margin: 0 }}>Suscríbete y desbloquea IA completo</p>
              </div>
            </div>
            <Link href="/dashboard/suscripcion" style={{ padding: '6px 14px', borderRadius: '8px', background: 'linear-gradient(135deg, #F59E0B, #FFDD57)', color: '#000', fontSize: '11px', fontWeight: 800, textDecoration: 'none' }}>
              Suscribirse
            </Link>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* QUICK STATS BAR                                                  */}
      {/* ================================================================ */}
      <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(255,255,255,0.04)', marginTop: '8px', display: 'flex', justifyContent: 'space-around' }}>
        {[
          { label: 'Picks hoy', value: String(data.apuestasHoy || apuestas.length), color: '#F59E0B' },
          { label: 'En vivo', value: String(liveData.total_live || livePicks.length), color: '#EF4444', dot: true },
          { label: 'Zona ORO', value: String(zonaOroCount), color: '#22C55E' },
          { label: 'Score IA', value: String(avgIAScore), color: '#00D1FF' },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
              {s.dot && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: s.color, animation: 'livePulse 1.5s infinite' }} />}
              <span style={{ fontSize: '18px', fontWeight: 900, fontFamily: 'monospace', color: s.color }}>{s.value}</span>
            </div>
            <span style={{ fontSize: '8px', color: '#64748B', fontWeight: 600 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ================================================================ */}
      {/* HIGHLIGHTED PICKS CAROUSEL                                       */}
      {/* ================================================================ */}
      {(bestPick || hotStreak || bestEV) && (
        <div style={{ marginTop: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#F1F5F9' }}>🎯 Destacados IA</span>
            <span style={{ fontSize: '9px', color: '#64748B' }}>Desliza →</span>
          </div>
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
            {bestPick && bestPick.ia_analysis && bestPick.ia_analysis.score >= 65 && (
              <HighlightCard apuesta={bestPick} label="PICK DEL DÍA" icon="⭐" onClick={() => setSelectedPick(bestPick)}
                gradient="linear-gradient(135deg, rgba(0,209,255,0.12) 0%, rgba(34,197,94,0.08) 50%, rgba(15,23,42,0.9) 100%)" />
            )}
            {hotStreak && hotStreak !== bestPick && (
              <HighlightCard apuesta={hotStreak} label={`RACHA W${hotStreak.racha_actual}`} icon="🔥" onClick={() => setSelectedPick(hotStreak)}
                gradient="linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(239,68,68,0.06) 50%, rgba(15,23,42,0.9) 100%)" />
            )}
            {bestEV && bestEV !== bestPick && bestEV !== hotStreak && bestEV.ia_analysis && (
              <HighlightCard apuesta={bestEV} label={`EV +${bestEV.ia_analysis.ev}%`} icon="💰" onClick={() => setSelectedPick(bestEV)}
                gradient="linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(0,209,255,0.06) 50%, rgba(15,23,42,0.9) 100%)" />
            )}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* COMBINADA CERTIFICADA (reused V14 component)                     */}
      {/* ================================================================ */}
      <CombinadaCertificada variant="dashboard" />

      {/* ================================================================ */}
      {/* PICKS LIST — Betano style grouped                                */}
      {/* ================================================================ */}

      {/* 🔴 LIVE */}
      {livePicks.length > 0 && (
        <div style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.03)', marginTop: '12px' }}>
          <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(90deg, rgba(239,68,68,0.1), transparent)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 800, color: '#EF4444' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#EF4444', animation: 'livePulse 1.5s infinite' }} />
                EN VIVO
              </span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#F1F5F9' }}>{livePicks.length} picks en juego</span>
            </div>
          </div>
          {livePicks.map(p => <PickRow key={p.id} apuesta={p} onClick={() => setSelectedPick(p)} />)}
        </div>
      )}

      {/* ⏰ PENDING */}
      {pendingPicks.length > 0 && (
        <div style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.04)', background: 'rgba(30,41,59,0.3)', marginTop: '12px' }}>
          <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#F59E0B' }}>⏰ Próximos · {pendingPicks.length} picks</span>
            <Link href="/dashboard/apuestas" style={{ fontSize: '10px', color: '#00D1FF', textDecoration: 'none' }}>
              Ver todas →
            </Link>
          </div>
          {pendingPicks.map(p => <PickRow key={p.id} apuesta={p} onClick={() => setSelectedPick(p)} />)}
        </div>
      )}

      {/* ✅ RESOLVED */}
      {resolvedPicks.length > 0 && (
        <div style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.04)', background: 'rgba(30,41,59,0.2)', marginTop: '12px' }}>
          <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8' }}>✅ Resueltos</span>
            <span style={{ fontSize: '10px', color: '#22C55E', fontWeight: 700 }}>
              {resolvedPicks.filter(p => p.resultado === 'GANADA').length}/{resolvedPicks.length} ganadas
            </span>
          </div>
          {resolvedPicks.map(p => <PickRow key={p.id} apuesta={p} onClick={() => setSelectedPick(p)} />)}
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Calendar style={{ width: '36px', height: '36px', color: '#334155', margin: '0 auto 10px' }} />
          <p style={{ color: '#94A3B8', fontSize: '13px' }}>
            {showFavorites ? 'No hay picks de tus tipsters favoritos hoy' : 'No hay picks hoy'}
          </p>
          <p style={{ color: '#64748B', fontSize: '11px', marginTop: '4px' }}>Las apuestas se registran desde el bot de Telegram</p>
        </div>
      )}

      {/* ================================================================ */}
      {/* IA INSIGHTS PANEL                                                */}
      {/* ================================================================ */}
      {insights.length > 0 && (
        <div style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(0,209,255,0.1)', background: 'linear-gradient(135deg, rgba(0,209,255,0.04), rgba(30,41,59,0.5))', marginTop: '12px' }}>
          <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(0,209,255,0.08)' }}>
            <Brain style={{ width: '14px', height: '14px', color: '#FF6B9D' }} />
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#00D1FF' }}>NeuroTips IA</span>
            <span style={{ fontSize: '8px', fontWeight: 700, padding: '2px 5px', borderRadius: '4px', background: 'rgba(34,197,94,0.15)', color: '#22C55E' }}>LIVE</span>
            <Link href="/dashboard/recomendaciones" style={{ marginLeft: 'auto', fontSize: '10px', color: '#64748B', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '2px' }}>
              Recomendaciones <ChevronRight style={{ width: '12px', height: '12px' }} />
            </Link>
          </div>
          <div style={{ padding: '8px 12px', display: 'grid', gap: '4px' }}>
            {insights.map((ins, i) => (
              <div key={i} style={{
                padding: '7px 10px', borderRadius: '8px',
                background: ins.type === 'pos' ? 'rgba(34,197,94,0.04)' : ins.type === 'warn' ? 'rgba(239,68,68,0.04)' : 'rgba(245,158,11,0.04)',
                borderLeft: `3px solid ${ins.type === 'pos' ? '#22C55E' : ins.type === 'warn' ? '#EF4444' : '#F59E0B'}`,
              }}>
                <span style={{ fontSize: '11px', color: '#CBD5E1' }}>{ins.emoji} {ins.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* RACHAS — Horizontal pills                                        */}
      {/* ================================================================ */}
      {rachasData.total > 0 && (
        <div style={{ borderRadius: '14px', padding: '12px 14px', background: 'rgba(30,41,59,0.4)', border: '1px solid rgba(255,187,0,0.1)', marginTop: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#F1F5F9' }}>🔥 Rachas Activas</span>
            <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '5px', background: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>{rachasData.total} alertas</span>
          </div>
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px', scrollbarWidth: 'none' }}>
            {rachasData.alertas.slice(0, 8).map((r: any, i: number) => (
              <div key={i} style={{
                flexShrink: 0, padding: '7px 10px', borderRadius: '8px', textAlign: 'center',
                background: r.tipo === 'positiva' ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
                border: `1px solid ${r.tipo === 'positiva' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}`,
                minWidth: '75px',
              }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: r.tipo === 'positiva' ? '#22C55E' : '#EF4444', marginBottom: '1px' }}>
                  {r.tipo === 'positiva' ? `🔥 W${r.racha}` : `⚠️ L${Math.abs(r.racha)}`}
                </p>
                <p style={{ fontSize: '9px', color: '#94A3B8' }}>{sanitize(r.tipster || r.alias)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* RENDIMIENTO — Compact bar (StatsReales component)                */}
      {/* ================================================================ */}
      <StatsReales variant="full" />

      {/* ================================================================ */}
      {/* FOOTER                                                           */}
      {/* ================================================================ */}
      <div className="flex items-center justify-between text-xs text-[#64748B] pt-3 border-t border-slate-800/50" style={{ marginTop: '12px' }}>
        <span className="font-mono" style={{ fontSize: '10px' }}>
          🧠 Neuro🧠Tips IA v{data.iaVersion} · {data.profilesAvailable?.length || 0} tipsters perfilados · {iaScores.length} picks analizados hoy
        </span>
        <span className="flex items-center gap-1.5">
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00D1FF', animation: 'livePulse 1.5s infinite' }} />
          <span style={{ fontSize: '10px' }}>IA Activa</span>
        </span>
      </div>

      {/* TELEGRAM + WHATSAPP */}
      <div className="grid sm:grid-cols-2 gap-3 mt-3">
        <a href="https://t.me/IaNeuroTips" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:scale-[1.01]"
          style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(14,165,233,0.15)' }}>
            <MessageCircle className="h-4 w-4 text-[#0EA5E9]" />
          </div>
          <div>
            <p style={{ color: '#FFF', fontSize: '12px', fontWeight: 700 }}>Canal Telegram</p>
            <p style={{ color: '#0EA5E9', fontSize: '10px' }}>1 pick gratis diario · @IaNeuroTips</p>
          </div>
        </a>
        <a href="https://wa.me/56978516119?text=Hola%20NeuroTips" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:scale-[1.01]"
          style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(34,197,94,0.15)' }}>
            <Phone className="h-4 w-4 text-[#22C55E]" />
          </div>
          <div>
            <p style={{ color: '#FFF', fontSize: '12px', fontWeight: 700 }}>WhatsApp Soporte</p>
            <p style={{ color: '#22C55E', fontSize: '10px' }}>Respuesta en menos de 5 min</p>
          </div>
        </a>
      </div>

      {/* Floating WhatsApp */}
      <a href="https://wa.me/56978516119?text=Hola%20NeuroTips" target="_blank" rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
        style={{ background: '#22C55E', boxShadow: '0 4px 20px rgba(34,197,94,0.4)' }}>
        <Phone className="h-6 w-6 text-white" />
      </a>

      {/* ================================================================ */}
      {/* PICK DETAIL MODAL                                                */}
      {/* ================================================================ */}
      {selectedPick && <PickModal apuesta={selectedPick} onClose={() => setSelectedPick(null)} />}

      {/* ================================================================ */}
      {/* CSS ANIMATIONS                                                   */}
      {/* ================================================================ */}
      <style jsx>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes liveGlow {
          0%, 100% { box-shadow: 0 0 8px rgba(239,68,68,0.4); }
          50% { box-shadow: 0 0 16px rgba(239,68,68,0.6); }
        }
      `}</style>
    </div>
  );
}
