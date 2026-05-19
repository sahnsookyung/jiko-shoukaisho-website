import { copyFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const outputDir = 'dist';
const workerCandidates = [
    join('.worker-build', 'worker.js'),
    join('.worker-build', 'src', 'worker.js'),
];

const workerPath = workerCandidates.find((candidate) => existsSync(candidate));

if (!workerPath) {
    throw new Error('Compiled Worker output was not found.');
}

await mkdir(outputDir, { recursive: true });
await copyFile(workerPath, join(outputDir, '_worker.js'));
await rm('.worker-build', { recursive: true, force: true });
