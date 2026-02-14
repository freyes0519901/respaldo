import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  if (p.get('token') !== (process.env.OG_SECRET || 'NT_OG_2026')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const resultado = (p.get('resultado') || 'GANADA').toUpperCase();
  const tipster = p.get('tipster') || 'Tipster';
  const apuesta = p.get('apuesta') || '';
  const cuota = p.get('cuota') || '1.50';
  const racha = p.get('racha') || '';
  const efectividad = p.get('efectividad') || '';
  const rendimiento = p.get('rendimiento') || '';
  const cert = p.get('cert') === '1';
  const platform = p.get('platform') || 'telegram';

  const isWin = resultado === 'GANADA' || resultado === 'GREEN';
  const isLoss = resultado === 'PERDIDA' || resultado === 'RED';
  const isTG = platform === 'telegram';
  const W = isTG ? 1080 : 1600;
  const H = isTG ? 600 : 900;

  const seed = parseInt(p.get('seed') || String(Date.now() % 100));
  const fW = ['La IA lo detecto. El mercado lo confirmo.','Analizado. Filtrado. Verificado. Cobrado.','No fue suerte. Fueron datos.','Datos > corazonadas. Siempre.'];
  const fL = ['Publicamos todo. Sin filtro.','La varianza existe. La transparencia tambien.','Resultados 100% publicos.'];
  const frase = isWin ? fW[seed % fW.length] : fL[seed % fL.length];

  const green1 = '#15803D'; const green2 = '#16A34A'; const green3 = '#22C55E';
  const red1 = '#991B1B'; const red2 = '#DC2626'; const red3 = '#EF4444';

  const accent = isWin ? green2 : isLoss ? red2 : '#6B7280';
  const accentDark = isWin ? green1 : isLoss ? red1 : '#374151';
  const accentLight = isWin ? '#DCFCE7' : isLoss ? '#FEE2E2' : '#F3F4F6';
  const headerGrad = isWin
    ? `linear-gradient(135deg, ${green1}, ${green2})`
    : isLoss
    ? `linear-gradient(135deg, ${red1}, ${red2})`
    : 'linear-gradient(135deg, #374151, #6B7280)';
  const tagLabel = isWin ? 'ACIERTO' : isLoss ? 'FALLO' : 'NULA';
  const tagIcon = isWin ? '✅' : isLoss ? '❌' : '⚪';

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
            <span style={{ fontSize: 22, fontWeight: 900, color: 'white', letterSpacing: '-0.5px' }}>NEUR</span>
            <span style={{ fontSize: 16, margin: '0 3px' }}>🧠</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: 'white', letterSpacing: '-0.5px' }}>TIPS</span>
          </div>
          <div style={{
            display: 'flex', padding: '4px 16px',
            borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.95)',
          }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: accent }}>{tagIcon} {tagLabel}</span>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: '#111' }}>{tipster}</span>
                {cert && (
                  <span style={{
                    fontSize: 10, fontWeight: 800, color: green2,
                    backgroundColor: '#DCFCE7', padding: '2px 8px', borderRadius: '8px',
                  }}>CERT. IA</span>
                )}
              </div>

              <div style={{
                display: 'flex', padding: '10px 14px',
                borderRadius: '8px', backgroundColor: '#F8FAFC',
                borderLeft: `3px solid ${accent}`,
                marginBottom: '10px',
              }}>
                <span style={{
                  fontSize: 15, fontWeight: 600, lineHeight: 1.35,
                  color: isLoss ? '#94A3B8' : '#1E293B',
                }}>
                  {apuesta.length > 75 ? apuesta.substring(0, 72) + '...' : apuesta}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {efectividad && (
                  <div style={{ display: 'flex', padding: '3px 10px', borderRadius: '12px', backgroundColor: accentLight }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: accent }}>WR {efectividad}%</span>
                  </div>
                )}
                {rendimiento && (
                  <div style={{ display: 'flex', padding: '3px 10px', borderRadius: '12px', backgroundColor: '#DBEAFE' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#1D4ED8' }}>ROI {rendimiento}</span>
                  </div>
                )}
                {racha && parseInt(racha) >= 3 && isWin && (
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

          {/* RIGHT — SOLO CUOTA */}
          <div style={{
            display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center',
            gap: '10px', minWidth: '180px',
          }}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '20px 32px', borderRadius: '14px',
              backgroundColor: accentLight, border: `2px solid ${accent}30`,
              width: '100%',
            }}>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '2px', color: '#94A3B8' }}>CUOTA</span>
              <span style={{
                fontSize: 48, fontWeight: 900, color: isLoss ? '#CBD5E1' : accent,
                letterSpacing: '-2px', lineHeight: 1, marginTop: '4px',
              }}>{cuota}</span>
            </div>

            {racha && parseInt(racha) >= 3 && isWin && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '8px 20px', borderRadius: '10px',
                backgroundColor: '#FEF3C7', border: '2px solid #FDE68A',
                width: '100%',
              }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#92400E' }}>{racha} seguidas</span>
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
            neurotips.io · Verificado por IA
          </span>
          <div style={{
            display: 'flex', padding: '4px 12px', borderRadius: '12px',
            backgroundColor: accent,
          }}>
            <span style={{ fontSize: 10, fontWeight: 900, color: 'white' }}>
              {isWin ? 'Unete VIP' : 'Resultados publicos'}
            </span>
          </div>
        </div>

        <div style={{
          display: 'flex', width: '100%', height: '4px',
          background: `linear-gradient(90deg, ${accentDark}, ${accent}, ${isWin ? green3 : isLoss ? red3 : '#9CA3AF'})`,
        }} />
      </div>
    ),
    { width: W, height: H }
  );
}
