import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  if (!process.env.OG_SECRET || p.get('token') !== process.env.OG_SECRET) return new Response('Unauthorized', { status: 401 });

  const aciertos = p.get('aciertos') || '0';
  const fallos = p.get('fallos') || '0';
  const pendientes = p.get('pendientes') || '0';
  const ganancia = p.get('ganancia') || '+0.00u';
  const efectividad = p.get('efectividad') || '0';
  const neuroscore = p.get('neuroscore') || '';
  const fecha = p.get('fecha') || '';
  const tipo = p.get('tipo') || 'vip';

  const isVip = tipo === 'vip';

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#0F172A' }}>
        <div style={{ display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, #0891B2, #22D3EE, #4ADE80)', padding: '10px 14px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>NEUR</span>
            <span style={{ fontSize: 12 }}>🧠</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>TIPS</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.9)', fontWeight: 700, letterSpacing: '1px' }}>{isVip ? 'CIERRE VIP' : 'CIERRE FREE'}</span>
            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.7)' }}>{fecha || 'neurotips.io'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '10px 14px 8px' }}>
          <div style={{ display: 'flex', gap: 3, marginBottom: 6 }}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '6px 8px', background: 'rgba(34,197,94,0.08)', borderRadius: 6, alignItems: 'center', border: '1px solid rgba(34,197,94,0.2)' }}>
              <span style={{ fontSize: 7, color: '#94A3B8', letterSpacing: '0.5px' }}>ACIERTOS</span>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#4ADE80' }}>{aciertos}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '6px 8px', background: 'rgba(239,68,68,0.08)', borderRadius: 6, alignItems: 'center', border: '1px solid rgba(239,68,68,0.2)' }}>
              <span style={{ fontSize: 7, color: '#94A3B8', letterSpacing: '0.5px' }}>FALLOS</span>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#EF4444' }}>{fallos}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '6px 8px', background: 'rgba(34,211,238,0.08)', borderRadius: 6, alignItems: 'center', border: '1px solid rgba(34,211,238,0.2)' }}>
              <span style={{ fontSize: 7, color: '#94A3B8', letterSpacing: '0.5px' }}>EFECT.</span>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#22D3EE' }}>{efectividad}%</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '6px 8px', background: '#1E293B', borderRadius: 6, alignItems: 'center', border: '1px solid #334155' }}>
              <span style={{ fontSize: 7, color: '#94A3B8', letterSpacing: '0.5px' }}>GANANCIA</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: ganancia.startsWith('+') ? '#4ADE80' : '#EF4444' }}>{ganancia}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {parseInt(pendientes) > 0 && <span style={{ fontSize: 9, color: '#94A3B8' }}>⏳ {pendientes} pendientes</span>}
            {neuroscore && <span style={{ fontSize: 9, color: '#22D3EE', fontWeight: 600 }}>NeuroScore {neuroscore}</span>}
            <div style={{ display: 'flex', flex: 1 }} />
            <span style={{ fontSize: 8, color: '#64748B' }}>Transparencia total</span>
          </div>
        </div>
      </div>
    ),
    { width: 400, height: 175, headers: { 'Cache-Control': 'public, max-age=600, s-maxage=600' } },
  );
}
