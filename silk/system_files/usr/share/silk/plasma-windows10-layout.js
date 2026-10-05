// Silk – Windows-10-inspiriertes Layout (Taskleiste links + Suche/Tray)
var allDesktops = desktops();
for (var i = 0; i < allDesktops.length; i++) {
  allDesktops[i].wallpaperPlugin = "org.kde.image";
}

var panels = panels();
for (var i = 0; i < panels.length; i++) {
  panels[i].remove();
}

var bar = new Panel;
bar.location = "bottom";
bar.height = 44;
bar.hiding = "none";
bar.alignment = "left";
bar.addWidget("org.kde.plasma.kickoff");
try { bar.addWidget("org.kde.plasma.pager"); } catch (e) {}
bar.addWidget("org.kde.plasma.icontasks");
bar.addWidget("org.kde.plasma.panelspacer");
bar.addWidget("org.kde.plasma.systemtray");
bar.addWidget("org.kde.plasma.digitalclock");
bar.addWidget("org.kde.plasma.showdesktop");
