/**
 * Store Global - Gestión de estado
 * Usa Zustand para estado simple y eficiente
 * v2.0 — Social auth + comunidad
 */

import { create } from 'zustand';

interface User {
  id: number;
  email: string;
  nombre: string;
  plan: 'FREE_TRIAL' | 'PREMIUM' | 'EXPIRED';
  suscripcion_hasta: string | null;
  auth_provider?: string | null;
  avatar_url?: string | null;
  comunidad_canal?: string | null;
  comunidad_verificado?: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));

interface Tipster {
  id: number;
  alias: string;
  deporte: string;
  total_apuestas: number;
  ganadas: number;
  perdidas: number;
  porcentaje_acierto: number;
  ganancia_total: number;
}

interface TipstersState {
  tipsters: Tipster[];
  isLoading: boolean;
  setTipsters: (tipsters: Tipster[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useTipstersStore = create<TipstersState>((set) => ({
  tipsters: [],
  isLoading: true,
  setTipsters: (tipsters) => set({ tipsters, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}));
