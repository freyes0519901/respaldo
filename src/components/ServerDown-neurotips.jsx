import { useState, useEffect, useRef } from "react";

// ─── Neural Network Background Animation ───
function NeuralNetwork() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let nodes = [];
    const W = 480, H = 600;
    canvas.width = W;
    canvas.height = H;

    // Create neural nodes
    for (let i = 0; i < 25; i++) {
      nodes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 2 + 1,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      
      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const alpha = (1 - dist / 120) * 0.08;
            ctx.strokeStyle = `rgba(0, 209, 255, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      nodes.forEach(n => {
        n.pulse += 0.02;
        const glow = 0.3 + Math.sin(n.pulse) * 0.2;
        ctx.fillStyle = `rgba(0, 209, 255, ${glow})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();

        // Move
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      });

      animId = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0, left: '50%', transform: 'translateX(-50%)',
        width: 480, height: 600,
        opacity: 0.5,
        pointerEvents: 'none',
      }}
    />
  );
}

// ─── Brain Logo SVG ───
function BrainIcon({ size = 48, glowing = false }) {
  return (
    <div style={{
      width: size, height: size,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.65,
      filter: glowing ? 'drop-shadow(0 0 12px rgba(0, 209, 255, 0.5))' : 'none',
      animation: glowing ? 'brainPulse 3s ease-in-out infinite' : 'none',
    }}>
      🧠
    </div>
  );
}

