import {imageToZpl} from './pngToZpl.ts';

// ── DOM refs ────────────────────────────────────────────────────────────────
const dropZone    = document.querySelector<HTMLDivElement>('#img-drop-zone')!;
const fileInput   = document.querySelector<HTMLInputElement>('#img-file-input')!;
const preview     = document.querySelector<HTMLDivElement>('#img-preview')!;
const canvas      = document.querySelector<HTMLCanvasElement>('#img-canvas')!;
const slider      = document.querySelector<HTMLInputElement>('#img-threshold')!;
const sliderLabel = document.querySelector<HTMLOutputElement>('#img-threshold-val')!;
const printBtn    = document.querySelector<HTMLButtonElement>('#img-print-btn')!;
const resetBtn    = document.querySelector<HTMLButtonElement>('#img-reset-btn')!;
const statusEl    = document.querySelector<HTMLSpanElement>('#img-status')!;

if (!dropZone) {
    // Module loaded on a page that doesn't have the image printer — do nothing.
    // @ts-ignore — early exit without the full module running
    throw 0;
}

let currentImage: HTMLImageElement | null = null;
let labelWidth  = 1200;
let labelHeight = 1800;

// Fetch label dims once on load
fetch('/server-info')
    .then(r => r.json())
    .then(({label}: {label: {width: number; height: number}}) => {
        labelWidth  = label.width;
        labelHeight = label.height;
        // Set canvas to label proportions for the preview
        fitCanvas();
    })
    .catch(() => { /* use defaults */ });

function fitCanvas() {
    // Display canvas proportionally within its CSS max-width
    const ratio = labelHeight / labelWidth;
    const displayW = canvas.offsetWidth || 300;
    canvas.width  = labelWidth;
    canvas.height = labelHeight;
    canvas.style.height = `${displayW * ratio}px`;
}

// ── Drag-and-drop ────────────────────────────────────────────────────────────

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer?.files[0];
    if (file) loadFile(file);
});
fileInput.addEventListener('change', () => {
    if (fileInput.files?.[0]) loadFile(fileInput.files[0]);
});

function loadFile(file: File) {
    if (!file.type.startsWith('image/')) {
        setStatus('Please drop an image file.');
        return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
        currentImage = img;
        fitCanvas();
        renderPreview();
        dropZone.hidden  = true;
        preview.hidden   = false;
        printBtn.disabled = false;
        setStatus(`${img.naturalWidth} × ${img.naturalHeight} px`);
    };
    img.src = url;
}

// ── Live preview ─────────────────────────────────────────────────────────────

function renderPreview() {
    if (!currentImage) return;
    const threshold = Number(slider.value);
    sliderLabel.textContent = String(threshold);

    const ctx = canvas.getContext('2d')!;

    // Scale to fit (contain) within label dims
    const scale = Math.min(labelWidth / currentImage.naturalWidth, labelHeight / currentImage.naturalHeight);
    const drawW = Math.round(currentImage.naturalWidth  * scale);
    const drawH = Math.round(currentImage.naturalHeight * scale);
    const ox = Math.round((labelWidth  - drawW) / 2);
    const oy = Math.round((labelHeight - drawH) / 2);

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, labelWidth, labelHeight);
    ctx.drawImage(currentImage, ox, oy, drawW, drawH);

    // Apply threshold in-place for preview
    const imgData = ctx.getImageData(0, 0, labelWidth, labelHeight);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
        const a = d[i + 3] / 255;
        const r = d[i]     * a + 255 * (1 - a);
        const g = d[i + 1] * a + 255 * (1 - a);
        const b = d[i + 2] * a + 255 * (1 - a);
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
        const v = luma < threshold ? 0 : 255;
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
}

slider.addEventListener('input', renderPreview);

// ── Print ────────────────────────────────────────────────────────────────────

printBtn.addEventListener('click', async () => {
    if (!currentImage) return;
    printBtn.disabled = true;
    setStatus('Converting…');

    try {
        const threshold = Number(slider.value);
        const zpl = imageToZpl(currentImage, labelWidth, labelHeight, threshold);

        if (import.meta.env.DEV) {
            await new Promise(r => setTimeout(r, 600));
            setStatus(`⚠ Dev mode — simulated (${labelWidth}×${labelHeight} dots, threshold ${threshold})`);
        } else {
            const res = await fetch('/print', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({zpl}),
            });
            if (res.ok) {
                const {jobId} = await res.json();
                setStatus(`✓ Queued (${jobId})`);
            } else {
                const err = await res.json().catch(() => ({}));
                setStatus(`✗ ${err.error ?? `Error ${res.status}`}`);
            }
        }
    } catch (err) {
        console.error(err);
        setStatus('✗ Failed to convert or send image.');
    } finally {
        printBtn.disabled = false;
    }
});

// ── Reset ────────────────────────────────────────────────────────────────────

resetBtn.addEventListener('click', () => {
    currentImage = null;
    fileInput.value = '';
    dropZone.hidden = false;
    preview.hidden  = true;
    printBtn.disabled = true;
    setStatus('');
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

function setStatus(msg: string) {
    statusEl.textContent = msg;
}