/* Prozeduraler Sound über WebAudio – keine Audiodateien nötig */
window.BH = window.BH || {};

BH.audio = {
  ctx: null,
  noiseBuf: null,
  master: null,

  init() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this._vol();
        this.master.connect(this.ctx.destination);
        const len = this.ctx.sampleRate * 0.5;
        this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      }
      this._syncMasterGain();
      this._resume();
    } catch (e) {
      this.ctx = null;
      this.master = null;
    }
  },

  /** Nach Klick/Taste: Context freischalten (Browser-Autoplay-Policy) */
  unlock() {
    this.init();
    if (!this.ctx || !this.master) return;
    this._resume();
    try {
      const buf = this.ctx.createBuffer(1, 1, this.ctx.sampleRate);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.connect(this.master);
      src.start(0);
    } catch (e) { /* ignore */ }
  },

  _resume() {
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  },

  _syncMasterGain() {
    if (this.master) this.master.gain.value = Math.max(0.001, this._vol());
  },

  _ready() {
    if (!this.ctx || !this.master || !this.noiseBuf) {
      this.init();
    }
    if (!this.ctx || !this.master || !this.noiseBuf) return false;
    this._syncMasterGain();
    this._resume();
    return true;
  },

  _out(node) {
    node.connect(this.master);
  },

  _noise(duration, freq, gain, decay) {
    if (!this._ready()) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(freq, t);
    filter.frequency.exponentialRampToValueAtTime(Math.max(60, freq * 0.2), t + duration);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + (decay || duration));
    src.connect(filter);
    filter.connect(g);
    this._out(g);
    src.start(t);
    src.stop(t + duration);
  },

  _tone(freq, duration, gain, type, slideTo) {
    if (!this._ready()) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = type || "square";
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + duration);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    o.connect(g);
    this._out(g);
    o.start(t);
    o.stop(t + duration);
  },

  /** Funk-Rauschen vor Operator-Sprüchen */
  radio() {
    this._noise(0.06, 2800, 0.08, 0.06);
    this._tone(420, 0.04, 0.06, "sine", 380);
  },

  shot(kind) {
    switch (kind) {
      case "shotgun": this._noise(0.30, 1400, 0.50, 0.30); this._tone(90, 0.18, 0.25, "sine", 40); break;
      case "sniper":  this._noise(0.40, 2600, 0.55, 0.40); this._tone(70, 0.30, 0.30, "sine", 30); break;
      case "pistol":  this._noise(0.12, 2000, 0.30, 0.12); break;
      case "lmg":     this._noise(0.16, 1500, 0.40, 0.16); this._tone(110, 0.08, 0.12, "sine", 55); break;
      case "rail":    this._noise(0.45, 3000, 0.45, 0.45); this._tone(1800, 0.30, 0.22, "sawtooth", 80); break;
      case "plasma":  this._tone(880, 0.10, 0.20, "square", 220); this._noise(0.08, 2400, 0.12, 0.08); break;
      case "kryo":    this._noise(0.10, 5000, 0.18, 0.10); this._tone(2600, 0.07, 0.10, "sine", 1400); break;
      case "launcher":this._noise(0.25, 800, 0.45, 0.25); this._tone(70, 0.20, 0.30, "sine", 35); break;
      default:        this._noise(0.14, 1900, 0.35, 0.14); this._tone(130, 0.06, 0.10, "sine", 60);
    }
  },

  explosion() { this._noise(0.55, 500, 0.55, 0.55); this._tone(55, 0.45, 0.35, "sine", 25); },
  enemyShot() { this._noise(0.12, 900, 0.12, 0.12); },
  empty()     { this._tone(1100, 0.05, 0.10, "square"); },
  reload()    { this._tone(500, 0.05, 0.12, "square"); setTimeout(() => this._tone(700, 0.05, 0.12, "square"), 130); },
  hit()       { this._tone(1500, 0.05, 0.16, "square", 1100); },
  headshot()  { this._tone(2000, 0.08, 0.20, "square", 900); },
  kill()      { this._tone(600, 0.10, 0.14, "triangle", 900); },
  damage()    { this._noise(0.20, 400, 0.25, 0.20); },
  death()     { this._tone(300, 0.6, 0.22, "sawtooth", 50); },
  zombie()    { this._tone(110 + Math.random() * 60, 0.5, 0.10, "sawtooth", 70); },
  round()     { this._tone(220, 0.35, 0.18, "triangle", 440); setTimeout(() => this._tone(330, 0.4, 0.18, "triangle", 660), 280); },
  buy()       { this._tone(880, 0.08, 0.16, "triangle"); setTimeout(() => this._tone(1320, 0.10, 0.16, "triangle"), 90); },
  click()     { this._tone(800, 0.04, 0.08, "square"); },
  objective() { this._tone(523, 0.12, 0.15, "triangle"); setTimeout(() => this._tone(784, 0.18, 0.15, "triangle"), 140); },

  _vol() { return (BH.Settings && BH.Settings.get().volume) || 1; },

  setVolume(v) {
    if (BH.Progress && BH.Progress.data) {
      if (!BH.Progress.data.settings) BH.Progress.data.settings = {};
      BH.Progress.data.settings.volume = Math.max(0, Math.min(1, v));
      BH.Progress.save();
    }
    this._syncMasterGain();
  },
};
