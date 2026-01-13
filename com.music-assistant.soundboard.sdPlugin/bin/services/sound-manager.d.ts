declare class SoundManager {
    private watcher;
    private rootFolder;
    initialize(rootFolder: string): Promise<void>;
    private setupWatcher;
    scanAll(): Promise<void>;
    private scanCategories;
    private countSounds;
    private findCategoryIcon;
    private scanSoundsInCategory;
    private loadMetadata;
    private findSoundIcon;
    toggleFavorite(soundId: string): Promise<void>;
    cleanup(): Promise<void>;
}
export declare const soundManager: SoundManager;
export {};
//# sourceMappingURL=sound-manager.d.ts.map