import streamDeck, {
  action,
  KeyDownEvent,
  SingletonAction,
  WillAppearEvent,
  WillDisappearEvent,
  PropertyInspectorDidAppearEvent,
  SendToPluginEvent,
  KeyAction,
} from "@elgato/streamdeck";
import type { JsonObject, JsonValue } from "@elgato/utils";
import { stateManager } from "../services/state-manager.js";
import { audioPlayer, type AudioDevice } from "../services/audio-player.js";
import { soundManager } from "../services/sound-manager.js";
import {
  imageToBase64,
  generateCategoryIcon,
  generateFavoriteIcon,
  generateSoundIcon,
  generateEmptyIcon,
  overlayTitleOnImage,
  DEFAULT_TITLE_STYLE,
  DEFAULT_FOLDER_BORDER,
} from "../utils/image-converter.js";
import type { TitleStyle, FolderBorderStyle } from "../types.js";

interface SlotSubscription {
  unsubscribe: () => void;
  slotIndex: number;
  action: KeyAction<JsonObject>;
}

@action({ UUID: "com.music-assistant.soundboard.slot" })
export class SlotAction extends SingletonAction {
  private subscriptions: Map<string, SlotSubscription> = new Map();

  override async onWillAppear(ev: WillAppearEvent<JsonObject>): Promise<void> {
    const actionId = ev.action.id;
    const settings = await ev.action.getSettings();
    const slotIndex = (settings.slotIndex as number) ?? 0;

    // Clean up existing subscription for this action if any
    const existing = this.subscriptions.get(actionId);
    if (existing) {
      existing.unsubscribe();
    }

    // Store the action reference
    const keyAction = ev.action as KeyAction<JsonObject>;

    // Create new subscription
    const unsubscribe = stateManager.subscribe(() => {
      this.updateDisplay(actionId);
    });

    this.subscriptions.set(actionId, { unsubscribe, slotIndex, action: keyAction });

    // Initial display update
    await this.updateDisplay(actionId);
  }

  override async onWillDisappear(ev: WillDisappearEvent<JsonObject>): Promise<void> {
    const actionId = ev.action.id;
    const subscription = this.subscriptions.get(actionId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(actionId);
    }
  }

  override async onKeyDown(ev: KeyDownEvent<JsonObject>): Promise<void> {
    const settings = await ev.action.getSettings();
    const slotIndex = (settings.slotIndex as number) ?? 0;
    const content = stateManager.getSlotContent(slotIndex);

    switch (content.type) {
      case "category":
        stateManager.navigateToCategory(content.item.path);
        break;

      case "favorite-category":
        stateManager.navigateToFavorites();
        break;

      case "sound":
        await audioPlayer.play(content.item);
        break;

      case "empty":
        // Do nothing for empty slots
        break;
    }
  }

  override async onPropertyInspectorDidAppear(ev: PropertyInspectorDidAppearEvent<JsonObject>): Promise<void> {
    await this.sendSlotInfoToPI(ev.action as KeyAction<JsonObject>);
  }

  override async onSendToPlugin(ev: SendToPluginEvent<JsonValue, JsonObject>): Promise<void> {
    const payload = ev.payload as { action?: string; iconData?: string; iconUrl?: string; customTitle?: string; titleStyle?: TitleStyle; volume?: number; url?: string; filename?: string; extension?: string };

    if (payload.action === "getSlotInfo") {
      await this.sendSlotInfoToPI(ev.action as KeyAction<JsonObject>);
    } else if (payload.action === "getAudioDevices") {
      await this.sendAudioDevicesToPI();
    } else if (payload.action === "setCustomIcon" && payload.iconData) {
      await this.setCustomIcon(ev.action as KeyAction<JsonObject>, payload.iconData);
    } else if (payload.action === "setCustomIconFromUrl" && payload.iconUrl) {
      await this.setCustomIconFromUrl(ev.action as KeyAction<JsonObject>, payload.iconUrl);
    } else if (payload.action === "setCustomTitle") {
      await this.setCustomTitle(ev.action as KeyAction<JsonObject>, payload.customTitle || "");
    } else if (payload.action === "setTitleStyle" && payload.titleStyle) {
      await this.setTitleStyle(ev.action as KeyAction<JsonObject>, payload.titleStyle);
    } else if (payload.action === "setSoundVolume" && payload.volume !== undefined) {
      await this.setSoundVolume(ev.action as KeyAction<JsonObject>, payload.volume);
    } else if (payload.action === "importSoundFromUrl" && payload.url) {
      await this.importSoundFromUrl(ev.action as KeyAction<JsonObject>, payload.url, payload.filename, payload.extension);
    } else if (payload.action === "deleteSound") {
      await this.deleteSound(ev.action as KeyAction<JsonObject>);
    }
  }

