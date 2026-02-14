'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users, Search, TrendingUp, TrendingDown, Flame, Snowflake,
  ChevronRight
} from 'lucide-react';
import { tipstersAPI } from '@/lib/api';

// ═══════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════
interface Tipster {
  id: number;
  alias: string;
  deporte: string;
  total_apuestas: number;
  ganadas: number;
  perdidas: number;
  porcentaje_acierto: number;
  ganancia_total: number;
  yield?: number;
  racha_actual?: number;
  tipo_racha?: string;
}

// ═══════════════════════════════════════════════════
// SECURITY
// ═══════════════════════════════════════════════════
const sanitize = (val: any, maxLen = 100): string => {
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

const DEPORTE_ICONS: Record<string, string> = {
  'Futbol': '⚽', 'Tenis': '🎾', 'NBA': '🏀', 'Baloncesto': '🏀',
  'Voleibol': '🏐', 'Mixto': '🎯', 'eSports': '🎮', 'Hockey': '🏒',
  'Beisbol': '⚾', 'Multideporte': '🎯',
};

// Normaliza nombres inconsistentes de la DB
const normalizeDeporte = (d: string): string => {
  const raw = (d || '').trim();
  const lower = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (lower.includes('futbol') || lower.includes('football') || lower.includes('soccer')) return 'Futbol';
  if (lower.includes('tenis') || lower.includes('tennis')) return 'Tenis';
  if (lower.includes('basket') || lower.includes('nba') || lower.includes('baloncesto')) return 'NBA';
  if (lower.includes('voleibol') || lower.includes('volleyball') || lower.includes('voley')) return 'Voleibol';
  if (lower.includes('esport') || lower.includes('gaming')) return 'eSports';
  if (lower.includes('hockey')) return 'Hockey';
  if (lower.includes('beisbol') || lower.includes('baseball') || lower.includes('mlb')) return 'Beisbol';
  if (lower.includes('multi')) return 'Mixto';
  if (lower === 'mixto') return 'Mixto';
  return raw;
};

const getDeporteIcon = (d: string) => DEPORTE_ICONS[d] || DEPORTE_ICONS[normalizeDeporte(d)] || '🎯';

// ═══════════════════════════════════════════════════
// COMPACT TIPSTER ROW
// ═══════════════════════════════════════════════════
const TipsterRow = ({ tipster, rank }: { tipster: Tipster; rank: number }) => {
  const yieldVal = safeNum(tipster.yield);
  const isRentable = yieldVal > 0;
  const racha = safeNum(tipster.racha_actual);
  const isHotW = racha >= 3 && tipster.tipo_racha === 'W';
  const isColdL = racha >= 3 && tipster.tipo_racha === 'L';
  const wr = safeNum(tipster.porcentaje_acierto);

  // Yield bar width (max 40% yield = 100% bar)
  const yieldBarPct = Math.min(Math.abs(yieldVal) / 40 * 100, 100);

  return (
    <Link href={`/dashboard/tipsters/${tipster.id}`} className="block group">
      <div className="flex items-center gap-3 p-3 rounded-xl border border-white/5 hover:border-[#00D1B2]/30 transition-all hover:bg-white/[0.02]"
        style={{ background: 'rgba(30,41,59,0.5)' }}>

        {/* Rank */}
        <div className="w-7 text-center shrink-0">
          {rank <= 3 ? (
            <span className="text-lg">{rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}</span>
          ) : (
            <span className="text-xs text-[#64748B] font-mono">#{rank}</span>
          )}
        </div>

        {/* Icon + Name + Deporte */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{getDeporteIcon(sanitize(tipster.deporte))}</span>
            <span className="text-sm font-bold text-white truncate group-hover:text-[#00D1B2] transition-colors">
              {sanitize(tipster.alias, 25)}
            </span>
            {/* Badges */}
            {isRentable && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#00D1B2]/15 text-[#00D1B2] shrink-0">
                Rent
              </span>
            )}
            {isHotW && (
              <span className="flex items-center gap-0.5 text-[9px] font-bold text-[#FFDD57] shrink-0">
                <Flame className="h-3 w-3" />W{racha}
              </span>
            )}
            {isColdL && (
              <span className="flex items-center gap-0.5 text-[9px] font-bold text-[#EF4444] shrink-0">
                <Snowflake className="h-3 w-3" />L{racha}
              </span>
            )}
          </div>
          {/* Stats line */}
          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#64748B]">
            <span>{sanitize(tipster.deporte)}</span>
            <span>•</span>
            <span className={wr >= 60 ? 'text-[#00D1B2]' : wr >= 50 ? 'text-[#FFDD57]' : 'text-[#EF4444]'}>
              {wr.toFixed(1)}% WR
            </span>
            <span>•</span>
            <span className="text-white">{safeNum(tipster.ganadas)}W {safeNum(tipster.perdidas)}L</span>
            <span>•</span>
            <span>{safeNum(tipster.total_apuestas)} ap</span>
          </div>
        </div>

        {/* Yield + Arrow */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <div className={`flex items-center gap-0.5 text-sm font-bold font-mono ${isRentable ? 'text-[#00D1B2]' : 'text-[#EF4444]'}`}>
              {isRentable ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {yieldVal >= 0 ? '+' : ''}{yieldVal.toFixed(1)}%
            </div>
            {/* Mini yield bar */}
            <div className="w-16 h-1 rounded-full bg-[#1E293B] mt-0.5">
              <div className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${yieldBarPct}%`,
                  background: isRentable ? '#00D1B2' : '#EF4444',
                }} />
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-[#334155] group-hover:text-[#00D1B2] transition-colors" />
        </div>
      </div>
    </Link>
  );
};

// ═══════════════════════════════════════════════════
// TOP 3 PODIUM (compact)
// ═══════════════════════════════════════════════════
const TopPodium = ({ tipsters }: { tipsters: Tipster[] }) => {
  if (tipsters.length < 3) return null;
  const top3 = tipsters.slice(0, 3);

  return (
    <div className="grid grid-cols-3 gap-2">
      {top3.map((t, i) => {
        const y = safeNum(t.yield);
        const wr = safeNum(t.porcentaje_acierto);
        return (
          <Link key={t.id} href={`/dashboard/tipsters/${t.id}`}
            className="rounded-xl p-3 border border-white/10 hover:border-[#00D1B2]/30 transition-all text-center"
            style={{ background: 'rgba(30,41,59,0.7)' }}>
            <span className="text-xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
            <p className="text-xs font-bold text-white mt-1 truncate">{sanitize(t.alias, 15)}</p>
            <p className="text-[10px] text-[#64748B]">{getDeporteIcon(sanitize(t.deporte))} {sanitize(t.deporte)}</p>
            <p className={`text-sm font-bold font-mono mt-1 ${y >= 0 ? 'text-[#00D1B2]' : 'text-[#EF4444]'}`}>
              {y >= 0 ? '+' : ''}{y.toFixed(1)}%
            </p>
            <p className="text-[10px] text-[#64748B]">
              {wr.toFixed(0)}% WR • {safeNum(t.total_apuestas)} ap
            </p>
          </Link>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════
export default function TipstersPage() {
  const [tipsters, setTipsters] = useState<Tipster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'yield' | 'winrate' | 'apuestas'>('yield');
  const [deporteFilter, setDeporteFilter] = useState<string>('all');

  useEffect(() => {
    const fetchTipsters = async () => {
      try {
        // Try enhanced endpoint first (includes racha)
        let tipstersList: Tipster[] = [];
        try {
          const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
          if (token) {
            const res = await fetch(`${API_URL}/api/tipsters-enhanced`, {
              headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
              const d = await res.json();
              if (d.tipsters && Array.isArray(d.tipsters)) {
                tipstersList = d.tipsters;
              }
            }
          }
        } catch {
          // Fallback to standard endpoint
        }

        // Fallback: use standard API
        if (tipstersList.length === 0) {
          const response = await tipstersAPI.getAll();
          if (Array.isArray(response)) {
            tipstersList = response;
          } else if (response?.tipsters && Array.isArray(response.tipsters)) {
            tipstersList = response.tipsters;
          } else if (response?.data && Array.isArray(response.data)) {
            tipstersList = response.data;
          }
        }

        // Validate + sanitize
        const validated = tipstersList
          .filter((t): t is Tipster => t !== null && typeof t === 'object' && typeof t.id === 'number')
          .map(t => ({
            id: safeNum(t.id),
            alias: sanitize(t.alias, 50) || 'Sin nombre',
            deporte: normalizeDeporte(sanitize(t.deporte, 30) || 'Mixto'),
            total_apuestas: Math.max(0, safeNum(t.total_apuestas)),
            ganadas: Math.max(0, safeNum(t.ganadas)),
            perdidas: Math.max(0, safeNum(t.perdidas)),
            porcentaje_acierto: Math.min(100, Math.max(0, safeNum(t.porcentaje_acierto))),
            ganancia_total: safeNum(t.ganancia_total),
            yield: safeNum(t.yield),
            racha_actual: safeNum(t.racha_actual),
            tipo_racha: sanitize(t.tipo_racha, 1),
          }));

        setTipsters(validated);
      } catch (error) {
        console.error('Error fetching tipsters:', error);
        setTipsters([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTipsters();
  }, []);

  // Unique deportes sorted by count (most tipsters first)
  const deportes = Array.from(new Set(tipsters.map(t => t.deporte)))
    .map(d => ({ name: d, count: tipsters.filter(t => t.deporte === d).length }))
    .sort((a, b) => b.count - a.count);

  // Filter + sort
  const filtered = tipsters
    .filter(t => {
      if (deporteFilter !== 'all' && t.deporte !== deporteFilter) return false;
      if (searchTerm) {
        const term = searchTerm.replace(/[<>"'&]/g, '').toLowerCase();
        return t.alias.toLowerCase().includes(term);
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'yield') return safeNum(b.yield) - safeNum(a.yield);
      if (sortBy === 'winrate') return safeNum(b.porcentaje_acierto) - safeNum(a.porcentaje_acierto);
      return safeNum(b.total_apuestas) - safeNum(a.total_apuestas);
    });

  // Stats
  const totalG = tipsters.reduce((a, t) => a + safeNum(t.ganadas), 0);
  const totalP = tipsters.reduce((a, t) => a + safeNum(t.perdidas), 0);
  const wrProm = tipsters.length > 0 ? tipsters.reduce((a, t) => a + safeNum(t.porcentaje_acierto), 0) / tipsters.length : 0;
  const rentables = tipsters.filter(t => safeNum(t.yield) > 0).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-[#00D1B2]/30 border-t-[#00D1B2] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeIn pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-[#00D1B2]" /> Tipsters
          </h1>
          <p className="text-xs text-[#94A3B8]">{tipsters.length} activos</p>
        </div>
      </div>

      {/* KPIs compactos — 1 fila */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {[
          { label: 'Tipsters', value: String(tipsters.length), color: 'white' },
          { label: 'W/L', value: `${totalG}/${totalP}`, color: '#00D1B2' },
          { label: 'WR Prom', value: `${wrProm.toFixed(1)}%`, color: 'white' },
          { label: 'Rentables', value: `${rentables}/${tipsters.length}`, color: '#00D1B2' },
        ].map((kpi, i) => (
          <div key={i} className="shrink-0 rounded-lg px-3 py-2 border border-white/10"
            style={{ background: 'rgba(30,41,59,0.7)' }}>
            <p className="text-base font-bold font-mono" style={{ color: kpi.color }}>{kpi.value}</p>
            <p className="text-[10px] text-[#64748B]">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Search + Sort */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="Buscar tipster..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            maxLength={50}
            className="w-full rounded-lg py-2 pl-9 pr-3 text-sm text-white placeholder-[#64748B] focus:outline-none focus:ring-1 focus:ring-[#00D1B2]/50 transition-all"
            style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>
        <div className="flex gap-1">
          {([
            { key: 'yield', label: 'Yield' },
            { key: 'winrate', label: 'WR' },
            { key: 'apuestas', label: 'Vol' },
          ] as const).map(f => (
            <button key={f.key} onClick={() => setSortBy(f.key)}
              className="px-3 py-2 rounded-lg text-xs font-bold transition-all"
              style={{
                background: sortBy === f.key ? '#00D1B2' : 'rgba(30,41,59,0.7)',
                color: sortBy === f.key ? '#0F172A' : '#94A3B8',
                border: sortBy === f.key ? 'none' : '1px solid rgba(255,255,255,0.1)',
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Deporte filter — scrollable chips */}
      {deportes.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <button onClick={() => setDeporteFilter('all')}
            className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{
              background: deporteFilter === 'all' ? '#00D1FF' : 'rgba(30,41,59,0.7)',
              color: deporteFilter === 'all' ? '#0F172A' : '#94A3B8',
              border: deporteFilter === 'all' ? 'none' : '1px solid rgba(255,255,255,0.1)',
            }}>
            Todos ({tipsters.length})
          </button>
          {deportes.map(d => (
            <button key={d.name} onClick={() => setDeporteFilter(d.name)}
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{
                background: deporteFilter === d.name ? '#00D1FF' : 'rgba(30,41,59,0.7)',
                color: deporteFilter === d.name ? '#0F172A' : '#94A3B8',
                border: deporteFilter === d.name ? 'none' : '1px solid rgba(255,255,255,0.1)',
              }}>
              {getDeporteIcon(d.name)} {d.name} ({d.count})
            </button>
          ))}
        </div>
      )}

      {/* Top 3 Podium */}
      {deporteFilter === 'all' && !searchTerm && <TopPodium tipsters={filtered} />}

      {/* Lista de tipsters (compact rows) */}
      {filtered.length === 0 ? (
        <div className="rounded-xl p-12 text-center border border-white/10" style={{ background: 'rgba(30,41,59,0.7)' }}>
          <Users className="h-10 w-10 text-[#334155] mx-auto mb-3" />
          <p className="text-[#94A3B8] text-sm">No se encontraron tipsters</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((tipster, index) => (
            <TipsterRow
              key={tipster.id}
              tipster={tipster}
              rank={index + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
