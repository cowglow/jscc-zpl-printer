import {exec} from 'child_process';
import {sendZPLToUSBPrinter} from './utils/helper.ts';

export type PrinterStatus = 'idle' | 'printing' | 'down';

export type PrintJob = {
    id: string;
    zpl: string;
    printerName?: string;  // when set, only dispatch to this specific printer
    status: 'queued' | 'printing' | 'done' | 'failed';
    printerId?: string;
    createdAt: number;
};

type Printer = {
    id: string;
    status: PrinterStatus;
};

const printerRegistry: Printer[] = [];
const jobQueue: PrintJob[] = [];
const jobMap = new Map<string, PrintJob>();
let jobCounter = 0;

function detectCupsPrinters(): Promise<string[]> {
    return new Promise(resolve => {
        exec('lpstat -p', (error, stdout) => {
            if (error || !stdout.trim()) return resolve([]);
            const names = stdout
                .split('\n')
                .filter(line => line.startsWith('printer '))
                .map(line => line.split(' ')[1]);
            resolve(names);
        });
    });
}

export async function initPrinterPool(maxPrinters = 2): Promise<void> {
    const names = await detectCupsPrinters();
    const poolNames = names.slice(0, maxPrinters);
    printerRegistry.length = 0;
    for (const name of poolNames) {
        printerRegistry.push({id: name, status: 'idle'});
    }
    if (printerRegistry.length === 0) {
        console.warn('[PrintQueue] No printers found via CUPS — queue will hold jobs until a printer is registered.');
    } else {
        console.info(`[PrintQueue] Pool: ${poolNames.join(', ')}`);
    }
}

export function enqueueJob(zpl: string, printerName?: string): PrintJob {
    const job: PrintJob = {
        id: `job-${++jobCounter}`,
        zpl,
        printerName,
        status: 'queued',
        createdAt: Date.now(),
    };
    jobMap.set(job.id, job);
    jobQueue.push(job);
    dispatch();
    return job;
}

function dispatch(): void {
    for (const printer of printerRegistry) {
        if (printer.status !== 'idle') continue;
        // Find the first queued job that targets this printer (or has no target)
        const idx = jobQueue.findIndex(j => !j.printerName || j.printerName === printer.id);
        if (idx === -1) continue;
        const [job] = jobQueue.splice(idx, 1); // synchronous removal before any await
        printer.status = 'printing';
        job.status = 'printing';
        job.printerId = printer.id;
        executePrint(printer, job); // fire-and-forget
    }
}

async function executePrint(printer: Printer, job: PrintJob): Promise<void> {
    try {
        // TODO: detectFailure() — plug automatic jam detection here
        // e.g. poll IPP job status, watch lpstat exit codes, or listen to a USB event
        await sendZPLToUSBPrinter(printer.id, job.zpl);

        if (printer.status === 'printing') {
            // Normal completion — printer not manually jammed during this print
            job.status = 'done';
            printer.status = 'idle';
            dispatch();
        }
        // If printer.status !== 'printing', jamPrinter() ran concurrently and
        // already handled cleanup; leave job and printer state as-is.
    } catch {
        if (printer.status === 'printing') {
            // Natural failure (exec error) — treat as jam, reroute job
            printer.status = 'down';
            job.status = 'queued';
            job.printerId = undefined;
            jobQueue.unshift(job);
            dispatch();
        }
        // If manually jammed, jamPrinter() already handled cleanup.
    }
}

export function jamPrinter(printerId: string): boolean {
    const printer = printerRegistry.find(p => p.id === printerId);
    if (!printer || printer.status === 'down') return false;

    if (printer.status === 'printing') {
        // Rescue the in-flight job so the other printer can pick it up
        const inflight = [...jobMap.values()].find(
            j => j.status === 'printing' && j.printerId === printerId
        );
        if (inflight) {
            inflight.status = 'queued';
            inflight.printerId = undefined;
            jobQueue.unshift(inflight);
        }
    }

    printer.status = 'down';
    dispatch();
    return true;
}

export function recoverPrinter(printerId: string): boolean {
    const printer = printerRegistry.find(p => p.id === printerId);
    if (!printer || printer.status !== 'down') return false;
    printer.status = 'idle';
    dispatch();
    return true;
}

export function getStatus() {
    return {
        queueLength: jobQueue.length,
        printers: printerRegistry.map(p => ({id: p.id, status: p.status})),
        anyAvailable: printerRegistry.length > 0 && printerRegistry.some(p => p.status !== 'down'),
    };
}

export function getJob(jobId: string): PrintJob | undefined {
    return jobMap.get(jobId);
}