// Silk – Desktop-Hintergrund setzen (Mac/Win-Fusion)
var WALL = "file:///usr/share/silk/wallpapers/silk-desktop.png";
var allDesktops = desktops();
for (var i = 0; i < allDesktops.length; i++) {
  allDesktops[i].wallpaperPlugin = "org.kde.image";
  allDesktops[i].currentConfigGroup = ["Wallpaper", "org.kde.image", "General"];
  allDesktops[i].writeConfig("Image", WALL);
  allDesktops[i].writeConfig("FillMode", "2");
  allDesktops[i].reloadConfig();
}
