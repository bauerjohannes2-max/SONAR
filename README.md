# SONAR: The Echo Chamber

> **Zero Light. Information = Death. Sicht existiert nur durch Schall.**

Ein gnadenloser 2D-Arcade-Stealth-Thriller auf HTML5 Canvas mit nativer Web Audio API Klangerzeugung.

---

## 🎮 Steuerung

| Taste | Aktion | Schall-Radius | Feind-Reaktion |
|---|---|---|---|
| **WASD** / **Pfeiltasten** | Schritt im Raster (120ms Tween) | 2.5 Kacheln (80px) | Alarmiert Hunter im Nahbereich |
| **Shift (halten)** | Schleichen (240ms Tween) | 0 Kacheln (Lautlos) | Hunter bemerken dich nicht |
| **Leertaste (Space)** | Großer Sonar-Ping (Global) | Ganzer Bildschirm | Alarmiert alle Hunter // Betäubt Stalker 2.5s |
| **E** / **F** | Schall-Köder werfen (1/Sektor) | 4 Kacheln Wurf | Sendet 3s Klick-Impulse, lockt Hunter an |
| **ESC** | Pause-Menü & Einstellungen | — | Öffnet Pausen-Modal |
| **R** | Sektor-Neustart | — | Setzt aktuellen Sektor zurück |

---

## 🚀 Spielmechaniken

1. **Absolute Dunkelheit (Zero-Light)**: Das Spielfeld ist zu 100% pechschwarz. Wände, Kristalle und Feinde leuchten nur auf, wenn eine Schallwelle sie überstreicht, und verblassen exponentiell (Phosphor-Nachleuchten).
2. **Sektor-Ziele**: Sammle alle Resonanz-Kristalle (`◆`), um die verschlossene Schleuse mit Energie zu versorgen. Sobald sie grün pulsiert, betritt sie, um in den nächsten Sektor vorzudringen.
3. **Hunter (Rot)**: Blinde Raubtiere. Patrouillieren im Normalzustand. Sobald ein Schall-Ereignis registriert wird, sprinten sie via BFS-Wegfindung direkt zum Ursprungsort.
4. **Shadow Stalker (Lila)**: Lautlose Schattenjäger. Werden durch Sonar-Pings (<kbd>Space</kbd>) 2.5 Sekunden im Licht betäubt.
5. **Resonatoren (Gelb)**: Alarmposten. Werden sie von einem Sonar-Ping getroffen, strahlen sie eine Schockwelle ab und wecken alle Hunter auf.
6. **Lighthouses (Blau)**: Harmlos rotierende Sonarbojen, die periodisch sichere Sichtzonen aufdecken.

---

## 🛠️ Ausführung & Start

```bash
# Starten auf Port 3005:
python -m http.server 3005
```

Öffne anschließend **`http://localhost:3005`** im Browser.
