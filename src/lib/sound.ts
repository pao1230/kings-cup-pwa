// Tiny WebAudio blips — no audio files, keeps the bundle small (NFR-2)
// and works offline. Respects the sound toggle (FR-4.3).

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  return ctx;
}

function blip(freq: number, durationMs: number, type: OscillatorType = 'sine', gain = 0.06): void {
  const audio = getCtx();
  if (!audio) return;
  if (audio.state === 'suspended') audio.resume().catch(() => {});
  const osc = audio.createOscillator();
  const g = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  osc.connect(g).connect(audio.destination);
  const now = audio.currentTime;
  osc.start(now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
  osc.stop(now + durationMs / 1000);
}

export function playDraw(enabled: boolean): void {
  if (!enabled) return;
  blip(520, 90, 'triangle');
  setTimeout(() => blip(720, 110, 'triangle'), 70);
}

export function playKing(enabled: boolean): void {
  if (!enabled) return;
  blip(440, 120, 'sawtooth', 0.05);
  setTimeout(() => blip(660, 140, 'sawtooth', 0.05), 110);
  setTimeout(() => blip(880, 200, 'sawtooth', 0.05), 240);
}

// Quick riffle: a burst of short clicks to accompany the shuffle animation.
export function playShuffle(enabled: boolean): void {
  if (!enabled) return;
  for (let i = 0; i < 9; i++) {
    setTimeout(() => blip(280 + Math.random() * 220, 25, 'square', 0.02), i * 70);
  }
}
