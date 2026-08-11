export type BgmTrack = 'exploration' | 'combat' | 'home' | 'mystery' | 'none';
export type SfxName = 'item' | 'combat' | 'location' | 'home' | 'dice' | 'click';

export interface AudioSettings {
  bgmEnabled: boolean;
  sfxEnabled: boolean;
  bgmVolume: number; // 0.0 to 1.0
  sfxVolume: number; // 0.0 to 1.0
}

const SETTINGS_KEY = 'raml_audio_settings';

const DEFAULT_SETTINGS: AudioSettings = {
  bgmEnabled: true,
  sfxEnabled: true,
  bgmVolume: 0.4,
  sfxVolume: 0.6,
};

// Note frequencies (Hz)
const NOTES = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
  C6: 1046.50, E6: 1318.51,
};

class AudioEngine {
  private ctx: AudioContext | null = null;
  private settings: AudioSettings = DEFAULT_SETTINGS;
  private currentTrack: BgmTrack = 'none';
  private bgmGainNode: GainNode | null = null;
  private sfxGainNode: GainNode | null = null;
  private masterGainNode: GainNode | null = null;
  private bgmIntervalId: number | null = null;
  private bgmStep = 0;
  private listeners: Set<(settings: AudioSettings) => void> = new Set();

  constructor() {
    this.loadSettings();
  }

