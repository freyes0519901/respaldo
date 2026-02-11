import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  if (!process.env.OG_SECRET || p.get('token') !== process.env.OG_SECRET) return new Response('Unauthorized', { status: 401 });

  const tipster = p.get('tipster') || 'Tipster';
  const apuesta = p.get('apuesta') || 'Apuesta';
  const cuota = p.get('cuota') || '1.50';
  const resultado = p.get('resultado') || 'ganada';
  const ganancia = p.get('ganancia') || '';
  const efectividad = p.get('efectividad') || '';
  const racha = p.get('racha') || '';
  const deporte = p.get('deporte') || 'Fútbol';

  const win = resultado.toLowerCase() === 'ganada';
  const dEmoji = deporte.toLowerCase().includes('tenis') ? '🎾' : (deporte.toLowerCase().includes('basket') || deporte.toLowerCase().includes('nba')) ? '🏀' : '⚽';
  const gradient = win ? 'linear-gradient(135deg, #059669, #22C55E, #4ADE80)' : 'linear-gradient(135deg, #DC2626, #EF4444, #F87171)';

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#0F172A' }}>
        <div style={{ display: 'flex', flexDirection: 'column', background: gradient, padding: '10px 14px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>NEUR</span>
            <span style={{ fontSize: 12 }}>🧠</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>TIPS</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'white', marginLeft: 8, textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>{win ? '✓ ¡ACIERTO!' : '✗ FALLO'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.85)', fontWeight: 600, letterSpacing: '1px' }}>RESULTADO</span>
            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.7)' }}>neurotips.io</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '10px 14px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 13, color: '#22D3EE', fontWeight: 700 }}>{tipster}</span>
            <span style={{ fontSize: 9, color: '#94A3B8' }}>{dEmoji}</span>
          </div>
          <div style={{ display: 'flex', fontSize: 11, color: '#94A3B8', marginBottom: 8, lineHeight: 1.3 }}>
            {apuesta.length > 60 ? apuesta.substring(0, 60) + '…' : apuesta}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#22D3EE' }}>@{cuota}</span>
            {ganancia && <span style={{ fontSize: 14, fontWeight: 700, color: win ? '#4ADE80' : '#EF4444' }}>{ganancia}</span>}
            {efectividad && <span style={{ fontSize: 10, color: '#94A3B8' }}>Efect. {efectividad}%</span>}
            {racha && <span style={{ fontSize: 10, color: '#94A3B8' }}>Racha {racha}</span>}
          </div>
        </div>
      </div>
    ),
    { width: 400, height: 165, headers: { 'Cache-Control': 'public, max-age=600, s-maxage=600' } },
  );
}
