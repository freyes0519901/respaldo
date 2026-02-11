'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, Send, Brain, CheckCircle, Users, Zap, ArrowRight, Loader2, ExternalLink } from 'lucide-react';
import { authAPI, isAuthenticated } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

// ============================================================================
// LINKS DE COMUNIDAD — Actualizar con los reales
// ============================================================================
const TELEGRAM_LINK = 'https://t.me/IaNeuroTips';
const WHATSAPP_LINK = 'https://chat.whatsapp.com/LVDsxEZlkZAEyeOr6blbF3';

export default function ComunidadPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState<'telegram' | 'whatsapp' | null>(null);
  const [joined, setJoined] = useState(false);
  const [selectedCanal, setSelectedCanal] = useState<'telegram' | 'whatsapp' | null>(null);

  // Check if already in community
  useEffect(() => {
    const checkStatus = async () => {
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }

      try {
        const data = await authAPI.checkCommunity();
        if (data.verificado) {
          router.push('/dashboard');
        }
      } catch (err) {
        // Not joined yet, stay on page
      }
    };

    checkStatus();
  }, [router]);

  const handleJoin = async (canal: 'telegram' | 'whatsapp') => {
    setSelectedCanal(canal);
    setLoading(canal);

    // Open the link in new tab
    const link = canal === 'telegram' ? TELEGRAM_LINK : WHATSAPP_LINK;
    window.open(link, '_blank');

    // Show confirmation after 3 seconds
    setTimeout(() => {
      setJoined(true);
      setLoading(null);
    }, 3000);
  };

  const handleConfirm = async () => {
    if (!selectedCanal) return;

    setLoading(selectedCanal);

    try {
      await authAPI.joinCommunity(selectedCanal);

      // Refresh user data
      const userData = await authAPI.getMe();
      setUser(userData.user);

      router.push('/dashboard');
    } catch (err: any) {
      console.error('Error joining community:', err);
      setLoading(null);
    }
  };

  const benefits = [
    { icon: Zap, text: 'Alertas de picks en tiempo real' },
    { icon: Users, text: 'Comunidad de apostadores verificados' },
    { icon: MessageCircle, text: 'Soporte directo con el equipo' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #0B1120 0%, #0d1825 50%, #0B1120 100%)',
      }}>
      
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00D1B2]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#FFDD57]/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00D1B2] to-[#00D1B2]/70 flex items-center justify-center">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">
              Neuro<span className="text-[#00D1B2]">Tips</span>
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6 sm:p-8"
          style={{
            background: 'rgba(30, 41, 59, 0.5)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
          
          {/* Welcome */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(0,209,178,0.2), rgba(255,221,87,0.1))',
                border: '2px solid rgba(0,209,178,0.3)',
              }}>
              <Users className="w-8 h-8 text-[#00D1B2]" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              ¡Bienvenido{user?.nombre ? `, ${user.nombre.split(' ')[0]}` : ''}! 🎉
            </h1>
            <p className="text-[#94A3B8]">
              Únete a nuestra comunidad para recibir alertas y acceder al dashboard
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-3 mb-8">
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}>
                <benefit.icon className="w-5 h-5 text-[#00D1B2]" />
                <span className="text-[#94A3B8] text-sm">{benefit.text}</span>
              </div>
            ))}
          </div>

          {!joined ? (
            <>
              {/* Channel selection */}
              <p className="text-center text-[#64748B] text-sm mb-4">
                Elige tu canal preferido:
              </p>

              <div className="space-y-3">
                {/* Telegram Button */}
                <button
                  onClick={() => handleJoin('telegram')}
                  disabled={loading !== null}
                  className="w-full flex items-center justify-center gap-3 py-4 px-4 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #0088cc, #0099dd)',
                    color: 'white',
                  }}
                >
                  {loading === 'telegram' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  <span>Unirme a Telegram</span>
                  <ExternalLink className="w-4 h-4 opacity-60" />
                </button>

                {/* WhatsApp Button */}
                <button
                  onClick={() => handleJoin('whatsapp')}
                  disabled={loading !== null}
                  className="w-full flex items-center justify-center gap-3 py-4 px-4 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #25D366, #128C7E)',
                    color: 'white',
                  }}
                >
                  {loading === 'whatsapp' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <MessageCircle className="w-5 h-5" />
                  )}
                  <span>Unirme a WhatsApp</span>
                  <ExternalLink className="w-4 h-4 opacity-60" />
                </button>
              </div>

              <p className="text-center text-[#64748B] text-xs mt-4">
                Debes unirte a al menos uno para acceder al dashboard
              </p>
            </>
          ) : (
            <>
              {/* Confirmation */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                  style={{
                    background: 'rgba(46,213,115,0.1)',
                    border: '2px solid rgba(46,213,115,0.3)',
                  }}>
                  <CheckCircle className="w-8 h-8 text-[#2ED573]" />
                </div>
                <p className="text-white font-semibold mb-2">
                  ¿Ya te uniste al canal de {selectedCanal === 'telegram' ? 'Telegram' : 'WhatsApp'}?
                </p>
                <p className="text-[#94A3B8] text-sm">
                  Confirma para acceder al dashboard
                </p>
              </div>

              <button
                onClick={handleConfirm}
                disabled={loading !== null}
                className="w-full py-4 rounded-xl font-bold text-black transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #00D1B2, #00E5C3)',
                }}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Sí, ya me uní — Continuar
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setJoined(false);
                  setSelectedCanal(null);
                }}
                className="w-full py-3 mt-3 rounded-xl font-semibold text-[#94A3B8] hover:text-white transition"
              >
                Elegir otro canal
              </button>
            </>
          )}
        </div>

        {/* Skip link (for testing only - remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full mt-4 text-center text-[#64748B] text-xs hover:text-white transition"
          >
            [DEV] Saltar este paso
          </button>
        )}
      </div>
    </div>
  );
}
