/**
 * Tower & Projectile — alle drei Turmtypen und ihre Geschosse.
 */
function Projectile(x, y, target, def) {
  this.x      = x;
  this.y      = y;
  this.target = target;
  this.def    = def;
  this.speed  = def.projSpeed;
  this.dead   = false;
  this.color  = def.projColor;
}

Projectile.prototype.update = function (dt, enemies) {
  if (this.dead) return;
  var tx = this.target.x, ty = this.target.y;
  var dx = tx - this.x, dy = ty - this.y;
  var dist = Math.sqrt(dx*dx + dy*dy);

  if (dist < this.speed * dt + 2) {
    this.dead = true;
    if (typeof spawnHit === 'function') spawnHit(tx, ty, this.color);
    if (this.def.splashR > 0) {
      // Flächenschaden (Splash-Turm): trifft alle Gegner im Radius.
      var splashPx = this.def.splashR * CELL;
      for (var i = 0; i < enemies.length; i++) {
        if (enemies[i].dead) continue;
        var ex = enemies[i].x - tx, ey = enemies[i].y - ty;
        if (Math.sqrt(ex*ex+ey*ey) <= splashPx) {
          enemies[i].takeDamage(this.def.damage);
        }
      }
    } else if (this.def.chainTargets > 0) {
      // Kette (Blitzturm): Hauptziel + bis zu N weitere nahe Gegner.
      this._hitChain(enemies);
    } else {
      // Einzelziel (Normal, Slow, Gift, Eis).
      if (!this.target.dead) {
        this._applyHit(this.target, enemies);
      }
    }
    return;
  }
  var nx = dx/dist, ny = dy/dist;
  this.x += nx * this.speed * dt;
  this.y += ny * this.speed * dt;
};

// Wendet Schaden und sämtliche Status-Effekte dieses Projektils auf einen
// einzelnen Gegner an (Direktschaden, Verlangsamung, Gift, Flächen-Slow).
Projectile.prototype._applyHit = function (enemy, enemies) {
  if (!enemy || enemy.dead) return;
  enemy.takeDamage(this.def.damage);

  // Verlangsamung auf das Ziel.
  if (this.def.slowFactor < 1) {
    enemy.applySlow(this.def.slowFactor, this.def.slowDur);

    // Eiskanone: zusätzlich Flächen-Verlangsamung aller Gegner im Umkreis.
    if (this.def.slowSplashR > 0 && enemies) {
      var rPx = this.def.slowSplashR * CELL;
      for (var i = 0; i < enemies.length; i++) {
        if (enemies[i].dead || enemies[i] === enemy) continue;
        var dx = enemies[i].x - enemy.x, dy = enemies[i].y - enemy.y;
        if (Math.sqrt(dx*dx + dy*dy) <= rPx) {
          enemies[i].applySlow(this.def.slowFactor, this.def.slowDur);
        }
      }
    }
  }

  // Giftturm: Schaden über Zeit.
  if (this.def.dotDamage > 0) {
    enemy.applyPoison(this.def.dotDamage, this.def.dotDuration);
  }
};

// Blitzturm: trifft das Hauptziel und springt auf bis zu chainTargets weitere
// Gegner über, jeweils der nächste noch nicht getroffene innerhalb chainRange.
// Der Schaden nimmt pro Sprung leicht ab. Erzeugt kurzlebige Blitzlinien.
Projectile.prototype._hitChain = function (enemies) {
  var hitList = [];
  var current = this.target;
  if (!current || current.dead) {
    // Hauptziel schon tot: nächsten Gegner am Einschlagpunkt suchen.
    current = this._nearestEnemy(this.x, this.y, enemies, hitList, Infinity);
  }
  var maxHits = 1 + this.def.chainTargets;
  var dmg = this.def.damage;
  var prev = { x: this.x, y: this.y };

  for (var n = 0; n < maxHits && current; n++) {
    current.takeDamage(Math.round(dmg));
    hitList.push(current);
    _chainBolts.push({ x1:prev.x, y1:prev.y, x2:current.x, y2:current.y, life:0.12, maxLife:0.12 });
    prev = { x: current.x, y: current.y };
    dmg *= 0.8; // jeder Sprung etwas schwächer
    current = this._nearestEnemy(prev.x, prev.y, enemies, hitList, this.def.chainRange * CELL);
  }
};

