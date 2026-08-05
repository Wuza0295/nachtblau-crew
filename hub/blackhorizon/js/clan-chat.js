/* Clan-Chat — nur Spieler-Clans (kein Chat in KI-Clans, KI schreibt nicht) */
window.BH = window.BH || {};

BH.ClanChat = {
  MAX_MESSAGES: 80,
  MAX_LEN: 160,

  /** Chat nur in echten / selbst gegründeten Clans — nicht in KI-Clans */
  isEnabled(d) {
    return !!(d && d.clan && !d.clan.isAiClan);
  },

  /** KI-Mitglieder schreiben nicht */
  _isAiMember(d, member) {
    if (!member || member.isSelf) return false;
    return !!(member.isAi || d.clan.isAiClan);
  },

  ensure(d) {
    if (!d || !d.clan || !this.isEnabled(d)) return;
    if (!d.clan.chat) {
      d.clan.chat = { messages: [], lastPlayerAt: 0 };
    }
    if (!Array.isArray(d.clan.chat.messages)) d.clan.chat.messages = [];
    d.clan.chat.messages = d.clan.chat.messages.filter(m => !m.isAi);
  },

  _id() {
    return "cm_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  },

  _trimMessages(c) {
    if (c.chat.messages.length > this.MAX_MESSAGES) {
      c.clan.chat.messages = c.clan.chat.messages.slice(-this.MAX_MESSAGES);
    }
  },

  postFromMember(d, member, text, opts) {
    opts = opts || {};
    if (!this.isEnabled(d) || !member || !text) return null;
    if (this._isAiMember(d, member)) return null;

    this.ensure(d);
    const msg = {
      id: this._id(),
      from: member.name,
      memberId: member.id,
      isAi: false,
      isSelf: !!member.isSelf,
      role: member.role || "member",
      emblem: (member.stats && member.stats.emblem) || "🎖",
      text: String(text).trim().slice(0, this.MAX_LEN),
      ts: opts.ts || Date.now(),
    };
    if (!msg.text) return null;
    d.clan.chat.messages.push(msg);
    if (msg.isSelf) d.clan.chat.lastPlayerAt = msg.ts;
    if (d.clan.chat.messages.length > this.MAX_MESSAGES) {
      d.clan.chat.messages = d.clan.chat.messages.slice(-this.MAX_MESSAGES);
    }
    if (opts.save !== false) BH.Progress.save();
    return msg;
  },

  sendPlayer(d, text) {
    if (!this.isEnabled(d)) return { ok: false, error: "Chat in KI-Clans deaktiviert." };
    this.ensure(d);
    const t = (text || "").trim().slice(0, this.MAX_LEN);
    if (!t) return { ok: false, error: "Leere Nachricht." };
    const self = d.clan.members.find(m => m.isSelf);
    if (!self) return { ok: false, error: "Kein Mitglied." };
    this.postFromMember(d, self, t);
    return { ok: true };
  },

  onClanCreated(d) {
    if (!this.isEnabled(d)) return;
    this.ensure(d);
    const self = d.clan.members.find(m => m.isSelf);
    if (self) {
      this.postFromMember(d, self, "Clan gegründet — willkommen, Operator.", { save: false });
    }
    BH.Progress.save();
  },

  onClanJoined(d) {
    if (!this.isEnabled(d)) return;
    this.ensure(d);
    const self = d.clan.members.find(m => m.isSelf);
    if (self) {
      this.postFromMember(d, self, "Bin beigetreten.", { save: false });
    }
    BH.Progress.save();
  },

  seedAiClan() {
    /* KI-Clans: kein Chat-Seed */
  },

  formatTime(ts) {
    try {
      return new Date(ts).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return "";
    }
  },

  render(d) {
    if (!this.isEnabled(d)) return "";

    this.ensure(d);
    const msgs = (d.clan.chat.messages || []).filter(m => !m.isAi);
    let logHtml;
    if (!msgs.length) {
      logHtml = `<div class="clan-chat-empty">Noch keine Nachrichten — schreib die erste!</div>`;
    } else {
      logHtml = msgs.map(m => {
        const roleTag = m.role === "leader" ? "★" : (m.role === "officer" ? "◆" : "");
        return (
          `<div class="clan-chat-msg${m.isSelf ? " self" : ""}">` +
          `<div class="ccm-head">` +
          `<span class="ccm-em">${m.emblem || "🎖"}</span>` +
          `<span class="ccm-from">${roleTag}${m.from}</span>` +
          `<span class="ccm-time">${this.formatTime(m.ts)}</span>` +
          `</div>` +
          `<div class="ccm-text">${this._escape(m.text)}</div>` +
          `</div>`
        );
      }).join("");
    }

    return (
      `<div class="social-subsection clan-chat-section">` +
      `<div class="social-sub-label">CLAN-CHAT</div>` +
      `<p class="clan-chat-hint">Nur Spieler-Nachrichten · in KI-Clans deaktiviert</p>` +
      `<div class="clan-chat-log" id="clan-chat-log">${logHtml}</div>` +
      `<div class="clan-chat-compose">` +
      `<input type="text" id="clan-chat-input" class="social-input" maxlength="${this.MAX_LEN}" placeholder="Nachricht an [${d.clan.tag}]…">` +
      `<button type="button" class="btn btn-primary" id="btn-clan-chat-send">SENDEN</button>` +
      `</div></div>`
    );
  },

  _escape(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  },

  scrollToBottom() {
    const log = document.getElementById("clan-chat-log");
    if (log) log.scrollTop = log.scrollHeight;
  },

  bind(d, panel, menu) {
    if (!this.isEnabled(d) || !panel) return;
    const input = panel.querySelector("#clan-chat-input");
    const btn = panel.querySelector("#btn-clan-chat-send");
    const send = () => {
      const text = input ? input.value : "";
      const res = this.sendPlayer(d, text);
      if (!res.ok) {
        BH.audio.empty();
        return;
      }
      BH.audio.click();
      if (input) input.value = "";
      menu.renderClan();
    };
    if (btn) btn.onclick = send;
    if (input) {
      input.onkeydown = (e) => {
        if (e.key === "Enter") { e.preventDefault(); send(); }
      };
    }
    requestAnimationFrame(() => this.scrollToBottom());
  },
};
