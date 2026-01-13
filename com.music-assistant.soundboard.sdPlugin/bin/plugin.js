import streamDeck from "@elgato/streamdeck";
import { SlotAction } from "./actions/slot.js";
import { NavBackAction } from "./actions/nav-back.js";
import { NavPrevAction, NavNextAction } from "./actions/nav-page.js";
import { VolumeAction } from "./actions/volume.js";
import { StopAllAction } from "./actions/stop-all.js";
import { stateManager } from "./services/state-manager.js";
import { soundManager } from "./services/sound-manager.js";
// Register all actions
streamDeck.actions.registerAction(new SlotAction());
streamDeck.actions.registerAction(new NavBackAction());
streamDeck.actions.registerAction(new NavPrevAction());
streamDeck.actions.registerAction(new NavNextAction());
streamDeck.actions.registerAction(new VolumeAction());
streamDeck.actions.registerAction(new StopAllAction());
// Handle global settings changes
streamDeck.settings.onDidReceiveGlobalSettings(async (ev) => {
    const settings = ev.settings;
    streamDeck.logger.info("Received global settings:", JSON.stringify(settings));
    stateManager.setGlobalSettings({
        rootFolder: settings.rootFolder || "",
        audioDevice: settings.audioDevice || "default",
        globalVolume: settings.globalVolume ?? 1.0,
    });
    // Always navigate to home when settings change
    stateManager.navigateToHome();
    if (settings.rootFolder) {
        streamDeck.logger.info("Initializing sound manager with folder:", settings.rootFolder);
        await soundManager.initialize(settings.rootFolder);
        // Log what was found
        const categories = stateManager.getCategories();
        streamDeck.logger.info(`Found ${categories.length} categories:`, categories.map(c => c.name).join(", "));
    }
});
// Load initial settings on startup
async function loadInitialSettings() {
    streamDeck.logger.info("Loading initial settings...");
    const settings = await streamDeck.settings.getGlobalSettings();
    streamDeck.logger.info("Initial settings:", JSON.stringify(settings));
    stateManager.setGlobalSettings({
        rootFolder: settings.rootFolder || "",
        audioDevice: settings.audioDevice || "default",
        globalVolume: settings.globalVolume ?? 1.0,
    });
    // Ensure we start on home
    stateManager.navigateToHome();
    if (settings.rootFolder) {
        streamDeck.logger.info("Initializing sound manager with folder:", settings.rootFolder);
        await soundManager.initialize(settings.rootFolder);
        const categories = stateManager.getCategories();
        streamDeck.logger.info(`Found ${categories.length} categories:`, categories.map(c => c.name).join(", "));
    }
}
loadInitialSettings().catch((err) => {
    streamDeck.logger.error("Failed to load initial settings:", err);
});
streamDeck.connect();
//# sourceMappingURL=plugin.js.map