import { KeyDownEvent, SingletonAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import type { JsonObject } from "@elgato/utils";
export declare class StopAllAction extends SingletonAction {
    private subscriptions;
    onWillAppear(ev: WillAppearEvent<JsonObject>): Promise<void>;
    onWillDisappear(ev: WillDisappearEvent<JsonObject>): Promise<void>;
    onKeyDown(_ev: KeyDownEvent<JsonObject>): Promise<void>;
    private updateDisplay;
    private generateStopIcon;
}
//# sourceMappingURL=stop-all.d.ts.map