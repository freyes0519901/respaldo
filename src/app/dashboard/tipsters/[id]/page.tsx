'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, Flame, Snowflake, AlertTriangle,
  TrendingUp, TrendingDown, Brain, Target, Zap,
  Star, Award, ChevronDown, ChevronUp, Calendar,
  BarChart3, Clock, Shield
} from 'lucide-react';
import { tipstersAPI } from '@/lib/api';

// ═══════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════
interface Apuesta {
  id: number;
  fecha: string;
  apuesta: string;
  tipo_mercado: string;
  cuota: number;
  resultado: 'GANADA' | 'PERDIDA' | 'PENDIENTE' | 'NULA';
}

interface TipsterDetalle {
  tipster: { id: number; alias: string; deporte: string };
  estadisticas: {
    total_apuestas: number; ganadas: number; perdidas: number;
    porcentaje_acierto: number; ganancia_total: number;
    racha_actual: number; tipo_racha?: string; mejor_racha: number;
  };
  estrategia: any;
  historial: Apuesta[];
}

interface MarketData {
  mercado: string; total: number; ganadas: number;
  wr: number; yield: number; rating: string;
}

interface OddsZone {
  zona: string; rango: string; total: number; ganadas: number;
  wr: number; yield: number; label: string;
}

interface DayData {
  dia: string; total: number; ganadas: number;
  wr: number; yield: number;
}

interface MonthlyData {
  mes: string; total: number; ganadas: number; balance: number;
}

interface DNAData {
  has_dna: boolean;
  tipster_id: number;
  summary: {
    mejor_mercado: string; peor_mercado: string;
    mejor_dia: string; peor_dia: string;
    mejor_rango_cuota: string; specialty: string;
    estrategia: string; wr_global: number; yield_global: number;
    total_analizadas: number;
    racha_max_positiva: number; racha_max_negativa: number;
  };
  markets: MarketData[];
  odds_zones: OddsZone[];
  days: DayData[];
  monthly: MonthlyData[];
  golden_rules: string[];
}

