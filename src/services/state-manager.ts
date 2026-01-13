import type {
  NavigationState,
  GlobalSettings,
  PlayingSound,
  SlotContent,
  CategoryItem,
  SoundItem,
  ViewMode,
} from "../types.js";
import { SLOTS_PER_PAGE } from "../types.js";

type StateChangeCallback = () => void;

class StateManager {
  private globalSettings: GlobalSettings = {
    rootFolder: "",
    audioDevice: "default",
    globalVolume: 1.0,
  };

  private navigation: NavigationState = {
    viewMode: "home",
    currentCategory: null,
    currentPage: 0,
  };

  private categories: CategoryItem[] = [];
  private sounds: Map<string, SoundItem[]> = new Map();
  private favorites: SoundItem[] = [];
  private playingSounds: Map<string, PlayingSound> = new Map();
  private listeners: Set<StateChangeCallback> = new Set();

  subscribe(callback: StateChangeCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach((cb) => cb());
  }

  getGlobalSettings(): GlobalSettings {
    return { ...this.globalSettings };
  }

  setGlobalSettings(settings: Partial<GlobalSettings>): void {
    this.globalSettings = { ...this.globalSettings, ...settings };
    this.notifyListeners();
  }

  getNavigation(): NavigationState {
    return { ...this.navigation };
  }

  setCategories(categories: CategoryItem[]): void {
    this.categories = categories;
    this.notifyListeners();
  }

  getCategories(): CategoryItem[] {
    return [...this.categories];
  }

  getCategoriesForParent(parentPath: string | null): CategoryItem[] {
    return this.categories.filter((c) => c.parentPath === parentPath);
  }

  getCategoryByPath(path: string): CategoryItem | undefined {
    return this.categories.find((c) => c.path === path);
  }

  setSoundsForCategory(categoryPath: string, sounds: SoundItem[]): void {
    this.sounds.set(categoryPath, sounds);
    this.updateFavorites();
    this.notifyListeners();
  }

  getSoundsForCategory(categoryPath: string): SoundItem[] {
    return this.sounds.get(categoryPath) || [];
  }

  private updateFavorites(): void {
    const allFavorites: SoundItem[] = [];
    this.sounds.forEach((sounds) => {
      sounds.filter((s) => s.favorite).forEach((s) => allFavorites.push(s));
    });
    this.favorites = allFavorites;
  }

  getFavorites(): SoundItem[] {
    return [...this.favorites];
  }

  navigateToHome(): void {
    this.navigation = {
      viewMode: "home",
      currentCategory: null,
      currentPage: 0,
    };
    this.notifyListeners();
  }

  navigateToCategory(categoryPath: string): void {
    this.navigation = {
      viewMode: "category",
      currentCategory: categoryPath,
      currentPage: 0,
    };
    this.notifyListeners();
  }

  navigateBack(): void {
    const { currentCategory } = this.navigation;
    if (currentCategory) {
      const category = this.getCategoryByPath(currentCategory);
      if (category?.parentPath) {
        this.navigateToCategory(category.parentPath);
      } else {
        this.navigateToHome();
      }
    } else {
      this.navigateToHome();
    }
  }

  navigateToFavorites(): void {
    this.navigation = {
      viewMode: "favorites",
      currentCategory: null,
      currentPage: 0,
    };
    this.notifyListeners();
  }

  canNavigateBack(): boolean {
    return this.navigation.viewMode !== "home";
  }

  nextPage(): boolean {
    const totalItems = this.getCurrentTotalItems();
    const maxPage = Math.max(0, Math.ceil(totalItems / SLOTS_PER_PAGE) - 1);
    if (this.navigation.currentPage < maxPage) {
      this.navigation.currentPage++;
      this.notifyListeners();
      return true;
    }
    return false;
  }

  previousPage(): boolean {
    if (this.navigation.currentPage > 0) {
      this.navigation.currentPage--;
      this.notifyListeners();
      return true;
    }
    return false;
  }

  private getCurrentTotalItems(): number {
    const { viewMode, currentCategory } = this.navigation;
    switch (viewMode) {
      case "home": {
        const rootCategories = this.getCategoriesForParent(null);
        return rootCategories.length + (this.favorites.length > 0 ? 1 : 0);
      }
      case "category": {
        if (!currentCategory) return 0;
        const subCategories = this.getCategoriesForParent(currentCategory);
        const sounds = this.getSoundsForCategory(currentCategory);
        return subCategories.length + sounds.length;
      }
      case "favorites":
        return this.favorites.length;
      default:
        return 0;
    }
  }

  getSlotContent(slotIndex: number): SlotContent {
    const { viewMode, currentCategory, currentPage } = this.navigation;
    const globalIndex = currentPage * SLOTS_PER_PAGE + slotIndex;

    switch (viewMode) {
      case "home": {
        if (this.favorites.length > 0 && globalIndex === 0) {
          return { type: "favorite-category" };
        }
        const categoryIndex = this.favorites.length > 0 ? globalIndex - 1 : globalIndex;
        const rootCategories = this.getCategoriesForParent(null);
        const category = rootCategories[categoryIndex];
        if (category) {
          return { type: "category", item: category };
        }
        return { type: "empty" };
      }
      case "category": {
        if (!currentCategory) return { type: "empty" };

        // First show subcategories, then sounds
        const subCategories = this.getCategoriesForParent(currentCategory);
        const sounds = this.getSoundsForCategory(currentCategory);

        if (globalIndex < subCategories.length) {
          return { type: "category", item: subCategories[globalIndex] };
        }

        const soundIndex = globalIndex - subCategories.length;
        if (soundIndex < sounds.length) {
          return { type: "sound", item: sounds[soundIndex] };
        }

        return { type: "empty" };
      }
      case "favorites": {
        const sound = this.favorites[globalIndex];
        if (sound) {
          return { type: "sound", item: sound };
        }
        return { type: "empty" };
      }
      default:
        return { type: "empty" };
    }
  }

  hasNextPage(): boolean {
    const totalItems = this.getCurrentTotalItems();
    const maxPage = Math.max(0, Math.ceil(totalItems / SLOTS_PER_PAGE) - 1);
    return this.navigation.currentPage < maxPage;
  }

  hasPreviousPage(): boolean {
    return this.navigation.currentPage > 0;
  }

  getCurrentPageInfo(): { current: number; total: number } {
    const totalItems = this.getCurrentTotalItems();
    const totalPages = Math.max(1, Math.ceil(totalItems / SLOTS_PER_PAGE));
    return {
      current: this.navigation.currentPage + 1,
      total: totalPages,
    };
  }

  addPlayingSound(soundId: string, playingSound: PlayingSound): void {
    this.playingSounds.set(soundId, playingSound);
    this.notifyListeners();
  }

  removePlayingSound(soundId: string): void {
    this.playingSounds.delete(soundId);
    this.notifyListeners();
  }

  getPlayingSound(soundId: string): PlayingSound | undefined {
    return this.playingSounds.get(soundId);
  }

  isPlaying(soundId: string): boolean {
    return this.playingSounds.has(soundId);
  }

  getAllPlayingSounds(): PlayingSound[] {
    return Array.from(this.playingSounds.values());
  }

  clearAllPlayingSounds(): void {
    this.playingSounds.clear();
    this.notifyListeners();
  }
}

export const stateManager = new StateManager();
