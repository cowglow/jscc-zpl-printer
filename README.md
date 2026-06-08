![JSCC](public/jscc-og-image.png)

# JSCC-ZPL-Printer

An open-source project for printing JSCC (JavaScript Conference) badges using ZPL (Zebra Programming Language) on an Intermec PC43t label printer.

---

## Hardware Setup

You need:
- A Mac mini (or any macOS machine) as the server
- An Intermec PC43t (300 dpi) label printer
- A USB cable connecting the printer to the Mac mini
- The Mac mini connected to the conference WiFi/LAN so participants can reach it

```
[Participants on WiFi] --> [Mac mini via LAN] --> [Printer via USB]
```

---

## macOS Printer Driver

The Intermec PC43t requires the **Gutenprint** open-source driver on macOS. Install it via Homebrew:

```
brew install gutenprint
```

After installing, restart your Mac (or restart CUPS: `sudo launchctl stop org.cups.cupsd`) before adding the printer.

---

## Printer Setup (one-time)

1. Connect the printer to the Mac mini via USB and power it on
2. Open **System Settings → Printers & Scanners**
3. Click **+** to add the printer — it should appear as `Intermec PC43t`
4. Once added, open Terminal and run:
   ```
   lpstat -p
   ```
   Copy the exact printer name (e.g. `Intermec_PC43t_300_FP`) — you'll need it for `.env`

5. If the printer shows as **Paused**, re-enable it:
   ```
   cupsenable Intermec_PC43t_300_FP
   lpadmin -p Intermec_PC43t_300_FP -E
   ```

---

## Server Setup

### 1. Clone and install

```
git clone <repo-url>
cd jscc-zpl-printer
npm install
```

### 2. Configure environment

Copy the example and fill in your values:
```
cp .env.example .env
```

```env
VITE_PRINTER_NAME=Intermec_PC43t_300_FP   # must match lpstat -p output exactly
VITE_PRINTER_IP=192.168.1.236             # printer's network IP (shown on printer screen)
```

### 3. Build and run

```
npm run build
npm run server
```

The server starts on `http://localhost:3001`.

---

## Accessing from the network

Participants need to reach the server over the conference network. Find the Mac mini's IP:

```
ipconfig getifaddr en1
```

Then open `http://<mac-mini-ip>:3001` from any device on the same network.

**Tip:** Use the **Print WebClient QR** button in the Admin Actions section — it prints a label with a QR code pointing to the app. Scan it to verify the URL works before the conference starts.

---

## Participant data

Each participant has a `.json` file in the `sourceDir/` directory. See `sourceDir/philip_saa.json` for an example. The relevant fields for printing are:

```json
{
  "realName": { "givenName": "Philip", "familyName": "Saa" },
  "company": "Saab Deutschland GmbH",
  "tags": ["TypeScript", "React", "Svelte"]
}
```

---

## Printing

| Action | How |
|---|---|
| Print a single badge | Fill in the form and click **Print** |
| Print all participant badges | Click **Print All Participants** in Admin Actions |
| Print the QR code label | Click **Print WebClient QR** in Admin Actions — open the app via the Mac mini's network IP first so the QR encodes the right URL |
| Test printer connectivity | Click **Test Printer Connection** in Admin Actions |

---

## Updating for next year

Change the year in one place — `src/shared/constants.ts`:

```ts
export const JSCC_YEAR = 26;
```

Then rebuild:
```
npm run build
```

---

## ZPL reference

Send ZPL directly from the terminal (macOS):
```
echo "^XA^FO50,50^A0N,80,80^FDTEST^FS^XZ" | lp -d Intermec_PC43t_300_FP -o raw
```

Send ZPL directly from the terminal (Windows):
```
echo "^XA^FO50,50^A0N,80,80^FDTEST^FS^XZ" | ncat 192.168.1.236 9100
```