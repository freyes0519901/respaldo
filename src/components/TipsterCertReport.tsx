'use client';

/**
 * TipsterCertReport — Reporte de certificación completo de un tipster
 * Página pública de inspección: /tipster/[id]/certificacion
 * Consume: GET /api/public/tipster/:id/certificacion
 */

import React, { useEffect, useState } from 'react';
import CertBadge from './CertBadge';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface TipsterReport {
  tipster: { id: number; alias: string; deporte: string };
  certificacion: { nivel: string; tiene_perfil_ia: boolean; total_picks_auditados: number };
  stats: { total: number; ganadas: number; perdidas: number; win_rate: number; roi: number; cuota_promedio: number };
  rachas: { actual: number; mejor_positiva: number; peor_negativa: number };
  por_filtro_ia: Record<string, { total: number; ganadas: number; win_rate: number; roi: number }>;
  por_mercado: Array<{ mercado: string; total: number; ganadas: number; win_rate: number; roi: number }>;
  perfil_ia: { specialty: string | null; golden_rules: string[]; blacklist: string[]; markets: Record<string, { wr: number; rating: string }> };
}

const CERT_NIVELES: Record<string, { emoji: string; label: string; color: string; bg: string }> = {
  ORO: { emoji: '🥇', label: 'Certificación ORO', color: '#FFD700', bg: 'bg-yellow-500/10 border-yellow-500/30' },
  PLATA: { emoji: '🥈', label: 'Certificación PLATA', color: '#C0C0C0', bg: 'bg-slate-400/10 border-slate-400/30' },
  BRONCE: { emoji: '🥉', label: 'Certificación BRONCE', color: '#CD7F32', bg: 'bg-orange-500/10 border-orange-500/30' },
  EN_EVALUACIÓN: { emoji: '🔬', label: 'En Evaluación', color: '#94A3B8', bg: 'bg-slate-500/10 border-slate-500/30' },
};

