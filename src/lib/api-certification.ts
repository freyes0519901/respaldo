/**
 * API Client — Certificación NeuroTips v2.1
 * Todas las métricas son FLAT STAKE (1 unidad por pick)
 * No hay datos personales de stakes ni ganancias en CLP
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// ── Types ──

export interface PlatformStats {
  global: {
    total_picks: number;
    ganadas: number;
    perdidas: number;
    pendientes: number;
    win_rate: number;
    roi: number;           // ROI flat de toda la plataforma
    roi_recomendados: number; // ROI flat solo de TRIPLE_CHECK
    picks_recomendados: number;
    cuota_promedio: number;
  };
  mes_actual: {
    total: number;
    ganadas: number;
    perdidas: number;
    win_rate: number;
    roi: number;           // ROI flat últimos 30 días
  };
  por_filtro_ia: Record<string, {
    total: number;
    ganadas: number;
    perdidas: number;
    win_rate: number;
    roi: number;           // ROI flat
  }>;
  tipsters_activos: number;
  perfiles_ia: number;
}

export interface IATransparencyData {
  resumen: {
    total_analizado: string;
    aprobada_wr: string;
    rechazada_wr: string;
    diferencia: string;
    mensaje: string;
  };
  escenarios: Record<string, {
    count: number;
    label: string;
    emoji: string;
    description: string;
  }>;
  historial_mensual: Record<string, Record<string, {
    ganadas: number;
    total: number;
    win_rate: number;
  }>>;
  por_filtro: Record<string, {
    total: number;
    ganadas: number;
    perdidas: number;
    win_rate: number;
    roi: number;
  }>;
  por_cert_level: Record<string, {
    total: string;
    ganadas: string;
    perdidas: string;
    win_rate: string;
  }>;
  total_con_filtro: number;
}

export type CertLevel = 'TRIPLE_CHECK' | 'DOUBLE_CHECK' | 'SINGLE_CHECK' | 'REJECTED';

export interface CertifiedPick {
  id: number;
  tipster_alias: string;
  deporte: string;
  apuesta: string;
  cuota: number;
  tipo_mercado: string;
  cert_level: CertLevel;
  cert_emoji: string;
  cert_label: string;
  cert_color: string;
  neuroscore: number;
  ev: number;
  stake_mult: number;
  zona: string;
}

export interface TipsterCertData {
  tipster_id: number;
  alias: string;
  deporte: string;
  stats: {
    total: number;
    ganadas: number;
    perdidas: number;
    win_rate: number;
    roi: number;         // ROI flat
    cuota_promedio: number;
  };
  filtros: Record<string, {
    total: number;
    ganadas: number;
    win_rate: number;
    roi: number;         // ROI flat
  }>;
  mercados: Array<{
    mercado: string;
    total: number;
    ganadas: number;
    win_rate: number;
    roi: number;         // ROI flat
  }>;
  cert_distribution: Record<CertLevel, number>;
}

// ── Cert Level Helpers ──

export const CERT_CONFIG: Record<CertLevel, { emoji: string; label: string; color: string; bg: string }> = {
  TRIPLE_CHECK: { emoji: '✓✓✓', label: 'Certificado Premium', color: '#2ED573', bg: 'rgba(46,213,115,0.1)' },
  DOUBLE_CHECK: { emoji: '✓✓', label: 'Certificado', color: '#00D1B2', bg: 'rgba(0,209,178,0.1)' },
  SINGLE_CHECK: { emoji: '✓', label: 'Verificado', color: '#FFDD57', bg: 'rgba(255,221,87,0.1)' },
  REJECTED: { emoji: '✗', label: 'No recomendado', color: '#FF4757', bg: 'rgba(255,71,87,0.1)' },
};

// ── API Functions ──

async function apiFetch<T>(endpoint: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${endpoint}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    return null;
  }
}

export const certAPI = {
  /** Estadísticas reales de la plataforma (flat ROI) */
  getStats: () => apiFetch<PlatformStats>('/api/public/stats-reales'),
  
  /** Datos de transparencia IA (escenarios, historial) */
  getTransparency: () => apiFetch<IATransparencyData>('/api/public/ia-transparency'),
  
  /** Picks certificados del día con combo sugerida */
  getCertifiedPicks: () => apiFetch<{ picks: CertifiedPick[]; combo: any }>('/api/public/picks-certificados'),
  
  /** Reporte de certificación de un tipster específico */
  getTipsterCert: (id: number) => apiFetch<TipsterCertData>(`/api/public/tipster/${id}/certificacion`),
};
