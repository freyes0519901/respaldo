'use client';

/**
 * ★ SubscriptionGuard (V14.2)
 * =============================
 * Bloquea el dashboard si la suscripción está vencida.
 * Muestra overlay con redirect a /dashboard/suscripcion.
 * 
 * RUTAS PERMITIDAS sin suscripción activa:
 * - /dashboard/suscripcion (para que pueda renovar)
 * - /dashboard/cambiar-password (necesidad básica)
 * 
 * USO en dashboard/layout.tsx:
 * import SubscriptionGuard from '@/components/SubscriptionGuard';
 * 
 * // Dentro del return, envolver {children}:
 * <SubscriptionGuard user={user}>
 *   {children}
 * </SubscriptionGuard>
 */

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Crown, Clock, AlertTriangle, ArrowRight } from 'lucide-react';

interface User {
  plan?: string;
  suscripcion_hasta?: string | null;
  is_admin?: boolean;
  nombre?: string;
  email?: string;
}

// Rutas que NO se bloquean aunque la suscripción esté vencida
const ALLOWED_PATHS = [
  '/dashboard/suscripcion',
  '/dashboard/cambiar-password',
  '/dashboard/pago-resultado',
];

function isSubscriptionActive(user: User | null): boolean {
  if (!user) return false;
  
  // Admins siempre pasan
  if (user.is_admin) return true;
  
  // Sin fecha = expirado
  if (!user.suscripcion_hasta) return false;
  
  const hasta = new Date(user.suscripcion_hasta);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  return hasta >= hoy;
}

function getDaysExpired(user: User | null): number {
  if (!user?.suscripcion_hasta) return 0;
  const hasta = new Date(user.suscripcion_hasta);
  const hoy = new Date();
  return Math.abs(Math.ceil((hoy.getTime() - hasta.getTime()) / (1000 * 60 * 60 * 24)));
}

export default function SubscriptionGuard({
  user,
  children,
}: {
  user: User | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [showBlock, setShowBlock] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    // Check if current path is allowed
    const isAllowed = ALLOWED_PATHS.some(p => pathname.startsWith(p));
    if (isAllowed) {
      setShowBlock(false);
      return;
    }

    // Check subscription
    if (!isSubscriptionActive(user)) {
      setShowBlock(true);
    } else {
      setShowBlock(false);
    }
  }, [user, pathname]);

  // Si la suscripción está activa o estamos en ruta permitida, mostrar contenido normal
  if (!showBlock) {
    return <>{children}</>;
  }

  const diasVencido = getDaysExpired(user);
  const fechaVencimiento = user?.suscripcion_hasta 
    ? new Date(user.suscripcion_hasta).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'N/A';

  // ★ PANTALLA DE BLOQUEO
  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        maxWidth: '440px',
        width: '100%',
        textAlign: 'center',
      }}>
        {/* Icon */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(255,187,0,0.15), rgba(249,115,22,0.1))',
          border: '2px solid rgba(255,187,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <Crown style={{ width: '40px', height: '40px', color: '#FFBB00' }} />
        </div>

        {/* Title */}
        <h2 style={{
          fontSize: '24px',
          fontWeight: 800,
          color: '#F1F5F9',
          marginBottom: '8px',
        }}>
          Tu suscripción ha vencido
        </h2>

        {/* Subtitle */}
        <p style={{
          fontSize: '14px',
          color: '#94A3B8',
          marginBottom: '24px',
          lineHeight: 1.5,
        }}>
          Tu plan {user?.plan === 'PREMIUM' ? 'Premium' : 'de prueba'} venció 
          {user?.suscripcion_hasta ? ` el ${fechaVencimiento}` : ''}.
          {diasVencido > 0 && ` Hace ${diasVencido} día${diasVencido > 1 ? 's' : ''}.`}
          <br />
          Renueva para seguir accediendo a los análisis con IA.
        </p>

        {/* Alert box */}
        <div style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '12px',
          padding: '14px 18px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <AlertTriangle style={{ width: '18px', height: '18px', color: '#EF4444', flexShrink: 0 }} />
          <p style={{ fontSize: '13px', color: '#EF4444', textAlign: 'left' }}>
            El acceso al dashboard está suspendido hasta que renueves tu plan.
          </p>
        </div>

        {/* CTA Button */}
        <Link
          href="/dashboard/suscripcion"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '14px 32px',
            background: 'linear-gradient(135deg, #FFBB00, #F97316)',
            color: '#000',
            fontWeight: 800,
            fontSize: '15px',
            borderRadius: '12px',
            textDecoration: 'none',
            transition: 'all 0.2s',
            boxShadow: '0 4px 20px rgba(255, 187, 0, 0.3)',
          }}
        >
          <Crown style={{ width: '18px', height: '18px' }} />
          Renovar Suscripción
          <ArrowRight style={{ width: '16px', height: '16px' }} />
        </Link>

        {/* Secondary actions */}
        <div style={{
          marginTop: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          alignItems: 'center',
        }}>
          <a
            href="https://t.me/IaNeuroTips"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '13px',
              color: '#0EA5E9',
              textDecoration: 'none',
            }}
          >
            📱 Mientras tanto, recibe picks gratis en Telegram
          </a>
          <a
            href="https://wa.me/56978516119?text=Hola%20NeuroTips%2C%20quiero%20renovar%20mi%20suscripci%C3%B3n"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '13px',
              color: '#22C55E',
              textDecoration: 'none',
            }}
          >
            💬 ¿Problemas para pagar? Escríbenos por WhatsApp
          </a>
        </div>

        {/* Timestamp */}
        <p style={{
          marginTop: '32px',
          fontSize: '11px',
          color: '#475569',
        }}>
          {user?.email} · Plan: {user?.plan || 'FREE_TRIAL'}
        </p>
      </div>
    </div>
  );
}
