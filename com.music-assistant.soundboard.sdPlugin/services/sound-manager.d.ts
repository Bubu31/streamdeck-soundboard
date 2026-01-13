import type { TitleStyle } from "../types.js";
declare class SoundManager {
    private watcher;
    private rootFolder;
    initialize(rootFolder: string): Promise<void>;
    private setupWatcher;
    scanAll(): Promise<void>;
    private scanCategoriesRecursive;
    private countSubCategories;
    private loadCategoryMetadata;
    setCategoryTitle(categoryPath: string, displayName: string): Promise<void>;
    setSoundTitle(soundPath: string, title: string): Promise<void>;
    setCategoryTitleStyle(categoryPath: string, titleStyle: TitleStyle | null): Promise<void>;
    setSoundTitleStyle(soundPath: string, titleStyle: TitleStyle | null): Promise<void>;
    setSoundVolume(soundPath: string, volume: number): Promise<void>;
    private countSounds;
    private findCategoryIcon;
    private scanSoundsInCategory;
    private loadMetadata;
    private findSoundIcon;
    toggleFavorite(soundId: string): Promise<void>;
    deleteSound(soundPath: string): Promise<boolean>;
    cleanup(): Promise<void>;
}
export declare const soundManager: SoundManager;
export {};
//# sourceMappingURL=sound-manager.d.ts.map