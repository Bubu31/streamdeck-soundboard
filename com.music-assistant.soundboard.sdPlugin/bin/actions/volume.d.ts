import { KeyDownEvent, SingletonAction, WillAppearEvent, WillDisappearEvent, DialRotateEvent, DialDownEvent } from "@elgato/streamdeck";
import type { JsonObject } from "@elgato/utils";
export declare class VolumeAction extends SingletonAction {
    private states;
    onWillAppear(ev: WillAppearEvent<JsonObject>): Promise<void>;
    onWillDisappear(ev: WillDisappearEvent<JsonObject>): Promise<void>;
    onKeyDown(ev: KeyDownEvent<JsonObject>): Promise<void>;
    onDialDown(ev: DialDownEvent<JsonObject>): Promise<void>;
    onDialRotate(ev: DialRotateEvent<JsonObject>): Promise<void>;
    private toggleMute;
    private updateDisplay;
    private generateVolumeIcon;
}
//# sourceMappingURL=volume.d.ts.map