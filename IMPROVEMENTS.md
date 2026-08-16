# SONAR: Continuous Improvements & Polish Roadmap

> **System-Status:** Live-Evaluierung und taktische Roadmap zur Weiterentwicklung von *SONAR: The Echo Chamber* (v1.5.0).  
> **Zielsetzung:** Maximierung von Immersion, akustischem Thrill, visueller Brillanz und langfristiger Spieler-Retention.

---

## 1. Akustischer Herzschlag- & Adrenalin-Pulse bei Jäger-Nähe (Dynamic Heartbeat Bass-Layer)

### A. Feature / Polish-Idee
Implementierung eines dynamischen, tiefen Herzschlag- und Sub-Bass-Druckwellen-Effekts, sobald sich ein akustischer Jäger (`HUNTER` oder `SHADOW STALKER`) innerhalb eines Radius von weniger als 6 Grid-Kacheln um die Drohne `ECHO-7` befindet. Je näher der Feind kommt oder wenn er in den aktiven Jagd-Modus (`CHASE`) schaltet, desto schneller (von 60 auf bis zu 160 BPM) und wuchtiger pocht der Sub-Bass im Kopfhörer des Spielers.

### B. Warum es viel bringt (Impact & Spielgefühl)
- **Extremer psychologischer Horror & Immersion:** In der absoluten Dunkelheit von *Zero-Light* ist das Gehör der einzige Sinn. Ein steigender Herzschlag erzeugt augenblicklich Gänsehaut und Schweißausbrüche, noch bevor der Jäger auf dem Radar sichtbar wird.
- **Taktisches Frühwarnsystem:** Der Spieler erhält ein intuitives, rein akustisches Bio-Feedback, ohne dass überladene UI-Elemente den Bildschirm überfrachten.

