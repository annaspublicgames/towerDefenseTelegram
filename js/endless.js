/**
 * endless.js — Endlos-Modus: prozedurale Wellen und lokaler Highscore.
 *
 * makeEndlessWave(n) erzeugt die n-te Welle (1-basiert) mit denselben Feldern
 * wie ein Eintrag in WAVE_DEFS, sodass der WaveManager sie unverändert spielen
 * kann. Der Highscore wird nach erreichter Welle (primär) und getöteten
 * Gegnern (sekundär) gewertet und in localStorage gespeichert (Fallback wie
 * in meta.js).
 */

// Rotierende Farbpalette, damit sich aufeinanderfolgende Wellen unterscheiden.
var ENDLESS_COLORS = [
  '#ff6666', '#ff8844', '#ffaa44', '#dddd44', '#aaff44',
  '#44ffaa', '#44aaff', '#8844ff', '#ff44cc', '#ff2222',
  '#00e5ff', '#ffd700', '#ffffff'
];

// Erzeugt die Wellendefinition für die n-te Endlos-Welle (n >= 1).
function makeEndlessWave(n) {
  var c = ENDLESS_CFG;
  if (n < 1) n = 1;
  var i = n - 1; // 0-basiert für die Formeln

  var count = Math.min(c.countMax, Math.round(c.countBase + c.countPerWave * i));
  var hp    = Math.round(c.hpBase * Math.pow(c.hpGrowth, i));
  var speed = Math.min(c.speedMax, c.speedBase + c.speedPerWave * i);
  var gold  = Math.min(c.goldMax, Math.round(c.goldBase + c.goldPerWave * i));
  var interval = Math.max(c.intervalMin, c.intervalBase - c.intervalDecay * i);
  var color = ENDLESS_COLORS[i % ENDLESS_COLORS.length];

  return {
    count:         count,
    hp:            hp,
    speed:         speed,
    gold:          gold,
    color:         color,
    spawnInterval: interval
  };
}

// ─── Highscore (lokal) ────────────────────────────────────
var ENDLESS_HIGH_KEY = 'td_endless_high';
var _endlessHighFallback = null; // { wave, kills } oder null

function getEndlessHigh() {
  try {
    var raw = localStorage.getItem(ENDLESS_HIGH_KEY);
    if (raw) {
      var obj = JSON.parse(raw);
      if (obj && typeof obj.wave === 'number') {
        return { wave: obj.wave, kills: obj.kills || 0 };
      }
    }
  } catch (e) { /* localStorage gesperrt oder ungültig */ }
  return _endlessHighFallback;
}

// Vergleicht (wave, kills) mit dem Rekord: besser, wenn die Welle höher ist,
// oder bei gleicher Welle mehr Kills. Speichert bei Verbesserung und gibt
// true zurück, wenn ein neuer Rekord gesetzt wurde.
function isEndlessBetter(wave, kills, high) {
  if (!high) return true;
  if (wave > high.wave) return true;
  if (wave === high.wave && kills > high.kills) return true;
  return false;
}

function trySetEndlessHigh(wave, kills) {
  var high = getEndlessHigh();
  if (!isEndlessBetter(wave, kills, high)) return false;

  var rec = { wave: wave, kills: kills };
  _endlessHighFallback = rec;
  try { localStorage.setItem(ENDLESS_HIGH_KEY, JSON.stringify(rec)); }
  catch (e) { /* ignorieren */ }
  return true;
}