// ─── FULL MODE: Pantalla completa ───
function ServerDownFull({ onRetry, checking = false }) {
  const [dots, setDots] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [countdown, setCountdown] = useState(30);
  const [brainFrame, setBrainFrame] = useState(0);

  useEffect(() => {
    const i = setInterval(() => setDots(p => p.length >= 3 ? '' : p + '.'), 500);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const i = setInterval(() => setBrainFrame(p => p + 1), 100);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if (checking) { setCountdown(30); return; }
    const i = setInterval(() => {
      setCountdown(p => {
        if (p <= 1) { onRetry?.(); setRetryCount(r => r + 1); return 30; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(i);
  }, [checking, onRetry]);

  // EEG wave animation data
  const eegPoints = Array.from({ length: 60 }, (_, i) => {
    const t = (i + brainFrame * 0.5) * 0.15;
    const y = Math.sin(t) * 8 + Math.sin(t * 2.5) * 4 + Math.sin(t * 0.5) * 6;
    return `${i * (100 / 59)},${50 + y}`;
  }).join(' ');

  return (
    <div style={{ position: 'relative', minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
      <NeuralNetwork />
      
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 400, width: '100%', textAlign: 'center' }}>
        
        {/* ─── Brain + EEG animation ─── */}
        <div style={{ position: 'relative', marginBottom: 24 }}>
          {/* Outer glow ring */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 120, height: 120, borderRadius: 28,
            background: 'radial-gradient(circle, rgba(0, 209, 255, 0.08) 0%, transparent 70%)',
            animation: 'glowPulse 3s ease-in-out infinite',
          }} />
          
          {/* Brain container */}
          <div style={{
            position: 'relative', width: 96, height: 96, margin: '0 auto',
            borderRadius: 24,
            background: 'linear-gradient(135deg, rgba(0, 209, 255, 0.08), rgba(255, 107, 157, 0.06))',
            border: '1px solid rgba(0, 209, 255, 0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 60px rgba(0, 209, 255, 0.08), inset 0 0 30px rgba(0, 209, 255, 0.03)',
          }}>
            <BrainIcon size={56} glowing />
            
            {/* Scanning line */}
            <div style={{
              position: 'absolute', left: 8, right: 8,
              height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(0, 209, 255, 0.4), transparent)',
              animation: 'scanLine 2.5s ease-in-out infinite',
            }} />
          </div>
          
          {/* EEG wave under brain */}
          <svg viewBox="0 0 100 100" style={{
            width: 200, height: 40, margin: '-8px auto 0',
            opacity: checking ? 0.8 : 0.3,
            transition: 'opacity 0.5s',
          }}>
            <polyline
              points={eegPoints}
              fill="none"
              stroke={checking ? '#00D1FF' : '#FF6B9D'}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: `drop-shadow(0 0 4px ${checking ? 'rgba(0, 209, 255, 0.5)' : 'rgba(255, 107, 157, 0.3)'})` }}
            />
          </svg>
        </div>

        {/* ─── Logo ─── */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '6px 16px', borderRadius: 999, marginBottom: 12,
          background: 'rgba(0, 209, 255, 0.06)',
          border: '1px solid rgba(0, 209, 255, 0.15)',
        }}>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: '#00D1FF', fontFamily: 'monospace' }}>
            NEUR🧠TIPS
          </span>
        </div>

        {/* ─── Title ─── */}
        <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: '0 0 6px', letterSpacing: -0.5 }}>
          Sistema en <span style={{ color: '#FF6B9D' }}>Mantenimiento</span>
        </h2>
        <p style={{ color: '#64748B', fontSize: 13, margin: '0 0 24px', lineHeight: 1.6, padding: '0 16px' }}>
          La red neuronal está recalibrándose. Volveremos en minutos con análisis más precisos.
        </p>

        {/* ─── Status Card ─── */}
        <div style={{
          borderRadius: 16, padding: 16, marginBottom: 16,
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.6))',
          border: '1px solid rgba(0, 209, 255, 0.1)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)',
        }}>
          {/* Status header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: checking ? '#F59E0B' : '#FF6B9D',
                boxShadow: checking ? '0 0 8px rgba(245, 158, 11, 0.5)' : '0 0 8px rgba(255, 107, 157, 0.5)',
                animation: 'pulse 1.5s infinite',
              }} />
              <span style={{
                fontSize: 11, fontWeight: 700, fontFamily: 'monospace', letterSpacing: 1,
                color: checking ? '#F59E0B' : '#FF6B9D',
              }}>
                {checking ? `RECONECTANDO${dots}` : 'NEURAL LINK OFFLINE'}
              </span>
            </div>
            <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#475569' }}>
              {checking ? '◉ SCAN' : `◷ ${countdown}s`}
            </span>
          </div>

          {/* Neural progress bar */}
          <div style={{
            width: '100%', height: 6, borderRadius: 3,
            background: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid rgba(100, 116, 139, 0.1)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: 3,
              width: checking ? '100%' : `${((30 - countdown) / 30) * 100}%`,
              background: checking
                ? 'linear-gradient(90deg, #00D1FF, #22C55E, #00D1FF)'
                : 'linear-gradient(90deg, #FF6B9D, #F59E0B)',
              backgroundSize: checking ? '200% 100%' : '100% 100%',
              animation: checking ? 'shimmer 1.5s linear infinite' : 'none',
              transition: 'width 1s linear',
              boxShadow: checking
                ? '0 0 8px rgba(0, 209, 255, 0.4)'
                : '0 0 6px rgba(255, 107, 157, 0.3)',
            }} />
          </div>

          {/* Stats row */}
          <div style={{
            display: 'flex', justifyContent: 'space-around', marginTop: 12,
            padding: '8px 0 0',
            borderTop: '1px solid rgba(100, 116, 139, 0.08)',
          }}>
            {[
              { label: 'REINTENTOS', value: retryCount, color: '#00D1FF' },
              { label: 'ESTADO', value: checking ? 'SCAN' : 'WAIT', color: checking ? '#22C55E' : '#F59E0B' },
              { label: 'UPTIME', value: '99.7%', color: '#22C55E' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 14, fontWeight: 800, fontFamily: 'monospace', color: s.color, margin: 0 }}>
                  {s.value}
                </p>
                <p style={{ fontSize: 8, fontWeight: 600, color: '#475569', margin: '2px 0 0', letterSpacing: 1 }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Retry Button ─── */}
        <button
          onClick={() => { onRetry?.(); setRetryCount(r => r + 1); }}
          disabled={checking}
          style={{
            width: '100%', padding: 14, borderRadius: 14,
            fontSize: 14, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: checking
              ? 'rgba(30, 41, 59, 0.5)'
              : 'linear-gradient(135deg, rgba(0, 209, 255, 0.12), rgba(34, 197, 94, 0.08))',
            border: checking
              ? '1px solid rgba(100, 116, 139, 0.15)'
              : '1px solid rgba(0, 209, 255, 0.25)',
            color: checking ? '#475569' : '#00D1FF',
            cursor: checking ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s',
            boxShadow: checking ? 'none' : '0 0 20px rgba(0, 209, 255, 0.08)',
          }}
          onMouseEnter={e => { if (!checking) e.target.style.boxShadow = '0 0 30px rgba(0, 209, 255, 0.15)'; }}
          onMouseLeave={e => { if (!checking) e.target.style.boxShadow = '0 0 20px rgba(0, 209, 255, 0.08)'; }}
        >
          <svg
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ width: 16, height: 16, animation: checking ? 'spin 1s linear infinite' : 'none' }}
          >
            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          {checking ? 'Escaneando red neuronal...' : 'Reconectar ahora'}
        </button>

        {/* ─── Bottom tips ─── */}
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
          {[
            { icon: '🔒', text: 'Tu cuenta y datos están protegidos' },
            { icon: '⚡', text: 'Reconexión automática activada' },
            { icon: '🧠', text: '31 tipsters listos cuando volvamos' },
          ].map((tip, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10 }}>{tip.icon}</span>
              <span style={{ fontSize: 10, color: '#475569' }}>{tip.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── COMPACT MODE: Banner ───
function ServerDownCompact({ onRetry, checking = false }) {
  const [countdown, setCountdown] = useState(30);
  const [brainFrame, setBrainFrame] = useState(0);

  useEffect(() => {
    const i = setInterval(() => setBrainFrame(p => p + 1), 100);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if (checking) { setCountdown(30); return; }
    const i = setInterval(() => setCountdown(p => p <= 1 ? 30 : p - 1), 1000);
    return () => clearInterval(i);
  }, [checking]);

  return (
    <div style={{
      borderRadius: 14, padding: '12px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      background: 'linear-gradient(135deg, rgba(0, 209, 255, 0.04), rgba(255, 107, 157, 0.04))',
      border: '1px solid rgba(0, 209, 255, 0.12)',
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
    }}>
      {/* Brain icon with pulse */}
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: checking
          ? 'linear-gradient(135deg, rgba(0, 209, 255, 0.1), rgba(34, 197, 94, 0.08))'
          : 'linear-gradient(135deg, rgba(255, 107, 157, 0.1), rgba(245, 158, 11, 0.08))',
        border: checking
          ? '1px solid rgba(0, 209, 255, 0.2)'
          : '1px solid rgba(255, 107, 157, 0.2)',
        animation: 'pulse 2s infinite',
      }}>
        <span style={{ fontSize: 22 }}>🧠</span>
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>Neural Link</span>
          <span style={{
            fontSize: 9, fontWeight: 700, fontFamily: 'monospace',
            padding: '1px 6px', borderRadius: 4, letterSpacing: 0.5,
            background: checking ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 107, 157, 0.12)',
            color: checking ? '#F59E0B' : '#FF6B9D',
            border: checking ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(255, 107, 157, 0.2)',
          }}>
            {checking ? 'SCANNING' : 'OFFLINE'}
          </span>
        </div>
        <p style={{ color: '#64748B', fontSize: 11, margin: '2px 0 0' }}>
          {checking ? 'Reconectando...' : `Reintento automático en ${countdown}s`}
        </p>
      </div>

      {/* Retry button */}
      <button
        onClick={onRetry}
        disabled={checking}
        style={{
          padding: '7px 14px', borderRadius: 10,
          fontSize: 11, fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'rgba(0, 209, 255, 0.08)',
          border: '1px solid rgba(0, 209, 255, 0.2)',
          color: '#00D1FF',
          cursor: checking ? 'not-allowed' : 'pointer',
          opacity: checking ? 0.5 : 1,
          transition: 'all 0.2s',
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ width: 12, height: 12, animation: checking ? 'spin 1s linear infinite' : 'none' }}>
          <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg>
        Retry
      </button>
    </div>
  );
}