// Nächster lebender Gegner zu (x,y), der noch nicht in "exclude" ist und
// innerhalb maxDist liegt. Gibt null zurück, wenn keiner passt.
Projectile.prototype._nearestEnemy = function (x, y, enemies, exclude, maxDist) {
  var best = null, bestD = maxDist;
  for (var i = 0; i < enemies.length; i++) {
    var e = enemies[i];
    if (e.dead || exclude.indexOf(e) !== -1) continue;
    var dx = e.x - x, dy = e.y - y;
    var d = Math.sqrt(dx*dx + dy*dy);
    if (d <= bestD) { bestD = d; best = e; }
  }
  return best;
};

Projectile.prototype.draw = function (ctx) {
  if (this.dead) return;
  ctx.save();
  // Weicher Schein in Projektilfarbe
  ctx.shadowColor = this.color;
  ctx.shadowBlur  = 10;
  ctx.fillStyle   = this.color;
  ctx.beginPath();
  ctx.arc(this.x, this.y, 4, 0, Math.PI*2);
  ctx.fill();
  // Heller Kern (ohne Schatten) für mehr "Energie"
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.arc(this.x, this.y, 1.8, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();
};

// ─── Blitz-Linien (kurzlebiger Ketteneffekt) ──────────────
// Werden von _hitChain befüllt und im Game-Loop gezeichnet/abgebaut.
var _chainBolts = [];

function updateChainBolts(dt) {
  for (var i = 0; i < _chainBolts.length; i++) _chainBolts[i].life -= dt;
  var kept = [];
  for (var j = 0; j < _chainBolts.length; j++) {
    if (_chainBolts[j].life > 0) kept.push(_chainBolts[j]);
  }
  _chainBolts = kept;
}

function drawChainBolts(ctx) {
  for (var i = 0; i < _chainBolts.length; i++) {
    var b = _chainBolts[i];
    var alpha = Math.max(0, b.life / b.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#e8e0ff';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#c8a8ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(b.x1, b.y1);
    ctx.lineTo(b.x2, b.y2);
    ctx.stroke();
    ctx.restore();
  }
}

// Ermittelt den Shop-Slot (normal/splash/slow) zu einem Turmtyp. Basistypen
// und ihre Varianten (poison/chain/ice) gehören zum selben Slot.
function slotForType(type) {
  for (var slot in TOWER_SLOTS) {
    if (!TOWER_SLOTS.hasOwnProperty(slot)) continue;
    if (TOWER_SLOTS[slot].base === type || TOWER_SLOTS[slot].variant === type) {
      return slot;
    }
  }
  return null;
}

// Berechnet die effektiven Turmwerte aus der Basis-Definition, dem permanenten
// Grundlevel des Slots (Shop, Taler) und der globalen Ingame-Upgrade-Stufe.
// Beide Verstärkungen wirken multiplikativ: zuerst das Grundlevel auf die
// Basiswerte, dann das Gold-Upgrade obendrauf. Mutiert TOWER_DEFS nicht.
function computeTowerDef(type, level) {
  var base = TOWER_DEFS[type];

  // Permanentes Grundlevel des zugehörigen Slots (0, falls nichts gekauft).
  var slot = (typeof slotForType === 'function') ? slotForType(type) : null;
  var baseLvl = (slot && typeof getBaseLevel === 'function') ? getBaseLevel(slot) : 0;

  // 1. Grundlevel auf die Basiswerte anwenden → "verstärkte Basis".
  var b = {};
  for (var k in base) { if (base.hasOwnProperty(k)) b[k] = base[k]; }
  if (baseLvl > 0) {
    b.damage   = base.damage   * Math.pow(BASE_LEVEL_DEF.damageMult,   baseLvl);
    b.range    = base.range    * Math.pow(BASE_LEVEL_DEF.rangeMult,    baseLvl);
    b.fireRate = base.fireRate * Math.pow(BASE_LEVEL_DEF.fireRateMult, baseLvl);
    if (base.slowFactor < 1) {
      b.slowDur    = base.slowDur + BASE_LEVEL_DEF.slowDurBonus * baseLvl;
      b.slowFactor = base.slowFactor * Math.pow(BASE_LEVEL_DEF.slowFactorMult, baseLvl);
    }
  }

  // 2. Ingame-Gold-Upgrade (level) multiplikativ auf die verstärkte Basis.
  var def = {};
  for (var k2 in b) { if (b.hasOwnProperty(k2)) def[k2] = b[k2]; }
  if (level > 0) {
    def.damage   = b.damage   * Math.pow(UPGRADE_DEF.damageMult,   level);
    def.range    = b.range    * Math.pow(UPGRADE_DEF.rangeMult,    level);
    def.fireRate = b.fireRate * Math.pow(UPGRADE_DEF.fireRateMult, level);
    if (base.slowFactor < 1) {
      def.slowDur    = b.slowDur + UPGRADE_DEF.slowDurBonus * level;
      def.slowFactor = b.slowFactor * Math.pow(UPGRADE_DEF.slowFactorMult, level);
    }
  }

  // Schaden auf ganze Zahl runden (wie bisher).
  def.damage = Math.round(def.damage);

  def.upgradeLevel = level;
  def.baseLevel    = baseLvl;
  return def;
}

function Tower(col, row, type) {
  this.col  = col;
  this.row  = row;
  this.type = type;
  // Effektive Werte je nach aktueller globaler Upgrade-Stufe.
  this.def  = computeTowerDef(type, towerUpgradeLevel);
  this.x    = col * CELL + CELL/2;
  this.y    = row * CELL + CELL/2;
  this.cooldown = 0;

  // Animation
  this.animTime = Math.random() * 1; // versetzter Start
  this.animFps  = 6;
}

// Wendet die aktuelle globale Upgrade-Stufe auf diesen (bereits platzierten)
// Turm an. Wird beim Kauf eines Upgrades für alle Türme aufgerufen.
Tower.prototype.applyUpgrade = function (level) {
  this.def = computeTowerDef(this.type, level);
};

Tower.prototype.update = function (dt, enemies, projectiles) {
  this.animTime += dt;
  this.cooldown -= dt;
  if (this.cooldown > 0) return;

  var target = null;
  for (var i = 0; i < enemies.length; i++) {
    var e = enemies[i];
    if (e.dead) continue;
    var dx = e.x - this.x, dy = e.y - this.y;
    if (Math.sqrt(dx*dx+dy*dy) <= this.def.range * CELL) {
      if (!target ||
          e.pathIndex > target.pathIndex ||
          (e.pathIndex === target.pathIndex && e.pathProgress > target.pathProgress)) {
        target = e;
      }
    }
  }
  if (!target) return;

  this.cooldown = 1 / this.def.fireRate;
  projectiles.push(new Projectile(this.x, this.y, target, this.def));
};

Tower.prototype.draw = function (ctx, showRange) {
  if (showRange) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.def.range * CELL, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4,4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  var sheet = TOWER_SPRITES[this.type];

  if (sheet && sheet.loaded) {
    if (sheet.static) {
      // Statisches Einzelbild (z.B. 64x64): ganzes Bild als ein Frame.
      // Quadratisch auf ~1.3 Kacheln skaliert, auf der Kachel zentriert und
      // leicht nach oben versetzt, damit es wie ein stehender Turm wirkt.
      var sSize = CELL * 1.4;
      var sdx = this.x - sSize / 2;
      var sdy = (this.row * CELL + CELL) - sSize + 2;
      ctx.drawImage(
        sheet.img,
        0, 0, sheet.img.width, sheet.img.height,
        sdx, sdy, sSize, sSize
      );
    } else {
      // Animiertes Spritesheet: einen 70x130-Frame auswählen.
      var fi = Math.floor(this.animTime * this.animFps) % sheet.frames;
      var sx = fi * TOWER_FRAME_W;

      // Zielgröße: Breite ~ eine Kachel, Höhe proportional (130/70).
      var drawW = CELL * 1.3;
      var drawH = drawW * (TOWER_FRAME_H / TOWER_FRAME_W);

      // Horizontal zentriert; vertikal so, dass die Basis knapp unter der
      // Kachelmitte sitzt und der Turm nach oben herausragt.
      var dx = this.x - drawW / 2;
      var dy = (this.row * CELL + CELL) - drawH + 4;

      ctx.drawImage(
        sheet.img,
        sx, 0, TOWER_FRAME_W, TOWER_FRAME_H,
        dx, dy, drawW, drawH
      );
    }
  } else {
    // Fallback: farbiges Quadrat mit Symbol, falls Sprite noch nicht geladen
    var x = this.col*CELL, y = this.row*CELL, s = CELL-6;
    ctx.fillStyle = this.def.color;
    ctx.fillRect(x+3, y+3, s, s);

    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    if (this.type === 'normal') {
      ctx.beginPath(); ctx.arc(this.x, this.y, 6, 0, Math.PI*2); ctx.fill();
    } else if (this.type === 'splash') {
      ctx.beginPath();
      ctx.moveTo(this.x, this.y-8); ctx.lineTo(this.x+8, this.y);
      ctx.lineTo(this.x, this.y+8); ctx.lineTo(this.x-8, this.y);
      ctx.closePath(); ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(this.x, this.y-8); ctx.lineTo(this.x+7, this.y+5);
      ctx.lineTo(this.x-7, this.y+5); ctx.closePath(); ctx.fill();
    }
  }
};
