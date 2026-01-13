import { KeyDownEvent, SingletonAction, WillAppearEvent, WillDisappearEvent, PropertyInspectorDidAppearEvent, SendToPluginEvent } from "@elgato/streamdeck";
import type { JsonObject, JsonValue } from "@elgato/utils";
export declare class SlotAction extends SingletonAction {
    private subscriptions;
    onWillAppear(ev: WillAppearEvent<JsonObject>): Promise<void>;
    onWillDisappear(ev: WillDisappearEvent<JsonObject>): Promise<void>;
    onKeyDown(ev: KeyDownEvent<JsonObject>): Promise<void>;
    onPropertyInspectorDidAppear(ev: PropertyInspectorDidAppearEvent<JsonObject>): Promise<void>;
    onSendToPlugin(ev: SendToPluginEvent<JsonValue, JsonObject>): Promise<void>;
    private deleteSound;
    private sendAudioDevicesToPI;
    private sendSlotInfoToPI;
    private setCustomTitle;
    private setTitleStyle;
    private setSoundVolume;
    private importSoundFromUrl;
    private setCustomIcon;
    private setCustomIconFromUrl;
    private updateDisplay;
}
//# sourceMappingURL=slot.d.ts.map