import {JSCC_YEAR} from "../../shared/constants.ts";

const MARGIN = 50;
const QR_MAGNIFICATION = 10;
// ZPL ^BQ QR modules per side (version 3, error correction Q) for a short URL
const QR_MODULES = 29;
const QR_SIZE = QR_MODULES * QR_MAGNIFICATION;

export function createQRLabel(url: string, labelWidth = 1200, labelHeight = 1800): string {
    const qrX = Math.round((labelWidth - QR_SIZE) / 2);
    const qrY = MARGIN;

    const urlY = qrY + QR_SIZE + 40;
    const hashY = Math.round(labelHeight * 0.88);

    return `
^XA
^CI28

^FO${qrX},${qrY}
^BQN,2,${QR_MAGNIFICATION}
^FDQA,${url}^FS

^CF0,40
^FO${MARGIN},${urlY}^FD${url}^FS

^CF0,120
^FO${MARGIN},${hashY}^FD#JSCC${JSCC_YEAR}^FS

^XZ
`.trim();
}