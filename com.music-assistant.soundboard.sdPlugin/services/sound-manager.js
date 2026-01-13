import * as fs from "node:fs";
import * as path from "node:path";
import { watch } from "chokidar";
import { SUPPORTED_AUDIO_EXTENSIONS, SUPPORTED_IMAGE_EXTENSIONS } from "../types.js";
import { stateManager } from "./state-manager.js";
function sortItems(items, sortOrder, getName) {
    return items.sort((a, b) => {
        switch (sortOrder) {
            case "name-desc":
                return getName(b).localeCompare(getName(a));
            case "date-asc":
                try {
                    const statA = fs.statSync(a.path);
                    const statB = fs.statSync(b.path);
                    return statA.mtimeMs - statB.mtimeMs;
                }
                catch {
                    return 0;
                }
            case "date-desc":
                try {
                    const statA = fs.statSync(a.path);
                    const statB = fs.statSync(b.path);
                    return statB.mtimeMs - statA.mtimeMs;
                }
                catch {
                    return 0;
                }
            case "name-asc":
            default:
                return getName(a).localeCompare(getName(b));
        }
    });
}
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
        const categories = await this.scanCategoriesRecursive(this.rootFolder, null);
        stateManager.setCategories(categories);
        for (const category of categories) {
            const sounds = await this.scanSoundsInCategory(category.path);
            stateManager.setSoundsForCategory(category.path, sounds);
        }
    }
    async scanCategoriesRecursive(folderPath, parentPath) {
        if (!folderPath || !fs.existsSync(folderPath)) {
            return [];
        }
        const entries = await fs.promises.readdir(folderPath, { withFileTypes: true });
        const categories = [];
        for (const entry of entries) {
            if (entry.isDirectory() && !entry.name.startsWith(".") && !entry.name.startsWith("_")) {
                const categoryPath = path.join(folderPath, entry.name);
                const sounds = await this.countSounds(categoryPath);
                const subCategories = await this.countSubCategories(categoryPath);
                const metadata = await this.loadCategoryMetadata(categoryPath);
                categories.push({
                    id: categoryPath,
                    name: entry.name,
                    displayName: metadata?.displayName,
                    path: categoryPath,
                    parentPath: parentPath,
                    iconPath: await this.findCategoryIcon(categoryPath),
                    soundCount: sounds,
                    subCategoryCount: subCategories,
                    titleStyle: metadata?.titleStyle,
                });
                // Recursively scan subcategories
                const subCats = await this.scanCategoriesRecursive(categoryPath, categoryPath);
                categories.push(...subCats);
            }
        }
        const sortOrder = stateManager.getGlobalSettings().sortOrder || "name-asc";
        return sortItems(categories, sortOrder, (c) => c.displayName || c.name);
    }
    async countSubCategories(folderPath) {
        try {
            const entries = await fs.promises.readdir(folderPath, { withFileTypes: true });
            return entries.filter((e) => e.isDirectory() && !e.name.startsWith(".") && !e.name.startsWith("_")).length;
        }
        catch {
            return 0;
        }
    }
    async loadCategoryMetadata(categoryPath) {
        const metadataPath = path.join(categoryPath, "_config.json");
        try {
            if (fs.existsSync(metadataPath)) {
                const content = await fs.promises.readFile(metadataPath, "utf-8");
                return JSON.parse(content);
            }
        }
        catch (error) {
            console.error(`Error loading category metadata: ${categoryPath}`, error);
        }
        return null;
    }
    async setCategoryTitle(categoryPath, displayName) {
        const metadataPath = path.join(categoryPath, "_config.json");
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
        if (displayName) {
            metadata.displayName = displayName;
        }
        else {
            delete metadata.displayName;
        }
        if (Object.keys(metadata).length > 0) {
            await fs.promises.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
        }
        else if (fs.existsSync(metadataPath)) {
            await fs.promises.unlink(metadataPath);
        }
        await this.scanAll();
    }
    async setSoundTitle(soundPath, title) {
        const baseName = path.basename(soundPath, path.extname(soundPath));
        const metadataPath = path.join(path.dirname(soundPath), `${baseName}.json`);
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
        if (title) {
            metadata.title = title;
        }
        else {
            delete metadata.title;
        }
        if (Object.keys(metadata).length > 0) {
            await fs.promises.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
        }
        else if (fs.existsSync(metadataPath)) {
            await fs.promises.unlink(metadataPath);
        }
        await this.scanAll();
    }
    async setCategoryTitleStyle(categoryPath, titleStyle) {
        const metadataPath = path.join(categoryPath, "_config.json");
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
        if (titleStyle && Object.keys(titleStyle).length > 0) {
            metadata.titleStyle = titleStyle;
        }
        else {
            delete metadata.titleStyle;
        }
        if (Object.keys(metadata).length > 0) {
            await fs.promises.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
        }
        else if (fs.existsSync(metadataPath)) {
            await fs.promises.unlink(metadataPath);
        }
        await this.scanAll();
    }
    async setSoundTitleStyle(soundPath, titleStyle) {
        const baseName = path.basename(soundPath, path.extname(soundPath));
        const metadataPath = path.join(path.dirname(soundPath), `${baseName}.json`);
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
        if (titleStyle && Object.keys(titleStyle).length > 0) {
            metadata.titleStyle = titleStyle;
        }
        else {
            delete metadata.titleStyle;
        }
        if (Object.keys(metadata).length > 0) {
            await fs.promises.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
        }
        else if (fs.existsSync(metadataPath)) {
            await fs.promises.unlink(metadataPath);
        }
        await this.scanAll();
    }
    async setSoundVolume(soundPath, volume) {
        const baseName = path.basename(soundPath, path.extname(soundPath));
        const metadataPath = path.join(path.dirname(soundPath), `${baseName}.json`);
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
        if (volume !== 1.0) {
            metadata.volume = volume;
        }
        else {
            delete metadata.volume;
        }
        if (Object.keys(metadata).length > 0) {
            await fs.promises.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
        }
        else if (fs.existsSync(metadataPath)) {
            await fs.promises.unlink(metadataPath);
        }
        await this.scanAll();
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
                titleStyle: metadata?.titleStyle,
            });
        }
        const sortOrder = stateManager.getGlobalSettings().sortOrder || "name-asc";
        return sortItems(sounds, sortOrder, (s) => s.title);
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
    async deleteSound(soundPath) {
        try {
            const baseName = path.basename(soundPath, path.extname(soundPath));
            const categoryPath = path.dirname(soundPath);
            // Delete the sound file
            if (fs.existsSync(soundPath)) {
                await fs.promises.unlink(soundPath);
            }
            // Delete metadata JSON file if exists
            const metadataPath = path.join(categoryPath, `${baseName}.json`);
            if (fs.existsSync(metadataPath)) {
                await fs.promises.unlink(metadataPath);
            }
            // Delete associated image files (all supported extensions)
            const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp"];
            for (const ext of imageExtensions) {
                const imagePath = path.join(categoryPath, `${baseName}${ext}`);
                if (fs.existsSync(imagePath)) {
                    await fs.promises.unlink(imagePath);
                }
            }
            await this.scanAll();
            return true;
        }
        catch (error) {
            console.error("Failed to delete sound:", error);
            return false;
        }
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