/** Lädt Projekt-Links aus data/projects.json */
(function () {
  var root = document.getElementById("project-links");
  if (!root) return;

  fetch("data/projects.json", { cache: "no-store" })
    .then(function (res) {
      return res.ok ? res.json() : null;
    })
    .then(function (data) {
      if (!data || !Array.isArray(data.links) || data.links.length === 0) {
        root.innerHTML =
          '<p class="project-note">Aktuell keine Projekt-Links hinterlegt.</p>';
        return;
      }
      data.links.forEach(function (item) {
        var card = document.createElement("article");
        card.className = "project-card";
        var external = /^https?:\/\//i.test(item.url || "");
        card.innerHTML =
          '<h3 class="project-title"><a href="' +
          escapeAttr(item.url) +
          '"' +
          (external ? ' rel="noopener noreferrer"' : "") +
          ">" +
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
        '<p class="project-note">Projekt-Links konnten nicht geladen werden.</p>';
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
