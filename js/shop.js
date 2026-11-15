/**
 * shop.js — Meta-Shop: Turm-Varianten mit Talern kaufen und je Slot zwischen
 * Basis-Turm und freigeschalteter Variante umschalten.
 *
 * Aufbau analog zur Level-Auswahl (levels.js): eine Vollbild-Seite, die aus
 * VARIANT_SHOP (constants.js) und dem Meta-Zustand (meta.js) gerendert wird.
 */

// Öffnet den Shop (blendet die Level-Auswahl aus, Shop ein).
// Der Wechsel erfolgt ohne Fade, damit das Spielfeld nicht kurz durchblitzt.
function showShop() {
  gameState = 'menu';
  renderShop();
  instantPanelSwap(function () {
    hideLevelSelect();
    document.getElementById('shop-screen').classList.add('active');
  });
}

function hideShop() {
  document.getElementById('shop-screen').classList.remove('active');
}

// Baut Taler-Anzeige und Varianten-Karten neu auf.
function renderShop() {
  var talerEl = document.getElementById('shop-talers');
  if (talerEl) talerEl.textContent = getTalers();

  var list = document.getElementById('shop-list');
  list.innerHTML = '';

  for (var i = 0; i < VARIANT_SHOP.length; i++) {
    (function (entry) {
      var owned  = getOwned(entry.variant);
      var active = getActiveSlotType(entry.slot) === entry.variant && owned;
      var talers = getTalers();

      var card = document.createElement('div');
      card.className = 'shop-card' + (owned ? ' owned' : '');

      // Icon-Canvas (zeichnet den Varianten-Sprite)
      var iconWrap = document.createElement('div');
      iconWrap.className = 'shop-icon-wrap';
      var icon = document.createElement('canvas');
      icon.className = 'shop-icon';
      iconWrap.appendChild(icon);

      // Textblock
      var info = document.createElement('div');
      info.className = 'shop-info';
      info.innerHTML =
        '<div class="shop-name">' + entry.name + '</div>' +
        '<div class="shop-desc">' + entry.desc + '</div>';

      // Aktion: Kaufen (wenn nicht besessen) oder Umschalter (wenn besessen)
      var action = document.createElement('div');
      action.className = 'shop-action';

      if (!owned) {
        var buyBtn = document.createElement('button');
        buyBtn.className = 'shop-btn buy-btn';
        buyBtn.textContent = '🪙 ' + entry.price + ' · Kaufen';
        if (talers < entry.price) {
          buyBtn.disabled = true;
          buyBtn.classList.add('cant-afford');
        }
        buyBtn.addEventListener('click', function () {
          if (getTalers() < entry.price) return;
          if (spendTalers(entry.price)) {
            setOwned(entry.variant);
            setActiveSlotType(entry.slot, entry.variant); // direkt aktivieren
            tgHaptic('success');
            renderShop();
          }
        });
        action.appendChild(buyBtn);
      } else {
        var toggle = document.createElement('button');
        toggle.className = 'shop-btn toggle-btn' + (active ? ' on' : '');
        toggle.textContent = active ? '✓ Variante aktiv' : 'Basis aktiv';
        toggle.addEventListener('click', function () {
          var slotDef = TOWER_SLOTS[entry.slot];
          var nowActive = getActiveSlotType(entry.slot) === entry.variant;
          setActiveSlotType(entry.slot, nowActive ? slotDef.base : entry.variant);
          tgHaptic('medium');
          renderShop();
        });
        action.appendChild(toggle);

        var hint = document.createElement('div');
        hint.className = 'shop-hint';
        hint.textContent = active
          ? 'Ersetzt den ' + TOWER_DEFS[TOWER_SLOTS[entry.slot].base].name + '-Turm'
          : 'Tippen, um die Variante zu nutzen';
        action.appendChild(hint);
      }

      card.appendChild(iconWrap);
      card.appendChild(info);
      card.appendChild(action);

      // ─── Grundlevel-Bereich (permanent, mit Talern) ───
      card.appendChild(buildBaseLevelRow(entry.slot));

      list.appendChild(card);

      drawShopIcon(icon, entry.variant);
    })(VARIANT_SHOP[i]);
  }
}

// Baut den Grundlevel-Bereich einer Turm-Karte: Fortschrittsanzeige "X/5"
// und einen Upgrade-Button mit Taler-Preis (bzw. "Max" bei voller Stufe).
// Das Grundlevel gilt pro Slot und verstärkt Basis- wie Varianten-Turm.
function buildBaseLevelRow(slot) {
  var row = document.createElement('div');
  row.className = 'base-level-row';

  var lvl = getBaseLevel(slot);
  var max = BASE_LEVEL_DEF.maxLevel;

  // Fortschritt: X/5 plus kleine Pips
  var info = document.createElement('div');
  info.className = 'bl-info';
  var pips = '';
  for (var i = 0; i < max; i++) {
    pips += '<span class="bl-pip' + (i < lvl ? ' on' : '') + '"></span>';
  }
  info.innerHTML =
    '<span class="bl-label">Grundlevel ' + lvl + '/' + max + '</span>' +
    '<span class="bl-pips">' + pips + '</span>';
  row.appendChild(info);

  var btn = document.createElement('button');
  btn.className = 'shop-btn bl-btn';
  if (lvl >= max) {
    btn.disabled = true;
    btn.textContent = '✓ Max';
  } else {
    var cost = baseLevelCost(lvl);
    btn.textContent = '⬆ 🪙 ' + cost;
    if (getTalers() < cost) {
      btn.disabled = true;
      btn.classList.add('cant-afford');
    }
    btn.addEventListener('click', function () {
      var price = baseLevelCost(getBaseLevel(slot));
      if (getTalers() < price) return;
      if (spendTalers(price)) {
        incBaseLevel(slot);
        tgHaptic('success');
        renderShop();
      }
    });
  }
  row.appendChild(btn);

  return row;
}

// Zeichnet den Sprite einer Variante in das Shop-Karten-Icon.
function drawShopIcon(canvas, type) {
  var sprite = TOWER_SPRITES[type];
  if (!sprite) return;

  function render() {
    var cssW = canvas.clientWidth  || 48;
    var cssH = canvas.clientHeight || 48;
    var dpr  = window.devicePixelRatio || 1;
    canvas.width  = cssW * dpr;
    canvas.height = cssH * dpr;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (sprite.static) {
      var side = Math.min(canvas.width, canvas.height);
      var dx = (canvas.width  - side) / 2;
      var dy = (canvas.height - side) / 2;
      ctx.drawImage(sprite.img, 0, 0, sprite.img.width, sprite.img.height,
                    dx, dy, side, side);
    } else {
      ctx.drawImage(sprite.img, 0, 0, TOWER_FRAME_W, TOWER_FRAME_H,
                    0, 0, canvas.width, canvas.height);
    }
  }

  if (sprite.loaded) render();
  else sprite.img.addEventListener('load', render);
}

// Bindet die Navigations-Buttons einmalig (Shop öffnen/schließen).
function shopInit() {
  var openBtn = document.getElementById('open-shop-btn');
  if (openBtn) openBtn.addEventListener('click', function () {
    tgHaptic('light');
    showShop();
  });
  var backBtn = document.getElementById('shop-back-btn');
  if (backBtn) backBtn.addEventListener('click', function () {
    // Wechsel Shop → Level-Auswahl ohne Fade (kein Durchblitzen des Spielfelds).
    instantPanelSwap(function () {
      hideShop();
      showLevelSelect();
    });
  });
}
