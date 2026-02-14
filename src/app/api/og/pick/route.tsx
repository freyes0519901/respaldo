import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  if (p.get('token') !== (process.env.OG_SECRET || 'NT_OG_2026')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const tipo = p.get('tipo') || 'free';
  const tipster = p.get('tipster') || 'Tipster';
  const apuesta = p.get('apuesta') || '';
  const cuota = p.get('cuota') || '1.50';
  const mercado = p.get('mercado') || '';
  const hora = p.get('hora') || '';
  const efectividad = p.get('efectividad') || '';
  const rendimiento = p.get('rendimiento') || '';
  const racha = p.get('racha') || '';
  const zona = p.get('zona') || '';
  const cert = p.get('cert') === '1';
  const deporte = p.get('deporte') || '';
  const neuroscore = p.get('neuroscore') || '';
  const platform = p.get('platform') || 'telegram';

  const isVip = tipo === 'vip';
  const isTG = platform === 'telegram';
  const W = isTG ? 1080 : 1600;
  const H = isTG ? 600 : 900;

  const accent = isVip ? '#B45309' : '#2563EB';
  const accentDark = isVip ? '#92400E' : '#1E3A5F';
  const accentMid = isVip ? '#D97706' : '#3B82F6';
  const accentLight = isVip ? '#FEF3C7' : '#DBEAFE';
  const headerGrad = isVip
    ? `linear-gradient(135deg, #92400E, #B45309)`
    : `linear-gradient(135deg, #1E3A5F, #2563EB)`;

  const zonaColor = zona === 'ORO' ? '#B45309' : zona === 'PLATA' ? '#64748B' : '#2563EB';
  const zonaBg = zona === 'ORO' ? '#FEF3C7' : zona === 'PLATA' ? '#F1F5F9' : '#DBEAFE';

  const seed = parseInt(p.get('seed') || String(Date.now() % 100));
  const frases = ['6 filtros de IA aplicados','Analizado por IA. Verificado por datos.','No es corazonada, son datos.','Probabilidad vs cuota: ventaja.'];
  const frase = frases[seed % frases.length];

  return new ImageResponse(
    (
      <div style={{
        width: `${W}px`, height: `${H}px`, display: 'flex', flexDirection: 'column',
        backgroundColor: 'white', fontFamily: 'system-ui, sans-serif',
      }}>

        {/* HEADER 56px */}
        <div style={{
          display: 'flex', width: '100%', height: '56px',
          background: headerGrad,
          alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>NEUR</span>
            <span style={{ fontSize: 16, margin: '0 3px' }}>🧠</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>TIPS</span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {cert && (
              <div style={{ display: 'flex', padding: '4px 12px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.95)' }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: '#16A34A' }}>CERT. IA</span>
              </div>
            )}
            <div style={{ display: 'flex', padding: '4px 14px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.95)' }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: accent }}>{isVip ? 'VIP' : 'FREE'}</span>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div style={{
          display: 'flex', flex: 1, flexDirection: 'row',
          padding: '20px 28px 14px',
          gap: '24px',
        }}>

          {/* LEFT */}
          <div style={{
            display: 'flex', flexDirection: 'column', flex: 1,
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: '#111' }}>{tipster}</span>
              </div>

              {(deporte || mercado || hora) && (
                <span style={{ fontSize: 12, color: '#64748B', marginBottom: '8px' }}>
                  {deporte || mercado}{hora ? ` · ${hora}` : ''}
                </span>
              )}

              <div style={{
                display: 'flex', padding: '10px 14px',
                borderRadius: '8px', backgroundColor: '#F8FAFC',
                borderLeft: `3px solid ${accent}`,
                marginBottom: '10px',
              }}>
                <span style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.35, color: '#1E293B' }}>
                  {apuesta.length > 75 ? apuesta.substring(0, 72) + '...' : apuesta}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {efectividad && (
                  <div style={{ display: 'flex', padding: '3px 10px', borderRadius: '12px', backgroundColor: '#DCFCE7' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#15803D' }}>WR {efectividad}%</span>
                  </div>
                )}
                {rendimiento && (
                  <div style={{ display: 'flex', padding: '3px 10px', borderRadius: '12px', backgroundColor: '#DBEAFE' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#1D4ED8' }}>ROI {rendimiento}</span>
                  </div>
                )}
                {racha && parseInt(racha) > 0 && (
                  <div style={{ display: 'flex', padding: '3px 10px', borderRadius: '12px', backgroundColor: '#FEF3C7' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#92400E' }}>{racha} seguidas</span>
                  </div>
                )}
              </div>
            </div>

            <span style={{ fontSize: 12, fontWeight: 500, fontStyle: 'italic', color: '#94A3B8' }}>
              {frase}
            </span>
          </div>

          {/* RIGHT — cuota + zona */}
          <div style={{
            display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'flex-end',
            gap: '8px', minWidth: '160px',
          }}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '14px 24px', borderRadius: '10px',
              backgroundColor: accentLight, border: `2px solid ${accent}20`,
              width: '100%',
            }}>
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '1.5px', color: '#94A3B8' }}>CUOTA</span>
              <span style={{
                fontSize: 42, fontWeight: 900, color: accent,
                letterSpacing: '-2px', lineHeight: 1,
              }}>{cuota}</span>
            </div>

            {zona && (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '10px 20px', borderRadius: '10px',
                backgroundColor: zonaBg, border: `2px solid ${zonaColor}20`,
                width: '100%',
              }}>
                <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '1.5px', color: '#94A3B8' }}>ZONA</span>
                <span style={{ fontSize: 22, fontWeight: 900, color: zonaColor }}>
                  {zona === 'ORO' ? 'ORO' : zona}
                </span>
              </div>
            )}

            {neuroscore && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                padding: '6px 16px', borderRadius: '8px',
                backgroundColor: '#DCFCE7', width: '100%',
              }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8' }}>NS</span>
                <span style={{ fontSize: 20, fontWeight: 900, color: '#15803D' }}>{neuroscore}</span>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER 38px */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0 28px', height: '38px',
          backgroundColor: '#F8FAFC', borderTop: '1px solid #F1F5F9',
        }}>
          <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>
            +1000 analisis verificados · neurotips.io
          </span>
          <div style={{
            display: 'flex', padding: '4px 12px', borderRadius: '12px',
            backgroundColor: accent,
          }}>
            <span style={{ fontSize: 10, fontWeight: 900, color: 'white' }}>
              {isVip ? 'Solo VIP' : '5 dias gratis'}
            </span>
          </div>
        </div>

        <div style={{
          display: 'flex', width: '100%', height: '4px',
          background: `linear-gradient(90deg, ${accentDark}, ${accent}, ${accentMid})`,
        }} />
      </div>
    ),
    { width: W, height: H }
  );
}
