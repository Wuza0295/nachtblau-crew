// Silk – Mac-inspiriertes Plasma-Layout
// Menüleiste oben (App-Menü + Tray) + Dock unten mit Papierkorb
var allDesktops = desktops();
for (var i = 0; i < allDesktops.length; i++) {
  allDesktops[i].wallpaperPlugin = "org.kde.image";
}

var panels = panels();
for (var i = 0; i < panels.length; i++) {
  panels[i].remove();
}

// Menüleiste (wie macOS)
var top = new Panel;
top.location = "top";
top.height = 28;
top.hiding = "none";
top.addWidget("org.kde.plasma.kickoff");
top.addWidget("org.kde.plasma.appmenu");
top.addWidget("org.kde.plasma.panelspacer");
try { top.addWidget("org.kde.plasma.marginsseparator"); } catch (e) {}
top.addWidget("org.kde.plasma.systemtray");
top.addWidget("org.kde.plasma.digitalclock");

// Dock (wie macOS)
var dock = new Panel;
dock.location = "bottom";
dock.height = 60;
dock.hiding = "dodgewindows";
dock.alignment = "center";
dock.maximumLength = 900;
dock.minimumLength = 420;
dock.addWidget("org.kde.plasma.icontasks");
try { dock.addWidget("org.kde.plasma.marginsseparator"); } catch (e) {}
dock.addWidget("org.kde.plasma.trash");
