import type { ChildProcess } from "node:child_process";
export interface SoundMetadata {
    title?: string;
    volume?: number;
    icon?: string;
    favorite?: boolean;
}
export interface SoundItem {
    id: string;
    path: string;
    filename: string;
    title: string;
    volume: number;
    iconPath?: string;
    favorite: boolean;
    category: string;
}
export interface CategoryItem {
    id: string;
    name: string;
    path: string;
    iconPath?: string;
    soundCount: number;
}
export type SlotContent = {
    type: "category";
    item: CategoryItem;
} | {
    type: "sound";
    item: SoundItem;
} | {
    type: "favorite-category";
} | {
    type: "empty";
};
export interface GlobalSettings {
    rootFolder: string;
    audioDevice: string;
    globalVolume: number;
    [key: string]: unknown;
}
export interface SlotSettings {
    slotIndex: number;
    [key: string]: unknown;
}
export interface VolumeSettings {
    muted?: boolean;
    previousVolume?: number;
    [key: string]: unknown;
}
export interface PlayingSound {
    soundId: string;
    process: ChildProcess;
    startedAt: number;
}
export type ViewMode = "home" | "category" | "favorites";
export interface NavigationState {
    viewMode: ViewMode;
    currentCategory: string | null;
    currentPage: number;
}
export declare const SUPPORTED_AUDIO_EXTENSIONS: string[];
export declare const SUPPORTED_IMAGE_EXTENSIONS: string[];
export declare const SLOTS_PER_PAGE = 27;
//# sourceMappingURL=types.d.ts.map