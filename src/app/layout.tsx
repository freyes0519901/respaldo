import type { Metadata, Viewport } from 'next';
import './globals.css';
import PWARegister from '@/components/PWARegister';
import GoogleAnalytics from '@/components/GoogleAnalytics';

export const metadata: Metadata = {
  title: 'NeuroTips - Análisis de Tipsters con IA',
  description: 'Hacemos lo que el ojo humano no ve. Nuestro algoritmo detecta patrones de éxito y señales de riesgo antes de que coloques tu dinero.',
  keywords: 'tipsters, apuestas deportivas, betting, picks, pronósticos, IA, análisis, neurotips, tipsters verificados, picks deportivos',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NeuroTips',
  },
  openGraph: {
    title: 'NeuroTips - Análisis de Tipsters con IA',
    description: 'Hacemos lo que el ojo humano no ve. Detectamos patrones de éxito y riesgos antes que nadie.',
    url: 'https://neurotips.io',
    siteName: 'NeuroTips',
    locale: 'es_CL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NeuroTips - Análisis de Tipsters con IA',
    description: 'Hacemos lo que el ojo humano no ve. Detectamos patrones de éxito y riesgos antes que nadie.',
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  themeColor: '#00D1B2',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-96x96.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-72x72.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="NeuroTips" />
      </head>
      <body className="antialiased">
        <GoogleAnalytics />
        {children}
        <PWARegister />
      </body>
    </html>
  );
}
