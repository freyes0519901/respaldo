'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Wallet, Shield, Zap, Target, ChevronRight, ChevronLeft,
  CheckCircle, Loader2
} from 'lucide-react';
import { miBancaAPI } from '@/lib/api';

const DEPORTES = [
  { id: 'futbol', nombre: 'Fútbol', emoji: '⚽' },
  { id: 'basket', nombre: 'Básquet', emoji: '🏀' },
  { id: 'tenis', nombre: 'Tenis', emoji: '🎾' },
  { id: 'esports', nombre: 'eSports', emoji: '🎮' },
  { id: 'beisbol', nombre: 'Béisbol', emoji: '⚾' },
  { id: 'hockey', nombre: 'Hockey', emoji: '🏒' },
  { id: 'mma', nombre: 'MMA/UFC', emoji: '🥊' },
  { id: 'otros', nombre: 'Otros', emoji: '🎯' },
];

const CASAS_APUESTAS = [
  'Betano', 'Bet365', 'Betsson', 'Coolbet', 'Rojabet', 
  'Betwarrior', '1xBet', 'Pinnacle', 'Otra'
];

const PERFILES_RIESGO = [
  {
    id: 'conservador',
    nombre: 'Conservador',
    descripcion: '1-2% por apuesta',
    detalle: 'Ideal para proteger tu capital. Crecimiento lento pero seguro.',
    color: 'blue',
    icon: Shield
  },
  {
    id: 'moderado',
    nombre: 'Moderado',
    descripcion: '2-4% por apuesta',
    detalle: 'Balance entre riesgo y ganancia. Recomendado para la mayoría.',
    color: 'yellow',
    icon: Target
  },
  {
    id: 'agresivo',
    nombre: 'Agresivo',
    descripcion: '4-6% por apuesta',
    detalle: 'Mayor riesgo, mayor potencial. Solo para expertos.',
    color: 'red',
    icon: Zap
  }
];

