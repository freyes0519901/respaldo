'use client';

import { useState } from 'react';
import { GraduationCap, BookOpen, ChevronRight, Play, Clock, Lock, CheckCircle, BarChart3, Zap } from 'lucide-react';

interface Leccion {
  id: number;
  titulo: string;
  descripcion: string;
  duracion: string;
  nivel: 'Básico' | 'Intermedio' | 'Avanzado';
  icono: string;
  premium: boolean;
  completada: boolean;
}

interface Modulo {
  id: number;
  titulo: string;
  descripcion: string;
  icono: string;
  color: string;
  lecciones: Leccion[];
}

const MODULOS: Modulo[] = [
  {
    id: 1,
    titulo: 'Fundamentos del Betting',
    descripcion: 'Aprende las bases antes de apostar un solo peso',
    icono: '📚',
    color: '#00D1B2',
    lecciones: [
      { id: 1, titulo: '¿Qué son las cuotas y cómo leerlas?', descripcion: 'Decimales, fraccionales y americanas explicadas', duracion: '5 min', nivel: 'Básico', icono: '📊', premium: false, completada: true },
      { id: 2, titulo: 'Tipos de apuestas: 1X2, Hándicap, Over/Under', descripcion: 'Cada mercado explicado con ejemplos reales', duracion: '8 min', nivel: 'Básico', icono: '🎯', premium: false, completada: true },
      { id: 3, titulo: 'Cómo funciona el margen de la casa', descripcion: 'Por qué las casas siempre ganan (y cómo evitarlo)', duracion: '6 min', nivel: 'Básico', icono: '🏦', premium: false, completada: false },
      { id: 4, titulo: 'Valor esperado (EV): La métrica más importante', descripcion: 'Si no entiendes EV, estás apostando a ciegas', duracion: '10 min', nivel: 'Básico', icono: '💡', premium: false, completada: false },
    ],
  },
  {
    id: 2,
    titulo: 'Gestión de Banca',
    descripcion: 'El 90% de los apostadores pierde por no gestionar su dinero',
    icono: '💰',
    color: '#FFBB00',
    lecciones: [
      { id: 5, titulo: 'Define tu banca: cuánto destinar a apuestas', descripcion: 'Reglas de oro para no arriesgar más de lo que puedes', duracion: '5 min', nivel: 'Básico', icono: '🏛️', premium: false, completada: false },
      { id: 6, titulo: 'Método de stakes: fijo vs proporcional', descripcion: 'Cuándo usar cada estrategia según tu perfil', duracion: '7 min', nivel: 'Intermedio', icono: '📐', premium: false, completada: false },
      { id: 7, titulo: 'Criterio de Kelly: stake óptimo matemático', descripcion: 'La fórmula que usan los profesionales', duracion: '12 min', nivel: 'Avanzado', icono: '🧮', premium: true, completada: false },
      { id: 8, titulo: 'Cómo sobrevivir a las malas rachas', descripcion: 'Plan de contingencia cuando todo va mal', duracion: '8 min', nivel: 'Intermedio', icono: '🛡️', premium: false, completada: false },
    ],
  },
  {
    id: 3,
    titulo: 'Análisis y Estrategia',
    descripcion: 'Técnicas avanzadas para encontrar valor real',
    icono: '🧠',
    color: '#3B82F6',
    lecciones: [
      { id: 9, titulo: 'Cómo analizar un partido antes de apostar', descripcion: 'Check-list de 10 puntos que usamos en NeuroTips', duracion: '15 min', nivel: 'Intermedio', icono: '📋', premium: true, completada: false },
      { id: 10, titulo: 'Leer líneas: cuándo se mueve una cuota', descripcion: 'El movimiento de líneas te dice más que cualquier tipster', duracion: '10 min', nivel: 'Avanzado', icono: '📈', premium: true, completada: false },
      { id: 11, titulo: 'Apuestas en vivo: ventajas y trampas', descripcion: 'Cuándo el live betting tiene valor y cuándo es una trampa', duracion: '8 min', nivel: 'Intermedio', icono: '⚡', premium: true, completada: false },
      { id: 12, titulo: 'Combinadas: por qué (casi) nunca valen la pena', descripcion: 'Las matemáticas detrás de los parlays', duracion: '7 min', nivel: 'Intermedio', icono: '🔗', premium: false, completada: false },
    ],
  },
  {
    id: 4,
    titulo: 'Psicología del Apostador',
    descripcion: 'Tu peor enemigo no es la casa, eres tú mismo',
    icono: '🧘',
    color: '#A855F7',
    lecciones: [
      { id: 13, titulo: 'Los 7 sesgos que te hacen perder dinero', descripcion: 'Confirmation bias, gambler\'s fallacy y más', duracion: '10 min', nivel: 'Básico', icono: '🪤', premium: false, completada: false },
      { id: 14, titulo: 'Tilt: cómo detectarlo y frenarlo', descripcion: 'Señales de que estás apostando con emociones', duracion: '6 min', nivel: 'Básico', icono: '🔴', premium: false, completada: false },
      { id: 15, titulo: 'Disciplina: el hábito que separa ganadores de perdedores', descripcion: 'Rutinas y reglas de los apostadores profesionales', duracion: '8 min', nivel: 'Intermedio', icono: '🎖️', premium: true, completada: false },
      { id: 16, titulo: 'Juego responsable: cuándo parar', descripcion: 'Señales de alerta y recursos de ayuda', duracion: '5 min', nivel: 'Básico', icono: '🛑', premium: false, completada: false },
    ],
  },
];

