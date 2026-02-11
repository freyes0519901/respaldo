'use client';

/**
 * MonteCarloSimulator — "Future Banca" Dashboard Component
 * 
 * Runs 5,000 Monte Carlo simulations client-side using real platform stats.
 * Shows probability of profit, expected ROI, and max drawdown risk.
 * 
 * Data source: /api/public/stats-reales (por_filtro_ia.APROBADA)
 * Calculation: 100% client-side JavaScript — no extra API calls.
 * 
 * This is the retention hook — users come back to check their projected future.
 */

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { 
  Activity, TrendingUp, Shield, AlertTriangle, 
  ChevronDown, Zap, BarChart3
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://franciscoanalistadeportivo.pythonanywhere.com';

// ============================================================================
// TYPES
// ============================================================================
interface SimulationResult {
  paths: number[][];           // 100 sampled paths for visualization
  probProfit: number;          // % of simulations that end in profit
  medianROI: number;           // P50 ROI
  p10ROI: number;              // P10 ROI (conservative)
  p90ROI: number;              // P90 ROI (optimistic)
  maxDrawdown: number;         // Average max drawdown
  probDrawdown20: number;      // % chance of >20% drawdown
  avgFinalBanca: number;       // Average final banca multiplier
}

interface PlatformStats {
  win_rate: number;
  roi: number;
  cuota_promedio: number;
  total: number;
}

// ============================================================================
// MONTE CARLO ENGINE — 5,000 simulations, seeded PRNG
// ============================================================================
function runMonteCarlo(
  bancaInicial: number,
  meses: number,
  winRate: number,
  avgOdds: number,
  picksPerMonth: number,
  stakePercent: number,
  numSims: number = 5000,
): SimulationResult {
  const totalPicks = meses * picksPerMonth;
  const wr = winRate / 100;
  const finalBancas: number[] = [];
  const maxDrawdowns: number[] = [];
  const samplePaths: number[][] = [];
  const sampleEvery = Math.max(1, Math.floor(numSims / 100)); // Keep 100 paths for viz

  // Simple seeded PRNG (Mulberry32)
  let seed = 42;
  const random = () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };

  for (let sim = 0; sim < numSims; sim++) {
    let banca = bancaInicial;
    let peak = banca;
    let maxDd = 0;
    const path: number[] = [1]; // normalized to 1

    for (let pick = 0; pick < totalPicks; pick++) {
      const stake = banca * (stakePercent / 100);
      if (random() < wr) {
        banca += stake * (avgOdds - 1);
      } else {
        banca -= stake;
      }
      banca = Math.max(banca, 0); // Can't go below zero

      if (banca > peak) peak = banca;
      const dd = peak > 0 ? (peak - banca) / peak : 0;
      if (dd > maxDd) maxDd = dd;

      // Sample at monthly intervals for path visualization
      if ((pick + 1) % picksPerMonth === 0) {
        path.push(banca / bancaInicial);
      }
    }

    finalBancas.push(banca);
    maxDrawdowns.push(maxDd);
    if (sim % sampleEvery === 0) samplePaths.push(path);
  }

  // Sort for percentiles
  const sorted = [...finalBancas].sort((a, b) => a - b);
  const p10Idx = Math.floor(numSims * 0.10);
  const p50Idx = Math.floor(numSims * 0.50);
  const p90Idx = Math.floor(numSims * 0.90);

  const probProfit = finalBancas.filter(b => b > bancaInicial).length / numSims * 100;
  const probDd20 = maxDrawdowns.filter(d => d > 0.20).length / numSims * 100;
  const avgFinal = finalBancas.reduce((a, b) => a + b, 0) / numSims;

  return {
    paths: samplePaths,
    probProfit: Math.round(probProfit),
    medianROI: Math.round((sorted[p50Idx] / bancaInicial - 1) * 100),
    p10ROI: Math.round((sorted[p10Idx] / bancaInicial - 1) * 100),
    p90ROI: Math.round((sorted[p90Idx] / bancaInicial - 1) * 100),
    maxDrawdown: Math.round(maxDrawdowns.reduce((a, b) => a + b, 0) / numSims * 100),
    probDrawdown20: Math.round(probDd20),
    avgFinalBanca: avgFinal,
  };
}

