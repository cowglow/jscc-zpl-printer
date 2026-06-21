import './style.css';
import { initEditor } from './canvas/editor.ts';
import { setLabelSize } from './canvas/config.ts';
import { PRINTER_STORAGE_KEY } from '../shared/constants.ts';

const canvas = document.querySelector<HTMLCanvasElement>('#label-preview');
const form   = document.querySelector<HTMLFormElement>('#editor-form');

// Restore saved printer selection
const printerInput = document.querySelector<HTMLInputElement>('#editor-printer-name');
if (printerInput) {
  const saved = localStorage.getItem(PRINTER_STORAGE_KEY);
  if (saved) printerInput.value = saved;
}

// Fetch live label dimensions from the server then init the editor.
// Falls back to the defaults in config.ts if the server is unreachable.
async function boot(): Promise<void> {
  if (!canvas || !form) return;

  try {
    const res = await fetch('/server-info');
    if (res.ok) {
      const { label } = await res.json() as { label: { width: number; height: number } };
      setLabelSize(label.width, label.height);
    }
  } catch {
    // no backend (demo / dev without server) — use defaults
  }

  initEditor(canvas, form);
}

boot();