// ─── DEMO APP ───
export default function App() {
  const [mode, setMode] = useState('full');
  const [simChecking, setSimChecking] = useState(false);

  const simulateRetry = () => {
    setSimChecking(true);
    setTimeout(() => setSimChecking(false), 3000);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #060B18 0%, #0B1120 30%, #0F172A 60%, #0B1120 100%)',
      fontFamily: "'SF Pro Display', 'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Mode selector */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '20px 0 12px' }}>
        <span style={{ color: '#475569', fontSize: 10, fontWeight: 700, letterSpacing: 1.5 }}>MODO:</span>
        {[
          { key: 'full', label: '📱 Pantalla Completa' },
          { key: 'compact', label: '📢 Banner' },
        ].map(m => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            style={{
              padding: '6px 16px', borderRadius: 10, fontSize: 11, fontWeight: 700,
              background: mode === m.key ? 'rgba(0, 209, 255, 0.1)' : 'rgba(30, 41, 59, 0.4)',
              border: mode === m.key ? '1px solid rgba(0, 209, 255, 0.25)' : '1px solid rgba(100, 116, 139, 0.1)',
              color: mode === m.key ? '#00D1FF' : '#475569',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Preview */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px' }}>
        {mode === 'full' ? (
          <ServerDownFull onRetry={simulateRetry} checking={simChecking} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header sim */}
            <div style={{
              padding: '12px 16px', borderRadius: 14,
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(100, 116, 139, 0.08)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 18 }}>🧠</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#00D1FF', fontFamily: 'monospace', letterSpacing: 1 }}>
                NEUR🧠TIPS
              </span>
              <span style={{ fontSize: 10, color: '#475569', marginLeft: 'auto' }}>Dashboard</span>
            </div>

            <ServerDownCompact onRetry={simulateRetry} checking={simChecking} />

            {/* Fake dashboard cards */}
            {[
              { h: 90, title: 'Centro de Operaciones' },
              { h: 70, title: 'Picks del Día' },
              { h: 60, title: 'Rendimiento IA' },
            ].map((card, i) => (
              <div key={i} style={{
                padding: 16, borderRadius: 14, height: card.h,
                background: 'rgba(15, 23, 42, 0.4)',
                border: '1px solid rgba(100, 116, 139, 0.06)',
                opacity: 0.25,
              }}>
                <div style={{
                  width: 120, height: 8, borderRadius: 4,
                  background: 'rgba(100, 116, 139, 0.15)',
                }} />
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes brainPulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 12px rgba(0, 209, 255, 0.3)); }
          50% { transform: scale(1.05); filter: drop-shadow(0 0 20px rgba(0, 209, 255, 0.5)); }
        }
        @keyframes scanLine {
          0% { top: 8px; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { top: calc(100% - 8px); opacity: 0; }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
