/**
 * @license PNCPL-1.0
 * Pro Suite Non-Commercial Public License v1.0
 * Copyright (c) 2026 Pro Suite Open Source Project. All rights reserved.
 * 
 * DynAudio Synth Engine: Web Audio API Real-Time Synthesizer.
 * Generates cybernetic mouse and keyboard audio clicks natively.
 */

let audioCtx = null;

/**
 * Initializes and unlocks the browser Web Audio Context on the first physical user interaction.
 */
export function initAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

/**
 * Helper to generate a brief burst of filtered white noise.
 * Useful for mechanical switch clacks or paper clicks.
 */
function playNoiseBurst(duration, frequencyBand, highPass = false) {
  if (!audioCtx) return;
  
  // Buffer creation
  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  
  // Populate buffer with white noise
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  const noiseSource = audioCtx.createBufferSource();
  noiseSource.buffer = buffer;
  
  // Filter settings
  const filter = audioCtx.createBiquadFilter();
  filter.type = highPass ? 'highpass' : 'bandpass';
  filter.frequency.value = frequencyBand;
  filter.Q.value = 3;
  
  // Envelope gain
  const gainNode = audioCtx.createGain();
  gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
  
  noiseSource.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  noiseSource.start();
}

/**
 * Plays a dynamic high-fidelity synthesized keyboard press sound on the fly.
 * @param {string} profile Sound preset identity ('mechanical-switch' | 'typewriter' | 'cyber-glitch' | 'digital-click')
 */
export function playKeyboardSound(profile) {
  initAudioContext();
  if (!audioCtx) return;
  
  // Safe check if context is active
  if (audioCtx.state === 'suspended') return;
  
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  const now = audioCtx.currentTime;
  
  switch (profile) {
    case 'mechanical-switch':
      // Short click + metallic clack
      osc.type = 'sine';
      osc.frequency.setValueAtTime(850, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.012);
      
      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);
      
      osc.start(now);
      osc.stop(now + 0.018);
      
      // Accompany with filtered paper-clack noise
      playNoiseBurst(0.012, 1200, false);
      break;
      
    case 'typewriter':
      // Rich triangle snap
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.02);
      
      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);
      
      osc.start(now);
      osc.stop(now + 0.03);
      
      // Accompany with typewriter high pass ribbon snap
      playNoiseBurst(0.008, 3000, true);
      break;
      
    case 'cyber-glitch':
      // Futuristic slide
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(350, now + 0.035);
      
      gainNode.gain.setValueAtTime(0.06, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.038);
      
      osc.start(now);
      osc.stop(now + 0.04);
      break;
      
    case 'digital-click':
    default:
      // Crisp minimal sine click
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2200, now);
      osc.frequency.setValueAtTime(1000, now + 0.004);
      
      gainNode.gain.setValueAtTime(0.12, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.008);
      
      osc.start(now);
      osc.stop(now + 0.01);
      break;
  }
}

/**
 * Plays a dynamic high-fidelity synthesized mouse interaction sound on the fly.
 * @param {string} profile Sound preset identity ('water-pop' | 'laser-zap' | 'high-tech-click' | 'modern-tick')
 */
export function playMouseSound(profile) {
  initAudioContext();
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') return;
  
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  const now = audioCtx.currentTime;
  
  switch (profile) {
    case 'water-pop':
      // Rapid sweep up (bubble-drop sound)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.08);
      
      gainNode.gain.setValueAtTime(0.18, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.085);
      
      osc.start(now);
      osc.stop(now + 0.09);
      break;
      
    case 'laser-zap':
      // Classic retro laser down-sweep
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1500, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.12);
      
      gainNode.gain.setValueAtTime(0.08, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);
      
      osc.start(now);
      osc.stop(now + 0.14);
      break;
      
    case 'high-tech-click':
      // Sharp crisp snap
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(950, now);
      osc.frequency.exponentialRampToValueAtTime(450, now + 0.015);
      
      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);
      
      osc.start(now);
      osc.stop(now + 0.02);
      
      // Accompany with metallic click noise
      playNoiseBurst(0.025, 4500, false);
      break;
      
    case 'modern-tick':
    default:
      // Organic dampened click
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.035);
      
      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
      
      osc.start(now);
      osc.stop(now + 0.045);
      break;
  }
}
