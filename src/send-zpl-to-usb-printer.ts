import {exec} from "child_process";
import {createPrintCommand} from "./create-print-command.ts";

export function sendZPLToUSBPrinter(printerName: string, zpl: string) {
    return new Promise<void>((resolve, reject) => {
        const cmd = createPrintCommand(zpl, printerName)
        exec(cmd, (error: any, _stdout: string, stderr: string) => {
            if (error || stderr) {
                reject(error || stderr);
            } else {
                resolve();
            }
        });
    });
}
