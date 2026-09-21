import React, { useState } from 'react';
import { X, Heart, Sparkles, Share2, Volume2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { synth } from '../audio/synthMelody';

export default function LetterModal({ 
  isOpen, 
  onClose, 
  recipientName = "Mi querida amiga", 
  senderName = "Con cariño", 
  messageText = ""
}) {
  if (!isOpen) return null;

  const defaultMessage = `Dicen que regalar flores amarillas un 21 de septiembre significa desear felicidad pura, luz, lealtad y el deseo sincero de que esa persona se quede para siempre en tu vida.

Hoy quise regalarte este ramo eterno para recordarte lo valiosa e importante que es tu amistad. Gracias por cada risa, por tu apoyo incondicional y por iluminar los días con tu sola presencia.

¡Que nunca te falten motivos para sonreír! 🌻✨`;

  const finalMessage = messageText.trim() || defaultMessage;

  const handleConfettiShower = () => {
    synth.playSparkle();
    confetti({
      particleCount: 70,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#facc15', '#eab308', '#ca8a04', '#fef08a', '#f59e0b', '#fb7185']
    });
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg parchment-card rounded-3xl p-6 md:p-8 shadow-2xl border border-amber-300/60 transform transition-all animate-in zoom-in-95 duration-200 text-slate-800 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onClose();
          }}
          className="absolute top-4 right-4 p-2.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 transition-colors shadow-sm cursor-pointer z-10"
          aria-label="Cerrar carta"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado decorativo con Girasol */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 shadow-inner mb-2 border-2 border-amber-300 animate-bounce">
            <span className="text-3xl">🌻</span>
          </div>
          <p className="text-xs uppercase tracking-widest font-semibold text-amber-700">
            21 de Septiembre • Día de las Flores Amarillas
          </p>
          <h2 className="font-caveat text-4xl md:text-5xl text-amber-900 mt-1 font-bold">
            Para ti, {recipientName}
          </h2>
        </div>

        {/* Línea decorativa dorada */}
        <div className="flex items-center justify-center gap-3 my-4">
          <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-amber-400"></div>
          <span className="text-amber-500">💛</span>
          <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-amber-400"></div>
        </div>

        {/* Cuerpo de la carta */}
        <div className="font-caveat text-xl md:text-2xl text-stone-800 leading-relaxed space-y-4 px-2 py-1 max-h-[45vh] overflow-y-auto">
          {finalMessage.split('\n\n').map((paragraph, index) => (
            <p key={index} className="whitespace-pre-line">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Firma */}
        <div className="mt-6 pt-4 border-t border-amber-200/80 flex flex-col items-end px-2">
          <span className="font-serif-elegant italic text-sm text-amber-800">
            Con todo mi cariño,
          </span>
          <span className="font-caveat text-3xl font-bold text-amber-950">
            {senderName}
          </span>
        </div>

        {/* Botones de acción */}
        <div className="mt-6 flex gap-2 justify-between items-center pt-2">
          <button
            onClick={handleConfettiShower}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-200/80 hover:bg-amber-300 text-amber-900 font-medium text-xs md:text-sm transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-700" />
            <span>¡Lluvia de magia!</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-amber-950 font-bold text-xs md:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <span>Cerrar carta 🌻</span>
          </button>
        </div>
      </div>
    </div>
  );
}