  private async deleteSound(action: KeyAction<JsonObject>): Promise<void> {
    const settings = await action.getSettings();
    const slotIndex = (settings.slotIndex as number) ?? 0;
    const content = stateManager.getSlotContent(slotIndex);

    if (content.type === "sound") {
      const success = await soundManager.deleteSound(content.item.path);
      await streamDeck.ui.sendToPropertyInspector({
        event: "deleteResult",
        success,
      });
    }
  }

  private async sendAudioDevicesToPI(): Promise<void> {
    const devices = await audioPlayer.listDevices();
    await streamDeck.ui.sendToPropertyInspector({
      event: "audioDevices",
      devices: devices.map(d => ({ id: d.id, name: d.name })),
    });
  }

  private async sendSlotInfoToPI(action: KeyAction<JsonObject>): Promise<void> {
    const settings = await action.getSettings();
    const slotIndex = (settings.slotIndex as number) ?? 0;
    const content = stateManager.getSlotContent(slotIndex);
    const nav = stateManager.getNavigation();

    let slotInfo: JsonObject = {
      type: content.type,
      slotIndex,
      viewMode: nav.viewMode,
      currentCategory: nav.currentCategory,
    };

    switch (content.type) {
      case "category":
        slotInfo = {
          ...slotInfo,
          name: content.item.displayName || content.item.name,
          originalName: content.item.name,
          customTitle: content.item.displayName !== content.item.name ? content.item.displayName : "",
          path: content.item.path,
          soundCount: content.item.soundCount,
          hasCustomIcon: !!content.item.iconPath,
          titleStyle: { ...content.item.titleStyle },
        };
        break;
      case "sound":
        slotInfo = {
          ...slotInfo,
          name: content.item.title,
          originalName: content.item.filename.replace(/\.[^/.]+$/, ""),
          customTitle: content.item.title !== content.item.filename.replace(/\.[^/.]+$/, "") ? content.item.title : "",
          path: content.item.path,
          category: content.item.category,
          hasCustomIcon: !!content.item.iconPath,
          titleStyle: { ...content.item.titleStyle },
          volume: content.item.volume,
        };
        break;
      case "favorite-category":
        slotInfo = { ...slotInfo, name: "Favoris" };
        break;
    }

    await streamDeck.ui.sendToPropertyInspector(slotInfo);
  }

  private async setCustomTitle(action: KeyAction<JsonObject>, customTitle: string): Promise<void> {
    const settings = await action.getSettings();
    const slotIndex = (settings.slotIndex as number) ?? 0;
    const content = stateManager.getSlotContent(slotIndex);

    if (content.type === "category") {
      await soundManager.setCategoryTitle(content.item.path, customTitle);
    } else if (content.type === "sound") {
      await soundManager.setSoundTitle(content.item.path, customTitle);
    }
  }

  private async setTitleStyle(action: KeyAction<JsonObject>, titleStyle: TitleStyle): Promise<void> {
    const settings = await action.getSettings();
    const slotIndex = (settings.slotIndex as number) ?? 0;
    const content = stateManager.getSlotContent(slotIndex);

    if (content.type === "category") {
      await soundManager.setCategoryTitleStyle(content.item.path, titleStyle);
    } else if (content.type === "sound") {
      await soundManager.setSoundTitleStyle(content.item.path, titleStyle);
    }
  }

  private async setSoundVolume(action: KeyAction<JsonObject>, volume: number): Promise<void> {
    const settings = await action.getSettings();
    const slotIndex = (settings.slotIndex as number) ?? 0;
    const content = stateManager.getSlotContent(slotIndex);

    if (content.type === "sound") {
      await soundManager.setSoundVolume(content.item.path, volume);
    }
  }

