'use client';

import { useEffect, useState } from 'react';
import { Crown, Lock, Unlock, AlertCircle, Loader2, Clock, Zap, ChevronRight, ShoppingCart, CreditCard, Bitcoin, Star } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || '';

interface PickVIP {
  id: number;
  deporte: string;
  liga: string;
  partido: string;
  pick_texto: string | null;
  cuota: number;
  hora_partido: string;
  fecha: string;
  confianza_ia: number;
  efectividad_tipster: number;
  resultado: string;
  desbloqueado: boolean;
}

export default function SalaVipPage() {
  const [picks, setPicks] = useState<PickVIP[]>([]);
  const [saldo, setSaldo] = useState({ picks_disponibles: 0, picks_usados_mes: 0 });
  const [stats, setStats] = useState({ efectividad: 0, total: 0, ganadas: 0 });
  const [loading, setLoading] = useState(true);
  const [desbloqueando, setDesbloqueando] = useState<number | null>(null);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [tab, setTab] = useState<'picks' | 'comprar'>('picks');

  useEffect(() => { cargarPicks(); }, []);

  const getToken = () => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('token') || localStorage.getItem('access_token') || '';
  };

  const cargarPicks = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API}/api/vip/picks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPicks(data.picks || []);
      setSaldo(data.saldo || { picks_disponibles: 0, picks_usados_mes: 0 });
      setStats(data.stats || { efectividad: 0, total: 0, ganadas: 0 });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const desbloquear = async (pickId: number) => {
    if (saldo.picks_disponibles <= 0) {
      setMensaje({ tipo: 'error', texto: 'No tienes picks disponibles. Compra un pack primero.' });
      setTab('comprar');
      return;
    }
    setDesbloqueando(pickId);
    setMensaje(null);
    try {
      const token = getToken();
      const res = await fetch(`${API}/api/vip/desbloquear/${pickId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success || data.pick_texto) {
        setPicks(prev => prev.map(p =>
          p.id === pickId ? { ...p, desbloqueado: true, pick_texto: data.pick_texto } : p
        ));
        setSaldo(prev => ({
          ...prev,
          picks_disponibles: Math.max(0, prev.picks_disponibles - 1),
          picks_usados_mes: prev.picks_usados_mes + 1,
        }));
        setMensaje({ tipo: 'ok', texto: '¡Pick desbloqueado!' });
      } else {
        setMensaje({ tipo: 'error', texto: data.error || 'Error al desbloquear' });
      }
    } catch (e) {
      setMensaje({ tipo: 'error', texto: 'Error de conexión' });
    } finally {
      setDesbloqueando(null);
    }
  };

  const comprarPack = async (producto: string, metodo: string) => {
    const key = `${producto}-${metodo}`;
    setProcesando(key);
    setMensaje(null);
    try {
      const token = getToken();
      const res = await fetch(`${API}/api/pagos/crear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ producto, metodo }),
      });
      const data = await res.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        setMensaje({ tipo: 'error', texto: data.error || 'Error al crear pago' });
      }
    } catch (e) {
      setMensaje({ tipo: 'error', texto: 'Error de conexión' });
    } finally {
      setProcesando(null);
    }
  };

  const getDeporteIcon = (d: string) => {
    const m: Record<string, string> = {
      Futbol: '⚽', Tenis: '🎾', NBA: '🏀', Baloncesto: '🏀', Hockey: '🏒', eSports: '🎮'
    };
    return m[d] || '🎯';
  };

  const renderEstrellas = (n: number) => '⭐'.repeat(Math.min(5, Math.max(1, n)));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#FFBB00]" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* HEADER */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-2" style={{
          background: 'linear-gradient(135deg, rgba(255, 187, 0, 0.15), rgba(249, 115, 22, 0.1))',
          border: '1px solid rgba(255, 187, 0, 0.3)',
        }}>
          <Crown className="w-4 h-4 text-[#FFBB00]" />
          <span className="text-sm font-bold text-[#FFBB00]">Sala VIP</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Picks Exclusivos</h1>
        <p className="text-[#94A3B8] text-sm mt-1">Tipsters internacionales verificados por IA</p>
      </div>

      {/* SALDO + BARRA PROGRESO */}
      <div className="rounded-xl p-4" style={{
        background: 'linear-gradient(135deg, rgba(255, 187, 0, 0.08), rgba(30, 41, 59, 0.8))',
        border: '1px solid rgba(255, 187, 0, 0.3)',
      }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[#FFBB00] font-bold text-sm">📅 Picks VIP este mes</p>
            <p className="text-[#94A3B8] text-xs mt-0.5">
              {saldo.picks_usados_mes} de 5 usados · {saldo.picks_disponibles} disponibles
            </p>
          </div>
          <button onClick={() => setTab('comprar')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80"
            style={{ background: 'linear-gradient(135deg, #FFBB00, #F97316)', color: '#000' }}>
            <ShoppingCart className="w-3 h-3" /> Comprar
          </button>
        </div>
        <div className="w-full h-2.5 rounded-full" style={{ background: 'rgba(255, 187, 0, 0.1)' }}>
          <div className="h-full rounded-full transition-all duration-500" style={{
            width: `${Math.min(100, (saldo.picks_usados_mes / 5) * 100)}%`,
            background: 'linear-gradient(90deg, #FFBB00, #F97316)',
          }} />
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('picks')}
          className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
          style={{
            background: tab === 'picks' ? 'rgba(255,187,0,0.1)' : 'rgba(30,41,59,0.5)',
            border: tab === 'picks' ? '1px solid rgba(255,187,0,0.3)' : '1px solid rgba(100,116,139,0.15)',
            color: tab === 'picks' ? '#FFBB00' : '#64748B',
          }}
        >
          <Crown className="w-4 h-4" /> Picks VIP
        </button>
        <button
          onClick={() => setTab('comprar')}
          className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
          style={{
            background: tab === 'comprar' ? 'rgba(255,187,0,0.1)' : 'rgba(30,41,59,0.5)',
            border: tab === 'comprar' ? '1px solid rgba(255,187,0,0.3)' : '1px solid rgba(100,116,139,0.15)',
            color: tab === 'comprar' ? '#FFBB00' : '#64748B',
          }}
        >
          <ShoppingCart className="w-4 h-4" /> Comprar Picks
        </button>
      </div>

      {/* STATS */}
      {stats.total > 0 && tab === 'picks' && (
        <div className="rounded-xl p-3 flex items-center justify-around" style={{
          background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(100, 116, 139, 0.15)',
        }}>
          <div className="text-center">
            <p className="text-white font-bold font-mono">{stats.efectividad}%</p>
            <p className="text-[10px] text-[#94A3B8]">Efectividad</p>
          </div>
          <div className="w-px h-8" style={{ background: 'rgba(100, 116, 139, 0.2)' }} />
          <div className="text-center">
            <p className="text-[#00D1B2] font-bold font-mono">{stats.ganadas}</p>
            <p className="text-[10px] text-[#94A3B8]">Ganadas</p>
          </div>
          <div className="w-px h-8" style={{ background: 'rgba(100, 116, 139, 0.2)' }} />
          <div className="text-center">
            <p className="text-white font-bold font-mono">{stats.total}</p>
            <p className="text-[10px] text-[#94A3B8]">Total</p>
          </div>
        </div>
      )}

      {/* MENSAJE */}
      {mensaje && (
        <div className={`rounded-xl p-3 flex items-center gap-2 text-sm ${
          mensaje.tipo === 'ok'
            ? 'bg-green-500/10 border border-green-500/30 text-green-400'
            : 'bg-red-500/10 border border-red-500/30 text-red-400'
        }`}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {mensaje.texto}
        </div>
      )}

      {/* ============ TAB: PICKS VIP ============ */}
      {tab === 'picks' && (
        <>
          {picks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">🔮</p>
              <p className="text-white font-bold">No hay picks VIP disponibles ahora</p>
              <p className="text-[#94A3B8] text-sm mt-1">Los picks se publican durante el día</p>
            </div>
          ) : (
            <div className="space-y-4">
              {picks.map((pick) => (
                <div key={pick.id} className="rounded-xl overflow-hidden" style={{
                  background: pick.desbloqueado
                    ? 'linear-gradient(135deg, rgba(0, 209, 178, 0.06), rgba(30, 41, 59, 0.8))'
                    : 'linear-gradient(135deg, rgba(255, 187, 0, 0.04), rgba(30, 41, 59, 0.8))',
                  border: pick.desbloqueado
                    ? '1px solid rgba(0, 209, 178, 0.3)'
                    : '1px solid rgba(255, 187, 0, 0.2)',
                }}>
                  <div className="px-4 pt-4 pb-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg">{getDeporteIcon(pick.deporte)}</span>
                        <span className="text-white text-sm font-medium">{pick.liga}</span>
                        {pick.hora_partido && (
                          <span className="flex items-center gap-1 text-xs text-[#94A3B8] font-mono">
                            <Clock className="w-3 h-3" /> {pick.hora_partido}
                          </span>
                        )}
                      </div>
                      <span className="text-xs">{renderEstrellas(pick.confianza_ia)}</span>
                    </div>
                    
                    <p className="text-white font-bold text-sm">{pick.partido}</p>
                    
                    {pick.efectividad_tipster > 0 && (
                      <p className="text-[10px] text-[#94A3B8] mt-1">
                        Efectividad tipster: <span className="text-[#00D1B2] font-bold">{pick.efectividad_tipster}%</span>
                      </p>
                    )}
                  </div>

                  <div className="px-4 pb-4">
                    {pick.desbloqueado ? (
                      <div className="mt-2 p-3 rounded-lg" style={{
                        background: 'rgba(0, 209, 178, 0.08)', border: '1px solid rgba(0, 209, 178, 0.2)',
                      }}>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Unlock className="w-3.5 h-3.5 text-[#00D1B2]" />
                          <span className="text-[10px] font-bold text-[#00D1B2]">DESBLOQUEADO</span>
                        </div>
                        <p className="text-white font-bold">{pick.pick_texto}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-sm font-mono text-[#FFBB00] font-bold">@{pick.cuota?.toFixed(2)}</span>
                          {pick.resultado !== 'PENDIENTE' && (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                              pick.resultado === 'GANADA' ? 'bg-green-500/15 text-green-400' :
                              pick.resultado === 'PERDIDA' ? 'bg-red-500/15 text-red-400' : 'bg-gray-500/15 text-gray-400'
                            }`}>
                              {pick.resultado}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <div className="p-4 rounded-lg text-center" style={{
                          background: 'repeating-linear-gradient(45deg, rgba(255,187,0,0.03), rgba(255,187,0,0.03) 10px, transparent 10px, transparent 20px)',
                          border: '1px dashed rgba(255, 187, 0, 0.2)',
                        }}>
                          <Lock className="w-6 h-6 text-[#FFBB00] mx-auto mb-2 opacity-50" />
                          <p className="text-[#94A3B8] text-sm mb-3">Pick oculto</p>
                          
                          <button
                            onClick={() => desbloquear(pick.id)}
                            disabled={desbloqueando === pick.id || saldo.picks_disponibles <= 0}
                            className="px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 mx-auto transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                            style={{
                              background: saldo.picks_disponibles > 0
                                ? 'linear-gradient(135deg, #FFBB00, #F97316)'
                                : 'rgba(100, 116, 139, 0.3)',
                              color: saldo.picks_disponibles > 0 ? '#000' : '#94A3B8',
                            }}
                          >
                            {desbloqueando === pick.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : saldo.picks_disponibles > 0 ? (
                              <>
                                <Unlock className="w-4 h-4" />
                                🔓 Desbloquear
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="w-4 h-4" />
                                Comprar picks
                              </>
                            )}
                          </button>
                          
                          {saldo.picks_disponibles <= 0 && (
                            <button onClick={() => setTab('comprar')}
                              className="block mx-auto mt-2 text-[10px] text-[#FFBB00] hover:underline">
                              Ir a comprar picks VIP →
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ============ TAB: COMPRAR PICKS ============ */}
      {tab === 'comprar' && (
        <div className="space-y-4">
          {/* Info */}
          <div className="rounded-xl p-4 flex items-start gap-3" style={{
            background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)',
          }}>
            <AlertCircle className="w-5 h-5 text-[#3B82F6] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white text-sm font-bold">¿Cómo funciona?</p>
              <p className="text-[#94A3B8] text-xs mt-1">
                Compra picks individuales o en pack. Cada pick te permite desbloquear un pronóstico 
                premium verificado por IA. Máximo 5 picks por mes.
              </p>
            </div>
          </div>

          {/* PACK 1 PICK */}
          <div className="rounded-xl p-5" style={{
            background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(100,116,139,0.2)',
          }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
                  background: 'rgba(255,187,0,0.1)', border: '1px solid rgba(255,187,0,0.2)',
                }}>
                  <Zap className="w-6 h-6 text-[#FFBB00]" />
                </div>
                <div>
                  <p className="text-white font-bold">1 Pick VIP</p>
                  <p className="text-[#94A3B8] text-xs">Desbloquea 1 pronóstico</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-bold text-xl font-mono">$7.000</p>
                <p className="text-[#64748B] text-[10px]">CLP · $8 USDT</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => comprarPack('VIP_1', 'KHIPU')}
                disabled={!!procesando}
                className="py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: 'rgba(0,209,178,0.15)', border: '1px solid rgba(0,209,178,0.3)', color: '#00D1B2' }}
              >
                {procesando === 'VIP_1-KHIPU' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                Transferencia 🇨🇱
              </button>
              <button
                onClick={() => comprarPack('VIP_1', 'CRYPTO')}
                disabled={!!procesando}
                className="py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', color: '#F97316' }}
              >
                {procesando === 'VIP_1-CRYPTO' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bitcoin className="w-4 h-4" />}
                Pagar USDT
              </button>
            </div>
          </div>

          {/* PACK 5 PICKS - MEJOR VALOR */}
          <div className="rounded-xl p-5 relative" style={{
            background: 'linear-gradient(135deg, rgba(255,187,0,0.06), rgba(30,41,59,0.8))',
            border: '2px solid rgba(255,187,0,0.4)',
          }}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold whitespace-nowrap" style={{
              background: 'linear-gradient(135deg, #FFBB00, #F97316)', color: '#000',
            }}>
              ⭐ MEJOR VALOR
            </div>

            <div className="flex items-center justify-between mb-2 mt-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, rgba(255,187,0,0.15), rgba(249,115,22,0.1))',
                  border: '1px solid rgba(255,187,0,0.3)',
                }}>
                  <Star className="w-6 h-6 text-[#FFBB00]" />
                </div>
                <div>
                  <p className="text-white font-bold">Pack 5 Picks VIP</p>
                  <p className="text-[#94A3B8] text-xs">5 pronósticos premium</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-bold text-xl font-mono">$30.000</p>
                <p className="text-[#64748B] text-[10px]">CLP · $35 USDT</p>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{
                background: 'rgba(0,209,178,0.1)', color: '#00D1B2', border: '1px solid rgba(0,209,178,0.3)',
              }}>
                Ahorra $5.000
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{
                background: 'rgba(255,187,0,0.1)', color: '#FFBB00', border: '1px solid rgba(255,187,0,0.3)',
              }}>
                -14% descuento
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => comprarPack('VIP_5', 'KHIPU')}
                disabled={!!procesando}
                className="py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,209,178,0.2), rgba(0,209,178,0.1))',
                  border: '1px solid rgba(0,209,178,0.4)', color: '#00D1B2',
                }}
              >
                {procesando === 'VIP_5-KHIPU' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                Transferencia 🇨🇱
              </button>
              <button
                onClick={() => comprarPack('VIP_5', 'CRYPTO')}
                disabled={!!procesando}
                className="py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
                style={{
                  background: 'rgba(249,115,22,0.15)',
                  border: '1px solid rgba(249,115,22,0.4)', color: '#F97316',
                }}
              >
                {procesando === 'VIP_5-CRYPTO' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bitcoin className="w-4 h-4" />}
                Pagar USDT
              </button>
            </div>
          </div>

          {/* Saldo actual */}
          {saldo.picks_disponibles > 0 && (
            <div className="rounded-xl p-4 flex items-center justify-between" style={{
              background: 'linear-gradient(135deg, rgba(0,209,178,0.08), rgba(30,41,59,0.8))',
              border: '1px solid rgba(0,209,178,0.2)',
            }}>
              <div className="flex items-center gap-3">
                <Unlock className="w-5 h-5 text-[#00D1B2]" />
                <div>
                  <p className="text-white text-sm font-bold">Tienes {saldo.picks_disponibles} pick{saldo.picks_disponibles > 1 ? 's' : ''}</p>
                  <p className="text-[#94A3B8] text-xs">Ve a Picks VIP para usarlos</p>
                </div>
              </div>
              <button onClick={() => setTab('picks')} className="text-[#00D1B2] text-sm font-bold flex items-center gap-1">
                Ver <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
