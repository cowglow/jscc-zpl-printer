import {JSCC_YEAR} from "../../../server/constants.ts";

export function createQRLabel(url: string): string {
    return `
^XA
^CI28

^FO100,50
^BQN,2,8
^FDQA,${url}^FS

^CF0,50
^FO50,460^FD${url}^FS

^CF0,120
^FO50,540^FD#JSCC${JSCC_YEAR}^FS

^XZ
`.trim();
}