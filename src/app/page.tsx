'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// ═══════════════════════════════════════════════════════════════
// NEUROTIPS LANDING PAGE v3 — LIVE STATS + i18n + CONVERSION
// Design: Dark navy #060A13 + Teal #00D1B2 + Gold #FFBB00
// Fonts: Space Grotesk + DM Sans + JetBrains Mono (Google Fonts)
// Security: XSS-safe, sanitized API data, no dangerouslySetInnerHTML
// ═══════════════════════════════════════════════════════════════

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://franciscoanalistadeportivo.pythonanywhere.com';

// ── i18n TRANSLATIONS ──
type Lang = 'es' | 'en' | 'pt';

const translations: Record<Lang, Record<string, string>> = {
  es: {
    login: 'Iniciar Sesión',
    start_free: 'Comenzar Gratis',
    badge_ia: '🧠 Sistema de certificación con 4 niveles IA',
    hero_title_1: 'Hacemos lo que el ',
    hero_title_2: 'ojo humano no ve',
    hero_desc: 'Nuestro algoritmo analiza {tipsters}+ tipsters reales de Telegram, detecta patrones de éxito y señales de riesgo antes de que coloques tu dinero.',
    hero_quote: '"No te damos picks; te damos una ',
    hero_quote_hl: 'ventaja competitiva basada en datos',
    hero_quote_end: '."',
    stat_picks: 'Picks Analizados',
    stat_wr: 'Win Rate Global',
    stat_streak: 'Mejor Racha',
    cta_telegram: 'Recibe gratis la apuesta del día',
    cta_whatsapp: 'Escríbenos por WhatsApp',
    cta_convinced: '¿Ya estás convencido?',
    cta_5days: 'Comenzar 5 días gratis →',
    social_tipsters: 'tipsters verificados',
    social_bets: 'apuestas registradas',
    social_transparent: '100% transparente',
    social_ia: 'Certificación IA 4 niveles',
    diff_title: '¿Qué hacemos diferente?',
    diff_desc: 'Seguimos a {tipsters}+ tipsters de Telegram. Registramos TODAS sus apuestas y nuestra IA encuentra los patrones que ellos mismos no ven.',
    diff_1_title: '100% Transparente',
    diff_1_desc: 'No borramos apuestas perdidas como hacen otros. Cada resultado queda registrado.',
    diff_2_title: 'IA Predictiva',
    diff_2_desc: 'Detectamos en qué mercados y cuotas rinde mejor cada tipster automáticamente.',
    diff_3_title: 'Stake Óptimo',
    diff_3_desc: 'Te decimos cuánto apostar según el historial real y tu nivel de riesgo.',
    tg_title: 'Así se ve en tu Telegram',
    tg_desc: 'Recibes análisis verificados directo en tu celular',
    top_title: 'Top Tipsters Verificados',
    top_desc: 'Ranking basado en {total}+ apuestas registradas. Actualizado diariamente.',
    top_bets: 'apuestas',
    top_alias_note: 'Usamos aliases para proteger la identidad de los tipsters originales.',
    how_title: 'Cómo funciona',
    how_1_title: 'Capturamos todo',
    how_1_desc: 'Registramos cada apuesta de cada tipster en tiempo real: cuota, resultado, mercado, hora.',
    how_2_title: 'La IA analiza',
    how_2_desc: 'Detectamos en qué mercados y cuotas rinde mejor cada tipster. Calculamos ROI, rachas y EV.',
    how_3_title: 'Tú decides con datos',
    how_3_desc: 'Ves solo picks con valor esperado positivo. Stake sugerido según tu banca y perfil de riesgo.',
    plan_title: 'Elige tu plan',
    plan_desc: 'Sin trucos. Acceso total. Cancela cuando quieras.',
    plan_monthly: 'Mensual',
    plan_quarterly: 'Trimestral',
    plan_annual: 'Anual',
    plan_popular: '⭐ MÁS POPULAR',
    plan_save_13: 'Ahorra 13%',
    plan_save_33: 'Ahorra 33%',
    plan_feat_1: '✓ Todos los tipsters',
    plan_feat_2: '✓ Picks filtrados por IA',
    plan_feat_3: '✓ Alertas por Telegram',
    plan_feat_4: '✓ Soporte prioritario',
    plan_note: '5 días gratis · Sin tarjeta de crédito · Transferencia bancaria o crypto',
    vip_title: 'Picks exclusivos verificados por IA',
    vip_desc: 'Accede a pronósticos premium de tipsters internacionales, filtrados por nuestro algoritmo. Add-on al plan base · Máximo 5 picks VIP por mes para mantener la calidad.',
    vip_cta: 'Desbloquear Sala VIP',
    final_title: '¿Listo para tu ventaja basada en datos?',
    final_desc: '{total}+ apuestas verificadas. {tipsters}+ tipsters analizados con IA. Deja de apostar a ciegas.',
    final_have_account: 'Ya tengo cuenta',
    footer_legal: '© 2026 NeuroTips • Todos los derechos reservados',
    footer_legal_2: 'Juego responsable. Solo +18. NeuroTips proporciona análisis estadísticos, no asesoría financiera.',
  },
  en: {
    login: 'Sign In',
    start_free: 'Start Free',
    badge_ia: '🧠 4-level AI certification system',
    hero_title_1: 'We see what the ',
    hero_title_2: 'human eye can\'t',
    hero_desc: 'Our algorithm analyzes {tipsters}+ real Telegram tipsters, detecting success patterns and risk signals before you place your money.',
    hero_quote: '"We don\'t give you picks; we give you a ',
    hero_quote_hl: 'data-driven competitive edge',
    hero_quote_end: '."',
    stat_picks: 'Picks Analyzed',
    stat_wr: 'Global Win Rate',
    stat_streak: 'Best Streak',
    cta_telegram: 'Get today\'s free pick',
    cta_whatsapp: 'Message us on WhatsApp',
    cta_convinced: 'Already convinced?',
    cta_5days: 'Start 5 free days →',
    social_tipsters: 'verified tipsters',
    social_bets: 'registered bets',
    social_transparent: '100% transparent',
    social_ia: '4-level AI Certification',
    diff_title: 'What makes us different?',
    diff_desc: 'We track {tipsters}+ Telegram tipsters. We record ALL their bets and our AI finds the patterns they can\'t see themselves.',
    diff_1_title: '100% Transparent',
    diff_1_desc: 'We don\'t erase losing bets like others do. Every result stays on record.',
    diff_2_title: 'Predictive AI',
    diff_2_desc: 'We automatically detect which markets and odds each tipster performs best in.',
    diff_3_title: 'Optimal Stake',
    diff_3_desc: 'We tell you how much to bet based on real history and your risk level.',
    tg_title: 'This is how it looks in Telegram',
    tg_desc: 'You receive verified analysis straight to your phone',
    top_title: 'Top Verified Tipsters',
    top_desc: 'Ranking based on {total}+ registered bets. Updated daily.',
    top_bets: 'bets',
    top_alias_note: 'We use aliases to protect the original tipsters\' identity.',
    how_title: 'How it works',
    how_1_title: 'We capture everything',
    how_1_desc: 'We record every bet from every tipster in real time: odds, result, market, time.',
    how_2_title: 'AI analyzes',
    how_2_desc: 'We detect which markets and odds each tipster performs best in. We calculate ROI, streaks and EV.',
    how_3_title: 'You decide with data',
    how_3_desc: 'You only see picks with positive expected value. Suggested stake based on your bankroll and risk profile.',
    plan_title: 'Choose your plan',
    plan_desc: 'No tricks. Full access. Cancel anytime.',
    plan_monthly: 'Monthly',
    plan_quarterly: 'Quarterly',
    plan_annual: 'Annual',
    plan_popular: '⭐ MOST POPULAR',
    plan_save_13: 'Save 13%',
    plan_save_33: 'Save 33%',
    plan_feat_1: '✓ All tipsters',
    plan_feat_2: '✓ AI-filtered picks',
    plan_feat_3: '✓ Telegram alerts',
    plan_feat_4: '✓ Priority support',
    plan_note: '5 free days · No credit card · Bank transfer or crypto',
    vip_title: 'AI-verified exclusive picks',
    vip_desc: 'Access premium forecasts from international tipsters, filtered by our algorithm. Add-on to base plan · Max 5 VIP picks per month to maintain quality.',
    vip_cta: 'Unlock VIP Room',
    final_title: 'Ready for your data-driven edge?',
    final_desc: '{total}+ verified bets. {tipsters}+ tipsters analyzed with AI. Stop betting blind.',
    final_have_account: 'I have an account',
    footer_legal: '© 2026 NeuroTips • All rights reserved',
    footer_legal_2: 'Responsible gambling. 18+ only. NeuroTips provides statistical analysis, not financial advice.',
  },
  pt: {
    login: 'Entrar',
    start_free: 'Começar Grátis',
    badge_ia: '🧠 Sistema de certificação com 4 níveis de IA',
    hero_title_1: 'Fazemos o que o ',
    hero_title_2: 'olho humano não vê',
    hero_desc: 'Nosso algoritmo analisa {tipsters}+ tipsters reais do Telegram, detecta padrões de sucesso e sinais de risco antes de você apostar.',
    hero_quote: '"Não damos palpites; damos uma ',
    hero_quote_hl: 'vantagem competitiva baseada em dados',
    hero_quote_end: '."',
    stat_picks: 'Picks Analisados',
    stat_wr: 'Win Rate Global',
    stat_streak: 'Melhor Sequência',
    cta_telegram: 'Receba grátis a aposta do dia',
    cta_whatsapp: 'Fale conosco no WhatsApp',
    cta_convinced: 'Já está convencido?',
    cta_5days: 'Começar 5 dias grátis →',
    social_tipsters: 'tipsters verificados',
    social_bets: 'apostas registradas',
    social_transparent: '100% transparente',
    social_ia: 'Certificação IA 4 níveis',
    diff_title: 'O que fazemos de diferente?',
    diff_desc: 'Seguimos {tipsters}+ tipsters do Telegram. Registramos TODAS as apostas e nossa IA encontra os padrões que eles mesmos não veem.',
    diff_1_title: '100% Transparente',
    diff_1_desc: 'Não apagamos apostas perdidas como outros fazem. Cada resultado fica registrado.',
    diff_2_title: 'IA Preditiva',
    diff_2_desc: 'Detectamos automaticamente em quais mercados e odds cada tipster tem melhor desempenho.',
    diff_3_title: 'Stake Ótimo',
    diff_3_desc: 'Dizemos quanto apostar com base no histórico real e seu perfil de risco.',
    tg_title: 'Assim aparece no seu Telegram',
    tg_desc: 'Você recebe análises verificadas direto no celular',
    top_title: 'Top Tipsters Verificados',
    top_desc: 'Ranking baseado em {total}+ apostas registradas. Atualizado diariamente.',
    top_bets: 'apostas',
    top_alias_note: 'Usamos aliases para proteger a identidade dos tipsters originais.',
    how_title: 'Como funciona',
    how_1_title: 'Capturamos tudo',
    how_1_desc: 'Registramos cada aposta de cada tipster em tempo real: odd, resultado, mercado, hora.',
    how_2_title: 'A IA analisa',
    how_2_desc: 'Detectamos em quais mercados e odds cada tipster tem melhor desempenho. Calculamos ROI, sequências e EV.',
    how_3_title: 'Você decide com dados',
    how_3_desc: 'Vê apenas picks com valor esperado positivo. Stake sugerido com base na sua banca e perfil de risco.',
    plan_title: 'Escolha seu plano',
    plan_desc: 'Sem truques. Acesso total. Cancele quando quiser.',
    plan_monthly: 'Mensal',
    plan_quarterly: 'Trimestral',
    plan_annual: 'Anual',
    plan_popular: '⭐ MAIS POPULAR',
    plan_save_13: 'Economize 13%',
    plan_save_33: 'Economize 33%',
    plan_feat_1: '✓ Todos os tipsters',
    plan_feat_2: '✓ Picks filtrados por IA',
    plan_feat_3: '✓ Alertas por Telegram',
    plan_feat_4: '✓ Suporte prioritário',
    plan_note: '5 dias grátis · Sem cartão de crédito · Transferência ou crypto',
    vip_title: 'Picks exclusivos verificados por IA',
    vip_desc: 'Acesse prognósticos premium de tipsters internacionais, filtrados pelo nosso algoritmo. Add-on ao plano base · Máximo 5 picks VIP por mês.',
    vip_cta: 'Desbloquear Sala VIP',
    final_title: 'Pronto para sua vantagem baseada em dados?',
    final_desc: '{total}+ apostas verificadas. {tipsters}+ tipsters analisados com IA. Pare de apostar no escuro.',
    final_have_account: 'Já tenho conta',
    footer_legal: '© 2026 NeuroTips • Todos os direitos reservados',
    footer_legal_2: 'Jogo responsável. Apenas +18. NeuroTips fornece análise estatística, não consultoria financeira.',
  },
};

