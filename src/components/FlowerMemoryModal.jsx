import React, { useState } from 'react';
import { X, Sparkles, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
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
    setZoomPhoto(false);
    const prev = (currentIndex - 1 + totalFlowers) % totalFlowers;
    if (onSelectFlower) onSelectFlower(prev);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setZoomPhoto(false);
    const next = (currentIndex + 1) % totalFlowers;
    if (onSelectFlower) onSelectFlower(next);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer select-none"
      onClick={() => {
        setZoomPhoto(false);
        onClose();
      }}
    >
      {/* Tarjeta Principal del Recuerdo */}
      <div 
        className="relative w-full max-w-sm sm:max-w-md bg-gradient-to-b from-[#fffef7] via-[#fffdf2] to-[#fef8e2] rounded-3xl p-4 sm:p-5 shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-amber-300/80 text-slate-800 cursor-default animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar modal */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setZoomPhoto(false);
            onClose();
          }}
          className="absolute top-3.5 right-3.5 p-2 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 transition-colors shadow-sm cursor-pointer z-20"
          aria-label="Cerrar recuerdo"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Encabezado con número de flor */}
        <div className="text-center pt-0.5 pb-1 shrink-0 pr-8 pl-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-100/90 border border-amber-300/60 shadow-xs mb-1">
            <span className="text-sm">🌻</span>
            <span className="text-[11px] uppercase font-bold tracking-wider text-amber-800">
              Recuerdo {currentIndex + 1} de {totalFlowers} {currentIndex === 2 ? '👑 Principal' : ''}
            </span>
          </div>
          <h3 className="font-caveat text-2xl sm:text-3xl font-bold text-amber-950 px-1 leading-tight">
            {flowerData.titulo || `Flor ${currentIndex + 1}`}
          </h3>
        </div>

        {/* Sección de la Foto / Ilustración con altura optimizada para móviles */}
        <div className="my-1.5 w-full shrink-0">
          {flowerData.foto ? (
            <div 
              className="relative w-full h-36 sm:h-48 p-1.5 bg-white rounded-2xl shadow-md border border-amber-200/90 overflow-hidden cursor-pointer group"
              onClick={(e) => {
                e.stopPropagation();
                setZoomPhoto(true);
              }}
              title="Toca para ampliar foto"
            >
              <img 
                src={flowerData.foto} 
                alt={flowerData.titulo} 
                className="w-full h-full object-cover rounded-xl transition-transform duration-300 group-hover:scale-102"
              />
              <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium flex items-center gap-1 shadow-sm opacity-90 group-hover:opacity-100 transition-opacity">
                <Maximize2 className="w-3 h-3" />
                <span>Ampliar</span>
              </div>
            </div>
          ) : (
            <div className="w-full h-28 sm:h-36 rounded-2xl bg-gradient-to-tr from-amber-100/70 via-yellow-50 to-amber-200/50 border border-amber-200/70 flex flex-col items-center justify-center p-3 text-center shadow-inner">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 flex items-center justify-center shadow-md mb-1 border-2 border-white animate-pulse">
                <span className="text-xl sm:text-2xl">🌻</span>
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
        <div className="my-1 px-3 py-2 sm:py-2.5 rounded-2xl bg-amber-50/80 border border-amber-200/70 shadow-xs shrink-0">
          <p className="font-caveat text-xl sm:text-2xl text-stone-900 leading-snug text-center">
            "{flowerData.msg}"
          </p>
        </div>

        {/* Firma */}
        <div className="flex items-center justify-between border-t border-amber-200/80 pt-1.5 px-1 text-xs shrink-0 mt-0.5">
          <span className="font-caveat text-base text-amber-900 font-semibold">
            Para ti, {recipientName} 💛
          </span>
          <span className="font-caveat text-base text-amber-950 font-bold">
            De: {senderName}
          </span>
        </div>

        {/* Navegación y botones interactivos */}
        <div className="mt-2 pt-2 border-t border-amber-100 flex items-center justify-between gap-2 shrink-0">
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
                  onClick={() => {
                    setZoomPhoto(false);
                    if (onSelectFlower) onSelectFlower(idx);
                  }}
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

      {/* Modal de foto ampliada con dedicatoria completa y botón de minimizar */}
      {zoomPhoto && flowerData.foto && (
        <div 
          className="fixed inset-0 z-60 bg-black/92 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-5 animate-in fade-in duration-200 select-none cursor-default"
          onClick={(e) => {
            e.stopPropagation();
            setZoomPhoto(false);
          }}
        >
          {/* Barra superior con título y botón de Minimizar */}
          <div 
            className="w-full max-w-lg flex items-center justify-between py-2 px-1 text-white shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">🌻</span>
              <span className="font-caveat text-xl sm:text-2xl font-bold text-amber-300">
                {flowerData.titulo || `Flor ${currentIndex + 1}`}
              </span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setZoomPhoto(false);
              }}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-md transition-all shadow-md active:scale-95 cursor-pointer border border-white/30"
              title="Volver a la tarjeta"
            >
              <Minimize2 className="w-3.5 h-3.5 text-amber-300" />
              <span>Minimizar</span>
            </button>
          </div>

          {/* Imagen ampliada */}
          <div 
            className="flex-1 flex items-center justify-center my-2 max-w-lg w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={flowerData.foto} 
              alt={flowerData.titulo} 
              className="max-w-full max-h-[50vh] sm:max-h-[58vh] object-contain rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.8)] border-2 border-amber-400/50"
            />
          </div>

          {/* Tarjeta inferior con el Mensaje Dedicatoria */}
          <div 
            className="w-full max-w-lg bg-slate-900/90 border border-amber-400/40 rounded-2xl p-3 sm:p-4 text-center shadow-xl backdrop-blur-lg shrink-0 mb-1"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-caveat text-lg sm:text-2xl text-amber-100 leading-snug">
              "{flowerData.msg}"
            </p>
            <div className="flex items-center justify-between border-t border-amber-400/20 pt-2 mt-2 text-xs">
              <span className="font-caveat text-base text-amber-300 font-semibold">
                Para ti, {recipientName} 💛
              </span>
              <span className="font-caveat text-base text-amber-400 font-bold">
                De: {senderName}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
