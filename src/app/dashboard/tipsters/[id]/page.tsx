'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ChevronLeft, Flame, Snowflake, AlertTriangle,
  Search, Calendar, BarChart3, TrendingUp, Brain,
  Shield, Target, Zap, Star, Award, Info, Lightbulb
} from 'lucide-react';
import { tipstersAPI } from '@/lib/api';

// ============================================================================
// TIPOS
// ============================================================================
interface Apuesta {
  id: number;
  fecha: string;
  apuesta: string;
  tipo_mercado: string;
  cuota: number;
  resultado: 'GANADA' | 'PERDIDA' | 'PENDIENTE' | 'NULA';
}

interface Estrategia {
  estrategia_activa: string;
  porcentaje_kelly: number;
  stake_minimo: number;
  stake_maximo: number;
}

interface TipsterDetalle {
  tipster: { id: number; alias: string; deporte: string };
  estadisticas: {
    total_apuestas: number;
    ganadas: number;
    perdidas: number;
    porcentaje_acierto: number;
    ganancia_total: number;
    racha_actual: number;
    tipo_racha?: string;
    mejor_racha: number;
  };
  estrategia: Estrategia;
  historial: Apuesta[];
}

// ============================================================================
// HELPERS
// ============================================================================
const getDeporteIcon = (deporte: string) => {
  const icons: Record<string, string> = {
    'Futbol': '⚽', 'Tenis': '🎾', 'NBA': '🏀', 'Baloncesto': '🏀',
    'Voleibol': '🏐', 'Mixto': '🎯', 'eSports': '🎮'
  };
  return icons[deporte] || '🎯';
};

// Truncar nombre largo
const truncarNombre = (nombre: string, maxLength: number = 20): string => {
  if (nombre.length <= maxLength) return nombre;
  return nombre.slice(0, maxLength) + '...';
};

// Calcular Yield real del historial
const calcularYield = (historial: Apuesta[]): number => {
  const apuestasResueltas = historial.filter(a => a.resultado === 'GANADA' || a.resultado === 'PERDIDA');
  if (apuestasResueltas.length === 0) return 0;
  
  let unidadesGanadas = 0;
  apuestasResueltas.forEach(a => {
    if (a.resultado === 'GANADA') {
      unidadesGanadas += (Number(a.cuota || 0) - 1);
    } else {
      unidadesGanadas -= 1;
    }
  });
  
  return (unidadesGanadas / apuestasResueltas.length) * 100;
};

// Calcular cuota promedio
const calcularCuotaPromedio = (historial: Apuesta[]): number => {
  const apuestasResueltas = historial.filter(a => a.resultado === 'GANADA' || a.resultado === 'PERDIDA');
  if (apuestasResueltas.length === 0) return 0;
  return apuestasResueltas.reduce((acc, a) => acc + (Number(a.cuota) || 0), 0) / apuestasResueltas.length;
};

// Calcular racha actual desde historial
const calcularRachaActual = (historial: Apuesta[]): { racha: number; tipo: 'W' | 'L' } => {
  const resueltas = historial.filter(a => a.resultado === 'GANADA' || a.resultado === 'PERDIDA');
  if (resueltas.length === 0) return { racha: 0, tipo: 'W' };
  
  let racha = 0;
  const ultimoResultado = resueltas[0]?.resultado;
  
  for (const ap of resueltas) {
    if (ap.resultado === ultimoResultado) {
      racha++;
    } else {
      break;
    }
  }
  
  return { racha, tipo: ultimoResultado === 'GANADA' ? 'W' : 'L' };
};

// Calcular mejor racha
const calcularMejorRacha = (historial: Apuesta[]): number => {
  const resueltas = historial.filter(a => a.resultado === 'GANADA' || a.resultado === 'PERDIDA').reverse();
  let mejorRacha = 0;
  let rachaActual = 0;
  
  for (let i = 0; i < resueltas.length; i++) {
    if (resueltas[i].resultado === 'GANADA') {
      rachaActual++;
      if (rachaActual > mejorRacha) mejorRacha = rachaActual;
    } else {
      rachaActual = 0;
    }
  }
  
  return mejorRacha;
};