// ═══════════════════════════════════════════════════
// SECURITY: Sanitize
// ═══════════════════════════════════════════════════
const sanitize = (val: any, maxLen = 200): string => {
  if (val === null || val === undefined) return '';
  return String(val).replace(/[<>"'&]/g, '').slice(0, maxLen);
};

const safeNum = (val: any, fallback = 0): number => {
  const n = Number(val);
  return isNaN(n) ? fallback : n;
};

// ═══════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://franciscoanalistadeportivo.pythonanywhere.com';

const getDeporteIcon = (d: string) => {
  const m: Record<string, string> = {
    'Futbol': '⚽', 'Tenis': '🎾', 'NBA': '🏀', 'Baloncesto': '🏀',
    'Voleibol': '🏐', 'Mixto': '🎯', 'eSports': '🎮', 'Hockey': '🏒', 'Beisbol': '⚾',
    'Multideporte': '🎯',
  };
  return m[d] || '🎯';
};

const calcYield = (hist: Apuesta[]): number => {
  const res = hist.filter(a => a.resultado === 'GANADA' || a.resultado === 'PERDIDA');
  if (res.length === 0) return 0;
  let u = 0;
  res.forEach(a => { u += a.resultado === 'GANADA' ? (safeNum(a.cuota) - 1) : -1; });
  return (u / res.length) * 100;
};

const calcRacha = (hist: Apuesta[]): { racha: number; tipo: 'W' | 'L' } => {
  const res = hist.filter(a => a.resultado === 'GANADA' || a.resultado === 'PERDIDA');
  if (res.length === 0) return { racha: 0, tipo: 'W' };
  let racha = 0;
  const first = res[0]?.resultado;
  for (const a of res) {
    if (a.resultado === first) racha++;
    else break;
  }
  return { racha, tipo: first === 'GANADA' ? 'W' : 'L' };
};

const calcMejorRacha = (hist: Apuesta[]): number => {
  const res = hist.filter(a => a.resultado === 'GANADA' || a.resultado === 'PERDIDA').reverse();
  let best = 0, cur = 0;
  for (const a of res) {
    if (a.resultado === 'GANADA') { cur++; if (cur > best) best = cur; }
    else cur = 0;
  }
  return best;
};

const getNivelConfianza = (wr: number, y: number, total: number): { nivel: string; estrellas: number; color: string } => {
  let pts = 0;
  if (wr >= 70) pts += 30; else if (wr >= 60) pts += 25; else if (wr >= 55) pts += 20; else if (wr >= 50) pts += 15; else pts += 5;
  if (y >= 15) pts += 30; else if (y >= 10) pts += 25; else if (y >= 5) pts += 20; else if (y >= 0) pts += 10;
  if (total >= 50) pts += 20; else if (total >= 30) pts += 15; else if (total >= 20) pts += 10; else pts += 5;
  if (pts >= 70) return { nivel: 'EXCELENTE', estrellas: 5, color: '#00D1B2' };
  if (pts >= 55) return { nivel: 'MUY BUENO', estrellas: 4, color: '#00D1B2' };
  if (pts >= 40) return { nivel: 'BUENO', estrellas: 3, color: '#FFDD57' };
  if (pts >= 25) return { nivel: 'REGULAR', estrellas: 2, color: '#F59E0B' };
  return { nivel: 'EN OBSERVACIÓN', estrellas: 1, color: '#EF4444' };
};

// ═══════════════════════════════════════════════════
// SMALL COMPONENTS
// ═══════════════════════════════════════════════════

// Mini sparkline from real monthly data
const RealSparkline = ({ monthly, yieldVal }: { monthly: MonthlyData[]; yieldVal: number }) => {
  if (monthly.length < 2) return null;
  let acum = 0;
  const pts = monthly.map(m => { acum += m.balance; return acum; });
  const maxY = Math.max(...pts, 0.1);
  const minY = Math.min(...pts, -0.1);
  const range = maxY - minY || 1;
  const w = 100, h = 50, pad = 4;
  const pathD = pts.map((y, i) => {
    const x = pad + (i / (pts.length - 1)) * (w - 2 * pad);
    const yp = h - pad - ((y - minY) / range) * (h - 2 * pad);
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${yp.toFixed(1)}`;
  }).join(' ');
  const isPos = acum >= 0;
  const col = isPos ? '#00D1B2' : '#EF4444';
  return (
    <div className="rounded-xl p-3 border border-white/10" style={{ background: 'rgba(30,41,59,0.7)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[#94A3B8] flex items-center gap-1">
          <BarChart3 className="h-3 w-3" /> Evolución
        </span>
        <span className="text-sm font-bold font-mono" style={{ color: col }}>
          {acum >= 0 ? '+' : ''}{acum.toFixed(2)}u
        </span>
      </div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ height: 60 }}>
        <defs>
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={col} stopOpacity="0.3" />
            <stop offset="100%" stopColor={col} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${pathD} L ${w - pad} ${h} L ${pad} ${h} Z`} fill="url(#sparkGrad)" />
        <path d={pathD} fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {/* Mini rachas below */}
      <div className="flex gap-0.5 mt-1 justify-center">
        {monthly.map((m, i) => (
          <div key={i} className="w-6 h-1.5 rounded-full" style={{
            background: m.balance >= 0 ? '#00D1B2' : '#EF4444',
            opacity: 0.6 + Math.min(Math.abs(m.balance) / 3, 0.4),
          }} title={`${m.mes}: ${m.balance >= 0 ? '+' : ''}${m.balance.toFixed(2)}u`} />
        ))}
      </div>
    </div>
  );
};

// Rating badge for markets
const RatingBadge = ({ rating }: { rating: string }) => {
  const cfg: Record<string, { bg: string; text: string; label: string }> = {
    elite: { bg: 'rgba(0,209,178,0.2)', text: '#00D1B2', label: 'Elite' },
    good: { bg: 'rgba(0,209,178,0.1)', text: '#00D1B2', label: 'Bueno' },
    ok: { bg: 'rgba(148,163,184,0.15)', text: '#94A3B8', label: 'OK' },
    caution: { bg: 'rgba(245,158,11,0.15)', text: '#F59E0B', label: 'Cautela' },
    danger: { bg: 'rgba(239,68,68,0.15)', text: '#EF4444', label: 'Peligro' },
  };
  const c = cfg[rating] || cfg.ok;
  return (
    <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: c.bg, color: c.text }}>
      {c.label}
    </span>
  );
};

