# Spike: Reliable Label Dimensions from Printer

## Goal

Get the exact label width/height in dots from the connected printer at runtime so the canvas editor preview matches the physical label — without hardcoding dimensions per event.

## What exists today

`server/api/server-info.ts` already queries the printer via `ipptool`:

```ts
exec(`ipptool -t "${url}" get-printer-attributes.test`, (error, stdout) => {
    const match = stdout.match(/media-col-default[^}]+x-dimension=(\d+)\s+y-dimension=(\d+)/);
    // converts hundredths-of-mm → dots at 300 DPI
});
```

**Problems with this approach:**
- Assumes 300 DPI hardcoded — wrong for 203 DPI printers
- The regex is fragile (whitespace-sensitive, breaks if `ipptool` output format changes)
- `get-printer-attributes.test` is a file that must exist on the machine — not portable
- DPI is not read from the printer, it's assumed
- Returns a static response — the client can't query dimensions interactively

---

## What to investigate

### Option A — IPP attributes via `ipptool` (improve existing)

Read `printer-resolution` from IPP alongside the media dimensions so DPI is not assumed.

```bash
# What attributes are available?
ipptool -tv http://localhost:631/printers/<name> get-printer-attributes.test
```

Key attributes to look for:
- `media-col-default` → `x-dimension`, `y-dimension` (media size in 1/100mm)
- `printer-resolution` → dots-per-inch (e.g. `300dpi`)
- `media-default` → named media size (e.g. `custom_4x6in_4x6in`)
- `media-size-supported` → all supported sizes

**R&D tasks:**
- [ ] Run `ipptool -tv` against the actual JSCC printer and capture full output
- [ ] Check if `printer-resolution` is present and parseable
- [ ] Identify which attribute reliably encodes physical label size

### Option B — CUPS HTTP API (no `ipptool` dependency)

CUPS exposes a REST-ish API at `http://localhost:631`. Query it directly with Node `http`:

```ts
// POST to CUPS IPP endpoint
const body = buildIppRequest('Get-Printer-Attributes', ['media-col-default', 'printer-resolution']);
const res = await fetch(`http://localhost:631/printers/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/ipp' },
    body,
});
```

This removes the `ipptool` file dependency and works cross-platform (macOS, Linux).

**R&D tasks:**
- [ ] Confirm CUPS IPP endpoint is reachable on macOS during the event
- [ ] Implement a minimal IPP binary frame builder for `Get-Printer-Attributes`
- [ ] Parse the binary IPP response for `media-col-default` and `printer-resolution`
- [ ] Consider using the `ipp` npm package to avoid hand-rolling binary encoding

### Option C — ZPL host query commands

ZPL printers respond to host commands over TCP/raw or USB. `~HS` (Host Status) and `~HI` (Host Identification) return printer config including DPI and media size.

```bash
# Send ~HI to the printer and read back
echo "~HI" | nc <printer-ip> 9100
# Response includes DPI, firmware, media size
```

**R&D tasks:**
- [ ] Check if the JSCC printer has a network interface (IP) or is USB-only
- [ ] If TCP: test `~HI` response format against the actual printer
- [ ] If USB-only: test via CUPS raw queue passthrough

### Option D — Env var override (already works)

`LABEL_WIDTH_DOTS` and `LABEL_HEIGHT_DOTS` env vars already bypass all detection. For production:

```bash
LABEL_WIDTH_DOTS=1200 LABEL_HEIGHT_DOTS=1800 node server.ts
```

This is the reliable fallback for event day — set it once when the labels are loaded.

---

## Proposed `/label-config` endpoint

Once the R&D settles on an approach, expose a dedicated endpoint so the canvas editor (or any client) can fetch live dimensions:

```ts
// GET /label-config
{
  "width": 1200,    // dots
  "height": 1800,   // dots
  "dpi": 300,
  "source": "ipp"   // "ipp" | "env" | "default"
}
```

The canvas editor calls this on load and resizes the canvas to match.

---

## Definition of Ready

- [ ] Access to the actual JSCC printer (Intermec PC43t or equivalent) for testing
- [ ] Decision on Option A/B/C priority order
- [ ] Confirm whether printer has network access or is USB-only