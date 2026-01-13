import { KeyDownEvent, SingletonAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import type { JsonObject } from "@elgato/utils";
export declare class NavPrevAction extends SingletonAction {
    private subscriptions;
    onWillAppear(ev: WillAppearEvent<JsonObject>): Promise<void>;
    onWillDisappear(ev: WillDisappearEvent<JsonObject>): Promise<void>;
    onKeyDown(_ev: KeyDownEvent<JsonObject>): Promise<void>;
    private updateDisplay;
    private generatePrevIcon;
}
export declare class NavNextAction extends SingletonAction {
    private subscriptions;
    onWillAppear(ev: WillAppearEvent<JsonObject>): Promise<void>;
    onWillDisappear(ev: WillDisappearEvent<JsonObject>): Promise<void>;
    onKeyDown(_ev: KeyDownEvent<JsonObject>): Promise<void>;
    private updateDisplay;
    private generateNextIcon;
}
//# sourceMappingURL=nav-page.d.ts.map