'use client';

import { useEffect, useState } from 'react';
import { 
  Wallet, Plus, Check, X, Calendar, BarChart3, 
  PiggyBank, Lightbulb, Edit3, Save, Flame, Trash2
} from 'lucide-react';
import MonteCarloSimulator from '@/components/MonteCarloSimulator';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://franciscoanalistadeportivo.pythonanywhere.com';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

interface ApuestaUsuario {
  id: number;
  fecha_evento: string;
  descripcion: string;
  cuota_usuario: number;
  stake: number;
  resultado: 'PENDIENTE' | 'GANADA' | 'PERDIDA' | 'NULA';
  tipster_alias?: string;
  ganancia_neta?: number;
}

interface PickRecomendado {
  id: number;
  tipster_alias: string;
  apuesta: string;
  cuota: number;
  tipo_mercado: string;
}

interface EstadisticasUsuario {
  banca_actual: number;
  ganancia_neta: number;
  yield: number;
  total_apuestas: number;
  ganadas: number;
  perdidas: number;
  pendientes: number;
  mejor_racha: number;
}

const IntroBanca = () => (
  <div className="rounded-2xl p-4 border border-[#00D1B2]/30 bg-gradient-to-br from-[#00D1B2]/10 to-transparent">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-[#00D1B2]/20 flex items-center justify-center flex-shrink-0">
        <Lightbulb className="h-5 w-5 text-[#00D1B2]" />
      </div>
      <div>
        <h3 className="text-white font-bold mb-1">Tu Banca = Tu Inversión</h3>
        <p className="text-[#94A3B8] text-sm">
          Gestiona tus apuestas como un inversionista. Define tu banca, registra cada apuesta, 
          y mira crecer tu capital a largo plazo con disciplina y buenos picks.
        </p>
      </div>
    </div>
  </div>
);

const BancaEditable = ({ banca, onSave }: { banca: number; onSave: (n: number) => void }) => {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(banca.toString());

  useEffect(() => { setValor(banca.toString()); }, [banca]);

  const handleSave = () => {
    const nuevaBanca = parseFloat(valor) || 0;
    if (nuevaBanca > 0) { onSave(nuevaBanca); setEditando(false); }
  };

  return (
    <div className="rounded-2xl p-6 border border-white/10" style={{ background: 'rgba(30,41,59,0.7)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold flex items-center gap-2">
          <PiggyBank className="h-5 w-5 text-[#00D1B2]" /> Mi Banca
        </h3>
        {!editando ? (
          <button onClick={() => setEditando(true)} className="p-2 rounded-lg bg-[#334155] hover:bg-[#475569]">
            <Edit3 className="h-4 w-4 text-[#94A3B8]" />
          </button>
        ) : (
          <button onClick={handleSave} className="p-2 rounded-lg bg-[#00D1B2] hover:bg-[#00B89F]">
            <Save className="h-4 w-4 text-white" />
          </button>
        )}
      </div>
      {editando ? (
        <div className="flex items-center gap-2">
          <span className="text-[#94A3B8] text-2xl">$</span>
          <input type="number" value={valor} onChange={(e) => setValor(e.target.value)}
            className="text-4xl font-bold font-mono text-[#00D1B2] bg-transparent border-b-2 border-[#00D1B2] focus:outline-none w-full" autoFocus />
        </div>
      ) : (
        <p className="text-4xl font-bold font-mono text-[#00D1B2]">${banca.toLocaleString()}</p>
      )}
      <p className="text-[#64748B] text-sm mt-2">Capital actual para apuestas</p>
    </div>
  );
};

const ModalRegistrarApuesta = ({ isOpen, onClose, onSave, banca, picksDelDia }: { 
  isOpen: boolean; onClose: () => void; onSave: (a: any) => void; banca: number; picksDelDia: PickRecomendado[];
}) => {
  const [modo, setModo] = useState<'picks' | 'manual'>('manual');
  const [apuesta, setApuesta] = useState('');
  const [cuota, setCuota] = useState('');
  const [stake, setStake] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [guardando, setGuardando] = useState(false);

  const calcStake = (c: number) => Math.round(banca * (c <= 1.5 ? 0.03 : c <= 2.0 ? 0.02 : 0.01));

  const handleSubmit = async () => {
    if (!apuesta || !cuota || !stake) return;
    setGuardando(true);
    await onSave({ descripcion: apuesta, cuota_usuario: parseFloat(cuota), stake: parseFloat(stake), fecha_evento: fecha });
    setApuesta(''); setCuota(''); setStake(''); setGuardando(false); onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1E293B] rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-white font-bold text-xl mb-4">Registrar Apuesta</h3>
        <div className="flex gap-2 mb-4">
          <button onClick={() => setModo('manual')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${modo === 'manual' ? 'bg-[#00D1B2] text-white' : 'bg-[#334155] text-[#94A3B8]'}`}>Manual</button>
          <button onClick={() => setModo('picks')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${modo === 'picks' ? 'bg-[#00D1B2] text-white' : 'bg-[#334155] text-[#94A3B8]'}`}>Picks</button>
        </div>

        {modo === 'picks' && (
          <div className="space-y-2 mb-4">
            {picksDelDia.length === 0 ? <p className="text-[#64748B] text-center py-4">No hay picks hoy</p> : 
              picksDelDia.map((p) => (
                <button key={p.id} onClick={() => { setApuesta(p.apuesta); setCuota(p.cuota.toString()); setStake(calcStake(p.cuota).toString()); setModo('manual'); }}
                  className="w-full text-left p-3 rounded-xl border border-white/10 bg-[#0F172A]/50 hover:border-white/30">
                  <span className="text-[#00D1B2] text-sm">{p.tipster_alias}</span>
                  <p className="text-white text-sm">{p.apuesta}</p>
                  <span className="text-white font-mono text-sm">@{p.cuota?.toFixed(2)}</span>
                </button>
              ))}
          </div>
        )}

        {modo === 'manual' && (
          <div className="space-y-4">
            <div>
              <label className="text-[#94A3B8] text-sm mb-1 block">Apuesta</label>
              <input type="text" value={apuesta} onChange={(e) => setApuesta(e.target.value)} placeholder="Ej: Real Madrid - Over 2.5"
                className="w-full px-4 py-3 rounded-xl bg-[#0F172A] border border-white/10 text-white placeholder-[#64748B] focus:outline-none focus:border-[#00D1B2]" />
            </div>
            <div>
              <label className="text-[#94A3B8] text-sm mb-1 block">Fecha</label>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#0F172A] border border-white/10 text-white focus:outline-none focus:border-[#00D1B2]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[#94A3B8] text-sm mb-1 block">Cuota</label>
                <input type="number" step="0.01" value={cuota} onChange={(e) => { setCuota(e.target.value); if (e.target.value && banca > 0) setStake(calcStake(parseFloat(e.target.value)).toString()); }}
                  placeholder="@1.85" className="w-full px-4 py-3 rounded-xl bg-[#0F172A] border border-white/10 text-white placeholder-[#64748B] focus:outline-none focus:border-[#00D1B2]" />
              </div>
              <div>
                <label className="text-[#94A3B8] text-sm mb-1 block">Stake ($)</label>
                <input type="number" value={stake} onChange={(e) => setStake(e.target.value)} placeholder="10000"
                  className="w-full px-4 py-3 rounded-xl bg-[#0F172A] border border-white/10 text-white placeholder-[#64748B] focus:outline-none focus:border-[#00D1B2]" />
              </div>
            </div>
            {cuota && stake && banca > 0 && (
              <div className="p-3 rounded-xl bg-[#00D1B2]/10 border border-[#00D1B2]/30">
                <p className="text-sm text-[#94A3B8]">Recomendación IA</p>
                <p className="text-[#00D1B2] font-medium">Stake sugerido: ${calcStake(parseFloat(cuota)).toLocaleString()} ({((calcStake(parseFloat(cuota)) / banca) * 100).toFixed(1)}%)</p>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-[#334155] text-[#94A3B8] font-medium hover:bg-[#475569]">Cancelar</button>
          <button onClick={handleSubmit} disabled={!apuesta || !cuota || !stake || guardando}
            className="flex-1 py-3 rounded-xl bg-[#00D1B2] text-white font-medium hover:bg-[#00B89F] disabled:opacity-50">{guardando ? 'Guardando...' : 'Guardar'}</button>
        </div>
      </div>
    </div>
  );
};

const CardApuesta = ({ apuesta, onMarcar, onEliminar }: { apuesta: ApuestaUsuario; onMarcar: (id: number, r: 'GANADA' | 'PERDIDA') => void; onEliminar: (id: number) => void }) => {
  const isPendiente = apuesta.resultado === 'PENDIENTE';
  const isGanada = apuesta.resultado === 'GANADA';

  return (
    <div className={`rounded-xl p-4 border ${isGanada ? 'border-[#00D1B2]/30 bg-[#00D1B2]/5' : apuesta.resultado === 'PERDIDA' ? 'border-[#EF4444]/30 bg-[#EF4444]/5' : 'border-[#F59E0B]/30 bg-[#F59E0B]/5'}`}>
      <p className="text-white font-medium mb-2">{apuesta.descripcion}</p>
      <div className="flex items-center justify-between text-sm mb-3">
        <span className="text-[#94A3B8]">{apuesta.fecha_evento}</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-white">@{Number(apuesta.cuota_usuario || 0).toFixed(2)}</span>
          <span className="font-mono text-[#FFDD57]">${Number(apuesta.stake || 0).toLocaleString()}</span>
        </div>
      </div>
      {isPendiente ? (
        <div className="flex gap-2">
          <button onClick={() => onMarcar(apuesta.id, 'GANADA')} className="flex-1 py-2 rounded-lg bg-[#00D1B2]/20 text-[#00D1B2] font-medium hover:bg-[#00D1B2]/30 flex items-center justify-center gap-2">
            <Check className="h-4 w-4" /> Ganada
          </button>
          <button onClick={() => onMarcar(apuesta.id, 'PERDIDA')} className="flex-1 py-2 rounded-lg bg-[#EF4444]/20 text-[#EF4444] font-medium hover:bg-[#EF4444]/30 flex items-center justify-center gap-2">
            <X className="h-4 w-4" /> Perdida
          </button>
          <button onClick={() => onEliminar(apuesta.id)} className="p-2 rounded-lg bg-[#334155] text-[#94A3B8] hover:bg-[#475569]">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className={`flex items-center justify-between py-2 px-3 rounded-lg ${isGanada ? 'bg-[#00D1B2]/20' : 'bg-[#EF4444]/20'}`}>
          <span className={`font-medium ${isGanada ? 'text-[#00D1B2]' : 'text-[#EF4444]'}`}>{isGanada ? '✓ Ganada' : '✗ Perdida'}</span>
          <span className={`font-mono font-bold ${isGanada ? 'text-[#00D1B2]' : 'text-[#EF4444]'}`}>{isGanada ? '+' : ''}${Number(apuesta.ganancia_neta || 0).toLocaleString()}</span>
        </div>
      )}
    </div>
  );
};

const Estadisticas = ({ stats }: { stats: EstadisticasUsuario }) => {
  const winRate = (stats.ganadas + stats.perdidas) > 0 ? ((stats.ganadas / (stats.ganadas + stats.perdidas)) * 100) : 0;
  return (
    <div className="rounded-2xl p-4 border border-white/10" style={{ background: 'rgba(30,41,59,0.7)' }}>
      <h3 className="text-white font-bold flex items-center gap-2 mb-4"><BarChart3 className="h-5 w-5 text-[#00D1B2]" /> Mis Estadísticas</h3>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#0F172A]/50 rounded-xl p-3 text-center">
          <p className={`text-2xl font-bold font-mono ${stats.ganancia_neta >= 0 ? 'text-[#00D1B2]' : 'text-[#EF4444]'}`}>{stats.ganancia_neta >= 0 ? '+' : ''}${Number(stats.ganancia_neta || 0).toLocaleString()}</p>
          <p className="text-xs text-[#64748B]">Ganancia Neta</p>
        </div>
        <div className="bg-[#0F172A]/50 rounded-xl p-3 text-center">
          <p className={`text-2xl font-bold font-mono ${stats.yield >= 0 ? 'text-[#00D1B2]' : 'text-[#EF4444]'}`}>{stats.yield >= 0 ? '+' : ''}{Number(stats.yield || 0).toFixed(1)}%</p>
          <p className="text-xs text-[#64748B]">Yield</p>
        </div>
        <div className="bg-[#0F172A]/50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold font-mono text-white">{winRate.toFixed(1)}%</p>
          <p className="text-xs text-[#64748B]">Win Rate</p>
        </div>
        <div className="bg-[#0F172A]/50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold font-mono"><span className="text-[#00D1B2]">{stats.ganadas}</span><span className="text-[#64748B]">/</span><span className="text-[#EF4444]">{stats.perdidas}</span></p>
          <p className="text-xs text-[#64748B]">W/L</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10">
        <div className="text-center"><p className="text-lg font-bold text-white">{stats.total_apuestas}</p><p className="text-xs text-[#64748B]">Apuestas</p></div>
        <div className="text-center"><p className="text-lg font-bold text-[#F59E0B]">{stats.pendientes}</p><p className="text-xs text-[#64748B]">Pendientes</p></div>
        <div className="text-center"><p className="text-lg font-bold text-[#FFDD57]">+{stats.mejor_racha}</p><p className="text-xs text-[#64748B]">Mejor Racha</p></div>
      </div>
    </div>
  );
};

export default function MiBancaPage() {
  const [banca, setBanca] = useState(0);
  const [apuestas, setApuestas] = useState<ApuestaUsuario[]>([]);
  const [picksDelDia, setPicksDelDia] = useState<PickRecomendado[]>([]);
  const [stats, setStats] = useState<EstadisticasUsuario>({ banca_actual: 0, ganancia_neta: 0, yield: 0, total_apuestas: 0, ganadas: 0, perdidas: 0, pendientes: 0, mejor_racha: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [filtro, setFiltro] = useState<'TODAS' | 'PENDIENTE' | 'GANADA' | 'PERDIDA'>('TODAS');
  const [mostrarTodas, setMostrarTodas] = useState(false);

  const fetchData = async () => {
    try {
      const bancaRes = await fetch(`${API_URL}/api/banca/estado`, { headers: getAuthHeaders() });
      if (bancaRes.ok) { const d = await bancaRes.json(); setBanca(d.banca_actual || 100000); }

      const statsRes = await fetch(`${API_URL}/api/banca/estadisticas`, { headers: getAuthHeaders() });
      if (statsRes.ok) { 
        const d = await statsRes.json(); 
        setStats({ banca_actual: d.banca_actual || 0, ganancia_neta: d.profit_total || 0, yield: d.yield_total || 0, total_apuestas: d.total_apuestas || 0, ganadas: d.ganadas || 0, perdidas: d.perdidas || 0, pendientes: d.pendientes || 0, mejor_racha: d.mejor_racha || 0 }); 
      }

      const apuestasRes = await fetch(`${API_URL}/api/mis-apuestas`, { headers: getAuthHeaders() });
      if (apuestasRes.ok) { const d = await apuestasRes.json(); setApuestas(d.apuestas || []); }

      const picksRes = await fetch(`${API_URL}/api/apuestas/hoy`, { headers: getAuthHeaders() });
      if (picksRes.ok) { 
        const d = await picksRes.json(); 
        setPicksDelDia((d.apuestas || []).filter((p: any) => p.resultado === 'PENDIENTE').map((p: any) => ({ id: p.id, tipster_alias: p.tipster_alias, apuesta: p.apuesta, cuota: p.cuota, tipo_mercado: p.tipo_mercado || 'General' }))); 
      }
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSaveBanca = async (n: number) => {
    try { const r = await fetch(`${API_URL}/api/banca/actualizar`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ banca_actual: n }) }); if (r.ok) setBanca(n); } catch (e) { console.error(e); }
  };

  const handleRegistrar = async (a: any) => {
    try { const r = await fetch(`${API_URL}/api/mis-apuestas`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(a) }); if (r.ok) fetchData(); } catch (e) { console.error(e); }
  };

  const handleMarcar = async (id: number, resultado: 'GANADA' | 'PERDIDA') => {
    try { const r = await fetch(`${API_URL}/api/mis-apuestas/${id}/resultado`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ resultado }) }); if (r.ok) fetchData(); } catch (e) { console.error(e); }
  };

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Eliminar?')) return;
    try { const r = await fetch(`${API_URL}/api/mis-apuestas/${id}`, { method: 'DELETE', headers: getAuthHeaders() }); if (r.ok) fetchData(); } catch (e) { console.error(e); }
  };

  const apuestasFiltradas = apuestas.filter(a => filtro === 'TODAS' || a.resultado === filtro);
  const apuestasMostradas = mostrarTodas ? apuestasFiltradas : apuestasFiltradas.slice(0, 5);

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-4 border-[#00D1B2]/30 border-t-[#00D1B2] rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-4 animate-fadeIn pb-20 lg:pb-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3"><Wallet className="h-7 w-7 text-[#00D1B2]" /> Mi Banca</h1>
        <p className="text-[#94A3B8] text-sm mt-1">Gestiona tus apuestas como inversión</p>
      </div>

      <IntroBanca />

      <div className="grid md:grid-cols-2 gap-4">
        <BancaEditable banca={banca} onSave={handleSaveBanca} />
        <div className="rounded-2xl p-6 border border-white/10 flex flex-col justify-center" style={{ background: 'rgba(30,41,59,0.7)' }}>
          <button onClick={() => setModalOpen(true)} className="w-full py-4 rounded-xl bg-[#00D1B2] text-white font-bold text-lg hover:bg-[#00B89F] flex items-center justify-center gap-2">
            <Plus className="h-6 w-6" /> Registrar Apuesta
          </button>
          <p className="text-[#64748B] text-sm text-center mt-3">{picksDelDia.length} picks pendientes hoy</p>
        </div>
      </div>

      <Estadisticas stats={stats} />

      {/* Monte Carlo Simulator — Future Banca Projection */}
      <MonteCarloSimulator />

      {picksDelDia.length > 0 && (
        <div className="rounded-2xl p-4 border border-white/10" style={{ background: 'rgba(30,41,59,0.7)' }}>
          <h3 className="text-white font-bold flex items-center gap-2 mb-3"><Flame className="h-5 w-5 text-[#FFDD57]" /> Picks del Día</h3>
          <div className="space-y-2">
            {picksDelDia.slice(0, 3).map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-[#0F172A]/50 border border-white/10">
                <div><span className="text-[#00D1B2] text-sm">{p.tipster_alias}</span><p className="text-white text-sm">{p.apuesta}</p></div>
                <p className="text-white font-mono font-bold">@{Number(p.cuota || 0).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl p-4 border border-white/10" style={{ background: 'rgba(30,41,59,0.7)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold flex items-center gap-2"><Calendar className="h-5 w-5 text-[#00D1B2]" /> Mis Apuestas</h3>
          <div className="flex gap-1">
            {(['TODAS', 'PENDIENTE', 'GANADA', 'PERDIDA'] as const).map((f) => (
              <button key={f} onClick={() => setFiltro(f)}
                className={`px-2 py-1 rounded-lg text-xs font-medium ${filtro === f ? (f === 'GANADA' ? 'bg-[#00D1B2] text-white' : f === 'PERDIDA' ? 'bg-[#EF4444] text-white' : f === 'PENDIENTE' ? 'bg-[#F59E0B] text-white' : 'bg-[#00D1B2] text-white') : 'bg-[#334155] text-[#94A3B8]'}`}>
                {f === 'TODAS' ? 'Todas' : f === 'PENDIENTE' ? '○' : f === 'GANADA' ? '✓' : '✗'}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {apuestasMostradas.length === 0 ? <p className="text-[#64748B] text-center py-4">No hay apuestas</p> :
            apuestasMostradas.map((a) => <CardApuesta key={a.id} apuesta={a} onMarcar={handleMarcar} onEliminar={handleEliminar} />)}
        </div>
        {apuestasFiltradas.length > 5 && !mostrarTodas && (
          <button onClick={() => setMostrarTodas(true)} className="w-full mt-4 py-2 text-center text-[#00D1B2] text-sm font-medium hover:underline">Ver todas ({apuestasFiltradas.length})</button>
        )}
      </div>

      <ModalRegistrarApuesta isOpen={modalOpen} onClose={() => setModalOpen(false)} onSave={handleRegistrar} banca={banca} picksDelDia={picksDelDia} />
    </div>
  );
}

