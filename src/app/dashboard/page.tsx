'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, TrendingDown, Users, Calendar, Target, AlertTriangle, 
  ChevronRight, Zap, Trophy, Clock, Star, ArrowUpRight, Brain,
  Flame, Shield, Eye, Activity, BarChart3, MessageCircle, Phone,
  Volume2, VolumeX, ChevronDown, ChevronUp, Award, Percent, Info
} from 'lucide-react';
import { dashboardAPI, picksAPI, alertasAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import CombinadaCertificada from '@/components/CombinadaCertificada';
import CombinadaLegs, { esCombinada } from '@/components/CombinadaLegs';
import StatsReales from '@/components/StatsReales';

// ============================================================================
// TYPES
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
}

// ============================================================================
// SOUND SYSTEM
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
    } catch(_e) {}
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
// IA CONFIDENCE RING — Animated circular score indicator
// ============================================================================
const IAConfidenceRing = ({ score, zona, size = 52 }: { score: number; zona: string; size?: number }) => {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 85) * circumference;
  
  const colors: Record<string, { stroke: string; glow: string; bg: string }> = {
    ORO: { stroke: '#22C55E', glow: 'rgba(0,209,255,0.4)', bg: 'rgba(0,209,255,0.1)' },
    NEUTRA: { stroke: '#F59E0B', glow: 'rgba(245,158,11,0.4)', bg: 'rgba(245,158,11,0.1)' },
    RIESGO: { stroke: '#EF4444', glow: 'rgba(239,68,68,0.4)', bg: 'rgba(239,68,68,0.1)' },
    BLOQUEADO: { stroke: '#6B7280', glow: 'rgba(107,114,128,0.3)', bg: 'rgba(107,114,128,0.1)' },
  };
  const c = colors[zona] || colors.NEUTRA;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
        <circle
          cx={size/2} cy={size/2} r={radius} fill="none"
          stroke={c.stroke} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s ease-out', filter: `drop-shadow(0 0 4px ${c.glow})` }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: size > 44 ? '14px' : '11px', fontWeight: 900, color: c.stroke, fontFamily: 'monospace', lineHeight: 1 }}>
          {score}
        </span>
        {size > 44 && <span style={{ fontSize: '7px', color: '#FF6B9D', fontWeight: 600, letterSpacing: '0.5px' }}>IA</span>}
      </div>
    </div>
  );
};

// ============================================================================
// IA ZONA BADGE — Colored pill badge
// ============================================================================
const ZonaBadge = ({ zona, small = false }: { zona: string; small?: boolean }) => {
  const config: Record<string, { bg: string; border: string; color: string; emoji: string; label: string }> = {
    ORO:       { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.35)', color: '#22C55E', emoji: '🟢', label: 'ZONA ORO' },
    NEUTRA:    { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.35)',  color: '#F59E0B', emoji: '🟡', label: 'ZONA NEUTRA' },
    RIESGO:    { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.35)',  color: '#EF4444', emoji: '🔴', label: 'ZONA RIESGO' },
    BLOQUEADO: { bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.35)', color: '#6B7280', emoji: '🚫', label: 'BLOQUEADO' },
  };
  const c = config[zona] || config.NEUTRA;

  return (
    <span style={{
      background: c.bg, border: `1px solid ${c.border}`, color: c.color,
      fontSize: small ? '9px' : '10px', fontWeight: 800, padding: small ? '1px 6px' : '2px 8px',
      borderRadius: '6px', letterSpacing: '0.5px', display: 'inline-flex', alignItems: 'center', gap: '3px',
      whiteSpace: 'nowrap',
    }}>
      {c.emoji} {c.label}
    </span>
  );
};

