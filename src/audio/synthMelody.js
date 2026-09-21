// Web Audio API Synthesizer - Melodía "Flores Amarillas" (Floricienta)
// Diseñado como una cajita de música mágica / celesta / piano suave para 21 de Septiembre

class MelodySynthesizer {
  constructor() {
    this.audioCtx = null;
    this.isPlaying = false;
    this.currentTimeout = null;
    this.volume = 0.25;
    this.masterGain = null;

    // Frecuencias de notas (en Hz)
    this.N = {
      C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
      C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
      C6: 1046.50, D6: 1174.66, E6: 1318.51, G6: 1567.98,
      REST: 0
    };

    // Melodía icónica de Flores Amarillas (Floricienta)
    // "Ella sabía que él sabía, que algún día pasaría, que vendría a buscarla con flores amarillas..."
    this.melody = [
      // Ella sabía (G4 E5 D5 C5)
      { note: 'G4', dur: 0.35 }, { note: 'E5', dur: 0.45 }, { note: 'D5', dur: 0.35 }, { note: 'C5', dur: 0.5 },
      { note: 'REST', dur: 0.15 },
      // que él sabía (C5 D5 E5 D5)
      { note: 'C5', dur: 0.35 }, { note: 'D5', dur: 0.35 }, { note: 'E5', dur: 0.45 }, { note: 'D5', dur: 0.6 },
      { note: 'REST', dur: 0.2 },

      // que algún día pasaría (G4 E5 D5 C5 B4 C5 D5)
      { note: 'G4', dur: 0.35 }, { note: 'E5', dur: 0.4 }, { note: 'D5', dur: 0.35 }, { note: 'C5', dur: 0.4 },
      { note: 'B4', dur: 0.35 }, { note: 'C5', dur: 0.35 }, { note: 'D5', dur: 0.7 },
      { note: 'REST', dur: 0.25 },

      // que vendría a buscarla (G4 C5 D5 E5 E5)
      { note: 'G4', dur: 0.35 }, { note: 'C5', dur: 0.35 }, { note: 'D5', dur: 0.35 }, { note: 'E5', dur: 0.45 }, { note: 'E5', dur: 0.45 },
      // con flores amarillas (F5 E5 D5 C5 D5 C5)
      { note: 'F5', dur: 0.35 }, { note: 'E5', dur: 0.35 }, { note: 'D5', dur: 0.35 }, { note: 'C5', dur: 0.45 },
      { note: 'D5', dur: 0.5 }, { note: 'C5', dur: 0.9 },
      { note: 'REST', dur: 0.4 },

      // No te apures, no detengas (C5 C5 C5 D5 E5 D5 C5)
      { note: 'C5', dur: 0.35 }, { note: 'C5', dur: 0.35 }, { note: 'C5', dur: 0.35 }, { note: 'D5', dur: 0.4 },
      { note: 'E5', dur: 0.5 }, { note: 'D5', dur: 0.35 }, { note: 'C5', dur: 0.5 },
      { note: 'REST', dur: 0.2 },

      // el instante del encuentro (A4 C5 D5 E5 D5)
      { note: 'A4', dur: 0.35 }, { note: 'C5', dur: 0.35 }, { note: 'D5', dur: 0.4 }, { note: 'E5', dur: 0.5 }, { note: 'D5', dur: 0.7 },
      { note: 'REST', dur: 0.25 },

      // Está dicho que es un hecho (E5 E5 E5 F5 G5 F5 E5)
      { note: 'E5', dur: 0.35 }, { note: 'E5', dur: 0.35 }, { note: 'E5', dur: 0.35 }, { note: 'F5', dur: 0.4 },
      { note: 'G5', dur: 0.5 }, { note: 'F5', dur: 0.35 }, { note: 'E5', dur: 0.5 },
      { note: 'REST', dur: 0.2 },

      // no la pierdas, no hay derecho (D5 D5 D5 E5 F5 E5 D5)
      { note: 'D5', dur: 0.35 }, { note: 'D5', dur: 0.35 }, { note: 'D5', dur: 0.35 }, { note: 'E5', dur: 0.4 },
      { note: 'F5', dur: 0.5 }, { note: 'E5', dur: 0.35 }, { note: 'D5', dur: 0.5 },
      { note: 'REST', dur: 0.2 },

      // no te olvides que la vida casi nunca está dormida (E5 D5 C5 D5 C5)
      { note: 'E5', dur: 0.4 }, { note: 'D5', dur: 0.35 }, { note: 'C5', dur: 0.45 },
      { note: 'D5', dur: 0.5 }, { note: 'C5', dur: 1.2 },
      { note: 'REST', dur: 0.8 }
    ];
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
      this.masterGain.connect(this.audioCtx.destination);
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Toca una nota con textura de campanita / cajita de música
  playBellNote(freq, duration) {
    if (!this.audioCtx || freq <= 0) return;

    const t = this.audioCtx.currentTime;
    
    // Oscilador principal (fundamental dulce)
    const osc1 = this.audioCtx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, t);

    // Oscilador secundario (armónico de campana/celesta)
    const osc2 = this.audioCtx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2.005, t); // Leve desafinación armónica para brillo de campana

    // Oscilador de brillo alto (tercer armónico)
    const osc3 = this.audioCtx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq * 3.01, t);

    // Envolvente de volumen (ataque percusivo + caída suave)
    const noteGain = this.audioCtx.createGain();
    noteGain.gain.setValueAtTime(0.001, t);
    noteGain.gain.exponentialRampToValueAtTime(0.28, t + 0.02);
    noteGain.gain.exponentialRampToValueAtTime(0.001, t + duration * 1.6);

    const highGain = this.audioCtx.createGain();
    highGain.gain.setValueAtTime(0.08, t);
    highGain.gain.exponentialRampToValueAtTime(0.0001, t + duration * 0.4);

    osc1.connect(noteGain);
    osc2.connect(noteGain);
    osc3.connect(highGain);

    noteGain.connect(this.masterGain);
    highGain.connect(this.masterGain);

    osc1.start(t);
    osc2.start(t);
    osc3.start(t);

    const stopTime = t + duration * 1.8;
    osc1.stop(stopTime);
    osc2.stop(stopTime);
    osc3.stop(stopTime);
  }

  // Arpegio brillante para cuando se toca una flor o se abre la dedicatoria
  playSparkle() {
    this.init();
    if (!this.audioCtx) return;

    const notes = [
      this.N.G5, this.N.C6, this.N.E6, this.N.G6, this.N.C6 * 1.5
    ];

    notes.forEach((freq, i) => {
      setTimeout(() => {
        if (!this.audioCtx) return;
        const t = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);

        osc.connect(gain);
        gain.connect(this.masterGain || this.audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.55);
      }, i * 70);
    });
  }

  start() {
    this.init();
    if (this.isPlaying) return;
    this.isPlaying = true;

    let index = 0;
    const playNext = () => {
      if (!this.isPlaying) return;

      const item = this.melody[index];
      const freq = this.N[item.note] || 0;

      if (freq > 0) {
        this.playBellNote(freq, item.dur);
      }

      index = (index + 1) % this.melody.length;
      this.currentTimeout = setTimeout(playNext, item.dur * 1000);
    };

    playNext();
  }

  stop() {
    this.isPlaying = false;
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }
  }

  toggle() {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
    }
  }
}

export const synth = new MelodySynthesizer();
