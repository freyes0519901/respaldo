'use client';

/**
 * CombinadaLegs — Muestra cada selección de una combinada de forma clara
 * ============================================================================
 * ARCHIVO: src/components/CombinadaLegs.tsx
 * VERSIÓN: 1.1 — Parser mejorado para nuevos formatos de combinada
 *
 * FORMATOS SOPORTADOS:
 * 1. "COMBINADA: Equipo1 - Equipo2: Pick1 + Equipo3 - Equipo4: Pick2" (NUEVO)
 * 2. "COMBINADA: Pick1 + Pick2" (formato antiguo en BD)
 * 3. "Equipo1 - Equipo2 - Pick1, Equipo3 - Equipo4 - Pick2" (Gemini raw)
 * 4. Array selecciones[] directo del backend
 * 5. Fallback seguro → si no puede parsear, muestra texto original
 * ============================================================================
 */

import React from 'react';

// ═══════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════
interface Seleccion {
  partido: string;
  pick: string;
  cuota?: number;
  estado?: 'pendiente' | 'ganada' | 'perdida' | 'nula';
}

interface CombinadaLegsProps {
  textoApuesta: string;
  selecciones?: Seleccion[];
  cuotaTotal: number;
  resultado?: string;
  compact?: boolean;
}

// ═══════════════════════════════════════════════
// PARSER — Extrae selecciones del texto del backend
// ═══════════════════════════════════════════════
/**
 * Patrones de picks conocidos para separar partido de selección.
 * Orden importa: más específicos primero.
 */
const PICK_PATTERNS = /\b(Apuesta sin [Ee]mpate|Draw [Nn]o [Bb]et|DNB|Gana (?:local|visitante|cualquiera)|Gana\b|Ganador\b|Más de \d|Menos de \d|Más \d|Menos \d|Over \d|Under \d|Ambos [Mm]arcan|Ambos [Nn]o|BTTS|Handicap|Hándicap|Empate\b|Draw\b|Doble oportunidad|1X|X2|Resultado exacto|Primer gol|Anytime)/i;

function parseCombinadaText(texto: string): Seleccion[] {
  if (!texto || typeof texto !== 'string') return [];

  // Limpiar prefijo "COMBINADA (N) - " o "COMBINADA: "
  let cleaned = texto
    .replace(/^COMBINADA\s*\(\d+\)\s*[-–—]\s*/i, '')
    .replace(/^COMBINADA:\s*/i, '')
    .trim();

  // === Intentar split por " + " (formato BD estándar) ===
  let parts = cleaned.split(/\s*\+\s*/);

  // === Si no funcionó, intentar por ", " cuando hay patrón de equipos ===
  if (parts.length <= 1) {
    // Solo splitear por ", " si cada parte parece tener equipos (contiene " - ")
    const commaParts = cleaned.split(/,\s+/);
    if (commaParts.length >= 2 && commaParts.every(p => p.includes(' - '))) {
      parts = commaParts;
    }
  }

  if (parts.length <= 1) {
    return [{ partido: cleaned, pick: '' }];
  }

  return parts.map(part => parseSingleLeg(part.trim()));
}

/**
 * Parsea una pierna individual de la combinada.
 * Maneja múltiples formatos:
 * - "Racing Santander - CD Mirandes: Apuesta sin Empate" (nuevo: con ":")
 * - "Racing Santander - CD Mirandes - Apuesta sin Empate" (Gemini: con " - ")
 * - "Racing Santander Apuesta sin Empate" (antiguo: solo pick)
 * - "Más 1.5 Goles" (antiguo: solo pick sin partido)
 */
function parseSingleLeg(text: string): Seleccion {
  // 1. Intentar separar por ": " (formato nuevo)
  const lastColon = text.lastIndexOf(': ');
  if (lastColon > 3 && lastColon < text.length - 2) {
    return {
      partido: text.substring(0, lastColon).trim(),
      pick: text.substring(lastColon + 2).trim(),
    };
  }

  // 2. Buscar patrón de pick conocido en el texto
  const match = text.match(PICK_PATTERNS);
  if (match && match.index && match.index > 5) {
    const partido = text.substring(0, match.index).trim().replace(/[-–—]\s*$/, '').trim();
    const pick = text.substring(match.index).trim();
    return { partido, pick };
  }

  // 3. Si tiene formato "Eq1 - Eq2 - Pick" (3+ segmentos con " - ")
  const segments = text.split(' - ');
  if (segments.length >= 3) {
    // Los primeros 2 son equipos, el resto es el pick
    const partido = segments.slice(0, 2).join(' - ').trim();
    const pick = segments.slice(2).join(' - ').trim();
    return { partido, pick };
  }

  // 4. Fallback: todo es pick (formato antiguo sin partido)
  return { partido: '', pick: text };
}

