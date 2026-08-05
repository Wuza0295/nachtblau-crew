/** Lädt externe Projekt-Links (Allxion-App) aus data/projects.json */
(function () {
  var root = document.getElementById("project-links");
  if (!root) return;

  fetch("data/projects.json", { cache: "no-store" })
    .then(function (res) {
      return res.ok ? res.json() : null;
    })
    .then(function (data) {
      if (!data || !Array.isArray(data.links)) return;
      data.links.forEach(function (item) {
        var card = document.createElement("article");
        card.className = "project-card";
        card.innerHTML =
          '<h3 class="project-title"><a href="' +
          escapeAttr(item.url) +
          '" rel="noopener noreferrer">' +
          escapeHtml(item.title) +
          "</a></h3>" +
          (item.subtitle
            ? '<p class="project-subtitle">' + escapeHtml(item.subtitle) + "</p>"
            : "") +
          (item.note ? '<p class="project-note">' + escapeHtml(item.note) + "</p>" : "");
        root.appendChild(card);
      });
    })
    .catch(function () {
      root.innerHTML =
        '<p class="doc-meta">Projekt-Links konnten nicht geladen werden.</p>';
    });

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, "&#39;");
  }
})();