export default function TipsterCertReport({ tipsterId }: { tipsterId: number }) {
  const [report, setReport] = useState<TipsterReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/api/public/tipster/${tipsterId}/certificacion`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setReport(d);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [tipsterId]);

  if (loading) {
    return <div className="animate-pulse space-y-4 p-6">
      <div className="h-20 bg-slate-800/50 rounded-xl" />
      <div className="h-40 bg-slate-800/50 rounded-xl" />
      <div className="h-32 bg-slate-800/50 rounded-xl" />
    </div>;
  }

  if (error || !report) {
    return <div className="text-red-400 text-center p-8">{error || 'Error cargando reporte'}</div>;
  }

  const { tipster, certificacion, stats, rachas, por_filtro_ia, por_mercado, perfil_ia } = report;
  const certConfig = CERT_NIVELES[certificacion.nivel] || CERT_NIVELES.EN_EVALUACIÓN;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header con certificación */}
      <div className={`${certConfig.bg} border rounded-2xl p-6 text-center`}>
        <div className="text-4xl mb-2">{certConfig.emoji}</div>
        <h1 className="text-xl font-bold text-white">{tipster.alias}</h1>
        <div className="text-sm text-slate-400">{tipster.deporte}</div>
        <div className="mt-3" style={{ color: certConfig.color }}>
          <span className="text-lg font-bold">{certConfig.label}</span>
        </div>
        <div className="text-xs text-slate-500 mt-2">
          {certificacion.total_picks_auditados} picks auditados
          {certificacion.tiene_perfil_ia && ' · Perfil IA activo'}
        </div>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-4 gap-3">
        <StatBox label="Win Rate" value={`${stats.win_rate}%`} color={stats.win_rate >= 55 ? '#00D1B2' : '#FF4757'} />
        <StatBox label="ROI" value={`${stats.roi > 0 ? '+' : ''}${stats.roi}%`} color={stats.roi >= 0 ? '#2ED573' : '#FF4757'} />
        <StatBox label="Record" value={`${stats.ganadas}W·${stats.perdidas}L`} />
        <StatBox label="Cuota Avg" value={`@${stats.cuota_promedio}`} />
      </div>

      {/* Rachas */}
      <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4">
        <div className="text-xs text-slate-500 font-bold mb-3">RACHAS</div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className={`text-xl font-bold ${rachas.actual > 0 ? 'text-emerald-400' : rachas.actual < 0 ? 'text-red-400' : 'text-slate-400'}`}>
              {rachas.actual > 0 ? '+' : ''}{rachas.actual}
            </div>
            <div className="text-xs text-slate-500">Actual</div>
          </div>
          <div>
            <div className="text-xl font-bold text-emerald-400">+{rachas.mejor_positiva}</div>
            <div className="text-xs text-slate-500">Mejor</div>
          </div>
          <div>
            <div className="text-xl font-bold text-red-400">{rachas.peor_negativa}</div>
            <div className="text-xs text-slate-500">Peor</div>
          </div>
        </div>
      </div>

      {/* IA Filter comparison */}
      {Object.keys(por_filtro_ia).length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4">
          <div className="text-xs text-slate-500 font-bold mb-3">🧠 ANÁLISIS IA — APROBADA vs RECHAZADA</div>
          <div className="space-y-2">
            {Object.entries(por_filtro_ia).map(([filtro, data]) => (
              <div key={filtro} className="flex items-center justify-between bg-slate-800/30 rounded-lg px-3 py-2">
                <span className={`text-sm font-medium ${
                  filtro === 'APROBADA' ? 'text-emerald-400' : filtro === 'RECHAZADA' ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  {filtro === 'APROBADA' ? '✅' : filtro === 'RECHAZADA' ? '❌' : '⚠️'} {filtro}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-300">{data.win_rate}% WR</span>
                  <span className={`text-xs font-bold ${data.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {data.roi > 0 ? '+' : ''}{data.roi}% ROI
                  </span>
                  <span className="text-xs text-slate-600">{data.total} picks</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mercados */}
      {por_mercado.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4">
          <div className="text-xs text-slate-500 font-bold mb-3">📈 RENDIMIENTO POR MERCADO</div>
          <div className="space-y-2">
            {por_mercado.map(m => {
              const iaRating = perfil_ia.markets?.[m.mercado]?.rating;
              const blocked = perfil_ia.blacklist?.includes(m.mercado);
              return (
                <div key={m.mercado} className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                  blocked ? 'bg-red-500/5 border border-red-500/10' : 'bg-slate-800/30'
                }`}>
                  <div className="flex items-center gap-2">
                    {blocked && <span className="text-xs text-red-400">🚫</span>}
                    <span className="text-sm text-slate-300">{m.mercado}</span>
                    {iaRating && (
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        iaRating === 'elite' ? 'bg-emerald-500/20 text-emerald-400' :
                        iaRating === 'good' ? 'bg-teal-500/20 text-teal-400' :
                        iaRating === 'blocked' ? 'bg-red-500/20 text-red-400' :
                        'bg-slate-600/20 text-slate-400'
                      }`}>{iaRating}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-300">{m.win_rate}% WR</span>
                    <span className={`text-xs font-bold ${m.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {m.roi > 0 ? '+' : ''}{m.roi}%
                    </span>
                    <span className="text-xs text-slate-600">{m.total}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Golden Rules */}
      {perfil_ia.golden_rules?.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4">
          <div className="text-xs text-slate-500 font-bold mb-3">⭐ REGLAS DE ORO (IA)</div>
          <div className="space-y-1.5">
            {perfil_ia.golden_rules.map((rule, i) => (
              <div key={i} className="text-sm text-slate-300 flex items-start gap-2">
                <span className="text-teal-400 mt-0.5">•</span>
                <span>{rule}</span>
              </div>
            ))}
          </div>
          {perfil_ia.specialty && (
            <div className="mt-3 text-xs text-teal-400">
              Especialidad: {perfil_ia.specialty}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-slate-600 py-4">
        Reporte generado por IA · Datos en tiempo real · Nada se oculta
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-3 text-center">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-lg font-bold" style={{ color: color || '#FFFFFF' }}>{value}</div>
    </div>
  );
}
