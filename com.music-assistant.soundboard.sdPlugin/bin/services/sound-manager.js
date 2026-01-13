import * as fs from "node:fs";
import * as path from "node:path";
import { watch } from "chokidar";
import { SUPPORTED_AUDIO_EXTENSIONS, SUPPORTED_IMAGE_EXTENSIONS } from "../types.js";
import { stateManager } from "./state-manager.js";
class SoundManager {
    watcher = null;
    rootFolder = "";
    async initialize(rootFolder) {
        this.rootFolder = rootFolder;
        if (this.watcher) {
            await this.watcher.close();
        }
        if (!rootFolder || !fs.existsSync(rootFolder)) {
            stateManager.setCategories([]);
            return;
        }
        await this.scanAll();
        this.setupWatcher();
    }
    setupWatcher() {
        if (!this.rootFolder)
            return;
        this.watcher = watch(this.rootFolder, {
            ignoreInitial: true,
            depth: 2,
            ignored: /(^|[\/\\])\../,
        });
        this.watcher.on("all", async (_event, _filepath) => {
            await this.scanAll();
        });
    }
    async scanAll() {
        const categories = await this.scanCategories();
        stateManager.setCategories(categories);
        for (const category of categories) {
            const sounds = await this.scanSoundsInCategory(category.path);
            stateManager.setSoundsForCategory(category.id, sounds);
        }
    }
    async scanCategories() {
        if (!this.rootFolder || !fs.existsSync(this.rootFolder)) {
            return [];
        }
        const entries = await fs.promises.readdir(this.rootFolder, { withFileTypes: true });
        const categories = [];
        for (const entry of entries) {
            if (entry.isDirectory() && !entry.name.startsWith(".")) {
                const categoryPath = path.join(this.rootFolder, entry.name);
                const sounds = await this.countSounds(categoryPath);
                categories.push({
                    id: entry.name,
                    name: entry.name,
                    path: categoryPath,
                    iconPath: await this.findCategoryIcon(categoryPath),
                    soundCount: sounds,
                });
            }
        }
        return categories.sort((a, b) => a.name.localeCompare(b.name));
    }
    async countSounds(folderPath) {
        try {
            const entries = await fs.promises.readdir(folderPath, { withFileTypes: true });
            return entries.filter((e) => e.isFile() && SUPPORTED_AUDIO_EXTENSIONS.includes(path.extname(e.name).toLowerCase())).length;
        }
        catch {
            return 0;
        }
    }
    async findCategoryIcon(categoryPath) {
        for (const ext of SUPPORTED_IMAGE_EXTENSIONS) {
            const iconPath = path.join(categoryPath, `_icon${ext}`);
            if (fs.existsSync(iconPath)) {
                return iconPath;
            }
        }
        return undefined;
    }
    async scanSoundsInCategory(categoryPath) {
        if (!fs.existsSync(categoryPath)) {
            return [];
        }
        const entries = await fs.promises.readdir(categoryPath, { withFileTypes: true });
        const sounds = [];
        const categoryName = path.basename(categoryPath);
        for (const entry of entries) {
            if (!entry.isFile())
                continue;
            const ext = path.extname(entry.name).toLowerCase();
            if (!SUPPORTED_AUDIO_EXTENSIONS.includes(ext))
                continue;
            const soundPath = path.join(categoryPath, entry.name);
            const baseName = path.basename(entry.name, ext);
            const metadata = await this.loadMetadata(categoryPath, baseName);
            sounds.push({
                id: `${categoryName}/${entry.name}`,
                path: soundPath,
                filename: entry.name,
                title: metadata?.title || baseName,
                volume: metadata?.volume ?? 1.0,
                iconPath: await this.findSoundIcon(categoryPath, baseName, metadata?.icon),
                favorite: metadata?.favorite ?? false,
                category: categoryName,
            });
        }
        return sounds.sort((a, b) => a.title.localeCompare(b.title));
    }
    async loadMetadata(categoryPath, baseName) {
        const metadataPath = path.join(categoryPath, `${baseName}.json`);
        try {
            if (fs.existsSync(metadataPath)) {
                const content = await fs.promises.readFile(metadataPath, "utf-8");
                return JSON.parse(content);
            }
        }
        catch (error) {
            console.error(`Error loading metadata for ${baseName}:`, error);
        }
        return null;
    }
    async findSoundIcon(categoryPath, baseName, customIcon) {
        if (customIcon) {
            const customPath = path.isAbsolute(customIcon)
                ? customIcon
                : path.join(categoryPath, customIcon);
            if (fs.existsSync(customPath)) {
                return customPath;
            }
        }
        for (const ext of SUPPORTED_IMAGE_EXTENSIONS) {
            const iconPath = path.join(categoryPath, `${baseName}${ext}`);
            if (fs.existsSync(iconPath)) {
                return iconPath;
            }
        }
        return undefined;
    }
    async toggleFavorite(soundId) {
        const [categoryId] = soundId.split("/");
        const sounds = stateManager.getSoundsForCategory(categoryId);
        const sound = sounds.find((s) => s.id === soundId);
        if (!sound)
            return;
        const newFavorite = !sound.favorite;
        const baseName = path.basename(sound.filename, path.extname(sound.filename));
        const categoryPath = path.dirname(sound.path);
        const metadataPath = path.join(categoryPath, `${baseName}.json`);
        let metadata = {};
        try {
            if (fs.existsSync(metadataPath)) {
                const content = await fs.promises.readFile(metadataPath, "utf-8");
                metadata = JSON.parse(content);
            }
        }
        catch {
            // Ignore errors
        }
        metadata.favorite = newFavorite;
        await fs.promises.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
        await this.scanAll();
    }
    async cleanup() {
        if (this.watcher) {
            await this.watcher.close();
            this.watcher = null;
        }
    }
}
export const soundManager = new SoundManager();
//# sourceMappingURL=sound-manager.js.map