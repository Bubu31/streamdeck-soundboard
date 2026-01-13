import type { SoundItem } from "../types.js";
export interface AudioDevice {
    id: string;
    name: string;
}
declare class AudioPlayer {
    private ffplayPath;
    listDevices(): Promise<AudioDevice[]>;
    play(sound: SoundItem): Promise<void>;
    private buildFFplayArgs;
    stop(soundId: string): void;
    stopAll(): void;
    private killProcess;
    setGlobalVolume(volume: number): void;
    adjustGlobalVolume(delta: number): number;
}
export declare const audioPlayer: AudioPlayer;
export {};
//# sourceMappingURL=audio-player.d.ts.map