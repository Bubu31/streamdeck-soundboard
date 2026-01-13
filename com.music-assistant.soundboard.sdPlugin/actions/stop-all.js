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
let StopAllAction = (() => {
    let _classDecorators = [action({ UUID: "com.music-assistant.soundboard.stop-all" })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = SingletonAction;
    var StopAllAction = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            StopAllAction = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        subscriptions = new Map();
        async onWillAppear(ev) {
            const actionId = ev.action.id;
            const existing = this.subscriptions.get(actionId);
            if (existing)
                existing.unsubscribe();
            const keyAction = ev.action;
            const unsubscribe = stateManager.subscribe(() => {
                this.updateDisplay(actionId);
            });
            this.subscriptions.set(actionId, { unsubscribe, action: keyAction });
            await this.updateDisplay(actionId);
        }
        async onWillDisappear(ev) {
            const subscription = this.subscriptions.get(ev.action.id);
            if (subscription) {
                subscription.unsubscribe();
                this.subscriptions.delete(ev.action.id);
            }
        }
        async onKeyDown(_ev) {
            audioPlayer.stopAll();
        }
        async updateDisplay(actionId) {
            const subscription = this.subscriptions.get(actionId);
            if (!subscription)
                return;
            const { action } = subscription;
            const playingSounds = stateManager.getAllPlayingSounds();
            const hasPlaying = playingSounds.length > 0;
            const svg = this.generateStopIcon(hasPlaying, playingSounds.length);
            await action.setImage(svg);
            await action.setTitle("");
        }
        generateStopIcon(active, count) {
            const color = active ? "#d63031" : "#636e72";
            const label = active ? `Stop (${count})` : "Stop";
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144"><rect width="144" height="144" fill="#000000"/><rect x="37" y="27" width="70" height="70" fill="${color}"/><text x="72" y="120" font-family="Arial,sans-serif" font-size="18" fill="${color}" text-anchor="middle">${label}</text></svg>`;
            return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
        }
    };
    return StopAllAction = _classThis;
})();
export { StopAllAction };
//# sourceMappingURL=stop-all.js.map