// ═══════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════
export default function CombinadaLegs({
  textoApuesta,
  selecciones,
  cuotaTotal,
  resultado,
  compact = false,
}: CombinadaLegsProps) {
  const legs: Seleccion[] = selecciones && selecciones.length > 0
    ? selecciones
    : parseCombinadaText(textoApuesta);

  if (legs.length <= 1 && !selecciones?.length) {
    return (
      <p className="text-white font-medium text-[15px] mb-2 leading-snug">
        {textoApuesta}
      </p>
    );
  }

  return (
    <div
      className={`rounded-lg overflow-hidden ${compact ? 'my-1' : 'my-2'}`}
      style={{
        border: '1px solid rgba(255, 107, 157, 0.12)',
        background: 'rgba(255, 107, 157, 0.02)',
      }}
    >
      {/* ── Header badge ── */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: compact ? '5px 10px' : '6px 12px',
          background: 'rgba(255, 107, 157, 0.06)',
          borderBottom: '1px solid rgba(255, 107, 157, 0.08)',
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="font-extrabold tracking-wider"
            style={{
              fontSize: '9px',
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'rgba(255, 107, 157, 0.15)',
              color: '#FF6B9D',
              letterSpacing: '0.05em',
            }}
          >
            COMBINADA
          </span>
          <span className="text-[10px] text-slate-500">
            {legs.length} selecciones
          </span>
        </div>
        <span
          className="font-mono font-extrabold"
          style={{
            fontSize: compact ? '12px' : '14px',
            color: '#FF6B9D',
          }}
        >
          @{Number(cuotaTotal || 0).toFixed(2)}
        </span>
      </div>

      {/* ── Individual legs ── */}
      {legs.map((leg, i) => {
        const estado = leg.estado || (resultado === 'GANADA' ? 'ganada' : resultado === 'PERDIDA' ? 'perdida' : resultado === 'NULA' ? 'nula' : 'pendiente');
        const estadoConfig = {
          ganada: { icon: '✓', color: '#22C55E', label: 'Acierto' },
          perdida: { icon: '✗', color: '#EF4444', label: 'Fallo' },
          nula: { icon: '–', color: '#94A3B8', label: 'Nula' },
          pendiente: { icon: '⏳', color: '#00D1FF', label: 'Pendiente' },
        };
        const ec = estadoConfig[estado] || estadoConfig.pendiente;

        return (
          <div
            key={i}
            className="flex items-center gap-2"
            style={{
              padding: compact ? '6px 10px' : '8px 12px',
              borderBottom: i < legs.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
            }}
          >
            {/* Leg number */}
            <div
              className="flex-shrink-0 flex items-center justify-center font-mono font-extrabold"
              style={{
                width: compact ? '20px' : '24px',
                height: compact ? '20px' : '24px',
                borderRadius: '6px',
                background: 'rgba(255, 107, 157, 0.08)',
                border: '1px solid rgba(255, 107, 157, 0.15)',
                fontSize: compact ? '9px' : '10px',
                color: '#FF6B9D',
              }}
            >
              {i + 1}
            </div>

            {/* Match + Pick */}
            <div className="flex-1 min-w-0">
              {leg.partido ? (
                <>
                  <p
                    className="font-semibold text-white leading-snug truncate"
                    style={{ fontSize: compact ? '11px' : '12px' }}
                  >
                    {leg.partido}
                  </p>
                  <p
                    className="font-medium mt-0.5"
                    style={{
                      fontSize: compact ? '10px' : '11px',
                      color: '#00D1FF',
                    }}
                  >
                    {leg.pick}
                  </p>
                </>
              ) : (
                <p
                  className="font-semibold leading-snug"
                  style={{
                    fontSize: compact ? '11px' : '12px',
                    color: '#00D1FF',
                  }}
                >
                  {leg.pick || leg.partido}
                </p>
              )}
            </div>

            {/* Cuota individual + Estado */}
            <div className="flex-shrink-0 text-right">
              {leg.cuota && (
                <span
                  className="font-mono font-bold block"
                  style={{
                    fontSize: compact ? '11px' : '12px',
                    color: '#00D1FF',
                  }}
                >
                  @{leg.cuota.toFixed(2)}
                </span>
              )}
              <span
                className="flex items-center justify-end gap-1 font-bold"
                style={{
                  fontSize: '9px',
                  color: ec.color,
                  marginTop: leg.cuota ? '2px' : '0',
                }}
              >
                <span>{ec.icon}</span>
                <span>{ec.label}</span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════
// HELPER — Detecta si una apuesta es combinada
// ═══════════════════════════════════════════════
export function esCombinada(apuesta: { tipo_mercado?: string; apuesta?: string }): boolean {
  if (apuesta.tipo_mercado === 'COMBINADAS') return true;
  if (apuesta.tipo_mercado?.toUpperCase().includes('COMBI')) return true;
  if (apuesta.apuesta?.startsWith('COMBINADA:')) return true;
  if (apuesta.apuesta?.includes(' + ') && apuesta.apuesta.split(' + ').length >= 2) return true;
  return false;
}