export default function SetupBancaPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    banca_inicial: '',
    perfil_riesgo: 'moderado' as 'conservador' | 'moderado' | 'agresivo',
    deportes_interes: [] as string[],
    casa_apuestas: '',
    meta_mensual: 10
  });

  const totalSteps = 4;

  const handleDeporteToggle = (deporteId: string) => {
    setFormData(prev => ({
      ...prev,
      deportes_interes: prev.deportes_interes.includes(deporteId)
        ? prev.deportes_interes.filter(d => d !== deporteId)
        : [...prev.deportes_interes, deporteId]
    }));
  };

  const handleSubmit = async () => {
    if (!formData.banca_inicial || parseFloat(formData.banca_inicial) <= 0) {
      setError('Ingresa una banca válida');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await miBancaAPI.setup({
        banca_inicial: parseFloat(formData.banca_inicial),
        perfil_riesgo: formData.perfil_riesgo,
        deportes_interes: formData.deportes_interes,
        casa_apuestas: formData.casa_apuestas,
        meta_mensual: formData.meta_mensual
      });

      router.push('/dashboard/mi-banca');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar configuración');
    } finally {
      setIsLoading(false);
    }
  };

  const canContinue = () => {
    switch (step) {
      case 1: return formData.banca_inicial && parseFloat(formData.banca_inicial) > 0;
      case 2: return formData.perfil_riesgo;
      case 3: return true; // Deportes es opcional
      case 4: return true; // Meta es opcional
      default: return false;
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col animate-fadeIn">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[#94A3B8]">Paso {step} de {totalSteps}</span>
          <span className="text-sm text-[#00D1B2]">{Math.round((step / totalSteps) * 100)}%</span>
        </div>
        <div className="h-2 bg-[#1E293B] rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#00D1B2] to-[#00D1B2]/70 rounded-full transition-all duration-500"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1">
        {/* Step 1: Banca Inicial */}
        {step === 1 && (
          <div className="space-y-6 animate-fadeInUp">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-[#00D1B2]/10 flex items-center justify-center mx-auto mb-4">
                <Wallet className="h-8 w-8 text-[#00D1B2]" />
              </div>
              <h1 className="text-2xl font-bold text-white">¿Cuál es tu banca inicial?</h1>
              <p className="text-[#94A3B8] mt-2">
                El monto total que destinarás a tus apuestas
              </p>
            </div>

            <div className="max-w-md mx-auto">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] text-2xl">$</span>
                <input
                  type="number"
                  value={formData.banca_inicial}
                  onChange={(e) => setFormData(prev => ({ ...prev, banca_inicial: e.target.value }))}
                  placeholder="500.000"
                  className="w-full bg-[#1E293B] border border-[#334155] rounded-xl py-4 pl-12 pr-4 text-2xl text-white font-mono focus:border-[#00D1B2] focus:ring-1 focus:ring-[#00D1B2] outline-none transition-all"
                />
              </div>

              {/* Sugerencias rápidas */}
              <div className="flex flex-wrap gap-2 mt-4">
                {[100000, 250000, 500000, 1000000].map((monto) => (
                  <button
                    key={monto}
                    onClick={() => setFormData(prev => ({ ...prev, banca_inicial: monto.toString() }))}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      formData.banca_inicial === monto.toString()
                        ? 'bg-[#00D1B2] text-white'
                        : 'bg-[#1E293B] text-[#94A3B8] hover:bg-[#334155]'
                    }`}
                  >
                    ${monto.toLocaleString()}
                  </button>
                ))}
              </div>

              <p className="text-xs text-[#64748B] text-center mt-4">
                💡 Usa solo dinero que puedas permitirte perder
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Perfil de Riesgo */}
        {step === 2 && (
          <div className="space-y-6 animate-fadeInUp">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-[#FFDD57]/10 flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-[#FFDD57]" />
              </div>
              <h1 className="text-2xl font-bold text-white">¿Cuál es tu perfil de riesgo?</h1>
              <p className="text-[#94A3B8] mt-2">
                Esto determina cuánto apostar en cada pick
              </p>
            </div>

            <div className="max-w-lg mx-auto space-y-3">
              {PERFILES_RIESGO.map((perfil) => {
                const Icon = perfil.icon;
                const isSelected = formData.perfil_riesgo === perfil.id;
                const colorClasses = {
                  blue: 'border-blue-500/50 bg-blue-500/5',
                  yellow: 'border-[#FFDD57]/50 bg-[#FFDD57]/5',
                  red: 'border-[#EF4444]/50 bg-[#EF4444]/5'
                };
                const iconColors = {
                  blue: 'text-blue-400 bg-blue-500/10',
                  yellow: 'text-[#FFDD57] bg-[#FFDD57]/10',
                  red: 'text-[#EF4444] bg-[#EF4444]/10'
                };

                return (
                  <button
                    key={perfil.id}
                    onClick={() => setFormData(prev => ({ ...prev, perfil_riesgo: perfil.id as any }))}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      isSelected 
                        ? colorClasses[perfil.color as keyof typeof colorClasses]
                        : 'border-[#334155] bg-[#1E293B] hover:border-[#475569]'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2.5 rounded-xl ${iconColors[perfil.color as keyof typeof iconColors]}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-white">{perfil.nombre}</h3>
                          <span className="text-sm text-[#94A3B8] font-mono">{perfil.descripcion}</span>
                        </div>
                        <p className="text-sm text-[#94A3B8] mt-1">{perfil.detalle}</p>
                      </div>
                      {isSelected && (
                        <CheckCircle className="h-5 w-5 text-[#00D1B2] flex-shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Deportes + Casa de Apuestas */}
        {step === 3 && (
          <div className="space-y-6 animate-fadeInUp">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white">Personaliza tu experiencia</h1>
              <p className="text-[#94A3B8] mt-2">
                Selecciona tus deportes favoritos y casa de apuestas
              </p>
            </div>

            <div className="max-w-lg mx-auto space-y-6">
              {/* Deportes */}
              <div>
                <label className="text-sm text-[#94A3B8] mb-3 block">Deportes de interés</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DEPORTES.map((deporte) => {
                    const isSelected = formData.deportes_interes.includes(deporte.id);
                    return (
                      <button
                        key={deporte.id}
                        onClick={() => handleDeporteToggle(deporte.id)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'border-[#00D1B2] bg-[#00D1B2]/10 text-white'
                            : 'border-[#334155] bg-[#1E293B] text-[#94A3B8] hover:border-[#475569]'
                        }`}
                      >
                        <span className="text-xl mb-1 block">{deporte.emoji}</span>
                        <span className="text-xs">{deporte.nombre}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Casa de Apuestas */}
              <div>
                <label className="text-sm text-[#94A3B8] mb-3 block">Casa de apuestas principal</label>
                <select
                  value={formData.casa_apuestas}
                  onChange={(e) => setFormData(prev => ({ ...prev, casa_apuestas: e.target.value }))}
                  className="w-full bg-[#1E293B] border border-[#334155] rounded-xl py-3 px-4 text-white focus:border-[#00D1B2] focus:ring-1 focus:ring-[#00D1B2] outline-none"
                >
                  <option value="">Selecciona una...</option>
                  {CASAS_APUESTAS.map((casa) => (
                    <option key={casa} value={casa}>{casa}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Meta Mensual */}
        {step === 4 && (
          <div className="space-y-6 animate-fadeInUp">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-[#00D1B2]/10 flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-[#00D1B2]" />
              </div>
              <h1 className="text-2xl font-bold text-white">¿Cuál es tu meta mensual?</h1>
              <p className="text-[#94A3B8] mt-2">
                El porcentaje de profit que quieres lograr cada mes
              </p>
            </div>

            <div className="max-w-md mx-auto">
              <div className="bg-[#1E293B] rounded-xl p-6">
                <div className="flex items-center justify-center gap-2 mb-6">
                  <span className="text-5xl font-bold text-white font-mono">{formData.meta_mensual}</span>
                  <span className="text-2xl text-[#94A3B8]">%</span>
                </div>

                <input
                  type="range"
                  min="5"
                  max="30"
                  step="5"
                  value={formData.meta_mensual}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_mensual: parseInt(e.target.value) }))}
                  className="w-full accent-[#00D1B2]"
                />

                <div className="flex justify-between text-xs text-[#64748B] mt-2">
                  <span>5%</span>
                  <span>15%</span>
                  <span>30%</span>
                </div>

                <p className="text-sm text-[#94A3B8] text-center mt-4">
                  Con una banca de <span className="text-white font-mono">${parseFloat(formData.banca_inicial || '0').toLocaleString()}</span>,
                  tu meta sería <span className="text-[#00D1B2] font-mono">
                    +${(parseFloat(formData.banca_inicial || '0') * formData.meta_mensual / 100).toLocaleString()}
                  </span> mensuales
                </p>
              </div>

              {/* Resumen */}
              <div className="mt-6 p-4 rounded-xl bg-[#0F172A] border border-[#334155]">
                <h3 className="text-sm text-[#94A3B8] mb-3">Resumen de configuración</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Banca inicial</span>
                    <span className="text-white font-mono">${parseFloat(formData.banca_inicial || '0').toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Perfil</span>
                    <span className="text-white capitalize">{formData.perfil_riesgo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Meta mensual</span>
                    <span className="text-[#00D1B2]">+{formData.meta_mensual}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-sm text-center">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#334155]">
        <button
          onClick={() => setStep(s => Math.max(1, s - 1))}
          disabled={step === 1}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[#94A3B8] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="h-4 w-4" />
          Atrás
        </button>

        {step < totalSteps ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canContinue()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#00D1B2] text-white font-medium hover:bg-[#00D1B2]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Continuar
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#00D1B2] text-white font-medium hover:bg-[#00D1B2]/90 disabled:opacity-50 transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                Comenzar
                <CheckCircle className="h-4 w-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
