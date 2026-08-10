import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { api } from "./api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerPush(): Promise<void> {
  if (!Device.isDevice) return;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Hybrixon",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 150, 250],
      lightColor: "#2DE4C3",
    });
  }
  const existing = await Notifications.getPermissionsAsync();
  const permission = existing.status === "granted"
    ? existing.status
    : (await Notifications.requestPermissionsAsync()).status;
  if (permission !== "granted") return;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId || projectId === "SET_AFTER_EAS_INIT") return;
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await api.registerPush(token);
}
