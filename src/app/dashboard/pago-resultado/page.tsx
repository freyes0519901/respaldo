'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle, XCircle, Clock, Loader2, Crown, Shield,
  ArrowRight, ExternalLink, MessageCircle, Zap, Star
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || '';

// ─── Canal VIP: link de invitación temporal (se puede generar desde el bot) ───
const TELEGRAM_FREE = 'https://t.me/IaNeuroTips';
const TELEGRAM_VIP = 'https://t.me/+YOUR_VIP_INVITE_LINK'; // Reemplazar con link real

type EstadoPago = 'VERIFICANDO' | 'COMPLETADO' | 'PENDIENTE' | 'FALLIDO' | 'CANCELADO';

interface PagoInfo {
  estado: string;
  tipo: string;
  plan: string;
}

export default function PagoResultadoPage() {
  const searchParams = useSearchParams();
  const pagoId = searchParams.get('pago_id');
  const resultado = searchParams.get('resultado'); // completado | cancelado
  const [estado, setEstado] = useState<EstadoPago>(
    resultado === 'cancelado' ? 'CANCELADO' : 'VERIFICANDO'
  );
  const [pagoInfo, setPagoInfo] = useState<PagoInfo | null>(null);
  const [intentos, setIntentos] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const verificarPago = useCallback(async () => {
    if (!pagoId || estado === 'CANCELADO') return;

    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${API}/api/pagos/${pagoId}/estado`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setEstado('FALLIDO');
        return;
      }

      const data: PagoInfo = await res.json();
      setPagoInfo(data);

      if (data.estado === 'COMPLETADO') {
        setEstado('COMPLETADO');
        setShowConfetti(true);
      } else if (data.estado === 'FALLIDO') {
        setEstado('FALLIDO');
      } else {
        setEstado('PENDIENTE');
      }
    } catch {
      if (intentos > 10) setEstado('FALLIDO');
    }
  }, [pagoId, estado, intentos]);

  // Polling: verificar estado cada 3 segundos por 60 seg
  useEffect(() => {
    if (estado === 'CANCELADO' || estado === 'COMPLETADO' || estado === 'FALLIDO') return;
    if (intentos > 20) {
      setEstado('PENDIENTE');
      return;
    }

    const timer = setTimeout(() => {
      verificarPago();
      setIntentos((i) => i + 1);
    }, intentos === 0 ? 1000 : 3000);

    return () => clearTimeout(timer);
  }, [intentos, estado, verificarPago]);

  const esSuscripcion = pagoInfo?.tipo === 'SUSCRIPCION';
  const esVip = pagoInfo?.tipo?.startsWith('VIP');
  const planLabel = pagoInfo?.plan || '';

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">

        {/* ════════════════ VERIFICANDO ════════════════ */}
        {estado === 'VERIFICANDO' && (
          <div className="text-center space-y-6 animate-pulse">
            <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(0, 209, 178, 0.1)', border: '2px solid rgba(0, 209, 178, 0.3)' }}>
              <Loader2 className="w-10 h-10 text-[#00D1B2] animate-spin" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Verificando tu pago...</h1>
              <p className="text-[#94A3B8] text-sm">
                Estamos confirmando tu transacción. Esto puede tomar unos segundos.
              </p>
            </div>
            <div className="flex justify-center gap-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-[#00D1B2]"
                  style={{ animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}

        {/* ════════════════ COMPLETADO ════════════════ */}
        {estado === 'COMPLETADO' && (
          <div className="space-y-6">
            {/* Confetti effect */}
            {showConfetti && (
              <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
                {[...Array(30)].map((_, i) => (
                  <div key={i} className="absolute text-2xl"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: '-10%',
                      animation: `confetti-fall ${2 + Math.random() * 3}s ease-in ${Math.random() * 2}s forwards`,
                      transform: `rotate(${Math.random() * 360}deg)`,
                    }}>
                    {['🎉', '✨', '🏆', '⭐', '💰', '🔥'][i % 6]}
                  </div>
                ))}
              </div>
            )}

            {/* Success card */}
            <div className="rounded-2xl p-8 text-center" style={{
              background: 'linear-gradient(135deg, rgba(0, 209, 178, 0.08), rgba(30, 41, 59, 0.95))',
              border: '2px solid rgba(0, 209, 178, 0.3)',
              boxShadow: '0 0 40px rgba(0, 209, 178, 0.1)',
            }}>
              <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-5"
                style={{ background: 'rgba(0, 209, 178, 0.15)', border: '2px solid rgba(0, 209, 178, 0.4)' }}>
                <CheckCircle className="w-10 h-10 text-[#00D1B2]" />
              </div>

              <h1 className="text-3xl font-bold text-white mb-2">¡Pago exitoso! 🎉</h1>
              <p className="text-[#94A3B8] mb-6">
                {esSuscripcion
                  ? `Tu plan ${planLabel} ha sido activado.`
                  : esVip
                    ? `Tus picks VIP ya están disponibles.`
                    : 'Tu pago ha sido procesado correctamente.'}
              </p>

              {/* Status badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                style={{ background: 'rgba(0, 209, 178, 0.1)', border: '1px solid rgba(0, 209, 178, 0.3)' }}>
                <Shield className="w-4 h-4 text-[#00D1B2]" />
                <span className="text-sm font-bold text-[#00D1B2]">
                  {esSuscripcion ? `PREMIUM ${planLabel}` : esVip ? 'PICKS VIP ACREDITADOS' : 'COMPLETADO'}
                </span>
              </div>
            </div>

            {/* ─── Telegram VIP ─── */}
            {esSuscripcion && (
              <div className="rounded-2xl p-6" style={{
                background: 'linear-gradient(135deg, rgba(255, 187, 0, 0.08), rgba(30, 41, 59, 0.95))',
                border: '2px solid rgba(255, 187, 0, 0.3)',
              }}>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl flex-shrink-0"
                    style={{ background: 'rgba(255, 187, 0, 0.15)' }}>
                    <Crown className="w-6 h-6 text-[#FFBB00]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg mb-1">
                      Únete al Canal VIP de Telegram 👑
                    </h3>
                    <p className="text-[#94A3B8] text-sm mb-4 leading-relaxed">
                      Como suscriptor Premium tienes acceso exclusivo a nuestro canal VIP.
                      Recibe todos los picks en tiempo real, alertas y análisis directamente en tu Telegram.
                    </p>

                    <div className="space-y-3">
                      <a href={TELEGRAM_VIP} target="_blank" rel="noopener noreferrer"
                        className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                        style={{
                          background: 'linear-gradient(135deg, #FFBB00, #F97316)',
                          color: '#000',
                        }}>
                        <MessageCircle className="w-5 h-5" />
                        Unirme al Canal VIP
                        <ExternalLink className="w-4 h-4" />
                      </a>

                      <div className="flex items-center gap-2 text-[10px] text-[#94A3B8] justify-center">
                        <span>✅ Todos los picks</span>
                        <span>·</span>
                        <span>⚡ Alertas instantáneas</span>
                        <span>·</span>
                        <span>🎯 Análisis IA</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── VIP Picks info ─── */}
            {esVip && (
              <div className="rounded-2xl p-6" style={{
                background: 'linear-gradient(135deg, rgba(255, 187, 0, 0.08), rgba(30, 41, 59, 0.95))',
                border: '2px solid rgba(255, 187, 0, 0.3)',
              }}>
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="w-6 h-6 text-[#FFBB00]" />
                  <h3 className="text-white font-bold text-lg">Tus Picks VIP están listos 🔥</h3>
                </div>
                <p className="text-[#94A3B8] text-sm mb-4">
                  Tus picks exclusivos ya fueron acreditados. Ve a la Sala VIP para desbloquearlos.
                </p>
                <Link href="/dashboard/sala-vip"
                  className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                  style={{
                    background: 'linear-gradient(135deg, #FFBB00, #F97316)',
                    color: '#000',
                  }}>
                  <Star className="w-5 h-5" />
                  Ir a Sala VIP
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {/* ─── Canal gratis siempre visible ─── */}
            <div className="rounded-xl p-4" style={{
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(100, 116, 139, 0.2)',
            }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5 text-[#0EA5E9]" />
                  <div>
                    <p className="text-white text-sm font-bold">Canal Gratis de Telegram</p>
                    <p className="text-[10px] text-[#94A3B8]">1 pick gratis diario verificado por IA</p>
                  </div>
                </div>
                <a href={TELEGRAM_FREE} target="_blank" rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg text-xs font-bold transition-all hover:opacity-80"
                  style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#0EA5E9', border: '1px solid rgba(14, 165, 233, 0.3)' }}>
                  Unirme 📱
                </a>
              </div>
            </div>

            {/* CTA Dashboard */}
            <Link href="/dashboard"
              className="block w-full py-3 rounded-xl text-sm font-bold text-center transition-all hover:opacity-90"
              style={{ background: 'rgba(0, 209, 178, 0.1)', color: '#00D1B2', border: '1px solid rgba(0, 209, 178, 0.3)' }}>
              Ir al Dashboard →
            </Link>
          </div>
        )}

        {/* ════════════════ PENDIENTE ════════════════ */}
        {estado === 'PENDIENTE' && (
          <div className="space-y-6">
            <div className="rounded-2xl p-8 text-center" style={{
              background: 'linear-gradient(135deg, rgba(255, 187, 0, 0.05), rgba(30, 41, 59, 0.95))',
              border: '2px solid rgba(255, 187, 0, 0.3)',
            }}>
              <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-5"
                style={{ background: 'rgba(255, 187, 0, 0.15)', border: '2px solid rgba(255, 187, 0, 0.4)' }}>
                <Clock className="w-10 h-10 text-[#FFBB00]" />
              </div>

              <h1 className="text-2xl font-bold text-white mb-2">Pago en verificación ⏳</h1>
              <p className="text-[#94A3B8] text-sm leading-relaxed mb-6">
                Tu pago está siendo procesado. Dependiendo del método de pago, esto puede tomar
                entre unos segundos y algunos minutos. Tu plan se activará automáticamente
                cuando se confirme.
              </p>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ background: 'rgba(255, 187, 0, 0.1)', border: '1px solid rgba(255, 187, 0, 0.3)' }}>
                <Loader2 className="w-4 h-4 text-[#FFBB00] animate-spin" />
                <span className="text-sm font-bold text-[#FFBB00]">PROCESANDO</span>
              </div>
            </div>

            <div className="rounded-xl p-4" style={{
              background: 'rgba(30, 41, 59, 0.3)', border: '1px solid rgba(100, 116, 139, 0.15)',
            }}>
              <p className="text-[#94A3B8] text-xs leading-relaxed">
                💡 <strong className="text-white">¿Pagaste con Khipu?</strong> La verificación
                suele ser instantánea. Si después de 5 minutos no se refleja, contáctanos.
                <br /><br />
                💡 <strong className="text-white">¿Pagaste con USDT?</strong> Las confirmaciones
                en blockchain pueden tomar entre 1-15 minutos dependiendo de la congestión de la red.
              </p>
            </div>

            {/* Mientras espera, que se una al canal gratis */}
            <div className="rounded-xl p-4" style={{
              background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(100, 116, 139, 0.2)',
            }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5 text-[#0EA5E9]" />
                  <div>
                    <p className="text-white text-sm font-bold">Mientras esperas...</p>
                    <p className="text-[10px] text-[#94A3B8]">Únete a nuestro canal gratis de Telegram</p>
                  </div>
                </div>
                <a href={TELEGRAM_FREE} target="_blank" rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg text-xs font-bold"
                  style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#0EA5E9', border: '1px solid rgba(14, 165, 233, 0.3)' }}>
                  Unirme 📱
                </a>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setIntentos(0); setEstado('VERIFICANDO'); }}
                className="flex-1 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                style={{ background: 'rgba(0, 209, 178, 0.1)', color: '#00D1B2', border: '1px solid rgba(0, 209, 178, 0.3)' }}>
                🔄 Verificar de nuevo
              </button>
              <Link href="/dashboard"
                className="flex-1 py-3 rounded-xl text-sm font-bold text-center transition-all hover:opacity-90"
                style={{ background: 'rgba(100, 116, 139, 0.1)', color: '#94A3B8', border: '1px solid rgba(100, 116, 139, 0.3)' }}>
                Ir al Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* ════════════════ CANCELADO ════════════════ */}
        {estado === 'CANCELADO' && (
          <div className="space-y-6">
            <div className="rounded-2xl p-8 text-center" style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(30, 41, 59, 0.95))',
              border: '2px solid rgba(239, 68, 68, 0.3)',
            }}>
              <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-5"
                style={{ background: 'rgba(239, 68, 68, 0.15)', border: '2px solid rgba(239, 68, 68, 0.4)' }}>
                <XCircle className="w-10 h-10 text-red-400" />
              </div>

              <h1 className="text-2xl font-bold text-white mb-2">Pago cancelado</h1>
              <p className="text-[#94A3B8] text-sm">
                Tu pago fue cancelado. No se realizó ningún cargo.
                Puedes intentar de nuevo cuando quieras.
              </p>
            </div>

            <Link href="/dashboard/suscripcion"
              className="block w-full py-3 rounded-xl text-sm font-bold text-center transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #00D1B2, #0EA5E9)', color: '#FFF' }}>
              Ver planes nuevamente →
            </Link>
          </div>
        )}

        {/* ════════════════ FALLIDO ════════════════ */}
        {estado === 'FALLIDO' && (
          <div className="space-y-6">
            <div className="rounded-2xl p-8 text-center" style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(30, 41, 59, 0.95))',
              border: '2px solid rgba(239, 68, 68, 0.3)',
            }}>
              <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-5"
                style={{ background: 'rgba(239, 68, 68, 0.15)', border: '2px solid rgba(239, 68, 68, 0.4)' }}>
                <XCircle className="w-10 h-10 text-red-400" />
              </div>

              <h1 className="text-2xl font-bold text-white mb-2">Error en el pago</h1>
              <p className="text-[#94A3B8] text-sm">
                Hubo un problema procesando tu pago. Si crees que esto es un error,
                contáctanos por Telegram.
              </p>
            </div>

            <div className="flex gap-3">
              <Link href="/dashboard/suscripcion"
                className="flex-1 py-3 rounded-xl text-sm font-bold text-center transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #00D1B2, #0EA5E9)', color: '#FFF' }}>
                Intentar de nuevo
              </Link>
              <a href={TELEGRAM_FREE} target="_blank" rel="noopener noreferrer"
                className="flex-1 py-3 rounded-xl text-sm font-bold text-center transition-all hover:opacity-90"
                style={{ background: 'rgba(100, 116, 139, 0.1)', color: '#94A3B8', border: '1px solid rgba(100, 116, 139, 0.3)' }}>
                Contactar soporte
              </a>
            </div>
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