// ── Helper: replace {variable} in translation strings (XSS-safe) ──
function t(translations: Record<string, string>, key: string, vars?: Record<string, string | number>): string {
  let text = translations[key] || key;
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      // Security: only allow numbers and safe strings
      const safe = String(v).replace(/[<>"'&]/g, '');
      text = text.replace(`{${k}}`, safe);
    });
  }
  return text;
}

// ── Animated counter with IntersectionObserver ──
// Re-animates when `end` changes (API loads real data)
function AnimatedCounter({ end, suffix = '', prefix = '', decimals = 0 }: {
  end: number; suffix?: string; prefix?: string; decimals?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasBeenVisible = useRef(false);
  const prevEnd = useRef(end);

  useEffect(() => {
    // Re-animate if value changed after API load
    if (prevEnd.current !== end && hasBeenVisible.current) {
      prevEnd.current = end;
      const duration = 1200;
      const step = end / (duration / 16);
      let current = 0;
      const timer = setInterval(() => {
        current += step;
        if (current >= end) { setCount(end); clearInterval(timer); }
        else setCount(current);
      }, 16);
      return () => clearInterval(timer);
    }
    prevEnd.current = end;

    // First animation on scroll into view
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasBeenVisible.current) {
        hasBeenVisible.current = true;
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

// ── SVG Icons ──
const TelegramIcon = ({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161l-1.97 9.281c-.145.658-.537.818-1.084.508l-3-2.211-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121L8.31 13.53l-2.97-.924c-.645-.203-.658-.645.136-.954l11.566-4.458c.537-.194 1.006.131.83.967z"/>
  </svg>
);

const WhatsAppIcon = ({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

// ── Language selector globe icon ──
const GlobeIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function HomePage() {
  // ── State ──
  const [lang, setLang] = useState<Lang>('es');
  const [langOpen, setLangOpen] = useState(false);
  const [stats, setStats] = useState({ total: 991, winRate: 61.8, racha: 79, tipsters: 32 });
  const [topTipsters, setTopTipsters] = useState([
    { alias: 'Gol Seguro', picks: 115, wr: 65.2, roi: 21.9 },
    { alias: 'Dato Mixto', picks: 120, wr: 58.3, roi: 10.3 },
    { alias: 'Punto de Quiebre', picks: 88, wr: 62.5, roi: 10.1 },
  ]);

  const i = translations[lang];

  // ── Detect browser language ──
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('neurotips_lang') as Lang;
      if (saved && ['es', 'en', 'pt'].includes(saved)) {
        setLang(saved);
      } else {
        const browserLang = navigator.language?.slice(0, 2);
        if (browserLang === 'pt') setLang('pt');
        else if (browserLang === 'en') setLang('en');
        // Default: es
      }
    }
  }, []);

  // ── Fetch real stats from API ──
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_URL}/api/public/stats`, { signal: controller.signal })
      .then(r => {
        if (!r.ok) throw new Error('API error');
        return r.json();
      })
      .then(d => {
        if (d && typeof d.total_picks === 'number') {
          setStats({
            total: d.total_picks || 991,
            winRate: d.win_rate || 61.8,
            racha: d.mejor_racha || 79,
            tipsters: d.total_tipsters || 32,
          });
        }
        // Top tipsters dinámicos
        if (d.top_tipsters && Array.isArray(d.top_tipsters) && d.top_tipsters.length > 0) {
          setTopTipsters(d.top_tipsters.map((tp: any) => ({
            alias: String(tp.alias || 'Tipster').slice(0, 30), // XSS: limit + sanitize
            picks: Math.abs(Math.floor(Number(tp.picks) || 0)),
            wr: Math.abs(Number(tp.wr) || 0),
            roi: Number(tp.roi) || 0,
          })));
        }
      })
      .catch(() => {}); // Silent fallback to defaults
    return () => controller.abort();
  }, []);

  // ── Language change handler ──
  const changeLang = useCallback((newLang: Lang) => {
    setLang(newLang);
    setLangOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('neurotips_lang', newLang);
    }
  }, []);

  const langLabels: Record<Lang, string> = { es: 'ES', en: 'EN', pt: 'PT' };

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
          {/* ── Language Selector ── */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
                color: 'var(--sub)', fontSize: 12, fontWeight: 600,
              }}
              aria-label="Change language"
            >
              <GlobeIcon size={14} />
              {langLabels[lang]}
            </button>
            {langOpen && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 4,
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 8, overflow: 'hidden', zIndex: 100,
                minWidth: 80,
              }}>
                {(['es', 'en', 'pt'] as Lang[]).map(l => (
                  <button
                    key={l}
                    onClick={() => changeLang(l)}
                    style={{
                      display: 'block', width: '100%', padding: '8px 16px',
                      background: l === lang ? 'rgba(0,209,178,0.15)' : 'transparent',
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                      color: l === lang ? 'var(--teal)' : 'var(--sub)',
                      fontSize: 12, fontWeight: 600,
                    }}
                  >
                    {{ es: '🇪🇸 Español', en: '🇬🇧 English', pt: '🇧🇷 Português' }[l]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link href="/login" style={{
            fontSize: 13, fontWeight: 600, color: 'var(--text)',
            border: '1px solid var(--border)', padding: '8px 16px', borderRadius: 8,
            textDecoration: 'none', transition: 'all 0.2s',
          }}>
            {i.login}
          </Link>
          <Link href="/registro" style={{
            fontSize: 13, fontWeight: 600, color: 'var(--bg)',
            background: 'var(--teal)', padding: '8px 16px', borderRadius: 8,
            textDecoration: 'none',
          }}>
            {i.start_free}
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
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(0,209,178,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,209,178,0.03) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }} />

        <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(0,209,178,0.1)', border: '1px solid rgba(0,209,178,0.2)',
            borderRadius: 20, padding: '6px 16px', marginBottom: 24,
            fontSize: 12, color: 'var(--teal)', fontWeight: 500,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--teal)' }} />
            {i.badge_ia}
          </div>

          <h1 style={{
            fontFamily: 'Space Grotesk', fontSize: 'clamp(32px, 6vw, 52px)',
            fontWeight: 700, lineHeight: 1.1, marginBottom: 16,
          }}>
            {i.hero_title_1}
            <span className="gradient-title">{i.hero_title_2}</span>
          </h1>

          <p style={{ fontSize: 16, color: 'var(--sub)', lineHeight: 1.6, marginBottom: 12, maxWidth: 500, margin: '0 auto 12px' }}>
            {t(i, 'hero_desc', { tipsters: stats.tipsters })}
          </p>

          <div style={{
            borderLeft: '3px solid var(--teal)', paddingLeft: 16, marginBottom: 28,
            display: 'inline-block', textAlign: 'left',
          }}>
            <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>
              {i.hero_quote}
              <span style={{ color: 'var(--teal)' }}>{i.hero_quote_hl}</span>
              {i.hero_quote_end}
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
            {[
              { label: i.stat_picks, value: stats.total, suffix: '+', decimals: 0, color: 'var(--teal)' },
              { label: i.stat_wr, value: stats.winRate, suffix: '%', decimals: 1, color: 'var(--text)' },
              { label: i.stat_streak, value: stats.racha, suffix: ' 🔥', prefix: '', decimals: 0, color: 'var(--gold)' },
            ].map((s, idx) => (
              <div key={idx} style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '14px 24px', minWidth: 130,
              }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 28, fontWeight: 700, color: s.color }}>
                  <AnimatedCounter end={s.value} suffix={s.suffix} prefix={s.prefix || ''} decimals={s.decimals} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <a href="https://t.me/IaNeuroTips" target="_blank" rel="noopener noreferrer" className="cta-gold" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: 'var(--gold)', color: '#060A13',
              padding: '16px 36px', borderRadius: 12,
              fontSize: 17, fontWeight: 700, fontFamily: 'Space Grotesk', textDecoration: 'none',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}>
              <TelegramIcon size={22} color="#060A13" />
              {i.cta_telegram}
            </a>

            <a href="https://wa.me/56978516119?text=Hola%20NeuroTips%2C%20quiero%20info%20sobre%20el%20servicio" target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(37,211,102,0.1)', color: '#25D366',
              border: '1px solid rgba(37,211,102,0.3)',
              padding: '12px 28px', borderRadius: 12,
              fontSize: 14, fontWeight: 600, fontFamily: 'DM Sans', textDecoration: 'none',
              transition: 'background 0.2s',
            }}>
              <WhatsAppIcon size={18} color="#25D366" />
              {i.cta_whatsapp}
            </a>

            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
              {i.cta_convinced}{' '}
              <Link href="/registro" style={{ color: 'var(--teal)', textDecoration: 'underline' }}>
                {i.cta_5days}
              </Link>
            </p>
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(transparent, #060A13)', pointerEvents: 'none' }} />
      </section>

      {/* ═══ SOCIAL PROOF BAR ═══ */}
      <section style={{
        background: 'var(--card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
        padding: '14px 24px',
        display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap',
      }}>
        {[
          { icon: '👥', text: `${stats.tipsters}+ ${i.social_tipsters}` },
          { icon: '📊', text: `${stats.total}+ ${i.social_bets}` },
          { icon: '🔍', text: i.social_transparent },
          { icon: '🤖', text: i.social_ia },
        ].map((s, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--sub)', fontWeight: 500 }}>
            <span>{s.icon}</span> {s.text}
          </div>
        ))}
      </section>

      {/* ═══ ¿QUÉ HACEMOS DIFERENTE? ═══ */}
      <section style={{ padding: '64px 24px', maxWidth: 800, margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>
          {i.diff_title}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--muted)', textAlign: 'center', marginBottom: 36, maxWidth: 500, margin: '0 auto 36px' }}>
          {t(i, 'diff_desc', { tipsters: stats.tipsters })}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {[
            { icon: '🔍', title: i.diff_1_title, desc: i.diff_1_desc, color: 'var(--teal)' },
            { icon: '🧠', title: i.diff_2_title, desc: i.diff_2_desc, color: 'var(--blue)' },
            { icon: '💰', title: i.diff_3_title, desc: i.diff_3_desc, color: 'var(--gold)' },
          ].map((f, idx) => (
            <div key={idx} style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 12, padding: 24, transition: 'border-color 0.3s, transform 0.3s',
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
          {i.tg_title}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 32 }}>
          {i.tg_desc}
        </p>

        {/* Telegram preview */}
        <div style={{
          maxWidth: 400, margin: '0 auto',
          background: '#E5DDD5', borderRadius: 16, padding: 12,
          textAlign: 'left',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #0891B2, #4ADE80)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
            }}>🧠</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#333' }}>NeuroTips Bot</div>
              <div style={{ fontSize: 10, color: '#888' }}>bot • hoy</div>
            </div>
          </div>

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

        <a href="https://t.me/IaNeuroTips" target="_blank" rel="noopener noreferrer" className="cta-gold" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'var(--gold)', color: '#060A13',
          padding: '14px 28px', borderRadius: 10,
          fontSize: 15, fontWeight: 700, fontFamily: 'Space Grotesk',
          textDecoration: 'none', marginTop: 24,
        }}>
          <TelegramIcon size={20} color="#060A13" />
          {i.cta_telegram}
        </a>
      </section>

      {/* ═══ TOP TIPSTERS (DINÁMICO) ═══ */}
      <section style={{ padding: '64px 24px', maxWidth: 800, margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>
          {i.top_title}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--muted)', textAlign: 'center', marginBottom: 32 }}>
          {t(i, 'top_desc', { total: stats.total })}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {topTipsters.map((tp, idx) => (
            <div key={idx} style={{
              background: 'var(--card)', borderRadius: 12, padding: 20, textAlign: 'center',
              border: idx === 0 ? '1px solid var(--teal)' : '1px solid var(--border)',
              position: 'relative',
            }}>
              {idx === 0 && (
                <div style={{
                  position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--teal)', color: '#060A13', fontSize: 10, fontWeight: 700,
                  padding: '3px 12px', borderRadius: 10, letterSpacing: 0.5,
                }}>
                  🏆 #1 VERIFICADO
                </div>
              )}
              <div style={{ fontSize: 32, marginBottom: 8, marginTop: idx === 0 ? 8 : 0 }}>⚽</div>
              <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{tp.alias}</h3>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12 }}>{tp.picks} {i.top_bets}</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 24, fontWeight: 700, color: 'var(--green)', marginBottom: 4 }}>
                {tp.roi > 0 ? '+' : ''}{tp.roi.toFixed(1)}%
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>ROI · WR {tp.wr.toFixed(1)}%</div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 16 }}>
          {i.top_alias_note}
        </p>
      </section>

      {/* ═══ CÓMO FUNCIONA ═══ */}
      <section style={{
        padding: '64px 24px', maxWidth: 700, margin: '0 auto',
        background: 'radial-gradient(ellipse at 50% 50%, rgba(59,130,246,0.04) 0%, transparent 60%)',
      }}>
        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 700, textAlign: 'center', marginBottom: 36 }}>
          {i.how_title}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {[
            { n: '01', title: i.how_1_title, desc: i.how_1_desc, color: 'var(--teal)' },
            { n: '02', title: i.how_2_title, desc: i.how_2_desc, color: 'var(--blue)' },
            { n: '03', title: i.how_3_title, desc: i.how_3_desc, color: 'var(--gold)' },
          ].map((s, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
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
          {i.plan_title}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--muted)', textAlign: 'center', marginBottom: 32 }}>
          {i.plan_desc}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {[
            { name: i.plan_monthly, days: '30 días', price: '$15.000', usd: '$17 USDT', popular: false },
            { name: i.plan_quarterly, days: '90 días', price: '$39.000', usd: '$43 USDT', popular: true, save: i.plan_save_13 },
            { name: i.plan_annual, days: '365 días', price: '$120.000', usd: '$130 USDT', popular: false, save: i.plan_save_33 },
          ].map((plan, idx) => (
            <div key={idx} style={{
              background: 'var(--card)', borderRadius: 12, padding: 24, textAlign: 'center',
              border: plan.popular ? '1px solid var(--teal)' : '1px solid var(--border)',
              position: 'relative',
            }}>
              {plan.popular && (
                <div style={{
                  position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--gold)', color: '#060A13', fontSize: 10, fontWeight: 700,
                  padding: '3px 12px', borderRadius: 10,
                }}>{i.plan_popular}</div>
              )}
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: plan.popular ? 8 : 0 }}>{plan.days}</div>
              <div style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 700, color: 'var(--text)', margin: '8px 0 4px' }}>
                {plan.price}<span style={{ fontSize: 14, color: 'var(--muted)' }}> /mes</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>CLP · o {plan.usd}</div>
              {plan.save && <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600, marginBottom: 8 }}>{plan.save}</div>}
              <ul style={{ listStyle: 'none', fontSize: 12, color: 'var(--sub)', lineHeight: 2, margin: '12px 0', textAlign: 'left', paddingLeft: 8 }}>
                <li>{i.plan_feat_1}</li>
                <li>{i.plan_feat_2}</li>
                <li>{i.plan_feat_3}</li>
                {plan.popular && <li>{i.plan_feat_4}</li>}
              </ul>
              <Link href="/registro" style={{
                display: 'block', padding: '10px 20px', borderRadius: 8,
                background: plan.popular ? 'var(--teal)' : 'transparent',
                color: plan.popular ? '#060A13' : 'var(--teal)',
                border: plan.popular ? 'none' : '1px solid var(--teal)',
                fontSize: 13, fontWeight: 600, textDecoration: 'none',
              }}>{i.start_free}</Link>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 12 }}>
          {i.plan_note}
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
          {i.vip_title}
        </h3>
        <p style={{ fontSize: 13, color: 'var(--sub)', marginBottom: 16 }}>
          {i.vip_desc}
        </p>
        <Link href="/registro" style={{
          display: 'inline-flex', padding: '10px 24px', borderRadius: 8,
          background: 'var(--gold)', color: '#060A13', fontSize: 14, fontWeight: 700,
          textDecoration: 'none',
        }}>{i.vip_cta}</Link>
      </section>

      {/* ═══ CTA FINAL ═══ */}
      <section style={{
        padding: '64px 24px', textAlign: 'center',
        background: 'linear-gradient(180deg, transparent, rgba(0,209,178,0.06))',
      }}>
        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
          {i.final_title}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--sub)', marginBottom: 28 }}>
          {t(i, 'final_desc', { total: stats.total, tipsters: stats.tipsters })}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <a href="https://t.me/IaNeuroTips" target="_blank" rel="noopener noreferrer" className="cta-gold" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'var(--gold)', color: '#060A13',
            padding: '16px 32px', borderRadius: 12,
            fontSize: 16, fontWeight: 700, fontFamily: 'Space Grotesk', textDecoration: 'none',
          }}>
            <TelegramIcon size={22} color="#060A13" />
            {i.cta_telegram}
          </a>
          <a href="https://wa.me/56978516119?text=Hola%20NeuroTips%2C%20quiero%20info" target="_blank" rel="noopener noreferrer" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(37,211,102,0.1)', color: '#25D366',
            border: '1px solid rgba(37,211,102,0.3)',
            padding: '16px 32px', borderRadius: 12,
            fontSize: 16, fontWeight: 700, fontFamily: 'Space Grotesk', textDecoration: 'none',
          }}>
            <WhatsAppIcon size={22} color="#25D366" />
            WhatsApp
          </a>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
          <Link href="/registro" style={{ fontSize: 13, color: 'var(--teal)', textDecoration: 'underline' }}>
            {i.cta_5days}
          </Link>
          <Link href="/login" style={{ fontSize: 13, color: 'var(--sub)', textDecoration: 'underline' }}>
            {i.final_have_account}
          </Link>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ padding: '24px', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Image src="/logo-neurotips.png" alt="NeuroTips" width={120} height={30} style={{ opacity: 0.7 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 12 }}>
          <a href="https://t.me/IaNeuroTips" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: 12 }}>Telegram</a>
          <a href="https://wa.me/56978516119" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: 12 }}>WhatsApp</a>
        </div>
        <p style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}>
          {i.footer_legal}<br />
          {i.footer_legal_2}
        </p>
      </footer>
    </>
  );
}
