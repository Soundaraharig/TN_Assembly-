import type { TimerAudioConfig } from '../types';

let activeAudioElement: HTMLAudioElement | null = null;
let activeAudioContext: AudioContext | null = null;
let activeSourceNodes: AudioNode[] = [];
let activeStopTimeout: any = null;

function getSafeAudioContext(): AudioContext | null {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!activeAudioContext || activeAudioContext.state === 'closed') {
      activeAudioContext = new AudioCtx();
    }
    if (activeAudioContext.state === 'suspended') {
      activeAudioContext.resume().catch(() => {});
    }
    return activeAudioContext;
  } catch (e) {
    console.warn('[audioAlert] Web Audio API not supported or blocked:', e);
    return null;
  }
}

/**
 * Immediate stop of any ongoing alarm sound (synthesizer or custom audio element).
 */
export function stopAllAlertAudio(): void {
  try {
    if (activeStopTimeout) {
      clearTimeout(activeStopTimeout);
      activeStopTimeout = null;
    }

    if (activeAudioElement) {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
      activeAudioElement = null;
    }

    activeSourceNodes.forEach(node => {
      try {
        if ('stop' in node && typeof (node as any).stop === 'function') {
          (node as any).stop();
        }
        node.disconnect();
      } catch {}
    });
    activeSourceNodes = [];
  } catch (err) {
    console.warn('[audioAlert] Error stopping audio:', err);
  }
}

/**
 * High-quality 3-tone harmonic chime sequence: D5 -> F#5 -> A5
 * Fully synthesized via native Web Audio API with zero external dependencies.
 */
export function playChimeSequence(volume = 1): void {
  stopAllAlertAudio();
  const ctx = getSafeAudioContext();
  if (!ctx) return;

  const masterVol = Math.max(0, Math.min(1, volume));
  const now = ctx.currentTime;
  const notes = [
    { freq: 587.33, start: 0.0, dur: 0.4 },  // D5
    { freq: 739.99, start: 0.22, dur: 0.4 }, // F#5
    { freq: 880.00, start: 0.44, dur: 0.9 }  // A5 (sustain)
  ];

  notes.forEach(({ freq, start, dur }) => {
    const osc = ctx.createOscillator();
    const overtone = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + start);

    overtone.type = 'triangle';
    overtone.frequency.setValueAtTime(freq * 2, now + start);

    gain.gain.setValueAtTime(0.001, now + start);
    gain.gain.linearRampToValueAtTime(0.35 * masterVol, now + start + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

    osc.connect(gain);
    overtone.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + start);
    overtone.start(now + start);
    osc.stop(now + start + dur + 0.05);
    overtone.stop(now + start + dur + 0.05);

    activeSourceNodes.push(osc, overtone, gain);
  });

  activeStopTimeout = setTimeout(() => {
    stopAllAlertAudio();
  }, 1600);
}

/**
 * Double parliamentary bell sequence: 1046 Hz -> 1318 Hz with rich resonance.
 */
export function playBellSequence(volume = 1): void {
  stopAllAlertAudio();
  const ctx = getSafeAudioContext();
  if (!ctx) return;

  const masterVol = Math.max(0, Math.min(1, volume));
  const now = ctx.currentTime;
  const rings = [
    { freq: 1046.50, start: 0.0, dur: 0.6 },
    { freq: 1318.51, start: 0.35, dur: 1.1 }
  ];

  rings.forEach(({ freq, start, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + start);

    gain.gain.setValueAtTime(0.001, now + start);
    gain.gain.linearRampToValueAtTime(0.45 * masterVol, now + start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + start);
    osc.stop(now + start + dur + 0.05);

    activeSourceNodes.push(osc, gain);
  });

  activeStopTimeout = setTimeout(() => {
    stopAllAlertAudio();
  }, 1800);
}

/**
 * Parliamentary Speaker's Gavel double strike.
 */
export function playGavelSequence(volume = 1): void {
  stopAllAlertAudio();
  const ctx = getSafeAudioContext();
  if (!ctx) return;

  const masterVol = Math.max(0, Math.min(1, volume));
  const now = ctx.currentTime;
  const strikes = [0.0, 0.22];

  strikes.forEach((start) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now + start);
    osc.frequency.exponentialRampToValueAtTime(60, now + start + 0.12);

    gain.gain.setValueAtTime(0.5 * masterVol, now + start);
    gain.gain.exponentialRampToValueAtTime(0.001, now + start + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + start);
    osc.stop(now + start + 0.18);

    activeSourceNodes.push(osc, gain);
  });

  activeStopTimeout = setTimeout(() => {
    stopAllAlertAudio();
  }, 800);
}

/**
 * Plays user-provided custom audio (Data URL or hosted URL).
 */
export function playCustomAudio(audioSource: string, volume = 1): Promise<void> {
  stopAllAlertAudio();
  const masterVol = Math.max(0, Math.min(1, volume));

  return new Promise((resolve, reject) => {
    try {
      const audio = new Audio(audioSource);
      audio.volume = masterVol;
      activeAudioElement = audio;

      audio.onended = () => {
        activeAudioElement = null;
        resolve();
      };

      audio.onerror = (e) => {
        activeAudioElement = null;
        console.warn('[audioAlert] Custom audio playback failed:', e);
        reject(e);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => resolve()).catch(err => {
          activeAudioElement = null;
          console.warn('[audioAlert] Audio play promise rejected:', err);
          reject(err);
        });
      }
    } catch (err) {
      activeAudioElement = null;
      reject(err);
    }
  });
}

/**
 * Plays the authoritative timer expiration alarm based on event configuration.
 */
export async function playTimerAlarm(config?: TimerAudioConfig | null): Promise<void> {
  if (config?.is_muted) {
    return;
  }

  const vol = config?.volume !== undefined ? config.volume : 1;
  const toneType = config?.tone_type || 'default';

  if (toneType === 'custom' && config?.custom_audio_data) {
    try {
      await playCustomAudio(config.custom_audio_data, vol);
      return;
    } catch (err) {
      console.warn('[audioAlert] Falling back to default chime due to custom audio error:', err);
      playChimeSequence(vol);
      return;
    }
  }

  if (toneType === 'bell') {
    playBellSequence(vol);
  } else if (toneType === 'gavel') {
    playGavelSequence(vol);
  } else {
    // Default pleasant chime sequence
    playChimeSequence(vol);
  }
}
