'use client';

/**
 * CertBadge — Badge de certificación IA reutilizable
 * Niveles: TRIPLE_CHECK (✓✓✓), DOUBLE_CHECK (✓✓), SINGLE_CHECK (✓), REJECTED (✗)
 */

import React from 'react';

interface CertBadgeProps {
  level: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const CERT_CONFIG: Record<string, {
  emoji: string;
  label: string;
  color: string;
  bg: string;
  border: string;
  glow: string;
}> = {
  TRIPLE_CHECK: {
    emoji: '✓✓✓',
    label: 'Certificado Premium',
    color: '#2ED573',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/40',
    glow: 'shadow-emerald-500/20',
  },
  DOUBLE_CHECK: {
    emoji: '✓✓',
    label: 'Certificado',
    color: '#00D1B2',
    bg: 'bg-teal-500/15',
    border: 'border-teal-500/40',
    glow: 'shadow-teal-500/20',
  },
  SINGLE_CHECK: {
    emoji: '✓',
    label: 'Verificado',
    color: '#FFDD57',
    bg: 'bg-yellow-500/15',
    border: 'border-yellow-500/40',
    glow: 'shadow-yellow-500/20',
  },
  REJECTED: {
    emoji: '✗',
    label: 'No recomendado',
    color: '#FF4757',
    bg: 'bg-red-500/15',
    border: 'border-red-500/40',
    glow: 'shadow-red-500/10',
  },
  PENDING: {
    emoji: '⏳',
    label: 'Analizando',
    color: '#94A3B8',
    bg: 'bg-slate-500/15',
    border: 'border-slate-500/30',
    glow: '',
  },
};

const SIZE_MAP = {
  sm: { badge: 'px-1.5 py-0.5 text-xs', label: 'text-xs ml-1' },
  md: { badge: 'px-2.5 py-1 text-sm', label: 'text-sm ml-1.5' },
  lg: { badge: 'px-3 py-1.5 text-base', label: 'text-base ml-2' },
};

export default function CertBadge({ level, size = 'md', showLabel = true, className = '' }: CertBadgeProps) {
  const config = CERT_CONFIG[level] || CERT_CONFIG.PENDING;
  const sizeClass = SIZE_MAP[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border font-mono font-bold ${config.bg} ${config.border} ${sizeClass.badge} ${config.glow ? `shadow-md ${config.glow}` : ''} ${className}`}
      style={{ color: config.color }}
      title={config.label}
    >
      <span>{config.emoji}</span>
      {showLabel && (
        <span className={`font-sans font-medium ${sizeClass.label}`}>
          {config.label}
        </span>
      )}
    </span>
  );
}

// Versión inline para tablas/listas
export function CertDot({ level, className = '' }: { level: string; className?: string }) {
  const config = CERT_CONFIG[level] || CERT_CONFIG.PENDING;
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${className}`}
      style={{ backgroundColor: config.color }}
      title={`${config.emoji} ${config.label}`}
    />
  );
}

// Barra de confianza
export function CertConfidenceBar({ confidence, level, className = '' }: { confidence: number; level: string; className?: string }) {
  const config = CERT_CONFIG[level] || CERT_CONFIG.PENDING;
  return (
    <div className={`w-full h-2 rounded-full bg-slate-700/50 overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, confidence)}%`, backgroundColor: config.color }}
      />
    </div>
  );
}
