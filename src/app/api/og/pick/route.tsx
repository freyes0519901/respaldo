import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// ══════════════════════════════════════════════════════════════
// NEUROTIPS OG — PICK (VIP / FREE)
// Diseño: Fintech Trust · Colores: Neuromarketing Science
// Branding: NEUR🧠TIPS (cyan + green matching logo)
// Tamaño: 1200 × 600-760px (HD para Telegram/WhatsApp)
// ══════════════════════════════════════════════════════════════

const CYAN = '#22D3EE';
const NGREEN = '#4ADE80';
const GOLD = '#EAB308';
const GREEN = '#22C55E';
const BLUE = '#3B82F6';
const NAVY = '#0F172A';
const CARD = '#1E293B';
const MUTED = '#64748B';
const TEXT = '#F8FAFC';

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  if (p.get('token') !== (process.env.OG_SECRET || 'NT_OG_2026')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const tipo = p.get('tipo') || 'vip';
  const tipster = p.get('tipster') || 'Tipster';
  const apuesta = p.get('apuesta') || 'Apuesta';
  const cuota = p.get('cuota') || '1.50';
  const mercado = p.get('mercado') || '';
  const hora = p.get('hora') || '';
  const efectividad = p.get('efectividad') || '';
  const rendimiento = p.get('rendimiento') || '';
  const racha = p.get('racha') || '';
  const ev = p.get('ev') || '';
  const prob = p.get('prob') || '';
  const zona = p.get('zona') || '';
  const certificado = p.get('cert') === '1';
  const stake = p.get('stake') || '';
  const deporte = p.get('deporte') || 'Fútbol';

  const isVip = tipo === 'vip';
  const deporteEmoji = deporte.toLowerCase().includes('tenis') ? '🎾' :
    (deporte.toLowerCase().includes('basket') || deporte.toLowerCase().includes('nba')) ? '🏀' : '⚽';

  // Detect combinada & parse legs
  const esCombinada = apuesta.toUpperCase().startsWith('COMBINADA');
  let legs: { partido: string; pick: string }[] = [];
  if (esCombinada) {
    const sinPrefix = apuesta.replace(/^COMBINADA[^:]*:\s*/i, '');
    legs = sinPrefix.split(/\s*\+\s*/).map(parte => {
      const idx = parte.lastIndexOf(':');
      if (idx > 0) return { partido: parte.substring(0, idx).trim(), pick: parte.substring(idx + 1).trim() };
      return { partido: parte.trim(), pick: '' };
    });
  }

  const height = esCombinada ? Math.min(560 + legs.length * 80, 840) : 600;

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: NAVY }}>
        {/* Accent bar — gradient matching logo */}
        <div style={{ display: 'flex', width: '100%', height: '5px', background: `linear-gradient(90deg, ${CYAN}, ${NGREEN})` }} />

        {/* Header: NEUR🧠TIPS | VIP + cert badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: 34, fontWeight: 800, color: CYAN, letterSpacing: '-0.5px' }}>NEUR</span>
            <span style={{ fontSize: 28 }}>🧠</span>
            <span style={{ fontSize: 34, fontWeight: 800, color: NGREEN, letterSpacing: '-0.5px' }}>TIPS</span>
            <div style={{ display: 'flex', width: '2px', height: 28, background: '#334155', margin: '0 12px' }} />
            <span style={{ fontSize: 16, color: isVip ? GOLD : '#94A3B8', letterSpacing: '3px', fontWeight: 700 }}>
              {isVip ? 'ANÁLISIS VIP' : 'ANÁLISIS FREE'}
            </span>
          </div>
          <div style={{
            display: 'flex', padding: '4px 20px', borderRadius: 10,
            background: certificado ? 'rgba(34,197,94,0.08)' : 'rgba(51,65,85,0.15)',
            border: `1px solid ${certificado ? 'rgba(34,197,94,0.25)' : 'rgba(51,65,85,0.3)'}`,
            fontSize: 16, fontWeight: 700, color: certificado ? GREEN : MUTED,
          }}>
            {certificado ? '✓ Certificado IA' : '○ Analizado'}
          </div>
        </div>

        {/* Main card */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, margin: '8px 28px 12px', padding: '20px 28px', borderRadius: 16, background: CARD }}>
          {/* Tipster + deporte */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: GOLD }}>{tipster}</span>
            <span style={{ fontSize: 18, color: MUTED }}>{deporteEmoji} {esCombinada ? 'COMBINADA' : (mercado || deporte.toUpperCase())}</span>
          </div>

          {/* Combinada legs OR simple */}
          {esCombinada && legs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', background: NAVY, borderRadius: 12, marginBottom: 16, overflow: 'hidden' }}>
              {legs.map((leg, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', padding: '14px 20px',
                  borderBottom: i < legs.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 32, height: 32, borderRadius: 6,
                    background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)',
                    fontSize: 16, color: GOLD, fontWeight: 800, marginRight: 16, flexShrink: 0,
                  }}>{i + 1}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <span style={{ fontSize: 20, fontWeight: 600, color: '#E2E8F0' }}>
                      {leg.partido.length > 50 ? leg.partido.substring(0, 50) + '…' : leg.partido}
                    </span>
                    {leg.pick && <span style={{ fontSize: 18, color: GREEN, fontWeight: 500 }}>
                      {leg.pick.length > 45 ? leg.pick.substring(0, 45) + '…' : leg.pick}
                    </span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', fontSize: 26, fontWeight: 600, lineHeight: 1.3, color: '#CBD5E1', marginBottom: 16 }}>
              {apuesta.length > 85 ? apuesta.substring(0, 85) + '…' : apuesta}
            </div>
          )}

          {/* Stats: Cuota | Mercado | Hora | Stake */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '14px 20px', background: NAVY, borderRadius: '12px 0 0 12px' }}>
              <span style={{ fontSize: 14, color: MUTED, letterSpacing: '1.5px' }}>{esCombinada ? 'CUOTA TOTAL' : 'CUOTA'}</span>
              <span style={{ fontSize: 42, fontWeight: 800, color: GOLD }}>{cuota}</span>
            </div>
            {hora ? <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '14px 20px', background: NAVY }}>
              <span style={{ fontSize: 14, color: MUTED, letterSpacing: '1.5px' }}>HORA CL</span>
              <span style={{ fontSize: 30, fontWeight: 700, color: TEXT }}>{hora}</span>
            </div> : null}
            {mercado && !esCombinada ? <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '14px 20px', background: NAVY }}>
              <span style={{ fontSize: 14, color: MUTED, letterSpacing: '1.5px' }}>MERCADO</span>
              <span style={{ fontSize: 22, fontWeight: 600, color: '#E2E8F0' }}>{mercado.length > 18 ? mercado.substring(0, 18) + '…' : mercado}</span>
            </div> : null}
            {stake ? <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '14px 20px', background: NAVY, borderRadius: '0 12px 12px 0' }}>
              <span style={{ fontSize: 14, color: MUTED, letterSpacing: '1.5px' }}>STAKE</span>
              <span style={{ fontSize: 30, fontWeight: 700, color: TEXT }}>{stake}</span>
            </div> : null}
          </div>

          {/* Metrics */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            {efectividad && <Dot color={GREEN} label={`${efectividad}%`} icon="📊" />}
            {rendimiento && <Dot color={BLUE} label={rendimiento} icon="📈" />}
            {racha && <Dot color={GOLD} label={`Racha ${racha}`} icon="🔥" />}
            {prob && <>
              <Dot color="#A78BFA" label={`IA ${prob}%`} icon="🧠" />
              {ev && <span style={{ fontSize: 18, fontWeight: 700, color: parseFloat(ev) >= 0 ? GREEN : '#EF4444' }}>EV {ev}%</span>}
            </>}
            {zona && <span style={{
              fontSize: 16, fontWeight: 600, padding: '3px 12px', borderRadius: 6,
              background: zona.toUpperCase() === 'ORO' ? 'rgba(234,179,8,0.08)' : 'rgba(148,163,184,0.06)',
              color: zona.toUpperCase() === 'ORO' ? GOLD : MUTED,
              border: `1px solid ${zona.toUpperCase() === 'ORO' ? 'rgba(234,179,8,0.2)' : 'rgba(148,163,184,0.12)'}`,
            }}>Zona {zona}</span>}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: '#475569' }}>neuro</span>
            <span style={{ fontSize: 14 }}>🧠</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: MUTED }}>tips</span>
            <span style={{ fontSize: 18, color: '#475569' }}>.io</span>
          </div>
          <span style={{ fontSize: 16, color: '#475569' }}>Verificado por IA</span>
        </div>
      </div>
    ),
    { width: 1200, height },
  );
}

// Helper component
function Dot({ color, label, icon }: { color: string; label: string; icon?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      {icon ? <span style={{ fontSize: 14 }}>{icon}</span> : 
        <div style={{ display: 'flex', width: 8, height: 8, borderRadius: '50%', background: color }} />}
      <span style={{ fontSize: 18, color: '#94A3B8', fontWeight: 500 }}>{label}</span>
    </div>
  );
}
