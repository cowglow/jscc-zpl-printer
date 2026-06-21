# Changelog

Versioning scheme: `vYYYY.N` — year of the JSCC event, N increments with each notable change.

---

## [v2026.5] — 2026-06-21

### Maintenance
- Upgraded all dependencies to latest versions (`@fastify/static` 9, `@types/node` 26, `vite` 8, `vitest` 4, `typescript` 6, `zpl-image` 0.3, `ws` 8.21, `fastify` 5.8)
- Fixed TypeScript 6 breaking change: added `"types": ["node"]` to `tsconfig.json` — TS 6 no longer auto-discovers `@types/node` without an explicit declaration

---

## [v2026.4] — 2026-06-13

### Changed
- Adjusted font sizes for name, company, and tags fields on the JSCC label
- Replaced `givenName`/`familyName` split with direct name field on label

### Fixed
- Replaced generic `❌ Network error:` console messages with tagged prefixes (`[Admin:participant-labels]`, `[Admin:print-qr]`, `[Admin:test-printer]`, `[Print:label-form]`, `[imagePrint]`, `[sticker:print]`) so failures are identifiable in the browser console without guessing which action triggered them

---

## [v2026.3] — 2026-06-12

### Changed
- Moved printer selection out of the main form and into the Admin dialog
- Active printer persisted to `localStorage` so the selection survives page reloads
- Both the label form and the sticker page now use the same stored printer

---

## [v2026.2] — 2026-06-10

### Added
- New `sticker.html` page with drag-and-drop PNG upload, monochrome preview, darkness/margin/rotation controls, and print-to-queue
- `pngToZpl.ts`: browser-side ACS encoding with no external dependencies; shared `drawImageOnCanvas` used by both preview and ZPL conversion so they stay in sync
- Editable label dimensions (persisted to `localStorage`) pre-filled from `/server-info`; fixes dimension mismatch when IPP auto-detection falls back to defaults
- Margin slider (0–300 dots) adds padding before the image is scaled to fit
- Multi-printer worker pool: FIFO job queue drained by CUPS-detected printers, 202 async responses, per-printer status/jam/recover endpoints

---

## [v2026.1] — 2026-06-09

### Added
- JSCC year constant extracted to `src/shared/constants.ts` (`JSCC_YEAR = 26`)
- QR code label printing via `^BQ` ZPL command with auto-detected label dimensions via IPP
- Dynamic printer list from `/printers` endpoint; admin dialog for operator actions
- Print all participants from `sourceDir` in a single admin action
- Test printer connection action in admin dialog
- UI feedback improvements: loading overlay with spinner, `aria-busy` on body, disabled print button until name is filled
- Dev mode banner; demo mode (`MODE=demo`) disables all print actions with a clear notice

### Fixed
- Dev workflow: `dev:all` script runs Fastify server and Vite in parallel

---

## [v2025.1] — 2025-06-27 through 2025-07-02

### Added
- Initial JSCC label printer: Fastify server serves Vite client; ZPL sent to USB printer via `lp`
- Participant labels: reads `.json` files from `sourceDir`, generates and prints a label per participant
- Mobile-friendly UI
- `VITE_PRINTER_NAME` environment variable for printer override
- Windows compatibility path (`ncat`-based) for USB printing

---

## [Unreleased]

- Canvas label editor spike (in planning — see `SPIKE_CANVAS_LABEL_EDITOR.md`)