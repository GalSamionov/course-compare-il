// מרנדר את סצנת מקרא הצבעים (legend/index.html) עם HyperFrames, בלי טלמטריה ובלי בדיקת עדכונים.
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const env = { ...process.env, HYPERFRAMES_NO_TELEMETRY: '1', DO_NOT_TRACK: '1', HYPERFRAMES_NO_UPDATE_CHECK: '1' };
const args = ['hyperframes', 'render', 'legend', '-o', 'public/legend/legend.mp4', '--fps', '30', '--quality', 'delivery'];
const run = spawnSync('npx', args, { cwd: root, env, stdio: 'inherit', shell: process.platform === 'win32' });
process.exit(run.status ?? 1);
