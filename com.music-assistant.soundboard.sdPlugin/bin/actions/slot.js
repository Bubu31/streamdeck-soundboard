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
import { action, SingletonAction, } from "@elgato/streamdeck";
import { stateManager } from "../services/state-manager.js";
import { audioPlayer } from "../services/audio-player.js";
import { imageToBase64, generateCategoryIcon, generateFavoriteIcon, generateSoundIcon, generateEmptyIcon, } from "../utils/image-converter.js";
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
                    stateManager.navigateToCategory(content.item.id);
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
        async updateDisplay(actionId) {
            const subscription = this.subscriptions.get(actionId);
            if (!subscription)
                return;
            const { action, slotIndex } = subscription;
            const content = stateManager.getSlotContent(slotIndex);
            let image;
            let title = "";
            switch (content.type) {
                case "category": {
                    const cat = content.item;
                    if (cat.iconPath) {
                        image = (await imageToBase64(cat.iconPath)) || generateCategoryIcon(cat.name);
                    }
                    else {
                        image = generateCategoryIcon(cat.name);
                    }
                    title = cat.name;
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
                        image = (await imageToBase64(sound.iconPath)) || generateSoundIcon(sound.title, isPlaying);
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