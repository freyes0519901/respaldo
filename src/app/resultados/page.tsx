'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Trophy, TrendingUp, TrendingDown, Clock, Calendar, Filter,
  ChevronRight, CheckCircle, XCircle, Minus, BarChart3, Users,
  ArrowRight, Zap, Shield, Eye, Star, Flame, Target
} from 'lucide-react';

interface Resultado {
  id: number;
  tipster: string;
  deporte: string;
  apuesta: string;
  cuota: number;
  resultado: string;
  fecha: string;
  tipo_mercado: string;
  hora_partido: string;
  ganancia_neta: number;
}

interface Stats {
  total: number;
  ganadas: number;
  perdidas: number;
  pendientes: number;
  win_rate: number;
  cuota_promedio: number;
}

interface TopTipster {
  alias: string;
  deporte: string;
  total: number;
  ganadas: number;
  perdidas: number;
  win_rate: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

const deporteEmoji: Record<string, string> = {
  'Fútbol': '⚽', 'Tenis': '🎾', 'Básquet': '🏀', 'eSports': '🎮',
  'Hockey': '🏒', 'Béisbol': '⚾',
};

interface PageConfig {
  periodo_default: string;
  mostrar_pendientes: boolean;
  mostrar_top_tipsters: boolean;
  deportes_habilitados: string[];
  cta_visible: boolean;
  page_activa: boolean;
}

export default function ResultadosPublicPage() {
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [topTipsters, setTopTipsters] = useState<TopTipster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [periodo, setPeriodo] = useState('semana');
  const [deporte, setDeporte] = useState('');
  const [config, setConfig] = useState<PageConfig>({
    periodo_default: 'semana', mostrar_pendientes: true,
    mostrar_top_tipsters: true, deportes_habilitados: ['Fútbol', 'Tenis', 'Básquet'],
    cta_visible: true, page_activa: true,
  });

  // Fetch config on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const resp = await fetch(`${API_URL}/api/public/resultados/config`);
        if (resp.ok) {
          const cfg = await resp.json();
          setConfig(cfg);
          setPeriodo(cfg.periodo_default || 'semana');
        }
      } catch {}
    };
    fetchConfig();
  }, []);

  const fetchResultados = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ periodo });
      if (deporte) params.append('deporte', deporte);

      const resp = await fetch(`${API_URL}/api/public/resultados?${params}`);
      if (resp.ok) {
        const data = await resp.json();
        setResultados(data.apuestas || []);
        setStats(data.stats || null);
        setTopTipsters(data.top_tipsters || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResultados();
  }, [periodo, deporte]);

  const resueltas = resultados.filter(r => r.resultado === 'GANADA' || r.resultado === 'PERDIDA');
  const pendientes = resultados.filter(r => !r.resultado || r.resultado === 'PENDIENTE' || r.resultado === '');

  const ResultIcon = ({ resultado }: { resultado: string }) => {
    if (resultado === 'GANADA') return <CheckCircle className="h-4 w-4 text-[#00D1B2]" />;
    if (resultado === 'PERDIDA') return <XCircle className="h-4 w-4 text-[#EF4444]" />;
    if (resultado === 'NULA') return <Minus className="h-4 w-4 text-[#94A3B8]" />;
    return <Clock className="h-4 w-4 text-[#FFBB00]" />;
  };

  const resultColor = (r: string) => {
    if (r === 'GANADA') return '#00D1B2';
    if (r === 'PERDIDA') return '#EF4444';
    if (r === 'NULA') return '#94A3B8';
    return '#FFBB00';
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0A0F1C 0%, #0F172A 100%)' }}>
      {/* ================================================================ */}
      {/* NAV BAR                                                          */}
      {/* ================================================================ */}
      <nav style={{
        background: 'rgba(15, 23, 42, 0.95)',
        borderBottom: '1px solid rgba(0, 209, 178, 0.1)',
        backdropFilter: 'blur(10px)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <img src="/logo-icon.png" alt="NeuroTips" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
            <span style={{ fontSize: '18px', fontWeight: 700, color: 'white' }}>Neuro<span style={{ color: '#00D1B2' }}>Tips</span></span>
          </Link>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Link href="/login" style={{
              padding: '8px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: 600,
              background: 'linear-gradient(135deg, #00D1B2, #00B89C)', color: 'white',
              textDecoration: 'none', boxShadow: '0 4px 12px rgba(0, 209, 178, 0.3)',
            }}>
              Acceder
            </Link>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' }}>
        {/* ================================================================ */}
        {/* HEADER                                                           */}
        {/* ================================================================ */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              padding: '10px', borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(0, 209, 178, 0.15), rgba(0, 209, 178, 0.05))',
              border: '1px solid rgba(0, 209, 178, 0.2)',
            }}>
              <Trophy style={{ width: '24px', height: '24px', color: '#00D1B2' }} />
            </div>
            Resultados Verificados
          </h1>
          <p style={{ color: '#94A3B8', marginTop: '6px', fontSize: '15px' }}>
            Historial público de apuestas analizadas por IA — transparencia total
          </p>
        </div>

        {/* ================================================================ */}
        {/* STATS CARDS                                                      */}
        {/* ================================================================ */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            {[
              { label: 'Total Picks', value: stats.total, color: '#94A3B8', icon: <BarChart3 style={{ width: '18px', height: '18px', color: '#94A3B8' }} /> },
              { label: 'Ganadas', value: stats.ganadas, color: '#00D1B2', icon: <CheckCircle style={{ width: '18px', height: '18px', color: '#00D1B2' }} /> },
              { label: 'Perdidas', value: stats.perdidas, color: '#EF4444', icon: <XCircle style={{ width: '18px', height: '18px', color: '#EF4444' }} /> },
              { label: 'Win Rate', value: `${stats.win_rate}%`, color: stats.win_rate >= 55 ? '#00D1B2' : stats.win_rate >= 45 ? '#FFBB00' : '#EF4444', icon: <Target style={{ width: '18px', height: '18px', color: '#FFDD57' }} /> },
              { label: 'Cuota Prom.', value: `@${stats.cuota_promedio}`, color: '#FFDD57', icon: <Zap style={{ width: '18px', height: '18px', color: '#FFDD57' }} /> },
              { label: 'En Juego', value: stats.pendientes, color: '#FFBB00', icon: <Clock style={{ width: '18px', height: '18px', color: '#FFBB00' }} /> },
            ].map((card, i) => (
              <div key={i} style={{
                padding: '16px', borderRadius: '14px',
                background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  {card.icon}
                  <span style={{ fontSize: '11px', color: '#64748B' }}>{card.label}</span>
                </div>
                <p style={{ fontSize: '24px', fontWeight: 700, color: card.color, fontFamily: 'monospace' }}>
                  {card.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ================================================================ */}
        {/* FILTROS                                                          */}
        {/* ================================================================ */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px', alignItems: 'center' }}>
          <Filter style={{ width: '16px', height: '16px', color: '#64748B' }} />
          {[
            { key: 'hoy', label: 'Hoy' },
            { key: 'ayer', label: 'Ayer' },
            { key: 'semana', label: '7 días' },
            { key: 'mes', label: '30 días' },
            { key: 'trimestre', label: '90 días' },
          ].map(p => (
            <button key={p.key} onClick={() => setPeriodo(p.key)} style={{
              padding: '7px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', border: 'none', transition: 'all 0.2s',
              background: periodo === p.key ? 'linear-gradient(135deg, #00D1B2, #00B89C)' : 'rgba(30, 41, 59, 0.8)',
              color: periodo === p.key ? 'white' : '#94A3B8',
              boxShadow: periodo === p.key ? '0 4px 12px rgba(0, 209, 178, 0.25)' : 'none',
            }}>
              {p.label}
            </button>
          ))}

          <span style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

          {['', ...config.deportes_habilitados].map(d => (
            <button key={d} onClick={() => setDeporte(d)} style={{
              padding: '7px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 500,
              cursor: 'pointer', border: 'none', transition: 'all 0.2s',
              background: deporte === d ? 'rgba(255, 221, 87, 0.15)' : 'rgba(30, 41, 59, 0.5)',
              color: deporte === d ? '#FFDD57' : '#64748B',
              borderWidth: '1px', borderStyle: 'solid',
              borderColor: deporte === d ? 'rgba(255, 221, 87, 0.3)' : 'transparent',
            }}>
              {d ? `${deporteEmoji[d] || ''} ${d}` : 'Todos'}
            </button>
          ))}
        </div>

        {/* ================================================================ */}
        {/* TOP TIPSTERS                                                     */}
        {/* ================================================================ */}
        {config.mostrar_top_tipsters && topTipsters.length > 0 && (
          <div style={{
            padding: '20px', borderRadius: '16px', marginBottom: '20px',
            background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8))',
            border: '1px solid rgba(255, 221, 87, 0.12)',
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'white', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Star style={{ width: '16px', height: '16px', color: '#FFDD57' }} />
              Top Tipsters del Período
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
              {topTipsters.map((t, i) => (
                <div key={i} style={{
                  padding: '12px 14px', borderRadius: '10px',
                  background: i === 0 ? 'rgba(0, 209, 178, 0.08)' : 'rgba(15, 23, 42, 0.5)',
                  border: `1px solid ${i === 0 ? 'rgba(0, 209, 178, 0.2)' : 'rgba(255,255,255,0.04)'}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {i === 0 && <span>🏆</span>}
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>{t.alias}</span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>{t.ganadas}W - {t.perdidas}L</span>
                  </div>
                  <span style={{
                    fontSize: '16px', fontWeight: 700, fontFamily: 'monospace',
                    color: t.win_rate >= 60 ? '#00D1B2' : t.win_rate >= 50 ? '#FFBB00' : '#EF4444',
                  }}>
                    {t.win_rate}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* LOADING                                                          */}
        {/* ================================================================ */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{
              width: '40px', height: '40px', margin: '0 auto 12px',
              border: '3px solid rgba(0, 209, 178, 0.2)', borderTopColor: '#00D1B2',
              borderRadius: '50%', animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{ color: '#94A3B8', fontSize: '14px' }}>Cargando resultados...</p>
          </div>
        )}

        {/* ================================================================ */}
        {/* PENDIENTES (EN JUEGO)                                            */}
        {/* ================================================================ */}
        {!isLoading && config.mostrar_pendientes && pendientes.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '14px', fontWeight: 700, color: '#FFBB00', marginBottom: '12px',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <span style={{
                width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444',
                display: 'inline-block', animation: 'pulse 1.5s infinite',
              }} />
              En Juego ({pendientes.length})
            </h3>
            <div style={{ display: 'grid', gap: '8px' }}>
              {pendientes.slice(0, 10).map(r => (
                <div key={r.id} style={{
                  padding: '14px 16px', borderRadius: '12px',
                  background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))',
                  border: '1px solid rgba(255, 187, 0, 0.2)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#00D1B2' }}>{r.tipster}</span>
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255, 187, 0, 0.1)', color: '#FFBB00', fontWeight: 600 }}>
                        ⏳ PENDIENTE
                      </span>
                      {r.tipo_mercado && (
                        <span style={{ fontSize: '10px', color: '#64748B' }}>{r.tipo_mercado}</span>
                      )}
                    </div>
                    <p style={{ fontSize: '13px', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.apuesta}
                    </p>
                  </div>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#FFBB00', fontFamily: 'monospace', flexShrink: 0 }}>
                    @{r.cuota}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* RESULTADOS RESUELTOS                                             */}
        {/* ================================================================ */}
        {!isLoading && (
          <div>
            <h3 style={{
              fontSize: '14px', fontWeight: 700, color: '#94A3B8', marginBottom: '12px',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <Trophy style={{ width: '16px', height: '16px', color: '#94A3B8' }} />
              Resultados ({resueltas.length})
            </h3>
            {resueltas.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '50px 0', borderRadius: '16px',
                background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <p style={{ color: '#64748B' }}>No hay resultados en este período</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '6px' }}>
                {resueltas.map(r => (
                  <div key={r.id} style={{
                    padding: '12px 16px', borderRadius: '10px',
                    background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
                    borderLeft: `3px solid ${resultColor(r.resultado)}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                      <ResultIcon resultado={r.resultado} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#00D1B2' }}>{r.tipster}</span>
                          <span style={{ fontSize: '10px', color: '#64748B' }}>
                            {deporteEmoji[r.deporte] || ''} {r.deporte}
                          </span>
                          {r.tipo_mercado && (
                            <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '3px', background: 'rgba(255,255,255,0.05)', color: '#64748B' }}>
                              {r.tipo_mercado}
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '13px', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.apuesta}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'monospace', color: 'white' }}>@{r.cuota}</p>
                      <span style={{
                        fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px',
                        background: r.resultado === 'GANADA' ? 'rgba(0, 209, 178, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: resultColor(r.resultado),
                      }}>
                        {r.resultado === 'GANADA' ? '✅ WIN' : '❌ LOSS'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* CTA                                                              */}
        {/* ================================================================ */}
        {config.cta_visible && (
        <div style={{
          marginTop: '40px', padding: '30px', borderRadius: '20px', textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(0, 209, 178, 0.08), rgba(0, 209, 178, 0.02))',
          border: '1px solid rgba(0, 209, 178, 0.15)',
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>
            ¿Quieres acceder a las recomendaciones IA?
          </h3>
          <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '20px', maxWidth: '500px', margin: '0 auto 20px' }}>
            Obtén NeuroScore, stakes personalizados y alertas en tiempo real
          </p>
          <Link href="/registro" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '12px 30px', borderRadius: '12px', fontSize: '15px', fontWeight: 700,
            background: 'linear-gradient(135deg, #00D1B2, #00B89C)', color: 'white',
            textDecoration: 'none', boxShadow: '0 6px 20px rgba(0, 209, 178, 0.3)',
          }}>
            Comenzar Gratis <ArrowRight style={{ width: '18px', height: '18px' }} />
          </Link>
        </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '30px 0 10px', color: '#475569', fontSize: '12px' }}>
          <p>NeuroTips © 2026 — Análisis con IA · Resultados verificados · Transparencia total</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}
