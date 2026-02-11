'use client';

/**
 * CombinadaCertificada — Combinada del día con sistema de certificación
 * Reemplaza CombinadaDashboard original para usar cert_level en lugar de solo NeuroScore
 * Consume: GET /api/public/picks-certificados (nuevo) o /api/public/combinada-ia (fallback)
 */

import React, { useEffect, useState } from 'react';
import CertBadge, { CertConfidenceBar } from './CertBadge';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface CertPick {
  id: number;
  tipster: string;
  deporte: string;
  apuesta: string;
  tipo_mercado: string;
  cuota: number;
  hora_partido: string;
  resultado: string;
  neuroscore: number;
  zona: string;
  ev: number;
  cert_level: string;
  cert_emoji: string;
  cert_label: string;
  cert_color: string;
  cert_confidence: number;
}

interface CertData {
  status: string;
  fecha: string;
  total_analizados: number;
  picks: {
    certificados: CertPick[];
    verificados: CertPick[];
    rechazados: CertPick[];
  };
  conteo: { certificados: number; verificados: number; rechazados: number };
  combinada: {
    picks: CertPick[];
    total_picks: number;
    cuota_combinada: number;
    neuroscore_promedio: number;
    todos_certificados: boolean;
  } | null;
}

export default function CombinadaCertificada({ variant = 'dashboard' }: { variant?: 'dashboard' | 'landing' }) {
  const [data, setData] = useState<CertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(variant === 'landing');
  const [showRejected, setShowRejected] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/public/picks-certificados`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-slate-800/50 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-800/50 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!data || data.status === 'waiting') {
    return (
      <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-6 text-center">
        <div className="text-3xl mb-2">⏳</div>
        <div className="text-slate-400 text-sm">Esperando los picks del día...</div>
        <div className="text-xs text-slate-600 mt-1">La IA analizará cada pick cuando sea publicado</div>
      </div>
    );
  }

  const cert = data.picks.certificados;
  const verif = data.picks.verificados;
  const rej = data.picks.rechazados;
  const combinada = data.combinada;

  return (
    <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden">
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/30 transition-colors"
        onClick={() => variant === 'dashboard' && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">🏅</span>
          <div>
            <h3 className="text-sm font-bold text-white">Picks Certificados del Día</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-emerald-400 font-bold">{data.conteo.certificados} certificados</span>
              <span className="text-xs text-slate-600">·</span>
              <span className="text-xs text-slate-500">{data.total_analizados} analizados</span>
            </div>
          </div>
        </div>
        {variant === 'dashboard' && (
          <span className={`text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}>▾</span>
        )}
      </div>

      {/* Combinada automática */}
      {expanded && combinada && (
        <div className="mx-5 mb-4 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border border-teal-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-teal-400">⚡ COMBINADA CERTIFICADA</span>
            <span className="text-xs bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full">
              @{combinada.cuota_combinada.toFixed(2)}
            </span>
          </div>
          <div className="space-y-2">
            {combinada.picks.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <CertBadge level={p.cert_level} size="sm" showLabel={false} />
                  <span className="text-slate-300 truncate">{p.apuesta}</span>
                </div>
                <span className="text-teal-400 font-mono text-xs ml-2">@{p.cuota.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-teal-500/20">
            <span className="text-xs text-slate-500">NS promedio: {combinada.neuroscore_promedio}</span>
            <span className="text-xs text-teal-400 font-bold">
              {combinada.todos_certificados ? '✓✓ Todos certificados' : 'Mix de niveles'}
            </span>
          </div>
        </div>
      )}

      {/* Picks list */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4">
          {/* Certificados (✓✓✓ y ✓✓) */}
          {cert.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-slate-500 font-bold">CERTIFICADOS</div>
              {cert.map(p => <PickRow key={p.id} pick={p} />)}
            </div>
          )}

          {/* Verificados (✓) */}
          {verif.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-slate-500 font-bold">VERIFICADOS</div>
              {verif.map(p => <PickRow key={p.id} pick={p} />)}
            </div>
          )}

          {/* Rechazados (toggle) */}
          {rej.length > 0 && (
            <div>
              <button
                onClick={() => setShowRejected(!showRejected)}
                className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
              >
                {showRejected ? '▾ Ocultar' : '▸ Mostrar'} {rej.length} rechazados
              </button>
              {showRejected && (
                <div className="space-y-2 mt-2 opacity-60">
                  {rej.map(p => <PickRow key={p.id} pick={p} />)}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PickRow({ pick }: { pick: CertPick }) {
  const resultColors: Record<string, string> = {
    GANADA: 'text-emerald-400',
    PERDIDA: 'text-red-400',
    VOID: 'text-slate-400',
    PENDIENTE: 'text-yellow-400',
  };

  return (
    <div className="bg-slate-800/30 border border-slate-700/20 rounded-xl px-4 py-3 flex items-center gap-3">
      {/* Cert badge */}
      <CertBadge level={pick.cert_level} size="sm" showLabel={false} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-white font-medium truncate">{pick.apuesta}</span>
          {pick.resultado !== 'PENDIENTE' && (
            <span className={`text-xs font-bold ${resultColors[pick.resultado] || ''}`}>
              {pick.resultado === 'GANADA' ? '✅' : pick.resultado === 'PERDIDA' ? '❌' : '🔄'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-500">{pick.tipster}</span>
          <span className="text-xs text-slate-700">·</span>
          <span className="text-xs text-slate-600">{pick.tipo_mercado}</span>
          {pick.hora_partido && (
            <>
              <span className="text-xs text-slate-700">·</span>
              <span className="text-xs text-slate-600">{pick.hora_partido}</span>
            </>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="text-right">
        <div className="text-sm font-mono text-teal-400">@{pick.cuota.toFixed(2)}</div>
        <div className="text-xs text-slate-600">NS {pick.neuroscore}</div>
      </div>
    </div>
  );
}
