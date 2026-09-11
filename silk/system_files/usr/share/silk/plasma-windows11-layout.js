// Silk – Windows-11-inspiriertes Layout (zentrierte Taskleiste)
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
bar.height = 48;
bar.hiding = "none";
bar.alignment = "center";
bar.maximumLength = 1400;
bar.minimumLength = 600;
bar.addWidget("org.kde.plasma.kickoff");
bar.addWidget("org.kde.plasma.icontasks");
bar.addWidget("org.kde.plasma.panelspacer");
bar.addWidget("org.kde.plasma.systemtray");
bar.addWidget("org.kde.plasma.digitalclock");
bar.addWidget("org.kde.plasma.showdesktop");
