import {createJSCCLabel} from "../../templates/create-jscc-label.ts";
import {PRINTER_STORAGE_KEY} from "../../../shared/constants.ts";

const overlay = document.querySelector<HTMLDivElement>('#loading-overlay')!;
const showLoading = () => { overlay.classList.add('visible'); document.body.setAttribute('aria-busy', 'true'); };
const hideLoading = () => { overlay.classList.remove('visible'); document.body.removeAttribute('aria-busy'); };

if (new URLSearchParams(location.search).has('admin')) {
    document.querySelector<HTMLButtonElement>('#open-admin')!.hidden = false;
}

if (import.meta.env.DEV) {
    const banner = document.createElement('div');
    banner.id = 'dev-banner';
    banner.textContent = '⚠ Dev mode — printer output may not be available';
    document.body.prepend(banner);
}


const printerInput = document.querySelector<HTMLInputElement>('#printer-name');
const adminPrinterSelect = document.querySelector<HTMLSelectElement>('#admin-printer-select');

function setActivePrinter(name: string) {
    if (printerInput) printerInput.value = name;
    if (adminPrinterSelect) adminPrinterSelect.value = name;
    if (name) {
        localStorage.setItem(PRINTER_STORAGE_KEY, name);
    } else {
        localStorage.removeItem(PRINTER_STORAGE_KEY);
    }
}

if (printerInput) {
    const saved = localStorage.getItem(PRINTER_STORAGE_KEY);
    if (saved) printerInput.value = saved;
}

if (adminPrinterSelect) {
    adminPrinterSelect.addEventListener('change', () => {
        setActivePrinter(adminPrinterSelect.value);
    });
}

fetch('/printers')
    .then(r => r.json())
    .then(({printers}: {printers: string[]}) => {
        const saved = localStorage.getItem(PRINTER_STORAGE_KEY);
        if (adminPrinterSelect) {
            const placeholder = '<option value="">Select a printer…</option>';
            adminPrinterSelect.innerHTML = placeholder + printers.map(p => `<option value="${p}">${p}</option>`).join('');
        }
        if (printers.length) {
            if (saved && printers.includes(saved)) setActivePrinter(saved);
        } else {
            setActivePrinter('');
        }
    })
    .catch(() => {
        if (adminPrinterSelect) adminPrinterSelect.innerHTML = '<option value="">Could not load printers</option>';
    });

const adminDialog = document.querySelector<HTMLDialogElement>('#admin-dialog');
document.querySelector('#open-admin')?.addEventListener('click', () => adminDialog?.showModal());
document.querySelector('#close-admin')?.addEventListener('click', () => adminDialog?.close());
adminDialog?.addEventListener('click', (event) => {
    if (event.target === adminDialog) adminDialog.close();
});

const participantLabelsButton = document.querySelector<HTMLButtonElement>('#participant-labels');
if (participantLabelsButton) {
    participantLabelsButton.addEventListener('click', async (event) => {
        event.preventDefault();
        adminDialog?.close();
        const printerName = String(
            import.meta.env.VITE_PRINTER_NAME ||
            document.querySelector<HTMLInputElement>('#printer-name')?.value
        );
        showLoading();
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
        } finally {
            hideLoading();
        }
    });
}

const printQrButton = document.querySelector<HTMLButtonElement>('#print-client-qr');
if (printQrButton) {
    printQrButton.addEventListener('click', async (event) => {
        event.preventDefault();
        adminDialog?.close();
        const printerName = String(
            import.meta.env.VITE_PRINTER_NAME ||
            document.querySelector<HTMLInputElement>('#printer-name')?.value
        );
        showLoading();
        try {
            const {url, label} = await fetch('/server-info').then(r => r.json());
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
        } finally {
            hideLoading();
        }
    });
}

const testPrinterButton = document.querySelector<HTMLButtonElement>('#test-printer-connection');
if (testPrinterButton) {
    testPrinterButton.addEventListener('click', async (event) => {
        event.preventDefault();
        const printerName = String(import.meta.env.VITE_PRINTER_NAME || '');
        if (!printerName) {
            alert('VITE_PRINTER_NAME is not set in .env');
            return;
        }
        showLoading();
        try {
            const response = await fetch('/test-printer', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({printerName}),
            });
            const result = await response.json();
            alert(result.message);
        } catch (err) {
            console.error('❌ Network error:', err);
            alert('Network error. Could not reach server.');
        } finally {
            hideLoading();
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
        showLoading();
        const formData = new FormData(formElement);
        const data = Object.fromEntries(formData.entries());
        const zpl = createJSCCLabel({
            name: String(data.participantName),
            company: String(data.companyName),
            tags: String(data.tagList).split(','),
        });
        const printerName = String(import.meta.env.VITE_PRINTER_NAME || data.printerName);
        try {
            if (import.meta.env.DEV) {
                await new Promise(resolve => setTimeout(resolve, 800));
                alert('⚠ Dev mode: print simulated.');
            } else {
                const response = await fetch(`/print`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({zpl, printerName}),
                });
                if (response.ok) {
                    alert('✅ Label sent to printer!');
                } else {
                    const error = await response.json().catch(() => ({}));
                    alert(`Error: ${error.error || `Server error ${response.status}`}`);
                }
            }
        } catch (err) {
            console.error('❌ Network error:', err);
            alert('Network error. Could not send ZPL.');
        } finally {
            hideLoading();
            printButton.disabled = !nameInput?.value.trim();
        }
    });
}
