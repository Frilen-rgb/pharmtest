(function () {
  "use strict";
  var soundKey = "pharmtest:sound:v1";
  var enabled = true;
  var context = null;
  var voices = [];
  var generation = 0;
  var layers = [];
  var decorated = [];
  var cleanupTimer;
  var button = document.getElementById("sound-toggle");
  var AudioEngine = window.AudioContext || window.webkitAudioContext;
  var motion = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  try { enabled = window.localStorage.getItem(soundKey) !== "off"; } catch (error) {}

  function updateButton() {
    if (!button) return;
    button.hidden = false;
    button.disabled = !AudioEngine;
    button.setAttribute("aria-pressed", String(enabled && Boolean(AudioEngine)));
    button.setAttribute("aria-label", AudioEngine ? (enabled ? "Звук включён" : "Звук выключен") : "Звук недоступен в этом браузере");
    button.title = AudioEngine ? (enabled ? "Выключить звук" : "Включить звук") : "Звук недоступен в этом браузере";
    button.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4 6 8H3v8h3l5 4V4Z"/>' +
      (enabled && AudioEngine ? '<path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>' : '<path d="m16 9 6 6m0-6-6 6"/>') + '</svg>';
  }

  function stopVoices() {
    generation += 1;
    voices.splice(0).forEach(function (voice) {
      try { voice.oscillator.stop(); } catch (error) {}
      try { voice.oscillator.disconnect(); voice.gain.disconnect(); } catch (error) {}
    });
  }

  function tone(frequency, offset, duration, volume, wave) {
    var oscillator = context.createOscillator();
    var gain = context.createGain();
    var at = context.currentTime + offset;
    oscillator.type = wave || "sine";
    oscillator.frequency.setValueAtTime(frequency, at);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(volume, at + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    var voice = { oscillator: oscillator, gain: gain };
    voices.push(voice);
    oscillator.onended = function () {
      oscillator.disconnect(); gain.disconnect();
      var index = voices.indexOf(voice);
      if (index === -1) return;
      voices.splice(index, 1);
      if (!voices.length && context.state === "running") {
        try { var pending = context.suspend(); if (pending && pending.catch) pending.catch(function () {}); } catch (error) {}
      }
    };
    oscillator.start(at);
    oscillator.stop(at + duration + 0.02);
  }

  function melody(kind) {
    if (kind === "correct") {
      tone(659.25, 0, 0.18, 0.055, "triangle");
      tone(880, 0.09, 0.22, 0.06);
      tone(1318.5, 0.17, 0.26, 0.035);
    } else if (kind === "wrong") {
      tone(392, 0, 0.16, 0.045, "triangle");
      tone(293.66, 0.11, 0.23, 0.04, "triangle");
    } else if (kind === "advance") {
      tone(1046.5, 0, 0.07, 0.018);
    } else if (kind === "perfect") {
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach(function (note, index) {
        tone(note, index * 0.085, 0.28, index === 4 ? 0.055 : 0.04, "triangle");
      });
    } else if (kind === "complete") {
      [523.25, 659.25, 783.99].forEach(function (note, index) { tone(note, index * 0.1, 0.27, 0.04); });
    }
  }

  function play(kind) {
    stopVoices();
    if (!enabled || !AudioEngine || document.visibilityState === "hidden") return;
    var request = generation;
    try {
      if (!context || context.state === "closed") context = new AudioEngine();
      var ready = context.state === "running" ? Promise.resolve() : context.resume();
      Promise.resolve(ready).then(function () {
        if (request !== generation || !enabled || document.visibilityState === "hidden" || context.state !== "running") return;
        try { melody(kind); } catch (error) { stopVoices(); }
      }).catch(function () {});
    } catch (error) {}
  }

  function clearVisuals() {
    window.clearTimeout(cleanupTimer);
    layers.splice(0).forEach(function (layer) { layer.remove(); });
    decorated.splice(0).forEach(function (item) { item.element.classList.remove(item.name); });
  }

  function decorate(element, name) {
    if (!element) return;
    element.classList.add(name);
    decorated.push({ element: element, name: name });
  }

  function particles(target, celebration) {
    if (!target) return;
    var layer = document.createElement("div");
    layer.className = celebration ? "fx-confetti" : "fx-burst";
    layer.setAttribute("aria-hidden", "true");
    var colors = ["#a8c7ff", "#c9b7f6", "#f0c68b", "#96cedb"];
    var count = celebration ? 28 : 10;
    for (var index = 0; index < count; index += 1) {
      var piece = document.createElement("i");
      var angle = (index / count) * Math.PI * 2;
      piece.style.setProperty("--x", Math.cos(angle) * (42 + Math.random() * 35) + "px");
      piece.style.setProperty("--y", Math.sin(angle) * (28 + Math.random() * 26) + "px");
      piece.style.setProperty("--turn", (Math.random() * 360 - 180) + "deg");
      piece.style.setProperty("--delay", Math.random() * (celebration ? 0.23 : 0.07) + "s");
      piece.style.setProperty("--color", colors[index % colors.length]);
      if (celebration) piece.style.left = (index + 0.5) / count * 100 + "%";
      layer.appendChild(piece);
    }
    target.appendChild(layer);
    layers.push(layer);
  }

  function react(kind) {
    clearVisuals();
    play(kind);
    if (motion && motion.matches) return;
    var feedback = document.getElementById("answer-feedback");
    if (kind === "correct" || kind === "wrong") {
      decorate(feedback, "fx-" + kind);
      if (kind === "correct") particles(feedback, false);
    } else if (kind === "advance") {
      decorate(document.querySelector(".meter"), "fx-advance");
    } else if (kind === "perfect" || kind === "complete") {
      decorate(document.querySelector(".result-banner"), "fx-result");
      if (kind === "perfect") particles(document.body, true);
    }
    cleanupTimer = window.setTimeout(clearVisuals, 1800);
  }

  function cancel() { clearVisuals(); stopVoices(); }
  if (button) button.addEventListener("click", function () {
    enabled = !enabled;
    try { window.localStorage.setItem(soundKey, enabled ? "on" : "off"); } catch (error) {}
    updateButton();
    if (enabled) play("correct"); else stopVoices();
  });
  window.addEventListener("storage", function (event) {
    if (event.key !== soundKey && event.key !== null) return;
    enabled = event.key === null || event.newValue !== "off";
    updateButton(); if (!enabled) stopVoices();
  });
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") cancel(); });
  window.addEventListener("pagehide", cancel);
  if (motion) {
    if (motion.addEventListener) motion.addEventListener("change", function () { if (motion.matches) clearVisuals(); });
    else if (motion.addListener) motion.addListener(function () { if (motion.matches) clearVisuals(); });
  }
  updateButton();
  window.PharmEffects = { react: react, cancel: cancel };
})();
