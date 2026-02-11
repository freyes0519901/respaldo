'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// ═══════════════════════════════════════════════════════════════
// NEUROTIPS LANDING PAGE v2 — CONVERSION OPTIMIZED
// Design: Dark navy #060A13 + Teal #00D1B2 + Gold #FFBB00
// Fonts: Space Grotesk + DM Sans + JetBrains Mono (Google Fonts)
// ═══════════════════════════════════════════════════════════════

// ── Animated counter with IntersectionObserver ──
function AnimatedCounter({ end, suffix = '', prefix = '', decimals = 0 }: {
  end: number; suffix?: string; prefix?: string; decimals?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const duration = 2000;
        const step = end / (duration / 16);
        let current = 0;
        const timer = setInterval(() => {
          current += step;
          if (current >= end) { setCount(end); clearInterval(timer); }
          else setCount(current);
        }, 16);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  return (
    <span ref={ref}>
      {prefix}{decimals > 0 ? count.toFixed(decimals) : Math.floor(count)}{suffix}
    </span>
  );
}

// ── Particles ──
function Particles() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {Array.from({ length: 20 }).map((_, i) => {
        const colors = ['#00D1B2', '#FFBB00', '#3B82F6'];
        return (
          <div key={i} style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${2 + Math.random() * 3}px`,
            height: `${2 + Math.random() * 3}px`,
            borderRadius: '50%',
            background: colors[i % 3],
            opacity: 0.4,
            animation: `float ${6 + Math.random() * 8}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 8}s`,
          }} />
        );
      })}
    </div>
  );
}

// ── Telegram SVG icon ──
const TelegramIcon = ({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161l-1.97 9.281c-.145.658-.537.818-1.084.508l-3-2.211-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121L8.31 13.53l-2.97-.924c-.645-.203-.658-.645.136-.954l11.566-4.458c.537-.194 1.006.131.83.967z"/>
  </svg>
);

// ── WhatsApp SVG icon ──
const WhatsAppIcon = ({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function HomePage() {
  const [stats, setStats] = useState({ total: 991, winRate: 61.8, roi: 47.3, tipsters: 32 });

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => {
      if (d && d.total_apuestas) {
        setStats({
          total: d.total_apuestas || 991,
          winRate: d.win_rate || 61.8,
          roi: d.roi_triple || 47.3,
          tipsters: d.total_tipsters || 32,
        });
      }
    }).catch(() => {});
  }, []);

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        
        :root {
          --bg: #060A13;
          --bg2: #0A1018;
          --card: #0D1520;
          --card-hover: #111D2D;
          --border: rgba(255,255,255,0.06);
          --teal: #00D1B2;
          --gold: #FFBB00;
          --blue: #3B82F6;
          --green: #22C55E;
          --red: #EF4444;
          --text: #F1F5F9;
          --muted: #64748B;
          --sub: #94A3B8;
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          50% { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(0,209,178,0.3); }
          50% { box-shadow: 0 0 40px rgba(0,209,178,0.5), 0 0 60px rgba(0,209,178,0.2); }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .cta-gold { animation: glowGold 3s ease-in-out infinite; }
        @keyframes glowGold {
          0%, 100% { box-shadow: 0 0 20px rgba(255,187,0,0.3); }
          50% { box-shadow: 0 0 40px rgba(255,187,0,0.5), 0 0 60px rgba(255,187,0,0.2); }
        }
        .cta-glow { animation: glow 3s ease-in-out infinite; }
        .gradient-title {
          background: linear-gradient(135deg, #00D1B2, #3B82F6, #FFBB00, #00D1B2);
          background-size: 300% 300%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradientShift 8s ease infinite;
        }
      `}</style>

      {/* ═══ NAVBAR ═══ */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(6,10,19,0.9)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        padding: '12px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <Image src="/logo-icon.png" alt="NeuroTips" width={28} height={28} />
          <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>
            Neuro<span style={{ color: 'var(--teal)' }}>Tips</span>
          </span>
        </Link>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/login" style={{
            fontSize: 13, fontWeight: 600, color: 'var(--text)',
            border: '1px solid var(--border)', padding: '8px 16px', borderRadius: 8,
            textDecoration: 'none', transition: 'all 0.2s',
          }}>
            Iniciar Sesión
          </Link>
          <Link href="/registro" style={{
            fontSize: 13, fontWeight: 600, color: 'var(--bg)',
            background: 'var(--teal)', padding: '8px 16px', borderRadius: 8,
            textDecoration: 'none',
          }}>
            Comenzar Gratis
          </Link>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section style={{
        position: 'relative', padding: '60px 24px 48px', textAlign: 'center',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(0,209,178,0.08) 0%, transparent 60%)',
        overflow: 'hidden',
      }}>
        <Particles />
        {/* Grid sutil */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(0,209,178,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,209,178,0.03) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }} />

        <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(0,209,178,0.1)', border: '1px solid rgba(0,209,178,0.2)',
            borderRadius: 20, padding: '6px 16px', marginBottom: 24,
            fontSize: 12, color: 'var(--teal)', fontWeight: 500,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--teal)' }} />
            🧠 Sistema de certificación con 4 niveles IA
          </div>

          <h1 style={{
            fontFamily: 'Space Grotesk', fontSize: 'clamp(32px, 6vw, 52px)',
            fontWeight: 700, lineHeight: 1.1, marginBottom: 16,
          }}>
            Hacemos lo que el{' '}
            <span className="gradient-title">ojo humano no ve</span>
          </h1>

          <p style={{ fontSize: 16, color: 'var(--sub)', lineHeight: 1.6, marginBottom: 12, maxWidth: 500, margin: '0 auto 12px' }}>
            Nuestro algoritmo analiza {stats.tipsters}+ tipsters reales de Telegram, detecta patrones de éxito y señales de riesgo antes de que coloques tu dinero.
          </p>

          {/* Quote */}
          <div style={{
            borderLeft: '3px solid var(--teal)', paddingLeft: 16, marginBottom: 28,
            display: 'inline-block', textAlign: 'left',
          }}>
            <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>
              &ldquo;No te damos picks; te damos una{' '}
              <span style={{ color: 'var(--teal)' }}>ventaja competitiva basada en datos</span>.&rdquo;
            </p>
          </div>

          {/* Stats */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 32,
            flexWrap: 'wrap',
          }}>
            {[
              { label: 'Picks Analizados', value: stats.total, suffix: '+', decimals: 0, color: 'var(--teal)' },
              { label: 'Win Rate Global', value: stats.winRate, suffix: '%', decimals: 1, color: 'var(--text)' },
              { label: 'ROI Picks ✓✓✓', value: stats.roi, suffix: '%', prefix: '+', decimals: 1, color: 'var(--green)' },
            ].map((s, i) => (
              <div key={i} style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '14px 24px', minWidth: 130,
              }}>
                <div style={{
                  fontFamily: 'JetBrains Mono', fontSize: 28, fontWeight: 700,
                  color: s.color,
                }}>
                  <AnimatedCounter end={s.value} suffix={s.suffix} prefix={s.prefix || ''} decimals={s.decimals} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* ═══ CTAs PRINCIPALES: TELEGRAM + WHATSAPP ═══ */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            {/* CTA 1: Telegram — PRINCIPAL */}
            <a
              href="https://t.me/IaNeuroTips"
              target="_blank"
              rel="noopener noreferrer"
              className="cta-gold"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                background: 'var(--gold)', color: '#060A13',
                padding: '16px 36px', borderRadius: 12,
                fontSize: 17, fontWeight: 700, fontFamily: 'Space Grotesk',
                textDecoration: 'none',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
            >
              <TelegramIcon size={22} color="#060A13" />
              Recibe gratis la apuesta del día
            </a>

            {/* CTA 2: WhatsApp — SECUNDARIO */}
            <a
              href="https://wa.me/56978516119?text=Hola%20NeuroTips%2C%20quiero%20info%20sobre%20el%20servicio"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(37,211,102,0.1)', color: '#25D366',
                border: '1px solid rgba(37,211,102,0.3)',
                padding: '12px 28px', borderRadius: 12,
                fontSize: 14, fontWeight: 600, fontFamily: 'DM Sans',
                textDecoration: 'none',
                transition: 'background 0.2s',
              }}
            >
              <WhatsAppIcon size={18} color="#25D366" />
              Escríbenos por WhatsApp
            </a>

            {/* Link secundario registro */}
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
              ¿Ya estás convencido?{' '}
              <Link href="/registro" style={{ color: 'var(--teal)', textDecoration: 'underline' }}>
                Comenzar 5 días gratis →
              </Link>
            </p>
          </div>
        </div>

        {/* Fade bottom */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(transparent, #060A13)', pointerEvents: 'none' }} />
      </section>

      {/* ═══ SOCIAL PROOF BAR ═══ */}
      <section style={{
        background: 'var(--card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
        padding: '14px 24px',
        display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap',
      }}>
        {[
          { icon: '👥', text: `${stats.tipsters}+ tipsters verificados` },
          { icon: '📊', text: `${stats.total}+ apuestas registradas` },
          { icon: '🔍', text: '100% transparente' },
          { icon: '🤖', text: 'Certificación IA 4 niveles' },
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--sub)', fontWeight: 500 }}>
            <span>{s.icon}</span> {s.text}
          </div>
        ))}
      </section>

      {/* ═══ ¿QUÉ HACEMOS DIFERENTE? ═══ */}
      <section style={{ padding: '64px 24px', maxWidth: 800, margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>
          ¿Qué hacemos diferente?
        </h2>
        <p style={{ fontSize: 14, color: 'var(--muted)', textAlign: 'center', marginBottom: 36, maxWidth: 500, margin: '0 auto 36px' }}>
          Seguimos a {stats.tipsters}+ tipsters de Telegram. Registramos TODAS sus apuestas y nuestra IA encuentra los patrones que ellos mismos no ven.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {[
            { icon: '🔍', title: '100% Transparente', desc: 'No borramos apuestas perdidas como hacen otros. Cada resultado queda registrado.', color: 'var(--teal)' },
            { icon: '🧠', title: 'IA Predictiva', desc: 'Detectamos en qué mercados y cuotas rinde mejor cada tipster automáticamente.', color: 'var(--blue)' },
            { icon: '💰', title: 'Stake Óptimo', desc: 'Te decimos cuánto apostar según el historial real y tu nivel de riesgo.', color: 'var(--gold)' },
          ].map((f, i) => (
            <div key={i} style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 12, padding: 24,
              transition: 'border-color 0.3s, transform 0.3s',
            }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 16, fontWeight: 700, marginBottom: 8, color: f.color }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--sub)', lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ ASÍ SE VE EN TU TELEGRAM ═══ */}
      <section style={{
        padding: '64px 24px', textAlign: 'center',
        background: 'radial-gradient(ellipse at 50% 50%, rgba(0,209,178,0.04) 0%, transparent 60%)',
      }}>
        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
          Así se ve en tu Telegram
        </h2>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 32 }}>
          Recibes análisis verificados directo en tu celular
        </p>

        {/* Telegram preview */}
        <div style={{
          maxWidth: 400, margin: '0 auto',
          background: '#E5DDD5', borderRadius: 16, padding: 12,
          textAlign: 'left',
        }}>
          {/* Bot header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #0891B2, #4ADE80)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14,
            }}>🧠</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#333' }}>NeuroTips Bot</div>
              <div style={{ fontSize: 10, color: '#888' }}>bot • hoy</div>
            </div>
          </div>

          {/* Pick card — COMBINADA */}
          <div style={{ borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: 8 }}>
            <div style={{ background: 'linear-gradient(135deg, #0891B2, #22D3EE, #4ADE80)', padding: '8px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'white' }}>NEUR</span>
                <span style={{ fontSize: 10 }}>🧠</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'white' }}>TIPS</span>
                <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.8)', marginLeft: 4, fontWeight: 600, letterSpacing: 1 }}>ANÁLISIS VIP</span>
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: 7, color: 'white', background: 'rgba(255,255,255,0.25)', padding: '2px 6px', borderRadius: 3, fontWeight: 700 }}>✓ Certificado IA</span>
              </div>
            </div>
            <div style={{ background: 'white', padding: '8px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0891B2' }}>Gol Seguro Pro</span>
                <span style={{ fontSize: 9, color: '#64748B' }}>⚽ Combinada</span>
              </div>
              {/* Legs */}
              <div style={{ borderRadius: 6, overflow: 'hidden', border: '1px solid #E2E8F0', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', padding: '5px 8px', background: '#F1F5F9', borderBottom: '1px solid #E2E8F0' }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', fontSize: 8, fontWeight: 800, color: '#0891B2', background: 'rgba(8,145,178,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 6, flexShrink: 0 }}>1</div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#1E293B' }}>Racing Santander</div>
                    <div style={{ fontSize: 9, color: '#059669' }}>Gana cualquier tiempo</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', padding: '5px 8px', background: '#F1F5F9' }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', fontSize: 8, fontWeight: 800, color: '#0891B2', background: 'rgba(8,145,178,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 6, flexShrink: 0 }}>2</div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#1E293B' }}>Villarreal vs Espanyol</div>
                    <div style={{ fontSize: 9, color: '#059669' }}>Más 1.5 goles</div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <div style={{ flex: 1, background: '#F1F5F9', borderRadius: 6, padding: '4px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 6, color: '#64748B', letterSpacing: 0.5 }}>CUOTA TOTAL</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0891B2' }}>1.68</div>
                </div>
                <div style={{ flex: 1, background: '#F1F5F9', borderRadius: 6, padding: '4px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 6, color: '#64748B', letterSpacing: 0.5 }}>NEUROSCORE</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1E293B' }}>72/85</div>
                </div>
                <div style={{ flex: 1, background: '#ECFDF5', borderRadius: 6, padding: '4px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 6, color: '#059669', letterSpacing: 0.5 }}>EV</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#22C55E' }}>+25.3%</div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#333', lineHeight: 1.4 }}>
            🎯 Gol Seguro Pro · Combinada @1.68 · ✅ Certificado IA
          </div>

          {/* Result card — GANADA */}
          <div style={{ borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginTop: 10 }}>
            <div style={{ background: 'linear-gradient(135deg, #059669, #22C55E, #4ADE80)', padding: '8px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'white' }}>NEUR</span>
                <span style={{ fontSize: 10 }}>🧠</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'white' }}>TIPS</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'white', marginLeft: 6 }}>✓ ¡ACIERTO!</span>
              </div>
            </div>
            <div style={{ background: 'white', padding: '8px 12px' }}>
              <div style={{ fontSize: 10, color: '#64748B', marginBottom: 4 }}>Combinada 2 selecciones — Racing + Villarreal</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#0891B2' }}>@1.68</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#22C55E' }}>+0.68u 💰</span>
                <span style={{ fontSize: 9, color: '#64748B' }}>NeuroScore 72</span>
              </div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#333', lineHeight: 1.4, marginTop: 4 }}>
            ✅ ¡Combinada acertada! · +0.68u
          </div>
        </div>

        {/* CTA */}
        <a
          href="https://t.me/IaNeuroTips"
          target="_blank"
          rel="noopener noreferrer"
          className="cta-gold"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--gold)', color: '#060A13',
            padding: '14px 28px', borderRadius: 10,
            fontSize: 15, fontWeight: 700, fontFamily: 'Space Grotesk',
            textDecoration: 'none', marginTop: 24,
          }}
        >
          <TelegramIcon size={20} color="#060A13" />
          Recibe gratis la apuesta del día
        </a>
      </section>


      {/* ═══ TOP TIPSTERS ═══ */}
      <section style={{ padding: '64px 24px', maxWidth: 800, margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>
          Top Tipsters Verificados
        </h2>
        <p style={{ fontSize: 14, color: 'var(--muted)', textAlign: 'center', marginBottom: 32 }}>
          Ranking basado en {stats.total}+ apuestas registradas. Actualizado diariamente.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {[
            { name: 'Gol Seguro', sport: '⚽', picks: 115, wr: '65.2%', roi: '+21.9%', racha: '+5', top: true },
            { name: 'Dato Mixto', sport: '🎯', picks: 120, wr: '58.3%', roi: '+10.3%', racha: '+4' },
            { name: 'Punto de Quiebre', sport: '🎾', picks: 88, wr: '62.5%', roi: '+10.1%', racha: '+6' },
          ].map((t, i) => (
            <div key={i} style={{
              background: 'var(--card)', borderRadius: 12, padding: 20, textAlign: 'center',
              border: t.top ? '1px solid var(--teal)' : '1px solid var(--border)',
              position: 'relative',
            }}>
              {t.top && (
                <div style={{
                  position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--teal)', color: '#060A13', fontSize: 10, fontWeight: 700,
                  padding: '3px 12px', borderRadius: 10, letterSpacing: 0.5,
                }}>
                  🏆 #1 VERIFICADO
                </div>
              )}
              <div style={{ fontSize: 32, marginBottom: 8, marginTop: t.top ? 8 : 0 }}>{t.sport}</div>
              <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{t.name}</h3>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12 }}>{t.picks} apuestas</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 24, fontWeight: 700, color: 'var(--green)', marginBottom: 4 }}>{t.roi}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>ROI · WR {t.wr} · Racha {t.racha}</div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 16 }}>
          Usamos aliases para proteger la identidad de los tipsters originales.
        </p>
      </section>

      {/* ═══ CÓMO FUNCIONA ═══ */}
      <section style={{
        padding: '64px 24px', maxWidth: 700, margin: '0 auto',
        background: 'radial-gradient(ellipse at 50% 50%, rgba(59,130,246,0.04) 0%, transparent 60%)',
      }}>
        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 700, textAlign: 'center', marginBottom: 36 }}>
          Cómo funciona
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {[
            { n: '01', title: 'Capturamos todo', desc: 'Registramos cada apuesta de cada tipster en tiempo real: cuota, resultado, mercado, hora.', color: 'var(--teal)' },
            { n: '02', title: 'La IA analiza', desc: 'Detectamos en qué mercados y cuotas rinde mejor cada tipster. Calculamos ROI, rachas y EV.', color: 'var(--blue)' },
            { n: '03', title: 'Tú decides con datos', desc: 'Ves solo picks con valor esperado positivo. Stake sugerido según tu banca y perfil de riesgo.', color: 'var(--gold)' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{
                fontFamily: 'JetBrains Mono', fontSize: 28, fontWeight: 700,
                color: s.color, lineHeight: 1, minWidth: 48,
              }}>{s.n}</div>
              <div>
                <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--sub)', lineHeight: 1.5 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ PLANES ═══ */}
      <section style={{ padding: '64px 24px', maxWidth: 800, margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>
          Elige tu plan
        </h2>
        <p style={{ fontSize: 14, color: 'var(--muted)', textAlign: 'center', marginBottom: 32 }}>
          Sin trucos. Acceso total. Cancela cuando quieras.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {[
            { name: 'Mensual', days: '30 días', price: '$15.000', usd: '$17 USDT', popular: false },
            { name: 'Trimestral', days: '90 días', price: '$39.000', usd: '$43 USDT', popular: true, save: 'Ahorra 13%' },
            { name: 'Anual', days: '365 días', price: '$120.000', usd: '$130 USDT', popular: false, save: 'Ahorra 33%' },
          ].map((plan, i) => (
            <div key={i} style={{
              background: 'var(--card)', borderRadius: 12, padding: 24, textAlign: 'center',
              border: plan.popular ? '1px solid var(--teal)' : '1px solid var(--border)',
              position: 'relative',
            }}>
              {plan.popular && (
                <div style={{
                  position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--gold)', color: '#060A13', fontSize: 10, fontWeight: 700,
                  padding: '3px 12px', borderRadius: 10,
                }}>⭐ MÁS POPULAR</div>
              )}
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: plan.popular ? 8 : 0 }}>{plan.days}</div>
              <div style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 700, color: 'var(--text)', margin: '8px 0 4px' }}>
                {plan.price}<span style={{ fontSize: 14, color: 'var(--muted)' }}> /mes</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>CLP · o {plan.usd}</div>
              {plan.save && <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600, marginBottom: 8 }}>{plan.save}</div>}
              <ul style={{ listStyle: 'none', fontSize: 12, color: 'var(--sub)', lineHeight: 2, margin: '12px 0', textAlign: 'left', paddingLeft: 8 }}>
                <li>✓ Todos los tipsters</li>
                <li>✓ Picks filtrados por IA</li>
                <li>✓ Alertas por Telegram</li>
                {plan.popular && <li>✓ Soporte prioritario</li>}
              </ul>
              <Link href="/registro" style={{
                display: 'block', padding: '10px 20px', borderRadius: 8,
                background: plan.popular ? 'var(--teal)' : 'transparent',
                color: plan.popular ? '#060A13' : 'var(--teal)',
                border: plan.popular ? 'none' : '1px solid var(--teal)',
                fontSize: 13, fontWeight: 600, textDecoration: 'none',
              }}>Comenzar Gratis</Link>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 12 }}>
          5 días gratis · Sin tarjeta de crédito · Transferencia bancaria o crypto
        </p>
      </section>

      {/* ═══ SALA VIP ═══ */}
      <section style={{
        margin: '0 24px 48px', padding: 32, borderRadius: 16,
        background: 'linear-gradient(135deg, rgba(255,187,0,0.08), rgba(255,187,0,0.02))',
        border: '1px solid rgba(255,187,0,0.15)', textAlign: 'center',
      }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🔥</div>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold)', letterSpacing: 2, marginBottom: 8 }}>SALA VIP</div>
        <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
          Picks exclusivos verificados por IA
        </h3>
        <p style={{ fontSize: 13, color: 'var(--sub)', marginBottom: 16 }}>
          Accede a pronósticos premium de tipsters internacionales, filtrados por nuestro algoritmo.
          Add-on al plan base · Máximo 5 picks VIP por mes para mantener la calidad.
        </p>
        <Link href="/registro" style={{
          display: 'inline-flex', padding: '10px 24px', borderRadius: 8,
          background: 'var(--gold)', color: '#060A13', fontSize: 14, fontWeight: 700,
          textDecoration: 'none',
        }}>Desbloquear Sala VIP</Link>
      </section>

      {/* ═══ CTA FINAL + COMUNIDAD ═══ */}
      <section style={{
        padding: '64px 24px', textAlign: 'center',
        background: 'linear-gradient(180deg, transparent, rgba(0,209,178,0.06))',
      }}>
        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
          ¿Listo para tu ventaja basada en datos?
        </h2>
        <p style={{ fontSize: 14, color: 'var(--sub)', marginBottom: 28 }}>
          {stats.total}+ apuestas verificadas. {stats.tipsters}+ tipsters analizados con IA. Deja de apostar a ciegas.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <a
            href="https://t.me/IaNeuroTips"
            target="_blank"
            rel="noopener noreferrer"
            className="cta-gold"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: 'var(--gold)', color: '#060A13',
              padding: '16px 32px', borderRadius: 12,
              fontSize: 16, fontWeight: 700, fontFamily: 'Space Grotesk',
              textDecoration: 'none',
            }}
          >
            <TelegramIcon size={22} color="#060A13" />
            Recibe gratis la apuesta del día
          </a>

          <a
            href="https://wa.me/56978516119?text=Hola%20NeuroTips%2C%20quiero%20info"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(37,211,102,0.1)', color: '#25D366',
              border: '1px solid rgba(37,211,102,0.3)',
              padding: '16px 32px', borderRadius: 12,
              fontSize: 16, fontWeight: 700, fontFamily: 'Space Grotesk',
              textDecoration: 'none',
            }}
          >
            <WhatsAppIcon size={22} color="#25D366" />
            WhatsApp
          </a>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
          <Link href="/registro" style={{ fontSize: 13, color: 'var(--teal)', textDecoration: 'underline' }}>
            Comenzar 5 días gratis →
          </Link>
          <Link href="/login" style={{ fontSize: 13, color: 'var(--sub)', textDecoration: 'underline' }}>
            Ya tengo cuenta
          </Link>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{
        padding: '24px', textAlign: 'center',
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Image src="/logo-neurotips.png" alt="NeuroTips" width={120} height={30} style={{ opacity: 0.7 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 12 }}>
          <a href="https://t.me/IaNeuroTips" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: 12 }}>
            Telegram
          </a>
          <a href="https://wa.me/56978516119" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: 12 }}>
            WhatsApp
          </a>
        </div>
        <p style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}>
          © 2026 NeuroTips • Todos los derechos reservados<br />
          Juego responsable. Solo +18. NeuroTips proporciona análisis estadísticos, no asesoría financiera.
        </p>
      </footer>
    </>
  );
}
