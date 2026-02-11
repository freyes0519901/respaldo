'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth, adminFetch } from './layout';
import { 
  AlertTriangle, TrendingUp, TrendingDown, Users, 
  CheckCircle, XCircle, RefreshCw, Trophy, Target,
  DollarSign, Activity, Clock, Wifi, Crown, Star,
  ShieldAlert, Pause, Eye, ChevronDown, ChevronUp,
  BarChart3, Settings, Globe, Save
} from 'lucide-react';

// ============================================================
// TIPOS
// ============================================================

interface DashboardStats {
  total_usuarios?: number;
  usuarios_premium?: number;
  usuarios_trial?: number;
  usuarios_online?: number;
  tipsters_activos?: number;
  total_apuestas?: number;
  apuestas_pendientes?: number;
  profit_total?: number;
  win_rate?: number;
}

interface TipsterStat {
  id: number;
  nombre_real: string;
  alias: string;
  deporte: string;
  total_apuestas: number;
  ganadas: number;
  perdidas: number;
  pendientes: number;
  win_rate: number;
  profit: number;
  roi: number;
  racha_actual: number;
}

interface ApuestaReciente {
  id: number;
  fecha: string;
  tipster_id: number;
  tipster_nombre?: string;
  tipster_alias?: string;
  apuesta: string;
  cuota: number;
  stake_ia: number;
  resultado: string;
  ganancia_neta: number;
  tipo_mercado?: string;
  racha_actual?: number;
}

interface UsuarioActivo {
  id: number;
  email: string;
  nombre: string;
  plan: string;
  last_active: string;
}

interface MercadoDetail {
  mercado: string;
  apuestas: number;
  win_rate: number;
  profit: number;
  estado: string;
}

interface AlertaEstrategia {
  tipster_id: number;
  alias: string;
  deporte: string;
  nivel: 'rojo' | 'amarillo' | 'verde';
  score: number;
  sugerencia: string;
  razones: string[];
  metricas: {
    wr_total: number;
    wr_20: number;
    wr_diff: number;
    racha: number;
    roi_total: number;
    roi_30: number;
    drawdown_pct: number;
    total_apuestas: number;
    profit_total: number;
  };
  mercados: MercadoDetail[];
}

interface RegistroDia {
  dia: string;
  cantidad: number;
  premium: number;
  trial: number;
}

// ============================================================
// COMPONENTES
// ============================================================

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-CL', { 
    style: 'currency', currency: 'CLP', maximumFractionDigits: 0 
  }).format(value);
};

const StatCard = ({ 
  icon: Icon, label, value, subtitle, color = 'teal', trend
}: { 
  icon: React.ElementType; label: string; value: string | number; 
  subtitle?: string; color?: string; trend?: 'up' | 'down' | null;
}) => {
  const colorClasses: Record<string, string> = {
    teal: 'from-teal-500 to-teal-600', emerald: 'from-emerald-500 to-emerald-600',
    amber: 'from-amber-500 to-amber-600', red: 'from-red-500 to-red-600',
    blue: 'from-blue-500 to-blue-600', purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
  };
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorClasses[color] || colorClasses.teal} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <span className={trend === 'up' ? 'text-emerald-400' : 'text-red-400'}>
            {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          </span>
        )}
      </div>
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
};

const ResultBadge = ({ resultado }: { resultado: string }) => {
  if (resultado === 'GANADA') return <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium"><CheckCircle className="w-3 h-3" /> GANADA</span>;
  if (resultado === 'PERDIDA') return <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium"><XCircle className="w-3 h-3" /> PERDIDA</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-xs font-medium"><Clock className="w-3 h-3" /> PENDIENTE</span>;
};

const RachaBadge = ({ racha }: { racha: number }) => {
  const color = racha >= 3 ? 'text-amber-400' : racha > 0 ? 'text-emerald-400' : racha === 0 ? 'text-gray-400' : 'text-red-400';
  const emoji = racha >= 3 ? '🔥' : racha > 0 ? '📈' : racha === 0 ? '➡️' : '📉';
  return <span className={`font-mono font-bold ${color}`}>{emoji} {racha > 0 ? `+${racha}` : racha}</span>;
};

