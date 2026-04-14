import type { Notifier, NotifyOptions, NotifyResult } from "./types.js";

export class TelegramNotifier implements Notifier {
  name = "telegram";
  private botToken: string;
  private chatId: string;

  constructor(botToken: string, chatId: string) {
    this.botToken = botToken;
    this.chatId = chatId;
  }

  async send(message: string, options?: NotifyOptions): Promise<NotifyResult> {
    const title = options?.title ?? "ai-ding";
    const text = `*${title}*\n${message}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(
        `https://api.telegram.org/bot${this.botToken}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: this.chatId,
            text,
            parse_mode: "Markdown",
          }),
          signal: controller.signal,
        }
      );

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        return { channel: this.name, success: false, message: `HTTP ${res.status}: ${body}` };
      }
      return { channel: this.name, success: true, message: `sent to chat ${this.chatId.slice(0, 4)}...` };
    } catch (err) {
      return { channel: this.name, success: false, message: err instanceof Error ? err.message : String(err) };
    } finally {
      clearTimeout(timeout);
    }
  }
}
