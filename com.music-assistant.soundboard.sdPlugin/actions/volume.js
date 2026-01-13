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
let VolumeAction = (() => {
    let _classDecorators = [action({ UUID: "com.music-assistant.soundboard.volume" })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = SingletonAction;
    var VolumeAction = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            VolumeAction = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        states = new Map();
        async onWillAppear(ev) {
            const actionId = ev.action.id;
            const settings = await ev.action.getSettings();
            // Clean up existing
            const existing = this.states.get(actionId);
            if (existing) {
                existing.unsubscribe();
            }
            const unsubscribe = stateManager.subscribe(() => {
                this.updateDisplay(actionId);
            });
            this.states.set(actionId, {
                unsubscribe,
                muted: settings.muted ?? false,
                previousVolume: settings.previousVolume ?? 1.0,
                action: ev.action,
            });
            await this.updateDisplay(actionId);
        }
        async onWillDisappear(ev) {
            const state = this.states.get(ev.action.id);
            if (state) {
                state.unsubscribe();
                this.states.delete(ev.action.id);
            }
        }
        async onKeyDown(ev) {
            await this.toggleMute(ev.action.id, ev.action);
        }
        async onDialDown(ev) {
            await this.toggleMute(ev.action.id, ev.action);
        }
        async onDialRotate(ev) {
            const state = this.states.get(ev.action.id);
            if (!state)
                return;
            const delta = ev.payload.ticks * 0.05;
            audioPlayer.adjustGlobalVolume(delta);
            if (state.muted && delta > 0) {
                state.muted = false;
                await ev.action.setSettings({ muted: false, previousVolume: state.previousVolume });
            }
        }
        async toggleMute(actionId, actionRef) {
            const state = this.states.get(actionId);
            if (!state)
                return;
            const settings = stateManager.getGlobalSettings();
            if (state.muted) {
                audioPlayer.setGlobalVolume(state.previousVolume);
                state.muted = false;
            }
            else {
                state.previousVolume = settings.globalVolume;
                audioPlayer.setGlobalVolume(0);
                state.muted = true;
            }
            await actionRef.setSettings({ muted: state.muted, previousVolume: state.previousVolume });
        }
        async updateDisplay(actionId) {
            const state = this.states.get(actionId);
            if (!state)
                return;
            const { action, muted } = state;
            const settings = stateManager.getGlobalSettings();
            const volumePercent = Math.round(settings.globalVolume * 100);
            const svg = this.generateVolumeIcon(settings.globalVolume, muted, volumePercent);
            await action.setImage(svg);
            await action.setTitle("");
        }
        generateVolumeIcon(volume, muted, volumePercent) {
            const color = muted ? "#e17055" : "#00cec9";
            const level = muted ? 0 : volume;
            const label = muted ? "Muted" : `${volumePercent}%`;
            const bars = [
                { x: 30, height: 25, threshold: 0 },
                { x: 50, height: 40, threshold: 0.25 },
                { x: 70, height: 55, threshold: 0.5 },
                { x: 90, height: 70, threshold: 0.75 },
            ];
            const barsHtml = bars
                .map((bar) => {
                const active = level > bar.threshold;
                const fillColor = active ? color : "#636e72";
                const y = 90 - bar.height;
                return `<rect x="${bar.x}" y="${y}" width="18" height="${bar.height}" fill="${fillColor}"/>`;
            })
                .join("");
            const muteLine = muted ? '<line x1="25" y1="15" x2="119" y2="109" stroke="#e17055" stroke-width="6" stroke-linecap="round"/>' : "";
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144"><rect width="144" height="144" fill="#000000"/>${barsHtml}${muteLine}<text x="72" y="125" font-family="Arial,sans-serif" font-size="18" fill="${color}" text-anchor="middle">${label}</text></svg>`;
            return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
        }
    };
    return VolumeAction = _classThis;
})();
export { VolumeAction };
//# sourceMappingURL=volume.js.map