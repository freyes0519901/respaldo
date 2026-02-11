'use client';

import { useEffect, useState } from 'react';

// Capturar el evento GLOBALMENTE antes de que React monte
let deferredPrompt: any = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });
}

export default function PWARegister() {
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        console.log('[PWA] Service Worker registrado:', reg.scope);
      }).catch((err) => {
        console.log('[PWA] Error SW:', err);
      });
    }

    // Verificar si ya está instalada
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true;
    setIsStandalone(standalone);

    if (standalone) return;

    // No mostrar si ya se cerró en esta sesión
    try {
      if (sessionStorage.getItem('pwa-dismissed') === '1') return;
    } catch {}

    // Detectar iOS (iPhone, iPad, iPod)
    const userAgent = navigator.userAgent || navigator.vendor || '';
    const ios = /iP(hone|od|ad)/.test(userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(ios);

    if (ios) {
      // En iOS mostrar banner con instrucciones después de 3s
      setTimeout(() => setShowBanner(true), 3000);
      return;
    }

    // Android/Desktop: usar beforeinstallprompt
    if (deferredPrompt) {
      setTimeout(() => setShowBanner(true), 3000);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      setTimeout(() => setShowBanner(true), 3000);
    };
    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] Install:', outcome);
    deferredPrompt = null;
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    try { sessionStorage.setItem('pwa-dismissed', '1'); } catch {}
  };

  if (isStandalone || !showBanner) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      width: 'calc(100% - 32px)',
      maxWidth: '420px',
      animation: 'slideUp 0.4s ease-out',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1E293B 0%, #253347 100%)',
        border: '1px solid rgba(0, 209, 178, 0.4)',
        borderRadius: '16px',
        padding: '16px 20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 40px rgba(0, 209, 178, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
      }}>
        <div style={{ fontSize: '32px', flexShrink: 0 }}>🧠</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            color: '#F1F5F9',
            fontWeight: 700,
            fontSize: '14px',
            marginBottom: '2px',
          }}>
            Instalar NeuroTips
          </div>
          {isIOS ? (
            <div style={{ color: '#94A3B8', fontSize: '12px', lineHeight: '1.4' }}>
              Toca{' '}
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0, 209, 178, 0.15)',
                border: '1px solid rgba(0, 209, 178, 0.3)',
                borderRadius: '6px',
                padding: '1px 6px',
                fontSize: '14px',
                verticalAlign: 'middle',
              }}>
                ⬆️
              </span>
              {' '}y luego{' '}
              <span style={{
                color: '#00D1B2',
                fontWeight: 600,
              }}>
                &quot;Agregar a inicio&quot;
              </span>
            </div>
          ) : (
            <div style={{ color: '#94A3B8', fontSize: '12px' }}>
              Accede rápido desde tu pantalla de inicio
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          {!isIOS && (
            <button
              onClick={handleInstall}
              style={{
                background: 'linear-gradient(135deg, #00D1B2, #00B89C)',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Instalar
            </button>
          )}
          <button
            onClick={handleDismiss}
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: '#94A3B8',
              border: 'none',
              padding: '8px 10px',
              borderRadius: '10px',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(30px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
