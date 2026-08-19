# WORKSPACE SCOPE: PROGRESSION, CLOUD & LEADERBOARD (Agent 4)

## 📌 Zuständigkeit & Branch
- **Branch:** `feature/progression-storage`
- **Workspace Pfad:** `../sonar-progression`

---

## 🎯 Zuständige Dateien (Strikte Domain-Isolation)
- `src/services/*` (StorageManager, FirebaseService, etc.)
- `src/engine/Progression.js`
- `src/config/levels.js`
- `src/ui/LeaderboardModal.js`
- `src/ui/ProfileModal.js`
- `src/ui/HangarModal.js`

---

## 📋 Aufgaben & Verantwortlichkeiten
1. **Metaprogression & Hangar-Upgrades:** Strikte Trennung von Gesamt-Sternen (Bestenlisten-Score) vs. ausgegebenen Upgrade-Sternen.
2. **Firebase Firestore Cloud-Sync:** Offline-First Caching mit sauberem Conflict-Resolution.
3. **Multi-User Isolation:** Strikte Trennung von Gast-Profilen und registrierten Piloten.
4. **Leaderboard & 1v1 Rival Comparison:** Tab-Filterung und Sternen-Anzeige.

---

## 🧪 Validierungs-Befehl
```bash
node ./node_modules/@playwright/test/cli.js test
```
