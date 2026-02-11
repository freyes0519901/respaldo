'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">📡</div>
        <h1 className="text-3xl font-bold text-white mb-4">Sin conexión</h1>
        <p className="text-gray-400 mb-8">
          Parece que no tienes conexión a internet. Verifica tu red e intenta nuevamente.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-[#00D1B2] text-white font-semibold rounded-lg hover:bg-[#00b89c] transition-colors"
        >
          🔄 Reintentar
        </button>
      </div>
    </div>
  );
}
