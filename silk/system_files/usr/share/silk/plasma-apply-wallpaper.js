// Silk – Desktop-Hintergrund setzen (liest optional SILK_WALLPAPER_DESKTOP)
var WALL = "file:///usr/share/silk/wallpapers/silk-desktop.png";
// Note: env vars aren't available in plasmashell JS; silk-apply-wallpaper patches this file or uses default copy.
var allDesktops = desktops();
for (var i = 0; i < allDesktops.length; i++) {
  allDesktops[i].wallpaperPlugin = "org.kde.image";
  allDesktops[i].currentConfigGroup = ["Wallpaper", "org.kde.image", "General"];
  allDesktops[i].writeConfig("Image", WALL);
  allDesktops[i].writeConfig("FillMode", "2");
  allDesktops[i].reloadConfig();
}