const PlanBadge = ({ plan }: { plan: string }) => {
  if (plan === 'PREMIUM') return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-[10px] font-bold"><Crown className="w-3 h-3" /> PREMIUM</span>;
  if (plan === 'FREE_TRIAL') return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-[10px] font-bold"><Star className="w-3 h-3" /> TRIAL</span>;
  return <span className="px-2 py-0.5 bg-slate-600/50 text-gray-400 rounded-full text-[10px] font-bold">FREE</span>;
};

const PulseIndicator = () => (
  <span className="relative flex h-2.5 w-2.5">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
  </span>
);

const timeAgo = (isoDate: string): string => {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins}m`;
  return `hace ${Math.floor(mins / 60)}h`;
};

const NivelBadge = ({ nivel }: { nivel: string }) => {
  if (nivel === 'rojo') return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs font-bold border border-red-500/30"><ShieldAlert className="w-3.5 h-3.5" /> CAMBIAR ESTRATEGIA</span>;
  if (nivel === 'amarillo') return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-xs font-bold border border-amber-500/30"><Eye className="w-3.5 h-3.5" /> MONITOREAR</span>;
  return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold border border-emerald-500/30"><CheckCircle className="w-3.5 h-3.5" /> ESTABLE</span>;
};

const RegistrosChart = ({ datos }: { datos: RegistroDia[] }) => {
  if (!datos.length) return <p className="text-gray-500 text-center py-8">Sin datos</p>;
  const max = Math.max(...datos.map(d => d.cantidad), 1);
  return (
    <div className="flex items-end gap-1 h-32 px-2">
      {datos.map((d, i) => {
        const height = Math.max((d.cantidad / max) * 100, 4);
        const fecha = new Date(d.dia + 'T12:00:00');
        const label = `${fecha.getDate()}/${fecha.getMonth() + 1}`;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-700 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
              {label}: {d.cantidad} ({d.premium}p, {d.trial}t)
            </div>
            <div className="w-full rounded-t transition-all hover:opacity-80"
              style={{ height: `${height}%`, background: d.cantidad > 0 ? 'linear-gradient(to top, rgba(0,209,178,0.6), rgba(0,209,178,0.9))' : 'rgba(100,116,139,0.2)', minHeight: '3px' }} />
            {i % Math.max(Math.floor(datos.length / 7), 1) === 0 && (
              <span className="text-[9px] text-gray-500">{label}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function AdminDashboard() {
  const { accessToken } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tipsters, setTipsters] = useState<TipsterStat[]>([]);
  const [apuestas, setApuestas] = useState<ApuestaReciente[]>([]);
  const [usuariosOnline, setUsuariosOnline] = useState<UsuarioActivo[]>([]);
  const [alertas, setAlertas] = useState<AlertaEstrategia[]>([]);
  const [alertasResumen, setAlertasResumen] = useState<{ rojos: number; amarillos: number; verdes: number }>({ rojos: 0, amarillos: 0, verdes: 0 });
  const [registros, setRegistros] = useState<RegistroDia[]>([]);
  const [expandedAlerta, setExpandedAlerta] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // ★ Config Resultados Públicos
  const [resConfig, setResConfig] = useState({
    resultados_periodo_default: 'semana',
    resultados_mostrar_pendientes: 'true',
    resultados_mostrar_top_tipsters: 'true',
    resultados_max_items: '200',
    resultados_deportes_habilitados: 'Fútbol,Tenis,Básquet,eSports,Hockey,Béisbol',
    resultados_cta_visible: 'true',
    resultados_page_activa: 'true',
  });
  const [resConfigSaving, setResConfigSaving] = useState(false);
  const [resConfigSaved, setResConfigSaved] = useState(false);

  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    try {
      setIsLoading(true);
      setError(null);

      const [statsRes, tipstersRes, apuestasRes, onlineRes, alertasRes, registrosRes] = await Promise.all([
        adminFetch('/api/admin/dashboard/stats', {}, accessToken),
        adminFetch('/api/admin/tipsters/stats', {}, accessToken),
        adminFetch('/api/admin/apuestas?limit=15', {}, accessToken),
        adminFetch('/api/admin/usuarios-activos', {}, accessToken),
        adminFetch('/api/admin/estrategia/salud', {}, accessToken),
        adminFetch('/api/admin/usuarios/por-dia?dias=30', {}, accessToken),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (tipstersRes.ok) {
        const td = await tipstersRes.json();
        setTipsters((td || []).sort((a: TipsterStat, b: TipsterStat) => (b.roi || 0) - (a.roi || 0)).slice(0, 10));
      }
      if (apuestasRes.ok) {
        const ad = await apuestasRes.json();
        setApuestas((ad.apuestas || ad.data || []).slice(0, 10));
      }
      if (onlineRes.ok) { const od = await onlineRes.json(); setUsuariosOnline(od.usuarios || []); }
      if (alertasRes.ok) { const ald = await alertasRes.json(); setAlertas(ald.alertas || []); setAlertasResumen(ald.resumen || { rojos: 0, amarillos: 0, verdes: 0 }); }
      if (registrosRes.ok) { const rd = await registrosRes.json(); setRegistros(rd.dias || []); }

      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Error al cargar datos. Verifica tu conexión.');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ★ Fetch & Save Resultados Config
  useEffect(() => {
    if (!accessToken) return;
    const fetchResConfig = async () => {
      try {
        const resp = await adminFetch('/api/admin/config/resultados', {}, accessToken);
        if (resp.ok) {
          const data = await resp.json();
          setResConfig(data);
        }
      } catch {}
    };
    fetchResConfig();
  }, [accessToken]);

  const saveResConfig = async () => {
    if (!accessToken) return;
    setResConfigSaving(true);
    setResConfigSaved(false);
    try {
      const resp = await adminFetch('/api/admin/config/resultados', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resConfig),
      }, accessToken);
      if (resp.ok) {
        setResConfigSaved(true);
        setTimeout(() => setResConfigSaved(false), 3000);
      }
    } catch {} finally {
      setResConfigSaving(false);
    }
  };

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={fetchData} className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg flex items-center gap-2 mx-auto">
            <RefreshCw className="w-4 h-4" /> Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400">Resumen general del sistema</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && <span className="text-xs text-gray-500">Actualizado: {lastUpdate.toLocaleTimeString()}</span>}
          <button onClick={fetchData} disabled={isLoading}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Actualizar
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={Users} label="Usuarios Registrados" value={stats?.total_usuarios || 0}
          subtitle={`${stats?.usuarios_premium || 0} premium · ${stats?.usuarios_trial || 0} trial`} color="blue" />
        <StatCard icon={Wifi} label="Usuarios Online" value={stats?.usuarios_online || 0} color="green" />
        <StatCard icon={Trophy} label="Tipsters Activos" value={stats?.tipsters_activos || 0} color="purple" />
        <StatCard icon={Target} label="Total Apuestas" value={stats?.total_apuestas || 0}
          subtitle={stats?.apuestas_pendientes ? `${stats.apuestas_pendientes} pendientes` : undefined} color="teal" />
        <StatCard icon={Activity} label="Win Rate Global" value={`${(stats?.win_rate || 0).toFixed(1)}%`} color="amber"
          trend={(stats?.win_rate || 0) >= 55 ? 'up' : (stats?.win_rate || 0) < 50 ? 'down' : null} />
      </div>

      {/* Profit + Registros */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 border border-slate-600 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Profit Total Acumulado</p>
              <p className={`text-4xl font-bold ${(stats?.profit_total || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatCurrency(stats?.profit_total || 0)}
              </p>
            </div>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${(stats?.profit_total || 0) >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
              <DollarSign className={`w-8 h-8 ${(stats?.profit_total || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
            </div>
          </div>
          {stats?.apuestas_pendientes && stats.apuestas_pendientes > 0 && (
            <p className="text-amber-400 text-sm mt-3 flex items-center gap-1"><Clock className="w-4 h-4" /> {stats.apuestas_pendientes} apuestas pendientes</p>
          )}
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" /> Registros últimos 30 días
            </h3>
            <span className="text-xs text-gray-400">Total: {registros.reduce((s, d) => s + d.cantidad, 0)}</span>
          </div>
          <RegistrosChart datos={registros} />
        </div>
      </div>

      {/* ═══ ALERTAS DE ESTRATEGIA ═══ */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" /> Salud de Estrategia
          </h2>
          <div className="flex items-center gap-3 text-xs">
            {alertasResumen.rojos > 0 && <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full font-bold">🔴 {alertasResumen.rojos}</span>}
            {alertasResumen.amarillos > 0 && <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full font-bold">🟡 {alertasResumen.amarillos}</span>}
            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full font-bold">🟢 {alertasResumen.verdes}</span>
          </div>
        </div>

        <div className="divide-y divide-slate-700">
          {alertas.map((alerta) => {
            const isExpanded = expandedAlerta === alerta.tipster_id;
            const m = alerta.metricas;
            const borderColor = alerta.nivel === 'rojo' ? 'border-l-red-500' : alerta.nivel === 'amarillo' ? 'border-l-amber-500' : 'border-l-emerald-500';
            
            return (
              <div key={alerta.tipster_id} className={`border-l-4 ${borderColor}`}>
                <div className="p-4 hover:bg-slate-700/30 transition-colors cursor-pointer flex items-center gap-4"
                  onClick={() => setExpandedAlerta(isExpanded ? null : alerta.tipster_id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-white font-bold">{alerta.alias}</span>
                      <span className="text-xs text-gray-500">{alerta.deporte}</span>
                      <NivelBadge nivel={alerta.nivel} />
                    </div>
                    {alerta.razones.length > 0 && (
                      <p className="text-xs text-gray-400 mt-1 truncate">{alerta.razones.join(' · ')}</p>
                    )}
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-xs flex-shrink-0">
                    <div className="text-center">
                      <p className={`font-bold ${m.wr_diff >= 0 ? 'text-emerald-400' : m.wr_diff > -10 ? 'text-amber-400' : 'text-red-400'}`}>{m.wr_diff > 0 ? '+' : ''}{m.wr_diff}%</p>
                      <p className="text-gray-500">WR Δ</p>
                    </div>
                    <div className="text-center">
                      <p className={`font-bold ${m.racha >= 0 ? 'text-emerald-400' : m.racha > -4 ? 'text-amber-400' : 'text-red-400'}`}>{m.racha > 0 ? '+' : ''}{m.racha}</p>
                      <p className="text-gray-500">Racha</p>
                    </div>
                    <div className="text-center">
                      <p className={`font-bold ${m.roi_30 >= 0 ? 'text-emerald-400' : m.roi_30 > -5 ? 'text-amber-400' : 'text-red-400'}`}>{m.roi_30 > 0 ? '+' : ''}{m.roi_30}%</p>
                      <p className="text-gray-500">ROI 30d</p>
                    </div>
                    <div className="text-center">
                      <p className={`font-bold ${m.drawdown_pct < 15 ? 'text-emerald-400' : m.drawdown_pct < 30 ? 'text-amber-400' : 'text-red-400'}`}>{m.drawdown_pct}%</p>
                      <p className="text-gray-500">DD</p>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-700/50 bg-slate-800/50">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3">
                      <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                        <p className="text-[10px] text-gray-400 uppercase mb-1">WR Total</p>
                        <p className="text-white font-bold">{m.wr_total}%</p>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                        <p className="text-[10px] text-gray-400 uppercase mb-1">WR Últ. 20</p>
                        <p className={`font-bold ${m.wr_20 >= m.wr_total ? 'text-emerald-400' : 'text-red-400'}`}>{m.wr_20}%</p>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                        <p className="text-[10px] text-gray-400 uppercase mb-1">ROI Total</p>
                        <p className={`font-bold ${m.roi_total >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{m.roi_total > 0 ? '+' : ''}{m.roi_total}%</p>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                        <p className="text-[10px] text-gray-400 uppercase mb-1">Apuestas</p>
                        <p className="text-white font-bold">{m.total_apuestas}</p>
                      </div>
                    </div>

                    {alerta.mercados.length > 0 && (
                      <div className="mt-2">
                        <p className="text-[10px] text-gray-400 uppercase mb-2">Performance por Mercado (últ. 30)</p>
                        <div className="flex flex-wrap gap-2">
                          {alerta.mercados.map((merc, i) => (
                            <span key={i} className={`px-2 py-1 rounded-lg text-[11px] font-medium border ${
                              merc.estado === 'verde' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                              {merc.mercado} ({merc.apuestas}) — WR {merc.win_rate}%
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className={`mt-3 p-3 rounded-lg flex items-start gap-2 text-sm ${
                      alerta.nivel === 'rojo' ? 'bg-red-500/10 border border-red-500/20' :
                      alerta.nivel === 'amarillo' ? 'bg-amber-500/10 border border-amber-500/20' :
                      'bg-emerald-500/10 border border-emerald-500/20'
                    }`}>
                      <Pause className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <p className={alerta.nivel === 'rojo' ? 'text-red-300' : alerta.nivel === 'amarillo' ? 'text-amber-300' : 'text-emerald-300'}>
                        {alerta.sugerencia}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Usuarios Online */}
      {usuariosOnline.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <PulseIndicator /> Usuarios Online Ahora
              <span className="text-sm font-normal text-emerald-400">({usuariosOnline.length})</span>
            </h2>
          </div>
          <div className="p-4 flex flex-wrap gap-3">
            {usuariosOnline.map((u) => (
              <div key={u.id} className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-2">
                <PulseIndicator />
                <div>
                  <p className="text-white text-sm font-medium">{u.nombre || u.email.split('@')[0]}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400">{u.email}</span>
                    <PlanBadge plan={u.plan} />
                    <span className="text-[10px] text-gray-500">{timeAgo(u.last_active)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Apuestas + Top Tipsters */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Target className="w-5 h-5 text-teal-400" /> Apuestas Recientes</h2>
            <a href="/admin/apuestas" className="text-teal-400 hover:text-teal-300 text-sm">Ver todas →</a>
          </div>
          <div className="divide-y divide-slate-700">
            {apuestas.length > 0 ? apuestas.map((apuesta) => (
              <div key={apuesta.id} className="p-4 hover:bg-slate-700/30 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-teal-400 font-mono text-sm">#{apuesta.id}</span>
                    <span className="text-gray-500 text-xs">{apuesta.tipster_alias || apuesta.tipster_nombre || ''}</span>
                    {apuesta.racha_actual !== undefined && <RachaBadge racha={apuesta.racha_actual} />}
                  </div>
                  <ResultBadge resultado={apuesta.resultado} />
                </div>
                <p className="text-white text-sm mb-2 line-clamp-1">{apuesta.apuesta}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">@{apuesta.cuota} • {formatCurrency(apuesta.stake_ia)}{apuesta.tipo_mercado && ` • ${apuesta.tipo_mercado}`}</span>
                  <span className={apuesta.ganancia_neta >= 0 ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'}>
                    {apuesta.ganancia_neta >= 0 ? '+' : ''}{formatCurrency(apuesta.ganancia_neta)}
                  </span>
                </div>
              </div>
            )) : <div className="p-8 text-center text-gray-500">No hay apuestas recientes</div>}
          </div>
        </div>

        {/* Top Tipsters por ROI */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-400" /> Top Tipsters por ROI</h2>
            <a href="/admin/tipsters" className="text-teal-400 hover:text-teal-300 text-sm">Ver todos →</a>
          </div>
          <div className="divide-y divide-slate-700">
            {tipsters.length > 0 ? tipsters.map((tipster, index) => (
              <div key={tipster.id} className="p-4 hover:bg-slate-700/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-amber-500/20 text-amber-400' : index === 1 ? 'bg-gray-400/20 text-gray-300' :
                    index === 2 ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-600 text-gray-400'
                  }`}>{index + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium truncate">{tipster.alias}</span>
                      <span className="text-xs text-gray-500">{tipster.deporte}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                      <span>{tipster.total_apuestas} apuestas</span>
                      <span>WR: {(tipster.win_rate || 0).toFixed(1)}%</span>
                      {tipster.racha_actual !== undefined && <RachaBadge racha={tipster.racha_actual} />}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${(tipster.roi || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {(tipster.roi || 0) > 0 ? '+' : ''}{(tipster.roi || 0).toFixed(1)}%
                    </p>
                    <p className="text-[10px] text-gray-500">ROI</p>
                  </div>
                </div>
              </div>
            )) : <div className="p-8 text-center text-gray-500">No hay datos de tipsters</div>}
          </div>
        </div>
      </div>

      {/* ═══ CONFIG RESULTADOS PÚBLICOS ═══ */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-teal-400" /> Página Resultados Públicos
          </h2>
          <div className="flex items-center gap-2">
            {resConfigSaved && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Guardado
              </span>
            )}
            <button onClick={saveResConfig} disabled={resConfigSaving}
              className="px-4 py-1.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white rounded-lg flex items-center gap-2 text-sm font-medium">
              <Save className="w-4 h-4" /> {resConfigSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Page active toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-medium">Página Activa</p>
              <p className="text-gray-500 text-xs">Si se desactiva, /resultados no mostrará datos</p>
            </div>
            <button onClick={() => setResConfig(c => ({ ...c, resultados_page_activa: c.resultados_page_activa === 'true' ? 'false' : 'true' }))}
              className={`w-12 h-6 rounded-full transition-all relative ${resConfig.resultados_page_activa === 'true' ? 'bg-teal-500' : 'bg-slate-600'}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${resConfig.resultados_page_activa === 'true' ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>

          {/* Periodo default */}
          <div>
            <p className="text-white text-sm font-medium mb-2">Período por defecto</p>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'hoy', label: 'Hoy' },
                { key: 'ayer', label: 'Ayer' },
                { key: 'semana', label: '7 días' },
                { key: 'mes', label: '30 días' },
                { key: 'trimestre', label: '90 días' },
              ].map(p => (
                <button key={p.key}
                  onClick={() => setResConfig(c => ({ ...c, resultados_periodo_default: p.key }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    resConfig.resultados_periodo_default === p.key
                      ? 'bg-teal-500 text-white'
                      : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                  }`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { key: 'resultados_mostrar_pendientes', label: 'Mostrar En Juego', desc: 'Apuestas pendientes visibles' },
              { key: 'resultados_mostrar_top_tipsters', label: 'Mostrar Top Tipsters', desc: 'Ranking de tipsters del período' },
              { key: 'resultados_cta_visible', label: 'CTA Registro', desc: 'Botón "Comenzar Gratis" visible' },
            ].map(toggle => (
              <div key={toggle.key} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div>
                  <p className="text-white text-sm font-medium">{toggle.label}</p>
                  <p className="text-gray-500 text-[11px]">{toggle.desc}</p>
                </div>
                <button 
                  onClick={() => setResConfig(c => ({ ...c, [toggle.key]: (c as any)[toggle.key] === 'true' ? 'false' : 'true' }))}
                  className={`w-10 h-5 rounded-full transition-all relative ${(resConfig as any)[toggle.key] === 'true' ? 'bg-teal-500' : 'bg-slate-600'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${(resConfig as any)[toggle.key] === 'true' ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
            ))}
          </div>

          {/* Deportes */}
          <div>
            <p className="text-white text-sm font-medium mb-2">Deportes habilitados en filtros</p>
            <div className="flex flex-wrap gap-2">
              {['Fútbol', 'Tenis', 'Básquet', 'eSports', 'Hockey', 'Béisbol'].map(d => {
                const enabled = resConfig.resultados_deportes_habilitados.includes(d);
                return (
                  <button key={d}
                    onClick={() => {
                      setResConfig(c => {
                        const list = c.resultados_deportes_habilitados.split(',').filter(Boolean);
                        const updated = enabled ? list.filter(x => x !== d) : [...list, d];
                        return { ...c, resultados_deportes_habilitados: updated.join(',') };
                      });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      enabled ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'bg-slate-700 text-gray-500'
                    }`}>
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview link */}
          <div className="pt-2 border-t border-slate-700">
            <a href="/resultados" target="_blank" rel="noopener noreferrer"
              className="text-sm text-teal-400 hover:text-teal-300 flex items-center gap-1.5">
              <Eye className="w-4 h-4" /> Ver página de resultados →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
