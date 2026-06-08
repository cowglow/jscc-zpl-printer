import {createJSCCLabel} from "../../templates/create-jscc-label.ts";
import {createQRLabel} from "../../templates/create-qr-label.ts";

const participantLabelsButton = document.querySelector<HTMLButtonElement>('#participant-labels');
if (participantLabelsButton) {
    participantLabelsButton.addEventListener('click', async (event) => {
        event.preventDefault();
        const printerName = String(
            import.meta.env.VITE_PRINTER_NAME ||
            document.querySelector<HTMLSelectElement>('#printer-name')?.value
        );
        try {
            const response = await fetch('/participants', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({printerName, sourceDir: 'sourceDir'}),
            });
            if (response.ok) {
                alert('✅ Participant labels sent to printer!');
            } else {
                const error = await response.json();
                alert(`Error: ${error.error || 'Failed to print participants'}`);
            }
        } catch (err) {
            console.error('❌ Network error:', err);
            alert('Network error. Could not print participants.');
        }
    });
}

const adminDialog = document.querySelector<HTMLDialogElement>('#admin-dialog');
document.querySelector('#open-admin')?.addEventListener('click', () => adminDialog?.showModal());
document.querySelector('#close-admin')?.addEventListener('click', () => adminDialog?.close());
adminDialog?.addEventListener('click', (event) => {
    if (event.target === adminDialog) adminDialog.close();
});

const printQrButton = document.querySelector<HTMLButtonElement>('#print-client-qr');
if (printQrButton) {
    printQrButton.addEventListener('click', async (event) => {
        event.preventDefault();
        const printerName = String(
            import.meta.env.VITE_PRINTER_NAME ||
            document.querySelector<HTMLSelectElement>('#printer-name')?.value
        );
        const {url} = await fetch('/server-info').then(r => r.json());
        const zpl = createQRLabel(url);
        try {
            const response = await fetch('/print', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({zpl, printerName}),
            });
            if (response.ok) {
                alert('✅ QR code label sent to printer!');
            } else {
                const error = await response.json();
                alert(`Error: ${error.error || 'Failed to print QR code'}`);
            }
        } catch (err) {
            console.error('❌ Network error:', err);
            alert('Network error. Could not print QR code.');
        }
    });
}

const testPrinterButton = document.querySelector<HTMLButtonElement>('#test-printer-connection');
if (testPrinterButton) {
    testPrinterButton.addEventListener('click', async (event) => {
        event.preventDefault();
        const printerIP = String(import.meta.env.VITE_PRINTER_IP || '');
        if (!printerIP) {
            alert('VITE_PRINTER_IP is not set in .env');
            return;
        }
        try {
            const response = await fetch('/test-printer', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({printerIP}),
            });
            const result = await response.json();
            alert(result.message);
        } catch (err) {
            console.error('❌ Network error:', err);
            alert('Network error. Could not reach server.');
        }
    });
}

const formElement = document.querySelector<HTMLFormElement>('#form');
if (formElement) {
    formElement.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(formElement);
        const data = Object.fromEntries(formData.entries());
        const zpl = createJSCCLabel({
            name: String(data.participantName),
            company: String(data.companyName),
            tags: String(data.tagList).split(','),
        });
        const printerName = String(import.meta.env.VITE_PRINTER_NAME || data.printerName);
        try {
            const response = await fetch(`/print`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({zpl, printerName}),
            });

            if (response.ok) {
                console.log('✅ ZPL sent successfully!');
                alert('✅ ZPL sent successfully!');
            } else {
                const error = await response.json();
                console.error('❌ Failed to send ZPL:', error);
                alert(`Error: ${error.error || 'Failed to send ZPL'}`);
            }
        } catch (err) {
            console.error('❌ Network error:', err);
            alert('Network error. Could not send ZPL.');
        }
    });
}
