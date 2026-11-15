/**
 * levels.js — Level-Fortschritt und Level-Auswahl-Übersicht.
 *
 * Speichert, bis zu welchem Level der Spieler freigeschaltet ist
 * (localStorage, mit Fallback auf eine Variable, falls Speicher gesperrt ist).
 * Baut die Übersichtsseite auf und startet das gewählte Level.
 */
var PROGRESS_KEY = 'td_unlocked_levels';
var _unlockedFallback = 1; // Fallback, wenn localStorage nicht verfügbar ist
var currentLevelIndex = 0; // 0-basiert; Index in LEVEL_DEFS

// ─── Fortschritt laden / speichern ────────────────────────
function getUnlockedCount() {
  try {
    var v = parseInt(localStorage.getItem(PROGRESS_KEY), 10);
    if (!isNaN(v) && v >= 1) return Math.min(v, LEVEL_DEFS.length);
  } catch (e) { /* localStorage gesperrt */ }
  return _unlockedFallback;
}

function setUnlockedCount(n) {
  n = Math.min(Math.max(n, 1), LEVEL_DEFS.length);
  _unlockedFallback = n;
  try { localStorage.setItem(PROGRESS_KEY, String(n)); } catch (e) { /* ignorieren */ }
}

// Schaltet das Level nach dem angegebenen (0-basierten) Index frei.
function unlockNextLevel(levelIndex) {
  setUnlockedCount(Math.max(getUnlockedCount(), levelIndex + 2));
}

function isLevelUnlocked(levelIndex) {
  return levelIndex < getUnlockedCount();
}

function hasNextLevel(levelIndex) {
  return levelIndex + 1 < LEVEL_DEFS.length;
}

// ─── Level-Auswahl-Seite ──────────────────────────────────
function showLevelSelect() {
  gameState = 'menu';
  var screen = document.getElementById('level-select');
  var list   = document.getElementById('level-list');
  var unlocked = getUnlockedCount();

  list.innerHTML = '';
  for (var i = 0; i < LEVEL_DEFS.length; i++) {
    (function (idx) {
      var def = LEVEL_DEFS[idx];
      var locked = !isLevelUnlocked(idx);

      var card = document.createElement('button');
      card.className = 'level-card' + (locked ? ' locked' : '');
      card.disabled = locked;

      var badge = locked ? '🔒' : (idx + 1);
      card.innerHTML =
        '<span class="level-num">' + badge + '</span>' +
        '<span class="level-name">' + def.name + '</span>' +
        '<span class="level-desc">' + (locked ? 'Gesperrt' : def.desc) +
          ' · ' + def.waves.length + ' Wellen</span>';

      if (!locked) {
        card.addEventListener('click', function () {
          startLevel(idx);
        });
      }
      list.appendChild(card);
    })(i);
  }

  // Endlos-Karte (immer freigeschaltet) unter den normalen Leveln.
  var high = (typeof getEndlessHigh === 'function') ? getEndlessHigh() : null;
  var highText = high
    ? 'Rekord: Welle ' + high.wave + ' · ' + high.kills + ' Kills'
    : 'Noch kein Rekord — spiel den ersten!';
  var endlessCard = document.createElement('button');
  endlessCard.className = 'level-card endless-card';
  endlessCard.innerHTML =
    '<span class="level-num">♾️</span>' +
    '<span class="level-name">Endlos-Modus</span>' +
    '<span class="level-desc">Immer stärkere Wellen · Taler je Welle · ' + highText + '</span>';
  endlessCard.addEventListener('click', function () {
    startEndless();
    hideLevelSelect();
  });
  list.appendChild(endlessCard);

  screen.classList.add('active');
}

function hideLevelSelect() {
  document.getElementById('level-select').classList.remove('active');
}

// Führt einen Wechsel zwischen zwei Vollbild-Menüs (Level-Auswahl ↔ Shop)
// ohne Ein-/Ausblenden durch. Beide Panels sind deckend; ein Fade würde kurz
// das Spielfeld dahinter durchscheinen lassen. Während "fn" läuft, ist die
// no-anim-Klasse aktiv; sie wird nach einem Frame wieder entfernt, damit
// spätere Übergänge (z.B. ins Spiel) weiter animiert sind.
function instantPanelSwap(fn) {
  document.body.classList.add('no-anim');
  fn();
  // Reflow erzwingen, damit no-anim für diesen Tausch garantiert greift.
  void document.body.offsetWidth;
  requestAnimationFrame(function () {
    document.body.classList.remove('no-anim');
  });
}

// Startet ein Level: aktives Level setzen, Übersicht ausblenden, Spiel init.
function startLevel(levelIndex) {
  endlessMode = false;         // normale Level: Endlos-Modus deaktivieren
  currentLevelIndex = levelIndex;
  var def = LEVEL_DEFS[levelIndex];
  WAVE_DEFS   = def.waves;
  TOTAL_WAVES = def.waves.length;
  hideLevelSelect();
  init();
  tgHaptic('medium');
}
