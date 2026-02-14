'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import {
  Mail, Lock, Eye, EyeOff, ArrowRight, TrendingUp,
  Shield, Zap, Crown, CheckCircle, MessageCircle, Phone,
  Brain, Target, BarChart3, Loader2, Flame
} from 'lucide-react';
import { authAPI, setTokens } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

// ═══════════════════════════════════════════════════════════════
// NEUROTIPS LOGIN v3 — LIVE STATS + GOOGLE AUTH + SECURITY
// Security: XSS-safe inputs, CSRF-aware, rate-limit friendly
// ═══════════════════════════════════════════════════════════════

const GOOGLE_CLIENT_ID = '644626606903-sm4b1s17p31c53esf4bbk5mm5q639emq.apps.googleusercontent.com';
const API = process.env.NEXT_PUBLIC_API_URL || '';

// Fallbacks si la API no responde
const STATS_FALLBACK = [
  { value: '61.9%', label: 'Win Rate Global', icon: Target, color: '#00D1B2' },
  { value: '+33', label: 'Tipsters IA', icon: Brain, color: '#0EA5E9' },
  { value: '1051+', label: 'Picks Verificados', icon: BarChart3, color: '#FFBB00' },
  { value: '79 🔥', label: 'Mejor Racha', icon: Flame, color: '#F59E0B' },
];

const FEATURES = [
  { text: 'Análisis con Inteligencia Artificial', icon: Brain },
  { text: 'Picks verificados con historial real', icon: CheckCircle },
  { text: 'Alertas en tiempo real por Telegram', icon: Zap },
  { text: 'Sala VIP con picks exclusivos', icon: Crown },
];

const HIGHLIGHTS = [
  { label: 'Gol Seguro Pro', text: '74.2% Win Rate con +22.5% ROI verificado en 62 picks. Especialista en Under/Over Goles.', stat: '⚽ #1 Tipster' },
  { label: 'Dato Mixto', text: '67.6% Win Rate multideporte. +17.3% ROI flat verificado en 37 picks.', stat: '🎯 Top 2' },
  { label: 'Sistema IA', text: '+33 tipsters verificados con IA. 1051+ picks analizados con certificación de 4 niveles. Mejor racha: 79 aciertos.', stat: '🧠 79 Racha' },
];

