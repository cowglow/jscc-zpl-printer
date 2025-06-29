import {type LabelData} from "../../../server/utils/helper.ts";

export function createJSCC25Label(data: LabelData) {
    const {name, company, tags} = data;
    const tagsLine = tags.join(", ");

    return `
^XA
^CI28

^FO50,30^XGLOGO.GRF,1,1^FS

^CF0,120
^FO50,75^FD${name}^FS

^CF0,100
^FO50,225^FD${company}^FS

^CF0,60
^FO50,345
^FB1100,4,0,L,0
^FD${tagsLine}^FS

^CF0,300
^FO100,545^FD#JSCC25^FS

^XZ
`.trim();
}
