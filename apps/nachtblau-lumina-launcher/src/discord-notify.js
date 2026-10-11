'use strict';

/**
 * Optional Discord webhook notifier (no secrets in git).
 * Set discordWebhook in config/server.json or env NACHTBLAU_DISCORD_WEBHOOK.
 * Empty URL = no-op (safe default).
 */

/**
 * @param {object} serverCfg
 * @returns {string}
 */
function resolveWebhookUrl(serverCfg) {
  const fromEnv = (process.env.NACHTBLAU_DISCORD_WEBHOOK || '').trim();
  if (fromEnv) return fromEnv;
  const fromCfg = String(serverCfg?.discordWebhook || '').trim();
  // Ignore placeholders
  if (!fromCfg || /YOUR_|PLACEHOLDER|example\.com|changeme/i.test(fromCfg)) {
    return '';
  }
  return fromCfg;
}

/**
 * @param {object} serverCfg
 * @param {{
 *   title: string,
 *   description?: string,
 *   color?: number,
 *   fields?: Array<{ name: string, value: string, inline?: boolean }>,
 * }} payload
 */
async function notifyDiscord(serverCfg, payload) {
  const url = resolveWebhookUrl(serverCfg);
  if (!url) return { skipped: true };

  const body = {
    username: 'NachtBlau Lumina Launcher',
    embeds: [
      {
        title: payload.title,
        description: payload.description || undefined,
        color: payload.color ?? 0x5eeaff,
        fields: payload.fields || [],
        timestamp: new Date().toISOString(),
        footer: { text: 'NachtBlau Lumina' },
      },
    ],
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      return { ok: false, status: res.status };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
}

module.exports = { notifyDiscord, resolveWebhookUrl };