// ═══════════════════════════════════════════════════
// DNA SECTION — The brain of the profile
// ═══════════════════════════════════════════════════
const DNASection = ({ dna }: { dna: DNAData }) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const s = dna.summary;

  // Top 3 insights from DNA
  const insights: { emoji: string; text: string; type: 'pos' | 'neg' | 'neutral' }[] = [];
  if (s.mejor_mercado) insights.push({ emoji: '🎯', text: `Mejor mercado: ${sanitize(s.mejor_mercado)}`, type: 'pos' });
  if (s.mejor_dia) insights.push({ emoji: '📅', text: `Mejor día: ${sanitize(s.mejor_dia)}`, type: 'pos' });
  if (s.mejor_rango_cuota) insights.push({ emoji: '💰', text: `Zona óptima: @${sanitize(s.mejor_rango_cuota)}`, type: 'pos' });
  if (s.peor_mercado) insights.push({ emoji: '⚠️', text: `Evitar: ${sanitize(s.peor_mercado)}`, type: 'neg' });
  if (s.peor_dia) insights.push({ emoji: '❌', text: `Peor día: ${sanitize(s.peor_dia)}`, type: 'neg' });

  const toggleSection = (key: string) => setExpanded(expanded === key ? null : key);

  return (
    <div className="space-y-3">
      {/* DNA Header */}
      <div className="rounded-xl p-3 border border-[#00D1FF]/30" style={{
        background: 'linear-gradient(135deg, rgba(0,209,255,0.08), rgba(0,168,107,0.05))',
      }}>
        <div className="flex items-center gap-2 mb-2">
          <Brain className="h-4 w-4 text-[#00D1FF]" />
          <span className="text-white font-bold text-sm">DNA del Tipster</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00D1FF]/20 text-[#00D1FF] font-bold">IA</span>
        </div>
        {/* Quick insights */}
        <div className="space-y-1.5">
          {insights.slice(0, 4).map((ins, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span>{ins.emoji}</span>
              <span className={ins.type === 'pos' ? 'text-[#00D1B2]' : ins.type === 'neg' ? 'text-[#EF4444]' : 'text-[#94A3B8]'}>
                {ins.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Markets Breakdown — Expandable */}
      {dna.markets.length > 0 && (
        <div className="rounded-xl border border-white/10 overflow-hidden" style={{ background: 'rgba(30,41,59,0.7)' }}>
          <button onClick={() => toggleSection('markets')} className="w-full flex items-center justify-between p-3">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              <Target className="h-4 w-4 text-[#00D1FF]" /> Mercados ({dna.markets.length})
            </span>
            {expanded === 'markets' ? <ChevronUp className="h-4 w-4 text-[#64748B]" /> : <ChevronDown className="h-4 w-4 text-[#64748B]" />}
          </button>
          {expanded === 'markets' && (
            <div className="px-3 pb-3 space-y-2">
              {dna.markets.map((m, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-[#0F172A]/50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white font-medium">{sanitize(m.mercado, 30)}</span>
                    <RatingBadge rating={m.rating} />
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-[#94A3B8]">{m.total}ap</span>
                    <span className={m.wr >= 60 ? 'text-[#00D1B2]' : m.wr >= 50 ? 'text-[#FFDD57]' : 'text-[#EF4444]'}>
                      {m.wr}%
                    </span>
                    <span className={m.yield >= 0 ? 'text-[#00D1B2]' : 'text-[#EF4444]'}>
                      {m.yield >= 0 ? '+' : ''}{m.yield}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Odds Zones — Expandable */}
      {dna.odds_zones.length > 0 && (
        <div className="rounded-xl border border-white/10 overflow-hidden" style={{ background: 'rgba(30,41,59,0.7)' }}>
          <button onClick={() => toggleSection('odds')} className="w-full flex items-center justify-between p-3">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#FFDD57]" /> Zonas de Cuota ({dna.odds_zones.length})
            </span>
            {expanded === 'odds' ? <ChevronUp className="h-4 w-4 text-[#64748B]" /> : <ChevronDown className="h-4 w-4 text-[#64748B]" />}
          </button>
          {expanded === 'odds' && (
            <div className="px-3 pb-3 space-y-2">
              {dna.odds_zones.map((oz, i) => {
                const labelColor = oz.label === 'ZONA ORO' ? '#00D1B2' : oz.label === 'BUENA' ? '#3B82F6' : oz.label === 'PELIGRO' ? '#EF4444' : '#94A3B8';
                return (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-[#0F172A]/50">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white font-mono">@{sanitize(oz.rango)}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: labelColor, background: `${labelColor}20` }}>
                        {oz.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="text-[#94A3B8]">{oz.ganadas}/{oz.total}</span>
                      <span style={{ color: labelColor }}>{oz.wr}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Days — Expandable */}
      {dna.days.length > 0 && (
        <div className="rounded-xl border border-white/10 overflow-hidden" style={{ background: 'rgba(30,41,59,0.7)' }}>
          <button onClick={() => toggleSection('days')} className="w-full flex items-center justify-between p-3">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#A78BFA]" /> Días ({dna.days.length})
            </span>
            {expanded === 'days' ? <ChevronUp className="h-4 w-4 text-[#64748B]" /> : <ChevronDown className="h-4 w-4 text-[#64748B]" />}
          </button>
          {expanded === 'days' && (
            <div className="px-3 pb-3 space-y-2">
              {dna.days.map((d, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-[#0F172A]/50">
                  <span className="text-xs text-white font-medium">{sanitize(d.dia)}</span>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-[#94A3B8]">{d.ganadas}/{d.total}</span>
                    <span className={d.wr >= 60 ? 'text-[#00D1B2]' : d.wr >= 50 ? 'text-[#FFDD57]' : 'text-[#EF4444]'}>
                      {d.wr}%
                    </span>
                    <span className={d.yield >= 0 ? 'text-[#00D1B2]' : 'text-[#EF4444]'}>
                      {d.yield >= 0 ? '+' : ''}{d.yield}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Golden Rules */}
      {dna.golden_rules.length > 0 && (
        <div className="rounded-xl p-3 border border-[#FFDD57]/20" style={{ background: 'rgba(255,221,87,0.05)' }}>
          <span className="text-xs font-bold text-[#FFDD57] flex items-center gap-1 mb-2">
            <Award className="h-3 w-3" /> Reglas de Oro
          </span>
          <div className="space-y-1">
            {dna.golden_rules.map((r, i) => (
              <p key={i} className="text-xs text-[#94A3B8]">• {sanitize(r, 150)}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════
// CONFIDENCE + COMPARISON SECTION (compact)
// ═══════════════════════════════════════════════════
const StatsGrid = ({ winRate, yieldVal, totalApuestas, mejorRacha }: {
  winRate: number; yieldVal: number; totalApuestas: number; mejorRacha: number;
}) => {
  const conf = getNivelConfianza(winRate, yieldVal, totalApuestas);

  // Vs inversiones — real calculation
  const bankYield = 0.4;
  const multiplier = yieldVal > 0 ? Math.round(yieldVal / bankYield) : 0;

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Nivel de Confianza */}
      <div className="rounded-xl p-3 border border-white/10" style={{ background: 'rgba(30,41,59,0.7)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[#94A3B8] flex items-center gap-1">
            <Shield className="h-3 w-3" /> Confianza
          </span>
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`h-3 w-3 ${i < conf.estrellas ? 'text-[#FFDD57] fill-[#FFDD57]' : 'text-[#334155]'}`} />
            ))}
          </div>
        </div>
        <p className="text-center text-sm font-bold px-2 py-1 rounded-lg" style={{ color: conf.color, background: `${conf.color}20` }}>
          {conf.nivel}
        </p>
        <div className="grid grid-cols-2 gap-1 mt-2">
          <div className="bg-[#0F172A]/50 rounded p-1.5 text-center">
            <p className="text-xs font-bold text-white">{totalApuestas}</p>
            <p className="text-[9px] text-[#64748B]">Apuestas</p>
          </div>
          <div className="bg-[#0F172A]/50 rounded p-1.5 text-center">
            <p className="text-xs font-bold text-[#FFDD57]">+{mejorRacha}</p>
            <p className="text-[9px] text-[#64748B]">Mejor racha</p>
          </div>
        </div>
      </div>

      {/* vs Inversiones — solo si yield > 0 */}
      {yieldVal > 3 ? (
        <div className="rounded-xl p-3 border border-white/10" style={{ background: 'rgba(30,41,59,0.7)' }}>
          <span className="text-xs text-[#94A3B8] flex items-center gap-1 mb-2">
            <TrendingUp className="h-3 w-3" /> vs Inversiones
          </span>
          <div className="space-y-1.5 text-xs">
            {[
              { n: 'Banco', v: 0.4 },
              { n: 'Fondos', v: 1.2 },
              { n: 'Acciones', v: 2.5 },
            ].map((item, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-[#64748B]">{item.n}</span>
                <span className="text-white font-mono">+{item.v}%</span>
              </div>
            ))}
            <div className="flex justify-between pt-1.5 border-t border-white/10">
              <span className="text-[#00D1B2] font-bold">Tipster</span>
              <span className="text-[#00D1B2] font-bold font-mono">+{yieldVal.toFixed(1)}%</span>
            </div>
          </div>
          {multiplier > 1 && (
            <p className="text-center text-[10px] text-[#00D1B2] font-bold mt-2">
              {multiplier}x mejor que el banco
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-xl p-3 border border-white/10 flex flex-col items-center justify-center" style={{ background: 'rgba(30,41,59,0.7)' }}>
          <p className={`text-2xl font-bold font-mono ${yieldVal >= 0 ? 'text-[#00D1B2]' : 'text-[#EF4444]'}`}>
            {yieldVal >= 0 ? '+' : ''}{yieldVal.toFixed(1)}%
          </p>
          <p className="text-xs text-[#64748B]">Yield</p>
          <p className={`text-xs mt-1 ${yieldVal >= 0 ? 'text-[#94A3B8]' : 'text-[#EF4444]'}`}>
            {yieldVal >= 5 ? 'Rentable' : yieldVal >= 0 ? 'Break-even' : 'En pérdida'}
          </p>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════
// SMART CONSEJO (DNA-based, not hardcoded)
// ═══════════════════════════════════════════════════
const SmartConsejo = ({ winRate, yieldVal, racha, total, dna }: {
  winRate: number; yieldVal: number; racha: { racha: number; tipo: 'W' | 'L' }; total: number; dna: DNAData | null;
}) => {
  let mensaje = '';
  let tipo: 'pos' | 'neg' | 'neutral' = 'neutral';
  let emoji = '📊';

  // Priority-based smart advice
  if (racha.tipo === 'W' && racha.racha >= 5) {
    mensaje = `Racha caliente +${racha.racha}. Momento óptimo para seguir.`;
    tipo = 'pos'; emoji = '🔥';
  } else if (racha.tipo === 'L' && racha.racha >= 4) {
    mensaje = `Racha fría -${racha.racha}. Considera reducir stake o esperar.`;
    tipo = 'neg'; emoji = '❄️';
  } else if (dna?.has_dna && dna.summary.mejor_mercado) {
    const bestM = sanitize(dna.summary.mejor_mercado, 30);
    const bestD = sanitize(dna.summary.mejor_dia, 15);
    if (yieldVal >= 10) {
      mensaje = `Rendimiento elite. Especialista en ${bestM}${bestD ? `, mejor los ${bestD}` : ''}.`;
      tipo = 'pos'; emoji = '⭐';
    } else if (yieldVal >= 5) {
      mensaje = `Rentable y consistente. Prioriza sus picks en ${bestM}.`;
      tipo = 'pos'; emoji = '✅';
    } else if (yieldVal >= 0) {
      mensaje = `Break-even. Sigue solo en ${bestM} donde tiene ventaja real.`;
      tipo = 'neutral'; emoji = '📊';
    } else {
      mensaje = `Yield negativo. ${dna.summary.peor_mercado ? `Evitar ${sanitize(dna.summary.peor_mercado, 20)}.` : 'Analiza con precaución.'}`;
      tipo = 'neg'; emoji = '⚠️';
    }
  } else if (yieldVal >= 15 && total >= 30) {
    mensaje = 'Rendimiento excepcional sostenido. Uno de los mejores.';
    tipo = 'pos'; emoji = '⭐';
  } else if (yieldVal >= 5) {
    mensaje = 'Rentable. Buen balance efectividad-rentabilidad.';
    tipo = 'pos'; emoji = '✅';
  } else if (total < 20) {
    mensaje = 'Muestra pequeña. Espera más apuestas para evaluar.';
    tipo = 'neutral'; emoji = '📈';
  } else if (yieldVal < 0) {
    mensaje = 'Yield negativo. Analiza bien antes de seguir.';
    tipo = 'neg'; emoji = '⚠️';
  } else {
    mensaje = 'Rendimiento dentro del promedio esperado.';
    tipo = 'neutral'; emoji = '📊';
  }

  const borderColor = tipo === 'pos' ? '#00D1B2' : tipo === 'neg' ? '#F59E0B' : '#3B82F6';

  return (
    <div className="rounded-xl p-3 border" style={{
      background: `linear-gradient(135deg, ${borderColor}10, transparent)`,
      borderColor: `${borderColor}40`,
    }}>
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4" style={{ color: borderColor }} />
        <span className="text-xs text-[#94A3B8]">Consejo IA</span>
      </div>
      <p className="text-sm text-white mt-1">{emoji} {mensaje}</p>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// HISTORIAL COMPACTO (expandable rows)
// ═══════════════════════════════════════════════════
const HistorialCompacto = ({ historial }: { historial: Apuesta[] }) => {
  const [filtro, setFiltro] = useState<'todas' | 'ganada' | 'perdida'>('todas');
  const [showAll, setShowAll] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtradas = historial.filter(a => {
    if (filtro === 'ganada') return a.resultado === 'GANADA';
    if (filtro === 'perdida') return a.resultado === 'PERDIDA';
    return true;
  });

  const visible = showAll ? filtradas : filtradas.slice(0, 10);

  // Rachas visuales
  const ultimas = historial.filter(a => a.resultado === 'GANADA' || a.resultado === 'PERDIDA').slice(0, 12);

  return (
    <div className="rounded-xl border border-white/10 overflow-hidden" style={{ background: 'rgba(30,41,59,0.7)' }}>
      {/* Header + filters */}
      <div className="p-3 flex items-center justify-between">
        <span className="text-sm font-bold text-white flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#00D1B2]" /> Historial
        </span>
        <div className="flex gap-1">
          {(['todas', 'ganada', 'perdida'] as const).map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className="px-2 py-1 rounded text-[10px] font-bold transition-all"
              style={{
                background: filtro === f
                  ? (f === 'ganada' ? '#00D1B2' : f === 'perdida' ? '#EF4444' : '#00D1FF')
                  : 'rgba(51,65,85,0.5)',
                color: filtro === f ? '#0F172A' : '#94A3B8',
              }}>
              {f === 'todas' ? 'Todas' : f === 'ganada' ? '✓' : '✗'}
            </button>
          ))}
        </div>
      </div>

      {/* Rachas mini */}
      <div className="flex gap-0.5 px-3 pb-2">
        {ultimas.map((a, i) => (
          <div key={i} className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold"
            style={{
              background: a.resultado === 'GANADA' ? 'rgba(0,209,178,0.2)' : 'rgba(239,68,68,0.2)',
              color: a.resultado === 'GANADA' ? '#00D1B2' : '#EF4444',
            }}>
            {a.resultado === 'GANADA' ? '✓' : '✗'}
          </div>
        ))}
      </div>

      {/* Rows */}
      <div className="divide-y divide-white/5">
        {visible.map((a, i) => (
          <div key={a.id || i}>
            <button onClick={() => setExpandedId(expandedId === (a.id || i) ? null : (a.id || i))}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-all text-left">
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-xs text-white truncate">{sanitize(a.apuesta, 80)}</p>
                <p className="text-[10px] text-[#64748B]">{sanitize(a.fecha)} • {sanitize(a.tipo_mercado || 'N/A', 20)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-mono text-white">@{safeNum(a.cuota).toFixed(2)}</span>
                <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                  a.resultado === 'GANADA' ? 'bg-[#00D1B2]/20 text-[#00D1B2]' :
                  a.resultado === 'PERDIDA' ? 'bg-[#EF4444]/20 text-[#EF4444]' :
                  'bg-[#FFDD57]/20 text-[#FFDD57]'
                }`}>
                  {a.resultado === 'GANADA' ? '✓' : a.resultado === 'PERDIDA' ? '✗' : '⏳'}
                </span>
              </div>
            </button>
            {/* Expanded detail */}
            {expandedId === (a.id || i) && (
              <div className="px-3 pb-2 space-y-1 bg-[#0F172A]/30">
                <p className="text-xs text-[#94A3B8]">{sanitize(a.apuesta, 200)}</p>
                <div className="flex gap-3 text-[10px] text-[#64748B]">
                  <span>Mercado: {sanitize(a.tipo_mercado || 'N/A')}</span>
                  <span>Cuota: @{safeNum(a.cuota).toFixed(2)}</span>
                  {a.resultado === 'GANADA' && (
                    <span className="text-[#00D1B2]">+{(safeNum(a.cuota) - 1).toFixed(2)}u</span>
                  )}
                  {a.resultado === 'PERDIDA' && (
                    <span className="text-[#EF4444]">-1.00u</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Show more */}
      {filtradas.length > 10 && !showAll && (
        <button onClick={() => setShowAll(true)}
          className="w-full py-2 text-center text-xs text-[#00D1B2] font-medium hover:bg-white/5 transition-all">
          Ver todas ({filtradas.length})
        </button>
      )}
      {filtradas.length === 0 && (
        <p className="text-center text-[#64748B] text-xs py-4">Sin apuestas</p>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════
export default function TipsterDetallePage() {
  const params = useParams();
  const tipsterId = parseInt(params.id as string);
  const [data, setData] = useState<TipsterDetalle | null>(null);
  const [dna, setDna] = useState<DNAData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const response = await tipstersAPI.getById(tipsterId);
        if (response) {
          setData({
            tipster: response.tipster,
            estadisticas: response.estadisticas,
            estrategia: response.estrategia,
            historial: (response.historial || []).map((h: any) => ({
              id: h.id, fecha: h.fecha, apuesta: h.apuesta,
              tipo_mercado: h.tipo_mercado, cuota: h.cuota, resultado: h.resultado,
            }))
          });
        } else {
          setError('No se pudo cargar el tipster');
        }
      } catch (err) {
        setError('Inicia sesión para ver los detalles');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchDNA = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) return;
        const res = await fetch(`${API_URL}/api/tipster-dna/${tipsterId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (res.ok) {
          const d = await res.json();
          if (d.has_dna) setDna(d);
        }
      } catch (e) {
        // Graceful degradation — page works without DNA
      }
    };

    fetchData();
    fetchDNA();
  }, [tipsterId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-[#00D1B2]/30 border-t-[#00D1B2] rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="h-12 w-12 text-[#F59E0B] mx-auto mb-4" />
        <p className="text-[#94A3B8] mb-4">{error || 'Tipster no encontrado'}</p>
        <Link href="/dashboard/tipsters" className="text-[#00D1B2] hover:underline text-sm">← Volver a Tipsters</Link>
      </div>
    );
  }

  const { tipster, estadisticas, historial } = data;
  const yieldVal = calcYield(historial);
  const rachaInfo = calcRacha(historial);
  const mejorRacha = calcMejorRacha(historial);
  const totalRes = historial.filter(a => a.resultado === 'GANADA' || a.resultado === 'PERDIDA').length;
  const winRate = totalRes > 0 ? (estadisticas.ganadas / totalRes) * 100 : 0;
  const isRentable = yieldVal > 0;

  return (
    <div className="space-y-3 animate-fadeIn pb-20 lg:pb-6 max-w-2xl mx-auto">
      {/* Header compacto */}
      <div className="flex items-center gap-2">
        <Link href="/dashboard/tipsters" className="p-1.5 rounded-lg hover:bg-white/10 transition-all">
          <ChevronLeft className="h-5 w-5 text-[#94A3B8]" />
        </Link>
        <h1 className="text-lg font-bold text-white">Detalle del Tipster</h1>
      </div>

      {/* Card principal: Info + KPIs */}
      <div className="rounded-xl p-3 border border-white/10" style={{ background: 'rgba(30,41,59,0.7)' }}>
        {/* Tipster info */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
              style={{ background: 'linear-gradient(135deg,#1E293B,#334155)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {getDeporteIcon(sanitize(tipster.deporte))}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{sanitize(tipster.alias, 25)}</h2>
              <p className="text-xs text-[#94A3B8]">{sanitize(tipster.deporte)}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {isRentable && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00D1B2]/20 text-[#00D1B2] border border-[#00D1B2]/30">
                Rentable
              </span>
            )}
            {rachaInfo.tipo === 'W' && rachaInfo.racha >= 3 && (
              <span className="flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFDD57]/20 text-[#FFDD57]">
                <Flame className="h-3 w-3" />W{rachaInfo.racha}
              </span>
            )}
            {rachaInfo.tipo === 'L' && rachaInfo.racha >= 3 && (
              <span className="flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-[#EF4444]/20 text-[#EF4444]">
                <Snowflake className="h-3 w-3" />L{rachaInfo.racha}
              </span>
            )}
          </div>
        </div>

        {/* 3 KPIs compactos */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-lg bg-[#0F172A]/50">
            <p className={`text-xl font-bold font-mono ${winRate >= 60 ? 'text-[#00D1B2]' : winRate >= 50 ? 'text-[#FFDD57]' : 'text-[#EF4444]'}`}>
              {winRate.toFixed(1)}%
            </p>
            <p className="text-[10px] text-[#64748B]">Efectividad</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-[#0F172A]/50">
            <p className="text-lg font-bold font-mono">
              <span className="text-[#00D1B2]">{estadisticas.ganadas || 0}</span>
              <span className="text-[#64748B] text-sm">-</span>
              <span className="text-[#EF4444]">{estadisticas.perdidas || 0}</span>
            </p>
            <p className="text-[10px] text-[#64748B]">W-L</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-[#0F172A]/50">
            <p className={`text-xl font-bold font-mono ${yieldVal >= 0 ? 'text-[#00D1B2]' : 'text-[#EF4444]'}`}>
              {yieldVal >= 0 ? '+' : ''}{yieldVal.toFixed(1)}%
            </p>
            <p className="text-[10px] text-[#64748B]">Yield</p>
          </div>
        </div>
      </div>

      {/* Racha alert (si >= 3) */}
      {rachaInfo.racha >= 3 && (
        <div className={`rounded-xl p-2.5 border ${
          rachaInfo.tipo === 'W'
            ? 'bg-gradient-to-r from-[#00D1B2]/10 to-transparent border-[#00D1B2]/30'
            : 'bg-gradient-to-r from-[#EF4444]/10 to-transparent border-[#EF4444]/30'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {rachaInfo.tipo === 'W' ? <Flame className="h-4 w-4 text-[#FFDD57]" /> : <Snowflake className="h-4 w-4 text-[#3B82F6]" />}
              <span className={`text-sm font-bold ${rachaInfo.tipo === 'W' ? 'text-[#00D1B2]' : 'text-[#EF4444]'}`}>
                {rachaInfo.tipo === 'W'
                  ? (rachaInfo.racha >= 5 ? '¡En fuego!' : '¡Buena racha!')
                  : (rachaInfo.racha >= 5 ? 'Precaución' : 'Racha fría')}
              </span>
            </div>
            <span className={`text-lg font-bold font-mono ${rachaInfo.tipo === 'W' ? 'text-[#00D1B2]' : 'text-[#EF4444]'}`}>
              {rachaInfo.tipo === 'W' ? '+' : '-'}{rachaInfo.racha}
            </span>
          </div>
        </div>
      )}

      {/* Smart Consejo IA */}
      <SmartConsejo winRate={winRate} yieldVal={yieldVal} racha={rachaInfo} total={totalRes} dna={dna} />

      {/* DNA Section — el corazón de la nueva página */}
      {dna?.has_dna && <DNASection dna={dna} />}

      {/* Stats: Confianza + vs Inversiones */}
      <StatsGrid winRate={winRate} yieldVal={yieldVal} totalApuestas={totalRes} mejorRacha={mejorRacha} />

      {/* Evolución real (monthly sparkline) */}
      {dna?.monthly && dna.monthly.length >= 2 && (
        <RealSparkline monthly={dna.monthly} yieldVal={yieldVal} />
      )}

      {/* Historial compacto */}
      <HistorialCompacto historial={historial} />
    </div>
  );
}
