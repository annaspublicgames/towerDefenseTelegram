# Tower Defense (Telegram Mini App)

Ein grid-basiertes Tower Defense Spiel in Vanilla HTML/CSS/JavaScript,
optimiert fürs Hochformat und für Telegram Mini Apps.

## Spielen

Lokal: `index.html` im Browser öffnen.

Online (GitHub Pages): siehe die Pages-URL dieses Repos.

## Features

- Grid-basiertes Hochformat-Spielfeld, Pfad durch Turmplatzierung beeinflussbar
- Drei Turmtypen: Normal, Splash (Flächenschaden), Slow (Verlangsamung)
- Fünf Level mit steigender Schwierigkeit; Level 1 (10 Wellen) ist das
  ursprüngliche Spiel, die Level 2–5 werden länger und härter. Zu Beginn
  erscheint eine Level-Übersicht — anfangs ist nur Level 1 spielbar, jedes
  weitere Level wird durch einen Sieg freigeschaltet. Der Fortschritt wird
  lokal gespeichert (localStorage).
- **Geschwindigkeit:** Button zum Umschalten zwischen 1×, 2× und 3× — die
  Simulation läuft entsprechend schneller (die Darstellung bleibt flüssig).
- **Shop & Taler (Meta-Fortschritt):** Für jeden Levelsieg gibt es „Taler" —
  mehr bei höherem Level und mehr übrigen Leben; ein bereits geschafftes Level
  erneut zu spielen gibt reduzierte Taler (25 %). Im Shop (Button auf der
  Level-Übersicht) lassen sich damit drei Turm-Varianten kaufen, die je einen
  Basis-Turm ersetzen. Die aktive Auswahl kann pro Slot jederzeit zwischen
  Basis- und Varianten-Turm umgeschaltet werden und gilt in allen Leveln.
  Taler, Käufe und Auswahl werden lokal gespeichert.
  - **Giftturm** (ersetzt Normal): Einzelziel + Schaden über Zeit (Gift).
  - **Blitzturm** (ersetzt Splash): Blitz springt auf weitere nahe Gegner (Kette).
  - **Eiskanone** (ersetzt Slow): verlangsamt das Ziel und zusätzlich alle
    Gegner im Umkreis des Einschlags (Flächen-Verlangsamung).
- Gold- und Leben-System
- Animierte Orc- und Turm-Sprites
- Touch-Steuerung (Tippen = platzieren, langer Druck = verkaufen)
- Telegram Mini App Integration (Fullscreen, Theme, haptisches Feedback)

## Struktur

- `index.html` — Einstiegspunkt, Layout und Styling
- `js/` — Spiellogik (Grid, Pathfinding, Türme, Gegner, Wellen, UI, Telegram)
- `images/` — Hintergrund sowie Orc- und Turm-Sprites
