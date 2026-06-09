import {imageToZpl, drawImageOnCanvas} from './lib/pngToZpl.ts';

// ── DOM ──────────────────────────────────────────────────────────────────────

const dropZone    = document.querySelector<HTMLDivElement>('#drop-zone')!;
const fileInput   = document.querySelector<HTMLInputElement>('#file-input')!;
const browseBtn   = document.querySelector<HTMLButtonElement>('#browse-btn')!;
const previewWrap = document.querySelector<HTMLDivElement>('#preview-wrap')!;
const canvas      = document.querySelector<HTMLCanvasElement>('#label-canvas')!;
const slider      = document.querySelector<HTMLInputElement>('#threshold')!;
const sliderOut   = document.querySelector<HTMLOutputElement>('#threshold-val')!;
const marginSlider  = document.querySelector<HTMLInputElement>('#margin')!;
const marginOut     = document.querySelector<HTMLOutputElement>('#margin-val')!;
const widthInput  = document.querySelector<HTMLInputElement>('#label-width')!;
const heightInput = document.querySelector<HTMLInputElement>('#label-height')!;
const printBtn    = document.querySelector<HTMLButtonElement>('#print-btn')!;
const rotateBtn   = document.querySelector<HTMLButtonElement>('#rotate-btn')!;
const changeBtn   = document.querySelector<HTMLButtonElement>('#change-btn')!;
const statusEl    = document.querySelector<HTMLSpanElement>('#status')!;

// ── Label dimensions ─────────────────────────────────────────────────────────

const PREVIEW_W = 260;
const LS_W = 'jscc-label-width';
const LS_H = 'jscc-label-height';

function getLabelWidth()  { return Number(widthInput.value)  || 1200; }
function getLabelHeight() { return Number(heightInput.value) || 1800; }

// Restore persisted dimensions immediately so preview is correct before server responds
const savedW = localStorage.getItem(LS_W);
const savedH = localStorage.getItem(LS_H);
if (savedW) widthInput.value  = savedW;
if (savedH) heightInput.value = savedH;

// Server-info overrides saved values only when IPP succeeds (non-fallback detection)
fetch('/server-info')
    .then(r => r.json())
    .then(({label}: {label: {width: number; height: number}}) => {
        widthInput.value  = String(label.width);
        heightInput.value = String(label.height);
        localStorage.setItem(LS_W, String(label.width));
        localStorage.setItem(LS_H, String(label.height));
        renderPreview();
    })
    .catch(() => { /* keep saved/default values */ });

widthInput.addEventListener('change',  () => {
    localStorage.setItem(LS_W, widthInput.value);
    renderPreview();
});
heightInput.addEventListener('change', () => {
    localStorage.setItem(LS_H, heightInput.value);
    renderPreview();
});

let currentImg: HTMLImageElement | null = null;
let currentRotation: 0 | 90 | 180 | 270 = 0;

// ── Drag-and-drop / file pick ────────────────────────────────────────────────

browseBtn.addEventListener('click', e => { e.stopPropagation(); fileInput.click(); });
dropZone.addEventListener('click',     () => fileInput.click());
dropZone.addEventListener('keydown',   e => { if (e.key === 'Enter' || e.key === ' ') fileInput.click(); });
dropZone.addEventListener('dragover',  e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
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
    currentRotation = 0;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
        currentImg = img;
        dropZone.hidden    = true;
        previewWrap.hidden = false;
        printBtn.disabled  = false;
        setStatus(`${img.naturalWidth} × ${img.naturalHeight} px`);
        renderPreview();
        URL.revokeObjectURL(url);
    };
    img.onerror = () => setStatus('Could not load image.');
    img.src = url;
}

// ── Live preview ─────────────────────────────────────────────────────────────

function renderPreview() {
    if (!currentImg) return;
    const threshold  = Number(slider.value);
    sliderOut.textContent = String(threshold);

    const marginDots = Number(marginSlider.value);
    marginOut.textContent = String(marginDots);

    const labelW = getLabelWidth();
    const labelH = getLabelHeight();
    const previewH = Math.round(PREVIEW_W * (labelH / labelW));
    canvas.width  = PREVIEW_W;
    canvas.height = previewH;

    // Scale label-dot padding to preview pixel padding so preview matches print
    const previewPadding = Math.round(marginDots * PREVIEW_W / labelW);

    const ctx = canvas.getContext('2d')!;
    drawImageOnCanvas(ctx, currentImg, PREVIEW_W, previewH, currentRotation, previewPadding);

    // Apply threshold in-place so preview matches printed output exactly
    const imgData = ctx.getImageData(0, 0, PREVIEW_W, previewH);
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
marginSlider.addEventListener('input', renderPreview);

rotateBtn.addEventListener('click', () => {
    currentRotation = ((currentRotation + 90) % 360) as 0 | 90 | 180 | 270;
    renderPreview();
});

// ── Print ─────────────────────────────────────────────────────────────────────

printBtn.addEventListener('click', async () => {
    if (!currentImg) return;
    printBtn.disabled = true;
    setStatus('Converting…');

    try {
        const threshold  = Number(slider.value);
        const marginDots = Number(marginSlider.value);
        const labelW     = getLabelWidth();
        const labelH     = getLabelHeight();
        const zpl = imageToZpl(currentImg, labelW, labelH, threshold, currentRotation, marginDots);
        const printerName = localStorage.getItem('jscc-printer') || undefined;

        if (import.meta.env.DEV) {
            await new Promise(r => setTimeout(r, 600));
            setStatus(`⚠ Dev — simulated (${labelW}×${labelH}, t=${threshold})`);
        } else {
            const res = await fetch('/print', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({zpl, printerName}),
            });
            if (res.ok) {
                const {jobId} = await res.json();
                setStatus(`✓ Queued — ${jobId}`);
            } else {
                const err = await res.json().catch(() => ({}));
                setStatus(`✗ ${err.error ?? `Error ${res.status}`}`);
            }
        }
    } catch (err) {
        console.error(err);
        setStatus('✗ Conversion failed.');
    } finally {
        printBtn.disabled = false;
    }
});

// ── Reset ─────────────────────────────────────────────────────────────────────

changeBtn.addEventListener('click', () => {
    currentImg         = null;
    fileInput.value    = '';
    dropZone.hidden    = false;
    previewWrap.hidden = true;
    printBtn.disabled  = true;
    setStatus('');
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
});

function setStatus(msg: string) {
    statusEl.textContent = msg;
}