  private loadSettings() {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      this.settings = DEFAULT_SETTINGS;
    }
  }

  public saveSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch {
      // Ignore storage errors
    }
    this.applyVolume();
    this.notifyListeners();
  }

  public subscribe(listener: (settings: AudioSettings) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((l) => l(this.settings));
  }

  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  public init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();

    // Master gain
    this.masterGainNode = this.ctx.createGain();
    this.masterGainNode.connect(this.ctx.destination);

    // BGM Gain
    this.bgmGainNode = this.ctx.createGain();
    this.bgmGainNode.connect(this.masterGainNode);

    // SFX Gain
    this.sfxGainNode = this.ctx.createGain();
    this.sfxGainNode.connect(this.masterGainNode);

    this.applyVolume();
  }

  public resumeContext() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  private applyVolume() {
    if (!this.ctx || !this.bgmGainNode || !this.sfxGainNode) return;
    const now = this.ctx.currentTime;
    const targetBgm = this.settings.bgmEnabled ? this.settings.bgmVolume : 0;
    const targetSfx = this.settings.sfxEnabled ? this.settings.sfxVolume : 0;

    this.bgmGainNode.gain.setTargetAtTime(targetBgm, now, 0.1);
    this.sfxGainNode.gain.setTargetAtTime(targetSfx, now, 0.05);
  }

  public toggleBgm() {
    this.settings.bgmEnabled = !this.settings.bgmEnabled;
    this.saveSettings();
    if (!this.settings.bgmEnabled) {
      this.stopBgm();
    } else if (this.currentTrack !== 'none') {
      const track = this.currentTrack;
      this.currentTrack = 'none';
      this.playTrack(track);
    }
  }

  public toggleSfx() {
    this.settings.sfxEnabled = !this.settings.sfxEnabled;
    this.saveSettings();
  }

  public setBgmVolume(vol: number) {
    this.settings.bgmVolume = Math.max(0, Math.min(1, vol));
    this.saveSettings();
  }

  public setSfxVolume(vol: number) {
    this.settings.sfxVolume = Math.max(0, Math.min(1, vol));
    this.saveSettings();
  }

  // --- BACKGROUND MUSIC SCHEDULER ---

  public playTrack(track: BgmTrack) {
    if (this.currentTrack === track) return;
    this.currentTrack = track;

    this.stopBgm();

    if (!this.settings.bgmEnabled || track === 'none') return;
    this.init();
    this.resumeContext();

    this.bgmStep = 0;

    let intervalMs = 400;
    if (track === 'combat') intervalMs = 250;
    if (track === 'home') intervalMs = 500;
    if (track === 'mystery') intervalMs = 600;

    this.bgmIntervalId = window.setInterval(() => {
      this.tickBgm();
    }, intervalMs);
  }

  public stopBgm() {
    if (this.bgmIntervalId !== null) {
      window.clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
  }

  private tickBgm() {
    if (!this.ctx || !this.bgmGainNode || !this.settings.bgmEnabled) return;
    if (this.ctx.state === 'suspended') return;

    const step = this.bgmStep;
    this.bgmStep = (this.bgmStep + 1) % 32;

    switch (this.currentTrack) {
      case 'exploration':
        this.playExplorationStep(step, this.bgmGainNode);
        break;
      case 'combat':
        this.playCombatStep(step, this.bgmGainNode);
        break;
      case 'home':
        this.playHomeStep(step, this.bgmGainNode);
        break;
      case 'mystery':
        this.playMysteryStep(step, this.bgmGainNode);
        break;
    }
  }

  // 1. Exploration Ambient Track (Pentatonic Desert Melody)
  private playExplorationStep(step: number, targetNode: GainNode) {
    const melody: Array<number | null> = [
      NOTES.A3, null, NOTES.C4, NOTES.E4, NOTES.A4, null, NOTES.G4, NOTES.E4,
      NOTES.C4, null, NOTES.D4, NOTES.E4, NOTES.A3, null, NOTES.B3, NOTES.C4,
      NOTES.E4, null, NOTES.G4, NOTES.A4, NOTES.C5, null, NOTES.B4, NOTES.G4,
      NOTES.E4, null, NOTES.D4, NOTES.C4, NOTES.A3, null, NOTES.E3, NOTES.A3,
    ];

    const note = melody[step % melody.length];
    if (note) {
      this.synthNote(note, 'sine', 0.8, 0.15, targetNode);
    }

    // Soft bass drone on beat 0 and 16
    if (step % 16 === 0) {
      this.synthNote(NOTES.A3 / 2, 'triangle', 2.5, 0.25, targetNode);
    }
  }

  // 2. Combat Track (Tense fast rhythmic pulses & minor stabs)
  private playCombatStep(step: number, targetNode: GainNode) {
    const bassline: Array<number | null> = [
      NOTES.D3, NOTES.D3, null, NOTES.D3, NOTES.F3, null, NOTES.G3, NOTES.G3 / 1.06,
      NOTES.D3, NOTES.D3, null, NOTES.D3, NOTES.A3, null, NOTES.G3, NOTES.F3,
    ];

    const note = bassline[step % bassline.length];
    if (note) {
      this.synthNote(note / 2, 'sawtooth', 0.2, 0.3, targetNode, 800);
    }

    // High accent stabs
    if (step % 8 === 4) {
      this.synthNote(NOTES.D4, 'sawtooth', 0.15, 0.2, targetNode, 1200);
    }

    // Rhythmic percussive noise on every offbeat
    if (step % 2 === 1) {
      this.synthNoise(0.04, 0.08, targetNode);
    }
  }

  // 3. Home Track (Warm acoustic / marimba cozy chord progression)
  private playHomeStep(step: number, targetNode: GainNode) {
    const chords: Array<number | null> = [
      NOTES.C4, NOTES.E4, NOTES.G4, NOTES.C5,
      NOTES.G3, NOTES.B3, NOTES.D4, NOTES.G4,
      NOTES.A3, NOTES.C4, NOTES.E4, NOTES.A4,
      NOTES.F3, NOTES.A3, NOTES.C4, NOTES.F4,
    ];

    const note = chords[step % chords.length];
    if (note) {
      this.synthNote(note, 'triangle', 0.7, 0.2, targetNode);
    }

    // Warm deep bass note every 4 steps
    if (step % 4 === 0) {
      const rootNotes = [NOTES.C3, NOTES.G3 / 2, NOTES.A3 / 2, NOTES.F3 / 2];
      const root = rootNotes[Math.floor((step / 4) % rootNotes.length)];
      this.synthNote(root, 'sine', 1.5, 0.3, targetNode);
    }
  }

  // 4. Mystery / Ancient Portal Track (Ethereal sweeping pads)
  private playMysteryStep(step: number, targetNode: GainNode) {
    const arpeggio: Array<number | null> = [
      NOTES.E4, NOTES.B4, NOTES.E5, NOTES.G5, NOTES.B5, NOTES.G5, NOTES.E5, NOTES.B4,
      NOTES.D4, NOTES.A4, NOTES.D5, NOTES.F5, NOTES.A5, NOTES.F5, NOTES.D5, NOTES.A4,
    ];

    const note = arpeggio[step % arpeggio.length];
    if (note) {
      this.synthNote(note, 'sine', 0.9, 0.12, targetNode);
    }

    if (step % 8 === 0) {
      this.synthNote(NOTES.E3, 'sine', 3.0, 0.18, targetNode, 600);
    }
  }

  // --- SOUND EFFECTS (SFX) SYNTHESIZER ---

  public playSfx(sfx: SfxName) {
    if (!this.settings.sfxEnabled) return;
    this.init();
    this.resumeContext();

    if (!this.ctx || !this.sfxGainNode) return;

    switch (sfx) {
      case 'item':
        // Ascending victory chime: C5 -> E5 -> G5 -> C6
        this.synthChime([NOTES.C5, NOTES.E5, NOTES.G5, NOTES.C6], 0.08);
        break;

      case 'combat':
        // Threat drum hit / attack impact
        this.synthImpact();
        break;

      case 'location':
        // Wind chime / crystal bell transition
        this.synthChime([NOTES.A5, NOTES.E6, NOTES.C6], 0.12);
        break;

      case 'home':
        // Cozy wooden latch / warm chime
        this.synthChime([NOTES.G4, NOTES.C5], 0.14);
        break;

      case 'dice':
        // Quick dice roll rattle
        this.synthDiceRoll();
        break;

      case 'click':
        // Subtle UI click tap
        this.synthClick();
        break;
    }
  }

  // --- HELPER SYNTHESIZERS ---

  private synthNote(
    freq: number,
    type: OscillatorType,
    duration: number,
    volume: number,
    destination: GainNode,
    cutoffFreq?: number,
  ) {
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      const now = this.ctx.currentTime;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      if (cutoffFreq) {
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(cutoffFreq, now);
        osc.connect(filter);
        filter.connect(gain);
      } else {
        osc.connect(gain);
      }

      gain.connect(destination);

      osc.start(now);
      osc.stop(now + duration + 0.05);
    } catch {
      // Audio node scheduling error guard
    }
  }

  private synthNoise(duration: number, volume: number, destination: GainNode) {
    if (!this.ctx) return;
    try {
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1000, now);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + duration);
    } catch {
      // Ignore audio synthesis edge cases
    }
  }

  private synthChime(notes: number[], delaySec: number) {
    if (!this.ctx || !this.sfxGainNode) return;
    const sfxNode = this.sfxGainNode;
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx) return;
        this.synthNote(freq, 'sine', 0.5, 0.35, sfxNode);
      }, idx * delaySec * 1000);
    });
  }

  private synthImpact() {
    if (!this.ctx || !this.sfxGainNode) return;
    const now = this.ctx.currentTime;

    // Pitch drop oscillator
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGainNode);

    osc.start(now);
    osc.stop(now + 0.3);

    // Noise snap
    this.synthNoise(0.12, 0.4, this.sfxGainNode);
  }

  private synthDiceRoll() {
    if (!this.ctx || !this.sfxGainNode) return;
    const clicks = [0, 60, 130, 210, 300, 420];
    const sfxNode = this.sfxGainNode;
    clicks.forEach((ms) => {
      setTimeout(() => {
        if (!this.ctx) return;
        this.synthNoise(0.03, 0.25, sfxNode);
      }, ms);
    });
  }

  private synthClick() {
    if (!this.ctx || !this.sfxGainNode) return;
    this.synthNote(NOTES.C5, 'sine', 0.04, 0.15, this.sfxGainNode);
  }
}

export const audioEngine = new AudioEngine();
