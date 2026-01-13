import type { ChildProcess } from "node:child_process";

export interface TitleStyle {
  show?: boolean;
  color?: string;
  fontSize?: number;
  position?: "top" | "bottom" | "center";
  background?: boolean;
  backgroundColor?: string;
}

export interface SoundMetadata {
  title?: string;
  volume?: number;
  icon?: string;
  favorite?: boolean;
  titleStyle?: TitleStyle;
}

export interface CategoryMetadata {
  displayName?: string;
  icon?: string;
  titleStyle?: TitleStyle;
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
  titleStyle?: TitleStyle;
}

export interface CategoryItem {
  id: string;
  name: string;
  displayName?: string;
  path: string;
  parentPath: string | null;
  iconPath?: string;
  soundCount: number;
  subCategoryCount: number;
  titleStyle?: TitleStyle;
}

export type SlotContent =
  | { type: "category"; item: CategoryItem }
  | { type: "sound"; item: SoundItem }
  | { type: "favorite-category" }
  | { type: "empty" };

export interface FolderBorderStyle {
  enabled?: boolean;
  color?: string;
  opacity?: number;
  size?: number;
}

export type SortOrder = "name-asc" | "name-desc" | "date-asc" | "date-desc";

export interface GlobalSettings {
  rootFolder: string;
  audioDevice: string;
  globalVolume: number;
  defaultTitleStyle?: TitleStyle;
  folderBorder?: FolderBorderStyle;
  sortOrder?: SortOrder;
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

export const SUPPORTED_AUDIO_EXTENSIONS = [".mp3", ".wav", ".ogg", ".flac", ".m4a", ".aac"];
export const SUPPORTED_IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp"];
export const SLOTS_PER_PAGE = 27;
