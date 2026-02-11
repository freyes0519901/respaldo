'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle, Loader2, AlertCircle, Shield } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://franciscoanalistadeportivo.pythonanywhere.com';

export default function RecuperarPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Ingresa tu email');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        setSent(true);
      } else {
        setError(data.error || 'Error al enviar el correo');
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `linear-gradient(#00FF88 1px, transparent 1px), linear-gradient(90deg, #00FF88 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block">
            <div className="w-24 h-24 mx-auto mb-3 rounded-2xl overflow-hidden bg-[#0A0A0A] border-2 border-[#00FF88]/30 p-3 shadow-lg shadow-[#00FF88]/10">
              <img src="/logo.png" alt="NeuroTips" className="w-full h-full object-contain" />
            </div>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 sm:p-8">
          {sent ? (
            /* Success state */
            <div className="text-center">
              <div className="w-16 h-16 bg-[#00FF88]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-[#00FF88]" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">¡Correo enviado!</h1>
              <p className="text-[#94A3B8] text-sm mb-6">
                Si el email <span className="text-white font-medium">{email}</span> está registrado, 
                recibirás un enlace para restablecer tu contraseña.
              </p>
              <p className="text-[#64748B] text-xs mb-6">
                Revisa tu bandeja de entrada y spam. El enlace expira en 1 hora.
              </p>
              <Link href="/login" 
                className="inline-flex items-center gap-2 text-[#00FF88] hover:text-[#00E07A] transition text-sm font-semibold">
                <ArrowLeft className="h-4 w-4" />
                Volver al login
              </Link>
            </div>
          ) : (
            /* Form */
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-[#00FF88]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-[#00FF88]" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Recuperar contraseña</h1>
                <p className="text-[#94A3B8] text-sm">
                  Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-5 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      placeholder="tu@email.com"
                      className="w-full pl-11 pr-4 py-3 bg-[#050505] border border-white/10 rounded-lg text-white placeholder-[#64748B] focus:border-[#00FF88] focus:outline-none transition text-sm"
                      required
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-[#00FF88] hover:bg-[#00E07A] disabled:bg-[#00FF88]/50 text-[#050505] font-bold py-3.5 rounded-lg transition flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar enlace de recuperación'
                  )}
                </button>
              </form>

              <div className="mt-5 pt-5 border-t border-white/10 text-center">
                <Link href="/login" className="inline-flex items-center gap-2 text-[#94A3B8] hover:text-white transition text-sm">
                  <ArrowLeft className="h-4 w-4" />
                  Volver al login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
