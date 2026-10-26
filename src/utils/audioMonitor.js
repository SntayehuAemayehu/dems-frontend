// frontend/src/utils/audioMonitor.js
// Real-time background sound detection using Web Audio API
// Detects: loudness, dominant frequency, human speech, sudden spikes
// Non-blocking: raises alerts, doesn't stop the exam

export class AudioMonitor {
  constructor(onAlert, options = {}) {
    this.onAlert = onAlert;

    // Thresholds (tuned for quiet exam environments)
    this.LOUDNESS_SPEECH_MIN = 45;   // avg frequency bin 0-255
    this.LOUDNESS_LOUD_MIN = 100;    // shouting/screaming
    this.SPEECH_HZ_MIN = 85;         // human voice low end
    this.SPEECH_HZ_MAX = 300;        // human voice high end
    this.SUSTAINED_FRAMES = 15;      // ~7.5s of continuous speech
    this.ALERT_COOLDOWN_MS = 4000;   // min gap between alerts
    this.SAMPLE_INTERVAL_MS = 500;
    this.GRACE_PERIOD_MS = 10000;    // ignore first 10s (mic setup)

    // Callbacks
    this.onStatusUpdate = options.onStatusUpdate || (() => {});

    // Internal state
    this.audioCtx = null;
    this.analyser = null;
    this.stream = null;
    this.running = false;
    this.history = [];                 // [{t, loudness, hz, peak}]
    this.speechFrames = 0;
    this.lastAlertAt = 0;
    this.startedAt = 0;
    this._loopTimer = null;

    // Stats exposed to UI
    this.currentLoudness = 0;
    this.currentHz = 0;
    this.currentPeak = 0;
  }

  async start() {
    if (this.running) return true;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,   // Raw audio — we want to detect everything
          noiseSuppression: false,   // Do NOT filter — whispers must be caught
          autoGainControl: false,    // Do NOT normalize — we need real levels
          sampleRate: 44100,
        },
      });

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioCtx();

      // Resume if suspended (Chrome autoplay policy)
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.75;

      const source = this.audioCtx.createMediaStreamSource(this.stream);
      source.connect(this.analyser);

      this.running = true;
      this.startedAt = Date.now();
      this._loop();

      console.log('🎤 AudioMonitor started');
      return true;
    } catch (err) {
      console.error('❌ AudioMonitor failed to start:', err);
      this.running = false;
      throw err;
    }
  }

  _loop = () => {
    if (!this.running) return;

    try {
      const buffer = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteFrequencyData(buffer);

      // ---- 1. Loudness (avg of all bins) ----
      let sum = 0;
      for (let i = 0; i < buffer.length; i++) sum += buffer[i];
      const loudness = sum / buffer.length;

      // ---- 2. Dominant frequency (peak bin) ----
      let maxBin = 0;
      let maxVal = 0;
      for (let i = 1; i < buffer.length; i++) {
        if (buffer[i] > maxVal) {
          maxVal = buffer[i];
          maxBin = i;
        }
      }
      const sampleRate = this.audioCtx.sampleRate;
      const hz = (maxBin * sampleRate) / this.analyser.fftSize;

      // Expose current values
      this.currentLoudness = loudness;
      this.currentHz = hz;
      this.currentPeak = maxVal;

      this.onStatusUpdate({
        loudness: Math.round(loudness),
        hz: Math.round(hz),
        peak: maxVal,
        isSpeech: this._isSpeech(loudness, hz, maxVal),
      });

      // ---- 3. Detect speech / loud noise ----
      const isSpeech = this._isSpeech(loudness, hz, maxVal);
      const isLoud = loudness > this.LOUDNESS_LOUD_MIN;

      if (isSpeech || isLoud) {
        this.speechFrames++;
      } else {
        this.speechFrames = Math.max(0, this.speechFrames - 2);
      }

      // ---- 4. Trigger alert after sustained detection ----
      const now = Date.now();
      const inGrace = now - this.startedAt < this.GRACE_PERIOD_MS;
      const inCooldown = now - this.lastAlertAt < this.ALERT_COOLDOWN_MS;

      if (
        !inGrace &&
        !inCooldown &&
        this.speechFrames > this.SUSTAINED_FRAMES
      ) {
        this.lastAlertAt = now;
        this.speechFrames = 0;

        const alert = {
          type: isLoud ? 'LOUD_NOISE' : 'SPEECH_DETECTED',
          loudness: Math.round(loudness),
          dominantHz: Math.round(hz),
          peak: maxVal,
          severity: isLoud ? 'HIGH' : 'MEDIUM',
          message: isLoud
            ? `🔊 Loud noise detected (${Math.round(loudness)}/255)`
            : `🗣️ Background speech detected (~${Math.round(hz)}Hz)`,
          timestamp: new Date().toISOString(),
        };

        console.log('🚨 AudioMonitor alert:', alert);
        this.onAlert?.(alert);
      }

      // ---- 5. Keep rolling history (last 2 minutes @ 500ms) ----
      this.history.push({
        t: now,
        loudness: Math.round(loudness),
        hz: Math.round(hz),
        peak: maxVal,
      });
      if (this.history.length > 240) this.history.shift();

    } catch (e) {
      console.warn('AudioMonitor loop error:', e);
    }

    this._loopTimer = setTimeout(this._loop, this.SAMPLE_INTERVAL_MS);
  };

  _isSpeech(loudness, hz, peak) {
    // Human voice: sustained energy in 85–300 Hz band
    if (loudness < this.LOUDNESS_SPEECH_MIN) return false;
    if (peak < 60) return false; // too weak to be voice
    return hz >= this.SPEECH_HZ_MIN && hz <= this.SPEECH_HZ_MAX;
  }

  /**
   * Get a compact summary for sending to backend.
   * Includes recent speech events and the current state.
   */
  getSignals() {
    const now = Date.now();
    const last10s = this.history.filter(h => now - h.t < 10000);
    const speechEvents = last10s.filter(h =>
      h.loudness > this.LOUDNESS_SPEECH_MIN &&
      h.hz >= this.SPEECH_HZ_MIN &&
      h.hz <= this.SPEECH_HZ_MAX
    ).length;

    return {
      current_loudness: Math.round(this.currentLoudness),
      current_hz: Math.round(this.currentHz),
      speech_events_10s: speechEvents,
      avg_loudness_10s: last10s.length
        ? Math.round(last10s.reduce((a, b) => a + b.loudness, 0) / last10s.length)
        : 0,
      alert_count: this.history.filter(h => h.loudness > this.LOUDNESS_LOUD_MIN).length,
    };
  }

  stop() {
    this.running = false;
    if (this._loopTimer) {
      clearTimeout(this._loopTimer);
      this._loopTimer = null;
    }
    try {
      this.stream?.getTracks().forEach(t => t.stop());
    } catch (e) {}
    try {
      this.audioCtx?.close();
    } catch (e) {}
    this.stream = null;
    this.audioCtx = null;
    this.analyser = null;
    console.log('🔇 AudioMonitor stopped');
  }
}

export default AudioMonitor;