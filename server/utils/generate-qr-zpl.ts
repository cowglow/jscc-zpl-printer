import QRCode from 'qrcode';
import zplImage from 'zpl-image';
const {rgbaToZ64} = zplImage;
import {JSCC_YEAR} from '../../src/shared/constants.ts';

const MARGIN = 50;

export async function generateQRLabelZPL(url: string, labelWidth: number, labelHeight: number): Promise<string> {
    const qr = QRCode.create(url, {errorCorrectionLevel: 'Q'});
    const moduleCount = qr.modules.size;

    const availableWidth = labelWidth - MARGIN * 2;
    // Reserve space below QR for URL text (~60px) and hashtag (~150px) with gaps
    const availableHeight = labelHeight - MARGIN * 2 - 60 - 150 - 60;
    const scale = Math.floor(Math.min(availableWidth, availableHeight) / moduleCount);
    const qrSize = moduleCount * scale;

    const rgba = new Uint8ClampedArray(qrSize * qrSize * 4).fill(255);

    for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
            if (qr.modules.data[row * moduleCount + col]) {
                for (let py = 0; py < scale; py++) {
                    for (let px = 0; px < scale; px++) {
                        const i = ((row * scale + py) * qrSize + (col * scale + px)) * 4;
                        rgba[i] = rgba[i + 1] = rgba[i + 2] = 0;
                    }
                }
            }
        }
    }

    const res = rgbaToZ64(rgba, qrSize);
    const qrX = Math.round((labelWidth - qrSize) / 2);
    const urlY = MARGIN + qrSize + 30;
    const hashY = Math.round(labelHeight * 0.88);

    return `
^XA
^CI28

^FO${qrX},${MARGIN}
^GFA,${res.length},${res.length},${res.rowlen},${res.z64}

^CF0,40
^FO${MARGIN},${urlY}^FD${url}^FS

^CF0,120
^FO${MARGIN},${hashY}^FD#JSCC${JSCC_YEAR}^FS

^XZ
`.trim();
}