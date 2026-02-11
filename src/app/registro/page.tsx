'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// ═══════════════════════════════════════════════════════════════
// NEUROTIPS REGISTRO v2 — CONVERSION OPTIMIZED
// Changes:
//   1. Removed "Confirmar contraseña" (eye toggle is enough)
//   2. Removed "Teléfono" (ask in onboarding, not signup)
//   3. Google button: white solid, bigger, more prominent
//   4. CTA: Gold (#FFBB00) instead of teal
//   5. Title: "Comienza tu prueba gratis" (benefit, not action)
//   6. Social proof line added
//   7. Stats below form for trust
// ═══════════════════════════════════════════════════════════════

export default function RegistroPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al crear cuenta');
        setLoading(false);
        return;
      }

      // Store tokens
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
        if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
      }

      router.push('/dashboard');
    } catch (err) {
      setError('Error de conexión. Intenta nuevamente.');
      setLoading(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        
        :root {
          --bg: #060A13;
          --card: #0D1520;
          --border: rgba(255,255,255,0.08);
          --teal: #00D1B2;
          --gold: #FFBB00;
          --green: #22C55E;
          --text: #F1F5F9;
          --muted: #64748B;
          --sub: #94A3B8;
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; }
        
        @keyframes glowGold {
          0%, 100% { box-shadow: 0 0 20px rgba(255,187,0,0.25); }
          50% { box-shadow: 0 0 35px rgba(255,187,0,0.45), 0 0 50px rgba(255,187,0,0.15); }
        }
        .cta-gold { animation: glowGold 3s ease-in-out infinite; }
        
        .input-field {
          width: 100%;
          padding: 14px 16px;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text);
          font-size: 15px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color 0.2s;
        }
        .input-field::placeholder { color: var(--muted); }
        .input-field:focus { border-color: var(--teal); }
      `}</style>

      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 20px',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(0,209,178,0.06) 0%, transparent 50%)',
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 24 }}>
          <Image src="/logo-icon.png" alt="NeuroTips" width={36} height={36} />
          <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 20, color: 'var(--text)' }}>
            Neuro<span style={{ color: 'var(--teal)' }}>Tips</span>
          </span>
        </Link>

        {/* Title */}
        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 700, marginBottom: 6, textAlign: 'center' }}>
          Comienza tu prueba gratis
        </h1>
        <p style={{ fontSize: 14, color: 'var(--sub)', marginBottom: 24, textAlign: 'center' }}>
          991+ picks analizados · 32 tipsters verificados · Cancela cuando quieras
        </p>

        {/* Card */}
        <div style={{
          width: '100%', maxWidth: 420,
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '28px 24px',
        }}>
          {/* Badge 5 días gratis */}
          <div style={{
            background: 'rgba(0,209,178,0.1)', border: '1px solid rgba(0,209,178,0.2)',
            borderRadius: 10, padding: '10px 16px', marginBottom: 20,
            textAlign: 'center', fontSize: 14, fontWeight: 600,
          }}>
            <span style={{ color: 'var(--teal)' }}>✓ 5 días gratis</span>
            <span style={{ color: 'var(--sub)' }}> — Sin tarjeta de crédito</span>
          </div>

          {/* Google button — WHITE, PROMINENT */}
          <button
            onClick={handleGoogleLogin}
            style={{
              width: '100%', padding: '14px 20px',
              background: '#FFFFFF', color: '#1F1F1F',
              border: 'none', borderRadius: 10,
              fontSize: 15, fontWeight: 600, fontFamily: 'DM Sans',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 10,
              transition: 'background 0.2s',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Registrarse con Google
          </button>

          {/* Divider */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            margin: '20px 0', color: 'var(--muted)', fontSize: 12,
          }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            O CON EMAIL
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Form — ONLY 3 FIELDS */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Nombre */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, display: 'block' }}>
                Nombre completo
              </label>
              <input
                className="input-field"
                type="text"
                placeholder="Tu nombre"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

            {/* Email */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, display: 'block' }}>
                Email
              </label>
              <input
                className="input-field"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {/* Password — SIN confirmar */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, display: 'block' }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input-field"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--muted)',
                    cursor: 'pointer', fontSize: 18, padding: 4,
                  }}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#EF4444',
              }}>
                {error}
              </div>
            )}

            {/* CTA — GOLD */}
            <button
              type="submit"
              disabled={loading}
              className="cta-gold"
              style={{
                width: '100%', padding: '16px 24px',
                background: 'var(--gold)', color: '#060A13',
                border: 'none', borderRadius: 10,
                fontSize: 16, fontWeight: 700, fontFamily: 'Space Grotesk',
                cursor: loading ? 'wait' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'opacity 0.2s',
                marginTop: 4,
              }}
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta gratis →'}
            </button>
          </form>

          {/* Terms */}
          <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
            Al registrarte aceptas nuestros{' '}
            <Link href="/terminos" style={{ color: 'var(--teal)', textDecoration: 'underline' }}>Términos</Link>
            {' '}y{' '}
            <Link href="/privacidad" style={{ color: 'var(--teal)', textDecoration: 'underline' }}>Privacidad</Link>
          </p>
        </div>

        {/* Social proof */}
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 16, textAlign: 'center' }}>
          👥 142+ usuarios ya confían en NeuroTips
        </p>

        {/* Login link */}
        <p style={{ fontSize: 14, color: 'var(--sub)', marginTop: 16 }}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" style={{ color: 'var(--teal)', fontWeight: 600, textDecoration: 'none' }}>
            Iniciar sesión
          </Link>
        </p>

        {/* Telegram alternative */}
        <div style={{
          marginTop: 20, padding: '12px 20px',
          background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
          borderRadius: 10, textAlign: 'center',
        }}>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
            ¿Solo quieres probar? Recibe un pick gratis diario
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
            <a
              href="https://t.me/IaNeuroTips"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 13, fontWeight: 600, color: '#29B6F6',
                textDecoration: 'none',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#29B6F6"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161l-1.97 9.281c-.145.658-.537.818-1.084.508l-3-2.211-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121L8.31 13.53l-2.97-.924c-.645-.203-.658-.645.136-.954l11.566-4.458c.537-.194 1.006.131.83.967z"/></svg>
              Telegram
            </a>
            <a
              href="https://wa.me/56978516119?text=Hola%20NeuroTips%2C%20quiero%20info"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 13, fontWeight: 600, color: '#25D366',
                textDecoration: 'none',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
