/**
 * Grid — Spielfeld-Array und Canvas-Rendering.
 * Nutzt globale Konstanten aus constants.js und findPath aus pathfinder.js.
 */
var gridCells;   // 2D Array: 0 = frei, 1 = blockiert
var currentPath; // aktueller BFS-Pfad

// Hintergrundbild laden
var bgImage = new Image();
var bgImageLoaded = false;
bgImage.onload = function () { bgImageLoaded = true; };
bgImage.src = 'images/hintergrund.png';

function gridInit() {
  gridCells = [];
  for (var r = 0; r < ROWS; r++) {
    gridCells.push(new Array(COLS).fill(0));
  }
  currentPath = findPath(gridCells, START, END, COLS, ROWS);
}

function gridTryBlock(col, row) {
  if ((col === START.col && row === START.row) ||
      (col === END.col   && row === END.row)) return false;
  if (gridCells[row][col] === 1) return false;
  gridCells[row][col] = 1;
  var newPath = findPath(gridCells, START, END, COLS, ROWS);
  if (!newPath) {
    gridCells[row][col] = 0;
    return false;
  }
  currentPath = newPath;
  return true;
}

function gridUnblock(col, row) {
  gridCells[row][col] = 0;
  currentPath = findPath(gridCells, START, END, COLS, ROWS) || [];
}

function gridDraw(ctx) {
  var w = COLS * CELL, h = ROWS * CELL;

  // 1. Hintergrundbild (unterste Ebene). Fallback-Farbe falls noch nicht geladen.
  //    Das Bild ist im Hochformat und füllt das hochkante Spielfeld direkt.
  if (bgImageLoaded) {
    ctx.drawImage(bgImage, 0, 0, w, h);
  } else {
    ctx.fillStyle = '#1e1e32';
    ctx.fillRect(0, 0, w, h);
  }

  // 2. Leichte Abdunklung, damit Türme/Gegner lesbar bleiben
  ctx.fillStyle = 'rgba(20, 20, 40, 0.35)';
  ctx.fillRect(0, 0, w, h);

  // 3. Pfad als zusammenhängende "Straße": eine dicke, abgerundete Linie
  //    entlang der Pfad-Mittelpunkte, mit dunklem Rand und hellerer Mitte.
  gridDrawPath(ctx);

  // 4. Rasterlinien (etwas heller, damit sie über dem Bild sichtbar bleiben)
  ctx.strokeStyle = 'rgba(200, 200, 230, 0.18)';
  ctx.lineWidth = 0.5;
  for (var c = 0; c <= COLS; c++) {
    ctx.beginPath(); ctx.moveTo(c*CELL,0); ctx.lineTo(c*CELL,ROWS*CELL); ctx.stroke();
  }
  for (var r = 0; r <= ROWS; r++) {
    ctx.beginPath(); ctx.moveTo(0,r*CELL); ctx.lineTo(COLS*CELL,r*CELL); ctx.stroke();
  }

  // 5. Start- und Ziel-Marker (pulsierend)
  var t = (typeof gameClock === 'number') ? gameClock : 0;
  gridDrawMarker(ctx, START.col, START.row, '46, 204, 64', t);        // Start: grün
  gridDrawMarker(ctx, END.col,   END.row,   '255, 65, 54', t + 0.9);  // Ziel: rot
}

// Zeichnet den aktuellen Pfad als abgerundete Straße.
function gridDrawPath(ctx) {
  if (!currentPath || currentPath.length < 2) return;

  function px(p) { return p.col * CELL + CELL/2; }
  function py(p) { return p.row * CELL + CELL/2; }

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap  = 'round';

  // dunkler, breiter Unterrand
  ctx.beginPath();
  ctx.moveTo(px(currentPath[0]), py(currentPath[0]));
  for (var i = 1; i < currentPath.length; i++) ctx.lineTo(px(currentPath[i]), py(currentPath[i]));
  ctx.strokeStyle = 'rgba(20, 20, 35, 0.55)';
  ctx.lineWidth = CELL * 0.86;
  ctx.stroke();

  // hellere Straßenmitte
  ctx.strokeStyle = 'rgba(92, 92, 130, 0.55)';
  ctx.lineWidth = CELL * 0.62;
  ctx.stroke();

  ctx.restore();
}

// Zeichnet einen pulsierenden Marker (Start/Ziel) in der angegebenen RGB-Farbe.
function gridDrawMarker(ctx, col, row, rgb, t) {
  var cx = col * CELL + CELL/2;
  var cy = row * CELL + CELL/2;
  var pulse = 0.5 + 0.5 * Math.sin(t * 3);          // 0..1
  var ringR = CELL * (0.34 + 0.10 * pulse);

  ctx.save();
  // gefüllter Kern
  ctx.fillStyle = 'rgba(' + rgb + ', 0.75)';
  ctx.beginPath();
  ctx.arc(cx, cy, CELL * 0.26, 0, Math.PI*2);
  ctx.fill();
  // pulsierender Ring
  ctx.strokeStyle = 'rgba(' + rgb + ', ' + (0.3 + 0.5*pulse).toFixed(2) + ')';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, ringR, 0, Math.PI*2);
  ctx.stroke();
  ctx.restore();
}
