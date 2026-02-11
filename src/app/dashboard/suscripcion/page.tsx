'use client';

import { useEffect, useState } from 'react';
import { Crown, Shield, CreditCard, Check, AlertCircle, Loader2 } from 'lucide-react';

interface PlanInfo { clp: number; usd: number; dias: number; label: string; }
interface VipInfo { clp: number; usd: number; picks: number; label: string; }
interface SuscripcionData {
  plan: string; suscripcion_hasta: string | null;
  suscripcion_activa: { plan: string; fecha_fin: string; metodo: string } | null;
  vip: { picks_disponibles: number; picks_usados_mes: number };
  historial_pagos: any[];
}

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function SuscripcionPage() {
  const [planes, setPlanes] = useState<Record<string, PlanInfo>>({});
  const [vipPacks, setVipPacks] = useState<Record<string, VipInfo>>({});
  const [suscripcion, setSuscripcion] = useState<SuscripcionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState('');
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [tab, setTab] = useState<'premium' | 'vip'>('premium');

  useEffect(() => {
    cargarDatos();
    const params = new URLSearchParams(window.location.search);
    if (params.get('pago') === 'completado') {
      setMensaje({ tipo: 'ok', texto: '¡Pago procesado! Tu plan se activará en unos segundos.' });
      setTimeout(() => cargarDatos(), 3000);
    }
  }, []);

  const cargarDatos = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const [planesRes, susRes] = await Promise.all([
        fetch(`${API}/api/planes`),
        fetch(`${API}/api/mi-suscripcion`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const planesData = await planesRes.json();
      setPlanes(planesData.suscripciones || {});
      setVipPacks(planesData.vip || {});
      const susData = await susRes.json();
      setSuscripcion(susData);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const iniciarPago = async (producto: string, metodo: 'KHIPU' | 'CRYPTO') => {
    setProcesando(`${producto}-${metodo}`);
    setMensaje(null);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${API}/api/pagos/crear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ producto, metodo }),
      });
      const data = await res.json();
      if (data.checkout_url) { window.location.href = data.checkout_url; }
      else { setMensaje({ tipo: 'error', texto: data.error || 'Error al crear el pago' }); }
    } catch (e) { setMensaje({ tipo: 'error', texto: 'Error de conexión' }); }
    finally { setProcesando(''); }
  };

  const isPremium = suscripcion?.plan === 'PREMIUM' && suscripcion?.suscripcion_hasta;
  const diasRestantes = isPremium && suscripcion?.suscripcion_hasta
    ? Math.max(0, Math.ceil((new Date(suscripcion.suscripcion_hasta).getTime() - Date.now()) / 86400000)) : 0;

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-[#00D1B2]" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-3" style={{ background: 'linear-gradient(135deg, rgba(255,187,0,0.15), rgba(0,209,178,0.1))', border: '1px solid rgba(255,187,0,0.3)' }}>
          <Crown className="w-4 h-4 text-[#FFBB00]" /><span className="text-sm font-bold text-[#FFBB00]">Mi Suscripción</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Elige tu plan</h1>
        <p className="text-[#94A3B8] text-sm mt-1">Accede a pronósticos verificados por IA</p>
      </div>

      {isPremium && (
        <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, rgba(0,209,178,0.1), rgba(30,41,59,0.8))', border: '1px solid rgba(0,209,178,0.3)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: 'rgba(0,209,178,0.15)' }}><Shield className="w-5 h-5 text-[#00D1B2]" /></div>
              <div><p className="text-white font-bold">PREMIUM Activo</p><p className="text-[#94A3B8] text-xs">{suscripcion?.suscripcion_activa?.plan} · Vence {suscripcion?.suscripcion_hasta}</p></div>
            </div>
            <div className="text-right"><p className="text-2xl font-bold text-[#00D1B2] font-mono">{diasRestantes}</p><p className="text-[10px] text-[#94A3B8]">días restantes</p></div>
          </div>
        </div>
      )}

      {mensaje && (
        <div className={`rounded-xl p-3 flex items-center gap-2 ${mensaje.tipo === 'ok' ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
          {mensaje.tipo === 'ok' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}<span className="text-sm">{mensaje.texto}</span>
        </div>
      )}

      <div className="flex gap-2">
        {(['premium', 'vip'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{ background: tab === t ? (t === 'premium' ? 'linear-gradient(135deg, #00D1B2, #0EA5E9)' : 'linear-gradient(135deg, #FFBB00, #F97316)') : 'rgba(30,41,59,0.5)', color: tab === t ? (t === 'premium' ? '#FFF' : '#000') : '#94A3B8', border: `1px solid ${tab === t ? 'transparent' : 'rgba(100,116,139,0.3)'}` }}>
            {t === 'premium' ? '👑 Premium' : '🔥 Sala VIP'}
          </button>
        ))}
      </div>

      {tab === 'premium' && (
        <div className="space-y-4">
          <div className="rounded-xl p-4" style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(100,116,139,0.2)' }}>
            <p className="text-white font-bold text-sm mb-3">✅ Qué incluye Premium</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {['Todos los tipsters verificados','Picks con stakes calculados por IA','Alertas en tiempo real por Telegram','Gestión de banca con IA','Estadísticas avanzadas','Academia completa','Soporte prioritario'].map((f,i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-[#CBD5E1]"><Check className="w-3.5 h-3.5 text-[#00D1B2] flex-shrink-0" />{f}</div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(planes).map(([key, plan]) => {
              const popular = key === 'TRIMESTRAL';
              const ahorro = key === 'TRIMESTRAL' ? '13%' : key === 'ANUAL' ? '33%' : null;
              return (
                <div key={key} className="rounded-xl p-5 relative" style={{ background: popular ? 'linear-gradient(135deg, rgba(0,209,178,0.08), rgba(30,41,59,0.9))' : 'rgba(30,41,59,0.5)', border: popular ? '2px solid rgba(0,209,178,0.4)' : '1px solid rgba(100,116,139,0.2)' }}>
                  {popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'linear-gradient(135deg, #00D1B2, #0EA5E9)', color: '#FFF' }}>⭐ MÁS POPULAR</div>}
                  <p className="text-white font-bold text-lg mb-1">{plan.label}</p>
                  <p className="text-[10px] text-[#94A3B8] mb-3">{plan.dias} días</p>
                  <div className="mb-4">
                    <p className="text-3xl font-bold text-white font-mono">${plan.clp.toLocaleString()}</p>
                    <p className="text-xs text-[#94A3B8]">CLP · o ${plan.usd} USDT</p>
                    {ahorro && <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/15 text-green-400 border border-green-500/30">Ahorra {ahorro}</span>}
                  </div>
                  <div className="space-y-2">
                    <button onClick={() => iniciarPago(key, 'KHIPU')} disabled={!!procesando}
                      className="w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: popular ? 'linear-gradient(135deg, #00D1B2, #0EA5E9)' : 'rgba(0,209,178,0.15)', color: popular ? '#FFF' : '#00D1B2', border: popular ? 'none' : '1px solid rgba(0,209,178,0.3)' }}>
                      {procesando === `${key}-KHIPU` ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CreditCard className="w-4 h-4" /> Transferencia 🇨🇱</>}
                    </button>
                    <button onClick={() => iniciarPago(key, 'CRYPTO')} disabled={!!procesando}
                      className="w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: 'rgba(255,187,0,0.1)', color: '#FFBB00', border: '1px solid rgba(255,187,0,0.3)' }}>
                      {procesando === `${key}-CRYPTO` ? <Loader2 className="w-4 h-4 animate-spin" /> : <>₿ Pagar con USDT</>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'vip' && (
        <div className="space-y-4">
          <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, rgba(255,187,0,0.08), rgba(30,41,59,0.8))', border: '1px solid rgba(255,187,0,0.3)' }}>
            <div className="flex items-center justify-between">
              <div><p className="text-[#FFBB00] font-bold text-sm">👑 Tu Saldo VIP</p><p className="text-white text-2xl font-bold font-mono mt-1">{suscripcion?.vip?.picks_disponibles || 0} picks</p><p className="text-[10px] text-[#94A3B8]">{suscripcion?.vip?.picks_usados_mes || 0}/5 usados este mes</p></div>
              <div className="text-4xl">🔥</div>
            </div>
          </div>
          <div className="rounded-xl p-4" style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(100,116,139,0.2)' }}>
            <p className="text-white font-bold text-sm mb-2">🌟 Picks exclusivos VIP</p>
            <p className="text-[#94A3B8] text-xs leading-relaxed">Estos picks vienen de tipsters internacionales que cobran $20-50 USD por pronóstico. Nosotros los verificamos con nuestra IA y te los entregamos filtrados. Máximo 5 picks al mes para mantener la exclusividad.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(vipPacks).map(([key, pack]) => {
              const isBig = key === 'VIP_5';
              return (
                <div key={key} className="rounded-xl p-5 relative" style={{ background: isBig ? 'linear-gradient(135deg, rgba(255,187,0,0.08), rgba(30,41,59,0.9))' : 'rgba(30,41,59,0.5)', border: isBig ? '2px solid rgba(255,187,0,0.4)' : '1px solid rgba(100,116,139,0.2)' }}>
                  {isBig && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'linear-gradient(135deg, #FFBB00, #F97316)', color: '#000' }}>⭐ AHORRA 15%</div>}
                  <p className="text-white font-bold text-lg">{pack.label}</p>
                  <p className="text-[10px] text-[#94A3B8] mb-3">{isBig ? 'Todos los picks del mes' : 'Un pick exclusivo'}</p>
                  <div className="mb-4"><p className="text-3xl font-bold text-white font-mono">${pack.clp.toLocaleString()}</p><p className="text-xs text-[#94A3B8]">CLP · o ${pack.usd} USDT</p></div>
                  <div className="space-y-2">
                    <button onClick={() => iniciarPago(key, 'KHIPU')} disabled={!!procesando}
                      className="w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: isBig ? 'linear-gradient(135deg, #FFBB00, #F97316)' : 'rgba(255,187,0,0.15)', color: isBig ? '#000' : '#FFBB00', border: isBig ? 'none' : '1px solid rgba(255,187,0,0.3)' }}>
                      {procesando === `${key}-KHIPU` ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CreditCard className="w-4 h-4" /> Transferencia 🇨🇱</>}
                    </button>
                    <button onClick={() => iniciarPago(key, 'CRYPTO')} disabled={!!procesando}
                      className="w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: 'rgba(0,209,178,0.1)', color: '#00D1B2', border: '1px solid rgba(0,209,178,0.3)' }}>
                      {procesando === `${key}-CRYPTO` ? <Loader2 className="w-4 h-4 animate-spin" /> : <>₿ USDT</>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {suscripcion?.historial_pagos && suscripcion.historial_pagos.length > 0 && (
        <div className="rounded-xl p-4" style={{ background: 'rgba(30,41,59,0.3)', border: '1px solid rgba(100,116,139,0.15)' }}>
          <p className="text-white font-bold text-sm mb-3">📋 Historial de pagos</p>
          <div className="space-y-2">
            {suscripcion.historial_pagos.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                <div><p className="text-white text-sm font-medium">{p.plan || p.tipo}</p><p className="text-[10px] text-[#94A3B8]">{p.metodo === 'FLOW' ? 'Khipu' : 'Crypto'} · {p.fecha?.slice(0, 10)}</p></div>
                <div className="text-right">
                  <p className="text-white text-sm font-mono">{p.metodo === 'FLOW' ? `$${p.monto_clp?.toLocaleString()} CLP` : `$${p.monto_usd} USDT`}</p>
                  <span className={`text-[10px] font-bold ${p.estado === 'COMPLETADO' ? 'text-green-400' : p.estado === 'PENDIENTE' ? 'text-yellow-400' : 'text-red-400'}`}>{p.estado}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
