import { KeyDownEvent, SingletonAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import type { JsonObject } from "@elgato/utils";
export declare class NavBackAction extends SingletonAction {
    private subscriptions;
    onWillAppear(ev: WillAppearEvent<JsonObject>): Promise<void>;
    onWillDisappear(ev: WillDisappearEvent<JsonObject>): Promise<void>;
    onKeyDown(_ev: KeyDownEvent<JsonObject>): Promise<void>;
    private updateDisplay;
    private generateBackIcon;
}
//# sourceMappingURL=nav-back.d.ts.map