import {type LabelData} from "../../../server/utils/helper.ts";
import {JSCC_YEAR} from "../../shared/constants.ts";

export function createJSCCLabel(data: LabelData) {
    const {givenName, familyName, company, tags} = data;
    const tagsLine = tags.join(", ");

    return `
^XA

^CF0,190
^FO50,75^FD${givenName}^FS

^CF0,190
^FO50,230^FD${familyName}^FS

^CF0,90
^FO50,460^FD${company}^FS

^CF0,55
^FO50,565
^FB1100,3,0,L,0
^FD${tagsLine}^FS

^CF0,120
^FO50,700
^FB1100,1,0,R,0
^FD#JSCC${JSCC_YEAR}^FS

^XZ
`.trim();
}