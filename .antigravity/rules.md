# Antigravity Rules — Upvia Project

Please refer to and strictly enforce all guidelines, architecture constraints, and rules specified in:
[AGENTS.md](file:///home/st/Desktop/TNL/upvia/AGENTS.md)

### Key Enforcements
1. Root must strictly contain only `client/`, `server/`, `docs/`, `AGENTS.md`, `README.md`, `AUDIT.md`, `.gitignore`, and `.antigravity/`.
2. All commands must be executed within `client/` or `server/`.
3. Keep `client/shared/` and `server/src/shared/` types synchronized.
4. Support bilingual UI (English and Arabic) for all user-facing client additions.
5. Adhere to 15-Role RBAC and standard API response envelope `{ success, data, message }`.
6. Mandatory Developer Changelog Updates & Identity Detection:
   - Identify active developer via `git config user.name && git config user.email`.
   - If Siyad $\rightarrow$ update `docs/changelog/siyad.md`.
   - If Sharafath $\rightarrow$ update `docs/changelog/sharafth.md`.
   - If another contributor $\rightarrow$ dynamically create and maintain `docs/changelog/<username>.md`.
   - Never mix external or other contributors' logs into Siyad's or Sharafath's files.
   - Record date, module, key changes, and list of modified files.

