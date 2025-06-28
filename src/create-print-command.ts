export function createPrintCommand(zpl: string, printerName: string): string {
    // Escape double quotes in ZPL to avoid shell issues
    const safeZPL = zpl.replace(/"/g, '\\"');

    // Check if printerName contains spaces and wrap it in double quotes if necessary
    const formattedPrinterName = printerName.includes(' ') ? `"${printerName}"` : printerName;

    // return `echo "${safeZPL}" | lp --% -d ${formattedPrinterName} -o raw`;

    return `echo "${safeZPL}" | lp -d ${formattedPrinterName} -o raw`;
}
