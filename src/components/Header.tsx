'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

const LOGO_URL = "/logo.png";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/95 backdrop-blur-md border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <img 
              src={LOGO_URL}
              alt="NeuroTips"
              className="h-9 w-9 rounded-lg object-contain"
            />
            <span className="font-bold text-base text-white">
              Neuro<span className="text-[#00FF88]">Tips</span>
            </span>
          </Link>

          {/* DESKTOP - Botones (ocultos en móvil) */}
          <div className="hidden sm:flex items-center gap-3">
            <Link 
              href="/login" 
              className="text-[#94A3B8] hover:text-white transition text-sm px-3 py-2"
            >
              Iniciar Sesión
            </Link>
            <Link 
              href="/registro" 
              className="bg-[#00FF88] hover:bg-[#00E07A] text-[#050505] font-semibold text-sm py-2 px-4 rounded-lg transition"
            >
              Comenzar Gratis
            </Link>
          </div>

          {/* MOBILE - Botón hamburguesa (solo en móvil) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 text-white hover:bg-white/10 rounded-lg transition"
            aria-label="Menú"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* MOBILE MENU */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-white/10 py-4 space-y-2">
            <Link 
              href="/login" 
              className="block w-full text-center py-3 text-white border border-white/20 hover:bg-white/5 rounded-lg transition font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Iniciar Sesión
            </Link>
            <Link 
              href="/registro" 
              className="block w-full text-center py-3 bg-[#00FF88] hover:bg-[#00E07A] text-[#050505] font-bold rounded-lg transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Comenzar Gratis
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
