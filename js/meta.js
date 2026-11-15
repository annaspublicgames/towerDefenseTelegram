/**
 * meta.js — Meta-Fortschritt über Levels hinweg.
 *
 * Kapselt alles, was zwischen den Levels bestehen bleibt und im Shop
 * verwendet wird:
 *   - Taler (Meta-Währung, verdient durchs Durchspielen von Leveln)
 *   - gekaufte Turm-Varianten (Freischaltungen)
 *   - aktive Slot-Auswahl (Basis- oder Varianten-Turm je Slot)
 *   - "erstmals geschafft"-Flags je Level (für reduzierte Wiederholungs-Belohnung)
 *
 * Alles wird in localStorage gespeichert, mit Fallback auf Variablen, falls
 * der Speicher gesperrt ist (gleiches Muster wie levels.js).
 */

// ─── Speicher-Schlüssel ───────────────────────────────────
var TALERS_KEY        = 'td_talers';
var OWNED_KEY         = 'td_owned_variants';
var ACTIVE_SLOTS_KEY  = 'td_active_slots';
var CLEARED_KEY       = 'td_cleared_levels';

// ─── Fallback-Zustand (wenn localStorage nicht verfügbar) ──
var _talersFallback      = 0;
var _ownedFallback       = '';   // CSV der gekauften Varianten, z.B. "poison,ice"
var _activeSlotsFallback = '';   // CSV "slot:type", z.B. "normal:poison,slow:ice"
var _clearedFallback     = '';   // CSV der geschafften Level-Indizes, z.B. "0,1"

// ─── kleine localStorage-Helfer ───────────────────────────
function _metaRead(key, fallback) {
  try {
    var v = localStorage.getItem(key);
    if (v === null || v === undefined) return fallback;
    return v;
  } catch (e) { /* localStorage gesperrt */ }
  return fallback;
}

function _metaWrite(key, value) {
  try { localStorage.setItem(key, String(value)); } catch (e) { /* ignorieren */ }
}

// CSV ↔ Array (leere Einträge herausfiltern)
function _csvToArray(csv) {
  if (!csv) return [];
  return csv.split(',').map(function (s) { return s.trim(); })
            .filter(function (s) { return s.length > 0; });
}
function _arrayToCsv(arr) { return arr.join(','); }

// ─── Taler (Meta-Währung) ─────────────────────────────────
function getTalers() {
  var v = parseInt(_metaRead(TALERS_KEY, String(_talersFallback)), 10);
  if (isNaN(v) || v < 0) v = 0;
  return v;
}

function setTalers(n) {
  n = Math.max(0, Math.floor(n));
  _talersFallback = n;
  _metaWrite(TALERS_KEY, n);
  return n;
}

function addTalers(n) {
  return setTalers(getTalers() + Math.floor(n));
}

// Zieht n Taler ab, wenn genug vorhanden. Gibt true bei Erfolg zurück.
function spendTalers(n) {
  n = Math.floor(n);
  if (getTalers() < n) return false;
  setTalers(getTalers() - n);
  return true;
}

// ─── Gekaufte Varianten ───────────────────────────────────
function _getOwnedArray() {
  return _csvToArray(_metaRead(OWNED_KEY, _ownedFallback));
}

function getOwned(variant) {
  return _getOwnedArray().indexOf(variant) !== -1;
}

function setOwned(variant) {
  var owned = _getOwnedArray();
  if (owned.indexOf(variant) === -1) {
    owned.push(variant);
    var csv = _arrayToCsv(owned);
    _ownedFallback = csv;
    _metaWrite(OWNED_KEY, csv);
  }
}

// ─── Aktive Slot-Auswahl (Basis- oder Varianten-Turm) ─────
// Speicherformat: CSV aus "slot:type"-Paaren, z.B. "normal:poison,slow:ice".
// Ist für einen Slot nichts gesetzt, gilt der Basistyp (siehe TOWER_SLOTS).
function _getActiveSlotsMap() {
  var map = {};
  var pairs = _csvToArray(_metaRead(ACTIVE_SLOTS_KEY, _activeSlotsFallback));
  for (var i = 0; i < pairs.length; i++) {
    var kv = pairs[i].split(':');
    if (kv.length === 2) map[kv[0]] = kv[1];
  }
  return map;
}

function _saveActiveSlotsMap(map) {
  var pairs = [];
  for (var slot in map) {
    if (map.hasOwnProperty(slot)) pairs.push(slot + ':' + map[slot]);
  }
  var csv = _arrayToCsv(pairs);
  _activeSlotsFallback = csv;
  _metaWrite(ACTIVE_SLOTS_KEY, csv);
}

// Liefert den für einen Slot aktiv gewählten Turmtyp, oder null, wenn nichts
// gesetzt ist (dann gilt der Basistyp).
function getActiveSlotType(slot) {
  var map = _getActiveSlotsMap();
  return map.hasOwnProperty(slot) ? map[slot] : null;
}

function setActiveSlotType(slot, type) {
  var map = _getActiveSlotsMap();
  map[slot] = type;
  _saveActiveSlotsMap(map);
}

// ─── "Erstmals geschafft"-Flags je Level ──────────────────
function _getClearedArray() {
  return _csvToArray(_metaRead(CLEARED_KEY, _clearedFallback));
}

function isLevelCleared(idx) {
  return _getClearedArray().indexOf(String(idx)) !== -1;
}

function markLevelCleared(idx) {
  var cleared = _getClearedArray();
  if (cleared.indexOf(String(idx)) === -1) {
    cleared.push(String(idx));
    var csv = _arrayToCsv(cleared);
    _clearedFallback = csv;
    _metaWrite(CLEARED_KEY, csv);
  }
}

// ─── Permanentes Turm-Grundlevel je Slot ──────────────────
// Speicherformat: CSV aus "slot:level"-Paaren, z.B. "normal:3,slow:1".
// Ohne Eintrag gilt Grundlevel 0.
var BASE_LEVELS_KEY = 'td_base_levels';
var _baseLevelsFallback = '';

function _getBaseLevelsMap() {
  var map = {};
  var pairs = _csvToArray(_metaRead(BASE_LEVELS_KEY, _baseLevelsFallback));
  for (var i = 0; i < pairs.length; i++) {
    var kv = pairs[i].split(':');
    if (kv.length === 2) {
      var lvl = parseInt(kv[1], 10);
      if (!isNaN(lvl) && lvl > 0) map[kv[0]] = lvl;
    }
  }
  return map;
}

function _saveBaseLevelsMap(map) {
  var pairs = [];
  for (var slot in map) {
    if (map.hasOwnProperty(slot) && map[slot] > 0) pairs.push(slot + ':' + map[slot]);
  }
  var csv = _arrayToCsv(pairs);
  _baseLevelsFallback = csv;
  _metaWrite(BASE_LEVELS_KEY, csv);
}

function getBaseLevel(slot) {
  var map = _getBaseLevelsMap();
  return map.hasOwnProperty(slot) ? map[slot] : 0;
}

function setBaseLevel(slot, n) {
  var map = _getBaseLevelsMap();
  map[slot] = Math.max(0, Math.floor(n));
  _saveBaseLevelsMap(map);
}

// Erhöht das Grundlevel eines Slots um 1 (bis maxLevel) und gibt das neue
// Level zurück.
function incBaseLevel(slot) {
  var cur = getBaseLevel(slot);
  if (cur >= BASE_LEVEL_DEF.maxLevel) return cur;
  setBaseLevel(slot, cur + 1);
  return cur + 1;
}
