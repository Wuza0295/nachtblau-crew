// Silk – Mac-inspiriertes Plasma-Layout
// Top-Panel (Globales Menü / Tray) + zentriertes Bottom-Dock
var allDesktops = desktops();
for (var i = 0; i < allDesktops.length; i++) {
  allDesktops[i].wallpaperPlugin = "org.kde.image";
}

var panels = panels();
for (var i = 0; i < panels.length; i++) {
  panels[i].remove();
}

// Top bar
var top = new Panel;
top.location = "top";
top.height = 28;
top.hiding = "none";
top.addWidget("org.kde.plasma.kickoff");
top.addWidget("org.kde.plasma.appmenu");
top.addWidget("org.kde.plasma.panelspacer");
top.addWidget("org.kde.plasma.systemtray");
top.addWidget("org.kde.plasma.digitalclock");

// Dock
var dock = new Panel;
dock.location = "bottom";
dock.height = 56;
dock.hiding = "dodgewindows";
dock.alignment = "center";
dock.maximumLength = 800;
dock.minimumLength = 400;
dock.addWidget("org.kde.plasma.icontasks");
dock.addWidget("org.kde.plasma.trash");
