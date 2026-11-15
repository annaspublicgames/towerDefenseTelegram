/**
 * UI — HUD, Turmauswahl, Wellen-Button, Overlay.
 */
var hudLives, hudGold, hudWave, waveInfoEl, btnWave, btnUpgrade, btnSpeed;
var towerBtns = {};
var selectedTowerType = null;

function uiInit(onTowerSelect, onStartWave, onRestart) {
  hudLives   = document.getElementById('hud-lives');
  hudGold    = document.getElementById('hud-gold');
  hudWave    = document.getElementById('hud-wave');
  waveInfoEl = document.getElementById('wave-info');
  btnWave    = document.getElementById('btn-start-wave');
  btnUpgrade = document.getElementById('btn-upgrade');
  btnSpeed   = document.getElementById('btn-speed');

  towerBtns.normal = document.getElementById('btn-tower-normal');
  towerBtns.splash = document.getElementById('btn-tower-splash');
  towerBtns.slow   = document.getElementById('btn-tower-slow');

  ['normal','splash','slow'].forEach(function (type) {
    towerBtns[type].addEventListener('click', function () {
      if (towerBtns[type].classList.contains('cant-afford')) return;
      if (selectedTowerType === type) {
        selectedTowerType = null;
      } else {
        selectedTowerType = type;
      }
      onTowerSelect(selectedTowerType);
      uiUpdateBtnStyles();
    });
  });

  btnWave.addEventListener('click', onStartWave);
  document.getElementById('restart-btn').addEventListener('click', onRestart);

  // Overlay-Navigation: nächstes Level bzw. zurück zur Übersicht
  document.getElementById('next-level-btn').addEventListener('click', function () {
    uiHideOverlay();
    startLevel(currentLevelIndex + 1);
  });
  document.getElementById('levels-btn').addEventListener('click', function () {
    uiHideOverlay();
    showLevelSelect();
  });

  btnUpgrade.addEventListener('click', function () {
    if (btnUpgrade.disabled) return;
    upgradeTowers();
  });

  if (btnSpeed) btnSpeed.addEventListener('click', function () {
    cycleGameSpeed();
  });

  uiDrawTowerIcons();
}

// Aktualisiert die Beschriftung des Geschwindigkeits-Buttons (1× / 2× / 3×).
function uiRefreshSpeed(speed) {
  if (!btnSpeed) return;
  btnSpeed.textContent = '⏩ ' + speed + '×';
  btnSpeed.classList.toggle('fast', speed > 1);
}

// Blendet den Upgrade-Button je nach Level ein/aus (nur Level mit upgrades:true).
function uiInitUpgrade(enabled) {
  if (!btnUpgrade) return;
  btnUpgrade.style.display = enabled ? '' : 'none';
  uiRefreshUpgrade();
}

// Aktualisiert Beschriftung und Verfügbarkeit des Upgrade-Buttons.
function uiRefreshUpgrade() {
  if (!btnUpgrade || btnUpgrade.style.display === 'none') return;
  var maxLvl = (typeof maxUpgradeLevelForCurrent === 'function')
    ? maxUpgradeLevelForCurrent() : UPGRADE_DEF.maxLevel;
  if (towerUpgradeLevel >= maxLvl) {
    btnUpgrade.disabled = true;
    btnUpgrade.textContent = '⬆ Upgrade max (Stufe ' + towerUpgradeLevel + ')';
    return;
  }
  var cost = upgradeCost();
  btnUpgrade.textContent = '⬆ Alle Türme upgraden (Stufe ' +
    (towerUpgradeLevel + 1) + ') · 💰 ' + cost;
  btnUpgrade.disabled = (typeof gold === 'number' && gold < cost) ||
                        gameState !== 'playing';
}

// Zeichnet das Icon jedes Kauf-Buttons. Pro Slot wird der aktuell aktive
// Turmtyp (Basis oder freigeschaltete Variante) dargestellt.
function uiDrawTowerIcons() {
  ['normal','splash','slow'].forEach(function (slot) {
    var canvas = towerBtns[slot].querySelector('.tower-icon');
    if (!canvas) return;
    var type   = (typeof activeTypeForSlot === 'function') ? activeTypeForSlot(slot) : slot;
    var sprite = TOWER_SPRITES[type];
    if (!sprite) return;

    function render() {
      // Interne Auflösung an das CSS-Maß koppeln (scharf auf allen Displays)
      var cssW = canvas.clientWidth  || 26;
      var cssH = canvas.clientHeight || 48;
      var dpr  = window.devicePixelRatio || 1;
      canvas.width  = cssW * dpr;
      canvas.height = cssH * dpr;

      var ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (sprite.static) {
        // Statisches Einzelbild: ganzes Bild, quadratisch unten zentriert.
        var side = Math.min(canvas.width, canvas.height);
        var dx = (canvas.width  - side) / 2;
        var dy = canvas.height - side;
        ctx.drawImage(sprite.img, 0, 0, sprite.img.width, sprite.img.height,
                      dx, dy, side, side);
      } else {
        // Erster Frame des 70x130-Spritesheets.
        ctx.drawImage(sprite.img,
          0, 0, TOWER_FRAME_W, TOWER_FRAME_H,
          0, 0, canvas.width, canvas.height);
      }
    }

    if (sprite.loaded) {
      render();
    } else {
      sprite.img.addEventListener('load', render);
    }
  });
}

