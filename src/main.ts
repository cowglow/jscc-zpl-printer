import './style.css'
import {rgbaToZ64} from 'zpl-image';

// @ts-ignore
import {Label, PrintDensity, PrintDensityName, Spacing, Text, FontFamily, FontFamilyName} from "jszpl";

const SERVER_IP = "http://localhost:9100"

const fileInput = document.querySelector<HTMLInputElement>('#file-upload');
const textZplField = document.querySelector<HTMLTextAreaElement>("textarea#text-to-zpl")
const zplTextField = document.querySelector<HTMLTextAreaElement>("textarea#zpl-to-print")

const convertToZPLButton = document.querySelector<HTMLButtonElement>("button#convert-to-zpl")
const sendToPrinterButton = document.querySelector<HTMLButtonElement>("button#send-to-printer")
const verifyConnectionButton = document.querySelector<HTMLButtonElement>("button#verify-connection")
const sendToTerminalButton = document.querySelector<HTMLButtonElement>("button#send-to-terminal")
const resetButton = document.querySelector<HTMLButtonElement>("button#reset")
// Event listener for form submission
const convertTxtToZPL = (input: string) => {
    const marginX = 118;
    const eventCode = "#JSCC25";
    const zpl = `^XA^PW1476^LL1205^FO${marginX},100^A0,N,136,136^FD${eventCode}^FS^FO${marginX},300^A0,N,100,100^FD${input}^FS^XZ`;
    return zpl;
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
};

if (
    fileInput &&
    textZplField &&
    convertToZPLButton &&
    zplTextField &&
    sendToPrinterButton &&
    sendToTerminalButton &&
    verifyConnectionButton &&
    resetButton
) {
    fileInput.addEventListener('change', (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file && file.type === 'image/png') {
            const reader = new FileReader();

            reader.onload = (e) => {
                if (e.target?.result) {
                    const base64String = e.target.result as string;

                    // Create an image from the base64 string
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');

                        if (ctx) {
                            canvas.width = img.width;
                            canvas.height = img.height;
                            ctx.drawImage(img, 0, 0);

                            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                            const rgba = Uint8Array.from(imageData.data); // Convert to Uint8Array
                            const width = imageData.width;

                            // Generate ZPL using rgbaToZ64
                            // console.log({rgba, width});
                            // const result = rgbaToZ64(rbga, width, {black: 50, rotate: 'N'});

                            // Display the ZPL in the textarea
                            // zplTextField.value = `^GFA,${result.length},${result.length},${result.rowlen},${result.z64}`;
                        }
                    };

                    img.src = base64String;
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
            zplTextField.value = convertTxtToZPL(textZplField.value);
            sendToPrinterButton.removeAttribute("disabled");
            sendToTerminalButton.removeAttribute("disabled");
        }
    })
    sendToPrinterButton.addEventListener("click", async () => {
        const zpl = convertTxtToZPL(textZplField.value.trim());

        if (zpl !== "") {
            try {
                const response = await fetch(`${SERVER_IP}/print`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({zpl}),
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
        const zpl = zplTextField.value.trim();
        if (zpl === "") return;
        // Escape double quotes in ZPL
        const safeZPL = zpl.replace(/"/g, '\\"');
        const cmd = `echo "${safeZPL}" | lp -d Intermec_PC43t_300_FP -o raw`;
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
            const response = await fetch(SERVER_IP, {
                method: "GET",
            });

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
}