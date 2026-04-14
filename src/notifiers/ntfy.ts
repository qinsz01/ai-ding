import type { Notifier, NotifyOptions, NotifyResult } from "./types.js";

export class NtfyNotifier implements Notifier {
  name = "ntfy";
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  async send(message: string, options?: NotifyOptions): Promise<NotifyResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(this.url, {
        method: "POST",
        headers: {
          Title: options?.title ?? "ai-ding",
          Priority: options?.urgency === "critical" ? "urgent" : "default",
        },
        body: message,
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        return { channel: this.name, success: false, message: `HTTP ${res.status}: ${body}` };
      }
      return { channel: this.name, success: true, message: `sent to ${this.url}` };
    } catch (err) {
      return { channel: this.name, success: false, message: err instanceof Error ? err.message : String(err) };
    } finally {
      clearTimeout(timeout);
    }
  }
}
