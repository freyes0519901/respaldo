import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  if (!process.env.OG_SECRET || p.get('token') !== process.env.OG_SECRET) return new Response('Unauthorized', { status: 401 });

  const total = p.get('total') || '0';
  const certificados = p.get('certificados') || '0';
  const sinCert = p.get('sin_cert') || '0';
  const fecha = p.get('fecha') || '';
  const tipo = p.get('tipo') || 'vip';
  const picksRaw = p.get('picks') || '';

  const isVip = tipo === 'vip';

  let picks: { tipster: string; apuesta: string; cuota: string; hora: string; cert: boolean }[] = [];
  if (picksRaw) {
    picks = picksRaw.split(';').filter(Boolean).map(s => {
      const parts = s.split('|');
      return { tipster: parts[0] || '', apuesta: parts[1] || '', cuota: parts[2] || '', hora: parts[3] || '', cert: parts[4] === '1' };
    }).slice(0, 6);
  }

  const remaining = Math.max(0, parseInt(total) - picks.length);
  let h = 84 + 50;
  h += picks.length * 28 + 8;
  if (remaining > 0) h += 18;
  h += 8;
  h = Math.max(h, 180);

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#0F172A' }}>
        <div style={{ display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, #0891B2, #22D3EE, #4ADE80)', padding: '10px 14px 8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>NEUR</span>
              <span style={{ fontSize: 12 }}>🧠</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>TIPS</span>
            </div>
            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.7)' }}>{fecha || 'neurotips.io'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.9)', fontWeight: 700, letterSpacing: '1px' }}>{isVip ? 'CONSOLIDADO VIP' : 'CONSOLIDADO FREE'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '10px 14px 8px' }}>
          <div style={{ display: 'flex', gap: 3, marginBottom: 8 }}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '5px 8px', background: '#1E293B', borderRadius: 6, alignItems: 'center', border: '1px solid #334155' }}>
              <span style={{ fontSize: 7, color: '#94A3B8', letterSpacing: '0.5px' }}>TOTAL</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#22D3EE' }}>{total}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '5px 8px', background: 'rgba(34,197,94,0.08)', borderRadius: 6, alignItems: 'center', border: '1px solid rgba(34,197,94,0.2)' }}>
              <span style={{ fontSize: 7, color: '#94A3B8', letterSpacing: '0.5px' }}>CERT IA</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#4ADE80' }}>{certificados}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '5px 8px', background: '#1E293B', borderRadius: 6, alignItems: 'center', border: '1px solid #334155' }}>
              <span style={{ fontSize: 7, color: '#94A3B8', letterSpacing: '0.5px' }}>SIN CERT</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#94A3B8' }}>{sinCert}</span>
            </div>
          </div>
          {picks.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 8, color: '#64748B', letterSpacing: '1px', fontWeight: 600, marginBottom: 3 }}>DESTACADOS</span>
              {picks.map((pk, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 6px', background: i % 2 === 0 ? '#1E293B' : 'transparent', borderRadius: 3 }}>
                  <div style={{ width: 3, height: 18, borderRadius: 2, background: pk.cert ? '#4ADE80' : '#334155', flexShrink: 0 }} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: pk.cert ? '#4ADE80' : '#22D3EE', minWidth: 55, maxWidth: 62, overflow: 'hidden' }}>{pk.tipster.length > 10 ? pk.tipster.substring(0, 10) + '…' : pk.tipster}</span>
                  <span style={{ flex: 1, fontSize: 9, color: '#CBD5E1', overflow: 'hidden' }}>{pk.apuesta.length > 30 ? pk.apuesta.substring(0, 30) + '…' : pk.apuesta}</span>
                  <span style={{ fontSize: 10, fontWeight: 800, color: pk.cert ? '#4ADE80' : '#22D3EE', flexShrink: 0 }}>@{pk.cuota}</span>
                  <span style={{ fontSize: 8, color: '#64748B', flexShrink: 0 }}>{pk.hora}</span>
                </div>
              ))}
            </div>
          )}
          {remaining > 0 && <span style={{ fontSize: 9, color: '#64748B', marginTop: 4 }}>+{remaining} análisis más en neurotips.io</span>}
        </div>
      </div>
    ),
    { width: 400, height: h, headers: { 'Cache-Control': 'public, max-age=600, s-maxage=600' } },
  );
}
