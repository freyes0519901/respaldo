'use client';

import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw, Filter, Eye } from 'lucide-react';
import { useAuth, adminFetch } from '../layout';

interface SecurityLog {
  id: number;
  tipo: string;
  ip_address: string;
  user_agent: string;
  detalles: string;
  created_at: string;
}

const EVENT_TYPES = [
  { value: '', label: 'Todos' },
  { value: 'LOGIN_EXITOSO', label: '✅ Login OK' },
  { value: 'LOGIN_FALLIDO', label: '❌ Login Fallido' },
  { value: 'BRUTE_FORCE', label: '🚨 Brute Force' },
  { value: 'ACCESO_NO_AUTORIZADO', label: '⚠️ Acceso No Autorizado' },
];

export default function SeguridadPage() {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [filterType, setFilterType] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { accessToken } = useAuth();

  useEffect(() => {
    loadLogs();
  }, [accessToken, filterType]);

  const loadLogs = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const params = filterType ? `?tipo=${filterType}` : '';
      const response = await adminFetch(`/api/admin/security-logs${params}`, {}, accessToken);
      const data = await response.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error:', error);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getEventIcon = (tipo: string) => {
    if (tipo?.includes('EXITOSO') || tipo?.includes('SUCCESS')) return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    if (tipo?.includes('FALLIDO') || tipo?.includes('FAILED')) return <XCircle className="w-4 h-4 text-red-400" />;
    if (tipo?.includes('BRUTE') || tipo?.includes('INJECTION')) return <AlertTriangle className="w-4 h-4 text-red-500" />;
    return <Eye className="w-4 h-4 text-gray-400" />;
  };

  const getEventColor = (tipo: string) => {
    if (tipo?.includes('EXITOSO') || tipo?.includes('SUCCESS')) return 'border-l-emerald-500 bg-emerald-500/5';
    if (tipo?.includes('FALLIDO') || tipo?.includes('FAILED')) return 'border-l-red-500 bg-red-500/5';
    if (tipo?.includes('BRUTE') || tipo?.includes('INJECTION')) return 'border-l-red-600 bg-red-500/10';
    return 'border-l-gray-500 bg-slate-700/30';
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleString('es-CL');
    } catch {
      return d;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Logs de Seguridad</h1>
          <p className="text-gray-400">Monitorea accesos y detecta amenazas</p>
        </div>
        <button onClick={loadLogs} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Actualizar
        </button>
      </div>

      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-400" />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
        >
          {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div className="space-y-2">
        {logs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No hay logs de seguridad</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className={`p-4 rounded-lg border-l-4 ${getEventColor(log.tipo)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getEventIcon(log.tipo)}
                  <span className="text-white font-medium">{log.tipo || 'EVENTO'}</span>
                </div>
                <span className="text-gray-500 text-sm">{formatDate(log.created_at)}</span>
              </div>
              <div className="mt-2 text-sm text-gray-400">
                <span className="bg-slate-700 px-2 py-0.5 rounded font-mono">{log.ip_address || 'N/A'}</span>
                {log.detalles && <span className="ml-3">{log.detalles}</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
