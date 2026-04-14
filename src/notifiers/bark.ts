import type { Notifier, NotifyOptions, NotifyResult } from "./types.js";

export class BarkNotifier implements Notifier {
  name = "bark";
  private serverUrl: string;
  private deviceKey: string;

  constructor(serverUrl: string, deviceKey: string) {
    this.serverUrl = serverUrl.replace(/\/$/, "");
    this.deviceKey = deviceKey;
  }

  async send(message: string, options?: NotifyOptions): Promise<NotifyResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(`${this.serverUrl}/${this.deviceKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: options?.title ?? "ai-ding",
          body: message,
          sound: options?.sound ? "alarm" : undefined,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        return { channel: this.name, success: false, message: `HTTP ${res.status}: ${body}` };
      }
      return { channel: this.name, success: true, message: `sent to device ${this.deviceKey.slice(0, 8)}...` };
    } catch (err) {
      return { channel: this.name, success: false, message: err instanceof Error ? err.message : String(err) };
    } finally {
      clearTimeout(timeout);
    }
  }
}
