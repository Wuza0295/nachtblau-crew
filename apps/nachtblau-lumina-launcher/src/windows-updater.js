'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { app } = require('electron');

/**
 * Resolve packaged helper scripts (extraResources) or repo scripts/ in dev.
 * @returns {{ ps1: string, cmd: string } | null}
 */
function resolveHelperScripts() {
  const candidates = [
    process.resourcesPath || '',
    path.join(__dirname, '..', 'scripts'),
  ];
  for (const root of candidates) {
    if (!root) continue;
    const ps1 = path.join(root, 'windows-apply-update.ps1');
    const cmd = path.join(root, 'windows-apply-update.cmd');
    if (fs.existsSync(ps1)) {
      return { ps1, cmd: fs.existsSync(cmd) ? cmd : '' };
    }
  }
  return null;
}

/**
 * Start detached Wait→Replace→Relaunch helper, then quit the app.
 * @param {{ packagePath: string }} opts
 * @returns {{ ok: boolean, error?: string }}
 */
function startWindowsApplyUpdate(opts) {
  if (process.platform !== 'win32') {
    return { ok: false, error: 'Nur unter Windows' };
  }
  const packagePath = opts?.packagePath;
  if (!packagePath || !fs.existsSync(packagePath)) {
    return { ok: false, error: 'Update-Paket fehlt' };
  }

  const helpers = resolveHelperScripts();
  if (!helpers) {
    return { ok: false, error: 'windows-apply-update.ps1 fehlt in resources/' };
  }

  const installDir = path.dirname(process.execPath);
  const exeName = path.basename(process.execPath);
  const args = [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-WindowStyle',
    'Hidden',
    '-File',
    helpers.ps1,
    '-AppPid',
    String(process.pid),
    '-PackagePath',
    packagePath,
    '-InstallDir',
    installDir,
    '-ExeName',
    exeName,
  ];

  try {
    const child = spawn('powershell.exe', args, {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
      cwd: installDir,
    });
    child.unref();
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }

  // Quit after helper is running so the exe lock is released.
  setTimeout(() => {
    app.quit();
  }, 400);

  return { ok: true };
}

module.exports = { startWindowsApplyUpdate, resolveHelperScripts };
