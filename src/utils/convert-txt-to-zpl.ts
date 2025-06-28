export function convertTxtToZpl(input: string) {
    const marginX = 118;
    const eventCode = "#JSCC25";
    const zpl = `^XA
^PW1795
^LL1205
^FO${marginX},100^A0,N,136,136^FD${eventCode}^FS
^FO${marginX},300^A0,N,80,80
^FB936,4,20,L,0
^FD${input}^FS
^XZ`;
    return zpl;
    // Philip Saa // Saab //  // Indie Web // A/V // React // Svelte // TypeScript // Playwright

    // const label = new Label();
    // label.printDensity = new PrintDensity(PrintDensityName['12dpmm']);
    // label.width = 600;
    // label.height = 400;
    //
    // // First line (fixed event code)
    // const eventText = new Text();
    // eventText.fontFamily = new FontFamily(FontFamilyName.A); // Use 'A' font
    // eventText.height = 136;
    // eventText.width = 1000;
    // eventText.x = 10;
    // eventText.y = 10;
    // eventText.text = '#JSCC25';
    // label.content.push(eventText);
    //
    // // Second line (participant name, dynamic)
    // const nameText = new Text();
    // nameText.fontFamily = new FontFamily(FontFamilyName.A); // Use 'A' font
    // nameText.height = 100;
    // nameText.width = 1000;
    // nameText.x = 10;
    // nameText.y = 180;
    // nameText.text = input;
    // label.content.push(nameText);
    //
    // return label.generateZPL("utf-8");
}
