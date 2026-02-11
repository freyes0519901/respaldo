'use client';

import { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://franciscoanalistadeportivo.pythonanywhere.com';

export default function CambiarPasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Completa todos los campos');
      return;
    }
    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (!/[A-Za-z]/.test(newPassword)) {
      setError('Debe contener al menos una letra');
      return;
    }
    if (!/\d/.test(newPassword)) {
      setError('Debe contener al menos un número');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }
    if (currentPassword === newPassword) {
      setError('La nueva contraseña debe ser diferente a la actual');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(data.error || 'Error al cambiar la contraseña');
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-[#64748B] hover:text-white transition">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Cambiar contraseña</h1>
          <p className="text-[#64748B] text-sm">Actualiza la contraseña de tu cuenta</p>
        </div>
      </div>

      {/* Card */}
      <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
        {success ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-[#00FF88]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-[#00FF88]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">¡Contraseña actualizada!</h2>
            <p className="text-[#94A3B8] text-sm mb-6">
              Tu contraseña ha sido cambiada correctamente.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="text-[#00FF88] hover:text-[#00E07A] transition text-sm font-semibold"
            >
              Volver
            </button>
          </div>
        ) : (
          <>
            {/* Security badge */}
            <div className="flex items-center gap-2 bg-[#00FF88]/5 border border-[#00FF88]/20 rounded-lg px-3 py-2 mb-6">
              <Shield className="h-4 w-4 text-[#00FF88] flex-shrink-0" />
              <span className="text-[#94A3B8] text-xs">Conexión segura · Tu contraseña se almacena encriptada</span>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-5 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Current password */}
              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">
                  Contraseña actual
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => { setCurrentPassword(e.target.value); setError(''); }}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-12 py-3 bg-[#050505] border border-white/10 rounded-lg text-white placeholder-[#64748B] focus:border-[#00FF88] focus:outline-none transition text-sm"
                  />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-white transition">
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-white/5" />

              {/* New password */}
              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-12 py-3 bg-[#050505] border border-white/10 rounded-lg text-white placeholder-[#64748B] focus:border-[#00FF88] focus:outline-none transition text-sm"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-white transition">
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[#64748B] text-xs mt-1.5">Mínimo 8 caracteres, al menos una letra y un número</p>
              </div>

              {/* Confirm new password */}
              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">
                  Confirmar nueva contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 bg-[#050505] border border-white/10 rounded-lg text-white placeholder-[#64748B] focus:border-[#00FF88] focus:outline-none transition text-sm"
                  />
                </div>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="w-full bg-[#00FF88] hover:bg-[#00E07A] disabled:bg-[#00FF88]/50 text-[#050505] font-bold py-3.5 rounded-lg transition flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  'Cambiar contraseña'
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
