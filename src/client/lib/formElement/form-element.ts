import {createJSCC25Label} from "../../templates/create-jscc25-label.ts";

const formElement = document.querySelector<HTMLFormElement>('#form');
if (formElement) {
    formElement.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(formElement);
        const data = Object.fromEntries(formData.entries());
        const zpl = createJSCC25Label({
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
