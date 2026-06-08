import {createJSCCLabel} from "../../templates/create-jscc-label.ts";

const printerSelect = document.querySelector<HTMLSelectElement>('#printer-name');
if (printerSelect) {
    fetch('/printers')
        .then(r => r.json())
        .then(({printers}: {printers: string[]}) => {
            printerSelect.innerHTML = printers.length
                ? printers.map(p => `<option value="${p}">${p}</option>`).join('')
                : '<option value="">No printers found</option>';
        })
        .catch(() => {
            printerSelect.innerHTML = '<option value="">Could not load printers</option>';
        });
}

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
        const {url, label} = await fetch('/server-info').then(r => r.json());
        try {
            const response = await fetch('/print-qr', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({printerName, url, labelWidth: label.width, labelHeight: label.height}),
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
const printButton = document.querySelector<HTMLButtonElement>('#-print-it');
const nameInput = document.querySelector<HTMLInputElement>('#participant-name');


if (printButton) printButton.disabled = !nameInput?.value.trim();

nameInput?.addEventListener('input', () => {
    if (printButton) printButton.disabled = !nameInput.value.trim();
});

if (formElement) {
    formElement.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!printButton) return;
        printButton.disabled = true;
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
                alert('✅ ZPL sent successfully!');
            } else {
                const error = await response.json().catch(() => ({}));
                alert(`Error: ${error.error || `Server error ${response.status}`}`);
            }
        } catch (err) {
            console.error('❌ Network error:', err);
            alert('Network error. Could not send ZPL.');
        } finally {
            printButton.disabled = !nameInput?.value.trim();
        }
    });
}
