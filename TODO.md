# Task: Add a Windows 11 printing path to jscc-zpl-printer, kept fully separate from the existing macOS path

## Context
This repo prints conference badges to an Intermec PC43t thermal printer by sending raw ZPL.
- It's a Fastify + TypeScript server (Node 22.6+, run via `node server.ts` with native TS stripping — no build step) plus a Vite browser client.
- The CURRENT printing path is macOS-only. All OS coupling lives in four `child_process.exec` calls:
    - `server/utils/helper.ts` → `echo "<zpl>" | lp -d <printer> -o raw`
    - `server/api/printers.ts` → `lpstat -p` (enumerate printers)
    - `server/api/test-printer.ts` → `lpstat -p <name>` (status)
    - `server/api/server-info.ts` → `ipptool ... get-printer-attributes` (auto-detect label size)
- The Intermec PC43t has an Ethernet port and speaks ZPL. The Windows target will reach it over the network.
- Clear Architecture: https://github.com/jkphl/clear-architecture/blob/master/README.md

## The Windows approach (do this)
Implement Windows printing as a raw TCP socket to the printer's port 9100 (JetDirect/raw), using Node's built-in `net` module. NO `lp`, NO CUPS, NO shell-out, NO native addons, NO printer driver.
- This deliberately avoids the cmd.exe caret (`^`) escaping bug that would corrupt ZPL if we built shell strings, and needs no admin/driver setup.
- Printer host/port and label dimensions come from env/config (there is no CUPS/ipptool to query on Windows).

## Hard requirements
1. KEEP MAC AND WINDOWS COMPLETELY SEPARATE. Do not modify the behavior of the existing macOS path. The Mac code must still run unchanged on macOS. Windows must never call `lp`/`lpstat`/`ipptool`.
2. Both platforms sit behind ONE shared interface (the only Clear-Architecture idea we're keeping: dependency inversion at the printer boundary). Core/use-case code depends on the interface, never on an OS.
3. Select the implementation at runtime — default by `process.platform`, overridable by an env var (e.g. `PRINTER_BACKEND=tcp9100|cups`).
4. Do NOT introduce the full Clear Architecture tier structure. Keep the file layout lean and organized by *solution*, not by abstract tiers.

## Proposed structure (adjust if you find something cleaner, but preserve the separation)
File/dir casing: lowercase kebab-case files and directories; PascalCase for types/classes/interfaces inside files.

server/
core/
printer-port.ts            # interface: send(zpl), listPrinters(), testConnection(); shared types
select-printer.ts          # factory: choose adapter by process.platform / PRINTER_BACKEND
platform/
mac/
cups-printer.ts          # MOVE the existing lp/lpstat/ipptool logic here, behavior unchanged
windows/
tcp9100-printer.ts       # net.Socket raw send to PRINTER_HOST:PRINTER_PORT (default 9100)
api/                         # existing Fastify controllers, thinned to call core via the interface
utils/                       # platform-agnostic leftovers (zpl + qr rendering, participant loading)
server.ts

## Implementation steps
1. Inspect the repo first (read server.ts, server/api/*, server/utils/*) and confirm the four OS-coupling points above before changing anything.
2. Define `PrinterPort` in core/printer-port.ts with: `send(zpl: string): Promise<void>`, `listPrinters(): Promise<string[]>`, `testConnection(): Promise<{ ready: boolean; message: string }>`.
3. Move the existing CUPS logic verbatim (semantics preserved) into platform/mac/cups-printer.ts implementing `PrinterPort`. The `lp` send, `lpstat` enumerate/status, and `ipptool` label detection stay mac-only.
4. Implement platform/windows/tcp9100-printer.ts implementing the same `PrinterPort`:
    - `send`: open a `net.Socket` to `PRINTER_HOST:PRINTER_PORT` (port default 9100), write the ZPL bytes, end the socket; resolve on flush, reject on socket error/timeout (add a sane connect timeout).
    - `listPrinters`: 9100 has no enumeration — return the configured printer(s) from env (e.g. `[PRINTER_HOST]` or a friendly name).
    - `testConnection`: attempt a TCP connect to host:9100 and report ready/unreachable.
    - Read label dimensions from env (`LABEL_WIDTH_DOTS`/`LABEL_HEIGHT_DOTS`) since there is no ipptool; keep the server-info endpoint working by falling back to these on Windows.
5. Add core/select-printer.ts that returns the mac or windows adapter based on `PRINTER_BACKEND` (if set) else `process.platform` (`darwin` → cups, `win32` → tcp9100). Wire the api/ controllers to use it instead of importing OS logic directly.
6. Fix cross-platform npm scripts: the current `dev:server`/`dev:all` use POSIX `PORT=3001 ...` and `&` backgrounding, which fail on Windows. Add `cross-env` and `concurrently` and update scripts so they run on both OSes. Leave `"server": "node server.ts"` working.
7. Config: support env vars `PRINTER_BACKEND`, `PRINTER_HOST`, `PRINTER_PORT` (default 9100), `LABEL_WIDTH_DOTS`, `LABEL_HEIGHT_DOTS`, `PRINTER_NAME`. Provide a `.env.example`.
8. Docs: add a short "Windows 11 setup" section to the README — Node 22.6+ install, set `PRINTER_HOST` to the printer's IP (shown on its screen), and add a Windows Defender Firewall inbound rule so phones on the LAN can reach the Node server on its port. Note the printer must be on the wired LAN (Wi-Fi-only venue = out of scope).

## Constraints / non-goals
- No new runtime dependencies for the Windows print path beyond built-in `net` (cross-env/concurrently are devDependencies only).
- Do not implement the USB/Windows-spooler-RAW path now; design the interface so it could be added later as another platform/windows adapter, but 9100 is the only Windows backend for this task.
- Do not refactor the Vite client or restructure unrelated code.

## Acceptance criteria
- On macOS, behavior is identical to today (verify the mac adapter still uses lp/lpstat/ipptool).
- On Windows, the server starts with `node server.ts`, selects the tcp9100 adapter, and `send` transmits ZPL over a socket with no shell invocation anywhere in the Windows path.
- `grep` confirms `lp`, `lpstat`, `ipptool`, and `child_process` do NOT appear in any platform/windows file or in core/.
- npm scripts run on both Windows and macOS.
- A short test (or documented manual step) proves a label prints to a networked PC43t via `PRINTER_HOST`.

Start by reading the repo and outlining the diff plan before writing code.