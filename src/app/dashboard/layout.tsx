'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, Users, Calendar, Zap, Wallet,
  LogOut, Menu, X, ChevronRight, Crown, Flame, GraduationCap, KeyRound,
  Bell
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { authAPI, loadTokens, isAuthenticated, picksAPI, alertasAPI } from '@/lib/api';
import ErrorBoundary from '@/components/ErrorBoundary';
import SubscriptionGuard from '@/components/SubscriptionGuard';

interface BadgeCounts {
  apuestasPendientes: number;
  picksOro: number;
  alertasRachas: number;
  livePicks: number;
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard, badgeKey: null },
  { href: '/dashboard/tipsters', label: 'Tipsters', icon: Users, badgeKey: null },
  { href: '/dashboard/apuestas', label: 'Apuestas', icon: Calendar, badgeKey: 'apuestasPendientes' as const },
  { href: '/dashboard/recomendaciones', label: 'IA Picks', icon: Zap, badgeKey: 'picksOro' as const },
  { href: '/dashboard/mi-banca', label: 'Mi Banca', icon: Wallet, badgeKey: null },
  { href: '/dashboard/sala-vip', label: 'Sala VIP', icon: Flame, badgeKey: null },
  { href: '/dashboard/academia', label: 'Academia', icon: GraduationCap, badgeKey: null },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [badges, setBadges] = useState<BadgeCounts>({ apuestasPendientes: 0, picksOro: 0, alertasRachas: 0, livePicks: 0 });

  useEffect(() => {
    const checkAuth = async () => {
      loadTokens();
      
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }

      try {
        const response = await authAPI.getMe();
        setUser(response.user);
      } catch (error) {
        console.error('Auth error:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, setUser]);

  // ── Heartbeat: trackea usuarios activos cada 30s ──
  useEffect(() => {
    if (isLoading) return;
    
    const sendHeartbeat = () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/heartbeat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ page: pathname }),
      }).catch(() => {}); // Silencioso - no interrumpe la UX
    };

    sendHeartbeat(); // Enviar al cargar
    const interval = setInterval(sendHeartbeat, 30000); // Cada 30s
    return () => clearInterval(interval);
  }, [isLoading, pathname]);

  // ★ Badge counts — fetch live data for sidebar badges
  useEffect(() => {
    if (isLoading) return;
    const fetchBadges = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
        const [liveRes, rachasRes, dashRes] = await Promise.all([
          picksAPI.getLive().catch(() => ({ total_live: 0, live: [] })),
          alertasAPI.getRachas().catch(() => ({ total: 0 })),
          fetch(`${API_URL}/api/public/dashboard-ia`).then(r => r.ok ? r.json() : {}).catch(() => ({})),
        ]);

        const apuestas = (dashRes as any)?.apuestas?.apuestas || [];
        const pendientes = apuestas.filter((a: any) => !a.resultado || a.resultado === 'PENDIENTE' || a.resultado === '').length;
        const picksOro = (liveRes.live || []).filter((p: any) => p.neuroscore >= 75).length;

        setBadges({
          apuestasPendientes: pendientes,
          picksOro: picksOro || apuestas.filter((a: any) => a.ia_analysis?.zona === 'ORO').length,
          alertasRachas: rachasRes.total || 0,
          livePicks: liveRes.total_live || 0,
        });
      } catch {}
    };
    fetchBadges();
    const badgeInterval = setInterval(fetchBadges, 60000);
    return () => clearInterval(badgeInterval);
  }, [isLoading]);

  const handleLogout = () => {
    authAPI.logout();
    logout();
    router.push('/login');
  };

  const isSuscripcionActive = pathname.startsWith('/dashboard/suscripcion');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#00D1B2]/30 border-t-[#00D1B2] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 bg-[#1E293B] border-r border-[#334155]">
        {/* Logo NeuroTips */}
        <div className="p-6 border-b border-[#334155]">
          <Link href="/dashboard" className="flex items-center gap-3">
            <img 
              src="/logo-icon.png" 
              alt="NeuroTips" 
              style={{ width: '40px', height: '40px', borderRadius: '10px' }}
            />
            <div>
              <span className="text-xl font-bold text-white">
                Neuro<span style={{ color: '#00D1B2' }}>Tips</span>
              </span>
              <p style={{ fontSize: '10px', color: '#64748B', marginTop: '-2px', letterSpacing: '0.5px' }}>
                Análisis con IA
              </p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const isVip = item.href === '/dashboard/sala-vip';
            const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;
            const isPicks = item.href === '/dashboard/recomendaciones';
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                  isActive
                    ? isVip ? 'text-[#FFBB00]' : 'bg-[#00D1B2]/10 text-[#00D1B2]'
                    : isVip ? 'text-[#FFBB00]/70 hover:text-[#FFBB00] hover:bg-[#FFBB00]/5' : 'text-[#94A3B8] hover:bg-[#334155] hover:text-white'
                }`}
                style={isVip && isActive ? { background: 'rgba(255,187,0,0.1)' } : undefined}
              >
                <div className="relative">
                  <Icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                  {/* Live dot on Inicio when there are live picks */}
                  {item.href === '/dashboard' && badges.livePicks > 0 && (
                    <span style={{
                      position: 'absolute', top: '-2px', right: '-2px',
                      width: '7px', height: '7px', borderRadius: '50%',
                      background: '#EF4444', border: '1.5px solid #1E293B',
                      animation: 'badgePulse 1.5s ease-in-out infinite',
                    }} />
                  )}
                </div>
                <span className={`font-medium ${isVip ? 'font-bold' : ''}`}>{item.label}</span>
                
                {/* Dynamic badge */}
                {badgeCount > 0 && (
                  <span style={{
                    marginLeft: 'auto',
                    fontSize: '10px', fontWeight: 700, fontFamily: 'monospace',
                    padding: '1px 7px', borderRadius: '10px',
                    background: isPicks ? 'rgba(0, 209, 178, 0.15)' : 'rgba(255, 187, 0, 0.12)',
                    color: isPicks ? '#00D1B2' : '#FFBB00',
                    border: `1px solid ${isPicks ? 'rgba(0, 209, 178, 0.3)' : 'rgba(255, 187, 0, 0.25)'}`,
                    lineHeight: '16px',
                  }}>
                    {isPicks ? `${badgeCount} 🔥` : badgeCount}
                  </span>
                )}
                
                {isActive && !badgeCount && <ChevronRight className="h-4 w-4 ml-auto" />}
              </Link>
            );
          })}

          {/* Separador + Botón Suscripción */}
          <div className="pt-3 mt-3 border-t border-[#334155]">
            <Link
              href="/dashboard/suscripcion"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isSuscripcionActive ? 'text-[#FFBB00]' : 'text-[#FFBB00] hover:text-[#FFD700]'
              }`}
              style={{
                background: isSuscripcionActive
                  ? 'linear-gradient(135deg, rgba(255,187,0,0.15), rgba(249,115,22,0.1))'
                  : 'linear-gradient(135deg, rgba(255,187,0,0.08), rgba(249,115,22,0.05))',
                border: '1px solid rgba(255,187,0,0.25)',
              }}
            >
              <Crown className="h-5 w-5" />
              <span className="font-bold">Suscripción</span>
              {isSuscripcionActive && <ChevronRight className="h-4 w-4 ml-auto" />}
            </Link>
          </div>
        </nav>

        {/* User */}
        <div className="p-4 border-t border-[#334155]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#334155] flex items-center justify-center">
              <span className="text-white font-bold">
                {user?.nombre?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.nombre || 'Usuario'}</p>
              <p className="text-xs text-[#64748B] truncate">{user?.email}</p>
            </div>
          </div>
          <Link
            href="/dashboard/cambiar-password"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[#94A3B8] hover:bg-[#334155] hover:text-white transition-all mb-1"
          >
            <KeyRound className="h-4 w-4" />
            <span className="text-sm">Cambiar contraseña</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[#94A3B8] hover:bg-[#334155] hover:text-white transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#1E293B] border-b border-[#334155] z-40 px-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <img 
            src="/logo-icon.png" 
            alt="NeuroTips" 
            style={{ width: '32px', height: '32px', borderRadius: '8px' }}
          />
          <span className="text-lg font-bold text-white">
            Neuro<span style={{ color: '#00D1B2' }}>Tips</span>
          </span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-[#334155] transition-all"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <Menu className="h-6 w-6 text-white" />
          )}
        </button>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="absolute top-16 left-0 right-0 bg-[#1E293B] border-b border-[#334155] p-4 animate-fadeInUp"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || 
                  (item.href !== '/dashboard' && pathname.startsWith(item.href));
                const isVip = item.href === '/dashboard/sala-vip';
                const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;
                const isPicks = item.href === '/dashboard/recomendaciones';
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive
                        ? isVip ? 'bg-[#FFBB00]/10 text-[#FFBB00]' : 'bg-[#00D1B2]/10 text-[#00D1B2]'
                        : isVip ? 'text-[#FFBB00]/70' : 'text-[#94A3B8] hover:bg-[#334155]'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className={isVip ? 'font-bold' : ''}>{item.label}</span>
                    {badgeCount > 0 && (
                      <span style={{
                        marginLeft: 'auto',
                        fontSize: '10px', fontWeight: 700, fontFamily: 'monospace',
                        padding: '1px 7px', borderRadius: '10px',
                        background: isPicks ? 'rgba(0, 209, 178, 0.15)' : 'rgba(255, 187, 0, 0.12)',
                        color: isPicks ? '#00D1B2' : '#FFBB00',
                        border: `1px solid ${isPicks ? 'rgba(0, 209, 178, 0.3)' : 'rgba(255, 187, 0, 0.25)'}`,
                      }}>
                        {isPicks ? `${badgeCount} 🔥` : badgeCount}
                      </span>
                    )}
                  </Link>
                );
              })}

              {/* Suscripción en mobile menu */}
              <Link
                href="/dashboard/suscripcion"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-[#FFBB00]"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,187,0,0.1), rgba(249,115,22,0.05))',
                  border: '1px solid rgba(255,187,0,0.25)',
                }}
              >
                <Crown className="h-5 w-5" />
                <span className="font-bold">Suscripción</span>
              </Link>
            </nav>
            <div className="mt-4 pt-4 border-t border-[#334155]">
              <Link
                href="/dashboard/cambiar-password"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-[#94A3B8] hover:bg-[#334155] hover:text-white transition-all mb-1"
              >
                <KeyRound className="h-4 w-4" />
                <span>Cambiar contraseña</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-[#EF4444] hover:bg-[#EF4444]/10 transition-all"
              >
                <LogOut className="h-4 w-4" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav - 5 items */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#1E293B]/95 border-t border-[#334155] z-40 flex items-center justify-around px-2"
        style={{ backdropFilter: 'blur(16px)' }}>
        {[
          { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard, badgeKey: 'livePicks' as keyof BadgeCounts },
          { href: '/dashboard/apuestas', label: 'Apuestas', icon: Calendar, badgeKey: 'apuestasPendientes' as keyof BadgeCounts },
          { href: '/dashboard/sala-vip', label: 'VIP', icon: Flame, badgeKey: null },
          { href: '/dashboard/academia', label: 'Academia', icon: GraduationCap, badgeKey: null },
          { href: '/dashboard/suscripcion', label: 'Premium', icon: Crown, badgeKey: null },
        ].map((item) => {
          const Icon = item.icon;
          const isVipOrPremium = item.href === '/dashboard/sala-vip' || item.href === '/dashboard/suscripcion';
          const isActive = item.href === '/dashboard/suscripcion'
            ? isSuscripcionActive
            : pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const mBadge = item.badgeKey ? badges[item.badgeKey] : 0;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center p-2 rounded-lg transition-all relative"
              style={isActive ? {
                color: isVipOrPremium ? '#FFBB00' : '#00D1B2',
                filter: `drop-shadow(0 0 6px ${isVipOrPremium ? 'rgba(255,187,0,0.4)' : 'rgba(0,209,178,0.4)'})`,
              } : {
                color: isVipOrPremium ? '#FFBB00' : '#64748B',
              }}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {mBadge > 0 && (
                  <span style={{
                    position: 'absolute', top: '-5px', right: '-8px',
                    fontSize: '8px', fontWeight: 800, fontFamily: 'monospace',
                    padding: '0px 4px', borderRadius: '6px', lineHeight: '14px',
                    background: item.href === '/dashboard' ? '#EF4444' : '#FFBB00',
                    color: 'white', border: '1.5px solid #1E293B',
                    minWidth: '14px', textAlign: 'center',
                  }}>
                    {mBadge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
              {isActive && (
                <span style={{
                  position: 'absolute', bottom: '2px',
                  width: '4px', height: '4px', borderRadius: '50%',
                  background: isVipOrPremium ? '#FFBB00' : '#00D1B2',
                  boxShadow: `0 0 6px ${isVipOrPremium ? 'rgba(255,187,0,0.6)' : 'rgba(0,209,178,0.6)'}`,
                }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 pb-20 lg:pb-0 min-h-screen">
        <div className="p-4 lg:p-6">
          <ErrorBoundary>
            <SubscriptionGuard user={user}>
              {children}
            </SubscriptionGuard>
          </ErrorBoundary>
        </div>
      </main>

      <style jsx>{`
        @keyframes badgePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
