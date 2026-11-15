#!/usr/bin/env node
/**
 * Supabase לפיתוח, על הרספברי פיי של גל ולא ב-Docker במחשב (Docker במחשב תקע אותו).
 *
 * `pnpm db:*` מגיעות לכאן. כל פקודה מעתיקה את התיקייה supabase/ של הענף הנוכחי לפיי,
 * ומריצה שם את ה-CLI של Supabase. המחשב מגיע ל-127.0.0.1:54321/54322/54324 דרך מנהרת SSH,
 * ולכן web/.env.local וההגנות של "רק מקומי" לא משתנים. בפיי, Docker פותח פורטים רק ל-127.0.0.1.
 *
 * ב-CI (CI=true), או עם LAMADTI_DB=docker, הפקודות רצות על Docker מקומי כמו קודם.
 * הוראות מלאות: README.md, "סביבת הפיתוח".
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';

const HOST = process.env.LAMADTI_PI_HOST ?? 'gsamionov@tjr-multi-bot.local';
const KEY = process.env.LAMADTI_PI_KEY ?? join(homedir(), '.ssh', 'id_ed25519_pi');
const PORTS = [54321, 54322, 54324]; // ה-API, Postgres, Mailpit
// מה שהאתר לא צריך. ככה Supabase תופס כ-1GB בפיי ולא 2–3GB.
const EXCLUDE = 'realtime,imgproxy,postgres-meta,studio,edge-runtime,logflare,vector,supavisor';
const PID_FILE = join(tmpdir(), 'lamadti-pi-tunnel.pid');
const SSH_OPTS = ['-i', KEY, '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10'];

const args = process.argv.slice(2);
const onDocker = Boolean(process.env.CI) || process.env.LAMADTI_DB === 'docker';

const q = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;

/** Docker מקומי: בדיוק הפקודה של פעם. */
function runLocal() {
  if (args[0] === 'tunnel') fail('tunnel is only for the Pi (unset LAMADTI_DB / CI)');
  const r = spawnSync('supabase', args, { stdio: 'inherit', shell: process.platform === 'win32' });
  process.exit(r.status ?? 1);
}

/**
 * ה-CLI מפרסם את הפורטים בלי כתובת, ו-Docker פותח אותם לכל הרשת (0.0.0.0).
 * לכן יוצרים מראש את הרשת שלו, עם ברירת מחדל של 127.0.0.1. ה-CLI משתמש ברשת שכבר קיימת,
 * ו-`supabase stop` לא מוחק אותה (אין עליה את התווית שלו).
 */
function loopbackNetwork() {
  const id = readFileSync('supabase/config.toml', 'utf8').match(/^project_id\s*=\s*"([^"]+)"/m)?.[1];
  if (!id) fail('project_id not found in supabase/config.toml');
  const net = q(`supabase_network_${id}`);
  return [
    `if docker network inspect ${net} >/dev/null 2>&1 && ! docker network inspect ${net} --format '{{json .Options}}' | grep -q 'host_binding_ipv4.:.127\\.0\\.0\\.1'; then docker network rm ${net} >/dev/null; fi`,
    `docker network inspect ${net} >/dev/null 2>&1 || docker network create -o com.docker.network.bridge.host_binding_ipv4=127.0.0.1 ${net} >/dev/null`,
  ];
}

/** מעתיק את supabase/ לפיי ומריץ שם את ה-CLI. נעילה אחת: שני סשנים לא מאפסים במקביל. */
function runOnPi(supabaseArgs) {
  if (!existsSync('supabase/config.toml')) fail('run from the repo root (supabase/config.toml not found)');
  const remote = [
    'set -e',
    'mkdir -p ~/lamadti-dev/supabase',
    'cd ~/lamadti-dev',
    'exec 9>.lock',
    'flock -w 900 9 || { echo "pi-db: another db command is still running on the Pi" >&2; exit 75; }',
    'find supabase -mindepth 1 -maxdepth 1 ! -name .temp ! -name .branches -exec rm -rf {} +',
    'tar -xf -',
    ...loopbackNetwork(),
    `exec "$HOME/.local/bin/supabase" ${supabaseArgs.map(q).join(' ')}`,
  ].join('; ');
  return new Promise((resolve) => {
    const tar = spawn('tar', ['-cf', '-', '--exclude=supabase/.temp', '--exclude=supabase/.branches', 'supabase'], {
      stdio: ['ignore', 'pipe', 'inherit'],
    });
    const ssh = spawn('ssh', [...SSH_OPTS, HOST, remote], { stdio: ['pipe', 'inherit', 'inherit'] });
    tar.stdout.pipe(ssh.stdin);
    tar.on('error', (e) => fail(`tar: ${e.message}`));
    ssh.on('error', (e) => fail(`ssh: ${e.message}`));
    ssh.on('close', (code) => {
      if (code === 255) console.error(`pi-db: could not reach the Pi (${HOST}). Is it on, and on the home network?`);
      resolve(code ?? 1);
    });
  });
}

