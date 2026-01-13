import streamDeck from "@elgato/streamdeck";
import type { JsonObject } from "@elgato/utils";
import { SlotAction } from "./actions/slot.js";
import { NavBackAction } from "./actions/nav-back.js";
import { NavPrevAction, NavNextAction } from "./actions/nav-page.js";
import { VolumeAction } from "./actions/volume.js";
import { StopAllAction } from "./actions/stop-all.js";
import { stateManager } from "./services/state-manager.js";
import { soundManager } from "./services/sound-manager.js";
import type { TitleStyle, FolderBorderStyle, SortOrder } from "./types.js";

// Register all actions
streamDeck.actions.registerAction(new SlotAction());
streamDeck.actions.registerAction(new NavBackAction());
streamDeck.actions.registerAction(new NavPrevAction());
streamDeck.actions.registerAction(new NavNextAction());
streamDeck.actions.registerAction(new VolumeAction());
streamDeck.actions.registerAction(new StopAllAction());

// Handle global settings changes
streamDeck.settings.onDidReceiveGlobalSettings<JsonObject>(async (ev) => {
  const settings = ev.settings;
  streamDeck.logger.info("Received global settings:", JSON.stringify(settings));

  stateManager.setGlobalSettings({
    rootFolder: (settings.rootFolder as string) || "",
    audioDevice: (settings.audioDevice as string) || "default",
    globalVolume: (settings.globalVolume as number) ?? 1.0,
    defaultTitleStyle: settings.defaultTitleStyle as TitleStyle | undefined,
    folderBorder: settings.folderBorder as FolderBorderStyle | undefined,
    sortOrder: (settings.sortOrder as SortOrder) || "name-asc",
  });

  // Always navigate to home when settings change
  stateManager.navigateToHome();

  const rootFolder = settings.rootFolder as string;
  if (rootFolder) {
    streamDeck.logger.info("Initializing sound manager with folder:", rootFolder);
    await soundManager.initialize(rootFolder);

    // Log what was found
    const categories = stateManager.getCategories();
    streamDeck.logger.info(`Found ${categories.length} categories:`, categories.map(c => c.name).join(", "));
  }
});

// Load initial settings on startup
async function loadInitialSettings(): Promise<void> {
  streamDeck.logger.info("Loading initial settings...");

  const settings = await streamDeck.settings.getGlobalSettings<JsonObject>();
  streamDeck.logger.info("Initial settings:", JSON.stringify(settings));

  const rootFolder = (settings.rootFolder as string) || "";

  stateManager.setGlobalSettings({
    rootFolder,
    audioDevice: (settings.audioDevice as string) || "default",
    globalVolume: (settings.globalVolume as number) ?? 1.0,
    defaultTitleStyle: settings.defaultTitleStyle as TitleStyle | undefined,
    folderBorder: settings.folderBorder as FolderBorderStyle | undefined,
    sortOrder: (settings.sortOrder as SortOrder) || "name-asc",
  });

  // Ensure we start on home
  stateManager.navigateToHome();

  if (rootFolder) {
    streamDeck.logger.info("Initializing sound manager with folder:", rootFolder);
    await soundManager.initialize(rootFolder);

    const categories = stateManager.getCategories();
    streamDeck.logger.info(`Found ${categories.length} categories:`, categories.map(c => c.name).join(", "));
  }
}

loadInitialSettings().catch((err) => {
  streamDeck.logger.error("Failed to load initial settings:", err);
});

streamDeck.connect();
