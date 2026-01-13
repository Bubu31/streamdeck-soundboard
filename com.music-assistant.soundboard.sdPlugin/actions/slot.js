var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
import streamDeck, { action, SingletonAction, } from "@elgato/streamdeck";
import { stateManager } from "../services/state-manager.js";
import { audioPlayer } from "../services/audio-player.js";
import { soundManager } from "../services/sound-manager.js";
import { imageToBase64, generateCategoryIcon, generateFavoriteIcon, generateSoundIcon, generateEmptyIcon, overlayTitleOnImage, DEFAULT_TITLE_STYLE, DEFAULT_FOLDER_BORDER, } from "../utils/image-converter.js";
let SlotAction = (() => {
    let _classDecorators = [action({ UUID: "com.music-assistant.soundboard.slot" })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = SingletonAction;
    var SlotAction = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SlotAction = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        subscriptions = new Map();
        async onWillAppear(ev) {
            const actionId = ev.action.id;
            const settings = await ev.action.getSettings();
            const slotIndex = settings.slotIndex ?? 0;
            // Clean up existing subscription for this action if any
            const existing = this.subscriptions.get(actionId);
            if (existing) {
                existing.unsubscribe();
            }
            // Store the action reference
            const keyAction = ev.action;
            // Create new subscription
            const unsubscribe = stateManager.subscribe(() => {
                this.updateDisplay(actionId);
            });
            this.subscriptions.set(actionId, { unsubscribe, slotIndex, action: keyAction });
            // Initial display update
            await this.updateDisplay(actionId);
        }
        async onWillDisappear(ev) {
            const actionId = ev.action.id;
            const subscription = this.subscriptions.get(actionId);
            if (subscription) {
                subscription.unsubscribe();
                this.subscriptions.delete(actionId);
            }
        }
        async onKeyDown(ev) {
            const settings = await ev.action.getSettings();
            const slotIndex = settings.slotIndex ?? 0;
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
        async onPropertyInspectorDidAppear(ev) {
            await this.sendSlotInfoToPI(ev.action);
        }
        async onSendToPlugin(ev) {
            const payload = ev.payload;
            if (payload.action === "getSlotInfo") {
                await this.sendSlotInfoToPI(ev.action);
            }
            else if (payload.action === "getAudioDevices") {
                await this.sendAudioDevicesToPI();
            }
            else if (payload.action === "setCustomIcon" && payload.iconData) {
                await this.setCustomIcon(ev.action, payload.iconData);
            }
            else if (payload.action === "setCustomIconFromUrl" && payload.iconUrl) {
                await this.setCustomIconFromUrl(ev.action, payload.iconUrl);
            }
            else if (payload.action === "setCustomTitle") {
                await this.setCustomTitle(ev.action, payload.customTitle || "");
            }
            else if (payload.action === "setTitleStyle" && payload.titleStyle) {
                await this.setTitleStyle(ev.action, payload.titleStyle);
            }
            else if (payload.action === "setSoundVolume" && payload.volume !== undefined) {
                await this.setSoundVolume(ev.action, payload.volume);
            }
            else if (payload.action === "importSoundFromUrl" && payload.url) {
                await this.importSoundFromUrl(ev.action, payload.url, payload.filename, payload.extension);
            }
            else if (payload.action === "deleteSound") {
                await this.deleteSound(ev.action);
            }
        }
        async deleteSound(action) {
            const settings = await action.getSettings();
            const slotIndex = settings.slotIndex ?? 0;
            const content = stateManager.getSlotContent(slotIndex);
            if (content.type === "sound") {
                const success = await soundManager.deleteSound(content.item.path);
                await streamDeck.ui.sendToPropertyInspector({
                    event: "deleteResult",
                    success,
                });
            }
        }
        async sendAudioDevicesToPI() {
            const devices = await audioPlayer.listDevices();
            await streamDeck.ui.sendToPropertyInspector({
                event: "audioDevices",
                devices: devices.map(d => ({ id: d.id, name: d.name })),
            });
        }
        async sendSlotInfoToPI(action) {
            const settings = await action.getSettings();
            const slotIndex = settings.slotIndex ?? 0;
            const content = stateManager.getSlotContent(slotIndex);
            const nav = stateManager.getNavigation();
            let slotInfo = {
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
        async setCustomTitle(action, customTitle) {
            const settings = await action.getSettings();
            const slotIndex = settings.slotIndex ?? 0;
            const content = stateManager.getSlotContent(slotIndex);
            if (content.type === "category") {
                await soundManager.setCategoryTitle(content.item.path, customTitle);
            }
            else if (content.type === "sound") {
                await soundManager.setSoundTitle(content.item.path, customTitle);
            }
        }
        async setTitleStyle(action, titleStyle) {
            const settings = await action.getSettings();
            const slotIndex = settings.slotIndex ?? 0;
            const content = stateManager.getSlotContent(slotIndex);
            if (content.type === "category") {
                await soundManager.setCategoryTitleStyle(content.item.path, titleStyle);
            }
            else if (content.type === "sound") {
                await soundManager.setSoundTitleStyle(content.item.path, titleStyle);
            }
        }
        async setSoundVolume(action, volume) {
            const settings = await action.getSettings();
            const slotIndex = settings.slotIndex ?? 0;
            const content = stateManager.getSlotContent(slotIndex);
            if (content.type === "sound") {
                await soundManager.setSoundVolume(content.item.path, volume);
            }
        }
        async importSoundFromUrl(action, url, filename, extension) {
            const settings = await action.getSettings();
            const slotIndex = settings.slotIndex ?? 0;
            const content = stateManager.getSlotContent(slotIndex);
            const nav = stateManager.getNavigation();
            // Determine the target folder
            let targetFolder = null;
            if (content.type === "category") {
                targetFolder = content.item.path;
            }
            else if (content.type === "sound") {
                const fs = await import("node:fs");
                const path = await import("node:path");
                targetFolder = path.dirname(content.item.path);
            }
            else if (nav.currentCategory) {
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
                    if (contentType.includes("wav"))
                        finalExtension = ".wav";
                    else if (contentType.includes("ogg"))
                        finalExtension = ".ogg";
                    else if (contentType.includes("flac"))
                        finalExtension = ".flac";
                    else if (contentType.includes("m4a") || contentType.includes("mp4"))
                        finalExtension = ".m4a";
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
            }
            catch (error) {
                console.error("Failed to import sound from URL:", error);
                // Send error feedback to PI
                await streamDeck.ui.sendToPropertyInspector({
                    event: "importResult",
                    success: false,
                    error: String(error),
                });
            }
        }
        async setCustomIcon(action, iconData) {
            const settings = await action.getSettings();
            const slotIndex = settings.slotIndex ?? 0;
            const content = stateManager.getSlotContent(slotIndex);
            if (content.type === "category" || content.type === "sound") {
                const fs = await import("node:fs");
                const path = await import("node:path");
                // Extract mime type from data URL to get correct extension
                const mimeMatch = iconData.match(/^data:image\/(\w+);base64,/);
                let ext = ".png";
                if (mimeMatch) {
                    const mimeType = mimeMatch[1].toLowerCase();
                    if (mimeType === "gif")
                        ext = ".gif";
                    else if (mimeType === "jpeg" || mimeType === "jpg")
                        ext = ".jpg";
                    else if (mimeType === "webp")
                        ext = ".webp";
                    else
                        ext = ".png";
                }
                let basePath;
                let baseFileName;
                if (content.type === "category") {
                    basePath = content.item.path;
                    baseFileName = "_icon";
                }
                else {
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
                    }
                    catch {
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
        async setCustomIconFromUrl(action, iconUrl) {
            const settings = await action.getSettings();
            const slotIndex = settings.slotIndex ?? 0;
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
                    if (contentType.includes("gif"))
                        ext = ".gif";
                    else if (contentType.includes("jpeg") || contentType.includes("jpg"))
                        ext = ".jpg";
                    else if (contentType.includes("webp"))
                        ext = ".webp";
                    else if (contentType.includes("png"))
                        ext = ".png";
                    let basePath;
                    let baseFileName;
                    if (content.type === "category") {
                        basePath = content.item.path;
                        baseFileName = "_icon";
                    }
                    else {
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
                        }
                        catch {
                            // Ignore errors
                        }
                    }
                    // Save new icon
                    const iconPath = path.join(basePath, `${baseFileName}${ext}`);
                    await fs.promises.writeFile(iconPath, buffer);
                    // Rescan to pick up the new icon
                    await soundManager.scanAll();
                }
                catch (error) {
                    console.error("Failed to download and save icon from URL:", error);
                }
            }
        }
        async updateDisplay(actionId) {
            const subscription = this.subscriptions.get(actionId);
            if (!subscription)
                return;
            const { action, slotIndex } = subscription;
            const content = stateManager.getSlotContent(slotIndex);
            const globalSettings = stateManager.getGlobalSettings();
            const defaultStyle = globalSettings.defaultTitleStyle || DEFAULT_TITLE_STYLE;
            const folderBorder = globalSettings.folderBorder || DEFAULT_FOLDER_BORDER;
            let image;
            let title = "";
            switch (content.type) {
                case "category": {
                    const cat = content.item;
                    const displayName = cat.displayName || cat.name;
                    if (cat.iconPath) {
                        const baseImage = await imageToBase64(cat.iconPath);
                        if (baseImage) {
                            const style = { ...defaultStyle, ...cat.titleStyle };
                            image = overlayTitleOnImage(baseImage, displayName, style, true, folderBorder);
                        }
                        else {
                            image = generateCategoryIcon(displayName);
                        }
                    }
                    else {
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
                            const style = { ...defaultStyle, ...sound.titleStyle };
                            image = overlayTitleOnImage(baseImage, sound.title, style, false, folderBorder, isPlaying);
                        }
                        else {
                            image = generateSoundIcon(sound.title, isPlaying);
                        }
                    }
                    else {
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
    };
    return SlotAction = _classThis;
})();
export { SlotAction };
//# sourceMappingURL=slot.js.map