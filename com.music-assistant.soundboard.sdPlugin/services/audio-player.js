import { spawn, spawnSync } from "node:child_process";
import { stateManager } from "./state-manager.js";
class AudioPlayer {
    ffplayPath = "ffplay";
    async listDevices() {
        const devices = [{ id: "default", name: "Peripherique par defaut" }];
        try {
            if (process.platform === "win32") {
                // Enumerate all active WASAPI audio render endpoints via PnP device manager.
                // Win32_SoundDevice only lists WDM hardware devices and misses virtual endpoints
                // (e.g. Elgato Wave Link channels: SFX, Music, Game, etc.)
                // Render endpoints have InstanceId matching {0.0.0.* (vs capture = {0.0.1.*)
                const psCmd = "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; " +
                    "Get-PnpDevice -Class AudioEndpoint -Status OK | " +
                    "Where-Object { $_.InstanceId -like '*{0.0.0.*' } | " +
                    "Select-Object -ExpandProperty FriendlyName";
                const result = spawnSync("powershell.exe", [
                    "-NoProfile",
                    "-Command",
                    psCmd,
                ], {
                    encoding: "utf-8",
                    timeout: 10000,
                });
                const output = result.stdout || "";
                const deviceNames = output.split('\n').filter(n => n.trim());
                for (const name of deviceNames) {
                    const trimmedName = name.trim();
                    if (trimmedName) {
                        devices.push({ id: trimmedName, name: trimmedName });
                    }
                }
            }
            else if (process.platform === "darwin") {
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
        }
        catch (error) {
            console.error("Error listing audio devices:", error);
        }
        return devices;
    }
    async play(sound) {
        if (stateManager.isPlaying(sound.id)) {
            this.stop(sound.id);
            return;
        }
        const settings = stateManager.getGlobalSettings();
        const effectiveVolume = sound.volume * settings.globalVolume;
        const deviceId = settings.audioDevice;
        let childProcess;
        if (deviceId !== "default" && process.platform === "win32") {
            // ffplay does not support audio device selection in this build.
            // Use PowerShell + WinRT Windows.Media.Playback.MediaPlayer instead,
            // which supports WASAPI endpoint selection (e.g. Elgato Wave Link channels).
            const args = this.buildPowerShellWinRTArgs(sound.path, effectiveVolume, deviceId);
            childProcess = spawn("powershell.exe", args, {
                stdio: ["ignore", "ignore", "ignore"],
                detached: false,
            });
        }
        else {
            const args = this.buildFFplayArgs(sound.path, effectiveVolume);
            childProcess = spawn(this.ffplayPath, args, {
                stdio: ["ignore", "ignore", "ignore"],
                detached: false,
            });
        }
        const playingSound = {
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
    buildFFplayArgs(soundPath, volume) {
        return [
            "-nodisp",
            "-autoexit",
            "-loglevel", "quiet",
            "-volume", Math.round(volume * 100).toString(),
            soundPath,
        ];
    }
    buildPowerShellWinRTArgs(soundPath, volume, deviceName) {
        // Escape single quotes for PowerShell single-quoted strings
        const escapedDevice = deviceName.replace(/'/g, "''");
        const escapedPath = soundPath.replace(/\\/g, "/").replace(/'/g, "''");
        const vol = Math.min(1, Math.max(0, volume)).toFixed(4);
        const script = [
            "Add-Type -AssemblyName System.Runtime.InteropServices.WindowsRuntime",
            "$null = [Windows.Media.Playback.MediaPlayer, Windows, ContentType=WindowsRuntime]",
            "$null = [Windows.Devices.Enumeration.DeviceInformation, Windows, ContentType=WindowsRuntime]",
            "$null = [Windows.Media.Core.MediaSource, Windows, ContentType=WindowsRuntime]",
            "$null = [Windows.Media.Devices.MediaDevice, Windows, ContentType=WindowsRuntime]",
            "function WA($op,$t){$m=[System.WindowsRuntimeSystemExtensions].GetMethods()|?{$_.Name -eq 'AsTask'-and $_.IsGenericMethod}|select -First 1;$x=$m.MakeGenericMethod($t).Invoke($null,@($op));$x.Wait()|Out-Null;$x.Result}",
            "$sel=[Windows.Media.Devices.MediaDevice]::GetAudioRenderSelector()",
            "$devs=WA ([Windows.Devices.Enumeration.DeviceInformation]::FindAllAsync($sel)) ([Windows.Devices.Enumeration.DeviceInformationCollection])",
            `$dev=$devs|?{$_.Name -eq '${escapedDevice}'}|select -First 1`,
            "if(-not $dev){exit 1}",
            "$p=[Windows.Media.Playback.MediaPlayer]::new()",
            `$p.Volume=${vol}`,
            "$p.AudioDevice=$dev",
            `$p.Source=[Windows.Media.Core.MediaSource]::CreateFromUri([Uri]::new('file:///${escapedPath}'))`,
            "$p.Play()",
            // Wait for playback to start (state leaves 0=None), max 5s
            "$w=0;while($w -lt 100 -and $p.PlaybackSession.PlaybackState -eq 0){Start-Sleep -ms 50;$w++}",
            // Wait for playback to finish: exit when state=None/Failed, OR position reached end of duration
            "$e=0;while($e -lt 36000){$st=$p.PlaybackSession.PlaybackState;if($st -eq 0 -or $st -eq 5){break};$dur=$p.PlaybackSession.NaturalDuration.TotalMilliseconds;$pos=$p.PlaybackSession.Position.TotalMilliseconds;if($dur -gt 0 -and $pos -ge $dur-300){Start-Sleep -ms 400;break};Start-Sleep -ms 100;$e++}",
            "$p.Dispose()",
        ].join("; ");
        return ["-NoProfile", "-NonInteractive", "-Command", script];
    }
    stop(soundId) {
        const playingSound = stateManager.getPlayingSound(soundId);
        if (playingSound) {
            this.killProcess(playingSound.process);
            stateManager.removePlayingSound(soundId);
        }
    }
    stopAll() {
        const playingSounds = stateManager.getAllPlayingSounds();
        for (const ps of playingSounds) {
            this.killProcess(ps.process);
        }
        stateManager.clearAllPlayingSounds();
    }
    killProcess(childProcess) {
        try {
            if (childProcess.pid) {
                if (process.platform === "win32") {
                    spawn("taskkill", ["/pid", childProcess.pid.toString(), "/f", "/t"], {
                        stdio: "ignore",
                    });
                }
                else {
                    childProcess.kill("SIGKILL");
                }
            }
        }
        catch (error) {
            console.error("Error killing process:", error);
        }
    }
    setGlobalVolume(volume) {
        stateManager.setGlobalSettings({ globalVolume: Math.max(0, Math.min(1, volume)) });
    }
    adjustGlobalVolume(delta) {
        const settings = stateManager.getGlobalSettings();
        const newVolume = Math.max(0, Math.min(1, settings.globalVolume + delta));
        stateManager.setGlobalSettings({ globalVolume: newVolume });
        return newVolume;
    }
}
export const audioPlayer = new AudioPlayer();
//# sourceMappingURL=audio-player.js.map