// ============================================================================
// FACTOR BAR — Visual factor impact
// ============================================================================
const FactorBar = ({ factor }: { factor: { nombre: string; valor: number; impacto: string } }) => {
  const colorMap: Record<string, string> = {
    positivo: '#00D1FF', elite: '#00D1FF', neutral: '#F59E0B', negativo: '#EF4444', bloqueado: '#6B7280'
  };
  const color = colorMap[factor.impacto] || '#F59E0B';
  
  return (
    <div style={{ marginBottom: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
        <span style={{ fontSize: '11px', color: '#CBD5E1' }}>{factor.nombre}</span>
        <span style={{ fontSize: '10px', fontWeight: 700, color, fontFamily: 'monospace' }}>{factor.valor}%</span>
      </div>
      <div style={{ width: '100%', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)' }}>
        <div style={{
          width: `${factor.valor}%`, height: '100%', borderRadius: '2px',
          background: `linear-gradient(90deg, ${color}, ${color}CC)`,
          transition: 'width 0.8s ease-out',
          boxShadow: `0 0 6px ${color}40`,
        }} />
      </div>
    </div>
  );
};

// ============================================================================
// IA DEEP ANALYSIS PANEL — Expandable 4-section analysis for each bet
// ============================================================================
const IADeepAnalysis = ({ ia, apuesta }: { ia: IAAnalysis; apuesta: Apuesta }) => {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { icon: '🔬', label: 'Diagnóstico', key: 'diagnostico' },
    { icon: '📊', label: 'Valor Esperado', key: 'ev' },
    { icon: '📈', label: 'Histórico', key: 'historico' },
    { icon: '⚖️', label: 'Veredicto', key: 'veredicto' },
  ];

  return (
    <div style={{
      marginTop: '8px', borderRadius: '10px', overflow: 'hidden',
      border: `1px solid ${ia.zona === 'ORO' ? 'rgba(0,209,255,0.2)' : ia.zona === 'RIESGO' || ia.zona === 'BLOQUEADO' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
      background: 'rgba(15,23,42,0.6)',
    }}>
      {/* Toggle header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 12px', background: 'rgba(255,255,255,0.02)', cursor: 'pointer',
          border: 'none', color: '#CBD5E1',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Brain style={{ width: '14px', height: '14px', color: '#FF6B9D' }} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#00D1FF' }}>Análisis IA Profundo</span>
          <span style={{
            fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px',
            background: 'rgba(0,209,255,0.1)', color: '#00D1FF', fontFamily: 'monospace',
          }}>v2.0</span>
        </div>
        {expanded ? <ChevronUp style={{ width: '14px', height: '14px' }} /> : <ChevronDown style={{ width: '14px', height: '14px' }} />}
      </button>

      {expanded && (
        <div style={{ padding: '0 12px 12px' }}>
          {/* Tab navigation */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', marginTop: '4px', overflowX: 'auto' }}>
            {tabs.map((tab, i) => (
              <button key={tab.key} onClick={() => setActiveTab(i)}
                style={{
                  padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  fontSize: '10px', fontWeight: 700, whiteSpace: 'nowrap',
                  background: activeTab === i ? 'rgba(0,209,255,0.15)' : 'rgba(255,255,255,0.04)',
                  color: activeTab === i ? '#00D1FF' : '#64748B',
                  transition: 'all 0.2s',
                }}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 0 && (
            <div>
              <p style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '8px' }}>
                Factores que determinan la confianza IA:
              </p>
              {(ia.factores || []).map((f, i) => <FactorBar key={i} factor={f} />)}
              {(ia.alerts || []).length > 0 && (
                <div style={{ marginTop: '8px', padding: '8px', borderRadius: '8px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  {(ia.alerts || []).map((alert, i) => (
                    <p key={i} style={{ fontSize: '11px', color: '#EF4444', marginBottom: i < (ia.alerts || []).length - 1 ? '4px' : 0 }}>{alert}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 1 && (
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                borderRadius: '10px', background: ia.ev > 5 ? 'rgba(0,209,255,0.06)' : ia.ev > 0 ? 'rgba(245,158,11,0.06)' : 'rgba(239,68,68,0.06)',
                border: `1px solid ${ia.ev > 5 ? 'rgba(0,209,255,0.15)' : ia.ev > 0 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)'}`,
                marginBottom: '8px',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '24px', fontWeight: 900, fontFamily: 'monospace', color: ia.ev > 5 ? '#00D1FF' : ia.ev > 0 ? '#F59E0B' : '#EF4444' }}>
                    {ia.ev > 0 ? '+' : ''}{ia.ev}%
                  </p>
                  <p style={{ fontSize: '9px', color: '#94A3B8', fontWeight: 600 }}>VALOR ESPERADO</p>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '11px', color: '#E2E8F0', lineHeight: 1.5 }}>
                    {ia.ev > 15 ? '🔥 EV excepcional. Este tipo de apuesta genera valor a largo plazo.' :
                     ia.ev > 5 ? '✅ EV positivo. Apuesta matemáticamente justificada.' :
                     ia.ev > 0 ? '⚠️ EV marginal. La ventaja es mínima.' :
                     '❌ EV negativo. Las probabilidades no están a tu favor.'}
                  </p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
                  <p style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'monospace', color: '#F59E0B' }}>
                    @{(apuesta.cuota || 0).toFixed(2)}
                  </p>
                  <p style={{ fontSize: '9px', color: '#64748B' }}>CUOTA</p>
                </div>
                <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
                  <p style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'monospace', color: '#00D1FF' }}>
                    x{(ia.stake_mult || 1).toFixed(2)}
                  </p>
                  <p style={{ fontSize: '9px', color: '#64748B' }}>STAKE MULT</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 2 && (
            <div>
              {/* Tipster mini-scorecard */}
              <div style={{
                padding: '12px', borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(0,209,255,0.05) 0%, rgba(30,41,59,0.5) 100%)',
                border: '1px solid rgba(0,209,255,0.12)', marginBottom: '8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: '16px',
                    background: 'rgba(0,209,255,0.15)',
                  }}>
                    {apuesta.deporte === 'Fútbol' ? '⚽' : apuesta.deporte === 'NBA' || apuesta.deporte === 'Basket' ? '🏀' : apuesta.deporte === 'Tenis' ? '🎾' : '🎯'}
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 800, color: '#FFF' }}>{apuesta.tipster_alias}</p>
                    <p style={{ fontSize: '10px', color: '#94A3B8' }}>{ia.tipster_specialty || 'Sin perfil'} · {ia.total_bets_analyzed || 0} picks</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                  <div style={{ textAlign: 'center', padding: '6px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)' }}>
                    <p style={{ fontSize: '14px', fontWeight: 900, fontFamily: 'monospace', color: (ia.tipster_wr || 0) >= 65 ? '#00D1FF' : (ia.tipster_wr || 0) >= 58 ? '#F59E0B' : '#EF4444' }}>
                      {(ia.tipster_wr || 0).toFixed(1)}%
                    </p>
                    <p style={{ fontSize: '8px', color: '#64748B', fontWeight: 600 }}>WIN RATE</p>
                  </div>
                  <div style={{ textAlign: 'center', padding: '6px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)' }}>
                    <p style={{ fontSize: '14px', fontWeight: 900, fontFamily: 'monospace', color: (ia.tipster_roi || 0) > 0 ? '#00D1FF' : '#EF4444' }}>
                      {(ia.tipster_roi || 0) > 0 ? '+' : ''}{(ia.tipster_roi || 0).toFixed(1)}%
                    </p>
                    <p style={{ fontSize: '8px', color: '#64748B', fontWeight: 600 }}>ROI</p>
                  </div>
                  <div style={{ textAlign: 'center', padding: '6px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)' }}>
                    <p style={{ fontSize: '14px', fontWeight: 900, fontFamily: 'monospace', color: '#FFDD57' }}>
                      +{ia.tipster_best_streak || 0}
                    </p>
                    <p style={{ fontSize: '8px', color: '#64748B', fontWeight: 600 }}>BEST</p>
                  </div>
                </div>
              </div>
              {/* Golden rules */}
              {(ia.golden_rules || []).length > 0 && (
                <div>
                  <p style={{ fontSize: '10px', fontWeight: 700, color: '#FFDD57', marginBottom: '6px' }}>📌 Reglas de oro del tipster:</p>
                  {(ia.golden_rules || []).slice(0, 3).map((rule, i) => (
                    <p key={i} style={{ fontSize: '10px', color: '#94A3B8', marginBottom: '3px', paddingLeft: '8px', borderLeft: '2px solid rgba(255,221,87,0.3)' }}>
                      {rule}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 3 && (
            <div>
              <div style={{
                padding: '14px', borderRadius: '10px', textAlign: 'center',
                background: ia.zona === 'ORO' ? 'rgba(0,209,255,0.08)' : ia.zona === 'RIESGO' || ia.zona === 'BLOQUEADO' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
                border: `1px solid ${ia.zona === 'ORO' ? 'rgba(0,209,255,0.2)' : ia.zona === 'RIESGO' || ia.zona === 'BLOQUEADO' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
                marginBottom: '10px',
              }}>
                <IAConfidenceRing score={ia.score} zona={ia.zona} size={64} />
                <p style={{ fontSize: '13px', fontWeight: 800, color: '#FFF', marginTop: '8px' }}>
                  {ia.veredicto}
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <div style={{
                  padding: '10px', borderRadius: '8px', textAlign: 'center',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <p style={{ fontSize: '9px', color: '#64748B', fontWeight: 600, marginBottom: '2px' }}>STAKE RECOMENDADO</p>
                  <p style={{ fontSize: '16px', fontWeight: 900, fontFamily: 'monospace', color: ia.stake_mult > 1 ? '#00D1FF' : ia.stake_mult > 0 ? '#F59E0B' : '#EF4444' }}>
                    {ia.stake_mult === 0 ? 'NO APOSTAR' : `${(ia.stake_mult * 100).toFixed(0)}%`}
                  </p>
                </div>
                <div style={{
                  padding: '10px', borderRadius: '8px', textAlign: 'center',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <p style={{ fontSize: '9px', color: '#64748B', fontWeight: 600, marginBottom: '2px' }}>CONFIANZA IA</p>
                  <p style={{ fontSize: '16px', fontWeight: 900, fontFamily: 'monospace', color: ia.score >= 75 ? '#22C55E' : ia.score >= 50 ? '#F59E0B' : '#EF4444' }}>
                    {ia.score}/85
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// ODDS COMPARISON WIDGET
// ============================================================================
const OddsCompareWidget = ({ odds }: { odds: any }) => {
  const [expanded, setExpanded] = useState(false);
  
  // Parse if string
  let parsed = odds;
  if (typeof odds === 'string') {
    try { parsed = JSON.parse(odds); } catch(_e) { return null; }
  }
  if (!parsed || !Array.isArray(parsed.bookmakers)) return null;
  const casas = parsed.bookmakers.slice(0, 5);
  if (casas.length === 0) return null;

  return (
    <div style={{ marginTop: '6px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(15,23,42,0.5)' }}>
      <button onClick={() => setExpanded(!expanded)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
          📊 Cuotas comparativas ({casas.length} casas)
        </span>
        {expanded ? <ChevronUp style={{ width: '12px', height: '12px' }} /> : <ChevronDown style={{ width: '12px', height: '12px' }} />}
      </button>
      {expanded && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 10px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ fontSize: '9px', fontWeight: 700, color: '#64748B' }}>CASA</span>
            <span style={{ fontSize: '9px', fontWeight: 700, color: '#64748B' }}>CUOTAS</span>
          </div>
          {casas.map((casa: any, i: number) => (
            <div key={casa.nombre} style={{ padding: '5px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: i === 0 ? 'rgba(0,209,255,0.04)' : 'transparent', borderBottom: i < casas.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {i === 0 && <span style={{ background: 'rgba(0,209,255,0.2)', color: '#00D1FF', fontSize: '8px', fontWeight: 800, padding: '1px 5px', borderRadius: '3px' }}>⭐ MEJOR</span>}
                <span style={{ fontSize: '11px', color: i === 0 ? '#FFF' : '#94A3B8', fontWeight: i === 0 ? 600 : 400 }}>{casa.nombre}</span>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {Object.entries(casa.cuotas).map(([k, v]: [string, any]) => (
                  <span key={k} style={{ fontFamily: 'monospace', fontSize: '11px', padding: '1px 5px', borderRadius: '3px', background: i === 0 ? 'rgba(0,209,255,0.12)' : 'rgba(255,255,255,0.04)', color: i === 0 ? '#00D1FF' : '#CBD5E1', fontWeight: i === 0 ? 700 : 500 }}>
                    {Number(v).toFixed(2)}
                  </span>
                ))}
              </div>
            </div>
          ))}
          <div style={{ padding: '4px 10px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ fontSize: '9px', color: '#64748B' }}>Datos: The Odds API · {parsed.timestamp ? new Date(parsed.timestamp).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// ROTATING PHRASES
// ============================================================================
const FRASES_NEUROTIPS = [
  "Hacemos lo que el ojo humano no ve",
  "9 tipsters analizados con IA profunda",
  "Tu ventaja empieza aquí",
  "Análisis inteligente, decisiones rentables",
  "El poder de la IA en cada apuesta",
  "Zona ORO = máxima confianza",
  "Cada pick analizado en tiempo real",
];

const FraseRotativa = () => {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => { setIndex(prev => (prev + 1) % FRASES_NEUROTIPS.length); setFade(true); }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  return (
    <span style={{ opacity: fade ? 1 : 0, color: '#00D1FF', fontStyle: 'italic', fontSize: '13px', transition: 'opacity 0.4s' }}>
      &quot;{FRASES_NEUROTIPS[index]}&quot;
    </span>
  );
};

// ============================================================================
// COUNTDOWN TIMER
// ============================================================================
const CountdownTimer = ({ days }: { days: number }) => {
  const [timeLeft, setTimeLeft] = useState({ days, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { days: d, hours: h, minutes: m, seconds: s } = prev;
        if (s > 0) s--; else if (m > 0) { m--; s = 59; }
        else if (h > 0) { h--; m = 59; s = 59; }
        else if (d > 0) { d--; h = 23; m = 59; s = 59; }
        return { days: d, hours: h, minutes: m, seconds: s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      {[{ v: timeLeft.days, l: 'd' }, { v: timeLeft.hours, l: 'h' }, { v: timeLeft.minutes, l: 'm' }, { v: timeLeft.seconds, l: 's' }].map(t => (
        <div key={t.l} style={{ textAlign: 'center', padding: '4px 8px', borderRadius: '8px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', minWidth: '36px' }}>
          <span style={{ fontSize: '16px', fontWeight: 900, fontFamily: 'monospace', color: '#FFDD57' }}>{String(t.v).padStart(2, '0')}</span>
          <span style={{ fontSize: '8px', color: '#94A3B8', display: 'block' }}>{t.l}</span>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// SPARKLINE
// ============================================================================
const MiniSparkline = ({ positive = true }: { positive?: boolean }) => {
  const pts = positive ? "0,20 10,18 20,15 30,12 40,14 50,8 60,5" : "0,5 10,8 20,12 30,10 40,15 50,18 60,20";
  return (
    <svg width="60" height="25" viewBox="0 0 60 25">
      <defs>
        <linearGradient id={`spark-${positive ? 'up' : 'dn'}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={positive ? '#00D1FF' : '#EF4444'} stopOpacity="0.4" />
          <stop offset="100%" stopColor={positive ? '#00D1FF' : '#EF4444'} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={pts + ' 60,25 0,25'} fill={`url(#spark-${positive ? 'up' : 'dn'})`} />
      <polyline points={pts} fill="none" stroke={positive ? '#00D1FF' : '#EF4444'} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

// ============================================================================
// PROGRESS BAR PENDIENTE
// ============================================================================
const ProgressBarPendiente = () => (
  <div style={{ width: '100%', height: '3px', borderRadius: '2px', background: 'rgba(245,158,11,0.12)', overflow: 'hidden', marginTop: '8px' }}>
    <div style={{ width: '60%', height: '100%', borderRadius: '2px', background: 'linear-gradient(90deg, #F59E0B, #FFDD57)', animation: 'pendienteProgress 2s ease-in-out infinite alternate' }} />
  </div>
);

// ============================================================================
// PICK DEL DÍA CARD — Best bet of the day by IA score
// ============================================================================
const PickDelDia = ({ apuestas }: { apuestas: Apuesta[] }) => {
  const pendientes = apuestas.filter(a => a.resultado === 'PENDIENTE' && a.ia_analysis?.score != null);
  if (pendientes.length === 0) return null;
  
  const best = pendientes.reduce((a, b) => ((a.ia_analysis?.score || 0) > (b.ia_analysis?.score || 0)) ? a : b);
  if (!best.ia_analysis || best.ia_analysis.score < 65) return null; // Only show if score is high enough

  return (
    <div style={{
      borderRadius: '16px', padding: '16px', position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(135deg, rgba(0,209,255,0.12) 0%, rgba(255,221,87,0.06) 50%, rgba(30,41,59,0.9) 100%)',
      border: '1.5px solid rgba(0,209,255,0.35)',
      boxShadow: '0 0 30px rgba(0,209,255,0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
    }}>
      {/* Glowing background accent */}
      <div style={{
        position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,209,255,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{
          background: 'linear-gradient(135deg, #22C55E, #33DBFF)',
          color: '#000', fontSize: '10px', fontWeight: 900, padding: '3px 10px',
          borderRadius: '6px', letterSpacing: '1px',
          display: 'flex', alignItems: 'center', gap: '4px',
          boxShadow: '0 0 12px rgba(0,209,255,0.4)',
        }}>
          <Star style={{ width: '12px', height: '12px' }} />
          PICK DEL DÍA IA
        </span>
        <ZonaBadge zona={best.ia_analysis?.zona || 'NEUTRA'} small />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <IAConfidenceRing score={best.ia_analysis?.score || 0} zona={best.ia_analysis?.zona || 'NEUTRA'} size={60} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '10px', color: '#94A3B8', marginBottom: '2px' }}>
            {best.tipster_alias || 'Tipster'} · {best.tipo_mercado || 'Mercado'}
          </p>
          {esCombinada({ tipo_mercado: best.tipo_mercado, apuesta: best.apuesta }) ? (
            <CombinadaLegs
              textoApuesta={best.apuesta}
              cuotaTotal={best.cuota}
              resultado={best.resultado}
              compact
            />
          ) : (
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#FFF', marginBottom: '4px', lineHeight: 1.3 }}>
              {best.apuesta}
            </p>
          )}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 800, color: '#F59E0B' }}>
              @{(best.cuota || 0).toFixed(2)}
            </span>
            <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: (best.ia_analysis?.ev || 0) > 0 ? '#00D1FF' : '#EF4444' }}>
              EV: {(best.ia_analysis?.ev || 0) > 0 ? '+' : ''}{best.ia_analysis?.ev || 0}%
            </span>
            <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: '#818CF8' }}>
              Stake: x{(best.ia_analysis?.stake_mult || 1).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// IA INSIGHTS — Dynamic insights from real IA data
// ============================================================================
const IAInsights = ({ apuestas, alertas }: { apuestas: Apuesta[]; alertas: any[] }) => {
  const insights: { emoji: string; texto: string; tipo: 'positivo' | 'neutral' | 'precaucion' }[] = [];
  
  const pendientes = apuestas.filter(a => a.resultado === 'PENDIENTE' && a.ia_analysis);
  const zonasOro = pendientes.filter(a => a.ia_analysis?.zona === 'ORO');
  const zonasRiesgo = pendientes.filter(a => a.ia_analysis?.zona === 'RIESGO' || a.ia_analysis?.zona === 'BLOQUEADO');
  const scoredPendientes = pendientes.filter(a => a.ia_analysis?.score != null);
  const avgScore = scoredPendientes.length > 0 ? Math.round(scoredPendientes.reduce((s, a) => s + (a.ia_analysis?.score || 0), 0) / scoredPendientes.length) : 0;

  if (zonasOro.length > 0) {
    insights.push({
      emoji: '🟢', tipo: 'positivo',
      texto: `${zonasOro.length} pick${zonasOro.length > 1 ? 's' : ''} en ZONA ORO hoy. Alta confianza IA.`
    });
  }
  if (alertas.length > 0) {
    const nombres = alertas.slice(0, 2).map(a => a.alias).join(', ');
    insights.push({
      emoji: '⚠️', tipo: 'precaucion',
      texto: `${nombres} en racha negativa. IA reduce stakes automáticamente.`
    });
  }
  if (zonasRiesgo.length > 0) {
    insights.push({
      emoji: '🔴', tipo: 'precaucion',
      texto: `${zonasRiesgo.length} pick${zonasRiesgo.length > 1 ? 's' : ''} en zona de riesgo. Precaución.`
    });
  }
  if (avgScore > 0) {
    insights.push({
      emoji: '🧠', tipo: avgScore >= 65 ? 'positivo' : 'neutral',
      texto: `Score IA promedio del día: ${avgScore}/85. ${avgScore >= 65 ? 'Buen día para apostar.' : 'Día mixto, sé selectivo.'}`
    });
  }
  if (pendientes.length > 0) {
    const bestEV = pendientes.reduce((a, b) => (a.ia_analysis?.ev || 0) > (b.ia_analysis?.ev || 0) ? a : b);
    if (bestEV.ia_analysis && bestEV.ia_analysis.ev > 5) {
      insights.push({
        emoji: '💰', tipo: 'positivo',
        texto: `Mejor EV: ${bestEV.tipster_alias || 'Tipster'} con +${bestEV.ia_analysis.ev}% en ${bestEV.tipo_mercado || 'su pick'}.`
      });
    }
  }

  return insights.slice(0, 5);
};

// ============================================================================
// MAIN DASHBOARD PAGE
// ============================================================================
export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [data, setData] = useState<DashboardData>({
    totalTipsters: 0, apuestasHoy: 0, topTipster: null, alertas: [],
    apuestasRecientes: [], iaVersion: '2.0', profilesAvailable: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [liveData, setLiveData] = useState<{ live: any[]; urgentes: any[]; total_live: number; total_urgentes: number }>({ live: [], urgentes: [], total_live: 0, total_urgentes: 0 });
  const [rachasData, setRachasData] = useState<{ alertas: any[]; total: number }>({ alertas: [], total: 0 });
  const prevApuestasRef = useRef<string>('');
  const { soundEnabled, setSoundEnabled, playNewPick, playWin, playLoss } = useSoundNotifications();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ★ CALL IA-ENHANCED ENDPOINT
        const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
        let dashboardData: any;

        try {
          // Try IA endpoint first
          const resp = await fetch(`${API_URL}/api/public/dashboard-ia`);
          if (resp.ok) {
            dashboardData = await resp.json();
          } else {
            // Fallback to regular endpoint
            dashboardData = await dashboardAPI.getData();
          }
        } catch (_e) {
          dashboardData = await dashboardAPI.getData();
        }

        const nuevasApuestas = (dashboardData.apuestas?.apuestas || []).slice(0, 10);
        
        // Sound detection
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
        });

        // ★ FASE 2: Live picks + Rachas alerts (non-blocking)
        try {
          const [liveRes, rachasRes] = await Promise.all([
            picksAPI.getLive().catch(() => ({ live: [], urgentes: [], total_live: 0, total_urgentes: 0 })),
            alertasAPI.getRachas().catch(() => ({ alertas: [], total: 0 })),
          ]);
          setLiveData(liveRes);
          setRachasData(rachasRes);
        } catch (_) {}

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [playNewPick, playWin, playLoss]);

  const getDiasRestantes = () => {
    if (!user?.suscripcion_hasta) return 5;
    const hasta = new Date(user.suscripcion_hasta);
    return Math.max(0, Math.ceil((hasta.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
  };

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

  const diasRestantes = getDiasRestantes();
  const apuestas = data.apuestasRecientes.map(a => ({
    ...a,
    resultado: (a.resultado && a.resultado !== '' && a.resultado !== 'NULA') ? a.resultado : 'PENDIENTE'
  }));
  const pendientes = apuestas.filter(a => a.resultado === 'PENDIENTE');
  const resueltas = apuestas.filter(a => a.resultado === 'GANADA' || a.resultado === 'PERDIDA');
  const insights = IAInsights({ apuestas, alertas: data.alertas });

  // IA stats for KPIs
  const iaScores = apuestas.filter(a => a.ia_analysis).map(a => a.ia_analysis!.score);
  const avgIAScore = iaScores.length > 0 ? Math.round(iaScores.reduce((a, b) => a + b, 0) / iaScores.length) : 0;
  const zonaOroCount = apuestas.filter(a => a.ia_analysis?.zona === 'ORO').length;

  return (
    <div className="space-y-5 animate-fadeIn pb-20 lg:pb-6">

      {/* ============================================================ */}
      {/* HEADER                                                        */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-1">
                <span style={{ color: '#00D1FF', fontWeight: 900 }}>Neuro</span>
                <span style={{ fontSize: '28px' }}>🧠</span>
                <span style={{ color: '#F1F5F9', fontWeight: 900 }}>Tips</span>
              </h1>
              <p className="text-sm mt-0.5">
                <span style={{ color: '#94A3B8' }}>¡Hola, </span>
                <span style={{ color: '#00D1FF', fontWeight: 600 }}>{user?.nombre || 'Apostador'}</span>
                <span style={{ color: '#94A3B8' }}>!</span>
              </p>
              <FraseRotativa />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* IA Version Badge */}
          <span style={{
            background: 'linear-gradient(135deg, rgba(255,107,157,0.15), rgba(0,209,255,0.05))',
            border: '1px solid rgba(0,209,255,0.3)', borderRadius: '8px',
            padding: '4px 10px', fontSize: '10px', fontWeight: 800, color: '#00D1FF',
            display: 'flex', alignItems: 'center', gap: '4px',
            animation: 'iaPulse 3s ease-in-out infinite',
          }}>
            <Brain style={{ width: '12px', height: '12px' }} />
            IA v{data.iaVersion}
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00D1FF', animation: 'livePulse 1.5s infinite' }} />
          </span>
          {/* Sound toggle */}
          <button onClick={() => setSoundEnabled(!soundEnabled)}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px',
              borderRadius: '8px', fontSize: '10px', fontWeight: 700, cursor: 'pointer',
              background: soundEnabled ? 'rgba(0,209,255,0.12)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${soundEnabled ? 'rgba(0,209,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
              color: soundEnabled ? '#00D1FF' : '#64748B',
            }}>
            {soundEnabled ? <Volume2 style={{ width: '12px', height: '12px' }} /> : <VolumeX style={{ width: '12px', height: '12px' }} />}
            {soundEnabled ? 'ON' : 'OFF'}
          </button>
          {user?.plan === 'PREMIUM' && (
            <div className="badge-gold flex items-center gap-1.5">
              <Trophy className="h-4 w-4" /> Premium
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* TRIAL BANNER                                                  */}
      {/* ============================================================ */}
      {user?.plan === 'FREE_TRIAL' && (
        <div className="trial-banner animate-fadeInUp">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[#FFDD57]/10">
                <Clock className="h-7 w-7 text-[#FFDD57]" />
              </div>
              <div>
                <p className="text-[#FFDD57] font-bold text-lg">🔥 Período de Prueba Activo</p>
                <p className="text-[#94A3B8] text-sm">Suscríbete y desbloquea análisis IA completo</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <CountdownTimer days={diasRestantes} />
              <Link href="/dashboard/suscripcion" className="btn-pulse whitespace-nowrap">
                Suscribirse Ahora
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* KPI CARDS                                                     */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* TIPSTERS ACTIVOS */}
        <div className="stat-card animate-fadeInUp stagger-1">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-[#00D1FF]/10">
              <Users className="h-5 w-5 text-[#00D1FF]" />
            </div>
            <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(0,209,255,0.1)', color: '#00D1FF' }}>
              IA Tracked
            </span>
          </div>
          <p className="text-3xl font-bold text-white font-mono">{data.totalTipsters}</p>
          <p className="text-[#94A3B8] text-sm mt-1">Tipsters Activos</p>
          <p style={{ fontSize: '9px', color: '#00D1FF', marginTop: '2px' }}>{data.profilesAvailable.length} perfilados IA</p>
        </div>

        {/* APUESTAS HOY */}
        <div className="stat-card animate-fadeInUp stagger-2" style={{ borderColor: 'rgba(255, 187, 0, 0.5)', borderWidth: '2px', boxShadow: '0 0 20px rgba(255, 187, 0, 0.15)' }}>
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-xl" style={{ background: 'rgba(245,158,11,0.15)' }}>
              <Calendar className="h-5 w-5 text-[#F59E0B]" />
            </div>
            {pendientes.length > 0 && (
              <span style={{
                background: 'linear-gradient(135deg, #DC2626, #EF4444)', color: 'white',
                fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px',
                display: 'flex', alignItems: 'center', gap: '4px',
              }}>
                <span className="animate-pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white', display: 'inline-block' }} /> EN VIVO
              </span>
            )}
          </div>
          <p className="text-3xl font-bold font-mono" style={{ color: '#F59E0B' }}>{data.apuestasHoy || apuestas.length}</p>
          <p className="text-sm mt-0.5" style={{ color: '#D4A843' }}>Apuestas Hoy</p>
          <p style={{ fontSize: '9px', color: '#94A3B8', marginTop: '2px' }}>
            {pendientes.length > 0 ? `${pendientes.length} pendiente${pendientes.length > 1 ? 's' : ''}` : ''}
            {pendientes.length > 0 && resueltas.length > 0 ? ' · ' : ''}
            {resueltas.length > 0 ? `${resueltas.length} resuelta${resueltas.length > 1 ? 's' : ''}` : ''}
            {apuestas.length === 0 ? 'Sin picks aún' : ''}
          </p>
          {zonaOroCount > 0 && (
            <p style={{ fontSize: '9px', color: '#00D1FF', marginTop: '1px' }}>🟢 {zonaOroCount} en Zona ORO</p>
          )}
        </div>

        {/* TIPSTER DEL MES */}
        <div className="stat-card animate-fadeInUp stagger-3" style={{ borderColor: 'rgba(255, 221, 87, 0.25)' }}>
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-xl" style={{ background: 'rgba(255, 221, 87, 0.1)' }}>
              <span style={{ fontSize: '20px' }}>👑</span>
            </div>
            <MiniSparkline positive={true} />
          </div>
          <p className="text-lg font-bold text-white truncate">{data.topTipster?.alias || '—'}</p>
          {data.topTipster && (
            <p className="text-[#00D1FF] font-bold flex items-center gap-1 mt-0.5 text-sm">
              <TrendingUp className="h-3.5 w-3.5" /> Mejor rendimiento
            </p>
          )}
          <p className="text-xs mt-1" style={{ color: '#D4A843' }}>👑 Tipster del Mes</p>
        </div>

        {/* IA SCORE PROMEDIO */}
        <div className="stat-card animate-fadeInUp stagger-4" style={{
          borderColor: avgIAScore >= 65 ? 'rgba(0,209,255,0.25)' : avgIAScore >= 50 ? 'rgba(245,158,11,0.25)' : 'rgba(239,68,68,0.25)',
        }}>
          <div className="flex items-start justify-between mb-2">
            <div className="p-2.5 rounded-xl bg-[#00D1FF]/10">
              <Brain className="h-5 w-5 text-[#00D1FF]" />
            </div>
            <IAConfidenceRing score={avgIAScore} zona={avgIAScore >= 75 ? 'ORO' : avgIAScore >= 50 ? 'NEUTRA' : 'RIESGO'} size={40} />
          </div>
          <p className="text-3xl font-bold font-mono" style={{ color: avgIAScore >= 65 ? '#22C55E' : avgIAScore >= 50 ? '#F59E0B' : '#EF4444' }}>
            {avgIAScore}
          </p>
          <p className="text-[#94A3B8] text-sm mt-0.5">Score IA Promedio</p>
          <p style={{ fontSize: '9px', color: '#64748B', marginTop: '2px' }}>{iaScores.length} picks analizados</p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 🔴 LIVE PICKS — URGENTES (Fase 2-D)                            */}
      {/* ============================================================ */}
      {liveData.total_live > 0 && (
        <div className="rounded-2xl overflow-hidden animate-fadeInUp" style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(255, 187, 0, 0.05))',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          animation: 'liveBorderPulse 2s ease-in-out infinite',
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.12), transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                background: 'rgba(239, 68, 68, 0.2)', padding: '4px 10px',
                borderRadius: '8px', fontSize: '11px', fontWeight: 700, color: '#EF4444',
              }}>
                <span style={{
                  width: '7px', height: '7px', borderRadius: '50%',
                  background: '#EF4444', display: 'inline-block',
                  animation: 'livePulse 1.5s ease-in-out infinite',
                }} />
                EN VIVO
              </span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>
                {liveData.total_live} pick{liveData.total_live > 1 ? 's' : ''} en juego ahora
              </span>
            </div>
            {liveData.total_urgentes > 0 && (
              <span style={{
                fontSize: '10px', fontWeight: 700, padding: '3px 8px',
                borderRadius: '6px', background: 'rgba(255, 187, 0, 0.15)',
                color: '#F59E0B', border: '1px solid rgba(255, 187, 0, 0.3)',
              }}>
                ⚡ {liveData.total_urgentes} urgente{liveData.total_urgentes > 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          {/* Live picks list */}
          <div style={{ padding: '8px 12px 12px' }}>
            {liveData.live.slice(0, 4).map((pick: any, idx: number) => (
              <div key={pick.id} style={{
                padding: '10px 12px', borderRadius: '10px', marginBottom: idx < Math.min(liveData.live.length, 4) - 1 ? '6px' : 0,
                background: pick.is_urgente ? 'rgba(255, 187, 0, 0.06)' : 'rgba(30, 41, 59, 0.5)',
                border: `1px solid ${pick.is_urgente ? 'rgba(255, 187, 0, 0.2)' : 'rgba(255,255,255,0.04)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#00D1FF' }}>{pick.tipster}</span>
                    {pick.is_urgente && (
                      <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: 'rgba(255, 187, 0, 0.15)', color: '#F59E0B' }}>
                        ⚡ URGENTE
                      </span>
                    )}
                    {pick.hora_partido && (
                      <span style={{ fontSize: '10px', color: '#EF4444', fontWeight: 600 }}>● {pick.hora_partido}</span>
                    )}
                  </div>
                  {esCombinada({ tipo_mercado: pick.tipo_mercado, apuesta: pick.apuesta }) ? (
                    <CombinadaLegs
                      textoApuesta={pick.apuesta}
                      cuotaTotal={pick.cuota}
                      resultado={pick.resultado}
                      compact
                    />
                  ) : (
                    <p style={{ fontSize: '12px', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {pick.apuesta}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  {/* Mini NeuroScore */}
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    border: `2px solid ${pick.neuroscore >= 75 ? '#22C55E' : pick.neuroscore >= 50 ? '#F59E0B' : '#EF4444'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', fontWeight: 700, fontFamily: 'monospace',
                    color: pick.neuroscore >= 75 ? '#22C55E' : pick.neuroscore >= 50 ? '#F59E0B' : '#EF4444',
                  }}>
                    {pick.neuroscore}
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'white', fontFamily: 'monospace' }}>
                    @{pick.cuota}
                  </span>
                </div>
              </div>
            ))}
            {liveData.total_live > 4 && (
              <Link href="/dashboard/apuestas" style={{
                display: 'block', textAlign: 'center', paddingTop: '8px',
                fontSize: '12px', color: '#00D1FF', textDecoration: 'none',
              }}>
                Ver {liveData.total_live - 4} más →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 🏆 PICK DEL DÍA IA                                           */}
      {/* ============================================================ */}
      <PickDelDia apuestas={apuestas} />

      {/* ============================================================ */}
      {/* 🧠 COMBINADA IA DEL DÍA                                      */}
      {/* ============================================================ */}
      <CombinadaCertificada variant="dashboard" />

      {/* ============================================================ */}
      {/* APUESTAS EN JUEGO — With IA Analysis                         */}
      {/* ============================================================ */}
      <div className="rounded-2xl p-4 border border-white/10 animate-fadeInUp"
        style={{ background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(12px)' }}>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ background: 'rgba(245,158,11,0.1)' }}>
              <Activity className="h-5 w-5 text-[#F59E0B]" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Apuestas en Juego</h3>
              <p className="text-xs text-[#94A3B8]">
                {pendientes.length > 0
                  ? `${pendientes.length} pendiente${pendientes.length > 1 ? 's' : ''} · ${resueltas.length} resueltas · IA activa`
                  : `${data.apuestasHoy} operaciones hoy`}
              </p>
            </div>
          </div>
          <Link href="/dashboard/apuestas" className="flex items-center gap-1 text-sm text-[#00D1FF] hover:text-[#33DBFF] transition-colors">
            Ver todas <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {apuestas.length > 0 ? (
          <div className="space-y-3">
            
            {/* ── PENDIENTES ── */}
            {pendientes.map((apuesta, idx) => {
              const hora = apuesta.hora_partido;
              let horaLabel = '';
              let horaColor = '#94A3B8';
              if (hora) {
                try {
                  const [h, m] = hora.split(':').map(Number);
                  const now = new Date();
                  const horaMin = h * 60 + m;
                  const nowMin = now.getHours() * 60 + now.getMinutes();
                  if (nowMin >= horaMin) { horaLabel = `🔴 EN VIVO · ${hora}`; horaColor = '#EF4444'; }
                  else if (horaMin - nowMin <= 30) { horaLabel = `⚡ POR INICIAR · ${hora}`; horaColor = '#F59E0B'; }
                  else { horaLabel = `🕐 ${hora} CL`; horaColor = '#F59E0B'; }
                } catch(_e) { horaLabel = hora; }
              }
              const unidades = apuesta.stake_ia ? (apuesta.stake_ia / 1000).toFixed(1) + 'u' : '';
              const ia = apuesta.ia_analysis;

              return (
                <div key={`p-${idx}`} className="rounded-xl p-4 relative overflow-hidden"
                  style={{
                    background: horaColor === '#EF4444'
                      ? 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(255,50,50,0.02) 100%)'
                      : 'linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(255,221,87,0.02) 100%)',
                    border: horaColor === '#EF4444'
                      ? '1.5px solid rgba(239,68,68,0.35)'
                      : '1.5px solid rgba(245,158,11,0.3)',
                    animation: 'pendienteBorder 3s ease-in-out infinite',
                  }}>
                  
                  {/* ★ IA CONFIDENCE BADGE — Top right */}
                  {ia && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                      <IAConfidenceRing score={ia.score} zona={ia.zona} size={44} />
                    </div>
                  )}

                  {/* Header row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', paddingRight: '50px' }}>
                    {/* Tipster badge */}
                    <span style={{
                      fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px',
                      background: 'rgba(99,102,241,0.12)', color: '#818CF8',
                    }}>
                      {apuesta.tipster_alias}
                    </span>
                    {/* Status badge */}
                    {horaColor === '#EF4444' ? (
                      <span style={{
                        background: 'linear-gradient(135deg, #EF4444, #DC2626)', color: '#FFF',
                        fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '5px',
                        display: 'flex', alignItems: 'center', gap: '4px',
                        boxShadow: '0 0 10px rgba(239,68,68,0.3)',
                      }}>
                        🔴 EN VIVO
                      </span>
                    ) : (
                      <span style={{
                        background: 'linear-gradient(135deg, #F59E0B, #F59E0B)', color: '#000',
                        fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '5px',
                      }}>
                        ⏳ PENDIENTE
                      </span>
                    )}
                    {/* Market type */}
                    {apuesta.tipo_mercado && (
                      <span style={{
                        fontSize: '9px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px',
                        background: 'rgba(255,255,255,0.05)', color: '#94A3B8',
                      }}>
                        {apuesta.tipo_mercado.length > 12 ? apuesta.tipo_mercado.slice(0, 12) : apuesta.tipo_mercado}
                      </span>
                    )}
                  </div>

                  {/* IA Zona badge */}
                  {ia && (
                    <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ZonaBadge zona={ia.zona} small />
                      {ia.ev > 0 && (
                        <span style={{
                          fontSize: '9px', fontWeight: 800, fontFamily: 'monospace',
                          color: ia.ev > 10 ? '#00D1FF' : '#F59E0B',
                          padding: '1px 6px', borderRadius: '4px',
                          background: ia.ev > 10 ? 'rgba(0,209,255,0.1)' : 'rgba(245,158,11,0.1)',
                        }}>
                          EV+{ia.ev}%
                        </span>
                      )}
                      {ia.stake_mult > 1 && (
                        <span style={{
                          fontSize: '9px', fontWeight: 800, fontFamily: 'monospace',
                          color: '#818CF8', padding: '1px 6px', borderRadius: '4px',
                          background: 'rgba(99,102,241,0.1)',
                        }}>
                          ↑ Stake x{(ia.stake_mult || 1).toFixed(1)}
                        </span>
                      )}
                      {ia.stake_mult === 0 && (
                        <span style={{
                          fontSize: '9px', fontWeight: 800, color: '#EF4444',
                          padding: '1px 6px', borderRadius: '4px', background: 'rgba(239,68,68,0.1)',
                        }}>
                          🚫 BLOQUEADO
                        </span>
                      )}
                    </div>
                  )}

                  {/* Bet text + cuota */}
                  {esCombinada({ tipo_mercado: apuesta.tipo_mercado, apuesta: apuesta.apuesta }) ? (
                    <div style={{ marginBottom: '4px' }}>
                      <CombinadaLegs
                        textoApuesta={apuesta.apuesta}
                        cuotaTotal={apuesta.cuota}
                        resultado={apuesta.resultado}
                        compact
                      />
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <p style={{ color: '#FFF', fontWeight: 600, fontSize: '13px', lineHeight: 1.4, flex: 1, paddingRight: '8px' }}>
                        {apuesta.apuesta}
                      </p>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '16px', color: '#F59E0B', flexShrink: 0 }}>
                        @{(apuesta.cuota || 0).toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Image */}
                  {apuesta.imagen_url && (() => {
                    const imgUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}${apuesta.imagen_url}`;
                    return (
                      <div style={{ marginBottom: '4px' }}>
                        <button onClick={() => {
                          const el = document.getElementById(`img-${apuesta.id}`);
                          if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
                        }}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#818CF8', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}>
                          📷 <span style={{ textDecoration: 'underline' }}>Ver capture</span>
                        </button>
                        <div id={`img-${apuesta.id}`} style={{ display: 'none', marginTop: '4px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', padding: '4px' }}>
                          <img src={imgUrl} alt="Capture" style={{ borderRadius: '6px', width: '100%', maxWidth: '280px', cursor: 'zoom-in' }}
                            onClick={() => window.open(imgUrl, '_blank')} />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Odds comparison */}
                  {apuesta.odds_comparacion && <OddsCompareWidget odds={apuesta.odds_comparacion} />}

                  {/* ★ IA DEEP ANALYSIS */}
                  {ia && <IADeepAnalysis ia={ia} apuesta={apuesta} />}

                  {/* Footer */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', marginTop: '6px' }}>
                    {horaLabel ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'monospace', fontWeight: 700, color: horaColor }}>
                        {horaLabel}
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94A3B8' }}>
                        <Eye style={{ width: '12px', height: '12px' }} /> Esperando resultado...
                      </span>
                    )}
                    {unidades && <span style={{ fontFamily: 'monospace', color: '#94A3B8' }}>Stake: {unidades}</span>}
                  </div>
                  <ProgressBarPendiente />
                </div>
              );
            })}

            {/* ── RESUELTAS ── */}
            {resueltas.map((apuesta, idx) => {
              const ia = apuesta.ia_analysis;
              const isWin = apuesta.resultado === 'GANADA';
              return (
                <div key={`r-${idx}`} className="rounded-xl p-3"
                  style={{
                    background: isWin ? 'rgba(0,209,255,0.05)' : 'rgba(239,68,68,0.05)',
                    border: `1px solid ${isWin ? 'rgba(0,209,255,0.18)' : 'rgba(239,68,68,0.18)'}`,
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                      <span style={{
                        width: '24px', height: '24px', borderRadius: '6px', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0,
                        background: isWin ? 'rgba(0,209,255,0.2)' : 'rgba(239,68,68,0.2)',
                        color: isWin ? '#00D1FF' : '#EF4444',
                      }}>
                        {isWin ? '✓' : '✗'}
                      </span>
                      {esCombinada({ tipo_mercado: apuesta.tipo_mercado, apuesta: apuesta.apuesta }) ? (
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <CombinadaLegs
                            textoApuesta={apuesta.apuesta}
                            cuotaTotal={apuesta.cuota}
                            resultado={apuesta.resultado}
                            compact
                          />
                        </div>
                      ) : (
                        <span style={{ fontSize: '13px', color: '#FFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {apuesta.apuesta}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginLeft: '8px' }}>
                      {ia && <IAConfidenceRing score={ia.score} zona={ia.zona} size={32} />}
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '13px', color: isWin ? '#00D1FF' : '#EF4444' }}>
                        @{(apuesta.cuota || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {/* IA accuracy check */}
                  {ia && (
                    <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px',
                        background: (isWin && ia.zona === 'ORO') || (!isWin && (ia.zona === 'RIESGO' || ia.zona === 'BLOQUEADO'))
                          ? 'rgba(0,209,255,0.1)' : 'rgba(239,68,68,0.1)',
                        color: (isWin && ia.zona === 'ORO') || (!isWin && (ia.zona === 'RIESGO' || ia.zona === 'BLOQUEADO'))
                          ? '#00D1FF' : '#EF4444',
                      }}>
                        {(isWin && ia.zona === 'ORO') || (!isWin && (ia.zona === 'RIESGO' || ia.zona === 'BLOQUEADO'))
                          ? '✅ IA acertó' : isWin ? '📊 IA Score: ' + ia.score : '📊 IA Score: ' + ia.score}
                      </span>
                      <ZonaBadge zona={ia.zona} small />
                    </div>
                  )}
                  {apuesta.odds_comparacion && <OddsCompareWidget odds={apuesta.odds_comparacion} />}
                </div>
              );
            })}

            {apuestas.length === 0 && (
              <p style={{ color: '#94A3B8', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>
                No hay apuestas hoy. Las apuestas aparecerán aquí cuando se registren.
              </p>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <Calendar style={{ width: '40px', height: '40px', color: '#334155', margin: '0 auto 12px' }} />
            <p style={{ color: '#94A3B8', fontSize: '13px' }}>No hay apuestas hoy</p>
            <p style={{ color: '#64748B', fontSize: '11px', marginTop: '4px' }}>Las apuestas se registran desde el bot de Telegram</p>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* INSIGHTS IA + RECOMENDACIONES                                 */}
      {/* ============================================================ */}
      <div className="grid lg:grid-cols-2 gap-4">
        
        {/* INSIGHTS IA */}
        <div className="rounded-2xl p-5 animate-fadeInUp"
          style={{
            background: 'linear-gradient(135deg, rgba(0,209,255,0.08) 0%, rgba(30,41,59,0.7) 100%)',
            backdropFilter: 'blur(12px)', border: '1px solid rgba(0,209,255,0.25)',
          }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-[#00D1FF]/15">
              <Brain className="h-5 w-5 text-[#00D1FF]" />
            </div>
            <div>
              <h3 className="font-bold text-white">NeuroTips IA</h3>
              <p className="text-xs text-[#94A3B8]">Insights en tiempo real</p>
            </div>
            <span style={{
              marginLeft: 'auto', fontSize: '9px', fontWeight: 800, fontFamily: 'monospace',
              padding: '2px 6px', borderRadius: '4px', background: 'rgba(0,209,255,0.1)', color: '#00D1FF',
            }}>
              LIVE
            </span>
          </div>
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'start', gap: '10px', padding: '10px', borderRadius: '10px',
                background: insight.tipo === 'positivo' ? 'rgba(0,209,255,0.06)' : insight.tipo === 'precaucion' ? 'rgba(239,68,68,0.06)' : 'rgba(59,130,246,0.06)',
                border: `1px solid ${insight.tipo === 'positivo' ? 'rgba(0,209,255,0.12)' : insight.tipo === 'precaucion' ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.12)'}`,
              }}>
                <span style={{ fontSize: '16px', flexShrink: 0, lineHeight: 1 }}>{insight.emoji}</span>
                <p style={{ fontSize: '12px', color: '#E2E8F0', lineHeight: 1.5 }}>{insight.texto}</p>
              </div>
            ))}
            {insights.length === 0 && (
              <p style={{ fontSize: '12px', color: '#64748B', textAlign: 'center', padding: '12px' }}>
                🧠 Sin datos suficientes aún. Los insights aparecerán con las apuestas del día.
              </p>
            )}
          </div>
        </div>

        {/* RECOMENDACIONES IA */}
        <Link href="/dashboard/recomendaciones" className="card-premium group animate-fadeInUp block">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#FFDD57]/10">
                <Zap className="h-6 w-6 text-[#FFDD57]" />
              </div>
              <div>
                <h3 className="font-bold text-white">Recomendaciones IA</h3>
                <p className="text-sm text-[#94A3B8]">Picks de alta confianza</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-[#FFDD57] group-hover:translate-x-1 transition-all" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="badge-ia"><Star className="h-3 w-3" /> IA Approved</span>
              <span className="text-xs text-[#94A3B8]">Filtro inteligente activo</span>
            </div>
            <p className="text-white text-sm">
              Análisis profundo: Win Rate por mercado, EV+, zonas de cuota óptimas y gestión de banca.
            </p>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {[
                { icon: Target, label: 'EV+', color: '#00D1FF' },
                { icon: BarChart3, label: 'Zonas', color: '#FFDD57' },
                { icon: Shield, label: 'Filtro IA', color: '#818CF8' },
              ].map((item, i) => (
                <div key={i} style={{ background: 'rgba(15,23,42,0.5)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                  <item.icon style={{ width: '16px', height: '16px', color: item.color, margin: '0 auto 4px' }} />
                  <p style={{ fontSize: '10px', color: '#94A3B8' }}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </Link>
      </div>

      {/* ============================================================ */}
      {/* ALERTAS RACHA NEGATIVA                                        */}
      {/* ============================================================ */}
      {data.alertas.length > 0 && (
        <div className="rounded-2xl p-5 animate-fadeInUp"
          style={{
            background: 'rgba(30,41,59,0.7)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(239,68,68,0.2)', borderLeft: '4px solid #EF4444',
          }}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-[#EF4444]" />
            <h3 className="font-bold text-white">⚠️ Zona de Riesgo</h3>
            <span style={{
              background: 'rgba(239,68,68,0.15)', color: '#EF4444',
              fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', marginLeft: 'auto',
            }}>
              IA Alerta
            </span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {data.alertas.map((alerta, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px', borderRadius: '8px',
                background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.12)',
              }}>
                <span style={{ fontSize: '13px', color: '#FFF' }}>{alerta.alias}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <TrendingDown style={{ width: '14px', height: '14px' }} /> {alerta.racha}
                </span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '10px' }}>
            🧠 La IA reduce automáticamente los stakes y marca picks como ZONA RIESGO
          </p>
        </div>
      )}

      {/* ============================================================ */}
      {/* RENDIMIENTO GLOBAL — DATOS REALES                              */}
      {/* ============================================================ */}
      <StatsReales variant="full" />

      {/* ============================================================ */}
      {/* 🔥 ALERTAS DE RACHAS (Fase 2-F)                                */}
      {/* ============================================================ */}
      {rachasData.total > 0 && (
        <div className="rounded-2xl p-4 animate-fadeInUp" style={{
          background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8))',
          border: '1px solid rgba(255, 187, 0, 0.15)',
          backdropFilter: 'blur(12px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(255, 187, 0, 0.1)' }}>
                <Flame className="h-5 w-5 text-[#F59E0B]" />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>Alertas de Rachas</h3>
                <p style={{ fontSize: '11px', color: '#94A3B8' }}>
                  {rachasData.alertas.filter((a: any) => a.tipo === 'positiva').length} positivas · {rachasData.alertas.filter((a: any) => a.tipo === 'negativa').length} negativas
                </p>
              </div>
            </div>
            <span style={{
              fontSize: '10px', fontWeight: 700, padding: '3px 10px',
              borderRadius: '8px', background: 'rgba(255, 187, 0, 0.1)',
              color: '#F59E0B', border: '1px solid rgba(255, 187, 0, 0.2)',
            }}>
              {rachasData.total} alerta{rachasData.total > 1 ? 's' : ''}
            </span>
          </div>

          <div style={{ display: 'grid', gap: '8px' }}>
            {rachasData.alertas.slice(0, 6).map((alerta: any, idx: number) => (
              <div key={idx} style={{
                padding: '12px 14px', borderRadius: '10px',
                background: alerta.tipo === 'positiva' ? 'rgba(0, 209, 255, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                borderLeft: `3px solid ${alerta.color || (alerta.tipo === 'positiva' ? '#00D1FF' : '#EF4444')}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                    <span style={{
                      fontSize: '12px', fontWeight: 700,
                      color: alerta.tipo === 'positiva' ? '#00D1FF' : '#EF4444',
                    }}>
                      {alerta.tipster}
                    </span>
                    <span style={{
                      fontSize: '9px', padding: '1px 6px', borderRadius: '4px', fontWeight: 700,
                      background: alerta.tipo === 'positiva' ? 'rgba(0, 209, 255, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: alerta.tipo === 'positiva' ? '#00D1FF' : '#EF4444',
                    }}>
                      {alerta.racha > 0 ? `🔥 W${alerta.racha}` : `⚠️ L${Math.abs(alerta.racha)}`}
                    </span>
                    {alerta.severidad === 'alta' && (
                      <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '4px', fontWeight: 700, background: 'rgba(255, 187, 0, 0.15)', color: '#F59E0B' }}>
                        ¡IMPORTANTE!
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '12px', color: '#94A3B8' }}>{alerta.mensaje}</p>
                </div>
                <div style={{
                  padding: '6px 10px', borderRadius: '8px', flexShrink: 0,
                  background: alerta.tipo === 'positiva' ? 'rgba(0, 209, 255, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                  fontSize: '10px', color: alerta.tipo === 'positiva' ? '#00D1FF' : '#EF4444',
                  fontWeight: 600, textAlign: 'center', maxWidth: '120px',
                }}>
                  {alerta.accion}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* FOOTER                                                        */}
      {/* ============================================================ */}
      <div className="flex items-center justify-between text-xs text-[#64748B] pt-4 border-t border-slate-800/50">
        <span className="font-mono">
          🧠 Neuro🧠Tips IA v{data.iaVersion} · {data.profilesAvailable.length} tipsters perfilados · {iaScores.length} picks analizados hoy
        </span>
        <span className="flex items-center gap-1.5">
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00D1FF', animation: 'livePulse 1.5s infinite' }} />
          IA Activa
        </span>
      </div>

      {/* ============================================================ */}
      {/* TELEGRAM + WHATSAPP                                           */}
      {/* ============================================================ */}
      <div className="grid sm:grid-cols-2 gap-3 mt-4">
        <a href="https://t.me/IaNeuroTips" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:scale-[1.01]"
          style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(14,165,233,0.15)' }}>
            <MessageCircle className="h-5 w-5 text-[#0EA5E9]" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: '#FFF', fontSize: '13px', fontWeight: 700 }}>Canal Telegram</p>
            <p style={{ color: '#0EA5E9', fontSize: '11px' }}>1 pick gratis diario · @IaNeuroTips</p>
          </div>
          <ChevronRight className="h-4 w-4 text-[#0EA5E9] flex-shrink-0" />
        </a>
        <a href="https://wa.me/56978516119?text=Hola%20NeuroTips" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:scale-[1.01]"
          style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(34,197,94,0.15)' }}>
            <Phone className="h-5 w-5 text-[#22C55E]" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: '#FFF', fontSize: '13px', fontWeight: 700 }}>WhatsApp Soporte</p>
            <p style={{ color: '#22C55E', fontSize: '11px' }}>Respuesta en menos de 5 min</p>
          </div>
          <ChevronRight className="h-4 w-4 text-[#22C55E] flex-shrink-0" />
        </a>
      </div>

      {/* Floating WhatsApp */}
      <a href="https://wa.me/56978516119?text=Hola%20NeuroTips" target="_blank" rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
        style={{ background: '#22C55E', boxShadow: '0 4px 20px rgba(34,197,94,0.4)' }}>
        <Phone className="h-6 w-6 text-white" />
      </a>

      {/* ============================================================ */}
      {/* CSS ANIMATIONS                                                */}
      {/* ============================================================ */}
      <style jsx>{`
        @keyframes goldPulse {
          0%, 100% { box-shadow: 0 0 15px rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.4); }
          50% { box-shadow: 0 0 25px rgba(245,158,11,0.25); border-color: rgba(245,158,11,0.7); }
        }
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes pendienteBorder {
          0%, 100% { border-color: rgba(245,158,11,0.2); box-shadow: 0 0 0 rgba(245,158,11,0); }
          50% { border-color: rgba(245,158,11,0.45); box-shadow: 0 0 12px rgba(245,158,11,0.06); }
        }
        @keyframes pendienteProgress {
          0% { width: 30%; opacity: 0.5; }
          50% { width: 70%; opacity: 1; }
          100% { width: 30%; opacity: 0.5; }
        }
        @keyframes iaPulse {
          0%, 100% { box-shadow: 0 0 0 rgba(0,209,255,0); }
          50% { box-shadow: 0 0 12px rgba(0,209,255,0.15); }
        }
        @keyframes liveBorderPulse {
          0%, 100% { border-color: rgba(239,68,68,0.25); box-shadow: 0 0 0 rgba(239,68,68,0); }
          50% { border-color: rgba(239,68,68,0.5); box-shadow: 0 0 15px rgba(239,68,68,0.08); }
        }
      `}</style>
    </div>
  );
}
