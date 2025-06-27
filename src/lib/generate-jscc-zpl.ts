
type LabelData = {
    name: string;
    company: string;
    tags: string[];
};

export function generateZPL(labelData: LabelData): string {
    const {name, company, tags} = labelData;
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

^CF0,150
^FO533,741^FD#jscc25^FS

^XZ
`.trim();
}
