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
        var link = document.createElement("a");
        link.className = "project-link";
        link.href = item.url || "#";
        var external = /^https?:\/\//i.test(item.url || "");
        if (external) link.rel = "noopener noreferrer";
        link.innerHTML =
          '<span class="project-title">' +
          escapeHtml(item.title) +
          "</span>" +
          (item.subtitle
            ? '<span class="project-subtitle">' +
              escapeHtml(item.subtitle) +
              "</span>"
            : "") +
          (item.note
            ? '<span class="project-note">' + escapeHtml(item.note) + "</span>"
            : "");
        root.appendChild(link);
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
})();