  private async importSoundFromUrl(
    action: KeyAction<JsonObject>,
    url: string,
    filename?: string,
    extension?: string
  ): Promise<void> {
    const settings = await action.getSettings();
    const slotIndex = (settings.slotIndex as number) ?? 0;
    const content = stateManager.getSlotContent(slotIndex);
    const nav = stateManager.getNavigation();

    // Determine the target folder
    let targetFolder: string | null = null;

    if (content.type === "category") {
      targetFolder = content.item.path;
    } else if (content.type === "sound") {
      const fs = await import("node:fs");
      const path = await import("node:path");
      targetFolder = path.dirname(content.item.path);
    } else if (nav.currentCategory) {
      targetFolder = nav.currentCategory;
    }

    if (!targetFolder) {
      console.error("No target folder found for importing sound");
      return;
    }

    try {
      const fs = await import("node:fs");
      const path = await import("node:path");

      // Download the audio file
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Failed to download sound: ${response.status}`);
        return;
      }

      const buffer = Buffer.from(await response.arrayBuffer());

      // Determine filename
      let finalFilename = filename;
      if (!finalFilename) {
        // Extract from URL
        const urlParts = url.split("?")[0].split("/");
        const lastPart = urlParts[urlParts.length - 1];
        finalFilename = decodeURIComponent(lastPart.replace(/\.[^/.]+$/, "")) || "imported-sound";
      }

      // Sanitize filename
      finalFilename = finalFilename.replace(/[<>:"/\\|?*]/g, "-");

      // Determine extension
      let finalExtension = extension || ".mp3";
      const contentType = response.headers.get("content-type") || "";
      if (!extension) {
        if (contentType.includes("wav")) finalExtension = ".wav";
        else if (contentType.includes("ogg")) finalExtension = ".ogg";
        else if (contentType.includes("flac")) finalExtension = ".flac";
        else if (contentType.includes("m4a") || contentType.includes("mp4")) finalExtension = ".m4a";
      }

      const filePath = path.join(targetFolder, `${finalFilename}${finalExtension}`);

      // Check if file already exists
      let uniquePath = filePath;
      let counter = 1;
      while (fs.existsSync(uniquePath)) {
        uniquePath = path.join(targetFolder, `${finalFilename}-${counter}${finalExtension}`);
        counter++;
      }

      await fs.promises.writeFile(uniquePath, buffer);
      console.log(`Sound imported: ${uniquePath}`);

      // Send success feedback to PI
      await streamDeck.ui.sendToPropertyInspector({
        event: "importResult",
        success: true,
        filename: path.basename(uniquePath),
      });

      // Rescan to pick up the new sound
      await soundManager.scanAll();
    } catch (error) {
      console.error("Failed to import sound from URL:", error);

      // Send error feedback to PI
      await streamDeck.ui.sendToPropertyInspector({
        event: "importResult",
        success: false,
        error: String(error),
      });
    }
  }

  private async setCustomIcon(action: KeyAction<JsonObject>, iconData: string): Promise<void> {
    const settings = await action.getSettings();
    const slotIndex = (settings.slotIndex as number) ?? 0;
    const content = stateManager.getSlotContent(slotIndex);

    if (content.type === "category" || content.type === "sound") {
      const fs = await import("node:fs");
      const path = await import("node:path");

      // Extract mime type from data URL to get correct extension
      const mimeMatch = iconData.match(/^data:image\/(\w+);base64,/);
      let ext = ".png";
      if (mimeMatch) {
        const mimeType = mimeMatch[1].toLowerCase();
        if (mimeType === "gif") ext = ".gif";
        else if (mimeType === "jpeg" || mimeType === "jpg") ext = ".jpg";
        else if (mimeType === "webp") ext = ".webp";
        else ext = ".png";
      }

      let basePath: string;
      let baseFileName: string;
      if (content.type === "category") {
        basePath = content.item.path;
        baseFileName = "_icon";
      } else {
        basePath = path.dirname(content.item.path);
        baseFileName = path.basename(content.item.filename, path.extname(content.item.filename));
      }

      // Remove old icons with different extensions
      const extensions = [".png", ".jpg", ".jpeg", ".gif", ".webp"];
      for (const oldExt of extensions) {
        const oldPath = path.join(basePath, `${baseFileName}${oldExt}`);
        try {
          if (fs.existsSync(oldPath)) {
            await fs.promises.unlink(oldPath);
          }
        } catch {
          // Ignore errors
        }
      }

      // Save new icon
      const iconPath = path.join(basePath, `${baseFileName}${ext}`);
      const base64Data = iconData.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      await fs.promises.writeFile(iconPath, buffer);

      // Rescan to pick up the new icon
      await soundManager.scanAll();
    }
  }

  private async setCustomIconFromUrl(action: KeyAction<JsonObject>, iconUrl: string): Promise<void> {
    const settings = await action.getSettings();
    const slotIndex = (settings.slotIndex as number) ?? 0;
    const content = stateManager.getSlotContent(slotIndex);

    if (content.type === "category" || content.type === "sound") {
      try {
        const fs = await import("node:fs");
        const path = await import("node:path");

        // Download the image
        const response = await fetch(iconUrl);
        if (!response.ok) {
          console.error(`Failed to download image: ${response.status}`);
          return;
        }

        const contentType = response.headers.get("content-type") || "";
        const buffer = Buffer.from(await response.arrayBuffer());

        // Determine extension from content type
        let ext = ".png";
        if (contentType.includes("gif")) ext = ".gif";
        else if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = ".jpg";
        else if (contentType.includes("webp")) ext = ".webp";
        else if (contentType.includes("png")) ext = ".png";

        let basePath: string;
        let baseFileName: string;
        if (content.type === "category") {
          basePath = content.item.path;
          baseFileName = "_icon";
        } else {
          basePath = path.dirname(content.item.path);
          baseFileName = path.basename(content.item.filename, path.extname(content.item.filename));
        }

        // Remove old icons with different extensions
        const extensions = [".png", ".jpg", ".jpeg", ".gif", ".webp"];
        for (const oldExt of extensions) {
          const oldPath = path.join(basePath, `${baseFileName}${oldExt}`);
          try {
            if (fs.existsSync(oldPath)) {
              await fs.promises.unlink(oldPath);
            }
          } catch {
            // Ignore errors
          }
        }

        // Save new icon
        const iconPath = path.join(basePath, `${baseFileName}${ext}`);
        await fs.promises.writeFile(iconPath, buffer);

        // Rescan to pick up the new icon
        await soundManager.scanAll();
      } catch (error) {
        console.error("Failed to download and save icon from URL:", error);
      }
    }
  }

  private async updateDisplay(actionId: string): Promise<void> {
    const subscription = this.subscriptions.get(actionId);
    if (!subscription) return;

    const { action, slotIndex } = subscription;
    const content = stateManager.getSlotContent(slotIndex);
    const globalSettings = stateManager.getGlobalSettings();
    const defaultStyle = globalSettings.defaultTitleStyle || DEFAULT_TITLE_STYLE;
    const folderBorder: FolderBorderStyle = globalSettings.folderBorder || DEFAULT_FOLDER_BORDER;

    let image: string;
    let title = "";

    switch (content.type) {
      case "category": {
        const cat = content.item;
        const displayName = cat.displayName || cat.name;
        if (cat.iconPath) {
          const baseImage = await imageToBase64(cat.iconPath);
          if (baseImage) {
            const style: TitleStyle = { ...defaultStyle, ...cat.titleStyle };
            image = overlayTitleOnImage(baseImage, displayName, style, true, folderBorder);
          } else {
            image = generateCategoryIcon(displayName);
          }
        } else {
          image = generateCategoryIcon(displayName);
        }
        title = displayName;
        break;
      }

      case "favorite-category": {
        image = generateFavoriteIcon();
        title = "Favoris";
        break;
      }

      case "sound": {
        const sound = content.item;
        const isPlaying = stateManager.isPlaying(sound.id);

        if (sound.iconPath) {
          const baseImage = await imageToBase64(sound.iconPath);
          if (baseImage) {
            const style: TitleStyle = { ...defaultStyle, ...sound.titleStyle };
            image = overlayTitleOnImage(baseImage, sound.title, style, false, folderBorder, isPlaying);
          } else {
            image = generateSoundIcon(sound.title, isPlaying);
          }
        } else {
          image = generateSoundIcon(sound.title, isPlaying);
        }
        title = sound.title;
        break;
      }

      case "empty":
      default:
        image = generateEmptyIcon();
        title = "";
        break;
    }

    await action.setImage(image);
    // Ne pas mettre de titre Stream Deck car il est déjà dans l'image
    await action.setTitle("");
  }
}