// Security: sanitize string for display (prevent XSS in API responses)
const sanitize = (str: string, maxLen = 50): string =>
  String(str).replace(/[<>"'&]/g, '').slice(0, maxLen);

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeHighlight, setActiveHighlight] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [liveStats, setLiveStats] = useState(STATS_FALLBACK);
  const [liveHighlights, setLiveHighlights] = useState(HIGHLIGHTS);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

  // ★ Detectar WebView de Telegram, Instagram, Facebook, WhatsApp
  useEffect(() => {
    const ua = navigator.userAgent || '';
    const inApp = /Telegram|Instagram|FBAN|FBAV|WhatsApp|Line\/|wv|WebView/i.test(ua);
    setIsInAppBrowser(inApp);
  }, []);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setActiveHighlight((prev) => (prev + 1) % liveHighlights.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [liveHighlights.length]);

  // ★ Fetch stats reales desde /api/public/stats (mismo endpoint que landing)
  useEffect(() => {
    const controller = new AbortController();
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API}/api/public/stats`, { signal: controller.signal });
        if (!res.ok) return;
        const d = await res.json();
        if (d && typeof d.total_picks === 'number') {
          // Stats cards — datos reales sanitizados
          setLiveStats([
            { value: `${Number(d.win_rate || 61.9).toFixed(1)}%`, label: 'Win Rate Global', icon: Target, color: '#00D1B2' },
            { value: `+${Math.abs(Math.floor(Number(d.total_tipsters || 33)))}`, label: 'Tipsters IA', icon: Brain, color: '#0EA5E9' },
            { value: `${Math.abs(Math.floor(Number(d.total_picks || 1051)))}+`, label: 'Picks Verificados', icon: BarChart3, color: '#FFBB00' },
            { value: `${Math.abs(Math.floor(Number(d.mejor_racha || 79)))} 🔥`, label: 'Mejor Racha', icon: Flame, color: '#F59E0B' },
          ]);

          // Highlights — top tipsters dinámicos
          if (d.top_tipsters && Array.isArray(d.top_tipsters) && d.top_tipsters.length >= 2) {
            const tp = d.top_tipsters;
            setLiveHighlights([
              {
                label: sanitize(tp[0]?.alias || 'Gol Seguro Pro'),
                text: `${Number(tp[0]?.wr || 74.2).toFixed(1)}% Win Rate con +${Number(tp[0]?.roi || 22.5).toFixed(1)}% ROI verificado en ${Math.floor(Number(tp[0]?.picks || 62))} picks.`,
                stat: '⚽ #1 Tipster',
              },
              {
                label: sanitize(tp[1]?.alias || 'Dato Mixto'),
                text: `${Number(tp[1]?.wr || 67.6).toFixed(1)}% Win Rate. +${Number(tp[1]?.roi || 17.3).toFixed(1)}% ROI flat verificado en ${Math.floor(Number(tp[1]?.picks || 37))} picks.`,
                stat: '🎯 Top 2',
              },
              {
                label: 'Sistema IA',
                text: `+${Math.floor(Number(d.total_tipsters || 33))} tipsters verificados con IA. ${Math.floor(Number(d.total_picks || 1051))}+ picks analizados con certificación de 4 niveles. Mejor racha: ${Math.floor(Number(d.mejor_racha || 79))} aciertos.`,
                stat: `🧠 ${Math.floor(Number(d.mejor_racha || 79))} Racha`,
              },
            ]);
          }
        }
      } catch {
        // Silent fallback — uses STATS_FALLBACK defaults
      }
    };
    fetchStats();
    return () => controller.abort();
  }, []);

  // Google OAuth
  const initializeGoogle = () => {
    try {
      (window as any).google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      setGoogleReady(true);
    } catch (e) { console.error('Google init error:', e); }
  };

  const handleGoogleResponse = async (response: any) => {
    if (!response.credential) { setError('No se recibió respuesta de Google'); setGoogleLoading(false); return; }
    setGoogleLoading(true); setError('');
    try {
      const data = await authAPI.socialLogin('google', response.credential);
      setUser(data.user);
      if (data.is_new_user) {
        router.push('/comunidad');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al iniciar sesión con Google');
    } finally { setGoogleLoading(false); }
  };

  const handleGoogleClick = () => {
    if (!googleReady) { setError('Google Sign-In cargando... Intenta de nuevo.'); return; }
    setGoogleLoading(true); setError('');
    try {
      (window as any).google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setGoogleLoading(false);
        }
      });
    } catch (e) { setError('Error al abrir Google Sign-In'); setGoogleLoading(false); }
  };

  // Email/password login — Security: trim + length validation
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPass = password.trim();

    // Security: input validation
    if (!trimmedEmail || !trimmedPass) { setError('Completa todos los campos'); return; }
    if (trimmedEmail.length > 254) { setError('Email demasiado largo'); return; }
    if (trimmedPass.length > 128) { setError('Contraseña demasiado larga'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) { setError('Email no válido'); return; }

    setLoading(true); setError('');

    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password: trimmedPass }),
      });
      const data = await res.json();
      if (res.ok && data.access_token) {
        localStorage.setItem('token', data.access_token);
        if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
          setUser(data.user);
        }
        router.push('/dashboard');
      } else {
        setError(data.error || 'Credenciales incorrectas');
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!isInAppBrowser && (
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={() => initializeGoogle()} />
      )}

      <div className="min-h-screen flex" style={{ background: '#0B0F1A' }}>

        {/* LEFT PANEL */}
        <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col justify-between p-12"
          style={{ background: 'linear-gradient(145deg, #0B0F1A 0%, #0F172A 50%, #0B1120 100%)' }}>

          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 opacity-[0.03]"
              style={{ backgroundImage: `linear-gradient(rgba(0,209,178,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,209,178,0.5) 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />
            <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,209,178,0.08) 0%, transparent 70%)', animation: mounted ? 'float 8s ease-in-out infinite' : 'none' }} />
            <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,187,0,0.06) 0%, transparent 70%)', animation: mounted ? 'float 10s ease-in-out 2s infinite reverse' : 'none' }} />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-16" style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(-20px)', transition: 'all 0.8s ease' }}>
              <img src="/logo.png" alt="NeuroTips" className="w-14 h-14 rounded-xl" style={{ boxShadow: '0 0 30px rgba(0,209,178,0.3)' }} />
              <div>
                <h1 className="text-2xl font-black tracking-tight" style={{ background: 'linear-gradient(135deg, #00D1B2, #0EA5E9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>NeuroTips</h1>
                <p className="text-[10px] text-[#64748B] tracking-[0.2em] uppercase">Análisis con IA</p>
              </div>
            </div>
            <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.8s ease 0.2s' }}>
              <h2 className="text-5xl font-black text-white leading-[1.1] mb-6">
                Decisiones<br />
                <span style={{ background: 'linear-gradient(135deg, #00D1B2, #FFBB00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>inteligentes,</span><br />
                resultados<br />
                <span className="text-[#FFBB00]">rentables.</span>
              </h2>
              <p className="text-[#94A3B8] text-lg leading-relaxed max-w-md">La plataforma de análisis deportivo impulsada por inteligencia artificial.</p>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-4 gap-4 my-10" style={{ opacity: mounted ? 1 : 0, transition: 'all 0.8s ease 0.4s' }}>
            {liveStats.map((stat, i) => (
              <div key={i} className="text-center p-4 rounded-xl" style={{ background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(100, 116, 139, 0.1)' }}>
                <stat.icon className="w-5 h-5 mx-auto mb-2" style={{ color: stat.color }} />
                <div className="text-xl font-black text-white">{stat.value}</div>
                <div className="text-[10px] text-[#64748B] uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-3" style={{ opacity: mounted ? 1 : 0, transition: 'all 0.8s ease 0.6s' }}>
            {FEATURES.map((feature, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(30, 41, 59, 0.3)', border: '1px solid rgba(100, 116, 139, 0.08)' }}>
                <feature.icon className="w-4 h-4 text-[#00D1B2]" />
                <span className="text-xs text-[#94A3B8]">{feature.text}</span>
              </div>
            ))}
          </div>

          <div className="relative z-10 mt-10 p-5 rounded-xl" style={{ background: 'rgba(0, 209, 178, 0.05)', border: '1px solid rgba(0, 209, 178, 0.15)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#00D1B2] uppercase tracking-wider">{liveHighlights[activeHighlight].label}</span>
              <span className="text-xs text-[#FFBB00] font-bold">{liveHighlights[activeHighlight].stat}</span>
            </div>
            <p className="text-sm text-[#94A3B8] leading-relaxed">{liveHighlights[activeHighlight].text}</p>
            <div className="flex gap-1.5 mt-4">
              {liveHighlights.map((_, i) => (
                <div key={i} className="h-1 rounded-full transition-all duration-300" style={{ width: i === activeHighlight ? '24px' : '8px', background: i === activeHighlight ? '#00D1B2' : 'rgba(100, 116, 139, 0.3)' }} />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="lg:hidden text-center mb-8">
              <img src="/logo.png" alt="NeuroTips" className="w-16 h-16 mx-auto rounded-xl mb-3" style={{ boxShadow: '0 0 20px rgba(0,209,178,0.2)' }} />
            </div>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-white mb-2">Bienvenido</h2>
              <p className="text-[#64748B] text-sm">Ingresa a tu cuenta para continuar</p>
            </div>

            {/* ★ Banner WebView — abrir en navegador externo */}
            {isInAppBrowser && (
              <div className="mb-5 rounded-xl p-4 text-center" style={{
                background: 'rgba(255, 187, 0, 0.08)',
                border: '1px solid rgba(255, 187, 0, 0.25)',
              }}>
                <p className="text-[#FFBB00] text-xs font-bold mb-2">⚠️ Estás en un navegador integrado</p>
                <p className="text-[#94A3B8] text-[11px] mb-3">Google Sign-In no funciona aquí. Abre en tu navegador para usar todas las funciones.</p>
                <button
                  onClick={() => {
                    const url = window.location.href;
                    window.open(url, '_system');
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(url).catch(() => {});
                    }
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-bold transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #00D1B2, #0EA5E9)',
                    color: 'white',
                  }}
                >
                  🌐 Abrir en navegador
                </button>
                <p className="text-[#64748B] text-[10px] mt-2">O inicia sesión con email abajo ↓</p>
              </div>
            )}

            {/* Google Button — solo si NO es WebView */}
            {!isInAppBrowser && (
              <button onClick={handleGoogleClick} disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] disabled:opacity-50 mb-6"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
                {googleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                <span>Continuar con Google</span>
              </button>
            )}

            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px" style={{ background: 'rgba(100, 116, 139, 0.15)' }} />
              <span className="text-[10px] text-[#475569] uppercase tracking-wider">O con email</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(100, 116, 139, 0.15)' }} />
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569] group-focus-within:text-[#00D1B2] transition-colors" />
                  <input type="email" value={email} onChange={(e) => { setEmail(e.target.value.slice(0, 254)); setError(''); }} placeholder="tu@email.com"
                    autoComplete="email"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-[#475569] outline-none transition-all"
                    style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(100, 116, 139, 0.2)' }}
                    onFocus={(e) => e.target.style.borderColor = 'rgba(0, 209, 178, 0.5)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(100, 116, 139, 0.2)'} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Contraseña</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569] group-focus-within:text-[#00D1B2] transition-colors" />
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value.slice(0, 128)); setError(''); }} placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full pl-11 pr-12 py-3.5 rounded-xl text-sm text-white placeholder-[#475569] outline-none transition-all"
                    style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(100, 116, 139, 0.2)' }}
                    onFocus={(e) => e.target.style.borderColor = 'rgba(0, 209, 178, 0.5)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(100, 116, 139, 0.2)'} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#94A3B8] transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link href="/recuperar" className="text-xs text-[#00D1B2] hover:text-[#00E8C8] transition-colors">¿Olvidaste tu contraseña?</Link>
              </div>

              {error && (
                <div className="rounded-lg p-3 text-xs text-red-400 flex items-center gap-2" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <Shield className="w-4 h-4 flex-shrink-0" />{error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #00D1B2, #0EA5E9)', color: '#FFF', boxShadow: '0 4px 20px rgba(0, 209, 178, 0.3)' }}>
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (<>Iniciar Sesión<ArrowRight className="w-4 h-4" /></>)}
              </button>
            </form>

            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px" style={{ background: 'rgba(100, 116, 139, 0.15)' }} />
              <span className="text-[10px] text-[#475569] uppercase tracking-wider">Comunidad</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(100, 116, 139, 0.15)' }} />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8">
              <a href="https://t.me/IaNeuroTips" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all hover:scale-[1.02]"
                style={{ background: 'rgba(14, 165, 233, 0.1)', border: '1px solid rgba(14, 165, 233, 0.25)', color: '#0EA5E9' }}>
                <MessageCircle className="w-4 h-4" />Telegram
              </a>
              <a href="https://wa.me/56978516119?text=Hola%20NeuroTips%20quiero%20info" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all hover:scale-[1.02]"
                style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.25)', color: '#22C55E' }}>
                <Phone className="w-4 h-4" />WhatsApp
              </a>
            </div>

            <div className="text-center space-y-4">
              <p className="text-sm text-[#64748B]">¿No tienes cuenta? <Link href="/registro" className="font-bold text-[#00D1B2] hover:text-[#00E8C8] transition-colors">Regístrate gratis</Link></p>
              <Link href="/registro" className="block w-full py-3 rounded-xl text-xs font-bold text-center transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, rgba(255, 187, 0, 0.08), rgba(249, 115, 22, 0.05))', border: '1px solid rgba(255, 187, 0, 0.2)', color: '#FFBB00' }}>
                <span className="flex items-center justify-center gap-2"><Crown className="w-4 h-4" />Empieza con 5 días Premium gratis<ArrowRight className="w-3 h-3" /></span>
              </Link>
            </div>

            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/" className="text-[10px] text-[#475569] hover:text-[#94A3B8] transition-colors">← Volver al inicio</Link>
              <span className="text-[#1E293B]">·</span>
              <span className="text-[10px] text-[#475569]"><Shield className="w-3 h-3 inline mr-1" />Conexión segura SSL</span>
            </div>
          </div>
        </div>

        <style jsx global>{`
          @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-30px); } }
          input:-webkit-autofill { -webkit-box-shadow: 0 0 0 30px #1E293B inset !important; -webkit-text-fill-color: #FFF !important; }
        `}</style>
      </div>
    </>
  );
}
