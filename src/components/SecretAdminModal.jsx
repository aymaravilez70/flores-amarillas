import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Copy, Check, MessageCircle, Sparkles, Lock, 
  History, Trash2, Upload, Image as ImageIcon, ExternalLink,
  ChevronLeft, ChevronRight, Edit3, Camera
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { synth } from '../audio/synthMelody';
import { DEFAULT_FLOWERS } from '../data/defaultFlowers';
import { encodeToken } from '../utils/token';

export default function SecretAdminModal({
  isOpen,
  onClose,
  defaultSender = "Aymar",
  initialRecipient = "",
  initialFlowers = null,
  onSaveFriend
}) {
  if (!isOpen) return null;

  const [recipient, setRecipient] = useState(initialRecipient || "");
  const [sender, setSender] = useState(defaultSender);
  const [flowers, setFlowers] = useState(initialFlowers || DEFAULT_FLOWERS);
  const [activeFlowerIdx, setActiveFlowerIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [savedLinks, setSavedLinks] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Cargar historial desde localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('flores_secret_links_v2');
      if (stored) {
        setSavedLinks(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Actualizar una flor específica
  const updateFlower = (index, updates) => {
    setFlowers(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const [uploadError, setUploadError] = useState("");

  // Comprimir imagen en el cliente para que suba en 0.5s y no exceda límites
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Manejador de subida de fotos desde Celular o PC
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError("");

    try {
      // 1. Comprimir en el cliente a JPG de alta calidad (~150KB)
      const compressedBase64 = await compressImage(file);

      // 2. Subir a nuestro endpoint /api/upload (Vercel serverless o Vite local)
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: `foto_${Date.now()}.jpg`,
          base64: compressedBase64
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.url) {
          updateFlower(activeFlowerIdx, { foto: data.url });
          synth.playSparkle();
          setIsUploading(false);
          return;
        } else {
          setUploadError(data.error || "No se pudo subir la foto.");
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setUploadError(errData.error || `Error ${res.status}: No se pudo subir la imagen.`);
      }
    } catch (err) {
      console.error("Error al procesar foto:", err);
      setUploadError("Error de conexión al subir. Puedes pegar un enlace directo.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Generar Token en Base64 URL-Safe
  const generateLink = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const payload = {
      para: recipient.trim() || "Amiga",
      de: sender.trim() || "Aymar",
      flores: flowers.map(f => ({
        id: f.id,
        titulo: f.titulo,
        msg: f.msg,
        foto: f.foto || ""
      }))
    };

    const b64 = encodeToken(payload);
    return `${baseUrl}?v=${b64}`;
  };

  const currentUrl = generateLink();

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    synth.playSparkle();
    setTimeout(() => setCopied(false), 2500);
    saveToHistory();
  };

  const handleSendWhatsApp = () => {
    const friendName = recipient.trim() || "amiga";
    const text = `🌻 ¡Hola ${friendName}! Te envié un ramo 3D de flores amarillas con recuerdos y fotos pensados para ti por este 21 de septiembre 💛✨ Toca cada flor del ramo para descubrirlos: ${currentUrl}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    saveToHistory();
  };

  const saveToHistory = () => {
    if (!recipient.trim()) return;
    const item = {
      id: Date.now(),
      recipient: recipient.trim(),
      sender: sender.trim() || "Aymar",
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      url: currentUrl,
      flowers: flowers
    };

    const updated = [item, ...savedLinks.filter(l => l.recipient.toLowerCase() !== item.recipient.toLowerCase())].slice(0, 15);
    setSavedLinks(updated);
    try {
      localStorage.setItem('flores_secret_links_v2', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleDeleteHistoryItem = (id, e) => {
    e.stopPropagation();
    const updated = savedLinks.filter(l => l.id !== id);
    setSavedLinks(updated);
    try {
      localStorage.setItem('flores_secret_links_v2', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleSelectFromHistory = (item) => {
    setRecipient(item.recipient);
    setSender(item.sender);
    if (item.flowers) setFlowers(item.flowers);
    if (onSaveFriend) {
      onSaveFriend({
        recipient: item.recipient,
        sender: item.sender,
        flowers: item.flowers
      });
    }
  };

  const handleApplyAndClose = () => {
    if (onSaveFriend) {
      onSaveFriend({
        recipient: recipient.trim() || "Amiga",
        sender: sender.trim() || "Aymar",
        flowers
      });
    }
    saveToHistory();
    onClose();
  };

  const currentFlower = flowers[activeFlowerIdx] || DEFAULT_FLOWERS[0];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-slate-900/95 backdrop-blur-2xl rounded-3xl p-5 sm:p-7 shadow-2xl border border-amber-500/40 text-slate-100 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado Secreto */}
        <div className="flex items-center gap-3 mb-4 border-b border-slate-800 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-lg shadow-inner">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg sm:text-xl text-yellow-400 flex items-center gap-2">
              Panel Secreto del Creador
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Solo para ti
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Personaliza cada una de las 7 flores con foto y dedicatoria para tu amiga.
            </p>
          </div>
        </div>

        {/* Datos Generales (Destinatario y Remitente) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-semibold text-amber-300 uppercase tracking-wider mb-1">
              Nombre de tu amiga
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Ej: Camila, Sofia, Valentina..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-amber-500/30 bg-slate-800/80 focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm text-yellow-100 font-medium placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-amber-300 uppercase tracking-wider mb-1">
              Tu nombre / firma
            </label>
            <input
              type="text"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              placeholder="Ej: Aymar"
              className="w-full px-3.5 py-2.5 rounded-xl border border-amber-500/30 bg-slate-800/80 focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm text-yellow-100 font-medium placeholder-slate-500"
            />
          </div>
        </div>

        {/* Selector de las 7 Flores / Recuerdos */}
        <div className="mb-3">
          <label className="block text-xs font-semibold text-amber-300 uppercase tracking-wider mb-2">
            Selecciona la flor a personalizar (7 flores en el ramo):
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
            {flowers.map((fl, idx) => {
              const isActive = idx === activeFlowerIdx;
              const hasPhoto = !!fl.foto;
              return (
                <button
                  key={fl.id}
                  type="button"
                  onClick={() => setActiveFlowerIdx(idx)}
                  className={`relative p-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 border ${
                    isActive 
                      ? 'bg-amber-400 text-slate-950 border-yellow-300 shadow-[0_0_12px_rgba(251,191,36,0.4)] scale-102' 
                      : 'bg-slate-800/80 text-amber-200/80 border-slate-700/80 hover:bg-slate-700/80'
                  }`}
                >
                  <span className="text-base">{idx === 2 ? '👑' : '🌻'}</span>
                  <span className="text-[10px]">Flor {idx + 1}</span>
                  {hasPhoto && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 shadow-xs" title="Tiene foto" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tarjeta de Edición de la Flor Activa */}
        <div className="p-4 rounded-2xl bg-slate-800/70 border border-amber-500/30 space-y-3.5 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>🌻 Editando Flor {activeFlowerIdx + 1} de 7</span>
              {activeFlowerIdx === 2 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-yellow-300 border border-amber-400/30">
                  Principal
                </span>
              )}
            </span>
            <span className="text-[11px] text-slate-400">
              Se abre al tocar esta flor en 3D
            </span>
          </div>

          {/* Título de la flor */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
              Título del recuerdo
            </label>
            <input
              type="text"
              value={currentFlower.titulo}
              onChange={(e) => updateFlower(activeFlowerIdx, { titulo: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700 focus:border-amber-400 focus:outline-none text-xs text-amber-100 font-medium"
            />
          </div>

          {/* Mensaje de la flor */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
              Mensaje dedicatoria
            </label>
            <textarea
              rows={2}
              value={currentFlower.msg}
              onChange={(e) => updateFlower(activeFlowerIdx, { msg: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700 focus:border-amber-400 focus:outline-none text-xs text-slate-200 leading-relaxed font-sans"
            />
          </div>

          {/* Foto: Subida desde Celular/PC o URL */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1.5 flex items-center justify-between">
              <span>Foto de esta flor</span>
              <span className="text-[10px] text-slate-400 font-normal">Opcional (si no pones foto, saldrá un lindo girasol)</span>
            </label>

            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              {/* Input oculto de archivos */}
              <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*" 
                onChange={handleFileUpload} 
                className="hidden" 
              />

              {/* Botón de subida desde PC/Celular */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 text-xs font-semibold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                <span>{isUploading ? 'Subiendo foto...' : 'Subir foto desde Teléfono / PC'}</span>
              </button>

              {/* O pegar URL */}
              <div className="flex-1 w-full">
                <input
                  type="text"
                  value={currentFlower.foto || ''}
                  onChange={(e) => updateFlower(activeFlowerIdx, { foto: e.target.value })}
                  placeholder="O pegar URL de imagen..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700 focus:border-amber-400 focus:outline-none text-xs text-slate-300 font-mono"
                />
              </div>

              {/* Vista previa miniatura */}
              {currentFlower.foto && (
                <div className="relative group w-12 h-12 shrink-0 rounded-lg overflow-hidden border border-amber-400/50">
                  <img 
                    src={currentFlower.foto} 
                    alt="Vista previa" 
                    className="w-full h-full object-cover" 
                  />
                  <button
                    type="button"
                    onClick={() => updateFlower(activeFlowerIdx, { foto: "" })}
                    className="absolute inset-0 bg-red-600/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                    title="Eliminar foto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {uploadError && (
              <p className="text-[11px] text-rose-400 mt-1 font-medium">⚠️ {uploadError}</p>
            )}
          </div>
        </div>

        {/* Generador de Enlace Exclusivo con Token Cifrado */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-yellow-400">
              Enlace exclusivo para {recipient.trim() || "tu amiga"}:
            </span>
            <span className="text-[10px] text-slate-400">
              Token individual con fotos
            </span>
          </div>

          <div className="text-[11px] font-mono p-2 rounded-lg bg-slate-950/70 text-slate-400 truncate border border-slate-800">
            {currentUrl}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-amber-400/40 text-xs font-bold text-yellow-300 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">¡Enlace Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-yellow-400" />
                  <span>Copiar Enlace Exclusivo</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Enviar por WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Historial de amigas generadas */}
        {savedLinks.length > 0 && (
          <div className="pt-1 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-yellow-400" />
                Amigas guardadas recientemente:
              </span>
              <span className="text-[10px] text-slate-500">Toca para cargar</span>
            </div>
            <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
              {savedLinks.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectFromHistory(item)}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 cursor-pointer text-xs transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-yellow-400 font-bold">{item.recipient}</span>
                    <span className="text-slate-500 text-[10px]">({item.date})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(item.url);
                        synth.playSparkle();
                      }}
                      className="p-1 text-slate-400 hover:text-yellow-300"
                      title="Copiar link"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                      className="p-1 text-slate-500 hover:text-rose-400"
                      title="Eliminar de historial"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botón cerrar / previsualizar */}
        <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleApplyAndClose}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <span>Guardar y Probar en el Ramo 3D 🌻</span>
          </button>
        </div>
      </div>
    </div>
  );
}
