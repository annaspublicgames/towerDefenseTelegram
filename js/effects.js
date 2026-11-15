/**
 * effects.js — leichte Partikel-Effekte für Treffer und Gegnertode.
 *
 * Gleiches Muster wie die Blitz-Linien in tower.js: ein globales Array, das
 * im Game-Loop aktualisiert (updateParticles) und gezeichnet (drawParticles)
 * und beim Level-Start geleert wird (clearParticles).
 */
var _particles = [];

// Fügt einen Partikel-Burst an (x,y) hinzu.
//   count  — Anzahl Partikel
//   color  — Füllfarbe
//   opts   — optional: { speed, size, life, gravity, spread }
function spawnParticles(x, y, count, color, opts) {
  opts = opts || {};
  var speed   = opts.speed   != null ? opts.speed   : 70;   // px/s (Basis)
  var size    = opts.size    != null ? opts.size    : 3;    // Radius in px
  var life    = opts.life    != null ? opts.life    : 0.45; // Sekunden
  var gravity = opts.gravity != null ? opts.gravity : 120;  // px/s² nach unten
  var spread  = opts.spread  != null ? opts.spread  : 1;    // Geschwindigkeits-Streuung

  for (var i = 0; i < count; i++) {
    var ang = Math.random() * Math.PI * 2;
    var spd = speed * (0.4 + Math.random() * spread);
    _particles.push({
      x: x, y: y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      life: life * (0.7 + Math.random() * 0.6),
      maxLife: life,
      size: size * (0.6 + Math.random() * 0.8),
      color: color,
      gravity: gravity
    });
  }
}

// Kurzer heller Funken-Burst beim Projektil-Einschlag.
function spawnHit(x, y, color) {
  spawnParticles(x, y, 6, color || '#ffe9a0',
    { speed: 90, size: 2.2, life: 0.3, gravity: 40, spread: 1.2 });
}

// Größerer Burst beim Gegnertod (in der Gegnerfarbe).
function spawnDeath(x, y, color) {
  spawnParticles(x, y, 14, color || '#ff6666',
    { speed: 110, size: 3, life: 0.6, gravity: 160, spread: 1.4 });
  // ein paar hellere "Glanz"-Partikel obendrauf
  spawnParticles(x, y, 5, '#ffffff',
    { speed: 70, size: 1.8, life: 0.4, gravity: 120, spread: 1 });
}

function updateParticles(dt) {
  for (var i = 0; i < _particles.length; i++) {
    var p = _particles[i];
    p.life -= dt;
    p.vy  += p.gravity * dt;
    p.x   += p.vx * dt;
    p.y   += p.vy * dt;
  }
  var kept = [];
  for (var j = 0; j < _particles.length; j++) {
    if (_particles[j].life > 0) kept.push(_particles[j]);
  }
  _particles = kept;
}

function drawParticles(ctx) {
  for (var i = 0; i < _particles.length; i++) {
    var p = _particles[i];
    var a = Math.max(0, p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function clearParticles() {
  _particles = [];
}
