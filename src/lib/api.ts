/**
 * API Client - Conexión segura al backend
 * Versión 2.4 - NeuroScore + Picks Recomendados + Stats Públicos
 * 
 * CAMBIOS v2.4:
 * - statsAPI.getPublic() → Stats landing page (sin auth, cacheado)
 * - miBancaAPI.getEstado() → Alias de getConfig (compatibilidad)
 * - apuestasAPI.getAnalisisHoy() → NeuroScore batch
 * - picksAPI.getRecomendados() → Backend real
 * - miBancaAPI.getEstadisticas() → Estadísticas completas por periodo
 * - misApuestasAPI.eliminar() → Endpoint DELETE conectado
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://franciscoanalistadeportivo.pythonanywhere.com';

let accessToken: string | null = null;
let refreshToken: string | null = null;

if (typeof window !== 'undefined') {
  accessToken = localStorage.getItem('token');
  refreshToken = localStorage.getItem('refresh_token');
}

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

const publicApi: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const token = accessToken || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    if (error.response?.status === 401 && refreshToken && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const response = await axios.post(`${API_URL}/api/auth/refresh`, {}, {
          headers: { Authorization: `Bearer ${refreshToken}` },
        });
        const newToken = response.data.access_token;
        setTokens(newToken, refreshToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const setTokens = (access: string, refresh: string) => {
  accessToken = access;
  refreshToken = refresh;
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', access);
    localStorage.setItem('refresh_token', refresh);
  }
};

export const loadTokens = () => {
  if (typeof window !== 'undefined') {
    const storedAccess = localStorage.getItem('token');
    const storedRefresh = localStorage.getItem('refresh_token');
    if (storedAccess) accessToken = storedAccess;
    if (storedRefresh) refreshToken = storedRefresh;
  }
};

export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
  }
};

export const isAuthenticated = () => {
  if (typeof window !== 'undefined') {
    return !!localStorage.getItem('token') || !!accessToken;
  }
  return !!accessToken;
};

// ============================================================================
// AUTH API
// ============================================================================
export const authAPI = {
  register: async (email: string, password: string, nombre: string, telefono?: string) => {
    const response = await api.post('/api/auth/register', { email, password, nombre, telefono });
    if (response.data.access_token) {
      setTokens(response.data.access_token, response.data.refresh_token);
    }
    return response.data;
  },
  login: async (email: string, password: string) => {
    const response = await api.post('/api/auth/login', { email, password });
    if (response.data.access_token) {
      setTokens(response.data.access_token, response.data.refresh_token);
    }
    return response.data;
  },
  logout: () => clearTokens(),
  getMe: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
  forgotPassword: async (email: string) => {
    const response = await api.post('/api/auth/forgot-password', { email });
    return response.data;
  },
  resetPassword: async (token: string, password: string) => {
    const response = await api.post('/api/auth/reset-password', { token, password });
    return response.data;
  },

  socialLogin: async (provider: 'google' | 'facebook' | 'apple' | 'twitter', token: string, extra?: { nombre?: string; email?: string }) => {
    const response = await publicApi.post(`/api/auth/social/${provider}`, {
      token,
      ...extra,
    });
    if (response.data.access_token) {
      setTokens(response.data.access_token, response.data.refresh_token);
    }
    return response.data;
  },

  joinCommunity: async (canal: 'telegram' | 'whatsapp') => {
    const response = await api.post('/api/auth/community/join', { canal });
    return response.data;
  },

  checkCommunity: async () => {
    const response = await api.get('/api/auth/community/status');
    return response.data;
  },
};

// ============================================================================
// STATS PÚBLICOS API (v2.4 — Landing page, sin auth)
// ============================================================================
export const statsAPI = {
  getPublic: async () => {
    try {
      const response = await publicApi.get('/api/public/stats');
      return response.data;
    } catch {
      return {
        total_picks: 991,
        win_rate: 61.8,
        roi_triple: 47.3,
        total_tipsters: 32,
        top_tipsters: [],
      };
    }
  },
};

// ============================================================================
// DASHBOARD API
// ============================================================================
export const dashboardAPI = {
  getData: async () => {
    const response = await publicApi.get('/api/public/dashboard');
    return response.data;
  },
  getDataIA: async () => {
    const response = await publicApi.get('/api/public/dashboard-ia');
    return response.data;
  },
};

// ============================================================================
// TIPSTERS API
// ============================================================================
export const tipstersAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/api/tipsters');
      return response.data;
    } catch (error) {
      try {
        const publicResponse = await publicApi.get('/api/public/tipsters');
        return publicResponse.data;
      } catch (publicError) {
        try {
          const dashboard = await dashboardAPI.getData();
          return { tipsters: dashboard.tipsters_list || [], total: dashboard.tipsters?.total || 0 };
        } catch {
          return { tipsters: [], total: 0 };
        }
      }
    }
  },
  getById: async (id: number) => {
    const safeId = Math.abs(Math.floor(Number(id)));
    if (!safeId || safeId <= 0 || safeId > 999999) {
      return null;
    }
    try {
      const response = await api.get(`/api/tipsters/${safeId}`);
      return response.data;
    } catch (error) {
      try {
        const publicResponse = await publicApi.get(`/api/public/tipsters/${safeId}`);
        return publicResponse.data;
      } catch {
        return null;
      }
    }
  },
  getProfiles: async () => {
    try {
      const response = await api.get('/api/tipster-profiles');
      return response.data;
    } catch {
      return { profiles: {} };
    }
  },
};

// ============================================================================
// BANCA API (Legacy)
// ============================================================================
export const bancaAPI = {
  get: async () => {
    const response = await api.get('/api/usuario/banca');
    return response.data;
  },
  update: async (banca: number) => {
    const response = await api.put('/api/usuario/banca', { banca });
    return response.data;
  },
};

// ============================================================================
// MI BANCA API (v7 — configuración completa)
// ============================================================================
export const miBancaAPI = {
  getConfig: async () => {
    const response = await api.get('/api/banca/config');
    return response.data;
  },

  // Alias de getConfig para compatibilidad con mi-banca/picks/page.tsx
  getEstado: async () => {
    const response = await api.get('/api/banca/config');
    return response.data;
  },

  setup: async (data: Partial<{
    banca_inicial: number;
    perfil_riesgo: string;
    deportes_interes: string[];
    casa_apuestas: string;
    meta_mensual: number;
    banca_actual: number;
  }>) => {
    const response = await api.post('/api/banca/setup', data);
    return response.data;
  },

  actualizar: async (data: Partial<{
    banca_actual: number;
    perfil_riesgo: string;
    deportes_interes: string[];
    casa_apuestas: string;
    meta_mensual: number;
  }>) => {
    const response = await api.put('/api/banca/actualizar', data);
    return response.data;
  },

  getEstadisticas: async (periodo: 'semana' | 'mes' | 'trimestre' | 'todo' = 'mes') => {
    const validPeriodos = ['semana', 'mes', 'trimestre', 'todo'];
    const safePeriodo = validPeriodos.includes(periodo) ? periodo : 'mes';
    const response = await api.get(`/api/banca/estadisticas?periodo=${safePeriodo}`);
    return response.data;
  },

  getHistorial: async (dias: number = 30) => {
    const safeDias = Math.min(Math.max(1, Math.floor(Number(dias))), 365);
    const response = await api.get(`/api/banca/historial?dias=${safeDias}`);
    return response.data;
  },
};

// ============================================================================
// MIS APUESTAS API (v7 + v2.3)
// ============================================================================
export const misApuestasAPI = {
  getAll: async (estado?: string, limite: number = 50) => {
    const validEstados = ['PENDIENTE', 'GANADA', 'PERDIDA', 'NULA'];
    const safeLimite = Math.min(Math.max(1, Math.floor(Number(limite))), 100);
    let url = `/api/mis-apuestas?limite=${safeLimite}`;
    if (estado && validEstados.includes(estado)) {
      url += `&estado=${estado}`;
    }
    const response = await api.get(url);
    return response.data;
  },

  crear: async (data: {
    apuesta_sistema_id?: number;
    tipster_id?: number;
    descripcion: string;
    cuota_usuario: number;
    stake: number;
    fecha_evento?: string;
    notas?: string;
  }) => {
    const response = await api.post('/api/mis-apuestas', data);
    return response.data;
  },

  marcarResultado: async (id: number, resultado: 'GANADA' | 'PERDIDA' | 'NULA') => {
    const safeId = Math.abs(Math.floor(Number(id)));
    const validResultados = ['GANADA', 'PERDIDA', 'NULA'];
    if (!safeId || !validResultados.includes(resultado)) return null;
    const response = await api.put(`/api/mis-apuestas/${safeId}/resultado`, { resultado });
    return response.data;
  },

  eliminar: async (id: number) => {
    const safeId = Math.abs(Math.floor(Number(id)));
    if (!safeId) return null;
    const response = await api.delete(`/api/mis-apuestas/${safeId}`);
    return response.data;
  },
};

// ============================================================================
// PICKS RECOMENDADOS API (v7 + v2.3)
// ============================================================================
export const picksAPI = {
  getRecomendados: async () => {
    try {
      const response = await api.get('/api/picks/recomendados');
      return response.data;
    } catch {
      return { picks: [], total: 0, requiere_setup: false };
    }
  },
  getLive: async () => {
    try {
      const response = await api.get('/api/picks/live');
      return response.data;
    } catch {
      return { live: [], urgentes: [], total_live: 0, total_urgentes: 0 };
    }
  },
};

// ============================================================================
// ALERTAS API (v2.4 — rachas)
// ============================================================================
export const alertasAPI = {
  getRachas: async () => {
    try {
      const response = await api.get('/api/alertas/rachas');
      return response.data;
    } catch {
      return { alertas: [], total: 0 };
    }
  },
};

// ============================================================================
// APUESTAS API (v2.3 — con NeuroScore)
// ============================================================================
export const apuestasAPI = {
  getHoy: async () => {
    try {
      const response = await api.get('/api/apuestas/hoy');
      return response.data;
    } catch (error) {
      const dashboard = await dashboardAPI.getData();
      return dashboard.apuestas || { total: 0, apuestas: [] };
    }
  },

  getAnalisisHoy: async () => {
    try {
      const response = await api.get('/api/analisis-ia/hoy');
      return response.data;
    } catch {
      return { analisis: {} };
    }
  },

  getAnalisisById: async (apuestaId: number) => {
    const safeId = Math.abs(Math.floor(Number(apuestaId)));
    if (!safeId) return null;
    try {
      const response = await api.get(`/api/analisis-ia/${safeId}`);
      return response.data;
    } catch {
      return null;
    }
  },
};

// ============================================================================
// NOTIFICACIONES API
// ============================================================================
export const notificacionesAPI = {
  getConfig: async () => {
    const response = await api.get('/api/notificaciones/config');
    return response.data;
  },

  updateConfig: async (data: {
    push_enabled?: boolean;
    email_enabled?: boolean;
    telegram_enabled?: boolean;
    alertas?: {
      pick_alto?: boolean;
      pick_medio?: boolean;
      racha_tipster?: boolean;
      resultado?: boolean;
      recordatorio?: boolean;
      drawdown?: boolean;
      meta?: boolean;
    };
    horario_inicio?: string;
    horario_fin?: string;
    silenciar_fines_semana?: boolean;
  }) => {
    const response = await api.put('/api/notificaciones/config', data);
    return response.data;
  },

  vincularTelegram: async () => {
    const response = await api.post('/api/notificaciones/vincular-telegram');
    return response.data;
  },

  desvincularTelegram: async () => {
    const response = await api.delete('/api/notificaciones/desvincular-telegram');
    return response.data;
  },
};

// ============================================================================
// LOGROS API
// ============================================================================
export const logrosAPI = {
  getMisLogros: async () => {
    const response = await api.get('/api/logros/mis-logros');
    return response.data;
  },
};

// ============================================================================
// CONSEJO IA API
// ============================================================================
export const consejoIAAPI = {
  get: async (tipsterId: number) => {
    const safeId = Math.abs(Math.floor(Number(tipsterId)));
    if (!safeId) return null;
    const response = await api.get(`/api/consejo-ia/${safeId}`);
    return response.data;
  },
};

// ============================================================================
// RECOMENDACIONES API
// ============================================================================
export const recomendacionesAPI = {
  get: async () => {
    try {
      const response = await api.get('/api/recomendaciones');
      return response.data;
    } catch (error) {
      return { seguir: [], evitar: [] };
    }
  },
};

// ============================================================================
// RESULTADOS PÚBLICOS API (v2.4 — SEO page)
// ============================================================================
export const resultadosPublicAPI = {
  get: async (periodo: string = 'semana', deporte: string = '') => {
    const PERIODOS_VALIDOS = ['hoy', 'ayer', 'semana', 'mes', 'trimestre'];
    const safePeriodo = PERIODOS_VALIDOS.includes(periodo) ? periodo : 'semana';
    const params = new URLSearchParams({ periodo: safePeriodo });
    if (deporte) params.append('deporte', deporte);
    try {
      const response = await api.get(`/api/public/resultados?${params}`);
      return response.data;
    } catch {
      return { apuestas: [], stats: null, top_tipsters: [] };
    }
  },
};

export default api;
