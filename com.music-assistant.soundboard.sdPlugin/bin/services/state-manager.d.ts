import type { NavigationState, GlobalSettings, PlayingSound, SlotContent, CategoryItem, SoundItem } from "../types.js";
type StateChangeCallback = () => void;
declare class StateManager {
    private globalSettings;
    private navigation;
    private categories;
    private sounds;
    private favorites;
    private playingSounds;
    private listeners;
    subscribe(callback: StateChangeCallback): () => void;
    private notifyListeners;
    getGlobalSettings(): GlobalSettings;
    setGlobalSettings(settings: Partial<GlobalSettings>): void;
    getNavigation(): NavigationState;
    setCategories(categories: CategoryItem[]): void;
    getCategories(): CategoryItem[];
    setSoundsForCategory(categoryId: string, sounds: SoundItem[]): void;
    getSoundsForCategory(categoryId: string): SoundItem[];
    private updateFavorites;
    getFavorites(): SoundItem[];
    navigateToHome(): void;
    navigateToCategory(categoryId: string): void;
    navigateToFavorites(): void;
    nextPage(): boolean;
    previousPage(): boolean;
    private getCurrentTotalItems;
    getSlotContent(slotIndex: number): SlotContent;
    hasNextPage(): boolean;
    hasPreviousPage(): boolean;
    getCurrentPageInfo(): {
        current: number;
        total: number;
    };
    addPlayingSound(soundId: string, playingSound: PlayingSound): void;
    removePlayingSound(soundId: string): void;
    getPlayingSound(soundId: string): PlayingSound | undefined;
    isPlaying(soundId: string): boolean;
    getAllPlayingSounds(): PlayingSound[];
    clearAllPlayingSounds(): void;
}
export declare const stateManager: StateManager;
export {};
//# sourceMappingURL=state-manager.d.ts.map