// Nivel de confianza
const calcularNivelConfianza = (winRate: number, yield_: number, totalApuestas: number): { nivel: string; estrellas: number; color: string } => {
  let puntos = 0;
  
  if (winRate >= 70) puntos += 30;
  else if (winRate >= 60) puntos += 25;
  else if (winRate >= 55) puntos += 20;
  else if (winRate >= 50) puntos += 15;
  else puntos += 5;
  
  if (yield_ >= 15) puntos += 30;
  else if (yield_ >= 10) puntos += 25;
  else if (yield_ >= 5) puntos += 20;
  else if (yield_ >= 0) puntos += 10;
  
  if (totalApuestas >= 50) puntos += 20;
  else if (totalApuestas >= 30) puntos += 15;
  else if (totalApuestas >= 20) puntos += 10;
  else puntos += 5;
  
  if (puntos >= 70) return { nivel: 'EXCELENTE', estrellas: 5, color: '#00D1B2' };
  if (puntos >= 55) return { nivel: 'MUY BUENO', estrellas: 4, color: '#00D1B2' };
  if (puntos >= 40) return { nivel: 'BUENO', estrellas: 3, color: '#FFDD57' };
  if (puntos >= 25) return { nivel: 'REGULAR', estrellas: 2, color: '#F59E0B' };
  return { nivel: 'EN OBSERVACIÓN', estrellas: 1, color: '#EF4444' };
};

// Generar consejo IA
const generarConsejoIA = (winRate: number, yield_: number, racha: { racha: number; tipo: 'W' | 'L' }, totalApuestas: number): { mensaje: string; tipo: 'positivo' | 'neutral' | 'precaucion' } => {
  // Racha muy positiva
  if (racha.tipo === 'W' && racha.racha >= 5) {
    return { mensaje: '🔥 En racha caliente. Buen momento para seguir sus picks.', tipo: 'positivo' };
  }
  
  // Racha muy negativa
  if (racha.tipo === 'L' && racha.racha >= 4) {
    return { mensaje: '❄️ Atraviesa mala racha. Considera esperar a que se recupere.', tipo: 'precaucion' };
  }
  
  // Yield muy alto
  if (yield_ >= 15 && totalApuestas >= 30) {
    return { mensaje: '⭐ Rendimiento excepcional. Uno de los mejores tipsters.', tipo: 'positivo' };
  }
  
  // Yield positivo bueno
  if (yield_ >= 8 && winRate >= 60) {
    return { mensaje: '✅ Buen balance entre efectividad y rentabilidad.', tipo: 'positivo' };
  }
  
  // Yield positivo pero bajo
  if (yield_ > 0 && yield_ < 5) {
    return { mensaje: '📊 Rentable pero conservador. Ideal para stakes pequeños.', tipo: 'neutral' };
  }
  
  // Yield negativo
  if (yield_ < 0) {
    return { mensaje: '⚠️ Yield negativo. Analiza bien antes de seguir.', tipo: 'precaucion' };
  }
  
  // Pocas apuestas
  if (totalApuestas < 20) {
    return { mensaje: '📈 Muestra pequeña. Espera más apuestas para evaluar.', tipo: 'neutral' };
  }
  
  // Win rate alto pero yield bajo
  if (winRate >= 65 && yield_ < 5) {
    return { mensaje: '🎯 Alta efectividad en cuotas bajas. Consistente pero lento.', tipo: 'neutral' };
  }
  
  // Default
  return { mensaje: '📊 Rendimiento dentro del promedio esperado.', tipo: 'neutral' };
};