const TIPS_RAPIDOS = [
  { icono: '🎯', titulo: 'Nunca apuestes más del 5% de tu banca en un solo evento' },
  { icono: '📊', titulo: 'Si una cuota parece "regalo", probablemente lo sea... para la casa' },
  { icono: '🧠', titulo: 'Apuesta por datos, nunca por corazón. Tu equipo favorito no siempre es la mejor apuesta' },
  { icono: '⏰', titulo: 'Las mejores cuotas aparecen al abrir las líneas, no minutos antes del partido' },
  { icono: '📝', titulo: 'Lleva registro de TODAS tus apuestas. Lo que no se mide, no se mejora' },
  { icono: '🔄', titulo: 'Las rachas existen. Baja stakes en malas rachas, sube (poco) en buenas' },
];

export default function AcademiaPage() {
  const [moduloAbierto, setModuloAbierto] = useState<number | null>(1);
  const [tipIndex, setTipIndex] = useState(0);

  const nivelColor = (nivel: string) => {
    switch (nivel) {
      case 'Básico': return { bg: 'rgba(0,209,178,0.1)', text: '#00D1B2', border: 'rgba(0,209,178,0.3)' };
      case 'Intermedio': return { bg: 'rgba(255,187,0,0.1)', text: '#FFBB00', border: 'rgba(255,187,0,0.3)' };
      case 'Avanzado': return { bg: 'rgba(239,68,68,0.1)', text: '#EF4444', border: 'rgba(239,68,68,0.3)' };
      default: return { bg: 'rgba(148,163,184,0.1)', text: '#94A3B8', border: 'rgba(148,163,184,0.3)' };
    }
  };

  const totalLecciones = MODULOS.reduce((acc, m) => acc + m.lecciones.length, 0);
  const leccionesCompletadas = MODULOS.reduce((acc, m) => acc + m.lecciones.filter(l => l.completada).length, 0);
  const leccionesGratis = MODULOS.reduce((acc, m) => acc + m.lecciones.filter(l => !l.premium).length, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* HEADER */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-3" style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(0,209,178,0.1))',
          border: '1px solid rgba(59,130,246,0.3)',
        }}>
          <GraduationCap className="w-4 h-4 text-[#3B82F6]" />
          <span className="text-sm font-bold text-[#3B82F6]">Academia NeuroTips</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Aprende a apostar con inteligencia</h1>
        <p className="text-[#94A3B8] text-sm mt-1">No te damos solo picks, te enseñamos a pensar como profesional</p>
      </div>

      {/* PROGRESO */}
      <div className="rounded-xl p-4" style={{
        background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(30,41,59,0.8))',
        border: '1px solid rgba(59,130,246,0.2)',
      }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: 'rgba(59,130,246,0.15)' }}>
              <BookOpen className="w-5 h-5 text-[#3B82F6]" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Tu progreso</p>
              <p className="text-[#94A3B8] text-xs">{leccionesCompletadas}/{totalLecciones} lecciones completadas</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[#3B82F6] font-mono">{Math.round((leccionesCompletadas / totalLecciones) * 100)}%</p>
          </div>
        </div>
        <div className="w-full h-2 bg-[#1E293B] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{
            width: `${(leccionesCompletadas / totalLecciones) * 100}%`,
            background: 'linear-gradient(90deg, #3B82F6, #00D1B2)',
          }} />
        </div>
      </div>

      {/* TIP DEL DÍA */}
      <div className="rounded-xl p-4 cursor-pointer" onClick={() => setTipIndex((tipIndex + 1) % TIPS_RAPIDOS.length)} style={{
        background: 'linear-gradient(135deg, rgba(255,187,0,0.08), rgba(30,41,59,0.8))',
        border: '1px solid rgba(255,187,0,0.2)',
      }}>
        <div className="flex items-start gap-3">
          <span className="text-2xl">{TIPS_RAPIDOS[tipIndex].icono}</span>
          <div className="flex-1">
            <p className="text-[#FFBB00] text-xs font-bold mb-1">💡 TIP RÁPIDO · Toca para ver otro</p>
            <p className="text-white text-sm font-medium">{TIPS_RAPIDOS[tipIndex].titulo}</p>
          </div>
        </div>
      </div>

      {/* MÓDULOS */}
      <div className="space-y-4">
        {MODULOS.map((modulo) => {
          const isOpen = moduloAbierto === modulo.id;
          const completadas = modulo.lecciones.filter(l => l.completada).length;
          
          return (
            <div key={modulo.id} className="rounded-xl overflow-hidden" style={{
              background: 'rgba(30,41,59,0.5)',
              border: `1px solid ${isOpen ? modulo.color + '40' : 'rgba(100,116,139,0.2)'}`,
            }}>
              {/* Módulo Header */}
              <button
                onClick={() => setModuloAbierto(isOpen ? null : modulo.id)}
                className="w-full flex items-center gap-4 p-4 text-left transition-all hover:bg-white/[0.02]"
              >
                <span className="text-2xl">{modulo.icono}</span>
                <div className="flex-1">
                  <p className="text-white font-bold text-sm">{modulo.titulo}</p>
                  <p className="text-[#94A3B8] text-xs mt-0.5">{modulo.descripcion}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-[#64748B]">{modulo.lecciones.length} lecciones</span>
                    <span className="text-[10px]" style={{ color: modulo.color }}>{completadas}/{modulo.lecciones.length} completadas</span>
                  </div>
                </div>
                <ChevronRight className={`h-5 w-5 text-[#64748B] transition-transform ${isOpen ? 'rotate-90' : ''}`} />
              </button>

              {/* Lecciones */}
              {isOpen && (
                <div className="border-t border-[#334155]/50 p-3 space-y-2">
                  {modulo.lecciones.map((leccion) => {
                    const nColor = nivelColor(leccion.nivel);
                    return (
                      <div key={leccion.id} className="flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-white/[0.03] cursor-pointer" style={{
                        opacity: leccion.premium ? 0.7 : 1,
                      }}>
                        {/* Estado */}
                        <div className="flex-shrink-0">
                          {leccion.completada ? (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,209,178,0.15)' }}>
                              <CheckCircle className="w-4 h-4 text-[#00D1B2]" />
                            </div>
                          ) : leccion.premium ? (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,187,0,0.1)' }}>
                              <Lock className="w-4 h-4 text-[#FFBB00]" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)' }}>
                              <Play className="w-4 h-4 text-[#3B82F6]" />
                            </div>
                          )}
                        </div>

                        {/* Contenido */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{leccion.icono}</span>
                            <p className="text-white text-sm font-medium truncate">{leccion.titulo}</p>
                          </div>
                          <p className="text-[#64748B] text-xs truncate mt-0.5">{leccion.descripcion}</p>
                        </div>

                        {/* Meta */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{
                            background: nColor.bg, color: nColor.text, border: `1px solid ${nColor.border}`,
                          }}>
                            {leccion.nivel}
                          </span>
                          <span className="text-[10px] text-[#64748B] flex items-center gap-1">
                            <Clock className="w-3 h-3" />{leccion.duracion}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* RESUMEN */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { valor: String(totalLecciones), label: 'Lecciones', icono: BookOpen, color: '#3B82F6' },
          { valor: String(leccionesGratis), label: 'Gratis', icono: CheckCircle, color: '#00D1B2' },
          { valor: '4', label: 'Módulos', icono: BarChart3, color: '#FFBB00' },
          { valor: '∞', label: 'Actualizaciones', icono: Zap, color: '#A855F7' },
        ].map((stat, i) => {
          const Icon = stat.icono;
          return (
            <div key={i} className="rounded-xl p-3 text-center" style={{
              background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(100,116,139,0.15)',
            }}>
              <Icon className="w-5 h-5 mx-auto mb-1" style={{ color: stat.color }} />
              <p className="text-white font-bold font-mono text-lg">{stat.valor}</p>
              <p className="text-[#64748B] text-[10px]">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* CTA PREMIUM */}
      <div className="rounded-xl p-5 text-center" style={{
        background: 'linear-gradient(135deg, rgba(255,187,0,0.1), rgba(249,115,22,0.05))',
        border: '1px solid rgba(255,187,0,0.25)',
      }}>
        <p className="text-[#FFBB00] font-bold text-sm mb-1">🔓 Desbloquea todas las lecciones</p>
        <p className="text-[#94A3B8] text-xs mb-3">Las lecciones premium incluyen estrategias avanzadas, análisis de líneas y el método Kelly completo</p>
        <a href="/dashboard/suscripcion" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition" style={{
          background: 'linear-gradient(135deg, #FFBB00, #F97316)', color: '#000',
        }}>
          Ver Planes Premium
          <ChevronRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
