import React, { useState } from 'react';
import { X, Sparkles, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { synth } from '../audio/synthMelody';

export default function FlowerMemoryModal({
  isOpen,
  onClose,
  flowerData,
  recipientName = "Amiga",
  senderName = "Aymar",
  currentIndex = 0,
  totalFlowers = 7,
  discoveredFlowers = [],
  onSelectFlower
}) {
  const [zoomPhoto, setZoomPhoto] = useState(false);

  if (!isOpen || !flowerData) return null;

  const handleConfetti = () => {
    synth.playSparkle();
    confetti({
      particleCount: 65,
      spread: 75,
      origin: { y: 0.55 },
      colors: ['#ffd700', '#facc15', '#fbbf24', '#f59e0b', '#fb7185']
    });
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    const prev = (currentIndex - 1 + totalFlowers) % totalFlowers;
    if (onSelectFlower) onSelectFlower(prev);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    const next = (currentIndex + 1) % totalFlowers;
    if (onSelectFlower) onSelectFlower(next);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer select-none"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-sm sm:max-w-md bg-gradient-to-b from-[#fffef7] via-[#fffdf2] to-[#fef8e2] rounded-3xl p-4 sm:p-5 shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-amber-300/80 text-slate-800 cursor-default animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-3.5 right-3.5 p-2 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 transition-colors shadow-sm cursor-pointer z-20"
          aria-label="Cerrar recuerdo"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Encabezado con número de flor */}
        <div className="text-center pt-1 pb-1.5 shrink-0 pr-8 pl-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-100/90 border border-amber-300/60 shadow-xs mb-1">
            <span className="text-sm">🌻</span>
            <span className="text-[11px] uppercase font-bold tracking-wider text-amber-800">
              Recuerdo {currentIndex + 1} de {totalFlowers}
            </span>
          </div>
          <h3 className="font-caveat text-2xl sm:text-3xl font-bold text-amber-950 px-1 leading-tight">
            {flowerData.titulo || `Flor ${currentIndex + 1}`}
          </h3>
        </div>

        {/* Sección de la Foto / Ilustración con altura controlada */}
        <div className="my-2 w-full shrink-0">
          {flowerData.foto ? (
            <div 
              className="relative w-full h-44 sm:h-56 p-1.5 bg-white rounded-2xl shadow-md border border-amber-200/90 overflow-hidden cursor-pointer group"
              onClick={() => setZoomPhoto(true)}
              title="Toca para ampliar la foto"
            >
              <img 
                src={flowerData.foto} 
                alt={flowerData.titulo} 
                className="w-full h-full object-cover rounded-xl transition-transform duration-300 group-hover:scale-102"
              />
              <div className="absolute bottom-2.5 right-2.5 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium flex items-center gap-1 shadow-sm opacity-90 group-hover:opacity-100 transition-opacity">
                <Maximize2 className="w-3 h-3" />
                <span>Ampliar</span>
              </div>
            </div>
          ) : (
            <div className="w-full h-32 sm:h-40 rounded-2xl bg-gradient-to-tr from-amber-100/70 via-yellow-50 to-amber-200/50 border border-amber-200/70 flex flex-col items-center justify-center p-3 text-center shadow-inner">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 flex items-center justify-center shadow-md mb-1.5 border-2 border-white animate-pulse">
                <span className="text-2xl sm:text-3xl">🌻</span>
              </div>
              <p className="text-xs font-serif-elegant italic text-amber-800">
                21 de Septiembre • Día de las Flores Amarillas
              </p>
              <span className="text-[10px] text-amber-600/80 mt-0.5">
                Un detalle para iluminar tu día
              </span>
            </div>
          )}
        </div>

        {/* Mensaje de la flor SIEMPRE VISIBLE en contenedor pergamino */}
        <div className="my-1.5 px-3 py-2.5 rounded-2xl bg-amber-50/70 border border-amber-200/60 shadow-xs shrink-0">
          <p className="font-caveat text-xl sm:text-2xl text-stone-900 leading-snug text-center">
            "{flowerData.msg}"
          </p>
        </div>

        {/* Firma */}
        <div className="flex items-center justify-between border-t border-amber-200/80 pt-2 px-1 text-xs shrink-0 mt-1">
          <span className="font-caveat text-base text-amber-900 font-semibold">
            Para ti, {recipientName} 💛
          </span>
          <span className="font-caveat text-base text-amber-950 font-bold">
            De: {senderName}
          </span>
        </div>

        {/* Navegación y botones interactivos */}
        <div className="mt-2.5 pt-2 border-t border-amber-100 flex items-center justify-between gap-2 shrink-0">
          {/* Botón flor anterior */}
          <button
            type="button"
            onClick={handlePrev}
            className="p-2 rounded-xl bg-amber-100/80 hover:bg-amber-200 text-amber-900 transition-colors shadow-xs active:scale-95 cursor-pointer"
            title="Flor anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Selector de bolitas / estado de 7 flores */}
          <div className="flex items-center gap-1.5 px-1">
            {Array.from({ length: totalFlowers }).map((_, idx) => {
              const isDiscovered = discoveredFlowers.includes(idx);
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectFlower && onSelectFlower(idx)}
                  className={`transition-all rounded-full cursor-pointer ${
                    isCurrent 
                      ? 'w-6 h-3 bg-amber-500 shadow-sm' 
                      : isDiscovered 
                        ? 'w-2.5 h-2.5 bg-amber-400' 
                        : 'w-2.5 h-2.5 bg-amber-200 hover:bg-amber-300'
                  }`}
                  title={`Ir a Flor ${idx + 1}`}
                />
              );
            })}
          </div>

          {/* Botón magia confeti */}
          <button
            type="button"
            onClick={handleConfetti}
            className="p-2 rounded-xl bg-amber-200/90 hover:bg-amber-300 text-amber-950 transition-all shadow-xs active:scale-95 cursor-pointer"
            title="Lluvia de magia"
          >
            <Sparkles className="w-4 h-4 text-amber-800" />
          </button>

          {/* Botón flor siguiente */}
          <button
            type="button"
            onClick={handleNext}
            className="p-2 rounded-xl bg-amber-100/80 hover:bg-amber-200 text-amber-900 transition-colors shadow-xs active:scale-95 cursor-pointer"
            title="Flor siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modal de foto en pantalla completa */}
      {zoomPhoto && flowerData.foto && (
        <div 
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-200"
          onClick={() => setZoomPhoto(false)}
        >
          <img 
            src={flowerData.foto} 
            alt={flowerData.titulo} 
            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border-2 border-amber-400/40"
          />
          <button
            onClick={() => setZoomPhoto(false)}
            className="absolute top-4 right-4 p-3 rounded-full bg-slate-800/80 text-white hover:bg-slate-700 cursor-pointer"
            title="Cerrar vista completa"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}
