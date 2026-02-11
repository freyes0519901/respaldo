'use client';

// ============================================================================
// NEUROTIPS V12.0 — COMPONENTES VISUALES SEMANA 1
// ============================================================================
// Archivo: src/components/ui/motion.tsx
// Drop-in: Copiar a tu proyecto Next.js 14
//
// REGLAS V12.0 CUMPLIDAS:
// ✅ REGLA #1 NEUROMARKETING: Shimmer atrae ojo → más clicks en CTA
// ✅ REGLA #1 NEUROMARKETING: NumberTicker genera emoción al ver crecimiento
// ✅ REGLA #1 NEUROMARKETING: FadeIn da sensación premium tipo Linear/Stripe
// ✅ REGLA #3 IDENTIDAD: Gradientes cyan→verde, glow effects, paleta oficial
// ✅ REGLA #4 SIN DINERO: Componentes neutros (sin montos hardcoded)
// ✅ REGLA #2 SEGURIDAD: Sin datos sensibles expuestos
//
// Stack: React 18 + TypeScript + Next.js 14 (App Router)
// Dependencias: NINGUNA (cero npm install)
// ============================================================================

import { useState, useEffect, useRef, ReactNode, CSSProperties } from 'react';

// ════════════════════════════════════════════════════════════════════════════
// 1. FadeInSection — Scroll-triggered reveal animation
// ════════════════════════════════════════════════════════════════════════════
//
// Reemplaza Framer Motion sin agregar dependencia (ahorra ~60KB).
// IntersectionObserver + CSS transitions = mismo resultado visual.
//
// Ejemplo:
//   <FadeInSection delay={0.15} from="bottom">
//     <h2>Sección que aparece al scroll</h2>
//   </FadeInSection>
//
// Para stagger manual en grids:
//   {cards.map((card, i) => (
//     <FadeInSection key={i} delay={0.1 + i * 0.12}>
//       <Card {...card} />
//     </FadeInSection>
//   ))}
// ════════════════════════════════════════════════════════════════════════════

interface FadeInSectionProps {
  children: ReactNode;
  delay?: number;           // Delay en segundos (default: 0)
  from?: 'bottom' | 'top' | 'left' | 'right' | 'scale'; // Dirección (default: bottom)
  distance?: number;        // Distancia en px (default: 40)
  duration?: number;        // Duración en ms (default: 800)
  threshold?: number;       // Observer threshold 0-1 (default: 0.1)
  className?: string;
  style?: CSSProperties;
}

