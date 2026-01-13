import { KeyDownEvent, SingletonAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import type { JsonObject } from "@elgato/utils";
export declare class SlotAction extends SingletonAction {
    private subscriptions;
    onWillAppear(ev: WillAppearEvent<JsonObject>): Promise<void>;
    onWillDisappear(ev: WillDisappearEvent<JsonObject>): Promise<void>;
    onKeyDown(ev: KeyDownEvent<JsonObject>): Promise<void>;
    private updateDisplay;
}
//# sourceMappingURL=slot.d.ts.map