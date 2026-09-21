import React, { useState } from 'react';
import { X, Copy, Check, MessageCircle, Sparkles, Send } from 'lucide-react';
import confetti from 'canvas-confetti';
import { synth } from '../audio/synthMelody';

const PRESET_MESSAGES = [
  {
    title: "🌻 Amistad Eterna y Luz",
    text: `Dicen que regalar flores amarillas un 21 de septiembre significa desear felicidad pura, luz, lealtad y el deseo sincero de que esa persona se quede para siempre en tu vida.

Hoy quise regalarte este ramo eterno para recordarte lo valiosa e importante que es tu amistad. Gracias por cada risa, por tu apoyo incondicional y por iluminar los días con tu sola presencia.

¡Que nunca te falten motivos para sonreír! 🌻✨`
  },
  {
    title: "💛 Amiga Incondicional",
    text: `Tener una amiga como tú es de los regalos más hermosos que me ha dado la vida. 

En este 21 de septiembre, recibe estas flores amarillas como un abrazo sincero que cruza cualquier distancia. Que este nuevo ciclo te llene de paz, proyectos cumplidos y momentos inolvidables.

¡Te quiero un montón! 💛`
  },
  {
    title: "✨ Éxito y Alegría",
    text: `¡Feliz 21 de septiembre! 🌼

Las flores amarillas simbolizan energía positiva, optimismo y comienzos brillantes. Que tu camino siga brillando con esa luz única que tienes. 

¡Nunca dejes de brillar ni de soñar en grande! 💫`
  }
];

export default function CustomizerModal({
  isOpen,
  onClose,
  currentRecipient,
  currentSender,
  currentMessage,
  onSave
}) {
  if (!isOpen) return null;

  const [recipient, setRecipient] = useState(currentRecipient || "");
  const [sender, setSender] = useState(currentSender || "");
  const [message, setMessage] = useState(currentMessage || PRESET_MESSAGES[0].text);
  const [copied, setCopied] = useState(false);

  // Generar URL personalizada para compartir
  const getShareableUrl = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();
    if (recipient.trim()) params.set('para', recipient.trim());
    if (sender.trim()) params.set('de', sender.trim());
    if (message.trim() && message !== PRESET_MESSAGES[0].text) {
      params.set('msg', encodeURIComponent(message.trim()));
    }
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  };

  const handleCopyLink = () => {
    const url = getShareableUrl();
    navigator.clipboard.writeText(url);
    setCopied(true);
    synth.playSparkle();
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const url = getShareableUrl();
    const text = `🌻 ¡Hola ${recipient || 'amiga'}! Te envié un ramo 3D de flores amarillas con una dedicatoria especial por este 21 de septiembre 💛✨ Ábrelo aquí: ${url}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleApply = () => {
    onSave({
      recipient: recipient.trim() || "Amiga",
      sender: sender.trim() || "Con cariño",
      message: message.trim()
    });
    synth.playSparkle();
    confetti({
      particleCount: 50,
      spread: 70,
      colors: ['#ffd700', '#facc15', '#f59e0b']
    });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl border border-amber-200 text-slate-800 max-h-[90vh] overflow-y-auto cursor-default"
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
          className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-xl shadow-inner">
            ✍️
          </div>
          <div>
            <h3 className="font-bold text-xl text-slate-900">Personalizar para tu amiga</h3>
            <p className="text-xs text-slate-500">Crea una dedicatoria única y compártesela</p>
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                ¿Para quién es? (Nombre de tu amiga)
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Ej: Sofia, Camila, Mi mejor amiga..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 bg-amber-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                ¿De parte de quién? (Tu nombre)
              </label>
              <input
                type="text"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                placeholder="Ej: Aymar"
                className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 bg-amber-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm font-medium"
              />
            </div>
          </div>

          {/* Plantillas rápidas */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Plantillas de mensaje
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_MESSAGES.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setMessage(preset.text)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-100/70 hover:bg-amber-200 text-amber-900 transition-colors border border-amber-300/60"
                >
                  {preset.title}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea del mensaje */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Mensaje en la carta
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe aquí tu dedicatoria especial..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 bg-amber-50/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm leading-relaxed"
            />
          </div>

          {/* Compartir directo */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-2">
            <div className="text-xs font-semibold text-amber-900 flex items-center justify-between">
              <span>Enlace mágico listo para enviar:</span>
              <span className="text-[10px] text-amber-700 font-normal">Se abre con su nombre</span>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleCopyLink}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white hover:bg-amber-100/60 border border-amber-300 text-xs font-semibold text-amber-950 transition-all shadow-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">¡Enlace copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-amber-700" />
                    <span>Copiar Enlace</span>
                  </>
                )}
              </button>

              <button
                onClick={handleWhatsAppShare}
                className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-all shadow-sm active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar a WhatsApp</span>
              </button>
            </div>
          </div>
        </div>

        {/* Botón Aplicar */}
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-amber-950 font-bold text-xs md:text-sm shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Guardar y Ver Ramo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
