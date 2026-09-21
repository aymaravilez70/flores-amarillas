import React, { useState, useEffect } from 'react';
import FlowerScene3D from './components/FlowerScene3D';
import LetterModal from './components/LetterModal';
import FlowerMemoryModal from './components/FlowerMemoryModal';
import SecretAdminModal from './components/SecretAdminModal';
import ShareBar from './components/ShareBar';
import confetti from 'canvas-confetti';
import { synth } from './audio/synthMelody';
import { DEFAULT_FLOWERS } from './data/defaultFlowers';
import { decodeToken } from './utils/token';

export default function App() {
  const [recipientName, setRecipientName] = useState("Amiga");
  const [senderName, setSenderName] = useState("Aymar");
  const [flowers, setFlowers] = useState(DEFAULT_FLOWERS);
  const [selectedFlowerIdx, setSelectedFlowerIdx] = useState(0);
  const [isFlowerMemoryOpen, setIsFlowerMemoryOpen] = useState(false);
  const [isLetterOpen, setIsLetterOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBlooming, setIsBlooming] = useState(true);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [discoveredFlowers, setDiscoveredFlowers] = useState([]);

  // 1. Leer parámetros de la URL al cargar
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Modo Secreto de Administrador / Creador (?admin=true o ?admin o ?crear)
    const hasAdminFlag = params.has('admin') || params.has('crear') || params.has('secreto');
    if (hasAdminFlag) {
      setIsAdmin(true);
      setIsAdminOpen(true);
    }

    // Token cifrado individual (?v=...)
    const token = params.get('v');
    if (token) {
      const data = decodeToken(token);
      if (data) {
        if (data.para) setRecipientName(data.para);
        if (data.de) setSenderName(data.de);
        if (data.flores && Array.isArray(data.flores)) {
          const merged = DEFAULT_FLOWERS.map((def, idx) => {
            const found = data.flores.find(f => f.id === idx) || data.flores[idx];
            return found ? { ...def, ...found } : def;
          });
          setFlowers(merged);
        } else if (data.msg) {
          setFlowers(prev => prev.map((f, i) => i === 2 ? { ...f, msg: data.msg } : f));
        }
      }
    } else {
      // Parámetros directos tradicionales como respaldo (?para=...&de=...)
      const pRecipient = params.get('para');
      const pSender = params.get('de');
      if (pRecipient) setRecipientName(pRecipient);
      if (pSender) setSenderName(pSender);
    }

    // Bienvenida con confeti dorado suave
    const timer = setTimeout(() => {
      confetti({
        particleCount: 55,
        spread: 90,
        origin: { y: 0.4 },
        colors: ['#ffd700', '#facc15', '#fbbf24', '#fef08a']
      });
    }, 700);

    return () => clearTimeout(timer);
  }, []);

  // 2. Iniciar melodía automáticamente con respaldo de primer gesto
  useEffect(() => {
    try {
      synth.start();
      setIsPlayingMusic(true);
    } catch (e) {
      console.log("Autoplay en espera");
    }

    const startAudioOnFirstTouch = () => {
      synth.start();
      setIsPlayingMusic(true);
      window.removeEventListener('pointerdown', startAudioOnFirstTouch);
      window.removeEventListener('touchstart', startAudioOnFirstTouch);
      window.removeEventListener('click', startAudioOnFirstTouch);
      window.removeEventListener('keydown', startAudioOnFirstTouch);
    };

    window.addEventListener('pointerdown', startAudioOnFirstTouch, { once: true });
    window.addEventListener('touchstart', startAudioOnFirstTouch, { once: true });
    window.addEventListener('click', startAudioOnFirstTouch, { once: true });
    window.addEventListener('keydown', startAudioOnFirstTouch, { once: true });

    return () => {
      window.removeEventListener('pointerdown', startAudioOnFirstTouch);
      window.removeEventListener('touchstart', startAudioOnFirstTouch);
      window.removeEventListener('click', startAudioOnFirstTouch);
      window.removeEventListener('keydown', startAudioOnFirstTouch);
    };
  }, []);

  // Atajo de teclado secreto: pulsar 'a' tres veces seguidas activa el panel de creador
  useEffect(() => {
    let keyPresses = 0;
    let keyTimer = null;

    const handleKeyDown = (e) => {
      if (e.key === 'a' || e.key === 'A') {
        keyPresses++;
        clearTimeout(keyTimer);
        if (keyPresses >= 3) {
          setIsAdmin(true);
          setIsAdminOpen(true);
          keyPresses = 0;
        } else {
          keyTimer = setTimeout(() => {
            keyPresses = 0;
          }, 1200);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(keyTimer);
    };
  }, []);

  const handleToggleMusic = () => {
    const playing = synth.toggle();
    setIsPlayingMusic(playing);
  };

  // Al hacer clic en cualquier flor 3D del ramo: abre el recuerdo de esa flor específica
  const handleFlowerClick = (flowerIndex) => {
    if (!isLetterOpen && !isFlowerMemoryOpen && !isAdminOpen) {
      const idx = Math.max(0, Math.min(6, flowerIndex));
      setSelectedFlowerIdx(idx);
      setDiscoveredFlowers(prev => prev.includes(idx) ? prev : [...prev, idx]);
      setIsFlowerMemoryOpen(true);
    }
  };

  const handleSelectFlowerFromModal = (newIdx) => {
    setSelectedFlowerIdx(newIdx);
    setDiscoveredFlowers(prev => prev.includes(newIdx) ? prev : [...prev, newIdx]);
  };

  const handleSaveFriendFromAdmin = ({ recipient, sender, flowers: newFlowers }) => {
    if (recipient) setRecipientName(recipient);
    if (sender) setSenderName(sender);
    if (newFlowers) setFlowers(newFlowers);
  };

  const isAnyModalOpen = isLetterOpen || isFlowerMemoryOpen || isAdminOpen;

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-gradient-to-b from-[#1c0f32] via-[#0f071d] to-[#080310]">
      {/* Resplandor áureo central detrás de las flores */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_45%,rgba(245,158,11,0.18)_0%,transparent_65%)]" />

      {/* Barra superior de controles discretos */}
      <ShareBar
        onOpenLetter={() => {
          synth.playSparkle();
          setIsLetterOpen(true);
        }}
        isPlayingMusic={isPlayingMusic}
        onToggleMusic={handleToggleMusic}
        isAdmin={isAdmin}
        onOpenAdmin={() => {
          setIsAdmin(true);
          setIsAdminOpen(true);
        }}
      />

      {/* Escena 3D interactiva con Three.js */}
      <FlowerScene3D
        onFlowerClick={handleFlowerClick}
        isBlooming={isBlooming}
        setIsBlooming={setIsBlooming}
        recipientName={recipientName}
        isModalOpen={isAnyModalOpen}
      />

      {/* Modal de Recuerdo Individual de la Flor (Foto + Dedicatoria de esa flor) */}
      <FlowerMemoryModal
        isOpen={isFlowerMemoryOpen}
        onClose={() => setIsFlowerMemoryOpen(false)}
        flowerData={flowers[selectedFlowerIdx] || DEFAULT_FLOWERS[0]}
        recipientName={recipientName}
        senderName={senderName}
        currentIndex={selectedFlowerIdx}
        totalFlowers={7}
        discoveredFlowers={discoveredFlowers}
        onSelectFlower={handleSelectFlowerFromModal}
      />

      {/* Modal de Carta / Dedicatoria General */}
      <LetterModal
        isOpen={isLetterOpen}
        onClose={() => setIsLetterOpen(false)}
        recipientName={recipientName}
        senderName={senderName}
        messageText={flowers[2]?.msg || ""}
      />

      {/* Panel Secreto de Creador (Solo accesible mediante ?admin=true, 5 clics en música o tecla 'a'x3) */}
      <SecretAdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        defaultSender={senderName}
        initialRecipient={recipientName}
        initialFlowers={flowers}
        onSaveFriend={handleSaveFriendFromAdmin}
      />
    </div>
  );
}