async function reachable(url) {
  try {
    await fetch(url, { signal: AbortSignal.timeout(3000) });
    return true;
  } catch {
    return false;
  }
}

function tunnelPid() {
  try {
    const pid = Number(readFileSync(PID_FILE, 'utf8'));
    process.kill(pid, 0);
    return pid;
  } catch {
    return null;
  }
}

/** המנהרה עצמה, בלולאה: אם החיבור נופל (הפיי אותחל, הרשת קפצה), מתחברים שוב. */
async function tunnelForeground() {
  const forwards = PORTS.flatMap((p) => ['-L', `127.0.0.1:${p}:127.0.0.1:${p}`]);
  for (;;) {
    const ssh = spawn(
      'ssh',
      [...SSH_OPTS, '-N', '-o', 'ExitOnForwardFailure=yes', '-o', 'ServerAliveInterval=15', '-o', 'ServerAliveCountMax=3', ...forwards, HOST],
      { stdio: ['ignore', 'inherit', 'inherit'], windowsHide: true },
    );
    const code = await new Promise((r) => ssh.on('close', r));
    console.error(`pi-db: tunnel closed (${code}), reconnecting in 5s`);
    await new Promise((r) => setTimeout(r, 5000));
  }
}

async function tunnelStart() {
  const running = tunnelPid();
  if (!running) {
    const child = spawn(process.execPath, [process.argv[1], 'tunnel', '--foreground'], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    });
    child.unref();
    writeFileSync(PID_FILE, String(child.pid));
  }
  for (let i = 0; i < 20; i++) {
    if (await reachable('http://127.0.0.1:54321/rest/v1/')) {
      console.log(`tunnel: ${running ? 'already open' : 'open'}. 127.0.0.1:${PORTS.join('/')} -> ${HOST}`);
      return 0;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  console.error('tunnel: started, but the API does not answer. Is Supabase running on the Pi? (pnpm db:start)');
  return 1;
}

function tunnelStop() {
  const pid = tunnelPid();
  rmSync(PID_FILE, { force: true });
  if (!pid) return console.log('tunnel: not running');
  // עוצרים את כל העץ: הלולאה וה-ssh שתחתיה.
  if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' });
  else process.kill(-pid);
  console.log('tunnel: closed');
}

async function tunnelStatus() {
  const api = await reachable('http://127.0.0.1:54321/rest/v1/');
  const mail = await reachable('http://127.0.0.1:54324/api/v1/info');
  console.log(`tunnel: ${tunnelPid() ? 'running' : 'not running'}. API: ${api ? 'ok' : 'no answer'}. Mailpit: ${mail ? 'ok' : 'no answer'}`);
  return api && mail ? 0 : 1;
}

function fail(message) {
  console.error(`pi-db: ${message}`);
  process.exit(1);
}

async function main() {
  if (args.length === 0) fail('usage: node scripts/pi-db.mjs <supabase args> | start | stop | tunnel [stop|status]');
  if (onDocker) return runLocal();

  if (args[0] === 'tunnel') {
    if (args[1] === '--foreground') return tunnelForeground();
    if (args[1] === 'stop') return tunnelStop();
    if (args[1] === 'status') return process.exit(await tunnelStatus());
    return process.exit(await tunnelStart());
  }
  if (args[0] === 'start') {
    const code = await runOnPi(['start', '-x', EXCLUDE, ...args.slice(1)]);
    if (code !== 0) process.exit(code);
    return process.exit(await tunnelStart());
  }
  if (args[0] === 'stop') tunnelStop();
  process.exit(await runOnPi(args));
}

main();
