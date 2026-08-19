# WORKSPACE SCOPE: GAMEPLAY, GAME-JUICE & HAPTIK (Agent 3)

## 📌 Zuständigkeit & Branch
- **Branch:** `feature/gameplay-juice`
- **Workspace Pfad:** `../sonar-gameplay`

---

## 🎯 Zuständige Dateien (Strikte Domain-Isolation)
- `src/engine/TouchControls.js`
- `src/engine/Haptics.js`
- `src/engine/Particles.js`
- `src/engine/Drone.js`

---

## 📋 Aufgaben & Verantwortlichkeiten
1. **Mobile Safe-Area Insets & Action-Cluster:**
   - Feste Verankerung von `#touch-action-cluster` mit CSS Safe-Area-Insets (20px).
   - Permanente Sichtbarkeit auf allen Viewports (inkl. Galaxy Z Fold / 4:3 Inner Screens).
2. **Drohnen-Bläschenpartikel (Thruster Bubbles):** Dynamische Heck-Partikel bei Schub.
3. **Taktile Vibration:** `navigator.vibrate` bei Pings, Wandberührung und Feindannäherung.
4. **Danger-Vignette Shader:** Rot pulsierender Rand bei Jäger-Nähe.
5. **Instant-Restart:** Sofort-Neustart via Taste `R` oder Doppel-Tap auf Touch.

---

## 🧪 Validierungs-Befehl
```bash
node ./node_modules/@playwright/test/cli.js test
```