// ============================================================================
// COMPONENTE: Consejo IA
// ============================================================================
const ConsejoIA = ({ winRate, yield_, racha, totalApuestas }: { winRate: number; yield_: number; racha: { racha: number; tipo: 'W' | 'L' }; totalApuestas: number }) => {
  const consejo = generarConsejoIA(winRate, yield_, racha, totalApuestas);
  
  const bgColor = consejo.tipo === 'positivo' 
    ? 'from-[#00D1B2]/10 to-transparent border-[#00D1B2]/30' 
    : consejo.tipo === 'precaucion'
    ? 'from-[#F59E0B]/10 to-transparent border-[#F59E0B]/30'
    : 'from-[#3B82F6]/10 to-transparent border-[#3B82F6]/30';
  
  const iconColor = consejo.tipo === 'positivo' ? '#00D1B2' : consejo.tipo === 'precaucion' ? '#F59E0B' : '#3B82F6';

  return (
    <div className={`rounded-2xl p-4 border bg-gradient-to-r ${bgColor}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${iconColor}20` }}>
          <Lightbulb className="h-5 w-5" style={{ color: iconColor }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-[#94A3B8]">Consejo IA</p>
          <p className="text-white font-medium">{consejo.mensaje}</p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE: Alerta de Racha
// ============================================================================
const AlertaRacha = ({ racha, tipo }: { racha: number; tipo: 'W' | 'L' }) => {
  if (racha < 3) return null;
  
  const isPositive = tipo === 'W';
  
  const getMensaje = () => {
    if (isPositive) {
      if (racha >= 5) return { titulo: '🔥 ¡En fuego!', mensaje: `${racha} victorias seguidas` };
      if (racha >= 4) return { titulo: '¡Excelente racha!', mensaje: '4 victorias seguidas' };
      return { titulo: '¡Buena racha!', mensaje: '3 victorias seguidas' };
    } else {
      if (racha >= 5) return { titulo: '❄️ Precaución', mensaje: `${racha} pérdidas seguidas` };
      if (racha >= 4) return { titulo: 'Racha fría', mensaje: '4 pérdidas seguidas' };
      return { titulo: 'Racha fría', mensaje: '3 pérdidas seguidas' };
    }
  };
  
  const config = getMensaje();
  
  return (
    <div className={`rounded-xl p-3 border ${
      isPositive 
        ? 'bg-gradient-to-r from-[#00D1B2]/10 to-transparent border-[#00D1B2]/30' 
        : 'bg-gradient-to-r from-[#EF4444]/10 to-transparent border-[#EF4444]/30'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isPositive ? (
            <Flame className="h-5 w-5 text-[#FFDD57]" />
          ) : (
            <Snowflake className="h-5 w-5 text-[#3B82F6]" />
          )}
          <span className={`font-bold ${isPositive ? 'text-[#00D1B2]' : 'text-[#EF4444]'}`}>
            {config.titulo}
          </span>
        </div>
        <span className={`font-mono font-bold text-lg ${isPositive ? 'text-[#00D1B2]' : 'text-[#EF4444]'}`}>
          {isPositive ? '+' : '-'}{racha}
        </span>
      </div>
      <p className="text-[#94A3B8] text-sm mt-1">{config.mensaje}</p>
    </div>
  );
};

// ============================================================================
// COMPONENTE: Análisis con IA (compacto)
// ============================================================================
const AnalisisIA = () => (
  <div className="rounded-2xl p-4 border border-[#00D1B2]/30 bg-gradient-to-br from-[#00D1B2]/10 to-transparent">
    <div className="flex items-center gap-3 mb-3">
      <Brain className="h-5 w-5 text-[#00D1B2]" />
      <span className="text-white font-bold text-sm">Analizado por IA</span>
    </div>
    <div className="grid grid-cols-4 gap-2">
      {[
        { icon: Target, label: 'EV+' },
        { icon: BarChart3, label: 'Kelly' },
        { icon: Shield, label: 'Filtro' },
        { icon: Zap, label: 'Rachas' },
      ].map((item, i) => (
        <div key={i} className="bg-[#0F172A]/50 rounded-lg p-2 text-center">
          <item.icon className="h-4 w-4 text-[#00D1B2] mx-auto mb-1" />
          <p className="text-[#94A3B8] text-xs">{item.label}</p>
        </div>
      ))}
    </div>
  </div>
);

// ============================================================================
// COMPONENTE: Comparación vs Inversiones (compacto)
// ============================================================================
const ComparacionInversiones = ({ yield_ }: { yield_: number }) => {
  if (yield_ < 3) return null;
  
  return (
    <div className="rounded-2xl p-4 border border-white/10" style={{ background: 'rgba(30,41,59,0.7)' }}>
      <h3 className="text-white font-bold text-sm flex items-center gap-2 mb-3">
        <TrendingUp className="h-4 w-4 text-[#00D1B2]" />
        vs Inversiones
      </h3>
      <div className="space-y-2">
        {[
          { nombre: 'Banco', valor: 0.4 },
          { nombre: 'Fondos', valor: 1.2 },
          { nombre: 'Acciones', valor: 2.5 },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-[#94A3B8]">{item.nombre}</span>
            <span className="text-white font-mono">+{item.valor}%</span>
          </div>
        ))}
        <div className="flex items-center justify-between text-sm pt-2 border-t border-white/10">
          <span className="text-[#00D1B2] font-bold">🔥 Este tipster</span>
          <span className="text-[#00D1B2] font-bold font-mono">+{yield_.toFixed(1)}%</span>
        </div>
      </div>
      <p className="text-center text-[#00D1B2] font-bold text-sm mt-3">
        {Math.round(yield_ / 0.4)}x mejor que el banco 🏦
      </p>
    </div>
  );
};

// ============================================================================
// COMPONENTE: Indicadores de Confianza (compacto)
// ============================================================================
const IndicadoresConfianza = ({ winRate, yield_, totalApuestas, mejorRacha }: { winRate: number; yield_: number; totalApuestas: number; mejorRacha: number }) => {
  const confianza = calcularNivelConfianza(winRate, yield_, totalApuestas);

  return (
    <div className="rounded-2xl p-4 border border-white/10" style={{ background: 'rgba(30,41,59,0.7)' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-bold text-sm flex items-center gap-2">
          <Award className="h-4 w-4 text-[#FFDD57]" />
          Nivel de Confianza
        </h3>
        <div className="flex items-center gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`h-4 w-4 ${i < confianza.estrellas ? 'text-[#FFDD57] fill-[#FFDD57]' : 'text-[#334155]'}`} />
          ))}
        </div>
      </div>
      <div className="text-center mb-3">
        <span className="text-lg font-bold px-3 py-1 rounded-lg" style={{ color: confianza.color, backgroundColor: `${confianza.color}20` }}>
          {confianza.nivel}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-[#0F172A]/50 rounded-lg p-2 text-center">
          <p className="text-white font-bold">{Number(winRate || 0).toFixed(1)}%</p>
          <p className="text-[#64748B] text-xs">Efectividad</p>
        </div>
        <div className="bg-[#0F172A]/50 rounded-lg p-2 text-center">
          <p className={`font-bold ${yield_ >= 0 ? 'text-[#00D1B2]' : 'text-[#EF4444]'}`}>
            {yield_ >= 0 ? '+' : ''}{Number(yield_ || 0).toFixed(1)}%
          </p>
          <p className="text-[#64748B] text-xs">Yield</p>
        </div>
        <div className="bg-[#0F172A]/50 rounded-lg p-2 text-center">
          <p className="text-white font-bold">{totalApuestas}</p>
          <p className="text-[#64748B] text-xs">Apuestas</p>
        </div>
        <div className="bg-[#0F172A]/50 rounded-lg p-2 text-center">
          <p className="text-[#FFDD57] font-bold">+{mejorRacha}</p>
          <p className="text-[#64748B] text-xs">Mejor racha</p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE: Gráfico de Evolución (compacto)
// ============================================================================
const GraficoEvolucion = ({ historial }: { historial: Apuesta[] }) => {
  const apuestasResueltas = historial.filter(a => a.resultado === 'GANADA' || a.resultado === 'PERDIDA').reverse();
  
  if (apuestasResueltas.length < 2) return null;

  let acumulado = 0;
  const puntos = apuestasResueltas.map((a) => {
    if (a.resultado === 'GANADA') {
      acumulado += (Number(a.cuota || 0) - 1);
    } else {
      acumulado -= 1;
    }
    return acumulado;
  });

  const maxY = Math.max(...puntos, 0);
  const minY = Math.min(...puntos, 0);
  const rangeY = maxY - minY || 1;

  const width = 100;
  const height = 40;
  const padding = 2;

  const pathPoints = puntos.map((y, i) => {
    const x = padding + (i / (puntos.length - 1)) * (width - 2 * padding);
    const yPos = height - padding - ((y - minY) / rangeY) * (height - 2 * padding);
    return `${i === 0 ? 'M' : 'L'} ${x} ${yPos}`;
  }).join(' ');

  const areaPath = pathPoints + ` L ${width - padding} ${height} L ${padding} ${height} Z`;
  const isPositive = acumulado >= 0;

  return (
    <div className="rounded-2xl p-4 border border-white/10" style={{ background: 'rgba(30,41,59,0.7)' }}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white font-bold text-sm flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-[#00D1B2]" />
          Evolución
        </h3>
        <span className={`font-mono font-bold ${isPositive ? 'text-[#00D1B2]' : 'text-[#EF4444]'}`}>
          {isPositive ? '+' : ''}{acumulado.toFixed(2)}u
        </span>
      </div>

      <div className="h-20 mb-3">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={isPositive ? '#00D1B2' : '#EF4444'} stopOpacity="0.4" />
              <stop offset="100%" stopColor={isPositive ? '#00D1B2' : '#EF4444'} stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#areaGrad)" />
          <path 
            d={pathPoints} 
            fill="none" 
            stroke={isPositive ? '#00D1B2' : '#EF4444'} 
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="flex gap-1 flex-wrap">
        {historial.slice(0, 12).map((a, i) => (
          <span 
            key={i} 
            className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${
              a.resultado === 'GANADA' ? 'bg-[#00D1B2]/20 text-[#00D1B2]' : 
              a.resultado === 'PERDIDA' ? 'bg-[#EF4444]/20 text-[#EF4444]' : 
              'bg-[#F59E0B]/20 text-[#F59E0B]'
            }`}
          >
            {a.resultado === 'GANADA' ? '✓' : a.resultado === 'PERDIDA' ? '✗' : '○'}
          </span>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE: Historial CARDS - PENDIENTES DESTACADAS CON BADGE PULSANTE
// ============================================================================
const HistorialCards = ({ historial }: { historial: Apuesta[] }) => {
  const [filtro, setFiltro] = useState<'TODAS' | 'GANADA' | 'PERDIDA' | 'PENDIENTE'>('TODAS');
  const [mostrarTodas, setMostrarTodas] = useState(false);

  const pendientes = historial.filter(a => a.resultado === 'PENDIENTE');
  const filtradas = historial.filter(a => filtro === 'TODAS' || a.resultado === filtro);

  // Ordenar: PENDIENTES primero cuando filtro es TODAS
  const ordenadas = filtro === 'TODAS' 
    ? [...filtradas].sort((a, b) => {
        if (a.resultado === 'PENDIENTE' && b.resultado !== 'PENDIENTE') return -1;
        if (a.resultado !== 'PENDIENTE' && b.resultado === 'PENDIENTE') return 1;
        return 0;
      })
    : filtradas;

  const mostradas = mostrarTodas ? ordenadas : ordenadas.slice(0, 8);

  return (
    <div className="rounded-2xl p-4 border border-white/10" style={{ background: 'rgba(30,41,59,0.7)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold flex items-center gap-2">
          <Calendar className="h-5 w-5 text-[#00D1B2]" /> Historial
          {pendientes.length > 0 && (
            <span style={{
              background: 'linear-gradient(135deg, #F59E0B, #FFBB00)',
              color: '#000',
              fontSize: '10px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '10px',
            }}>
              {pendientes.length} en juego
            </span>
          )}
        </h3>
        <div className="flex gap-1">
          {(['TODAS', 'GANADA', 'PERDIDA', 'PENDIENTE'] as const).map((f) => {
            const isActive = filtro === f;
            const count = f === 'PENDIENTE' ? pendientes.length : 0;
            return (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                  isActive 
                    ? f === 'GANADA' ? 'bg-[#00D1B2] text-white' 
                    : f === 'PERDIDA' ? 'bg-[#EF4444] text-white'
                    : f === 'PENDIENTE' ? 'bg-[#F59E0B] text-white'
                    : 'bg-[#00D1B2] text-white'
                    : 'bg-[#334155] text-[#94A3B8]'
                }`}
                style={f === 'PENDIENTE' && !isActive && count > 0 ? {
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  color: '#F59E0B'
                } : {}}
              >
                {f === 'TODAS' ? 'Todas' : f === 'GANADA' ? '✓' : f === 'PERDIDA' ? '✗' : `⏳${count > 0 ? count : ''}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {mostradas.map((a, i) => {
          const isPendiente = a.resultado === 'PENDIENTE';

          if (isPendiente) {
            // =============================================
            // CARD PENDIENTE - BADGE PULSANTE (Opción A)
            // =============================================
            return (
              <div 
                key={a.id || i}
                className="rounded-xl p-4 relative overflow-hidden pendiente-card"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 187, 0, 0.1) 0%, rgba(255, 221, 87, 0.03) 100%)',
                  border: '1.5px solid rgba(255, 187, 0, 0.35)',
                  animation: 'pendientePulse 3s ease-in-out infinite',
                }}
              >
                {/* Borde izquierdo dorado */}
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px',
                  background: 'linear-gradient(180deg, #F59E0B, #FFDD57)',
                  borderRadius: '4px 0 0 4px',
                }} />

                {/* Badge PENDIENTE */}
                <div className="flex items-center justify-between mb-2">
                  <span style={{
                    background: 'linear-gradient(135deg, #F59E0B, #FFBB00)',
                    color: '#000',
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: '6px',
                    letterSpacing: '0.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}>
                    ⏳ PENDIENTE
                  </span>
                  <span className="font-mono font-bold" style={{ color: '#FFBB00' }}>
                    @{Number(a.cuota || 0).toFixed(2)}
                  </span>
                </div>
                
                {/* Apuesta */}
                <p className="text-white font-medium text-sm mb-2 leading-tight pl-2">
                  {a.apuesta}
                </p>
                
                {/* Detalles */}
                <div className="flex items-center justify-between text-xs pl-2">
                  <div className="flex items-center gap-2 text-[#94A3B8]">
                    <span>{a.fecha}</span>
                    <span>•</span>
                    <span style={{
                      background: 'rgba(255, 187, 0, 0.15)',
                      color: '#FFBB00',
                      padding: '1px 8px',
                      borderRadius: '4px',
                      fontWeight: 600,
                    }}>
                      {a.tipo_mercado || 'N/A'}
                    </span>
                  </div>
                  <span className="text-[#94A3B8] flex items-center gap-1" style={{ fontSize: '11px' }}>
                    Esperando resultado...
                  </span>
                </div>

                {/* Barra de progreso animada */}
                <div style={{ 
                  width: '100%', height: '3px', borderRadius: '2px',
                  background: 'rgba(255, 187, 0, 0.1)', overflow: 'hidden',
                  marginTop: '10px',
                }}>
                  <div className="pendiente-progress" style={{
                    height: '100%', borderRadius: '2px',
                    background: 'linear-gradient(90deg, #F59E0B, #FFDD57)',
                  }} />
                </div>
              </div>
            );
          }

          // =============================================
          // CARD NORMAL (GANADA / PERDIDA)
          // =============================================
          return (
            <div 
              key={a.id || i}
              className={`rounded-xl p-3 border ${
                a.resultado === 'GANADA' ? 'border-[#00D1B2]/30 bg-[#00D1B2]/5' :
                'border-[#EF4444]/30 bg-[#EF4444]/5'
              }`}
            >
              <p className="text-white font-medium text-sm mb-2 leading-tight">
                {a.apuesta}
              </p>
              
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-[#94A3B8]">
                  <span>{a.fecha}</span>
                  <span>•</span>
                  <span className="bg-[#334155] px-2 py-0.5 rounded">{a.tipo_mercado || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-white">@{Number(a.cuota || 0).toFixed(2)}</span>
                  <span className={`w-6 h-6 rounded flex items-center justify-center font-bold ${
                    a.resultado === 'GANADA' ? 'bg-[#00D1B2]/20 text-[#00D1B2]' : 'bg-[#EF4444]/20 text-[#EF4444]'
                  }`}>
                    {a.resultado === 'GANADA' ? '✓' : '✗'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtradas.length > 8 && !mostrarTodas && (
        <button 
          onClick={() => setMostrarTodas(true)} 
          className="w-full mt-4 py-2 text-center text-[#00D1B2] text-sm font-medium hover:underline"
        >
          Ver todas ({filtradas.length})
        </button>
      )}
      
      {filtradas.length === 0 && (
        <p className="text-center text-[#64748B] py-4">No hay apuestas</p>
      )}

      {/* Animaciones CSS */}
      <style jsx>{`
        @keyframes pendientePulse {
          0%, 100% { border-color: rgba(255, 187, 0, 0.25); box-shadow: 0 0 0 rgba(255, 187, 0, 0); }
          50% { border-color: rgba(255, 187, 0, 0.55); box-shadow: 0 0 20px rgba(255, 187, 0, 0.08); }
        }
        .pendiente-progress {
          animation: progressSlide 2.5s ease-in-out infinite alternate;
        }
        @keyframes progressSlide {
          0% { width: 20%; opacity: 0.4; }
          50% { width: 65%; opacity: 1; }
          100% { width: 20%; opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// PÁGINA PRINCIPAL
// ============================================================================
export default function TipsterDetallePage() {
  const params = useParams();
  const tipsterId = parseInt(params.id as string);
  const [data, setData] = useState<TipsterDetalle | null>(null);
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
              id: h.id,
              fecha: h.fecha,
              apuesta: h.apuesta,
              tipo_mercado: h.tipo_mercado,
              cuota: h.cuota,
              resultado: h.resultado,
            }))
          });
        } else {
          setError('No se pudo cargar el tipster');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Inicia sesión para ver los detalles del tipster');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [tipsterId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-[#00D1B2]/30 border-t-[#00D1B2] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="h-12 w-12 text-[#F59E0B] mx-auto mb-4" />
        <p className="text-[#94A3B8] mb-4">{error || 'Tipster no encontrado'}</p>
        <Link href="/dashboard/tipsters" className="text-[#00D1B2] hover:underline">← Volver a Tipsters</Link>
      </div>
    );
  }

  const { tipster, estadisticas, historial } = data;
  
  // Calcular métricas desde el historial
  const yield_ = calcularYield(historial);
  const rachaInfo = calcularRachaActual(historial);
  const mejorRacha = calcularMejorRacha(historial);
  const totalApuestasResueltas = historial.filter(a => a.resultado === 'GANADA' || a.resultado === 'PERDIDA').length;
  const winRate = totalApuestasResueltas > 0 ? (estadisticas.ganadas / totalApuestasResueltas) * 100 : 0;
  const isRentable = yield_ > 0;

  return (
    <div className="space-y-4 animate-fadeIn pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/tipsters" className="p-2 rounded-xl hover:bg-white/10 transition-all">
          <ChevronLeft className="h-6 w-6 text-[#94A3B8]" />
        </Link>
        <h1 className="text-xl font-bold text-white">Detalle del Tipster</h1>
      </div>

      {/* Info Tipster + Stats */}
      <div className="rounded-2xl p-4 border border-white/10" style={{ background: 'rgba(30,41,59,0.7)' }}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" 
              style={{ background: 'linear-gradient(135deg,#1E293B,#334155)', border: '2px solid rgba(255,255,255,0.1)' }}>
              {getDeporteIcon(tipster.deporte)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white" title={tipster.alias}>
                {truncarNombre(tipster.alias, 22)}
              </h2>
              <p className="text-sm text-[#94A3B8]">{tipster.deporte}</p>
            </div>
          </div>
          {isRentable && (
            <span className="px-3 py-1 rounded-lg text-xs font-bold bg-[#00D1B2]/20 text-[#00D1B2] border border-[#00D1B2]/30">
              Rentable
            </span>
          )}
        </div>

        {/* Stats: Efectividad, Ganadas/Perdidas, Yield */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-3 rounded-xl bg-[#0F172A]/50">
            <p className={`text-2xl font-bold font-mono ${winRate >= 60 ? 'text-[#00D1B2]' : winRate >= 50 ? 'text-[#FFDD57]' : 'text-[#EF4444]'}`}>
              {Number(winRate || 0).toFixed(1)}%
            </p>
            <p className="text-xs text-[#64748B]">Efectividad</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-[#0F172A]/50">
            <p className="text-xl font-bold font-mono">
              <span className="text-[#00D1B2]">{estadisticas.ganadas || 0}</span>
              <span className="text-[#64748B]">✅</span>
              <span className="text-[#EF4444]">{estadisticas.perdidas || 0}</span>
              <span className="text-[#64748B]">❌</span>
            </p>
            <p className="text-xs text-[#64748B]">Resultados</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-[#0F172A]/50">
            <p className={`text-2xl font-bold font-mono ${yield_ >= 0 ? 'text-[#00D1B2]' : 'text-[#EF4444]'}`}>
              {yield_ >= 0 ? '+' : ''}{Number(yield_ || 0).toFixed(1)}%
            </p>
            <p className="text-xs text-[#64748B]">Yield</p>
          </div>
        </div>
      </div>

      {/* Alerta de Racha */}
      <AlertaRacha racha={rachaInfo.racha} tipo={rachaInfo.tipo} />

      {/* Consejo IA */}
      <ConsejoIA winRate={winRate} yield_={yield_} racha={rachaInfo} totalApuestas={totalApuestasResueltas} />

      {/* Análisis IA */}
      <AnalisisIA />

      {/* Grid: Comparación + Confianza */}
      <div className="grid md:grid-cols-2 gap-4">
        <ComparacionInversiones yield_={yield_} />
        <IndicadoresConfianza winRate={winRate} yield_={yield_} totalApuestas={totalApuestasResueltas} mejorRacha={mejorRacha} />
      </div>

      {/* Gráfico */}
      <GraficoEvolucion historial={historial} />

      {/* Historial CARDS */}
      <HistorialCards historial={historial} />
    </div>
  );
}
