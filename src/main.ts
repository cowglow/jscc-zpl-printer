import './style.css'
// import {rgbaToZ64} from 'zpl-image';
// import {convertTxtToZpl} from "./convert-txt-to-zpl.ts";
// import {createPrintCommand} from "./create-print-command.ts";

const SERVER_IP = "http://localhost:9100"

// const fileInput = document.querySelector<HTMLInputElement>('#file-upload');
const printerNameOptions = document.querySelector<HTMLSelectElement>('#printer-name');
// const textZplField = document.querySelector<HTMLTextAreaElement>("textarea#text-to-zpl")
// const zplTextField = document.querySelector<HTMLTextAreaElement>("textarea#zpl-to-print")
//
// const convertToZPLButton = document.querySelector<HTMLButtonElement>("button#convert-to-zpl")
// const sendToPrinterButton = document.querySelector<HTMLButtonElement>("button#send-to-printer")
// const verifyConnectionButton = document.querySelector<HTMLButtonElement>("button#verify-connection")
// const sendToTerminalButton = document.querySelector<HTMLButtonElement>("button#send-to-terminal")
// const resetButton = document.querySelector<HTMLButtonElement>("button#reset")
// JSCC Modifications
const participantName = document.querySelector<HTMLInputElement>("#participant-name")
const companyName = document.querySelector<HTMLInputElement>("#company-name")
const tagList = document.querySelector<HTMLInputElement>("#tag-list")
const printItButton = document.querySelector<HTMLButtonElement>("#print-it")

// Event listeners
if (
    // fileInput &&
    printerNameOptions &&
    // textZplField &&
    // convertToZPLButton &&
    // zplTextField &&
    // sendToPrinterButton &&
    // sendToTerminalButton &&
    // verifyConnectionButton &&
    // resetButton &&
    participantName &&
    companyName &&
    tagList &&
    printItButton
) {
    /*
    fileInput.addEventListener('change', (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file && file.type === 'image/png') {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            canvas.width = img.width;
                            canvas.height = img.height;
                            ctx.drawImage(img, 0, 0);
                            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                            const rgba = Uint8Array.from(imageData.data);
                            const width = imageData.width;
                            // Convert to ZPL using zpl-image
                            // @ts-ignore
                            const result = rgbaToZ64(rgba, width, {black: 50, rotate: 'N'});
                            zplTextField.value = `^XA^FO0,0^GFA,${result.length},${result.length},${result.rowlen},${result.z64}^XZ`;
                            sendToPrinterButton.removeAttribute("disabled");
                            sendToTerminalButton.removeAttribute("disabled");
                        }
                    };
                    img.src = e.target.result as string;
                } else {
                    alert('Failed to load the image.');
                }
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please upload a valid PNG file.');
        }
    });
    convertToZPLButton.addEventListener("click", () => {
        if (textZplField.value !== "") {
            zplTextField.value = convertTxtToZpl(textZplField.value);
            sendToPrinterButton.removeAttribute("disabled");
            sendToTerminalButton.removeAttribute("disabled");
        }
    })
    sendToPrinterButton.addEventListener("click", async () => {
        const zpl = convertTxtToZpl(textZplField.value.trim());
        const printerName = printerNameOptions.value
        if (zpl !== "") {
            try {
                const response = await fetch(`${SERVER_IP}/print`, {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({zpl, printerName}),
                });

                if (response.ok) {
                    console.log("✅ ZPL sent successfully!");
                } else {
                    const error = await response.json();
                    console.error("❌ Failed to send ZPL:", error);
                    alert(`Error: ${error.error || "Failed to send ZPL"}`);
                }
            } catch (err) {
                console.error("❌ Network error:", err);
                alert("Network error. Could not send ZPL.");
            }
        }
    });
    sendToTerminalButton.addEventListener("click", async () => {
        const zpl = convertTxtToZpl(textZplField.value.trim());
        const printerName = printerNameOptions.value
        if (zpl === "") return;
        const cmd = createPrintCommand(zpl, printerName);
        try {
            await navigator.clipboard.writeText(cmd);
            alert("Command copied to clipboard!");
        } catch (err) {
            alert("Failed to copy command to clipboard.");
        }
    });
    verifyConnectionButton.addEventListener("click", async () => {
        const SERVER_STATUS_SUCCESS_MESSAGE = `✅ Server Status: `
        const SERVER_STATUS_ERROR_MESSAGE = "❌ Failed to verify connection"
        try {
            const response = await fetch(SERVER_IP, {method: "GET",});

            if (response.ok) {
                const data = await response.json();
                console.log(SERVER_STATUS_SUCCESS_MESSAGE + data.status);
                alert(SERVER_STATUS_SUCCESS_MESSAGE + data.status);
            } else {
                console.error(SERVER_STATUS_ERROR_MESSAGE);
                alert(SERVER_STATUS_ERROR_MESSAGE);
            }
        } catch (err) {
            console.error(`❌ Network error: ${err}`);
            alert(`❌ Network error: ${err}`);
        }
    });
    resetButton.addEventListener("click", async (event) => {
        event.preventDefault();
        zplTextField.value = "";
        sendToPrinterButton.setAttribute("disabled", "true");
        sendToTerminalButton.setAttribute("disabled", "true");
    })
    */
    printItButton.addEventListener("click", async (event) => {
        event.preventDefault()
        const zpl = generateZPL({
            name: participantName.value,
            company: companyName.value,
            tags: tagList.value.split(",")
        })
        const printerName = printerNameOptions.value
        if (zpl !== "") {
            try {
                const response = await fetch(`${SERVER_IP}/print`, {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({zpl, printerName}),
                });

                if (response.ok) {
                    console.log("✅ ZPL sent successfully!");
                } else {
                    const error = await response.json();
                    console.error("❌ Failed to send ZPL:", error);
                    alert(`Error: ${error.error || "Failed to send ZPL"}`);
                }
            } catch (err) {
                console.error("❌ Network error:", err);
                alert("Network error. Could not send ZPL.");
            }
        }
    })
}
type LabelData = {
    name: string;
    company: string;
    tags: string[];
};

function generateZPL(labelData: LabelData): string {
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
