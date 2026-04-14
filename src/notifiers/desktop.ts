import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { Notifier, NotifyOptions, NotifyResult } from "./types.js";

const execFileAsync = promisify(execFile);

export class DesktopNotifier implements Notifier {
  name = "desktop";
  private execFileAsync: (file: string, args: string[]) => Promise<{ stdout: string; stderr: string }>;

  constructor(execFileFn?: (file: string, args: string[]) => Promise<{ stdout: string; stderr: string }>) {
    this.execFileAsync = execFileFn ?? execFileAsync;
  }

  async send(message: string, options?: NotifyOptions): Promise<NotifyResult> {
    const title = options?.title ?? "ai-ding";

    try {
      if (process.platform === "darwin") {
        await this.execFileAsync("osascript", [
          "-e",
          `display notification "${escapeAppleScript(message)}" with title "${escapeAppleScript(title)}"`,
        ]);
      } else {
        const urgency = options?.urgency ?? "normal";
        await this.execFileAsync("notify-send", [`-u`, urgency, title, message]);
      }
      return { channel: this.name, success: true, message: "desktop notification sent" };
    } catch (err) {
      return { channel: this.name, success: false, message: err instanceof Error ? err.message : String(err) };
    }
  }
}

function escapeAppleScript(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
