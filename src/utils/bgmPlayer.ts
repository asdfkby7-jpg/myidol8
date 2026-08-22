// BGM Player supporting synthesized default piano & violin concerto + custom MP3/Audio file insertion

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  let channels = [], sampleRate = buffer.sampleRate, offset = 0, pos = 0;

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8);
  setUint32(0x45564157); // "WAVE"

  // fmt subchunk
  setUint32(0x20746d66); // "fmt "
  setUint32(16); // SubChunk1Size (16 for PCM)
  setUint16(1); // AudioFormat (1 for PCM)
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan); // ByteRate
  setUint16(numOfChan * 2); // BlockAlign
  setUint16(16); // BitsPerSample

  // data subchunk
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out], { type: 'audio/wav' });
}

export interface BgmTrackOption {
  id: string;
  title: string;
  subtitle: string;
}

export const BGM_TRACKS: BgmTrackOption[] = [
  { id: 'main_concerto', title: '🎼 K-POP 클래시컬 협주곡', subtitle: '메인 테마 (피아노 & 바이올린)' },
];

class BgmPlayer {
  private audioCtx: AudioContext | null = null;
  private customAudio: HTMLAudioElement | null = null;
  private isPlaying: boolean = false;
  private isCustom: boolean = false;
  private customFileName: string = '';
  private currentTrackId: string = 'main_concerto';
  private currentTrackTitle: string = '🎼 K-POP 클래시컬 협주곡';
  private timerId: number | null = null;
  private adBgmIntervalId: number | null = null;
  private previousBgmState: { wasPlaying: boolean; wasCustom: boolean } | null = null;
  private listeners: Set<() => void> = new Set();
  private loopPhase: number = 0; // 0: Piano+Violin (Default), 1: +Soft Electric Guitar, 2: +Soft Electric Guitar + Soft Drum

