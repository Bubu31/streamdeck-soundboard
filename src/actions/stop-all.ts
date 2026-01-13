import {
  action,
  KeyDownEvent,
  SingletonAction,
  WillAppearEvent,
  WillDisappearEvent,
  KeyAction,
} from "@elgato/streamdeck";
import type { JsonObject } from "@elgato/utils";
import { stateManager } from "../services/state-manager.js";
import { audioPlayer } from "../services/audio-player.js";

interface ActionSubscription {
  unsubscribe: () => void;
  action: KeyAction<JsonObject>;
}

@action({ UUID: "com.music-assistant.soundboard.stop-all" })
export class StopAllAction extends SingletonAction {
  private subscriptions: Map<string, ActionSubscription> = new Map();

  override async onWillAppear(ev: WillAppearEvent<JsonObject>): Promise<void> {
    const actionId = ev.action.id;

    const existing = this.subscriptions.get(actionId);
    if (existing) existing.unsubscribe();

    const keyAction = ev.action as KeyAction<JsonObject>;

    const unsubscribe = stateManager.subscribe(() => {
      this.updateDisplay(actionId);
    });

    this.subscriptions.set(actionId, { unsubscribe, action: keyAction });
    await this.updateDisplay(actionId);
  }

  override async onWillDisappear(ev: WillDisappearEvent<JsonObject>): Promise<void> {
    const subscription = this.subscriptions.get(ev.action.id);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(ev.action.id);
    }
  }

  override async onKeyDown(_ev: KeyDownEvent<JsonObject>): Promise<void> {
    audioPlayer.stopAll();
  }

  private async updateDisplay(actionId: string): Promise<void> {
    const subscription = this.subscriptions.get(actionId);
    if (!subscription) return;

    const { action } = subscription;
    const playingSounds = stateManager.getAllPlayingSounds();
    const hasPlaying = playingSounds.length > 0;

    const svg = this.generateStopIcon(hasPlaying, playingSounds.length);
    await action.setImage(svg);
    await action.setTitle("");
  }

  private generateStopIcon(active: boolean, count: number): string {
    const color = active ? "#d63031" : "#636e72";
    const label = active ? `Stop (${count})` : "Stop";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144"><rect width="144" height="144" fill="#000000"/><rect x="37" y="27" width="70" height="70" fill="${color}"/><text x="72" y="120" font-family="Arial,sans-serif" font-size="18" fill="${color}" text-anchor="middle">${label}</text></svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  }
}
