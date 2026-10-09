'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { Client } = require('minecraft-launcher-core');
const {
  maxAllowedMemoryGb,
  recommendedMemoryGb,
  clampMemoryGb,
  clientJvmFlags,
  minMemoryArg,
} = require('./memory');

function gameRoot() {
  return path.join(os.homedir(), '.nachtblau-minecraft');
}

function javaWorks(bin) {
  if (!bin) return false;
  if (bin.includes(path.sep) && !fs.existsSync(bin)) return false;
  const result = spawnSync(bin, ['-version'], {
    encoding: 'utf8',
    timeout: 5000,
  });
  const text = `${result.stdout || ''}${result.stderr || ''}`;
  return result.status === 0 || /version|openjdk|java/i.test(text);
}

/**
 * Find a usable Java binary for modern Minecraft (21+ recommended).
 * @returns {string | null}
 */
function findJavaPath() {
  const isWin = process.platform === 'win32';
  const javaName = isWin ? 'java.exe' : 'java';
  const envJava = process.env.JAVA_HOME
    ? path.join(process.env.JAVA_HOME, 'bin', javaName)
    : null;
  const home = os.homedir();
  // Bazzite / Fedora Atomic: User-Space Temurin via Install-Java21-Bazzite.sh
  const nachtblauJdk = path.join(
    home,
    '.local',
    'share',
    'nachtblau',
    'jdk-21',
    'bin',
    javaName
  );
  const homeJdk = path.join(home, 'jdk-21', 'bin', javaName);
  const localBinJava = path.join(home, '.local', 'bin', javaName);

  const candidates = [
    envJava,
    nachtblauJdk,
    homeJdk,
    localBinJava,
    javaName,
    '/usr/lib/jvm/java-21-openjdk/bin/java',
    '/usr/lib/jvm/java-21/bin/java',
    '/usr/lib/jvm/temurin-21/bin/java',
    '/usr/bin/java',
    '/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home/bin/java',
    'C:\\Program Files\\Eclipse Adoptium\\jdk-21\\bin\\java.exe',
    'C:\\Program Files\\Java\\jdk-21\\bin\\java.exe',
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (javaWorks(candidate)) return candidate;
  }
  return null;
}

/** LAN vs Internet: zu Hause .33:25565, unterwegs publicHost + playit-Port. */
function isOnLan() {
  const nets = os.networkInterfaces();
  for (const list of Object.values(nets)) {
    for (const n of list || []) {
      const ip = n.address || '';
      if (ip.startsWith('192.168.178.')) return true;
    }
  }
  return false;
}

function pickConnectHost(server) {
  const lan = server.host || '192.168.178.33';
  const wan = server.publicHost || lan;
  return isOnLan() ? lan : wan;
}

function pickConnectPort(server) {
  if (isOnLan()) return Number(server.lanPort) || 25565;
  return Number(server.port) || 25565;
}

/**
 * Seed laptop-friendly options.txt once (does not overwrite existing prefs).
 * @param {string} root
 */
function ensureLaptopOptions(root) {
  const optionsPath = path.join(root, 'options.txt');
  if (fs.existsSync(optionsPath)) return;

  const lines = [
    'version:3465',
    'autoJump:false',
    'renderDistance:10',
    'simulationDistance:8',
    'entityDistanceScaling:1.0',
    'maxFps:120',
    'enableVsync:true',
    'graphicsMode:1',
    'prioritizeChunkUpdates:0',
    'mipmapLevels:2',
    'biomeBlendRadius:2',
    'fullscreen:false',
    'incompatibleResourcePacks:[]',
    'resourcePacks:[]',
  ];
  fs.writeFileSync(optionsPath, `${lines.join('\n')}\n`, 'utf8');
}

/**
 * @param {object} opts
 * @param {object} opts.authorization MCLC auth object
 * @param {{ host: string, publicHost?: string, port: number, version: string, name?: string }} opts.server
 * @param {number} opts.memoryGb
 * @param {(evt: { type: string, message?: string, progress?: number }) => void} [opts.onProgress]
 * @returns {Promise<{ root: string }>}
 */
function launchMinecraft({ authorization, server, memoryGb, onProgress }) {
  const root = gameRoot();
  fs.mkdirSync(root, { recursive: true });
  ensureLaptopOptions(root);

  const javaPath = findJavaPath();
  if (!javaPath) {
    return Promise.reject(
      new Error(
        'Kein Java gefunden. Bitte Java 21+ installieren (z. B. Temurin 21) und den Launcher neu starten.'
      )
    );
  }

  const memGb = clampMemoryGb(memoryGb);
  const maxMem = `${memGb}G`;
  const minMem = minMemoryArg(memGb);
  const host = pickConnectHost(server);
  const port = pickConnectPort(server);
  const address = `${host}:${port}`;

  const launcher = new Client();

  launcher.on('debug', (e) => {
    onProgress?.({ type: 'debug', message: String(e) });
  });
  launcher.on('data', (e) => {
    onProgress?.({ type: 'data', message: String(e) });
  });
  launcher.on('progress', (e) => {
    const type = e?.type || 'download';
    const task = e?.task != null ? Number(e.task) : 0;
    const total = e?.total != null ? Number(e.total) : 0;
    const progress = total > 0 ? Math.min(100, Math.round((task / total) * 100)) : undefined;
    onProgress?.({
      type: 'progress',
      message: `${type}${progress != null ? ` · ${progress}%` : ''}`,
      progress,
    });
  });
  launcher.on('download-status', (e) => {
    const name = e?.name || 'Datei';
    const current = Number(e?.current) || 0;
    const total = Number(e?.total) || 0;
    const progress = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : undefined;
    onProgress?.({
      type: 'download',
      message: `Download: ${name}${progress != null ? ` · ${progress}%` : ''}`,
      progress,
    });
  });

  const opts = {
    authorization: Promise.resolve(authorization),
    root,
    javaPath,
    version: {
      number: String(server.version),
      type: 'release',
    },
    memory: {
      max: maxMem,
      min: minMem,
    },
    customArgs: clientJvmFlags(memGb),
    quickPlay: {
      type: 'multiplayer',
      identifier: address,
    },
    window: {
      width: 1280,
      height: 720,
    },
  };

  return new Promise((resolve, reject) => {
    let settled = false;

    launcher.on('close', (code) => {
      onProgress?.({ type: 'close', message: `Minecraft beendet (Code ${code})` });
    });

    launcher
      .launch(opts)
      .then(() => {
        if (!settled) {
          settled = true;
          onProgress?.({
            type: 'launched',
            message: `Verbunden mit ${address} · Heap ${minMem}–${maxMem}`,
          });
          resolve({ root });
        }
      })
      .catch((err) => {
        if (!settled) {
          settled = true;
          reject(err);
        }
      });
  });
}

module.exports = {
  launchMinecraft,
  gameRoot,
  findJavaPath,
  pickConnectHost,
  pickConnectPort,
  maxAllowedMemoryGb,
  recommendedMemoryGb,
  clampMemoryGb,
  ensureLaptopOptions,
};
