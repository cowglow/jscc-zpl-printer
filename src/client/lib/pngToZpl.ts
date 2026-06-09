// Browser-side PNG→ZPL conversion producing GRF ACS format.
// Algorithm mirrors zpl-image's rgbaToACS — no external deps.
//
// ZPL usage: ^GFA,{total},{total},{rowlen},{acsData}

const HEX = Array.from({length: 256}, (_, i) => i.toString(16).padStart(2, '0'));

// ACS run-length alphabet (see ZPL GRF spec)
const ACS_LOW  = 'ghijklmnopqrstuvwxy'; // 'g'=20, 'h'=40, ... 'y'=380
const ACS_HIGH = 'GHIJKLMNOPQRSTUVWXY'; // 'G'=1,  'H'=2,  ... 'Y'=19

function encodeRun(len: number): string {
    let code = '';
    while (len >= 400) { code += 'z'; len -= 400; }
    if (len >= 20) { code += ACS_LOW[Math.floor(len / 20) - 1]; len %= 20; }
    if (len > 0)   code += ACS_HIGH[len - 1];
    return code;
}

function monoToACS(mono: Uint8Array): string {
    let hex = '';
    for (const byte of mono) hex += HEX[byte];

    let acs = '';
    let i = 0;
    while (i < hex.length) {
        const ch = hex[i];
        let end = i + 1;
        while (end < hex.length && hex[end] === ch) end++;
        const run = end - i;
        // Matches zpl-image behavior: only compress runs of 3+ (regex \1{2,})
        acs += run >= 3 ? encodeRun(run) + ch : hex.substring(i, end);
        i = end;
    }
    return acs;
}

function rgbaToMono(rgba: Uint8ClampedArray, width: number, height: number): {buf: Uint8Array; rowlen: number} {
    const rowlen = Math.ceil(width / 8);
    const buf = new Uint8Array(rowlen * height); // zero-filled → white
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const p = (y * width + x) * 4;
            const a = rgba[p + 3] / 255;
            // Blend onto white, then luminance
            const r = rgba[p]     * a + 255 * (1 - a);
            const g = rgba[p + 1] * a + 255 * (1 - a);
            const b = rgba[p + 2] * a + 255 * (1 - a);
            const luma = 0.299 * r + 0.587 * g + 0.114 * b;
            if (luma < 128) {
                buf[y * rowlen + (x >> 3)] |= 0x80 >> (x & 7);
            }
        }
    }
    return {buf, rowlen};
}

/**
 * Convert an HTMLImageElement to a ZPL string sized to the given label dots.
 * The image is scaled to fit (contain) within labelWidth×labelHeight.
 */
export function imageToZpl(img: HTMLImageElement, labelWidth: number, labelHeight: number): string {
    const scale = Math.min(labelWidth / img.naturalWidth, labelHeight / img.naturalHeight);
    const drawW = Math.round(img.naturalWidth  * scale);
    const drawH = Math.round(img.naturalHeight * scale);
    const offsetX = Math.round((labelWidth  - drawW) / 2);
    const offsetY = Math.round((labelHeight - drawH) / 2);

    const canvas = document.createElement('canvas');
    canvas.width  = labelWidth;
    canvas.height = labelHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, labelWidth, labelHeight);
    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

    const {data} = ctx.getImageData(0, 0, labelWidth, labelHeight);
    const {buf, rowlen} = rgbaToMono(data, labelWidth, labelHeight);
    const acs = monoToACS(buf);
    return `^XA\n^FO0,0^GFA,${buf.length},${buf.length},${rowlen},${acs}^FS\n^XZ`;
}