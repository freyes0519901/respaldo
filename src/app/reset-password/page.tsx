'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Lock, AlertCircle, Loader2, ArrowLeft, CheckCircle, Eye, EyeOff, Shield } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://franciscoanalistadeportivo.pythonanywhere.com';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Token inválido o faltante');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (!/[A-Za-z]/.test(password)) {
      setError('La contraseña debe contener al menos una letra');
      return;
    }
    if (!/\d/.test(password)) {
      setError('La contraseña debe contener al menos un número');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/login'), 3000);
      } else {
        setError(data.error || 'Error al restablecer la contraseña');
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
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
          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-[#00FF88]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-[#00FF88]" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">¡Contraseña actualizada!</h1>
              <p className="text-[#94A3B8] text-sm mb-6">
                Tu contraseña ha sido restablecida correctamente. Serás redirigido al inicio de sesión...
              </p>
              <div className="flex items-center justify-center gap-2 text-[#64748B]">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Redirigiendo...</span>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-[#00FF88]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-[#00FF88]" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Nueva contraseña</h1>
                <p className="text-[#94A3B8] text-sm">
                  Ingresa tu nueva contraseña para restablecer el acceso a tu cuenta.
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-5 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {!token ? (
                <div className="text-center">
                  <p className="text-[#94A3B8] text-sm mb-4">El enlace no es válido o ha expirado.</p>
                  <Link href="/recuperar" className="text-[#00FF88] hover:text-[#00E07A] transition text-sm font-semibold">
                    Solicitar nuevo enlace
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">Nueva contraseña</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-11 pr-12 py-3 bg-[#050505] border border-white/10 rounded-lg text-white placeholder-[#64748B] focus:border-[#00FF88] focus:outline-none transition text-sm"
                        placeholder="••••••••"
                        required
                        disabled={isLoading}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-white transition">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-[#64748B] text-xs mt-1.5">Mínimo 8 caracteres, al menos una letra y un número</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">Confirmar contraseña</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-[#050505] border border-white/10 rounded-lg text-white placeholder-[#64748B] focus:border-[#00FF88] focus:outline-none transition text-sm"
                        placeholder="••••••••"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={isLoading}
                    className="w-full bg-[#00FF88] hover:bg-[#00E07A] disabled:bg-[#00FF88]/50 text-[#050505] font-bold py-3.5 rounded-lg transition flex items-center justify-center gap-2 mt-2">
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Actualizando...
                      </>
                    ) : (
                      'Restablecer contraseña'
                    )}
                  </button>
                </form>
              )}

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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#00FF88]" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
