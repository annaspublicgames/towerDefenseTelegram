/**
 * Globale Konstanten und Definitionen.
 */
// Hochformat fürs Handy: mehr Zeilen als Spalten.
// Gegner laufen von unten (Start) nach oben (Ziel).
var COLS = 15;
var ROWS = 20;
var CELL = 40;
var START = { col: 7, row: 19 }; // unten-mitte
var END   = { col: 7, row: 0 };  // oben-mitte

var TOWER_DEFS = {
  normal: { name:'Normal', cost:50, damage:25, range:3.0, fireRate:1.2, projSpeed:220, color:'#4a90d9', projColor:'#ffe04b', splashR:0,   slowFactor:1,   slowDur:0   },
  splash: { name:'Splash', cost:80, damage:20, range:2.8, fireRate:0.6, projSpeed:180, color:'#e05c20', projColor:'#ff9955', splashR:2, slowFactor:1,   slowDur:0   },
  slow:   { name:'Slow',   cost:60, damage:10, range:3.5, fireRate:1.0, projSpeed:160, color:'#30b090', projColor:'#aaffee', splashR:0,   slowFactor:0.4, slowDur:2.5 }
};

// ─── Turm-Upgrade ─────────────────────────────────────────
// In Leveln mit "upgrades:true" kann ein globales Upgrade gekauft werden:
// Es verstärkt ALLE Türme (auch bereits platzierte) um eine Stufe.
// Pro Stufe werden Schaden, Reichweite und Feuerrate multipliziert; bei
// Slow-Türmen verstärkt sich zusätzlich die Verlangsamung (längere Dauer,
// stärkerer Faktor). Die Kosten steigen je gekaufter Stufe.
var UPGRADE_DEF = {
  maxLevel:      3,
  baseCost:      120,  // Kosten der ersten Stufe
  costGrowth:    1.6,  // jede weitere Stufe kostet so viel mehr
  damageMult:    1.35, // Schaden je Stufe ×
  rangeMult:     1.10, // Reichweite je Stufe ×
  fireRateMult:  1.15, // Feuerrate je Stufe ×
  slowDurBonus:  0.8,  // +Sekunden Slow-Dauer je Stufe
  slowFactorMult:0.85  // Slow-Faktor je Stufe × (kleiner = stärker)
};

// ─── Level-Definitionen ───────────────────────────────────
// Jedes Level besitzt einen Namen, Start-Gold, Start-Leben und seine Wellen.
// Level 1 entspricht dem ursprünglichen 10-Wellen-Spiel. Die folgenden Level
// sind durch stärkere/schnellere Gegner und mehr Wellen schwieriger.
var LEVEL_DEFS = [
  {
    name: 'Level 1',
    desc: 'Der Anfang',
    startGold: 150,
    startLives: 20,
    waves: [
      { count:  8, hp:  60, speed:1.8, gold:  8, color:'#ff6666', spawnInterval:1.2 },
      { count: 10, hp:  80, speed:2.0, gold: 10, color:'#ff8844', spawnInterval:1.1 },
      { count: 12, hp: 110, speed:2.0, gold: 12, color:'#ffaa44', spawnInterval:1.0 },
      { count: 12, hp: 140, speed:2.3, gold: 14, color:'#dddd44', spawnInterval:1.0 },
      { count: 14, hp: 180, speed:2.4, gold: 16, color:'#aaff44', spawnInterval:0.9 },
      { count: 15, hp: 230, speed:2.5, gold: 18, color:'#44ffaa', spawnInterval:0.9 },
      { count: 16, hp: 300, speed:2.6, gold: 20, color:'#44aaff', spawnInterval:0.85},
      { count: 18, hp: 380, speed:2.7, gold: 22, color:'#8844ff', spawnInterval:0.8 },
      { count: 20, hp: 480, speed:2.9, gold: 25, color:'#ff44cc', spawnInterval:0.75},
      { count: 25, hp: 650, speed:3.1, gold: 30, color:'#ff2222', spawnInterval:0.7 }
    ]
  },
  {
    name: 'Level 2',
    desc: 'Mehr Druck · Turm-Upgrades',
    startGold: 300,
    startLives: 18,
    upgrades: true,
    waves: [
      { count: 12, hp: 120, speed:2.2, gold: 12, color:'#ff6666', spawnInterval:1.0 },
      { count: 14, hp: 160, speed:2.3, gold: 14, color:'#ff8844', spawnInterval:0.95},
      { count: 16, hp: 210, speed:2.4, gold: 16, color:'#ffaa44', spawnInterval:0.9 },
      { count: 16, hp: 270, speed:2.6, gold: 18, color:'#dddd44', spawnInterval:0.9 },
      { count: 18, hp: 340, speed:2.7, gold: 20, color:'#aaff44', spawnInterval:0.85},
      { count: 20, hp: 430, speed:2.8, gold: 22, color:'#44ffaa', spawnInterval:0.8 },
      { count: 22, hp: 550, speed:2.9, gold: 24, color:'#44aaff', spawnInterval:0.75},
      { count: 24, hp: 700, speed:3.0, gold: 26, color:'#8844ff', spawnInterval:0.7 },
      { count: 26, hp: 900, speed:3.2, gold: 28, color:'#ff44cc', spawnInterval:0.65},
      { count: 28, hp:1150, speed:3.3, gold: 30, color:'#ff8822', spawnInterval:0.6 },
      { count: 30, hp:1450, speed:3.4, gold: 32, color:'#ff2222', spawnInterval:0.55},
      { count: 35, hp:1900, speed:3.6, gold: 38, color:'#cc00ff', spawnInterval:0.5 }
    ]
  },
  {
    name: 'Level 3',
    desc: 'Die Horde',
    startGold: 400,
    startLives: 15,
    waves: [
      { count: 16, hp: 220, speed:2.5, gold: 16, color:'#ff6666', spawnInterval:0.9 },
      { count: 18, hp: 300, speed:2.6, gold: 18, color:'#ff8844', spawnInterval:0.85},
      { count: 20, hp: 400, speed:2.7, gold: 22, color:'#ffaa44', spawnInterval:0.8 },
      { count: 22, hp: 520, speed:2.9, gold: 24, color:'#dddd44', spawnInterval:0.75},
      { count: 24, hp: 680, speed:3.0, gold: 26, color:'#aaff44', spawnInterval:0.7 },
      { count: 26, hp: 880, speed:3.1, gold: 28, color:'#44ffaa', spawnInterval:0.65},
      { count: 28, hp:1120, speed:3.2, gold: 30, color:'#44aaff', spawnInterval:0.6 },
      { count: 30, hp:1450, speed:3.3, gold: 34, color:'#8844ff', spawnInterval:0.55},
      { count: 32, hp:1850, speed:3.5, gold: 36, color:'#ff44cc', spawnInterval:0.5 },
      { count: 35, hp:2400, speed:3.6, gold: 38, color:'#ff8822', spawnInterval:0.48},
      { count: 38, hp:3100, speed:3.7, gold: 40, color:'#ff2222', spawnInterval:0.45},
      { count: 42, hp:4000, speed:3.9, gold: 44, color:'#cc00ff', spawnInterval:0.42},
      { count: 50, hp:5500, speed:4.1, gold: 45, color:'#ffffff', spawnInterval:0.4 }
    ]
  }
];

// Aktives Level: WAVE_DEFS und TOTAL_WAVES werden beim Levelstart gesetzt,
// damit der restliche Code (wave.js, ui.js, game.js) unverändert bleibt.
var WAVE_DEFS = LEVEL_DEFS[0].waves;
var TOTAL_WAVES = WAVE_DEFS.length;
