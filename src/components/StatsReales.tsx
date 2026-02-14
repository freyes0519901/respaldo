'use client';

/**
 * StatsReales — Estadísticas REALES desde la API v2.1
 * Reemplaza los valores hardcoded (64% WR, 78% WR promedio, +12.3% yield)
 * Consume: GET /api/public/stats-reales
 * 
 * Variants:
 *   - "full": Card completa con grid + comparación IA + protección (dashboard)
 *   - "compact": Una línea horizontal (para sidebars o headers)
 *   - "hero": Números grandes para landing page hero section
 */

import React, { useEffect, useState } from 'react';
import {
  Star, TrendingUp, Target, BarChart3, Award, Loader2,
  Brain, Shield, Activity, CheckCircle, XCircle
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// ============================================================================
// TYPES
// ============================================================================
interface FiltroData {
  total: number;
  ganadas: number;
  perdidas: number;
  win_rate: number;
  roi: number;
}

interface PlatformStats {
  global: {
    total_picks: number;
    ganadas: number;
    perdidas: number;
    pendientes: number;
    win_rate: number;
    roi: number;
    roi_recomendados: number;
    picks_recomendados: number;
    cuota_promedio: number;
  };
  mes_actual: {
    total: number;
    ganadas: number;
    perdidas: number;
    win_rate: number;
    roi: number;
  };
  por_filtro_ia?: Record<string, FiltroData>;
  tipsters_activos: number;
  perfiles_ia: number;
}

interface Props {
  variant?: 'full' | 'compact' | 'hero';
}

// ============================================================================
// HELPERS
// ============================================================================
const wrColor = (wr: number) =>
  wr >= 55 ? '#00D1B2' : wr >= 50 ? '#FFBB00' : '#EF4444';

const roiColor = (roi: number) =>
  roi > 0 ? '#2ED573' : roi === 0 ? '#FFBB00' : '#EF4444';

const roiSign = (roi: number) =>
  roi > 0 ? `+${roi}` : `${roi}`;

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default function StatsReales({ variant = 'full' }: Props) {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/api/public/stats-reales`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.global) {
            setStats(data);
          } else {
            setError(true);
          }
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('StatsReales fetch error:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // ── LOADING ──
  if (loading) {
    return (
      <div className="rounded-2xl p-5 animate-pulse" style={{
        background: 'linear-gradient(135deg, rgba(30,41,59,0.9), rgba(15,23,42,0.9))',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div className="flex items-center justify-center gap-2 py-8">
          <Loader2 className="h-5 w-5 text-[#00D1B2] animate-spin" />
          <span className="text-sm text-[#94A3B8]">Cargando estadísticas...</span>
        </div>
      </div>
    );
  }

  // ── ERROR — No mostrar datos falsos (Regla: transparencia) ──
  if (error || !stats) {
    return (
      <div className="rounded-2xl p-5" style={{
        background: 'linear-gradient(135deg, rgba(30,41,59,0.9), rgba(15,23,42,0.9))',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div className="flex items-center gap-2 mb-3">
          <Star className="h-5 w-5 text-[#FFDD57]" />
          <h3 className="font-bold text-white">Rendimiento Global</h3>
        </div>
        <p style={{ fontSize: '13px', color: '#64748B' }}>
          Conectando con estadísticas en tiempo real...
        </p>
      </div>
    );
  }

  const g = stats.global;
  const m = stats.mes_actual;
  const filtroAprobada = stats.por_filtro_ia?.['APROBADA'];
  const filtroRechazada = stats.por_filtro_ia?.['RECHAZADA'];

  // Rechazados que perdieron (la IA tenía razón)
  const rechazadosPerdidos = filtroRechazada?.perdidas || 0;
  const rechazadosTotal = filtroRechazada?.total || 0;

  // ════════════════════════════════════════════════════════════════
  // VARIANT: Compact (single line — sidebars, headers)
  // ════════════════════════════════════════════════════════════════
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-4 flex-wrap" style={{ fontSize: '12px' }}>
        <span className="flex items-center gap-1">
          <Target className="h-3.5 w-3.5" style={{ color: wrColor(g.win_rate) }} />
          <span className="text-[#94A3B8]">WR:</span>
          <span className="font-bold font-mono" style={{ color: wrColor(g.win_rate) }}>{g.win_rate}%</span>
        </span>
        <span className="flex items-center gap-1">
          <TrendingUp className="h-3.5 w-3.5" style={{ color: roiColor(g.roi_recomendados) }} />
          <span className="text-[#94A3B8]">ROI ✓✓✓:</span>
          <span className="font-bold font-mono" style={{ color: roiColor(g.roi_recomendados) }}>
            {roiSign(g.roi_recomendados)}%
          </span>
        </span>
        <span className="flex items-center gap-1">
          <BarChart3 className="h-3.5 w-3.5 text-[#FFDD57]" />
          <span className="text-[#94A3B8]">Picks:</span>
          <span className="font-bold text-white font-mono">{g.total_picks.toLocaleString()}</span>
        </span>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════
  // VARIANT: Hero (big numbers — landing page)
  // ════════════════════════════════════════════════════════════════
  if (variant === 'hero') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { value: `${g.win_rate}%`, label: 'Win Rate Global', color: wrColor(g.win_rate), icon: Target },
          { value: `${roiSign(g.roi_recomendados)}%`, label: 'ROI Picks ✓✓✓', color: roiColor(g.roi_recomendados), icon: TrendingUp },
          { value: `${g.total_picks.toLocaleString()}+`, label: 'Picks Analizados', color: '#FFDD57', icon: BarChart3 },
          { value: `${stats.tipsters_activos}`, label: 'Tipsters Activos', color: '#818CF8', icon: Award },
        ].map((item, i) => (
          <div key={i} className="text-center">
            <item.icon className="h-5 w-5 mx-auto mb-2" style={{ color: item.color }} />
            <p className="text-2xl sm:text-3xl font-black font-mono" style={{ color: item.color }}>{item.value}</p>
            <p className="text-xs text-[#94A3B8] mt-1">{item.label}</p>
          </div>
        ))}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════
  // VARIANT: Full (dashboard card — replaces hardcoded block)
  // ════════════════════════════════════════════════════════════════
  return (
    <div className="rounded-2xl p-5 animate-fadeInUp"
      style={{
        background: 'linear-gradient(135deg, rgba(30,41,59,0.9) 0%, rgba(15,23,42,0.9) 100%)',
        backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)',
      }}>

      {/* ── Header ── */}
      <div className="flex items-center gap-2 mb-5">
        <Star className="h-5 w-5 text-[#FFDD57]" />
        <h3 className="font-bold text-white">Rendimiento del Mes</h3>
        <span style={{
          fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px',
          background: 'rgba(255,221,87,0.1)', color: '#FFDD57', marginLeft: '4px',
        }}>
          {new Date().toLocaleString('es-CL', { month: 'long' }).toUpperCase()} {new Date().getFullYear()}
        </span>
        <span style={{
          fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px',
          background: 'rgba(0,209,178,0.1)', color: '#00D1B2', marginLeft: 'auto',
          display: 'inline-flex', alignItems: 'center', gap: '3px',
        }}>
          <Activity style={{ width: '10px', height: '10px' }} /> EN VIVO
        </span>
      </div>

      {/* ── Stats Grid — 4 KPIs del MES ACTUAL ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Win Rate del Mes */}
        <div style={{
          textAlign: 'center', padding: '12px', borderRadius: '10px',
          background: 'rgba(0,209,178,0.06)', border: '1px solid rgba(0,209,178,0.12)',
        }}>
          <p style={{
            fontSize: '22px', fontWeight: 900, fontFamily: 'monospace',
            color: wrColor(m.win_rate),
          }}>
            {m.win_rate}%
          </p>
          <p style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>Win Rate Mes</p>
        </div>

        {/* ROI del Mes — Inteligente: si negativo, cambia enfoque */}
        <div style={{
          textAlign: 'center', padding: '12px', borderRadius: '10px',
          background: m.roi >= 0
            ? 'rgba(46,213,115,0.06)' : 'rgba(255,255,255,0.03)',
          border: m.roi >= 0
            ? '1px solid rgba(46,213,115,0.12)' : '1px solid rgba(255,255,255,0.06)',
        }}>
          {m.roi >= 0 ? (
            <>
              <p style={{
                fontSize: '22px', fontWeight: 900, fontFamily: 'monospace',
                color: roiColor(m.roi),
              }}>
                {roiSign(m.roi)}%
              </p>
              <p style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>ROI Mes</p>
            </>
          ) : (
            <>
              <p style={{
                fontSize: '22px', fontWeight: 900, fontFamily: 'monospace',
                color: m.ganadas > m.perdidas ? '#22C55E' : '#F59E0B',
              }}>
                +{m.ganadas - m.perdidas}
              </p>
              <p style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>Balance Neto</p>
              <p style={{ fontSize: '8px', color: '#64748B', marginTop: '1px' }}>ROI en recuperación</p>
            </>
          )}
        </div>

        {/* Picks del Mes */}
        <div style={{
          textAlign: 'center', padding: '12px', borderRadius: '10px',
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <p style={{ fontSize: '22px', fontWeight: 900, fontFamily: 'monospace', color: '#FFF' }}>
            {m.total.toLocaleString()}
          </p>
          <p style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>Picks Resueltos</p>
        </div>

        {/* Record G/P del Mes */}
        <div style={{
          textAlign: 'center', padding: '12px', borderRadius: '10px',
          background: 'rgba(255,221,87,0.06)', border: '1px solid rgba(255,221,87,0.12)',
        }}>
          <p style={{ fontSize: '22px', fontWeight: 900, fontFamily: 'monospace', color: '#FFF' }}>
            <span style={{ color: '#22C55E' }}>{m.ganadas}</span>
            <span style={{ color: '#475569' }}>/</span>
            <span style={{ color: '#EF4444' }}>{m.perdidas}</span>
          </p>
          <p style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>Ganadas / Perdidas</p>
        </div>
      </div>

      {/* ── Barra ROI Certificados del MES ── */}
      <div style={{ marginTop: '12px', padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '11px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Brain style={{ width: '12px', height: '12px', color: '#00D1B2' }} />
            ROI Picks Certificados ✓✓✓ este mes ({g.picks_recomendados} picks)
          </span>
          <span style={{
            fontSize: '11px', fontWeight: 800, fontFamily: 'monospace',
            color: roiColor(g.roi_recomendados),
          }}>
            {roiSign(g.roi_recomendados)}%
          </span>
        </div>
        <div style={{ width: '100%', height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)' }}>
          <div style={{
            width: `${Math.min(100, Math.max(5, Math.abs(g.roi_recomendados)))}%`,
            height: '100%', borderRadius: '3px',
            background: g.roi_recomendados >= 0
              ? 'linear-gradient(90deg, #2ED573, #00D1B2)'
              : 'linear-gradient(90deg, #EF4444, #F97316)',
            boxShadow: g.roi_recomendados >= 0
              ? '0 0 8px rgba(46,213,115,0.35)'
              : '0 0 8px rgba(239,68,68,0.25)',
            transition: 'width 1.2s ease-out',
          }} />
        </div>
        <p style={{ fontSize: '10px', color: '#64748B', marginTop: '6px', textAlign: 'center' }}>
          Sigue solo los picks ✓✓✓ para máximo rendimiento · 1 unidad por pick · Datos del mes en curso
        </p>
      </div>

      {/* ── IA Aprobó vs IA Rechazó — Mes en curso ── */}
      {filtroAprobada && filtroRechazada && (
        <div style={{
          marginTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
        }}>
          {/* Aprobados por IA */}
          <div style={{
            padding: '10px', borderRadius: '10px',
            background: 'rgba(0,209,178,0.04)', border: '1px solid rgba(0,209,178,0.1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
              <CheckCircle style={{ width: '12px', height: '12px', color: '#00D1B2' }} />
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#00D1B2' }}>IA Aprobó</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div>
                <p style={{
                  fontSize: '16px', fontWeight: 900, fontFamily: 'monospace',
                  color: wrColor(filtroAprobada.win_rate),
                }}>
                  {filtroAprobada.win_rate}%
                </p>
                <p style={{ fontSize: '9px', color: '#64748B' }}>WR · {filtroAprobada.total} picks</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{
                  fontSize: '13px', fontWeight: 800, fontFamily: 'monospace',
                  color: roiColor(filtroAprobada.roi),
                }}>
                  {roiSign(filtroAprobada.roi)}%
                </p>
                <p style={{ fontSize: '9px', color: '#64748B' }}>ROI</p>
              </div>
            </div>
          </div>

          {/* Rechazados por IA */}
          <div style={{
            padding: '10px', borderRadius: '10px',
            background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
              <XCircle style={{ width: '12px', height: '12px', color: '#EF4444' }} />
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#EF4444' }}>IA Rechazó</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div>
                <p style={{
                  fontSize: '16px', fontWeight: 900, fontFamily: 'monospace',
                  color: wrColor(filtroRechazada.win_rate),
                }}>
                  {filtroRechazada.win_rate}%
                </p>
                <p style={{ fontSize: '9px', color: '#64748B' }}>WR · {filtroRechazada.total} picks</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{
                  fontSize: '13px', fontWeight: 800, fontFamily: 'monospace',
                  color: roiColor(filtroRechazada.roi),
                }}>
                  {roiSign(filtroRechazada.roi)}%
                </p>
                <p style={{ fontSize: '9px', color: '#64748B' }}>ROI</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Protección IA — "Tu dinero, protegido" este mes ── */}
      {rechazadosPerdidos > 0 && rechazadosTotal > 0 && (
        <div style={{
          marginTop: '10px', padding: '10px 12px', borderRadius: '10px',
          background: 'rgba(0,209,178,0.04)', border: '1px solid rgba(0,209,178,0.1)',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <Shield style={{ width: '16px', height: '16px', color: '#00D1B2', flexShrink: 0 }} />
          <p style={{ fontSize: '11px', color: '#94A3B8' }}>
            Este mes la IA rechazó <strong style={{ color: '#EF4444' }}>{rechazadosTotal} picks</strong> que
            resultaron en <strong style={{ color: '#EF4444' }}>{rechazadosPerdidos} pérdidas</strong>.
            <span style={{ color: '#00D1B2', fontWeight: 700 }}> Tu dinero, protegido.</span>
          </p>
        </div>
      )}

      {/* ── Footer: cuota promedio + tipsters ── */}
      <div style={{
        marginTop: '10px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px',
        padding: '8px 0 0 0', borderTop: '1px solid rgba(255,255,255,0.04)',
      }}>
        <span style={{ fontSize: '10px', color: '#475569' }}>
          Cuota promedio: <strong style={{ color: '#94A3B8', fontFamily: 'monospace' }}>{g.cuota_promedio}</strong>
        </span>
        {g.picks_recomendados > 0 && (
          <span style={{ fontSize: '10px', color: '#475569' }}>
            ✓✓✓ Certificados este mes: <strong style={{ color: '#00D1B2', fontFamily: 'monospace' }}>{g.picks_recomendados}</strong>
          </span>
        )}
        <span style={{ fontSize: '10px', color: '#475569' }}>
          {stats.tipsters_activos}+ tipsters · {g.total_picks} picks históricos
        </span>
      </div>
    </div>
  );
}
