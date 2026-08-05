/* Meta & Motivation: Login-Bonus */
window.BH = window.BH || {};

BH.DailyLogin = {
  rewards: [
    { credits: 100, xp: 50, label: "Tag 1" },
    { credits: 150, xp: 75, label: "Tag 2" },
    { credits: 200, xp: 100, label: "Tag 3" },
    { credits: 275, xp: 125, label: "Tag 4" },
    { credits: 350, xp: 150, label: "Tag 5" },
    { credits: 450, xp: 200, label: "Tag 6" },
    { credits: 700, xp: 350, label: "Tag 7 · JACKPOT", bonusEmblem: "login_7" },
  ],

  todayKey() {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
  },

  yesterdayKey() {
    const n = new Date();
    n.setDate(n.getDate() - 1);
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
  },

  ensure(d) {
    if (!d.dailyLogin) d.dailyLogin = { streak: 0, lastClaim: null, totalClaims: 0 };
  },

  status(d) {
    this.ensure(d);
    const dl = d.dailyLogin;
    const today = this.todayKey();
    const claimedToday = dl.lastClaim === today;
    let streak = dl.streak || 0;
    if (!claimedToday && dl.lastClaim && dl.lastClaim !== this.yesterdayKey()) {
      streak = 0;
    }
    const nextDay = claimedToday ? streak : Math.min(7, streak + 1);
    const rewardIdx = Math.max(0, Math.min(6, (claimedToday ? streak : nextDay) - 1));
    return {
      claimable: !claimedToday,
      claimedToday,
      streak,
      nextDay: claimedToday ? streak : nextDay,
      reward: this.rewards[rewardIdx],
    };
  },

  claim(d) {
    const st = this.status(d);
    if (!st.claimable) return { ok: false, reason: "already" };
    const dl = d.dailyLogin;
    const today = this.todayKey();
    const day = st.nextDay;
    const reward = this.rewards[Math.min(6, day - 1)];
    dl.streak = day;
    dl.lastClaim = today;
    dl.totalClaims = (dl.totalClaims || 0) + 1;
    d.credits = (d.credits || 0) + (reward.credits || 0);
    if (reward.xp) BH.Progress.addXp(reward.xp);
    if (reward.bonusEmblem && d.owned && d.owned.emblems) {
      if (!d.owned.emblems.includes(reward.bonusEmblem)) d.owned.emblems.push(reward.bonusEmblem);
    }
    BH.Progress.save();
    return { ok: true, reward, day };
  },
};