  constructor() {
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
          this.audioCtx.resume().catch(() => {});
        }
        if (this.isCustom && this.customAudio && this.isPlaying && this.customAudio.paused) {
          this.customAudio.play().catch(() => {});
        }
      };
      const events = ['touchstart', 'touchend', 'click', 'pointerdown', 'keydown'];
      events.forEach((evt) => {
        window.addEventListener(evt, unlockAudio, { passive: true });
      });
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  public getStatus() {
    return {
      isPlaying: this.isPlaying,
      isCustom: this.isCustom,
      customFileName: this.customFileName,
      loopPhase: this.loopPhase,
      currentTrackId: this.isCustom ? 'custom' : this.currentTrackId,
      currentTrackTitle: this.isCustom ? `🎵 ${this.customFileName || '사용자 음원'}` : this.currentTrackTitle,
    };
  }

  public togglePlay() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.play();
    }
  }

  public selectTrack(trackId: string) {
    this.stop();
    this.previousBgmState = null;
    this.isCustom = false;

    if (trackId === 'main_concerto') {
      this.playDefaultSynthesizedBgm();
    } else if (trackId === 'dark_dancer') {
      this.playDarkDancerEffect(true);
    } else if (trackId === 'ad_jingle') {
      this.playAdBgmEffect();
    } else if (trackId === 'custom' && this.customAudio) {
      this.isCustom = true;
      this.play();
    }
  }

  public setCustomAudioFile(file: File) {
    this.stop();
    const url = URL.createObjectURL(file);
    if (!this.customAudio) {
      this.customAudio = new Audio();
      this.customAudio.loop = true;
    }
    this.customAudio.src = url;
    this.isCustom = true;
    this.customFileName = file.name;
    this.currentTrackId = 'custom';
    this.currentTrackTitle = `🎵 ${file.name}`;
    this.notify();
    this.play();
  }

  public resetToDefaultBgm() {
    this.stop();
    if (this.customAudio) {
      this.customAudio.pause();
      this.customAudio = null;
    }
    this.isCustom = false;
    this.customFileName = '';
    this.loopPhase = 0;
    this.currentTrackId = 'main_concerto';
    this.currentTrackTitle = '🎼 K-POP 클래시컬 협주곡';
    this.notify();
    this.play();
  }

  public playDarkDancerEffect(persistent: boolean = false) {
    const wasPlaying = this.isPlaying;
    const wasCustom = this.isCustom;

    this.stop(); // Stops any current playing audio context & timer

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    } catch (e) {
      console.error('Web Audio API not supported', e);
      return;
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    this.isPlaying = true;
    this.currentTrackId = 'dark_dancer';
    this.currentTrackTitle = '🕶️ 다크 댄스 씬스웨이브';
    this.notify();

    const now = this.audioCtx.currentTime;
    const masterGain = this.audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.3, now);
    masterGain.connect(this.audioCtx.destination);

    // Schedule 10s Dark Dancer Effect
    this.scheduleDarkDancerScore(this.audioCtx, masterGain, now);

    // Return to original BGM after 10 seconds if not persistent
    if (!persistent) {
      this.timerId = window.setTimeout(() => {
        this.stop();
        if (wasCustom && this.customAudio) {
          this.isCustom = true;
        }
        if (wasPlaying) {
          this.play();
        }
      }, 10000);
    }
  }

  private scheduleDarkDancerScore(ctx: AudioContext, destination: GainNode, startTime: number) {
    const notes: Record<string, number> = {
      'D2': 73.42, 'C#2': 69.30, 'C2': 65.41, 'A2': 110.00, 'A#2': 116.54,
      'D3': 146.83, 'F3': 174.61, 'G#3': 207.65, 'A3': 220.00, 'C#4': 277.18,
      'D4': 293.66, 'F4': 349.23, 'G#4': 415.30, 'A4': 440.00, 'C#5': 554.37, 'D5': 587.33
    };

    const playDarkBass = (freq: number, time: number, duration: number) => {
      if (!this.isPlaying) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, time);
      filter.frequency.exponentialRampToValueAtTime(120, time + duration);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.45, time + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(filter);
      filter.connect(destination);

      osc.start(time);
      osc.stop(time + duration);
    };

    const playMysteriousNote = (freq: number, time: number, duration: number) => {
      if (!this.isPlaying) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, time);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.3, time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(filter);
      filter.connect(destination);

      osc.start(time);
      osc.stop(time + duration);
    };

    const playSultrySwell = (freq: number, time: number, duration: number) => {
      if (!this.isPlaying) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(4.5, time);
      lfoGain.gain.setValueAtTime(freq * 0.01, time);
      lfo.connect(osc.frequency);
      lfo.start(time);
      lfo.stop(time + duration);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.2, time + duration * 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(gain);
      gain.connect(destination);

      osc.start(time);
      osc.stop(time + duration);
    };

    // 10-Second Sequence
    for (let t = 0; t < 10; t += 0.5) {
      const f = (t % 2 === 0) ? notes['D2'] : (t % 4 === 1 ? notes['C#2'] : notes['C2']);
      playDarkBass(f, startTime + t, 0.45);
    }

    playSultrySwell(notes['D3'], startTime + 0.0, 4.8);
    playSultrySwell(notes['A3'], startTime + 0.2, 4.6);
    playSultrySwell(notes['C#4'], startTime + 5.0, 4.8);
    playSultrySwell(notes['D4'], startTime + 5.2, 4.6);

    const melody = [
      { note: notes['D4'], time: 0.2, dur: 0.8 },
      { note: notes['F4'], time: 0.8, dur: 0.8 },
      { note: notes['G#4'], time: 1.4, dur: 0.8 },
      { note: notes['A4'], time: 2.0, dur: 1.2 },
      { note: notes['C#5'], time: 3.2, dur: 0.8 },
      { note: notes['D5'], time: 4.0, dur: 1.5 },
      { note: notes['D4'], time: 5.2, dur: 0.8 },
      { note: notes['F4'], time: 5.8, dur: 0.8 },
      { note: notes['G#4'], time: 6.4, dur: 0.8 },
      { note: notes['C#5'], time: 7.0, dur: 1.2 },
      { note: notes['D5'], time: 8.2, dur: 1.6 },
    ];

    melody.forEach(item => {
      playMysteriousNote(item.note, startTime + item.time, item.dur);
    });
  }

  public play() {
    if (this.isPlaying) {
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return;
    }

    if (this.isCustom && this.customAudio) {
      this.customAudio.play().then(() => {
        this.isPlaying = true;
        this.notify();
      }).catch(err => {
        console.error("Custom audio play error:", err);
      });
      return;
    }

    // Default Web Audio API synthesized concerto
    this.playDefaultSynthesizedBgm();
  }

  public stop() {
    this.isPlaying = false;
    if (this.customAudio) {
      this.customAudio.pause();
    }
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.adBgmIntervalId !== null) {
      window.clearInterval(this.adBgmIntervalId);
      this.adBgmIntervalId = null;
    }
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch (e) {}
      this.audioCtx = null;
    }
    this.notify();
  }

  public playAdBgmEffect() {
    if (this.previousBgmState === null) {
      this.previousBgmState = {
        wasPlaying: this.isPlaying,
        wasCustom: this.isCustom,
      };
    }

    this.stop();

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    } catch (e) {
      console.error('Web Audio API not supported', e);
      return;
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    this.isPlaying = true;
    this.currentTrackId = 'ad_jingle';
    this.currentTrackTitle = '📺 CM 라이트 징글';
    this.notify();

    const playLoop = () => {
      if (!this.isPlaying || !this.audioCtx) return;
      const now = this.audioCtx.currentTime;
      const masterGain = this.audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.3, now);
      masterGain.connect(this.audioCtx.destination);

      this.scheduleAdCommercialScore(this.audioCtx, masterGain, now);
    };

    playLoop();
    // Schedule 4-second loop
    this.adBgmIntervalId = window.setInterval(() => {
      playLoop();
    }, 4000);
  }

  public stopAdBgmEffect() {
    this.stop();
    if (this.previousBgmState) {
      const { wasPlaying, wasCustom } = this.previousBgmState;
      this.previousBgmState = null;
      if (wasCustom && this.customAudio) {
        this.isCustom = true;
      }
      if (wasPlaying) {
        this.play();
      }
    }
  }

  public playConcertScheduleBgm() {
    if (this.previousBgmState === null) {
      this.previousBgmState = {
        wasPlaying: this.isPlaying,
        wasCustom: this.isCustom,
      };
    }

    this.stop();

    const loopRoutine = () => {
      if (!this.isPlaying) return;

      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioCtx = new AudioContextClass();
      } catch (e) {
        console.error('Web Audio API not supported', e);
        return;
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }

      const now = this.audioCtx.currentTime;
      const masterGain = this.audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.28, now);
      masterGain.connect(this.audioCtx.destination);

      this.scheduleToYouInspiredScore(this.audioCtx, masterGain, now);

      this.timerId = window.setTimeout(() => {
        if (this.isPlaying && this.currentTrackId === 'concert_schedule') {
          if (this.audioCtx) {
            try { this.audioCtx.close(); } catch (e) {}
            this.audioCtx = null;
          }
          loopRoutine();
        }
      }, 20000);
    };

    this.isPlaying = true;
    this.currentTrackId = 'concert_schedule';
    this.currentTrackTitle = '🎸 콘서트 & 스케줄 테마 (그대에게 SYNTH ROCK)';
    this.notify();

    loopRoutine();
  }

  public stopConcertScheduleBgm() {
    if (this.currentTrackId !== 'concert_schedule') return;
    this.stop();
    if (this.previousBgmState) {
      const { wasPlaying, wasCustom } = this.previousBgmState;
      this.previousBgmState = null;
      if (wasCustom && this.customAudio) {
        this.isCustom = true;
      }
      if (wasPlaying) {
        this.play();
      }
    }
  }

  public playAlbumStudioBgm() {
    if (this.previousBgmState === null) {
      this.previousBgmState = {
        wasPlaying: this.isPlaying,
        wasCustom: this.isCustom,
      };
    }

    this.stop();

    const loopRoutine = () => {
      if (!this.isPlaying) return;

      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioCtx = new AudioContextClass();
      } catch (e) {
        console.error('Web Audio API not supported', e);
        return;
      }

      const startAudio = () => {
        if (!this.audioCtx || !this.isPlaying) return;
        const now = this.audioCtx.currentTime;
        // 100ms lookahead for mobile Web Audio buffer prep & zero-stutter start
        const scheduleStart = now + 0.10;

        const masterGain = this.audioCtx.createGain();
        masterGain.gain.setValueAtTime(0.001, now);
        masterGain.gain.linearRampToValueAtTime(0.30, now + 0.15); // Smooth 150ms fade-in
        masterGain.connect(this.audioCtx.destination);

        this.scheduleCreepInspiredScore(this.audioCtx, masterGain, scheduleStart);

        this.timerId = window.setTimeout(() => {
          if (this.isPlaying && this.currentTrackId === 'album_studio') {
            if (this.audioCtx) {
              try { this.audioCtx.close(); } catch (e) {}
              this.audioCtx = null;
            }
            loopRoutine();
          }
        }, 20000);
      };

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().then(() => {
          startAudio();
        }).catch(() => {
          startAudio();
        });
      } else {
        startAudio();
      }
    };

    this.isPlaying = true;
    this.currentTrackId = 'album_studio';
    this.currentTrackTitle = '🎸 신규 앨범 스튜디오 테마 (ALTERNATIVE ROCK)';
    this.notify();

    loopRoutine();
  }

  public stopAlbumStudioBgm() {
    if (this.currentTrackId !== 'album_studio') return;
    this.stop();
    if (this.previousBgmState) {
      const { wasPlaying, wasCustom } = this.previousBgmState;
      this.previousBgmState = null;
      if (wasCustom && this.customAudio) {
        this.isCustom = true;
      }
      if (wasPlaying) {
        this.play();
      }
    }
  }

  private scheduleCreepInspiredScore(ctx: AudioContext, destination: GainNode, startTime: number) {
    const notes: Record<string, number> = {
      'E1': 41.20, 'F1': 43.65, 'F#1': 46.25, 'G1': 49.00, 'A1': 55.00, 'B1': 61.74,
      'C2': 65.41, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F#2': 92.50, 'G2': 98.00, 'A2': 110.00, 'B2': 123.47,
      'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
      'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
      'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'B5': 987.77
    };

    // 1. Warm Bass Guitar
    const playBassNote = (noteName: string, time: number, duration: number, vol = 0.32) => {
      if (time < startTime - 0.01 || time >= startTime + 20.0 || !this.isPlaying) return;
      const freq = notes[noteName];
      if (!freq) return;

      const osc = ctx.createOscillator();
      const subOsc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(freq / 2, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(500, time);
      filter.frequency.exponentialRampToValueAtTime(180, time + duration);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(vol, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(filter);
      subOsc.connect(filter);
      filter.connect(destination);

      osc.start(time);
      subOsc.start(time);
      osc.stop(time + duration + 0.05);
      subOsc.stop(time + duration + 0.05);
    };

    // 2. Clean Arpeggio Electric Guitar (Intro / Verse)
    const playCleanArpNote = (noteName: string, time: number, duration: number, vol = 0.16) => {
      if (time < startTime - 0.01 || time >= startTime + 20.0 || !this.isPlaying) return;
      const freq = notes[noteName];
      if (!freq) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1500, time);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(vol, time + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(filter);
      filter.connect(destination);

      osc.start(time);
      osc.stop(time + duration + 0.05);
    };

    // 3. Muted Guitar Crunch Picking / Dead-Note Scrapes ("chk-chk")
    const playMutedCrunchScratch = (time: number, vol = 0.28) => {
      if (time < startTime - 0.01 || time >= startTime + 20.0 || !this.isPlaying) return;
      const dur = 0.07;
      const bufferSize = ctx.sampleRate * dur;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2200, time);
      filter.Q.setValueAtTime(3.0, time);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(destination);

      noise.start(time);
      noise.stop(time + dur);
    };

    // 4. Heavy Overdriven Power Chord Electric Guitar (Chorus Explosion)
    const playHeavyPowerChord = (rootNote: string, fifthNote: string, octaveNote: string, time: number, duration: number, vol = 0.24) => {
      if (time < startTime - 0.01 || time >= startTime + 20.0 || !this.isPlaying) return;
      [rootNote, fifthNote, octaveNote].forEach((nt) => {
        const freq = notes[nt];
        if (!freq) return;

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(freq, time);

        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(freq * 1.004, time); // Detuned for heavy crunch

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3400, time);
        filter.Q.setValueAtTime(3.2, time);

        gain.gain.setValueAtTime(0.001, time);
        gain.gain.linearRampToValueAtTime(vol, time + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(destination);

        osc1.start(time);
        osc2.start(time);
        osc1.stop(time + duration + 0.05);
        osc2.stop(time + duration + 0.05);
      });
    };

    // 5. Drums (Kick, Rimshot/Snare, Hi-Hat, Crash)
    const playKick = (time: number, heavy = false, vol = 0.35) => {
      if (time < startTime - 0.01 || time >= startTime + 20.0 || !this.isPlaying) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(heavy ? 160 : 130, time);
      osc.frequency.exponentialRampToValueAtTime(32, time + 0.16);
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(vol, time + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
      osc.connect(gain);
      gain.connect(destination);
      osc.start(time);
      osc.stop(time + 0.18);
    };

    const playSnare = (time: number, heavy = false, vol = 0.30) => {
      if (time < startTime - 0.01 || time >= startTime + 20.0 || !this.isPlaying) return;
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(heavy ? 210 : 160, time);
      osc.frequency.exponentialRampToValueAtTime(70, time + 0.12);
      oscGain.gain.setValueAtTime(0.001, time);
      oscGain.gain.linearRampToValueAtTime(vol, time + 0.005);
      oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
      osc.connect(oscGain);
      oscGain.connect(destination);
      osc.start(time);
      osc.stop(time + 0.12);

      const dur = heavy ? 0.22 : 0.10;
      const bufferSize = ctx.sampleRate * dur;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(heavy ? 900 : 1400, time);
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.001, time);
      noiseGain.gain.linearRampToValueAtTime(vol, time + 0.005);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(destination);
      noise.start(time);
      noise.stop(time + dur);
    };

    const playHiHat = (time: number, open = false, vol = 0.12) => {
      if (time < startTime - 0.01 || time >= startTime + 20.0 || !this.isPlaying) return;
      const dur = open ? 0.20 : 0.05;
      const bufferSize = ctx.sampleRate * dur;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(7000, time);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(vol, time + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(destination);
      noise.start(time);
      noise.stop(time + dur);
    };

    const playCrash = (time: number, vol = 0.40) => {
      if (time < startTime - 0.01 || time >= startTime + 20.0 || !this.isPlaying) return;
      const dur = 1.8;
      const bufferSize = ctx.sampleRate * dur;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(5500, time);
      filter.Q.setValueAtTime(1.0, time);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(vol, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(destination);
      noise.start(time);
      noise.stop(time + dur);
    };

    // --- TIMING & CHORD STRUCTURE (20.0s total / 8 Bars @ 96 BPM / 2.5s per bar) ---
    const barDur = 2.5;
    const beatDur = barDur / 4; // 0.625s
    const note8th = beatDur / 2; // 0.3125s
    const note16th = note8th / 2; // 0.15625s

    const verseChords = [
      { bass: 'E2', arp: ['E3', 'G3', 'B3', 'E4', 'B3', 'G3', 'E3', 'B3'] },
      { bass: 'C2', arp: ['C3', 'E3', 'G3', 'D4', 'G3', 'E3', 'C3', 'G3'] },
      { bass: 'G2', arp: ['G2', 'D3', 'G3', 'B3', 'D4', 'B3', 'G3', 'D3'] },
      { bass: 'B2', arp: ['B2', 'D#3', 'F#3', 'A3', 'B3', 'A3', 'F#3', 'D#3'] },
    ];

    const chorusChords = [
      { root: 'E2', fifth: 'B2', oct: 'E3', bass: 'E2' },
      { root: 'C2', fifth: 'G2', oct: 'C3', bass: 'C2' },
      { root: 'G2', fifth: 'D3', oct: 'G3', bass: 'G2' },
      { root: 'B2', fifth: 'F#3', oct: 'B3', bass: 'B2' },
    ];

    // FIRST HALF (0.0s - 9.0s): Melancholic Clean Arpeggio + Gentle Bass + Soft Drums
    for (let bar = 0; bar < 4; bar++) {
      const bTime = startTime + bar * barDur;
      const item = verseChords[bar];

      // Bass note
      playBassNote(item.bass, bTime, barDur * 0.9, 0.28);

      // Clean Arpeggio (until 9.0s)
      item.arp.forEach((nt, idx) => {
        const tNote = bTime + idx * note8th;
        if (tNote < startTime + 9.0) {
          playCleanArpNote(nt, tNote, note8th * 1.1, 0.15);
        }
      });

      // Soft Drums
      for (let beat = 0; beat < 4; beat++) {
        const tBeat = bTime + beat * beatDur;
        if (tBeat < startTime + 9.0) {
          playHiHat(tBeat, false, 0.08);
          playHiHat(tBeat + note8th, false, 0.06);

          if (beat === 0 || beat === 2) {
            playKick(tBeat, false, 0.28);
          }
          if (beat === 1 || beat === 3) {
            playSnare(tBeat, false, 0.20);
          }
        }
      }
    }

    // MIDDLE POINT FILL-IN (9.0s ~ 10.0s): Muted Crunch Scratch ("chk-chk-chk-chk") & Snare Fill
    const fillStartTime = startTime + 9.0;
    playMutedCrunchScratch(fillStartTime, 0.32);
    playMutedCrunchScratch(fillStartTime + note16th, 0.35);
    playMutedCrunchScratch(fillStartTime + note16th * 2, 0.38);
    playMutedCrunchScratch(fillStartTime + note16th * 3, 0.42);

    playMutedCrunchScratch(fillStartTime + note8th * 2, 0.35);
    playMutedCrunchScratch(fillStartTime + note8th * 2 + note16th, 0.40);

    playSnare(fillStartTime + note8th * 2, true, 0.35);
    playSnare(fillStartTime + note8th * 2 + note16th, true, 0.40);
    playSnare(fillStartTime + note8th * 3, true, 0.45);

    // SECOND HALF (10.0s - 20.0s): Explosive Heavy Chorus Burst!
    const chorusStartTime = startTime + 10.0;
    playCrash(chorusStartTime, 0.45);

    for (let bar = 0; bar < 4; bar++) {
      const bTime = chorusStartTime + bar * barDur;
      const item = chorusChords[bar];

      // Heavy Power Chords
      playHeavyPowerChord(item.root, item.fifth, item.oct, bTime, barDur * 0.95, 0.24);

      // Driving Bass
      for (let i = 0; i < 8; i++) {
        playBassNote(item.bass, bTime + i * note8th, note8th * 0.9, i % 2 === 0 ? 0.35 : 0.25);
      }

      // Heavy Driving Rock Drums
      for (let beat = 0; beat < 4; beat++) {
        const tBeat = bTime + beat * beatDur;

        playHiHat(tBeat, false, 0.15);
        playHiHat(tBeat + note8th, beat === 3, 0.18);

        if (beat === 0 || beat === 2) {
          playKick(tBeat, true, 0.42);
        }
        if (beat === 1) {
          playKick(bTime + 1.5 * beatDur, true, 0.38);
        }

        if (beat === 1 || beat === 3) {
          playSnare(tBeat, true, 0.38);
        }

        // Final Snare Fill at 19.5s right before loop reset
        if (bar === 3 && beat === 3) {
          playSnare(tBeat + note16th, true, 0.35);
          playSnare(tBeat + note8th, true, 0.40);
          playSnare(tBeat + note8th + note16th, true, 0.45);
        }
      }
    }
  }

  private scheduleToYouInspiredScore(ctx: AudioContext, destination: GainNode, startTime: number) {
    const notes: Record<string, number> = {
      'A2': 110.00, 'B2': 123.47, 'C#3': 138.59, 'D3': 146.83, 'E3': 164.81, 'F#3': 185.00, 'G#3': 207.65,
      'A3': 220.00, 'B3': 246.94, 'C#4': 277.18, 'D4': 293.66, 'E4': 329.63, 'F#4': 369.99, 'G#4': 415.30,
      'A4': 440.00, 'B4': 493.88, 'C#5': 554.37, 'D5': 587.33, 'E5': 659.25, 'F#5': 739.99, 'G#5': 830.61,
      'A5': 880.00, 'B5': 987.77, 'C#6': 1108.73, 'D6': 1174.66, 'E6': 1318.51, 'F#6': 1479.98
    };

    // 1. Synth Keyboard (Shimmering Synth Brass / Space Keyboard) - Starts at 0.0s
    const playKeyboardNote = (noteName: string, time: number, duration: number, vol = 0.18) => {
      if (time < startTime || time >= startTime + 20.0) return;
      const freq = notes[noteName];
      if (!freq || !this.isPlaying) return;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(freq, time);

      osc2.type = 'square';
      osc2.frequency.setValueAtTime(freq * 1.002, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, time);
      filter.frequency.exponentialRampToValueAtTime(3200, time + duration * 0.7);
      filter.Q.setValueAtTime(2.2, time);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(vol, time + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(destination);

      osc1.start(time);
      osc2.start(time);
      osc1.stop(time + duration + 0.05);
      osc2.stop(time + duration + 0.05);
    };

    // 2. Rock Drums (Kick, Snare, Hi-Hat, Crash Cymbal) - Starts at 3.0s
    const playKick = (time: number, vol = 0.4) => {
      if (time < startTime + 3.0 || time >= startTime + 20.0 || !this.isPlaying) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(170, time);
      osc.frequency.exponentialRampToValueAtTime(35, time + 0.15);
      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);
      osc.connect(gain);
      gain.connect(destination);
      osc.start(time);
      osc.stop(time + 0.16);
    };

    const playSnare = (time: number, vol = 0.3) => {
      if (time < startTime + 3.0 || time >= startTime + 20.0 || !this.isPlaying) return;
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(190, time);
      osc.frequency.exponentialRampToValueAtTime(75, time + 0.12);
      oscGain.gain.setValueAtTime(vol, time);
      oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
      osc.connect(oscGain);
      oscGain.connect(destination);
      osc.start(time);
      osc.stop(time + 0.12);

      const dur = 0.16;
      const bufferSize = ctx.sampleRate * dur;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1000, time);
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(vol, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(destination);
      noise.start(time);
      noise.stop(time + dur);
    };

    const playHiHat = (time: number, open = false, vol = 0.12) => {
      if (time < startTime + 3.0 || time >= startTime + 20.0 || !this.isPlaying) return;
      const dur = open ? 0.20 : 0.05;
      const bufferSize = ctx.sampleRate * dur;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(7000, time);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(destination);
      noise.start(time);
      noise.stop(time + dur);
    };

    const playCrash = (time: number, vol = 0.35) => {
      if (time < startTime + 3.0 || time >= startTime + 20.0 || !this.isPlaying) return;
      const dur = 1.5;
      const bufferSize = ctx.sampleRate * dur;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(5500, time);
      filter.Q.setValueAtTime(1.0, time);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(destination);
      noise.start(time);
      noise.stop(time + dur);
    };

    // 3. Electric Guitar (Power Chords & Soaring Lead) - Starts at 6.0s
    const playPowerChord = (root: string, fifth: string, oct: string, time: number, duration: number, vol = 0.16) => {
      if (time < startTime + 6.0 || time >= startTime + 20.0 || !this.isPlaying) return;
      [root, fifth, oct].forEach((nt) => {
        const freq = notes[nt];
        if (!freq) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2200, time);
        filter.Q.setValueAtTime(2.2, time);

        gain.gain.setValueAtTime(0.001, time);
        gain.gain.linearRampToValueAtTime(vol, time + 0.018);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        osc.connect(filter);
        filter.connect(destination);

        osc.start(time);
        osc.stop(time + duration + 0.05);
      });
    };

    const playLeadGuitarNote = (noteName: string, time: number, duration: number, vol = 0.16) => {
      if (time < startTime + 6.0 || time >= startTime + 20.0 || !this.isPlaying) return;
      const freq = notes[noteName];
      if (!freq) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2600, time);
      filter.Q.setValueAtTime(2.8, time);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(vol, time + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(filter);
      filter.connect(destination);

      osc.start(time);
      osc.stop(time + duration + 0.05);
    };

    // --- TIMING STRUCTURE: 10 Bars @ 120 BPM (2.0s per bar, 20.0s total) ---
    const barDur = 2.0;
    const note8th = 0.25;

    const barChords = [
      { key: 'A', root: 'A2', fifth: 'E3', oct: 'A3', keyboard: ['A4', 'C#5', 'E5', 'A5', 'E5', 'C#5', 'A5', 'C#5'], lead: ['A5', 'C#6', 'E6', 'A6'] },
      { key: 'F#m', root: 'F#2', fifth: 'C#3', oct: 'F#3', keyboard: ['F#4', 'A4', 'C#5', 'F#5', 'C#5', 'A4', 'F#5', 'A4'], lead: ['F#5', 'A5', 'C#6', 'F#6'] },
      { key: 'D', root: 'D3', fifth: 'A3', oct: 'D4', keyboard: ['D4', 'F#4', 'A4', 'D5', 'A4', 'F#4', 'D5', 'F#4'], lead: ['D5', 'F#5', 'A5', 'D6'] },
      { key: 'E', root: 'E3', fifth: 'B3', oct: 'E4', keyboard: ['E4', 'G#4', 'B4', 'E5', 'B4', 'G#4', 'E5', 'G#4'], lead: ['E5', 'G#5', 'B5', 'E6'] },
      { key: 'A', root: 'A2', fifth: 'E3', oct: 'A3', keyboard: ['A4', 'C#5', 'E5', 'A5', 'E5', 'C#5', 'A5', 'C#5'], lead: ['A5', 'C#6', 'E6', 'A6'] },
      { key: 'F#m', root: 'F#2', fifth: 'C#3', oct: 'F#3', keyboard: ['F#4', 'A4', 'C#5', 'F#5', 'C#5', 'A4', 'F#5', 'A4'], lead: ['F#5', 'A5', 'C#6', 'F#6'] },
      { key: 'D', root: 'D3', fifth: 'A3', oct: 'D4', keyboard: ['D4', 'F#4', 'A4', 'D5', 'A4', 'F#4', 'D5', 'F#4'], lead: ['D5', 'F#5', 'A5', 'D6'] },
      { key: 'E', root: 'E3', fifth: 'B3', oct: 'E4', keyboard: ['E4', 'G#4', 'B4', 'E5', 'B4', 'G#4', 'E5', 'G#4'], lead: ['E5', 'G#5', 'B5', 'E6'] },
      { key: 'F#m_G#m', root: 'F#2', fifth: 'C#3', oct: 'F#3', keyboard: ['F#4', 'G#4', 'A4', 'B4', 'C#5', 'D5', 'E5', 'F#5'], lead: ['F#5', 'G#5', 'A5', 'B5'] },
      { key: 'A_High', root: 'A3', fifth: 'E4', oct: 'A4', keyboard: ['A5', 'C#6', 'E6', 'A6', 'E6', 'C#6', 'A6', 'E6'], lead: ['A6', 'E6', 'C#6', 'A5'] }
    ];

    // Loop through 10 bars (0.0s to 20.0s)
    for (let bar = 0; bar < 10; bar++) {
      const bTime = startTime + bar * barDur;
      const chord = barChords[bar];

      // 1. KEYBOARD (Plays in all bars from 0.0s onwards)
      chord.keyboard.forEach((nt, idx) => {
        playKeyboardNote(nt, bTime + idx * note8th, note8th * 1.1, 0.16);
      });

      // 2. DRUMS (Starts at 3.0s)
      if (bar === 1) {
        playCrash(startTime + 3.0, 0.4);
      }
      if (bar >= 3 && bar % 2 === 0) {
        playCrash(bTime, 0.3);
      }

      for (let beat = 0; beat < 4; beat++) {
        const tBeat = bTime + beat * 0.5;

        playHiHat(tBeat, false, 0.12);
        playHiHat(tBeat + 0.25, beat === 3, 0.14);

        if (beat === 0 || beat === 2) {
          playKick(tBeat, 0.4);
        }
        if (beat === 1) {
          playKick(bTime + 0.75, 0.35);
        }
        if (beat === 1 || beat === 3) {
          playSnare(tBeat, 0.32);
        }

        if (bar === 9 && beat === 3) {
          playSnare(tBeat + 0.125, 0.35);
          playSnare(tBeat + 0.25, 0.38);
          playSnare(tBeat + 0.375, 0.40);
        }
      }

      // 3. ELECTRIC GUITAR (Starts at 6.0s)
      if (bar === 3) {
        playCrash(startTime + 6.0, 0.45);
      }

      playPowerChord(chord.root, chord.fifth, chord.oct, bTime, barDur * 0.95, 0.16);

      chord.lead.forEach((nt, idx) => {
        playLeadGuitarNote(nt, bTime + idx * 0.5, 0.48, 0.15);
      });
    }
  }

  private scheduleAdCommercialScore(ctx: AudioContext, destination: GainNode, startTime: number) {
    // Drum Synthesizers
    const playKick = (time: number) => {
      if (!this.isPlaying) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(30, time + 0.1);
      gain.gain.setValueAtTime(0.6, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
      osc.connect(gain);
      gain.connect(destination);
      osc.start(time);
      osc.stop(time + 0.12);
    };

    const playSnare = (time: number) => {
      if (!this.isPlaying) return;
      // Tone body
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, time);
      oscGain.gain.setValueAtTime(0.3, time);
      oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
      osc.connect(oscGain);
      oscGain.connect(destination);
      osc.start(time);
      osc.stop(time + 0.1);

      // Noise sizzle
      const bufferSize = ctx.sampleRate * 0.12;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1000, time);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.12);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(destination);
      noise.start(time);
      noise.stop(time + 0.12);
    };

    const playHiHat = (time: number) => {
      if (!this.isPlaying) return;
      const bufferSize = ctx.sampleRate * 0.05;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(7000, time);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.18, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.04);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(destination);
      noise.start(time);
      noise.stop(time + 0.04);
    };

    const playPopSynth = (freq: number, time: number, duration: number, vol = 0.25) => {
      if (!this.isPlaying) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, time);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(vol, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(destination);

      osc.start(time);
      osc.stop(time + duration);
    };

    // 4-bar Upbeat Commercial Groove (4 seconds loop)
    // Drums Rhythm (8 beats per 4 seconds)
    for (let beat = 0; beat < 8; beat++) {
      const t = startTime + beat * 0.5;
      // Kick on 0, 1, 2, 3, 4, 5, 6, 7 (four on floor)
      playKick(t);
      // Snare on beat 1, 3, 5, 7
      if (beat % 2 === 1) {
        playSnare(t);
      }
      // HiHat on 8th notes
      playHiHat(t);
      playHiHat(t + 0.25);
    }

    // Upbeat Commercial Melody (C Major - G Major - A minor - F Major)
    // C Major
    playPopSynth(261.63, startTime + 0.0, 0.4, 0.3); // C4
    playPopSynth(329.63, startTime + 0.25, 0.3, 0.25); // E4
    playPopSynth(392.00, startTime + 0.5, 0.4, 0.3); // G4
    playPopSynth(523.25, startTime + 0.75, 0.3, 0.35); // C5

    // G Major
    playPopSynth(293.66, startTime + 1.0, 0.4, 0.3); // D4
    playPopSynth(392.00, startTime + 1.25, 0.3, 0.25); // G4
    playPopSynth(493.88, startTime + 1.5, 0.4, 0.3); // B4
    playPopSynth(587.33, startTime + 1.75, 0.3, 0.35); // D5

    // A Minor
    playPopSynth(220.00, startTime + 2.0, 0.4, 0.3); // A3
    playPopSynth(329.63, startTime + 2.25, 0.3, 0.25); // E4
    playPopSynth(440.00, startTime + 2.5, 0.4, 0.3); // A4
    playPopSynth(523.25, startTime + 2.75, 0.3, 0.35); // C5

    // F Major
    playPopSynth(349.23, startTime + 3.0, 0.4, 0.3); // F4
    playPopSynth(440.00, startTime + 3.25, 0.3, 0.25); // A4
    playPopSynth(523.25, startTime + 3.5, 0.4, 0.3); // C5
    playPopSynth(659.25, startTime + 3.75, 0.3, 0.4); // E5
  }

  private playDefaultSynthesizedBgm() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    } catch (e) {
      console.error('Web Audio API not supported', e);
      return;
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    this.isPlaying = true;
    this.currentTrackId = 'main_concerto';
    this.currentTrackTitle = '🎼 K-POP 클래시컬 협주곡';
    this.notify();

    const now = this.audioCtx.currentTime;
    const TOTAL_DURATION = 20.0; // 20 seconds score per loop

    // Master Volume
    const masterGain = this.audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.25, now);
    masterGain.connect(this.audioCtx.destination);

    // Current loop phase (0: Piano+Violin, 1: +Electric Guitar, 2: +Soft Drum)
    const currentPhase = this.loopPhase;

    // Schedule Piano, Violin, Electric Guitar & Drum according to currentPhase
    this.scheduleConcertoScore(this.audioCtx, masterGain, now, currentPhase);

    // Advance loopPhase for next repetition (0 -> 1 -> 0 -> 1 ..., omitting 3rd phase / last 1/3 section)
    this.loopPhase = (this.loopPhase + 1) % 2;

    // Loop after 20s
    this.timerId = window.setTimeout(() => {
      if (this.isPlaying && !this.isCustom) {
        if (this.audioCtx) {
          try { this.audioCtx.close(); } catch (e) {}
          this.audioCtx = null;
        }
        this.playDefaultSynthesizedBgm();
      }
    }, TOTAL_DURATION * 1000);
  }

  public async exportBgmAsAudioFile(phaseOption: 'all' | 0 | 1 | 2 = 'all'): Promise<void> {
    const sampleRate = 44100;
    let totalDuration = 20.0;
    let filename = 'KPOP_Producer_BGM.wav';

    if (phaseOption === 'all') {
      totalDuration = 40.0;
      filename = 'KPOP_Producer_BGM_Full_40s.wav';
    } else if (phaseOption === 0) {
      filename = 'KPOP_Producer_BGM_Phase1_PianoViolin.wav';
    } else if (phaseOption === 1) {
      filename = 'KPOP_Producer_BGM_Phase2_ElectricGuitar.wav';
    } else if (phaseOption === 2) {
      filename = 'KPOP_Producer_BGM_Phase3_EpicDrum.wav';
    }

    const OfflineCtxClass = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
    if (!OfflineCtxClass) {
      alert('이 브라우저는 오디오 내보내기 기능(OfflineAudioContext)을 지원하지 않습니다.');
      return;
    }
    const offlineCtx = new OfflineCtxClass(2, Math.floor(sampleRate * totalDuration), sampleRate);
    const masterGain = offlineCtx.createGain();
    masterGain.gain.setValueAtTime(0.7, 0);
    masterGain.connect(offlineCtx.destination);

    if (phaseOption === 'all') {
      this.scheduleConcertoScore(offlineCtx, masterGain, 0.0, 0, true);
      this.scheduleConcertoScore(offlineCtx, masterGain, 20.0, 1, true);
      // Last 1/3 section (Phase 2) omitted
    } else {
      this.scheduleConcertoScore(offlineCtx, masterGain, 0.0, phaseOption, true);
    }

    const renderedBuffer = await offlineCtx.startRendering();
    const blob = audioBufferToWav(renderedBuffer);

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  private scheduleConcertoScore(ctx: BaseAudioContext, destination: GainNode, startTime: number, phase: number, isExport = false) {
    const notes: Record<string, number> = {
      'C3': 130.81, 'E3': 164.81, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
      'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
      'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
      'C6': 1046.50, 'D6': 1174.66, 'E6': 1318.51, 'F6': 1396.91, 'G6': 1567.98
    };

    // 1. Piano synthesizer
    const playPianoNote = (noteName: string, time: number, duration: number, vol = 0.3) => {
      const freq = notes[noteName];
      if (!freq || (!this.isPlaying && !isExport)) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, time);
      gain2.gain.setValueAtTime(vol * 0.2, time);
      gain2.gain.exponentialRampToValueAtTime(0.001, time + duration);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(vol, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(gain);
      gain.connect(destination);

      osc2.connect(gain2);
      gain2.connect(destination);

      osc.start(time);
      osc.stop(time + duration);
      osc2.start(time);
      osc2.stop(time + duration);
    };

    // 2. Violin synthesizer
    const playViolinNote = (noteName: string, time: number, duration: number, vol = 0.18) => {
      const freq = notes[noteName];
      if (!freq || (!this.isPlaying && !isExport)) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(5.2, time);
      lfoGain.gain.setValueAtTime(freq * 0.012, time);
      lfo.connect(osc.frequency);
      lfo.start(time);
      lfo.stop(time + duration);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, time);
      filter.Q.setValueAtTime(1.5, time);

      const attack = Math.min(0.2, duration * 0.25);
      const release = Math.min(0.3, duration * 0.35);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(vol, time + attack);
      gain.gain.setValueAtTime(vol, time + Math.max(attack, duration - release));
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration + 0.1);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(destination);

      osc.start(time);
      osc.stop(time + duration + 0.12);
    };

    // 3. Electric Guitar synthesizer (Soft accompaniment, softer than piano)
    const playElectricGuitarNote = (noteName: string, time: number, duration: number, vol = 0.11) => {
      const freq = notes[noteName];
      if (!freq || (!this.isPlaying && !isExport)) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, time);
      filter.frequency.exponentialRampToValueAtTime(500, time + duration);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(vol, time + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(filter);
      filter.connect(destination);

      osc.start(time);
      osc.stop(time + duration + 0.05);
    };

    // 4. Epic Drum synthesizers (Loud, punchy, solemn rhythm with Crash Cymbals & Hi-Hats)
    const playEpicKick = (time: number) => {
      if (!this.isPlaying && !isExport) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, time);
      osc.frequency.exponentialRampToValueAtTime(32, time + 0.18);
      gain.gain.setValueAtTime(0.38, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
      osc.connect(gain);
      gain.connect(destination);
      osc.start(time);
      osc.stop(time + 0.2);
    };

    const playEpicSnare = (time: number) => {
      if (!this.isPlaying && !isExport) return;
      // Body tone
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, time);
      osc.frequency.exponentialRampToValueAtTime(80, time + 0.12);
      oscGain.gain.setValueAtTime(0.28, time);
      oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
      osc.connect(oscGain);
      oscGain.connect(destination);
      osc.start(time);
      osc.stop(time + 0.12);

      // Noise snare wire
      const bufferSize = ctx.sampleRate * 0.15;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1000, time);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.25, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(destination);
      noise.start(time);
      noise.stop(time + 0.15);
    };

    const playEpicHiHat = (time: number, open = false) => {
      if (!this.isPlaying && !isExport) return;
      const dur = open ? 0.12 : 0.04;
      const bufferSize = ctx.sampleRate * dur;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(6500, time);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(open ? 0.16 : 0.11, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(destination);
      noise.start(time);
      noise.stop(time + dur);
    };

    const playCrashCymbal = (time: number) => {
      if (!this.isPlaying && !isExport) return;
      const dur = 1.2;
      const bufferSize = ctx.sampleRate * dur;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(5500, time);
      filter.Q.setValueAtTime(1.2, time);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.24, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(destination);
      noise.start(time);
      noise.stop(time + dur);
    };

    // --- COMPOSITION SCORE (20 Seconds Score) ---
    // Measure 1 (0.0s ~ 2.0s): C Major
    const m1 = startTime + 0.0;
    playPianoNote('C4', m1 + 0.0, 0.5, 0.4);
    playPianoNote('E4', m1 + 0.25, 0.5, 0.32);
    playPianoNote('G4', m1 + 0.5, 0.5, 0.32);
    playPianoNote('C5', m1 + 0.75, 0.5, 0.38);
    playPianoNote('E5', m1 + 1.0, 0.8, 0.42);
    playPianoNote('G4', m1 + 1.5, 0.5, 0.32);
    playViolinNote('G4', m1 + 0.0, 1.0, 0.16);
    playViolinNote('C5', m1 + 0.95, 1.1, 0.17);

    // Measure 2 (2.0s ~ 4.0s): G Major
    const m2 = startTime + 2.0;
    playPianoNote('G3', m2 + 0.0, 0.5, 0.4);
    playPianoNote('B3', m2 + 0.25, 0.5, 0.32);
    playPianoNote('D4', m2 + 0.5, 0.5, 0.32);
    playPianoNote('G4', m2 + 0.75, 0.5, 0.38);
    playPianoNote('B4', m2 + 1.0, 0.8, 0.42);
    playPianoNote('D4', m2 + 1.5, 0.5, 0.32);
    playViolinNote('B4', m2 + 0.0, 1.0, 0.16);
    playViolinNote('D5', m2 + 0.95, 1.1, 0.17);

    // Measure 3 (4.0s ~ 6.0s): A Minor
    const m3 = startTime + 4.0;
    playPianoNote('A3', m3 + 0.0, 0.5, 0.4);
    playPianoNote('C4', m3 + 0.25, 0.5, 0.32);
    playPianoNote('E4', m3 + 0.5, 0.5, 0.32);
    playPianoNote('A4', m3 + 0.75, 0.5, 0.38);
    playPianoNote('C5', m3 + 1.0, 0.8, 0.42);
    playPianoNote('E4', m3 + 1.5, 0.5, 0.32);
    playViolinNote('C5', m3 + 0.0, 1.0, 0.16);
    playViolinNote('E5', m3 + 0.95, 1.1, 0.18);

    // Measure 4 (6.0s ~ 8.0s): F Major
    const m4 = startTime + 6.0;
    playPianoNote('F3', m4 + 0.0, 0.5, 0.4);
    playPianoNote('A3', m4 + 0.25, 0.5, 0.32);
    playPianoNote('C4', m4 + 0.5, 0.5, 0.32);
    playPianoNote('F4', m4 + 0.75, 0.5, 0.38);
    playPianoNote('A4', m4 + 1.0, 0.8, 0.42);
    playPianoNote('C4', m4 + 1.5, 0.5, 0.32);
    playViolinNote('F5', m4 + 0.0, 1.0, 0.18);
    playViolinNote('D5', m4 + 0.95, 1.1, 0.16);

    // Measure 5 (8.0s ~ 10.0s): C Major Climax
    const m5 = startTime + 8.0;
    playPianoNote('C4', m5 + 0.0, 0.5, 0.42);
    playPianoNote('G4', m5 + 0.25, 0.5, 0.35);
    playPianoNote('C5', m5 + 0.5, 0.5, 0.38);
    playPianoNote('E5', m5 + 0.75, 0.5, 0.42);
    playPianoNote('G5', m5 + 1.0, 0.8, 0.45);
    playViolinNote('G5', m5 + 0.0, 1.0, 0.18);
    playViolinNote('C6', m5 + 0.95, 1.1, 0.19);

    // Measure 6 (10.0s ~ 12.0s): E Minor / G Major
    const m6 = startTime + 10.0;
    playPianoNote('E3', m6 + 0.0, 0.5, 0.4);
    playPianoNote('G3', m6 + 0.25, 0.5, 0.32);
    playPianoNote('B3', m6 + 0.5, 0.5, 0.32);
    playPianoNote('E4', m6 + 0.75, 0.5, 0.38);
    playPianoNote('G4', m6 + 1.0, 0.8, 0.42);
    playViolinNote('B5', m6 + 0.0, 1.0, 0.17);
    playViolinNote('G5', m6 + 0.95, 1.1, 0.16);

    // Measure 7 (12.0s ~ 14.0s): F Major
    const m7 = startTime + 12.0;
    playPianoNote('F3', m7 + 0.0, 0.5, 0.4);
    playPianoNote('C4', m7 + 0.25, 0.5, 0.32);
    playPianoNote('F4', m7 + 0.5, 0.5, 0.38);
    playPianoNote('A4', m7 + 0.75, 0.5, 0.42);
    playPianoNote('C5', m7 + 1.0, 0.8, 0.44);
    playViolinNote('A5', m7 + 0.0, 1.0, 0.18);
    playViolinNote('C6', m7 + 0.95, 1.1, 0.19);

    // Measure 8 (14.0s ~ 16.0s): G Major
    const m8 = startTime + 14.0;
    playPianoNote('G3', m8 + 0.0, 0.5, 0.42);
    playPianoNote('D4', m8 + 0.25, 0.5, 0.35);
    playPianoNote('G4', m8 + 0.5, 0.5, 0.4);
    playPianoNote('B4', m8 + 0.75, 0.5, 0.42);
    playPianoNote('D5', m8 + 1.0, 0.8, 0.45);
    playViolinNote('D6', m8 + 0.0, 1.0, 0.19);
    playViolinNote('B5', m8 + 0.95, 1.1, 0.17);

    // Measure 9 (16.0s ~ 18.0s): C Major
    const m9 = startTime + 16.0;
    playPianoNote('C4', m9 + 0.0, 0.5, 0.42);
    playPianoNote('E4', m9 + 0.25, 0.5, 0.35);
    playPianoNote('G4', m9 + 0.5, 0.5, 0.4);
    playPianoNote('C5', m9 + 0.75, 0.5, 0.42);
    playPianoNote('E5', m9 + 1.0, 0.8, 0.45);
    playViolinNote('C6', m9 + 0.0, 1.0, 0.18);
    playViolinNote('G5', m9 + 0.95, 1.1, 0.16);

    // Measure 10 (18.0s ~ 20.0s): Grand Finale
    const m10 = startTime + 18.0;
    playPianoNote('C3', m10 + 0.0, 1.9, 0.42);
    playPianoNote('G3', m10 + 0.0, 1.9, 0.38);
    playPianoNote('C4', m10 + 0.0, 1.9, 0.38);
    playPianoNote('E4', m10 + 0.0, 1.9, 0.38);
    playPianoNote('G4', m10 + 0.0, 1.9, 0.38);
    playViolinNote('G5', m10 + 0.0, 1.9, 0.16);
    playViolinNote('C6', m10 + 0.0, 1.9, 0.18);

    // --- SUPPORTING ELECTRIC GUITAR ACCOMPANIMENT (Phase 1 & Phase 2) ---
    if (phase >= 1) {
      const gArp = [
        { m: m1, notes: ['C3', 'G3', 'C4', 'E4', 'G4', 'E4', 'C4', 'G3'] },
        { m: m2, notes: ['G3', 'D4', 'G4', 'B4', 'D5', 'B4', 'G4', 'D4'] },
        { m: m3, notes: ['A3', 'E4', 'A4', 'C5', 'E5', 'C5', 'A4', 'E4'] },
        { m: m4, notes: ['F3', 'C4', 'F4', 'A4', 'C5', 'A4', 'F4', 'C4'] },
        { m: m5, notes: ['C3', 'G3', 'C4', 'E4', 'G4', 'E4', 'C4', 'G3'] },
        { m: m6, notes: ['E3', 'B3', 'E4', 'G4', 'B4', 'G4', 'E4', 'B3'] },
        { m: m7, notes: ['F3', 'C4', 'F4', 'A4', 'C5', 'A4', 'F4', 'C4'] },
        { m: m8, notes: ['G3', 'D4', 'G4', 'B4', 'D5', 'B4', 'G4', 'D4'] },
        { m: m9, notes: ['C3', 'G3', 'C4', 'E4', 'G4', 'E4', 'C4', 'G3'] },
      ];

      gArp.forEach(bar => {
        bar.notes.forEach((nt, idx) => {
          playElectricGuitarNote(nt, bar.m + idx * 0.25, 0.35, 0.11);
        });
      });

      // Finale chord for guitar
      playElectricGuitarNote('C3', m10 + 0.0, 1.8, 0.11);
      playElectricGuitarNote('G3', m10 + 0.0, 1.8, 0.11);
      playElectricGuitarNote('C4', m10 + 0.0, 1.8, 0.11);
      playElectricGuitarNote('E4', m10 + 0.0, 1.8, 0.11);
    }

    // --- SUPPORTING DRUM ACCOMPANIMENT (Phase 2 - Epic, solemn rhythm with Crash Cymbal & Hi-Hats) ---
    if (phase >= 2) {
      // Crash Cymbal accents at key thematic entrances
      playCrashCymbal(m1 + 0.0);  // Entry crash
      playCrashCymbal(m5 + 0.0);  // Climax crash
      playCrashCymbal(m9 + 0.0);  // Pre-finale crash
      playCrashCymbal(m10 + 0.0); // Grand finale crash

      const measures = [m1, m2, m3, m4, m5, m6, m7, m8, m9];
      measures.forEach((m, idx) => {
        // 4 beats per measure (0.5s per beat, 8th note = 0.25s)
        for (let beat = 0; beat < 4; beat++) {
          const tBeat = m + beat * 0.5;

          // Hi-hats: steady 8th notes with accent on offbeat
          playEpicHiHat(tBeat, false);
          playEpicHiHat(tBeat + 0.25, beat === 3); // Slightly open hi-hat on beat 4 upbeat

          // Epic Kick: Beat 1, Beat 2.5 (m + 0.75), Beat 3 (m + 1.0)
          if (beat === 0 || beat === 2) {
            playEpicKick(tBeat);
          }
          if (beat === 1) {
            playEpicKick(m + 0.75); // Driving syncopated kick
          }

          // Powerful Snare: Beat 2 & Beat 4
          if (beat === 1 || beat === 3) {
            playEpicSnare(tBeat);
          }
        }

        // Snare fill transition before measure 5 climax
        if (idx === 3) {
          playEpicSnare(m + 1.75);
        }
      });

      // Grand Finale drum impact
      playEpicKick(m10 + 0.0);
      playEpicSnare(m10 + 0.0);
    }
  }
}

export const bgmPlayer = new BgmPlayer();
