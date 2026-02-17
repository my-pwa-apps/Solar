// ===========================
// AUDIO MANAGER - Procedural Sound Effects
// Uses Web Audio API for synthesized sounds
// ===========================

/**
 * Generates procedural audio effects for the Space Voyage application
 * All sounds are synthesized using Web Audio API - no external files needed
 */
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.enabled = true;
        this.volume = 0.3; // Default volume (0-1)
        
        // Lazy initialization - create context on first user interaction
        this.initialized = false;
    }
    
    /**
     * Initialize the audio context (must be called after user interaction)
     */
    init() {
        if (this.initialized) return true;
        
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Master gain for volume control
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.volume;
            this.masterGain.connect(this.audioContext.destination);
            
            this.initialized = true;
            console.log('🔊 AudioManager initialized');
            return true;
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
            this.enabled = false;
            return false;
        }
    }
    
    /**
     * Ensure audio context is running (browsers suspend it until user interaction)
     */
    async ensureResumed() {
        if (!this.initialized) {
            if (!this.enabled) return false; // Don't retry after failure
            this.init();
        }
        if (!this.audioContext) return false;
        
        if (this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
            } catch (e) {
                console.warn('Could not resume audio context:', e);
                return false;
            }
        }
        return true;
    }
    
    /**
     * Set master volume
     * @param {number} value - Volume from 0 to 1
     */
    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
        }
    }
    
    /**
     * Toggle sound on/off
     */
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
    
    // ===========================
    // SOUND GENERATORS
    // ===========================
    
    /**
     * Play a "select" sound when clicking on a celestial object
     * Inspired by sci-fi interface sounds - a gentle rising tone
     */
    async playSelect() {
        if (!this.enabled) return;
        if (!await this.ensureResumed()) return;
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // Create oscillator for the main tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        // Rising frequency sweep (sci-fi beep)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
        
        // Envelope: quick attack, short sustain, medium decay
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        // Connect and play
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(now);
        osc.stop(now + 0.25);
        
        // Add a subtle harmonic
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(600, now);
        osc2.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gain2.gain.setValueAtTime(0, now);
        gain2.gain.linearRampToValueAtTime(0.1, now + 0.02);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc2.connect(gain2);
        gain2.connect(this.masterGain);
        osc2.start(now);
        osc2.stop(now + 0.2);
    }
    
    /**
     * Play a "hover" sound - subtle and short
     */
    async playHover() {
        if (!this.enabled) return;
        if (!await this.ensureResumed()) return;
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        // Soft blip
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(now);
        osc.stop(now + 0.08);
    }
    
    /**
     * Play a "button click" sound for UI interactions
     */
    async playClick() {
        if (!this.enabled) return;
        if (!await this.ensureResumed()) return;
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        // Short percussive click
        osc.type = 'square';
        osc.frequency.setValueAtTime(1000, now);
        osc.frequency.exponentialRampToValueAtTime(500, now + 0.03);
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(now);
        osc.stop(now + 0.08);
    }
    
    /**
     * Play a "whoosh" sound for transitions/discoveries
     * Good for random discovery button
     */
    async playWhoosh() {
        if (!this.enabled) return;
        if (!await this.ensureResumed()) return;
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        const duration = 0.4;
        
        // Create noise for the whoosh
        const bufferSize = ctx.sampleRate * duration;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        
        // Generate filtered noise
        for (let i = 0; i < bufferSize; i++) {
            noiseData[i] = Math.random() * 2 - 1;
        }
        
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        
        // Bandpass filter for whoosh character
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(500, now);
        filter.frequency.exponentialRampToValueAtTime(2000, now + duration * 0.3);
        filter.frequency.exponentialRampToValueAtTime(300, now + duration);
        filter.Q.value = 2;
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        noise.start(now);
        noise.stop(now + duration);
        
        // Add a subtle tone sweep
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + duration * 0.5);
        osc.frequency.exponentialRampToValueAtTime(150, now + duration);
        oscGain.gain.setValueAtTime(0, now);
        oscGain.gain.linearRampToValueAtTime(0.1, now + 0.05);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
        osc.connect(oscGain);
        oscGain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + duration);
    }
    
    /**
     * Play an "achievement" or "discovery" fanfare
     * Three ascending notes
     */
    async playDiscovery() {
        if (!this.enabled) return;
        if (!await this.ensureResumed()) return;
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // Three note arpeggio (C5, E5, G5)
        const notes = [523.25, 659.25, 783.99];
        const noteLength = 0.12;
        
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            const startTime = now + i * 0.1;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
            gain.gain.setValueAtTime(0.2, startTime + noteLength - 0.03);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + noteLength + 0.1);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start(startTime);
            osc.stop(startTime + noteLength + 0.15);
        });
    }
    
    /**
     * Play a subtle ambient "space" drone
     * For background atmosphere - call once and let it fade
     */
    async playAmbientPulse() {
        if (!this.enabled) return;
        if (!await this.ensureResumed()) return;
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        const duration = 2;
        
        // Deep bass drone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = 60;
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.05, now + 0.5);
        gain.gain.linearRampToValueAtTime(0.05, now + duration - 0.5);
        gain.gain.linearRampToValueAtTime(0, now + duration);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(now);
        osc.stop(now + duration);
    }
    
    /**
     * Play speed change tick sound
     */
    async playSpeedTick() {
        if (!this.enabled) return;
        if (!await this.ensureResumed()) return;
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = 880;
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(now);
        osc.stop(now + 0.05);
    }
    
    /**
     * Play panel open/expand sound
     */
    async playExpand() {
        if (!this.enabled) return;
        if (!await this.ensureResumed()) return;
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        // Rising sweep
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(now);
        osc.stop(now + 0.15);
    }
    
    /**
     * Play panel close/collapse sound
     */
    async playCollapse() {
        if (!this.enabled) return;
        if (!await this.ensureResumed()) return;
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        // Falling sweep
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(250, now + 0.1);
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(now);
        osc.stop(now + 0.15);
    }
    
    /**
     * Play error/invalid action sound
     */
    async playError() {
        if (!this.enabled) return;
        if (!await this.ensureResumed()) return;
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // Two descending notes (minor second = dissonant)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'square';
        osc1.frequency.value = 200;
        gain1.gain.setValueAtTime(0.1, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc1.connect(gain1);
        gain1.connect(this.masterGain);
        osc1.start(now);
        osc1.stop(now + 0.2);
        
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'square';
        osc2.frequency.value = 180;
        gain2.gain.setValueAtTime(0.1, now + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc2.connect(gain2);
        gain2.connect(this.masterGain);
        osc2.start(now + 0.1);
        osc2.stop(now + 0.3);
    }
}

// Export singleton instance
export const audioManager = new AudioManager();
