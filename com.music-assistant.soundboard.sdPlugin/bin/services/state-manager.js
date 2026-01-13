import { SLOTS_PER_PAGE } from "../types.js";
class StateManager {
    globalSettings = {
        rootFolder: "",
        audioDevice: "default",
        globalVolume: 1.0,
    };
    navigation = {
        viewMode: "home",
        currentCategory: null,
        currentPage: 0,
    };
    categories = [];
    sounds = new Map();
    favorites = [];
    playingSounds = new Map();
    listeners = new Set();
    subscribe(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }
    notifyListeners() {
        this.listeners.forEach((cb) => cb());
    }
    getGlobalSettings() {
        return { ...this.globalSettings };
    }
    setGlobalSettings(settings) {
        this.globalSettings = { ...this.globalSettings, ...settings };
        this.notifyListeners();
    }
    getNavigation() {
        return { ...this.navigation };
    }
    setCategories(categories) {
        this.categories = categories;
        this.notifyListeners();
    }
    getCategories() {
        return [...this.categories];
    }
    setSoundsForCategory(categoryId, sounds) {
        this.sounds.set(categoryId, sounds);
        this.updateFavorites();
        this.notifyListeners();
    }
    getSoundsForCategory(categoryId) {
        return this.sounds.get(categoryId) || [];
    }
    updateFavorites() {
        const allFavorites = [];
        this.sounds.forEach((sounds) => {
            sounds.filter((s) => s.favorite).forEach((s) => allFavorites.push(s));
        });
        this.favorites = allFavorites;
    }
    getFavorites() {
        return [...this.favorites];
    }
    navigateToHome() {
        this.navigation = {
            viewMode: "home",
            currentCategory: null,
            currentPage: 0,
        };
        this.notifyListeners();
    }
    navigateToCategory(categoryId) {
        this.navigation = {
            viewMode: "category",
            currentCategory: categoryId,
            currentPage: 0,
        };
        this.notifyListeners();
    }
    navigateToFavorites() {
        this.navigation = {
            viewMode: "favorites",
            currentCategory: null,
            currentPage: 0,
        };
        this.notifyListeners();
    }
    nextPage() {
        const totalItems = this.getCurrentTotalItems();
        const maxPage = Math.max(0, Math.ceil(totalItems / SLOTS_PER_PAGE) - 1);
        if (this.navigation.currentPage < maxPage) {
            this.navigation.currentPage++;
            this.notifyListeners();
            return true;
        }
        return false;
    }
    previousPage() {
        if (this.navigation.currentPage > 0) {
            this.navigation.currentPage--;
            this.notifyListeners();
            return true;
        }
        return false;
    }
    getCurrentTotalItems() {
        const { viewMode, currentCategory } = this.navigation;
        switch (viewMode) {
            case "home":
                return this.categories.length + (this.favorites.length > 0 ? 1 : 0);
            case "category":
                return currentCategory ? this.getSoundsForCategory(currentCategory).length : 0;
            case "favorites":
                return this.favorites.length;
            default:
                return 0;
        }
    }
    getSlotContent(slotIndex) {
        const { viewMode, currentCategory, currentPage } = this.navigation;
        const globalIndex = currentPage * SLOTS_PER_PAGE + slotIndex;
        switch (viewMode) {
            case "home": {
                if (this.favorites.length > 0 && globalIndex === 0) {
                    return { type: "favorite-category" };
                }
                const categoryIndex = this.favorites.length > 0 ? globalIndex - 1 : globalIndex;
                const category = this.categories[categoryIndex];
                if (category) {
                    return { type: "category", item: category };
                }
                return { type: "empty" };
            }
            case "category": {
                const sounds = currentCategory ? this.getSoundsForCategory(currentCategory) : [];
                const sound = sounds[globalIndex];
                if (sound) {
                    return { type: "sound", item: sound };
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
    hasNextPage() {
        const totalItems = this.getCurrentTotalItems();
        const maxPage = Math.max(0, Math.ceil(totalItems / SLOTS_PER_PAGE) - 1);
        return this.navigation.currentPage < maxPage;
    }
    hasPreviousPage() {
        return this.navigation.currentPage > 0;
    }
    getCurrentPageInfo() {
        const totalItems = this.getCurrentTotalItems();
        const totalPages = Math.max(1, Math.ceil(totalItems / SLOTS_PER_PAGE));
        return {
            current: this.navigation.currentPage + 1,
            total: totalPages,
        };
    }
    addPlayingSound(soundId, playingSound) {
        this.playingSounds.set(soundId, playingSound);
        this.notifyListeners();
    }
    removePlayingSound(soundId) {
        this.playingSounds.delete(soundId);
        this.notifyListeners();
    }
    getPlayingSound(soundId) {
        return this.playingSounds.get(soundId);
    }
    isPlaying(soundId) {
        return this.playingSounds.has(soundId);
    }
    getAllPlayingSounds() {
        return Array.from(this.playingSounds.values());
    }
    clearAllPlayingSounds() {
        this.playingSounds.clear();
        this.notifyListeners();
    }
}
export const stateManager = new StateManager();
//# sourceMappingURL=state-manager.js.map