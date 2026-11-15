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

// Basiswerte aller Türme. Zusätzliche, typ-spezifische Felder:
//   splashR     — Flächenschaden-Radius in Kacheln (0 = kein Flächenschaden)
//   slowFactor  — Geschwindigkeitsfaktor beim Treffer (<1 = verlangsamt)
//   slowDur     — Dauer der Verlangsamung in Sekunden
//   dotDamage   — Giftschaden pro Sekunde (Schaden über Zeit)
//   dotDuration — Dauer des Giftschadens in Sekunden
//   chainTargets— Anzahl zusätzlicher Kettensprünge (0 = kein Ketteneffekt)
//   chainRange  — Reichweite eines Kettensprungs in Kacheln
//   slowSplashR — Radius für Flächen-Verlangsamung in Kacheln (Eiskanone)
var TOWER_DEFS = {
  normal: { name:'Normal', cost:50, damage:25, range:3.0, fireRate:1.2, projSpeed:220, color:'#4a90d9', projColor:'#ffe04b', splashR:0, slowFactor:1,   slowDur:0   },
  splash: { name:'Splash', cost:80, damage:20, range:2.8, fireRate:0.6, projSpeed:180, color:'#e05c20', projColor:'#ff9955', splashR:2, slowFactor:1,   slowDur:0   },
  slow:   { name:'Slow',   cost:60, damage:10, range:3.5, fireRate:1.0, projSpeed:160, color:'#30b090', projColor:'#aaffee', splashR:0, slowFactor:0.4, slowDur:2.5 },

  // ─── Shop-Varianten (ersetzen je einen Basis-Slot) ──────
  // Giftturm (ersetzt Normal): etwas schwächerer Direktschaden, dafür
  // zusätzlicher Schaden über Zeit (DoT).
  poison: { name:'Giftturm', cost:50, damage:25, range:4, fireRate:1.6, projSpeed:230, color:'#5aa02a', projColor:'#9be23a', splashR:0, slowFactor:1, slowDur:0,
            dotDamage:25, dotDuration:6.0 },
  // Blitzturm (ersetzt Splash): Einzelschuss, der auf weitere nahe Gegner
  // überspringt (Kette) statt Flächenschaden.
  chain:  { name:'Blitzturm', cost:80, damage:24, range:3.0, fireRate:0.9, projSpeed:300, color:'#c8a8ff', projColor:'#e8e0ff', splashR:0, slowFactor:1, slowDur:0,
            chainTargets:3, chainRange:2.2 },
  // Eiskanone (ersetzt Slow): verlangsamt wie der Slow-Turm, zusätzlich
  // Flächen-Verlangsamung aller Gegner im Umkreis des Einschlags.
  ice:    { name:'Eiskanone', cost:60, damage:10, range:3.5, fireRate:1.0, projSpeed:160, color:'#4ec8e0', projColor:'#d0f6ff', splashR:0, slowFactor:0.4, slowDur:2.5,
            slowSplashR:1.6 }
};

// ─── Slot-Modell: Basis-Turm ↔ Shop-Variante ──────────────
// Jeder Shop-Slot entspricht einem der drei Basistürme und kann durch seine
// freigeschaltete Variante ersetzt werden. Der Slot-Key bleibt der Basistyp.
var TOWER_SLOTS = {
  normal: { base: 'normal', variant: 'poison' },
  splash: { base: 'splash', variant: 'chain'  },
  slow:   { base: 'slow',   variant: 'ice'    }
};

// ─── Shop-Angebot: kaufbare Varianten ─────────────────────
// Preis in Talern, plus Anzeigetexte für die Shop-Karten. Der "slot" verweist
// auf den Basis-Slot, den die Variante ersetzt.
var VARIANT_SHOP = [
  { variant:'poison', slot:'normal', name:'Giftturm',  price:120,
    desc:'Ersetzt Normal. Vergiftet Gegner: Schaden über Zeit.' },
  { variant:'chain',  slot:'splash', name:'Blitzturm', price:180,
    desc:'Ersetzt Splash. Blitz springt auf weitere nahe Gegner.' },
  { variant:'ice',    slot:'slow',   name:'Eiskanone', price:150,
    desc:'Ersetzt Slow. Verlangsamt zusätzlich alle Gegner im Umkreis.' }
];