// ============================================================================
// PARTICLE CANVAS — Draws simulation paths as flowing particles
// ============================================================================
function SimulationCanvas({ result, meses, animating }: {
  result: SimulationResult; meses: number; animating: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !result.paths.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const pad = { top: 15, right: 15, bottom: 25, left: 45 };
    const cw = W - pad.left - pad.right;
    const ch = H - pad.top - pad.bottom;

    // Find Y range across all paths
    let minY = Infinity, maxY = -Infinity;
    for (const path of result.paths) {
      for (const v of path) {
        if (v < minY) minY = v;
        if (v > maxY) maxY = v;
      }
    }
    minY = Math.min(minY, 0.7);
    maxY = Math.max(maxY, 1.3);

    const toX = (i: number, total: number) => pad.left + (i / total) * cw;
    const toY = (v: number) => pad.top + ch - ((v - minY) / (maxY - minY)) * ch;

    if (animating) progressRef.current = 0;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= meses; i++) {
        const x = toX(i, meses);
        ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, H - pad.bottom); ctx.stroke();
      }

      // Zero line (banca = 1x)
      const zeroY = toY(1);
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(pad.left, zeroY); ctx.lineTo(W - pad.right, zeroY); ctx.stroke();
      ctx.setLineDash([]);

      // Labels
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillStyle = '#64748B';
      ctx.textAlign = 'right';
      ctx.fillText('Banca', pad.left - 5, zeroY + 3);
      ctx.textAlign = 'center';
      for (let i = 0; i <= meses; i++) {
        ctx.fillText(`M${i}`, toX(i, meses), H - 5);
      }

      // Progress animation
      const progress = Math.min(progressRef.current, 1);
      const visiblePoints = Math.ceil(meses * progress) + 1;

      // Draw paths as particles
      for (let p = 0; p < result.paths.length; p++) {
        const path = result.paths[p];
        const finalVal = path[path.length - 1];
        const isProfit = finalVal >= 1;

        ctx.beginPath();
        ctx.strokeStyle = isProfit
          ? `rgba(0,209,178,${0.04 + (finalVal - 1) * 0.1})`
          : `rgba(239,68,68,${0.04 + (1 - finalVal) * 0.15})`;
        ctx.lineWidth = 1;

        const maxI = Math.min(visiblePoints, path.length);
        for (let i = 0; i < maxI; i++) {
          const x = toX(i, meses);
          const y = toY(path[i]);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // P10, P50, P90 highlight lines
      const percentiles = [
        { values: result.paths.map(p => p.map((_, i) => {
          const vals = result.paths.map(pp => pp[Math.min(i, pp.length - 1)] || 1).sort((a, b) => a - b);
          return vals[Math.floor(vals.length * 0.1)];
        }))[0], color: '#64748B', label: 'P10', dash: [3, 3] },
        { values: result.paths.map(p => p.map((_, i) => {
          const vals = result.paths.map(pp => pp[Math.min(i, pp.length - 1)] || 1).sort((a, b) => a - b);
          return vals[Math.floor(vals.length * 0.5)];
        }))[0], color: '#00D1B2', label: 'P50', dash: [] },
        { values: result.paths.map(p => p.map((_, i) => {
          const vals = result.paths.map(pp => pp[Math.min(i, pp.length - 1)] || 1).sort((a, b) => a - b);
          return vals[Math.floor(vals.length * 0.9)];
        }))[0], color: '#FFBB00', label: 'P90', dash: [3, 3] },
      ];

      for (const pct of percentiles) {
        if (!pct.values) continue;
        ctx.beginPath();
        ctx.strokeStyle = pct.color;
        ctx.lineWidth = 2;
        ctx.setLineDash(pct.dash);
        const maxI = Math.min(visiblePoints, pct.values.length);
        for (let i = 0; i < maxI; i++) {
          const x = toX(i, meses);
          const y = toY(pct.values[i]);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Label at end
        if (maxI > 1) {
          const lastX = toX(maxI - 1, meses);
          const lastY = toY(pct.values[maxI - 1]);
          ctx.font = 'bold 9px JetBrains Mono, monospace';
          ctx.fillStyle = pct.color;
          ctx.textAlign = 'left';
          ctx.fillText(pct.label, lastX + 4, lastY + 3);
        }
      }

      // Animate
      if (progressRef.current < 1) {
        progressRef.current += 0.02;
        frameRef.current = requestAnimationFrame(draw);
      }
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [result, meses, animating]);

  return (
    <canvas ref={canvasRef} className="w-full" style={{ height: 220 }} />
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function MonteCarloSimulator() {
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [bancaInicial, setBancaInicial] = useState(100000);
  const [meses, setMeses] = useState(3);
  const [perfil, setPerfil] = useState<'conservador' | 'moderado' | 'agresivo'>('moderado');
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [animating, setAnimating] = useState(false);
  const [loading, setLoading] = useState(true);

  const stakeMap = { conservador: 1.5, moderado: 3, agresivo: 5 };
  const picksPerMonth = 40; // ~10 picks/week approx

  // Fetch real platform stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const now = new Date();
        const desde = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const res = await fetch(`${API_URL}/api/public/stats-reales?desde=${desde}`);
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        const aprobada = data.por_filtro_ia?.APROBADA;
        if (aprobada) {
          setPlatformStats({
            win_rate: Number(aprobada.win_rate) || 58,
            roi: Number(aprobada.roi) || 10,
            cuota_promedio: Number(data.global?.cuota_promedio) || 1.75,
            total: Number(aprobada.total) || 100,
          });
        } else {
          setPlatformStats({
            win_rate: Number(data.global?.win_rate) || 56,
            roi: Number(data.global?.roi) || 5,
            cuota_promedio: Number(data.global?.cuota_promedio) || 1.75,
            total: Number(data.global?.total_picks) || 100,
          });
        }
      } catch (e) {
        console.error('[MonteCarlo] Error fetching stats:', e);
        setPlatformStats({ win_rate: 58, roi: 10, cuota_promedio: 1.75, total: 500 });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Run simulation when params change
  useEffect(() => {
    if (!platformStats) return;
    const stake = stakeMap[perfil];
    const sim = runMonteCarlo(
      bancaInicial, meses,
      platformStats.win_rate,
      platformStats.cuota_promedio,
      picksPerMonth, stake, 5000
    );
    setResult(sim);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 2500);
  }, [platformStats, bancaInicial, meses, perfil]);

  if (loading || !result) {
    return (
      <div className="rounded-2xl p-6 border border-white/10" style={{ background: 'rgba(30,41,59,0.7)' }}>
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-3 border-[#00D1B2]/30 border-t-[#00D1B2] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const finalBanca = Math.round(result.avgFinalBanca);
  const ganancia = finalBanca - bancaInicial;

  return (
    <div className="rounded-2xl overflow-hidden" style={{
      background: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.8) 100%)',
      border: '1px solid rgba(0,209,178,0.12)',
    }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#00D1B2]" />
            Simulador Monte Carlo
          </h3>
          <div className="text-[10px] text-[#64748B] px-2 py-1 rounded-full" 
            style={{ background: 'rgba(0,209,178,0.08)', border: '1px solid rgba(0,209,178,0.15)' }}>
            5,000 simulaciones
          </div>
        </div>
        <p className="text-[#94A3B8] text-xs mt-1">
          Basado en {platformStats?.total || 0} picks reales (WR: {platformStats?.win_rate}%, Cuota: @{platformStats?.cuota_promedio})
        </p>
      </div>

      {/* Controls */}
      <div className="px-5 py-3 grid grid-cols-3 gap-3">
        {/* Banca */}
        <div>
          <label className="text-[10px] text-[#64748B] uppercase tracking-wider block mb-1">Banca Inicial</label>
          <select value={bancaInicial} onChange={(e) => setBancaInicial(Number(e.target.value))}
            className="w-full bg-[#0F172A] text-white text-sm rounded-lg px-3 py-2 border border-white/10 focus:border-[#00D1B2]/50 focus:outline-none">
            <option value={50000}>$50.000</option>
            <option value={100000}>$100.000</option>
            <option value={200000}>$200.000</option>
            <option value={500000}>$500.000</option>
            <option value={1000000}>$1.000.000</option>
          </select>
        </div>

        {/* Meses */}
        <div>
          <label className="text-[10px] text-[#64748B] uppercase tracking-wider block mb-1">Horizonte</label>
          <select value={meses} onChange={(e) => setMeses(Number(e.target.value))}
            className="w-full bg-[#0F172A] text-white text-sm rounded-lg px-3 py-2 border border-white/10 focus:border-[#00D1B2]/50 focus:outline-none">
            <option value={1}>1 mes</option>
            <option value={3}>3 meses</option>
            <option value={6}>6 meses</option>
            <option value={12}>12 meses</option>
          </select>
        </div>

        {/* Perfil */}
        <div>
          <label className="text-[10px] text-[#64748B] uppercase tracking-wider block mb-1">Stake</label>
          <select value={perfil} onChange={(e) => setPerfil(e.target.value as any)}
            className="w-full bg-[#0F172A] text-white text-sm rounded-lg px-3 py-2 border border-white/10 focus:border-[#00D1B2]/50 focus:outline-none">
            <option value="conservador">1.5% (Seguro)</option>
            <option value="moderado">3% (Kelly)</option>
            <option value="agresivo">5% (Agresivo)</option>
          </select>
        </div>
      </div>

      {/* Canvas */}
      <div className="px-5">
        <SimulationCanvas result={result} meses={meses} animating={animating} />
      </div>

      {/* Results Grid */}
      <div className="px-5 py-4 grid grid-cols-3 gap-3">
        {/* Prob Ganancia */}
        <div className="rounded-xl p-3 text-center" style={{
          background: result.probProfit >= 70 ? 'rgba(0,209,178,0.08)' : 'rgba(255,187,0,0.08)',
          border: `1px solid ${result.probProfit >= 70 ? 'rgba(0,209,178,0.2)' : 'rgba(255,187,0,0.2)'}`,
        }}>
          <div className="text-[10px] text-[#94A3B8] mb-1">Prob. Ganancia</div>
          <div className="text-xl font-bold" style={{ 
            color: result.probProfit >= 70 ? '#00D1B2' : '#FFBB00',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {result.probProfit}%
          </div>
        </div>

        {/* ROI Mediano */}
        <div className="rounded-xl p-3 text-center" style={{
          background: 'rgba(59,130,246,0.08)',
          border: '1px solid rgba(59,130,246,0.2)',
        }}>
          <div className="text-[10px] text-[#94A3B8] mb-1">ROI Mediano</div>
          <div className="text-xl font-bold" style={{ 
            color: result.medianROI >= 0 ? '#3B82F6' : '#EF4444',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {result.medianROI >= 0 ? '+' : ''}{result.medianROI}%
          </div>
        </div>

        {/* Drawdown */}
        <div className="rounded-xl p-3 text-center" style={{
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.15)',
        }}>
          <div className="text-[10px] text-[#94A3B8] mb-1">Riesgo DD&gt;20%</div>
          <div className="text-xl font-bold" style={{ 
            color: result.probDrawdown20 <= 30 ? '#FFBB00' : '#EF4444',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {result.probDrawdown20}%
          </div>
        </div>
      </div>

      {/* Bottom insight */}
      <div className="px-5 pb-4">
        <div className="rounded-xl p-3" style={{ background: 'rgba(0,209,178,0.05)', border: '1px solid rgba(0,209,178,0.1)' }}>
          <div className="flex items-center gap-2 text-xs">
            <Zap className="h-4 w-4 text-[#00D1B2] flex-shrink-0" />
            <span className="text-[#94A3B8]">
              Con <span className="text-[#00D1B2] font-bold">{stakeMap[perfil]}%</span> stake y picks IA, 
              tu banca de <span className="text-white font-medium">${bancaInicial.toLocaleString('es-CL')}</span> tiene 
              <span className="text-[#00D1B2] font-bold"> {result.probProfit}%</span> de probabilidad de crecer en {meses} {meses === 1 ? 'mes' : 'meses'}.
              Rango: <span className="font-mono text-[#64748B]">{result.p10ROI >= 0 ? '+' : ''}{result.p10ROI}%</span> a 
              <span className="font-mono text-[#FFBB00]"> +{result.p90ROI}%</span>
            </span>
          </div>
        </div>
        <p className="text-[9px] text-[#475569] mt-2 text-center">
          Simulación estocástica. Rendimiento pasado no garantiza resultados futuros.
        </p>
      </div>
    </div>
  );
}
