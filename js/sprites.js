/**
 * sprites.js — lädt die Orc-Spritesheets und stellt Animations-Metadaten bereit.
 *
 * Jedes Spritesheet ist eine horizontale Reihe von 100x100-Frames.
 */
var SPRITE_FRAME = 100; // Breite & Höhe eines einzelnen Frames in px

var ORC_SPRITES = {
  walk:  { img: new Image(), frames: 8, loaded: false, src: 'images/enemies/Orc with shadows/Orc_Walk.png'  },
  death: { img: new Image(), frames: 4, loaded: false, src: 'images/enemies/Orc with shadows/Orc_Death.png' }
};

// Turm-Spritesheets: Frame = 70x130, horizontale Reihe
var TOWER_FRAME_W = 70;
var TOWER_FRAME_H = 130;

// Basistürme sind horizontale Spritesheets aus 70x130-Frames.
// Die Shop-Varianten liegen aktuell als EINZELBILDER vor (kein Frame-Raster),
// daher "static:true" und "frames:1": Dann wird das ganze Bild als ein Frame
// gezeichnet (siehe Tower.draw). Sobald echte 70x130-Spritesheets vorliegen,
// hier einfach static entfernen und frames/Maße setzen.
var TOWER_SPRITES = {
  normal: { img: new Image(), frames: 6, loaded: false, src: 'images/towers/standard.png' },
  splash: { img: new Image(), frames: 6, loaded: false, src: 'images/towers/splash.png'   },
  slow:   { img: new Image(), frames: 4, loaded: false, src: 'images/towers/slow.png'      },

  // Shop-Varianten (statische Einzelbilder 64x64)
  poison: { img: new Image(), frames: 1, loaded: false, static: true, src: 'images/towers/Posion Tower.png'      },
  chain:  { img: new Image(), frames: 1, loaded: false, static: true, src: 'images/towers/Base Spirit Tower.png' },
  ice:    { img: new Image(), frames: 1, loaded: false, static: true, src: 'images/towers/eiskanone.png'         }
};

// Optionales Projektil-Sprite (derzeit zeichnen Projektile einfache Kreise;
// das Bild steht für eine spätere Verwendung bereit).
var PROJECTILE_SPRITES = {
  poison: { img: new Image(), frames: 1, loaded: false, static: true, src: 'images/towers/Poison Bullet.png' }
};

(function loadAllSprites() {
  function load(entry) {
    entry.img.onload = function () { entry.loaded = true; };
    entry.img.src = entry.src;
  }
  for (var k in ORC_SPRITES)        load(ORC_SPRITES[k]);
  for (var t in TOWER_SPRITES)      load(TOWER_SPRITES[t]);
  for (var p in PROJECTILE_SPRITES) load(PROJECTILE_SPRITES[p]);
})();