// ─── Taler-Belohnung beim Levelsieg ───────────────────────
// Belohnung = floor(TALER_BASE + levelIndex*TALER_PER_LEVEL + lives*TALER_PER_LIFE).
// Beim Wiederholen eines bereits geschafften Levels wird der Betrag mit
// TALER_REPEAT_FACTOR multipliziert.
var TALER_BASE          = 20;
var TALER_PER_LEVEL     = 15;   // je Level-Index (0-basiert) zusätzlich
var TALER_PER_LIFE      = 2;    // je übrig gebliebenem Leben
var TALER_REPEAT_FACTOR = 0.25; // Wiederholung gibt 25 %

// Trostbelohnung bei Niederlage: ein Anteil der vollen Levelbelohnung,
// skaliert mit dem Fortschritt (Anteil geschaffter Wellen). Die übrigen Leben
// gehen hier nicht ein (man hat ja verloren); Basis ist TALER_BASE + Level.
var TALER_DEFEAT_FACTOR = 0.4;  // max. 40 % der Grundbelohnung bei fast geschafft

// ─── Endlos-Modus ─────────────────────────────────────────
// Prozedural erzeugte, endlos stärker werdende Wellen. Keine Siegbedingung;
// das Spiel endet erst bei 0 Leben. Gewertet wird nach erreichter Welle
// (primär) und getöteten Gegnern (sekundär). Keine Taler.
var ENDLESS_START_GOLD  = 600;
var ENDLESS_START_LIVES = 20;
var ENDLESS_MAX_UPGRADE_LEVEL = 5; // erweiterte Upgrade-Obergrenze im Endlos-Modus

// Skalierungs-Parameter der prozeduralen Wellen (n = 1-basierte Wellennummer).
var ENDLESS_CFG = {
  // Gegneranzahl: wächst langsam und wird gedeckelt.
  countBase:     10,
  countPerWave:  0.8,
  countMax:      70,
  // HP: exponentielles Wachstum (fordernd, aber mit Shop/Upgrades machbar).
  hpBase:        70,
  hpGrowth:      1.14,   // je Welle ×
  // Tempo: steigt leicht, mit Obergrenze.
  speedBase:     1.9,
  speedPerWave:  0.045,
  speedMax:      5.2,
  // Gold je Kill: steigt leicht mit der Welle.
  goldBase:      8,
  goldPerWave:   0.5,
  goldMax:       45,
  // Spawn-Intervall: sinkt mit der Welle, mit Untergrenze.
  intervalBase:  1.1,
  intervalDecay: 0.03,
  intervalMin:   0.28
};

