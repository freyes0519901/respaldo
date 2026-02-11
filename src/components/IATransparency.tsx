'use client';

/**
 * IATransparency — Panel completo de transparencia IA vs Tipster
 * 3 tabs: Resumen | Historial | Honestidad
 * Consume: GET /api/public/ia-transparency
 */

import React, { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface TransparencyData {
  por_filtro: Record<string, {
    total: number; ganadas: number; perdidas: number;
    win_rate: number; roi: number;
  }>;
  por_cert_level: Record<string, {
    total: number; ganadas: number; perdidas: number;
    win_rate: number; profit: number; // units (not CLP)
  }>;
  escenarios: Record<string, {
    count: number; emoji: string; label: string; description: string;
  }>;
  total_con_filtro: number;
  beneficio_neto_ia: number;
  historial_mensual: Record<string, Record<string, {
    total: number; ganadas: number; win_rate: number;
  }>>;
  resumen: {
    aprobada_wr: number; rechazada_wr: number;
    diferencia: number; total_analizado: number; mensaje: string;
  };
}

export default function IATransparency() {
  const [data, setData] = useState<TransparencyData | null>(null);
  const [tab, setTab] = useState<'resumen' | 'historial' | 'honestidad'>('resumen');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/public/ia-transparency`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-slate-900/50 rounded-2xl p-6 animate-pulse">
        <div className="h-8 bg-slate-800/50 rounded w-1/3 mb-4" />
        <div className="h-48 bg-slate-800/50 rounded" />
      </div>
    );
  }

  if (!data) return null;

  const tabs = [
    { key: 'resumen' as const, label: '📊 Resumen', emoji: '📊' },
    { key: 'historial' as const, label: '📈 Historial', emoji: '📈' },
    { key: 'honestidad' as const, label: '🔍 Honestidad', emoji: '🔍' },
  ];

  return (
    <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 pb-3">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          🧠 IA vs Tipster — Transparencia Total
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          {data.resumen.total_analizado} picks analizados con resultados verificados
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800/60 px-4">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'text-teal-400 border-b-2 border-teal-400'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {tab === 'resumen' && <TabResumen data={data} />}
        {tab === 'historial' && <TabHistorial data={data} />}
        {tab === 'honestidad' && <TabHonestidad data={data} />}
      </div>
    </div>
  );
}


function TabResumen({ data }: { data: TransparencyData }) {
  const aprobada = data.por_filtro?.APROBADA;
  const rechazada = data.por_filtro?.RECHAZADA;
  const diferencia = data.beneficio_neto_ia;

  return (
    <div className="space-y-6">
      {/* Beneficio neto */}
      <div className="text-center py-4">
        <div className="text-xs text-slate-500 mb-2">BENEFICIO NETO DE LA IA</div>
        <div className={`text-4xl font-black ${diferencia > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {diferencia > 0 ? '+' : ''}{diferencia} pts
        </div>
        <div className="text-sm text-slate-400 mt-2">
          {data.resumen.mensaje}
        </div>
      </div>

      {/* Comparación lado a lado */}
      <div className="grid grid-cols-2 gap-4">
        {aprobada && (
          <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-4 text-center">
            <div className="text-xs text-emerald-400 mb-2">✅ IA APROBÓ</div>
            <div className="text-3xl font-bold text-emerald-400">{aprobada.win_rate}%</div>
            <div className="text-xs text-slate-500 mt-1">WR en {aprobada.total} picks</div>
            <div className={`text-sm mt-2 font-bold ${aprobada.roi >= 0 ? 'text-emerald-300' : 'text-red-400'}`}>
              ROI {aprobada.roi > 0 ? '+' : ''}{aprobada.roi}%
            </div>
          </div>
        )}
        {rechazada && (
          <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-4 text-center">
            <div className="text-xs text-red-400 mb-2">❌ IA RECHAZÓ</div>
            <div className="text-3xl font-bold text-red-400">{rechazada.win_rate}%</div>
            <div className="text-xs text-slate-500 mt-1">WR en {rechazada.total} picks</div>
            <div className={`text-sm mt-2 font-bold ${rechazada.roi >= 0 ? 'text-emerald-300' : 'text-red-400'}`}>
              ROI {rechazada.roi > 0 ? '+' : ''}{rechazada.roi}%
            </div>
          </div>
        )}
      </div>

      {/* Cert levels */}
      {Object.keys(data.por_cert_level).length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-slate-500 font-bold">POR NIVEL DE CERTIFICACIÓN</div>
          {['TRIPLE_CHECK', 'DOUBLE_CHECK', 'SINGLE_CHECK', 'REJECTED'].map(level => {
            const d = data.por_cert_level[level];
            if (!d || !d.total) return null;
            const emojis: Record<string, string> = {
              TRIPLE_CHECK: '✓✓✓', DOUBLE_CHECK: '✓✓', SINGLE_CHECK: '✓', REJECTED: '✗'
            };
            const colors: Record<string, string> = {
              TRIPLE_CHECK: '#2ED573', DOUBLE_CHECK: '#00D1B2', SINGLE_CHECK: '#FFDD57', REJECTED: '#FF4757'
            };
            return (
              <div key={level} className="flex items-center justify-between bg-slate-800/30 rounded-lg px-4 py-2">
                <span className="font-mono font-bold text-sm" style={{ color: colors[level] }}>
                  {emojis[level]}
                </span>
                <span className="text-sm text-slate-300">{d.win_rate}% WR</span>
                <span className="text-xs text-slate-500">{d.total} picks</span>
                <span className={`text-xs font-bold ${parseFloat(String(d.profit)) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  ROI: {parseFloat(String(d.profit)) >= 0 ? '+' : ''}{(parseFloat(String(d.profit)) / parseFloat(String(d.total)) * 100).toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


function TabHistorial({ data }: { data: TransparencyData }) {
  const meses = Object.entries(data.historial_mensual || {}).sort((a, b) => a[0].localeCompare(b[0]));

  if (meses.length === 0) {
    return <p className="text-slate-500 text-sm">Sin datos suficientes para historial mensual.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="text-xs text-slate-500 font-bold mb-2">EVOLUCIÓN MENSUAL — IA APROBADA vs RECHAZADA</div>

      <div className="space-y-3">
        {meses.map(([mes, filtros]) => {
          const aprobada = filtros['APROBADA'];
          const rechazada = filtros['RECHAZADA'] || filtros['REVISAR'];

          return (
            <div key={mes} className="bg-slate-800/30 rounded-lg p-3">
              <div className="text-xs text-slate-500 mb-2 font-bold">{mes}</div>
              <div className="flex gap-4">
                {aprobada && (
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                      <span className="text-xs text-slate-400">Aprobada</span>
                    </div>
                    <div className="text-lg font-bold text-emerald-400">{aprobada.win_rate}%</div>
                    <div className="text-xs text-slate-500">{aprobada.ganadas}/{aprobada.total}</div>
                  </div>
                )}
                {rechazada && (
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-2 h-2 bg-red-400 rounded-full" />
                      <span className="text-xs text-slate-400">Rechazada</span>
                    </div>
                    <div className="text-lg font-bold text-red-400">{rechazada.win_rate}%</div>
                    <div className="text-xs text-slate-500">{rechazada.ganadas}/{rechazada.total}</div>
                  </div>
                )}
                {/* Barra visual */}
                <div className="flex-1 flex items-end">
                  {aprobada && rechazada && (
                    <div className="w-full space-y-1">
                      <div className="h-3 rounded-full bg-slate-700 overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 rounded-full"
                          style={{ width: `${aprobada.win_rate}%` }}
                        />
                      </div>
                      <div className="h-3 rounded-full bg-slate-700 overflow-hidden">
                        <div
                          className="h-full bg-red-400 rounded-full"
                          style={{ width: `${rechazada.win_rate}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


function TabHonestidad({ data }: { data: TransparencyData }) {
  const escenarios = data.escenarios;
  const total = data.total_con_filtro || 1;

  const items = [
    {
      key: 'ia_aprueba_tipster_acierta',
      bg: 'bg-emerald-500/10', border: 'border-emerald-500/20',
      color: 'text-emerald-400', icon: '✓✓',
    },
    {
      key: 'ia_aprueba_tipster_falla',
      bg: 'bg-yellow-500/10', border: 'border-yellow-500/20',
      color: 'text-yellow-400', icon: '✓✗',
    },
    {
      key: 'ia_rechaza_tipster_falla',
      bg: 'bg-teal-500/10', border: 'border-teal-500/20',
      color: 'text-teal-400', icon: '✗✗',
    },
    {
      key: 'ia_rechaza_tipster_acierta',
      bg: 'bg-red-500/10', border: 'border-red-500/20',
      color: 'text-red-400', icon: '✗✓',
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs text-slate-500 font-bold mb-1">HONESTIDAD TOTAL</div>
        <p className="text-sm text-slate-400">
          Mostramos TODOS los escenarios: cuando la IA acertó Y cuando se equivocó.
          Sin ocultar nada.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map(item => {
          const e = escenarios[item.key];
          if (!e) return null;
          const pct = total > 0 ? Math.round(e.count / total * 100) : 0;

          return (
            <div key={item.key} className={`${item.bg} border ${item.border} rounded-xl p-4`}>
              <div className="flex items-start justify-between mb-2">
                <span className={`font-mono font-black text-xl ${item.color}`}>{item.icon}</span>
                <span className={`text-2xl font-black ${item.color}`}>{e.count}</span>
              </div>
              <div className={`text-sm font-medium ${item.color} mb-1`}>{e.label}</div>
              <div className="text-xs text-slate-500">{e.description}</div>
              <div className="mt-3 h-1.5 rounded-full bg-slate-700/50 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: item.color.includes('emerald') ? '#2ED573'
                      : item.color.includes('yellow') ? '#FFDD57'
                      : item.color.includes('teal') ? '#00D1B2'
                      : '#FF4757'
                  }}
                />
              </div>
              <div className="text-xs text-slate-600 mt-1 text-right">{pct}%</div>
            </div>
          );
        })}
      </div>

      {/* Disclosure box */}
      <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4 mt-4">
        <div className="text-xs text-slate-500 font-bold mb-2">⚡ LO QUE OTROS NO TE DICEN</div>
        <ul className="text-sm text-slate-400 space-y-1.5">
          <li>• La IA {escenarios.ia_rechaza_tipster_acierta?.count || 0}x rechazó picks que después acertaron — esos son nuestros errores</li>
          <li>• La IA {escenarios.ia_rechaza_tipster_falla?.count || 0}x rechazó picks que después fallaron — esas veces te protegió</li>
          <li>• Nada se borra. Todo se audita. Todo se publica.</li>
        </ul>
      </div>
    </div>
  );
}