// Aktualisiert Name und Kosten jedes Kauf-Buttons entsprechend dem aktuell
// aktiven Turmtyp je Slot (Basis oder freigeschaltete Variante).
function uiRefreshTowerButtons() {
  ['normal','splash','slow'].forEach(function (slot) {
    var btn  = towerBtns[slot];
    if (!btn) return;
    var type = (typeof activeTypeForSlot === 'function') ? activeTypeForSlot(slot) : slot;
    var def  = TOWER_DEFS[type];
    if (!def) return;
    var nameEl = btn.querySelector('.tname');
    var costEl = btn.querySelector('.tcost');
    if (nameEl) nameEl.textContent = def.name;
    if (costEl) costEl.textContent = '💰 ' + def.cost;
  });
  uiDrawTowerIcons();
}

function uiUpdateBtnStyles() {
  ['normal','splash','slow'].forEach(function (type) {
    towerBtns[type].classList.toggle('selected', type === selectedTowerType);
  });
}

function uiUpdate(lives, gold, waveNum) {
  hudLives.textContent = lives;
  hudGold.textContent  = gold;
  hudWave.textContent  = waveNum + ' / ' + TOTAL_WAVES;

  ['normal','splash','slow'].forEach(function (slot) {
    var type = (typeof activeTypeForSlot === 'function') ? activeTypeForSlot(slot) : slot;
    towerBtns[slot].classList.toggle('cant-afford', gold < TOWER_DEFS[type].cost);
  });

  uiRefreshUpgrade();
}

function uiSetWaveState(state, waveNum) {
  if (state === 'ready') {
    btnWave.disabled = false;
    btnWave.textContent = waveNum < TOTAL_WAVES
      ? '▶ Welle ' + (waveNum+1) + ' starten'
      : '▶ Letzte Welle!';
    waveInfoEl.textContent = '';
  } else if (state === 'running') {
    btnWave.disabled = true;
    btnWave.textContent = '⌛ Welle läuft...';
    waveInfoEl.textContent = '';
  } else {
    btnWave.disabled = true;
    btnWave.textContent = '—';
    waveInfoEl.textContent = '';
  }
}

function uiShowOverlay(type, gold) {
  var overlay = document.getElementById('overlay');
  overlay.classList.add('active');
  var title     = document.getElementById('overlay-title');
  var msg       = document.getElementById('overlay-msg');
  var nextBtn   = document.getElementById('next-level-btn');
  var restartBtn= document.getElementById('restart-btn');

  if (type === 'victory') {
    title.className = 'win';
    title.textContent = '🏆 Sieg!';
    var reward = (typeof lastTalerReward === 'number') ? lastTalerReward : 0;
    var talerLine = reward > 0 ? ' · +' + reward + ' Taler 🪙' : '';
    var hasNext = hasNextLevel(currentLevelIndex);
    if (hasNext) {
      msg.textContent = LEVEL_DEFS[currentLevelIndex].name +
        ' geschafft! Nächstes Level freigeschaltet.' + talerLine;
      nextBtn.style.display = '';
    } else {
      msg.textContent = 'Alle Level gemeistert! Gold übrig: ' + gold + talerLine;
      nextBtn.style.display = 'none';
    }
    restartBtn.textContent = 'Nochmal';
  } else {
    title.className = 'lose';
    title.textContent = '💀 Game Over';
    var defeatReward = (typeof lastTalerReward === 'number') ? lastTalerReward : 0;
    msg.textContent = defeatReward > 0
      ? 'Alle Leben verloren. Für deinen Fortschritt: +' + defeatReward + ' Taler 🪙'
      : 'Alle Leben verloren. Versuche es nochmal!';
    nextBtn.style.display = 'none';
    restartBtn.textContent = 'Neu starten';
  }
}

function uiHideOverlay() {
  document.getElementById('overlay').classList.remove('active');
}
