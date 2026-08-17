# AGENT WORKFLOW DIRECTIVE

1. **DO NOT** crawl or scan the entire repository on startup.
2. Read **ONLY** `PROJECT_MAP.md` and `version.json` to understand the architecture, module responsibilities, and current system state.
3. Target and modify **only** the specific modules responsible for the requested feature or bugfix.
4. Keep context usage minimal by avoiding blanket reads of large files.
5. Always run automated tests (`npm test` / `node ./node_modules/@playwright/test/cli.js test`) before committing.
6. Synchronize SemVer version bump across all 6 points (`version.json`, `package.json`, `src/config.js`, `sw.js`, `index.html`, `test/e2e.spec.js`).
