import * as BackgroundTask from "expo-background-task";
import * as TaskManager from "expo-task-manager";
import { processUploadQueue } from "./api";
import { refreshFeedCache } from "./feed-cache";

export const UPLOAD_TASK = "hybrixon-resumable-media-upload";

TaskManager.defineTask(UPLOAD_TASK, async () => {
  try {
    await processUploadQueue();
    await refreshFeedCache().catch((error) => {
      console.warn("Background feed refresh will retry", error);
    });
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    console.warn("Background upload will retry", error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerUploadTask(): Promise<void> {
  const registered = await TaskManager.isTaskRegisteredAsync(UPLOAD_TASK);
  if (!registered) {
    await BackgroundTask.registerTaskAsync(UPLOAD_TASK, {
      minimumInterval: 15,
    });
  }
}
