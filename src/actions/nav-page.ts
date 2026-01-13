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

interface ActionSubscription {
  unsubscribe: () => void;
  action: KeyAction<JsonObject>;
}

@action({ UUID: "com.music-assistant.soundboard.nav-prev" })
export class NavPrevAction extends SingletonAction {
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
    stateManager.previousPage();
  }

  private async updateDisplay(actionId: string): Promise<void> {
    const subscription = this.subscriptions.get(actionId);
    if (!subscription) return;

    const { action } = subscription;
    const hasPrev = stateManager.hasPreviousPage();
    const pageInfo = stateManager.getCurrentPageInfo();

    const svg = this.generatePrevIcon(hasPrev, pageInfo);
    await action.setImage(svg);
    await action.setTitle("");
  }

  private generatePrevIcon(enabled: boolean, pageInfo: { current: number; total: number }): string {
    const color = enabled ? "#74b9ff" : "#636e72";
    const label = enabled ? `${pageInfo.current}/${pageInfo.total}` : "";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144"><rect width="144" height="144" fill="#000000"/><path d="M90 62H54M54 62L75 41M54 62L75 83" stroke="${color}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/><text x="72" y="120" font-family="Arial,sans-serif" font-size="18" fill="${color}" text-anchor="middle">${label}</text></svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  }
}

@action({ UUID: "com.music-assistant.soundboard.nav-next" })
export class NavNextAction extends SingletonAction {
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
    stateManager.nextPage();
  }

  private async updateDisplay(actionId: string): Promise<void> {
    const subscription = this.subscriptions.get(actionId);
    if (!subscription) return;

    const { action } = subscription;
    const hasNext = stateManager.hasNextPage();
    const pageInfo = stateManager.getCurrentPageInfo();

    const svg = this.generateNextIcon(hasNext, pageInfo);
    await action.setImage(svg);
    await action.setTitle("");
  }

  private generateNextIcon(enabled: boolean, pageInfo: { current: number; total: number }): string {
    const color = enabled ? "#74b9ff" : "#636e72";
    const label = enabled ? `${pageInfo.current}/${pageInfo.total}` : "";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144"><rect width="144" height="144" fill="#000000"/><path d="M54 62H90M90 62L69 41M90 62L69 83" stroke="${color}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/><text x="72" y="120" font-family="Arial,sans-serif" font-size="18" fill="${color}" text-anchor="middle">${label}</text></svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  }
}
