import { exec } from "node:child_process";
import { promisify } from "node:util";
import { existsSync } from "node:fs";
import type { Notifier, NotifyOptions } from "./types.js";

const execAsync = promisify(exec);

const SOUND_FILES = [
  "/usr/share/sounds/freedesktop/stereo/complete.oga",
  "/usr/share/sounds/freedesktop/stereo/bell.oga",
  "/usr/share/sounds/freedesktop/stereo/message.oga",
];

export class SoundNotifier implements Notifier {
  name = "sound";
  private _execAsync: (cmd: string, opts?: { timeout?: number }) => Promise<{ stdout: string; stderr: string }>;

  constructor(execFn?: (cmd: string, opts?: { timeout?: number }) => Promise<{ stdout: string; stderr: string }>) {
    this._execAsync = execFn ?? ((cmd, opts) => execAsync(cmd, opts));
  }

  async send(_message: string, _options?: NotifyOptions): Promise<void> {
    // 1. Terminal bell — works over SSH if terminal supports it
    process.stdout.write("\x07");

    // 2. Try to play an audio file on the server (audible if on local desktop)
    await this.playSound();
  }

  private async playSound(): Promise<void> {
    const soundFile = SOUND_FILES.find((f) => existsSync(f));
    if (!soundFile) return;

    try {
      if (soundFile.endsWith(".oga")) {
        await this._execAsync(`paplay "${soundFile}"`, { timeout: 3000 });
      } else {
        await this._execAsync(`aplay "${soundFile}"`, { timeout: 3000 });
      }
    } catch {
      // Audio playback failed silently (no sound device, PulseAudio not running, etc.)
    }
  }
}