export const FadeInSection = ({
  children,
  delay = 0,
  from = 'bottom',
  distance = 40,
  duration = 800,
  threshold = 0.1,
  className = '',
  style = {},
}: FadeInSectionProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  const transforms: Record<string, string> = {
    bottom: `translateY(${distance}px)`,
    top: `translateY(-${distance}px)`,
    left: `translateX(-${distance}px)`,
    right: `translateX(${distance}px)`,
    scale: 'scale(0.92)',
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translate(0, 0) scale(1)' : transforms[from],
        transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
        willChange: 'opacity, transform',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// 2. NumberTicker — Animated counter on scroll
// ════════════════════════════════════════════════════════════════════════════
//
// REEMPLAZA el AnimatedCounter actual en page.tsx
// MEJORAS: easeOutQuart (más suave), se activa al scroll, tabular-nums
//
// Ejemplo:
//   <NumberTicker value={923} suffix="+" />
//   <NumberTicker value={71.1} suffix="%" decimals={1} />
//   <NumberTicker value={34.2} prefix="+" suffix="%" decimals={1} />
//
// REGLA #4: No usar con montos de dinero. Solo unidades y porcentajes.
// ════════════════════════════════════════════════════════════════════════════

interface NumberTickerProps {
  value: number;
  suffix?: string;       // "%", "+", "u"
  prefix?: string;       // "+", etc
  decimals?: number;     // Decimales (default: 0)
  duration?: number;     // Duración en ms (default: 2200)
  className?: string;
}

export const NumberTicker = ({
  value,
  suffix = '',
  prefix = '',
  decimals = 0,
  duration = 2200,
  className = '',
}: NumberTickerProps) => {
  const [display, setDisplay] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const target = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(target)) return;

    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutQuart — deceleración suave y premium
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplay(eased * target);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [started, value, duration]);

  return (
    <span
      ref={ref}
      className={`font-mono ${className}`}
      style={{ fontVariantNumeric: 'tabular-nums' }}
    >
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// 3. ShimmerButton — CTA premium con efecto shimmer sweep + glow
// ════════════════════════════════════════════════════════════════════════════
//
// NEUROMARKETING: El shimmer sweep atrae el ojo inconscientemente.
// Pattern interrupt visual → el cerebro no puede ignorarlo → más clicks.
//
// Ejemplo teal (CTA principal):
//   <ShimmerButton href="/registro">
//     Comenzar 5 Días Gratis <ArrowRight />
//   </ShimmerButton>
//
// Ejemplo gold (VIP / Premium):
//   <ShimmerButton href="/dashboard/sala-vip" variant="gold">
//     Ver Sala VIP 🔥
//   </ShimmerButton>
//
// REGLA #3: Usa gradientes oficiales cyan→verde y gold→naranja
// ════════════════════════════════════════════════════════════════════════════

interface ShimmerButtonProps {
  children: ReactNode;
  href?: string;
  variant?: 'teal' | 'gold';
  size?: 'default' | 'small';
  onClick?: () => void;
  className?: string;
  fullWidth?: boolean;
}

export const ShimmerButton = ({
  children,
  href,
  variant = 'teal',
  size = 'default',
  onClick,
  className = '',
  fullWidth = false,
}: ShimmerButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const isTeal = variant === 'teal';
  const bg = isTeal
    ? 'linear-gradient(135deg, #00D1B2 0%, #00B89C 100%)'
    : 'linear-gradient(135deg, #FFBB00 0%, #F97316 100%)';
  const textColor = isTeal ? '#0B1120' : '#000';
  const glowColor = isTeal ? 'rgba(0, 209, 178,' : 'rgba(255, 187, 0,';

  const padding = size === 'small' ? '10px 24px' : '16px 36px';
  const fontSize = size === 'small' ? '13px' : '15px';

  const buttonStyle: CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding,
    borderRadius: size === 'small' ? '10px' : '14px',
    fontWeight: 800,
    fontSize,
    fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif",
    cursor: 'pointer',
    border: 'none',
    background: bg,
    color: textColor,
    transform: isHovered ? 'scale(1.04)' : 'scale(1)',
    boxShadow: isHovered
      ? `0 8px 40px ${glowColor}0.5), 0 0 60px ${glowColor}0.15)`
      : `0 4px 25px ${glowColor}0.35)`,
    transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
    textDecoration: 'none',
    width: fullWidth ? '100%' : 'auto',
  };

  const shimmerStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '200%',
    height: '100%',
    background:
      'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 45%, rgba(255,255,255,0.18) 55%, transparent 100%)',
    animation: 'shimmerSweep 2.8s ease-in-out infinite',
    pointerEvents: 'none' as const,
  };

  const content = (
    <>
      <span style={shimmerStyle} />
      <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
        {children}
      </span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={className}
        style={buttonStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      className={className}
      style={buttonStyle}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {content}
    </button>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// 4. GlowCard — Card con hover glow effect (para feature/tipster cards)
// ════════════════════════════════════════════════════════════════════════════
//
// Ejemplo:
//   <GlowCard glowColor="#00D1B2">
//     <h3>Card con glow teal al hover</h3>
//   </GlowCard>
//
//   <GlowCard glowColor="#FFBB00">
//     <h3>Card VIP con glow dorado</h3>
//   </GlowCard>
// ════════════════════════════════════════════════════════════════════════════

interface GlowCardProps {
  children: ReactNode;
  glowColor?: string;     // Color del glow (default: #00D1B2)
  className?: string;
  style?: CSSProperties;
}

export const GlowCard = ({
  children,
  glowColor = '#00D1B2',
  className = '',
  style = {},
}: GlowCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={className}
      style={{
        borderRadius: '16px',
        padding: '24px',
        background: '#1E293B',
        border: `1px solid ${isHovered ? glowColor + '50' : '#334155'}`,
        boxShadow: isHovered ? `0 0 35px ${glowColor}25` : 'none',
        transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        ...style,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// 5. MotionStyles — Inyecta los @keyframes necesarios
// ════════════════════════════════════════════════════════════════════════════
//
// OPCIÓN A: Agregar los keyframes a globals.css (recomendado)
// OPCIÓN B: Agregar <MotionStyles /> al inicio del return de la landing
//
// Uso:
//   return (
//     <div>
//       <MotionStyles />
//       {/* resto de la landing */}
//     </div>
//   );
// ════════════════════════════════════════════════════════════════════════════

export const MotionStyles = () => (
  <style jsx global>{`
    @keyframes shimmerSweep {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    @keyframes glowPulse {
      0%, 100% { box-shadow: 0 0 20px rgba(0, 209, 178, 0.15); }
      50% { box-shadow: 0 0 40px rgba(0, 209, 178, 0.3); }
    }
    @keyframes floatSlow {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-8px); }
    }
    @keyframes borderBreathe {
      0%, 100% { border-color: rgba(255, 187, 0, 0.15); }
      50% { border-color: rgba(255, 187, 0, 0.45); }
    }
  `}</style>
);