// ─── Turm-Upgrade ─────────────────────────────────────────
// In Leveln mit "upgrades:true" kann ein globales Upgrade gekauft werden:
// Es verstärkt ALLE Türme (auch bereits platzierte) um eine Stufe.
// Pro Stufe werden Schaden, Reichweite und Feuerrate multipliziert; bei
// Slow-Türmen verstärkt sich zusätzlich die Verlangsamung (längere Dauer,
// stärkerer Faktor). Die Kosten steigen je gekaufter Stufe.
var UPGRADE_DEF = {
  maxLevel:      3,
  baseCost:      150,  // Kosten der ersten Stufe
  costGrowth:    2.7,  // jede weitere Stufe kostet so viel mehr
  damageMult:    1.15, // Schaden je Stufe ×
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
    desc: 'Die Horde · Turm-Upgrades',
    startGold: 500,
    startLives: 15,
    upgrades: true,
    waves: [
      { count: 16, hp: 220, speed:2.5, gold: 16, color:'#ff6666', spawnInterval:0.9 },
      { count: 18, hp: 300, speed:2.6, gold: 18, color:'#ff8844', spawnInterval:0.85},
      { count: 20, hp: 400, speed:2.7, gold: 22, color:'#ffaa44', spawnInterval:0.8 },
      { count: 22, hp: 520, speed:2.9, gold: 24, color:'#dddd44', spawnInterval:0.75},
      { count: 24, hp: 680, speed:3.0, gold: 26, color:'#aaff44', spawnInterval:0.7 },
      { count: 26, hp: 880, speed:3.1, gold: 28, color:'#44ffaa', spawnInterval:0.65},
      { count: 28, hp:1120, speed:3.2, gold: 30, color:'#44aaff', spawnInterval:0.6 },
      { count: 30, hp:1450, speed:3.3, gold: 30, color:'#8844ff', spawnInterval:0.55},
      { count: 32, hp:1850, speed:3.5, gold: 30, color:'#ff44cc', spawnInterval:0.5 },
      { count: 35, hp:2400, speed:3.6, gold: 30, color:'#ff8822', spawnInterval:0.48},
      { count: 38, hp:3100, speed:3.7, gold: 35, color:'#ff2222', spawnInterval:0.45},
      { count: 42, hp:4000, speed:3.9, gold: 35, color:'#cc00ff', spawnInterval:0.42},
      { count: 50, hp:5500, speed:4.1, gold: 40, color:'#ffffff', spawnInterval:0.4 }
    ]
  },
  {
    name: 'Level 4',
    desc: 'Eiszeit · Turm-Upgrades (4 Stufen)',
    startGold: 650,
    startLives: 14,
    upgrades: true,
    maxUpgradeLevel: 4,
    waves: [
      { count: 20, hp: 320, speed:2.7, gold: 18, color:'#ff6666', spawnInterval:0.8 },
      { count: 22, hp: 430, speed:2.8, gold: 20, color:'#ff8844', spawnInterval:0.75},
      { count: 24, hp: 580, speed:2.9, gold: 22, color:'#ffaa44', spawnInterval:0.7 },
      { count: 26, hp: 760, speed:3.1, gold: 24, color:'#dddd44', spawnInterval:0.65},
      { count: 28, hp:1000, speed:3.2, gold: 26, color:'#aaff44', spawnInterval:0.6 },
      { count: 30, hp:1300, speed:3.3, gold: 28, color:'#44ffaa', spawnInterval:0.55},
      { count: 32, hp:1700, speed:3.4, gold: 32, color:'#44aaff', spawnInterval:0.52},
      { count: 34, hp:2200, speed:3.6, gold: 34, color:'#8844ff', spawnInterval:0.5 },
      { count: 36, hp:2850, speed:3.7, gold: 36, color:'#ff44cc', spawnInterval:0.48},
      { count: 38, hp:3650, speed:3.9, gold: 38, color:'#ff8822', spawnInterval:0.45},
      { count: 42, hp:4700, speed:4.0, gold: 38, color:'#ff2222', spawnInterval:0.42},
      { count: 46, hp:6000, speed:4.2, gold: 38, color:'#cc00ff', spawnInterval:0.4 },
      { count: 52, hp:7700, speed:4.3, gold: 42, color:'#00e5ff', spawnInterval:0.38},
      { count: 60, hp:9800, speed:4.5, gold: 50, color:'#ffffff', spawnInterval:0.35}
    ]
  },
  {
    name: 'Level 5',
    desc: 'Endzeit · Turm-Upgrades (4 Stufen)',
    startGold: 800,
    startLives: 12,
    upgrades: true,
    maxUpgradeLevel: 4,
    waves: [
      { count: 24, hp:  460, speed:3.0, gold: 20, color:'#ff6666', spawnInterval:0.7 },
      { count: 26, hp:  620, speed:3.1, gold: 22, color:'#ff8844', spawnInterval:0.65},
      { count: 28, hp:  840, speed:3.2, gold: 24, color:'#ffaa44', spawnInterval:0.6 },
      { count: 30, hp: 1120, speed:3.4, gold: 26, color:'#dddd44', spawnInterval:0.55},
      { count: 32, hp: 1480, speed:3.5, gold: 28, color:'#aaff44', spawnInterval:0.52},
      { count: 34, hp: 1950, speed:3.6, gold: 30, color:'#44ffaa', spawnInterval:0.5 },
      { count: 36, hp: 2550, speed:3.8, gold: 32, color:'#44aaff', spawnInterval:0.48},
      { count: 38, hp: 3350, speed:3.9, gold: 32, color:'#8844ff', spawnInterval:0.45},
      { count: 40, hp: 4400, speed:4.1, gold: 34, color:'#ff44cc', spawnInterval:0.43},
      { count: 42, hp: 5750, speed:4.2, gold: 36, color:'#ff8822', spawnInterval:0.4 },
      { count: 46, hp: 7500, speed:4.4, gold: 40, color:'#ff2222', spawnInterval:0.38},
      { count: 50, hp: 9800, speed:4.5, gold: 44, color:'#cc00ff', spawnInterval:0.36},
      { count: 56, hp:12800, speed:4.7, gold: 50, color:'#00e5ff', spawnInterval:0.34},
      { count: 62, hp:16500, speed:4.8, gold: 56, color:'#ffd700', spawnInterval:0.32},
      { count: 70, hp:21000, speed:5.0, gold: 70, color:'#ffffff', spawnInterval:0.3 }
    ]
  }
];

// Aktives Level: WAVE_DEFS und TOTAL_WAVES werden beim Levelstart gesetzt,
// damit der restliche Code (wave.js, ui.js, game.js) unverändert bleibt.
var WAVE_DEFS = LEVEL_DEFS[0].waves;
var TOTAL_WAVES = WAVE_DEFS.length;
