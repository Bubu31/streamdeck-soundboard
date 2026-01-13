import {
  action,
  KeyDownEvent,
  SingletonAction,
  WillAppearEvent,
  WillDisappearEvent,
  DialRotateEvent,
  DialDownEvent,
  KeyAction,
  DialAction,
} from "@elgato/streamdeck";
import type { JsonObject } from "@elgato/utils";
import { stateManager } from "../services/state-manager.js";
import { audioPlayer } from "../services/audio-player.js";

interface VolumeState {
  unsubscribe: () => void;
  muted: boolean;
  previousVolume: number;
  action: KeyAction<JsonObject> | DialAction<JsonObject>;
}

@action({ UUID: "com.music-assistant.soundboard.volume" })
export class VolumeAction extends SingletonAction {
  private states: Map<string, VolumeState> = new Map();

  override async onWillAppear(ev: WillAppearEvent<JsonObject>): Promise<void> {
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
      muted: (settings.muted as boolean) ?? false,
      previousVolume: (settings.previousVolume as number) ?? 1.0,
      action: ev.action as KeyAction<JsonObject>,
    });

    await this.updateDisplay(actionId);
  }

  override async onWillDisappear(ev: WillDisappearEvent<JsonObject>): Promise<void> {
    const state = this.states.get(ev.action.id);
    if (state) {
      state.unsubscribe();
      this.states.delete(ev.action.id);
    }
  }

  override async onKeyDown(ev: KeyDownEvent<JsonObject>): Promise<void> {
    await this.toggleMute(ev.action.id, ev.action);
  }

  override async onDialDown(ev: DialDownEvent<JsonObject>): Promise<void> {
    await this.toggleMute(ev.action.id, ev.action as unknown as KeyAction<JsonObject>);
  }

  override async onDialRotate(ev: DialRotateEvent<JsonObject>): Promise<void> {
    const state = this.states.get(ev.action.id);
    if (!state) return;

    const delta = ev.payload.ticks * 0.05;
    audioPlayer.adjustGlobalVolume(delta);

    if (state.muted && delta > 0) {
      state.muted = false;
      await ev.action.setSettings({ muted: false, previousVolume: state.previousVolume });
    }
  }

  private async toggleMute(actionId: string, actionRef: KeyAction<JsonObject>): Promise<void> {
    const state = this.states.get(actionId);
    if (!state) return;

    const settings = stateManager.getGlobalSettings();

    if (state.muted) {
      audioPlayer.setGlobalVolume(state.previousVolume);
      state.muted = false;
    } else {
      state.previousVolume = settings.globalVolume;
      audioPlayer.setGlobalVolume(0);
      state.muted = true;
    }

    await actionRef.setSettings({ muted: state.muted, previousVolume: state.previousVolume });
  }

  private async updateDisplay(actionId: string): Promise<void> {
    const state = this.states.get(actionId);
    if (!state) return;

    const { action, muted } = state;
    const settings = stateManager.getGlobalSettings();
    const volumePercent = Math.round(settings.globalVolume * 100);

    const svg = this.generateVolumeIcon(settings.globalVolume, muted, volumePercent);
    await action.setImage(svg);
    await action.setTitle("");
  }

  private generateVolumeIcon(volume: number, muted: boolean, volumePercent: number): string {
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
}
