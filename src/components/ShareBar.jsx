import React, { useState } from 'react';
import { Mail, Music, VolumeX, Lock } from 'lucide-react';

export default function ShareBar({
  onOpenLetter,
  isPlayingMusic,
  onToggleMusic,
  isAdmin = false,
  onOpenAdmin
}) {
  const [clickCount, setClickCount] = useState(0);

  // Truco secreto: hacer 5 clics rápidos en el botón de música activa el modo creador
  const handleMusicClick = () => {
    onToggleMusic();
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount >= 5 && onOpenAdmin) {
      onOpenAdmin();
      setClickCount(0);
    }
    setTimeout(() => setClickCount(0), 3000);
  };

  return (
    <header className="fixed top-3 right-3 md:top-4 md:right-4 z-30 flex items-center gap-2 pointer-events-auto select-none">
      {/* Botón de Modo Creador (Solo visible si está en modo admin) */}
      {isAdmin && (
        <button
          onClick={onOpenAdmin}
          className="px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold text-amber-950 bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 border border-amber-300 transition-all shadow-[0_0_15px_rgba(245,158,11,0.5)] active:scale-95 cursor-pointer animate-pulse"
          title="Panel Secreto del Creador"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Panel Creador</span>
        </button>
      )}

      {/* Botón Abrir Carta Dedicatoria */}
      <button
        onClick={onOpenLetter}
        className="px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-semibold text-amber-200 bg-slate-950/70 hover:bg-slate-900/90 backdrop-blur-xl border border-amber-400/30 transition-all shadow-md active:scale-95 cursor-pointer"
        title="Leer dedicatoria"
      >
        <Mail className="w-4 h-4 text-amber-400" />
        <span className="hidden sm:inline">Ver Dedicatoria</span>
      </button>

      {/* Botón Música */}
      <button
        onClick={handleMusicClick}
        className={`p-2 rounded-full transition-all shadow-md active:scale-95 backdrop-blur-xl border cursor-pointer ${
          isPlayingMusic 
            ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.4)]' 
            : 'bg-slate-950/70 text-amber-200/80 border-amber-400/30 hover:bg-slate-900/90'
        }`}
        title={isPlayingMusic ? "Pausar melodía" : "Reproducir música (Flores Amarillas)"}
      >
        {isPlayingMusic ? (
          <Music className="w-4 h-4 text-slate-950 animate-bounce" />
        ) : (
          <VolumeX className="w-4 h-4 text-amber-300/60" />
        )}
      </button>
    </header>
  );
}
