'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Search, TrendingUp, TrendingDown, Flame } from 'lucide-react';
import { tipstersAPI } from '@/lib/api';

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
  tipo_estrategia?: string;
}

const getDeporteIcon = (deporte: string) => {
  const icons: { [key: string]: string } = {
    'Futbol': '⚽',
    'Tenis': '🎾',
    'NBA': '🏀',
    'Baloncesto': '🏀',
    'Voleibol': '🏐',
    'Mixto': '🎯',
    'eSports': '🎮',
    'Hockey': '🏒',
    'Beisbol': '⚾'
  };
  return icons[deporte] || '🎯';
};

// Componente Círculo de Progreso Animado
const CircularProgress = ({ 
  percentage, 
  size = 120, 
  strokeWidth = 8,
  isHot = false 
}: { 
  percentage: number; 
  size?: number; 
  strokeWidth?: number;
  isHot?: boolean;
}) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedPercentage / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(percentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  // Color basado en porcentaje
  const getColor = () => {
    if (percentage >= 70) return '#00D1B2'; // Verde neón
    if (percentage >= 60) return '#FFDD57'; // Dorado
    if (percentage >= 50) return '#3B82F6'; // Azul
    return '#EF4444'; // Rojo
  };

  const color = getColor();

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Fondo del círculo */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#334155"
          strokeWidth={strokeWidth}
        />
        {/* Progreso */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          style={{
            filter: isHot ? `drop-shadow(0 0 8px ${color})` : `drop-shadow(0 0 4px ${color}40)`
          }}
        />
      </svg>
      {/* Texto central */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span 
          className="text-2xl font-bold font-mono"
          style={{ color }}
        >
          {animatedPercentage.toFixed(1)}%
        </span>
        <span className="text-xs text-[#94A3B8]">Win Rate</span>
      </div>
      {/* Glow effect para rachas */}
      {isHot && (
        <div 
          className="absolute inset-0 rounded-full animate-pulse"
          style={{ 
            background: `radial-gradient(circle, ${color}20 0%, transparent 70%)` 
          }}
        />
      )}
    </div>
  );
};

// Componente Sparkline Animado
const Sparkline = ({ positive, animated = true }: { positive: boolean; animated?: boolean }) => {
  const [isVisible, setIsVisible] = useState(!animated);
  
  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setIsVisible(true), 300);
      return () => clearTimeout(timer);
    }
  }, [animated]);

  // Generar puntos para el sparkline
  const generatePath = () => {
    const points = [];
    let y = 50;
    for (let i = 0; i <= 10; i++) {
      const change = positive 
        ? (Math.random() * 20 - 8) 
        : (Math.random() * 20 - 12);
      y = Math.max(10, Math.min(90, y + change));
      points.push({ x: i * 10, y: 100 - y });
    }
    return points;
  };

  const [points] = useState(generatePath());
  const pathD = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
  const color = positive ? '#00D1B2' : '#EF4444';

  return (
    <svg width="100" height="40" className="overflow-visible">
      <defs>
        <linearGradient id={`sparkline-gradient-${positive ? 'up' : 'down'}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      {/* Área bajo la línea */}
      <path
        d={`${pathD} L 100,100 L 0,100 Z`}
        fill={`url(#sparkline-gradient-${positive ? 'up' : 'down'})`}
        className={`transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      />
      {/* Línea principal */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#glow)"
        className={`transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        style={{
          strokeDasharray: isVisible ? 'none' : '200',
          strokeDashoffset: isVisible ? '0' : '200',
        }}
      />
    </svg>
  );
};

// Componente Card del Tipster
const TipsterCard = ({ tipster, rank }: { tipster: Tipster; rank: number }) => {
  const yieldValue = tipster.yield || 0;
  const isRentable = yieldValue > 0;
  const isHot = (tipster.racha_actual || 0) >= 3 && tipster.tipo_racha === 'W';

  const getRankDisplay = () => {
    if (rank === 1) return <span className="text-2xl">🥇</span>;
    if (rank === 2) return <span className="text-2xl">🥈</span>;
    if (rank === 3) return <span className="text-2xl">🥉</span>;
    return <span className="text-lg text-[#64748B] font-mono">#{rank}</span>;
  };

  return (
    <Link
      href={`/dashboard/tipsters/${tipster.id}`}
      className="group relative block"
    >
      {/* Card con Glassmorphism */}
      <div 
        className="relative overflow-hidden rounded-2xl p-6 transition-all duration-300 
                   hover:translate-y-[-4px] hover:shadow-2xl
                   border border-white/10 hover:border-[#00D1B2]/30"
        style={{
          background: 'rgba(30, 41, 59, 0.7)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Efecto de brillo en hover */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: 'linear-gradient(135deg, rgba(0, 209, 178, 0.1) 0%, transparent 50%, rgba(255, 221, 87, 0.1) 100%)',
          }}
        />

        {/* Header */}
        <div className="relative flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {getRankDisplay()}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">{getDeporteIcon(tipster.deporte)}</span>
                <h3 className="font-bold text-white text-lg group-hover:text-[#00D1B2] transition-colors">
                  {tipster.alias}
                </h3>
              </div>
              <p className="text-sm text-[#64748B]">{tipster.deporte}</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            {isRentable && (
              <span 
                className="px-3 py-1 rounded-full text-xs font-bold bg-[#00D1B2]/20 text-[#00D1B2] border border-[#00D1B2]/30"
                style={{
                  boxShadow: '0 0 12px rgba(0, 209, 178, 0.3)',
                  animation: 'pulse 2s infinite'
                }}
              >
                Rentable
              </span>
            )}
            {isHot && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-[#FFDD57]/20 text-[#FFDD57] border border-[#FFDD57]/30">
                <Flame className="h-3 w-3" />
                W{tipster.racha_actual}
              </span>
            )}
          </div>
        </div>

        {/* Contenido principal */}
        <div className="relative flex items-center gap-6">
          {/* Círculo de progreso */}
          <CircularProgress 
            percentage={tipster.porcentaje_acierto} 
            size={110}
            strokeWidth={8}
            isHot={isHot}
          />

          {/* Métricas */}
          <div className="flex-1 space-y-3">
            {/* Yield */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#94A3B8]">Yield</span>
              <span className={`text-xl font-bold font-mono flex items-center gap-1 ${
                isRentable ? 'text-[#00D1B2]' : 'text-[#EF4444]'
              }`}>
                {isRentable ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {yieldValue >= 0 ? '+' : ''}{yieldValue.toFixed(1)}%
              </span>
            </div>

            {/* W/L */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#94A3B8]">W/L</span>
              <span className="text-lg font-bold text-white font-mono">
                <span className="text-[#00D1B2]">{tipster.ganadas}</span>
                <span className="text-[#64748B]">/</span>
                <span className="text-[#EF4444]">{tipster.perdidas}</span>
              </span>
            </div>

            {/* Apuestas */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#94A3B8]">Apuestas</span>
              <span className="text-lg font-bold font-mono text-white">
                {tipster.total_apuestas}
              </span>
            </div>
          </div>
        </div>

        {/* Sparkline */}
        <div className="relative mt-4 flex items-center justify-between">
          <Sparkline positive={isRentable} />
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#64748B]">📊</span>
            <span className="text-sm font-medium text-[#94A3B8]">RACHAS</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default function TipstersPage() {
  const [tipsters, setTipsters] = useState<Tipster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'yield' | 'winrate' | 'apuestas'>('yield');

  useEffect(() => {
    const fetchTipsters = async () => {
      try {
        const response = await tipstersAPI.getAll();
        // Manejar diferentes formatos de respuesta del backend
        let tipstersList: Tipster[] = [];
        
        if (Array.isArray(response)) {
          tipstersList = response;
        } else if (response?.tipsters && Array.isArray(response.tipsters)) {
          tipstersList = response.tipsters;
        } else if (response?.data && Array.isArray(response.data)) {
          tipstersList = response.data;
        } else if (typeof response === 'object' && response !== null) {
          const values = Object.values(response);
          if (values.length > 0 && Array.isArray(values[0])) {
            tipstersList = values[0] as Tipster[];
          }
        }
        
        // Validar y sanitizar datos del backend
        const validatedTipsters = tipstersList
          .filter((t): t is Tipster => 
            t !== null && 
            typeof t === 'object' && 
            typeof t.id === 'number'
          )
          .map(t => ({
            id: Number(t.id) || 0,
            alias: String(t.alias || 'Sin nombre').slice(0, 50),
            deporte: String(t.deporte || 'Mixto').slice(0, 30),
            total_apuestas: Math.max(0, Number(t.total_apuestas) || 0),
            ganadas: Math.max(0, Number(t.ganadas) || 0),
            perdidas: Math.max(0, Number(t.perdidas) || 0),
            porcentaje_acierto: Math.min(100, Math.max(0, Number(t.porcentaje_acierto) || 0)),
            ganancia_total: Number(t.ganancia_total) || 0,
            yield: Number(t.yield) || 0,
            racha_actual: Number(t.racha_actual) || 0,
            tipo_racha: String(t.tipo_racha || '').slice(0, 1),
            tipo_estrategia: String(t.tipo_estrategia || 'RACHAS').slice(0, 20),
          }));
        
        setTipsters(validatedTipsters);
      } catch (error) {
        console.error('Error fetching tipsters:', error);
        setTipsters([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTipsters();
  }, []);

  // Sanitizar input para prevenir XSS
  const sanitizeInput = (input: string): string => {
    return input.replace(/[<>\"\'&]/g, '').slice(0, 100);
  };

  // Filtrar y ordenar
  const filteredTipsters = tipsters
    .filter(t => t.alias && t.alias.toLowerCase().includes(sanitizeInput(searchTerm).toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'yield') return (b.yield || 0) - (a.yield || 0);
      if (sortBy === 'winrate') return (b.porcentaje_acierto || 0) - (a.porcentaje_acierto || 0);
      return (b.total_apuestas || 0) - (a.total_apuestas || 0);
    });

  // Calcular totales con validación
  const totalGanadas = tipsters.reduce((acc, t) => acc + (Number(t.ganadas) || 0), 0);
  const totalPerdidas = tipsters.reduce((acc, t) => acc + (Number(t.perdidas) || 0), 0);
  const winRatePromedio = tipsters.length > 0 
    ? (tipsters.reduce((acc, t) => acc + (Number(t.porcentaje_acierto) || 0), 0) / tipsters.length)
    : 0;
  const tipstersRentables = tipsters.filter(t => (t.yield || 0) > 0).length;
  const porcentajeRentables = tipsters.length > 0 ? (tipstersRentables / tipsters.length * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-[#00D1B2]/30 border-t-[#00D1B2] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-20 lg:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Users className="h-8 w-8 text-[#00D1B2]" />
          Tipsters
        </h1>
        <p className="text-[#94A3B8] mt-1">{tipsters.length} tipsters activos</p>
      </div>

      {/* Buscador y Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#64748B]" />
          <input
            type="text"
            placeholder="Buscar tipster..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl py-3 pl-12 pr-4 text-white placeholder-[#64748B] 
                       focus:outline-none focus:ring-2 focus:ring-[#00D1B2]/50 transition-all"
            style={{
              background: 'rgba(30, 41, 59, 0.7)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: 'yield', label: 'Yield' },
            { key: 'winrate', label: 'Win Rate' },
            { key: 'apuestas', label: 'Volumen' },
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setSortBy(filter.key as any)}
              className={`px-5 py-3 rounded-xl text-sm font-medium transition-all ${
                sortBy === filter.key
                  ? 'bg-[#00D1B2] text-white shadow-lg shadow-[#00D1B2]/25'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
              style={sortBy !== filter.key ? {
                background: 'rgba(30, 41, 59, 0.7)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              } : {}}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Overview con Glassmorphism */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tipsters', value: tipsters.length, color: 'white' },
          { label: 'Ganadas/Perdidas', value: `${totalGanadas}/${totalPerdidas}`, color: '#00D1B2' },
          { label: 'Win Rate Prom', value: `${winRatePromedio.toFixed(1)}%`, color: 'white' },
          { label: 'Rentables', value: `${porcentajeRentables.toFixed(0)}% (${tipstersRentables}/${tipsters.length})`, color: '#00D1B2' },
        ].map((stat, i) => (
          <div 
            key={i}
            className="rounded-2xl p-5 border border-white/10"
            style={{
              background: 'rgba(30, 41, 59, 0.7)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <p 
              className="text-2xl font-bold font-mono"
              style={{ color: stat.color }}
            >
              {stat.value}
            </p>
            <p className="text-sm text-[#64748B]">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Grid de Tipsters */}
      {filteredTipsters.length === 0 ? (
        <div 
          className="rounded-2xl p-16 text-center border border-white/10"
          style={{
            background: 'rgba(30, 41, 59, 0.7)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <Users className="h-12 w-12 text-[#334155] mx-auto mb-4" />
          <p className="text-[#94A3B8]">No se encontraron tipsters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTipsters.map((tipster, index) => (
            <TipsterCard key={tipster.id} tipster={tipster} rank={index + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
