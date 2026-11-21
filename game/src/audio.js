// Fog on Pier 9 — audio.js
// One job: all sound, synthesized with WebAudio. No audio files, no network.
// Footsteps, harbor ambience, a gull cry for the fish lure, and the alarm.

export function makeAudio() {
  let ctx = null;
  let master = null;
  let ambienceStarted = false;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.35;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function blip(freq, dur, type, vol, slideTo) {
    const ac = ensure();
    if (!ac) return;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ac.currentTime + dur);
    gain.gain.setValueAtTime(vol, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start();
    osc.stop(ac.currentTime + dur);
  }

  function noiseBurst(dur, vol, lowFreq) {
    const ac = ensure();
    if (!ac) return;
    const len = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowFreq;
    const gain = ac.createGain();
    gain.gain.value = vol;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start();
  }

  return {
    unlock() { ensure(); },
    // Soft alternating steps; quieter and slower while sneaking.
    step(sneaking) {
      if (sneaking) noiseBurst(0.05, 0.05, 500);
      else noiseBurst(0.07, 0.12, 900);
    },
    pickup() { blip(660, 0.12, 'sine', 0.25); setTimeout(() => blip(990, 0.18, 'sine', 0.25), 90); },
    // A gull cry when the fish lands: two falling notes.
    gull() { blip(1400, 0.25, 'triangle', 0.2, 900); setTimeout(() => blip(1200, 0.3, 'triangle', 0.18, 750), 160); },
    // Rising two-tone alarm when a guard spots the player.
    alarm() {
      blip(520, 0.22, 'square', 0.12, 780);
      setTimeout(() => blip(780, 0.22, 'square', 0.12, 520), 220);
    },
    // Low thud when caught.
    caught() { blip(120, 0.4, 'sawtooth', 0.25, 60); },
    // Gentle major arpeggio on escape.
    win() {
      [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, 0.35, 'sine', 0.22), i * 130));
    },
    // Harbor ambience: low filtered noise swell + distant foghorn.
    startAmbience() {
      const ac = ensure();
      if (!ac || ambienceStarted) return;
      ambienceStarted = true;
      const len = ac.sampleRate * 3;
      const buf = ac.createBuffer(1, len, ac.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = ac.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const filter = ac.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 220;
      const gain = ac.createGain();
      gain.gain.value = 0.05;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      src.start();
      const horn = () => {
        blip(98, 1.6, 'sine', 0.10, 92);
        setTimeout(horn, 14000 + Math.random() * 8000);
      };
      setTimeout(horn, 5000);
    },
  };
}
