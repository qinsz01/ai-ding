import type { Notifier, NotifyOptions, NotifyResult } from "./types.js";

export class ServerChanNotifier implements Notifier {
  name = "serverchan";
  private sendkey: string;

  constructor(sendkey: string) {
    this.sendkey = sendkey;
  }

  async send(message: string, options?: NotifyOptions): Promise<NotifyResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(`https://sctapi.ftqq.com/${this.sendkey}.send`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          title: options?.title ?? "ai-ding",
          desp: message,
        }).toString(),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        return { channel: this.name, success: false, message: `HTTP ${res.status}: ${body}` };
      }
      return { channel: this.name, success: true, message: `sent via ServerChan` };
    } catch (err) {
      return { channel: this.name, success: false, message: err instanceof Error ? err.message : String(err) };
    } finally {
      clearTimeout(timeout);
    }
  }
}
