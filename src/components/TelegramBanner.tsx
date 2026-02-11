'use client';

import { useEffect, useState } from 'react';
import { MessageCircle, Crown, Users, ExternalLink, ChevronRight, Zap } from 'lucide-react';

const TELEGRAM_FREE = 'https://t.me/IaNeuroTips';

const API = process.env.NEXT_PUBLIC_API_URL || '';

interface Props {
  /** 'sidebar' = compact para sidebar, 'full' = card grande para dashboard */
  variant?: 'sidebar' | 'full';
}

export default function TelegramBanner({ variant = 'full' }: Props) {
  const [isPremium, setIsPremium] = useState(false);
  const [telegramVip, setTelegramVip] = useState<string | null>(null);

  useEffect(() => {
    const checkPlan = async () => {
      try {
        const token = localStorage.getItem('token') || '';
        if (!token) return;
        const res = await fetch(`${API}/api/mi-suscripcion`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setIsPremium(data.plan === 'PREMIUM');
          // Buscar invite link del último pago completado de suscripción
          if (data.plan === 'PREMIUM' && data.historial_pagos?.length > 0) {
            const ultimoPagoSub = data.historial_pagos.find(
              (p: any) => p.tipo === 'SUSCRIPCION' && p.estado === 'COMPLETADO'
            );
            if (ultimoPagoSub) {
              // Obtener invite link del pago
              const pagoRes = await fetch(`${API}/api/pagos/${ultimoPagoSub.id}/estado`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (pagoRes.ok) {
                const pagoData = await pagoRes.json();
                if (pagoData.telegram_invite) {
                  setTelegramVip(pagoData.telegram_invite);
                }
              }
            }
          }
        }
      } catch {
        // silently fail
      }
    };
    checkPlan();
  }, []);

  // ═══════════════ SIDEBAR VARIANT ═══════════════
  if (variant === 'sidebar') {
    return (
      <div className="space-y-2 px-3 py-2">
        {/* Canal Gratis */}
        <a href={TELEGRAM_FREE} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:bg-white/5 group">
          <div className="p-1.5 rounded-md" style={{ background: 'rgba(14, 165, 233, 0.15)' }}>
            <MessageCircle className="w-4 h-4 text-[#0EA5E9]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-bold truncate">Canal Gratis</p>
            <p className="text-[#64748B] text-[10px]">@IaNeuroTips</p>
          </div>
          <ExternalLink className="w-3 h-3 text-[#64748B] opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>

        {/* Canal VIP */}
        {isPremium && telegramVip ? (
          <a href={telegramVip} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:bg-white/5 group"
            style={{ background: 'rgba(255, 187, 0, 0.05)', border: '1px solid rgba(255, 187, 0, 0.15)' }}>
            <div className="p-1.5 rounded-md" style={{ background: 'rgba(255, 187, 0, 0.15)' }}>
              <Crown className="w-4 h-4 text-[#FFBB00]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#FFBB00] text-xs font-bold truncate">Canal VIP 👑</p>
              <p className="text-[#64748B] text-[10px]">Acceso exclusivo</p>
            </div>
            <ExternalLink className="w-3 h-3 text-[#FFBB00] opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        ) : isPremium && !telegramVip ? (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
            style={{ background: 'rgba(255, 187, 0, 0.05)', border: '1px solid rgba(255, 187, 0, 0.1)' }}>
            <div className="p-1.5 rounded-md" style={{ background: 'rgba(255, 187, 0, 0.15)' }}>
              <Crown className="w-4 h-4 text-[#FFBB00]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#FFBB00] text-xs font-bold truncate">Canal VIP ✅</p>
              <p className="text-[#64748B] text-[10px]">Ya eres miembro</p>
            </div>
          </div>
        ) : (
          <a href="/dashboard/suscripcion"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:bg-white/5 group opacity-60">
            <div className="p-1.5 rounded-md" style={{ background: 'rgba(100, 116, 139, 0.15)' }}>
              <Crown className="w-4 h-4 text-[#64748B]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#94A3B8] text-xs font-bold truncate">Canal VIP 🔒</p>
              <p className="text-[#64748B] text-[10px]">Solo Premium</p>
            </div>
            <ChevronRight className="w-3 h-3 text-[#64748B]" />
          </a>
        )}
      </div>
    );
  }

  // ═══════════════ FULL VARIANT (Dashboard card) ═══════════════
  return (
    <div className="rounded-xl overflow-hidden" style={{
      background: 'rgba(30, 41, 59, 0.5)',
      border: '1px solid rgba(100, 116, 139, 0.2)',
    }}>
      {/* Header */}
      <div className="px-5 py-4 flex items-center gap-3" style={{
        background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.08), rgba(0, 209, 178, 0.05))',
        borderBottom: '1px solid rgba(100, 116, 139, 0.1)',
      }}>
        <MessageCircle className="w-5 h-5 text-[#0EA5E9]" />
        <h3 className="text-white font-bold text-sm">Canales de Telegram</h3>
      </div>

      <div className="p-4 space-y-3">
        {/* ─── Canal Gratis ─── */}
        <a href={TELEGRAM_FREE} target="_blank" rel="noopener noreferrer"
          className="block rounded-xl p-4 transition-all hover:scale-[1.01]" style={{
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.06), rgba(30, 41, 59, 0.8))',
            border: '1px solid rgba(14, 165, 233, 0.2)',
          }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl" style={{ background: 'rgba(14, 165, 233, 0.15)' }}>
                <MessageCircle className="w-5 h-5 text-[#0EA5E9]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-white font-bold text-sm">Canal Gratis</p>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold"
                    style={{ background: 'rgba(0, 209, 178, 0.15)', color: '#00D1B2', border: '1px solid rgba(0, 209, 178, 0.3)' }}>
                    ABIERTO
                  </span>
                </div>
                <p className="text-[#94A3B8] text-xs mt-0.5">@IaNeuroTips · 1 pick gratis diario</p>
              </div>
            </div>
            <div className="px-4 py-2 rounded-lg text-xs font-bold"
              style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#0EA5E9', border: '1px solid rgba(14, 165, 233, 0.3)' }}>
              Unirme →
            </div>
          </div>

          <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: '1px solid rgba(100, 116, 139, 0.1)' }}>
            <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
              <Zap className="w-3 h-3 text-[#00D1B2]" />
              Pick diario verificado
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
              <Users className="w-3 h-3 text-[#0EA5E9]" />
              Comunidad activa
            </div>
          </div>
        </a>

        {/* ─── Canal VIP ─── */}
        {isPremium && telegramVip ? (
          <a href={telegramVip} target="_blank" rel="noopener noreferrer"
            className="block rounded-xl p-4 transition-all hover:scale-[1.01]" style={{
              background: 'linear-gradient(135deg, rgba(255, 187, 0, 0.06), rgba(30, 41, 59, 0.8))',
              border: '2px solid rgba(255, 187, 0, 0.3)',
            }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl" style={{ background: 'rgba(255, 187, 0, 0.15)' }}>
                  <Crown className="w-5 h-5 text-[#FFBB00]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[#FFBB00] font-bold text-sm">Canal VIP 👑</p>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold"
                      style={{ background: 'rgba(255, 187, 0, 0.15)', color: '#FFBB00', border: '1px solid rgba(255, 187, 0, 0.3)' }}>
                      PREMIUM
                    </span>
                  </div>
                  <p className="text-[#94A3B8] text-xs mt-0.5">Todos los picks + alertas en tiempo real</p>
                </div>
              </div>
              <div className="px-4 py-2 rounded-lg text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, #FFBB00, #F97316)', color: '#000' }}>
                Entrar →
              </div>
            </div>

            <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255, 187, 0, 0.1)' }}>
              <div className="flex items-center gap-1.5 text-[11px] text-[#FFBB00]">
                <Zap className="w-3 h-3" />
                Todos los picks
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-[#FFBB00]">
                <MessageCircle className="w-3 h-3" />
                Alertas instantáneas
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-[#FFBB00]">
                <Crown className="w-3 h-3" />
                Análisis IA completo
              </div>
            </div>
            <p className="text-[10px] text-[#94A3B8] mt-2 text-center">⚠️ Link único · 1 uso · Expira 48h</p>
          </a>
        ) : isPremium && !telegramVip ? (
          <div className="rounded-xl p-4" style={{
            background: 'linear-gradient(135deg, rgba(255, 187, 0, 0.06), rgba(30, 41, 59, 0.8))',
            border: '1px solid rgba(255, 187, 0, 0.2)',
          }}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl" style={{ background: 'rgba(255, 187, 0, 0.15)' }}>
                <Crown className="w-5 h-5 text-[#FFBB00]" />
              </div>
              <div>
                <p className="text-[#FFBB00] font-bold text-sm">Canal VIP ✅ Miembro activo</p>
                <p className="text-[#94A3B8] text-xs mt-0.5">Ya tienes acceso al canal premium</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl p-4 relative overflow-hidden" style={{
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid rgba(100, 116, 139, 0.2)',
          }}>
            {/* Blurred overlay */}
            <div className="absolute inset-0 backdrop-blur-[2px]" style={{
              background: 'rgba(15, 23, 42, 0.4)',
            }} />

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl" style={{ background: 'rgba(100, 116, 139, 0.15)' }}>
                  <Crown className="w-5 h-5 text-[#64748B]" />
                </div>
                <div>
                  <p className="text-[#94A3B8] font-bold text-sm">Canal VIP 🔒</p>
                  <p className="text-[#64748B] text-xs mt-0.5">Exclusivo para suscriptores Premium</p>
                </div>
              </div>
              <a href="/dashboard/suscripcion"
                className="px-4 py-2 rounded-lg text-xs font-bold transition-all hover:opacity-90"
                style={{ background: 'rgba(255, 187, 0, 0.15)', color: '#FFBB00', border: '1px solid rgba(255, 187, 0, 0.3)' }}>
                Desbloquear 👑
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
