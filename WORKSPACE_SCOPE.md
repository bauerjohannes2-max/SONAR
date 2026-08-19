# WORKSPACE SCOPE: UI & RESPONSIVE LAYOUTS (Agent 1)

## 📌 Zuständigkeit & Branch
- **Branch:** `feature/ui-layout-cleanup`
- **Workspace Pfad:** `../sonar-ui`

---

## 🎯 Zuständige Dateien (Strikte Domain-Isolation)
- `src/ui/HUD.js`
- `src/ui/MenuSystem.js`
- `src/ui/LevelSelectModal.js`
- `styles/main.css`
- `index.html`

---

## 📋 Aufgaben & Verantwortlichkeiten
1. **Galaxy-Z-Fold & Foldable Top-HUD Fix:** 0% Text-Crash, Truncation für schmale Screens (`SEKTOR 01` / `S-01`, `◆ 0 / 3`, Zeit).
2. **K.I.S.S. Hauptmenü:** Pure Core Titles (`KAMPAGNE`, `UPGRADES`, `BESTENLISTE`, `PROFIL`), User-Avatar-Button oben links, Version im Footer.
3. **Sterbemenü (Game-Over):** Maximal 2 Zeilen Text (`SIGNAL VERLOREN`, `Wandkollision` / `Feindkontakt`), Icon-freie Ergebnis-Buttons (`NEUSTART`, `LEVELAUSWAHL`, `HAUPTMENÜ`).
4. **Globaler Shortcut-Audit:** Entfernung sämtlicher Tastatur-Kürzel in Klammern aus allen Buttons.

---

## 🧪 Validierungs-Befehl
```bash
node ./node_modules/@playwright/test/cli.js test
```