### C. Technische Umsetzungsskizze
- **Betroffene Module:** [`src/engine/AudioEngine.js`](file:///src/engine/AudioEngine.js), [`src/entities/Hunter.js`](file:///src/entities/Hunter.js), [`src/main.js`](file:///src/main.js)
- **Ablauf:**
  1. In `Hunter.js` / `main.js`: Berechne im `update()`-Loop die minimale Distanz $d_{\min} = \min_{h \in \text{hunters}} \text{hypot}(h.x - \text{player}.x, h.y - \text{player}.y)$.
  2. In `AudioEngine.js`: Etabliere einen dedizierten `HeartbeatAudioNode` mit weichem Tiefpassfilter (Cutoff: 120 Hz) und variablem Oszillator/Sample-Intervall $T_{\text{beat}} = f(d_{\min})$.
  3. Bei $d_{\min} < 180\text{px}$: Automatische Modulation des Pulstempos und sanftes Ausblenden, sobald die Gefahr vorüber ist.

---

## 2. Biolumineszenter Mikro-Partikelschweif für Drohne ECHO-7 (Hydrodynamic Wake Trail)

### A. Feature / Polish-Idee
Erzeugung eines zarten, hydrodynamischen Partikelschweifs hinter der Drohne bei Schub und Gleiten. Winzige, leuchtend cyanblaue Phosphor-Mikrobläschen und Wirbelpartikel verweilen für 0.6 Sekunden im Wasser und glimmen sanft nach, bevor sie im ewigen Schwarz zerfallen. Beim Schleichen (`SNEAK`) verblasst der Schweif zu 100% (absolute akustische und optische Lautlosigkeit).

### B. Warum es viel bringt (Impact & Spielgefühl)
- **Taktiles Fluggefühl & Flow:** Die Drohne wirkt nicht länger wie ein starrer Vektorkörper, sondern wie eine geschmeidige, experimentelle Tiefsee-Aufklärungsdrohne in realer Flüssigkeit.
- **Visuelles Feedback für Stealth:** Der Spieler sieht auf einen Blick den Unterschied zwischen vollem Turbinenschub (auffälliger Leuchtschweif) und leisem Schleichgang (kein Schweif).

### C. Technische Umsetzungsskizze
- **Betroffene Module:** [`src/engine/ParticleEngine.js`](file:///src/engine/ParticleEngine.js), [`src/engine/CanvasRenderer.js`](file:///src/engine/CanvasRenderer.js), [`src/entities/Player.js`](file:///src/entities/Player.js)
- **Ablauf:**
  1. In `ParticleEngine.js`: Neue Methode `spawnWakeParticle(x, y, vx, vy, isSneaking)`.
  2. In `Player.update()`: Wenn `this.isMoving && !this.isSneaking`, spawne pro Frame 1–2 Mikropartikel an der Triebwerksdüse mit entgegengesetztem Geschwindigkeitsvektor:  
     $$\vec{v}_{\text{particle}} = -\vec{v}_{\text{player}} \cdot 0.3 + \vec{\epsilon}_{\text{turb}}$$
  3. In `CanvasRenderer.renderPlayer()`: Render-Pass mit additivem Blending (`ctx.globalCompositeOperation = 'lighter'`) für samtweichen Tiefsee-Glanz.

---

## 3. Sektor-Medaillensystem & 3-Sterne Stealth-Bewertung (Tactical Precision Rating)

### A. Feature / Polish-Idee
Einführung einer 3-Sterne-Missionsbewertung für jeden der 10 Kampagnen-Sektoren:
- ★ **Stern 1 (Bergung):** Alle Resonanz-Datenkerne geborgen und erfolgreich evakuiert.
- ★★ **Stern 2 (Lautlose Präzision):** Sektor mit maximal 1 Sonar-Ping (oder 0 Pings) absolviert.
- ★★★ **Stern 3 (Apex-Pilot):** Sektor in unter Par-Zeit (z. B. < 25s) ohne Entdeckung durch Jäger geschafft.

### B. Warum es viel bringt (Impact & Spielgefühl)
- **Extremer Wiederspielwert & Ehrgeiz:** Spieler kehren in frühere Sektoren zurück, um die perfekte 3-Sterne-Wertung ("30/30 Sterne") zu erreichen.
- **Differenzierte Spielstile:** Belohnt sowohl vorsichtige Stealth-Taktiker (Ghost-Run) als auch risikofreudige Speedrunner.

### C. Technische Umsetzungsskizze
- **Betroffene Module:** [`src/services/StorageManager.js`](file:///src/services/StorageManager.js), [`src/ui/MenuSystem.js`](file:///src/ui/MenuSystem.js), [`src/main.js`](file:///src/main.js), [`src/world/levels.js`](file:///src/world/levels.js)
- **Ablauf:**
  1. In `levels.js`: Ergänze für jedes Level `parTime` und `maxPingsForStealth`.
  2. In `main.js`: Tracke während des Sektors `pingsUsed`, `timeElapsed` und `detectedCount`. Beim Erreichen des Tors berechne Sterne (1–3).
  3. In `StorageManager.js`: Speichere `sectorStars: { 0: 3, 1: 2, ... }` persistent lokal und synchronisiere mit Firestore.
  4. In `MenuSystem.renderSectorSelect()`: Zeichne 3 goldene Sternchen unter jedes Sektor-Feld im Menü.

---

## 4. Akustische Wellen-Refraktion & Wand-Rückprall-Funken (Wave Reflection & Tile Splashes)

### A. Feature / Polish-Idee
Wenn die konzentrische Schallwelle eines Sonar-Pings auf massive Metall- und Felswände trifft, bricht die Welle nicht einfach abrupt ab, sondern erzeugt an den Treffpunkten feine, leuchtende Funken-Reflexionen (*Acoustic Splashes*) und winzige Sekundär-Kräuselungen.

### B. Warum es viel bringt (Impact & Spielgefühl)
- **Optische Highend-Physik:** Macht die Wellenausbreitung visuell greifbar und lebendig wie in modernen Cyberpunk-/Sci-Fi-Titeln.
- **Bessere Kanten-Wahrnehmung:** Ecken und schmale Nischen leuchten beim Einschlag der Welle für Sekundenbruchteile akzentuiert auf, was die Orientierung im Labyrinth massiv erleichtert.

### C. Technische Umsetzungsskizze
- **Betroffene Module:** [`src/engine/WaveSystem.js`](file:///src/engine/WaveSystem.js), [`src/engine/ParticleEngine.js`](file:///src/engine/ParticleEngine.js), [`src/engine/CanvasRenderer.js`](file:///src/engine/CanvasRenderer.js)
- **Ablauf:**
  1. In `WaveSystem.update()`: Wenn ein Wellenfront-Kreis $r_{\text{wave}}$ eine Wandzelle `TILES.WALL` schneidet, die im vorherigen Frame noch nicht berührt wurde:
  2. Spawne in `ParticleEngine` 2–4 winzige Wandfunken an der Treffer-Normale.
  3. In `CanvasRenderer.renderWorldGrid()`: Wandkanten erhalten für 120ms einen zusätzlichen weißen Highlight-Flash (`#FFFFFF`).

---

## 5. Ghost-Echo Replay-Projektion für Rekord-Läufe (Holographic Shadow Drone)

### A. Feature / Polish-Idee
Aufzeichnung des schnellsten persönlichen Rekordlaufs (bzw. des weltweiten #1-Laufs aus dem Leaderboard) für jeden Sektor. Bei einem erneuten Versuch fliegt eine halbtransparente, holographische Geister-Drohne (*Ghost ECHO*) als Orientierungshilfe zeitgleich mit.

### B. Warum es viel bringt (Impact & Spielgefühl)
- **Spitzen-Wettbewerb & Speedrunning:** Spieler sehen direkt, wo sie Zeit verlieren oder welche Route der beste Pilot der Welt gewählt hat.
- **E-Sport- und Community-Faktor:** Verwandelt das Spiel in eine packende Time-Attack-Challenge mit hohem Suchtpotential.

### C. Technische Umsetzungsskizze
- **Betroffene Module:** [`src/services/StorageManager.js`](file:///src/services/StorageManager.js), [`src/services/LeaderboardService.js`](file:///src/services/LeaderboardService.js), [`src/entities/Player.js`](file:///src/entities/Player.js), [`src/engine/CanvasRenderer.js`](file:///src/engine/CanvasRenderer.js)
- **Ablauf:**
  1. In `Player.js`: Zeichne während des Spiels alle 100ms ein Positions-Array auf: `[{ t: 0.1, x: 32, y: 64, f: 0 }, ...]`.
  2. In `StorageManager.js`: Wenn neuer persönlicher Rekord erreicht wird, komprimiere die Trajektorie und speichere sie in `localStorage` unter `sonar_ghost_sector_${id}`.
  3. In `CanvasRenderer.render()`: Wenn Ghost-Daten vorhanden sind, interpoliere Position zur aktuellen Spielzeit und zeichne eine cyan-transparente Silhouette (`ctx.globalAlpha = 0.35`) mit Strichlinien-Aura.
