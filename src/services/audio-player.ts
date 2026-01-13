import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import type { PlayingSound, SoundItem } from "../types.js";
import { stateManager } from "./state-manager.js";

export interface AudioDevice {
  id: string;
  name: string;
}

class AudioPlayer {
  private ffplayPath: string = "ffplay";

  async listDevices(): Promise<AudioDevice[]> {
    const devices: AudioDevice[] = [{ id: "default", name: "Peripherique par defaut" }];

    try {
      if (process.platform === "win32") {
        // Use PowerShell to list Windows sound devices (all active ones)
        const result = spawnSync("powershell.exe", [
          "-NoProfile",
          "-Command",
          "(Get-CimInstance -Namespace root/cimv2 -ClassName Win32_SoundDevice).Name"
        ], {
          encoding: "utf-8",
          timeout: 5000,
        });

        const output = result.stdout || "";
        const deviceNames = output.split('\n').filter(n => n.trim());

        for (const name of deviceNames) {
          const trimmedName = name.trim();
          if (trimmedName) {
            devices.push({ id: trimmedName, name: trimmedName });
          }
        }
      } else if (process.platform === "darwin") {
        const result = spawnSync("ffmpeg", ["-f", "avfoundation", "-list_devices", "true", "-i", ""], {
          encoding: "utf-8",
          timeout: 5000,
        });

        const output = result.stderr || "";
        const matches = output.matchAll(/\[(\d+)\]\s+(.+)/g);
        for (const match of matches) {
          if (match[2] && !match[2].includes("Capture")) {
            devices.push({ id: match[1], name: match[2].trim() });
          }
        }
      }
    } catch (error) {
      console.error("Error listing audio devices:", error);
    }

    return devices;
  }

  async play(sound: SoundItem): Promise<void> {
    if (stateManager.isPlaying(sound.id)) {
      this.stop(sound.id);
      return;
    }

    const settings = stateManager.getGlobalSettings();
    const effectiveVolume = sound.volume * settings.globalVolume;

    const args = this.buildFFplayArgs(sound.path, effectiveVolume, settings.audioDevice);

    const childProcess = spawn(this.ffplayPath, args, {
      stdio: ["ignore", "ignore", "ignore"],
      detached: false,
    });

    const playingSound: PlayingSound = {
      soundId: sound.id,
      process: childProcess,
      startedAt: Date.now(),
    };

    stateManager.addPlayingSound(sound.id, playingSound);

    childProcess.on("exit", () => {
      stateManager.removePlayingSound(sound.id);
    });

    childProcess.on("error", (error) => {
      console.error(`Error playing sound ${sound.id}:`, error);
      stateManager.removePlayingSound(sound.id);
    });
  }

  private buildFFplayArgs(soundPath: string, volume: number, deviceId: string): string[] {
    const args = [
      "-nodisp",
      "-autoexit",
      "-loglevel", "quiet",
      "-volume", Math.round(volume * 100).toString(),
    ];

    if (deviceId !== "default" && process.platform === "win32") {
      args.push("-audio_device_name", deviceId);
    }

    args.push(soundPath);
    return args;
  }

  stop(soundId: string): void {
    const playingSound = stateManager.getPlayingSound(soundId);
    if (playingSound) {
      this.killProcess(playingSound.process);
      stateManager.removePlayingSound(soundId);
    }
  }

  stopAll(): void {
    const playingSounds = stateManager.getAllPlayingSounds();
    for (const ps of playingSounds) {
      this.killProcess(ps.process);
    }
    stateManager.clearAllPlayingSounds();
  }

  private killProcess(childProcess: ChildProcess): void {
    try {
      if (childProcess.pid) {
        if (process.platform === "win32") {
          spawn("taskkill", ["/pid", childProcess.pid.toString(), "/f", "/t"], {
            stdio: "ignore",
          });
        } else {
          childProcess.kill("SIGKILL");
        }
      }
    } catch (error) {
      console.error("Error killing process:", error);
    }
  }

  setGlobalVolume(volume: number): void {
    stateManager.setGlobalSettings({ globalVolume: Math.max(0, Math.min(1, volume)) });
  }

  adjustGlobalVolume(delta: number): number {
    const settings = stateManager.getGlobalSettings();
    const newVolume = Math.max(0, Math.min(1, settings.globalVolume + delta));
    stateManager.setGlobalSettings({ globalVolume: newVolume });
    return newVolume;
  }
}

export const audioPlayer = new AudioPlayer();
